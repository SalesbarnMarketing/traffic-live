import type { IncidentReport, EmergencySOS, FeedItem, Donation, DonationStats, SupportTier, ResponderPartner } from '../types.ts';

export const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: 'rep-101',
    type: 'spiking',
    title: 'Spike Trap Reported on N1 Northbound near Pumulani Toll',
    description: 'Road spikes hidden under cardboard boxes observed near kilometer marker 34. Two vehicles pulled over with flat tyres.',
    latitude: -25.6234,
    longitude: 28.2812,
    locationName: 'Pumulani Toll Plaza, N1 North',
    roadName: 'N1 Highway',
    imageUrl: '',
    status: 'approved',
    severity: 'critical',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    reporterName: 'Sipho Patrol Watch',
    reporterPhone: '+27 82 555 0192',
    upvotes: 42,
    verifiedByAdmin: true,
    approvedByAdminId: 'usr-admin-charles',
    approvedByAdminName: 'Charles Odendaal',
    approvedByAdminEmail: 'charlesodendaal43@gmail.com',
    approvedByAdminRole: 'super_admin',
    approvedAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
    adminNotes: 'Verified by Highway Patrol Unit 4. Tow trucks dispatched.',
    aiAnalysis: {
      riskScore: 95,
      summary: 'High threat spike hazard reported on major transit route. High risk of armed ambush or loss of vehicle control.',
      categoryRecommendation: 'spiking',
      warningText: 'DO NOT STOP if tyres puncture. Continue at low speed to safe, lit petrol station.',
      suggestedAction: 'Reroute via R101 or maintain extreme vigilance.'
    }
  },
  {
    id: 'rep-102',
    type: 'pothole',
    title: 'Deep Multi-Chasm Pothole Cluster on R59 Offramp',
    description: 'Multiple deep potholes right after the curve on R59 South offramp to Kliprivier. Sharp edges causing rim damage.',
    latitude: -26.3120,
    longitude: 28.0890,
    locationName: 'Kliprivier Offramp, R59 South',
    roadName: 'R59 Highway',
    imageUrl: '',
    status: 'approved',
    severity: 'high',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    reporterName: 'Kareen Van Zyl',
    reporterPhone: '+27 71 888 3412',
    upvotes: 28,
    verifiedByAdmin: true,
    approvedByAdminId: 'usr-admin-charles',
    approvedByAdminName: 'Charles Odendaal',
    approvedByAdminEmail: 'charlesodendaal43@gmail.com',
    approvedByAdminRole: 'super_admin',
    approvedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    adminNotes: 'Reported to Municipal Road Maintenance Division.',
    aiAnalysis: {
      riskScore: 78,
      summary: 'Severe road infrastructure degradation post heavy rainfall.',
      categoryRecommendation: 'pothole',
      warningText: 'Slow down before the bend to avoid sudden braking.',
      suggestedAction: 'Marked for community temporary cold-asphalt patch team.'
    }
  },
  {
    id: 'rep-103',
    type: 'traffic',
    title: 'Severe Congestion & Stalled Truck on M1 South @ Woodmead',
    description: 'Heavy duty vehicle breakdown blocking middle 2 lanes. Traffic backed up 6km past Buccleuch interchange.',
    latitude: -26.0621,
    longitude: 28.1023,
    locationName: 'M1 South @ Woodmead Drive',
    roadName: 'M1 Southbound',
    imageUrl: '',
    status: 'approved',
    severity: 'medium',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    reporterName: 'Thabo Traffic Alert',
    reporterPhone: '+27 83 400 1122',
    upvotes: 35,
    verifiedByAdmin: true,
    approvedByAdminId: 'usr-admin-sylvester',
    approvedByAdminName: 'Sylvester Dispatch',
    approvedByAdminEmail: 'sylvester@trafficlive.co.za',
    approvedByAdminRole: 'admin',
    approvedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    adminNotes: 'Traffic Metro Police on scene directing flow.',
    aiAnalysis: {
      riskScore: 60,
      summary: 'Major arterial traffic bottleneck. Estimated delay: +35 mins.',
      categoryRecommendation: 'traffic',
      warningText: 'Expect stop-start traffic.',
      suggestedAction: 'Consider taking N3 or Bowling Ave detour.'
    }
  },
  {
    id: 'rep-104',
    type: 'spiking',
    title: 'Spike Trap & Metal Strips Verified on R21 South near OR Tambo',
    description: 'Sharp homemade metal spike rods hidden inside cardboard bags across slow lane on R21 South before Voortrekker offramp.',
    latitude: -26.1380,
    longitude: 28.2320,
    locationName: 'R21 South @ Voortrekker Offramp',
    roadName: 'R21 Highway',
    imageUrl: '',
    status: 'approved',
    severity: 'critical',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    reporterName: 'Kempton Patrol Unit',
    reporterPhone: '+27 82 999 1234',
    upvotes: 24,
    verifiedByAdmin: true,
    approvedByAdminId: 'usr-admin-charles',
    approvedByAdminName: 'Charles Odendaal',
    approvedByAdminEmail: 'charlesodendaal43@gmail.com',
    approvedByAdminRole: 'super_admin',
    approvedAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    adminNotes: 'Confirmed by interceptor unit. SAPS notified.',
    aiAnalysis: {
      riskScore: 98,
      summary: 'Critical spiking threat signature confirmed. High risk of ambush.',
      categoryRecommendation: 'spiking',
      warningText: 'Do not pull over on shoulder. Drive to nearby illuminated fuel station.',
      suggestedAction: 'Immediate police patrol escort advised.'
    }
  },
  {
    id: 'rep-105',
    type: 'spiking',
    title: 'Spike Trap Obstacle on N4 Highway near Solomon Mahlangu Offramp',
    description: 'Concrete block with protruding spikes spotted in center lane eastbound.',
    latitude: -25.7580,
    longitude: 28.3620,
    locationName: 'N4 East @ Solomon Mahlangu',
    roadName: 'N4 Highway',
    imageUrl: '',
    status: 'approved',
    severity: 'critical',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    reporterName: 'Pretoria East Watch',
    reporterPhone: '+27 84 555 7821',
    upvotes: 31,
    verifiedByAdmin: true,
    approvedByAdminId: 'usr-admin-sylvester',
    approvedByAdminName: 'Sylvester Dispatch',
    approvedByAdminEmail: 'sylvester@trafficlive.co.za',
    approvedByAdminRole: 'admin',
    approvedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    adminNotes: 'Patrol unit en route for debris clearance.',
    aiAnalysis: {
      riskScore: 94,
      summary: 'Active spike obstacle. Potential ambush hazard.',
      categoryRecommendation: 'spiking',
      warningText: 'Avoid center lane eastbound.',
      suggestedAction: 'Slow down and maintain safe visual range.'
    }
  }
];

