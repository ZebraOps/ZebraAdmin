import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDependency, ProFormInstance,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Card } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, DeleteOutlined, EyeOutlined, RedoOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import * as api from '@/service/api/publish/deploy-task';
import type { DeployTask, CreateDeployTaskRequest } from '@/service/api/publish/deploy-task';
import * as deployApi from '@/service/api/publish/applications';
import type { ApplicationDeployment } from '@/service/api/publish/applications';
import { fetchRepoBranches, fetchRepoTags } from '@/service/api/publish/repos';
import { listK8sNamespaces } from '@/service/api/publish/k8s-cluster';
import { usePermission } from '@/hooks/usePermission';
import { usePublishStore } from '@/store/publish';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:   { color: 'default',    label: '等待中' },
  BUILDING:  { color: 'processing', label: '构建中' },
  PUSHING:   { color: 'processing', label: '推送中' },
  DEPLOYING: { color: 'warning',    label: '部署中' },
  SUCCESS:   { color: 'success',    label: '成功'   },
  FAILED:    { color: 'error',      label: '失败'   },
};

const TARGET_LABELS: Record<string, string> = { k8s: 'K8s', docker: 'Docker', linux: 'Linux/Nginx' };
const TARGET_COLORS: Record<string, string> = { k8s: 'blue', docker: 'cyan', linux: 'green' };

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED']);
const POLL_INTERVAL = 5000;

