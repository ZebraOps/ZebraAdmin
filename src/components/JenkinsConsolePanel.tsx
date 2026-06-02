import { useEffect, useRef, useState, useCallback } from 'react';
import { Badge, Button, Space, Switch, Tooltip } from 'antd';
import { ReloadOutlined, ThunderboltOutlined, PauseOutlined } from '@ant-design/icons';
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

export default function JenkinsConsolePanel({ taskId }: JenkinsConsolePanelProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastOutputRef = useRef<string>(''); // 用于 WebSocket 模式只追加增量

  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'error'>('closed');
  const [liveMode, setLiveMode] = useState(false); // 默认手动模式
  const [loading, setLoading] = useState(false);

  const rawBaseURL = (import.meta.env.VITE_BASE_URL || '').trim();
  const wsBaseURL = rawBaseURL.replace(/^http/, 'ws').replace(/\/$/, '');

  // 初始化 xterm
  useEffect(() => {
    if (!termRef.current) return;

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
    term.open(termRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // 手动刷新：通过 REST API 获取一次完整输出
  const manualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      if (xtermRef.current) {
        xtermRef.current.clear();
        xtermRef.current.write(output);
      }
    } catch {
      if (xtermRef.current) {
        xtermRef.current.write('\r\n\x1b[31m[获取控制台输出失败]\x1b[0m\r\n');
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  // WebSocket 连接（实时模式）
  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const token = localStg.get<string>('token') || '';
    const url = `${wsBaseURL}/cicd/api/deploys/${taskId}/console/stream?token=${token}`;

    setWsStatus('connecting');
    lastOutputRef.current = '';
    if (xtermRef.current) xtermRef.current.clear();

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { setWsStatus('connected'); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          // 后端返回错误信息，显示红色提示
          if (xtermRef.current) {
            xtermRef.current.write(`\r\n\x1b[31m[${data.error}]\x1b[0m\r\n`);
          }
        }
        if (data.output) {
          // 只追加增量部分（后端推送的是全量，前端只写差值）
          const prevLen = lastOutputRef.current.length;
          const fullOutput = String(data.output);
          if (fullOutput.length > prevLen && xtermRef.current) {
            const delta = fullOutput.slice(prevLen);
            xtermRef.current.write(delta);
          }
          lastOutputRef.current = fullOutput;
        }
        if (data.finished) {
          ws.close();
        }
      } catch {
        if (xtermRef.current) {
          xtermRef.current.write(event.data);
        }
      }
    };
    ws.onerror = () => { setWsStatus('error'); };
    ws.onclose = () => { setWsStatus('closed'); wsRef.current = null; };
  }, [taskId, wsBaseURL]);

  // 切换实时/手动模式
  const toggleMode = useCallback((live: boolean) => {
    setLiveMode(live);
    if (live) {
      connect();
    } else {
      // 切到手动模式：关闭 WebSocket，立即做一次手动刷新获取最新内容
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

  // 窗口 resize 时 fit
  useEffect(() => {
    const handleResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    </div>
  );
}