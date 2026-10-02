import React, { useState, useEffect } from 'react';
import { Heart, ThumbsUp, Sparkles, Check, MessageSquare, Send, X, Users, Award } from 'lucide-react';
import { RegisteredUser, AppLikesSummary } from '../types';

interface AppLikeButtonProps {
  currentUser?: RegisteredUser | null;
  currentRegion?: string;
  className?: string;
}

export const AppLikeButton: React.FC<AppLikeButtonProps> = ({
  currentUser,
  currentRegion = 'South Africa',
  className = ''
}) => {
  const [likesSummary, setLikesSummary] = useState<AppLikesSummary>({
    totalLikes: 0,
    recentLikes: [],
    hasLiked: false
  });
  const [hasLikedLocally, setHasLikedLocally] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sa_livetraffic_app_liked') === 'true';
    } catch {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showNoteModal, setShowNoteModal] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [justLiked, setJustLiked] = useState<boolean>(false);
  const [showRecentTooltip, setShowRecentTooltip] = useState<boolean>(false);

  // Fetch current like status and count
  const fetchLikes = async () => {
    try {
      const url = currentUser?.id 
        ? `/api/app-likes?userId=${encodeURIComponent(currentUser.id)}`
        : '/api/app-likes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLikesSummary({
            totalLikes: data.totalLikes ?? 0,
            recentLikes: data.recentLikes ?? [],
            hasLiked: data.hasLiked || hasLikedLocally
          });
          if (data.hasLiked) {
            setHasLikedLocally(true);
            try {
              localStorage.setItem('sa_livetraffic_app_liked', 'true');
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch app likes:', e);
    }
  };

  useEffect(() => {
    fetchLikes();
  }, [currentUser?.id]);

  const handleLikeSubmit = async (optionalNote?: string) => {
    if (isLoading || hasLikedLocally) return;

    setIsLoading(true);
    try {
      const payload = {
        userId: currentUser?.id,
        userName: currentUser ? `${currentUser.name || ''} ${currentUser.surname || ''}`.trim() : undefined,
        userEmail: currentUser?.email,
        userRole: currentUser?.role || 'user',
        region: currentRegion || 'South Africa',
        note: optionalNote && optionalNote.trim() ? optionalNote.trim() : undefined
      };

      const res = await fetch('/api/app-likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setHasLikedLocally(true);
        setJustLiked(true);
        try {
          localStorage.setItem('sa_livetraffic_app_liked', 'true');
        } catch {}

        setLikesSummary(prev => ({
          totalLikes: data.totalLikes ?? (prev.totalLikes + 1),
          recentLikes: data.like ? [data.like, ...prev.recentLikes] : prev.recentLikes,
          hasLiked: true
        }));

        setTimeout(() => setJustLiked(false), 5000);
      }
    } catch (e) {
      console.error('Error posting app like:', e);
    } finally {
      setIsLoading(false);
      setShowNoteModal(false);
      setNote('');
    }
  };

  const isLiked = hasLikedLocally || likesSummary.hasLiked;

  return (
    <div className={`relative ${className}`}>
      {/* Compact Header Bar Widget Above Feeds */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800/90 hover:border-amber-500/30 transition-all rounded-2xl p-2.5 sm:px-4 sm:py-2.5 shadow-md flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left Side: Motorist Endorsement Info */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
            isLiked 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 scale-105 ring-2 ring-rose-500/20' 
              : 'bg-slate-800 text-slate-400 border border-slate-700/80'
          }`}>
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''} ${justLiked ? 'animate-bounce' : ''}`} />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-200">
                {isLiked ? "You like Live Traffic!" : "Enjoying this traffic monitor?"}
              </span>
              <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-slate-800/90 border border-slate-700 text-[10px] text-amber-400 font-bold">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{likesSummary.totalLikes} {likesSummary.totalLikes === 1 ? 'Motorist' : 'Motorists'} Liked</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {isLiked 
                ? "Admins notified • Thank you for supporting SA road safety" 
                : "Give a quick thumbs up to let the admin team know!"}
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-1.5 shrink-0 ml-auto sm:ml-0">
          {isLiked ? (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <Check className="w-3.5 h-3.5 text-rose-400" />
              <span>App Liked ❤️</span>
            </div>
          ) : (
            <>
              {/* Quick 1-Click Like Button */}
              <button
                type="button"
                onClick={() => handleLikeSubmit()}
                disabled={isLoading}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                title="Send a quick Like to the Admins"
              >
                <Heart className="w-3.5 h-3.5 fill-white" />
                <span>I Like This App</span>
              </button>

              {/* Add Note Button */}
              <button
                type="button"
                onClick={() => setShowNoteModal(true)}
                disabled={isLoading}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                title="Like with a quick comment or compliment"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Comment</span>
              </button>
            </>
          )}

          {/* View Community Likes Button */}
          {likesSummary.recentLikes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowRecentTooltip(prev => !prev)}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer text-xs"
              title="View recent motorist endorsements"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {justLiked && (
        <div className="mt-2 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-base">🎉</span>
            <span className="font-semibold">
              Thank you! Your feedback & like were dispatched directly to the Live Traffic admin console.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setJustLiked(false)}
            className="text-emerald-400 hover:text-emerald-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Optional Note / Feedback Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">I Like This App!</h3>
                  <p className="text-xs text-slate-400">Send encouragement to the patrol & admin team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Optional note or shoutout:
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Helps me avoid the daily N1 Ben Schoeman jams! Keep it up."
                rows={3}
                maxLength={240}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500/80 transition"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Province: {currentRegion}</span>
                <span>{note.length}/240</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleLikeSubmit(note)}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit & Like</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Endorsements Dropdown Tooltip */}
      {showRecentTooltip && (
        <div className="absolute right-0 top-full mt-2 z-40 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Recent Motorist Likes</span>
            </div>
            <button
              type="button"
              onClick={() => setShowRecentTooltip(false)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {likesSummary.recentLikes.map((like) => (
              <div key={like.id} className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 truncate">
                    {like.userName || 'South African Motorist'}
                  </span>
                  <span className="text-[10px] text-rose-400 font-semibold">❤️ Liked</span>
                </div>
                {like.region && (
                  <div className="text-[10px] text-slate-400">📍 {like.region}</div>
                )}
                {like.note && (
                  <p className="text-[11px] text-slate-300 italic pt-0.5">"{like.note}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
