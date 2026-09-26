import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Bug, 
  Sparkles, 
  X, 
  Send, 
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { UserFeedbackItem, FeedbackType, FeedbackPriority, FeedbackStatus, RegisteredUser } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: RegisteredUser | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'browse'>('create');
  const [postType, setPostType] = useState<FeedbackType>('suggestion');
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postCategory, setPostCategory] = useState<UserFeedbackItem['category']>('map');
  const [postPriority, setPostPriority] = useState<FeedbackPriority>('medium');
  const [postUserName, setPostUserName] = useState(currentUser?.fullName || '');
  const [postUserEmail, setPostUserEmail] = useState(currentUser?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Browse list state
  const [recentItems, setRecentItems] = useState<UserFeedbackItem[]>([]);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);
  const [votedItems, setVotedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      fetchRecentFeedback();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchRecentFeedback = async () => {
    try {
      setIsLoadingBrowse(true);
      const res = await fetch('/api/feedback');
      if (res.ok) {
        const data = await res.json();
        setRecentItems(data);
      }
    } catch (err) {
      console.error('Error fetching feedback items:', err);
    } finally {
      setIsLoadingBrowse(false);
    }
  };

  const handleTabChange = (tab: 'create' | 'browse') => {
    setActiveTab(tab);
    if (tab === 'browse') {
      fetchRecentFeedback();
    }
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (votedItems[id]) return;

    setVotedItems(prev => ({ ...prev, [id]: true }));
    setRecentItems(prev => prev.map(item => 
      item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item
    ));

    try {
      await fetch(`/api/feedback/${id}/upvote`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to upvote item:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        type: postType,
        title: postTitle.trim(),
        description: postDescription.trim(),
        category: postCategory,
        priority: postPriority,
        userName: postUserName.trim() || (currentUser?.fullName || 'Anonymous Commuter'),
        userEmail: postUserEmail.trim() || (currentUser?.email || undefined),
        deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 80)}...` : undefined
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setRecentItems(prev => [data.item, ...prev]);
        setSubmitSuccess(
          postType === 'bug' 
            ? '🐛 Bug report received! Our developers are investigating.' 
            : '💡 Suggestion submitted successfully! Thank you for helping improve Live Traffic SA.'
        );
        setPostTitle('');
        setPostDescription('');
        setTimeout(() => {
          setSubmitSuccess(null);
          setActiveTab('browse');
        }, 1800);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    switch (status) {
      case 'new':
        return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">New</span>;
      case 'under_review':
        return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">Under Review</span>;
      case 'planned':
        return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">Planned</span>;
      case 'in_progress':
        return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase animate-pulse">In Progress</span>;
      case 'resolved':
        return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">Resolved</span>;
      case 'declined':
        return <span className="text-[9px] font-black px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">Declined</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B0F17] border border-slate-700/80 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto relative text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shadow-inner">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>Suggestions & Feedback</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Submit feature ideas, road report improvements, or bug reports
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Post vs View Community Board */}
        <div className="flex items-center space-x-1.5 bg-[#05070B] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleTabChange('create')}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Add Suggestion</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('browse')}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'browse'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Community List ({recentItems.length})</span>
          </button>
        </div>

        {/* Success Alert */}
        {submitSuccess && (
          <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/60 rounded-xl text-xs font-bold text-emerald-300 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {/* TAB 1: CREATE FEEDBACK FORM */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Type selector */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300 uppercase">
                What would you like to share? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPostType('suggestion')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                    postType === 'suggestion'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Suggestion</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostType('bug')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                    postType === 'bug'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-sm'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  <span>Bug Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPostType('improvement')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition cursor-pointer ${
                    postType === 'improvement'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Feature Idea</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Title / Summary *
              </label>
              <input
                type="text"
                required
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder={postType === 'bug' ? 'e.g., Highway N1 pin is missing coordinates' : 'e.g., Add audible voice alert before speed cameras'}
                className="w-full bg-[#05070B] border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Category
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as any)}
                  className="w-full bg-[#05070B] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="map">Interactive Map</option>
                  <option value="live_feed">Live Alert Feed</option>
                  <option value="driver_mode">Driver Mode</option>
                  <option value="voice_tts">Voice / Audio Announcer</option>
                  <option value="speed_traps">Speed Cameras & Traps</option>
                  <option value="sos">Emergency SOS</option>
                  <option value="general">General App</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Priority
                </label>
                <select
                  value={postPriority}
                  onChange={(e) => setPostPriority(e.target.value as any)}
                  className="w-full bg-[#05070B] border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="low">Low (Nice to have)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="high">High (Important)</option>
                  <option value="critical">Critical (Blocking)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Details & Description *
              </label>
              <textarea
                required
                rows={3}
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                placeholder={postType === 'bug' ? 'Describe what happened, where on the map, and your phone or browser...' : 'Describe how you would like this feature or improvement to work...'}
                className="w-full bg-[#05070B] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed transition"
              />
            </div>

            {/* Name / Contact */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={postUserName}
                  onChange={(e) => setPostUserName(e.target.value)}
                  placeholder="Commuter name"
                  className="w-full bg-[#05070B] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={postUserEmail}
                  onChange={(e) => setPostUserEmail(e.target.value)}
                  placeholder="For status updates"
                  className="w-full bg-[#05070B] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-lg transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Suggestion'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: BROWSE COMMUNITY FEEDBACK */}
        {activeTab === 'browse' && (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {isLoadingBrowse ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
                <p className="text-xs">Loading suggestions & community ideas...</p>
              </div>
            ) : recentItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 bg-[#05070B] border border-slate-800/80 rounded-xl">
                <Lightbulb className="w-6 h-6 mx-auto text-amber-500/50" />
                <p className="text-xs font-bold text-white">No suggestions submitted yet.</p>
                <p className="text-[11px] text-slate-400">Click "Add Suggestion" above to be the first!</p>
              </div>
            ) : (
              recentItems.map((item) => (
                <div key={item.id} className="bg-[#05070B] border border-slate-800/90 p-3 rounded-xl space-y-2 text-xs hover:border-slate-700 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      {item.type === 'bug' ? (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">Bug</span>
                      ) : (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">Suggestion</span>
                      )}
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded uppercase">{item.category}</span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-xs">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-snug mt-0.5">{item.description}</p>
                  </div>

                  {item.adminResponse && (
                    <div className="bg-amber-950/30 border-l-2 border-amber-500 p-2 rounded-r text-[10px] text-amber-200">
                      <span className="font-bold text-amber-400">Admin Team Response: </span>
                      {item.adminResponse}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>{item.userName || 'Commuter'} • {new Date(item.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => handleUpvote(item.id, e)}
                      className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        votedItems[item.id] ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold' : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3 text-amber-400" />
                      <span>{item.upvotes} {item.upvotes === 1 ? 'Upvote' : 'Upvotes'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
