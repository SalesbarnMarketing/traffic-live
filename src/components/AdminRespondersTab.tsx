import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Filter,
  Phone,
  Radio,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Car,
  Activity,
  Building2,
  UserCheck,
  BadgeCheck
} from 'lucide-react';
import { ResponderPartner } from '../types';
import { INITIAL_RESPONDER_PARTNERS } from '../data/initialData';

interface AdminRespondersTabProps {
  onNavigateToSOS?: () => void;
  onNavigateToUsers?: () => void;
}

const POPULAR_COVERAGE_AREAS = [
  'N1 Midrand to Centurion',
  'Pretoria East & N4 Corridor',
  'Sandton, Rivonia & N3 Buccleuch',
  'Johannesburg CBD & M1 Corridors',
  'R21 Airport / Kempton Park Corridor',
  'Ekurhuleni East Rand & N12',
  'West Rand / Krugersdorp (N14 / Ontdekkers)',
  'All Gauteng Highway Corridors'
];

const UNIT_TYPE_CONFIG: Record<
  ResponderPartner['type'],
  { label: string; icon: string; badgeBg: string; badgeBorder: string; badgeText: string }
> = {
  patrol_officer: {
    label: 'LiveTraffic Patrol Unit',
    icon: '🚓',
    badgeBg: 'bg-emerald-500/15',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-300'
  },
  partner_responder: {
    label: 'Partner Roadside Responder',
    icon: '🤝',
    badgeBg: 'bg-amber-500/15',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-300'
  },
  saps_police: {
    label: 'SAPS Police / Flying Squad',
    icon: '🚔',
    badgeBg: 'bg-blue-500/15',
    badgeBorder: 'border-blue-500/30',
    badgeText: 'text-blue-300'
  },
  metro_police: {
    label: 'Metro Police (TMPD / JMPD)',
    icon: '🚓',
    badgeBg: 'bg-indigo-500/15',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-300'
  },
  medical_ems: {
    label: 'Medical EMS / Paramedic',
    icon: '🚑',
    badgeBg: 'bg-red-500/15',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-300'
  },
  towing_recovery: {
    label: 'Heavy Recovery & Towing',
    icon: '🛻',
    badgeBg: 'bg-orange-500/15',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-300'
  },
  community_responder: {
    label: 'CPF / Community Watch',
    icon: '👥',
    badgeBg: 'bg-purple-500/15',
    badgeBorder: 'border-purple-500/30',
    badgeText: 'text-purple-300'
  },
  other: {
    label: 'Other Responding Unit',
    icon: '🛡️',
    badgeBg: 'bg-slate-500/15',
    badgeBorder: 'border-slate-500/30',
    badgeText: 'text-slate-300'
  }
};

