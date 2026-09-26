import {
  CommunityReputationProfile,
  CommunityHeroBadge,
  CommunityHeroLeaderboardEntry,
  CommunityLeaderboardCategory,
  CommunityTimeframe,
  RegisteredUser
} from '../types';
import {
  COMMUNITY_HERO_BADGES,
  POINT_SYSTEM_RULES,
  calculateUserTier,
  computeBadgesForProfile,
  SEED_COMMUNITY_HEROES
} from '../data/communityHeroesData';

const LOCAL_STORAGE_HERO_KEY = 'livetraffic_community_hero_profile_v2';

export function getLocalHeroProfile(currentUser?: RegisteredUser | null): CommunityReputationProfile {
  const email = currentUser?.email || 'guest@livetrafficnpc.org';
  const name = currentUser?.fullName || 'Community Driver';
  const surname = currentUser?.surname || '';

  // Clean old legacy mock profile key from browser cache if present
  try {
    localStorage.removeItem(`livetraffic_community_hero_profile_${email.toLowerCase()}`);
    localStorage.removeItem('livetraffic_community_hero_profile');
  } catch (e) {
    // ignore
  }

  // Check if saved locally in v2
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_HERO_KEY}_${email.toLowerCase()}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  // Check seed profiles (if any real users loaded)
  const matchingSeed = SEED_COMMUNITY_HEROES.find(h => h.email && h.email.toLowerCase() === email.toLowerCase());
  if (matchingSeed) {
    return matchingSeed;
  }

  // Real initial profile starting with actual zero contributions until user earns them
  const baseStats = {
    approvedReportsCount: 0,
    verificationsCount: 0,
    warningsCount: 0,
    emergencyAssistsCount: 0,
    helpfulUpdatesCount: 0,
    locationCorrectionsCount: 0,
    totalReputation: 0,
    accuracyRate: 100
  };

  const tierInfo = calculateUserTier(0, 0);
  const badges: any[] = [];

  const newProfile: CommunityReputationProfile = {
    userId: currentUser?.id || `user-${Date.now()}`,
    fullName: name,
    surname: surname,
    email: email,
    tier: tierInfo.tier,
    tierIcon: tierInfo.tierIcon,
    totalReputation: 0,
    incidentReportsCount: 0,
    approvedReportsCount: 0,
    verificationsCount: 0,
    warningsCount: 0,
    emergencyAssistsCount: 0,
    helpfulUpdatesCount: 0,
    locationCorrectionsCount: 0,
    accuracyRate: 100,
    memberSince: currentUser?.registeredAt ? new Date(currentUser.registeredAt).getFullYear().toString() : '2026',
    badges: badges,
    recentActivity: []
  };

  return newProfile;
}

