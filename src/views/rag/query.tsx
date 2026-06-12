import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Select, Space, Tag, Divider, Spin, Empty, message, Tooltip } from 'antd';
import { SendOutlined, ClearOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { ragQuery } from '@/service/api/rag/query';
import { fetchCollections } from '@/service/api/rag/collections';
import type { QueryResponse, QuerySource } from '@/service/api/rag/query';
import SourceReference from './components/SourceReference';

const { TextArea } = Input;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: QuerySource[];
  timestamp: Date;
  loading?: boolean;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // 发送消息
  const handleSend = async () => {
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

    // 添加加载中的 AI 消息
    const aiMessageId = `ai-${Date.now()}`;
    setMessages(prev => [...prev, userMessage, { id: aiMessageId, role: 'assistant', content: '', timestamp: new Date(), loading: true }]);
    setLoading(true);

    try {
      const response: QueryResponse = await ragQuery({
        question,
        collection_ids: collectionIds.length > 0 ? collectionIds : undefined,
        doc_types: docTypes.length > 0 ? docTypes : undefined,
        top_k: topK,
      });

      // 更新 AI 消息
      setMessages(prev => prev.map(m =>
        m.id === aiMessageId
          ? { ...m, content: response.answer, sources: response.sources, loading: false }
          : m
      ));
    } catch {
      // 更新错误消息
      setMessages(prev => prev.map(m =>
        m.id === aiMessageId
          ? { ...m, content: '查询失败，请稍后重试', loading: false }
          : m
      ));
      message.error('查询失败，请稍后重试');
    } finally {
      setLoading(false);
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
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={loading}
            style={{ background: '#14b8a6', borderColor: '#14b8a6' }}
          >
            发送
          </Button>
          {messages.length > 0 && loading === false && (
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
  );
}