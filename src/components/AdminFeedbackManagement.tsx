import React, { useState, useEffect } from 'react';
import { UserFeedbackItem, FeedbackStatus, FeedbackPriority, FeedbackType, AppLikeRecord } from '../types';
import { Lightbulb, MessageSquare, ThumbsUp, CheckCircle, Clock, AlertTriangle, Filter, Search, Send, RefreshCw, Trash2, CheckCircle2, ChevronRight, User, Heart, Sparkles, MapPin, Award, Shield } from 'lucide-react';
import { formatReadableDateTime } from '../utils/dateParser';

export const AdminFeedbackManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'feedback' | 'likes'>('feedback');
  
  // Feedback Suggestions State
  const [items, setItems] = useState<UserFeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<UserFeedbackItem | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>('in_review');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // App Likes & Appreciation State
  const [appLikes, setAppLikes] = useState<AppLikeRecord[]>([]);
  const [totalLikesCount, setTotalLikesCount] = useState<number>(0);
  const [likesSearch, setLikesSearch] = useState<string>('');
  const [isLoadingLikes, setIsLoadingLikes] = useState<boolean>(false);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
        if (selectedItem) {
          const updated = data.find((i: UserFeedbackItem) => i.id === selectedItem.id);
          if (updated) {
            setSelectedItem(updated);
            setAdminResponseText(updated.adminResponse || '');
            setSelectedStatus(updated.status);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppLikes = async () => {
    setIsLoadingLikes(true);
    try {
      const res = await fetch('/api/app-likes');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTotalLikesCount(data.totalLikes || 0);
          setAppLikes(data.recentLikes || []);
        }
      }
    } catch (err) {
      console.error('Failed to fetch app likes:', err);
    } finally {
      setIsLoadingLikes(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    fetchAppLikes();
  }, []);

  const handleSelectItem = (item: UserFeedbackItem) => {
    setSelectedItem(item);
    setAdminResponseText(item.adminResponse || '');
    setSelectedStatus(item.status);
    setSuccessMsg(null);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/feedback/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          adminResponse: adminResponseText.trim() || undefined
        })
      });

      if (res.ok) {
        setSuccessMsg('Status & Admin reply updated successfully!');
        fetchFeedback();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update feedback:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback item?')) return;
    try {
      const res = await fetch(`/api/feedback/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedItem?.id === id) setSelectedItem(null);
        fetchFeedback();
      }
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    }
  };

  const handleDeleteLike = async (likeId: string) => {
    if (!window.confirm('Remove this motorist like entry?')) return;
    try {
      const res = await fetch(`/api/app-likes/${likeId}`, { method: 'DELETE' });
      if (res.ok) {
        setAppLikes(prev => prev.filter(l => l.id !== likeId));
        setTotalLikesCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete app like:', err);
    }
  };

  const filteredItems = items.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.userName.toLowerCase().includes(q) ||
        (item.userEmail && item.userEmail.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredLikes = appLikes.filter(like => {
    if (!likesSearch.trim()) return true;
    const q = likesSearch.toLowerCase();
    return (
      (like.userName && like.userName.toLowerCase().includes(q)) ||
      (like.userEmail && like.userEmail.toLowerCase().includes(q)) ||
      (like.region && like.region.toLowerCase().includes(q)) ||
      (like.note && like.note.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'new':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">New</span>;
      case 'in_review':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">In Review</span>;
      case 'planned':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">Planned</span>;
      case 'in_progress':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">In Progress</span>;
      case 'resolved':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">Resolved / Live</span>;
      case 'closed':
        return <span className="bg-slate-700 text-slate-300 border border-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Closed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-[#111318] border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black tracking-wide text-white uppercase">User Feedback & App Appreciation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review feature ideas, motorist endorsements, "I like this app" submissions, and community bug reports.
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('feedback')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'feedback'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Suggestions & Ideas ({items.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('likes');
              fetchAppLikes();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'likes'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Motorist Likes ({totalLikesCount})</span>
          </button>
        </div>
      </div>

      {/* 1. APP LIKES TAB */}
      {activeSubTab === 'likes' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-rose-950/40 via-[#111318] to-[#111318] border border-rose-500/30 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Total Motorist Likes</span>
                <Heart className="w-4 h-4 text-rose-400 fill-rose-500" />
              </div>
              <div className="text-2xl font-black text-white mt-2 font-mono">
                {totalLikesCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct community positive endorsements</p>
            </div>

            <div className="bg-[#111318] border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">With Comments</span>
                <MessageSquare className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2 font-mono">
                {appLikes.filter(l => Boolean(l.note)).length}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Motorists who left a custom shoutout</p>
            </div>

            <div className="bg-[#111318] border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Admin Alerts</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                Active
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Push & activity audit notifications enabled</p>
            </div>
          </div>

          {/* Search and Refresh */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={likesSearch}
                onChange={(e) => setLikesSearch(e.target.value)}
                placeholder="Search motorist likes, names, provinces, notes..."
                className="w-full bg-[#111318] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="button"
              onClick={fetchAppLikes}
              disabled={isLoadingLikes}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLikes ? 'animate-spin' : ''}`} />
              <span>Refresh Likes</span>
            </button>
          </div>

          {/* Likes List */}
          <div className="bg-[#111318] border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {filteredLikes.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Heart className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-xs font-bold text-slate-400">No motorist likes found</p>
                <p className="text-[11px] text-slate-500">
                  When motorists click "I Like This App" above the live feeds, they will appear here in real time.
                </p>
              </div>
            ) : (
              filteredLikes.map((like) => (
                <div key={like.id} className="p-4 hover:bg-slate-900/50 transition flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-xs font-bold text-white">
                          {like.userName || 'Anonymous Motorist'}
                        </span>
                        {like.userRole && like.userRole !== 'user' && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                            {like.userRole}
                          </span>
                        )}
                        {like.region && (
                          <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span>{like.region}</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {formatReadableDateTime(like.createdAt)}
                        </span>
                      </div>

                      {like.userEmail && (
                        <div className="text-[11px] text-slate-400">{like.userEmail}</div>
                      )}

                      {like.note && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 italic">
                          "{like.note}"
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteLike(like.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition shrink-0 cursor-pointer"
                    title="Delete like"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. SUGGESTIONS & BUG REPORTS TAB */}
      {activeSubTab === 'feedback' && (
        <>
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suggestions..."
                className="w-full bg-[#111318] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#111318] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="in_review">In Review</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved / Live</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-[#111318] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Types</option>
                <option value="suggestion">Feature Suggestions</option>
                <option value="bug_report">Bug Reports</option>
                <option value="improvement">App Improvements</option>
                <option value="other">Other Feedback</option>
              </select>
            </div>
          </div>

          {/* Main Content Grid: List + Detail Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Submissions List */}
            <div className="lg:col-span-6 space-y-3">
              {filteredItems.length === 0 ? (
                <div className="bg-[#111318] border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                  No suggestions found matching the current criteria.
                </div>
              ) : (
                filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                      selectedItem?.id === item.id
                        ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40'
                        : 'bg-[#111318] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                          {getStatusBadge(item.status)}
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {item.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatReadableDateTime(item.createdAt)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-white leading-snug line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>

                        <div className="flex items-center space-x-3 mt-3 text-[11px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-300">{item.userName}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-amber-400 font-bold">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{item.upvotes} upvotes</span>
                          </span>
                          {item.adminResponse && (
                            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Replied</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition ${selectedItem?.id === item.id ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'}`} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selected Item Review & Reply Form */}
            <div className="lg:col-span-6">
              {selectedItem ? (
                <div className="bg-[#111318] border border-slate-800 p-5 sm:p-6 rounded-2xl space-y-5 sticky top-4">
                  <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusBadge(selectedItem.status)}
                        <span className="text-xs text-slate-400">ID: {selectedItem.id}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{selectedItem.title}</h3>
                      <div className="text-xs text-slate-400 mt-1">
                        Submitted by <strong className="text-slate-200">{selectedItem.userName}</strong>
                        {selectedItem.userEmail && <span> ({selectedItem.userEmail})</span>} on {formatReadableDateTime(selectedItem.createdAt)}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(selectedItem.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      title="Delete suggestion"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-[#0A0B0D] p-4 rounded-xl border border-slate-800/80">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">User Details / Request:</div>
                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedItem.description}</p>
                    {selectedItem.deviceInfo && (
                      <div className="text-[10px] text-slate-500 mt-2 font-mono">
                        Device / Browser: {selectedItem.deviceInfo}
                      </div>
                    )}
                  </div>

                  {/* Status & Response Form */}
                  <form onSubmit={handleSaveResponse} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Update Feedback Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus)}
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="new">New</option>
                        <option value="in_review">In Review</option>
                        <option value="planned">Planned (On Roadmap)</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved / Live in App</option>
                        <option value="closed">Closed / Not Planned</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Official Admin Reply (Visible to Community)
                      </label>
                      <textarea
                        rows={4}
                        value={adminResponseText}
                        onChange={(e) => setAdminResponseText(e.target.value)}
                        placeholder="Enter an official response or update on this feature suggestion..."
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {successMsg && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save & Publish Reply'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-[#111318] border border-slate-800 p-12 rounded-2xl text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                  <Lightbulb className="w-10 h-10 text-slate-600" />
                  <div className="text-sm font-bold text-slate-400">Select a suggestion to review</div>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Click on any user suggestion from the left to read full details, assign roadmap status, and write an admin response.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
