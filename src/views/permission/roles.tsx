import { useRef, useState, useEffect } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/rbac/role';
import * as groupApi from '@/service/api/rbac/group';
import type { Role, RoleForm } from '@/service/api/rbac/role';
import type { Group } from '@/service/api/rbac/group';
import { usePermission } from '@/hooks/usePermission';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

export default function PermissionRoles() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Role | null>(null);
  const { hasComp } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    groupApi.fetchGroups({ size: 200 }).then((res: any) => {
      setGroups(res?.records ?? []);
    }).catch(() => {});
  }, []);

  const groupEnum = groups.reduce((acc, g) => {
    acc[g.group_id] = { text: g.group_name };
    return acc;
  }, {} as Record<number, { text: string }>);

  const columns: ProColumns<Role>[] = [
    { title: '角色名称', dataIndex: 'role_name', ellipsis: true },
    { title: '描述', dataIndex: 'role_desc', ellipsis: true, search: false },
    {
      title: '分组', dataIndex: 'group_id', valueType: 'select', valueEnum: groupEnum,
      render: (_, row) => { const g = groups.find(g => g.group_id === row.group_id); return g ? <Tag>{g.group_name}</Tag> : '-'; }
    },
    {
      title: '状态', dataIndex: 'status', width: 80, valueType: 'select',
      valueEnum: { '0': { text: '启用', status: 'Success' }, '1': { text: '禁用', status: 'Error' } },
      render: (_, row) => { const s = STATUS_MAP[String(row.status)]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; }
    },
    { title: '创建时间', dataIndex: 'ctime', valueType: 'dateTime', width: 150, search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('permission_role_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteRole(row.role_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Role>
        rowKey="role_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('permission_role_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('permission_role_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteRole(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}

        request={async (params) => {
          try {
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            if (params.role_name) query.name = params.role_name;
            if (params.group_id !== undefined && params.group_id !== '') query.group_id = params.group_id;
            if (params.status !== undefined && params.status !== '') query.status = params.status;
            const res = await api.fetchRoles(query);
            return { data: res?.records ?? [], success: true, total: res?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.permission_roles', { defaultValue: '角色管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<RoleForm>
        key={editRecord?.role_id ?? 'new'}
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { role_name: editRecord.role_name, role_desc: editRecord.role_desc, group_id: editRecord.group_id, status: editRecord.status ?? '0', projects: editRecord.projects } : { status: '0' }}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            if (editRecord?.role_id) await api.updateRole(editRecord.role_id, values); else await api.createRole(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="role_name" label="角色名称" rules={[{ required: true }]} />
        <ProFormSelect name="group_id" label="分组" rules={[{ required: true }]}
          options={groups.map(g => ({ label: g.group_name, value: g.group_id }))} />
        <ProFormText name="role_desc" label="描述" />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
      </ModalForm>
    </>
  );
}
