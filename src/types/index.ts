// Enums
export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  BANNED = "BANNED",
  DEACTIVATED = "DEACTIVATED",
  DELETED = "DELETED",
}

export enum MentorStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum JobStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  CLOSED = "CLOSED",
}

export enum JobType {
  LONG_TERM_MENTORING = "LONG_TERM_MENTORING",
  FREELANCE_PROJECT = "FREELANCE_PROJECT",
  QUICK_FIX = "QUICK_FIX",
}

export enum BudgetType {
  FIXED = "FIXED",
  HOURLY = "HOURLY",
}

export enum CourseStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ARCHIVED = "ARCHIVED",
}

export enum LessonType {
  VIDEO = "VIDEO",
  ARTICLE = "ARTICLE",
  TEXT = "TEXT",
  QUIZ = "QUIZ",
  ASSIGNMENT = "ASSIGNMENT",
  LIVE_SESSION = "LIVE_SESSION",
  DOWNLOADABLE = "DOWNLOADABLE",
  INTERACTIVE = "INTERACTIVE",
  CODE_EXERCISE = "CODE_EXERCISE",
}

export enum TxnType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  JOB_PAYMENT = "JOB_PAYMENT",
  JOB_RELEASE = "JOB_RELEASE",
  JOB_REFUND = "JOB_REFUND",
  COURSE_PURCHASE = "COURSE_PURCHASE",
  COURSE_REFUND = "COURSE_REFUND",
  PLATFORM_FEE = "PLATFORM_FEE",
  WITHDRAWAL_FEE = "WITHDRAWAL_FEE",
  BONUS_CREDIT = "BONUS_CREDIT",
  PENALTY_DEDUCTION = "PENALTY_DEDUCTION",
  WITHDRAWAL_REFUND = "WITHDRAWAL_REFUND",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum TxnStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  REVERSED = "REVERSED",
  FLAGGED = "FLAGGED",
  CANCELLED = "CANCELLED",
}

export enum WalletAccountType {
  USER_AVAILABLE = "USER_AVAILABLE",
  USER_PENDING = "USER_PENDING",
  ESCROW = "ESCROW",
  PLATFORM_FLOAT = "PLATFORM_FLOAT",
  PLATFORM_REVENUE = "PLATFORM_REVENUE",
  SYSTEM_RESERVE = "SYSTEM_RESERVE",
}

export enum EscrowStatus {
  LOCKED = "LOCKED",
  RELEASED = "RELEASED",
  REFUNDED = "REFUNDED",
}

export enum WithdrawalStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export enum PaymentGateway {
  VNPAY = "VNPAY",
  STRIPE = "STRIPE",
  MANUAL = "MANUAL",
}

export enum SupportedLanguage {
  EN = "en",
  VI = "vi",
  ZH = "zh",
  JA = "ja",
}

export enum ProposalStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export enum NotificationType {
  SYSTEM = "SYSTEM",
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  JOB_POSTED = "JOB_POSTED",
  PROPOSAL_SUBMITTED = "PROPOSAL_SUBMITTED",
  PROPOSAL_ACCEPTED = "PROPOSAL_ACCEPTED",
  PROPOSAL_REJECTED = "PROPOSAL_REJECTED",
  CONTRACT_CREATED = "CONTRACT_CREATED",
  CONTRACT_COMPLETED = "CONTRACT_COMPLETED",
  MILESTONE_CREATED = "MILESTONE_CREATED",
  MILESTONE_COMPLETED = "MILESTONE_COMPLETED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_SENT = "PAYMENT_SENT",
  MESSAGE_RECEIVED = "MESSAGE_RECEIVED",
  REVIEW_RECEIVED = "REVIEW_RECEIVED",
}

export enum MessageType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  FILE = "FILE",
  SYSTEM = "SYSTEM",
  CODE = "CODE",
}

