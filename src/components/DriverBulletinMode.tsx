import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  AlertTriangle,
  Siren,
  Car,
  PhoneCall,
  X,
  Radio,
  CheckCircle2,
  ShieldAlert,
  Flame,
  Wrench,
  Filter,
  MapPin,
  Compass,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Layers,
  Sparkles,
  Mic
} from 'lucide-react';
import { IncidentReport, FeedItem, EmergencySOS, RegisteredUser } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { SpikeProximityRadar } from './SpikeProximityRadar';
import { getTimeAgo } from '../utils/dateParser';
import { cleanTrafficText, cleanTextForVoiceSpeech } from '../utils/textSanitizer';

interface DriverBulletinModeProps {
  reports: IncidentReport[];
  sosRequests?: EmergencySOS[];
  feedItems: FeedItem[];
  isOpen: boolean;
  onClose: () => void;
  onOpenReportModal: (options?: { type?: string; title?: string }) => void;
  onOpenSOSModal: () => void;
  onSelectReport?: (report: IncidentReport) => void;
  onSelectLocationForReport?: (lat: number, lng: number) => void;
  onSubmitReport?: (reportData: any) => Promise<void>;
  onRefreshReports?: () => Promise<void>;
  onRefreshFeed?: () => Promise<void>;
  onDeleteReport?: (id: string) => Promise<void> | void;
  onDeleteFeedItem?: (id: string) => Promise<void> | void;
  currentUser?: RegisteredUser | null;
  onOpenShareToX?: (options?: any) => void;
  onOpenVoiceCommands?: () => void;
  isVoiceListening?: boolean;
}

