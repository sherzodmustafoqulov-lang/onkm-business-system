'use client';

import React, { useState, useEffect } from 'react';
import { X, Package, Save, AlertCircle } from 'lucide-react';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  branches: any[];
}

export default function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
  branches,
}: CreateProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    manufacturer: '',
    model: '',
    purchasePrice: '',
    sellingPrice: '',
    minStock: '5',
    unit: 'dona',
    hasSerial: true,
    warrantyMonths: '12',
    initialBranchId: '',
    initialQuantity: '0',
  });

  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
    if (branches.length > 0 && !formData.initialBranchId) {
      setFormData((prev) => ({ ...prev, initialBranchId: branches[0].id }));
    }
  }, [categories, branches]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const res = await fetch('/api/warehouse/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Mahsulotni saqlashda xatolik');
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Yangi Mahsulot Kiritish</h2>
              <p className="text-[11px] text-slate-500">Katalog, narxlar va boshlang'ich ombor qoldig'i</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mahsulot Nomi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masalan: Aclas CRV-100 Online Kassa"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SKU (Artikul) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="ONKM-ACLAS-100"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategoriya <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ishlab Chiqaruvchi</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="Aclas, Sunmi, PosBank..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="CRV-100, D2s..."
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Xarid Narxi (so'm)</label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="1900000"
                className="w-full text-xs font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sotuv Narxi (so'm)</label>
              <input
                type="number"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="2450000"
                className="w-full text-xs font-bold font-mono text-emerald-700 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Minimal Qoldiq</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                placeholder="5"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">O'lchov Birligi</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="dona">dona</option>
                <option value="to'plam">to'plam</option>
                <option value="metr">metr</option>
                <option value="litsenziya">litsenziya</option>
                <option value="obuna">obuna</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kafolat Muddati (oy)</label>
              <input
                type="number"
                name="warrantyMonths"
                value={formData.warrantyMonths}
                onChange={handleChange}
                placeholder="12"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="hasSerial"
                  checked={formData.hasSerial}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Seriya raqam talab qilinadi</span>
              </label>
            </div>
          </div>

          {/* Boshlang'ich partiya kirimi */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
            <span className="text-[11px] font-bold text-emerald-800 uppercase block">
              Boshlang'ich Partiya Kirimi (Ixtiyoriy)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qabul Qiluvchi Filial</label>
                <select
                  name="initialBranchId"
                  value={formData.initialBranchId}
                  onChange={handleChange}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Miqdor ({formData.unit})</label>
                <input
                  type="number"
                  name="initialQuantity"
                  value={formData.initialQuantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-bold"
                />
              </div>
            </div>
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
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span>Saqlanmoqda...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Mahsulotni Saqlash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
