import { useRef, useState, useEffect } from 'react';
import { ProTable, ProForm, ProFormText, ProFormSelect, ProFormTreeSelect, type ActionType, type ProColumns, ProFormDependency, type ProFormInstance } from '@ant-design/pro-components';
import multiavatar from '@multiavatar/multiavatar';
import { Button, Popconfirm, Tag, Space, Row, Col, message, Modal, Input } from 'antd';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/user';
import type { User, UserForm } from '@/service/api/rbac/user';
import * as orgApi from '@/service/api/rbac/org';
import type { OrgNode } from '@/service/api/rbac/org';
import { useAuthStore } from '@/store/auth';
import { usePermission } from '@/hooks/usePermission';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'green' },
  '1': { label: '禁用', color: 'red' },
};

const SUPERUSER_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '超管', color: 'purple' },
  '10': { label: '普通', color: 'blue' },
};

export default function OrgUsers() {
  const actionRef = useRef<ActionType>(null);
  const formRef = useRef<ProFormInstance>(null);
  const [editRecord, setEditRecord] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [orgTreeData, setOrgTreeData] = useState<OrgNode[]>([]);
  const { initUserInfo } = useAuthStore();
  const { hasComp } = usePermission();

  useEffect(() => {
    orgApi.fetchOrgTree().then(res => {
      const data = Array.isArray(res) ? res : (res as any)?.data ?? [];
      setOrgTreeData(data);
    }).catch(() => {});
  }, []);

  function toTreeSelectData(nodes: OrgNode[]): any[] {
    return nodes.map(n => ({
      title: n.org_name,
      value: n.org_name,
      children: n.children?.length ? toTreeSelectData(n.children) : undefined,
    }));
  }

  const columns: ProColumns<User>[] = [
    { title: '用户名', dataIndex: 'username', hideInTable: true },
    { title: '姓名', dataIndex: 'nickname', hideInTable: true },
    {
      title: '用户', key: 'user', ellipsis: true, search: false,
      render: (_, row) => (
        <Space>
          <span
            style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: multiavatar(row.username + (row.avatar || '')) }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{row.username}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>{row.nickname || '—'}</div>
          </div>
        </Space>
      )
    },
    { title: '邮箱', dataIndex: 'email', ellipsis: true, render: v => v || '—' },
    { title: '手机', dataIndex: 'tel', width: 120, render: v => v || '—' },
    {
      title: '部门', dataIndex: 'department', ellipsis: true, render: v => v || '—',
      valueType: 'treeSelect',
      fieldProps: {
        treeData: toTreeSelectData(orgTreeData),
        allowClear: true,
        placeholder: '请选择部门',
        treeDefaultExpandAll: true,
        showSearch: true,
        treeNodeFilterProp: 'title',
      }
    },
    { title: '角色', dataIndex: 'superuser', valueType: 'select', valueEnum: { '0': { text: '超管' }, '10': { text: '普通' } }, render: (_, row) => { const m = SUPERUSER_MAP[String((row as any).superuser)] ?? { label: String((row as any).superuser), color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; } },
    {
      title: '状态', dataIndex: 'status', width: 80, valueType: 'select', valueEnum: {
        '0': { text: '启用' },
        '1': { text: '禁用' },
      },
      render: (_, row) => { const m = STATUS_MAP[String((row as any).status)] ?? { label: String((row as any).status), color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; }
    },
    { title: '创建时间', dataIndex: 'ctime', width: 150, search: false },
    { title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 120,
      render: (_, row) => [
        hasComp('org_user_edit') && <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        hasComp('org_user_delete') && <Popconfirm key="del" title="确认删除？" onConfirm={async () => { await api.deleteUser(row.user_id); message.success('删除成功'); actionRef.current?.reload(); }}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ].filter(Boolean)
    }
  ];

  return (
    <>
      <ProTable<User>
        rowKey="user_id" actionRef={actionRef} columns={columns}
        rowSelection={hasComp('org_user_delete') ? { selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) } : undefined}
        tableAlertOptionRender={hasComp('org_user_delete') ? () => (
          <Popconfirm
            title={`确认删除选中的 ${selectedRowKeys.length} 条记录？`}
            onConfirm={async () => {
              try {
                await Promise.all(selectedRowKeys.map(id => api.deleteUser(id as number)));
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
            const { current = 1, pageSize = 20 } = params;
            const query: Record<string, unknown> = {
              current: (current - 1) * pageSize,
              size: pageSize,
            };
            if (params.username) query.username = params.username;
            if (params.nickname) query.nickname = params.nickname;
            if (params.email) query.email = params.email;
            if (params.tel) query.tel = params.tel;
            if (params.department) query.department = params.department;
            if (params.superuser !== undefined && params.superuser !== '') query.superuser = params.superuser;
            if (params.status !== undefined && params.status !== '') query.status = params.status;

            const res = await api.fetchUsers(query as any);
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="用户管理"
        search={{ labelWidth: 80 }}
        toolBarRender={() => [hasComp('org_user_add') && <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增用户</Button>]}
        scroll={{ x: 'max-content' }}
      />
      <Modal
        title={editRecord ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        afterOpenChange={(open) => { if (open && editRecord) formRef.current?.setFieldsValue({ username: editRecord.username, nickname: editRecord.nickname, email: editRecord.email, tel: editRecord.tel, status: editRecord.status, superuser: editRecord.superuser, department: editRecord.department, avatar: editRecord.avatar || '' }); if (!open) formRef.current?.resetFields(); }}
        footer={null}
        transitionName=""
        maskTransitionName=""
      >
        <ProForm<UserForm>
          formRef={formRef}
          submitter={{ resetButtonProps: false, submitButtonProps: { loading: submitLoading, style: { float: 'right' } }, render: (_, dom) => <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}><Button onClick={() => setModalOpen(false)}>取消</Button>{dom}</div> }}
          onFinish={async (values) => {
            setSubmitLoading(true);
            try {
              if (editRecord) await api.updateUser(editRecord.user_id, values); else await api.createUser(values);
              message.success('保存成功');
              setModalOpen(false);
              actionRef.current?.reload();
              initUserInfo();
            } catch (e: any) { if (!isHandledError(e)) message.error('保存失败'); }
            setSubmitLoading(false);
          }}
        >
          <ProFormDependency name={['username', 'avatar']}>
            {({ username, avatar }) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span
                  style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: multiavatar((username || 'default') + (avatar || '')) }}
                />
                <span style={{ fontSize: 12, color: '#999' }}>头像预览（修改种子可更换头像）</span>
              </div>
            )}
          </ProFormDependency>
          <Space.Compact style={{ width: '100%' }}>
            <ProFormText
              name="avatar"
              label="头像种子"
              placeholder="输入任意字符生成不同头像"
              fieldProps={{ style: { width: '100%' } }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => formRef.current?.setFieldsValue({ avatar: String(Math.random()).slice(2, 8) })}
              style={{ marginTop: 30 }}
            >
              随机
            </Button>
          </Space.Compact>
          <Row gutter={16}>
            <Col span={12}><ProFormText name="username" label="用户名" rules={[{ required: true }]} disabled={!!editRecord} /></Col>
            <Col span={12}><ProFormText name="nickname" label="姓名" /></Col>
          </Row>
          {!editRecord && <ProFormText.Password name="password" label="密码" rules={[{ required: true }]} />}
          <Row gutter={16}>
            <Col span={12}><ProFormText name="email" label="邮箱" /></Col>
            <Col span={12}><ProFormText name="tel" label="手机号" /></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><ProFormSelect name="superuser" label="角色类型" options={[{ label: '超级管理员', value: '0' }, { label: '普通用户', value: '10' }]} /></Col>
            <Col span={12}><ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} /></Col>
          </Row>
          <ProFormTreeSelect
            name="department"
            label="部门"
            fieldProps={{
              treeData: toTreeSelectData(orgTreeData),
              allowClear: true,
              placeholder: '请选择部门',
              treeDefaultExpandAll: true,
              showSearch: true,
              treeNodeFilterProp: 'title',
            }}
          />
        </ProForm>
      </Modal>
    </>
  );
}



