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
  NOT_APPLIED = "NOT_APPLIED",
  NONE = "NONE",
  PENDING_KYC = "PENDING_KYC",
  KYC_SUBMITTED = "KYC_SUBMITTED",
  KYC_VERIFIED = "KYC_VERIFIED",
  KYC_REJECTED = "KYC_REJECTED",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
  REVOKED = "REVOKED",
}

export enum VerificationStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  NEEDS_MORE_INFO = "NEEDS_MORE_INFO",
}

export enum IdentityDocumentType {
  CCCD = "CCCD",
  CMND = "CMND",
  PASSPORT = "PASSPORT",
  NATIONAL_ID = "NATIONAL_ID",
  DRIVER_LICENSE = "DRIVER_LICENSE",
}

export enum PayoutMethod {
  LOCAL_BANK = "LOCAL_BANK",
  INTERNATIONAL_BANK = "INTERNATIONAL_BANK",
  PAYPAL = "PAYPAL",
  WISE = "WISE",
  STRIPE_CONNECT = "STRIPE_CONNECT",
}

export enum UserMode {
  USER = "USER",
  MENTOR = "MENTOR",
}

export enum JobStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  CLOSED = "CLOSED",
  ON_HOLD = "ON_HOLD",
  EXPIRED = "EXPIRED",
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

export enum JobSort {
  NEWEST = "NEWEST",
  BUDGET_ASC = "BUDGET_ASC",
  BUDGET_DESC = "BUDGET_DESC",
  POPULAR = "POPULAR",
  RELEVANCE = "RELEVANCE",
}

export enum CourseStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
  ARCHIVED = "ARCHIVED",
}

export enum CourseProductType {
  COURSE = "COURSE",
  DOCUMENT = "DOCUMENT",
}

export enum LessonType {
  LESSON = "LESSON",
  DOCUMENT = "DOCUMENT",
  QUIZ = "QUIZ",
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
  REJECTED = "REJECTED",
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
  UNDER_REVIEW = "UNDER_REVIEW",
  SHORTLISTED = "SHORTLISTED",
  OFFER_ACCEPTED = "OFFER_ACCEPTED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
  AUTO_CLOSED = "AUTO_CLOSED",
  CONTRACT_CANCELLED = "CONTRACT_CANCELLED",
  EXPIRED = "EXPIRED",
  INTERVIEW_REQUESTED = "INTERVIEW_REQUESTED",
  NEGOTIATING = "NEGOTIATING",
}

export enum ContractStatus {
  DRAFT = "DRAFT",
  PENDING_SIGNATURE = "PENDING_SIGNATURE",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  TERMINATED = "TERMINATED",
  IN_DISPUTE = "IN_DISPUTE",
  EXPIRED = "EXPIRED",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  UNDER_REVIEW = "UNDER_REVIEW",
}

export enum DisputeStatus {
  OPEN = "OPEN",
  AWAITING_RESPONSE = "AWAITING_RESPONSE",
  INVESTIGATING = "INVESTIGATING",
  EVIDENCE_REVIEW = "EVIDENCE_REVIEW",
  IN_MEDIATION = "IN_MEDIATION",
  IN_ARBITRATION = "IN_ARBITRATION",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  WITHDRAWN = "WITHDRAWN",
}

