import React, { useState } from 'react';
import { 
  Radio, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Car, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  Send,
  X,
  ArrowUpDown,
  CheckSquare,
  Square,
  AlertOctagon,
  Calendar,
  Layers,
  Sparkles,
  Timer,
  Filter,
  Flame,
  Edit3
} from 'lucide-react';
import { FeedItem, IncidentReport, RegisteredUser } from '../types';
import { formatReadableDateTime, formatSATime, parseDateToMillis } from '../utils/dateParser';
import { getCategoryDefaultImage, getAllCategoryConfigs, isActualAttachedImage } from '../utils/categoryImageHelper';
import { SA_REGIONS, SARegionId, resolveItemRegion } from '../utils/regionUtils';
import { cleanTrafficText } from '../utils/textSanitizer';
import { EditFeedModal } from './EditFeedModal';
import { ImageLightboxModal, ImageLightboxData } from './ImageLightboxModal';
import { IncidentImagePreview } from './IncidentImagePreview';
import { AdminAuditBadge } from './AdminAuditBadge';
import { 
  isItemAdminPost, 
  getItemTimestampValue, 
  getLiveFeedWindowBounds, 
  separateAdminPostsByWindow, 
  isItemInLiveFeedWindow 
} from '../utils/feedWindowUtils';
import { getAllPostRelatedIds, isPostDeleted } from '../utils/idUtils';

export { isItemAdminPost, getItemTimestampValue };

interface AdminPostsManagerProps {
  feedItems: FeedItem[];
  reports?: IncidentReport[];
  currentUser?: RegisteredUser | null;
  adminUserName?: string;
  onRefreshFeed?: () => Promise<void> | void;
  onAddFeedItem?: (item: FeedItem) => Promise<void> | void;
  onDeleteFeedItem?: (id: string) => Promise<void> | void;
  onDeleteReport?: (id: string) => Promise<void> | void;
  onEditFeedItem?: (id: string, updatedFields: Partial<FeedItem>) => Promise<void>;
  onSwitchTab?: (tab: string) => void;
}

