import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  MapPin,
  ListFilter,
  Mic,
  ShieldCheck,
  Radio,
  Layers,
  Search,
  Sliders,
  Bell,
  Navigation,
  Compass,
  FileText,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  PhoneCall,
  Info,
  X,
  ShieldAlert,
  Shield,
  Lock,
  Database,
  AlertTriangle,
  Send,
  WifiOff,
  HardDriveDownload,
  UserCheck,
  SlidersHorizontal
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_CHANNEL_URL } from '../utils/whatsappShare';
import { getBadgeVersionString } from '../version';

interface GuideSection {
  id: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  bullets: {
    title: string;
    details: string;
  }[];
  tips?: string[];
  adminOnly?: boolean;
}

const BASE_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'navigation',
    title: 'Core Navigation & Main Views',
    badge: 'Overview',
    icon: Compass,
    description: 'LiveTraffic South Africa provides three primary operational lenses designed for commuter planning and live route monitoring.',
    bullets: [
      {
        title: 'Interactive Map (/map)',
        details: 'Full-screen geospatial map showing live color-coded speed telemetry, incident markers, active SANRAL CCTV cameras, toll plazas, and weather alerts across all 9 provinces.'
      },
      {
        title: 'Live Incident Feeds (/feed)',
        details: 'Chronological and prioritized highway bulletins with multi-province filtering, search, layout switching (Cards, Condensed, Minimal), and adjustable font scaling.'
      },
      {
        title: 'Emergency Dashboard (/dashboard)',
        details: 'Provincial corridor metrics, active obstruction statistics, major national artery status (N1, N2, N3, N4, N7), and high-impact closure counters.'
      }
    ],
    tips: [
      'Use the bottom navigation bar to switch between the Map, Feeds, Dashboard, and Admin Dispatch.',
      'Tap any corridor badge on the Map or Feeds to isolate incidents specifically for that highway.'
    ]
  },
  {
    id: 'whatsapp-channel',
    title: 'Official WhatsApp Broadcast Channel',
    badge: 'Real-Time Alerts',
    icon: WhatsAppIcon,
    description: 'Follow our official WhatsApp Channel for instantaneous, verified push alerts on major highway closures, multi-vehicle crashes, and emergency pass shutdowns directly to your mobile phone.',
    bullets: [
      {
        title: 'Instant Corridor Dispatches',
        details: 'Receive real-time notifications on N1, N2, N3, N4, N7, N12, N14, N17, M1, R21, and key metro arteries without opening the app.'
      },
      {
        title: 'Mountain Pass Closures & Severe Weather',
        details: 'Get urgent warnings for Van Reenen Pass snow closures, Du Toitskloof closures, low-visibility mist, and flash flooding.'
      },
      {
        title: 'Verified 24/7 Traffic Intelligence',
        details: 'Curated by verified controllers, RTMC feeds, SANRAL telemetry, and high-reputation scout updates.'
      }
    ],
    tips: [
      'Tap "Join Channel" to open the WhatsApp channel in WhatsApp Messenger or Web.',
      'Enable notifications within WhatsApp so you never miss high-impact highway shutdown alerts.'
    ]
  },
  {
    id: 'voice-assistant',
    title: 'Hands-Free Voice Traffic Assistant',
    badge: 'Voice AI',
    icon: Mic,
    description: 'Designed for safe, hands-free operation while driving. The floating microphone button is available on both the Map and Feeds screens.',
    bullets: [
      {
        title: 'Corridor Queries',
        details: 'Ask "What is happening on the N1 North?" or "Any crashes on the N3 near Van Reenen?" to instantly hear status summaries.'
      },
      {
        title: 'Map Camera & Layer Commands',
        details: 'Say "Switch to satellite view", "Show cameras", or "Zoom to Johannesburg" for quick hands-free navigation.'
      },
      {
        title: 'Audio Alert Playback',
        details: 'Say "Read latest alerts" to have the newest breaking dispatches read aloud over your car audio or speakers.'
      }
    ],
    tips: [
      'The microphone button is positioned comfortably above the bottom navigation bar.',
      'Enable speech synthesis permissions in your browser to hear voice feedback.'
    ]
  },
  {
    id: 'feed-controls',
    title: 'Feed Customization & Text Sizing',
    badge: 'Personalization',
    icon: ListFilter,
    description: 'Tailor the Live Incident Feed to your driving environment, device size, and reading preferences.',
    bullets: [
      {
        title: 'Dynamic Font Sizing (Default / Large / XL)',
        details: 'Switch between Default (A), Large (+15%), and XL (+30%) typography at the top of the feed for optimal visibility.'
      },
      {
        title: 'Multi-View Layouts',
        details: 'Toggle between "Cards" (full route details and tags), "Condensed" (compact multi-item list), and "Minimal" (high-contrast glanceable list).'
      },
      {
        title: 'Corridor & Province Filtering',
        details: 'Filter reports by province (Gauteng, Western Cape, KZN, Free State, etc.) or search directly by town or road name.'
      }
    ],
    tips: [
      'Your selected font size and layout preference are automatically saved across browser sessions.',
      'Use the "Oldest First" or "Newest First" sort toggle to audit historical logs.'
    ]
  },
  {
    id: 'map-tools',
    title: 'Map Layers, Tolls & CCTV Cameras',
    badge: 'Geospatial',
    icon: Layers,
    description: 'Gain complete visibility of road conditions with real-time layer overlays.',
    bullets: [
      {
        title: 'Live Speed & Congestion Heatmap',
        details: 'Freeway speeds are colored Green (Flowing > 80 km/h), Amber (Heavy 40–80 km/h), and Red (Congested < 40 km/h).'
      },
      {
        title: 'SANRAL & City CCTV Cameras',
        details: 'Tap any camera icon to inspect recent snapshot feeds along high-volume freeway bottlenecks.'
      },
      {
        title: 'Toll Plazas & E-Tag Tariffs',
        details: 'View plaza locations, pricing tiers, accepted payment methods, and average queue delays.'
      },
      {
        title: 'One-Tap Geolocation ("Locate Me")',
        details: 'Pinpoint your current vehicle location to reveal local hazards within a 25 km driving radius.'
      }
    ],
    tips: [
      'Click on any incident cluster pin to zoom in directly to individual obstructions.',
      'Weather radar overlays alert you to mountain pass snow, heavy hail, or localized flooding.'
    ]
  },
  {
    id: 'reporting',
    title: 'Incident Reporting & Verification',
    badge: 'Safety',
    icon: ShieldCheck,
    description: 'Community-driven hazard intelligence verified by traffic controllers.',
    bullets: [
      {
        title: 'Report a Road Hazard',
        details: 'Submit real-time reports for stationary vehicles, debris, potholes, or faulty traffic signals with GPS coordinates.'
      },
      {
        title: 'Verified Official Dispatches',
        details: 'High-priority alerts marked with verified badges come directly from emergency response centers and official RTMC feeds.'
      },
      {
        title: 'Emergency Contact Directory',
        details: 'Access national and provincial emergency numbers including SANRAL, Metro Police, ER24, Netcare 911, and Mountain Rescue.'
      }
    ],
    tips: [
      'Always pull over safely before submitting manual road hazard reports.',
      'Bookmark emergency dispatch numbers for offline emergency access.'
    ]
  }
];

