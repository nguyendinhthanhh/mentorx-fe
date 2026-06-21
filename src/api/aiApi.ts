import apiClient from './client'
import { ApiResponse } from '@/types'

export enum AiTaskType {
  JOB = 'JOB',
  PROPOSAL = 'PROPOSAL',
  CONTRACT = 'CONTRACT',
}

export interface ExplainTaskRequest {
  taskType: AiTaskType
  taskId: string
  question: string
}

export interface ExplainTaskResponse {
  explanation: string
}

export const aiApi = {
  explainTask: async (data: ExplainTaskRequest): Promise<ExplainTaskResponse> => {
    const response = await apiClient.post<ApiResponse<ExplainTaskResponse>>('/ai/explain', data)
    return response.data.data
  },
}
