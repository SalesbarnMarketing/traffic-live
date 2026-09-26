import React, { useState, useEffect, useRef } from 'react';
import { IncidentReport, ReportType, SeverityLevel } from '../types';
import { X, Edit3, CheckCircle2, AlertTriangle, MapPin, Shield, Camera, Save, AlertOctagon, ChevronDown, Trash2, Upload, Sparkles, RefreshCw } from 'lucide-react';
import { getCategoryDefaultImage } from '../utils/categoryImageHelper';

interface EditIncidentModalProps {
  report: IncidentReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updatedFields: Partial<IncidentReport>, alsoApprove?: boolean) => Promise<void>;
  isPending?: boolean;
}

const COMMON_ROADS = [
  'N1 North', 'N1 South', 'N2 North', 'N2 South', 'N3 North', 'N3 South', 'N4 East', 'N4 West',
  'N7 North', 'N7 South',
  'N12 East', 'N12 West', 'N14 North', 'N14 South', 'M1 North', 'M1 South',
  'M2 East', 'M2 West', 'R21 North', 'R21 South', 'R24 West', 'R59 North', 'R59 South'
];

export const EditIncidentModal: React.FC<EditIncidentModalProps> = ({
  report,
  isOpen,
  onClose,
  onSave,
  isPending = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReportType>('hazard');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [roadName, setRoadName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number>(-26.0);
  const [longitude, setLongitude] = useState<number>(28.0);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (report) {
      setTitle(report.title || '');
      setDescription(report.description || '');
      setType(report.type || 'hazard');
      setSeverity(report.severity || 'medium');
      setRoadName(report.roadName || '');
      setLocationName(report.locationName || '');
      setLatitude(typeof report.latitude === 'number' ? report.latitude : -26.0);
      setLongitude(typeof report.longitude === 'number' ? report.longitude : 28.0);
      setImageUrl(report.imageUrl || '');
      setImageFileName(report.imageUrl ? 'current_photo.jpg' : '');
      setAdminNotes(report.adminNotes || '');
      setReporterName(report.reporterName || '');
      setReporterPhone(report.reporterPhone || '');
      setError(null);
    }
  }, [report]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image file is too large (max 8MB).');
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImageFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetCategoryDefault = () => {
    const defaultImg = getCategoryDefaultImage(type);
    setImageUrl(defaultImg);
    setImageFileName('Category Default Photo');
  };

  if (!isOpen || !report) return null;

  const handleSubmit = async (alsoApprove: boolean = false) => {
    if (!title.trim()) {
      setError('Please provide a report title.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide an incident description.');
      return;
    }
    if (!locationName.trim() && !roadName.trim()) {
      setError('Please provide a roadway or location name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(
        report.id,
        {
          title: title.trim(),
          description: description.trim(),
          type,
          severity,
          roadName: roadName.trim(),
          locationName: locationName.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          imageUrl: imageUrl.trim() || undefined,
          adminNotes: adminNotes.trim() || undefined,
          reporterName: reporterName.trim() || undefined,
          reporterPhone: reporterPhone.trim() || undefined
        },
        alsoApprove
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving incident report:', err);
      setError(err?.message || 'Failed to update report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[#0F1115] border border-amber-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#14120D] to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
                <span>Edit Incident Report & Fix Spelling</span>
                {isPending && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                    Pending Review
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Correct typos, refine location details, or adjust hazard classification before publishing.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center justify-between">
              <span>Incident Title</span>
              <span className="text-[11px] text-slate-500 font-normal">Clear headline for map and feeds</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spike Trap Discovered near Samrand Off-ramp"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Category & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Hazard Type / Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ReportType)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="crash">💥 Crash / Vehicle Collision</option>
                <option value="spiking">⚠️ Spiking Trap / Puncture Hazard</option>
                <option value="fatal_crash">💀 Fatal Crash / Major Fatal Collision</option>
                <option value="pothole">🔨 Pothole / Road Surface Damage</option>
                <option value="stationary">🚗 Stationary / Broken Down Vehicle</option>
                <option value="congestion">🚦 Traffic Congestion / Queue</option>
                <option value="veld_fire">🔥 Veld Fire / Smoke Hazard</option>
                <option value="hazard">⚡ General Road Hazard / Obstruction</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Severity Level</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400"
              >
                <option value="low">🟢 Low (Informational / Minor)</option>
                <option value="medium">🟡 Medium (Caution Advised)</option>
                <option value="high">🟠 High (Significant Danger / Lane Blocked)</option>
                <option value="critical">🔴 Critical (Immediate Threat / Road Closed)</option>
              </select>
            </div>
          </div>

          {/* Roadway & Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-300">Roadway Corridor</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g., N1 Southbound, R21, M1"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
              />
              <div className="relative pt-1">
                <select
                  value={COMMON_ROADS.includes(roadName) ? roadName : ""}
                  onChange={(e) => {
                    if (e.target.value) setRoadName(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none pr-8"
                >
                  <option value="">-- Select Quick Corridor --</option>
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
              <label className="font-bold text-slate-300">Location / Suburb / Landmark</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Samrand Ave Off-ramp, Midrand"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Description (Where typos and spelling mistakes happen) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 flex items-center space-x-1.5">
                <span>Incident Description & Details</span>
                <span className="text-[11px] text-amber-400 font-medium">(Fix spelling & grammar here)</span>
              </label>
              <span className="text-[10px] text-slate-500">Visible on public feeds & popups</span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clean, accurate, and properly punctuated description of the incident..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-white font-normal leading-relaxed focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* GPS Coordinates */}
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Map Coordinates (GPS Latitude & Longitude)</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Photo / Scene Evidence */}
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
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Scene Evidence Photo</span>
                <span className="text-[11px] text-slate-500 font-normal">(optional)</span>
              </label>

              <button
                type="button"
                onClick={handleSetCategoryDefault}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer transition"
                title="Use standard icon/photo for this category"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Category Default</span>
              </button>
            </div>

            {imageUrl ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-xl shadow-inner">
                <div className="flex items-center space-x-3 min-w-0">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-900"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-[200px] sm:max-w-xs">
                      {imageFileName || 'Incident Photo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer flex items-center space-x-1 mt-0.5"
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
                  className="py-3 px-4 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-950/60 hover:bg-amber-950/20 text-amber-300 text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Upload from device</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetCategoryDefault}
                  className="py-3 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Set category default</span>
                </button>
              </div>
            )}

            {/* URL input fallback */}
            <div className="pt-1">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImageFileName(e.target.value ? 'External Image URL' : '');
                }}
                placeholder="Or paste image URL (https://...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-[11px] focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Admin Internal Notes */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin / Patrol Dispatch Notes (Internal)</span>
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g., Patrol unit Sector 4 alerted; towing assistance dispatched."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Reporter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Reporter Name</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Reporter Phone</label>
              <input
                type="text"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition text-xs cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>

            {isPending && (
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial flex items-center justify-center space-x-1.5 bg-green-600 hover:bg-green-500 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-green-950/80 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing...' : 'Save & Approve Live'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
