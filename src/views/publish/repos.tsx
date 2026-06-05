import { useEffect, useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTreeSelect, ProFormDependency,
  type ActionType, type ProColumns, type ProFormInstance
} from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import { isHandledError } from '@/service/request';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/publish/repos';
import type { Repo } from '@/service/api/publish/repos';
import { fetchLanguages } from '@/service/api/publish/language';
import { fetchOrgTree } from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';
import { usePermission } from '@/hooks/usePermission';
import { fetchGitPlatforms, fetchGitPlatformProjects } from '@/service/api/publish/git-repo';

export default function PublishRepos() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance<any>>(null);
  const [editRecord, setEditRecord] = useState<Repo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);
  const [gitPlatformOptions, setGitPlatformOptions] = useState<{ label: string; value: number }[]>([]);
  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string; project: any }[]>([]);
  const [fetchingProjects, setFetchingProjects] = useState(false);

  function toDeptTreeSelectData(nodes: OrgNode[]): any[] {
    return nodes.map(n => ({
      title: n.org_name,
      value: n.org_name,
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
      const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setOrgTreeData(data);
    }).catch(() => {});
    // 获取Git平台列表
    fetchGitPlatforms({ size: 100 }).then((res) => {
      setGitPlatformOptions(((res as any)?.records ?? []).map((e: any) => ({
        label: e.display_name || e.name,
        value: e.id,
      })));
    }).catch(() => {});
  }, []);

  // 从Git平台加载项目列表
  const loadProjects = async (platformId: number, search?: string) => {
    if (!platformId) { setProjectOptions([]); return; }
    setFetchingProjects(true);
    try {
      const params: Record<string, unknown> = { size: 10 };
      if (search) params.search = search;
      const res = await fetchGitPlatformProjects(platformId, params);
      const data = (res as any)?.data ?? res ?? [];
      const list = Array.isArray(data) ? data : [];
      setProjectOptions(list.map((p: any) => ({
        label: p.path_with_namespace || p.full_name || p.name,
        value: p.path_with_namespace || p.full_name || p.name,
        project: p,
      })));
    } catch { setProjectOptions([]); }
    finally { setFetchingProjects(false); }
  };

  const languageEnum = languageOptions.reduce((acc, o) => {
    acc[o.value] = { text: o.label };
    return acc;
  }, {} as Record<string, { text: string }>);

  const columns: ProColumns<Repo>[] = [
    { title: '中文名称', dataIndex: 'c_name', ellipsis: true },
    { title: '英文名称', dataIndex: 'e_name', ellipsis: true },
    { title: '仓库地址', dataIndex: 'repo_url', ellipsis: true, search: false },
    {
      title: '开发语言', dataIndex: 'repo_language', width: 100,
      valueType: 'select', valueEnum: languageEnum,
    },
    { title: '负责人', dataIndex: 'repo_manager', width: 100 },
    {
      title: '归属部门', dataIndex: 'repo_department', width: 120,
      search: { transform: (val) => val },
      render: (_, row) => row.repo_department || '-',
      renderFormItem: () => (
        <ProFormTreeSelect
          name="repo_department"
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
    { title: '描述', dataIndex: 'repo_desc', ellipsis: true, search: false },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime', width: 160, search: false },
    {
      title: t('common.actions', { defaultValue: '操作' }),
      key: 'actions', valueType: 'option', fixed: 'right', width: 160,
      render: (_, row) => [
        hasComp('publish_repo_edit') && <Button
          key="edit" type="link" size="small" icon={<EditOutlined />}
          onClick={() => { setEditRecord(row); setModalOpen(true); }}
        >{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('publish_repo_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => {
            await api.deleteRepo(row.id);
            message.success('删除成功');
            actionRef.current?.reload();
          }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Repo>
        rowKey="id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('publish_repo_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('publish_repo_delete') ? () => (
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
        ) : undefined}
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
          hasComp('publish_repo_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); setProjectOptions([]); }}>
            {t('common.add', { defaultValue: '新增仓库' })}
          </Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />

      <ModalForm<Partial<Repo>>
        formRef={formRef}
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
        {/* 编辑模式不显示Git平台选择 */}
        {!editRecord && (
          <ProFormSelect
            name="git_platform_id"
            label="Git平台"
            placeholder="选择Git平台后可自动导入仓库信息"
            options={gitPlatformOptions}
            showSearch
            fieldProps={{
              optionFilterProp: 'label',
              onChange: (val: number) => { loadProjects(val); },
              allowClear: true,
              onClear: () => { setProjectOptions([]); },
            }}
          />
        )}
        <ProFormDependency name={['git_platform_id']}>
          {({ git_platform_id }) => {
            // 新增模式且选择了Git平台时，英文名称变为可搜索的下拉框
            if (!editRecord && git_platform_id) {
              return (
                <ProFormSelect
                  name="e_name"
                  label="英文名称"
                  rules={[{ required: true }]}
                  placeholder="选择仓库自动导入信息，或输入搜索"
                  options={projectOptions}
                  showSearch
                  fieldProps={{
                    loading: fetchingProjects,
                    optionFilterProp: 'label',
                    filterOption: false,
                    onSearch: (val: string) => { loadProjects(git_platform_id as number, val); },
                    onChange: (val: string) => {
                    const proj = projectOptions.find(o => o.value === val)?.project;
                    if (proj && formRef.current) {
                      formRef.current.setFieldsValue({
                        e_name: proj.name,
                        repo_url: proj.http_url_to_repo || proj.html_url || '',
                        repo_ssh_url: proj.ssh_url_to_repo || proj.ssh_url || '',
                        repo_desc: proj.description || proj.desc || '',
                      });
                    }
                  },
                    allowClear: true,
                  }}
                />
              );
            }
            // 编辑模式或未选择Git平台：保持普通输入框
            return <ProFormText name="e_name" label="英文名称" rules={[{ required: true }]} placeholder="请输入英文名称" />;
          }}
        </ProFormDependency>
        <ProFormText name="c_name" label="中文名称" rules={[{ required: true }]} placeholder="请输入中文名称" />
        <ProFormText name="repo_url" label="仓库HTTP地址" placeholder="https://github.com/org/repo.git" />
        <ProFormText name="repo_ssh_url" label="仓库SSH地址" placeholder="git@github.com:org/repo.git" />
        <ProFormSelect name="repo_language" label="开发语言" options={languageOptions} showSearch placeholder="请选择开发语言" fieldProps={{ optionFilterProp: 'label' }} />
        <ProFormText name="repo_manager" label="负责人" placeholder="请输入负责人" />
        <ProFormTreeSelect
          name="repo_department" label="归属部门"
          fieldProps={{
            treeData: toDeptTreeSelectData(orgTreeData),
            allowClear: true,
            placeholder: '请选择部门',
            treeDefaultExpandAll: true,
            showSearch: true,
            treeNodeFilterProp: 'title',
          }}
        />
        <ProFormText name="repo_desc" label="描述" placeholder="请输入描述" />
      </ModalForm>
    </>
  );
}