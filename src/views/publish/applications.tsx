import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea,
  ProFormTreeSelect,
  type ActionType, type ProColumns, type ProFormInstance
} from '@ant-design/pro-components';
import { Button, message, Drawer, Tag, Space, Popconfirm } from 'antd';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/applications';
import type {
  Application, ApplicationDeployment, ApplicationDeploymentRequest,
} from '@/service/api/publish/applications';
import { fetchEnvironments } from '@/service/api/publish/environment';
import { fetchBuildTemplates } from '@/service/api/publish/build-template';
import { fetchDeployTemplates } from '@/service/api/publish/deploy-template';
import { fetchRepos } from '@/service/api/publish/repos';
import { fetchOrgTree } from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';
import { fetchLanguages } from '@/service/api/publish/language';
import { usePermission } from '@/hooks/usePermission';

export default function PublishApplications() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Application | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 部署配置抽屉
  const [deployDrawerOpen, setDeployDrawerOpen] = useState(false);
  const [deployApp, setDeployApp] = useState<Application | null>(null);
  const [deployList, setDeployList] = useState<ApplicationDeployment[]>([]);
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployFormOpen, setDeployFormOpen] = useState(false);
  const [deployFormRecord, setDeployFormRecord] = useState<ApplicationDeployment | null>(null);

  // 下拉选项缓存
  const [envOptions, setEnvOptions] = useState<{ label: string; value: number }[]>([]);
  const [buildTplOptions, setBuildTplOptions] = useState<{ label: string; value: number }[]>([]);
  const [deployTplOptions, setDeployTplOptions] = useState<{ label: string; value: number }[]>([]);
  const [repoOptions, setRepoOptions] = useState<{ label: string; value: number }[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);
  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
  const [repoDataMap, setRepoDataMap] = useState<Map<number, { department: string; language: string }>>(new Map());
  const formRef = useRef<ProFormInstance>(null);

  function toDeptTreeSelectData(nodes: OrgNode[]): any[] {
    return nodes.map(n => ({
      title: n.org_name, value: n.org_name,
      children: n.children?.length ? toDeptTreeSelectData(n.children) : undefined,
    }));
  }

  // 加载下拉数据
  const loadOptions = async () => {
    try {
      const [envs, builds, deploys, repos] = await Promise.all([
        fetchEnvironments({ size: 200 }),
        fetchBuildTemplates({ size: 200 }),
        fetchDeployTemplates({ size: 200 }),
        fetchRepos({ size: 200 }),
      ]);
      setEnvOptions(((envs as any)?.records ?? []).map((e: any) => ({ label: `${e.name}${e.type ? ` (${e.type})` : ''}`, value: e.id })));
      setBuildTplOptions(((builds as any)?.records ?? []).map((e: any) => ({ label: `${e.name}${e.language ? ` (${e.language})` : ''}`, value: e.id })));
      setDeployTplOptions(((deploys as any)?.records ?? []).map((e: any) => ({ label: e.display_name || e.name, value: e.id })));
      const repoList = (repos as any)?.records ?? [];
      setRepoOptions(repoList.map((e: any) => ({ label: `${e.c_name} (${e.e_name})`, value: e.id })));
      // 缓存仓库的部门、语言信息用于自动填充
      const map = new Map<number, { department: string; language: string }>();
      repoList.forEach((r: any) => map.set(r.id, { department: r.repo_department || '', language: r.repo_language || '' }));
      setRepoDataMap(map);
      fetchOrgTree().then((res) => {
        setOrgTreeData((res as any) ?? []);
      }).catch(() => {});
      fetchLanguages({ size: 200 }).then((res) => {
        setLanguageOptions(((res as any)?.records ?? []).map((e: any) => ({
          label: e.display_name || e.name,
          value: e.name,
        })));
      }).catch(() => {});
    } catch { /* ignore */ }
  };

  useEffect(() => { loadOptions(); }, []);

  const loadDeployments = async (appId: number) => {
    setDeployLoading(true);
    try {
      const list = await api.listApplicationDeployments(appId);
      setDeployList(Array.isArray(list) ? list : []);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取部署配置失败');
      setDeployList([]);
    } finally {
      setDeployLoading(false);
    }
  };

  const handleViewDeployments = async (row: Application) => {
    setDeployApp(row);
    setDeployDrawerOpen(true);
    await loadDeployments(row.id);
  };

  const findLabel = (opts: { label: string; value: number }[], v?: number | null) =>
    opts.find(o => o.value === v)?.label ?? (v ? `#${v}` : '-');

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  const columns: ProColumns<Application>[] = [
    { title: '中文名称', dataIndex: 'c_name', width: 150 },
    { title: '英文名称', dataIndex: 'e_name', width: 150 },
    {
      title: '关联仓库', dataIndex: 'repo_id', width: 200,
      valueType: 'select',
      fieldProps: { options: repoOptions, showSearch: true, optionFilterProp: 'label', allowClear: true },
      render: (_, row) => findLabel(repoOptions, row.repo_id as number)
    },
    { title: '监听端口', dataIndex: 'listen_port', width: 90, search: false },
    {
      title: '归属部门', dataIndex: 'department', width: 140,
      search: { transform: (val) => val },
      render: (_, row) => row.department || '-',
      renderFormItem: () => (
        <ProFormTreeSelect
          name="department"
          fieldProps={{
            treeData: toDeptTreeSelectData(orgTreeData),
            allowClear: true, placeholder: '请选择部门',
            treeDefaultExpandAll: true,
            showSearch: true,
            treeNodeFilterProp: 'title',
          }}
        />
      ),
    },
    {
      title: '开发语言', dataIndex: 'language', width: 100,
      valueType: 'select', valueEnum: languageEnum,
    },
    { title: '健康检查类型', dataIndex: 'health_check_type', width: 120, search: false },
    { title: '部署配置数', dataIndex: 'deployment_count', width: 110, search: false, render: (val) => <Tag color={Number(val) > 0 ? 'processing' : 'default'}>{Number(val ?? 0)}</Tag> },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 240,
      render: (_, row) => [
        <Button
          key="deploys" type="link" size="small" icon={<AppstoreOutlined />}
          onClick={() => handleViewDeployments(row)}
        >部署配置</Button>,
        hasComp('publish_app_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setModalOpen(true); }}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_app_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => {
            await api.deleteApplication(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  const deployColumns: ProColumns<ApplicationDeployment>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '环境', dataIndex: 'environment_id', width: 160, render: (val) => findLabel(envOptions, val as number) },
    { title: '构建源', dataIndex: 'build_source', width: 90, render: (val) => <Tag>{String(val ?? 'tag')}</Tag> },
    { title: '构建模板', dataIndex: 'build_template_id', width: 180, render: (val) => findLabel(buildTplOptions, val as number) },
    { title: '部署模板', dataIndex: 'deployment_template_id', width: 180, render: (val) => findLabel(deployTplOptions, val as number) },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 130,
      render: (_, row) => [
        hasComp('publish_app_deploy_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setDeployFormRecord(row); setDeployFormOpen(true); }}
        >编辑</Button>,
        hasComp('publish_app_deploy_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => {
            await api.deleteApplicationDeployment(row.id);
            message.success('删除成功');
            if (deployApp) await loadDeployments(deployApp.id);
            actionRef.current?.reload();
          }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Application>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('publish_app_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_app_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteApplication(id as number)));
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
            const query: Record<string, unknown> = {};
            if (params.repo_id) query.id = params.repo_id;
            if (params.department) query.department = params.department;
            if (params.language) query.language = params.language;
            const res = await api.fetchApplications(query);
            const list: Application[] = Array.isArray(res) ? (res as any) : ((res as any)?.records ?? []);
            // 前端再做 c_name / e_name 模糊过滤
            const filtered = list.filter(a =>
              (!params.c_name || (a.c_name || '').includes(String(params.c_name))) &&
              (!params.e_name || (a.e_name || '').includes(String(params.e_name)))
            );
            return { data: filtered, success: true, total: filtered.length };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_applications', { defaultValue: '应用管理' })}
        toolBarRender={() => [
          hasComp('publish_app_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>
            {t('common.add', { defaultValue: '新增应用' })}
          </Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<Application>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑应用' : '新增应用'}
        open={modalOpen} onOpenChange={setModalOpen}
        formRef={formRef}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateApplication(editRecord.id, values);
            else await api.createApplication(values as any);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="c_name" label="中文名称" rules={[{ required: true }]} placeholder="请输入中文名称" />
        <ProFormText name="e_name" label="英文名称" rules={[{ required: true }]} placeholder="请输入英文名称" />
        <ProFormSelect
          name="repo_id" label="关联仓库" options={repoOptions} showSearch placeholder="请选择关联仓库"
          fieldProps={{
            optionFilterProp: 'label',
            onChange: (val) => {
              const data = val ? repoDataMap.get(val as number) : null;
              if (data) {
                formRef.current?.setFieldsValue({ department: data.department, language: data.language });
              }
            },
          }}
        />
        <ProFormTreeSelect
          name="department" label="归属部门"
          fieldProps={{
            treeData: toDeptTreeSelectData(orgTreeData),
            allowClear: true, placeholder: '选择仓库后自动填充',
            treeDefaultExpandAll: true,
            showSearch: true,
            treeNodeFilterProp: 'title',
          }}
        />
        <ProFormSelect
          name="language" label="开发语言"
          options={languageOptions} showSearch
          fieldProps={{ optionFilterProp: 'label', placeholder: '选择仓库后自动填充' }}
        />
        <ProFormDigit name="listen_port" label="监听端口" min={1} max={65535} placeholder="请输入监听端口" />
        <ProFormSelect
          name="health_check_type" label="健康检查类型" placeholder="请选择健康检查类型"
          options={[{ label: 'HTTP', value: 'http' }, { label: 'TCP', value: 'tcp' }, { label: '自定义', value: 'custom' }]}
        />
        <ProFormText name="health_check_url" label="健康检查URL" placeholder="/health" />
        <ProFormText name="description" label="描述" placeholder="请输入描述" />
      </ModalForm>

      {/* 部署配置抽屉 */}
      <Drawer
        title={`部署配置 — ${deployApp?.c_name ?? ''}`}
        placement="right" width={1100}
        open={deployDrawerOpen}
        onClose={() => setDeployDrawerOpen(false)}
        destroyOnClose
        extra={
          <Space>
            {hasComp('publish_app_deploy_add') && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setDeployFormRecord(null); setDeployFormOpen(true); }}>
              新增部署配置
            </Button>}
          </Space>
        }
      >
        <ProTable<ApplicationDeployment>
          rowKey="id" search={false} columns={deployColumns}
          dataSource={deployList} loading={deployLoading}
          pagination={{ pageSize: 20 }} options={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 部署配置表单 */}
      <ModalForm<ApplicationDeploymentRequest>
        key={`deploy-${deployFormRecord?.id ?? 'new'}`}
        title={deployFormRecord ? '编辑部署配置' : '新增部署配置'}
        open={deployFormOpen} onOpenChange={setDeployFormOpen}
        modalProps={{ onCancel: () => setDeployFormOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={
          deployFormRecord
            ? { ...deployFormRecord }
            : { application_id: deployApp?.id, build_source: 'tag' }
        }
        onFinish={async (values) => {
          try {
            const data: ApplicationDeploymentRequest = {
              ...values,
              application_id: deployApp?.id ?? values.application_id,
            };
            if (deployFormRecord?.id) await api.updateApplicationDeployment(deployFormRecord.id, data);
            else await api.createApplicationDeployment(data);
            message.success('保存成功');
            if (deployApp) await loadDeployments(deployApp.id);
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormDigit name="application_id" label="应用ID" disabled fieldProps={{ precision: 0 }} />
        <ProFormSelect name="environment_id" label="环境" rules={[{ required: true }]} placeholder="请选择环境" options={envOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormSelect
          name="build_source" label="构建源" rules={[{ required: true }]} placeholder="请选择构建源"
          options={[{ label: 'Git Tag', value: 'tag' }, { label: 'Git Branch', value: 'branch' }]}
        />
        <ProFormSelect name="build_template_id" label="构建模板" options={buildTplOptions} showSearch placeholder="请选择构建模板" fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormSelect name="deployment_template_id" label="部署模板" options={deployTplOptions} showSearch placeholder="请选择部署模板" fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormTextArea name="description" label="描述" fieldProps={{ rows: 3, placeholder: '请输入描述' }} />
      </ModalForm>
    </>
  );
}
