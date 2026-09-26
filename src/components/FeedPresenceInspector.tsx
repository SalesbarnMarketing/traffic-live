import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Globe, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  Search, 
  Radio, 
  Activity, 
  Download,
  History,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Shield,
  Calendar
} from 'lucide-react';
import { ActiveFeedSession, FeedPresenceData, Feed24hHistoryResponse, UserConnection24hRecord, FeedConnectionLog } from '../types';
import { apiFetch } from '../utils/apiClient';

interface FeedPresenceInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  initialPresenceData?: FeedPresenceData | null;
  feedOpenCount?: number;
  isUserAdmin?: boolean;
}

export const FeedPresenceInspector: React.FC<FeedPresenceInspectorProps> = ({
  isOpen,
  onClose,
  onRefresh,
  initialPresenceData,
  feedOpenCount = 1,
  isUserAdmin = false
}) => {
  // Allow inspection if isUserAdmin or admin session token exists
  const hasAdminAccess = Boolean(
    isUserAdmin ||
    (typeof window !== 'undefined' && 
      (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || sessionStorage.getItem('adminUser')))
  );

  const [activeMainTab, setActiveMainTab] = useState<'history24h' | 'live'>('history24h');
  const [historySubTab, setHistorySubTab] = useState<'users' | 'sessions'>('users');
  const [presenceData, setPresenceData] = useState<FeedPresenceData | null>(initialPresenceData || null);
  const [historyData, setHistoryData] = useState<Feed24hHistoryResponse | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'patrol' | 'advertiser' | 'user'>('all');
  const [filterTab, setFilterTab] = useState<'all' | 'feed_only' | 'mobile' | 'desktop'>('feed_only');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const getAdminAuthHeaders = () => {
    const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') : null;
    const adminUserStr = typeof window !== 'undefined' ? sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser') : null;
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

  const fetchLiveConnections = async () => {
    setIsLoadingLive(true);
    try {
      const data = await apiFetch<FeedPresenceData>('/api/feed/presence', {
        headers: getAdminAuthHeaders(),
        cacheTtlMs: 10000,
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

  useEffect(() => {
    if (isOpen) {
      fetch24hHistory();
      fetchLiveConnections();
      const interval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (activeMainTab === 'live') {
          fetchLiveConnections();
        } else {
          fetch24hHistory();
        }
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeMainTab]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2500);
    } catch {}
  };

  // -------------------------------------------------------------
  // Filter & Format logic for 24h history
  // -------------------------------------------------------------
  const users24h = historyData?.usersWhoConnected || [];
  const sessions24h = historyData?.feedConnections || [];

  const displayedUsers24h = users24h.filter(user => {
    if (roleFilter !== 'all') {
      if (roleFilter === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') return false;
      if (roleFilter === 'patrol' && user.role !== 'patrol' && user.role !== 'responder') return false;
      if (roleFilter === 'advertiser' && user.role !== 'advertiser') return false;
      if (roleFilter === 'user' && user.role !== 'user' && user.role !== 'motorist') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (user.fullName || '').toLowerCase().includes(q);
      const matchEmail = (user.email || '').toLowerCase().includes(q);
      const matchPhone = (user.cellNumber || '').toLowerCase().includes(q);
      const matchRole = (user.role || '').toLowerCase().includes(q);
      const matchCompany = (user.companyName || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRole || matchCompany;
    }
    return true;
  });

  const displayedSessions24h = sessions24h.filter(session => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIp = (session.ip || '').toLowerCase().includes(q);
      const matchBrowser = (session.browser || '').toLowerCase().includes(q);
      const matchOs = (session.os || '').toLowerCase().includes(q);
      const matchDevice = (session.deviceType || '').toLowerCase().includes(q);
      const matchUser = (session.userName || '').toLowerCase().includes(q);
      const matchEmail = (session.userEmail || '').toLowerCase().includes(q);
      const matchRegion = (session.activeRegion || '').toLowerCase().includes(q);
      return matchIp || matchBrowser || matchOs || matchDevice || matchUser || matchEmail || matchRegion;
    }
    return true;
  });

  // -------------------------------------------------------------
  // Filter & Format logic for live sessions
  // -------------------------------------------------------------
  const allSessions = presenceData?.activeSessions || [];
  const feedSessions = presenceData?.feedSessions || allSessions.filter(s => s.currentTab === 'feed');
  const currentFeedCount = presenceData?.feedOpenCount ?? feedOpenCount;
  const currentTotalCount = presenceData?.totalActiveViewers ?? allSessions.length;

  const displayedLiveSessions = allSessions.filter(session => {
    if (filterTab === 'feed_only' && session.currentTab !== 'feed') return false;
    if (filterTab === 'mobile' && session.deviceType !== 'mobile') return false;
    if (filterTab === 'desktop' && session.deviceType !== 'desktop') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchIp = session.ip.toLowerCase().includes(q);
      const matchBrowser = session.browser.toLowerCase().includes(q);
      const matchOs = session.os.toLowerCase().includes(q);
      const matchDevice = session.deviceType.toLowerCase().includes(q);
      const matchUser = (session.userName || '').toLowerCase().includes(q);
      const matchRegion = (session.activeRegion || '').toLowerCase().includes(q);
      const matchFilter = (session.feedFilter || '').toLowerCase().includes(q);
      const matchView = (session.feedViewMode || '').toLowerCase().includes(q);
      return matchIp || matchBrowser || matchOs || matchDevice || matchUser || matchRegion || matchFilter || matchView;
    }
    return true;
  });

  const formatElapsed = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    if (mins < 60) return `${mins}m ${remSecs}s ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m ago`;
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString).getTime();
    if (isNaN(d)) return 'N/A';
    return formatElapsed(d);
  };

  const formatDurationFriendly = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const remSec = sec % 60;
    if (mins < 60) return `${mins}m ${remSec}s`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  };

  const getDeviceIcon = (deviceType: 'mobile' | 'tablet' | 'desktop') => {
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'admin':
        return {
          label: 'Admin / Command',
          bg: 'bg-sky-500/15',
          border: 'border-sky-500/40',
          text: 'text-sky-300',
          icon: <Shield className="w-3 h-3 text-sky-400" />
        };
      case 'patrol':
      case 'responder':
        return {
          label: 'Patrol / Responder',
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/40',
          text: 'text-amber-300',
          icon: <ShieldCheck className="w-3 h-3 text-amber-400" />
        };
      case 'advertiser':
        return {
          label: 'Advertiser / Sponsor',
          bg: 'bg-rose-500/15',
          border: 'border-rose-500/40',
          text: 'text-rose-300',
          icon: <Building2 className="w-3 h-3 text-rose-400" />
        };
      default:
        return {
          label: 'Motorist / User',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/40',
          text: 'text-emerald-300',
          icon: <UserCheck className="w-3 h-3 text-emerald-400" />
        };
    }
  };

  const handleExportCsv = () => {
    if (!users24h.length) return;
    const headers = ['Full Name', 'Role', 'Email', 'Phone', 'Company', 'Last Connection Time (SAST)', 'Last Login Time (SAST)', 'Registration Time (SAST)', 'Status'];
    const rows = users24h.map(u => [
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      `"${u.role}"`,
      `"${u.email}"`,
      `"${u.cellNumber || ''}"`,
      `"${(u.companyName || '').replace(/"/g, '""')}"`,
      `"${u.lastConnectedFormattedSAST || u.lastLoginFormattedSAST || ''}"`,
      `"${u.lastLoginFormattedSAST || ''}"`,
      `"${u.registeredFormattedSAST || ''}"`,
      `"${u.status || 'active'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traffic-live-connected-users-24h-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    if (!users24h.length) return;
    const lines = [
      `=== TRAFFIC LIVE: 24-HOUR USER CONNECTIONS REPORT ===`,
      `Generated At: ${historyData?.stats?.currentTimeSAST || new Date().toLocaleString()} (SAST)`,
      `Total Logged-in Users in Last 24h: ${users24h.length}`,
      `Total Recorded Feed Sessions in Last 24h: ${sessions24h.length}`,
      `-------------------------------------------------------`,
      ...users24h.map((u, i) => `${i + 1}. ${u.fullName} [${u.role.toUpperCase()}]\n   - Email: ${u.email}\n   - Phone: ${u.cellNumber || 'N/A'}\n   - Last Connected: ${u.lastConnectedFormattedSAST || u.lastLoginFormattedSAST} (${formatRelativeTime(u.lastConnectedAt || u.lastLoginAt)})`),
      `-------------------------------------------------------`
    ];
    handleCopy(lines.join('\n'), 'summary');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-[#0B0D13] border border-slate-700/80 w-full max-w-5xl max-h-[94vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0F121A] flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md">
              {activeMainTab === 'history24h' ? (
                <History className="w-5 h-5 text-cyan-400" />
              ) : (
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Live Feed Connections & Presence
                </h3>
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold">
                  <Clock className="w-3 h-3" />
                  <span>24-Hour Connection History</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audit list of users who connected in the last 24 hours with exact times and live active presence
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (activeMainTab === 'history24h') fetch24hHistory();
                else fetchLiveConnections();
                if (onRefresh) onRefresh();
              }}
              disabled={isLoadingHistory || isLoadingLive}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center space-x-1.5 text-xs font-bold active:scale-95"
              title="Refresh connection list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingHistory || isLoadingLive ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary View Switcher: 24h Connected Users vs Real-Time Online */}
        <div className="px-4 py-2 bg-[#0D1017] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveMainTab('history24h')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeMainTab === 'history24h'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Connected in Last 24 Hours ({users24h.length} Users)</span>
            </button>

            <button
              onClick={() => setActiveMainTab('live')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeMainTab === 'live'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Real-Time Online ({currentFeedCount} Viewers)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="font-mono text-[11px] text-amber-300">
                {historyData?.stats?.currentTimeSAST || new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST
              </span>
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: LAST 24 HOURS CONNECTION LOGS & USERS            */}
        {/* ========================================================= */}
        {activeMainTab === 'history24h' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:thin]">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-3 flex items-center space-x-3 shadow">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400 truncate">Users in 24h</p>
                  <p className="text-lg font-black text-white">{historyData?.stats?.totalRegisteredLogins24h ?? users24h.length}</p>
                </div>
              </div>

              <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-3 flex items-center space-x-3 shadow">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400 truncate">Feed Sessions (24h)</p>
                  <p className="text-lg font-black text-white">{historyData?.stats?.totalFeedSessions24h ?? sessions24h.length}</p>
                </div>
              </div>

              <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-3 flex items-center space-x-3 shadow">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-slate-400 truncate">Active Now</p>
                  <p className="text-lg font-black text-white">{currentFeedCount}</p>
                </div>
              </div>

              <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-3 flex items-center space-x-3 shadow">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0 truncate">
                  <p className="text-[10px] font-bold uppercase text-slate-400 truncate">Server Time</p>
                  <p className="text-xs font-mono font-bold text-amber-300 truncate">Johannesburg (SAST)</p>
                </div>
              </div>
            </div>

            {/* Sub-Tabs & Action Bar */}
            <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-1.5 bg-[#080A0F] p-1 rounded-xl border border-slate-800 text-xs">
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

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportCsv}
                    disabled={users24h.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                    title="Export CSV of all users connected in last 24 hours"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>

                  <button
                    onClick={handleCopySummary}
                    disabled={users24h.length === 0}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center space-x-1.5 active:scale-95 disabled:opacity-50"
                    title="Copy formatted 24h connection summary to clipboard"
                  >
                    {copiedText === 'summary' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied Report!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Copy Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {historySubTab === 'users' && (
                  <div className="flex items-center space-x-1.5 text-xs flex-wrap gap-y-1">
                    <button
                      onClick={() => setRoleFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        roleFilter === 'all'
                          ? 'bg-slate-700 text-white font-black'
                          : 'bg-[#080A0F] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      All ({users24h.length})
                    </button>
                    <button
                      onClick={() => setRoleFilter('admin')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        roleFilter === 'admin'
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-[#080A0F] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Admins ({users24h.filter(u => u.role === 'admin' || u.role === 'super_admin').length})
                    </button>
                    <button
                      onClick={() => setRoleFilter('patrol')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        roleFilter === 'patrol'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-[#080A0F] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Patrol ({users24h.filter(u => u.role === 'patrol' || u.role === 'responder').length})
                    </button>
                    <button
                      onClick={() => setRoleFilter('advertiser')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        roleFilter === 'advertiser'
                          ? 'bg-rose-500 text-slate-950 font-black'
                          : 'bg-[#080A0F] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Advertisers ({users24h.filter(u => u.role === 'advertiser').length})
                    </button>
                    <button
                      onClick={() => setRoleFilter('user')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        roleFilter === 'user'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-[#080A0F] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Motorists ({users24h.filter(u => u.role === 'user' || u.role === 'motorist').length})
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2 flex-1 max-w-sm min-w-[220px]">
                  <div className="flex items-center space-x-2 flex-1 bg-[#080A0F] border border-slate-800 rounded-xl px-3 py-1.5">
                    <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={historySubTab === 'users' ? "Search users by name, email, phone..." : "Search sessions by device, IP, user..."}
                      className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* List of Registered Users Connected in Last 24 Hours */}
            {historySubTab === 'users' && (
              <div className="space-y-3">
                {displayedUsers24h.length === 0 ? (
                  <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-300">No users found matching current filters</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {searchQuery ? `No user accounts matching "${searchQuery}".` : 'No registered user accounts logged in or active in the last 24 hours.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedUsers24h.map((user, idx) => {
                      const badge = getRoleBadge(user.role);
                      const connTimeStr = user.lastConnectedFormattedSAST || user.lastLoginFormattedSAST;
                      const relTimeStr = formatRelativeTime(user.lastConnectedAt || user.lastLoginAt);

                      return (
                        <div
                          key={user.id || `user-hist-${idx}`}
                          className="bg-[#0F121A] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 transition shadow-lg space-y-3 relative overflow-hidden"
                        >
                          {/* Top Header: Avatar, Name, Role Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-black text-sm uppercase shrink-0 shadow">
                                {user.fullName ? user.fullName.charAt(0) : 'U'}
                              </div>
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <h4 className="text-sm font-black text-white">{user.fullName}</h4>
                                  <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                                    {badge.icon}
                                    <span>{badge.label}</span>
                                  </span>
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
                                {relTimeStr}
                              </span>
                            </div>
                          </div>

                          {/* Connection Timestamp Highlights */}
                          <div className="bg-[#080A0F] border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 flex items-center space-x-1.5">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="font-semibold">Connected Time (SAST):</span>
                              </span>
                              <span className="font-mono font-bold text-white text-xs">
                                {connTimeStr}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                              <span>Account Status:</span>
                              <span className="text-emerald-400 font-bold uppercase">{user.status || 'Active'}</span>
                            </div>
                          </div>

                          {/* Contact Details */}
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
                                <span className="truncate text-slate-300 text-[11px] font-mono">{user.cellNumber || 'No Cell'}</span>
                              </div>
                              {user.cellNumber && (
                                <button
                                  onClick={() => handleCopy(user.cellNumber, `phone-${user.id}`)}
                                  className="text-slate-400 hover:text-white p-1 transition cursor-pointer"
                                  title="Copy Phone"
                                >
                                  {copiedText === `phone-${user.id}` ? (
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

            {/* List of Feed Sessions Recorded in Last 24 Hours */}
            {historySubTab === 'sessions' && (
              <div className="space-y-3">
                {displayedSessions24h.length === 0 ? (
                  <div className="bg-[#0F121A] border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <Activity className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-300">No session logs found in last 24h</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Feed connection history records appear here as visitors interact with the live highway corridors.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedSessions24h.map((session, idx) => {
                      const connDate = new Date(session.connectedAt);
                      const connFormatted = !isNaN(connDate.getTime())
                        ? connDate.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "medium" })
                        : session.connectedAt;

                      return (
                        <div
                          key={session.sessionId || idx}
                          className="bg-[#0F121A] border border-slate-800 hover:border-slate-700 rounded-xl p-3 sm:p-3.5 transition space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2.5 flex-wrap">
                              <span className="font-mono text-xs font-bold text-white bg-[#080A0F] border border-slate-800 px-2.5 py-0.5 rounded-lg">
                                {session.ip}
                              </span>

                              {session.userName && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {session.userName} ({session.userRole || 'User'})
                                </span>
                              )}

                              <div className="flex items-center space-x-1 text-xs text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                                {getDeviceIcon(session.deviceType)}
                                <span className="capitalize">{session.deviceType}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-cyan-300">{session.os}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 text-xs font-mono">
                              <span className="text-slate-400">Duration:</span>
                              <span className="text-emerald-400 font-bold">{formatDurationFriendly(session.durationSeconds)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="font-semibold text-slate-300">Connected At:</span>
                              <span className="font-mono text-white">{connFormatted} SAST</span>
                              <span className="text-slate-500">({formatRelativeTime(session.connectedAt)})</span>
                            </div>

                            <div className="text-[11px] text-slate-500 truncate">
                              Corridor: <span className="text-cyan-300 font-semibold">{session.activeRegion || 'All'}</span>
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

        {/* ========================================================= */}
        {/* VIEW 2: REAL-TIME ONLINE CONNECTIONS STREAM              */}
        {/* ========================================================= */}
        {activeMainTab === 'live' && (
          <>
            {/* Zero-DB Guarantee Notice Banner */}
            <div className="px-4 py-2 bg-sky-950/40 border-b border-sky-500/30 flex items-start space-x-2.5 text-xs text-sky-200">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-sky-300">
                  Zero Database Persistence (In-Memory Volatile RAM Only)
                </p>
                <p className="text-slate-400 text-[11px]">
                  Real-time connection addresses and telemetry are held exclusively in transient server memory to monitor current load.
                </p>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="p-3 border-b border-slate-800/80 bg-[#0D1017] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 bg-[#08090C] p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterTab('feed_only')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterTab === 'feed_only'
                      ? 'bg-emerald-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Feed Viewers ({feedSessions.length})
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-sky-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Tabs ({allSessions.length})
                </button>
                <button
                  onClick={() => setFilterTab('mobile')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer hidden sm:inline-block ${
                    filterTab === 'mobile'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mobile
                </button>
                <button
                  onClick={() => setFilterTab('desktop')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer hidden sm:inline-block ${
                    filterTab === 'desktop'
                      ? 'bg-cyan-500 text-slate-950 shadow font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Desktop
                </button>
              </div>

              <div className="flex items-center space-x-2 flex-1 max-w-xs min-w-[200px]">
                <div className="flex items-center space-x-2 flex-1 bg-[#08090C] border border-slate-800 rounded-xl px-3 py-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by IP, device, user..."
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live Sessions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:thin]">
              {displayedLiveSessions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-300 text-sm">No Active Connections Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {searchQuery ? 'No connected sessions matched your search filters.' : 'Waiting for heartbeat signals from active live feed viewers...'}
                    </p>
                  </div>
                </div>
              ) : (
                displayedLiveSessions.map((session, idx) => {
                  const isCurrentUser = session.sessionId === sessionStorage.getItem('livetraffic_feed_presence_session_id');
                  const isJustPinged = Date.now() - session.lastHeartbeatTimestamp < 12000;

                  return (
                    <div
                      key={session.sessionId || idx}
                      className={`bg-[#0F121A] border rounded-2xl p-3.5 sm:p-4 transition space-y-3 ${
                        isCurrentUser 
                          ? 'border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-950/20' 
                          : 'border-slate-800/90 hover:border-slate-700'
                      }`}
                    >
                      {/* Top line: IP address, Status, Device, and User Tag */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isJustPinged ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isJustPinged ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          </span>

                          <div className="flex items-center space-x-1.5 bg-[#06070A] border border-slate-800 px-2.5 py-1 rounded-xl font-mono text-xs font-bold text-white shadow-inner">
                            <Globe className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{session.ip || '127.0.0.1'}</span>
                            <button
                              onClick={() => handleCopy(session.ip, `ip-${session.sessionId}`)}
                              className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer ml-1"
                              title="Copy IP address"
                            >
                              {copiedText === `ip-${session.sessionId}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {isCurrentUser && (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                              📍 You (This Window)
                            </span>
                          )}

                          {session.userName ? (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-amber-400" />
                              <span>{session.userName} ({session.userRole || 'Admin'})</span>
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md">
                              Citizen Viewer (Guest)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl">
                            {getDeviceIcon(session.deviceType)}
                            <span className="capitalize">{session.deviceType}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-cyan-300">{session.os}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                        <div className="bg-[#080A0F] border border-slate-800/70 p-2 rounded-xl space-y-0.5">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Browser</p>
                          <p className="font-semibold text-slate-200 truncate">{session.browser}</p>
                        </div>

                        <div className="bg-[#080A0F] border border-slate-800/70 p-2 rounded-xl space-y-0.5">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Feed Layout / Tab</p>
                          <p className="font-semibold text-emerald-300 truncate">
                            {session.currentTab === 'feed' 
                              ? `${session.feedViewMode ? session.feedViewMode.toUpperCase() + ' View' : 'Live Feed'}`
                              : session.currentTab.toUpperCase()}
                          </p>
                        </div>

                        <div className="bg-[#080A0F] border border-slate-800/70 p-2 rounded-xl space-y-0.5">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Active Region / Filter</p>
                          <p className="font-semibold text-cyan-300 truncate">
                            {session.activeRegion && session.activeRegion !== 'all' 
                              ? session.activeRegion 
                              : session.feedFilter && session.feedFilter !== 'all' 
                                ? session.feedFilter 
                                : 'All Highway Corridors'}
                          </p>
                        </div>

                        <div className="bg-[#080A0F] border border-slate-800/70 p-2 rounded-xl space-y-0.5">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Display / Timezone</p>
                          <p className="font-semibold text-slate-300 truncate">
                            {session.screenResolution || '1920x1080'} • {session.timezone ? session.timezone.split('/')[1] || session.timezone : 'SAST'}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Connection Telemetry */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                        <div className="flex items-center space-x-3">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Connected {formatElapsed(session.connectedTimestamp)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            <span>Last heartbeat: {formatElapsed(session.lastHeartbeatTimestamp)}</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                          <span>{session.heartbeatCount} pings</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px] sm:max-w-[200px]" title={session.sessionId}>
                            {session.sessionId}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="p-3 sm:px-5 sm:py-3 border-t border-slate-800 bg-[#0F121A] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry Polling (Active Heartbeats &amp; 24h History)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer border border-slate-700 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
