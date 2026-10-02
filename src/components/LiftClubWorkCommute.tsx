import React, { useState, useEffect, useMemo } from 'react';
import {
  Car,
  Users,
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  Phone,
  MessageCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  Navigation,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  ChevronDown,
  ChevronUp,
  Share2,
  Radio,
  Compass,
  CreditCard,
  UserCheck,
  Trash2
} from 'lucide-react';
import {
  LiftClubListing,
  LiftClubRole,
  UserIdentityVerification,
  RegisteredUser,
  UserTripPassWallet
} from '../types';
import {
  LOCAL_STORAGE_LIFT_CLUB_KEY,
  LOCAL_STORAGE_VERIFICATION_KEY,
  formatLiftClubLeavingNowMessage,
  formatLiftClubArrivedPickupMessage,
  formatLiftClubRequestMessage,
  cleanWhatsAppNumber,
  createWhatsAppDirectUrl
} from '../utils/tripBuddyUtils';
import { TripBuddyLiveMap } from './TripBuddyLiveMap';

interface LiftClubWorkCommuteProps {
  currentUser?: RegisteredUser | null;
  wallet: UserTripPassWallet;
  onOpenVerificationModal: () => void;
  onOpenPassesTab: () => void;
}

export const LiftClubWorkCommute: React.FC<LiftClubWorkCommuteProps> = ({
  currentUser,
  wallet,
  onOpenVerificationModal,
  onOpenPassesTab
}) => {
  // Verification State
  const [verification, setVerification] = useState<UserIdentityVerification | null>(null);

  // Filter & Search
  const [filterRole, setFilterRole] = useState<'all' | 'driver' | 'passenger'>('all');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Listings State (empty initial list; loaded from server / local storage)
  const [listings, setListings] = useState<LiftClubListing[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LIFT_CLUB_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Exclude old sample dummy IDs if they existed in localStorage
          return parsed.filter((p: any) => !p.id?.startsWith('lift-pta-sandton-1') && !p.id?.startsWith('lift-centurion-midrand-2') && !p.id?.startsWith('lift-cpt-bellville-3') && !p.id?.startsWith('lift-dbn-umhlanga-4'));
        }
      }
    } catch (_) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Post New Ride Offer/Request Form State
  const [isPostingNew, setIsPostingNew] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [postRole, setPostRole] = useState<LiftClubRole>('driver');
  const [originArea, setOriginArea] = useState<string>('');
  const [destinationArea, setDestinationArea] = useState<string>('');
  const [corridor, setCorridor] = useState<string>('None');
  const [departureTime, setDepartureTime] = useState<string>('06:45 AM');
  const [returnTime, setReturnTime] = useState<string>('17:15 PM');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [availableSeats, setAvailableSeats] = useState<number>(3);
  const [seatsRequested, setSeatsRequested] = useState<number>(1);
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('');
  const [vehicleColor, setVehicleColor] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [contributionZAR, setContributionZAR] = useState<number>(40);
  const [notes, setNotes] = useState<string>('');

  // Active Live Ride / Dispatch State
  const [activeDispatchListing, setActiveDispatchListing] = useState<LiftClubListing | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<
    'idle' | 'leaving_now' | 'arrived_pickup' | 'onboard' | 'completed'
  >('idle');
  const [driverEtaMins, setDriverEtaMins] = useState<number>(8);
  const [passengerMatchedName, setPassengerMatchedName] = useState<string>('Kagiso (Buddy)');
  const [passengerMatchedPhone, setPassengerMatchedPhone] = useState<string>('0821234567');

  // Fetch real listings from backend API
  const fetchListings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/trip-buddy/lift-clubs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.listings)) {
          // Filter out any legacy dummy listings
          const realListings = data.listings.filter((p: any) => 
            !p.id?.startsWith('lift-pta-sandton-1') && 
            !p.id?.startsWith('lift-centurion-midrand-2') && 
            !p.id?.startsWith('lift-cpt-bellville-3') && 
            !p.id?.startsWith('lift-dbn-umhlanga-4')
          );
          setListings(realListings);
          try {
            localStorage.setItem(LOCAL_STORAGE_LIFT_CLUB_KEY, JSON.stringify(realListings));
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Could not fetch server lift clubs:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Load verification status on mount & sync
  useEffect(() => {
    const loadVerification = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_VERIFICATION_KEY);
        if (saved) {
          const parsed: UserIdentityVerification = JSON.parse(saved);
          setVerification(parsed);
          if (parsed.vehicleMakeModel && !vehicleMakeModel) {
            setVehicleMakeModel(parsed.vehicleMakeModel);
            setVehicleColor(parsed.vehicleColor || '');
            setVehiclePlate(parsed.vehiclePlate || '');
          }
        }
      } catch (e) {}
    };
    loadVerification();
  }, []);

  // Sync listings to local storage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LIFT_CLUB_KEY, JSON.stringify(listings));
    } catch (_) {}
  }, [listings]);

  // Handle Day Toggle
  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Submit New Listing to Backend API
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!originArea.trim() || !destinationArea.trim()) {
      alert('Please fill in both pickup and destination work areas.');
      return;
    }

    const isVerified = verification?.status === 'verified';
    const userRoleStatus =
      postRole === 'driver' && isVerified
        ? 'verified_driver'
        : isVerified
        ? 'verified_member'
        : 'unverified';

    const newListing: LiftClubListing = {
      id: 'lift_' + Date.now().toString(36),
      userId: currentUser?.id || 'guest_' + Date.now(),
      userName:
        currentUser?.fullName ||
        verification?.fullName ||
        (postRole === 'driver' ? 'Verified Driver' : 'Work Commuter'),
      userPhone: currentUser?.phone || '0821234567',
      userEmail: currentUser?.email || undefined,
      role: postRole,
      verificationStatus: userRoleStatus,
      originArea: originArea.trim(),
      destinationArea: destinationArea.trim(),
      corridor,
      departureTime,
      returnTime: returnTime || undefined,
      recurringDays: selectedDays,
      availableSeats: postRole === 'driver' ? availableSeats : undefined,
      seatsRequested: postRole === 'passenger' ? seatsRequested : undefined,
      vehicleDetails:
        postRole === 'driver'
          ? {
              makeModel: vehicleMakeModel.trim() || 'Sedan / SUV',
              color: vehicleColor.trim() || 'Silver',
              licensePlate: vehiclePlate.trim().toUpperCase() || 'GP 123 AB'
            }
          : undefined,
      contributionZAR: contributionZAR,
      coveredByMonitoringPass: true,
      notes: notes.trim() || 'Work commute via LiveTraffic Trip Buddy.',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/trip-buddy/lift-clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newListing)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.listing) {
          setListings(prev => [data.listing, ...prev]);
        } else {
          setListings(prev => [newListing, ...prev]);
        }
      } else {
        setListings(prev => [newListing, ...prev]);
      }
    } catch (e) {
      console.warn('Network error posting lift club, saved locally:', e);
      setListings(prev => [newListing, ...prev]);
    } finally {
      setIsSubmitting(false);
      setIsPostingNew(false);
      // Reset inputs
      setOriginArea('');
      setDestinationArea('');
      setCorridor('None');
      setNotes('');
    }
  };

  // Delete / Remove Listing
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm('Are you sure you want to remove this commute listing?')) return;
    try {
      await fetch(`/api/trip-buddy/lift-clubs/${listingId}`, { method: 'DELETE' });
    } catch (_) {}
    setListings(prev => prev.filter(l => l.id !== listingId));
  };

  // Trigger "I'm Leaving Now / On My Way" Live Dispatch
  const handleStartRideDispatch = (listing: LiftClubListing) => {
    setActiveDispatchListing(listing);
    setDispatchStatus('leaving_now');
    setDriverEtaMins(7);

    // If passenger phone is provided, create WhatsApp link
    const vehicleStr = listing.vehicleDetails
      ? `${listing.vehicleDetails.color} ${listing.vehicleDetails.makeModel} (${listing.vehicleDetails.licensePlate})`
      : 'LiveTraffic Verified Car';

    const token = 'track_lift_' + listing.id;
    const trackingUrl = `${window.location.origin}/?trackTrip=${token}`;

    const text = formatLiftClubLeavingNowMessage(
      listing.userName,
      passengerMatchedName,
      vehicleStr,
      listing.originArea,
      listing.destinationArea,
      7,
      trackingUrl
    );

    const waUrl = createWhatsAppDirectUrl(passengerMatchedPhone, text);
    window.open(waUrl, '_blank');
  };

  // Send "Arrived Outside" Alert
  const handleNotifyArrivedOutside = () => {
    setDispatchStatus('arrived_pickup');
    if (!activeDispatchListing) return;

    const vehicleStr = activeDispatchListing.vehicleDetails
      ? `${activeDispatchListing.vehicleDetails.color} ${activeDispatchListing.vehicleDetails.makeModel} (${activeDispatchListing.vehicleDetails.licensePlate})`
      : 'LiveTraffic Car';

    const text = formatLiftClubArrivedPickupMessage(
      activeDispatchListing.userName,
      passengerMatchedName,
      vehicleStr
    );

    const waUrl = createWhatsAppDirectUrl(passengerMatchedPhone, text);
    window.open(waUrl, '_blank');
  };

  // Filtered Listings
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (filterRole !== 'all' && item.role !== filterRole) return false;
      if (selectedCorridor !== 'all' && item.corridor !== selectedCorridor) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          item.originArea.toLowerCase().includes(query) ||
          item.destinationArea.toLowerCase().includes(query) ||
          item.userName.toLowerCase().includes(query) ||
          item.corridor.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [listings, filterRole, selectedCorridor, searchQuery]);

  const isUserVerified = verification?.status === 'verified';

  return (
    <div className="flex flex-col h-full space-y-4 overflow-y-auto pr-1">
      {/* 1. TOP HIGHLIGHT & VERIFICATION BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-[#071322] to-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 sm:p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/50 mt-0.5">
              <Users className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                  Work Lift Club & Commute Buddies
                </h3>
                {isUserVerified ? (
                  <span className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Member</span>
                  </span>
                ) : (
                  <span className="bg-amber-950/80 border border-amber-500/50 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>ID Verification Recommended</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Safer and cheaper than e-hailing. Share daily lifts to work with vetted, ID-verified colleagues and motorists.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            {!isUserVerified ? (
              <button
                type="button"
                onClick={onOpenVerificationModal}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-md shadow-emerald-950/50 active:scale-95 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Verify ID & Selfie</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenVerificationModal}
                className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Manage Verification</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsPostingNew(!isPostingNew)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#D4A237] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 transition shadow-lg active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isPostingNew ? 'Close Form' : 'Offer / Request Lift'}</span>
            </button>
          </div>
        </div>

        {/* Membership & Free Monitoring Pass Note */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A237]" />
            <span>
              <strong>Included in LiveTraffic Pass:</strong> Active Monitoring & Trip Buddy users get unlimited Lift Club access at no extra charge.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenPassesTab}
            className="text-[#D4A237] hover:text-amber-300 font-bold underline cursor-pointer"
          >
            View Passes & Wallet
          </button>
        </div>
      </div>

      {/* 2. ACTIVE LIVE RIDE & REAL-TIME APPROACH DISPATCH PANEL (IF ACTIVE) */}
      {activeDispatchListing && dispatchStatus !== 'idle' && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h4 className="text-sm font-black text-emerald-300 uppercase tracking-wide">
                Live Commute Ride Active: {activeDispatchListing.originArea} ➔ {activeDispatchListing.destinationArea}
              </h4>
            </div>
            <button
              onClick={() => {
                setDispatchStatus('idle');
                setActiveDispatchListing(null);
              }}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              End Ride
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-black/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Passenger</span>
              <span className="font-bold text-white text-sm">{passengerMatchedName}</span>
              <span className="text-[11px] text-emerald-400 block">{passengerMatchedPhone}</span>
            </div>

            <div className="bg-black/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle</span>
              <span className="font-bold text-white text-sm">
                {activeDispatchListing.vehicleDetails?.makeModel || 'Toyota Corolla'}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 block">
                {activeDispatchListing.vehicleDetails?.licensePlate || 'GP 882 109'}
              </span>
            </div>

            <div className="bg-black/50 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <span className="font-bold text-[#D4A237] text-sm uppercase">
                {dispatchStatus === 'leaving_now'
                  ? `En Route (ETA ~${driverEtaMins}m)`
                  : dispatchStatus === 'arrived_pickup'
                  ? 'Arrived Outside!'
                  : dispatchStatus === 'onboard'
                  ? 'Heading to Work'
                  : 'Completed'}
              </span>
            </div>
          </div>

          {/* Quick Progress Dispatch Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {dispatchStatus === 'leaving_now' && (
              <button
                type="button"
                onClick={handleNotifyArrivedOutside}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition shadow cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>Notify: "I Have Arrived Outside"</span>
              </button>
            )}

            {dispatchStatus === 'arrived_pickup' && (
              <button
                type="button"
                onClick={() => setDispatchStatus('onboard')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition shadow cursor-pointer"
              >
                <Car className="w-4 h-4" />
                <span>Passenger Onboard & Heading to Work</span>
              </button>
            )}

            {dispatchStatus === 'onboard' && (
              <button
                type="button"
                onClick={() => setDispatchStatus('completed')}
                className="flex-1 bg-[#D4A237] hover:bg-amber-400 text-black font-black text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition shadow cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Safely Arrived at Work Destination</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const token = 'track_lift_' + activeDispatchListing.id;
                const trackingUrl = `${window.location.origin}/?trackTrip=${token}`;
                navigator.clipboard.writeText(trackingUrl);
                alert('Live GPS tracking link copied to clipboard!');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Live Link</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. POST NEW COMMUTE FORM (EXPANDABLE) */}
      {isPostingNew && (
        <form
          onSubmit={handleCreateListing}
          className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
              <Plus className="w-4 h-4 text-[#D4A237]" />
              <span>Create Work Lift Club Listing</span>
            </h4>
            <span className="text-[11px] text-slate-400">Takes ~1 minute to list</span>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPostRole('driver')}
              className={`py-2 px-3 rounded-lg text-xs font-black uppercase transition flex items-center justify-center space-x-2 cursor-pointer ${
                postRole === 'driver'
                  ? 'bg-[#D4A237] text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>I am a Driver (Offering Lifts)</span>
            </button>
            <button
              type="button"
              onClick={() => setPostRole('passenger')}
              className={`py-2 px-3 rounded-lg text-xs font-black uppercase transition flex items-center justify-center space-x-2 cursor-pointer ${
                postRole === 'passenger'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>I am a Buddy (Looking for Driver)</span>
            </button>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Origin Suburb / Address */}
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Pickup Suburb / Home Area
              </label>
              <input
                type="text"
                required
                value={originArea}
                onChange={(e) => setOriginArea(e.target.value)}
                placeholder="e.g. Pretoria East (Faerie Glen / Menlyn)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Destination Work / Office */}
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Work Destination / Office Precinct
              </label>
              <input
                type="text"
                required
                value={destinationArea}
                onChange={(e) => setDestinationArea(e.target.value)}
                placeholder="e.g. Sandton CBD / Rivonia Rd"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Major Corridor */}
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Main Route / Highway Corridor
              </label>
              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="None">None</option>
                <option value="N1 Ben Schoeman / JHB-PTA">N1 Ben Schoeman (Pretoria ➔ Midrand ➔ Sandton / JHB)</option>
                <option value="N3 Durban-PMB">N3 Corridor (Durban ➔ Westville ➔ Pinetown ➔ PMB)</option>
                <option value="Cape Town N1/N2">Cape Town Corridor (Bellville / N1 / N2 ➔ Foreshore)</option>
                <option value="R21 Airport">R21 Highway (Pretoria East ➔ OR Tambo / Kempton Park)</option>
                <option value="N4 West/East">N4 Highway (Rustenburg / Akasia ➔ Pretoria East / Witbank)</option>
                <option value="N2 / M4 KZN North Coast">N2 / M4 KZN North Coast (Durban North ➔ Umhlanga)</option>
              </select>
            </div>

            {/* Departure & Return Times */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Morning Departure
                </label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  placeholder="06:45 AM"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Afternoon Return
                </label>
                <input
                  type="text"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  placeholder="17:15 PM"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Recurring Days */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Commute Days (Select all applicable)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedDays.includes(d)
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Driver Vehicle Details (If Driver) */}
            {postRole === 'driver' && (
              <>
                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Available Seats
                  </label>
                  <select
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                  >
                    <option value={1}>1 Seat available</option>
                    <option value={2}>2 Seats available</option>
                    <option value={3}>3 Seats available</option>
                    <option value={4}>4 Seats available</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Fuel Share / Contribution (ZAR)
                  </label>
                  <input
                    type="number"
                    value={contributionZAR}
                    onChange={(e) => setContributionZAR(Number(e.target.value))}
                    placeholder="e.g. 40"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Free for members with active Monthly Monitoring Pass.
                  </span>
                </div>

                <div className="sm:col-span-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Car Make & Model
                    </label>
                    <input
                      type="text"
                      value={vehicleMakeModel}
                      onChange={(e) => setVehicleMakeModel(e.target.value)}
                      placeholder="e.g. Toyota Corolla"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="e.g. Silver"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Number Plate
                    </label>
                    <input
                      type="text"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      placeholder="e.g. GP 882 109"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono font-bold"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Passenger Seats Requested */}
            {postRole === 'passenger' && (
              <div>
                <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Seats Needed
                </label>
                <select
                  value={seatsRequested}
                  onChange={(e) => setSeatsRequested(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Additional Notes / Preferences
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Departs on time, non-smoking, AC available, boot space for bags."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsPostingNew(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition cursor-pointer"
            >
              Publish Listing to Lift Board
            </button>
          </div>
        </form>
      )}

      {/* 4. SEARCH & FILTER BAR */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Role Filter Tabs */}
        <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterRole('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterRole === 'all'
                ? 'bg-[#D4A237] text-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({listings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('driver')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${
              filterRole === 'driver'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Drivers Offering</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRole('passenger')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${
              filterRole === 'passenger'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Buddies Seeking</span>
          </button>
        </div>

        {/* Search and Corridor selector */}
        <div className="flex items-center space-x-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suburb, destination, corridor..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
          >
            <option value="all">All Corridors</option>
            <option value="N1 Ben Schoeman / JHB-PTA">N1 JHB-PTA</option>
            <option value="N3 Durban-PMB">N3 Durban</option>
            <option value="Cape Town N1/N2">Cape Town N1/N2</option>
            <option value="R21 Airport">R21 Airport</option>
          </select>
        </div>
      </div>

      {/* 5. LISTINGS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
        {filteredListings.length === 0 ? (
          <div className="col-span-full py-12 px-4 text-center text-slate-500 space-y-3 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-300">No commute listings posted yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Be the first motorist or commuter on your corridor to offer a seat or request a work lift club.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsPostingNew(true)}
                className="px-4 py-2 rounded-xl bg-[#D4A237] hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition shadow cursor-pointer"
              >
                + Post First Lift Offer / Request
              </button>
              {(filterRole !== 'all' || selectedCorridor !== 'all' || searchQuery.trim()) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterRole('all');
                    setSelectedCorridor('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredListings.map((item) => {
            const isDriver = item.role === 'driver';
            const isVerifiedDriver = item.verificationStatus === 'verified_driver';
            const isVerifiedMember =
              item.verificationStatus === 'verified_member' || isVerifiedDriver;

            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 space-y-3 transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Top Header: Member Info & Verified Pill */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                          isDriver
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        }`}
                      >
                        {isDriver ? <Car className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm truncate">
                            {item.userName}
                          </span>
                          {isVerifiedMember && (
                            <span
                              className="bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5"
                              title="Selfie & ID Verified"
                            >
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>Verified</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {isDriver ? '🚗 Offering Work Lift' : '🙋 Looking for Lift'} •{' '}
                          {item.corridor}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#D4A237]">
                        {item.contributionZAR ? `R${item.contributionZAR}` : 'Free'}
                      </span>
                      <span className="text-[9px] text-slate-400 block">/ trip / seat</span>
                    </div>
                  </div>

                  {/* Route & Timing */}
                  <div className="space-y-2 pt-2.5 text-xs">
                    {/* Pickup ➔ Destination */}
                    <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-slate-300 font-semibold truncate">
                          {item.originArea}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        <span className="text-white font-bold truncate">
                          {item.destinationArea}
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Vehicle Tags */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <Clock className="w-3.5 h-3.5 text-[#D4A237]" />
                        <span>
                          <strong>{item.departureTime}</strong> {item.returnTime ? `• ${item.returnTime}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span className="truncate">{item.recurringDays.join(', ')}</span>
                      </div>
                    </div>

                    {/* Vehicle details pill for drivers */}
                    {isDriver && item.vehicleDetails && (
                      <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-lg flex items-center justify-between text-[11px] text-slate-300">
                        <div className="flex items-center space-x-1.5 truncate">
                          <Car className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="truncate">
                            {item.vehicleDetails.color} {item.vehicleDetails.makeModel}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] bg-black/60 px-1.5 py-0.5 rounded border border-slate-700 text-emerald-400 font-bold">
                          {item.vehicleDetails.licensePlate}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 italic line-clamp-2 pt-0.5">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Action Controls */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center space-x-2">
                  {/* WhatsApp Intro Link */}
                  <a
                    href={createWhatsAppDirectUrl(
                      item.userPhone,
                      formatLiftClubRequestMessage(
                        currentUser?.fullName || 'Colleague',
                        currentUser?.phone || '',
                        item.role,
                        item.originArea,
                        item.destinationArea,
                        item.departureTime
                      )
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#25D366] hover:bg-emerald-500 text-black font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition shadow"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Buddy</span>
                  </a>

                  {/* If Driver: "I'm Leaving Now / Dispatch" CTA */}
                  {isDriver && (
                    <button
                      type="button"
                      onClick={() => handleStartRideDispatch(item)}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1 transition shadow cursor-pointer"
                      title="Notify passenger that you are leaving now and dispatch live tracking"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>I'm Leaving Now</span>
                    </button>
                  )}

                  {/* Creator / Owner Delete Option */}
                  {(currentUser?.id === item.userId || item.userId?.startsWith('guest_') || currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteListing(item.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/30"
                      title="Delete this listing"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
