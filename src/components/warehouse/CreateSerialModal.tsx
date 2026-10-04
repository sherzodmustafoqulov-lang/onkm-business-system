'use client';

import React, { useState } from 'react';
import { X, Cpu, Save, AlertCircle } from 'lucide-react';

interface CreateSerialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: any[];
  branches: any[];
}

export default function CreateSerialModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  branches,
}: CreateSerialModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    productId: '',
    branchId: '',
    serialNumbers: '',
    warrantyMonths: '12',
    notes: '',
  });

  React.useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        productId: prev.productId || (products.length > 0 ? products[0].id : ''),
        branchId: prev.branchId || (branches.length > 0 ? branches[0].id : ''),
      }));
    }
  }, [isOpen, products, branches]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/warehouse/serials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Seriya raqamlarini saqlashda xatolik');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Seriya Raqamlari Kirimi</h2>
              <p className="text-[11px] text-slate-500">Yagona yoki partiya bo'yicha seriyalarni ro'yxatga olish</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mahsulot <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {products
                .filter((p) => p.hasSerial)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Filial Ombori <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kafolat (oy)</label>
              <input
                type="number"
                value={formData.warrantyMonths}
                onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Seriya Raqamlari <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={formData.serialNumbers}
              onChange={(e) => setFormData({ ...formData, serialNumbers: e.target.value })}
              placeholder="Har bir satrga bittadan yoki vergul bilan ajratilgan:
ACLAS-CRV-2051
ACLAS-CRV-2052
ACLAS-CRV-2053"
              className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Izoh / Partiya hujjati</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Yetkazib beruvchi invoysi #88"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

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
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-blue-600/30 disabled:opacity-60"
            >
              {loading ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Seriyalarni Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
