import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/applications';
import type { Application } from '@/service/api/publish/applications';

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: '激活', color: 'success' },
  1: { label: '待配置', color: 'warning' },
  2: { label: '已停用', color: 'error' },
};

export default function PublishApplications() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Application | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<Application>[] = [
    { title: '应用名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description' },
    { title: '关联仓库', dataIndex: 'repoId', render: (val) => val ? <Tag color="processing">#{String(val)}</Tag> : '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: (_, row) => { const s = STATUS_MAP[(row as any).status]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; } },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteApplication(row.id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<Application>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchApplications({}); return { data: (res as any)?.items ?? (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_applications', { defaultValue: '应用管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增应用' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<{ name: string; description?: string; repoId?: number }>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑应用' : '新增应用'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateApplication(editRecord.id, values); else await api.createApplication(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="应用名称" rules={[{ required: true }]} />
        <ProFormText name="description" label="描述" />
        <ProFormSelect name="repoId" label="关联仓库" options={[]} placeholder="选择关联仓库（可选）" />
      </ModalForm>
    </>
  );
}
