import { useEffect, useRef, useState, useCallback } from 'react';
import { Badge, Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { localStg } from '@/utils/storage';
import '@xterm/xterm/css/xterm.css';

interface JenkinsConsolePanelProps {
  taskId: number;
  /** 是否自动连接 */
  autoConnect?: boolean;
}

const STATUS_MAP: Record<string, { status: 'default' | 'processing' | 'success' | 'error'; label: string }> = {
  connecting: { status: 'processing', label: '连接中' },
  connected:  { status: 'processing', label: '已连接' },
  closed:     { status: 'default',    label: '已断开' },
  error:      { status: 'error',      label: '连接错误' },
};

export default function JenkinsConsolePanel({ taskId, autoConnect = true }: JenkinsConsolePanelProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'error'>('closed');

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
      disableStdin: true, // Jenkins console is read-only
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(termRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Delay fit to ensure DOM is ready
    setTimeout(() => fitAddon.fit(), 100);

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // WebSocket 连接
  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const token = localStg.get<string>('token') || '';
    const url = `${wsBaseURL}/cicd/api/deploys/${taskId}/console/stream?token=${token}`;

    setWsStatus('connecting');
    // Clear terminal on reconnect
    if (xtermRef.current) xtermRef.current.clear();

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => { setWsStatus('connected'); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.output) {
          if (xtermRef.current) {
            xtermRef.current.write(data.output);
          }
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

  // 自动连接
  useEffect(() => {
    if (autoConnect) connect();
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [autoConnect, connect]);

  // 窗口 resize 时 fit
  useEffect(() => {
    const handleResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const badgeInfo = STATUS_MAP[wsStatus];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Space>
        <Badge status={badgeInfo.status} text={badgeInfo.label} />
        <Button size="small" icon={<ReloadOutlined />} onClick={connect} disabled={wsStatus === 'connecting'}>
          重连
        </Button>
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