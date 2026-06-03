import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/rbac/group';
import type { Group, GroupForm } from '@/service/api/rbac/group';
import { usePermission } from '@/hooks/usePermission';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

export default function PermissionGroups() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Group | null>(null);
  const { hasComp } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<Group>[] = [
    { title: '分组名称', dataIndex: 'group_name', ellipsis: true },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    {
      title: '状态', dataIndex: 'status', width: 80, valueType: 'select',
      valueEnum: { '0': { text: '启用', status: 'Success' }, '1': { text: '禁用', status: 'Error' } },
      render: (_, row) => { const s = STATUS_MAP[String(row.status)]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; }
    },
    { title: '创建时间', dataIndex: 'ctime', valueType: 'dateTime', width: 150, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('permission_group_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteGroup(row.group_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Group>
        rowKey="group_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('permission_group_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('permission_group_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteGroup(id as number)));
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
            if (params.group_name) query.name = params.group_name;
            if (params.status !== undefined && params.status !== '') query.status = params.status;
            const res = await api.fetchGroups(query);
            return { data: res?.records ?? [], success: true, total: res?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.permission_groups', { defaultValue: '分组管理' })}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<GroupForm>
        key={editRecord?.group_id ?? 'new'}
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { group_name: editRecord.group_name, description: editRecord.description, status: editRecord.status ?? '0' } : { status: '0' }}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            if (editRecord?.group_id) await api.updateGroup(editRecord.group_id, values);
            else await api.createGroup(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="group_name" label="分组名称" rules={[{ required: true }]} />
        <ProFormTextArea name="description" label="描述" />
        <ProFormSelect name="status" label="状态" rules={[{ required: true }]} options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
      </ModalForm>
    </>
  );
}