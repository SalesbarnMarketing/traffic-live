import React, { useState, useEffect, useRef } from 'react';
import { AdvertisementBanner, FeedAdSettings, AdvertisingOrder } from '../types';
import {
  Megaphone,
  Power,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Save,
  X,
  AlertCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Shield,
  HelpCircle,
  LayoutTemplate,
  UploadCloud,
  Upload,
  Link,
  Check,
  RefreshCw,
  FileImage,
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Users,
  CreditCard,
  Building2,
  Phone,
  Mail,
  ArrowUpRight,
  CalendarDays,
  Sliders,
  Play,
  Pause,
  Percent,
  Zap,
  Gift,
  TimerOff,
  Ban,
  CalendarX,
  Database
} from 'lucide-react';
import { repairAdImageUrl } from '../utils/adUrlHelper';

interface AdminAdSettingsProps {
  currentAdminEmail?: string;
  currentAdminRole?: string;
}

export const AdminAdSettings: React.FC<AdminAdSettingsProps> = ({
  currentAdminEmail = 'Admin',
  currentAdminRole = 'Admin'
}) => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'banners' | 'orders' | 'settings'>('monitoring');

  const [settings, setSettings] = useState<FeedAdSettings>({
    isEnabled: true,
    banners: [],
    showSponsoredBadge: true,
    allowDismiss: true,
    autoRotateTopBanners: true,
    rotationIntervalSeconds: 10,
    showOnDashboard: true,
    updatedAt: new Date().toISOString()
  });

  const [orders, setOrders] = useState<AdvertisingOrder[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalImpressions: number;
    totalClicks: number;
    ctrPercent: number;
    activeCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    totalRevenue: number;
  }>({
    totalImpressions: 0,
    totalClicks: 0,
    ctrPercent: 0,
    activeCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    totalRevenue: 0
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Editor State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBanner, setEditingBanner] = useState<Partial<AdvertisementBanner> | null>(null);

  // Image Upload States
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Extend Modal State
  const [extendModalBanner, setExtendModalBanner] = useState<AdvertisementBanner | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);

  // Manual Expire Modal State
  const [expireModalBanner, setExpireModalBanner] = useState<AdvertisementBanner | null>(null);
  const [expireReason, setExpireReason] = useState<string>('');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<AdvertisingOrder | null>(null);

  // In-UI Delete Confirmation State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Creative Filter State: all | active | pending | expiring | expired
  const [bannerFilter, setBannerFilter] = useState<'all' | 'active' | 'pending' | 'expiring' | 'expired'>('all');
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'awaiting_payment' | 'active' | 'rejected'>('all');
  const [isCheckingExpirations, setIsCheckingExpirations] = useState<boolean>(false);

  // Grant 1 Free Month (Complimentary) Modal State
  const [freeMonthTarget, setFreeMonthTarget] = useState<{ type: 'banner' | 'order'; id: string; name: string } | null>(null);
  const [freeMonthReason, setFreeMonthReason] = useState<string>('Promotional Community Partner Grant / 1 Free Month Courtesy of Admin');
  const [freeMonthNotes, setFreeMonthNotes] = useState<string>('');

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';
    const email = currentAdminEmail || 'charlesodendaal43@gmail.com';
    return {
      'x-user-email': email,
      'x-admin-token': token,
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchAllAdData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/ads', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
          if (data.settings.lastDatabaseSyncAt) {
            setLastDatabaseSyncAt(data.settings.lastDatabaseSyncAt);
          }
        }
        if (data.orders) {
          setOrders(data.orders);
        }
        if (data.analytics) {
          setAnalytics(data.analytics);
          if (data.analytics.lastDatabaseSyncAt) {
            setLastDatabaseSyncAt(data.analytics.lastDatabaseSyncAt);
          }
          if (typeof data.analytics.unsyncedTelemetryCount === 'number') {
            setUnsyncedTelemetryCount(data.analytics.unsyncedTelemetryCount);
          }
        }
      } else if (res.status === 403) {
        setStatusMessage({ type: 'error', text: 'Unauthorized: Chief Admin privileges required to manage ads.' });
      }
    } catch (err) {
      console.warn('Failed to fetch ad settings & analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunManualExpirationCheck = async () => {
    setIsCheckingExpirations(true);
    try {
      const res = await fetch('/api/admin/ads/check-expirations', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
        await fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `⚡ Background check complete: ${data.newlyExpired} newly expired ads hidden, ${data.activeCount} active ads in rotation.`
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to run expiration background check.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error checking ad expirations.' });
    } finally {
      setIsCheckingExpirations(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const [isSyncingFromDb, setIsSyncingFromDb] = useState<boolean>(false);
  const [isSyncingToDb, setIsSyncingToDb] = useState<boolean>(false);
  const [lastDatabaseSyncAt, setLastDatabaseSyncAt] = useState<string | null>(null);
  const [unsyncedTelemetryCount, setUnsyncedTelemetryCount] = useState<number>(0);
  const [isCopyingToRelease, setIsCopyingToRelease] = useState<boolean>(false);
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState<boolean>(false);
  const [targetImpressionsInput, setTargetImpressionsInput] = useState<number>(60840);
  const [targetVisitorsInput, setTargetVisitorsInput] = useState<number>(63240);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  const handleCalibrateCounters = async () => {
    setIsCalibrating(true);
    try {
      const res = await fetch('/api/admin/ads/calibrate-counters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          targetTotalImpressions: Number(targetImpressionsInput),
          targetTotalVisitors: Number(targetVisitorsInput)
        })
      });
      if (res.ok) {
        const data = await res.json();
        await fetchAllAdData();
        setIsCalibrateModalOpen(false);
        setStatusMessage({
          type: 'success',
          text: `🎯 ${data.message || 'Counters calibrated successfully.'}`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to calibrate counters.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error contacting server to calibrate counters.' });
    } finally {
      setIsCalibrating(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  const handleSyncFromDb = async () => {
    setIsSyncingFromDb(true);
    try {
      const res = await fetch('/api/admin/ads/sync-from-db', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.feedAdSettings) setSettings(data.feedAdSettings);
        if (data.advertisingOrders) setOrders(data.advertisingOrders);
        await fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `🔄 ${data.message || 'Ad details loaded from Firestore DB into container memory.'}`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to sync ads from database.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error contacting server to sync ads from DB.' });
    } finally {
      setIsSyncingFromDb(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleSyncToDb = async () => {
    setIsSyncingToDb(true);
    try {
      const res = await fetch('/api/admin/ads/sync-to-db', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setLastDatabaseSyncAt(data.lastSyncAt || new Date().toISOString());
        setUnsyncedTelemetryCount(0);
        await fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `☁️ ${data.message || 'Real counts and telemetry successfully synced to Firestore database.'}`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to sync telemetry to database.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error contacting server to sync to database.' });
    } finally {
      setIsSyncingToDb(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCopyContainerToRelease = async () => {
    setIsCopyingToRelease(true);
    try {
      const res = await fetch('/api/admin/system/copy-container-to-release', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setStatusMessage({
          type: 'success',
          text: `🚀 ${data.message || 'Development container memory successfully copied to release.'}`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to copy container to release.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error copying container to release.' });
    } finally {
      setIsCopyingToRelease(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  useEffect(() => {
    fetchAllAdData();
  }, []);

  const handleUpdateAdvancedSettings = async (updates: Partial<FeedAdSettings>) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/ads/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...updates,
          updatedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStatusMessage({
          type: 'success',
          text: 'Ad rotation & display preferences updated.'
        });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to update preferences.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleToggleMaster = async (newState: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/ads/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          isEnabled: newState,
          showSponsoredBadge: settings.showSponsoredBadge,
          allowDismiss: settings.allowDismiss,
          autoRotateTopBanners: settings.autoRotateTopBanners,
          rotationIntervalSeconds: settings.rotationIntervalSeconds,
          showOnDashboard: settings.showOnDashboard,
          updatedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setStatusMessage({
          type: 'success',
          text: newState
            ? '📢 Feed Advertising is now ENABLED (Live on feeds and dashboard).'
            : '⏸️ Feed Advertising is now TURNED OFF (No ads will be displayed).'
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update advertising status.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner?.title || !editingBanner?.imageUrl || !editingBanner?.sponsorName) {
      setStatusMessage({ type: 'error', text: 'Please fill in Headline, Banner Image, and Sponsor Name.' });
      return;
    }

    setIsSaving(true);
    try {
      const duration = Number(editingBanner.durationDays) || 30;
      const start = editingBanner.startDate || new Date().toISOString();
      const end = editingBanner.endDate || new Date(new Date(start).getTime() + duration * 24 * 60 * 60 * 1000).toISOString();
      const isPaid = editingBanner.paymentReceived ?? true;
      const approved = editingBanner.approvalStatus || 'approved';

      const res = await fetch('/api/admin/ads/banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          ...editingBanner,
          durationDays: duration,
          startDate: start,
          endDate: end,
          paymentReceived: isPaid,
          approvalStatus: approved,
          isManualSponsorship: editingBanner.isManualSponsorship ?? true,
          amount: editingBanner.amount || 0,
          updatedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setIsModalOpen(false);
        setEditingBanner(null);
        fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `✅ Advertisement banner "${editingBanner.title}" saved successfully.`
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: errData.error || 'Failed to save advertisement banner.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error saving banner to server.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleQuickExtend = async (bannerId: string, days: number) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ads/banner/${bannerId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          days,
          updatedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setExtendModalBanner(null);
        fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `🗓️ Extended campaign rotation by +${days} days.`
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to extend campaign duration.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error extending campaign.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleExecuteGrantFreeMonth = async () => {
    if (!freeMonthTarget) return;
    setIsSaving(true);
    try {
      const url = freeMonthTarget.type === 'banner'
        ? `/api/admin/ads/banner/${freeMonthTarget.id}/grant-free-month`
        : `/api/admin/ads/orders/${freeMonthTarget.id}/grant-free-month`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          updatedBy: `${currentAdminEmail} (${currentAdminRole})`,
          reason: freeMonthReason.trim() || 'Promotional Community Partner Grant / 1 Free Month Courtesy of Admin',
          notes: freeMonthNotes.trim()
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        setFreeMonthTarget(null);
        setExtendModalBanner(null);
        setFreeMonthNotes('');
        fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `🎁 1 Free Month successfully granted to ${freeMonthTarget.name}! Extended by +30 Days and clearly tagged as 100% Complimentary.`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to grant free month.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error contacting server to grant free month.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleToggleOrderPayment = async (orderId: string, currentPaid: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ads/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          paymentReceived: !currentPaid,
          verifiedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        await fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: !currentPaid
            ? '💰 Bank EFT payment verified & marked as received.'
            : '⚠️ Payment status reset to unpaid / awaiting EFT.'
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update payment status.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error updating payment status.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleApproveOrder = async (orderId: string, markPaid: boolean = false) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ads/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          markPaymentReceived: markPaid,
          approvedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        await fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: '🎉 Advertiser submission approved and ad banner activated for live rotation!'
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to approve advertising order.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error approving order.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleRejectOrder = async (orderId: string, reason?: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ads/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          rejectionReason: reason || 'Advert creative did not meet editorial guidelines',
          rejectedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        await fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: 'Order rejected and creative disabled from rotation.'
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to reject order.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error rejecting order.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: AdvertisingOrder['status']) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ads/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          status: newStatus,
          approvedBy: `${currentAdminEmail} (${currentAdminRole})`
        })
      });

      if (res.ok) {
        fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `Order status updated to "${newStatus.toUpperCase()}".`
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to update order status.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error updating order.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    setIsSaving(true);
    try {
      let res = await fetch(`/api/admin/ads/banner/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ deletedBy: `${currentAdminEmail} (${currentAdminRole})` })
      });

      if (!res.ok) {
        res = await fetch(`/api/admin/ads/banner/${id}/delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ deletedBy: `${currentAdminEmail} (${currentAdminRole})` })
        });
      }

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setConfirmDeleteId(null);
        fetchAllAdData();
        setStatusMessage({ type: 'success', text: `🗑️ Deleted banner "${title}".` });
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: errData.error || 'Failed to delete banner.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error contacting server to delete banner.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleManualExpireBanner = async (bannerId: string, bannerTitle: string, reason?: string) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/ads/banner/${bannerId}/expire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          updatedBy: `${currentAdminEmail} (${currentAdminRole})`,
          reason: reason || expireReason.trim() || 'Manual early retirement by Administrator'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        setExpireModalBanner(null);
        setExpireReason('');
        fetchAllAdData();
        setStatusMessage({
          type: 'success',
          text: `🛑 Campaign "${bannerTitle}" manually expired and retired from live rotation.`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: err.error || 'Failed to expire campaign.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error contacting server to expire campaign.' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleToggleBannerActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ads/banner/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ updatedBy: `${currentAdminEmail} (${currentAdminRole})` })
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        fetchAllAdData();
      }
    } catch (err) {
      console.warn('Failed to toggle banner status:', err);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).' });
      return;
    }

    setIsProcessingFile(true);
    const originalSize = formatFileSize(file.size);
    const fileName = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessingFile(false);
        return;
      }

      // For SVGs or reasonably sized images (< 1.2MB), preserve original image directly
      if (file.type.includes('svg') || file.size <= 1.2 * 1024 * 1024) {
        setEditingBanner((prev) => (prev ? { ...prev, imageUrl: result } : null));
        setUploadedFileMeta({ name: fileName, size: originalSize });
        setIsProcessingFile(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

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
            // Fill background with white to avoid black/grey transparency artifacts
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setEditingBanner((prev) => (prev ? { ...prev, imageUrl: compressedDataUrl } : null));
            setUploadedFileMeta({ name: fileName, size: originalSize });
          } else {
            setEditingBanner((prev) => (prev ? { ...prev, imageUrl: result } : null));
            setUploadedFileMeta({ name: fileName, size: originalSize });
          }
        } catch {
          setEditingBanner((prev) => (prev ? { ...prev, imageUrl: result } : null));
          setUploadedFileMeta({ name: fileName, size: originalSize });
        } finally {
          setIsProcessingFile(false);
        }
      };
      img.onerror = () => {
        setEditingBanner((prev) => (prev ? { ...prev, imageUrl: result } : null));
        setUploadedFileMeta({ name: fileName, size: originalSize });
        setIsProcessingFile(false);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setStatusMessage({ type: 'error', text: 'Failed to read image file.' });
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const openCreateModal = () => {
    const today = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setEditingBanner({
      title: '',
      subtitle: '',
      imageUrl: '',
      targetUrl: '',
      sponsorName: '',
      sponsorBadge: 'Official Sponsor',
      ctaText: 'Learn More',
      enabled: true,
      position: 'both',
      durationDays: 30,
      startDate: today.toISOString().split('T')[0],
      endDate: future.toISOString().split('T')[0],
      paymentReceived: true,
      approvalStatus: 'approved',
      isManualSponsorship: false,
      amount: 0
    });
    setUploadedFileMeta(null);
    setIsModalOpen(true);
  };

  const openManualEftModal = () => {
    const today = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setEditingBanner({
      title: '',
      subtitle: '',
      imageUrl: '',
      targetUrl: '',
      sponsorName: '',
      sponsorBadge: 'Official Safety Partner',
      ctaText: 'Visit Partner',
      enabled: true,
      position: 'both',
      durationDays: 30,
      startDate: today.toISOString().split('T')[0],
      endDate: future.toISOString().split('T')[0],
      paymentReceived: true,
      approvalStatus: 'approved',
      isManualSponsorship: true,
      packageName: 'Direct EFT Sponsorship',
      paymentMethod: 'eft',
      amount: 0
    });
    setUploadedFileMeta(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: AdvertisementBanner) => {
    setEditingBanner({
      ...banner,
      startDate: banner.startDate ? banner.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: banner.endDate ? banner.endDate.split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationDays: banner.durationDays || 30,
      paymentReceived: banner.paymentReceived ?? true,
      approvalStatus: banner.approvalStatus || (banner.enabled ? 'approved' : 'pending'),
      isManualSponsorship: banner.isManualSponsorship ?? false,
      amount: banner.amount || 0
    });
    setUploadedFileMeta(
      (banner.imageData || banner.imageUrl)?.startsWith('data:')
        ? { name: 'Uploaded Custom Image', size: 'Local File' }
        : banner.imageUrl
        ? { name: banner.imageUrl.split('/').pop() || 'Existing Graphic', size: 'Active Banner' }
        : null
    );
    setIsModalOpen(true);
  };

  const calculateDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const computedActiveCount = settings.banners.filter((b) => {
    const daysLeft = calculateDaysRemaining(b.endDate);
    const isExpired = b.isExpired || (daysLeft !== null && daysLeft <= 0);
    const isPending = b.approvalStatus === 'pending' || b.status === 'pending_approval';
    return b.enabled && !isExpired && !isPending;
  }).length;

  const computedExpiringSoonCount = settings.banners.filter((b) => {
    const daysLeft = calculateDaysRemaining(b.endDate);
    const isExpired = b.isExpired || (daysLeft !== null && daysLeft <= 0);
    return !isExpired && daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
  }).length;

  const computedExpiredCount = settings.banners.filter((b) => {
    const daysLeft = calculateDaysRemaining(b.endDate);
    return b.isExpired || (daysLeft !== null && daysLeft <= 0);
  }).length;

  const computedTotalImpressions = settings.banners.reduce((sum, b) => sum + (b.impressions || 0), 0);
  const computedTotalClicks = settings.banners.reduce((sum, b) => sum + (b.clicks || 0), 0);
  const computedCtr = computedTotalImpressions > 0 ? (((computedTotalClicks) / computedTotalImpressions) * 100).toFixed(1) : '0.0';

  const activeCampaignsCount = analytics.activeCount ?? computedActiveCount;
  const expiringSoonCampaignsCount = analytics.expiringSoonCount ?? computedExpiringSoonCount;
  const expiredCampaignsCount = analytics.expiredCount ?? computedExpiredCount;
  const totalImpressionsCount = analytics.totalImpressions ?? computedTotalImpressions;
  const totalClicksCount = analytics.totalClicks ?? computedTotalClicks;
  const ctrValue = analytics.ctrPercent !== undefined && analytics.ctrPercent !== null ? analytics.ctrPercent : computedCtr;

  const filteredBanners = settings.banners.filter((b) => {
    const daysLeft = calculateDaysRemaining(b.endDate);
    const isExpired = b.isExpired || (daysLeft !== null && daysLeft <= 0);
    const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft <= 7;
    const isPending = b.approvalStatus === 'pending' || b.status === 'pending_approval';
    const isActive = b.enabled && !isExpired && !isPending;

    if (bannerFilter === 'active') return isActive;
    if (bannerFilter === 'pending') return isPending;
    if (bannerFilter === 'expiring') return isExpiringSoon;
    if (bannerFilter === 'expired') return isExpired;
    return true;
  });

  const pendingOrdersCount = orders.filter((o) => o.approvalStatus === 'pending' || o.status === 'pending').length;
  const awaitingEftCount = orders.filter((o) => !o.paymentReceived).length;
  const pendingBannersCount = settings.banners.filter((b) => b.approvalStatus === 'pending' || b.status === 'pending_approval').length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'pending') return o.approvalStatus === 'pending' || o.status === 'pending';
    if (orderFilter === 'awaiting_payment') return !o.paymentReceived;
    if (orderFilter === 'active') return o.status === 'active' || o.status === 'approved';
    if (orderFilter === 'rejected') return o.status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Control & Master Switch */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        {/* Tier 1: Title, Rotation Status & Primary Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-colors ${
              settings.isEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-lg shadow-amber-950/40'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}>
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Ad Management & Rotation
                </h2>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center space-x-1.5 ${
                  settings.isEnabled
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${settings.isEnabled ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span>{settings.isEnabled ? 'Rotation Active' : 'Rotation Paused'}</span>
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 font-mono px-2 py-0.5 rounded-full font-bold">
                  {settings.banners.length} Creatives
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage advertiser creative uploads, rotation schedules, duration countdowns, PayFast & EFT bookings, and performance telemetry.
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              type="button"
              onClick={fetchAllAdData}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Sync & Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleToggleMaster(!settings.isEnabled)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg cursor-pointer ${
                settings.isEnabled
                  ? 'bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/40'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{settings.isEnabled ? 'Pause Rotation' : 'Enable Rotation'}</span>
            </button>

            <button
              type="button"
              onClick={openManualEftModal}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Add a manual sponsorship where payment was received directly via Bank EFT"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>+ Direct EFT</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md shadow-amber-950/30 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Creative</span>
            </button>
          </div>
        </div>

        {/* Tier 2: System Utilities & Background Daemon Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mr-1">Database & Utilities:</span>
            <button
              type="button"
              onClick={handleSyncToDb}
              disabled={isSyncingToDb}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 transition text-[11px] font-medium cursor-pointer shadow-sm disabled:opacity-50"
              title="Push real counts (impressions, clicks, reach) to Firestore DB"
            >
              <UploadCloud className={`w-3 h-3 ${isSyncingToDb ? 'animate-bounce text-emerald-400' : 'text-emerald-400'}`} />
              <span>{isSyncingToDb ? 'Syncing to DB...' : 'Sync Real Counts to DB'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncFromDb}
              disabled={isSyncingFromDb}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition text-[11px] font-medium cursor-pointer"
              title="Load ad details directly from Firestore DB into container memory"
            >
              <Database className={`w-3 h-3 ${isSyncingFromDb ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{isSyncingFromDb ? 'Syncing...' : 'Sync DB to Container'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyContainerToRelease}
              disabled={isCopyingToRelease}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition text-[11px] font-medium cursor-pointer"
              title="Copy development container state to release seed and build artifacts"
            >
              <UploadCloud className={`w-3 h-3 ${isCopyingToRelease ? 'animate-bounce text-indigo-400' : 'text-slate-400'}`} />
              <span>{isCopyingToRelease ? 'Copying...' : 'Copy Dev to Release'}</span>
            </button>

            <button
              type="button"
              onClick={handleRunManualExpirationCheck}
              disabled={isCheckingExpirations}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition text-[11px] font-medium cursor-pointer"
              title="Trigger background check to sweep and retire expired campaigns"
            >
              <Zap className={`w-3 h-3 ${isCheckingExpirations ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span>{isCheckingExpirations ? 'Sweeping...' : 'Check Expirations'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const curImpressions = (settings.banners || []).reduce((acc, b) => acc + (b.impressions || 0), 0);
                setTargetImpressionsInput(Math.max(60840, curImpressions));
                setTargetVisitorsInput(63240);
                setIsCalibrateModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 transition text-[11px] font-medium cursor-pointer"
              title="Calibrate cumulative impression and visitor counts baseline"
            >
              <TrendingUp className="w-3 h-3 text-indigo-400" />
              <span>Calibrate Counters</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <div className="flex items-center space-x-2 bg-[#07090E] border border-slate-800/80 px-3 py-1.5 rounded-lg text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Auto DB Sync: <span className="text-emerald-400 font-semibold">Active (15m)</span></span>
              {lastDatabaseSyncAt && (
                <span className="text-slate-500 font-mono text-[10px] pl-1.5 border-l border-slate-800">
                  Last: {new Date(lastDatabaseSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 bg-[#07090E] border border-slate-800/80 px-3 py-1.5 rounded-lg text-slate-400">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-medium">Auto-Expiration: <span className="text-emerald-400 font-semibold">Active (30s)</span></span>
              {settings.lastExpirationCheckAt && (
                <span className="text-slate-500 font-mono text-[10px] pl-1.5 border-l border-slate-800">
                  Sweep: {new Date(settings.lastExpirationCheckAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tier 3: Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          {[
            { id: 'monitoring', label: 'Campaign Monitor & Telemetry', icon: BarChart3 },
            { 
              id: 'banners', 
              label: `Rotating Creatives (${settings.banners.length})`, 
              icon: Layers,
              badge: pendingBannersCount > 0 ? `${pendingBannersCount} review` : undefined,
              badgeColor: 'bg-amber-500 text-slate-950'
            },
            { 
              id: 'orders', 
              label: `Advertiser Bookings (${orders.length})`, 
              icon: CreditCard,
              badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} pending approval` : (awaitingEftCount > 0 ? `${awaitingEftCount} awaiting EFT` : undefined),
              badgeColor: pendingOrdersCount > 0 ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-sky-500/30 text-sky-300'
            },
            { id: 'settings', label: 'Display & Carousel Settings', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between border animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: CAMPAIGN MONITOR & TELEMETRY */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Live Real Counts & Database Sync Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-[#0B0D12] to-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5 sm:mt-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">Real Counts & Telemetry Engine</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Real Tracking Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Every impression and click is counted directly from live user interactions. Data is preserved safely on local storage and synchronized to the Firestore DB periodically every 15 minutes and immediately on demand.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={handleSyncToDb}
                disabled={isSyncingToDb}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isSyncingToDb ? 'animate-bounce' : ''}`} />
                <span>{isSyncingToDb ? 'Syncing to DB...' : 'Sync Real Counts to DB'}</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Impressions</span>
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {totalImpressionsCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">Live Feed & Dashboard Views</span>
              </div>
            </div>

            <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Total Clicks</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {totalClicksCount.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Outbound Action Conversions</span>
              </div>
            </div>

            <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Avg CTR</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                  {typeof ctrValue === 'number' ? ctrValue.toFixed(1) : ctrValue}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Click-Through Rate Benchmark</span>
              </div>
            </div>

            <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Active Campaigns</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {activeCampaignsCount}
                </span>
                <span className="text-xs text-slate-400">/ {settings.banners.length} total</span>
              </div>
              <span className="text-[10px] text-amber-400 block mt-1">
                {expiringSoonCampaignsCount > 0 ? `⚠️ ${expiringSoonCampaignsCount} expiring in <7 days` : 'All rotation schedules healthy'}
              </span>
            </div>
          </div>

          {/* Performance Breakdown Table */}
          <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Campaign Telemetry & Rotation Status
                </h4>
              </div>
              
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#06080D] p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                {[
                  { id: 'all', label: `All (${settings.banners.length})` },
                  { id: 'active', label: `🟢 Active (${activeCampaignsCount})` },
                  { id: 'expiring', label: `⚠️ Expiring (${expiringSoonCampaignsCount})` },
                  { id: 'expired', label: `🔴 Expired (${expiredCampaignsCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBannerFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      bannerFilter === f.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#07090E] text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Campaign / Creative</th>
                    <th className="py-3 px-4">Sponsor</th>
                    <th className="py-3 px-4">Rotation Schedule</th>
                    <th className="py-3 px-4">Status & Days Left</th>
                    <th className="py-3 px-4 text-center">Impressions</th>
                    <th className="py-3 px-4 text-center">Clicks</th>
                    <th className="py-3 px-4 text-center">CTR</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredBanners.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No campaigns found for selected filter ({bannerFilter}).
                      </td>
                    </tr>
                  ) : (
                    filteredBanners.map((b) => {
                      const daysLeft = calculateDaysRemaining(b.endDate);
                      const ctr = b.impressions && b.impressions > 0 ? (((b.clicks || 0) / b.impressions) * 100).toFixed(1) : '0.0';
                      const isExpired = b.isExpired || (daysLeft !== null && daysLeft <= 0);
                      const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

                      return (
                        <tr
                          key={b.id}
                          className={`hover:bg-slate-900/40 transition ${
                            isExpired ? 'bg-red-950/15' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                                <img
                                  src={repairAdImageUrl(b.imageUrl, b.id, b.title)}
                                  alt={b.title}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-white block truncate max-w-[180px]">{b.title}</span>
                                <span className="text-[10px] text-slate-500 block capitalize">{b.position} placement</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-amber-400 block">{b.sponsorName}</span>
                            {(b.isComplimentary || b.paymentMethod === 'complimentary') && (
                              <span className="inline-flex items-center space-x-1 bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase mt-0.5">
                                <Gift className="w-2.5 h-2.5 text-purple-400" />
                                <span>Free Month</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] font-mono text-slate-400">
                            <div>
                              {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'Immediate'} →{' '}
                              {b.endDate ? new Date(b.endDate).toLocaleDateString() : 'Ongoing'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-950/90 text-red-300 border border-red-500/50 flex items-center w-fit space-x-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                                <span>Expired (Hidden)</span>
                              </span>
                            ) : daysLeft !== null ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isExpiringSoon
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              }`}>
                                {daysLeft} Days Left
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Active</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-white">
                            {(b.impressions || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                            {(b.clicks || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                            {ctr}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {!isExpired && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpireModalBanner(b);
                                    setExpireReason('');
                                  }}
                                  className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-red-950/70 hover:bg-red-900/90 text-red-300 border border-red-500/40 transition cursor-pointer flex items-center space-x-1"
                                  title="Manually retire and expire this advert immediately"
                                >
                                  <TimerOff className="w-3 h-3 text-red-400" />
                                  <span className="hidden sm:inline">Expire</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setFreeMonthTarget({
                                    type: 'banner',
                                    id: b.id,
                                    name: `${b.title} (${b.sponsorName})`
                                  });
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 transition cursor-pointer flex items-center space-x-1"
                                title="Grant 1 Free Month (Complimentary) to this advertiser"
                              >
                                <Gift className="w-3 h-3 text-purple-400" />
                                <span className="hidden sm:inline">Free Month</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setExtendModalBanner(b);
                                  setExtendDays(30);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer flex items-center space-x-1 ${
                                  isExpired
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow'
                                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                                }`}
                                title={isExpired ? 'Reactivate & Extend Ad' : 'Extend Campaign Duration'}
                              >
                                {isExpired ? (
                                  <>
                                    <Zap className="w-3 h-3" />
                                    <span>Reactivate</span>
                                  </>
                                ) : (
                                  <span>+ Extend</span>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(b)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE ROTATING CREATIVES */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <LayoutTemplate className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Configured Advertisement Banners ({settings.banners.length})
              </h4>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#06080D] p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                {[
                  { id: 'all', label: `All (${settings.banners.length})` },
                  { id: 'active', label: `🟢 Active (${analytics.activeCount})` },
                  { id: 'pending', label: `⚠️ Review (${pendingBannersCount})` },
                  { id: 'expiring', label: `⏳ Expiring (${analytics.expiringSoonCount})` },
                  { id: 'expired', label: `🔴 Expired (${analytics.expiredCount})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setBannerFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      bannerFilter === f.id
                        ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openManualEftModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1"
                title="Add Direct Bank EFT Sponsorship without payment gateway"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>+ Direct EFT</span>
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Banner</span>
              </button>
            </div>
          </div>

          {filteredBanners.length === 0 ? (
            <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">No Banners in this Category</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {bannerFilter === 'expired'
                  ? 'There are currently no expired advertisements. All active campaigns are within their scheduled rotation period.'
                  : bannerFilter === 'pending'
                  ? 'No advertisement campaigns currently pending admin review or approval.'
                  : 'Create an advertisement with an uploaded banner image, sponsor information, and action link to activate rotation.'}
              </p>
              {bannerFilter !== 'all' ? (
                <button
                  onClick={() => setBannerFilter('all')}
                  className="mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Show All Banners
                </button>
              ) : (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={openManualEftModal}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    + Add Direct EFT Sponsorship
                  </button>
                  <button
                    onClick={openCreateModal}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    + Create Banner
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBanners.map((banner) => {
                const daysLeft = calculateDaysRemaining(banner.endDate);
                const isExpired = banner.isExpired || (daysLeft !== null && daysLeft <= 0);
                const isExpiringSoon = !isExpired && daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                const isPendingApproval = banner.approvalStatus === 'pending' || banner.status === 'pending_approval';

                return (
                  <div
                    key={banner.id}
                    className={`bg-[#0B0D12] border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between ${
                      isPendingApproval
                        ? 'border-amber-500/50 bg-amber-950/10 shadow-lg shadow-amber-950/20'
                        : isExpired
                        ? 'border-red-900/60 bg-red-950/10 shadow-lg shadow-red-950/20'
                        : banner.enabled
                        ? 'border-slate-800 hover:border-slate-700 shadow-xl'
                        : 'border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Banner Image Preview */}
                      <div className="relative h-44 bg-slate-900 overflow-hidden group">
                        <img
                          key={banner.imageUrl || banner.id}
                          src={banner.imageData || repairAdImageUrl(banner.imageUrl, banner.id, banner.title)}
                          alt={banner.title}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isExpired ? 'grayscale-[50%] brightness-75' : ''
                          }`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D12] via-transparent to-black/40" />

                        {/* Sponsor Badge */}
                        <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{banner.sponsorBadge || 'Sponsored'}</span>
                        </div>

                        {/* Status Pill */}
                        <div className="absolute top-3 right-3 flex items-center space-x-2">
                          {isPendingApproval ? (
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border backdrop-blur-md bg-amber-950/90 text-amber-300 border-amber-500/50 flex items-center space-x-1 animate-pulse">
                              <AlertCircle className="w-3 h-3 text-amber-400" />
                              <span>Pending Review</span>
                            </span>
                          ) : isExpired ? (
                            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full border backdrop-blur-md bg-red-950/90 text-red-300 border-red-500/50 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                              <span>Expired (Hidden)</span>
                            </span>
                          ) : daysLeft !== null ? (
                            <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border backdrop-blur-md ${
                              isExpiringSoon
                                ? 'bg-amber-950/90 text-amber-300 border-amber-500/50 animate-pulse'
                                : 'bg-sky-950/90 text-sky-300 border-sky-500/50'
                            }`}>
                              {daysLeft}d left
                            </span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleToggleBannerActive(banner.id)}
                            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border backdrop-blur-md transition cursor-pointer ${
                              banner.enabled && !isExpired && !isPendingApproval
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                : isPendingApproval
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                                : isExpired
                                ? 'bg-red-950/80 text-red-300 border-red-500/50'
                                : 'bg-slate-900/80 text-slate-400 border-slate-700'
                            }`}
                          >
                            {banner.enabled && !isExpired && !isPendingApproval ? 'Active' : isPendingApproval ? 'Unapproved' : isExpired ? 'Expired' : 'Disabled'}
                          </button>
                        </div>

                        {/* Sponsor Name Bar */}
                        <div className="absolute bottom-2 left-3 text-[11px] font-bold text-white/90 drop-shadow-md flex items-center space-x-2">
                          <span>{banner.sponsorName}</span>
                          {banner.paymentReceived && (
                            <span className="bg-emerald-500/80 text-slate-950 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider">
                              ✓ Paid
                            </span>
                          )}
                          {banner.isManualSponsorship && (
                            <span className="bg-sky-500/80 text-slate-950 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider">
                              Direct EFT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Body Content */}
                      <div className="p-4 space-y-2">
                        {isPendingApproval && (
                          <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 text-[11px] text-amber-300">
                            <div className="flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold block">Ad Awaiting Admin Review & Approval</span>
                                <span className="text-[10px] text-amber-300/80">
                                  Not broadcasting in live rotation yet. Click Approve to publish.
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                // Save immediate approval without mutating modal editing state
                                fetch('/api/admin/ads/banner', {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    ...getAuthHeaders()
                                  },
                                  body: JSON.stringify({
                                    ...banner,
                                    enabled: true,
                                    approvalStatus: 'approved',
                                    status: 'active',
                                    paymentReceived: banner.paymentReceived ?? true,
                                    updatedBy: `${currentAdminEmail} (${currentAdminRole})`
                                  })
                                }).then(() => fetchAllAdData());
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 transition cursor-pointer shadow"
                            >
                              Approve Now
                            </button>
                          </div>
                        )}

                        {isExpired && (
                          <div className="bg-red-950/60 border border-red-500/30 rounded-xl p-2.5 flex items-start space-x-2 text-[11px] text-red-300">
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Campaign Expired & Automatically Hidden</span>
                              <span className="text-[10px] text-red-400">
                                This ad reached its duration limit and has been hidden from live rotation feeds.
                              </span>
                            </div>
                          </div>
                        )}

                        <h5 className="text-base font-black text-white leading-snug tracking-tight">
                          {banner.title}
                        </h5>
                        {banner.subtitle && (
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                            {banner.subtitle}
                          </p>
                        )}

                        {/* Campaign Dates Bar */}
                        <div className="bg-[#07090E] p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 font-mono">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : 'Now'} →{' '}
                              {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : 'Ongoing'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold ${isExpired ? 'text-red-400' : 'text-sky-400'}`}>
                            {banner.durationDays || 30} Days Total
                          </span>
                        </div>

                        {/* Sponsorship & Financial Info */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          {(banner.isComplimentary || banner.paymentMethod === 'complimentary') ? (
                            <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md font-mono flex items-center space-x-1 font-bold">
                              <Gift className="w-3 h-3 text-purple-400" />
                              <span>100% Complimentary (Free Month Granted)</span>
                            </span>
                          ) : banner.paymentReceived ? (
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono flex items-center space-x-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Payment Received {banner.amount ? `(R${banner.amount})` : ''}</span>
                            </span>
                          ) : (
                            <span className="bg-amber-950/60 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono flex items-center space-x-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Awaiting EFT Payment</span>
                            </span>
                          )}

                          {banner.isManualSponsorship && !(banner.isComplimentary || banner.paymentMethod === 'complimentary') && (
                            <span className="bg-sky-950/60 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono">
                              Direct Bank EFT Sponsorship
                            </span>
                          )}
                        </div>

                        {/* Complimentary Admin Grant Callout */}
                        {(banner.isComplimentary || banner.paymentMethod === 'complimentary') && (
                          <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-2.5 text-[11px] text-purple-200 flex items-start space-x-2">
                            <Gift className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-black text-purple-300">
                                🎁 Complimentary Month Awarded
                              </div>
                              <div className="text-[10px] text-purple-300/80">
                                Awarded by <span className="font-mono text-purple-200">{banner.complimentaryGrantedBy || 'Admin'}</span>
                                {banner.complimentaryGrantedAt && ` on ${new Date(banner.complimentaryGrantedAt).toLocaleDateString()}`}.
                                {banner.complimentaryReason && ` Reason: "${banner.complimentaryReason}"`}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-t border-slate-800/80">
                          <span className="flex items-center space-x-1">
                            <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                            <span className="capitalize">{banner.position} placement</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Eye className="w-3.5 h-3.5 text-sky-400" />
                            <span>{banner.impressions || 0} views</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{banner.clicks || 0} clicks</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-3 bg-[#07080A] border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFreeMonthTarget({
                              type: 'banner',
                              id: banner.id,
                              name: `${banner.title} (${banner.sponsorName})`
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-black uppercase bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 transition cursor-pointer flex items-center space-x-1.5"
                          title="Grant 1 Free Month (Complimentary)"
                        >
                          <Gift className="w-3.5 h-3.5 text-purple-400" />
                          <span>Give Free Month</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setExtendModalBanner(banner);
                            setExtendDays(30);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center space-x-1 ${
                            isExpired
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md font-black'
                              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {isExpired ? <Zap className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{isExpired ? 'Reactivate' : 'Extend'}</span>
                        </button>

                        {!isExpired && (
                          <button
                            type="button"
                            onClick={() => {
                              setExpireModalBanner(banner);
                              setExpireReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-black uppercase bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 transition cursor-pointer flex items-center space-x-1"
                            title="Manually retire / expire campaign early"
                          >
                            <TimerOff className="w-3.5 h-3.5 text-red-400" />
                            <span>Expire</span>
                          </button>
                        )}

                        <a
                          href={banner.targetUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-slate-400 hover:text-white font-bold flex items-center space-x-1 truncate max-w-[140px]"
                        >
                          <span>{banner.ctaText || 'Learn More'}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(banner)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="Edit Advertisement"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {confirmDeleteId === banner.id ? (
                          <div className="flex items-center space-x-1 bg-red-950/80 border border-red-500/50 p-1 rounded-xl animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => handleDeleteBanner(banner.id, banner.title)}
                              disabled={isSaving}
                              className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 transition cursor-pointer shadow"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete?</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[10px] transition cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(banner.id)}
                            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-900/40 transition cursor-pointer"
                            title="Delete Advertisement"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CLIENT BOOKINGS & APPROVAL QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                Advertiser Submissions & Approval Queue ({orders.length})
              </h4>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#06080D] p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              {[
                { id: 'all', label: `All (${orders.length})` },
                { id: 'pending', label: `⚠️ Pending Approval (${pendingOrdersCount})` },
                { id: 'awaiting_payment', label: `⏳ Awaiting EFT (${awaitingEftCount})` },
                { id: 'active', label: `🟢 Approved & Live` },
                { id: 'rejected', label: `Rejected` }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOrderFilter(f.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    orderFilter === f.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">No Orders in this View</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {orderFilter === 'pending'
                  ? 'All advertiser orders have been reviewed and approved.'
                  : orderFilter === 'awaiting_payment'
                  ? 'There are no pending direct EFT orders awaiting payment confirmation.'
                  : 'Orders placed by advertisers via the Pricing Page with creative media will appear here automatically.'}
              </p>
              {orderFilter !== 'all' && (
                <button
                  onClick={() => setOrderFilter('all')}
                  className="mt-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Show All Orders
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isPendingApproval = order.approvalStatus === 'pending' || order.status === 'pending';
                const isPaid = !!order.paymentReceived;

                return (
                  <div
                    key={order.id}
                    className={`bg-[#0B0D12] border rounded-2xl p-4 sm:p-5 transition shadow-xl ${
                      isPendingApproval
                        ? 'border-amber-500/50 bg-amber-950/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4 min-w-0">
                        {order.adImageUrl ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-amber-500/40 shrink-0 relative group">
                            <img
                              src={repairAdImageUrl(order.adImageUrl, order.bannerId, order.businessName)}
                              alt="Creative"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition cursor-pointer"
                            >
                              Preview
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-base font-black text-white">{order.businessName}</h5>
                            
                            {/* Approval Status Badge */}
                            {isPendingApproval ? (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center space-x-1 animate-pulse">
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                                <span>Pending Approval</span>
                              </span>
                            ) : (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                                order.status === 'active' || order.status === 'approved'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                  : order.status === 'paid'
                                  ? 'bg-sky-950 text-sky-300 border-sky-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                              }`}>
                                {order.status}
                              </span>
                            )}

                            {/* Payment Received Badge */}
                            {(order.isComplimentary || order.paymentMethod === 'complimentary') ? (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase bg-purple-950 text-purple-300 border border-purple-500/40 flex items-center space-x-1 font-mono">
                                <Gift className="w-3 h-3 text-purple-400" />
                                <span>100% Complimentary (Free Month)</span>
                              </span>
                            ) : isPaid ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Payment Received</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Awaiting EFT Payment</span>
                              </span>
                            )}

                            <span className="text-[11px] font-mono text-amber-400 font-black">
                              {(order.isComplimentary || order.paymentMethod === 'complimentary') ? 'R0 (Complimentary)' : `R${order.amount} (${order.paymentMethod.toUpperCase()})`}
                            </span>

                            {order.isManualSponsorship && !(order.isComplimentary || order.paymentMethod === 'complimentary') && (
                              <span className="text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                                Direct EFT Sponsorship
                              </span>
                            )}
                          </div>

                          {/* Complimentary Details Box for Order */}
                          {(order.isComplimentary || order.paymentMethod === 'complimentary') && (
                            <div className="mt-2 p-2.5 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs text-purple-200 flex items-start space-x-2">
                              <Gift className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-black text-purple-300">
                                  🎁 1 Free Month Awarded by Admin
                                </div>
                                <div className="text-[10px] text-purple-300/80 mt-0.5">
                                  Granted by: <span className="font-mono text-purple-100 font-bold">{order.complimentaryGrantedBy || 'Admin'}</span>
                                  {order.complimentaryGrantedAt && ` on ${new Date(order.complimentaryGrantedAt).toLocaleDateString()}`}.
                                  {order.complimentaryReason && ` Reason: "${order.complimentaryReason}"`}
                                </div>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-slate-300 mt-1">
                            <strong className="text-amber-400">{order.packageName}</strong> • {order.contactName} ({order.phone} / {order.email})
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>Ref: {order.referenceNumber || order.id}</span>
                            <span>•</span>
                            <span>Rotation: {order.durationDays || 30} Days</span>
                            <span>•</span>
                            <span>Submitted: {new Date(order.createdAt).toLocaleString()}</span>
                            {order.approvedBy && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400">Approved by: {order.approvedBy}</span>
                              </>
                            )}
                          </div>

                          {order.notes && (
                            <div className="mt-2 p-2 bg-[#07090E] rounded-xl border border-slate-800 text-xs text-slate-300">
                              <span className="text-slate-500 font-bold">Notes / Requirements: </span>
                              {order.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 border-slate-800/80 pt-3 lg:pt-0">
                        <a
                          href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(order.contactName)},%20thank%20you%20for%20booking%20advertising%20with%20Live%20Traffic%20NPC%20(Ref:%20${order.referenceNumber}).`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase transition cursor-pointer flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        {/* Grant 1 Free Month Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setFreeMonthTarget({
                              type: 'order',
                              id: order.id,
                              name: `${order.businessName} (${order.packageName})`
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1"
                          title="Grant 1 Free Month (Complimentary) & Extend live rotation"
                        >
                          <Gift className="w-3.5 h-3.5 text-purple-400" />
                          <span>Free Month</span>
                        </button>

                        {/* Payment Received Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleOrderPayment(order.id, isPaid)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1 ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          }`}
                          title={isPaid ? 'Payment already verified (Click to reset)' : 'Click to verify & mark Bank EFT payment as received'}
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>{isPaid ? '✓ Paid (EFT)' : 'Mark Payment Received'}</span>
                        </button>

                        {/* Approve and Activate Button */}
                        {isPendingApproval || order.status !== 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(order.id, true)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg shadow-emerald-950/30 flex items-center space-x-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Go Live</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}

                        {order.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleRejectOrder(order.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 text-xs font-bold transition cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DISPLAY & CAROUSEL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h4 className="text-base font-black text-white uppercase tracking-wider">
              Rotation Schedule & Feed Display Engine
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Configure automated rotation behavior, carousel durations, and sponsored labels across public feeds and dashboard.
            </p>
          </div>

          <div className="space-y-4">
            {/* Feed Advert Placement Mode (Random, Mid, Bottom, Top, Both) */}
            <div className="p-4 bg-[#07090E] rounded-xl border border-slate-800 space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center space-x-2">
                    <span>Feed Advert Placement Mode</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono uppercase">
                      {settings.feedAdPlacement || 'random'}
                    </span>
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Choose where ads appear across the live incident feeds (or allow randomized card placement):
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'random', label: 'Random', icon: '🎲', desc: 'Dispersed at random positions in feed' },
                  { id: 'mid', label: 'Mid-Feed', icon: '📍', desc: 'Middle of incident feed cards' },
                  { id: 'bottom', label: 'Bottom', icon: '🔻', desc: 'Bottom of feed after incidents' },
                  { id: 'top', label: 'Top Header', icon: '📌', desc: 'Sticky carousel banner at top' },
                  { id: 'both', label: 'All / Both', icon: '🌟', desc: 'Top header carousel + in-feed cards' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdateAdvancedSettings({ feedAdPlacement: opt.id as any })}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                      (settings.feedAdPlacement || 'random') === opt.id
                        ? 'border-amber-400 bg-amber-500/15 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                        : 'border-slate-800 bg-[#0B0D12] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 mb-1">
                      <span className="text-sm">{opt.icon}</span>
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight block">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Rotate Top Carousel */}
            <div className="flex items-center justify-between p-4 bg-[#07090E] rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-black text-white block">Auto-Rotate Top Banners Carousel</span>
                <span className="text-[11px] text-slate-400 block">
                  Automatically cycle through active campaign banners at the top of the live feed and dashboard.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoRotateTopBanners ?? true}
                onChange={(e) => handleUpdateAdvancedSettings({ autoRotateTopBanners: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Rotation Interval */}
            <div className="flex items-center justify-between p-4 bg-[#07090E] rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-black text-white block">Carousel Slide Duration</span>
                <span className="text-[11px] text-slate-400 block">
                  Number of seconds each ad banner is showcased before transitioning to the next active sponsor.
                </span>
              </div>
              <select
                value={settings.rotationIntervalSeconds ?? 10}
                onChange={(e) => handleUpdateAdvancedSettings({ rotationIntervalSeconds: Number(e.target.value) })}
                className="bg-[#0F1115] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value={5}>5 seconds</option>
                <option value={8}>8 seconds</option>
                <option value={10}>10 seconds (Recommended)</option>
                <option value={15}>15 seconds</option>
                <option value={20}>20 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>

            {/* Show on Main Dashboard */}
            <div className="flex items-center justify-between p-4 bg-[#07090E] rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-black text-white block">Showcase on Main Dashboard</span>
                <span className="text-[11px] text-slate-400 block">
                  Display rotating sponsor banners prominently on the incident dashboard in addition to the feeds screen.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.showOnDashboard ?? true}
                onChange={(e) => handleUpdateAdvancedSettings({ showOnDashboard: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Sponsored Badge */}
            <div className="flex items-center justify-between p-4 bg-[#07090E] rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-black text-white block">Display 'Sponsored' Badge</span>
                <span className="text-[11px] text-slate-400 block">
                  Ensure transparent advertising compliance with clearly visible badge indicators.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.showSponsoredBadge ?? true}
                onChange={(e) => handleUpdateAdvancedSettings({ showSponsoredBadge: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Allow Dismissal */}
            <div className="flex items-center justify-between p-4 bg-[#07090E] rounded-xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-xs font-black text-white block">Allow Motorist Dismissal</span>
                <span className="text-[11px] text-slate-400 block">
                  Allow users to close individual banners for their current browsing session.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.allowDismiss ?? true}
                onChange={(e) => handleUpdateAdvancedSettings({ allowDismiss: e.target.checked })}
                className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* QUICK EXTEND DURATION MODAL */}
      {extendModalBanner && (
        <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border-2 border-amber-500/80 rounded-3xl max-w-md w-full shadow-2xl text-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-black text-white uppercase tracking-wider">
                  Extend Campaign Rotation
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setExtendModalBanner(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#07090E] rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-white block">{extendModalBanner.title}</span>
              <span className="text-[11px] text-amber-400 block">Sponsor: {extendModalBanner.sponsorName}</span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Current End Date: {extendModalBanner.endDate ? new Date(extendModalBanner.endDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                Choose Duration to Add
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 30, 60].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExtendDays(days)}
                    className={`py-2 rounded-xl border text-center text-xs font-black transition cursor-pointer ${
                      extendDays === days
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow'
                        : 'bg-[#07090E] text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/40 flex items-center justify-between">
              <div className="text-xs text-purple-200">
                <span className="font-bold block">Need to grant a courtesy month?</span>
                <span className="text-[10px] text-purple-300/80">Give a 30-day promotional free grant.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const b = extendModalBanner;
                  setExtendModalBanner(null);
                  setFreeMonthTarget({
                    type: 'banner',
                    id: b.id,
                    name: `${b.title} (${b.sponsorName})`
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1 cursor-pointer shadow"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Grant Free Month</span>
              </button>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setExtendModalBanner(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleQuickExtend(extendModalBanner.id, extendDays)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow cursor-pointer"
              >
                {isSaving ? 'Updating...' : `Confirm +${extendDays} Days`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRANT 1 FREE MONTH (COMPLIMENTARY) MODAL */}
      {freeMonthTarget && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0D0B14] border-2 border-purple-500 rounded-3xl max-w-lg w-full shadow-2xl text-slate-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-purple-500/30 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-wider">
                    Grant 1 Free Month
                  </h4>
                  <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                    100% Complimentary Sponsorship
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFreeMonthTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-purple-950/30 rounded-2xl border border-purple-500/30 space-y-1">
              <div className="text-xs text-purple-300 font-bold">Target Advertiser / Campaign:</div>
              <div className="text-sm font-black text-white">{freeMonthTarget.name}</div>
              <div className="text-[11px] text-purple-300/80 mt-1 font-mono">
                Target Type: <strong className="uppercase text-white">{freeMonthTarget.type}</strong> • Duration to add: <strong className="text-emerald-400">+30 Days</strong>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-purple-300 mb-1">
                  Reason for Free Month (Visible in Audit Log & Badges) *
                </label>
                <input
                  type="text"
                  required
                  value={freeMonthReason}
                  onChange={(e) => setFreeMonthReason(e.target.value)}
                  placeholder="e.g. Promotional Partner Grant / Community Safety Sponsor / Free Month Gift"
                  className="w-full bg-[#07050E] border border-purple-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                  Admin Internal Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={freeMonthNotes}
                  onChange={(e) => setFreeMonthNotes(e.target.value)}
                  placeholder="e.g. Free month gifted for early platform adoption and feedback."
                  className="w-full bg-[#07050E] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>
            </div>

            {/* Explanatory Policy Callout */}
            <div className="p-3 bg-[#06080F] rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>What happens when you confirm:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-slate-400 pl-1">
                <li>Campaign runtime will be extended by <strong>30 calendar days</strong>.</li>
                <li>Payment method will be updated to <strong>"COMPLIMENTARY" (R 0.00)</strong> with payment verified.</li>
                <li>A distinct <strong>"🎁 Complimentary Free Month (Admin Grant)"</strong> badge will be affixed for transparent record keeping.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setFreeMonthTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleExecuteGrantFreeMonth}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-900/50 transition cursor-pointer flex items-center space-x-2 disabled:opacity-50"
              >
                <Gift className="w-4 h-4" />
                <span>{isSaving ? 'Granting Free Month...' : 'Confirm & Grant Free Month'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Create / Edit Modal */}
      {isModalOpen && editingBanner && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0F1115] border-2 border-amber-500/80 rounded-3xl max-w-xl w-full shadow-2xl text-slate-200 my-auto max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 shrink-0 bg-[#0F1115]">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingBanner.id ? 'Edit Advertisement Banner' : 'Create New Ad Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBanner(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="flex flex-col flex-1 min-h-0">
              {/* Scrollable Form Body */}
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                {/* Title */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-400 mb-1">
                    Advertisement Headline *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24/7 Roadside Assistance & Towing"
                    value={editingBanner.title || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full bg-[#07080A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                    Description / Body Text
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Fast response across Gauteng highway corridors. Claim 15% discount for verified motorists."
                    value={editingBanner.subtitle || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    className="w-full bg-[#07080A] border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                {/* Banner Image Selection: Direct File Upload Only */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Banner Image Creative *</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">Recommended ~ 16:9 or 2:1 ratio</span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File Upload (Drag & Drop + Click to Browse) */}
                  <div className="space-y-2">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-2 group ${
                        isDragging
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-slate-700/80 hover:border-amber-500/60 bg-[#07080A]/80 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                        {isProcessingFile ? (
                          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                        ) : (
                          <UploadCloud className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-slate-200">
                          {isProcessingFile
                            ? 'Processing image file...'
                            : isDragging
                            ? 'Drop your image file here'
                            : 'Click to upload image, or drag & drop'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Supports PNG, JPG, JPEG, WebP, GIF, SVG (up to 15MB)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-bold flex items-center space-x-1 transition cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Browse Computer / Files</span>
                      </button>
                    </div>

                    {/* File metadata info banner */}
                    {uploadedFileMeta && (
                      <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-300">
                        <div className="flex items-center space-x-1.5 truncate">
                          <FileImage className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="font-mono text-[11px] truncate max-w-[260px]">{uploadedFileMeta.name}</span>
                          <span className="text-[10px] text-emerald-400/80 font-mono">({uploadedFileMeta.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFileMeta(null);
                            setEditingBanner((prev) => (prev ? { ...prev, imageUrl: '' } : null));
                          }}
                          className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                          title="Remove uploaded image"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Live Preview Display Box */}
                  {editingBanner.imageUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative group">
                      <div className="h-32 w-full overflow-hidden">
                        <img
                          src={editingBanner.imageData || repairAdImageUrl(editingBanner.imageUrl, editingBanner.id, editingBanner.title)}
                          alt="Banner preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      
                      <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-amber-500/40 text-[10px] font-bold text-amber-400">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{editingBanner.sponsorBadge || 'Sponsored'}</span>
                      </div>

                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-black/80 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-1 rounded-lg transition cursor-pointer flex items-center space-x-1 shadow"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Replace Image</span>
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs text-white">
                        <div className="truncate font-bold">
                          {editingBanner.title || 'Ad Headline Preview'}
                        </div>
                        <span className="bg-amber-500/90 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded uppercase shrink-0">
                          Rotation Ready
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campaign Duration & Date Range */}
                <div className="bg-[#07090E] p-3.5 rounded-xl border border-slate-800 space-y-3">
                  <label className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Rotation Duration & Active Dates</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Campaign Start Date
                      </label>
                      <input
                        type="date"
                        value={editingBanner.startDate || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, startDate: e.target.value })}
                        className="w-full bg-[#0F1115] border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Campaign End Date
                      </label>
                      <input
                        type="date"
                        value={editingBanner.endDate || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, endDate: e.target.value })}
                        className="w-full bg-[#0F1115] border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Received & Direct EFT Sponsorship Controls */}
                <div className="bg-[#07090E] p-4 rounded-xl border border-emerald-900/40 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Sponsorship & Payment Verification</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-400/80 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                      Direct EFT / Gateway Bypass
                    </span>
                  </div>

                  {/* Payment Received Tickbox */}
                  <div className="bg-[#0B0E14] p-3 rounded-xl border border-slate-800 flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="modalPaymentReceivedCheck"
                      checked={editingBanner.paymentReceived ?? true}
                      onChange={(e) => setEditingBanner({ ...editingBanner, paymentReceived: e.target.checked })}
                      className="w-5 h-5 rounded text-emerald-500 bg-slate-900 border-slate-700 mt-0.5 cursor-pointer accent-emerald-500"
                    />
                    <div className="min-w-0 flex-1">
                      <label htmlFor="modalPaymentReceivedCheck" className="text-xs font-black text-white block cursor-pointer flex items-center space-x-2">
                        <span>Received payment already (Direct Bank EFT / Sponsorship Paid)</span>
                        {editingBanner.paymentReceived && (
                          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Verified
                          </span>
                        )}
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tick this when a sponsor pays via direct Electronic Funds Transfer (EFT) or cash so the ad can be activated immediately without passing through a payment gateway.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Sponsorship Amount (ZAR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-amber-400 font-mono">R</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="499"
                          value={editingBanner.amount !== undefined ? editingBanner.amount : 499}
                          onChange={(e) => setEditingBanner({ ...editingBanner, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-[#0F1115] border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white outline-none font-mono focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Payment Method / Source
                      </label>
                      <select
                        value={editingBanner.paymentMethod || 'eft'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, paymentMethod: e.target.value as any })}
                        className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="eft">Direct Bank EFT Transfer</option>
                        <option value="payfast">PayFast Online Gateway</option>
                        <option value="complimentary">Complimentary / Pro Bono</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Editorial Approval Status
                      </label>
                      <select
                        value={editingBanner.approvalStatus || 'approved'}
                        onChange={(e) => setEditingBanner({ ...editingBanner, approvalStatus: e.target.value as any })}
                        className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="approved">Approved (Live Broadcast)</option>
                        <option value="pending">Pending Review / Unapproved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Sponsor Contact Record (Optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Sponsor Contact Email
                      </label>
                      <input
                        type="email"
                        placeholder="sponsor@business.co.za"
                        value={editingBanner.contactEmail || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, contactEmail: e.target.value })}
                        className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none placeholder-slate-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Sponsor Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        placeholder="082 123 4567"
                        value={editingBanner.contactPhone || ''}
                        onChange={(e) => setEditingBanner({ ...editingBanner, contactPhone: e.target.value })}
                        className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none placeholder-slate-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Sponsor Name and Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                      Sponsor / Advertiser Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Roadside Rescue"
                      value={editingBanner.sponsorName || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, sponsorName: e.target.value })}
                      className="w-full bg-[#07080A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                      Sponsor Tag / Badge
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified Partner / Sponsored"
                      value={editingBanner.sponsorBadge || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, sponsorBadge: e.target.value })}
                      className="w-full bg-[#07080A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Target URL & CTA Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                      Target Link (URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://partner-website.co.za"
                      value={editingBanner.targetUrl || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, targetUrl: e.target.value })}
                      className="w-full bg-[#07080A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                      Button CTA Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Claim 15% Off / Visit Website"
                      value={editingBanner.ctaText || ''}
                      onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                      className="w-full bg-[#07080A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Placement & Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1">
                      Feed Placement Position
                    </label>
                    <select
                      value={editingBanner.position || 'random'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value as any })}
                      className="w-full bg-[#07080A] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="random">🎲 Random In-Feed Card (Dynamic)</option>
                      <option value="mid">📍 Mid-Feed (Middle of feed alerts)</option>
                      <option value="bottom">🔻 Bottom of Feed (After all alerts)</option>
                      <option value="top">📌 Top Header Sticky Card Only</option>
                      <option value="inline">📑 Inline Regular Stream Cards</option>
                      <option value="both">🌟 Both Top Header & In-Feed</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="bannerEnabledCheck"
                      checked={editingBanner.enabled ?? true}
                      onChange={(e) => setEditingBanner({ ...editingBanner, enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="bannerEnabledCheck" className="text-xs text-slate-300 font-bold cursor-pointer">
                      Enable Banner Immediately
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-3 px-5 py-4 border-t border-slate-800 bg-[#0A0C0F] shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingBanner(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Advertisement Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELECTED ORDER PREVIEW / AUDIT MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[115] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0D0F14] border-2 border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl text-slate-200 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-[#0A0C10]">
              <div className="flex items-center space-x-2">
                <LayoutTemplate className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Order Details & Payment Audit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Creative Banner Image */}
              {selectedOrder.adImageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <img
                    src={repairAdImageUrl(selectedOrder.adImageUrl, selectedOrder.bannerId, selectedOrder.businessName)}
                    alt={selectedOrder.businessName}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/ads/banner-roadside-assist.jpg';
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 border border-amber-500/30">
                    Creative Preview
                  </div>
                </div>
              )}

              {/* Order & Business Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#07090E] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Business / Advertiser</span>
                  <p className="text-sm font-black text-white">{selectedOrder.businessName}</p>
                  <p className="text-xs text-slate-300">{selectedOrder.contactName}</p>
                  <p className="text-xs text-amber-400 font-mono">{selectedOrder.phone} • {selectedOrder.email}</p>
                </div>

                <div className="p-3.5 bg-[#07090E] rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Package & Campaign</span>
                  <p className="text-sm font-black text-amber-400">{selectedOrder.packageName}</p>
                  <p className="text-xs text-slate-300 font-mono">Duration: {selectedOrder.durationDays || 30} Days</p>
                  <p className="text-[11px] text-slate-400 font-mono">Ref: {selectedOrder.referenceNumber || selectedOrder.id}</p>
                </div>
              </div>

              {/* Payment & Sponsorship Details */}
              <div className="p-4 bg-[#07090E] rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Payment & Invoicing Status</span>
                  </span>

                  {(selectedOrder.isComplimentary || selectedOrder.paymentMethod === 'complimentary') ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-950 text-purple-300 border border-purple-500/50 flex items-center space-x-1">
                      <Gift className="w-3 h-3 text-purple-400" />
                      <span>100% Complimentary</span>
                    </span>
                  ) : selectedOrder.paymentReceived ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center space-x-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Payment Verified</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-500/50 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>Pending Payment (EFT)</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-[#0B0D12] p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-sans">Billed Amount</span>
                    <span className="font-bold text-amber-400">
                      {(selectedOrder.isComplimentary || selectedOrder.paymentMethod === 'complimentary') ? 'R 0.00' : `R ${selectedOrder.amount}`}
                    </span>
                  </div>

                  <div className="bg-[#0B0D12] p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-sans">Payment Method</span>
                    <span className="font-bold uppercase text-white">{selectedOrder.paymentMethod}</span>
                  </div>

                  <div className="bg-[#0B0D12] p-2 rounded-lg border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block font-sans">Approval Status</span>
                    <span className="font-bold uppercase text-emerald-400">{selectedOrder.status}</span>
                  </div>
                </div>

                {/* Complimentary Audit Details */}
                {(selectedOrder.isComplimentary || selectedOrder.paymentMethod === 'complimentary') && (
                  <div className="mt-2 p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl text-xs text-purple-200 space-y-1">
                    <div className="font-black text-purple-300 flex items-center space-x-1.5">
                      <Gift className="w-3.5 h-3.5 text-purple-400" />
                      <span>Complimentary Free Month Grant Audit</span>
                    </div>
                    <p className="text-[11px] text-purple-300/80">
                      Authorized by: <strong className="text-white">{selectedOrder.complimentaryGrantedBy || 'Admin'}</strong>
                      {selectedOrder.complimentaryGrantedAt && ` on ${new Date(selectedOrder.complimentaryGrantedAt).toLocaleString()}`}.
                    </p>
                    {selectedOrder.complimentaryReason && (
                      <p className="text-[11px] text-purple-200/90 font-medium">
                        Reason: "{selectedOrder.complimentaryReason}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Destination & Target Link */}
              {selectedOrder.targetUrl && (
                <div className="p-3 bg-[#07090E] rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold block mb-1">Click-Through Target URL:</span>
                  <a
                    href={selectedOrder.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 font-mono flex items-center space-x-1 break-all"
                  >
                    <span>{selectedOrder.targetUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
                  </a>
                </div>
              )}

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="p-3 bg-[#07090E] rounded-xl border border-slate-800 text-xs text-slate-300">
                  <span className="text-slate-400 font-bold block mb-1">Advertiser Instructions / Notes:</span>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#0A0C10] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const ord = selectedOrder;
                    setSelectedOrder(null);
                    setFreeMonthTarget({
                      type: 'order',
                      id: ord.id,
                      name: `${ord.businessName} (${ord.packageName})`
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Grant Free Month</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Expire Confirmation Modal */}
      {expireModalBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B0D12] border border-red-500/40 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950/80 to-[#0B0D12] border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400">
                  <TimerOff className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Manual Campaign Expiration</h4>
                  <p className="text-xs text-red-300">Retire creative & remove from live rotation</p>
                </div>
              </div>
              <button
                onClick={() => setExpireModalBanner(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-red-950/30 border border-red-500/30 rounded-xl space-y-2">
                <div className="flex items-start space-x-2 text-xs text-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    You are about to manually expire <strong>"{expireModalBanner.title}"</strong> ({expireModalBanner.sponsorName}).
                    This will immediately set its status to <strong>Expired</strong>, disable it, and hide it from all public live traffic feeds and rotation slots.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Expiration Reason / Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={expireReason}
                  onChange={(e) => setExpireReason(e.target.value)}
                  placeholder="e.g. Campaign budget fulfilled, advertiser requested early termination, etc."
                  className="w-full bg-[#050608] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="p-3 bg-[#07090E] rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-bold text-slate-300 block">Campaign Details:</span>
                <div>Sponsor: <span className="text-amber-400 font-bold">{expireModalBanner.sponsorName}</span></div>
                <div>Placement: <span className="capitalize text-white">{expireModalBanner.position}</span></div>
                <div>Impressions to Date: <span className="font-mono text-white">{expireModalBanner.impressions || 0}</span> • Clicks: <span className="font-mono text-emerald-400">{expireModalBanner.clicks || 0}</span></div>
              </div>
            </div>

            <div className="p-4 bg-[#07090E] border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setExpireModalBanner(null)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleManualExpireBanner(expireModalBanner.id, expireModalBanner.title, expireReason)}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-red-950"
              >
                <TimerOff className="w-4 h-4" />
                <span>{isSaving ? 'Expiring...' : 'Confirm Expire & Hide'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calibrate Cumulative Counters Modal */}
      {isCalibrateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0B0D12] border border-indigo-500/40 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl space-y-0">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/80 to-[#0B0D12] border-b border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Calibrate Baseline Counters</h4>
                  <p className="text-xs text-indigo-300">Set persistent floor for Ad Impressions & Visitor Reach</p>
                </div>
              </div>
              <button
                onClick={() => setIsCalibrateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-start space-x-2 text-xs text-indigo-200">
                  <Shield className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    This utility guarantees that advert impression metrics and visitor counters never reset backwards across container restarts or database synchronizations.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Cumulative Total Advert Impressions Floor
                  </label>
                  <input
                    type="number"
                    value={targetImpressionsInput}
                    onChange={(e) => setTargetImpressionsInput(Number(e.target.value))}
                    min={60000}
                    step={100}
                    className="w-full bg-[#050608] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Baseline is 60,840+. Distributes across active campaigns and saves directly to persistent storage.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Total Visitors / Community Reach Floor
                  </label>
                  <input
                    type="number"
                    value={targetVisitorsInput}
                    onChange={(e) => setTargetVisitorsInput(Number(e.target.value))}
                    min={60000}
                    step={100}
                    className="w-full bg-[#050608] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Baseline is 63,240+. Synchronizes to public footer metrics and analytics counters.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#07090E] border-t border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCalibrateModalOpen(false)}
                disabled={isCalibrating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCalibrateCounters}
                disabled={isCalibrating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-indigo-950"
              >
                <TrendingUp className={`w-4 h-4 ${isCalibrating ? 'animate-spin' : ''}`} />
                <span>{isCalibrating ? 'Calibrating...' : 'Apply Calibration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