export const AdminRespondersTab: React.FC<AdminRespondersTabProps> = ({ onNavigateToSOS, onNavigateToUsers }) => {
  const [responders, setResponders] = useState<ResponderPartner[]>(() => {
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

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Pending applicant verification count
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingApplicants, setPendingApplicants] = useState<any[]>([]);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResponder, setEditingResponder] = useState<ResponderPartner | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: ResponderPartner['type'];
    callsign: string;
    phone: string;
    organizationName: string;
    label: string;
    coverageArea: string;
    notes: string;
    isActive: boolean;
  }>({
    name: '',
    type: 'patrol_officer',
    callsign: '',
    phone: '',
    organizationName: '',
    label: '',
    coverageArea: '',
    notes: '',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch responders and pending applicants from server API
  const fetchResponders = async () => {
    setIsLoading(true);
    try {
      const [resResponders, resPending] = await Promise.allSettled([
        fetch('/api/responders'),
        fetch('/api/admin/pending-responders')
      ]);

      if (resResponders.status === 'fulfilled' && resResponders.value.ok) {
        const data = await resResponders.value.json();
        if (Array.isArray(data.responderPartners)) {
          setResponders(data.responderPartners);
          localStorage.setItem('livetraffic_responders', JSON.stringify(data.responderPartners));
        }
      }

      if (resPending.status === 'fulfilled' && resPending.value.ok) {
        const data = await resPending.value.json();
        setPendingCount(data.pendingCount || 0);
        setPendingApplicants(data.applicants || []);
      }
    } catch (err) {
      console.warn('Failed to load responders from backend API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponders();
  }, []);

  // Open modal for adding
  const handleOpenAddModal = () => {
    setEditingResponder(null);
    setFormData({
      name: '',
      type: 'patrol_officer',
      callsign: '',
      phone: '',
      organizationName: '',
      label: '',
      coverageArea: '',
      notes: '',
      isActive: true
    });
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (responder: ResponderPartner) => {
    setEditingResponder(responder);
    setFormData({
      name: responder.name,
      type: responder.type,
      callsign: responder.callsign,
      phone: responder.phone,
      organizationName: responder.organizationName || '',
      label: responder.label || '',
      coverageArea: responder.coverageArea || '',
      notes: responder.notes || '',
      isActive: responder.isActive !== false
    });
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Responder name is required', 'error');
      return;
    }
    if (!formData.callsign.trim()) {
      showToast('Callsign / Vehicle ID is required', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = !!editingResponder;
      const url = isEditing ? `/api/responders/${editingResponder.id}` : '/api/responders';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.responderPartners) {
          setResponders(data.responderPartners);
          localStorage.setItem('livetraffic_responders', JSON.stringify(data.responderPartners));
        } else {
          await fetchResponders();
        }
        setIsModalOpen(false);
        showToast(
          isEditing
            ? `Responder "${formData.name}" updated successfully!`
            : `New responder "${formData.name}" added to directory!`,
          'success'
        );
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to save responder details', 'error');
      }
    } catch (err) {
      // Fallback local update if network is offline
      const updatedList = editingResponder
        ? responders.map((r) =>
            r.id === editingResponder.id ? { ...r, ...formData, updatedAt: new Date().toISOString() } : r
          )
        : [
            ...responders,
            {
              id: `resp-${Date.now()}`,
              ...formData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
      setResponders(updatedList);
      localStorage.setItem('livetraffic_responders', JSON.stringify(updatedList));
      setIsModalOpen(false);
      showToast('Saved to local storage (offline mode)', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/responders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.responderPartners) {
          setResponders(data.responderPartners);
          localStorage.setItem('livetraffic_responders', JSON.stringify(data.responderPartners));
        } else {
          const updated = responders.filter((r) => r.id !== id);
          setResponders(updated);
          localStorage.setItem('livetraffic_responders', JSON.stringify(updated));
        }
        showToast('Responder deleted successfully', 'success');
      } else {
        const updated = responders.filter((r) => r.id !== id);
        setResponders(updated);
        localStorage.setItem('livetraffic_responders', JSON.stringify(updated));
        showToast('Responder removed from local directory', 'success');
      }
    } catch (err) {
      const updated = responders.filter((r) => r.id !== id);
      setResponders(updated);
      localStorage.setItem('livetraffic_responders', JSON.stringify(updated));
      showToast('Responder deleted from local storage', 'success');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (responder: ResponderPartner) => {
    const updatedStatus = !responder.isActive;
    try {
      const res = await fetch(`/api/responders/${responder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.responderPartners) {
          setResponders(data.responderPartners);
          localStorage.setItem('livetraffic_responders', JSON.stringify(data.responderPartners));
        } else {
          setResponders((prev) =>
            prev.map((r) => (r.id === responder.id ? { ...r, isActive: updatedStatus } : r))
          );
        }
        showToast(`Unit ${responder.callsign} is now ${updatedStatus ? 'ACTIVE' : 'INACTIVE'}`);
      }
    } catch (e) {
      setResponders((prev) =>
        prev.map((r) => (r.id === responder.id ? { ...r, isActive: updatedStatus } : r))
      );
    }
  };

  // Filtering
  const filteredResponders = responders.filter((r) => {
    const matchesSearch =
      searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.organizationName && r.organizationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.userEmail && r.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.phone && r.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.coverageArea && r.coverageArea.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedTypeFilter === 'all' || r.type === selectedTypeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && r.isActive !== false) ||
      (statusFilter === 'inactive' && r.isActive === false);

    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const totalUnits = responders.length;
  const activeUnits = responders.filter((r) => r.isActive !== false).length;
  const linkedUserUnits = responders.filter((r) => !!(r.userId || r.userEmail)).length;
  const patrolUnits = responders.filter((r) => r.type === 'patrol_officer').length;
  const partnerUnits = responders.filter((r) => r.type === 'partner_responder' || r.type === 'towing_recovery').length;
  const emergencyUnits = responders.filter((r) => r.type === 'saps_police' || r.type === 'medical_ems' || r.type === 'metro_police').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center space-x-2 text-sm font-bold animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === 'error'
              ? 'bg-red-950 border-red-500/50 text-red-200'
              : 'bg-emerald-950 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Pending Responder Verification Applications Banner */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5">
              <UserCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                  Action Required
                </span>
                <h3 className="text-sm sm:text-base font-black text-white">
                  {pendingCount} Pending Responder Application{pendingCount > 1 ? 's' : ''}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Motorists registered as responders with company affiliation and operating area are awaiting admin verification before directory listing.
              </p>
              {pendingApplicants.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {pendingApplicants.slice(0, 3).map((app, i) => (
                    <span
                      key={app.id || i}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900/90 text-amber-300 border border-amber-500/30"
                    >
                      {app.fullName} ({app.organizationName || 'Affiliate'}) • {app.assignedCorridor || 'Area'}
                    </span>
                  ))}
                  {pendingApplicants.length > 3 && (
                    <span className="text-[10px] text-slate-400">
                      +{pendingApplicants.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {onNavigateToUsers && (
            <button
              type="button"
              onClick={onNavigateToUsers}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
            >
              <span>Review in Users Tab</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0A0F1A] border border-[#D4A237]/40 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                  Responder & Partner Directory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CRUD Manager
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage tactical patrol officers, roadside partners, SAPS units, EMS medics, and towing operators for the SOS dispatch dropdown.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchResponders}
              disabled={isLoading}
              className="px-3.5 py-2.5 bg-[#05080E] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh responders list from server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {onNavigateToSOS && (
              <button
                type="button"
                onClick={onNavigateToSOS}
                className="px-3.5 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                title="Go to Live Emergency SOS Dispatch"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>Go to SOS Dispatch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Responder Unit</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Units</span>
              <span className="text-xl font-black font-mono text-white">{totalUnits}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/50 text-slate-400">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active On-Duty</span>
              <span className="text-xl font-black font-mono text-emerald-400">{activeUnits}</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Approved Accounts</span>
              <span className="text-xl font-black font-mono text-purple-400">{linkedUserUnits}</span>
            </div>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Patrol Officers</span>
              <span className="text-xl font-black font-mono text-sky-400">{patrolUnits}</span>
            </div>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">EMS & SAPS</span>
              <span className="text-xl font-black font-mono text-amber-400">{partnerUnits + emergencyUnits}</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-[#0A0F1A] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Officer name, callsign, phone, or highway corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#05080E] border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full bg-[#05080E] border border-slate-700/80 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Unit Categories ({responders.length})</option>
              <option value="patrol_officer">🚓 LiveTraffic Patrol ({patrolUnits})</option>
              <option value="partner_responder">🤝 Roadside Partners</option>
              <option value="saps_police">🚔 SAPS Police</option>
              <option value="metro_police">🚓 Metro Police</option>
              <option value="medical_ems">🚑 Medical EMS</option>
              <option value="towing_recovery">🛻 Heavy Towing</option>
              <option value="community_responder">👥 CPF Watch</option>
              <option value="other">🛡️ Other Units</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-[#05080E] border border-slate-700/80 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Statuses ({totalUnits})</option>
              <option value="active">Active In Dropdown ({activeUnits})</option>
              <option value="inactive">Inactive / Off Duty ({totalUnits - activeUnits})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responders Cards / Table */}
      {filteredResponders.length === 0 ? (
        <div className="bg-[#0A0F1A] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <Radio className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No Responders Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedTypeFilter !== 'all' || statusFilter !== 'all'
              ? 'No responder units match your search or filter criteria. Try clearing filters.'
              : 'No responders currently registered. Click "Add New Responder Unit" to add one.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl transition inline-flex items-center space-x-1.5 cursor-pointer mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Responder</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredResponders.map((responder) => {
            const config = UNIT_TYPE_CONFIG[responder.type] || UNIT_TYPE_CONFIG.other;
            const isDeleting = deleteConfirmId === responder.id;

            return (
              <div
                key={responder.id}
                className={`bg-[#0A0F1A] border rounded-3xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between space-y-3.5 relative overflow-hidden ${
                  responder.isActive !== false
                    ? 'border-slate-800/90 hover:border-amber-500/40 shadow-xl'
                    : 'border-slate-800/40 opacity-75 bg-[#070A10]'
                }`}
              >
                {/* Top Badge & Active Indicator */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${config.badgeBg} ${config.badgeBorder} ${config.badgeText}`}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(responder)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition flex items-center space-x-1 border cursor-pointer ${
                      responder.isActive !== false
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                    title={responder.isActive !== false ? 'Click to make inactive' : 'Click to make active'}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        responder.isActive !== false ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`}
                    />
                    <span>{responder.isActive !== false ? 'Active' : 'Off-Duty'}</span>
                  </button>
                </div>

                {/* Name & Callsign */}
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-wide truncate">
                    {responder.name}
                  </h3>
                  <div className="flex items-center space-x-1.5 font-mono text-xs text-amber-400 font-bold">
                    <Radio className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{responder.callsign}</span>
                  </div>
                  {responder.organizationName && (
                    <div className="flex items-center space-x-1.5 text-xs text-amber-300 font-bold">
                      <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{responder.organizationName}</span>
                    </div>
                  )}
                  {responder.userId || responder.userEmail ? (
                    <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                      <BadgeCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">Approved User: {responder.userEmail || 'Verified Responder'}</span>
                    </div>
                  ) : null}
                </div>

                {/* Details Section */}
                <div className="space-y-2 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
                  {responder.coverageArea && (
                    <div className="text-[11px] text-slate-300 flex items-start space-x-1.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">Designated Corridor / Area</span>
                        <span className="font-semibold text-slate-200">{responder.coverageArea}</span>
                      </div>
                    </div>
                  )}

                  {responder.phone && (
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500 flex items-center gap-1 font-sans">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>Direct:</span>
                      </span>
                      <a
                        href={`tel:${responder.phone.replace(/\s+/g, '')}`}
                        className="text-amber-300 hover:underline hover:text-amber-200 font-bold flex items-center gap-1"
                      >
                        <span>{responder.phone}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    </div>
                  )}

                  {responder.notes && (
                    <p className="text-[10px] text-slate-500 italic line-clamp-2 pt-0.5">
                      "{responder.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  {isDeleting ? (
                    <div className="flex items-center space-x-1.5 w-full">
                      <span className="text-[10px] text-red-400 font-bold shrink-0">Confirm delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(responder.id)}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black rounded-lg transition"
                      >
                        Yes, Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[9px] text-slate-500 font-mono">
                        ID: {responder.id.slice(0, 10)}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(responder)}
                          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/60 text-slate-300 transition text-xs flex items-center space-x-1 cursor-pointer"
                          title="Edit Responder Partner"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(responder.id)}
                          className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 border border-slate-700/60 text-slate-400 transition text-xs flex items-center space-x-1 cursor-pointer"
                          title="Delete Responder Unit"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Responder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0A0F1A] border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider">
                    {editingResponder ? 'Edit Responder / Partner' : 'Add New Responder Unit'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {editingResponder
                      ? `Updating details for ${editingResponder.callsign}`
                      : 'Create a new dispatch unit for the Emergency SOS dropdown'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* Officer / Partner Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Officer / Unit / Contact Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Tactical Officer Botha or AutoCheck Roadside"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Company / Organization Affiliation */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Company or Organization Affiliated</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Netcare 911, Tracker SA, CPF Ward 4, Emer-G-Med, Private Towing"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-medium"
                />
                <p className="text-[10px] text-slate-500">
                  For registered responders, specify the legal operating entity or patrol department.
                </p>
              </div>

              {/* Unit Type & Callsign */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Responder Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ResponderPartner['type'] })
                    }
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
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

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Callsign / Vehicle ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patrol Unit Bravo-1"
                    value={formData.callsign}
                    onChange={(e) => setFormData({ ...formData, callsign: e.target.value })}
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Phone & Coverage Corridor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Direct Radio / Cell Phone
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +27 82 555 1290 or 10111"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-300">
                    Designated Operating Area / Corridor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. N1 Midrand to Centurion, R21, M1 South"
                    value={formData.coverageArea}
                    onChange={(e) => setFormData({ ...formData, coverageArea: e.target.value })}
                    className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Area Fill Chips */}
              <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">
                  Quick-Select Common Gauteng Corridors:
                </span>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_COVERAGE_AREAS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setFormData({ ...formData, coverageArea: area })}
                      className="px-2 py-0.5 rounded text-[9px] bg-[#05080E] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Label (Optional) */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Custom Dropdown Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 🚓 Tactical Officer Botha (Bravo-1)"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-slate-500">
                  Leave blank to auto-generate icon, name and callsign formatting.
                </p>
              </div>

              {/* Operational Notes */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Tactical Equipment & Equipment Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Equipped with heavy tyre jacks, puncture plug kits, spotlight bar, armed tactical escort certified."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Active in SOS Dispatch Dropdown</span>
                  <span className="text-[10px] text-slate-400">
                    When active, this responder appears in the 1-click select dropdown.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>{editingResponder ? 'Save Changes' : 'Create Responder Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
