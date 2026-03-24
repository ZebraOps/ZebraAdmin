import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormDigit, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/linux-machine';
import type { LinuxMachine } from '@/service/api/publish/linux-machine';

export default function PublishContainerLinux() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<LinuxMachine | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<LinuxMachine>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '主机地址', dataIndex: 'host' },
    { title: '端口', dataIndex: 'port', width: 80 },
    { title: '用户名', dataIndex: 'username' },
    { title: '描述', dataIndex: 'description' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title="确认删除？" onConfirm={() => api.deleteLinuxMachine(row.id!).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<LinuxMachine>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchLinuxMachines({}); return { data: (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_container_linux', { defaultValue: 'Linux 主机' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<LinuxMachine>>
        title={editRecord ? '编辑 Linux 主机' : '新增 Linux 主机'}
        open={modalOpen} onOpenChange={setModalOpen} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateLinuxMachine(editRecord.id, values as any); else await api.createLinuxMachine(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} />
        <ProFormText name="host" label="主机地址" rules={[{ required: true }]} />
        <ProFormDigit name="port" label="端口" min={1} max={65535} initialValue={22} />
        <ProFormText name="username" label="用户名" rules={[{ required: true }]} />
        <ProFormText.Password name="password" label="密码" />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}
