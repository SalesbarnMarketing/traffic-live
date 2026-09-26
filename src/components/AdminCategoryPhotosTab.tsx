import React, { useState, useEffect, useRef } from 'react';
import { IncidentCategoryConfig } from '../types';
import {
  getAllCategoryConfigs,
  fetchCategoryDefaultImages,
  saveCategoryDefaultImage,
  resetCategoryDefaultImage,
  resetAllCategoryDefaultImages,
  clearAllCategoryBanners,
  subscribeCategoryImages,
  createCustomCategory,
  deleteCustomCategory,
  DEFAULT_CATEGORY_CONFIGS
} from '../utils/categoryImageHelper';
import {
  Camera,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  X,
  Sliders,
  Image as ImageIcon,
  Flame,
  Car,
  AlertOctagon,
  Wrench,
  Construction,
  Megaphone,
  Octagon,
  ShieldAlert,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  CloudRain,
  Waves,
  Siren,
  Zap,
  Wind,
  Truck,
  Layers,
  Check,
  Tag,
  FileText
} from 'lucide-react';

interface AdminCategoryPhotosTabProps {
  currentAdminEmail?: string;
  currentAdminRole?: string;
}

// Available icons for category creation/editing
const AVAILABLE_ICONS = [
  { name: 'AlertTriangle', label: 'Warning / Hazard', icon: AlertTriangle, color: 'text-amber-400' },
  { name: 'AlertOctagon', label: 'Spiking / Critical', icon: AlertOctagon, color: 'text-rose-400' },
  { name: 'Flame', label: 'Fire / Smoke', icon: Flame, color: 'text-rose-500' },
  { name: 'Car', label: 'Traffic / Vehicle', icon: Car, color: 'text-cyan-400' },
  { name: 'Construction', label: 'Pothole / Roadworks', icon: Construction, color: 'text-amber-500' },
  { name: 'Wrench', label: 'Maintenance', icon: Wrench, color: 'text-yellow-400' },
  { name: 'ShieldCheck', label: 'Police / Checkpoint', icon: ShieldCheck, color: 'text-emerald-400' },
  { name: 'ShieldAlert', label: 'Stationary / High Risk', icon: ShieldAlert, color: 'text-orange-400' },
  { name: 'Octagon', label: 'Traffic Lights', icon: Octagon, color: 'text-indigo-400' },
  { name: 'Megaphone', label: 'Patrol / Notice', icon: Megaphone, color: 'text-cyan-300' },
  { name: 'Siren', label: 'Emergency / SOS', icon: Siren, color: 'text-red-400' },
  { name: 'CloudRain', label: 'Storm / Rain / Hail', icon: CloudRain, color: 'text-sky-400' },
  { name: 'Waves', label: 'Flooding / River', icon: Waves, color: 'text-blue-400' },
  { name: 'Wind', label: 'Gale / Visibility', icon: Wind, color: 'text-teal-400' },
  { name: 'Zap', label: 'Power / Loadshedding', icon: Zap, color: 'text-yellow-400' },
  { name: 'Truck', label: 'Heavy Transport', icon: Truck, color: 'text-amber-300' }
];

