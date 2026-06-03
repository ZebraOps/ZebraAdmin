import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/rbac/job';
import type { Job, JobForm } from '@/service/api/rbac/job';

export default function OrgJob() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Job | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { hasComp } = usePermission();

  const columns: ProColumns<Job>[] = [
    { title: '岗位名称', dataIndex: 'job_name', ellipsis: true },
    { title: '岗位编码', dataIndex: 'job_code', width: 120, render: v => v || '—' },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false, render: v => v || '—' },
    { title: '创建时间', dataIndex: 'ctime', width: 150, search: false, render: v => v || '—' },
    { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        hasComp('org_job_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        hasComp('org_job_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteJob(row.job_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Job>
        rowKey="job_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('org_job_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('org_job_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteJob(id as number)));
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
            if (params.job_name) query.name = params.job_name;
            if (params.job_code) query.code = params.job_code;
            const res = await api.fetchJobs(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          }
          catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="岗位管理"
        search={{ labelWidth: 80 }}
        toolBarRender={() => [hasComp('org_job_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增岗位</Button>]}
        scroll={{ x: 'max-content' }}
      />
      <ModalForm<JobForm>
        key={editRecord?.job_id ?? 'new'}
        title={editRecord ? '编辑岗位' : '新增岗位'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ? { job_name: editRecord.job_name, job_code: editRecord.job_code, description: editRecord.description } : {}}
        onFinish={async (values) => {
          try {
            if (editRecord) await api.updateJob(editRecord.job_id, values); else await api.createJob(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="job_name" label="岗位名称" rules={[{ required: true }]} />
        {editRecord && <ProFormText name="job_code" label="岗位编码" fieldProps={{ readOnly: true }} />}
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}