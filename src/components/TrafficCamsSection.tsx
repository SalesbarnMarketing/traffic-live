import React, { useState, useEffect, useMemo } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Search, 
  Filter, 
  MapPin, 
  ExternalLink, 
  Share2, 
  Check, 
  Star, 
  AlertTriangle, 
  Maximize2, 
  X, 
  Radio, 
  Eye, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Compass,
  Zap,
  Info,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { ReportType } from '../types';
import { SOUTH_AFRICA_TRAFFIC_CAMERAS, TrafficCamera } from '../data/trafficCamsData';

interface TrafficCamsSectionProps {
  initialCameraId?: string | null;
  onSelectLocationOnMap?: (lat: number, lng: number) => void;
  onOpenReportModal?: (options?: { 
    locationName?: string; 
    roadName?: string; 
    latitude?: number; 
    longitude?: number; 
    type?: ReportType; 
    description?: string 
  }) => void;
  className?: string;
}

const FAVORITES_STORAGE_KEY = 'livetraffic_favorite_cameras_v1';

export const TrafficCamsSection: React.FC<TrafficCamsSectionProps> = ({
  initialCameraId = null,
  onSelectLocationOnMap,
  onOpenReportModal,
  className = ''
}) => {
  const [cameras, setCameras] = useState<TrafficCamera[]>(SOUTH_AFRICA_TRAFFIC_CAMERAS);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedRoadway, setSelectedRoadway] = useState<string>('all');
  const [selectedFlow, setSelectedFlow] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [sortOrder, setSortOrder] = useState<'popular' | 'name' | 'roadway' | 'congestion'>('popular');
  const [activeModalCamera, setActiveModalCamera] = useState<TrafficCamera | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(15);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [copiedCamId, setCopiedCamId] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Bookmarked / Favorite Camera IDs
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['cam-gp-n1-01', 'cam-kzn-n3-01', 'cam-wc-n2-01'];
    } catch {
      return ['cam-gp-n1-01', 'cam-kzn-n3-01', 'cam-wc-n2-01'];
    }
  });

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavoriteIds(prev => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.debug('Failed to save favorites to localStorage:', err);
      }
      return next;
    });
  };

  // Open initial camera if provided in URL or props
  useEffect(() => {
    if (initialCameraId) {
      const found = cameras.find(c => c.id === initialCameraId || c.id.toLowerCase() === initialCameraId.toLowerCase());
      if (found) {
        setActiveModalCamera(found);
      }
    }
  }, [initialCameraId, cameras]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          handleRefreshSnapshots();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  const handleRefreshSnapshots = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCameras(prev => prev.map(cam => ({
        ...cam,
        lastUpdated: new Date().toISOString()
      })));
      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsRefreshing(false);
      setRefreshCountdown(15);
    }, 600);
  };

  const handleCopyCamLink = (cam: TrafficCamera, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'trafficcams');
    url.searchParams.set('cam', cam.id);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url.toString());
      setCopiedCamId(cam.id);
      setTimeout(() => setCopiedCamId(null), 3000);
    }
  };

  const handleReportHazardAtCamera = (cam: TrafficCamera, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onOpenReportModal) {
      onOpenReportModal({
        locationName: cam.name,
        roadName: `${cam.roadway} (${cam.direction})`,
        latitude: cam.latitude,
        longitude: cam.longitude,
        type: 'traffic',
        description: `Visual report from live CCTV camera (${cam.name}). High volume / congestion observed.`
      });
    }
  };

  const uniqueRoadways = useMemo(() => {
    const list = Array.from(new Set(SOUTH_AFRICA_TRAFFIC_CAMERAS.map(c => c.roadway)));
    return list.sort();
  }, []);

  const filteredCameras = useMemo(() => {
    return cameras.filter(cam => {
      if (favoritesOnly && !favoriteIds.includes(cam.id)) return false;
      if (selectedRegion !== 'all' && cam.region.toLowerCase() !== selectedRegion.toLowerCase()) return false;
      if (selectedRoadway !== 'all' && cam.roadway.toLowerCase() !== selectedRoadway.toLowerCase()) return false;
      if (selectedFlow !== 'all' && cam.trafficFlow !== selectedFlow) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = cam.name.toLowerCase().includes(q);
        const matchRoad = cam.roadway.toLowerCase().includes(q);
        const matchLoc = cam.locationDescription.toLowerCase().includes(q);
        const matchRegion = cam.region.toLowerCase().includes(q);
        const matchMarker = cam.kilometerMarker?.toLowerCase().includes(q) || false;
        if (!matchName && !matchRoad && !matchLoc && !matchRegion && !matchMarker) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'popular') {
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return a.name.localeCompare(b.name);
      }
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'roadway') return a.roadway.localeCompare(b.roadway) || a.name.localeCompare(b.name);
      if (sortOrder === 'congestion') {
        const flowWeight: Record<string, number> = { standstill: 4, congested: 3, moderate: 2, free_flow: 1 };
        return (flowWeight[b.trafficFlow] || 0) - (flowWeight[a.trafficFlow] || 0);
      }
      return 0;
    });
  }, [cameras, selectedRegion, selectedRoadway, selectedFlow, searchQuery, favoritesOnly, favoriteIds, sortOrder]);

  const stats = useMemo(() => {
    const total = cameras.length;
    const online = cameras.filter(c => c.status === 'online').length;
    const congested = cameras.filter(c => c.trafficFlow === 'congested' || c.trafficFlow === 'standstill').length;
    const freeFlow = cameras.filter(c => c.trafficFlow === 'free_flow').length;
    const gauteng = cameras.filter(c => c.region === 'Gauteng').length;
    const kzn = cameras.filter(c => c.region === 'KwaZulu-Natal').length;
    const wc = cameras.filter(c => c.region === 'Western Cape').length;
    return { total, online, congested, freeFlow, gauteng, kzn, wc };
  }, [cameras]);

  const getFlowBadge = (flow: TrafficCamera['trafficFlow'], speed?: number) => {
    switch (flow) {
      case 'free_flow':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Free Flow {speed ? `(${speed} km/h)` : ''}
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Moderate {speed ? `(${speed} km/h)` : ''}
          </span>
        );
      case 'congested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
            Heavy Congestion {speed ? `(${speed} km/h)` : ''}
          </span>
        );
      case 'standstill':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-600/20 text-red-300 border border-red-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            Gridlock / Standstill
          </span>
        );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/20 p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Live Highway Traffic Cameras
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    LIVE CCTV
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Real-time optical snapshots & corridor CCTV feeds from SANRAL i-Traffic, Gauteng, KZN & Western Cape freeways.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Refresh Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                autoRefreshEnabled 
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40 hover:bg-indigo-600/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
              title="Toggle automatic 15-second snapshot refresh"
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefreshEnabled ? 'text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Auto-refresh: {autoRefreshEnabled ? `${refreshCountdown}s` : 'Off'}</span>
            </button>

            <button
              onClick={handleRefreshSnapshots}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-60 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Now'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Summary Counters */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Total Highway Cams</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-white">{stats.total}</span>
              <span className="text-xs text-emerald-400 font-semibold">({stats.online} online)</span>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Free-Flowing Corridors</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-emerald-400">{stats.freeFlow}</span>
              <span className="text-[11px] text-slate-400">cams</span>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Congestion / Delays</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-black text-rose-400">{stats.congested}</span>
              <span className="text-[11px] text-slate-400">nodes</span>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/70">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Last Live Synced</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-indigo-300 truncate">{lastRefreshedAt}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 space-y-3.5 shadow-lg">
        {/* Search & Favorites Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search camera name, interchange, N1, N3, M1, Midrand, Sandton, Durban, Cape Town..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
                favoritesOnly 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
              <span>Favorites ({favoriteIds.length})</span>
            </button>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 shrink-0"
            >
              <option value="popular">⭐ Sort: Popular First</option>
              <option value="name">🔤 Sort: Camera Name</option>
              <option value="roadway">🛣️ Sort: Highway Route</option>
              <option value="congestion">🚦 Sort: Most Congested</option>
            </select>

            <div className="hidden sm:flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'compact' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Compact List View"
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Region / Province Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1">
          {[
            { id: 'all', label: 'All Provinces', count: stats.total },
            { id: 'Gauteng', label: 'Gauteng (JHB / PTA)', count: stats.gauteng },
            { id: 'KwaZulu-Natal', label: 'KwaZulu-Natal (Durban / N3)', count: stats.kzn },
            { id: 'Western Cape', label: 'Western Cape (Cape Town)', count: stats.wc },
            { id: 'Eastern Cape', label: 'Eastern Cape', count: cameras.filter(c => c.region === 'Eastern Cape').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedRegion(tab.id);
                setSelectedRoadway('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all border ${
                selectedRegion.toLowerCase() === tab.id.toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-sm'
                  : 'bg-slate-950 text-slate-300 border-slate-800/80 hover:bg-slate-800'
              }`}
            >
              {tab.label} <span className="opacity-70 text-[11px]">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Secondary Filter: Roadway & Flow */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold">
            <Filter className="w-3 h-3 text-indigo-400" /> Highway:
          </span>
          <button
            onClick={() => setSelectedRoadway('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              selectedRoadway === 'all' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Corridors
          </button>
          {uniqueRoadways.map(road => (
            <button
              key={road}
              onClick={() => setSelectedRoadway(road)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                selectedRoadway === road 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {road}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Flow:</span>
            <select
              value={selectedFlow}
              onChange={(e) => setSelectedFlow(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
            >
              <option value="all">All Traffic Speeds</option>
              <option value="free_flow">🟢 Free Flow</option>
              <option value="moderate">🟡 Moderate</option>
              <option value="congested">🔴 Congested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <span className="font-semibold text-slate-200">{filteredCameras.length}</span> live traffic cameras
          {searchQuery && <span> matching "<span className="text-indigo-300">{searchQuery}</span>"</span>}
        </div>
        {(selectedRegion !== 'all' || selectedRoadway !== 'all' || selectedFlow !== 'all' || favoritesOnly || searchQuery) && (
          <button
            onClick={() => {
              setSelectedRegion('all');
              setSelectedRoadway('all');
              setSelectedFlow('all');
              setFavoritesOnly(false);
              setSearchQuery('');
            }}
            className="text-indigo-400 hover:text-indigo-300 underline font-medium"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Cameras List / Grid */}
      {filteredCameras.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-12 text-center space-y-3">
          <Camera className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Traffic Cameras Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No active cameras matched your selected filters or search terms. Try selecting a different province or resetting your search.
          </p>
          <button
            onClick={() => {
              setSelectedRegion('all');
              setSelectedRoadway('all');
              setSelectedFlow('all');
              setFavoritesOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            Show All Cameras
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCameras.map((cam) => {
            const isFav = favoriteIds.includes(cam.id);
            const isCopied = copiedCamId === cam.id;

            return (
              <div
                key={cam.id}
                onClick={() => setActiveModalCamera(cam)}
                className="group relative bg-slate-900 rounded-2xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 overflow-hidden shadow-md hover:shadow-indigo-500/10 cursor-pointer flex flex-col justify-between"
              >
                {/* Camera Snapshot Image Preview */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                  <img
                    src={cam.snapshotUrl}
                    alt={cam.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-bold text-white tracking-wide">
                      🛣️ {cam.roadway}
                    </span>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      <button
                        onClick={(e) => toggleFavorite(cam.id, e)}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition-all ${
                          isFav 
                            ? 'bg-amber-500/90 text-slate-950 shadow-sm' 
                            : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={(e) => handleCopyCamLink(cam, e)}
                        className="p-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white backdrop-blur-md transition-all"
                        title="Copy share link"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Image Overlay: Flow & Direction */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <div>
                      {getFlowBadge(cam.trafficFlow, cam.speedEstimateKmh)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                      <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                      <span>{cam.operator}</span>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                        {cam.name}
                      </h3>
                      {cam.kilometerMarker && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded shrink-0">
                          {cam.kilometerMarker}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {cam.locationDescription}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
                      <Compass className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">{cam.direction}</span>
                      <span className="text-slate-600">•</span>
                      <span className="truncate text-indigo-300">{cam.region}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectLocationOnMap) {
                          onSelectLocationOnMap(cam.latitude, cam.longitude);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all"
                      title="View this camera location on Interactive Traffic Map"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Map</span>
                    </button>

                    <button
                      onClick={(e) => handleReportHazardAtCamera(cam, e)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Report a hazard or incident observed at this camera"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Report Alert</span>
                    </button>

                    <button
                      onClick={() => setActiveModalCamera(cam)}
                      className="ml-auto p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                      title="Open full view"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Compact List View */
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
          {filteredCameras.map((cam) => {
            const isFav = favoriteIds.includes(cam.id);
            return (
              <div
                key={cam.id}
                onClick={() => setActiveModalCamera(cam)}
                className="p-3.5 sm:p-4 hover:bg-slate-800/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-12 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                    <img
                      src={cam.snapshotUrl}
                      alt={cam.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/20"></div>
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-200">
                        {cam.roadway}
                      </span>
                      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 truncate">
                        {cam.name}
                      </h4>
                      {cam.kilometerMarker && (
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          ({cam.kilometerMarker})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {cam.locationDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  {getFlowBadge(cam.trafficFlow, cam.speedEstimateKmh)}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => toggleFavorite(cam.id, e)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isFav ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectLocationOnMap) onSelectLocationOnMap(cam.latitude, cam.longitude);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50"
                      title="View on Map"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Camera Live Stream / Full Detail Modal */}
      {activeModalCamera && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveModalCamera(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                      {activeModalCamera.roadway}
                    </span>
                    <h3 className="text-base font-bold text-white truncate">
                      {activeModalCamera.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {activeModalCamera.region} • {activeModalCamera.direction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleFavorite(activeModalCamera.id)}
                  className={`p-2 rounded-xl border transition-all ${
                    favoriteIds.includes(activeModalCamera.id)
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Bookmark camera"
                >
                  <Star className={`w-4 h-4 ${favoriteIds.includes(activeModalCamera.id) ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => handleCopyCamLink(activeModalCamera)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                  title="Share camera"
                >
                  {copiedCamId === activeModalCamera.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setActiveModalCamera(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Camera Snapshot Display */}
            <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
              <img
                src={activeModalCamera.snapshotUrl}
                alt={activeModalCamera.name}
                className="w-full h-full object-cover"
              />

              {/* Live Overlay HUD */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE SNAPSHOT
                </span>
                <span className="px-2 py-1 rounded-md bg-black/70 text-slate-300 text-xs font-mono">
                  {lastRefreshedAt} SAST
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div>{getFlowBadge(activeModalCamera.trafficFlow, activeModalCamera.speedEstimateKmh)}</div>
                <div className="px-2.5 py-1 rounded-md bg-black/70 text-slate-300 text-xs font-mono">
                  {activeModalCamera.latitude.toFixed(4)}, {activeModalCamera.longitude.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Modal Body & Highway Intelligence */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Corridor Location & Description
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeModalCamera.locationDescription}
                </p>
                {activeModalCamera.notes && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-indigo-200 text-xs flex items-start gap-2 mt-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{activeModalCamera.notes}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                <button
                  onClick={() => {
                    const cam = activeModalCamera;
                    setActiveModalCamera(null);
                    if (onSelectLocationOnMap) {
                      onSelectLocationOnMap(cam.latitude, cam.longitude);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>View on Interactive Map</span>
                </button>

                <button
                  onClick={() => {
                    const cam = activeModalCamera;
                    handleReportHazardAtCamera(cam);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Report Incident at this Camera</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
