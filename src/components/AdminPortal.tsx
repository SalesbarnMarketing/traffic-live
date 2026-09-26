import React, { useState, useEffect, useRef } from 'react';
import { IncidentReport, EmergencySOS, ReportStatus, SupportTier, Donation, DonationStats, RegisteredUser, FeedItem, ResponderPartner } from '../types';
import { INITIAL_RESPONDER_PARTNERS } from '../data/initialData';
import { Lock, ShieldCheck, CheckCircle2, XCircle, AlertOctagon, AlertTriangle, Eye, Clock, FileText, Check, Shield, LogOut, Key, Mail, EyeOff, AlertCircle, Coffee, Fuel, Plus, Trash2, Trash, Save, DollarSign, Layers, Settings, Edit3, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight, ChevronDown, Heart, Wrench, MapPin, Camera, Filter, X, Users, UserCheck, Hash, Tag, Radio, Activity, Terminal, Play, Pause, Megaphone, Lightbulb, Car, Eraser, Search, CheckSquare, Square, RotateCcw, Sparkles, BellRing, Copy, Phone, User, Navigation, ExternalLink, ShieldAlert, CheckCheck, Truck, Stethoscope, BarChart3, TrendingUp, Loader2 } from 'lucide-react';
import { AdminUserManagement } from './AdminUserManagement';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AdminHashtagSettings } from './AdminHashtagSettings';
import { AdminActivityLogging } from './AdminActivityLogging';
import { AdminAdSettings } from './AdminAdSettings';
import { AdminFeedbackManagement } from './AdminFeedbackManagement';
import { AdminFeedConnectionsTab } from './AdminFeedConnectionsTab';
import { AdminDrivingCourseTab } from './AdminDrivingCourseTab';
import { AdminPushNotificationsTab } from './AdminPushNotificationsTab';
import { AdminPostsManager, isItemAdminPost } from './AdminPostsManager';
import { AdminAnalyticsDashboard } from './AdminAnalyticsDashboard';
import { AdminRespondersTab } from './AdminRespondersTab';
import { AdminCategoryPhotosTab } from './AdminCategoryPhotosTab';
import { EditIncidentModal } from './EditIncidentModal';
import { AdminAuditBadge } from './AdminAuditBadge';
import { AdminPartnerAPIModal } from './AdminPartnerAPIModal';
import { AdminReleaseNotesTab } from './AdminReleaseNotesTab';
import { ReleaseNotesModal } from './ReleaseNotesModal';
import { getFullVersionString } from '../version';
import { formatReadableDateTime, getTimeAgo, formatSATime, getSOSTimingBreakdown, getReportResolutionTiming, formatDuration } from '../utils/dateParser';
import { detectRegionFromCoords } from '../utils/regionUtils';

interface AdminPortalProps {
  reports: IncidentReport[];
  sosRequests: EmergencySOS[];
  donations?: Donation[];
  donationStats?: DonationStats;
  feedItems?: FeedItem[];
  onUpdateReportStatus: (id: string, status: ReportStatus, adminNotes?: string, resolvedImageUrl?: string, resolutionNotes?: string) => Promise<void>;
  onUpdateSOSStatus: (id: string, statusOrUpdates: EmergencySOS['status'] | Partial<EmergencySOS>, notes?: string, resolvedImageUrl?: string, resolutionNotes?: string) => Promise<void>;
  onDeleteSOS?: (id: string) => Promise<void>;
  onClearSOS?: (filter: 'resolved' | 'all') => Promise<void>;
  onSelectReport: (report: IncidentReport) => void;
  onClearAllMapHazards?: () => Promise<void>;
  onRefreshDonations?: () => Promise<void> | void;
  onUpdateDonations?: (updated: Donation[], stats?: DonationStats) => void;
  onRefreshFeed?: () => Promise<void> | void;
  onAddFeedItem?: (item: FeedItem) => Promise<void> | void;
  onDeleteFeedItem?: (id: string) => Promise<void> | void;
  onDeleteReport?: (id: string) => Promise<void> | void;
  onEditReport?: (id: string, updatedFields: Partial<IncidentReport>, alsoApprove?: boolean) => Promise<void>;
  onEditFeedItem?: (id: string, updatedFields: Partial<FeedItem>) => Promise<void>;
  currentUser?: RegisteredUser | null;
  onSwitchTab?: (tab: any) => void;
  onLogout?: () => void;
}

const isPermittedAdminRole = (role?: string) => {
  return role === 'super_admin' || role === 'admin' || role === 'moderator' || role === 'patrol';
};

