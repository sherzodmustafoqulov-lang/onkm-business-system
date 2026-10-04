'use client';

import React from 'react';
import Link from 'next/link';
import { Headphones, ArrowUpRight } from 'lucide-react';

interface TicketItem {
  id: string;
  ticketNumber: string;
  category: string;
  issue: string;
  priority: string;
  status: string;
  customer: {
    companyName: string;
    phone: string;
  };
}

interface Props {
  tickets: TicketItem[];
}

export default function RecentTicketsTable({ tickets }: Props) {
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'SHOSHILINCH':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-100 text-red-700">SHOSHILINCH</span>;
      case 'YUQORI':
        return <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-orange-100 text-orange-700">YUQORI</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 text-slate-700">ODDIY</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'YANGI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">Yangi</span>;
      case 'JARAYONDA':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">Jarayonda</span>;
      case 'TEXNIKKA_BERILDI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-purple-50 text-purple-700 border border-purple-200">Texnikda</span>;
      case 'YECHILDI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Yechildi</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-50 text-slate-700 border border-slate-200">{s}</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Support Murojaatlar</h3>
            <p className="text-xs text-slate-500">Mijozlardan kelgan nosozlik xabarlari</p>
          </div>
        </div>
        <Link
          href="/support"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Barchasi <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600">{t.ticketNumber}</span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {t.category}
                </span>
                {getPriorityBadge(t.priority)}
              </div>
              {getStatusBadge(t.status)}
            </div>

            <div className="text-xs font-medium text-slate-800 line-clamp-1 mb-1">
              {t.issue}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-600">{t.customer.companyName}</span>
              <span>{t.customer.phone}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
