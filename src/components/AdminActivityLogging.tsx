import React, { useState, useEffect, useRef } from 'react';
import { ActivityLog, ActivityLogSettings, ActivityLogCategory, ActivityLogLevel } from '../types';
import {
  Activity,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Sliders,
  Shield,
  Radio,
  FileText,
  Heart,
  Wrench,
  Users,
  Settings,
  Download,
  Terminal,
  Zap
} from 'lucide-react';

interface AdminActivityLoggingProps {
  adminUserName?: string;
  adminUserRole?: string;
}

export const AdminActivityLogging: React.FC<AdminActivityLoggingProps> = ({
  adminUserName = 'Admin',
  adminUserRole = 'Admin'
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<ActivityLogSettings>({
    isPaused: true, // Default paused as requested
    retentionMax: 500,
    intervalSec: 15,
    lastUpdated: new Date().toISOString(),
    updatedBy: 'System (Default Paused)'
  });

  const [stats, setStats] = useState<{
    totalRecorded: number;
    categoriesCount: Record<string, number>;
  }>({
    totalRecorded: 0,
    categoriesCount: {}
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<number>(15);
  const [showIntervalMenu, setShowIntervalMenu] = useState<boolean>(false);
  const [lastFetchedTime, setLastFetchedTime] = useState<Date>(new Date());
  const [secondsUntilNextInterval, setSecondsUntilNextInterval] = useState<number>(15);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '250');

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.settings) {
          setSettings(data.settings);
          setSelectedInterval(data.settings.intervalSec || 15);
        }
        if (data.stats) {
          setStats(data.stats);
        }
        setLastFetchedTime(new Date());
      }
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial fetch on mount or when filter criteria changes
  useEffect(() => {
    fetchLogs();
  }, [selectedCategory, selectedLevel]);

  // Interval timer for periodic polling based on settings.intervalSec
  useEffect(() => {
    const currentIntervalSec = settings.intervalSec || 15;
    setSecondsUntilNextInterval(currentIntervalSec);

    const countdownTimer = setInterval(() => {
      setSecondsUntilNextInterval((prev) => {
        if (prev <= 1) {
          fetchLogs(true);
          return currentIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [settings.intervalSec, selectedCategory, selectedLevel, searchQuery]);

  const handleTogglePause = async (newPauseState: boolean) => {
    setIsUpdatingSettings(true);
    try {
      const res = await fetch('/api/admin/activity-logs/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPaused: newPauseState,
          intervalSec: selectedInterval,
          updatedBy: `${adminUserName} (${adminUserRole})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStatusMessage({
          type: 'success',
          text: newPauseState
            ? '⏸️ Activity logging is now PAUSED. Incoming background actions will not be written to log history.'
            : `▶️ Activity logging is now ACTIVE. Background actions are streaming in intervals (${data.settings.intervalSec}s).`
        });
        await fetchLogs(true);
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update logging state.' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setIsUpdatingSettings(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleChangeInterval = async (newInterval: number) => {
    setSelectedInterval(newInterval);
    setShowIntervalMenu(false);
    setIsUpdatingSettings(true);
    try {
      const res = await fetch('/api/admin/activity-logs/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPaused: settings.isPaused,
          intervalSec: newInterval,
          updatedBy: `${adminUserName} (${adminUserRole})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setSecondsUntilNextInterval(newInterval);
        setStatusMessage({
          type: 'success',
          text: `⏱️ Logging refresh interval updated to every ${newInterval} seconds.`
        });
      }
    } catch (err) {
      console.warn('Failed to update interval:', err);
    } finally {
      setIsUpdatingSettings(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all stored activity logs? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/activity-logs/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken') || ''}`,
          'x-user-role': adminUserRole || 'super_admin'
        },
        body: JSON.stringify({
          clearedBy: `${adminUserName} (${adminUserRole})`,
          userRole: adminUserRole
        })
      });

      if (res.ok) {
        setLogs([]);
        setStatusMessage({ type: 'success', text: '🗑️ Activity logs cleared successfully.' });
        await fetchLogs(true);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Failed to clear logs.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `roadwatch-activity-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getCategoryBadge = (category: ActivityLogCategory) => {
    switch (category) {
      case 'report':
        return { label: 'Hazard Report', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: AlertTriangle };
      case 'sos':
        return { label: 'SOS Alert', bg: 'bg-red-500/15 text-red-400 border-red-500/30', icon: AlertOctagon };
      case 'dispatch':
        return { label: 'Dispatch', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Radio };
      case 'auth':
        return { label: 'Security / Auth', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: Users };
      case 'donation':
        return { label: 'Donation', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: Heart };
      case 'scrape':
        return { label: 'Live Feed Sync', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', icon: Zap };
      case 'settings':
        return { label: 'System Settings', bg: 'bg-slate-700/40 text-slate-300 border-slate-600', icon: Settings };
      default:
        return { label: 'System', bg: 'bg-slate-800 text-slate-400 border-slate-700', icon: Info };
    }
  };

  const getLevelBadge = (level: ActivityLogLevel) => {
    switch (level) {
      case 'success':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'warn':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Control & Logging Switcher */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
            <div className={`p-3 rounded-2xl border transition-colors shrink-0 ${
              settings.isPaused
                ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-950/40 animate-pulse'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Admin Activity Logging & Interval Stream
                </h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center space-x-1 ${
                  settings.isPaused
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${settings.isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
                  <span>{settings.isPaused ? 'PAUSED (DEFAULT)' : 'ACTIVE STREAMING'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
                Real-time chronological audit trail of moderation approvals, SOS responses, scraper executions, user auth, and settings modifications.
              </p>
            </div>
          </div>

          {/* Master Toggle and Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Logging State Master Toggle */}
            <button
              type="button"
              disabled={isUpdatingSettings}
              onClick={() => handleTogglePause(!settings.isPaused)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-lg cursor-pointer ${
                settings.isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30 ring-1 ring-emerald-400/40'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-amber-950/30 ring-1 ring-amber-400/40'
              }`}
            >
              {settings.isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Logging</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Logging</span>
                </>
              )}
            </button>

            {/* Interval Configuration Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowIntervalMenu(!showIntervalMenu)}
                className="flex items-center space-x-1.5 bg-[#0B0D12] hover:bg-slate-800/80 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                title="Configure streaming refresh interval"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Interval: {settings.intervalSec || 15}s</span>
              </button>

              {showIntervalMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-[#0F1115] border border-slate-700 rounded-xl p-2 shadow-2xl z-30 space-y-1 animate-fadeIn">
                  <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    Select Stream Interval
                  </div>
                  {[5, 10, 15, 30, 60, 120].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleChangeInterval(sec)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        (settings.intervalSec || 15) === sec
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>Every {sec} seconds</span>
                      {(settings.intervalSec || 15) === sec && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Sync Button */}
            <button
              type="button"
              onClick={() => fetchLogs()}
              disabled={isLoading}
              className="flex items-center space-x-1.5 bg-[#0B0D12] hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Manual refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Export JSON Button */}
            <button
              type="button"
              onClick={handleExportJson}
              disabled={logs.length === 0}
              className="flex items-center space-x-1.5 bg-[#0B0D12] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              title="Download activity logs in JSON format"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Clear All Logs */}
            <button
              type="button"
              onClick={handleClearLogs}
              disabled={logs.length === 0}
              className="flex items-center space-x-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 border border-red-900/40 px-3 py-2.5 rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              title="Clear all stored logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Interval Countdown & Status Indicator Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 font-mono">
              <span className="text-slate-500">Next Interval Sync:</span>
              <span className="font-bold text-amber-400">{secondsUntilNextInterval}s</span>
            </span>
            <span className="text-slate-700">|</span>
            <span>
              Last Checked: <strong className="text-slate-300 font-mono">{lastFetchedTime.toLocaleTimeString()}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span>
              Stored Entries: <strong className="text-white font-mono">{logs.length}</strong>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">
              Retention Cap: <strong className="text-slate-300 font-mono">{settings.retentionMax || 500}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0B0D12] border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            placeholder="Search action, details, actor..."
            className="w-full bg-[#07080A] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition"
          />
        </div>

        {/* Category & Level Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#07080A] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold"
          >
            <option value="all">All Categories</option>
            <option value="report">Hazard Reports</option>
            <option value="sos">Emergency SOS</option>
            <option value="dispatch">Admin Dispatches</option>
            <option value="auth">Auth & Security</option>
            <option value="donation">Donations</option>
            <option value="scrape">Live Highway Feed</option>
            <option value="settings">Settings & Config</option>
            <option value="system">System Events</option>
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-[#07080A] border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-semibold"
          >
            <option value="all">All Severity Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedLevel('all');
              }}
              className="text-xs text-slate-400 hover:text-amber-400 underline font-medium px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Logs Stream Display */}
      <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Terminal Header */}
        <div className="bg-[#07080A] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-slate-300">ACTIVITY LOG STREAM CONSOLE</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <span>Interval: {settings.intervalSec || 15}s</span>
            <span className="text-slate-700">•</span>
            <span>{logs.length} entries matched</span>
          </div>
        </div>

        {/* Empty State */}
        {logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-300">No Activity Logs Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {settings.isPaused
                ? 'Activity logging is currently PAUSED by default. Click "Resume Logging" above to start streaming actions in intervals.'
                : 'No actions match the selected filter criteria or no background events have occurred yet.'}
            </p>
            {settings.isPaused && (
              <button
                onClick={() => handleTogglePause(false)}
                className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
              >
                ▶️ Resume Logging Now
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto font-mono text-xs">
            {logs.map((log) => {
              const cat = getCategoryBadge(log.category);
              const CatIcon = cat.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-3 sm:p-4 hover:bg-slate-900/50 transition cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start sm:items-center space-x-2.5 min-w-0 flex-1">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${cat.bg}`}>
                        <CatIcon className="w-3.5 h-3.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${cat.bg}`}>
                            {cat.label}
                          </span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${getLevelBadge(log.level)}`}>
                            {log.level}
                          </span>
                          <span className="font-bold text-white tracking-tight">{log.action}</span>
                        </div>

                        {log.details && (
                          <p className="text-xs text-slate-400 font-sans mt-0.5 truncate">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-500 shrink-0 self-start sm:self-center">
                      {log.actor && (
                        <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                          {log.actor}
                        </span>
                      )}
                      <span className="font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Expanded JSON / Metadata Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 bg-[#07080A] p-3 rounded-xl">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Log ID:</span>{' '}
                          <span className="text-slate-300">{log.id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">ISO Timestamp:</span>{' '}
                          <span className="text-slate-300">{log.timestamp}</span>
                        </div>
                        {log.actorEmail && (
                          <div>
                            <span className="text-slate-500">Actor Email:</span>{' '}
                            <span className="text-slate-300">{log.actorEmail}</span>
                          </div>
                        )}
                        {log.targetId && (
                          <div>
                            <span className="text-slate-500">Target ID:</span>{' '}
                            <span className="text-slate-300">{log.targetId}</span>
                          </div>
                        )}
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                            Payload Metadata:
                          </div>
                          <pre className="p-2 bg-[#040507] border border-slate-800/80 rounded-lg text-[10px] text-amber-300 overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
