import { useRef, useState, useEffect } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/rbac/component';
import * as groupApi from '@/service/api/rbac/group';
import type { Component, ComponentForm } from '@/service/api/rbac/component';
import type { Group } from '@/service/api/rbac/group';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

export default function PermissionComponent() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Component | null>(null);
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
  const columns: ProColumns<Component>[] = [
    { title: '组件名称', dataIndex: 'component_name' },
    { title: '描述', dataIndex: 'comp_desc', ellipsis: true, search: false },
    {
      title: '分组', dataIndex: 'group_id', valueType: 'select', valueEnum: groupEnum,
      render: (_, row) => { const g = groups.find(g => g.group_id === row.group_id); return g ? <Tag>{g.group_name}</Tag> : '-'; }
    },
    {
      title: '状态', dataIndex: 'status', valueType: 'select',
      valueEnum: { '0': { text: '启用', status: 'Success' }, '1': { text: '禁用', status: 'Error' } },
      render: (_, row) => { const s = STATUS_MAP[String(row.status)]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; }
    },
    { title: '创建时间', dataIndex: 'ctime', valueType: 'dateTime', search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        hasComp('permission_component_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('permission_component_delete') && <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteComponent(row.component_id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Component>
        rowKey="component_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('permission_component_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('permission_component_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteComponent(id as number)));
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
            if (params.component_name) query.name = params.component_name;
            if (params.group_id !== undefined && params.group_id !== '') query.group_id = params.group_id;
            if (params.status !== undefined && params.status !== '') query.status = params.status;
            const res = await api.fetchComponents(query);
            return { data: res?.records ?? [], success: true, total: res?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.permission_component', { defaultValue: '组件管理' })}
        toolBarRender={() => [
          hasComp('permission_component_sync') && <Button key="sync" icon={<SyncOutlined />} onClick={async () => {
            try {
              const { staticComponents } = await import('@/router/staticComponents');
              const res = await api.syncComponents(staticComponents);
              message.success(`同步成功：新增 ${res.created} 项，更新 ${res.updated} 项`);
              actionRef.current?.reload();
            } catch (e: any) {
              if (!isHandledError(e)) message.error('同步失败');
            }
          }}>同步组件</Button>,
          hasComp('permission_component_add') && <Button key="add" type="primary" icon={<SyncOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<ComponentForm>
        key={editRecord?.component_id ?? 'new'}
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { component_name: editRecord.component_name, comp_desc: editRecord.comp_desc, group_id: editRecord.group_id } : {}}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            if (editRecord?.component_id) await api.updateComponent(editRecord.component_id, values);
            else await api.createComponent(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="component_name" label="组件名称" rules={[{ required: true }]} />
        <ProFormText name="comp_desc" label="描述" />
        <ProFormSelect name="group_id" label="分组" rules={[{ required: true }]}
          options={groups.map(g => ({ label: g.group_name, value: g.group_id }))} />
      </ModalForm>
    </>
  );
}