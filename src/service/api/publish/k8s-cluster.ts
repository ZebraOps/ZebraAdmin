import http from '../../request';
import { PageResult } from '@/service/types';

export interface K8sCluster {
  id: number;
  name: string;
  description?: string;
  api_server: string;
  ca_cert?: string;
  client_cert?: string;
  client_key?: string;
  token?: string;
  skip_verify?: boolean;
  namespace?: string;
  is_active?: boolean;
  vendor?: string;
  environment?: string;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface PodInfo {
  name: string;
  status: string;
  node_name?: string;
  namespace: string;
  start_time?: string;
  labels?: Record<string, string>;
  restart_count?: number;
  ready?: string;
}

export const fetchK8sClusters = (params?: Record<string, unknown>) =>
  http.get<PageResult<K8sCluster>>('/cicd/api/k8s/clusters', params);

export const fetchK8sClusterById = (id: number) =>
  http.get<K8sCluster>(`/cicd/api/k8s/clusters/${id}`);

export const createK8sCluster = (data: Omit<K8sCluster, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<K8sCluster>('/cicd/api/k8s/clusters', data);

export const updateK8sCluster = (id: number, data: Partial<K8sCluster>) =>
  http.put<K8sCluster>(`/cicd/api/k8s/clusters/${id}`, data);

export const deleteK8sCluster = (id: number) =>
  http.delete(`/cicd/api/k8s/clusters/${id}`);

/** 测试 K8s 集群连通性 */
export const testK8sConnection = (id: number) =>
  http.post<{ message: string }>(`/cicd/api/k8s/clusters/${id}/connect`);

/** 获取集群指定命名空间下的 Pod 列表 */
export const listK8sPods = (id: number, namespace?: string) =>
  http.get<PodInfo[]>(`/cicd/api/k8s/clusters/${id}/pods`, namespace ? { namespace } : undefined);

/** 根据Deployment名称获取关联Pod列表（自动查询Deployment的selector） */
export const listDeploymentPods = (id: number, deploymentName: string, namespace?: string) =>
  http.get<PodInfo[]>(`/cicd/api/k8s/clusters/${id}/deployment-pods`, {
    deployment_name: deploymentName,
    ...(namespace ? { namespace } : {}),
  });

/** 获取集群的命名空间列表（动态） */
export const listK8sNamespaces = (id: number) =>
  http.get<string[]>(`/cicd/api/k8s/clusters/${id}/namespaces`);

/** Pod 日志响应 */
export interface PodLogResponse {
  output: string;
  pod_name: string;
  namespace: string;
  container?: string;
}

/** 获取 Pod 日志（类似 kubectl logs） */
export const getPodLogs = (
  clusterId: number,
  podName: string,
  namespace?: string,
  tail?: number,
  container?: string,
) =>
  http.get<PodLogResponse>(`/cicd/api/k8s/clusters/${clusterId}/pods/${podName}/logs`, {
    namespace: namespace || 'default',
    tail: tail || 100,
    ...(container ? { container } : {}),
  });
