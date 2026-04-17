import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/deploy-template';
import type { DeployTemplate } from '@/service/api/publish/deploy-template';

export default function PublishTemplatesDeployment() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<DeployTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<DeployTemplate>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteDeployTemplate(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<DeployTemplate>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchDeployTemplates({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_templates_deployment', { defaultValue: '部署模板' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<DeployTemplate>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑部署模板' : '新增部署模板'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateDeployTemplate(editRecord.id, values as any); else await api.createDeployTemplate(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="模板名称" rules={[{ required: true }]} />
        <ProFormTextArea name="content" label="模板内容" rules={[{ required: true }]} fieldProps={{ rows: 6 }} />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}
