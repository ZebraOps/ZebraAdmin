import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormTextArea,
  ProFormTreeSelect, ProFormDependency,
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
import { fetchK8sClusters } from '@/service/api/publish/k8s-cluster';
import { fetchLinuxMachines } from '@/service/api/publish/linux-machine';
import { fetchJenkinsCredentials } from '@/service/api/publish/credentials';
import { fetchOrgTree } from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';
import { fetchLanguages } from '@/service/api/publish/language';
import { usePermission } from '@/hooks/usePermission';
import { usePublishStore } from '@/store/publish';

export default function PublishApplications() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const { jenkinsPlatformOptions, gitPlatformOptions, imageRegistryOptions, loadAll, refresh } = usePublishStore();
  useEffect(() => { loadAll(); }, []);
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
  const deployFormRef = useRef<ProFormInstance>(null);
  const [jenkinsCredentialOptions, setJenkinsCredentialOptions] = useState<{ label: string; value: number }[]>([]);
  const [jenkinsCredentialLoading, setJenkinsCredentialLoading] = useState(false);

  // 下拉选项缓存
  const [envOptions, setEnvOptions] = useState<{ label: string; value: number }[]>([]);
  const [buildTplOptions, setBuildTplOptions] = useState<{ label: string; value: number }[]>([]);
  const [deployTplOptions, setDeployTplOptions] = useState<{ label: string; value: number }[]>([]);
  const [repoOptions, setRepoOptions] = useState<{ label: string; value: number }[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);
  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
  const [clusterOptions, setClusterOptions] = useState<{ label: string; value: number }[]>([]);
  const [linuxMachineOptions, setLinuxMachineOptions] = useState<{ label: string; value: number }[]>([]);
  const [repoDataMap, setRepoDataMap] = useState<Map<number, { c_name: string; e_name: string; department: string; language: string; repo_url: string; repo_ssh_url: string; repo_desc: string }>>(new Map());
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
      const [envs, builds, deploys, repos, clusters, linuxMachines] = await Promise.all([
        fetchEnvironments({ size: 200 }),
        fetchBuildTemplates({ size: 200 }),
        fetchDeployTemplates({ size: 200 }),
        fetchRepos({ size: 200 }),
        fetchK8sClusters({ page: 1, size: 200 }),
        fetchLinuxMachines({ page: 1, size: 200 }),
      ]);
      setEnvOptions(((envs as any)?.records ?? []).map((e: any) => ({ label: `${e.name}${e.type ? ` (${e.type})` : ''}`, value: e.id })));
      setBuildTplOptions(((builds as any)?.records ?? []).map((e: any) => ({ label: `${e.name}${e.language ? ` (${e.language})` : ''}`, value: e.id })));
      setDeployTplOptions(((deploys as any)?.records ?? []).map((e: any) => ({ label: `${e.name} (${e.template_type})`, value: e.id })));
      const repoList = (repos as any)?.records ?? [];
      setRepoOptions(repoList.map((e: any) => ({ label: `${e.c_name} (${e.e_name})`, value: e.id })));
      // 缓存仓库的详细信息用于自动填充
      const map = new Map<number, { c_name: string; e_name: string; department: string; language: string; repo_url: string; repo_ssh_url: string; repo_desc: string }>();
      repoList.forEach((r: any) => map.set(r.id, {
        c_name: r.c_name || '',
        e_name: r.e_name || '',
        department: r.repo_department || '',
        language: r.repo_language || '',
        repo_url: r.repo_url || '',
        repo_ssh_url: r.repo_ssh_url || '',
        repo_desc: r.repo_desc || '',
      }));
      setRepoDataMap(map);
      setClusterOptions(((clusters as any)?.records ?? (clusters as any) ?? []).map((e: any) => ({ label: e.name, value: e.id })));
      setLinuxMachineOptions(((linuxMachines as any)?.records ?? (linuxMachines as any) ?? []).map((e: any) => ({ label: `${e.name} (${e.host})`, value: e.id })));
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

  const loadCredentialsByPlatform = async (platformId?: number | null) => {
    if (!platformId) {
      setJenkinsCredentialOptions([]);
      return;
    }

    setJenkinsCredentialLoading(true);
    try {
      const res = await fetchJenkinsCredentials({
        jenkins_platform_id: platformId,
        status: 'active',
        page: 1,
        size: 200,
      });
      const records = (res as any)?.records ?? [];
      setJenkinsCredentialOptions(
        records.map((item: any) => ({
          label: item.display_name || item.credential_id,
          value: item.id,
        })),
      );
    } catch {
      setJenkinsCredentialOptions([]);
    } finally {
      setJenkinsCredentialLoading(false);
    }
  };

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

  useEffect(() => {
    if (!deployFormOpen) return;

    const mode = deployFormRecord?.credential_mode || 'auto_create';
    const platformId = deployFormRecord?.jenkins_platform_id;
    if (mode === 'manual_select' && platformId) {
      loadCredentialsByPlatform(platformId);
      return;
    }
    setJenkinsCredentialOptions([]);
  }, [deployFormOpen, deployFormRecord?.credential_mode, deployFormRecord?.jenkins_platform_id]);

  const findLabel = (
    opts: { label: string; value: number }[],
    v?: number | string | { id?: number | string; value?: number | string; label?: string; name?: string; display_name?: string } | null,
  ) => {
    if (v === null || v === undefined || v === '') return '-';

    if (typeof v === 'object') {
      if (typeof v.label === 'string' && v.label) return v.label;
      if (typeof v.display_name === 'string' && v.display_name) return v.display_name;
      if (typeof v.name === 'string' && v.name) return v.name;

      const objectId = v.id ?? v.value;
      if (objectId !== undefined && objectId !== null && objectId !== '') {
        const idNum = Number(objectId);
        const matched = Number.isNaN(idNum)
          ? undefined
          : opts.find((o) => Number(o.value) === idNum)?.label;
        return matched ?? `#${String(objectId)}`;
      }
      return '-';
    }

    const idNum = Number(v);
    const matched = Number.isNaN(idNum)
      ? undefined
      : opts.find((o) => Number(o.value) === idNum)?.label;
    return matched ?? `#${String(v)}`;
  };

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  const columns: ProColumns<Application>[] = [
    { title: '中文名称', dataIndex: 'c_name', ellipsis: true },
    { title: '英文名称', dataIndex: 'e_name', ellipsis: true },
    {
      title: '关联仓库', dataIndex: 'repo_id', ellipsis: true,
      valueType: 'select',
      fieldProps: { options: repoOptions, showSearch: true, optionFilterProp: 'label', allowClear: true },
      render: (_, row) => findLabel(repoOptions, row.repo_id as number)
    },
    { title: '监听端口', dataIndex: 'listen_port', width: 80, search: false },
    {
      title: '归属部门', dataIndex: 'department', width: 120,
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
    { title: '健康检查类型', dataIndex: 'health_check_type', width: 100, search: false },
    { title: '部署配置数', dataIndex: 'deployment_count', width: 80, search: false, render: (val) => <Tag color={Number(val) > 0 ? 'processing' : 'default'}>{Number(val ?? 0)}</Tag> },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 150, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 200,
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
            refresh();
          }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  const TARGET_LABELS: Record<string, string> = { k8s: 'K8s', docker: 'Docker', linux: 'Linux/Nginx' };
  const TARGET_COLORS: Record<string, string> = { k8s: 'blue', docker: 'cyan', linux: 'green' };

  const hasLinuxDeployPath = deployList.some((item) => item.deploy_target === 'linux');

  const deployColumns: ProColumns<ApplicationDeployment>[] = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '环境', dataIndex: 'environment_id', ellipsis: true,
      render: (val, row) => {
        const assocName = (row as any)?.environment?.name;
        return assocName || findLabel(envOptions, val as number);
      },
    },
    {
      title: '部署目标', dataIndex: 'deploy_target', width: 100,
      render: (val) => {
        const v = String(val ?? 'k8s');
        return <Tag color={TARGET_COLORS[v]}>{TARGET_LABELS[v]}</Tag>;
      },
    },
    { title: '构建源', dataIndex: 'build_source', width: 80, render: (val) => <Tag>{String(val ?? 'tag')}</Tag> },
    {
      title: '构建模板', dataIndex: 'build_template_id', ellipsis: true,
      render: (val, row) => {
        const assocName = (row as any)?.build_template?.name;
        return assocName || findLabel(buildTplOptions, val as number);
      },
    },
    {
      title: '部署模板', dataIndex: 'deployment_template_id', ellipsis: true,
      render: (val, row) => {
        const assocName = (row as any)?.deployment_template?.display_name || (row as any)?.deployment_template?.name;
        return assocName || findLabel(deployTplOptions, val as number);
      },
    },
    {
      title: '目标', ellipsis: true, search: false, render: (_, row) => {
        if (row.deploy_target === 'k8s') return findLabel(clusterOptions, row.k8s_cluster_id as number);
        if (row.deploy_target === 'docker' || row.deploy_target === 'linux') return findLabel(linuxMachineOptions, row.server_id as number);
        return '-';
      },
    },
    ...(hasLinuxDeployPath
      ? [{
          title: '部署路径', width: 180, search: false,
          render: (_: unknown, row: ApplicationDeployment) => row.deploy_target === 'linux' ? row.deploy_path || '-' : '-',
        } as ProColumns<ApplicationDeployment>]
      : []),
    {
      title: 'Jenkins', dataIndex: 'jenkins_platform_id', width: 140, search: false,
      render: (val) => val ? jenkinsPlatformOptions.find(o => o.value === val)?.label ?? `#${val}` : '-',
    },
    {
      title: '凭据模式', dataIndex: 'credential_mode', width: 120, search: false,
      render: (val) => {
        const mode = String(val || 'auto_create');
        return <Tag color={mode === 'manual_select' ? 'gold' : 'green'}>{mode === 'manual_select' ? '手动选择' : '自动创建'}</Tag>;
      },
    },
    {
      title: 'Jenkins凭据', dataIndex: 'jenkins_credential_id', width: 180, search: false,
      render: (val, row) => {
        if (!val) return '-';
        const credentialID = (row as any)?.jenkins_credential?.credential_id;
        return credentialID || `#${val}`;
      },
    },
    {
      title: 'Git平台', dataIndex: 'git_platform_id', width: 140, search: false,
      render: (val) => val ? gitPlatformOptions.find(o => o.value === val)?.label ?? `#${val}` : '-',
    },
    {
      title: '镜像仓库', dataIndex: 'image_repo_id', width: 140, search: false,
      render: (val) => val ? imageRegistryOptions.find(o => o.value === val)?.label ?? `#${val}` : '-',
    },
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
            refresh();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormSelect
          name="repo_id" label="关联仓库" options={repoOptions} showSearch placeholder="请选择关联仓库（自动填充信息）"
          fieldProps={{
            optionFilterProp: 'label',
            onChange: (val) => {
              const data = val ? repoDataMap.get(val as number) : null;
              if (data && formRef.current) {
                formRef.current.setFieldsValue({
                  c_name: data.c_name,
                  e_name: data.e_name,
                  department: data.department,
                  language: data.language,
                  description: data.repo_desc,
                });
              }
            },
          }}
        />
        <ProFormText name="c_name" label="中文名称" rules={[{ required: true }]} placeholder="选择仓库后自动填充，或手动输入" />
        <ProFormText name="e_name" label="英文名称" rules={[{ required: true }]} placeholder="选择仓库后自动填充，或手动输入" />
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
        <ProFormText name="description" label="描述" placeholder="选择仓库后自动填充，或手动输入" />
      </ModalForm>

      {/* 部署配置抽屉 */}
      <Drawer
        title={`部署配置 — ${deployApp?.c_name ?? ''}`}
        placement="right" width="min(1100px, 95vw)"
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
        formRef={deployFormRef}
        modalProps={{ onCancel: () => setDeployFormOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={
          deployFormRecord
            ? { ...deployFormRecord, credential_mode: deployFormRecord.credential_mode || 'auto_create' }
            : { application_id: deployApp?.id, deploy_target: 'k8s', build_source: 'tag', credential_mode: 'auto_create' }
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
          name="deploy_target" label="部署目标" rules={[{ required: true }]} placeholder="请选择部署目标"
          options={[
            { label: 'K8s 部署', value: 'k8s' },
            { label: 'Docker Compose 部署', value: 'docker' },
            { label: 'Linux 文件部署 (Nginx)', value: 'linux' },
          ]}
          initialValue="k8s"
        />
        <ProFormDependency name={['deploy_target']}>
          {({ deploy_target }) => {
            if (deploy_target === 'k8s') {
              return (
                <>
                  <ProFormSelect name="k8s_cluster_id" label="K8s 集群" rules={[{ required: true }]}
                    options={clusterOptions} showSearch fieldProps={{ optionFilterProp: 'label' }}
                    placeholder="请选择K8s集群" />
                  <ProFormText name="k8s_namespace" label="K8s 命名空间" placeholder="default" initialValue="default" />
                </>
              );
            }
            if (deploy_target === 'docker') {
              return (
                <ProFormSelect name="server_id" label="目标服务器" rules={[{ required: true }]}
                  options={linuxMachineOptions} showSearch fieldProps={{ optionFilterProp: 'label' }}
                  placeholder="请选择目标服务器" />
              );
            }
            if (deploy_target === 'linux') {
              return (
                <>
                  <ProFormSelect name="server_id" label="目标服务器" rules={[{ required: true }]}
                    options={linuxMachineOptions} showSearch fieldProps={{ optionFilterProp: 'label' }}
                    placeholder="请选择目标服务器" />
                  <ProFormText name="deploy_path" label="部署路径" rules={[{ required: true }]}
                    placeholder="/opt/zebra-deploy/my-app"
                    tooltip="文件将被放置在此目录，由 Nginx 代理服务" />
                </>
              );
            }
            return null;
          }}
        </ProFormDependency>
        <ProFormSelect
          name="build_source" label="构建源" rules={[{ required: true }]} placeholder="请选择构建源"
          options={[{ label: 'Git Tag', value: 'tag' }, { label: 'Git Branch', value: 'branch' }]}
        />
        <ProFormSelect name="build_template_id" label="构建模板" options={buildTplOptions} showSearch placeholder="请选择构建模板" fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormSelect name="deployment_template_id" label="部署模板" options={deployTplOptions} showSearch placeholder="请选择部署模板" fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormSelect
          name="credential_mode" label="凭据模式" rules={[{ required: true }]} placeholder="请选择凭据模式"
          options={[
            { label: '自动创建', value: 'auto_create' },
            { label: '手动选择', value: 'manual_select' },
          ]}
          fieldProps={{
            onChange: (mode) => {
              if (mode !== 'manual_select') {
                setJenkinsCredentialOptions([]);
                deployFormRef.current?.setFieldsValue({ jenkins_credential_id: undefined });
              }
            },
          }}
        />
        <ProFormSelect
          name="jenkins_platform_id" label="Jenkins 平台" placeholder="不选则使用全局配置"
          options={jenkinsPlatformOptions} showSearch allowClear
          fieldProps={{
            optionFilterProp: 'label',
            onChange: (platformId) => {
              deployFormRef.current?.setFieldsValue({ jenkins_credential_id: undefined });
              const mode = deployFormRef.current?.getFieldValue('credential_mode');
              if (mode === 'manual_select') {
                loadCredentialsByPlatform(platformId as number | undefined);
              }
            },
          }}
        />
        <ProFormDependency name={['credential_mode', 'jenkins_platform_id']}>
          {({ credential_mode, jenkins_platform_id }) => {
            if (credential_mode !== 'manual_select') {
              return null;
            }
            return (
              <ProFormSelect
                name="jenkins_credential_id"
                label="Jenkins 凭据"
                rules={[{ required: true, message: '手动选择模式必须指定 Jenkins 凭据' }]}
                options={jenkinsCredentialOptions}
                showSearch
                disabled={!jenkins_platform_id}
                placeholder={jenkins_platform_id ? '请选择 Jenkins 凭据' : '请先选择 Jenkins 平台'}
                fieldProps={{ optionFilterProp: 'label', loading: jenkinsCredentialLoading }}
              />
            );
          }}
        </ProFormDependency>
        <ProFormSelect
          name="git_platform_id" label="Git 平台" placeholder="不选则使用全局配置"
          options={gitPlatformOptions} showSearch allowClear
          fieldProps={{ optionFilterProp: 'label' }}
        />
        <ProFormSelect
          name="image_repo_id" label="镜像仓库" placeholder="不选则使用全局配置"
          options={imageRegistryOptions} showSearch allowClear
          fieldProps={{ optionFilterProp: 'label' }}
        />
        <ProFormTextArea name="description" label="描述" fieldProps={{ rows: 3, placeholder: '请输入描述' }} />
      </ModalForm>
    </>
  );
}