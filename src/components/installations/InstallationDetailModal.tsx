'use client';

import React from 'react';
import {
  X,
  Wrench,
  User,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Package,
  Phone,
  CheckCircle2,
  FileText,
  Camera,
  FileCheck,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface InstallationDetailModalProps {
  task: any;
  onClose: () => void;
  onUpdateStatus: (targetStatus: string) => void;
}

export default function InstallationDetailModal({
  task,
  onClose,
  onUpdateStatus,
}: InstallationDetailModalProps) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-600 text-white shadow-sm shadow-amber-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">{task.taskNumber}</h2>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    task.status === 'YAKUNLANDI'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : task.status === 'YANGI'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {task.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{task.customer?.companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Customer & Location */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Mijoz va Manzil
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Kompaniya:</span>
                <span className="font-bold text-slate-900">{task.customer?.companyName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">STIR:</span>
                <span className="font-mono font-semibold text-slate-800">{task.customer?.inn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Telefon:</span>
                <a href={`tel:${task.customer?.phone}`} className="font-mono text-emerald-600 hover:underline">
                  {task.customer?.phone}
                </a>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Filial:</span>
                <span className="font-semibold text-slate-700">{task.branch?.name} filiali</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{task.location || task.customer?.address || 'Manzil ko\'rsatilmagan'}</span>
            </div>
          </div>

          {/* Device & Technician */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Uskuna Ma'lumotlari
              </div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nomi:</span>
                  <span className="font-bold text-slate-900">{task.deviceName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Serial raqam:</span>
                  <span className="font-mono text-slate-700">{task.serialNumber || 'Aniqlanmoqda'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Xizmat turi:</span>
                  <span className="font-medium text-slate-800">{task.serviceType}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
                Mas'ul Xodimlar
              </div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Servis Texnik:</span>
                  <span className="font-bold text-slate-900">
                    {task.technician?.name || 'Biriktirilmagan (Navbatchi)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Aloqa:</span>
                  <span className="font-mono text-slate-700">{task.technician?.phone || 'Mavjud emas'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Menejer:</span>
                  <span className="font-medium text-slate-800">{task.manager?.name || 'Menejer'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="flex items-center gap-4 bg-blue-50/50 border border-blue-200/80 rounded-xl p-3 text-xs text-blue-900 font-medium">
            <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              Rejalashtirilgan:{' '}
              <strong>
                {task.scheduledDate ? new Date(task.scheduledDate).toLocaleDateString('uz') : 'Belgilanmagan'}
              </strong>{' '}
              {task.scheduledTime ? `soat ${task.scheduledTime}` : ''}
            </div>
          </div>

          {/* Linked Order */}
          {task.order && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Bog'langan Buyurtma:</span>
                <span className="font-mono font-bold text-blue-600">{task.order.orderNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Buyurtma summasi:</span>
                <span className="font-mono font-bold text-slate-900">
                  {(task.order.finalAmount || 0).toLocaleString()} so'm
                </span>
              </div>
            </div>
          )}

          {/* Photo & Completion Document (if available) */}
          {(task.photoUrl || task.completionDoc) && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                Yakuniy Dalolatnoma va Foto Hisobot
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                {task.completionDoc && (
                  <div>
                    <strong>Akt raqami:</strong>{' '}
                    <span className="font-mono font-bold text-emerald-700">{task.completionDoc}</span>
                  </div>
                )}
                {task.completionNotes && (
                  <div>
                    <strong>Texnik hisoboti:</strong> <span>{task.completionNotes}</span>
                  </div>
                )}
                {task.completedAt && (
                  <div>
                    <strong>Yakunlangan vaqt:</strong>{' '}
                    <span>{new Date(task.completedAt).toLocaleString('uz')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Ko'rsatma va izohlar:</span>
              <pre className="whitespace-pre-wrap font-sans">{task.notes}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">Holat: {task.status}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
