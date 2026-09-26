import React, { useMemo } from 'react';
import {
  X,
  User,
  Shield,
  Award,
  Key,
  LogOut,
  Phone,
  CheckCircle2,
  Calendar,
  Flame,
  Car,
  ChevronRight,
  TrendingUp,
  Clock,
  Smartphone,
  LogIn,
  UserPlus,
  Star,
  Sparkles
} from 'lucide-react';
import { RegisteredUser } from '../types';
import { getLocalHeroProfile } from '../utils/communityHeroesUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: RegisteredUser | null;
  onOpenAuthModal?: (intent?: string, mode?: 'login' | 'register') => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
  onOpenOnboarding?: () => void;
  onOpenInstallApp?: () => void;
  onOpenCommunityHeroes?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuthModal,
  onOpenChangePassword,
  onLogout,
  onOpenOnboarding,
  onOpenInstallApp,
  onOpenCommunityHeroes
}) => {
  const heroProfile = useMemo(() => {
    return getLocalHeroProfile(currentUser);
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0D1422] border border-[#D4A237]/40 rounded-[36px] shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="relative z-10 px-6 pt-5 pb-3 flex items-center justify-between text-slate-300 border-b border-[#D4A237]/20">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#D4A237]">
              LIVE TRAFFIC NPC
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              User Profile & Reputation
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700/60 cursor-pointer"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">

          {/* SECTION: COMMUNITY HERO REPUTATION CARD */}
          <div className="bg-gradient-to-br from-[#101A2D] to-[#0A101C] text-slate-100 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 border-2 border-[#D4A237]/70 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{heroProfile.tierIcon}</span>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#D4A237]">
                    COMMUNITY HERO
                  </div>
                  <h3 className="text-sm font-black text-white">
                    {heroProfile.tier}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-400 font-mono">
                  {(heroProfile.totalReputation || 0).toLocaleString()} <span className="text-[10px] font-bold text-[#D4A237]">PTS</span>
                </div>
                <div className="text-[9px] text-emerald-400 font-bold">{heroProfile.accuracyRate}% Accuracy</div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#142137] border border-blue-500/30 rounded-xl p-2">
                <div className="text-sm font-black text-white font-mono">{heroProfile.approvedReportsCount || 0}</div>
                <div className="text-[9px] text-blue-300 font-bold uppercase">🚨 Reports</div>
              </div>
              <div className="bg-[#142137] border border-teal-500/30 rounded-xl p-2">
                <div className="text-sm font-black text-white font-mono">{heroProfile.verificationsCount || 0}</div>
                <div className="text-[9px] text-teal-300 font-bold uppercase">✅ Verified</div>
              </div>
              <div className="bg-[#142137] border border-amber-500/30 rounded-xl p-2">
                <div className="text-sm font-black text-white font-mono">{heroProfile.warningsCount || 0}</div>
                <div className="text-[9px] text-amber-300 font-bold uppercase">⚠️ Warnings</div>
              </div>
            </div>

            {/* Badges preview */}
            {heroProfile.badges && heroProfile.badges.length > 0 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
                {heroProfile.badges.slice(0, 5).map((badge, idx) => (
                  <span
                    key={idx}
                    className="w-8 h-8 rounded-xl bg-slate-900 border border-[#D4A237]/40 flex items-center justify-center text-base shrink-0 shadow-sm"
                    title={`${badge.title} (${badge.category})`}
                  >
                    {badge.icon}
                  </span>
                ))}
              </div>
            )}

            {/* Hub Button */}
            {onOpenCommunityHeroes && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCommunityHeroes();
                }}
                className="w-full py-2 px-3 bg-gradient-to-r from-[#D4A237] to-[#B58525] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>Open Community Heroes & Leaderboard 🏆</span>
              </button>
            )}
          </div>
          
          {/* SECTION 1: SAFE DRIVING STATS (Ivory / Cream Card) */}
          <div className="bg-[#FAF7F2] text-slate-900 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 border border-[#E2DACD]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0D1422] flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-[#D4A237]" />
                <span>Safe Driving Stats</span>
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4A237]/20 text-[#8E6516] border border-[#D4A237]/30">
                Verified
              </span>
            </div>

            {/* Score 1: Safe Driving Score */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center text-[#D4A237] shrink-0 shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-[#D4A237]" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">Safe Driving Score</div>
                  <div className="text-[10px] text-slate-500 font-medium">96% • Low risk profile</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-[#8E6516]">96/100</div>
                <div className="text-[9px] text-emerald-600 font-bold">Top 5%</div>
              </div>
            </div>

            {/* Score 2: 7-Day Distraction-Free Streak */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center text-[#D4A237] shrink-0 shadow-md">
                  <Flame className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">7-Day Distraction-Free</div>
                  <div className="text-[10px] text-slate-500 font-medium">Hands-free compliance streak</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-black text-amber-600">7 Days 🔥</div>
                <div className="text-[9px] text-slate-500 font-bold">Streak Active</div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL INFO CARD (Ivory / Cream Card) */}
          <div className="bg-[#FAF7F2] text-slate-900 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 border border-[#E2DACD]">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0D1422] flex items-center space-x-1.5">
              <User className="w-4 h-4 text-[#D4A237]" />
              <span>Personal Info</span>
            </h3>

            {currentUser ? (
              <div className="space-y-2 text-xs">
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Driver Name</span>
                  <span className="font-bold text-slate-900">{currentUser.fullName} {currentUser.surname}</span>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Mobile Number</span>
                  <span className="font-bold text-slate-900">{currentUser.cellNumber}</span>
                </div>
                <div className="bg-white rounded-xl p-2.5 border border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className="font-bold text-[#8E6516] uppercase text-[10px] bg-amber-100 px-2 py-0.5 rounded-full">
                    {currentUser.role || 'Community Driver'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-4 text-center border border-slate-200 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-wide">Browsing as Guest</p>
                  <p className="text-[11px] text-slate-600">Sign in or create a community driver / advertiser account to unlock persistent driving score records, priority incident dispatch, and ad campaigns.</p>
                </div>

                {onOpenAuthModal && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal('login to your account', 'login');
                      }}
                      className="py-2.5 px-3 bg-[#0D1422] hover:bg-[#122033] text-white border border-[#D4A237]/40 font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer active:scale-95"
                    >
                      <LogIn className="w-3.5 h-3.5 text-[#D4A237]" />
                      <span>Log In</span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal('create your account', 'register');
                      }}
                      className="py-2.5 px-3 bg-gradient-to-r from-[#D4A237] to-[#B58525] hover:brightness-105 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                      <span>Register</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-1 flex flex-col gap-2">
              {onOpenInstallApp && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenInstallApp();
                  }}
                  className="w-full py-2.5 px-3 bg-[#D4A237] hover:bg-[#F3C644] text-[#070A10] font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Add to Home Screen / Desktop</span>
                </button>
              )}

              {currentUser && onOpenChangePassword && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenChangePassword();
                  }}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>Change Password</span>
                </button>
              )}

              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenOnboarding();
                  }}
                  className="w-full py-2.5 px-3 bg-[#0D1422] hover:bg-[#122033] text-[#D4A237] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer border border-[#D4A237]/30"
                >
                  <Award className="w-3.5 h-3.5 text-[#D4A237]" />
                  <span>View Safety Guidelines & Tips</span>
                </button>
              )}

              {currentUser && onLogout && (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              )}
            </div>
          </div>

          {/* Gold Banner Button */}
          <div className="pt-2">
            <div className="w-full bg-gradient-to-r from-[#D4A237] via-[#D4A237] to-[#8E6516] text-slate-950 p-3 rounded-2xl text-center shadow-lg shadow-[#D4A237]/20 space-y-0.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-950">
                Live Traffic NPC Network
              </div>
              <div className="text-xs font-black text-slate-950">
                Safe Roads Save Lives
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-3 text-center bg-[#070D16] border-t border-slate-800">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
            Powered By Rik's Social Media Manager
          </p>
        </div>

      </div>
    </div>
  );
};
