'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowUpRight } from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  customer: {
    companyName: string;
    phone: string;
  };
  manager: {
    name: string;
  };
}

interface Props {
  orders: OrderItem[];
}

export default function RecentOrdersTable({ orders }: Props) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'YAKUNLANDI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Yakunlandi</span>;
      case 'YETKAZILMOQDA':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">Yetkazilmoqda</span>;
      case 'TASDIQLANDI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Tasdiqlandi</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">{status}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'TO\'LIQ_TO\'LANGAN':
        return <span className="text-[11px] font-semibold text-emerald-600">✓ To'liq</span>;
      case 'QISMAN_TO\'LANGAN':
        return <span className="text-[11px] font-semibold text-amber-600">◑ Qisman</span>;
      default:
        return <span className="text-[11px] font-semibold text-rose-500">✕ Kutilmoqda</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Oxirgi Buyurtmalar</h3>
            <p className="text-xs text-slate-500">Mijozlar bilan tuzilgan savdo bitimlari</p>
          </div>
        </div>
        <Link
          href="/sales"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Barchasi <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-2 font-semibold">Buyurtma №</th>
              <th className="pb-2 font-semibold">Mijoz</th>
              <th className="pb-2 font-semibold">Summa</th>
              <th className="pb-2 font-semibold">To'lov</th>
              <th className="pb-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 font-bold text-blue-600">{o.orderNumber}</td>
                <td className="py-2.5">
                  <div className="font-semibold text-slate-800">{o.customer.companyName}</div>
                  <div className="text-[10px] text-slate-400">{o.customer.phone}</div>
                </td>
                <td className="py-2.5 font-bold text-slate-900">
                  {new Intl.NumberFormat('uz-UZ').format(o.finalAmount)} so'm
                </td>
                <td className="py-2.5">{getPaymentBadge(o.paymentStatus)}</td>
                <td className="py-2.5">{getStatusBadge(o.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
