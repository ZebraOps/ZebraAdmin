import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/build-template';
import type { BuildTemplate } from '@/service/api/publish/build-template';

export default function PublishTemplatesBuild() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<BuildTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<BuildTemplate>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title="确认删除？" onConfirm={() => api.deleteBuildTemplate(row.id!).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<BuildTemplate>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchBuildTemplates({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_templates_build', { defaultValue: '构建模板' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<BuildTemplate>>
        title={editRecord ? '编辑构建模板' : '新增构建模板'}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateBuildTemplate(editRecord.id, values as any); else await api.createBuildTemplate(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="模板名称" rules={[{ required: true }]} />
        <ProFormTextArea name="content" label="模板内容" rules={[{ required: true }]} fieldProps={{ rows: 6 }} />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}
