'use client';

import React from 'react';
import Link from 'next/link';
import { Wrench, ArrowUpRight, MapPin, User } from 'lucide-react';

interface InstallationItem {
  id: string;
  taskNumber: string;
  serviceType: string;
  deviceName: string;
  status: string;
  scheduledTime?: string | null;
  notes?: string | null;
  customer: {
    companyName: string;
    address: string;
    phone: string;
  };
  technician?: {
    name: string;
  } | null;
}

interface Props {
  installations: InstallationItem[];
}

export default function TechnicianTasksCard({ installations }: Props) {
  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'YAKUNLANDI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Yakunlandi</span>;
      case 'JARAYONDA':
      case 'ISH_BOSHLANDI':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-700 border border-amber-200">Ishda</span>;
      case 'YOLDA':
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 text-blue-700 border border-blue-200">Yo'lda</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 text-slate-700">{s}</span>;
    }
  };

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'ONKM_ORNATISH':
        return 'ONKM O\'rnatish';
      case 'POS_ORNATISH':
        return 'POS O\'rnatish';
      case 'FM_ALMASHTIRISH':
        return 'FM Almashtirish';
      default:
        return 'Texnik Servis';
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Bugungi O'rnatishlar & Servis</h3>
            <p className="text-xs text-slate-500">Texnik xodimlar rejasidagi obyektlar</p>
          </div>
        </div>
        <Link
          href="/installations"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Barchasi <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {installations.map((task) => (
          <div
            key={task.id}
            className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600">{task.taskNumber}</span>
                <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {getServiceLabel(task.serviceType)}
                </span>
              </div>
              {getStatusBadge(task.status)}
            </div>

            <div className="text-xs font-semibold text-slate-800 mb-1">
              {task.deviceName} — <span className="text-slate-600">{task.customer.companyName}</span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5 truncate">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="truncate">{task.customer.address}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[11px]">
              <div className="flex items-center gap-1 text-slate-600">
                <User className="w-3 h-3 text-blue-500" />
                <span>Texnik: {task.technician?.name || 'Biriktirilmagan'}</span>
              </div>
              <span className="font-semibold text-slate-700">{task.scheduledTime || 'Bugun'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
