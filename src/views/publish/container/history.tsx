import { useState } from 'react';
import {
  ProTable, type ProColumns,
} from '@ant-design/pro-components';
import { Tag, Empty, DatePicker, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import * as api from '@/service/api/publish/container-operations';
import type { ContainerOperation } from '@/service/api/publish/container-operations';

const { RangePicker } = DatePicker;

const OPERATION_TYPE_MAP: Record<string, { text: string; color: string }> = {
  restart: { text: '重启', color: 'blue' },
  batch_restart: { text: '批量重启', color: 'geekblue' },
  delete: { text: '删除', color: 'red' },
  terminal: { text: '终端访问', color: 'green' },
  exec: { text: '命令执行', color: 'orange' },
};

const TARGET_TYPE_MAP: Record<string, string> = {
  k8s: 'K8s 集群',
  docker: 'Docker 主机',
};

export default function PublishContainerHistory() {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const columns: ProColumns<ContainerOperation>[] = [
    {
      title: '时间', dataIndex: 'created_at', width: 170, valueType: 'dateTime',
    },
    {
      title: '操作类型', dataIndex: 'operation_type', width: 120,
      valueType: 'select',
      valueEnum: Object.entries(OPERATION_TYPE_MAP).reduce((acc, [k, v]) => {
        acc[k] = { text: v.text };
        return acc;
      }, {} as Record<string, { text: string }>),
      render: (_, row) => {
        const m = OPERATION_TYPE_MAP[row.operation_type];
        return <Tag color={m?.color || 'default'}>{m?.text || row.operation_type}</Tag>;
      },
    },
    {
      title: '目标类型', dataIndex: 'target_type', width: 110,
      valueType: 'select',
      valueEnum: { k8s: { text: 'K8s 集群' }, docker: { text: 'Docker 主机' } },
      render: (_, row) => <Tag>{TARGET_TYPE_MAP[row.target_type] || row.target_type || '-'}</Tag>,
    },
    { title: '目标', dataIndex: 'target_detail', ellipsis: true, search: false },
    { title: '操作人', dataIndex: 'operator', width: 100 },
    {
      title: '结果', dataIndex: 'result', width: 80,
      valueType: 'select',
      valueEnum: { success: { text: '成功' }, failed: { text: '失败' } },
      render: (_, row) => (
        <Tag color={row.result === 'success' ? 'success' : 'error'}>
          {row.result === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    { title: '详情', dataIndex: 'details', ellipsis: true, search: false },
  ];

  return (
    <div style={{ padding: '0 8px' }}>
      <ProTable<ContainerOperation>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, operation_type, target_type, result } = params as any;
          try {
            const query: Record<string, unknown> = {
              page: current || 1,
              size: pageSize || 20,
              ...(operation_type ? { operation_type } : {}),
              ...(target_type ? { target_type } : {}),
              ...(result ? { result } : {}),
            };
            if (dateRange) {
              query.start_time = dateRange[0].toISOString();
              query.end_time = dateRange[1].toISOString();
            }
            const res = await api.fetchContainerOperations(query) as any;
            return { data: res?.records ?? [], total: res?.total ?? 0, success: true };
          } catch {
            // API not available yet — show empty state
            return { data: [], total: 0, success: true };
          }
        }}
        pagination={{ defaultPageSize: 20 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        options={{ reload: true, density: true }}
        toolbar={{
          title: '容器操作历史',
          actions: [
            <Space key="filters" wrap>
              <RangePicker
                showTime
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                placeholder={['开始时间', '结束时间']}
              />
            </Space>,
          ],
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无操作记录（后端 API 尚未就绪或暂无数据）"
            />
          ),
        }}
      />
    </div>
  );
}
