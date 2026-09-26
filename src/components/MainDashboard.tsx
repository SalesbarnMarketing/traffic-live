import React, { useState } from 'react';
import {
  Shield,
  Map,
  Radio,
  Heart,
  AlertTriangle,
  Siren,
  Car,
  AlertOctagon,
  Stethoscope,
  Truck,
  PhoneCall,
  Lock,
  UserCheck,
  UserPlus,
  LogIn,
  LogOut,
  Key,
  User,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  Wrench,
  Flame,
  PlusCircle,
  Volume2,
  Megaphone,
  Sparkles,
  Users,
  Lightbulb,
  Award,
  PhoneOff,
  Wine,
  Eye,
  Gauge,
  Navigation,
  Smartphone,
  Download,
  Mic,
  BookOpen,
  BarChart3,
  Activity,
  Zap,
  CheckCircle2,
  FileText,
  ChevronRight,
  HeartHandshake,
  Camera
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { IncidentReport, EmergencySOS, RegisteredUser } from '../types';
import { BetaNoticeCard } from './BetaNoticeCard';
import { usePwaInstall } from '../hooks/usePwaInstall';
import { LocationStatusCard } from './LocationStatusCard';
import { TermsPrivacyModal } from './TermsPrivacyModal';

interface MainDashboardProps {
  reports: IncidentReport[];
  sosRequests: EmergencySOS[];
  pendingCount?: number;
  currentUser?: RegisteredUser | null;
  onOpenAuthModal: (intent?: string, mode?: 'login' | 'register') => void;
  onOpenUserProfile?: () => void;
  onOpenChangePassword?: () => void;
  onLogout: () => void;
  onOpenReportModal: (options?: { type?: string; title?: string }) => void;
  onOpenSOSModal: (options?: { emergencyType?: string; notes?: string }) => void;
  onOpenDonationModal: (options?: { defaultTier?: 'coffee' | 'fuel' | 'equipment' }) => void;
  onSwitchTab: (tab: 'dashboard' | 'map' | 'feed' | 'trafficcams' | 'traveltimes' | 'report' | 'admin' | 'donations' | 'pricing' | 'course' | 'advertiser') => void;
  onSelectCategoryFilter: (category: string) => void;
  onOpenDriverMode?: () => void;
  onOpenLocationCheck?: () => void;
  onOpenShareToX?: (options?: any) => void;
  onOpenFeedback?: () => void;
  onOpenOnboarding?: () => void;
  onOpenInstallApp?: () => void;
  onOpenVoiceCommands?: () => void;
  onOpenWallOfHeroes?: () => void;
  onOpenGettingStarted?: () => void;
  onShowWelcomeScreen?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenTripBuddy?: () => void;
  isTripActive?: boolean;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  reports,
  sosRequests,
  pendingCount = 0,
  currentUser,
  onOpenAuthModal,
  onOpenUserProfile,
  onOpenChangePassword,
  onLogout,
  onOpenReportModal,
  onOpenSOSModal,
  onOpenDonationModal,
  onSwitchTab,
  onSelectCategoryFilter,
  onOpenDriverMode,
  onOpenLocationCheck,
  onOpenShareToX,
  onOpenFeedback,
  onOpenOnboarding,
  onOpenInstallApp,
  onOpenVoiceCommands,
  onOpenWallOfHeroes,
  onOpenGettingStarted,
  onShowWelcomeScreen,
  onOpenNotificationSettings,
  onOpenTripBuddy,
  isTripActive
}) => {
  const [sanralModalOpen, setSanralModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();

  const handleInstallButtonClick = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (accepted) return;
    }
    // If prompt not available (e.g. iOS Safari, already installed, or browser blocked), show guided modal
    if (onOpenInstallApp) {
      onOpenInstallApp();
    }
  };

  return (
    <div className="w-full min-h-full bg-[#070A10] text-slate-100 flex flex-col pb-16 pt-3">
      {/* MAIN CONTAINER */}
      <div className="max-w-2xl mx-auto w-full px-3.5 sm:px-5 space-y-4 sm:space-y-5">

        {/* DRIVER MODE IVORY/CREAM HERO CARD (Compact Half-Size, No Text Cutoff) */}
        {onOpenDriverMode && (
          <div
            onClick={onOpenDriverMode}
            className="w-full bg-[#FAF4EA] text-slate-950 rounded-2xl p-3 sm:p-3.5 shadow-xl transition-all duration-200 hover:shadow-[#D4A237]/30 border-2 border-[#EBE1D0] cursor-pointer group relative overflow-hidden"
          >
            {/* Inner Content Layout */}
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                <div className="text-slate-900 group-hover:scale-105 transition shrink-0 bg-[#EFE4D2] p-2 sm:p-2.5 rounded-xl border border-[#D9C4A3]">
                  <Car className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="inline-block bg-[#C49A56] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs whitespace-nowrap">
                      HANDS-FREE
                    </span>
                  </div>
                  <h3 className="font-black text-sm sm:text-base text-slate-950 uppercase tracking-tight leading-tight whitespace-nowrap mt-0.5">
                    DRIVER MODE
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-700 font-semibold truncate leading-tight mt-0.5">
                    Voice alerts & audio announcer
                  </p>
                </div>
              </div>

              {/* Launch Pill Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDriverMode();
                }}
                className="bg-[#FAF4EA] group-hover:bg-[#F3ECE0] border-2 border-[#C49A56] shadow-xs px-2.5 sm:px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase shrink-0 transition-transform active:scale-95 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span className="whitespace-nowrap">LAUNCH</span>
              </button>
            </div>
          </div>
        )}

        {/* ACCOUNT & COMMUNITY AUTH CARD */}
        <div className="w-full bg-[#0A0F1A] border border-[#D4A237]/50 rounded-2xl p-3.5 sm:p-4 shadow-xl relative overflow-hidden">
          {currentUser ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0 shadow-sm">
                  <UserCheck className="w-5 h-5 text-[#D4A237]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A237]">
                      ACCOUNT ACTIVE
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-[#D4A237]/20 text-amber-300 border border-[#D4A237]/40">
                      {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.role === 'advertiser' ? 'Advertiser' : 'Community Driver'}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                    {currentUser.fullName} {currentUser.surname || ''}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0">
                {onOpenUserProfile && (
                  <button
                    type="button"
                    onClick={onOpenUserProfile}
                    className="flex-1 sm:flex-initial bg-[#FAF4EA] hover:bg-white text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl transition border border-[#D4A237] shadow-sm cursor-pointer flex items-center justify-center space-x-1 active:scale-95"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile & Stats</span>
                  </button>
                )}

                {onOpenChangePassword && (
                  <button
                    type="button"
                    onClick={onOpenChangePassword}
                    className="bg-[#0D1624] hover:bg-[#122238] text-[#D4A237] border border-[#D4A237]/40 font-bold text-xs p-1.5 rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                    title="Change Password"
                    aria-label="Change Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  className="bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/50 font-bold text-xs p-1.5 rounded-xl transition shadow-sm cursor-pointer active:scale-95"
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#05080E] border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0 shadow-sm">
                  <User className="w-5 h-5 text-[#D4A237]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#D4A237]">
                    COMMUNITY & ADVERTISER ACCESS
                  </div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white truncate mt-0.5">
                    Log In or Register to Unlock Full Features
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                    Safe driving scores, verified hazard reports & ad portal
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0">
                {/* Login Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('login to your account', 'login')}
                  className="flex-1 sm:flex-initial bg-[#0D1624] hover:bg-[#132236] text-white border border-[#D4A237]/60 font-bold text-xs px-3.5 py-1.5 rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#D4A237]" />
                  <span>Log In</span>
                </button>

                {/* Register Button */}
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('create your account', 'register')}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-[#D4A237] to-[#B58525] hover:brightness-110 text-slate-950 font-black text-xs px-4 py-1.5 rounded-xl transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5 active:scale-95 uppercase tracking-tight"
                >
                  <UserPlus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                  <span>Register</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TRIP BUDDY FEATURE HIGHLIGHT BANNER */}
        {onOpenTripBuddy && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 border-2 border-emerald-500/60 p-4 sm:p-5 shadow-xl shadow-emerald-950/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                <div className={`w-12 h-12 rounded-2xl ${
                  isTripActive
                    ? 'bg-emerald-600 text-white animate-pulse shadow-lg shadow-emerald-500/50'
                    : 'bg-emerald-950/80 border border-emerald-500 text-emerald-400'
                } flex items-center justify-center shrink-0 shadow-md`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400 font-mono">
                      SAFETY FEATURE
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {isTripActive ? '🟢 JOURNEY IN PROGRESS' : '🛡️ IN-APP LIVE MONITOR'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5 truncate">
                    TRIP BUDDY: Safe Long-Distance Journey Monitoring
                  </h3>
                  <p className="text-xs text-slate-300 font-medium line-clamp-1 mt-0.5">
                    Real-time GPS tracking, periodic safety check-in timer & 1-tap WhatsApp family updates.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenTripBuddy}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl ${
                  isTripActive
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold'
                } text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition active:scale-95 flex items-center justify-center space-x-2 shrink-0 cursor-pointer`}
              >
                <span>{isTripActive ? 'OPEN ACTIVE TRIP HUD' : 'START TRIP BUDDY'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* MAIN OPTIONS SECTION (2x2 Grid Matching Screenshot) */}
        <div className="space-y-3.5 pt-1">
          <div className="text-sm sm:text-base font-black uppercase tracking-widest text-[#D4A237] px-1">
            MAIN OPTIONS
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            
            {/* 1. LIVE MAP */}
            <button
              onClick={() => onSwitchTab('map')}
              className="bg-[#0A0F1A] hover:bg-[#0E1A2C] border border-[#1C2C40] hover:border-[#D4A237] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[185px] sm:min-h-[205px] shadow-2xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] text-[#D4A237] bg-[#05080E] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-md">
                  <Map className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4A237] stroke-[1.9]" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#D4A237] uppercase tracking-wider">
                  LIVE MAP
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1 line-clamp-1">
                  Spiking traps & pins
                </p>
              </div>
              <span className="bg-[#FAF4EA] group-hover:bg-white text-[#070A10] font-black text-xs sm:text-sm px-7 sm:px-9 py-2 rounded-full uppercase tracking-wider shadow-lg mt-3.5 transition border border-[#D4A237]">
                VIEW
              </span>
            </button>

            {/* 2. TRAFFIC FEEDS */}
            <button
              onClick={() => onSwitchTab('feed')}
              className="bg-[#0A0F1A] hover:bg-[#0E1A2C] border border-[#1C2C40] hover:border-[#D4A237] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[185px] sm:min-h-[205px] shadow-2xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] text-[#D4A237] bg-[#05080E] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-md">
                  <Radio className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4A237] stroke-[1.9]" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#D4A237] uppercase tracking-wider">
                  TRAFFIC FEEDS
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1 line-clamp-1">
                  iTraffic live alerts
                </p>
              </div>
              <span className="bg-[#FAF4EA] group-hover:bg-white text-[#070A10] font-black text-xs sm:text-sm px-7 sm:px-9 py-2 rounded-full uppercase tracking-wider shadow-lg mt-3.5 transition border border-[#D4A237]">
                FEEDS
              </span>
            </button>

            {/* 3. REPORT HAZARD (Gold Outline Highlight) */}
            <button
              onClick={() => onOpenReportModal()}
              className="bg-[#0A0F1A] hover:bg-[#0E1A2C] border-2 border-[#D4A237] hover:border-[#D4A237] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[185px] sm:min-h-[205px] shadow-2xl shadow-[#D4A237]/15 transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] text-[#D4A237] bg-[#05080E] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-md">
                  <AlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4A237] stroke-[1.9]" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#D4A237] uppercase tracking-wider">
                  REPORT HAZARD
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1 line-clamp-1">
                  Spiking, crash, hazard
                </p>
              </div>
              <span className="bg-[#FAF4EA] group-hover:bg-white text-[#070A10] font-black text-xs sm:text-sm px-7 sm:px-9 py-2 rounded-full uppercase tracking-wider shadow-lg mt-3.5 transition border border-[#D4A237]">
                REPORT
              </span>
            </button>

            {/* 4. SUPPORT PATROL */}
            <button
              onClick={() => onSwitchTab('donations')}
              className="bg-[#0A0F1A] hover:bg-[#0E1A2C] border border-[#1C2C40] hover:border-[#D4A237] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[185px] sm:min-h-[205px] shadow-2xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] text-[#D4A237] bg-[#05080E] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-md">
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4A237] stroke-[1.9]" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#D4A237] uppercase tracking-wider">
                  SUPPORT PATROL
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1 line-clamp-1">
                  Donate fuel & kit
                </p>
              </div>
              <span className="bg-[#FAF4EA] group-hover:bg-white text-[#070A10] font-black text-xs sm:text-sm px-7 sm:px-9 py-2 rounded-full uppercase tracking-wider shadow-lg mt-3.5 transition border border-[#D4A237]">
                DONATE
              </span>
            </button>

            {/* 5. APP SUGGESTIONS / FEEDBACK */}
            <button
              onClick={() => {
                if (onOpenFeedback) onOpenFeedback();
              }}
              className="bg-[#0A0F1A] hover:bg-[#0E1A2C] border border-[#1C2C40] hover:border-[#D4A237] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[185px] sm:min-h-[205px] shadow-2xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] text-[#D4A237] bg-[#05080E] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-md">
                  <Lightbulb className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4A237] stroke-[1.9]" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#D4A237] uppercase tracking-wider">
                  SUGGESTIONS
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1 whitespace-nowrap">
                  Feature ideas
                </p>
              </div>
              <span className="bg-[#FAF4EA] group-hover:bg-white text-[#070A10] font-black text-xs sm:text-sm px-7 sm:px-9 py-2 rounded-full uppercase tracking-wider shadow-lg mt-3.5 transition border border-[#D4A237]">
                SUGGEST
              </span>
            </button>

            {/* 6. ADVERTISE ON LIVE TRAFFIC */}
            <button
              onClick={() => onSwitchTab('pricing')}
              className="bg-[#0A0F1A] hover:bg-[#0E1A2C] border border-[#1C2C40] hover:border-[#D4A237] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 flex flex-col items-center justify-between text-center min-h-[185px] sm:min-h-[205px] shadow-2xl transition-all duration-200 cursor-pointer group"
            >
              <div className="flex flex-col items-center">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] text-[#D4A237] bg-[#05080E] flex items-center justify-center mb-3 group-hover:scale-105 transition shadow-md">
                  <Megaphone className="w-7 h-7 sm:w-8 sm:h-8 text-[#D4A237] stroke-[1.9]" />
                </div>
                <h3 className="font-black text-sm sm:text-base text-[#D4A237] uppercase tracking-wider">
                  ADVERTISE
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 font-medium mt-1 line-clamp-1">
                  Reach local motorists
                </p>
              </div>
              <span className="bg-[#FAF4EA] group-hover:bg-white text-[#070A10] font-black text-xs sm:text-sm px-7 sm:px-9 py-2 rounded-full uppercase tracking-wider shadow-lg mt-3.5 transition border border-[#D4A237]">
                SPONSOR
              </span>
            </button>

          </div>
        </div>

        {/* ADDITIONAL HELPFUL SHORTCUTS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 pt-1">
          {/* Admin Access (At top) */}
          <button
            onClick={() => onSwitchTab('admin')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237]/60 hover:border-[#D4A237] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#05080E] border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">Admin Portal</div>
                <div className="text-[11px] sm:text-xs text-amber-300 truncate font-semibold">Moderator access</div>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full animate-pulse ml-1 shrink-0">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Support Patrol & Volunteer Fund */}
          <button
            onClick={() => onOpenDonationModal ? onOpenDonationModal() : onSwitchTab('donations')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237]/60 hover:border-[#D4A237] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Heart className="w-4.5 h-4.5 fill-red-500" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">Support Patrol</div>
                <div className="text-[11px] sm:text-xs text-amber-300 truncate font-semibold">R100 Coffee & Fuel</div>
              </div>
            </div>
          </button>

          {/* Advertise on Live Traffic */}
          <button
            onClick={() => onSwitchTab('pricing')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237]/40 hover:border-[#D4A237] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#05080E] border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0">
                <Megaphone className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">Rate Card</div>
                <div className="text-[11px] sm:text-xs text-slate-400 truncate">From R500 / mo</div>
              </div>
            </div>
          </button>

          {/* Advertiser Portal & Clicks Dashboard */}
          <button
            onClick={() => onSwitchTab('advertiser')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-[#D4A237] hover:border-amber-300 p-3 rounded-2xl flex items-center justify-between text-left shadow-lg shadow-[#D4A237]/15 transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#FAF4EA] text-[#070A10] flex items-center justify-center shrink-0 group-hover:scale-105 transition font-black">
                <Eye className="w-4.5 h-4.5 text-[#070A10]" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-[#D4A237] uppercase truncate flex items-center space-x-1">
                  <span>Ad Portal</span>
                </div>
                <div className="text-[11px] sm:text-xs text-amber-200 truncate font-semibold">
                  Stats & Clicks
                </div>
              </div>
            </div>
          </button>

          {/* Community Wall of Heroes */}
          <button
            onClick={() => {
              if (onOpenWallOfHeroes) {
                onOpenWallOfHeroes();
              } else {
                onSwitchTab('donations');
              }
            }}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-[#D4A237] hover:border-amber-300 p-3 rounded-2xl flex items-center justify-between text-left shadow-lg shadow-[#D4A237]/20 transition group cursor-pointer animate-pulse-slow"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#D4A237] to-amber-200 text-[#070A10] flex items-center justify-center shrink-0 group-hover:scale-105 transition font-black shadow">
                <Award className="w-4.5 h-4.5 text-[#070A10] stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-[#D4A237] uppercase truncate flex items-center space-x-1">
                  <span>Wall of Heroes</span>
                </div>
                <div className="text-[11px] sm:text-xs text-amber-200 truncate font-semibold">
                  Coffee, Fuel & Fixers
                </div>
              </div>
            </div>
          </button>

          {/* SANRAL i-Traffic Highway Travel Times */}
          <button
            onClick={() => onSwitchTab('traveltimes')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-cyan-500/60 hover:border-cyan-400 p-3 rounded-2xl flex items-center justify-between text-left shadow-lg shadow-cyan-900/20 transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition font-black">
                <Clock className="w-4.5 h-4.5 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-cyan-300 uppercase truncate flex items-center space-x-1">
                  <span>Travel Times</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-300 truncate font-semibold">
                  Gauteng Corridors
                </div>
              </div>
            </div>
          </button>

          {/* National Highway Traffic Cams (CCTV) */}
          <button
            onClick={() => onSwitchTab('trafficcams')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-[#D4A237] hover:border-amber-300 p-3 rounded-2xl flex items-center justify-between text-left shadow-lg shadow-[#D4A237]/20 transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition font-black">
                <Camera className="w-4.5 h-4.5 text-[#D4A237]" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-[#D4A237] uppercase truncate flex items-center space-x-1">
                  <span>Traffic Cams</span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                </div>
                <div className="text-[11px] sm:text-xs text-amber-200 truncate font-semibold">
                  Live CCTV Snapshots
                </div>
              </div>
            </div>
          </button>

          {/* Push Notifications & Sound Preferences */}
          {onOpenNotificationSettings && (
            <button
              onClick={onOpenNotificationSettings}
              className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-[#F25C05]/80 hover:border-orange-400 p-3 rounded-2xl flex items-center justify-between text-left shadow-lg shadow-orange-950/20 transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#F25C05]/20 text-orange-400 border border-[#F25C05]/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition font-black">
                  <Volume2 className="w-4.5 h-4.5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-xs sm:text-sm text-orange-300 uppercase truncate flex items-center space-x-1">
                    <span>Push & Sound</span>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-300 truncate font-semibold">
                    Alerts, Chimes & Horns
                  </div>
                </div>
              </div>
            </button>
          )}

          {/* Safe Driving Guidelines */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237]/40 hover:border-[#D4A237] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#05080E] border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0">
                  <Award className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">Safety Tips</div>
                  <div className="text-[11px] sm:text-xs text-slate-400 truncate">Precautions</div>
                </div>
              </div>
            </button>
          )}

          {/* Advanced Driving Course */}
          <button
            onClick={() => onSwitchTab('course')}
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237]/50 hover:border-[#D4A237] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#D4A237]/15 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Car className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">Driving Course</div>
                <div className="text-[11px] sm:text-xs text-amber-300 truncate">Max 10 / Class</div>
              </div>
            </div>
          </button>

          {/* Hands-Free Voice Commands Assistant */}
          {onOpenVoiceCommands && (
            <button
              onClick={onOpenVoiceCommands}
              className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237] hover:border-amber-300 p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Mic className="w-4.5 h-4.5 text-[#D4A237]" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">Voice AI</div>
                  <div className="text-[11px] sm:text-xs text-amber-300 truncate font-semibold">Say "Hey NPC"</div>
                </div>
              </div>
            </button>
          )}

          {/* Official WhatsApp Channel Link Card */}
          <a
            href="https://whatsapp.com/channel/0029Va91KckDzgTGXcqt3I2I"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-[#25D366]/80 hover:border-[#25D366] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
            title="Join Official Live Traffic NPC WhatsApp Channel"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/20 border border-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <WhatsAppIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm text-[#25D366] uppercase truncate flex items-center space-x-1">
                  <span>WhatsApp Channel</span>
                </div>
                <div className="text-[11px] sm:text-xs text-emerald-300 truncate font-semibold">
                  Live Highway Alerts
                </div>
              </div>
            </div>
          </a>

          {/* Getting Started & Functions Guide */}
          {onOpenGettingStarted && (
            <button
              onClick={onOpenGettingStarted}
              className="bg-[#0A0F1A] hover:bg-[#0F1D30] border-2 border-[#D4A237] hover:border-amber-300 p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FAF4EA] text-[#070A10] flex items-center justify-center shrink-0 group-hover:scale-105 transition font-black">
                  <BookOpen className="w-4.5 h-4.5 text-[#070A10]" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-xs sm:text-sm text-[#D4A237] uppercase truncate">User Guide</div>
                  <div className="text-[11px] sm:text-xs text-amber-200 truncate font-semibold">App Functions</div>
                </div>
              </div>
            </button>
          )}

          {/* Add to Home Screen / Desktop Shortcut (At bottom) */}
          {onOpenInstallApp && (
            <button
              onClick={handleInstallButtonClick}
              className="bg-[#0A0F1A] hover:bg-[#0F1D30] border border-[#D4A237]/80 hover:border-[#D4A237] p-3 rounded-2xl flex items-center justify-between text-left shadow-md transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Smartphone className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-white uppercase truncate">
                    {isInstalled ? 'App Installed' : 'Add to Screen'}
                  </div>
                  <div className="text-[11px] sm:text-xs text-amber-300 truncate font-semibold">
                    {isInstalled ? 'Ready on Desktop' : '1-Click Install'}
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* QUICK EMERGENCY DISPATCH PILLS */}
        <div className="space-y-2.5 pt-2">
          <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#D4A237] px-1 flex items-center justify-between">
            <span>QUICK DISPATCH SERVICES</span>
            <span className="text-[10px] text-slate-400 font-semibold lowercase">tap for instant dispatch</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. SAPS Police (Blue) */}
            <button
              onClick={() => onOpenSOSModal({ emergencyType: 'crime_threat', notes: 'SAPS Police & security response requested' })}
              className="bg-[#0A0F1A] hover:bg-sky-500/15 border border-sky-500/60 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center justify-center space-y-1.5 transition cursor-pointer group shadow-lg active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-sky-950/80 border border-sky-500/40 flex items-center justify-center group-hover:scale-110 transition">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight">SAPS Police</span>
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">Blue Priority</span>
            </button>

            {/* 2. GBV Assist (Purple) */}
            <button
              onClick={() => onOpenSOSModal({ emergencyType: 'gbv_assist', notes: 'GBV / Gender-Based Violence & Vulnerable Motorist Assistance Requested' })}
              className="bg-[#0F081C] hover:bg-purple-500/20 border-2 border-purple-500/80 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center justify-center space-y-1.5 transition cursor-pointer group shadow-lg shadow-purple-950/50 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-purple-950/90 border border-purple-400/80 flex items-center justify-center group-hover:scale-110 transition">
                <HeartHandshake className="w-5 h-5 text-pink-300" />
              </div>
              <span className="text-xs sm:text-sm font-black text-purple-200 uppercase tracking-tight">GBV Assist</span>
              <span className="text-[9px] font-black text-purple-300 uppercase tracking-wider">Purple Rapid</span>
            </button>

            {/* 3. Ambulance (Green) */}
            <button
              onClick={() => onOpenSOSModal({ emergencyType: 'crash', notes: 'Ambulance / Medical trauma unit requested' })}
              className="bg-[#0A0F1A] hover:bg-emerald-500/15 border border-emerald-500/60 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center justify-center space-y-1.5 transition cursor-pointer group shadow-lg active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center group-hover:scale-110 transition">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight">Ambulance</span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Green Medical</span>
            </button>

            {/* 4. Fatal Crash (Red/Black Critical Priority) */}
            <button
              onClick={() => onOpenSOSModal({ emergencyType: 'crash', notes: 'CRITICAL FATAL CRASH: Multi-agency response requested (SAPS, EMS Trauma, Rescue, Towing)' })}
              className="bg-[#120507] hover:bg-red-950/40 border-2 border-red-500 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center justify-center space-y-1.5 transition cursor-pointer group shadow-lg shadow-red-950/40 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-red-950/90 border border-red-500/80 flex items-center justify-center group-hover:scale-110 transition">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              </div>
              <span className="text-xs sm:text-sm font-black text-red-200 uppercase tracking-tight">Fatal Crash</span>
              <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">Critical EMS</span>
            </button>

            {/* 5. Spiking (Red) */}
            <button
              onClick={() => onOpenSOSModal({ emergencyType: 'spiking_puncture', notes: 'Spike trap emergency response requested' })}
              className="bg-[#0A0F1A] hover:bg-red-500/15 border border-red-500/60 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center justify-center space-y-1.5 transition cursor-pointer group shadow-lg active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center group-hover:scale-110 transition">
                <AlertOctagon className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight">Spike Trap</span>
              <span className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Red Urgent</span>
            </button>

            {/* 6. Highway Tow (Orange) */}
            <button
              onClick={() => onOpenSOSModal({ emergencyType: 'breakdown', notes: 'Highway tow / breakdown assist requested' })}
              className="bg-[#0A0F1A] hover:bg-orange-500/15 border border-orange-500/60 p-3 sm:p-3.5 rounded-2xl flex flex-col items-center text-center justify-center space-y-1.5 transition cursor-pointer group shadow-lg active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-amber-950/80 border border-orange-500/40 flex items-center justify-center group-hover:scale-110 transition">
                <Truck className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight">Highway Tow</span>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Orange Assist</span>
            </button>
          </div>
        </div>

        {/* DEVICE LOCATION STATUS & TESTING CARD (Under Quick Dispatch) */}
        <LocationStatusCard onOpenDiagnostics={onOpenLocationCheck} />

        {/* HIGHWAY CORRIDOR RESPONSE STATISTICS & KPI CARD */}
        {(() => {
          const resolvedSOSCount = sosRequests.filter(s => s.status === 'resolved').length;
          const liveHazardsCount = reports.filter(r => r.status === 'approved' || r.status === 'resolved').length;
          const activeDispatchesCount = sosRequests.filter(s => s.status === 'dispatched' || s.status === 'active').length;

          return (
            <div className="bg-[#0A0F1A] border border-[#D4A237]/40 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                      Live Corridor Performance & Response
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Real-time statistics from patrol units & community dispatches</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTab('feed')}
                  className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Live Feed</span>
                  <span>→</span>
                </button>
              </div>

              {/* 3 Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-[#05080E] p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Avg Turnaround</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black font-mono text-amber-400">~14</span>
                    <span className="text-[10px] text-slate-400 font-bold">mins</span>
                  </div>
                  <span className="text-[8px] text-emerald-400 font-semibold uppercase tracking-tight">Rapid Secure</span>
                </div>

                <div className="bg-[#05080E] p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Hazards Live</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-400">{liveHazardsCount}</span>
                    <span className="text-[10px] text-slate-400 font-bold">alerts</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-tight">Verified Mapped</span>
                </div>

                <div className="bg-[#05080E] p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Rescues & Assist</span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-base sm:text-lg font-black font-mono text-sky-400">{resolvedSOSCount + activeDispatchesCount}</span>
                    <span className="text-[10px] text-slate-400 font-bold">motorists</span>
                  </div>
                  <span className="text-[8px] text-sky-400 font-semibold uppercase tracking-tight">{resolvedSOSCount} Safe</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ROAD SAFETY 6-ICON BADGES (Matching Slide 3 of reference mockup) */}
        <div className="bg-[#0A0F1A] border border-[#D4A237]/45 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4">
          <div className="space-y-1">
            <div className="text-xs sm:text-sm font-black text-[#D4A237] uppercase tracking-widest">
              COMMUNITY MISSION
            </div>
            <h4 className="text-base sm:text-xl font-black text-white uppercase tracking-tight">
              Together, we can create <span className="text-[#D4A237]">SAFER ROADS</span>
            </h4>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
            {/* 1. Buckle Up */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4A237] bg-[#05080E] flex items-center justify-center text-[#D4A237] shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-200">Buckle Up</span>
            </div>

            {/* 2. Obey Limits */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4A237] bg-[#05080E] flex items-center justify-center text-[#D4A237] shadow-md">
                <Gauge className="w-6 h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-200">Obey Limits</span>
            </div>

            {/* 3. No Phone */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4A237] bg-[#05080E] flex items-center justify-center text-[#D4A237] shadow-md">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-200">No Phone</span>
            </div>

            {/* 4. Don't Drink */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4A237] bg-[#05080E] flex items-center justify-center text-[#D4A237] shadow-md">
                <Wine className="w-6 h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-200">Don't Drink</span>
            </div>

            {/* 5. Maintain Car */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4A237] bg-[#05080E] flex items-center justify-center text-[#D4A237] shadow-md">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-200">Maintain</span>
            </div>

            {/* 6. Stay Alert */}
            <div className="flex flex-col items-center space-y-1.5">
              <div className="w-12 h-12 rounded-full border-2 border-[#D4A237] bg-[#05080E] flex items-center justify-center text-[#D4A237] shadow-md">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-200">Stay Alert</span>
            </div>
          </div>

          {onOpenOnboarding && (
            <div className="pt-2">
              <button
                onClick={onOpenOnboarding}
                className="w-full py-3 px-5 rounded-full bg-[#FAF4EA] hover:bg-white border border-[#D4A237] text-[#070A10] text-xs sm:text-sm font-black uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer active:scale-95"
              >
                <Award className="w-4 h-4 text-[#D4A237]" />
                <span>View Full Safety Guidelines & Tips</span>
              </button>
            </div>
          )}
        </div>

        {/* SPONSORSHIP, BETA & DEV FOOTER */}
        <div className="pt-2 space-y-4 pb-6 max-w-lg mx-auto w-full">
          <div className="text-center space-y-1">
            <p className="text-xs sm:text-sm font-black text-[#D4A237] uppercase tracking-wider">
              Together, we can create SAFER ROADS.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">
              Powered By Rik's Social Media Manager
            </p>
          </div>

          {/* FANCY BETA NOTICE CARD */}
          <BetaNoticeCard />

          {/* TERMS OF USE & POPIA PRIVACY POLICY FOOTER */}
          <div className="pt-3 pb-2 flex flex-col items-center justify-center space-y-2 text-center border-t border-[#1C2C40]/80">
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-[#0A0F1A] hover:bg-[#121E33] border border-[#D4A237]/40 hover:border-[#D4A237] text-slate-300 hover:text-[#D4A237] text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer group active:scale-95"
            >
              <Shield className="w-4 h-4 text-[#D4A237] group-hover:scale-110 transition-transform" />
              <span>Terms of Use & Privacy Policy</span>
              <span className="text-[10px] bg-[#D4A237]/20 text-[#D4A237] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                POPIA
              </span>
            </button>
            <p className="text-[11px] text-slate-500">
              Live Traffic NPC · Non-Profit Public Safety Organisation · Protection of Personal Information Act 4 of 2013
            </p>
          </div>
        </div>

      </div>

      {/* TERMS OF USE & PRIVACY POLICY MODAL */}
      <TermsPrivacyModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      {/* FREEWAY ASSISTANCE MODAL */}
      {sanralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0A0F1A] border-2 border-[#D4A237] rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-[#D4A237]/30 pb-3">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-[#D4A237]" />
                <h4 className="font-extrabold text-base sm:text-lg text-white">Highway Incident Assist</h4>
              </div>
              <button onClick={() => setSanralModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold">✕</button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Freeway Management Systems operate 24/7 patrol units on major Gauteng toll corridors (N1, N3, N4, R21, M1).
            </p>

            <div className="bg-[#05080E] p-4 rounded-2xl border border-[#D4A237]/40 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Emergency Highway Hotline:</span>
                <a href="tel:0800726725" className="font-bold text-sky-400 hover:underline flex items-center space-x-1">
                  <PhoneCall className="w-4 h-4" />
                  <span>0800 726 725</span>
                </a>
              </div>
            </div>

            <div className="flex space-x-2.5 pt-2">
              <a
                href="tel:0800726725"
                className="flex-1 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black py-3 rounded-full text-xs sm:text-sm text-center uppercase tracking-wider shadow-lg active:scale-95"
              >
                Call 0800 726 725
              </a>
              <button
                onClick={() => {
                  setSanralModalOpen(false);
                  onOpenSOSModal({ emergencyType: 'breakdown', notes: 'Freeway assist requested' });
                }}
                className="flex-1 bg-[#0C1626] hover:bg-[#122238] text-[#D4A237] border border-[#D4A237]/50 font-black py-3 rounded-full text-xs sm:text-sm uppercase tracking-wider cursor-pointer shadow-md active:scale-95"
              >
                Dispatch Patrol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
