import http from '../../request';

export interface LinuxMachine {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  description?: string;
  status?: number;
  createdAt?: string;
}

export const fetchLinuxMachines = (params?: Record<string, unknown>) =>
  http.get<{ items: LinuxMachine[]; total: number }>('/cicd/api/linux-machines', params);

export const createLinuxMachine = (data: { name: string; host: string; port: number; username: string; password?: string; description?: string }) =>
  http.post<LinuxMachine>('/cicd/api/linux-machines', data);

export const updateLinuxMachine = (id: number, data: Partial<LinuxMachine>) =>
  http.put<LinuxMachine>(`/cicd/api/linux-machines/${id}`, data);

export const deleteLinuxMachine = (id: number) =>
  http.delete(`/cicd/api/linux-machines/${id}`);
