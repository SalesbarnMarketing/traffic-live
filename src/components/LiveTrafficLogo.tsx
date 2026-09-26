import React, { useState } from 'react';

interface LiveTrafficLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  withGlow?: boolean;
  alt?: string;
  // Kept for backward compatibility if passed
  showText?: boolean;
  animateBeacon?: boolean;
}

export const LiveTrafficLogo: React.FC<LiveTrafficLogoProps> = ({
  size = 'md',
  className = '',
  withGlow = false,
  alt = 'Live Traffic NPC Official Crest Logo',
}) => {
  const [imgSrc, setImgSrc] = useState<string>('/traffic-logo.png');

  // Dimension presets maintaining natural crest proportions
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-11 h-11',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
    '2xl': 'w-48 h-48',
    custom: '',
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeClasses} ${className}`}>
      {withGlow && (
        <div className="absolute inset-0 bg-[#D4A237]/25 rounded-full blur-xl -z-10 pointer-events-none scale-110" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-contain rounded-xl drop-shadow-md"
        referrerPolicy="no-referrer"
        onError={() => {
          if (imgSrc === 'https://techrix365.com/test/traffic-logo.png') {
            setImgSrc('/traffic-logo.png');
          } else if (imgSrc !== '/traffic-logo.png') {
            setImgSrc('/traffic-logo.png');
          }
        }}
      />
    </div>
  );
};
