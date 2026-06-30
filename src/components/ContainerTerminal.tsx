import { useEffect, useRef, useState, useCallback } from 'react';
import { Badge, Button, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { localStg } from '@/utils/storage';
import '@xterm/xterm/css/xterm.css';

interface ContainerTerminalProps {
  serverId: number;
  containerId: string;
  /** 是否自动连接 */
  autoConnect?: boolean;
  /** 连接成功后回调 */
  onConnect?: () => void;
  /** 终端关闭时回调，传入本次会话中收集到的命令列表 */
  onClose?: (commands: string[]) => void;
}

const STATUS_MAP: Record<string, { status: 'default' | 'processing' | 'success' | 'error'; label: string }> = {
  connecting: { status: 'processing', label: '连接中' },
  connected:  { status: 'success',    label: '已连接' },
  closed:     { status: 'default',    label: '已断开' },
  error:      { status: 'error',      label: '连接错误' },
};

export default function ContainerTerminal({ serverId, containerId, autoConnect = true, onConnect, onClose }: ContainerTerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const connIdRef = useRef(0);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'closed' | 'error'>('closed');

  const rawBaseURL = (import.meta.env.VITE_BASE_URL || '').trim();
  const wsBaseURL = rawBaseURL.replace(/^http/, 'ws').replace(/\/$/, '');

  // 初始化 xterm（交互式终端）
  useEffect(() => {
    if (!termRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#14b8a6', // teal accent per DESIGN.md
        cursorAccent: '#1e1e1e',
      },
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      scrollback: 3000,
      cursorBlink: true,
      disableStdin: false, // Interactive terminal - stdin enabled
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

  // WebSocket 连接容器终端
  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }

    const connId = ++connIdRef.current;
    const token = localStg.get<string>('token') || '';
    const url = `${wsBaseURL}/cicd/api/servers/${serverId}/containers/${containerId}/attach?token=${token}`;

    setWsStatus('connecting');
    if (xtermRef.current) xtermRef.current.clear();

    // 收集终端中输入的命令，过滤 ANSI/CSI 控制序列
    const commands: string[] = [];
    let cmdBuf = '';
    let escaping = false;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (connIdRef.current !== connId) return;
      setWsStatus('connected');
      message.success('容器终端已连接');
      onConnect?.();
    };

    ws.onmessage = (event) => {
      if (xtermRef.current) {
        if (typeof event.data === 'string') {
          xtermRef.current.write(event.data);
        }
      }
    };

    // 键盘输入 → WebSocket → 容器 stdin，同时收集命令
    const handleInput = xtermRef.current?.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        for (const ch of data) {
          if (ch === '\x1b') {
            escaping = true; // 进入 ANSI 转义序列
            continue;
          }
          if (escaping) {
            if (/[A-Za-z]/.test(ch)) escaping = false; // 转义序列终止
            continue;
          }
          if (ch === '\r') {
            const cmd = cmdBuf.trim();
            if (cmd) commands.push(cmd);
            cmdBuf = '';
          } else if (ch !== '\n') {
            cmdBuf += ch;
          }
        }
      }
    });

    ws.onerror = () => {
      if (connIdRef.current !== connId) return;
      setWsStatus('error');
      message.error('容器终端连接失败');
    };

    ws.onclose = () => {
      if (connIdRef.current !== connId) return;
      setWsStatus('closed');
      wsRef.current = null;
      handleInput?.dispose();
      onClose?.(commands);
    };
  }, [serverId, containerId, wsBaseURL, onConnect, onClose]);

  // 自动连接
  useEffect(() => {
    if (autoConnect) connect();
    return () => {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) ws.close();
    };
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
          height: 500,
          backgroundColor: '#1e1e1e',
          borderRadius: 4,
          padding: 4,
        }}
      />
    </div>
  );
}