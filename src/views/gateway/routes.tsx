import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormDigit, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Switch, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/gateway/routes';
import type { GatewayRoute, GatewayRouteForm } from '@/service/api/gateway/routes';

const METHOD_COLORS: Record<string, string> = { GET: 'success', POST: 'processing', PUT: 'warning', DELETE: 'error', PATCH: 'purple', HEAD: 'default', OPTIONS: 'default' };

export default function GatewayRoutes() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<GatewayRoute | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleToggle = async (row: GatewayRoute, checked: boolean) => {
    try {
      if (checked) await api.enableGatewayRoute(row.id);
      else await api.disableGatewayRoute(row.id);
      message.success('新干出成功');
      actionRef.current?.reload();
    } catch { message.error('操作失败'); }
  };

  const columns: ProColumns<GatewayRoute>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: 'URI', dataIndex: 'uri', render: (val) => val ? <Tag>{String(val)}</Tag> : '-' },
    { title: '描述', dataIndex: 'description' },
    { title: '排序', dataIndex: 'order', width: 80 },
    { title: '状态', dataIndex: 'enabled', width: 90, render: (_, row) => <Switch checked={!!(row as any).enabled} onChange={(c) => handleToggle(row, c)} checkedChildren="开" unCheckedChildren="关" /> },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title={t('common.deleteConfirm', { defaultValue: '确认删除？' })} onConfirm={() => api.deleteGatewayRoute(row.id).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<GatewayRoute>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchGatewayRoutes({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.gateway_routes', { defaultValue: '路由管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<GatewayRouteForm>
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if ((editRecord as any)?.id) await api.updateGatewayRoute((editRecord as any).id, values); else await api.createGatewayRoute(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormText name="uri" label="URI" rules={[{ required: true }]} />
        <ProFormDigit name="order" label="排序" min={0} />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}

