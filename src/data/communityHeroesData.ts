import type {
  CommunityHeroBadge,
  CommunityReputationProfile,
  CommunityHeroLeaderboardEntry,
  CommunityLeaderboardCategory,
  CommunityTimeframe,
  UnlockedBadge
} from '../types.ts';

export const COMMUNITY_HERO_BADGES: CommunityHeroBadge[] = [
  // ==========================================
  // 1. INCIDENT REPORTER BADGES
  // ==========================================
  {
    id: 'road_watcher',
    title: 'Road Watcher',
    icon: '🟢',
    category: 'reporter',
    threshold: 1,
    description: 'First approved incident report meeting verification standards.',
    criteria: '1 Approved Incident Report',
    color: 'emerald',
    badgeLevel: 'Bronze'
  },
  {
    id: 'road_reporter',
    title: 'Road Reporter',
    icon: '🔵',
    category: 'reporter',
    threshold: 10,
    description: 'Active roadside spotter with 10 approved incident submissions.',
    criteria: '10 Approved Incident Reports',
    color: 'blue',
    badgeLevel: 'Silver'
  },
  {
    id: 'traffic_scout',
    title: 'Traffic Scout',
    icon: '🟣',
    category: 'reporter',
    threshold: 25,
    description: 'Reliable route scout with 25 approved live road incident reports.',
    criteria: '25 Approved Incident Reports',
    color: 'purple',
    badgeLevel: 'Gold'
  },
  {
    id: 'traffic_guardian',
    title: 'Traffic Guardian',
    icon: '🟠',
    category: 'reporter',
    threshold: 50,
    description: 'Trusted community guardian with 50 high-accuracy incident reports.',
    criteria: '50 Approved Incident Reports',
    color: 'amber',
    badgeLevel: 'Platinum'
  },
  {
    id: 'traffic_hero',
    title: 'Traffic Hero',
    icon: '🟡',
    category: 'reporter',
    threshold: 100,
    description: 'Frontline road hero with 100 verified incidents protecting fellow motorists.',
    criteria: '100 Approved Incident Reports',
    color: 'yellow',
    badgeLevel: 'Diamond'
  },
  {
    id: 'traffic_legend',
    title: 'Traffic Legend',
    icon: '⭐',
    category: 'reporter',
    threshold: 250,
    description: 'Elite road network contributor with 250+ life-saving verified reports.',
    criteria: '250+ Approved Incident Reports',
    color: 'amber',
    badgeLevel: 'Legendary'
  },

  // ==========================================
  // 2. INCIDENT VERIFIER BADGES
  // ==========================================
  {
    id: 'fact_finder',
    title: 'Fact Finder',
    icon: '🔍',
    category: 'verifier',
    threshold: 1,
    description: 'First verified incident confirmation assisting the patrol network.',
    criteria: '1 Verified Incident Confirmation',
    color: 'cyan',
    badgeLevel: 'Bronze'
  },
  {
    id: 'incident_verifier',
    title: 'Incident Verifier',
    icon: '🛡️',
    category: 'verifier',
    threshold: 10,
    description: 'Confirmed 10 active incidents and lane clearance updates.',
    criteria: '10 Verified Incidents',
    color: 'teal',
    badgeLevel: 'Silver'
  },
  {
    id: 'road_investigator',
    title: 'Road Investigator',
    icon: '🔎',
    category: 'verifier',
    threshold: 25,
    description: 'Conducted 25 timely on-scene validations and traffic updates.',
    criteria: '25 Verified Incidents',
    color: 'sky',
    badgeLevel: 'Gold'
  },
  {
    id: 'traffic_sentinel',
    title: 'Traffic Sentinel',
    icon: '🛡️',
    category: 'verifier',
    threshold: 50,
    description: 'Key validation pillar with 50 verified reports ensuring data accuracy.',
    criteria: '50 Verified Incidents',
    color: 'indigo',
    badgeLevel: 'Platinum'
  },
  {
    id: 'community_guardian_verifier',
    title: 'Community Guardian',
    icon: '🏆',
    category: 'verifier',
    threshold: 100,
    description: 'Top-tier verification specialist with 100 confirmations preventing fake alerts.',
    criteria: '100 Verified Incidents',
    color: 'purple',
    badgeLevel: 'Diamond'
  },
  {
    id: 'verification_master',
    title: 'Verification Master',
    icon: '👑',
    category: 'verifier',
    threshold: 250,
    description: 'Master verification authority with 250+ on-road confirmations.',
    criteria: '250+ Verified Incidents',
    color: 'amber',
    badgeLevel: 'Legendary'
  },

  // ==========================================
  // 3. COMMUNITY WARNING BADGES
  // ==========================================
  {
    id: 'road_watch',
    title: 'Road Watch',
    icon: '👀',
    category: 'warning',
    threshold: 1,
    description: 'Submitted first proactive warning for debris, potholes or road hazard.',
    criteria: '1 Useful Road Warning',
    color: 'lime',
    badgeLevel: 'Bronze'
  },
  {
    id: 'early_warning',
    title: 'Early Warning',
    icon: '⚠️',
    category: 'warning',
    threshold: 5,
    description: 'Broadcasted 5 early warnings preventing vehicle damage and accidents.',
    criteria: '5 Useful Road Warnings',
    color: 'yellow',
    badgeLevel: 'Silver'
  },
  {
    id: 'hazard_hunter_warning',
    title: 'Hazard Hunter',
    icon: '🚧',
    category: 'warning',
    threshold: 15,
    description: 'Flagged 15 high-risk roadway obstacles, rocks, flooding or broken signals.',
    criteria: '15 Useful Road Warnings',
    color: 'orange',
    badgeLevel: 'Gold'
  },
  {
    id: 'community_alert',
    title: 'Community Alert',
    icon: '📢',
    category: 'warning',
    threshold: 30,
    description: 'Issued 30 prompt corridor alerts warning commuters in advance.',
    criteria: '30 Useful Road Warnings',
    color: 'rose',
    badgeLevel: 'Platinum'
  },
  {
    id: 'road_protector',
    title: 'Road Protector',
    icon: '🛡️',
    category: 'warning',
    threshold: 50,
    description: 'Prevented countless tyre damage & collision cases with 50 road warnings.',
    criteria: '50 Useful Road Warnings',
    color: 'red',
    badgeLevel: 'Diamond'
  },
  {
    id: 'safety_champion_warning',
    title: 'Safety Champion',
    icon: '🏆',
    category: 'warning',
    threshold: 100,
    description: 'Champion of community pre-warnings with 100+ proactive hazard alerts.',
    criteria: '100+ Useful Road Warnings',
    color: 'amber',
    badgeLevel: 'Legendary'
  },

  // ==========================================
  // 4. SPECIAL ACHIEVEMENT BADGES
  // ==========================================
  {
    id: 'night_watch',
    title: 'Night Watch',
    icon: '🌙',
    category: 'special',
    threshold: 5,
    description: 'Consistently reporting critical hazards between 20:00 and 05:00 at night.',
    criteria: '5+ Approved Night Reports (20:00–05:00)',
    color: 'indigo',
    badgeLevel: 'Special'
  },
  {
    id: 'storm_watch',
    title: 'Storm Watch',
    icon: '🌧️',
    category: 'special',
    threshold: 5,
    description: 'Active reporting during severe storms, flash floods, and dangerous weather.',
    criteria: '5+ Weather & Flood Warnings',
    color: 'cyan',
    badgeLevel: 'Special'
  },
  {
    id: 'highway_guardian',
    title: 'Highway Guardian',
    icon: '🚗',
    category: 'special',
    threshold: 10,
    description: 'Dedicated reports on major national freeways (N1, N3, N4, N12, M1, R21).',
    criteria: '10+ Major Highway Reports',
    color: 'emerald',
    badgeLevel: 'Special'
  },
  {
    id: 'emergency_helper',
    title: 'Emergency Helper',
    icon: '🚨',
    category: 'special',
    threshold: 3,
    description: 'Reports that directly assisted emergency services & tow responders to scene.',
    criteria: '3+ First Responder Assists',
    color: 'rose',
    badgeLevel: 'Special'
  },
  {
    id: 'location_master',
    title: 'Location Master',
    icon: '🗺️',
    category: 'special',
    threshold: 10,
    description: 'Pinpoint accuracy with GPS coordinates, precise markers and road names.',
    criteria: '10+ High Accuracy Pin Placements',
    color: 'blue',
    badgeLevel: 'Special'
  },
  {
    id: 'hazard_hunter',
    title: 'Hazard Hunter',
    icon: '🔥',
    category: 'special',
    threshold: 10,
    description: 'Identifying and flagging severe road hazards (spiking, oil spills, fires).',
    criteria: '10+ High-Danger Hazard Reports',
    color: 'amber',
    badgeLevel: 'Special'
  },
  {
    id: 'community_helper',
    title: 'Community Helper',
    icon: '🤝',
    category: 'special',
    threshold: 15,
    description: 'Helping fellow motorists with helpful commentary, alternate routes & updates.',
    criteria: '15+ Helpful Route Updates & Tips',
    color: 'teal',
    badgeLevel: 'Special'
  },
  {
    id: 'veteran',
    title: 'Veteran Contributor',
    icon: '🏆',
    category: 'special',
    threshold: 365,
    description: 'Dedicated active contributor supporting Live Traffic NPC for 12+ months.',
    criteria: '12+ Months Community Service',
    color: 'yellow',
    badgeLevel: 'Special'
  },
  {
    id: 'road_safety_champion',
    title: 'Road Safety Champion',
    icon: '🇿🇦',
    category: 'special',
    threshold: 500,
    description: 'Exceptional overall contribution to national road safety across South Africa.',
    criteria: '500+ Lifetime Reputation Points',
    color: 'amber',
    badgeLevel: 'Prestige'
  }
];

