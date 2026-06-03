import { ProFormText, ProFormSelect, type ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import PublishCRUDPage from '@/components/PublishCRUDPage';
import * as api from '@/service/api/publish/environment';
import type { Environment } from '@/service/api/publish/environment';

const TYPE_COLORS: Record<string, string> = { dev: 'processing', test: 'warning', prod: 'error' };
const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

const columns: ProColumns<Environment>[] = [
  { title: '名称', dataIndex: 'name', ellipsis: true },
  {
    title: '环境类型', dataIndex: 'type', width: 100,
    valueType: 'select',
    valueEnum: { dev: { text: 'DEV' }, test: { text: 'TEST' }, prod: { text: 'PROD' } },
    render: (_, row) => row.type ? <Tag color={TYPE_COLORS[String(row.type)] ?? 'default'}>{String(row.type).toUpperCase()}</Tag> : '-'
  },
  {
    title: '状态', dataIndex: 'status', width: 80,
    valueType: 'select',
    valueEnum: { active: { text: '激活' }, inactive: { text: '停用' } },
    render: (_, row) => row.status ? <Tag color={STATUS_COLORS[String(row.status)] ?? 'default'}>{String(row.status)}</Tag> : '-'
  },
  { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
];

export default function PublishConfigEnv() {
  return (
    <PublishCRUDPage<Environment>
      rowKey="id"
      title="环境配置"
      columns={columns}
      fetchList={async (query) => {
        const res = await api.fetchEnvironments(query);
        const data = (res as any)?.records ?? [];
        return { data, total: (res as any)?.total ?? 0 };
      }}
      createItem={(data) => api.createEnvironment(data as any)}
      updateItem={(id, data) => api.updateEnvironment(id, data as any)}
      deleteItem={(id) => api.deleteEnvironment(id)}
      addPerm="publish_env_add"
      editPerm="publish_env_edit"
      deletePerm="publish_env_delete"
      formTitleCreate="新增环境"
      formTitleEdit="编辑环境"
      formFields={
        <>
          <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入环境名称" />
          <ProFormSelect name="type" label="环境类型" rules={[{ required: true }]} placeholder="请选择环境类型"
            options={[{ label: '开发 (dev)', value: 'dev' }, { label: '测试 (test)', value: 'test' }, { label: '生产 (prod)', value: 'prod' }]} />
          <ProFormSelect name="status" label="状态" placeholder="请选择状态"
            options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
          <ProFormText name="description" label="描述" placeholder="请输入环境描述" />
        </>
      }
    />
  );
}