import { useState, useEffect } from 'react';
import {
  ProFormText, ProFormTextArea, ProFormSwitch, ProFormSelect,
  ProTable, type ProColumns,
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Input, Space, Tooltip } from 'antd';
import { isHandledError } from '@/service/request';
import {
  ApiOutlined, ContainerOutlined, ReloadOutlined,
} from '@ant-design/icons';
import PublishCRUDPage from '@/components/PublishCRUDPage';
import * as api from '@/service/api/publish/k8s-cluster';
import type { K8sCluster, PodInfo } from '@/service/api/publish/k8s-cluster';
import { usePublishStore } from '@/store/publish';

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
          <Input
            value={namespace}
            onChange={(e) => setNamespace(e.target.value)}
            placeholder="命名空间"
            style={{ width: 220 }}
            allowClear
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
    </>
  );
}