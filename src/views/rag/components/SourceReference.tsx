import { useState } from 'react';
import { Card, Tag, Typography, Space } from 'antd';
import { FileTextOutlined, ExpandOutlined, CompressOutlined } from '@ant-design/icons';
import CodeEditor from '@/components/CodeEditor';
import type { QuerySource } from '@/service/api/rag/query';

const { Text } = Typography;

interface SourceReferenceProps {
  source: QuerySource;
  index: number;
}

/** 知识来源引用组件 */
export default function SourceReference({ source, index }: SourceReferenceProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      size="small"
      hoverable
      style={{
        borderLeft: '3px solid #14b8a6',
        background: '#fafafa',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      styles={{ body: { padding: 12 } }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Tag color="#14b8a6" style={{ margin: 0 }}>#{index + 1}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <FileTextOutlined style={{ marginRight: 4 }} />
            文档 ID: {source.doc_id}
          </Text>
          <Tag style={{ margin: 0, fontSize: 11 }}>chunk #{source.chunk_index}</Tag>
        </Space>
        <Text type="secondary">
          {expanded ? <CompressOutlined /> : <ExpandOutlined />}
        </Text>
      </div>

      {expanded ? (
        <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
          <CodeEditor
            value={source.content}
            language="markdown"
            height="200px"
            showToolbar={false}
          />
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--zb-text-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {source.content.slice(0, 120)}
          {source.content.length > 120 ? '...' : ''}
        </div>
      )}
    </Card>
  );
}