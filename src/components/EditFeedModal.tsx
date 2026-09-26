import React, { useState, useEffect, useRef } from 'react';
import { FeedItem } from '../types';
import { X, Edit3, Save, AlertTriangle, Radio, MapPin, Camera, Sparkles, CheckCircle2, ChevronDown, Trash2, Upload } from 'lucide-react';
import { SA_REGIONS, SARegionId } from '../utils/regionUtils';
import { getCategoryDefaultImage } from '../utils/categoryImageHelper';

interface EditFeedModalProps {
  feedItem: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updatedFields: Partial<FeedItem>) => Promise<void>;
}

const COMMON_ROADS = [
  'N1', 'N1 North', 'N1 South', 'N2', 'N2 North', 'N2 South', 'N3', 'N3 North', 'N3 South', 'N4', 'N4 East', 'N4 West',
  'N7', 'N7 North', 'N7 South', 'N12', 'N14', 'M1', 'M2', 'R21', 'R24', 'R59', 'R55', 'R101', 'R28'
];

/**
 * Automatically detects South African highway corridors from feed content/text or location strings
 * If no specific corridor is mentioned, returns an empty string (never hardcoded to N1).
 */
export function detectRoadwayFromText(content?: string, location?: string): string {
  const combined = `${location || ''} ${content || ''}`.trim();
  if (!combined) return '';

  // 1. Check for directional highways (e.g. N3 Northbound, N1 South, N4 Westbound, R21 North)
  const dirMatch = combined.match(/\b(N1|N2|N3|N4|N5|N6|N7|N8|N10|N11|N12|N14|N17|N18|M1|M2|M3|M4|M5|M7|M13|M19|R21|R24|R59|R55|R28|R71|R81|R300|R101|R102|R103)\s*(Northbound|Southbound|Eastbound|Westbound|North|South|East|West|NB|SB|EB|WB)\b/i);
  if (dirMatch) {
    const road = dirMatch[1].toUpperCase();
    let dir = dirMatch[2].toLowerCase();
    if (dir.startsWith('n')) dir = 'North';
    else if (dir.startsWith('s')) dir = 'South';
    else if (dir.startsWith('e')) dir = 'East';
    else if (dir.startsWith('w')) dir = 'West';
    return `${road} ${dir}`;
  }

  // 2. Check for standard highway / route numbers (e.g. N3, N1, N12, R21, M1, etc.)
  const roadMatch = combined.match(/\b(N1|N2|N3|N4|N5|N6|N7|N8|N10|N11|N12|N14|N17|N18|M1|M2|M3|M4|M5|M7|M13|M19|R21|R24|R59|R55|R28|R71|R81|R300|R101|R102|R103)\b/i);
  if (roadMatch) {
    return roadMatch[1].toUpperCase();
  }

  return '';
}

