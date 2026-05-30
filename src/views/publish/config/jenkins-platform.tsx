import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormGroup, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Tooltip } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/jenkins-platform';
import type { JenkinsPlatform } from '@/service/api/publish/jenkins-platform';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

export default function PublishConfigJenkinsPlatform() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<JenkinsPlatform | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleTestConnection = async (row: JenkinsPlatform) => {
    setTestingId(row.id);
    try {
      const res = await api.testJenkinsPlatformConnection(row.id!);
      message.success((res as any)?.message || '连接成功');
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

  const columns: ProColumns<JenkinsPlatform>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '显示名称', dataIndex: 'display_name', search: false },
    { title: '平台地址', dataIndex: 'url', ellipsis: true, search: false, copyable: true },
    { title: '用户名', dataIndex: 'username', width: 120, search: false },
    { title: '状态', dataIndex: 'status', width: 80, search: false,
      render: (val) => val ? <Tag color={STATUS_COLORS[String(val)] ?? 'default'}>{String(val)}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 200,
      render: (_, row) => [
        hasComp('publish_jenkinsplatform_connect') && <Tooltip key="test" title="测试连接">
          <Button type="link" size="small" icon={<ApiOutlined />} loading={testingId === row.id} onClick={() => handleTestConnection(row)}>测试</Button>
        </Tooltip>,
        hasComp('publish_jenkinsplatform_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_jenkinsplatform_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteJenkinsPlatform(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<JenkinsPlatform>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('publish_jenkinsplatform_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_jenkinsplatform_delete') ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteJenkinsPlatform(id as number)));
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
            const res = await api.fetchJenkinsPlatforms(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_config_jenkinsplatform', { defaultValue: 'Jenkins配置' })}
        toolBarRender={() => [hasComp('publish_jenkinsplatform_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<JenkinsPlatform>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑Jenkins配置' : '新增Jenkins配置'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ?? { status: 'active' }}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateJenkinsPlatform(editRecord.id, values as any); else await api.createJenkinsPlatform(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormGroup title="基本信息">
          <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="如 company-jenkins" />
          <ProFormText name="display_name" label="显示名称" placeholder="如：公司Jenkins" />
        </ProFormGroup>
        <ProFormGroup title="连接配置">
          <ProFormText name="url" label="平台地址" rules={[{ required: true }]} placeholder="如：https://jenkins.company.com" />
          <ProFormText name="username" label="用户名" rules={[{ required: true }]} placeholder="Jenkins登录用户名" />
          <ProFormText.Password name="password" label="密码/Token" rules={[{ required: true }]} placeholder="Jenkins密码或API Token" />
        </ProFormGroup>
        <ProFormTextArea name="description" label="描述" placeholder="请输入描述" fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }} />
        <ProFormSelect name="status" label="状态" placeholder="请选择状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
      </ModalForm>
    </>
  );
}