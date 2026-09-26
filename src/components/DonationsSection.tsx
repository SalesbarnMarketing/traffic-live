import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Donation, DonationStats, SupportTier, IncidentReport, RegisteredUser } from '../types';
import { INITIAL_SUPPORT_TIERS } from '../data/initialData';
import { initiatePayFastPayment, submitPayFastForm, PayFastPaymentResponse } from '../utils/payfast';
import { BetaNoticeCard } from './BetaNoticeCard';
import {
  Heart, Coffee, Fuel, Shield, CheckCircle2, Award, X, Building2,
  UserCheck, Hash, Mail, Phone, Wrench, MapPin, Upload, Camera,
  Sparkles, AlertTriangle, Layers, Car, Copy, Check, FileText,
  ExternalLink, GraduationCap, ChevronRight, Eye, CreditCard, Zap, Lock, RefreshCw,
  Bell, Users, Radio, ShieldCheck
} from 'lucide-react';
import { LiveTrafficLogo } from './LiveTrafficLogo';

interface DonationsSectionProps {
  stats: DonationStats;
  donations: Donation[];
  onSubmitDonation: (donationData: Partial<Donation>) => Promise<void>;
  currentUser?: RegisteredUser | null;
  onSwitchTab?: (tab: any) => void;
}

export const DonationsSection: React.FC<DonationsSectionProps> = ({
  stats,
  donations,
  onSubmitDonation,
  currentUser,
  onSwitchTab
}) => {
  const [supportTiers, setSupportTiers] = useState<SupportTier[]>(INITIAL_SUPPORT_TIERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('coffee');
  const [amount, setAmount] = useState<number>(100);

  const defaultUserName = currentUser ? `${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim() : '';

  const [donorName, setDonorName] = useState(defaultUserName);
  const [donorEmail, setDonorEmail] = useState(currentUser?.email || '');
  const [donorPhone, setDonorPhone] = useState(currentUser?.cellNumber || '');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'eft'>('payfast');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayfast, setIsProcessingPayfast] = useState(false);
  const [donatedSuccess, setDonatedSuccess] = useState(false);
  const [wallFilter, setWallFilter] = useState<'all' | 'potholes' | 'driving' | 'fixed'>('all');

  // PayFast Checkout Overlay Modal State
  const [payfastModalData, setPayfastModalData] = useState<{
    processUrl: string;
    paymentFields: Record<string, string>;
    paymentId: string;
    amount: number;
    title: string;
    category: string;
  } | null>(null);
  const [isVerifyingPayfast, setIsVerifyingPayfast] = useState(false);

  // Proof of Payment & Reference States
  const [proofOfPaymentUrl, setProofOfPaymentUrl] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedProofPreview, setSelectedProofPreview] = useState<string | null>(null);

  // Dedicated Driving Course Modal State
  const [isDrivingCourseModalOpen, setIsDrivingCourseModalOpen] = useState(false);

  // Dedicated Pothole Donation Modal States
  const [isPotholeModalOpen, setIsPotholeModalOpen] = useState(false);
  const [potholePaymentMethod, setPotholePaymentMethod] = useState<'payfast' | 'eft'>('payfast');
  const [potholesCount, setPotholesCount] = useState<number>(1);
  const [potholeLocation, setPotholeLocation] = useState<string>('Kliprivier Offramp, R59 South');
  const [potholeImageUrl, setPotholeImageUrl] = useState<string>('');
  const [potholeLat, setPotholeLat] = useState<number | undefined>(-26.3120);
  const [potholeLng, setPotholeLng] = useState<number | undefined>(28.0890);
  const [potholeDonorName, setPotholeDonorName] = useState(defaultUserName);
  const [potholeDonorEmail, setPotholeDonorEmail] = useState(currentUser?.email || '');
  const [potholeDonorPhone, setPotholeDonorPhone] = useState(currentUser?.cellNumber || '');
  const [potholeMessage, setPotholeMessage] = useState('');
  const [potholeIsAnonymous, setPotholeIsAnonymous] = useState(false);
  const [potholePopUrl, setPotholePopUrl] = useState<string>('');
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [reportedPotholes, setReportedPotholes] = useState<IncidentReport[]>([]);

  // Keep donor names synced with currentUser if log in happens
  useEffect(() => {
    if (currentUser) {
      const uName = `${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim();
      if (uName) {
        if (!donorName) setDonorName(uName);
        if (!potholeDonorName) setPotholeDonorName(uName);
      }
      if (currentUser.email) {
        if (!donorEmail) setDonorEmail(currentUser.email);
        if (!potholeDonorEmail) setPotholeDonorEmail(currentUser.email);
      }
      if (currentUser.cellNumber) {
        if (!donorPhone) setDonorPhone(currentUser.cellNumber);
        if (!potholeDonorPhone) setPotholeDonorPhone(currentUser.cellNumber);
      }
    }
  }, [currentUser]);

  // Fetch live configured support tiers & active reported potholes
  useEffect(() => {
    const fetchTiersAndPotholes = async () => {
      try {
        const res = await fetch('/api/support-tiers');
        if (res.ok) {
          const data = await res.json();
          if (data.supportTiers && Array.isArray(data.supportTiers) && data.supportTiers.length > 0) {
            setSupportTiers(data.supportTiers);
          }
        }
      } catch (err) {
        console.warn('Using default support tiers:', err);
      }

      try {
        const repRes = await fetch('/api/reports?category=pothole');
        if (repRes.ok) {
          const repData = await repRes.json();
          if (repData.reports && Array.isArray(repData.reports)) {
            setReportedPotholes(repData.reports);
          }
        }
      } catch (err) {
        console.warn('Error fetching pothole reports:', err);
      }
    };
    fetchTiersAndPotholes();
  }, [isModalOpen, isPotholeModalOpen]);

  // Check URL query parameters for returning PayFast payments
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentId = params.get('payment_id') || localStorage.getItem('pending_payfast_id');
    const category = params.get('category');

    if (paymentStatus === 'success' && paymentId && category !== 'advertising' && category !== 'advertising_package') {
      let cachedMeta: any = {};
      try {
        const stored = localStorage.getItem('pending_payfast_meta');
        if (stored) cachedMeta = JSON.parse(stored);
      } catch (e) {
        // Ignored
      }

      fetch('/api/payfast/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          category: category || cachedMeta.category || 'donation',
          amount: cachedMeta.amount,
          donorName: cachedMeta.donorName,
          message: cachedMeta.message,
          potholeLocation: cachedMeta.potholeLocation
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
            setDonatedSuccess(true);
            setTimeout(() => setDonatedSuccess(false), 9000);
            localStorage.removeItem('pending_payfast_id');
            localStorage.removeItem('pending_payfast_meta');
          }
        })
        .catch(err => {
          console.warn('Payment confirmation error:', err);
        });
    }
  }, []);

  const percentage = Math.min(100, Math.round((stats.totalRaised / stats.goalAmount) * 100));

  // Copy helper
  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenDonate = (catKey: string, defaultAmt: number, prefMethod: 'payfast' | 'eft' = 'payfast') => {
    setPaymentMethod(prefMethod);
    if (catKey === 'pothole_repair') {
      setPotholePaymentMethod(prefMethod);
      setIsPotholeModalOpen(true);
      return;
    }
    if (catKey === 'advance_driving') {
      setSelectedCategory('advance_driving');
      setAmount(defaultAmt || 1500);
      setReferenceNumber(`DRIVE-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
      setIsModalOpen(true);
      return;
    }
    setSelectedCategory(catKey);
    setAmount(defaultAmt);
    const catCode = catKey === 'coffee' ? 'COFFEE' : catKey === 'fuel' ? 'FUEL' : catKey === 'equipment' ? 'GEAR' : 'DONATION';
    setReferenceNumber(`${catCode}-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
    setIsModalOpen(true);
  };

  // Dedicated PayFast General Payment Trigger
  const handlePayFastGeneralCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || amount <= 0) {
      alert('Please enter a valid contribution amount.');
      return;
    }

    setIsProcessingPayfast(true);
    try {
      const titleMap: Record<string, string> = {
        advance_driving: 'Advance Driving Course Registration',
        pothole_repair: 'Pothole Road Repair Sponsorship',
        coffee: 'Night Patrol Coffee & Meal Fund',
        fuel: 'Patrol Vehicle Fleet Fuel',
        equipment: 'Safety Gear & High-Vis Equipment',
        medical_sos: 'Emergency First Aid SOS Response Kit',
        custom: 'Live Traffic NPC Road Safety Contribution'
      };

      const title = titleMap[selectedCategory] || `Live Traffic NPC - ${selectedCategory}`;

      const res = await initiatePayFastPayment({
        amount,
        itemName: title,
        itemDescription: message || `Live Traffic NPC Road Safety Contribution`,
        category: selectedCategory,
        donorName: isAnonymous ? 'Anonymous Resident' : (donorName || 'Kind Supporter'),
        donorEmail: donorEmail || currentUser?.email || 'supporter@livetrafficnpc.co.za',
        donorPhone: donorPhone || currentUser?.cellNumber || '0820000000',
        message,
        isAnonymous
      });

      setPayfastModalData({
        ...res,
        amount,
        title,
        category: selectedCategory
      });
      setIsProcessingPayfast(false);
    } catch (err: any) {
      alert(`PayFast Checkout Error: ${err?.message || 'Could not connect to payment gateway'}`);
      setIsProcessingPayfast(false);
    }
  };

  // Dedicated PayFast Pothole Checkout Trigger
  const handlePayFastPotholeCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const calculatedAmount = potholesCount * 350;

    setIsProcessingPayfast(true);
    try {
      const title = `Fix ${potholesCount} Pothole(s) - Road Repair Patch`;
      const res = await initiatePayFastPayment({
        amount: calculatedAmount,
        itemName: title,
        itemDescription: `Cold-asphalt road repair near ${potholeLocation || 'Corridor Hotspot'}`,
        category: 'pothole_repair',
        donorName: potholeIsAnonymous ? 'Anonymous Resident' : (potholeDonorName || 'Kind Supporter'),
        donorEmail: potholeDonorEmail || currentUser?.email || 'supporter@livetrafficnpc.co.za',
        donorPhone: potholeDonorPhone || currentUser?.cellNumber || '0820000000',
        message: potholeMessage || `Sponsored ${potholesCount} pothole patch(es) @ R350 each. Location: ${potholeLocation}`,
        isAnonymous: potholeIsAnonymous,
        potholesCount,
        potholeLocation,
        potholeImageUrl,
        potholeLat,
        potholeLng
      });

      setPayfastModalData({
        ...res,
        amount: calculatedAmount,
        title,
        category: 'pothole_repair'
      });
      setIsProcessingPayfast(false);
    } catch (err: any) {
      alert(`PayFast Checkout Error: ${err?.message || 'Could not connect to payment gateway'}`);
      setIsProcessingPayfast(false);
    }
  };

  const handleVerifyPayFastPayment = async (paymentId: string, fallbackData?: {
    category?: string;
    amount?: number;
    donorName?: string;
    message?: string;
    potholeLocation?: string;
  }) => {
    setIsVerifyingPayfast(true);
    try {
      const res = await fetch('/api/payfast/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          category: fallbackData?.category || selectedCategory || 'donation',
          amount: fallbackData?.amount || amount,
          donorName: fallbackData?.donorName || (isAnonymous ? 'Anonymous Resident' : donorName),
          message: fallbackData?.message || message,
          potholeLocation: fallbackData?.potholeLocation || potholeLocation
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        setPayfastModalData(null);
        setIsModalOpen(false);
        setIsPotholeModalOpen(false);
        setIsDrivingCourseModalOpen(false);
        setDonatedSuccess(true);
        setTimeout(() => setDonatedSuccess(false), 8000);
      } else {
        alert(data.error || 'Payment confirmation still pending on PayFast. If you completed payment, it will be automatically confirmed via ITN.');
      }
    } catch (e: any) {
      alert(`Could not verify payment: ${e.message}`);
    } finally {
      setIsVerifyingPayfast(false);
    }
  };

  const renderTierIcon = (icon: string) => {
    switch (icon) {
      case 'tool':
        return <Wrench className="w-5 h-5 text-amber-400" />;
      case 'coffee':
      case 'meal':
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'equipment':
        return <Shield className="w-5 h-5 text-amber-400" />;
      case 'fuel':
        return <Fuel className="w-5 h-5 text-amber-400" />;
      case 'car':
        return <Car className="w-5 h-5 text-amber-400" />;
      default:
        return <Heart className="w-5 h-5 text-amber-400" />;
    }
  };

  // Image compressor for POP attachment
  const handlePopUpload = (e: React.ChangeEvent<HTMLInputElement>, isForPothole = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxWidth = 1200;
          const maxHeight = 1200;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            if (isForPothole) {
              setPotholePopUrl(compressed);
            } else {
              setProofOfPaymentUrl(compressed);
            }
          } else {
            if (isForPothole) {
              setPotholePopUrl(event.target?.result as string);
            } else {
              setProofOfPaymentUrl(event.target?.result as string);
            }
          }
        };
        img.onerror = () => {
          if (typeof reader.result === 'string') {
            if (isForPothole) {
              setPotholePopUrl(reader.result);
            } else {
              setProofOfPaymentUrl(reader.result);
            }
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Standard Donation Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmitDonation({
        donorName,
        amount,
        category: selectedCategory,
        message,
        isAnonymous,
        proofOfPaymentUrl,
        referenceNumber
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      setDonatedSuccess(true);
      setTimeout(() => {
        setDonatedSuccess(false);
        setIsSubmitting(false);
        setIsModalOpen(false);
        setProofOfPaymentUrl('');
        setDonorName('');
        setMessage('');
        setReferenceNumber('');
      }, 2500);
    } catch (error) {
      alert('Error recording donation.');
      setIsSubmitting(false);
    }
  };

  // Dedicated Pothole Donation Form Submit
  const handlePotholeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const calculatedAmount = potholesCount * 350;

    setIsSubmitting(true);
    try {
      await onSubmitDonation({
        donorName: potholeDonorName,
        amount: calculatedAmount,
        category: 'pothole_repair',
        message: potholeMessage || `Sponsored ${potholesCount} pothole repair patch(es) @ R350 each. Location: ${potholeLocation}`,
        isAnonymous: potholeIsAnonymous,
        potholesCount,
        potholeLocation,
        potholeImageUrl,
        potholeLat,
        potholeLng,
        proofOfPaymentUrl: potholePopUrl,
        referenceNumber: `POTHOLE-${(potholeDonorName || 'DONOR').replace(/\s+/g, '').toUpperCase()}`
      });

      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.5 }
      });

      setDonatedSuccess(true);
      setTimeout(() => {
        setDonatedSuccess(false);
        setIsSubmitting(false);
        setIsPotholeModalOpen(false);
        setPotholePopUrl('');
        setPotholeDonorName('');
        setPotholeMessage('');
      }, 2500);
    } catch (error: any) {
      alert(`Error recording pothole donation: ${error?.message || 'Server connection error'}`);
      setIsSubmitting(false);
    }
  };

  // Handle Photo File Upload with Canvas Compression (Mobile camera friendly)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
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

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setPotholeImageUrl(compressed);
          } else {
            setPotholeImageUrl(event.target?.result as string);
          }
        };
        img.onerror = () => {
          if (typeof reader.result === 'string') {
            setPotholeImageUrl(reader.result);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Get GPS Pin Coordinates & Reverse Geocode
  const handleGetGpsLocation = (showNotification = true) => {
    if (!navigator.geolocation) {
      if (showNotification) alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPotholeLat(lat);
        setPotholeLng(lng);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const road = addr?.road || addr?.highway || addr?.street || '';
            const sub = addr?.suburb || addr?.neighbourhood || addr?.city || addr?.town || '';
            const combined = [road, sub].filter(Boolean).join(', ');
            if (combined) {
              setPotholeLocation(combined);
              setIsLocatingGps(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Reverse geocode error, using coordinate string:', err);
        }

        setPotholeLocation(`GPS Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setIsLocatingGps(false);
      },
      (err) => {
        console.warn('GPS location error:', err);
        if (showNotification) {
          alert('Could not acquire current GPS location. Please check location permissions or type manually.');
        }
        setIsLocatingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Auto-acquire current GPS location when opening Pothole modal
  useEffect(() => {
    if (isPotholeModalOpen) {
      handleGetGpsLocation(false);
    }
  }, [isPotholeModalOpen]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-8 text-slate-100">

      {/* FEATURED CAMPAIGN FLYER CARD (Matching Exact Official Poster Branding) */}
      <div className="bg-[#070A10] border-2 border-[#D4A237] rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden text-slate-100">
        
        {/* Background Coffee Bean & Dark Navy Gradient Glows */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2A1608]/40 via-[#070A10] to-[#1E1208]/30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4A237]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#381F0E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">

          {/* Top Header Row: Coffee Art & 4 Corner Value Badges */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-2 border-b border-[#D4A237]/20">
            
            {/* Left: Mini Coffee / Emblem Branding */}
            <div className="flex items-center space-x-3.5">
              <div className="shrink-0 flex items-center justify-center">
                <LiveTrafficLogo size="xs" showText={false} withGlow={true} animateBeacon={true} className="w-12 h-14" />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-black tracking-widest text-[#D4A237] uppercase">Official NPC Safety Fund</div>
                <div className="text-base sm:text-lg font-black text-white leading-tight">LIVE TRAFFIC NPC</div>
                <div className="text-[11px] text-amber-200/80 font-medium">Road Safety & Rapid Patrols</div>
              </div>
            </div>

            {/* Right: 4 Value Micro-Cards (ALERT, RESPOND, COMMUNITY, IMPACT) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto text-left">
              <div className="bg-[#0A0F1A]/80 border border-[#D4A237]/30 rounded-xl px-2.5 py-1.5 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-[#D4A237] shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-[#D4A237] uppercase leading-none">ALERT</div>
                  <div className="text-[9px] text-slate-300 font-medium leading-none mt-0.5">We see.</div>
                </div>
              </div>

              <div className="bg-[#0A0F1A]/80 border border-[#D4A237]/30 rounded-xl px-2.5 py-1.5 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#D4A237] shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-[#D4A237] uppercase leading-none">RESPOND</div>
                  <div className="text-[9px] text-slate-300 font-medium leading-none mt-0.5">We act.</div>
                </div>
              </div>

              <div className="bg-[#0A0F1A]/80 border border-[#D4A237]/30 rounded-xl px-2.5 py-1.5 flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#D4A237] shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-[#D4A237] uppercase leading-none">COMMUNITY</div>
                  <div className="text-[9px] text-slate-300 font-medium leading-none mt-0.5">We care.</div>
                </div>
              </div>

              <div className="bg-[#0A0F1A]/80 border border-[#D4A237]/30 rounded-xl px-2.5 py-1.5 flex items-center space-x-2">
                <Heart className="w-4 h-4 text-[#D4A237] shrink-0" />
                <div>
                  <div className="text-[10px] font-black text-[#D4A237] uppercase leading-none">IMPACT</div>
                  <div className="text-[9px] text-slate-300 font-medium leading-none mt-0.5">We save lives.</div>
                </div>
              </div>
            </div>

          </div>

          {/* Main Hero Banner: "FUEL OUR MISSION, SAVE A LIFE." */}
          <div className="text-center space-y-3 pt-1">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-none">
              FUEL OUR MISSION,
            </h1>

            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D4A237] to-[#D4A237] flex-1 max-w-[80px] sm:max-w-[140px]" />
              <div className="text-2xl sm:text-4xl md:text-5xl font-black text-[#D4A237] tracking-tight uppercase drop-shadow-md">
                SAVE A LIFE.
              </div>
              <div className="h-[2px] bg-gradient-to-l from-transparent via-[#D4A237] to-[#D4A237] flex-1 max-w-[80px] sm:max-w-[140px]" />
            </div>

            <div className="flex items-center justify-center space-x-2 text-[#D4A237] text-xs">
              <span>♦</span>
              <span className="text-xs sm:text-sm font-black tracking-widest text-slate-100 uppercase">
                JOIN US IN SAVING LIVES WITH A <span className="text-[#D4A237]">SIMPLE CUP OF COFFEE</span>.
              </span>
              <span>♦</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
              <strong className="text-[#D4A237]">LIVE TRAFFIC NPC:</strong> Monitoring and improving road safety, one intersection and road repair at a time. Every contribution helps us expand our reach.
            </p>
          </div>

          {/* EXACT POSTER BANK ACCOUNT CARD WITH GOLD BOTTOM REFERENCE PLATE */}
          <div className="bg-[#05080E] border-2 border-[#D4A237] rounded-3xl shadow-2xl overflow-hidden max-w-xl mx-auto">
            {/* Top Banking Info in Midnight Dark */}
            <div className="p-5 sm:p-6 space-y-3.5 text-xs sm:text-sm font-semibold">
              
              {/* Bank Name */}
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#D4A237] font-extrabold uppercase tracking-wider text-xs block">Bank Name:</span>
                    <span className="text-white font-black text-sm sm:text-base">First National Bank (FNB)</span>
                  </div>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#D4A237] font-extrabold uppercase tracking-wider text-xs block">Account Number:</span>
                    <span className="text-white font-black text-base sm:text-lg tracking-widest font-mono">6308 982 3728</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('63089823728', 'acc')}
                  className="bg-[#0A0F1A] hover:bg-[#122033] text-[#D4A237] border border-[#D4A237]/60 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition active:scale-95"
                >
                  {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'acc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Branch Code */}
              <div className="flex items-center justify-between text-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-[#D4A237]/20 border border-[#D4A237] text-[#D4A237] flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[#D4A237] font-extrabold uppercase tracking-wider text-xs block">Branch Code:</span>
                    <span className="text-white font-black text-sm sm:text-base font-mono">250 655</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('250655', 'branch')}
                  className="bg-[#0A0F1A] hover:bg-[#122033] text-[#D4A237] border border-[#D4A237]/60 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition active:scale-95"
                >
                  {copiedField === 'branch' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'branch' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

            </div>

            {/* Bottom Solid Gold Metallic Reference Plate */}
            <div className="bg-gradient-to-r from-[#D4A237] via-[#E8B84B] to-[#C9962A] text-[#070A10] p-4 sm:p-5 text-center space-y-1.5 shadow-inner">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest block text-[#070A10]">
                Use Reference:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg font-black tracking-wider text-[#070A10]">
                <span className="flex items-center space-x-1.5">
                  <Coffee className="w-5 h-5 fill-current" />
                  <span>COFFEE</span>
                </span>
                <span className="font-bold text-sm text-[#070A10]/70">- or -</span>
                <span className="flex items-center space-x-1.5">
                  <Fuel className="w-5 h-5 fill-current" />
                  <span>FUEL</span>
                </span>
                <span className="font-bold text-sm text-[#070A10]/70">- or -</span>
                <span className="flex items-center space-x-1.5">
                  <Wrench className="w-5 h-5 fill-current" />
                  <span>POTHOLE</span>
                </span>
              </div>
            </div>
          </div>

          {/* Slogan with Golden Heart: "A coffee a day makes the road safer." */}
          <div className="flex items-center justify-center space-x-2 text-[#D4A237] pt-1">
            <Heart className="w-6 h-6 text-[#D4A237] shrink-0 fill-transparent stroke-[2.2]" />
            <span className="text-lg sm:text-2xl font-serif italic font-bold tracking-wide">
              A coffee a day makes the road safer.
            </span>
          </div>

          {/* PRIMARY ACTION BUTTONS: PAY ONLINE VIA PAYFAST + PAY & ATTACH POP + ADVANCE DRIVING COURSE */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-2xl mx-auto">
            <button
              onClick={() => {
                setSelectedCategory('coffee');
                setAmount(100);
                setPaymentMethod('payfast');
                setIsModalOpen(true);
              }}
              className="w-full sm:flex-1 py-3.5 px-5 bg-[#FAF4EA] hover:bg-white text-[#070A10] font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl border-2 border-[#D4A237] cursor-pointer flex items-center justify-center space-x-2 group active:scale-95"
            >
              <Zap className="w-4 h-4 text-[#070A10] fill-[#070A10] group-hover:scale-110 transition" />
              <span>⚡ Pay Online via PayFast</span>
            </button>

            <button
              onClick={() => {
                setSelectedCategory('coffee');
                setAmount(100);
                setPaymentMethod('eft');
                setReferenceNumber(`COFFEE-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                setIsModalOpen(true);
              }}
              className="w-full sm:flex-1 py-3.5 px-5 bg-[#0A0F1A] hover:bg-[#122033] text-[#D4A237] hover:text-white font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl border-2 border-[#D4A237]/60 hover:border-[#D4A237] cursor-pointer flex items-center justify-center space-x-2 group"
            >
              <Upload className="w-4 h-4 text-[#D4A237] group-hover:-translate-y-0.5 transition" />
              <span>🏦 Manual EFT & POP</span>
            </button>

            <button
              onClick={() => setIsDrivingCourseModalOpen(true)}
              className="w-full sm:flex-1 py-3.5 px-5 bg-[#FAF4EA] hover:bg-white text-[#070A10] font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl border-2 border-[#D4A237] cursor-pointer flex items-center justify-center space-x-2 group active:scale-95"
            >
              <Car className="w-4 h-4 text-[#070A10] group-hover:rotate-12 transition" />
              <span>Advance Driving</span>
            </button>
          </div>

          {/* 4 Poster Pillars Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs font-bold">
            <div className="bg-[#05080E] border border-[#D4A237]/30 rounded-2xl p-2.5 space-y-0.5">
              <div className="flex items-center justify-center space-x-1.5 text-[#D4A237]">
                <MapPin className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase">REAL-TIME ALERTS</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium">We inform.</div>
            </div>

            <div className="bg-[#05080E] border border-[#D4A237]/30 rounded-2xl p-2.5 space-y-0.5">
              <div className="flex items-center justify-center space-x-1.5 text-[#D4A237]">
                <Radio className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase">RAPID RESPONSE</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium">We act fast.</div>
            </div>

            <div className="bg-[#05080E] border border-[#D4A237]/30 rounded-2xl p-2.5 space-y-0.5">
              <div className="flex items-center justify-center space-x-1.5 text-[#D4A237]">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase">ROAD SAFETY</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium">We protect.</div>
            </div>

            <div className="bg-[#05080E] border border-[#D4A237]/30 rounded-2xl p-2.5 space-y-0.5">
              <div className="flex items-center justify-center space-x-1.5 text-[#D4A237]">
                <Users className="w-4 h-4" />
                <span className="font-black text-[11px] uppercase">TOGETHER</span>
              </div>
              <div className="text-[10px] text-slate-300 font-medium">We save lives.</div>
            </div>
          </div>

          {/* Exact Poster Footer Gold Banner */}
          <div className="bg-[#D4A237] text-[#070A10] py-3 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
            <span>THANK YOU FOR HELPING US KEEP OUR ROADS SAFER FOR ALL.</span>
            <span className="bg-[#070A10] text-[#D4A237] px-3 py-1 rounded-full text-xs font-mono tracking-widest">
              #LIVETRAFFICNPC
            </span>
          </div>

        </div>
      </div>

      {/* Goal Progress Tracker */}
      <div className="bg-[#0A0F1A] p-6 rounded-2xl border border-[#D4A237]/40 space-y-3.5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm font-bold gap-1">
          <span className="text-slate-300 uppercase tracking-wider">Patrol & Road Repair Fund Goal</span>
          <span className="text-[#D4A237] font-extrabold text-sm sm:text-base">
            R{stats.totalRaised.toLocaleString()} raised of R{stats.goalAmount.toLocaleString()} target ({percentage}%)
          </span>
        </div>

        <div className="w-full bg-[#05080E] h-4 rounded-full overflow-hidden p-0.5 border border-[#D4A237]/30">
          <div
            className="bg-gradient-to-r from-[#F5D061] to-[#D4A237] h-full rounded-full transition-all duration-1000 shadow-lg"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center text-xs sm:text-sm">
          <div className="bg-[#05080E] p-3 rounded-xl border border-[#D4A237]/30">
            <span className="block font-black text-[#D4A237] text-lg">{stats.potholesFunded || 24} Holes</span>
            <span className="text-slate-300 text-xs uppercase font-bold">🔨 Potholes Fixed</span>
          </div>
          <div className="bg-[#05080E] p-3 rounded-xl border border-[#D4A237]/30">
            <span className="block font-black text-[#D4A237] text-lg">{stats.coffeeCount} Cups</span>
            <span className="text-slate-300 text-xs uppercase font-bold">☕ Night Watch Coffee</span>
          </div>
          <div className="bg-[#05080E] p-3 rounded-xl border border-[#D4A237]/30">
            <span className="block font-black text-[#D4A237] text-lg">{stats.fuelLiters} Liters</span>
            <span className="text-slate-300 text-xs uppercase font-bold">⛽ Patrol Fuel Funded</span>
          </div>
          <div className="bg-[#05080E] p-3 rounded-xl border border-[#D4A237]/30">
            <span className="block font-black text-[#D4A237] text-lg">{stats.equipmentItemsFunded} Units</span>
            <span className="text-slate-300 text-xs uppercase font-bold">🔦 Gear & Rakes</span>
          </div>
          <div className="bg-[#05080E] p-3 rounded-xl border border-[#D4A237]/30 col-span-2 sm:col-span-1">
            <span className="block font-black text-emerald-400 text-lg">{stats.backersCount} Donors</span>
            <span className="text-slate-300 text-xs uppercase font-bold">👥 Community Backers</span>
          </div>
        </div>
      </div>

      {/* Preset Support Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {supportTiers.filter(t => t.enabled).map((tier, idx) => (
          <div
            key={tier.id}
            className={`bg-[#0A0F1A] border rounded-2xl p-5 shadow-xl text-slate-200 space-y-4 flex flex-col justify-between transition relative overflow-hidden ${
              tier.id === 'advance_driving'
                ? 'border-2 border-[#D4A237] shadow-2xl bg-gradient-to-b from-[#122033] to-[#0A0F1A]'
                : tier.id === 'pothole_repair'
                ? 'border-2 border-[#D4A237]/80 shadow-2xl'
                : 'border-[#D4A237]/40 hover:border-[#D4A237]'
            }`}
          >
            {tier.id === 'advance_driving' ? (
              <span className="absolute top-2.5 right-2.5 bg-[#FAF4EA] text-[#070A10] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4A237]">
                CERTIFIED COURSE
              </span>
            ) : tier.id === 'pothole_repair' ? (
              <span className="absolute top-2.5 right-2.5 bg-[#FAF4EA] text-[#070A10] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#D4A237]">
                COMMUNITY REPAIR
              </span>
            ) : null}

            <div className="space-y-2">
              <div className="w-11 h-11 bg-[#05080E] rounded-xl flex items-center justify-center border border-[#D4A237]/40">
                {renderTierIcon(tier.icon)}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">{tier.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{tier.description}</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#D4A237]/30">
              <div className="text-2xl font-black text-[#D4A237]">R{tier.amount.toLocaleString()} ZAR</div>
              <button
                onClick={() => handleOpenDonate(tier.categoryKey || tier.id, tier.amount, 'payfast')}
                className="w-full py-3 font-black text-xs sm:text-sm rounded-xl transition uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-1.5 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] shadow-lg active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current text-[#070A10]" />
                <span>
                  {tier.id === 'advance_driving' 
                    ? 'PayFast Course (R1,500)' 
                    : tier.id === 'pothole_repair' 
                    ? 'PayFast R350 (Fix Hole)' 
                    : `PayFast R${tier.amount}`}
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Supporters Wall / Feed */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-300 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="uppercase tracking-wider">Recent Community Backers & Sponsors</span>
          </h3>

          {/* Wall Filter Tabs */}
          <div className="flex items-center bg-[#0A0B0D] p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setWallFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                wallFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Backers
            </button>
            <button
              type="button"
              onClick={() => setWallFilter('potholes')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                wallFilter === 'potholes'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔨 Potholes
            </button>
            <button
              type="button"
              onClick={() => setWallFilter('driving')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                wallFilter === 'driving'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏎️ Driving Course
            </button>
            <button
              type="button"
              onClick={() => setWallFilter('fixed')}
              className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                wallFilter === 'fixed'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ✅ Fixed
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {donations
            .filter((d) => {
              if (wallFilter === 'potholes') return d.category === 'pothole_repair';
              if (wallFilter === 'driving') return d.category === 'advance_driving';
              if (wallFilter === 'fixed') return d.category === 'pothole_repair' && d.isFixed;
              return true;
            })
            .map((don) => (
            <div key={don.id} className="bg-[#0A0B0D] p-4 rounded-xl border border-slate-800 space-y-2 text-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[160px] text-sm">{don.donorName}</span>
                  <span className="bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0">
                    +R{don.amount}
                  </span>
                </div>

                {/* Category Badge */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {don.category === 'advance_driving' && (
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                      <Car className="w-3 h-3 text-amber-400" />
                      <span>Advance Driving Course</span>
                    </span>
                  )}
                  {don.category === 'pothole_repair' && (
                    <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span>{don.potholesCount || 1} Pothole Patch(es)</span>
                    </span>
                  )}
                  {don.category === 'coffee' && (
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-full">
                      ☕ Coffee & Refreshment
                    </span>
                  )}
                  {don.category === 'fuel' && (
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-full">
                      ⛽ Patrol Vehicle Fuel
                    </span>
                  )}
                  {don.proofOfPaymentUrl && (
                    <button
                      type="button"
                      onClick={() => setSelectedProofPreview(don.proofOfPaymentUrl || null)}
                      className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center space-x-1 cursor-pointer transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>POP Attached</span>
                    </button>
                  )}
                </div>

                {don.category === 'pothole_repair' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-amber-400 font-bold text-[10px]">
                        <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>{don.potholesCount || Math.max(1, Math.floor(don.amount/350))} Pothole(s) Sponsored</span>
                      </div>
                      {don.isFixed ? (
                        <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FIXED</span>
                        </span>
                      ) : (
                        <span className="bg-amber-500/20 text-amber-300 font-bold text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                          DISPATCHED
                        </span>
                      )}
                    </div>

                    {don.potholeLocation && (
                      <div className="text-[10px] text-slate-300 flex items-center space-x-1 truncate font-medium">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{don.potholeLocation}</span>
                      </div>
                    )}

                    {/* Side-by-side or photo display */}
                    {don.fixedImageUrl ? (
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Before & After Repair Proof</span>
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {don.potholeImageUrl && (
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider block bg-amber-950/80 px-1 py-0.5 rounded border border-amber-500/30 text-center">
                                BEFORE
                              </span>
                              <img
                                src={don.potholeImageUrl}
                                alt="Original Pothole"
                                className="w-full h-20 object-cover rounded border border-slate-800"
                              />
                            </div>
                          )}
                          <div className={don.potholeImageUrl ? 'space-y-0.5' : 'col-span-2 space-y-0.5'}>
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider block bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/40 text-center">
                              AFTER (FIXED)
                            </span>
                            <img
                              src={don.fixedImageUrl}
                              alt="Fixed Pothole Photo"
                              className="w-full h-20 object-cover rounded border-2 border-emerald-500/60"
                            />
                          </div>
                        </div>
                      </div>
                    ) : don.potholeImageUrl ? (
                      <img
                        src={don.potholeImageUrl}
                        alt="Pothole"
                        className="w-full h-24 object-cover rounded-md border border-slate-800 mt-1"
                      />
                    ) : null}

                    {don.adminFeedback && (
                      <p className="text-[10px] text-emerald-300 bg-emerald-950/60 p-1.5 rounded border border-emerald-500/30 italic font-medium">
                        💬 Admin Feedback: "{don.adminFeedback}"
                      </p>
                    )}
                  </div>
                )}

                {don.message && <p className="text-slate-400 italic text-[11px]">"{don.message}"</p>}
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>{new Date(don.timestamp).toLocaleDateString()}</span>
                {don.referenceNumber && <span className="font-mono text-slate-400 font-semibold">{don.referenceNumber}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM ATTRIBUTION / FANCY BETA CARD */}
        <div className="pt-6 pb-2 max-w-lg mx-auto w-full">
          <BetaNoticeCard />
        </div>
      </div>

      {/* PAY & ATTACH POP / PAYFAST MODAL (WITH DROPDOWN FOR DONATION PURPOSE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-24 sm:pb-6 bg-[#0A0B0D]/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F1115] border-2 border-amber-500/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-300 my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-5 flex items-center justify-between text-slate-950 shrink-0">
              <div className="flex items-center space-x-2">
                {paymentMethod === 'payfast' ? (
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 fill-slate-950" />
                ) : (
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                )}
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider leading-none">
                    {paymentMethod === 'payfast' ? '⚡ Instant Online Checkout' : '🏦 Pay & Attach Proof of Payment'}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase">
                    Live Traffic NPC • {paymentMethod === 'payfast' ? 'PayFast Secure Gateway' : 'Direct EFT / FNB'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {donatedSuccess ? (
              <div className="p-8 text-center space-y-4 overflow-y-auto">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-xl font-black text-white uppercase tracking-wide">
                  Contribution & Proof Received!
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong className="text-amber-400">{donorName || 'Kind Supporter'}</strong>! Your contribution of <strong className="text-amber-400">R{amount}</strong> has been logged to the Wall of Heroes. Your proof of payment has been recorded for verification.
                </p>
                {referenceNumber && (
                  <div className="bg-[#0A0B0D] p-3 rounded-xl border border-amber-500/40 text-xs font-mono text-amber-400 inline-block">
                    REF: {referenceNumber}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin flex-1 pb-8">

                {/* Payment Gateway Method Switcher */}
                <div className="bg-[#0A0B0D] p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('payfast')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      paymentMethod === 'payfast'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>⚡ PayFast Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('eft')}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      paymentMethod === 'eft'
                        ? 'bg-[#1C212D] text-amber-400 border border-amber-500/40 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>🏦 Manual EFT & POP</span>
                  </button>
                </div>
                
                {/* 1. DROP DOWN MENU TO SELECT WHAT YOU ARE DONATING FOR */}
                <div className="bg-[#0A0B0D] p-4 rounded-2xl border border-slate-800 space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span>What are you donating for? (Select Purpose)</span>
                    <span className="text-[10px] text-slate-400 font-normal">Select category</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      if (cat === 'pothole_repair') {
                        setIsModalOpen(false);
                        setPotholePaymentMethod(paymentMethod);
                        setIsPotholeModalOpen(true);
                        return;
                      }
                      setSelectedCategory(cat);
                      if (cat === 'advance_driving') {
                        setAmount(1500);
                        setReferenceNumber(`DRIVE-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      } else if (cat === 'coffee') {
                        setAmount(100);
                        setReferenceNumber(`COFFEE-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      } else if (cat === 'fuel') {
                        setAmount(800);
                        setReferenceNumber(`FUEL-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      } else if (cat === 'equipment') {
                        setAmount(350);
                        setReferenceNumber(`GEAR-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      } else if (cat === 'medical_sos') {
                        setAmount(250);
                        setReferenceNumber(`SOS-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      } else {
                        setReferenceNumber(`DONATION-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      }
                    }}
                    className="w-full bg-[#12151D] border-2 border-amber-500/40 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="coffee">☕ Buy a Coffee / Meal for Night Patrol (R100)</option>
                    <option value="advance_driving">🏎️ Advance Driving Course Registration / Sponsorship (R1,500)</option>
                    <option value="pothole_repair">🔨 Fix a Pothole / Road Repair Patch (R350 / Hole)</option>
                    <option value="fuel">⛽ Patrol Vehicle Fuel Sponsorship (R800)</option>
                    <option value="equipment">🔦 Patrol Equipment, Torches & High-Vis (R350)</option>
                    <option value="medical_sos">🚑 Emergency SOS & First Aid Response Kit (R250)</option>
                    <option value="custom">💖 General NPC Road Safety Community Fund (Custom Amount)</option>
                  </select>

                  {/* Purpose Explainer */}
                  <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    {selectedCategory === 'advance_driving' && (
                      <span className="text-amber-300 font-medium">
                        🎓 <strong>Advance Driving Masterclass:</strong> Defensive maneuvers, skidpan control, anti-hijack evasion, and emergency braking certification.
                      </span>
                    )}
                    {selectedCategory === 'coffee' && (
                      <span>☕ <strong>Night Watch Refreshment:</strong> Warm coffee, hot meals, and energy for volunteer patrol officers on cold night spike watches.</span>
                    )}
                    {selectedCategory === 'fuel' && (
                      <span>⛽ <strong>Patrol Fleet Fuel:</strong> Directly powers volunteer response vehicles cruising the N1, N4, R21, and M1 corridors.</span>
                    )}
                    {selectedCategory === 'equipment' && (
                      <span>🔦 <strong>Safety Gear:</strong> High-lumen searchlights, high-vis vests, debris rakes, and puncture repair gear.</span>
                    )}
                    {selectedCategory === 'medical_sos' && (
                      <span>🚑 <strong>Trauma & Medical Kit:</strong> Tourniquets, bandages, and emergency blankets for roadside motorist crashes.</span>
                    )}
                    {selectedCategory === 'custom' && (
                      <span>💖 <strong>General Road Safety:</strong> Directed to where emergency equipment or volunteer teams need it most.</span>
                    )}
                  </div>
                </div>

                {/* Amount & Reference / Quick Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Contribution Amount (R Rand)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-black text-amber-400 text-sm">R</span>
                      <input
                        type="number"
                        min="1"
                        required
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm font-black text-amber-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {paymentMethod === 'eft' ? (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        EFT Reference
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. DRIVE-SMITH"
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        Payment Gateway
                      </label>
                      <div className="bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PayFast Instant (Cards & EFT)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PAYFAST MODE HIGHLIGHT */}
                {paymentMethod === 'payfast' ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-amber-500/10 via-[#0A0B0D] to-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Zap className="w-3.5 h-3.5 fill-amber-400" />
                          <span>Instant Online Checkout</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                          256-Bit SSL Encrypted
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Redirects securely to PayFast to pay instantly via <strong>Capitec Pay</strong>, <strong>Instant EFT</strong> (ABSA, Standard Bank, Nedbank, FNB, Capitec, Discovery, TymeBank), <strong>Debit / Credit Cards</strong>, or <strong>Masterpass & Zapper QR</strong>.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-400 font-bold">
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">💳 Visa & Mastercard</span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">⚡ Capitec Pay</span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">🏦 Instant EFT</span>
                        <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">📱 Zapper / QR</span>
                      </div>
                    </div>

                    {/* Digital Receipt Contact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0A0B0D] p-3.5 rounded-2xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Email (For PayFast Receipt)
                        </label>
                        <input
                          type="email"
                          value={donorEmail}
                          onChange={(e) => setDonorEmail(e.target.value)}
                          placeholder="donor@example.co.za"
                          className="w-full bg-[#12151D] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Mobile Phone (Optional SMS)
                        </label>
                        <input
                          type="tel"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          placeholder="082 123 4567"
                          className="w-full bg-[#12151D] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* MANUAL EFT MODE */
                  <>
                    {/* BANKING DETAILS QUICK REVIEW BOX */}
                    <div className="bg-[#12141A] border border-amber-500/40 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span>Deposit Into Official NPC Account</span>
                        <span>First National Bank (FNB)</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-200">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Account Number</span>
                          <span className="font-black font-mono text-white text-sm">6308 982 3728</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('63089823728', 'modal_acc')}
                          className="bg-[#0A0B0D] hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition"
                        >
                          {copiedField === 'modal_acc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedField === 'modal_acc' ? 'Copied' : 'Copy Acc'}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-slate-200">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Branch Code</span>
                          <span className="font-bold font-mono text-white">250 655</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">Reference</span>
                          <span className="font-mono text-amber-400 font-bold text-[11px]">{referenceNumber || 'DONATION'}</span>
                        </div>
                      </div>
                    </div>

                    {/* ATTACH PROOF OF PAYMENT (POP) UPLOADER */}
                    <div className="space-y-2 bg-[#0A0B0D] p-4 rounded-2xl border border-slate-800">
                      <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                        <span className="flex items-center space-x-1.5">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>Attach Proof of Payment (POP)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Screenshot / Receipt photo</span>
                      </label>

                      {/* POP Preview if attached */}
                      {proofOfPaymentUrl && proofOfPaymentUrl.trim() ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 p-2 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={proofOfPaymentUrl} 
                              alt="Proof of Payment" 
                              className="w-12 h-12 object-cover rounded-lg border border-slate-800" 
                            />
                            <div>
                              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Proof of Payment Attached!</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block">Ready to upload with donation</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofOfPaymentUrl('')}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-xs font-bold cursor-pointer transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="bg-[#12151D] hover:bg-slate-800 border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-xl py-3 px-4 text-xs font-bold text-amber-400 flex items-center justify-center space-x-2 cursor-pointer transition">
                          <Camera className="w-4 h-4" />
                          <span>Upload Bank Receipt / POP Screenshot</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handlePopUpload(e, false)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </>
                )}

                {/* Donor Details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Your Name / Company (Optional)
                    </label>
                    <input
                      type="text"
                      disabled={isAnonymous}
                      value={donorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDonorName(val);
                        if (val.trim()) {
                          const catCode = selectedCategory === 'advance_driving' ? 'DRIVE' : selectedCategory === 'coffee' ? 'COFFEE' : selectedCategory === 'fuel' ? 'FUEL' : 'DONATION';
                          setReferenceNumber(`${catCode}-${val.trim().replace(/\s+/g, '').toUpperCase()}`);
                        }
                      }}
                      placeholder="e.g. Gareth M."
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-40 font-medium"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anon"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-slate-800 text-amber-500 focus:ring-0"
                    />
                    <label htmlFor="anon" className="text-xs text-slate-400">Display anonymously on the Wall of Heroes</label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Message / Special Instructions (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={2}
                      placeholder={selectedCategory === 'advance_driving' ? 'e.g. Booking for myself / Sponsor young patrol volunteer' : 'Keep up the great work keeping our highways safe!'}
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    />
                  </div>
                </div>

                {/* Submit / Checkout Button */}
                {paymentMethod === 'payfast' ? (
                  <button
                    type="button"
                    onClick={() => handlePayFastGeneralCheckout()}
                    disabled={isProcessingPayfast}
                    className="w-full py-4 bg-[#FAF4EA] hover:bg-white text-[#0D1422] font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl cursor-pointer border-2 border-[#D4A237] flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-[#D4A237] fill-[#D4A237]" />
                    <span>
                      {isProcessingPayfast ? 'Connecting to PayFast Gateway...' : `⚡ Proceed to PayFast Checkout (R${amount})`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#FAF4EA] hover:bg-white text-[#0D1422] font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl cursor-pointer border-2 border-[#D4A237] flex items-center justify-center space-x-2 active:scale-95"
                  >
                    <Upload className="w-4 h-4 text-[#D4A237]" />
                    <span>
                      {isSubmitting ? 'Recording Contribution & POP...' : `Confirm R${amount} Contribution & Submit POP`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCE DRIVING COURSE FULL DETAILS MODAL */}
      {isDrivingCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-24 sm:pb-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F1115] border-2 border-amber-500/70 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-200 my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-5 flex items-center justify-between text-slate-950 shrink-0">
              <div className="flex items-center space-x-2">
                <Car className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider leading-none">
                    Advance Driving Course Masterclass
                  </h3>
                  <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase">
                    Live Traffic NPC • Defensive Driving & Anti-Hijack Training
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDrivingCourseModalOpen(false)}
                className="p-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin flex-1 text-xs sm:text-sm text-slate-300">
              
              {/* Highlight Intro */}
              <div className="bg-[#0A0B0D] p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider block">
                  Why Take The Live Traffic NPC Advance Driving Course?
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  South African highways present unique perils: sudden sharp spike strips, wet flash floods, aggressive hijack box-in ambushes, and severe road surface potholes. This hands-on masterclass transforms everyday drivers into confident, situationally aware defensive operators.
                </p>
              </div>

              {/* Course Syllabus Grid */}
              <div className="space-y-3">
                <h4 className="font-black text-white text-xs uppercase tracking-wider text-amber-400">
                  Comprehensive 5-Module Practical Curriculum
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#12151D] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                      <Shield className="w-4 h-4 shrink-0" />
                      <span>1. Anti-Hijack & Box-in Escapes</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Safe following distances at intersections, reverse J-turn evasion, identifying suspicious vehicles, and de-escalation tactics.
                    </p>
                  </div>

                  <div className="bg-[#12151D] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                      <Car className="w-4 h-4 shrink-0" />
                      <span>2. Skidpan & Wet Surface Control</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Aquaplaning correction, threshold cadence braking, handling sudden traction loss, and mastering oversteer/understeer.
                    </p>
                  </div>

                  <div className="bg-[#12151D] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>3. Spike Trap & Obstacle Swerve</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      High-speed lane changes, tyre blowout vehicle stability control, navigating sharp rocks/debris, and safely reaching lit shoulders.
                    </p>
                  </div>

                  <div className="bg-[#12151D] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                      <GraduationCap className="w-4 h-4 shrink-0" />
                      <span>4. Certification & Certificate</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Graduates receive the official Live Traffic NPC Defensive Driving Certificate and vehicle windshield credential badge.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing & Booking Action */}
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">Course Fee / Sponsorship</span>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    R1,500 <span className="text-xs font-bold text-slate-400 uppercase font-sans">ZAR (All Inclusive)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Includes track time, instructor grading & certified credential</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => {
                      setIsDrivingCourseModalOpen(false);
                      setSelectedCategory('advance_driving');
                      setAmount(1500);
                      setReferenceNumber(`DRIVE-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      setPaymentMethod('payfast');
                      setIsModalOpen(true);
                    }}
                    className="py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black uppercase tracking-wider rounded-xl text-xs transition shadow-lg cursor-pointer flex items-center justify-center space-x-1.5 border border-amber-300"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>⚡ PayFast Online Checkout (R1,500)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDrivingCourseModalOpen(false);
                      setSelectedCategory('advance_driving');
                      setAmount(1500);
                      setReferenceNumber(`DRIVE-${(donorName || 'SUPPORTER').replace(/\s+/g, '').toUpperCase()}`);
                      setPaymentMethod('eft');
                      setIsModalOpen(true);
                    }}
                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold uppercase tracking-wider rounded-xl text-xs transition border border-slate-700 cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Upload className="w-4 h-4" />
                    <span>EFT & Attach POP</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* DEDICATED POTHOLE REPAIR DONATION MODAL */}
      {isPotholeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pb-24 sm:pb-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0F1115] border-2 border-amber-500/70 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-200 my-auto flex flex-col max-h-[85vh] sm:max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-4 sm:p-5 flex items-center justify-between text-slate-950 shrink-0">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider leading-none">
                    Donate to Fix a Pothole
                  </h3>
                  <span className="text-[10px] font-bold text-slate-900 tracking-wider uppercase">
                    R350 ZAR Per Hole Fixed • {potholePaymentMethod === 'payfast' ? 'PayFast Online' : 'Manual EFT'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsPotholeModalOpen(false)}
                className="p-1 rounded-xl bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {donatedSuccess ? (
              <div className="p-8 text-center space-y-4 overflow-y-auto">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-xl font-black text-white uppercase tracking-wide">
                  Pothole Repair Contribution Received!
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you! Your <strong className="text-amber-400">R{potholesCount * 350}</strong> donation for <strong className="text-amber-400">{potholesCount} pothole(s)</strong> near <strong className="text-white">{potholeLocation}</strong> has been logged. Our cold-asphalt patch patrol crew is notified!
                </p>
                <div className="bg-[#0A0B0D] p-3 rounded-xl border border-amber-500/40 text-xs font-mono text-amber-400">
                  REF: POTHOLE - {potholeDonorName || 'DONOR'}
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin flex-1 pb-8">

                {/* Payment Gateway Method Switcher */}
                <div className="bg-[#0A0B0D] p-1.5 rounded-2xl border border-slate-800 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPotholePaymentMethod('payfast')}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      potholePaymentMethod === 'payfast'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>⚡ PayFast Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPotholePaymentMethod('eft')}
                    className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      potholePaymentMethod === 'eft'
                        ? 'bg-[#1C212D] text-amber-400 border border-amber-500/40 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>🏦 Manual EFT & POP</span>
                  </button>
                </div>

                {/* Number of Potholes Selector */}
                <div className="bg-[#0A0B0D] p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                      <Wrench className="w-4 h-4 text-amber-400" />
                      <span>Number of Potholes to Fix (R350 / Hole)</span>
                    </label>
                    <span className="text-sm font-black text-white bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-lg">
                      R{potholesCount * 350} ZAR
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {[1, 2, 3, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setPotholesCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer border ${
                          potholesCount === cnt
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg'
                            : 'bg-[#0F1115] text-slate-300 border-slate-800 hover:border-amber-500/50'
                        }`}
                      >
                        {cnt} {cnt === 1 ? 'Hole' : 'Holes'} <br />
                        <span className="text-[9px] opacity-80">(R{cnt * 350})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. Picture of the Pothole */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>1. Picture of the Pothole</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Photo upload or preset</span>
                  </label>

                  {/* Photo Preview Card */}
                  {potholeImageUrl && (
                    <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 max-h-48 group bg-slate-950">
                      <img
                        src={potholeImageUrl}
                        alt="Pothole Preview"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-bold text-amber-300">
                        <span className="flex items-center space-x-1 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Pothole Photo Attached</span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Upload Controls */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 bg-[#0A0B0D] hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl py-2.5 px-3 text-xs font-bold text-amber-400 flex items-center justify-center space-x-2 cursor-pointer transition">
                      <Upload className="w-4 h-4" />
                      <span>Upload Pothole Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Quick Select from Reported Map Potholes */}
                    {reportedPotholes.length > 0 && (
                      <select
                        onChange={(e) => {
                          const rep = reportedPotholes.find(r => r.id === e.target.value);
                          if (rep) {
                            if (rep.imageUrl) setPotholeImageUrl(rep.imageUrl);
                            setPotholeLocation(rep.locationName || rep.title);
                            setPotholeLat(rep.latitude);
                            setPotholeLng(rep.longitude);
                          }
                        }}
                        className="bg-[#0A0B0D] border border-slate-700 rounded-xl px-2.5 py-2.5 text-[11px] font-bold text-slate-200 focus:outline-none focus:border-amber-500 max-w-[160px]"
                      >
                        <option value="">Select Reported Pothole...</option>
                        {reportedPotholes.map(r => (
                          <option key={r.id} value={r.id}>
                            📍 {r.locationName || r.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* 2. Pin Location */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>2. Pin Location & Road Name</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGetGpsLocation(true)}
                      disabled={isLocatingGps}
                      className="text-[10px] font-bold text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isLocatingGps ? 'Locating...' : '📍 Use Current GPS Pin'}</span>
                    </button>
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={potholeLocation}
                      onChange={(e) => setPotholeLocation(e.target.value)}
                      placeholder="e.g. Kliprivier Offramp, R59 South"
                      className="w-full bg-[#0A0B0D] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-500 pl-9"
                    />
                    <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* PayFast Mode receipt fields vs EFT */}
                {potholePaymentMethod === 'payfast' ? (
                  <div className="bg-gradient-to-r from-amber-500/10 via-[#0A0B0D] to-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                        <span>Instant Online Payment</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                        PayFast Protected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="email"
                        value={potholeDonorEmail}
                        onChange={(e) => setPotholeDonorEmail(e.target.value)}
                        placeholder="Email for PayFast receipt"
                        className="w-full bg-[#12151D] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                      />
                      <input
                        type="tel"
                        value={potholeDonorPhone}
                        onChange={(e) => setPotholeDonorPhone(e.target.value)}
                        placeholder="Mobile phone (optional)"
                        className="w-full bg-[#12151D] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  /* 3. Attach Proof of Payment for Pothole (Optional EFT) */
                  <div className="space-y-2 bg-[#0A0B0D] p-3.5 rounded-2xl border border-slate-800">
                    <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>3. Attach Proof of Payment (POP)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">Optional EFT receipt</span>
                    </label>

                    {potholePopUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-950 p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img src={potholePopUrl} alt="POP" className="w-10 h-10 object-cover rounded-lg border border-slate-800" />
                          <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>POP Attached</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPotholePopUrl('')}
                          className="p-1 bg-red-500/20 text-red-300 rounded-md text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="bg-[#12151D] hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-xl py-2 px-3 text-xs font-bold text-amber-400 flex items-center justify-center space-x-2 cursor-pointer transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Proof of Payment</span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handlePopUpload(e, true)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* 4. Donor Details */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Donor / Sponsor Name
                    </label>
                    <input
                      type="text"
                      disabled={potholeIsAnonymous}
                      value={potholeDonorName}
                      onChange={(e) => setPotholeDonorName(e.target.value)}
                      placeholder="e.g. Gareth M. or Business Name"
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-40"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="anonPothole"
                      checked={potholeIsAnonymous}
                      onChange={(e) => setPotholeIsAnonymous(e.target.checked)}
                      className="rounded border-slate-800 text-amber-500 focus:ring-0"
                    />
                    <label htmlFor="anonPothole" className="text-xs text-slate-400">
                      Sponsor anonymously
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Dedication or Support Note (Optional)
                    </label>
                    <textarea
                      value={potholeMessage}
                      onChange={(e) => setPotholeMessage(e.target.value)}
                      rows={2}
                      placeholder="e.g. Save those tyres on R59!"
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Donation Calculation Summary */}
                <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">Total Donation</span>
                    <span className="text-xs font-bold text-slate-300">
                      {potholesCount} Pothole(s) × R350
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">
                    R{potholesCount * 350} ZAR
                  </div>
                </div>

                {/* Submit Action Button */}
                {potholePaymentMethod === 'payfast' ? (
                  <button
                    type="button"
                    onClick={() => handlePayFastPotholeCheckout()}
                    disabled={isProcessingPayfast}
                    className="w-full py-4 bg-[#FAF4EA] hover:bg-white text-[#0D1422] font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl cursor-pointer flex items-center justify-center space-x-2 border-2 border-[#D4A237] active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-[#D4A237] fill-[#D4A237]" />
                    <span>
                      {isProcessingPayfast ? 'Connecting to PayFast Gateway...' : `⚡ PayFast Online Checkout (R${potholesCount * 350})`}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePotholeSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#FAF4EA] hover:bg-white text-[#0D1422] font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition shadow-2xl cursor-pointer flex items-center justify-center space-x-2 border-2 border-[#D4A237] active:scale-95"
                  >
                    <Wrench className="w-4 h-4 text-[#D4A237]" />
                    <span>
                      {isSubmitting ? 'Recording Sponsorship...' : `Confirm R${potholesCount * 350} Pothole Donation`}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYFAST DIRECT CHECKOUT & REDIRECT SCREEN */}
      {payfastModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0D0F14] border-2 border-amber-400/80 rounded-3xl max-w-lg w-full p-6 space-y-5 relative shadow-[0_0_60px_rgba(245,158,11,0.25)] text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-md">
                  <Zap className="w-6 h-6 fill-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center space-x-1.5">
                    <Lock className="w-3 h-3" />
                    <span>Official PayFast Gateway (SA)</span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    Secure Online Checkout
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setPayfastModalData(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-[#141822] border border-amber-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Beneficiary Merchant:</span>
                <span className="font-bold text-slate-200">Live Traffic NPC (ID: 24265929)</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Item / Purpose:</span>
                <span className="font-bold text-slate-200 truncate max-w-[220px]">{payfastModalData.title}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span>Payment Reference ID:</span>
                <span className="font-mono font-bold text-amber-400 text-[11px]">{payfastModalData.paymentId}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">Total Contribution:</span>
                <span className="text-2xl font-black text-amber-400">R{payfastModalData.amount.toFixed(2)} ZAR</span>
              </div>
            </div>

            {/* PayFast Status Hint */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300/90 leading-relaxed flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                A secure PayFast payment tab has been triggered. If your browser blocked the automatic new tab, click the golden button below to proceed to PayFast directly.
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => submitPayFastForm(payfastModalData.processUrl, payfastModalData.paymentFields, true)}
                  className="py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black uppercase tracking-wider rounded-2xl text-xs transition shadow-2xl border-2 border-amber-300 cursor-pointer flex items-center justify-center space-x-1.5 group"
                >
                  <Zap className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition" />
                  <span>⚡ Pay in New Tab</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => submitPayFastForm(payfastModalData.processUrl, payfastModalData.paymentFields, false)}
                  className="py-3.5 px-4 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-black uppercase tracking-wider rounded-2xl text-xs transition border-2 border-amber-400/50 hover:border-amber-400 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>➡️ Pay Here (Direct)</span>
                </button>
              </div>

              <button
                type="button"
                disabled={isVerifyingPayfast}
                onClick={() => handleVerifyPayFastPayment(payfastModalData.paymentId, {
                  category: payfastModalData.category || selectedCategory,
                  amount: payfastModalData.amount,
                  donorName: isAnonymous ? 'Anonymous Resident' : (donorName || potholeDonorName),
                  message: message || potholeMessage,
                  potholeLocation: potholeLocation
                })}
                className="w-full py-3.5 px-4 bg-[#141822] hover:bg-[#1A2030] text-emerald-400 hover:text-emerald-300 font-black uppercase tracking-wider rounded-2xl text-xs sm:text-sm transition border-2 border-emerald-500/40 hover:border-emerald-400 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isVerifyingPayfast ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Verifying PayFast Transaction...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>✅ I Have Completed Payment (Verify & Record)</span>
                  </>
                )}
              </button>
            </div>

            {/* Supported Payment Logos / Badges */}
            <div className="text-[11px] text-center text-slate-500 space-y-1 pt-1">
              <div className="font-semibold text-slate-400">Supported PayFast Payment Options:</div>
              <div>Capitec Pay • Instant EFT (All SA Banks) • Visa & Mastercard • Zapper • Masterpass</div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW FOR PROOF OF PAYMENT */}
      {selectedProofPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-[#0F1115] border-2 border-amber-500/60 rounded-3xl max-w-xl w-full p-4 space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                <FileText className="w-4 h-4" />
                <span>Proof of Payment Verification Document</span>
              </span>
              <button
                onClick={() => setSelectedProofPreview(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800">
              <img src={selectedProofPreview} alt="POP Full Preview" className="w-full object-contain" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
