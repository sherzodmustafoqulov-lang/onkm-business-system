'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  AlertCircle,
  Building2,
  User,
  Package,
  Truck,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: any) => void;
}

interface OrderItemRow {
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  stockAvailable?: number;
}

export default function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [pipelineStage, setPipelineStage] = useState('BUYURTMA');
  const [status, setStatus] = useState('YANGI');
  const [deliveryRequired, setDeliveryRequired] = useState(true);
  const [installationRequired, setInstallationRequired] = useState(true);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<OrderItemRow[]>([
    { productId: '', quantity: 1, unitPrice: 0, discount: 0 },
  ]);

  // Load customers, branches and products when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoadingInitial(true);
      Promise.all([
        fetch('/api/customers?limit=100').then((r) => r.json()),
        fetch('/api/branches').then((r) => r.json()),
        fetch('/api/warehouse/products').then((r) => r.json()),
      ])
        .then(([custData, branchData, prodData]) => {
          if (custData.customers) setCustomers(custData.customers);
          if (branchData.branches) {
            setBranches(branchData.branches);
            if (branchData.branches.length > 0 && !branchId) {
              setBranchId(branchData.branches[0].id);
            }
          }
          if (prodData.products) setProducts(prodData.products);
        })
        .catch((err) => {
          console.error('Failed to load initial form data:', err);
          setError('Boshlang\'ich ma\'lumotlarni yuklashda xatolik yuz berdi');
        })
        .finally(() => setLoadingInitial(false));
    }
  }, [isOpen]);

  // Auto-set branch if customer selected has a branch
  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected?.branchId) {
      setBranchId(selected.branchId);
    }
  };

  const handleProductChange = (index: number, pId: string) => {
    const prod = products.find((p) => p.id === pId);
    const updated = [...items];
    updated[index].productId = pId;
    updated[index].unitPrice = prod ? prod.sellingPrice : 0;
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof OrderItemRow, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { productId: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Totals
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const finalAmount = Math.max(0, totalAmount - totalDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError('Mijozni tanlang');
      return;
    }

    if (!branchId) {
      setError('Filialni tanlang');
      return;
    }

    const validItems = items.filter((it) => it.productId);
    if (validItems.length === 0) {
      setError('Kamida bitta mahsulot tanlanishi shart');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          branchId,
          pipelineStage,
          status,
          deliveryRequired,
          installationRequired,
          notes,
          items: validItems.map((it) => ({
            productId: it.productId,
            quantity: Number(it.quantity) || 1,
            unitPrice: Number(it.unitPrice) || 0,
            discount: Number(it.discount) || 0,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Buyurtma yaratib bo\'lmadi');
      }

      onSuccess(data.order);
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Yangi Savdo / Buyurtma Shakllantirish</h2>
              <p className="text-xs text-slate-500">Mijoz tanlash, mahsulotlar kiritish va ombor zaxirasini tekshirish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Branch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Mijozni tanlang *
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="">-- Mijozni tanlang --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} (STIR: {c.inn}) - {c.branch?.name || c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Mintaqaviy Filial *
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              >
                <option value="">-- Filialni tanlang --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} filiali ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pipeline Stage & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Flow / Bosqich (Pipeline Stage)
              </label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="BUYURTMA">Buyurtma (Asosiy buyurtma)</option>
                <option value="LEAD">Lead (Potensial mijoz)</option>
                <option value="TAKLIF">Taklif (Tijoriy taklif)</option>
                <option value="REZERV">Rezerv (Ombordan band qilish)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Boshlang'ich Holati (Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="YANGI">Yangi (Kelib tushgan)</option>
                <option value="TASDIQLANGAN">Tasdiqlangan (Rezervlanadi)</option>
                <option value="REZERV">Rezerv (Omborda band qilingan)</option>
                <option value="TOLOV_KUTILMOQDA">To'lov kutilmoqda</option>
              </select>
            </div>
          </div>

          {/* Products & Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Mahsulotlar va Uskunalar ro'yxati
              </label>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Qator qo'shish
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-2 w-20 text-center">Miqdor</th>
                    <th className="py-2.5 px-3 w-32 text-right">Birlik narxi (so'm)</th>
                    <th className="py-2.5 px-3 w-28 text-right">Chegirma</th>
                    <th className="py-2.5 px-3 w-32 text-right">Jami summa</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row, idx) => {
                    const rowTotal = Math.max(0, row.quantity * row.unitPrice - row.discount);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <select
                            value={row.productId}
                            onChange={(e) => handleProductChange(idx, e.target.value)}
                            required
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- Tanlang --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sellingPrice?.toLocaleString()} so'm)
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                            }
                            required
                            className="w-full px-2 py-1.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={row.unitPrice}
                            onChange={(e) =>
                              handleItemChange(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            required
                            className="w-full px-2 py-1.5 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0"
                            value={row.discount}
                            onChange={(e) =>
                              handleItemChange(idx, 'discount', Math.max(0, parseFloat(e.target.value) || 0))
                            }
                            className="w-full px-2 py-1.5 text-right bg-white border border-slate-200 rounded-lg text-xs font-mono text-amber-600 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {rowTotal.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            disabled={items.length === 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery & Installation check */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={deliveryRequired}
                onChange={(e) => setDeliveryRequired(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-800">Yetkazib berish talab qilinadi</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={installationRequired}
                onChange={(e) => setInstallationRequired(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-semibold text-slate-800">Texnik o'rnatish & sozlash zarur</span>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Buyurtma bo'yicha qo'shimcha izohlar
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Masalan: 3 ta kassa nuqtasi, chek lentalari va o'quv qo'llanma bilan birga yetkazilsin..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            ></textarea>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Eslatma:</span> Buyurtma tasdiqlanganda uskunalar
              ombordan avtomatik rezerv qilinadi va mijozning debitorlik hisobiga yoziladi.
            </div>
            <div className="flex items-center gap-6 text-right flex-shrink-0">
              {totalDiscount > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Chegirma:</div>
                  <div className="text-xs font-mono font-semibold text-rose-600">
                    -{totalDiscount.toLocaleString()} so'm
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-600">Yakuniy summa:</div>
                <div className="text-base font-mono font-extrabold text-slate-900">
                  {finalAmount.toLocaleString()} so'm
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loadingInitial}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm shadow-blue-500/30 transition-all disabled:opacity-60"
          >
            {submitting ? (
              <span>Yaratilmoqda...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Buyurtmani Shakllantirish</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
