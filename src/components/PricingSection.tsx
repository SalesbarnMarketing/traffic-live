import React, { useState, useEffect } from 'react';
import {
  Shield,
  Check,
  Star,
  Users,
  Share2,
  FileText,
  Megaphone,
  CreditCard,
  Building2,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Sparkles,
  Award,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Zap,
  Lock,
  ArrowRight,
  Copy,
  CheckCircle2,
  X,
  Radio,
  Clock,
  HeartHandshake,
  Upload,
  Image as ImageIcon,
  Calendar,
  CalendarDays,
  Layers,
  Eye,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { AdvertisingPackage, IndividualAdOption, RegisteredUser } from '../types';
import { initiatePayFastPayment, submitPayFastForm, PayFastPaymentResponse } from '../utils/payfast';
import { LiveTrafficLogo } from './LiveTrafficLogo';
import { WhatsAppIcon } from './WhatsAppIcon';

interface PricingSectionProps {
  currentUser?: RegisteredUser | null;
  onSwitchTab?: (tab: any) => void;
}

export const RECOMMENDED_PACKAGES: AdvertisingPackage[] = [
  {
    id: 'pkg-starter',
    name: 'STARTER',
    price: 500,
    period: 'month',
    subtitle: 'SMALL BUSINESS ADVERT',
    themeColor: 'emerald',
    features: [
      '1 advert per week',
      'WhatsApp Channel',
      'Facebook',
      'X (Twitter)',
      '4 adverts per month'
    ],
    bestFor: 'GREAT FOR: local businesses and service providers wanting affordable exposure.',
    badge: 'Affordable Entry'
  },
  {
    id: 'pkg-business',
    name: 'BUSINESS',
    price: 1000,
    period: 'month',
    subtitle: 'REGULAR EXPOSURE',
    themeColor: 'blue',
    features: [
      '1 advert per day',
      'WhatsApp Channel',
      'Facebook',
      'X (Twitter)',
      'Up to 30 adverts per month',
      'Advert supplied by client'
    ],
    bestFor: 'BEST VALUE: consistent daily visibility at a great price.',
    badge: 'BEST VALUE',
    isPopular: true
  },
  {
    id: 'pkg-premium',
    name: 'PREMIUM',
    price: 2000,
    period: 'month',
    subtitle: 'BUSINESS + ARTICLE',
    themeColor: 'amber',
    features: [
      '1 advert per day',
      'WhatsApp Channel',
      'Facebook',
      'X (Twitter)',
      '1 sponsored article per week',
      'Up to 4 sponsored articles per month',
      'Business mentioned / tagged where appropriate'
    ],
    bestFor: 'IDEAL FOR: established businesses and service providers.',
    badge: 'HIGH IMPACT'
  },
  {
    id: 'pkg-featured',
    name: 'FEATURED PARTNER',
    price: 3500,
    period: 'month',
    subtitle: 'MAXIMUM EXPOSURE',
    themeColor: 'rose',
    features: [
      '1 advert per day',
      'WhatsApp Channel',
      'Facebook',
      'X (Twitter)',
      '1 sponsored article per week',
      'Featured business of the week',
      'Priority placement',
      'Up to 4 sponsored articles per month',
      'Business supplied promotional material can be adapted for social media'
    ],
    bestFor: 'LIMITED SLOTS: only a select number of partners each month.',
    badge: 'LIMITED SLOTS'
  }
];

export const INDIVIDUAL_OPTIONS: IndividualAdOption[] = [
  {
    id: 'ind-whatsapp',
    name: '1 WhatsApp Advert',
    price: 250,
    iconType: 'whatsapp',
    description: 'Direct broadcast to 104K+ verified active WhatsApp channel subscribers'
  },
  {
    id: 'ind-facebook',
    name: '1 Facebook Advert',
    price: 200,
    iconType: 'facebook',
    description: 'Post to 24K+ highly engaged Facebook community followers'
  },
  {
    id: 'ind-twitter',
    name: '1 X (Twitter) Advert',
    price: 150,
    iconType: 'twitter',
    description: 'Real-time alert post to our 1.8K+ X (Twitter) live commuter audience'
  },
  {
    id: 'ind-wa-fb',
    name: 'WhatsApp + Facebook',
    price: 350,
    iconType: 'combo2',
    description: 'Dual channel cross-promotion across WhatsApp and Facebook'
  },
  {
    id: 'ind-wa-fb-x',
    name: 'WhatsApp + Facebook + X',
    price: 450,
    iconType: 'combo3',
    description: 'Triple power social blast across all 3 major Live Traffic platforms'
  },
  {
    id: 'ind-article',
    name: 'Sponsored Article',
    price: 600,
    iconType: 'article',
    description: 'Dedicated editorial spotlight / sponsored brand story feature'
  },
  {
    id: 'ind-article-social',
    name: 'Sponsored Article + Social Promotion',
    price: 750,
    iconType: 'article_social',
    description: 'Complete editorial feature paired with social distribution across all channels'
  }
];

export const PricingSection: React.FC<PricingSectionProps> = ({ currentUser, onSwitchTab }) => {
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    name: string;
    price: number;
    subtitle?: string;
    isMonthly?: boolean;
  } | null>(null);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState(
    currentUser ? `${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim() : ''
  );
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.cellNumber || '');
  const [website, setWebsite] = useState('');
  const [adNotes, setAdNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'eft'>('payfast');

  // Ad Image Upload & Duration State
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  const [adImageFileName, setAdImageFileName] = useState<string | null>(null);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [startSchedule, setStartSchedule] = useState<'immediate' | 'custom'>('immediate');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isDragging, setIsDragging] = useState(false);

  // Loading & Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [copiedBankField, setCopiedBankField] = useState<string | null>(null);

  // PayFast dynamic fallback modal
  const [payfastModalData, setPayfastModalData] = useState<{
    processUrl: string;
    paymentFields: Record<string, string>;
    paymentId: string;
  } | null>(null);

  // Sync user details if logged in
  useEffect(() => {
    if (currentUser) {
      if (!contactName) {
        setContactName(`${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim());
      }
      if (!email) setEmail(currentUser.email || '');
      if (!phone) setPhone(currentUser.cellNumber || '');
    }
  }, [currentUser]);

  // Check URL query parameters for payment return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const paymentId = params.get('payment_id') || localStorage.getItem('pending_payfast_id');
    const category = params.get('category');

    if (paymentStatus === 'success' && paymentId && (category === 'advertising' || category === 'advertising_package')) {
      let cachedMeta: any = {};
      try {
        const stored = localStorage.getItem('pending_payfast_meta');
        if (stored) cachedMeta = JSON.parse(stored);
      } catch (e) {
        // Ignored
      }

      // Confirm with server
      fetch('/api/payfast/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          category: category || cachedMeta.category || 'advertising_package',
          amount: cachedMeta.amount,
          donorName: cachedMeta.donorName,
          message: cachedMeta.message
        })
      })
        .then(res => res.json())
        .then(data => {
          setSuccessOrder({
            id: paymentId,
            referenceNumber: `PF-${paymentId.replace(/^PF-/, '')}`,
            amount: data?.donation?.amount || cachedMeta.amount || 500,
            packageName: data?.donation?.message || cachedMeta.message || 'Advertising Package',
            businessName: data?.donation?.donorName || cachedMeta.donorName || 'Valued Advertiser',
            paymentMethod: 'payfast'
          });
          setIsCheckoutOpen(true);
          localStorage.removeItem('pending_payfast_id');
          localStorage.removeItem('pending_payfast_meta');
        })
        .catch(err => {
          console.warn('Payment confirmation error:', err);
        });
    }
  }, []);

  const handleOpenCheckout = (item: {
    id: string;
    name: string;
    price: number;
    subtitle?: string;
    isMonthly?: boolean;
  }) => {
    setSelectedItem(item);
    setDurationDays(item.isMonthly ? 30 : 7);
    setErrorMessage(null);
    setSuccessOrder(null);
    setPayfastModalData(null);
    setIsCheckoutOpen(true);
  };

  const handleImageFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please choose a smaller image.');
      return;
    }
    setAdImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAdImagePreview(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCopyText = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankField(fieldKey);
    setTimeout(() => setCopiedBankField(null), 2000);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!businessName.trim()) {
      setErrorMessage('Please enter your business or company name.');
      return;
    }
    if (!contactName.trim()) {
      setErrorMessage('Please enter a contact person name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter a contact phone or WhatsApp number.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const fullItemTitle = `${selectedItem.name} ${selectedItem.isMonthly ? '(Monthly)' : '(Once-off)'}`;
    const finalAdImage = adImagePreview || undefined;
    const computedDuration = selectedItem.isMonthly ? (durationDays || 30) : (durationDays || 7);
    const chosenStartDate = startSchedule === 'custom' && customStartDate ? new Date(customStartDate).toISOString() : new Date().toISOString();

    const customMessage = `Ad Booking: ${selectedItem.name} - ${businessName.trim()}${website ? ` (${website.trim()})` : ''} - Rotation: ${computedDuration} Days - Notes: ${adNotes.trim() || 'Standard campaign'}`;

    try {
      // 1. Always submit the ad booking & image creative to the ad management queue
      const orderRes = await fetch('/api/ads/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: selectedItem.id,
          packageName: fullItemTitle,
          amount: selectedItem.price,
          businessName: businessName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          website: website.trim() || undefined,
          notes: adNotes.trim() || undefined,
          adImageUrl: finalAdImage,
          durationDays: computedDuration,
          startDate: chosenStartDate,
          paymentMethod
        })
      });

      const orderData = await orderRes.json();
      const refNumber = orderData?.order?.referenceNumber || `AD-${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`;

      if (paymentMethod === 'payfast') {
        const response = await initiatePayFastPayment({
          amount: selectedItem.price,
          itemName: `Live Traffic NPC Ad: ${selectedItem.name}`,
          itemDescription: `Live Traffic NPC Advertising: ${fullItemTitle} - Business: ${businessName} - Ref: ${refNumber}`,
          category: 'advertising_package',
          donorName: `${businessName.trim()} (${contactName.trim()})`,
          donorEmail: email.trim(),
          donorPhone: phone.trim(),
          message: customMessage,
          isAnonymous: false,
          potholeLocation: website.trim() || undefined
        });

        setPayfastModalData({
          processUrl: response.processUrl,
          paymentFields: response.paymentFields,
          paymentId: response.paymentId
        });
      } else {
        // Direct Bank EFT Submission
        setSuccessOrder({
          id: refNumber,
          referenceNumber: refNumber,
          amount: selectedItem.price,
          packageName: fullItemTitle,
          businessName: businessName.trim(),
          paymentMethod: 'eft',
          durationDays: computedDuration,
          adImageUrl: finalAdImage
        });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Could not initiate booking. Please try again or contact 067 708 3048.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#070A10] text-slate-100 pb-24 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* HERO & RATE CARD HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0B1526] via-[#08101C] to-[#070A10] border-b border-[#D4A237]/40 pt-7 pb-10 px-4 sm:px-6 lg:px-8 shadow-2xl">
        {/* Subtle Background Glow Elements */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          {/* Logo & Headline */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center justify-center space-x-3.5">
              <div className="shrink-0 flex items-center justify-center">
                <LiveTrafficLogo size="xs" showText={false} withGlow={true} animateBeacon={true} className="w-14 h-16 sm:w-16 sm:h-18" />
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm font-black tracking-widest text-[#D4A237] uppercase bg-[#D4A237]/15 border border-[#D4A237] px-3 py-0.5 rounded-full">
                    ADVERTISE WITH US
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase font-sans drop-shadow-md">
                  LIVE TRAFFIC <span className="text-[#D4A237]">NPC</span>
                </h1>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider mt-2">
              ADVERTISE ON LIVE TRAFFIC NPC
            </h2>

            <p className="text-sm sm:text-base font-extrabold uppercase tracking-widest text-[#D4A237] max-w-xl mx-auto">
              Official Rate Card, Packages & Online Ad Booking Across South Africa
            </p>

            {/* Quick Link to Advertiser Dashboard */}
            {onSwitchTab && (
              <div className="pt-1">
                <button
                  onClick={() => onSwitchTab('advertiser')}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-[#D4A237]/60 text-xs sm:text-sm font-bold text-[#D4A237] hover:text-white transition shadow-md cursor-pointer group"
                >
                  <Eye className="w-4 h-4 text-[#D4A237] group-hover:scale-110 transition-transform" />
                  <span>Already an advertiser? View Your Campaign Dashboard & Clicks</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* SOCIAL STATS COUNTERS (Exact matching the image) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-3">
            {/* WhatsApp */}
            <div className="bg-[#0A0F1A] border border-emerald-500/50 hover:border-emerald-400 p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3 shadow-lg transition transform hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <WhatsAppIcon className="w-6 h-6 text-emerald-400 shrink-0" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-white leading-none">104K</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-tight">Followers</div>
                <div className="text-[11px] text-emerald-400 font-bold truncate">WhatsApp Channel</div>
              </div>
            </div>

            {/* Facebook */}
            <div className="bg-[#0A0F1A] border border-blue-500/50 hover:border-blue-400 p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3 shadow-lg transition transform hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                <span className="text-2xl font-black">f</span>
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-white leading-none">24K</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-tight">Followers</div>
                <div className="text-[11px] text-blue-400 font-bold truncate">Facebook</div>
              </div>
            </div>

            {/* X (Twitter) */}
            <div className="bg-[#0A0F1A] border border-slate-700 hover:border-slate-500 p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3 shadow-lg transition transform hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-full bg-black/70 border border-slate-700 flex items-center justify-center text-white shrink-0 shadow-inner">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-white leading-none">1.8K</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-tight">Followers</div>
                <div className="text-[11px] text-slate-400 font-bold truncate">X (Twitter)</div>
              </div>
            </div>

            {/* Combined */}
            <div className="bg-[#0A0F1A] border border-[#D4A237]/60 hover:border-[#D4A237] p-3.5 sm:p-4 rounded-2xl flex items-center space-x-3 shadow-lg transition transform hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-full bg-[#D4A237]/20 border border-[#D4A237]/60 flex items-center justify-center text-[#D4A237] shrink-0 shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-2xl sm:text-3xl font-black text-[#D4A237] leading-none">129.8K+</div>
                <div className="text-xs font-bold text-slate-200 uppercase tracking-tight">Combined</div>
                <div className="text-[11px] text-amber-300/90 font-bold truncate">Social Following</div>
              </div>
            </div>
          </div>

          {/* QUALITY PROMISE & EXCLUSIVITY BANNER */}
          <div className="bg-[#0A0F1A] border-2 border-[#D4A237]/50 rounded-2xl p-4 sm:p-5 max-w-4xl mx-auto shadow-2xl text-left grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex items-start space-x-3">
              <div className="w-11 h-11 rounded-xl bg-[#D4A237]/20 border border-[#D4A237] flex items-center justify-center text-[#D4A237] shrink-0 mt-0.5">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  WE DON'T FLOOD YOUR FEED WITH ADVERTISING
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  Live Traffic NPC deliberately limits advertising to protect the quality of our channels and respect our followers.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#05080E] p-3.5 rounded-xl border border-[#D4A237]/30">
              <div className="flex items-center space-x-2 text-amber-400">
                <Star className="w-5 h-5 fill-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                  Fewer adverts. Better visibility. More value for advertisers.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* SECTION 1: RECOMMENDED PACKAGES */}
        <div className="space-y-6">
          <div className="text-center space-y-1.5">
            <span className="inline-block bg-[#FAF4EA] text-[#070A10] border border-[#D4A237] font-black text-xs sm:text-sm px-4 py-1 rounded-full uppercase tracking-widest shadow-md">
              OUR RECOMMENDED PACKAGES
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">
              Monthly Partnership Tier Packages
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Consistent daily and weekly brand exposure with guaranteed social channel distribution
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {RECOMMENDED_PACKAGES.map((pkg) => {
              const isPopular = pkg.isPopular || pkg.id === 'pkg-business';

              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-3xl flex flex-col justify-between overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5 shadow-2xl ${
                    isPopular
                      ? 'bg-gradient-to-b from-[#122033] via-[#0E1B2C] to-[#0A0F1A] border-2 border-[#D4A237] shadow-amber-900/20'
                      : 'bg-gradient-to-b from-[#0F1A2A] via-[#0B1526] to-[#0A0F1A] border border-[#D4A237]/50 hover:border-[#D4A237]'
                  }`}
                >
                  {/* Top Badge */}
                  {pkg.badge && (
                    <div className="w-full text-center py-1.5 font-black text-[11px] uppercase tracking-widest">
                      <span
                        className={`inline-block px-3.5 py-0.5 rounded-full ${
                          isPopular
                            ? 'bg-[#FAF4EA] text-[#070A10] font-black border border-[#D4A237]'
                            : 'bg-[#15253D] text-[#D4A237] border border-[#D4A237]/50 font-black'
                        }`}
                      >
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {/* Header Box */}
                  <div className="p-5 text-center border-b border-[#D4A237]/25">
                    <h4 className="text-xl font-black tracking-wider uppercase text-[#D4A237]">
                      {pkg.name}
                    </h4>

                    {/* Price */}
                    <div className="flex items-baseline justify-center space-x-1 my-2.5">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        R{pkg.price.toLocaleString()}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase">/month</span>
                    </div>

                    <div className="text-xs font-black text-slate-200 uppercase tracking-wide">
                      {pkg.subtitle}
                    </div>

                    {/* Megaphone icon */}
                    <div className="mt-3 flex justify-center">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#15253D] text-[#D4A237] border border-[#D4A237]/50 shadow-inner">
                        <Megaphone className="w-6 h-6" />
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="p-5 flex-1 space-y-3">
                    <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                      {pkg.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#D4A237] stroke-[3]" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For Bottom Pill & Action */}
                  <div className="p-5 pt-0 space-y-3">
                    <div className="text-xs font-bold p-2.5 rounded-xl uppercase text-center leading-tight bg-[#05080E] text-slate-300 border border-[#D4A237]/30">
                      {pkg.bestFor}
                    </div>

                    <button
                      onClick={() =>
                        handleOpenCheckout({
                          id: pkg.id,
                          name: `${pkg.name} Package`,
                          price: pkg.price,
                          subtitle: pkg.subtitle,
                          isMonthly: true
                        })
                      }
                      className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer transform active:scale-95 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237]"
                    >
                      <CreditCard className="w-4 h-4 shrink-0 text-[#070A10]" />
                      <span>Book Package</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PARTNER LIMIT NOTIFICATION */}
          <div className="bg-[#0A0F1A] border border-[#D4A237]/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider block">
                  WE LIMIT THE NUMBER OF ADVERTISERS EACH MONTH
                </span>
                <span className="text-xs text-slate-300">
                  To keep our channel clean, valuable and trusted by our community.
                </span>
              </div>
            </div>

            <div className="bg-[#05080E] px-4 py-2 rounded-xl border border-[#D4A237] text-[#D4A237] font-black text-xs sm:text-sm uppercase tracking-widest shrink-0">
              LIMITED TO 20 – 30 PARTNERS PER MONTH
            </div>
          </div>
        </div>

        {/* SECTION 2: INDIVIDUAL ADVERTISING OPTIONS */}
        <div className="space-y-6 pt-4">
          <div className="text-center space-y-1.5">
            <span className="inline-block bg-[#0A0F1A] text-[#D4A237] font-bold text-xs px-4 py-1 rounded-full uppercase tracking-widest border border-[#D4A237]/50">
              INDIVIDUAL ADVERTISING OPTIONS
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">
              A La Carte & Once-Off Options
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              Select specific platform broadcasts or standalone article features
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {INDIVIDUAL_OPTIONS.map((item) => (
              <div
                key={item.id}
                className="bg-[#0A0F1A] hover:bg-[#0C1727] border border-[#D4A237]/40 hover:border-[#D4A237] p-4 sm:p-5 rounded-2xl flex flex-col justify-between space-y-3.5 transition shadow-xl group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {item.iconType === 'whatsapp' && (
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                          <WhatsAppIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                        </div>
                      )}
                      {item.iconType === 'facebook' && (
                        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 font-black text-base">
                          f
                        </div>
                      )}
                      {item.iconType === 'twitter' && (
                        <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center border border-slate-700">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </div>
                      )}
                      {item.iconType === 'combo2' && (
                        <div className="flex -space-x-1">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs font-bold">
                            WA
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center text-xs font-bold">
                            FB
                          </div>
                        </div>
                      )}
                      {item.iconType === 'combo3' && (
                        <div className="flex -space-x-1">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                            WA
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center text-[10px] font-bold">
                            FB
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">
                            X
                          </div>
                        </div>
                      )}
                      {(item.iconType === 'article' || item.iconType === 'article_social') && (
                        <div className="w-9 h-9 rounded-xl bg-[#D4A237]/20 text-[#D4A237] flex items-center justify-center border border-[#D4A237]">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}

                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">{item.name}</h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-snug">{item.description}</p>
                </div>

                <div className="pt-2.5 border-t border-[#D4A237]/30 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-black text-[#D4A237]">R{item.price}</span>
                    <span className="text-[10px] text-slate-400 ml-1">once-off</span>
                  </div>

                  <button
                    onClick={() =>
                      handleOpenCheckout({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        subtitle: item.description,
                        isMonthly: false
                      })
                    }
                    className="bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl flex items-center space-x-1 transition shadow cursor-pointer group-hover:scale-105"
                  >
                    <span>Book Now</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#070A10]" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-slate-400 italic">
            * All adverts and articles are subject to content approval.
          </div>
        </div>

        {/* SECTION 3: ADVERTISING WITH PURPOSE */}
        <div className="bg-gradient-to-r from-[#110D05] via-[#1A1408] to-[#110D05] border-2 border-[#D4A237]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <HeartHandshake className="w-8 h-8 text-[#D4A237]" />
            <h3 className="text-lg sm:text-2xl font-black text-[#D4A237] uppercase tracking-wider">
              ADVERTISING WITH PURPOSE
            </h3>
          </div>

          <p className="text-xs sm:text-sm text-slate-200 max-w-3xl mx-auto leading-relaxed">
            Advertising income goes directly towards supporting Live Traffic NPC's community operations, communications
            and road-safety activities. Together, we save lives and keep our roads safer.
          </p>

          {/* CONTACT DETAILS (From the rate card) */}
          <div className="pt-4 border-t border-[#D4A237]/30 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
            <a
              href="mailto:info@trafficlive.co.za?subject=Advertising%20Inquiry%20-%20Live%20Traffic%20NPC"
              className="flex items-center space-x-2 bg-[#05080E] hover:bg-black text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-[#D4A237]/40 transition cursor-pointer"
            >
              <Mail className="w-4 h-4 text-[#D4A237]" />
              <span>info@trafficlive.co.za</span>
            </a>

            <a
              href="https://trafficlive.co.za"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-[#05080E] hover:bg-black text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-[#D4A237]/40 transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>trafficlive.co.za</span>
            </a>

            <a
              href="https://wa.me/27677083048?text=Hello%20Live%20Traffic%20NPC%2C%20I%20am%20interested%20in%20advertising%20packages"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white px-4 py-2.5 rounded-xl border border-emerald-500/50 transition cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp / Call: 067 708 3048</span>
            </a>

            {onSwitchTab && (
              <button
                onClick={() => onSwitchTab('advertiser')}
                className="flex items-center space-x-2 bg-amber-950/70 hover:bg-amber-900 text-amber-300 hover:text-white px-4 py-2.5 rounded-xl border border-amber-500/50 transition cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>Advertiser Portal & Clicks Dashboard</span>
              </button>
            )}
          </div>

          <div className="pt-2 text-xs text-slate-400 max-w-2xl mx-auto">
            <span className="font-bold text-slate-300">IMPORTANT:</span> Advertising on Live Traffic NPC platforms is not
            an endorsement of any product or service. All advertising income contributes directly towards the
            organisation's community operations, communications and road-safety activities.
          </div>

          <div className="text-sm font-black text-[#D4A237] italic">
            Thank you for supporting our mission to save lives and keep roads safer.
          </div>
        </div>

      </div>

      {/* CHECKOUT & PAYFAST MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0C1220] border-2 border-[#C5A059]/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp my-auto text-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#171E30] via-[#101726] to-[#171E30] p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                    {successOrder ? 'Booking Confirmed' : 'Advertising Checkout'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedItem ? `${selectedItem.name} — R${selectedItem.price}` : 'Live Traffic NPC'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* SUCCESS CONFIRMATION STATE */}
              {successOrder ? (
                <div className="space-y-4 text-center py-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white uppercase">Thank You for Partnering with Us!</h4>
                    <p className="text-xs text-slate-300">
                      Your advertising booking has been recorded. Reference:{' '}
                      <span className="font-bold text-amber-400">{successOrder.referenceNumber}</span>
                    </p>
                  </div>

                  <div className="bg-[#060911] p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Business / Advertiser:</span>
                      <span className="font-bold text-white">{successOrder.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Package Selected:</span>
                      <span className="font-bold text-amber-400">{successOrder.packageName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Amount:</span>
                      <span className="font-black text-white">R{successOrder.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payment Status:</span>
                      <span className="font-bold text-emerald-400">
                        {successOrder.paymentMethod === 'payfast' ? '✓ Paid via PayFast' : '⏳ Awaiting EFT Payment'}
                      </span>
                    </div>
                  </div>

                  {successOrder.paymentMethod === 'eft' && (
                    <div className="bg-[#111927] p-3.5 rounded-2xl border border-amber-500/30 text-left space-y-2 text-xs">
                      <div className="font-bold text-amber-300 uppercase tracking-wider">EFT Banking Details:</div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <div><span className="text-slate-400">Bank:</span> FNB / First National Bank</div>
                        <div><span className="text-slate-400">Account:</span> Live Traffic NPC</div>
                        <div><span className="text-slate-400">Acc No:</span> 63019284751</div>
                        <div><span className="text-slate-400">Branch:</span> 250655</div>
                        <div className="col-span-2">
                          <span className="text-slate-400">Reference:</span>{' '}
                          <span className="font-bold text-amber-400">{successOrder.referenceNumber}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <a
                      href={`https://wa.me/27677083048?text=Hello%20Live%20Traffic%20NPC%2C%20I%20have%20booked%20an%20advertising%20package%20(Ref%3A%20${successOrder.referenceNumber})%20for%20${encodeURIComponent(successOrder.businessName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-lg transition"
                    >
                      <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
                      <span>Send Ad Copy via WhatsApp</span>
                    </a>
                    <button
                      onClick={() => setIsCheckoutOpen(false)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : payfastModalData ? (
                /* PAYFAST GATEWAY LAUNCH REDIRECT */
                <div className="space-y-4 text-center py-3">
                  <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto animate-bounce">
                    <ExternalLink className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white uppercase">Opening PayFast Secure Gateway</h4>
                    <p className="text-xs text-slate-300">
                      You are being securely redirected to PayFast to complete your payment of{' '}
                      <span className="font-black text-amber-400">R{selectedItem?.price}</span>.
                    </p>
                  </div>

                  <div className="p-3 bg-[#060911] rounded-xl border border-slate-800 text-xs text-slate-400">
                    Accepts Visa, Mastercard, Instant EFT (Capitec Pay, FNB, Absa, Standard Bank, Nedbank), Zapper, and Masterpass.
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => submitPayFastForm(payfastModalData.processUrl, payfastModalData.paymentFields, true)}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Pay in New Tab</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => submitPayFastForm(payfastModalData.processUrl, payfastModalData.paymentFields, false)}
                      className="flex-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/50 font-black py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>Pay Here (Direct)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayfastModalData(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs uppercase cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                /* CHECKOUT FORM */
                <form onSubmit={handleProcessPayment} className="space-y-4">
                  {/* Selected Package Banner */}
                  {selectedItem && (
                    <div className="bg-[#060911] p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          Selected Item
                        </span>
                        <span className="text-sm font-black text-white">{selectedItem.name}</span>
                        {selectedItem.subtitle && (
                          <span className="text-[11px] text-slate-400 block">{selectedItem.subtitle}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-amber-400">R{selectedItem.price}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {selectedItem.isMonthly ? '/month' : 'once-off'}
                        </span>
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="bg-red-950/80 border border-red-500/60 p-3 rounded-xl text-xs text-red-200 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Payment Method Switcher */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('payfast')}
                        className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition cursor-pointer text-xs font-black uppercase tracking-wider ${
                          paymentMethod === 'payfast'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-md'
                            : 'bg-[#060911] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>PayFast (Card/EFT)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('eft')}
                        className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition cursor-pointer text-xs font-black uppercase tracking-wider ${
                          paymentMethod === 'eft'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-md'
                            : 'bg-[#060911] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-4 h-4 text-blue-400" />
                        <span>Direct Bank EFT</span>
                      </button>
                    </div>
                  </div>

                  {/* Ad Creative Image Upload & Banner Customization */}
                  <div className="bg-[#080D1A] p-3.5 sm:p-4 rounded-2xl border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          Ad Image Creative File *
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">Direct File Upload Only</span>
                    </div>

                    <div>
                      {adImagePreview ? (
                        <div className="relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-[#060911] p-2 space-y-2">
                          <div className="relative h-28 sm:h-32 w-full rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                            <img
                              src={adImagePreview}
                              alt="Ad Creative Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-lg">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Rotation Ready</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAdImagePreview(null);
                                setAdImageFileName(null);
                              }}
                              className="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full cursor-pointer transition shadow"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                            <span className="truncate max-w-[200px] text-amber-400 font-bold">{adImageFileName || 'Uploaded Image'}</span>
                            <label className="text-[10px] font-bold text-sky-400 hover:underline cursor-pointer">
                              <span>Change File</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleImageFileChange(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDropImage}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 ${
                            isDragging
                              ? 'border-amber-400 bg-amber-500/10'
                              : 'border-slate-700 hover:border-amber-500/60 bg-[#060911]'
                          }`}
                        >
                          <label className="w-full cursor-pointer">
                            <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-pulse" />
                            <span className="text-xs font-bold text-white block">
                              Drag & Drop or Click to Upload Ad Creative
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Supports PNG, JPG, JPEG, WEBP (Max 8MB, recommended landscape banner)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleImageFileChange(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ad Rotation Period & Scheduling */}
                  <div className="bg-[#080D1A] p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">
                        Ad Rotation Period & Duration
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { days: 7, label: '7 Days' },
                        { days: 14, label: '14 Days' },
                        { days: 30, label: '30 Days (1 Mo)' },
                        { days: 60, label: '60 Days' },
                        { days: 90, label: '90 Days' }
                      ].map((period) => (
                        <button
                          key={period.days}
                          type="button"
                          onClick={() => setDurationDays(period.days)}
                          className={`p-2 rounded-xl border text-center transition cursor-pointer text-[11px] font-bold ${
                            durationDays === period.days
                              ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-black shadow-sm'
                              : 'bg-[#060911] border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>

                    <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-800/80 pt-2.5">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Rotation Starts:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setStartSchedule('immediate')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            startSchedule === 'immediate'
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-[#060911] text-slate-400 border border-slate-800'
                          }`}
                        >
                          Immediate
                        </button>
                        <button
                          type="button"
                          onClick={() => setStartSchedule('custom')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            startSchedule === 'custom'
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-[#060911] text-slate-400 border border-slate-800'
                          }`}
                        >
                          Schedule Date
                        </button>
                      </div>
                    </div>

                    {startSchedule === 'custom' && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Select Campaign Start Date
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2 text-xs text-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Advertiser Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Business / Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Auto Repairs"
                        className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Contact Person Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. john@apexauto.co.za"
                        className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Cell / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 082 123 4567"
                        className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Website / Social Link (Optional)
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://www.yourbusiness.co.za"
                      className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Ad Copy / Campaign Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={adNotes}
                      onChange={(e) => setAdNotes(e.target.value)}
                      placeholder="Briefly describe your promo message, target areas, or special offer..."
                      className="w-full bg-[#060911] border border-slate-700 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600 outline-none resize-none"
                    />
                  </div>

                  {paymentMethod === 'eft' && (
                    <div className="bg-[#060911] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <span className="font-bold text-amber-400 block">Bank EFT Instructions:</span>
                      <p>
                        Submitting will generate your official proforma reference number. You can complete the bank
                        transfer from your banking app and send POP to 067 708 3048.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full bg-[#FAF4EA] hover:bg-white active:scale-95 disabled:opacity-50 text-[#0D1422] border border-[#D4A237] font-black py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 shrink-0 text-[#D4A237]" />
                      <span>
                        {isProcessing
                          ? 'Processing...'
                          : paymentMethod === 'payfast'
                          ? `Pay R${selectedItem?.price} via PayFast`
                          : `Confirm EFT Booking (R${selectedItem?.price})`}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
