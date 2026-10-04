'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Package,
  Users,
  Headphones,
} from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('sales');

  useEffect(() => {
    fetch('/api/dashboard/stats?dateFilter=30days')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";
  };

  const handleDownloadReport = (type: string) => {
    if (!stats) return;

    let rows: any[][] = [];
    let filename = `ONKM_${type}_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'sales') {
      rows = [
        ['ONKM BUSINESS ERP - SAVDO VA BUYURTMALAR HISOBOTI (30 KUNLIK)'],
        ['Eksport sanasi:', new Date().toLocaleString('uz-UZ')],
        [],
        ['Buyurtma №', 'Mijoz', 'Menejer', 'Summa', 'Etap', 'Holat', 'Sana'],
        ...(stats.tables?.oxirgiBuyurtmalar || []).map((o: any) => [
          o.orderNumber,
          `"${o.customer?.companyName || 'Mijoz'}"`,
          `"${o.manager?.name || '-'}"`,
          o.finalAmount,
          o.pipelineStage,
          o.status,
          new Date(o.createdAt).toLocaleDateString('uz-UZ'),
        ]),
      ];
    } else if (type === 'debtors') {
      rows = [
        ['ONKM BUSINESS ERP - QARZDOR MIJOZLAR REYESTRI'],
        ['Eksport sanasi:', new Date().toLocaleString('uz-UZ')],
        [],
        ['Korxona Nomi', 'STIR', 'Telefon', 'Qarzdorlik Summasi', 'OFD Holati', 'Filial'],
        ...(stats.tables?.qarzdorMijozlar || []).map((c: any) => [
          `"${c.companyName}"`,
          c.inn,
          c.phone,
          c.debt,
          c.ofdStatus,
          `"${c.branch?.name || '-'}"`,
        ]),
      ];
    } else if (type === 'stock') {
      rows = [
        ['ONKM BUSINESS ERP - OMBOR QOLDIQLARI VA TANQIS MAHSULOTLAR'],
        ['Eksport sanasi:', new Date().toLocaleString('uz-UZ')],
        [],
        ['SKU', 'Nomi', 'Kategoriya', 'Mavjud', 'Rezerv', 'Minimal Me\'yor'],
        ...(stats.tables?.kamQolganMahsulotlar || []).map((p: any) => [
          p.sku,
          `"${p.name}"`,
          `"${p.category}"`,
          p.available,
          p.reserved,
          p.minStock,
        ]),
      ];
    } else if (type === 'support') {
      rows = [
        ['ONKM BUSINESS ERP - TEXNIK SUPPORT VA XIZMATLAR HISOBOTI'],
        ['Eksport sanasi:', new Date().toLocaleString('uz-UZ')],
        [],
        ['Ticket №', 'Mijoz', 'Kategoriya', 'Muammo', 'Ustuvorlik', 'Holat', 'Operator'],
        ...(stats.tables?.ochiqSupportlar || []).map((t: any) => [
          t.ticketNumber,
          `"${t.customer?.companyName || 'Mijoz'}"`,
          t.category,
          `"${t.issue}"`,
          t.priority,
          t.status,
          `"${t.assignedTo?.name || '-'}"`,
        ]),
      ];
    }

    const csvContent = '\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportCards = [
    {
      id: 'sales',
      title: 'Savdo & Buyurtmalar Hisoboti',
      desc: 'Barcha buyurtmalar, savdo hajmi, realizatsiya qilingan apparatlar va fiskal modullar',
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'debtors',
      title: 'Debitorlik & To\'lovlar Hisoboti',
      desc: 'Mijozlar qarzdorligi, kassa aylanmasi, bank o\'tkazmalari va qoldiq qarzlar tahlili',
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'stock',
      title: 'Ombor Qoldiqlari & Tanqislik',
      desc: 'Minimal zaxiradan kam qolgan tovarlar, filiallararo zaxira balansi va FMlar hisoboti',
      icon: Package,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'support',
      title: 'Support SLAs & Xizmatlar',
      desc: 'Texnik murojaatlar soni, muammolar turlari, hal etish muddatlari va operatorlar unumdorligi',
      icon: Headphones,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Analitik Hisobotlar & Eksport Markazi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Moliya, ombor, mijozlar va servis faoliyati bo'yicha rasmiy hisobotlarni shakllantirish
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Eksport: CSV / Excel Tayyor
          </span>
        </div>
      </div>

      {/* Grid of Report Generators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {reportCards.map((rc) => {
          const Icon = rc.icon;
          return (
            <div
              key={rc.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${rc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    30 KUNLIK
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{rc.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{rc.desc}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedReport(rc.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                    selectedReport === rc.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Ko'rish
                </button>

                <button
                  onClick={() => handleDownloadReport(rc.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Yuklab olish (CSV)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Preview of Selected Report */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Tanlangan hisobot namunasi (Real vaqtdagi bazadan)
            </h3>
          </div>
          <button
            onClick={() => handleDownloadReport(selectedReport)}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Download className="w-3.5 h-3.5" />
            <span>To'liq hisobotni yuklash</span>
          </button>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-xs text-slate-400">
            Hisobot ma'lumotlari yuklanmoqda...
          </div>
        ) : (
          <div className="text-xs text-slate-600">
            {selectedReport === 'sales' && (
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">
                  Oxirgi buyurtmalar soni: {stats?.tables?.oxirgiBuyurtmalar?.length || 0} ta
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400">Jami Savdo</span>
                    <div className="font-bold text-blue-700 text-sm">{formatUZS(stats?.kpis?.bugungiSavdo || 0)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400">Undirilgan Tushum</span>
                    <div className="font-bold text-emerald-700 text-sm">{formatUZS(stats?.kpis?.bugungiTushum || 0)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400">Kutilayotgan Qarz</span>
                    <div className="font-bold text-red-700 text-sm">{formatUZS(stats?.kpis?.qarzdorlik || 0)}</div>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'debtors' && (
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">
                  Debitor qarzdor korxonalar: {stats?.tables?.qarzdorMijozlar?.length || 0} ta
                </div>
                <div className="text-[11px] text-slate-500">
                  Ushbu ro'yxat bo'yicha soliq hisob-fakturalari va da'vo xatlari chiqarish mumkin.
                </div>
              </div>
            )}

            {selectedReport === 'stock' && (
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">
                  Tanqis tovarlar: {stats?.tables?.kamQolganMahsulotlar?.length || 0} ta
                </div>
                <div className="text-[11px] text-slate-500">
                  Minimal me'yordan kam qolgan tovarlar bo'yicha yetkazib beruvchilarga xarid buyurtmasi shakllantiriladi.
                </div>
              </div>
            )}

            {selectedReport === 'support' && (
              <div className="space-y-2">
                <div className="font-semibold text-slate-800">
                  Ochiq support murojaatlari: {stats?.tables?.ochiqSupportlar?.length || 0} ta
                </div>
                <div className="text-[11px] text-slate-500">
                  Mijozlar shikoyatlari va servis xizmati kechikishlari nazoratda.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
