import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/k8s-cluster';
import type { K8sCluster } from '@/service/api/publish/k8s-cluster';

export default function PublishContainerK8s() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<K8sCluster | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<K8sCluster>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: 'API Server', dataIndex: 'apiServer' },
    { title: '描述', dataIndex: 'description' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteK8sCluster(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<K8sCluster>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchK8sClusters({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_container_k8s', { defaultValue: 'K8s 集群' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<K8sCluster>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑 K8s 集群' : '新增 K8s 集群'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateK8sCluster(editRecord.id, values as any); else await api.createK8sCluster(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="集群名称" rules={[{ required: true }]} />
        <ProFormText name="apiServer" label="API Server 地址" rules={[{ required: true }]} />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}
