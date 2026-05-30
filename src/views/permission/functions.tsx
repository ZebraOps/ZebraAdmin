import { useRef, useState, useEffect } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/rbac/function';
import * as groupApi from '@/service/api/rbac/group';
import type { FunctionItem, FunctionForm, SyncFunctionItem } from '@/service/api/rbac/function';
import { staticFunctions } from '@/router/staticFunctions';
import type { Group } from '@/service/api/rbac/group';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'green', POST: 'blue', PUT: 'orange', DELETE: 'red', PATCH: 'purple',
};

export default function PermissionFunctions() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<FunctionItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleSync = async () => {
    const items: SyncFunctionItem[] = staticFunctions.map(f => ({
      func_name: f.func_name,
      uri: f.uri,
      method_type: f.method_type,
      group_name: f.group_name,
    }));
    setSyncLoading(true);
    try {
      const res = await api.syncFunctions(items);
      message.success(`同步成功：新增 ${res.created}，更新 ${res.updated}，跳过 ${res.skipped}`);
      actionRef.current?.reload();
    } catch (e: any) {
      if (!isHandledError(e)) message.error('同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    groupApi.fetchGroups({ size: 200 }).then((res: any) => {
      setGroups(res?.records ?? []);
    }).catch(() => {});
  }, []);

  // 自动绑定分组：优先找名为"功能管理"的分组，否则取第一个
  const defaultGroupId = groups.find(g => g.group_name === '功能管理')?.group_id ?? groups[0]?.group_id;

  const columns: ProColumns<FunctionItem>[] = [
    { title: '功能名称', dataIndex: 'func_name' },
    { title: 'URI', dataIndex: 'uri', render: (val) => val ? <Tag>{String(val)}</Tag> : '-' },
    {
      title: '请求方法', dataIndex: 'method_type', search: false,
      render: (_, row) => row.method_type ? <Tag color={METHOD_COLORS[row.method_type.toUpperCase()] ?? 'default'}>{row.method_type.toUpperCase()}</Tag> : '-'
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
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('permission_function_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteFunction(row.func_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<FunctionItem>
        rowKey="func_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('permission_function_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('permission_function_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteFunction(id as number)));
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
            if (params.func_name) query.name = params.func_name;
            if (params.uri) query.uri = params.uri;
            if (params.status !== undefined && params.status !== '') query.status = params.status;
            const res = await api.fetchFunctions(query);
            return { data: res?.records ?? [], success: true, total: res?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.permission_functions', { defaultValue: '功能管理' })}
        toolBarRender={() => [
          hasComp('permission_function_sync') && <Button key="sync" icon={<SyncOutlined />} loading={syncLoading} onClick={handleSync}>同步功能</Button>,
          hasComp('permission_function_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<FunctionForm>
        key={editRecord?.func_id ?? 'new'}
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { func_name: editRecord.func_name, uri: editRecord.uri, status: editRecord.status ?? '0', method_type: editRecord.method_type } : { status: '0' }}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            const payload = { ...values, group_id: editRecord?.group_id ?? defaultGroupId };
            if (editRecord?.func_id) await api.updateFunction(editRecord.func_id, payload);
            else await api.createFunction(payload);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="func_name" label="功能名称" rules={[{ required: true }]} />
        <ProFormText name="uri" label="URI" placeholder="如 /rbac/users" />
        <ProFormSelect name="method_type" label="请求方法" options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => ({ label: m, value: m }))} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
      </ModalForm>
    </>
  );
}