export const DriverBulletinMode: React.FC<DriverBulletinModeProps> = ({
  reports,
  sosRequests = [],
  feedItems,
  isOpen,
  onClose,
  onOpenReportModal,
  onOpenSOSModal,
  onSelectReport = () => {},
  onSelectLocationForReport = () => {},
  onSubmitReport,
  onRefreshReports,
  onRefreshFeed,
  onDeleteReport,
  onDeleteFeedItem,
  currentUser,
  onOpenShareToX,
  onOpenVoiceCommands,
  isVoiceListening
}) => {
  const [driverTab, setDriverTab] = useState<'map' | 'bulletin' | 'quick_report'>('map');
  const [filter, setFilter] = useState<'all' | 'spiking' | 'crash' | 'pothole'>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [selectedMapCategory, setSelectedMapCategory] = useState<string>('all');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState<boolean>(false);
  const [quickLogMessage, setQuickLogMessage] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Combine reports & feed items into a unified driver bulletin list
  const activeReports = reports.filter(r => r.status === 'approved' || r.status === 'resolved');

  const combinedItems = [
    ...activeReports.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      location: r.roadName || r.locationName,
      type: r.type,
      severity: r.severity,
      timestamp: r.createdAt,
      source: 'Community Patrol Watch',
      postedByAdminName: r.createdByAdminName,
      approvedByAdminName: r.approvedByAdminName,
      isEmergency: r.type === 'spiking' || r.type === 'accident' || r.type === 'hazard' || r.severity === 'critical' || r.severity === 'high'
    })),
    ...feedItems.map(f => {
      const cleanAuthor = cleanTrafficText(f.author || '')
        .replace(/\s+/g, ' ')
        .trim();
      const cleanContent = cleanTrafficText(f.content || '');
      
      const corridorInfo = f.roadwayName ? ` (${f.roadwayName})` : '';
      const displayAuthor = cleanAuthor && !cleanAuthor.toLowerCase().includes('traffic') ? cleanAuthor : 'Gauteng Live Feed';
      const cleanTitle = `${(f.eventSubType || f.category).toUpperCase()} ALERT${corridorInfo}: ${displayAuthor}`;

      return {
        id: f.id,
        title: cleanTitle,
        description: cleanContent,
        location: f.location || f.roadwayName || 'Traffic Corridor',
        type: f.category,
        severity: f.category === 'spiking' ? 'critical' : 'medium',
        timestamp: f.timestamp,
        source: f.source === 'twitter' ? '@LiveTrafficNPC Live Stream' : 'Live Feed',
        postedByAdminName: f.postedByAdminName,
        approvedByAdminName: f.approvedByAdminName,
        isEmergency: f.category === 'spiking'
      };
    })
  ];

  // Sort by timestamp descending
  const sortedItems = combinedItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter items
  const filteredItems = sortedItems.filter(item => {
    if (filter === 'spiking') return item.type === 'spiking' || item.isEmergency;
    if (filter === 'crash') return item.type === 'crash' || item.type === 'accident' || item.type === 'traffic' || item.type === 'hazard';
    if (filter === 'pothole') return item.type === 'pothole';
    return true;
  });

  const currentItem = filteredItems[currentIndex] || filteredItems[0];

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak function
  const speakCurrentAlert = (itemToSpeak?: typeof currentItem) => {
    const item = itemToSpeak || currentItem;
    if (!item || !synthRef.current) return;

    try {
      synthRef.current.cancel();

      const cleanTitleSpoken = cleanTextForVoiceSpeech(item.title);
      const cleanLocationSpoken = cleanTextForVoiceSpeech(item.location);
      const cleanDetailsSpoken = cleanTextForVoiceSpeech(item.description);

      const textToSpeak = `Traffic alert: ${cleanLocationSpoken}. ${cleanDetailsSpoken}`;
      if (typeof SpeechSynthesisUtterance === 'undefined') return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (autoPlay && filteredItems.length > 1) {
          // Auto advance to next alert after 2s pause
          setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % filteredItems.length);
          }, 2500);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available or blocked:', e);
      setIsSpeaking(false);
    }
  };

  // Auto speak when index or item changes if autoPlay is on
  useEffect(() => {
    if (autoPlay && currentItem && isOpen) {
      speakCurrentAlert(currentItem);
    }
  }, [currentIndex, filter, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (filteredItems.length === 0) return;
    const nextIdx = (currentIndex + 1) % filteredItems.length;
    setCurrentIndex(nextIdx);
  };

  const handlePrev = () => {
    if (filteredItems.length === 0) return;
    const prevIdx = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setCurrentIndex(prevIdx);
  };

  const toggleSpeech = () => {
    if (!synthRef.current) return;
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } else {
      speakCurrentAlert();
    }
  };

  // Quick 1-Tap Driver Report Handler
  const handleQuickDriverLog = async (type: 'spiking' | 'accident' | 'hazard' | 'pothole' | 'fatal_crash', label: string) => {
    setIsSubmittingQuick(true);
    try {
      let lat = -25.7479;
      let lng = 28.2293;

      if ('geolocation' in navigator) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve(),
            { timeout: 4000, enableHighAccuracy: true }
          );
        });
      }

      const isFatal = type === 'fatal_crash';
      const isSpike = type === 'spiking';

      const reportPayload = {
        type: isFatal ? 'fatal_crash' : type,
        title: isFatal ? `💀 FATAL CRASH: ${label}` : `🚨 DRIVER ALERT: ${label}`,
        description: `1-Tap Driver Report submitted at GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}).`,
        latitude: lat,
        longitude: lng,
        locationName: `GPS Route (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        roadName: 'Active Travel Route',
        severity: (isFatal || isSpike) ? 'critical' : 'high',
        reporterName: 'Community Motorist'
      };

      if (onSubmitReport) {
        await onSubmitReport(reportPayload);
      } else {
        await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportPayload)
        });
      }

      if (onRefreshReports) await onRefreshReports();

      // Voice acknowledgement
      if ('speechSynthesis' in window) {
        try {
          const sp = new SpeechSynthesisUtterance(`${label} logged. Queued for admin verification.`);
          window.speechSynthesis.speak(sp);
        } catch {
          // ignore
        }
      }

      setQuickLogMessage(`✓ ${label} logged! Queued for admin verification.`);
      setTimeout(() => setQuickLogMessage(null), 4000);
      setDriverTab('map');
    } catch (err) {
      console.error('Quick driver log error:', err);
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090E] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* ========================================================================= */}
      {/* DRIVER MODE TOP HEADER BAR                                                */}
      {/* ========================================================================= */}
      <header className="bg-[#0B0F19] border-b-2 border-[#FFE600] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between shrink-0 gap-2 z-30 shadow-xl">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FFE600] text-slate-950 flex items-center justify-center font-black animate-pulse shrink-0 shadow-md shadow-yellow-500/20">
            <Car className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-sm sm:text-base text-[#FFE600] uppercase tracking-wider leading-none">
                DRIVER MODE
              </span>
              <span className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded uppercase animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-300 font-bold truncate">
              {driverTab === 'map' ? 'Visual Traffic Map & GPS HUD' : driverTab === 'bulletin' ? 'Voice Announcer & Big Bulletins' : '1-Tap Incident Logger'}
            </p>
          </div>
        </div>

        {/* Top Right Controls: Voice Commands + Normal Mode Exit Button */}
        <div className="flex items-center space-x-2 shrink-0">
          {onOpenVoiceCommands && (
            <button
              onClick={onOpenVoiceCommands}
              className={`px-3 py-1.5 font-black text-xs rounded-xl border flex items-center space-x-1.5 transition cursor-pointer shadow-md ${
                isVoiceListening
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-[#181C28] hover:bg-slate-800 text-[#FFE600] border-[#FFE600]/60'
              }`}
              title="Voice Commands: Say 'Hey NPC' followed by command"
            >
              <Mic className="w-4 h-4 text-inherit" />
              <span>VOICE AI</span>
            </button>
          )}

          <button
            onClick={() => {
              if (synthRef.current) synthRef.current.cancel();
              onClose();
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-xs rounded-xl border border-slate-600 flex items-center space-x-1.5 transition cursor-pointer shadow-md"
            title="Exit Driver Mode to Normal Mode"
          >
            <X className="w-4 h-4 text-rose-400" />
            <span>NORMAL MODE</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN DRIVER VIEWPORT (MAP / BULLETIN / QUICK REPORT)                      */}
      {/* ========================================================================= */}
      <div className="flex-1 min-h-0 relative flex flex-col overflow-hidden">

        {/* TAB 1: DRIVER LIVE MAP (VISUAL TRAFFIC MAP WITH DRIVER HUD) */}
        {driverTab === 'map' && (
          <div className="h-full w-full relative flex flex-col">
            {/* Spike Hazard Proximity Warning HUD on Map */}
            <div className="px-3 py-2 bg-[#0B0F19] border-b border-slate-800 shrink-0">
              <SpikeProximityRadar
                reports={reports}
                onOpenSOSModal={onOpenSOSModal}
                onOpenReportModal={onOpenReportModal}
              />
            </div>

            {/* Live Interactive Map Component */}
            <div className="flex-1 w-full relative min-h-0">
              <InteractiveMap
                reports={reports.filter(r => r.status === 'approved')}
                sosRequests={sosRequests.filter(s => s.status === 'active')}
                feedItems={feedItems}
                onSelectReport={onSelectReport}
                onSelectLocationForReport={onSelectLocationForReport}
                selectedCategory={selectedMapCategory}
                setSelectedCategory={setSelectedMapCategory}
                onSubmitReport={onSubmitReport}
                onRefreshReports={onRefreshReports}
                onRefreshFeed={onRefreshFeed}
                onDeleteReport={onDeleteReport}
                onDeleteFeedItem={onDeleteFeedItem}
                currentUser={currentUser}
                onOpenShareToX={onOpenShareToX}
              />

              {/* Toast Notification */}
              {quickLogMessage && (
                <div className="absolute top-2.5 left-2.5 right-2.5 z-20 pointer-events-none flex justify-center">
                  <div className="bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm px-4 py-2 rounded-xl shadow-2xl border-2 border-white animate-bounce pointer-events-auto">
                    {quickLogMessage}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DRIVER VOICE BULLETIN (LARGE TEXT & AUTO ANNOUNCER) */}
        {driverTab === 'bulletin' && (
          <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-6 space-y-4 max-w-5xl mx-auto w-full overflow-y-auto pb-20">
            {/* Spike Hazard Proximity Radar Status */}
            <SpikeProximityRadar
              reports={reports}
              onOpenSOSModal={onOpenSOSModal}
              onOpenReportModal={onOpenReportModal}
            />

            {/* Voice Control Card */}
            <div className="bg-[#12151E] border-2 border-[#FFE600]/60 rounded-3xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl shrink-0">
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={toggleSpeech}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black transition text-slate-950 shrink-0 shadow-xl cursor-pointer ${
                    isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-[#FFE600] hover:bg-yellow-300'
                  }`}
                >
                  {isSpeaking ? <Volume2 className="w-7 h-7 sm:w-8 sm:h-8" /> : <VolumeX className="w-7 h-7 sm:w-8 sm:h-8" />}
                </button>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-lg text-white">
                    {isSpeaking ? '🔊 VOICE ANNOUNCER READING ALOUD...' : '🔇 VOICE ANNOUNCER MUTED'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {autoPlay ? 'Auto-advances through active bulletins' : 'Tap play to announce current alert'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setAutoPlay(!autoPlay)}
                  className={`px-3 py-2 rounded-2xl text-xs sm:text-sm font-extrabold border-2 transition cursor-pointer ${
                    autoPlay
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {autoPlay ? '✓ AUTO-PLAY ON' : 'AUTO-PLAY OFF'}
                </button>

                <button
                  onClick={() => speakCurrentAlert()}
                  className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-2 border-sky-400/50 px-3 py-2 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-sky-400" />
                  <span>REPEAT</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <button
                onClick={() => { setFilter('all'); setCurrentIndex(0); }}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition text-center cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#FFE600] text-black border-[#FFE600] shadow-lg shadow-yellow-500/30'
                    : 'bg-[#12151E] text-slate-300 border-slate-800'
                }`}
              >
                ALL ({combinedItems.length})
              </button>

              <button
                onClick={() => { setFilter('spiking'); setCurrentIndex(0); }}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition text-center cursor-pointer ${
                  filter === 'spiking'
                    ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/40'
                    : 'bg-[#12151E] text-red-400 border-red-900/60'
                }`}
              >
                🚨 SPIKING
              </button>

              <button
                onClick={() => { setFilter('crash'); setCurrentIndex(0); }}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition text-center cursor-pointer ${
                  filter === 'crash'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                    : 'bg-[#12151E] text-amber-400 border-amber-900/60'
                }`}
              >
                ⚠️ CRASHES
              </button>

              <button
                onClick={() => { setFilter('pothole'); setCurrentIndex(0); }}
                className={`py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition text-center cursor-pointer ${
                  filter === 'pothole'
                    ? 'bg-sky-500 text-black border-sky-400 shadow-lg shadow-sky-500/30'
                    : 'bg-[#12151E] text-sky-400 border-sky-900/60'
                }`}
              >
                🔨 POTHOLES
              </button>
            </div>

            {/* Featured Large Display Card */}
            {filteredItems.length === 0 ? (
              <div className="bg-[#12151E] border-4 border-dashed border-slate-800 rounded-3xl p-8 text-center space-y-3">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-black text-slate-300">NO ACTIVE BULLETINS IN THIS CATEGORY</h3>
                <p className="text-xs text-slate-400">All corridors reported clear or monitoring is active.</p>
              </div>
            ) : (
              <div className={`bg-[#0F121C] border-4 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl relative ${
                currentItem.isEmergency
                  ? 'border-red-600 bg-gradient-to-b from-red-950/40 via-[#0F121C] to-[#0F121C]'
                  : 'border-[#FFE600]'
              }`}>
                {/* Header badges */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${
                      currentItem.isEmergency
                        ? 'bg-red-600 text-white border-red-400 animate-pulse'
                        : 'bg-[#FFE600] text-black border-yellow-300'
                    }`}>
                      {currentItem.isEmergency ? '🚨 CRITICAL HAZARD' : '⚠️ HIGHWAY BULLETIN'}
                    </span>

                    <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-xl text-xs font-bold font-mono">
                      ALERT {currentIndex + 1} OF {filteredItems.length}
                    </span>
                  </div>

                  <span className="text-xs sm:text-sm font-black text-[#FFE600] bg-black/60 px-2.5 py-0.5 rounded-xl border border-yellow-500/30">
                    ⏱ {getTimeAgo(currentItem.timestamp)}
                  </span>
                </div>

                {/* Big Alert Location & Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="text-xs sm:text-sm font-black text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Radio className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
                      <span>LOCATION: {currentItem.location}</span>
                    </div>

                    {(currentItem.postedByAdminName || currentItem.approvedByAdminName) && (
                      <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold px-2.5 py-0.5 rounded-lg flex items-center space-x-1 shadow">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {currentItem.postedByAdminName 
                            ? `Posted by Admin: ${currentItem.postedByAdminName}`
                            : `Approved by Admin: ${currentItem.approvedByAdminName}`}
                        </span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                    {currentItem.title}
                  </h2>
                </div>

                {/* Extra Large Readout Body */}
                <div className="bg-[#05070B] border-2 border-slate-800 rounded-2xl p-3.5 sm:p-5 text-base sm:text-xl font-bold text-slate-100 leading-relaxed shadow-inner">
                  "{currentItem.description}"
                </div>

                {/* Navigation Controls (Next / Prev) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                  <button
                    onClick={handlePrev}
                    className="bg-[#181C28] hover:bg-slate-800 text-white font-black py-3 sm:py-4 px-3 rounded-2xl border-2 border-slate-700 text-sm sm:text-base flex items-center justify-center space-x-2 transition cursor-pointer shadow-xl active:scale-95"
                  >
                    <SkipBack className="w-5 h-5 text-[#FFE600]" />
                    <span>PREVIOUS</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="bg-gradient-to-r from-[#FFE600] to-yellow-500 hover:brightness-110 text-slate-950 font-black py-3 sm:py-4 px-3 rounded-2xl border-2 border-yellow-300 text-sm sm:text-base flex items-center justify-center space-x-2 transition cursor-pointer shadow-2xl active:scale-95"
                  >
                    <span>NEXT (➔)</span>
                    <SkipForward className="w-5 h-5 text-slate-950" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Switch to Map View */}
            <button
              onClick={() => setDriverTab('map')}
              className="w-full bg-[#12151E] hover:bg-slate-800 text-sky-300 font-extrabold py-3 rounded-2xl border-2 border-sky-500/40 flex items-center justify-center space-x-2 transition cursor-pointer text-xs sm:text-sm"
            >
              <MapPin className="w-4 h-4 text-sky-400" />
              <span>RETURN TO DRIVER LIVE MAP VIEW</span>
            </button>
          </div>
        )}

        {/* TAB 3: 1-TAP DRIVER REPORTING */}
        {driverTab === 'quick_report' && (
          <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full overflow-y-auto pb-20">
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-3xl font-black text-[#FFE600] uppercase tracking-wider">
                🚨 1-TAP DRIVER INCIDENT PINNER
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Instantly broadcast and pin critical road hazards at your current vehicle GPS coordinates.
              </p>
            </div>

            {quickLogMessage && (
              <div className="bg-emerald-500 text-slate-950 font-black text-sm p-3 rounded-2xl text-center shadow-xl border-2 border-white animate-bounce">
                {quickLogMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => handleQuickDriverLog('accident', 'Major Crash / Vehicle Collision')}
                disabled={isSubmittingQuick}
                className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black p-5 rounded-3xl text-lg sm:text-xl flex items-center justify-between border-4 border-yellow-300 shadow-2xl transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 text-left">
                  <AlertTriangle className="w-9 h-9 text-slate-950 shrink-0" />
                  <div>
                    <div className="font-black">VEHICLE CRASH</div>
                    <div className="text-xs text-slate-900 font-medium">Lane obstruction & collision</div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-950" />
              </button>

              <button
                onClick={() => handleQuickDriverLog('spiking', 'Spike Trap / Nails Hazard')}
                disabled={isSubmittingQuick}
                className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black p-5 rounded-3xl text-lg sm:text-xl flex items-center justify-between border-4 border-red-400 shadow-2xl transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 text-left">
                  <ShieldAlert className="w-9 h-9 text-white animate-bounce shrink-0" />
                  <div>
                    <div className="font-black">SPIKE TRAP / CRIME</div>
                    <div className="text-xs text-red-200 font-medium">Critical danger - broadcast immediately</div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => handleQuickDriverLog('fatal_crash', 'Fatal Crash / Critical Road Closure')}
                disabled={isSubmittingQuick}
                className="bg-gradient-to-r from-red-950 via-rose-950 to-slate-900 hover:from-red-900 hover:to-rose-900 active:scale-95 text-white font-black p-5 rounded-3xl text-lg sm:text-xl flex items-center justify-between border-4 border-red-500 shadow-2xl transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 text-left">
                  <AlertTriangle className="w-9 h-9 text-red-400 animate-pulse shrink-0" />
                  <div>
                    <div className="font-black text-red-200 flex items-center gap-1.5">
                      <span>💀 FATAL CRASH</span>
                      <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black">CRITICAL</span>
                    </div>
                    <div className="text-xs text-red-300 font-medium">Fatality / major scene investigation</div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-red-300" />
              </button>

              <button
                onClick={() => handleQuickDriverLog('hazard', 'Stationary Obstruction / Debris')}
                disabled={isSubmittingQuick}
                className="bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 font-black p-5 rounded-3xl text-lg sm:text-xl flex items-center justify-between border-4 border-orange-300 shadow-2xl transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 text-left">
                  <Flame className="w-9 h-9 text-slate-950 shrink-0" />
                  <div>
                    <div className="font-black">ROAD HAZARD / FIRE</div>
                    <div className="text-xs text-slate-900 font-medium">Stationary vehicle, smoke, objects</div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-950" />
              </button>

              <button
                onClick={() => handleQuickDriverLog('pothole', 'Dangerous Pothole / Road Damage')}
                disabled={isSubmittingQuick}
                className="bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black p-5 rounded-3xl text-lg sm:text-xl flex items-center justify-between border-4 border-sky-300 shadow-2xl transition cursor-pointer"
              >
                <div className="flex items-center space-x-3 text-left">
                  <Wrench className="w-9 h-9 text-slate-950 shrink-0" />
                  <div>
                    <div className="font-black">SEVERE POTHOLE</div>
                    <div className="text-xs text-slate-900 font-medium">Tire damage / surface crater</div>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-950" />
              </button>
            </div>

            {/* Custom Detailed Report Option */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (synthRef.current) synthRef.current.cancel();
                  onOpenReportModal();
                }}
                className="w-full bg-[#12151E] hover:bg-slate-800 text-slate-200 font-extrabold py-3.5 px-4 rounded-2xl border-2 border-slate-700 flex items-center justify-center space-x-2 transition cursor-pointer text-sm"
              >
                <span>Need to attach a photo or detailed notes? Open Full Report Form</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* INTEGRATED DRIVER MODE AUDIO & HAZARD PLAYER (REPLACING BOTTOM NAV)      */}
      {/* ========================================================================= */}
      <nav className="bg-[#0B0F19] border-t-2 border-[#FFE600] px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shrink-0 z-30 shadow-[0_-8px_25px_rgba(0,0,0,0.85)]">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          {/* 1. Large Audio Announcer / Mute Toggle Button */}
          <button
            onClick={toggleSpeech}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-black transition text-slate-950 shrink-0 cursor-pointer shadow-lg active:scale-95 touch-manipulation ${
              isSpeaking
                ? 'bg-emerald-400 border-2 border-emerald-300 animate-pulse'
                : 'bg-[#FFE600] hover:bg-yellow-300 border-2 border-yellow-300'
            }`}
            title={isSpeaking ? 'Mute Voice Bulletin' : 'Play Voice Bulletin Aloud'}
            aria-label="Toggle Voice Bulletin"
          >
            {isSpeaking ? (
              <Volume2 className="w-6 h-6 text-slate-950" />
            ) : (
              <VolumeX className="w-6 h-6 text-slate-950" />
            )}
          </button>

          {/* 2. Center Alert Display & Bulletin Info */}
          <div 
            onClick={() => setDriverTab(driverTab === 'bulletin' ? 'map' : 'bulletin')}
            className="flex-1 min-w-0 cursor-pointer group bg-[#12151E] hover:bg-[#181D2A] border border-slate-800 rounded-xl px-2.5 py-1 sm:py-1.5 transition flex flex-col justify-center"
            title="Tap to toggle full bulletin text / map"
          >
            {currentItem ? (
              <>
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className={`text-[9px] sm:text-[10px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 leading-tight ${
                    currentItem.isEmergency ? 'bg-red-600 text-white animate-pulse' : 'bg-[#FFE600] text-black font-black'
                  }`}>
                    {currentItem.isEmergency ? '🚨 CRITICAL' : '⚠️ BULLETIN'}
                  </span>
                  
                  <span className="text-[11px] sm:text-xs font-black text-amber-400 truncate">
                    {currentItem.location}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-auto">
                    {currentIndex + 1}/{filteredItems.length}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight mt-0.5 group-hover:text-yellow-300 transition">
                  {currentItem.title}
                </p>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-300 truncate">No active critical alerts on route</span>
              </div>
            )}
          </div>

          {/* 3. Audio Skip Controls (Previous / Next) */}
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={handlePrev}
              disabled={filteredItems.length <= 1}
              className="h-10 w-10 sm:h-11 sm:w-11 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center disabled:opacity-40"
              title="Previous Bulletin"
              aria-label="Previous Bulletin"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE600]" />
            </button>

            <button
              onClick={handleNext}
              disabled={filteredItems.length <= 1}
              className="h-10 w-10 sm:h-11 sm:w-11 bg-[#FFE600] hover:bg-yellow-300 active:scale-95 text-slate-950 font-black rounded-xl border border-yellow-300 transition cursor-pointer shadow-md flex items-center justify-center disabled:opacity-40"
              title="Next Bulletin"
              aria-label="Next Bulletin"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </nav>
    </div>
  );
};
