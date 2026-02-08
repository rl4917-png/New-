
export enum TaskType {
  REVIEW = '内容评审',
  CONSULTING = '咨询建议',
  WRITING = '创意写作',
  REDTEAM = '红队对抗',
  OTHER = '其他'
}

export enum NeedStatus {
  SUBMITTED = '已提交',
  RECRUITING = '招募中',
  DISCOVERY = '需求澄清',
  SHORTLISTED = '进入短名单',
  INTRO = '引荐约谈',
  MATCHED = '匹配成功',
  CLOSED = '已结案',
  PAUSED = '已暂停'
}

export enum TrustTier {
  UNVERIFIED = '待审核 (Unverified)',
  SCREENED = '已初筛 (Screened)',
  PROVEN = '已验证 (Proven)'
}

export enum EnglishLevel {
  NATIVE = '母语级 (Native)',
  PROFICIENT = '流利 (Proficient)',
  INTERMEDIATE = '进阶 (Intermediate)',
  BASIC = '基础 (Basic)'
}

export enum MatchStatus {
  RECEIVED_SUMMARY = '待处理摘要',
  ACCEPTED_PREVIEW = '已接受摘要',
  REJECTED_PREVIEW = '已拒绝摘要',
  SCHEDULING = '约谈协调中',
  MEETING_SCHEDULED = '约谈已确认',
  INTERVIEWING = '约谈进行中',
  STOPPED = '已终止',
  CLOSED = '合作进行中',
  WITHDRAWN = '专家已退出'
}

export enum ExpertTier {
  PRINCIPAL = '首席专家',
  SENIOR = '资深专家',
  ASSOCIATE = '助理专家'
}

export enum DataProductType {
  EVAL = '评估数据',
  SFT = 'SFT数据',
  RLHF = 'RLHF数据'
}

export interface ClarificationMessage {
  id: string;
  author: 'customer' | 'admin';
  text: string;
  timestamp: string;
}

export interface ShortlistReview {
  status: 'pending' | 'approved' | 'declined';
  reason?: string;
  timestamp?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  graduationYear: string;
  gpa?: string;
  awards?: string;
}

export interface DailyAvailability {
  day: string; // 'M', 'T', 'W' etc.
  isAvailable: boolean;
  slots: { start: string; end: string }[];
}

export interface ExpertProfile {
  id: string;
  name: string;
  domainTags: string[];
  skills: string[];
  languages: string[];
  hobbies: string[];
  summaryExperience: string; 
  workExperiences: WorkExperience[];
  educations: Education[];
  certifications: { name: string; issuer: string; year: string }[];
  portfolioUrl: string;
  additionalLinks: string[];
  location: {
    country: string;
    state: string;
    city: string;
    postalCode: string;
    dob: string;
    isAuthorized: boolean;
    locationSameAsPhysical: boolean;
  };
  availabilityToStart: string;
  preferredWeeklyHours: number;
  timezone: string;
  workingHours: DailyAvailability[];
  domainInterests: string[];
  minCompensationFT: number;
  minCompensationPT: number;
  rateRange: string;
  comms: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    fullTimeOpps: boolean;
    partTimeOpps: boolean;
    referralOpps: boolean;
    jobNotifications: boolean;
    workUpdates: boolean;
  };
  trustTier: TrustTier;
  riskFlags: string[];
  internalNotes?: string;
  englishLevel: EnglishLevel;
  verificationLink?: string;
}

export interface Need {
  id: string;
  customerId: string;
  customerOrgName: string;
  domainArea: string;
  masterDomain?: string; 
  subDomain?: string; 
  taskType: TaskType;
  expertTier?: ExpertTier;
  dataProductType?: DataProductType;
  taskDescription: string;
  intensityHours: number;
  timeline: string;
  languageRequirement: string;
  budgetRange: string;
  status: NeedStatus;
  createdAt: string;
  shortlist: string[];
  shortlistReviewStatuses: Record<string, ShortlistReview>; 
  roundIndex: number;
  aiSummary?: string;
  clarificationLog: ClarificationMessage[];
  pendingActionBy?: 'admin' | 'customer';
  isApproved?: boolean;
  complianceConstraints?: string; 
  ttd_days?: number; 
  ttfs_hours?: number;
  replacementCount: number;
  // Recruitment progress
  recruitmentSentCount?: number;
  recruitmentRespondedCount?: number;
  recruitmentTargetCount?: number;
  // Feedback
  feedback?: {
    satisfactionRating: number; // 1-5
    speedRating: number;
    qualityRating: number;
    suggestions: string;
    submittedAt: string;
  };
}

export interface MatchRecord {
  id: string;
  needId: string;
  expertId: string;
  roundIndex: number;
  status: MatchStatus;
  shortlistedAt: string;
  opportunitySummary?: string;
  complianceConstraints?: string;
  payRange?: string;
  hoursPerWeek?: number;
  timelineEstimate?: string;
  decisionLog?: string[];
  meetingScheduledAt?: string;
  availableTimeSlots?: string[];
  rejectReason?: string;
  withdrawalReason?: string;
}

export interface AdminTemplate {
  id: string;
  name: string;
  type: 'email' | 'summary' | 'intro';
  content: string;
}
