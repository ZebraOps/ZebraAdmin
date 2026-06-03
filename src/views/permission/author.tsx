import { useRef, useState, useCallback, useEffect } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Drawer, Tabs, Transfer, Tree, Tag, Spin, Popconfirm, message } from 'antd';
import { SettingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import { isHandledError } from '@/service/request';
import * as roleApi from '@/service/api/rbac/role';
import * as menuApi from '@/service/api/rbac/menu';
import * as componentApi from '@/service/api/rbac/component';
import * as functionApi from '@/service/api/rbac/function';
import * as groupApi from '@/service/api/rbac/group';
import * as userApi from '@/service/api/rbac/user';
import type { Role, RoleForm } from '@/service/api/rbac/role';
import type { MenuItem } from '@/service/api/rbac/menu';
import type { Component } from '@/service/api/rbac/component';
import type { FunctionItem } from '@/service/api/rbac/function';
import type { Group } from '@/service/api/rbac/group';
import type { User } from '@/service/api/rbac/user';

function buildTreeData(tree: MenuItem[]): any[] {
  return tree.map(node => ({
    title: node.menu_name,
    key: node.menu_id,
    children: node.children?.length ? buildTreeData(node.children) : undefined,
  }));
}

export default function PermissionAuthor() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('menus');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    groupApi.fetchGroups({ size: 200 }).then((res: any) => {
      setGroups(res?.records ?? []);
    }).catch(() => {});
  }, []);

  const groupEnum = groups.reduce((acc, g) => {
    acc[g.group_id] = { text: g.group_name };
    return acc;
  }, {} as Record<number, { text: string }>);

  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [allComponents, setAllComponents] = useState<Component[]>([]);
  const [allFunctions, setAllFunctions] = useState<FunctionItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [assignedMenuIds, setAssignedMenuIds] = useState<number[]>([]);
  const [assignedComponentIds, setAssignedComponentIds] = useState<number[]>([]);
  const [assignedFunctionIds, setAssignedFunctionIds] = useState<number[]>([]);
  const [origMenuIds, setOrigMenuIds] = useState<number[]>([]);
  const [origComponentIds, setOrigComponentIds] = useState<number[]>([]);
  const [origFunctionIds, setOrigFunctionIds] = useState<number[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<number[]>([]);
  const [origUserIds, setOrigUserIds] = useState<number[]>([]);

  const loadAllResources = useCallback(async () => {
    const [menuRes, compRes, funcRes, userRes] = await Promise.all([
      menuApi.fetchMenuTree(),
      componentApi.fetchComponents({ size: 500 }),
      functionApi.fetchFunctions({ size: 500 }),
      userApi.fetchUsers({ size: 500 }),
    ]);
    setMenuTree(Array.isArray(menuRes) ? menuRes : []);
    setAllComponents((compRes as any)?.records ?? []);
    setAllFunctions((funcRes as any)?.records ?? []);
    setAllUsers((userRes as any)?.records ?? []);
  }, []);

  const loadRoleResources = useCallback(async (roleId: number) => {
    setLoading(true);
    try {
      const [menus, components, functions, users] = await Promise.all([
        roleApi.fetchRoleMenus(roleId),
        roleApi.fetchRoleComponents(roleId),
        roleApi.fetchRoleFunctions(roleId),
        roleApi.fetchRoleUsers(roleId),
      ]);
      const mIds = (Array.isArray(menus) ? menus : []).map((m: any) => m.menu_id);
      const cIds = (Array.isArray(components) ? components : []).map((c: any) => c.component_id);
      const fIds = (Array.isArray(functions) ? functions : []).map((f: any) => f.func_id);
      const uIds = (Array.isArray(users) ? users : []).map((u: any) => u.user_id);
      setAssignedMenuIds(mIds); setOrigMenuIds([...mIds]);
      setAssignedComponentIds(cIds); setOrigComponentIds([...cIds]);
      setAssignedFunctionIds(fIds); setOrigFunctionIds([...fIds]);
      setAssignedUserIds(uIds); setOrigUserIds([...uIds]);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  const openDrawer = async (role: Role) => {
    setCurrentRole(role);
    setDrawerOpen(true);
    setActiveTab('menus');
    await loadAllResources();
    await loadRoleResources(role.role_id);
  };

  const handleSave = async () => {
    if (!currentRole) return;
    setSaving(true);
    try {
      const roleId = currentRole.role_id;
      const menuToAdd = assignedMenuIds.filter(id => !origMenuIds.includes(id));
      const menuToRemove = origMenuIds.filter(id => !assignedMenuIds.includes(id));
      const compToAdd = assignedComponentIds.filter(id => !origComponentIds.includes(id));
      const compToRemove = origComponentIds.filter(id => !assignedComponentIds.includes(id));
      const funcToAdd = assignedFunctionIds.filter(id => !origFunctionIds.includes(id));
      const funcToRemove = origFunctionIds.filter(id => !assignedFunctionIds.includes(id));
      const userToAdd = assignedUserIds.filter(id => !origUserIds.includes(id));
      const userToRemove = origUserIds.filter(id => !assignedUserIds.includes(id));

      const promises: Promise<any>[] = [];
      if (menuToAdd.length) promises.push(roleApi.addRoleMenus(roleId, menuToAdd));
      if (menuToRemove.length) promises.push(roleApi.removeRoleMenus(roleId, menuToRemove));
      if (compToAdd.length) promises.push(roleApi.addRoleComponents(roleId, compToAdd));
      if (compToRemove.length) promises.push(roleApi.removeRoleComponents(roleId, compToRemove));
      if (funcToAdd.length) promises.push(roleApi.addRoleFunctions(roleId, funcToAdd));
      if (funcToRemove.length) promises.push(roleApi.removeRoleFunctions(roleId, funcToRemove));
      if (userToAdd.length) promises.push(roleApi.addRoleUsers(roleId, userToAdd));
      if (userToRemove.length) promises.push(roleApi.removeRoleUsers(roleId, userToRemove));
      await Promise.all(promises);
      message.success('保存成功');
      setDrawerOpen(false);
    } catch {
      message.error('保存失败');
    }
    setSaving(false);
  };

  const columns: ProColumns<Role>[] = [
    { title: '角色名称', dataIndex: 'role_name' },
    {
      title: '分组', dataIndex: 'group_id', valueType: 'select', valueEnum: groupEnum,
      render: (_, row) => row.group ? <Tag>{row.group}</Tag> : '-'
    },
    {
      title: '状态', dataIndex: 'status', valueType: 'select',
      valueEnum: { '0': { text: '启用', status: 'Success' }, '1': { text: '禁用', status: 'Error' } },
    },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 180,
      render: (_, row) => [
        hasComp('permission_role_edit') && <Button key="config" type="link" size="small" icon={<SettingOutlined />} onClick={() => openDrawer(row)}>配置权限</Button>,
        hasComp('permission_role_delete') && <Popconfirm key="del" title="确认删除该角色？" onConfirm={async () => { await roleApi.deleteRole(row.role_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Role>
        rowKey="role_id" actionRef={actionRef} columns={columns}
        rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
        tableAlertOptionRender={() => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 个角色？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => roleApi.deleteRole(id as number)));
                message.success(`已删除 ${selectedRowKeys.length} 个`);
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
            if (params.role_name) query.name = params.role_name;
            if (params.group_id !== undefined && params.group_id !== '') query.group_id = params.group_id;
            if (params.status !== undefined && params.status !== '') query.status = params.status;
            const res = await roleApi.fetchRoles(query);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="角色授权" search={{ labelWidth: 80 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setRoleModalOpen(true)}>新增角色</Button>
        ]}
        scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <Drawer
        title={`配置权限 - ${currentRole?.role_name ?? ''}`}
        open={drawerOpen} onClose={() => setDrawerOpen(false)} width="min(640px, 90vw)"
        extra={<Button type="primary" loading={saving} onClick={handleSave}>保存</Button>}
      >
        <Spin spinning={loading}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
            {
              key: 'menus', label: '菜单权限',
              children: (
                <Tree
                  checkable treeData={buildTreeData(menuTree)}
                  checkedKeys={assignedMenuIds}
                  onCheck={(checked) => setAssignedMenuIds((Array.isArray(checked) ? checked : checked.checked) as number[])}
                  defaultExpandAll
                  style={{ maxHeight: 500, overflow: 'auto' }}
                />
              ),
            },
            {
              key: 'components', label: '组件权限',
              children: (
                <Transfer
                  dataSource={allComponents.map(c => ({ key: String(c.component_id), title: c.component_name }))}
                  targetKeys={assignedComponentIds.map(String)}
                  onChange={(nextKeys) => setAssignedComponentIds(nextKeys.map(Number))}
                  render={item => item.title || ''}
                  titles={['可选组件', '已授权']}
                  listStyle={{ width: 260, height: 400 }}
                  showSearch
                />
              ),
            },
            {
              key: 'functions', label: '功能权限',
              children: (
                <Transfer
                  dataSource={allFunctions.map(f => ({ key: String(f.func_id), title: `${f.func_name} [${f.method_type ?? ''}] ${f.uri ?? ''}` }))}
                  targetKeys={assignedFunctionIds.map(String)}
                  onChange={(nextKeys) => setAssignedFunctionIds(nextKeys.map(Number))}
                  render={item => item.title || ''}
                  titles={['可选功能', '已授权']}
                  listStyle={{ width: 260, height: 400 }}
                  showSearch
                />
              ),
            },
            {
              key: 'users', label: '用户分配',
              children: (
                <Transfer
                  dataSource={allUsers.map(u => ({ key: String(u.user_id), title: `${u.nickname ?? u.username} (${u.username})` }))}
                  targetKeys={assignedUserIds.map(String)}
                  onChange={(nextKeys) => setAssignedUserIds(nextKeys.map(Number))}
                  render={item => item.title || ''}
                  titles={['可选用户', '已分配']}
                  listStyle={{ width: 260, height: 400 }}
                  showSearch
                />
              ),
            },
          ]} />
        </Spin>
      </Drawer>
      <ModalForm<RoleForm>
        title="新增角色"
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        initialValues={{ status: '0' }}
        modalProps={{ onCancel: () => setRoleModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            await roleApi.createRole(values);
            message.success('创建成功');
            actionRef.current?.reload();
            return true;
          } catch (e: any) {
            if (!isHandledError(e)) message.error('创建失败');
            return false;
          }
        }}
      >
        <ProFormText name="role_name" label="角色名称" rules={[{ required: true, message: '请输入角色名称' }]} />
        <ProFormSelect
          name="group_id" label="分组" rules={[{ required: true, message: '请选择分组' }]}
          options={groups.map(g => ({ label: g.group_name, value: g.group_id }))}
        />
        <ProFormText name="role_desc" label="描述" />
        <ProFormSelect
          name="status" label="状态"
          options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]}
        />
      </ModalForm>
    </>
  );
}