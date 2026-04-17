import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/repos';
import type { Repo } from '@/service/api/publish/repos';

const REPO_TYPE_COLORS: Record<string, string> = { git: 'processing', svn: 'warning', hg: 'success' };

export default function PublishRepos() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Repo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<Repo>[] = [
    { title: '仓库名称', dataIndex: 'name' },
    { title: '仓库地址', dataIndex: 'url' },
    { title: '类型', dataIndex: 'type', width: 90, render: (val) => val ? <Tag color={REPO_TYPE_COLORS[String(val).toLowerCase()] ?? 'default'}>{String(val).toUpperCase()}</Tag> : '-' },
    { title: '分支', dataIndex: 'branch', width: 100, render: (val) => val ? <Tag color="success">{String(val)}</Tag> : '-' },
    { title: '描述', dataIndex: 'description' },
    { title: '创建时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteRepo(row.id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<Repo>
        rowKey="id" actionRef={actionRef} columns={columns}
        request={async () => { try { const res = await api.fetchRepos({}); return { data: (res as any)?.items ?? (res as any)?.data?.list ?? (res as any)?.data ?? [], success: true, total: 0 }; } catch { return { data: [], success: false, total: 0 }; } }}
        headerTitle={t('route.publish_repos', { defaultValue: '代码仓库' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增仓库' })}</Button>]}
        search={false} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<Parameters<typeof api.createRepo>[0]>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑仓库' : '新增仓库'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }} initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateRepo(editRecord.id, values); else await api.createRepo(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="name" label="仓库名称" rules={[{ required: true }]} />
        <ProFormText name="url" label="仓库地址" rules={[{ required: true }]} placeholder="https://github.com/org/repo.git" />
        <ProFormSelect name="type" label="类型" options={[{ label: 'Git', value: 'git' }, { label: 'SVN', value: 'svn' }]} />
        <ProFormText name="branch" label="默认分支" placeholder="main" />
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}
