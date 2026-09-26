import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ExternalLink, 
  RefreshCw, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  Globe, 
  Car, 
  Send, 
  Filter, 
  MapPin, 
  Camera, 
  CheckCircle2, 
  Wrench, 
  AlertCircle, 
  Plus, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Trash2, 
  AlertTriangle, 
  AlertOctagon, 
  Construction, 
  Search,
  Clock,
  Navigation,
  Activity,
  Copy,
  Hash,
  MessageSquare,
  Share2,
  LayoutGrid,
  List,
  AlignLeft,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  User,
  SlidersHorizontal,
  Layers,
  CheckSquare,
  Square,
  Upload,
  Maximize2,
  Minimize2,
  Type,
  Megaphone,
  ArrowRight,
  Edit3,
  ThumbsUp,
  CircleDot,
  HeartHandshake
} from 'lucide-react';
import { FeedItem, AdvertisementBanner, RegisteredUser } from '../types';
import { FeedAdBanner } from './FeedAdBanner';
import { ShareAppFeedCard } from './ShareAppFeedCard';
import { TechrixFeedAdCard } from './TechrixFeedAdCard';
import { HighwayTravelTimesSection } from './HighwayTravelTimesSection';
import { EditFeedModal } from './EditFeedModal';
import { ImageLightboxModal, ImageLightboxData } from './ImageLightboxModal';
import { IncidentImagePreview } from './IncidentImagePreview';
import { AdminAuditBadge } from './AdminAuditBadge';
import { WhatsAppIcon } from './WhatsAppIcon';
import { getCategoryDefaultImage, getAllCategoryConfigs, getItemMediaImage } from '../utils/categoryImageHelper';
import { scrapeLiveITrafficInBrowser } from '../utils/browserITrafficScraper';
import { parseDateToMillis, formatReadableDateTime, formatSATime, formatWhatsAppDateTime } from '../utils/dateParser';
import { 
  SARegionId, 
  SA_REGIONS, 
  SA_PROVINCES_LIST, 
  resolveItemRegion, 
  autoDetectUserRegion, 
  getSavedRegion, 
  saveSelectedRegion, 
  saveDetectedRegion,
  getSavedDetectedRegion 
} from '../utils/regionUtils';
import { 
  generateITrafficHashtags, 
  formatITrafficForWhatsApp, 
  copyToClipboard, 
  openWhatsAppShare,
  resolveShareableImageUrl,
  getPublicAppUrl,
  WHATSAPP_CHANNEL_URL
} from '../utils/whatsappShare';
import { cleanTrafficText } from '../utils/textSanitizer';
import { openXShareWindow, openFacebookShareWindow } from '../utils/shareToX';
import { useFeedPresence } from '../hooks/useFeedPresence';
import { FeedPresenceInspector } from './FeedPresenceInspector';
import { getAllPostRelatedIds, isPostDeleted, registerDeletedPostId, isGloballyDeleted } from '../utils/idUtils';
import { clearAllPostCaches } from '../utils/apiClient';
import { canUserDeletePost, getAdminRequestHeaders } from '../utils/authUtils';
import { 
  isItemAdminPost, 
  isItemUserPost,
  isItemUnverifiedUserPost,
  isItemAdminVerified,
  getItemTimestampValue, 
  getLiveFeedWindowBounds, 
  filterFeedItemsInLiveWindow 
} from '../utils/feedWindowUtils';
import {
  CityTrafficFilter,
  isPretoriaItem,
  isJohannesburgItem,
  isGautengItem,
  isKZNItem,
  isWesternCapeItem,
  isEasternCapeItem,
  isFreeStateItem,
  isMpumalangaItem,
  isLimpopoItem,
  isNorthWestItem,
  isNorthernCapeItem,
  getComprehensiveTrafficCounts,
  getCityTrafficCounts,
  isITrafficItem,
  isGoogleMapsScanItem
} from '../utils/cityTrafficUtils';

export function getItemViews(item: Partial<FeedItem> | null | undefined, viewsMap?: Record<string, number>): number {
  if (!item) return 1;
  let maxViews = typeof item.views === 'number' && item.views > 0 ? item.views : 1;
  if (item.id && viewsMap) {
    const rawId = item.id.trim();
    const cleanId = rawId
      .replace(/^feed-report-rep-/, '')
      .replace(/^feed-report-/, '')
      .replace(/^feed-auto-/, '')
      .replace(/^feed-rep-/, '')
      .replace(/^feed-/, '')
      .replace(/^report-/, '')
      .replace(/^rep-/, '');

    const candidateKeys = [
      rawId,
      cleanId,
      `rep-${cleanId}`,
      `report-${cleanId}`,
      `feed-${cleanId}`,
      `feed-rep-${cleanId}`,
      `feed-report-${cleanId}`,
      `feed-report-rep-${cleanId}`,
      `feed-auto-${cleanId}`
    ];

    for (const key of candidateKeys) {
      if (typeof viewsMap[key] === 'number' && viewsMap[key] > maxViews) {
        maxViews = viewsMap[key];
      }
    }
  }
  return Math.max(1, maxViews);
}

export function formatViewsShort(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '1';
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 10_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toLocaleString();
}

export interface FeedPosterInfo {
  name: string;
  email?: string;
  role?: string;
  badgeLabel: string;
  isAdmin: boolean;
  isOfficial: boolean;
  isCommunity: boolean;
}

export const getUserPostDisplayName = (item: Partial<FeedItem> | null | undefined): string => {
  if (!item) return 'Community Motorist';
  
  const firstName = (item.postedByUserName || item.reporterName || '').trim();
  const surname = (item.postedByUserSurname || item.reporterSurname || '').trim();

  let fullName = firstName;
  if (surname) {
    if (!fullName) {
      fullName = surname;
    } else if (!fullName.toLowerCase().includes(surname.toLowerCase())) {
      fullName = `${fullName} ${surname}`.trim();
    }
  }

  if (!fullName) {
    fullName = (item.author || '').trim();
  }

  // Clean formatted name - strip emojis & admin suffixes
  fullName = fullName
    .replace(/^[🛡️👤✅🏛️\s]+/, '')
    .replace(/\s*\(Admin\)\s*$/i, '')
    .trim();

  if (fullName.includes('@') && !fullName.includes(' ')) {
    fullName = fullName.split('@')[0];
  }

  return fullName || 'Community Motorist';
};

export const getFeedItemPosterInfo = (item: FeedItem): FeedPosterInfo => {
  const directName = (item.postedByUserName || item.postedByAdminName || item.reporterName || '').trim();
  const surname = (item.postedByUserSurname || item.reporterSurname || '').trim();
  const email = item.postedByUserEmail || item.postedByAdminEmail || item.reporterEmail;
  const author = (item.author || '').trim();

  // Check if official admin post
  const isAdmin = Boolean(
    item.postedByAdminName ||
    item.postedByAdminId ||
    (directName && (directName.includes('🛡️') || directName.toLowerCase().includes('admin'))) ||
    (author && (author.includes('🛡️') || author.toLowerCase().includes('admin'))) ||
    item.source === 'admin_dispatch'
  );

  let rawName = directName;
  if (surname && rawName && !rawName.toLowerCase().includes(surname.toLowerCase())) {
    rawName = `${rawName} ${surname}`.trim();
  } else if (!rawName && surname) {
    rawName = surname;
  }
  if (!rawName) {
    rawName = author;
  }

  if (!rawName || rawName === 'i-Traffic' || rawName === 'iTraffic' || rawName === 'iTraffic SA') {
    return {
      name: 'iTraffic SA / SANRAL',
      email,
      role: 'Corridor Agency',
      badgeLabel: '🏛️ iTraffic SA',
      isAdmin: false,
      isOfficial: true,
      isCommunity: false
    };
  }

  // Clean formatted name
  const cleanName = rawName.replace(/^[🛡️👤✅🏛️\s]+/, '').replace(/\s*\(Admin\)\s*$/i, '').trim();

  if (isAdmin) {
    return {
      name: cleanName || 'Admin Dispatch',
      email,
      role: item.postedByAdminRole || 'Admin',
      badgeLabel: `🛡️ ${cleanName || 'Admin'} (Admin)`,
      isAdmin: true,
      isOfficial: false,
      isCommunity: false
    };
  }

  return {
    name: cleanName || 'Community Motorist',
    email,
    role: 'Motorist',
    badgeLabel: `👤 ${cleanName || 'Community Motorist'}`,
    isAdmin: false,
    isOfficial: false,
    isCommunity: true
  };
};

export const PosterBadge: React.FC<{ item: FeedItem; size?: 'sm' | 'md'; className?: string }> = () => {
  return null;
};

interface LiveFeedSectionProps {
  feedItems?: FeedItem[];
  currentUser?: RegisteredUser | null;
  onSimulateITraffic?: () => Promise<void>;
  onSimulateXLiveTraffic?: () => Promise<void>;
  onFetchAISummary?: () => Promise<string>;
  onOpenDriverMode?: () => void;
  onRefreshFeed?: () => Promise<void>;
  onRefreshReports?: () => Promise<void>;
  onAddFeedItem?: (item: FeedItem) => void;
  onDeleteFeedItem?: (id: string) => Promise<void> | void;
  onEditFeedItem?: (id: string, updatedFields: Partial<FeedItem>) => Promise<void> | void;
  onOpenShareToX?: (options?: any) => void;
  onOpenShareToWhatsApp?: (options?: { feedItem?: FeedItem; customText?: string }) => void;
  focusedAlertQuery?: string | null;
  onClearFocusedAlert?: () => void;
  onNavigateToAdvertiser?: () => void;
  onSwitchTab?: (tab: any) => void;
}

