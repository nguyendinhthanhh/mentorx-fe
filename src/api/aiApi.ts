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

export interface AiChatMessage {
  role: 'USER' | 'ASSISTANT'
  content: string
}

export interface AiChatRequest {
  message: string
  history: AiChatMessage[]
}

export interface AiChatResponse {
  message: string
}

export const aiApi = {
  explainTask: async (data: ExplainTaskRequest): Promise<ExplainTaskResponse> => {
    const response = await apiClient.post<ApiResponse<ExplainTaskResponse>>('/ai/explain', data)
    return response.data.data
  },

  chat: async (data: AiChatRequest, signal?: AbortSignal): Promise<AiChatResponse> => {
    const response = await apiClient.post<ApiResponse<AiChatResponse>>('/ai/chat', data, { signal })
    return response.data.data
  },
}
