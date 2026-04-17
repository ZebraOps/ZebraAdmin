import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/job';
import type { Job, JobForm } from '@/service/api/rbac/job';

export default function OrgJob() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Job | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<Job>[] = [
    { title: '岗位名称', dataIndex: 'job_name' },
    { title: '岗位编码', dataIndex: 'job_code', render: v => v || '—' },
    { title: '描述', dataIndex: 'description', render: v => v || '—' },
    { title: '创建时间', dataIndex: 'ctime', width: 160, render: v => v || '—' },
    { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />}
          onConfirm={async () => { await api.deleteJob(row.job_id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<Job>
        rowKey="job_id" actionRef={actionRef} columns={columns}
        request={async (params) => {
          try { const res = await api.fetchJobs(params); return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 }; }
          catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="岗位管理"
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增岗位</Button>]}
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
        <ProFormText name="job_code" label="岗位编码" />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}