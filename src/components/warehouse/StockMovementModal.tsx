'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Save, AlertCircle } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: any[];
  branches: any[];
  defaultType?: string;
  defaultProductId?: string;
}

export default function StockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  branches,
  defaultType = 'KIRIM',
  defaultProductId = '',
}: StockMovementModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    branchId: '',
    targetBranchId: '',
    movementType: 'KIRIM',
    quantity: '1',
    docNumber: '',
    reason: '',
    serialNumbers: '',
    allowNegativeOverride: false,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        productId: defaultProductId || (products.length > 0 ? products[0].id : ''),
        branchId: branches.length > 0 ? branches[0].id : '',
        targetBranchId: branches.length > 1 ? branches[1].id : '',
        movementType: defaultType,
        quantity: '1',
        docNumber: `DOC-${Date.now().toString().slice(-6)}`,
        reason: '',
        serialNumbers: '',
        allowNegativeOverride: false,
      }));
    }
  }, [isOpen, defaultType, defaultProductId, products, branches]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/warehouse/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Harakatni bajarishda xatolik yuz berdi');
        setLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError('Server bilan aloqa uzildi');
      setLoading(false);
    }
  };

  const movementLabels: Record<string, string> = {
    KIRIM: '📥 Kirim (Partiya qabul qilish)',
    CHIQIM: '📤 Chiqim (Hisobdan chiqarish)',
    TRANSFER: '🔄 Filialga O\'tkazish (Transfer)',
    REZERV: '🔒 Buyurtmaga Rezerv Qilish',
    UNRESERVE: '🔓 Rezervdan Chiqarish',
    MIJOZGA_BERISH: '🚚 Mijozga Yetkazib Berish',
    QAYTARISH: '↩️ Qaytarib Olish',
    INVENTARIZATSIYA: '📋 Inventarizatsiya (Qoldiqni tenglash)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ombor Harakati Rasmiylashtirish</h2>
              <p className="text-[11px] text-slate-500">Qoldiq hisobi, zaxira va filiallararo transfer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Harakat Turi <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="movementType"
              value={formData.movementType}
              onChange={handleChange}
              className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {Object.entries(movementLabels).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mahsulot <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Mavjud: {p.totalQuantity} {p.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {formData.movementType === 'TRANSFER' ? 'Chiqaruvchi Filial' : 'Filial Ombori'} <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.movementType === 'TRANSFER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qabul Qiluvchi Filial <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  name="targetBranchId"
                  value={formData.targetBranchId}
                  onChange={handleChange}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white font-semibold text-blue-700"
                >
                  {branches
                    .filter((b) => b.id !== formData.branchId)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        📍 {b.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Miqdor <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hujjat Raqami</label>
              <input
                type="text"
                name="docNumber"
                value={formData.docNumber}
                onChange={handleChange}
                placeholder="KIR-2025-01"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Seriya Raqamlari (Agar mavjud bo'lsa)</label>
            <input
              type="text"
              name="serialNumbers"
              value={formData.serialNumbers}
              onChange={handleChange}
              placeholder="Vergul bilan ajrating: ACLAS-CRV-2025, ACLAS-CRV-2026..."
              className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Harakat Sababi / Izoh</label>
            <textarea
              name="reason"
              rows={2}
              value={formData.reason}
              onChange={handleChange}
              placeholder="Yetkazib beruvchidan partiya qabuli yoki mijoz buyurtmasi..."
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Bekor Qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/30 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span>Bajarilmoqda...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Harakatni Bajarish</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
