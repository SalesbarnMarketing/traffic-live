import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wifi, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  Search, 
  Radio, 
  Activity, 
  Sliders, 
  Layers, 
  Filter, 
  X,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  History,
  Download,
  Mail,
  Phone,
  Building2,
  CalendarCheck,
  UserCheck,
  Shield,
  Car,
  Tag,
  ArrowDownToLine,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Zap,
  List,
  LayoutGrid
} from 'lucide-react';
import { 
  ActiveFeedSession, 
  FeedPresenceData, 
  Feed24hHistoryResponse, 
  UserConnection24hRecord, 
  FeedConnectionLog 
} from '../types';
import { apiFetch } from '../utils/apiClient';

export const AdminFeedConnectionsTab: React.FC = () => {
  // Main view mode: 'history24h' or 'live'
  const [activeMainTab, setActiveMainTab] = useState<'history24h' | 'live'>('history24h');
  
  // View density: 'condensed' (compact list) vs 'detailed' (spacious cards)
  const [viewDensity, setViewDensity] = useState<'condensed' | 'detailed'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_feed_view_density');
      if (saved === 'detailed' || saved === 'condensed') return saved;
    }
    return 'condensed'; // Default to condensed
  });
  
  // 24-Hour History state
  const [historyData, setHistoryData] = useState<Feed24hHistoryResponse | null>(null);
  const [historySubTab, setHistorySubTab] = useState<'users' | 'sessions'>('users');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historySearch, setHistorySearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'new_only' | 'admin' | 'patrol' | 'advertiser' | 'user'>('all');
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());
  const [expandedHistSessionIds, setExpandedHistSessionIds] = useState<Set<string>>(new Set());
  
  // Real-time live presence state
  const [presenceData, setPresenceData] = useState<FeedPresenceData | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'feed_only' | 'all' | 'all_24h' | 'new_only' | 'mobile' | 'desktop'>('feed_only');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());

  const handleSetViewDensity = (density: 'condensed' | 'detailed') => {
    setViewDensity(density);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_feed_view_density', density);
    }
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleHistSessionExpand = (sessId: string) => {
    setExpandedHistSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(sessId)) next.delete(sessId);
      else next.add(sessId);
      return next;
    });
  };

  const handleToggleAllUsers = () => {
    if (expandedUserIds.size === displayedUsers24h.length) {
      setExpandedUserIds(new Set());
    } else {
      setExpandedUserIds(new Set(displayedUsers24h.map((u, i) => u.id || `u-${i}`)));
    }
  };

  const handleToggleAllHistSessions = () => {
    if (expandedHistSessionIds.size === displayedSessions24h.length) {
      setExpandedHistSessionIds(new Set());
    } else {
      setExpandedHistSessionIds(new Set(displayedSessions24h.map((s, i) => s.sessionId || `s-${i}`)));
    }
  };

  const getAdminAuthHeaders = () => {
    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') : null;
    const adminUserStr = typeof window !== 'undefined' ? sessionStorage.getItem('adminUser') : null;
    let adminRole = 'admin';
    let adminEmail = '';
    if (adminUserStr) {
      try {
        const parsed = JSON.parse(adminUserStr);
        if (parsed.role) adminRole = parsed.role;
        if (parsed.email) adminEmail = parsed.email;
      } catch {}
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
    if (adminRole) headers['x-user-role'] = adminRole;
    if (adminEmail) headers['x-user-email'] = adminEmail;
    return headers;
  };

  const fetch24hHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await apiFetch<Feed24hHistoryResponse>('/api/feed/presence/history-24h', {
        headers: getAdminAuthHeaders(),
        cacheTtlMs: 10000,
        background: true
      });
      if (data && data.success) {
        setHistoryData(data);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn('Failed to fetch 24h connection history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchLiveConnections = async () => {
    setIsLoadingLive(true);
    try {
      const data = await apiFetch<FeedPresenceData>('/api/feed/presence', {
        headers: getAdminAuthHeaders(),
        cacheTtlMs: 15000,
        background: true
      });
      if (data) {
        setPresenceData(data);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.warn('Failed to fetch live presence connections:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetch24hHistory();
    fetchLiveConnections();
  }, []);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (activeMainTab === 'live') {
        fetchLiveConnections();
      } else {
        fetch24hHistory();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefreshEnabled, activeMainTab]);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2500);
    } catch {}
  };

  const toggleSessionExpand = (sessionId: string) => {
    setExpandedSessionIds(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (expandedSessionIds.size > 0 && expandedSessionIds.size === displayedLiveSessions.length) {
      setExpandedSessionIds(new Set());
    } else {
      const allIds = new Set(displayedLiveSessions.map((s, idx) => s.sessionId || `sess-${idx}`));
      setExpandedSessionIds(allIds);
    }
  };

  // Helper: Format duration in seconds
  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '< 1m';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    if (mins < 60) return `${mins}m ${rem > 0 ? `${rem}s` : ''}`.trim();
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins > 0 ? `${remMins}m` : ''}`.trim();
  };

  // Helper: Format relative time from ISO string or timestamp
  const formatRelativeTime = (isoString?: string | number) => {
    if (!isoString) return 'N/A';
    const timestamp = typeof isoString === 'number' ? isoString : new Date(isoString).getTime();
    if (isNaN(timestamp)) return 'N/A';
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 30) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs < 24) return `${hrs}h ${remMins > 0 ? `${remMins}m` : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Helper: Role badge styling
  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          bg: 'bg-purple-500/20',
          text: 'text-purple-300',
          border: 'border-purple-500/40',
          icon: <Shield className="w-3 h-3 text-purple-400" />
        };
      case 'admin':
        return {
          label: 'Operations Admin',
          bg: 'bg-sky-500/20',
          text: 'text-sky-300',
          border: 'border-sky-500/40',
          icon: <ShieldCheck className="w-3 h-3 text-sky-400" />
        };
      case 'patrol':
      case 'responder':
        return {
          label: 'Patrol / Responder',
          bg: 'bg-amber-500/20',
          text: 'text-amber-300',
          border: 'border-amber-500/40',
          icon: <Car className="w-3 h-3 text-amber-400" />
        };
      case 'advertiser':
        return {
          label: 'Advertiser Partner',
          bg: 'bg-rose-500/20',
          text: 'text-rose-300',
          border: 'border-rose-500/40',
          icon: <Tag className="w-3 h-3 text-rose-400" />
        };
      default:
        return {
          label: 'Motorist / Community',
          bg: 'bg-emerald-500/20',
          text: 'text-emerald-300',
          border: 'border-emerald-500/40',
          icon: <Users className="w-3 h-3 text-emerald-400" />
        };
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-cyan-400" />;
      case 'desktop':
      default:
        return <Monitor className="w-4 h-4 text-sky-400" />;
    }
  };

  // Animated NEW Badge
  const renderAnimatedNewBadge = () => (
    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/25 via-emerald-500/25 to-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.45)] animate-pulse shrink-0">
      <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
      <span>NEW</span>
    </span>
  );

  // Filter 24-hour users (sorted with new connections at the top)
  const users24h = historyData?.usersWhoConnected || [];
  const displayedUsers24h = users24h
    .filter(u => {
      if (roleFilter !== 'all') {
        if (roleFilter === 'new_only' && !u.isNew) return false;
        if (roleFilter === 'admin' && u.role !== 'admin' && u.role !== 'super_admin') return false;
        if (roleFilter === 'patrol' && u.role !== 'patrol' && u.role !== 'responder') return false;
        if (roleFilter === 'advertiser' && u.role !== 'advertiser') return false;
        if (roleFilter === 'user' && u.role !== 'user') return false;
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchName = (u.fullName || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.cellNumber || '').toLowerCase().includes(q);
        const matchRole = (u.role || '').toLowerCase().includes(q);
        const matchCompany = (u.companyName || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchRole || matchCompany;
      }
      return true;
    })
    .sort((a, b) => {
      // New connections at the top
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      const tA = new Date(a.lastConnectedAt || a.lastLoginAt || a.registeredAt).getTime();
      const tB = new Date(b.lastConnectedAt || b.lastLoginAt || b.registeredAt).getTime();
      return tB - tA;
    });

  // Filter 24-hour feed connection sessions (sorted with new sessions at the top)
  const sessions24h = historyData?.feedConnections || [];
  const displayedSessions24h = sessions24h
    .filter(s => {
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchUser = (s.userName || '').toLowerCase().includes(q);
        const matchEmail = (s.userEmail || '').toLowerCase().includes(q);
        const matchIp = (s.ip || '').toLowerCase().includes(q);
        const matchBrowser = (s.browser || '').toLowerCase().includes(q);
        const matchOs = (s.os || '').toLowerCase().includes(q);
        const matchRegion = (s.activeRegion || '').toLowerCase().includes(q);
        const matchRole = (s.userRole || '').toLowerCase().includes(q);
        return matchUser || matchEmail || matchIp || matchBrowser || matchOs || matchRegion || matchRole;
      }
      return true;
    })
    .sort((a, b) => {
      // New connections at the top
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      const tA = new Date(a.connectedAt).getTime();
      const tB = new Date(b.connectedAt).getTime();
      return tB - tA;
    });

  // Live sessions filtering with full 24h memory pool support
  const allSessions = presenceData?.activeSessions || [];
  const feedSessions = presenceData?.feedSessions || allSessions.filter(s => s.currentTab === 'feed');
  const all24hSessions = presenceData?.all24hSessions || [];
  const currentFeedCount = presenceData?.feedOpenCount ?? feedSessions.length;
  const currentTotalCount = presenceData?.totalActiveViewers ?? allSessions.length;
  const total24hInMemoryCount = all24hSessions.length > 0 ? all24hSessions.length : (historyData?.stats?.totalFeedSessions24h || allSessions.length);

  // Pick dataset according to filterTab
  const basePool = filterTab === 'all_24h' 
    ? (all24hSessions.length > 0 ? all24hSessions : allSessions)
    : filterTab === 'feed_only'
      ? feedSessions
      : (all24hSessions.length > 0 ? all24hSessions : allSessions);

  const displayedLiveSessions = basePool
    .filter(session => {
      if (filterTab === 'new_only' && !session.isNew) return false;
      if (filterTab === 'feed_only' && session.currentTab !== 'feed') return false;
      if (filterTab === 'all' && session.isOnlineNow === false) return false; // Online only
      if (filterTab === 'mobile' && session.deviceType !== 'mobile') return false;
      if (filterTab === 'desktop' && session.deviceType !== 'desktop') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchIp = session.ip.toLowerCase().includes(q);
        const matchBrowser = (session.browser || '').toLowerCase().includes(q);
        const matchOs = (session.os || '').toLowerCase().includes(q);
        const matchDevice = (session.deviceType || '').toLowerCase().includes(q);
        const matchUser = (session.userName || '').toLowerCase().includes(q);
        const matchRegion = (session.activeRegion || '').toLowerCase().includes(q);
        const matchFilter = (session.feedFilter || '').toLowerCase().includes(q);
        const matchView = (session.feedViewMode || '').toLowerCase().includes(q);
        return matchIp || matchBrowser || matchOs || matchDevice || matchUser || matchRegion || matchFilter || matchView;
      }
      return true;
    })
    .sort((a, b) => {
      // New connections strictly at top
      if (a.isNew && !b.isNew) return -1;
      if (!a.isNew && b.isNew) return 1;
      const tA = a.connectedTimestamp || new Date(a.connectedAt).getTime();
      const tB = b.connectedTimestamp || new Date(b.connectedAt).getTime();
      return tB - tA; // Newest connected timestamp at the top
    });

  // Export CSV of 24h connected users
  const handleExportCsv = () => {
    if (!users24h.length) return;
    const headers = ['Full Name', 'Role', 'Email', 'Cell Number', 'Company / Industry', 'Last Login (SAST)', 'Last Login (ISO/UTC)', 'Registered Date (SAST)'];
    const rows = users24h.map(u => [
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${(u.role || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.cellNumber || '').replace(/"/g, '""')}"`,
      `"${(u.companyName || '').replace(/"/g, '""')}"`,
      `"${(u.lastLoginFormattedSAST || '').replace(/"/g, '""')}"`,
      `"${(u.lastLoginAt || '').replace(/"/g, '""')}"`,
      `"${(u.registeredFormattedSAST || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trafficlive_connections_24h_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy text summary to clipboard
  const handleCopySummary = () => {
    if (!users24h.length) return;
    const lines = [
      `=== TRAFFIC LIVE: 24-HOUR USER CONNECTIONS REPORT ===`,
      `Generated At: ${historyData?.stats.currentTimeSAST || new Date().toLocaleString()} (SAST)`,
      `Total Logged-in Users in Last 24h: ${users24h.length}`,
      `Total Recorded Feed Sessions in Last 24h: ${sessions24h.length}`,
      `-------------------------------------------------------`,
      ...users24h.map((u, i) => `${i + 1}. ${u.fullName} [${u.role.toUpperCase()}]\n   - Email: ${u.email}\n   - Phone: ${u.cellNumber || 'N/A'}\n   - Last Connected: ${u.lastConnectedFormattedSAST || u.lastLoginFormattedSAST} (${formatRelativeTime(u.lastConnectedAt || u.lastLoginAt)})`),
      `-------------------------------------------------------`
    ];
    handleCopy(lines.join('\n'), 'summary');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Telemetry Header */}
      <div className="bg-[#0B0D13] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
              {activeMainTab === 'history24h' ? (
                <History className="w-6 h-6 text-cyan-400" />
              ) : (
                <Radio className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Live Feed Connections & Presence
                </h2>
                <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>24-Hour Connection Tracking</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit list of users and active feed viewer sessions connected in the last 24 hours with exact times and device metadata
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            {/* View Density Switcher: Condensed vs Detailed */}
            <div className="flex items-center bg-[#06070A] p-0.5 rounded-xl border border-slate-800 text-xs shadow-inner">
              <button
                onClick={() => handleSetViewDensity('condensed')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewDensity === 'condensed'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Condensed compact list view (high density)"
              >
                <List className="w-3.5 h-3.5" />
                <span>Condensed</span>
              </button>
              <button
                onClick={() => handleSetViewDensity('detailed')}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewDensity === 'detailed'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Detailed cards view (spacious cards)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Detailed</span>
              </button>
            </div>

            <button
              onClick={() => setAutoRefreshEnabled(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center space-x-1.5 ${
                autoRefreshEnabled
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle automatic polling"
            >
              <Activity className={`w-3.5 h-3.5 ${autoRefreshEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Auto-Refresh: {autoRefreshEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => {
                if (activeMainTab === 'history24h') fetch24hHistory();
                else fetchLiveConnections();
              }}
              disabled={isLoadingHistory || isLoadingLive}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 transition cursor-pointer border border-slate-700 active:scale-95"
              title="Refresh connection list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingHistory || isLoadingLive ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* View Switcher: 24-Hour History vs Real-Time Online */}
        <div className="flex items-center space-x-2 border-b border-slate-800/80 pt-2 pb-1">
          <button
            onClick={() => setActiveMainTab('history24h')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeMainTab === 'history24h'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Connected in Last 24 Hours ({users24h.length} Users)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('live')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeMainTab === 'live'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Real-Time Active Viewers ({currentFeedCount} Online)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: LAST 24 HOURS CONNECTION LOGS & LOGGED-IN USERS                    */}
      {/* ========================================================================= */}
      {activeMainTab === 'history24h' && (
        <div className="space-y-4">
          {/* Key Metric Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Registered Logins (24h)</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">{historyData?.stats.totalRegisteredLogins24h ?? users24h.length}</span>
                  <span className="text-xs text-cyan-400 font-bold">accounts</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Feed Sessions (24h)</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">{historyData?.stats.totalFeedSessions24h ?? sessions24h.length}</span>
                  <span className="text-xs text-emerald-400 font-bold">sessions</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Viewers Now</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">{currentFeedCount}</span>
                  <span className="text-xs text-purple-400 font-bold">online now</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Server Time (SAST)</p>
                <p className="text-xs font-bold text-amber-300 truncate">
                  {historyData?.stats.currentTimeSAST || new Date().toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })}
                </p>
                <p className="text-[10px] text-slate-500">Johannesburg (UTC+2)</p>
              </div>
            </div>
          </div>

          {/* Sub-Tabs: Registered Users vs Feed Sessions + Search & Export */}
          <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Sub-tab selection */}
              <div className="flex items-center space-x-1.5 bg-[#06070A] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setHistorySubTab('users')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                    historySubTab === 'users'
                      ? 'bg-cyan-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Registered Users ({users24h.length})</span>
                </button>
                <button
                  onClick={() => setHistorySubTab('sessions')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                    historySubTab === 'sessions'
                      ? 'bg-emerald-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Feed Sessions Log ({sessions24h.length})</span>
                </button>
              </div>

              {/* Action Buttons: Export CSV and Copy Summary */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportCsv}
                  disabled={users24h.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center space-x-1.5 active:scale-95"
                  title="Download CSV table of all users who connected in last 24h"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={handleCopySummary}
                  disabled={users24h.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center space-x-1.5 active:scale-95"
                  title="Copy formatted 24h connection summary to clipboard"
                >
                  {copiedText === 'summary' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Chips & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/60">
              {historySubTab === 'users' && (
                <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px] pb-1 sm:pb-0">
                  <span className="text-slate-500 font-bold flex items-center space-x-1 mr-1">
                    <Filter className="w-3 h-3" />
                    <span>Filter:</span>
                  </span>
                  <button
                    onClick={() => setRoleFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      roleFilter === 'all'
                        ? 'bg-slate-700 text-white font-black'
                        : 'bg-[#06070A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    All ({users24h.length})
                  </button>
                  {users24h.filter(u => u.isNew).length > 0 && (
                    <button
                      onClick={() => setRoleFilter('new_only')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1 ${
                        roleFilter === 'new_only'
                          ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-amber-500/40 animate-pulse'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>New ({users24h.filter(u => u.isNew).length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setRoleFilter('admin')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      roleFilter === 'admin'
                        ? 'bg-sky-500 text-slate-950 font-black'
                        : 'bg-[#06070A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Admins ({users24h.filter(u => u.role === 'admin' || u.role === 'super_admin').length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('patrol')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      roleFilter === 'patrol'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-[#06070A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Patrol ({users24h.filter(u => u.role === 'patrol' || u.role === 'responder').length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('advertiser')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      roleFilter === 'advertiser'
                        ? 'bg-rose-500 text-slate-950 font-black'
                        : 'bg-[#06070A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Advertisers ({users24h.filter(u => u.role === 'advertiser').length})
                  </button>
                  <button
                    onClick={() => setRoleFilter('user')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      roleFilter === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-[#06070A] text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Motorists ({users24h.filter(u => u.role === 'user').length})
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 flex-1 max-w-md min-w-[240px]">
                <div className="flex items-center space-x-2 flex-1 bg-[#06070A] border border-slate-800 rounded-xl px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder={historySubTab === 'users' ? "Search users by name, email, phone, role..." : "Search sessions by device, IP, user, region..."}
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {historySearch && (
                    <button onClick={() => setHistorySearch('')} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {historySubTab === 'users' && displayedUsers24h.length > 0 && viewDensity === 'condensed' && (
                  <button
                    onClick={handleToggleAllUsers}
                    className="px-2.5 py-1.5 bg-[#06070A] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm"
                    title={expandedUserIds.size === displayedUsers24h.length ? 'Roll up / Collapse all rows' : 'Expand all rows'}
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline">
                      {expandedUserIds.size === displayedUsers24h.length ? 'Roll Up All' : 'Expand All'}
                    </span>
                  </button>
                )}

                {historySubTab === 'sessions' && displayedSessions24h.length > 0 && viewDensity === 'condensed' && (
                  <button
                    onClick={handleToggleAllHistSessions}
                    className="px-2.5 py-1.5 bg-[#06070A] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm"
                    title={expandedHistSessionIds.size === displayedSessions24h.length ? 'Roll up / Collapse all rows' : 'Expand all rows'}
                  >
                    <ChevronsUpDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden md:inline">
                      {expandedHistSessionIds.size === displayedSessions24h.length ? 'Roll Up All' : 'Expand All'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LIST OF REGISTERED USERS CONNECTED IN LAST 24 HOURS */}
          {historySubTab === 'users' && (
            <div className="space-y-3">
              {displayedUsers24h.length === 0 ? (
                <div className="bg-[#0B0D13] border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-300">No users found matching current filters</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No registered user accounts logged in or active within the last 24 hours matching &quot;{historySearch}&quot;.
                  </p>
                </div>
              ) : viewDensity === 'condensed' ? (
                /* CONDENSED VIEW: Compact high-density list */
                <div className="space-y-2">
                  {displayedUsers24h.map((user, idx) => {
                    const badge = getRoleBadge(user.role);
                    const userKey = user.id || `user-hist-${idx}`;
                    const isExpanded = expandedUserIds.has(userKey);

                    return (
                      <div
                        key={userKey}
                        className={`rounded-2xl transition shadow-md overflow-hidden border ${
                          user.isNew 
                            ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/25 via-[#0B0D13] to-[#0B0D13] shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                            : 'bg-[#0B0D13] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div 
                          onClick={() => toggleUserExpand(userKey)}
                          className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-900/40 transition select-none"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-xs uppercase shrink-0 shadow">
                              {user.fullName ? user.fullName.charAt(0) : 'U'}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
                                  {user.fullName}
                                </span>
                                {user.isNew && renderAnimatedNewBadge()}
                                {user.isOnlineNow && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Online Now</span>
                                  </span>
                                )}
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                  {badge.icon}
                                  <span>{badge.label}</span>
                                </span>
                              </div>

                              <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                                <span className="truncate max-w-[200px] text-slate-300">{user.email}</span>
                                {user.cellNumber && (
                                  <span className="text-slate-400 font-mono hidden sm:inline">{user.cellNumber}</span>
                                )}
                                {user.companyName && (
                                  <span className="text-slate-500 hidden md:inline">• {user.companyName}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold text-cyan-300">
                                {user.lastConnectedFormattedSAST || user.lastLoginFormattedSAST}
                              </p>
                              <p className="text-[10px] text-slate-500">{formatRelativeTime(user.lastConnectedAt || user.lastLoginAt)}</p>
                            </div>
                            <div className="p-1 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-slate-800/60 space-y-2.5 bg-[#08090D] text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5">
                              <div className="p-2.5 rounded-xl bg-[#06070A] border border-slate-800/70 flex items-center justify-between">
                                <div className="truncate">
                                  <p className="text-[10px] uppercase text-slate-500 font-bold">Email Address</p>
                                  <p className="text-slate-200 truncate text-xs font-mono">{user.email}</p>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleCopy(user.email, `email-${user.id}`); }}
                                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                                  title="Copy Email"
                                >
                                  {copiedText === `email-${user.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>

                              <div className="p-2.5 rounded-xl bg-[#06070A] border border-slate-800/70 flex items-center justify-between">
                                <div className="truncate">
                                  <p className="text-[10px] uppercase text-slate-500 font-bold">Cell Number</p>
                                  <p className="text-slate-200 truncate text-xs font-mono">{user.cellNumber || 'Not provided'}</p>
                                </div>
                                {user.cellNumber && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCopy(user.cellNumber || '', `cell-${user.id}`); }}
                                    className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                                    title="Copy Phone"
                                  >
                                    {copiedText === `cell-${user.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>

                              <div className="p-2.5 rounded-xl bg-[#06070A] border border-slate-800/70">
                                <p className="text-[10px] uppercase text-slate-500 font-bold">Account Registration</p>
                                <p className="text-slate-200 truncate text-xs">{user.registeredFormattedSAST}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                              <span>Account Status: <strong className="text-emerald-400 uppercase">{user.status}</strong></span>
                              <span className="font-mono text-[10px]">User ID: {user.id}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* DETAILED VIEW: Spacious 2-Column Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedUsers24h.map((user, idx) => {
                    const badge = getRoleBadge(user.role);
                    return (
                      <div
                        key={user.id || `user-hist-${idx}`}
                        className={`rounded-2xl p-4 transition shadow-lg space-y-3 relative overflow-hidden border ${
                          user.isNew 
                            ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/25 via-[#0B0D13] to-[#0B0D13] shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                            : 'bg-[#0B0D13] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Header: Avatar, Name, Role Badge, New Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-sm uppercase shrink-0 shadow">
                              {user.fullName ? user.fullName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <h4 className="text-sm font-black text-white">{user.fullName}</h4>
                                {user.isNew && renderAnimatedNewBadge()}
                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                  {badge.icon}
                                  <span>{badge.label}</span>
                                </span>
                                {user.isOnlineNow && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Online Now</span>
                                  </span>
                                )}
                              </div>
                              {user.companyName && (
                                <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                  <span>{user.companyName}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Relative time indicator */}
                          <div className="text-right shrink-0">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300">
                              {formatRelativeTime(user.lastLoginAt)}
                            </span>
                          </div>
                        </div>

                        {/* Login Timestamp Highlights */}
                        <div className="bg-[#06070A] border border-slate-800/80 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 flex items-center space-x-1.5">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-semibold">Last Connection Time (SAST):</span>
                            </span>
                            <span className="font-mono font-bold text-white text-xs">
                              {user.lastConnectedFormattedSAST || user.lastLoginFormattedSAST}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                            <span>UTC Timestamp:</span>
                            <span className="truncate max-w-[200px]" title={user.lastLoginAt}>
                              {user.lastLoginAt || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Contact & Registration Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                            <div className="flex items-center space-x-1.5 truncate">
                              <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate text-slate-300 text-[11px]" title={user.email}>{user.email}</span>
                            </div>
                            <button
                              onClick={() => handleCopy(user.email, `email-${user.id}`)}
                              className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
                              title="Copy Email"
                            >
                              {copiedText === `email-${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/50">
                            <div className="flex items-center space-x-1.5 truncate">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate text-slate-300 text-[11px]">{user.cellNumber || 'Not provided'}</span>
                            </div>
                            {user.cellNumber && (
                              <button
                                onClick={() => handleCopy(user.cellNumber || '', `cell-${user.id}`)}
                                className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedText === `cell-${user.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Card Footer: Account Registered & Status */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                          <span className="flex items-center space-x-1">
                            <CalendarCheck className="w-3 h-3 text-slate-600" />
                            <span>Registered: {user.registeredFormattedSAST}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="uppercase">{user.status}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* LIST OF FEED SESSIONS LOGGED IN LAST 24 HOURS */}
          {historySubTab === 'sessions' && (
            <div className="space-y-3">
              {displayedSessions24h.length === 0 ? (
                <div className="bg-[#0B0D13] border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No connection sessions recorded yet in 24h log</p>
                  <p className="text-xs text-slate-500">Sessions populate as users open highway feed or app corridors.</p>
                </div>
              ) : viewDensity === 'condensed' ? (
                /* CONDENSED VIEW: High-density compact session rows */
                <div className="space-y-2">
                  {displayedSessions24h.map((sess, idx) => {
                    const badge = getRoleBadge(sess.userRole);
                    const sessKey = sess.sessionId || `sess-hist-${idx}`;
                    const isExpanded = expandedHistSessionIds.has(sessKey);

                    return (
                      <div
                        key={sessKey}
                        className={`rounded-2xl transition shadow-md overflow-hidden border ${
                          sess.isNew 
                            ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/25 via-[#0B0D13] to-[#0B0D13] shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                            : 'bg-[#0B0D13] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div 
                          onClick={() => toggleHistSessionExpand(sessKey)}
                          className="p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-900/40 transition select-none"
                        >
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                              {getDeviceIcon(sess.deviceType)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[220px]">
                                  {sess.userName || 'Anonymous Motorist'}
                                </span>
                                {sess.isNew && renderAnimatedNewBadge()}
                                {sess.isOnlineNow && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Online Now</span>
                                  </span>
                                )}
                                {sess.userRole && (
                                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.icon}
                                    <span>{badge.label}</span>
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {sess.browser} • {sess.os} • <span className="text-cyan-400 font-mono">{sess.ip}</span> • {sess.activeRegion || 'Gauteng'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300">
                              ⏱️ {formatDuration(sess.durationSeconds)}
                            </span>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-mono font-bold text-cyan-300">
                                {new Date(sess.connectedAt).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })}
                              </p>
                              <p className="text-[10px] text-slate-500">{formatRelativeTime(sess.connectedAt)}</p>
                            </div>
                            <div className="p-1 text-slate-400">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 pt-0 border-t border-slate-800/60 space-y-2.5 bg-[#08090D] text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
                              <div className="bg-[#06070A] border border-slate-800/70 p-2.5 rounded-xl">
                                <p className="text-[10px] font-bold uppercase text-slate-500">Connected Time (SAST)</p>
                                <p className="font-mono text-cyan-300 font-bold text-xs truncate">
                                  {new Date(sess.connectedAt).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })}
                                </p>
                              </div>
                              <div className="bg-[#06070A] border border-slate-800/70 p-2.5 rounded-xl">
                                <p className="text-[10px] font-bold uppercase text-slate-500">Last Active (SAST)</p>
                                <p className="font-mono text-emerald-300 font-bold text-xs truncate">
                                  {new Date(sess.lastActiveAt).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })}
                                </p>
                              </div>
                              <div className="bg-[#06070A] border border-slate-800/70 p-2.5 rounded-xl">
                                <p className="text-[10px] font-bold uppercase text-slate-500">User Email</p>
                                <p className="text-slate-200 truncate text-xs">{sess.userEmail || 'Anonymous'}</p>
                              </div>
                              <div className="bg-[#06070A] border border-slate-800/70 p-2.5 rounded-xl">
                                <p className="text-[10px] font-bold uppercase text-slate-500">Region</p>
                                <p className="text-cyan-300 font-semibold truncate text-xs">{sess.activeRegion || 'Gauteng'}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                              <span className="truncate max-w-[200px]">IP: {sess.ip}</span>
                              <span className="truncate max-w-[240px]">ID: {sess.sessionId}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* DETAILED VIEW: Spacious 2-Column Cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayedSessions24h.map((sess, idx) => {
                    const badge = getRoleBadge(sess.userRole);
                    return (
                      <div
                        key={sess.sessionId || `session-hist-${idx}`}
                        className={`rounded-2xl p-4 transition shadow-lg space-y-3 border ${
                          sess.isNew 
                            ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/25 via-[#0B0D13] to-[#0B0D13] shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                            : 'bg-[#0B0D13] border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                              {getDeviceIcon(sess.deviceType)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <h4 className="text-sm font-bold text-white truncate max-w-[180px]">
                                  {sess.userName || 'Anonymous Motorist'}
                                </h4>
                                {sess.isNew && renderAnimatedNewBadge()}
                                {sess.isOnlineNow && (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                    <span>Online Now</span>
                                  </span>
                                )}
                                {sess.userRole && (
                                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.icon}
                                    <span>{badge.label}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {sess.browser} • {sess.os}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-300">
                              ⏱️ {formatDuration(sess.durationSeconds)}
                            </span>
                          </div>
                        </div>

                        {/* Session Timestamps */}
                        <div className="bg-[#06070A] border border-slate-800/80 rounded-xl p-2.5 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500">Connected At</p>
                            <p className="font-mono text-cyan-300 font-bold text-[11px]">
                              {new Date(sess.connectedAt).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })} SAST
                            </p>
                            <p className="text-[10px] text-slate-500">{formatRelativeTime(sess.connectedAt)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-500">Last Active At</p>
                            <p className="font-mono text-emerald-300 font-bold text-[11px]">
                              {new Date(sess.lastActiveAt).toLocaleTimeString("en-ZA", { timeZone: "Africa/Johannesburg" })} SAST
                            </p>
                            <p className="text-[10px] text-slate-500">{formatRelativeTime(sess.lastActiveAt)}</p>
                          </div>
                        </div>

                        {/* Network and Region Row */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase text-slate-500">Region:</span>
                            <span className="text-slate-300 font-semibold">{sess.activeRegion || 'Gauteng'}</span>
                          </div>
                          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-400">
                            <span>{sess.ip}</span>
                            {sess.ip && !sess.ip.includes('•') && (
                              <button
                                onClick={() => handleCopy(sess.ip, `ip-${sess.sessionId}`)}
                                className="text-slate-500 hover:text-white cursor-pointer"
                                title="Copy IP"
                              >
                                {copiedText === `ip-${sess.sessionId}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: REAL-TIME ACTIVE VIEWERS (ONLINE NOW)                              */}
      {/* ========================================================================= */}
      {activeMainTab === 'live' && (
        <div className="space-y-4">
          {/* Guaranteed Zero-DB Persistence Policy Card */}
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-sky-200">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sky-300">
                Ephemeral In-Memory Telemetry Guarantee (Zero Disk / Database Persistence)
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                In accordance with privacy and performance directives, real-time live connection sessions (IP addresses, user agents, active layout tabs, and heartbeat timers) are maintained inside volatile Node.js RAM (`Map&lt;string, ActiveFeedSession&gt;`). Live sessions automatically expire within 25 seconds of disconnection or tab closure.
              </p>
            </div>
          </div>

          {/* Real-time Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Viewing Highway Feed</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">{currentFeedCount}</span>
                  <span className="text-xs text-emerald-400 font-bold">active now</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Across Portal</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">{currentTotalCount}</span>
                  <span className="text-xs text-sky-400 font-bold">sessions</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mobile Motorists</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {allSessions.filter(s => s.deviceType === 'mobile').length}
                  </span>
                  <span className="text-xs text-amber-400 font-bold">handheld</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Desktop / Dispatch</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {allSessions.filter(s => s.deviceType === 'desktop').length}
                  </span>
                  <span className="text-xs text-cyan-400 font-bold">desktops</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar for Live Sessions */}
          <div className="bg-[#0B0D13] border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center space-x-1.5 bg-[#06070A] p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto max-w-full">
              <button
                onClick={() => setFilterTab('feed_only')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                  filterTab === 'feed_only'
                    ? 'bg-emerald-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Feed Viewers ({feedSessions.length})
              </button>
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                  filterTab === 'all'
                    ? 'bg-sky-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Online Now ({allSessions.length})
              </button>
              {basePool.filter(s => s.isNew).length > 0 && (
                <button
                  onClick={() => setFilterTab('new_only')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap flex items-center space-x-1 ${
                    filterTab === 'new_only'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-amber-950/40 text-amber-300 hover:text-amber-200 border border-amber-500/40 animate-pulse'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>New ({basePool.filter(s => s.isNew).length})</span>
                </button>
              )}
              {all24hSessions.length > 0 && (
                <button
                  onClick={() => setFilterTab('all_24h')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap ${
                    filterTab === 'all_24h'
                      ? 'bg-purple-500 text-white shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="View all connections retained in memory over the last 24 hours"
                >
                  24h Memory ({all24hSessions.length})
                </button>
              )}
              <button
                onClick={() => setFilterTab('mobile')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap hidden sm:inline-block ${
                  filterTab === 'mobile'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile
              </button>
              <button
                onClick={() => setFilterTab('desktop')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer whitespace-nowrap hidden sm:inline-block ${
                  filterTab === 'desktop'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Desktop
              </button>
            </div>

            <div className="flex items-center space-x-2 flex-1 max-w-md min-w-[200px]">
              <div className="flex items-center space-x-2 flex-1 bg-[#06070A] border border-slate-800 rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by IP, browser, device, OS, user role, region..."
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {displayedLiveSessions.length > 0 && (
                <button
                  onClick={handleToggleAll}
                  className="px-2.5 py-1.5 bg-[#06070A] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm"
                  title={expandedSessionIds.size === displayedLiveSessions.length ? 'Roll up / Collapse all cards' : 'Roll down / Expand all cards'}
                >
                  <ChevronsUpDown className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">
                    {expandedSessionIds.size === displayedLiveSessions.length ? 'Roll Up All' : 'Expand All'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid of Live Sessions */}
          <div className="space-y-2.5">
            {displayedLiveSessions.length === 0 ? (
              <div className="bg-[#0B0D13] border border-slate-800/80 rounded-2xl p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <Wifi className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-300">No active viewer sessions currently connected</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When motorists or officers open the highway feed, their connection appears here in real time.
                </p>
              </div>
            ) : (
              displayedLiveSessions.map((session, idx) => {
                const isExpanded = expandedSessionIds.has(session.sessionId);
                const isFeedActive = session.currentTab === 'feed';
                const isOnline = session.isOnlineNow !== false;

                return (
                  <div
                    key={session.sessionId || `session-${idx}`}
                    className={`rounded-2xl transition shadow-lg overflow-hidden border ${
                      session.isNew 
                        ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/25 via-[#0B0D13] to-[#0B0D13] shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                        : 'bg-[#0B0D13] border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => toggleSessionExpand(session.sessionId)}
                      className="p-3.5 flex flex-wrap items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-900/40 transition select-none"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          {getDeviceIcon(session.deviceType)}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="text-xs font-mono font-bold text-white">
                              {session.ip}
                            </span>
                            {session.isNew && renderAnimatedNewBadge()}
                            {isOnline ? (
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isFeedActive 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isFeedActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                                <span className="capitalize">{session.currentTab} Tab</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                <span>24h Memory History</span>
                              </span>
                            )}
                            {session.userName && (
                              <span className="text-xs text-cyan-300 font-semibold truncate max-w-[140px]">
                                {session.userName}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {session.browser} • {session.os}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Connected {formatRelativeTime(session.connectedTimestamp)}
                        </span>
                        <div className="p-1 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 pt-0 border-t border-slate-800/60 space-y-3 bg-[#08090D]">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3">
                          <div className="bg-[#06070A] border border-slate-800/70 p-2 rounded-xl">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Browser & Engine</p>
                            <p className="font-semibold text-slate-200 truncate">{session.browser}</p>
                          </div>
                          <div className="bg-[#06070A] border border-slate-800/70 p-2 rounded-xl">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Operating System</p>
                            <p className="font-semibold text-slate-200 truncate">{session.os}</p>
                          </div>
                          <div className="bg-[#06070A] border border-slate-800/70 p-2 rounded-xl">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Region</p>
                            <p className="font-semibold text-cyan-300 truncate">{session.activeRegion || 'Gauteng'}</p>
                          </div>
                          <div className="bg-[#06070A] border border-slate-800/70 p-2 rounded-xl">
                            <p className="text-[10px] font-bold uppercase text-slate-500">Screen Resolution</p>
                            <p className="font-semibold text-slate-300 truncate">{session.screenResolution || '1920x1080'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Heartbeat: {formatRelativeTime(session.lastHeartbeatTimestamp)} ({session.heartbeatCount} pings)</span>
                          <span className="font-mono text-slate-500 text-[10px] truncate max-w-[240px]">
                            {session.sessionId}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
