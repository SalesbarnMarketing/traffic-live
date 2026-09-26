import React, { useState } from 'react';
import { Camera, ZoomIn, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { ImageLightboxData } from './ImageLightboxModal';
import { isActualAttachedImage } from '../utils/categoryImageHelper';

interface IncidentImagePreviewProps {
  imageUrl?: string;
  title?: string;
  location?: string;
  description?: string;
  timestamp?: number | string;
  category?: string;
  onOpenLightbox: (data: ImageLightboxData) => void;
  variant?: 'inline-small' | 'row-thumb' | 'expanded-banner' | 'card-media';
  className?: string;
}

export const IncidentImagePreview: React.FC<IncidentImagePreviewProps> = ({
  imageUrl,
  title,
  location,
  description,
  timestamp,
  category,
  onOpenLightbox,
  variant = 'row-thumb',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!imageUrl || hasError || !isActualAttachedImage(imageUrl)) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenLightbox({
      imageUrl,
      title,
      location,
      description,
      timestamp,
      category
    });
  };

  // 1. Enlarged thumbnail for list / condensed rows (spans at least the first 3 badge/content lines)
  if (variant === 'row-thumb') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`group relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border-2 border-slate-700 hover:border-amber-400 bg-slate-950 transition-all duration-200 cursor-pointer shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${className}`}
        title="Click to view full incident photo"
      >
        <img
          src={imageUrl}
          alt={title || 'Incident Photo'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Subtle hover zoom overlay */}
        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
          <div className="bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-md">
            <ZoomIn className="w-3.5 h-3.5 font-bold" />
          </div>
        </div>

        {/* Camera badge with Photo label */}
        <div className="absolute bottom-1 right-1 bg-slate-950/90 text-amber-400 px-1.5 py-0.5 rounded-md text-[9px] font-bold flex items-center space-x-1 shadow border border-slate-800/80">
          <Camera className="w-3 h-3 text-amber-400" />
          <span className="text-[8px] uppercase tracking-wider font-mono">Photo</span>
        </div>
      </button>
    );
  }

  // 2. Inline Small Chip / Button (for tight compact spaces)
  if (variant === 'inline-small') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center space-x-1.5 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-md text-[10px] font-bold transition cursor-pointer shadow-sm ${className}`}
        title="View attached photo"
      >
        <Camera className="w-3 h-3 text-amber-400" />
        <span>Photo Attached</span>
        <ZoomIn className="w-2.5 h-2.5 text-amber-400/80" />
      </button>
    );
  }

  // 3. Expanded Banner (Inside expanded details drawer)
  if (variant === 'expanded-banner') {
    return (
      <div 
        onClick={handleClick}
        className={`group relative rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400/80 bg-slate-950 flex flex-col items-center justify-center my-2 transition-all duration-200 cursor-pointer shadow-lg max-h-80 ${className}`}
        title="Click to zoom and view full resolution photo"
      >
        {/* Aspect-safe container: uses object-contain so tall/portrait and ultra-wide images are NEVER cropped or distorted */}
        <div className="relative w-full flex items-center justify-center bg-black/80 p-1 max-h-72">
          <img
            src={imageUrl}
            alt={title || 'Incident Photo'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`max-h-72 w-auto max-w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.02] ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

        {/* Bottom helper pill */}
        <div className="w-full bg-slate-900/90 border-t border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300">
          <span className="flex items-center space-x-1.5 text-amber-400 font-bold">
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Incident Photo Attached</span>
          </span>
          <span className="flex items-center space-x-1 text-cyan-400 group-hover:text-cyan-300 font-bold bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full text-[10px]">
            <ZoomIn className="w-3 h-3" />
            <span>Click to View Full Size</span>
          </span>
        </div>
      </div>
    );
  }

  // 4. Card Media (For Detailed Card View)
  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-xl overflow-hidden border border-slate-800 hover:border-amber-400/80 bg-slate-950 flex flex-col items-center justify-center my-2.5 transition-all duration-200 cursor-pointer shadow-lg ${className}`}
      title="Click to zoom & view full resolution photo"
    >
      <div className="relative w-full flex items-center justify-center bg-black/80 p-1 max-h-80">
        <img
          src={imageUrl}
          alt={title || 'Incident Photo'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`w-full h-auto max-h-80 object-contain rounded-lg transition-transform duration-300 group-hover:scale-[1.01] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hover zoom badge overlay */}
        <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-bold shadow-xl flex items-center space-x-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <ZoomIn className="w-3.5 h-3.5 font-black" />
            <span>Open Lightbox</span>
          </div>
        </div>
      </div>

      <div className="w-full bg-slate-900/90 border-t border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300">
        <span className="flex items-center space-x-1.5 text-amber-400 font-bold">
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span>Incident Photo</span>
        </span>
        <span className="flex items-center space-x-1 text-cyan-400 font-bold text-[10px]">
          <ZoomIn className="w-3 h-3" />
          <span>Click to Zoom</span>
        </span>
      </div>
    </div>
  );
};
