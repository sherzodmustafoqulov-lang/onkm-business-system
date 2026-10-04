'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Info,
  Phone,
  Mail,
  MessageSquare,
  User,
  Building2,
  Calendar,
  Check,
  X,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  MoreHorizontal,
  DollarSign,
  AlertCircle,
  FileText,
  Pencil,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export interface BitrixStage {
  id: string;
  name: string;
  color: string; // Background color for header
  accentColor: string;
  matchStages: string[];
}

export const BITRIX_STAGES: BitrixStage[] = [
  {
    id: 'MIJOZ_TOLANMAGAN',
    name: 'Мижоз To\'lanmagan',
    color: '#00a2e8', // Sky Blue
    accentColor: '#008ecc',
    matchStages: ['MIJOZ_TOLANMAGAN', 'LEAD', 'YANGI'],
  },
  {
    id: 'POSTUPLENIE_TOLANDI',
    name: 'Поступление To\'landi',
    color: '#17c0e8', // Cyan
    accentColor: '#11a9cd',
    matchStages: ['POSTUPLENIE_TOLANDI', 'BUYURTMA', 'TASDIQLANGAN', 'TAKLIF'],
  },
  {
    id: 'OFD_REGISTRATSIYA',
    name: 'OFD registratsiya (ФМ тўланди)',
    color: '#22c55e', // Bright Green
    accentColor: '#16a34a',
    matchStages: ['OFD_REGISTRATSIYA', 'REZERV'],
  },
  {
    id: 'ICHKI_RESTOR',
    name: 'ICHKI RESTOR',
    color: '#00c0f0', // Vivid Sky Cyan
    accentColor: '#00a6d1',
    matchStages: ['ICHKI_RESTOR'],
  },
  {
    id: 'PODGOTOVKA',
    name: 'Подготовка (Shuxrat)',
    color: '#2dd4bf', // Aqua / Mint
    accentColor: '#14b8a6',
    matchStages: ['PODGOTOVKA', 'CHIQARISH', 'ORNATISH'],
  },
  {
    id: 'DOSTAVKA_YAKUNLANDI',
    name: 'Доставка OFD o\'zimizga qaytarish',
    color: '#84cc16', // Lime Green
    accentColor: '#65a30d',
    matchStages: ['DOSTAVKA_YAKUNLANDI', 'YAKUNLANDI', 'YETKAZILMOQDA'],
  },
];

interface BitrixKanbanBoardProps {
  orders: any[];
  managers: any[];
  onOrderClick: (orderId: string) => void;
  onRefresh: () => void;
  onCreateFullOrder: () => void;
  activeFilterSearch?: string;
  onFilterSearchChange?: (val: string) => void;
}

