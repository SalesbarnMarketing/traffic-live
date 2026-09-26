import React from 'react';
import {
  Shield,
  Award,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Sparkles,
  Calendar,
  Clock,
  ThumbsUp,
  Radio,
  Flame,
  Star,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { CommunityReputationProfile, UnlockedBadge } from '../types';
import { COMMUNITY_HERO_BADGES, calculateBadgeProgress } from '../data/communityHeroesData';

interface CommunityReputationCardProps {
  profile: CommunityReputationProfile;
  isCurrentUser?: boolean;
  onViewBadgesTab?: () => void;
  onViewLeaderboardTab?: () => void;
}

export const CommunityReputationCard: React.FC<CommunityReputationCardProps> = ({
  profile,
  isCurrentUser = false,
  onViewBadgesTab,
  onViewLeaderboardTab
}) => {
  const unlockedBadges = profile.badges || [];
  const recentLogs = profile.recentActivity || [];

  return (
    <div className="bg-[#0A101D] border-2 border-[#D4A237]/60 rounded-3xl p-4 sm:p-6 text-slate-100 shadow-2xl shadow-black/80 space-y-5 relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4A237]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Profile Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-[#D4A237]/20 pb-4">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#D4A237] via-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-950/60 shrink-0 border border-yellow-100">
            {profile.tierIcon || '🛡️'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A237] bg-[#D4A237]/15 border border-[#D4A237]/40 px-2 py-0.5 rounded-full">
                {profile.tier}
              </span>
              {isCurrentUser && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white truncate tracking-tight mt-0.5">
              {profile.fullName} {profile.surname || ''}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {profile.email} • Live Traffic Contributor since {profile.memberSince || '2026'}
            </p>
          </div>
        </div>

        {/* Total Points Big Badge */}
        <div className="flex items-center sm:flex-col sm:items-end justify-between bg-[#121E36] sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-slate-700/60 sm:border-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider sm:text-[11px]">
            Reputation Score
          </span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight font-mono">
              {(profile.totalReputation || 0).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#D4A237] uppercase">PTS</span>
          </div>
        </div>
      </div>

      {/* Contribution Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 relative z-10">
        {/* 1. Incident Reports */}
        <div className="bg-[#10192B] border border-blue-500/30 hover:border-blue-400/60 transition p-3 sm:p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-base">🚨</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-950/80 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/40">
              REPORTS
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {profile.approvedReportsCount || profile.incidentReportsCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
            Approved road alerts
          </div>
        </div>

        {/* 2. Verifications */}
        <div className="bg-[#10192B] border border-teal-500/30 hover:border-teal-400/60 transition p-3 sm:p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-teal-400 mb-1">
            <span className="text-base">✅</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-teal-950/80 text-teal-300 px-1.5 py-0.2 rounded border border-teal-500/40">
              VERIFIED
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {profile.verificationsCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
            Live confirmations
          </div>
        </div>

        {/* 3. Road Warnings */}
        <div className="bg-[#10192B] border border-amber-500/30 hover:border-amber-400/60 transition p-3 sm:p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-base">⚠️</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
              WARNINGS
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            {profile.warningsCount || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
            Potholes & hazards
          </div>
        </div>

        {/* 4. Accuracy & Trust */}
        <div className="bg-[#10192B] border border-emerald-500/30 hover:border-emerald-400/60 transition p-3 sm:p-3.5 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-base">🎯</span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
              ACCURACY
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {profile.accuracyRate || 96}%
          </div>
          <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
            Verified reliability
          </div>
        </div>
      </div>

      {/* Badges Shelf Showcase */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-[#D4A237]" />
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Earned Badges & Distinctions ({unlockedBadges.length})
            </h4>
          </div>
          {onViewBadgesTab && (
            <button
              onClick={onViewBadgesTab}
              className="text-[11px] font-bold text-[#D4A237] hover:text-white flex items-center space-x-1 cursor-pointer transition"
            >
              <span>View All Badges</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {unlockedBadges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {unlockedBadges.map((badge, idx) => {
              const catalogMatch = COMMUNITY_HERO_BADGES.find(b => b.id === badge.badgeId);
              return (
                <div
                  key={`${badge.badgeId}-${idx}`}
                  className="bg-[#121B2C] border border-[#D4A237]/40 hover:border-[#D4A237] transition p-2.5 rounded-2xl flex items-center space-x-2.5 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                    {badge.icon || catalogMatch?.icon || '🎖️'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-white truncate group-hover:text-[#D4A237] transition">
                      {badge.title || catalogMatch?.title}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">
                      {catalogMatch?.badgeLevel || 'Unlocked'} • {badge.unlockedAt ? new Date(badge.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Verified'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#121B2C] border border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-400">
            No badges unlocked yet. Start reporting, verifying incidents, or warning the community to unlock your first badge!
          </div>
        )}
      </div>

      {/* Recent Point Activities Stream */}
      <div className="space-y-2.5 relative z-10 border-t border-slate-800 pt-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-[#D4A237]" />
            <span>Recent Contribution Points</span>
          </div>
          <span className="text-[10px] text-slate-500 font-normal">Audit Log</span>
        </div>

        {recentLogs.length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {recentLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="bg-[#121E36]/80 hover:bg-[#121E36] border border-slate-800/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs shrink-0">
                    {log.points > 0 ? '✨' : '⚠️'}
                  </span>
                  <span className="text-slate-200 truncate font-medium text-[11px] sm:text-xs">
                    {log.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${
                    log.points > 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-950 text-red-400 border border-red-500/40'
                  }`}>
                    {log.points > 0 ? `+${log.points}` : log.points} pts
                  </span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    {log.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic text-center py-2">
            No recent activity recorded.
          </div>
        )}
      </div>

      {/* Community Protection Motto Footer */}
      <div className="bg-[#050912] border border-[#D4A237]/30 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400 relative z-10">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#D4A237] shrink-0" />
          <span className="text-[11px] text-slate-300 font-medium">
            <strong>Report. Verify. Warn. Protect.</strong> Every contribution makes South African roads safer.
          </span>
        </div>
        {onViewLeaderboardTab && (
          <button
            onClick={onViewLeaderboardTab}
            className="text-[11px] font-black text-[#D4A237] hover:underline whitespace-nowrap ml-2 shrink-0 cursor-pointer"
          >
            Leaderboard 🏆
          </button>
        )}
      </div>
    </div>
  );
};
