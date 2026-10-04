'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Headphones,
  Wrench,
  PackageX,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Users2,
  Building2,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

interface TablesProps {
  tables: {
    oxirgiBuyurtmalar: Array<any>;
    oxirgiUlanganMijozlar?: Array<any>;
    menejerlarReytingi?: Array<any>;
    ochiqSupportlar: Array<any>;
    bugungiOrnatishlar: Array<any>;
    kamQolganMahsulotlar: Array<any>;
    qarzdorMijozlar: Array<any>;
  };
}

export default function DashboardTables({ tables }: TablesProps) {
  const [activeTableTab, setActiveTableTab] = useState<'orders' | 'manager_onboarding' | 'support' | 'installations' | 'stock' | 'debtors'>('orders');

  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(val)) + " so'm";
  };

  const tabs = [
    { id: 'orders', name: 'Oxirgi Buyurtmalar', icon: ShoppingCart, count: tables.oxirgiBuyurtmalar.length, href: '/sales' },
    { id: 'manager_onboarding', name: 'Menejerlar & Yangi Mijozlar', icon: Users2, count: (tables.oxirgiUlanganMijozlar || []).length, href: '/customers' },
    { id: 'support', name: 'Ochiq Supportlar', icon: Headphones, count: tables.ochiqSupportlar.length, href: '/support' },
    { id: 'installations', name: 'Bugungi O\'rnatishlar', icon: Wrench, count: tables.bugungiOrnatishlar.length, href: '/installations' },
    { id: 'stock', name: 'Kam Qolgan Mahsulotlar', icon: PackageX, count: tables.kamQolganMahsulotlar.length, href: '/warehouse' },
    { id: 'debtors', name: 'Qarzdor Mijozlar', icon: AlertTriangle, count: tables.qarzdorMijozlar.length, href: '/customers' },
  ];

  const currentTabInfo = tabs.find((t) => t.id === activeTableTab)!;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden mb-8">
      {/* Table Navigation Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTableTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTableTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-blue-700 shadow-2xs border border-slate-200/90 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <Link
          href={currentTabInfo.href}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex-shrink-0"
        >
          <span>Bo'limga o'tish</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* TABLE 1: Oxirgi Buyurtmalar */}
      {activeTableTab === 'orders' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Buyurtma №</th>
                <th className="py-3 px-4">Mijoz</th>
                <th className="py-3 px-4">Menejer</th>
                <th className="py-3 px-4">Jami Summa</th>
                <th className="py-3 px-4">Etap</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4">Sana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tables.oxirgiBuyurtmalar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Buyurtmalar topilmadi
                  </td>
                </tr>
              ) : (
                tables.oxirgiBuyurtmalar.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {order.customer?.companyName || 'Mijoz'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {order.manager?.name || 'Menejer'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatUZS(order.finalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        {order.pipelineStage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'YAKUNLANDI'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'BEKOR_QILINDI'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 2: Menejerlar va Yangi Mijozlar */}
      {activeTableTab === 'manager_onboarding' && (
        <div className="space-y-6 p-4">
          {/* Managers KPI Breakdown */}
          {tables.menejerlarReytingi && tables.menejerlarReytingi.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Menejerlar Kesimida Yangi Mijozlar & Qurilmalar Ko'rsatkichi
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  Jami {tables.menejerlarReytingi.length} ta menejer
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Menejer</th>
                      <th className="py-2.5 px-3">Filial</th>
                      <th className="py-2.5 px-3 text-center">Yangi Mijozlar</th>
                      <th className="py-2.5 px-3 text-center">Jami Portfel</th>
                      <th className="py-2.5 px-3 text-center">Biriktirilgan Qurilmalar</th>
                      <th className="py-2.5 px-3 text-center">OFD Ulangan</th>
                      <th className="py-2.5 px-3 text-right">Savdo Hajmi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tables.menejerlarReytingi.map((m: any, idx: number) => (
                      <tr key={m.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                              👤
                            </span>
                            <div>
                              <div className="font-bold text-slate-900">{m.fullName || m.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {m.branchName || 'Bosh filial'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                            +{m.newCustomersCount || 0} ta
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">
                          {m.totalCustomersCount || 0} ta
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {m.newDevicesCount || 0} ta (ONKM/FM)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.ofdConnectedCount || 0} ta
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">
                          {formatUZS(m.totalSales || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Onboarded Customers List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Oxirgi Ulangan Mijozlar Ro'yxati
                </h3>
              </div>
              <Link
                href="/customers"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Mijozlar bazasi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Mijoz / Korxona</th>
                    <th className="py-2.5 px-3">STIR (INN)</th>
                    <th className="py-2.5 px-3">Mas'ul Menejer</th>
                    <th className="py-2.5 px-3">Filial</th>
                    <th className="py-2.5 px-3">Biriktirilgan Qurilmalar</th>
                    <th className="py-2.5 px-3">OFD Holati</th>
                    <th className="py-2.5 px-3">Ulangan Sana</th>
                    <th className="py-2.5 px-3 text-center">Profil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!tables.oxirgiUlanganMijozlar || tables.oxirgiUlanganMijozlar.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Ulangan mijozlar ro'yxati mavjud emas
                      </td>
                    </tr>
                  ) : (
                    tables.oxirgiUlanganMijozlar.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{cust.companyName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {cust.companyType} • {cust.phone}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-blue-600">
                          {cust.inn}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[9px] font-bold">
                              👤
                            </span>
                            <span className="font-semibold text-slate-800">
                              {cust.manager?.name || "Biriktirilmagan"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">
                          {cust.branch?.name || 'Bosh ofis'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              ONKM: {cust.productSerials?.length || 0}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              FM: {cust.fiscalModules?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cust.ofdStatus === 'ULANGAN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {cust.ofdStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(cust.createdAt).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Link
                            href={`/customers/${cust.id}`}
                            className="p-1.5 inline-flex text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Mijoz kabinetini ochish"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTableTab === 'support' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ticket №</th>
                <th className="py-3 px-4">Mijoz</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4">Muammo</th>
                <th className="py-3 px-4">Ustuvorlik</th>
                <th className="py-3 px-4">Holat</th>
                <th className="py-3 px-4">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tables.ochiqSupportlar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Ochiq support murojaatlari mavjud emas
                  </td>
                </tr>
              ) : (
                tables.ochiqSupportlar.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">
                      #{ticket.ticketNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {ticket.customer?.companyName || 'Mijoz'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        {ticket.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={ticket.issue}>
                      {ticket.issue}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ticket.priority === 'SHOSHILINCH'
                            ? 'bg-rose-100 text-rose-800'
                            : ticket.priority === 'YUQORI'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">
                      {ticket.status}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {ticket.assignedTo?.name || 'Biriktirilmagan'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 3: Bugungi O'rnatishlar */}
      {activeTableTab === 'installations' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Vazifa №</th>
                <th className="py-3 px-4">Mijoz</th>
                <th className="py-3 px-4">Qurilma / Xizmat</th>
                <th className="py-3 px-4">Manzil</th>
                <th className="py-3 px-4">Texnik</th>
                <th className="py-3 px-4">Reja Vaqti</th>
                <th className="py-3 px-4">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tables.bugungiOrnatishlar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    O'rnatish vazifalari mavjud emas
                  </td>
                </tr>
              ) : (
                tables.bugungiOrnatishlar.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                      #{inst.taskNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inst.customer?.companyName || 'Mijoz'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-semibold">{inst.deviceName}</div>
                      <div className="text-[10px] text-slate-400">{inst.serviceType}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {inst.location || 'Filial'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {inst.technician?.name || 'Tayinlanmagan'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inst.scheduledTime || '09:00 - 18:00'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                        {inst.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 4: Kam Qolgan Mahsulotlar */}
      {activeTableTab === 'stock' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU kodi</th>
                <th className="py-3 px-4">Mahsulot Nomi</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4">Mavjud (Available)</th>
                <th className="py-3 px-4">Rezervda</th>
                <th className="py-3 px-4">Minimal Me'yor</th>
                <th className="py-3 px-4">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tables.kamQolganMahsulotlar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Barcha mahsulotlar zaxirasi yetarli
                  </td>
                </tr>
              ) : (
                tables.kamQolganMahsulotlar.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {prod.sku}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {prod.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {prod.category}
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600">
                      {prod.available} dona
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {prod.reserved} dona
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">
                      {prod.minStock} dona
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                        Tanqis Zaxira
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TABLE 5: Qarzdor Mijozlar */}
      {activeTableTab === 'debtors' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mijoz / Korxona</th>
                <th className="py-3 px-4">STIR (INN)</th>
                <th className="py-3 px-4">Telefon</th>
                <th className="py-3 px-4">Qarzdorlik Summasi</th>
                <th className="py-3 px-4">OFD Holati</th>
                <th className="py-3 px-4">Filial</th>
                <th className="py-3 px-4">Biriktirilgan Menejer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tables.qarzdorMijozlar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Qarzdor mijozlar mavjud emas
                  </td>
                </tr>
              ) : (
                tables.qarzdorMijozlar.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cust.companyName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {cust.inn}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cust.phone}
                    </td>
                    <td className="py-3 px-4 font-black text-red-600">
                      {formatUZS(cust.debt)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cust.ofdStatus === 'ULANGAN'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {cust.ofdStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {cust.branch?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {cust.manager?.name || 'Menejer biriktirilmagan'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