const ADMIN_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'administrator',
    title: 'Administrator: Admin Portal Functions',
    badge: 'Administrator',
    icon: Shield,
    adminOnly: true,
    description: 'Dedicated operational control suite for system administrators and traffic controllers to govern road safety intelligence, moderate reports, clear map hazards, and manage user statuses.',
    bullets: [
      {
        title: '1. Reporting Moderation & Verification',
        details: 'Review incoming community-reported road hazards and crowdsourced submissions in the Moderation Queue. Inspect attached photo evidence and GPS coordinates, cross-check against official RTMC/SANRAL telemetry, edit incorrect landmark names, approve reports to promote them to official verified feeds, or reject inaccurate/duplicate flags.'
      },
      {
        title: '2. Map Hazard Clearing & Incident Resolution',
        details: 'Manage live obstructions, roadworks, and stationary vehicles displayed on the interactive map. When emergency personnel clear a scene, update the hazard status to "Scene Clearing", "Queues Dissipating", or "Resolved / Open" to instantaneously clear the hazard pin from all live motorist maps and recalculate road flow.'
      },
      {
        title: '3. User Status & Role Management',
        details: 'Govern user account credentials, verification badges, and role permissions. Upgrade trusted scouts to "Verified Broadcaster" or "Traffic Controller", monitor user contribution accuracy and reputation points, verify emergency service personnel, and suspend or flag abusive accounts.'
      },
      {
        title: '4. Emergency Broadcasting & Mountain Pass Closures',
        details: 'Execute high-impact emergency broadcasts and full-corridor closures (e.g. N3 Van Reenen Pass snow closures or N1 heavy multi-vehicle crashes). Broadcaster alerts immediately trigger red emergency ticker banners and push notification dispatches.'
      },
      {
        title: '5. Voice Assistant Audio Synthesizer Dispatch',
        details: 'Broadcast text-to-speech audio bulletins directly to connected in-vehicle voice assistants, delivering critical safety warnings to drivers approaching dangerous corridors.'
      },
      {
        title: '6. Tamper-Evident Security & Action Audit Logs',
        details: 'Every dispatch action, report moderation decision, hazard status change, and user role update is cryptographically logged with controller ID, timestamp, and IP signature for regulatory compliance.'
      }
    ],
    tips: [
      'Always verify whether an incident affects one direction (e.g. N1 Northbound) or both carriageways before issuing closure alerts.',
      'Marking a hazard as "Resolved" moves it to historical audit logs without cluttering live motorist map layers.',
      'Access the full Admin Console anytime via the bottom navigation or Admin Portal button.'
    ]
  }
];

