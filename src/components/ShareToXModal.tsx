import React, { useState, useEffect } from 'react';
import { X, Twitter, Check, Copy, ExternalLink, Sparkles, AlertTriangle, MapPin, Radio, Shield, Share2, Lightbulb, Bug, Send, MessageSquare, ThumbsUp, CheckCircle2, Sliders } from 'lucide-react';
import { getAppShareUrl, openXShareWindow } from '../utils/shareToX';
import { IncidentReport, FeedItem, FeedbackType, FeedbackPriority, FeedbackStatus, UserFeedbackItem } from '../types';
import { generateITrafficHashtags } from '../utils/whatsappShare';
import { resolveItemRegion } from '../utils/regionUtils';

interface ShareToXModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  initialHashtags?: string[];
  report?: IncidentReport | null;
  feedItem?: FeedItem | null;
  latestAlert?: string;
}

export const ShareToXModal: React.FC<ShareToXModalProps> = ({
  isOpen,
  onClose,
  initialText,
  initialHashtags,
  report,
  feedItem,
  latestAlert
}) => {
  const appUrl = getAppShareUrl();

  // Automatically extract relevant hashtags from i-traffic or report
  const getDerivedHashtags = () => {
    if (initialHashtags && initialHashtags.length > 0) return initialHashtags;
    if (feedItem) {
      return generateITrafficHashtags(feedItem).map(t => t.replace(/^#/, ''));
    }
    if (report) {
      return generateITrafficHashtags({
        roadwayName: report.roadName,
        location: report.locationName,
        content: report.description,
        category: report.type
      }).map(t => t.replace(/^#/, ''));
    }
    return ['LiveTrafficNPC', 'RoadSafety', 'ArriveAlive'];
  };

  // Determine initial template
  const getDefaultMessage = () => {
    if (initialText) return initialText;
    if (report) {
      const isSpike = report.type === 'spiking';
      const icon = isSpike ? '🚨' : report.type === 'crash' ? '💥' : report.type === 'pothole' ? '🔨' : '⚠️';
      const province = resolveItemRegion(report);
      return `${icon} [${report.severity.toUpperCase()}] ${report.title} @ ${report.locationName} (${report.roadName}, ${province})\n\n${report.description}\n\n⚠️ Stay alert and check live road conditions:`;
    }
    if (feedItem) {
      const icon = feedItem.category === 'spiking' ? '🚨' : feedItem.category === 'crash' ? '💥' : '🚦';
      const province = resolveItemRegion(feedItem);
      return `${icon} TRAFFIC ALERT [${province}]: ${feedItem.location || feedItem.roadwayName || 'Corridor'}\n\n${feedItem.content}\n\nCheck real-time highway updates on Live Traffic NPC:`;
    }
    if (latestAlert) {
      return `🚨 LIVE HIGHWAY ALERT:\n"${latestAlert}"\n\nTrack real-time traffic watch, spiking traps & road incidents:`;
    }
    return `🚨 LIVE TRAFFIC WATCH: Real-time highway monitoring, spiking trap warnings, road hazards & live traffic updates across SA.\n\nStay alert and check the live map before travelling:`;
  };

  const [tweetText, setTweetText] = useState<string>(getDefaultMessage());
  const [hashtags, setHashtags] = useState<string[]>(getDerivedHashtags());
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

  useEffect(() => {
    if (isOpen) {
      setTweetText(getDefaultMessage());
      setHashtags(getDerivedHashtags());
      setSelectedTemplate('custom');
    }
  }, [isOpen, initialText, initialHashtags, report, feedItem, latestAlert]);

  if (!isOpen) return null;

  // Quick Preset Templates
  const applyPreset = (type: 'general' | 'spiking' | 'crash' | 'pothole' | 'map') => {
    setSelectedTemplate(type);
    if (type === 'general') {
      setTweetText(`🚨 LIVE TRAFFIC WATCH: Real-time highway alerts, hazard warnings & live camera updates across Gauteng.\n\nStay safe on your journey with Live Traffic NPC:`);
      setHashtags(['LiveTrafficNPC', 'GautengTraffic', 'RoadSafety', 'ArriveAlive']);
    } else if (type === 'spiking') {
      setTweetText(`🚨 URGENT SPIKE TRAP ALERT: Multiple debris & spike hazards reported on highway corridors. Do not stop on unlit shoulders. Patrol units active!\n\nTrack verified hazard pins:`);
      setHashtags(['LiveTrafficNPC', 'SpikingAlert', 'N1Traffic', 'RoadWatch']);
    } else if (type === 'crash') {
      setTweetText(`💥 HIGHWAY CRASH & DELAY WARNING: Collision causing significant traffic backlog. Approach with caution & maintain safe following distance.\n\nLive incident updates:`);
      setHashtags(['LiveTrafficNPC', 'TrafficDelay', 'GautengTraffic', 'DriveSafe']);
    } else if (type === 'pothole') {
      setTweetText(`🔨 ROAD REPAIR ALERT: Deep potholes patched & cleared by community patrol squad. Improving safety for all motorists!\n\nView before/after photos & sponsor a patch:`);
      setHashtags(['LiveTrafficNPC', 'PotholeFixer', 'CommunityPatrol', 'SafeRoads']);
    } else if (type === 'map') {
      setTweetText(`🗺️ LIVE INTERACTIVE TRAFFIC MAP: Check active red congestion zones, camera sensors, and community-reported road hazards in real-time.\n\nOpen interactive map:`);
      setHashtags(['LiveTrafficNPC', 'LiveMap', 'GautengTraffic', 'TrafficWatch']);
    }
  };

  const handleCopyText = async () => {
    const fullContent = `${tweetText}\n\n${appUrl}\n\n${hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')} via @LiveTrafficNPC`;
    try {
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleShareToX = () => {
    openXShareWindow(tweetText, appUrl, hashtags);
    onClose();
  };

  const characterCount = tweetText.length + appUrl.length + hashtags.join(' ').length + 25;
  const isOverLimit = characterCount > 280;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0A0B0D]/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="bg-[#0F1115] border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#111622] to-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-white shadow-md shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center space-x-1.5">
                <span>Share Live Traffic to X.com</span>
              </h3>
              <p className="text-[11px] text-slate-400">Broadcast road safety & hazard alerts to your followers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Share Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('general')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  selectedTemplate === 'general'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                🚨 General Watch
              </button>
              <button
                type="button"
                onClick={() => applyPreset('spiking')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  selectedTemplate === 'spiking'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                ⚠️ Spiking Alert
              </button>
              <button
                type="button"
                onClick={() => applyPreset('crash')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  selectedTemplate === 'crash'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                💥 Crash / Delay
              </button>
              <button
                type="button"
                onClick={() => applyPreset('map')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  selectedTemplate === 'map'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                🗺️ Live Map
              </button>
              <button
                type="button"
                onClick={() => applyPreset('pothole')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                  selectedTemplate === 'pothole'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                    : 'bg-[#050608] text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                🔨 Pothole Fix
              </button>
            </div>
          </div>

          {/* Post Message Composer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Post Text on X
              </label>
              <span className={`font-mono text-[11px] font-bold ${isOverLimit ? 'text-rose-400' : 'text-slate-400'}`}>
                {characterCount}/280
              </span>
            </div>
            <textarea
              rows={4}
              value={tweetText}
              onChange={(e) => {
                setTweetText(e.target.value);
                setSelectedTemplate('custom');
              }}
              placeholder="Enter message to post on X..."
              className="w-full bg-[#050608] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition leading-relaxed resize-none font-sans"
            />
          </div>

          {/* Attached App Link & Hashtags Preview Card */}
          <div className="bg-[#050608] border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span className="font-bold text-slate-300">Attached Link:</span>
              <span className="text-sky-400 font-mono truncate max-w-[200px]">{appUrl}</span>
            </div>
            <div className="flex items-center space-x-1 flex-wrap gap-y-1">
              <span className="text-slate-400 font-bold mr-1">Hashtags:</span>
              {hashtags.map((tag) => (
                <span key={tag} className="bg-sky-950/70 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold">
                  #{tag.replace(/^#/, '')}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-slate-500 pt-0.5">
              Attribution: <span className="text-slate-400 font-bold">via @LiveTrafficNPC</span>
            </div>
          </div>

          {/* Official Channel Reference */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
                X
              </div>
              <div>
                <p className="text-[11px] font-bold text-white leading-tight">LiveTrafficNPC on X</p>
                <p className="text-[10px] text-slate-400">Official Channel: @LiveTrafficNPC</p>
              </div>
            </div>
            <a
              href="https://x.com/LiveTrafficNPC"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 text-[11px] font-bold flex items-center space-x-1 underline"
            >
              <span>Visit Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0A0B0D] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className="bg-[#050608] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleShareToX}
              className="bg-white hover:bg-slate-200 text-slate-950 font-black px-4 sm:px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 transition shadow-lg shadow-white/10 cursor-pointer uppercase tracking-wider"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Post to X</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
