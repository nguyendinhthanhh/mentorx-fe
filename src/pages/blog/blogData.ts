export type BlogCategory =
  | 'Career Growth'
  | 'Mentoring'
  | 'Courses'
  | 'Freelance & Jobs'
  | 'Technology'
  | 'Platform Safety'

export type BlogAudience =
  | 'For Learners'
  | 'For Mentors'
  | 'Career Growth'
  | 'Freelance & Jobs'
  | 'Courses'
  | 'Platform Safety'

export type BlogTab = 'All' | BlogAudience | BlogCategory

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
  date: string
  readTime: string
  featured: boolean
  tags: string[]
}

export interface BlogTrack {
  key: string
  title: string
  icon: 'learner' | 'mentor' | 'jobs' | 'course'
  articleCount: number
}

export interface BlogContributor {
  id: string
  name: string
  role: string
  avatar: string
  articleCount: number
}

export interface StartHereLink {
  slug: string
  title: string
}
