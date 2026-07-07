import { useState, useRef, useEffect } from 'react';
import { Input, Select, Card, Tag, Space, Spin, Empty, message, Tooltip, Rate, Drawer, List, Descriptions, Typography } from 'antd';
import { SendOutlined, ClearOutlined, ReloadOutlined, HistoryOutlined, StopOutlined } from '@ant-design/icons';
import { ragQueryStream, submitFeedback, fetchQueryHistory } from '@/service/api/rag/query';
import { fetchCollections } from '@/service/api/rag/collections';
import type { QuerySource, QueryHistory, TokenUsage } from '@/service/api/rag/query';
import dayjs from 'dayjs';
import SourceReference from './components/SourceReference';
import './query.css';

const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QuerySource[];
  queryId?: number;
  model?: string;
  usage?: TokenUsage;
  feedbackRating?: number;
  feedbackSubmitted?: boolean;
  timestamp: Date;
  loading?: boolean;
  streaming?: boolean;
}

/** 智能问答 —— ZEBRA INK 设计 */
export default function RAGQuery() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [collectionIds, setCollectionIds] = useState<number[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [topK, setTopK] = useState(5);
  const [collectionOptions, setCollectionOptions] = useState<{ label: string; value: number }[]>([]);

  // History state
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<QueryHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [selectedHistory, setSelectedHistory] = useState<QueryHistory | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamAbortRef = useRef<(() => void) | null>(null);

  // 加载集合选项
  useEffect(() => {
    fetchCollections({ page: 1, size: 100 }).then(res => {
      if (res) {
        setCollectionOptions(res.records.map(c => ({ label: c.name, value: c.collection_id })));
      }
    });
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 打开历史面板时自动加载
  useEffect(() => {
    if (historyDrawerOpen) {
      loadHistory(1);
    }
  }, [historyDrawerOpen]);

  // 加载查询历史
  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await fetchQueryHistory({ page, size: 15 });
      if (res) {
        setHistoryRecords(res.records);
        setHistoryTotal(res.total);
        setHistoryPage(page);
      }
    } catch {
      message.error('加载历史记录失败');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 发送消息（流式）
  const handleSend = async () => {
    // 如果正在流式输出，停止当前流
    if (streamAbortRef.current) {
      streamAbortRef.current();
      streamAbortRef.current = null;
      setLoading(false);
      return;
    }

    if (!input.trim() || loading) return;

    const question = input.trim();
    setInput('');

    // 添加用户消息
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    const aiMessageId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, userMessage, { id: aiMessageId, role: 'assistant', content: '', timestamp: new Date(), loading: true, streaming: true }]);
    setLoading(true);

    // 启动流式查询
    const stream = ragQueryStream({
      question,
      collection_ids: collectionIds.length > 0 ? collectionIds : undefined,
      doc_types: docTypes.length > 0 ? docTypes : undefined,
      top_k: topK,
    });
    streamAbortRef.current = () => stream.abort();

    try {
      for await (const event of stream) {
        setMessages(prev => prev.map(m => {
          if (m.id !== aiMessageId) return m;

          switch (event.type) {
            case 'retrieval_done':
              return { ...m, sources: event.sources, loading: false };
            case 'token':
              return { ...m, content: m.content + event.content, loading: false };
            case 'done':
              return { ...m, queryId: event.query_id, model: event.model, usage: event.usage, streaming: false, loading: false };
            case 'error':
              return { ...m, content: m.content || event.message, streaming: false, loading: false };
            default:
              return m;
          }
        }));
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === aiMessageId
          ? { ...m, content: m.content || '查询失败，请稍后重试', streaming: false, loading: false }
          : m
      ));
    } finally {
      setLoading(false);
      streamAbortRef.current = null;
      inputRef.current?.focus();
    }
  };

  // 清空对话
  const handleClear = () => {
    setMessages([]);
    message.success('对话已清空');
  };

  // 重新发送最后一个问题
  const handleRetry = async () => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      setInput(lastUserMessage.content);
      setMessages(prev => prev.slice(0, -1));
    }
  };

  // 快捷问题
  const quickQuestions = [
    'Kubernetes Pod 启动失败如何排查？',
    'MySQL 主从同步延迟怎么处理？',
    'Redis 内存占用过高怎么优化？',
    'Jenkins 构建失败常见原因有哪些？',
  ];

  return (
    <>
    <div className="zb-query-shell">
      {/* ── 配置工具栏 ──────────────────── */}
      <div className="zb-query-toolbar">
        <span className="toolbar-label">知识集合</span>
        <Select
          mode="multiple"
          placeholder="全部"
          options={collectionOptions}
          value={collectionIds}
          onChange={setCollectionIds}
          style={{ minWidth: 200 }}
          allowClear
          maxTagCount={1}
          size="small"
        />

        <span className="toolbar-label">文档类型</span>
        <Select
          mode="multiple"
          placeholder="全部"
          options={[
            { label: '故障案例', value: 'incident' },
            { label: '标准流程', value: 'sop' },
            { label: '操作指南', value: 'guide' },
            { label: '最佳实践', value: 'best_practice' },
          ]}
          value={docTypes}
          onChange={setDocTypes}
          style={{ minWidth: 160 }}
          allowClear
          maxTagCount={1}
          size="small"
        />

        <span className="toolbar-label">返回数量</span>
        <Select
          value={topK}
          onChange={setTopK}
          options={[{ label: 'Top 3', value: 3 }, { label: 'Top 5', value: 5 }, { label: 'Top 10', value: 10 }]}
          style={{ width: 90, marginBottom: 15 }}
          size="small"
        />

        <span className="toolbar-spacer" />

        <button
          className="zb-retry-btn"
          onClick={() => setHistoryDrawerOpen(true)}
          aria-label="查询历史"
          title="查询历史"
          style={{ width: 30, height: 30, marginBottom: 0, fontSize: 14 }}
        >
          <HistoryOutlined />
        </button>

        <button
          className="zb-retry-btn"
          onClick={handleClear}
          disabled={messages.length === 0}
          aria-label="清空对话"
          title="清空对话"
          style={{ width: 30, height: 30, marginBottom: 0, fontSize: 14, opacity: messages.length === 0 ? 0.35 : 1 }}
        >
          <ClearOutlined />
        </button>
      </div>

      {/* ── 聊天面板 ────────────────────── */}
      <div className="zb-chat-panel">
        <div className="zb-chat-scroll">
          {messages.length === 0 ? (
            /* ── 空状态 ── */
            <div className="zb-chat-empty">
              <div className="zb-welcome-icon">ZB</div>
              <h2 className="zb-welcome-heading">知识问答</h2>
              <p className="zb-welcome-sub">
                向知识库提问，获取精准回答与来源追溯。
                支持故障案例、标准流程、操作指南等文档类型。
              </p>
              <div className="zb-quick-label">快速开始</div>
              <div className="zb-quick-chips">
                {quickQuestions.map(q => (
                  <span
                    key={q}
                    className="zb-quick-chip"
                    onClick={() => setInput(q)}
                  >
                    <span className="zb-chip-prompt">$</span>
                    {q}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* ── 消息列表 ── */
            <div>
              {messages.map(msg => (
                <div key={msg.id} className={`zb-msg-row ${msg.role}`}>
                  {/* 头像 */}
                  <div className={`zb-msg-avatar ${msg.role === 'user' ? 'user-avatar' : 'assistant-avatar'}`}>
                    {msg.role === 'user' ? 'U' : 'ZB'}
                  </div>

                  {/* 消息气泡 */}
                  <div
                    className={`zb-msg-bubble ${msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}${msg.streaming ? ' streaming' : ''}`}
                  >
                    {msg.loading ? (
                      <div className="zb-loading-dots">
                        <span /><span /><span />
                      </div>
                    ) : (
                      <>
                        <div className="zb-msg-content">
                          {msg.content}
                          {msg.streaming && <span className="zb-stream-cursor" />}
                        </div>

                        {/* 知识来源引用 */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="zb-sources-section">
                            <div className="zb-sources-header">
                              知识来源 · {msg.sources.length} 条
                            </div>
                            <div className="zb-sources-list">
                              {msg.sources.map((source, idx) => (
                                <SourceReference key={`${source.doc_id}-${source.chunk_index}`} source={source} index={idx} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 模型 & Token 用量 */}
                        {msg.role === 'assistant' && !msg.streaming && (msg.model || msg.usage) && (
                          <div className="zb-msg-meta">
                            {msg.model && (
                              <span>模型 <span className="meta-model">{msg.model}</span></span>
                            )}
                            {msg.usage && (
                              <span>
                                Tokens {msg.usage.prompt_tokens}+{msg.usage.completion_tokens}={msg.usage.total_tokens}
                              </span>
                            )}
                          </div>
                        )}

                        {/* 反馈评分 */}
                        {msg.role === 'assistant' && msg.queryId && (
                          <div className="zb-feedback-row">
                            <span className="feedback-label">评分</span>
                            <Rate
                              count={5}
                              value={msg.feedbackRating || 0}
                              disabled={msg.feedbackSubmitted}
                              onChange={async (value) => {
                                try {
                                  await submitFeedback(msg.queryId!, { rating: value });
                                  setMessages(prev => prev.map(m =>
                                    m.id === msg.id ? { ...m, feedbackRating: value, feedbackSubmitted: true } : m
                                  ));
                                  message.success('感谢您的反馈！');
                                } catch {
                                  message.error('反馈提交失败');
                                }
                              }}
                              style={{ fontSize: 14, color: '#14b8a6' }}
                            />
                            {msg.feedbackSubmitted && (
                              <span style={{ fontSize: 10, color: 'var(--zb-text-3)', fontFamily: 'JetBrains Mono, monospace' }}>已评价</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── 输入区域 ── */}
        <div className="zb-input-area">
          <div className="zb-input-row">
            <TextArea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="输入问题，如：如何处理 MySQL 主从同步延迟？"
              autoSize={{ minRows: 2, maxRows: 6 }}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ flex: 1 }}
              disabled={loading}
            />
            <button
              className={`zb-send-btn${loading && streamAbortRef.current ? ' stop' : ''}`}
              onClick={handleSend}
              aria-label={loading && streamAbortRef.current ? '停止' : '发送'}
            >
              {loading && streamAbortRef.current ? <StopOutlined /> : <SendOutlined />}
            </button>
            {messages.length > 0 && !loading && (
              <Tooltip title="重新发送">
                <button className="zb-retry-btn" onClick={handleRetry} aria-label="重新发送">
                  <ReloadOutlined style={{ fontSize: 13 }} />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="zb-input-hint">
            Enter 发送 · Shift+Enter 换行
          </div>
        </div>
      </div>
    </div>

    {/* ── 查询历史面板 ── */}
    <Drawer
      title="查询历史"
      placement="right"
      width={480}
      open={historyDrawerOpen}
      onClose={() => { setHistoryDrawerOpen(false); setSelectedHistory(null); }}
      extra={
        !selectedHistory && (
          <button
            className="zb-retry-btn"
            style={{ width: 30, height: 30, marginBottom: 0, fontSize: 14 }}
            onClick={() => loadHistory(historyPage)}
            aria-label="刷新"
          >
            <ReloadOutlined spin={historyLoading} />
          </button>
        )
      }
    >
      {selectedHistory ? (
        // 单条历史详情
        <div>
          <button
            className="zb-retry-btn zb-history-detail-back"
            onClick={() => setSelectedHistory(null)}
            style={{ width: 'auto', marginBottom: 16, fontSize: 12, padding: '4px 10px' }}
          >
            ← 返回列表
          </button>
          <Card size="small" title="问题" style={{ marginBottom: 12 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{selectedHistory.query_text}</div>
          </Card>
          <Card size="small" title="回答" style={{ marginBottom: 12 }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{selectedHistory.answer_text || '(无回答)'}</div>
          </Card>
          {selectedHistory.source_docs && selectedHistory.source_docs.length > 0 && (
            <Card size="small" title="参考文档" style={{ marginBottom: 12 }}>
              <Space wrap>
                {selectedHistory.source_docs.map(docId => (
                  <Tag key={docId} color="#14b8a6">Doc #{docId}</Tag>
                ))}
              </Space>
            </Card>
          )}
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="评分">
              {selectedHistory.rating ? (
                <Rate count={5} value={selectedHistory.rating} disabled style={{ fontSize: 14 }} />
              ) : '未评分'}
            </Descriptions.Item>
            {selectedHistory.feedback && (
              <Descriptions.Item label="反馈">{selectedHistory.feedback}</Descriptions.Item>
            )}
            <Descriptions.Item label="时间">
              {dayjs(selectedHistory.ctime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ) : (
        // 历史列表
        <Spin spinning={historyLoading}>
          {historyRecords.length === 0 && !historyLoading ? (
            <Empty description="暂无查询历史" />
          ) : (
            <List
              dataSource={historyRecords}
              pagination={{
                current: historyPage,
                total: historyTotal,
                pageSize: 15,
                onChange: (page) => loadHistory(page),
                size: 'small',
              }}
              renderItem={(item) => (
                <div
                  className="zb-history-item"
                  onClick={() => setSelectedHistory(item)}
                >
                  <List.Item style={{ border: 'none', padding: 0 }}>
                    <List.Item.Meta
                      title={
                        <Typography.Text ellipsis style={{ maxWidth: 360 }}>
                          {item.query_text}
                        </Typography.Text>
                      }
                      description={
                        <Space size="small">
                          <span style={{ fontSize: 11, color: 'var(--zb-text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                            {dayjs(item.ctime).format('MM-DD HH:mm')}
                          </span>
                          {item.rating && (
                            <Rate count={5} value={item.rating} disabled style={{ fontSize: 12 }} />
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                </div>
              )}
            />
          )}
        </Spin>
      )}
    </Drawer>
    </>
  );
}
