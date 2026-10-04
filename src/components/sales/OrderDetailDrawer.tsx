'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Truck,
  Wrench,
  AlertCircle,
  Package,
  CreditCard,
  Building2,
  User,
  Phone,
  FileText,
  Ban,
  ArrowRight,
  ShieldAlert,
  Send,
  Warehouse,
} from 'lucide-react';

interface OrderDetailDrawerProps {
  orderId: string | null;
  onClose: () => void;
  onOrderUpdated: () => void;
  onOpenPayment: (order: any) => void;
}

const FLOW_STEPS = [
  { key: 'LEAD', label: 'Lead' },
  { key: 'TAKLIF', label: 'Taklif' },
  { key: 'BUYURTMA', label: 'Buyurtma' },
  { key: 'REZERV', label: 'Rezerv' },
  { key: 'CHIQARISH', label: 'Chiqarish' },
  { key: 'YETKAZISH', label: 'Yetkazish' },
  { key: 'ORNATISH', label: 'O\'rnatish' },
  { key: 'YAKUNLANDI', label: 'Yakunlandi' },
];

export default function OrderDetailDrawer({
  orderId,
  onClose,
  onOrderUpdated,
  onOpenPayment,
}: OrderDetailDrawerProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch full details
  const fetchOrder = React.useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Yuklab bo\'lmadi');
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  React.useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setOrder(null);
    }
  }, [orderId, fetchOrder]);

  const handleFlowAction = async (action: string, note?: string) => {
    if (!order) return;
    if (action === 'CANCEL' && !window.confirm('Haqiqatdan ham ushbu buyurtmani bekor qilmoqchimisiz? Rezervlar va mijoz qarzi qaytariladi.')) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/flow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Amalni bajarib bo\'lmadi');
      }

      setSuccessMsg(data.message || 'Holat yangilandi');
      await fetchOrder();
      onOrderUpdated();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setActionLoading(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">
                  {order?.orderNumber || 'Yuklanmoqda...'}
                </h2>
                {order && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      order.status === 'YAKUNLANDI'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.status === 'BEKOR_QILINDI'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : order.status === 'REZERV'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : order.status === 'ORNATILMOQDA'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : order.status === 'YETKAZILMOQDA'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {order.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {order ? `${order.customer?.companyName} • ${new Date(order.createdAt).toLocaleDateString('uz')}` : ''}
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

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded-xl"></div>
              <div className="h-32 bg-slate-100 rounded-xl"></div>
              <div className="h-48 bg-slate-100 rounded-xl"></div>
            </div>
          ) : order ? (
            <>
              {/* Pipeline Flow Stepper */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                  <span>Savdo Jarayoni (Flow)</span>
                  <span className="text-blue-600 font-semibold">{order.pipelineStage || 'BUYURTMA'}</span>
                </div>
                <div className="flex items-center justify-between relative overflow-x-auto pb-1">
                  {FLOW_STEPS.map((step, idx) => {
                    const isPassed =
                      FLOW_STEPS.findIndex((s) => s.key === order.pipelineStage) >= idx ||
                      order.status === 'YAKUNLANDI';
                    const isCurrent = order.pipelineStage === step.key;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 min-w-[60px] text-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 transition-all ${
                            isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                              : isPassed
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span
                          className={`text-[10px] whitespace-nowrap ${
                            isCurrent
                              ? 'font-bold text-blue-600'
                              : isPassed
                              ? 'font-semibold text-slate-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons Hub (Workflow triggers) */}
              {order.status !== 'BEKOR_QILINDI' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tezkor Amallar & Holatni Boshqarish</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.status === 'YANGI' && (
                      <button
                        onClick={() => handleFlowAction('CONFIRM')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tasdiqlash & Rezerv Qilish</span>
                      </button>
                    )}

                    {order.debtAmount > 0 && (
                      <button
                        onClick={() => onOpenPayment(order)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>To'lov Qabul Qilish</span>
                      </button>
                    )}

                    {(order.status === 'TASDIQLANGAN' || order.status === 'REZERV' || order.status === 'TOLANGAN') && (
                      <button
                        onClick={() => handleFlowAction('DISPATCH')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <Warehouse className="w-3.5 h-3.5" />
                        <span>Ombordan Chiqarish</span>
                      </button>
                    )}

                    {order.deliveryRequired && order.status === 'YETKAZILMOQDA' && (
                      <button
                        onClick={() => handleFlowAction('INSTALL')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>O'rnatishga Topshirish</span>
                      </button>
                    )}

                    {order.status !== 'YAKUNLANDI' && (
                      <button
                        onClick={() => handleFlowAction('COMPLETE')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Buyurtmani Yakunlash</span>
                      </button>
                    )}

                    {order.status !== 'YAKUNLANDI' && (
                      <button
                        onClick={() => handleFlowAction('CANCEL')}
                        disabled={actionLoading}
                        className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Bekor Qilish</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Financial Balance Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Jami Summa</div>
                  <div className="text-sm font-mono font-extrabold text-slate-900 mt-0.5">
                    {(order.finalAmount || 0).toLocaleString()} so'm
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">To'langan</div>
                  <div className="text-sm font-mono font-extrabold text-emerald-700 mt-0.5">
                    {(order.paidAmount || 0).toLocaleString()} so'm
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Qarzdorlik</div>
                  <div className="text-sm font-mono font-extrabold text-rose-700 mt-0.5">
                    {(order.debtAmount || 0).toLocaleString()} so'm
                  </div>
                </div>
              </div>

              {/* Customer & Branch Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Mijoz va Filial Ma'lumotlari
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Kompaniya / Do'kon:</span>
                    <span className="font-bold text-slate-900">{order.customer?.companyName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">STIR (INN):</span>
                    <span className="font-mono font-semibold text-slate-800">{order.customer?.inn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Telefon:</span>
                    <span className="font-mono text-slate-700">{order.customer?.phone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mintaqaviy Filial:</span>
                    <span className="font-semibold text-blue-700">{order.branch?.name} filiali</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Menejer:</span>
                    <span className="text-slate-700">{order.manager?.name || 'Belgilanmagan'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mijoz umumiy balansi:</span>
                    <span
                      className={`font-mono font-bold ${
                        (order.customer?.debt || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {(order.customer?.debt || 0).toLocaleString()} so'm qarz
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items & Warehouse Stock Verification */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    Buyurtma Mahsulotlari & Ombor Zaxirasi
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {order.items?.length || 0} xil uskuna
                  </span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3">Mahsulot</th>
                      <th className="py-2 px-2 text-center">Miqdor</th>
                      <th className="py-2 px-2 text-center">Ombor Qoldig'i</th>
                      <th className="py-2 px-3 text-right">Narxi</th>
                      <th className="py-2 px-3 text-right">Jami</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items?.map((it: any) => {
                      const avail = it.warehouseStock?.available ?? 0;
                      const hasEnough = avail >= it.quantity;
                      return (
                        <tr key={it.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{it.product?.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">SKU: {it.product?.sku}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{it.quantity} dona</td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                hasEnough
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              Mavjud: {avail}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {it.unitPrice?.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {it.totalPrice?.toLocaleString()} so'm
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Linked Installation Task */}
              {order.installationRequired && (
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      Texnik O'rnatish & Servis Topshirig'i
                    </div>
                    {order.installations?.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {order.installations[0].status}
                      </span>
                    )}
                  </div>
                  {order.installations?.length > 0 ? (
                    <div className="text-xs text-slate-700 space-y-1">
                      <div>
                        <strong>Vazifa raqami:</strong>{' '}
                        <span className="font-mono text-blue-700">{order.installations[0].taskNumber}</span>
                      </div>
                      <div>
                        <strong>Biriktirilgan texnik:</strong>{' '}
                        <span>{order.installations[0].technician?.name || 'Mintaqaviy navbatchi texnik'}</span>
                      </div>
                      <div>
                        <strong>Xizmat turi:</strong> <span>{order.installations[0].serviceType}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700">
                      O'rnatish topshirig'i buyurtma "O'rnatishga topshirish" bosqichiga o'tganda avtomatik
                      shakllantiriladi.
                    </p>
                  )}
                </div>
              )}

              {/* Payment History */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    To'lovlar Tarixi
                  </div>
                  {order.debtAmount > 0 && (
                    <button
                      onClick={() => onOpenPayment(order)}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      + To'lov qo'shish
                    </button>
                  )}
                </div>
                {order.payments?.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/60 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-2 px-3">Chek / No</th>
                        <th className="py-2 px-3">Usul</th>
                        <th className="py-2 px-3">Sana</th>
                        <th className="py-2 px-3 text-right">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {order.payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.paymentNumber}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {p.method}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{new Date(p.paidAt).toLocaleString('uz')}</td>
                          <td className="py-2 px-3 text-right font-mono font-extrabold text-emerald-600">
                            +{p.amount?.toLocaleString()} so'm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Ushbu buyurtma bo'yicha hali to'lov qabul qilinmagan.
                  </div>
                )}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Izohlar va jurnal</div>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{order.notes}</pre>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {order && (
              <span>
                To'lov holati: <strong>{order.paymentStatus}</strong>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