export const INITIAL_SOS_REQUESTS: EmergencySOS[] = [];

export const INITIAL_FEED_ITEMS: FeedItem[] = [
  {
    id: 'feed-admin-001',
    source: 'admin_dispatch',
    author: '🛡️ ADMIN PATROL COMMAND',
    handle: '@PatrolHQ',
    content: '🚨 ADMIN DISPATCH: Highway patrol teams active along N1 Pumulani toll corridor following user-flagged spike trap reports. Searchlights deployed.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    location: 'N1 North @ Pumulani Toll',
    category: 'spiking',
    verified: true,
    showOnLiveWatch: true,
    postedByAdminId: 'usr-admin-charles',
    postedByAdminName: 'Charles Odendaal',
    postedByAdminEmail: 'charlesodendaal43@gmail.com',
    postedByAdminRole: 'super_admin',
    postedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'feed-approved-002',
    source: 'community',
    author: 'Verified Follower Report (Sipho D.)',
    handle: '@SiphoDriver',
    content: '✅ APPROVED BY ADMIN: [SPIKE TRAP ALERT] Metal spike strip confirmed near R21 Kempton Park offramp. Patrol unit dispatched.',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    location: 'R21 Kempton Park Offramp',
    category: 'spiking',
    verified: true,
    approvedByAdminId: 'usr-admin-sylvester',
    approvedByAdminName: 'Sylvester Dispatch',
    approvedByAdminEmail: 'sylvester@trafficlive.co.za',
    approvedByAdminRole: 'admin',
    approvedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString()
  },
  {
    id: 'feed-pothole-fixed-003',
    source: 'admin_dispatch',
    author: '🔨 POTHOLE REPAIR COMPLETED',
    handle: '@RoadWatchFix',
    content: '🎉 REPAIR VERIFIED: 2 potholes sponsored by Gareth M. on R59 Kliprivier offramp successfully patched with cold asphalt by patrol crew!',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    location: 'R59 Kliprivier Offramp',
    mediaUrl: '',
    category: 'pothole',
    verified: true,
    postedByAdminId: 'usr-admin-charles',
    postedByAdminName: 'Charles Odendaal',
    postedByAdminEmail: 'charlesodendaal43@gmail.com',
    postedByAdminRole: 'super_admin',
    postedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'don-pothole-1',
    donorName: 'Gareth M.',
    amount: 700,
    category: 'pothole_repair',
    message: 'Fixed 2 dangerous rim-bending potholes on R59 Kliprivier offramp! Save those tyres!',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isAnonymous: false,
    potholesCount: 2,
    potholeLocation: 'Kliprivier Offramp, R59 South',
    potholeImageUrl: '',
    fixedImageUrl: '',
    isFixed: true,
    adminFeedback: 'Repaired with high-durability cold premix asphalt. Safe for all traffic.',
    potholeLat: -26.3120,
    potholeLng: 28.0890,
    referenceNumber: 'POT-7782'
  },
  {
    id: 'don-fuel-1',
    donorName: 'Sandton 4x4 Community',
    amount: 1200,
    category: 'fuel',
    message: '50 Litres of diesel to keep the N1 & N4 night patrol vehicles cruising until dawn.',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    isAnonymous: false,
    referenceNumber: 'FUL-9012'
  },
  {
    id: 'don-coffee-1',
    donorName: 'Sarah Jenkins',
    amount: 200,
    category: 'coffee',
    message: 'Hot coffees & energy pies for the night crew watching the spike hotspots in the cold!',
    timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    isAnonymous: false,
    referenceNumber: 'COF-3411'
  },
  {
    id: 'don-equip-1',
    donorName: 'Dr. K. Naidoo',
    amount: 850,
    category: 'equipment',
    message: 'High-intensity LED searchlight kit for spike detection units.',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    isAnonymous: false,
    referenceNumber: 'EQP-5501'
  },
  {
    id: 'don-course-1',
    donorName: 'Centurion Logistics Fleet',
    amount: 1500,
    category: 'advance_driving',
    message: 'Defensive & Anti-Hijack course registration for emergency response team.',
    timestamp: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    isAnonymous: false,
    referenceNumber: 'DRV-1002'
  }
];

