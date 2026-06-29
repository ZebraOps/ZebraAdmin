import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ProTable, type ProColumns,
} from '@ant-design/pro-components';
import {
  Button, Tag, message, Modal, Select, Space, Tabs, Tooltip, Descriptions, Input,
} from 'antd';
import {
  ReloadOutlined, CodeOutlined, DeleteOutlined, FileTextOutlined,
  RedoOutlined, ContainerOutlined, SearchOutlined,
} from '@ant-design/icons';
import { isHandledError } from '@/service/request';
import * as k8sApi from '@/service/api/publish/k8s-cluster';
import type { PodInfo, PodMetric } from '@/service/api/publish/k8s-cluster';
import * as linuxApi from '@/service/api/publish/linux-machine';
import type { DockerContainer } from '@/service/api/publish/linux-machine';
import * as containerOps from '@/service/api/publish/container-operations';
import * as applicationsApi from '@/service/api/publish/applications';
import type { ApplicationDeployment } from '@/service/api/publish/applications';
import { usePublishStore } from '@/store/publish';
import { usePermission } from '@/hooks/usePermission';
import { localStg } from '@/utils/storage';
import ContainerTerminal from '@/components/ContainerTerminal';
import ServiceLogPanel from '@/components/ServiceLogPanel';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

/** Extract a display name from Docker container names field (handles string[], object[], string, object) */
function getContainerDisplayName(container: DockerContainer): string {
  const name = container.names?.[0];
  if (!name) return container.id.slice(0, 12);
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object') {
    const n = name as any;
    return n.Name || n.name || n.Names || `container-${container.id.slice(0, 8)}`;
  }
  return String(name);
}

/** Flatten pods + containers into rows for the container group table */
interface K8sContainerRow {
  podName: string;
  podIP: string;
  containerName: string;
  containerReady: boolean;
  containerState: string;
  podStatus: string;
  podReady: string;
  namespace: string;
  startTime?: string;
  image: string;
  restarts: number;
  cpu?: string;
  memory?: string;
  _pod: PodInfo; // keep reference for actions
  _key: string;
}

function flattenPodsToRows(pods: PodInfo[], metrics: Record<string, PodMetric>): K8sContainerRow[] {
  const rows: K8sContainerRow[] = [];
  for (const pod of pods) {
    const m = metrics[pod.name];
    const containers = pod.containers && pod.containers.length > 0
      ? pod.containers
      : [{ name: '-', ready: false, restart_count: 0, image: '-', state: 'unknown' }];
    for (const c of containers) {
      rows.push({
        podName: pod.name,
        podIP: pod.pod_ip || '-',
        containerName: c.name,
        containerReady: c.ready,
        containerState: c.state,
        podStatus: pod.status,
        podReady: pod.ready || '-',
        namespace: pod.namespace,
        startTime: pod.start_time,
        image: c.image || '-',
        restarts: c.restart_count ?? 0,
        cpu: m?.cpu,
        memory: m?.memory,
        _pod: pod,
        _key: `${pod.name}::${c.name}`,
      });
    }
  }
  return rows;
}

function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('running')) return 'success';
  if (s.includes('pending') || s.includes('containercreating')) return 'processing';
  if (s.includes('error') || s.includes('crash') || s.includes('backoff') || s.includes('failed')) return 'error';
  if (s.includes('terminat') || s.includes('completed')) return 'default';
  if (s.includes('waiting')) return 'warning';
  return 'default';
}

