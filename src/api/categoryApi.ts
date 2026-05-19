import apiClient from './client'
import { ApiResponse, CategoryResponse } from '@/types'

export const categoryApi = {
  getAllActive: async (): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/system/categories/active')
    return response.data.data
  },
}