export const POINT_SYSTEM_RULES = [
  { action: 'Approved incident report', points: 10, icon: '🚨', note: 'Must meet quality standards' },
  { action: 'Incident verified', points: 5, icon: '✅', note: 'Confirming active, location or clear' },
  { action: 'Useful traffic update', points: 5, icon: '💬', note: 'Alternate routes, speed advisory' },
  { action: 'General road warning', points: 5, icon: '⚠️', note: 'Debris, potholes, flooding, animals' },
  { action: 'Warning confirmed by user', points: 3, icon: '👍', note: 'Second user validates warning' },
  { action: 'Incident successfully closed', points: 5, icon: '🏁', note: 'Confirming road cleared safely' },
  { action: 'Leads to emergency assistance', points: 15, icon: '🚑', note: 'Direct dispatch facilitation' },
  { action: 'Helpful location/pin correction', points: 3, icon: '📍', note: 'Pinpoint precision update' },
  { action: 'Duplicate / low quality report', points: 0, icon: '🔄', note: 'No points awarded' },
  { action: 'False / misleading report', points: -20, icon: '❌', note: 'Anti-spam penalty applied' }
];

export function calculateUserTier(totalReputation: number, reportsCount: number = 0): { tier: string; tierIcon: string; color: string } {
  if (totalReputation >= 2500 || reportsCount >= 250) {
    return { tier: 'Traffic Legend', tierIcon: '⭐', color: 'text-amber-300' };
  }
  if (totalReputation >= 1800) {
    return { tier: 'Community Guardian', tierIcon: '🏆', color: 'text-yellow-400' };
  }
  if (totalReputation >= 1000 || reportsCount >= 50) {
    return { tier: 'Traffic Guardian', tierIcon: '🛡️', color: 'text-amber-400' };
  }
  if (totalReputation >= 600 || reportsCount >= 25) {
    return { tier: 'Traffic Sentinel', tierIcon: '🛡️', color: 'text-indigo-400' };
  }
  if (totalReputation >= 300 || reportsCount >= 10) {
    return { tier: 'Traffic Scout', tierIcon: '🟣', color: 'text-purple-400' };
  }
  if (totalReputation >= 100 || reportsCount >= 1) {
    return { tier: 'Road Reporter', tierIcon: '🔵', color: 'text-blue-400' };
  }
  return { tier: 'Road Watcher', tierIcon: '🟢', color: 'text-emerald-400' };
}

