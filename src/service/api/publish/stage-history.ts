import http from '../../request';

// StageHistory mirrors the backend model
export interface StageHistory {
  id: number;
  task_id: number;
  stage: string;       // PENDING | BUILDING | PUSHING | DEPLOYING
  status: string;      // running | success | failed
  started_at?: string;
  finished_at?: string;
  error_message?: string;
  log_summary?: string;
  created_at: string;
  updated_at: string;
}

// Get all stage history records for a deploy task
export async function getTaskStages(taskId: number): Promise<StageHistory[]> {
  return http.get<StageHistory[]>(`/cicd/api/deploys/${taskId}/stages`);
}