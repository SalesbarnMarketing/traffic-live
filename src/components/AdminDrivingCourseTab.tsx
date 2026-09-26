import React, { useState, useEffect } from 'react';
import {
  Shield,
  Award,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  Car,
  UserCheck,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { DrivingCourseSettings, DrivingCourseSession, DrivingCourseRegistration } from '../types';

interface AdminDrivingCourseTabProps {
  adminUserName?: string;
  onRefreshStats?: () => void;
}

export const AdminDrivingCourseTab: React.FC<AdminDrivingCourseTabProps> = ({
  adminUserName = 'Admin',
  onRefreshStats
}) => {
  const [settings, setSettings] = useState<DrivingCourseSettings | null>(null);
  const [registrations, setRegistrations] = useState<DrivingCourseRegistration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'sessions' | 'registrations' | 'settings'>('sessions');

  // Filters for registrations
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState<'all' | 'Johannesburg' | 'Pretoria'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'paid' | 'pending' | 'verified'>('all');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');

  // Modal: Add / Edit Session
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<DrivingCourseSession | null>(null);
  const [sessionFormLocation, setSessionFormLocation] = useState<'Johannesburg' | 'Pretoria'>('Johannesburg');
  const [sessionFormVenue, setSessionFormVenue] = useState('');
  const [sessionFormAddress, setSessionFormAddress] = useState('');
  const [sessionFormDate, setSessionFormDate] = useState('');
  const [sessionFormStartTime, setSessionFormStartTime] = useState('08:00');
  const [sessionFormEndTime, setSessionFormEndTime] = useState('16:00');
  const [sessionFormPrice, setSessionFormPrice] = useState(1850);
  const [sessionFormInstructor, setSessionFormInstructor] = useState('');
  const [sessionFormNotes, setSessionFormNotes] = useState('');

  // Modal: Attendee Details
  const [selectedRegistration, setSelectedRegistration] = useState<DrivingCourseRegistration | null>(null);

  // Fetch Settings & Registrations
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, regRes] = await Promise.all([
        fetch('/api/driving-course/settings'),
        fetch('/api/driving-course/registrations')
      ]);
      const settingsData = await settingsRes.json();
      const regData = await regRes.json();

      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings);
      }
      if (regData.success && Array.isArray(regData.registrations)) {
        setRegistrations(regData.registrations);
      }
    } catch (err) {
      console.error('Failed to load driving course admin data:', err);
      showStatus('Failed to load driving course settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // 1. MASTER TOGGLE: Visibility ON/OFF
  const handleToggleVisibility = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const newVisibility = !settings.isVisible;
      const res = await fetch('/api/driving-course/toggle-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isVisible: newVisibility,
          updatedBy: adminUserName
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => (prev ? { ...prev, isVisible: newVisibility } : null));
        showStatus(
          `Driving Course is now ${newVisibility ? 'VISIBLE on the website' : 'HIDDEN / PAUSED (Registrations paused)'}`,
          newVisibility ? 'success' : 'info'
        );
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      showStatus('Error updating course visibility.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Open Add Session Modal
  const handleOpenAddSession = () => {
    setEditingSession(null);
    setSessionFormLocation('Johannesburg');
    setSessionFormVenue('Midrand / Kyalami Tactical Training Track');
    setSessionFormAddress('R55 & Allandale Rd Corridor, Midrand, Johannesburg');
    setSessionFormDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setSessionFormStartTime('08:00');
    setSessionFormEndTime('16:00');
    setSessionFormPrice(settings?.pricePerSeat || 1850);
    setSessionFormInstructor('Chief Instructor Van Niekerk');
    setSessionFormNotes('Class strictly capped at 10 participants.');
    setIsSessionModalOpen(true);
  };

  // 3. Open Edit Session Modal
  const handleOpenEditSession = (session: DrivingCourseSession) => {
    setEditingSession(session);
    setSessionFormLocation(session.location === 'Pretoria' ? 'Pretoria' : 'Johannesburg');
    setSessionFormVenue(session.venueName);
    setSessionFormAddress(session.address || '');
    setSessionFormDate(session.date);
    setSessionFormStartTime(session.startTime || '08:00');
    setSessionFormEndTime(session.endTime || '16:00');
    setSessionFormPrice(session.price || 1850);
    setSessionFormInstructor(session.instructorName || '');
    setSessionFormNotes(session.notes || '');
    setIsSessionModalOpen(true);
  };

  // 4. Save Session (Create or Update)
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionFormVenue || !sessionFormDate) {
      showStatus('Please provide venue and date.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (editingSession) {
        // Update existing
        const res = await fetch(`/api/driving-course/sessions/${editingSession.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: sessionFormLocation,
            venueName: sessionFormVenue,
            address: sessionFormAddress,
            date: sessionFormDate,
            startTime: sessionFormStartTime,
            endTime: sessionFormEndTime,
            price: Number(sessionFormPrice),
            instructorName: sessionFormInstructor,
            notes: sessionFormNotes,
            updatedBy: adminUserName
          })
        });
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          showStatus('Class date updated successfully.');
          setIsSessionModalOpen(false);
        }
      } else {
        // Create new
        const res = await fetch('/api/driving-course/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: sessionFormLocation,
            venueName: sessionFormVenue,
            address: sessionFormAddress,
            date: sessionFormDate,
            startTime: sessionFormStartTime,
            endTime: sessionFormEndTime,
            price: Number(sessionFormPrice),
            instructorName: sessionFormInstructor,
            notes: sessionFormNotes,
            updatedBy: adminUserName
          })
        });
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
          showStatus(`Scheduled new class for ${sessionFormLocation} (${sessionFormDate})`);
          setIsSessionModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Error saving session:', err);
      showStatus('Failed to save session.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Delete Session
  const handleDeleteSession = async (id: string, location: string, date: string) => {
    if (!window.confirm(`Are you sure you want to delete the class date for ${location} on ${date}?`)) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/driving-course/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        showStatus(`Deleted class session for ${location} (${date})`);
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      showStatus('Failed to delete session.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Toggle Individual Session Open/Closed
  const handleToggleSessionStatus = async (session: DrivingCourseSession) => {
    const newIsOpen = !session.isOpen;
    try {
      const res = await fetch(`/api/driving-course/sessions/${session.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOpen: newIsOpen,
          status: newIsOpen ? (session.bookedCount >= 10 ? 'full' : 'open') : 'cancelled',
          updatedBy: adminUserName
        })
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        showStatus(`Session ${session.location} (${session.date}) is now ${newIsOpen ? 'OPEN' : 'CLOSED'}`);
      }
    } catch (err) {
      console.error('Error toggling session:', err);
    }
  };

  // 7. Verify Driver's License & Update Registration Status
  const handleUpdateRegistration = async (
    id: string,
    updates: Partial<DrivingCourseRegistration>
  ) => {
    try {
      const res = await fetch(`/api/driving-course/registrations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          updatedBy: adminUserName
        })
      });
      const data = await res.json();
      if (data.success && data.registration) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.registration } : r))
        );
        if (selectedRegistration && selectedRegistration.id === id) {
          setSelectedRegistration((prev) => (prev ? { ...prev, ...data.registration } : null));
        }
        showStatus(`Registration #${data.registration.referenceNumber} updated.`);
      }
    } catch (err) {
      console.error('Error updating registration:', err);
      showStatus('Failed to update registration status.', 'error');
    }
  };

  // 8. Delete / Cancel Registration
  const handleDeleteRegistration = async (reg: DrivingCourseRegistration) => {
    if (!window.confirm(`Cancel registration #${reg.referenceNumber} for ${reg.fullName} ${reg.surname}? Slot will be restored.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/driving-course/registrations/${reg.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRegistrations((prev) => prev.filter((r) => r.id !== reg.id));
        if (data.settings) setSettings(data.settings);
        if (selectedRegistration?.id === reg.id) setSelectedRegistration(null);
        showStatus(`Registration #${reg.referenceNumber} cancelled and slot restored.`);
      }
    } catch (err) {
      console.error('Error deleting registration:', err);
      showStatus('Failed to cancel registration.', 'error');
    }
  };

  // 9. Export Attendee Roster to CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = [
      'Ref Number',
      'Full Name',
      'Surname',
      'SA ID Number',
      'Driver License No',
      'License Code',
      'Location',
      'Session Date',
      'Venue',
      'Phone',
      'Email',
      'Payment Status',
      'License Verified',
      'Status',
      'Registered At'
    ];

    const rows = registrations.map((r) => [
      r.referenceNumber,
      `"${r.fullName}"`,
      `"${r.surname}"`,
      `"${r.idNumber}"`,
      `"${r.driversLicenseNumber}"`,
      `"${r.licenseCode}"`,
      r.sessionLocation,
      r.sessionDate,
      `"${r.sessionVenue}"`,
      `"${r.phone}"`,
      r.email,
      r.paymentStatus,
      r.licenseVerified ? 'YES' : 'NO',
      r.status,
      r.registeredAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LiveTrafficNPC_Driving_Course_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRegistrations = registrations.filter((r) => {
    if (filterLocation !== 'all' && r.sessionLocation !== filterLocation) return false;
    if (filterPayment !== 'all' && r.paymentStatus !== filterPayment) return false;
    if (selectedSessionId !== 'all' && r.sessionId !== selectedSessionId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${r.fullName} ${r.surname}`.toLowerCase().includes(q);
      const matchId = (r.idNumber || '').toLowerCase().includes(q);
      const matchLicense = (r.driversLicenseNumber || '').toLowerCase().includes(q);
      const matchRef = (r.referenceNumber || '').toLowerCase().includes(q);
      const matchEmail = (r.email || '').toLowerCase().includes(q);
      const matchPhone = (r.phone || '').toLowerCase().includes(q);
      return matchName || matchId || matchLicense || matchRef || matchEmail || matchPhone;
    }
    return true;
  });

  const totalSessions = settings?.sessions?.length || 0;
  const totalBookings = registrations.length;
  const verifiedLicenses = registrations.filter((r) => r.licenseVerified).length;
  const paidAttendees = registrations.filter((r) => r.paymentStatus === 'paid' || r.paymentStatus === 'verified').length;

  return (
    <div className="space-y-6 text-slate-200">
      {/* Top Banner Status */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-sm font-bold animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-red-950/80 border-red-500/60 text-red-200'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MASTER CONTROL & VISIBILITY TOGGLE BANNER                               */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-[#0C1424] via-[#0E1A2E] to-[#070A10] border-2 border-[#D4A237] rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#D4A237]/20 border border-[#D4A237] flex items-center justify-center text-[#D4A237] shrink-0 mt-1 shadow-inner">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-widest text-[#D4A237] bg-[#070A10] px-2.5 py-0.5 rounded-full border border-[#D4A237]/40">
                  ADMIN CONTROL PANEL
                </span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-950/90 text-rose-300 border border-rose-500/50">
                  Strict Max 10 Per Class
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
                Advanced Driving Course Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5 leading-relaxed">
                Control course visibility on the live website. Classes are restricted to batches of 10 for track safety in <strong className="text-white">Johannesburg</strong> and <strong className="text-white">Pretoria</strong>. Mandatory ID and Valid Driver's License verification.
              </p>
            </div>
          </div>

          {/* MASTER VISIBILITY BUTTON */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 bg-[#05080E] p-3 rounded-2xl border border-[#D4A237]/40">
            <div className="text-center sm:text-right">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Website Visibility Status
              </span>
              <span
                className={`text-xs sm:text-sm font-black uppercase tracking-wide flex items-center justify-center sm:justify-end space-x-1 ${
                  settings?.isVisible ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block ${
                    settings?.isVisible ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                ></span>
                <span>{settings?.isVisible ? 'COURSE IS LIVE (ON)' : 'COURSE IS HIDDEN (OFF)'}</span>
              </span>
            </div>

            <button
              onClick={handleToggleVisibility}
              disabled={isSaving}
              className={`px-5 py-3 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 transition shadow-xl cursor-pointer transform active:scale-95 border ${
                settings?.isVisible
                  ? 'bg-amber-500 hover:bg-amber-400 text-black border-amber-300 shadow-amber-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/50'
              }`}
            >
              {settings?.isVisible ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>Turn Course OFF</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Turn Course ON</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* REASON & RULES REMINDER BOX */}
        <div className="bg-[#05080E]/90 border border-amber-500/40 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-300">
          <AlertCircle className="w-5 h-5 text-[#D4A237] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-200">
              <span className="text-[#D4A237] uppercase">Operational Rule:</span> We only take a class of 10 at a go. We advertise confirmed dates in advance so instructors and skidpan facilities can prepare.
            </p>
            <p className="text-slate-400">
              Turning the course <strong>OFF</strong> prevents unannounced walk-ins or motorists paying and expecting to arrive the next day. To register, motorists must provide an <strong>ID number</strong> plus <strong>valid driver's license</strong>.
            </p>
          </div>
        </div>

        {/* STATS METRICS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#070A10] border border-[#D4A237]/30 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Total Scheduled</span>
            <span className="text-2xl font-black text-white">{totalSessions} Classes</span>
            <span className="text-[10px] text-[#D4A237] font-semibold block">JHB & Pretoria</span>
          </div>

          <div className="bg-[#070A10] border border-[#D4A237]/30 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Registered Drivers</span>
            <span className="text-2xl font-black text-white">{totalBookings}</span>
            <span className="text-[10px] text-emerald-400 font-semibold block">{paidAttendees} Paid / Verified</span>
          </div>

          <div className="bg-[#070A10] border border-[#D4A237]/30 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Verified Licenses</span>
            <span className="text-2xl font-black text-emerald-400">{verifiedLicenses}</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Validated by Patrol</span>
          </div>

          <div className="bg-[#070A10] border border-[#D4A237]/30 rounded-2xl p-3 text-center">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Class Limit</span>
            <span className="text-2xl font-black text-[#D4A237]">10 Max</span>
            <span className="text-[10px] text-slate-400 font-semibold block">Strict Seat Cap</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. NAVIGATION SUB-TABS                                                     */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-[#D4A237]/30 pb-3 flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer ${
              activeSubTab === 'sessions'
                ? 'bg-[#FAF4EA] text-[#070A10] border border-[#D4A237] shadow-lg'
                : 'bg-[#0A0F1A] text-slate-300 hover:text-white border border-[#D4A237]/30 hover:border-[#D4A237]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Scheduled Class Dates ({totalSessions})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('registrations')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer ${
              activeSubTab === 'registrations'
                ? 'bg-[#FAF4EA] text-[#070A10] border border-[#D4A237] shadow-lg'
                : 'bg-[#0A0F1A] text-slate-300 hover:text-white border border-[#D4A237]/30 hover:border-[#D4A237]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Attendee Roster ({totalBookings})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center space-x-2 transition cursor-pointer ${
              activeSubTab === 'settings'
                ? 'bg-[#FAF4EA] text-[#070A10] border border-[#D4A237] shadow-lg'
                : 'bg-[#0A0F1A] text-slate-300 hover:text-white border border-[#D4A237]/30 hover:border-[#D4A237]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Curriculum & Settings</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {activeSubTab === 'sessions' && (
            <button
              onClick={handleOpenAddSession}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg cursor-pointer transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Date</span>
            </button>
          )}

          {activeSubTab === 'registrations' && (
            <button
              onClick={handleExportCSV}
              className="bg-[#0A0F1A] hover:bg-[#121B2C] text-[#D4A237] border border-[#D4A237] font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow cursor-pointer transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Roster</span>
            </button>
          )}

          <button
            onClick={fetchData}
            className="p-2 bg-[#0A0F1A] hover:bg-[#121B2C] text-slate-300 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TAB 1: SCHEDULED CLASS DATES                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings?.sessions && settings.sessions.length > 0 ? (
              settings.sessions.map((session) => {
                const slotsRemaining = Math.max(0, session.maxCapacity - session.bookedCount);
                const isFull = session.bookedCount >= session.maxCapacity || session.status === 'full';
                const isPta = session.location.toLowerCase().includes('pretoria');

                return (
                  <div
                    key={session.id}
                    className={`bg-[#0A0F1A] border-2 rounded-3xl p-5 flex flex-col justify-between space-y-4 transition shadow-xl ${
                      isFull
                        ? 'border-red-500/50 bg-red-950/10'
                        : isPta
                        ? 'border-blue-500/50 hover:border-blue-400'
                        : 'border-[#D4A237]/50 hover:border-[#D4A237]'
                    }`}
                  >
                    {/* Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${
                            isPta
                              ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                              : 'bg-amber-950 text-[#D4A237] border-[#D4A237]/50'
                          }`}
                        >
                          {session.location} Session
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            isFull
                              ? 'bg-red-950 text-red-300 border border-red-500/50'
                              : session.isOpen
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {isFull ? 'CLASS FULL (10/10)' : session.isOpen ? 'OPEN FOR BOOKING' : 'BOOKINGS PAUSED'}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        {session.venueName}
                      </h3>

                      <p className="text-xs text-slate-400 flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D4A237] shrink-0" />
                        <span>{session.address || `${session.location} Track Grounds`}</span>
                      </p>
                    </div>

                    {/* Date & Time info */}
                    <div className="bg-[#05080E] p-3 rounded-2xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block font-semibold">Date</span>
                        <span className="text-white font-black">{session.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Time</span>
                        <span className="text-white font-black">{session.startTime} - {session.endTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Course Price</span>
                        <span className="text-[#D4A237] font-black">R{session.price}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-semibold">Lead Instructor</span>
                        <span className="text-slate-200 font-bold truncate block">{session.instructorName || 'Patrol Lead'}</span>
                      </div>
                    </div>

                    {/* 10-CAPACITY PROGRESS METER */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300 uppercase">
                          Class Capacity: <strong className="text-white">{session.bookedCount}</strong> / 10 Drivers
                        </span>
                        <span className={slotsRemaining > 0 ? 'text-emerald-400' : 'text-red-400 font-black'}>
                          {slotsRemaining > 0 ? `${slotsRemaining} slots remaining` : 'SOLD OUT'}
                        </span>
                      </div>

                      {/* Visual Meter */}
                      <div className="w-full bg-[#05080E] h-3 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull
                              ? 'bg-red-500'
                              : session.bookedCount >= 7
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, (session.bookedCount / 10) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleSessionStatus(session)}
                        className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                          session.isOpen
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 hover:bg-amber-900'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                        }`}
                      >
                        {session.isOpen ? 'Pause Bookings' : 'Open Bookings'}
                      </button>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            setActiveSubTab('registrations');
                          }}
                          className="px-3 py-1.5 bg-[#0C1626] hover:bg-[#122238] text-[#D4A237] border border-[#D4A237]/40 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          View Drivers
                        </button>

                        <button
                          onClick={() => handleOpenEditSession(session)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer"
                          title="Edit Session"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteSession(session.id, session.location, session.date)}
                          className="p-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl transition cursor-pointer"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12 bg-[#0A0F1A] border border-dashed border-slate-700 rounded-3xl space-y-3">
                <Car className="w-12 h-12 text-slate-500 mx-auto" />
                <h4 className="text-base font-bold text-white uppercase">No Scheduled Class Dates</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click "Schedule New Date" to add your first batch of 10 in Johannesburg or Pretoria.
                </p>
                <button
                  onClick={handleOpenAddSession}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-xl inline-flex items-center space-x-1 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Class Date</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB 2: ATTENDEE ROSTER & ID/LICENSE VERIFICATION                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'registrations' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-[#0A0F1A] border border-[#D4A237]/30 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, ID, driver license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D4A237]"
              />
            </div>

            {/* Location filter */}
            <div>
              <select
                value={filterLocation}
                onChange={(e: any) => setFilterLocation(e.target.value)}
                className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A237]"
              >
                <option value="all">All Locations (JHB & PTA)</option>
                <option value="Johannesburg">Johannesburg Only</option>
                <option value="Pretoria">Pretoria Only</option>
              </select>
            </div>

            {/* Payment filter */}
            <div>
              <select
                value={filterPayment}
                onChange={(e: any) => setFilterPayment(e.target.value)}
                className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A237]"
              >
                <option value="all">All Payment Statuses</option>
                <option value="paid">Paid (Online PayFast)</option>
                <option value="verified">Verified (EFT Transfer)</option>
                <option value="pending">Pending Payment</option>
              </select>
            </div>

            {/* Session selector filter */}
            <div>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-[#D4A237]"
              >
                <option value="all">All Scheduled Dates</option>
                {settings?.sessions?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.location} - {s.date} ({s.bookedCount}/10)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registrations Table */}
          <div className="bg-[#0A0F1A] border border-[#D4A237]/40 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#05080E] text-slate-400 uppercase font-black tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ref # & Date</th>
                    <th className="py-3 px-4">Driver Name</th>
                    <th className="py-3 px-4">SA ID Number</th>
                    <th className="py-3 px-4">Driver's License</th>
                    <th className="py-3 px-4">Location / Track</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRegistrations.length > 0 ? (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-[#0E1726] transition">
                        <td className="py-3 px-4 font-mono font-bold text-[#D4A237]">
                          <div>{reg.referenceNumber}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{reg.sessionDate}</div>
                        </td>

                        <td className="py-3 px-4 font-bold text-white">
                          <div>{reg.fullName} {reg.surname}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{reg.phone}</div>
                        </td>

                        {/* ID NUMBER (MANDATORY REQUIREMENT) */}
                        <td className="py-3 px-4 font-mono text-slate-200">
                          <span className="bg-[#05080E] px-2 py-1 rounded border border-slate-700 text-xs font-bold text-amber-300">
                            {reg.idNumber}
                          </span>
                        </td>

                        {/* DRIVER'S LICENSE NUMBER */}
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-white">{reg.driversLicenseNumber}</div>
                          <div className="text-[10px] text-slate-400">{reg.licenseCode || 'Code B'}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              reg.sessionLocation.toLowerCase().includes('pretoria')
                                ? 'bg-blue-950 text-blue-300 border border-blue-500/40'
                                : 'bg-amber-950 text-[#D4A237] border border-[#D4A237]/40'
                            }`}
                          >
                            {reg.sessionLocation}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              reg.paymentStatus === 'paid' || reg.paymentStatus === 'verified'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {reg.paymentStatus.toUpperCase()}
                          </span>
                        </td>

                        {/* License Verification Badge */}
                        <td className="py-3 px-4">
                          {reg.licenseVerified ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleUpdateRegistration(reg.id, { licenseVerified: true })}
                              className="text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-500/50 hover:bg-amber-900 px-2 py-0.5 rounded-full transition cursor-pointer"
                            >
                              Verify ID & License
                            </button>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => setSelectedRegistration(reg)}
                            className="px-2.5 py-1 bg-[#0C1626] hover:bg-[#122238] text-[#D4A237] border border-[#D4A237]/40 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Details
                          </button>

                          <button
                            onClick={() => handleDeleteRegistration(reg)}
                            className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/60 rounded-lg transition cursor-pointer"
                            title="Cancel Driver"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        No registrations match your search filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 3: CURRICULUM & GLOBAL SETTINGS                                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'settings' && settings && (
        <div className="bg-[#0A0F1A] border border-[#D4A237]/40 rounded-3xl p-5 sm:p-6 space-y-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight">
            Course Pricing & Public Descriptions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Standard Course Fee (ZAR)
              </label>
              <input
                type="number"
                value={settings.pricePerSeat}
                onChange={(e) =>
                  setSettings((prev) => (prev ? { ...prev, pricePerSeat: Number(e.target.value) } : null))
                }
                className="w-full px-3.5 py-2.5 bg-[#05080E] border border-slate-700 rounded-xl text-sm font-bold text-[#D4A237] focus:outline-none focus:border-[#D4A237]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Course Heading Title
              </label>
              <input
                type="text"
                value={settings.title}
                onChange={(e) =>
                  setSettings((prev) => (prev ? { ...prev, title: e.target.value } : null))
                }
                className="w-full px-3.5 py-2.5 bg-[#05080E] border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#D4A237]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Mandatory Requirements Notice (Shown on Public Portal)
              </label>
              <textarea
                rows={2}
                value={settings.requirementsNotice}
                onChange={(e) =>
                  setSettings((prev) => (prev ? { ...prev, requirementsNotice: e.target.value } : null))
                }
                className="w-full px-3.5 py-2.5 bg-[#05080E] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#D4A237]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Waitlist Notice (Shown when sessions reach 10 capacity)
              </label>
              <textarea
                rows={2}
                value={settings.waitlistNoticeText}
                onChange={(e) =>
                  setSettings((prev) => (prev ? { ...prev, waitlistNoticeText: e.target.value } : null))
                }
                className="w-full px-3.5 py-2.5 bg-[#05080E] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-[#D4A237]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              onClick={async () => {
                setIsSaving(true);
                try {
                  const res = await fetch('/api/driving-course/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...settings,
                      updatedBy: adminUserName
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    showStatus('Settings saved successfully.');
                  }
                } catch (err) {
                  showStatus('Error saving settings.', 'error');
                } finally {
                  setIsSaving(false);
                }
              }}
              className="bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition shadow cursor-pointer"
            >
              Save Course Settings
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: ADD / EDIT CLASS DATE                                           */}
      {/* ========================================================================= */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0C1220] border-2 border-[#D4A237] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp my-auto text-slate-200">
            <div className="p-4 sm:p-5 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Car className="w-5 h-5 text-[#D4A237]" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingSession ? 'Edit Class Date' : 'Schedule New Class Date'}
                </h3>
              </div>
              <button
                onClick={() => setIsSessionModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="p-5 space-y-4 text-xs">
              {/* Location Select (JHB vs Pretoria) */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Location (Gauteng Region)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSessionFormLocation('Johannesburg');
                      if (!sessionFormVenue || sessionFormVenue.includes('Zwartkops')) {
                        setSessionFormVenue('Midrand / Kyalami Tactical Training Track');
                        setSessionFormAddress('R55 & Allandale Rd Corridor, Midrand, Johannesburg');
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl font-black uppercase tracking-wider text-xs border transition cursor-pointer ${
                      sessionFormLocation === 'Johannesburg'
                        ? 'bg-[#FAF4EA] text-[#070A10] border-[#D4A237]'
                        : 'bg-[#05080E] text-slate-300 border-slate-700'
                    }`}
                  >
                    Johannesburg
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSessionFormLocation('Pretoria');
                      if (!sessionFormVenue || sessionFormVenue.includes('Kyalami')) {
                        setSessionFormVenue('Zwartkops Raceway Skidpan & Dynamics Arena');
                        setSessionFormAddress('R55 Hennops River, Centurion, Pretoria West');
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl font-black uppercase tracking-wider text-xs border transition cursor-pointer ${
                      sessionFormLocation === 'Pretoria'
                        ? 'bg-[#FAF4EA] text-[#070A10] border-[#D4A237]'
                        : 'bg-[#05080E] text-slate-300 border-slate-700'
                    }`}
                  >
                    Pretoria
                  </button>
                </div>
              </div>

              {/* Venue Name */}
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">
                  Venue Name & Training Ground
                </label>
                <input
                  type="text"
                  required
                  value={sessionFormVenue}
                  onChange={(e) => setSessionFormVenue(e.target.value)}
                  placeholder="e.g. Midrand / Kyalami Tactical Training Track"
                  className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                />
              </div>

              {/* Date and Times */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Class Date
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionFormDate}
                    onChange={(e) => setSessionFormDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={sessionFormStartTime}
                    onChange={(e) => setSessionFormStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={sessionFormEndTime}
                    onChange={(e) => setSessionFormEndTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                  />
                </div>
              </div>

              {/* Instructor and Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Lead Instructor
                  </label>
                  <input
                    type="text"
                    value={sessionFormInstructor}
                    onChange={(e) => setSessionFormInstructor(e.target.value)}
                    placeholder="Chief Instructor"
                    className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">
                    Seat Price (Rands)
                  </label>
                  <input
                    type="number"
                    value={sessionFormPrice}
                    onChange={(e) => setSessionFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-[#D4A237] font-bold focus:outline-none focus:border-[#D4A237]"
                  />
                </div>
              </div>

              {/* Max Capacity Notice */}
              <div className="bg-[#05080E] p-3 rounded-xl border border-amber-500/30 text-slate-300">
                <span className="font-bold text-[#D4A237] uppercase block">Capacity: 10 Drivers Strictly</span>
                <span>The booking system will automatically close this session when 10 drivers register.</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingSession ? 'Update Date' : 'Schedule Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: ATTENDEE FULL DETAIL & VERIFICATION                             */}
      {/* ========================================================================= */}
      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0C1220] border-2 border-[#D4A237] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp my-auto text-slate-200">
            <div className="p-4 sm:p-5 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-[#D4A237]" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  Driver Dossier: #{selectedRegistration.referenceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRegistration(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#05080E] p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Driver Full Name</span>
                  <span className="text-sm font-black text-white">{selectedRegistration.fullName} {selectedRegistration.surname}</span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Contact Cell</span>
                  <a href={`tel:${selectedRegistration.phone}`} className="text-sm font-bold text-emerald-400">
                    {selectedRegistration.phone}
                  </a>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">South African ID Number</span>
                  <span className="font-mono font-bold text-amber-300 text-sm bg-black/50 px-2 py-0.5 rounded border border-amber-500/40">
                    {selectedRegistration.idNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Driver's License Number</span>
                  <span className="font-mono font-bold text-white text-sm bg-black/50 px-2 py-0.5 rounded border border-slate-700">
                    {selectedRegistration.driversLicenseNumber}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">License Code</span>
                  <span className="font-bold text-slate-200">{selectedRegistration.licenseCode}</span>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Email Address</span>
                  <span className="text-slate-200 truncate block">{selectedRegistration.email}</span>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Registered Session</span>
                  <span className="font-bold text-white">{selectedRegistration.sessionLocation} - {selectedRegistration.sessionVenue} ({selectedRegistration.sessionDate})</span>
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-[#05080E] p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-300">ID & Driver's License Verified:</span>
                  <button
                    onClick={() =>
                      handleUpdateRegistration(selectedRegistration.id, {
                        licenseVerified: !selectedRegistration.licenseVerified
                      })
                    }
                    className={`px-3 py-1 rounded-full font-black text-xs uppercase border cursor-pointer ${
                      selectedRegistration.licenseVerified
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-amber-950 text-amber-300 border-amber-500'
                    }`}
                  >
                    {selectedRegistration.licenseVerified ? 'VERIFIED' : 'MARK VERIFIED'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#05080E] p-3 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-300">Payment Status:</span>
                  <select
                    value={selectedRegistration.paymentStatus}
                    onChange={(e: any) =>
                      handleUpdateRegistration(selectedRegistration.id, {
                        paymentStatus: e.target.value
                      })
                    }
                    className="bg-[#0A0F1A] border border-slate-700 text-xs font-bold text-white px-3 py-1 rounded-lg"
                  >
                    <option value="paid">Paid (Online)</option>
                    <option value="verified">Verified (EFT Transfer)</option>
                    <option value="pending">Pending Payment</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
