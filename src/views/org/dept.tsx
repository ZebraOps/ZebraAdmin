import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/group';
import type { Group, GroupForm } from '@/service/api/rbac/group';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'green' },
  '1': { label: '禁用', color: 'red' },
};

export default function OrgDept() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Group | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<Group>[] = [
    { title: '分组名称', dataIndex: 'group_name' },
    { title: '描述', dataIndex: 'description', render: v => v || '—' },
    { title: '状态', dataIndex: 'status', render: (_, row) => { const m = STATUS_MAP[String((row as any).status)] ?? { label: String((row as any).status), color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; } },
    { title: '创建时间', dataIndex: 'ctime', width: 160, render: v => v || '—' },
    { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        <Popconfirm key="del" title="确认删除该分组？" onConfirm={() => api.deleteGroup(row.group_id).then(() => { message.success('删除成功'); actionRef.current?.reload(); }).catch(() => message.error('删除失败'))}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<Group>
        rowKey="group_id" actionRef={actionRef} columns={columns}
        request={async (params) => {
          try { const res = await api.fetchGroups(params); return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 }; }
          catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="分组管理"
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增分组</Button>]}
        scroll={{ x: 'max-content' }}
      />
      <ModalForm<GroupForm>
        title={editRecord ? '编辑分组' : '新增分组'}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { group_name: editRecord.group_name, description: editRecord.description, status: editRecord.status } : {}}
        onFinish={async (values) => {
          try {
            if (editRecord) await api.updateGroup(editRecord.group_id, values); else await api.createGroup(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="group_name" label="分组名称" rules={[{ required: true }]} />
        <ProFormText name="description" label="描述" />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
      </ModalForm>
    </>
  );
}