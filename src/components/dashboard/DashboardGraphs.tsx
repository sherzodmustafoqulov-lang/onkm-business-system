'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  CreditCard,
  Building2,
  Users2,
  Headphones,
  UserCheck,
  Coins,
} from 'lucide-react';

interface GraphsProps {
  data: {
    savdoDinamikasi: Array<{ date: string; savdo: number; tushum: number; foyda: number; cogs: number }>;
    tushumByMethod: Array<{ method: string; amount: number }>;
    supportCategories: Array<{ category: string; count: number }>;
    filiallarDinamikasi: Array<{ id: string; name: string; code: string; sales: number; ordersCount: number; availableFm: number }>;
    menejerlarDinamikasi: Array<{
      id: string;
      name: string;
      fullName?: string;
      branchName?: string;
      totalSales: number;
      totalPaid: number;
      totalDebt: number;
      ordersCount: number;
      newCustomersCount?: number;
      totalCustomersCount?: number;
      newDevicesCount?: number;
      ofdConnectedCount?: number;
    }>;
    mijozlarDinamikasi: Array<{ type: string; count: number }>;
  };
}

export default function DashboardGraphs({ data }: GraphsProps) {
  const [activeTab, setActiveTab] = useState<'financial' | 'branches' | 'managers' | 'support' | 'customers'>('financial');
  const [managerMetricType, setManagerMetricType] = useState<'onboarding' | 'finance'>('onboarding');

  const formatUZS = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  const formatTooltipCurrency = (val: any) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";
  };

  const colors = ['#2563EB', '#10B981', '#6366F1', '#F59E0B', '#EC4899', '#06B6D4', '#8B5CF6'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs mb-6">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Biznes Grafiklari & Dinamik Tahlil
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real vaqtdagi savdo, tushum, foyda, filiallar va xodimlar unumdorligi
          </p>
        </div>

        {/* Tab Switcher for 7 Graphs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'financial'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Savdo, Tushum & Foyda</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'branches'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Filiallar Kesimida</span>
          </button>

          <button
            onClick={() => setActiveTab('managers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'managers'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Menejerlar Reytingi</span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'support'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Support Tahlili</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'customers'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            <span>Mijozlar Tuzilishi</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Savdo, Tushum va Foyda Dinamikasi */}
      {activeTab === 'financial' && (
        <div className="space-y-6">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.savdoDinamikasi} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavdo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTushum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFoyda" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={formatUZS} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatTooltipCurrency(value),
                    name === 'savdo' ? 'Savdo' : name === 'tushum' ? 'Tushum' : 'Sof Foyda',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === 'savdo' ? 'Savdo Hajmi' : value === 'tushum' ? 'Kassa Tushumi' : 'Sof Foyda'
                  }
                />
                <Area type="monotone" dataKey="savdo" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSavdo)" />
                <Area type="monotone" dataKey="tushum" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTushum)" />
                <Area type="monotone" dataKey="foyda" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFoyda)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Sub Row: Payment Methods Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                To'lov Usullari Bo'yicha Tushum (Naqd, Bank, HUMO, Click...)
              </h3>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tushumByMethod} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="method" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} tickFormatter={formatUZS} />
                    <Tooltip formatter={(val: any) => formatTooltipCurrency(val)} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                      {data.tushumByMethod.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit margin summary */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Moliyaviy Rentabellik Xulosasi
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real vaqt rejimida barcha bitimlardagi uskunalar (ONKM, POS, Fiskal Modul) tannarxi va sotuv narxi qiyoslanadi.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Jami Savdo</div>
                  <div className="text-xs font-bold text-blue-700">
                    {formatUZS(data.savdoDinamikasi.reduce((sum, d) => sum + d.savdo, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Tannarx (COGS)</div>
                  <div className="text-xs font-bold text-slate-600">
                    {formatUZS(data.savdoDinamikasi.reduce((sum, d) => sum + d.cogs, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Sof Foyda</div>
                  <div className="text-xs font-bold text-emerald-600">
                    {formatUZS(data.savdoDinamikasi.reduce((sum, d) => sum + d.foyda, 0))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Filiallar Dinamikasi */}
      {activeTab === 'branches' && (
        <div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.filiallarDinamikasi} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={formatUZS} />
                <Tooltip formatter={(val: any) => formatTooltipCurrency(val)} />
                <Legend formatter={(val) => (val === 'sales' ? 'Savdo Summasi' : val)} />
                <Bar dataKey="sales" fill="#2563EB" radius={[8, 8, 0, 0]} name="Savdo Summasi">
                  {data.filiallarDinamikasi.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100">
            {data.filiallarDinamikasi.map((b) => (
              <div key={b.id} className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-center">
                <div className="text-xs font-bold text-slate-800 truncate">{b.name}</div>
                <div className="text-[11px] font-bold text-blue-600 mt-1">{formatUZS(b.sales)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">FM: {b.availableFm} ta</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Menejerlar Reytingi & Yangi Mijozlar */}
      {activeTab === 'managers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Menejerlar: Yangi Mijozlar Ulash & Savdo Unumdorligi
              </div>
              <p className="text-[11px] text-slate-500">
                Tanlangan davrda menejerlar tomonidan jalb qilingan yangi mijozlar, biriktirilgan qurilmalar va tushum
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setManagerMetricType('onboarding')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  managerMetricType === 'onboarding'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Yangi Mijozlar & Qurilmalar
              </button>
              <button
                type="button"
                onClick={() => setManagerMetricType('finance')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  managerMetricType === 'finance'
                    ? 'bg-white text-blue-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                💰 Savdo & Undirilgan To'lov
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {managerMetricType === 'onboarding' ? (
                <BarChart
                  layout="vertical"
                  data={data.menejerlarDinamikasi}
                  margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} ta`,
                      name === 'newCustomersCount' ? 'Yangi Ulangan Mijozlar' : 'Biriktirilgan Qurilmalar (ONKM/FM)',
                    ]}
                  />
                  <Legend
                    formatter={(v) =>
                      v === 'newCustomersCount' ? 'Yangi Ulangan Mijozlar (ta)' : 'Biriktirilgan Qurilmalar (ta)'
                    }
                  />
                  <Bar
                    dataKey="newCustomersCount"
                    fill="#2563EB"
                    radius={[0, 6, 6, 0]}
                    name="newCustomersCount"
                  />
                  <Bar
                    dataKey="newDevicesCount"
                    fill="#8B5CF6"
                    radius={[0, 6, 6, 0]}
                    name="newDevicesCount"
                  />
                </BarChart>
              ) : (
                <BarChart
                  layout="vertical"
                  data={data.menejerlarDinamikasi}
                  margin={{ top: 10, right: 20, left: 30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" stroke="#94A3B8" fontSize={10} tickFormatter={formatUZS} />
                  <YAxis dataKey="name" type="category" stroke="#94A3B8" fontSize={11} />
                  <Tooltip formatter={(val: any) => formatTooltipCurrency(val)} />
                  <Legend formatter={(v) => (v === 'totalSales' ? 'Jami Savdo' : "Undirilgan To'lov")} />
                  <Bar dataKey="totalSales" fill="#2563EB" radius={[0, 6, 6, 0]} name="totalSales" />
                  <Bar dataKey="totalPaid" fill="#10B981" radius={[0, 6, 6, 0]} name="totalPaid" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Manager Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            {data.menejerlarDinamikasi.slice(0, 6).map((m: any, idx: number) => (
              <div
                key={m.id}
                className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 hover:bg-white hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">{m.fullName || m.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-semibold">
                    {m.branchName || 'Bosh filial'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-medium">Yangi Mijozlar:</div>
                    <div className="font-bold text-blue-600 text-xs">+{m.newCustomersCount || 0} ta</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-medium">Jami Portfel:</div>
                    <div className="font-bold text-slate-700 text-xs">{m.totalCustomersCount || 0} ta</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-medium">Qurilmalar:</div>
                    <div className="font-bold text-purple-600 text-xs">{m.newDevicesCount || 0} ta</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-medium">Savdo Hajmi:</div>
                    <div className="font-bold text-emerald-600 text-xs">{formatUZS(m.totalSales || 0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Support Tahlili */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[300px]">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kategoriyalar bo'yicha murojaatlar soni
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.supportCategories} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="category" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]}>
                  {data.supportCategories.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200/90 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Asosiy Muammolar
              </div>
              <div className="space-y-2">
                {data.supportCategories.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">{c.category}</span>
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {c.count} ta
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-200">
              Ushbu murojaatlarga texnik xodimlar va operatorlar biriktirilgan.
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Mijozlar Tuzilishi */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[280px]">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tadbirkorlik Shakli Bo'yicha Mijozlar
            </h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mijozlarDinamikasi} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="type" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]}>
                  {data.mijozlarDinamikasi.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/90 flex flex-col justify-center space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Mijozlar Portfeli Tahlili
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tizimda ro'yxatdan o'tgan korxonalarning asosiy qismi MCHJ (Mas'uliyati Cheklangan Jamiyat) va YaTT (Yakka Tartibdagi Tadbirkor) hisoblanadi.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {data.mijozlarDinamikasi.map((m, i) => (
                <span key={i} className="text-xs font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700">
                  {m.type}: <strong>{m.count} ta</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
