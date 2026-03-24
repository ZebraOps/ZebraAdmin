import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/gateway/whitelist';
import type { Whitelist } from '@/service/api/gateway/whitelist';

export default function GatewayWhitelist() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Whitelist | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<Whitelist>[] = [
    { title: '路径', dataIndex: 'path', render: (val) => val ? <Tag>{String(val)}</Tag> : '-' },
    { title: '描述', dataIndex: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title={t('common.deleteConfirm', { defaultValue: '确认删除？' })} onConfirm={() => api.deleteWhitelist(row.id).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<Whitelist>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchWhitelists({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.gateway_whitelist', { defaultValue: '白名单管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<{ path: string; description?: string }>
        title={editRecord ? t('common.edit', { defaultValue: '编辑' }) : t('common.add', { defaultValue: '新增' })}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) {
              await api.deleteWhitelist(editRecord.id);
              await api.createWhitelist(values);
            } else {
              await api.createWhitelist(values);
            }
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="path" label="路径" rules={[{ required: true }]} />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}

