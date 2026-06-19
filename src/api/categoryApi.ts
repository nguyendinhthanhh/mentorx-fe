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
  create: async (label: string): Promise<CategoryResponse> => {
    const trimmed = label.trim().replace(/\s+/g, ' ')
    const slug = buildSlug(trimmed)
    const response = await apiClient.post<ApiResponse<CategoryResponse>>('/system/categories', {
      slug,
      labelEn: trimmed,
      labelVi: trimmed,
      isActive: true,
    })
    const category = response.data.data
    const normalizedId = category.id ?? category.categoryId
    return {
      ...category,
      id: normalizedId,
      categoryId: normalizedId,
    }
  },
}

function buildSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
