import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/image-registry';
import type { ImageRegistry } from '@/service/api/publish/image-registry';

export default function PublishConfigRegistry() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<ImageRegistry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<ImageRegistry>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '地址', dataIndex: 'url' },
    { title: '描述', dataIndex: 'description', search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteImageRegistry(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<ImageRegistry>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteImageRegistry(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]); actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}>
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        )}
        request={async (params) => {
          try {
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            if (params.name) query.name = params.name;
            if (params.url) query.url = params.url;
            const res = await api.fetchImageRegistries(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_config_registry', { defaultValue: '镜像仓库' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<ImageRegistry>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑镜像仓库' : '新增镜像仓库'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateImageRegistry(editRecord.id, values as any); else await api.createImageRegistry(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入仓库名称" />
        <ProFormText name="url" label="仓库地址" rules={[{ required: true }]} placeholder="请输入仓库地址" />
        <ProFormText name="username" label="用户名" placeholder="请输入用户名" />
        <ProFormText.Password name="password" label="密码" placeholder="请输入密码" />
        <ProFormText name="description" label="描述" placeholder="请输入描述" />
      </ModalForm>
    </>
  );
}
