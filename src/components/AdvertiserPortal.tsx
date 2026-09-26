import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  Calendar,
  Clock,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Globe,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  Lock,
  Sparkles,
  Building2,
  ArrowUpRight,
  Plus,
  Play,
  Pause,
  Edit3,
  Trash2,
  Link,
  ChevronRight,
  Sliders,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Check,
  X,
  UserCheck,
  LogOut,
  CalendarPlus,
  HelpCircle,
  Zap,
  Activity,
  UploadCloud,
  Upload,
  FileImage,
  ImagePlus,
  CreditCard,
  Gift
} from 'lucide-react';
import { AdvertisementBanner, AdvertisingOrder, RegisteredUser, AdvertiserDashboardData } from '../types';
import { AuthModal } from './AuthModal';
import { AdPaymentModal } from './AdPaymentModal';
import { AdRotationEngineViewer } from './AdRotationEngineViewer';
import { initiatePayFastPayment } from '../utils/payfast';

export const AD_PACKAGES = [
  { id: 'spot_7d', name: '7-Day Roadside Spot', days: 7, price: 250, badge: 'Quick Trial', desc: 'Ideal for weekend specials, road trip promos & emergency towing.' },
  { id: 'starter_30d', name: '30-Day Standard Corridor', days: 30, price: 1500, badge: 'Most Popular', isPopular: true, desc: 'Full 30-day continuous rotation across Highway alerts & Traffic map.' },
  { id: 'growth_60d', name: '60-Day High-Impact Sponsor', days: 60, price: 3000, badge: 'High Reach', desc: 'Extended 2-month brand presence with priority feed placement.' },
  { id: 'partner_90d', name: '90-Day Platinum Safety Partner', days: 90, price: 4500, badge: 'Quarterly Shield', desc: 'Pinned verified badge & maximum frequency across national routes.' },
  { id: 'annual_365d', name: '1 Year Annual Corridor Sponsor', days: 365, price: 12000, badge: 'Best Value', desc: 'Full 365-day dominant sponsorship, featured partner status & reports.' }
];

interface AdvertiserPortalProps {
  onClose?: () => void;
  onNavigateToPricing?: () => void;
  currentUser?: RegisteredUser | null;
  onUserUpdate?: (user: RegisteredUser | null) => void;
}

