import React, { useState, useRef, useEffect } from 'react';
import { EmergencySOS, RegisteredUser } from '../types';
import { formatReadableDateTime } from '../utils/dateParser';
import { verifyUserLocation, getLastKnownUserPosition, getExactDeviceGps } from '../utils/locationChecker';
import { reverseGeocodeLocation } from '../utils/routeUtils';
import {
  AlertOctagon,
  X,
  PhoneCall,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  Car,
  Compass,
  ChevronDown,
  Check,
  Shield,
  Stethoscope,
  Truck,
  Clock,
  HeartHandshake
} from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSOS: (sosData: Partial<EmergencySOS>) => Promise<void>;
  currentUser?: RegisteredUser | null;
  prefilledType?: EmergencySOS['emergencyType'];
  prefilledNotes?: string;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  onSubmitSOS,
  currentUser,
  prefilledType,
  prefilledNotes
}) => {
  const [name, setName] = useState(currentUser ? `${currentUser.fullName} ${currentUser.surname}` : '');
  const [phone, setPhone] = useState(currentUser ? currentUser.cellNumber : '');
  const [vehicleInfo, setVehicleInfo] = useState('');
  // Default to Police so one doesn't have to scroll or hunt for police
  const [emergencyType, setEmergencyType] = useState<EmergencySOS['emergencyType']>(prefilledType || 'crime_threat');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ordered so Police is the 1st option, followed by GBV Assist, Ambulance, Spiking, Towing
  const emergencyOptions = [
    {
      id: 'crime_threat',
      label: 'SAPS Police & Security',
      subtitle: 'Hijacking, armed threat, patrol assist requested',
      badge: 'POLICE DISPATCH',
      icon: Shield,
      theme: 'blue',
      color: 'from-blue-600 to-sky-600',
      activeBorder: 'border-sky-500 shadow-sky-950/50',
      badgeBg: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
      activeBg: 'bg-blue-600/20 text-white border-blue-500'
    },
    {
      id: 'gbv_assist',
      label: 'GBV / Gender-Based Violence Assist',
      subtitle: 'Confidential emergency help, domestic safety, urgent patrol escort',
      badge: 'GBV RAPID ASSIST',
      icon: HeartHandshake,
      theme: 'purple',
      color: 'from-purple-600 to-fuchsia-600',
      activeBorder: 'border-purple-500 shadow-purple-950/50',
      badgeBg: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
      activeBg: 'bg-purple-600/20 text-white border-purple-500'
    },
    {
      id: 'crash',
      label: 'Ambulance / Medical Rescue',
      subtitle: 'Collision injuries, paramedic & trauma rescue',
      badge: 'MEDICAL DISPATCH',
      icon: Stethoscope,
      theme: 'green',
      color: 'from-emerald-600 to-green-600',
      activeBorder: 'border-emerald-500 shadow-emerald-950/50',
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      activeBg: 'bg-emerald-600/20 text-white border-emerald-500'
    },
    {
      id: 'spiking_puncture',
      label: 'Spike Trap / Puncture',
      subtitle: 'Tires damaged by highway spikes or road traps',
      badge: 'HOTSPOT DISPATCH',
      icon: AlertOctagon,
      theme: 'red',
      color: 'from-red-600 to-rose-700',
      activeBorder: 'border-red-500 shadow-red-950/50',
      badgeBg: 'bg-red-950/80 text-red-300 border-red-500/50',
      activeBg: 'bg-red-600/20 text-white border-red-500'
    },
    {
      id: 'breakdown',
      label: 'Highway Tow / Breakdown',
      subtitle: 'Mechanical stall, flat tire, roadside towing assist',
      badge: 'TOW TRUCK ASSIST',
      icon: Truck,
      theme: 'orange',
      color: 'from-orange-600 to-amber-600',
      activeBorder: 'border-orange-500 shadow-orange-950/50',
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
      activeBg: 'bg-orange-600/20 text-white border-orange-500'
    }
  ];

  const selectedOption = emergencyOptions.find(o => o.id === emergencyType) || emergencyOptions[0];

  // Derive dynamic color schemes based on the selected emergency type
  const getDynamicStyles = () => {
    switch (selectedOption.theme) {
      case 'purple':
        return {
          modalBorder: 'border-2 border-purple-500/80 shadow-purple-950/70',
          headerBg: 'bg-gradient-to-r from-purple-800 via-fuchsia-700 to-purple-700',
          headerTitle: 'GBV & Vulnerable Motorist Emergency Assist',
          headerSub: 'Confidential Priority Dispatch & GBV Command Centre Assistance',
          btnGradient: 'bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-700 hover:from-purple-600 hover:to-fuchsia-500 text-white shadow-purple-900/50',
          accentText: 'text-purple-400',
          accentBorder: 'border-purple-500/40',
          highlightBox: 'bg-purple-950/30 border-purple-500/40',
          badgeText: 'bg-purple-950/90 text-purple-300 border-purple-500/60'
        };
      case 'blue':
        return {
          modalBorder: 'border-2 border-sky-500/80 shadow-sky-950/70',
          headerBg: 'bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600',
          headerTitle: 'SAPS Police & Security Dispatch',
          headerSub: 'Direct Alert to Active Patrols & Law Enforcement',
          btnGradient: 'bg-gradient-to-r from-blue-700 via-blue-600 to-sky-600 hover:from-blue-600 hover:to-sky-500 text-white shadow-blue-900/50',
          accentText: 'text-sky-400',
          accentBorder: 'border-sky-500/40',
          highlightBox: 'bg-sky-950/30 border-sky-500/40',
          badgeText: 'bg-blue-950/90 text-blue-300 border-blue-500/60'
        };
      case 'green':
        return {
          modalBorder: 'border-2 border-emerald-500/80 shadow-emerald-950/70',
          headerBg: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600',
          headerTitle: 'Emergency Medical & Ambulance',
          headerSub: 'Urgent Dispatch for Paramedics & Trauma Care',
          btnGradient: 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white shadow-emerald-900/50',
          accentText: 'text-emerald-400',
          accentBorder: 'border-emerald-500/40',
          highlightBox: 'bg-emerald-950/30 border-emerald-500/40',
          badgeText: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
        };
      case 'red':
        return {
          modalBorder: 'border-2 border-red-600/80 shadow-red-950/70',
          headerBg: 'bg-gradient-to-r from-red-700 via-red-600 to-rose-600',
          headerTitle: 'Spike Trap Emergency Response',
          headerSub: 'Rapid Response to Spiked Highway Hotspots',
          btnGradient: 'bg-gradient-to-r from-red-700 via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white shadow-red-900/50',
          accentText: 'text-red-400',
          accentBorder: 'border-red-500/40',
          highlightBox: 'bg-red-950/30 border-red-500/40',
          badgeText: 'bg-red-950/90 text-red-300 border-red-500/60'
        };
      case 'orange':
      default:
        return {
          modalBorder: 'border-2 border-orange-500/80 shadow-orange-950/70',
          headerBg: 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600',
          headerTitle: 'Highway Tow & Breakdown Dispatch',
          headerSub: 'Roadside Recovery & Tow Truck Assistance',
          btnGradient: 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-900/50',
          accentText: 'text-amber-400',
          accentBorder: 'border-orange-500/40',
          highlightBox: 'bg-orange-950/30 border-orange-500/40',
          badgeText: 'bg-amber-950/90 text-amber-300 border-orange-500/60'
        };
    }
  };

  const themeStyles = getDynamicStyles();

  const initialPos = getLastKnownUserPosition();
  const [locationName, setLocationName] = useState(
    initialPos ? `GPS Position: ${initialPos.latitude.toFixed(5)}, ${initialPos.longitude.toFixed(5)}` : 'Detecting road & GPS...'
  );
  const [latitude, setLatitude] = useState(initialPos ? initialPos.latitude : -25.7479);
  const [longitude, setLongitude] = useState(initialPos ? initialPos.longitude : 28.2293);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(initialPos?.accuracy || null);
  const [isLocating, setIsLocating] = useState(false);
  const [notes, setNotes] = useState(prefilledNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<EmergencySOS | null>(null);

  const applyCoordinates = async (lat: number, lng: number, acc: number | null) => {
    setLatitude(lat);
    setLongitude(lng);
    setGpsAccuracy(acc);

    let resolvedRoad = '';
    try {
      const geo = await reverseGeocodeLocation(lat, lng);
      if (geo && geo.success) {
        resolvedRoad = geo.road || geo.locationName || '';
      }
    } catch (e) {
      console.debug('Reverse geocode error:', e);
    }

    if (resolvedRoad) {
      setLocationName(`${resolvedRoad} (GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } else {
      setLocationName(`GPS Position: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  const fetchAccurateGps = async () => {
    setIsLocating(true);
    try {
      // Use the exact same high-accuracy -> standard -> cached GPS flow as the interactive map
      const fix = await getExactDeviceGps({ timeout: 10000, forceFresh: false });
      if (fix) {
        await applyCoordinates(fix.latitude, fix.longitude, fix.accuracy);
      }
    } catch (err: any) {
      console.warn('GPS location request error:', err);
      // If we already have a cached position from the map, keep it
      const cached = getLastKnownUserPosition();
      if (cached) {
        await applyCoordinates(cached.latitude, cached.longitude, cached.accuracy || null);
      }
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setName(`${currentUser.fullName} ${currentUser.surname}`);
        setPhone(currentUser.cellNumber);
      }
      // Always prioritize prefilled type if provided, otherwise default to Police ('crime_threat')
      if (prefilledType) {
        setEmergencyType(prefilledType);
      } else {
        setEmergencyType('crime_threat');
      }

      if (prefilledNotes) setNotes(prefilledNotes);

      // 1. Immediately apply the exact GPS from the map if already locked
      const cached = getLastKnownUserPosition();
      if (cached) {
        applyCoordinates(cached.latitude, cached.longitude, cached.accuracy || null);
      }

      // 2. Refresh GPS with live satellite fix
      fetchAccurateGps();
    }
  }, [isOpen, currentUser, prefilledType, prefilledNotes]);

  if (!isOpen) return null;

  const handleGetGPS = () => {
    fetchAccurateGps();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert('Please fill in your name and phone number so emergency patrol can reach you.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sosObj = {
        name,
        phone,
        vehicleInfo: vehicleInfo || 'Vehicle details pending',
        latitude,
        longitude,
        locationName,
        emergencyType,
        notes: notes || `${selectedOption.label} requested`
      };
      await onSubmitSOS(sosObj);
      setSubmitted({
        id: `sos-${Date.now()}`,
        name,
        phone,
        vehicleInfo: vehicleInfo || 'Vehicle details pending',
        latitude,
        longitude,
        locationName,
        emergencyType,
        status: 'active',
        createdAt: new Date().toISOString(),
        notes
      });
      setIsSubmitting(false);
    } catch (error) {
      alert('Error sending SOS broadcast.');
      setIsSubmitting(false);
    }
  };

  const SelectedIcon = selectedOption.icon;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0D1422] text-slate-300 animate-in fade-in duration-200">
      <div className={`w-full h-full flex flex-col ${themeStyles.modalBorder} bg-[#0D1422] overflow-hidden text-slate-300 transition-all duration-300`}>
        
        {/* Dynamic Themed Header */}
        <div className={`${themeStyles.headerBg} p-4 sm:p-5 flex items-center justify-between text-white shrink-0 shadow-lg transition-colors duration-300`}>
          <div className="flex items-center space-x-3">
            <div className="bg-slate-950/25 p-2 sm:p-2.5 rounded-2xl border border-white/20 animate-pulse">
              <SelectedIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wider">
                {themeStyles.headerTitle}
              </h3>
              <p className="text-xs font-semibold text-white/90">
                {themeStyles.headerSub}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-950/30 hover:bg-slate-950/50 text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 sm:p-10 text-center space-y-6 flex-1 overflow-y-auto max-w-2xl mx-auto w-full flex flex-col justify-center">
            <div className={`w-20 h-20 ${themeStyles.highlightBox} ${themeStyles.accentText} rounded-full flex items-center justify-center mx-auto border-2 ${themeStyles.accentBorder} animate-pulse`}>
              <SelectedIcon className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <span className={`${themeStyles.badgeText} font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider`}>
                SOS BROADCAST ACTIVE
              </span>
              <h4 className="text-2xl sm:text-3xl font-black text-white mt-2">Responders Notified</h4>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your emergency location pin has been broadcast to emergency units and logged in the control room. Stay inside your locked vehicle if safe.
              </p>
              <div className="inline-flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Push notifications & sirens dispatched to on-duty responders</span>
              </div>
            </div>

            <div className="bg-[#090E17] p-5 rounded-2xl border border-[#D4A237]/30 text-left space-y-3 text-sm text-slate-300 shadow-xl">
              <div className="flex justify-between border-b border-[#D4A237]/20 pb-2">
                <span className="text-slate-400 uppercase text-xs font-semibold">Broadcast Time:</span>
                <span className="font-mono font-bold text-amber-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                  <span>{formatReadableDateTime(submitted.createdAt)}</span>
                </span>
              </div>
              <div className="flex justify-between border-b border-[#D4A237]/20 pb-2">
                <span className="text-slate-400 uppercase text-xs font-semibold">Contact:</span>
                <span className="font-bold text-white">{submitted.phone} ({submitted.name})</span>
              </div>
              <div className="flex justify-between border-b border-[#D4A237]/20 pb-2">
                <span className="text-slate-400 uppercase text-xs font-semibold">Priority Type:</span>
                <span className={`font-bold ${themeStyles.accentText} uppercase`}>{selectedOption.label}</span>
              </div>
              <div className="flex justify-between border-b border-[#D4A237]/20 pb-2">
                <span className="text-slate-400 uppercase text-xs font-semibold">Vehicle:</span>
                <span className="font-bold text-[#D4A237]">{submitted.vehicleInfo}</span>
              </div>
              <div className="flex justify-between border-b border-[#D4A237]/20 pb-2">
                <span className="text-slate-400 uppercase text-xs font-semibold">Location:</span>
                <span className="font-bold text-white">{submitted.locationName}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSubmitted(null);
                onClose();
              }}
              className="w-full py-3.5 bg-[#122033] hover:bg-[#182a44] text-[#D4A237] font-black uppercase tracking-wider text-sm rounded-full border border-[#D4A237]/40 transition shadow-lg cursor-pointer"
            >
              Close Full Screen SOS
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 max-w-3xl mx-auto w-full">
            <div className="p-4 sm:p-6 sm:py-8 space-y-5 flex-1 overflow-y-auto min-h-0">
              
              {/* Emergency Service Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-extrabold uppercase tracking-widest text-[#D4A237] mb-1.5 flex items-center justify-between">
                  <span>Emergency Service Required *</span>
                  <span className="text-[10px] text-slate-400 font-semibold lowercase">tap to change type</span>
                </label>

                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full bg-[#090E17] hover:bg-[#122033] border-2 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between transition-all duration-200 text-left shadow-xl cursor-pointer ${
                    isDropdownOpen ? selectedOption.activeBorder : 'border-[#D4A237]/40 hover:border-[#D4A237]'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${selectedOption.color} text-white shadow-md shrink-0`}>
                      <SelectedIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm sm:text-base text-white uppercase tracking-tight truncate">
                          {selectedOption.label}
                        </span>
                        <span className={`${selectedOption.badgeBg} font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0`}>
                          {selectedOption.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        {selectedOption.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 ml-2">
                    <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[#D4A237]' : ''}`} />
                  </div>
                </button>

                {/* Dropdown Menu List with Police at Top */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#090E17]/98 backdrop-blur-2xl border-2 border-[#D4A237] rounded-2xl p-2 shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#D4A237] px-3 py-1 border-b border-[#D4A237]/30 mb-1 flex items-center justify-between">
                      <span>Select Response Unit (Default: Police)</span>
                      <Shield className="w-3.5 h-3.5 text-[#D4A237]" />
                    </div>

                    {emergencyOptions.map((opt) => {
                      const isSelected = opt.id === emergencyType;
                      const OptIcon = opt.icon;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setEmergencyType(opt.id as any);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                            isSelected
                              ? `${opt.activeBg} shadow-lg border`
                              : 'bg-[#122033]/60 border border-transparent hover:bg-[#182a44] text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isSelected ? `bg-gradient-to-br ${opt.color} text-white` : 'bg-slate-800/80 text-slate-400 group-hover:text-white group-hover:bg-slate-800'
                            }`}>
                              <OptIcon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`font-black text-xs sm:text-sm uppercase ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                  {opt.label}
                                </span>
                                <span className={`${opt.badgeBg} text-[9px] font-bold px-1.5 py-0.2 rounded`}>
                                  {opt.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-normal leading-snug">
                                {opt.subtitle}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${opt.color} flex items-center justify-center shrink-0 ml-2 shadow-md`}>
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* GBV Dedicated Emergency Notice & Hotlines */}
              {emergencyType === 'gbv_assist' && (
                <div className="rounded-2xl bg-gradient-to-r from-purple-950/80 via-fuchsia-950/50 to-purple-950/80 border-2 border-purple-500/60 p-3.5 sm:p-4 shadow-xl text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-start space-x-2.5">
                    <HeartHandshake className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-black text-sm text-purple-200 uppercase tracking-tight">
                        Confidential GBV Emergency Assistance
                      </h4>
                      <p className="text-[11.5px] text-purple-200/90 leading-relaxed mt-0.5">
                        Your alert triggers immediate priority dispatch to verified highway safety patrols, community responders, and SAPS protection. If you are in immediate physical danger, call emergency services directly:
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <a
                      href="tel:0800428428"
                      className="flex items-center justify-center space-x-2 bg-purple-700 hover:bg-purple-600 text-white font-black py-2 px-3 rounded-xl transition shadow text-xs tracking-wider cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-white" />
                      <span>GBV Helpline: 0800 428 428</span>
                    </a>
                    <a
                      href="tel:10111"
                      className="flex items-center justify-center space-x-2 bg-blue-700 hover:bg-blue-600 text-white font-black py-2 px-3 rounded-xl transition shadow text-xs tracking-wider cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-white" />
                      <span>SAPS Police: 10111</span>
                    </a>
                  </div>
                  <p className="text-[10px] text-purple-300/80 font-mono text-center">
                    Emergency SMS: 31531 • USSD Code: *120*7867# • 24/7 Toll-Free
                  </p>
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amanda Coetzee"
                    className="w-full bg-[#090E17] border border-[#D4A237]/30 focus:border-[#D4A237] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+27 82 123 4567"
                    className="w-full bg-[#090E17] border border-[#D4A237]/30 focus:border-[#D4A237] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Vehicle Details & License Plate</label>
                <input
                  type="text"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  placeholder="e.g. Silver Toyota Fortuner (GP 482-991)"
                  className="w-full bg-[#090E17] border border-[#D4A237]/30 focus:border-[#D4A237] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Highway Location & Landmark
                  </label>
                  <button
                    type="button"
                    onClick={handleGetGPS}
                    disabled={isLocating}
                    className="text-xs text-[#D4A237] hover:underline flex items-center space-x-1 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-amber-400' : ''}`} />
                    <span>{isLocating ? 'Acquiring GPS...' : gpsAccuracy ? `GPS Locked (±${gpsAccuracy}m)` : 'Update GPS'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. N1 North, 2km past Pumulani Toll"
                  className="w-full bg-[#090E17] border border-[#D4A237]/30 focus:border-[#D4A237] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                {gpsAccuracy && (
                  <p className="text-[10.5px] text-emerald-400 mt-1 flex items-center space-x-1">
                    <span>✓ High-precision coordinates locked: {latitude.toFixed(4)}, {longitude.toFixed(4)} (±{gpsAccuracy}m)</span>
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Situation Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Are you pulled over on shoulder? Any injuries? Need urgent armed escort?"
                  className="w-full bg-[#090E17] border border-[#D4A237]/30 focus:border-[#D4A237] rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>

            </div>

            {/* Dynamic Colored Submit Button */}
            <div className="p-3.5 sm:p-4 border-t border-[#D4A237]/20 bg-[#0D1422] shrink-0 z-10">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 ${themeStyles.btnGradient} font-black rounded-full text-xs sm:text-sm shadow-xl transition uppercase tracking-wider flex items-center justify-center space-x-2 animate-pulse cursor-pointer disabled:opacity-50`}
              >
                <SelectedIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>
                  {isSubmitting
                    ? 'Broadcasting Emergency SOS...'
                    : `BROADCAST ${selectedOption.badge} NOW`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
