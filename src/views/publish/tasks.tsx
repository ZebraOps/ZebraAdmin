import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Space, Popconfirm, Tooltip } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
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

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED']);
const POLL_INTERVAL = 5000;

export default function PublishTasks() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasActive, setHasActive] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

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

  // 自动轮询非终态任务
  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => actionRef.current?.reload(), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [hasActive]);

  const findLabel = (opts: { label: string; value: number }[], v?: number) =>
    opts.find((o) => o.value === v)?.label ?? (v ? `#${v}` : '-');

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
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        <Popconfirm
          key="del" title="确认删除该任务？"
          onConfirm={async () => {
            try {
              await api.deleteDeployTask(row.id);
              message.success('已删除');
              actionRef.current?.reload();
            } catch (e: any) {
              if (!isHandledError(e)) message.error('删除失败');
            }
          }}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<DeployTask>
        rowKey="id" actionRef={actionRef} columns={columns}
        headerTitle={t('route.publish_tasks', { defaultValue: '发布任务' })}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
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
        )}
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
          <Space key="bar">
            <Tooltip title="刷新任务列表">
              <Button icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>刷新</Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              {t('common.add', { defaultValue: '创建发布任务' })}
            </Button>
          </Space>
        ]}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        options={{ reload: false, density: false }}
        search={{ labelWidth: 'auto' }}
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
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error(e?.message || '创建失败');
            return false;
          }
        }}
      >
        <ProFormSelect name="project_id" label="应用" rules={[{ required: true }]} options={appOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择应用" />
        <ProFormSelect name="env_id" label="环境" rules={[{ required: true }]} options={envOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择环境" />
        <ProFormText name="git_ref" label="Git 引用（分支/标签）" rules={[{ required: true }]} placeholder="main" />
        <ProFormSelect name="k8s_cluster_id" label="K8s 集群" rules={[{ required: true }]} options={clusterOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} placeholder="请选择K8s集群" />
        <ProFormText name="k8s_namespace" label="K8s 命名空间" placeholder="default" />
        <ProFormText name="jenkins_job_name" label="Jenkins 任务名称" rules={[{ required: true }]} placeholder="请输入Jenkins任务名称" />
        <ProFormText name="harbor_project" label="Harbor 项目" rules={[{ required: true }]} placeholder="请输入Harbor项目" />
        <ProFormText name="image_name" label="镜像名称" rules={[{ required: true }]} placeholder="请输入镜像名称" />
        <ProFormText name="deployment_name" label="K8s Deployment 名称" placeholder="留空则自动按应用ID生成" />
      </ModalForm>
    </>
  );
}
