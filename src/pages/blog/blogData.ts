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

export type BlogTab = 'All' | BlogAudience

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

export interface Pathway {
  id: string
  title: string
  description: string
  icon: 'learner' | 'mentor' | 'jobs' | 'course'
  articleCount: number
  progress: number
}

export interface MentorInsight {
  id: string
  quote: string
  mentor: string
  role: string
}

export const BLOG_TABS: BlogTab[] = [
  'All',
  'For Learners',
  'For Mentors',
  'Career Growth',
  'Freelance & Jobs',
  'Courses',
  'Platform Safety',
]

// BLOG_POSTS data removed - now fetched from API

export const PATHWAYS: Pathway[] = [
  {
    id: 'path-1',
    title: 'Find the Right Mentor',
    description: 'Define your goal, evaluate fit, and build a high-signal mentoring plan.',
    icon: 'learner',
    articleCount: 12,
    progress: 72,
  },
  {
    id: 'path-2',
    title: 'Become a Trusted Mentor',
    description: 'Move from expertise to guidance with clear positioning and repeatable session systems.',
    icon: 'mentor',
    articleCount: 10,
    progress: 58,
  },
  {
    id: 'path-3',
    title: 'Win Better Jobs',
    description: 'Improve proposal quality, negotiation clarity, and delivery confidence.',
    icon: 'jobs',
    articleCount: 11,
    progress: 64,
  },
  {
    id: 'path-4',
    title: 'Build Your First Course',
    description: 'Turn practical expertise into structured course outcomes learners can apply.',
    icon: 'course',
    articleCount: 9,
    progress: 46,
  },
]

export const POPULAR_TOPICS = [
  'Mentor fit checklist',
  'Proposal quality',
  'Escrow safety',
  'Learning roadmap',
  'Mentor pricing',
  'Course launch',
  'Dispute flow',
]

export const MENTOR_INSIGHTS: MentorInsight[] = [
  {
    id: 'insight-1',
    quote: 'The strongest mentoring sessions end with one clear decision and one measurable next step.',
    mentor: 'Anh Tran',
    role: 'Senior React Native Mentor',
  },
  {
    id: 'insight-2',
    quote: 'Scope clarity is the fastest way to reduce project stress for both clients and mentors.',
    mentor: 'Ha Do',
    role: 'Mentor Success Lead',
  },
  {
    id: 'insight-3',
    quote: 'Freelance confidence comes from outcome framing, not from discounting your value.',
    mentor: 'Duc Pham',
    role: 'Freelance Advisor',
  },
]

export const START_HERE = [
  'Choose your first mentor with goal-match criteria',
  'Write a clear job brief before requesting proposals',
  'Plan your first three mentoring sessions with milestones',
]
