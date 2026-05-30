import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/environment';
import type { Environment } from '@/service/api/publish/environment';

const TYPE_COLORS: Record<string, string> = { dev: 'processing', test: 'warning', prod: 'error' };
const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

export default function PublishConfigEnv() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Environment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<Environment>[] = [
    { title: t('common.name', { defaultValue: '名称' }), dataIndex: 'name' },
    {
      title: '环境类型', dataIndex: 'type', width: 110,
      valueType: 'select',
      valueEnum: { dev: { text: 'DEV' }, test: { text: 'TEST' }, prod: { text: 'PROD' } },
      render: (_, row) => row.type ? <Tag color={TYPE_COLORS[String(row.type)] ?? 'default'}>{String(row.type).toUpperCase()}</Tag> : '-'
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      valueType: 'select',
      valueEnum: { active: { text: '激活' }, inactive: { text: '停用' } },
      render: (_, row) => row.status ? <Tag color={STATUS_COLORS[String(row.status)] ?? 'default'}>{String(row.status)}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        hasComp('publish_env_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_env_delete') && <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteEnvironment(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Environment>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('publish_env_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_env_delete') ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteEnvironment(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]); actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}>
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}
        request={async (params) => {
          try {
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            if (params.name) query.name = params.name;
            if (params.type) query.type = params.type;
            if (params.status) query.status = params.status;
            const res = await api.fetchEnvironments(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_config_env', { defaultValue: '环境配置' })}
        toolBarRender={() => [hasComp('publish_env_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<Environment>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateEnvironment(editRecord.id, values as any); else await api.createEnvironment(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入环境名称" />
        <ProFormSelect name="type" label="环境类型" rules={[{ required: true }]} placeholder="请选择环境类型"
          options={[{ label: '开发 (dev)', value: 'dev' }, { label: '测试 (test)', value: 'test' }, { label: '生产 (prod)', value: 'prod' }]} />
        <ProFormSelect name="status" label="状态" placeholder="请选择状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
        <ProFormText name="description" label="描述" placeholder="请输入环境描述" />
      </ModalForm>
    </>
  );
}
