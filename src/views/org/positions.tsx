import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/position';
import type { Position, PositionForm } from '@/service/api/rbac/position';

export default function OrgPositions() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Position | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<Position>[] = [
    { title: '职位名称', dataIndex: 'position_name' },
    { title: '职位编码', dataIndex: 'position_code', render: v => v || '—' },
    { title: '描述', dataIndex: 'description', render: v => v || '—' },
    { title: '创建时间', dataIndex: 'ctime', width: 160, render: v => v || '—' },
    { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        <Popconfirm key="del" title="确认删除该职位？" onConfirm={() => api.deletePosition(row.position_id).then(() => { message.success('删除成功'); actionRef.current?.reload(); }).catch(() => message.error('删除失败'))}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<Position>
        rowKey="position_id" actionRef={actionRef} columns={columns}
        request={async (params) => {
          try { const res = await api.fetchPositions(params); return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 }; }
          catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="职位管理"
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增职位</Button>]}
        scroll={{ x: 'max-content' }}
      />
      <ModalForm<PositionForm>
        title={editRecord ? '编辑职位' : '新增职位'}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { position_name: editRecord.position_name, position_code: editRecord.position_code, description: editRecord.description } : {}}
        onFinish={async (values) => {
          try {
            if (editRecord) await api.updatePosition(editRecord.position_id, values); else await api.createPosition(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="position_name" label="职位名称" rules={[{ required: true }]} />
        <ProFormText name="position_code" label="职位编码" />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}