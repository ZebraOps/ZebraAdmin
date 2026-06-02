import { ProFormSelect, ProFormText, ProFormTextArea, type ProColumns } from '@ant-design/pro-components'
import { Tag, Button, Modal, Select, message } from 'antd'
import { SyncOutlined } from '@ant-design/icons'
import { startTransition, useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { isHandledError } from '@/service/request'
import * as api from '@/service/api/publish/credentials'
import type { JenkinsCredential } from '@/service/api/publish/credentials'
import { fetchJenkinsPlatforms } from '@/service/api/publish/jenkins-platform'
import type { JenkinsPlatform } from '@/service/api/publish/jenkins-platform'
import PublishCRUDPage from '@/components/PublishCRUDPage'

const STATUS_COLORS: Record<string, string> = {
  active: 'success',
  synced_deleted: 'default',
}

const STATUS_LABELS: Record<string, string> = {
  active: '正常',
  synced_deleted: '已删除',
}

const columns: ProColumns<JenkinsCredential>[] = [
  {
    title: 'Jenkins 平台',
    dataIndex: 'jenkins_platform_id',
    hideInTable: true,
    valueType: 'select',
  },
  { title: '凭据ID', dataIndex: 'credential_id', width: 200 },
  { title: '显示名称', dataIndex: 'display_name', ellipsis: true, search: false },
  { title: '类型', dataIndex: 'credential_type', width: 160, search: false },
  { title: '用户名', dataIndex: 'username', width: 120, search: false },
  { title: '作用域', dataIndex: 'scope', width: 100, search: false },
  {
    title: '状态',
    dataIndex: 'status',
    width: 100,
    search: false,
    render: (val) => {
      const v = String(val)
      return <Tag color={STATUS_COLORS[v] ?? 'default'}>{STATUS_LABELS[v] ?? v}</Tag>
    },
  },
  {
    title: '最后同步',
    dataIndex: 'synced_at',
    width: 180,
    search: false,
    render: (val) => (val ? String(val) : '-'),
  },
  { title: '描述', dataIndex: 'description', ellipsis: true, search: false },
]

export default function PublishConfigCredentials() {
  const [syncModalOpen, setSyncModalOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [tableVersion, setTableVersion] = useState(0)
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | undefined>(undefined)
  const [platformOptions, setPlatformOptions] = useState<{ label: string; value: number }[]>([])

  useEffect(() => {
    fetchJenkinsPlatforms({ page: 1, size: 100 })
      .then((res: any) => {
        const records: JenkinsPlatform[] = res?.records ?? []
        setPlatformOptions(
          records.map((p) => ({ label: p.display_name || p.name, value: p.id! })),
        )
      })
      .catch(() => {})
  }, [])

  const closeSyncModal = () => {
    flushSync(() => {
      setSyncing(false)
      setSyncModalOpen(false)
      setSelectedPlatformId(undefined)
    })
  }

  const handleSync = async () => {
    if (!selectedPlatformId) {
      message.warning('请选择 Jenkins 平台')
      return
    }
    setSyncing(true)
    try {
      const result = (await api.syncJenkinsCredentials(selectedPlatformId)) as api.SyncResult
      closeSyncModal()
      message.success(`同步完成：新增 ${result.added}，更新 ${result.updated}，删除标记 ${result.deleted}`)
      startTransition(() => {
        setTableVersion((current) => current + 1)
      })
    } catch (e: any) {
      setSyncing(false)
      if (!isHandledError(e)) message.error(e?.message || '同步失败')
    }
  }

  // 稳定 fetchList 引用，避免每次渲染产生新函数导致 ProTable 重复发请求
  const fetchList = useCallback(async (params: any) => {
    const res = await api.fetchJenkinsCredentials(params)
    return { data: (res as any)?.records ?? [], total: (res as any)?.total ?? 0 }
  }, [])

  const searchColumns = columns.map((column) => {
    if (column.dataIndex !== 'jenkins_platform_id') {
      return column
    }

    return {
      ...column,
      fieldProps: {
        options: platformOptions,
        showSearch: true,
        allowClear: true,
        optionFilterProp: 'label',
      },
    }
  })

  const syncButton = (
    <Button
      key="sync"
      type="primary"
      icon={<SyncOutlined />}
      onClick={() => setSyncModalOpen(true)}
    >
      从 Jenkins 同步
    </Button>
  )

  // 固定 toolbar 数组引用，避免触发 ProTable 不必要的重渲染
  const customToolbar = useRef([syncButton]).current

  return (
    <>
      <PublishCRUDPage<JenkinsCredential>
        key={tableVersion}
        rowKey="id"
        title="Jenkins凭据"
        columns={searchColumns}
        fetchList={fetchList}
        createItem={(data) => api.createJenkinsCredential(data as any)}
        updateItem={(id, data) => api.updateJenkinsCredential(id, data as any)}
        deleteItem={(id) => api.deleteJenkinsCredential(id)}
        addPerm="publish_credentials_add"
        editPerm="publish_credentials_edit"
        deletePerm="publish_credentials_delete"
        formTitleCreate="新增Jenkins凭据"
        formTitleEdit="编辑Jenkins凭据"
        customToolbar={customToolbar}
        formInitialValues={{ scope: 'GLOBAL', status: 'active' }}
        formFields={(record) => {
          const isEdit = Boolean(record?.id)
          return (
            <>
              <ProFormSelect
                name="jenkins_platform_id"
                label="Jenkins 平台"
                rules={[{ required: true, message: '请选择 Jenkins 平台' }]}
                options={platformOptions}
                showSearch
                disabled={isEdit}
                fieldProps={{ optionFilterProp: 'label' }}
                placeholder="请选择 Jenkins 平台"
              />
              <ProFormText
                name="credential_id"
                label="凭据ID"
                rules={[{ required: true, message: '请输入凭据ID' }]}
                disabled={isEdit}
                placeholder="请输入 Jenkins 中的凭据ID"
              />
              <ProFormText
                name="display_name"
                label="显示名称"
                rules={[{ required: true, message: '请输入显示名称' }]}
                placeholder="请输入显示名称"
              />
              <ProFormText
                name="credential_type"
                label="凭据类型"
                disabled={isEdit}
                placeholder="如 UsernamePassword / SecretText"
              />
              <ProFormText name="username" label="用户名" placeholder="请输入用户名" />
              <ProFormSelect
                name="scope"
                label="作用域"
                options={[
                  { label: 'GLOBAL', value: 'GLOBAL' },
                  { label: 'SYSTEM', value: 'SYSTEM' },
                ]}
                placeholder="请选择作用域"
              />
              <ProFormSelect
                name="status"
                label="状态"
                options={[
                  { label: '正常', value: 'active' },
                  { label: '已删除', value: 'synced_deleted' },
                ]}
                placeholder="请选择状态"
              />
              <ProFormTextArea
                name="description"
                label="描述"
                fieldProps={{ rows: 3 }}
                placeholder="请输入描述"
              />
            </>
          )
        }}
      />
      {/* 使用自定义 footer，完全绕开 Ant Design 对 async onOk 的内部 loading 管理 */}
      {syncModalOpen && (
        <Modal
          title="从 Jenkins 同步凭据"
          open={syncModalOpen}
          onCancel={() => {
            if (!syncing) {
              setSyncModalOpen(false)
              setSelectedPlatformId(undefined)
            }
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setSyncModalOpen(false)
                setSelectedPlatformId(undefined)
              }}
              disabled={syncing}
            >
              取消
            </Button>,
            <Button key="sync" type="primary" loading={syncing} onClick={handleSync}>
              开始同步
            </Button>,
          ]}
          destroyOnClose
        >
          <div className="py-2">
            <p className="mb-3 text-gray-500">
              将从所选 Jenkins 平台拉取凭据列表并同步到本地数据库。
              在 Jenkins 中已删除的凭据将被标记为「已删除」状态（不会物理删除，以保留流水线引用）。
            </p>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择 Jenkins 平台"
              options={platformOptions}
              value={selectedPlatformId}
              onChange={setSelectedPlatformId}
            />
          </div>
        </Modal>
      )}
    </>
  )
}
