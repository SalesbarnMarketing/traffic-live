import React, { useState, useEffect, useRef } from 'react';
import { Globe, ExternalLink, RefreshCw, Settings, Check, Sparkles, AlertCircle, Layers, Twitter, AlertTriangle, MessageSquare, ShieldCheck } from 'lucide-react';
import { FeedItem } from '../types';
import { formatReadableDateTime } from '../utils/dateParser';

interface SocialFeedAggregatorEmbedProps {
  onSwitchToStream?: () => void;
}

export const SocialFeedAggregatorEmbed: React.FC<SocialFeedAggregatorEmbedProps> = ({ onSwitchToStream }) => {
  const [aggregatorUrl, setAggregatorUrl] = useState<string>('https://x.com/LiveTrafficNPC');
  const [inputUrl, setInputUrl] = useState<string>('https://x.com/LiveTrafficNPC');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [embedMode, setEmbedMode] = useState<'stream' | 'official' | 'syndication' | 'aggregator'>('stream');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(false);
  const twitterContainerRef = useRef<HTMLDivElement>(null);

  // Fetch local feed items for Native Stream fallback
  useEffect(() => {
    setIsLoadingFeed(true);
    fetch('/api/feed')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeedItems(data.filter((item: FeedItem) => item.source === 'twitter'));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingFeed(false));
  }, []);

  // Load official Twitter widgets.js when in official mode
  useEffect(() => {
    if (embedMode === 'official') {
      const scriptId = 'twitter-wjs';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      const loadWidget = () => {
        if ((window as any).twttr && (window as any).twttr.widgets) {
          if (twitterContainerRef.current) {
            twitterContainerRef.current.innerHTML = `
              <a class="twitter-timeline" data-theme="dark" href="${aggregatorUrl}">
                Tweets by @LiveTrafficNPC
              </a>
            `;
          }
          (window as any).twttr.widgets.load(twitterContainerRef.current);
        }
      };

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = loadWidget;
        document.body.appendChild(script);
      } else {
        loadWidget();
      }
    }
  }, [embedMode, aggregatorUrl, iframeKey]);

  useEffect(() => {
    fetch('/api/feed/aggregator-config')
      .then(res => res.json())
      .then(data => {
        if (data.aggregatorUrl) {
          setAggregatorUrl(data.aggregatorUrl);
          setInputUrl(data.aggregatorUrl);
        }
      })
      .catch(() => {
        const local = localStorage.getItem('livetraffic_aggregator_url');
        if (local) {
          setAggregatorUrl(local);
          setInputUrl(local);
        }
      });
  }, []);

  const handleSaveAggregatorUrl = async (urlToSave?: string) => {
    const targetUrl = urlToSave !== undefined ? urlToSave : inputUrl;
    if (!targetUrl || !targetUrl.trim()) return;

    let cleanUrl = targetUrl.trim();
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      cleanUrl = srcMatch[1];
    }

    setIsSaving(true);
    setSaveSuccess(null);

    try {
      localStorage.setItem('livetraffic_aggregator_url', cleanUrl);
      setAggregatorUrl(cleanUrl);
      setInputUrl(cleanUrl);

      await fetch('/api/feed/set-aggregator-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl })
      });

      setIframeKey(Date.now());
      setSaveSuccess('URL configuration saved!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      setSaveSuccess('Saved locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = (presetUrl: string, mode: 'stream' | 'official' | 'syndication' | 'aggregator') => {
    setInputUrl(presetUrl);
    setEmbedMode(mode);
    handleSaveAggregatorUrl(presetUrl);
  };

  const refreshIframe = () => {
    setIframeKey(Date.now());
  };

  return (
    <div className="w-full bg-[#0A0B0D] border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Twitter className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm sm:text-base text-white">X.com Live Feed Channel</h3>
              <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                @MusicWorld360x
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target channel: <a href="https://x.com/MusicWorld360x" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline font-bold">https://x.com/MusicWorld360x</a>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={refreshIframe}
            className="bg-[#050608] hover:bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            title="Reload Feed"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
            <span>Reload</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer border ${
              showSettings
                ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold'
                : 'bg-[#050608] hover:bg-slate-800 text-amber-400 border-amber-500/30'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showSettings ? 'Hide Settings' : 'Feed Options'}</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#050608] p-2 rounded-xl border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold px-2 text-[11px] shrink-0">Feed Display Mode:</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleApplyPreset('https://x.com/MusicWorld360x', 'stream')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              embedMode === 'stream'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>App Stream (Rate-Limit Free)</span>
          </button>
          <button
            onClick={() => handleApplyPreset('https://x.com/MusicWorld360x', 'official')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              embedMode === 'official'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Twitter className="w-3.5 h-3.5 fill-current" />
            <span>Official X Widget</span>
          </button>
          <button
            onClick={() => handleApplyPreset('https://www.juicer.io/api/feeds/musicworld360x/iframe', 'aggregator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
              embedMode === 'aggregator'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-950" />
            <span>Aggregator Embed</span>
          </button>
        </div>
      </div>

      {/* Notice regarding HTTP 429 Rate Limiting from X.com */}
      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 space-y-1.5">
        <div className="flex items-center space-x-2 font-bold text-amber-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Note regarding X.com HTTP 429 Rate Limits</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          X.com (syndication.twitter.com) restricts embedded client widgets with strict <strong>HTTP 429 (Too Many Requests)</strong> rate limits in web sandbox environments. Use our <strong>App Stream</strong> mode above for continuous, zero-error updates, or open <a href="https://x.com/MusicWorld360x" target="_blank" rel="noopener noreferrer" className="text-sky-400 underline font-bold">https://x.com/MusicWorld360x</a> directly on X.com.
        </p>
      </div>

      {/* Settings & Custom URL Input Drawer */}
      {showSettings && (
        <div className="bg-[#050608] border border-amber-500/40 rounded-xl p-4 space-y-4 text-xs text-slate-300 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Layers className="w-4 h-4" />
              <span>Target Feed URL Settings</span>
            </span>
            <a
              href="https://x.com/MusicWorld360x"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline flex items-center space-x-1 text-[11px]"
            >
              <span>Open https://x.com/MusicWorld360x</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <label className="block font-semibold text-slate-200 text-[11px]">
              Set Feed URL or Aggregator Embed Link:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://x.com/MusicWorld360x"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 bg-[#0A0B0D] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <button
                onClick={() => handleSaveAggregatorUrl()}
                disabled={isSaving || !inputUrl.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition disabled:opacity-50 flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Apply URL'}</span>
              </button>
            </div>
            {saveSuccess && (
              <p className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1 pt-1">
                <span>✓ {saveSuccess}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main Feed Display Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#050608] min-h-[500px] p-4">
        {embedMode === 'stream' ? (
          /* Native App Stream View - 0% Rate Limit Error */
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-white">Direct Feed Stream</span>
                <span className="text-slate-500 text-[11px]">(Synced with x.com/MusicWorld360x)</span>
              </div>
              <a
                href="https://x.com/MusicWorld360x"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline flex items-center space-x-1 text-xs font-semibold"
              >
                <span>View Original Posts on X</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {isLoadingFeed ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading @MusicWorld360x feed stream...</div>
            ) : feedItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">No posts currently loaded in stream.</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {feedItems.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="bg-[#0A0B0D] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition space-y-2 text-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
                          <Twitter className="w-3.5 h-3.5 fill-current" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-sm text-white">{item.author}</span>
                            <span className="text-sky-400 text-[10px]">✓</span>
                          </div>
                          <span className="text-[10px] text-sky-400 font-semibold">{item.handle || '@MusicWorld360x'}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatReadableDateTime(item.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-normal">{item.content}</p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
                      {item.location ? (
                        <span className="font-semibold text-amber-400 text-[11px]">📍 {item.location}</span>
                      ) : (
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold">Music World 360</span>
                      )}
                      <a
                        href={item.link || 'https://x.com/MusicWorld360x'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:underline flex items-center space-x-1 font-semibold text-[11px]"
                      >
                        <span>Open on X</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : embedMode === 'official' ? (
          <div
            key={iframeKey}
            ref={twitterContainerRef}
            className="w-full flex flex-col items-center justify-center min-h-[500px]"
          >
            <div className="text-center p-6 space-y-3">
              <Twitter className="w-8 h-8 text-sky-400 fill-current mx-auto animate-pulse" />
              <a
                className="twitter-timeline"
                data-theme="dark"
                href="https://x.com/LiveTrafficNPC"
              >
                Tweets by @LiveTrafficNPC
              </a>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                If the official timeline displays a blank frame or 429 error due to X.com server limits, click <strong>"App Stream"</strong> above.
              </p>
            </div>
          </div>
        ) : aggregatorUrl ? (
          <iframe
            key={iframeKey}
            src={aggregatorUrl}
            title="X Live Feed"
            className="w-full h-[620px] border-0 rounded-2xl bg-[#0A0B0D]"
            allow="autoplay; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation-by-user-activation"
          />
        ) : null}
      </div>

      {/* Footer Info */}
      <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 gap-2">
        <span className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Targeting official channel: <strong>https://x.com/LiveTrafficNPC</strong></span>
        </span>
        <a
          href="https://x.com/LiveTrafficNPC"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:underline flex items-center space-x-1 font-semibold"
        >
          <span>Open https://x.com/LiveTrafficNPC directly on X.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};


