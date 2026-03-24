import { useRef, useState, useEffect } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/rbac/role';
import * as groupApi from '@/service/api/rbac/group';
import type { Role, RoleForm } from '@/service/api/rbac/role';
import type { Group } from '@/service/api/rbac/group';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

export default function PermissionRoles() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    groupApi.fetchGroups({ size: 200 }).then((res: any) => {
      setGroups(res?.records ?? res?.data ?? []);
    }).catch(() => {});
  }, []);

  const columns: ProColumns<Role>[] = [
    { title: '角色名称', dataIndex: 'role_name' },
    { title: '描述', dataIndex: 'role_desc' },
    { title: '分组', dataIndex: 'group_id', render: (_, row) => { const g = groups.find(g => g.group_id === (row as any).group_id); return g ? <Tag>{g.group_name}</Tag> : '-'; } },
    { title: '状态', dataIndex: 'status', render: (_, row) => { const s = STATUS_MAP[String((row as any).status)]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; } },
    { title: '创建时间', dataIndex: 'ctime', valueType: 'dateTime' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title={t('common.deleteConfirm', { defaultValue: '确认删除？' })} onConfirm={() => api.deleteRole((row as any).role_id).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<Role>
        rowKey="role_id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchRoles({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.permission_roles', { defaultValue: '角色管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<RoleForm>
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if ((editRecord as any)?.role_id) await api.updateRole((editRecord as any).role_id, values); else await api.createRole(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="role_name" label="角色名称" rules={[{ required: true }]} />
        <ProFormSelect name="group_id" label="分组" rules={[{ required: true }]}
          options={groups.map(g => ({ label: g.group_name, value: g.group_id }))} />
        <ProFormText name="role_desc" label="描述" />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} initialValue="0" />
      </ModalForm>
    </>
  );
}
