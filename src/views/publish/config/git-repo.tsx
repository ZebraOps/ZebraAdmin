import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormGroup, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Tooltip } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, ApiOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/git-repo';
import type { GitPlatform } from '@/service/api/publish/git-repo';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };
const PLATFORM_COLORS: Record<string, string> = { gitlab: 'teal', github: 'blue', gitea: 'orange', custom: 'default' };

export default function PublishConfigGitPlatform() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<GitPlatform | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [testingId, setTestingId] = useState<number | null>(null);

  const handleTestConnection = async (row: GitPlatform) => {
    setTestingId(row.id);
    try {
      const res = await api.testGitPlatformConnection(row.id!);
      message.success((res as any)?.message || '连接成功');
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '连接失败');
    } finally {
      setTestingId(null);
    }
  };

  const columns: ProColumns<GitPlatform>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '显示名称', dataIndex: 'display_name', search: false },
    { title: '平台类型', dataIndex: 'platform_type', width: 100,
      valueEnum: { gitlab: { text: 'GitLab' }, github: { text: 'GitHub' }, gitea: { text: 'Gitea' }, custom: { text: 'Custom' } }
    },
    { title: '平台地址', dataIndex: 'url', ellipsis: true, search: false, copyable: true },
    { title: '状态', dataIndex: 'status', width: 80, search: false,
      render: (val) => val ? <Tag color={STATUS_COLORS[String(val)] ?? 'default'}>{String(val)}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 200,
      render: (_, row) => [
        hasComp('publish_gitplatform_connect') && <Tooltip key="test" title="测试连接">
          <Button type="link" size="small" icon={<ApiOutlined />} loading={testingId === row.id} onClick={() => handleTestConnection(row)}>测试</Button>
        </Tooltip>,
        hasComp('publish_gitplatform_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_gitplatform_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteGitPlatform(row.id!); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<GitPlatform>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('publish_gitplatform_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_gitplatform_delete') ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteGitPlatform(id as number)));
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
            if (params.platform_type) query.platform_type = params.platform_type;
            if (params.status) query.status = params.status;
            const res = await api.fetchGitPlatforms(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_config_gitplatform', { defaultValue: 'Git平台配置' })}
        toolBarRender={() => [hasComp('publish_gitplatform_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增' })}</Button>]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Partial<GitPlatform>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑Git平台配置' : '新增Git平台配置'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={(() => {
            const base = editRecord ?? { platform_type: 'gitlab', auth_type: 'token', status: 'active' };
            if (base.auth_config && typeof base.auth_config === 'string') {
              try { base.auth_config = JSON.parse(base.auth_config); } catch { /* 保持原值 */ }
            }
            return base;
          })()}
        onFinish={async (values) => {
          try {
            // 将 auth_config 嵌套对象序列化为 JSON 字符串，匹配后端 string 类型
            if (values.auth_config && typeof values.auth_config === 'object') {
              values.auth_config = JSON.stringify(values.auth_config);
            }
            if (editRecord?.id) await api.updateGitPlatform(editRecord.id, values as any); else await api.createGitPlatform(values as any);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormGroup title="基本信息">
          <ProFormText name="name" label="名称" rules={[{ required: true }]} placeholder="请输入平台名称，如 company-gitlab" />
          <ProFormText name="display_name" label="显示名称" placeholder="如：公司GitLab" />
          <ProFormSelect name="platform_type" label="平台类型" rules={[{ required: true }]} placeholder="请选择平台类型"
            options={[{ label: 'GitLab', value: 'gitlab' }, { label: 'GitHub', value: 'github' }, { label: 'Gitea', value: 'gitea' }, { label: 'Custom', value: 'custom' }]} />
        </ProFormGroup>
        <ProFormGroup title="连接配置">
          <ProFormText name="url" label="平台地址" rules={[{ required: true }]} placeholder="如：https://gitlab.company.com" />
        </ProFormGroup>
        <ProFormGroup title="认证配置">
          <ProFormSelect name="auth_type" label="认证方式" placeholder="请选择认证方式"
            options={[{ label: 'Token', value: 'token' }]} />
          <ProFormText.Password name={['auth_config', 'token']} label="Access Token" rules={[{ required: true }]} placeholder="请输入平台Access Token" />
        </ProFormGroup>
        <ProFormTextArea name="description" label="描述" placeholder="请输入描述" fieldProps={{ autoSize: { minRows: 2, maxRows: 4 } }} />
        <ProFormSelect name="status" label="状态" placeholder="请选择状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
      </ModalForm>
    </>
  );
}