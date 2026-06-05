import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect,
  ProFormTreeSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Space, Modal, Popconfirm, Tabs } from 'antd';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, LinkOutlined, AppstoreOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/deploy-template';
import type { DeployTemplate } from '@/service/api/publish/deploy-template';
import type { LinkedApplication } from '@/service/api/publish/build-template';
import { fetchApplications } from '@/service/api/publish/applications';
import { fetchLanguages } from '@/service/api/publish/language';
import { fetchOrgTree } from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';
import CodeEditor from '@/components/CodeEditor';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

interface DeployTemplateHistoryItem {
  id: number;
  deployment_template_id?: number;
  modifier?: string;
  name?: string;
  display_name?: string;
  description?: string;
  template_type?: string;
  content?: string;
  variables?: string;
  version?: string;
  change_reason?: string;
  created_at?: string;
}

export default function PublishTemplatesDeployment() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<any>(null);
  const [editRecord, setEditRecord] = useState<DeployTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);

  // Monaco 编辑器的值（ProForm 不直接支持 Monaco，需要手动管理）
  const [contentValue, setContentValue] = useState('');
  const [variablesValue, setVariablesValue] = useState('');

  // URL 参数中的模板名称（用于预填搜索）
  const urlTemplateName = searchParams.get('name');

  // 打开编辑时，加载 Monaco 值
  const handleOpenModal = (record: DeployTemplate | null) => {
    setEditRecord(record);
    setContentValue(record?.content ?? '');
    setVariablesValue(record?.variables ?? '');
    setModalOpen(true);
  };

  function toDeptTreeSelectData(nodes: OrgNode[]): any[] {
    return nodes.map(n => ({
      title: n.org_name, value: n.org_name,
      children: n.children?.length ? toDeptTreeSelectData(n.children) : undefined,
    }));
  }

  // 历史抽屉
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTpl, setHistoryTpl] = useState<DeployTemplate | null>(null);
  const [historyList, setHistoryList] = useState<DeployTemplateHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 关联应用
  const [appsOpen, setAppsOpen] = useState(false);
  const [appsTpl, setAppsTpl] = useState<DeployTemplate | null>(null);
  const [linkedApps, setLinkedApps] = useState<LinkedApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [associateAppId, setAssociateAppId] = useState<number | undefined>();
  const [allApps, setAllApps] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    fetchLanguages({ size: 200 }).then((res) => {
      setLanguageOptions(((res as any)?.records ?? []).map((e: any) => ({
        label: e.display_name || e.name,
        value: e.name,
      })));
    }).catch(() => {});
    fetchOrgTree().then((res) => {
      setOrgTreeData((res as any) ?? []);
    }).catch(() => {});
  }, []);

  // 处理 URL 参数：设置表单值（request 函数会自动使用 urlTemplateName）
  useEffect(() => {
    if (urlTemplateName && formRef.current?.setFieldsValue) {
      formRef.current.setFieldsValue({ name: urlTemplateName });
    }
  }, [urlTemplateName]);

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  const loadHistory = async (tpl: DeployTemplate, page?: number, size?: number) => {
    setHistoryLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: page ?? 1,
        size: size ?? 20,
      };
      const res = await api.fetchDeployTemplateHistory(tpl.id, params);
      const records = (res as any)?.records ?? (Array.isArray(res) ? res : []);
      setHistoryList(records);
      return { data: records, total: (res as any)?.total ?? 0 };
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取历史失败');
      setHistoryList([]);
      return { data: [], total: 0 };
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadLinkedApps = async (tpl: DeployTemplate) => {
    setAppsLoading(true);
    try {
      const res = await api.fetchDeployTemplateApplications(tpl.id);
      setLinkedApps((res as any) ?? []);
    } catch (e: any) {
      if (!isHandledError(e)) message.error('获取关联应用失败');
      setLinkedApps([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!appsTpl || !associateAppId) {
      message.warning('请选择应用');
      return;
    }
    try {
      await api.associateDeployTemplateApp(appsTpl.id, associateAppId);
      message.success('关联成功');
      setAssociateOpen(false);
      setAssociateAppId(undefined);
      await loadLinkedApps(appsTpl);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '关联失败');
    }
  };

  const columns: ProColumns<DeployTemplate>[] = [
    { title: '模板名称', dataIndex: 'name', ellipsis: true },
    { title: '显示名称', dataIndex: 'display_name', ellipsis: true, search: false },
    {
      title: '类型', dataIndex: 'template_type', width: 100,
      valueType: 'select',
      valueEnum: { k8s: { text: 'K8S' }, helm: { text: 'HELM' }, docker: { text: 'DOCKER' }, linux: { text: 'LINUX/NGINX' } },
      render: (_, row) => row.template_type ? <Tag>{String(row.template_type).toUpperCase()}</Tag> : '-'
    },
    { title: '版本', dataIndex: 'version', width: 70, search: false },
    {
      title: '状态', dataIndex: 'status', width: 80,
      valueType: 'select',
      valueEnum: { active: { text: '激活' }, inactive: { text: '停用' } },
      render: (_, row) => row.status ? <Tag color={STATUS_COLORS[String(row.status)] ?? 'default'}>{String(row.status)}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    {
      title: '归属部门', dataIndex: 'department', width: 120,
      search: { transform: (val) => val },
      render: (_, row) => row.department || '-',
      renderFormItem: () => (
        <ProFormTreeSelect name="department"
          fieldProps={{ treeData: toDeptTreeSelectData(orgTreeData), allowClear: true, placeholder: '请选择部门', treeDefaultExpandAll: true, showSearch: true, treeNodeFilterProp: 'title' }} />
      ),
    },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 240,
      render: (_, row) => [
        <Button key="apps" type="link" size="small" icon={<AppstoreOutlined />}
          onClick={() => { setAppsTpl(row); setAppsOpen(true); loadLinkedApps(row); }}
        >应用</Button>,
        <Button key="history" type="link" size="small" icon={<HistoryOutlined />}
          onClick={() => { setHistoryTpl(row); setHistoryOpen(true); loadHistory(row); }}
        >历史</Button>,
        hasComp('publish_deploy_template_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => handleOpenModal(row)}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_deploy_template_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => {
            await api.deleteDeployTemplate(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  const historyColumns: ProColumns<DeployTemplateHistoryItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '修改人', dataIndex: 'modifier', width: 100 },
    { title: '版本', dataIndex: 'version', width: 80 },
    { title: '修改原因', dataIndex: 'change_reason', ellipsis: true },
    {
      title: '模板内容', dataIndex: 'content', width: 80, search: false,
      render: (val) => val ? <Tag color="blue">已变更</Tag> : <Tag>无</Tag>,
    },
    {
      title: '变量', dataIndex: 'variables', width: 80, search: false,
      render: (val) => val ? <Tag color="purple">已变更</Tag> : <Tag>无</Tag>,
    },
    { title: '修改时间', dataIndex: 'created_at', valueType: 'dateTime', width: 150 },
    {
      title: '操作', key: 'actions', valueType: 'option', width: 80,
      render: (_, row) => [
        hasComp('publish_deploy_template_rollback') && <Popconfirm key="rollback" title={`确认回退到历史版本 #${row.id}？当前内容将被替换。`}
          onConfirm={async () => {
            try {
              await api.rollbackDeployTemplate(historyTpl!.id, row.id);
              message.success('回退成功');
              loadHistory(historyTpl!);
              actionRef.current?.reload();
            } catch (e: any) { if (!isHandledError(e)) message.error(e?.message || '回退失败'); }
          }}>
          <Button type="link" size="small" icon={<UndoOutlined />}>回退</Button>
        </Popconfirm>,
      ].filter(Boolean),
    },
  ];

  return (
    <>
      <ProTable<DeployTemplate>
        rowKey="id" actionRef={actionRef} formRef={formRef} columns={columns}
        rowSelection={hasComp('publish_deploy_template_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_deploy_template_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteDeployTemplate(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}
        request={async (params) => {
          try {
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            // 如果 URL 参数中有 name 且 params.name 为空，使用 URL 参数
            const searchName = params.name || urlTemplateName;
            if (searchName) query.name = searchName;
            if (params.template_type) query.template_type = params.template_type;
            if (params.status) query.status = params.status;
            if (params.department) query.department = params.department;
            const res = await api.fetchDeployTemplates(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_templates_deployment', { defaultValue: '部署模板' })}
        toolBarRender={() => [
          hasComp('publish_deploy_template_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>
            {t('common.add', { defaultValue: '新增' })}
          </Button>
        ]}
        search={{
          labelWidth: 80,
          onReset: () => {
            // 重置时清除 URL 参数
            if (urlTemplateName) {
              navigate(location.pathname, { replace: true });
            }
          },
        }}
        scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<DeployTemplate>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑部署模板' : '新增部署模板'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '', destroyOnClose: true }}
        initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            // 把 Monaco 编辑器的值合并到表单数据中
            const submitData = { ...values, content: contentValue, variables: variablesValue };
            if (editRecord?.id) await api.updateDeployTemplate(editRecord.id, submitData as any);
            else await api.createDeployTemplate(submitData as any);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="name" label="模板名称" rules={[{ required: true }]} placeholder="请输入模板名称" />
        <ProFormText name="display_name" label="显示名称" placeholder="请输入显示名称" />
        <ProFormSelect name="template_type" label="模板类型" placeholder="请选择模板类型"
          options={[{ label: 'K8s YAML', value: 'k8s' }, { label: 'Helm Chart', value: 'helm' }, { label: 'Docker Compose', value: 'docker' }, { label: 'Linux/Nginx 配置', value: 'linux' }]} />
        <ProFormText name="version" label="版本" placeholder="1.0" />
        <ProFormSelect name="status" label="状态" placeholder="请选择状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]} initialValue="active" />
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>模板内容</div>
          <div style={{ color: '#888', fontSize: 12, lineHeight: 1.5 }}>
            K8s YAML / Helm Chart / Docker Compose / Linux/Nginx 部署模板。支持占位符替换：<code>{'{{IMAGE_TAG}}'}</code> <code>{'{{NAMESPACE}}'}</code> <code>{'{{PROJECT_NAME}}'}</code> <code>{'{{ENV_NAME}}'}</code> <code>{'{{DEPLOYMENT_NAME}}'}</code> <code>{'{{DEPLOY_PATH}}'}</code>
          </div>
        </div>
        <CodeEditor
          value={contentValue}
          onChange={setContentValue}
          language="yaml"
          height="280px"
          showToolbar
          placeholder={`apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: {{PROJECT_NAME}}\nspec:\n  replicas: 1\n  template:\n    spec:\n      containers:\n        - name: {{PROJECT_NAME}}\n          image: {{IMAGE_TAG}}`}
        />
        <div style={{ marginTop: 16, marginBottom: 4 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>变量定义</div>
          <div style={{ color: '#888', fontSize: 12, lineHeight: 1.5 }}>
            定义模板变量键值对，用于文档说明和变量默认值记录。格式为 JSON，如 <code>{"{ \"IMAGE_TAG\": \"latest\", \"NAMESPACE\": \"default\" }"}</code>
          </div>
        </div>
        <CodeEditor
          value={variablesValue}
          onChange={setVariablesValue}
          language="json"
          height="200px"
          showToolbar
          placeholder={`{"IMAGE_TAG": "latest", "NAMESPACE": "default", "PROJECT_NAME": "my-app", "ENV_NAME": "dev"}`}
        />
        <ProFormText name="description" label="描述" placeholder="请输入描述" />
        <ProFormTreeSelect name="department" label="归属部门" placeholder="请选择部门"
          fieldProps={{ treeData: toDeptTreeSelectData(orgTreeData), allowClear: true, treeDefaultExpandAll: true, showSearch: true, treeNodeFilterProp: 'title' }} />
      </ModalForm>

      {/* 历史抽屉 */}
      <Drawer
        title={`修改历史 — ${historyTpl?.name ?? ''}`}
        placement="right" width="min(900px, 95vw)"
        open={historyOpen} onClose={() => setHistoryOpen(false)} destroyOnClose
      >
        <ProTable<DeployTemplateHistoryItem>
          rowKey="id" search={false} columns={historyColumns}
          dataSource={historyList} loading={historyLoading}
          pagination={{ pageSize: 20 }} options={false}
          expandable={{
            expandedRowRender: (record) => (
              <Tabs
                items={[
                  {
                    key: 'content',
                    label: '模板内容',
                    children: <CodeEditor value={record.content || ''} readOnly language="yaml" height="300px" showToolbar />,
                  },
                  {
                    key: 'variables',
                    label: '变量',
                    children: <CodeEditor value={record.variables || ''} readOnly language="json" height="300px" showToolbar />,
                  },
                ]}
              />
            ),
          }}
        />
      </Drawer>

      {/* 关联应用 Drawer */}
      <Drawer
        title={`关联应用 — ${appsTpl?.name ?? ''}`}
        placement="right" width="min(900px, 95vw)"
        open={appsOpen} onClose={() => setAppsOpen(false)} destroyOnClose
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              fetchApplications({ size: 200 }).then((res) => {
                setAllApps(((res as any)?.records ?? []).map((e: any) => ({ label: `${e.c_name} (${e.e_name})`, value: e.id })));
                setAssociateOpen(true);
              });
            }}>关联应用</Button>
          </Space>
        }
      >
        <ProTable
          rowKey="id" search={false} columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            { title: '中文名称', dataIndex: 'c_name' },
            { title: '英文名称', dataIndex: 'e_name' },
            { title: '部门', dataIndex: 'department', width: 120 },
            { title: '语言', dataIndex: 'language', width: 100 },
            { title: '监听端口', dataIndex: 'listen_port', width: 90 },
            { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160 },
            { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 110, render: (_, row) => [
              <Popconfirm key="del" title="确认取消关联？" onConfirm={async () => {
                  if (!appsTpl) return;
                  try {
                    await api.disassociateDeployTemplateApp(appsTpl.id, row.id);
                    message.success('已取消关联');
                    await loadLinkedApps(appsTpl);
                  } catch (e: any) {
                    if (!isHandledError(e)) message.error(e?.message || '操作失败');
                  }
                }}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>取消关联</Button>
              </Popconfirm>
            ]}
          ]}
          dataSource={linkedApps} loading={appsLoading}
          pagination={{ pageSize: 20 }} options={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 选择应用进行关联 */}
      <Modal
        title="选择关联应用"
        open={associateOpen}
        onCancel={() => { setAssociateOpen(false); setAssociateAppId(undefined); }}
        onOk={handleAssociate} okText="确认关联"
        destroyOnClose
      >
        <ProFormSelect
          label="应用" name="appId" options={allApps}
          showSearch
          fieldProps={{ optionFilterProp: 'label', value: associateAppId, onChange: (v) => setAssociateAppId(v as number) }}
        />
      </Modal>
    </>
  );
}