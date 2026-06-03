import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Switch, Tag, Row, Col, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import * as api from '@/service/api/gateway/routes';
import type { GatewayRoute, GatewayRouteForm } from '@/service/api/gateway/routes';
import { usePermission } from '@/hooks/usePermission';

export default function GatewayRoutes() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<GatewayRoute | null>(null);
  const { hasComp } = usePermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleToggle = async (row: GatewayRoute, checked: boolean) => {
    try {
      if (checked) await api.enableGatewayRoute(row.ID);
      else await api.disableGatewayRoute(row.ID);
      message.success('操作成功');
      actionRef.current?.reload();
    } catch (e: any) { if (!isHandledError(e)) message.error('操作失败'); }
  };

  const handleReload = async () => {
    try {
      await api.reloadGatewayRoutes();
      message.success('路由重载成功');
      actionRef.current?.reload();
    } catch (e: any) { if (!isHandledError(e)) message.error('重载失败'); }
  };

  const columns: ProColumns<GatewayRoute>[] = [
    { title: '前缀', dataIndex: 'prefix', ellipsis: true, render: (_, row) => <Tag color="blue">{row.prefix}</Tag> },
    { title: '目标地址', dataIndex: 'target', ellipsis: true },
    { title: '重写', dataIndex: 'rewrite', width: 100, render: v => v || '—' },
    { title: '描述', dataIndex: 'description', ellipsis: true, render: v => v || '—' },
    {
      title: '状态', dataIndex: 'enabled', width: 80, valueType: 'select',
      valueEnum: {
        true: { text: '启用' },
        false: { text: '禁用' }
      },
      render: (_, row) => (
        <Switch checked={!!row.enabled} onChange={(c) => handleToggle(row, c)} checkedChildren="启用" unCheckedChildren="禁用" size="small" />
      )
    },
    { title: '创建时间', dataIndex: 'CreatedAt', valueType: 'dateTime', width: 150 },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        hasComp('gateway_route_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        hasComp('gateway_route_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteGatewayRoute(row.ID); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<GatewayRoute>
        rowKey="ID" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('gateway_route_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('gateway_route_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteGatewayRoute(id as number)));
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
            const query: Record<string, unknown> = {};
            if (params.prefix) query.prefix = params.prefix;
            if (params.target) query.target = params.target;
            if (params.enabled !== undefined && params.enabled !== '') {
              query.enabled = String(params.enabled);
            }
            const res = await api.fetchGatewayRoutes(query);
            const list = Array.isArray(res) ? res : [];
            return { data: list, success: true, total: list.length };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="路由管理"
        toolBarRender={() => [
          <Button key="reload" icon={<ReloadOutlined />} onClick={handleReload}>重载路由</Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增路由</Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<GatewayRouteForm>
        key={editRecord?.ID ?? 'new'}
        title={editRecord ? '编辑路由' : '新增路由'}
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        initialValues={editRecord ? { prefix: editRecord.prefix, target: editRecord.target, rewrite: editRecord.rewrite, description: editRecord.description } : {}}
        onFinish={async (values) => {
          try {
            if (editRecord) await api.updateGatewayRoute(editRecord.ID, values);
            else await api.createGatewayRoute(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <Row gutter={16}>
          <Col span={12}><ProFormText name="prefix" label="路径前缀" placeholder="如 /rbac" rules={[{ required: true }]} /></Col>
          <Col span={12}><ProFormText name="target" label="目标地址" placeholder="如 http://192.168.30.198:4122" rules={[{ required: true }]} /></Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}><ProFormText name="rewrite" label="路径重写" placeholder="留空表示不改写" /></Col>
          <Col span={12}><ProFormText name="description" label="描述" /></Col>
        </Row>
      </ModalForm>
    </>
  );
}

