import { useRef, useState } from 'react';
import { Tag, message, Popconfirm, Button, Space, Drawer, Descriptions } from 'antd';
import { ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect, ProFormDigit, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FolderOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import { isHandledError } from '@/service/request';
import * as api from '@/service/api/rag/collections';
import type { Collection, CollectionCreate, CollectionUpdate } from '@/service/api/rag/collections';

/** 集合管理页面 */
export default function RAGCollections() {
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Collection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<Collection | null>(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const canAdd = hasComp('rag_col_add');
  const canEdit = hasComp('rag_col_edit');
  const canDelete = hasComp('rag_col_delete');

  // 打开编辑弹窗
  const handleOpenModal = (record: Collection | null) => {
    setEditRecord(record);
    setModalOpen(true);
  };

  // 打开查看抽屉
  const handleView = (record: Collection) => {
    setViewRecord(record);
    setViewDrawerOpen(true);
  };

  // 提交表单
  const handleSubmit = async (values: CollectionCreate | CollectionUpdate) => {
    try {
      if (editRecord?.collection_id) {
        await api.updateCollection(editRecord.collection_id, values);
        message.success('更新成功');
      } else {
        await api.createCollection(values as CollectionCreate);
        message.success('创建成功');
      }
      setModalOpen(false);
      actionRef.current?.reload();
      return true;
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error('保存失败');
      return false;
    }
  };

  // 删除集合
  const handleDelete = async (collection_id: number) => {
    try {
      await api.deleteCollection(collection_id);
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
      await Promise.all(ids.map(id => api.deleteCollection(id)));
      message.success(`已删除 ${ids.length} 条记录`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error('批量删除失败');
    }
  };

  // 列定义
  const columns: ProColumns<Collection>[] = [
    {
      title: '集合名称',
      dataIndex: 'name',
      ellipsis: true,
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
      width: 280,
    },
    {
      title: 'Embedding 模型',
      dataIndex: 'embedding_model',
      width: 200,
      search: false,
      render: (_, row) => <Tag color="blue">{row.embedding_model}</Tag>,
    },
    {
      title: '分块大小',
      dataIndex: 'chunk_size',
      width: 100,
      search: false,
      align: 'center',
      render: (_, row) => <Tag>{row.chunk_size}</Tag>,
    },
    {
      title: '重叠大小',
      dataIndex: 'chunk_overlap',
      width: 100,
      search: false,
      align: 'center',
      render: (_, row) => <Tag>{row.chunk_overlap}</Tag>,
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
          <Popconfirm key="del" title="确认删除此集合？关联的文档将一并删除" onConfirm={() => handleDelete(row.collection_id)}>
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
      const res = await api.fetchCollections(query as api.CollectionListParams);
      return { data: res?.records ?? [], total: res?.total ?? 0, success: true };
    } catch {
      return { data: [], total: 0, success: false };
    }
  };

  return (
    <>
      <ProTable<Collection>
        rowKey="collection_id"
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
        headerTitle="知识集合管理"
        toolBarRender={() => [
          canAdd && (
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>
              新建集合
            </Button>
          ),
        ].filter(Boolean)}
        search={false}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 20 }}
      />

      {/* 编辑弹窗 */}
      <ModalForm<CollectionCreate | CollectionUpdate>
        key={editRecord?.collection_id ?? 'new'}
        title={editRecord ? '编辑集合' : '新建知识集合'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        modalProps={{
          onCancel: () => setModalOpen(false),
          destroyOnClose: true,
          width: 600,
        }}
        initialValues={editRecord ?? { embedding_model: 'text-embedding-3-small', chunk_size: 500, chunk_overlap: 50 }}
        onFinish={handleSubmit}
      >
        <ProFormText
          name="name"
          label="集合名称"
          rules={[{ required: true, message: '请输入集合名称' }]}
          placeholder="如：运维知识库、故障案例库"
          maxLength={100}
        />

        <ProFormTextArea
          name="description"
          label="描述"
          placeholder="描述集合的内容范围和用途"
          fieldProps={{ rows: 3 }}
        />

        <ProFormSelect
          name="embedding_model"
          label="Embedding 模型"
          tooltip="向量嵌入模型，不同模型生成的向量不兼容"
          options={api.EMBEDDING_MODEL_OPTIONS}
        />

        <Space style={{ width: '100%' }} size="large">
          <ProFormDigit
            name="chunk_size"
            label="分块大小"
            tooltip="文档切分的最大字符数"
            min={100}
            max={2000}
            fieldProps={{ precision: 0 }}
          />

          <ProFormDigit
            name="chunk_overlap"
            label="重叠大小"
            tooltip="相邻分块重叠的字符数，提高检索召回率"
            min={0}
            max={200}
            fieldProps={{ precision: 0 }}
          />
        </Space>
      </ModalForm>

      {/* 查看抽屉 */}
      <Drawer
        title={<><FolderOutlined /> 集合详情</>}
        placement="right"
        width={600}
        open={viewDrawerOpen}
        onClose={() => setViewDrawerOpen(false)}
      >
        {viewRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="集合名称">{viewRecord.name}</Descriptions.Item>
            <Descriptions.Item label="描述">{viewRecord.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="Embedding 模型">
              <Tag color="blue">{viewRecord.embedding_model}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分块大小">{viewRecord.chunk_size} 字符</Descriptions.Item>
            <Descriptions.Item label="重叠大小">{viewRecord.chunk_overlap} 字符</Descriptions.Item>
            <Descriptions.Item label="创建时间">{viewRecord.ctime}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </>
  );
}