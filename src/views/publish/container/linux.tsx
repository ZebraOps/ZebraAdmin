import { useState } from 'react';
import {
  ProFormText, ProFormDigit, ProFormSelect,
  ProFormTextArea, ProFormSwitch, ProFormDependency,
  ProTable, type ProColumns,
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Tooltip, Space, Modal, Input } from 'antd';
import { isHandledError } from '@/service/request';
import {
  ApiOutlined, ContainerOutlined, ReloadOutlined, CodeOutlined,
} from '@ant-design/icons';
import PublishCRUDPage from '@/components/PublishCRUDPage';
import * as api from '@/service/api/publish/linux-machine';
import type { LinuxMachine, DockerContainer } from '@/service/api/publish/linux-machine';

export default function PublishContainerLinux() {
  // 连接测试状态
  const [testingId, setTestingId] = useState<number | null>(null);

  // 容器抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerHost, setDrawerHost] = useState<LinuxMachine | null>(null);
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [containersLoading, setContainersLoading] = useState(false);

  // exec 命令
  const [execTarget, setExecTarget] = useState<{ host: LinuxMachine; container: DockerContainer } | null>(null);
  const [execCommand, setExecCommand] = useState<string>('');
  const [execOutput, setExecOutput] = useState<string>('');
  const [execLoading, setExecLoading] = useState(false);

  const loadContainers = async (host: LinuxMachine) => {
    setContainersLoading(true);
    try {
      const list = await api.listLinuxContainers(host.id);
      setContainers(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '获取容器列表失败');
      setContainers([]);
    } finally {
      setContainersLoading(false);
    }
  };

  const handleViewContainers = async (row: LinuxMachine) => {
    setDrawerHost(row);
    setDrawerOpen(true);
    await loadContainers(row);
  };

  const handleTestConnection = async (row: LinuxMachine) => {
    setTestingId(row.id);
    try {
      const res = await api.testLinuxConnection(row.id);
      message.success((res as any)?.message || 'SSH 连接成功');
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || 'SSH 连接失败');
    } finally {
      setTestingId(null);
    }
  };

  const handleRunCommand = async () => {
    if (!execTarget || !execCommand.trim()) {
      message.warning('请输入要执行的命令');
      return;
    }
    setExecLoading(true);
    try {
      const res = await api.execContainerCommand(execTarget.host.id, execTarget.container.id, execCommand);
      setExecOutput((res as any)?.output ?? '');
      if ((res as any)?.error) message.warning(String((res as any).error));
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '命令执行失败');
    } finally {
      setExecLoading(false);
    }
  };

  const columns: ProColumns<LinuxMachine>[] = [
    { title: '主机名称', dataIndex: 'name', ellipsis: true },
    { title: 'IP 地址', dataIndex: 'host', width: 120 },
    { title: '端口', dataIndex: 'port', width: 60, search: false },
    { title: '用户名', dataIndex: 'username', width: 90, search: false },
    {
      title: '认证方式', dataIndex: 'auth_type', width: 90, search: false,
      render: (val) => val ? <Tag>{String(val) === 'key' ? 'SSH 密钥' : '密码'}</Tag> : '-'
    },
    {
      title: '状态', dataIndex: 'is_active', width: 80,
      valueType: 'select',
      valueEnum: { 'true': { text: '活跃' }, 'false': { text: '停用' } },
      render: (_, row) => <Tag color={row.is_active ? 'success' : 'default'}>{row.is_active ? '活跃' : '停用'}</Tag>
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
  ];

  const containerColumns: ProColumns<DockerContainer>[] = [
    {
      title: '容器ID', dataIndex: 'id', width: 110,
      render: (val) => <span style={{ fontFamily: 'monospace' }}>{String(val ?? '').slice(0, 12)}</span>
    },
    {
      title: '名称', dataIndex: 'names', ellipsis: true,
      render: (val) => Array.isArray(val) ? val.join(', ') : String(val ?? '-')
    },
    { title: '镜像', dataIndex: 'image', ellipsis: true },
    {
      title: '状态', dataIndex: 'status', width: 150,
      render: (val) => {
        const s = String(val ?? '');
        const color = s.toLowerCase().includes('up') ? 'success' : s.toLowerCase().includes('exit') ? 'default' : 'processing';
        return <Tag color={color}>{s || '-'}</Tag>;
      }
    },
    { title: '端口', dataIndex: 'ports', ellipsis: true },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 80,
      render: (_, row) => [
        <Button
          key="exec" type="link" size="small" icon={<CodeOutlined />}
          onClick={() => {
            if (drawerHost) {
              setExecTarget({ host: drawerHost, container: row });
              setExecCommand('ls -la');
              setExecOutput('');
            }
          }}
        >执行</Button>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <PublishCRUDPage<LinuxMachine>
        rowKey="id"
        title="Linux 主机"
        columns={columns}
        fetchList={async (params) => {
          const res = await api.fetchLinuxMachines(params) as any;
          return { data: res?.records ?? [], total: res?.total ?? 0 };
        }}
        createItem={api.createLinuxMachine as any}
        updateItem={api.updateLinuxMachine as any}
        deleteItem={api.deleteLinuxMachine}
        addPerm="publish_linux_add"
        editPerm="publish_linux_edit"
        deletePerm="publish_linux_delete"
        actionColumnWidth={280}
        extraActionRender={(row) => [
          <Tooltip key="test" title="测试 SSH 连接">
            <Button
              type="link" size="small" icon={<ApiOutlined />}
              loading={testingId === row.id}
              onClick={() => handleTestConnection(row)}
            >测试</Button>
          </Tooltip>,
          <Button
            key="containers" type="link" size="small" icon={<ContainerOutlined />}
            onClick={() => handleViewContainers(row)}
          >容器</Button>,
        ]}
        formFields={
          <>
            <ProFormText name="name" label="主机名称" rules={[{ required: true }]} placeholder="请输入主机名称" />
            <ProFormText name="host" label="IP 地址 / 主机名" rules={[{ required: true }]} placeholder="192.168.1.100" />
            <ProFormDigit name="port" label="SSH 端口" min={1} max={65535} placeholder="22" fieldProps={{ precision: 0 }} />
            <ProFormText name="username" label="用户名" rules={[{ required: true }]} placeholder="root" />
            <ProFormSelect
              name="auth_type" label="认证方式" rules={[{ required: true }]} placeholder="请选择认证方式"
              options={[{ label: '密码', value: 'password' }, { label: 'SSH 密钥', value: 'key' }]}
            />
            <ProFormDependency name={['auth_type']}>
              {({ auth_type }) => {
                if (auth_type === 'password') return <ProFormText.Password name="password" label="密码" placeholder="请输入密码" />;
                if (auth_type === 'key') return <ProFormTextArea name="private_key" label="SSH 私钥" fieldProps={{ rows: 6, placeholder: '-----BEGIN RSA PRIVATE KEY-----\n...' }} />;
                return null;
              }}
            </ProFormDependency>
            <ProFormSwitch name="is_active" label="激活状态" />
            <ProFormText name="description" label="描述" placeholder="请输入描述" />
          </>
        }
        formInitialValues={{ port: 22, auth_type: 'password', is_active: true }}
        formTitleCreate="新增 Linux 主机"
        formTitleEdit="编辑 Linux 主机"
      />

      {/* 容器列表抽屉 */}
      <Drawer
        title={`Docker 容器 — ${drawerHost?.name ?? ''}`}
        placement="right" width="min(1000px, 95vw)"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        extra={
          <Button
            icon={<ReloadOutlined />} loading={containersLoading}
            onClick={() => drawerHost && loadContainers(drawerHost)}
          >刷新</Button>
        }
      >
        <ProTable<DockerContainer>
          rowKey="id" search={false} columns={containerColumns}
          dataSource={containers} loading={containersLoading}
          pagination={{ pageSize: 20 }} options={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 容器命令执行 */}
      <Modal
        title={`容器命令执行 — ${execTarget?.container?.names?.[0] ?? execTarget?.container?.id ?? ''}`}
        open={!!execTarget} width="min(780px, 90vw)"
        onCancel={() => { setExecTarget(null); setExecOutput(''); }}
        footer={null} destroyOnClose
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Input.TextArea
            rows={3} value={execCommand}
            onChange={(e) => setExecCommand(e.target.value)}
            placeholder="例如：ls -la /app"
          />
          <Button type="primary" icon={<CodeOutlined />} loading={execLoading} onClick={handleRunCommand}>
            执行命令
          </Button>
          <pre
            style={{
              background: '#1e1e1e', color: '#d4d4d4', padding: 12, borderRadius: 4,
              fontFamily: 'Menlo, Consolas, monospace', fontSize: 13,
              maxHeight: 360, overflow: 'auto', minHeight: 120, margin: 0,
            }}
          >{execOutput || '（暂无输出）'}</pre>
        </Space>
      </Modal>
    </>
  );
}