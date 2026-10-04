'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Globe,
  Clock,
  Laptop,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Shield,
  CheckCircle,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';

export default function UserSessionsTab() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    total: 0,
    activeNow: 0,
    uniqueIpsCount: 0,
    avgDurationMin: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isTerminating, setIsTerminating] = useState<string | null>(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (statusFilter && statusFilter !== 'ALL') query.set('status', statusFilter);

      const res = await fetch(`/api/sessions?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load user sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSessions();
  };

  const handleTerminateSession = async (sessionId: string, userName: string) => {
    if (!confirm(`${userName} xodimining sessiyasini majburiy to'xtatmoqchimisiz? Xodim tizimdan chiqariladi.`)) {
      return;
    }

    setIsTerminating(sessionId);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/terminate`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchSessions();
      } else {
        const err = await res.json();
        alert(err.error || 'Xatolik yuz berdi');
      }
    } catch (error) {
      console.error(error);
      alert('Tizim xatosi yuz berdi');
    } finally {
      setIsTerminating(null);
    }
  };

  const formatDuration = (minutes: number) => {
    if (!minutes || minutes <= 0) return '1 daqiqadan kam';
    if (minutes < 60) return `${minutes} daqiqa`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours} soat ${rest > 0 ? `${rest} daq` : ''}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Now */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center relative">
            <Activity className="w-6 h-6 animate-pulse" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100"></span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.activeNow || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Hozir tizimda faol (Online)</div>
          </div>
        </div>

        {/* Avg Duration */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {stats.avgDurationMin || 0} <span className="text-xs font-normal text-slate-400">daq</span>
            </div>
            <div className="text-xs font-semibold text-slate-500">O'rtacha ishlash vaqti</div>
          </div>
        </div>

        {/* Unique IPs */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.uniqueIpsCount || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Unikal IP manzillar</div>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.total || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Jami kirishlar jurnali</div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Xodim, @onkm.uz, IP manzil yoki qurilma bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-50"
            >
              <option value="ALL">Barcha sessiyalar</option>
              <option value="ACTIVE">🟢 Faqat Online (Faol)</option>
              <option value="LOGGED_OUT">Chiqilgan (Tarix)</option>
            </select>

            <button
              onClick={fetchSessions}
              className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Xodim (Kim)</th>
                <th className="py-3 px-4">Kirish vaqti</th>
                <th className="py-3 px-4">Qancha vaqt (Davomiyligi)</th>
                <th className="py-3 px-4">Qaysi IP manzil</th>
                <th className="py-3 px-4">Qurilma / Brauzer</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    Sessiyalar yuklanmoqda...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                    Hech qanday kirish sessiyasi topilmadi.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const u = s.user || {};
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold overflow-hidden text-xs border border-slate-300 flex-shrink-0">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                            <div className="text-[11px] text-blue-600 font-medium">
                              {u.email}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {u.role?.displayName || u.role?.name} • {u.branch?.name || 'Markaziy'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Login Timestamp */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {new Date(s.loginAt).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {new Date(s.loginAt).toLocaleTimeString('uz-UZ')}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4">
                        {s.isLive ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Online ({formatDuration(s.durationMinutes)})
                          </div>
                        ) : (
                          <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {formatDuration(s.durationMinutes)}
                          </div>
                        )}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-800">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          {s.ipAddress || '127.0.0.1'}
                        </div>
                      </td>

                      {/* Device & Browser */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{s.deviceInfo || 'Desktop'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {s.isLive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                            Chiqilgan
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {s.isLive ? (
                          <button
                            onClick={() => handleTerminateSession(s.id, u.name)}
                            disabled={isTerminating === s.id}
                            className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-all shadow-xs"
                            title="Xodimni tizimdan majburiy chiqarish"
                          >
                            {isTerminating === s.id ? 'To\'xtatilmoqda...' : 'Chiqarish'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
