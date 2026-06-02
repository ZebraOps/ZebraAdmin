import { useEffect, useRef, useState, useCallback } from 'react';
import { Badge, Button, Modal, Space, Switch, Tooltip } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, PauseOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { localStg } from '@/utils/storage';
import * as deployApi from '@/service/api/publish/deploy-task';
import '@xterm/xterm/css/xterm.css';

interface JenkinsConsolePanelProps {
  taskId: number;
}

const STATUS_MAP: Record<string, { status: 'default' | 'processing' | 'success' | 'error'; label: string }> = {
  connecting: { status: 'processing', label: '连接中' },
  connected:  { status: 'processing', label: '实时' },
  closed:     { status: 'default',    label: '已断开' },
  error:      { status: 'error',      label: '连接错误' },
};

/** 创建 xterm Terminal 实例的通用函数 */
function createTerminal(): { term: Terminal; fitAddon: FitAddon } {
  const term = new Terminal({
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
    },
    fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
    fontSize: 13,
    lineHeight: 1.2,
    scrollback: 5000,
    cursorBlink: false,
    disableStdin: true,
  });
  const fitAddon = new FitAddon();
  const webLinksAddon = new WebLinksAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(webLinksAddon);
  return { term, fitAddon };
}

export default function JenkinsConsolePanel({ taskId }: JenkinsConsolePanelProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastOutputRef = useRef<string>(''); // 用于 WebSocket 模式只追加增量
  const outputCacheRef = useRef<string>(''); // 缓存已获取的输出，用于放大视图同步

  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'error'>('closed');
  const [liveMode, setLiveMode] = useState(false); // 默认手动模式
  const [loading, setLoading] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  // 放大视图的 refs
  const fsTermRef = useRef<HTMLDivElement>(null);
  const fsXtermRef = useRef<Terminal | null>(null);
  const fsFitAddonRef = useRef<FitAddon | null>(null);

  const rawBaseURL = (import.meta.env.VITE_BASE_URL || '').trim();
  const wsBaseURL = rawBaseURL.replace(/^http/, 'ws').replace(/\/$/, '');

  // 初始化内嵌 xterm
  useEffect(() => {
    if (!termRef.current) return;

    const { term, fitAddon } = createTerminal();
    term.open(termRef.current);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // 初始化放大视图 xterm（Modal 打开时创建）
  useEffect(() => {
    if (!fullscreenOpen || !fsTermRef.current) return;

    const { term, fitAddon } = createTerminal();
    // 放大视图用更大字号
    term.options.fontSize = 14;
    term.open(fsTermRef.current);
    fsXtermRef.current = term;
    fsFitAddonRef.current = fitAddon;
    setTimeout(() => fitAddon.fit(), 100);

    // 写入缓存内容
    if (outputCacheRef.current) {
      term.write(outputCacheRef.current);
    }

    return () => {
      term.dispose();
      fsXtermRef.current = null;
    };
  }, [fullscreenOpen]);

  // 手动刷新：通过 REST API 获取一次完整输出
  const manualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      outputCacheRef.current = output;
      if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.write(output);
      }
      // 同步放大视图（如果正在显示）
      if (fsXtermRef.current && fullscreenOpen) {
        fsXtermRef.current.clear();
        fsXtermRef.current.write(output);
      }
    } catch {
      if (xtermRef.current) {
        xtermRef.current.write('\r\n\x1b[31m[获取控制台输出失败]\x1b[0m\r\n');
      }
    } finally {
      setLoading(false);
    }
  }, [taskId, fullscreenOpen]);

  // 组件挂载时自动获取一次控制台输出（无论实时还是手动模式）
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
    if (xtermRef.current) xtermRef.current.clear();
    outputCacheRef.current = '';

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { setWsStatus('connected'); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          const errText = `\r\n\x1b[31m[${data.error}]\x1b[0m\r\n`;
          if (xtermRef.current) xtermRef.current.write(errText);
          if (fsXtermRef.current && fullscreenOpen) fsXtermRef.current.write(errText);
        }
        if (data.output) {
          const prevLen = lastOutputRef.current.length;
          const fullOutput = String(data.output);
          if (fullOutput.length > prevLen) {
            const delta = fullOutput.slice(prevLen);
            if (xtermRef.current) xtermRef.current.write(delta);
            if (fsXtermRef.current && fullscreenOpen) fsXtermRef.current.write(delta);
          }
          lastOutputRef.current = fullOutput;
          outputCacheRef.current = fullOutput;
        }
        if (data.finished) {
          ws.close();
        }
      } catch {
        if (xtermRef.current) xtermRef.current.write(event.data);
        if (fsXtermRef.current && fullscreenOpen) fsXtermRef.current.write(event.data);
      }
    };
    ws.onerror = () => { setWsStatus('error'); };
    ws.onclose = () => { setWsStatus('closed'); wsRef.current = null; };
  }, [taskId, wsBaseURL, fullscreenOpen]);

  // 切换实时/手动模式
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

  // 窗口 resize 时 fit 两个 xterm
  useEffect(() => {
    const handleResize = () => {
      fitAddonRef.current?.fit();
      fsFitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 放大视图刷新按钮
  const fsRefresh = useCallback(async () => {
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      outputCacheRef.current = output;
      if (fsXtermRef.current) {
        fsXtermRef.current.clear();
        fsXtermRef.current.write(output);
      }
      // 同步内嵌视图
      if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.write(output);
      }
    } catch {
      if (fsXtermRef.current) {
        fsXtermRef.current.write('\r\n\x1b[31m[获取控制台输出失败]\x1b[0m\r\n');
      }
    }
  }, [taskId]);

  const badgeInfo = liveMode
    ? STATUS_MAP[wsStatus]
    : { status: 'default' as const, label: '手动' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Space>
        <Badge status={badgeInfo.status} text={badgeInfo.label} />
        <Tooltip title={liveMode ? '切换为手动刷新' : '切换为实时推送'}>
          <Switch
            checked={liveMode}
            onChange={toggleMode}
            checkedChildren={<ThunderboltOutlined />}
            unCheckedChildren={<PauseOutlined />}
          />
        </Tooltip>
        {!liveMode && (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={manualRefresh}
            loading={loading}
          >
            刷新
          </Button>
        )}
        {liveMode && wsStatus === 'closed' && (
          <Button size="small" icon={<ReloadOutlined />} onClick={connect} disabled={wsStatus === 'connecting'}>
            重连
          </Button>
        )}
        <Tooltip title="放大视图">
          <Button size="small" icon={<ExpandOutlined />} onClick={() => setFullscreenOpen(true)} />
        </Tooltip>
      </Space>
      <div
        ref={termRef}
        style={{
          width: '100%',
          height: 400,
          backgroundColor: '#1e1e1e',
          borderRadius: 4,
          padding: 4,
        }}
      />

      {/* 放大视图 Modal */}
      <Modal
        title="Jenkins 控制台输出"
        open={fullscreenOpen}
        onCancel={() => setFullscreenOpen(false)}
        footer={[
          <Button key="refresh" icon={<ReloadOutlined />} onClick={fsRefresh}>刷新</Button>,
          <Button key="close" icon={<CompressOutlined />} type="primary" onClick={() => setFullscreenOpen(false)}>关闭放大</Button>,
        ]}
        width="90vw"
        style={{ top: 20 }}
        destroyOnClose
      >
        <div
          ref={fsTermRef}
          style={{
            width: '100%',
            height: 'calc(90vh - 120px)',
            backgroundColor: '#1e1e1e',
            borderRadius: 4,
            padding: 4,
          }}
        />
      </Modal>
    </div>
  );
}