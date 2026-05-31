import http from '../../request';
import { PageResult } from '@/service/types';

export interface LinuxMachine {
  id: number;
  name: string;
  description?: string;
  host: string;
  port: number;
  username: string;
  auth_type?: string;
  password?: string;
  private_key?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}


export interface DockerContainer {
  id: string;
  names: string[];
  image: string;
  command?: string;
  status: string;
  ports?: string;
  labels?: string;
  created_at?: string;
}

export const fetchLinuxMachines = (params?: Record<string, unknown>) =>
  http.get<PageResult<LinuxMachine>>('/cicd/api/linux-machines', params);

export const fetchLinuxMachineById = (id: number) =>
  http.get<LinuxMachine>(`/cicd/api/linux-machines/${id}`);

export const createLinuxMachine = (data: Omit<LinuxMachine, 'id' | 'created_at' | 'updated_at'>) =>
  http.post<LinuxMachine>('/cicd/api/linux-machines', data);

export const updateLinuxMachine = (id: number, data: Partial<LinuxMachine>) =>
  http.put<LinuxMachine>(`/cicd/api/linux-machines/${id}`, data);

export const deleteLinuxMachine = (id: number) =>
  http.delete(`/cicd/api/linux-machines/${id}`);

/** 测试 Linux 主机 SSH 连通性 */
export const testLinuxConnection = (id: number) =>
  http.post<{ message: string }>(`/cicd/api/linux-machines/${id}/connect`);

/** 获取主机上的 Docker 容器列表 */
export const listLinuxContainers = (id: number) =>
  http.get<DockerContainer[]>(`/cicd/api/servers/${id}/containers`);

/** 在容器中执行命令 */
export const execContainerCommand = (serverId: number, containerId: string, command: string) =>
  http.post<{ output: string; error?: string }>(
    `/cicd/api/servers/${serverId}/containers/${containerId}/exec`,
    { command }
  );
