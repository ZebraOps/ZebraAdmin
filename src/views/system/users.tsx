import { useRef, useState } from 'react';
import {
  ProTable, ModalForm, ProFormText, ProFormSelect,
  type ActionType, type ProColumns
} from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, Avatar, message, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/user';
import type { User, UserForm } from '@/service/api/rbac/user';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '启用', color: 'green' },
  '1': { label: '禁用', color: 'red' },
};

const SUPERUSER_MAP: Record<string, { label: string; color: string }> = {
  '0': { label: '超管', color: 'purple' },
  '10': { label: '普通', color: 'arcoblue' },
};

export default function SystemUsers() {
  const actionRef = useRef<ActionType>(null);
  const [editRecord, setEditRecord] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleDelete = async (id: number) => {
    try { await api.deleteUser(id); message.success('删除成功'); actionRef.current?.reload(); }
    catch { message.error('删除失败'); }
  };

  const columns: ProColumns<User>[] = [
    {
      title: '用户', key: 'user', width: 200,
      render: (_, row) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} src={row.avatar || undefined}
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: '18px' }}>{row.username}</div>
            <div style={{ fontSize: 11, opacity: 0.6, lineHeight: '16px' }}>{row.nickname || '—'}</div>
          </div>
        </Space>
      )
    },
    { title: '邮箱', dataIndex: 'email', render: v => v || '—' },
    { title: '手机', dataIndex: 'tel', render: v => v || '—' },
    { title: '部门', dataIndex: 'department', render: v => v || '—' },
    {
      title: '角色', dataIndex: 'superuser',
      render: (_, row) => {
        const m = SUPERUSER_MAP[String((row as any).superuser)] ?? { label: String((row as any).superuser), color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      }
    },
    {
      title: '状态', dataIndex: 'status',
      render: (_, row) => {
        const m = STATUS_MAP[String((row as any).status)] ?? { label: String((row as any).status), color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      }
    },
    { title: '最后登录IP', dataIndex: 'last_ip', render: v => v || '—' },
    { title: '最后登录时间', dataIndex: 'last_login', width: 160, render: v => v || '—' },
    { title: '创建时间', dataIndex: 'ctime', width: 160 },
    {
      title: '操作', key: 'actions', valueType: 'option', fixed: 'right', width: 140,
      render: (_, row) => [
        <Button key="edit" type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditRecord(row); setModalOpen(true); }}>编辑</Button>,
        <Popconfirm key="del" title="确认删除该用户？" onConfirm={() => handleDelete(row.user_id)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ]
    }
  ];

  return (
    <>
      <ProTable<User>
        rowKey="user_id" actionRef={actionRef} columns={columns}
        request={async (params) => {
          try {
            const { current = 1, pageSize = 20, ...rest } = params;
            const res = await api.fetchUsers({ current: (current - 1) * pageSize, size: pageSize, ...rest });
            return { data: (res as any)?.records ?? [], success: true, total: (res as any)?.total ?? 0 };
          } catch { return { data: [], success: false, total: 0 }; }
        }}
        headerTitle="系统用户"
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditRecord(null); setModalOpen(true); }}>新增用户</Button>
        ]}
        scroll={{ x: 'max-content' }}
      />
      <ModalForm<UserForm>
        title={editRecord ? '编辑用户' : '新增用户'}
        open={modalOpen} onOpenChange={setModalOpen}
        initialValues={editRecord ? { username: editRecord.username, nickname: editRecord.nickname, email: editRecord.email, tel: editRecord.tel, status: editRecord.status, superuser: editRecord.superuser, department: editRecord.department } : {}}
        onFinish={async (values) => {
          try {
            if (editRecord) await api.updateUser(editRecord.user_id, values); else await api.createUser(values);
            message.success('保存成功'); actionRef.current?.reload(); return true;
          } catch { message.error('保存失败'); return false; }
        }}
      >
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
          <Col span={12}>
            <ProFormSelect name="superuser" label="角色类型" options={[{ label: '超级管理员', value: '0' }, { label: '普通用户', value: '10' }]} />
          </Col>
          <Col span={12}>
            <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
          </Col>
        </Row>
        <ProFormText name="department" label="部门" />
      </ModalForm>
    </>
  );
}


