import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  Radio,
  MapPin,
  Car,
  LogIn,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Phone,
  ExternalLink,
  Award,
  Zap,
  Lock,
  Sparkles,
  Users,
  Compass,
  Megaphone,
  Activity,
  Heart,
  Eye,
  Clock,
  ChevronRight
} from 'lucide-react';
import { LiveTrafficLogo } from './LiveTrafficLogo';
import { WhatsAppIcon } from './WhatsAppIcon';
import { WHATSAPP_CHANNEL_URL } from '../utils/whatsappShare';
import { AppFooter } from './AppFooter';

interface MarketingPageProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenOnboarding?: () => void;
}

export const MarketingPage: React.FC<MarketingPageProps> = ({
  onOpenLogin,
  onOpenRegister,
  onOpenOnboarding
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const featureCards = [
    {
      icon: <Radio className="w-6 h-6 text-[#D4A237]" />,
      title: 'Live Gauteng Hazard Radar',
      description: 'Real-time detection of high-risk spiking hotspots, road debris, active collisions, and dangerous conditions on N1, N3, N4, N12, and R21 corridors.',
      badge: 'Real-Time Feed'
    },
    {
      icon: <ShieldAlert className="w-6 h-6 text-red-400" />,
      title: 'One-Touch GPS Emergency SOS',
      description: 'Instant distress broadcasting with pin-point GPS coordinates directly dispatched to active patrol units, community responders, and emergency channels.',
      badge: 'Priority Response'
    },
    {
      icon: <Award className="w-6 h-6 text-amber-300" />,
      title: 'Advanced Defensive Driving',
      description: 'Official 4-module driver safety course covering hijack prevention, spiking avoidance, night driving, and emergency crash avoidance techniques.',
      badge: 'Certified Training'
    },
    {
      icon: <Megaphone className="w-6 h-6 text-emerald-400" />,
      title: 'Business & Advertiser Network',
      description: 'Reach thousands of daily Gauteng motorists, commuters, and fleet owners through sponsored feed placements and verified WhatsApp broadcasts.',
      badge: 'High Visibility'
    },
    {
      icon: <Compass className="w-6 h-6 text-cyan-400" />,
      title: 'Hands-Free Voice Assistant',
      description: 'Operate navigation, alert reporting, and hazard queries completely hands-free while driving with zero distraction behind the wheel.',
      badge: 'Safe Driving'
    },
    {
      icon: <Users className="w-6 h-6 text-purple-400" />,
      title: 'Community Verified Network',
      description: 'Join verified drivers sharing verified updates. Every report is audited and cross-referenced with official i-Traffic and SANRAL cameras.',
      badge: '100% Non-Profit'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Protected Motorists', sub: 'Active community' },
    { value: '24/7', label: 'Patrol Verification', sub: 'Live watch & cameras' },
    { value: '< 30s', label: 'Hazard Dispatch', sub: 'Instant alert latency' },
    { value: '100%', label: 'Non-Profit Mission', sub: 'Dedicated to saving lives' }
  ];

  const faqs = [
    {
      q: 'Why do I need to log in or register before accessing the app?',
      a: 'Live Traffic NPC is a community safety network. Registration ensures verified reporting, prevents fake or malicious hazard alerts, and enables personalized GPS emergency SOS dispatch to your exact location when you need help.'
    },
    {
      q: 'Is registration completely free?',
      a: 'Yes! Community driver registration is 100% free. You can report hazards, monitor real-time radar feeds, and access emergency dispatch immediately upon registering.'
    },
    {
      q: 'What is the Advanced Defensive Driving Course?',
      a: 'It is an official educational program designed by road safety professionals covering anti-hijacking strategies, spiking escape maneuvers, wet-weather handling, and vehicle control under stress.'
    },
    {
      q: 'How do advertisers and local businesses participate?',
      a: 'Businesses can select from starter to platinum advertising packages to showcase their services directly to thousands of daily motorists across the live radar app and WhatsApp broadcast channels.'
    }
  ];

  return (
    <div className="w-full min-h-full bg-[#070A10] text-slate-100 font-sans selection:bg-[#D4A237] selection:text-slate-950 flex flex-col pb-20">
      
      {/* TOP MARKETING NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#070A10]/90 backdrop-blur-md border-b border-[#D4A237]/30 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <LiveTrafficLogo size="xs" withGlow={true} />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base font-black tracking-wider text-white uppercase font-sans">
                  LIVE TRAFFIC <span className="text-[#D4A237]">NPC</span>
                </span>
                <span className="hidden sm:inline-flex text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4A237]/20 text-[#D4A237] border border-[#D4A237]/40">
                  Gauteng Radar
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
                Safe Roads Save Lives
              </p>
            </div>
          </div>

          {/* Top Auth Actions */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1.5 bg-[#0C1524] hover:bg-[#132238] text-slate-200 hover:text-white border border-[#D4A237]/50 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-[#D4A237]" />
              <span>Log In</span>
            </button>

            <button
              onClick={onOpenRegister}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-[#D4A237] via-[#E5B54C] to-[#B58525] hover:brightness-110 text-slate-950 px-3.5 sm:px-5 py-1.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition shadow-lg shadow-[#D4A237]/25 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>Register Free</span>
            </button>
          </div>

        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8">
        
        {/* Background Radial Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[680px] h-[380px] sm:h-[680px] bg-[#D4A237]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-8">
          
          {/* Official Badge Pill */}
          <div className="inline-flex items-center space-x-2 bg-[#0C1524] border border-[#D4A237]/60 px-4 py-1.5 rounded-full shadow-lg shadow-black/40">
            <span className="w-2 h-2 rounded-full bg-[#D4A237] animate-ping" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#D4A237]">
              Non-Profit Road Safety Initiative
            </span>
          </div>

          {/* Main Hero Headline */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-none font-sans drop-shadow-md">
              SAFE ROADS <span className="text-[#D4A237] block sm:inline">SAVE LIVES</span>
            </h1>
            <p className="text-base sm:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed pt-2">
              South Africa&apos;s real-time community traffic radar, verified hazard detection, and rapid GPS emergency response network.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto sm:max-w-none">
            
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto bg-gradient-to-r from-[#D4A237] via-[#E5B54C] to-[#B58525] hover:brightness-110 active:scale-98 text-slate-950 font-black text-sm sm:text-base uppercase py-4 px-8 rounded-2xl shadow-xl shadow-[#D4A237]/30 tracking-wider flex items-center justify-center space-x-2.5 transition cursor-pointer"
            >
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto bg-[#0C1524] hover:bg-[#132238] border border-[#D4A237]/60 active:scale-98 text-white font-black text-sm sm:text-base uppercase py-4 px-8 rounded-2xl shadow-lg tracking-wider flex items-center justify-center space-x-2.5 transition cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-[#D4A237]" />
              <span>Sign In to Radar</span>
            </button>

            <a
              href={WHATSAPP_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/60 active:scale-98 text-[#25D366] font-black text-sm sm:text-base py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              <WhatsAppIcon className="w-5 h-5 text-[#25D366] shrink-0" />
              <span>WhatsApp Alerts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

          </div>

          {/* Quick Notice */}
          <p className="text-xs text-slate-400 font-semibold">
            Already registered?{' '}
            <button
              onClick={onOpenLogin}
              className="text-[#D4A237] hover:underline font-bold cursor-pointer"
            >
              Click here to log in
            </button>{' '}
            to unlock the interactive map, hazard radar, and live feed.
          </p>

          {/* Key Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 pt-8">
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="bg-[#0C1424]/80 border border-[#D4A237]/30 rounded-2xl p-4 sm:p-5 text-center shadow-md backdrop-blur-sm"
              >
                <div className="text-2xl sm:text-3xl font-black text-[#D4A237] font-sans">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mt-1">
                  {s.label}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* LIVE RADAR INTERACTIVE PREVIEW CARD */}
      <section className="py-12 px-4 sm:px-8 bg-[#090E1A] border-y border-[#D4A237]/20">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-wide">
              Live Gauteng Highway Radar Status
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Real-time monitoring across vital corridors with instant alert broadcast.
            </p>
          </div>

          <div className="bg-[#050810] border border-[#D4A237]/50 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Live Ticker Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-red-400">
                  ACTIVE ROAD HAZARDS DETECTED
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-[#0C1424] px-3 py-1 rounded-full border border-slate-700 w-fit">
                Corridors: N1 • N3 • N4 • R21 • M1 • N12
              </span>
            </div>

            {/* Sample Alert Rows */}
            <div className="space-y-3">
              <div className="bg-[#0F172A] border border-red-500/40 rounded-xl p-3.5 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                      SPIKING HAZARD
                    </span>
                    <span className="text-xs font-bold text-white">N1 North near Pumulani Plaza</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Objects reported on road surface. Marked community patrol units notified. Maintain high alertness.
                  </p>
                </div>
              </div>

              <div className="bg-[#0F172A] border border-amber-500/40 rounded-xl p-3.5 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      CRASH / OBSTRUCTION
                    </span>
                    <span className="text-xs font-bold text-white">N3 Gilloolys Interchange</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Right lane obstructed heading South. Emergency services on scene. Expect delays.
                  </p>
                </div>
              </div>
            </div>

            {/* Access Gate Prompt */}
            <div className="bg-gradient-to-r from-[#D4A237]/20 via-[#0C1524] to-[#D4A237]/20 border border-[#D4A237] rounded-xl p-5 text-center space-y-3">
              <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                Log In or Register to Unlock the Full Interactive Map & Radar
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Access full interactive GPS zoom, distance proximity calculations, driver voice navigation, and direct community reports.
              </p>
              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  onClick={onOpenRegister}
                  className="bg-gradient-to-r from-[#D4A237] to-[#B58525] text-slate-950 font-black text-xs sm:text-sm px-6 py-2.5 rounded-xl uppercase tracking-wide hover:brightness-110 shadow-lg cursor-pointer active:scale-95"
                >
                  Register Free
                </button>
                <button
                  onClick={onOpenLogin}
                  className="bg-[#050810] text-white border border-[#D4A237] font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl uppercase tracking-wide hover:bg-[#0C1524] shadow-md cursor-pointer active:scale-95"
                >
                  Log In
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#D4A237]">
              COMMUNITY-POWERED DEFENSE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white">
              Engineered for South African Motorists
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              Every tool in Live Traffic NPC is built to keep you informed, alert, and safe during your daily commute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feat, idx) => (
              <div
                key={idx}
                className="bg-[#0C1424] border border-[#D4A237]/30 hover:border-[#D4A237] rounded-2xl p-6 space-y-4 transition-all duration-200 hover:-translate-y-1 shadow-lg group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-xl bg-[#070A10] border border-[#D4A237]/40">
                      {feat.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#D4A237]/15 text-[#D4A237] border border-[#D4A237]/30">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white group-hover:text-[#D4A237] transition">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={onOpenRegister}
                    className="text-xs font-bold text-[#D4A237] hover:text-amber-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Get started</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* DEFENSIVE DRIVING & ADVERTISER TEASER */}
      <section className="py-16 px-4 sm:px-8 bg-[#090F1C] border-y border-[#D4A237]/25">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Defensive Driving Info */}
          <div className="bg-[#050810] border border-[#D4A237]/50 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center space-x-2 text-[#D4A237]">
              <Award className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">
                CERTIFIED DRIVER PROGRAM
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase text-white">
              Advanced Defensive Driving Course
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Master the critical skills required on South African roads. Learn evasive steering, anti-spiking reactions, hijack risk reduction, and night navigation with verified instructor certification.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4A237] shrink-0" />
                <span>4-Module Interactive Curriculum</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4A237] shrink-0" />
                <span>Hijack & Spiking Emergency Escape Strategies</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#D4A237] shrink-0" />
                <span>Official PDF Certificate of Completion</span>
              </li>
            </ul>
            <button
              onClick={onOpenRegister}
              className="w-full bg-[#D4A237] hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm py-3 px-4 rounded-xl uppercase tracking-wider transition cursor-pointer shadow-md active:scale-95"
            >
              Register to Enroll in Course
            </button>
          </div>

          {/* Business & Advertiser Info */}
          <div className="bg-[#050810] border border-emerald-500/50 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Megaphone className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">
                GROW YOUR BUSINESS
              </span>
            </div>
            <h3 className="text-2xl font-black uppercase text-white">
              Advertise to Daily Gauteng Motorists
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Showcase your brand, emergency towing, legal service, or local retail shop directly to active commuters on the live radar feed and official WhatsApp channels.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct WhatsApp Click-to-Chat CTA</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Platform Social Broadcasts</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Self-Service Advertiser Portal & Analytics</span>
              </li>
            </ul>
            <button
              onClick={onOpenRegister}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm py-3 px-4 rounded-xl uppercase tracking-wider transition cursor-pointer shadow-md active:scale-95"
            >
              Register as an Advertiser
            </button>
          </div>

        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#D4A237]">
              COMMON QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-[#0C1424] border border-[#D4A237]/30 rounded-2xl p-4 sm:p-5 transition"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 text-[#D4A237] transition-transform duration-200 ${
                      activeFaq === idx ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <p className="text-xs sm:text-sm text-slate-300 mt-3 pt-3 border-t border-slate-800 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FINAL BOTTOM CTA BANNER */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-b from-[#0C1524] to-[#070A10] border-t border-[#D4A237]/30">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          
          <div className="w-16 h-16 mx-auto">
            <LiveTrafficLogo size="md" withGlow={true} />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black uppercase text-white leading-tight">
            Ready to Drive with <span className="text-[#D4A237]">Total Confidence</span>?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            Join South Africa&apos;s leading road safety network. Create your account in under 30 seconds to access live radar, hazard reports, and emergency SOS response.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto bg-gradient-to-r from-[#D4A237] via-[#E5B54C] to-[#B58525] hover:brightness-110 text-slate-950 font-black text-sm uppercase py-4 px-8 rounded-2xl shadow-xl shadow-[#D4A237]/30 tracking-wider flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Free Account</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto bg-[#070A10] hover:bg-[#0C1524] border border-[#D4A237] text-white font-black text-sm uppercase py-4 px-8 rounded-2xl shadow-md tracking-wider flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4 text-[#D4A237]" />
              <span>Sign In</span>
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#05070D] border-t border-slate-900 pt-6 text-center text-slate-500 text-xs">
        <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400 font-semibold px-4 pb-4">
          <button
            onClick={onOpenRegister}
            className="hover:text-[#D4A237] transition cursor-pointer"
          >
            Register
          </button>
          <span>•</span>
          <button
            onClick={onOpenLogin}
            className="hover:text-[#D4A237] transition cursor-pointer"
          >
            Log In
          </button>
          <span>•</span>
          {onOpenOnboarding && (
            <>
              <button
                onClick={onOpenOnboarding}
                className="hover:text-[#D4A237] transition cursor-pointer"
              >
                Safety Guidelines
              </button>
              <span>•</span>
            </>
          )}
          <a
            href={WHATSAPP_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#25D366] transition flex items-center space-x-1"
          >
            <span>WhatsApp Channel</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <AppFooter className="mt-0 border-t border-slate-800/80" />
      </footer>

    </div>
  );
};