export const AdminCategoryPhotosTab: React.FC<AdminCategoryPhotosTabProps> = ({
  currentAdminEmail = 'Admin Officer',
  currentAdminRole = 'admin'
}) => {
  const SUPER_ADMIN_EMAIL = 'charlesodendaal43@gmail.com';
  const isSuperAdminCharles =
    (currentAdminEmail || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();

  const [categories, setCategories] = useState<IncidentCategoryConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-banner' | 'no-banner' | 'custom'>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Edit URL modal
  const [editingUrlCategory, setEditingUrlCategory] = useState<IncidentCategoryConfig | null>(null);
  const [inputUrl, setInputUrl] = useState('');

  // Image zoom preview modal
  const [zoomCategory, setZoomCategory] = useState<IncidentCategoryConfig | null>(null);

  // Create New Category Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newId, setNewId] = useState('');
  const [newBadge, setNewBadge] = useState('HAZARD');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIconName, setNewIconName] = useState('AlertTriangle');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Edit Category Details Modal state
  const [editingDetailsCategory, setEditingDetailsCategory] = useState<IncidentCategoryConfig | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editIconName, setEditIconName] = useState('AlertTriangle');
  const [editBannerUrl, setEditBannerUrl] = useState('');

  // Delete Category confirmation modal
  const [deletingCategory, setDeletingCategory] = useState<IncidentCategoryConfig | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear All Category Banners Modal state
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Camera capture modal state
  const [cameraCategory, setCameraCategory] = useState<IncidentCategoryConfig | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturingForNewCategory, setIsCapturingForNewCategory] = useState(false);
  const [isCapturingForEditCategory, setIsCapturingForEditCategory] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File input refs map
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const newCatFileInputRef = useRef<HTMLInputElement | null>(null);
  const editCatFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    setIsLoadingAll(true);
    try {
      await fetchCategoryDefaultImages();
      setCategories(getAllCategoryConfigs());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAll(false);
    }
  };

  useEffect(() => {
    setCategories(getAllCategoryConfigs());
    loadData();

    const unsubscribe = subscribeCategoryImages(() => {
      setCategories(getAllCategoryConfigs());
    });

    return () => {
      unsubscribe();
      stopCameraStream();
    };
  }, []);

  // Helper to map icon by ID or name
  const renderCategoryIcon = (iconName?: string, id?: string) => {
    const key = (iconName || id || '').toLowerCase();
    if (key.includes('flame') || key === 'veld_fire') return <Flame className="w-5 h-5 text-rose-500" />;
    if (key.includes('spik') || key === 'spiking') return <AlertOctagon className="w-5 h-5 text-rose-400" />;
    if (key.includes('crash') || key.includes('accident') || key === 'crash') return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    if (key.includes('car') || key === 'congestion') return <Car className="w-5 h-5 text-cyan-400" />;
    if (key.includes('pothole') || key.includes('construction') || key === 'pothole') return <Construction className="w-5 h-5 text-amber-500" />;
    if (key.includes('wrench') || key === 'roadworks') return <Wrench className="w-5 h-5 text-yellow-400" />;
    if (key.includes('shieldalert') || key === 'stationary') return <ShieldAlert className="w-5 h-5 text-orange-400" />;
    if (key.includes('octagon') || key === 'traffic_lights') return <Octagon className="w-5 h-5 text-indigo-400" />;
    if (key.includes('megaphone') || key === 'general') return <Megaphone className="w-5 h-5 text-cyan-300" />;
    if (key.includes('sos') || key.includes('siren')) return <Siren className="w-5 h-5 text-red-400" />;
    if (key.includes('rain') || key.includes('storm')) return <CloudRain className="w-5 h-5 text-sky-400" />;
    if (key.includes('wave') || key.includes('flood')) return <Waves className="w-5 h-5 text-blue-400" />;
    if (key.includes('zap') || key.includes('light') || key.includes('power')) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (key.includes('wind')) return <Wind className="w-5 h-5 text-teal-400" />;
    if (key.includes('truck') || key.includes('heavy')) return <Truck className="w-5 h-5 text-amber-300" />;
    if (key.includes('sparkle')) return <Sparkles className="w-5 h-5 text-emerald-400" />;
    return <AlertTriangle className="w-5 h-5 text-amber-400" />;
  };

  // Helper to compress image client-side to keep under limits (enforcing 3.2:1 aspect ratio)
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(img.src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Handle local file upload for existing category
  const handleFileUpload = async (categoryId: string, file: File) => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Incident Categories & Alert Banners can only be modified by Super Admin (charlesodendaal43@gmail.com).'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }

    setLoadingCategory(categoryId);
    try {
      const dataUrl = await compressImageFile(file);
      const res = await saveCategoryDefaultImage({
        id: categoryId,
        imageUrl: dataUrl,
        isSystemDefault: false
      }, undefined, currentAdminEmail, currentAdminRole);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Alert banner for "${res.category?.label || categoryId}" updated successfully!`
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to save category image.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Error processing uploaded photo.' });
    } finally {
      setLoadingCategory(null);
    }
  };

  // Handle local file upload for new category modal
  const handleNewCategoryFileUpload = async (file: File) => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin Charles Odendaal can create categories or upload alert banners.'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }
    try {
      const dataUrl = await compressImageFile(file);
      setNewBannerUrl(dataUrl);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to process selected file.' });
    }
  };

  // Handle local file upload for edit category modal
  const handleEditCategoryFileUpload = async (file: File) => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin Charles Odendaal can modify alert banners.'
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (JPG, PNG, WebP).' });
      return;
    }
    try {
      const dataUrl = await compressImageFile(file);
      setEditBannerUrl(dataUrl);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to process selected file.' });
    }
  };

  // Auto-generate ID slug when label changes in New Category modal
  const handleLabelChange = (val: string) => {
    setNewLabel(val);
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    setNewId(slug);
  };

  // Handle Create Category submission
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin (charlesodendaal43@gmail.com) is authorized to create new incident categories.'
      });
      return;
    }

    if (!newLabel.trim()) {
      setStatusMessage({ type: 'error', text: 'Please provide a Category Name.' });
      return;
    }
    const cleanId = (newId || newLabel)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!cleanId) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid Category ID.' });
      return;
    }

    if (categories.some(c => c.id === cleanId)) {
      setStatusMessage({ type: 'error', text: `A category with ID "${cleanId}" already exists. Please choose a different name.` });
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await createCustomCategory({
        id: cleanId,
        label: newLabel.trim(),
        badge: (newBadge || 'ALERT').toUpperCase().trim(),
        subtitle: newSubtitle.trim() || 'Active road hazard and safety alert',
        imageUrl: newBannerUrl || '',
        iconName: newIconName
      }, undefined, currentAdminEmail, currentAdminRole);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `🎉 New Category "${newLabel}" created and broadcasted successfully!`
        });
        setIsCreateModalOpen(false);
        // Reset form
        setNewLabel('');
        setNewId('');
        setNewBadge('HAZARD');
        setNewSubtitle('');
        setNewIconName('AlertTriangle');
        setNewBannerUrl('');
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to create new category.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err?.message || 'Error creating category.' });
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Handle Edit Category Details submission
  const handleSaveCategoryDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin (charlesodendaal43@gmail.com) is authorized to edit incident categories.'
      });
      return;
    }

    if (!editingDetailsCategory) return;

    setLoadingCategory(editingDetailsCategory.id);
    try {
      const res = await saveCategoryDefaultImage({
        id: editingDetailsCategory.id,
        label: editLabel.trim() || editingDetailsCategory.label,
        badge: (editBadge || editingDetailsCategory.badge).toUpperCase().trim(),
        subtitle: editSubtitle.trim() || editingDetailsCategory.subtitle,
        iconName: editIconName,
        imageUrl: editBannerUrl.trim() || editingDetailsCategory.imageUrl,
        isSystemDefault: false
      }, undefined, currentAdminEmail, currentAdminRole);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Details and banner updated for "${editLabel || editingDetailsCategory.label}".`
        });
        setEditingDetailsCategory(null);
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to update category details.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error updating category details.' });
    } finally {
      setLoadingCategory(null);
    }
  };

  // Handle Delete Custom Category
  const handleDeleteCategory = async () => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin (charlesodendaal43@gmail.com) is authorized to delete incident categories.'
      });
      return;
    }

    if (!deletingCategory) return;

    setIsDeleting(true);
    try {
      const res = await deleteCustomCategory(deletingCategory.id, undefined, currentAdminEmail, currentAdminRole);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Category "${deletingCategory.label}" was deleted successfully.`
        });
        setDeletingCategory(null);
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to delete category.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error deleting category.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle URL submit
  const handleSaveUrl = async () => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin (charlesodendaal43@gmail.com) is authorized to update alert banners.'
      });
      return;
    }

    if (!editingUrlCategory || !inputUrl.trim()) return;

    const trimmed = inputUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid web image URL (starting with https://).' });
      return;
    }

    setLoadingCategory(editingUrlCategory.id);
    try {
      const res = await saveCategoryDefaultImage({
        id: editingUrlCategory.id,
        imageUrl: trimmed,
        isSystemDefault: false
      }, undefined, currentAdminEmail, currentAdminRole);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Alert banner for "${editingUrlCategory.label}" updated successfully from URL.`
        });
        setEditingUrlCategory(null);
        setInputUrl('');
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to update category image.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to update category image.' });
    } finally {
      setLoadingCategory(null);
    }
  };

  // Remove banner from category (clear imageUrl)
  const handleRemoveBanner = async (categoryId: string) => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin (charlesodendaal43@gmail.com) is authorized to remove alert banners.'
      });
      return;
    }

    setLoadingCategory(categoryId);
    try {
      const target = categories.find(c => c.id === categoryId);
      const res = await saveCategoryDefaultImage({
        id: categoryId,
        label: target?.label,
        badge: target?.badge,
        subtitle: target?.subtitle,
        iconName: target?.iconName,
        imageUrl: '',
        isSystemDefault: false
      }, undefined, currentAdminEmail, currentAdminRole);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Alert banner removed for "${target?.label || categoryId}".`
        });
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to remove banner.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Failed to remove banner.' });
    } finally {
      setLoadingCategory(null);
    }
  };

  // Clear All Banners across all categories
  const handleClearAllBanners = async () => {
    if (!isSuperAdminCharles) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Only Super Admin (charlesodendaal43@gmail.com) is authorized to clear all alert banners.'
      });
      return;
    }

    setIsClearingAll(true);
    try {
      const res = await clearAllCategoryBanners(undefined, currentAdminEmail, currentAdminRole);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'All category alert banners have been cleared successfully. No default or stock images are being used.'
        });
        setIsClearAllModalOpen(false);
        loadData();
      } else {
        setStatusMessage({
          type: 'error',
          text: res.message || 'Failed to clear all category banners.'
        });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: 'Error clearing category alert banners.'
      });
    } finally {
      setIsClearingAll(false);
    }
  };

  // Camera Management
  const startCamera = async (category: IncidentCategoryConfig | null, forNewCategory = false, forEditCategory = false) => {
    setCameraCategory(category);
    setIsCapturingForNewCategory(forNewCategory);
    setIsCapturingForEditCategory(forEditCategory);
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Could not access camera device. Please grant camera permissions in your browser.');
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraCategory(null);
    setIsCapturingForNewCategory(false);
    setIsCapturingForEditCategory(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      // 3.2:1 Wide Banner format
      canvas.width = 1200;
      canvas.height = 375;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw video center-cropped to 3.2:1 banner
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;
      const targetAspect = 1200 / 375;
      const videoAspect = vWidth / vHeight;

      let sx = 0;
      let sy = 0;
      let sWidth = vWidth;
      let sHeight = vHeight;

      if (videoAspect > targetAspect) {
        sWidth = vHeight * targetAspect;
        sx = (vWidth - sWidth) / 2;
      } else {
        sHeight = vWidth / targetAspect;
        sy = (vHeight - sHeight) / 2;
      }

      ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);

      if (isCapturingForNewCategory) {
        setNewBannerUrl(dataUrl);
        stopCameraStream();
        setStatusMessage({ type: 'success', text: 'Panoramic snapshot captured for new category banner!' });
        return;
      }

      if (isCapturingForEditCategory) {
        setEditBannerUrl(dataUrl);
        stopCameraStream();
        setStatusMessage({ type: 'success', text: 'Panoramic snapshot captured for category alert banner!' });
        return;
      }

      if (!cameraCategory) return;
      stopCameraStream();
      setLoadingCategory(cameraCategory.id);

      const res = await saveCategoryDefaultImage({
        id: cameraCategory.id,
        imageUrl: dataUrl,
        isSystemDefault: false
      }, undefined, currentAdminEmail, currentAdminRole);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Live camera alert banner snapshot saved for "${cameraCategory.label}"!`
        });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Failed to save snapshot.' });
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Error capturing camera snapshot.' });
    } finally {
      setLoadingCategory(null);
    }
  };

  // Filter categories
  const filteredCategories = categories.filter(cat => {
    const matchesSearch =
      cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.badge.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'with-banner') return Boolean(cat.imageUrl);
    if (filterType === 'no-banner') return !cat.imageUrl;
    if (filterType === 'custom') return !isFactoryDefault(cat.id);
    return true;
  });

  const isFactoryDefault = (catId: string) => {
    return DEFAULT_CATEGORY_CONFIGS.some(d => d.id === catId);
  };

  return (
    <div id="admin-category-photos-manager" className="space-y-6 animate-fadeIn text-slate-100">
      {/* Top Banner / Explainer */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0B101B] to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-sm">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Incident Alert Banners Manager</span>
              </span>
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                {categories.length} Categories Active
              </span>
              {isSuperAdminCharles ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Super Admin Authorized</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Super Admin Restricted (View Only)</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Incident Categories & Alert Banners
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Define custom incident categories and customize high-visibility wide alert banners (~3.2:1 aspect ratio) for traffic hazard broadcasts, Live Feeds, and citizen alerts.
            </p>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
            {/* ADD NEW CATEGORY BUTTON */}
            {isSuperAdminCharles ? (
              <>
                <button
                  type="button"
                  id="btn-add-new-category"
                  onClick={() => {
                    setNewLabel('');
                    setNewId('');
                    setNewBadge('HAZARD');
                    setNewSubtitle('');
                    setNewIconName('AlertTriangle');
                    setNewBannerUrl('');
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                  title="Create a brand new custom incident alert category"
                >
                  <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>Add New Category</span>
                </button>

                <button
                  type="button"
                  id="btn-clear-all-category-banners"
                  onClick={() => setIsClearAllModalOpen(true)}
                  className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 hover:border-rose-400 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md active:scale-95"
                  title="Clear all alert banner photos across all categories"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear All Banners</span>
                </button>
              </>
            ) : (
              <div
                className="bg-slate-800/80 text-slate-400 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-not-allowed opacity-75"
                title="Category creation is restricted to Super Admin Charles Odendaal (charlesodendaal43@gmail.com)"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Add Category (Charles Odendaal Only)</span>
              </div>
            )}

            <button
              type="button"
              id="btn-refresh-category-photos"
              onClick={loadData}
              disabled={isLoadingAll}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-md"
              title="Refresh from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoadingAll ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Super Admin Protection Bar if unauthorized */}
        {!isSuperAdminCharles && (
          <div className="mt-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3.5 flex items-start space-x-3 text-amber-200 shadow-lg animate-fadeIn">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-black text-amber-300 text-xs uppercase tracking-wider">Super Admin Restricted Access</span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">Protected</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Management of Incident Categories & Alert Banners is locked exclusively to Super Admin <strong className="text-amber-100 font-mono">charlesodendaal43@gmail.com</strong>. You are currently viewing active categories and alert banners in protected view-only mode.
              </p>
            </div>
          </div>
        )}

        {/* Status Toast */}
        {statusMessage && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60'
              : 'bg-rose-950/90 text-rose-200 border-rose-500/60'
          }`}>
            <div className="flex items-center space-x-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories (spiking, crash, flooding...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#050608] border border-slate-800 text-white rounded-xl pl-9 pr-8 py-2 text-xs focus:border-emerald-500 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              filterType === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>All Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('with-banner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              filterType === 'with-banner'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>With Banner ({categories.filter(c => Boolean(c.imageUrl)).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('no-banner')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              filterType === 'no-banner'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>No Banner ({categories.filter(c => !c.imageUrl).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 shrink-0 ${
              filterType === 'custom'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <span>Admin Custom ({categories.filter(c => !isFactoryDefault(c.id)).length})</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
        {filteredCategories.map((category) => {
          const isLoading = loadingCategory === category.id;
          const isFactory = isFactoryDefault(category.id);
          const hasBanner = Boolean(category.imageUrl);

          return (
            <div
              key={category.id}
              id={`category-card-${category.id}`}
              className="bg-[#0B0D13] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition duration-200 space-y-3 shadow-lg flex flex-col justify-between"
            >
              {/* Category Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                    {renderCategoryIcon(category.iconName, category.id)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-base font-bold text-white tracking-tight">{category.label}</h3>
                      <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {category.badge}
                      </span>
                      {!isFactory && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                          Custom Created
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-medium">{category.subtitle}</p>
                  </div>
                </div>

                {/* Edit details / delete buttons */}
                <div className="flex items-center space-x-1 shrink-0">
                  {isSuperAdminCharles ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDetailsCategory(category);
                          setEditLabel(category.label);
                          setEditBadge(category.badge);
                          setEditSubtitle(category.subtitle);
                          setEditIconName(category.iconName || 'AlertTriangle');
                          setEditBannerUrl(category.imageUrl || '');
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Edit category name, badge, description and alert banner photo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                        title={`Delete category "${category.label}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span
                      className="p-1 text-slate-500 hover:text-slate-400 cursor-not-allowed"
                      title="Modification restricted to Super Admin Charles Odendaal"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-600" />
                    </span>
                  )}
                </div>
              </div>

              {/* 3.2:1 Alert Banner Preview Frame */}
              <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden border border-slate-800 bg-[#050608] group/photo shadow-inner">
                {hasBanner ? (
                  <>
                    <img
                      src={category.imageUrl}
                      alt={category.label}
                      className="w-full h-full object-cover transition duration-300 group-hover/photo:scale-102"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                    {/* Custom Tag */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-emerald-500/95 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        <span>Custom Alert Banner</span>
                      </span>
                    </div>

                    {/* View Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setZoomCategory(category)}
                      className="absolute top-2.5 right-2.5 w-7 h-7 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition opacity-0 group-hover/photo:opacity-100 cursor-pointer shadow-md z-10"
                      title="View large image preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/80 border border-dashed border-slate-800 text-slate-400 space-y-1.5 p-3 text-center">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                    <span className="text-xs font-bold text-slate-300">No Alert Banner Assigned</span>
                    <span className="text-[10px] text-slate-500">
                      {isSuperAdminCharles
                        ? 'Upload or capture a custom 3.2 : 1 panoramic banner'
                        : 'No panoramic alert banner configured'}
                    </span>
                  </div>
                )}

                {/* Aspect Ratio Hint Badge */}
                <div className="absolute bottom-2 left-2.5 z-10">
                  <span className="bg-black/75 backdrop-blur-sm text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-800">
                    3.2 : 1 Panoramic Banner
                  </span>
                </div>

                {/* Loading indicator */}
                {isLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="flex flex-col items-center space-y-1.5 text-emerald-400">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-bold">Saving changes...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Updated Metadata if custom banner */}
              {hasBanner && category.updatedAt && (
                <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
                  <span>Updated: {new Date(category.updatedAt).toLocaleDateString()}</span>
                  <span className="text-emerald-400 font-bold truncate max-w-[150px]">
                    By {category.updatedBy || 'Admin'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => (fileInputRefs.current[category.id] = el)}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(category.id, file);
                    e.target.value = '';
                  }}
                />

                {isSuperAdminCharles ? (
                  <>
                    {/* Primary Upload Options Row */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* File Upload Button */}
                      <button
                        type="button"
                        id={`btn-upload-file-${category.id}`}
                        disabled={isLoading}
                        onClick={() => fileInputRefs.current[category.id]?.click()}
                        className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 shadow-sm"
                        title="Upload banner photo from your device files"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>

                      {/* Live Camera Button */}
                      <button
                        type="button"
                        id={`btn-camera-${category.id}`}
                        disabled={isLoading}
                        onClick={() => startCamera(category, false)}
                        className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 shadow-sm"
                        title="Capture wide panoramic snapshot with camera"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </button>

                      {/* Web URL Button */}
                      <button
                        type="button"
                        id={`btn-url-${category.id}`}
                        disabled={isLoading}
                        onClick={() => {
                          setEditingUrlCategory(category);
                          setInputUrl(category.imageUrl || '');
                        }}
                        className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 hover:border-amber-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50 shadow-sm"
                        title="Set image using a direct web link"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Web URL</span>
                      </button>
                    </div>

                    {/* Remove Banner Option if image is assigned */}
                    {hasBanner && (
                      <button
                        type="button"
                        id={`btn-remove-banner-${category.id}`}
                        disabled={isLoading}
                        onClick={() => handleRemoveBanner(category.id)}
                        className="w-full bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        title="Remove banner image from this category"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        <span>Remove Banner</span>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-3 flex items-center justify-center space-x-1.5 text-slate-500 text-[11px]">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70" />
                    <span>Editing restricted to Super Admin Charles Odendaal</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ADD NEW CATEGORY MODAL */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0D1117] border-2 border-emerald-500/50 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] text-slate-100 overflow-hidden">
            {/* Modal Header (Fixed at top) */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-[#0D1117]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">Create New Incident Category</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-tight">Add a custom incident classification with dedicated panoramic alert banner</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 flex-1 [scrollbar-width:thin] text-slate-100">
                {/* Category Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flooding & High Water"
                      value={newLabel}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:border-emerald-500 outline-none placeholder-slate-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                      Unique Category ID (Slug) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. flooding"
                      value={newId}
                      onChange={(e) => setNewId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      className="w-full bg-[#050608] border border-slate-700 text-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-emerald-500 outline-none placeholder-slate-500 shadow-sm"
                    />
                  </div>
                </div>

                {/* Severity Badge & Subtitle */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                        Severity Tag / Badge
                      </label>
                      <span className="text-[10px] text-slate-400">Shown prominently on live alerts</span>
                    </div>
                    
                    {/* Quick Select Chips */}
                    <div className="flex items-center space-x-1.5 mb-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                      {['HAZARD', 'CRITICAL', 'WEATHER', 'UNREST', 'OBSTRUCTION', 'ADVISORY', 'SPECIAL'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setNewBadge(chip)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition cursor-pointer shrink-0 ${
                            newBadge === chip
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Custom badge text (e.g. FLOODING or HIGH RISK)"
                      value={newBadge}
                      onChange={(e) => setNewBadge(e.target.value.toUpperCase())}
                      className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:border-emerald-500 outline-none placeholder-slate-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                      Description / Motorist Advisory Subtitle
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Submerged roadway, standing water hazardous to light motor vehicles"
                      value={newSubtitle}
                      onChange={(e) => setNewSubtitle(e.target.value)}
                      className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:border-emerald-500 outline-none placeholder-slate-500"
                    />
                  </div>
                </div>

                {/* Icon Selector Grid */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Category Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-[#050608] p-2.5 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconCmp = item.icon;
                      const isSelected = newIconName === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setNewIconName(item.name)}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-2 border-emerald-500 text-white shadow-md'
                              : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                          }`}
                          title={item.label}
                        >
                          <IconCmp className={`w-5 h-5 ${isSelected ? 'text-emerald-300' : item.color}`} />
                          <span className="text-[9px] font-medium truncate w-full text-center">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panoramic Alert Banner Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300">
                      Panoramic Alert Banner (3.2 : 1 Ratio - Optional)
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">3.2 : 1 Wide Horizon</span>
                  </div>

                  {/* Banner Live Preview */}
                  <div className="relative aspect-[3.2/1] rounded-2xl overflow-hidden border-2 border-slate-700 bg-[#050608] shadow-inner group">
                    {newBannerUrl ? (
                      <>
                        <img
                          src={newBannerUrl}
                          alt="New category banner preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                        
                        {/* Badge & Label in preview */}
                        <div className="absolute bottom-2.5 left-3 flex items-center space-x-2">
                          <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                            {newBadge || 'ALERT'}
                          </span>
                          <span className="text-white font-bold text-xs drop-shadow-md">
                            {newLabel || 'Preview Category'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setNewBannerUrl('')}
                          className="absolute top-2 right-2 bg-slate-900/90 hover:bg-rose-900/90 text-slate-300 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 border border-slate-700"
                        >
                          <X className="w-3 h-3" />
                          <span>Clear Banner</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/80 text-slate-400 space-y-1 p-3 text-center">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                        <span className="text-xs font-bold text-slate-300">No Banner (Optional)</span>
                        <span className="text-[10px] text-slate-500">Upload or snap a photo, or leave empty</span>
                      </div>
                    )}
                  </div>

                  {/* Upload or Camera for New Category */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={newCatFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleNewCategoryFileUpload(file);
                      e.target.value = '';
                    }}
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => newCatFileInputRef.current?.click()}
                      className="bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startCamera(null, true)}
                      className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Capture Camera</span>
                    </button>
                  </div>

                  <div>
                    <input
                      type="url"
                      placeholder="Or enter direct Image URL (https://...)"
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      className="w-full bg-[#050608] border border-slate-700 text-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono focus:border-emerald-500 outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons (Fixed at bottom) */}
              <div className="flex items-center justify-end space-x-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 shrink-0 bg-[#0D1117]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition border border-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSubmittingNew ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Creating Category...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save & Activate Category</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CATEGORY DETAILS MODAL */}
      {/* ========================================================================= */}
      {editingDetailsCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0D1117] border border-slate-700 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-[#0D1117]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center border border-slate-700 shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Edit Category Details</h3>
                  <p className="text-[11px] text-slate-400">ID: {editingDetailsCategory.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDetailsCategory(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryDetails} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 flex-1 [scrollbar-width:thin]">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Category Name / Label
                  </label>
                  <input
                    type="text"
                    required
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Severity Tag / Badge
                  </label>
                  <input
                    type="text"
                    required
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value.toUpperCase())}
                    className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold focus:border-emerald-500 outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Description / Advisory Subtitle
                  </label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                    Category Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-[#050608] p-2.5 rounded-xl border border-slate-800 max-h-36 overflow-y-auto">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconCmp = item.icon;
                      const isSelected = editIconName === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setEditIconName(item.name)}
                          className={`p-2 rounded-xl flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-2 border-emerald-500 text-white'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <IconCmp className={`w-4 h-4 ${isSelected ? 'text-emerald-300' : item.color}`} />
                          <span className="text-[9px] font-medium truncate w-full text-center">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Alert Banner / Photo Configuration */}
                <div className="pt-2 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold uppercase text-slate-400">
                      Alert Banner / Image (3.2 : 1 Panoramic)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {editBannerUrl ? (editBannerUrl !== editingDetailsCategory.imageUrl ? 'New Photo Selected' : 'Active Banner') : 'No Banner'}
                    </span>
                  </div>

                  {/* Live Banner Preview */}
                  <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden border border-slate-700 bg-[#050608] shadow-inner group">
                    {editBannerUrl ? (
                      <>
                        <img
                          src={editBannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                          onError={() => {}}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 left-2.5 z-10">
                          <span className="bg-black/75 backdrop-blur-sm text-slate-300 font-mono text-[9px] px-2 py-0.5 rounded border border-slate-700">
                            3.2 : 1 Panoramic Feed Banner
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditBannerUrl('')}
                          className="absolute top-2 right-2 bg-slate-900/90 hover:bg-rose-900/90 text-slate-300 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 border border-slate-700 z-10"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove Banner</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950/80 text-slate-400 space-y-1 p-3 text-center">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                        <span className="text-xs font-bold text-slate-300">No Banner Assigned</span>
                        <span className="text-[10px] text-slate-500">Upload or capture a photo, or leave empty</span>
                      </div>
                    )}
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={editCatFileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleEditCategoryFileUpload(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Upload & Camera Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => editCatFileInputRef.current?.click()}
                      className="bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Upload Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startCamera(editingDetailsCategory, false, true)}
                      className="bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Capture Camera</span>
                    </button>
                  </div>

                  {/* Direct Image URL input */}
                  <div>
                    <input
                      type="url"
                      placeholder="Or paste direct Image URL (https://...)"
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      className="w-full bg-[#050608] border border-slate-700 text-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono focus:border-emerald-500 outline-none placeholder-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 shrink-0 bg-[#0D1117]">
                <button
                  type="button"
                  onClick={() => setEditingDetailsCategory(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save Details & Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CUSTOM CATEGORY CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0D1117] border border-rose-500/50 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 text-slate-100">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Delete Incident Category?</h3>
                <p className="text-xs text-rose-300 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="font-bold text-white">{deletingCategory.label}</div>
              <div className="text-slate-400">ID: <span className="font-mono text-slate-300">{deletingCategory.id}</span></div>
              <div className="text-slate-400">Badge: <span className="text-amber-400 font-bold">{deletingCategory.badge}</span></div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                disabled={isDeleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer transition flex items-center space-x-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Input Modal */}
      {editingUrlCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0F1115] border border-amber-500/50 rounded-2xl sm:rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[92vh] text-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-[#0F1115]">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                  Set Alert Banner URL: {editingUrlCategory.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUrlCategory(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 flex-1 [scrollbar-width:thin]">
              <p className="text-xs text-slate-300">
                Paste a high-resolution direct web image URL (JPG, PNG, WebP) or an Unsplash photo link.
              </p>

              <input
                type="url"
                placeholder="https://example.co.za/banner.jpg or data:image/..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full bg-[#050608] border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono focus:border-amber-400 outline-none"
              />

              {/* Preview if URL valid */}
              {inputUrl.startsWith('http') && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Panoramic Live Preview (3.2:1):</span>
                  <div className="relative aspect-[3.2/1] rounded-xl overflow-hidden border border-slate-700 bg-black">
                    <img
                      src={inputUrl}
                      alt="URL Preview"
                      className="w-full h-full object-cover"
                      onError={() => {}}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 shrink-0 bg-[#0F1115]">
              <button
                type="button"
                onClick={() => setEditingUrlCategory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={!inputUrl.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer transition disabled:opacity-50"
              >
                Save & Apply Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0F1115] border border-cyan-500/50 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh] text-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 sm:px-6 py-3.5 sm:py-4 shrink-0 bg-[#0F1115]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                    {isCapturingForNewCategory
                      ? 'Capture New Alert Banner Photo'
                      : isCapturingForEditCategory
                      ? `Capture Alert Banner: ${editingDetailsCategory?.label || 'Category'}`
                      : `Capture Live Alert Banner: ${cameraCategory?.label || 'Category'}`}
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    Panoramic Format ~3.2:1 Aspect Ratio
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5 flex-1 [scrollbar-width:thin]">
              {cameraError ? (
                <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-200 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Camera Unavailable</span>
                  </div>
                  <p>{cameraError}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Camera Viewport Framed to 3.2:1 */}
                  <div className="relative aspect-[3.2/1] rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-black shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Framing Overlay Guide */}
                    <div className="absolute inset-0 border-2 border-dashed border-cyan-400/40 pointer-events-none" />
                    <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono">
                      Panoramic 3.2 : 1 Center-Crop Active
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Position your camera over the incident scene or advisory asset. Click capture when ready.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 shrink-0 bg-[#0F1115]">
              <button
                type="button"
                onClick={stopCameraStream}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Cancel
              </button>

              {!cameraError && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
                >
                  <Camera className="w-4 h-4 text-slate-950" />
                  <span>Snap Panoramic Banner</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0D1117] border-2 border-rose-500/50 rounded-2xl sm:rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/10 shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-white leading-tight">Clear All Alert Banners?</h3>
                <p className="text-xs text-slate-400 leading-tight">Wipe all category banner photos system-wide</p>
              </div>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
              <p>
                This action will remove all banner images across every active category on RoadWatch RSA.
              </p>
              <p className="text-amber-300 font-semibold">
                Categories will remain active, but will display as having no banner until a custom photo is uploaded. No stock or default photos will be displayed.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isClearingAll}
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all-banners"
                disabled={isClearingAll}
                onClick={handleClearAllBanners}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center space-x-2 cursor-pointer shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isClearingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Clearing Banners...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Banners</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Large Image Preview Modal */}
      {zoomCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setZoomCategory(null)}
        >
          <div
            className="bg-[#0F1115] border border-slate-700 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                {renderCategoryIcon(zoomCategory.iconName, zoomCategory.id)}
                <h3 className="text-base font-bold text-white">{zoomCategory.label}</h3>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {zoomCategory.badge}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  3.2 : 1 Panoramic Alert Banner
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoomCategory(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center p-2 shadow-2xl">
              <img
                src={zoomCategory.imageUrl}
                alt={zoomCategory.label}
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{zoomCategory.subtitle}</span>
              <button
                type="button"
                onClick={() => setZoomCategory(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
