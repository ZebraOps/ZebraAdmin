import { ProFormText, ProFormSelect, ProFormDependency, type ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { ApiOutlined } from '@ant-design/icons';
import { isHandledError } from '@/service/request';
import { useState } from 'react';
import * as api from '@/service/api/publish/image-registry';
import type { ImageRegistry, RegistryType } from '@/service/api/publish/image-registry';
import PublishCRUDPage from '@/components/PublishCRUDPage';

const registryTypeOptions = [
  { label: '标准 V2', value: 'v2' },
  { label: 'Harbor', value: 'harbor' },
  { label: '阿里云 ACR', value: 'acr' },
];

const columns: ProColumns<ImageRegistry>[] = [
  { title: '名称', dataIndex: 'name' },
  {
    title: '类型',
    dataIndex: 'type',
    valueEnum: Object.fromEntries(registryTypeOptions.map(o => [o.value, o.label])),
    search: false,
  },
  { title: '地址', dataIndex: 'url' },
  { title: '描述', dataIndex: 'description', search: false },
];

export default function PublishConfigRegistry() {
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleTestConnection = async (row: ImageRegistry) => {
    if (!row.id) return;
    setTestingId(row.id);
    try {
      const res = await api.testImageRegistryConnection(row.id);
      message.success((res as any)?.message || '连接成功');
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

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
          <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入仓库名称" />
          <ProFormSelect
            name="type"
            label="仓库类型"
            rules={[{ required: true }]}
            options={registryTypeOptions}
            placeholder="请选择仓库类型"
          />
          <ProFormText name="url" label="仓库地址" rules={[{ required: true }]} placeholder="请输入仓库地址" />
          <ProFormText name="username" label="用户名" placeholder="请输入用户名" />
          <ProFormText.Password name="password" label="密码" placeholder="请输入密码" />
          <ProFormDependency name={['type']}>
            {({ type }) => type === 'acr' && (
              <>
                <ProFormText name="access_key" label="AccessKey ID" placeholder="阿里云 AccessKey ID" tooltip="用于调用 ACR OpenAPI 自动创建命名空间，可选" />
                <ProFormText.Password name="secret_key" label="AccessKey Secret" placeholder="阿里云 AccessKey Secret" tooltip="用于调用 ACR OpenAPI 自动创建命名空间，可选" />
              </>
            )}
          </ProFormDependency>
          <ProFormText name="description" label="描述" placeholder="请输入描述" />
        </>
      }
    />
  );
}