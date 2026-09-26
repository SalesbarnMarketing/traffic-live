import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Award,
  Shield,
  Star,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Sparkles,
  Flame,
  Search,
  ChevronRight,
  ChevronLeft,
  Info,
  Calendar,
  Users,
  Clock,
  Radio,
  ExternalLink,
  ThumbsUp,
  Share2,
  Lock,
  Unlock,
  AlertOctagon,
  HeartHandshake
} from 'lucide-react';
import {
  RegisteredUser,
  CommunityReputationProfile,
  CommunityHeroLeaderboardEntry,
  CommunityLeaderboardCategory,
  CommunityTimeframe,
  HeroCategory
} from '../types';
import {
  COMMUNITY_HERO_BADGES,
  POINT_SYSTEM_RULES,
  SEED_COMMUNITY_HEROES,
  calculateUserTier,
  calculateBadgeProgress
} from '../data/communityHeroesData';
import { getLocalHeroProfile } from '../utils/communityHeroesUtils';
import { CommunityReputationCard } from './CommunityReputationCard';

interface CommunityHeroesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: RegisteredUser | null;
  onOpenReportModal?: () => void;
  onOpenAuthModal?: (intent?: string, mode?: 'login' | 'register') => void;
}

export const CommunityHeroesModal: React.FC<CommunityHeroesModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenReportModal,
  onOpenAuthModal
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'leaderboard' | 'profile' | 'badges' | 'how_it_works'>('leaderboard');
  const [selectedCategory, setSelectedCategory] = useState<CommunityLeaderboardCategory>('overall');
  const [selectedTimeframe, setSelectedTimeframe] = useState<CommunityTimeframe>('all_time');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectedHero, setInspectedHero] = useState<CommunityReputationProfile | null>(null);
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState<HeroCategory | 'all'>('all');
  const [remoteHeroes, setRemoteHeroes] = useState<CommunityReputationProfile[]>([]);

  // Navigation tabs scroll refs
  const mainTabsRef = useRef<HTMLDivElement>(null);
  const categoryTabsRef = useRef<HTMLDivElement>(null);
  const badgeTabsRef = useRef<HTMLDivElement>(null);

  const scrollMainTabs = (direction: 'left' | 'right') => {
    if (mainTabsRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      mainTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollCategoryTabs = (direction: 'left' | 'right') => {
    if (categoryTabsRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      categoryTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollBadgeTabs = (direction: 'left' | 'right') => {
    if (badgeTabsRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      badgeTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Refresh latest community heroes from database when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/community-heroes')
        .then(r => r.json())
        .then(data => {
          if (data && data.success && Array.isArray(data.heroes) && data.heroes.length > 0) {
            setRemoteHeroes(data.heroes);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Active current user profile
  const userProfile = useMemo(() => {
    return getLocalHeroProfile(currentUser);
  }, [currentUser]);

  // Combine server/seed heroes with current user if not already in list
  const allHeroes = useMemo(() => {
    const base = remoteHeroes.length > 0 ? remoteHeroes : SEED_COMMUNITY_HEROES;
    const list = [...base];
    if (userProfile && !list.some(h => h.email.toLowerCase() === userProfile.email.toLowerCase())) {
      list.push(userProfile);
    }
    return list;
  }, [userProfile, remoteHeroes]);

  // Compute leaderboard entries based on category & timeframe (Strictly points > 0 and Top 10 only)
  const leaderboardEntries = useMemo(() => {
    let list = [...allHeroes].map((hero) => {
      let categoryScore = hero.totalReputation || 0;
      let topBadges = (hero.badges || []).slice(0, 3).map(b => b.icon);

      if (selectedCategory === 'reporter') {
        categoryScore = (hero.approvedReportsCount || 0) * 10;
      } else if (selectedCategory === 'verifier') {
        categoryScore = (hero.verificationsCount || 0) * 5;
      } else if (selectedCategory === 'warning') {
        categoryScore = (hero.warningsCount || 0) * 5;
      } else if (selectedCategory === 'location') {
        categoryScore = (hero.locationCorrectionsCount || 0) * 3 + ((hero.approvedReportsCount || 0) * 2);
      } else if (selectedCategory === 'helper') {
        categoryScore = (hero.helpfulUpdatesCount || 0) * 5 + ((hero.emergencyAssistsCount || 0) * 15);
      }

      // Timeframe multiplier simulation for active weekly/monthly realism
      if (selectedTimeframe === 'weekly') {
        categoryScore = Math.round(categoryScore * 0.18 + ((hero.approvedReportsCount || 0) * 2));
      } else if (selectedTimeframe === 'monthly') {
        categoryScore = Math.round(categoryScore * 0.45 + ((hero.verificationsCount || 0) * 3));
      }

      return {
        rank: 0,
        userId: hero.userId,
        fullName: hero.fullName,
        surname: hero.surname,
        tier: hero.tier,
        tierIcon: hero.tierIcon,
        totalReputation: hero.totalReputation || 0,
        categoryScore,
        reportsCount: hero.approvedReportsCount || 0,
        verificationsCount: hero.verificationsCount || 0,
        warningsCount: hero.warningsCount || 0,
        accuracyRate: hero.accuracyRate || 100,
        topBadges,
        isCurrentUser: Boolean(currentUser && hero.email && hero.email.toLowerCase() === currentUser.email.toLowerCase()),
        originalProfile: hero
      };
    });

    // 1. Strictly exclude heroes with 0 points from the leaderboard
    list = list.filter(item => item.categoryScore > 0);

    // 2. Sort descending by categoryScore
    list.sort((a, b) => b.categoryScore - a.categoryScore);

    // 3. Strictly cap at Top 10 contributors
    list = list.slice(0, 10);

    // 4. Assign rank 1 to 10
    list = list.map((item, idx) => ({ ...item, rank: idx + 1 }));

    // 5. Apply search filter if query is typed
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item =>
        item.fullName.toLowerCase().includes(q) ||
        (item.surname || '').toLowerCase().includes(q) ||
        item.tier.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allHeroes, selectedCategory, selectedTimeframe, searchQuery, currentUser]);

  if (!isOpen) return null;

  const topThree = leaderboardEntries.slice(0, 3);
  const remainingEntries = leaderboardEntries.slice(3);

  const handleShareProgramme = () => {
    const text = `🚦 LIVE TRAFFIC COMMUNITY HEROES: Report. Verify. Warn. Protect. Earn badges, reputation and recognition making South African roads safer!`;
    if (navigator.share) {
      navigator.share({
        title: 'Live Traffic NPC - Community Heroes',
        text,
        url: window.location.href
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + window.location.href)}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#070C16] border-2 border-[#D4A237] rounded-3xl w-full max-w-5xl h-[94vh] sm:h-[90vh] flex flex-col shadow-[0_0_80px_rgba(212,162,55,0.35)] overflow-hidden text-slate-100">
        
        {/* Sleek Top Header Bar */}
        <div className="bg-gradient-to-r from-[#121E36] via-[#080E1B] to-[#121E36] px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[#D4A237]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#D4A237] via-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-950/80 shrink-0 border border-yellow-100">
              <Award className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-lg font-black text-white uppercase tracking-wider truncate">
                  Live Traffic Community Heroes
                </h2>
                <span className="hidden sm:inline-flex bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/60 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Report. Verify. Warn. Protect.
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                South Africa's road safety recognition & reputation programme
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleShareProgramme}
              className="p-2 rounded-full bg-[#121E36] hover:bg-[#1A2C4E] text-[#D4A237] hover:text-white border border-[#D4A237]/40 transition cursor-pointer"
              title="Share Community Heroes Programme"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700 cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Sub-Navigation Tabs */}
        <div className="bg-[#050912] border-b border-slate-800 px-2 sm:px-6 py-2 flex items-center justify-between gap-1.5 shrink-0 relative">
          {/* Left Arrow Button for mobile */}
          <button
            onClick={() => scrollMainTabs('left')}
            className="sm:hidden p-1.5 rounded-xl bg-[#0E1726] border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 transition shrink-0 active:scale-95 shadow cursor-pointer"
            title="Scroll tabs left"
            aria-label="Scroll tabs left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={mainTabsRef}
            className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto scrollbar-none flex-1 min-w-0 py-0.5"
          >
            <button
              onClick={() => { setActiveMainTab('leaderboard'); setInspectedHero(null); }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeMainTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 shadow-md shadow-amber-950/60'
                  : 'bg-[#0E1726] hover:bg-[#142136] text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Leaderboards 🏆</span>
            </button>

            <button
              onClick={() => { setActiveMainTab('profile'); setInspectedHero(null); }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeMainTab === 'profile'
                  ? 'bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 shadow-md shadow-amber-950/60'
                  : 'bg-[#0E1726] hover:bg-[#142136] text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>My Reputation Profile ⭐</span>
            </button>

            <button
              onClick={() => { setActiveMainTab('badges'); setInspectedHero(null); }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeMainTab === 'badges'
                  ? 'bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 shadow-md shadow-amber-950/60'
                  : 'bg-[#0E1726] hover:bg-[#142136] text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Badges Catalog ({COMMUNITY_HERO_BADGES.length})</span>
            </button>

            <button
              onClick={() => { setActiveMainTab('how_it_works'); setInspectedHero(null); }}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                activeMainTab === 'how_it_works'
                  ? 'bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 shadow-md shadow-amber-950/60'
                  : 'bg-[#0E1726] hover:bg-[#142136] text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>How It Works & Points</span>
            </button>
          </div>

          {/* Right Arrow Button for mobile */}
          <button
            onClick={() => scrollMainTabs('right')}
            className="sm:hidden p-1.5 rounded-xl bg-[#0E1726] border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 transition shrink-0 active:scale-95 shadow cursor-pointer"
            title="Scroll tabs right"
            aria-label="Scroll tabs right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick Rep Score Chip for Current User */}
          <div className="hidden md:flex items-center space-x-2 bg-[#10192B] border border-[#D4A237]/50 px-3 py-1 rounded-full text-xs shrink-0">
            <span className="text-slate-400">My Score:</span>
            <span className="font-black text-amber-400 font-mono">{(userProfile.totalReputation || 0).toLocaleString()} pts</span>
            <span className="text-xs">{userProfile.tierIcon}</span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6 scrollbar-thin">

          {/* ======================================================== */}
          {/* TAB 1: LEADERBOARDS VIEW */}
          {/* ======================================================== */}
          {activeMainTab === 'leaderboard' && (
            <div className="space-y-5">
              {/* Category Tabs & Timeframe Filters */}
              <div className="flex flex-col gap-3 bg-[#0A101C] p-3 rounded-2xl border border-slate-800">
                {/* Category Pill Switchers with navigation arrows on mobile */}
                <div className="flex items-center gap-1.5 w-full">
                  <button
                    onClick={() => scrollCategoryTabs('left')}
                    className="md:hidden p-1 rounded-lg bg-[#121B2C] border border-slate-700 text-amber-400 hover:text-white transition shrink-0 active:scale-95 shadow cursor-pointer"
                    title="Scroll categories left"
                    aria-label="Scroll categories left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div
                    ref={categoryTabsRef}
                    className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0 py-0.5"
                  >
                    <button
                      onClick={() => setSelectedCategory('overall')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedCategory === 'overall'
                          ? 'bg-[#D4A237] text-slate-950 shadow font-black'
                          : 'bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      🏆 Overall Heroes
                    </button>
                    <button
                      onClick={() => setSelectedCategory('reporter')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedCategory === 'reporter'
                          ? 'bg-blue-600 text-white shadow font-black'
                          : 'bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      🚨 Top Reporters
                    </button>
                    <button
                      onClick={() => setSelectedCategory('verifier')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedCategory === 'verifier'
                          ? 'bg-teal-600 text-white shadow font-black'
                          : 'bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      ✅ Top Verifiers
                    </button>
                    <button
                      onClick={() => setSelectedCategory('warning')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedCategory === 'warning'
                          ? 'bg-amber-600 text-white shadow font-black'
                          : 'bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      ⚠️ Top Warnings
                    </button>
                    <button
                      onClick={() => setSelectedCategory('location')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedCategory === 'location'
                          ? 'bg-indigo-600 text-white shadow font-black'
                          : 'bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      🗺️ Location Masters
                    </button>
                    <button
                      onClick={() => setSelectedCategory('helper')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                        selectedCategory === 'helper'
                          ? 'bg-purple-600 text-white shadow font-black'
                          : 'bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      🤝 Community Helpers
                    </button>
                  </div>

                  <button
                    onClick={() => scrollCategoryTabs('right')}
                    className="md:hidden p-1 rounded-lg bg-[#121B2C] border border-slate-700 text-amber-400 hover:text-white transition shrink-0 active:scale-95 shadow cursor-pointer"
                    title="Scroll categories right"
                    aria-label="Scroll categories right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Right: Timeframe Switcher & Search Bar - Clean responsive wrap preventing card border overflow */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full pt-1 border-t border-slate-800/80">
                  <div className="bg-[#121B2C] border border-slate-700/80 rounded-xl p-0.5 flex items-center justify-between sm:justify-start text-xs w-full sm:w-auto shrink-0 shadow-inner">
                    <button
                      onClick={() => setSelectedTimeframe('weekly')}
                      className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        selectedTimeframe === 'weekly' ? 'bg-[#D4A237] text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setSelectedTimeframe('monthly')}
                      className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        selectedTimeframe === 'monthly' ? 'bg-[#D4A237] text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedTimeframe('all_time')}
                      className={`flex-1 sm:flex-initial text-center px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        selectedTimeframe === 'all_time' ? 'bg-[#D4A237] text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All-Time
                    </button>
                  </div>

                  {/* Search - Fits cleanly within card boundaries */}
                  <div className="relative w-full sm:w-56 min-w-0">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search heroes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#121B2C] border border-slate-700/80 text-xs text-white rounded-xl pl-8 pr-7 py-1.5 focus:outline-none focus:border-[#D4A237] transition shadow-inner placeholder:text-slate-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        title="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Inspected Hero Modal Overlay if selected */}
              {inspectedHero && (
                <div className="bg-[#050912] border-2 border-cyan-400 rounded-3xl p-4 sm:p-5 relative animate-fadeIn">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black uppercase text-cyan-400">Inspecting Hero Profile</span>
                    </div>
                    <button
                      onClick={() => setInspectedHero(null)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Close Profile View ✕
                    </button>
                  </div>
                  <CommunityReputationCard
                    profile={inspectedHero}
                    isCurrentUser={currentUser && inspectedHero.email.toLowerCase() === currentUser.email.toLowerCase()}
                    onViewBadgesTab={() => { setActiveMainTab('badges'); setInspectedHero(null); }}
                  />
                </div>
              )}

              {/* Top 3 Podium Highlights */}
              {!searchQuery && topThree.length >= 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Rank 2 - Silver */}
                  {topThree[1] && (
                    <div
                      onClick={() => setInspectedHero((topThree[1] as any).originalProfile)}
                      className="bg-[#0E1626] border-2 border-slate-400/60 hover:border-slate-300 rounded-3xl p-4 text-center cursor-pointer transition transform hover:-translate-y-1 shadow-lg flex flex-col justify-between order-2 sm:order-1"
                    >
                      <div>
                        <div className="text-2xl mb-1">🥈</div>
                        <div className="inline-block text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-200 px-2 py-0.5 rounded-full border border-slate-600 mb-2">
                          2nd Place
                        </div>
                        <h4 className="text-base font-black text-white truncate">
                          {topThree[1].fullName} {topThree[1].surname}
                        </h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {topThree[1].tierIcon} {topThree[1].tier}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <div className="text-xl font-black text-slate-200 font-mono">
                          {topThree[1].categoryScore.toLocaleString()} <span className="text-xs text-slate-400 font-sans">PTS</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1.5 mt-2">
                          {topThree[1].topBadges.map((icon, i) => (
                            <span key={i} className="text-base">{icon}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rank 1 - Gold (Centered & Elevated) */}
                  {topThree[0] && (
                    <div
                      onClick={() => setInspectedHero((topThree[0] as any).originalProfile)}
                      className="bg-[#131E33] border-2 border-[#D4A237] hover:border-yellow-300 rounded-3xl p-5 text-center cursor-pointer transition transform hover:-translate-y-1 shadow-2xl shadow-amber-950/60 flex flex-col justify-between order-1 sm:order-2 sm:-mt-2"
                    >
                      <div>
                        <div className="text-3xl mb-1">🥇</div>
                        <div className="inline-block text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 px-2.5 py-0.5 rounded-full shadow mb-2 font-mono">
                          1st Place Champion
                        </div>
                        <h4 className="text-lg font-black text-white truncate">
                          {topThree[0].fullName} {topThree[0].surname}
                        </h4>
                        <div className="text-xs text-amber-300 font-bold mt-0.5">
                          {topThree[0].tierIcon} {topThree[0].tier}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#D4A237]/30">
                        <div className="text-2xl font-black text-amber-400 font-mono">
                          {topThree[0].categoryScore.toLocaleString()} <span className="text-xs text-[#D4A237] font-sans">PTS</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          {topThree[0].topBadges.map((icon, i) => (
                            <span key={i} className="text-lg">{icon}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rank 3 - Bronze */}
                  {topThree[2] && (
                    <div
                      onClick={() => setInspectedHero((topThree[2] as any).originalProfile)}
                      className="bg-[#0E1626] border-2 border-amber-700/60 hover:border-amber-600 rounded-3xl p-4 text-center cursor-pointer transition transform hover:-translate-y-1 shadow-lg flex flex-col justify-between order-3"
                    >
                      <div>
                        <div className="text-2xl mb-1">🥉</div>
                        <div className="inline-block text-[10px] font-black uppercase tracking-wider bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700/60 mb-2">
                          3rd Place
                        </div>
                        <h4 className="text-base font-black text-white truncate">
                          {topThree[2].fullName} {topThree[2].surname}
                        </h4>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {topThree[2].tierIcon} {topThree[2].tier}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <div className="text-xl font-black text-amber-500 font-mono">
                          {topThree[2].categoryScore.toLocaleString()} <span className="text-xs text-slate-400 font-sans">PTS</span>
                        </div>
                        <div className="flex items-center justify-center space-x-1.5 mt-2">
                          {topThree[2].topBadges.map((icon, i) => (
                            <span key={i} className="text-base">{icon}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Full Leaderboard Table / Rankings List */}
              <div className="bg-[#0A101D] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-[#0E1726] border-b border-slate-800 text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="w-8 text-center">Rank</span>
                    <div className="flex items-center space-x-2">
                      <span>Community Hero</span>
                      <span className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold px-1.5 py-0.5 rounded-full lowercase">
                        top 10
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 sm:space-x-10">
                    <span className="hidden sm:inline">Impact Stats</span>
                    <span>Score (PTS)</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {leaderboardEntries.length === 0 && (
                    <div className="py-12 px-4 text-center space-y-3">
                      <div className="text-4xl">🚦</div>
                      <h4 className="text-sm font-black text-white">No Community Heroes Recorded Yet</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Be the first to submit a verified road incident report (+10 pts) or confirm a traffic hazard (+5 pts) to top the leaderboard!
                      </p>
                      {onOpenReportModal && (
                        <button
                          onClick={onOpenReportModal}
                          className="mt-2 bg-[#D4A237] hover:bg-yellow-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow"
                        >
                          🚨 Submit Road Report
                        </button>
                      )}
                    </div>
                  )}
                  {leaderboardEntries.map((hero) => (
                    <div
                      key={hero.userId}
                      onClick={() => setInspectedHero((hero as any).originalProfile)}
                      className={`px-4 py-3 flex items-center justify-between hover:bg-[#121E36] transition cursor-pointer ${
                        hero.isCurrentUser ? 'bg-[#15233D] border-l-4 border-[#D4A237]' : ''
                      }`}
                    >
                      {/* Left: Rank & User */}
                      <div className="flex items-center space-x-3.5 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                          hero.rank === 1 ? 'bg-amber-400 text-slate-950' :
                          hero.rank === 2 ? 'bg-slate-300 text-slate-950' :
                          hero.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {hero.rank}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-white truncate">
                              {hero.fullName} {hero.surname}
                            </span>
                            {hero.isCurrentUser && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                            <span>{hero.tierIcon} {hero.tier}</span>
                            <span>•</span>
                            <span className="text-emerald-400">{hero.accuracyRate}% Accuracy</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges, Stats & Score */}
                      <div className="flex items-center space-x-4 sm:space-x-8 shrink-0">
                        {/* Badges preview */}
                        <div className="hidden sm:flex items-center space-x-1">
                          {hero.topBadges.map((icon, i) => (
                            <span key={i} className="text-sm" title="Earned Badge">{icon}</span>
                          ))}
                        </div>

                        {/* Breakdown pills */}
                        <div className="hidden md:flex items-center space-x-2 text-[10px] text-slate-400">
                          <span className="bg-blue-950/60 border border-blue-500/30 px-1.5 py-0.5 rounded text-blue-300">
                            🚨 {hero.reportsCount}
                          </span>
                          <span className="bg-teal-950/60 border border-teal-500/30 px-1.5 py-0.5 rounded text-teal-300">
                            ✅ {hero.verificationsCount}
                          </span>
                          <span className="bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded text-amber-300">
                            ⚠️ {hero.warningsCount}
                          </span>
                        </div>

                        {/* Score */}
                        <div className="text-right min-w-[70px]">
                          <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                            {hero.categoryScore.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase">Points</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MY REPUTATION PROFILE VIEW */}
          {/* ======================================================== */}
          {activeMainTab === 'profile' && (
            <div className="space-y-6">
              <CommunityReputationCard
                profile={userProfile}
                isCurrentUser={true}
                onViewBadgesTab={() => setActiveMainTab('badges')}
                onViewLeaderboardTab={() => setActiveMainTab('leaderboard')}
              />

              {/* Call to action for reporting or verifying */}
              <div className="bg-[#121E36] border border-[#D4A237]/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm sm:text-base font-black text-white">
                    Want to earn points and climb the leaderboard?
                  </h4>
                  <p className="text-xs text-slate-300">
                    Report active hazards (+10 pts), verify reports (+5 pts), or provide corridor warnings (+5 pts).
                  </p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  {onOpenReportModal && (
                    <button
                      onClick={onOpenReportModal}
                      className="px-4 py-2 bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition hover:brightness-110 shadow-lg cursor-pointer"
                    >
                      🚨 Submit Road Report
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BADGES CATALOG VIEW */}
          {/* ======================================================== */}
          {activeMainTab === 'badges' && (
            <div className="space-y-5">
              {/* Category Filter for Badges with scroll arrows for mobile */}
              <div className="flex items-center gap-1.5 w-full">
                <button
                  onClick={() => scrollBadgeTabs('left')}
                  className="sm:hidden p-1.5 rounded-lg bg-[#0E1726] border border-slate-700 text-amber-400 hover:text-white transition shrink-0 active:scale-95 shadow cursor-pointer"
                  title="Scroll badges left"
                  aria-label="Scroll badges left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <div
                  ref={badgeTabsRef}
                  className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0"
                >
                  <button
                    onClick={() => setSelectedBadgeCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedBadgeCategory === 'all'
                        ? 'bg-[#D4A237] text-slate-950 font-black'
                        : 'bg-[#0E1726] text-slate-300 border border-slate-700'
                    }`}
                  >
                    All Badges ({COMMUNITY_HERO_BADGES.length})
                  </button>
                  <button
                    onClick={() => setSelectedBadgeCategory('reporter')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedBadgeCategory === 'reporter'
                        ? 'bg-blue-600 text-white font-black'
                        : 'bg-[#0E1726] text-slate-300 border border-slate-700'
                    }`}
                  >
                    🚨 Incident Reporter Badges (6)
                  </button>
                  <button
                    onClick={() => setSelectedBadgeCategory('verifier')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedBadgeCategory === 'verifier'
                        ? 'bg-teal-600 text-white font-black'
                        : 'bg-[#0E1726] text-slate-300 border border-slate-700'
                    }`}
                  >
                    ✅ Incident Verifier Badges (6)
                  </button>
                  <button
                    onClick={() => setSelectedBadgeCategory('warning')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedBadgeCategory === 'warning'
                        ? 'bg-amber-600 text-white font-black'
                        : 'bg-[#0E1726] text-slate-300 border border-slate-700'
                    }`}
                  >
                    ⚠️ Community Warning Badges (6)
                  </button>
                  <button
                    onClick={() => setSelectedBadgeCategory('special')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                      selectedBadgeCategory === 'special'
                        ? 'bg-purple-600 text-white font-black'
                        : 'bg-[#0E1726] text-slate-300 border border-slate-700'
                    }`}
                  >
                    ⭐ Special Achievements (9)
                  </button>
                </div>

                <button
                  onClick={() => scrollBadgeTabs('right')}
                  className="sm:hidden p-1.5 rounded-lg bg-[#0E1726] border border-slate-700 text-amber-400 hover:text-white transition shrink-0 active:scale-95 shadow cursor-pointer"
                  title="Scroll badges right"
                  aria-label="Scroll badges right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {COMMUNITY_HERO_BADGES.filter(b => selectedBadgeCategory === 'all' || b.category === selectedBadgeCategory).map((badge) => {
                  const progress = calculateBadgeProgress(badge, userProfile);
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-3xl p-4 border transition relative overflow-hidden flex flex-col justify-between ${
                        progress.isUnlocked
                          ? 'bg-[#10192B] border-[#D4A237]/80 shadow-lg shadow-amber-950/40'
                          : 'bg-[#0A101D] border-slate-800 opacity-80'
                      }`}
                    >
                      <div>
                        {/* Top: Icon + Title + Status */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                              progress.isUnlocked
                                ? 'bg-[#1A263D] border-[#D4A237] text-amber-300 shadow-md'
                                : 'bg-slate-900 border-slate-800 grayscale opacity-70'
                            }`}>
                              {badge.icon}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="text-sm font-black text-white">{badge.title}</h4>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                  progress.isUnlocked
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {badge.badgeLevel}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D4A237] font-semibold mt-0.5">
                                {badge.criteria}
                              </p>
                            </div>
                          </div>

                          {progress.isUnlocked ? (
                            <span className="text-emerald-400 text-xs shrink-0" title="Unlocked">
                              <CheckCircle2 className="w-5 h-5 fill-emerald-950" />
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs shrink-0" title="Locked">
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {badge.description}
                        </p>
                      </div>

                      {/* Bottom Progress Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>Progress</span>
                          <span className="font-mono">
                            {progress.isUnlocked ? 'Unlocked ✅' : `${progress.currentValue} / ${progress.targetValue} (${progress.percentage}%)`}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              progress.isUnlocked
                                ? 'bg-gradient-to-r from-[#D4A237] to-amber-300'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: HOW IT WORKS & POINT MATRIX VIEW */}
          {/* ======================================================== */}
          {activeMainTab === 'how_it_works' && (
            <div className="space-y-6">
              {/* Introduction Banner */}
              <div className="bg-gradient-to-r from-[#121E36] via-[#0A1120] to-[#121E36] border-2 border-[#D4A237]/60 rounded-3xl p-5 text-slate-200 shadow-xl space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#D4A237] text-slate-950 flex items-center justify-center font-black text-xl">
                    🚦
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                      LIVE TRAFFIC COMMUNITY HEROES PROGRAMME
                    </h3>
                    <p className="text-xs text-[#D4A237] font-bold">
                      Report. Verify. Warn. Protect.
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Every registered Live Traffic app member earns points, badges and public recognition for making the South African road network safer. Points are awarded for useful, verified contributions that meet Live Traffic's high reporting standards.
                </p>
              </div>

              {/* The 3 Main Contribution Categories */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Incident Reporter */}
                <div className="bg-[#0D1524] border-2 border-blue-500/50 rounded-3xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <span className="text-2xl">🚨</span>
                    <h4 className="text-sm font-black uppercase text-white">1. INCIDENT REPORTER</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    For members who report crashes, crime incidents, hazard spots, and verified road blockages.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-2.5">
                    <div className="font-bold text-slate-200">Badges:</div>
                    <div>🟢 Road Watcher (1 approved)</div>
                    <div>🔵 Road Reporter (10 approved)</div>
                    <div>🟣 Traffic Scout (25 approved)</div>
                    <div>🟠 Traffic Guardian (50 approved)</div>
                    <div>🟡 Traffic Hero (100 approved)</div>
                    <div>⭐ Traffic Legend (250+ approved)</div>
                  </div>
                </div>

                {/* 2. Incident Verifier */}
                <div className="bg-[#0D1524] border-2 border-teal-500/50 rounded-3xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-teal-400">
                    <span className="text-2xl">✅</span>
                    <h4 className="text-sm font-black uppercase text-white">2. INCIDENT VERIFIER</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    For members who help confirm active incidents, check GPS locations, verify cleared lanes, and update conditions.
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-2.5">
                    <div className="font-bold text-slate-200">Badges:</div>
                    <div>🔍 Fact Finder (1 verified)</div>
                    <div>🛡️ Incident Verifier (10 verified)</div>
                    <div>🔎 Road Investigator (25 verified)</div>
                    <div>🛡️ Traffic Sentinel (50 verified)</div>
                    <div>🏆 Community Guardian (100 verified)</div>
                    <div>👑 Verification Master (250+ verified)</div>
                  </div>
                </div>

                {/* 3. Community Warning */}
                <div className="bg-[#0D1524] border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-400">
                    <span className="text-2xl">⚠️</span>
                    <h4 className="text-sm font-black uppercase text-white">3. COMMUNITY WARNING</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    For useful warnings (debris, potholes, flooding, smoke/fire, animals, rocks, congestion, road closures, weather).
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800 pt-2.5">
                    <div className="font-bold text-slate-200">Badges:</div>
                    <div>👀 Road Watch (1 warning)</div>
                    <div>⚠️ Early Warning (5 warnings)</div>
                    <div>🚧 Hazard Hunter (15 warnings)</div>
                    <div>📢 Community Alert (30 warnings)</div>
                    <div>🛡️ Road Protector (50 warnings)</div>
                    <div>🏆 Safety Champion (100 warnings)</div>
                  </div>
                </div>
              </div>

              {/* Point System Matrix Table */}
              <div className="bg-[#0A101D] border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                    Community Heroes Point System Matrix
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {POINT_SYSTEM_RULES.map((rule, idx) => (
                    <div
                      key={idx}
                      className="bg-[#121B2C] border border-slate-800 rounded-2xl p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="text-xl shrink-0">{rule.icon}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{rule.action}</div>
                          <div className="text-[10px] text-slate-400 truncate">{rule.note}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-black font-mono px-2 py-0.5 rounded shrink-0 ml-2 ${
                        rule.points > 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : rule.points < 0
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {rule.points > 0 ? `+${rule.points}` : rule.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anti-Spam and Quality Standards */}
              <div className="bg-[#121826] border border-red-500/30 rounded-3xl p-5 space-y-2.5">
                <div className="flex items-center space-x-2 text-red-400 font-black text-xs uppercase tracking-wider">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Anti-Spam & Data Quality Safeguards</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Points are only awarded when reports meet Live Traffic's community verification standards. Duplicate, automated or misleading submissions earn zero points, and deliberately false reports receive a -20 penalty. Contributors with consistently high accuracy gain increased trust weighting.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-[#050912] border-t border-slate-800 px-4 py-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline font-mono">Live Traffic NPC • Verified Community Protection</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
