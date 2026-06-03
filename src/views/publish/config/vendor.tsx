import { ProFormText, ProFormSelect, type ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import * as api from '@/service/api/publish/vendor';
import type { Vendor } from '@/service/api/publish/vendor';
import PublishCRUDPage from '@/components/PublishCRUDPage';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

const columns: ProColumns<Vendor>[] = [
  { title: '名称', dataIndex: 'name', ellipsis: true },
  { title: '显示名称', dataIndex: 'display_name', ellipsis: true, search: false },
  { title: '提供商', dataIndex: 'provider', width: 90, search: false, render: (val) => val ? <Tag>{String(val).toUpperCase()}</Tag> : '-' },
  { title: '区域', dataIndex: 'region', width: 100, search: false },
  { title: '状态', dataIndex: 'status', width: 80, search: false, render: (val) => val ? <Tag color={STATUS_COLORS[String(val)] ?? 'default'}>{String(val)}</Tag> : '-' },
  { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
];

export default function PublishConfigVendor() {
  return (
    <PublishCRUDPage<Vendor>
      rowKey="id"
      title="云厂商管理"
      columns={columns}
      fetchList={async (params) => {
        const res = await api.fetchVendors(params);
        return { data: (res as any)?.records ?? [], total: (res as any)?.total ?? 0 };
      }}
      createItem={(data) => api.createVendor(data as any)}
      updateItem={(id, data) => api.updateVendor(id, data as any)}
      deleteItem={(id) => api.deleteVendor(id)}
      addPerm="publish_vendor_add"
      editPerm="publish_vendor_edit"
      deletePerm="publish_vendor_delete"
      formTitleCreate="新增云厂商"
      formTitleEdit="编辑云厂商"
      formFields={
        <>
          <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入云厂商名称" />
          <ProFormText name="display_name" label="显示名称" placeholder="请输入显示名称" />
          <ProFormSelect name="provider" label="提供商" rules={[{ required: true }]} placeholder="请选择云提供商"
            options={[{ label: '阿里云 (Aliyun)', value: 'aliyun' }, 
            { label: '亚马逊云 (AWS)', value: 'aws' }, 
            { label: '微软云 (Azure)', value: 'azure' }, 
            { label: '谷歌云 (GCP)', value: 'gcp' },
            { label: '本地云 (Local)', value: 'local' }]} />
          <ProFormText name="region" label="默认区域" placeholder="cn-hangzhou" />
          <ProFormText name="access_key" label="Access Key" placeholder="请输入 Access Key" />
          <ProFormText.Password name="secret_key" label="Secret Key" placeholder="请输入 Secret Key" />
          <ProFormText name="endpoint" label="API Endpoint" placeholder="请输入 API Endpoint" />
          <ProFormSelect name="status" label="状态" placeholder="请选择状态"
            options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
          <ProFormText name="description" label="描述" placeholder="请输入描述" />
        </>
      }
    />
  );
}