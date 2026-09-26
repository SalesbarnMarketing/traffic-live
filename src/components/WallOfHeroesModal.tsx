import React, { useState } from 'react';
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
  Search
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Maximum Height Modal Container with 96vh to maximize hero list visibility */}
      <div className="bg-[#070A10] border-2 border-[#D4A237] rounded-3xl w-full max-w-4xl h-[96vh] sm:h-[90vh] flex flex-col shadow-[0_0_80px_rgba(212,162,55,0.3)] overflow-hidden text-slate-200">
        
        {/* Sleek Compact Header (Takes only ~48px) */}
        <div className="bg-gradient-to-r from-[#121E33] via-[#070A10] to-[#121E33] px-3.5 py-2.5 sm:px-5 sm:py-2.5 border-b border-[#D4A237]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-[#D4A237] via-amber-400 to-yellow-200 text-[#070A10] flex items-center justify-center font-black shadow shrink-0">
              <Award className="w-4 h-4 text-[#070A10] stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-xs sm:text-base font-black text-white uppercase tracking-wider truncate">
                  Community Wall of Heroes
                </h2>
                <span className="bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/60 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {totalHeroesCount} HEROES
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={handleShareWall}
              className="px-2 py-1 rounded-lg bg-[#0C1626] hover:bg-[#122238] border border-[#D4A237]/40 text-[#D4A237] hover:text-white text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer shadow"
              title="Share Wall of Heroes"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-[#0C1626] hover:bg-[#122238] border border-[#D4A237]/40 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4 text-[#D4A237]" />
            </button>
          </div>
        </div>

        {/* Ultra-Slim Live Stat Strip (Single tight 26px line - replaces bulky multi-box grids) */}
        <div className="bg-[#0C1626]/90 border-b border-slate-800 px-3 py-1 sm:px-5 flex items-center justify-between overflow-x-auto scrollbar-none gap-2 shrink-0 text-[10px] sm:text-[11px]">
          <div className="flex items-center space-x-2 text-slate-300 whitespace-nowrap">
            <span className="flex items-center space-x-1 text-amber-400 font-bold">
              <Coffee className="w-3 h-3 text-amber-400" />
              <span>{totalCoffeeCount} Coffees</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1 text-amber-300 font-bold">
              <Wrench className="w-3 h-3 text-amber-300" />
              <span>{totalPotholesCount} Potholes ({fixedPotholesCount} Fixed)</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1 text-sky-400 font-bold">
              <Fuel className="w-3 h-3 text-sky-400" />
              <span>{totalFuelLiters}L Patrol Fuel</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-1 text-[10px] text-amber-300/80 shrink-0 font-medium">
            <Sparkles className="w-3 h-3 text-[#D4A237]" />
            <span>Direct Community Impact</span>
          </div>
        </div>

        {/* Filter & Search Toolbar (Single compact 36px bar) */}
        <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#090E17] border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1.5 shrink-0">
          {/* Filter Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap border ${
                activeFilter === 'all'
                  ? 'bg-[#FAF4EA] text-[#070A10] border-[#D4A237] shadow'
                  : 'bg-[#0C1626] text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              🌟 All ({donations.length})
            </button>

            <button
              onClick={() => setActiveFilter('coffee')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap border flex items-center space-x-1 ${
                activeFilter === 'coffee'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow'
                  : 'bg-[#0C1626] text-amber-400/90 border-slate-800 hover:text-white'
              }`}
            >
              <Coffee className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Coffees ({totalCoffeeCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('pothole_repair')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap border flex items-center space-x-1 ${
                activeFilter === 'pothole_repair'
                  ? 'bg-amber-400 text-slate-950 border-amber-200 shadow'
                  : 'bg-[#0C1626] text-amber-300/90 border-slate-800 hover:text-white'
              }`}
            >
              <Wrench className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Potholes ({donations.filter(d => d.category === 'pothole_repair').length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('fuel')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap border flex items-center space-x-1 ${
                activeFilter === 'fuel'
                  ? 'bg-sky-500 text-slate-950 border-sky-300 shadow'
                  : 'bg-[#0C1626] text-sky-400/90 border-slate-800 hover:text-white'
              }`}
            >
              <Fuel className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Fuel ({donations.filter(d => d.category === 'fuel').length})</span>
            </button>

            <button
              onClick={() => setActiveFilter('fixed')}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition cursor-pointer whitespace-nowrap border flex items-center space-x-1 ${
                activeFilter === 'fixed'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow'
                  : 'bg-[#0C1626] text-emerald-400/90 border-slate-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>Fixed ({fixedPotholesCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-52">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search hero or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070A10] border border-slate-800 focus:border-[#D4A237] rounded-lg pl-7 pr-3 py-1 text-[11px] sm:text-xs text-white placeholder-slate-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* EXPANDED HEROES SCROLL CONTAINER (Takes ~85% of total modal height) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-4 space-y-2.5 bg-gradient-to-b from-[#070A10] to-[#0A0F1A]">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Award className="w-12 h-12 text-[#D4A237]/40 mx-auto" />
              <div className="text-sm font-bold text-slate-300">No heroes found matching "{searchQuery}"</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first hero to sponsor a coffee, fuel a patrol, or fix a pothole in this category!
              </p>
              {onOpenDonate && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDonate(activeFilter !== 'all' ? activeFilter : 'coffee');
                  }}
                  className="bg-[#FAF4EA] hover:bg-white text-[#070A10] font-black text-xs px-5 py-2 rounded-xl uppercase tracking-wider border border-[#D4A237] cursor-pointer shadow"
                >
                  Join Wall of Heroes
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredDonations.map((don, idx) => {
                const isPothole = don.category === 'pothole_repair';
                const isCoffee = don.category === 'coffee';
                const isFuel = don.category === 'fuel';
                const isDriving = don.category === 'advance_driving';
                const isEquip = don.category === 'equipment';

                return (
                  <div
                    key={don.id || idx}
                    className={`bg-[#0C1626]/95 border rounded-2xl p-3 flex flex-col justify-between space-y-2 transition hover:border-[#D4A237] group shadow relative overflow-hidden ${
                      isPothole && don.isFixed
                        ? 'border-emerald-500/50 hover:border-emerald-400'
                        : isPothole
                        ? 'border-amber-500/40'
                        : isCoffee
                        ? 'border-amber-500/30'
                        : isFuel
                        ? 'border-sky-500/30'
                        : 'border-[#D4A237]/30'
                    }`}
                  >
                    {/* Top Row: Donor Name + Category Badge + Amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex items-center space-x-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 ${
                            isCoffee
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : isFuel
                              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                              : isPothole
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                              : isEquip
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                              : 'bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/40'
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

                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-black text-xs sm:text-sm text-white truncate">
                              {don.isAnonymous ? 'Anonymous Motorist' : don.donorName || 'Kind Supporter'}
                            </span>
                            {idx < 3 && activeFilter === 'all' && (
                              <span className="bg-gradient-to-r from-amber-400 to-yellow-200 text-slate-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full uppercase shrink-0">
                                TOP HERO
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-400">
                            {isCoffee && <span className="text-amber-400 font-bold">☕ Coffee Sponsor</span>}
                            {isFuel && <span className="text-sky-400 font-bold">⛽ Patrol Fuel Sponsor</span>}
                            {isPothole && (
                              <span className="text-amber-300 font-bold">
                                🔨 {don.potholesCount || 1} Pothole Patch
                              </span>
                            )}
                            {isEquip && <span className="text-indigo-400 font-bold">🔦 Equipment Sponsor</span>}
                            {isDriving && <span className="text-purple-400 font-bold">🎓 Advance Driving</span>}
                            <span>•</span>
                            <span>{new Date(don.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contribution Amount */}
                      <div className="bg-[#070A10] border border-slate-800 px-2 py-0.5 rounded-lg text-right shrink-0">
                        <div className="text-xs sm:text-sm font-black text-[#D4A237]">
                          R{don.amount.toLocaleString()}
                        </div>
                        <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">
                          {isCoffee ? 'Meal & Coffee' : isFuel ? 'Fleet Fuel' : isPothole ? 'Road Fix' : 'Donation'}
                        </div>
                      </div>
                    </div>

                    {/* Donor Note / Quote */}
                    {don.message && (
                      <div className="bg-[#070A10]/80 border border-slate-800 rounded-xl p-2 text-[11px] sm:text-xs text-slate-200 italic leading-relaxed">
                        "{don.message}"
                      </div>
                    )}

                    {/* Pothole Specific Details (Location, Before & After Images, Fixed Badge) */}
                    {isPothole && (
                      <div className="bg-[#070A10] border border-amber-500/20 p-2.5 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          {don.potholeLocation ? (
                            <div className="flex items-center space-x-1.5 text-amber-300 font-medium truncate text-[11px]">
                              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">{don.potholeLocation}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[10px]">Monitored Gauteng Corridor</span>
                          )}

                          {don.isFixed ? (
                            <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center space-x-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>FIXED BY CREW</span>
                            </span>
                          ) : (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              PATCH SCHEDULED
                            </span>
                          )}
                        </div>

                        {/* Photos Before / After */}
                        {don.fixedImageUrl ? (
                          <div className="space-y-1 pt-1">
                            <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified Repair Proof (Before vs After)</span>
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {don.potholeImageUrl && (
                                <div className="cursor-pointer" onClick={() => setSelectedProofUrl(don.potholeImageUrl || null)}>
                                  <span className="text-[8px] font-bold text-amber-400 uppercase block text-center bg-amber-950/80 px-1 py-0.5 rounded-t border border-amber-500/30">
                                    BEFORE
                                  </span>
                                  <img
                                    src={don.potholeImageUrl}
                                    alt="Before Repair"
                                    className="w-full h-20 object-cover rounded-b border border-slate-800"
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
                                  className="w-full h-20 object-cover rounded-b border-2 border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        ) : don.potholeImageUrl ? (
                          <div className="pt-1">
                            <img
                              src={don.potholeImageUrl}
                              alt="Sponsored Pothole"
                              className="w-full h-20 object-cover rounded-lg border border-slate-800 cursor-pointer"
                              onClick={() => setSelectedProofUrl(don.potholeImageUrl || null)}
                            />
                          </div>
                        ) : null}

                        {don.adminFeedback && (
                          <p className="text-[10px] text-emerald-300 bg-emerald-950/50 p-1.5 rounded border border-emerald-500/30 italic font-medium">
                            💬 Admin Dispatch: "{don.adminFeedback}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Metadata & POP Button */}
                    <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center space-x-2">
                        {don.referenceNumber && (
                          <span className="font-mono text-slate-400 font-bold bg-[#070A10] px-1.5 py-0.5 rounded border border-slate-800">
                            REF: {don.referenceNumber}
                          </span>
                        )}
                      </div>

                      {don.proofOfPaymentUrl && (
                        <button
                          onClick={() => setSelectedProofUrl(don.proofOfPaymentUrl || null)}
                          className="text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Proof</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Compact Modal Footer (Single clean 44px bar) */}
        <div className="bg-[#0C1626] border-t border-[#D4A237]/30 px-3 py-2 sm:px-5 sm:py-2.5 flex flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
            Every R100 coffee, R350 pothole patch, or fuel tank directly protects Gauteng motorists.
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end shrink-0">
            {onOpenDonate && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDonate('coffee');
                }}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-tr from-[#D4A237] to-amber-200 hover:brightness-110 text-[#070A10] font-black text-xs uppercase tracking-wider transition cursor-pointer shadow active:scale-95 flex items-center justify-center space-x-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-[#070A10]" />
                <span>Join Wall of Heroes</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#070A10] hover:bg-[#121E33] text-slate-300 border border-slate-800 font-bold text-xs uppercase transition cursor-pointer"
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
          <div className="relative max-w-2xl max-h-[85vh] bg-[#070A10] border-2 border-[#D4A237] rounded-2xl overflow-hidden p-2">
            <img src={selectedProofUrl} alt="Hero Proof" className="max-h-[75vh] w-auto mx-auto object-contain rounded-lg" />
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white p-2 rounded-full border border-[#D4A237]"
            >
              <X className="w-5 h-5 text-[#D4A237]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
