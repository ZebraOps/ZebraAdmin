import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect,
  ProFormTreeSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, message, Drawer, Tag, Popconfirm, Tabs } from 'antd';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined,
  AppstoreOutlined, LinkOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/build-template';
import type { BuildTemplate, LinkedApplication } from '@/service/api/publish/build-template';
import { fetchApplications } from '@/service/api/publish/applications';
import { fetchLanguages } from '@/service/api/publish/language';
import { fetchOrgTree } from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';
import CodeEditor from '@/components/CodeEditor';

interface TemplateHistory {
  id: number;
  template_id: number;
  modifier?: string;
  dockerfile?: string;
  pipeline?: string;
  created_at?: string;
}

export default function PublishTemplatesBuild() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<any>(null);
  const [editRecord, setEditRecord] = useState<BuildTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);

  // Monaco 编辑器的值（ProForm 不直接支持 Monaco，需要手动管理）
  const [dockerfileValue, setDockerfileValue] = useState('');
  const [pipelineValue, setPipelineValue] = useState('');

  // URL 参数中的模板名称（用于预填搜索）
  const urlTemplateName = searchParams.get('name');

  function toDeptTreeSelectData(nodes: OrgNode[]): any[] {
    return nodes.map(n => ({
      title: n.org_name, value: n.org_name,
      children: n.children?.length ? toDeptTreeSelectData(n.children) : undefined,
    }));
  }

  useEffect(() => {
    fetchLanguages({ size: 200 }).then((res) => {
      setLanguageOptions(((res as any)?.records ?? []).map((e: any) => ({
        label: e.display_name || e.name,
        value: e.name,
      })));
    }).catch(() => {});
    fetchOrgTree().then((res) => {
      setOrgTreeData((res as any) ?? []);
    }).catch(() => {});
  }, []);

  // 处理 URL 参数：仅用于初始化搜索表单，不直接参与 request 兜底。
  useEffect(() => {
    if (!formRef.current?.setFieldsValue) return;

    formRef.current.setFieldsValue({ name: urlTemplateName || undefined });
    if (urlTemplateName) {
      actionRef.current?.reload();
    }
  }, [urlTemplateName]);

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  // 历史抽屉
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTpl, setHistoryTpl] = useState<BuildTemplate | null>(null);
  const [historyList, setHistoryList] = useState<TemplateHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // 关联应用 Drawer
  const [appsOpen, setAppsOpen] = useState(false);
  const [appsTpl, setAppsTpl] = useState<BuildTemplate | null>(null);
  const [linkedApps, setLinkedApps] = useState<LinkedApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [associateOpen, setAssociateOpen] = useState(false);
  const [associateAppId, setAssociateAppId] = useState<number | undefined>(undefined);
  const [allApps, setAllApps] = useState<{ label: string; value: number }[]>([]);

  const loadHistory = async (tpl: BuildTemplate) => {
    setHistoryLoading(true);
    try {
      const res = await api.fetchBuildTemplateHistory(tpl.id);
      const records = (res as any)?.records ?? (Array.isArray(res) ? res : []);
      setHistoryList(records);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取历史失败');
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadLinkedApps = async (tpl: BuildTemplate) => {
    setAppsLoading(true);
    try {
      const res = await api.fetchBuildTemplateApplications(tpl.id);
      setLinkedApps((res as any) ?? []);
    } catch (e: any) {
      if (!isHandledError(e)) message.error('获取关联应用失败');
      setLinkedApps([]);
    } finally {
      setAppsLoading(false);
    }
  };

  // 打开编辑时，加载 Monaco 值
  const handleOpenModal = (record: BuildTemplate | null) => {
    setEditRecord(record);
    setDockerfileValue(record?.dockerfile ?? '');
    setPipelineValue(record?.pipeline ?? '');
    setModalOpen(true);
  };

  const columns: ProColumns<BuildTemplate>[] = [
    { title: '模板名称', dataIndex: 'name', ellipsis: true },
    {
      title: '语言', dataIndex: 'language', width: 100,
      valueType: 'select', valueEnum: languageEnum,
    },
    {
      title: '归属部门', dataIndex: 'department', width: 120,
      search: { transform: (val) => val },
      render: (_, row) => row.department || '-',
      renderFormItem: () => (
        <ProFormTreeSelect
          name="department"
          fieldProps={{
            treeData: toDeptTreeSelectData(orgTreeData),
            allowClear: true, placeholder: '请选择部门',
            treeDefaultExpandAll: true, showSearch: true, treeNodeFilterProp: 'title',
          }}
        />
      ),
    },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '修改人', dataIndex: 'updater', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 150, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 200,
      render: (_, row) => [
        <Button key="apps" type="link" size="small" icon={<AppstoreOutlined />}
          onClick={() => { setAppsTpl(row); setAppsOpen(true); loadLinkedApps(row); }}>
          应用
        </Button>,
        <Button key="history" type="link" size="small" icon={<HistoryOutlined />}
          onClick={() => { setHistoryTpl(row); setHistoryOpen(true); loadHistory(row); }}>
          历史
        </Button>,
        hasComp('publish_build_template_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => handleOpenModal(row)}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_build_template_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => {
            await api.deleteBuildTemplate(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  const historyColumns: ProColumns<TemplateHistory>[] = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '修改人', dataIndex: 'modifier', width: 100 },
    { title: '修改时间', dataIndex: 'created_at', valueType: 'dateTime', width: 150 },
    {
      title: 'Dockerfile', dataIndex: 'dockerfile', width: 80,
      render: (val) => val ? <Tag color="blue">已变更</Tag> : <Tag>无</Tag>,
    },
    {
      title: 'Pipeline', dataIndex: 'pipeline', width: 80,
      render: (val) => val ? <Tag color="purple">已变更</Tag> : <Tag>无</Tag>,
    },
    {
      title: '操作', key: 'actions', valueType: 'option', width: 80,
      render: (_, row) => [
        <Popconfirm key="rollback" title={`确认回退到历史版本 #${row.id}？当前内容将被替换。`}
          onConfirm={async () => {
            try {
              await api.rollbackBuildTemplate(historyTpl!.id, row.id);
              message.success('回退成功');
              loadHistory(historyTpl!);
              actionRef.current?.reload();
            } catch (e: any) { if (!isHandledError(e)) message.error(e?.message || '回退失败'); }
          }}>
          <Button type="link" size="small" icon={<UndoOutlined />}>回退</Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<BuildTemplate>
        rowKey="id" actionRef={actionRef} formRef={formRef} columns={columns}
        rowSelection={hasComp('publish_build_template_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_build_template_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteBuildTemplate(id as number)));
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
            const query: Record<string, unknown> = {
              current: ((params.current ?? 1) - 1) * (params.pageSize ?? 20),
              size: params.pageSize ?? 20,
            };
            const searchName = params.name;
            if (searchName) query.name = searchName;
            if (params.language) query.language = params.language;
            if (params.department) query.department = params.department;
            if (params.creator) query.creator = params.creator;
            if (params.updater) query.updater = params.updater;
            const res = await api.fetchBuildTemplates(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.publish_templates_build', { defaultValue: '构建模板' })}
        toolBarRender={() => [
          hasComp('publish_build_template_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal(null)}>
            {t('common.add', { defaultValue: '新增' })}
          </Button>
        ]}
        search={{
          labelWidth: 80,
          onReset: () => {
            formRef.current?.setFieldsValue({ name: undefined });
            // 重置时清除 URL 参数，避免继续使用外部跳转条件。
            if (urlTemplateName) {
              navigate(location.pathname, { replace: true });
            }
          },
        }}
        scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<BuildTemplate>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑构建模板' : '新增构建模板'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '', destroyOnClose: true }}
        initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            // 把 Monaco 编辑器的值合并到表单数据中
            const submitData = { ...values, dockerfile: dockerfileValue, pipeline: pipelineValue };
            if (editRecord?.id) await api.updateBuildTemplate(editRecord.id, submitData as any);
            else await api.createBuildTemplate(submitData as any);
            message.success('保存成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('保存失败');
            return false;
          }
        }}
      >
        <ProFormText name="name" label="模板名称" rules={[{ required: true }]} placeholder="请输入模板名称" />
        <ProFormSelect name="language" label="开发语言" rules={[{ required: true }]} placeholder="请选择开发语言"
          options={languageOptions} showSearch fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormTreeSelect name="department" label="归属部门" placeholder="请选择部门"
          fieldProps={{ treeData: toDeptTreeSelectData(orgTreeData), allowClear: true, treeDefaultExpandAll: true, showSearch: true, treeNodeFilterProp: 'title' }} />
        <CodeEditor
          value={dockerfileValue}
          onChange={setDockerfileValue}
          language="dockerfile"
          height="280px"
          showToolbar
          placeholder={`FROM golang:1.25-alpine\nWORKDIR /app\nCOPY . .\nRUN go build -o main .\nCMD ["./main"]`}
        />
        <CodeEditor
          value={pipelineValue}
          onChange={setPipelineValue}
          language="groovy"
          height="280px"
          showToolbar
          placeholder={`pipeline {\n  agent any\n  stages {\n    stage('Build') {\n      steps {\n        sh 'make build'\n      }\n    }\n  }\n}`}
        />
      </ModalForm>

      <Drawer
        title={`修改历史 — ${historyTpl?.name ?? ''}`}
        placement="right" width="min(900px, 95vw)"
        open={historyOpen} onClose={() => setHistoryOpen(false)} destroyOnClose
      >
        <ProTable<TemplateHistory>
          rowKey="id" search={false} columns={historyColumns}
          dataSource={historyList} loading={historyLoading}
          pagination={{ pageSize: 20 }} options={false}
          expandable={{
            expandedRowRender: (record) => (
              <Tabs
                items={[
                  {
                    key: 'dockerfile',
                    label: 'Dockerfile',
                    children: <CodeEditor value={record.dockerfile || ''} readOnly language="dockerfile" height="300px" showToolbar />,
                  },
                  {
                    key: 'pipeline',
                    label: 'Pipeline',
                    children: <CodeEditor value={record.pipeline || ''} readOnly language="groovy" height="300px" showToolbar />,
                  },
                ]}
              />
            ),
          }}
        />
      </Drawer>

      {/* 关联应用 Drawer */}
      <Drawer
        title={`关联应用 — ${appsTpl?.name ?? ''}`}
        placement="right" width="min(900px, 95vw)"
        open={appsOpen} onClose={() => setAppsOpen(false)} destroyOnClose
        extra={<Button type="primary" size="small" icon={<LinkOutlined />} onClick={() => {
          fetchApplications({ size: 200 }).then((res) => {
            setAllApps((((res as any)?.records) ?? []).map((e: any) => ({ label: `${e.c_name} (${e.e_name})`, value: e.id })));
            setAssociateOpen(true);
          });
        }}>新增关联</Button>}
      >
        <ProTable
          rowKey="id" search={false} columns={[
            { title: 'ID', dataIndex: 'id', width: 70 },
            { title: '中文名称', dataIndex: 'c_name' },
            { title: '英文名称', dataIndex: 'e_name' },
            { title: '部门', dataIndex: 'department', width: 120 },
            { title: '语言', dataIndex: 'language', width: 100 },
            { title: '监听端口', dataIndex: 'listen_port', width: 90 },
            { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160 },
            { title: '操作', key: 'actions', valueType: 'option', width: 100, render: (_, row) => [
              <Popconfirm key="dis" title="确认取消关联？" onConfirm={async () => {
                try {
                  await api.disassociateBuildTemplateApp(appsTpl!.id, row.id);
                  message.success('已取消关联');
                  loadLinkedApps(appsTpl!);
                } catch (e: any) { if (!isHandledError(e)) message.error('取消关联失败'); }
              }}>
                <Button type="link" size="small" danger>取消关联</Button>
              </Popconfirm>
            ]}
          ]}
          dataSource={linkedApps} loading={appsLoading}
          pagination={false} options={false}
        />
      </Drawer>

      <ModalForm
        title="新增应用关联"
        open={associateOpen} onOpenChange={setAssociateOpen}
        onFinish={async () => {
          if (!associateAppId) { message.warning('请选择应用'); return false; }
          try {
            await api.associateBuildTemplateApp(appsTpl!.id, associateAppId);
            message.success('关联成功');
            loadLinkedApps(appsTpl!);
            return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('关联失败'); return false; }
        }}
      >
        <ProFormSelect name="application_id" label="应用" rules={[{ required: true }]} options={allApps} showSearch
          fieldProps={{ optionFilterProp: 'label', onChange: (val: number) => setAssociateAppId(val) }}
          placeholder="请选择要关联的应用" />
      </ModalForm>
    </>
  );
}