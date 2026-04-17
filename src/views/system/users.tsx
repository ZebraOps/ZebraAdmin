import { useRef, useState } from 'react';
import {
  ProTable, ProForm, ProFormText, ProFormSelect,
  type ActionType, type ProColumns, ProFormDependency,
  type ProFormInstance
} from '@ant-design/pro-components';
import multiavatar from '@multiavatar/multiavatar';
import { Button, Space, Tag, message, Row, Col, Modal, Input } from 'antd';
import CountdownButton from '@/components/CountdownButton';
import { isHandledError } from '@/service/request';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import * as api from '@/service/api/rbac/user';
import type { User, UserForm } from '@/service/api/rbac/user';
import { useAuthStore } from '@/store/auth';

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
  const formRef = useRef<ProFormInstance>(null);
  const [editRecord, setEditRecord] = useState<User | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { initUserInfo } = useAuthStore();



  const columns: ProColumns<User>[] = [
    {
      title: '用户', key: 'user', width: 200,
      render: (_, row) => (
        <Space>
          <span
            style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', display: 'inline-flex', flexShrink: 0 }}
            dangerouslySetInnerHTML={{ __html: multiavatar(row.username + (row.avatar || '')) }}
          />
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
        <CountdownButton key="del" icon={<DeleteOutlined />}
          onConfirm={async () => { await api.deleteUser(row.user_id); message.success('删除成功'); actionRef.current?.reload(); }}
        />
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
            <Col span={12}>
              <ProFormSelect name="superuser" label="角色类型" options={[{ label: '超级管理员', value: '0' }, { label: '普通用户', value: '10' }]} />
            </Col>
            <Col span={12}>
              <ProFormSelect name="status" label="状态" options={[{ label: '启用', value: '0' }, { label: '禁用', value: '1' }]} />
            </Col>
          </Row>
          <ProFormText name="department" label="部门" />
        </ProForm>
      </Modal>
    </>
  );
}


