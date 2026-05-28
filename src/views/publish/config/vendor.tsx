import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/vendor';
import type { Vendor } from '@/service/api/publish/vendor';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

export default function PublishConfigVendor() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Vendor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<Vendor>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '显示名称', dataIndex: 'display_name', search: false },
    { title: '提供商', dataIndex: 'provider', width: 100, search: false, render: (val) => val ? <Tag>{String(val).toUpperCase()}</Tag> : '-' },
    { title: '区域', dataIndex: 'region', width: 120, search: false },
    { title: '状态', dataIndex: 'status', width: 80, search: false, render: (val) => val ? <Tag color={STATUS_COLORS[String(val)] ?? 'default'}>{String(val)}</Tag> : '-' },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteVendor(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<Vendor>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteVendor(id as number)));
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
            const res = await api.fetchVendors(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_config_vendor', { defaultValue: '云厂商管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<Vendor>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑云厂商' : '新增云厂商'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateVendor(editRecord.id, values as any); else await api.createVendor(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入云厂商名称" />
        <ProFormText name="display_name" label="显示名称" placeholder="请输入显示名称" />
        <ProFormSelect name="provider" label="提供商" rules={[{ required: true }]} placeholder="请选择云提供商"
          options={[{ label: '阿里云 (Aliyun)', value: 'aliyun' }, { label: '亚马逊云 (AWS)', value: 'aws' }, { label: '微软云 (Azure)', value: 'azure' }, { label: '谷歌云 (GCP)', value: 'gcp' }]} />
        <ProFormText name="region" label="默认区域" placeholder="cn-hangzhou" />
        <ProFormText name="access_key" label="Access Key" placeholder="请输入 Access Key" />
        <ProFormText.Password name="secret_key" label="Secret Key" placeholder="请输入 Secret Key" />
        <ProFormText name="endpoint" label="API Endpoint" placeholder="请输入 API Endpoint" />
        <ProFormSelect name="status" label="状态" placeholder="请选择状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
        <ProFormText name="description" label="描述" placeholder="请输入描述" />
      </ModalForm>
    </>
  );
}
