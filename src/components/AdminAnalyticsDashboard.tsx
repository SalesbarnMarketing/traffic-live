import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  IncidentReport, EmergencySOS, Donation 
} from '../types';
import { 
  formatDuration, parseDateToMillis, formatReadableDateTime 
} from '../utils/dateParser';
import { 
  TrendingUp, TrendingDown, Clock, ShieldCheck, AlertTriangle, 
  Activity, CheckCircle2, Award, Zap, Filter, RefreshCw, 
  Calendar, PieChart as PieIcon, BarChart3, Download, Copy, Check, Users, Car, Wrench
} from 'lucide-react';

interface AdminAnalyticsDashboardProps {
  reports: IncidentReport[];
  sosRequests: EmergencySOS[];
  donations?: Donation[];
  onNavigateToSOS?: () => void;
  onNavigateToReports?: () => void;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  reports = [],
  sosRequests = [],
  donations = [],
  onNavigateToSOS,
  onNavigateToReports
}) => {
  const [timeRange, setTimeRange] = useState<'all' | '30d' | '7d' | '24h'>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Time-filtered datasets
  const filteredData = useMemo(() => {
    const now = Date.now();
    let cutoff = 0;
    if (timeRange === '24h') cutoff = now - 24 * 60 * 60 * 1000;
    else if (timeRange === '7d') cutoff = now - 7 * 24 * 60 * 60 * 1000;
    else if (timeRange === '30d') cutoff = now - 30 * 24 * 60 * 60 * 1000;

    const filteredSOS = cutoff > 0 
      ? sosRequests.filter(s => (parseDateToMillis(s.createdAt) || 0) >= cutoff)
      : sosRequests;

    const filteredReports = cutoff > 0
      ? reports.filter(r => (parseDateToMillis(r.createdAt) || parseDateToMillis(r.timestamp) || 0) >= cutoff)
      : reports;

    const filteredDonations = cutoff > 0
      ? donations.filter(d => (parseDateToMillis(d.createdAt) || 0) >= cutoff)
      : donations;

    return {
      sos: filteredSOS,
      reports: filteredReports,
      donations: filteredDonations
    };
  }, [reports, sosRequests, donations, timeRange]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const { sos, reports: reps, donations: dons } = filteredData;
    
    // Total SOS metrics
    const totalSOS = sos.length;
    const resolvedSOS = sos.filter(s => s.status === 'resolved');
    const dispatchedSOS = sos.filter(s => s.status === 'dispatched');
    const pendingSOS = sos.filter(s => s.status === 'active');
    const sosResolutionRate = totalSOS > 0 ? Math.round((resolvedSOS.length / totalSOS) * 100) : 100;

    // Response times calculation
    let totalTurnaroundMs = 0;
    let validTurnaroundCount = 0;
    let totalDispatchLatencyMs = 0;
    let validDispatchCount = 0;

    sos.forEach(s => {
      const created = parseDateToMillis(s.createdAt);
      if (!created) return;

      if (s.dispatchedAt) {
        const disp = parseDateToMillis(s.dispatchedAt);
        if (disp && disp >= created) {
          totalDispatchLatencyMs += (disp - created);
          validDispatchCount++;
        }
      }

      if (s.resolvedAt || s.status === 'resolved') {
        const resolved = s.resolvedAt ? parseDateToMillis(s.resolvedAt) : Date.now();
        if (resolved && resolved >= created) {
          totalTurnaroundMs += (resolved - created);
          validTurnaroundCount++;
        }
      }
    });

    const avgTurnaroundMs = validTurnaroundCount > 0 ? Math.round(totalTurnaroundMs / validTurnaroundCount) : 0;
    const avgDispatchMs = validDispatchCount > 0 ? Math.round(totalDispatchLatencyMs / validDispatchCount) : 0;

    // Reports metrics
    const totalReports = reps.length;
    const approvedReports = reps.filter(r => r.status === 'approved' || r.status === 'resolved');
    const resolvedReports = reps.filter(r => r.status === 'resolved');
    const pendingReports = reps.filter(r => r.status === 'pending');
    const reportResolutionRate = totalReports > 0 ? Math.round((resolvedReports.length / totalReports) * 100) : 0;

    // Financial / Pothole backing
    const totalDonationAmount = dons.reduce((sum, d) => sum + (d.amount || 0), 0);
    const fixedPotholesCount = dons.filter(d => d.isFixed).length;

    return {
      totalSOS,
      resolvedSOS: resolvedSOS.length,
      dispatchedSOS: dispatchedSOS.length,
      pendingSOS: pendingSOS.length,
      sosResolutionRate,
      avgTurnaroundMs,
      avgTurnaroundText: avgTurnaroundMs > 0 ? formatDuration(avgTurnaroundMs, 'verbose') : 'N/A',
      avgDispatchMs,
      avgDispatchText: avgDispatchMs > 0 ? formatDuration(avgDispatchMs, 'verbose') : 'Instant',
      totalReports,
      approvedReports: approvedReports.length,
      resolvedReports: resolvedReports.length,
      pendingReports: pendingReports.length,
      reportResolutionRate,
      totalDonationAmount,
      fixedPotholesCount
    };
  }, [filteredData]);

  // Chart 1: Emergency SOS Breakdown by Incident Type
  const sosTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.sos.forEach(s => {
      const type = s.emergencyType ? s.emergencyType.replace(/_/g, ' ') : 'General Assistance';
      const formatted = type.charAt(0).toUpperCase() + type.slice(1);
      counts[formatted] = (counts[formatted] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredData.sos]);

  // Chart 2: Average Turnaround Time by Emergency Type
  const turnaroundByTypeData = useMemo(() => {
    const times: Record<string, { totalMs: number; count: number }> = {};
    filteredData.sos.forEach(s => {
      const type = s.emergencyType ? s.emergencyType.replace(/_/g, ' ') : 'General';
      const formatted = type.charAt(0).toUpperCase() + type.slice(1);
      const created = parseDateToMillis(s.createdAt);
      if (!created) return;
      
      const end = s.resolvedAt ? parseDateToMillis(s.resolvedAt) : (s.status === 'resolved' ? created + 25 * 60 * 1000 : null);
      if (end && end >= created) {
        if (!times[formatted]) times[formatted] = { totalMs: 0, count: 0 };
        times[formatted].totalMs += (end - created);
        times[formatted].count += 1;
      }
    });

    return Object.entries(times).map(([category, item]) => {
      const avgMinutes = Math.round((item.totalMs / item.count) / 60000);
      return {
        category,
        avgMinutes: Math.max(1, avgMinutes),
        calls: item.count
      };
    }).sort((a, b) => a.avgMinutes - b.avgMinutes);
  }, [filteredData.sos]);

  // Chart 3: Responder & Patrol Unit Dispatch Performance
  const responderPerformanceData = useMemo(() => {
    const responders: Record<string, { total: number; resolved: number; totalMs: number; timeCount: number }> = {};
    
    filteredData.sos.forEach(s => {
      const name = s.responderName || 'Unassigned / Patrol Queue';
      if (!responders[name]) responders[name] = { total: 0, resolved: 0, totalMs: 0, timeCount: 0 };
      responders[name].total += 1;
      if (s.status === 'resolved') responders[name].resolved += 1;

      const created = parseDateToMillis(s.createdAt);
      const resolved = s.resolvedAt ? parseDateToMillis(s.resolvedAt) : null;
      if (created && resolved && resolved >= created) {
        responders[name].totalMs += (resolved - created);
        responders[name].timeCount += 1;
      }
    });

    return Object.entries(responders).map(([name, data]) => {
      const avgTurnaround = data.timeCount > 0 ? Math.round((data.totalMs / data.timeCount) / 60000) : 0;
      return {
        name: name.length > 22 ? name.slice(0, 20) + '...' : name,
        dispatches: data.total,
        resolved: data.resolved,
        avgTurnaroundMins: avgTurnaround
      };
    }).sort((a, b) => b.dispatches - a.dispatches);
  }, [filteredData.sos]);

  // Chart 4: Incident Reports by Category & Status
  const reportsCategoryData = useMemo(() => {
    const categories: Record<string, { pending: number; approved: number; resolved: number; total: number }> = {};
    
    filteredData.reports.forEach(r => {
      const cat = (r.category || 'hazard').toUpperCase();
      if (!categories[cat]) categories[cat] = { pending: 0, approved: 0, resolved: 0, total: 0 };
      categories[cat].total += 1;
      if (r.status === 'resolved') categories[cat].resolved += 1;
      else if (r.status === 'approved') categories[cat].approved += 1;
      else categories[cat].pending += 1;
    });

    return Object.entries(categories).map(([category, counts]) => ({
      category,
      Pending: counts.pending,
      'Live Alerts': counts.approved,
      Resolved: counts.resolved,
      Total: counts.total
    })).sort((a, b) => b.Total - a.Total);
  }, [filteredData.reports]);

  // Chart 5: Hourly Incident & SOS Distribution Pattern (00:00 - 23:00)
  const hourlyDistributionData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      sos: 0,
      hazards: 0,
      total: 0
    }));

    filteredData.sos.forEach(s => {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime())) {
        const h = d.getHours();
        hours[h].sos += 1;
        hours[h].total += 1;
      }
    });

    filteredData.reports.forEach(r => {
      const dateStr = r.createdAt || r.timestamp;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const h = d.getHours();
        hours[h].hazards += 1;
        hours[h].total += 1;
      }
    });

    return hours;
  }, [filteredData.sos, filteredData.reports]);

  // Copy full analytics SITREP summary
  const handleCopyAnalyticsSummary = () => {
    const summary = `📊 [LIVETRAFFIC HIGHWAY & SOS RESPONSE ANALYTICS SUMMARY]\n` +
      `📅 Time Range: ${timeRange.toUpperCase()}\n` +
      `⏱️ Avg SOS Turnaround Time: ${kpis.avgTurnaroundText}\n` +
      `⚡ Avg Dispatch Latency: ${kpis.avgDispatchText}\n` +
      `🎯 SOS Resolution Rate: ${kpis.sosResolutionRate}% (${kpis.resolvedSOS}/${kpis.totalSOS} calls resolved)\n` +
      `🚨 Active Distress Calls: ${kpis.pendingSOS} Pending, ${kpis.dispatchedSOS} Dispatched\n` +
      `🚧 Road Hazard Reports: ${kpis.totalReports} total (${kpis.resolvedReports} resolved, ${kpis.approvedReports} live)\n` +
      `💰 Pothole Fix Backing: R${kpis.totalDonationAmount.toLocaleString()} (${kpis.fixedPotholesCount} verified fixed)\n` +
      `📅 Generated: ${new Date().toLocaleString()}`;

    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Controls */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500/20 to-red-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                Response Statistics, Performance & Turnaround Graphs
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Live metrics covering motorist turnaround times, dispatch latency, responder unit efficiency, and hazard resolution.
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Selector & Export Action */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="bg-[#0A0B0D] p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === 'all' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === '30d' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === '7d' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('24h')}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === '24h' ? 'bg-amber-500 text-slate-950 font-black shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              24 Hours
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyAnalyticsSummary}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer shadow-sm"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span>{copiedSummary ? 'Summary Copied!' : 'Copy Stats Briefing'}</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Average SOS Turnaround Time */}
        <div className="bg-[#0F1115] border border-amber-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/60 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Avg SOS Turnaround</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">{kpis.avgTurnaroundText}</div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>Time from distress call to safe resolution</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Average Dispatch Latency */}
        <div className="bg-[#0F1115] border border-blue-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/60 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-400">Avg Dispatch Latency</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">{kpis.avgDispatchText}</div>
            <p className="text-[11px] text-slate-400 mt-1">
              <span>Call received to patrol unit en-route</span>
            </p>
          </div>
        </div>

        {/* KPI 3: SOS Resolution Rate */}
        <div className="bg-[#0F1115] border border-emerald-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/60 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">SOS Resolution Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-300 font-mono">{kpis.sosResolutionRate}%</div>
            <div className="text-xs font-mono text-slate-400">
              {kpis.resolvedSOS}/{kpis.totalSOS} Calls
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <span>{kpis.pendingSOS} pending • {kpis.dispatchedSOS} active patrol</span>
          </p>
        </div>

        {/* KPI 4: Road Hazards & Potholes Fixed */}
        <div className="bg-[#0F1115] border border-purple-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/60 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-400">Hazards & Potholes</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-black text-white font-mono">{kpis.resolvedReports + kpis.fixedPotholesCount}</div>
            <div className="text-xs font-mono text-emerald-400 font-bold">Verified Fixed</div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <span>{kpis.approvedReports} live active corridor hazards</span>
          </p>
        </div>
      </div>

      {/* Main Charts Row 1: Turnaround Time by Incident Type & Emergency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Average Turnaround Time (Minutes) by Emergency Type */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Turnaround Duration by Emergency Category</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Average minutes elapsed from initial distress call to motorist safe resolution.
              </p>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
              Minutes (Mins)
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            {turnaroundByTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                No resolved emergency call durations recorded in this timeframe.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnaroundByTypeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} unit=" min" />
                  <YAxis type="category" dataKey="category" stroke="#64748B" tick={{ fontSize: 11, fill: '#E2E8F0' }} width={110} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0D12', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                    formatter={(val: any, name: any) => [`${val} Minutes`, 'Avg Turnaround']}
                  />
                  <Bar dataKey="avgMinutes" fill="#F59E0B" radius={[0, 8, 8, 0]}>
                    {turnaroundByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Emergency SOS Incident Type Distribution (Donut Chart) */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-red-400" />
                <span>Emergency Distress Volume by Incident Type</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Proportional breakdown of highway spiking, breakdowns, collisions & security calls.
              </p>
            </div>
            <span className="text-[10px] font-mono text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-500/30">
              {kpis.totalSOS} Total Calls
            </span>
          </div>

          <div className="h-[280px] w-full flex flex-col sm:flex-row items-center justify-center">
            {sosTypeData.length === 0 ? (
              <div className="text-slate-500 text-xs font-medium">No SOS requests in this timeframe.</div>
            ) : (
              <>
                <div className="h-[200px] sm:h-full w-full sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sosTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {sosTypeData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B0D12', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                        formatter={(val: any) => [`${val} Calls`, 'Volume']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 space-y-1.5 pl-2 overflow-y-auto max-h-[220px]">
                  {sosTypeData.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-200 truncate font-semibold">{entry.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white shrink-0 ml-2">
                        {entry.value} ({kpis.totalSOS > 0 ? Math.round((entry.value / kpis.totalSOS) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Responder Unit Performance & Hourly Incident Heat Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Responder Unit Activity & Average Resolution */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Patrol Officer & Partner Unit Performance</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Number of emergency dispatches assigned and successfully resolved per unit.
              </p>
            </div>
          </div>

          <div className="h-[280px] w-full pt-2">
            {responderPerformanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                No responder unit logs available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responderPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748B" 
                    tick={{ fontSize: 10, fill: '#94A3B8' }} 
                    angle={-20} 
                    textAnchor="end" 
                  />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0D12', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="dispatches" name="Dispatches Assigned" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Resolved & Secure" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 4: 24-Hour Peak Incident Volume Distribution (Area Chart) */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>24-Hour Peak Incident Activity Curve</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Time-of-day traffic hazard and SOS spikes to guide patrol shift readiness.
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              00:00 - 23:00
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSOS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHazards" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={2} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0D12', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="sos" name="SOS Distress Calls" stroke="#EF4444" fillOpacity={1} fill="url(#colorSOS)" />
                <Area type="monotone" dataKey="hazards" name="Hazard Reports" stroke="#06B6D4" fillOpacity={1} fill="url(#colorHazards)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 3: Incident Reports Category Breakdown */}
      <div className="bg-[#0F1115] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Corridor Hazard Categories & Resolution Status</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Categorical distribution of potholes, road debris, spiking hotspots, and crashes.
            </p>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {kpis.totalReports} Total Reports
          </span>
        </div>

        <div className="h-[280px] w-full pt-2">
          {reportsCategoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
              No hazard reports recorded in this timeframe.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportsCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="category" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B0D12', borderColor: '#334155', borderRadius: '12px', color: '#FFF' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Live Alerts" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Resolved" fill="#3B82F6" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
