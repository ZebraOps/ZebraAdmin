import { useState, useEffect, useRef } from 'react';
import {
  ProFormText, ProFormTextArea, ProFormSwitch, ProFormSelect,
  ProTable, type ProColumns,
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Select, Space, Tooltip, Modal } from 'antd';
import { isHandledError } from '@/service/request';
import {
  ApiOutlined, ContainerOutlined, ReloadOutlined, CodeOutlined,
} from '@ant-design/icons';
import PublishCRUDPage from '@/components/PublishCRUDPage';
import * as api from '@/service/api/publish/k8s-cluster';
import type { K8sCluster, PodInfo } from '@/service/api/publish/k8s-cluster';
import { usePublishStore } from '@/store/publish';
import { localStg } from '@/utils/storage';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function PublishContainerK8s() {
  const publishStore = usePublishStore();

  // Load dropdown data from shared store
  useEffect(() => { publishStore.loadAll(); }, []);

  // 连接测试状态
  const [testingId, setTestingId] = useState<number | null>(null);

  // Pod 抽屉状态
  const [podDrawerOpen, setPodDrawerOpen] = useState(false);
  const [podCluster, setPodCluster] = useState<K8sCluster | null>(null);
  const [pods, setPods] = useState<PodInfo[]>([]);
  const [podsLoading, setPodsLoading] = useState(false);
  const [namespace, setNamespace] = useState<string>('default');
  const [namespaceOptions, setNamespaceOptions] = useState<{ label: string; value: string }[]>([]);
  const [nsLoading, setNsLoading] = useState(false);

  // Pod 终端状态
  const [termOpen, setTermOpen] = useState(false);
  const [termPod, setTermPod] = useState<PodInfo | null>(null);
  // 容器选择：多容器 Pod 需要用户选择目标容器
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [containerSelectOpen, setContainerSelectOpen] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const wsBaseURL = (import.meta.env.VITE_BASE_URL || '').trim().replace(/^http/, 'ws').replace(/\/$/, '');

  const loadNamespaces = async (clusterId: number) => {
    setNsLoading(true);
    try {
      const nsList = await api.listK8sNamespaces(clusterId);
      const opts = (Array.isArray(nsList) ? nsList : []).map((ns: string) => ({ label: ns, value: ns }));
      setNamespaceOptions(opts);
    } catch {
      setNamespaceOptions([]);
    } finally {
      setNsLoading(false);
    }
  };

  const loadPods = async (cluster: K8sCluster, ns?: string) => {
    setPodsLoading(true);
    try {
      const list = await api.listK8sPods(cluster.id, ns ?? namespace);
      setPods(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '获取 Pod 列表失败');
      setPods([]);
    } finally {
      setPodsLoading(false);
    }
  };

  const handleViewPods = async (row: K8sCluster) => {
    setPodCluster(row);
    setNamespace(row.namespace || 'default');
    setPodDrawerOpen(true);
    loadNamespaces(row.id);
    await loadPods(row, row.namespace || 'default');
  };

  const handleTestConnection = async (row: K8sCluster) => {
    setTestingId(row.id);
    try {
      const res = await api.testK8sConnection(row.id);
      message.success((res as any)?.message || '连接成功');
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

  // Pod 终端相关
  const openTerminal = (pod: PodInfo) => {
    // 单容器 Pod：直接打开终端
    // 多容器 Pod：先让用户选择容器
    if (!pod.containers || pod.containers.length <= 1) {
      setSelectedContainer(pod.containers?.[0] ?? '');
      setTermPod(pod);
      setTermOpen(true);
    } else {
      setTermPod(pod);
      setSelectedContainer(pod.containers[0]);
      setContainerSelectOpen(true);
    }
  };

  const closeTerminal = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (xtermRef.current) { xtermRef.current.dispose(); xtermRef.current = null; fitAddonRef.current = null; }
    setTermOpen(false);
    setTermPod(null);
    setSelectedContainer('');
  };

  // 终端初始化 + WebSocket 连接（合并为一个 useEffect，消除竞态）
  useEffect(() => {
    if (!termOpen || !termPod || !podCluster || !termRef.current) return;

    // 1. 初始化 xterm
    const term = new Terminal({
      theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#14b8a6', cursorAccent: '#1e1e1e' },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 14,
      cursorBlink: true,
      disableStdin: false,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 显示连接状态提示，避免黑屏
    term.writeln('\x1b[90m正在连接 Pod 终端...\x1b[0m');

    // 2. 等待 Modal 动画结束 + xterm DOM 就绪后再 fit + 连接 WebSocket
    const fitTimer = setTimeout(() => {
      fitAddon.fit();
      term.focus();
    }, 150);

    // 3. 建立 WebSocket 连接（在 xterm 初始化后）
    const wsTimer = setTimeout(() => {
      const token = localStg.get<string>('token') || '';
      const ns = termPod.namespace || 'default';
      const containerParam = selectedContainer ? `&container=${encodeURIComponent(selectedContainer)}` : '';
      const url = `${wsBaseURL}/cicd/api/k8s/clusters/${podCluster.id}/pods/${encodeURIComponent(termPod.name)}/exec?namespace=${encodeURIComponent(ns)}&token=${token}${containerParam}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        term.clear(); // 清除 "正在连接..." 提示
        term.focus();
        message.success('Pod 终端已连接');
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // BinaryMessage：解码为字符串后写入 xterm
          term.write(new TextDecoder().decode(event.data));
        } else if (typeof event.data === 'string') {
          term.write(event.data);
        }
      };

      const disposeOnData = term.onData((data: string) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(data);
      });

      ws.onerror = () => {
        term.writeln('\x1b[31m连接失败，请检查网络或 Pod 状态\x1b[0m');
        message.error('Pod 终端连接失败');
      };
      ws.onclose = (event) => {
        wsRef.current = null;
        disposeOnData?.dispose();
        if (!event.wasClean) {
          term.writeln('\x1b[31m连接异常断开\x1b[0m');
        }
      };
    }, 250); // 比 fitTimer 多 100ms，确保 xterm DOM 已就绪

    // 清理
    return () => {
      clearTimeout(fitTimer);
      clearTimeout(wsTimer);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      // xterm 在 closeTerminal 中 dispose，这里不重复 dispose
    };
  }, [termOpen, termPod, podCluster, wsBaseURL, selectedContainer]);

  const columns: ProColumns<K8sCluster>[] = [
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: 'API Server', dataIndex: 'api_server', ellipsis: true, search: false },
    { title: '命名空间', dataIndex: 'namespace', width: 90, search: false },
    {
      title: '云厂商', dataIndex: 'vendor', width: 90,
      valueType: 'select',
      valueEnum: (publishStore.vendorOptions || []).reduce((acc, o) => {
        acc[o.value as string] = { text: o.label };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: '所属环境', dataIndex: 'environment', width: 90,
      valueType: 'select',
      valueEnum: (publishStore.envOptions || []).reduce((acc, o) => {
        acc[o.value as string] = { text: o.label };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: '状态', dataIndex: 'enabled', width: 80,
      valueType: 'select',
      valueEnum: { 'true': { text: '启用' }, 'false': { text: '停用' } },
      render: (_, row) => <Tag color={row.enabled ? 'success' : 'default'}>{row.enabled ? '启用' : '停用'}</Tag>
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
  ];

  const podColumns: ProColumns<PodInfo>[] = [
    { title: 'Pod 名称', dataIndex: 'name', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (val) => {
        const s = String(val ?? '');
        const color = s === 'Running' ? 'success' : s === 'Pending' ? 'warning' : s === 'Failed' ? 'error' : 'default';
        return <Tag color={color}>{s || '-'}</Tag>;
      }
    },
    { title: '命名空间', dataIndex: 'namespace', width: 100 },
    { title: '节点', dataIndex: 'node_name', ellipsis: true },
    { title: '启动时间', dataIndex: 'start_time', valueType: 'dateTime', width: 150 },
    {
      title: '操作', key: 'actions', width: 80, fixed: 'right',
      render: (_, record) => (
        <Tooltip title="进入 Pod 终端">
          <Button type="link" size="small" icon={<CodeOutlined />}
            onClick={() => openTerminal(record)}>终端</Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PublishCRUDPage<K8sCluster>
        rowKey="id"
        title="K8s 集群"
        columns={columns}
        fetchList={async (params) => {
          const res = await api.fetchK8sClusters(params) as any;
          return { data: res?.records ?? [], total: res?.total ?? 0 };
        }}
        createItem={api.createK8sCluster as any}
        updateItem={api.updateK8sCluster as any}
        deleteItem={api.deleteK8sCluster}
        addPerm="publish_k8s_add"
        editPerm="publish_k8s_edit"
        deletePerm="publish_k8s_delete"
        actionColumnWidth={260}
        extraActionRender={(row) => [
          <Tooltip key="test" title="测试连接">
            <Button
              type="link" size="small" icon={<ApiOutlined />}
              loading={testingId === row.id}
              onClick={() => handleTestConnection(row)}
            >测试</Button>
          </Tooltip>,
          <Button
            key="pods" type="link" size="small" icon={<ContainerOutlined />}
            onClick={() => handleViewPods(row)}
          >Pods</Button>,
        ]}
        formFields={
          <>
            <ProFormText name="name" label="集群名称" rules={[{ required: true }]} placeholder="请输入集群名称" />
            <ProFormText name="api_server" label="API Server 地址" rules={[{ required: true }]} placeholder="https://k8s-api:6443" />
            <ProFormText name="namespace" label="默认命名空间" placeholder="default" />
            <ProFormText.Password name="token" label="认证 Token" placeholder="Bearer Token (K8s 1.24+)" />
            <ProFormTextArea name="ca_cert" label="CA 证书" fieldProps={{ rows: 4, placeholder: '-----BEGIN CERTIFICATE-----\n...' }} />
            <ProFormTextArea name="client_cert" label="客户端证书" fieldProps={{ rows: 4, placeholder: '-----BEGIN CERTIFICATE-----\n...' }} />
            <ProFormTextArea name="client_key" label="客户端私钥" fieldProps={{ rows: 4, placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...' }} />
            <ProFormSwitch name="skip_verify" label="跳过证书验证" />
            <ProFormSelect name="vendor" label="云厂商" placeholder="请选择云厂商"
              options={publishStore.vendorOptions || []} showSearch fieldProps={{ optionFilterProp: 'label' }} />
            <ProFormSelect name="environment" label="所属环境" placeholder="请选择所属环境"
              options={(publishStore.envOptions || []).map(e => ({ label: e.label, value: e.value }))} showSearch fieldProps={{ optionFilterProp: 'label' }} />
            <ProFormSwitch name="enabled" label="启用" />
            <ProFormText name="description" label="描述" placeholder="请输入描述" />
          </>
        }
        formInitialValues={{ enabled: true, namespace: 'default', skip_verify: false }}
        formTitleCreate="新增 K8s 集群"
        formTitleEdit="编辑 K8s 集群"
      />

      {/* Pod 列表抽屉 */}
      <Drawer
        title={`Pod 列表 — ${podCluster?.name ?? ''}`}
        placement="right" width="min(900px, 95vw)"
        open={podDrawerOpen}
        onClose={() => setPodDrawerOpen(false)}
        destroyOnClose
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            value={namespace}
            onChange={(val) => setNamespace(val)}
            placeholder="选择命名空间"
            style={{ width: 220 }}
            showSearch
            loading={nsLoading}
            options={namespaceOptions}
            allowClear
            onClear={() => setNamespace('default')}
          />
          <Button
            type="primary" icon={<ReloadOutlined />}
            loading={podsLoading}
            onClick={() => podCluster && loadPods(podCluster, namespace)}
          >查询</Button>
        </Space>
        <ProTable<PodInfo>
          rowKey="name" search={false} columns={podColumns}
          dataSource={pods} loading={podsLoading}
          pagination={{ pageSize: 20 }}
          options={false} scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 多容器 Pod 选择框 */}
      <Modal
        title={`选择容器 — ${termPod?.name ?? ''}`}
        open={containerSelectOpen}
        onOk={() => { setContainerSelectOpen(false); setTermOpen(true); }}
        onCancel={() => { setContainerSelectOpen(false); setTermPod(null); setSelectedContainer(''); }}
        okText="连接"
        cancelText="取消"
        width={400}
      >
        <div style={{ marginBottom: 12 }}>
          <span>该 Pod 有多个容器，请选择要连接的容器：</span>
        </div>
        <Select
          value={selectedContainer}
          onChange={(val) => setSelectedContainer(val)}
          style={{ width: '100%' }}
          options={termPod?.containers?.map(c => ({ label: c, value: c })) ?? []}
        />
      </Modal>

      {/* Pod 终端 Modal */}
      <Modal
        title={`Pod 终端 — ${termPod?.name ?? ''}${selectedContainer ? ` (${selectedContainer})` : ''}`}
        open={termOpen}
        onCancel={closeTerminal}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        destroyOnClose
        maskClosable
        keyboard
        transitionName=""
        maskTransitionName=""
      >
        <div
          ref={termRef}
          style={{
            width: '100%',
            height: 500,
            backgroundColor: '#1e1e1e',
            borderRadius: 4,
            padding: 4,
          }}
        />
      </Modal>
    </>
  );
}
