import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Tag, message, Drawer, Modal, Space, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined, LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/deploy-template';
import type { DeployTemplate, DeployTemplateRepo } from '@/service/api/publish/deploy-template';
import { fetchRepos } from '@/service/api/publish/repos';
import { fetchLanguages } from '@/service/api/publish/language';

const STATUS_COLORS: Record<string, string> = { active: 'success', inactive: 'default' };

interface DeployTemplateHistoryItem {
  id: number;
  template_id?: number;
  modifier?: string;
  change_reason?: string;
  version?: string;
  created_at?: string;
}

export default function PublishTemplatesDeployment() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<DeployTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);

  // 历史抽屉
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTpl, setHistoryTpl] = useState<DeployTemplate | null>(null);
  const [historyList, setHistoryList] = useState<DeployTemplateHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 关联仓库抽屉
  const [reposOpen, setReposOpen] = useState(false);
  const [reposTpl, setReposTpl] = useState<DeployTemplate | null>(null);
  const [linkedRepos, setLinkedRepos] = useState<DeployTemplateRepo[]>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [associateRepoId, setAssociateRepoId] = useState<number | undefined>();
  const [allRepos, setAllRepos] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    fetchRepos({ size: 200 }).then((res) => {
      setAllRepos(((res as any)?.records ?? []).map((e: any) => ({
        label: `${e.c_name} (${e.e_name})`, value: e.id,
      })));
    }).catch(() => {});
    fetchLanguages({ size: 200 }).then((res) => {
      setLanguageOptions(((res as any)?.records ?? []).map((e: any) => ({
        label: e.display_name || e.name,
        value: e.name,
      })));
    }).catch(() => {});
  }, []);

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  const loadHistory = async (tpl: DeployTemplate) => {
    setHistoryLoading(true);
    try {
      const list = await api.fetchDeployTemplateHistory(tpl.id);
      const records = (list as any)?.records ?? (Array.isArray(list) ? list : []);
      setHistoryList(records);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取历史失败');
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadLinkedRepos = async (tpl: DeployTemplate) => {
    setLinkedLoading(true);
    try {
      const list = await api.fetchReposByDeployTemplate(tpl.id);
      setLinkedRepos(Array.isArray(list) ? list : []);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取关联仓库失败');
      setLinkedRepos([]);
    } finally {
      setLinkedLoading(false);
    }
  };

  const handleAssociate = async () => {
    if (!reposTpl || !associateRepoId) {
      message.warning('请选择仓库');
      return;
    }
    try {
      await api.associateDeployTemplateRepo(reposTpl.id, associateRepoId);
      message.success('关联成功');
      setAssociateOpen(false);
      setAssociateRepoId(undefined);
      await loadLinkedRepos(reposTpl);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '关联失败');
    }
  };

  const columns: ProColumns<DeployTemplate>[] = [
    { title: '模板名称', dataIndex: 'name' },
    { title: '显示名称', dataIndex: 'display_name', search: false },
    {
      title: '类型', dataIndex: 'template_type', width: 110,
      valueType: 'select',
      valueEnum: { k8s: { text: 'K8S' }, helm: { text: 'HELM' }, docker: { text: 'DOCKER' } },
      render: (_, row) => row.template_type ? <Tag>{String(row.template_type).toUpperCase()}</Tag> : '-'
    },
    { title: '版本', dataIndex: 'version', width: 80, search: false },
    {
      title: '状态', dataIndex: 'status', width: 90,
      valueType: 'select',
      valueEnum: { active: { text: '激活' }, inactive: { text: '停用' } },
      render: (_, row) => row.status ? <Tag color={STATUS_COLORS[String(row.status)] ?? 'default'}>{String(row.status)}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 280,
      render: (_, row) => [
        <Button
          key="repos" type="link" size="small" icon={<LinkOutlined />}
          onClick={() => { setReposTpl(row); setReposOpen(true); loadLinkedRepos(row); }}
        >仓库</Button>,
        <Button
          key="history" type="link" size="small" icon={<HistoryOutlined />}
          onClick={() => { setHistoryTpl(row); setHistoryOpen(true); loadHistory(row); }}
        >历史</Button>,
        <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setModalOpen(true); }}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <CountdownButton
          key="del" icon={<DeleteOutlined />}
          text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => {
            await api.deleteDeployTemplate(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}
        />
      ]
    }
  ];

  const historyColumns: ProColumns<DeployTemplateHistoryItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '修改人', dataIndex: 'modifier', width: 120 },
    { title: '版本', dataIndex: 'version', width: 100 },
    { title: '修改原因', dataIndex: 'change_reason', ellipsis: true },
    { title: '修改时间', dataIndex: 'created_at', valueType: 'dateTime', width: 170 },
  ];

  const linkedRepoColumns: ProColumns<DeployTemplateRepo>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '中文名称', dataIndex: 'c_name' },
    { title: '英文名称', dataIndex: 'e_name' },
    {
      title: '部署平台', dataIndex: 'platform', width: 90,
      render: (val) => val ? <Tag>{String(val).toUpperCase()}</Tag> : '-'
    },
    {
      title: '语言', dataIndex: 'repo_language', width: 100,
      valueType: 'select', valueEnum: languageEnum,
    },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 110,
      render: (_, row) => [
        <CountdownButton
          key="del" icon={<DeleteOutlined />} text="取消关联"
          onConfirm={async () => {
            if (!reposTpl) return;
            try {
              await api.disassociateDeployTemplateRepo(reposTpl.id, row.id);
              message.success('已取消关联');
              await loadLinkedRepos(reposTpl);
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
      <ProTable<DeployTemplate>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteDeployTemplate(id as number)));
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
            if (params.name) query.name = params.name;
            if (params.template_type) query.template_type = params.template_type;
            if (params.status) query.status = params.status;
            const res = await api.fetchDeployTemplates(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_templates_deployment', { defaultValue: '部署模板' })}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>
            {t('common.add', { defaultValue: '新增' })}
          </Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<DeployTemplate>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑部署模板' : '新增部署模板'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateDeployTemplate(editRecord.id, values as any);
            else await api.createDeployTemplate(values as any);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="name" label="模板名称" rules={[{ required: true }]} />
        <ProFormText name="display_name" label="显示名称" />
        <ProFormSelect
          name="template_type" label="模板类型"
          options={[
            { label: 'K8s YAML', value: 'k8s' },
            { label: 'Helm Chart', value: 'helm' },
            { label: 'Docker Compose', value: 'docker' },
          ]}
        />
        <ProFormText name="version" label="版本" placeholder="1.0" />
        <ProFormSelect
          name="status" label="状态"
          options={[{ label: '激活', value: 'active' }, { label: '停用', value: 'inactive' }]}
          initialValue="active"
        />
        <ProFormTextArea name="content" label="模板内容 (YAML/JSON)" fieldProps={{ rows: 10 }} />
        <ProFormText name="description" label="描述" />
      </ModalForm>

      {/* 历史抽屉 */}
      <Drawer
        title={`修改历史 — ${historyTpl?.name ?? ''}`}
        placement="right" width={900}
        open={historyOpen} onClose={() => setHistoryOpen(false)}
        destroyOnClose
      >
        <ProTable<DeployTemplateHistoryItem>
          rowKey="id" search={false} columns={historyColumns}
          dataSource={historyList} loading={historyLoading}
          pagination={{ pageSize: 20 }} options={false}
        />
      </Drawer>

      {/* 关联仓库抽屉 */}
      <Drawer
        title={`关联仓库 — ${reposTpl?.name ?? ''}`}
        placement="right" width={900}
        open={reposOpen} onClose={() => setReposOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssociateOpen(true)}>
              关联仓库
            </Button>
          </Space>
        }
      >
        <ProTable<DeployTemplateRepo>
          rowKey="id" search={false} columns={linkedRepoColumns}
          dataSource={linkedRepos} loading={linkedLoading}
          pagination={{ pageSize: 20 }} options={false}
          scroll={{ x: 'max-content' }}
        />
      </Drawer>

      {/* 选择仓库进行关联 */}
      <Modal
        title="选择关联仓库"
        open={associateOpen}
        onCancel={() => { setAssociateOpen(false); setAssociateRepoId(undefined); }}
        onOk={handleAssociate} okText="确认关联"
        destroyOnClose
      >
        <ProFormSelect
          label="仓库" name="repoId" options={allRepos}
          showSearch
          fieldProps={{
            optionFilterProp: 'label',
            value: associateRepoId,
            onChange: (v) => setAssociateRepoId(v as number),
          }}
        />
      </Modal>
    </>
  );
}
