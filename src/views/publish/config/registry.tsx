import { ProFormText, type ProColumns } from '@ant-design/pro-components';
import * as api from '@/service/api/publish/image-registry';
import type { ImageRegistry } from '@/service/api/publish/image-registry';
import PublishCRUDPage from '@/components/PublishCRUDPage';

const columns: ProColumns<ImageRegistry>[] = [
  { title: '名称', dataIndex: 'name' },
  { title: '地址', dataIndex: 'url' },
  { title: '描述', dataIndex: 'description', search: false },
];

export default function PublishConfigRegistry() {
  return (
    <PublishCRUDPage<ImageRegistry>
      rowKey="id"
      title="镜像仓库"
      columns={columns}
      fetchList={async (params) => {
        const res = await api.fetchImageRegistries(params);
        return { data: (res as any)?.records ?? [], total: (res as any)?.total ?? 0 };
      }}
      createItem={(data) => api.createImageRegistry(data as any)}
      updateItem={(id, data) => api.updateImageRegistry(id, data as any)}
      deleteItem={(id) => api.deleteImageRegistry(id)}
      addPerm="publish_registry_add"
      editPerm="publish_registry_edit"
      deletePerm="publish_registry_delete"
      formTitleCreate="新增镜像仓库"
      formTitleEdit="编辑镜像仓库"
      formFields={
        <>
          <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入仓库名称" />
          <ProFormText name="url" label="仓库地址" rules={[{ required: true }]} placeholder="请输入仓库地址" />
          <ProFormText name="username" label="用户名" placeholder="请输入用户名" />
          <ProFormText.Password name="password" label="密码" placeholder="请输入密码" />
          <ProFormText name="description" label="描述" placeholder="请输入描述" />
        </>
      }
    />
  );
}