export const GettingStartedModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
  isAdmin?: boolean;
  initialSectionId?: string;
  onOpenLoginModal?: () => void;
  currentUserRole?: string;
}> = ({ isOpen, onClose, onNavigateToTab, isAdmin = false, initialSectionId }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    if (initialSectionId) return initialSectionId;
    if (isAdmin) return 'administrator';
    return 'navigation';
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialSectionId) {
      setActiveSectionId(initialSectionId);
    } else if (isAdmin) {
      setActiveSectionId('administrator');
    }
  }, [initialSectionId, isAdmin, isOpen]);

  if (!isOpen) return null;

  const allSections = isAdmin ? [...ADMIN_GUIDE_SECTIONS, ...BASE_GUIDE_SECTIONS] : BASE_GUIDE_SECTIONS;

  const currentSection = allSections.find(s => s.id === activeSectionId) || allSections[0];

  const filteredSections: GuideSection[] = searchQuery.trim()
    ? allSections.filter((s: GuideSection) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.bullets.some(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.details.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allSections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e1118] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Getting Started & Functions Guide
                </h2>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/40 uppercase tracking-wide">
                  {getBadgeVersionString()} TEST
                </span>
                {isAdmin && (
                  <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/30 uppercase tracking-wide flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-rose-400" />
                    <span>Admin Guide Active</span>
                  </span>
                )}
                {!isAdmin && (
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wide">
                    Driver / Commuter Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Complete operational manual for LiveTraffic South Africa
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold transition shadow-sm"
              title="Join WhatsApp Broadcast Channel"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
              <span>WhatsApp Channel</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header / Search */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-[#090b0f] flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search functions (e.g. moderation, map hazard clearing, voice, cameras, whatsapp)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#12151d] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Content Body with Left Sidebar + Right Details */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800/80 p-2 sm:p-3 overflow-y-auto space-y-1 bg-[#090b0f]">
            {filteredSections.map(section => {
              const IconComp = section.icon;
              const isSelected = section.id === currentSection.id;
              const isSectionAdmin = section.adminOnly;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSectionId(section.id)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-center space-x-3 cursor-pointer ${
                    isSelected
                      ? isSectionAdmin
                        ? 'bg-rose-500/15 border border-rose-500/40 text-white shadow-sm'
                        : section.id === 'whatsapp-channel'
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-white shadow-sm'
                        : 'bg-amber-500/15 border border-amber-500/40 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? isSectionAdmin
                          ? 'bg-rose-500 text-slate-950 font-black'
                          : section.id === 'whatsapp-channel'
                          ? 'bg-[#25D366] text-slate-950 font-black'
                          : 'bg-amber-500 text-slate-950 font-black'
                        : isSectionAdmin
                        ? 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
                        : section.id === 'whatsapp-channel'
                        ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate text-slate-100">{section.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{section.badge}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? (isSectionAdmin ? 'text-rose-400' : 'text-amber-400') : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>

          {/* Details Panel */}
          <div className="md:col-span-8 p-4 sm:p-6 overflow-y-auto space-y-5 bg-[#0B0D12]">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  currentSection.adminOnly
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : currentSection.id === 'whatsapp-channel'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {currentSection.badge}
                </span>
                {currentSection.adminOnly && (
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700">
                    Restricted Access
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <span>{currentSection.title}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                {currentSection.description}
              </p>
            </div>

            {/* If section is WhatsApp Channel, render a prominent join card */}
            {currentSection.id === 'whatsapp-channel' && (
              <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/30 to-[#0A1612] border border-[#25D366]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366] text-[#25D366] flex items-center justify-center shrink-0">
                    <WhatsAppIcon className="w-6 h-6 text-[#25D366] shrink-0" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      Live Traffic NPC WhatsApp Channel
                    </h4>
                    <p className="text-xs text-emerald-200 mt-0.5">
                      Join 10,000+ drivers receiving real-time highway broadcasts
                    </p>
                  </div>
                </div>

                <a
                  href={WHATSAPP_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center space-x-1.5 shrink-0"
                >
                  <span>JOIN CHANNEL NOW</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Bullets & Features */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Feature Highlights & Controls</span>
              </h4>

              <div className="grid gap-2.5">
                {currentSection.bullets.map((b, idx) => (
                  <div
                    key={idx}
                    className="bg-[#12151d] border border-slate-800/80 rounded-xl p-3.5 space-y-1 hover:border-slate-700/80 transition"
                  >
                    <div className="flex items-start space-x-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${currentSection.adminOnly ? 'text-rose-400' : currentSection.id === 'whatsapp-channel' ? 'text-[#25D366]' : 'text-emerald-400'}`} />
                      <div className="space-y-0.5">
                        <h5 className="text-xs sm:text-sm font-bold text-white leading-snug">{b.title}</h5>
                        <p className="text-xs text-slate-300 leading-relaxed">{b.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips Section */}
            {currentSection.tips && currentSection.tips.length > 0 && (
              <div className={`border rounded-xl p-3.5 space-y-1.5 ${
                currentSection.adminOnly
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : currentSection.id === 'whatsapp-channel'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <Info className="w-3.5 h-3.5" />
                  <span>{currentSection.adminOnly ? 'Controller Operational Directives' : 'Pro-Tips for Safe Driving'}</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  {currentSection.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="pt-2 flex items-center space-x-2 flex-wrap gap-y-2">
              <a
                href={WHATSAPP_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black text-xs rounded-lg shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span>Join WhatsApp Channel</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {onNavigateToTab && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTab('map');
                    }}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Open Live Map</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToTab('feed');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg border border-slate-700 transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Open Incident Feeds</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab('admin');
                      }}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Open Admin Portal</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0e1118] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LiveTraffic Telemetry Online</span>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#25D366] hover:underline font-bold flex items-center space-x-1"
            >
              <span>whatsapp.com/channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
