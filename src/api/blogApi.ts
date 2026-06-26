import client from './client'
import { BlogCategory, BlogAudience } from '../pages/blog/blogData'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  category: BlogCategory
  audience: BlogAudience
  author: string
  authorRole: string
  authorAvatar: string
  coverImage: string
  content: string
  readTime: string
  featured: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  date: string // Added for compatibility with frontend components
}

export interface PageResponse<T> {
  content: T[]
  pageable: any
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: any
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  error?: string
}

export interface SearchBlogParams {
  audience?: string
  category?: string
  query?: string
  page?: number
  size?: number
}

const formatCategory = (cat: string) => {
  const map: Record<string, string> = {
    'CAREER_GROWTH': 'Career Growth',
    'MENTORING': 'Mentoring',
    'COURSES': 'Courses',
    'FREELANCE_JOBS': 'Freelance & Jobs',
    'TECHNOLOGY': 'Technology',
    'PLATFORM_SAFETY': 'Platform Safety',
  }
  return map[cat] || cat
}

const formatAudience = (aud: string) => {
  const map: Record<string, string> = {
    'FOR_LEARNERS': 'For Learners',
    'FOR_MENTORS': 'For Mentors',
    'CAREER_GROWTH': 'Career Growth',
    'FREELANCE_JOBS': 'Freelance & Jobs',
    'COURSES': 'Courses',
    'PLATFORM_SAFETY': 'Platform Safety',
  }
  return map[aud] || aud
}

const blogApi = {
  getPosts: async (params: SearchBlogParams) => {
    const { data } = await client.get<ApiResponse<PageResponse<BlogPost>>>('/blogs', { params })
    const posts = data.data.content.map(p => ({
      ...p,
      category: formatCategory(p.category as any) as any,
      audience: formatAudience(p.audience as any) as any,
      date: new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }))
    return { ...data.data, content: posts }
  },

  getFeaturedPosts: async () => {
    const { data } = await client.get<ApiResponse<BlogPost[]>>('/blogs/featured')
    return data.data.map(p => ({
      ...p,
      category: formatCategory(p.category as any) as any,
      audience: formatAudience(p.audience as any) as any,
      date: new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }))
  },
}

export default blogApi
