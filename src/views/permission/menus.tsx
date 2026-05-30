import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTreeSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { usePermission } from '@/hooks/usePermission';
import * as api from '@/service/api/rbac/menu';
import type { MenuItem, MenuForm, SyncMenuItem } from '@/service/api/rbac/menu';
import { staticMenus } from '@/router/menus';
import type { MenuNode } from '@/store/route';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

function buildTreeSelectData(tree: MenuItem[]): any[] {
  return tree.map(node => ({
    title: node.menu_name,
    value: node.menu_id,
    children: node.children?.length ? buildTreeSelectData(node.children) : undefined,
  }));
}

export default function PermissionMenus() {
  const { t } = useTranslation();
  const { hasComp } = usePermission();
  const actionRef = useRef<ActionType>(null);
  const [treeData, setTreeData] = useState<MenuItem[]>([]);
  const [editRecord, setEditRecord] = useState<MenuItem | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleSync = async () => {
    const items: SyncMenuItem[] = [];
    function flatten(menus: MenuNode[], parentKey?: string) {
      menus.forEach((menu, idx) => {
        items.push({
          menu_key: menu.key,
          menu_name: t(menu.label, { defaultValue: menu.key }),
          path: menu.path,
          icon: menu.icon,
          order_num: menu.order ?? idx,
          parent_key: parentKey,
        });
        if (menu.children?.length) flatten(menu.children, menu.key);
      });
    }
    flatten(staticMenus);
    setSyncLoading(true);
    try {
      const res = await api.syncMenus(items);
      message.success(`同步成功：新增 ${res.created} 项，更新 ${res.updated} 项`);
      actionRef.current?.reload();
    } catch (e: any) {
      if (!isHandledError(e)) message.error('同步失败');
    } finally {
      setSyncLoading(false);
    }
  };

  const columns: ProColumns<MenuItem>[] = [
    { title: '菜单名称', dataIndex: 'menu_name' },
    { title: '路径', dataIndex: 'path', render: (val) => val ? <Tag>{String(val)}</Tag> : '-' },
    { title: '图标', dataIndex: 'icon', search: false },
    { title: '排序', dataIndex: 'order_num', search: false },
    {
      title: '状态', dataIndex: 'status', valueType: 'select',
      valueEnum: { '0': { text: '启用', status: 'Success' }, '1': { text: '禁用', status: 'Error' } },
      render: (_, row) => { const s = STATUS_MAP[String(row.status)]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; }
    },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 200,
      render: (_, row) => [
        <Button key="addChild" type="link" size="small" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDefaultParentId(row.menu_id); setModalOpen(true); }}>子菜单</Button>,
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setDefaultParentId(undefined); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        hasComp('permission_menu_delete') && hasComp('permission_menu_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteMenu(row.menu_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<MenuItem>
        rowKey="menu_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('permission_menu_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('permission_menu_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                // 按深度排序，子节点先于父节点删除，避免「存在子菜单不能删除」400 错误
                const depthMap = new Map<number, number>();
                const calcDepth = (nodes: MenuItem[], depth: number) => {
                  nodes.forEach(n => {
                    depthMap.set(n.menu_id, depth);
                    if (n.children?.length) calcDepth(n.children, depth + 1);
                  });
                };
                calcDepth(treeData, 0);
                const sorted = [...selectedRowKeys].sort(
                  (a, b) => (depthMap.get(b as number) ?? 0) - (depthMap.get(a as number) ?? 0)
                );
                for (const id of sorted) {
                  await api.deleteMenu(id as number);
                }
                message.success(`已删除 ${selectedRowKeys.length} 条`);
                setSelectedRowKeys([]);
                actionRef.current?.reload();
              } catch (e: any) { if (!isHandledError(e)) message.error('批量删除失败'); }
            }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>批量删除 ({selectedRowKeys.length})</Button>
          </Popconfirm>
        ) : undefined}

        childrenColumnName="children"
        request={async (params) => {
          try {
            const query: Record<string, unknown> = {};
            if (params.menu_name) query.name = params.menu_name;
            if (params.path) query.path = params.path;
            if (params.status !== undefined && params.status !== '') query.status = params.status;
            const res = await api.fetchMenuTree(query);
            const tree = Array.isArray(res) ? res : [];
            setTreeData(tree);
            return { data: tree, success: true, total: tree.length };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.permission_menus', { defaultValue: '菜单管理' })}
        toolBarRender={() => [
          hasComp('permission_menu_sync') && <Button key="sync" icon={<SyncOutlined />} loading={syncLoading} onClick={handleSync}>同步菜单</Button>,
          hasComp('permission_menu_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDefaultParentId(undefined); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增菜单' })}</Button>
        ]}
        search={{ labelWidth: 80 }} pagination={false} scroll={{ x: 'max-content' }}
      />
      <ModalForm<MenuForm>
        key={editRecord?.menu_id ?? 'new'}
        title={editRecord ? t('common.edit', { defaultValue: '编辑菜单' }) : t('common.add', { defaultValue: '新增菜单' })}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { menu_name: editRecord.menu_name, parent_id: editRecord.parent_id, path: editRecord.path, icon: editRecord.icon, order_num: editRecord.order_num, status: editRecord.status ?? '0' } : { parent_id: defaultParentId, status: '0', order_num: 0 }}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            if (editRecord?.menu_id) await api.updateMenu(editRecord.menu_id, values); else await api.createMenu(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <ProFormText name="menu_name" label="菜单名称" rules={[{ required: true }]} />
        <ProFormTreeSelect name="parent_id" label="父菜单" allowClear
          fieldProps={{
            treeData: buildTreeSelectData(treeData),
            allowClear: true,
            placeholder: '选择父菜单',
            treeDefaultExpandAll: true,
          }}
        />
        <ProFormText name="path" label="路径" />
        <ProFormText name="icon" label="图标" />
        <ProFormDigit name="order_num" label="排序" min={0} />
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
      </ModalForm>
    </>
  );
}