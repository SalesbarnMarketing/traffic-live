import React, { useState, useEffect } from 'react';
import { UserFeedbackItem, FeedbackStatus, FeedbackPriority, FeedbackType } from '../types';
import { Lightbulb, MessageSquare, ThumbsUp, CheckCircle, Clock, AlertTriangle, Filter, Search, Send, RefreshCw, Trash2, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { formatReadableDateTime } from '../utils/dateParser';

export const AdminFeedbackManagement: React.FC = () => {
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

  useEffect(() => {
    fetchFeedback();
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
            <h2 className="text-lg font-black tracking-wide text-white uppercase">User Suggestions & Feedback</h2>
            <span className="bg-amber-500/20 text-amber-400 text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              {items.length} Submissions
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Review feature ideas, UI suggestions, and bug reports submitted by motorists and community members.
          </p>
        </div>

        <button
          onClick={fetchFeedback}
          disabled={isLoading}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

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
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
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
    </div>
  );
};
