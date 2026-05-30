import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormTextArea, ProFormSelect,
  ProFormTreeSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, message, Drawer, Tag, Popconfirm } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/publish/build-template';
import type { BuildTemplate } from '@/service/api/publish/build-template';
import { fetchLanguages } from '@/service/api/publish/language';
import { fetchOrgTree } from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';

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
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<BuildTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);

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

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  // 历史抽屉
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTpl, setHistoryTpl] = useState<BuildTemplate | null>(null);
  const [historyList, setHistoryList] = useState<TemplateHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async (tpl: BuildTemplate) => {
    setHistoryLoading(true);
    try {
      const res = await api.fetchBuildTemplateHistory(tpl.id);
      // 后端返回的是 {total, records} 分页
      const records = (res as any)?.records ?? (Array.isArray(res) ? res : []);
      setHistoryList(records);
    } catch (e: any) {
      if (!isHandledError(e)) message.error(e?.message || '获取历史失败');
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns: ProColumns<BuildTemplate>[] = [
    { title: '模板名称', dataIndex: 'name' },
    {
      title: '语言', dataIndex: 'language', width: 100,
      valueType: 'select', valueEnum: languageEnum,
    },
    {
      title: '归属部门', dataIndex: 'department', width: 140,
      search: {
        transform: (val) => val,
      },
      render: (_, row) => row.department || '-',
      renderFormItem: () => (
        <ProFormTreeSelect
          name="department"
          fieldProps={{
            treeData: toDeptTreeSelectData(orgTreeData),
            allowClear: true, placeholder: '请选择部门',
            treeDefaultExpandAll: true,
            showSearch: true,
            treeNodeFilterProp: 'title',
          }}
        />
      ),
    },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '修改人', dataIndex: 'updater', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 220,
      render: (_, row) => [
        <Button
          key="history" type="link" size="small" icon={<HistoryOutlined />}
          onClick={() => { setHistoryTpl(row); setHistoryOpen(true); loadHistory(row); }}
        >历史</Button>,
        hasComp('publish_build_template_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setModalOpen(true); }}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_build_template_delete') && <CountdownButton
          key="del" icon={<DeleteOutlined />}
          text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => {
            await api.deleteBuildTemplate(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}
        />
      ].filter(Boolean)
    }
  ];

  const historyColumns: ProColumns<TemplateHistory>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '修改人', dataIndex: 'modifier', width: 120 },
    { title: '修改时间', dataIndex: 'created_at', valueType: 'dateTime', width: 170 },
    {
      title: 'Dockerfile', dataIndex: 'dockerfile', ellipsis: true,
      render: (val) => val ? <Tag color="blue">已变更</Tag> : <Tag>无</Tag>,
    },
    {
      title: 'Pipeline', dataIndex: 'pipeline', ellipsis: true,
      render: (val) => val ? <Tag color="purple">已变更</Tag> : <Tag>无</Tag>,
    },
  ];

  return (
    <>
      <ProTable<BuildTemplate>
        rowKey="id" actionRef={actionRef} columns={columns}
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
            if (params.name) query.name = params.name;
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
          hasComp('publish_build_template_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>
            {t('common.add', { defaultValue: '新增' })}
          </Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<BuildTemplate>>
        key={editRecord?.id ?? 'new'}
        title={editRecord ? '编辑构建模板' : '新增构建模板'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ?? {}}
        onFinish={async (values) => {
          try {
            if (editRecord?.id) await api.updateBuildTemplate(editRecord.id, values as any);
            else await api.createBuildTemplate(values as any);
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
        <ProFormSelect
          name="language" label="开发语言" rules={[{ required: true }]} placeholder="请选择开发语言"
          options={languageOptions} showSearch fieldProps={{ optionFilterProp: 'label' }}
        />
        <ProFormTreeSelect
          name="department" label="归属部门" placeholder="请选择部门"
          fieldProps={{
            treeData: toDeptTreeSelectData(orgTreeData),
            allowClear: true,
            treeDefaultExpandAll: true,
            showSearch: true,
            treeNodeFilterProp: 'title',
          }}
        />
        <ProFormTextArea name="dockerfile" label="Dockerfile" fieldProps={{ rows: 8, placeholder: 'FROM golang:1.25-alpine\nWORKDIR /app\nCOPY . .\nRUN go build -o main .\nCMD ["/app/main"]' }} />
        <ProFormTextArea name="pipeline" label="Pipeline (Jenkinsfile)" fieldProps={{ rows: 8, placeholder: 'pipeline {\n  agent any\n  stages {\n    stage("Build") { steps { sh "make build" } }\n  }\n}' }} />
      </ModalForm>

      <Drawer
        title={`修改历史 — ${historyTpl?.name ?? ''}`}
        placement="right" width={900}
        open={historyOpen} onClose={() => setHistoryOpen(false)}
        destroyOnClose
      >
        <ProTable<TemplateHistory>
          rowKey="id" search={false} columns={historyColumns}
          dataSource={historyList} loading={historyLoading}
          pagination={{ pageSize: 20 }} options={false}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Dockerfile</div>
                  <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 280, overflow: 'auto' }}>
                    {record.dockerfile || '(无)'}
                  </pre>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Pipeline</div>
                  <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 280, overflow: 'auto' }}>
                    {record.pipeline || '(无)'}
                  </pre>
                </div>
              </div>
            ),
          }}
        />
      </Drawer>
    </>
  );
}
