import { useRef, useState, useEffect, type ReactNode, type Ref } from 'react';
import { ProTable, ModalForm, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';

/** CRUD 页面配置 */
interface CRUDPageConfig<T extends { id?: number }> {
  /** 数据行唯一键 */
  rowKey: string;
  /** 表格标题 */
  title: string;
  /** 列定义 */
  columns: ProColumns<T>[];
  /** 列表请求函数（参数为 {page, size, ...filters}，返回 {data, total}） */
  fetchList: (params: Record<string, unknown>) => Promise<{ data: T[]; total: number }>;
  /** 创建项 */
  createItem?: (data: Partial<T>) => Promise<unknown>;
  /** 更新项 */
  updateItem?: (id: number, data: Partial<T>) => Promise<unknown>;
  /** 删除项 */
  deleteItem: (id: number) => Promise<unknown>;
  /** 批量删除（默认逐条调用 deleteItem） */
  batchDelete?: (ids: number[]) => Promise<unknown>;

  /** 权限键 */
  addPerm?: string;
  editPerm?: string;
  deletePerm?: string;

  /** 操作列宽度（默认 140） */
  actionColumnWidth?: number;

  /** 操作列额外按钮渲染（在编辑/删除按钮之前） */
  extraActionRender?: (row: T) => ReactNode[];

  /** 表单字段 */
  formFields: ReactNode | ((record: T | null) => ReactNode);
  /** 表单初始值（新增时） */
  formInitialValues?: Partial<T>;
  /** 新增表单标题 */
  formTitleCreate?: string;
  /** 编辑表单标题 */
  formTitleEdit?: string;

  /** 自定义工具栏 */
  customToolbar?: ReactNode[];

  /** 搜索标签宽度 */
  searchLabelWidth?: number;

  /** 是否隐藏搜索 */
  searchHidden?: boolean;

  /** 外部 actionRef，允许父组件调用 reload() */
  actionRef?: Ref<ActionType | undefined>;
}

/**
 * 通用发布中心 CRUD 页面模板
 *
 * 封装了 ProTable + ModalForm + 批量删除 + 权限控制 + 分页适配的统一模式。
 * 只需传入列定义、API 函数和表单字段即可生成完整的 CRUD 页面。
 */
export default function PublishCRUDPage<T extends { id?: number }>(config: CRUDPageConfig<T>) {
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<T | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 将内部 actionRef 暴露给外部（只在 mount 后运行一次，此时 ProTable 已完成初始化）
  useEffect(() => {
    if (config.actionRef) {
      if (typeof config.actionRef === 'function') {
        config.actionRef(actionRef.current ?? undefined);
      } else {
        (config.actionRef as React.MutableRefObject<ActionType | undefined>).current = actionRef.current ?? undefined;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canAdd = config.addPerm ? hasComp(config.addPerm) : true;
  const canEdit = config.editPerm ? hasComp(config.editPerm) : true;
  const canDelete = config.deletePerm ? hasComp(config.deletePerm) : true;

  // 增强列定义：自动添加操作列
  const enhancedColumns: ProColumns<T>[] = [
    ...config.columns,
    ...(canEdit || canDelete ? [{
      title: '操作',
      key: 'actions',
      valueType: 'option' as const,
      fixed: 'right' as const,
      width: config.actionColumnWidth ?? 140,
      render: (_: unknown, row: T) => [
        ...config.extraActionRender?.(row) ?? [],
        canEdit && config.updateItem && (
          <Button key="edit" type="link" size="small" icon={<EditOutlined />}
            onClick={() => { setEditRecord(row); setModalOpen(true); }}>
            编辑
          </Button>
        ),
        canDelete && (
          <Popconfirm key="del" title="确认删除？" onConfirm={async () => {
            try {
              await config.deleteItem(row.id!);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (e: unknown) {
              if (!isHandledError(e)) message.error((e as any)?.message || '删除失败');
            }
          }}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        ),
      ].filter(Boolean),
    }] : []),
  ];

  // 批量删除处理
  const handleBatchDelete = async () => {
    try {
      const ids = selectedRowKeys.map(k => k as number);
      if (config.batchDelete) {
        await config.batchDelete(ids);
      } else {
        await Promise.all(ids.map(id => config.deleteItem(id)));
      }
      message.success(`已删除 ${ids.length} 条`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '批量删除失败');
    }
  };

  // 表单提交处理
  const handleFormFinish = async (values: Partial<T>) => {
    try {
      if (editRecord?.id && config.updateItem) {
        await config.updateItem(editRecord.id, values);
      } else if (config.createItem) {
        await config.createItem(values);
      }
      message.success('保存成功');
      actionRef.current?.reload();
      return true;
    } catch (e: unknown) {
      if (!isHandledError(e)) message.error((e as any)?.message || '保存失败');
      return false;
    }
  };

  const renderedFormFields = typeof config.formFields === 'function'
    ? config.formFields(editRecord)
    : config.formFields;

  // ProTable request 适配器（修正分页参数：page 而非 current offset）
  const requestAdapter = async (params: Record<string, unknown>) => {
    try {
      const query: Record<string, unknown> = {
        page: params.current ?? 1,
        size: params.pageSize ?? 20,
      };
      // 添加搜索过滤条件（排除 ProTable 内置参数）
      for (const [key, val] of Object.entries(params)) {
        if (key !== 'current' && key !== 'pageSize' && val !== undefined && val !== '') {
          query[key] = val;
        }
      }
      const { data, total } = await config.fetchList(query);
      return { data, total, success: true };
    } catch {
      return { data: [], total: 0, success: false };
    }
  };

  return (
    <>
      <ProTable<T>
        rowKey={config.rowKey}
        actionRef={actionRef}
        columns={enhancedColumns}
        rowSelection={canDelete ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys as React.Key[]) } : undefined}
        tableAlertOptionRender={canDelete && selectedRowKeys.length > 0 ? () => (
          <Popconfirm title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`} onConfirm={handleBatchDelete}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        ) : undefined}
        request={requestAdapter}
        headerTitle={config.title}
        toolBarRender={() => [
          ...(config.customToolbar || []),
          canAdd && config.createItem && (
            <Button key="add" type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditRecord(null); setModalOpen(true); }}>
              新增
            </Button>
          ),
        ].filter(Boolean)}
        search={config.searchHidden ? false : { labelWidth: config.searchLabelWidth ?? 80 }}
        scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 20 }}
      />
      {(config.createItem || config.updateItem) && (
        <ModalForm<Partial<T>>
          key={editRecord?.id ?? 'new'}
          title={editRecord ? (config.formTitleEdit || '编辑') : (config.formTitleCreate || '新增')}
          open={modalOpen}
          onOpenChange={setModalOpen}
          modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
          initialValues={editRecord ?? config.formInitialValues ?? {}}
          onFinish={handleFormFinish}
        >
          {renderedFormFields}
        </ModalForm>
      )}
    </>
  );
}