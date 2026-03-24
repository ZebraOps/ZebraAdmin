import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/rbac/group';

interface SysGroupItem { id?: number; name?: string; remark?: string; [key: string]: unknown; }

export default function SystemGroups() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<SysGroupItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = async (id: number) => {
    try { await api.deleteGroup(id); message.success(t('common.deleteSuccess', { defaultValue: '删除成功' })); actionRef.current?.reload(); }
    catch { message.error(t('common.deleteFailed', { defaultValue: '删除失败' })); }
  };

  const columns: ProColumns<SysGroupItem>[] = [
    { title: t('common.name', { defaultValue: '名称' }), dataIndex: 'name' },
    { title: t('common.remark', { defaultValue: '备注' }), dataIndex: 'remark' },
    {
      title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title={t('common.deleteConfirm', { defaultValue: '确认删除？' })} onConfirm={() => handleDelete(row.id!)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<SysGroupItem>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => {
          try { const res = await api.fetchGroups({}); return { data: (res as any)?.records ?? (res as any)?.data ?? [], success: true, total: (res as any)?.total ?? 0 }; }
          catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.system_groups', { defaultValue: '分组配置' })}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>
        ]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<SysGroupItem>
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateGroup(editRecord.id as number, values as any); else await api.createGroup(values as any);
            message.success(t('common.saveSuccess', { defaultValue: '保存成功' })); actionRef.current?.reload(); return true;
          } catch { message.error(t('common.saveFailed', { defaultValue: '保存失败' })); return false; }
        }}
      >
        <ProFormText name="name" label={t('common.name', { defaultValue: '名称' })} rules={[{ required: true }]} />
        <ProFormText name="remark" label={t('common.remark', { defaultValue: '备注' })} />
      </ModalForm>
    </>
  );
}

