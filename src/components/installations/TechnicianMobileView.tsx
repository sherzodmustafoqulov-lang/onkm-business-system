'use client';

import React, { useState } from 'react';
import {
  Wrench,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  Navigation,
  Play,
  Settings,
  Camera,
  FileCheck,
  ChevronRight,
  AlertCircle,
  Package,
  Calendar,
  Sparkles,
  UploadCloud,
  Check,
} from 'lucide-react';

interface TechnicianMobileViewProps {
  tasks: any[];
  currentUser: any;
  onRefresh: () => void;
}

const FLOW_STEPS = [
  { key: 'YANGI', label: 'Yangi' },
  { key: 'QABUL_QILINDI', label: 'Qabul qilindi' },
  { key: 'YOLDA', label: 'Yo\'lda' },
  { key: 'ISH_BOSHLANDI', label: 'Ish boshlandi' },
  { key: 'ORNATILDI', label: 'O\'rnatildi' },
  { key: 'TEST_QILINDI', label: 'Test qilindi' },
  { key: 'YAKUNLANDI', label: 'Yakunlandi' },
];

export default function TechnicianMobileView({ tasks, currentUser, onRefresh }: TechnicianMobileViewProps) {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Completion inputs
  const [serialInput, setSerialInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [updateOrderChecked, setUpdateOrderChecked] = useState(true);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'ACTIVE') return t.status !== 'YAKUNLANDI' && t.status !== 'BEKOR_QILINDI';
    if (filter === 'COMPLETED') return t.status === 'YAKUNLANDI';
    return true;
  });

  const handleStepAction = async (taskId: string, targetStatus: string, extraData?: any) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/installations/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          ...extraData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Holatni yangilab bo\'lmadi');
      }

      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (task: any) => {
    await handleStepAction(task.id, 'YAKUNLANDI', {
      serialNumber: serialInput || task.serialNumber,
      photoUrl: photoUrlInput || '/images/sample-install-receipt.jpg',
      completionDoc: 'ONKM-AKT-' + Date.now().toString().slice(-6),
      completionNotes: notesInput || 'Qurilma o\'rnatildi va fiskal test cheki chiqarildi.',
      updateOrderStatus: updateOrderChecked,
    });
    setActiveTaskId(null);
    setPhotoUrlInput('');
    setNotesInput('');
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      {/* Mobile Top App Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-4 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold">{currentUser?.name || 'Servis Texnik'}</div>
              <div className="text-[11px] text-blue-300 font-medium">Texnik Xodim Mobil Portali</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            ONLINE
          </span>
        </div>

        {/* Quick Task Stats Pills */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
          <div className="bg-slate-800/60 rounded-xl p-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Jami</span>
            <span className="text-sm font-bold text-white block">{tasks.length} ta</span>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-2">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Faol</span>
            <span className="text-sm font-bold text-amber-300 block">
              {tasks.filter((t) => t.status !== 'YAKUNLANDI' && t.status !== 'BEKOR_QILINDI').length} ta
            </span>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Tugallangan</span>
            <span className="text-sm font-bold text-emerald-300 block">
              {tasks.filter((t) => t.status === 'YAKUNLANDI').length} ta
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            filter === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
          }`}
        >
          Faol Vazifalar ({tasks.filter((t) => t.status !== 'YAKUNLANDI' && t.status !== 'BEKOR_QILINDI').length})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            filter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
          }`}
        >
          Tugallangan ({tasks.filter((t) => t.status === 'YAKUNLANDI').length})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-500'
          }`}
        >
          Barchasi ({tasks.length})
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3.5">
        {filteredTasks.map((t) => {
          const isExpanded = activeTaskId === t.id;
          const currentStepIndex = FLOW_STEPS.findIndex((s) => s.key === t.status);

          return (
            <div
              key={t.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3 transition-shadow hover:shadow-md"
            >
              {/* Card Header: Task Number & Status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {t.taskNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    t.status === 'YAKUNLANDI'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : t.status === 'YANGI'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {FLOW_STEPS.find((s) => s.key === t.status)?.label || t.status}
                </span>
              </div>

              {/* Customer & Address */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{t.customer?.companyName}</h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">STIR: {t.customer?.inn}</p>
              </div>

              {/* Location with map pin */}
              <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] font-medium leading-relaxed">
                  {t.location || t.customer?.address || 'Manzil kiritilmagan'}
                </span>
              </div>

              {/* Device and Service Badge */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.deviceName}</span>
                </div>
                {t.serialNumber && (
                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    № {t.serialNumber}
                  </span>
                )}
              </div>

              {/* 1-Tap Action Call & Directions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`tel:${t.customer?.phone}`}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Qo'ng'iroq qilish</span>
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(t.location || t.customer?.address || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Xaritada ochish</span>
                </a>
              </div>

              {/* Flow Progress Stepper */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-semibold">
                  <span>Bosqich</span>
                  <span className="text-blue-600 font-bold">
                    {FLOW_STEPS.find((s) => s.key === t.status)?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {FLOW_STEPS.map((s, idx) => {
                    const isDone = currentStepIndex >= idx || t.status === 'YAKUNLANDI';
                    const isCurr = s.key === t.status;
                    return (
                      <div
                        key={s.key}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          isCurr ? 'bg-blue-600' : isDone ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      ></div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Contextual Action Buttons for Technician */}
              {t.status !== 'YAKUNLANDI' && t.status !== 'BEKOR_QILINDI' && (
                <div className="pt-1">
                  {/* Step 1: YANGI -> Qabul qilish */}
                  {t.status === 'YANGI' && (
                    <button
                      onClick={() => handleStepAction(t.id, 'QABUL_QILINDI')}
                      disabled={submitting}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>1. Vazifani Qabul Qilish</span>
                    </button>
                  )}

                  {/* Step 2: QABUL_QILINDI -> Yo'lga chiqdim */}
                  {t.status === 'QABUL_QILINDI' && (
                    <button
                      onClick={() => handleStepAction(t.id, 'YOLDA')}
                      disabled={submitting}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>2. Yo'lga Chiqdim</span>
                    </button>
                  )}

                  {/* Step 3: YOLDA -> Yetib keldim, ishni boshlash */}
                  {t.status === 'YOLDA' && (
                    <button
                      onClick={() => handleStepAction(t.id, 'ISH_BOSHLANDI')}
                      disabled={submitting}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>3. Yetib Keldim & Ishni Boshlash</span>
                    </button>
                  )}

                  {/* Step 4: ISH_BOSHLANDI -> Qurilma o'rnatildi */}
                  {t.status === 'ISH_BOSHLANDI' && (
                    <button
                      onClick={() => handleStepAction(t.id, 'ORNATILDI')}
                      disabled={submitting}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      <span>4. Qurilmani O'rnatdim (Montaj)</span>
                    </button>
                  )}

                  {/* Step 5: ORNATILDI -> Test qilindi */}
                  {t.status === 'ORNATILDI' && (
                    <button
                      onClick={() => handleStepAction(t.id, 'TEST_QILINDI')}
                      disabled={submitting}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>5. Test Qildim (Fiskal Chek Chiqdi)</span>
                    </button>
                  )}

                  {/* Step 6: TEST_QILINDI -> Foto va Yakunlash Formasi */}
                  {t.status === 'TEST_QILINDI' && (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-2">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Foto va Dalolatnoma (Akt)</span>
                      </div>

                      {/* Mock Photo selection / preview */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">
                          O'rnatilgan kassa / Chek fotosi:
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPhotoUrlInput('/images/sample-receipt.jpg')}
                            className={`flex-1 py-2 px-2 text-[11px] font-semibold rounded-lg border text-center transition-colors ${
                              photoUrlInput
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5 inline mr-1" />
                            {photoUrlInput ? 'Foto Biriktirildi ✓' : 'Kamera / Foto Yuklash'}
                          </button>
                        </div>
                      </div>

                      {/* Serial Number confirmation */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Qurilma Serial Raqami (Aniqlandi):
                        </label>
                        <input
                          type="text"
                          defaultValue={t.serialNumber || ''}
                          onChange={(e) => setSerialInput(e.target.value)}
                          placeholder="Masalan: CRV-9980123"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                        />
                      </div>

                      {/* Completion Notes */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          O'rnatish Dalolatnomasi / Izoh:
                        </label>
                        <textarea
                          rows={2}
                          value={notesInput}
                          onChange={(e) => setNotesInput(e.target.value)}
                          placeholder="Apparat o'rnatildi, mijozga chek chiqarish o'rgatildi..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        ></textarea>
                      </div>

                      {/* Checkbox: Update linked order */}
                      {t.orderId && (
                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={updateOrderChecked}
                            onChange={(e) => setUpdateOrderChecked(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                          <span className="text-[11px] font-medium text-slate-700">
                            Buyurtma ({t.order?.orderNumber}) holatini ham "Yakunlandi" qilish
                          </span>
                        </label>
                      )}

                      {/* Big Finish Button */}
                      <button
                        onClick={() => handleCompleteTask(t)}
                        disabled={submitting}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 mt-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>6. Topshiriqni To'liq Yakunlash</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* If already completed */}
              {t.status === 'YAKUNLANDI' && (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-[11px] font-semibold">
                    Topshiriq {t.completedAt ? new Date(t.completedAt).toLocaleDateString('uz') : ''} da to'liq
                    yakunlangan va akt tasdiqlangan.
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400">
            Ushbu bo'limda vazifalar mavjud emas.
          </div>
        )}
      </div>
    </div>
  );
}