export function saveLocalHeroProfile(profile: CommunityReputationProfile): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_HERO_KEY}_${profile.email.toLowerCase()}`, JSON.stringify(profile));
  } catch (e) {
    // ignore
  }
}

export function calculateBadgeProgress(badge: CommunityHeroBadge, profile: CommunityReputationProfile): {
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  percentage: number;
  unlockedAt?: string;
} {
  const isUnlocked = profile.badges.some(b => b.badgeId === badge.id);
  const existingBadge = profile.badges.find(b => b.badgeId === badge.id);

  let currentValue = 0;
  const targetValue = badge.threshold;

  switch (badge.id) {
    // Reporter
    case 'road_watcher':
    case 'road_reporter':
    case 'traffic_scout':
    case 'traffic_guardian':
    case 'traffic_hero':
    case 'traffic_legend':
      currentValue = profile.approvedReportsCount || 0;
      break;

    // Verifier
    case 'fact_finder':
    case 'incident_verifier':
    case 'road_investigator':
    case 'traffic_sentinel':
    case 'community_guardian_verifier':
    case 'verification_master':
      currentValue = profile.verificationsCount || 0;
      break;

    // Warning
    case 'road_watch':
    case 'early_warning':
    case 'hazard_hunter_warning':
    case 'community_alert':
    case 'road_protector':
    case 'safety_champion_warning':
      currentValue = profile.warningsCount || 0;
      break;

    // Special
    case 'emergency_helper':
      currentValue = profile.emergencyAssistsCount || 0;
      break;
    case 'location_master':
      currentValue = profile.locationCorrectionsCount || 0;
      break;
    case 'community_helper':
      currentValue = profile.helpfulUpdatesCount || 0;
      break;
    case 'road_safety_champion':
      currentValue = profile.totalReputation || 0;
      break;
    default:
      currentValue = isUnlocked ? targetValue : Math.min(targetValue, Math.floor(profile.totalReputation / 10));
      break;
  }

  const percentage = Math.min(100, Math.round((currentValue / targetValue) * 100));

  return {
    isUnlocked,
    currentValue,
    targetValue,
    percentage,
    unlockedAt: existingBadge?.unlockedAt
  };
}

export async function awardReputationPoints(
  currentUser: RegisteredUser | null,
  action: 'approved_report' | 'incident_verified' | 'traffic_update' | 'road_warning' | 'warning_confirmed' | 'incident_resolved' | 'emergency_assist' | 'location_correction' | 'false_report_penalty',
  label: string,
  referenceId?: string,
  details?: string
): Promise<{ profile: CommunityReputationProfile; pointsAdded: number; newBadgeUnlocked?: string }> {
  const profile = getLocalHeroProfile(currentUser);
  
  let points = 5;
  switch (action) {
    case 'approved_report':
      points = 10;
      profile.approvedReportsCount = (profile.approvedReportsCount || 0) + 1;
      profile.incidentReportsCount = (profile.incidentReportsCount || 0) + 1;
      break;
    case 'incident_verified':
      points = 5;
      profile.verificationsCount = (profile.verificationsCount || 0) + 1;
      break;
    case 'traffic_update':
      points = 5;
      profile.helpfulUpdatesCount = (profile.helpfulUpdatesCount || 0) + 1;
      break;
    case 'road_warning':
      points = 5;
      profile.warningsCount = (profile.warningsCount || 0) + 1;
      break;
    case 'warning_confirmed':
      points = 3;
      profile.verificationsCount = (profile.verificationsCount || 0) + 1;
      break;
    case 'incident_resolved':
      points = 5;
      profile.verificationsCount = (profile.verificationsCount || 0) + 1;
      break;
    case 'emergency_assist':
      points = 15;
      profile.emergencyAssistsCount = (profile.emergencyAssistsCount || 0) + 1;
      break;
    case 'location_correction':
      points = 3;
      profile.locationCorrectionsCount = (profile.locationCorrectionsCount || 0) + 1;
      break;
    case 'false_report_penalty':
      points = -20;
      profile.accuracyRate = Math.max(50, (profile.accuracyRate || 96) - 5);
      break;
  }

  profile.totalReputation = Math.max(0, (profile.totalReputation || 0) + points);

  // Recalculate tier
  const tierInfo = calculateUserTier(profile.totalReputation, profile.approvedReportsCount);
  profile.tier = tierInfo.tier;
  profile.tierIcon = tierInfo.tierIcon;

  // Check badges
  const oldBadgesCount = profile.badges.length;
  profile.badges = computeBadgesForProfile({
    approvedReportsCount: profile.approvedReportsCount,
    verificationsCount: profile.verificationsCount,
    warningsCount: profile.warningsCount,
    emergencyAssistsCount: profile.emergencyAssistsCount,
    helpfulUpdatesCount: profile.helpfulUpdatesCount,
    locationCorrectionsCount: profile.locationCorrectionsCount,
    totalReputation: profile.totalReputation,
    accuracyRate: profile.accuracyRate
  });

  let newBadgeUnlocked: string | undefined = undefined;
  if (profile.badges.length > oldBadgesCount) {
    const newlyAdded = profile.badges[profile.badges.length - 1];
    newBadgeUnlocked = `${newlyAdded.icon} ${newlyAdded.title}`;
  }

  // Add activity log
  profile.recentActivity = [
    {
      id: `act-${Date.now()}`,
      action,
      points,
      label,
      timestamp: 'Just now',
      referenceId,
      details
    },
    ...(profile.recentActivity || []).slice(0, 19)
  ];

  // Save locally
  saveLocalHeroProfile(profile);

  // Sync to server asynchronously
  try {
    fetch('/api/community-heroes/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: profile.email,
        fullName: profile.fullName,
        surname: profile.surname,
        action,
        points,
        label,
        referenceId,
        details,
        profileState: profile
      })
    }).catch(() => {});
  } catch (e) {
    // ignore
  }

  return { profile, pointsAdded: points, newBadgeUnlocked };
}
