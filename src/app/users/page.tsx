'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  UserCog,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  TrendingUp,
  Briefcase,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  Activity,
  Send,
} from 'lucide-react';
import AddEmployeeModal from '@/components/users/AddEmployeeModal';
import RoleManagement from '@/components/users/RoleManagement';
import UserSessionsTab from '@/components/users/UserSessionsTab';
import SmsLogsTab from '@/components/users/SmsLogsTab';
import AdminResetPasswordModal from '@/components/users/AdminResetPasswordModal';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Xodimlar');
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetModalEmployee, setResetModalEmployee] = useState<any>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    'Xodimlar',
    'Kirishlar tarixi (Sessiyalar)',
    'SMS Xabarlar',
    'Rollar',
    'Permissionlar',
    'HR',
    'KPI',
  ];

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const togglePasswordVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEmployees = employees.filter((emp) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.phone?.includes(q) ||
      emp.role?.displayName?.toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Xodimlar & Xavfsizlik boshqaruvi</h1>
          <p className="text-xs text-slate-500">
            Foydalanuvchilar, korporativ @onkm.uz loginlar, SMS parollar va faol sessiyalar monitoringi
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Yangi xodim qo'shish
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6 border border-slate-200 overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {tab === 'Kirishlar tarixi (Sessiyalar)' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Kirishlar tarixi (Sessiyalar)
              </span>
            ) : (
              tab
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: XODIMLAR */}
      {activeTab === 'Xodimlar' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-200/80 flex items-center gap-4 bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="F.I.O, @onkm.uz login yoki telefon bo'yicha qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Jami xodimlar: <b>{filteredEmployees.length}</b> ta
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Xodim</th>
                  <th className="py-3 px-4">Login & Parol (Admin uchun)</th>
                  <th className="py-3 px-4">Lavozim & Rol</th>
                  <th className="py-3 px-4">Bo'lim & Filial</th>
                  <th className="py-3 px-4">KPI</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4 text-right">Harakatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      Yuklanmoqda...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                      Xodimlar topilmadi.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((u) => {
                    const profile = u.employeeProfile;
                    const latestKpi = profile?.kpiResults?.[0]?.totalScore || 0;
                    const isRevealed = !!revealedPasswords[u.id];

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => router.push(`/users/${u.id}`)}
                      >
                        {/* Employee Details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold overflow-hidden border border-slate-300 flex-shrink-0 text-xs shadow-xs">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                              ) : (
                                u.name?.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {u.phone || 'Telefon yo\'q'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Login & Password (Admin credentials view) */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            {/* Login */}
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                                {u.email}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleCopy(u.email, `email-${u.id}`, e)}
                                title="Loginni nusxalash"
                                className="text-slate-400 hover:text-blue-600 p-0.5 rounded"
                              >
                                {copiedId === `email-${u.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Password */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {u.tempPassword
                                    ? isRevealed
                                      ? u.tempPassword
                                      : '••••••••'
                                    : 'Shaxsiy parol'}
                                </span>

                                {u.tempPassword && (
                                  <button
                                    type="button"
                                    onClick={(e) => togglePasswordVisibility(u.id, e)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5"
                                    title={isRevealed ? 'Yashirish' : 'Parolni ko\'rish'}
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {u.tempPassword && (
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopy(u.tempPassword, `pass-${u.id}`, e)}
                                    title="Parolni nusxalash"
                                    className="text-slate-400 hover:text-emerald-600 p-0.5"
                                  >
                                    {copiedId === `pass-${u.id}` ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* Reset & SMS Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResetModalEmployee(u);
                                }}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded text-[10px] font-bold border border-slate-200 hover:border-blue-200 transition-colors flex items-center gap-1"
                                title="Yangi parol berish va SMS yuborish"
                              >
                                <Smartphone className="w-3 h-3 text-blue-500" />
                                SMS Reset
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Position & Role */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 text-xs">
                            {u.position?.name || 'Lavozim yo\'q'}
                          </div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                            {u.role?.displayName || u.role?.name || 'Rol yo\'q'}
                          </span>
                        </td>

                        {/* Department & Branch */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-700 text-xs">
                            {u.department?.name || 'Bo\'lim yo\'q'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {u.branch?.name || 'Markaziy filial'}
                          </div>
                        </td>

                        {/* KPI */}
                        <td className="py-3 px-4">
                          {profile ? (
                            <div className="flex items-center gap-1.5">
                              <TrendingUp
                                className={`w-3.5 h-3.5 ${
                                  latestKpi >= 80
                                    ? 'text-emerald-500'
                                    : latestKpi >= 50
                                    ? 'text-amber-500'
                                    : 'text-slate-400'
                                }`}
                              />
                              <span className="font-bold text-xs text-slate-800">{latestKpi}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Yo'q</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {profile?.employmentStatus === 'FAOL' || u.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Faol
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Nofaol
                            </span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => router.push(`/users/${u.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Ko'rish
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SESSIONS & AUDIT */}
      {activeTab === 'Kirishlar tarixi (Sessiyalar)' && <UserSessionsTab />}

      {/* TAB 3: SMS XABARLAR JURNALI */}
      {activeTab === 'SMS Xabarlar' && <SmsLogsTab />}

      {/* TAB 4: ROLLAR */}
      {activeTab === 'Rollar' && <RoleManagement />}

      {/* OTHER TABS */}
      {['Permissionlar', 'HR', 'KPI'].includes(activeTab) && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800">{activeTab} moduli</h2>
          <p className="text-sm mt-1 text-slate-500">
            Ushbu bo'lim konfiguratsiyasi tizim parametrlariga moslashtirilmoqda.
          </p>
        </div>
      )}

      {/* Modals */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchEmployees();
        }}
      />

      <AdminResetPasswordModal
        isOpen={!!resetModalEmployee}
        onClose={() => setResetModalEmployee(null)}
        employee={resetModalEmployee}
        onSuccess={() => {
          fetchEmployees();
        }}
      />
    </AppLayout>
  );
}
