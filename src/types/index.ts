// Enums
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum MentorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum JobStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export enum JobType {
  FIXED_PRICE = 'FIXED_PRICE',
  HOURLY = 'HOURLY',
  QUICK_SUPPORT = 'QUICK_SUPPORT',
}

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum TxnType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum TxnStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum WalletAccountType {
  PRIMARY = 'PRIMARY',
  ESCROW = 'ESCROW',
  SAVINGS = 'SAVINGS',
}

export enum SupportedLanguage {
  EN = 'EN',
  VI = 'VI',
  ES = 'ES',
  FR = 'FR',
  DE = 'DE',
  ZH = 'ZH',
  JA = 'JA',
  KO = 'KO',
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  timestamp?: string
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// Auth Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

// User Types
export interface UserResponse {
  userId: string
  email: string
  fullName: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  phone?: string
  countryCode?: string
  preferredLanguage?: SupportedLanguage
  status: UserStatus
  mentorStatus?: MentorStatus
  profileIsPublic: boolean
  emailVerified: boolean
  twoFactorEnabled: boolean
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
}

export interface UserCreateRequest {
  email: string
  password: string
  fullName: string
  displayName?: string
  bio?: string
  phone?: string
  countryCode?: string
  preferredLanguage?: SupportedLanguage
}

export interface UserUpdateRequest {
  fullName?: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  phone?: string
  countryCode?: string
  preferredLanguage?: SupportedLanguage
  profileIsPublic?: boolean
}

// Mentor Types
export interface MentorProfileResponse {
  userId: string
  user: UserResponse
  headline?: string
  hourlyRateMxc?: number
  yearsOfExperience?: number
  availability?: string
  responseTimeHours?: number
  cvUrl?: string
  portfolioUrl?: string
  averageRating?: number
  totalReviews: number
  totalEarnings?: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface MentorProfileRequest {
  headline?: string
  hourlyRateMxc?: number
  yearsOfExperience?: number
  availability?: string
  responseTimeHours?: number
  cvUrl?: string
  portfolioUrl?: string
}

// Job Types
export interface JobResponse {
  jobId: string
  clientId: string
  client: UserResponse
  categoryId?: number
  jobType: JobType
  title: string
  description: string
  budgetType: BudgetType
  budgetMinMxc?: number
  budgetMaxMxc?: number
  hourlyRateMxc?: number
  estimatedHours?: number
  deadlineAt?: string
  status: JobStatus
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface JobCreateRequest {
  clientId: string
  categoryId?: number
  jobType: JobType
  title: string
  description: string
  budgetType: BudgetType
  budgetMinMxc?: number
  budgetMaxMxc?: number
  hourlyRateMxc?: number
  estimatedHours?: number
  deadlineAt?: string
}

export interface JobUpdateRequest {
  categoryId?: number
  jobType?: JobType
  title?: string
  description?: string
  budgetType?: BudgetType
  budgetMinMxc?: number
  budgetMaxMxc?: number
  hourlyRateMxc?: number
  estimatedHours?: number
  deadlineAt?: string
  status?: JobStatus
  isFeatured?: boolean
}

// Course Types
export interface CourseResponse {
  courseId: string
  instructorId: string
  instructor: UserResponse
  categoryId?: number
  title: string
  slug: string
  description?: string
  thumbnailUrl?: string
  priceMxc?: number
  language?: SupportedLanguage
  level?: string
  isCertificate: boolean
  previewVideoUrl?: string
  status: CourseStatus
  totalEnrollments: number
  averageRating?: number
  createdAt: string
  updatedAt: string
}

export interface CourseCreateRequest {
  instructorId: string
  categoryId?: number
  title: string
  slug: string
  description?: string
  thumbnailUrl?: string
  priceMxc?: number
  language?: SupportedLanguage
  level?: string
  isCertificate?: boolean
  previewVideoUrl?: string
}

export interface CourseUpdateRequest {
  categoryId?: number
  title?: string
  description?: string
  thumbnailUrl?: string
  priceMxc?: number
  language?: SupportedLanguage
  level?: string
  isCertificate?: boolean
  previewVideoUrl?: string
  status?: CourseStatus
}

// Wallet Types
export interface WalletResponse {
  walletId: string
  userId: string
  accountType: WalletAccountType
  balanceMxc: number
  availableBalanceMxc: number
  pendingBalanceMxc: number
  createdAt: string
  updatedAt: string
}

export interface WalletTransactionResponse {
  txnId: string
  walletId: string
  txnType: TxnType
  amount: number
  balanceAfter: number
  status: TxnStatus
  description?: string
  createdAt: string
}

export interface DepositRequest {
  amount: number
  description?: string
  paymentMethod?: string
  externalTxnId?: string
}

export interface WithdrawalRequest {
  amount: number
  description?: string
  withdrawalMethod: string
  bankAccount?: string
  paypalEmail?: string
}

export interface TransferRequest {
  toUserId: string
  amount: number
  description?: string
}
