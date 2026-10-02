import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../utils/apiClient';
import { 
  Clock, 
  Gauge, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowUpDown, 
  Copy, 
  Check, 
  Share2, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Compass, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  X,
  Radio,
  ArrowLeft
} from 'lucide-react';
import { TravelTimeRoute } from '../types';
import { ITRAFFIC_TRAVELTIMES_PAGE_URL } from '../utils/browserITrafficScraper';
import { ShareAppFeedCard } from './ShareAppFeedCard';

interface HighwayTravelTimesSectionProps {
  initialRegion?: string;
  onNavigateToFeed?: () => void;
  className?: string;
}

export const HighwayTravelTimesSection: React.FC<HighwayTravelTimesSectionProps> = ({
  initialRegion = 'Gauteng',
  onNavigateToFeed,
  className = ''
}) => {
  const [routes, setRoutes] = useState<TravelTimeRoute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion);
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');
  const [selectedSpeedFilter, setSelectedSpeedFilter] = useState<'all' | 'free_flow' | 'moderate' | 'delays'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'default' | 'fastest' | 'slowest' | 'highest_delay' | 'distance'>('default');
  const [copiedRouteId, setCopiedRouteId] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRoutes: number;
    gautengCount: number;
    kznCount: number;
    wcCount: number;
    avgSpeed: number;
    congestedCount: number;
  }>({
    totalRoutes: 0,
    gautengCount: 0,
    kznCount: 0,
    wcCount: 0,
    avgSpeed: 0,
    congestedCount: 0
  });

  const fetchTravelTimes = async (force = false) => {
    if (force) setIsSyncing(true);
    else setIsLoading(true);

    try {
      const url = force ? '/api/itraffic/traveltimes?force=true' : '/api/itraffic/traveltimes';
      const data = await apiFetch<any>(url, {
        cacheTtlMs: force ? 0 : 45000,
        background: !force
      });
      if (data) {
        if (Array.isArray(data.routes)) {
          setRoutes(data.routes);
        }
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.lastFetched) {
          setLastFetched(data.lastFetched);
        }
        if (force) {
          setSyncNotice(`Refreshed ${data.count || data.routes.length} live corridor travel times!`);
          setTimeout(() => setSyncNotice(null), 4000);
        }
      }
    } catch (err) {
      // Gentle debug fallback
      console.debug('Highway travel times request deferred:', err);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchTravelTimes();
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchTravelTimes();
    }, 120000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyRouteInfo = (route: TravelTimeRoute) => {
    const text = `🚗 [Highway Travel Time]\n🏛️ Province: ${route.region || 'Gauteng'}\n🛣️ Corridor: ${route.roadwayName} (${route.direction})\n📍 Segment: ${route.description}\n⏱️ Time: ${route.currentTime} min (${route.distance} km)\n⚡ Avg Speed: ${route.currentSpeed} km/h ${route.delayMinutes ? `(+${route.delayMinutes}m delay)` : '(Free flow)'}`;
    
    try {
      navigator.clipboard.writeText(text);
      setCopiedRouteId(route.id);
      setTimeout(() => setCopiedRouteId(null), 2500);
    } catch {
      // fallback
    }
  };

  // Known corridors for chips
  const CORRIDOR_CHIPS = [
    { id: 'all', label: 'All Corridors' },
    { id: 'N1', label: 'N1 Freeway' },
    { id: 'N2', label: 'N2 Coastal Freeway' },
    { id: 'N3', label: 'N3 Eastern Bypass' },
    { id: 'N4', label: 'N4 Platinum / East' },
    { id: 'N7', label: 'N7 Cape / West Coast' },
    { id: 'N12', label: 'N12 Southern Bypass' },
    { id: 'N14', label: 'N14 Freeway' },
    { id: 'M1', label: 'M1 De Villiers Graaff' },
    { id: 'M2', label: 'M2 Francois Oberholzer' },
    { id: 'R21', label: 'R21 Airport Freeway' },
    { id: 'R24', label: 'R24 Albertina Sisulu' },
    { id: 'R59', label: 'R59 Sybrand van Niekerk' }
  ];

  // Filtering
  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      // Region filter
      if (selectedRegion !== 'all' && !r.region?.toLowerCase().includes(selectedRegion.toLowerCase())) {
        return false;
      }

      // Corridor filter
      if (selectedCorridor !== 'all') {
        const road = (r.roadwayName || '').toLowerCase();
        if (!road.includes(selectedCorridor.toLowerCase())) {
          return false;
        }
      }

      // Speed / Congestion filter
      if (selectedSpeedFilter === 'free_flow' && r.congestionLevel !== 'free_flow') return false;
      if (selectedSpeedFilter === 'moderate' && r.congestionLevel !== 'moderate') return false;
      if (selectedSpeedFilter === 'delays' && (r.congestionLevel !== 'congested' && r.congestionLevel !== 'heavy_delay')) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inName = (r.roadwayName || '').toLowerCase().includes(q);
        const inDesc = (r.description || '').toLowerCase().includes(q);
        const inDir = (r.direction || '').toLowerCase().includes(q);
        const inRegion = (r.region || '').toLowerCase().includes(q);
        if (!inName && !inDesc && !inDir && !inRegion) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'fastest') return a.currentTime - b.currentTime;
      if (sortOrder === 'slowest') return b.currentTime - a.currentTime;
      if (sortOrder === 'highest_delay') return (b.delayMinutes || 0) - (a.delayMinutes || 0);
      if (sortOrder === 'distance') return b.distance - a.distance;
      return 0; // default order
    });
  }, [routes, selectedRegion, selectedCorridor, selectedSpeedFilter, searchQuery, sortOrder]);

  const currentRegionCount = useMemo(() => {
    if (selectedRegion === 'all') return routes.length;
    return routes.filter(r => r.region?.toLowerCase().includes(selectedRegion.toLowerCase())).length;
  }, [routes, selectedRegion]);

  const activeRegionAvgSpeed = useMemo(() => {
    const subset = selectedRegion === 'all' 
      ? routes 
      : routes.filter(r => r.region?.toLowerCase().includes(selectedRegion.toLowerCase()));
    if (subset.length === 0) return 0;
    const total = subset.reduce((acc, r) => acc + (r.currentSpeed || 0), 0);
    return Math.round(total / subset.length);
  }, [routes, selectedRegion]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Banner & Live Sync */}
      <div className="bg-gradient-to-r from-[#070E1A] via-[#0C1420] to-[#070E1A] border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="inline-flex items-center space-x-1.5 text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Live Corridor Telemetry</span>
              </span>
              {lastFetched && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Updated: {new Date(lastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center space-x-2">
              <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>Highway Travel Times</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Real-time travel times, average speeds, and corridor bottlenecks monitored across Gauteng and national freeway networks.
            </p>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Sync Button */}
            <button
              type="button"
              onClick={() => fetchTravelTimes(true)}
              disabled={isSyncing}
              className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-60"
              title="Force sync latest travel times"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Notification */}
        {syncNotice && (
          <div className="mt-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl px-3 py-1.5 text-xs text-cyan-200 font-bold flex items-center justify-between animate-fadeIn">
            <span>{syncNotice}</span>
            <button onClick={() => setSyncNotice(null)} className="text-cyan-400 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quick Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-[#050912]/80 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Corridors Monitored</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-white">{currentRegionCount}</span>
              <span className="text-[10px] text-cyan-400 font-mono">({selectedRegion})</span>
            </div>
          </div>

          <div className="bg-[#050912]/80 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Average Velocity</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-emerald-400">{activeRegionAvgSpeed}</span>
              <span className="text-[10px] text-slate-400">km/h</span>
            </div>
          </div>

          <div className="bg-[#050912]/80 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Free Flowing</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-emerald-400">
                {routes.filter(r => (selectedRegion === 'all' || r.region?.toLowerCase().includes(selectedRegion.toLowerCase())) && r.congestionLevel === 'free_flow').length}
              </span>
              <span className="text-[10px] text-slate-400">&gt;80 km/h</span>
            </div>
          </div>

          <div className="bg-[#050912]/80 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Congested Segments</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-black text-amber-400">
                {routes.filter(r => (selectedRegion === 'all' || r.region?.toLowerCase().includes(selectedRegion.toLowerCase())) && (r.congestionLevel === 'congested' || r.congestionLevel === 'heavy_delay')).length}
              </span>
              <span className="text-[10px] text-slate-400">&lt;55 km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Province Tabs & Corridor Quick Chips */}
      <div className="bg-[#0A0D14] border border-slate-800/80 rounded-2xl p-3 sm:p-4 space-y-3">
        {/* Province Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => {
                setSelectedRegion('Gauteng');
                setSelectedCorridor('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                selectedRegion === 'Gauteng'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>⚡ Gauteng</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedRegion === 'Gauteng' ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {stats.gautengCount || 88}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRegion('KwaZulu-Natal');
                setSelectedCorridor('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                selectedRegion === 'KwaZulu-Natal'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🌊 KwaZulu-Natal</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedRegion === 'KwaZulu-Natal' ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {stats.kznCount || 139}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRegion('Western Cape');
                setSelectedCorridor('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                selectedRegion === 'Western Cape'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>⛰️ Western Cape</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedRegion === 'Western Cape' ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {stats.wcCount || 43}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRegion('all');
                setSelectedCorridor('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                selectedRegion === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <span>🌐 All Corridors</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                selectedRegion === 'all' ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {stats.totalRoutes || 270}
              </span>
            </button>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="default">Default Route Order</option>
              <option value="fastest">Shortest Travel Time</option>
              <option value="slowest">Longest Travel Time</option>
              <option value="highest_delay">Highest Delay</option>
              <option value="distance">Longest Distance</option>
            </select>
          </div>
        </div>

        {/* Highway Corridor Quick Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-bold shrink-0">Corridor:</span>
          {CORRIDOR_CHIPS.map(chip => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedCorridor(chip.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedCorridor === chip.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search Bar & Speed Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search corridor or landmark (e.g. Buccleuch, Menlyn, Midrand, OR Tambo, Gilloolys...)"
              className="w-full pl-8 pr-8 py-2 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Speed Status Toggle Group */}
          <div className="flex items-center space-x-1 shrink-0 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedSpeedFilter('all')}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedSpeedFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Speeds
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpeedFilter('free_flow')}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1 ${
                selectedSpeedFilter === 'free_flow'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-black shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Fast (&gt;80)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpeedFilter('moderate')}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1 ${
                selectedSpeedFilter === 'moderate'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500/40 font-black shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Moderate</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSpeedFilter('delays')}
              className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center space-x-1 ${
                selectedSpeedFilter === 'delays'
                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40 font-black shadow-sm'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Delays</span>
            </button>
          </div>
        </div>
      </div>

      {/* Routes Count Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <div>
          Showing <span className="font-bold text-white">{filteredRoutes.length}</span> highway routes in{' '}
          <span className="text-cyan-400 font-bold">{selectedRegion === 'all' ? 'National Network' : selectedRegion}</span>
        </div>
        {(searchQuery || selectedCorridor !== 'all' || selectedSpeedFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCorridor('all');
              setSelectedSpeedFilter('all');
            }}
            className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer text-[11px]"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-[#0A0D14] border border-slate-800 rounded-2xl space-y-3">
          <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin mx-auto" />
          <p className="font-bold text-white text-sm">Fetching SANRAL i-Traffic highway corridor travel times...</p>
          <p className="text-slate-500 text-xs">Retrieving live speed and telemetry sensors across Gauteng...</p>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="p-10 text-center text-slate-400 text-xs bg-[#0A0D14] border border-slate-800 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="font-bold text-white text-sm">No corridor routes match your search filters.</p>
          <p className="text-slate-500">Try changing the corridor filter or clearing the search keyword.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCorridor('all');
              setSelectedSpeedFilter('all');
            }}
            className="bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Routes Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRoutes.map((route, index) => {
            const isCopied = copiedRouteId === route.id;
            const isFreeFlow = route.congestionLevel === 'free_flow';
            const isModerate = route.congestionLevel === 'moderate';
            const isCongested = route.congestionLevel === 'congested' || route.congestionLevel === 'heavy_delay';

            return (
              <React.Fragment key={route.id}>
                {/* Render ShareAppFeedCard after the first route item */}
                {index === 1 && (
                  <div className="md:col-span-2">
                    <ShareAppFeedCard variant="card" />
                  </div>
                )}

                <div className={`bg-[#0A0D14] hover:bg-[#0D111A] border rounded-2xl p-4 transition duration-200 flex flex-col justify-between space-y-3 shadow-md group ${
                  isCongested 
                    ? 'border-rose-900/40 hover:border-rose-500/40 ring-1 ring-rose-500/10' 
                    : isModerate
                    ? 'border-amber-900/40 hover:border-amber-500/40'
                    : 'border-slate-800/80 hover:border-cyan-500/40'
                }`}>
                  {/* Top: Corridor badge & status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {/* Highway Code badge */}
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black tracking-wide ${
                          route.roadwayName.startsWith('N1') ? 'bg-blue-600 text-white' :
                          route.roadwayName.startsWith('N3') ? 'bg-indigo-600 text-white' :
                          route.roadwayName.startsWith('N4') ? 'bg-teal-600 text-white' :
                          route.roadwayName.startsWith('M1') ? 'bg-purple-600 text-white' :
                          route.roadwayName.startsWith('M2') ? 'bg-cyan-600 text-white' :
                          route.roadwayName.startsWith('R21') ? 'bg-amber-600 text-white' :
                          'bg-slate-800 text-cyan-300'
                        }`}>
                          {route.roadwayName}
                        </span>

                        {/* Direction badge */}
                        <span className="text-[11px] font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                          {route.direction}
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {route.region}
                        </span>
                      </div>

                      {/* Route Segment description */}
                      <p className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-2">
                        {route.description}
                      </p>
                    </div>

                    {/* Congestion Status Pill */}
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border ${
                      isFreeFlow
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : isModerate
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    }`}>
                      {isFreeFlow ? 'Free Flow' : isModerate ? 'Moderate' : 'Congestion'}
                    </span>
                  </div>

                  {/* Middle Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-[#05070D] rounded-xl border border-slate-800/80 items-center">
                    {/* Duration / Travel Time */}
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Travel Time</span>
                      <div className="flex items-baseline space-x-1">
                        <span className={`text-lg sm:text-xl font-black ${
                          isCongested ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-cyan-300'
                        }`}>
                          {route.currentTime}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">min</span>
                      </div>
                      {route.delayMinutes && route.delayMinutes > 0 ? (
                        <span className="text-[9px] text-amber-400 font-bold block">
                          +{route.delayMinutes}m delay
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 font-medium block">
                          Optimal flow
                        </span>
                      )}
                    </div>

                    {/* Speed Gauge */}
                    <div className="text-center">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Avg Speed</span>
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className={`text-lg sm:text-xl font-black ${
                          route.currentSpeed >= 80 ? 'text-emerald-400' :
                          route.currentSpeed >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {route.currentSpeed}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">km/h</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                        <div 
                          className={`h-full rounded-full ${
                            route.currentSpeed >= 80 ? 'bg-emerald-400' :
                            route.currentSpeed >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, (route.currentSpeed / 120) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Distance</span>
                      <div className="flex items-baseline justify-end space-x-1">
                        <span className="text-lg sm:text-xl font-black text-white">
                          {route.distance}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">km</span>
                      </div>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        Highway corridor
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="flex items-center justify-end pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => handleCopyRouteInfo(route)}
                      className="text-slate-400 hover:text-cyan-300 font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                      title="Copy route travel time summary"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Time</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};
