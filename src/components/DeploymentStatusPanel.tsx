import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Typography, Spin, Button, Empty, Space, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { listDeploymentPods, type PodInfo } from '@/service/api/publish/k8s-cluster';
import { listLinuxContainers, type DockerContainer } from '@/service/api/publish/linux-machine';
import type { DeployTask } from '@/service/api/publish/deploy-task';

const { Text } = Typography;

interface DeploymentStatusPanelProps {
  task: DeployTask;
  taskStatus: string;
}

// Pod status color mapping
const POD_STATUS_COLORS: Record<string, string> = {
  Running: 'success',
  Pending: 'warning',
  Succeeded: 'success',
  Failed: 'error',
  CrashLoopBackOff: 'error',
  ImagePullBackOff: 'error',
  ErrImagePull: 'error',
  Terminated: 'default',
  ContainerStatusUnknown: 'default',
};

// Docker container status color mapping
const getContainerStatusColor = (status: string): string => {
  if (status.startsWith('Up')) return 'success';
  if (status.startsWith('Exited')) return 'default';
  return 'processing';
};

const DeploymentStatusPanel: React.FC<DeploymentStatusPanelProps> = ({ task, taskStatus }) => {
  const [podData, setPodData] = useState<PodInfo[]>([]);
  const [containerData, setContainerData] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRuntimeInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (task.deploy_target === 'k8s' && task.k8s_cluster_id && task.deployment_name) {
        // 使用 deployment-pods API，后端会根据 Deployment selector 自动过滤
        const pods = await listDeploymentPods(
          task.k8s_cluster_id,
          task.deployment_name,
          task.k8s_namespace,
        );
        setPodData(pods || []);
      } else if (task.deploy_target === 'docker' && task.server_id) {
        const containers = await listLinuxContainers(task.server_id);
        setContainerData(containers || []);
      }
    } catch {
      setError('加载运行状态失败');
    } finally {
      setLoading(false);
    }
  }, [task.deploy_target, task.k8s_cluster_id, task.k8s_namespace, task.deployment_name, task.server_id]);

  // Fetch on mount when task is in DEPLOYING or SUCCESS state
  useEffect(() => {
    if (taskStatus !== 'DEPLOYING' && taskStatus !== 'SUCCESS') return;
    fetchRuntimeInfo();
  }, [taskStatus, fetchRuntimeInfo]);

  // Polling during DEPLOYING state
  useEffect(() => {
    if (taskStatus !== 'DEPLOYING') return;
    const timer = setInterval(fetchRuntimeInfo, 10000);
    return () => clearInterval(timer);
  }, [taskStatus, fetchRuntimeInfo]);

  // For Docker: filter containers matching deployment name
  const deploymentName = task.deployment_name || '';
  const filteredContainers = containerData.filter(container => {
    if (!deploymentName) return false;
    return container.names.some(name => {
      const cleanName = name.startsWith('/') ? name.slice(1) : name;
      return cleanName === deploymentName || cleanName.startsWith(deploymentName);
    });
  });

  // Pod summary: ready count
  const readyPods = podData.filter(p => {
    if (!p.ready) return p.status === 'Running';
    const parts = p.ready.split('/');
    return parts[0] === parts[1];
  });
  const podSummaryTag = readyPods.length === podData.length && podData.length > 0
    ? <Tag color="success">{readyPods.length}/{podData.length} Pod 就绪</Tag>
    : podData.length > 0
      ? <Tag color="warning">{readyPods.length}/{podData.length} Pod 就绪</Tag>
      : null;

  // Render K8s pod table
  const renderK8sPanel = () => {
    if (!task.k8s_cluster_id) {
      return <Alert type="warning" message="集群信息缺失，无法获取 Pod 状态" showIcon />;
    }

    if (!task.deployment_name) {
      return <Alert type="warning" message="Deployment 名称缺失，无法查询 Pod" showIcon />;
    }

    if (loading && podData.length === 0) {
      return <Spin size="small" style={{ display: 'block', margin: '16px auto' }} />;
    }

    if (error) {
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert type="error" message={error} showIcon />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchRuntimeInfo}>重试</Button>
        </Space>
      );
    }

    if (podData.length === 0) {
      return <Empty description="未找到关联的 Pod" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <div>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Pod 运行状态</Text>
          {podSummaryTag}
          {loading && <Spin size="small" />}
        </div>
        <Table
          dataSource={podData}
          rowKey="name"
          size="small"
          pagination={false}
          scroll={{ y: 240 }}
          style={{ fontSize: 12 }}
          columns={[
            {
              title: '名称',
              dataIndex: 'name',
              ellipsis: true,
              width: 180,
              render: (name: string) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{name}</Text>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 120,
              render: (status: string) => (
                <Tag color={POD_STATUS_COLORS[status] || 'default'} style={{ fontSize: 11 }}>{status}</Tag>
              ),
            },
            {
              title: '就绪',
              dataIndex: 'ready',
              width: 70,
              render: (ready: string) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{ready || '--'}</Text>
              ),
            },
            {
              title: '重启',
              dataIndex: 'restart_count',
              width: 60,
              render: (count: number) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: count > 0 ? '#ff4d4f' : undefined }}>
                  {count ?? 0}
                </Text>
              ),
            },
            {
              title: '节点',
              dataIndex: 'node_name',
              ellipsis: true,
              width: 100,
              render: (name: string) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{name || '--'}</Text>
              ),
            },
          ]}
        />
      </div>
    );
  };

  // Render Docker container table
  const renderDockerPanel = () => {
    if (!task.server_id) {
      return <Alert type="warning" message="服务器信息缺失，无法获取容器状态" showIcon />;
    }

    if (loading && containerData.length === 0) {
      return <Spin size="small" style={{ display: 'block', margin: '16px auto' }} />;
    }

    if (error) {
      return (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert type="error" message={error} showIcon />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchRuntimeInfo}>重试</Button>
        </Space>
      );
    }

    if (filteredContainers.length === 0 && containerData.length > 0) {
      return <Empty description={`未找到关联的容器 (${deploymentName})`} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
      <div>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>容器运行状态</Text>
          {filteredContainers.length > 0 && (
            <Tag color={filteredContainers.every(c => c.status?.startsWith('Up')) ? 'success' : 'warning'}>
              {filteredContainers.filter(c => c.status?.startsWith('Up')).length}/{filteredContainers.length} 运行中
            </Tag>
          )}
          {loading && <Spin size="small" />}
        </div>
        <Table
          dataSource={filteredContainers}
          rowKey="id"
          size="small"
          pagination={false}
          scroll={{ y: 200 }}
          style={{ fontSize: 12 }}
          columns={[
            {
              title: '名称',
              dataIndex: 'names',
              ellipsis: true,
              width: 160,
              render: (names: string[]) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                  {names?.map(n => n.startsWith('/') ? n.slice(1) : n).join(', ') || '--'}
                </Text>
              ),
            },
            {
              title: '镜像',
              dataIndex: 'image',
              ellipsis: true,
              width: 120,
              render: (image: string) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{image}</Text>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (status: string) => (
                <Tag color={getContainerStatusColor(status)} style={{ fontSize: 11 }}>{status}</Tag>
              ),
            },
            {
              title: '端口',
              dataIndex: 'ports',
              ellipsis: true,
              width: 100,
              render: (ports: string) => (
                <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{ports || '--'}</Text>
              ),
            },
          ]}
        />
      </div>
    );
  };

  // Render Linux panel (no container info)
  const renderLinuxPanel = () => (
    <Alert
      type="info"
      message="Linux/Nginx 部署不提供容器级别运行状态监控"
      description="文件提取 + Nginx 部署模式，可通过 SSH 查看服务器文件状态"
      showIcon
    />
  );

  return (
    <div style={{ marginTop: 12 }}>
      {task.deploy_target === 'k8s' && renderK8sPanel()}
      {task.deploy_target === 'docker' && renderDockerPanel()}
      {task.deploy_target === 'linux' && renderLinuxPanel()}
    </div>
  );
};

export default DeploymentStatusPanel;