export const LiveFeedSection: React.FC<LiveFeedSectionProps> = ({
  feedItems: propsFeedItems,
  currentUser,
  onOpenDriverMode,
  onRefreshFeed,
  onRefreshReports,
  onAddFeedItem,
  onDeleteFeedItem,
  onEditFeedItem,
  onOpenShareToX,
  onOpenShareToWhatsApp,
  focusedAlertQuery,
  onClearFocusedAlert,
  onNavigateToAdvertiser,
  onSwitchTab
}) => {
  const isPermittedAdminRole = (role?: string) => {
    return role === 'super_admin' || role === 'admin' || role === 'moderator' || role === 'patrol';
  };

  const isUserAdmin = Boolean(
    (currentUser && (
      isPermittedAdminRole(currentUser.role) ||
      currentUser.email === 'charlesodendaal43@gmail.com'
    )) ||
    (typeof window !== 'undefined' && Boolean(sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')))
  );

  const canUserDeleteFeedItem = (item: FeedItem): boolean => {
    return canUserDeletePost(item, currentUser, isUserAdmin);
  };

  // Helper to ensure feedItems are always strictly unique by item.id
  const deduplicateFeedItems = (items: FeedItem[]): FeedItem[] => {
    if (!Array.isArray(items)) return [];
    const seen = new Set<string>();
    return items.filter(item => {
      if (!item || !item.id) return false;
      if (isGloballyDeleted(item.id)) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Tabs & Unified Category Filter: 'all' (Unified: Admin, i-Traffic, Community, Crashes, Spiking, etc.)
  const [activeTab, setActiveTab] = useState<'itraffic' | 'admin' | 'dispatches'>('itraffic');
  const [feedCategoryFilter, setFeedCategoryFilter] = useState<'all' | 'admin' | 'crashes' | 'spiking' | 'itraffic' | 'community' | 'potholes' | 'traveltimes' | 'gbv'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>(() => deduplicateFeedItems(propsFeedItems || []));
  // Set of known item IDs to identify dynamically incoming feed items during auto-refreshes
  const knownItemIdsRef = useRef<Set<string>>(
    new Set((propsFeedItems || []).map(f => f?.id).filter(Boolean) as string[])
  );
  const isInitialFeedLoadRef = useRef<boolean>(true);
  const [newlyAddedItemIds, setNewlyAddedItemIds] = useState<Set<string>>(new Set());
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);
  const [isSyncingITraffic, setIsSyncingITraffic] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [copiedItemIds, setCopiedItemIds] = useState<Record<string, boolean>>({});
  const [bulletinCopied, setBulletinCopied] = useState<boolean>(false);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [activeFocusedNotice, setActiveFocusedNotice] = useState<string | null>(null);
  
  // Full Screen Feed Mode State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const feedContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const next = !prev;
      if (next) {
        try {
          if (feedContainerRef.current?.requestFullscreen) {
            feedContainerRef.current.requestFullscreen().catch(() => {});
          } else if ((document.documentElement as any)?.requestFullscreen) {
            (document.documentElement as any).requestFullscreen().catch(() => {});
          }
        } catch (e) {}
      } else {
        try {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        } catch (e) {}
      }
      return next;
    });
  };

  // Listen for Escape key and native fullscreen change to exit fullscreen seamlessly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          try {
            document.exitFullscreen().catch(() => {});
          } catch (e) {}
        }
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // View Mode State: 'bullets' (default) vs 'minimal' vs 'condensed' vs 'detailed' (cards)
  const [viewMode, setViewMode] = useState<'minimal' | 'condensed' | 'detailed' | 'bullets'>(() => {
    try {
      // Check if user has explicitly chosen a view mode in v2
      const savedV2 = localStorage.getItem('livetraffic_feed_view_mode_v2');
      if (savedV2 === 'minimal' || savedV2 === 'condensed' || savedV2 === 'detailed' || savedV2 === 'bullets') {
        return savedV2;
      }
      // Check legacy saved value only if user explicitly selected condensed or detailed
      const legacySaved = localStorage.getItem('livetraffic_feed_view_mode');
      if (legacySaved === 'condensed' || legacySaved === 'detailed') {
        return legacySaved;
      }
      return 'bullets';
    } catch {
      return 'bullets';
    }
  });
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({});

  // Sort Order State: 'newest' (Newest first / Descending) vs 'oldest' (Oldest first / Ascending)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_feed_sort_order');
      if (saved === 'newest' || saved === 'oldest') return saved;
      return 'newest';
    } catch {
      return 'newest';
    }
  });

  // Feed Font Size Scaling: 'standard' (Regular/Comfortable) vs 'large' (Enhanced 115%) vs 'extra_large' (Ultra High Legibility 130%)
  const [feedFontSize, setFeedFontSize] = useState<'standard' | 'large' | 'extra_large'>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_feed_font_size');
      if (saved === 'standard' || saved === 'large' || saved === 'extra_large') return saved;
      return 'standard';
    } catch {
      return 'standard';
    }
  });

  const handleSetFeedFontSize = (size: 'standard' | 'large' | 'extra_large') => {
    setFeedFontSize(size);
    try {
      localStorage.setItem('livetraffic_feed_font_size', size);
    } catch {}
  };

  // Edit Feed Post Modal State (Admin only)
  const [editingFeedItem, setEditingFeedItem] = useState<FeedItem | null>(null);

  // Full-Resolution Image Lightbox Modal State
  const [lightboxData, setLightboxData] = useState<ImageLightboxData | null>(null);

  // Live Feed Item Views Tracking (Real persistent counts)
  const [liveViewsMap, setLiveViewsMap] = useState<Record<string, number>>({});
  const recordedImpressionsRef = useRef<Set<string>>(new Set());

  // "Share Live Traffic with Family & Friends" Random Bubbling State
  // Moves position every 60 seconds and bubbles up to the top of the feed to attract user attention
  const [shareCardPositionIndex, setShareCardPositionIndex] = useState<number>(0);
  const [isShareCardBubbled, setIsShareCardBubbled] = useState<boolean>(true);

  useEffect(() => {
    // Moves and bubbles position every 60 seconds (60,000ms)
    const interval = setInterval(() => {
      setShareCardPositionIndex(prev => {
        // Dynamic position shifting with high frequency at top slot (0) and secondary positions
        const possiblePositions = [0, 1, 0, 2, 0, 1];
        const filteredNext = possiblePositions.filter(p => p !== prev);
        const nextPos = filteredNext[Math.floor(Math.random() * filteredNext.length)] ?? 0;
        return nextPos;
      });
      setIsShareCardBubbled(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Load initial view counts from server
  useEffect(() => {
    fetch('/api/feed/views')
      .then(res => res.json())
      .then(data => {
        if (data && data.views && typeof data.views === 'object') {
          setLiveViewsMap(data.views);
        }
      })
      .catch(() => {});
  }, []);

  const handleRecordView = useCallback((itemId?: string) => {
    if (!itemId) return;
    setLiveViewsMap(prev => ({ ...prev, [itemId]: (prev[itemId] || 1) + 1 }));
    fetch(`/api/feed/${encodeURIComponent(itemId)}/view`, { method: 'POST' }).catch(() => {});
  }, []);

  // Dropdown Open States
  const [isPostSelectionDropdownOpen, setIsPostSelectionDropdownOpen] = useState(false);
  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const [isViewModeDropdownOpen, setIsViewModeDropdownOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isAdPlacementDropdownOpen, setIsAdPlacementDropdownOpen] = useState(false);

  const postSelectionDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const viewModeDropdownRef = useRef<HTMLDivElement>(null);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  const adPlacementDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (postSelectionDropdownRef.current && !postSelectionDropdownRef.current.contains(event.target as Node)) {
        setIsPostSelectionDropdownOpen(false);
      }
      if (fontSizeDropdownRef.current && !fontSizeDropdownRef.current.contains(event.target as Node)) {
        setIsFontSizeDropdownOpen(false);
      }
      if (viewModeDropdownRef.current && !viewModeDropdownRef.current.contains(event.target as Node)) {
        setIsViewModeDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
      if (adPlacementDropdownRef.current && !adPlacementDropdownRef.current.contains(event.target as Node)) {
        setIsAdPlacementDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Dynamic Typography Sizing Helper according to user-selected font size
  const fontStyles = {
    minimalTitle: feedFontSize === 'extra_large' 
      ? 'text-base sm:text-lg' 
      : feedFontSize === 'large' 
      ? 'text-[15px] sm:text-base' 
      : 'text-sm sm:text-[15px]',
    minimalBody: feedFontSize === 'extra_large' 
      ? 'text-sm sm:text-base leading-relaxed font-medium text-slate-100' 
      : feedFontSize === 'large' 
      ? 'text-xs sm:text-sm leading-relaxed text-slate-200' 
      : 'text-xs sm:text-sm text-slate-300 leading-relaxed',
    minimalMeta: feedFontSize === 'extra_large'
      ? 'text-xs'
      : feedFontSize === 'large'
      ? 'text-[11px]'
      : 'text-[11px]',
    condensedTitle: feedFontSize === 'extra_large'
      ? 'text-sm sm:text-base'
      : feedFontSize === 'large'
      ? 'text-xs sm:text-sm'
      : 'text-xs',
    condensedBody: feedFontSize === 'extra_large'
      ? 'text-xs sm:text-sm leading-normal text-slate-100 font-medium'
      : feedFontSize === 'large'
      ? 'text-[11px] sm:text-xs leading-tight text-slate-200'
      : 'text-[11px] sm:text-xs text-slate-200 leading-tight',
    cardTitle: feedFontSize === 'extra_large'
      ? 'text-base sm:text-lg'
      : feedFontSize === 'large'
      ? 'text-sm sm:text-base'
      : 'text-sm sm:text-base',
    cardBody: feedFontSize === 'extra_large'
      ? 'text-sm sm:text-base leading-relaxed text-slate-100 font-medium'
      : feedFontSize === 'large'
      ? 'text-xs sm:text-sm leading-relaxed text-slate-200'
      : 'text-xs sm:text-sm text-slate-300 leading-relaxed',
    dispatchBody: feedFontSize === 'extra_large'
      ? 'text-base sm:text-lg leading-relaxed text-slate-100'
      : feedFontSize === 'large'
      ? 'text-sm sm:text-base leading-relaxed text-slate-200'
      : 'text-xs sm:text-sm text-slate-300 leading-relaxed',
    bulletBody: feedFontSize === 'extra_large'
      ? 'text-sm sm:text-base leading-snug text-slate-100 font-medium'
      : feedFontSize === 'large'
      ? 'text-xs sm:text-[13px] leading-snug text-slate-200'
      : 'text-xs sm:text-[13px] text-slate-200 leading-snug',
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => {
      const next = prev === 'newest' ? 'oldest' : 'newest';
      try {
        localStorage.setItem('livetraffic_feed_sort_order', next);
      } catch {}
      return next;
    });
  };

  const [showMinimalViewNotice, setShowMinimalViewNotice] = useState<boolean>(false);
  const hasCountedMountRef = useRef<boolean>(false);

  // Bullet Points View Notification: Informs users of the newly added high-density Bullet Points layout
  const [showBulletViewNotice, setShowBulletViewNotice] = useState<boolean>(() => {
    try {
      const seen = localStorage.getItem('livetraffic_seen_bullet_view_notice_v1');
      return seen !== 'true';
    } catch {
      return true;
    }
  });

  const handleDismissBulletNotice = () => {
    setShowBulletViewNotice(false);
    try {
      localStorage.setItem('livetraffic_seen_bullet_view_notice_v1', 'true');
    } catch {}
  };

  const handleSwitchToBulletViewFromNotice = () => {
    handleSetViewMode('bullets');
    setShowBulletViewNotice(false);
    try {
      localStorage.setItem('livetraffic_seen_bullet_view_notice_v1', 'true');
    } catch {}
  };

  // If user is already on bullets view, automatically mark notice as acknowledged
  useEffect(() => {
    if (viewMode === 'bullets' && showBulletViewNotice) {
      setShowBulletViewNotice(false);
      try {
        localStorage.setItem('livetraffic_seen_bullet_view_notice_v1', 'true');
      } catch {}
    }
  }, [viewMode, showBulletViewNotice]);

  // Check and increment non-minimal view tracking
  useEffect(() => {
    if (hasCountedMountRef.current) return;
    hasCountedMountRef.current = true;

    if (viewMode !== 'minimal' && viewMode !== 'bullets') {
      try {
        const stored = localStorage.getItem('livetraffic_feed_non_minimal_views');
        const count = stored ? parseInt(stored, 10) || 0 : 0;
        if (count < 10) {
          const newCount = count + 1;
          localStorage.setItem('livetraffic_feed_non_minimal_views', newCount.toString());
          // Show every second time (views 2, 4, 6, 8, 10)
          if (newCount % 2 === 0 && newCount <= 10) {
            setShowMinimalViewNotice(true);
          }
        }
      } catch (e) {
        console.warn('Error reading non-minimal view counter from localStorage:', e);
      }
    }
  }, [viewMode]);

  const handleSetViewMode = (mode: 'minimal' | 'condensed' | 'detailed' | 'bullets') => {
    const previousMode = viewMode;
    setViewMode(mode);
    try {
      localStorage.setItem('livetraffic_feed_view_mode', mode);
      localStorage.setItem('livetraffic_feed_view_mode_v2', mode);
    } catch {}

    if (mode === 'minimal' || mode === 'bullets') {
      setShowMinimalViewNotice(false);
      if (mode === 'bullets') {
        setShowBulletViewNotice(false);
        try {
          localStorage.setItem('livetraffic_seen_bullet_view_notice_v1', 'true');
        } catch {}
      }
    } else if (previousMode === 'minimal' || previousMode === 'bullets') {
      // User switched from minimal/bullets to cards/condensed mode
      try {
        const stored = localStorage.getItem('livetraffic_feed_non_minimal_views');
        const count = stored ? parseInt(stored, 10) || 0 : 0;
        if (count < 10) {
          const newCount = count + 1;
          localStorage.setItem('livetraffic_feed_non_minimal_views', newCount.toString());
          if (newCount % 2 === 0 && newCount <= 10) {
            setShowMinimalViewNotice(true);
          } else {
            setShowMinimalViewNotice(false);
          }
        } else {
          setShowMinimalViewNotice(false);
        }
      } catch (e) {
        console.warn('Error saving non-minimal view counter to localStorage:', e);
      }
    }
  };

  const toggleExpandItem = (id: string) => {
    setExpandedItemIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // i-Traffic Filter States (Defaults to user's saved or auto-detected region if available, fallback to 'all')
  const [regionFilter, setRegionFilter] = useState<SARegionId>(() => {
    const saved = getSavedRegion();
    if (saved && saved !== 'all') return saved;
    const detected = getSavedDetectedRegion();
    if (detected && detected !== 'all') return detected;
    return 'all';
  });
  const [selectedRegions, setSelectedRegions] = useState<SARegionId[]>(() => {
    const saved = getSavedRegion();
    if (saved && saved !== 'all') return [saved];
    const detected = getSavedDetectedRegion();
    if (detected && detected !== 'all') return [detected];
    return ['all'];
  });
  const [detectedRegion, setDetectedRegion] = useState<SARegionId | null>(() => getSavedDetectedRegion());
  const [isAutoLocationActive, setIsAutoLocationActive] = useState<boolean>(() => {
    const saved = getSavedRegion();
    if (saved && saved !== 'all') return false;
    const detected = getSavedDetectedRegion();
    return Boolean(detected && detected !== 'all');
  });
  const [isDetectingRegion, setIsDetectingRegion] = useState<boolean>(false);
  const [corridorFilter, setCorridorFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState<boolean>(false);

  // Motorist Incident Verification State
  const [verifiedItemIds, setVerifiedItemIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('livetraffic_verified_incidents');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [adminVerifiedItemIds, setAdminVerifiedItemIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem('livetraffic_admin_verified_incidents');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const checkIsAdminVerified = useCallback((item: FeedItem | null | undefined): boolean => {
    if (!item) return false;
    if (adminVerifiedItemIds[item.id]) return true;
    return isItemAdminVerified(item);
  }, [adminVerifiedItemIds]);

  const renderUserPostBanner = (item: FeedItem, variant: 'standard' | 'full' = 'standard') => {
    const isPostAdminVerified = checkIsAdminVerified(item);

    if (isPostAdminVerified) {
      if (variant === 'full') {
        return (
          <div className="bg-gradient-to-r from-emerald-950/90 via-teal-950/60 to-emerald-950/90 border border-emerald-500/70 rounded-xl p-3 flex items-start space-x-3 shadow-md text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="font-black text-xs uppercase tracking-wider text-emerald-300">
                  🛡️ ADMIN VERIFIED
                </span>
                {item.approvedByAdminName && (
                  <span className="text-[10px] text-emerald-400/90 font-medium">
                    by {item.approvedByAdminName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-emerald-200/90 leading-snug">
                This road alert has been verified and confirmed by patrol command. Active on live monitoring network.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-gradient-to-r from-emerald-950/90 via-teal-950/60 to-emerald-950/90 border border-emerald-500/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm my-1 text-emerald-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-black text-[10.5px] uppercase tracking-wider text-emerald-300">
              🛡️ ADMIN VERIFIED
            </span>
          </div>
          <span className="text-[9.5px] text-emerald-200/80 font-medium hidden xs:inline">
            {item.approvedByAdminName ? `Verified by ${item.approvedByAdminName}` : 'Verified by Patrol Command'}
          </span>
        </div>
      );
    }

    // Unverified user post state
    if (variant === 'full') {
      return (
        <div className="bg-gradient-to-r from-orange-950/90 via-amber-950/60 to-orange-950/90 border border-orange-500/70 rounded-xl p-3 flex items-start space-x-3 shadow-md text-orange-200">
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-black text-xs uppercase tracking-wider text-orange-300">
                ⚠️ NOT VERIFIED • USER POST
              </span>
              {(item.postedByUserName || item.author || item.postedByUserSurname) && (
                <span className="text-[10px] text-orange-400/90 font-medium">
                  by {getUserPostDisplayName(item)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-orange-200/90 leading-snug">
              This road alert was submitted directly by a community motorist and has not yet been verified by patrol command. Exercise caution.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-orange-950/90 via-amber-950/60 to-orange-950/90 border border-orange-500/70 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-sm my-1 text-orange-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 animate-pulse" />
          <span className="font-black text-[10.5px] uppercase tracking-wider text-orange-300">
            ⚠️ NOT VERIFIED • USER POST
          </span>
        </div>
        <span className="text-[9.5px] text-orange-200/80 font-medium hidden xs:inline">
          Motorist alert • Pending patrol verification
        </span>
      </div>
    );
  };

  const [optimisticUpvotes, setOptimisticUpvotes] = useState<Record<string, number>>({});
  const [isVerifyingItemId, setIsVerifyingItemId] = useState<string | null>(null);

  // Feed Item Status State (Still Active vs Cleared)
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);
  const [itemStatusOverrides, setItemStatusOverrides] = useState<Record<string, 'active' | 'cleared'>>(() => {
    try {
      const raw = localStorage.getItem('livetraffic_feed_item_statuses');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    if (!openStatusDropdownId) return;
    const handleCloseDropdown = () => setOpenStatusDropdownId(null);
    window.addEventListener('click', handleCloseDropdown);
    return () => window.removeEventListener('click', handleCloseDropdown);
  }, [openStatusDropdownId]);

  // Dedicated City & Area Filter State (Pretoria / Johannesburg / All / Custom Areas)
  const [cityFilter, setCityFilter] = useState<CityTrafficFilter>('all');
  const [customAreaInput, setCustomAreaInput] = useState<string>('');
  const [isNationwideDropdownOpen, setIsNationwideDropdownOpen] = useState<boolean>(false);
  const nationwideDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nationwideDropdownRef.current && !nationwideDropdownRef.current.contains(event.target as Node)) {
        setIsNationwideDropdownOpen(false);
      }
    };
    if (isNationwideDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNationwideDropdownOpen]);

  // Filter live feed by custom typed area or route locally (Instant in-memory, no external API calls)
  const handleFilterCustomArea = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customAreaInput.trim();
    if (!trimmed) return;
    setCityFilter(`custom:${trimmed}`);
    setIsNationwideDropdownOpen(false);
  };

  // Auto-detect user's current GPS location on initial load and default feed to user's location if not manually set
  useEffect(() => {
    let isMounted = true;
    const autoDetectOnMount = async () => {
      // Check if user has geolocation available
      if (typeof window === 'undefined' || !navigator.geolocation) return;

      setIsDetectingRegion(true);
      try {
        const res = await autoDetectUserRegion();
        if (isMounted && res.regionId && res.regionId !== 'all') {
          setDetectedRegion(res.regionId);
          saveDetectedRegion(res.regionId);

          // If the user has not explicitly locked in a different region, default to their detected location
          const currentSaved = localStorage.getItem('live_traffic_selected_region');
          if (!currentSaved || currentSaved === 'all') {
            setRegionFilter(res.regionId);
            setSelectedRegions([res.regionId]);
            setIsAutoLocationActive(true);
          }
        }
      } catch (err) {
        console.warn('GPS auto-detection on mount notice:', err);
      } finally {
        if (isMounted) setIsDetectingRegion(false);
      }
    };

    autoDetectOnMount();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle programmatic navigation & focus when user clicks the Top LIVE Alert Bar
  useEffect(() => {
    if (!focusedAlertQuery) {
      setActiveFocusedNotice(null);
      return;
    }

    const cleanQuery = focusedAlertQuery
      .replace(/^[🚨⚠️📍🔴\s]+/, '')
      .replace(/^broadcast:\s*/i, '')
      .trim();
    setActiveFocusedNotice(cleanQuery);

    const queryLower = cleanQuery.toLowerCase();
    
    // Find matching feed item
    const matched = feedItems.find(item => {
      const content = (item.content || '').toLowerCase();
      const roadway = (item.roadwayName || '').toLowerCase();
      const location = (item.location || '').toLowerCase();
      const headline = (item.headline || '').toLowerCase();
      return content.includes(queryLower) ||
             queryLower.includes(content.slice(0, 25)) ||
             (roadway && queryLower.includes(roadway)) ||
             (location && queryLower.includes(location)) ||
             (headline && queryLower.includes(headline));
    });

    // Reset region & corridor filters so the target incident is not hidden
    setRegionFilter('all');
    setSelectedRegions(['all']);
    setCorridorFilter('all');
    setEventTypeFilter('all');

    if (matched) {
      if (matched.source === 'admin_dispatch' || matched.source === 'community') {
        setActiveTab('dispatches');
      } else {
        setActiveTab('itraffic');
      }

      setExpandedItemIds(prev => ({ ...prev, [matched.id]: true }));
      setHighlightedItemId(matched.id);

      setTimeout(() => {
        const el = document.getElementById(`feed-item-${matched.id}`) || document.getElementById(`feed-item-bullet-${matched.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);

      const timer = setTimeout(() => {
        setHighlightedItemId(null);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      // If no single item matches verbatim, extract keyword like "N1" or "R21" to filter the list
      const parts = cleanQuery.split(/[:\s-]+/).filter(Boolean);
      const keyword = parts[0] && parts[0].length >= 2 ? parts[0] : '';
      if (keyword) {
        setSearchQuery(keyword);
        setIsSearchFilterOpen(true);
      }
    }
  }, [focusedAlertQuery, feedItems]);

  // Region pill scroll refs
  const regionScrollRef = useRef<HTMLDivElement>(null);

  const scrollRegion = (direction: 'left' | 'right') => {
    if (regionScrollRef.current) {
      const scrollDistance = 200;
      regionScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth'
      });
    }
  };

  // Check if a given region is currently selected
  const isRegionSelected = (regId: SARegionId): boolean => {
    if (regId === 'all') {
      return selectedRegions.includes('all') || selectedRegions.length === 0;
    }
    return !selectedRegions.includes('all') && selectedRegions.includes(regId);
  };

  // Toggle or select region: Supports selecting multiple and clicking an active one to unselect
  const handleToggleRegionSelection = (regId: SARegionId) => {
    setIsAutoLocationActive(false);
    if (regId === 'all') {
      setSelectedRegions(['all']);
      setRegionFilter('all');
      saveSelectedRegion('all');
      setCorridorFilter('all');
      return;
    }

    setSelectedRegions(prev => {
      // Remove 'all' flag to work with explicit province selections
      const cleanPrev = prev.filter(r => r !== 'all');
      let next: SARegionId[];

      if (cleanPrev.includes(regId)) {
        // Active -> Unselect it
        next = cleanPrev.filter(r => r !== regId);
      } else {
        // Inactive -> Add it to active selection (select multiple)
        next = [...cleanPrev, regId];
      }

      if (next.length === 0) {
        // No regions selected -> reset to All SA
        setRegionFilter('all');
        setCityFilter('all');
        saveSelectedRegion('all');
        return ['all'];
      } else if (next.length === 1) {
        setRegionFilter(next[0]);
        saveSelectedRegion(next[0]);
        if (next[0] === 'Western Cape') setCityFilter('wc');
        else if (next[0] === 'KwaZulu-Natal') setCityFilter('kzn');
        else if (next[0] === 'Eastern Cape') setCityFilter('ec');
        else if (next[0] === 'Gauteng') setCityFilter('gauteng');
      } else {
        setRegionFilter('all');
        setCityFilter('all');
      }

      return next;
    });

    setCorridorFilter('all');
  };

  // Manual Auto-detect via GPS when user clicks the GPS location button
  const handleManualAutoDetect = async () => {
    setIsDetectingRegion(true);
    try {
      const res = await autoDetectUserRegion();
      const targetReg = (res.regionId && res.regionId !== 'all') ? res.regionId : (detectedRegion || 'Gauteng');
      if (targetReg && targetReg !== 'all') {
        setDetectedRegion(targetReg);
        setRegionFilter(targetReg);
        setSelectedRegions([targetReg]);
        if (targetReg === 'Western Cape') setCityFilter('wc');
        else if (targetReg === 'KwaZulu-Natal') setCityFilter('kzn');
        else if (targetReg === 'Eastern Cape') setCityFilter('ec');
        else if (targetReg === 'Gauteng') setCityFilter('gauteng');
        setIsAutoLocationActive(true);
        saveSelectedRegion(targetReg);
        setCorridorFilter('all');
        setSyncNotice(`📍 Auto-filter active: ${SA_REGIONS[targetReg]?.name || targetReg}`);
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        setRegionFilter('all');
        setSelectedRegions(['all']);
        setCityFilter('all');
        setIsAutoLocationActive(false);
        saveSelectedRegion('all');
        setSyncNotice('📍 Showing all regional highway feeds (National).');
        setTimeout(() => setSyncNotice(null), 3000);
      }
    } catch {
      // If permission error but we have a detectedRegion or default GP, allow auto-selecting it
      if (detectedRegion && detectedRegion !== 'all') {
        setRegionFilter(detectedRegion);
        setSelectedRegions([detectedRegion]);
        if (detectedRegion === 'Western Cape') setCityFilter('wc');
        else if (detectedRegion === 'KwaZulu-Natal') setCityFilter('kzn');
        else if (detectedRegion === 'Eastern Cape') setCityFilter('ec');
        else if (detectedRegion === 'Gauteng') setCityFilter('gauteng');
        setIsAutoLocationActive(true);
        saveSelectedRegion(detectedRegion);
        setCorridorFilter('all');
        setSyncNotice(`📍 Filtered to detected region: ${SA_REGIONS[detectedRegion]?.name || detectedRegion}`);
        setTimeout(() => setSyncNotice(null), 4000);
      } else {
        setSyncNotice('⚠️ Location permission required for GPS auto-detection.');
        setTimeout(() => setSyncNotice(null), 3000);
      }
    } finally {
      setIsDetectingRegion(false);
    }
  };

  const handleSelectRegion = (regId: SARegionId) => {
    setIsAutoLocationActive(false);
    setRegionFilter(regId);
    setSelectedRegions([regId]);
    saveSelectedRegion(regId);
    setCorridorFilter('all');
    if (regId === 'Western Cape') {
      setCityFilter('wc');
    } else if (regId === 'KwaZulu-Natal') {
      setCityFilter('kzn');
    } else if (regId === 'Eastern Cape') {
      setCityFilter('ec');
    } else if (regId === 'Gauteng') {
      setCityFilter('gauteng');
    } else if (regId === 'all') {
      setCityFilter('all');
    }
  };

  // Dispatches Filter State
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'admin_dispatch' | 'community' | 'potholes' | 'sos'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [showQuickPostModal, setShowQuickPostModal] = useState<boolean>(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  // Real-time Feed Presence Heartbeat (In-memory, Zero-DB)
  const {
    feedOpenCount,
    totalActiveViewers,
    activeUsersOnline,
    totalVisitors,
    presenceData,
    refreshPresence
  } = useFeedPresence({
    currentTab: 'feed',
    viewMode,
    feedFilter: activeTab === 'dispatches' ? dispatchFilter : (corridorFilter !== 'all' ? corridorFilter : eventTypeFilter !== 'all' ? eventTypeFilter : regionFilter),
    activeRegion: regionFilter,
    currentUser,
    isFeedActive: true
  });

  const [isPresenceInspectorOpen, setIsPresenceInspectorOpen] = useState<boolean>(false);

  // Advertisement Experiment State
  const [activeAds, setActiveAds] = useState<AdvertisementBanner[]>([]);
  const [adsEnabled, setAdsEnabled] = useState<boolean>(false);
  const [showSponsoredBadge, setShowSponsoredBadge] = useState<boolean>(true);
  const [allowDismissAds, setAllowDismissAds] = useState<boolean>(true);
  const [autoRotateTopBanners, setAutoRotateTopBanners] = useState<boolean>(true);
  const [rotationIntervalSeconds, setRotationIntervalSeconds] = useState<number>(10);
  const [dismissedAdIds, setDismissedAdIds] = useState<Record<string, boolean>>({});
  const [currentTopAdIndex, setCurrentTopAdIndex] = useState<number>(0);
  const [feedAdPlacement, setFeedAdPlacement] = useState<'random' | 'mid' | 'bottom' | 'top' | 'both'>(() => {
    try {
      const saved = localStorage.getItem('live_traffic_feed_ad_placement');
      if (saved && ['random', 'mid', 'bottom', 'top', 'both'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'random';
  });
  const [adShuffleKey, setAdShuffleKey] = useState<number>(0);

  const fetchActiveAds = async () => {
    try {
      const res = await fetch('/api/ads/active');
      if (res.ok) {
        const data = await res.json();
        setAdsEnabled(!!data.isEnabled);
        setActiveAds(Array.isArray(data.banners) ? data.banners : []);
        if (data.showSponsoredBadge !== undefined) setShowSponsoredBadge(data.showSponsoredBadge);
        if (data.allowDismiss !== undefined) setAllowDismissAds(data.allowDismiss);
        if (data.autoRotateTopBanners !== undefined) setAutoRotateTopBanners(data.autoRotateTopBanners);
        if (data.rotationIntervalSeconds !== undefined) setRotationIntervalSeconds(data.rotationIntervalSeconds);
        if (data.feedAdPlacement !== undefined) {
          setFeedAdPlacement(data.feedAdPlacement);
          try {
            localStorage.setItem('live_traffic_feed_ad_placement', data.feedAdPlacement);
          } catch {}
        }
      }
    } catch {
      // Ads disabled or offline
    }
  };

  const handleChangeAdPlacement = async (newPlacement: 'random' | 'mid' | 'bottom' | 'top' | 'both') => {
    setFeedAdPlacement(newPlacement);
    try {
      localStorage.setItem('live_traffic_feed_ad_placement', newPlacement);
    } catch {}
    try {
      const token = localStorage.getItem('livetraffic_admin_token') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (currentUser?.role) headers['x-user-role'] = currentUser.role;
      await fetch('/api/admin/ads/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          feedAdPlacement: newPlacement,
          updatedBy: currentUser?.email || 'Live Feed Placement Switcher'
        })
      });
    } catch {}
  };

  useEffect(() => {
    fetchActiveAds();
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchActiveAds();
    }, 90000);
    return () => clearInterval(interval);
  }, []);

  // Filter top banners
  const topBanners = activeAds.filter(
    b => (b.position === 'top' || b.position === 'both' || !b.position) && !dismissedAdIds[b.id]
  );

  // Auto-rotate top banner slideshow timer
  useEffect(() => {
    if (!adsEnabled || !autoRotateTopBanners || topBanners.length <= 1) return;
    const duration = Math.max(3, rotationIntervalSeconds || 10) * 1000;
    const timer = setInterval(() => {
      setCurrentTopAdIndex(prev => (prev + 1) % topBanners.length);
    }, duration);
    return () => clearInterval(timer);
  }, [adsEnabled, autoRotateTopBanners, topBanners.length, rotationIntervalSeconds]);

  const handleDismissAd = (id: string) => {
    setDismissedAdIds(prev => ({ ...prev, [id]: true }));
  };

  const handlePrevTopBanner = () => {
    if (topBanners.length <= 1) return;
    setCurrentTopAdIndex(prev => (prev - 1 + topBanners.length) % topBanners.length);
  };

  const handleNextTopBanner = () => {
    if (topBanners.length <= 1) return;
    setCurrentTopAdIndex(prev => (prev + 1) % topBanners.length);
  };

  // Admin Dispatch Post State
  const [adminAuthor, setAdminAuthor] = useState<string>('🛡️ ADMIN PATROL COMMAND');
  const [adminHandle, setAdminHandle] = useState<string>('@PatrolHQ');
  const [adminLocation, setAdminLocation] = useState<string>('N1 Corridor Patrol HQ');
  const [adminCategory, setAdminCategory] = useState<FeedItem['category']>('spiking');
  const [postCategoryType, setPostCategoryType] = useState<string>('traffic report');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('N1 Highway');
  const [specificLocation, setSpecificLocation] = useState<string>('');
  const [adminContent, setAdminContent] = useState<string>('');
  const [adminPhotoUrl, setAdminPhotoUrl] = useState<string>('');
  const [showOnLiveWatch, setShowOnLiveWatch] = useState<boolean>(true);
  const [adminBroadcastTopRed, setAdminBroadcastTopRed] = useState<boolean>(false);
  const [adminHighlightGold, setAdminHighlightGold] = useState<boolean>(false);
  const [shareToX, setShareToX] = useState<boolean>(false);
  const [shareToFacebook, setShareToFacebook] = useState<boolean>(false);
  const [dispatchFirstName, setDispatchFirstName] = useState<string>(() => currentUser?.fullName || '');
  const [dispatchSurname, setDispatchSurname] = useState<string>(() => currentUser?.surname || '');
  const [isPostingDispatch, setIsPostingDispatch] = useState<boolean>(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setDispatchFirstName(currentUser.fullName);
      if (currentUser.surname) setDispatchSurname(currentUser.surname);
    }
  }, [currentUser]);

  // Corridor & Event Type pill scroll refs
  const corridorScrollRef = useRef<HTMLDivElement>(null);
  const eventTypeScrollRef = useRef<HTMLDivElement>(null);

  const scrollCorridor = (direction: 'left' | 'right') => {
    if (corridorScrollRef.current) {
      const scrollDistance = 240;
      corridorScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth'
      });
    }
  };

  const scrollEventType = (direction: 'left' | 'right') => {
    if (eventTypeScrollRef.current) {
      const scrollDistance = 180;
      eventTypeScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollDistance : scrollDistance,
        behavior: 'smooth'
      });
    }
  };

  // Sync props changes with local state
  useEffect(() => {
    if (propsFeedItems) {
      setFeedItems(deduplicateFeedItems(propsFeedItems));
    }
  }, [propsFeedItems]);

  // Detect dynamically incoming feed items across automatic refreshes to trigger subtle CSS fade-in
  useEffect(() => {
    if (!feedItems || feedItems.length === 0) return;

    // On initial mount with items, populate known IDs without animating existing items
    if (isInitialFeedLoadRef.current) {
      feedItems.forEach(item => {
        if (item?.id) knownItemIdsRef.current.add(item.id);
      });
      isInitialFeedLoadRef.current = false;
      return;
    }

    const freshIds: string[] = [];
    feedItems.forEach(item => {
      if (item?.id && !knownItemIdsRef.current.has(item.id)) {
        freshIds.push(item.id);
        knownItemIdsRef.current.add(item.id);
      }
    });

    if (freshIds.length > 0) {
      setNewlyAddedItemIds(prev => {
        const next = new Set(prev);
        freshIds.forEach(id => next.add(id));
        return next;
      });

      const timer = setTimeout(() => {
        setNewlyAddedItemIds(prev => {
          const next = new Set(prev);
          freshIds.forEach(id => next.delete(id));
          return next;
        });
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [feedItems]);

  const fetchLiveFeed = async () => {
    setIsLoadingFeed(true);
    try {
      if (onRefreshFeed) {
        await onRefreshFeed();
      }
      let backendSucceeded = false;
      try {
        const res = await fetch('/api/feed', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.feed) && data.feed.length > 0) {
            setFeedItems(deduplicateFeedItems(data.feed));
            backendSucceeded = true;
          } else if (Array.isArray(data) && data.length > 0) {
            setFeedItems(deduplicateFeedItems(data));
            backendSucceeded = true;
          }
        }
      } catch {
        // Backend not responding or 404
      }

      // If backend was not reached or returned empty, scrape directly from browser
      if (!backendSucceeded) {
        const directItems = await scrapeLiveITrafficInBrowser();
        if (directItems && directItems.length > 0) {
          setFeedItems(deduplicateFeedItems(directItems));
        }
      }
    } catch (err) {
      console.warn('Live feed direct fetch completed:', err);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleSyncITraffic = async () => {
    setIsSyncingITraffic(true);
    setSyncNotice(null);
    try {
      let syncSucceeded = false;
      try {
        const res = await fetch('/api/feed/sync-itraffic', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          const gpCount = data.breakdown?.gauteng ?? 0;
          const kznCount = data.breakdown?.kzn ?? 0;
          const wcCount = data.breakdown?.westernCape ?? 0;
          const ecCount = data.breakdown?.easternCape ?? 0;
          const total = data.totalEvents || data.scrapedCount || (gpCount + kznCount + wcCount + ecCount) || '0';
          setSyncNotice(`✅ Live Feed Synced: ${total} active incidents across GP (${gpCount}), KZN (${kznCount}), WC (${wcCount}) & EC (${ecCount})`);
          const list = Array.isArray(data.feed) && data.feed.length > 0 ? data.feed : (Array.isArray(data.events) ? data.events : null);
          if (list) {
            setFeedItems(deduplicateFeedItems(list));
            syncSucceeded = true;
          }
        }
      } catch {
        // Backend not reached
      }

      if (!syncSucceeded) {
        // Direct browser scraping fallback
        const directEvents = await scrapeLiveITrafficInBrowser();
        if (directEvents && directEvents.length > 0) {
          setFeedItems(deduplicateFeedItems(directEvents));
          setSyncNotice(`✅ Live Scraped: ${directEvents.length} active highway corridor incidents`);
        } else {
          setSyncNotice('✅ Live sync check complete (0 active hazards on Corridors)');
        }
      }
    } catch (err) {
      setSyncNotice('✅ Live sync complete');
      await fetchLiveFeed();
    } finally {
      setIsSyncingITraffic(false);
      setTimeout(() => setSyncNotice(null), 4500);
    }
  };

  const handlePostToWhatsApp = async (item: FeedItem) => {
    handleRecordView(item.id);
    const formatted = formatITrafficForWhatsApp(item);
    await copyToClipboard(formatted);
    setCopiedItemIds(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setCopiedItemIds(prev => ({ ...prev, [item.id]: false }));
    }, 2500);
    openWhatsAppShare(formatted);
  };

  const handleCopyForWhatsApp = handlePostToWhatsApp;

  const handleCopyAllWhatsAppBulletin = async () => {
    const itemsToInclude = activeTab === 'itraffic' 
      ? (filteredITrafficItems.length > 0 ? filteredITrafficItems.slice(0, 10) : feedItemsInLiveWindow.slice(0, 10))
      : (filteredDispatches.length > 0 ? filteredDispatches.slice(0, 10) : feedItems.slice(0, 10));
    
    if (itemsToInclude.length === 0) {
      setSyncNotice('ℹ️ No active traffic alerts to compile into bulletin.');
      return;
    }

    const appUrl = getPublicAppUrl();
    const nowStr = formatWhatsAppDateTime(new Date());
    const regionTitle = regionFilter === 'KwaZulu-Natal' 
      ? 'KWAZULU-NATAL HIGHWAY TRAFFIC BULLETIN' 
      : regionFilter === 'Gauteng' 
      ? 'GAUTENG HIGHWAY TRAFFIC BULLETIN' 
      : 'SA HIGHWAY TRAFFIC BULLETIN (Gauteng & KZN)';

    let text = `*🚨 ${regionTitle} | LiveTrafficNPC*\n`;
    text += `🕒 *Intelligence Broadcast:* ${nowStr}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    itemsToInclude.forEach((it, idx) => {
      const isCrash = it.category === 'accident' || it.category === 'crash' || it.content.toLowerCase().includes('crash');
      const isSpike = it.category === 'spiking' || it.content.toLowerCase().includes('spike');
      const isRoadworks = it.category === 'roadworks' || it.content.toLowerCase().includes('roadwork');
      const icon = isSpike ? '🚨' : isCrash ? '💥' : isRoadworks ? '🚧' : '⚠️';
      const province = resolveItemRegion(it);
      
      text += `${idx + 1}. ${icon} *[${province}] ${it.roadwayName || it.location || 'Highway Corridor'}* ${it.direction ? `(${it.direction})` : ''}\n`;
      text += `   • *Alert:* ${it.content}\n`;
      if (it.location) text += `   • *Location:* ${it.location}\n`;
      text += `   • *Province:* ${province}\n`;
      const itemTime = formatWhatsAppDateTime(it.startTime || it.timestamp || it.lastUpdated);
      if (itemTime) text += `   • *Reported:* ${itemTime}\n`;

      text += `\n`;
    });

    text += `🗺️ *Track Live & Report Hazards:* ${appUrl}\n\n`;
    text += `#Livetraffic #ArriveAlive`;

    const success = await copyToClipboard(text);
    if (success) {
      setBulletinCopied(true);
      setSyncNotice('✓ Full WhatsApp Channel Bulletin Copied! Ready to paste into your WhatsApp group/channel.');
      setTimeout(() => {
        setBulletinCopied(false);
      }, 3500);
    }
  };

  // Motorist & Admin Incident Verification Handler
  const handleVerifyIncident = async (item: FeedItem) => {
    const isPostAdminVerified = checkIsAdminVerified(item);
    const isAlreadyVerified = verifiedItemIds[item.id];

    if (isUserAdmin && isPostAdminVerified) {
      setSyncNotice('🛡️ This incident is already officially Admin Verified.');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    if (!isUserAdmin && isAlreadyVerified) {
      setSyncNotice('👍 You have already verified this incident.');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }

    setIsVerifyingItemId(item.id);
    
    // Optimistic UI state update
    setOptimisticUpvotes(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    const updatedVerified = { ...verifiedItemIds, [item.id]: true };
    setVerifiedItemIds(updatedVerified);
    try {
      localStorage.setItem('livetraffic_verified_incidents', JSON.stringify(updatedVerified));
    } catch {}

    if (isUserAdmin) {
      const updatedAdminVerified = { ...adminVerifiedItemIds, [item.id]: true };
      setAdminVerifiedItemIds(updatedAdminVerified);
      try {
        localStorage.setItem('livetraffic_admin_verified_incidents', JSON.stringify(updatedAdminVerified));
      } catch {}

      // Update feed item state immediately
      setFeedItems(prev => prev.map(f => {
        if (f.id === item.id) {
          const reporter = f.postedByUserName || f.author || 'Motorist';
          return {
            ...f,
            verified: true,
            adminVerified: true,
            verifiedByAdmin: true,
            approvedByAdminName: currentUser?.name || 'Patrol Command',
            approvedAt: new Date().toISOString(),
            author: f.author.includes('Verified Report') ? f.author : `Verified Report (${reporter})`
          };
        }
        return f;
      }));

      setSyncNotice(`🛡️ Incident verified by Admin! Banner updated to "ADMIN VERIFIED".`);
    } else {
      setSyncNotice(`👍 Incident verified! Thank you for confirming this alert on ${item.roadwayName || item.location || 'highway'}.`);
    }
    setTimeout(() => setSyncNotice(null), 4000);

    try {
      const res = await fetch(`/api/feed/${encodeURIComponent(item.id)}/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(isUserAdmin ? {
            'x-user-role': 'admin',
            'x-admin-name': currentUser?.name || 'Patrol Command',
            'x-admin-email': currentUser?.email || 'admin@livetraffic.co.za'
          } : {})
        },
        body: JSON.stringify({
          isAdmin: isUserAdmin,
          adminName: currentUser?.name || 'Patrol Command',
          adminEmail: currentUser?.email || 'admin@livetraffic.co.za',
          adminRole: currentUser?.role || 'Admin'
        })
      });
      if (!res.ok) {
        // Fallback to upvote endpoint
        await fetch(`/api/feed/${encodeURIComponent(item.id)}/upvote`, { method: 'POST' });
      }
    } catch (err) {
      console.warn('Verification sync notice:', err);
    } finally {
      setIsVerifyingItemId(null);
    }
  };

  // Feed Item Clearance & Status Helpers
  const getItemStatus = (item: FeedItem): 'active' | 'cleared' => {
    if (itemStatusOverrides[item.id]) {
      return itemStatusOverrides[item.id];
    }
    if (item.cleared === true || item.isCleared === true || item.status === 'cleared' || item.status === 'resolved') {
      return 'cleared';
    }
    return 'active';
  };

  const handleUpdateStatus = async (item: FeedItem, newStatus: 'active' | 'cleared') => {
    setOpenStatusDropdownId(null);
    setIsUpdatingStatusId(item.id);

    const isCleared = newStatus === 'cleared';
    // Optimistic UI state update
    setItemStatusOverrides(prev => {
      const next = { ...prev, [item.id]: newStatus };
      try {
        localStorage.setItem('livetraffic_feed_item_statuses', JSON.stringify(next));
      } catch {}
      return next;
    });

    setFeedItems(prev => prev.map(f => {
      if (f.id === item.id) {
        return {
          ...f,
          cleared: isCleared,
          isCleared: isCleared,
          status: newStatus,
          clearedAt: isCleared ? new Date().toISOString() : undefined
        };
      }
      return f;
    }));

    if (onEditFeedItem) {
      try {
        onEditFeedItem(item.id, {
          cleared: isCleared,
          isCleared: isCleared,
          status: newStatus,
          clearedAt: isCleared ? new Date().toISOString() : undefined
        });
      } catch (err) {
        console.warn('onEditFeedItem sync notice:', err);
      }
    }

    if (newStatus === 'cleared') {
      setSyncNotice(`✓ Incident status updated to "Cleared" on ${item.roadwayName || item.location || 'highway'}.`);
    } else {
      setSyncNotice(`✓ Incident status updated to "Still Active" on ${item.roadwayName || item.location || 'highway'}.`);
    }
    setTimeout(() => setSyncNotice(null), 3500);

    try {
      const adminToken = typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')) : null;
      const res = await fetch(`/api/feed/${encodeURIComponent(item.id)}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
          'x-user-role': currentUser?.role || (isUserAdmin ? 'admin' : 'motorist'),
          'x-user-email': currentUser?.email || '',
          'x-user-name': currentUser?.name || 'Motorist'
        },
        body: JSON.stringify({
          status: newStatus,
          cleared: isCleared
        })
      });

      if (!res.ok) {
        // Fallback to clear / reopen endpoints
        const fallbackEndpoint = isCleared
          ? `/api/feed/${encodeURIComponent(item.id)}/clear`
          : `/api/feed/${encodeURIComponent(item.id)}/reopen`;
        await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({ status: newStatus, cleared: isCleared })
        }).catch(() => {});
      }

      if (onRefreshFeed) {
        onRefreshFeed();
      }
    } catch (err) {
      console.warn('Incident status update sync notice:', err);
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const renderStatusButton = (item: FeedItem, size: 'sm' | 'md' = 'sm') => {
    const currentStatus = getItemStatus(item);
    const isCleared = currentStatus === 'cleared';
    const isOpen = openStatusDropdownId === item.id;
    const isUpdating = isUpdatingStatusId === item.id;

    const btnPadding = size === 'sm' ? 'px-1.5 sm:px-2 py-0.5 text-[10px]' : 'px-2 sm:px-2.5 py-1 text-[11px]';
    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

    return (
      <div className={`relative inline-block text-left shrink-0 ${isOpen ? 'z-30' : 'z-10'}`}>
        <button
          type="button"
          id={`feed-status-btn-${item.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenStatusDropdownId(isOpen ? null : item.id);
          }}
          disabled={isUpdating}
          className={`${btnPadding} rounded-lg font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-sm border ${
            isCleared
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700 hover:border-slate-500'
          }`}
          title="Change incident status: Still Active or Cleared"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isCleared ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span className="hidden sm:inline">Status</span>
          <span
            className={`text-[9px] font-medium px-1 py-0.2 rounded shrink-0 ${
              isCleared
                ? 'bg-emerald-500/30 text-emerald-200 font-bold'
                : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {isCleared ? 'Cleared' : 'Still Active'}
          </span>
          <ChevronDown
            className={`${iconSize} transition-transform duration-200 text-slate-400 shrink-0 ${
              isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            id={`feed-status-menu-${item.id}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-full mt-1 w-44 bg-[#0F1115]/98 border border-slate-700/90 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md"
          >
            <div className="px-3 py-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
              <span>Incident Status</span>
              {isUpdating && <span className="text-[9px] text-amber-400 animate-pulse">Saving...</span>}
            </div>
            <div className="p-1 space-y-0.5">
              <button
                type="button"
                id={`feed-status-opt-active-${item.id}`}
                onClick={() => handleUpdateStatus(item, 'active')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                  !isCleared
                    ? 'text-amber-300 font-bold bg-amber-500/20 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span>Still Active</span>
                </div>
                {!isCleared && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </button>

              <button
                type="button"
                id={`feed-status-opt-cleared-${item.id}`}
                onClick={() => handleUpdateStatus(item, 'cleared')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                  isCleared
                    ? 'text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cleared</span>
                </div>
                {isCleared && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleAdminPhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxWidth = 1024;
          const maxHeight = 1024;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setAdminPhotoUrl(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            setAdminPhotoUrl(event.target?.result as string);
          }
        };
        img.onerror = () => {
          setAdminPhotoUrl(event.target?.result as string);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPreset = (type: 'spiking' | 'pothole' | 'traffic' | 'patrol' | 'stationary' | 'traffic_lights' | 'crash' | 'pedestrian' | 'crime') => {
    if (type === 'spiking') {
      setAdminCategory('spiking');
      setAdminAuthor('🚨 SPIKE TRAP RAPID ALERT');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('N1 Pumulani Toll Corridor');
      setAdminContent('🚨 SPIKE TRAP ALERT: Debris with sharp metal spikes reported on highway carriageway. Patrol interceptor deployed. Maintain safe speed and avoid roadside shoulders.');
      setShowOnLiveWatch(true);
    } else if (type === 'pothole') {
      setAdminCategory('pothole');
      setAdminAuthor('🔨 POTHOLE FIXER SQUAD');
      setAdminHandle('@RoadWatchFix');
      setAdminLocation('R59 Kliprivier Offramp');
      setAdminContent('🔨 POTHOLE FIXER: Deep rim-cracking potholes patched with cold asphalt compound by patrol crew. Roadway surface cleared and safe for motorists.');
      setShowOnLiveWatch(false);
    } else if (type === 'traffic') {
      setAdminCategory('traffic');
      setAdminAuthor('🚦 TRAFFIC ADVISORY COMMAND');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('N3 Gilloolys Interchange');
      setAdminContent('⚠️ HIGHWAY DELAY: Heavy congestion with slow-moving queues extending 3km. Use alternate routes or allow extra travel time.');
      setShowOnLiveWatch(true);
    } else if (type === 'stationary') {
      setAdminCategory('stationary');
      setAdminAuthor('🚗 STATIONARY VEHICLE ALERT');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('N1 Southbound near Allandale Rd');
      setAdminContent('⚠️ STATIONARY VEHICLE: Disabled vehicle obstructing emergency yellow lane. Patrol unit attending. Approach with caution and move over.');
      setShowOnLiveWatch(true);
    } else if (type === 'traffic_lights') {
      setAdminCategory('traffic_lights');
      setAdminAuthor('🚦 TRAFFIC SIGNAL OUTAGE');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('R21 / Griffiths Rd Intersection');
      setAdminContent('⚠️ TRAFFIC LIGHTS OUT: Traffic signals dark/non-operational. Treat intersection as an all-way 4-way stop. Expect heavy backlogs.');
      setShowOnLiveWatch(true);
    } else if (type === 'crash') {
      setAdminCategory('crash');
      setAdminAuthor('💥 HIGHWAY CRASH COMMAND');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('N1 Southbound at Garsfontein Rd');
      setAdminContent('💥 CRASH ALERT: Multi-vehicle collision blocking right & middle lanes. Emergency services on scene. Expect severe tailbacks, drive with extreme caution.');
      setShowOnLiveWatch(true);
    } else if (type === 'pedestrian') {
      setAdminCategory('pedestrian');
      setAdminAuthor('🚨 PEDESTRIAN CRASH DESK');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('N4 Highway near Solomon Mahlangu Dr');
      setAdminContent('🚨 PEDESTRIAN CRASH: Serious incident involving a pedestrian on highway carriageway. Left lanes closed, paramedic crews attending. Reduce speed immediately.');
      setShowOnLiveWatch(true);
    } else if (type === 'crime') {
      setAdminCategory('crime');
      setAdminAuthor('🛑 SAPS / PATROL TACTICAL');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('M1 North near Grayston Drive');
      setAdminContent('🛑 CRIME SCENE ACTIVE: Law enforcement / SAPS tactical operations underway. Carriageway restricted, avoid area or expect diversions. Maintain high alertness.');
      setShowOnLiveWatch(true);
    } else if (type === 'patrol') {
      setAdminCategory('general');
      setAdminAuthor('🛡️ PATROL UNIT ACTIVE');
      setAdminHandle('@PatrolHQ');
      setAdminLocation('Highway Corridor Safety Patrol');
      setAdminContent('🛡️ ACTIVE PATROL: Marked Highway Patrol Unit conducting safety sweeps and roadside visual checks along the corridor. Flashers active.');
      setShowOnLiveWatch(false);
    }
  };

  const handlePublishAdminDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminContent.trim()) return;

    setIsPostingDispatch(true);

    const contentText = adminContent.trim();
    const firstLine = contentText.split('\n')[0].slice(0, 50);

    // Map the selected pulldown category to internal category and subtype
    let detectedCategory: FeedItem['category'] = 'traffic';
    let detectedSubType = 'Traffic Report';

    switch (postCategoryType) {
      case 'fatal crash':
      case 'fatal_crash':
        detectedCategory = 'crash';
        detectedSubType = 'Fatal Crash';
        break;
      case 'crash':
      case 'accident':
      case 'collision':
        detectedCategory = 'crash';
        detectedSubType = 'Crash Alert';
        break;
      case 'traffic report':
      case 'traffi report':
        detectedCategory = 'traffic';
        detectedSubType = 'Traffic Report';
        break;
      case 'congestion':
        detectedCategory = 'traffic';
        detectedSubType = 'Congestion Alert';
        break;
      case 'spiking Alert':
      case 'spiking':
        detectedCategory = 'spiking';
        detectedSubType = 'Spiking Alert';
        break;
      case 'crime scene':
        detectedCategory = 'hazard';
        detectedSubType = 'Crime Scene';
        break;
      case 'potholes':
      case 'pothole':
        detectedCategory = 'pothole';
        detectedSubType = 'Pothole Alert';
        break;
      default:
        detectedCategory = 'traffic';
        detectedSubType = 'Road Advisory';
    }

    // Construct full location from corridor pulldown and specific landmark input
    const fullLoc = selectedCorridor === 'No Location Selected'
      ? (specificLocation.trim() || 'General Advisory (No Location Selected)')
      : (selectedCorridor === 'Custom / Specific Location' || selectedCorridor === 'Location')
      ? (specificLocation.trim() || 'Highway Corridor')
      : (specificLocation.trim() ? `${selectedCorridor} • ${specificLocation.trim()}` : selectedCorridor);

    const roadway = selectedCorridor && selectedCorridor !== 'Custom / Specific Location' && selectedCorridor !== 'Location' && selectedCorridor !== 'No Location Selected'
      ? selectedCorridor.split(' ')[0]
      : (selectedCorridor === 'No Location Selected' ? 'No Location Selected' : '');

    try {
      const isOfficialAdminPost = Boolean(isUserAdmin);
      const adminToken = isOfficialAdminPost && typeof window !== 'undefined' 
        ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') 
        : '';
      const targetRegion = regionFilter !== 'all' ? regionFilter : (detectedRegion || 'Gauteng');

      const userFirstName = dispatchFirstName.trim() || (currentUser?.fullName || '').trim();
      const userSurname = dispatchSurname.trim() || (currentUser?.surname || '').trim();
      const userFullName = userSurname && !userFirstName.toLowerCase().includes(userSurname.toLowerCase())
        ? `${userFirstName} ${userSurname}`.trim()
        : (userFirstName || userSurname);

      const authorName = isOfficialAdminPost 
        ? (userFullName ? `🛡️ ${userFullName} (Admin)` : '🛡️ Admin Dispatch') 
        : (userFullName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Community Motorist'));
      const authorHandle = isOfficialAdminPost 
        ? `@${(userFullName || 'Admin').replace(/[^a-zA-Z0-9]/g, '')}` 
        : (userFullName ? `@${userFullName.replace(/[^a-zA-Z0-9]/g, '')}` : (currentUser?.email ? `@${currentUser.email.split('@')[0]}` : '@Motorist'));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (isOfficialAdminPost && adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
        headers['x-user-role'] = currentUser?.role || 'super_admin';
      } else {
        headers['x-user-role'] = currentUser?.role || 'user';
      }
      if (userFullName) {
        headers['x-user-name'] = userFullName;
      }
      if (userSurname) {
        headers['x-user-surname'] = userSurname;
      }
      if (currentUser?.email) {
        headers['x-user-email'] = currentUser.email;
      }

      if (isOfficialAdminPost) {
        // Direct Admin Live Feed Broadcast
        const res = await fetch('/api/feed/post-dispatch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            adminName: userFullName || 'Admin',
            author: authorName,
            handle: authorHandle,
            postedByUserName: userFullName || authorName,
            postedByUserSurname: userSurname || undefined,
            reporterSurname: userSurname || undefined,
            postedByUserEmail: currentUser?.email || undefined,
            location: fullLoc,
            roadwayName: roadway,
            region: targetRegion,
            category: detectedCategory,
            eventSubType: detectedSubType,
            content: contentText,
            mediaUrl: adminPhotoUrl.trim() || undefined,
            showOnLiveWatch: showOnLiveWatch,
            broadcastTopRed: adminBroadcastTopRed,
            highlightGold: adminHighlightGold,
            isAdmin: true,
            postAsAdmin: true,
            autoApprove: true,
            userRole: currentUser?.role || 'super_admin'
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            setFeedItems(prev => [data.item, ...prev.filter(f => f.id !== data.item.id)]);
            if (onAddFeedItem) onAddFeedItem(data.item);
          }
          setDispatchSuccessMsg('✓ Admin broadcast published live to the Feed!');
        } else {
          const err = await res.json().catch(() => ({}));
          setDispatchSuccessMsg(err.error || 'Failed to broadcast post.');
        }
      } else {
        // Community Motorist Post: Direct Live Post with "⚠️ NOT VERIFIED • USER POST" Banner
        const res = await fetch('/api/feed/post-dispatch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            author: authorName || userFullName || 'Community Motorist',
            handle: authorHandle || `@${(userFullName || 'Motorist').replace(/[^a-zA-Z0-9]/g, '')}`,
            postedByUserName: userFullName || authorName || 'Community Motorist',
            postedByUserSurname: userSurname || undefined,
            reporterSurname: userSurname || undefined,
            postedByUserEmail: currentUser?.email || undefined,
            location: fullLoc,
            roadwayName: roadway,
            region: targetRegion,
            category: detectedCategory,
            eventSubType: detectedSubType,
            content: contentText,
            mediaUrl: adminPhotoUrl.trim() || undefined,
            showOnLiveWatch: showOnLiveWatch,
            broadcastTopRed: false, // Strictly false for non-admin
            highlightGold: false,   // Strictly false for non-admin
            isAdmin: false,
            postAsAdmin: false,
            isUserPost: true,
            verified: false,
            userRole: 'user'
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.item) {
            setFeedItems(prev => [data.item, ...prev.filter(f => f.id !== data.item.id)]);
            if (onAddFeedItem) onAddFeedItem(data.item);
          }
          setDispatchSuccessMsg('✓ Road alert posted live to the Feed! Displaying with "⚠️ NOT VERIFIED • USER POST" banner until confirmed by patrol.');
        } else {
          const err = await res.json().catch(() => ({}));
          setDispatchSuccessMsg(err.error || 'Failed to publish community post.');
        }
      }

      if (onRefreshFeed) onRefreshFeed();
      if (onRefreshReports) onRefreshReports();
    } catch (err) {
      console.warn('Dispatch post error:', err);
    }

    // Trigger Social Sharing if selected
    if (shareToX) {
      const xTweet = `🚨 ${detectedSubType.toUpperCase()} @ ${fullLoc}\n\n${contentText}\n\nLive Traffic NPC Safety Network:`;
      const tags = ['LiveTrafficNPC', 'GautengTraffic', detectedCategory === 'spiking' ? 'SpikingAlert' : 'RoadSafety'];
      openXShareWindow(xTweet, undefined, tags);
    }

    if (shareToFacebook) {
      const fbQuote = `🚨 TRAFFIC & ROAD ADVISORY\n${detectedSubType} @ ${fullLoc}\n\n${contentText}\n\nStay alert with Live Traffic NPC`;
      openFacebookShareWindow(undefined, fbQuote);
    }

    setTimeout(() => {
      setDispatchSuccessMsg(null);
      setShowQuickPostModal(false);
      setAdminContent('');
      setSpecificLocation('');
      setAdminPhotoUrl('');
      setPostCategoryType('traffic report');
      setShareToX(false);
      setShareToFacebook(false);
      setAdminBroadcastTopRed(false);
      setAdminHighlightGold(false);
      setIsPostingDispatch(false);
    }, 450);
  };

  const handleDeleteFeedItem = async (itemId: string) => {
    const targetItem = feedItems.find(item => item && item.id === itemId);
    if (targetItem && !canUserDeleteFeedItem(targetItem)) {
      console.warn('Unauthorized: The delete button is disabled for motorists. Only administrators or the original composer can delete this post.');
      return;
    }

    setConfirmingDeleteId(null);
    registerDeletedPostId(itemId);
    clearAllPostCaches();
    const relatedIds = getAllPostRelatedIds(itemId);

    setFeedItems(prev => prev.filter(item => item && item.id && !isGloballyDeleted(item.id) && !isPostDeleted(item.id, relatedIds, relatedIds)));

    try {
      const stored = localStorage.getItem('local_feed_items');
      if (stored) {
        const localItems: FeedItem[] = JSON.parse(stored);
        localStorage.setItem(
          'local_feed_items',
          JSON.stringify(localItems.filter(i => i && i.id && !isGloballyDeleted(i.id) && !isPostDeleted(i.id, relatedIds, relatedIds)))
        );
      }
    } catch (e) {
      //
    }

    if (onDeleteFeedItem) {
      try {
        await onDeleteFeedItem(itemId);
      } catch (e) {}
    } else {
      try {
        const headers = getAdminRequestHeaders(currentUser);
        await Promise.allSettled([
          fetch(`/api/feed/${encodeURIComponent(itemId)}`, { method: 'DELETE', headers }),
          fetch(`/api/feed/${encodeURIComponent(itemId)}/delete`, { method: 'POST', headers }),
          fetch(`/api/reports/${encodeURIComponent(itemId)}`, { method: 'DELETE', headers })
        ]);
      } catch (err) {
        console.error('Error executing delete endpoint:', err);
      }
      if (onRefreshFeed) await onRefreshFeed();
      if (onRefreshReports) await onRefreshReports();
    }
  };

  const handleEditFeedSave = async (id: string, updatedFields: Partial<FeedItem>) => {
    try {
      const nowIso = new Date().toISOString();
      const fieldsWithTimestamp = {
        ...updatedFields,
        timestamp: nowIso,
        lastUpdated: nowIso
      };
      if (onEditFeedItem) {
        await onEditFeedItem(id, fieldsWithTimestamp);
      } else {
        const token = (typeof window !== 'undefined' ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken')) : '') || 'admin-authenticated-secret';
        const res = await fetch(`/api/feed/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentUser?.role || 'admin',
            'x-admin-role': currentUser?.role || 'admin',
            'x-user-email': currentUser?.email || 'admin@livetraffic.co.za',
            'x-admin-email': currentUser?.email || 'admin@livetraffic.co.za',
            'x-admin-authorized': 'true',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(fieldsWithTimestamp)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || `Failed to update feed post (${res.status})`);
        }
      }
      const cleanId = id
        .replace(/^feed-report-rep-/, '')
        .replace(/^feed-report-/, '')
        .replace(/^feed-auto-/, '')
        .replace(/^feed-rep-/, '')
        .replace(/^feed-/, '')
        .replace(/^report-/, '')
        .replace(/^rep-/, '');

      setFeedItems(prev => prev.map(item => (
        item.id === id || 
        item.id === `feed-${id}` || 
        item.id === cleanId || 
        item.id === `feed-${cleanId}` ||
        item.id === `feed-report-${cleanId}` ||
        (cleanId.length >= 4 && item.id.includes(cleanId))
      ) ? { 
        ...item, 
        ...fieldsWithTimestamp,
        views: updatedFields.views !== undefined ? updatedFields.views : item.views,
        upvotes: updatedFields.upvotes !== undefined ? updatedFields.upvotes : item.upvotes,
        downvotes: (updatedFields as any).downvotes !== undefined ? (updatedFields as any).downvotes : (item as any).downvotes,
        confirmations: (updatedFields as any).confirmations !== undefined ? (updatedFields as any).confirmations : (item as any).confirmations,
        mediaUrl: updatedFields.mediaUrl !== undefined ? updatedFields.mediaUrl : item.mediaUrl,
        imageUrl: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : (updatedFields.mediaUrl !== undefined ? updatedFields.mediaUrl : item.imageUrl),
        timestamp: nowIso,
        lastUpdated: nowIso
      } : item));
      if (onRefreshFeed) onRefreshFeed();
      if (onRefreshReports) onRefreshReports();
    } catch (err: any) {
      console.error('Error saving feed item update:', err);
      throw err;
    }
  };

  // Helper to reliably parse epoch timestamp from item.timestamp (ISO), lastUpdated, or startTime
  const getItemTimestampValue = (item: FeedItem): number => {
    if (item.timestamp) {
      const t = parseDateToMillis(item.timestamp);
      if (t > 0) return t;
    }
    if (item.lastUpdated) {
      const t = parseDateToMillis(item.lastUpdated);
      if (t > 0) return t;
    }
    if (item.startTime) {
      const t = parseDateToMillis(item.startTime);
      if (t > 0) return t;
    }
    return 0;
  };

  // Active items within dynamic live feed time frame (Old posts outside the 6-hour window are dropped)
  const feedItemsInLiveWindow = React.useMemo(() => {
    return filterFeedItemsInLiveWindow(feedItems, 6);
  }, [feedItems]);

  const liveFeedWindowInfo = React.useMemo(() => {
    return getLiveFeedWindowBounds(feedItems, 6);
  }, [feedItems]);

  // 1. All live items inside the active 6-hr live window, strictly deduplicated by id (excluding legacy Google scan items)
  const liveItems = React.useMemo(() => {
    const seen = new Set<string>();
    return feedItemsInLiveWindow.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      if (isGoogleMapsScanItem(item)) return false;
      seen.add(item.id);
      return true;
    });
  }, [feedItemsInLiveWindow]);

  // Category counts across active live feed items inside the live feed window
  const categoryCounts = React.useMemo(() => {
    let admin = 0;
    let crashes = 0;
    let spiking = 0;
    let gbv = 0;
    let highways = 0;
    let community = 0;
    let potholes = 0;

    for (const item of liveItems) {
      if (isItemAdminPost(item)) {
        admin++;
      }
      const isGbv = item.category === 'gbv' || item.category === 'gbv_assist' || item.eventSubType?.toLowerCase().includes('gbv') || item.content?.toLowerCase().includes('gbv') || item.author?.toLowerCase().includes('gbv');
      if (isGbv) gbv++;

      const isCrash = !isGbv && (item.category === 'crash' || item.category === ('accident' as any) || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident') || item.content.toLowerCase().includes('crash'));
      if (isCrash) crashes++;

      const isSpike = !isGbv && (item.category === 'spiking' || item.eventSubType?.toLowerCase().includes('spiking') || item.content.toLowerCase().includes('spiking') || item.content.toLowerCase().includes('spike trap') || item.content.toLowerCase().includes('tyre trap'));
      if (isSpike) spiking++;

      const isPothole = !isGbv && (item.category === 'pothole' || item.eventSubType?.toLowerCase().includes('pothole') || item.content.toLowerCase().includes('pothole'));
      if (isPothole) potholes++;

      if (isITrafficItem(item)) {
        highways++;
      } else if (item.source === 'community' || (!item.source && !isItemAdminPost(item))) {
        community++;
      }
    }

    // Total active feed items count
    const totalCount = liveItems.length;

    return {
      all: totalCount,
      admin,
      crashes,
      spiking,
      gbv,
      itraffic: highways,
      community,
      potholes,
      traveltimes: 270
    };
  }, [liveItems]);

  // Real-time Nationwide & Provincial Traffic Counts
  const comprehensiveCounts = React.useMemo(() => {
    return getComprehensiveTrafficCounts(liveItems);
  }, [liveItems]);

  const cityCounts = React.useMemo(() => {
    return {
      pretoria: comprehensiveCounts.pretoria,
      johannesburg: comprehensiveCounts.johannesburg,
      allGauteng: comprehensiveCounts.gauteng,
      gauteng: comprehensiveCounts.gauteng,
      kzn: comprehensiveCounts.kzn,
      westernCape: comprehensiveCounts.westernCape,
      easternCape: comprehensiveCounts.easternCape,
      freeState: comprehensiveCounts.freeState,
      mpumalanga: comprehensiveCounts.mpumalanga,
      limpopo: comprehensiveCounts.limpopo,
      northWest: comprehensiveCounts.northWest,
      northernCape: comprehensiveCounts.northernCape,
      pretoriaDelays: comprehensiveCounts.pretoriaDelays,
      johannesburgDelays: comprehensiveCounts.johannesburgDelays,
      gautengDelays: comprehensiveCounts.gautengDelays,
      kznDelays: comprehensiveCounts.kznDelays,
      wcDelays: comprehensiveCounts.wcDelays,
      ecDelays: comprehensiveCounts.ecDelays,
      fsDelays: comprehensiveCounts.fsDelays,
      mpDelays: comprehensiveCounts.mpDelays,
      lpDelays: comprehensiveCounts.lpDelays,
      nwDelays: comprehensiveCounts.nwDelays,
      ncDelays: comprehensiveCounts.ncDelays
    };
  }, [comprehensiveCounts]);

  // Main Feed total item count
  const mainFeedTotalCount = React.useMemo(() => {
    return liveItems.length;
  }, [liveItems]);

  // Region items counts (Across all 9 provinces)
  const regionCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: liveItems.length };
    for (const p of SA_PROVINCES_LIST) {
      counts[p] = 0;
    }
    for (const item of liveItems) {
      const reg = resolveItemRegion(item);
      if (counts[reg] !== undefined) {
        counts[reg] = (counts[reg] || 0) + 1;
      }
    }
    return counts;
  }, [liveItems]);

  // Filtered Main Feed & City Items (Sorted dynamically by date & time)
  const filteredITrafficItems = React.useMemo(() => {
    return liveItems
      .filter(item => {
        // 1. City & Provincial Quick Filter (All 9 Provinces + Metros + Custom Areas)
        if (typeof cityFilter === 'string' && cityFilter.startsWith('custom:')) {
          const customQuery = cityFilter.replace('custom:', '').toLowerCase().trim();
          const itemText = `${item.location || ''} ${item.roadwayName || ''} ${item.content || ''} ${item.author || ''}`.toLowerCase();
          if (!itemText.includes(customQuery)) return false;
        } else if (cityFilter === 'pretoria') {
          if (!isPretoriaItem(item)) return false;
        } else if (cityFilter === 'johannesburg') {
          if (!isJohannesburgItem(item)) return false;
        } else if (cityFilter === 'gauteng') {
          if (!isGautengItem(item)) return false;
        } else if (cityFilter === 'kzn') {
          if (!isKZNItem(item)) return false;
        } else if (cityFilter === 'wc') {
          if (!isWesternCapeItem(item)) return false;
        } else if (cityFilter === 'ec') {
          if (!isEasternCapeItem(item)) return false;
        } else if (cityFilter === 'fs') {
          if (!isFreeStateItem(item)) return false;
        } else if (cityFilter === 'mp') {
          if (!isMpumalangaItem(item)) return false;
        } else if (cityFilter === 'lp') {
          if (!isLimpopoItem(item)) return false;
        } else if (cityFilter === 'nw') {
          if (!isNorthWestItem(item)) return false;
        } else if (cityFilter === 'nc') {
          if (!isNorthernCapeItem(item)) return false;
        }

        // 3. Feed Category Filter (All / Admin / Crashes / Spiking / Highway Feeds / Community / Potholes / GBV)
        if (feedCategoryFilter !== 'all') {
          const isGbv = item.category === 'gbv' || item.category === 'gbv_assist' || item.eventSubType?.toLowerCase().includes('gbv') || item.content?.toLowerCase().includes('gbv') || item.author?.toLowerCase().includes('gbv');
          if (feedCategoryFilter === 'gbv') {
            if (!isGbv) return false;
          } else if (feedCategoryFilter === 'admin') {
            if (!isItemAdminPost(item)) return false;
          } else if (feedCategoryFilter === 'crashes') {
            const isCrash = !isGbv && (item.category === 'crash' || item.category === ('accident' as any) || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident') || item.content.toLowerCase().includes('crash'));
            if (!isCrash) return false;
          } else if (feedCategoryFilter === 'spiking') {
            const isSpike = !isGbv && (item.category === 'spiking' || item.eventSubType?.toLowerCase().includes('spiking') || item.content.toLowerCase().includes('spiking') || item.content.toLowerCase().includes('spike trap') || item.content.toLowerCase().includes('tyre trap'));
            if (!isSpike) return false;
          } else if (feedCategoryFilter === 'potholes') {
            const isPothole = !isGbv && (item.category === 'pothole' || item.eventSubType?.toLowerCase().includes('pothole') || item.content.toLowerCase().includes('pothole'));
            if (!isPothole) return false;
          } else if (feedCategoryFilter === 'itraffic') {
            const isHighway = isITrafficItem(item);
            if (!isHighway) return false;
          } else if (feedCategoryFilter === 'community') {
            const isCommunity = (item.source === 'community' || !item.source) && !isItemAdminPost(item);
            if (!isCommunity) return false;
          }
        }

        // Region Filter (Handles multi-selected regions and single region filter)
        if (selectedRegions.length > 0 && !selectedRegions.includes('all')) {
          const itemRegion = resolveItemRegion(item);
          if (!selectedRegions.includes(itemRegion)) return false;
        } else if (regionFilter !== 'all') {
          const itemRegion = resolveItemRegion(item);
          if (itemRegion !== regionFilter) return false;
        }

        // Corridor Filter
        if (corridorFilter !== 'all') {
          const matchCorridor = 
            (item.roadwayName && item.roadwayName.toLowerCase().includes(corridorFilter.toLowerCase())) ||
            (item.location && item.location.toLowerCase().includes(corridorFilter.toLowerCase())) ||
            (item.content && item.content.toLowerCase().includes(corridorFilter.toLowerCase()));
          if (!matchCorridor) return false;
        }

        // Event Type Filter
        if (eventTypeFilter !== 'all') {
          if (eventTypeFilter === 'crash') {
            const isCrash = item.category === 'crash' || item.category === ('accident' as any) || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident') || item.content.toLowerCase().includes('crash');
            if (!isCrash) return false;
          } else if (eventTypeFilter === 'roadworks') {
            const isRoadworks = item.category === 'roadworks' || item.eventSubType?.toLowerCase().includes('roadwork') || item.content.toLowerCase().includes('roadwork') || item.content.toLowerCase().includes('maintenance');
            if (!isRoadworks) return false;
          } else if (eventTypeFilter === 'stationary') {
            const isStationary = item.category === 'stationary' || item.category === 'hazard' || item.category === 'spiking' || item.category === 'pothole' || item.eventSubType?.toLowerCase().includes('stationary') || item.eventSubType?.toLowerCase().includes('hazard') || item.eventSubType?.toLowerCase().includes('spiking') || item.eventSubType?.toLowerCase().includes('pothole') || item.content.toLowerCase().includes('hazard') || item.content.toLowerCase().includes('obstruction') || item.content.toLowerCase().includes('spiking') || item.content.toLowerCase().includes('pothole');
            if (!isStationary) return false;
          } else if (eventTypeFilter === 'congestion') {
            const isCongestion = item.category === 'congestion' || item.category === 'traffic' || item.eventSubType?.toLowerCase().includes('congestion') || item.content.toLowerCase().includes('congestion') || item.content.toLowerCase().includes('queue') || item.content.toLowerCase().includes('delay');
            if (!isCongestion) return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchSearch = 
            (item.roadwayName && item.roadwayName.toLowerCase().includes(query)) ||
            (item.location && item.location.toLowerCase().includes(query)) ||
            (item.content && item.content.toLowerCase().includes(query)) ||
            (item.direction && item.direction.toLowerCase().includes(query)) ||
            (item.author && item.author.toLowerCase().includes(query)) ||
            (item.eventSubType && item.eventSubType.toLowerCase().includes(query));
          if (!matchSearch) return false;
        }

        return true;
      })
      .filter((() => {
        const seen = new Set<string>();
        return (item: FeedItem) => {
          if (!item || !item.id) return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        };
      })())
      .sort((a, b) => {
        // Highlighted post for area must be first post
        const aHigh = Boolean(a.highlightGold);
        const bHigh = Boolean(b.highlightGold);
        if (aHigh && !bHigh) return -1;
        if (!aHigh && bHigh) return 1;

        const timeA = getItemTimestampValue(a);
        const timeB = getItemTimestampValue(b);
        const diff = timeB - timeA;
        return sortOrder === 'newest' ? diff : -diff;
      });
  }, [liveItems, cityFilter, selectedRegions, regionFilter, corridorFilter, eventTypeFilter, searchQuery, sortOrder]);

  // Admin Posts list (within Live Feed Window)
  const adminPostItems = React.useMemo(() => {
    return feedItemsInLiveWindow.filter(isItemAdminPost);
  }, [feedItemsInLiveWindow]);

  const filteredAdminItems = React.useMemo(() => {
    return adminPostItems
      .filter(item => {
        // City & Provincial Filter
        if (typeof cityFilter === 'string' && cityFilter.startsWith('custom:')) {
          const customQuery = cityFilter.replace('custom:', '').toLowerCase().trim();
          const itemText = `${item.location || ''} ${item.roadwayName || ''} ${item.content || ''} ${item.author || ''}`.toLowerCase();
          if (!itemText.includes(customQuery)) return false;
        } else if (cityFilter === 'pretoria') {
          if (!isPretoriaItem(item)) return false;
        } else if (cityFilter === 'johannesburg') {
          if (!isJohannesburgItem(item)) return false;
        } else if (cityFilter === 'gauteng') {
          if (!isGautengItem(item)) return false;
        } else if (cityFilter === 'kzn') {
          if (!isKZNItem(item)) return false;
        } else if (cityFilter === 'wc') {
          if (!isWesternCapeItem(item)) return false;
        } else if (cityFilter === 'ec') {
          if (!isEasternCapeItem(item)) return false;
        } else if (cityFilter === 'fs') {
          if (!isFreeStateItem(item)) return false;
        } else if (cityFilter === 'mp') {
          if (!isMpumalangaItem(item)) return false;
        } else if (cityFilter === 'lp') {
          if (!isLimpopoItem(item)) return false;
        } else if (cityFilter === 'nw') {
          if (!isNorthWestItem(item)) return false;
        } else if (cityFilter === 'nc') {
          if (!isNorthernCapeItem(item)) return false;
        }
        // Region Filter
        if (selectedRegions.length > 0 && !selectedRegions.includes('all')) {
          const itemRegion = resolveItemRegion(item);
          if (!selectedRegions.includes(itemRegion)) return false;
        } else if (regionFilter !== 'all') {
          const itemRegion = resolveItemRegion(item);
          if (itemRegion !== regionFilter) return false;
        }
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            (item.content && item.content.toLowerCase().includes(q)) ||
            (item.location && item.location.toLowerCase().includes(q)) ||
            (item.roadwayName && item.roadwayName.toLowerCase().includes(q)) ||
            (item.author && item.author.toLowerCase().includes(q)) ||
            (item.eventSubType && item.eventSubType.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Highlighted post for area must be first post
        const aHigh = Boolean(a.highlightGold);
        const bHigh = Boolean(b.highlightGold);
        if (aHigh && !bHigh) return -1;
        if (!aHigh && bHigh) return 1;

        const timeA = getItemTimestampValue(a);
        const timeB = getItemTimestampValue(b);
        const diff = timeB - timeA;
        return sortOrder === 'newest' ? diff : -diff;
      });
  }, [adminPostItems, cityFilter, selectedRegions, regionFilter, searchQuery, sortOrder]);

  // Filtered Community & Admin Dispatches (Sorted strictly dynamically by sortOrder / date within Live Feed Window)
  const filteredDispatches = React.useMemo(() => {
    const seen = new Set<string>();
    return liveItems
      .filter(item => item.source !== 'itraffic')
      .filter(item => {
        if (!item || !item.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .filter(item => {
        if (dispatchFilter === 'admin_dispatch') {
          return isItemAdminPost(item);
        }
        if (dispatchFilter === 'community') {
          return !isItemAdminPost(item);
        }
        if (dispatchFilter === 'potholes') {
          return item.category === 'pothole' || item.content.toLowerCase().includes('pothole') || (item.author && item.author.toLowerCase().includes('pothole'));
        }
        if (dispatchFilter === 'sos') {
          return item.category === 'spiking' || item.content.toLowerCase().includes('sos') || item.content.toLowerCase().includes('emergency');
        }
        return true;
      })
      .filter(item => {
        // Region Filter for dispatches
        if (selectedRegions.length > 0 && !selectedRegions.includes('all')) {
          const itemRegion = resolveItemRegion(item);
          if (!selectedRegions.includes(itemRegion)) return false;
        } else if (regionFilter !== 'all') {
          const itemRegion = resolveItemRegion(item);
          if (itemRegion !== regionFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Highlighted post for area must be first post
        const aHigh = Boolean(a.highlightGold);
        const bHigh = Boolean(b.highlightGold);
        if (aHigh && !bHigh) return -1;
        if (!aHigh && bHigh) return 1;

        const timeA = getItemTimestampValue(a);
        const timeB = getItemTimestampValue(b);
        const diff = timeB - timeA;
        return sortOrder === 'newest' ? diff : -diff;
      });
  }, [liveItems, dispatchFilter, selectedRegions, regionFilter, sortOrder]);

  const corridorPills = React.useMemo(() => {
    if (selectedRegions.length === 1 && selectedRegions[0] !== 'all') {
      const regionDef = SA_REGIONS[selectedRegions[0]] || SA_REGIONS['all'];
      return regionDef.majorCorridors || SA_REGIONS['all'].majorCorridors;
    }
    const regionDef = SA_REGIONS[regionFilter] || SA_REGIONS['all'];
    return regionDef.majorCorridors || SA_REGIONS['all'].majorCorridors;
  }, [regionFilter, selectedRegions]);

  // Active Top Red Broadcasts (Items flagged with broadcastTopRed: true)
  const activeTopRedBroadcasts = React.useMemo(() => {
    return feedItemsInLiveWindow
      .filter(item => Boolean(item.broadcastTopRed))
      .filter(item => {
        // Filter by region if a region is active
        if (selectedRegions.length > 0 && !selectedRegions.includes('all')) {
          const itemRegion = resolveItemRegion(item);
          if (!selectedRegions.includes(itemRegion)) return false;
        } else if (regionFilter !== 'all') {
          const itemRegion = resolveItemRegion(item);
          if (itemRegion !== regionFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Highlighted post for area first
        const aHigh = Boolean(a.highlightGold);
        const bHigh = Boolean(b.highlightGold);
        if (aHigh && !bHigh) return -1;
        if (!aHigh && bHigh) return 1;
        return getItemTimestampValue(b) - getItemTimestampValue(a);
      });
  }, [feedItemsInLiveWindow, selectedRegions, regionFilter]);

  const handleScrollToBroadcastPost = (broadcastItem: FeedItem) => {
    if (!broadcastItem || !broadcastItem.id) return;

    // Switch to proper tab if needed
    if (activeTab === 'dispatches' && broadcastItem.source === 'itraffic') {
      setActiveTab('itraffic');
    } else if (activeTab === 'admin' && broadcastItem.source !== 'admin_dispatch') {
      setActiveTab('itraffic');
    }

    // Ensure item is not filtered out by search query or category filter
    if (searchQuery.trim()) {
      setSearchQuery('');
    }
    if (feedCategoryFilter !== 'all' && feedCategoryFilter !== broadcastItem.category) {
      setFeedCategoryFilter('all');
    }

    // Expand and highlight item
    setExpandedItemIds(prev => ({ ...prev, [broadcastItem.id]: true }));
    setHighlightedItemId(broadcastItem.id);

    // Scroll smoothly to the actual post
    setTimeout(() => {
      const el = document.getElementById(`feed-item-${broadcastItem.id}`) || document.getElementById(`feed-item-bullet-${broadcastItem.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedItemId(null);
    }, 8000);
  };

  // Calculate target item indices for in-feed ad insertion
  const targetInFeedAdIndices = React.useMemo(() => {
    const count = filteredITrafficItems.length;
    if (count === 0) return [];
    if (feedAdPlacement === 'top' || feedAdPlacement === 'bottom') return [];
    if (feedAdPlacement === 'mid') return [Math.max(0, Math.floor(count / 2))];
    if (feedAdPlacement === 'both') return [Math.max(0, Math.min(2, Math.floor(count / 2)))];

    // 'random' placement mode
    if (count <= 2) return [0];
    if (count <= 5) {
      const rand = 1 + Math.floor(((adShuffleKey * 7 + 3) % (count - 1)));
      return [rand];
    }
    const half = Math.floor(count / 2);
    let slot1 = 1 + Math.floor(((adShuffleKey * 11 + 2) % Math.max(1, half - 1)));
    if (slot1 === 2 && count > 3) slot1 = 3;
    let slot2 = half + 1 + Math.floor(((adShuffleKey * 13 + 5) % Math.max(1, count - half - 2)));
    if (slot2 === 2) slot2 = Math.min(count - 1, 4);
    return [slot1, slot2];
  }, [filteredITrafficItems.length, feedAdPlacement, adShuffleKey]);

  const targetInFeedDispatchAdIndices = React.useMemo(() => {
    const count = filteredDispatches.length;
    if (count === 0) return [];
    if (feedAdPlacement === 'top' || feedAdPlacement === 'bottom') return [];
    if (feedAdPlacement === 'mid') return [Math.max(0, Math.floor(count / 2))];
    if (feedAdPlacement === 'both') return [Math.max(0, Math.min(2, Math.floor(count / 2)))];

    if (count <= 2) return [0];
    if (count <= 5) {
      const rand = 1 + Math.floor(((adShuffleKey * 7 + 3) % (count - 1)));
      return [rand === 2 && count > 3 ? 3 : rand];
    }
    const half = Math.floor(count / 2);
    let slot1 = 1 + Math.floor(((adShuffleKey * 11 + 2) % Math.max(1, half - 1)));
    if (slot1 === 2 && count > 3) slot1 = 3;
    let slot2 = half + 1 + Math.floor(((adShuffleKey * 13 + 5) % Math.max(1, count - half - 2)));
    if (slot2 === 2) slot2 = Math.min(count - 1, 4);
    return [slot1, slot2];
  }, [filteredDispatches.length, feedAdPlacement, adShuffleKey]);

  const renderInFeedAdBanner = (slotIndex: number, isGrid: boolean = false) => {
    if (!adsEnabled || activeAds.length === 0) return null;
    const banner = activeAds[(currentTopAdIndex + slotIndex) % activeAds.length] || activeAds[0];
    if (!banner || dismissedAdIds[banner.id]) return null;

    return (
      <motion.div
        key={`in-feed-ad-${banner.id}-${slotIndex}-${adShuffleKey}`}
        layout="position"
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className={isGrid ? "col-span-1 md:col-span-2 space-y-2 my-1" : "space-y-2 my-2"}
      >
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-950/40 border border-amber-500/25 px-2 py-0.5 rounded shrink-0">
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>Partner Ad</span>
            </span>
            <span className="text-[10px] text-amber-300/80 font-mono hidden xs:inline">
              {feedAdPlacement === 'random' ? '🎲 Random In-Feed' : feedAdPlacement === 'mid' ? '📍 Mid-Feed' : '🌟 In-Feed'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                if (onNavigateToAdvertiser) onNavigateToAdvertiser();
                else if (onSwitchTab) onSwitchTab('advertiser');
              }}
              className="inline-flex items-center space-x-1 text-amber-400 hover:text-amber-300 font-bold text-xs hover:underline transition shrink-0 cursor-pointer group py-0.5"
            >
              <span>Advertising Page</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        <FeedAdBanner
          key={`top-slot-${slotIndex}-${banner.id}`}
          banner={banner}
          variant="top"
          showSponsoredBadge={showSponsoredBadge}
          allowDismiss={allowDismissAds}
          onDismiss={handleDismissAd}
          totalBanners={activeAds.length}
          currentIndex={(currentTopAdIndex + slotIndex) % activeAds.length}
          onPrevBanner={handlePrevTopBanner}
          onNextBanner={handleNextTopBanner}
          onSelectBannerIndex={(idx) => setCurrentTopAdIndex(idx)}
          isAutoRotating={autoRotateTopBanners}
          onToggleAutoRotate={() => setAutoRotateTopBanners(prev => !prev)}
          onNavigateToAdvertiser={onNavigateToAdvertiser || (() => onSwitchTab?.('advertiser'))}
        />
      </motion.div>
    );
  };

  const renderBottomAdSection = () => {
    if (!adsEnabled || (feedAdPlacement !== 'bottom' && feedAdPlacement !== 'both') || activeAds.length === 0) {
      return null;
    }
    const banner = activeAds[currentTopAdIndex % activeAds.length] || activeAds[0];
    if (!banner || dismissedAdIds[banner.id]) return null;

    return (
      <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-xs">
          <div className="flex items-center space-x-1.5 min-w-0">
            <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-950/40 border border-amber-500/25 px-2 py-0.5 rounded shrink-0">
              <Megaphone className="w-3 h-3 text-amber-400" />
              <span>Partner Ad (Bottom Placement)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToAdvertiser) onNavigateToAdvertiser();
              else if (onSwitchTab) onSwitchTab('advertiser');
            }}
            className="inline-flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-bold text-xs hover:underline transition shrink-0 cursor-pointer group py-0.5"
          >
            <span>Advertising Page</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <FeedAdBanner
          key={`bottom-${banner.id}`}
          banner={banner}
          variant="top"
          showSponsoredBadge={showSponsoredBadge}
          allowDismiss={allowDismissAds}
          onDismiss={handleDismissAd}
          totalBanners={activeAds.length}
          currentIndex={currentTopAdIndex % activeAds.length}
          onPrevBanner={handlePrevTopBanner}
          onNextBanner={handleNextTopBanner}
          onSelectBannerIndex={(idx) => setCurrentTopAdIndex(idx)}
          isAutoRotating={autoRotateTopBanners}
          onToggleAutoRotate={() => setAutoRotateTopBanners(prev => !prev)}
          onNavigateToAdvertiser={onNavigateToAdvertiser || (() => onSwitchTab?.('advertiser'))}
        />
      </div>
    );
  };

  // Record real live view impressions when feed items are displayed
  useEffect(() => {
    const activeItems = activeTab === 'dispatches' ? filteredDispatches : filteredITrafficItems;
    if (!activeItems || activeItems.length === 0) return;

    const unrecordedIds: string[] = [];
    activeItems.slice(0, 50).forEach(item => {
      if (item.id && !recordedImpressionsRef.current.has(item.id)) {
        recordedImpressionsRef.current.add(item.id);
        unrecordedIds.push(item.id);
      }
    });

    if (unrecordedIds.length > 0) {
      fetch('/api/feed/views/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: unrecordedIds, amount: 1 })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.updatedViews) {
            setLiveViewsMap(prev => ({ ...prev, ...data.updatedViews }));
          }
        })
        .catch(() => {});
    }
  }, [activeTab, filteredDispatches, filteredITrafficItems]);

  // Accurate cumulative view calculation across currently filtered and all feed alerts
  const currentFeedAlertsViews = React.useMemo(() => {
    const activeItems = activeTab === 'dispatches' ? filteredDispatches : filteredITrafficItems;
    if (!activeItems || activeItems.length === 0) return 0;
    return activeItems.reduce((acc, item) => {
      return acc + getItemViews(item, liveViewsMap);
    }, 0);
  }, [activeTab, filteredDispatches, filteredITrafficItems, liveViewsMap]);

  const totalAllAlertViews = React.useMemo(() => {
    let sum = 0;
    Object.values(liveViewsMap).forEach(v => {
      if (typeof v === 'number' && v > 0) sum += v;
    });
    const unmappedItems = (feedItems || []).filter(item => item.id && !liveViewsMap[item.id]);
    unmappedItems.forEach(item => {
      sum += (item.views || 1);
    });
    return Math.max(currentFeedAlertsViews, sum);
  }, [liveViewsMap, feedItems, currentFeedAlertsViews]);

  const isAnyRegionFilterActive = (!selectedRegions.includes('all') && selectedRegions.length > 0) || regionFilter !== 'all';
  const hasActiveFilters = searchQuery.trim() !== '' || isAnyRegionFilterActive || corridorFilter !== 'all' || eventTypeFilter !== 'all' || (activeTab === 'dispatches' && dispatchFilter !== 'all');
  const activeFilterCount = (searchQuery.trim() ? 1 : 0) + (isAnyRegionFilterActive ? 1 : 0) + (corridorFilter !== 'all' ? 1 : 0) + (eventTypeFilter !== 'all' ? 1 : 0) + (activeTab === 'dispatches' && dispatchFilter !== 'all' ? 1 : 0);

  return (
    <div
      ref={feedContainerRef}
      id="live-feed-section-container"
      className={`transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-[100] w-screen h-screen overflow-y-auto bg-[#07090E] p-3 sm:p-6 space-y-3 pb-32 max-w-none'
          : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4 space-y-3 pb-36 sm:pb-28'
      }`}
    >
      {/* Full Screen Active Notification Bar with Quick Exit (Shown only in Fullscreen Mode) */}
      {isFullscreen && (
        <div className="sticky top-2 z-[120] flex items-center justify-between bg-slate-950/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl px-3.5 sm:px-5 py-2.5 shadow-2xl animate-fadeIn">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                Full Screen Live Feed Active
              </span>
              <span className="text-[11px] text-slate-300 hidden sm:inline truncate">
                Distraction-free real-time highway incidents & patrol monitoring
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 rounded-xl border border-amber-400 shadow-md transition cursor-pointer flex items-center space-x-1.5 text-xs font-black shrink-0 active:scale-95 group"
            title="Exit Full Screen & Restore Standard View (Or press ESC)"
            aria-label="Exit Full Screen"
          >
            <Minimize2 className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>Exit Full Screen</span>
            <span className="text-[10px] opacity-80 font-mono bg-slate-950/20 text-slate-950 px-1 py-0.2 rounded hidden sm:inline">ESC</span>
          </button>
        </div>
      )}

      {/* Sync Notification Banner */}
      {syncNotice && (
        <div className="bg-sky-950/60 border border-sky-500/40 rounded-xl px-4 py-2 text-xs text-sky-200 font-bold flex items-center justify-between animate-fadeIn">
          <span>{syncNotice}</span>
          <button onClick={() => setSyncNotice(null)} className="text-sky-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 🔴 CRITICAL ADMIN BROADCAST ON TOP RED BANNER (Click to direct to actual post) */}
      {activeTopRedBroadcasts.length > 0 && (
        <div className="space-y-2 animate-fadeIn" id="top-red-broadcast-banner-group">
          {activeTopRedBroadcasts.map((broadcastItem) => {
            const dateStr = broadcastItem.lastUpdated || broadcastItem.timestamp || broadcastItem.startTime;
            const timeFormatted = formatSATime(dateStr) || formatReadableDateTime(dateStr);
            const isHigh = Boolean(broadcastItem.highlightGold);
            return (
              <div
                key={`top-red-broadcast-${broadcastItem.id}`}
                id={`top-red-broadcast-${broadcastItem.id}`}
                onClick={() => handleScrollToBroadcastPost(broadcastItem)}
                className="group cursor-pointer bg-gradient-to-r from-red-600 via-red-700 to-rose-800 hover:from-red-500 hover:via-red-600 hover:to-rose-700 text-white rounded-2xl p-3 sm:p-4 shadow-xl shadow-red-950/60 border-2 border-red-400/90 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleScrollToBroadcastPost(broadcastItem); }}
                title="Click to direct to actual post in the feed"
              >
                {/* Subtle animated light pulse in background */}
                <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-start sm:items-center space-x-3 min-w-0">
                    <div className="p-2.5 bg-white/20 rounded-xl shrink-0 backdrop-blur-sm shadow-inner flex items-center justify-center">
                      <Radio className="w-5 h-5 text-white animate-pulse" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="bg-black/50 text-white border border-red-300/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping inline-block" />
                          <span>🔴 ADMIN BROADCAST</span>
                        </span>
                        {broadcastItem.roadwayName && (
                          <span className="bg-white text-red-950 font-black text-[10px] px-2 py-0.5 rounded shadow">
                            {broadcastItem.roadwayName}
                          </span>
                        )}
                        {broadcastItem.location && (
                          <span className="text-xs font-bold text-red-100 truncate max-w-[280px]">
                            📍 {broadcastItem.location}
                          </span>
                        )}
                        {timeFormatted && (
                          <span className="text-[10px] font-mono text-red-100 bg-black/30 px-2 py-0.5 rounded flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5 text-red-200" />
                            <span>{timeFormatted}</span>
                          </span>
                        )}
                        {isHigh && (
                          <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded uppercase tracking-wider shadow">
                            🟡 Gold Highlight
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm font-extrabold text-white line-clamp-2 sm:line-clamp-1 leading-snug">
                        {broadcastItem.content}
                      </p>
                    </div>
                  </div>

                  {/* Click to Direct to Actual Post Action */}
                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <span className="text-[11px] font-black uppercase tracking-wider text-red-100 hidden md:inline group-hover:underline">
                      Click to Direct to Post
                    </span>
                    <div className="px-3.5 py-1.5 bg-white text-red-700 group-hover:bg-red-50 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-lg transition-all group-hover:translate-x-0.5">
                      <span>View Post</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Target Incident Indicator (Navigated from Top LIVE Alert Bar) */}
      {activeFocusedNotice && (
        <div className="bg-gradient-to-r from-red-950/90 via-[#18110D] to-[#0F1115] border border-amber-500/50 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="flex h-3 w-3 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                Target Incident from Live Alert Bar
              </span>
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {activeFocusedNotice}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveFocusedNotice(null);
              setHighlightedItemId(null);
              if (onClearFocusedAlert) onClearFocusedAlert();
            }}
            className="px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center space-x-1"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dismiss Filter</span>
          </button>
        </div>
      )}

      {/* Experimental Feed Screen Advertisement (Top Header Carousel Banner) */}
      {adsEnabled && (feedAdPlacement === 'top' || feedAdPlacement === 'both') && topBanners.length > 0 && (
        <div className="space-y-2">
          {/* Direct Link Above Advert to the Advertising Page */}
          <div className="flex items-center justify-between gap-2 px-1 py-0.5 text-xs">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-amber-400/90 bg-amber-950/40 border border-amber-500/25 px-2 py-0.5 rounded shrink-0">
                <Megaphone className="w-3 h-3 text-amber-400" />
                <span>Partner Ad Space</span>
              </span>
              <span className="text-slate-400 text-xs truncate hidden sm:inline">
                Promote your brand to thousands of South African motorists daily
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToAdvertiser) onNavigateToAdvertiser();
                else if (onSwitchTab) onSwitchTab('advertiser');
              }}
              className="inline-flex items-center space-x-1.5 text-amber-400 hover:text-amber-300 font-bold text-xs hover:underline transition shrink-0 cursor-pointer group py-0.5"
            >
              <span>Advertising Page</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {(() => {
            const activeTopBanner = topBanners[currentTopAdIndex % topBanners.length] || topBanners[0];
            if (!activeTopBanner) return null;
            return (
              <FeedAdBanner
                key={activeTopBanner.id}
                banner={activeTopBanner}
                variant="top"
                showSponsoredBadge={showSponsoredBadge}
                allowDismiss={allowDismissAds}
                onDismiss={handleDismissAd}
                totalBanners={topBanners.length}
                currentIndex={currentTopAdIndex % topBanners.length}
                onPrevBanner={handlePrevTopBanner}
                onNextBanner={handleNextTopBanner}
                onSelectBannerIndex={(idx) => setCurrentTopAdIndex(idx)}
                isAutoRotating={autoRotateTopBanners}
                onToggleAutoRotate={() => setAutoRotateTopBanners(prev => !prev)}
                onNavigateToAdvertiser={onNavigateToAdvertiser || (() => onSwitchTab?.('advertiser'))}
              />
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚦 REGIONAL METRO TRAFFIC BUTTONS & PROVINCIAL LIVE WATCH (ALL PROVINCES) */}
      {/* Positioned directly under the advert for quick regional & city feeds filtering */}
      {/* ========================================================================= */}
      <div id="city-traffic-buttons-bar" className="bg-slate-900/95 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl">
        {/* Selection Dropdown & Custom Location Filter Input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
          {/* 1. Dropdown Selection Menu (Spans 5 cols on lg) */}
          <div className="lg:col-span-5 relative" ref={nationwideDropdownRef}>
            <button
              id="nationwide-live-watch-dropdown-btn"
              type="button"
              onClick={() => setIsNationwideDropdownOpen(prev => !prev)}
              className={`w-full h-full min-h-[44px] px-3.5 py-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer group shadow-sm ${
                cityFilter !== 'all'
                  ? 'bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-500/60 text-white ring-1 ring-cyan-500/30'
                  : 'bg-slate-950/90 hover:bg-slate-900/90 border-slate-700/80 hover:border-slate-600 text-slate-200'
              }`}
              aria-expanded={isNationwideDropdownOpen}
            >
              <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                <span className="text-base shrink-0">
                  {cityFilter === 'all' ? '🌐' :
                   cityFilter === 'pretoria' ? '🏛️' :
                   cityFilter === 'johannesburg' ? '🏙️' :
                   cityFilter === 'gauteng' ? '⚡' :
                   cityFilter === 'kzn' ? '🌊' :
                   cityFilter === 'wc' ? '⛰️' :
                   cityFilter === 'ec' ? '🚗' :
                   cityFilter === 'fs' ? '🌾' :
                   cityFilter === 'mp' ? '🦁' :
                   cityFilter === 'lp' ? '🌳' :
                   cityFilter === 'nw' ? '⛏️' :
                   cityFilter === 'nc' ? '💎' : '📍'}
                </span>
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Live Watch Area</div>
                  <div className="font-bold text-xs text-white truncate">
                    {cityFilter === 'all' && `Main Feed (All SA Highways) • ${mainFeedTotalCount}`}
                    {cityFilter === 'pretoria' && `Pretoria & Tshwane • ${cityCounts.pretoria}`}
                    {cityFilter === 'johannesburg' && `Johannesburg & Sandton • ${cityCounts.johannesburg}`}
                    {cityFilter === 'gauteng' && `Gauteng Province • ${cityCounts.gauteng}`}
                    {cityFilter === 'kzn' && `KwaZulu-Natal (Durban/PMB) • ${cityCounts.kzn}`}
                    {cityFilter === 'wc' && `Western Cape (Cape Town) • ${cityCounts.westernCape}`}
                    {cityFilter === 'ec' && `Eastern Cape (Gqeberha/EL) • ${cityCounts.easternCape}`}
                    {cityFilter === 'fs' && `Free State (Bloemfontein) • ${cityCounts.freeState}`}
                    {cityFilter === 'mp' && `Mpumalanga (Mbombela) • ${cityCounts.mpumalanga}`}
                    {cityFilter === 'lp' && `Limpopo (Polokwane) • ${cityCounts.limpopo}`}
                    {cityFilter === 'nw' && `North West (Rustenburg) • ${cityCounts.northWest}`}
                    {cityFilter === 'nc' && `Northern Cape (Kimberley) • ${cityCounts.northernCape}`}
                    {typeof cityFilter === 'string' && cityFilter.startsWith('custom:') && `📍 ${cityFilter.replace('custom:', '')} (Filtered)`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0">
                <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform duration-200 ${isNationwideDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Dropdown Menu Overlay */}
            <AnimatePresence>
              {isNationwideDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800 max-h-[380px] overflow-y-auto"
                >
                  {/* Category 1: Main Feed Overview */}
                  <div className="p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Feed Views</div>
                    
                    {/* Main Feed Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('all');
                        setSelectedRegions(['all']);
                        setRegionFilter('all');
                        setCorridorFilter('all');
                        setEventTypeFilter('all');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'all'
                          ? 'bg-indigo-950/80 border border-indigo-500/40 text-white font-bold'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🌐</span>
                        <div>
                          <div className="font-bold">Main Feed (All SA Highways)</div>
                          <div className="text-[10px] text-slate-400">Live verified multi-province freeway traffic</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 font-mono text-[10px]">
                        {mainFeedTotalCount}
                      </span>
                    </button>
                  </div>

                  {/* Category 2: 9 South African Provinces */}
                  <div className="p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">All 9 South African Provinces</div>

                    {/* Pretoria */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('pretoria');
                        setSelectedRegions(['Gauteng']);
                        setRegionFilter('Gauteng');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'pretoria' ? 'bg-amber-950/80 border border-amber-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🏛️</span>
                        <span>Pretoria & Tshwane (N1/N4/R21)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-300 font-mono text-[10px] border border-amber-500/30">
                        {cityCounts.pretoria}
                      </span>
                    </button>

                    {/* Johannesburg */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('johannesburg');
                        setSelectedRegions(['Gauteng']);
                        setRegionFilter('Gauteng');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'johannesburg' ? 'bg-cyan-950/80 border border-cyan-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🏙️</span>
                        <span>Johannesburg & Sandton (M1/M2/N3/N12)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-900/50 text-cyan-300 font-mono text-[10px] border border-cyan-500/30">
                        {cityCounts.johannesburg}
                      </span>
                    </button>

                    {/* KwaZulu-Natal */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('kzn');
                        setSelectedRegions(['KwaZulu-Natal']);
                        setRegionFilter('KwaZulu-Natal');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'kzn' ? 'bg-emerald-950/80 border border-emerald-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🌊</span>
                        <span>KwaZulu-Natal (Durban / PMB / N2 / N3)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 font-mono text-[10px] border border-emerald-500/30">
                        {cityCounts.kzn}
                      </span>
                    </button>

                    {/* Western Cape */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('wc');
                        setSelectedRegions(['Western Cape']);
                        setRegionFilter('Western Cape');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'wc' ? 'bg-blue-950/80 border border-blue-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>⛰️</span>
                        <span>Western Cape (Cape Town / N1 / N2 / M5)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 font-mono text-[10px] border border-blue-500/30">
                        {cityCounts.westernCape}
                      </span>
                    </button>

                    {/* Eastern Cape */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('ec');
                        setSelectedRegions(['Eastern Cape']);
                        setRegionFilter('Eastern Cape');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'ec' ? 'bg-rose-950/80 border border-rose-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🚗</span>
                        <span>Eastern Cape (Gqeberha / East London / N2)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-rose-900/50 text-rose-300 font-mono text-[10px] border border-rose-500/30">
                        {cityCounts.easternCape}
                      </span>
                    </button>

                    {/* Free State */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('fs');
                        setSelectedRegions(['Free State']);
                        setRegionFilter('Free State');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'fs' ? 'bg-orange-950/80 border border-orange-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🌾</span>
                        <span>Free State (Bloemfontein / N1 / N3)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-300 font-mono text-[10px] border border-orange-500/30">
                        {cityCounts.freeState}
                      </span>
                    </button>

                    {/* Mpumalanga */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('mp');
                        setSelectedRegions(['Mpumalanga']);
                        setRegionFilter('Mpumalanga');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'mp' ? 'bg-teal-950/80 border border-teal-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🦁</span>
                        <span>Mpumalanga (Mbombela / Witbank / N4)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-teal-900/50 text-teal-300 font-mono text-[10px] border border-teal-500/30">
                        {cityCounts.mpumalanga}
                      </span>
                    </button>

                    {/* Limpopo */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('lp');
                        setSelectedRegions(['Limpopo']);
                        setRegionFilter('Limpopo');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'lp' ? 'bg-green-950/80 border border-green-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🌳</span>
                        <span>Limpopo (Polokwane / N1 / R71)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-green-900/50 text-green-300 font-mono text-[10px] border border-green-500/30">
                        {cityCounts.limpopo}
                      </span>
                    </button>

                    {/* North West */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('nw');
                        setSelectedRegions(['North West']);
                        setRegionFilter('North West');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'nw' ? 'bg-yellow-950/80 border border-yellow-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>⛏️</span>
                        <span>North West (Rustenburg / Potchefstroom / N4)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-900/50 text-yellow-300 font-mono text-[10px] border border-yellow-500/30">
                        {cityCounts.northWest}
                      </span>
                    </button>

                    {/* Northern Cape */}
                    <button
                      type="button"
                      onClick={() => {
                        setCityFilter('nc');
                        setSelectedRegions(['Northern Cape']);
                        setRegionFilter('Northern Cape');
                        setIsNationwideDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition cursor-pointer ${
                        cityFilter === 'nc' ? 'bg-violet-950/80 border border-violet-500/40 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span>💎</span>
                        <span>Northern Cape (Kimberley / Upington / N12)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-violet-900/50 text-violet-300 font-mono text-[10px] border border-violet-500/30">
                        {cityCounts.northernCape}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Custom Location & Suburb Filter (Fast local in-memory filter, no external API scans) */}
          <form onSubmit={handleFilterCustomArea} className="lg:col-span-7 flex items-center space-x-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <input
                id="custom-area-filter-input"
                type="text"
                value={customAreaInput}
                onChange={e => setCustomAreaInput(e.target.value)}
                placeholder="Filter feed by town / suburb / route (e.g. Centurion, Ballito, Paarl, Midrand, N1...)"
                className="w-full pl-8 pr-3 py-2 bg-slate-950/90 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
              />
            </div>
            <button
              id="submit-custom-area-filter-btn"
              type="submit"
              disabled={!customAreaInput.trim()}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95 shrink-0 ${
                !customAreaInput.trim()
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-80'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/30'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-cyan-300" />
              <span>Filter Area</span>
            </button>
          </form>
        </div>

        {/* Bottom Row: Active Filter Badge & Reset Button (Shown when filtered) */}
        {cityFilter !== 'all' && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-cyan-400 font-semibold">Active Filter:</span>
              <span className="font-bold text-white">
                {cityFilter === 'pretoria' && '🏛️ Pretoria & Tshwane'}
                {cityFilter === 'johannesburg' && '🏙️ Johannesburg & Sandton'}
                {cityFilter === 'gauteng' && '⚡ Gauteng Province'}
                {cityFilter === 'kzn' && '🌊 KwaZulu-Natal'}
                {cityFilter === 'wc' && '⛰️ Western Cape'}
                {cityFilter === 'ec' && '🚗 Eastern Cape'}
                {cityFilter === 'fs' && '🌾 Free State'}
                {cityFilter === 'mp' && '🦁 Mpumalanga'}
                {cityFilter === 'lp' && '🌳 Limpopo'}
                {cityFilter === 'nw' && '⛏️ North West'}
                {cityFilter === 'nc' && '💎 Northern Cape'}
                {typeof cityFilter === 'string' && cityFilter.startsWith('custom:') && `📍 ${cityFilter.replace('custom:', '')}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCityFilter('all');
                setSelectedRegions(['all']);
                setRegionFilter('all');
                setCorridorFilter('all');
                setEventTypeFilter('all');
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1 cursor-pointer font-medium"
            >
              <span>Reset to Main Feed</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Bullet Points View Feature Announcement Notification */}
      <AnimatePresence>
        {showBulletViewNotice && viewMode !== 'bullets' && (
          <motion.div
            key="bullet-view-notification"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/70 border border-amber-500/50 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs relative overflow-hidden"
          >
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />

            <div className="flex items-start space-x-3 relative z-10">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-sm ring-1 ring-amber-400/20">
                <CircleDot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    New Feature: High-Density Bullet Points View
                  </span>
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wide shadow-sm flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5 inline text-slate-950" />
                    <span>NEW</span>
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
                  Streamlines alerts into single-line bullet rows showing the core incident update. Fits 15+ live updates on screen—tap any row to expand corridor details and instant actions.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0 relative z-10">
              <button
                type="button"
                onClick={handleSwitchToBulletViewFromNotice}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:from-amber-500 text-slate-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <CircleDot className="w-3.5 h-3.5 text-slate-950" />
                <span>Try Bullet View</span>
              </button>
              <button
                type="button"
                onClick={handleDismissBulletNotice}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal View Recommendation Notification (Shown on dense card view every second time up to 10 total views when bullet notice is dismissed) */}
      <AnimatePresence>
        {!showBulletViewNotice && showMinimalViewNotice && viewMode !== 'minimal' && viewMode !== 'bullets' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.24 }}
            className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-sky-950/80 border border-cyan-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-sm">
                <AlignLeft className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Switch to Minimal View for Faster Reading
                  </span>
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-black px-1.5 py-0.2 rounded uppercase tracking-wide">
                    Fast Digest
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Minimal View simplifies reports into a clean, high-contrast headline digest with instant update timestamps.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleSetViewMode('minimal')}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-300 text-slate-950 font-black rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <AlignLeft className="w-3.5 h-3.5 text-slate-950" />
                <span>Switch to Minimal View</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMinimalViewNotice(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* UNIFIED LIVE FEED: All Posts, Admin Dispatches, Crashes, Hazards & Highway Feeds */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        {/* Row 1: Mode Switcher (Incidents vs Travel Times), Location & Category Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 px-1 py-0.5">
          {/* Quick Switcher & Dropdowns Group */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Quick Switcher: Incidents vs Highway Travel Times */}
            <div className="flex items-center space-x-1 bg-[#050608] p-1 rounded-xl border border-slate-800 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFeedCategoryFilter('all')}
                className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  feedCategoryFilter !== 'traveltimes'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Incidents</span>
              </button>

              <button
                type="button"
                onClick={() => setFeedCategoryFilter('traveltimes')}
                className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  feedCategoryFilter === 'traveltimes'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40 font-black'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
                }`}
                title="SANRAL i-Traffic Highway Corridor Travel Times (Gauteng, KZN, WC)"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Travel Times</span>
                <span className="hidden sm:inline-block text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider">
                  Gauteng
                </span>
              </button>
            </div>

            {/* Region and Category Dropdowns - Side-by-side grid on mobile, flex on larger screens */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
              {/* 1. Location / Province Selection Dropdown */}
              <div className="relative w-full sm:w-auto" ref={regionDropdownRef}>
                <button
                  id="btn-feed-location-dropdown"
                  type="button"
                  onClick={() => {
                    setIsRegionDropdownOpen(prev => !prev);
                    setIsPostSelectionDropdownOpen(false);
                    setIsFontSizeDropdownOpen(false);
                    setIsViewModeDropdownOpen(false);
                  }}
                  className={`w-full sm:w-auto justify-between sm:justify-start bg-[#050608] hover:bg-slate-800 border px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shadow-sm active:scale-95 ${
                    !selectedRegions.includes('all') && selectedRegions.length > 0
                      ? 'text-cyan-300 border-cyan-500/60 bg-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                  }`}
                  title="Select Location / Province"
                  aria-label="Select Location / Province"
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[160px]">
                      {selectedRegions.includes('all') || selectedRegions.length === 0
                        ? 'All SA'
                        : selectedRegions.length === 1
                        ? `${SA_REGIONS[selectedRegions[0]]?.name || selectedRegions[0]}`
                        : `${selectedRegions.length} Prov`}
                    </span>
                    {isAutoLocationActive && (
                      <span className="hidden sm:inline-flex items-center space-x-1 text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full">
                        GPS
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 ml-auto sm:ml-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      !selectedRegions.includes('all')
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {selectedRegions.includes('all') || selectedRegions.length === 0
                        ? (regionCounts['all'] || mainFeedTotalCount)
                        : (regionCounts[selectedRegions[0]] || 0)}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Location Dropdown Menu */}
                {isRegionDropdownOpen && (
                  <div className="absolute left-0 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-[#0F1115]/98 border-2 border-cyan-500/60 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden animate-fadeIn divide-y divide-slate-800/80 backdrop-blur-xl max-h-96 overflow-y-auto">
                    {/* Header with GPS Auto-Detect Button */}
                    <div className="p-2 bg-[#07090E] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 uppercase tracking-wider px-1">
                        <span>Select Province / Region</span>
                        {(!selectedRegions.includes('all') || corridorFilter !== 'all' || cityFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleRegionSelection('all');
                              setCityFilter('all');
                              setCorridorFilter('all');
                            }}
                            className="text-slate-400 hover:text-white cursor-pointer lowercase text-[10px]"
                          >
                            reset
                          </button>
                        )}
                      </div>

                      {/* GPS Auto-Detect Button inside dropdown */}
                      <button
                        id="btn-dropdown-gps-detect"
                        type="button"
                        onClick={() => {
                          handleManualAutoDetect();
                          setIsRegionDropdownOpen(false);
                        }}
                        disabled={isDetectingRegion}
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                          isAutoLocationActive
                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Navigation className={`w-3.5 h-3.5 ${isAutoLocationActive ? 'text-emerald-400 fill-emerald-400/20' : 'text-cyan-400'}`} />
                          <span>{isDetectingRegion ? 'Detecting GPS...' : isAutoLocationActive ? `GPS: ${SA_REGIONS[detectedRegion || 'Gauteng']?.name || 'Active'}` : 'Auto-Detect My GPS Region'}</span>
                        </div>
                        {isAutoLocationActive && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full">
                            GPS Active
                          </span>
                        )}
                      </button>
                    </div>

                    {/* All SA (National) */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleToggleRegionSelection('all');
                          setCityFilter('all');
                          setIsRegionDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                          isRegionSelected('all') ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>🌐</span>
                          <div>
                            <div className="font-bold">All South Africa (National)</div>
                            <div className="text-[10px] text-slate-500 font-normal">All national corridors & provinces</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded-full">
                            {regionCounts['all'] || mainFeedTotalCount}
                          </span>
                          {isRegionSelected('all') && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                        </div>
                      </button>

                      {/* 9 Provinces */}
                      {SA_PROVINCES_LIST.map(p => {
                        const regInfo = SA_REGIONS[p];
                        const isSelected = isRegionSelected(p);
                        const count = regionCounts[p] || 0;
                        const emoji = 
                          p === 'Gauteng' ? '⚡' :
                          p === 'KwaZulu-Natal' ? '🌊' :
                          p === 'Western Cape' ? '⛰️' :
                          p === 'Eastern Cape' ? '🚗' :
                          p === 'Free State' ? '🌾' :
                          p === 'Mpumalanga' ? '🦁' :
                          p === 'Limpopo' ? '🌳' :
                          p === 'North West' ? '⛏️' :
                          p === 'Northern Cape' ? '💎' : '📍';

                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              handleToggleRegionSelection(p);
                              setCityFilter('all');
                              setIsRegionDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                              isSelected ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{emoji}</span>
                              <span>{regInfo?.name || p} ({regInfo?.shortCode || p})</span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                isSelected ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {count}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Corridor Filter Sub-options if a single province is selected */}
                    {corridorPills && corridorPills.length > 1 && (
                      <div className="p-2 bg-[#07090E]/90 border-t border-slate-800">
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                          <span>🛣️ Highway Corridors</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {corridorPills.map(c => {
                            const isCorridorActive = corridorFilter === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setCorridorFilter(c.id);
                                  setIsRegionDropdownOpen(false);
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                                  isCorridorActive
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {c.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Post Selection Category Dropdown */}
              {(() => {
                const POST_SELECTION_CATEGORIES = [
                  {
                    id: 'all' as const,
                    label: 'All',
                    icon: Globe,
                    iconColor: 'text-cyan-400',
                    description: 'Unified feed: Live highway incidents, corridor delays & patrol alerts'
                  },
                  {
                    id: 'crashes' as const,
                    label: 'Crashes',
                    icon: AlertOctagon,
                    iconColor: 'text-rose-400',
                    emoji: '💥',
                    description: 'Active vehicle collisions, rollovers & road closures'
                  },
                  {
                    id: 'spiking' as const,
                    label: 'Spiking & Hazards',
                    icon: AlertTriangle,
                    iconColor: 'text-orange-400',
                    emoji: '🚨',
                    description: 'Spike traps, crime danger hotspots & emergency hazards'
                  },
                  {
                    id: 'gbv' as const,
                    label: 'GBV Assist',
                    icon: HeartHandshake,
                    iconColor: 'text-purple-400',
                    emoji: '💜',
                    description: 'Confidential GBV and vulnerable motorist emergency assistance alerts'
                  },
                  {
                    id: 'itraffic' as const,
                    label: 'Highway Feeds',
                    icon: Activity,
                    iconColor: 'text-sky-400',
                    emoji: '🛣️',
                    description: 'Live highway feeds, stationary vehicles & corridor delays'
                  },
                  {
                    id: 'admin' as const,
                    label: 'Admin Broadcasts',
                    icon: Radio,
                    iconColor: 'text-amber-400',
                    emoji: '🛡️',
                    description: 'Official verified admin, dispatcher & patrol alerts'
                  },
                  {
                    id: 'community' as const,
                    label: 'Community Reports',
                    icon: Users,
                    iconColor: 'text-emerald-400',
                    emoji: '👥',
                    description: 'Verified reports from active motorists on the road'
                  },
                  {
                    id: 'potholes' as const,
                    label: 'Potholes',
                    icon: AlertCircle,
                    iconColor: 'text-purple-400',
                    emoji: '🕳️',
                    description: 'Severe road surface damage & rim-damaging potholes'
                  },
                  {
                    id: 'traveltimes' as const,
                    label: 'Travel Times',
                    icon: Clock,
                    iconColor: 'text-amber-400',
                    emoji: '⏱️',
                    description: 'Live SANRAL i-Traffic highway corridor travel times & speeds'
                  }
                ];

                const activePostCategory = POST_SELECTION_CATEGORIES.find(c => c.id === feedCategoryFilter) || POST_SELECTION_CATEGORIES[0];
                const ActiveIcon = activePostCategory.icon;

                return (
                  <div className="relative w-full sm:w-auto shrink min-w-0" ref={postSelectionDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPostSelectionDropdownOpen(prev => !prev);
                        setIsFontSizeDropdownOpen(false);
                        setIsViewModeDropdownOpen(false);
                        setIsRegionDropdownOpen(false);
                      }}
                      className={`w-full sm:w-auto justify-between sm:justify-start bg-[#050608] hover:bg-slate-800 border px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer shadow-sm active:scale-95 ${
                        feedCategoryFilter !== 'all'
                          ? 'text-cyan-300 border-cyan-500/60 bg-cyan-950/40 ring-1 ring-cyan-500/30'
                          : 'text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
                      }`}
                      title={`Filter feed: ${activePostCategory.label}`}
                      aria-label={`Select post category (Current: ${activePostCategory.label})`}
                    >
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {activePostCategory.emoji ? (
                          <span className="text-xs shrink-0">{activePostCategory.emoji}</span>
                        ) : (
                          <ActiveIcon className={`w-3.5 h-3.5 shrink-0 ${activePostCategory.iconColor}`} />
                        )}
                        <span className="truncate font-bold max-w-[80px] xs:max-w-[100px] sm:max-w-[140px]">
                          {activePostCategory.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-auto sm:ml-0">
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          feedCategoryFilter !== 'all'
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {categoryCounts[feedCategoryFilter] ?? 0}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isPostSelectionDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {isPostSelectionDropdownOpen && (
                      <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-[#0F1115]/98 border-2 border-cyan-500/60 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden animate-fadeIn divide-y divide-slate-800/80 backdrop-blur-xl">
                        <div className="px-3 py-2 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#07090E]">
                          <span>Filter by Post Type</span>
                          {feedCategoryFilter !== 'all' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('itraffic');
                                setFeedCategoryFilter('all');
                                setIsPostSelectionDropdownOpen(false);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 cursor-pointer capitalize font-semibold"
                            >
                              Show All ({categoryCounts.all ?? 0})
                            </button>
                          )}
                        </div>

                        <div className="py-1 max-h-80 overflow-y-auto">
                          {POST_SELECTION_CATEGORIES.map((cat) => {
                            const isSelected = feedCategoryFilter === cat.id;
                            const count = categoryCounts[cat.id] ?? 0;
                            const IconComp = cat.icon;

                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab('itraffic');
                                  setFeedCategoryFilter(cat.id);
                                  setIsPostSelectionDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 group ${
                                  isSelected ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                                }`}
                              >
                                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 border border-slate-800'
                                  }`}>
                                    {cat.emoji ? (
                                      <span className="text-xs">{cat.emoji}</span>
                                    ) : (
                                      <IconComp className={`w-3 h-3 ${cat.iconColor}`} />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-1.5">
                                      <span className={`font-bold ${isSelected ? 'text-cyan-300 font-black' : 'text-slate-200'}`}>
                                        {cat.label}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-normal truncate group-hover:text-slate-400">
                                      {cat.description}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                    isSelected
                                      ? 'bg-cyan-500 text-slate-950 font-black'
                                      : count > 0
                                      ? 'bg-slate-800 text-slate-300'
                                      : 'text-slate-600'
                                  }`}>
                                    {count}
                                  </span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Line 2: Size, View Mode, Sort, Fullscreen & Google Scans */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1.5 border-t border-slate-800/50 overflow-x-auto no-scrollbar scroll-smooth">
          {/* Tools: Size, View Mode, Sort, Fullscreen, Presence */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Font Size Selection Dropdown */}
            <div className="relative shrink-0" ref={fontSizeDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsFontSizeDropdownOpen(prev => !prev);
                  setIsPostSelectionDropdownOpen(false);
                  setIsRegionDropdownOpen(false);
                  setIsViewModeDropdownOpen(false);
                }}
                className="bg-[#050608] hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/40 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95"
                title="Select Feed Font Size"
                aria-label="Select Font Size"
              >
                <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="inline text-[11px]">
                  {feedFontSize === 'standard' ? 'Size' : feedFontSize === 'large' ? 'Large' : 'XL'}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFontSizeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFontSizeDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-52 max-w-[calc(100vw-2rem)] bg-[#0F1115]/98 border-2 border-amber-500/60 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden animate-fadeIn divide-y divide-slate-800/80 backdrop-blur-xl">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-[#07090E] flex items-center justify-between">
                    <span>Feed Text Size</span>
                    <span className="text-[9px] text-slate-500 font-mono">Live</span>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleSetFeedFontSize('standard');
                        setIsFontSizeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        feedFontSize === 'standard' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-black text-amber-400">A</span>
                        <span>Default (100%)</span>
                      </span>
                      {feedFontSize === 'standard' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSetFeedFontSize('large');
                        setIsFontSizeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        feedFontSize === 'large' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-sm font-mono font-black text-amber-400">A+</span>
                        <span>Large (+15%)</span>
                      </span>
                      {feedFontSize === 'large' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSetFeedFontSize('extra_large');
                        setIsFontSizeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        feedFontSize === 'extra_large' ? 'text-amber-400 bg-amber-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-base font-mono font-black text-amber-400">A++</span>
                        <span>Extra Large (+30%)</span>
                      </span>
                      {feedFontSize === 'extra_large' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Type Dropdown (Minimal, Condensed, Bullets, Cards) */}
            <div className="relative shrink-0" ref={viewModeDropdownRef}>
              <button
                type="button"
                onClick={() => {
                  setIsViewModeDropdownOpen(prev => !prev);
                  setIsPostSelectionDropdownOpen(false);
                  setIsFontSizeDropdownOpen(false);
                  setIsRegionDropdownOpen(false);
                }}
                className="bg-[#050608] hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-sm active:scale-95"
                title="Select Layout View Type"
                aria-label="Select Layout View"
              >
                {viewMode === 'minimal' && <AlignLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                {viewMode === 'condensed' && <List className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                {viewMode === 'bullets' && <CircleDot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                {viewMode === 'detailed' && <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                <span className="hidden sm:inline text-[11px]">
                  {viewMode === 'minimal' ? 'Minimal' : viewMode === 'condensed' ? 'List' : viewMode === 'bullets' ? 'Bullets' : 'Cards'}
                </span>
                {showBulletViewNotice && viewMode !== 'bullets' && (
                  <span className="hidden sm:inline-block bg-amber-400 text-slate-950 text-[8px] font-black px-1 py-0.2 rounded uppercase tracking-wider animate-pulse shadow-sm">
                    NEW
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isViewModeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isViewModeDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-48 max-w-[calc(100vw-2rem)] bg-[#0F1115]/98 border-2 border-cyan-500/60 rounded-2xl shadow-2xl z-50 py-1 overflow-hidden animate-fadeIn divide-y divide-slate-800/80 backdrop-blur-xl">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-[#07090E]">
                    View Layout
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleSetViewMode('minimal');
                        setIsViewModeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        viewMode === 'minimal' ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <AlignLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Minimal</span>
                      </span>
                      {viewMode === 'minimal' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSetViewMode('condensed');
                        setIsViewModeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        viewMode === 'condensed' ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <List className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Condensed</span>
                      </span>
                      {viewMode === 'condensed' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSetViewMode('bullets');
                        setIsViewModeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        viewMode === 'bullets' ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <CircleDot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Bullet Points</span>
                        <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded uppercase tracking-wide shadow-sm">
                          NEW
                        </span>
                      </span>
                      {viewMode === 'bullets' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSetViewMode('detailed');
                        setIsViewModeDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer hover:bg-slate-800/70 ${
                        viewMode === 'detailed' ? 'text-cyan-300 bg-cyan-500/10' : 'text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2">
                        <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Cards</span>
                      </span>
                      {viewMode === 'detailed' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Order Toggle */}
            <button
              type="button"
              onClick={toggleSortOrder}
              className="bg-[#050608] hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 p-1.5 rounded-lg transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center shrink-0"
              title={`Sort: ${sortOrder === 'newest' ? 'Newest First' : 'Oldest First'} (Click to toggle)`}
              aria-label={`Sort: ${sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Full Screen Feed Mode Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-1.5 rounded-lg transition flex items-center justify-center cursor-pointer active:scale-95 shrink-0 border ${
                isFullscreen
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                  : 'bg-[#050608] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-slate-800 hover:border-amber-500/40'
              }`}
              title={isFullscreen ? "Exit Full Screen (ESC)" : "Make Feed Full Screen"}
              aria-label="Full Screen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Live Feed Connections & Presence (24h) Inspector Toggle */}
            <button
              type="button"
              onClick={() => setIsPresenceInspectorOpen(true)}
              className="bg-[#050608] hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-emerald-500/40 p-1.5 rounded-lg transition cursor-pointer shadow-sm active:scale-95 flex items-center justify-center shrink-0"
              title="View all users who connected in the last 24 hours & real-time presence"
              aria-label="Live Feed Connections & Presence (24h)"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>

          {/* Highway Travel Times View vs Incidents Feed Cards Grid */}
          {feedCategoryFilter === 'traveltimes' ? (
            <HighwayTravelTimesSection
              initialRegion={selectedRegions[0] && selectedRegions[0] !== 'all' ? selectedRegions[0] : 'Gauteng'}
              onNavigateToFeed={() => setFeedCategoryFilter('all')}
            />
          ) : isLoadingFeed ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-[#0F1115] border border-slate-800 rounded-2xl">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              Loading real-time highway corridor incidents...
            </div>
          ) : filteredITrafficItems.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs bg-[#0F1115] border border-slate-800 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-white text-sm">No active incidents match your current filter.</p>
              <p className="text-slate-500">Try choosing a different highway corridor or clearing the search query.</p>
              <button
                onClick={() => {
                  setRegionFilter('all');
                  saveSelectedRegion('all');
                  setCorridorFilter('all');
                  setEventTypeFilter('all');
                  setSearchQuery('');
                  setDispatchFilter('all');
                }}
                className="bg-[#050608] hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'minimal' ? (
            /* ========================================================= */
            /* MINIMAL VIEW: Clean & Simple Main + Sub text + Updated Date*/
            /* ========================================================= */
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredITrafficItems.flatMap((item, index) => {
                  const updatedDateStr = item.lastUpdated
                    ? formatReadableDateTime(item.lastUpdated)
                    : item.startTime
                    ? formatReadableDateTime(item.startTime)
                    : formatReadableDateTime(item.timestamp);

                  const itemReg = resolveItemRegion(item);
                  const regInfo = SA_REGIONS[itemReg] || SA_REGIONS['gauteng'];
                  const isGbv = item.category === 'gbv' || item.category === 'gbv_assist' || item.eventSubType?.toLowerCase().includes('gbv') || item.content?.toLowerCase().includes('gbv') || item.author?.toLowerCase().includes('gbv');
                  const isCrash = !isGbv && (item.category === 'crash' || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident'));
                  const isSpiking = !isGbv && (item.category === 'spiking' || item.eventSubType?.toLowerCase().includes('spiking'));

                  const isNew = newlyAddedItemIds.has(item.id);
                  const isUserPost = !isGbv && (Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user');
                  const elements = [
                    <motion.div
                      key={item.id}
                      id={`feed-item-${item.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className={`space-y-2.5 ${isNew ? 'animate-feed-fade-in' : ''}`}
                    >
                      <div className={`border rounded-xl p-3.5 sm:p-4 shadow-sm transition-all duration-500 space-y-1.5 ${
                        isNew
                          ? 'animate-new-feed-highlight'
                          : highlightedItemId === item.id
                          ? 'ring-2 ring-amber-400 shadow-2xl shadow-amber-500/30 border-amber-400 bg-gradient-to-r from-amber-950/60 via-[#14120D] to-[#0F1115]'
                          : item.highlightGold
                          ? 'ring-2 ring-amber-400 border-amber-400 bg-[#14120D] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : isGbv
                          ? 'border-2 border-purple-500/80 ring-2 ring-purple-500/40 shadow-xl shadow-purple-950/40 bg-gradient-to-r from-purple-950/40 via-[#120B1A] to-[#0F1115]'
                          : isUserPost
                          ? 'border-2 border-orange-500 ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/40 bg-[#0F1115]'
                          : 'bg-[#0F1115] border-slate-800/80 hover:border-slate-700/80'
                      }`}>
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {isNew && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow mr-1">
                              <span>✦ NEW</span>
                            </span>
                          )}
                          {highlightedItemId === item.id && (
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow mr-1">
                              <span>★ TARGETED ALERT</span>
                            </span>
                          )}
                          {item.highlightGold && (
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow mr-1 ring-1 ring-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
                              <span>🟡 HIGHLIGHTED</span>
                            </span>
                          )}
                          {item.broadcastTopRed && (
                            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow mr-1 animate-pulse">
                              <span>🔴 BROADCAST</span>
                            </span>
                          )}
                          {isGbv ? (
                            <>
                              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/60 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse">
                                <HeartHandshake className="w-2.5 h-2.5 text-purple-400" />
                                <span>💜 GBV Assist</span>
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-purple-500/40 bg-purple-500/20 text-purple-300 flex items-center space-x-1">
                                <ShieldCheck className="w-2.5 h-2.5 text-purple-400" />
                                <span>Priority Assistance</span>
                              </span>
                              <span className="bg-slate-800 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                <span>Alert Time: {formatSATime(item.timestamp || item.startTime || item.lastUpdated) || updatedDateStr}</span>
                              </span>
                              <span className="text-purple-300/90 bg-purple-950/70 px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm">
                                <Eye className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                              </span>
                              {item.location && (
                                <div className="w-full mt-1">
                                  <h4 className={`${fontStyles.minimalTitle} font-bold text-white leading-snug tracking-tight`}>
                                    📍 {item.location}
                                  </h4>
                                </div>
                              )}
                            </>
                          ) : isItemAdminPost(item) && !isUserPost ? (
                            <>
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                                <span>🛡️ Admin post</span>
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center space-x-1 ${
                                isCrash
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : isSpiking
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}>
                                {isCrash && <AlertOctagon className="w-2.5 h-2.5 text-rose-400" />}
                                <span>{item.eventSubType || (isCrash ? 'Crash Alert' : isSpiking ? 'Spiking Alert' : item.category === 'pothole' ? 'Pothole Alert' : 'Traffic Alert')}</span>
                              </span>
                              <span className="bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>Alert Time: {formatSATime(item.timestamp || item.startTime || item.lastUpdated) || updatedDateStr}</span>
                              </span>
                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this live feed alert">
                                <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                              </span>
                              <span className="text-emerald-400/90 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Updated: ${updatedDateStr}`}>
                                <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                <span>{updatedDateStr}</span>
                              </span>
                              {item.location && (
                                <div className="w-full mt-1">
                                  <h4 className={`${fontStyles.minimalTitle} font-bold text-white leading-snug tracking-tight`}>
                                    📍 {item.location}
                                  </h4>
                                </div>
                              )}
                            </>
                          ) : isUserPost ? (
                            <>
                              {checkIsAdminVerified(item) ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm shrink-0">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  <span>🛡️ Admin Verified</span>
                                </span>
                              ) : (
                                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/60 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm shrink-0">
                                  <AlertTriangle className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                                  <span>⚠️ Not Verified • User Post</span>
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center space-x-1 ${
                                isCrash
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : isSpiking
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}>
                                {isCrash && <AlertOctagon className="w-2.5 h-2.5 text-rose-400" />}
                                <span>{item.eventSubType || (isCrash ? 'Crash Alert' : isSpiking ? 'Spiking Alert' : item.category === 'pothole' ? 'Pothole Alert' : 'Traffic Alert')}</span>
                              </span>
                              {(item.postedByUserName || item.author || item.postedByUserSurname) && (
                                <span className="bg-slate-800 text-orange-300 border border-orange-500/40 px-1.5 py-0.5 rounded text-[9px] font-semibold flex items-center space-x-1 shrink-0">
                                  <span>👤</span>
                                  <span>{getUserPostDisplayName(item)}</span>
                                </span>
                              )}
                              <span className="bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>Alert Time: {formatSATime(item.timestamp || item.startTime || item.lastUpdated) || updatedDateStr}</span>
                              </span>
                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this live feed alert">
                                <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                              </span>
                              <span className="text-emerald-400/90 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Updated: ${updatedDateStr}`}>
                                <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                <span>{updatedDateStr}</span>
                              </span>
                              {item.location && (
                                <div className="w-full mt-1">
                                  <h4 className={`${fontStyles.minimalTitle} font-bold text-white leading-snug tracking-tight`}>
                                    📍 {item.location}
                                  </h4>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                                {regInfo.shortCode}
                              </span>
                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this live feed alert">
                                <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                              </span>
                              <span className="text-emerald-400/90 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Updated: ${updatedDateStr}`}>
                                <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                <span>{updatedDateStr}</span>
                              </span>
                              <div className="w-full mt-1">
                                <h4 className={`${fontStyles.minimalTitle} font-bold text-white leading-snug tracking-tight`}>
                                  {item.location || item.roadwayName || `${regInfo.shortCode} Highway Corridor`}
                                </h4>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Prominent Admin Verified or User Post Banner in Minimal View */}
                        {isUserPost && renderUserPostBanner(item, 'standard')}

                        {/* Sub Text */}
                        <p className={`${fontStyles.minimalBody}`}>
                          {cleanTrafficText(item.content)}
                        </p>

                        {/* Attached Media Image if present */}
                        {(() => {
                          const img = getItemMediaImage(item);
                          return img ? (
                            <IncidentImagePreview
                              imageUrl={img}
                              title={item.location || item.roadwayName || 'Incident Photo'}
                              location={item.location}
                              description={item.content}
                              timestamp={item.timestamp || item.startTime || item.lastUpdated}
                              category={item.category || item.eventSubType}
                              variant="expanded-banner"
                              onOpenLightbox={setLightboxData}
                            />
                          ) : null;
                        })()}

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 w-full min-w-0 pt-1.5 border-t border-slate-800/60">
                          {/* Line 1 on mobile: Verify & Status */}
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            {/* Motorist & Admin Incident Verification */}
                            {(() => {
                              const isPostAdminVerified = checkIsAdminVerified(item);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyIncident(item)}
                                  disabled={isVerifyingItemId === item.id || (isUserAdmin ? isPostAdminVerified : !!verifiedItemIds[item.id])}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer ${
                                    isPostAdminVerified
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                      : verifiedItemIds[item.id]
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black'
                                      : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 border border-amber-500/30'
                                  }`}
                                  title={
                                    isPostAdminVerified
                                      ? "Officially verified by Admin"
                                      : isUserAdmin
                                      ? "Verify incident as Patrol Admin"
                                      : verifiedItemIds[item.id]
                                      ? "You verified this incident"
                                      : "Verify incident as motorist"
                                  }
                                >
                                  {isPostAdminVerified ? (
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <ThumbsUp className={`w-3 h-3 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                                  )}
                                  <span>
                                    {isPostAdminVerified
                                      ? '✓ Admin Verified'
                                      : isUserAdmin
                                      ? '🛡️ Verify as Admin'
                                      : verifiedItemIds[item.id]
                                      ? 'Verified'
                                      : 'Verify'}
                                  </span>
                                  {((item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)) > 0 && (
                                    <span className="font-mono text-[9px] bg-slate-900 px-1 rounded">
                                      {(item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            {/* Status Dropdown Button (Still Active or Cleared) */}
                            {renderStatusButton(item, 'sm')}
                          </div>

                          {/* Line 2 on mobile: Rest of the icons */}
                          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 min-w-0">
                            {/* Post to WhatsApp */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRecordView(item.id);
                                handlePostToWhatsApp(item);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer ${
                                copiedItemIds[item.id]
                                  ? 'bg-[#25D366] text-slate-950 font-black'
                                  : 'text-slate-300 hover:text-white hover:bg-[#25D366]/20'
                              }`}
                              title="Post to WhatsApp"
                            >
                              {copiedItemIds[item.id] ? (
                                <>
                                  <Check className="w-3 h-3 text-slate-950" />
                                  <span>Opening...</span>
                                </>
                              ) : (
                                <>
                                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </>
                              )}
                            </button>

                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-cyan-300 p-1 rounded shrink-0 transition"
                                title="Open Live Corridor Source"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            {onOpenShareToX && (
                              <button
                                type="button"
                                onClick={() => onOpenShareToX({ feedItem: item })}
                                className="text-slate-400 hover:text-white p-1 rounded shrink-0 transition cursor-pointer"
                                title="Share to X"
                              >
                                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                              </button>
                            )}

                            {/* Admin Controls in Minimal View */}
                            {isUserAdmin && (
                              <button
                                type="button"
                                onClick={() => setEditingFeedItem(item)}
                                className="text-cyan-400 hover:text-cyan-300 p-1 rounded shrink-0 transition cursor-pointer"
                                title="Edit post info & fix typos (Admin)"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Delete Button: Disabled for motorists, enabled for admin or author */}
                            {(() => {
                              const canDelete = canUserDeleteFeedItem(item);
                              if (confirmingDeleteId === item.id) {
                                return (
                                  <div className="flex items-center space-x-1 shrink-0 animate-fadeIn">
                                    <button
                                      type="button"
                                      disabled={!canDelete}
                                      onClick={() => handleDeleteFeedItem(item.id)}
                                      className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer shadow"
                                    >
                                      <span>Delete?</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmingDeleteId(null)}
                                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-0.5 rounded text-[9px] transition cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <button
                                  type="button"
                                  disabled={!canDelete}
                                  onClick={() => {
                                    if (canDelete) setConfirmingDeleteId(item.id);
                                  }}
                                  className={`p-1 rounded shrink-0 transition ${
                                    canDelete
                                      ? 'text-slate-500 hover:text-rose-400 cursor-pointer'
                                      : 'text-slate-600 cursor-not-allowed opacity-40'
                                  }`}
                                  title={canDelete ? "Delete/Dismiss post" : "Delete disabled: Only administrators or the original composer can delete this post"}
                                  aria-label={canDelete ? "Delete/Dismiss post" : "Delete disabled"}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredITrafficItems.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div
                        key="techrix-feed-card-itraffic-minimal"
                        layout="position"
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <TechrixFeedAdCard variant="minimal" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredITrafficItems.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-itraffic-minimal"
                        layout="position"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                      >
                        <ShareAppFeedCard variant="minimal" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, false);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          ) : viewMode === 'condensed' ? (
            /* ========================================================= */
            /* CONDENSED VIEW: High Density List to see more at once     */
            /* ========================================================= */
            <div className="space-y-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredITrafficItems.flatMap((item, index) => {
                  const isGbv = item.category === 'gbv' || item.category === 'gbv_assist' || item.eventSubType?.toLowerCase().includes('gbv') || item.content?.toLowerCase().includes('gbv') || item.author?.toLowerCase().includes('gbv');
                  const isCrash = !isGbv && (item.category === 'crash' || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident'));
                  const isRoadworks = !isGbv && (item.category === 'roadworks' || item.eventSubType?.toLowerCase().includes('roadwork'));
                  const isStationary = !isGbv && (item.category === 'stationary' || item.eventSubType?.toLowerCase().includes('stationary'));
                  const isUserPost = !isGbv && (Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user');
                  const isExpanded = !!expandedItemIds[item.id];

                  let rowBorder = 'border-slate-800 hover:border-slate-700 bg-[#0F1115]';
                  let badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                  let typeIcon = <Activity className="w-3 h-3 text-cyan-400" />;

                  if (isGbv) {
                    rowBorder = 'border-2 border-purple-500/80 ring-2 ring-purple-500/40 shadow-xl shadow-purple-950/40 bg-gradient-to-r from-purple-950/40 via-[#120B1A] to-[#0F1115]';
                    badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                    typeIcon = <HeartHandshake className="w-3 h-3 text-purple-400" />;
                  } else if (isUserPost) {
                    rowBorder = 'border-2 border-orange-500 ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/40 bg-[#0F1115]';
                    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
                    typeIcon = <AlertTriangle className="w-3 h-3 text-orange-400" />;
                  } else if (isCrash) {
                    rowBorder = 'border-rose-500/40 hover:border-rose-500/70 bg-gradient-to-r from-[#160E12] via-[#0F1115] to-[#0F1115]';
                    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    typeIcon = <AlertOctagon className="w-3 h-3 text-rose-400" />;
                  } else if (isRoadworks) {
                    rowBorder = 'border-amber-500/40 hover:border-amber-500/70 bg-gradient-to-r from-[#16130D] via-[#0F1115] to-[#0F1115]';
                    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    typeIcon = <Construction className="w-3 h-3 text-amber-400" />;
                  } else if (isStationary) {
                    rowBorder = 'border-orange-500/30 hover:border-orange-500/60 bg-[#0F1115]';
                    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                    typeIcon = <AlertTriangle className="w-3 h-3 text-orange-400" />;
                  }

                  const isNew = newlyAddedItemIds.has(item.id);
                  const elements = [
                    <motion.div
                      key={item.id}
                      id={`feed-item-${item.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className={`border rounded-xl p-2.5 sm:px-3 sm:py-2.5 shadow-md transition-all duration-500 relative ${rowBorder} ${
                        isNew ? 'animate-new-feed-highlight' : ''
                      } ${
                        highlightedItemId === item.id
                          ? 'ring-2 ring-amber-400 shadow-2xl shadow-amber-500/30 border-amber-400 bg-gradient-to-r from-amber-950/60 via-[#14120D] to-[#0F1115]'
                          : item.highlightGold
                          ? 'ring-2 ring-amber-400 border-amber-400 bg-[#14120D] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : ''
                      }`}
                    >
                    {/* Primary Compact Card */}
                    <div className="space-y-2">
                      {/* Top Row: Badges, View Count, Timestamp & Media Thumbnail */}
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        {/* Badges and Meta Information */}
                        <div className="flex-1 min-w-0 flex items-center flex-wrap gap-1.5">
                          {isNew && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow">
                              <span>✦ NEW</span>
                            </span>
                          )}
                          {highlightedItemId === item.id && (
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow">
                              <span>★ TARGETED ALERT</span>
                            </span>
                          )}
                          {item.highlightGold && (
                            <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow ring-1 ring-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
                              <span>🟡 HIGHLIGHTED</span>
                            </span>
                          )}
                          {item.broadcastTopRed && (
                            <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow animate-pulse">
                              <span>🔴 BROADCAST</span>
                            </span>
                          )}
                          {item.source === 'admin_dispatch' ? (
                            <>
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide shrink-0">
                                🛡️ Admin post
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center space-x-1 shrink-0 ${badgeBg}`}>
                                {typeIcon}
                                <span>{item.eventSubType || (isCrash ? 'Crash Alert' : item.category === 'spiking' ? 'Spiking Alert' : item.category === 'pothole' ? 'Pothole Alert' : 'Traffic Report')}</span>
                              </span>
                              <span className="bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono flex items-center space-x-1 shrink-0">
                                <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>Alert Time: {formatSATime(item.timestamp || item.startTime || item.lastUpdated) || formatReadableDateTime(item.timestamp)}</span>
                              </span>
                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this feed alert">
                                <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))}</span>
                              </span>
                              {item.lastUpdated ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Updated: ${item.lastUpdated}`}>
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatReadableDateTime(item.lastUpdated)}</span>
                                </span>
                              ) : item.startTime ? (
                                <span className="text-cyan-400 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Started: ${item.startTime}`}>
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatReadableDateTime(item.startTime)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center space-x-1 text-[10px] font-mono shrink-0">
                                  <Clock className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                                  <span>{formatReadableDateTime(item.timestamp)}</span>
                                </span>
                              )}
                              {item.location && (
                                <span className={`font-bold text-amber-300 ${fontStyles.condensedTitle} truncate max-w-[180px] xs:max-w-[220px] sm:max-w-md`} title={item.location}>
                                  📍 {item.location}
                                </span>
                              )}
                            </>
                          ) : isUserPost ? (
                            <>
                              {checkIsAdminVerified(item) ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide flex items-center space-x-1 shrink-0 shadow-sm">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                                  <span>🛡️ Admin Verified</span>
                                </span>
                              ) : (
                                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/60 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide flex items-center space-x-1 shrink-0 shadow-sm">
                                  <AlertTriangle className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                                  <span>⚠️ Not Verified • User Post</span>
                                </span>
                              )}
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center space-x-1 shrink-0 ${badgeBg}`}>
                                {typeIcon}
                                <span>{item.eventSubType || (isCrash ? 'Crash Alert' : item.category === 'spiking' ? 'Spiking Alert' : item.category === 'pothole' ? 'Pothole Alert' : 'Traffic Report')}</span>
                              </span>
                              {(item.postedByUserName || item.author || item.postedByUserSurname) && (
                                <span className="bg-slate-800 text-orange-300 border border-orange-500/40 px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 flex items-center space-x-1 truncate max-w-[140px]" title={getUserPostDisplayName(item)}>
                                  <span>👤</span>
                                  <span className="truncate">{getUserPostDisplayName(item)}</span>
                                </span>
                              )}
                              <span className="bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono flex items-center space-x-1 shrink-0">
                                <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                <span>Alert Time: {formatSATime(item.timestamp || item.startTime || item.lastUpdated) || formatReadableDateTime(item.timestamp)}</span>
                              </span>
                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this feed alert">
                                <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))}</span>
                              </span>
                              {item.lastUpdated ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Updated: ${item.lastUpdated}`}>
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatReadableDateTime(item.lastUpdated)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center space-x-1 text-[10px] font-mono shrink-0">
                                  <Clock className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                                  <span>{formatReadableDateTime(item.timestamp)}</span>
                                </span>
                              )}
                              {item.location && (
                                <span className={`font-bold text-amber-300 ${fontStyles.condensedTitle} truncate max-w-[180px] xs:max-w-[220px] sm:max-w-md`} title={item.location}>
                                  📍 {item.location}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {(() => {
                                const itemReg = resolveItemRegion(item);
                                const regInfo = SA_REGIONS[itemReg] || SA_REGIONS['gauteng'];
                                const roadwayTitle = item.roadwayName || `${regInfo.shortCode} Corridor`;
                                return (
                                  <>
                                    <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide shrink-0">
                                      {regInfo.shortCode}
                                    </span>
                                    <span 
                                      className="bg-sky-950 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide truncate max-w-[160px] xs:max-w-[200px] sm:max-w-xs inline-block align-middle"
                                      title={roadwayTitle}
                                    >
                                      {roadwayTitle}
                                    </span>
                                  </>
                                );
                              })()}

                              {item.direction && (
                                <span className="bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 truncate max-w-[100px]">
                                  {item.direction}
                                </span>
                              )}

                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center space-x-1 shrink-0 ${badgeBg}`}>
                                {typeIcon}
                                <span>{item.eventSubType || item.category || 'Incident'}</span>
                              </span>

                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this feed alert">
                                <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                                <span>{formatViewsShort(getItemViews(item, liveViewsMap))}</span>
                              </span>

                              {item.lastUpdated ? (
                                <span className="text-emerald-400 font-bold bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Updated: ${item.lastUpdated}`}>
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatReadableDateTime(item.lastUpdated)}</span>
                                </span>
                              ) : item.startTime ? (
                                <span className="text-cyan-400 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-mono shrink-0" title={`Started: ${item.startTime}`}>
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{formatReadableDateTime(item.startTime)}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center space-x-1 text-[10px] font-mono shrink-0">
                                  <Clock className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                                  <span>{formatReadableDateTime(item.timestamp)}</span>
                                </span>
                              )}

                              {item.location && (
                                <span className={`font-bold text-amber-300 ${fontStyles.condensedTitle} truncate max-w-[180px] xs:max-w-[220px] sm:max-w-md`} title={item.location}>
                                  📍 {item.location}
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        {/* Small Photo Thumbnail (Click to open Lightbox directly) */}
                        {(() => {
                          const img = getItemMediaImage(item);
                          return img ? (
                            <div className="shrink-0 self-start">
                              <IncidentImagePreview
                                imageUrl={img}
                                title={item.location || item.roadwayName || 'Incident Photo'}
                                location={item.location}
                                description={item.content}
                                timestamp={item.timestamp || item.startTime || item.lastUpdated}
                                category={item.category || item.eventSubType}
                                variant="row-thumb"
                                onOpenLightbox={setLightboxData}
                              />
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Prominent Admin Verified or User Post Banner in Condensed View */}
                      {isUserPost && renderUserPostBanner(item, 'standard')}

                      {/* Content text snippet - Fully visible with clean typography across all screens */}
                      <p className={`${fontStyles.condensedBody} break-words whitespace-pre-line text-slate-100 text-xs sm:text-[13px] leading-relaxed font-normal`}>
                        {cleanTrafficText(item.content)}
                      </p>

                      {/* Bottom Action Menu */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 w-full min-w-0 border-t border-slate-800/80 pt-1.5">
                        {/* Line 1 on mobile: Verify & Status */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Motorist & Admin Incident Verification */}
                          {(() => {
                            const isPostAdminVerified = checkIsAdminVerified(item);
                            return (
                              <button
                                type="button"
                                onClick={() => handleVerifyIncident(item)}
                                disabled={isVerifyingItemId === item.id || (isUserAdmin ? isPostAdminVerified : !!verifiedItemIds[item.id])}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-sm ${
                                  isPostAdminVerified
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                    : verifiedItemIds[item.id]
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                    : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40'
                                }`}
                                title={
                                  isPostAdminVerified
                                    ? "Officially verified by Admin"
                                    : isUserAdmin
                                    ? "Verify incident as Patrol Admin"
                                    : verifiedItemIds[item.id]
                                    ? "You verified this incident"
                                    : "Verify incident as motorist on scene"
                                }
                              >
                                {isPostAdminVerified ? (
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <ThumbsUp className={`w-3 h-3 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                                )}
                                <span>
                                  {isPostAdminVerified
                                    ? '✓ Admin Verified'
                                    : isUserAdmin
                                    ? '🛡️ Verify as Admin'
                                    : verifiedItemIds[item.id]
                                    ? '✓ Verified'
                                    : 'Verify'}
                                </span>
                                {((item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)) > 0 && (
                                  <span className="font-mono text-[9px] bg-slate-900 px-1 rounded">
                                    {(item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)}
                                  </span>
                                )}
                              </button>
                            );
                          })()}

                          {/* Status Dropdown Button (Still Active or Cleared) */}
                          {renderStatusButton(item, 'sm')}
                        </div>

                        {/* Line 2 on mobile: Rest of the icons under it */}
                        <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 min-w-0">
                          {/* Post to WhatsApp */}
                          <button
                            type="button"
                            onClick={() => {
                              handleRecordView(item.id);
                              handlePostToWhatsApp(item);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-sm ${
                              copiedItemIds[item.id]
                                ? 'bg-[#25D366] text-slate-950 font-black'
                                : 'bg-[#071910] hover:bg-[#0c291b] text-emerald-300 hover:text-white'
                            }`}
                            title="Post to WhatsApp"
                          >
                            {copiedItemIds[item.id] ? (
                              <>
                                <Check className="w-3 h-3 text-slate-950" />
                                <span>Opening...</span>
                              </>
                            ) : (
                              <>
                                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                                <span className="hidden xs:inline">WhatsApp</span>
                              </>
                            )}
                          </button>

                          {/* WhatsApp Custom Modal */}
                          {onOpenShareToWhatsApp && (
                            <button
                              type="button"
                              onClick={() => onOpenShareToWhatsApp({ feedItem: item })}
                              className="bg-[#050608] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 p-1.5 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                              title="Customize & Share to WhatsApp"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-400" />
                            </button>
                          )}

                          {/* Official Corridor Source Link */}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 p-1.5 rounded-lg text-[10px] font-bold flex items-center shrink-0 transition"
                              title="Open Live Corridor Source"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}

                          {onOpenShareToX && (
                            <button
                              type="button"
                              onClick={() => onOpenShareToX({ feedItem: item })}
                              className="bg-[#050608] hover:bg-black text-slate-300 hover:text-white border border-slate-700/80 p-1.5 rounded-lg text-[10px] font-bold flex items-center shrink-0 transition cursor-pointer"
                              title="Share to X"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            </button>
                          )}

                          {/* Expand / Collapse Details Drawer */}
                          <button
                            type="button"
                            onClick={() => toggleExpandItem(item.id)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center shrink-0 transition cursor-pointer border ${
                              isExpanded
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-[#050608] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                            title={isExpanded ? 'Collapse Details' : 'Expand GPS, Times & #Tags'}
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180 text-cyan-300' : ''}`} />
                          </button>

                          {/* Admin Edit Button */}
                          {isUserAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingFeedItem(item)}
                              className="bg-[#050608] hover:bg-cyan-950/60 text-cyan-400 border border-slate-700/80 hover:border-cyan-500/40 p-1.5 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                              title="Edit post info, fix typos (Admin)"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}

                          {/* Dismiss / Delete Button: Disabled for motorists, enabled for admin or author */}
                          {(() => {
                            const canDelete = canUserDeleteFeedItem(item);
                            if (confirmingDeleteId === item.id) {
                              return (
                                <div className="flex items-center space-x-1 shrink-0 animate-fadeIn">
                                  <button
                                    type="button"
                                    disabled={!canDelete}
                                    onClick={() => handleDeleteFeedItem(item.id)}
                                    className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black px-1.5 py-1 rounded-lg text-[9px] flex items-center space-x-0.5 transition cursor-pointer shadow"
                                  >
                                    <span>Dismiss?</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingDeleteId(null)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-lg text-[9px] font-bold transition cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                disabled={!canDelete}
                                onClick={() => {
                                  if (canDelete) setConfirmingDeleteId(item.id);
                                }}
                                className={`p-1 rounded-lg text-[10px] shrink-0 transition ${
                                  canDelete
                                    ? 'text-slate-500 hover:text-rose-400 cursor-pointer'
                                    : 'text-slate-600 cursor-not-allowed opacity-40'
                                }`}
                                title={canDelete ? "Dismiss incident" : "Delete disabled: Only administrators or the original composer can delete this post"}
                                aria-label={canDelete ? "Dismiss incident" : "Delete disabled"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details Drawer */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-2 animate-fadeIn text-xs">
                        <p className="text-xs text-slate-200 leading-relaxed font-normal bg-[#050608]/80 p-2 rounded-lg border border-slate-800">
                          {cleanTrafficText(item.content)}
                        </p>

                        {(() => {
                          const img = getItemMediaImage(item);
                          return img ? (
                            <IncidentImagePreview
                              imageUrl={img}
                              title={item.location || item.roadwayName || 'Incident Photo'}
                              location={item.location}
                              description={item.content}
                              timestamp={item.timestamp || item.startTime || item.lastUpdated}
                              category={item.category || item.eventSubType}
                              variant="expanded-banner"
                              onOpenLightbox={setLightboxData}
                            />
                          ) : null;
                        })()}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-400 bg-[#050608]/60 p-2 rounded-lg border border-slate-800/60 font-mono">
                          {item.lastUpdated && (
                            <div className="flex items-center space-x-1 text-emerald-400">
                              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">Updated: {item.lastUpdated}</span>
                            </div>
                          )}
                          {item.startTime && (
                            <div className="flex items-center space-x-1 text-slate-300">
                              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span className="truncate">Start: {item.startTime}</span>
                            </div>
                          )}
                          {item.endTime && (
                            <div className="flex items-center space-x-1 text-slate-300">
                              <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                              <span className="truncate">End: {item.endTime}</span>
                            </div>
                          )}
                          {item.latitude !== undefined && item.longitude !== undefined && (
                            <div className="flex items-center space-x-1 text-cyan-400 col-span-full">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                            </div>
                          )}
                        </div>

                        {/* Dynamic Extracted #Tags */}
                        {(() => {
                          const tags = generateITrafficHashtags(item);
                          return (
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[10px] font-bold text-amber-400/90 flex items-center space-x-1 mr-0.5">
                                <Hash className="w-3 h-3 text-amber-400" />
                                <span>Tags:</span>
                              </span>
                              {tags.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => {
                                    const clean = tag.replace(/^#/, '');
                                    setSearchQuery(clean);
                                  }}
                                  className="bg-emerald-950/40 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition cursor-pointer"
                                  title={`Filter feed by ${tag}`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredITrafficItems.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div
                        key="techrix-feed-card-itraffic-condensed"
                        layout="position"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <TechrixFeedAdCard variant="compact" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredITrafficItems.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-itraffic-condensed"
                        layout="position"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                      >
                        <ShareAppFeedCard variant="compact" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, false);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          ) : viewMode === 'bullets' ? (
            /* ========================================================= */
            /* BULLET POINTS VIEW: Maximum Density / Second Line Only    */
            /* ========================================================= */
            <div className="bg-[#0B0D13] border border-slate-800/90 rounded-2xl divide-y divide-slate-800/60 overflow-hidden shadow-xl">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredITrafficItems.flatMap((item, index) => {
                  const isNew = newlyAddedItemIds.has(item.id);
                  const isExpanded = !!expandedItemIds[item.id];
                  const isGbv = item.category === 'gbv' || item.category === 'gbv_assist' || item.eventSubType?.toLowerCase().includes('gbv') || item.content?.toLowerCase().includes('gbv') || item.author?.toLowerCase().includes('gbv');
                  const isCrash = !isGbv && (item.category === 'crash' || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident'));
                  const isRoadworks = !isGbv && (item.category === 'roadworks' || item.eventSubType?.toLowerCase().includes('roadwork'));
                  const isSpiking = !isGbv && (item.category === 'spiking' || item.eventSubType?.toLowerCase().includes('spiking'));
                  const isHazard = !isGbv && (item.category === 'hazard' || item.category === 'stationary' || item.eventSubType?.toLowerCase().includes('hazard') || item.eventSubType?.toLowerCase().includes('stationary'));
                  const isAdmin = !isGbv && item.source === 'admin_dispatch';
                  const isUserPost = !isGbv && (Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user');

                  const updatedDateStr = item.lastUpdated
                    ? formatReadableDateTime(item.lastUpdated)
                    : item.timestamp
                    ? formatReadableDateTime(item.timestamp)
                    : item.startTime
                    ? formatReadableDateTime(item.startTime)
                    : formatReadableDateTime(item.timestamp);

                  const itemReg = resolveItemRegion(item);
                  const regInfo = SA_REGIONS[itemReg] || SA_REGIONS['gauteng'];

                  let bulletDotClass = 'bg-cyan-400 shadow-cyan-400/50';
                  if (item.broadcastTopRed) bulletDotClass = 'bg-red-500 shadow-red-500/50 ring-2 ring-red-400';
                  else if (item.highlightGold) bulletDotClass = 'bg-amber-400 shadow-amber-400/50 ring-2 ring-amber-300';
                  else if (isGbv) bulletDotClass = 'bg-purple-500 shadow-purple-500/50 ring-2 ring-purple-400';
                  else if (isUserPost) bulletDotClass = 'bg-orange-500 shadow-orange-500/50 ring-2 ring-orange-400';
                  else if (isCrash) bulletDotClass = 'bg-rose-500 shadow-rose-500/50';
                  else if (isSpiking || isRoadworks || item.category === 'pothole') bulletDotClass = 'bg-amber-400 shadow-amber-400/50';
                  else if (isHazard) bulletDotClass = 'bg-orange-400 shadow-orange-400/50';
                  else if (isAdmin) bulletDotClass = 'bg-amber-400 shadow-amber-400/50';

                  const elements = [
                    <motion.div
                      key={item.id}
                      id={`feed-item-bullet-${item.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className={`transition-colors duration-200 ${
                        isNew
                          ? 'animate-new-feed-highlight bg-amber-500/10'
                          : highlightedItemId === item.id
                          ? 'bg-amber-950/40 ring-1 ring-amber-400'
                          : item.broadcastTopRed
                          ? 'bg-red-950/30 ring-1 ring-red-500/90'
                          : item.highlightGold
                          ? 'bg-amber-950/30 ring-1 ring-amber-400/90'
                          : isGbv
                          ? 'border-2 border-purple-500/80 ring-1 ring-purple-500/50 bg-gradient-to-r from-purple-950/40 to-[#0F1115] rounded-xl my-1'
                          : isUserPost
                          ? 'border-2 border-orange-500 ring-1 ring-orange-500/50 bg-gradient-to-r from-orange-950/30 to-[#0F1115] rounded-xl my-1'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* The Bullet Row: Displays the second line of the card */}
                      {item.highlightGold || item.broadcastTopRed ? (
                        <div
                          onClick={() => toggleExpandItem(item.id)}
                          className="px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer select-text group space-y-1.5"
                          title="Click to view corridor details & quick actions"
                        >
                          {/* Top Row: Bullet Dot, Badges, and Date/Time / Expand Chevron */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1 min-w-0">
                              {/* Colored Bullet Dot */}
                              <span className={`w-2 h-2 rounded-full shrink-0 shadow-sm ring-1 ring-white/20 ${bulletDotClass}`} />

                              {item.highlightGold && (
                                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0 ring-1 ring-amber-300 shadow-sm flex items-center space-x-1">
                                  <span>🟡 HIGHLIGHT</span>
                                </span>
                              )}
                              {item.broadcastTopRed && (
                                <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-wider shrink-0 shadow-sm flex items-center space-x-1 animate-pulse">
                                  <span>🔴 BROADCAST</span>
                                </span>
                              )}
                              {isNew && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 animate-pulse">
                                  NEW
                                </span>
                              )}
                              {highlightedItemId === item.id && (
                                <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0">
                                  TARGET
                                </span>
                              )}
                              {isGbv && (
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/60 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 shadow-sm flex items-center space-x-1 animate-pulse">
                                  <HeartHandshake className="w-2.5 h-2.5 text-purple-400" />
                                  <span>💜 GBV ASSIST</span>
                                </span>
                              )}
                              {isUserPost && (
                                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/60 px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black tracking-wide shrink-0 shadow-sm flex items-center space-x-1">
                                  <span>👤</span>
                                  <span className="truncate max-w-[120px] sm:max-w-[150px]">{getUserPostDisplayName(item)}</span>
                                </span>
                              )}
                            </div>

                            {/* Right indicators: Date & Time, Expand Chevron */}
                            <div className="flex items-center space-x-1.5 shrink-0 text-slate-400 text-[10px] font-mono select-none">
                              <span className="inline-flex items-center text-slate-400 text-[9.5px] sm:text-[10px] whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 mr-1 text-slate-500 shrink-0" />
                                {updatedDateStr}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-300'}`} />
                            </div>
                          </div>

                          {/* Content text moved directly under the badges */}
                          <p className={`${fontStyles.bulletBody} min-w-0 break-words group-hover:text-white transition-colors pl-4`}>
                            {cleanTrafficText(item.content)}
                          </p>
                        </div>
                      ) : (
                        <div
                          onClick={() => toggleExpandItem(item.id)}
                          className="flex items-start gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer select-text group"
                          title="Click to view corridor details & quick actions"
                        >
                          {/* Colored Bullet Dot */}
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 shadow-sm ring-1 ring-white/20 ${bulletDotClass}`} />

                          {/* Badges if New or Targeted */}
                          {isNew && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5 animate-pulse">
                              NEW
                            </span>
                          )}
                          {highlightedItemId === item.id && (
                            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                              TARGET
                            </span>
                          )}
                          {isGbv && (
                            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/60 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5 shadow-sm flex items-center space-x-1 animate-pulse">
                              <HeartHandshake className="w-2.5 h-2.5 text-purple-400" />
                              <span>💜 GBV ASSIST</span>
                            </span>
                          )}
                          {isUserPost && (
                            <span className={`px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black tracking-wide shrink-0 mt-0.5 shadow-sm flex items-center space-x-1 ${
                              checkIsAdminVerified(item)
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                : 'bg-orange-500/20 text-orange-300 border border-orange-500/60'
                            }`}>
                              <span>{checkIsAdminVerified(item) ? '🛡️' : '👤'}</span>
                              <span className="truncate max-w-[120px] sm:max-w-[150px]">{getUserPostDisplayName(item)}</span>
                              {checkIsAdminVerified(item) && (
                                <span className="text-[7.5px] uppercase bg-emerald-950 px-1 rounded text-emerald-300 font-black">Verified</span>
                              )}
                            </span>
                          )}

                          {/* Second line text: incident message content */}
                          <p className={`${fontStyles.bulletBody} flex-1 min-w-0 break-words group-hover:text-white transition-colors`}>
                            {cleanTrafficText(item.content)}
                          </p>

                          {/* Right indicators: Date & Time, Expand Chevron */}
                          <div className="flex items-center space-x-1.5 shrink-0 ml-1 text-slate-400 text-[10px] font-mono select-none">
                            <span className="inline-flex items-center text-slate-400 text-[9.5px] sm:text-[10px] whitespace-nowrap">
                              <Clock className="w-2.5 h-2.5 mr-1 text-slate-500 shrink-0" />
                              {updatedDateStr}
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-300'}`} />
                          </div>
                        </div>
                      )}

                      {/* Expandable details on demand */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 sm:px-4 sm:pb-3.5 bg-slate-900/70 border-t border-slate-800/60 space-y-2">
                          {/* Prominent Admin Verified or User Post Banner in Telegram View */}
                          {isUserPost && renderUserPostBanner(item, 'standard')}
                          <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide">
                                {regInfo.shortCode}
                              </span>
                              {(item.location || item.roadwayName) && (
                                <span className="font-bold text-amber-300 text-xs flex items-center space-x-1 truncate max-w-[180px] xs:max-w-[240px] sm:max-w-xs" title={item.location || item.roadwayName}>
                                  <span>📍</span>
                                  <span className="truncate">{item.location || item.roadwayName}</span>
                                </span>
                              )}
                              <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 text-[10px] font-mono">
                                <Eye className="w-2.5 h-2.5 inline mr-1 text-cyan-400" />
                                {formatViewsShort(getItemViews(item, liveViewsMap))} views
                              </span>
                              <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 text-[10px] font-mono">
                                <Clock className="w-2.5 h-2.5 inline mr-1 text-slate-500" />
                                {updatedDateStr}
                              </span>
                            </div>

                            {/* Verification & Action Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(() => {
                                const isPostAdminVerified = checkIsAdminVerified(item);
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerifyIncident(item);
                                    }}
                                    disabled={isVerifyingItemId === item.id || (isUserAdmin ? isPostAdminVerified : !!verifiedItemIds[item.id])}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                                      isPostAdminVerified
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                        : verifiedItemIds[item.id]
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black'
                                        : 'text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                                    }`}
                                  >
                                    {isPostAdminVerified ? (
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <ThumbsUp className={`w-3 h-3 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                                    )}
                                    <span>
                                      {isPostAdminVerified
                                        ? '✓ Admin Verified'
                                        : isUserAdmin
                                        ? '🛡️ Verify as Admin'
                                        : verifiedItemIds[item.id]
                                        ? 'Verified'
                                        : 'Verify'}
                                    </span>
                                  </button>
                                );
                              })()}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecordView(item.id);
                                  handlePostToWhatsApp(item);
                                }}
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 transition cursor-pointer"
                              >
                                <WhatsAppIcon className="w-3 h-3 text-slate-950" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </div>

                          {/* Photo if present */}
                          {(() => {
                            const img = getItemMediaImage(item);
                            return img ? (
                              <div className="pt-1">
                                <IncidentImagePreview
                                  imageUrl={img}
                                  title={item.location || item.roadwayName || 'Incident Photo'}
                                  location={item.location}
                                  description={item.content}
                                  timestamp={item.timestamp || item.startTime || item.lastUpdated}
                                  category={item.category || item.eventSubType}
                                  variant="row-thumb"
                                  onOpenLightbox={setLightboxData}
                                />
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredITrafficItems.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div
                        key="techrix-feed-card-itraffic-bullets"
                        layout="position"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="p-2 sm:p-2.5 bg-[#080B10]"
                      >
                        <TechrixFeedAdCard variant="compact" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredITrafficItems.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-itraffic-bullets"
                        layout="position"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                        className="p-2 sm:p-2.5 bg-[#080B10]"
                      >
                        <ShareAppFeedCard variant="compact" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, false);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* ========================================================= */
            /* DETAILED VIEW: 2-Column Responsive Card Grid              */
            /* ========================================================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredITrafficItems.flatMap((item, index) => {
                  const isGbv = item.category === 'gbv' || item.category === 'gbv_assist' || item.eventSubType?.toLowerCase().includes('gbv') || item.content?.toLowerCase().includes('gbv') || item.author?.toLowerCase().includes('gbv');
                  const isCrash = !isGbv && (item.category === 'crash' || item.eventSubType?.toLowerCase().includes('crash') || item.eventSubType?.toLowerCase().includes('accident'));
                  const isRoadworks = !isGbv && (item.category === 'roadworks' || item.eventSubType?.toLowerCase().includes('roadwork'));
                  const isStationary = !isGbv && (item.category === 'stationary' || item.eventSubType?.toLowerCase().includes('stationary'));
                  const isUserPost = !isGbv && (Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user');

                  let cardBorder = 'border-slate-800 hover:border-slate-700';
                  let badgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
                  let typeIcon = <Activity className="w-3.5 h-3.5" />;

                  if (item.highlightGold) {
                    cardBorder = 'border-amber-400 ring-2 ring-amber-400/80 shadow-amber-900/40 bg-gradient-to-br from-[#1A1506] via-[#120F08] to-[#0F1115]';
                  } else if (item.broadcastTopRed) {
                    cardBorder = 'border-red-500/80 ring-2 ring-red-500/60 shadow-red-950/50 bg-gradient-to-br from-[#1A0808] via-[#120808] to-[#0F1115]';
                  } else if (isGbv) {
                    cardBorder = 'border-2 border-purple-500/80 ring-2 ring-purple-500/50 shadow-xl shadow-purple-950/50 bg-gradient-to-br from-[#1A0D24] via-[#120B1A] to-[#0F1115]';
                    badgeBg = 'bg-purple-500/20 text-purple-300 border-purple-500/50';
                    typeIcon = <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />;
                  } else if (isUserPost) {
                    cardBorder = 'border-2 border-orange-500 ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/40 bg-gradient-to-br from-[#171109] via-[#0F1115] to-[#171109]';
                    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
                    typeIcon = <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
                  } else if (isCrash) {
                    cardBorder = 'border-rose-500/40 bg-gradient-to-br from-[#0F1115] via-[#160E12] to-[#0F1115]';
                    badgeBg = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    typeIcon = <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />;
                  } else if (isRoadworks) {
                    cardBorder = 'border-amber-500/30 bg-gradient-to-br from-[#0F1115] via-[#16130D] to-[#0F1115]';
                    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    typeIcon = <Construction className="w-3.5 h-3.5 text-amber-400" />;
                  } else if (isStationary) {
                    cardBorder = 'border-orange-500/30';
                    badgeBg = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
                    typeIcon = <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
                  }

                  const inlineAds = activeAds.filter(b => (b.position === 'inline' || b.position === 'both' || !b.position) && !dismissedAdIds[b.id]);
                  const shouldShowInlineAd = adsEnabled && inlineAds.length > 0 && (index > 2 && (index - 2) % 6 === 0);
                  const inlineBannerToDisplay = shouldShowInlineAd ? inlineAds[Math.floor(index / 6) % inlineAds.length] : null;

                  const isNew = newlyAddedItemIds.has(item.id);
                  const elements = [
                    <motion.div
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={inlineBannerToDisplay ? `col-span-1 md:col-span-2 space-y-3.5 ${isNew ? 'animate-feed-fade-in' : ''}` : `flex flex-col ${isNew ? 'animate-feed-fade-in' : ''}`}
                    >
                      {inlineBannerToDisplay && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between px-1 text-xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400/90 flex items-center space-x-1">
                              <Megaphone className="w-3 h-3 text-amber-400" />
                              <span>Sponsored Partner</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToAdvertiser) onNavigateToAdvertiser();
                                else if (onSwitchTab) onSwitchTab('advertiser');
                              }}
                              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1 transition cursor-pointer hover:underline"
                            >
                              <span>Advertising Page</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <FeedAdBanner
                            key={`inline-${item.id}-${inlineBannerToDisplay.id}`}
                            banner={inlineBannerToDisplay}
                            variant="inline"
                            showSponsoredBadge={showSponsoredBadge}
                            allowDismiss={allowDismissAds}
                            onDismiss={handleDismissAd}
                            onNavigateToAdvertiser={onNavigateToAdvertiser || (() => onSwitchTab?.('advertiser'))}
                          />
                        </div>
                      )}
                      <div
                        id={`feed-item-${item.id}`}
                        className={`bg-[#0F1115] border rounded-2xl p-4 sm:p-4.5 space-y-3 shadow-xl transition-all duration-500 relative flex flex-col justify-between flex-1 ${cardBorder} ${
                          isNew ? 'animate-new-feed-highlight' : ''
                        } ${
                          highlightedItemId === item.id
                            ? 'ring-2 ring-amber-400 shadow-2xl shadow-amber-500/30 border-amber-400 bg-gradient-to-br from-[#1A140B] via-[#0F1115] to-[#0F1115]'
                            : item.highlightGold
                            ? 'ring-2 ring-amber-400 border-amber-400 bg-[#14120D] shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : ''
                        }`}
                      >
                      {/* Top Row: Roadway & Badges */}
                      <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            {isNew && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow">
                                <span>✦ NEW</span>
                              </span>
                            )}
                            {highlightedItemId === item.id && (
                              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow">
                                <span>★ TARGETED ALERT</span>
                              </span>
                            )}
                            {item.highlightGold && (
                              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow ring-1 ring-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
                                <span>🟡 HIGHLIGHTED</span>
                              </span>
                            )}
                            {item.broadcastTopRed && (
                              <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow animate-pulse">
                                <span>🔴 BROADCAST</span>
                              </span>
                            )}
                            {isGbv ? (
                              <>
                                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/60 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center space-x-1.5 shadow-sm animate-pulse">
                                  <HeartHandshake className="w-3.5 h-3.5 text-purple-400" />
                                  <span>💜 GBV Assist</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-500/40 bg-purple-500/20 text-purple-300 flex items-center space-x-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                  <span>Priority Assistance</span>
                                </span>
                                {(item.postedByUserName || item.author || item.postedByUserSurname) && (
                                  <span className="bg-slate-800 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center space-x-1">
                                    <span>👤</span>
                                    <span>{getUserPostDisplayName(item)}</span>
                                  </span>
                                )}
                                {item.location && (
                                  <span className="bg-purple-950/80 text-purple-200 border border-purple-500/40 px-2 py-0.5 rounded-lg text-xs font-bold tracking-wide">
                                    📍 {item.location}
                                  </span>
                                )}
                                <span className="bg-slate-800 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono flex items-center space-x-1 shadow-sm">
                                  <Clock className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span>Alert Time: {formatReadableDateTime(item.timestamp || item.startTime || item.lastUpdated)}</span>
                                </span>
                              </>
                            ) : item.source === 'admin_dispatch' ? (
                              <>
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center space-x-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Admin post</span>
                                </span>
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${badgeBg}`}>
                                  {typeIcon}
                                  <span>{item.eventSubType || (isCrash ? 'Crash Alert' : item.category === 'spiking' ? 'Spiking Alert' : item.category === 'pothole' ? 'Pothole Alert' : 'Traffic Report')}</span>
                                </span>
                                {item.location && (
                                  <span className="bg-sky-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-lg text-xs font-bold tracking-wide">
                                    📍 {item.location}
                                  </span>
                                )}
                                <span className="bg-slate-800 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono flex items-center space-x-1 shadow-sm">
                                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>Alert Time: {formatReadableDateTime(item.timestamp || item.startTime || item.lastUpdated)}</span>
                                </span>
                              </>
                            ) : isUserPost ? (
                              <>
                                {checkIsAdminVerified(item) ? (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center space-x-1.5 shadow-sm">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>🛡️ Admin Verified</span>
                                  </span>
                                ) : (
                                  <span className="bg-orange-500/20 text-orange-300 border border-orange-500/60 px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center space-x-1.5 shadow-sm">
                                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                                    <span>⚠️ Not Verified • User Post</span>
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${badgeBg}`}>
                                  {typeIcon}
                                  <span>{item.eventSubType || (isCrash ? 'Crash Alert' : item.category === 'spiking' ? 'Spiking Alert' : item.category === 'pothole' ? 'Pothole Alert' : 'Traffic Report')}</span>
                                </span>
                                {(item.postedByUserName || item.author || item.postedByUserSurname) && (
                                  <span className="bg-slate-800 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center space-x-1">
                                    <span>👤</span>
                                    <span>{getUserPostDisplayName(item)}</span>
                                  </span>
                                )}
                                {item.location && (
                                  <span className="bg-sky-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-lg text-xs font-bold tracking-wide">
                                    📍 {item.location}
                                  </span>
                                )}
                                <span className="bg-slate-800 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono flex items-center space-x-1 shadow-sm">
                                  <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>Alert Time: {formatReadableDateTime(item.timestamp || item.startTime || item.lastUpdated)}</span>
                                </span>
                              </>
                            ) : (
                              <>
                                {(() => {
                                  const itemReg = resolveItemRegion(item);
                                  const regInfo = SA_REGIONS[itemReg] || SA_REGIONS['gauteng'];
                                  return (
                                    <>
                                      <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded-lg text-[10px] font-black tracking-wide shrink-0">
                                        {regInfo.shortCode}
                                      </span>
                                      <span 
                                        className="bg-sky-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-lg text-xs font-black tracking-wide truncate max-w-[180px] xs:max-w-[240px] sm:max-w-xs inline-block"
                                        title={item.roadwayName || `${regInfo.shortCode} Highway`}
                                      >
                                        {item.roadwayName || `${regInfo.shortCode} Highway`}
                                      </span>
                                    </>
                                  );
                                })()}
                                {item.direction && (
                                  <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                    {item.direction}
                                  </span>
                                )}
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${badgeBg}`}>
                                  {typeIcon}
                                  <span>{item.eventSubType || item.category || 'Incident'}</span>
                                </span>
                                {item.source === 'community' && (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                                    <Users className="w-3 h-3 text-emerald-400" />
                                    <span>Verified Community</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {item.source === 'admin_dispatch' ? (
                            item.location && (
                              <h3 className={`font-bold text-white ${fontStyles.cardTitle} leading-snug`}>
                                📍 {item.location}
                              </h3>
                            )
                          ) : (
                            (item.location || item.roadwayName) && (
                              <h3 className={`font-bold text-white ${fontStyles.cardTitle} leading-snug`}>
                                {item.location || item.roadwayName}
                              </h3>
                            )
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <span className="text-[11px] font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-lg flex items-center space-x-1 font-mono shadow-sm" title="Actual verified views of this incident alert">
                            <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                          </span>
                          {item.lastUpdated ? (
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg flex items-center space-x-1 font-mono shadow-sm" title={`Last Updated: ${item.lastUpdated}`}>
                              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span>Updated: {formatReadableDateTime(item.lastUpdated)}</span>
                            </span>
                          ) : item.startTime ? (
                            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-lg flex items-center space-x-1 font-mono shadow-sm" title={`Reported / Started: ${item.startTime}`}>
                              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                              <span>Started: {formatReadableDateTime(item.startTime)}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatReadableDateTime(item.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prominent Emergency Assist Banner for GBV Posts */}
                      {isGbv && (
                        <div className="bg-gradient-to-r from-purple-950/90 via-purple-900/60 to-purple-950/90 border border-purple-500/70 rounded-xl p-3 flex items-start space-x-3 shadow-md text-purple-200">
                          <HeartHandshake className="w-5 h-5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-black text-xs uppercase tracking-wider text-purple-300">
                                💜 GENDER-BASED VIOLENCE / EMERGENCY ASSIST
                              </span>
                              {(item.postedByUserName || item.author || item.postedByUserSurname) && (
                                <span className="text-[10px] text-purple-300/90 font-medium">
                                  by {getUserPostDisplayName(item)}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-purple-200/90 leading-snug font-medium">
                              Priority distress report logged. Community monitors and emergency responder units alerted.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Prominent Admin Verified or User Post Banner in Full Card View */}
                      {isUserPost && renderUserPostBanner(item, 'full')}

                      {/* Main description */}
                      <p className={`${fontStyles.cardBody}`}>
                        {cleanTrafficText(item.content)}
                      </p>

                      {/* Attached Media Image if present */}
                      {(() => {
                        const img = getItemMediaImage(item);
                        return img ? (
                          <IncidentImagePreview
                            imageUrl={img}
                            title={item.location || item.roadwayName || 'Incident Photo'}
                            location={item.location}
                            description={item.content}
                            timestamp={item.timestamp || item.startTime || item.lastUpdated}
                            category={item.category || item.eventSubType}
                            variant="card-media"
                            onOpenLightbox={setLightboxData}
                          />
                        ) : null;
                      })()}

                      {/* Timing & Coordinates Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-400 bg-[#050608]/70 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                        {item.lastUpdated && (
                          <div className="flex items-center space-x-1 text-emerald-400">
                            <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">Updated: {item.lastUpdated}</span>
                          </div>
                        )}
                        {item.startTime && (
                          <div className="flex items-center space-x-1 text-slate-300">
                            <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate">Start: {item.startTime}</span>
                          </div>
                        )}
                        {item.endTime && (
                          <div className="flex items-center space-x-1 text-slate-300">
                            <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">End: {item.endTime}</span>
                          </div>
                        )}
                        {item.latitude !== undefined && item.longitude !== undefined && (
                          <div className="flex items-center space-x-1 text-cyan-400 col-span-full">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Extracted i-Traffic #Tags */}
                      {(() => {
                        const tags = generateITrafficHashtags(item);
                        return (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
                            <span className="text-[10px] font-bold text-amber-400/90 flex items-center space-x-1 mr-0.5">
                              <Hash className="w-3 h-3 text-amber-400" />
                              <span>Tags:</span>
                            </span>
                            {tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const clean = tag.replace(/^#/, '');
                                  setSearchQuery(clean);
                                }}
                                className="bg-emerald-950/40 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition cursor-pointer"
                                title={`Click to filter feed by ${tag}`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 text-xs w-full min-w-0">
                      {/* Line 1 on mobile: Verify & Status */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Motorist & Admin Incident Verification */}
                        {(() => {
                          const isPostAdminVerified = checkIsAdminVerified(item);
                          return (
                            <button
                              type="button"
                              onClick={() => handleVerifyIncident(item)}
                              disabled={isVerifyingItemId === item.id || (isUserAdmin ? isPostAdminVerified : !!verifiedItemIds[item.id])}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm ${
                                isPostAdminVerified
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                  : verifiedItemIds[item.id]
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400'
                              }`}
                              title={
                                isPostAdminVerified
                                  ? "Officially verified by Admin"
                                  : isUserAdmin
                                  ? "Verify incident as Patrol Admin"
                                  : verifiedItemIds[item.id]
                                  ? "You verified this incident"
                                  : "Verify incident as a motorist"
                              }
                            >
                              {isPostAdminVerified ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <ThumbsUp className={`w-3.5 h-3.5 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                              )}
                              <span>
                                {isPostAdminVerified
                                  ? '✓ Admin Verified'
                                  : isUserAdmin
                                  ? '🛡️ Verify as Admin'
                                  : verifiedItemIds[item.id]
                                  ? '✓ Verified by You'
                                  : 'Verify Incident'}
                              </span>
                              {((item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)) > 0 && (
                                <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.2 rounded">
                                  {(item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)}
                                </span>
                              )}
                            </button>
                          );
                        })()}

                        {/* Status Dropdown Button (Still Active or Cleared) */}
                        {renderStatusButton(item, 'md')}
                      </div>

                      {/* Line 2 on mobile: Rest of the icons under it */}
                      <div className="flex items-center flex-wrap gap-1.5 min-w-0">
                        {/* Post to WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            handleRecordView(item.id);
                            handlePostToWhatsApp(item);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm ${
                            copiedItemIds[item.id]
                              ? 'bg-[#25D366] text-slate-950 font-black'
                              : 'bg-[#071910] hover:bg-[#0c291b] text-emerald-300 hover:text-white'
                          }`}
                          title="Post alert to WhatsApp"
                        >
                          {copiedItemIds[item.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-slate-950" />
                              <span>✓ Opening WhatsApp...</span>
                            </>
                          ) : (
                            <>
                              <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                              <span>Post to WhatsApp</span>
                            </>
                          )}
                        </button>

                        {onOpenShareToWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onOpenShareToWhatsApp({ feedItem: item })}
                            className="bg-[#050608] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                            title="Open WhatsApp customize modal"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        )}

                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition"
                            title="Open live corridor update source"
                          >
                            <span>Live Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}

                        {onOpenShareToX && (
                          <button
                            type="button"
                            onClick={() => onOpenShareToX({ feedItem: item })}
                            className="bg-[#050608] hover:bg-black text-slate-300 hover:text-white border border-slate-700/80 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                            title="Share this traffic incident to X.com"
                          >
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>X</span>
                          </button>
                        )}

                        {isUserAdmin && (
                          <button
                            type="button"
                            onClick={() => setEditingFeedItem(item)}
                            className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                            title="Edit post info, fix typos or adjust details (Admin)"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* Dismiss Button: Disabled for motorists, enabled for admin or author */}
                        {(() => {
                          const canDelete = canUserDeleteFeedItem(item);
                          if (confirmingDeleteId === item.id) {
                            return (
                              <div className="flex items-center space-x-1 animate-fadeIn">
                                <button
                                  type="button"
                                  disabled={!canDelete}
                                  onClick={() => handleDeleteFeedItem(item.id)}
                                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black px-2 py-0.5 rounded-lg text-[11px] flex items-center space-x-1 transition cursor-pointer shadow-md"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Dismiss?</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-0.5 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              disabled={!canDelete}
                              onClick={() => {
                                if (canDelete) setConfirmingDeleteId(item.id);
                              }}
                              className={`p-1 rounded-lg text-[11px] transition ${
                                canDelete
                                  ? 'text-slate-500 hover:text-rose-400 cursor-pointer'
                                  : 'text-slate-600 cursor-not-allowed opacity-40'
                              }`}
                              title={canDelete ? "Dismiss / Hide Event" : "Delete disabled: Only administrators or the original composer can delete this post"}
                              aria-label={canDelete ? "Dismiss / Hide Event" : "Delete disabled"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </motion.div>
                ];

                const targetTechrixCardIndex = Math.min(2, filteredITrafficItems.length - 1);
                if (index === targetTechrixCardIndex) {
                  elements.push(
                    <motion.div
                      key="techrix-feed-card-itraffic-detailed"
                      layout="position"
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="col-span-1 md:col-span-2"
                    >
                      <TechrixFeedAdCard variant="card" />
                    </motion.div>
                  );
                }

                const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredITrafficItems.length - 1));
                if (index === effectiveShareCardIndex) {
                  const shareCardEl = (
                    <motion.div
                      key="share-app-feed-card-itraffic-detailed"
                      layout="position"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                      className="col-span-1 md:col-span-2"
                    >
                      <ShareAppFeedCard variant="card" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                    </motion.div>
                  );
                  if (effectiveShareCardIndex === 0) {
                    elements.unshift(shareCardEl);
                  } else {
                    elements.push(shareCardEl);
                  }
                }

                if (targetInFeedAdIndices.includes(index)) {
                  const inFeedAd = renderInFeedAdBanner(index, true);
                  if (inFeedAd) elements.push(inFeedAd);
                }

                return elements;
              })}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom Ad Placement */}
          {renderBottomAdSection()}
        </div>

      {/* ========================================================================= */}
      {/* TAB 2: Patrol Command & Community Dispatches */}
      {/* ========================================================================= */}
      {activeTab === 'dispatches' && (
        <div className="space-y-4">
          {/* Dispatches Feed Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-0.5 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-xs">
                {filteredDispatches.length} {filteredDispatches.length === 1 ? 'Dispatch Broadcast' : 'Dispatch Broadcasts'}
              </span>
            </div>

            <div className="flex items-center space-x-2.5">
              {/* Sort Order Toggle */}
              <div className="flex items-center space-x-1">
                <span className="text-[11px] text-slate-400 font-medium hidden xs:inline">Sort:</span>
                <button
                  type="button"
                  onClick={toggleSortOrder}
                  className="bg-[#050608] hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                  title={`Current order: ${sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}. Click to toggle.`}
                >
                  <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-medium hidden xs:inline">Layout:</span>
              <div className="bg-[#050608] p-0.5 rounded-lg border border-slate-800 flex items-center space-x-0.5">
                <button
                  type="button"
                  onClick={() => handleSetViewMode('minimal')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                    viewMode === 'minimal'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Switch to Minimal View (Clean & Simple)"
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>Minimal</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('condensed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                    viewMode === 'condensed'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Condensed View (See more at once)"
                >
                  <List className="w-3 h-3" />
                  <span>Condensed</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('bullets')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                    viewMode === 'bullets'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Bullet Points (Show second line only for maximum density)"
                >
                  <CircleDot className="w-3 h-3" />
                  <span>Bullets</span>
                  {showBulletViewNotice && viewMode !== 'bullets' && (
                    <span className="bg-amber-400 text-slate-950 text-[8px] font-black px-1 py-0.2 rounded ml-0.5 animate-pulse">
                      NEW
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('detailed')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                    viewMode === 'detailed'
                      ? 'bg-slate-800 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Detailed Cards View"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {isLoadingFeed ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-[#0F1115] border border-slate-800 rounded-2xl">
              <RefreshCw className="w-5 h-5 text-amber-400 animate-spin mx-auto mb-2" />
              Loading live community & admin patrol dispatches...
            </div>
          ) : filteredDispatches.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs bg-[#0F1115] border border-slate-800 rounded-2xl space-y-2">
              <p className="font-bold text-white text-sm">No feed broadcasts found for this filter.</p>
              <p className="text-slate-500">Publish a new dispatch or change filter options.</p>
            </div>
          ) : viewMode === 'minimal' ? (
            /* ========================================================= */
            /* MINIMAL VIEW: Clean & Simple Dispatches List              */
            /* ========================================================= */
            <div className="space-y-2.5">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredDispatches.flatMap((item, index) => {
                  const isNew = newlyAddedItemIds.has(item.id);
                  const isUserPost = Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user';
                  const elements = [
                    <motion.div
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0, y: 14, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className={`rounded-xl p-3.5 sm:p-4 shadow-sm transition space-y-1.5 ${
                        isNew
                          ? 'animate-new-feed-highlight'
                          : isUserPost
                          ? 'border-2 border-orange-500 ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/40 bg-[#0F1115]'
                          : 'bg-[#0F1115] border border-slate-800/80 hover:border-slate-700/80'
                      }`}
                    >
                      {/* Main Text */}
                      <h4 className="text-sm sm:text-[15px] font-bold text-white leading-snug tracking-tight flex items-center space-x-1.5 flex-wrap gap-y-1">
                        {isNew && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0">
                            ✦ NEW
                          </span>
                        )}
                        {isUserPost ? (
                          checkIsAdminVerified(item) ? (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>{getUserPostDisplayName(item)}</span>
                              <span className="text-[8px] bg-emerald-950 px-1 rounded text-emerald-300 font-black uppercase">Verified</span>
                            </span>
                          ) : (
                            <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                              <span>👤</span>
                              <span>{getUserPostDisplayName(item)}</span>
                            </span>
                          )
                        ) : (
                          <span>{item.author}</span>
                        )}
                        {item.eventSubType && item.eventSubType !== 'Admin post' && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                            (item.category === 'crash' || item.eventSubType.toLowerCase().includes('crash'))
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            {item.eventSubType}
                          </span>
                        )}
                        {item.location && <span className="text-slate-400 font-medium text-xs">• {item.location}</span>}
                        {checkIsAdminVerified(item) ? (
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[9px] font-black px-1.5 py-0.2 rounded flex items-center space-x-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            <span>ADMIN VERIFIED</span>
                          </span>
                        ) : item.verified ? (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.2 rounded">
                            VERIFIED
                          </span>
                        ) : null}
                      </h4>

                      {/* Prominent Admin Verified or User Post Banner in Dispatches Minimal View */}
                      {isUserPost && renderUserPostBanner(item, 'standard')}

                      {/* Sub Text */}
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        {cleanTrafficText(item.content)}
                      </p>

                      {/* Views & Date updated under it */}
                      <div className="flex flex-wrap items-center justify-start gap-2 pt-1">
                        <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views">
                          <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                          <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                        </span>
                        <div className="flex items-center space-x-1.5 text-[11px] text-amber-400/90 font-mono">
                          <Clock className="w-3 h-3 text-amber-400/90 shrink-0" />
                          <span>Alert Time: {formatReadableDateTime(item.timestamp)}</span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 w-full min-w-0">
                          {/* Line 1 on mobile: Verify & Status */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Motorist & Admin Incident Verification */}
                            {(() => {
                              const isPostAdminVerified = checkIsAdminVerified(item);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyIncident(item)}
                                  disabled={isVerifyingItemId === item.id || (isUserAdmin ? isPostAdminVerified : !!verifiedItemIds[item.id])}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                                    isPostAdminVerified
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                      : verifiedItemIds[item.id]
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black'
                                      : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/20 border border-amber-500/30'
                                  }`}
                                  title={
                                    isPostAdminVerified
                                      ? "Officially verified by Admin"
                                      : isUserAdmin
                                      ? "Verify incident as Patrol Admin"
                                      : verifiedItemIds[item.id]
                                      ? "You verified this incident"
                                      : "Verify incident as motorist"
                                  }
                                >
                                  {isPostAdminVerified ? (
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <ThumbsUp className={`w-3 h-3 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                                  )}
                                  <span>
                                    {isPostAdminVerified
                                      ? '✓ Admin Verified'
                                      : isUserAdmin
                                      ? '🛡️ Verify as Admin'
                                      : verifiedItemIds[item.id]
                                      ? 'Verified'
                                      : 'Verify'}
                                  </span>
                                  {((item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)) > 0 && (
                                    <span className="font-mono text-[9px] bg-slate-900 px-1 rounded">
                                      {(item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)}
                                    </span>
                                  )}
                                </button>
                              );
                            })()}

                            {/* Status Dropdown Button (Still Active or Cleared) */}
                            {renderStatusButton(item, 'sm')}
                          </div>

                          {/* Line 2 on mobile: Rest of the icons under it */}
                          <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 min-w-0">
                            {/* Post to WhatsApp */}
                            <button
                              type="button"
                              onClick={() => {
                                handleRecordView(item.id);
                                handlePostToWhatsApp(item);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                                copiedItemIds[item.id]
                                  ? 'bg-[#25D366] text-slate-950 font-black'
                                  : 'text-slate-300 hover:text-white hover:bg-[#25D366]/20'
                              }`}
                              title="Post to WhatsApp"
                            >
                              {copiedItemIds[item.id] ? (
                                <>
                                  <Check className="w-3 h-3 text-slate-950" />
                                  <span>Opening...</span>
                                </>
                              ) : (
                                <>
                                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </>
                              )}
                            </button>

                            {onOpenShareToX && (
                              <button
                                type="button"
                                onClick={() => onOpenShareToX({ feedItem: item })}
                                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
                                title="Share to X"
                              >
                                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredDispatches.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div
                        key="techrix-feed-card-dispatch-minimal"
                        layout="position"
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <TechrixFeedAdCard variant="minimal" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredDispatches.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-dispatch-minimal"
                        layout="position"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                      >
                        <ShareAppFeedCard variant="minimal" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedDispatchAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, false);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          ) : viewMode === 'condensed' ? (
            /* Condensed Dispatches List */
            <div className="space-y-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredDispatches.flatMap((item, index) => {
                  const isNew = newlyAddedItemIds.has(item.id);
                  const isUserPost = Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user';
                  const isAdminPost = !isUserPost && isItemAdminPost(item);
                  const isPotholeFix = item.category === 'pothole' || item.content.toLowerCase().includes('pothole') || item.author.includes('POTHOLE');
                  const isSOSAlert = item.content.toLowerCase().includes('sos') || item.content.toLowerCase().includes('emergency') || item.content.toLowerCase().includes('motorist');
                  const isExpanded = !!expandedItemIds[item.id];

                  let rowBorder = 'border-slate-800 hover:border-slate-700 bg-[#0F1115]';
                  if (isUserPost) rowBorder = 'border-2 border-orange-500 ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/40 bg-[#0F1115]';
                  else if (isAdminPost) rowBorder = 'border-amber-500/40 hover:border-amber-500/70 bg-gradient-to-r from-[#16130D] via-[#0F1115] to-[#0F1115]';
                  else if (isSOSAlert) rowBorder = 'border-rose-500/40 hover:border-rose-500/70 bg-gradient-to-r from-[#160E12] via-[#0F1115] to-[#0F1115]';
                  else if (isPotholeFix) rowBorder = 'border-sky-500/40 hover:border-sky-500/70 bg-[#0F1115]';

                  const elements = [
                    <motion.div
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className={`border rounded-xl p-2.5 sm:px-3 sm:py-2.5 shadow-md transition relative ${rowBorder} ${
                        isNew ? 'animate-new-feed-highlight' : ''
                      }`}
                    >
                    <div className="space-y-2">
                      {/* Top Badges & Meta Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 flex items-center space-x-1.5 flex-wrap gap-y-1">
                          {isNew && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0">
                              ✦ NEW
                            </span>
                          )}
                          <span className="text-xs shrink-0">
                            {isUserPost ? '👤' : isAdminPost ? '🛡️' : isPotholeFix ? '🔨' : isSOSAlert ? '🆘' : '✅'}
                          </span>
                          <span className="font-extrabold text-white text-xs truncate max-w-[160px] sm:max-w-xs">
                            {isUserPost ? getUserPostDisplayName(item) : item.author}
                          </span>
                          {isUserPost && (
                            <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0">
                              ⚠️ USER POST
                            </span>
                          )}
                          {item.postedByAdminName && (
                            <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center space-x-1">
                              <span>🛡️ By {item.postedByAdminName}</span>
                            </span>
                          )}
                          {!item.postedByAdminName && item.approvedByAdminName && (
                            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 flex items-center space-x-1">
                              <span>✅ Approved by {item.approvedByAdminName}</span>
                            </span>
                          )}
                          {item.eventSubType && item.eventSubType !== 'Admin post' && (
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                              (item.category === 'crash' || item.eventSubType.toLowerCase().includes('crash'))
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {item.eventSubType}
                            </span>
                          )}
                          {item.verified && (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1 rounded shrink-0">
                              VERIFIED
                            </span>
                          )}
                          {item.location && (
                            <span className="text-[10px] text-amber-400 font-semibold truncate max-w-[140px]">
                              📍 {item.location}
                            </span>
                          )}
                          <span className="text-cyan-300/90 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this dispatch">
                            <Eye className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                            <span>{formatViewsShort(getItemViews(item, liveViewsMap))}</span>
                          </span>
                          <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center space-x-1 text-[10px] font-mono shrink-0">
                            <Clock className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                            <span>{formatReadableDateTime(item.timestamp)}</span>
                          </span>
                        </div>

                        {/* Small Photo Thumbnail for Condensed Dispatch */}
                        {(() => {
                          const img = getItemMediaImage(item);
                          return img ? (
                            <div className="shrink-0 self-start">
                              <IncidentImagePreview
                                imageUrl={img}
                                title={item.author || item.location || 'Dispatch Photo'}
                                location={item.location}
                                description={item.content}
                                timestamp={item.timestamp}
                                category={item.category || item.eventSubType}
                                variant="row-thumb"
                                onOpenLightbox={setLightboxData}
                              />
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Content Text - Clean display of full dispatch details on wider screens */}
                      <p className="text-xs sm:text-[13px] text-slate-100 leading-relaxed break-words whitespace-pre-line font-normal">
                        {cleanTrafficText(item.content)}
                      </p>

                      {/* Admin Audit Trail (Staff Only) */}
                      <AdminAuditBadge isAdmin={isUserAdmin} feedItem={item} variant="compact" className="mt-1" />

                      {/* Action buttons bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-1.5 w-full min-w-0 border-t border-slate-800/80 pt-1.5">
                        {/* Line 1 on mobile: Verify & Status */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Motorist Incident Verification */}
                          <button
                            type="button"
                            onClick={() => handleVerifyIncident(item)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-sm ${
                              verifiedItemIds[item.id]
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40'
                            }`}
                            title={verifiedItemIds[item.id] ? "You verified this incident" : "Verify incident as motorist on scene"}
                          >
                            <ThumbsUp className={`w-3 h-3 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                            <span>{verifiedItemIds[item.id] ? '✓ Verified' : 'Verify'}</span>
                            {((item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)) > 0 && (
                              <span className="font-mono text-[9px] bg-slate-900 px-1 rounded">
                                {(item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)}
                              </span>
                            )}
                          </button>

                          {/* Status Dropdown Button (Still Active or Cleared) */}
                          {renderStatusButton(item, 'sm')}
                        </div>

                        {/* Line 2 on mobile: Rest of the icons under it */}
                        <div className="flex items-center flex-wrap gap-1 sm:gap-1.5 min-w-0">
                          {/* Post to WhatsApp */}
                          <button
                            type="button"
                            onClick={() => {
                              handleRecordView(item.id);
                              handlePostToWhatsApp(item);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 shrink-0 transition cursor-pointer shadow-sm ${
                              copiedItemIds[item.id]
                                ? 'bg-[#25D366] text-slate-950 font-black'
                                : 'bg-[#071910] hover:bg-[#0c291b] text-emerald-300 hover:text-white'
                            }`}
                            title="Post to WhatsApp"
                          >
                            {copiedItemIds[item.id] ? (
                              <>
                                <Check className="w-3 h-3 text-slate-950" />
                                <span>Opening...</span>
                              </>
                            ) : (
                              <>
                                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                                <span className="hidden xs:inline">WhatsApp</span>
                              </>
                            )}
                          </button>

                          {/* WhatsApp Custom Modal */}
                          {onOpenShareToWhatsApp && (
                            <button
                              type="button"
                              onClick={() => onOpenShareToWhatsApp({ feedItem: item })}
                              className="bg-[#050608] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 p-1.5 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                              title="Customize & Share to WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                          )}

                          {/* Share to X */}
                          {onOpenShareToX && (
                            <button
                              type="button"
                              onClick={() => onOpenShareToX({ feedItem: item })}
                              className="bg-[#050608] hover:bg-black text-slate-300 hover:text-white border border-slate-700/80 p-1.5 rounded-lg text-[10px] font-bold flex items-center shrink-0 transition cursor-pointer"
                              title="Share to X"
                            >
                              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            </button>
                          )}

                          {/* Expand / Collapse Details */}
                          <button
                            type="button"
                            onClick={() => toggleExpandItem(item.id)}
                            className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center shrink-0 transition cursor-pointer border ${
                              isExpanded
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-[#050608] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
                            }`}
                            title={isExpanded ? 'Collapse Details' : 'Expand Media & #Tags'}
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180 text-amber-300' : ''}`} />
                          </button>

                          {/* Admin Edit Button */}
                          {isUserAdmin && (
                            <button
                              type="button"
                              onClick={() => setEditingFeedItem(item)}
                              className="bg-[#050608] hover:bg-amber-950/60 text-amber-400 border border-slate-700/80 hover:border-amber-500/40 p-1.5 rounded-lg text-[10px] font-bold shrink-0 transition cursor-pointer"
                              title="Edit dispatch info, fix typos (Admin)"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}

                          {/* Delete Dispatch Button: Disabled for motorists, enabled for admin or author */}
                          {(() => {
                            const canDelete = canUserDeleteFeedItem(item);
                            if (confirmingDeleteId === item.id) {
                              return (
                                <div className="flex items-center space-x-1 shrink-0 animate-fadeIn">
                                  <button
                                    type="button"
                                    disabled={!canDelete}
                                    onClick={() => handleDeleteFeedItem(item.id)}
                                    className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black px-1.5 py-1 rounded-lg text-[9px] flex items-center space-x-0.5 transition cursor-pointer shadow"
                                  >
                                    <span>Delete?</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmingDeleteId(null)}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-lg text-[9px] font-bold transition cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                disabled={!canDelete}
                                onClick={() => {
                                  if (canDelete) setConfirmingDeleteId(item.id);
                                }}
                                className={`p-1 rounded-lg text-[10px] shrink-0 transition ${
                                  canDelete
                                    ? 'text-slate-500 hover:text-rose-400 cursor-pointer'
                                    : 'text-slate-600 cursor-not-allowed opacity-40'
                                }`}
                                title={canDelete ? "Delete dispatch" : "Delete disabled: Only administrators or the original composer can delete this post"}
                                aria-label={canDelete ? "Delete dispatch" : "Delete disabled"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-2 animate-fadeIn text-xs">
                        <p className="text-xs text-slate-200 leading-relaxed font-normal bg-[#050608]/80 p-2 rounded-lg border border-slate-800">
                          {cleanTrafficText(item.content)}
                        </p>

                        {(() => {
                          const img = getItemMediaImage(item);
                          return img ? (
                            <IncidentImagePreview
                              imageUrl={img}
                              title={item.author || item.location || 'Dispatch Photo'}
                              location={item.location}
                              description={item.content}
                              timestamp={item.timestamp}
                              category={item.category || item.eventSubType}
                              variant="expanded-banner"
                              onOpenLightbox={setLightboxData}
                            />
                          ) : null;
                        })()}

                        {/* Extracted tags */}
                        {(() => {
                          const tags = generateITrafficHashtags(item);
                          return (
                            <div className="flex flex-wrap items-center gap-1 pt-1">
                              <span className="text-[10px] font-bold text-amber-400/90 flex items-center space-x-1 mr-0.5">
                                <Hash className="w-3 h-3 text-amber-400" />
                                <span>Tags:</span>
                              </span>
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredDispatches.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div
                        key="techrix-feed-card-dispatch-condensed"
                        layout="position"
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <TechrixFeedAdCard variant="compact" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredDispatches.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-dispatch-condensed"
                        layout="position"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                      >
                        <ShareAppFeedCard variant="compact" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedDispatchAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, false);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          ) : viewMode === 'bullets' ? (
            /* ========================================================= */
            /* BULLET POINTS VIEW: Community & Patrol Dispatches         */
            /* ========================================================= */
            <div className="bg-[#0B0D13] border border-slate-800/90 rounded-2xl divide-y divide-slate-800/60 overflow-hidden shadow-xl">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredDispatches.flatMap((item, index) => {
                  const isNew = newlyAddedItemIds.has(item.id);
                  const isUserPost = Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user';
                  const isAdminPost = !isUserPost && isItemAdminPost(item);
                  const isPotholeFix = item.category === 'pothole' || item.content.toLowerCase().includes('pothole') || item.author.includes('POTHOLE');
                  const isSOSAlert = item.content.toLowerCase().includes('sos') || item.content.toLowerCase().includes('emergency') || item.content.toLowerCase().includes('motorist');
                  const isExpanded = !!expandedItemIds[item.id];

                  let bulletDotClass = 'bg-emerald-400 shadow-emerald-400/50';
                  if (isUserPost) bulletDotClass = 'bg-orange-500 shadow-orange-500/80 ring-2 ring-orange-400';
                  else if (isAdminPost) bulletDotClass = 'bg-amber-400 shadow-amber-400/50';
                  else if (isSOSAlert) bulletDotClass = 'bg-rose-500 shadow-rose-500/50';
                  else if (isPotholeFix) bulletDotClass = 'bg-sky-400 shadow-sky-400/50';

                  const elements = [
                    <motion.div
                      key={item.id}
                      id={`dispatch-item-bullet-${item.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className={`transition-colors duration-200 ${
                        isNew
                          ? 'animate-new-feed-highlight bg-amber-500/10'
                          : isUserPost
                          ? 'bg-orange-950/20 border-l-4 border-l-orange-500'
                          : highlightedItemId === item.id
                          ? 'bg-amber-950/40'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* The Bullet Row: Displays the second line of the card */}
                      <div
                        onClick={() => toggleExpandItem(item.id)}
                        className="flex items-start gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 cursor-pointer select-text group"
                        title="Click to view dispatch details & actions"
                      >
                        {/* Colored Bullet Dot */}
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 shadow-sm ring-1 ring-white/20 ${bulletDotClass}`} />

                        {isNew && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5 animate-pulse">
                            NEW
                          </span>
                        )}
                        {isUserPost ? (
                          <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-black tracking-wide shrink-0 mt-0.5 flex items-center space-x-1">
                            <span>👤</span>
                            <span className="truncate max-w-[130px] sm:max-w-[160px]">{getUserPostDisplayName(item)}</span>
                          </span>
                        ) : isAdminPost ? (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                            ADMIN
                          </span>
                        ) : null}

                        {/* Second line text: dispatch content */}
                        <p className={`${fontStyles.bulletBody} flex-1 min-w-0 break-words group-hover:text-white transition-colors`}>
                          {cleanTrafficText(item.content)}
                        </p>

                        {/* Right indicators: Date & Time, Expand Chevron */}
                        <div className="flex items-center space-x-1.5 shrink-0 ml-1 text-slate-400 text-[10px] font-mono select-none">
                          <span className="inline-flex items-center text-slate-400 text-[9.5px] sm:text-[10px] whitespace-nowrap">
                            <Clock className="w-2.5 h-2.5 mr-1 text-slate-500 shrink-0" />
                            {formatReadableDateTime(item.timestamp)}
                          </span>
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-cyan-400' : 'group-hover:text-slate-300'}`} />
                        </div>
                      </div>

                      {/* Expandable details on demand */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 sm:px-4 sm:pb-3.5 bg-slate-900/70 border-t border-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                              <span className="font-extrabold text-white text-xs">
                                {isUserPost ? '👤 ' + getUserPostDisplayName(item) : (isAdminPost ? '🛡️ ' : isPotholeFix ? '🔨 ' : isSOSAlert ? '🆘 ' : '✅ ') + item.author}
                              </span>
                              {item.location && (
                                <span className="font-bold text-amber-300 text-xs flex items-center space-x-1">
                                  <span>📍</span>
                                  <span>{item.location}</span>
                                </span>
                              )}
                              <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60 text-[10px] font-mono">
                                <Clock className="w-2.5 h-2.5 inline mr-1 text-slate-500" />
                                {formatReadableDateTime(item.timestamp)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleVerifyIncident(item);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer ${
                                  verifiedItemIds[item.id]
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black'
                                    : 'text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                                }`}
                              >
                                <ThumbsUp className={`w-3 h-3 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                                <span>{verifiedItemIds[item.id] ? 'Verified' : 'Verify'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRecordView(item.id);
                                  handlePostToWhatsApp(item);
                                }}
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] flex items-center space-x-1 transition cursor-pointer"
                              >
                                <WhatsAppIcon className="w-3 h-3 text-slate-950" />
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </div>

                          {(() => {
                            const img = getItemMediaImage(item);
                            return img ? (
                              <div className="pt-1">
                                <IncidentImagePreview
                                  imageUrl={img}
                                  title={item.author || item.location || 'Dispatch Photo'}
                                  location={item.location}
                                  description={item.content}
                                  timestamp={item.timestamp}
                                  category={item.category}
                                  variant="row-thumb"
                                  onOpenLightbox={setLightboxData}
                                />
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredDispatches.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div key="techrix-feed-card-dispatch-bullets" layout="position" className="p-2 sm:p-2.5 bg-[#080B10]">
                        <TechrixFeedAdCard variant="compact" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredDispatches.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-dispatch-bullets"
                        layout="position"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                        className="p-2 sm:p-2.5 bg-[#080B10]"
                      >
                        <ShareAppFeedCard variant="compact" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedDispatchAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, false);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredDispatches.flatMap((item, index) => {
                  const isNew = newlyAddedItemIds.has(item.id);
                  const isUserPost = Boolean((item as any).isUserPost) || isItemUserPost(item) || isItemUnverifiedUserPost(item) || item.source === 'community' || item.source === 'user';
                  const isAdminPost = !isUserPost && isItemAdminPost(item);
                  const isApprovedUser = item.source === 'community' || item.author.includes('Follower') || item.author.includes('Verified');
                  const isPotholeFix = item.category === 'pothole' || item.content.toLowerCase().includes('pothole') || item.author.includes('POTHOLE');
                  const isSOSAlert = item.content.toLowerCase().includes('sos') || item.content.toLowerCase().includes('emergency') || item.content.toLowerCase().includes('motorist');

                  const elements = [
                    <motion.div
                      key={item.id}
                      id={`feed-item-${item.id}`}
                      layout="position"
                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`bg-[#0F1115] border rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl transition-all duration-500 ${
                        isNew ? 'animate-new-feed-highlight' : ''
                      } ${
                      item.highlightGold
                        ? 'ring-2 ring-amber-400 border-amber-400 bg-gradient-to-r from-[#1A140B] via-[#14120D] to-[#0F1115] shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                        : isUserPost
                        ? 'border-2 border-orange-500 ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/40 bg-[#0F1115]'
                        : isAdminPost
                        ? 'border-amber-500/40 bg-gradient-to-r from-[#0F1115] via-[#14120D] to-[#0F1115]'
                        : isPotholeFix
                        ? 'border-sky-500/30'
                        : isSOSAlert
                        ? 'border-rose-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    } ${
                      highlightedItemId === item.id
                        ? 'ring-2 ring-amber-400 shadow-2xl shadow-amber-500/30 border-amber-400 bg-gradient-to-r from-[#1A140B] via-[#0F1115] to-[#0F1115]'
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                          isUserPost
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                            : isAdminPost
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : isPotholeFix
                            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                            : isSOSAlert
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {isUserPost ? '👤' : isAdminPost ? '🛡️' : isPotholeFix ? '🔨' : isSOSAlert ? '🆘' : '✅'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                            {isNew && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse shrink-0">
                                ✦ NEW
                              </span>
                            )}
                            {highlightedItemId === item.id && (
                              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center space-x-1 animate-pulse shrink-0 shadow mr-1">
                                <span>★ TARGETED ALERT</span>
                              </span>
                            )}
                            {item.highlightGold && (
                              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow ring-1 ring-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping inline-block" />
                                <span>🟡 PINNED HIGHLIGHT</span>
                              </span>
                            )}
                            {item.broadcastTopRed && (
                              <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow animate-pulse">
                                <span>🔴 BROADCAST</span>
                              </span>
                            )}
                            {isUserPost ? (
                              checkIsAdminVerified(item) ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center space-x-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{getUserPostDisplayName(item)}</span>
                                  <span className="text-[9px] bg-emerald-950 px-1 rounded text-emerald-300 font-black uppercase">Verified</span>
                                </span>
                              ) : (
                                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center space-x-1">
                                  <span>👤</span>
                                  <span>{getUserPostDisplayName(item)}</span>
                                </span>
                              )
                            ) : (
                              <span className="font-extrabold text-white text-xs sm:text-sm">{item.author}</span>
                            )}
                            {isUserPost ? (
                              checkIsAdminVerified(item) ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-[9px] font-black uppercase px-1.5 py-0.2 rounded flex items-center space-x-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>ADMIN VERIFIED</span>
                                </span>
                              ) : (
                                <span className="bg-orange-500/20 text-orange-300 border border-orange-500/50 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                                  ⚠️ USER POST
                                </span>
                              )
                            ) : item.verified ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.2 rounded">
                                VERIFIED
                              </span>
                            ) : null}
                            {item.postedByAdminName && (
                              <span className="bg-cyan-950/70 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-sm">
                                <span>🛡️ Posted by {item.postedByAdminName}</span>
                                {item.postedByAdminRole && (
                                  <span className="text-[9px] font-mono text-cyan-200 uppercase bg-cyan-500/20 px-1 rounded">
                                    {item.postedByAdminRole.replace('_', ' ')}
                                  </span>
                                )}
                              </span>
                            )}
                            {!item.postedByAdminName && item.approvedByAdminName && (
                              <span className="bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-sm">
                                <span>✅ Approved by {item.approvedByAdminName}</span>
                                {item.approvedByAdminRole && (
                                  <span className="text-[9px] font-mono text-emerald-200 uppercase bg-emerald-500/20 px-1 rounded">
                                    {item.approvedByAdminRole.replace('_', ' ')}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          {item.handle && (
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-[10px] text-slate-400 font-mono">{item.handle}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {item.eventSubType && item.eventSubType !== 'Admin post' && (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center space-x-1 ${
                            (item.category === 'crash' || item.eventSubType.toLowerCase().includes('crash'))
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            <span>{item.eventSubType}</span>
                          </span>
                        )}
                        {item.showOnLiveWatch && (
                          <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full text-[9px] font-black animate-pulse">
                            ● ON LIVE WATCH
                          </span>
                        )}
                        <span className="text-cyan-300/90 bg-cyan-950/70 px-2 py-0.5 rounded-lg border border-cyan-500/30 flex items-center space-x-1 text-[10px] font-bold font-mono shrink-0 shadow-sm" title="Actual verified views of this dispatch">
                          <Eye className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{formatViewsShort(getItemViews(item, liveViewsMap))} {getItemViews(item, liveViewsMap) === 1 ? 'view' : 'views'}</span>
                        </span>
                        <span className="bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>Alert Time: {formatReadableDateTime(item.timestamp)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Prominent Admin Verified or User Post Banner in General Warning / Advisory */}
                    {isUserPost && renderUserPostBanner(item, 'full')}

                    <p className={`${fontStyles.dispatchBody} font-normal`}>
                      {cleanTrafficText(item.content)}
                    </p>

                    {(() => {
                      const img = getItemMediaImage(item);
                      return img ? (
                        <IncidentImagePreview
                          imageUrl={img}
                          title={item.author || item.location || 'Dispatch Photo'}
                          location={item.location}
                          description={item.content}
                          timestamp={item.timestamp}
                          category={item.category || item.eventSubType}
                          variant="card-media"
                          onOpenLightbox={setLightboxData}
                        />
                      ) : null;
                    })()}

                    {/* Dynamic Extracted #Tags for Dispatches */}
                    {(() => {
                      const tags = generateITrafficHashtags(item);
                      return (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
                          <span className="text-[10px] font-bold text-amber-400/90 flex items-center space-x-1 mr-0.5">
                            <Hash className="w-3 h-3 text-amber-400" />
                            <span>Tags:</span>
                          </span>
                          {tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Admin Audit Trail for Staff Viewers */}
                    <AdminAuditBadge isAdmin={isUserAdmin} feedItem={item} variant="compact" className="my-1" />

                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 text-xs text-slate-400 w-full min-w-0">
                      {/* Line 1 on mobile: Verify & Status */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Motorist & Admin Incident Verification */}
                        {(() => {
                          const isPostAdminVerified = checkIsAdminVerified(item);
                          return (
                            <button
                              type="button"
                              onClick={() => handleVerifyIncident(item)}
                              disabled={isVerifyingItemId === item.id || (isUserAdmin ? isPostAdminVerified : !!verifiedItemIds[item.id])}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm ${
                                isPostAdminVerified
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                  : verifiedItemIds[item.id]
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-black'
                                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400'
                              }`}
                              title={
                                isPostAdminVerified
                                  ? "Officially verified by Admin"
                                  : isUserAdmin
                                  ? "Verify incident as Patrol Admin"
                                  : verifiedItemIds[item.id]
                                  ? "You verified this incident"
                                  : "Verify incident as motorist"
                              }
                            >
                              {isPostAdminVerified ? (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <ThumbsUp className={`w-3.5 h-3.5 ${verifiedItemIds[item.id] ? 'text-emerald-400 fill-emerald-400/20' : 'text-amber-400'}`} />
                              )}
                              <span>
                                {isPostAdminVerified
                                  ? '✓ Admin Verified'
                                  : isUserAdmin
                                  ? '🛡️ Verify as Admin'
                                  : verifiedItemIds[item.id]
                                  ? '✓ Verified by You'
                                  : 'Verify Incident'}
                              </span>
                              {((item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)) > 0 && (
                                <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.2 rounded">
                                  {(item.upvotes || 0) + (optimisticUpvotes[item.id] || 0)}
                                </span>
                              )}
                            </button>
                          );
                        })()}

                        {/* Status Dropdown Button (Still Active or Cleared) */}
                        {renderStatusButton(item, 'md')}
                      </div>

                      {/* Line 2 on mobile: Rest of the icons & actions under it */}
                      <div className="flex items-center flex-wrap gap-2 min-w-0">
                        {item.location && (
                          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-[11px]">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}

                        {/* Post to WhatsApp */}
                        <button
                          type="button"
                          onClick={() => {
                            handleRecordView(item.id);
                            handlePostToWhatsApp(item);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm ${
                            copiedItemIds[item.id]
                              ? 'bg-[#25D366] text-slate-950 font-black'
                              : 'bg-[#071910] hover:bg-[#0c291b] text-emerald-300 hover:text-white'
                          }`}
                          title="Post broadcast to WhatsApp"
                        >
                          {copiedItemIds[item.id] ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-slate-950" />
                              <span>✓ Opening WhatsApp...</span>
                            </>
                          ) : (
                            <>
                              <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                              <span>Post to WhatsApp</span>
                            </>
                          )}
                        </button>

                        {onOpenShareToWhatsApp && (
                          <button
                            type="button"
                            onClick={() => onOpenShareToWhatsApp({ feedItem: item })}
                            className="bg-[#050608] hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-slate-700/80 hover:border-emerald-500/40 p-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            title="Open WhatsApp customize modal"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          </button>
                        )}

                        {onOpenShareToX && (
                          <button
                            type="button"
                            onClick={() => onOpenShareToX({ feedItem: item })}
                            className="bg-[#050608] hover:bg-black text-slate-300 hover:text-white border border-slate-700/80 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition cursor-pointer"
                            title="Share this dispatch to X.com"
                          >
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            <span>Share to X</span>
                          </button>
                        )}

                        {isUserAdmin && (
                          <button
                            type="button"
                            onClick={() => setEditingFeedItem(item)}
                            className="bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                            title="Edit Broadcast (Admin Only)"
                          >
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* Delete Broadcast Button: Disabled for motorists, enabled for admin or author */}
                        {(() => {
                          const canDelete = canUserDeleteFeedItem(item);
                          if (confirmingDeleteId === item.id) {
                            return (
                              <div className="flex items-center space-x-1 animate-fadeIn">
                                <button
                                  type="button"
                                  disabled={!canDelete}
                                  onClick={() => handleDeleteFeedItem(item.id)}
                                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 transition cursor-pointer shadow-md"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Confirm?</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              disabled={!canDelete}
                              onClick={() => {
                                if (canDelete) setConfirmingDeleteId(item.id);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                                canDelete
                                  ? 'bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 cursor-pointer'
                                  : 'bg-slate-900/40 text-slate-600 border border-slate-800/80 cursor-not-allowed opacity-40'
                              }`}
                              title={canDelete ? "Delete Broadcast" : "Delete disabled: Only administrators or the original composer can delete this post"}
                              aria-label={canDelete ? "Delete Broadcast" : "Delete disabled"}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                  ];

                  const targetTechrixCardIndex = Math.min(2, filteredDispatches.length - 1);
                  if (index === targetTechrixCardIndex) {
                    elements.push(
                      <motion.div
                        key="techrix-feed-card-dispatch-detailed"
                        layout="position"
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="col-span-1 md:col-span-2"
                      >
                        <TechrixFeedAdCard variant="card" />
                      </motion.div>
                    );
                  }

                  const effectiveShareCardIndex = Math.min(shareCardPositionIndex, Math.max(0, filteredDispatches.length - 1));
                  if (index === effectiveShareCardIndex) {
                    const shareCardEl = (
                      <motion.div
                        key="share-app-feed-card-dispatch-detailed"
                        layout="position"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                        transition={{ layout: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
                        className="col-span-1 md:col-span-2"
                      >
                        <ShareAppFeedCard variant="card" isBubbledToTop={isShareCardBubbled && effectiveShareCardIndex === 0} />
                      </motion.div>
                    );
                    if (effectiveShareCardIndex === 0) {
                      elements.unshift(shareCardEl);
                    } else {
                      elements.push(shareCardEl);
                    }
                  }

                  if (targetInFeedDispatchAdIndices.includes(index)) {
                    const inFeedAd = renderInFeedAdBanner(index, true);
                    if (inFeedAd) elements.push(inFeedAd);
                  }

                  return elements;
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Bottom Ad Placement */}
          {renderBottomAdSection()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 REAL-TIME LIVE USERS ONLINE & TOTAL USERS VISITED (BOTTOM OF ALL FEEDS) */}
      {/* ========================================================================= */}
      <div
        id="live-feed-audience-stats-bar"
        className="bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-sm animate-fadeIn"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Real-time Stats Cards */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1.5">
            {/* 🟢 Live Users Online */}
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shadow-inner hover:border-emerald-500/60 transition"
              title="Active concurrent users currently connected to Live Traffic"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono font-black text-white text-xs sm:text-sm">
                {(activeUsersOnline || totalActiveViewers || 1).toLocaleString()}
              </span>
              <span className="text-emerald-300 text-xs font-bold whitespace-nowrap">
                Users Online
              </span>
              {feedOpenCount > 0 && (
                <span className="text-[10px] text-emerald-400/90 font-mono hidden md:inline px-1 py-0.2 rounded bg-emerald-900/60 border border-emerald-500/30">
                  {feedOpenCount} watching feed
                </span>
              )}
            </div>

            {/* 👁️ Total Platform / Feed Views */}
            <div
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 shadow-inner hover:border-cyan-500/50 transition"
              title="Cumulative verified platform views and motorist reach across South Africa"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono font-black text-white text-xs sm:text-sm">
                {(totalVisitors || 73000).toLocaleString()}
              </span>
              <span className="text-cyan-300 text-xs font-bold whitespace-nowrap">
                Total Platform Views
              </span>
            </div>

            {/* Nationwide Activity Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="font-semibold text-slate-200">SA Live Corridors</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[10px]">All 9 Provinces Connected</span>
            </div>
          </div>

          {/* Right: Live Connection Telemetry / Refresh */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPresenceInspectorOpen(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 hover:border-cyan-500/50 transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
              title="Inspect users who connected in the last 24 hours & real-time presence telemetry"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Connections &amp; Presence (24h)</span>
              <span className="sm:hidden text-[10px]">24h Presence</span>
            </button>

            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-800/60 border border-slate-700/40 text-[10px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Real-time Feed Sync</span>
            </div>
          </div>
        </div>
      </div>



      {/* Simple Text Post Modal with Photo Option */}
      {showQuickPostModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-2.5 sm:p-4 pt-3 sm:pt-6 pb-6 sm:pb-6 bg-[#0A0B0D]/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="bg-[#0F1115] border border-amber-500/40 rounded-2xl w-full max-w-lg h-auto max-h-[calc(100dvh-2rem)] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-300 my-auto shrink-0">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  {isUserAdmin ? <Radio className="w-4 h-4 text-amber-400" /> : <Send className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-1.5">
                    <span>{isUserAdmin ? "🛡️ Admin Patrol Dispatch" : "📢 Post Road Alert"}</span>
                    {isUserAdmin ? (
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-[9px] font-black text-emerald-300 uppercase tracking-widest">
                        Admin Broadcast
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-[9px] font-black text-amber-300 uppercase tracking-widest">
                        Community Motorist
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isUserAdmin
                      ? "Direct broadcast to Unified Live Feed (Auto-Approved with Admin Badge)" 
                      : "Post live road hazard or traffic update (displays with Unverified User Post banner)"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowQuickPostModal(false)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Verification Notice */}
            {isUserAdmin ? (
              <div className="bg-emerald-500/10 border-b border-emerald-500/25 p-2.5 px-4 flex items-center space-x-2.5 text-xs text-emerald-200 shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-400 uppercase tracking-wider">VERIFIED ADMIN PATROL: </span>
                  Your broadcast will immediately display at the top of the Live Feed and on the Corridor Watch.
                </div>
              </div>
            ) : (
              <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 px-4 flex items-start space-x-2.5 text-xs text-amber-200 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400 uppercase tracking-wider">LIVE MOTORIST POST: </span>
                  Your alert will post immediately to the Live Feed with a <strong>&quot;⚠️ NOT VERIFIED • USER POST&quot;</strong> safety banner until verified by official patrol command.
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePublishAdminDispatch} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Pulldown Selectors: Category & Corridor / Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Category / Alert Type Pulldown */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <Radio className="w-3.5 h-3.5 text-amber-400" />
                      <span>Alert Type</span>
                    </label>
                    <div className="relative">
                      <select
                        value={postCategoryType}
                        onChange={(e) => setPostCategoryType(e.target.value)}
                        className="w-full bg-[#050608] border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-400 font-semibold cursor-pointer pr-8 shadow-inner"
                      >
                        <option value="traffic report">🚦 Traffic Report</option>
                        <option value="crash">💥 Crash / Collision</option>
                        <option value="fatal crash">💀 Fatal Crash</option>
                        <option value="protest">📢 Protest / Road Blockade</option>
                        <option value="congestions">🚗 Congestions / Heavy Traffic</option>
                        <option value="congestion">🚗 Traffic Congestion</option>
                        <option value="spiking Alert">⚠️ Spiking Alert / Hazard</option>
                        <option value="crime scene">🚨 Crime Scene / Incident</option>
                        <option value="roadworks">🚧 Roadworks / Construction</option>
                        <option value="potholes">🕳️ Potholes / Road Damage</option>
                        <option value="veld_fire">🔥 Veld Fire / Heavy Smoke</option>
                        <option value="breakdown">🚛 Breakdown / Stalled Vehicle</option>
                        <option value="traffic_lights">🚥 Traffic Lights Out</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Location / Corridor Pulldown */}
                  <div>
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Location</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedCorridor}
                        onChange={(e) => setSelectedCorridor(e.target.value)}
                        className="w-full bg-[#050608] border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-white appearance-none focus:outline-none focus:border-amber-400 font-semibold cursor-pointer pr-8 shadow-inner"
                      >
                        <option value="No Location Selected">🌐 No Location Selected (General Advisory)</option>
                        <option value="N1 Highway">📍 N1 Highway (Pretoria - Midrand - JHB)</option>
                        <option value="N1 North (Pretoria / Polokwane)">📍 N1 North (Pretoria / Polokwane)</option>
                        <option value="N1 South (Midrand / JHB / Bloemfontein)">📍 N1 South (Midrand / JHB / Bloemfontein)</option>
                        <option value="N2 Corridor (Cape Town / Garden Route / KZN)">📍 N2 Corridor (Cape Town / Garden Route / KZN)</option>
                        <option value="N3 Corridor (JHB - Durban / Heidelberg)">📍 N3 Corridor (JHB - Durban / Heidelberg)</option>
                        <option value="N4 Highway (Pretoria - Witbank / Rustenburg)">📍 N4 Highway (Pretoria - Witbank / Rustenburg)</option>
                        <option value="N7 Highway (Cape Town - Malmesbury - Namibia)">📍 N7 Highway (Cape Town - Malmesbury - Namibia)</option>
                        <option value="N12 Freeway (East Rand / Alberton)">📍 N12 Freeway (East Rand / Alberton)</option>
                        <option value="N14 Highway (Krugersdorp / Centurion)">📍 N14 Highway (Krugersdorp / Centurion)</option>
                        <option value="R21 Highway (Pretoria - OR Tambo Airport)">📍 R21 Highway (Pretoria - OR Tambo Airport)</option>
                        <option value="R24 Highway (Airport Expressway)">📍 R24 Highway (Airport Expressway)</option>
                        <option value="R59 Corridor (Alberton / Vereeniging)">📍 R59 Corridor (Alberton / Vereeniging)</option>
                        <option value="M1 North / South (Johannesburg Freeway)">📍 M1 North / South (Johannesburg Freeway)</option>
                        <option value="M2 East / West Freeway">📍 M2 East / West Freeway</option>
                        <option value="Ben Schoeman Freeway">📍 Ben Schoeman Freeway</option>
                        <option value="Gauteng Highway Corridor">📍 Gauteng Highway Corridor</option>
                        <option value="KwaZulu-Natal Corridor (Durban / PMB)">📍 KwaZulu-Natal Corridor (Durban / PMB)</option>
                        <option value="Western Cape Corridor (Cape Town / N7 / N1 / N2)">📍 Western Cape Corridor (Cape Town / N7 / N1 / N2)</option>
                        <option value="Location">📍 Location (Custom Pin / Cross Street)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Specific Location / Ramp details */}
                <div>
                  <input
                    type="text"
                    value={specificLocation}
                    onChange={(e) => setSpecificLocation(e.target.value)}
                    placeholder="Specific Ramp / Landmark / Offramp (e.g. Near New Road Offramp, Left Lane)"
                    className="w-full bg-[#050608] border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none placeholder:text-slate-500 font-sans"
                  />
                </div>

                {/* Poster Attribution (Name & Surname) */}
                <div className="bg-[#0b1320] border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>Poster Attribution (Name &amp; Surname)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Displayed on feed
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">First Name</label>
                      <input
                        type="text"
                        value={dispatchFirstName}
                        onChange={(e) => setDispatchFirstName(e.target.value)}
                        placeholder="e.g. Charles"
                        className="w-full bg-[#050608] border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Surname</label>
                      <input
                        type="text"
                        value={dispatchSurname}
                        onChange={(e) => setDispatchSurname(e.target.value)}
                        placeholder="e.g. Odendaal"
                        className="w-full bg-[#050608] border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none font-sans"
                      />
                    </div>
                  </div>
                </div>

                {/* Text Message Area */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Incident Details & Road Conditions
                  </label>
                  <textarea
                    value={adminContent}
                    onChange={(e) => setAdminContent(e.target.value)}
                    rows={4}
                    placeholder={isUserAdmin ? "Type admin dispatch broadcast description..." : "Describe the hazard, location, and road conditions..."}
                    className="w-full bg-[#050608] border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 resize-none font-sans placeholder:text-slate-500 leading-relaxed"
                    autoFocus
                  />
                </div>

                {/* Option to Add Photo / Crash Evidence */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Photo Evidence / Crash Image (Optional)</span>
                    </label>
                    {adminPhotoUrl && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                        ✓ Photo Attached
                      </span>
                    )}
                  </div>

                  {adminPhotoUrl && adminPhotoUrl.trim() ? (
                    <div className="relative rounded-xl overflow-hidden border border-amber-500/40 aspect-[3.2/1] bg-[#050608] flex items-center justify-center">
                      <img src={adminPhotoUrl} alt="Attached Preview" className="w-full h-full object-cover object-center" />
                      <button
                        type="button"
                        onClick={() => setAdminPhotoUrl('')}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full text-xs transition cursor-pointer border border-red-400 shadow-lg z-10"
                        title="Remove Photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#050608] border border-slate-800 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Gallery / File Picker */}
                        <label className="bg-[#0D1422] hover:bg-[#152035] border border-amber-500/40 hover:border-amber-400 rounded-xl p-3 text-xs text-slate-200 font-bold flex items-center justify-center space-x-2 transition cursor-pointer text-center">
                          <Upload className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Gallery / Files</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAdminPhotoFileUpload}
                            className="hidden"
                          />
                        </label>

                        {/* Live Camera Capture */}
                        <label className="bg-[#0D1422] hover:bg-[#152035] border border-amber-500/40 hover:border-amber-400 rounded-xl p-3 text-xs text-slate-200 font-bold flex items-center justify-center space-x-2 transition cursor-pointer text-center">
                          <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Take Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleAdminPhotoFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Direct Image URL input */}
                      <input
                        type="url"
                        value={adminPhotoUrl}
                        onChange={(e) => setAdminPhotoUrl(e.target.value)}
                        placeholder="Or paste direct image URL (https://...)"
                        className="w-full bg-[#090E17] border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder:text-slate-500"
                      />

                      {/* Preset Sample Photos */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                            Quick Category Banners:
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            3.2:1 Panoramic
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                          {getAllCategoryConfigs().map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setAdminPhotoUrl(cat.imageUrl)}
                              className="py-1 px-2 bg-[#090E17] hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white transition cursor-pointer text-center shrink-0 flex items-center space-x-1"
                              title={`Use banner for ${cat.label}`}
                            >
                              <span>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Admin Broadcast & Highlighting Options - strictly rendered for admins only */}
                {isUserAdmin && (
                  <div className="bg-[#070A12] border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        <span>Admin Broadcast & Highlighting</span>
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-bold">Priority Display</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Broadcast on Top Red */}
                      <label 
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                          adminBroadcastTopRed 
                            ? 'bg-red-950/40 border-red-500/80 text-white ring-1 ring-red-500/40' 
                            : 'bg-[#0A0B0E] border-slate-800 text-slate-300 hover:border-red-500/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={adminBroadcastTopRed}
                          onChange={(e) => setAdminBroadcastTopRed(e.target.checked)}
                          className="mt-0.5 rounded border-red-500 text-red-600 focus:ring-red-500 w-4 h-4 bg-slate-950 cursor-pointer"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                            <span className="text-xs font-bold text-red-300">Broadcast on Top Red</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Puts emergency broadcast banner at the top of the feed with click-to-post navigation.
                          </p>
                        </div>
                      </label>

                      {/* Highlight with Gold Ring */}
                      <label 
                        className={`flex items-start space-x-2.5 p-2.5 rounded-lg border cursor-pointer transition select-none ${
                          adminHighlightGold 
                            ? 'bg-amber-950/40 border-amber-400 text-white ring-2 ring-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                            : 'bg-[#0A0B0E] border-slate-800 text-slate-300 hover:border-amber-400/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={adminHighlightGold}
                          onChange={(e) => setAdminHighlightGold(e.target.checked)}
                          className="mt-0.5 rounded border-amber-400 text-amber-500 focus:ring-amber-400 w-4 h-4 bg-slate-950 cursor-pointer"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-amber-300">Gold Ring Highlight</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Pins post as first post in area with a bright yellow/gold ring & glowing frame.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Social Cross-Posting Options */}
                <div className="bg-[#050608] border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Also Post / Share To Social Media
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* X.com Option */}
                    <label 
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition select-none ${
                        shareToX 
                          ? 'bg-slate-900 border-amber-500/60 text-white' 
                          : 'bg-[#0A0B0E] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={shareToX}
                        onChange={(e) => setShareToX(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-950 cursor-pointer"
                      />
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-black flex items-center justify-center text-white font-bold text-xs shrink-0 border border-slate-700">𝕏</span>
                        <span className="text-xs font-semibold truncate">Post to X.com</span>
                      </div>
                    </label>

                    {/* Facebook Option */}
                    <label 
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border cursor-pointer transition select-none ${
                        shareToFacebook 
                          ? 'bg-blue-950/30 border-blue-500/60 text-white' 
                          : 'bg-[#0A0B0E] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={shareToFacebook}
                        onChange={(e) => setShareToFacebook(e.target.checked)}
                        className="rounded border-slate-700 text-blue-500 focus:ring-blue-500 w-4 h-4 bg-slate-950 cursor-pointer"
                      />
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-[#1877F2] flex items-center justify-center text-white font-bold text-xs shrink-0">f</span>
                        <span className="text-xs font-semibold truncate">Share to Facebook</span>
                      </div>
                    </label>
                  </div>
                </div>

                {dispatchSuccessMsg && (
                  <p className="text-xs text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/30 p-2.5 rounded-xl">
                    {dispatchSuccessMsg}
                  </p>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-[#0F1115] flex items-center justify-end space-x-2 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setShowQuickPostModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#050608] border border-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPostingDispatch || !adminContent.trim()}
                  className={`font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg active:scale-95 touch-manipulation min-h-[40px] disabled:opacity-50 ${
                    isUserAdmin
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {isUserAdmin ? <Send className="w-4 h-4 shrink-0" /> : <Send className="w-4 h-4 shrink-0 text-slate-950" />}
                  <span>
                    {isPostingDispatch 
                      ? 'Publishing...' 
                      : isUserAdmin
                        ? '🛡️ Broadcast Live (Auto-Approved)' 
                        : '📢 Post Road Alert (Live)'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Admin Edit Feed Item Modal */}
      {editingFeedItem && (
        <EditFeedModal
          feedItem={editingFeedItem}
          isOpen={Boolean(editingFeedItem)}
          onClose={() => setEditingFeedItem(null)}
          onSave={async (id, fields) => {
            await handleEditFeedSave(id, fields);
            setEditingFeedItem(null);
          }}
        />
      )}

      {/* Full-Resolution Interactive Image Lightbox Modal */}
      {lightboxData && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxData)}
          data={lightboxData}
          onClose={() => setLightboxData(null)}
          onShareToWhatsApp={onOpenShareToWhatsApp ? (d) => {
            onOpenShareToWhatsApp({
              feedItem: {
                id: 'shared-photo',
                location: d.location || '',
                content: d.description || d.title || 'Traffic incident photo attachment',
                timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now(),
                mediaUrl: d.imageUrl,
                verified: true,
                author: d.author || 'LiveTraffic NPC'
              }
            });
          } : undefined}
        />
      )}
      {/* Feed Presence Connection & Telemetry Inspector (Admin/Moderator) */}
      <FeedPresenceInspector
        isOpen={isPresenceInspectorOpen}
        onClose={() => setIsPresenceInspectorOpen(false)}
        initialPresenceData={presenceData}
        feedOpenCount={feedOpenCount}
        isUserAdmin={isUserAdmin}
        onRefresh={refreshPresence}
      />
    </div>
  );
};
