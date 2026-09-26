import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Ban, 
  CheckCircle2, 
  Tag, 
  Layers, 
  Share2, 
  Eye, 
  ToggleLeft, 
  ToggleRight, 
  HelpCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { SocialHashtagSettings, CustomKeywordTagRule } from '../types';
import { 
  DEFAULT_HASHTAG_SETTINGS, 
  getLocalSocialHashtagSettings, 
  saveLocalSocialHashtagSettings, 
  generateITrafficHashtags,
  toHashtag
} from '../utils/whatsappShare';

interface AdminHashtagSettingsProps {
  currentAdminEmail?: string;
}

export const AdminHashtagSettings: React.FC<AdminHashtagSettingsProps> = ({
  currentAdminEmail
}) => {
  const [settings, setSettings] = useState<SocialHashtagSettings>(() => getLocalSocialHashtagSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New tag input states
  const [newDefaultTag, setNewDefaultTag] = useState('');
  const [newExcludedTag, setNewExcludedTag] = useState('');
  const [newPresetTag, setNewPresetTag] = useState('');

  // New rule input state
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleTag, setNewRuleTag] = useState('');

  // Live Test Sandbox
  const [testRoadway, setTestRoadway] = useState('N1');
  const [testDirection, setTestDirection] = useState('Southbound');
  const [testLocation, setTestLocation] = useState('Allandale Rd interchange');
  const [testContent, setTestContent] = useState('Heavy traffic delays and lane restrictions due to Mother\'s Day market and roadworks.');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch settings from server on mount
  useEffect(() => {
    loadSettingsFromServer();
  }, []);

  const loadSettingsFromServer = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/hashtag-settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          saveLocalSocialHashtagSettings(data.settings);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server hashtag settings, using local:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (customSettingsToSave?: SocialHashtagSettings) => {
    const payload = customSettingsToSave || settings;
    setIsSaving(true);
    try {
      // 1. Save locally first
      saveLocalSocialHashtagSettings(payload);

      // 2. Persist to server
      const res = await fetch('/api/admin/hashtag-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload, updatedBy: currentAdminEmail || 'Admin' })
      });

      if (res.ok) {
        showNotification('success', 'Hashtag and broadcast settings saved successfully across all devices!');
      } else {
        showNotification('success', 'Settings saved locally on this browser.');
      }
    } catch (err) {
      showNotification('success', 'Settings saved locally on this browser.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all hashtag and broadcast settings back to standard defaults?')) {
      const defaultClone = JSON.parse(JSON.stringify(DEFAULT_HASHTAG_SETTINGS));
      setSettings(defaultClone);
      handleSaveSettings(defaultClone);
      showNotification('success', 'Hashtag settings reset to defaults.');
    }
  };

  // ---------------- DEFAULT TAGS HANDLERS ---------------- //
  const handleAddDefaultTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newDefaultTag.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!settings.defaultTags.includes(formatted)) {
      const updated = {
        ...settings,
        defaultTags: [...settings.defaultTags, formatted]
      };
      setSettings(updated);
      handleSaveSettings(updated);
      setNewDefaultTag('');
    } else {
      showNotification('error', 'Tag is already in the default list.');
    }
  };

  const handleRemoveDefaultTag = (tagToRemove: string) => {
    const updated = {
      ...settings,
      defaultTags: settings.defaultTags.filter(t => t !== tagToRemove)
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  // ---------------- EXCLUDED TAGS HANDLERS ---------------- //
  const handleAddExcludedTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newExcludedTag.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!settings.excludedTags.includes(formatted)) {
      const updated = {
        ...settings,
        excludedTags: [...settings.excludedTags, formatted]
      };
      setSettings(updated);
      handleSaveSettings(updated);
      setNewExcludedTag('');
    } else {
      showNotification('error', 'Tag is already in the excluded blacklist.');
    }
  };

  const handleRemoveExcludedTag = (tagToRemove: string) => {
    const updated = {
      ...settings,
      excludedTags: settings.excludedTags.filter(t => t !== tagToRemove)
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  // ---------------- QUICK ADD PRESETS HANDLERS ---------------- //
  const handleAddPresetTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newPresetTag.trim();
    if (!clean) return;
    const formatted = clean.startsWith('#') ? clean : `#${clean}`;
    if (!settings.quickAddPresets.includes(formatted)) {
      const updated = {
        ...settings,
        quickAddPresets: [...settings.quickAddPresets, formatted]
      };
      setSettings(updated);
      handleSaveSettings(updated);
      setNewPresetTag('');
    } else {
      showNotification('error', 'Preset is already in the quick library.');
    }
  };

  const handleRemovePresetTag = (presetToRemove: string) => {
    const updated = {
      ...settings,
      quickAddPresets: settings.quickAddPresets.filter(p => p !== presetToRemove)
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  // ---------------- KEYWORD RULES HANDLERS ---------------- //
  const handleAddKeywordRule = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = newRuleKeyword.trim();
    const tg = newRuleTag.trim();
    if (!kw || !tg) {
      showNotification('error', 'Please provide both keyword and target hashtag.');
      return;
    }

    const formattedTag = tg.startsWith('#') ? tg : `#${tg}`;
    const newRule: CustomKeywordTagRule = {
      id: `kw-${Date.now()}`,
      keyword: kw,
      tag: formattedTag,
      enabled: true
    };

    const updated = {
      ...settings,
      customKeywordRules: [...settings.customKeywordRules, newRule]
    };
    setSettings(updated);
    handleSaveSettings(updated);
    setNewRuleKeyword('');
    setNewRuleTag('');
    showNotification('success', `Added keyword trigger: "${kw}" -> ${formattedTag}`);
  };

  const handleToggleKeywordRule = (id: string) => {
    const updated = {
      ...settings,
      customKeywordRules: settings.customKeywordRules.map(r => 
        r.id === id ? { ...r, enabled: !r.enabled } : r
      )
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  const handleDeleteKeywordRule = (id: string) => {
    const updated = {
      ...settings,
      customKeywordRules: settings.customKeywordRules.filter(r => r.id !== id)
    };
    setSettings(updated);
    handleSaveSettings(updated);
  };

  // Calculate live test results based on current settings
  const simulatedTags = generateITrafficHashtags({
    roadwayName: testRoadway,
    direction: testDirection,
    location: testLocation,
    content: testContent
  }, settings);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start space-x-4 min-w-0">
            <div className="p-3.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-2xl shrink-0 shadow-lg shadow-amber-500/10">
              <Hash className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Hashtag & Social Broadcast Configuration
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Live Dispatch
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Control auto-generated #tags, configure seasonal event tags (like <span className="text-emerald-400 font-mono font-bold">#MothersDay</span>), remove or blacklist unwanted tags (like <span className="text-red-400 font-mono font-bold">#delays</span> or <span className="text-red-400 font-mono font-bold">#Gauteng</span>), and curate 1-click quick presets for WhatsApp & X channels.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition cursor-pointer flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className={`mt-5 p-3.5 rounded-xl border text-xs font-bold flex items-center space-x-2.5 animate-fadeIn ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{notification.message}</span>
          </div>
        )}
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SECTION 1: GLOBAL DEFAULT HASHTAGS */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Global Default #Tags
                </h4>
                <p className="text-[11px] text-slate-400">
                  Always included automatically on every broadcast alert
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {settings.defaultTags.length} active
            </span>
          </div>

          {/* Active Tags Chips */}
          <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3.5 min-h-[90px] flex flex-wrap gap-2 items-start content-start">
            {settings.defaultTags.length === 0 ? (
              <span className="text-xs text-slate-500 italic p-1">No default tags set. Add one below.</span>
            ) : (
              settings.defaultTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm group hover:border-red-500/50 hover:bg-red-500/10 transition"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDefaultTag(tag)}
                    title={`Remove ${tag} from defaults`}
                    className="text-emerald-400 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Tag Form */}
          <form onSubmit={handleAddDefaultTag} className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newDefaultTag}
                onChange={(e) => setNewDefaultTag(e.target.value)}
                placeholder="e.g. MothersDay, RoadSafety, EasterWeekend"
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shrink-0 shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Tag</span>
            </button>
          </form>
        </div>

        {/* SECTION 2: EXCLUDED / BLACKLISTED HASHTAGS */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-xl">
                <Ban className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Excluded / Blocked #Tags
                </h4>
                <p className="text-[11px] text-slate-400">
                  Strictly suppress & remove these tags from all auto-generation
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
              {settings.excludedTags.length} blocked
            </span>
          </div>

          {/* Active Blocked Chips */}
          <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3.5 min-h-[90px] flex flex-wrap gap-2 items-start content-start">
            {settings.excludedTags.length === 0 ? (
              <span className="text-xs text-slate-500 italic p-1">No tags are currently blocked. Everything generates normally.</span>
            ) : (
              settings.excludedTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-red-500/15 border border-red-500/40 text-red-300 font-mono text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm group hover:border-emerald-500/50 transition"
                >
                  <span className="line-through">{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExcludedTag(tag)}
                    title={`Unblock ${tag}`}
                    className="text-red-400 hover:text-emerald-400 p-0.5 rounded transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Add Excluded Tag Form */}
          <form onSubmit={handleAddExcludedTag} className="flex gap-2">
            <div className="relative flex-1">
              <Ban className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newExcludedTag}
                onChange={(e) => setNewExcludedTag(e.target.value)}
                placeholder="e.g. Gauteng, delays, TrafficDelay"
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shrink-0 shadow-md shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Block Tag</span>
            </button>
          </form>
        </div>

        {/* SECTION 3: 1-CLICK QUICK PRESETS LIBRARY */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  1-Click Quick-Add Presets
                </h4>
                <p className="text-[11px] text-slate-400">
                  Visible as quick clickable buttons inside the WhatsApp & X share windows
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
              {settings.quickAddPresets.length} presets
            </span>
          </div>

          <div className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-3.5 min-h-[90px] flex flex-wrap gap-2 items-start content-start">
            {settings.quickAddPresets.map((preset) => (
              <span
                key={preset}
                className="bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold px-2.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                <span>{preset}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePresetTag(preset)}
                  title={`Remove ${preset} from presets`}
                  className="text-amber-400 hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddPresetTag} className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newPresetTag}
                onChange={(e) => setNewPresetTag(e.target.value)}
                placeholder="e.g. MothersDay, FestiveSeason, ProtestAction"
                className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition flex items-center space-x-1 cursor-pointer shrink-0 shadow-md shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Preset</span>
            </button>
          </form>
        </div>

        {/* SECTION 4: TOGGLES & AUTOMATION CONTROLS */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Automated Corridor & Landmark Rules
              </h4>
              <p className="text-[11px] text-slate-400">
                Control auto-tagging engines for roadways and Gauteng landmarks
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-[#0A0B0D] border border-slate-800 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-white block">Auto-Tag Roadway Corridors</span>
                <span className="text-[10px] text-slate-400 block">Detects roads like #N1, #N1North, #N3, #R21, #M1</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...settings, autoTagCorridors: !settings.autoTagCorridors };
                  setSettings(updated);
                  handleSaveSettings(updated);
                }}
                className={`p-1 rounded-xl transition cursor-pointer ${settings.autoTagCorridors ? 'text-emerald-400' : 'text-slate-600'}`}
              >
                {settings.autoTagCorridors ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#0A0B0D] border border-slate-800 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-white block">Auto-Tag Gauteng Landmarks</span>
                <span className="text-[10px] text-slate-400 block">Detects nodes like #Allandale, #Buccleuch, #Gilloolys, #Centurion</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...settings, autoTagLandmarks: !settings.autoTagLandmarks };
                  setSettings(updated);
                  handleSaveSettings(updated);
                }}
                className={`p-1 rounded-xl transition cursor-pointer ${settings.autoTagLandmarks ? 'text-emerald-400' : 'text-slate-600'}`}
              >
                {settings.autoTagLandmarks ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 5: KEYWORD TRIGGER RULES */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded-2xl">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-white tracking-tight">
                Intelligent Keyword-to-Tag Triggers
              </h4>
              <p className="text-xs text-slate-400">
                Whenever report details, alerts, or road names contain a keyword, the corresponding tag will be attached automatically.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30 self-start sm:self-auto">
            {settings.customKeywordRules.length} rules active
          </span>
        </div>

        {/* Existing Rules List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {settings.customKeywordRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                rule.enabled 
                  ? 'bg-[#0A0B0D] border-slate-800 hover:border-purple-500/40' 
                  : 'bg-[#0A0B0D]/50 border-slate-900 opacity-60'
              }`}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">contains:</span>
                  <span className="text-xs font-extrabold text-white font-mono bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 truncate">
                    "{rule.keyword}"
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">tags:</span>
                  <span className="text-xs font-bold text-purple-300 font-mono">
                    {rule.tag}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleKeywordRule(rule.id)}
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${rule.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {rule.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteKeywordRule(rule.id)}
                  title="Delete rule"
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add New Rule Form */}
        <form onSubmit={handleAddKeywordRule} className="bg-[#0A0B0D] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-end gap-3.5">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              When Text / Road Contains Keyword
            </label>
            <input
              type="text"
              required
              value={newRuleKeyword}
              onChange={(e) => setNewRuleKeyword(e.target.value)}
              placeholder="e.g. mother, mothers day, storm, protest, diesel"
              className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Automatically Attach Hashtag
            </label>
            <input
              type="text"
              required
              value={newRuleTag}
              onChange={(e) => setNewRuleTag(e.target.value)}
              placeholder="e.g. #MothersDay, #SevereStorm, #DieselSpill"
              className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full md:w-auto bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer shrink-0 shadow-lg shadow-purple-600/20 h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </form>
      </div>

      {/* SECTION 6: LIVE INTERACTIVE TEST SANDBOX */}
      <div className="bg-[#0F1115] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-2xl">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-extrabold text-white tracking-tight">
              Live Real-Time Simulation Sandbox
            </h4>
            <p className="text-xs text-slate-400">
              Test how your current hashtag rules, default tags, and exclusions will render on live broadcasts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Inputs */}
          <div className="space-y-3.5 bg-[#0A0B0D] border border-slate-800 p-4 sm:p-5 rounded-2xl">
            <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block mb-1">
              Simulated Incident Details
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Roadway
                </label>
                <input
                  type="text"
                  value={testRoadway}
                  onChange={(e) => setTestRoadway(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Direction
                </label>
                <input
                  type="text"
                  value={testDirection}
                  onChange={(e) => setTestDirection(e.target.value)}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Location Landmark
              </label>
              <input
                type="text"
                value={testLocation}
                onChange={(e) => setTestLocation(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Alert Description
              </label>
              <textarea
                rows={3}
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Generated Result */}
          <div className="space-y-3.5 bg-[#0A0B0D] border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                  Generated #Tags Output ({simulatedTags.length})
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Real-time dynamic result</span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 bg-[#0F1115] border border-slate-800 rounded-xl min-h-[70px]">
                {simulatedTags.map(tag => (
                  <span
                    key={tag}
                    className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold px-2.5 py-1 rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Formatted Broadcast Preview:
              </span>
              <div className="bg-[#0F1115] border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                {`*🚨 TRAFFIC ALERT | LiveTrafficNPC*\n📍 *Roadway:* ${testRoadway} (${testDirection})\n📌 *Location:* ${testLocation}\n📝 *Details:* ${testContent}\n\n${simulatedTags.join(' ')}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
