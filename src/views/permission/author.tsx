import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/rbac/role';

interface AuthorItem { id?: number; name?: string; remark?: string; [key: string]: unknown; }

export default function PermissionAuthor() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<AuthorItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<AuthorItem>[] = [
    { title: t('common.name', { defaultValue: '名称' }), dataIndex: 'name' },
    { title: t('common.remark', { defaultValue: '备注' }), dataIndex: 'remark' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title={t('common.deleteConfirm', { defaultValue: '确认删除？' })} onConfirm={() => api.deleteRole(row.id!).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<AuthorItem>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchRoles({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.permission_author', { defaultValue: '授权管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<AuthorItem>
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateRole(editRecord.id as number, values as any); else await api.createRole(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label={t('common.name', { defaultValue: '名称' })} rules={[{ required: true }]} />
        <ProFormText name="remark" label={t('common.remark', { defaultValue: '备注' })} />
      </ModalForm>
    </>
  );
}