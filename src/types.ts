export type ReportType = 
  | 'spiking' 
  | 'pothole' 
  | 'traffic' 
  | 'sos' 
  | 'hazard' 
  | 'crash' 
  | 'fatal_crash' 
  | 'stationary' 
  | 'veld_fire' 
  | 'congestion'
  | 'traffic_lights'
  | 'traffic-light'
  | 'breakdown'
  | 'crime'
  | 'fire'
  | 'flood'
  | 'spillage'
  | 'protest'
  | 'roadworks'
  | 'weather'
  | 'closure'
  | 'gbv_assist'
  | 'gbv'
  | 'other';

export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'resolved';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentCategoryConfig {
  id: string;
  label: string;
  badge: string;
  subtitle: string;
  imageUrl: string;
  iconName?: string;
  isSystemDefault?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AIAnalysis {
  riskScore: number;
  summary: string;
  categoryRecommendation: string;
  warningText?: string;
  suggestedAction?: string;
}

export interface IncidentReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  roadName?: string;
  region?: string;
  imageUrl?: string;
  status: ReportStatus;
  severity: SeverityLevel;
  createdAt: string;
  updatedAt: string;
  timestamp?: string;
  reporterName: string;
  reporterSurname?: string;
  reporterEmail?: string;
  reporterPhone?: string;
  reporterRole?: string;
  postedByUserName?: string;
  postedByUserSurname?: string;
  postedByUserEmail?: string;
  upvotes: number;
  downvotes?: number;
  verifiedByAdmin: boolean;
  isUserPost?: boolean;
  adminNotes?: string;
  resolvedImageUrl?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  aiAnalysis?: AIAnalysis;
  // Internal Admin Audit Tracking (Only visible to verified administrators)
  createdByAdminId?: string;
  createdByAdminName?: string;
  createdByAdminEmail?: string;
  createdByAdminRole?: string;
  approvedByAdminId?: string;
  approvedByAdminName?: string;
  approvedByAdminEmail?: string;
  approvedByAdminRole?: string;
  approvedAt?: string;
  resolvedByAdminId?: string;
  resolvedByAdminName?: string;
  resolvedByAdminEmail?: string;
  resolvedByAdminRole?: string;
  lastEditedByAdminId?: string;
  lastEditedByAdminName?: string;
  lastEditedByAdminEmail?: string;
  lastEditedByAdminRole?: string;
  lastEditedAt?: string;
  // Admin Priority & Broadcast Flags
  broadcastTopRed?: boolean; // When true, broadcasted on top red alert banner, clickable to jump to post
  highlightGold?: boolean;   // When true, highlighted with yellow/gold ring and pinned first for area
}

