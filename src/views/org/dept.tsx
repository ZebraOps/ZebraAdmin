import { useRef, useState, useCallback } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormDigit, ProFormTreeSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
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
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [parentId, setParentId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]);
  const { userInfo } = useAuthStore();
  const canAddOrg = userInfo?.permissions?.all || userInfo?.permissions?.components?.orgAddBtn;

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
        <Button
          key="addChild" type="link" size="small" icon={<PlusOutlined />}
          onClick={() => { setEditRecord(null); setParentId(row.org_id); setModalOpen(true); }}
        >
          子级
        </Button>,
        <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setParentId(row.parent_id ?? null); setModalOpen(true); }}
        >
          编辑
        </Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />}
          onConfirm={async () => { await api.deleteOrg(row.org_id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<OrgNode>
        rowKey="org_id" actionRef={actionRef} columns={columns}
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
          canAddOrg && (
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
        <ProFormText name="org_code" label="组织编码" rules={[{ required: true, message: '请输入组织编码' }]} />
        <ProFormTreeSelect
          name="parent_id" label="上级组织"
          fieldProps={{ treeData: toTreeSelectData(treeData), allowClear: true, placeholder: '无（顶级组织）', treeDefaultExpandAll: true }}
        />
        <ProFormDigit name="org_type" label="组织类型" fieldProps={{ precision: 0 }} tooltip="1-公司 2-部门 3-团队" />
        <ProFormDigit name="order_num" label="排序号" fieldProps={{ precision: 0 }} />
      </ModalForm>
    </>
  );
}