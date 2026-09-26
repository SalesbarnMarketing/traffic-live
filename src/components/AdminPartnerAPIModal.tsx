import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Code2,
  Terminal,
  Send,
  RefreshCw,
  Download,
  AlertTriangle,
  Car,
  FileText,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  Layers,
  Radio,
  Clock,
  Activity
} from 'lucide-react';
import { PartnerApiKey, PartnerSOSResponse } from '../types';

interface AdminPartnerAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSOSCreated?: () => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'discovery-crash',
    partnerName: 'Discovery Insure',
    label: '💥 Discovery Insure: High-G Crash on N1 (Telematics Impact)',
    data: {
      insuredName: 'Pieter van der Merwe',
      contactPhone: '+27 82 459 1182',
      vehicleInfo: 'Silver VW Amarok 3.0 V6 TDI [CA 829-411]',
      latitude: -25.8642,
      longitude: 28.1724,
      locationName: 'N1 North near Brakfontein Interchange, Centurion',
      emergencyType: 'crash' as const,
      incidentSeverity: 'critical' as const,
      policyNumber: 'DISC-POL-984210',
      externalReferenceId: 'CLM-2026-CRASH-0419',
      telematicsTriggered: true,
      notes: 'G-force impact sensor detected sudden 18G deceleration. Airbag deployment telematics signal confirmed. Vitality Drive auto-dispatch activated.'
    }
  },
  {
    id: 'outsurance-spiking',
    partnerName: 'Outsurance (Help@Out)',
    label: '⚠️ Outsurance: Spiking Puncture on R21 Expressway',
    data: {
      insuredName: 'Nomvula Dlamini',
      contactPhone: '+27 73 912 4005',
      vehicleInfo: 'White Hyundai Tucson 2.0 Elite [GP 44-KL-91]',
      latitude: -26.0125,
      longitude: 28.2384,
      locationName: 'R21 South near Olifantsfontein Off-ramp',
      emergencyType: 'spiking_puncture' as const,
      incidentSeverity: 'high' as const,
      policyNumber: 'OUT-HELP-410982',
      externalReferenceId: 'OUT-CASE-88412',
      telematicsTriggered: false,
      notes: 'Motorist struck metallic spikes on fast lane. Both front tires flat. Help@Out app panic button triggered. Armed escort and roadside tyre change needed.'
    }
  },
  {
    id: 'santam-breakdown',
    partnerName: 'Santam SOS Roadside',
    label: '🛠️ Santam: Mechanical Breakdown on N3 Highway',
    data: {
      insuredName: 'Farai Moyo',
      contactPhone: '+27 84 310 9988',
      vehicleInfo: 'Charcoal Toyota Fortuner 2.8 GD-6 [ND 721-394]',
      latitude: -29.7891,
      longitude: 30.3412,
      locationName: 'N3 Southbound, Mariannhill Toll Plaza approach, KZN',
      emergencyType: 'breakdown' as const,
      incidentSeverity: 'medium' as const,
      policyNumber: 'SAN-ROAD-625109',
      externalReferenceId: 'SAN-INC-11029',
      telematicsTriggered: false,
      notes: 'Coolant hose rupture causing engine temperature alarm. Motorist stranded on dangerous hard shoulder. Flatbed rollback recovery required.'
    }
  }
];

