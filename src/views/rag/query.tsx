import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Select, Space, Tag, Divider, Spin, Empty, message, Tooltip, Rate, Drawer, List, Descriptions, Typography } from 'antd';
import { SendOutlined, ClearOutlined, FileTextOutlined, ReloadOutlined, HistoryOutlined, StopOutlined } from '@ant-design/icons';
import { ragQueryStream, submitFeedback, fetchQueryHistory } from '@/service/api/rag/query';
import { fetchCollections } from '@/service/api/rag/collections';
import type { QuerySource, QueryHistory, TokenUsage } from '@/service/api/rag/query';
import dayjs from 'dayjs';
import SourceReference from './components/SourceReference';

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

/** 智能问答页面 */
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
    // 如果正在流式输出，停止当前流（允许空输入）
    if (streamAbortRef.current) {
      streamAbortRef.current();
      streamAbortRef.current = null;
      setLoading(false);
      return;
    }

    // 正常发送需要非空输入
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

    // 添加加载中的 AI 消息（空占位）
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
      setMessages(prev => prev.slice(0, -1)); // 移除最后一条 AI 消息
    }
  };

  // 快捷问题模板
  const quickQuestions = [
    'Kubernetes Pod 启动失败如何排查？',
    'MySQL 主从同步延迟怎么处理？',
    'Redis 内存占用过高怎么优化？',
    'Jenkins 构建失败常见原因有哪些？',
  ];

  return (
    <>
    <div className="rag-query-container" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 顶部配置区域 */}
      <Card size="small" style={{ flexShrink: 0 }}>
        <Space wrap size="middle">
          <span style={{ fontWeight: 500, color: 'var(--zb-text-2)' }}>问答范围：</span>

          <Select
            mode="multiple"
            placeholder="选择知识集合（默认全部）"
            options={collectionOptions}
            value={collectionIds}
            onChange={setCollectionIds}
            style={{ minWidth: 220 }}
            allowClear
            maxTagCount={2}
          />

          <Select
            mode="multiple"
            placeholder="文档类型（默认全部）"
            options={[
              { label: '故障案例', value: 'incident' },
              { label: '标准流程', value: 'sop' },
              { label: '操作指南', value: 'guide' },
              { label: '最佳实践', value: 'best_practice' },
            ]}
            value={docTypes}
            onChange={setDocTypes}
            style={{ minWidth: 180 }}
            allowClear
            maxTagCount={2}
          />

          <Tooltip title="返回数量">
            <Select
              value={topK}
              onChange={setTopK}
              options={[{ label: 'Top 3', value: 3 }, { label: 'Top 5', value: 5 }, { label: 'Top 10', value: 10 }]}
              style={{ width: 100 }}
            />
          </Tooltip>

          <Button icon={<HistoryOutlined />} onClick={() => setHistoryDrawerOpen(true)}>
            历史记录
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear} disabled={messages.length === 0}>
            清空对话
          </Button>
        </Space>
      </Card>

      {/* 聊天消息区域 */}
      <Card
        className="rag-chat-panel"
        style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        bodyStyle={{ flex: 1, overflow: 'auto', padding: 16 }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Empty
              description="开始提问，获取知识库智能回答"
              style={{ marginBottom: 24 }}
            />
            <div style={{ color: 'var(--zb-text-3)', marginBottom: 16 }}>
              快捷问题：
            </div>
            <Space wrap>
              {quickQuestions.map(q => (
                <Tag
                  key={q}
                  style={{ cursor: 'pointer', margin: 4 }}
                  onClick={() => setInput(q)}
                >
                  {q}
                </Tag>
              ))}
            </Space>
          </div>
        ) : (
          <div className="rag-messages" style={{ padding: 8 }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`rag-message rag-message-${msg.role}`}
                style={{
                  marginBottom: 20,
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {/* 角色标签 */}
                <div style={{ flexShrink: 0 }}>
                  <Tag
                    color={msg.role === 'user' ? 'blue' : '#14b8a6'}
                    style={{ borderRadius: 4 }}
                  >
                    {msg.role === 'user' ? '用户' : 'ZebraRAG'}
                  </Tag>
                </div>

                {/* 消息内容 */}
                <div
                  style={{
                    maxWidth: '75%',
                    background: msg.role === 'user' ? '#e6f7ff' : '#f5f5f5',
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}
                >
                  {msg.loading ? (
                    <Spin tip="思考中..." />
                  ) : (
                    <>
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {msg.content}
                        {msg.streaming && <span className="zb-cursor-blink" style={{ color: 'var(--zb-accent)' }}>▍</span>}
                      </div>

                      {/* 知识来源引用 */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <Divider style={{ margin: '8px 0' }} />
                          <div style={{ fontSize: 13, color: 'var(--zb-text-2)', marginBottom: 8, fontWeight: 500 }}>
                            <FileTextOutlined style={{ marginRight: 6 }} />
                            知识来源（{msg.sources.length} 条）：
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {msg.sources.map((source, idx) => (
                              <SourceReference key={`${source.doc_id}-${source.chunk_index}`} source={source} index={idx} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 模型和 Token 用量 */}
                      {msg.role === 'assistant' && !msg.streaming && (msg.model || msg.usage) && (
                        <div style={{ marginTop: 12 }}>
                          <Divider style={{ margin: '8px 0' }} />
                          <Space size="small" style={{ fontSize: 12, color: 'var(--zb-text-3)' }}>
                            {msg.model && (
                              <span>
                                🧠 模型：<strong style={{ color: 'var(--zb-accent)' }}>{msg.model}</strong>
                              </span>
                            )}
                            {msg.usage && (
                              <>
                                {msg.model && <span>|</span>}
                                <span>
                                  Tokens：输入 {msg.usage.prompt_tokens} + 输出 {msg.usage.completion_tokens} = {msg.usage.total_tokens}
                                </span>
                              </>
                            )}
                          </Space>
                        </div>
                      )}

                      {/* 反馈评分 */}
                      {msg.role === 'assistant' && msg.queryId && (
                        <div style={{ marginTop: 12 }}>
                          <Divider style={{ margin: '8px 0' }} />
                          <Space align="center">
                            <span style={{ fontSize: 13, color: 'var(--zb-text-2)' }}>评分：</span>
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
                              style={{ fontSize: 16, color: '#14b8a6' }}
                            />
                            {msg.feedbackSubmitted && (
                              <span style={{ fontSize: 12, color: 'var(--zb-text-3)' }}>已评价</span>
                            )}
                          </Space>
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
      </Card>

      {/* 输入区域 */}
      <Card size="small" style={{ flexShrink: 0 }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="输入问题，如：如何处理 MySQL 主从同步延迟？"
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ flex: 1, borderRadius: 4 }}
            disabled={loading}
          />
          <Button
            type="primary"
            icon={loading && streamAbortRef.current ? <StopOutlined /> : <SendOutlined />}
            onClick={handleSend}
            danger={loading && !!streamAbortRef.current}
            style={loading && streamAbortRef.current ? {} : { background: '#14b8a6', borderColor: '#14b8a6' }}
          >
            {loading && streamAbortRef.current ? '停止' : '发送'}
          </Button>
          {messages.length > 0 && !loading && (
            <Tooltip title="重试">
              <Button icon={<ReloadOutlined />} onClick={handleRetry} />
            </Tooltip>
          )}
        </Space.Compact>
        <div style={{ fontSize: 12, color: 'var(--zb-text-3)', marginTop: 8 }}>
          按 Enter 发送，Shift+Enter 换行。支持 Markdown 格式。
        </div>
      </Card>
    </div>

      {/* 查询历史面板 */}
      <Drawer
        title="查询历史"
        placement="right"
        width={480}
        open={historyDrawerOpen}
        onClose={() => { setHistoryDrawerOpen(false); setSelectedHistory(null); }}
        extra={
          !selectedHistory && (
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => loadHistory(historyPage)}
              loading={historyLoading}
            />
          )
        }
      >
        {selectedHistory ? (
          // 单条历史详情
          <div>
            <Button
              type="link"
              onClick={() => setSelectedHistory(null)}
              style={{ padding: 0, marginBottom: 16 }}
            >
              &larr; 返回列表
            </Button>
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
                  <List.Item
                    onClick={() => setSelectedHistory(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      title={
                        <Typography.Text ellipsis style={{ maxWidth: 360 }}>
                          {item.query_text}
                        </Typography.Text>
                      }
                      description={
                        <Space size="small">
                          <span style={{ fontSize: 12, color: 'var(--zb-text-3)' }}>
                            {dayjs(item.ctime).format('MM-DD HH:mm')}
                          </span>
                          {item.rating && (
                            <Rate count={5} value={item.rating} disabled style={{ fontSize: 12 }} />
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Spin>
        )}
      </Drawer>
    </>
  );
}