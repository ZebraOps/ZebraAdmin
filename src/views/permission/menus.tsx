import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTreeSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
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
    title: node.menu_name,
    value: node.menu_id,
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
        <CountdownButton key="del" icon={<DeleteOutlined />} text={t('common.delete', { defaultValue: '删除' })}
          onConfirm={async () => { await api.deleteMenu(row.menu_id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
      ]
    }
  ];

  return (
    <>
      <ProTable<MenuItem>
        rowKey="menu_id" actionRef={actionRef} columns={columns}
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
        toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setDefaultParentId(undefined); setModalOpen(true); }}>{t('common.add', { defaultValue: '新增菜单' })}</Button>]}
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