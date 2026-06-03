import { ProFormText, ProFormDigit, ProFormSelect, type ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import * as api from '@/service/api/publish/language';
import type { Language } from '@/service/api/publish/language';
import PublishCRUDPage from '@/components/PublishCRUDPage';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

const columns: ProColumns<Language>[] = [
  { title: '语言名称', dataIndex: 'name', ellipsis: true },
  { title: '显示名称', dataIndex: 'display_name', ellipsis: true, search: false },
  { title: '图标', dataIndex: 'icon', width: 80, search: false,
    render: (val) => val ? <Tag color="blue">{String(val)}</Tag> : '-'
  },
  { title: '排序', dataIndex: 'sort_order', width: 60, search: false },
  {
    title: '状态', dataIndex: 'status', width: 80,
    valueType: 'select',
    valueEnum: { active: { text: '激活' }, inactive: { text: '停用' } },
    render: (_, row) => row.status ? <Tag color={STATUS_COLORS[String(row.status)] ?? 'default'}>{row.status === 'active' ? '激活' : '停用'}</Tag> : '-'
  },
  { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
  { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 150, search: false },
];

export default function PublishConfigLanguage() {
  return (
    <PublishCRUDPage<Language>
      rowKey="id"
      title="开发语言"
      columns={columns}
      fetchList={async (params) => {
        const res = await api.fetchLanguages(params);
        return { data: (res as any)?.records ?? [], total: (res as any)?.total ?? 0 };
      }}
      createItem={(data) => api.createLanguage(data as any)}
      updateItem={(id, data) => api.updateLanguage(id, data as any)}
      deleteItem={(id) => api.deleteLanguage(id)}
      addPerm="publish_language_add"
      editPerm="publish_language_edit"
      deletePerm="publish_language_delete"
      formTitleCreate="新增开发语言"
      formTitleEdit="编辑开发语言"
      formInitialValues={{ status: 'active', sort_order: 0 }}
      formFields={
        <>
          <ProFormText name="name" label="语言名称" rules={[{ required: true }]} placeholder="Go / Java / Python..." />
          <ProFormText name="display_name" label="显示名称" placeholder="Golang / Java / Python 3" />
          <ProFormText name="icon" label="图标" placeholder="mdi:language-go / mdi:language-java" />
          <ProFormDigit name="sort_order" label="排序" min={0} fieldProps={{ precision: 0 }} />
          <ProFormSelect name="status" label="状态" placeholder="请选择状态"
            options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} />
          <ProFormText name="description" label="描述" placeholder="请输入描述" />
        </>
      }
    />
  );
}