import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Card, Descriptions, Button, Tag, Space, Spin, Typography, message, Divider, Drawer, Table, Popconfirm, Tooltip, Dropdown } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined, RedoOutlined, DownOutlined, RightOutlined, RollbackOutlined, HistoryOutlined, PlayCircleOutlined, RocketOutlined, CloseOutlined } from '@ant-design/icons';
import { getDeployTask, deleteDeployTask, retryDeployTask, retryDeployTaskFromStage, getTaskStages, getRollbackHistory, rollbackDeploy, triggerBuild, triggerDeploy, cancelSchedule, type DeployTask, type StageHistory } from '@/service/api';
import { usePublishStore } from '@/store/publish';
import JenkinsConsolePanel from '@/components/JenkinsConsolePanel';
import DeploymentStatusPanel from '@/components/DeploymentStatusPanel';

const { Title, Text } = Typography;

// Pipeline stages definition (order matters)
const PIPELINE_STAGES = ['PENDING', 'BUILDING', 'PUSHING', 'DEPLOYING'] as const;

// Stage display config
const STAGE_CONFIG: Record<string, { desc: string }> = {
  PENDING: { desc: '任务创建入队' },
  BUILDING: { desc: 'Jenkins构建镜像' },
  PUSHING: { desc: '推送至仓库' },
  DEPLOYING: { desc: '部署至目标环境' },
};

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const publishStore = usePublishStore();

  // Load dropdown data from shared store
  useEffect(() => { publishStore.loadAll(); }, []);

  const [task, setTask] = useState<DeployTask | null>(null);
  const [stages, setStages] = useState<StageHistory[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('BUILDING');
  const [loading, setLoading] = useState(true);
  const [showBuildConfig, setShowBuildConfig] = useState(false);
  const [showDeployConfig, setShowDeployConfig] = useState(false);

  // 回滚相关状态
  const [rollbackDrawerOpen, setRollbackDrawerOpen] = useState(false);
  const [rollbackHistory, setRollbackHistory] = useState<DeployTask[]>([]);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [rollbackHistoryTotal, setRollbackHistoryTotal] = useState(0);
  const [rollbackHistoryPage, setRollbackHistoryPage] = useState(1);

  const taskId = Number(id);

  // Determine current active stage from task status
  const getActiveStage = (taskStatus: string, stagesData: StageHistory[]): string => {
    const runningStage = stagesData.find(s => s.status === 'running');
    if (runningStage) return runningStage.stage;
    // If no running stage, default to the last completed or current task status
    if (PIPELINE_STAGES.includes(taskStatus as typeof PIPELINE_STAGES[number])) return taskStatus;
    // Terminal states: show last stage
    if (taskStatus === 'SUCCESS') return 'DEPLOYING';
    if (taskStatus === 'FAILED') {
      const failedStage = stagesData.find(s => s.status === 'failed');
      return failedStage?.stage || taskStatus;
    }
    return 'BUILDING';
  };

  // Fetch task + stages data
  const fetchData = useCallback(async () => {
    try {
      const taskData = await getDeployTask(taskId);
      setTask(taskData);
      const stagesData = await getTaskStages(taskId);
      setStages(stagesData);

      // Auto-select active stage on first load
      if (stagesData.length > 0) {
        setSelectedStage(getActiveStage(taskData.status || 'PENDING', stagesData));
      }
    } catch {
      message.error('获取任务详情失败');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for non-terminal states
  useEffect(() => {
    if (!task) return;
    const terminalStatuses = ['SUCCESS', 'FAILED'];
    if (terminalStatuses.includes(task.status || '')) return;

    const timer = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(timer);
  }, [task?.status, fetchData]);

  // Compute duration string from two timestamps
  const computeDuration = (start: string, end: string): string => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const diff = e - s;
    if (diff < 1000) return `${diff}ms`;
    if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
    if (diff < 3600000) return `${(diff / 60000).toFixed(1)}m`;
    return `${(diff / 3600000).toFixed(1)}h`;
  };

  const formatDateTime = (value?: string): string => {
    if (!value) return '--';
    // Go time.Time zero value can be serialized as 0001-01-01..., treat as empty.
    if (value.startsWith('0001-01-01')) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    if (d.getFullYear() <= 1) return '--';

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatTimeOnly = (value?: string): string => {
    if (!value) return '--:--:--';
    if (value.startsWith('0001-01-01')) return '--:--:--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--:--:--';
    if (d.getFullYear() <= 1) return '--:--:--';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // Compute stage display state from stages data, with fallback from task status
  const getStageState = (stageName: string): { status: string; startedAt?: string; finishedAt?: string; duration?: string; errorMsg?: string } => {
    const record = stages.find(s => s.stage === stageName);
    if (record) {
      const duration = record.started_at && record.finished_at
        ? computeDuration(record.started_at, record.finished_at)
        : record.started_at && record.status === 'running'
          ? '进行中...'
          : '--';
      return {
        status: record.status,
        startedAt: record.started_at,
        finishedAt: record.finished_at,
        duration,
        errorMsg: record.error_message,
      };
    }

    // Fallback: no stage_history records — infer from task status
    if (!task) return { status: 'pending' };

    const currentStatus = task.status || 'PENDING';
    const stageOrder: readonly string[] = PIPELINE_STAGES;
    const stageIdx = stageOrder.indexOf(stageName as typeof PIPELINE_STAGES[number]);
    const currentIdx = stageOrder.indexOf(currentStatus as typeof PIPELINE_STAGES[number]);

    // Terminal states
    if (currentStatus === 'SUCCESS') {
      return { status: 'success', startedAt: '--', finishedAt: '--', duration: '--' };
    }
    if (currentStatus === 'FAILED') {
      // All stages before the failed point are success, the current stage is failed
      if (stageIdx < currentIdx) return { status: 'success' };
      if (stageIdx === currentIdx) return { status: 'failed', errorMsg: task.error_message };
      return { status: 'pending' };
    }

    // Running states: stages before current are done, current is running, after are pending
    if (stageIdx >= 0 && currentIdx >= 0) {
      if (stageIdx < currentIdx) return { status: 'success' };
      if (stageIdx === currentIdx) return { status: 'running', duration: '进行中...' };
    }

    return { status: 'pending' };
  };

  const handleDelete = async () => {
    try {
      await deleteDeployTask(taskId);
      message.success('删除成功');
      navigate('/publish/tasks');
    } catch {
      message.error('删除失败');
    }
  };

  const handleRetry = async () => {
    // 全量重试（从构建阶段开始）
    try {
      await retryDeployTask(taskId);
      message.success('重试已提交（从构建阶段开始）');
      fetchData();
    } catch {
      message.error('重试失败');
    }
  };

  const handleRetryFromStage = async (stage: 'BUILDING' | 'DEPLOYING') => {
    const label = stage === 'BUILDING' ? '从构建阶段重试' : '从部署阶段重试';
    try {
      await retryDeployTaskFromStage(taskId, stage);
      message.success(`${label}已提交`);
      fetchData();
    } catch (e: any) {
      message.error(e?.message || `${label}失败`);
    }
  };

  // 加载回滚历史
  const loadRollbackHistory = async (page: number = 1) => {
    setRollbackLoading(true);
    try {
      const res = await getRollbackHistory(taskId, { page, size: 10 });
      const records = Array.isArray(res) ? res : (res as any)?.records ?? [];
      setRollbackHistory(records);
      setRollbackHistoryTotal((res as any)?.total ?? records.length);
      setRollbackHistoryPage(page);
    } catch (err) {
      message.error('加载历史版本失败');
    } finally {
      setRollbackLoading(false);
    }
  };

  // 打开回滚 Drawer
  const handleOpenRollbackDrawer = () => {
    setRollbackDrawerOpen(true);
    loadRollbackHistory(1);
  };

  // 执行回滚
  const handleRollback = async (historyTaskId: number, historyImageTag: string) => {
    try {
      const result = await rollbackDeploy(taskId, historyTaskId);
      message.success(`已创建回滚任务 #${result.task_id}，镜像版本: ${historyImageTag}`);
      setRollbackDrawerOpen(false);
      // 跳转到新创建的回滚任务
      navigate(`/publish/tasks/${result.task_id}`);
    } catch (err: any) {
      message.error(err?.message || '回滚失败');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!task) return <div>任务不存在</div>;

  // Selected stage data
  const selectedStageData = stages.find(s => s.stage === selectedStage);
  const taskStatus = task.status || 'PENDING';

  // 判断是否可以仅重试部署阶段：构建阶段必须已成功
  const canRetryDeployOnly = taskStatus === 'FAILED' &&
    stages.some(s => s.stage === 'BUILDING' && s.status === 'success') &&
    stages.some(s => s.stage === 'DEPLOYING' && s.status === 'failed');

  const retryMenuItems = [
    {
      key: 'BUILDING',
      label: '从构建重试',
      icon: <PlayCircleOutlined />,
    },
    ...(canRetryDeployOnly ? [{
      key: 'DEPLOYING',
      label: '从部署重试',
      icon: <RocketOutlined />,
    }] : []),
  ];

  // Resolve display names from publish store
  const appName = (publishStore.apps || []).find(a => a.id === task.project_id)?.c_name || `#${task.project_id}`;
  const envName = (publishStore.envs || []).find(e => e.id === task.env_id)?.name || `#${task.env_id}`;
  const clusterName = (publishStore.clusterOptions || []).find(c => c.value === task.k8s_cluster_id)?.label || `#${task.k8s_cluster_id}`;
  const serverName = (publishStore.linuxMachineOptions || []).find(s => s.value === task.server_id)?.label || `#${task.server_id}`;
  const buildTemplateName = (publishStore.buildTplOptions || []).find(t => t.value === task.build_template_id)?.label || (task.build_template_id ? `模板 #${task.build_template_id}` : '默认模板');
  const deployTemplateName = (publishStore.deployTplOptions || []).find(t => t.value === task.deployment_template_id)?.label || (task.deployment_template_id ? `模板 #${task.deployment_template_id}` : '默认模板');
  const deployTemplatePureName = deployTemplateName.replace(/\s*[（(][^）)]*[）)]\s*$/, '').trim() || deployTemplateName;

  // TARGET_LABELS for display
  const TARGET_LABELS: Record<string, string> = { k8s: 'Kubernetes', docker: 'Docker Compose', linux: 'Linux/Nginx' };

  return (
    <div style={{ padding: 16, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/publish/tasks')}>返回</Button>
          <Title level={4} style={{ margin: 0 }}>任务详情 #{taskId}</Title>
          {task?.is_rollback && (
            <Tooltip title={`从任务 #${task.rollback_from} 回滚`}>
              <Tag color="orange" icon={<RollbackOutlined />}>回滚任务</Tag>
            </Tooltip>
          )}
        </Space>
        <Space>
          {/* 手动执行模式触发按钮 */}
          {task?.execution_mode === 'manual' && task?.build_status === 'ready' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={async () => {
              try {
                await triggerBuild(taskId);
                message.success('构建已触发');
                fetchData();
              } catch (e: any) {
                message.error(e?.message || '触发失败');
              }
            }}>执行构建</Button>
          )}
          {task?.execution_mode === 'manual' && task?.build_status === 'done' && task?.deploy_status === 'ready' && (
            <Button type="primary" icon={<RocketOutlined />} onClick={async () => {
              try {
                await triggerDeploy(taskId);
                message.success('部署已触发');
                fetchData();
              } catch (e: any) {
                message.error(e?.message || '触发失败');
              }
            }}>执行部署</Button>
          )}
          {/* 定时任务取消按钮 */}
          {taskStatus === 'SCHEDULED' && (
            <Popconfirm title="确认取消此定时任务？" onConfirm={async () => {
              try {
                await cancelSchedule(taskId);
                message.success('定时任务已取消');
                navigate('/publish/tasks');
              } catch (e: any) {
                message.error(e?.message || '取消失败');
              }
            }}>
              <Button danger icon={<CloseOutlined />}>取消任务</Button>
            </Popconfirm>
          )}
          {/* 回滚按钮：仅在 SUCCESS 或 FAILED 状态显示 */}
          {(taskStatus === 'SUCCESS' || taskStatus === 'FAILED') && (
            <Button icon={<HistoryOutlined />} onClick={handleOpenRollbackDrawer}>回滚</Button>
          )}
          {taskStatus === 'FAILED' && (
            <Dropdown menu={{
              items: retryMenuItems,
              onClick: ({ key }) => handleRetryFromStage(key as 'BUILDING' | 'DEPLOYING'),
            }}>
              <Button icon={<RedoOutlined />} type="primary">
                重试 <DownOutlined style={{ fontSize: 10, marginLeft: 2 }} />
              </Button>
            </Dropdown>
          )}
          <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>删除</Button>
        </Space>
      </div>

      {/* Top: Basic Info Card */}
      <Card
        style={{ marginBottom: 16 }}
        title="基本信息"
        extra={<Tag color={taskStatus === 'SUCCESS' ? 'green' : taskStatus === 'FAILED' ? 'red' : taskStatus === 'SCHEDULED' ? 'purple' : 'blue'}>{taskStatus}</Tag>}
      >
        <Descriptions column={4} size="small">
          <Descriptions.Item label="应用名称">{appName}</Descriptions.Item>
          <Descriptions.Item label="目标环境">{envName}</Descriptions.Item>
          <Descriptions.Item label="Git引用">{task.git_ref || '--'}</Descriptions.Item>
          <Descriptions.Item label="镜像标签">{task.image_tag || '--'}</Descriptions.Item>
          <Descriptions.Item label="部署目标">{TARGET_LABELS[task.deploy_target || 'k8s'] || task.deploy_target}</Descriptions.Item>
          <Descriptions.Item label="执行模式">{task.execution_mode === 'manual' ? '手动执行' : '自动执行'}</Descriptions.Item>
          <Descriptions.Item label="调度类型">{task.schedule_type === 'scheduled' ? '定时执行' : '立即执行'}</Descriptions.Item>
          <Descriptions.Item label="计划执行时间">
            {task.schedule_type === 'scheduled' && task.scheduled_at ? formatDateTime(task.scheduled_at) : '--'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">{formatDateTime(task.created_at)}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{formatDateTime(task.started_at)}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{formatDateTime(task.finished_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Build Config Card - Collapsible */}
      <Card
        title={
          <span onClick={() => setShowBuildConfig(!showBuildConfig)} style={{ cursor: 'pointer' }}>
            {showBuildConfig ? <DownOutlined style={{ marginRight: 8, fontSize: 12 }} /> : <RightOutlined style={{ marginRight: 8, fontSize: 12 }} />}
            构建配置
          </span>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { display: showBuildConfig ? 'block' : 'none', padding: 16 } }}
      >
        <Descriptions column={4} size="small">
          <Descriptions.Item label="构建模板">
            {task.build_template_id
              ? <Link to={`/publish/templates/build?name=${encodeURIComponent(buildTemplateName)}`}>{buildTemplateName}</Link>
              : buildTemplateName}
          </Descriptions.Item>
          <Descriptions.Item label="Jenkins Job">{task.jenkins_job_name || '--'}</Descriptions.Item>
          <Descriptions.Item label="Build Number">{task.jenkins_build_number || '--'}</Descriptions.Item>
          <Descriptions.Item label="Git 引用">{task.git_ref || '--'}</Descriptions.Item>
          <Descriptions.Item label="镜像仓库">{task.registry_project || '--'}</Descriptions.Item>
          <Descriptions.Item label="镜像名称">{task.image_name || '--'}</Descriptions.Item>
          <Descriptions.Item label="镜像标签">{task.image_tag || '--'}</Descriptions.Item>
          <Descriptions.Item label="重试次数">{task.retry_count || 0}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Deploy Config Card - Collapsible */}
      <Card
        title={
          <span onClick={() => setShowDeployConfig(!showDeployConfig)} style={{ cursor: 'pointer' }}>
            {showDeployConfig ? <DownOutlined style={{ marginRight: 8, fontSize: 12 }} /> : <RightOutlined style={{ marginRight: 8, fontSize: 12 }} />}
            部署配置
          </span>
        }
        style={{ marginBottom: 16 }}
        styles={{ body: { display: showDeployConfig ? 'block' : 'none', padding: 16 } }}
      >
        <Descriptions column={4} size="small">
          <Descriptions.Item label="部署模板">
            {task.deployment_template_id
              ? <Link to={`/publish/templates/deployment?name=${encodeURIComponent(deployTemplatePureName)}`}>{deployTemplatePureName}</Link>
              : deployTemplatePureName}
          </Descriptions.Item>
          <Descriptions.Item label="部署类型">{TARGET_LABELS[task.deploy_target || 'k8s'] || task.deploy_target}</Descriptions.Item>
          {task.deploy_target === 'k8s' && (
            <>
              <Descriptions.Item label="K8s集群">{clusterName}</Descriptions.Item>
              <Descriptions.Item label="命名空间">{task.k8s_namespace || '--'}</Descriptions.Item>
              <Descriptions.Item label="Deployment">{task.deployment_name || '--'}</Descriptions.Item>
            </>
          )}
          {task.deploy_target === 'docker' && (
            <>
              <Descriptions.Item label="服务器">{serverName}</Descriptions.Item>
              <Descriptions.Item label="Compose路径">{task.docker_compose_path || '--'}</Descriptions.Item>
              <Descriptions.Item label="容器名称">{task.deployment_name || '--'}</Descriptions.Item>
            </>
          )}
          {task.deploy_target === 'linux' && (
            <>
              <Descriptions.Item label="服务器">{serverName}</Descriptions.Item>
              <Descriptions.Item label="部署路径">{task.deploy_path || '--'}</Descriptions.Item>
              <Descriptions.Item label="部署名称">{task.deployment_name || '--'}</Descriptions.Item>
            </>
          )}
        </Descriptions>
        {task.error_message && (
          <Divider style={{ margin: '12px 0' }} />
        )}
        {task.error_message && (
          <div>
            <Text type="danger" strong>错误信息：</Text>
            <pre style={{ background: '#fff2f0', padding: 8, borderRadius: 4, marginTop: 4, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {task.error_message}
            </pre>
          </div>
        )}
      </Card>

      {/* Bottom: CICD Flow + Stage Detail (Vertical Layout) */}
      {/* Pipeline Flow */}
      <Card title="CICD 流程" style={{ marginBottom: 16 }} styles={{ body: { padding: '12px 16px' } }}>
        {/* Horizontal stage cards */}
        <div style={{ display: 'flex', gap: 8 }}>
          {PIPELINE_STAGES.map((stageName) => {
            const state = getStageState(stageName);
            const config = STAGE_CONFIG[stageName];
            const isSelected = selectedStage === stageName;
            const borderColor = state.status === 'success' ? '#52c41a'
              : state.status === 'running' ? '#1890ff'
              : state.status === 'failed' ? '#ff4d4f'
              : '#d9d9d9';
            const bgColor = state.status === 'success' ? '#f6ffed'
              : state.status === 'running' ? '#e6f7ff'
              : state.status === 'failed' ? '#fff2f0'
              : '#fafafa';
            const textColor = state.status === 'success' ? '#52c41a'
              : state.status === 'running' ? '#1890ff'
              : state.status === 'failed' ? '#ff4d4f'
              : '#999';
            const statusIcon = state.status === 'success' ? '✓'
              : state.status === 'running' ? '⟳'
              : state.status === 'failed' ? '✗'
              : '';
            const statusText = state.duration || (state.status === 'pending' ? '等待中' : '--');

            return (
              <div
                key={stageName}
                onClick={() => setSelectedStage(stageName)}
                style={{
                  flex: 1,
                  borderLeft: `3px solid ${borderColor}`,
                  padding: '8px 10px',
                  background: bgColor,
                  borderRadius: 4,
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div style={{ fontWeight: 'bold', color: textColor, fontSize: 13 }}>
                  {statusIcon} {stageName}
                </div>
                <div style={{ fontSize: 11, color: textColor, marginTop: 2 }}>{statusText}</div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{config.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Timeline progress bar */}
        {stages.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>时间线</Text>
            <div style={{ position: 'relative', height: 6, background: '#d9d9d9', borderRadius: 3, marginTop: 6 }}>
              {stages.filter(s => s.status === 'success' || s.status === 'running').map((s) => {
                const totalStages = PIPELINE_STAGES.length;
                const stageIdx = PIPELINE_STAGES.indexOf(s.stage as typeof PIPELINE_STAGES[number]);
                if (stageIdx === -1) return null;
                const leftPct = (stageIdx / totalStages) * 100;
                const widthPct = (1 / totalStages) * 100;
                const color = s.status === 'success' ? '#52c41a' : '#1890ff';
                return (
                  <div key={s.stage} style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 3,
                  }} />
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#999', marginTop: 4 }}>
              {PIPELINE_STAGES.map((sn) => {
                const state = getStageState(sn);
                return <span key={sn}>{formatTimeOnly(state.startedAt)}</span>;
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Stage Detail Panel - Below the flow */}
      <Card title={selectedStage ? `${selectedStage} 阶段详情` : '阶段详情'} styles={{ body: { padding: '12px 16px' } }}>
        {/* Stage-specific detail content */}
        {selectedStage === 'PENDING' && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="触发方式">手动触发</Descriptions.Item>
            <Descriptions.Item label="创建时间">{formatDateTime(selectedStageData?.started_at || task.created_at)}</Descriptions.Item>
            <Descriptions.Item label="完成时间">{formatDateTime(selectedStageData?.finished_at)}</Descriptions.Item>
            <Descriptions.Item label="耗时">{selectedStageData?.started_at && selectedStageData?.finished_at ? computeDuration(selectedStageData.started_at, selectedStageData.finished_at) : '--'}</Descriptions.Item>
            <Descriptions.Item label="队列">Asynq deploy queue</Descriptions.Item>
          </Descriptions>
        )}

        {selectedStage === 'BUILDING' && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Jenkins Job">{task.jenkins_job_name || '--'}</Descriptions.Item>
              <Descriptions.Item label="Build Number">{task.jenkins_build_number || '--'}</Descriptions.Item>
              <Descriptions.Item label="构建模板">
                {task.build_template_id
                  ? <Link to={`/publish/templates/build?name=${encodeURIComponent(buildTemplateName)}`}>{buildTemplateName}</Link>
                  : '默认模板'}
              </Descriptions.Item>
              <Descriptions.Item label="镜像名称">{task.image_name || '--'}</Descriptions.Item>
              <Descriptions.Item label="镜像标签">{task.image_tag || '--'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDateTime(selectedStageData?.started_at)}</Descriptions.Item>
              <Descriptions.Item label="耗时">
                {selectedStageData?.started_at && selectedStageData?.finished_at
                  ? computeDuration(selectedStageData.started_at, selectedStageData.finished_at)
                  : selectedStageData?.started_at && selectedStageData?.status === 'running'
                    ? '进行中...'
                    : '--'}
              </Descriptions.Item>
              {selectedStageData?.error_message && (
                <Descriptions.Item label="错误信息">
                  <Text type="danger">{selectedStageData.error_message}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
            {task.jenkins_job_name && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Jenkins Console Output</Text>
                <JenkinsConsolePanel taskId={taskId} />
              </div>
            )}
          </>
        )}

        {selectedStage === 'PUSHING' && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="镜像仓库">{task.registry_project || '--'}</Descriptions.Item>
            <Descriptions.Item label="镜像">{task.registry_project && task.image_name ? `${task.registry_project}/${task.image_name}:${task.image_tag}` : '--'}</Descriptions.Item>
            <Descriptions.Item label="开始时间">{formatDateTime(selectedStageData?.started_at)}</Descriptions.Item>
            <Descriptions.Item label="完成时间">{formatDateTime(selectedStageData?.finished_at)}</Descriptions.Item>
            <Descriptions.Item label="耗时">
              {selectedStageData?.started_at && selectedStageData?.finished_at
                ? computeDuration(selectedStageData.started_at, selectedStageData.finished_at)
                : '--'}
            </Descriptions.Item>
            <Descriptions.Item label="验证状态">
              {selectedStageData?.status === 'success' ? <Tag color="green">镜像已确认存在</Tag>
                : selectedStageData?.status === 'running' ? <Tag color="blue">验证中...</Tag>
                : selectedStageData?.status === 'failed' ? <Tag color="red">验证失败</Tag>
                : <Tag>等待构建完成</Tag>}
            </Descriptions.Item>
            {selectedStageData?.error_message && (
              <Descriptions.Item label="错误信息">
                <Text type="danger">{selectedStageData.error_message}</Text>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        {selectedStage === 'DEPLOYING' && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="部署类型">{task.deploy_target || '--'}</Descriptions.Item>
              {task.deploy_target === 'k8s' && (
                <>
                  <Descriptions.Item label="K8s集群">{task.k8s_cluster_id || '--'}</Descriptions.Item>
                  <Descriptions.Item label="命名空间">{task.k8s_namespace || '--'}</Descriptions.Item>
                  <Descriptions.Item label="Deployment">{task.deployment_name || '--'}</Descriptions.Item>
                  <Descriptions.Item label="部署方式">Server-Side Apply</Descriptions.Item>
                </>
              )}
              {task.deploy_target === 'docker' && (
                <>
                  <Descriptions.Item label="服务器">{task.server_id || '--'}</Descriptions.Item>
                  <Descriptions.Item label="Compose路径">{task.docker_compose_path || '--'}</Descriptions.Item>
                </>
              )}
              {task.deploy_target === 'linux' && (
                <>
                  <Descriptions.Item label="服务器">{task.server_id || '--'}</Descriptions.Item>
                  <Descriptions.Item label="部署路径">{task.deploy_path || '--'}</Descriptions.Item>
                  <Descriptions.Item label="部署方式">Nginx静态部署</Descriptions.Item>
                </>
              )}
              <Descriptions.Item label="部署模板">
                {task.deployment_template_id
                  ? <Link to={`/publish/templates/deployment?name=${encodeURIComponent(deployTemplatePureName)}`}>{deployTemplatePureName}</Link>
                  : '默认模板'}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDateTime(selectedStageData?.started_at)}</Descriptions.Item>
              <Descriptions.Item label="耗时">
                {selectedStageData?.started_at && selectedStageData?.finished_at
                  ? computeDuration(selectedStageData.started_at, selectedStageData.finished_at)
                  : selectedStageData?.started_at && selectedStageData?.status === 'running'
                    ? '进行中...'
                    : '--'}
              </Descriptions.Item>
              {selectedStageData?.error_message && (
                <Descriptions.Item label="错误信息">
                  <Text type="danger">{selectedStageData.error_message}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
            {/* Platform runtime status */}
            {(taskStatus === 'DEPLOYING' || taskStatus === 'SUCCESS') && (
              <DeploymentStatusPanel task={task} taskStatus={taskStatus} />
            )}
            {/* Deploy log summary if available */}
            {selectedStageData?.log_summary && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>部署日志摘要</Text>
                <pre style={{ background: '#1e1e1e', color: '#0f0', padding: 8, borderRadius: 4, fontSize: 11, maxHeight: 120, overflow: 'auto' }}>
                  {selectedStageData.log_summary}
                </pre>
              </div>
            )}
          </>
        )}
      </Card>

      {/* 回滚历史 Drawer */}
      <Drawer
        title="选择回滚版本"
        placement="right"
        width={720}
        open={rollbackDrawerOpen}
        onClose={() => setRollbackDrawerOpen(false)}
        loading={rollbackLoading}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">选择一个历史成功版本进行回滚部署。回滚将使用历史版本的镜像标签重新部署。</Text>
        </div>
        <Table
          dataSource={rollbackHistory}
          rowKey="id"
          loading={rollbackLoading}
          pagination={{
            current: rollbackHistoryPage,
            total: rollbackHistoryTotal,
            pageSize: 10,
            onChange: (page) => loadRollbackHistory(page),
          }}
          columns={[
            {
              title: '任务ID',
              dataIndex: 'id',
              width: 80,
              render: (id: number) => <Link to={`/publish/tasks/${id}`}>#{id}</Link>,
            },
            {
              title: '镜像标签',
              dataIndex: 'image_tag',
              width: 150,
              render: (tag: string) => <Tag color="blue">{tag}</Tag>,
            },
            {
              title: 'Git引用',
              dataIndex: 'git_ref',
              width: 120,
              ellipsis: true,
            },
            {
              title: '部署时间',
              dataIndex: 'finished_at',
              width: 160,
              render: (time?: string) => formatDateTime(time),
            },
            {
              title: '操作',
              width: 80,
              render: (_, record) => (
                <Popconfirm
                  title="确认回滚"
                  description={`确定回滚到镜像版本 ${record.image_tag} 吗？`}
                  onConfirm={() => handleRollback(record.id, record.image_tag)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button type="link" size="small" icon={<RollbackOutlined />}>回滚</Button>
                </Popconfirm>
              ),
            },
          ]}
          size="small"
        />
      </Drawer>
    </div>
  );
};

export default TaskDetailPage;