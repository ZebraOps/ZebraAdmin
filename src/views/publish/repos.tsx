import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Space, Modal, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/repos';
import type { Repo, RepoTemplate } from '@/service/api/publish/repos';
import {
  fetchBuildTemplates, associateBuildTemplateRepo, disassociateBuildTemplateRepo,
} from '@/service/api/publish/build-template';

export default function PublishRepos() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<Repo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 关联模板抽屉
  const [tmplDrawerOpen, setTmplDrawerOpen] = useState(false);
  const [tmplRepo, setTmplRepo] = useState<Repo | null>(null);
  const [tmplList, setTmplList] = useState<RepoTemplate[]>([]);
  const [tmplLoading, setTmplLoading] = useState(false);
  const [allBuildTemplates, setAllBuildTemplates] = useState<{ label: string; value: number }[]>([]);
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [associateTplId, setAssociateTplId] = useState<number | undefined>();

  useEffect(() => {
    fetchBuildTemplates({ size: 200 }).then((res) => {
      setAllBuildTemplates(((res as any)?.records ?? []).map((e: any) => ({
        label: `${e.name}${e.language ? ` (${e.language})` : ''}`,
        value: e.id,
      })));
    }).catch(() => {});
  }, []);

  const loadRepoTemplates = async (repo: Repo) => {
    setTmplLoading(true);
    try {
      const list = await api.fetchRepoTemplates(repo.id);
      setTmplList(Array.isArray(list) ? list : []);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取关联模板失败');
      setTmplList([]);
    } finally {
      setTmplLoading(false);
    }
  };

  const handleViewTemplates = async (row: Repo) => {
    setTmplRepo(row);
    setTmplDrawerOpen(true);
    await loadRepoTemplates(row);
  };

  const handleAssociate = async () => {
    if (!tmplRepo || !associateTplId) {
      message.warning('请选择要关联的模板');
      return;
    }
    try {
      await associateBuildTemplateRepo(associateTplId, tmplRepo.id);
      message.success('关联成功');
      setAssociateModalOpen(false);
      setAssociateTplId(undefined);
      await loadRepoTemplates(tmplRepo);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '关联失败');
    }
  };

  const columns: ProColumns<Repo>[] = [
    { title: '中文名称', dataIndex: 'c_name', width: 150 },
    { title: '英文名称', dataIndex: 'e_name', width: 150 },
    { title: '仓库地址', dataIndex: 'repo_url', ellipsis: true, search: false },
    {
      title: '部署平台', dataIndex: 'platform', width: 90, search: false,
      render: (val) => val ? <Tag color={String(val) === 'k8s' ? 'processing' : 'warning'}>{String(val).toUpperCase()}</Tag> : '-'
    },
    { title: '开发语言', dataIndex: 'repo_language', width: 100 },
    { title: '负责人', dataIndex: 'repo_manager', width: 100 },
    { title: '归属部门', dataIndex: 'repo_department', width: 120 },
    { title: '描述', dataIndex: 'repo_desc', ellipsis: true, search: false },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 240,
      render: (_, row) => [
        <Button
          key="tmpl" type="link" size="small" icon={<LinkOutlined />}
          onClick={() => handleViewTemplates(row)}
        >模板</Button>,
        <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setModalOpen(true); }}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton
          key="del" icon={<DeleteOutlined />}
          text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => {
            await api.deleteRepo(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}
        />
      ]
    }
  ];

  const tmplColumns: ProColumns<RepoTemplate>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '模板名称', dataIndex: 'name' },
    { title: '语言', dataIndex: 'language', width: 100 },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 170 },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 110,
      render: (_, row) => [
        <CountdownButton
          key="del" icon={<DeleteOutlined />} text="取消关联"
          onConfirm={async () => {
            if (!tmplRepo) return;
            try {
              await disassociateBuildTemplateRepo(row.id, tmplRepo.id);
              message.success('已取消关联');
              await loadRepoTemplates(tmplRepo);
            } catch (e: any) {
              if (!isHandledError(e)) message.error(e?.message || '操作失败');
            }
          }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<Repo>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteRepo(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        )}
        request={async (params) => {
          try {
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            if (params.c_name) query.c_name = params.c_name;
            if (params.e_name) query.e_name = params.e_name;
            if (params.repo_language) query.language = params.repo_language;
            if (params.repo_manager) query.repo_manager = params.repo_manager;
            if (params.repo_department) query.repo_department = params.repo_department;
            const res = await api.fetchRepos(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_repos', { defaultValue: '代码仓库' })}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>
            {t('common.add', { defaultValue: '新增仓库' })}
          </Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<Repo>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑仓库' : '新增仓库'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateRepo(editRecord.id, values);
            else await api.createRepo(values as any);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="c_name" label="中文名称" rules={[{ required: true }]} />
        <ProFormText name="e_name" label="英文名称" rules={[{ required: true }]} />
        <ProFormText name="repo_url" label="仓库HTTP地址" placeholder="https://github.com/org/repo.git" />
        <ProFormText name="repo_ssh_url" label="仓库SSH地址" placeholder="git@github.com:org/repo.git" />
        <ProFormSelect
          name="platform" label="部署平台"
          options={[{ label: 'K8s', value: 'k8s' }, { label: 'Linux', value: 'linux' }]}
          initialValue="k8s"
        />
        <ProFormText name="repo_language" label="开发语言" placeholder="Go / Java / Python..." />
        <ProFormText name="repo_manager" label="负责人" />
        <ProFormText name="repo_department" label="归属部门" />
        <ProFormText name="repo_desc" label="描述" />
      </ModalForm>

      {/* 关联模板抽屉 */}
      <Drawer
        title={`关联构建模板 — ${tmplRepo?.c_name ?? ''}`}
        placement="right" width={900}
        open={tmplDrawerOpen}
        onClose={() => setTmplDrawerOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssociateModalOpen(true)}>
              关联模板
            </Button>
          </Space>
        }
      >
        <ProTable<RepoTemplate>
          rowKey="id" search={false} columns={tmplColumns}
          dataSource={tmplList} loading={tmplLoading}
          pagination={{ pageSize: 20 }} options={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 选择模板进行关联 */}
      <Modal
        title="选择构建模板"
        open={associateModalOpen}
        onCancel={() => { setAssociateModalOpen(false); setAssociateTplId(undefined); }}
        onOk={handleAssociate} okText="确认关联"
        destroyOnClose
      >
        <ProFormSelect
          label="构建模板" name="tplId" options={allBuildTemplates}
          showSearch fieldProps={{ optionFilterProp: 'label', value: associateTplId, onChange: (v) => setAssociateTplId(v as number) }}
        />
      </Modal>
    </>
  );
}
