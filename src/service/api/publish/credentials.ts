import http from '../../request'
import type { PageResult } from '@/service/types'

export interface JenkinsCredential {
  id: number
  jenkins_platform_id: number
  credential_id: string
  display_name?: string
  description?: string
  credential_type?: string
  username?: string
  scope?: string
  status?: string
  synced_at?: string
  created_at?: string
  updated_at?: string
}

export interface SyncResult {
  added: number
  updated: number
  deleted: number
}

export interface JenkinsCredentialQuery {
  credential_id?: string
  name?: string
  credential_type?: string
  status?: string
  jenkins_platform_id?: number
  page?: number
  size?: number
}

export const fetchJenkinsCredentials = (params?: JenkinsCredentialQuery) =>
  http.get<PageResult<JenkinsCredential>>('/cicd/api/jenkins-credentials', params as Record<string, unknown>)

export const createJenkinsCredential = (data: Partial<JenkinsCredential>) =>
  http.post<JenkinsCredential>('/cicd/api/jenkins-credentials', data)

export const getJenkinsCredential = (id: number) =>
  http.get<JenkinsCredential>(`/cicd/api/jenkins-credentials/${id}`)

export const updateJenkinsCredential = (id: number, data: Partial<JenkinsCredential>) =>
  http.put<JenkinsCredential>(`/cicd/api/jenkins-credentials/${id}`, data)

export const deleteJenkinsCredential = (id: number) =>
  http.delete(`/cicd/api/jenkins-credentials/${id}`)

export const syncJenkinsCredentials = (jenkinsPlatformId: number) =>
  http.post<SyncResult>('/cicd/api/jenkins-credentials/sync', { jenkins_platform_id: jenkinsPlatformId })
