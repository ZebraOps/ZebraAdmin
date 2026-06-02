import { useEffect, useRef, useState, useCallback } from 'react';
import { Button, Input, Modal, Tooltip } from 'antd';
import { ReloadOutlined, ExpandOutlined, CompressOutlined, SearchOutlined } from '@ant-design/icons';
import AnsiToHtml from 'ansi-to-html';
import * as deployApi from '@/service/api/publish/deploy-task';
import './JenkinsConsolePanel.css';

interface JenkinsConsolePanelProps {
  taskId: number;
}

interface ConsoleError {
  message?: string;
  detail?: string;
}

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILED']);

const POLL_INTERVAL = 3000; // 3 秒轮询间隔

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
  const outputCacheRef = useRef<string>('');

  const [taskStatus, setTaskStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [fsRenderedHtml, setFsRenderedHtml] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);

  // 是否正在自动轮询（任务处于活跃状态）
  const polling = taskStatus !== '' && !TERMINAL_STATUSES.has(taskStatus.toUpperCase());

  const mapConsoleErrorToHint = useCallback((error: unknown) => {
    const e = error as ConsoleError | undefined;
    const msg = e?.message || e?.detail || '';
    if (/no Jenkins build info|构建信息|build info/i.test(msg)) {
      return '\x1b[33m[Jenkins 构建尚未开始，请稍后刷新]\x1b[0m';
    }
    if (/task .* not found|not found|任务不存在/i.test(msg)) {
      return '\x1b[33m[任务不存在或已被删除]\x1b[0m';
    }
    return '\x1b[31m[获取控制台输出失败]\x1b[0m';
  }, []);

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

  // 获取控制台输出（同时更新 taskStatus）
  const fetchConsole = useCallback(async () => {
    setLoading(true);
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      const status = res?.status ?? '';
      if (res?.error && !output) {
        // 后端返回了错误信息但没有输出（如 Jenkins 构建尚未开始）
        updateOutput(mapConsoleErrorToHint({ message: res.error }), false);
      } else {
        updateOutput(output);
      }
      setTaskStatus(status.toUpperCase());
      if (fullscreenOpen) updateFsOutput();
    } catch (error) {
      updateOutput(mapConsoleErrorToHint(error), false);
    } finally {
      setLoading(false);
    }
  }, [taskId, updateOutput, fullscreenOpen, updateFsOutput, mapConsoleErrorToHint]);

  // 组件挂载时自动获取一次
  useEffect(() => {
    fetchConsole();
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 活跃状态时自动轮询
  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(fetchConsole, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [polling, fetchConsole]);

  // 手动刷新（给用户显式控制）
  const manualRefresh = useCallback(() => {
    fetchConsole();
  }, [fetchConsole]);

  // 放大视图刷新
  const fsRefresh = useCallback(async () => {
    try {
      const res = await deployApi.getTaskConsole(taskId);
      const output = res?.output ?? '';
      const status = res?.status ?? '';
      outputCacheRef.current = output;
      setRenderedHtml(renderOutput(output));
      setFsRenderedHtml(renderOutput(output));
      setTaskStatus(status.toUpperCase());
    } catch (error) {
      setFsRenderedHtml(renderOutput(mapConsoleErrorToHint(error)));
    }
  }, [taskId, renderOutput, mapConsoleErrorToHint]);

  const openFullscreen = useCallback(() => {
    updateFsOutput();
    setFullscreenOpen(true);
  }, [updateFsOutput]);

  const closeFullscreen = useCallback(() => {
    setFullscreenOpen(false);
  }, []);

  // 状态指示标签
  const statusLabel = polling
    ? '自动刷新'
    : taskStatus === 'SUCCESS'
      ? '构建成功'
      : taskStatus === 'FAILED'
        ? '构建失败'
        : taskStatus
          ? '已完成'
          : '手动';

  const statusClass = polling ? 'console-status-active' : 'console-status-default';

  return (
    <div className="console-panel">
      <div className="console-toolbar">
        <span className={`console-status ${statusClass}`}>{statusLabel}</span>
        <Button size="small" icon={<ReloadOutlined />} onClick={manualRefresh} loading={loading}>刷新</Button>
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
        <pre dangerouslySetInnerHTML={{ __html: renderedHtml || '<span class="console-empty">暂无输出，点击刷新获取</span>' }} />
      </div>

      {/* 放大视图 */}
      <Modal
        title="Jenkins 控制台输出"
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
          <Button key="refresh" size="small" icon={<ReloadOutlined />} onClick={fsRefresh}>刷新</Button>,
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
          <pre dangerouslySetInnerHTML={{ __html: fsRenderedHtml || '<span class="console-empty">暂无输出</span>' }} />
        </div>
      </Modal>
    </div>
  );
}