export const AdminPortal: React.FC<AdminPortalProps> = ({
  reports,
  sosRequests,
  donations = [],
  donationStats,
  feedItems = [],
  onUpdateReportStatus,
  onUpdateSOSStatus,
  onDeleteSOS,
  onClearSOS,
  onSelectReport,
  onClearAllMapHazards,
  onRefreshDonations,
  onUpdateDonations,
  onRefreshFeed,
  onAddFeedItem,
  onDeleteFeedItem,
  onDeleteReport,
  onEditReport,
  onEditFeedItem,
  currentUser,
  onSwitchTab,
  onLogout
}) => {
  // Session storage for admin authentication so each new session / tab requires password verification
  const [adminUser, setAdminUser] = useState<{ email: string; name: string; role?: string } | null>(() => {
    const saved = sessionStorage.getItem('adminUser');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      } catch (e) { /* ignore */ }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('adminToken');
    return !!(token && token.startsWith('admin-auth-token-'));
  });

  // When currentUser is explicitly signed in as admin/super_admin with active session
  useEffect(() => {
    if (currentUser && isPermittedAdminRole(currentUser.role)) {
      const currentToken = sessionStorage.getItem('adminToken');
      if (currentToken) {
        const u = {
          email: currentUser.email,
          name: `${currentUser.fullName} ${currentUser.surname || ''}`.trim(),
          role: currentUser.role === 'super_admin' ? 'Chief Admin & Dispatch Officer' : 'Admin & Dispatch Officer'
        };
        setAdminUser(u);
        setIsAuthenticated(true);
      }
    }
  }, [currentUser]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Direct Report Deletion State
  const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<string | null>(null);
  const [isDeletingReportId, setIsDeletingReportId] = useState<string | null>(null);

  const handleDeleteReportItem = async (reportId: string) => {
    setIsDeletingReportId(reportId);
    try {
      if (onDeleteReport) {
        await onDeleteReport(reportId);
      }
      if (onDeleteFeedItem) {
        await onDeleteFeedItem(reportId);
        await onDeleteFeedItem(`feed-${reportId}`);
        await onDeleteFeedItem(`rep-${reportId}`);
      }

      const cleanId = reportId.replace(/^feed-/, '').replace(/^report-/, '').replace(/^rep-/, '');
      const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '')
        : '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (currentUser?.email) headers['x-user-email'] = currentUser.email;
      if (currentUser?.role) headers['x-user-role'] = currentUser.role;

      await Promise.allSettled([
        fetch(`/api/reports/${encodeURIComponent(reportId)}`, { method: 'DELETE', headers }),
        fetch(`/api/reports/${encodeURIComponent(cleanId)}`, { method: 'DELETE', headers }),
        fetch(`/api/reports/${encodeURIComponent(`rep-${cleanId}`)}`, { method: 'DELETE', headers }),
        fetch(`/api/feed/${encodeURIComponent(reportId)}`, { method: 'DELETE', headers }),
        fetch(`/api/feed/${encodeURIComponent(cleanId)}`, { method: 'DELETE', headers }),
        fetch(`/api/feed/${encodeURIComponent(`feed-${cleanId}`)}`, { method: 'DELETE', headers })
      ]);
    } catch (err) {
      console.error('Failed to delete report:', err);
    } finally {
      setIsDeletingReportId(null);
      setConfirmDeleteReportId(null);
      if (onRefreshFeed) await onRefreshFeed();
    }
  };

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'admin_posts' | 'sos' | 'responders' | 'category_photos' | 'analytics' | 'tiers' | 'donations' | 'users' | 'hashtags' | 'activity' | 'ads' | 'feedback' | 'connections' | 'course' | 'push' | 'release_notes'>('pending');
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isPartnerApiModalOpen, setIsPartnerApiModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [showClearMapConfirm, setShowClearMapConfirm] = useState(false);
  const [isClearingMap, setIsClearingMap] = useState(false);
  const [clearSuccessMsg, setClearSuccessMsg] = useState<string | null>(null);

  // Clear All Live Approved Reports State & Controls
  const [showClearLiveReportsModal, setShowClearLiveReportsModal] = useState(false);
  const [clearLiveReportsAction, setClearLiveReportsAction] = useState<'delete_all' | 'resolve_all'>('delete_all');
  const [isClearingLiveReports, setIsClearingLiveReports] = useState(false);
  const [clearLiveReportsConfirmText, setClearLiveReportsConfirmText] = useState('');

  const handleClearAllLiveReports = async () => {
    setIsClearingLiveReports(true);
    try {
      const token = typeof window !== 'undefined'
        ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '')
        : '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (currentUser?.email) headers['x-user-email'] = currentUser.email;
      if (currentUser?.role) headers['x-user-role'] = currentUser.role;

      const res = await fetch('/api/admin/reports/clear-live', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: clearLiveReportsAction })
      });
      const data = await res.json();
      if (res.ok) {
        setClearSuccessMsg(data.message || 'Live reports successfully cleared from map.');
        setTimeout(() => setClearSuccessMsg(null), 4000);
        setShowClearLiveReportsModal(false);
        setClearLiveReportsConfirmText('');
        if (onClearAllMapHazards) {
          await onClearAllMapHazards();
        }
        if (onRefreshFeed) {
          await onRefreshFeed();
        }
      } else {
        alert(data.error || 'Failed to clear live reports.');
      }
    } catch (err) {
      console.error('Failed to clear live reports:', err);
      alert('Network error while clearing live reports.');
    } finally {
      setIsClearingLiveReports(false);
    }
  };
  const tabDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabDropdownRef.current && !tabDropdownRef.current.contains(event.target as Node)) {
        setIsTabDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Edit Incident Report State (Fix typos, update location, adjust hazard info)
  const [editingReportState, setEditingReportState] = useState<{
    report: IncidentReport;
    isPending: boolean;
  } | null>(null);

  const handleEditReportSave = async (id: string, updatedFields: Partial<IncidentReport>, alsoApprove?: boolean) => {
    if (onEditReport) {
      await onEditReport(id, updatedFields, alsoApprove);
    } else {
      const token = sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '';
      const role = adminUser?.role || (token.includes('charles') ? 'super_admin' : 'admin');
      const email = adminUser?.email || (token.includes('charles') ? 'charlesodendaal43@gmail.com' : 'admin@livetraffic.co.za');
      await fetch(`/api/reports/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role,
          'x-admin-role': role,
          'x-user-email': email,
          'x-admin-email': email,
          'x-admin-authorized': 'true',
          'x-admin-token': token,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      if (alsoApprove) {
        await onUpdateReportStatus(id, 'approved', updatedFields.adminNotes);
      }
    }
    if (onRefreshFeed) onRefreshFeed();
  };

  // Resolution Modal State (Mark Potholes Fixed, Emergency Assistance Proof, Hazard Resolution)
  const [resolutionTarget, setResolutionTarget] = useState<{
    type: 'report' | 'sos' | 'donation';
    item: IncidentReport | EmergencySOS | Donation;
  } | null>(null);
  const [resolutionPhotoUrl, setResolutionPhotoUrl] = useState('');
  const [resolutionNotesText, setResolutionNotesText] = useState('');
  const [resolutionIsFixed, setResolutionIsFixed] = useState(true);
  const [isSubmittingResolution, setIsSubmittingResolution] = useState(false);

  const handleOpenResolutionModal = (type: 'report' | 'sos' | 'donation', item: any) => {
    setResolutionTarget({ type, item });
    if (type === 'report') {
      const rep = item as IncidentReport;
      setResolutionPhotoUrl(rep.resolvedImageUrl || rep.imageUrl || '');
      setResolutionNotesText(rep.resolutionNotes || rep.adminNotes || `Pothole / hazard at ${rep.locationName} has been successfully repaired and verified by patrol crew.`);
      setResolutionIsFixed(true);
    } else if (type === 'sos') {
      const sos = item as EmergencySOS;
      setResolutionPhotoUrl(sos.resolvedImageUrl || '');
      const responderInfo = sos.responderName ? `Assisted by ${sos.responderName}${sos.responderCallsign ? ` (${sos.responderCallsign})` : ''}. ` : '';
      setResolutionNotesText(sos.resolutionNotes || sos.adminNotes || `${responderInfo}Motorist assisted safely and vehicle secured.`);
      setResolutionIsFixed(true);
    } else if (type === 'donation') {
      const don = item as Donation;
      setResolutionPhotoUrl(don.fixedImageUrl || don.potholeImageUrl || '');
      setResolutionNotesText(don.adminFeedback || `Pothole sponsored by ${don.donorName} at ${don.potholeLocation || 'Corridor Hotspot'} is officially fixed!`);
      setResolutionIsFixed(don.isFixed !== undefined ? don.isFixed : true);
    }
  };

  const handleResolutionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setResolutionPhotoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmResolutionSubmit = async () => {
    if (!resolutionTarget) return;
    setIsSubmittingResolution(true);
    try {
      if (resolutionTarget.type === 'report') {
        const rep = resolutionTarget.item as IncidentReport;
        await onUpdateReportStatus(rep.id, 'resolved', resolutionNotesText, resolutionPhotoUrl, resolutionNotesText);
      } else if (resolutionTarget.type === 'sos') {
        const sos = resolutionTarget.item as EmergencySOS;
        await onUpdateSOSStatus(sos.id, 'resolved', resolutionNotesText, resolutionPhotoUrl, resolutionNotesText);
      } else if (resolutionTarget.type === 'donation') {
        const don = resolutionTarget.item as Donation;
        await fetch(`/api/donations/${don.id}/resolution`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isFixed: resolutionIsFixed,
            fixedImageUrl: resolutionPhotoUrl,
            adminFeedback: resolutionNotesText
          })
        });
        await loadDonations();
      }
      setResolutionTarget(null);
    } catch (err) {
      alert('Error updating resolution status.');
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  // Admin Donations Ledger & Wall of Heroes Cleaning State
  const [donationsList, setDonationsList] = useState<Donation[]>([]);
  const [adminDonationStats, setAdminDonationStats] = useState<DonationStats | null>(null);
  const [hasLoadedDonationsOnce, setHasLoadedDonationsOnce] = useState(false);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const [donationCategoryFilter, setDonationCategoryFilter] = useState<'all' | 'pothole_repair' | 'coffee' | 'fuel' | 'advance_driving'>('all');
  const [donationSearchQuery, setDonationSearchQuery] = useState('');
  const [selectedDonationIds, setSelectedDonationIds] = useState<string[]>([]);
  const [isCleanWallModalOpen, setIsCleanWallModalOpen] = useState(false);
  const [cleanActionType, setCleanActionType] = useState<'clear_all' | 'clear_test' | 'coffee_only' | 'fixed_potholes_only' | 'reset_defaults'>('clear_all');
  const [cleanConfirmText, setCleanConfirmText] = useState('');
  const [donationToDelete, setDonationToDelete] = useState<Donation | null>(null);
  const [isCleaningWall, setIsCleaningWall] = useState(false);
  const [wallActionMessage, setWallActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showWallToast = (text: string, type: 'success' | 'error' = 'success') => {
    setWallActionMessage({ text, type });
    setTimeout(() => {
      setWallActionMessage(null);
    }, 4500);
  };

  const loadDonations = async () => {
    setIsLoadingDonations(true);
    try {
      const res = await fetch('/api/donations');
      if (res.ok) {
        const data = await res.json();
        if (data.donations) {
          setDonationsList(data.donations);
          setHasLoadedDonationsOnce(true);
          if (onUpdateDonations) onUpdateDonations(data.donations, data.stats);
        }
        if (data.stats) setAdminDonationStats(data.stats);
      }
    } catch (e) {
      console.warn('Failed to load donations for admin:', e);
    } finally {
      setIsLoadingDonations(false);
    }
  };

  // Delete a single donation entry
  const handleConfirmDeleteSingle = async () => {
    if (!donationToDelete) return;
    setIsCleaningWall(true);
    try {
      const res = await fetch(`/api/donations/${donationToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': adminUser?.role || currentUser?.role || 'admin',
          'x-user-email': adminUser?.email || currentUser?.email || 'admin'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDonationsList(data.donations || []);
        if (data.stats) setAdminDonationStats(data.stats);
        if (onUpdateDonations) onUpdateDonations(data.donations || [], data.stats);
        if (onRefreshDonations) await onRefreshDonations();
        setSelectedDonationIds(prev => prev.filter(id => id !== donationToDelete.id));
        showWallToast(`Entry for "${donationToDelete.donorName}" removed from Wall of Heroes.`, 'success');
        setDonationToDelete(null);
      } else {
        const err = await res.json();
        showWallToast(err.error || 'Failed to delete donation entry', 'error');
      }
    } catch (e) {
      showWallToast('Network error while deleting entry', 'error');
    } finally {
      setIsCleaningWall(false);
    }
  };

  // Delete selected batch
  const handleDeleteSelected = async () => {
    if (selectedDonationIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to remove ${selectedDonationIds.length} selected entries from the Wall of Heroes?`)) {
      return;
    }
    setIsCleaningWall(true);
    try {
      const res = await fetch('/api/donations/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': adminUser?.role || currentUser?.role || 'admin',
          'x-user-email': adminUser?.email || currentUser?.email || 'admin'
        },
        body: JSON.stringify({
          action: 'selected',
          ids: selectedDonationIds,
          adminEmail: adminUser?.email || currentUser?.email,
          adminRole: adminUser?.role || currentUser?.role
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDonationsList(data.donations || []);
        if (data.stats) setAdminDonationStats(data.stats);
        if (onUpdateDonations) onUpdateDonations(data.donations || [], data.stats);
        if (onRefreshDonations) await onRefreshDonations();
        setSelectedDonationIds([]);
        showWallToast(`Deleted ${data.clearedCount || selectedDonationIds.length} selected entries from Wall of Heroes.`, 'success');
      } else {
        const err = await res.json();
        showWallToast(err.error || 'Failed to clear selected entries', 'error');
      }
    } catch (e) {
      showWallToast('Network error while clearing entries', 'error');
    } finally {
      setIsCleaningWall(false);
    }
  };

  // Execute Wall Cleaning / Purge
  const handleCleanWallAction = async () => {
    setIsCleaningWall(true);
    try {
      let payloadAction: string = cleanActionType;
      let categoryParam: string | undefined = undefined;

      if (cleanActionType === 'coffee_only') {
        payloadAction = 'category';
        categoryParam = 'coffee';
      }

      const res = await fetch('/api/donations/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': adminUser?.role || currentUser?.role || 'admin',
          'x-user-email': adminUser?.email || currentUser?.email || 'admin'
        },
        body: JSON.stringify({
          action: payloadAction,
          category: categoryParam,
          adminEmail: adminUser?.email || currentUser?.email,
          adminRole: adminUser?.role || currentUser?.role
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDonationsList(data.donations || []);
        if (data.stats) setAdminDonationStats(data.stats);
        if (onUpdateDonations) onUpdateDonations(data.donations || [], data.stats);
        if (onRefreshDonations) await onRefreshDonations();
        setSelectedDonationIds([]);
        setIsCleanWallModalOpen(false);
        setCleanConfirmText('');
        showWallToast(data.message || `Wall cleaned successfully (${data.clearedCount || 0} entries affected).`, 'success');
      } else {
        const err = await res.json();
        showWallToast(err.error || 'Failed to clean the wall', 'error');
      }
    } catch (e) {
      showWallToast('Network error while cleaning the wall', 'error');
    } finally {
      setIsCleaningWall(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDonations();
      const interval = setInterval(() => {
        loadDonations();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  const displayDonations = hasLoadedDonationsOnce ? donationsList : (donationsList.length > 0 ? donationsList : donations);
  const displayStats = adminDonationStats || donationStats;

  const filteredDonations = displayDonations.filter((don) => {
    const matchesCategory = donationCategoryFilter === 'all' || don.category === donationCategoryFilter;
    if (!matchesCategory) return false;
    if (!donationSearchQuery.trim()) return true;
    const query = donationSearchQuery.toLowerCase();
    return (
      (don.donorName && don.donorName.toLowerCase().includes(query)) ||
      (don.message && don.message.toLowerCase().includes(query)) ||
      (don.potholeLocation && don.potholeLocation.toLowerCase().includes(query)) ||
      (don.referenceNumber && don.referenceNumber.toLowerCase().includes(query)) ||
      (don.category && don.category.toLowerCase().includes(query)) ||
      don.amount.toString().includes(query)
    );
  });

  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -180 : 180,
        behavior: 'smooth'
      });
    }
  };

  // Patrol Support Tier Management State
  const [supportTiers, setSupportTiers] = useState<SupportTier[]>([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(false);
  const [tierSaveMsg, setTierSaveMsg] = useState<string | null>(null);
  const [isAddingNewTier, setIsAddingNewTier] = useState(false);
  const [newTier, setNewTier] = useState({
    title: '',
    amount: 200,
    description: '',
    icon: 'coffee' as const,
    categoryKey: '',
    enabled: true
  });

  const loadSupportTiers = async () => {
    setIsLoadingTiers(true);
    try {
      const res = await fetch('/api/support-tiers');
      if (res.ok) {
        const data = await res.json();
        if (data.supportTiers) {
          setSupportTiers(data.supportTiers);
        }
      }
    } catch (e) {
      console.warn('Failed to load support tiers:', e);
    } finally {
      setIsLoadingTiers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSupportTiers();
    }
  }, [isAuthenticated]);

  const handleUpdateTierField = (id: string, field: keyof SupportTier, value: any) => {
    setSupportTiers(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleSaveAllTiers = async () => {
    setTierSaveMsg(null);
    try {
      const res = await fetch('/api/support-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: supportTiers })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.supportTiers) {
          setSupportTiers(data.supportTiers);
        }
        setTierSaveMsg('All patrol support types & preset amounts saved successfully!');
        setTimeout(() => setTierSaveMsg(null), 3500);
      } else {
        setTierSaveMsg('Failed to save support tiers.');
      }
    } catch (e) {
      setTierSaveMsg('Server error saving support tiers.');
    }
  };

  const handleSaveSingleTier = async (tier: SupportTier) => {
    setTierSaveMsg(null);
    try {
      const res = await fetch(`/api/support-tiers/${tier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tier)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.supportTiers) {
          setSupportTiers(data.supportTiers);
        }
        setTierSaveMsg(`Saved R${tier.amount} preset amount for "${tier.title}"!`);
        setTimeout(() => setTierSaveMsg(null), 3500);
      } else {
        setTierSaveMsg(`Failed to save "${tier.title}".`);
      }
    } catch (e) {
      setTierSaveMsg('Server error saving support tier.');
    }
  };

  const handleAddTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTier.title || !newTier.amount) return;

    try {
      const res = await fetch('/api/support-tiers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTier.title,
          amount: newTier.amount,
          description: newTier.description,
          icon: newTier.icon,
          categoryKey: newTier.categoryKey || newTier.title.toLowerCase().replace(/\s+/g, '_'),
          enabled: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.supportTiers) {
          setSupportTiers(data.supportTiers);
        }
        setIsAddingNewTier(false);
        setNewTier({
          title: '',
          amount: 200,
          description: '',
          icon: 'coffee',
          categoryKey: '',
          enabled: true
        });
        setTierSaveMsg('New patrol support tier created!');
        setTimeout(() => setTierSaveMsg(null), 3000);
      }
    } catch (err) {
      alert('Failed to add new support tier.');
    }
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patrol support option?')) return;
    try {
      const res = await fetch(`/api/support-tiers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.supportTiers) {
          setSupportTiers(data.supportTiers);
        }
        setTierSaveMsg('Support tier deleted.');
        setTimeout(() => setTierSaveMsg(null), 3000);
      }
    } catch (err) {
      alert('Failed to delete support tier.');
    }
  };

  const pendingReports = reports.filter((r) => r.status === 'pending' || (r.status === 'approved' && !r.verifiedByAdmin));
  const approvedReports = reports.filter((r) => r.status === 'approved' || r.status === 'resolved');
  const activeSOS = sosRequests.filter((s) => s.status !== 'resolved');

  // Emergency SOS Responder & Call Ref Management State
  const [sosStatusFilter, setSosStatusFilter] = useState<'all' | 'active' | 'dispatched' | 'resolved'>('all');
  const [sosSearchQuery, setSosSearchQuery] = useState('');
  const [editingSOS, setEditingSOS] = useState<EmergencySOS | null>(null);
  const [sosModalCallRef, setSosModalCallRef] = useState('');
  const [sosModalResponderName, setSosModalResponderName] = useState('');
  const [sosModalResponderType, setSosModalResponderType] = useState<EmergencySOS['responderType']>('patrol_officer');
  const [sosModalResponderCallsign, setSosModalResponderCallsign] = useState('');
  const [sosModalResponderPhone, setSosModalResponderPhone] = useState('');
  const [sosModalAdminNotes, setSosModalAdminNotes] = useState('');
  const [sosModalStatus, setSosModalStatus] = useState<EmergencySOS['status']>('dispatched');
  const [isSavingSOSDetails, setIsSavingSOSDetails] = useState(false);
  const [copiedRefId, setCopiedRefId] = useState<string | null>(null);
  const [copiedSITREPId, setCopiedSITREPId] = useState<string | null>(null);

  // Dynamic Responder / Partner Directory State
  const [responderPartners, setResponderPartners] = useState<ResponderPartner[]>(() => {
    try {
      const saved = localStorage.getItem('livetraffic_responders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_RESPONDER_PARTNERS;
  });

  const loadResponderPartners = async () => {
    try {
      const res = await fetch('/api/responders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.responderPartners)) {
          setResponderPartners(data.responderPartners);
          localStorage.setItem('livetraffic_responders', JSON.stringify(data.responderPartners));
        }
      }
    } catch (err) {
      console.warn('[AdminPortal] Error loading responder partners:', err);
    }
  };

  useEffect(() => {
    loadResponderPartners();
  }, []);

  const filteredSOSRequests = sosRequests.filter((sos) => {
    if (sosStatusFilter !== 'all' && sos.status !== sosStatusFilter) {
      return false;
    }
    if (!sosSearchQuery.trim()) return true;
    const q = sosSearchQuery.toLowerCase().trim();
    return (
      (sos.callRef && sos.callRef.toLowerCase().includes(q)) ||
      sos.id.toLowerCase().includes(q) ||
      sos.name.toLowerCase().includes(q) ||
      sos.phone.toLowerCase().includes(q) ||
      sos.locationName.toLowerCase().includes(q) ||
      sos.vehicleInfo.toLowerCase().includes(q) ||
      (sos.responderName && sos.responderName.toLowerCase().includes(q)) ||
      (sos.responderCallsign && sos.responderCallsign.toLowerCase().includes(q)) ||
      (sos.adminNotes && sos.adminNotes.toLowerCase().includes(q)) ||
      (sos.notes && sos.notes.toLowerCase().includes(q))
    );
  });

  const handleOpenSOSDispatchModal = (sos: EmergencySOS) => {
    setEditingSOS(sos);
    setSosModalCallRef(sos.callRef || `SOS-${new Date(sos.createdAt).toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);
    setSosModalResponderName(sos.responderName || '');
    setSosModalResponderType(sos.responderType || 'patrol_officer');
    setSosModalResponderCallsign(sos.responderCallsign || '');
    setSosModalResponderPhone(sos.responderPhone || '');
    setSosModalAdminNotes(sos.adminNotes || '');
    setSosModalStatus(sos.status === 'active' ? 'dispatched' : sos.status);
  };

  const handleSaveSOSDetails = async () => {
    if (!editingSOS) return;
    setIsSavingSOSDetails(true);
    try {
      await onUpdateSOSStatus(
        editingSOS.id,
        {
          status: sosModalStatus,
          callRef: sosModalCallRef.trim() || editingSOS.callRef,
          responderName: sosModalResponderName.trim() || undefined,
          responderType: sosModalResponderType,
          responderCallsign: sosModalResponderCallsign.trim() || undefined,
          responderPhone: sosModalResponderPhone.trim() || undefined,
          adminNotes: sosModalAdminNotes.trim() || undefined,
          dispatchedAt: sosModalStatus === 'dispatched' ? (editingSOS.dispatchedAt || new Date().toISOString()) : editingSOS.dispatchedAt
        } as any
      );
      setEditingSOS(null);
    } catch (err) {
      console.error('Failed to update SOS details:', err);
      alert('Failed to save SOS updates.');
    } finally {
      setIsSavingSOSDetails(false);
    }
  };

  const handleCopyCallRef = (callRef: string) => {
    navigator.clipboard.writeText(callRef);
    setCopiedRefId(callRef);
    setTimeout(() => setCopiedRefId(null), 2000);
  };

  const handleCopySITREP = (sos: EmergencySOS) => {
    const timing = getSOSTimingBreakdown(sos);
    const province = detectRegionFromCoords(sos.latitude, sos.longitude);
    const sitrep = `🚨 [EMERGENCY SOS DISPATCH SITREP]\n` +
      `📌 Call Ref: ${sos.callRef || '#' + sos.id}\n` +
      `👤 Motorist: ${sos.name} (${sos.phone})\n` +
      `🚗 Vehicle: ${sos.vehicleInfo}\n` +
      `📍 Location: ${sos.locationName} (GPS: ${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)})\n` +
      `🏛️ Province: ${province}\n` +
      `⚠️ Type: ${sos.emergencyType.replace(/_/g, ' ').toUpperCase()}\n` +
      `⏱️ Turnaround & Timing: ${timing.summary}\n` +
      `🛡️ Responding Unit: ${sos.responderName ? `${sos.responderName} (${sos.responderCallsign || 'Patrol'}) [${sos.responderPhone || 'N/A'}]` : 'UNASSIGNED'}\n` +
      `📝 Caller Notes: ${sos.notes}\n` +
      `📋 Admin Notes: ${sos.adminNotes || 'None'}\n` +
      `🕒 Status: ${sos.status.toUpperCase()} | Logged: ${formatReadableDateTime(sos.createdAt)}`;

    navigator.clipboard.writeText(sitrep);
    setCopiedSITREPId(sos.id);
    setTimeout(() => setCopiedSITREPId(null), 2500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      let serverSuccess = false;
      let responseData: any = null;

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword })
        });

        responseData = await res.json().catch(() => null);
        if (res.ok && responseData?.success) {
          serverSuccess = true;
        }
      } catch (networkErr) {
        console.warn('Backend admin login endpoint unreachable, checking offline authorization...', networkErr);
      }

      if (serverSuccess && responseData?.user) {
        const token = responseData.token || `admin-auth-token-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;
        const userName = responseData.user?.fullName 
          ? `${responseData.user.fullName} ${responseData.user.surname || ''}`.trim() 
          : cleanEmail.includes('sylvester') 
          ? 'Sylvester' 
          : 'Charles Odendaal';

        const u = {
          email: cleanEmail,
          name: userName,
          role: responseData.user?.role || 'Admin & Dispatch Officer'
        };
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminUser', JSON.stringify(u));
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(u));
        setAdminUser(u);
        setIsAuthenticated(true);
        setIsLoggingIn(false);
        return;
      }

      // Offline / Post-Release Fallback for authorized administrators
      const ADMIN_CREDENTIALS: Record<string, { name: string; role: string }> = {
        'charlesodendaal43@gmail.com': { name: 'Charles Odendaal', role: 'Chief Admin & Dispatch Officer' },
        'charles@salesbarn.co.za': { name: 'Charles Odendaal', role: 'Chief Admin & Dispatch Officer' },
        'charles2@salesbarn.co.za': { name: 'Charles Odendaal', role: 'Chief Admin & Dispatch Officer' },
        'sylvester@trafficlive.co.za': { name: 'Sylvester', role: 'Admin & Dispatch Officer' },
        'theronmelloney@gmail.com': { name: 'Ronmel Loney', role: 'Admin & Dispatch Officer' },
        'murrayspecialists@yahoo.com': { name: 'Murray Specialists', role: 'Admin & Dispatch Officer' },
        'ellagr@tshwane.gov.za': { name: 'ellagr', role: 'Admin & Dispatch Officer' }
      };

      const matchedAdmin = ADMIN_CREDENTIALS[cleanEmail];
      const isMasterPass =
        cleanPassword === '@utorac1' ||
        cleanPassword === '@utorac1.' ||
        cleanPassword.toLowerCase() === 'autorac1' ||
        cleanPassword.toLowerCase() === 'autorac1.' ||
        cleanPassword === 'dispatch@1' ||
        cleanPassword === 'dispatch@1.' ||
        cleanPassword.toLowerCase() === 'dispatch@1' ||
        cleanPassword.toLowerCase() === 'dispatch' ||
        cleanPassword.toLowerCase() === 'admin123';

      if (matchedAdmin && isMasterPass) {
        const token = `admin-auth-token-${cleanEmail.replace(/[^a-z0-9]/g, '')}`;
        const u = { email: cleanEmail, name: matchedAdmin.name, role: matchedAdmin.role };
        sessionStorage.setItem('adminToken', token);
        sessionStorage.setItem('adminUser', JSON.stringify(u));
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminUser', JSON.stringify(u));

        // Re-sync session in background so server data_store has it
        fetch('/api/auth/sync-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            user: { 
              email: cleanEmail, 
              fullName: matchedAdmin.name, 
              role: cleanEmail.includes('charles') ? 'super_admin' : 'admin' 
            }, 
            password: cleanPassword 
          })
        }).catch(() => {});

        setAdminUser(u);
        setIsAuthenticated(true);
        setIsLoggingIn(false);
        return;
      }

      setLoginError(responseData?.error || 'Invalid admin credentials. Please check your email and password.');
    } catch (err) {
      setLoginError('Invalid admin email or password.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
    setLoginError(null);
  };

  const handleStatusChange = async (id: string, status: ReportStatus) => {
    setIsProcessing(id);
    const note = adminNotes[id] || '';
    try {
      await onUpdateReportStatus(id, status, note);
    } catch (err: any) {
      console.error("Failed to update report status:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSOSChange = async (id: string, status: EmergencySOS['status']) => {
    setIsProcessing(id);
    try {
      await onUpdateSOSStatus(id, status);
    } catch (err: any) {
      console.error("Failed to update SOS status:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  // ---------------- LOGIN GATE SCREEN ---------------- //
  if (!isAuthenticated) {
    const isCitizenUser = currentUser && (!currentUser.role || currentUser.role === 'user');

    return (
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
        {/* If logged in as a normal citizen, show prominent Restricted Access Card */}
        {isCitizenUser && (
          <div className="bg-red-950/40 border border-red-500/40 rounded-3xl p-5 sm:p-6 text-slate-200 shadow-xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-red-500/20 text-red-400 border border-red-500/40 rounded-2xl shrink-0 mt-0.5">
                <AlertOctagon className="w-6 h-6 text-red-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span>Administrative Access Restricted</span>
                  <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 uppercase">
                    Role: Citizen
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  You are currently logged in as <strong className="text-white font-bold">{currentUser.fullName} {currentUser.surname}</strong> (<span className="text-amber-400 font-mono">{currentUser.email}</span>).
                </p>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Incident triage, road hazard approval, corridor patrol dispatch, and user management tools are strictly reserved for verified LiveTrafficNPC staff & administrators.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-red-900/60">
              {onSwitchTab && (
                <button
                  type="button"
                  onClick={() => onSwitchTab('map')}
                  className="flex-1 min-w-[140px] bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-700 transition cursor-pointer text-center"
                >
                  Return to Public Map
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="bg-red-900/30 hover:bg-red-900/50 text-red-300 text-xs font-bold py-2.5 px-4 rounded-xl border border-red-500/30 transition cursor-pointer"
                >
                  Sign Out of Account
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-[#0A0F1A] border-2 border-[#D4A237]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-200 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-amber-500/10 border-2 border-[#D4A237]/50 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8 text-[#D4A237]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Admin Portal Login</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Authorised Access for LiveTrafficNPC Dispatch Officers & System Moderators
              </p>
            </div>
          </div>

          {loginError && (
            <div className="bg-red-950/80 border border-red-800/80 text-red-200 text-xs p-3.5 rounded-xl flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            autoComplete="off"
            data-lpignore="true"
            data-form-type="other"
            className="space-y-4"
          >
            {/* Dummy hidden inputs to absorb browser autofill */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
              <input type="text" name="fakeadminuser" tabIndex={-1} autoComplete="off" />
              <input type="password" name="fakeadminpass" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#D4A237] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="admin_login_email_no_prefill"
                  autoComplete="off"
                  data-lpignore="true"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter admin email..."
                  className="w-full bg-[#05080E] border border-[#D4A237]/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4A237] font-mono transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Admin Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="text-xs text-[#D4A237] hover:text-white transition font-bold underline cursor-pointer"
                >
                  Change / Reset Password
                </button>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-[#D4A237] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="admin_login_password_no_prefill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#05080E] border border-[#D4A237]/40 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-[#D4A237] font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#FAF4EA] hover:bg-white text-[#070A10] border-2 border-[#D4A237] font-black uppercase tracking-wider text-xs sm:text-sm py-3.5 rounded-xl transition shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-[#070A10]" />
              <span>{isLoggingIn ? 'Authenticating...' : 'Sign In to Admin Command'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Modal for Admin Login */}
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          userEmail={email}
          userName="Admin Account"
        />
      </div>
    );
  }

  // ---------------- AUTHENTICATED ADMIN PANEL ---------------- //
  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-4 sm:space-y-6 min-h-[85vh] pb-32 sm:pb-24 text-slate-100 overflow-x-hidden">
      {/* Admin Header */}
      <div className="bg-[#0A0F1A] border-2 border-[#D4A237]/60 rounded-2xl p-3.5 sm:p-6 shadow-2xl text-slate-200 space-y-4 sm:space-y-5">
        {/* Top Tier: Title, Authenticated Identity & Utility Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-800/80">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="bg-amber-500/10 text-[#D4A237] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#D4A237]/40 shrink-0 shadow-inner">
              <Lock className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h2 className="text-base sm:text-2xl font-black text-white tracking-tight leading-tight">
                  Admin Command Center
                </h2>
                <span className="inline-flex items-center space-x-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 max-w-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="truncate max-w-[130px] sm:max-w-none">{(adminUser?.name || 'ADMIN').toUpperCase()}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-sm text-slate-400 mt-0.5 sm:mt-1 leading-normal sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                Moderate live community hazard reports, dispatch corridor units, and manage road incident operations.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2.5 shrink-0 pt-1 lg:pt-0">
            {onSwitchTab && (
              <button
                type="button"
                onClick={() => onSwitchTab('feed')}
                className="flex items-center justify-center space-x-1.5 bg-[#05080E] hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
                title="View Live Feed and Patrol Dispatches"
              >
                <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Live Feed</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('release_notes')}
              className={`flex items-center justify-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 border ${
                activeTab === 'release_notes'
                  ? 'bg-[#D4A237] text-slate-950 border-[#D4A237] font-black'
                  : 'bg-[#05080E] hover:bg-[#D4A237]/20 text-[#D4A237] hover:text-amber-300 border-[#D4A237]/40'
              }`}
              title={`View internal ${getFullVersionString()} release notes and system changelog (Admin only)`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
              <span>{getFullVersionString()} Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="flex items-center justify-center space-x-1.5 bg-[#05080E] hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              title="Change your logged-in administrator password"
            >
              <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClearMapConfirm(true)}
              className="flex items-center justify-center space-x-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 border border-red-500/40 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              title="Clear all active map hazards and SOS pins"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span>Clear Map</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center space-x-1.5 bg-[#05080E] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              title="Sign Out of Admin"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Second Tier: Primary Metric & Quick Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
          {/* Pending Reviews */}
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'pending'
                ? 'bg-amber-500/15 border-2 border-[#D4A237] shadow-lg shadow-amber-950/40 ring-1 ring-amber-400/40'
                : 'bg-[#05080E] border-slate-800 hover:border-amber-500/50 hover:bg-[#0A0E18]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Pending
              </span>
              <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'pending' ? 'text-amber-400' : 'text-slate-500'}`} />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
              <span className={`text-lg sm:text-2xl font-black ${pendingReports.length > 0 ? 'text-amber-400' : 'text-white'}`}>
                {pendingReports.length}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                pendingReports.length > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {pendingReports.length > 0 ? 'Action' : 'Clear'}
              </span>
            </div>
          </button>

          {/* Live Active Hazards */}
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'approved'
                ? 'bg-emerald-500/15 border-2 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-400/40'
                : 'bg-[#05080E] border-slate-800 hover:border-emerald-500/50 hover:bg-[#0A0E18]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Live Hazards
              </span>
              <ShieldCheck className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'approved' ? 'text-emerald-400' : 'text-slate-500'}`} />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
              <span className="text-lg sm:text-2xl font-black text-emerald-400">
                {approvedReports.length}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                Active
              </span>
            </div>
          </button>

          {/* Active Emergency SOS */}
          <button
            type="button"
            onClick={() => setActiveTab('sos')}
            className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'sos'
                ? 'bg-red-600/20 border-2 border-red-500 shadow-lg shadow-red-950/40 ring-1 ring-red-400/40'
                : 'bg-[#05080E] border-slate-800 hover:border-red-500/50 hover:bg-[#0A0E18]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Active SOS
              </span>
              <AlertOctagon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'sos' ? 'text-red-400' : 'text-slate-500'}`} />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
              <span className={`text-lg sm:text-2xl font-black ${activeSOS.length > 0 ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
                {activeSOS.length}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                activeSOS.length > 0
                  ? 'bg-red-500/30 text-red-300 border-red-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {activeSOS.length > 0 ? 'Critical' : '0 SOS'}
              </span>
            </div>
          </button>

          {/* Stats & Turnaround Graphs */}
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/15 border-2 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400/40'
                : 'bg-[#05080E] border-slate-800 hover:border-cyan-500/50 hover:bg-[#0A0E18]'
            }`}
            title="View Response Statistics, Turnaround Graphs & Performance Charts"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Analytics
              </span>
              <BarChart3 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === 'analytics' ? 'text-cyan-400' : 'text-slate-500'}`} />
            </div>
            <div className="mt-1.5 sm:mt-2 flex items-baseline justify-between">
              <span className={`text-xs sm:text-base font-black ${activeTab === 'analytics' ? 'text-cyan-400' : 'text-slate-200'}`}>
                Stats
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                Graphs
              </span>
            </div>
          </button>
        </div>

          {clearSuccessMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold p-3 rounded-xl flex items-center justify-between animate-fadeIn">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{clearSuccessMsg}</span>
              </div>
              <button onClick={() => setClearSuccessMsg(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

        {/* Modern Classy Admin View Dropdown */}
        {(() => {
          const adminModules = [
            {
              id: 'pending',
              label: 'Pending Review',
              subtitle: 'Moderate community hazard reports before public map dispatch',
              icon: Clock,
              count: pendingReports.length,
              badgeText: pendingReports.length > 0 ? `${pendingReports.length} PENDING` : 'CLEAR',
              badgeColor: pendingReports.length > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('pending')
            },
            {
              id: 'approved',
              label: 'Live Reports & Hazards',
              subtitle: 'View, edit, or resolve currently published highway alerts',
              icon: ShieldCheck,
              count: approvedReports.length,
              badgeText: `${approvedReports.length} LIVE`,
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
              onSelect: () => setActiveTab('approved')
            },
            {
              id: 'admin_posts',
              label: 'Admin Broadcasts & Dispatches',
              subtitle: 'View, broadcast, pin, and manage live official admin posts appearing across feeds & map',
              icon: Radio,
              count: (feedItems || []).filter(isItemAdminPost).length,
              badgeText: `${(feedItems || []).filter(isItemAdminPost).length} POSTS`,
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('admin_posts')
            },
            {
              id: 'sos',
              label: 'Emergency SOS Command',
              subtitle: 'Manage active motorist distress signals and unit dispatches',
              icon: AlertOctagon,
              count: activeSOS.length,
              badgeText: `${activeSOS.length} ACTIVE`,
              badgeColor: activeSOS.length > 0 ? 'bg-red-600/30 text-red-300 border-red-500/50' : 'bg-slate-800 text-slate-400 border-slate-700',
              iconBg: 'bg-red-600/20 text-red-400 border-red-500/40',
              onSelect: () => setActiveTab('sos')
            },
            {
              id: 'partner_api',
              label: 'Insurance & Partner SOS Integration API',
              subtitle: 'API keys, live simulator sandbox, OpenAPI 3.0 spec, and programmatic distress ingestion for insurance & telematics partners',
              icon: ShieldCheck,
              badgeText: 'REST API v1',
              badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
              iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
              onSelect: () => setIsPartnerApiModalOpen(true)
            },
            {
              id: 'responders',
              label: 'Responder & Partner Directory (CRUD)',
              subtitle: 'Manage tactical patrol officers, roadside partners, SAPS units, EMS medics, and towing operators for dropdown dispatch',
              icon: Radio,
              count: responderPartners.length,
              badgeText: `${responderPartners.length} UNITS`,
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => {
                setActiveTab('responders');
                loadResponderPartners();
              }
            },
            {
              id: 'analytics',
              label: 'Response Statistics, Performance & Turnaround Graphs',
              subtitle: 'Detailed graphical breakdown of SOS response turnaround, dispatch latencies, responder performance, and hazard trends',
              icon: BarChart3,
              badgeText: 'GRAPHS & METRICS',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('analytics')
            },
            {
              id: 'users',
              label: 'User & Admin Management',
              subtitle: 'Manage admin accounts, officer credentials, citizen roles & passwords',
              icon: Users,
              badgeText: 'SECURITY',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('users')
            },
            {
              id: 'category_photos',
              label: 'Incident Category Alert Banners',
              subtitle: 'Upload and customize official wide alert banners (~3:1 panoramic format) for all incident types',
              icon: Camera,
              badgeText: 'ALERT BANNERS',
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
              onSelect: () => setActiveTab('category_photos')
            },
            {
              id: 'hashtags',
              label: 'Broadcast #Hashtags & Social Rules',
              subtitle: 'Customize default #tags, quick presets (#MothersDay), keyword triggers & blacklists',
              icon: Hash,
              badgeText: 'SOCIAL / #TAGS',
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
              onSelect: () => setActiveTab('hashtags')
            },
            {
              id: 'activity',
              label: 'Activity Logs & Interval Stream',
              subtitle: 'View live chronological system audits, toggle paused/active logging, and adjust intervals',
              icon: Activity,
              badgeText: 'AUDIT / INTERVALS',
              badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
              iconBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
              onSelect: () => setActiveTab('activity')
            },
            {
              id: 'ads',
              label: 'Feeds Advertising & Image Banners',
              subtitle: 'Configure partner banners and toggle live feed advertising on/off (experiment)',
              icon: Megaphone,
              badgeText: 'EXPERIMENT / ADS',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('ads')
            },
            {
              id: 'tiers',
              label: 'Patrol Support Tiers',
              subtitle: 'Configure fuel and equipment backing contribution packages',
              icon: Settings,
              badgeText: 'CONFIG',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => {
                setActiveTab('tiers');
                loadSupportTiers();
              }
            },
            {
              id: 'donations',
              label: 'Donations & Pothole Ledger',
              subtitle: 'Track community financial backing and road repair funds',
              icon: Wrench,
              badgeText: 'FINANCE',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => {
                setActiveTab('donations');
                loadDonations();
              }
            },
            {
              id: 'feedback',
              label: 'Community Suggestions & Ideas',
              subtitle: 'Review feature ideas, UI suggestions, and bug reports from users',
              icon: Lightbulb,
              badgeText: 'COMMUNITY',
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('feedback')
            },
            {
              id: 'course',
              label: 'Advanced Driving Course (Max 10)',
              subtitle: 'Admin visibility toggle (ON/OFF), class schedule (JHB/PTA), and ID & driver license roster',
              icon: Car,
              badgeText: 'COURSE / 10 CAP',
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('course')
            },
            {
              id: 'connections',
              label: 'Live Feed Connections & Presence',
              subtitle: 'Real-time telemetry of people viewing highway feeds, IP addresses, devices, and layouts (RAM only)',
              icon: Radio,
              badgeText: 'LIVE PRESENCE',
              badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
              onSelect: () => setActiveTab('connections')
            },
            {
              id: 'push',
              label: 'Emergency Push & FCM Alerts',
              subtitle: 'Push notification trigger engine, background alerts when app is closed, and dispatch devices',
              icon: BellRing,
              badgeText: 'BACKGROUND PUSH',
              badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
              iconBg: 'bg-red-500/15 text-red-400 border-red-500/30',
              onSelect: () => setActiveTab('push')
            },
            {
              id: 'release_notes',
              label: `System Changelog & Deployment Manifest (${getFullVersionString()})`,
              subtitle: 'Internal release notes: 6h rolling feed window, bullet defaults, ad rotation, and cloud persistence',
              icon: Sparkles,
              badgeText: `${getFullVersionString()} DEPLOYED`,
              badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
              iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
              onSelect: () => setActiveTab('release_notes')
            }
          ];

          const selectedModule = adminModules.find(m => m.id === activeTab) || adminModules[0];

          return (
            <div className="mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/90 relative" ref={tabDropdownRef}>
              <label className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-amber-400 mb-1.5 sm:mb-2 flex items-center justify-between">
                <span>Active Module</span>
                <span className="text-[10px] text-slate-400 font-semibold lowercase">tap to switch modules</span>
              </label>

              {/* Trigger Button */}
              <button
                type="button"
                onClick={() => setIsTabDropdownOpen(!isTabDropdownOpen)}
                className={`w-full bg-[#0B0D12] hover:bg-[#121520] border-2 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between transition-all duration-200 text-left shadow-2xl cursor-pointer ${
                  isTabDropdownOpen ? 'border-amber-500 shadow-amber-950/40' : 'border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                  <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl border ${selectedModule.iconBg} shadow-md shrink-0`}>
                    <selectedModule.icon className="w-4 h-4 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      <span className="font-black text-xs sm:text-base text-white uppercase tracking-tight truncate">
                        {selectedModule.label}
                      </span>
                      <span className={`border font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0 ${selectedModule.badgeColor}`}>
                        {selectedModule.badgeText}
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">
                      {selectedModule.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 shrink-0 ml-1.5 sm:ml-2">
                  <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-300 transition-transform duration-300 ${isTabDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
                </div>
              </button>

              {/* Dropdown Menu Overlay */}
              {isTabDropdownOpen && (
                <>
                  {/* Backdrop overlay for mobile screens */}
                  <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] sm:hidden"
                    onClick={() => setIsTabDropdownOpen(false)}
                  />

                  <div className="fixed inset-x-3 top-20 sm:top-full sm:bottom-auto sm:inset-x-0 sm:mt-2 sm:absolute z-[100] bg-[#0A0C14] border-2 border-amber-500/80 rounded-2xl p-2.5 shadow-2xl space-y-1 max-h-[75vh] sm:max-h-[420px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 [scrollbar-width:thin]">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-3 py-2 border-b border-slate-800/80 mb-1 flex items-center justify-between sticky top-0 bg-[#0A0C14] z-10">
                      <span>Admin Command Modules ({adminModules.length})</span>
                      <button
                        type="button"
                        onClick={() => setIsTabDropdownOpen(false)}
                        className="p-1 text-slate-400 hover:text-white rounded-lg sm:hidden cursor-pointer"
                        title="Close menu"
                      >
                        <X className="w-4 h-4 text-amber-400" />
                      </button>
                    </div>

                    {adminModules.map((mod) => {
                      const isSelected = mod.id === activeTab;
                      const ModIcon = mod.icon;

                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => {
                            mod.onSelect();
                            setIsTabDropdownOpen(false);
                          }}
                          className={`w-full p-2.5 sm:p-3 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                            isSelected
                              ? 'bg-amber-500/20 border border-amber-500 text-white shadow-lg'
                              : 'bg-[#10131E]/80 border border-transparent hover:bg-[#161B2B] text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <div className={`p-2 rounded-xl border shrink-0 ${
                              isSelected ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : `${mod.iconBg} group-hover:text-amber-400`
                            }`}>
                              <ModIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`font-extrabold text-xs sm:text-sm uppercase ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                                  {mod.label}
                                </span>
                                <span className={`text-[9px] font-bold border px-1.5 py-0.2 rounded ${mod.badgeColor}`}>
                                  {mod.badgeText}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-normal leading-snug truncate sm:whitespace-normal">
                                {mod.subtitle}
                              </p>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 ml-2 shadow-md">
                              <Check className="w-3.5 h-3.5 text-slate-950 font-black" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Tab Content 1: Pending Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>Community Submissions & Verification Queue ({pendingReports.length})</span>
            <span className="text-amber-400">Live Immediately as Unverified User Pins</span>
          </div>

          {pendingReports.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
              <h3 className="text-lg font-bold text-white">All Submissions Verified</h3>
              <p className="text-xs text-slate-400">All submitted community reports are verified or clear.</p>
            </div>
          ) : (
            pendingReports.map((report) => (
              <div
                key={report.id}
                className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-xl text-white space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                        {report.type}
                      </span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                        Severity: {report.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Submitted: {formatReadableDateTime(report.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white mt-1">{report.title}</h3>
                    <p className="text-xs font-semibold text-slate-300">📍 {report.locationName} ({report.roadName})</p>
                  </div>

                  {/* AI Triage Badge */}
                  {report.aiAnalysis && (
                    <div className="bg-slate-950 border border-purple-500/30 p-3 rounded-xl max-w-xs shrink-0 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-purple-400">Gemini AI Triage</span>
                        <span className="bg-purple-600 text-white font-bold px-1.5 py-0.2 rounded text-[10px]">
                          Risk: {report.aiAnalysis.riskScore}/100
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-tight">{report.aiAnalysis.summary}</p>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {report.description}
                </p>

                {/* Reporter & Attachment Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Reporter:</span>
                    <span className="font-bold text-white">{report.reporterSurname && !report.reporterName.toLowerCase().includes(report.reporterSurname.toLowerCase()) ? `${report.reporterName} ${report.reporterSurname}` : report.reporterName}</span>
                    {report.reporterPhone && <span className="block text-slate-400">{report.reporterPhone}</span>}
                  </div>

                  {report.imageUrl ? (
                    <div className="flex items-center space-x-3">
                      <img src={report.imageUrl} alt="Proof" className="w-16 h-12 object-cover rounded-lg border border-slate-700" />
                      <span className="text-slate-400">Photo Evidence Provided</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No image attached</span>
                  )}
                </div>

                {/* Admin Audit Trail */}
                <AdminAuditBadge isAdmin={true} report={report} variant="compact" />

                {/* Admin Note Input & Actions Toolbar */}
                <div className="pt-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-t border-slate-800">
                  <input
                    type="text"
                    placeholder="Optional admin note or patrol dispatch comment..."
                    value={adminNotes[report.id] || ''}
                    onChange={(e) => setAdminNotes({ ...adminNotes, [report.id]: e.target.value })}
                    className="w-full lg:w-5/12 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 placeholder-slate-500"
                  />

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingReportState({ report, isPending: true })}
                      className="h-8.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                      title="Edit report details & fix spelling before publishing"
                    >
                      <Edit3 className="w-3.5 h-3.5 shrink-0" />
                      <span>Edit Info</span>
                    </button>

                    {confirmDeleteReportId === report.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/60 p-1 rounded-xl animate-fadeIn">
                        <span className="text-[11px] font-bold text-rose-300 px-1.5 whitespace-nowrap">Delete?</span>
                        <button
                          type="button"
                          disabled={isDeletingReportId === report.id}
                          onClick={() => handleDeleteReportItem(report.id)}
                          className="h-7 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black cursor-pointer shadow whitespace-nowrap"
                        >
                          {isDeletingReportId === report.id ? '...' : 'Yes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteReportId(null)}
                          className="h-7 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteReportId(report.id)}
                        className="h-8.5 px-3 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 hover:border-rose-500 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                        title="Permanently delete this report"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Delete</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStatusChange(report.id, 'rejected')}
                      disabled={isProcessing === report.id}
                      className="h-8.5 px-3 bg-red-950/60 hover:bg-red-900/80 text-red-200 border border-red-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      id={`verify-report-${report.id}`}
                      onClick={() => handleStatusChange(report.id, 'approved')}
                      disabled={isProcessing === report.id}
                      className="h-8.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer whitespace-nowrap"
                    >
                      {isProcessing === report.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{isProcessing === report.id ? 'Verifying...' : (report.verifiedByAdmin ? 'Verified' : 'Verify & Endorse')}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Approved / Live Reports */}
      {activeTab === 'approved' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 font-bold uppercase tracking-wider px-1 pb-1 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-sm sm:text-base tracking-normal">Live Approved Reports on Public Map</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-black">
                {approvedReports.length}
              </span>
            </div>

            {approvedReports.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setClearLiveReportsConfirmText('');
                  setShowClearLiveReportsModal(true);
                }}
                className="h-8.5 px-3.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-sm self-start sm:self-auto"
                title="Clear all live approved reports from the public map"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Clear All Live Reports ({approvedReports.length})</span>
              </button>
            )}
          </div>

          {approvedReports.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm sm:text-base">No Active Live Reports</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  All community hazard reports have been cleared or marked as resolved. Any new incident reports submitted by drivers will appear in the Pending Submissions queue for verification.
                </p>
              </div>
            </div>
          ) : (
            approvedReports.map((report) => {
              const repTiming = getReportResolutionTiming(report);
              return (
                <div
                  key={report.id}
                  className="bg-slate-900/95 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg text-white space-y-3.5 transition"
                >
                  {/* Top Bar: Live Badge & Title */}
                  <div className="flex items-start gap-2.5">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[10px] px-2 py-0.5 rounded tracking-wide uppercase shrink-0 mt-0.5">
                      LIVE
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-white break-words leading-tight min-w-0 flex-1">
                      {report.title}
                    </h4>
                  </div>

                  {/* Location & Key Metrics Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-300 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-semibold truncate">{report.locationName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-700/60 text-[11px] font-medium">
                        👍 {report.upvotes} Confirmations
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border ${
                        repTiming.isResolved
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        ⏱️ {repTiming.isResolved ? 'Resolved:' : 'Active:'} {repTiming.durationText}
                      </span>
                    </div>
                  </div>

                  {/* Admin Audit Trail */}
                  <AdminAuditBadge isAdmin={true} report={report} variant="compact" />

                  {/* Action Toolbar */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    {/* Secondary Actions: 3-column balanced grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingReportState({ report, isPending: false })}
                        className="h-9 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        title="Edit report details, fix typos or adjust coordinates"
                      >
                        <Edit3 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Edit Info</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectReport(report)}
                        className="h-9 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span className="truncate">View Details</span>
                      </button>

                      {confirmDeleteReportId === report.id ? (
                        <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-500/60 p-0.5 rounded-xl animate-fadeIn justify-center">
                          <button
                            type="button"
                            disabled={isDeletingReportId === report.id}
                            onClick={() => handleDeleteReportItem(report.id)}
                            className="h-7 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black cursor-pointer shadow flex-1"
                          >
                            {isDeletingReportId === report.id ? '...' : 'Yes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteReportId(null)}
                            className="h-7 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteReportId(report.id)}
                          className="h-9 px-2 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 hover:border-rose-500 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                          title="Delete this Live Hazard Map Pin"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">Delete</span>
                        </button>
                      )}
                    </div>

                    {/* Primary Action Button */}
                    <div>
                      {report.status !== 'resolved' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenResolutionModal('report', report)}
                          className="w-full h-9.5 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{report.type === 'pothole' ? 'Mark Fixed & Photo' : 'Mark Hazard Resolved'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenResolutionModal('report', report)}
                          className="w-full h-9.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>{report.resolvedImageUrl ? 'View/Edit Fixed Photo' : 'Add Fixed Photo'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 3: Active Emergency SOS Requests & Responder Dispatch */}
      {activeTab === 'sos' && (
        <div className="space-y-4">
          {/* Quick Push Notification Dispatch Banner */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/60 border border-red-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-red-400">
                    Emergency Push & FCM Dispatch Active
                  </span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
                <p className="text-xs text-slate-300">
                  New SOS calls trigger loud push alerts with siren vibration to registered admin phones and PCs, even when this browser tab is closed.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPartnerApiModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-md"
                title="Insurance & Telematics Partner SOS Integration API (Discovery, Outsurance, Santam)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Insurance Partner API</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('responders');
                  loadResponderPartners();
                }}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                title="Manage patrol units, roadside partners, and emergency directory"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Responders (CRUD)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
                title="View detailed turnaround times, response graphs and performance metrics"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Turnaround Stats & Graphs</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('push')}
                className="px-3.5 py-2 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-200 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
              >
                <span>Manage Push Devices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SOS Search & Status Filter Controls */}
          <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Emergency SOS Call Control & Patrol Dispatch
                </h3>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Showing {filteredSOSRequests.length} of {sosRequests.length} Calls
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Call Ref (e.g. SOS-2608), Motorist, Phone, Responding Patroller/Partner, Vehicle, Location..."
                  value={sosSearchQuery}
                  onChange={(e) => setSosSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
                {sosSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setSosSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setSosStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                    sosStatusFilter === 'all'
                      ? 'bg-slate-700 text-white border-slate-600'
                      : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  All ({sosRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSosStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                    sosStatusFilter === 'active'
                      ? 'bg-red-600 text-white border-red-500'
                      : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-red-300'
                  }`}
                >
                  Pending ({sosRequests.filter(s => s.status === 'active').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSosStatusFilter('dispatched')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                    sosStatusFilter === 'dispatched'
                      ? 'bg-amber-500 text-slate-950 font-black border-amber-400'
                      : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-amber-300'
                  }`}
                >
                  Dispatched ({sosRequests.filter(s => s.status === 'dispatched').length})
                </button>
                <button
                  type="button"
                  onClick={() => setSosStatusFilter('resolved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                    sosStatusFilter === 'resolved'
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-emerald-300'
                  }`}
                >
                  Resolved ({sosRequests.filter(s => s.status === 'resolved').length})
                </button>

                {onClearSOS && sosRequests.filter(s => s.status === 'resolved').length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to clear all resolved SOS records?")) {
                        await onClearSOS('resolved');
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition shrink-0 cursor-pointer border bg-slate-900 border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 flex items-center space-x-1"
                    title="Purge resolved SOS records from database"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>Clear Resolved ({sosRequests.filter(s => s.status === 'resolved').length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredSOSRequests.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <p className="text-sm font-bold text-white">No emergency SOS requests matching current filter.</p>
              {sosSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSosSearchQuery('')}
                  className="text-xs text-red-400 hover:underline pt-1 cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredSOSRequests.map((sos) => {
              const formattedDate = formatReadableDateTime(sos.createdAt);
              const elapsed = getTimeAgo(sos.createdAt);
              const isDispatched = sos.status === 'dispatched';
              const isResolved = sos.status === 'resolved';
              const callRef = sos.callRef || `SOS-${new Date(sos.createdAt).toISOString().slice(2, 10).replace(/-/g, '')}-${sos.id.slice(0, 4).toUpperCase()}`;

              return (
                <div
                  key={sos.id}
                  className={`border-2 rounded-2xl p-5 shadow-2xl text-white space-y-3.5 transition-all ${
                    isResolved
                      ? 'bg-slate-900/90 border-emerald-600/60'
                      : isDispatched
                      ? 'bg-slate-900 border-amber-500/80 shadow-amber-950/20'
                      : 'bg-slate-900 border-red-600 shadow-red-950/30'
                  }`}
                >
                  {/* Top Bar: Status, Call Ref Tag, Emergency Type, Timestamp */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-extrabold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center space-x-1 ${
                        isResolved
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                          : isDispatched
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-red-600 text-white animate-pulse'
                      }`}>
                        <span>{isResolved ? '✅ RESOLVED & SECURE' : isDispatched ? '🚓 PATROL DISPATCHED' : '🆘 SOS ACTIVE (PENDING)'}</span>
                      </span>

                      {/* Call Reference Number with 1-Click Copy */}
                      <button
                        type="button"
                        onClick={() => handleCopyCallRef(callRef)}
                        title="Click to copy Call Ref"
                        className="flex items-center space-x-1.5 bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg transition cursor-pointer group shadow-sm"
                      >
                        <Hash className="w-3 h-3 text-amber-400" />
                        <span>{callRef}</span>
                        {copiedRefId === callRef ? (
                          <span className="text-[10px] bg-emerald-500 text-slate-950 px-1 py-0.2 rounded font-sans font-bold">
                            Copied!
                          </span>
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition" />
                        )}
                      </button>

                      {sos.emergencyType && (
                        <span className={`${
                          sos.emergencyType === 'gbv_assist'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                            : 'bg-red-950/80 text-red-300 border-red-500/40'
                        } text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider`}>
                          {sos.emergencyType === 'gbv_assist' ? '💜 GBV ASSIST' : sos.emergencyType.replace(/_/g, ' ')}
                        </span>
                      )}

                      {sos.partnerSource && (
                        <span className="bg-blue-950/80 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/40 uppercase tracking-wider flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-blue-400" />
                          <span>{sos.partnerSource}</span>
                          {sos.policyNumber && <span className="font-mono text-slate-400">#{sos.policyNumber}</span>}
                          {sos.telematicsTriggered && <span className="text-amber-300 font-bold">⚡ Telematics</span>}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{formattedDate}</span>
                      <span className="text-amber-400 font-sans font-bold">({elapsed})</span>
                    </div>
                  </div>

                  {/* Incident Response & Turnaround Duration Timeline */}
                  {(() => {
                    const timing = getSOSTimingBreakdown(sos);
                    return (
                      <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                        isResolved
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : isDispatched
                          ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                          : 'bg-red-950/20 border-red-500/30 text-red-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center space-x-2">
                            <Clock className={`w-4 h-4 shrink-0 ${isResolved ? 'text-emerald-400' : isDispatched ? 'text-amber-400 animate-pulse' : 'text-red-400 animate-bounce'}`} />
                            <span className="font-extrabold text-white uppercase tracking-wider text-[11px]">
                              {isResolved ? 'Total Turnaround Time:' : isDispatched ? 'Active Response Duration:' : 'Pending Dispatch Duration:'}
                            </span>
                            <span className={`font-mono font-black text-sm px-2 py-0.5 rounded ${
                              isResolved 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : isDispatched 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}>
                              {timing.totalDurationText}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                            <span className="text-slate-500">Summary:</span>
                            <span className="font-semibold text-slate-200">{timing.summary}</span>
                          </div>
                        </div>

                        {/* Milestone Timeline Steps */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                          {/* Step 1: Call Logged */}
                          <div className="bg-[#0A0B0D]/80 p-2 rounded-lg border border-slate-800 flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 block font-sans">1. Call Received</span>
                              <span className="text-slate-200 font-bold">{formatSATime(sos.createdAt)}</span>
                            </div>
                          </div>

                          {/* Step 2: Patrol Dispatched */}
                          <div className="bg-[#0A0B0D]/80 p-2 rounded-lg border border-slate-800 flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${sos.dispatchedAt ? 'bg-amber-400' : 'bg-slate-600'}`} />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 block font-sans">2. Patrol Dispatched</span>
                              {sos.dispatchedAt ? (
                                <span className="text-amber-300 font-bold">
                                  {formatSATime(sos.dispatchedAt)} {timing.dispatchLatencyText ? `(+${timing.dispatchLatencyText})` : ''}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic font-sans text-[10px]">Awaiting Dispatch</span>
                              )}
                            </div>
                          </div>

                          {/* Step 3: Resolved / On Scene */}
                          <div className="bg-[#0A0B0D]/80 p-2 rounded-lg border border-slate-800 flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isResolved ? 'bg-emerald-400' : isDispatched ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
                            <div className="min-w-0">
                              <span className="text-[10px] text-slate-400 block font-sans">
                                {isResolved ? '3. Resolved & Safe' : '3. On-Scene Status'}
                              </span>
                              {isResolved ? (
                                <span className="text-emerald-300 font-bold">
                                  {sos.resolvedAt ? formatSATime(sos.resolvedAt) : 'Resolved'} {timing.onSceneDurationText ? `(${timing.onSceneDurationText} on-scene)` : ''}
                                </span>
                              ) : isDispatched ? (
                                <span className="text-amber-300 font-bold">
                                  En route / Active ({timing.onSceneDurationText || '0s'})
                                </span>
                              ) : (
                                <span className="text-slate-500 italic font-sans text-[10px]">Pending Patrol</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Caller & Vehicle Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#0A0B0D] p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                          <User className="w-3 h-3 text-red-400" />
                          <span>Distressed Motorist</span>
                        </span>
                        <a
                          href={`tel:${sos.phone.replace(/\s+/g, '')}`}
                          className="text-[11px] bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold transition flex items-center space-x-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call Motorist</span>
                        </a>
                      </div>
                      <p className="text-base font-extrabold text-white">{sos.name}</p>
                      <p className="text-xs text-red-300 font-mono font-bold">📞 {sos.phone}</p>
                      <p className="text-xs text-slate-300 flex items-center space-x-1">
                        <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">{sos.vehicleInfo}</span>
                      </p>
                    </div>

                    <div className="bg-[#0A0B0D] p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>Location & GPS Coordinates</span>
                        </span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${sos.latitude},${sos.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-bold transition flex items-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3 text-amber-400" />
                          <span>Open Google Maps</span>
                        </a>
                      </div>
                      <p className="text-xs font-bold text-slate-200 leading-snug">{sos.locationName}</p>
                      <p className="text-[11px] font-mono text-amber-400 font-semibold">
                        GPS: {sos.latitude.toFixed(5)}, {sos.longitude.toFixed(5)}
                      </p>
                      {sos.notes && (
                        <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                          <span className="text-slate-400 font-bold">Motorist Notes: </span>
                          <span>{sos.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Responding Patroller or Partner Responder Section */}
                  <div className={`p-3.5 rounded-xl border space-y-2 ${
                    sos.responderName
                      ? 'bg-gradient-to-r from-amber-950/40 via-[#0A0B0D] to-slate-900 border-amber-500/50'
                      : 'bg-red-950/20 border-red-500/30'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Shield className={`w-4 h-4 ${sos.responderName ? 'text-amber-400' : 'text-red-400'}`} />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                          Responding Patroller / Partner Responder
                        </span>
                        {sos.responderType && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded font-bold">
                            {sos.responderType === 'patrol_officer'
                              ? '🚓 LiveTraffic Patrol'
                              : sos.responderType === 'partner_responder'
                              ? '🤝 Partner Responder'
                              : sos.responderType === 'saps_police'
                              ? '🚔 SAPS Police'
                              : sos.responderType === 'medical_ems'
                              ? '🚑 Medical EMS'
                              : sos.responderType === 'towing_recovery'
                              ? '🛻 Heavy Recovery Tow'
                              : sos.responderType === 'community_responder'
                              ? '👥 Community Watch CPF'
                              : '🛡️ Responding Unit'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenSOSDispatchModal(sos)}
                        className="text-[11px] bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer self-start sm:self-auto"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{sos.responderName ? 'Edit Responder & Notes' : 'Assign Responder Unit'}</span>
                      </button>
                    </div>

                    {sos.responderName ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">Assigned Responder / Officer:</span>
                          <span className="font-bold text-white text-sm">{sos.responderName}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">Unit Callsign / Vehicle:</span>
                          <span className="font-semibold text-amber-300 font-mono">{sos.responderCallsign || 'Unit Patrol-1'}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 block">Direct Radio / Cell:</span>
                          {sos.responderPhone ? (
                            <a
                              href={`tel:${sos.responderPhone.replace(/\s+/g, '')}`}
                              className="font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{sos.responderPhone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-500">Not recorded</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-red-300 py-1">
                        <span>⚠️ No patroller or partner responder assigned to this emergency call yet.</span>
                      </div>
                    )}
                  </div>

                  {/* SOS Admin Dispatch Notes Section */}
                  <div className="bg-[#0A0B0D] p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>SOS Admin Dispatch Notes & SITREP</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSOSDispatchModal(sos)}
                        className="text-[10px] text-slate-400 hover:text-amber-300 transition cursor-pointer"
                      >
                        Edit Notes
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {sos.adminNotes ? (
                        sos.adminNotes
                      ) : (
                        <span className="text-slate-500 italic">
                          No admin dispatch notes recorded. Click 'Edit Responder & Notes' to log tactical updates.
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Bottom Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <div className="flex items-center space-x-2">
                      {/* Copy Radio / WhatsApp SITREP */}
                      <button
                        type="button"
                        onClick={() => handleCopySITREP(sos)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                        title="Copy full SITREP for WhatsApp/Radio"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>{copiedSITREPId === sos.id ? 'SITREP Copied!' : 'Copy Dispatch SITREP'}</span>
                      </button>

                      {/* Delete / Dismiss SOS Record */}
                      {onDeleteSOS && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Delete emergency SOS record for ${sos.name} (${sos.callRef || sos.id})?`)) {
                              await onDeleteSOS(sos.id);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#0A0B0D] hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/40 text-xs font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                          title="Permanently remove SOS record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {sos.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleOpenSOSDispatchModal(sos)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition shadow cursor-pointer active:scale-95 flex items-center space-x-1.5"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Dispatch Patrol / Partner</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenResolutionModal('sos', sos)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition shadow flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isResolved ? 'Update Resolution Photo/Proof' : 'Resolve & Post Assistance Photo'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content 4: Patrol Support Tiers Configuration */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Configure Patrol Support Types & Preset Amounts</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage preset support options shown to the public (e.g. Buy a Coffee / Meal, Patrol Equipment, Patrol Vehicle Fuel). Adjust amounts in ZAR (R), edit titles & descriptions, or add new patrol support types.
              </p>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => setIsAddingNewTier(true)}
                className="flex items-center space-x-1.5 bg-[#0A0B0D] hover:bg-slate-800 text-amber-500 font-bold text-xs px-4 py-2.5 rounded-xl border border-amber-500/30 transition uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Add Support Type</span>
              </button>

              <button
                onClick={handleSaveAllTiers}
                className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-lg uppercase tracking-wider"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>

          {tierSaveMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{tierSaveMsg}</span>
            </div>
          )}

          {isLoadingTiers ? (
            <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <p className="text-xs font-bold animate-pulse">Loading configured patrol support options...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`bg-[#0F1115] border rounded-2xl p-5 shadow-xl text-slate-300 space-y-4 flex flex-col justify-between relative ${
                    tier.enabled ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0A0B0D] text-amber-500 px-2.5 py-1 rounded-lg border border-slate-800 flex items-center space-x-1 shrink-0 mr-2">
                        <Layers className="w-3 h-3" />
                        <span>Category / ID: {tier.categoryKey || tier.id}</span>
                      </span>

                      <div className="flex items-center space-x-2.5 ml-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateTierField(tier.id, 'enabled', !tier.enabled)}
                          className={`flex items-center space-x-1 text-[10px] font-bold px-2 py-1 rounded-lg uppercase transition border ${
                            tier.enabled
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                          title="Toggle visibility on donation page"
                        >
                          {tier.enabled ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{tier.enabled ? 'Active' : 'Disabled'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Delete Support Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Support Type Title
                      </label>
                      <input
                        type="text"
                        value={tier.title}
                        onChange={(e) => handleUpdateTierField(tier.id, 'title', e.target.value)}
                        placeholder="e.g. Buy a Coffee / Meal"
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Preset Amount (ZAR Rand R)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-amber-500 font-extrabold text-xs">R</span>
                        <input
                          type="number"
                          min="1"
                          value={tier.amount === 0 ? '' : tier.amount}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            handleUpdateTierField(tier.id, 'amount', isNaN(val) ? 0 : val);
                          }}
                          className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-amber-500 focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Description / Impact Note
                      </label>
                      <textarea
                        rows={3}
                        value={tier.description}
                        onChange={(e) => handleUpdateTierField(tier.id, 'description', e.target.value)}
                        placeholder="Describe what this support provides..."
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Display Icon
                      </label>
                      <select
                        value={tier.icon}
                        onChange={(e) => handleUpdateTierField(tier.id, 'icon', e.target.value)}
                        className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="coffee">☕ Coffee / Refreshments</option>
                        <option value="meal">🍲 Meal / Energy Food</option>
                        <option value="equipment">🔦 Patrol Equipment & Tools</option>
                        <option value="fuel">⛽ Patrol Vehicle Fuel</option>
                        <option value="custom">💖 General / Custom Support</option>
                      </select>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSaveSingleTier(tier)}
                        className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center space-x-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save This Tier (R{tier.amount})</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add New Support Tier Modal */}
          {isAddingNewTier && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0B0D]/80 backdrop-blur-sm">
              <div className="bg-[#0F1115] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-300 space-y-4">
                <div className="bg-amber-500 p-4 text-slate-950 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider">Add New Patrol Support Option</h4>
                  <button onClick={() => setIsAddingNewTier(false)} className="text-slate-950 hover:opacity-80 font-bold">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddTierSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Support Type Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Buy a Night Meal"
                      value={newTier.title}
                      onChange={(e) => setNewTier({ ...newTier, title: e.target.value })}
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Preset Amount (ZAR Rand R)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newTier.amount}
                      onChange={(e) => setNewTier({ ...newTier, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-amber-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Icon Category
                    </label>
                    <select
                      value={newTier.icon}
                      onChange={(e) => setNewTier({ ...newTier, icon: e.target.value as any })}
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="coffee">☕ Coffee / Refreshments</option>
                      <option value="meal">🍲 Meal / Hot Food</option>
                      <option value="equipment">🔦 Patrol Equipment & Tools</option>
                      <option value="fuel">⛽ Patrol Vehicle Fuel</option>
                      <option value="custom">💖 General Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Provides a hot meal for corridor watch volunteers during 3 AM spike patrol shifts."
                      value={newTier.description}
                      onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
                      className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase tracking-wider rounded-xl text-xs transition shadow-lg"
                  >
                    Create Support Type
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 5: Donations & Pothole Sponsorships Ledger & Wall Cleaning Desk */}
      {activeTab === 'donations' && (
        <div className="space-y-6">
          {/* Wall Action Notification Toast */}
          {wallActionMessage && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
                wallActionMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {wallActionMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{wallActionMessage.text}</span>
              </div>
              <button
                onClick={() => setWallActionMessage(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Ledger & Wall Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0F1115] border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
            <div>
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <span className="uppercase tracking-wider">Community Contributions & Wall of Heroes Desk</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Manage live community hero sponsorships, verify cold-asphalt pothole repairs, or clean & purge ledger records.
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={loadDonations}
                disabled={isLoadingDonations}
                title="Refresh Ledger"
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingDonations ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              {selectedDonationIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isCleaningWall}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedDonationIds.length})</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCleanActionType('clear_all');
                  setCleanConfirmText('');
                  setIsCleanWallModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5 shadow-md"
              >
                <Eraser className="w-4 h-4" />
                <span>🧹 Clean / Purge Wall</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          {displayStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-[#0F1115] p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Raised</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">R{displayStats.totalRaised.toLocaleString()}</span>
              </div>
              <div className="bg-[#0F1115] p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Potholes Funded</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">{displayStats.potholesFunded || 0} Holes</span>
              </div>
              <div className="bg-[#0F1115] p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Backers</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">{displayStats.backersCount} Donors</span>
              </div>
              <div className="bg-[#0F1115] p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fuel Liters Funded</span>
                <span className="text-xl font-black text-amber-400 mt-1 block">{displayStats.fuelLiters} L</span>
              </div>
            </div>
          )}

          {/* Search, Filter & Bulk Select Bar */}
          <div className="bg-[#0F1115] border border-slate-800 p-3 sm:p-4 rounded-2xl space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by donor name, location, message, reference..."
                  value={donationSearchQuery}
                  onChange={(e) => setDonationSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
                />
                {donationSearchQuery && (
                  <button
                    onClick={() => setDonationSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Multi-Select Toggle */}
              {filteredDonations.length > 0 && (
                <div className="flex items-center space-x-2 shrink-0 text-xs">
                  <button
                    onClick={() => {
                      if (selectedDonationIds.length === filteredDonations.length) {
                        setSelectedDonationIds([]);
                      } else {
                        setSelectedDonationIds(filteredDonations.map(d => d.id));
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    {selectedDonationIds.length === filteredDonations.length && filteredDonations.length > 0 ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Deselect All</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select All ({filteredDonations.length})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                onClick={() => setDonationCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                  donationCategoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                All ({displayDonations.length})
              </button>
              <button
                onClick={() => setDonationCategoryFilter('pothole_repair')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border flex items-center space-x-1 ${
                  donationCategoryFilter === 'pothole_repair'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>Potholes ({displayDonations.filter(d => d.category === 'pothole_repair').length})</span>
              </button>
              <button
                onClick={() => setDonationCategoryFilter('coffee')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border flex items-center space-x-1 ${
                  donationCategoryFilter === 'coffee'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Coffee className="w-3 h-3" />
                <span>Coffee ({displayDonations.filter(d => d.category === 'coffee').length})</span>
              </button>
              <button
                onClick={() => setDonationCategoryFilter('fuel')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border flex items-center space-x-1 ${
                  donationCategoryFilter === 'fuel'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Fuel className="w-3 h-3" />
                <span>Fuel ({displayDonations.filter(d => d.category === 'fuel').length})</span>
              </button>
              <button
                onClick={() => setDonationCategoryFilter('advance_driving')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition cursor-pointer border flex items-center space-x-1 ${
                  donationCategoryFilter === 'advance_driving'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                    : 'bg-[#0A0B0D] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Car className="w-3 h-3" />
                <span>Driving Course ({displayDonations.filter(d => d.category === 'advance_driving').length})</span>
              </button>
            </div>
          </div>

          {/* Donations List / Cards */}
          {isLoadingDonations && displayDonations.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold flex flex-col items-center justify-center space-y-2">
              <RotateCcw className="w-6 h-6 text-amber-400 animate-spin" />
              <span>Loading Wall of Heroes ledger...</span>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="bg-[#0F1115] border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto" />
              <p className="text-sm font-bold text-slate-300">
                {displayDonations.length === 0
                  ? "The Wall of Heroes is completely clean — 0 records recorded."
                  : "No donation records match your search filter."}
              </p>
              {displayDonations.length === 0 && (
                <button
                  onClick={() => {
                    setCleanActionType('reset_defaults');
                    handleCleanWallAction();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold transition border border-slate-700"
                >
                  🔄 Restore Initial Showcase Wall Entries
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDonations.map((don) => {
                const isSelected = selectedDonationIds.includes(don.id);
                return (
                  <div
                    key={don.id}
                    className={`relative bg-[#0F1115] border rounded-2xl p-5 shadow-xl text-slate-300 space-y-3 transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                        : don.category === 'pothole_repair'
                        ? 'border-amber-500/60 bg-gradient-to-b from-amber-500/5 to-[#0F1115]'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-3">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDonationIds(prev =>
                              prev.includes(don.id) ? prev.filter(id => id !== don.id) : [...prev, don.id]
                            );
                          }}
                          className="mt-0.5 text-slate-400 hover:text-amber-400 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-white text-sm">{don.donorName}</span>
                            {don.isAnonymous && (
                              <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">
                                Anon
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(don.timestamp).toLocaleString()}
                          </span>
                          {don.referenceNumber && (
                            <span className="text-[9px] font-mono text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded inline-block mt-1">
                              Ref: {don.referenceNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                            +R{don.amount} ZAR
                          </span>
                          {/* Quick Delete Single Button */}
                          <button
                            type="button"
                            title="Delete this entry from Wall"
                            onClick={() => setDonationToDelete(don)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                          {don.category === 'pothole_repair' ? '🔨 POTHOLE REPAIR' : don.category.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {don.category === 'pothole_repair' && (
                      <div className="bg-[#0A0B0D] border border-amber-500/30 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                          <span className="flex items-center space-x-1">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Potholes Sponsored: {don.potholesCount || Math.max(1, Math.floor(don.amount/350))}</span>
                          </span>
                          <span>R350 / Hole</span>
                        </div>

                        {don.potholeLocation && (
                          <div className="text-xs text-slate-200 flex items-center space-x-1.5 bg-slate-900 p-2 rounded-lg border border-slate-800">
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="font-semibold">{don.potholeLocation}</span>
                          </div>
                        )}

                        {don.fixedImageUrl && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Admin Fixed Photo Proof</span>
                            </span>
                            <img
                              src={don.fixedImageUrl}
                              alt="Fixed Pothole Photo"
                              className="w-full h-36 object-cover rounded-lg border-2 border-emerald-500/60"
                            />
                          </div>
                        )}

                        {don.adminFeedback && (
                          <p className="text-xs text-emerald-300 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30 italic font-medium">
                            💬 Feedback: "{don.adminFeedback}"
                          </p>
                        )}

                        <div className="pt-3 grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 items-center border-t border-slate-800">
                          {don.isFixed ? (
                            <button
                              type="button"
                              onClick={() => handleOpenResolutionModal('donation', don)}
                              className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-black px-3 py-2 rounded-xl uppercase flex items-center justify-center space-x-1.5 h-10 w-full transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="truncate">POTHOLE FIXED</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenResolutionModal('donation', don)}
                              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold px-3 py-2 rounded-xl uppercase flex items-center justify-center space-x-1.5 h-10 w-full transition cursor-pointer shadow-sm hover:border-amber-400"
                            >
                              <span className="truncate">⏳ REPAIR DISPATCHED</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenResolutionModal('donation', don)}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-md h-10 w-full"
                          >
                            <Camera className="w-4 h-4 shrink-0" />
                            <span className="truncate">{don.isFixed ? 'Edit Fixed Photo' : 'Mark Fixed & Upload Photo'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {don.message && (
                      <p className="text-xs text-slate-300 italic bg-[#0A0B0D] p-2.5 rounded-xl border border-slate-800">
                        "{don.message}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Clean / Purge Wall Modal */}
          {isCleanWallModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
              <div className="bg-[#0F1115] border border-amber-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Eraser className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white">Clean Community Wall of Heroes</h3>
                      <p className="text-[11px] text-slate-400">Select how you would like to clear or clean the ledger</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCleanWallModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Select Cleaning Operation:
                  </label>

                  {/* Option: Clear All */}
                  <label
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      cleanActionType === 'clear_all'
                        ? 'bg-rose-500/10 border-rose-500/60 ring-1 ring-rose-500'
                        : 'bg-[#0A0B0D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cleanAction"
                      value="clear_all"
                      checked={cleanActionType === 'clear_all'}
                      onChange={() => setCleanActionType('clear_all')}
                      className="mt-1 accent-rose-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">🗑️ Clear Entire Wall (Purge All Entries)</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Completely removes all {displayDonations.length} hero donations & contributions. Resets wall to empty state.
                      </span>
                    </div>
                  </label>

                  {/* Option: Clean Test Entries */}
                  <label
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      cleanActionType === 'clear_test'
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500'
                        : 'bg-[#0A0B0D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cleanAction"
                      value="clear_test"
                      checked={cleanActionType === 'clear_test'}
                      onChange={() => setCleanActionType('clear_test')}
                      className="mt-1 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">🧪 Clean Test & Sample Entries</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Scans and removes placeholder or test entries containing demo names while keeping genuine donor records.
                      </span>
                    </div>
                  </label>

                  {/* Option: Clear Coffee Only */}
                  <label
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      cleanActionType === 'coffee_only'
                        ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500'
                        : 'bg-[#0A0B0D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cleanAction"
                      value="coffee_only"
                      checked={cleanActionType === 'coffee_only'}
                      onChange={() => setCleanActionType('coffee_only')}
                      className="mt-1 accent-amber-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">☕ Clear Coffee & Tip Records Only</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Clears small coffee tips while preserving all Pothole Sponsorships and Fuel ledger entries.
                      </span>
                    </div>
                  </label>

                  {/* Option: Clear Resolved Potholes */}
                  <label
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      cleanActionType === 'fixed_potholes_only'
                        ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500'
                        : 'bg-[#0A0B0D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cleanAction"
                      value="fixed_potholes_only"
                      checked={cleanActionType === 'fixed_potholes_only'}
                      onChange={() => setCleanActionType('fixed_potholes_only')}
                      className="mt-1 accent-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">🔨 Clear Completed/Fixed Potholes</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Removes only pothole entries whose repairs have already been fixed and verified by admin.
                      </span>
                    </div>
                  </label>

                  {/* Option: Reset to Default Showcase */}
                  <label
                    className={`flex items-start space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                      cleanActionType === 'reset_defaults'
                        ? 'bg-blue-500/10 border-blue-500/60 ring-1 ring-blue-500'
                        : 'bg-[#0A0B0D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cleanAction"
                      value="reset_defaults"
                      checked={cleanActionType === 'reset_defaults'}
                      onChange={() => setCleanActionType('reset_defaults')}
                      className="mt-1 accent-blue-500"
                    />
                    <div>
                      <span className="text-xs font-black text-white block">🔄 Reset to Clean Showcase Entries</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Resets the Wall of Heroes back to initial default showcase records.
                      </span>
                    </div>
                  </label>
                </div>

                {cleanActionType === 'clear_all' && (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-3.5 space-y-2">
                    <span className="text-xs font-bold text-rose-300 flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Purge Confirmation Required</span>
                    </span>
                    <p className="text-[11px] text-rose-200/80">
                      To prevent accidental clearing, please type <strong className="text-white">CLEAR</strong> below:
                    </p>
                    <input
                      type="text"
                      placeholder="Type CLEAR to confirm"
                      value={cleanConfirmText}
                      onChange={(e) => setCleanConfirmText(e.target.value)}
                      className="w-full bg-[#0A0B0D] border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-rose-400 font-mono tracking-widest"
                    />
                  </div>
                )}

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCleanWallModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isCleaningWall || (cleanActionType === 'clear_all' && cleanConfirmText.trim().toUpperCase() !== 'CLEAR')}
                    onClick={handleCleanWallAction}
                    className={`flex-1 py-3 font-black uppercase tracking-wider rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      cleanActionType === 'clear_all'
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isCleaningWall ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Cleaning Wall...</span>
                      </>
                    ) : (
                      <>
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Execute Cleaning</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Single Entry Confirmation Modal */}
          {donationToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#0F1115] border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Delete Entry From Wall</h3>
                    <p className="text-xs text-slate-400">Confirm permanent removal from Wall of Heroes</p>
                  </div>
                </div>

                <div className="bg-[#0A0B0D] border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Donor Name:</span>
                    <span className="font-bold text-white">{donationToDelete.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-bold text-emerald-400">R{donationToDelete.amount} ZAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Category:</span>
                    <span className="font-bold uppercase text-amber-400">{donationToDelete.category}</span>
                  </div>
                  {donationToDelete.message && (
                    <div className="pt-1 text-[11px] text-slate-400 italic border-t border-slate-800/60">
                      "{donationToDelete.message}"
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  This will remove the entry from the live Community Wall of Heroes and recalculate community totals.
                </p>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDonationToDelete(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isCleaningWall}
                    onClick={handleConfirmDeleteSingle}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isCleaningWall ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Entry</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Broadcasts & Live Dispatches Tab */}
      {activeTab === 'admin_posts' && (
        <AdminPostsManager
          feedItems={feedItems}
          reports={reports}
          currentUser={currentUser}
          adminUserName={adminUser?.name || 'Admin Officer'}
          onRefreshFeed={onRefreshFeed}
          onAddFeedItem={onAddFeedItem}
          onDeleteFeedItem={onDeleteFeedItem}
          onDeleteReport={onDeleteReport || handleDeleteReportItem}
          onEditFeedItem={onEditFeedItem}
          onSwitchTab={onSwitchTab}
        />
      )}

      {/* User Management & Access Control Tab */}
      {activeTab === 'users' && (
        <AdminUserManagement
          currentAdminEmail={adminUser?.email || email}
          onOpenMyPasswordChange={() => setIsChangePasswordModalOpen(true)}
        />
      )}

      {/* Broadcast #Hashtags & Social Rules Tab */}
      {activeTab === 'hashtags' && (
        <AdminHashtagSettings
          currentAdminEmail={adminUser?.email || email}
        />
      )}

      {/* Admin Activity Logging & Interval Stream Tab */}
      {activeTab === 'activity' && (
        <AdminActivityLogging
          adminUserName={adminUser?.name || 'Admin'}
          adminUserRole={adminUser?.role || 'Admin Officer'}
        />
      )}

      {/* Admin Feeds Screen Advertising Tab */}
      {activeTab === 'ads' && (
        <AdminAdSettings
          currentAdminEmail={adminUser?.email || email}
          currentAdminRole={adminUser?.role || 'Admin Officer'}
        />
      )}

      {/* Community Suggestions & Feedback Management Tab */}
      {activeTab === 'feedback' && (
        <AdminFeedbackManagement />
      )}

      {/* Advanced Driving Course (Max 10) Management Tab */}
      {activeTab === 'course' && (
        <AdminDrivingCourseTab adminUserName={adminUser?.name || 'Admin'} />
      )}

      {/* Responder & Partner Directory CRUD Tab */}
      {activeTab === 'responders' && (
        <AdminRespondersTab 
          onNavigateToSOS={() => setActiveTab('sos')} 
          onNavigateToUsers={() => setActiveTab('users')}
        />
      )}

      {/* Live Feed Connections & Telemetry Tab */}
      {activeTab === 'connections' && (
        <AdminFeedConnectionsTab />
      )}

      {/* Response Statistics, Performance & Turnaround Graphs Tab */}
      {activeTab === 'analytics' && (
        <AdminAnalyticsDashboard
          reports={reports}
          sosRequests={sosRequests}
          donations={donations}
          onNavigateToSOS={() => setActiveTab('sos')}
          onNavigateToReports={() => setActiveTab('approved')}
        />
      )}

      {/* Incident Category Default Photos Manager Tab */}
      {activeTab === 'category_photos' && (
        <AdminCategoryPhotosTab
          currentAdminEmail={adminUser?.email || currentUser?.email || 'charlesodendaal43@gmail.com'}
          currentAdminRole={adminUser?.role || currentUser?.role || 'admin'}
        />
      )}

      {/* Emergency Push Notifications & Background Dispatch Tab */}
      {activeTab === 'push' && (
        <AdminPushNotificationsTab
          currentUser={
            adminUser
              ? {
                  email: adminUser.email,
                  role: adminUser.role || 'admin',
                  fullName: adminUser.name
                }
              : undefined
          }
        />
      )}

      {/* System Changelog & Deployment Manifest Tab (Admin Only) */}
      {activeTab === 'release_notes' && (
        <AdminReleaseNotesTab
          adminUserName={adminUser?.name || 'Admin Officer'}
          adminUserRole={adminUser?.role || 'System Administrator'}
          onOpenReleaseModal={() => setIsReleaseModalOpen(true)}
          onRefreshFeed={onRefreshFeed}
        />
      )}

      {/* Pop-out Release Notes Modal for Admin View */}
      <ReleaseNotesModal
        isOpen={isReleaseModalOpen}
        onClose={() => setIsReleaseModalOpen(false)}
      />

      {/* Change Password Modal for Authenticated Admins */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        userEmail={adminUser?.email || email}
        userName={adminUser?.name}
      />

      {/* Dedicated SOS Dispatch & Responder Management Modal */}
      {editingSOS && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pb-24 sm:pb-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
          <div className="bg-[#0F1115] border-2 border-red-500/80 rounded-3xl w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-amber-600 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-black/30 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    Assign Responder & Admin Notes
                  </h3>
                  <p className="text-[11px] font-mono text-amber-200 font-bold">
                    Ref: #{sosModalCallRef || editingSOS.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSOS(null)}
                className="text-white hover:bg-black/20 p-1.5 rounded-xl transition font-extrabold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0 text-xs">
              {/* Motorist Summary Card */}
              <div className="bg-[#0A0B0D] p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider">Distressed Motorist Details</span>
                  <span className="text-[10px] text-slate-500 font-mono">Logged: {formatReadableDateTime(editingSOS.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
                  <span className="font-extrabold text-white text-sm">{editingSOS.name}</span>
                  <span className="text-red-300 font-mono font-bold">📞 {editingSOS.phone}</span>
                  <span className="text-slate-400 font-semibold">• 🚗 {editingSOS.vehicleInfo}</span>
                </div>
                <p className="text-slate-300 text-[11px] pt-1">
                  📍 <span className="font-semibold">{editingSOS.locationName}</span>
                </p>
                {editingSOS.notes && (
                  <p className="text-slate-400 text-[11px] italic pt-1 border-t border-slate-800/80">
                    "{editingSOS.notes}"
                  </p>
                )}
              </div>

              {/* Response Timing Metrics Widget */}
              {(() => {
                const modalTiming = getSOSTimingBreakdown({
                  ...editingSOS,
                  status: sosModalStatus,
                  dispatchedAt: sosModalStatus !== 'active' ? (editingSOS.dispatchedAt || new Date().toISOString()) : undefined
                });

                return (
                  <div className="bg-[#0A0B0D] p-3 rounded-2xl border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Incident Response & Duration Metrics</span>
                      </span>
                      <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                        {modalTiming.totalDurationText} Total
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-sans">1. Call Placed</span>
                        <span className="text-slate-200 font-bold">{formatSATime(editingSOS.createdAt)}</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-400 block font-sans">2. Dispatch Latency</span>
                        <span className="text-amber-300 font-bold">{modalTiming.dispatchLatencyText || 'Instant'}</span>
                      </div>
                      <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                        <span className="text-[9px] text-slate-400 block font-sans">3. Current Status</span>
                        <span className={`font-bold ${sosModalStatus === 'resolved' ? 'text-emerald-300' : sosModalStatus === 'dispatched' ? 'text-amber-300' : 'text-red-400'}`}>
                          {sosModalStatus.toUpperCase()} ({modalTiming.onSceneDurationText})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Dynamic Select Responder / Partner Dropdown with CRUD Manager */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>Select Responder / Partner:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSOS(null);
                      setActiveTab('responders');
                      loadResponderPartners();
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>⚙️ Manage / CRUD Partners ({responderPartners.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={
                      responderPartners.find(
                        (p) =>
                          p.name === sosModalResponderName &&
                          (p.callsign === sosModalResponderCallsign || !sosModalResponderCallsign)
                      )?.id || (sosModalResponderName ? 'custom' : '')
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      if (val === 'custom') return;
                      const found = responderPartners.find((p) => p.id === val);
                      if (found) {
                        setSosModalResponderName(found.name);
                        setSosModalResponderType(found.type);
                        setSosModalResponderCallsign(found.callsign);
                        setSosModalResponderPhone(found.phone);
                        if (sosModalStatus === 'active') {
                          setSosModalStatus('dispatched');
                        }
                      }
                    }}
                    className="w-full bg-[#0A0B0D] border-2 border-amber-500/60 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer shadow-lg shadow-amber-950/20"
                  >
                    <option value="" disabled>
                      -- ⚡ Select Responder / Partner ({responderPartners.filter((p) => p.isActive !== false).length} Active) --
                    </option>

                    <optgroup label="🚓 LiveTraffic Patrol Units">
                      {responderPartners
                        .filter((p) => p.type === 'patrol_officer' && p.isActive !== false)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label || `🚓 ${p.name} (${p.callsign})`} {p.phone ? `• ${p.phone}` : ''}
                          </option>
                        ))}
                    </optgroup>

                    <optgroup label="🤝 Roadside Partners & Heavy Recovery">
                      {responderPartners
                        .filter(
                          (p) => (p.type === 'partner_responder' || p.type === 'towing_recovery') && p.isActive !== false
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label || `🤝 ${p.name} (${p.callsign})`} {p.phone ? `• ${p.phone}` : ''}
                          </option>
                        ))}
                    </optgroup>

                    <optgroup label="🚔 SAPS, Metro & Medical EMS Units">
                      {responderPartners
                        .filter(
                          (p) =>
                            (p.type === 'saps_police' ||
                              p.type === 'metro_police' ||
                              p.type === 'medical_ems' ||
                              p.type === 'community_responder' ||
                              p.type === 'other') &&
                            p.isActive !== false
                        )
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label || `🛡️ ${p.name} (${p.callsign})`} {p.phone ? `• ${p.phone}` : ''}
                          </option>
                        ))}
                    </optgroup>

                    <option value="custom">✏️ Custom / Other Manual Responder Entry...</option>
                  </select>
                </div>

                {/* Selected Unit Snapshot Pill */}
                {sosModalResponderName && (
                  <div className="bg-[#05080E] p-2.5 rounded-xl border border-amber-500/30 flex items-center justify-between text-[11px] mt-1">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-amber-400 font-bold">Selected:</span>
                      <span className="text-white font-black truncate">{sosModalResponderName}</span>
                      {sosModalResponderCallsign && (
                        <span className="text-amber-300 font-mono font-semibold">({sosModalResponderCallsign})</span>
                      )}
                    </div>
                    {sosModalResponderPhone && (
                      <a
                        href={`tel:${sosModalResponderPhone.replace(/\s+/g, '')}`}
                        className="text-amber-300 hover:underline font-mono font-bold flex items-center space-x-1 shrink-0 ml-2"
                      >
                        <span>📞 {sosModalResponderPhone}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Responding Name */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    🛡️ Responding Officer / Patroller Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Officer J. Botha or AutoCheck Rescue"
                    value={sosModalResponderName}
                    onChange={(e) => setSosModalResponderName(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Responder Type */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    🏷️ Responder Unit Type
                  </label>
                  <select
                    value={sosModalResponderType}
                    onChange={(e) => setSosModalResponderType(e.target.value as EmergencySOS['responderType'])}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="patrol_officer">🚓 LiveTraffic Patrol Unit</option>
                    <option value="partner_responder">🤝 Partner Roadside Responder</option>
                    <option value="saps_police">🚔 SAPS Police / Flying Squad</option>
                    <option value="metro_police">🚓 Metro Police (TMPD / JMPD)</option>
                    <option value="medical_ems">🚑 Medical EMS / Paramedic</option>
                    <option value="towing_recovery">🛻 Heavy Recovery & Towing</option>
                    <option value="community_responder">👥 CPF / Community Watch</option>
                    <option value="other">🛡️ Other Responding Unit</option>
                  </select>
                </div>

                {/* Callsign */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    📻 Callsign / Vehicle ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patrol Unit Bravo-1"
                    value={sosModalResponderCallsign}
                    onChange={(e) => setSosModalResponderCallsign(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phone / Radio */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    📞 Direct Radio / Cell Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +27 82 555 1290"
                    value={sosModalResponderPhone}
                    onChange={(e) => setSosModalResponderPhone(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Call Reference Number */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    #️⃣ Official Call Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SOS-2608-4821"
                    value={sosModalCallRef}
                    onChange={(e) => setSosModalCallRef(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    🚦 SOS Dispatch Status
                  </label>
                  <select
                    value={sosModalStatus}
                    onChange={(e) => setSosModalStatus(e.target.value as EmergencySOS['status'])}
                    className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="active">🔴 Active (Waiting Patrol)</option>
                    <option value="dispatched">🟡 Patrol Dispatched / En-Route</option>
                    <option value="resolved">🟢 Resolved & Secured</option>
                    <option value="cancelled">⚪ Cancelled</option>
                  </select>
                </div>
              </div>

              {/* SOS Admin Notes & Dispatch Log Textarea */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>SOS Admin Dispatch Notes & SITREP Log</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Record tactical dispatch updates (e.g. Lead Tactical Officer Botha dispatched via N1 South. Vehicle escorted to Shell Pumulani safely)..."
                  value={sosModalAdminNotes}
                  onChange={(e) => setSosModalAdminNotes(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-[#0F1115] shrink-0">
              <button
                type="button"
                onClick={() => setEditingSOS(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSOSDetails}
                disabled={isSavingSOSDetails}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-red-950/80 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{isSavingSOSDetails ? 'Saving...' : 'Save & Update Dispatch Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolution & Fixed Pothole / Assistance Proof Modal */}
      {resolutionTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pb-24 sm:pb-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden">
          <div className="bg-[#0F1115] border-2 border-amber-500/80 rounded-3xl w-full max-w-lg max-h-[78vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
            {/* Header */}
            <div className="bg-amber-500 p-4 text-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-slate-950" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider">
                  {resolutionTarget.type === 'donation'
                    ? 'Mark Sponsored Pothole Fixed'
                    : resolutionTarget.type === 'sos'
                    ? 'Resolve Emergency SOS Request'
                    : 'Mark Hazard / Pothole Resolved'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolutionTarget(null)}
                className="text-slate-950 hover:bg-amber-600/20 p-1 rounded-lg transition font-extrabold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Context Summary */}
              <div className="bg-[#0A0B0D] p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Target Item Details:</span>
                  {resolutionTarget.type === 'sos' && (
                    <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                      Ref: #{((resolutionTarget.item as EmergencySOS).callRef) || resolutionTarget.item.id}
                    </span>
                  )}
                </div>
                <p className="font-bold text-white text-sm">
                  {resolutionTarget.type === 'donation'
                    ? `Pothole Sponsor: ${(resolutionTarget.item as Donation).donorName}`
                    : resolutionTarget.type === 'sos'
                    ? `Emergency SOS: ${(resolutionTarget.item as EmergencySOS).name} (${(resolutionTarget.item as EmergencySOS).vehicleInfo})`
                    : (resolutionTarget.item as IncidentReport).title}
                </p>
                <p className="text-slate-400">
                  📍 {resolutionTarget.type === 'donation'
                    ? ((resolutionTarget.item as Donation).potholeLocation || 'Corridor Hotspot')
                    : resolutionTarget.item.locationName}
                </p>
                {resolutionTarget.type === 'sos' && (resolutionTarget.item as EmergencySOS).responderName && (
                  <p className="text-xs text-amber-300 font-medium pt-0.5">
                    🛡️ Responding Unit: <span className="font-bold text-white">{(resolutionTarget.item as EmergencySOS).responderName}</span> {((resolutionTarget.item as EmergencySOS).responderCallsign) ? `(${((resolutionTarget.item as EmergencySOS).responderCallsign)})` : ''}
                  </p>
                )}
                {resolutionTarget.type === 'sos' && (() => {
                  const timing = getSOSTimingBreakdown(resolutionTarget.item as EmergencySOS);
                  return (
                    <div className="bg-slate-950 p-2 rounded-lg border border-amber-500/20 text-[11px] font-mono text-amber-300 flex items-center justify-between mt-1">
                      <span>⏱️ Turnaround Duration: {timing.totalDurationText}</span>
                      <span className="text-slate-400 font-sans text-[10px]">
                        {timing.dispatchLatencyText ? `Dispatch: ${timing.dispatchLatencyText} • On-Scene: ${timing.onSceneDurationText}` : `Logged ${getTimeAgo((resolutionTarget.item as EmergencySOS).createdAt)}`}
                      </span>
                    </div>
                  );
                })()}
                {resolutionTarget.type === 'report' && (() => {
                  const reportTiming = getReportResolutionTiming(resolutionTarget.item as IncidentReport);
                  return (
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between mt-1">
                      <span>⏱️ Time Elapsed Since Report: {reportTiming.durationText}</span>
                      <span className="text-slate-400 font-sans text-[10px]">
                        Submitted {getTimeAgo((resolutionTarget.item as IncidentReport).createdAt)}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Status Selector for Donations */}
              {resolutionTarget.type === 'donation' && (
                <div className="space-y-1.5 bg-[#0A0B0D] p-3 rounded-xl border border-slate-800">
                  <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                    Pothole Repair Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setResolutionIsFixed(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border ${
                        !resolutionIsFixed
                          ? 'bg-amber-500/30 text-amber-300 border-amber-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span>⏳ Repair Dispatched</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResolutionIsFixed(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 cursor-pointer border ${
                        resolutionIsFixed
                          ? 'bg-emerald-500/30 text-emerald-400 border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>✅ Pothole Fixed</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Fixed Photo Section */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>📷 Fixed Pothole Photo / Assistance Proof</span>
                  <span className="text-[10px] text-slate-400 font-normal">URL or File Upload</span>
                </label>

                <input
                  type="text"
                  placeholder="Paste image URL or choose file below..."
                  value={resolutionPhotoUrl}
                  onChange={(e) => setResolutionPhotoUrl(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center space-x-2 pt-1">
                  <label className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center space-x-1.5 transition">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Upload Local Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleResolutionPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">Select image from camera/gallery</span>
                </div>

                {resolutionPhotoUrl && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border-2 border-emerald-500/60 max-h-48">
                    <img
                      src={resolutionPhotoUrl}
                      alt="Fixed Photo Preview"
                      className="w-full h-40 object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/50 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Resolution Proof Photo Attached</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Feedback / Resolution Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  💬 Resolution Feedback & Patrol Comment
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the repair completed or assistance rendered..."
                  value={resolutionNotesText}
                  onChange={(e) => setResolutionNotesText(e.target.value)}
                  className="w-full bg-[#0A0B0D] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-800 bg-[#0F1115] shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setResolutionTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmResolutionSubmit}
                  disabled={isSubmittingResolution}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/80 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>{isSubmittingResolution ? 'Saving...' : 'Save & Publish Resolution Proof'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Confirmation Modal for Clearing Live Approved Reports */}
      {showClearLiveReportsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border-2 border-rose-500/50 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left space-y-4 animate-scaleUp text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    Clear Live Approved Reports
                  </h3>
                  <p className="text-xs text-rose-400 font-mono font-bold">
                    Targeting {approvedReports.length} active live map hazard pin(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowClearLiveReportsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Choose how you want to clear the <strong className="text-white">{approvedReports.length} live approved report(s)</strong> from the public map and community broadcast feeds:
              </p>

              {/* Action Selection Radio */}
              <div className="space-y-2 pt-1">
                <label
                  onClick={() => setClearLiveReportsAction('delete_all')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    clearLiveReportsAction === 'delete_all'
                      ? 'bg-rose-950/40 border-rose-500/70 text-white shadow-inner'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearAction"
                    checked={clearLiveReportsAction === 'delete_all'}
                    onChange={() => setClearLiveReportsAction('delete_all')}
                    className="mt-0.5 accent-rose-500 cursor-pointer"
                  />
                  <div>
                    <p className="font-bold text-xs text-rose-200">
                      Delete & Remove Completely (Immediate Clean Map)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      Permanently wipes and unpublishes all active hazard pins from the public map and live broadcast feed.
                    </p>
                  </div>
                </label>

                <label
                  onClick={() => setClearLiveReportsAction('resolve_all')}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    clearLiveReportsAction === 'resolve_all'
                      ? 'bg-emerald-950/40 border-emerald-500/70 text-white shadow-inner'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearAction"
                    checked={clearLiveReportsAction === 'resolve_all'}
                    onChange={() => setClearLiveReportsAction('resolve_all')}
                    className="mt-0.5 accent-emerald-500 cursor-pointer"
                  />
                  <div>
                    <p className="font-bold text-xs text-emerald-200">
                      Mark All as Resolved & Archive (Retain History)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-normal">
                      Changes status to <span className="font-mono text-emerald-400">Resolved</span>, stamps your admin audit credentials, and archives them from the active public hazard layer.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={isClearingLiveReports}
                onClick={() => setShowClearLiveReportsModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingLiveReports || approvedReports.length === 0}
                onClick={handleClearAllLiveReports}
                className={`px-5 py-2.5 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center space-x-1.5 ${
                  clearLiveReportsAction === 'delete_all'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                }`}
              >
                {isClearingLiveReports ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>
                      {clearLiveReportsAction === 'delete_all'
                        ? `Yes, Delete All Live (${approvedReports.length})`
                        : `Yes, Resolve All (${approvedReports.length})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Map */}
      {showClearMapConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border-2 border-red-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Clear All Map Hazards?</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                This will resolve and remove all active road hazards, spike trap warnings, and emergency SOS alerts currently displayed on the live public map.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearMapConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingMap}
                onClick={async () => {
                  setIsClearingMap(true);
                  if (onClearAllMapHazards) {
                    await onClearAllMapHazards();
                  }
                  setIsClearingMap(false);
                  setShowClearMapConfirm(false);
                  setClearSuccessMsg('All live map hazards and emergency SOS requests cleared!');
                  setTimeout(() => setClearSuccessMsg(null), 4000);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg transition cursor-pointer flex items-center space-x-1.5"
              >
                {isClearingMap ? (
                  <span>Clearing...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Clear Map</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Incident Report Modal (Fix typos, locations, details) */}
      {editingReportState && (
        <EditIncidentModal
          report={editingReportState.report}
          isOpen={Boolean(editingReportState)}
          onClose={() => setEditingReportState(null)}
          onSave={async (id, fields, alsoApprove) => {
            await handleEditReportSave(id, fields, alsoApprove);
            setEditingReportState(null);
          }}
          isPending={editingReportState.isPending}
        />
      )}

      {/* Insurance & Partner SOS Ingestion API Modal */}
      <AdminPartnerAPIModal
        isOpen={isPartnerApiModalOpen}
        onClose={() => setIsPartnerApiModalOpen(false)}
        onSOSCreated={async () => {
          if (onRefreshFeed) await onRefreshFeed();
        }}
      />
    </div>
  );
};