export enum NotificationType {
  SYSTEM = "SYSTEM",
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARNING = "WARNING",
  ERROR = "ERROR",
  NEW_MESSAGE = "NEW_MESSAGE",
  FEATURE_UPDATE = "FEATURE_UPDATE",
  COURSE_UPDATED = "COURSE_UPDATED",
  JOB_APPLICATION_RECEIVED = "JOB_APPLICATION_RECEIVED",
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

export interface CategoryResponse {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
  parentId?: number;
  parentCategoryId?: number;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
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
  expertiseStatus?: VerificationStatus;
  identityStatus?: VerificationStatus;
  payoutStatus?: VerificationStatus;
  verifiedMentorBadge?: boolean;
  canSwitchToMentorMode?: boolean;
  canRequestWithdrawal?: boolean;
  profileIsPublic: boolean;
  emailVerified: boolean;
  is2faEnabled: boolean;
  isOnboarded: boolean;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleResponse[];
  badges?: any[];
  availableModes?: UserMode[];
  currentMode?: UserMode;
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

export interface BankAccountResponse {
  id: string;
  userId: string;
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountHolderName: string;
  branchName?: string;
  payoutCountry?: string;
  payoutMethod?: PayoutMethod;
  iban?: string;
  swiftCode?: string;
  paypalEmail?: string;
  wiseEmail?: string;
  stripeConnectAccountId?: string;
  isDefault: boolean;
  isVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccountRequest {
  bankName: string;
  bankCode?: string;
  accountNumber: string;
  accountHolderName: string;
  branchName?: string;
  payoutCountry: string;
  payoutMethod?: PayoutMethod;
  iban?: string;
  swiftCode?: string;
  paypalEmail?: string;
  wiseEmail?: string;
  stripeConnectAccountId?: string;
  isDefault?: boolean;
  notes?: string;
}

// Mentor Types
export interface ProofLink {
  label: string;
  url: string;
}

export interface MentorProfileResponse {
  id?: string;
  proofLinks?: ProofLink[];
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
  videoIntroUrl?: string;
  location?: string;
  languages?: string[];
  expertiseStatus?: VerificationStatus;
  expertiseReviewNote?: string;
  expertiseRejectionReason?: string;
  expertiseReviewedBy?: string;
  expertiseReviewedByName?: string;
  expertiseReviewedAt?: string;
  resubmissionAllowed?: boolean;
  legalName?: string;
  dateOfBirth?: string;
  countryOfResidence?: string;
  identityStatus?: VerificationStatus;
  identityRequired?: boolean;
  identityDocumentType?: IdentityDocumentType;
  documentNumberMasked?: string;
  identityVerifiedAt?: string;
  identityVerifiedBy?: string;
  identityVerifiedByName?: string;
  identityRejectionReason?: string;
  verificationProvider?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  currentTitle?: string;
  currentCompany?: string;
  primaryDomain?: string;
  skills?: string[];
  professionalBio?: string;
  helpDescription?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioEvidenceUrl?: string;
  certificateUrl?: string;
  payoutStatus?: VerificationStatus;
  payoutAccountHolderName?: string;
  payoutBankName?: string;
  payoutAccountNumberMasked?: string;
  payoutCountry?: string;
  payoutMethod?: PayoutMethod;
  iban?: string;
  swiftCode?: string;
  paypalEmail?: string;
  wiseEmail?: string;
  stripeConnectAccountId?: string;
  payoutRejectionReason?: string;
  payoutReviewedBy?: string;
  payoutReviewedByName?: string;
  payoutReviewedAt?: string;
  mentorAgreementAccepted?: boolean;
  disputePolicyAccepted?: boolean;
  submittedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  averageRating?: number;
  totalReviews: number;
  totalEarnings?: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfileRequest {
  proofLinks?: ProofLink[];
  headline?: string;
  hourlyRateMxc?: number;
  yearsOfExperience?: number;
  availability?: string;
  cvUrl?: string;
  portfolioUrl?: string;
  videoIntroUrl?: string;
  location?: string;
  languages?: string[];
  currentTitle?: string;
  currentCompany?: string;
  primaryDomain?: string;
  skills?: string[];
  professionalBio?: string;
  helpDescription?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioEvidenceUrl?: string;
  certificateUrl?: string;
  mentorAgreementAccepted?: boolean;
  disputePolicyAccepted?: boolean;
}

// Job Types
export interface JobResponse {
  jobId: string;
  clientId: string;
  client?: UserResponse;
  clientName?: string;
  categoryId?: number;
  customCategoryName?: string;
  jobType: JobType;
  title: string;
  description: string;
  requiredSkills?: string[];
  experienceLevel?: string;
  currentLevel?: string;
  learningGoals?: string;
  successCriteria?: string;
  availabilityExpectation?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  communicationPreference?: string;
  budgetType: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  startDate?: string;
  deadlineAt?: string;
  status: JobStatus;
  isFeatured: boolean;
  attachmentUrl?: string;
  attachments?: string[];
  statusReason?: string;
  proposalCount?: number;
  viewCount?: number;
  publishedAt?: string;
  closedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
}

export interface ContractResponse {
  id: string;
  jobId: string;
  jobTitle: string;
  proposalId?: string;
  clientId: string;
  clientName: string;
  mentorId: string;
  mentorName: string;
  status: ContractStatus;
  title: string;
  description: string;
  totalAmount: number;
  hourlyRate?: number;
  startDate?: string;
  endDate?: string;
  deadlineAt?: string;
  scopeDescription?: string;
  actualStartDate?: string;
  actualCompletionDate?: string;
  termsAndConditions?: string;
  paymentTerms?: string;
  deliverables?: string;
  clientSignedAt?: string;
  mentorSignedAt?: string;
  activatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationRequestStatus?: 'PENDING' | 'REJECTED' | 'APPROVED';
  cancellationRequestedByUserId?: string;
  cancellationRequestedByName?: string;
  cancellationRequestedAt?: string;
  cancellationRequestReason?: string;
  cancellationRespondedByUserId?: string;
  cancellationRespondedByName?: string;
  cancellationRespondedAt?: string;
  cancellationResponseNote?: string;
  milestoneCount: number;
  completedMilestoneCount: number;
  amountPaid: number;
  amountInEscrow: number;
  fundsInEscrow: boolean;
  progressPercentage: number;
  isRenewable?: boolean;
  autoRenewal?: boolean;
  renewalTerms?: string;
  ndaRequired?: boolean;
  ndaSigned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeResponse {
  id: string;
  initiatorId: string;
  initiatorName: string;
  respondentId: string;
  respondentName: string;
  contractId?: string;
  jobId?: string;
  title: string;
  description: string;
  disputeCategory: string;
  status: DisputeStatus;
  priorityLevel: number;
  disputedAmountMxc?: number;
  refundRequestedMxc?: number;
  mediatorId?: string;
  respondentResponse?: string;
  responseDeadline?: string;
  resolvedAt?: string;
  resolutionDetails?: string;
  refundAmountMxc?: number;
  fundsInEscrow?: boolean;
  evidenceUrls?: string[];
  requiresArbitration?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobCreateRequest {
  clientId: string;
  categoryId?: number;
  customCategoryName?: string;
  jobType: JobType;
  title: string;
  description: string;
  requiredSkills?: string[];
  experienceLevel?: string;
  currentLevel?: string;
  learningGoals?: string;
  successCriteria?: string;
  availabilityExpectation?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  communicationPreference?: string;
  budgetType: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  deadlineAt?: string;
  attachmentUrl?: string;
  attachments?: string[];
  status?: JobStatus;
}

export interface JobUpdateRequest {
  categoryId?: number;
  customCategoryName?: string;
  jobType?: JobType;
  title?: string;
  description?: string;
  requiredSkills?: string[];
  experienceLevel?: string;
  currentLevel?: string;
  learningGoals?: string;
  successCriteria?: string;
  availabilityExpectation?: string;
  availabilityStartTime?: string;
  availabilityEndTime?: string;
  communicationPreference?: string;
  budgetType?: BudgetType;
  budgetMinMxc?: number;
  budgetMaxMxc?: number;
  hourlyRateMxc?: number;
  estimatedHours?: number;
  deadlineAt?: string;
  status?: JobStatus;
  isFeatured?: boolean;
  attachmentUrl?: string;
  attachments?: string[];
}

// Course Types
export interface CourseResponse {
  id?: string;
  courseId: string;
  instructorId: string;
  instructor: UserResponse;
  instructorName?: string;
  categoryId?: number;
  skills?: string[];
  skillIds?: number[];
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate: boolean;
  previewVideoUrl?: string;
  productType?: CourseProductType;
  status: CourseStatus;
  totalEnrollments: number;
  averageRating?: number;
  totalLessons?: number;
  totalDurationMin?: number;
  totalReviews?: number;
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCreateRequest {
  instructorId: string;
  categoryId: number;
  skills?: string[];
  skillIds: number[];
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate?: boolean;
  previewVideoUrl?: string;
  productType?: CourseProductType;
}

export interface CourseUpdateRequest {
  categoryId?: number;
  skills?: string[];
  skillIds?: number[];
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  priceMxc?: number;
  language?: SupportedLanguage;
  level?: string;
  isCertificate?: boolean;
  previewVideoUrl?: string;
  productType?: CourseProductType;
  status?: CourseStatus;
}

export interface CourseEnrollmentResponse {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  amountPaidMxc: number;
  progressPercent: number;
  isCompleted: boolean;
  certificateUrl?: string;
  certificateCode?: string;
  certificateIssuedAt?: string;
  enrolledAt: string;
  completedAt?: string;
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

export interface LessonProgressResponse {
  enrollmentId: string;
  lessonId: string;
  lessonTitle?: string;
  isCompleted: boolean;
  completedAt?: string;
  watchDurationSec: number;
  progressPercent: number;
  scrollPercent: number;
  activeTimeSec: number;
  lastPositionSec: number;
  completedByRule: boolean;
}

export enum QuizQuestionType {
  SINGLE_CHOICE = "SINGLE_CHOICE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  TEXT_ANSWER = "TEXT_ANSWER",
}

export interface QuizQuestionResponse {
  id: string;
  lessonId: string;
  questionType: QuizQuestionType;
  questionText: string;
  answerDataJson: string;
  points: number;
  explanation?: string;
  orderIndex: number;
}

export interface QuizAttemptResponse {
  id: string;
  enrollmentId: string;
  lessonId: string;
  score: number;
  maxScore: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface CourseQaMessageResponse {
  id: string;
  courseId: string;
  lessonId?: string;
  senderId: string;
  recipientId?: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface CourseQaSummaryResponse {
  courseId: string;
  unansweredLearners: number;
}

export interface CourseStatsResponse {
  courseId: string;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
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
  originalAmount?: number | string;
  originalCurrency?: string;
  exchangeRateToVnd?: number | string;
  convertedAmountVnd?: number | string;
  amountMxc: number | string;
  balanceAfterMxc: number | string;
  referenceId?: string;
  referenceType?: string;
  note?: string;
  txnStatus: TxnStatus;
  gateway?: string;
  gatewayTransactionId?: string;
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
  realAmount: number | string;
  realCurrency: string;
  convertedAmountVnd?: number | string;
  mxcAmount: number | string;
  exchangeRate: number | string;
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
  payoutCountry?: string;
  payoutMethod?: PayoutMethod;
  payoutReference?: string;
  status: WithdrawalStatus;
  gatewayTxnId?: string;
  user?: {
    fullName: string;
  };
  rejectionReason?: string;
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
  amount?: string;
  amountVnd?: string;
  currency?: string;
  gateway: string;
}

export interface WalletConversionPreviewRequest {
  originalAmount: string;
  originalCurrency: string;
}

export interface WalletConversionPreviewResponse {
  originalAmount: string | number;
  originalCurrency: string;
  exchangeRateToVnd: string | number;
  convertedAmountVnd: string | number;
  amountMxc: string | number;
}

export interface WithdrawCreateRequest {
  mxcAmount: number;
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  payoutCountry?: string;
  payoutMethod?: PayoutMethod;
  payoutReference?: string;
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
  deadlineAt?: string;
  scopeDescription?: string;
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
  viewCount: number;
  rejectionReason?: string;
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
  deadlineAt?: string;
  scopeDescription?: string;
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
export interface ChatRoomMemberSummary {
  userId: string;
  fullName: string;
  displayName?: string;
  avatarUrl?: string;
  memberRole: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface ChatRoomResponse {
  id: string;
  roomType: string;
  roomName: string;
  description?: string;
  createdByUserId: string;
  isActive: boolean;
  isPrivate: boolean;
  maxMembers: number;
  memberCount: number;
  unreadCount: number;
  referenceId?: string;
  referenceType?: string;
  lastActivityAt?: string;
  lastMessageId?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  messageCount: number;
  roomSettings?: Record<string, any>;
  avatarUrl?: string;
  members: ChatRoomMemberSummary[];
  isArchived: boolean;
  archivedAt?: string;
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
  interestedDomainIds?: number[];
  preferredSkillIds?: number[];
  learningGoals?: string[];
  preferredLanguages?: string[];
  onboardingCompleted?: boolean;
}

export interface UserMatchingPreferenceResponse {
  userId: string;
  interestedDomainIds: number[];
  preferredSkillIds: number[];
  learningGoals: string[];
  preferredLanguages: string[];
  onboardingCompleted: boolean;
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

// Complaint Types
export enum ComplaintStatus {
  OPEN = "OPEN",
  AWAITING_RESPONSE = "AWAITING_RESPONSE",
  INVESTIGATING = "INVESTIGATING",
  EVIDENCE_REVIEW = "EVIDENCE_REVIEW",
  IN_MEDIATION = "IN_MEDIATION",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  WITHDRAWN = "WITHDRAWN",
  EXPIRED = "EXPIRED",
}

export enum ComplaintOutcome {
  FAVOR_COMPLAINANT = "FAVOR_COMPLAINANT",
  FAVOR_RESPONDENT = "FAVOR_RESPONDENT",
  COMPROMISE = "COMPROMISE",
  MUTUAL_AGREEMENT = "MUTUAL_AGREEMENT",
  INVALID_COMPLAINT = "INVALID_COMPLAINT",
  WARNING_ISSUED = "WARNING_ISSUED",
  NO_OUTCOME = "NO_OUTCOME",
}

export interface ComplaintEvidence {
  id: string;
  complaintId: string;
  submittedByUserId: string;
  evidenceType: string;
  title: string;
  description?: string;
  fileUrl?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  isReviewed: boolean;
  reviewedAt?: string;
  reviewedByUserId?: string;
  reviewNotes?: string;
  isFlagged: boolean;
  flagReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintResponse {
  id: string;
  complainantId: string;
  respondentId: string;
  sessionId?: string;
  bookingId?: string;
  title: string;
  description: string;
  complaintCategory: string;
  status: ComplaintStatus;
  priorityLevel: number;
  mediatorId?: string;
  mediatorAssignedAt?: string;
  respondentNotifiedAt?: string;
  respondentRespondedAt?: string;
  respondentResponse?: string;
  responseDeadline?: string;
  mediationStartedAt?: string;
  resolvedAt?: string;
  outcome?: ComplaintOutcome;
  resolutionDetails?: string;
  resolutionTimeHours?: number;
  slaMet?: boolean;
  evidence?: ComplaintEvidence[];
  createdAt: string;
  updatedAt: string;
}

export function complaintPriorityBucket(level?: number): 'low' | 'medium' | 'high' | 'urgent' {
  if (level === undefined || level === null) return 'medium'
  if (level >= 5) return 'urgent'
  if (level >= 4) return 'high'
  if (level >= 2) return 'medium'
  return 'low'
}

// Feed Types
export enum FeedItemType {
  MENTOR = "MENTOR",
  COURSE = "COURSE",
  KNOWLEDGE = "KNOWLEDGE",
  JOB = "JOB",
}

export enum PackageType {
  SINGLE_SESSION = "SINGLE_SESSION",
  PACKAGE_DEAL = "PACKAGE_DEAL",
  SUBSCRIPTION = "SUBSCRIPTION",
}

export interface MentorPackageResponse {
  id: string;
  mentorProfileId: string;
  title: string;
  description: string;
  packageType: PackageType;
  durationHours: number;
  priceMxc: number;
  features: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MentorPackageRequest {
  title: string;
  description: string;
  packageType: PackageType;
  durationHours: number;
  priceMxc: number;
  features?: string[];
  isActive?: boolean;
  displayOrder?: number;
}

export interface MentorOfferingResponse {
  id: string;
  mentorProfileId: string;
  title: string;
  description: string;
  priceMxc: number;
  durationHours: number;
  level: string;
  lessonsCount: number;
  thumbnailUrl?: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MentorOfferingRequest {
  title: string;
  description: string;
  priceMxc: number;
  durationHours: number;
  level: string;
  lessonsCount: number;
  thumbnailUrl?: string;
}

export interface MentorAvailabilityResponse {
  id: string;
  mentorProfileId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MentorBlockedDateResponse {
  id: string;
  mentorProfileId: string;
  blockedDate: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MentorWeeklyAvailabilityResponse {
  weeklySchedule: Record<number, MentorAvailabilityResponse[]>;
  blockedDates: string[];
  blockedDateItems: MentorBlockedDateResponse[];
}

export enum MentorProfileAssetType {
  ACHIEVEMENT = "ACHIEVEMENT",
  CERTIFICATE = "CERTIFICATE",
  DOCUMENT = "DOCUMENT",
  EXPERIENCE = "EXPERIENCE",
}

export interface MentorProfileAssetResponse {
  id: string;
  mentorProfileId: string;
  type: MentorProfileAssetType;
  title: string;
  description?: string;
  issuer?: string;
  fileUrl?: string;
  iconUrl?: string;
  issuedAt?: string;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfileAssetRequest {
  type: MentorProfileAssetType;
  title: string;
  description?: string;
  issuer?: string;
  fileUrl?: string;
  iconUrl?: string;
  issuedAt?: string;
  isFeatured?: boolean;
  displayOrder?: number;
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
