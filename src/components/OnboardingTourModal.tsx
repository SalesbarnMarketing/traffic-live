import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Shield,
  Gauge,
  PhoneOff,
  Wine,
  Wrench,
  Eye,
  CheckCircle2,
  Car
} from 'lucide-react';
import { LiveTrafficLogo } from './LiveTrafficLogo';

interface OnboardingTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTourModal: React.FC<OnboardingTourModalProps> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const totalSlides = 3;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0D1422] border border-[#D4A237]/40 rounded-[36px] shadow-2xl shadow-black/80 overflow-hidden flex flex-col min-h-[580px] max-h-[92vh]">
        
        {/* Subtle Background Radial Gold Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#D4A237]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-10 px-6 pt-5 pb-2 flex items-center justify-between text-slate-300">
          {currentSlide > 0 ? (
            <button
              onClick={handlePrev}
              className="p-2 -ml-2 rounded-full hover:bg-slate-800/60 text-[#D4A237] transition cursor-pointer flex items-center space-x-1 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="text-[11px] font-black uppercase tracking-widest text-[#D4A237]">
              LIVE TRAFFIC NPC
            </div>
          )}

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Onboarding
          </div>

          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-700/60 cursor-pointer"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SLIDE CONTENT AREA */}
        <div className="flex-1 flex flex-col relative z-10">

          {/* SLIDE 0: DRIVE SAFELY (Seatbelt Focus) */}
          {currentSlide === 0 && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Upper Navy Icon Area with Official Logo */}
              <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-6 px-6">
                <div className="relative flex items-center justify-center">
                  <LiveTrafficLogo size="lg" showText={true} withGlow={true} animateBeacon={true} />
                </div>
              </div>

              {/* Lower Curved Ivory Card */}
              <div className="bg-[#FAF7F2] text-slate-900 rounded-t-[36px] px-6 pt-8 pb-7 flex flex-col items-center text-center shadow-2xl space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D1422] uppercase">
                  Drive Safely
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs leading-relaxed">
                  Your first step to a safer journey. Always wear your seatbelt and stay aware of your surroundings.
                </p>

                {/* Pagination Dots */}
                <div className="flex items-center space-x-2 py-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A237] shadow-sm"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>

                {/* Gold Pill Button */}
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-[#D4A237] via-[#D4A237] to-[#8E6516] hover:brightness-105 active:scale-98 text-slate-950 font-black text-sm uppercase py-3.5 px-6 rounded-full shadow-lg shadow-[#D4A237]/30 tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 1: RESPECT THE LIMIT (Speedometer Focus) */}
          {currentSlide === 1 && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Upper Navy Icon Area */}
              <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-6 px-6">
                <div className="relative">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-2xl shadow-[#D4A237]/30 relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#122033] border border-[#D4A237]/40 flex items-center justify-center text-[#D4A237]">
                      <Gauge className="w-10 h-10 sm:w-12 sm:h-12 text-[#D4A237]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Lower Curved Ivory Card */}
              <div className="bg-[#FAF7F2] text-slate-900 rounded-t-[36px] px-6 pt-8 pb-7 flex flex-col items-center text-center shadow-2xl space-y-4">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0D1422] uppercase">
                  Respect the Limit
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-xs leading-relaxed">
                  View speed data for your safety & speed tips. Stick to posted limits to prevent collisions.
                </p>

                {/* Pagination Dots */}
                <div className="flex items-center space-x-2 py-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A237] shadow-sm"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>

                {/* Gold Pill Button */}
                <button
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-[#D4A237] via-[#D4A237] to-[#8E6516] hover:brightness-105 active:scale-98 text-slate-950 font-black text-sm uppercase py-3.5 px-6 rounded-full shadow-lg shadow-[#D4A237]/30 tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          )}

          {/* SLIDE 2: TOGETHER, WE CAN CREATE SAFER ROADS (6-Badge Grid) */}
          {currentSlide === 2 && (
            <div className="flex-1 flex flex-col justify-between p-6 text-center">
              <div className="space-y-1 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4A237]">
                  Community Mission
                </h3>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  Together, we can create
                </h2>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#D4A237] uppercase drop-shadow-md">
                  SAFER ROADS
                </h1>
              </div>

              {/* 6 Circular Badge Icons */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 my-auto py-4">
                {/* 1. Buckle Up */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-lg text-[#D4A237] hover:scale-105 transition">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 leading-tight">
                    Buckle Up Every Time
                  </span>
                </div>

                {/* 2. Obey Limits */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-lg text-[#D4A237] hover:scale-105 transition">
                    <Gauge className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 leading-tight">
                    Obey Speed Limits
                  </span>
                </div>

                {/* 3. Avoid Distractions */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-lg text-[#D4A237] hover:scale-105 transition">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 leading-tight">
                    Avoid Distractions
                  </span>
                </div>

                {/* 4. Don't Drink & Drive */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-lg text-[#D4A237] hover:scale-105 transition">
                    <Wine className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 leading-tight">
                    Don't Drink & Drive
                  </span>
                </div>

                {/* 5. Maintain Vehicle */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-lg text-[#D4A237] hover:scale-105 transition">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 leading-tight">
                    Maintain Vehicle
                  </span>
                </div>

                {/* 6. Stay Alert */}
                <div className="flex flex-col items-center space-y-1.5">
                  <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-full border-2 border-[#D4A237] bg-[#090E17] flex items-center justify-center shadow-lg text-[#D4A237] hover:scale-105 transition">
                    <Eye className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 leading-tight">
                    Stay Alert & Report
                  </span>
                </div>
              </div>

              {/* Bottom Action & Pagination */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4A237] shadow-sm"></span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-[#D4A237] via-[#D4A237] to-[#8E6516] hover:brightness-105 active:scale-98 text-slate-950 font-black text-sm uppercase py-3.5 px-6 rounded-full shadow-lg shadow-[#D4A237]/30 tracking-wider flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <span>Continue</span>
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                </button>

                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                  Powered By Rik's Social Media Manager
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
