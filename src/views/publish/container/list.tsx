import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProTable, type ProColumns,
} from '@ant-design/pro-components';
import {
  Button, Tag, message, Modal, Select, Space, Tabs, Tooltip,
} from 'antd';
import {
  ReloadOutlined, CodeOutlined, DeleteOutlined, FileTextOutlined,
  RedoOutlined, ContainerOutlined,
} from '@ant-design/icons';
import { isHandledError } from '@/service/request';
import * as k8sApi from '@/service/api/publish/k8s-cluster';
import type { PodInfo } from '@/service/api/publish/k8s-cluster';
import * as linuxApi from '@/service/api/publish/linux-machine';
import type { DockerContainer } from '@/service/api/publish/linux-machine';
import * as containerOps from '@/service/api/publish/container-operations';
import type { K8sDeploymentInfo } from '@/service/api/publish/container-operations';
import { usePublishStore } from '@/store/publish';
import { usePermission } from '@/hooks/usePermission';
import { localStg } from '@/utils/storage';
import ContainerTerminal from '@/components/ContainerTerminal';
import ServiceLogPanel from '@/components/ServiceLogPanel';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

/** Group pods by the `app` label into deployment summaries */
function groupPodsByDeployment(
  pods: PodInfo[],
  clusterId: number,
  clusterName: string,
): K8sDeploymentInfo[] {
  const map = new Map<string, PodInfo[]>();
  for (const pod of pods) {
    const app = pod.labels?.app || pod.labels?.['app.kubernetes.io/name'] || 'unknown';
    if (!map.has(app)) map.set(app, []);
    map.get(app)!.push(pod);
  }
  return Array.from(map.entries()).map(([name, group]) => {
    const ready = group.filter(p => p.status === 'Running').length;
    const first = group[0];
    return {
      deployment_name: name,
      namespace: first.namespace || 'default',
      healthy_pods: ready,
      total_pods: group.length,
      image: first.labels?.image || first.labels?.['app.kubernetes.io/version'] || '-',
      status: ready === group.length ? 'Healthy' : 'Degraded',
      cluster_id: clusterId,
      cluster_name: clusterName,
    };
  });
}

