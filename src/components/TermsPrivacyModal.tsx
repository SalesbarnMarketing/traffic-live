import React, { useState } from 'react';
import { 
  X, Shield, FileText, Lock, Eye, AlertCircle, CheckCircle2, 
  Mail, Phone, ExternalLink, HelpCircle, UserCheck, Scale, Clock
} from 'lucide-react';

interface TermsPrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<TermsPrivacyModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'collection' | 'sharing' | 'rights'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div 
        className="bg-[#0B111E] text-slate-100 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-amber-500 to-orange-500 opacity-90" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-800 bg-[#0F1626] shrink-0 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-cyan-400">Live Traffic NPC</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full border border-slate-700">
                  POPIA Compliant
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Privacy Policy & Terms of Use
              </h2>
              <p className="text-[11px] text-slate-400">
                Effective 1 September 2026 · Applies to trafficlive.co.za, the app, and alert channels
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Close Terms Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Quick Pills */}
        <div className="px-5 py-2.5 bg-[#0B111E] border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs shrink-0 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Full Document
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collection')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
              activeTab === 'collection'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            What We Collect
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sharing')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
              activeTab === 'sharing'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Sharing & Retention
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rights')}
            className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition whitespace-nowrap ${
              activeTab === 'rights'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Your POPIA Rights
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
          
          {/* Executive Short Version Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-blue-950/30 border border-cyan-500/30 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold">
              <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-xs uppercase tracking-wide">Summary / Short Version</span>
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              If you use the Live Traffic website or app, you agree that we may collect the information below so we can publish live road alerts, place a GPS pin on the right stretch of road, notify emergency responders and towing, and warn other road users. <strong>We do not sell your data.</strong> You can ask us to correct or delete what we hold.
            </p>
          </div>

          {/* Section 1: Who We Are */}
          {(activeTab === 'all' || activeTab === 'rights') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">1</span>
                <span>Who we are</span>
              </h3>
              <p>
                Live Traffic NPC (also written LiveTraffic / Livetraffic) is a South African non-profit traffic and incident reporting organisation. We run <span className="text-cyan-400 font-semibold">trafficlive.co.za</span> and the app at <span className="text-cyan-400 font-semibold">trafficlive.co.za/app/</span>, plus alerts on WhatsApp, X (<span className="text-cyan-400">@LiveTrafficNPC</span>) and Facebook.
              </p>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span>Contact Email: <strong className="text-white">Info@trafficlive.co.za</strong></span>
                <span className="text-slate-400 text-[11px]">Responsible party under Act 4 of 2013 (POPIA)</span>
              </div>
            </section>
          )}

          {/* Section 2: What you agree to */}
          {activeTab === 'all' && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">2</span>
                <span>What you agree to when you use the app or site</span>
              </h3>
              <p>
                By creating an account, submitting an incident report, turning on location, uploading a photo or video, or otherwise using the platform, you agree that Live Traffic NPC may process your personal information for the purposes in this Policy.
              </p>
              <p className="text-amber-300 text-xs font-medium bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30">
                If you do not agree, do not use the app, do not submit a report, and keep location and camera permissions turned off.
              </p>
            </section>
          )}

          {/* Section 3: What we collect */}
          {(activeTab === 'all' || activeTab === 'collection') && (
            <section className="space-y-3">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">3</span>
                <span>What we collect</span>
              </h3>
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#131E33] border-b border-slate-800 text-slate-300 font-bold">
                      <th className="p-3 w-1/3">If you…</th>
                      <th className="p-3">We may collect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-slate-300">
                    <tr>
                      <td className="p-3 font-semibold text-white bg-slate-900/40">Open the site or app</td>
                      <td className="p-3">IP address, device/browser type, pages opened, cookies needed to run the site</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white bg-slate-900/40">Create an account or message us</td>
                      <td className="p-3">Name or nickname, mobile number, email, WhatsApp number, handle</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white bg-slate-900/40">Turn on location or drop a pin</td>
                      <td className="p-3">Live location or a GPS pin for that report. Location stays off until you enable it</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white bg-slate-900/40">Submit an incident report</td>
                      <td className="p-3">Road, direction, interchange, time, event type (crash, stall, fire, animal, congestion, closure, spiking, hijacking and similar), lane status, short description, vehicle details you choose to give</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white bg-slate-900/40">Upload a photo or video</td>
                      <td className="p-3">The file and anything visible in it (vehicles, plates, faces, scene)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-white bg-slate-900/40">Are on scene as a responder or tow</td>
                      <td className="p-3">Name, contact, area covered, and confirmation that you are on scene</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Other people may also report an incident that includes you (e.g. a crash you are in, a vehicle matching a description). That information is still personal information under POPIA.
              </p>
            </section>
          )}

          {/* Section 4: Why we use it */}
          {(activeTab === 'all' || activeTab === 'collection') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">4</span>
                <span>Why we use it</span>
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                <li>Place the alert on the correct road and GPS pin</li>
                <li>Warn approaching traffic in time to prevent secondary collisions</li>
                <li>Notify SAPS, Metro Police, traffic authorities, Fire, EMS, SANRAL, Live Traffic Responders and towing providers who need the scene</li>
                <li>Publish a short public alert on the app, website, WhatsApp, X and Facebook (<span className="text-cyan-400">#Livetraffic #ArriveAlive</span>)</li>
                <li>Keep the platform secure and deal with false or abusive reports</li>
                <li>Circulate an Amber Alert / missing-child appeal when a parent, guardian or competent authority asks us to</li>
              </ul>
              <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 font-semibold text-xs">
                ✓ We do not sell personal information. We do not use incident data to market products to you.
              </div>
            </section>
          )}

          {/* Section 5: Location */}
          {(activeTab === 'all' || activeTab === 'collection') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">5</span>
                <span>Location</span>
              </h3>
              <p>
                The app only gets your location if you allow it or if you drop a pin on a report. A pin on a public alert is the scene location, not a live track of you after you stop sharing. Responders and towing may receive that pin so they can find the incident. You can switch location off in your phone settings at any time.
              </p>
            </section>
          )}

          {/* Section 6: Photos, video, health and crime information */}
          {(activeTab === 'all' || activeTab === 'collection') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">6</span>
                <span>Photos, video, health and crime information</span>
              </h3>
              <p>
                A photo or clip can identify a person, a number plate or an injury. Only upload media that shows the hazard and that you have the right to share.
              </p>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                <li>Do not film injured people, children or bodies at close range unless it is required to identify someone and a competent person has asked for that.</li>
                <li>We may crop, blur or withhold faces, plates and graphic frames before a public post.</li>
                <li>Raw briefing media sent only to SAPS, Fire or EMS is not automatically posted.</li>
                <li>Notes such as “casualties on scene” or “spiking / hijacking suspected” are used only to activate the right responders and warn traffic. We do not keep a medical file or a police docket on anyone.</li>
              </ul>
            </section>
          )}

          {/* Section 7: Children */}
          {activeTab === 'all' && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">7</span>
                <span>Children</span>
              </h3>
              <p>
                This is not a children’s app. We only process a child’s information for an Amber Alert or missing-child appeal requested by a parent, guardian or authority, or where a child is involved in an incident and the information is needed to protect life. We do not publish a child’s home address or school on a public alert.
              </p>
            </section>
          )}

          {/* Section 8: Who we share with */}
          {(activeTab === 'all' || activeTab === 'sharing') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">8</span>
                <span>Who we share with</span>
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-slate-300">
                <li><strong className="text-white">The public</strong> — a short alert (road, direction, event, time, pin, and a cleaned photo if needed)</li>
                <li><strong className="text-white">Emergency and road authorities</strong> — SAPS, Metro Police, traffic police, Fire, EMS, SANRAL and municipalities, when they need the scene</li>
                <li><strong className="text-white">Live Traffic Responders and towing providers</strong> — scene pin and operational details, not a list of private numbers for marketing</li>
                <li><strong className="text-white">Service providers</strong> who host the site, send messages or store files, under contract to us only</li>
                <li><strong className="text-white">A court or the Information Regulator</strong> when the law requires it</li>
              </ul>
            </section>
          )}

          {/* Section 9: How long we keep it */}
          {(activeTab === 'all' || activeTab === 'sharing') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">9</span>
                <span>How long we keep it (Retention Schedule)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Ordinary Congestion / Lane alerts:</span>
                  <span className="font-semibold text-white">Until road is clear, then short archive</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Crash & Hazard reports:</span>
                  <span className="font-semibold text-white">Generally up to 12 months</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Spiking / Hijacking / Crime reports:</span>
                  <span className="font-semibold text-white">Up to 3 years (longer if open investigation)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Raw Responder Photos:</span>
                  <span className="font-semibold text-white">90 days after scene is closed</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Live Location Streams:</span>
                  <span className="font-semibold text-white">Deleted when sharing stops</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Account Details:</span>
                  <span className="font-semibold text-white">Duration of account + 12 months</span>
                </div>
              </div>
            </section>
          )}

          {/* Section 10: Security */}
          {(activeTab === 'all' || activeTab === 'rights') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">10</span>
                <span>Security</span>
              </h3>
              <p>
                We take reasonable steps to lock down accounts, dispatch tools and raw media. A public alert is still public — do not put anything in a report that you are not prepared to see on a highway warning.
              </p>
              <p className="text-xs text-slate-300">
                If we have reason to believe personal information was accessed or taken without authorisation, we will notify the Information Regulator and affected people as soon as reasonably possible. Report a suspected incident to <strong className="text-cyan-400">Info@trafficlive.co.za</strong> with the subject <strong>SECURITY COMPROMISE</strong>.
              </p>
            </section>
          )}

          {/* Section 11: Your Rights */}
          {(activeTab === 'all' || activeTab === 'rights') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">11</span>
                <span>Your Rights</span>
              </h3>
              <p>
                You can ask us to confirm what we hold, correct it, delete it where POPIA allows, or object to certain uses. Withdraw optional consents (location, camera, non-essential cookies) in the app or your phone settings.
              </p>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1 text-xs">
                <p>
                  Email <strong className="text-cyan-400">Info@trafficlive.co.za</strong> with the subject <strong>POPIA REQUEST</strong>. Identify the alert or photo if you can.
                </p>
                <p className="text-slate-400 text-[11px]">
                  We may refuse or limit a request where the law allows — for example where taking a pin down would create a false all-clear on a live scene, or where SAPS requires us to keep the record.
                </p>
              </div>
            </section>
          )}

          {/* Section 12: Cookies */}
          {activeTab === 'all' && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">12</span>
                <span>Cookies</span>
              </h3>
              <p>
                The site uses cookies that are required to run it, plus optional analytics so we can see which corridors are used. You can block non-essential cookies in your browser. Location and camera are phone permissions, not cookies.
              </p>
            </section>
          )}

          {/* Section 13: Complaints & Information Regulator */}
          {(activeTab === 'all' || activeTab === 'rights') && (
            <section className="space-y-2">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-mono">13</span>
                <span>Complaints & Regulatory Oversight</span>
              </h3>
              <p>
                Write to us first: <strong className="text-cyan-400">Info@trafficlive.co.za</strong>
              </p>
              <p>
                If that does not resolve it, lodge a free complaint with the Information Regulator (Form 5):
              </p>
              <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Email: <strong className="text-white">POPIAComplaints@inforegulator.org.za</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Web: <strong className="text-white">inforegulator.org.za</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Tel: <strong className="text-white">010 023 5200 / 0800 017 160</strong></span>
                </div>
              </div>
            </section>
          )}

          {/* Bottom Confirmation Box */}
          <div className="p-4 rounded-2xl bg-[#0F1829] border border-cyan-500/40 space-y-1.5">
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Using the app means you understand this</span>
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              You understand that Live Traffic NPC collects account details, reports, optional live location or GPS pins, and any photos or video you upload, and that a short version of an incident may be published so other road users and responders can act. You can stop sharing location, stop uploading media, and request correction or deletion at any time by emailing <strong>Info@trafficlive.co.za</strong>.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#0F1626] border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Live Traffic NPC · Non-Profit Public Safety
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-600/20 cursor-pointer transition"
          >
            Got it, Close
          </button>
        </div>

      </div>
    </div>
  );
};
