import http from '../../request';

export interface Job {
  job_id: number;
  job_name: string;
  job_code?: string;
  description?: string;
  ctime?: string;
  utime?: string;
}

export interface JobForm {
  job_name: string;
  job_code?: string;
  description?: string;
}

export const fetchJobs = (params?: Record<string, unknown>) =>
  http.get<{ total: number; records: Job[] }>('/rbac/jobs', params);

export const createJob = (data: JobForm) =>
  http.post<Job>('/rbac/jobs', data);

export const updateJob = (id: number, data: Partial<JobForm>) =>
  http.put<Job>(`/rbac/jobs/${id}`, data);

export const deleteJob = (id: number) =>
  http.delete(`/rbac/jobs/${id}`);
