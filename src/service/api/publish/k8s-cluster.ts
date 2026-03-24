import http from '../../request';

export interface K8sCluster {
  id: number;
  name: string;
  apiServer: string;
  description?: string;
  status?: number;
  createdAt?: string;
}

export const fetchK8sClusters = (params?: Record<string, unknown>) =>
  http.get<{ items: K8sCluster[]; total: number }>('/cicd/api/k8s/clusters', params);

export const createK8sCluster = (data: { name: string; apiServer: string; kubeConfig?: string; description?: string }) =>
  http.post<K8sCluster>('/cicd/api/k8s/clusters', data);

export const updateK8sCluster = (id: number, data: Partial<K8sCluster>) =>
  http.put<K8sCluster>(`/cicd/api/k8s/clusters/${id}`, data);

export const deleteK8sCluster = (id: number) =>
  http.delete(`/cicd/api/k8s/clusters/${id}`);
