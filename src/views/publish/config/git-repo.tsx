import { ProFormText, ProFormSelect, ProFormTextArea, ProFormGroup, type ProColumns } from '@ant-design/pro-components';
import { Tag, Button, message, Popconfirm } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { isHandledError } from '@/service/request';
import { useState } from 'react';
import * as api from '@/service/api/publish/git-repo';
import type { GitPlatform } from '@/service/api/publish/git-repo';
import PublishCRUDPage from '@/components/PublishCRUDPage';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

const columns: ProColumns<GitPlatform>[] = [
  { title: '名称', dataIndex: 'name', ellipsis: true },
  { title: '平台类型', dataIndex: 'platform_type', width: 90,
    valueEnum: { gitlab: { text: 'GitLab' }, github: { text: 'GitHub' }, gitea: { text: 'Gitea' }, gitee: { text: 'Gitee' }, custom: { text: 'Custom' } }
  },
  { title: '平台地址', dataIndex: 'url', ellipsis: true, search: false, copyable: true },
  { title: '状态', dataIndex: 'status', width: 80, search: false,
    render: (val) => val ? <Tag color={STATUS_COLORS[String(val)] ?? 'default'}>{String(val)}</Tag> : '-'
  },
  { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
];

export default function PublishConfigGitPlatform() {
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleTestConnection = async (row: GitPlatform) => {
    setTestingId(row.id!);
    try {
      const res = await api.testGitPlatformConnection(row.id!);
      message.success((res as any)?.message || '连接成功');
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <PublishCRUDPage<GitPlatform>
      rowKey="id"
      title="Git平台配置"
      columns={columns}
      fetchList={async (params) => {
        const res = await api.fetchGitPlatforms(params);
        return { data: (res as any)?.records ?? [], total: (res as any)?.total ?? 0 };
      }}
      createItem={async (data) => {
        // 将 auth_config 嵌套对象序列化为 JSON 字符串，匹配后端 string 类型
        if (data.auth_config && typeof data.auth_config === 'object') {
          data.auth_config = JSON.stringify(data.auth_config);
        }
        await api.createGitPlatform(data as any);
      }}
      updateItem={async (id, data) => {
        if (data.auth_config && typeof data.auth_config === 'object') {
          data.auth_config = JSON.stringify(data.auth_config);
        }
        await api.updateGitPlatform(id, data as any);
      }}
      deleteItem={(id) => api.deleteGitPlatform(id)}
      addPerm="publish_gitplatform_add"
      editPerm="publish_gitplatform_edit"
      deletePerm="publish_gitplatform_delete"
      formTitleCreate="新增Git平台配置"
      formTitleEdit="编辑Git平台配置"
      formInitialValues={{ platform_type: 'gitlab', auth_type: 'token', status: 'active' }}
      actionColumnWidth={200}
      extraActionRender={(row) => [
        <Popconfirm
          key="test"
          title="确认测试连接？"
          onConfirm={() => handleTestConnection(row)}
        >
          <Button
            type="link"
            size="small"
            icon={<ApiOutlined />}
            loading={testingId === row.id}
          >
            测试
          </Button>
        </Popconfirm>,
      ]}
      formFields={
        <>
          <ProFormGroup title="基本信息">
            <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入平台名称，如 company-gitlab" />
            <ProFormSelect name="platform_type" label="平台类型" rules={[{ required: true }]} placeholder="请选择平台类型"
              options={[{ label: 'GitLab', value: 'gitlab' }, { label: 'GitHub', value: 'github' }, { label: 'Gitea', value: 'gitea' }, { label: 'Gitee', value: 'gitee' }, { label: 'Custom', value: 'custom' }]} />
          </ProFormGroup>
          <ProFormGroup title="连接配置">
            <ProFormText name="url" label="平台地址" rules={[{ required: true }]} placeholder="如：https://gitlab.company.com" />
          </ProFormGroup>
          <ProFormGroup title="认证配置">
            <ProFormSelect name="auth_type" label="认证方式" placeholder="请选择认证方式"
              options={[{ label: 'Token', value: 'token' }]} />
            <ProFormText.Password name={['auth_config', 'token']} label="Access Token" rules={[{ required: true }]} placeholder="请输入平台Access Token" />
          </ProFormGroup>
          <ProFormTextArea name="description" label="描述" placeholder="请输入描述" fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }} />
          <ProFormSelect name="status" label="状态" placeholder="请选择状态"
            options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
        </>
      }
    />
  );
}