import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Popconfirm, Drawer, Descriptions, Badge, Typography } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/deploy-task';
import type { DeployTask, CreateDeployTaskRequest } from '@/service/api/publish/deploy-task';
import { fetchK8sClusters } from '@/service/api/publish/k8s-cluster';
import { fetchEnvironments } from '@/service/api/publish/environment';
import { fetchApplications } from '@/service/api/publish/applications';
import { usePermission } from '@/hooks/usePermission';
import { localStg } from '@/utils/storage';

const { Text, Paragraph } = Typography;

const rawBaseURL = (import.meta.env.VITE_BASE_URL || '').trim();
const wsBaseURL = rawBaseURL.replace(/^http/, 'ws').replace(/\/$/, '');

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:   { color: 'default',    label: '等待中' },
  BUILDING:  { color: 'processing', label: '构建中' },
  PUSHING:   { color: 'processing', label: '推送中' },
  DEPLOYING: { color: 'warning',    label: '部署中' },
  SUCCESS:   { color: 'success',    label: '成功'   },
  FAILED:    { color: 'error',      label: '失败'   },
};

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED']);
const POLL_INTERVAL = 5000;

export default function PublishTasks() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasActive, setHasActive] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 下拉选项
  const [appOptions, setAppOptions] = useState<{ label: string; value: number }[]>([]);
  const [envOptions, setEnvOptions] = useState<{ label: string; value: number }[]>([]);
  const [clusterOptions, setClusterOptions] = useState<{ label: string; value: number }[]>([]);

  // 模板选项（创建表单中，选择应用后动态加载）
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined);
  const [buildTemplateOptions, setBuildTemplateOptions] = useState<{ label: string; value: number }[]>([]);
  const [deployTemplateOptions, setDeployTemplateOptions] = useState<{ label: string; value: number }[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);

  // 任务详情 Drawer
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<DeployTask | null>(null);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleLoading, setConsoleLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'error'>('closed');

  // 加载下拉数据
  useEffect(() => {
    Promise.all([
      fetchApplications({ size: 200 }).catch(() => null),
      fetchEnvironments({ size: 200 }).catch(() => null),
      fetchK8sClusters({ size: 200 }).catch(() => null),
    ]).then(([apps, envs, clusters]) => {
      setAppOptions((((apps as any)?.records) ?? []).map((e: any) => ({ label: `${e.c_name} (${e.e_name})`, value: e.id })));
      setEnvOptions((((envs as any)?.records) ?? []).map((e: any) => ({ label: `${e.name}${e.type ? ` (${e.type})` : ''}`, value: e.id })));
      setClusterOptions((((clusters as any)?.records) ?? []).map((e: any) => ({ label: `${e.name}${e.environment ? ` [${e.environment}]` : ''}`, value: e.id })));
    });
  }, []);

  // 自动轮询非终态任务
  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => actionRef.current?.reload(), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [hasActive]);

  // WebSocket 连接 Jenkins 控制台
  const connectConsoleWS = useCallback((taskId: number) => {
    // 关闭已有连接
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const token = localStg.get<string>('token') || '';
    const url = `${wsBaseURL}/cicd/api/deploys/${taskId}/console/stream?token=${token}`;

    setWsStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { setWsStatus('connected'); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.output) setConsoleOutput(data.output);
        if (data.finished) {
          ws.close();
        }
      } catch {
        setConsoleOutput(event.data);
      }
    };
    ws.onerror = () => { setWsStatus('error'); };
    ws.onclose = () => { setWsStatus('closed'); wsRef.current = null; };
  }, []);

  // 关闭详情时清理 WebSocket
  useEffect(() => {
    if (!detailOpen) {
      setConsoleOutput('');
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      setWsStatus('closed');
    }
  }, [detailOpen]);

  // 选择应用后自动加载可选模板
  useEffect(() => {
    if (!selectedProjectId) {
      setBuildTemplateOptions([]);
      setDeployTemplateOptions([]);
      return;
    }
    setTemplateLoading(true);
    loadTemplates(selectedProjectId).then((opts) => {
      setBuildTemplateOptions(opts.builds);
      setDeployTemplateOptions(opts.deploys);
      setTemplateLoading(false);
    });
  }, [selectedProjectId]);

  const findLabel = (opts: { label: string; value: number }[], v?: number) =>
    opts.find((o) => o.value === v)?.label ?? (v ? `#${v}` : '-');

  // 加载可选模板
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

  // 打开任务详情
  const openDetail = (task: DeployTask) => {
    setDetailTask(task);
    setDetailOpen(true);
    setConsoleOutput('');
    setConsoleLoading(false);
    if (task.jenkins_job_name) {
      connectConsoleWS(task.id);
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
        <ProFormSelect
          name="status"
          options={[
            { label: '等待中', value: 'PENDING' },
            { label: '构建中', value: 'BUILDING' },
            { label: '推送中', value: 'PUSHING' },
            { label: '部署中', value: 'DEPLOYING' },
            { label: '成功', value: 'SUCCESS' },
            { label: '失败', value: 'FAILED' },
          ]}
          allowClear placeholder="请选择状态"
        />
      ),
    },
    { title: '应用', dataIndex: 'project_id', width: 180, render: (val) => findLabel(appOptions, val as number) },
    { title: '环境', dataIndex: 'env_id', width: 140, render: (val) => findLabel(envOptions, val as number) },
    { title: 'K8s 集群', dataIndex: 'k8s_cluster_id', width: 160, render: (val) => findLabel(clusterOptions, val as number) },
    { title: '命名空间', dataIndex: 'k8s_namespace', width: 110 },
    { title: 'Git 引用', dataIndex: 'git_ref', width: 120 },
    { title: '镜像标签', dataIndex: 'image_tag', ellipsis: true, width: 180 },
    { title: 'Jenkins 任务', dataIndex: 'jenkins_job_name', ellipsis: true, width: 180 },
    { title: 'Deployment', dataIndex: 'deployment_name', ellipsis: true, width: 160 },
    { title: '开始时间', dataIndex: 'started_at', valueType: 'dateTime', width: 170 },
    { title: '结束时间', dataIndex: 'finished_at', valueType: 'dateTime', width: 170 },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 220,
      render: (_, row) => [
        <Button key="detail" type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(row)}>详情</Button>,
        row.jenkins_job_name ? (
          <Button key="jenkins" type="link" size="small" icon={<FileTextOutlined />}
            onClick={() => openDetail(row)}>
            Jenkins 日志
          </Button>
        ) : null,
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
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条任务？Jenkins 中的对应 Job 也将一并删除。`}
            onConfirm={async () => {
              try {
                await api.batchDeleteDeployTasks(selectedRowKeys as number[]);
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) {
                if (!isHandledError(e)) message.error('批量删除失败');
              }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        ) : undefined}
        request={async (params) => {
          try {
            const res = await api.listDeployTasks({
              status: params.status as string | undefined,
              project_id: params.project_id as number | undefined,
              page: params.current ?? 1,
              size: params.pageSize ?? 20,
            });
            const data = (res as any)?.data ?? res;
            const records: DeployTask[] = data?.records ?? [];
            // 检测是否有活跃任务（非终态）
            setHasActive(records.some((t) => !TERMINAL_STATUSES.has(String(t.status ?? 'PENDING').toUpperCase())));
            return {
              data: records,
              total: data?.total ?? 0,
              success: true,
            };
          } catch {
            return { data: [], total: 0, success: false };
          }
        }}
        toolBarRender={() => [
          hasComp('publish_task_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            {t('common.add', { defaultValue: '创建发布任务' })}
          </Button>
        ]}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        search={{ labelWidth: 'auto' }}
      />

      <ModalForm<CreateDeployTaskRequest>
        title="创建发布任务"
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) { setSelectedProjectId(undefined); setBuildTemplateOptions([]); setDeployTemplateOptions([]); } }}
        modalProps={{ transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            const res = await api.createDeployTask(values);
            const taskId = (res as any)?.task_id;
            if (!taskId) {
              message.warning('任务已提交，但未返回任务ID');
              return true;
            }
            message.success(`任务创建成功，任务ID: ${taskId}`);
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error(e?.message || '创建失败');
            return false;
          }
        }}
      >
        <ProFormSelect name="project_id" label="应用" rules={[{ required: true }]} options={appOptions} showSearch
          fieldProps={{ optionFilterProp: 'label', onChange: (val: number) => { setSelectedProjectId(val); } }} placeholder="请选择应用" />
        <ProFormSelect name="build_template_id" label="构建模板" options={buildTemplateOptions} showSearch
          fieldProps={{ optionFilterProp: 'label', allowClear: true, loading: templateLoading, disabled: !selectedProjectId }}
          placeholder={!selectedProjectId ? '请先选择应用' : '留空则使用默认模板'} />
        <ProFormSelect name="deployment_template_id" label="部署模板" options={deployTemplateOptions} showSearch
          fieldProps={{ optionFilterProp: 'label', allowClear: true, loading: templateLoading, disabled: !selectedProjectId }}
          placeholder={!selectedProjectId ? '请先选择应用' : '留空则使用默认模板'} />
        <ProFormSelect name="env_id" label="环境" rules={[{ required: true }]} options={envOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择环境" />
        <ProFormText name="git_ref" label="Git 引用（分支/标签）" rules={[{ required: true }]} placeholder="main" />
        <ProFormSelect name="k8s_cluster_id" label="K8s 集群" rules={[{ required: true }]} options={clusterOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择K8s集群" />
        <ProFormText name="k8s_namespace" label="K8s 命名空间" placeholder="default" />
        <ProFormText name="jenkins_job_name" label="Jenkins 任务名称" rules={[{ required: true }]} placeholder="请输入Jenkins任务名称" />
        <ProFormText name="harbor_project" label="Harbor 项目" rules={[{ required: true }]} placeholder="请输入Harbor项目" />
        <ProFormText name="image_name" label="镜像名称" rules={[{ required: true }]} placeholder="请输入镜像名称" />
        <ProFormText name="deployment_name" label="K8s Deployment 名称" placeholder="留空则自动按应用ID生成" />
      </ModalForm>

      {/* 任务详情 Drawer */}
      <Drawer
        title={`任务详情 #${detailTask?.id ?? '-'}`}
        open={detailOpen} onClose={() => setDetailOpen(false)}
        width={680}
        extra={
          detailTask?.jenkins_job_name ? (
            <>
              <Badge
                status={wsStatus === 'connected' ? 'success' : wsStatus === 'connecting' ? 'processing' : wsStatus === 'error' ? 'error' : 'default'}
                text={wsStatus === 'connected' ? '实时连接' : wsStatus === 'connecting' ? '连接中...' : wsStatus === 'error' ? '连接失败' : '未连接'}
              />
              {wsStatus !== 'connected' && (
                <Button size="small" onClick={() => detailTask && connectConsoleWS(detailTask.id)}>
                  重连
                </Button>
              )}
            </>
          ) : null
        }
      >
        {detailTask && (
          <>
            <Descriptions title="基本信息" column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="应用">{findLabel(appOptions, detailTask.project_id)}</Descriptions.Item>
              <Descriptions.Item label="环境">{findLabel(envOptions, detailTask.env_id)}</Descriptions.Item>
              <Descriptions.Item label="K8s 集群">{findLabel(clusterOptions, detailTask.k8s_cluster_id)}</Descriptions.Item>
              <Descriptions.Item label="命名空间">{detailTask.k8s_namespace || '-'}</Descriptions.Item>
              <Descriptions.Item label="Git 引用">{detailTask.git_ref || '-'}</Descriptions.Item>
              <Descriptions.Item label="镜像标签">{detailTask.image_tag || '-'}</Descriptions.Item>
              <Descriptions.Item label="Harbor 项目">{detailTask.harbor_project || '-'}</Descriptions.Item>
              <Descriptions.Item label="镜像名称">{detailTask.image_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Deployment">{detailTask.deployment_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={STATUS_CONFIG[String(detailTask.status).toUpperCase()]?.color ?? 'default'}>
                  {STATUS_CONFIG[String(detailTask.status).toUpperCase()]?.label ?? detailTask.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{detailTask.created_at ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{detailTask.started_at ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="完成时间">{detailTask.finished_at ?? '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="构建参数" column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="构建模板 ID">{detailTask.build_template_id ?? '默认'}</Descriptions.Item>
              <Descriptions.Item label="Jenkins 任务">{detailTask.jenkins_job_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="构建编号">{detailTask.jenkins_build_number ?? '-'}</Descriptions.Item>
            </Descriptions>

            <Descriptions title="部署参数" column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="部署模板 ID">{detailTask.deployment_template_id ?? '默认'}</Descriptions.Item>
              <Descriptions.Item label="K8s Deployment">{detailTask.deployment_name || '-'}</Descriptions.Item>
            </Descriptions>

            {detailTask.error_message && (
              <Descriptions title="错误信息" column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="错误详情">
                  <Text type="danger">{detailTask.error_message}</Text>
                </Descriptions.Item>
              </Descriptions>
            )}

            {detailTask.jenkins_job_name && (
              <>
                <Descriptions title="Jenkins 控制台输出" column={1} size="small" bordered style={{ marginBottom: 8 }} />
                {(detailTask.jenkins_build_number ?? 0) > 0 ? (
                  <Paragraph style={{ fontFamily: 'monospace', fontSize: 12, background: '#1a1a2e', color: '#e0e0e0', padding: 12, borderRadius: 4, maxHeight: 400, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                    {consoleOutput || '加载中...'}
                  </Paragraph>
                ) : (
                  <Text type="secondary">任务尚未开始构建，暂无控制台输出</Text>
                )}
              </>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}