export const INITIAL_DONATION_STATS: DonationStats = {
  totalRaised: 33200,
  goalAmount: 50000,
  coffeeCount: 142,
  fuelLiters: 420,
  equipmentItemsFunded: 18,
  potholesFunded: 24,
  backersCount: 65
};

export const INITIAL_SUPPORT_TIERS: SupportTier[] = [
  {
    id: 'advance_driving',
    title: 'Advance Driving Course',
    amount: 1500,
    description: 'Master advanced defensive driving, skid & aquaplane control, high-speed collision avoidance, and anti-hijack evasion techniques.',
    icon: 'tool',
    categoryKey: 'advance_driving',
    enabled: true
  },
  {
    id: 'pothole_repair',
    title: 'Fix a Pothole',
    amount: 350,
    description: 'Sponsor a cold-asphalt pothole repair patch (R350 per hole). Upload a photo & pin location to eliminate dangerous road chasms.',
    icon: 'tool',
    categoryKey: 'pothole_repair',
    enabled: true
  },
  {
    id: 'coffee',
    title: 'Buy a Coffee / Meal',
    amount: 100,
    description: 'Fuel night-shift corridor patrol volunteers with hot coffee, energy drinks, or a warm meal during cold spike watch.',
    icon: 'coffee',
    categoryKey: 'coffee',
    enabled: true
  },
  {
    id: 'equipment',
    title: 'Patrol Equipment',
    amount: 350,
    description: 'Fund high-intensity spotlight torches, high-vis reflective vests, emergency tyre sealant spikes repair kits, and basic trauma supplies.',
    icon: 'equipment',
    categoryKey: 'equipment',
    enabled: true
  },
  {
    id: 'fuel',
    title: 'Patrol Vehicle Fuel',
    amount: 800,
    description: 'Keep community mobile patrol response vehicles cruising and monitoring high-risk highway corridors (N1, N4, R21, M1).',
    icon: 'fuel',
    categoryKey: 'fuel',
    enabled: true
  }
];