export default function BitrixKanbanBoard({
  orders: initialOrders,
  managers = [],
  onOrderClick,
  onRefresh,
  onCreateFullOrder,
  activeFilterSearch = '',
  onFilterSearchChange,
}: BitrixKanbanBoardProps) {
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [stages, setStages] = useState<BitrixStage[]>(BITRIX_STAGES);
  const [activeTab, setActiveTab] = useState<'kanban' | 'list' | 'activities' | 'calendar'>('kanban');
  const [quickDealStageId, setQuickDealStageId] = useState<string | null>(null);

  // Inline edit stage name state
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState<string>('');
  const [originalStageName, setOriginalStageName] = useState<string>('');
  const [savingStageId, setSavingStageId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop state
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Quick Deal Form state
  const [title, setTitle] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('UZS');
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [showManagerSelect, setShowManagerSelect] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savingQuickDeal, setSavingQuickDeal] = useState(false);

  // Quick Deal "Add Activity" (Дело) inline modal
  const [quickActivityOrderId, setQuickActivityOrderId] = useState<string | null>(null);
  const [activityNote, setActivityNote] = useState('');

  // Search in Bitrix input
  const [localSearch, setLocalSearch] = useState(activeFilterSearch);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    if (managers.length > 0 && !selectedManagerId) {
      setSelectedManagerId(managers[0].id);
    }
  }, [managers, selectedManagerId]);

  // Load custom stage names from database on mount
  useEffect(() => {
    fetch('/api/orders/stages')
      .then((r) => r.json())
      .then((data) => {
        if (data.stages && Array.isArray(data.stages)) {
          setStages((prev) =>
            prev.map((s) => {
              const found = data.stages.find((ds: any) => ds.id === s.id);
              return found
                ? {
                    ...s,
                    name: found.name,
                    color: found.color || s.color,
                    accentColor: found.accentColor || s.accentColor,
                  }
                : s;
            })
          );
        }
      })
      .catch((err) => console.error('Failed to load stage configs:', err));
  }, []);

  // Auto-focus and select text when entering inline edit mode
  useEffect(() => {
    if (editingStageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingStageId]);

  // Customer search debounce for autocomplete
  useEffect(() => {
    const query = contactName || companyName;
    if (!query || query.trim().length < 2) {
      setCustomerSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/customers?q=${encodeURIComponent(query.trim())}&limit=5`)
        .then((r) => r.json())
        .then((data) => {
          if (data.customers) {
            setCustomerSuggestions(data.customers);
            setShowSuggestions(true);
          }
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [contactName, companyName]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Inline Stage Name Edit Handlers
  const handleStartEdit = (stage: BitrixStage) => {
    setEditingStageId(stage.id);
    setEditingStageName(stage.name);
    setOriginalStageName(stage.name);
  };

  const handleCancelEdit = () => {
    setEditingStageName(originalStageName);
    setEditingStageId(null);
  };

  const handleSaveEdit = async (stageId: string) => {
    if (savingStageId === stageId) return;
    const trimmed = editingStageName.trim();

    // Validation: Empty name is not allowed
    if (!trimmed) {
      showToast('Status nomi bo‘sh bo‘lishi mumkin emas!', 'error');
      setEditingStageName(originalStageName);
      setEditingStageId(null);
      return;
    }

    // No change check
    if (trimmed === originalStageName) {
      setEditingStageId(null);
      return;
    }

    try {
      setSavingStageId(stageId);
      const res = await fetch('/api/orders/stages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId,
          name: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Status nomini saqlashda xatolik');
      }

      // Update local state with saved name
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, name: trimmed } : s))
      );
      showToast('Status nomi muvaffaqiyatli saqlandi!');
      setEditingStageId(null);
    } catch (err: any) {
      console.error('Failed to save stage name:', err);
      showToast('Status nomini saqlashda xatolik: ' + err.message, 'error');
      setEditingStageName(originalStageName);
      setEditingStageId(null);
    } finally {
      setSavingStageId(null);
    }
  };

  // Determine which column an order belongs to
  const getStageForOrder = (order: any): BitrixStage => {
    const stage = stages.find((s) => s.matchStages.includes(order.pipelineStage));
    if (stage) return stage;
    // Fallback based on status
    if (order.status === 'REZERV') return stages[2] || BITRIX_STAGES[2];
    if (order.status === 'YETKAZILMOQDA' || order.status === 'ORNATILMOQDA') return stages[4] || BITRIX_STAGES[4];
    if (order.status === 'YAKUNLANDI') return stages[5] || BITRIX_STAGES[5];
    return stages[0] || BITRIX_STAGES[0];
  };

  // Compute stage totals
  const getStageOrders = (stage: BitrixStage) => {
    return orders.filter((o) => {
      const match = getStageForOrder(o).id === stage.id;
      if (!match) return false;
      if (!localSearch.trim()) return true;
      const q = localSearch.toLowerCase();
      const ordNum = (o.orderNumber || '').toLowerCase();
      const comp = (o.customer?.companyName || '').toLowerCase();
      const phone = (o.customer?.phone || '').toLowerCase();
      const mgr = (o.manager?.name || '').toLowerCase();
      return ordNum.includes(q) || comp.includes(q) || phone.includes(q) || mgr.includes(q);
    });
  };

  const getStageTotalAmount = (stage: BitrixStage) => {
    const list = getStageOrders(stage);
    return list.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData('text/plain', orderId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingOrderId(orderId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (stageId: string) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);
    const orderId = e.dataTransfer.getData('text/plain') || draggingOrderId;
    setDraggingOrderId(null);

    if (!orderId) return;

    const currentOrder = orders.find((o) => o.id === orderId);
    if (!currentOrder) return;

    const currentStage = getStageForOrder(currentOrder);
    if (currentStage.id === targetStageId) return; // Same stage, no-op

    const targetStage = stages.find((s) => s.id === targetStageId) || BITRIX_STAGES.find((s) => s.id === targetStageId);
    if (!targetStage) return;

    // Optimistic UI Update
    const previousOrders = [...orders];
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, pipelineStage: targetStageId } : o))
    );

    showToast(`Buyurtma "${currentOrder.orderNumber}" → "${targetStage.name}" bosqichiga ko'chirildi`);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineStage: targetStageId,
        }),
      });

      if (!res.ok) {
        throw new Error('Serverda holatni saqlab bo\'lmadi');
      }

      const data = await res.json();
      if (data.order) {
        // Sync with server order response
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...data.order } : o)));
      }
    } catch (err: any) {
      console.error('Drag and drop error:', err);
      // Revert optimistic update
      setOrders(previousOrders);
      showToast('Holatni o\'zgartirishda xatolik yuz berdi: ' + err.message, 'error');
    }
  };

  // Open Quick Deal Form
  const handleOpenQuickDeal = (stageId: string) => {
    setQuickDealStageId(stageId);
    const orderNumberSuggestion = `P388${Math.floor(1000 + Math.random() * 9000)}/${Math.floor(1000 + Math.random() * 9000)}`;
    setTitle(orderNumberSuggestion);
    setContactName('');
    setContactPhone('');
    setCompanyName('');
    setSelectedCustomerId(null);
    setAmount('');
    setShowManagerSelect(false);
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomerId(cust.id);
    setCompanyName(cust.companyName || '');
    setContactName(cust.contactPerson || cust.director || cust.companyName || '');
    setContactPhone(cust.phone || '');
    setShowSuggestions(false);
  };

  // Submit Quick Deal
  const handleSaveQuickDeal = async () => {
    if (!title.trim() && !companyName.trim() && !contactName.trim()) {
      showToast('Iltimos, bitim nomi yoki mijoz nomini kiriting', 'error');
      return;
    }

    try {
      setSavingQuickDeal(true);
      const payload: any = {
        title: title.trim() || undefined,
        pipelineStage: quickDealStageId || 'MIJOZ_TOLANMAGAN',
        status: 'YANGI',
        amount: parseFloat(amount.replace(/\s+/g, '')) || 0,
        managerId: selectedManagerId || (managers[0]?.id ?? undefined),
      };

      if (selectedCustomerId) {
        payload.customerId = selectedCustomerId;
      } else {
        payload.companyName = companyName.trim() || contactName.trim() || 'Yangi Bitrix24 Mijoz';
        payload.contactName = contactName.trim() || '';
        payload.phone = contactPhone.trim() || '+998900000000';
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Bitim yaratishda xatolik');
      }

      showToast(`Yangi bitim yaratildi: ${data.order?.orderNumber || title}`);
      setQuickDealStageId(null);
      onRefresh();
    } catch (err: any) {
      console.error('Save quick deal failed:', err);
      showToast(err.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setSavingQuickDeal(false);
    }
  };

  // Add Quick Activity (+ Дело)
  const handleAddActivity = async (orderId: string) => {
    if (!activityNote.trim()) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: activityNote.trim(),
        }),
      });
      if (res.ok) {
        showToast('Vazifa / Eslatma biriktirildi');
        setQuickActivityOrderId(null);
        setActivityNote('');
        onRefresh();
      }
    } catch (err) {
      showToast('Eslatmani saqlashda xatolik', 'error');
    }
  };

  const selectedManager = managers.find((m) => m.id === selectedManagerId) || managers[0];

  return (
    <div className="flex flex-col space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold backdrop-blur-md border animate-in slide-in-from-top-4 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-600/95 text-white border-emerald-500'
              : 'bg-rose-600/95 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-200" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Bitrix24 Top Command Bar */}
      <div className="bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 text-white">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Сделки</span>
            </span>
            <button
              onClick={onCreateFullOrder}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Создать</span>
            </button>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-200 text-xs rounded-lg cursor-pointer transition-colors border border-white/10">
              <span>Общая воронка</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Канбан
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Список
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Дела
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Календарь
            </button>
          </div>

          {/* Activity counters */}
          <div className="hidden xl:flex items-center gap-1.5 ml-1 text-[11px] text-slate-300">
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>0 Входящие</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>0 Запланированные</span>
            </span>
          </div>
        </div>

        {/* Right: Search Filter Bar matching Bitrix24 chip layout */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[280px]">
          <div className="relative flex-1 flex items-center bg-black/40 border border-white/15 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500 transition-colors">
            <span className="inline-flex items-center gap-1 bg-white/15 text-slate-200 text-[11px] font-medium px-2 py-0.5 rounded mr-2 shrink-0">
              Сделки в работе
              <button
                onClick={() => {
                  setLocalSearch('');
                  if (onFilterSearchChange) onFilterSearchChange('');
                }}
                className="hover:text-rose-300 ml-0.5"
              >
                ×
              </button>
            </span>
            <input
              type="text"
              placeholder="поиск..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onFilterSearchChange) onFilterSearchChange(e.target.value);
              }}
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
            />
            {localSearch && (
              <button
                onClick={() => {
                  setLocalSearch('');
                  if (onFilterSearchChange) onFilterSearchChange('');
                }}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
          </div>
        </div>
      </div>

      {/* Bitrix24 Chevron Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pb-6 overflow-x-auto min-w-full">
        {stages.map((stage, stageIdx) => {
          const stageOrders = getStageOrders(stage);
          const stageTotal = getStageTotalAmount(stage);
          const isOver = dragOverStageId === stage.id;
          const isFirst = stageIdx === 0;
          const isEditing = editingStageId === stage.id;
          const hasChanged = editingStageName !== originalStageName;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={() => handleDragLeave(stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex flex-col min-w-[260px] rounded-2xl transition-all duration-200 ${
                isOver
                  ? 'ring-2 ring-blue-500 bg-blue-500/10 dark:bg-blue-500/20 shadow-xl'
                  : 'bg-slate-100/70 dark:bg-slate-900/40'
              } p-2 border border-slate-200/60 dark:border-white/5`}
            >
              {/* Bitrix24 Pointed Chevron Arrow Header (with Inline Edit & Hover Pencil) */}
              <div
                className="group relative py-2 px-2.5 mb-2 shadow-md transition-all flex items-center justify-between text-white font-bold text-xs select-none min-h-[38px]"
                style={{
                  backgroundColor: stage.color,
                  clipPath: isFirst
                    ? 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%)'
                    : 'polygon(0% 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 0% 100%, 12px 50%)',
                  paddingLeft: isFirst ? '10px' : '18px',
                  paddingRight: '14px',
                }}
              >
                {isEditing ? (
                  /* EDIT STATE: Inline Input Box + Undo & Cancel Buttons (Matches User Image 2) */
                  <div
                    className="flex items-center w-full gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex-1 bg-white rounded shadow-inner flex items-center px-2 py-0.5 min-w-0">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingStageName}
                        onChange={(e) => setEditingStageName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveEdit(stage.id);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancelEdit();
                          }
                        }}
                        onBlur={() => handleSaveEdit(stage.id)}
                        disabled={savingStageId === stage.id}
                        className="w-full bg-transparent text-slate-800 text-xs font-semibold focus:outline-none placeholder-slate-400 py-0.5"
                        placeholder="Status nomi..."
                      />
                    </div>

                    {/* Action buttons on the right of input */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {hasChanged && (
                        <button
                          type="button"
                          title="O‘zgarishni ortga qaytarish"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStageName(originalStageName);
                            editInputRef.current?.focus();
                          }}
                          className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Bekor qilish"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        className="p-1 rounded text-white/90 hover:text-white hover:bg-white/20 active:scale-95 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW STATE: Title + Count + Hover Pencil Icon (Matches User Image 1) */
                  <div className="flex items-center justify-between w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                      <span
                        title={stage.name}
                        className="truncate drop-shadow-sm font-semibold tracking-tight cursor-pointer"
                        onDoubleClick={() => handleStartEdit(stage)}
                      >
                        {stage.name}
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 backdrop-blur-sm text-white shrink-0">
                        {stageOrders.length}
                      </span>
                    </div>

                    {/* Pencil icon - appears on hover with zero layout shift */}
                    <button
                      type="button"
                      title="Tahrirlash"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(stage);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/80 hover:text-white hover:bg-white/20 active:scale-95 transition-all shrink-0 ml-1"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Stage Total Sum Badge & Quick Deal Trigger */}
              <div className="flex flex-col items-center gap-1.5 mb-2.5 px-1">
                <div className="w-full text-center py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm">
                  <span className="font-mono font-extrabold text-xs text-slate-800 dark:text-slate-100">
                    {stageTotal.toLocaleString()} UZS
                  </span>
                </div>

                {/* + Quick Deal Button */}
                <button
                  onClick={() => handleOpenQuickDeal(stage.id)}
                  className="w-full py-1.5 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-blue-200/60 dark:border-slate-700 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isFirst ? 'Быстрая сделка' : 'Быстрая сделка'}</span>
                </button>
              </div>

              {/* Inline Quick Deal Form (Matches Screenshot 2) */}
              {quickDealStageId === stage.id && (
                <div className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-2xl p-3.5 shadow-2xl mb-3 space-y-3 animate-in zoom-in-95 duration-150">
                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Название
                    </label>
                    <input
                      type="text"
                      placeholder="Сделка #"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Client Group */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Клиент
                    </span>

                    {/* Contact search */}
                    <div className="relative">
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                        Контакт
                      </label>
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 focus-within:border-blue-500">
                        <User className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <input
                          type="text"
                          placeholder="Имя контакта, телефон"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full text-xs bg-transparent focus:outline-none text-slate-900 dark:text-white"
                        />
                        <Search className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                        Компания
                      </label>
                      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 focus-within:border-blue-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                        <input
                          type="text"
                          placeholder="Название компании"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full text-xs bg-transparent focus:outline-none text-slate-900 dark:text-white"
                        />
                        <Search className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                      </div>
                    </div>

                    {/* Customer Autocomplete Dropdown */}
                    {showSuggestions && customerSuggestions.length > 0 && (
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                        {customerSuggestions.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCustomer(c)}
                            className="p-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer flex flex-col"
                          >
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {c.companyName}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {c.contactPerson || c.phone || c.inn}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amount & Currency */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Сумма и валюта
                    </label>
                    <div className="grid grid-cols-12 gap-1.5">
                      <input
                        type="text"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="col-span-8 px-2.5 py-1.5 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="col-span-4 px-1 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                      >
                        <option value="UZS">UZS</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  {/* Responsible Manager */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      <span>Ответственный</span>
                      <button
                        type="button"
                        onClick={() => setShowManagerSelect(!showManagerSelect)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wide font-bold"
                      >
                        Сменить
                      </button>
                    </div>

                    {!showManagerSelect ? (
                      <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {selectedManager?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {selectedManager?.name || 'Sherzod Mustafoqulov'}
                        </span>
                      </div>
                    ) : (
                      <select
                        value={selectedManagerId}
                        onChange={(e) => {
                          setSelectedManagerId(e.target.value);
                          setShowManagerSelect(false);
                        }}
                        className="w-full text-xs p-1.5 bg-white dark:bg-slate-800 border border-blue-400 rounded-lg text-slate-900 dark:text-white"
                      >
                        {managers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleSaveQuickDeal}
                      disabled={savingQuickDeal}
                      className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
                    >
                      {savingQuickDeal ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      onClick={() => setQuickDealStageId(null)}
                      disabled={savingQuickDeal}
                      className="py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all"
                    >
                      Отменить
                    </button>
                  </div>
                </div>
              )}

              {/* Deal Cards Container */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {stageOrders.map((order) => {
                  const isDragging = draggingOrderId === order.id;
                  const creationDate = new Date(order.createdAt).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                  });
                  const completionDate = new Date(
                    new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, order.id)}
                      onClick={() => onOrderClick(order.id)}
                      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none relative group ${
                        isDragging ? 'opacity-40 scale-95 border-blue-500 shadow-2xl' : ''
                      }`}
                    >
                      {/* Top Header: Title & Action Icons */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                          {order.orderNumber}
                        </div>
                        {/* Right quick contact icons */}
                        <div
                          className="flex flex-col items-center gap-1 text-slate-400 shrink-0 ml-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Информация"
                            onClick={() => onOrderClick(order.id)}
                            className="hover:text-blue-600 p-0.5 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          {order.customer?.phone && (
                            <a
                              href={`tel:${order.customer.phone}`}
                              title={`Позвонить: ${order.customer.phone}`}
                              className="hover:text-emerald-600 p-0.5 transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            title="Отправить сообщение"
                            className="hover:text-sky-600 p-0.5 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                          </button>
                          <button
                            title="Чат"
                            className="hover:text-amber-600 p-0.5 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-1.5">
                        {(order.finalAmount || 0).toLocaleString()} UZS
                      </div>

                      {/* Customer Name Link */}
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-1 truncate">
                        {order.customer?.companyName || 'Mijoz ko\'rsatilmagan'}
                      </div>

                      {/* Creation Date */}
                      <div className="text-[11px] text-slate-400 mb-2">
                        {creationDate}
                      </div>

                      {/* Additional Fields (Matching Screenshot 1) */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1 text-[11px]">
                        <div className="text-slate-400 flex items-center justify-between">
                          <span>Дата завершения:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {completionDate}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-slate-400">Имя:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {order.customer?.contactPerson || order.customer?.companyName?.split(' ')[0]}
                          </span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="text-slate-400">Тип:</span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            Клиенты
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: + Дело and Manager Badge */}
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickActivityOrderId(
                              quickActivityOrderId === order.id ? null : order.id
                            );
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-[11px] font-medium transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Дело</span>
                        </button>

                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <div
                            title={order.manager?.name || 'Менеджер'}
                            className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold"
                          >
                            {order.manager?.name?.charAt(0) || 'M'}
                          </div>
                        </div>
                      </div>

                      {/* Inline Quick Activity Note Box */}
                      {quickActivityOrderId === order.id && (
                        <div
                          className="mt-2.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <textarea
                            rows={2}
                            placeholder="Vazifa yoki eslatma yozing..."
                            value={activityNote}
                            onChange={(e) => setActivityNote(e.target.value)}
                            className="w-full text-xs p-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setQuickActivityOrderId(null)}
                              className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-800"
                            >
                              Отмена
                            </button>
                            <button
                              onClick={() => handleAddActivity(order.id)}
                              className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 text-white rounded-md shadow-sm"
                            >
                              Сохранить
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {stageOrders.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
                    <span>Bitimlar yo'q</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
