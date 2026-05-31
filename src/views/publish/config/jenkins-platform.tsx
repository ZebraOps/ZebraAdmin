import { ProFormText, ProFormSelect, ProFormTextArea, ProFormGroup, type ProColumns } from '@ant-design/pro-components';
import { Tag, Tooltip, Button, message } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { isHandledError } from '@/service/request';
import { useState } from 'react';
import * as api from '@/service/api/publish/jenkins-platform';
import type { JenkinsPlatform } from '@/service/api/publish/jenkins-platform';
import PublishCRUDPage from '@/components/PublishCRUDPage';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

const columns: ProColumns<JenkinsPlatform>[] = [
  { title: '名称', dataIndex: 'name' },
  { title: '显示名称', dataIndex: 'display_name', search: false },
  { title: '平台地址', dataIndex: 'url', ellipsis: true, search: false, copyable: true },
  { title: '用户名', dataIndex: 'username', width: 120, search: false },
  { title: '状态', dataIndex: 'status', width: 80, search: false,
    render: (val) => val ? <Tag color={STATUS_COLORS[String(val)] ?? 'default'}>{String(val)}</Tag> : '-'
  },
  { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
];

export default function PublishConfigJenkinsPlatform() {
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleTestConnection = async (row: JenkinsPlatform) => {
    setTestingId(row.id);
    try {
      const res = await api.testJenkinsPlatformConnection(row.id!);
      message.success((res as any)?.message || '连接成功');
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

  return (
    <PublishCRUDPage<JenkinsPlatform>
      rowKey="id"
      title="Jenkins配置"
      columns={columns}
      fetchList={async (params) => {
        const res = await api.fetchJenkinsPlatforms(params);
        return { data: (res as any)?.records ?? [], total: (res as any)?.total ?? 0 };
      }}
      createItem={(data) => api.createJenkinsPlatform(data as any)}
      updateItem={(id, data) => api.updateJenkinsPlatform(id, data as any)}
      deleteItem={(id) => api.deleteJenkinsPlatform(id)}
      addPerm="publish_jenkinsplatform_add"
      editPerm="publish_jenkinsplatform_edit"
      deletePerm="publish_jenkinsplatform_delete"
      formTitleCreate="新增Jenkins配置"
      formTitleEdit="编辑Jenkins配置"
      formInitialValues={{ status: 'active' }}
      formFields={
        <>
          <ProFormGroup title="基本信息">
            <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="如 company-jenkins" />
            <ProFormText name="display_name" label="显示名称" placeholder="如：公司Jenkins" />
          </ProFormGroup>
          <ProFormGroup title="连接配置">
            <ProFormText name="url" label="平台地址" rules={[{ required: true }]} placeholder="如：https://jenkins.company.com" />
            <ProFormText name="username" label="用户名" rules={[{ required: true }]} placeholder="Jenkins登录用户名" />
            <ProFormText.Password name="password" label="密码/Token" rules={[{ required: true }]} placeholder="Jenkins密码或API Token" />
          </ProFormGroup>
          <ProFormTextArea name="description" label="描述" placeholder="请输入描述" fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }} />
          <ProFormSelect name="status" label="状态" placeholder="请选择状态"
            options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
        </>
      }
    />
  );
}