export const INITIAL_RESPONDER_PARTNERS: ResponderPartner[] = [
  {
    id: 'resp-botha',
    name: 'Lead Tactical Officer Botha',
    type: 'patrol_officer',
    callsign: 'Patrol Unit Bravo-1',
    phone: '+27 82 555 1290',
    label: '🚓 Tactical Officer Botha (Bravo-1)',
    coverageArea: 'N1 North (Midrand, Centurion, Pretoria East)',
    notes: 'Primary tactical escort & highway puncture assist unit. Armed response certified.',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-vdm',
    name: 'Patroller J. van der Merwe',
    type: 'patrol_officer',
    callsign: 'Patrol Unit Alpha-2',
    phone: '+27 83 222 4499',
    label: '🚓 Patroller van der Merwe (Alpha-2)',
    coverageArea: 'N4 Highway & R21 Corridor',
    notes: 'Mobile tyre compressor and emergency plug kit equipped.',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-autocheck',
    name: 'AutoCheck Roadside Partner',
    type: 'partner_responder',
    callsign: 'Rescue Unit 3',
    phone: '+27 84 900 3322',
    label: '🤝 AutoCheck Roadside Unit 3',
    coverageArea: 'Greater Johannesburg & Sandton Bypass',
    notes: 'Commercial battery boost, fuel drops, and rim replacement.',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-saps',
    name: 'SAPS Highway Patrol Flying Squad',
    type: 'saps_police',
    callsign: 'Sector S-12',
    phone: '10111',
    label: '🚔 SAPS Highway Flying Squad',
    coverageArea: 'Gauteng Provincial Highway Network',
    notes: 'Official armed law enforcement highway anti-hijacking unit.',
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-ems',
    name: 'Netcare 911 / ER24 Paramedic',
    type: 'medical_ems',
    callsign: 'Trauma Unit M-4',
    phone: '084 124',
    label: '🚑 Netcare 911 / ER24 EMS',
    coverageArea: 'All Corridors (Priority Trauma Response)',
    notes: 'Advanced Life Support (ALS) rapid response medic vehicle.',
    isActive: true,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-towing',
    name: 'First Help Heavy Recovery Towing',
    type: 'towing_recovery',
    callsign: 'Heavy Tow-7',
    phone: '+27 11 900 8800',
    label: '🛻 Heavy Recovery Towing',
    coverageArea: 'N1 & N3 Heavy Transport Corridors',
    notes: 'Flatbed breakdown recovery and rollover stabilization.',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-cpf',
    name: 'Community CPF Highway Watch',
    type: 'community_responder',
    callsign: 'Sector CPF Bravo',
    phone: '+27 82 111 0099',
    label: '👥 Community CPF Watch',
    coverageArea: 'R59, Kliprivier, Heidelberg Corridor',
    notes: 'Community volunteer spotters and stationary hazard security.',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