export const EditFeedModal: React.FC<EditFeedModalProps> = ({
  feedItem,
  isOpen,
  onClose,
  onSave
}) => {
  const [content, setContent] = useState('');
  const [roadwayName, setRoadwayName] = useState('');
  const [location, setLocation] = useState('');
  const [eventSubType, setEventSubType] = useState('');
  const [category, setCategory] = useState<string>('spiking');
  const [region, setRegion] = useState<string>('gauteng');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFileName, setMediaFileName] = useState('');
  const [author, setAuthor] = useState('');
  const [handle, setHandle] = useState('');
  const [broadcastTopRed, setBroadcastTopRed] = useState(false);
  const [highlightGold, setHighlightGold] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (feedItem) {
      setContent(feedItem.content || '');

      // Resolve Roadway Corridor:
      // If roadwayName is explicitly provided and not a generic placeholder, use it.
      // Otherwise, attempt to detect from post text (e.g. N3 in content).
      // If no location/corridor was set and none found in text, leave completely blank!
      let resolvedRoadway = '';
      if (feedItem.roadwayName && feedItem.roadwayName !== 'No Location Selected' && feedItem.roadwayName !== 'Gauteng Highway Corridor') {
        resolvedRoadway = feedItem.roadwayName;
      } else {
        resolvedRoadway = detectRoadwayFromText(feedItem.content, feedItem.location);
      }
      setRoadwayName(resolvedRoadway);

      // Clean location (remove any 'No Location Selected' placeholder)
      const rawLoc = feedItem.location || '';
      const cleanLoc = (rawLoc === 'No Location Selected' || rawLoc === 'General Advisory (No Location Selected)') ? '' : rawLoc;
      setLocation(cleanLoc);

      setEventSubType(feedItem.eventSubType || '');
      setCategory(feedItem.category || 'spiking');
      setRegion(feedItem.region || 'gauteng');
      const initialMedia = feedItem.mediaUrl || feedItem.imageUrl || '';
      setMediaUrl(initialMedia);
      setMediaFileName(initialMedia ? 'feed_photo.jpg' : '');
      setAuthor(feedItem.author || (feedItem.source === 'admin_dispatch' ? '🛡️ Admin post' : 'Community Reporter'));
      setHandle(feedItem.handle || (feedItem.source === 'admin_dispatch' ? '@Admin' : '@Reporter'));
      setBroadcastTopRed(Boolean(feedItem.broadcastTopRed));
      setHighlightGold(Boolean(feedItem.highlightGold));
      setError(null);
    }
  }, [feedItem]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file is too large (max 15MB).');
      return;
    }

    setMediaFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 1024;
        const maxHeight = 1024;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setMediaUrl(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          setMediaUrl(event.target?.result as string);
        }
      };
      img.onerror = () => {
        setMediaUrl(event.target?.result as string);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setMediaUrl('');
    setMediaFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetCategoryDefault = () => {
    const defaultImg = getCategoryDefaultImage(category);
    setMediaUrl(defaultImg);
    setMediaFileName('Category Default Photo');
  };

  if (!isOpen || !feedItem) return null;

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please provide content for this feed post.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalMedia = mediaUrl ? mediaUrl.trim() : '';
      const nowIso = new Date().toISOString();
      const cleanRoad = roadwayName.trim();
      const cleanLoc = location.trim();
      
      await onSave(feedItem.id, {
        content: content.trim(),
        roadwayName: cleanRoad && cleanRoad !== 'No Location Selected' ? cleanRoad : undefined,
        location: cleanLoc && cleanLoc !== 'No Location Selected' ? cleanLoc : undefined,
        eventSubType: eventSubType.trim() || undefined,
        category: category.trim() || undefined,
        region: region.trim() || undefined,
        mediaUrl: finalMedia,
        imageUrl: finalMedia,
        timestamp: nowIso,
        lastUpdated: nowIso,
        author: author.trim() || undefined,
        handle: handle.trim() || undefined,
        broadcastTopRed,
        highlightGold
      });
      onClose();
    } catch (err: any) {
      console.error('Error updating feed post:', err);
      setError(err?.message || 'Failed to update feed post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#0F1115] border border-cyan-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0A121E] to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Edit Live Feed Post</span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Admin Editor
                </span>
              </h3>
              <p className="text-xs text-slate-400">Fix spelling, update highway alerts, or refine location info on feeds.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Feed Content Text (Fix typos) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>Feed Post Text / Alert Message</span>
              <span className="text-[11px] text-cyan-400 font-medium">(Fix spelling, typos, and details)</span>
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g. CAUTION: Multiple vehicles targeted with spikes on N1 North past Samrand. SAPS Highway Patrol on scene."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white font-normal leading-relaxed focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Roadway & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300">Roadway Corridor</label>
                {roadwayName && (
                  <button
                    type="button"
                    onClick={() => setRoadwayName('')}
                    className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    Clear Road
                  </button>
                )}
              </div>
              <input
                type="text"
                value={roadwayName}
                onChange={(e) => setRoadwayName(e.target.value)}
                placeholder="e.g. N3 North, N1, R21 (or blank)"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 placeholder:font-normal"
              />
              <div className="relative pt-1">
                <select
                  value={COMMON_ROADS.includes(roadwayName) ? roadwayName : ""}
                  onChange={(e) => {
                    setRoadwayName(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer appearance-none pr-8"
                >
                  <option value="">-- Select Quick Corridor (Optional) --</option>
                  {COMMON_ROADS.map((r) => (
                    <option key={r} value={r} className="bg-slate-900 text-white">
                      🛣️ {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-[14px] pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300">Specific Location / Interchange</label>
                <button
                  type="button"
                  onClick={() => {
                    setRoadwayName('');
                    setLocation('');
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  Clear (No Location)
                </button>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Linksfield Rd Off-ramp, JHB (or blank)"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Category, SubType & Province */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                <option value="spiking">Spiking Hazard</option>
                <option value="crash">Crash / Collision</option>
                <option value="traffic">Heavy Traffic</option>
                <option value="pothole">Pothole Hazard</option>
                <option value="stationary">Stationary Vehicle</option>
                <option value="roadworks">Roadworks / Construction</option>
                <option value="hazard">General Hazard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Badge SubType</label>
              <input
                type="text"
                value={eventSubType}
                onChange={(e) => setEventSubType(e.target.value)}
                placeholder="e.g. Spike Trap Warning"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Region / Province</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-2 text-white font-medium focus:outline-none focus:border-cyan-400"
              >
                {Object.entries(SA_REGIONS).map(([key, reg]) => (
                  <option key={key} value={key}>{reg.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Photo / Media */}
          <div className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-2.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Proof / Scene Photo</span>
                <span className="text-[11px] text-slate-500 font-normal">(optional)</span>
              </label>

              <button
                type="button"
                onClick={handleSetCategoryDefault}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer transition"
                title="Fill with standard category default photo"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Category Default</span>
              </button>
            </div>

            {mediaUrl ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-[200px] sm:max-w-xs">
                      {mediaFileName || 'Feed Image'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center space-x-1 mt-0.5"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Change / Upload new photo</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg cursor-pointer transition"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-cyan-400 bg-slate-950/60 hover:bg-cyan-950/20 text-cyan-300 text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Upload from device</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetCategoryDefault}
                  className="py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Set category default</span>
                </button>
              </div>
            )}

            {/* URL input fallback */}
            <div className="pt-1">
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => {
                  setMediaUrl(e.target.value);
                  setMediaFileName(e.target.value ? 'External Image URL' : '');
                }}
                placeholder="Or paste image URL (https://...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Author & Handle Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Author Label</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Handle / Tag</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Admin Priority & Broadcast Display Options */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Admin Broadcast & Highlight Options</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">STAFF PRIORITY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Broadcast on Top Red */}
              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                broadcastTopRed
                  ? 'bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={broadcastTopRed}
                  onChange={(e) => setBroadcastTopRed(e.target.checked)}
                  className="mt-0.5 rounded border-red-600 text-red-600 focus:ring-red-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-red-400 flex items-center space-x-1">
                    <span>🔴 Broadcast on Top Red</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Shows in red broadcast bar on top of live feed. Click directs straight to post.
                  </p>
                </div>
              </label>

              {/* Highlight with Gold Ring */}
              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                highlightGold
                  ? 'bg-amber-950/40 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={highlightGold}
                  onChange={(e) => setHighlightGold(e.target.checked)}
                  className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-900 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-400 flex items-center space-x-1">
                    <span>🟡 Post Highlight (Gold Ring)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Yellow/gold ring around post card and automatically pinned as first post for this area.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-lg transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Feed Post Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
