import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTreeSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as api from '@/service/api/rbac/menu';
import type { MenuItem, MenuForm } from '@/service/api/rbac/menu';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'success' },
  '1': { label: '禁用', color: 'error' },
};

function buildTreeSelectData(tree: MenuItem[]): any[] {
  return tree.map(node => ({
    title: (node as any).menu_name,
    value: (node as any).menu_id,
    children: node.children?.length ? buildTreeSelectData(node.children) : undefined,
  }));
}

export default function PermissionMenus() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [treeData, setTreeData] = useState<MenuItem[]>([]);
  const [editRecord, setEditRecord] = useState<MenuItem | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const columns: ProColumns<MenuItem>[] = [
    { title: '菜单名称', dataIndex: 'menu_name' },
    { title: '路径', dataIndex: 'path', render: (val) => val ? <Tag>{String(val)}</Tag> : '-' },
    { title: '图标', dataIndex: 'icon' },
    { title: '排序', dataIndex: 'order_num' },
    { title: '状态', dataIndex: 'status', render: (_, row) => { const s = STATUS_MAP[String((row as any).status)]; return s ? <Tag color={s.color}>{s.label}</Tag> : '-'; } },
    { title: t('common.actions', { defaultValue: '操作' }), key: 'actions', valueType: 'option', fixed: 'right', width: 200,
      render: (_, row) => [
        <Button key="addChild" type="link" size="small" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDefaultParentId((row as any).menu_id); setModalOpen(true); }}>子菜单</Button>,
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setDefaultParentId(undefined); setModalOpen(true); }}>{t('common.edit', { defaultValue: '编辑' })}</Button>,
        <Popconfirm key="del" title={t('common.deleteConfirm', { defaultValue: '确认删除？' })} onConfirm={() => api.deleteMenu((row as any).menu_id).then(() => { message.success('删除成功'); actionRef.current?.reload(); })}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>{t('common.delete', { defaultValue: '删除' })}</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<MenuItem>
        rowKey="menu_id" actionRef={actionRef} columns={columns}
        childrenColumnName="children"
        request={async () => {
          try {
            const res = await api.fetchMenuTree();
            const tree = (res as any)?.data ?? [];
            setTreeData(tree);
            return { data: tree, success: true, total: 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle={t('route.permission_menus', { defaultValue: '菜单管理' })}
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDefaultParentId(undefined); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增菜单' })}</Button>]}
        search={false} pagination={false} scroll={{ x: 'max-content' }}
      />
      <ModalForm<MenuForm>
        title={editRecord ? t('common.edit', { defaultValue: '编辑菜单' }) : t('common.add', { defaultValue: '新增菜单' })}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { ...editRecord } : { parent_id: defaultParentId, status: '0', order_num: 0 }}
        onFinish={async (values) => {
          try {
            if ((editRecord as any)?.menu_id) await api.updateMenu((editRecord as any).menu_id, values); else await api.createMenu(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
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
        <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} initialValue="0" />
      </ModalForm>
    </>
  );
}