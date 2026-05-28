import http from '../../request';

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

type PageResult<T> = { total: number; records: T[] };

export interface PodInfo {
  name: string;
  status: string;
  node_name?: string;
  namespace: string;
  start_time?: string;
  labels?: Record<string, string>;
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