export enum ReviewTargetType {
  MENTOR = "MENTOR",
  CLIENT = "CLIENT",
  COURSE = "COURSE",
  JOB = "JOB",
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

// User Types
export interface UserRoleResponse {
  roleId: string;
  roleName: string;
  description?: string;
  grantedBy?: string;
  grantedByName?: string;
  grantedAt: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  countryCode?: string;
  preferredLanguage?: SupportedLanguage;
  status: UserStatus;
  mentorStatus?: MentorStatus;
  profileIsPublic: boolean;
  emailVerified: boolean;
  is2faEnabled: boolean;
  isOnboarded: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleResponse[];
}

export interface UserCreateRequest {
  email: string;
  password: string;
  fullName: string;
  displayName?: string;
  bio?: string;
  phone?: string;
  countryCode?: string;
  preferredLanguage?: SupportedLanguage;
}

export interface UserUpdateRequest {
  fullName?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  countryCode?: string;
  preferredLanguage?: SupportedLanguage;
  profileIsPublic?: boolean;
}

// Mentor Types
export interface MentorProfileResponse {
  id?: string;
  userId: string;
  user: UserResponse;
  headline?: string;
  hourlyRateMxc?: number;
  yearsOfExperience?: number;
  availability?: string;
  responseTimeHours?: number;
  totalJobsDone?: number;
  successRate?: number;
  cvUrl?: string;
  portfolioUrl?: string;
  averageRating?: number;
  totalReviews: number;
  totalEarnings?: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfileRequest {
  headline?: string;
  hourlyRateMxc?: number;
  yearsOfExperience?: number;
  availability?: string;
  responseTimeHours?: number;
  cvUrl?: string;
  portfolioUrl?: string;
}

// Job Types
export interface JobResponse {
  jobId: string;
  clientId: string;
  client: UserResponse;
  categoryId?: number;
  jobType: JobType;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  deadlineAt?: string;
  status: JobStatus;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobCreateRequest {
  clientId: string;
  categoryId?: number;
  jobType: JobType;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  deadlineAt?: string;
}

export interface JobUpdateRequest {
  categoryId?: number;
  jobType?: JobType;
  title?: string;
  description?: string;
  budgetType?: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  deadlineAt?: string;
  status?: JobStatus;
  isFeatured?: boolean;
}

// Course Types
export interface CourseResponse {
  courseId: string;
  instructorId: string;
  instructor: UserResponse;
  instructorName?: string;
  categoryId?: number;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate: boolean;
  previewVideoUrl?: string;
  status: CourseStatus;
  totalEnrollments: number;
  averageRating?: number;
  totalLessons?: number;
  totalDurationMin?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCreateRequest {
  instructorId: string;
  categoryId?: number;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate?: boolean;
  previewVideoUrl?: string;
}

export interface CourseUpdateRequest {
  categoryId?: number;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate?: boolean;
  previewVideoUrl?: string;
  status?: CourseStatus;
}

export interface CourseSectionResponse {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sectionOrder?: number;
  durationMinutes?: number;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLessonResponse {
  id: string;
  sectionId: string;
  title: string;
  description?: string;
  lessonType?: LessonType;
  lessonOrder?: number;
  durationMinutes?: number;
  videoUrl?: string;
  articleContent?: string;
  resourceUrl?: string;
  isFreePreview?: boolean;
  isPublished?: boolean;
  isMandatory?: boolean;
  metadata?: Record<string, unknown>;
  viewCount?: number;
  avgCompletionTime?: number;
  createdAt: string;
  updatedAt: string;
}

// Wallet Types
export interface WalletResponse {
  id: string;
  userId: string;
  userFullName?: string;
  accountType: WalletAccountType;
  balanceMxc: number;
  ledgerHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransactionResponse {
  id: string;
  walletId: string;
  transactionGroupId: string;
  txnType: TxnType;
  direction: "DEBIT" | "CREDIT";
  amountMxc: number;
  balanceAfterMxc: number;
  referenceId?: string;
  referenceType?: string;
  note?: string;
  txnStatus: TxnStatus;
  entryHash?: string;
  prevEntryHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositOrderResponse {
  id: string;
  userId: string;
  gateway: PaymentGateway;
  gatewayOrderId: string;
  realAmount: number;
  realCurrency: string;
  mxcAmount: number;
  exchangeRate: number;
  txnStatus: TxnStatus;
  reconciledAt?: string;
  createdAt: string;
}

export interface WithdrawalResponse {
  id: string;
  userId: string;
  mxcAmount: number;
  feeMxc: number;
  netMxc: number;
  realAmount?: number;
  realCurrency?: string;
  exchangeRate?: number;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  status: WithdrawalStatus;
  gatewayTxnId?: string;
  reviewedAt?: string;
  payoutAt?: string;
  createdAt: string;
}

export interface EscrowRecordResponse {
  id: string;
  contractId: string;
  milestoneId?: string;
  lockedAmountMxc: number;
  platformFeeMxc: number;
  mentorNetMxc: number;
  status: EscrowStatus;
  lockedAt: string;
  releasedAt?: string;
  releasedToUserId?: string;
  releasedToFullName?: string;
  releaseTxnGroupId?: string;
}

export interface DepositCreateRequest {
  amountVnd: number;
  gateway: string;
}

export interface WithdrawCreateRequest {
  mxcAmount: number;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export interface TransferRequest {
  toUserId: string;
  amount: number;
  description?: string;
}

export interface DepositRequest {
  amount: number;
  description?: string;
  paymentMethod?: string;
  externalTxnId?: string;
}

export interface WithdrawalRequest {
  amount: number;
  description?: string;
  withdrawalMethod: string;
  bankAccount?: string;
  paypalEmail?: string;
}

// Proposal Types
export interface ProposalResponse {
  id: string;
  jobId: string;
  jobTitle: string;
  mentorId: string;
  mentorName: string;
  status: ProposalStatus;
  coverLetter: string;
  proposedAmount?: number;
  proposedHourlyRate?: number;
  estimatedDurationDays?: number;
  proposedStartDate?: string;
  proposedDeliveryDate?: string;
  proposedMilestones?: any[];
  relevantExperience?: string;
  portfolioLinks?: string[];
  attachments?: string[];
  questions?: string;
  terms?: string;
  submittedAt: string;
  isFeatured: boolean;
  score?: number;
  isCounterProposal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalCreateRequest {
  jobId: string;
  mentorId: string;
  coverLetter: string;
  proposedAmount?: number;
  proposedHourlyRate?: number;
  estimatedDurationDays?: number;
  proposedStartDate?: string;
  proposedDeliveryDate?: string;
  proposedMilestones?: any[];
  relevantExperience?: string;
  portfolioLinks?: string[];
  attachments?: string[];
  questions?: string;
  terms?: string;
}

// Notification Types
export interface NotificationResponse {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  iconUrl?: string;
  priorityLevel: number;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, any>;
  category?: string;
  groupId?: string;
  isDismissible: boolean;
  requiresAction: boolean;
  actionTaken: boolean;
  actionTakenAt?: string;
  expiresAt?: string;
  isExpired: boolean;
  senderUserId?: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface ChatRoomResponse {
  id: string;
  name?: string;
  type: string;
  lastMessage?: MessageResponse;
  unreadCount: number;
  members: UserResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  messageType: MessageType;
  content: string;
  sentAt: string;
  replyToMessageId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  attachmentUrl?: string;
  attachmentFilename?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  metadata?: Record<string, any>;
  readCount: number;
  isSystemMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review Types
export interface ReviewResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetType: ReviewTargetType;
  targetId: string;
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  timelinessRating: number;
  professionalismRating: number;
  valueRating: number;
  reviewText: string;
  reviewTitle?: string;
  pros?: string;
  cons?: string;
  isVerified: boolean;
  verifiedAt?: string;
  isAnonymous: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  reportCount: number;
  isModerated: boolean;
  moderatedAt?: string;
  moderationNotes?: string;
  isHidden: boolean;
  hiddenReason?: string;
  language?: string;
  contractId?: string;
  wouldRecommend: boolean;
  responseText?: string;
  responseAt?: string;
  responseByUserId?: string;
  helpfulnessRatio: number;
  canBeEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

// Moderation Types
export enum ReportStatus {
  PENDING = "PENDING",
  UNDER_REVIEW = "UNDER_REVIEW",
  ESCALATED = "ESCALATED",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
  ON_HOLD = "ON_HOLD",
  CLOSED = "CLOSED",
}

export enum ReportTargetType {
  USER_PROFILE = "USER_PROFILE",
  JOB_POSTING = "JOB_POSTING",
  COURSE = "COURSE",
  REVIEW = "REVIEW",
  MESSAGE = "MESSAGE",
  COMMENT = "COMMENT",
  MENTOR_PROFILE = "MENTOR_PROFILE",
  COURSE_CONTENT = "COURSE_CONTENT",
  CONTRACT = "CONTRACT",
  PLATFORM_ISSUE = "PLATFORM_ISSUE",
}

export interface ReportResponse {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  reportedUserId: string;
  reportedUserName: string;
  reportCategory: string;
  reason: string;
  status: ReportStatus;
  priorityLevel: number;
  assignedToAdminId?: string;
  assignedAt?: string;
  reviewedAt?: string;
  resolvedAt?: string;
  actionTaken?: string;
  moderatorNotes?: string;
  isUpheld?: boolean;
  isDuplicate?: boolean;
  originalReportId?: string;
  similarReportCount?: number;
  isUrgent: boolean;
  contentHidden: boolean;
  contentHiddenAt?: string;
  evidenceUrls: string[];
  reportContext?: string;
  escalationLevel: number;
  escalatedAt?: string;
  escalationReason?: string;
  slaDeadline?: string;
  slaMet?: boolean;
  resolutionTimeHours?: number;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface CategoryResponse {
  categoryId: number;
  parentCategoryId?: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Matching Preferences

// Notification Types
export interface NotificationResponse {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  iconUrl?: string;
  priorityLevel: number;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, any>;
  category?: string;
  groupId?: string;
  isDismissible: boolean;
  requiresAction: boolean;
  actionTaken: boolean;
  actionTakenAt?: string;
  expiresAt?: string;
  isExpired: boolean;
  senderUserId?: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export interface ChatRoomResponse {
  id: string;
  name?: string;
  type: string;
  lastMessage?: MessageResponse;
  unreadCount: number;
  members: UserResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface MessageResponse {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  messageType: MessageType;
  content: string;
  sentAt: string;
  replyToMessageId?: string;
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  attachmentUrl?: string;
  attachmentFilename?: string;
  attachmentMimeType?: string;
  attachmentSize?: number;
  metadata?: Record<string, any>;
  readCount: number;
  isSystemMessage: boolean;
  createdAt: string;
  updatedAt: string;
}

// Review Types
export interface ReviewResponse {
  id: string;
  reviewerId: string;
  reviewerName: string;
  targetType: ReviewTargetType;
  targetId: string;
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  timelinessRating: number;
  professionalismRating: number;
  valueRating: number;
  reviewText: string;
  reviewTitle?: string;
  pros?: string;
  cons?: string;
  isVerified: boolean;
  verifiedAt?: string;
  isAnonymous: boolean;
  isPublic: boolean;
  isFeatured: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  reportCount: number;
  isModerated: boolean;
  moderatedAt?: string;
  moderationNotes?: string;
  isHidden: boolean;
  hiddenReason?: string;
  language?: string;
  contractId?: string;
  wouldRecommend: boolean;
  responseText?: string;
  responseAt?: string;
  responseByUserId?: string;
  helpfulnessRatio: number;
  canBeEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

// Category Types
export interface CategoryResponse {
  categoryId: number;
  parentCategoryId?: number;
  name: string;
  slug: string;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Matching Types
export interface UserInterestProfileRequest {
  userId: string;
  categoryId: number;
  interestScore: number;
  interactionCount?: number;
  timeSpentMinutes?: number;
  decayFactor?: number;
  isExplicit?: boolean;
}

export interface UserMatchingPreferenceRequest {
  preferredJobTypes?: string[];
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  preferredMentorLang?: string;
}

export interface UserMatchingPreferenceResponse {
  userId: string;
  preferredJobTypes: string[];
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  preferredMentorLang?: string;
}

// Skill Types
export interface SkillResponse {
  id: number;
  slug: string;
  labelEn: string;
  labelVi: string;
  isActive: boolean;
}

export interface UserSkillRequest {
  skillId: number;
  level: string;
}

export interface UserSkillResponse {
  userId: string;
  skillId: number;
  skillName: string;
  level: string;
}

// Consent Types
export interface UserConsentLogRequest {
  docType: string;
  version: string;
}

export interface UserConsentLogResponse {
  id: string;
  userId: string;
  docType: string;
  version: string;
  consentedAt: string;
  ipAddress?: string;
}

// Onboarding Types
export interface OnboardingStepResponse {
  stepName: string;
  stepOrder: number;
  completed: boolean;
  message?: string;
  data?: Record<string, any>;
}

// File Types
export interface FileResponse {
  fileName: string;
  fileUrl: string;
  fileType: string;
  size: number;
}

// Dashboard Types
export interface OnboardingProgressResponse {
  isComplete: boolean;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  nextStep?: string;
  progressPercentage: number;
}

export interface WalletBalanceResponse {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  currency: string;
}

export interface UserActivityResponse {
  activeCoursesCount: number;
  activeContractsCount: number;
  unreadMessagesCount: number;
  pendingProposalsCount: number;
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
}

// Feed Types
export enum FeedItemType {
  MENTOR = "MENTOR",
  COURSE = "COURSE",
  KNOWLEDGE = "KNOWLEDGE",
  JOB = "JOB",
}

export interface MentorRecommendationResponse {
  mentorId: string;
  userId: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  headline?: string;
  hourlyRateMxc?: number;
  yearsOfExperience?: number;
  availability?: string;
  averageRating?: number;
  totalReviews: number;
  totalEarnings?: number;
  isFeatured: boolean;
  skills: string[];
  categories: string[];
  matchScore: number;
}

export interface CourseRecommendationResponse {
  courseId: string;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate: boolean;
  instructorId: string;
  instructorName: string;
  instructorAvatarUrl?: string;
  averageRating?: number;
  totalEnrollments: number;
  totalDurationMinutes?: number;
  categoryName?: string;
  matchScore: number;
}

export interface KnowledgeRecommendationResponse {
  id: string;
  title: string;
  excerpt: string;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  readTimeMinutes: number;
  publishedAt: string;
  matchScore: number;
  skillLevel?: string;
}

export interface JobRecommendationResponse {
  jobId: string;
  title: string;
  description: string;
  budgetType: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  deadlineAt?: string;
  clientId: string;
  clientName: string;
  clientAvatarUrl?: string;
  categoryName?: string;
  proposalCount: number;
  matchScore: number;
  isFeatured: boolean;
}

export interface PersonalizedFeedResponse {
  mentors: MentorRecommendationResponse[];
  courses: CourseRecommendationResponse[];
  knowledge: KnowledgeRecommendationResponse[];
  jobs: JobRecommendationResponse[];
  source: "CACHE" | "DATABASE" | "REAL_TIME" | "POPULAR_FALLBACK";
  generatedAt: string;
}