export default function PublishTasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasActive, setHasActive] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 下拉选项（来自共享 store）
  const { appOptions, envOptions, clusterOptions, linuxMachineOptions, apps, loadAll } = usePublishStore();
  useEffect(() => { loadAll(); }, []);

  const getAppEName = (appId: number) => apps.find(a => a.id === appId)?.e_name ?? '';

  // 自动轮询非终态任务
  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => actionRef.current?.reload(), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [hasActive]);

  // 基本信息：应用、环境选择
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [selectedEnvId, setSelectedEnvId] = useState<number | undefined>(undefined);

  // 构建配置：模板、分支/标签
  const [buildTemplateOptions, setBuildTemplateOptions] = useState<{ label: string; value: number }[]>([]);
  const [deployTemplateOptions, setDeployTemplateOptions] = useState<{ label: string; value: number }[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [branchOptions, setBranchOptions] = useState<{ label: string; value: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string }[]>([]);
  const [gitRefLoading, setGitRefLoading] = useState(false);

  // 部署配置自动填充
  const [deploymentConfigs, setDeploymentConfigs] = useState<ApplicationDeployment[]>([]);

  // 部署目标：命名空间动态加载
  const [namespaceOptions, setNamespaceOptions] = useState<{ label: string; value: string }[]>([]);
  const [namespaceLoading, setNamespaceLoading] = useState(false);

  const formRef = useRef<ProFormInstance<CreateDeployTaskRequest>>(null);

  // 选择应用后：加载模板 + 分支/标签
  useEffect(() => {
    if (!selectedProjectId) {
      setBuildTemplateOptions([]);
      setDeployTemplateOptions([]);
      setBranchOptions([]);
      setTagOptions([]);
      return;
    }
    setTemplateLoading(true);
    setGitRefLoading(true);
    loadTemplates(selectedProjectId).then((opts) => {
      setBuildTemplateOptions(opts.builds);
      setDeployTemplateOptions(opts.deploys);
      setTemplateLoading(false);
    });
    Promise.all([fetchRepoBranches(selectedProjectId), fetchRepoTags(selectedProjectId)])
      .then(([branchesRes, tagsRes]) => {
        const branches = Array.isArray(branchesRes) ? branchesRes : [];
        const tags = Array.isArray(tagsRes) ? tagsRes : [];
        setBranchOptions(branches.map((b: string) => ({ label: b, value: b })));
        setTagOptions(tags.map((t: string) => ({ label: t, value: t })));
        setGitRefLoading(false);
      })
      .catch(() => {
        setBranchOptions([]);
        setTagOptions([]);
        setGitRefLoading(false);
      });
  }, [selectedProjectId]);

  // 选择应用+环境后：加载部署配置
  useEffect(() => {
    if (!selectedProjectId || !selectedEnvId) {
      setDeploymentConfigs([]);
      return;
    }
    deployApi.lookupDeploymentsByAppAndEnv(selectedProjectId, selectedEnvId).then((res) => {
      const configs = Array.isArray(res) ? res : (res as any)?.records ?? [];
      setDeploymentConfigs(configs as ApplicationDeployment[]);
    }).catch(() => setDeploymentConfigs([]));
  }, [selectedProjectId, selectedEnvId]);

  const findLabel = (opts: { label: string; value: number | string }[], v?: number) =>
    opts.find((o) => o.value === v)?.label ?? (v ? `#${v}` : '-');

  const loadTemplates = async (appId: number): Promise<{ builds: { label: string; value: number }[]; deploys: { label: string; value: number }[] }> => {
    try {
      const res = await api.getAvailableTemplates(appId);
      const builds = res?.build_templates ?? [];
      const deploys = res?.deployment_templates ?? [];
      const buildOpts = builds.map((t: any) => ({ label: `${t.name}${t.language ? ` (${t.language})` : ''}`, value: t.id }));
      const deployOpts = deploys.map((t: any) => ({ label: `${t.name}${t.display_name ? ` (${t.display_name})` : ''}`, value: t.id }));
      if (buildOpts.length === 0 && deployOpts.length === 0) {
        message.info('该应用关联的仓库没有配置构建/部署模板，将使用默认模板');
      }
      return { builds: buildOpts, deploys: deployOpts };
    } catch (e: any) {
      console.error('加载模板失败:', e);
      if (!isHandledError(e)) message.warning('加载模板失败，请确认已部署最新版后端');
      return { builds: [], deploys: [] };
    }
  };

  // 动态加载命名空间
  const loadNamespaces = async (clusterId: number) => {
    setNamespaceLoading(true);
    try {
      const res = await listK8sNamespaces(clusterId);
      const nsList = Array.isArray(res) ? res : [];
      setNamespaceOptions(nsList.map((ns: string) => ({ label: ns, value: ns })));
    } catch {
      setNamespaceOptions([]);
      // 不强制报错，命名空间可以手动输入
    } finally {
      setNamespaceLoading(false);
    }
  };

  const columns: ProColumns<DeployTask>[] = [
    { title: '任务ID', dataIndex: 'id', width: 80 },
    {
      title: '状态', dataIndex: 'status', width: 110,
      search: { transform: (val) => val },
      render: (val) => {
        const s = STATUS_CONFIG[String(val).toUpperCase()] ?? { color: 'default', label: String(val ?? '-') };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
      renderFormItem: () => (
        <ProFormSelect name="status"
          options={[
            { label: '等待中', value: 'PENDING' }, { label: '构建中', value: 'BUILDING' },
            { label: '推送中', value: 'PUSHING' }, { label: '部署中', value: 'DEPLOYING' },
            { label: '成功', value: 'SUCCESS' }, { label: '失败', value: 'FAILED' },
          ]}
          allowClear placeholder="请选择状态" />
      ),
    },
    { title: '应用', dataIndex: 'project_id', render: (val) => findLabel(appOptions, val as number) },
    { title: '环境', dataIndex: 'env_id', width: 100, render: (val) => findLabel(envOptions, val as number) },
    {
      title: '部署目标', dataIndex: 'deploy_target', width: 100,
      render: (val, row) => {
        const v = (val || row.deploy_type || 'k8s') as string;
        return <Tag color={TARGET_COLORS[v]}>{TARGET_LABELS[v] || v}</Tag>;
      },
    },
    {
      title: '集群/服务器', dataIndex: 'k8s_cluster_id', ellipsis: true,
      render: (_, row) => {
        const target = row.deploy_target || row.deploy_type;
        if (target === 'docker' || target === 'linux')
          return findLabel(linuxMachineOptions, row.server_id as number);
        return findLabel(clusterOptions, row.k8s_cluster_id as number);
      },
    },
    { title: '命名空间', dataIndex: 'k8s_namespace', width: 100 },
    { title: 'Git 引用', dataIndex: 'git_ref', width: 100 },
    { title: '镜像标签', dataIndex: 'image_tag', ellipsis: true },
    { title: '重试次数', dataIndex: 'retry_count', width: 70, search: false,
      render: (val) => val && val > 0 ? val : '-',
    },
    { title: 'Jenkins 任务', dataIndex: 'jenkins_job_name', ellipsis: true },
    { title: 'Deployment', dataIndex: 'deployment_name', ellipsis: true },
    { title: '开始时间', dataIndex: 'started_at', valueType: 'dateTime', width: 150 },
    { title: '结束时间', dataIndex: 'finished_at', valueType: 'dateTime', width: 150 },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 220,
      render: (_, row) => [
        <Button key="detail" type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/publish/tasks/${row.id}`)}>详情</Button>,
        row.status === 'FAILED' && hasComp('publish_task_retry') && <Popconfirm key="retry" title="确认重试此任务？" onConfirm={async () => {
          try {
            await api.retryDeployTask(row.id);
            message.success('任务已重试');
            actionRef.current?.reload();
          } catch (e: any) {
            if (!isHandledError(e)) message.error(e?.message || '重试失败');
          }
        }}>
          <Button type="link" size="small" icon={<RedoOutlined />}>重试</Button>
        </Popconfirm>,
        hasComp('publish_task_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { try { await api.deleteDeployTask(row.id); message.success('已删除'); actionRef.current?.reload(); } catch (e: any) { if (!isHandledError(e)) message.error('删除失败'); } }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>,
      ].filter(Boolean),
    },
  ];

  return (
    <>
      <ProTable<DeployTask>
        rowKey="id" actionRef={actionRef} columns={columns}
        headerTitle={t('route.publish_tasks', { defaultValue: '发布任务' })}
        rowSelection={hasComp('publish_task_batch_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_task_batch_delete') ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条任务？`} onConfirm={async () => {
            await api.batchDeleteDeployTasks(selectedRowKeys as number[]);
            message.success(`已删除 ${selectedRowKeys.length} 条`);
            setSelectedRowKeys([]); actionRef.current?.reload();
          }}>
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}
        request={async (params) => {
          try {
            const res = await api.listDeployTasks({
              status: params.status as string | undefined,
              project_id: params.project_id as number | undefined,
              page: params.current ?? 1, size: params.pageSize ?? 20,
            });
            const data = (res as any)?.data ?? res;
            const records: DeployTask[] = data?.records ?? [];
            setHasActive(records.some((t) => !TERMINAL_STATUSES.has(String(t.status ?? 'PENDING').toUpperCase())));
            return { data: records, total: data?.total ?? 0, success: true };
          } catch { return { data: [], total: 0, success: false }; }
        }}
        toolBarRender={() => [
          hasComp('publish_task_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {t('common.add', { defaultValue: '创建发布任务' })}
          </Button>
        ]}
        scroll={{ x: 'max-content' }} pagination={{ pageSize: 20, showSizeChanger: true }} search={{ labelWidth: 'auto' }}
      />

      <ModalForm<CreateDeployTaskRequest>
        title="创建发布任务"
        open={modalOpen}
        width="min(900px, 95vw)"
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setSelectedProjectId(undefined); setSelectedEnvId(undefined);
            setBuildTemplateOptions([]); setDeployTemplateOptions([]);
            setBranchOptions([]); setTagOptions([]);
            setDeploymentConfigs([]); setNamespaceOptions([]);
          }
        }}
        modalProps={{ transitionName: '', maskTransitionName: '' }}
        formRef={formRef}
        onFinish={async (values) => {
          try {
            const payload: CreateDeployTaskRequest = {
              ...values,
              deploy_target: values.deploy_target || 'k8s',
              deploy_type: values.deploy_target || 'k8s',
              build_source: values.build_source || 'branch',
            };
            if (payload.deploy_target === 'docker' || payload.deploy_target === 'linux') {
              payload.k8s_cluster_id = undefined; payload.k8s_namespace = undefined;
            }
            if (payload.deploy_target === 'k8s') {
              payload.server_id = undefined; payload.deploy_path = undefined;
            }
            const res = await api.createDeployTask(payload);
            const taskId = (res as any)?.task_id;
            if (!taskId) { message.warning('任务已提交，但未返回任务ID'); return true; }
            message.success(`任务创建成功，任务ID: ${taskId}`);
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error(e?.message || '创建失败');
            return false;
          }
        }}
      >
        {/* ── 基本信息 ── */}
        <Card title="基本信息" size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 24px 0' } }}>
          <ProFormSelect name="project_id" label="应用" rules={[{ required: true }]} options={appOptions} showSearch
            fieldProps={{ optionFilterProp: 'label', onChange: (val: number) => {
              setSelectedProjectId(val);
              const eName = getAppEName(val);
              if (formRef.current && eName) {
                formRef.current.setFieldsValue({ jenkins_job_name: eName, registry_project: eName, image_name: eName });
              }
            }}} placeholder="请选择应用" />
          <ProFormSelect name="env_id" label="环境" rules={[{ required: true }]} options={envOptions} showSearch
            fieldProps={{ optionFilterProp: 'label', onChange: (val: number) => setSelectedEnvId(val) }} placeholder="请选择环境" />
          {deploymentConfigs.length > 0 && (
            <ProFormSelect name="deployment_config_id" label="部署配置"
              tooltip="选择后自动填充部署目标、集群/服务器、模板等字段"
              options={deploymentConfigs.map(dc => ({
                label: `${TARGET_LABELS[dc.deploy_target] || dc.deploy_target} — ${dc.description || `配置 #${dc.id}`}`,
                value: dc.id,
              }))}
              placeholder="选择部署配置以自动填充"
              fieldProps={{ onChange: (val: number) => {
                const config = deploymentConfigs.find(dc => dc.id === val);
                if (config && formRef.current) {
                  formRef.current.setFieldsValue({
                    deploy_target: config.deploy_target,
                    build_source: config.build_source || 'branch',
                    k8s_cluster_id: config.k8s_cluster_id ?? undefined,
                    k8s_namespace: config.k8s_namespace || 'default',
                    server_id: config.server_id ?? undefined,
                    deploy_path: config.deploy_path || undefined,
                    build_template_id: config.build_template_id ?? undefined,
                    deployment_template_id: config.deployment_template_id ?? undefined,
                    deployment_name: `${getAppEName(config.application_id)}-${config.application_id}`,
                  });
                  // 如果是 K8s 目标且有集群ID，自动加载命名空间
                  if (config.deploy_target === 'k8s' && config.k8s_cluster_id) {
                    loadNamespaces(config.k8s_cluster_id);
                  }
                }
              }}} />
          )}
        </Card>

        {/* ── 构建配置 ── */}
        <Card title="构建配置" size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 24px 0' } }}>
          <ProFormSelect name="build_template_id" label="构建模板" options={buildTemplateOptions} showSearch
            fieldProps={{ optionFilterProp: 'label', allowClear: true, loading: templateLoading, disabled: !selectedProjectId }}
            placeholder={!selectedProjectId ? '请先选择应用' : '留空则使用默认模板'} />
          <ProFormSelect name="deployment_template_id" label="部署模板" options={deployTemplateOptions} showSearch
            fieldProps={{ optionFilterProp: 'label', allowClear: true, loading: templateLoading, disabled: !selectedProjectId }}
            placeholder={!selectedProjectId ? '请先选择应用' : '留空则使用默认模板'} />
          <ProFormSelect name="build_source" label="构建源" rules={[{ required: true }]}
            options={[{ label: '分支', value: 'branch' }, { label: '标签', value: 'tag' }]}
            initialValue="branch" />
          <ProFormDependency name={['build_source']}>
            {({ build_source }) => {
              const options = build_source === 'tag' ? tagOptions : branchOptions;
              return (
                <ProFormSelect name="git_ref" label="Git 引用" rules={[{ required: true }]}
                  options={options} showSearch
                  fieldProps={{
                    optionFilterProp: 'label',
                    loading: gitRefLoading,
                    disabled: !selectedProjectId,
                    showSearch: true,
                  }}
                  placeholder={!selectedProjectId ? '请先选择应用' : build_source === 'tag' ? '选择标签' : '选择分支'} />
              );
            }}
          </ProFormDependency>
          <ProFormText name="jenkins_job_name" label="Jenkins 任务名称" rules={[{ required: true }]} placeholder="选择应用后自动填充" tooltip="默认使用应用英文名称" />
          <ProFormText name="registry_project" label="镜像仓库" rules={[{ required: true }]} placeholder="选择应用后自动填充" tooltip="镜像仓库中的项目命名空间" />
          <ProFormText name="image_name" label="镜像名称" rules={[{ required: true }]} placeholder="选择应用后自动填充" tooltip="对应 Harbor 中的 repository 名称" />
        </Card>

        {/* ── 部署目标 ── */}
        <Card title="部署目标" size="small" styles={{ body: { padding: '12px 24px 0' } }}>
          <ProFormSelect name="deploy_target" label="部署目标" initialValue="k8s"
            options={[
              { label: 'K8s 部署', value: 'k8s' },
              { label: 'Docker Compose 部署 (Linux)', value: 'docker' },
              { label: 'Linux 文件部署 (Nginx)', value: 'linux' },
            ]} />
          <ProFormDependency name={['deploy_target']}>
            {({ deploy_target }) => {
              if (deploy_target === 'docker') {
                return (
                  <>
                    <ProFormSelect name="server_id" label="目标服务器" rules={[{ required: true }]} options={linuxMachineOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择目标服务器" />
                    <ProFormText name="deployment_name" label="容器名称" placeholder="留空则自动按应用英文名+ID生成" />
                  </>
                );
              }
              if (deploy_target === 'linux') {
                return (
                  <>
                    <ProFormSelect name="server_id" label="目标服务器" rules={[{ required: true }]} options={linuxMachineOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择目标服务器" />
                    <ProFormText name="deploy_path" label="部署路径" rules={[{ required: true }]}
                      placeholder="/opt/zebra-deploy/my-app" tooltip="文件将被放置在此目录，由 Nginx 代理服务" />
                    <ProFormText name="deployment_name" label="部署名称" placeholder="留空则自动按应用英文名+ID生成" />
                  </>
                );
              }
              // k8s
              return (
                <>
                  <ProFormSelect name="k8s_cluster_id" label="K8s 集群" rules={[{ required: true }]} options={clusterOptions} showSearch
                    fieldProps={{ optionFilterProp: 'label', onChange: (val: number) => {
                      if (val) loadNamespaces(val);
                    }}} placeholder="请选择K8s集群" />
                  <ProFormSelect name="k8s_namespace" label="K8s 命名空间"
                    options={namespaceOptions} showSearch
                    fieldProps={{
                      optionFilterProp: 'label',
                      loading: namespaceLoading,
                      showSearch: true,
                    }}
                    placeholder="从集群获取或手动输入" initialValue="default" />
                  <ProFormText name="deployment_name" label="K8s Deployment 名称" placeholder="留空则自动按应用英文名+ID生成" />
                </>
              );
            }}
          </ProFormDependency>
        </Card>
      </ModalForm>
    </>
  );
}