export function computeBadgesForProfile(stats: {
  approvedReportsCount: number;
  verificationsCount: number;
  warningsCount: number;
  emergencyAssistsCount: number;
  helpfulUpdatesCount: number;
  locationCorrectionsCount: number;
  totalReputation: number;
  accuracyRate: number;
}): UnlockedBadge[] {
  const unlocked: UnlockedBadge[] = [];
  const now = new Date().toISOString();

  // 1. Reporter Badges
  if (stats.approvedReportsCount >= 1) {
    unlocked.push({ badgeId: 'road_watcher', unlockedAt: now, title: 'Road Watcher', icon: '🟢', category: 'reporter' });
  }
  if (stats.approvedReportsCount >= 10) {
    unlocked.push({ badgeId: 'road_reporter', unlockedAt: now, title: 'Road Reporter', icon: '🔵', category: 'reporter' });
  }
  if (stats.approvedReportsCount >= 25) {
    unlocked.push({ badgeId: 'traffic_scout', unlockedAt: now, title: 'Traffic Scout', icon: '🟣', category: 'reporter' });
  }
  if (stats.approvedReportsCount >= 50) {
    unlocked.push({ badgeId: 'traffic_guardian', unlockedAt: now, title: 'Traffic Guardian', icon: '🟠', category: 'reporter' });
  }
  if (stats.approvedReportsCount >= 100) {
    unlocked.push({ badgeId: 'traffic_hero', unlockedAt: now, title: 'Traffic Hero', icon: '🟡', category: 'reporter' });
  }
  if (stats.approvedReportsCount >= 250) {
    unlocked.push({ badgeId: 'traffic_legend', unlockedAt: now, title: 'Traffic Legend', icon: '⭐', category: 'reporter' });
  }

  // 2. Verifier Badges
  if (stats.verificationsCount >= 1) {
    unlocked.push({ badgeId: 'fact_finder', unlockedAt: now, title: 'Fact Finder', icon: '🔍', category: 'verifier' });
  }
  if (stats.verificationsCount >= 10) {
    unlocked.push({ badgeId: 'incident_verifier', unlockedAt: now, title: 'Incident Verifier', icon: '🛡️', category: 'verifier' });
  }
  if (stats.verificationsCount >= 25) {
    unlocked.push({ badgeId: 'road_investigator', unlockedAt: now, title: 'Road Investigator', icon: '🔎', category: 'verifier' });
  }
  if (stats.verificationsCount >= 50) {
    unlocked.push({ badgeId: 'traffic_sentinel', unlockedAt: now, title: 'Traffic Sentinel', icon: '🛡️', category: 'verifier' });
  }
  if (stats.verificationsCount >= 100) {
    unlocked.push({ badgeId: 'community_guardian_verifier', unlockedAt: now, title: 'Community Guardian', icon: '🏆', category: 'verifier' });
  }
  if (stats.verificationsCount >= 250) {
    unlocked.push({ badgeId: 'verification_master', unlockedAt: now, title: 'Verification Master', icon: '👑', category: 'verifier' });
  }

  // 3. Warning Badges
  if (stats.warningsCount >= 1) {
    unlocked.push({ badgeId: 'road_watch', unlockedAt: now, title: 'Road Watch', icon: '👀', category: 'warning' });
  }
  if (stats.warningsCount >= 5) {
    unlocked.push({ badgeId: 'early_warning', unlockedAt: now, title: 'Early Warning', icon: '⚠️', category: 'warning' });
  }
  if (stats.warningsCount >= 15) {
    unlocked.push({ badgeId: 'hazard_hunter_warning', unlockedAt: now, title: 'Hazard Hunter', icon: '🚧', category: 'warning' });
  }
  if (stats.warningsCount >= 30) {
    unlocked.push({ badgeId: 'community_alert', unlockedAt: now, title: 'Community Alert', icon: '📢', category: 'warning' });
  }
  if (stats.warningsCount >= 50) {
    unlocked.push({ badgeId: 'road_protector', unlockedAt: now, title: 'Road Protector', icon: '🛡️', category: 'warning' });
  }
  if (stats.warningsCount >= 100) {
    unlocked.push({ badgeId: 'safety_champion_warning', unlockedAt: now, title: 'Safety Champion', icon: '🏆', category: 'warning' });
  }

  // 4. Special Badges
  if (stats.emergencyAssistsCount >= 3) {
    unlocked.push({ badgeId: 'emergency_helper', unlockedAt: now, title: 'Emergency Helper', icon: '🚨', category: 'special' });
  }
  if (stats.locationCorrectionsCount >= 5) {
    unlocked.push({ badgeId: 'location_master', unlockedAt: now, title: 'Location Master', icon: '🗺️', category: 'special' });
  }
  if (stats.helpfulUpdatesCount >= 10) {
    unlocked.push({ badgeId: 'community_helper', unlockedAt: now, title: 'Community Helper', icon: '🤝', category: 'special' });
  }
  if (stats.totalReputation >= 500) {
    unlocked.push({ badgeId: 'road_safety_champion', unlockedAt: now, title: 'Road Safety Champion', icon: '🇿🇦', category: 'special' });
  }

  return unlocked;
}

