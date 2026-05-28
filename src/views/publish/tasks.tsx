import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormDigit, ProFormSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Space, Alert, Tooltip } from 'antd';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/deploy-task';
import type { DeployTask, CreateDeployTaskRequest } from '@/service/api/publish/deploy-task';
import { fetchK8sClusters } from '@/service/api/publish/k8s-cluster';
import { fetchEnvironments } from '@/service/api/publish/environment';
import { fetchApplications } from '@/service/api/publish/applications';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING:   { color: 'default',    label: '等待中' },
  BUILDING:  { color: 'processing', label: '构建中' },
  PUSHING:   { color: 'processing', label: '推送中' },
  DEPLOYING: { color: 'warning',    label: '部署中' },
  SUCCESS:   { color: 'success',    label: '成功'   },
  FAILED:    { color: 'error',      label: '失败'   },
};

const STORAGE_KEY = 'zebra:deploy-task-ids';
const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED']);
const POLL_INTERVAL = 5000;

const readStoredIds = (): number[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
};

const writeStoredIds = (ids: number[]) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch { /* ignore */ }
};

export default function PublishTasks() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tasks, setTasks] = useState<DeployTask[]>([]);
  const [loading, setLoading] = useState(false);

  // 下拉选项
  const [appOptions, setAppOptions] = useState<{ label: string; value: number }[]>([]);
  const [envOptions, setEnvOptions] = useState<{ label: string; value: number }[]>([]);
  const [clusterOptions, setClusterOptions] = useState<{ label: string; value: number }[]>([]);

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

  // 拉取任务列表（依据 sessionStorage 中的 ID）
  const reloadTasks = async () => {
    const ids = readStoredIds();
    if (ids.length === 0) {
      setTasks([]);
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.allSettled(ids.map((id) => api.getDeployTask(id)));
      const fresh: DeployTask[] = [];
      const validIds: number[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled' && r.value) {
          fresh.push(r.value as DeployTask);
          validIds.push(ids[idx]);
        }
      });
      // 按 ID 倒序展示（最新创建在前）
      fresh.sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0));
      setTasks(fresh);
      // 自动剔除查询失败（如已过期）的 ID
      if (validIds.length !== ids.length) writeStoredIds(validIds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reloadTasks(); }, []);

  // 自动轮询非终态任务
  useEffect(() => {
    const hasActive = tasks.some((t) => !TERMINAL_STATUSES.has(String(t.status ?? 'PENDING').toUpperCase()));
    if (!hasActive) return;
    const timer = setInterval(reloadTasks, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [tasks]);

  const removeTask = (id: number) => {
    const ids = readStoredIds().filter((x) => x !== id);
    writeStoredIds(ids);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    writeStoredIds([]);
    setTasks([]);
    message.success('已清空本地任务列表');
  };

  const findLabel = (opts: { label: string; value: number }[], v?: number) =>
    opts.find((o) => o.value === v)?.label ?? (v ? `#${v}` : '-');

  const columns: ProColumns<DeployTask>[] = [
    { title: '任务ID', dataIndex: 'id', width: 80 },
    {
      title: '状态', dataIndex: 'status', width: 110,
      render: (val) => {
        const s = STATUS_CONFIG[String(val).toUpperCase()] ?? { color: 'default', label: String(val ?? '-') };
        return <Tag color={s.color}>{s.label}</Tag>;
      }
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
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        <Button key="del" type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeTask(row.id)}>
          移除
        </Button>
      ]
    }
  ];

  return (
    <>
      <Alert
        type="info" showIcon style={{ marginBottom: 16 }}
        icon={<InfoCircleOutlined />}
        message="发布任务列表存储于本会话的浏览器缓存（sessionStorage）。后端暂未提供任务列表接口，刷新页面后仍可见，但关闭浏览器会清空记录。"
      />
      <ProTable<DeployTask>
        rowKey="id" actionRef={actionRef} columns={columns}
        dataSource={tasks} loading={loading}
        headerTitle={t('route.publish_tasks', { defaultValue: '发布任务' })}
        toolBarRender={() => [
          <Space key="bar">
            <Tooltip title="刷新所有任务状态">
              <Button icon={<ReloadOutlined />} loading={loading} onClick={reloadTasks}>刷新</Button>
            </Tooltip>
            <Button danger onClick={clearAll}>清空列表</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('common.add', { defaultValue: '创建发布任务' })}
            </Button>
          </Space>
        ]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
        options={false}
      />

      <ModalForm<CreateDeployTaskRequest>
        title="创建发布任务"
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            const res = await api.createDeployTask(values);
            const taskId = (res as any)?.task_id;
            if (!taskId) {
              message.warning('任务已提交，但未返回任务ID');
              return true;
            }
            message.success(`任务创建成功，任务ID: ${taskId}`);
            // 写入 sessionStorage
            const ids = readStoredIds();
            if (!ids.includes(taskId)) writeStoredIds([taskId, ...ids]);
            // 立即拉取一次任务详情
            try {
              const task = await api.getDeployTask(taskId);
              setTasks((prev) => [task as DeployTask, ...prev.filter((t) => t.id !== taskId)]);
            } catch { /* ignore */ }
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error(e?.message || '创建失败');
            return false;
          }
        }}
      >
        <ProFormSelect name="project_id" label="应用" rules={[{ required: true }]} options={appOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormSelect name="env_id" label="环境" rules={[{ required: true }]} options={envOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormText name="git_ref" label="Git 引用（分支/标签）" rules={[{ required: true }]} placeholder="main" />
        <ProFormSelect name="k8s_cluster_id" label="K8s 集群" rules={[{ required: true }]} options={clusterOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormText name="k8s_namespace" label="K8s 命名空间" placeholder="default" />
        <ProFormText name="jenkins_job_name" label="Jenkins 任务名称" rules={[{ required: true }]} />
        <ProFormText name="harbor_project" label="Harbor 项目" rules={[{ required: true }]} />
        <ProFormText name="image_name" label="镜像名称" rules={[{ required: true }]} />
        <ProFormText name="deployment_name" label="K8s Deployment 名称" placeholder="留空则自动按应用ID生成" />
      </ModalForm>
    </>
  );
}
