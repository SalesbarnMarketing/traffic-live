import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Shield, AlertTriangle, MapPin, Radio, Heart, Lock, AlertOctagon, LayoutGrid, UserCheck, UserPlus, LogIn, LogOut, Car, Volume2, Key, Megaphone, Award, User, Smartphone, Mail, Compass, BookOpen, Plus, Send, ChevronDown, Sparkles, Bell, BellRing, Clock, MoreVertical, ExternalLink, HeartHandshake } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { RegisteredUser } from '../types';
import { LiveTrafficLogo } from './LiveTrafficLogo';
import { subscribeUserToPushNotifications, checkNotificationPermission } from '../utils/pushNotification';

interface NavbarProps {
  activeTab: 'dashboard' | 'map' | 'feed' | 'trafficcams' | 'traveltimes' | 'report' | 'admin' | 'donations' | 'pricing' | 'course' | 'advertiser';
  setActiveTab: (tab: any) => void;
  pendingCount: number;
  openSOSModal: (options?: { emergencyType?: string; notes?: string }) => void;
  openGBVModal?: () => void;
  openReportModal: () => void;
  onOpenDriverMode?: () => void;
  onOpenShareToX?: (options?: { text?: string; hashtags?: string[]; report?: any; feedItem?: any }) => void;
  latestAlert?: string;
  alerts?: string[];
  currentUser?: RegisteredUser | null;
  onOpenAuthModal?: (intent?: string, mode?: 'login' | 'register') => void;
  onOpenChangePassword?: () => void;
  onLogout?: () => void;
  onOpenUserProfile?: () => void;
  onOpenOnboarding?: () => void;
  onOpenFeedback?: () => void;
  onOpenLocationCheck?: () => void;
  onOpenWelcomeScreen?: () => void;
  onOpenVoiceAssistant?: () => void;
  isVoiceListening?: boolean;
  onSelectLiveAlert?: (alertText: string, alertIndex: number) => void;
  onOpenGettingStarted?: () => void;
  onOpenNotificationSettings?: () => void;
  onOpenCommunityHeroes?: () => void;
  onOpenTripBuddy?: () => void;
  isTripActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  openSOSModal,
  openGBVModal,
  openReportModal,
  onOpenDriverMode,
  onOpenShareToX,
  latestAlert,
  alerts,
  currentUser,
  onOpenAuthModal,
  onOpenChangePassword,
  onLogout,
  onOpenUserProfile,
  onOpenOnboarding,
  onOpenFeedback,
  onOpenLocationCheck,
  onOpenWelcomeScreen,
  onOpenVoiceAssistant,
  isVoiceListening,
  onSelectLiveAlert,
  onOpenGettingStarted,
  onOpenNotificationSettings,
  onOpenCommunityHeroes,
  onOpenTripBuddy,
  isTripActive
}) => {
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');
  const [isEnablingPush, setIsEnablingPush] = useState(false);
  const mobileToolsRef = useRef<HTMLDivElement>(null);

  const handleOpenGBV = () => {
    if (openGBVModal) {
      openGBVModal();
    } else {
      openSOSModal({
        emergencyType: 'gbv_assist',
        notes: 'GBV / Gender-Based Violence & Vulnerable Motorist Assistance Requested'
      });
    }
  };

  useEffect(() => {
    setPushStatus(checkNotificationPermission());
  }, []);

  const handleTogglePushNotifications = async () => {
    if (pushStatus === 'granted') {
      alert('🔔 Emergency SOS push notifications are already enabled on this device.');
      return;
    }
    setIsEnablingPush(true);
    try {
      const res = await subscribeUserToPushNotifications({
        userEmail: currentUser?.email,
        role: currentUser?.role || 'community_responder',
        deviceName: 'Mobile Web / Responder'
      });
      if (res.success) {
        setPushStatus('granted');
        alert('🔔 Emergency SOS push alerts enabled! You will receive emergency alerts when motorists post an SOS.');
      } else {
        alert(res.error || 'Could not enable push notifications. Please check browser permissions.');
        setPushStatus(checkNotificationPermission());
      }
    } catch (err: any) {
      alert('Error subscribing to push notifications: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsEnablingPush(false);
    }
  };

  // Close mobile tools dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileToolsRef.current && !mobileToolsRef.current.contains(event.target as Node)) {
        setIsMobileToolsOpen(false);
      }
    };
    if (isMobileToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileToolsOpen]);

  const alertList = useMemo(() => {
    if (alerts && alerts.length > 0) {
      return alerts;
    }
    if (latestAlert) {
      return [latestAlert];
    }
    return [
      "N1 North: Spiking hazard reported past Pumulani Toll. Drive with extreme caution.",
      "R21 Corridor: Marked Patrol Units active. Report road hazards via LiveTrafficNPC.",
      "N3 Gilloolys: Heavy congestion. Maintain safe following distance."
    ];
  }, [alerts, latestAlert]);

  // Rotate through alerts every 4.5 seconds
  useEffect(() => {
    if (alertList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentAlertIndex((prev) => (prev + 1) % alertList.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [alertList.length]);

  const activeAlertText = alertList[currentAlertIndex % alertList.length] || '';

  const handleTickerClick = () => {
    if (onSelectLiveAlert) {
      onSelectLiveAlert(activeAlertText, currentAlertIndex);
    } else {
      setActiveTab('feed');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#020408] border-b-2 border-[#D4A237]/65 text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.95)] shrink-0 select-none">
      {/* Top Ticker Tape / Live Bar */}
      <div className="bg-[#000000] border-b border-[#D4A237]/35 text-slate-200 text-xs sm:text-[13px] py-1.5 px-3 sm:px-4 flex items-center justify-between font-medium shadow-inner">
        <button
          type="button"
          onClick={handleTickerClick}
          className="flex items-center space-x-2 overflow-hidden min-w-0 flex-1 text-left cursor-pointer group/ticker hover:bg-red-950/40 active:scale-[0.99] p-1 -m-1 rounded-lg transition"
          title="Click to view full incident & feed details in Live Feeds"
          aria-label={`Live Traffic Bar: ${activeAlertText}. Click to view details.`}
        >
          {/* Pulsing Live Dot */}
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>

          {/* LIVE Tag */}
          <span className="font-black tracking-wider uppercase text-[10px] sm:text-xs bg-red-950/90 text-red-300 group-hover/ticker:bg-red-900 group-hover/ticker:text-white border border-red-500/60 px-2 py-0.5 rounded shrink-0 transition shadow-sm">
            LIVE
          </span>

          {/* Rotating Message Container */}
          <div className="overflow-hidden relative min-w-0 flex-1 h-5 flex items-center">
            <span
              key={currentAlertIndex}
              className="truncate text-slate-100 group-hover/ticker:text-amber-300 text-xs sm:text-[13px] font-medium min-w-0 transition-all duration-300 animate-fadeIn"
              title={activeAlertText}
            >
              {activeAlertText}
            </span>
          </div>

          <span className="hidden md:inline-flex items-center text-[10px] font-bold text-amber-400/90 group-hover/ticker:text-amber-200 group-hover/ticker:underline shrink-0 ml-1.5">
            View Details ➔
          </span>
        </button>

        <div className="flex items-center space-x-2 shrink-0 ml-2.5">
          {/* Quick Highway Travel Times Link */}
          <button
            onClick={() => setActiveTab(activeTab === 'traveltimes' ? 'feed' : 'traveltimes')}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition shadow cursor-pointer shrink-0 border ${
              activeTab === 'traveltimes'
                ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                : 'bg-[#040810] hover:bg-[#0A1220] text-cyan-300 hover:text-cyan-100 border-cyan-500/60'
            }`}
            title="Highway Travel Times & Live Speeds (Gauteng)"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Travel Times</span>
          </button>

          {/* Community Heroes Recognition Programme */}
          {onOpenCommunityHeroes && (
            <button
              onClick={onOpenCommunityHeroes}
              className="hidden lg:flex items-center space-x-1.5 bg-gradient-to-r from-[#D4A237]/20 to-[#8E6516]/30 hover:from-[#D4A237]/35 hover:to-[#8E6516]/45 text-[#D4A237] hover:text-yellow-200 border border-[#D4A237]/70 hover:border-[#D4A237] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer shrink-0 active:scale-95"
              title="Live Traffic Community Heroes: Report. Verify. Warn. Protect."
            >
              <Award className="w-3.5 h-3.5 text-[#D4A237]" />
              <span>Community Heroes 🏆</span>
            </button>
          )}

          {/* Safety Tour Link */}
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="hidden md:flex items-center space-x-1.5 bg-[#040810] hover:bg-[#0C1626] text-[#D4A237] hover:text-[#FAF4EA] border border-[#D4A237]/60 hover:border-[#D4A237] px-3 py-1 rounded-full text-xs font-bold transition shadow cursor-pointer shrink-0"
              title="Safe Driving Safety Tips & Rules"
            >
              <Award className="w-3 h-3 text-[#D4A237]" />
              <span>Safe Driving Tips</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center space-x-1.5 shrink-0">
              <button 
                onClick={onOpenUserProfile || onOpenChangePassword}
                className="flex items-center space-x-1.5 bg-[#040810] hover:bg-[#0A1220] border border-[#D4A237]/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[#D4A237] hover:text-[#FAF4EA] transition shrink-0 cursor-pointer shadow-sm active:scale-95 text-xs font-bold"
                title={`Profile: ${currentUser.fullName} ${currentUser.surname || ''} (${currentUser.role || 'Member'})`}
                aria-label={`Profile: ${currentUser.fullName}`}
              >
                <UserCheck className="w-3.5 h-3.5 text-[#D4A237]" />
                <span className="hidden sm:inline font-bold truncate max-w-[90px]">{currentUser.fullName}</span>
                <span className="text-[9px] uppercase bg-[#D4A237]/30 px-1 py-0.2 rounded font-black hidden md:inline">
                  {currentUser.role === 'super_admin' ? 'Admin' : currentUser.role === 'advertiser' ? 'Ad' : 'Driver'}
                </span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-red-950/90 hover:bg-red-900 text-red-300 hover:text-white border border-red-500/60 rounded-full transition cursor-pointer shrink-0 active:scale-95 shadow-sm"
                  title="Log Out"
                  aria-label="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Login Button */}
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('login to your account', 'login')}
                className="flex items-center space-x-1 bg-[#040810] hover:bg-[#0C1626] text-slate-200 hover:text-white border border-[#D4A237]/60 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold transition shadow cursor-pointer shrink-0 active:scale-95"
                title="Log In to your Account"
                aria-label="Log In"
              >
                <LogIn className="w-3 h-3 text-[#D4A237]" />
                <span>Login</span>
              </button>

              {/* Register Button */}
              <button
                onClick={() => onOpenAuthModal && onOpenAuthModal('create your account', 'register')}
                className="flex items-center space-x-1 bg-gradient-to-r from-[#D4A237] to-[#B58525] hover:brightness-110 text-slate-950 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-tight transition shadow-md cursor-pointer shrink-0 active:scale-95"
                title="Create New Account / Register"
                aria-label="Register"
              >
                <UserPlus className="w-3 h-3 text-slate-950 stroke-[2.5]" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 bg-[#020408]">
        <div className="flex items-center justify-between h-14 sm:h-18 gap-1 sm:gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-1.5 sm:space-x-3.5 shrink-0 min-w-0">
            <div 
              className="cursor-pointer hover:scale-105 transition group shrink-0 relative flex items-center justify-center"
              onClick={() => {
                if (onOpenWelcomeScreen) onOpenWelcomeScreen();
                else setActiveTab('dashboard');
              }}
              title="Click to view Official Live Traffic NPC Badge & Welcome Screen"
            >
              <LiveTrafficLogo size="sm" showText={false} withGlow={false} animateBeacon={true} className="w-8 h-10 sm:w-11 sm:h-13 group-hover:scale-105 transition shrink-0" />
            </div>
            <div className="cursor-pointer min-w-0 flex flex-col justify-center" onClick={() => setActiveTab('feed')}>
              <div className="flex items-center space-x-1">
                <span className="font-black text-[11px] sm:text-sm tracking-wider sm:tracking-widest text-white font-sans uppercase leading-tight">
                  LIVE
                </span>
                <span className="hidden sm:inline-flex bg-[#D4A237]/25 text-[#D4A237] border border-[#D4A237]/50 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-sm">
                  SINCE 2023
                </span>
              </div>
              <div className="font-extrabold text-[9px] sm:text-xs tracking-wider text-slate-200 font-sans whitespace-nowrap uppercase leading-tight mt-0.5">
                TRAFFIC <span className="text-[#D4A237]">NPC</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#D4A237]/90 hidden md:block tracking-wide font-medium mt-0.5">
                Road Safety Patrols & Community Monitoring
              </p>
            </div>
          </div>

          {/* Right Side: Contact Icons + Action Buttons */}
          <div className="flex items-center space-x-1 sm:space-x-2.5 shrink-0">
            {/* Trip Buddy Journey Monitor Button (Desktop & Tablet only - on mobile it lives in the quick tools dropdown) */}
            {onOpenTripBuddy && (
              <button
                id="navbar-trip-buddy-btn"
                type="button"
                onClick={onOpenTripBuddy}
                className={`hidden sm:flex h-8 sm:h-9 px-3.5 ${
                  isTripActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400/80 shadow-lg shadow-emerald-950/80 animate-pulse'
                    : 'bg-gradient-to-r from-emerald-900/80 via-teal-900/80 to-emerald-950 hover:brightness-110 text-emerald-300 hover:text-white border-emerald-500/50'
                } font-black rounded-full text-xs sm:text-sm items-center justify-center space-x-1.5 shadow-md transition uppercase tracking-wider border cursor-pointer shrink-0 whitespace-nowrap active:scale-95 group`}
                title="Trip Buddy - In-App Live Journey Monitoring & Safety Check-ins"
                aria-label="Trip Buddy"
              >
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-black">
                  {isTripActive ? 'TRACKING TRIP' : 'TRIP TRACKER'}
                </span>
                {isTripActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping hidden md:inline-block" />
                )}
              </button>
            )}

            {/* GBV (Gender-Based Violence) Assist Button - Placed Before Emergency SOS */}
            <button
              id="navbar-gbv-assist-btn"
              type="button"
              onClick={handleOpenGBV}
              className="h-8 sm:h-9 px-2 sm:px-4 bg-gradient-to-r from-purple-700 via-fuchsia-700 to-purple-800 hover:brightness-110 text-white font-black rounded-full text-[10px] sm:text-sm flex items-center justify-center space-x-1 sm:space-x-1.5 shadow-lg shadow-purple-950/80 transition uppercase tracking-wider border border-purple-400/70 cursor-pointer shrink-0 whitespace-nowrap active:scale-95 group"
              title="GBV (Gender-Based Violence) Emergency Assistance & Rapid Dispatch"
              aria-label="GBV (Gender-Based Violence) Assist"
            >
              <HeartHandshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-200 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="sm:hidden font-black text-[10px] tracking-wider">GBV</span>
              <span className="hidden sm:inline font-black">GBV ASSIST</span>
            </button>

            {/* Emergency SOS Button */}
            <button
              id="navbar-sos-emergency-btn"
              type="button"
              onClick={() => openSOSModal()}
              className="h-8 sm:h-9 px-2.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 text-white font-black rounded-full text-xs sm:text-sm flex items-center justify-center space-x-1 sm:space-x-2 shadow-xl shadow-red-950/90 transition uppercase tracking-wider border border-red-400/60 cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
              title="Emergency SOS Dispatch"
              aria-label="Emergency SOS"
            >
              <span className="inline-block w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-white rounded-full animate-pulse shrink-0"></span>
              <span className="sm:hidden font-black text-[11px] tracking-wider">SOS</span>
              <span className="hidden sm:inline">EMERGENCY SOS</span>
            </button>

            {/* Desktop & Tablet: The 3 buttons displayed inline (hidden sm:flex) */}
            <div className="hidden sm:flex items-center space-x-2 sm:space-x-3">
              {/* Live SOS Emergency Push Alerts Bell */}
              <button
                id="navbar-push-alert-bell"
                onClick={() => {
                  if (onOpenNotificationSettings) {
                    onOpenNotificationSettings();
                  } else {
                    handleTogglePushNotifications();
                  }
                }}
                disabled={isEnablingPush}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border ${
                  pushStatus === 'granted'
                    ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'border-[#D4A237]/80 hover:border-[#D4A237] bg-[#000000] hover:bg-[#070D18] text-[#D4A237]'
                } flex items-center justify-center transition shadow-md cursor-pointer shrink-0 relative group`}
                title={
                  pushStatus === 'granted'
                    ? 'Push Notifications & Sound Preferences (Active)'
                    : 'Configure Push Notifications & Sound Preferences'
                }
                aria-label="Toggle Emergency Push Notifications"
              >
                {pushStatus === 'granted' ? (
                  <BellRing className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                ) : (
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A237] group-hover:scale-110 transition-transform" />
                )}
                {pushStatus === 'granted' && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>

              {/* GPS / Location Diagnostic Check */}
              {onOpenLocationCheck && (
                <button
                  onClick={onOpenLocationCheck}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#D4A237]/80 hover:border-[#D4A237] bg-[#000000] hover:bg-[#070D18] text-[#D4A237] flex items-center justify-center transition shadow-md cursor-pointer shrink-0 group"
                  title="Location & GPS Settings"
                  aria-label="Location & GPS Settings"
                >
                  <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A237] group-hover:rotate-45 transition-transform duration-300" />
                </button>
              )}

              {/* WhatsApp Channel Link */}
              <a
                href="https://whatsapp.com/channel/0029Va91KckDzgTGXcqt3I2I"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-[#25D366]/80 hover:border-[#25D366] bg-[#000000] hover:bg-[#070D18] text-[#25D366] flex items-center justify-center transition shadow-md cursor-pointer shrink-0 group"
                title="Join Official LiveTraffic WhatsApp Channel for Real-Time Highway Alerts"
                aria-label="LiveTraffic WhatsApp Channel"
              >
                <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </a>
            </div>

            {/* Mobile Only: Single Compact Dropdown Button for the tools (Trip Buddy, Alerts, GPS, WhatsApp) */}
            <div className="relative flex sm:hidden" ref={mobileToolsRef}>
              <button
                type="button"
                onClick={() => setIsMobileToolsOpen((prev) => !prev)}
                className={`w-9 h-9 rounded-full border ${
                  isMobileToolsOpen
                    ? 'border-[#D4A237] bg-[#0D1524] text-[#D4A237] shadow-lg shadow-amber-950/70'
                    : isTripActive
                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-400 shadow-md shadow-emerald-950 animate-pulse'
                    : pushStatus === 'granted'
                    ? 'border-emerald-500/80 bg-emerald-950/50 text-emerald-400'
                    : 'border-[#D4A237]/80 hover:border-[#D4A237] bg-[#000000] hover:bg-[#070D18] text-[#D4A237]'
                } flex items-center justify-center transition shadow-md cursor-pointer shrink-0 relative active:scale-95`}
                title="Open Quick Tools Menu (Trip Buddy, Alerts, GPS, WhatsApp)"
                aria-label="Quick Tools Menu"
                aria-expanded={isMobileToolsOpen}
              >
                <MoreVertical className="w-4 h-4" />
                {isTripActive ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#020408] animate-ping"></span>
                ) : pushStatus === 'granted' ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#020408] animate-pulse"></span>
                ) : null}
              </button>

              {/* Mobile Floating Dropdown Menu */}
              {isMobileToolsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#020408]/98 border-2 border-[#D4A237]/75 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.98)] z-50 py-2 overflow-hidden backdrop-blur-2xl animate-fadeIn divide-y divide-slate-800/80">
                  {/* Menu Header */}
                  <div className="px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-[#D4A237] flex items-center justify-between bg-[#000000]">
                    <span>Quick Tools & Channels</span>
                    {pushStatus === 'granted' ? (
                      <span className="text-emerald-400 text-[9px] flex items-center space-x-1 font-mono font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        <span>ALERTS ACTIVE</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[9px] font-mono">STANDBY</span>
                    )}
                  </div>

                  <div className="py-1 space-y-0.5">
                    {/* Item -1: Trip Buddy In-App Journey Monitor */}
                    {onOpenTripBuddy && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenTripBuddy();
                          setIsMobileToolsOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left text-xs ${
                          isTripActive ? 'text-emerald-300 bg-emerald-950/50' : 'text-emerald-400 hover:text-emerald-200'
                        } flex items-center space-x-3 transition cursor-pointer hover:bg-emerald-950/40 active:bg-emerald-900/50`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                          isTripActive ? 'border-emerald-400 bg-emerald-900 text-white animate-pulse' : 'border-emerald-500/80 bg-emerald-950/70 text-emerald-400'
                        }`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold flex items-center space-x-1.5 text-white">
                            <span className="truncate">Trip Buddy Monitor</span>
                            <span className={`text-[9px] ${
                              isTripActive ? 'bg-emerald-600 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            } px-1.5 py-0.2 rounded font-mono uppercase font-black`}>
                              {isTripActive ? 'LIVE' : 'NEW'}
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-300/80 truncate">
                            {isTripActive ? 'Journey active • Tap to open HUD' : 'Live journey tracking & safety check-in timer'}
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Item 0: GBV Assist Dispatch */}
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenGBV();
                        setIsMobileToolsOpen(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs text-purple-200 hover:text-white flex items-center space-x-3 transition cursor-pointer hover:bg-purple-950/40 active:bg-purple-900/50"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-purple-500/80 bg-purple-950/70 text-pink-300">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <span className="truncate">GBV Emergency Assist</span>
                          <span className="text-[9px] bg-purple-950 text-pink-300 border border-purple-500/50 px-1 py-0.2 rounded font-mono uppercase font-black">
                            PRIORITY
                          </span>
                        </div>
                        <p className="text-[10px] text-purple-300/80 truncate">
                          Gender-based violence dispatch & safe escort
                        </p>
                      </div>
                    </button>

                    {/* Item 0.5: Community Heroes Recognition */}
                    {onOpenCommunityHeroes && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCommunityHeroes();
                          setIsMobileToolsOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-xs text-[#D4A237] hover:text-yellow-200 flex items-center space-x-3 transition cursor-pointer hover:bg-[#121E36] active:bg-[#152545]"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#D4A237] bg-amber-950/60 text-[#D4A237]">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold flex items-center space-x-1.5 text-white">
                            <span className="truncate">Community Heroes</span>
                            <span className="text-[9px] bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/60 px-1 py-0.2 rounded font-mono uppercase font-black">
                              POINTS
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Badges, reputation & category leaderboards
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Item 1: Push Alerts Bell */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileToolsOpen(false);
                        if (onOpenNotificationSettings) {
                          onOpenNotificationSettings();
                        } else {
                          handleTogglePushNotifications();
                        }
                      }}
                      disabled={isEnablingPush}
                      className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center space-x-3 transition cursor-pointer hover:bg-[#121E36] active:bg-[#152545] ${
                        pushStatus === 'granted' ? 'text-emerald-300' : 'text-slate-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                          pushStatus === 'granted'
                            ? 'border-emerald-500/80 bg-emerald-950/60 text-emerald-400'
                            : 'border-[#D4A237]/80 bg-[#070E1A] text-[#D4A237]'
                        }`}
                      >
                        {pushStatus === 'granted' ? (
                          <BellRing className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Bell className="w-4 h-4 text-[#D4A237]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold flex items-center space-x-1.5">
                          <span className="truncate">Emergency Push Alerts</span>
                          {pushStatus === 'granted' && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1 py-0.2 rounded font-mono uppercase font-black">
                              ON
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          {pushStatus === 'granted'
                            ? 'Active • Tap to test/manage alerts'
                            : 'Enable highway SOS push alerts'}
                        </p>
                      </div>
                    </button>

                    {/* Item 2: GPS / Location Diagnostic Check */}
                    {onOpenLocationCheck && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenLocationCheck();
                          setIsMobileToolsOpen(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:text-amber-300 flex items-center space-x-3 transition cursor-pointer hover:bg-[#121E36] active:bg-[#152545]"
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#D4A237]/80 bg-[#070E1A] text-[#D4A237]">
                          <Compass className="w-4 h-4 text-[#D4A237]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-200 truncate">Location & GPS Settings</div>
                          <p className="text-[10px] text-slate-400 truncate">
                            Configure GPS, area & diagnostics
                          </p>
                        </div>
                      </button>
                    )}

                    {/* Item 3: Official WhatsApp Channel Link */}
                    <a
                      href="https://whatsapp.com/channel/0029Va91KckDzgTGXcqt3I2I"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMobileToolsOpen(false)}
                      className="w-full px-3.5 py-2.5 text-left text-xs text-slate-200 hover:text-[#25D366] flex items-center space-x-3 transition cursor-pointer hover:bg-[#121E36] active:bg-[#152545]"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#25D366]/80 bg-emerald-950/40">
                        <WhatsAppIcon className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-200 flex items-center justify-between">
                          <span className="truncate">WhatsApp Channel</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#25D366] shrink-0 ml-1 opacity-80" />
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">
                          Official SA Highway Broadcasts
                        </p>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

