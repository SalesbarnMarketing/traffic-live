import React, { useState, useEffect } from 'react';
import {
  Shield,
  Award,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Car,
  CreditCard,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Radio,
  FileText,
  AlertOctagon,
  Copy,
  ExternalLink,
  Lock,
  Compass
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { DrivingCourseSettings, DrivingCourseSession, DrivingCourseRegistration, RegisteredUser } from '../types';
import { initiatePayFastPayment, submitPayFastForm, PayFastPaymentResponse } from '../utils/payfast';

interface DrivingCourseSectionProps {
  currentUser?: RegisteredUser | null;
  onSwitchTab?: (tab: any) => void;
  onOpenSOSModal?: () => void;
}

export const DrivingCourseSection: React.FC<DrivingCourseSectionProps> = ({
  currentUser,
  onSwitchTab,
  onOpenSOSModal
}) => {
  const [settings, setSettings] = useState<DrivingCourseSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<'all' | 'Johannesburg' | 'Pretoria'>('all');

  // Booking Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<DrivingCourseSession | null>(null);

  // Form Fields (Mandatory ID + Drivers License)
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [surname, setSurname] = useState(currentUser?.surname || '');
  const [idNumber, setIdNumber] = useState('');
  const [driversLicenseNumber, setDriversLicenseNumber] = useState('');
  const [licenseCode, setLicenseCode] = useState('Code B (Light Motor Vehicle)');
  const [licenseExpiryDate, setLicenseExpiryDate] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.cellNumber || '');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'payfast' | 'eft'>('payfast');

  // Submission / Flow States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successRegistration, setSuccessRegistration] = useState<DrivingCourseRegistration | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // PayFast dynamic fallback modal
  const [payfastModalData, setPayfastModalData] = useState<{
    processUrl: string;
    paymentFields: Record<string, string>;
    paymentId: string;
  } | null>(null);

  // Fetch settings & sessions
  const fetchCourseData = async () => {
    try {
      const res = await fetch('/api/driving-course/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Error fetching driving course data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, []);

  // Sync user details if logged in
  useEffect(() => {
    if (currentUser) {
      if (!fullName) setFullName(currentUser.fullName || '');
      if (!surname) setSurname(currentUser.surname || '');
      if (!email) setEmail(currentUser.email || '');
      if (!phone) setPhone(currentUser.cellNumber || '');
    }
  }, [currentUser]);

  const handleOpenRegistration = (session: DrivingCourseSession) => {
    setSelectedSession(session);
    setErrorMessage(null);
    setSuccessRegistration(null);
    setPayfastModalData(null);
    setIsRegisterModalOpen(true);
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Submit Registration
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;
    setErrorMessage(null);

    // Validation
    if (!fullName.trim() || !surname.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage('Please fill in your Full Name, Surname, Email, and Phone Number.');
      return;
    }

    const cleanId = idNumber.trim().replace(/\s+/g, '');
    if (!cleanId || cleanId.length < 6) {
      setErrorMessage('A valid South African ID Number or Passport Number is strictly required to register.');
      return;
    }

    const cleanLicense = driversLicenseNumber.trim();
    if (!cleanLicense || cleanLicense.length < 4) {
      setErrorMessage('A valid Driver\'s License Number is strictly required to register for track sessions.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        sessionId: selectedSession.id,
        fullName: fullName.trim(),
        surname: surname.trim(),
        idNumber: cleanId,
        driversLicenseNumber: cleanLicense,
        licenseCode,
        licenseExpiryDate,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        emergencyContactName,
        emergencyContactPhone,
        vehicleMakeModel,
        specialRequirements,
        paymentMethod
      };

      const res = await fetch('/api/driving-course/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      setSuccessRegistration(data.registration);
      // Refresh course data to update capacity counters
      fetchCourseData();

      // If PayFast payment is selected, trigger payment gateway
      if (paymentMethod === 'payfast') {
        const pfResult: PayFastPaymentResponse = await initiatePayFastPayment({
          amount: data.registration.amount || selectedSession.price || 1850,
          itemName: `Advanced Driving Course: ${selectedSession.location} (${selectedSession.date})`,
          itemDescription: `Live Traffic NPC Driving Course for ${fullName} ${surname} (ID: ${cleanId}, Ref: ${data.registration.referenceNumber})`,
          category: 'driving_course',
          donorName: `${fullName.trim()} ${surname.trim()}`,
          donorEmail: email.trim().toLowerCase(),
          donorPhone: phone.trim(),
          message: `Reg Ref: ${data.registration.referenceNumber} | ID: ${cleanId}`
        });

        if (pfResult && pfResult.processUrl && pfResult.paymentFields) {
          try {
            submitPayFastForm(pfResult.processUrl, pfResult.paymentFields);
          } catch (navErr) {
            setPayfastModalData({
              processUrl: pfResult.processUrl,
              paymentFields: pfResult.paymentFields,
              paymentId: pfResult.paymentId || data.registration.referenceNumber
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Registration could not be completed. Please check your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSessions = settings?.sessions?.filter((s) => {
    if (selectedLocationFilter !== 'all' && s.location !== selectedLocationFilter) return false;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 pb-28">
      {/* Top Back Navigation Bar */}
      {onSwitchTab && (
        <div className="bg-[#0A0F1A] border-b border-[#D4A237]/30 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={() => onSwitchTab('dashboard')}
            className="flex items-center space-x-1.5 text-xs font-bold text-[#D4A237] hover:text-white bg-[#05080E] border border-[#D4A237]/40 hover:border-[#D4A237] px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <span>← Back to Options</span>
          </button>
          <button
            onClick={() => onSwitchTab('donations')}
            className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-[#D4A237]/60 bg-[#05080E] border border-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            <span>Support & Donations →</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO HEADER                                                            */}
      {/* ========================================================================= */}
      <div className="relative border-b border-[#D4A237]/40 bg-gradient-to-b from-[#0C1527] via-[#080E1A] to-[#070A10] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#D4A237]/10 blur-3xl pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          {/* Badges */}
          <div className="flex items-center justify-center space-x-2 flex-wrap gap-y-2">
            <span className="bg-[#FAF4EA] text-[#070A10] border border-[#D4A237] font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
              OFFICIAL MOTORIST ACADEMY
            </span>
            <span className="bg-rose-950/90 text-rose-300 border border-rose-500/50 font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-widest shadow-md">
              STRICTLY 10 PER CLASS
            </span>
            <span className="bg-[#05080E] text-[#D4A237] border border-[#D4A237]/50 font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-widest">
              JOHANNESBURG & PRETORIA
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight font-sans drop-shadow-md">
            ADVANCED DEFENSIVE & <span className="text-[#D4A237]">ANTI-HIJACK</span> DRIVING COURSE
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Hands-on wet-weather skidpan recovery, high-speed emergency evasion, vehicle control after spike strikes, and tactical anti-hijack counter-measures under elite instructor guidance.
          </p>

          {/* CLASS SIZE LIMIT & PREPARATION NOTICE (EXACT USER REQUIREMENT) */}
          <div className="bg-[#05080E]/95 border-2 border-[#D4A237]/60 rounded-2xl p-4 sm:p-5 max-w-3xl mx-auto text-left shadow-2xl space-y-2">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4A237]/20 border border-[#D4A237] flex items-center justify-center text-[#D4A237] shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                  WHY CLASS DATES ARE PRE-ADVERTISED (10 DRIVERS MAX)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We restrict each intake to <strong className="text-white">only 10 drivers per class</strong> so every motorist gets guaranteed track time and personalized skidpan coaching. Dates are advertised in advance for proper track preparation in <strong>Johannesburg</strong> or <strong>Pretoria</strong>.
                </p>
                <p className="text-[11px] text-amber-300/90 font-bold">
                  * Notice: To register, you must supply your South African ID number and a valid driver's license. Unannounced next-day walk-ins are not accepted.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. IF ADMIN TURNED COURSE OFF (PAUSED STATE)                               */}
      {/* ========================================================================= */}
      {settings && !settings.isVisible && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
          <div className="bg-[#0A0F1A] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-[#D4A237] bg-[#05080E] px-3 py-1 rounded-full border border-[#D4A237]/40">
                REGISTRATIONS TEMPORARILY PAUSED
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-2">
                Current 10-Driver Batches Are Fully Booked
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
                We are currently preparing track schedules for the upcoming session. Join our VIP WhatsApp Priority Waitlist to be first in line when the next Johannesburg and Pretoria dates open.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://wa.me/27677083048?text=Hello%20Live%20Traffic%20NPC%2C%20please%20add%20me%20to%20the%20Priority%20Waitlist%20for%20the%20next%20Advanced%20Driving%20Course%20(Class%20of%2010)."
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#25D366] hover:bg-[#20bd5a] active:bg-[#1da850] text-white font-black text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 rounded-2xl flex items-center space-x-2 shadow-xl shadow-emerald-950/50 transition cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-white shrink-0" />
                <span>Join WhatsApp Priority Waitlist</span>
              </a>

              <button
                onClick={() => onSwitchTab && onSwitchTab('dashboard')}
                className="bg-[#05080E] hover:bg-[#101726] text-slate-300 font-bold text-xs uppercase px-5 py-3.5 rounded-2xl border border-slate-700 transition"
              >
                Return to Live Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SCHEDULED CLASS DATES (JOHANNESBURG & PRETORIA)                         */}
      {/* ========================================================================= */}
      {(!settings || settings.isVisible) && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          <div className="space-y-6">
            {/* Header & Location Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A237]/30 pb-4">
              <div>
                <span className="inline-block bg-[#FAF4EA] text-[#070A10] border border-[#D4A237] font-black text-xs px-3.5 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                  UPCOMING SCHEDULED DATES
                </span>
                <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
                  Select Your Track Session (Max 10 per class)
                </h2>
              </div>

              {/* Location Tabs */}
              <div className="flex items-center space-x-2 bg-[#0A0F1A] p-1 rounded-2xl border border-[#D4A237]/40">
                <button
                  onClick={() => setSelectedLocationFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
                    selectedLocationFilter === 'all'
                      ? 'bg-[#FAF4EA] text-[#070A10] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  All (JHB & PTA)
                </button>

                <button
                  onClick={() => setSelectedLocationFilter('Johannesburg')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
                    selectedLocationFilter === 'Johannesburg'
                      ? 'bg-[#FAF4EA] text-[#070A10] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Johannesburg
                </button>

                <button
                  onClick={() => setSelectedLocationFilter('Pretoria')}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer ${
                    selectedLocationFilter === 'Pretoria'
                      ? 'bg-[#FAF4EA] text-[#070A10] shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Pretoria
                </button>
              </div>
            </div>

            {/* SESSIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => {
                  const slotsRemaining = Math.max(0, session.maxCapacity - session.bookedCount);
                  const isFull = session.bookedCount >= session.maxCapacity || session.status === 'full';
                  const isPta = session.location.toLowerCase().includes('pretoria');

                  return (
                    <div
                      key={session.id}
                      className={`relative bg-gradient-to-b from-[#0F1A2A] via-[#0B1526] to-[#0A0F1A] border-2 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                        isFull
                          ? 'border-red-500/50 bg-red-950/10'
                          : isPta
                          ? 'border-blue-500/50 hover:border-blue-400'
                          : 'border-[#D4A237]/60 hover:border-[#D4A237]'
                      }`}
                    >
                      {/* Top Header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                              isPta
                                ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                                : 'bg-amber-950 text-[#D4A237] border-[#D4A237]/60'
                            }`}
                          >
                            {session.location} Track Session
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                              isFull
                                ? 'bg-red-950 text-red-300 border border-red-500/50'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50 animate-pulse'
                            }`}
                          >
                            {isFull ? 'SOLD OUT (10/10)' : `${slotsRemaining} SLOTS LEFT`}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                          {session.venueName}
                        </h3>

                        <p className="text-xs text-slate-300 flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D4A237] shrink-0" />
                          <span>{session.address || `${session.location} Skidpan Facility`}</span>
                        </p>
                      </div>

                      {/* Date, Time, Instructor Details */}
                      <div className="bg-[#05080E] p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px]">Date</span>
                          <span className="text-white font-black text-sm">{session.date}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px]">Training Hours</span>
                          <span className="text-white font-black text-sm">{session.startTime} - {session.endTime}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px]">Lead Instructor</span>
                          <span className="text-slate-200 font-bold block">{session.instructorName || 'Accredited Lead'}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 font-semibold block text-[11px]">Investment</span>
                          <span className="text-[#D4A237] font-black text-base">R{session.price || 1850}</span>
                        </div>
                      </div>

                      {/* CAPACITY PROGRESS METER (STRICTLY 10 PER CLASS) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-300 uppercase">
                            Registered: <strong className="text-white">{session.bookedCount}</strong> of 10 Drivers
                          </span>
                          <span className={slotsRemaining > 0 ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                            {slotsRemaining > 0 ? `${slotsRemaining} remaining` : 'CLASS FULL'}
                          </span>
                        </div>

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

                      {/* ACTION BUTTON */}
                      <div className="pt-2">
                        {isFull ? (
                          <button
                            disabled
                            className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed text-center"
                          >
                            Class Fully Booked (10/10)
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenRegistration(session)}
                            className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-lg cursor-pointer transform active:scale-95 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237]"
                          >
                            <CreditCard className="w-4 h-4 text-[#070A10]" />
                            <span>Register & Book Class Slot</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-12 bg-[#0A0F1A] border border-slate-800 rounded-3xl space-y-3">
                  <Calendar className="w-10 h-10 text-[#D4A237] mx-auto" />
                  <h3 className="text-base font-bold text-white uppercase">No Sessions Listed for this Filter</h3>
                  <p className="text-xs text-slate-400">Please switch to "All" to view scheduled dates in other areas.</p>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. CURRICULUM MODULES BREAKDOWN                                           */}
          {/* ========================================================================= */}
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-1.5">
              <span className="inline-block bg-[#0A0F1A] text-[#D4A237] font-bold text-xs px-4 py-1 rounded-full uppercase tracking-widest border border-[#D4A237]/50">
                PRACTICAL TRACK CURRICULUM
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">
                What You Will Master on the Skidpan
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Comprehensive practical training designed specifically for South African road hazards & criminal threats
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {settings?.curriculumModules?.map((mod, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0F1A] border border-[#D4A237]/40 hover:border-[#D4A237] p-5 rounded-2xl space-y-3 transition shadow-xl group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#15253D] text-[#D4A237] border border-[#D4A237]/40">
                      {mod.tag}
                    </span>
                    <span className="text-xs font-black text-slate-500 font-mono">
                      MOD 0{idx + 1}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-[#D4A237] transition">
                    {mod.title}
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. ACCREDITATION & SAFETY PROMISE                                         */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-r from-[#110D05] via-[#1A1408] to-[#110D05] border-2 border-[#D4A237]/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Award className="w-8 h-8 text-[#D4A237]" />
              <h3 className="text-lg sm:text-2xl font-black text-[#D4A237] uppercase tracking-wider">
                CERTIFICATE OF ADVANCED DEFENSIVE DRIVING
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 max-w-3xl mx-auto leading-relaxed">
              Every driver completing the 10-person intensive track program receives a verified Live Traffic NPC Certificate of Competency, recognized by corporate fleet safety officers and select insurance brokers.
            </p>

            <div className="pt-4 border-t border-[#D4A237]/30 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm">
              <a
                href="mailto:training@trafficlive.co.za?subject=Advanced%20Driving%20Course%20Inquiry"
                className="flex items-center space-x-2 bg-[#05080E] hover:bg-black text-slate-200 hover:text-white px-4 py-2.5 rounded-xl border border-[#D4A237]/40 transition cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#D4A237]" />
                <span>training@trafficlive.co.za</span>
              </a>

              <a
                href="https://wa.me/27677083048?text=Hello%20Live%20Traffic%20NPC%2C%20I%20have%20an%20inquiry%20about%20the%20Advanced%20Driving%20Course."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 hover:text-white px-4 py-2.5 rounded-xl border border-emerald-500/50 transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp / Call: 067 708 3048</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. REGISTRATION & ID/DRIVER LICENSE MODAL                                  */}
      {/* ========================================================================= */}
      {isRegisterModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#0C1220] border-2 border-[#D4A237] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp my-auto text-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#171E30] via-[#101726] to-[#171E30] p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Car className="w-5 h-5 text-[#D4A237]" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                    Driver Registration & Seat Reservation
                  </h3>
                  <span className="text-[11px] text-[#D4A237] font-bold">
                    {selectedSession.location} ({selectedSession.date}) • Max 10 Drivers
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Display */}
            {errorMessage && (
              <div className="m-4 p-3 bg-red-950/90 border border-red-500 rounded-xl text-red-200 text-xs font-bold flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success State */}
            {successRegistration ? (
              <div className="p-6 space-y-5 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-[#D4A237] bg-[#05080E] px-3 py-1 rounded-full border border-[#D4A237]/40">
                    SEAT RESERVATION CONFIRMED
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Thank You, {successRegistration.fullName}!
                  </h3>
                  <p className="text-xs text-slate-300">
                    Your seat is reserved for the <strong className="text-white">{successRegistration.sessionLocation}</strong> class on <strong className="text-white">{successRegistration.sessionDate}</strong>.
                  </p>
                </div>

                {/* Reference Box */}
                <div className="bg-[#05080E] p-4 rounded-2xl border border-[#D4A237]/50 space-y-2 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Registration Ref:</span>
                    <span className="font-mono font-black text-[#D4A237] text-sm">
                      {successRegistration.referenceNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Driver ID Number:</span>
                    <span className="font-mono text-white">{successRegistration.idNumber}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Driver's License:</span>
                    <span className="font-mono text-white">{successRegistration.driversLicenseNumber}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Training Grounds:</span>
                    <span className="font-bold text-slate-200">{successRegistration.sessionVenue}</span>
                  </div>
                </div>

                {/* EFT Banking Instructions if selected */}
                {successRegistration.paymentMethod === 'eft' && (
                  <div className="bg-[#121B2C] border border-[#D4A237] rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#D4A237] uppercase">Direct Bank EFT Details</span>
                      <span className="bg-amber-950 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        Pending Transfer
                      </span>
                    </div>

                    <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                      <div>Bank: <strong>First National Bank (FNB)</strong></div>
                      <div>Account Name: <strong>Live Traffic NPC</strong></div>
                      <div>Account Number: <strong>6309 8214 551</strong></div>
                      <div>Branch Code: <strong>250655</strong></div>
                      <div>
                        Amount: <strong>R{successRegistration.amount}</strong>
                      </div>
                      <div className="text-amber-300 font-bold pt-1">
                        Use Reference: <strong>{successRegistration.referenceNumber}</strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3">
                  <button
                    onClick={() => {
                      setIsRegisterModalOpen(false);
                      setSuccessRegistration(null);
                    }}
                    className="w-full py-3 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black text-xs uppercase tracking-wider rounded-xl transition shadow"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form */
              <form onSubmit={handleSubmitRegistration} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
                {/* Notice on Mandatory ID + Drivers License */}
                <div className="bg-[#05080E] p-3 rounded-2xl border border-amber-500/40 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-[#D4A237] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong className="text-white uppercase">Verification Policy:</strong> A South African ID number and a valid driver's license number are strictly required to ensure track safety compliance.
                  </p>
                </div>

                {/* Driver Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. David"
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      Surname *
                    </label>
                    <input
                      type="text"
                      required
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      placeholder="e.g. Van Der Merwe"
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>
                </div>

                {/* MANDATORY ID NUMBER (User Requirement) */}
                <div>
                  <label className="block font-bold text-slate-200 uppercase mb-1 text-[11px] flex items-center justify-between">
                    <span>South African ID / Passport Number *</span>
                    <span className="text-[#D4A237] text-[10px] lowercase font-normal">mandatory</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 8904125089087"
                    className="w-full px-3 py-2.5 bg-[#05080E] border-2 border-amber-500/60 rounded-xl font-mono text-sm font-bold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-[#D4A237]"
                  />
                </div>

                {/* MANDATORY VALID DRIVER'S LICENSE NUMBER (User Requirement) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-200 uppercase mb-1 text-[11px] flex items-center justify-between">
                      <span>Driver's License No *</span>
                      <span className="text-[#D4A237] text-[10px] lowercase font-normal">mandatory</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={driversLicenseNumber}
                      onChange={(e) => setDriversLicenseNumber(e.target.value)}
                      placeholder="e.g. DL-GP-4892109"
                      className="w-full px-3 py-2 bg-[#05080E] border-2 border-amber-500/60 rounded-xl font-mono text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      License Code
                    </label>
                    <select
                      value={licenseCode}
                      onChange={(e) => setLicenseCode(e.target.value)}
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-[#D4A237]"
                    >
                      <option value="Code B (Light Motor Vehicle)">Code B (Car)</option>
                      <option value="Code EB (Articulated Light)">Code EB</option>
                      <option value="Code C1 (Heavy Motor Vehicle)">Code C1 (Truck/Bus)</option>
                      <option value="Code EC (Articulated Heavy)">Code EC</option>
                    </select>
                  </div>
                </div>

                {/* Contact Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      Mobile Cell Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="082 123 4567"
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.co.za"
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      placeholder="Next of Kin Name"
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                      Emergency Phone
                    </label>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      placeholder="083 987 6543"
                      className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                    />
                  </div>
                </div>

                {/* Vehicle Make/Model */}
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1 text-[11px]">
                    Vehicle Make & Model (Or Training Vehicle Preference)
                  </label>
                  <input
                    type="text"
                    value={vehicleMakeModel}
                    onChange={(e) => setVehicleMakeModel(e.target.value)}
                    placeholder="e.g. Toyota Hilux / VW Golf / BMW 3-Series"
                    className="w-full px-3 py-2 bg-[#05080E] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#D4A237]"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block font-bold text-slate-300 uppercase text-[11px]">
                    Select Payment Method (R{selectedSession.price || 1850})
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('payfast')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                        paymentMethod === 'payfast'
                          ? 'bg-[#15253D] border-[#D4A237] text-white shadow-md'
                          : 'bg-[#05080E] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-[#D4A237]" />
                      <span className="font-bold text-xs uppercase">PayFast Online</span>
                      <span className="text-[10px] text-slate-400">Instant Card / EFT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('eft')}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition cursor-pointer ${
                        paymentMethod === 'eft'
                          ? 'bg-[#15253D] border-[#D4A237] text-white shadow-md'
                          : 'bg-[#05080E] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-[#D4A237]" />
                      <span className="font-bold text-xs uppercase">Direct Bank EFT</span>
                      <span className="text-[10px] text-slate-400">Manual FNB Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#FAF4EA] hover:bg-white text-[#070A10] border border-[#D4A237] font-black text-xs uppercase tracking-wider rounded-xl transition shadow cursor-pointer flex items-center space-x-1.5"
                  >
                    {isSubmitting ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <span>Confirm & Reserve Slot</span>
                        <ChevronRight className="w-4 h-4 text-[#070A10]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
