import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/language';
import type { Language } from '@/service/api/publish/language';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

export default function PublishConfigLanguage() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Language | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<Language>[] = [
    { title: '语言名称', dataIndex: 'name' },
    { title: '显示名称', dataIndex: 'display_name', search: false },
    { title: '图标', dataIndex: 'icon', width: 100, search: false,
      render: (val) => val ? <Tag color="blue">{String(val)}</Tag> : '-'
    },
    { title: '排序', dataIndex: 'sort_order', width: 70, search: false },
    {
      title: '状态', dataIndex: 'status', width: 90,
      valueType: 'select',
      valueEnum: { active: { text: '激活' }, inactive: { text: '停用' } },
      render: (_, row) => row.status ? <Tag color={STATUS_COLORS[String(row.status)] ?? 'default'}>{row.status === 'active' ? '激活' : '停用'}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160, search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        hasComp('publish_language_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_language_delete') && <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteLanguage(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Language>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('publish_language_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_language_delete') ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteLanguage(id as number)));
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
            if (params.status) query.status = params.status;
            const res = await api.fetchLanguages(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_config_language', { defaultValue: '开发语言' })}
        toolBarRender={() => [hasComp('publish_language_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<Language>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑开发语言' : '新增开发语言'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ?? { status: 'active', sort_order: 0 }}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateLanguage(editRecord.id, values as any); else await api.createLanguage(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="语言名称" rules={[{ required: true }]} placeholder="Go / Java / Python..." />
        <ProFormText name="display_name" label="显示名称" placeholder="Golang / Java / Python 3" />
        <ProFormText name="icon" label="图标" placeholder="mdi:language-go / mdi:language-java" />
        <ProFormDigit name="sort_order" label="排序" min={0} fieldProps={{ precision: 0 }} />
        <ProFormSelect name="status" label="状态" placeholder="请选择状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} />
        <ProFormText name="description" label="描述" placeholder="请输入描述" />
      </ModalForm>
    </>
  );
}
