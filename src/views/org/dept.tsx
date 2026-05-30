import { useRef, useState, useCallback } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormDigit, ProFormTreeSelect, ProFormRadio, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/rbac/org';
import type { OrgNode, OrgForm } from '@/service/api/rbac/org';

const ORG_TYPE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '公司', color: 'blue' },
  2: { label: '部门', color: 'green' },
  3: { label: '团队', color: 'orange' },
};

/** 将树节点转为 TreeSelect 数据 */
function toTreeSelectData(nodes: OrgNode[]): any[] {
  return nodes.map(n => ({
    title: n.org_name,
    value: n.org_id,
    children: n.children?.length ? toTreeSelectData(n.children) : undefined,
  }));
}

export default function OrgDept() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<OrgNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [parentId, setParentId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  const { userInfo } = useAuthStore();
  const { hasComp } = usePermission();

  /** 收集所有节点 key */
  const collectKeys = (nodes: OrgNode[]): number[] =>
    nodes.flatMap(n => [n.org_id, ...(n.children?.length ? collectKeys(n.children) : [])]);

  const loadTree = useCallback(async () => {
    try {
      const res = await api.fetchOrgTree();
      const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setTreeData(data);
      setExpandedKeys(collectKeys(data));
      return data;
    } catch {
      return [];
    }
  }, []);

  const columns: ProColumns<OrgNode>[] = [
    { title: '组织名称', dataIndex: 'org_name', width: 200 },
    { title: '组织编码', dataIndex: 'org_code', width: 140 },
    {
      title: '类型', dataIndex: 'org_type', width: 80,
      render: (_, row) => {
        const m = ORG_TYPE_MAP[row.org_type ?? 1] ?? { label: String(row.org_type), color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      }
    },
    { title: '排序', dataIndex: 'order_num', width: 60 },
    { title: '创建时间', dataIndex: 'ctime', width: 160, render: v => v || '—' },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 200,
      render: (_, row) => [
        hasComp('org_dept_add') && <Button
          key="addChild" type="link" size="small" icon={<PlusOutlined />}
          onClick={() => { setEditRecord(null); setParentId(row.org_id); setModalOpen(true); }}
        >
          子级
        </Button>,
        hasComp('org_dept_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setParentId(row.parent_id ?? null); setModalOpen(true); }}
        >
          编辑
        </Button>,
        hasComp('org_dept_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteOrg(row.org_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<OrgNode>
        rowKey="org_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('org_dept_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('org_dept_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteOrg(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}

        request={async () => {
          const data = await loadTree();
          return { data, success: true, total: data.length };
        }}
        pagination={false}
        search={false}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys(keys as number[]),
          childrenColumnName: 'children',
        }}
        headerTitle="组织管理"
        toolBarRender={() => [
          hasComp('org_dept_add') && (
            <Button
              key="add" type="primary" icon={<PlusOutlined />}
              onClick={() => { setEditRecord(null); setParentId(null); setModalOpen(true); }}
            >
              新增组织
            </Button>
          )
        ]}
        scroll={{ x: 'max-content' }}
      />
      <ModalForm<OrgForm>
        key={editRecord?.org_id ?? 'new'}
        title={editRecord ? '编辑组织' : '新增组织'}
        open={modalOpen}
        onOpenChange={(open) => { if (!open) { setEditRecord(null); setParentId(null); } setModalOpen(open); }}
        modalProps={{ destroyOnClose: true, transitionName: '', maskTransitionName: '' }}
        initialValues={
          editRecord
            ? { org_name: editRecord.org_name, org_code: editRecord.org_code, org_type: editRecord.org_type ?? 1, parent_id: editRecord.parent_id, order_num: editRecord.order_num ?? 0 }
            : { org_type: 1, parent_id: parentId, order_num: 0 }
        }
        onFinish={async (values) => {
          try {
            const payload = { ...values, parent_id: values.parent_id || null };
            if (editRecord) await api.updateOrg(editRecord.org_id, payload);
            else await api.createOrg(payload);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="org_name" label="组织名称" rules={[{ required: true, message: '请输入组织名称' }]} />
        {editRecord && <ProFormText name="org_code" label="组织编码" fieldProps={{ readOnly: true }} />}
        <ProFormTreeSelect
          name="parent_id" label="上级组织"
          fieldProps={{ treeData: toTreeSelectData(treeData), allowClear: true, placeholder: '无（顶级组织）', treeDefaultExpandAll: true }}
        />
        <ProFormRadio.Group
          name="org_type"
          label="组织类型"
          rules={[{ required: true, message: '请选择组织类型' }]}
          options={[
            { label: '公司', value: 1 },
            { label: '部门', value: 2 },
            { label: '团队', value: 3 },
          ]}
          fieldProps={{ optionType: 'button', buttonStyle: 'solid' }}
        />
        <ProFormDigit name="order_num" label="排序号" fieldProps={{ precision: 0 }} />
      </ModalForm>
    </>
  );
}