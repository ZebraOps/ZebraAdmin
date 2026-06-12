import { useRef, useState, useEffect } from 'react';
import { Tag, message, Popconfirm, Button, Space, Drawer, Form, Input, Select, Divider, Typography } from 'antd';
import { ProTable, ModalForm, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { isHandledError } from '@/service/request';
import CodeEditor from '@/components/CodeEditor';
import * as api from '@/service/api/rag/documents';
import { fetchCollections } from '@/service/api/rag/collections';
import type { Document, DocumentCreate, DocumentUpdate } from '@/service/api/rag/documents';

const { Paragraph } = Typography;

/** 文档管理页面 */
export default function RAGDocuments() {
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Document | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<Document | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<{ label: string; value: number }[]>([]);
  const [contentValue, setContentValue] = useState('');
  const [form] = Form.useForm();

  const canAdd = hasComp('rag_doc_add');
  const canEdit = hasComp('rag_doc_edit');
  const canDelete = hasComp('rag_doc_delete');

  // 加载集合选项
  useEffect(() => {
    fetchCollections({ page: 1, size: 100 }).then(res => {
      if (res) {
        setCollectionOptions(res.records.map(c => ({ label: c.name, value: c.collection_id })));
      }
    });
  }, []);

  // 打开编辑弹窗
  const handleOpenModal = (record: Document | null) => {
    setEditRecord(record);
    if (record) {
      form.setFieldsValue({
        title: record.title,
        doc_type: record.doc_type,
        severity: record.severity,
        status: record.status,
        collection_id: record.collection_id,
        tags: record.tags?.join(', '),
        affected_systems: record.affected_systems?.join(', '),
      });
      setContentValue(record.content || '');
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'draft' });
      setContentValue('');
    }
    setModalOpen(true);
  };

  // 打开查看抽屉
  const handleView = (record: Document) => {
    setViewRecord(record);
    setViewDrawerOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data: DocumentCreate | DocumentUpdate = {
        ...values,
        content: contentValue,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        affected_systems: values.affected_systems ? values.affected_systems.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
      };

      if (editRecord?.doc_id) {
        await api.updateDocument(editRecord.doc_id, data);
        message.success('更新成功');
      } else {
        await api.createDocument(data as DocumentCreate);
        message.success('创建成功');
      }
      actionRef.current?.reload();
      return true;
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error('保存失败');
      return false;
    }
  };

  // 删除文档
  const handleDelete = async (doc_id: number) => {
    try {
      await api.deleteDocument(doc_id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error('删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      const ids = selectedRowKeys as number[];
      await Promise.all(ids.map(id => api.deleteDocument(id)));
      message.success(`已删除 ${ids.length} 条记录`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error('批量删除失败');
    }
  };

  // 列定义
  const columns: ProColumns<Document>[] = [
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      copyable: true,
      width: 280,
    },
    {
      title: '文档类型',
      dataIndex: 'doc_type',
      width: 120,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(api.DOC_TYPE_CONFIG).map(([k, v]) => [k, { text: v.label }])
      ),
      render: (_, row) => {
        const config = api.DOC_TYPE_CONFIG[row.doc_type];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
    {
      title: '严重等级',
      dataIndex: 'severity',
      width: 90,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(api.SEVERITY_CONFIG).map(([k, v]) => [k, { text: v.label }])
      ),
      render: (_, row) => row.severity ? <Tag color={api.SEVERITY_CONFIG[row.severity]?.color}>{row.severity}</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(api.STATUS_CONFIG).map(([k, v]) => [k, { text: v.label, status: v.status as 'Success' | 'Default' | 'Processing' }])
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      ellipsis: true,
      search: false,
      width: 180,
      render: (_, row) => row.tags?.length ? row.tags.map(t => <Tag key={t} style={{ marginBottom: 2 }}>{t}</Tag>) : '-',
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 70,
      search: false,
      align: 'center',
    },
    {
      title: '创建时间',
      dataIndex: 'ctime',
      valueType: 'dateTime',
      width: 160,
      search: false,
    },
    {
      title: '操作',
      key: 'actions',
      valueType: 'option',
      fixed: 'right',
      width: 160,
      render: (_, row) => [
        <Button key="view" type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(row)}>
          查看
        </Button>,
        canEdit && (
          <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(row)}>
            编辑
          </Button>
        ),
        canDelete && (
          <Popconfirm key="del" title="确认删除此文档？" onConfirm={() => handleDelete(row.doc_id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        ),
      ].filter(Boolean),
    },
  ];

  // ProTable request 适配器
  const requestAdapter = async (params: Record<string, unknown>) => {
    try {
      const query: Record<string, unknown> = {
        page: params.current ?? 1,
        size: params.pageSize ?? 20,
      };
      for (const [key, val] of Object.entries(params)) {
        if (key !== 'current' && key !== 'pageSize' && val !== undefined && val !== '') {
          query[key] = val;
        }
      }
      const res = await api.fetchDocuments(query as api.DocumentListParams);
      return { data: res?.records ?? [], total: res?.total ?? 0, success: true };
    } catch {
      return { data: [], total: 0, success: false };
    }
  };

  return (
    <>
      <ProTable<Document>
        rowKey="doc_id"
        actionRef={actionRef}
        columns={columns}
        rowSelection={canDelete ? {
          selectedRowKeys,
          onChange: keys => setSelectedRowKeys(keys),
        } : undefined}
        tableAlertOptionRender={canDelete && selectedRowKeys.length > 0 ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`} onConfirm={handleBatchDelete}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        ) : undefined}
        request={requestAdapter}
        headerTitle="文档管理"
        toolBarRender={() => [
          canAdd && (
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>
              新增文档
            </Button>
          ),
        ].filter(Boolean)}
        search={{ labelWidth: 80 }}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 20 }}
      />

      {/* 编辑弹窗 — onOpenChange 只控制 open，不做其他操作（避免 key 变动导致重挂载冲突） */}
      <ModalForm
        key={editRecord?.doc_id ?? 'new'}
        title={editRecord ? '编辑文档' : '新增文档'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        modalProps={{
          onCancel: () => setModalOpen(false),
          transitionName: '',
          maskTransitionName: '',
          destroyOnClose: true,
          width: 800,
          maskClosable: false,
        }}
        form={form}
        onFinish={handleSubmit}
      >
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="输入文档标题" maxLength={200} />
        </Form.Item>

        <Space style={{ width: '100%' }} size="large">
          <Form.Item name="doc_type" label="文档类型" rules={[{ required: true, message: '请选择类型' }]} style={{ width: 200 }}>
            <Select placeholder="选择文档类型" options={Object.entries(api.DOC_TYPE_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
          </Form.Item>

          <Form.Item name="severity" label="严重等级" style={{ width: 200 }}>
            <Select placeholder="选择严重等级（可选）" allowClear options={Object.entries(api.SEVERITY_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
          </Form.Item>

          <Form.Item name="status" label="状态" style={{ width: 160 }}>
            <Select options={Object.entries(api.STATUS_CONFIG).map(([k, v]) => ({ label: v.label, value: k }))} />
          </Form.Item>
        </Space>

        <Space style={{ width: '100%' }} size="large">
          <Form.Item name="collection_id" label="所属集合" style={{ width: 280 }}>
            <Select placeholder="选择知识集合（可选）" allowClear options={collectionOptions} />
          </Form.Item>

          <Form.Item name="tags" label="标签" style={{ flex: 1 }}>
            <Input placeholder="多个标签用逗号分隔，如：K8s, 故障, 网络" />
          </Form.Item>
        </Space>

        <Form.Item name="affected_systems" label="受影响系统">
          <Input placeholder="多个系统用逗号分隔，如：k8s, mysql, redis" />
        </Form.Item>

        <Divider style={{ margin: '12px 0' }}>文档内容</Divider>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>内容</span>
          <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>支持 Markdown 格式</span>
        </div>
        <CodeEditor
          value={contentValue}
          onChange={setContentValue}
          language="markdown"
          height="350px"
          showToolbar
        />
      </ModalForm>

      {/* 查看抽屉 */}
      <Drawer
        title={<><FileTextOutlined /> 文档详情</>}
        placement="right"
        width={720}
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
      >
        {viewRecord && (
          <div>
            <Paragraph><strong>标题：</strong>{viewRecord.title}</Paragraph>
            <Paragraph>
              <strong>类型：</strong>
              <Tag color={api.DOC_TYPE_CONFIG[viewRecord.doc_type]?.color}>{api.DOC_TYPE_CONFIG[viewRecord.doc_type]?.label}</Tag>
              {viewRecord.severity && <Tag color={api.SEVERITY_CONFIG[viewRecord.severity]?.color} style={{ marginLeft: 8 }}>{viewRecord.severity}</Tag>}
              <Tag style={{ marginLeft: 8 }}>{api.STATUS_CONFIG[viewRecord.status]?.label}</Tag>
            </Paragraph>
            {viewRecord.tags?.length && (
              <Paragraph><strong>标签：</strong>{viewRecord.tags.map(t => <Tag key={t}>{t}</Tag>)}</Paragraph>
            )}
            {viewRecord.affected_systems?.length && (
              <Paragraph><strong>受影响系统：</strong>{viewRecord.affected_systems.join(', ')}</Paragraph>
            )}
            <Paragraph><strong>版本：</strong>v{viewRecord.version}</Paragraph>
            <Paragraph><strong>创建时间：</strong>{viewRecord.ctime}</Paragraph>
            <Divider>内容</Divider>
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
              {viewRecord.content}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}