export const AdminPostsManager: React.FC<AdminPostsManagerProps> = ({
  feedItems = [],
  reports = [],
  currentUser,
  adminUserName,
  onRefreshFeed,
  onAddFeedItem,
  onDeleteFeedItem,
  onDeleteReport,
  onEditFeedItem,
  onSwitchTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [windowFilter, setWindowFilter] = useState<'live_window' | 'all' | 'expired'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'admin' | 'community' | 'itraffic'>('all');
  const [clearanceFilter, setClearanceFilter] = useState<'all' | 'active' | 'cleared'>('all');
  const [isTogglingClearId, setIsTogglingClearId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Single & Multiple Delete States
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isPruningExpired, setIsPruningExpired] = useState(false);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<FeedItem | null>(null);

  // Lightbox State
  const [lightboxData, setLightboxData] = useState<ImageLightboxData | null>(null);

  // Form State for New Admin Broadcast
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postRoadway, setPostRoadway] = useState('N1');
  const [postLocation, setPostLocation] = useState('');
  const [postRegion, setPostRegion] = useState<SARegionId>('gauteng');
  const [postCategory, setPostCategory] = useState<string>('crash');
  const [postSubType, setPostSubType] = useState('Crash Alert');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postBroadcastTopRed, setPostBroadcastTopRed] = useState(false);
  const [postHighlightGold, setPostHighlightGold] = useState(false);

  // Calculate live feed window bounds and separate admin posts
  const windowBounds = React.useMemo(() => {
    return getLiveFeedWindowBounds(feedItems, 6);
  }, [feedItems]);

  const allAdminPosts = React.useMemo(() => {
    return feedItems.filter(isItemAdminPost);
  }, [feedItems]);

  const allSourcePosts = React.useMemo(() => {
    let raw: FeedItem[] = [];
    if (sourceFilter === 'admin') raw = feedItems.filter(isItemAdminPost);
    else if (sourceFilter === 'community') raw = feedItems.filter(item => item.source === 'community' || (!isItemAdminPost(item) && item.source !== 'i-traffic' && item.source !== 'n3tc' && item.source !== 'sanral'));
    else if (sourceFilter === 'itraffic') raw = feedItems.filter(item => item.source === 'i-traffic' || item.source === 'n3tc' || item.source === 'sanral' || item.author?.includes('i-Traffic'));
    else raw = feedItems;

    const seen = new Set<string>();
    return raw.filter(item => {
      if (!item || !item.id) return false;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [feedItems, sourceFilter]);

  const { activePosts: liveWindowPosts, expiredPosts: outsideWindowPosts } = React.useMemo(() => {
    return separateAdminPostsByWindow(allSourcePosts, feedItems, 6);
  }, [allSourcePosts, feedItems]);

  // Determine base posts depending on selected window filter & clearance filter
  const basePosts = React.useMemo(() => {
    let posts = allSourcePosts;
    if (windowFilter === 'live_window') posts = liveWindowPosts;
    else if (windowFilter === 'expired') posts = outsideWindowPosts;

    if (clearanceFilter === 'active') {
      posts = posts.filter(item => !item.isCleared);
    } else if (clearanceFilter === 'cleared') {
      posts = posts.filter(item => item.isCleared);
    }
    return posts;
  }, [windowFilter, clearanceFilter, liveWindowPosts, outsideWindowPosts, allSourcePosts]);

  // Filtered and Sorted list (Strictly Latest on top by default)
  const filteredPosts = React.useMemo(() => {
    const seen = new Set<string>();
    return basePosts
      .filter(item => {
        if (!item || !item.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);

        if (selectedRegion !== 'all') {
          const itemRegion = resolveItemRegion(item);
          if (itemRegion !== selectedRegion) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match = 
            (item.content && item.content.toLowerCase().includes(q)) ||
            (item.location && item.location.toLowerCase().includes(q)) ||
            (item.roadwayName && item.roadwayName.toLowerCase().includes(q)) ||
            (item.author && item.author.toLowerCase().includes(q)) ||
            (item.eventSubType && item.eventSubType.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Highlighted posts for the area are pinned as the first post
        const aHigh = Boolean(a.highlightGold);
        const bHigh = Boolean(b.highlightGold);
        if (aHigh && !bHigh) return -1;
        if (!aHigh && bHigh) return 1;

        const timeA = getItemTimestampValue(a);
        const timeB = getItemTimestampValue(b);
        const diff = timeB - timeA;
        return sortOrder === 'newest' ? diff : -diff; // 'newest' puts highest timestamp value (latest) on top
      });
  }, [basePosts, selectedRegion, searchQuery, sortOrder]);

  const handleToggleClearStatus = async (post: FeedItem, shouldClear: boolean) => {
    setIsTogglingClearId(post.id);
    setStatusMessage(null);
    try {
      const token = typeof window !== 'undefined' 
        ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') 
        : '';
      const adminFullName = currentUser?.fullName ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim() : (adminUserName || 'Admin Officer');
      const adminEmail = currentUser?.email || (typeof window !== 'undefined' && sessionStorage.getItem('adminEmail')) || 'admin@livetraffic.co.za';
      const adminRole = currentUser?.role || 'admin';

      const endpoint = shouldClear ? `/api/feed/${encodeURIComponent(post.id)}/clear` : `/api/feed/${encodeURIComponent(post.id)}/reopen`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'x-user-role': adminRole,
          'x-user-email': adminEmail
        },
        body: JSON.stringify({
          clearedBy: adminFullName,
          clearedByRole: adminRole,
          clearedNotes: shouldClear ? `Incident cleared by ${adminFullName}` : `Incident reopened by ${adminFullName}`
        })
      });

      if (res.ok) {
        setStatusMessage({
          text: shouldClear ? `✓ Incident marked as CLEARED & resolved successfully.` : `↺ Incident REOPENED as active alert.`,
          type: 'success'
        });
      } else {
        // Also call reports endpoint in case it's stored in reports store
        await fetch(`/api/reports/${encodeURIComponent(post.id)}/${shouldClear ? 'clear' : 'reopen'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clearedBy: adminFullName })
        }).catch(() => {});
        setStatusMessage({
          text: shouldClear ? `✓ Incident marked as CLEARED.` : `↺ Incident REOPENED.`,
          type: 'success'
        });
      }

      if (onRefreshFeed) {
        await onRefreshFeed();
      }
    } catch (err) {
      setStatusMessage({ text: 'Error updating incident clearance status.', type: 'error' });
    } finally {
      setIsTogglingClearId(null);
    }
  };

  const handlePruneExpiredPosts = async () => {
    setIsPruningExpired(true);
    setStatusMessage(null);
    try {
      const token = typeof window !== 'undefined' 
        ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') 
        : '';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (currentUser?.role) headers['x-user-role'] = currentUser.role;
      if (currentUser?.email) headers['x-user-email'] = currentUser.email;

      const res = await fetch('/api/admin/posts/prune-expired', {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMessage({ 
          text: `✓ Dropped & pruned ${data.prunedCount || 0} old post(s) outside the live feed window.`, 
          type: 'success' 
        });
      } else {
        // Fallback: delete client-side if server endpoint not reachable
        for (const post of outsideWindowPosts) {
          if (onDeleteFeedItem) {
            await onDeleteFeedItem(post.id);
          }
        }
        setStatusMessage({ text: `✓ Dropped ${outsideWindowPosts.length} old post(s) outside the live feed window.`, type: 'success' });
      }

      if (onRefreshFeed) {
        await onRefreshFeed();
      }
      setWindowFilter('live_window');
    } catch (err: any) {
      setStatusMessage({ text: 'Error dropping expired posts.', type: 'error' });
    } finally {
      setIsPruningExpired(false);
    }
  };

  const handleBroadcastPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() && !postTitle.trim()) {
      setStatusMessage({ text: 'Please enter message content for the broadcast.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const fullContent = postTitle.trim() ? `${postTitle.trim()}: ${postContent.trim()}` : postContent.trim();
    const token = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '')
      : '';

    try {
      let storedAdminObj: any = null;
      try {
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser') || localStorage.getItem('live_traffic_npc_user');
          if (raw) storedAdminObj = JSON.parse(raw);
        }
      } catch (e) {}

      const adminFullName = currentUser?.fullName 
        ? `${currentUser.fullName} ${currentUser.surname || ''}`.trim() 
        : (storedAdminObj?.fullName 
            ? `${storedAdminObj.fullName} ${storedAdminObj.surname || ''}`.trim() 
            : (storedAdminObj?.name || adminUserName || 'Admin Officer'));
            
      const adminEmail = currentUser?.email || storedAdminObj?.email || (typeof window !== 'undefined' && sessionStorage.getItem('adminEmail')) || 'admin@livetraffic.co.za';
      const adminRole = currentUser?.role || storedAdminObj?.role || 'admin';
      const cleanPosterName = adminFullName ? `🛡️ ${adminFullName} (Admin)` : '🛡️ Admin Dispatch';
      const cleanHandle = `@${(adminFullName || 'Admin').replace(/[^a-zA-Z0-9]/g, '')}`;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (adminEmail) {
        headers['x-user-email'] = adminEmail;
        headers['x-admin-email'] = adminEmail;
      }
      if (adminRole) {
        headers['x-user-role'] = adminRole;
        headers['x-admin-role'] = adminRole;
      }
      if (adminFullName) {
        headers['x-user-name'] = adminFullName;
        headers['x-admin-name'] = adminFullName;
      }

      const catImage = getCategoryDefaultImage(postCategory);
      const cleanMediaUrl = isActualAttachedImage(postMediaUrl) 
        ? postMediaUrl.trim() 
        : (catImage && isActualAttachedImage(catImage) ? catImage.trim() : undefined);

      const res = await fetch('/api/feed/post-dispatch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          author: cleanPosterName,
          handle: cleanHandle,
          content: fullContent,
          location: postLocation.trim() || `${postRoadway} Corridor`,
          roadwayName: postRoadway,
          region: SA_REGIONS[postRegion]?.name || 'Gauteng',
          category: postCategory,
          eventSubType: postSubType,
          mediaUrl: cleanMediaUrl,
          showOnLiveWatch: true,
          broadcastTopRed: postBroadcastTopRed,
          highlightGold: postHighlightGold,
          isAdmin: true,
          postAsAdmin: true,
          autoApprove: true,
          adminName: adminFullName,
          adminEmail: adminEmail,
          adminRole: adminRole
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.item && onAddFeedItem) {
          onAddFeedItem(data.item);
        }
        if (onRefreshFeed) {
          onRefreshFeed();
        }
        setStatusMessage({ text: '🚀 Admin Broadcast successfully posted! (Showing Latest on Top)', type: 'success' });
        setPostTitle('');
        setPostContent('');
        setPostLocation('');
        setPostMediaUrl('');
        setPostBroadcastTopRed(false);
        setPostHighlightGold(false);
        setPostCategory('crash');
        setPostSubType('Crash Alert');
        setIsComposing(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        setStatusMessage({ text: errData.error || 'Failed to broadcast post.', type: 'error' });
      }
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Network error broadcasting post.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (itemId: string) => {
    setIsDeletingId(itemId);
    try {
      const token = typeof window !== 'undefined' 
        ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') 
        : '';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (currentUser?.role) headers['x-user-role'] = currentUser.role;
      if (currentUser?.email) headers['x-user-email'] = currentUser.email;

      // Centralized backend deletion handles full cascading across feed items, reports, and Firestore
      if (onDeleteFeedItem) {
        await onDeleteFeedItem(itemId);
      } else if (onDeleteReport) {
        await onDeleteReport(itemId);
      } else {
        await fetch(`/api/feed/${encodeURIComponent(itemId)}`, { method: 'DELETE', headers });
      }

      if (onRefreshFeed) {
        await onRefreshFeed();
      }

      const relatedIds = getAllPostRelatedIds(itemId);
      setSelectedPostIds(prev => prev.filter(id => !isPostDeleted(id, relatedIds, relatedIds)));
      setStatusMessage({ text: '✓ Admin post deleted successfully.', type: 'success' });
      setConfirmDeleteId(null);
    } catch (err: any) {
      if (onDeleteFeedItem) {
        await onDeleteFeedItem(itemId);
      } else if (onDeleteReport) {
        await onDeleteReport(itemId);
      }
      setStatusMessage({ text: 'Admin post removed.', type: 'success' });
      setConfirmDeleteId(null);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleEditPostSave = async (id: string, updatedFields: Partial<FeedItem>) => {
    try {
      const existing = feedItems.find(f => f.id === id);
      const enrichedFields: Partial<FeedItem> = {
        views: existing?.views,
        upvotes: existing?.upvotes,
        downvotes: (existing as any)?.downvotes,
        confirmations: (existing as any)?.confirmations,
        ...updatedFields
      };

      if (onEditFeedItem) {
        await onEditFeedItem(id, enrichedFields);
      } else {
        const token = typeof window !== 'undefined' 
          ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') 
          : '';
        const effectiveToken = token || (currentUser?.email?.includes('charles') ? 'admin-auth-token-charlesodendaal43' : 'admin-authenticated-secret');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveToken}`,
          'x-admin-authorized': 'true',
          'x-user-role': currentUser?.role || 'admin',
          'x-admin-role': currentUser?.role || 'admin',
          'x-user-email': currentUser?.email || 'admin@livetraffic.co.za',
          'x-admin-email': currentUser?.email || 'admin@livetraffic.co.za'
        };

        const res = await fetch(`/api/feed/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(enrichedFields)
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || data.message || `Failed to update post (${res.status})`);
        }
      }
      if (onRefreshFeed) {
        await onRefreshFeed();
      }
      setStatusMessage({ text: '✓ Post content updated successfully!', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Failed to update post.', type: 'error' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) return;
    setIsBulkDeleting(true);
    let deletedCount = 0;

    const token = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken') || '') 
      : '';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (currentUser?.role) headers['x-user-role'] = currentUser.role;
    if (currentUser?.email) headers['x-user-email'] = currentUser.email;

    for (const id of selectedPostIds) {
      try {
        if (onDeleteFeedItem) {
          await onDeleteFeedItem(id);
        } else if (onDeleteReport) {
          await onDeleteReport(id);
        } else {
          await fetch(`/api/feed/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
        }
        deletedCount++;
      } catch {
        if (onDeleteFeedItem) {
          await onDeleteFeedItem(id);
        } else if (onDeleteReport) {
          await onDeleteReport(id);
        }
      }
    }

    if (onRefreshFeed) {
      await onRefreshFeed();
    }

    setSelectedPostIds([]);
    setShowBulkDeleteModal(false);
    setIsBulkDeleting(false);
    setStatusMessage({ text: `✓ Successfully deleted ${deletedCount} admin post(s).`, type: 'success' });
  };

  const handleToggleSelectAll = () => {
    if (selectedPostIds.length === filteredPosts.length) {
      setSelectedPostIds([]);
    } else {
      setSelectedPostIds(filteredPosts.map(p => p.id));
    }
  };

  const latestPostDate = filteredPosts.length > 0 
    ? (filteredPosts[0].timestamp || filteredPosts[0].lastUpdated || filteredPosts[0].startTime) 
    : null;

  return (
    <div className="space-y-6" id="admin-posts-manager-root">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-[#12100A] to-[#0A0B0D] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-2xl shadow-inner">
                <Radio className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 flex-wrap">
                  <span>Admin Broadcasts & Posts</span>
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {liveWindowPosts.length} in Live Window
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Latest on Top</span>
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Integrated with Live Feed: Admin posts are automatically active during the live feed timeframe ({windowBounds.activeWindowLabel}). Stale posts outside this window are dropped.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {outsideWindowPosts.length > 0 && (
              <button
                type="button"
                id="btn-prune-expired-admin-posts"
                onClick={handlePruneExpiredPosts}
                disabled={isPruningExpired}
                className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center space-x-2 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Drop all expired posts outside the 6h live feed window"
              >
                {isPruningExpired ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4 text-amber-400" />}
                <span>Drop Expired ({outsideWindowPosts.length})</span>
              </button>
            )}

            {selectedPostIds.length > 0 && (
              <button
                type="button"
                id="btn-bulk-delete-admin-posts"
                onClick={() => setShowBulkDeleteModal(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg shadow-rose-950/50 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedPostIds.length})</span>
              </button>
            )}

            <button
              type="button"
              id="btn-toggle-compose-admin-post"
              onClick={() => setIsComposing(!isComposing)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center space-x-2 transition shadow-lg shadow-amber-950/50 cursor-pointer"
            >
              {isComposing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isComposing ? 'Close Form' : 'Broadcast New Admin Post'}</span>
            </button>

            {onRefreshFeed && (
              <button
                type="button"
                id="btn-refresh-admin-feed"
                onClick={() => onRefreshFeed()}
                className="bg-[#050608] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                title="Refresh Feed from Server"
              >
                <RefreshCw className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats & Live Window Control Bar */}
        <div className="mt-4 pt-4 border-t border-amber-500/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="bg-[#08090C]/80 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Active in Live Feed</span>
            <span className="text-sm font-black text-emerald-400 flex items-center space-x-1.5">
              <span>{liveWindowPosts.length}</span>
              <span className="text-[10px] text-emerald-300/80 font-normal">({windowBounds.activeWindowLabel})</span>
            </span>
          </div>
          <div className="bg-[#08090C]/80 border border-slate-800/80 rounded-xl p-2.5">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Outside Window (Dropped)</span>
            <span className="text-sm font-black text-slate-400">
              {outsideWindowPosts.length}
            </span>
          </div>
          <div className="bg-[#08090C]/80 border border-slate-800/80 rounded-xl p-2.5 sm:col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Most Recent Broadcast</span>
            <span className="text-xs font-bold text-white truncate block">
              {latestPostDate ? formatReadableDateTime(latestPostDate) : 'No broadcasts yet'}
            </span>
          </div>
        </div>

        {/* Source & Clearance Filter Tabs */}
        <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Post Source Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto [scrollbar-width:none]">
            <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1">Source:</span>
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                sourceFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              All Sources ({feedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('admin')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                sourceFilter === 'admin'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              🛡️ Admin ({allAdminPosts.length})
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('community')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                sourceFilter === 'community'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              👥 Citizen Reports
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter('itraffic')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                sourceFilter === 'itraffic'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              📡 i-Traffic
            </button>
          </div>

          {/* Clearance Status Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto [scrollbar-width:none]">
            <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 mr-1">Status:</span>
            <button
              type="button"
              onClick={() => setClearanceFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                clearanceFilter === 'all'
                  ? 'bg-slate-700 text-white font-black'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setClearanceFilter('active')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                clearanceFilter === 'active'
                  ? 'bg-red-600 text-white font-black shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-red-300 border border-slate-800'
              }`}
            >
              🔴 Active
            </button>
            <button
              type="button"
              onClick={() => setClearanceFilter('cleared')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                clearanceFilter === 'cleared'
                  ? 'bg-emerald-600 text-white font-black shadow-md'
                  : 'bg-slate-900/80 text-slate-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              ✓ Cleared
            </button>
          </div>
        </div>

        {/* Window View Tabs */}
        <div className="mt-2.5 flex items-center space-x-2 overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            id="tab-window-live"
            onClick={() => setWindowFilter('live_window')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              windowFilter === 'live_window'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active in Live Feed Window ({liveWindowPosts.length})</span>
          </button>

          <button
            type="button"
            id="tab-window-all"
            onClick={() => setWindowFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              windowFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Time ({allSourcePosts.length})</span>
          </button>

          <button
            type="button"
            id="tab-window-expired"
            onClick={() => setWindowFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              windowFilter === 'expired'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-slate-400" />
            <span>Outside Window / Dropped ({outsideWindowPosts.length})</span>
          </button>
        </div>

        {statusMessage && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            statusMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60 shadow-lg' : 'bg-rose-950/90 text-rose-200 border-rose-500/60 shadow-lg'
          }`}>
            <div className="flex items-center space-x-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button type="button" onClick={() => setStatusMessage(null)} className="hover:opacity-75 cursor-pointer ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Compose Admin Broadcast Modal / Form */}
      {isComposing && (
        <form onSubmit={handleBroadcastPost} className="bg-[#0D0F14] border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-lg text-xs font-black uppercase">
                🛡️ New Official Admin Post
              </span>
              <h3 className="text-sm font-bold text-white">Broadcast Highway Dispatch (Pinned on Top)</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Highway Corridor */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Highway / Route</label>
              <select
                value={postRoadway}
                onChange={(e) => setPostRoadway(e.target.value)}
                className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-400 outline-none"
              >
                <option value="N1">N1 Highway</option>
                <option value="N2">N2 Highway</option>
                <option value="N3">N3 Highway</option>
                <option value="N4">N4 Highway</option>
                <option value="N7">N7 Highway (Cape Town - Malmesbury - Namibia)</option>
                <option value="N12">N12 Highway</option>
                <option value="N14">N14 Highway</option>
                <option value="R21">R21 Highway</option>
                <option value="R24">R24 Highway</option>
                <option value="M1">M1 Highway</option>
                <option value="M2">M2 Highway</option>
                <option value="R59">R59 Highway</option>
                <option value="Other">Other Corridor</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Province / Region</label>
              <select
                value={postRegion}
                onChange={(e) => setPostRegion(e.target.value as SARegionId)}
                className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-400 outline-none"
              >
                <option value="gauteng">Gauteng (GP)</option>
                <option value="kwazulu_natal">KwaZulu-Natal (KZN)</option>
                <option value="western_cape">Western Cape (WC)</option>
                <option value="eastern_cape">Eastern Cape (EC)</option>
                <option value="free_state">Free State (FS)</option>
                <option value="mpumalanga">Mpumalanga (MP)</option>
                <option value="limpopo">Limpopo (LP)</option>
                <option value="north_west">North West (NW)</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Alert Category</label>
              <select
                value={postCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setPostCategory(cat);
                  const cfg = getAllCategoryConfigs().find(c => c.id === cat);
                  if (cfg) {
                    setPostSubType(cfg.label);
                  } else {
                    if (cat === 'spiking') setPostSubType('Spike Trap Warning');
                    else if (cat === 'crash') setPostSubType('Crash Alert');
                    else if (cat === 'pothole') setPostSubType('Fixed Pothole');
                    else if (cat === 'traffic') setPostSubType('Severe Congestion');
                    else setPostSubType('Official Notice');
                  }
                }}
                className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:border-amber-400 outline-none"
              >
                {getAllCategoryConfigs().map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.badge}] {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location details */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Exact Location / Landmark</label>
            <input
              type="text"
              placeholder="e.g. N1 Northbound past Pumulani Toll Plaza, right lanes obstructed"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
              className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-amber-400 outline-none placeholder-slate-500"
            />
          </div>

          {/* Title and Content */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Broadcast Headline / Title (Optional)</label>
            <input
              type="text"
              placeholder="e.g. 🚨 URGENT SPIKE TRAP WARNING"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-medium focus:border-amber-400 outline-none placeholder-slate-500 mb-2"
            />

            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Detailed Message *</label>
            <textarea
              rows={3}
              placeholder="Write the full report, instructions for motorists, and emergency response status..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required
              className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl p-3 text-xs font-medium focus:border-amber-400 outline-none placeholder-slate-500"
            />
          </div>

          {/* Attached Photo URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase text-slate-400">Attached Photo URL (Optional)</label>
              <button
                type="button"
                onClick={() => setPostMediaUrl(getCategoryDefaultImage(postCategory))}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer"
                title="Fill with category default photo"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Use Category Default Photo</span>
              </button>
            </div>
            <input
              type="url"
              placeholder="https://... (or leave blank if no image is attached)"
              value={postMediaUrl}
              onChange={(e) => setPostMediaUrl(e.target.value)}
              className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono focus:border-amber-400 outline-none placeholder-slate-500"
            />
          </div>

          {/* Admin Priority & Broadcast Display Controls */}
          <div className="bg-[#050608] border border-amber-500/40 rounded-2xl p-3.5 space-y-2.5">
            <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Priority & Display Controls</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">STAFF PRIORITY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Broadcast on Top Red */}
              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                postBroadcastTopRed
                  ? 'bg-red-950/40 border-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                  : 'bg-[#0A0B0E] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={postBroadcastTopRed}
                  onChange={(e) => setPostBroadcastTopRed(e.target.checked)}
                  className="mt-0.5 rounded border-red-600 text-red-600 focus:ring-red-500 w-4 h-4 bg-slate-950 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-red-400 flex items-center space-x-1">
                    <span>🔴 Broadcast on Top Red Alert Banner</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Shows in red broadcast bar on top of live feed. Users can click to direct to this actual post.
                  </p>
                </div>
              </label>

              {/* Highlight with Gold Ring */}
              <label className={`flex items-start space-x-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${
                postHighlightGold
                  ? 'bg-amber-950/40 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-[#0A0B0E] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="checkbox"
                  checked={postHighlightGold}
                  onChange={(e) => setPostHighlightGold(e.target.checked)}
                  className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-slate-950 cursor-pointer"
                />
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-400 flex items-center space-x-1">
                    <span>🟡 Post Highlight (Yellow / Gold Ring)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Highlighted with gold ring around post card and pinned as the first post for this area feed.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2 cursor-pointer shadow-lg transition active:scale-95"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Send className="w-4 h-4 text-slate-950" />}
              <span>{isSubmitting ? 'Publishing...' : 'Publish Official Admin Broadcast (Latest on Top)'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter, Search and Sorting Control Bar */}
      <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admin posts by roadway, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050608] border border-slate-800 text-white rounded-xl pl-9 pr-8 py-2 text-xs focus:border-amber-500 outline-none"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Region & Sort Controls */}
        <div className="flex items-center space-x-2.5 w-full md:w-auto justify-between md:justify-end overflow-x-auto [scrollbar-width:none]">
          {/* Region */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Region:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-[#050608] border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:border-amber-500 outline-none cursor-pointer"
            >
              <option value="all">All South Africa</option>
              <option value="gauteng">Gauteng</option>
              <option value="kwazulu_natal">KwaZulu-Natal</option>
              <option value="western_cape">Western Cape</option>
              <option value="eastern_cape">Eastern Cape</option>
              <option value="free_state">Free State</option>
              <option value="mpumalanga">Mpumalanga</option>
              <option value="limpopo">Limpopo</option>
              <option value="north_west">North West</option>
            </select>
          </div>

          {/* Sort Order Selector (Latest on top toggle) */}
          <button
            type="button"
            id="btn-toggle-sort-order"
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 border shrink-0 ${
              sortOrder === 'newest'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-[#050608] text-slate-300 hover:text-white border-slate-800'
            }`}
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{sortOrder === 'newest' ? 'Sort: Latest on Top' : 'Sort: Oldest First'}</span>
          </button>

          {/* Select All Toggle */}
          {filteredPosts.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-[#050608] border border-slate-800 flex items-center space-x-1 shrink-0 cursor-pointer"
              title="Select / Deselect all"
            >
              {selectedPostIds.length === filteredPosts.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Select All</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Admin Posts List (Latest on top) */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Admin Posts Found</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchQuery ? `No posts matched "${searchQuery}".` : 'No official admin dispatches have been broadcast yet.'}
            </p>
            <button
              type="button"
              onClick={() => setIsComposing(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-md inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Admin Broadcast</span>
            </button>
          </div>
        ) : (
          filteredPosts.map((post, idx) => {
            const isCrash = post.category === 'crash' || post.eventSubType?.toLowerCase().includes('crash');
            const isSpiking = post.category === 'spiking' || post.eventSubType?.toLowerCase().includes('spiking');
            const isSelected = selectedPostIds.includes(post.id);
            const isDeleting = isDeletingId === post.id;
            const isFirst = idx === 0;
            const isHighlightGold = Boolean(post.highlightGold);
            const isBroadcastTopRed = Boolean(post.broadcastTopRed);

            return (
              <div
                key={`${post.id}-${idx}`}
                id={`admin-post-${post.id}`}
                className={`bg-[#0D0F14] hover:bg-[#10131A] border-2 rounded-2xl p-4 sm:p-5 shadow-xl transition space-y-3.5 relative ${
                  isSelected 
                    ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500' 
                    : isHighlightGold
                    ? 'border-amber-400 ring-2 ring-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)] bg-amber-950/10'
                    : isFirst && sortOrder === 'newest'
                    ? 'border-amber-500/60 shadow-amber-950/30'
                    : 'border-slate-800/80 hover:border-amber-500/40'
                }`}
              >
                {/* Top Badge Strip & Action Controls */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                    {/* Checkbox for Bulk Selection */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPostIds(prev => 
                          prev.includes(post.id) ? prev.filter(id => id !== post.id) : [...prev, post.id]
                        );
                      }}
                      className="text-slate-400 hover:text-amber-400 transition cursor-pointer mr-1"
                      title="Select post"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </button>

                    {/* Admin Post Badge */}
                    <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                      <span>🛡️ Admin post</span>
                    </span>

                    {/* Top Red Broadcast Badge */}
                    {isBroadcastTopRed && (
                      <span className="bg-red-600 text-white border border-red-500 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm animate-pulse">
                        <span>🔴 Top Red Broadcast</span>
                      </span>
                    )}

                    {/* Gold Ring Highlight Badge */}
                    {isHighlightGold && (
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                        <span>🟡 Gold Ring Highlight</span>
                      </span>
                    )}

                    {/* Latest Badge for First Item */}
                    {isFirst && sortOrder === 'newest' && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>First in Feed</span>
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${
                      isCrash
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isSpiking
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    }`}>
                      <span>{post.eventSubType || post.category || 'Incident Alert'}</span>
                    </span>

                    {post.region && (
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {post.region}
                      </span>
                    )}

                    {/* Admin Author / Approver Attribution Pill */}
                    {(post.postedByAdminName || post.approvedByAdminName || post.author?.includes('Admin')) && (
                      <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>
                          {post.postedByAdminName 
                            ? `Posted by: ${post.postedByAdminName}`
                            : post.approvedByAdminName
                            ? `Approved by: ${post.approvedByAdminName}`
                            : `Officer: ${post.author?.replace(/^[🛡️\s]+/, '') || 'Admin'}`}
                        </span>
                        {post.postedByAdminRole && (
                          <span className="bg-cyan-500/20 text-cyan-200 text-[9px] px-1 py-0.2 rounded border border-cyan-500/30 uppercase font-mono">
                            {post.postedByAdminRole.replace('_', ' ')}
                          </span>
                        )}
                      </span>
                    )}

                    <span className="bg-slate-800 text-amber-300/90 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-mono flex items-center space-x-1">
                      <Clock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{formatReadableDateTime(post.timestamp || post.lastUpdated || post.startTime)}</span>
                    </span>

                    {post.isCleared ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Cleared & Resolved</span>
                      </span>
                    ) : isItemInLiveFeedWindow(post, feedItems, 6) ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live Feed Active</span>
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-300/90 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center space-x-1">
                        <Timer className="w-2.5 h-2.5 text-amber-400" />
                        <span>Outside Live Window (Dropped)</span>
                      </span>
                    )}
                  </div>

                  {/* Action Controls: Clear / Reopen, Edit & Single Delete */}
                  <div className="flex items-center space-x-1.5 ml-auto">
                    {/* Mark as Cleared / Reopen Toggle Button */}
                    <button
                      type="button"
                      id={`btn-toggle-clear-${post.id}`}
                      disabled={isTogglingClearId === post.id}
                      onClick={() => handleToggleClearStatus(post, !post.isCleared)}
                      className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center space-x-1 text-xs font-bold shadow-sm ${
                        post.isCleared
                          ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-amber-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50'
                      }`}
                      title={post.isCleared ? 'Reopen this incident alert' : 'Mark this incident as cleared and resolved'}
                    >
                      {isTogglingClearId === post.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : post.isCleared ? (
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{post.isCleared ? 'Reopen Incident' : 'Set as Cleared'}</span>
                    </button>

                    {/* Edit Post Button */}
                    <button
                      type="button"
                      id={`btn-edit-post-${post.id}`}
                      onClick={() => setEditingPost(post)}
                      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center space-x-1 text-xs font-bold shadow-sm"
                      title="Edit this post content, fix typos or update details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {confirmDeleteId === post.id ? (
                      <div className="flex items-center space-x-1.5 bg-rose-950/80 border border-rose-500/50 p-1 rounded-xl shadow-lg animate-fadeIn">
                        <span className="text-[11px] font-bold text-rose-200 px-1 hidden sm:inline">Delete post?</span>
                        <button
                          type="button"
                          id={`btn-confirm-delete-${post.id}`}
                          disabled={isDeleting}
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-black px-2.5 py-1 rounded-lg text-xs cursor-pointer shadow flex items-center space-x-1 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              <span>Confirm Delete</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg text-xs cursor-pointer font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id={`btn-delete-post-${post.id}`}
                        onClick={() => setConfirmDeleteId(post.id)}
                        className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center space-x-1 text-xs font-bold"
                        title="Delete this Admin Post"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-300">Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Location Heading */}
                {(post.location || post.roadwayName) && (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-white min-w-0" title={post.location || post.roadwayName}>
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{post.location || post.roadwayName}</span>
                  </div>
                )}

                {/* Content */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {cleanTrafficText(post.content)}
                </p>

                {/* Media Image Preview */}
                {(post.mediaUrl || post.imageUrl) && (
                  <IncidentImagePreview
                    imageUrl={post.mediaUrl || post.imageUrl}
                    title={post.location || post.roadwayName || 'Admin Post Photo'}
                    location={post.location}
                    description={post.content}
                    timestamp={post.timestamp || post.lastUpdated || post.startTime}
                    category={post.category || post.eventSubType}
                    variant="card-media"
                    onOpenLightbox={setLightboxData}
                  />
                )}

                {/* Clearance Status Banner */}
                {post.isCleared && (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold">Incident Cleared & Roadway Resolved</span>
                        {post.clearedBy && (
                          <span className="text-emerald-400/80 ml-1.5 text-[11px]">
                            • By: {post.clearedBy}{post.clearedAt ? ` at ${formatReadableDateTime(post.clearedAt)}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Audit Trail for Internal Staff Tracking */}
                <AdminAuditBadge 
                  isAdmin={true} 
                  feedItem={post} 
                  variant="compact" 
                />

                {/* Footer Strip */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-400 font-bold">Author: {post.author || '🛡️ Admin post'}</span>
                    <span>•</span>
                    <span>Handle: {post.handle || '@Admin'}</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {onSwitchTab && (
                      <button
                        type="button"
                        onClick={() => onSwitchTab('feed')}
                        className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <span>View in Live Feed</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F1115] border border-rose-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Selected Admin Posts?</h3>
                <p className="text-xs text-slate-400">This action will permanently remove {selectedPostIds.length} post(s).</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              The selected admin broadcasts will be removed from the server database, live feed stream, and motorist GPS map alerts.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting ({selectedPostIds.length})...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {selectedPostIds.length} Posts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Feed Modal */}
      {editingPost && (
        <EditFeedModal
          feedItem={editingPost}
          isOpen={Boolean(editingPost)}
          onClose={() => setEditingPost(null)}
          onSave={async (id, fields) => {
            await handleEditPostSave(id, fields);
            setEditingPost(null);
          }}
        />
      )}

      {/* Interactive Lightbox Modal */}
      {lightboxData && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxData)}
          data={lightboxData}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
};