export function calculateBadgeProgress(badge: CommunityHeroBadge, profile: CommunityReputationProfile): {
  isUnlocked: boolean;
  currentValue: number;
  targetValue: number;
  percentage: number;
} {
  const isUnlocked = (profile.badges || []).some(b => b.badgeId === badge.id);
  let currentValue = 0;
  const targetValue = badge.threshold;

  if (badge.category === 'reporter') {
    currentValue = profile.approvedReportsCount || 0;
  } else if (badge.category === 'verifier') {
    currentValue = profile.verificationsCount || 0;
  } else if (badge.category === 'warning') {
    currentValue = profile.warningsCount || 0;
  } else if (badge.id === 'emergency_helper') {
    currentValue = profile.emergencyAssistsCount || 0;
  } else if (badge.id === 'location_master') {
    currentValue = profile.locationCorrectionsCount || 0;
  } else if (badge.id === 'community_helper') {
    currentValue = profile.helpfulUpdatesCount || 0;
  } else if (badge.id === 'road_safety_champion') {
    currentValue = profile.totalReputation || 0;
  } else {
    currentValue = isUnlocked ? targetValue : Math.min(profile.totalReputation || 0, targetValue);
  }

  const percentage = isUnlocked || currentValue >= targetValue ? 100 : Math.min(100, Math.round((currentValue / Math.max(1, targetValue)) * 100));

  return {
    isUnlocked: isUnlocked || currentValue >= targetValue,
    currentValue,
    targetValue,
    percentage
  };
}

// Real Community Heroes state - strictly populated by registered users and actual road contributions
export const SEED_COMMUNITY_HEROES: CommunityReputationProfile[] = [];
