import { useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSwitch,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Input, Space, Tooltip, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ApiOutlined, ContainerOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/k8s-cluster';
import type { K8sCluster, PodInfo } from '@/service/api/publish/k8s-cluster';

export default function PublishContainerK8s() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<K8sCluster | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取 Pod 列表失败');
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
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

  const columns: ProColumns<K8sCluster>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: 'API Server', dataIndex: 'api_server', ellipsis: true, search: false },
    { title: '命名空间', dataIndex: 'namespace', width: 100, search: false },
    { title: '云厂商', dataIndex: 'vendor', width: 100 },
    { title: '所属环境', dataIndex: 'environment', width: 100 },
    {
      title: '状态', dataIndex: 'enabled', width: 90,
      valueType: 'select',
      valueEnum: { 'true': { text: '启用' }, 'false': { text: '停用' } },
      render: (_, row) => <Tag color={row.enabled ? 'success' : 'default'}>{row.enabled ? '启用' : '停用'}</Tag>
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 260,
      render: (_, row) => [
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
        <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setModalOpen(true); }}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton
          key="del" icon={<DeleteOutlined />}
          text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => {
            await api.deleteK8sCluster(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}
        />
      ]
    }
  ];

  const podColumns: ProColumns<PodInfo>[] = [
    { title: 'Pod 名称', dataIndex: 'name', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: (val) => {
        const s = String(val ?? '');
        const color = s === 'Running' ? 'success' : s === 'Pending' ? 'warning' : s === 'Failed' ? 'error' : 'default';
        return <Tag color={color}>{s || '-'}</Tag>;
      }
    },
    { title: '命名空间', dataIndex: 'namespace', width: 120 },
    { title: '节点', dataIndex: 'node_name', width: 160, ellipsis: true },
    { title: '启动时间', dataIndex: 'start_time', valueType: 'dateTime', width: 170 },
  ];

  return (
    <>
      <ProTable<K8sCluster>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteK8sCluster(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        )}
        request={async (params) => {
          try {
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            if (params.name) query.name = params.name;
            if (params.vendor) query.vendor = params.vendor;
            if (params.environment) query.environment = params.environment;
            if (params.enabled !== undefined && params.enabled !== '') query.enabled = params.enabled;
            const res = await api.fetchK8sClusters(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_container_k8s', { defaultValue: 'K8s 集群' })}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>
            {t('common.add', { defaultValue: '新增' })}
          </Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<K8sCluster>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑 K8s 集群' : '新增 K8s 集群'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={{ enabled: true, namespace: 'default', skip_verify: false, ...editRecord }}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateK8sCluster(editRecord.id, values as any);
            else await api.createK8sCluster(values as any);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="name" label="集群名称" rules={[{ required: true }]} placeholder="请输入集群名称" />
        <ProFormText name="api_server" label="API Server 地址" rules={[{ required: true }]} placeholder="https://k8s-api:6443" />
        <ProFormText name="namespace" label="默认命名空间" placeholder="default" />
        <ProFormText.Password name="token" label="认证 Token" placeholder="Bearer Token (K8s 1.24+)" />
        <ProFormTextArea name="ca_cert" label="CA 证书" fieldProps={{ rows: 4, placeholder: '-----BEGIN CERTIFICATE-----\n...' }} />
        <ProFormTextArea name="client_cert" label="客户端证书" fieldProps={{ rows: 4, placeholder: '-----BEGIN CERTIFICATE-----\n...' }} />
        <ProFormTextArea name="client_key" label="客户端私钥" fieldProps={{ rows: 4, placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...' }} />
        <ProFormSwitch name="skip_verify" label="跳过证书验证" />
        <ProFormText name="vendor" label="云厂商" placeholder="aliyun / aws / azure / gcp" />
        <ProFormText name="environment" label="所属环境" placeholder="dev / test / prod" />
        <ProFormSwitch name="enabled" label="启用" />
        <ProFormText name="description" label="描述" placeholder="请输入描述" />
      </ModalForm>

      {/* Pod 列表抽屉 */}
      <Drawer
        title={`Pod 列表 — ${podCluster?.name ?? ''}`}
        placement="right" width={900}
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
