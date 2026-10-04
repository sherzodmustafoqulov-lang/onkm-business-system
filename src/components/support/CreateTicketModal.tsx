'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Headphones,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wrench,
} from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: any) => void;
}

const CATEGORIES = [
  'KKM',
  'POS',
  'Terminal',
  'Fiskal modul',
  'OFD',
  'Bank',
  'Click',
  'Payme',
  'Paynet',
  'HUMO',
  'Dastur',
  'Internet',
  'Printer',
  'Scanner',
  'Boshqa',
];

export default function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [category, setCategory] = useState('KKM');
  const [deviceName, setDeviceName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('ODDIY');
  const [technicianId, setTechnicianId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetch('/api/customers?limit=100')
        .then((r) => r.json())
        .then((d) => {
          if (d.customers) setCustomers(d.customers);
        });

      fetch('/api/users?role=TECHNICIAN')
        .then((r) => r.json())
        .catch(() => {})
        .then(() => {
          setTechnicians([
            { id: 'cmuiw6zzk000c3wt25pmbpbes', name: 'Jamshid Karimov (Bosh servis texnik)' },
            { id: 'cmuiw6zzk000e3wt25pmbpbet', name: 'Sherzod Aliyev (POS texnik)' },
          ]);
        });
    }
  }, [isOpen]);

  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected?.branchId) {
      setBranchId(selected.branchId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Mijozni tanlang');
      return;
    }
    if (!issue.trim()) {
      setError('Muammo tavsifini kiriting');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          branchId,
          category,
          deviceName,
          serialNumber,
          issue,
          priority,
          technicianId: technicianId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chipta yaratib bo\'lmadi');
      }

      onSuccess(data.ticket);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-600 text-white shadow-sm shadow-rose-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Yangi Support Murojaati (Ticket)</h2>
              <p className="text-xs text-slate-500">Texnik nosozlik yoki savol bo'yicha chipta ochish</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Mijoz *
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
            >
              <option value="">-- Mijozni tanlang --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} (STIR: {c.inn})
                </option>
              ))}
            </select>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategoriya *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Muhimlik Darajasi (Priority) *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              >
                <option value="PAST">Past (Oddiy savol)</option>
                <option value="ODDIY">Oddiy (Kassa ishlamoqda, kichik masala)</option>
                <option value="YUQORI">Yuqori (Savdo sekinlashgan, xato berayapti)</option>
                <option value="SHOSHILINCH">Shoshilinch (Kassa butunlay to'xtagan!)</option>
              </select>
            </div>
          </div>

          {/* Device & Serial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Qurilma / Model
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Masalan: Aclas CRV-100 yoki PAX D210"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Serial Raqam (Seriya)
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="Masalan: CRV-9980123"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {/* Problem Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Muammo / Nosozlik Tavsifi *
            </label>
            <textarea
              rows={3}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Masalan: Chek chiqarayotganda 'E-03 OFD aloqasi yo'q' xatosi bermoqda, internet bor, lekin cheklar bormayapti..."
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800"
            ></textarea>
          </div>

          {/* Escalate to Technician (optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              Joyiga Chiquvchi Texnikka Biriktirish (Ixtiyoriy)
            </label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
            >
              <option value="">-- Faqat Call-center operatori shug'ullanadi --</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/30 transition-all disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Chiptani Ro'yxatdan O'tkazish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