export interface ResponderPartner {
  id: string;
  name: string;
  type: 'patrol_officer' | 'partner_responder' | 'saps_police' | 'metro_police' | 'medical_ems' | 'towing_recovery' | 'community_responder' | 'other';
  callsign: string;
  phone: string;
  label?: string;
  coverageArea?: string;
  notes?: string;
  isActive: boolean;
  userId?: string;
  userEmail?: string;
  organizationName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmergencySOS {
  id: string;
  callRef?: string;
  name: string;
  phone: string;
  vehicleInfo: string;
  latitude: number;
  longitude: number;
  locationName: string;
  emergencyType: 'spiking_puncture' | 'breakdown' | 'crash' | 'accident' | 'crime_threat' | 'medical' | 'gbv_assist';
  status: 'active' | 'dispatched' | 'resolved' | 'cancelled';
  createdAt: string;
  notes: string;
  adminNotes?: string;
  responderName?: string;
  responderType?: 'patrol_officer' | 'partner_responder' | 'saps_police' | 'metro_police' | 'medical_ems' | 'towing_recovery' | 'community_responder' | 'other';
  responderCallsign?: string;
  responderPhone?: string;
  dispatchedAt?: string;
  resolvedImageUrl?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  // Internal Admin Audit Tracking (Staff/Admins only)
  dispatchedByAdminName?: string;
  dispatchedByAdminEmail?: string;
  dispatchedByAdminRole?: string;
  resolvedByAdminName?: string;
  resolvedByAdminEmail?: string;
  resolvedByAdminRole?: string;
  // Insurance Company & Telematics Partner Metadata
  partnerSource?: string; // e.g. "Discovery Insure", "Outsurance", "Santam"
  partnerId?: string;
  partnerApiKeyId?: string;
  policyNumber?: string;
  externalReferenceId?: string; // e.g. "DISC-CLM-98214"
  telematicsTriggered?: boolean;
  incidentSeverity?: 'critical' | 'high' | 'medium' | 'low';
  callbackUrl?: string; // Webhook callback URL for dispatch updates
}

export interface PartnerApiKey {
  id: string;
  partnerName: string; // e.g. "Discovery Insure", "Outsurance", "Santam"
  partnerType: 'insurance' | 'fleet' | 'security' | 'roadside' | 'other';
  apiKey: string; // e.g. "ins_live_..."
  enabled: boolean;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  lastUsedAt?: string;
  totalDispatches: number;
  webhookUrl?: string;
  notes?: string;
}

export interface PartnerSOSPayload {
  // Primary motorist & contact details
  name?: string;
  insuredName?: string;
  phone?: string;
  contactPhone?: string;
  // Geographical coordinates
  latitude: number;
  longitude: number;
  locationName?: string;
  // Incident details
  vehicleInfo?: string;
  emergencyType?: 'spiking_puncture' | 'breakdown' | 'crash' | 'accident' | 'crime_threat' | 'medical' | 'gbv_assist';
  incidentSeverity?: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
  // Insurance / Telematics identification
  policyNumber?: string;
  externalReferenceId?: string;
  telematicsTriggered?: boolean;
  callbackUrl?: string;
}

export interface PartnerSOSResponse {
  success: boolean;
  message: string;
  callRef: string;
  id: string;
  status: 'active' | 'dispatched' | 'resolved' | 'cancelled';
  trackingUrl: string;
  partner: {
    name: string;
    policyNumber?: string;
    externalReferenceId?: string;
  };
  timestamp: string;
}

export interface FeedItem {
  id: string;
  source: 'whatsapp' | 'twitter' | 'itraffic' | 'community' | 'admin_dispatch' | 'google_maps_scan' | string;
  author: string;
  handle?: string;
  content: string;
  timestamp: string;
  location?: string;
  mediaUrl?: string;
  imageUrl?: string;
  category: 'traffic' | 'spiking' | 'pothole' | 'general' | 'roadworks' | 'accident' | 'hazard' | 'crash' | 'stationary' | 'traffic_lights' | 'pedestrian' | 'crime' | string;
  verified: boolean;
  adminVerified?: boolean;
  verifiedByAdmin?: boolean;
  isUserPost?: boolean;
  showOnLiveWatch?: boolean;
  link?: string;
  roadwayName?: string;
  direction?: string;
  eventSubType?: string;
  startTime?: string;
  endTime?: string;
  lastUpdated?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  views?: number;
  upvotes?: number;
  downvotes?: number;
  confirmations?: number;
  // Clearance and Resolution tracking
  cleared?: boolean;
  clearedAt?: string;
  clearedByAdminName?: string;
  clearedByAdminEmail?: string;
  clearedByAdminRole?: string;
  isCleared?: boolean;
  status?: string;
  resolutionNotes?: string;
  resolvedImageUrl?: string;
  // Poster info (User / Admin attribution)
  postedByUserName?: string;
  postedByUserSurname?: string;
  postedByUserEmail?: string;
  reporterName?: string;
  reporterSurname?: string;
  reporterEmail?: string;
  // Internal Admin Audit Tracking (Staff/Admins only)
  postedByAdminId?: string;
  postedByAdminName?: string;
  postedByAdminEmail?: string;
  postedByAdminRole?: string;
  postedAt?: string;
  approvedByAdminId?: string;
  approvedByAdminName?: string;
  approvedByAdminEmail?: string;
  approvedByAdminRole?: string;
  approvedAt?: string;
  resolvedByAdminName?: string;
  resolvedByAdminEmail?: string;
  resolvedByAdminRole?: string;
  lastEditedByAdminName?: string;
  lastEditedByAdminEmail?: string;
  lastEditedByAdminRole?: string;
  lastEditedAt?: string;
  // Admin Priority & Broadcast Flags
  broadcastTopRed?: boolean; // When true, broadcasted on top red alert banner, clickable to jump to post
  highlightGold?: boolean;   // When true, highlighted with yellow/gold ring and pinned first for area
}

export interface SupportTier {
  id: string;
  title: string;
  amount: number;
  description: string;
  icon: 'coffee' | 'equipment' | 'fuel' | 'meal' | 'tool' | 'custom';
  categoryKey: 'coffee' | 'equipment' | 'fuel' | 'pothole_repair' | 'custom' | string;
  enabled: boolean;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  category: string;
  message?: string;
  timestamp: string;
  isAnonymous: boolean;
  potholesCount?: number;
  potholeImageUrl?: string;
  potholeLocation?: string;
  potholeLat?: number;
  potholeLng?: number;
  proofOfPaymentUrl?: string;
  referenceNumber?: string;
  isFixed?: boolean;
  fixedAt?: string;
  fixedImageUrl?: string;
  adminFeedback?: string;
}

export interface DonationStats {
  totalRaised: number;
  goalAmount: number;
  coffeeCount: number;
  fuelLiters: number;
  equipmentItemsFunded: number;
  potholesFunded?: number;
  backersCount: number;
}

export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'patrol' | 'advertiser' | 'user';

export type UserCategory = 'community' | 'responder' | 'law_enforcement' | 'advertiser';

export type ResponderApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface RegisteredUser {
  id?: string;
  fullName: string;
  surname: string;
  email: string;
  cellNumber: string;
  userCategory?: UserCategory;
  organizationName?: string; // Company, Security Firm, Towing, EMS or Law Enforcement Station
  coverageArea?: string;     // Operational / patrol area covered (e.g. N1 Midrand, Pretoria East, Sandton)
  responderType?: ResponderPartner['type'];
  responderCallsign?: string;
  responderApprovalStatus?: ResponderApprovalStatus;
  approvedResponderId?: string;
  companyName?: string;
  businessWebsite?: string;
  businessIndustry?: string;
  businessPhone?: string;
  role?: UserRole;
  status?: 'active' | 'suspended';
  registeredAt?: string;
  lastLoginAt?: string;
}

export interface AdminUserAccount {
  id: string;
  fullName: string;
  surname: string;
  email: string;
  cellNumber: string;
  userCategory?: UserCategory;
  organizationName?: string;
  coverageArea?: string;
  responderType?: ResponderPartner['type'];
  responderCallsign?: string;
  responderApprovalStatus?: ResponderApprovalStatus;
  approvedResponderId?: string;
  companyName?: string;
  businessWebsite?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  registeredAt: string;
  lastLoginAt?: string;
}

export interface CustomKeywordTagRule {
  id: string;
  keyword: string; // e.g. "mothers day", "rain", "spiking"
  tag: string;     // e.g. "#MothersDay", "#SevereRain", "#SpikingAlert"
  enabled: boolean;
}

export interface SocialHashtagSettings {
  defaultTags: string[];
  excludedTags: string[];
  quickAddPresets: string[];
  customKeywordRules: CustomKeywordTagRule[];
  whatsappFooterText?: string;
  xPostFooterText?: string;
  autoTagCorridors: boolean;
  autoTagLandmarks: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export type ActivityLogCategory = 'report' | 'sos' | 'dispatch' | 'auth' | 'donation' | 'scrape' | 'system' | 'settings';
export type ActivityLogLevel = 'info' | 'warn' | 'error' | 'success';

export interface ActivityLog {
  id: string;
  timestamp: string;
  category: ActivityLogCategory;
  level: ActivityLogLevel;
  action: string;
  details?: string;
  actor?: string;
  actorEmail?: string;
  actorRole?: string;
  ip?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}

export interface ActivityLogSettings {
  isPaused: boolean;
  retentionMax: number;
  intervalSec: number;
  lastUpdated?: string;
  updatedBy?: string;
}

export interface AdvertisementBanner {
  id: string;
  userId?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  targetUrl?: string;
  sponsorName: string;
  sponsorBadge?: string;
  ctaText?: string;
  enabled: boolean;
  position?: 'top' | 'mid' | 'bottom' | 'random' | 'inline' | 'both'; // position within the live feeds
  repeatInterval?: number; // e.g. every 5 items in the feed
  impressions?: number;
  clicks?: number;
  startDate?: string; // ISO date string for when rotation starts
  endDate?: string; // ISO date string for when rotation finishes
  durationDays?: number; // e.g. 30 for 1 month, 7, 14, 60, 90
  status?: 'active' | 'expired' | 'scheduled' | 'paused' | 'pending_approval' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  paymentReceived?: boolean;
  paymentReceivedAt?: string;
  paymentReceivedBy?: string;
  isManualSponsorship?: boolean;
  amount?: number;
  isExpired?: boolean;
  expiredAt?: string;
  packageName?: string;
  packageId?: string;
  orderId?: string;
  contactEmail?: string;
  contactPhone?: string;
  paymentMethod?: 'payfast' | 'eft' | 'complimentary';
  referenceNumber?: string;
  isComplimentary?: boolean;
  complimentaryGrantedBy?: string;
  complimentaryGrantedAt?: string;
  complimentaryReason?: string;
  notes?: string;
  imageData?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedAdSettings {
  isEnabled: boolean; // Master toggle
  banners: AdvertisementBanner[];
  feedAdPlacement?: 'random' | 'mid' | 'bottom' | 'top' | 'both'; // Where ads appear in feeds: random, mid, bottom, top header, or both
  showSponsoredBadge: boolean;
  allowDismiss: boolean;
  autoRotateTopBanners?: boolean; // Smoothly rotate top banner between active ads
  rotationIntervalSeconds?: number; // Configurable duration in seconds per banner (e.g. 10s)
  showOnDashboard?: boolean; // Also showcase rotating sponsor banners on the main dashboard
  lastExpirationCheckAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AdvertisingPackage {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'once-off';
  subtitle: string;
  themeColor: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple';
  features: string[];
  bestFor: string;
  badge?: string;
  isPopular?: boolean;
}

export interface IndividualAdOption {
  id: string;
  name: string;
  price: number;
  iconType: 'whatsapp' | 'facebook' | 'twitter' | 'combo2' | 'combo3' | 'article' | 'article_social';
  description: string;
}

export interface AdvertisingOrder {
  id: string;
  userId?: string;
  packageId: string;
  packageName: string;
  amount: number;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  notes?: string;
  adImageUrl?: string;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  status: 'pending' | 'paid' | 'approved' | 'active' | 'completed' | 'rejected';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  paymentReceived?: boolean;
  paymentReceivedAt?: string;
  paymentReceivedBy?: string;
  isManualSponsorship?: boolean;
  paymentMethod: 'payfast' | 'eft' | 'complimentary';
  paymentId?: string;
  referenceNumber?: string;
  isComplimentary?: boolean;
  complimentaryGrantedBy?: string;
  complimentaryGrantedAt?: string;
  complimentaryReason?: string;
  bannerId?: string;
  approvedBy?: string;
  approvedAt?: string;
  imageData?: string;
  contactEmail?: string;
  contactPhone?: string;
  updatedAt?: string;
  createdAt: string;
}

export interface AdvertiserDashboardAnalytics {
  totalCampaigns: number;
  activeCampaigns: number;
  pendingApprovalCount: number;
  pausedCampaigns: number;
  expiredCampaigns: number;
  totalImpressions: number;
  totalClicks: number;
  overallCTR: string;
  totalSpend: number;
  dailyStats?: Array<{ date: string; impressions: number; clicks: number; ctr: string }>;
  dailyBreakdown?: Array<{ date: string; impressions: number; clicks: number }>;
  placementStats?: { top: number; inline: number; both: number };
}

export interface AdvertiserDashboardData {
  user: RegisteredUser | null;
  banners: AdvertisementBanner[];
  orders: AdvertisingOrder[];
  analytics: AdvertiserDashboardAnalytics;
}

export type FeedbackType = 'suggestion' | 'bug' | 'bug_report' | 'improvement' | 'other';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';
export type FeedbackStatus = 'new' | 'under_review' | 'in_review' | 'planned' | 'in_progress' | 'resolved' | 'declined' | 'closed';

export interface UserFeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  category: 'map' | 'live_feed' | 'driver_mode' | 'voice_tts' | 'speed_traps' | 'sos' | 'general';
  priority: FeedbackPriority;
  status: FeedbackStatus;
  userName: string;
  userEmail?: string;
  deviceInfo?: string;
  upvotes: number;
  adminResponse?: string;
  adminResponseDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActiveFeedSession {
  sessionId: string;
  ip: string;
  isIpv6: boolean;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  language?: string;
  screenResolution?: string;
  timezone?: string;
  currentTab: string;
  feedViewMode?: 'minimal' | 'condensed' | 'detailed' | string;
  feedFilter?: string;
  activeRegion?: string;
  connectedAt: string;
  connectedTimestamp: number;
  lastHeartbeat: string;
  lastHeartbeatTimestamp: number;
  heartbeatCount: number;
  userName?: string;
  userRole?: string;
  isNew?: boolean;
  isOnlineNow?: boolean;
}

export interface FeedPresenceData {
  feedOpenCount: number;
  totalActiveViewers: number;
  activeUsersOnline?: number;
  totalVisitors?: number;
  activeSessions: ActiveFeedSession[];
  feedSessions: ActiveFeedSession[];
  all24hSessions?: ActiveFeedSession[];
  storageType?: string;
  polledAt?: string;
}

export interface FeedConnectionLog {
  sessionId: string;
  ip: string;
  isIpv6?: boolean;
  browser?: string;
  os?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  language?: string;
  screenResolution?: string;
  timezone?: string;
  currentTab?: string;
  feedViewMode?: string;
  activeRegion?: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  connectedAt: string;
  lastActiveAt: string;
  durationSeconds: number;
  isNew?: boolean;
  isOnlineNow?: boolean;
}

export interface UserConnection24hRecord {
  id: string;
  fullName: string;
  email: string;
  cellNumber: string;
  role: string;
  companyName?: string;
  status: string;
  lastConnectedAt?: string;
  lastConnectedFormattedSAST?: string;
  lastLoginAt: string;
  lastLoginFormattedSAST: string;
  registeredAt: string;
  registeredFormattedSAST: string;
  isNew?: boolean;
  isOnlineNow?: boolean;
}

export interface Feed24hHistoryResponse {
  success: boolean;
  usersWhoConnected: UserConnection24hRecord[];
  feedConnections: FeedConnectionLog[];
  stats: {
    totalRegisteredLogins24h: number;
    totalFeedSessions24h: number;
    activeViewersNow: number;
    totalVisitorsEver: number;
    currentTimeUTC: string;
    currentTimeSAST: string;
  };
}

export interface DrivingCourseSession {
  id: string;
  location: 'Johannesburg' | 'Pretoria' | string;
  venueName: string;
  address?: string;
  date: string; // ISO date string e.g. "2026-09-12"
  startTime: string; // e.g. "08:30"
  endTime: string; // e.g. "16:00"
  maxCapacity: number; // strictly 10 participants
  bookedCount: number;
  price: number; // e.g. 1850 ZAR
  status: 'open' | 'almost_full' | 'full' | 'completed' | 'cancelled';
  notes?: string;
  isOpen: boolean;
  instructorName?: string;
  createdAt: string;
}

export interface DrivingCourseRegistration {
  id: string;
  sessionId: string;
  sessionDate: string;
  sessionLocation: 'Johannesburg' | 'Pretoria' | string;
  sessionVenue: string;
  // Participant Details
  fullName: string;
  surname: string;
  idNumber: string; // SA ID Number or Passport (Mandatory)
  driversLicenseNumber: string; // Valid Driver's License Number (Mandatory)
  licenseCode: string; // e.g. "Code B (Car)", "Code EB", "Code C1 (Heavy)"
  licenseExpiryDate?: string;
  licenseDocUrl?: string;
  email: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  vehicleMakeModel?: string;
  specialRequirements?: string;
  // Payment & Verification
  amount: number;
  paymentMethod: 'payfast' | 'eft';
  paymentStatus: 'pending' | 'paid' | 'verified' | 'refunded';
  referenceNumber: string;
  paymentProofUrl?: string;
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  // Admin Status
  status: 'registered' | 'confirmed' | 'attended' | 'cancelled';
  licenseVerified: boolean;
  licenseVerifiedBy?: string;
  certificateIssued?: boolean;
  certificateNumber?: string;
  adminNotes?: string;
  registeredAt: string;
}

export interface DrivingCourseCurriculumModule {
  title: string;
  desc: string;
  tag: string;
}

export interface DrivingCourseSettings {
  isVisible: boolean; // Master Admin toggle: visible on / off on website & public portal
  allowPublicRegistrations: boolean;
  title: string;
  subtitle: string;
  description: string;
  pricePerSeat: number; // e.g. 1850 ZAR
  maxCapacityPerClass: number; // Strictly 10 per session
  whatsappInquiryNumber: string;
  contactEmail: string;
  contactPhone: string;
  sessions: DrivingCourseSession[];
  waitlistNoticeText?: string;
  requirementsNotice?: string;
  curriculumModules: DrivingCourseCurriculumModule[];
  updatedAt?: string;
  updatedBy?: string;
}

export interface AdminPushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userEmail?: string;
  role?: string;
  deviceName?: string;
  createdAt: string;
  lastActiveAt: string;
  enabled: boolean;
}

export interface PushSettings {
  enabled: boolean;
  notifyOnSOS: boolean;
  notifyOnSpiking: boolean;
  notifyOnCriticalHazard: boolean;
  notifyOnNewUserSignup?: boolean;
  soundAlert: boolean;
  vibrationAlert: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface TravelTimeRoute {
  id: string;
  roadwayName: string;
  direction: string;
  description: string;
  distance: number; // in km
  currentTime: number; // in min
  currentSpeed: number; // in km/h
  region: string;
  order?: number | null;
  delayMinutes?: number;
  congestionLevel: 'free_flow' | 'moderate' | 'congested' | 'heavy_delay';
  freeFlowTime?: number;
  lastUpdated?: string;
  sourceUrl?: string;
}

export interface ITrafficTravelTimesResponse {
  success: boolean;
  count: number;
  total: number;
  region: string;
  routes: TravelTimeRoute[];
  stats: {
    totalRoutes: number;
    gautengCount: number;
    kznCount: number;
    wcCount: number;
    avgSpeed: number;
    congestedCount: number;
  };
  sourceUrl: string;
  lastFetched: string;
}

// ==========================================
// LIVE TRAFFIC COMMUNITY HEROES PROGRAM TYPES
// ==========================================

export type HeroCategory = 'reporter' | 'verifier' | 'warning' | 'special';

export type CommunityLeaderboardCategory = 'overall' | 'reporter' | 'verifier' | 'warning' | 'location' | 'helper';

export type CommunityTimeframe = 'weekly' | 'monthly' | 'all_time';

export interface CommunityHeroBadge {
  id: string;
  title: string;
  icon: string;
  category: HeroCategory;
  threshold: number; // actions or points needed
  description: string;
  color: string;
  badgeLevel: string;
  criteria: string;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
  title: string;
  icon: string;
  category: HeroCategory;
}

export interface ReputationActivityLog {
  id: string;
  action: 'approved_report' | 'incident_verified' | 'traffic_update' | 'road_warning' | 'warning_confirmed' | 'incident_resolved' | 'emergency_assist' | 'location_correction' | 'false_report_penalty';
  points: number;
  label: string;
  timestamp: string;
  referenceId?: string;
  details?: string;
}

export interface CommunityReputationProfile {
  userId: string;
  fullName: string;
  surname?: string;
  email: string;
  tier: string;
  tierIcon: string;
  totalReputation: number;
  incidentReportsCount: number;
  approvedReportsCount: number;
  verificationsCount: number;
  warningsCount: number;
  emergencyAssistsCount: number;
  helpfulUpdatesCount: number;
  locationCorrectionsCount: number;
  accuracyRate: number; // percentage e.g. 96
  memberSince: string;
  badges: UnlockedBadge[];
  recentActivity: ReputationActivityLog[];
}

export interface CommunityHeroLeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  surname?: string;
  tier: string;
  tierIcon: string;
  totalReputation: number;
  categoryScore: number;
  reportsCount: number;
  verificationsCount: number;
  warningsCount: number;
  accuracyRate: number;
  topBadges: string[]; // Badge icon string array or IDs
  isCurrentUser?: boolean;
}

// ==========================================
// TRIP BUDDY: IN-APP JOURNEY MONITORING TYPES
// ==========================================

export type TripStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled' | 'emergency';

export interface TripEmergencyContact {
  id: string;
  name: string;
  phone: string; // WhatsApp mobile number (e.g. +27821234567 or 0821234567)
  relationship: string; // e.g. Spouse, Parent, Child, Friend, Colleague, Security
  notifyOnStart: boolean;
  notifyOnCheckin: boolean;
  notifyOnArrival: boolean;
}

export interface TripCheckinLog {
  id: string;
  timestamp: string;
  status: 'safe' | 'delayed' | 'stopped_fuel' | 'emergency_sos' | 'arrived';
  latitude?: number;
  longitude?: number;
  locationName?: string;
  speedKmh?: number;
  notes?: string;
  batteryLevel?: number;
}

export interface TripBuddyPlan {
  id: string;
  userId?: string;
  driverName: string;
  driverPhone: string;
  driverEmail?: string;
  departure: string;
  departureCoords?: { lat: number; lng: number };
  destination: string;
  destinationCoords?: { lat: number; lng: number };
  routeVia?: string;
  estimatedDistanceKm: number;
  estimatedDurationMins: number;
  checkinIntervalMins: number; // e.g. 15, 30, 45, 60
  vehicleDetails?: {
    makeModel?: string;
    color?: string;
    licensePlate?: string;
  };
  emergencyContacts: TripEmergencyContact[];
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
  lastCheckinAt?: string;
  nextCheckinDueAt?: string;
  currentLat?: number;
  currentLng?: number;
  currentLocationName?: string;
  currentSpeedKmh?: number;
  distanceTravelledKm?: number;
  batteryLevel?: number;
  checkins: TripCheckinLog[];
  paidPassType?: 'single' | 'commuter_pack' | 'monthly_unlimited';
  paidStatus: 'free_preview' | 'paid_active' | 'pass_applied';
  passExpiry?: string;
  trackingToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripBuddyPricingPass {
  id: 'single' | 'commuter_pack' | 'monthly_unlimited';
  title: string;
  priceZAR: number;
  periodLabel: string;
  badge?: string;
  tripsIncluded: number | 'unlimited';
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface UserTripPassWallet {
  userId: string;
  email: string;
  activePassType?: 'single' | 'commuter_pack' | 'monthly_unlimited' | 'none';
  remainingTrips: number;
  unlimitedUntil?: string;
  purchasedAt?: string;
  totalTripsCompleted: number;
  redeemedPromoCodes?: string[];
  lastPromoRedeemed?: string;
}

// ==========================================
// LIVE TRAFFIC HIGHWAY CAMERAS (CCTV) TYPES
// ==========================================

export interface TrafficCamera {
  id: string;
  name: string;
  roadway: string;
  region: 'Gauteng' | 'KwaZulu-Natal' | 'Western Cape' | 'Eastern Cape';
  direction: string;
  locationDescription: string;
  kilometerMarker?: string;
  latitude: number;
  longitude: number;
  snapshotUrl: string;
  streamUrl?: string;
  status: 'online' | 'offline' | 'maintenance';
  trafficFlow: 'free_flow' | 'moderate' | 'congested' | 'standstill';
  speedEstimateKmh: number;
  lastUpdated: string;
  isPopular?: boolean;
  notes?: string;
  operator: 'SANRAL i-Traffic' | 'Metro Police CCTV' | 'Toll Concessionaire' | 'LiveTraffic NPC';
}

