import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Input, Modal, Tooltip } from 'antd';
import {
  ReloadOutlined,
  ExpandOutlined,
  CompressOutlined,
  SearchOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import AnsiToHtml from 'ansi-to-html';
import { getPodLogs } from '@/service/api/publish/k8s-cluster';
import { getContainerLogs } from '@/service/api/publish/linux-machine';
import './ServiceLogPanel.css';

export interface ServiceLogPanelProps {
  /** Log source type */
  type: 'k8s' | 'docker';
  /** For k8s: cluster ID */
  clusterId?: number;
  /** For k8s: namespace */
  namespace?: string;
  /** For k8s: pod name */
  podName?: string;
  /** For k8s: optional container name within pod */
  container?: string;
  /** For docker: server ID */
  serverId?: number;
  /** For docker: container ID */
  containerId?: string;
}

const POLL_INTERVAL = 5000; // 5 秒轮询间隔

const ansiConverter = new AnsiToHtml({
  fg: '#d4d4d4',
  bg: '#1e1e1e',
  newline: true,
  escapeXML: true,
  stream: false,
});

const ServiceLogPanel: React.FC<ServiceLogPanelProps> = (props) => {
  const { type, clusterId, namespace, podName, container, serverId, containerId } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const fsScrollRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [fsRenderedHtml, setFsRenderedHtml] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ANSI → HTML 渲染
  const renderOutput = useCallback((raw: string) => {
    const html = ansiConverter.toHtml(raw);
    if (searchText) {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return html.replace(
        new RegExp(escaped, 'gi'),
        (match) => `<span class="console-highlight">${match}</span>`,
      );
    }
    return html;
  }, [searchText]);

  // 更新输出内容
  const updateOutput = useCallback((raw: string) => {
    setError(null);
    setRenderedHtml(renderOutput(raw));
    // 自动滚动到底部
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, [renderOutput]);

  // 获取日志
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      if (type === 'k8s' && clusterId && podName) {
        const res = await getPodLogs(clusterId, podName, namespace, 100, container);
        if (res?.output) {
          updateOutput(res.output);
        } else {
          setError('暂无日志输出');
        }
      } else if (type === 'docker' && serverId && containerId) {
        const res = await getContainerLogs(serverId, containerId, 100);
        if (res?.output) {
          updateOutput(res.output);
        } else {
          setError('暂无日志输出');
        }
      } else {
        setError('缺少必要参数');
      }
    } catch (err) {
      const msg = (err as any)?.message || '获取日志失败';
      setError(msg);
      updateOutput(`\x1b[31m[获取日志失败: ${msg}]\x1b[0m`);
    } finally {
      setLoading(false);
    }
  }, [type, clusterId, namespace, podName, container, serverId, containerId, updateOutput]);

  // 组件挂载时自动获取一次
  useEffect(() => {
    fetchLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 自动轮询（未暂停时）
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(fetchLogs, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, fetchLogs]);

  // 搜索变化时重新渲染
  useEffect(() => {
    // Re-render only when search text changes (not on every fetch)
  }, [searchText]);

  // 放大视图更新
  const updateFsOutput = useCallback(() => {
    // Use the current rendered html for fullscreen
    setFsRenderedHtml(renderedHtml);
    setTimeout(() => {
      const el = fsScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, [renderedHtml]);

  const manualRefresh = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  const togglePause = useCallback(() => {
    setPaused((prev) => !prev);
  }, []);

  const openFullscreen = useCallback(() => {
    updateFsOutput();
    setFullscreenOpen(true);
  }, [updateFsOutput]);

  const closeFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  // 状态标签
  const statusLabel = paused ? '已暂停' : '自动刷新';
  const statusClass = paused ? 'console-status-paused' : 'console-status-active';

  // 来源标识
  const sourceLabel = type === 'k8s'
    ? `Pod: ${podName}${container ? ` / ${container}` : ''}`
    : `Container: ${containerId}`;

  return (
    <div className="console-panel">
      <div className="console-toolbar">
        <span className={`console-status ${statusClass}`}>{statusLabel}</span>
        <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>{sourceLabel}</span>
        <Button size="small" icon={<ReloadOutlined />} onClick={manualRefresh} loading={loading}>
          刷新
        </Button>
        <Tooltip title={paused ? '恢复自动刷新' : '暂停自动刷新'}>
          <Button
            size="small"
            icon={paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
            onClick={togglePause}
          />
        </Tooltip>
        <Tooltip title="搜索">
          <Button size="small" icon={<SearchOutlined />} onClick={() => setSearchVisible(!searchVisible)} />
        </Tooltip>
        <Tooltip title="放大视图">
          <Button size="small" icon={<ExpandOutlined />} onClick={openFullscreen} />
        </Tooltip>
      </div>

      {searchVisible && (
        <div className="console-search">
          <Input
            size="small"
            placeholder="搜索关键字..."
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      )}

      <div ref={scrollRef} className="console-body">
        <pre dangerouslySetInnerHTML={{ __html: renderedHtml || '<span class="console-empty">暂无日志，点击刷新获取</span>' }} />
      </div>

      {/* 放大视图 */}
      <Modal
        title={`${type === 'k8s' ? 'Pod 日志' : '容器日志'} - ${type === 'k8s' ? podName : containerId}`}
        open={fullscreenOpen}
        onCancel={closeFullscreen}
        footer={[
          searchVisible && (
            <Input key="search" size="small" placeholder="搜索关键字..." allowClear
              value={searchText} onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200, marginRight: 8, verticalAlign: 'middle' }} />
          ),
          <Tooltip key="searchBtn" title={searchVisible ? '关闭搜索' : '搜索'}>
            <Button size="small" icon={<SearchOutlined />} onClick={() => setSearchVisible(!searchVisible)} />
          </Tooltip>,
          <Tooltip key="pauseBtn" title={paused ? '恢复自动刷新' : '暂停自动刷新'}>
            <Button size="small" icon={paused ? <PlayCircleOutlined /> : <PauseCircleOutlined />} onClick={togglePause} />
          </Tooltip>,
          <Button key="refresh" size="small" icon={<ReloadOutlined />} onClick={manualRefresh}>刷新</Button>,
          <Button key="close" size="small" icon={<CompressOutlined />} type="primary" onClick={closeFullscreen}>关闭</Button>,
        ]}
        width="90vw"
        style={{ top: 20 }}
        getContainer={false}
        maskClosable
        keyboard
        transitionName=""
        maskTransitionName=""
        afterOpenChange={(open) => {
          if (open) {
            updateFsOutput();
            return;
          }
          setFsRenderedHtml('');
        }}
        destroyOnHidden
      >
        <div ref={fsScrollRef} className="console-body console-body-fullscreen">
          <pre dangerouslySetInnerHTML={{ __html: fsRenderedHtml || '<span class="console-empty">暂无日志</span>' }} />
        </div>
      </Modal>
    </div>
  );
};

export default ServiceLogPanel;