export default function PublishContainerList() {
  const publishStore = usePublishStore();
  const { hasComp } = usePermission();

  useEffect(() => { publishStore.loadAll(); }, [publishStore]);

  // --- K8s Tab State ---
  const [k8sClusterId, setK8sClusterId] = useState<number | undefined>();
  const [k8sEnvId, setK8sEnvId] = useState<number | undefined>();
  const [k8sSearch, setK8sSearch] = useState('');
  const [k8sDeployments, setK8sDeployments] = useState<K8sDeploymentInfo[]>([]);
  const [k8sLoading, setK8sLoading] = useState(false);
  const [k8sSelectedRows, setK8sSelectedRows] = useState<K8sDeploymentInfo[]>([]);

  // --- Docker Tab State ---
  const [dockerServerId, setDockerServerId] = useState<number | undefined>();
  const [dockerContainers, setDockerContainers] = useState<DockerContainer[]>([]);
  const [dockerLoading, setDockerLoading] = useState(false);
  const [dockerSelectedRows, setDockerSelectedRows] = useState<DockerContainer[]>([]);

  // --- Terminal State ---
  const [k8sTermOpen, setK8sTermOpen] = useState(false);
  const [k8sTermPod, setK8sTermPod] = useState<PodInfo | null>(null);
  const [k8sTermClusterId, setK8sTermClusterId] = useState<number>(0);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [containerSelectOpen, setContainerSelectOpen] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [dockerTermOpen, setDockerTermOpen] = useState(false);
  const [dockerTermServerId, setDockerTermServerId] = useState<number>(0);
  const [dockerTermContainerId, setDockerTermContainerId] = useState('');

  // --- Log State ---
  const [logOpen, setLogOpen] = useState(false);
  const [logType, setLogType] = useState<'k8s' | 'docker'>('k8s');
  const [logClusterId, setLogClusterId] = useState<number>(0);
  const [logPodName, setLogPodName] = useState('');
  const [logNamespace, setLogNamespace] = useState('');
  const [logServerId, setLogServerId] = useState<number>(0);
  const [logContainerId, setLogContainerId] = useState('');

  const wsBaseURL = (import.meta.env.VITE_BASE_URL || '').trim().replace(/^http/, 'ws').replace(/\/$/, '');

  // --- K8s Data Fetching ---
  const loadK8sDeployments = useCallback(async () => {
    if (!k8sClusterId) { setK8sDeployments([]); return; }
    setK8sLoading(true);
    try {
      const cluster = publishStore.clusters.find(c => c.id === k8sClusterId);
      const ns = cluster?.namespace || 'default';
      const list = await k8sApi.listK8sPods(k8sClusterId, ns);
      const pods = Array.isArray(list) ? list : [];
      const grouped = groupPodsByDeployment(pods, k8sClusterId, cluster?.name ?? '');
      setK8sDeployments(grouped);
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '获取 Pod 列表失败');
      setK8sDeployments([]);
    } finally {
      setK8sLoading(false);
    }
  }, [k8sClusterId, publishStore.clusters]);

  // --- Docker Data Fetching ---
  const loadDockerContainers = useCallback(async () => {
    if (!dockerServerId) { setDockerContainers([]); return; }
    setDockerLoading(true);
    try {
      const list = await linuxApi.listLinuxContainers(dockerServerId);
      setDockerContainers(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '获取容器列表失败');
      setDockerContainers([]);
    } finally {
      setDockerLoading(false);
    }
  }, [dockerServerId]);

  // --- K8s Terminal ---
  const openK8sTerminal = async (deployment: K8sDeploymentInfo) => {
    if (!k8sClusterId) return;
    try {
      const ns = deployment.namespace || 'default';
      const pods = await k8sApi.listK8sPods(k8sClusterId, ns);
      const matchingPods = (Array.isArray(pods) ? pods : []).filter(p => {
        const app = p.labels?.app || p.labels?.['app.kubernetes.io/name'] || 'unknown';
        return app === deployment.deployment_name;
      });
      if (matchingPods.length === 0) { message.warning('未找到运行中的 Pod'); return; }
      const pod = matchingPods[0];
      setK8sTermClusterId(k8sClusterId);
      const containers = pod.containers || [];
      if (containers.length <= 1) {
        setSelectedContainer(containers[0] ?? '');
        setK8sTermPod(pod);
        setK8sTermOpen(true);
      } else {
        setK8sTermPod(pod);
        setSelectedContainer(containers[0]);
        setContainerSelectOpen(true);
      }
    } catch {
      message.error('获取 Pod 信息失败');
    }
  };

  const closeK8sTerminal = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (xtermRef.current) { xtermRef.current.dispose(); xtermRef.current = null; fitAddonRef.current = null; }
    setK8sTermOpen(false);
    setK8sTermPod(null);
    setSelectedContainer('');
  };

  // K8s Terminal WebSocket setup
  useEffect(() => {
    if (!k8sTermOpen || !k8sTermPod || !k8sTermClusterId || !termRef.current) return;

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
    term.writeln('\x1b[90m正在连接 Pod 终端...\x1b[0m');

    const fitTimer = setTimeout(() => { fitAddon.fit(); term.focus(); }, 150);

    const wsTimer = setTimeout(() => {
      const token = localStg.get<string>('token') || '';
      const ns = k8sTermPod.namespace || 'default';
      const containerParam = selectedContainer ? `&container=${encodeURIComponent(selectedContainer)}` : '';
      const url = `${wsBaseURL}/cicd/api/k8s/clusters/${k8sTermClusterId}/pods/${encodeURIComponent(k8sTermPod.name)}/exec?namespace=${encodeURIComponent(ns)}&token=${token}${containerParam}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => { term.clear(); term.focus(); message.success('Pod 终端已连接'); };
      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
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
        if (!event.wasClean) term.writeln('\x1b[31m连接异常断开\x1b[0m');
      };
    }, 250);

    return () => {
      clearTimeout(fitTimer);
      clearTimeout(wsTimer);
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    };
  }, [k8sTermOpen, k8sTermPod, k8sTermClusterId, wsBaseURL, selectedContainer]);

  // --- Actions ---
  const handleK8sBatchRestart = async () => {
    if (k8sSelectedRows.length === 0) { message.warning('请先选择要重启的服务'); return; }
    Modal.confirm({
      title: '批量重启确认',
      content: `确认重启以下 ${k8sSelectedRows.length} 个 Deployment？`,
      okText: '确认重启',
      cancelText: '取消',
      onOk: async () => {
        const results = await Promise.allSettled(
          k8sSelectedRows.map(d =>
            containerOps.restartK8sDeployment(d.cluster_id, d.deployment_name, d.namespace).then(() => {
              containerOps.recordContainerOperation({
                operation_type: 'batch_restart',
                target_type: 'k8s',
                target_detail: `cluster: ${d.cluster_name} / deployment: ${d.deployment_name} / ns: ${d.namespace}`,
                operator: 'admin',
                result: 'success',
              }).catch(() => {});
            })
          )
        );
        const ok = results.filter(r => r.status === 'fulfilled').length;
        const fail = results.filter(r => r.status === 'rejected').length;
        if (fail > 0) message.warning(`重启完成：${ok} 成功, ${fail} 失败`);
        else message.success(`已成功重启 ${ok} 个 Deployment`);
        loadK8sDeployments();
      },
    });
  };

  const handleK8sDeletePod = async (deployment: K8sDeploymentInfo) => {
    if (!k8sClusterId) return;
    Modal.confirm({
      title: '删除 Pod 确认',
      content: `确认删除 ${deployment.deployment_name} 下的 Pod？Pod 会被重建。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const pods = await k8sApi.listK8sPods(k8sClusterId, deployment.namespace);
          const matchingPods = (Array.isArray(pods) ? pods : []).filter(p => {
            const app = p.labels?.app || p.labels?.['app.kubernetes.io/name'] || 'unknown';
            return app === deployment.deployment_name;
          });
          for (const p of matchingPods) {
            try { await containerOps.deleteK8sPod(k8sClusterId, p.name, p.namespace); } catch { /* skip individual pod errors */ }
          }
          message.success(`已删除 ${deployment.deployment_name} 的 Pod`);
          containerOps.recordContainerOperation({
            operation_type: 'delete', target_type: 'k8s',
            target_detail: `cluster: ${deployment.cluster_name} / deployment: ${deployment.deployment_name}`,
            operator: 'admin', result: 'success',
          }).catch(() => {});
          loadK8sDeployments();
        } catch (e: unknown) {
          if (!isHandledError(e)) message.error((e as any)?.message || '删除失败');
        }
      },
    });
  };

  const handleDockerBatchRestart = async () => {
    if (dockerSelectedRows.length === 0) { message.warning('请先选择要重启的容器'); return; }
    Modal.confirm({
      title: '批量重启确认',
      content: `确认重启以下 ${dockerSelectedRows.length} 个容器？`,
      okText: '确认重启',
      cancelText: '取消',
      onOk: async () => {
        const results = await Promise.allSettled(
          dockerSelectedRows.map(c =>
            containerOps.restartDockerContainer(dockerServerId!, c.id).then(() => {
              containerOps.recordContainerOperation({
                operation_type: 'batch_restart', target_type: 'docker',
                target_detail: `server: ${dockerServerId} / container: ${c.names?.[0] || c.id}`,
                operator: 'admin', result: 'success',
              }).catch(() => {});
            })
          )
        );
        const ok = results.filter(r => r.status === 'fulfilled').length;
        const fail = results.filter(r => r.status === 'rejected').length;
        if (fail > 0) message.warning(`重启完成：${ok} 成功, ${fail} 失败`);
        else message.success(`已成功重启 ${ok} 个容器`);
        loadDockerContainers();
      },
    });
  };

  const handleDockerRestart = async (container: DockerContainer) => {
    if (!dockerServerId) return;
    Modal.confirm({
      title: '重启容器', content: `确认重启容器 ${container.names?.[0] || container.id.slice(0, 12)}？`,
      okText: '重启', onOk: async () => {
        try {
          await containerOps.restartDockerContainer(dockerServerId, container.id);
          message.success('容器已重启');
          containerOps.recordContainerOperation({
            operation_type: 'restart', target_type: 'docker',
            target_detail: `server: ${dockerServerId} / container: ${container.names?.[0] || container.id}`,
            operator: 'admin', result: 'success',
          }).catch(() => {});
          loadDockerContainers();
        } catch (e: unknown) {
          if (!isHandledError(e)) message.error((e as any)?.message || '重启失败');
        }
      },
    });
  };

  const handleDockerDelete = async (container: DockerContainer) => {
    if (!dockerServerId) return;
    Modal.confirm({
      title: '删除容器', content: `确认删除容器 ${container.names?.[0] || container.id.slice(0, 12)}？此操作不可恢复。`,
      okText: '确认删除', okType: 'danger', onOk: async () => {
        try {
          await containerOps.deleteDockerContainer(dockerServerId, container.id, true);
          message.success('容器已删除');
          containerOps.recordContainerOperation({
            operation_type: 'delete', target_type: 'docker',
            target_detail: `server: ${dockerServerId} / container: ${container.names?.[0] || container.id}`,
            operator: 'admin', result: 'success',
          }).catch(() => {});
          loadDockerContainers();
        } catch (e: unknown) {
          if (!isHandledError(e)) message.error((e as any)?.message || '删除失败');
        }
      },
    });
  };

  // --- K8s Table Columns ---
  const k8sColumns: ProColumns<K8sDeploymentInfo>[] = [
    { title: 'Service / Deployment', dataIndex: 'deployment_name', ellipsis: true },
    { title: '命名空间', dataIndex: 'namespace', width: 110 },
    {
      title: 'Pod 数量', dataIndex: 'pod_count', width: 100, search: false,
      render: (_, row) => (
        <Tag color={row.status === 'Healthy' ? 'success' : 'warning'}>
          {row.healthy_pods}/{row.total_pods}
        </Tag>
      ),
    },
    { title: '镜像', dataIndex: 'image', ellipsis: true, search: false },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (_, row) => (
        <Tag color={row.status === 'Healthy' ? 'success' : 'warning'}>
          {row.status === 'Healthy' ? '健康' : '异常'}
        </Tag>
      ),
    },
    {
      title: '操作', key: 'actions', width: 200, fixed: 'right', search: false,
      render: (_, record) => (
        <Space size="small">
          {hasComp('publish_container_k8s_terminal') && (
            <Tooltip title="进入终端">
              <Button type="link" size="small" icon={<CodeOutlined />}
                onClick={() => openK8sTerminal(record)}>终端</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_k8s_logs') && (
            <Tooltip title="查看日志">
              <Button type="link" size="small" icon={<FileTextOutlined />}
                onClick={() => {
                  setLogType('k8s');
                  setLogClusterId(record.cluster_id);
                  setLogPodName(record.deployment_name);
                  setLogNamespace(record.namespace);
                  setLogOpen(true);
                }}>日志</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_k8s_delete') && (
            <Tooltip title="删除 Pod">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}
                onClick={() => handleK8sDeletePod(record)}>删除</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // --- Docker Table Columns ---
  const dockerColumns: ProColumns<DockerContainer>[] = [
    {
      title: '容器ID', dataIndex: 'id', width: 130, search: false,
      render: (val) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(val ?? '').slice(0, 12)}</span>,
    },
    {
      title: '名称', dataIndex: 'names', ellipsis: true,
      render: (val) => Array.isArray(val) ? val.join(', ') : String(val ?? '-'),
    },
    { title: '镜像', dataIndex: 'image', ellipsis: true, search: false },
    {
      title: '状态', dataIndex: 'status', width: 140, search: false,
      render: (val) => {
        const s = String(val ?? '');
        const color = s.toLowerCase().includes('up') ? 'success' : s.toLowerCase().includes('exit') ? 'default' : 'processing';
        return <Tag color={color}>{s || '-'}</Tag>;
      },
    },
    { title: '端口', dataIndex: 'ports', ellipsis: true, width: 200, search: false },
    {
      title: '操作', key: 'actions', width: 260, fixed: 'right', search: false,
      render: (_, record) => (
        <Space size="small">
          {hasComp('publish_container_docker_terminal') && (
            <Tooltip title="进入终端">
              <Button type="link" size="small" icon={<CodeOutlined />}
                onClick={() => {
                  setDockerTermServerId(dockerServerId!);
                  setDockerTermContainerId(record.id);
                  setDockerTermOpen(true);
                }}>终端</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_docker_logs') && (
            <Tooltip title="查看日志">
              <Button type="link" size="small" icon={<FileTextOutlined />}
                onClick={() => {
                  setLogType('docker');
                  setLogServerId(dockerServerId!);
                  setLogContainerId(record.id);
                  setLogOpen(true);
                }}>日志</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_docker_restart') && (
            <Tooltip title="重启容器">
              <Button type="link" size="small" icon={<RedoOutlined />}
                onClick={() => handleDockerRestart(record)}>重启</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_docker_delete') && (
            <Tooltip title="删除容器">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}
                onClick={() => handleDockerDelete(record)}>删除</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // --- Filter JSX ---
  const k8sFilterBar = (
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="选择 K8s 集群"
        style={{ width: 200 }}
        showSearch
        allowClear
        value={k8sClusterId}
        onChange={(val) => setK8sClusterId(val)}
        options={publishStore.clusterOptions}
        fieldNames={{ label: 'label', value: 'value' }}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Select
        placeholder="选择环境"
        style={{ width: 180 }}
        showSearch
        allowClear
        value={k8sEnvId}
        onChange={(val) => setK8sEnvId(val)}
        options={publishStore.envOptions}
        fieldNames={{ label: 'label', value: 'value' }}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Button type="primary" icon={<ReloadOutlined />} loading={k8sLoading} onClick={loadK8sDeployments}>
        查询
      </Button>
      {hasComp('publish_container_k8s_restart') && k8sSelectedRows.length > 0 && (
        <Button type="primary" danger icon={<RedoOutlined />} onClick={handleK8sBatchRestart}>
          批量重启 ({k8sSelectedRows.length})
        </Button>
      )}
    </Space>
  );

  const dockerFilterBar = (
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="选择 Linux 主机"
        style={{ width: 240 }}
        showSearch
        allowClear
        value={dockerServerId}
        onChange={(val) => setDockerServerId(val)}
        options={publishStore.linuxMachineOptions}
        fieldNames={{ label: 'label', value: 'value' }}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Button type="primary" icon={<ReloadOutlined />} loading={dockerLoading} onClick={loadDockerContainers}>
        查询
      </Button>
      {hasComp('publish_container_docker_restart') && dockerSelectedRows.length > 0 && (
        <Button type="primary" danger icon={<RedoOutlined />} onClick={handleDockerBatchRestart}>
          批量重启 ({dockerSelectedRows.length})
        </Button>
      )}
    </Space>
  );

  const tabItems = [
    {
      key: 'k8s',
      label: <span><ContainerOutlined /> K8s 容器</span>,
      children: (
        <div>
          {k8sFilterBar}
          <ProTable<K8sDeploymentInfo>
            rowKey="deployment_name"
            columns={k8sColumns}
            dataSource={k8sDeployments.filter(d =>
              !k8sSearch || d.deployment_name.toLowerCase().includes(k8sSearch.toLowerCase())
            )}
            loading={k8sLoading}
            search={false}
            options={{ reload: loadK8sDeployments, density: true }}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys: k8sSelectedRows.map(r => r.deployment_name),
              onChange: (_, rows) => setK8sSelectedRows(rows),
            }}
            toolbar={{
              search: (
                <input
                  placeholder="搜索 Deployment 名称"
                  style={{ width: 220, padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
                  value={k8sSearch}
                  onChange={(e) => setK8sSearch(e.target.value)}
                />
              ),
            }}
            locale={{ emptyText: '请选择集群后点击查询' }}
          />
        </div>
      ),
    },
    {
      key: 'docker',
      label: <span><ContainerOutlined /> Docker 容器</span>,
      children: (
        <div>
          {dockerFilterBar}
          <ProTable<DockerContainer>
            rowKey="id"
            columns={dockerColumns}
            dataSource={dockerContainers}
            loading={dockerLoading}
            search={false}
            options={{ reload: loadDockerContainers, density: true }}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys: dockerSelectedRows.map(r => r.id),
              onChange: (_, rows) => setDockerSelectedRows(rows),
            }}
            locale={{ emptyText: '请选择主机后点击查询' }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="k8s" items={tabItems} size="large" style={{ padding: '0 8px' }} />

      {/* K8s Pod Terminal Modal */}
      <Modal
        title={`Pod 终端 — ${k8sTermPod?.name ?? ''}${selectedContainer ? ` (${selectedContainer})` : ''}`}
        open={k8sTermOpen}
        onCancel={closeK8sTerminal}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        destroyOnClose
      >
        <div ref={termRef}
          style={{
            width: '100%', height: 500, backgroundColor: '#1e1e1e',
            borderRadius: 4, padding: 4,
          }}
        />
      </Modal>

      {/* Multi-container Pod Selector */}
      <Modal
        title={`选择容器 — ${k8sTermPod?.name ?? ''}`}
        open={containerSelectOpen}
        onOk={() => { setContainerSelectOpen(false); setK8sTermOpen(true); }}
        onCancel={() => { setContainerSelectOpen(false); setK8sTermPod(null); setSelectedContainer(''); }}
        okText="连接" cancelText="取消" width={400}
      >
        <div style={{ marginBottom: 12 }}>该 Pod 有多个容器，请选择：</div>
        <Select
          value={selectedContainer}
          onChange={(val) => setSelectedContainer(val)}
          style={{ width: '100%' }}
          options={k8sTermPod?.containers?.map(c => ({ label: c, value: c })) ?? []}
        />
      </Modal>

      {/* Docker Terminal Modal */}
      <Modal
        title="Docker 容器终端"
        open={dockerTermOpen}
        onCancel={() => setDockerTermOpen(false)}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        destroyOnClose
      >
        <ContainerTerminal
          key={`docker-term-${dockerTermServerId}-${dockerTermContainerId}`}
          serverId={dockerTermServerId}
          containerId={dockerTermContainerId}
          autoConnect
        />
      </Modal>

      {/* Log Panel Modal */}
      <Modal
        title="容器日志"
        open={logOpen}
        onCancel={() => setLogOpen(false)}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        destroyOnClose
      >
        {logType === 'k8s' && (
          <ServiceLogPanel
            key={`k8s-${logClusterId}-${logPodName}`}
            type="k8s"
            clusterId={logClusterId}
            podName={logPodName}
            namespace={logNamespace}
          />
        )}
        {logType === 'docker' && (
          <ServiceLogPanel
            key={`docker-${logServerId}-${logContainerId}`}
            type="docker"
            serverId={logServerId}
            containerId={logContainerId}
          />
        )}
      </Modal>
    </>
  );
}
