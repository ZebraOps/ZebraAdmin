import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/image-registry';
import type { ImageRegistry } from '@/service/api/publish/image-registry';

export default function PublishConfigRegistry() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<ImageRegistry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<ImageRegistry>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'url' },
    { title: '描述', dataIndex: 'description' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title="确认删除？" onConfirm={() => api.deleteImageRegistry(row.id!).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<ImageRegistry>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchImageRegistries({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_config_registry', { defaultValue: '镜像仓库' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<ImageRegistry>>
        title={editRecord ? '编辑镜像仓库' : '新增镜像仓库'}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateImageRegistry(editRecord.id, values as any); else await api.createImageRegistry(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormText name="url" label="仓库地址" rules={[{ required: true }]} />
        <ProFormText name="username" label="用户名" />
        <ProFormText.Password name="password" label="密码" />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}
