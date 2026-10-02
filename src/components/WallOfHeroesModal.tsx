import React, { useState, useRef } from 'react';
import {
  Award,
  Coffee,
  Fuel,
  Wrench,
  Heart,
  CheckCircle2,
  X,
  MapPin,
  Sparkles,
  Eye,
  Share2,
  Search,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Donation, DonationStats } from '../types';

interface WallOfHeroesModalProps {
  isOpen: boolean;
  onClose: () => void;
  donations: Donation[];
  stats?: DonationStats;
  onOpenDonate?: (category?: string) => void;
}

export const WallOfHeroesModal: React.FC<WallOfHeroesModalProps> = ({
  isOpen,
  onClose,
  donations = [],
  onOpenDonate
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'coffee' | 'pothole_repair' | 'fuel' | 'fixed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  const statsScrollRef = useRef<HTMLDivElement>(null);
  const filtersScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  // Filter donations
  const filteredDonations = donations.filter((don) => {
    if (activeFilter === 'coffee' && don.category !== 'coffee') return false;
    if (activeFilter === 'fuel' && don.category !== 'fuel') return false;
    if (activeFilter === 'pothole_repair' && don.category !== 'pothole_repair') return false;
    if (activeFilter === 'fixed' && (don.category !== 'pothole_repair' || !don.isFixed)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (don.donorName || 'Anonymous').toLowerCase().includes(q);
      const msgMatch = (don.message || '').toLowerCase().includes(q);
      const locMatch = (don.potholeLocation || '').toLowerCase().includes(q);
      const refMatch = (don.referenceNumber || '').toLowerCase().includes(q);
      if (!nameMatch && !msgMatch && !locMatch && !refMatch) return false;
    }

    return true;
  });

  // Calculate quick stats
  const totalCoffeeCount = donations.filter((d) => d.category === 'coffee').length;
  const totalPotholesCount = donations
    .filter((d) => d.category === 'pothole_repair')
    .reduce((acc, d) => acc + (d.potholesCount || Math.max(1, Math.floor(d.amount / 350))), 0);
  const fixedPotholesCount = donations.filter((d) => d.category === 'pothole_repair' && d.isFixed).length;
  const totalFuelLiters = donations
    .filter((d) => d.category === 'fuel')
    .reduce((acc, d) => acc + Math.round(d.amount / 24), 0);
  const totalHeroesCount = donations.length;

  const handleShareWall = () => {
    const text = `🌟 Salute to the Live Traffic NPC Wall of Heroes! Our community has funded patrol fuel, fixed dangerous potholes, and supported night volunteers. View the hero roll:`;
    if (navigator.share) {
      navigator.share({
        title: 'Live Traffic NPC - Wall of Heroes',
        text: text,
        url: window.location.href
      }).catch(() => {});
    } else {
      const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
      window.open(shareUrl, '_blank');
    }
  };

  const formatDateShort = (timestamp: string | number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container: responsive max-height with safe viewport breathing room */}
      <div className="bg-[#070A10] border border-amber-500/40 sm:border-2 sm:border-[#D4A237] rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[92dvh] sm:h-[88vh] flex flex-col shadow-[0_0_60px_rgba(212,162,55,0.25)] overflow-hidden text-slate-200">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#111A2E] via-[#0A0E18] to-[#111A2E] px-3.5 py-3 sm:px-5 sm:py-3.5 border-b border-amber-500/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Award className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black text-white tracking-wide">
                  Wall of Heroes
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {totalHeroesCount} {totalHeroesCount === 1 ? 'Hero' : 'Heroes'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                Community supporters funding patrol fuel, pothole repairs & road monitors
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleShareWall}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
              title="Share Wall of Heroes"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Stat Strip: clean horizontal scroll on mobile with high contrast icons and scroll arrows */}
        <div className="bg-[#0A0E18] border-b border-slate-800/80 px-2 py-1.5 sm:px-4 flex items-center justify-between gap-1.5 shrink-0 text-xs relative group">
          {/* Mobile Left Arrow */}
          <button
            type="button"
            onClick={() => scrollContainer(statsScrollRef, 'left')}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 transition shrink-0 active:scale-95 shadow-sm"
            aria-label="Scroll stats left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={statsScrollRef}
            className="flex-1 flex items-center space-x-2.5 overflow-x-auto scrollbar-none py-0.5 px-1 scroll-smooth"
          >
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/20 text-amber-400 font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0">
              <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{totalCoffeeCount} Coffees</span>
            </span>

            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-yellow-950/40 border border-yellow-500/20 text-yellow-300 font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0">
              <Wrench className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>{totalPotholesCount} Potholes ({fixedPotholesCount} Fixed)</span>
            </span>

            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-950/40 border border-sky-500/20 text-sky-400 font-bold text-[11px] sm:text-xs whitespace-nowrap shrink-0">
              <Fuel className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{totalFuelLiters}L Patrol Fuel</span>
            </span>
          </div>

          {/* Mobile Right Arrow */}
          <button
            type="button"
            onClick={() => scrollContainer(statsScrollRef, 'right')}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 transition shrink-0 active:scale-95 shadow-sm"
            aria-label="Scroll stats right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="hidden lg:flex items-center space-x-1 text-[11px] text-amber-300/80 shrink-0 font-medium pl-2 border-l border-slate-800">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Direct Impact</span>
          </div>
        </div>

        {/* Filter Toolbar + Search Input */}
        <div className="px-2.5 py-2 sm:px-4 sm:py-2.5 bg-[#080B12] border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Filter Pills with touch-friendly horizontal scroll and Left/Right Arrows */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto min-w-0">
            {/* Filter Left Arrow */}
            <button
              type="button"
              onClick={() => scrollContainer(filtersScrollRef, 'left')}
              className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 transition shrink-0 active:scale-95 shadow-sm"
              aria-label="Scroll filters left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={filtersScrollRef}
              className="flex-1 flex items-center space-x-1.5 overflow-x-auto scrollbar-none pb-0.5 sm:pb-0 px-0.5 scroll-smooth"
            >
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'all'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>🌟 All</span>
                <span className="text-[10px] opacity-80">({donations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('coffee')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'coffee'
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Coffee className="w-3 h-3 text-amber-400" />
                <span>Coffees</span>
                <span className="text-[10px] opacity-80">({totalCoffeeCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('pothole_repair')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'pothole_repair'
                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Wrench className="w-3 h-3 text-yellow-400" />
                <span>Potholes</span>
                <span className="text-[10px] opacity-80">({donations.filter(d => d.category === 'pothole_repair').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('fuel')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'fuel'
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Fuel className="w-3 h-3 text-sky-400" />
                <span>Fuel</span>
                <span className="text-[10px] opacity-80">({donations.filter(d => d.category === 'fuel').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('fixed')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap border shrink-0 flex items-center space-x-1 ${
                  activeFilter === 'fixed'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Fixed</span>
                <span className="text-[10px] opacity-80">({fixedPotholesCount})</span>
              </button>
            </div>

            {/* Filter Right Arrow */}
            <button
              type="button"
              onClick={() => scrollContainer(filtersScrollRef, 'right')}
              className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-amber-400 hover:text-white hover:bg-slate-800 transition shrink-0 active:scale-95 shadow-sm"
              aria-label="Scroll filters right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hero or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0E1320] border border-slate-800 focus:border-amber-500/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-0.5"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* HEROES LIST SCROLL CONTAINER */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 bg-gradient-to-b from-[#070A10] to-[#0B0F1B]">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Award className="w-12 h-12 text-amber-500/40 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No heroes found matching "{searchQuery}"</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first hero to sponsor a coffee, fuel a patrol, or fix a pothole in this category!
              </p>
              {onOpenDonate && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDonate(activeFilter !== 'all' ? activeFilter : 'coffee');
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-lg transition cursor-pointer"
                >
                  Join Wall of Heroes
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredDonations.map((don, idx) => {
                const isPothole = don.category === 'pothole_repair';
                const isCoffee = don.category === 'coffee';
                const isFuel = don.category === 'fuel';
                const isDriving = don.category === 'advance_driving';
                const isEquip = don.category === 'equipment';

                return (
                  <div
                    key={don.id || idx}
                    className={`bg-[#0E1424]/95 border rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between space-y-3 transition hover:border-amber-500/70 shadow-md ${
                      isPothole && don.isFixed
                        ? 'border-emerald-500/50 hover:border-emerald-400'
                        : isPothole
                        ? 'border-yellow-500/40'
                        : isCoffee
                        ? 'border-amber-500/30'
                        : isFuel
                        ? 'border-sky-500/30'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Top Row: Donor info + Amount */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex items-start space-x-2.5">
                        {/* Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCoffee
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : isFuel
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                              : isPothole
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                              : isEquip
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isCoffee ? (
                            <Coffee className="w-4 h-4" />
                          ) : isFuel ? (
                            <Fuel className="w-4 h-4" />
                          ) : isPothole ? (
                            <Wrench className="w-4 h-4" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </div>

                        {/* Name & Details */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="font-black text-xs sm:text-sm text-white truncate max-w-[160px] sm:max-w-none">
                              {don.isAnonymous ? 'Anonymous Motorist' : don.donorName || 'Kind Supporter'}
                            </span>
                            {idx < 3 && activeFilter === 'all' && (
                              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 shadow-xs">
                                TOP HERO
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            {isCoffee && <span className="text-amber-400 font-bold">☕ Coffee Sponsor</span>}
                            {isFuel && <span className="text-sky-400 font-bold">⛽ Patrol Fuel</span>}
                            {isPothole && (
                              <span className="text-yellow-300 font-bold">
                                🔨 {don.potholesCount || 1} Pothole Patch
                              </span>
                            )}
                            {isEquip && <span className="text-indigo-400 font-bold">🔦 Equipment</span>}
                            {isDriving && <span className="text-purple-400 font-bold">🎓 Advance Driving</span>}
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-400">{formatDateShort(don.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contribution Amount Badge */}
                      <div className="bg-[#070A10] border border-amber-500/30 px-2.5 py-1 rounded-xl text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-amber-400 font-mono">
                          R{don.amount.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                          {isCoffee ? 'Meal & Coffee' : isFuel ? 'Fleet Fuel' : isPothole ? 'Road Fix' : 'Donation'}
                        </div>
                      </div>
                    </div>

                    {/* Donor Note / Quote */}
                    {don.message && (
                      <div className="bg-[#080C16] border border-slate-800/90 rounded-xl p-2.5 text-xs text-slate-200 italic leading-relaxed">
                        "{don.message}"
                      </div>
                    )}

                    {/* Pothole Specific Details (Location, Before & After Images, Fixed Badge) */}
                    {isPothole && (
                      <div className="bg-[#080C16] border border-amber-500/20 p-2.5 rounded-xl space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                          {don.potholeLocation ? (
                            <div className="flex items-center space-x-1.5 text-amber-300 font-medium text-xs min-w-0">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{don.potholeLocation}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Monitored Gauteng Corridor</span>
                          )}

                          {don.isFixed ? (
                            <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center space-x-1 shrink-0 shadow-sm">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>FIXED BY CREW</span>
                            </span>
                          ) : (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                              PATCH SCHEDULED
                            </span>
                          )}
                        </div>

                        {/* Photos Before / After */}
                        {don.fixedImageUrl ? (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified Repair Proof</span>
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {don.potholeImageUrl && (
                                <div className="cursor-pointer" onClick={() => setSelectedProofUrl(don.potholeImageUrl || null)}>
                                  <span className="text-[8px] font-bold text-amber-400 uppercase block text-center bg-amber-950/80 px-1 py-0.5 rounded-t border border-amber-500/30">
                                    BEFORE
                                  </span>
                                  <img
                                    src={don.potholeImageUrl}
                                    alt="Before Repair"
                                    className="w-full h-24 object-cover rounded-b border border-slate-800"
                                  />
                                </div>
                              )}
                              <div className="cursor-pointer" onClick={() => setSelectedProofUrl(don.fixedImageUrl || null)}>
                                <span className="text-[8px] font-bold text-emerald-400 uppercase block text-center bg-emerald-950/80 px-1 py-0.5 rounded-t border border-emerald-500/30">
                                  AFTER (FIXED)
                                </span>
                                <img
                                  src={don.fixedImageUrl}
                                  alt="After Repair"
                                  className="w-full h-24 object-cover rounded-b border-2 border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        ) : don.potholeImageUrl ? (
                          <div className="pt-1">
                            <img
                              src={don.potholeImageUrl}
                              alt="Sponsored Pothole"
                              className="w-full h-24 object-cover rounded-xl border border-slate-800 cursor-pointer hover:border-amber-500 transition"
                              onClick={() => setSelectedProofUrl(don.potholeImageUrl || null)}
                            />
                          </div>
                        ) : null}

                        {don.adminFeedback && (
                          <p className="text-[11px] text-emerald-300 bg-emerald-950/50 p-2 rounded-lg border border-emerald-500/30 italic font-medium">
                            💬 Admin Dispatch: "{don.adminFeedback}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Metadata & POP Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <div>
                        {don.referenceNumber && (
                          <span className="font-mono text-slate-400 font-bold bg-[#070A10] px-2 py-0.5 rounded-md border border-slate-800 text-[10px]">
                            REF: {don.referenceNumber}
                          </span>
                        )}
                      </div>

                      {don.proofOfPaymentUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(don.proofOfPaymentUrl || null)}
                          className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 transition cursor-pointer text-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View POP Proof</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="bg-[#0A0E18] border-t border-amber-500/30 px-3.5 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs text-slate-400 truncate hidden md:block">
            Every coffee, pothole patch, or fuel contribution directly protects South African motorists.
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            {onOpenDonate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDonate('coffee');
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-lg active:scale-95 flex items-center justify-center space-x-2"
              >
                <Heart className="w-4 h-4 fill-slate-950" />
                <span>Join Wall of Heroes</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer shrink-0"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Overlay */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-[#070A10] border-2 border-amber-400 rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={selectedProofUrl} alt="Hero Proof" className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg" />
            <button
              type="button"
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white p-2 rounded-full border border-amber-400"
            >
              <X className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
