import { useState } from 'react';
import {
  ProFormText, ProFormDigit, ProFormSelect,
  ProFormTextArea, ProFormSwitch, ProFormDependency, ProColumns,
} from '@ant-design/pro-components';
import { Button, Tag, message, Tooltip } from 'antd';
import { isHandledError } from '@/service/request';
import { ApiOutlined } from '@ant-design/icons';
import PublishCRUDPage from '@/components/PublishCRUDPage';
import * as api from '@/service/api/publish/linux-machine';
import type { LinuxMachine } from '@/service/api/publish/linux-machine';

export default function PublishClusterLinux() {
  const [testingId, setTestingId] = useState<number | null>(null);

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

  return (
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
      actionColumnWidth={180}
      extraActionRender={(row) => [
        <Tooltip key="test" title="测试 SSH 连接">
          <Button
            type="link" size="small" icon={<ApiOutlined />}
            loading={testingId === row.id}
            onClick={() => handleTestConnection(row)}
          >测试</Button>
        </Tooltip>,
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
  );
}
