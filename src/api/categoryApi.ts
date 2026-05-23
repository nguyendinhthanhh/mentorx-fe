import apiClient from './client'
import { ApiResponse, CategoryResponse } from '@/types'

export const categoryApi = {
  getAllActive: async (): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/system/categories/active')
    return (response.data.data || [])
      .map((category) => {
        const normalizedId = category.id ?? category.categoryId
        if (normalizedId == null) {
          return null
        }
        return {
          ...category,
          id: normalizedId,
          categoryId: normalizedId,
        }
      })
      .filter((category): category is CategoryResponse => category !== null)
  },
}
