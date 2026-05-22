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

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-01',
    slug: 'how-to-choose-the-right-mentor-for-your-career',
    title: 'How to Choose the Right Mentor for Your Career',
    excerpt:
      'A practical framework to evaluate mentor fit by goals, communication style, and outcome evidence before committing time and budget.',
    category: 'Career Growth',
    audience: 'For Learners',
    author: 'Linh Tran',
    authorRole: 'Career Mentor',
    authorAvatar: 'https://i.pravatar.cc/120?img=32',
    coverImage:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop',
    date: 'May 18, 2026',
    readTime: '7 min read',
    featured: true,
    tags: ['mentor-fit', 'career'],
  },
  {
    id: 'post-02',
    slug: 'from-user-to-mentor-building-your-first-mentor-profile',
    title: 'From User to Mentor: Building Your First Mentor Profile',
    excerpt:
      'Position your strengths, define your mentoring promise, and build profile credibility that attracts serious learners.',
    category: 'Mentoring',
    audience: 'For Mentors',
    author: 'Ha Do',
    authorRole: 'Mentor Success Lead',
    authorAvatar: 'https://i.pravatar.cc/120?img=45',
    coverImage:
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop',
    date: 'May 16, 2026',
    readTime: '6 min read',
    featured: true,
    tags: ['mentor-mode', 'profile'],
  },
  {
    id: 'post-03',
    slug: 'how-escrow-protects-clients-and-mentors',
    title: 'How Escrow Protects Clients and Mentors',
    excerpt:
      'Understand milestone releases, dispute windows, and acceptance rules that keep both clients and mentors safe.',
    category: 'Platform Safety',
    audience: 'Platform Safety',
    author: 'Mentor X Ops',
    authorRole: 'Marketplace Operations',
    authorAvatar: 'https://i.pravatar.cc/120?img=5',
    coverImage:
      'https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=1600&auto=format&fit=crop',
    date: 'May 15, 2026',
    readTime: '5 min read',
    featured: true,
    tags: ['escrow', 'trust'],
  },
  {
    id: 'post-04',
    slug: 'designing-a-learning-roadmap-that-actually-works',
    title: 'Designing a Learning Roadmap That Actually Works',
    excerpt:
      'Replace random tutorials with milestone-driven progression, mentor checkpoints, and measurable outcomes.',
    category: 'Courses',
    audience: 'For Learners',
    author: 'Thao Nguyen',
    authorRole: 'Learning Designer',
    authorAvatar: 'https://i.pravatar.cc/120?img=47',
    coverImage:
      'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1600&auto=format&fit=crop',
    date: 'May 14, 2026',
    readTime: '8 min read',
    featured: false,
    tags: ['roadmap', 'learning-system'],
  },
  {
    id: 'post-05',
    slug: 'how-to-write-a-winning-proposal',
    title: 'How to Write a Winning Proposal',
    excerpt:
      'A proposal structure that makes value obvious, reduces ambiguity, and improves acceptance rates in mentor job marketplaces.',
    category: 'Freelance & Jobs',
    audience: 'Freelance & Jobs',
    author: 'Duc Pham',
    authorRole: 'Freelance Advisor',
    authorAvatar: 'https://i.pravatar.cc/120?img=12',
    coverImage:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1600&auto=format&fit=crop',
    date: 'May 13, 2026',
    readTime: '6 min read',
    featured: false,
    tags: ['proposal', 'scope'],
  },
  {
    id: 'post-06',
    slug: 'turning-your-expertise-into-a-paid-course',
    title: 'Turning Your Expertise Into a Paid Course',
    excerpt:
      'Convert practical knowledge into a structured course with clear outcomes, pacing, and high completion potential.',
    category: 'Courses',
    audience: 'For Mentors',
    author: 'Kiet Le',
    authorRole: 'Course Creator Mentor',
    authorAvatar: 'https://i.pravatar.cc/120?img=18',
    coverImage:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1600&auto=format&fit=crop',
    date: 'May 12, 2026',
    readTime: '9 min read',
    featured: false,
    tags: ['course-creation', 'monetization'],
  },
  {
    id: 'post-07',
    slug: 'building-trust-in-online-mentorship',
    title: 'Building Trust in Online Mentorship',
    excerpt:
      'Trust grows through expectation clarity, response discipline, and transparent progress signals throughout the mentoring journey.',
    category: 'Mentoring',
    audience: 'For Learners',
    author: 'Phuong Nguyen',
    authorRole: 'Product Design Mentor',
    authorAvatar: 'https://i.pravatar.cc/120?img=48',
    coverImage:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop',
    date: 'May 10, 2026',
    readTime: '6 min read',
    featured: false,
    tags: ['trust', 'communication'],
  },
  {
    id: 'post-08',
    slug: 'managing-disputes-professionally',
    title: 'Managing Disputes Professionally',
    excerpt:
      'A practical playbook for resolving scope and delivery disagreements while preserving outcomes and professionalism.',
    category: 'Platform Safety',
    audience: 'Platform Safety',
    author: 'Mentor X Moderation',
    authorRole: 'Trust & Safety Team',
    authorAvatar: 'https://i.pravatar.cc/120?img=9',
    coverImage:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600&auto=format&fit=crop',
    date: 'May 8, 2026',
    readTime: '5 min read',
    featured: false,
    tags: ['dispute', 'escalation'],
  },
  {
    id: 'post-09',
    slug: 'what-makes-a-great-mentor-session',
    title: 'What Makes a Great Mentor Session',
    excerpt:
      'High-signal sessions balance context, constraints, and concrete next actions. Use this template to keep every session useful.',
    category: 'Mentoring',
    audience: 'For Mentors',
    author: 'Anh Tran',
    authorRole: 'Senior React Native Mentor',
    authorAvatar: 'https://i.pravatar.cc/120?img=13',
    coverImage:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1600&auto=format&fit=crop',
    date: 'May 6, 2026',
    readTime: '7 min read',
    featured: false,
    tags: ['session-design', 'mentoring'],
  },
  {
    id: 'post-10',
    slug: 'how-mx-credits-work-in-mentor-x',
    title: 'How MX-Credits Work in Mentor X',
    excerpt:
      'A clear guide to wallet balances, session charges, refunds, and where MX-Credits fit in learning and mentoring purchases.',
    category: 'Platform Safety',
    audience: 'Platform Safety',
    author: 'Mentor X Finance',
    authorRole: 'Wallet Product Team',
    authorAvatar: 'https://i.pravatar.cc/120?img=25',
    coverImage:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=1600&auto=format&fit=crop',
    date: 'May 4, 2026',
    readTime: '4 min read',
    featured: false,
    tags: ['mxc-wallet', 'payments'],
  },
  {
    id: 'post-11',
    slug: 'how-to-price-your-mentor-packages',
    title: 'How to Price Your Mentor Packages',
    excerpt:
      'Price with confidence by anchoring on outcomes, session depth, and accountability scope instead of generic hourly comparisons.',
    category: 'Career Growth',
    audience: 'For Mentors',
    author: 'Minh Le',
    authorRole: 'Mentor Business Coach',
    authorAvatar: 'https://i.pravatar.cc/120?img=15',
    coverImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop',
    date: 'May 2, 2026',
    readTime: '6 min read',
    featured: false,
    tags: ['pricing', 'mentor-packages'],
  },
  {
    id: 'post-12',
    slug: 'course-launch-checklist-for-new-mentors',
    title: 'Course Launch Checklist for New Mentors',
    excerpt:
      'A launch checklist covering curriculum quality, learner onboarding, pricing, and post-launch iteration loops.',
    category: 'Courses',
    audience: 'Courses',
    author: 'Trang Hoang',
    authorRole: 'Course Program Lead',
    authorAvatar: 'https://i.pravatar.cc/120?img=27',
    coverImage:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop',
    date: 'April 30, 2026',
    readTime: '8 min read',
    featured: false,
    tags: ['launch', 'curriculum'],
  },
]

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
