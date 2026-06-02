import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Input, Modal, Space, Switch, Tooltip } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, PauseOutlined, ExpandOutlined, CompressOutlined, SearchOutlined } from '@ant-design/icons';
import AnsiToHtml from 'ansi-to-html';
import { localStg } from '@/utils/storage';
import * as deployApi from '@/service/api/publish/deploy-task';
import './JenkinsConsolePanel.css';

interface JenkinsConsolePanelProps {
  taskId: number;
}

const ansiConverter = new AnsiToHtml({
  fg: '#d4d4d4',
  bg: '#1e1e1e',
  newline: true,
  escapeXML: true,
  stream: false,
});

export default function JenkinsConsolePanel({ taskId }: JenkinsConsolePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fsScrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastOutputRef = useRef<string>('');
  const outputCacheRef = useRef<string>('');

  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'error'>('closed');
  const [liveMode, setLiveMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [fsRenderedHtml, setFsRenderedHtml] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  const rawBaseURL = (import.meta.env.VITE_BASE_URL || '').trim();
  const wsBaseURL = rawBaseURL.replace(/^http/, 'ws').replace(/\/$/, '');

  // ANSI → HTML 渲染
  const renderOutput = useCallback((raw: string) => {
    const html = ansiConverter.toHtml(raw);
    // 搜索高亮
    if (searchText) {
      const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const highlighted = html.replace(
        new RegExp(escaped, 'gi'),
        (match) => `<span class="console-highlight">${match}</span>`
      );
      return highlighted;
    }
    return html;
  }, [searchText]);

  // 更新输出内容
  const updateOutput = useCallback((raw: string, cache = true) => {
    if (cache) outputCacheRef.current = raw;
    setRenderedHtml(renderOutput(raw));
    // 自动滚动到底部
    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, [renderOutput]);

  // 更新放大视图
  const updateFsOutput = useCallback(() => {
    setFsRenderedHtml(renderOutput(outputCacheRef.current));
    setTimeout(() => {
      const el = fsScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }, [renderOutput]);

  // 搜索变化时重新渲染
  useEffect(() => {
    setRenderedHtml(renderOutput(outputCacheRef.current));
    if (fullscreenOpen) setFsRenderedHtml(renderOutput(outputCacheRef.current));
  }, [searchText, renderOutput, fullscreenOpen]);

  // 手动刷新
  const manualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      updateOutput(output);
      if (fullscreenOpen) updateFsOutput();
    } catch {
      updateOutput('\x1b[31m[获取控制台输出失败]\x1b[0m', false);
    } finally {
      setLoading(false);
    }
  }, [taskId, updateOutput, fullscreenOpen, updateFsOutput]);

  // 组件挂载时自动获取一次
  useEffect(() => {
    manualRefresh();
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket 连接（实时模式）
  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const token = localStg.get<string>('token') || '';
    const url = `${wsBaseURL}/cicd/api/deploys/${taskId}/console/stream?token=${token}`;

    setWsStatus('connecting');
    lastOutputRef.current = '';
    outputCacheRef.current = '';
    updateOutput('', false);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { setWsStatus('connected'); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          const errAnsi = `\x1b[31m[${data.error}]\x1b[0m\n`;
          outputCacheRef.current += errAnsi;
          updateOutput(outputCacheRef.current);
        }
        if (data.output) {
          const fullOutput = String(data.output);
          outputCacheRef.current = fullOutput;
          updateOutput(fullOutput);
        }
        if (data.finished) {
          ws.close();
        }
      } catch {
        outputCacheRef.current += event.data;
        updateOutput(outputCacheRef.current);
      }
    };
    ws.onerror = () => { setWsStatus('error'); };
    ws.onclose = () => { setWsStatus('closed'); wsRef.current = null; };
  }, [taskId, wsBaseURL, updateOutput]);

  // 切换模式
  const toggleMode = useCallback((live: boolean) => {
    setLiveMode(live);
    if (live) {
      connect();
    } else {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      setWsStatus('closed');
      manualRefresh();
    }
  }, [connect, manualRefresh]);

  // 实时模式自动连接
  useEffect(() => {
    if (liveMode) connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [liveMode, connect]);

  // 放大视图刷新
  const fsRefresh = useCallback(async () => {
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      outputCacheRef.current = output;
      setRenderedHtml(renderOutput(output));
      setFsRenderedHtml(renderOutput(output));
    } catch {
      setFsRenderedHtml(renderOutput('\x1b[31m[获取控制台输出失败]\x1b[0m'));
    }
  }, [taskId, renderOutput]);

  const statusLabel = liveMode
    ? { connecting: '连接中', connected: '实时', closed: '已断开', error: '连接错误' }[wsStatus]
    : '手动';

  const statusColor = liveMode
    ? { connecting: 'processing', connected: 'processing', closed: 'default', error: 'error' }[wsStatus]
    : 'default';

  return (
    <div className="console-panel">
      <div className="console-toolbar">
        <span className={`console-status console-status-${statusColor}`}>{statusLabel}</span>
        <Tooltip title={liveMode ? '切换为手动刷新' : '切换为实时推送'}>
          <Switch
            size="small"
            checked={liveMode}
            onChange={toggleMode}
            checkedChildren={<ThunderboltOutlined />}
            unCheckedChildren={<PauseOutlined />}
          />
        </Tooltip>
        {!liveMode && (
          <Button size="small" icon={<ReloadOutlined />} onClick={manualRefresh} loading={loading}>刷新</Button>
        )}
        {liveMode && wsStatus === 'closed' && (
          <Button size="small" icon={<ReloadOutlined />} onClick={connect} disabled={wsStatus === 'connecting'}>重连</Button>
        )}
        <Tooltip title="搜索">
          <Button size="small" icon={<SearchOutlined />} onClick={() => setSearchVisible(!searchVisible)} />
        </Tooltip>
        <Tooltip title="放大视图">
          <Button size="small" icon={<ExpandOutlined />} onClick={() => setFullscreenOpen(true)} />
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
        <pre dangerouslySetInnerHTML={{ __html: renderedHtml || '<span class="console-empty">暂无输出，点击刷新获取</span>' }} />
      </div>

      {/* 放大视图 */}
      <Modal
        title="Jenkins 控制台输出"
        open={fullscreenOpen}
        onCancel={() => setFullscreenOpen(false)}
        footer={[
          <Input key="search" size="small" placeholder="搜索..." prefix={<SearchOutlined />} allowClear
            value={searchText} onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200, marginRight: 8 }} />,
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fsRefresh}>刷新</Button>,
          <Button key="close" icon={<CompressOutlined />} type="primary" onClick={() => setFullscreenOpen(false)}>关闭</Button>,
        ]}
        width="90vw"
        style={{ top: 20 }}
        destroyOnHidden
      >
        <div ref={fsScrollRef} className="console-body console-body-fullscreen">
          <pre dangerouslySetInnerHTML={{ __html: fsRenderedHtml || '<span class="console-empty">暂无输出</span>' }} />
        </div>
      </Modal>
    </div>
  );
}