function formatUptime(startTime?: string): string {
  if (!startTime) return '-';
  const start = new Date(startTime).getTime();
  const diff = Date.now() - start;
  if (diff < 0) return '-';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function PublishContainerList() {
  const publishStore = usePublishStore();
  const { hasComp } = usePermission();

  useEffect(() => { publishStore.loadAll(); }, [publishStore]);

  // --- K8s Tab State ---
  const [k8sClusterId, setK8sClusterId] = useState<number | undefined>();
  const [k8sEnvId, setK8sEnvId] = useState<number | undefined>();
  const [k8sAppId, setK8sAppId] = useState<number | undefined>();
  const [k8sNamespace, setK8sNamespace] = useState('default');
  const [k8sAppOptions, setK8sAppOptions] = useState<{ label: string; value: number }[]>([]);
  const [k8sPods, setK8sPods] = useState<PodInfo[]>([]);
  const [k8sPodMetrics, setK8sPodMetrics] = useState<Record<string, PodMetric>>({});
  const [podNameFilter, setPodNameFilter] = useState('');
  const [k8sLoading, setK8sLoading] = useState(false);
  const [k8sDeployConfig, setK8sDeployConfig] = useState<ApplicationDeployment | null>(null);

  // Refs to avoid stale closure in ProTable action column render functions
  const k8sClusterIdRef = useRef(k8sClusterId);
  k8sClusterIdRef.current = k8sClusterId;
  const k8sPodsRef = useRef(k8sPods);
  k8sPodsRef.current = k8sPods;

  // --- Docker Tab State ---
  const [dockerServerId, setDockerServerId] = useState<number | undefined>();
  const [dockerContainers, setDockerContainers] = useState<DockerContainer[]>([]);
  const [dockerLoading, setDockerLoading] = useState(false);
  const [dockerSelectedRows, setDockerSelectedRows] = useState<DockerContainer[]>([]);

  // --- Terminal State ---
  const [k8sTermOpen, setK8sTermOpen] = useState(false);
  const [k8sTermPod, setK8sTermPod] = useState<PodInfo | null>(null);
  const [k8sTermClusterId, setK8sTermClusterId] = useState<number>(0);
  const [selectedContainer, setSelectedContainer] = useState('');
  const [containerSelectOpen, setContainerSelectOpen] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const k8sConnIdRef = useRef(0);

  const [dockerTermOpen, setDockerTermOpen] = useState(false);
  const [dockerTermServerId, setDockerTermServerId] = useState<number>(0);
  const [dockerTermContainerId, setDockerTermContainerId] = useState('');

  // --- Log State ---
  const [logOpen, setLogOpen] = useState(false);
  const [logType, setLogType] = useState<'k8s' | 'docker'>('k8s');
  const [logClusterId, setLogClusterId] = useState<number>(0);
  const [logPodName, setLogPodName] = useState('');
  const [logNamespace, setLogNamespace] = useState('');
  const [logServerId, setLogServerId] = useState<number>(0);
  const [logContainerId, setLogContainerId] = useState('');

  const wsBaseURL = (import.meta.env.VITE_BASE_URL || '').trim().replace(/^http/, 'ws').replace(/\/$/, '');

  // --- K8s Data Fetching ---
  // Load apps for env → filter by cluster and deploy_target=k8s
  const loadK8sApps = useCallback(async (envId: number) => {
    try {
      const deployments = await applicationsApi.listDeploymentsByEnvironment(envId);
      const k8sDeploys = (deployments ?? []).filter(
        d => d.deploy_target === 'k8s' && d.k8s_cluster_id === k8sClusterId
      );
      const appMap = new Map<number, string>();
      for (const d of k8sDeploys) {
        const app = publishStore.apps.find(a => a.id === d.application_id);
        if (app && !appMap.has(app.id)) appMap.set(app.id, app.c_name || `App#${app.id}`);
      }
      setK8sAppOptions(Array.from(appMap.entries()).map(([id, name]) => ({ label: name, value: id })));
    } catch {
      setK8sAppOptions([]);
    }
  }, [k8sClusterId, publishStore.apps]);

  // Query pods by app+env → deployment config → namespace
  const loadK8sPods = useCallback(async () => {
    if (!k8sClusterId || !k8sEnvId || !k8sAppId) { setK8sPods([]); setK8sDeployConfig(null); return; }
    setK8sLoading(true);
    try {
      const deployments = await applicationsApi.lookupDeploymentsByAppAndEnv(k8sAppId, k8sEnvId);
      const deploy = (deployments ?? []).find(
        d => d.deploy_target === 'k8s' && d.k8s_cluster_id === k8sClusterId
      );
      if (!deploy) { message.warning('未找到匹配的部署配置'); setK8sPods([]); setK8sDeployConfig(null); return; }

      const ns = deploy.k8s_namespace || 'default';
      setK8sNamespace(ns);
      setK8sDeployConfig(deploy);

      const [podList, metrics] = await Promise.all([
        k8sApi.listK8sPods(k8sClusterId, ns),
        k8sApi.fetchPodMetrics(k8sClusterId, ns).catch(() => ({})),
      ]);
      setK8sPods(Array.isArray(podList) ? podList : []);
      setK8sPodMetrics(metrics as Record<string, PodMetric>);
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '获取 Pod 列表失败');
      setK8sPods([]);
      setK8sDeployConfig(null);
    } finally {
      setK8sLoading(false);
    }
  }, [k8sClusterId, k8sEnvId, k8sAppId]);

  // --- Docker Data Fetching ---
  const loadDockerContainers = useCallback(async () => {
    if (!dockerServerId) { setDockerContainers([]); return; }
    setDockerLoading(true);
    try {
      const list = await linuxApi.listLinuxContainers(dockerServerId);
      setDockerContainers(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '获取容器列表失败');
      setDockerContainers([]);
    } finally {
      setDockerLoading(false);
    }
  }, [dockerServerId]);

  // --- K8s Terminal (pod-level) ---
  // Uses refs (not state directly) to avoid stale closure issues when ProTable
  // caches action-column rendered cells across re-renders.
  const openK8sTerminal = (podName: string) => {
    console.log('[K8sTerm] openK8sTerminal called, podName:', podName);
    const clusterId = k8sClusterIdRef.current;
    const pods = k8sPodsRef.current;
    console.log('[K8sTerm] clusterId:', clusterId, 'pods count:', pods?.length);
    if (!clusterId) { console.warn('[K8sTerm] no clusterId selected'); message.warning('请先选择 K8s 集群'); return; }
    const pod = pods.find(p => p.name === podName);
    if (!pod) { console.warn('[K8sTerm] pod not found in ref:', podName, 'available:', pods.map(p=>p.name)); message.warning(`Pod "${podName}" 信息未找到，请刷新后重试`); return; }
    console.log('[K8sTerm] pod found, containers:', pod.containers?.length);
    setK8sTermClusterId(clusterId);
    const containers = pod.containers || [];
    if (containers.length <= 1) {
      setSelectedContainer(containers[0]?.name ?? '');
      setK8sTermPod(pod);
      setK8sTermOpen(true);
      console.log('[K8sTerm] opening terminal modal directly');
    } else {
      setK8sTermPod(pod);
      setSelectedContainer(containers[0]?.name ?? '');
      setContainerSelectOpen(true);
      console.log('[K8sTerm] opening container selector modal');
    }
  };

  const closeK8sTerminal = () => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) ws.close();
    if (xtermRef.current) { xtermRef.current.dispose(); xtermRef.current = null; fitAddonRef.current = null; }
    setK8sTermOpen(false);
    setK8sTermPod(null);
    setSelectedContainer('');
  };

  // K8s Terminal WebSocket setup
  useEffect(() => {
    console.log('[K8sTerm] useEffect:', { k8sTermOpen, pod: k8sTermPod?.name, k8sTermClusterId, termRef: !!termRef.current });
    if (!k8sTermOpen || !k8sTermPod || !k8sTermClusterId || !termRef.current) return;

    // Dispose previous terminal if exists (Modal now stays in DOM, no destroyOnClose)
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }

    console.log('[K8sTerm] Creating Terminal...');
    const term = new Terminal({
      theme: { background: '#1e1e1e', foreground: '#d4d4d4', cursor: '#14b8a6', cursorAccent: '#1e1e1e' },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 14,
      cursorBlink: true,
      disableStdin: false,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    term.writeln('\x1b[90m正在连接 Pod 终端...\x1b[0m');

    const fitTimer = setTimeout(() => { fitAddon.fit(); term.focus(); }, 150);

    const wsTimer = setTimeout(() => {
      const connId = ++k8sConnIdRef.current;
      const token = localStg.get<string>('token') || '';
      const ns = k8sTermPod.namespace || 'default';
      const containerParam = selectedContainer ? `&container=${encodeURIComponent(selectedContainer)}` : '';
      const url = `${wsBaseURL}/cicd/api/k8s/clusters/${k8sTermClusterId}/pods/${encodeURIComponent(k8sTermPod.name)}/exec?namespace=${encodeURIComponent(ns)}&token=${token}${containerParam}`;
      console.log('[K8sTerm] WS URL:', url.replace(/token=[^&]+/, 'token=***'));

      const ws = new WebSocket(url);
      ws.binaryType = 'arraybuffer'; // 后端发送 BinaryMessage，需以此接收 ArrayBuffer
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[K8sTerm] WS onopen');
        if (k8sConnIdRef.current !== connId) return;
        term.clear(); term.focus(); message.success('Pod 终端已连接');
      };
      ws.onmessage = (event) => {
        console.log('[K8sTerm] WS recv, type:', typeof event.data, 'len:', event.data?.length);
        if (event.data instanceof ArrayBuffer) {
          term.write(new TextDecoder().decode(event.data));
        } else if (typeof event.data === 'string') {
          term.write(event.data);
        }
      };
      const disposeOnData = term.onData((data: string) => {
        console.log('[K8sTerm] onData, len:', data.length, 'wsState:', ws.readyState);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        } else {
          console.warn('[K8sTerm] WS not open, readyState:', ws.readyState);
        }
      });
      console.log('[K8sTerm] onData registered');
      ws.onerror = () => {
        if (k8sConnIdRef.current !== connId) return;
        term.writeln('\x1b[31m连接失败，请检查网络或 Pod 状态\x1b[0m');
        message.error('Pod 终端连接失败');
      };
      ws.onclose = (event) => {
        if (k8sConnIdRef.current !== connId) return;
        wsRef.current = null;
        disposeOnData?.dispose();
        if (!event.wasClean) term.writeln('\x1b[31m连接异常断开\x1b[0m');
      };
    }, 250);

    return () => {
      clearTimeout(fitTimer);
      clearTimeout(wsTimer);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) ws.close();
    };
  }, [k8sTermOpen, k8sTermPod, k8sTermClusterId, wsBaseURL, selectedContainer]);

  // --- K8s Pod Actions ---
  const handleK8sDeletePod = async (podName: string) => {
    const clusterId = k8sClusterIdRef.current;
    const pods = k8sPodsRef.current;
    if (!clusterId) { message.warning('请先选择 K8s 集群'); return; }
    const pod = pods.find(p => p.name === podName);
    if (!pod) { message.warning(`Pod "${podName}" 信息未找到，请刷新后重试`); return; }
    Modal.confirm({
      title: '删除 Pod 确认',
      content: `确认删除 Pod "${pod.name}"？Pod 会被重建。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      transitionName: '',
      maskTransitionName: '',
      onOk: async () => {
        try {
          await k8sApi.deleteK8sPod(clusterId, pod.name, pod.namespace);
          message.success(`Pod "${pod.name}" 已删除`);
          containerOps.recordContainerOperation({
            operation_type: 'delete', target_type: 'k8s',
            target_detail: `cluster: ${clusterId} / pod: ${pod.name} / ns: ${pod.namespace}`,
            operator: 'admin', result: 'success',
          }).catch(() => {});
          loadK8sPods();
        } catch (e: unknown) {
          if (!isHandledError(e)) message.error((e as any)?.message || '删除失败');
        }
      },
    });
  };

  const handleDockerBatchRestart = async () => {
    if (dockerSelectedRows.length === 0) { message.warning('请先选择要重启的容器'); return; }
    Modal.confirm({
      title: '批量重启确认',
      content: `确认重启以下 ${dockerSelectedRows.length} 个容器？`,
      okText: '确认重启',
      cancelText: '取消',
      transitionName: '',
      maskTransitionName: '',
      onOk: async () => {
        const results = await Promise.allSettled(
          dockerSelectedRows.map(c =>
            containerOps.restartDockerContainer(dockerServerId!, c.id).then(() => {
              containerOps.recordContainerOperation({
                operation_type: 'batch_restart', target_type: 'docker',
                target_detail: `server: ${dockerServerId} / container: ${c.names?.[0] || c.id}`,
                operator: 'admin', result: 'success',
              }).catch(() => {});
            })
          )
        );
        const ok = results.filter(r => r.status === 'fulfilled').length;
        const fail = results.filter(r => r.status === 'rejected').length;
        if (fail > 0) message.warning(`重启完成：${ok} 成功, ${fail} 失败`);
        else message.success(`已成功重启 ${ok} 个容器`);
        loadDockerContainers();
      },
    });
  };

  const handleDockerRestart = async (container: DockerContainer) => {
    if (!dockerServerId) return;
    Modal.confirm({
      title: '重启容器', content: `确认重启容器 ${getContainerDisplayName(container)}？`,
      okText: '重启',
      transitionName: '', maskTransitionName: '',
      onOk: async () => {
        try {
          await containerOps.restartDockerContainer(dockerServerId, container.id);
          message.success('容器已重启');
          containerOps.recordContainerOperation({
            operation_type: 'restart', target_type: 'docker',
            target_detail: `server: ${dockerServerId} / container: ${getContainerDisplayName(container)}`,
            operator: 'admin', result: 'success',
          }).catch(() => {});
          loadDockerContainers();
        } catch (e: unknown) {
          if (!isHandledError(e)) message.error((e as any)?.message || '重启失败');
        }
      },
    });
  };

  const handleDockerDelete = async (container: DockerContainer) => {
    if (!dockerServerId) return;
    Modal.confirm({
      title: '删除容器', content: `确认删除容器 ${getContainerDisplayName(container)}？此操作不可恢复。`,
      okText: '确认删除', okType: 'danger',
      transitionName: '', maskTransitionName: '',
      onOk: async () => {
        try {
          await containerOps.deleteDockerContainer(dockerServerId, container.id, true);
          message.success('容器已删除');
          containerOps.recordContainerOperation({
            operation_type: 'delete', target_type: 'docker',
            target_detail: `server: ${dockerServerId} / container: ${getContainerDisplayName(container)}`,
            operator: 'admin', result: 'success',
          }).catch(() => {});
          loadDockerContainers();
        } catch (e: unknown) {
          if (!isHandledError(e)) message.error((e as any)?.message || '删除失败');
        }
      },
    });
  };

  // --- K8s Container Group Columns ---
  const k8sColumns: ProColumns<K8sContainerRow>[] = [
    {
      title: 'Pod 名称', dataIndex: 'podName', width: 200, ellipsis: true,
      render: (_, row) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(row.podName ?? '-')}</span>,
    },
    {
      title: '容器名称', dataIndex: 'containerName', width: 160, ellipsis: true,
      render: (_, row) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(row.containerName ?? '-')}</span>,
    },
    {
      title: '状态', dataIndex: 'podStatus', width: 140,
      render: (val, row) => (
        <Space size={4}>
          <Tag color={getStatusColor(String(val ?? ''))}>{String(val ?? '-')}</Tag>
          {row.containerState !== 'running' && row.containerState !== 'unknown' && (
            <Tag color="warning" style={{ fontSize: 11 }}>{row.containerState}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '是否就绪', dataIndex: 'containerReady', width: 80,
      render: (_, row) => row.containerReady
        ? <Tag color="success">✅ 就绪</Tag>
        : <Tag color="error">❌ 未就绪</Tag>,
    },
    {
      title: 'IP', dataIndex: 'podIP', width: 130,
      render: (_, row) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(row.podIP ?? '-')}</span>,
    },
    {
      title: 'CPU', dataIndex: 'cpu', width: 80, search: false,
      render: (_, row) => row.cpu ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(row.cpu)}</span> : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: '内存', dataIndex: 'memory', width: 90, search: false,
      render: (_, row) => row.memory ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(row.memory)}</span> : <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: '运行时间', dataIndex: 'startTime', width: 100, search: false,
      render: (_, row) => <span>{formatUptime(row.startTime)}</span>,
    },
    {
      title: '创建时间', dataIndex: 'startTime', width: 160, search: false,
      render: (_, row) => <span>{row.startTime ? new Date(row.startTime).toLocaleString() : '-'}</span>,
    },
    {
      title: '操作', key: 'actions', width: 130, fixed: 'right', search: false,
      render: (_, row) => (
        <Space size="small">
          {hasComp('publish_container_k8s_terminal') && (
            <Tooltip title="进入终端">
              <Button type="link" size="small" icon={<CodeOutlined />}
                onClick={() => openK8sTerminal(row.podName)}>终端</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_k8s_delete') && (
            <Tooltip title="删除 Pod">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}
                onClick={() => handleK8sDeletePod(row.podName)}>删除</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // --- Docker Table Columns ---
  const dockerColumns: ProColumns<DockerContainer>[] = [
    {
      title: '容器ID', dataIndex: 'id', width: 130, search: false,
      render: (val) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{String(val ?? '').slice(0, 12)}</span>,
    },
    {
      title: '名称', dataIndex: 'names', ellipsis: true,
      render: (_, record) => getContainerDisplayName(record),
    },
    { title: '镜像', dataIndex: 'image', ellipsis: true, search: false },
    {
      title: '状态', dataIndex: 'status', width: 140, search: false,
      render: (val) => {
        const s = String(val ?? '');
        const color = s.toLowerCase().includes('up') ? 'success' : s.toLowerCase().includes('exit') ? 'default' : 'processing';
        return <Tag color={color}>{s || '-'}</Tag>;
      },
    },
    { title: '端口', dataIndex: 'ports', ellipsis: true, width: 200, search: false },
    {
      title: '操作', key: 'actions', width: 260, fixed: 'right', search: false,
      render: (_, record) => (
        <Space size="small">
          {hasComp('publish_container_docker_terminal') && (
            <Tooltip title="进入终端">
              <Button type="link" size="small" icon={<CodeOutlined />}
                onClick={() => {
                  setDockerTermServerId(dockerServerId!);
                  setDockerTermContainerId(record.id);
                  setDockerTermOpen(true);
                }}>终端</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_docker_logs') && (
            <Tooltip title="查看日志">
              <Button type="link" size="small" icon={<FileTextOutlined />}
                onClick={() => {
                  setLogType('docker');
                  setLogServerId(dockerServerId!);
                  setLogContainerId(record.id);
                  setLogOpen(true);
                }}>日志</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_docker_restart') && (
            <Tooltip title="重启容器">
              <Button type="link" size="small" icon={<RedoOutlined />}
                onClick={() => handleDockerRestart(record)}>重启</Button>
            </Tooltip>
          )}
          {hasComp('publish_container_docker_delete') && (
            <Tooltip title="删除容器">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}
                onClick={() => handleDockerDelete(record)}>删除</Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // --- Filter JSX ---
  const k8sFilterBar = (
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="选择 K8s 集群"
        style={{ width: 200 }}
        showSearch
        allowClear
        value={k8sClusterId}
        onChange={(val) => { setK8sClusterId(val); setK8sEnvId(undefined); setK8sAppId(undefined); setK8sAppOptions([]); setK8sPods([]); }}
        options={publishStore.clusterOptions}
        fieldNames={{ label: 'label', value: 'value' }}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Select
        placeholder="选择环境"
        style={{ width: 180 }}
        showSearch
        allowClear
        value={k8sEnvId}
        onChange={(val) => { setK8sEnvId(val); setK8sAppId(undefined); setK8sPods([]); if (val && k8sClusterId) loadK8sApps(val); }}
        options={publishStore.envOptions}
        fieldNames={{ label: 'label', value: 'value' }}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Select
        placeholder="选择应用"
        style={{ width: 200 }}
        showSearch
        allowClear
        value={k8sAppId}
        onChange={(val) => { setK8sAppId(val); setK8sPods([]); }}
        options={k8sAppOptions}
        disabled={!k8sEnvId}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Button type="primary" icon={<SearchOutlined />} loading={k8sLoading} onClick={loadK8sPods}
        disabled={!k8sClusterId || !k8sEnvId || !k8sAppId}>
        查询
      </Button>
    </Space>
  );

  // Compute service overview data
  const serviceImage = k8sPods.length > 0
    ? (k8sPods[0].containers?.[0]?.image || '-')
    : '-';
  const podRows = flattenPodsToRows(
    podNameFilter ? k8sPods.filter(p => p.name.toLowerCase().includes(podNameFilter.toLowerCase())) : k8sPods,
    k8sPodMetrics,
  );

  const dockerFilterBar = (
    <Space wrap style={{ marginBottom: 16 }}>
      <Select
        placeholder="选择 Linux 主机"
        style={{ width: 240 }}
        showSearch
        allowClear
        value={dockerServerId}
        onChange={(val) => setDockerServerId(val)}
        options={publishStore.linuxMachineOptions}
        fieldNames={{ label: 'label', value: 'value' }}
        filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
      />
      <Button type="primary" icon={<ReloadOutlined />} loading={dockerLoading} onClick={loadDockerContainers}>
        查询
      </Button>
      {hasComp('publish_container_docker_restart') && dockerSelectedRows.length > 0 && (
        <Button type="primary" danger icon={<RedoOutlined />} onClick={handleDockerBatchRestart}>
          批量重启 ({dockerSelectedRows.length})
        </Button>
      )}
    </Space>
  );

  const tabItems = [
    {
      key: 'k8s',
      label: <span><ContainerOutlined /> K8s 容器</span>,
      children: (
        <div>
          {k8sFilterBar}

          {/* 服务概览 */}
          {k8sPods.length > 0 && (
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, md: 4 }}
              style={{ marginBottom: 16 }}
              items={[
                { key: '1', label: 'Pod 总数量', children: <strong>{k8sPods.length}</strong> },
                { key: '2', label: '命名空间', children: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{k8sNamespace}</span> },
                { key: '3', label: '镜像', children: <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{serviceImage}</span> },
              ]}
            />
          )}

          {/* Pod 名称过滤 */}
          {k8sPods.length > 0 && (
            <Input
              placeholder="按 Pod 名称过滤"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 320, marginBottom: 16 }}
              value={podNameFilter}
              onChange={(e) => setPodNameFilter(e.target.value)}
            />
          )}

          {/* 容器组 Table */}
          <ProTable<K8sContainerRow>
            rowKey="_key"
            columns={k8sColumns}
            dataSource={podRows}
            loading={k8sLoading}
            search={false}
            options={{ reload: loadK8sPods, density: true }}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: '请选择集群、环境和应用后点击查询' }}
          />
        </div>
      ),
    },
    {
      key: 'docker',
      label: <span><ContainerOutlined /> Docker 容器</span>,
      children: (
        <div>
          {dockerFilterBar}
          <ProTable<DockerContainer>
            rowKey="id"
            columns={dockerColumns}
            dataSource={dockerContainers}
            loading={dockerLoading}
            search={false}
            options={{ reload: loadDockerContainers, density: true }}
            pagination={{ pageSize: 20 }}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys: dockerSelectedRows.map(r => r.id),
              onChange: (_, rows) => setDockerSelectedRows(rows),
            }}
            locale={{ emptyText: '请选择主机后点击查询' }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="k8s" items={tabItems} size="large" style={{ padding: '0 8px' }} />

      {/* K8s Pod Terminal Modal */}
      <Modal
        title={`Pod 终端 — ${k8sTermPod?.name ?? ''}${selectedContainer ? ` (${selectedContainer})` : ''}`}
        open={k8sTermOpen}
        onCancel={closeK8sTerminal}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        maskClosable
        keyboard={false}
        transitionName=""
        maskTransitionName=""
        // Ant Design Modal auto-focus steals focus from xterm; disable it
        autoFocus={false}
        // Force focus to xterm after Modal finishes opening
        afterOpenChange={(open) => {
          if (open) {
            setTimeout(() => {
              if (xtermRef.current) {
                xtermRef.current.focus();
                console.log('[K8sTerm] forced xterm focus after Modal open');
              }
            }, 100);
          }
        }}
      >
        <div ref={termRef}
          onClick={() => {
            // Click the terminal area → refocus xterm
            if (xtermRef.current) {
              setTimeout(() => xtermRef.current?.focus(), 0);
            }
          }}
          style={{
            width: '100%', height: 500, backgroundColor: '#1e1e1e',
            borderRadius: 4, padding: 4,
          }}
        />
      </Modal>

      {/* Multi-container Pod Selector */}
      <Modal
        title={`选择容器 — ${k8sTermPod?.name ?? ''}`}
        open={containerSelectOpen}
        onOk={() => { setContainerSelectOpen(false); setK8sTermOpen(true); }}
        onCancel={() => { setContainerSelectOpen(false); setK8sTermPod(null); setSelectedContainer(''); }}
        okText="连接" cancelText="取消" width={400}
        transitionName="" maskTransitionName=""
      >
        <div style={{ marginBottom: 12 }}>该 Pod 有多个容器，请选择：</div>
        <Select
          value={selectedContainer}
          onChange={(val) => setSelectedContainer(val)}
          style={{ width: '100%' }}
          options={k8sTermPod?.containers?.map(c => ({ label: c.name, value: c.name })) ?? []}
        />
      </Modal>

      {/* Docker Terminal Modal */}
      <Modal
        title="Docker 容器终端"
        open={dockerTermOpen}
        onCancel={() => setDockerTermOpen(false)}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        destroyOnClose
        transitionName="" maskTransitionName=""
      >
        <ContainerTerminal
          key={`docker-term-${dockerTermServerId}-${dockerTermContainerId}`}
          serverId={dockerTermServerId}
          containerId={dockerTermContainerId}
          autoConnect
        />
      </Modal>

      {/* Log Panel Modal */}
      <Modal
        title="容器日志"
        open={logOpen}
        onCancel={() => setLogOpen(false)}
        footer={null}
        width="80vw"
        style={{ top: 20 }}
        destroyOnClose
        transitionName="" maskTransitionName=""
      >
        {logType === 'k8s' && (
          <ServiceLogPanel
            key={`k8s-${logClusterId}-${logPodName}`}
            type="k8s"
            clusterId={logClusterId}
            podName={logPodName}
            namespace={logNamespace}
          />
        )}
        {logType === 'docker' && (
          <ServiceLogPanel
            key={`docker-${logServerId}-${logContainerId}`}
            type="docker"
            serverId={logServerId}
            containerId={logContainerId}
          />
        )}
      </Modal>
    </>
  );
}
