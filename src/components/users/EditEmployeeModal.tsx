import React, { useState, useEffect } from 'react';
import { X, Upload, User, Briefcase, Lock, FileText, CheckCircle } from 'lucide-react';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
}

export default function EditEmployeeModal({ isOpen, onClose, onSuccess, employeeId }: EditEmployeeModalProps) {
  const [activeSection, setActiveSection] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    birthDate: '',
    gender: 'ERKAK',
    phone: '',
    extraPhone: '',
    email: '',
    telegram: '',
    address: '',
    
    branchId: '',
    roleId: '',
    departmentId: '',
    positionId: '',
    managerId: '',
    workType: 'TO\'LIQ_STAVKA',
    employmentStatus: 'FAOL',
    hireDate: '',
    notes: '',
    
    baseSalary: '',
    currency: 'UZS',
    rate: '1',
    isActive: true
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && employeeId) {
      setIsFetching(true);
      Promise.all([
        fetch('/api/roles').then(res => res.json()),
        fetch('/api/branches').then(res => res.json()),
        fetch(`/api/employees/${employeeId}`).then(res => res.json())
      ]).then(([rolesData, branchesData, empData]) => {
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setBranches(branchesData.branches || []);
        
        const profile = empData.employeeProfile || {};
        
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          middleName: profile.middleName || '',
          birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : '',
          gender: profile.gender || 'ERKAK',
          phone: empData.phone || '',
          extraPhone: profile.extraPhone || '',
          email: empData.email || '',
          telegram: profile.telegram || '',
          address: profile.address || '',
          
          branchId: empData.branchId || '',
          roleId: empData.roleId || '',
          departmentId: empData.departmentId || '',
          positionId: empData.positionId || '',
          managerId: profile.managerId || '',
          workType: profile.workType || 'TO\'LIQ_STAVKA',
          employmentStatus: profile.employmentStatus || 'FAOL',
          hireDate: profile.hireDate ? new Date(profile.hireDate).toISOString().split('T')[0] : '',
          notes: profile.notes || '',
          
          baseSalary: profile.salary?.baseSalary || '',
          currency: profile.salary?.currency || 'UZS',
          rate: profile.salary?.rate || '1',
          isActive: empData.isActive !== false
        });
        
        if (empData.avatar) setAvatarPreview(empData.avatar);
      }).catch(console.error).finally(() => setIsFetching(false));
    }
  }, [isOpen, employeeId]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          avatar: avatarPreview
        })
      });
      
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await res.json();
        alert(`Xatolik: ${error.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Tizim xatosi yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Xodimni tahrirlash</h2>
            <p className="text-sm text-slate-500">Kompaniya bazasidagi xodim profilini o'zgartirish</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isFetching ? (
           <div className="flex-1 flex items-center justify-center p-12">
             <span className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></span>
           </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex">
            {/* Sidebar Tabs */}
            <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 space-y-2 hidden md:block">
              <button 
                onClick={() => setActiveSection('personal')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeSection === 'personal' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                <User className="w-5 h-5" />
                Shaxsiy ma'lumotlar
              </button>
              <button 
                onClick={() => setActiveSection('work')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeSection === 'work' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                <Briefcase className="w-5 h-5" />
                Ish ma'lumotlari
              </button>
              <button 
                onClick={() => setActiveSection('access')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${activeSection === 'access' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                <Lock className="w-5 h-5" />
                Tizim (HR) va Status
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 bg-white">
              <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* SECTION: PERSONAL */}
                {activeSection === 'personal' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Shaxsiy ma'lumotlar</h3>
                    
                    {/* Avatar */}
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <label className="cursor-pointer bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Rasm almashtirish
                          <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleAvatarUpload} />
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Familiya <span className="text-red-500">*</span></label>
                        <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ism <span className="text-red-500">*</span></label>
                        <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Otasining ismi</label>
                        <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Tug'ilgan sana</label>
                        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Jinsi</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="ERKAK">Erkak</option>
                          <option value="AYOL">Ayol</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon <span className="text-red-500">*</span></label>
                        <input required type="text" name="phone" placeholder="+998" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Qo'shimcha telefon</label>
                        <input type="text" name="extraPhone" placeholder="+998" value={formData.extraPhone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram Username</label>
                        <input type="text" name="telegram" placeholder="@username" value={formData.telegram} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Yashash manzili</label>
                      <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"></textarea>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button type="button" onClick={() => setActiveSection('work')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                        Keyingisi
                      </button>
                    </div>
                  </div>
                )}

                {/* SECTION: WORK */}
                {activeSection === 'work' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Ish ma'lumotlari</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Filial</label>
                        <select name="branchId" value={formData.branchId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="">Barcha / Markaz</option>
                          {branches?.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ishga kirgan sana</label>
                        <input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Ish turi</label>
                        <select name="workType" value={formData.workType} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="TO'LIQ_STAVKA">To'liq stavka</option>
                          <option value="YARIM_STAVKA">Yarim stavka</option>
                          <option value="SHARTNOMA">Shartnoma asosida</option>
                          <option value="SINOV">Sinov muddati</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Bandlik holati</label>
                        <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="FAOL">Faol</option>
                          <option value="SINOV">Sinov muddati</option>
                          <option value="TA'TIL">Ta'tilda</option>
                          <option value="NOFAOL">Nofaol</option>
                          <option value="BOSHATILGAN">Ishdan bo'shatilgan</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Izohlar (HR uchun)</label>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"></textarea>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                      <button type="button" onClick={() => setActiveSection('personal')} className="text-slate-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 border border-slate-200">
                        Orqaga
                      </button>
                      <button type="button" onClick={() => setActiveSection('access')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                        Keyingisi
                      </button>
                    </div>
                  </div>
                )}

                {/* SECTION: ACCESS & HR FINANCE */}
                {activeSection === 'access' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Tizim (HR) va Status</h3>
                    
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-bold text-orange-800 mb-1">Ish haqi va Bonus ma'lumotlari</h4>
                      <p className="text-xs text-orange-600 mb-3">Bu ma'lumotlar maxfiy va faqat ruxsati bor xodimlarga ko'rinadi.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-orange-800 mb-1">Oylik maosh (Base Salary)</label>
                          <div className="flex">
                            <input type="number" name="baseSalary" value={formData.baseSalary} onChange={handleChange} className="w-full px-3 py-2 border border-orange-200 rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" placeholder="0.00" />
                            <select name="currency" value={formData.currency} onChange={handleChange} className="px-3 py-2 border border-l-0 border-orange-200 rounded-r-lg bg-orange-100 text-sm font-semibold text-orange-800">
                              <option value="UZS">UZS</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-orange-800 mb-1">Stavka (Rate)</label>
                          <input type="number" step="0.1" max="1" name="rate" value={formData.rate} onChange={handleChange} className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" placeholder="1.0" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Rol (Vakolat) <span className="text-red-500">*</span></label>
                        <select required name="roleId" value={formData.roleId} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                          <option value="">Rolni tanlang...</option>
                          {roles?.map(r => (
                            <option key={r.id} value={r.id}>{r.displayName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleCheckboxChange} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                      <label htmlFor="isActive" className="text-sm font-semibold text-slate-800 cursor-pointer">
                        Tizimga kira oladi (Aktiv account)
                      </label>
                    </div>

                    <div className="flex justify-between pt-4">
                      <button type="button" onClick={() => setActiveSection('work')} className="text-slate-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-100 border border-slate-200">
                        Orqaga
                      </button>
                      <button type="submit" form="edit-employee-form" disabled={isLoading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-500/20">
                        {isLoading ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        O'zgarishlarni saqlash
                      </button>
                    </div>
                  </div>
                )}

              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
