import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/position';
import type { Position, PositionForm } from '@/service/api/rbac/position';
import { usePermission } from '@/hooks/usePermission';

export default function OrgPositions() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Position | null>(null);
  const { hasComp } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<Position>[] = [
    { title: '职位名称', dataIndex: 'position_name' },
    { title: '职位编码', dataIndex: 'position_code', render: v => v || '—' },
    { title: '描述', dataIndex: 'description', search: false, render: v => v || '—' },
    { title: '创建时间', dataIndex: 'ctime', width: 160, search: false, render: v => v || '—' },
    { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        hasComp('org_position_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        hasComp('org_position_delete') && <CountdownButton key="del" icon={<DeleteOutlined />}
          onConfirm={async () => { await api.deletePosition(row.position_id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Position>
        rowKey="position_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('org_position_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('org_position_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deletePosition(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}

        request={async (params) => {
          try {
            const { current = 1, pageSize = 20 } = params;
            const query: Record<string, unknown> = { current: (current - 1) * pageSize, size: pageSize };
            if (params.position_name) query.name = params.position_name;
            if (params.position_code) query.code = params.position_code;
            const res = await api.fetchPositions(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          }
          catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="职位管理"
        search={{ labelWidth: 80 }}
        toolBarRender={() => [hasComp('org_position_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增职位</Button>]}
        scroll={{ x: 'max-content' }}
      />
      <ModalForm<PositionForm>
        key={editRecord?.position_id ?? 'new'}
        title={editRecord ? '编辑职位' : '新增职位'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ? { position_name: editRecord.position_name, position_code: editRecord.position_code, description: editRecord.description } : {}}
        onFinish={async (values) => {
          try {
            if (editRecord) await api.updatePosition(editRecord.position_id, values); else await api.createPosition(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="position_name" label="职位名称" rules={[{ required: true }]} />
        {editRecord && <ProFormText name="position_code" label="职位编码" fieldProps={{ readOnly: true }} />}
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}