export const AdminPartnerAPIModal: React.FC<AdminPartnerAPIModalProps> = ({
  isOpen,
  onClose,
  onSOSCreated
}) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'simulator' | 'docs'>('keys');
  const [partnerKeys, setPartnerKeys] = useState<PartnerApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // New Key Form State
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerType, setNewPartnerType] = useState<PartnerApiKey['partnerType']>('insurance');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  // Simulator Form State
  const [simSelectedKey, setSimSelectedKey] = useState<string>('');
  const [simInsuredName, setSimInsuredName] = useState('Pieter van der Merwe');
  const [simContactPhone, setSimContactPhone] = useState('+27 82 459 1182');
  const [simVehicleInfo, setSimVehicleInfo] = useState('Silver VW Amarok 3.0 V6 TDI [CA 829-411]');
  const [simLatitude, setSimLatitude] = useState(-25.8642);
  const [simLongitude, setSimLongitude] = useState(28.1724);
  const [simLocationName, setSimLocationName] = useState('N1 North near Brakfontein Interchange, Centurion');
  const [simEmergencyType, setSimEmergencyType] = useState<'crash' | 'spiking_puncture' | 'breakdown' | 'accident' | 'crime_threat' | 'medical'>('crash');
  const [simSeverity, setSimSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');
  const [simPolicyNumber, setSimPolicyNumber] = useState('DISC-POL-984210');
  const [simExternalRef, setSimExternalRef] = useState('CLM-2026-CRASH-0419');
  const [simTelematics, setSimTelematics] = useState(true);
  const [simNotes, setSimNotes] = useState('G-force impact sensor detected sudden 18G deceleration. Airbag deployment telematics signal confirmed.');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResponse, setSimResponse] = useState<PartnerSOSResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Docs Code Snippet Tab
  const [docsLanguage, setDocsLanguage] = useState<'curl' | 'js' | 'python'>('curl');

  // Load Partner Keys
  const loadPartnerKeys = async () => {
    setIsLoadingKeys(true);
    setActionError(null);
    try {
      const token = localStorage.getItem('adminToken') || 'admin-auth-token-charlesodendaal43';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const email = user.email || 'charlesodendaal43@gmail.com';

      const res = await fetch('/api/admin/partner-keys', {
        headers: {
          'x-admin-token': token,
          'x-user-email': email
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load partner keys (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data.partnerKeys)) {
        setPartnerKeys(data.partnerKeys);
        if (!simSelectedKey && data.partnerKeys.length > 0) {
          setSimSelectedKey(data.partnerKeys[0].apiKey);
        }
      }
    } catch (err: any) {
      console.error('Error fetching partner keys:', err);
      setActionError(err.message || 'Could not load partner API keys');
    } finally {
      setIsLoadingKeys(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPartnerKeys();
    }
  }, [isOpen]);

  const handleCopyKey = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreatePartnerKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    setIsSavingKey(true);
    setActionError(null);
    try {
      const token = localStorage.getItem('adminToken') || 'admin-auth-token-charlesodendaal43';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const email = user.email || 'charlesodendaal43@gmail.com';

      const res = await fetch('/api/admin/partner-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
          'x-user-email': email
        },
        body: JSON.stringify({
          partnerName: newPartnerName.trim(),
          partnerType: newPartnerType,
          contactEmail: newContactEmail.trim() || undefined,
          contactPhone: newContactPhone.trim() || undefined,
          webhookUrl: newWebhookUrl.trim() || undefined,
          notes: newNotes.trim() || undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create partner API key');
      }

      setShowNewKeyForm(false);
      setNewPartnerName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setNewWebhookUrl('');
      setNewNotes('');
      await loadPartnerKeys();
    } catch (err: any) {
      setActionError(err.message || 'Error generating key');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleToggleKey = async (id: string) => {
    try {
      const token = localStorage.getItem('adminToken') || 'admin-auth-token-charlesodendaal43';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const email = user.email || 'charlesodendaal43@gmail.com';

      const res = await fetch(`/api/admin/partner-keys/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'x-admin-token': token,
          'x-user-email': email
        }
      });

      if (res.ok) {
        await loadPartnerKeys();
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!window.confirm(`Revoke and permanently delete the API key for "${name}"? Third-party systems using this key will immediately be blocked.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken') || 'admin-auth-token-charlesodendaal43';
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const email = user.email || 'charlesodendaal43@gmail.com';

      const res = await fetch(`/api/admin/partner-keys/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': token,
          'x-user-email': email
        }
      });

      if (res.ok) {
        await loadPartnerKeys();
      }
    } catch (err) {
      console.error('Delete key error:', err);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_SCENARIOS.find((p) => p.id === presetId);
    if (!preset) return;

    setSimInsuredName(preset.data.insuredName);
    setSimContactPhone(preset.data.contactPhone);
    setSimVehicleInfo(preset.data.vehicleInfo);
    setSimLatitude(preset.data.latitude);
    setSimLongitude(preset.data.longitude);
    setSimLocationName(preset.data.locationName);
    setSimEmergencyType(preset.data.emergencyType);
    setSimSeverity(preset.data.incidentSeverity);
    setSimPolicyNumber(preset.data.policyNumber);
    setSimExternalRef(preset.data.externalReferenceId);
    setSimTelematics(preset.data.telematicsTriggered);
    setSimNotes(preset.data.notes);

    // Auto select corresponding key if available
    const matchingKey = partnerKeys.find(k => k.partnerName.toLowerCase().includes(preset.partnerName.toLowerCase()));
    if (matchingKey) {
      setSimSelectedKey(matchingKey.apiKey);
    }
  };

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimResponse(null);
    setSimError(null);

    const apiKey = simSelectedKey || partnerKeys[0]?.apiKey || 'ins_live_partner_demo';

    try {
      const payload = {
        name: simInsuredName,
        phone: simContactPhone,
        latitude: simLatitude,
        longitude: simLongitude,
        locationName: simLocationName,
        vehicleInfo: simVehicleInfo,
        emergencyType: simEmergencyType,
        incidentSeverity: simSeverity,
        policyNumber: simPolicyNumber || undefined,
        externalReferenceId: simExternalRef || undefined,
        telematicsTriggered: simTelematics,
        notes: simNotes
      };

      const res = await fetch('/api/v1/partner/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to submit SOS`);
      }

      setSimResponse(data);
      if (onSOSCreated) {
        onSOSCreated();
      }
    } catch (err: any) {
      setSimError(err.message || 'Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadSpec = async () => {
    try {
      const res = await fetch('/api/v1/partner/spec');
      const spec = await res.json();
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'live-traffic-partner-sos-openapi.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading spec:', err);
    }
  };

  if (!isOpen) return null;

  const currentApiKey = simSelectedKey || partnerKeys[0]?.apiKey || 'ins_live_YOUR_API_KEY';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#090C12] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-2xl shadow-inner">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Insurance & Partner SOS Integration API
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  v1.0 REST
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable Discovery Insure, Outsurance, Santam, and telematics systems to post SOS emergencies programmatically.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800/80 bg-[#07090F] overflow-x-auto">
          {[
            { id: 'keys', label: `Insurance Partners & API Keys (${partnerKeys.length})`, icon: KeyRound },
            { id: 'simulator', label: 'Interactive Live Sandbox', icon: Send },
            { id: 'docs', label: 'Developer Spec & Code Snippets', icon: Code2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md font-black shadow-blue-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {actionError && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-between">
              <span>{actionError}</span>
              <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white font-bold ml-2">
                Dismiss
              </button>
            </div>
          )}

          {/* TAB 1: PARTNER API KEYS */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {/* Top Action Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0B0E17] border border-slate-800/90 rounded-2xl p-4">
                <div>
                  <h3 className="text-sm font-black text-white">Configured Insurance & Telematics Providers</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Each partner receives a unique <code className="text-amber-400 font-mono text-[11px]">X-API-Key</code> that authenticates their app and webhook alerts.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={loadPartnerKeys}
                    disabled={isLoadingKeys}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition cursor-pointer"
                    title="Refresh Partner Keys"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingKeys ? 'animate-spin text-blue-400' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewKeyForm(!showNewKeyForm)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-blue-950/50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showNewKeyForm ? 'Cancel Form' : 'Generate Partner Key'}</span>
                  </button>
                </div>
              </div>

              {/* Create Partner Key Form */}
              {showNewKeyForm && (
                <form onSubmit={handleCreatePartnerKey} className="bg-slate-900/90 border border-blue-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                      <KeyRound className="w-4 h-4" />
                      <span>Issue New Partner Integration Credential</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNewKeyForm(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Insurance Partner / Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newPartnerName}
                        onChange={(e) => setNewPartnerName(e.target.value)}
                        placeholder="e.g. Discovery Insure, MiWay, King Price"
                        className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Partner Category
                      </label>
                      <select
                        value={newPartnerType}
                        onChange={(e) => setNewPartnerType(e.target.value as any)}
                        className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="insurance">Insurance Company / Telematics</option>
                        <option value="roadside">Roadside Assistance & Towing</option>
                        <option value="fleet">Fleet Telematics & Tracking</option>
                        <option value="security">Private Security Armed Escort</option>
                        <option value="other">General Partner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Contact Dispatch Email
                      </label>
                      <input
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="e.g. dispatch@insurance.co.za"
                        className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Contact Phone / Hotline
                      </label>
                      <input
                        type="text"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="e.g. +27 11 529 0000"
                        className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Dispatch Callback Webhook URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                        placeholder="https://api.insurance.co.za/v1/sos/webhook (receives live status updates)"
                        className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Integration Notes / Telematics Description
                      </label>
                      <textarea
                        rows={2}
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="e.g. Emergency telematics impact sensors and roadside app panic button alerts."
                        className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowNewKeyForm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingKey}
                      className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-950/50 flex items-center space-x-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isSavingKey ? 'Generating Key...' : 'Issue API Key'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Partner Keys List */}
              <div className="space-y-3">
                {partnerKeys.length === 0 ? (
                  <div className="p-8 text-center bg-[#07090F] border border-slate-800 rounded-2xl text-slate-400">
                    <KeyRound className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-300">No partner API keys configured yet.</p>
                    <p className="text-xs text-slate-500 mt-1">Click "Generate Partner Key" to provision an integration key.</p>
                  </div>
                ) : (
                  partnerKeys.map((key) => {
                    const isCopied = copiedKeyId === key.id;
                    return (
                      <div
                        key={key.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          key.enabled
                            ? 'bg-[#0B0E17] border-slate-800 hover:border-slate-700'
                            : 'bg-slate-950/60 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-white text-sm tracking-tight">{key.partnerName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                {key.partnerType}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  key.enabled
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-red-500/15 text-red-300 border border-red-500/30'
                                }`}
                              >
                                {key.enabled ? 'Active / Enabled' : 'Revoked / Disabled'}
                              </span>
                            </div>

                            {/* API Key Box */}
                            <div className="flex items-center space-x-2 pt-1">
                              <div className="bg-[#05080E] border border-slate-800 px-3 py-1 rounded-xl flex items-center space-x-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Key:</span>
                                <code className="text-xs font-mono font-bold text-amber-300 select-all">
                                  {key.apiKey}
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyKey(key.apiKey, key.id)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition cursor-pointer"
                                title="Copy API Key"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              {isCopied && (
                                <span className="text-[11px] font-bold text-emerald-400">Copied!</span>
                              )}
                            </div>
                          </div>

                          {/* Stats & Actions */}
                          <div className="flex items-center space-x-3 text-xs self-stretch lg:self-auto justify-between lg:justify-end border-t lg:border-t-0 border-slate-800/80 pt-2 lg:pt-0">
                            <div className="text-left lg:text-right text-[11px]">
                              <span className="text-slate-500 block">Total Dispatches</span>
                              <span className="font-mono font-black text-sm text-white">
                                {key.totalDispatches || 0}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleKey(key.id)}
                                className={`p-2 rounded-xl border transition cursor-pointer ${
                                  key.enabled
                                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                                title={key.enabled ? 'Click to disable' : 'Click to enable'}
                              >
                                {key.enabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteKey(key.id, key.partnerName)}
                                className="p-2 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-500/30 transition cursor-pointer"
                                title="Revoke and Delete API Key"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {key.notes && (
                          <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 italic">
                            "{key.notes}"
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE SIMULATOR / SANDBOX */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              {/* Scenario Preset Selector */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Quick Simulation Presets
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {PRESET_SCENARIOS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPreset(preset.id)}
                      className="p-3 text-left rounded-xl bg-[#05080E] hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300 block">
                        {preset.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                        {preset.data.locationName.slice(0, 32)}...
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sandbox Form */}
              <form onSubmit={handleRunSimulation} className="bg-[#0B0E17] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Live API Request Dispatcher</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-bold">API Key:</span>
                    <select
                      value={simSelectedKey}
                      onChange={(e) => setSimSelectedKey(e.target.value)}
                      className="bg-[#05080E] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono focus:outline-none"
                    >
                      {partnerKeys.map((k) => (
                        <option key={k.id} value={k.apiKey}>
                          {k.partnerName} ({k.apiKey.slice(0, 15)}...)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Motorist / Insured Name *</label>
                    <input
                      type="text"
                      required
                      value={simInsuredName}
                      onChange={(e) => setSimInsuredName(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Contact Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={simContactPhone}
                      onChange={(e) => setSimContactPhone(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Vehicle Information</label>
                    <input
                      type="text"
                      value={simVehicleInfo}
                      onChange={(e) => setSimVehicleInfo(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">GPS Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={simLatitude}
                      onChange={(e) => setSimLatitude(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">GPS Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={simLongitude}
                      onChange={(e) => setSimLongitude(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Emergency Incident Type</label>
                    <select
                      value={simEmergencyType}
                      onChange={(e) => setSimEmergencyType(e.target.value as any)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="crash">💥 Major Collision / Crash</option>
                      <option value="spiking_puncture">⚠️ Spiking Puncture</option>
                      <option value="breakdown">🛠️ Mechanical Breakdown</option>
                      <option value="crime_threat">🚨 Crime Threat / Hijack Suspicion</option>
                      <option value="medical">🚑 Medical Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Policy Number (Optional)</label>
                    <input
                      type="text"
                      value={simPolicyNumber}
                      onChange={(e) => setSimPolicyNumber(e.target.value)}
                      placeholder="e.g. POL-984210"
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">External Claim / Incident Ref</label>
                    <input
                      type="text"
                      value={simExternalRef}
                      onChange={(e) => setSimExternalRef(e.target.value)}
                      placeholder="e.g. CLM-88219"
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Incident Severity</label>
                    <select
                      value={simSeverity}
                      onChange={(e) => setSimSeverity(e.target.value as any)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="critical">🔴 Critical (Immediate Response)</option>
                      <option value="high">🟠 High (Urgent)</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Roadway Location Name</label>
                    <input
                      type="text"
                      value={simLocationName}
                      onChange={(e) => setSimLocationName(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>

                  <div className="flex items-center space-x-2 self-end pb-2">
                    <label className="flex items-center space-x-2 text-slate-300 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={simTelematics}
                        onChange={(e) => setSimTelematics(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0 w-4 h-4"
                      />
                      <span>⚡ Telematics Impact Fired</span>
                    </label>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 font-bold mb-1 text-[11px]">Telematics / Dispatcher Notes</label>
                    <textarea
                      rows={2}
                      value={simNotes}
                      onChange={(e) => setSimNotes(e.target.value)}
                      className="w-full bg-[#05080E] border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Endpoint: <span className="text-emerald-400 font-bold">POST /api/v1/partner/sos</span>
                  </span>
                  <button
                    type="submit"
                    disabled={isSimulating}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition cursor-pointer shadow-lg shadow-blue-950/60 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSimulating ? 'animate-ping' : ''}`} />
                    <span>{isSimulating ? 'Transmitting to Network...' : 'Simulate Partner API Call'}</span>
                  </button>
                </div>
              </form>

              {/* Simulation Result Box */}
              {simError && (
                <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl space-y-1">
                  <span className="text-xs font-black text-red-400 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Simulation Error</span>
                  </span>
                  <p className="text-xs text-red-300">{simError}</p>
                </div>
              )}

              {simResponse && (
                <div className="p-5 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                        HTTP 201 Created — SOS Broadcasted!
                      </span>
                    </div>
                    <span className="text-xs font-mono font-black text-white px-2 py-0.5 rounded bg-emerald-600/30 border border-emerald-500/40">
                      Ref: {simResponse.callRef}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{simResponse.message}</p>

                  <div className="bg-[#05080E] p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                    <pre>{JSON.stringify(simResponse, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DEVELOPER SPEC & CODE SNIPPETS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white">Enterprise Integration Documentation</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                    Insurance software engineering teams can ingest roadside assistance requests, automated telematics black-box alerts, or app panic button triggers into the platform via standard RESTful JSON.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSpec}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-500/30 text-xs font-bold transition shrink-0 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download OpenAPI Spec (JSON)</span>
                </button>
              </div>

              {/* Endpoint Specifications */}
              <div className="space-y-4">
                <div className="bg-[#0B0E17] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs">
                      POST
                    </span>
                    <span className="font-mono text-xs font-bold text-white">/api/v1/partner/sos</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Dispatches a new emergency roadside, spiking puncture, or collision SOS into the rapid patrol network.
                  </p>

                  <div className="bg-[#05080E] p-3 rounded-xl border border-slate-800 text-[11px] space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 uppercase font-bold">Authentication:</span>
                      <code className="text-amber-300 font-mono">Header: X-API-Key: &lt;YOUR_PARTNER_KEY&gt;</code>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 uppercase font-bold">Content-Type:</span>
                      <code className="text-slate-300 font-mono">application/json</code>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0B0E17] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-600 text-white font-mono font-black text-xs">
                      GET
                    </span>
                    <span className="font-mono text-xs font-bold text-white">/api/v1/partner/sos/:callRef</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Returns the real-time response status (<code className="text-amber-300 font-mono">active</code>, <code className="text-amber-300 font-mono">dispatched</code>, <code className="text-amber-300 font-mono">resolved</code>), assigned patrol unit, and timestamps.
                  </p>
                </div>
              </div>

              {/* Ready-to-use Code Snippets */}
              <div className="bg-[#0B0E17] border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span>Copy-Paste Integration Code</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {(['curl', 'js', 'python'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setDocsLanguage(lang)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition cursor-pointer ${
                          docsLanguage === lang
                            ? 'bg-blue-600 text-white font-black'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative bg-[#05080E] p-4 rounded-xl border border-slate-800 overflow-x-auto text-xs font-mono">
                  {docsLanguage === 'curl' && (
                    <pre className="text-emerald-300 leading-relaxed">
{`curl -X POST https://your-domain.com/api/v1/partner/sos \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${currentApiKey}" \\
  -d '{
    "insuredName": "Pieter van der Merwe",
    "contactPhone": "+27 82 459 1182",
    "latitude": -25.8642,
    "longitude": 28.1724,
    "locationName": "N1 North near Brakfontein Interchange, Centurion",
    "vehicleInfo": "Silver VW Amarok 3.0 V6 TDI [CA 829-411]",
    "emergencyType": "crash",
    "incidentSeverity": "critical",
    "policyNumber": "DISC-POL-984210",
    "externalReferenceId": "CLM-2026-CRASH-0419",
    "telematicsTriggered": true,
    "notes": "Telematics airbag signal fired. Immediate response needed."
  }'`}
                    </pre>
                  )}

                  {docsLanguage === 'js' && (
                    <pre className="text-sky-300 leading-relaxed">
{`// JavaScript / TypeScript (Node.js or Frontend)
async function dispatchInsuranceSOS() {
  const response = await fetch('https://your-domain.com/api/v1/partner/sos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '${currentApiKey}'
    },
    body: JSON.stringify({
      insuredName: 'Pieter van der Merwe',
      contactPhone: '+27 82 459 1182',
      latitude: -25.8642,
      longitude: 28.1724,
      locationName: 'N1 North near Brakfontein Interchange, Centurion',
      vehicleInfo: 'Silver VW Amarok 3.0 V6 TDI [CA 829-411]',
      emergencyType: 'crash',
      incidentSeverity: 'critical',
      policyNumber: 'DISC-POL-984210',
      externalReferenceId: 'CLM-2026-CRASH-0419',
      telematicsTriggered: true,
      notes: 'Automatic vehicle collision alert'
    })
  });

  const result = await response.json();
  console.log('Registered Call Ref:', result.callRef);
  return result;
}`}
                    </pre>
                  )}

                  {docsLanguage === 'python' && (
                    <pre className="text-amber-300 leading-relaxed">
{`# Python 3 (requests)
import requests

url = "https://your-domain.com/api/v1/partner/sos"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${currentApiKey}"
}
payload = {
    "insuredName": "Pieter van der Merwe",
    "contactPhone": "+27 82 459 1182",
    "latitude": -25.8642,
    "longitude": 28.1724,
    "locationName": "N1 North near Brakfontein Interchange, Centurion",
    "vehicleInfo": "Silver VW Amarok 3.0 V6 TDI [CA 829-411]",
    "emergencyType": "crash",
    "incidentSeverity": "critical",
    "policyNumber": "DISC-POL-984210",
    "externalReferenceId": "CLM-2026-CRASH-0419",
    "telematicsTriggered": True,
    "notes": "Telematics airbag impact alert"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Dispatched Call Ref:", data.get("callRef"))`}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#07090F] border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Insurance Ingestion Engine Ready</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
