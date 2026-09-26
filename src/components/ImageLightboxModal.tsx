import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  ExternalLink, 
  MapPin, 
  Clock, 
  Maximize2, 
  Minimize2,
  Share2,
  Copy,
  Check,
  Camera,
  Info
} from 'lucide-react';
import { formatReadableDateTime } from '../utils/dateParser';
import { cleanTrafficText } from '../utils/textSanitizer';

export interface ImageLightboxData {
  imageUrl: string;
  title?: string;
  location?: string;
  description?: string;
  timestamp?: number | string;
  category?: string;
  author?: string;
  source?: string;
}

interface ImageLightboxModalProps {
  data: ImageLightboxData | null;
  isOpen: boolean;
  onClose: () => void;
  onShareToWhatsApp?: (data: ImageLightboxData) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  data,
  isOpen,
  onClose,
  onShareToWhatsApp
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(true);

  // Reset controls when opened with new image
  useEffect(() => {
    if (isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setCopied(false);
    }
  }, [isOpen, data?.imageUrl]);

  // Keyboard navigation (Escape to close, +/- to zoom)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === '0') {
        setZoomLevel(1);
        setRotation(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !data || !data.imageUrl) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoomLevel(1);
    setRotation(0);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = data.imageUrl;
    a.download = `livetraffic-photo-${Date.now()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 backdrop-blur-md select-none animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Navigation Bar */}
      <div className="relative z-10 flex items-center justify-between px-3 sm:px-5 py-3 bg-slate-950/80 border-b border-slate-800/90 text-white">
        <div className="flex items-center space-x-2.5 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-md">
                {data.title || data.category || 'Incident Photo'}
              </span>
              {data.location && (
                <span className="hidden sm:inline-flex items-center space-x-1 text-[11px] text-amber-400/90 font-medium truncate max-w-xs">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{data.location}</span>
                </span>
              )}
            </div>
            {data.timestamp && (
              <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-mono">
                <Clock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>{formatReadableDateTime(data.timestamp)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2 py-1 text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
              title="Reset Zoom (0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-1.5 text-slate-300 hover:text-white disabled:opacity-30 transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`p-2 rounded-lg border transition cursor-pointer ${
              copied
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Copy Image Link"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={handleDownload}
            className="hidden xs:flex items-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
            title="Download Full Resolution"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Open original in new tab */}
          <a
            href={data.imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 hover:text-cyan-300 rounded-lg transition"
            title="Open Original in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg transition cursor-pointer shadow-md font-bold flex items-center space-x-1"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="text-xs hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div 
        className="relative flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 cursor-grab active:cursor-grabbing bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950/60 via-[#03060B] to-[#010204]"
        onClick={(e) => {
          // If clicked directly on the backdrop container, close modal
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          <img
            src={data.imageUrl}
            alt={data.title || 'Full Resolution Incident Photo'}
            className="max-h-[75vh] sm:max-h-[82vh] max-w-[95vw] w-auto h-auto object-contain rounded-xl shadow-2xl border border-slate-800/80 bg-black"
            draggable={false}
          />
        </div>

        {/* Quick mobile zoom overlay buttons */}
        <div className="sm:hidden absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="p-1 text-slate-300 active:text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-cyan-400 min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-1 text-slate-300 active:text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className="p-1 text-slate-300 active:text-white border-l border-slate-800 pl-2"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Info Bar / Description Drawer */}
      {(data.description || data.location || data.author) && (
        <div className="relative z-10 bg-slate-950/95 border-t border-slate-800/90 px-3 sm:px-5 py-2.5 text-xs text-slate-300">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              {data.location && (
                <div className="flex items-center space-x-1.5 text-amber-400 font-bold text-xs">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{data.location}</span>
                </div>
              )}
              {data.description && (
                <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                  {cleanTrafficText(data.description)}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 shrink-0 pt-1 sm:pt-0">
              {onShareToWhatsApp && (
                <button
                  type="button"
                  onClick={() => onShareToWhatsApp(data)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition cursor-pointer shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Photo</span>
                </button>
              )}
              <a
                href={data.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Size</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
