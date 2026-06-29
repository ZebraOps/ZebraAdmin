import http from '../../request';
import { PageResult } from '@/service/types';

// --- Types ---

/** K8s Deployment summary (aggregated from pod data) */
export interface K8sDeploymentInfo {
  deployment_name: string;
  namespace: string;
  healthy_pods: number;
  total_pods: number;
  image: string;
  status: string;
  cluster_id: number;
  cluster_name: string;
}

/** Docker container info (from list endpoint, enriched) */
export interface DockerContainerInfo {
  id: string;
  names: string[];
  image: string;
  status: string;
  ports?: string;
  created_at?: string;
  server_id: number;
  server_name: string;
}

/** Operation history record */
export interface ContainerOperation {
  id: number;
  timestamp: string;
  operation_type: string;
  target_type: string;
  target_detail: string;
  operator: string;
  result: string;
  details?: string;
}

// --- K8s Container APIs ---

/** Restart a K8s deployment (rollout restart) */
export const restartK8sDeployment = (
  clusterId: number,
  deploymentName: string,
  namespace?: string,
) =>
  http.post<{ message: string }>(
    `/cicd/api/k8s/clusters/${clusterId}/deployments/${encodeURIComponent(deploymentName)}/restart`,
    namespace ? { namespace } : undefined,
  );

/** Delete a K8s pod */
export const deleteK8sPod = (
  clusterId: number,
  podName: string,
  namespace?: string,
) =>
  http.delete(`/cicd/api/k8s/clusters/${clusterId}/pods/${encodeURIComponent(podName)}`, {
    params: namespace ? { namespace } : undefined,
  });

// --- Docker Container APIs ---

/** Restart a Docker container */
export const restartDockerContainer = (serverId: number, containerId: string) =>
  http.post<{ message: string }>(
    `/cicd/api/servers/${serverId}/containers/${containerId}/restart`,
  );

/** Delete a Docker container */
export const deleteDockerContainer = (
  serverId: number,
  containerId: string,
  force?: boolean,
) =>
  http.delete(`/cicd/api/servers/${serverId}/containers/${containerId}`, {
    params: force ? { force: 'true' } : undefined,
  });

// --- History APIs ---

/** List container operation history (paginated) */
export const fetchContainerOperations = (params?: Record<string, unknown>) =>
  http.get<PageResult<ContainerOperation>>('/cicd/api/container-operations', params);

/** Record a container operation */
export const recordContainerOperation = (
  data: Omit<ContainerOperation, 'id' | 'timestamp'>,
) => http.post<ContainerOperation>('/cicd/api/container-operations', data);
