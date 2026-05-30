import { useRef, useState } from 'react';
import { ProTable, ModalForm, ProFormText, ProFormSelect, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, Tag, Row, Col, message } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import * as api from '@/service/api/gateway/whitelist';
import type { Whitelist, WhitelistForm } from '@/service/api/gateway/whitelist';
import { usePermission } from '@/hooks/usePermission';

const METHOD_COLORS: Record<string, string> = { GET: 'success', POST: 'processing', PUT: 'warning', DELETE: 'error', PATCH: 'purple', '*': 'default' };
const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*'].map(m => ({ label: m, value: m }));

export default function GatewayWhitelist() {
  const actionRef = useRef<ActionType>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { hasComp } = usePermission();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns: ProColumns<Whitelist>[] = [
    {
      title: '方法', dataIndex: 'method', width: 100, valueType: 'select',
      valueEnum: {
        GET: { text: 'GET' },
        POST: { text: 'POST' },
        PUT: { text: 'PUT' },
        DELETE: { text: 'DELETE' },
        PATCH: { text: 'PATCH' },
        '*': { text: '*' }
      },
      render: (_, row) => <Tag color={METHOD_COLORS[row.method] ?? 'default'}>{row.method}</Tag>
    },
    { title: '路径', dataIndex: 'path', render: (_, row) => <Tag>{row.path}</Tag> },
    { title: '描述', dataIndex: 'description', render: v => v || '—' },
    { title: '创建时间', dataIndex: 'CreatedAt', valueType: 'dateTime', width: 170 },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 80,
      render: (_, row) => [
        hasComp('gateway_whitelist_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteWhitelist(row.ID); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<Whitelist>
        rowKey="ID" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('gateway_whitelist_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('gateway_whitelist_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteWhitelist(id as number)));
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
            if (params.method) query.method = params.method;
            if (params.path) query.path = params.path;
            const res = await api.fetchWhitelists(query);
            const list = Array.isArray(res) ? res : [];
            return { data: list, success: true, total: list.length };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="白名单管理"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增白名单</Button>
        ]}
        search={{ labelWidth: 80 }} scroll={{ x: 'max-content' }} pagination={{ pageSize: 20 }}
      />
      <ModalForm<WhitelistForm>
        title="新增白名单"
        open={modalOpen} onOpenChange={setModalOpen}
        modalProps={{ onCancel: () => setModalOpen(false), transitionName: '', maskTransitionName: '' }}
        onFinish={async (values) => {
          try {
            await api.createWhitelist(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); return false; }
        }}
      >
        <Row gutter={16}>
          <Col span={8}><ProFormSelect name="method" label="HTTP 方法" options={METHOD_OPTIONS} rules={[{ required: true }]} /></Col>
          <Col span={16}><ProFormText name="path" label="路径" placeholder="如 /rbac/login/access-token 或 /swagger/*" rules={[{ required: true }]} /></Col>
        </Row>
        <ProFormText name="description" label="描述" />
      </ModalForm>
    </>
  );
}

