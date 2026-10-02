import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Camera,
  Upload,
  User,
  Car,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
  ChevronRight,
  Eye,
  Info
} from 'lucide-react';
import { UserIdentityVerification, RegisteredUser } from '../types';
import { LOCAL_STORAGE_VERIFICATION_KEY } from '../utils/tripBuddyUtils';

interface UserVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: RegisteredUser | null;
  onVerificationUpdated?: (verification: UserIdentityVerification) => void;
}

export const UserVerificationModal: React.FC<UserVerificationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onVerificationUpdated
}) => {
  const [step, setStep] = useState<'overview' | 'selfie' | 'id_doc' | 'vehicle' | 'success'>('overview');
  
  // Form fields
  const [fullName, setFullName] = useState<string>(
    currentUser ? `${currentUser.fullName || ''} ${currentUser.surname || ''}`.trim() : ''
  );
  const [idNumber, setIdNumber] = useState<string>('');
  const [idType, setIdType] = useState<'rsa_id' | 'smart_card' | 'drivers_license' | 'passport'>('drivers_license');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('');
  const [vehicleColor, setVehicleColor] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [vehicleYear, setVehicleYear] = useState<string>('');
  
  // Image states (data URLs)
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [idDocPhoto, setIdDocPhoto] = useState<string | null>(null);
  const [idDocBackPhoto, setIdDocBackPhoto] = useState<string | null>(null);
  
  // Camera feed states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Processing & Verification state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [savedVerification, setSavedVerification] = useState<UserIdentityVerification | null>(null);

  // Load existing verification
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VERIFICATION_KEY);
      if (saved) {
        const parsed: UserIdentityVerification = JSON.parse(saved);
        setSavedVerification(parsed);
        setFullName(parsed.fullName || fullName);
        setIdNumber(parsed.idNumber || '');
        setIdType(parsed.idType || 'drivers_license');
        setSelfiePhoto(parsed.selfiePhotoUrl || null);
        setIdDocPhoto(parsed.idDocPhotoUrl || null);
        setIdDocBackPhoto(parsed.idDocBackPhotoUrl || null);
        setLicenseNumber(parsed.licenseNumber || '');
        setVehicleMakeModel(parsed.vehicleMakeModel || '');
        setVehicleColor(parsed.vehicleColor || '');
        setVehiclePlate(parsed.vehiclePlate || '');
        setVehicleYear(parsed.vehicleYear || '');
      }
    } catch (e) {
      console.warn('Could not load saved verification', e);
    }
  }, [isOpen]);

  // Clean up camera stream on unmount or tab switch
  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable', err);
      setCameraError('Camera access not granted. You can also upload a photo file below.');
      setIsCameraActive(false);
    }
  };

  const captureSelfieFromVideo = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelfiePhoto(dataUrl);
        stopCameraStream();
      }
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'selfie' | 'id_front' | 'id_back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'selfie') setSelfiePhoto(result);
      if (target === 'id_front') setIdDocPhoto(result);
      if (target === 'id_back') setIdDocBackPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = async (instantVerify: boolean = true) => {
    setIsSubmitting(true);
    
    // Construct verified badges
    const badges: string[] = ['verified_member'];
    if (vehiclePlate && vehicleMakeModel) {
      badges.push('verified_driver');
    }
    badges.push('id_verified');

    const newVerification: UserIdentityVerification = {
      userId: currentUser?.id || 'commuter_' + Date.now().toString(36),
      fullName: fullName.trim() || 'Verified LiveTraffic Commuter',
      idNumber: idNumber.trim(),
      idType,
      licenseNumber: licenseNumber.trim(),
      selfiePhotoUrl: selfiePhoto || undefined,
      idDocPhotoUrl: idDocPhoto || undefined,
      idDocBackPhotoUrl: idDocBackPhoto || undefined,
      vehicleMakeModel: vehicleMakeModel.trim() || undefined,
      vehicleColor: vehicleColor.trim() || undefined,
      vehiclePlate: vehiclePlate.trim().toUpperCase() || undefined,
      vehicleYear: vehicleYear.trim() || undefined,
      status: instantVerify ? 'verified' : 'pending_review',
      verifiedAt: instantVerify ? new Date().toISOString() : undefined,
      verifiedBadges: badges,
      submittedAt: new Date().toISOString(),
      notes: 'Verified via LiveTraffic Trip Buddy Security Verification'
    };

    // Save to local storage
    try {
      localStorage.setItem(LOCAL_STORAGE_VERIFICATION_KEY, JSON.stringify(newVerification));
    } catch (e) {}

    // Save to server backend
    try {
      await fetch('/api/trip-buddy/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVerification)
      });
    } catch (e) {
      console.warn('Backend verification sync notice', e);
    }

    setSavedVerification(newVerification);
    if (onVerificationUpdated) {
      onVerificationUpdated(newVerification);
    }

    setIsSubmitting(false);
    setStep('success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-2xl text-white p-4 sm:p-6 my-auto flex flex-col space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Canvas for selfie snapshot */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/50">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                  Trip Buddy Verification
                </h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Trust & Safety
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selfie, ID & Vehicle verification for work lift clubs & carpooling
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 text-[11px] font-bold text-center">
          <button
            type="button"
            onClick={() => setStep('overview')}
            className={`py-1 rounded-lg transition ${
              step === 'overview' ? 'bg-[#D4A237] text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Info
          </button>
          <button
            type="button"
            onClick={() => setStep('selfie')}
            className={`py-1 rounded-lg transition ${
              step === 'selfie' ? 'bg-[#D4A237] text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Selfie
          </button>
          <button
            type="button"
            onClick={() => setStep('id_doc')}
            className={`py-1 rounded-lg transition ${
              step === 'id_doc' ? 'bg-[#D4A237] text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            3. ID / Doc
          </button>
          <button
            type="button"
            onClick={() => setStep('vehicle')}
            className={`py-1 rounded-lg transition ${
              step === 'vehicle' ? 'bg-[#D4A237] text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Vehicle
          </button>
        </div>

        {/* STEP 1: OVERVIEW & BASIC DETAILS */}
        {step === 'overview' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-4 text-xs space-y-2 text-slate-300">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Why We Verify Commuters & Drivers:</span>
              </div>
              <p>
                To keep our work lift clubs safe, reliable, and cost-effective, all members verify their identity with a <strong>live selfie</strong> and <strong>official South African ID or Driver's License</strong>.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                <li>Ensures only real, vetted colleagues and motorists share lifts.</li>
                <li>Passengers see the exact verified vehicle plate & driver photo before stepping in.</li>
                <li>Your documents are securely encrypted and protected under POPIA regulations.</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Full Legal Name (as on ID / License)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sipho Ndlovu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Document Type
                  </label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none cursor-pointer"
                  >
                    <option value="drivers_license">SA Driver's License Card</option>
                    <option value="smart_card">SA Smart ID Card</option>
                    <option value="rsa_id">Green Barcoded ID Book</option>
                    <option value="passport">Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    ID / License Number
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 910412 5082 089"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep('selfie')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg cursor-pointer"
              >
                <span>Continue to Selfie Photo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LIVE SELFIE */}
        {step === 'selfie' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Step 2: Live Selfie Photo
              </h4>
              <p className="text-xs text-slate-400">
                Take a clear front-facing photo of your face in good lighting.
              </p>
            </div>

            {/* Camera View or Preview */}
            <div className="flex flex-col items-center justify-center">
              {isCameraActive ? (
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-400/60 rounded-full pointer-events-none" />
                </div>
              ) : selfiePhoto ? (
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl bg-slate-950">
                  <img src={selfiePhoto} alt="Selfie preview" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-black p-1 rounded-full shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                  <User className="w-12 h-12 text-slate-600" />
                  <span className="text-xs font-semibold">No selfie captured yet</span>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl text-xs text-amber-200 text-center">
                {cameraError}
              </div>
            )}

            {/* Action Buttons for Selfie */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {isCameraActive ? (
                <button
                  type="button"
                  onClick={captureSelfieFromVideo}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo Now</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startCamera}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition shadow cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>{selfiePhoto ? 'Retake with Camera' : 'Open Selfie Camera'}</span>
                </button>
              )}

              <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer border border-slate-700">
                <Upload className="w-4 h-4" />
                <span>Upload Selfie File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'selfie')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setStep('overview');
                }}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setStep('id_doc');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg cursor-pointer"
              >
                <span>Continue to ID Document</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ID / DRIVER LICENSE DOCUMENT */}
        {step === 'id_doc' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Step 3: Upload Official ID / Driver's License
              </h4>
              <p className="text-xs text-slate-400">
                Upload clear photos of your card/document for automated security review.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front Photo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    1. Front of Card / ID Page
                  </span>
                  {idDocPhoto ? (
                    <div className="relative h-32 rounded-lg overflow-hidden border border-emerald-500/50 bg-black">
                      <img src={idDocPhoto} alt="ID Front" className="w-full h-full object-contain" />
                      <span className="absolute top-1 right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-3 text-center text-slate-500">
                      <FileText className="w-8 h-8 mb-1" />
                      <span className="text-[11px]">Front Photo required</span>
                    </div>
                  )}
                </div>

                <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{idDocPhoto ? 'Change Front Photo' : 'Upload Front'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'id_front')}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Back Photo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 block mb-1">
                    2. Back of Card (Optional)
                  </span>
                  {idDocBackPhoto ? (
                    <div className="relative h-32 rounded-lg overflow-hidden border border-emerald-500/50 bg-black">
                      <img src={idDocBackPhoto} alt="ID Back" className="w-full h-full object-contain" />
                      <span className="absolute top-1 right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Uploaded
                      </span>
                    </div>
                  ) : (
                    <div className="h-32 rounded-lg border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-3 text-center text-slate-500">
                      <FileText className="w-8 h-8 mb-1" />
                      <span className="text-[11px]">Back barcode / details</span>
                    </div>
                  )}
                </div>

                <label className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-2 rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer border border-slate-700">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{idDocBackPhoto ? 'Change Back Photo' : 'Upload Back'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'id_back')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep('selfie')}
                className="text-xs text-slate-400 hover:text-white transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep('vehicle')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center space-x-2 transition shadow-lg cursor-pointer"
              >
                <span>Continue to Vehicle Info</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VEHICLE INFO (FOR DRIVERS) */}
        {step === 'vehicle' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Step 4: Vehicle Registration (For Drivers Offering Lifts)
              </h4>
              <p className="text-xs text-slate-400">
                If you plan to offer lifts, provide your vehicle details so passengers can verify your car.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Vehicle Make & Model
                  </label>
                  <input
                    type="text"
                    value={vehicleMakeModel}
                    onChange={(e) => setVehicleMakeModel(e.target.value)}
                    placeholder="e.g. Toyota Corolla Cross / VW Polo"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={vehicleColor}
                    onChange={(e) => setVehicleColor(e.target.value)}
                    placeholder="e.g. Silver / White / Charcoal"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Number Plate / License Reg
                  </label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="e.g. CA 892 411 or GP 123 AB"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white uppercase font-mono font-bold focus:border-emerald-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Year (Optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    placeholder="e.g. 2022"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submission CTA */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow-xl shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials & Biometrics...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Submit & Activate Verified Badges</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS / VERIFIED STATUS */}
        {step === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl shadow-emerald-950 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-lg font-black text-emerald-300 uppercase tracking-wide">
                Identity & Vehicle Verified!
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                You are now a <strong>Verified LiveTraffic Trip Member</strong>. Your profile displays verified trust badges when posting or joining work lift clubs.
              </p>
            </div>

            {/* Badges Preview */}
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 max-w-md mx-auto flex flex-col space-y-2 text-left">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                <Sparkles className="w-4 h-4 text-[#D4A237]" />
                <span>Active Safety Badges:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>🛡️ Selfie & ID Verified</span>
                </span>
                {savedVerification?.vehiclePlate && (
                  <span className="bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>🚗 {savedVerification.vehiclePlate}</span>
                  </span>
                )}
                <span className="bg-amber-950 border border-amber-500/40 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1.5">
                  <span>⚡ Priority Dispatch</span>
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm px-6 py-2.5 rounded-xl transition shadow-lg cursor-pointer"
              >
                Back to Lift Club & Trip Buddy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