export const AdvertiserPortal: React.FC<AdvertiserPortalProps> = ({
  onClose,
  onNavigateToPricing,
  currentUser: propUser,
  onUserUpdate
}) => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<RegisteredUser | null>(propUser || null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  
  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<AdvertiserDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'create' | 'claim' | 'profile'>('dashboard');

  // Modal / Form States for Ad Banner Creation & Editing
  const [editingBanner, setEditingBanner] = useState<AdvertisementBanner | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  // New Ad Form State (STRICTLY for creating new ads, never contaminated by edits)
  const [adTitle, setAdTitle] = useState('');
  const [adSubtitle, setAdSubtitle] = useState('');
  const [adSponsorName, setAdSponsorName] = useState('');
  const [adSponsorBadge, setAdSponsorBadge] = useState('Verified Partner');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adCtaText, setAdCtaText] = useState('Learn More');
  const [adPosition, setAdPosition] = useState<'top' | 'inline' | 'both'>('both');
  const [adDurationDays, setAdDurationDays] = useState<number>(30);
  const [adNotes, setAdNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'eft'>('payfast');
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);

  // Dedicated Edit Modal Form State (isolated to prevent prepopulating the New Ad form)
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editSponsorName, setEditSponsorName] = useState('');
  const [editSponsorBadge, setEditSponsorBadge] = useState('Verified Partner');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editTargetUrl, setEditTargetUrl] = useState('');
  const [editCtaText, setEditCtaText] = useState('Learn More');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState<{
    referenceNumber: string;
    amount: number;
    packageName: string;
    businessName: string;
    paymentMethod: 'payfast' | 'eft';
    durationDays?: number;
  } | null>(null);
  const [activePayfastData, setActivePayfastData] = useState<{
    processUrl: string;
    paymentFields: Record<string, string>;
    paymentId: string;
  } | null>(null);

  // Quick Pay / Renew for existing banner
  const [quickPayBanner, setQuickPayBanner] = useState<AdvertisementBanner | null>(null);
  const [quickPayDuration, setQuickPayDuration] = useState<number>(30);
  const [quickPayMethod, setQuickPayMethod] = useState<'payfast' | 'eft'>('payfast');
  const [isProcessingQuickPay, setIsProcessingQuickPay] = useState<boolean>(false);

  // Image Upload & Source Tab States (Create & Edit)
  const [isDraggingCreate, setIsDraggingCreate] = useState<boolean>(false);
  const [isDraggingEdit, setIsDraggingEdit] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [createUploadedMeta, setCreateUploadedMeta] = useState<{ name: string; size: string } | null>(null);
  const [editUploadedMeta, setEditUploadedMeta] = useState<{ name: string; size: string } | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Claim campaign state
  const [claimRefNumber, setClaimRefNumber] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  // Profile Edit State
  const [profileCompanyName, setProfileCompanyName] = useState('');
  const [profileWebsite, setProfileWebsite] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileIndustry, setProfileIndustry] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Load Dashboard Data
  const loadDashboard = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const emailQuery = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : '';
      const res = await fetch(`/api/advertiser/dashboard${emailQuery}`);
      if (!res.ok) throw new Error('Failed to load advertiser dashboard data');
      const data = await res.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Error loading advertiser dashboard:', err);
      if (!silent) setErrorMsg(err.message || 'Could not load advertiser data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    if (onUserUpdate) onUserUpdate(null);
    localStorage.removeItem('live_traffic_npc_user');
    setSuccessMsg('Signed out of advertiser portal.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAuthSuccess = (user: RegisteredUser) => {
    setCurrentUser(user);
    if (onUserUpdate) onUserUpdate(user);
    setShowAuthModal(false);
    setSuccessMsg(`Welcome back, ${user.companyName || user.fullName}!`);
    setTimeout(() => setSuccessMsg(null), 4000);
    loadDashboard(true);
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/advertiser/campaigns/${bannerId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSuccessMsg(currentStatus ? 'Campaign paused.' : 'Campaign resumed and active in rotation!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadDashboard(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle campaign status.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processImageFile = (file: File, isEditModal: boolean = false) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, JPEG, WebP, GIF, SVG).');
      return;
    }

    setIsProcessingFile(true);
    const originalSize = formatFileSize(file.size);
    const fileName = file.name;

    // Safety timeout in case browser image decoding halts
    const safetyTimer = setTimeout(() => {
      setIsProcessingFile(false);
    }, 4000);

    const finishProcessing = (imageUrl: string) => {
      clearTimeout(safetyTimer);
      if (isEditModal) {
        setEditImageUrl(imageUrl);
        setEditUploadedMeta({ name: fileName, size: originalSize });
      } else {
        setAdImageUrl(imageUrl);
        setCreateUploadedMeta({ name: fileName, size: originalSize });
      }
      setIsProcessingFile(false);
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        clearTimeout(safetyTimer);
        setIsProcessingFile(false);
        return;
      }

      // If SVG or under 350KB, keep direct base64
      if (file.type.includes('svg') || file.size < 350 * 1024) {
        finishProcessing(result);
        return;
      }

      // Compress and resize high-res images to max 1600px
      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 1600;
          let width = img.width || 1200;
          let height = img.height || 630;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.88);
            finishProcessing(compressed);
          } else {
            finishProcessing(result);
          }
        } catch {
          finishProcessing(result);
        }
      };

      img.onerror = () => {
        finishProcessing(result);
      };

      // Crucial: assign src so onload / onerror fires
      img.src = result;
    };

    reader.onerror = () => {
      clearTimeout(safetyTimer);
      setErrorMsg('Failed to read image file from device.');
      setIsProcessingFile(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEditModal: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0], isEditModal);
      e.target.value = '';
    }
  };

  const handleFileDrop = (e: React.DragEvent, isEditModal: boolean = false) => {
    e.preventDefault();
    if (isEditModal) setIsDraggingEdit(false);
    else setIsDraggingCreate(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0], isEditModal);
    }
  };

  // Clear & reset Create Form so a new ad is NEVER prepopulated with previous ad data
  const resetCreateForm = () => {
    setEditingBanner(null);
    setAdTitle('');
    setAdSubtitle('');
    setAdSponsorName(currentUser?.companyName || '');
    setAdSponsorBadge('Verified Partner');
    setAdImageUrl('');
    setAdTargetUrl('');
    setAdCtaText('Learn More');
    setAdPosition('both');
    setAdDurationDays(30);
    setAdNotes('');
    setPaymentMethod('payfast');
    setCreateUploadedMeta(null);
    setErrorMsg(null);
  };

  // Open Edit Modal for an existing banner using isolated edit states
  const handleOpenEditModal = (banner: AdvertisementBanner) => {
    setEditingBanner(banner);
    setEditTitle(banner.title || '');
    setEditSubtitle(banner.subtitle || '');
    setEditSponsorName(banner.sponsorName || currentUser?.companyName || '');
    setEditSponsorBadge(banner.sponsorBadge || 'Verified Partner');
    setEditImageUrl(banner.imageUrl || '');
    setEditTargetUrl(banner.targetUrl || '');
    setEditCtaText(banner.ctaText || 'Learn More');
    setEditUploadedMeta(banner.imageUrl?.startsWith('data:') ? { name: 'Uploaded Custom Image', size: 'Local File' } : null);
    setShowEditModal(true);
  };

  // Close Edit Modal and reset edit states without affecting create form
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBanner(null);
    setEditTitle('');
    setEditSubtitle('');
    setEditSponsorName('');
    setEditImageUrl('');
    setEditTargetUrl('');
    setEditUploadedMeta(null);
  };

  // Submit Brand New Campaign (STRICTLY POST - never modifies an existing ad)
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adImageUrl.trim()) {
      setErrorMsg('Please enter an Ad Title and upload a Banner Image creative.');
      return;
    }

    setIsSubmittingAd(true);
    setErrorMsg(null);

    const selectedPkg = AD_PACKAGES.find(p => p.days === Number(adDurationDays)) || AD_PACKAGES[1];
    const amountToPay = selectedPkg.price;
    const computedDuration = selectedPkg.days;

    const payload = {
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      email: currentUser?.email,
      contactEmail: currentUser?.email,
      contactPhone: currentUser?.cellNumber || currentUser?.businessPhone,
      title: adTitle.trim(),
      subtitle: adSubtitle.trim(),
      sponsorName: adSponsorName.trim() || currentUser?.companyName || 'Verified Partner',
      sponsorBadge: adSponsorBadge.trim() || 'Verified Partner',
      imageUrl: adImageUrl.trim(),
      targetUrl: adTargetUrl.trim() || 'https://livetraffic.co.za',
      ctaText: adCtaText.trim() || 'Learn More',
      position: adPosition,
      durationDays: computedDuration,
      amount: amountToPay,
      packageName: selectedPkg.name,
      packageId: selectedPkg.id,
      paymentMethod,
      notes: adNotes.trim()
    };

    try {
      const res = await fetch('/api/advertiser/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save campaign');
      }

      const resData = await res.json();
      const savedBanner = resData.banner;
      const refNumber = savedBanner?.referenceNumber || resData.order?.referenceNumber || `AD-${Date.now().toString().slice(-6)}`;

      // Handle Payment for new campaign
      if (paymentMethod === 'payfast') {
        try {
          const pfResponse = await initiatePayFastPayment({
            amount: amountToPay,
            itemName: `Live Traffic Ad: ${adTitle.trim()}`,
            itemDescription: `Live Traffic NPC Advertising: ${selectedPkg.name} (${computedDuration} Days) - Sponsor: ${adSponsorName.trim() || currentUser?.companyName || 'Advertiser'} - Ref: ${refNumber}`,
            category: 'advertising_package',
            donorName: (adSponsorName.trim() || currentUser?.companyName || currentUser?.fullName || 'Valued Advertiser').trim(),
            donorEmail: currentUser?.email || 'advertiser@livetrafficnpc.co.za',
            donorPhone: currentUser?.cellNumber || currentUser?.businessPhone || '0820000000',
            message: `Ad Booking: ${selectedPkg.name} - ${adTitle.trim()} - Ref: ${refNumber}`
          });

          setActivePayfastData({
            processUrl: pfResponse.processUrl,
            paymentFields: pfResponse.paymentFields,
            paymentId: pfResponse.paymentId
          });

          setActivePaymentOrder({
            referenceNumber: refNumber,
            amount: amountToPay,
            packageName: selectedPkg.name,
            businessName: adSponsorName.trim() || currentUser?.companyName || 'Valued Partner',
            paymentMethod: 'payfast',
            durationDays: computedDuration
          });

          setShowPaymentModal(true);
          setSuccessMsg(`Campaign created! Opening PayFast secure checkout for ${refNumber}...`);
        } catch (payfastErr: any) {
          console.error('PayFast initiation error:', payfastErr);
          setActivePaymentOrder({
            referenceNumber: refNumber,
            amount: amountToPay,
            packageName: selectedPkg.name,
            businessName: adSponsorName.trim() || currentUser?.companyName || 'Valued Partner',
            paymentMethod: 'eft',
            durationDays: computedDuration
          });
          setShowPaymentModal(true);
        }
      } else {
        // Direct Bank EFT
        setActivePaymentOrder({
          referenceNumber: refNumber,
          amount: amountToPay,
          packageName: selectedPkg.name,
          businessName: adSponsorName.trim() || currentUser?.companyName || 'Valued Partner',
          paymentMethod: 'eft',
          durationDays: computedDuration
        });
        setActivePayfastData(null);
        setShowPaymentModal(true);
        setSuccessMsg(`Campaign created! Please complete EFT payment with reference ${refNumber}.`);
      }

      setTimeout(() => setSuccessMsg(null), 6000);
      
      // Clean reset create form so it is 100% blank for future ads
      resetCreateForm();
      setActiveTab('campaigns');
      loadDashboard(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save campaign. Please try again.');
    } finally {
      setIsSubmittingAd(false);
    }
  };

  // Submit Changes to Existing Banner (STRICTLY PUT on editingBanner.id)
  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.id) return;
    if (!editTitle.trim() || !editImageUrl.trim()) {
      setErrorMsg('Please enter both an Ad Title and a Banner Image.');
      return;
    }

    setIsSubmittingAd(true);
    setErrorMsg(null);

    const payload = {
      bannerId: editingBanner.id,
      id: editingBanner.id,
      title: editTitle.trim(),
      subtitle: editSubtitle.trim(),
      sponsorName: editSponsorName.trim() || currentUser?.companyName || 'Verified Partner',
      sponsorBadge: editSponsorBadge.trim() || 'Verified Partner',
      imageUrl: editImageUrl.trim(),
      targetUrl: editTargetUrl.trim() || 'https://livetraffic.co.za',
      ctaText: editCtaText.trim() || 'Learn More'
    };

    try {
      const res = await fetch(`/api/advertiser/campaigns/${editingBanner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update campaign');
      }

      setSuccessMsg('Campaign updated successfully!');
      setTimeout(() => setSuccessMsg(null), 5000);
      handleCloseEditModal();
      loadDashboard(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update campaign. Please try again.');
    } finally {
      setIsSubmittingAd(false);
    }
  };

  // Quick Pay / Renewal for existing banner
  const handleProcessQuickPay = async (banner: AdvertisementBanner) => {
    setIsProcessingQuickPay(true);
    setErrorMsg(null);

    const selectedPkg = AD_PACKAGES.find(p => p.days === quickPayDuration) || AD_PACKAGES[1];
    const amountToPay = selectedPkg.price;
    const refNumber = banner.referenceNumber || `AD-RNW-${Date.now().toString().slice(-6)}`;

    try {
      if (quickPayMethod === 'payfast') {
        const pfResponse = await initiatePayFastPayment({
          amount: amountToPay,
          itemName: `Ad Renewal: ${banner.title}`,
          itemDescription: `Live Traffic NPC Ad Renewal: ${selectedPkg.name} (+${quickPayDuration} Days) - Ref: ${refNumber}`,
          category: 'advertising_package',
          donorName: (banner.sponsorName || currentUser?.companyName || currentUser?.fullName || 'Advertiser').trim(),
          donorEmail: banner.contactEmail || currentUser?.email || 'advertiser@livetrafficnpc.co.za',
          donorPhone: banner.contactPhone || currentUser?.cellNumber || currentUser?.businessPhone || '0820000000',
          message: `Campaign Renewal (+${quickPayDuration} Days) - ${banner.title} - Ref: ${refNumber}`
        });

        // Also extend campaign on server
        await fetch('/api/advertiser/campaigns/extend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bannerId: banner.id,
            extraDays: quickPayDuration,
            email: currentUser?.email
          })
        });

        setActivePayfastData({
          processUrl: pfResponse.processUrl,
          paymentFields: pfResponse.paymentFields,
          paymentId: pfResponse.paymentId
        });

        setActivePaymentOrder({
          referenceNumber: refNumber,
          amount: amountToPay,
          packageName: `${selectedPkg.name} (Renewal)`,
          businessName: banner.sponsorName,
          paymentMethod: 'payfast',
          durationDays: quickPayDuration
        });

        setQuickPayBanner(null);
        setShowPaymentModal(true);
      } else {
        // Direct EFT renewal
        setActivePaymentOrder({
          referenceNumber: refNumber,
          amount: amountToPay,
          packageName: `${selectedPkg.name} (Renewal)`,
          businessName: banner.sponsorName,
          paymentMethod: 'eft',
          durationDays: quickPayDuration
        });
        setActivePayfastData(null);
        setQuickPayBanner(null);
        setShowPaymentModal(true);
      }
      loadDashboard(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process renewal payment.');
    } finally {
      setIsProcessingQuickPay(false);
    }
  };

  // Claim an existing order/banner by reference number
  const handleClaimCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimRefNumber.trim()) {
      setErrorMsg('Please enter a valid Reference Number (e.g. LT-ADV-78219).');
      return;
    }
    if (!currentUser?.email) {
      setErrorMsg('You must be signed in to link a campaign to your account.');
      return;
    }

    setIsClaiming(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/advertiser/claim-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceNumber: claimRefNumber.trim(),
          email: currentUser.email
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not find campaign matching this reference number.');
      }

      setSuccessMsg(`Success! Linked "${data.banner?.title || 'Campaign'}" to your account.`);
      setClaimRefNumber('');
      setTimeout(() => setSuccessMsg(null), 5000);
      loadDashboard(true);
      setActiveTab('campaigns');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to claim campaign.');
    } finally {
      setIsClaiming(false);
    }
  };

  // Save Advertiser Company Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    setIsSavingProfile(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/advertiser/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          companyName: profileCompanyName.trim(),
          businessWebsite: profileWebsite.trim(),
          businessPhone: profilePhone.trim(),
          businessIndustry: profileIndustry.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update company profile');
      }

      setCurrentUser(data.user);
      if (onUserUpdate) onUserUpdate(data.user);
      localStorage.setItem('live_traffic_npc_user', JSON.stringify(data.user));

      setSuccessMsg('Company profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Test Click Handler
  const handleTestClick = async (bannerId: string, targetUrl?: string) => {
    try {
      await fetch(`/api/ads/banners/${bannerId}/click`, { method: 'POST' });
      setSuccessMsg('Recorded 1 test click! Analytics updated in real-time.');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadDashboard(true);
      if (targetUrl) {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn('Click track note:', err);
    }
  };

  const analytics = dashboardData?.analytics || {
    totalCampaigns: 0,
    activeCampaigns: 0,
    pendingApprovalCount: 0,
    pausedCampaigns: 0,
    expiredCampaigns: 0,
    totalImpressions: 0,
    totalClicks: 0,
    overallCTR: '0.00',
    totalSpend: 0,
    dailyBreakdown: [],
    placementStats: { top: 0, inline: 0, both: 0 }
  };

  const banners = dashboardData?.banners || [];
  const orders = dashboardData?.orders || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#05080E]/90 backdrop-blur-md overflow-hidden">
      <div className="bg-[#090E17] border-2 border-[#D4A237]/60 rounded-3xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top App Bar */}
        <div className="bg-gradient-to-r from-[#05080E] via-[#0B1524] to-[#05080E] px-4 sm:px-6 py-3.5 border-b border-[#D4A237]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F5D061] via-[#D4A237] to-[#8E6516] p-0.5 shadow-lg shadow-[#D4A237]/20 shrink-0">
              <div className="w-full h-full bg-[#070A10] rounded-2xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#D4A237]" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                  Advertiser & Partner Hub
                </h1>
                <span className="bg-[#D4A237]/20 border border-[#D4A237]/60 text-[#D4A237] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                  Live Traffic NPC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentUser 
                  ? `Signed in as: ${currentUser.companyName || currentUser.fullName} (${currentUser.email})` 
                  : 'Manage road safety campaigns, real-time clicks, and banner placements'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadDashboard(true)}
                  disabled={isRefreshing}
                  title="Refresh metrics"
                  className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition border border-slate-700 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D4A237]' : ''}`} />
                </button>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold rounded-xl border border-red-800/50 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAuthModalMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4A237]" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] text-xs font-black rounded-xl shadow-lg shadow-[#D4A237]/20 flex items-center space-x-1.5 transition cursor-pointer uppercase tracking-wider"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Register Business</span>
                </button>
              </div>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition border border-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="bg-red-500/15 border-b border-red-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Portal Body & Tabs */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-[#060910]">
          
          {/* Navigation Sidebar */}
          <div className="w-full md:w-60 bg-[#070C15] border-b md:border-b-0 md:border-r border-slate-800/80 p-3 sm:p-4 flex flex-row md:flex-col justify-between md:justify-start gap-1.5 shrink-0 overflow-x-auto">
            <div className="flex md:flex-col gap-1.5 w-full">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/50 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Performance & Clicks</span>
              </button>

              <button
                onClick={() => setActiveTab('campaigns')}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer whitespace-nowrap ${
                  activeTab === 'campaigns'
                    ? 'bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/50 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span className="flex-1">Manage Ads</span>
                {banners.length > 0 && (
                  <span className="bg-[#D4A237]/30 text-[#D4A237] text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {banners.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  resetCreateForm();
                  setActiveTab('create');
                }}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer whitespace-nowrap ${
                  activeTab === 'create'
                    ? 'bg-[#D4A237] text-[#070A10] font-black shadow-lg shadow-[#D4A237]/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>+ Launch New Ad</span>
              </button>

              <button
                onClick={() => setActiveTab('claim')}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer whitespace-nowrap ${
                  activeTab === 'claim'
                    ? 'bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/50 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Link className="w-4 h-4 shrink-0" />
                <span>Link Order by Ref #</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/50 shadow-inner'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Company Profile</span>
              </button>
            </div>

            {/* Quick Pricing Action */}
            {onNavigateToPricing && (
              <div className="hidden md:block mt-auto pt-4 border-t border-slate-800/80">
                <button
                  onClick={onNavigateToPricing}
                  className="w-full px-3 py-2.5 bg-gradient-to-r from-amber-600/30 to-amber-700/20 hover:from-amber-600/50 hover:to-amber-700/40 text-amber-300 text-xs font-bold rounded-xl border border-amber-600/40 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>View Ad Rates & ROI</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* TAB 1: DASHBOARD & ANALYTICS */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Header Welcome banner */}
                <div className="bg-gradient-to-r from-[#0C1424] via-[#0E1A30] to-[#070D18] border border-[#D4A237]/40 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-black uppercase text-[#D4A237] tracking-wider">
                          Verified Advertiser Metrics Engine
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                        {currentUser?.companyName || 'Campaign Control Center'}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                        Monitor impressions, click-through rates, and community driver engagements across the South African Live Traffic NPC Network.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => {
                          resetCreateForm();
                          setActiveTab('create');
                        }}
                        className="px-4 py-2.5 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs rounded-xl shadow-lg shadow-[#D4A237]/20 flex items-center space-x-1.5 transition cursor-pointer uppercase tracking-wider"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add New Ad</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Impressions */}
                  <div className="bg-[#0A101D] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#D4A237]/50 transition shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Impressions</span>
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {analytics.totalImpressions.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>Live views across driver feeds</span>
                    </div>
                  </div>

                  {/* Clicks */}
                  <div className="bg-[#0A101D] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#D4A237]/50 transition shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Total Clicks</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <MousePointerClick className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                      {analytics.totalClicks.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-emerald-400" />
                      <span>Direct outbound engagements</span>
                    </div>
                  </div>

                  {/* CTR */}
                  <div className="bg-[#0A101D] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#D4A237]/50 transition shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Avg. CTR</span>
                      <div className="w-8 h-8 rounded-xl bg-[#D4A237]/10 text-[#D4A237] flex items-center justify-center">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#D4A237] tracking-tight">
                      {analytics.overallCTR}%
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      <span>Click-through conversion rate</span>
                    </div>
                  </div>

                  {/* Active Campaigns */}
                  <div className="bg-[#0A101D] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#D4A237]/50 transition shadow-lg">
                    <div className="flex items-center justify-between text-slate-400 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Active Banners</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Layers className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {analytics.activeCampaigns} <span className="text-xs text-slate-500 font-normal">/ {analytics.totalCampaigns} total</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      <span>Currently rotating in feed</span>
                    </div>
                  </div>
                </div>

                {/* 7-Day Performance & Placements Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Daily Trend Breakdown */}
                  <div className="lg:col-span-2 bg-[#0A101D] border border-slate-800 rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                          <BarChart3 className="w-4 h-4 text-[#D4A237]" />
                          <span>7-Day Activity & Engagement Trend</span>
                        </h3>
                        <p className="text-xs text-slate-400">Daily breakdown of impressions and driver clicks</p>
                      </div>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono">
                        Real-time
                      </span>
                    </div>

                    <div className="space-y-3">
                      {analytics.dailyBreakdown && analytics.dailyBreakdown.length > 0 ? (
                        analytics.dailyBreakdown.map((day, idx) => {
                          const maxImp = Math.max(...analytics.dailyBreakdown.map(d => d.impressions), 1);
                          const impPct = Math.min(100, Math.round((day.impressions / maxImp) * 100));
                          return (
                            <div key={idx} className="bg-[#060910] border border-slate-800/80 rounded-xl p-3">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="font-mono text-slate-300 font-bold">{day.date}</span>
                                <div className="flex items-center space-x-3 text-[11px]">
                                  <span className="text-slate-400"><strong className="text-white">{day.impressions}</strong> views</span>
                                  <span className="text-emerald-400 font-bold"><strong className="text-emerald-300">{day.clicks}</strong> clicks</span>
                                </div>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden flex">
                                <div
                                  className="bg-[#D4A237] h-full rounded-full transition-all duration-500"
                                  style={{ width: `${impPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-xs text-slate-500">
                          No daily metrics recorded yet. Launch your first campaign to start seeing live metrics.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placements & Status Breakdown */}
                  <div className="bg-[#0A101D] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2 mb-1">
                        <Sliders className="w-4 h-4 text-[#D4A237]" />
                        <span>Placements & Health</span>
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">Ad positions currently deployed</p>

                      <div className="space-y-3 text-xs">
                        <div className="bg-[#060910] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-slate-300 font-bold">Top Header Banner</span>
                          </div>
                          <span className="font-mono font-bold text-white">{analytics.placementStats.top}</span>
                        </div>

                        <div className="bg-[#060910] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="text-slate-300 font-bold">Inline Traffic Feed</span>
                          </div>
                          <span className="font-mono font-bold text-white">{analytics.placementStats.inline}</span>
                        </div>

                        <div className="bg-[#060910] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-slate-300 font-bold">Both Placements</span>
                          </div>
                          <span className="font-mono font-bold text-white">{analytics.placementStats.both}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#060910] border border-[#D4A237]/30 rounded-xl p-3.5">
                      <div className="text-[11px] font-bold text-[#D4A237] uppercase flex items-center space-x-1.5 mb-1">
                        <Zap className="w-3.5 h-3.5 text-[#D4A237]" />
                        <span>Advertiser Benefit</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        All roadside emergency and vehicle safety sponsors are pinned directly above critical incident dispatch alerts for maximum visibility.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Quick Campaign Overview List */}
                <div className="bg-[#0A101D] border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Active Campaigns ({banners.length})
                      </h3>
                      <p className="text-xs text-slate-400">Manage, preview, or pause your running ads</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('campaigns')}
                      className="text-xs text-[#D4A237] hover:underline font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>View All in Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {banners.length === 0 ? (
                    <div className="text-center py-10 bg-[#060910] border border-dashed border-slate-800 rounded-2xl p-6">
                      <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-300">No campaigns found</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                        You haven't launched any ad campaigns yet, or your past orders are linked to a reference number.
                      </p>
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => {
                            resetCreateForm();
                            setActiveTab('create');
                          }}
                          className="px-4 py-2 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer"
                        >
                          + Launch First Ad
                        </button>
                        <button
                          onClick={() => setActiveTab('claim')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Claim by Reference #
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {banners.slice(0, 4).map((b) => (
                        <div key={b.id} className="bg-[#060910] border border-slate-800 hover:border-[#D4A237]/40 rounded-xl p-4 transition flex flex-col justify-between space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-3">
                              {b.imageUrl ? (
                                <img
                                  src={b.imageUrl}
                                  alt={b.title}
                                  className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-5 h-5 text-slate-500" />
                                </div>
                              )}
                              <div>
                                <h4 className="text-xs font-black text-white line-clamp-1">{b.title}</h4>
                                <span className="text-[11px] text-slate-400">{b.sponsorName || 'Sponsored'}</span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            }`}>
                              {b.enabled ? 'Active' : 'Paused'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-[#090E17] p-2.5 rounded-lg text-center text-xs">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase">Views</div>
                              <div className="font-bold text-white">{(b.impressions || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase">Clicks</div>
                              <div className="font-bold text-emerald-400">{(b.clicks || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase">CTR</div>
                              <div className="font-bold text-[#D4A237]">
                                {b.impressions ? (((b.clicks || 0) / b.impressions) * 100).toFixed(2) : '0.00'}%
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-xs">
                            <button
                              onClick={() => handleToggleBanner(b.id, b.enabled)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition ${
                                b.enabled ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/60' : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                              }`}
                            >
                              {b.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              <span>{b.enabled ? 'Pause' : 'Activate'}</span>
                            </button>

                            <button
                              onClick={() => handleTestClick(b.id, b.targetUrl)}
                              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                              title="Test outbound destination link and increment counter"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Test Link</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: FULL CAMPAIGN MANAGEMENT */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                      <Layers className="w-5 h-5 text-[#D4A237]" />
                      <span>Manage Your Campaigns & Ad Banners</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Configure creatives, adjust call-to-actions, extend runtimes, and inspect live click trackers.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      resetCreateForm();
                      setActiveTab('create');
                    }}
                    className="px-4 py-2 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs rounded-xl shadow-lg shadow-[#D4A237]/20 flex items-center space-x-1.5 transition cursor-pointer uppercase tracking-wider shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Ad</span>
                  </button>
                </div>

                {banners.length === 0 ? (
                  <div className="text-center py-16 bg-[#0A101D] border border-dashed border-slate-800 rounded-3xl p-8">
                    <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-white">No ads currently configured</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-6">
                      Launch a roadside ad campaign today or link an existing order reference to view your banner stats here.
                    </p>
                    <button
                      onClick={() => {
                        resetCreateForm();
                        setActiveTab('create');
                      }}
                      className="px-5 py-2.5 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      + Launch New Ad Banner
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner) => {
                      const ctrVal = banner.impressions ? (((banner.clicks || 0) / banner.impressions) * 100).toFixed(2) : '0.00';
                      return (
                        <div
                          key={banner.id}
                          className="bg-[#0A101D] border border-slate-800 hover:border-[#D4A237]/50 rounded-2xl p-5 transition shadow-lg space-y-4"
                        >
                          {/* Banner Header Info */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex items-start space-x-4">
                              {banner.imageUrl ? (
                                <img
                                  src={banner.imageUrl}
                                  alt={banner.title}
                                  className="w-20 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-16 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                                  <ImageIcon className="w-6 h-6 text-slate-500" />
                                </div>
                              )}

                              <div>
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    banner.enabled 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  }`}>
                                    {banner.enabled ? '● Live Active' : '○ Paused'}
                                  </span>

                                  {banner.sponsorBadge && (
                                    <span className="bg-[#D4A237]/20 border border-[#D4A237]/50 text-[#D4A237] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      {banner.sponsorBadge}
                                    </span>
                                  )}

                                  {(banner.isComplimentary || banner.paymentMethod === 'complimentary') && (
                                    <span className="bg-purple-950/90 border border-purple-500/50 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                                      <Gift className="w-3 h-3 text-purple-400" />
                                      <span>100% Complimentary (Admin Free Month)</span>
                                    </span>
                                  )}

                                  {banner.referenceNumber && (
                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">
                                      Ref: {banner.referenceNumber}
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-base font-black text-white">{banner.title}</h3>
                                {banner.subtitle && <p className="text-xs text-slate-300 mt-0.5">{banner.subtitle}</p>}

                                {(banner.isComplimentary || banner.paymentMethod === 'complimentary') && (
                                  <div className="mt-1.5 p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg text-xs text-purple-200 flex items-start space-x-2">
                                    <Gift className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold text-purple-300">Complimentary 1-Month Courtesy Grant</span>
                                      <p className="text-[10px] text-purple-300/80">
                                        Courtesy grant awarded by Live Traffic NPC administration.
                                        {banner.complimentaryReason && ` "${banner.complimentaryReason}"`}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                                  <span>Sponsor: <strong className="text-slate-200">{banner.sponsorName}</strong></span>
                                  <span>•</span>
                                  <span>Placement: <strong className="text-[#D4A237] capitalize">{banner.position || 'Both'}</strong></span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleBanner(banner.id, banner.enabled)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer ${
                                  banner.enabled
                                    ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50'
                                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50'
                                }`}
                              >
                                {banner.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                <span>{banner.enabled ? 'Pause Ad' : 'Resume Ad'}</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditModal(banner)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#D4A237]" />
                                <span>Edit Details</span>
                              </button>

                              <button
                                onClick={() => {
                                  setQuickPayBanner(banner);
                                  setQuickPayDuration(banner.durationDays || 30);
                                }}
                                className="px-3 py-1.5 bg-[#D4A237]/20 hover:bg-[#D4A237]/30 text-[#D4A237] text-xs font-bold rounded-xl border border-[#D4A237]/40 flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                                title="Pay or Renew runtime for this ad"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Pay / Extend</span>
                              </button>
                            </div>
                          </div>

                          {/* Stats Metrics Bar */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#060910] p-3 rounded-xl border border-slate-800/80">
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Feed Views</div>
                              <div className="text-base font-black text-white">{(banner.impressions || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Driver Clicks</div>
                              <div className="text-base font-black text-emerald-400">{(banner.clicks || 0).toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Click Rate (CTR)</div>
                              <div className="text-base font-black text-[#D4A237]">{ctrVal}%</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Outbound Destination</div>
                              <div className="text-xs text-blue-400 font-mono truncate max-w-[150px]">
                                {banner.targetUrl || 'Default Link'}
                              </div>
                            </div>
                          </div>

                          {/* Interactive Preview Card within Manager */}
                          <div className="bg-[#05080E] border border-[#D4A237]/30 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center space-x-2 text-xs text-slate-400">
                              <Sparkles className="w-4 h-4 text-[#D4A237]" />
                              <span>Live CTA Button: <strong className="text-white">"{banner.ctaText || 'Learn More'}"</strong></span>
                            </div>

                            <button
                              onClick={() => handleTestClick(banner.id, banner.targetUrl)}
                              className="px-3.5 py-1.5 bg-[#FAF4EA] hover:bg-white text-[#070A10] font-black text-xs rounded-lg shadow flex items-center justify-center space-x-1.5 transition cursor-pointer"
                            >
                              <MousePointerClick className="w-3.5 h-3.5 text-[#070A10]" />
                              <span>Test Live Outbound Click</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AD ROTATION ENGINE VIEWER (Simulates and tests actual rotation without stubbed data) */}
                <div className="pt-4">
                  <AdRotationEngineViewer
                    banners={banners}
                    onTestClick={handleTestClick}
                    onLaunchNewAd={() => {
                      resetCreateForm();
                      setActiveTab('create');
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: CREATE / LAUNCH NEW AD */}
            {activeTab === 'create' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Plus className="w-5 h-5 text-[#D4A237]" />
                    <span>Launch New Roadside Advertisement</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Publish a sponsor banner visible across the Live Traffic Map and Incident Stream in South Africa.
                  </p>
                </div>

                {/* Create Ad Form */}
                <form onSubmit={handleCreateCampaign} className="bg-[#0A101D] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Ad Title / Main Headline *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 24/7 Heavy Duty Roadside Towing"
                        value={adTitle}
                        onChange={(e) => setAdTitle(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Subtitle / Catchy Tagline
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Fast response across N1, N3 & N4 corridors"
                        value={adSubtitle}
                        onChange={(e) => setAdSubtitle(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Sponsor / Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder={currentUser?.companyName || "AutoSafe Towing NPC"}
                        value={adSponsorName}
                        onChange={(e) => setAdSponsorName(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Badge Tag
                      </label>
                      <input
                        type="text"
                        placeholder="Verified Partner"
                        value={adSponsorBadge}
                        onChange={(e) => setAdSponsorBadge(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Call-to-Action Text
                      </label>
                      <input
                        type="text"
                        placeholder="Call Now / Get Quote / Visit"
                        value={adCtaText}
                        onChange={(e) => setAdCtaText(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>

                  {/* BANNER IMAGE CREATIVE UPLOAD & SOURCE SELECTOR */}
                  <div className="bg-[#05080E] border border-[#D4A237]/40 rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <label className="text-xs font-black uppercase tracking-wider text-[#D4A237] flex items-center space-x-1.5">
                          <ImageIcon className="w-4 h-4" />
                          <span>Ad Banner Image Creative *</span>
                        </label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Upload your promotional graphic or photo from your computer/phone.
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">Direct File Upload Only</span>
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={createFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                      onChange={(e) => handleFileSelect(e, false)}
                      className="hidden"
                    />

                    {/* UPLOAD IMAGE FILE */}
                    <div className="space-y-3">
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingCreate(true);
                        }}
                        onDragLeave={() => setIsDraggingCreate(false)}
                        onDrop={(e) => handleFileDrop(e, false)}
                        onClick={() => createFileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2.5 group ${
                          isDraggingCreate
                            ? 'border-[#D4A237] bg-[#D4A237]/10'
                            : 'border-slate-700/80 hover:border-[#D4A237]/70 bg-[#070C15]/80 hover:bg-[#0A111E]'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#D4A237]/10 border border-[#D4A237]/30 flex items-center justify-center text-[#D4A237] group-hover:scale-105 transition-transform shadow-inner">
                          {isProcessingFile ? (
                            <RefreshCw className="w-6 h-6 animate-spin text-[#D4A237]" />
                          ) : (
                            <UploadCloud className="w-6 h-6" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white">
                            {isProcessingFile
                              ? 'Processing & optimizing image file...'
                              : isDraggingCreate
                              ? 'Drop your image file here to upload'
                              : 'Click to browse files or drag and drop image here'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Supports JPG, PNG, WebP, GIF, SVG (up to 15MB, compressed smoothly)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            createFileInputRef.current?.click();
                          }}
                          className="mt-1 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#D4A237] border border-slate-700 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse Computer / Phone</span>
                        </button>
                      </div>

                      {/* File Upload Confirmation / Status Bar */}
                      {createUploadedMeta && adImageUrl && (
                        <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs text-emerald-300">
                          <div className="flex items-center space-x-2 truncate">
                            <FileImage className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="font-mono text-xs font-bold truncate max-w-[220px] sm:max-w-[350px]">
                              {createUploadedMeta.name}
                            </span>
                            <span className="text-[10px] text-emerald-400/80 font-mono">
                              ({createUploadedMeta.size})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCreateUploadedMeta(null);
                              setAdImageUrl('');
                            }}
                            className="text-slate-400 hover:text-red-400 p-1 rounded transition cursor-pointer"
                            title="Remove uploaded image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail Preview if an image is active */}
                    {adImageUrl && (
                      <div className="pt-1 flex items-center space-x-3 bg-[#070C15] p-2.5 rounded-xl border border-slate-800">
                        <img
                          src={adImageUrl}
                          alt="Creative Thumbnail"
                          className="w-16 h-12 rounded-lg object-cover border border-[#D4A237]/50 shrink-0"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="font-bold text-white flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Image creative ready</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md font-mono mt-0.5">
                            {adImageUrl.startsWith('data:') ? 'Embedded Base64 Image' : adImageUrl}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAdImageUrl('');
                            setCreateUploadedMeta(null);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-950/40 rounded-lg border border-red-900/40 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1">
                        <ExternalLink className="w-3.5 h-3.5 text-[#D4A237]" />
                        <span>Target Destination Link (URL or tel:)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="https://mycompany.co.za or tel:0119024400"
                        value={adTargetUrl}
                        onChange={(e) => setAdTargetUrl(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Placement Position
                      </label>
                      <select
                        value={adPosition}
                        onChange={(e: any) => setAdPosition(e.target.value)}
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                      >
                        <option value="both">Both Top Header & Feed (Recommended)</option>
                        <option value="top">Top Header Banner Only</option>
                        <option value="inline">Inline Incident Feed Only</option>
                      </select>
                    </div>
                  </div>

                  {/* ADVERTISING PACKAGES & DURATION SELECTOR */}
                  <div className="space-y-2.5 pt-1">
                    <label className="text-xs font-black uppercase tracking-wider text-[#D4A237] flex items-center space-x-1.5">
                      <DollarSign className="w-4 h-4" />
                      <span>Select Advertising Package & Duration *</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {AD_PACKAGES.map((pkg) => {
                        const isSelected = adDurationDays === pkg.days;
                        return (
                          <div
                            key={pkg.id}
                            onClick={() => setAdDurationDays(pkg.days)}
                            className={`p-3.5 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-[#D4A237]/15 border-[#D4A237] shadow-lg shadow-[#D4A237]/10'
                                : 'bg-[#05080E] border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {pkg.badge && (
                              <span className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                pkg.isPopular
                                  ? 'bg-[#D4A237] text-[#070A10]'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {pkg.badge}
                              </span>
                            )}

                            <div>
                              <div className="text-xs font-black text-white">{pkg.name}</div>
                              <div className="text-[11px] text-slate-400 mt-1 leading-snug">{pkg.desc}</div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                              <span className="text-sm font-black text-[#D4A237]">
                                R {pkg.price.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {pkg.days} Days runtime
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* PAYMENT METHOD SELECTOR */}
                  <div className="bg-[#05080E] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-[#D4A237]" />
                      <span>Payment Method</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('payfast')}
                        className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                          paymentMethod === 'payfast'
                            ? 'bg-[#D4A237]/15 border-[#D4A237]'
                            : 'bg-[#090E17] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full border border-[#D4A237] flex items-center justify-center mt-0.5 shrink-0">
                          {paymentMethod === 'payfast' && <div className="w-2.5 h-2.5 rounded-full bg-[#D4A237]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                            <span>PayFast Instant Checkout</span>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-1.5 py-0.2 rounded">Instant Activation</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Credit/Debit Cards, Instant EFT, Capitec Pay, SnapScan & Masterpass
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('eft')}
                        className={`p-3.5 rounded-xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                          paymentMethod === 'eft'
                            ? 'bg-[#D4A237]/15 border-[#D4A237]'
                            : 'bg-[#090E17] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center mt-0.5 shrink-0">
                          {paymentMethod === 'eft' && <div className="w-2.5 h-2.5 rounded-full bg-[#D4A237]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Direct Bank EFT / Pro-Forma Invoice</div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Standard FNB Corporate Bank Transfer with custom reference number
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Live Ad Preview before submission */}
                  {adTitle && (
                    <div className="pt-2">
                      <div className="text-xs font-black uppercase text-slate-400 mb-2">
                        Live Preview (How it will render in the app):
                      </div>
                      <div className="bg-[#05080E] border-2 border-[#D4A237]/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                        <div className="flex items-center space-x-3.5">
                          {adImageUrl ? (
                            <img
                              src={adImageUrl}
                              alt="Ad Preview"
                              className="w-16 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                              <ImageIcon className="w-6 h-6 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="bg-[#D4A237]/20 border border-[#D4A237]/60 text-[#D4A237] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                {adSponsorBadge || 'Sponsored'}
                              </span>
                              <span className="text-xs text-slate-400 font-bold">
                                {adSponsorName || currentUser?.companyName || 'Sponsor'}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white">{adTitle}</h4>
                            {adSubtitle && <p className="text-xs text-slate-300">{adSubtitle}</p>}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-4 py-2 bg-[#FAF4EA] text-[#070A10] font-black text-xs rounded-xl shadow shrink-0"
                        >
                          {adCtaText || 'Learn More'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmittingAd}
                      className="w-full bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-sm py-3.5 rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition cursor-pointer uppercase tracking-wider disabled:opacity-50"
                    >
                      {isSubmittingAd ? (
                        <span>Publishing & Connecting Payment...</span>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 text-[#070A10]" />
                          <span>
                            Book & Pay for Ad — R {(AD_PACKAGES.find(p => p.days === adDurationDays)?.price || 1500).toLocaleString()}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB 4: CLAIM EXISTING CAMPAIGN / ORDER */}
            {activeTab === 'claim' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-xl">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Link className="w-5 h-5 text-[#D4A237]" />
                    <span>Link Past Campaign by Reference #</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    If you purchased advertising before creating your account, enter your order reference to claim it.
                  </p>
                </div>

                <form onSubmit={handleClaimCampaign} className="bg-[#0A101D] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Order Reference Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LT-ADV-78219 or LT-ADV-83921"
                      value={claimRefNumber}
                      onChange={(e) => setClaimRefNumber(e.target.value)}
                      className="w-full bg-[#05080E] border border-[#D4A237]/50 focus:border-[#D4A237] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition font-mono"
                    />
                  </div>

                  <div className="bg-[#060910] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 text-[#D4A237] shrink-0 mt-0.5" />
                    <span>
                      The campaign will be bound to <strong>{currentUser?.email || 'your account'}</strong> and all click metrics will immediately appear in your dashboard.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="w-full bg-[#FAF4EA] hover:bg-white text-[#070A10] font-black text-xs sm:text-sm py-3 rounded-xl uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#070A10]" />
                    <span>{isClaiming ? 'Linking Campaign...' : 'Claim & Link Campaign'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 5: COMPANY PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200 max-w-2xl">
                <div className="border-b border-slate-800 pb-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-[#D4A237]" />
                    <span>Advertiser Company Profile</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Update your verified brand name, contact numbers, and industry category for invoicing and campaign tags.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="bg-[#0A101D] border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Company / Organization Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileCompanyName}
                      onChange={(e) => setProfileCompanyName(e.target.value)}
                      placeholder="e.g. AutoSafe Roadside Assistance NPC"
                      className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Official Website
                      </label>
                      <input
                        type="url"
                        value={profileWebsite}
                        onChange={(e) => setProfileWebsite(e.target.value)}
                        placeholder="https://example.co.za"
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                        Business Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="011 902 4400"
                        className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Industry Sector
                    </label>
                    <input
                      type="text"
                      value={profileIndustry}
                      onChange={(e) => setProfileIndustry(e.target.value)}
                      placeholder="e.g. Automotive & Roadside Towing"
                      className="w-full bg-[#05080E] border border-slate-700 focus:border-[#D4A237] rounded-xl px-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs rounded-xl shadow-lg uppercase tracking-wider cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Modal: Edit Existing Banner Details */}
        {showEditModal && editingBanner && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0A101D] border-2 border-[#D4A237] rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-[#D4A237]" />
                  <span>Edit Campaign Ad Banner</span>
                </h3>
                <button onClick={handleCloseEditModal} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCampaign} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Ad Headline *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#D4A237]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#D4A237]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">Sponsor Name</label>
                    <input
                      type="text"
                      value={editSponsorName}
                      onChange={(e) => setEditSponsorName(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#D4A237]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">CTA Button Text</label>
                    <input
                      type="text"
                      value={editCtaText}
                      onChange={(e) => setEditCtaText(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-[#D4A237]"
                    />
                  </div>
                </div>

                {/* EDIT IMAGE CREATIVE SECTION */}
                <div className="bg-[#05080E] border border-[#D4A237]/40 rounded-2xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <label className="text-xs font-bold text-[#D4A237] flex items-center space-x-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Banner Image Creative *</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">File Upload Only</span>
                  </div>

                  {/* Hidden native input for edit modal */}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                    onChange={(e) => handleFileSelect(e, true)}
                    className="hidden"
                  />

                  <div className="space-y-2">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingEdit(true);
                      }}
                      onDragLeave={() => setIsDraggingEdit(false)}
                      onDrop={(e) => handleFileDrop(e, true)}
                      onClick={() => editFileInputRef.current?.click()}
                      className={`border border-dashed rounded-xl p-3 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                        isDraggingEdit
                          ? 'border-[#D4A237] bg-[#D4A237]/10'
                          : 'border-slate-700 hover:border-[#D4A237]/60 bg-[#070C15]'
                      }`}
                    >
                      {isProcessingFile ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-[#D4A237]" />
                      ) : (
                        <UploadCloud className="w-5 h-5 text-[#D4A237]" />
                      )}
                      <p className="text-xs text-white font-medium">
                        {isProcessingFile
                          ? 'Compressing and processing...'
                          : isDraggingEdit
                          ? 'Drop new image to upload'
                          : 'Click to choose new image file or drag here'}
                      </p>
                      <span className="text-[10px] text-slate-400">JPG, PNG, WebP, SVG</span>
                    </div>

                    {editUploadedMeta && (
                      <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-300">
                        <span className="font-mono text-[11px] truncate max-w-[280px]">
                          {editUploadedMeta.name} ({editUploadedMeta.size})
                        </span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Thumbnail */}
                  {editImageUrl && (
                    <div className="flex items-center space-x-3 bg-[#070C15] p-2 rounded-xl border border-slate-800">
                      <img
                        src={editImageUrl}
                        alt="Preview"
                        className="w-14 h-10 rounded-lg object-cover border border-[#D4A237]/40 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="flex-1 min-w-0 text-[11px] text-slate-300">
                        <span className="font-bold text-white block">Active Image</span>
                        <span className="text-slate-400 truncate block font-mono">
                          {editImageUrl.startsWith('data:') ? 'Uploaded local image' : editImageUrl}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Destination Link (URL or tel:)</label>
                  <input
                    type="text"
                    value={editTargetUrl}
                    onChange={(e) => setEditTargetUrl(e.target.value)}
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-[#D4A237]"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAd}
                    className="px-5 py-2 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] text-xs font-black rounded-xl uppercase tracking-wider cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingAd ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QUICK PAY / RENEWAL MODAL FOR EXISTING CAMPAIGN */}
        {quickPayBanner && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0A101D] border border-[#D4A237]/60 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#D4A237]/20 border border-[#D4A237]/40 flex items-center justify-center text-[#D4A237]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Renew Ad Duration</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Ref: {quickPayBanner.referenceNumber || quickPayBanner.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setQuickPayBanner(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#05080E] p-3.5 rounded-2xl border border-slate-800 flex items-center space-x-3">
                {quickPayBanner.imageUrl && (
                  <img
                    src={quickPayBanner.imageUrl}
                    alt={quickPayBanner.title}
                    className="w-14 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{quickPayBanner.title}</h4>
                  <p className="text-[10px] text-[#D4A237] mt-0.5">{quickPayBanner.sponsorName}</p>
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Select Extension Runtime
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AD_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setQuickPayDuration(pkg.days)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        quickPayDuration === pkg.days
                          ? 'bg-[#D4A237]/20 border-[#D4A237]'
                          : 'bg-[#05080E] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{pkg.days} Days</div>
                      <div className="text-xs font-black text-[#D4A237] mt-0.5">R {pkg.price.toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickPayMethod('payfast')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center space-x-2 ${
                      quickPayMethod === 'payfast'
                        ? 'bg-[#D4A237]/20 border-[#D4A237] text-white'
                        : 'bg-[#05080E] border-slate-800 text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#D4A237]" />
                    <span>PayFast Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuickPayMethod('eft')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center space-x-2 ${
                      quickPayMethod === 'eft'
                        ? 'bg-[#D4A237]/20 border-[#D4A237] text-white'
                        : 'bg-[#05080E] border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-[#D4A237]" />
                    <span>Direct Bank EFT</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuickPayBanner(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isProcessingQuickPay}
                  onClick={() => handleProcessQuickPay(quickPayBanner)}
                  className="flex-2 py-3 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs rounded-xl uppercase tracking-wider shadow-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isProcessingQuickPay ? (
                    <span>Processing Payment...</span>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Pay (R {(AD_PACKAGES.find(p => p.days === quickPayDuration)?.price || 1500).toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT MODAL (PayFast & EFT Banking Instructions) */}
        {showPaymentModal && activePaymentOrder && (
          <AdPaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setActivePaymentOrder(null);
              setActivePayfastData(null);
              loadDashboard(true);
            }}
            order={activePaymentOrder}
            payfastData={activePayfastData || undefined}
          />
        )}

        {/* Auth Modal Trigger */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authModalMode}
          initialAccountType="advertiser"
          actionIntentName="manage your roadside advertiser account"
        />

      </div>
    </div>
  );
};
