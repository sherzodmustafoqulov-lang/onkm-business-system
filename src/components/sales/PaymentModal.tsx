'use client';

import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Building,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onSuccess: (payment: any, updatedOrder: any) => void;
}

const PAYMENT_METHODS = [
  { id: 'Naqd', name: 'Naqd pul', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Bank', name: 'Bank o\'tkazmasi (Hisob raqam)', icon: Building, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Click', name: 'Click Up', icon: Smartphone, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'Payme', name: 'Payme', icon: Smartphone, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { id: 'HUMO', name: 'HUMO Karta', icon: CreditCard, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Uzcard', name: 'Uzcard Karta', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'Paynet', name: 'Paynet Terminal', icon: Smartphone, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'Boshqa', name: 'Boshqa to\'lov', icon: CreditCard, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export default function PaymentModal({ isOpen, order, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState<number | string>(order?.debtAmount || 0);
  const [method, setMethod] = useState('Naqd');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handlePayFullDebt = () => {
    setAmount(order.debtAmount || 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payNum = parseFloat(String(amount));
    if (isNaN(payNum) || payNum <= 0) {
      setError('To\'lov summasi 0 dan katta bo\'lishi shart');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: payNum,
          method,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'To\'lovni qabul qilib bo\'lmadi');
      }

      onSuccess(data.payment, data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-500/30">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kassa / To'lov Qabul Qilish</h2>
              <p className="text-xs text-slate-500 font-mono">
                {order.orderNumber} • {order.customer?.companyName}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Debt Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Jami hisob</div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {(order.finalAmount || 0).toLocaleString()} so'm
              </div>
            </div>
            <div className="border-x border-slate-200">
              <div className="text-[10px] uppercase font-semibold text-slate-400">To'langan</div>
              <div className="text-xs font-mono font-bold text-emerald-600">
                {(order.paidAmount || 0).toLocaleString()} so'm
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-rose-500">Qarzdorlik</div>
              <div className="text-xs font-mono font-bold text-rose-600">
                {(order.debtAmount || 0).toLocaleString()} so'm
              </div>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">To'lov Summasi (so'm) *</label>
              {order.debtAmount > 0 && (
                <button
                  type="button"
                  onClick={handlePayFullDebt}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> To'liq qoplash ({order.debtAmount.toLocaleString()} so'm)
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Payment Method Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">To'lov Usuli *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/30 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="text-[11px]">{m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Izoh / Kvitansiya raqami
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: Kassa cheki #0421 yoki Moliya to'lov topshirig'i..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-60"
            >
              {submitting ? (
                <span>Qabul qilinmoqda...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>To'lovni Tasdiqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
