import React, { useState, useEffect } from 'react';
import { Shield, Plus, Save, Check, X, Info } from 'lucide-react';

const RESOURCES = [
  'USERS', 'HR', 'KPI', 'SALES', 'CUSTOMERS', 'WAREHOUSE',
  'INSTALLATIONS', 'SUPPORT', 'FINANCE', 'REPORTS', 'SETTINGS', 'AUDIT'
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [editData, setEditData] = useState<any>({
    name: '',
    displayName: '',
    description: '',
    permissions: []
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/roles');
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
        if (data.length > 0 && !selectedRole) {
          handleSelectRole(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleSelectRole = (role: any) => {
    setIsCreating(false);
    setSelectedRole(role);
    setEditData({
      name: role.name,
      displayName: role.displayName,
      description: role.description || '',
      permissions: role.permissions ? JSON.parse(JSON.stringify(role.permissions)) : []
    });
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedRole(null);
    setEditData({
      name: '',
      displayName: '',
      description: '',
      permissions: RESOURCES.map(res => ({
        resource: res,
        canView: false, canCreate: false, canEdit: false, canDelete: false,
        canApprove: false, canExport: false, canFinanceView: false, canSensitiveDataView: false
      }))
    });
  };

  const handlePermissionChange = (resource: string, field: string, value: boolean) => {
    setEditData((prev: any) => {
      const newPerms = [...prev.permissions];
      const index = newPerms.findIndex(p => p.resource === resource);
      if (index >= 0) {
        newPerms[index][field] = value;
      } else {
        newPerms.push({
          resource,
          canView: false, canCreate: false, canEdit: false, canDelete: false,
          canApprove: false, canExport: false, canFinanceView: false, canSensitiveDataView: false,
          [field]: value
        });
      }
      return { ...prev, permissions: newPerms };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        name: isCreating ? editData.name.toUpperCase().replace(/\s+/g, '_') : editData.name,
        displayName: editData.displayName,
        description: editData.description,
        permissions: editData.permissions.filter((p: any) =>
          p.canView || p.canCreate || p.canEdit || p.canDelete ||
          p.canApprove || p.canExport || p.canFinanceView || p.canSensitiveDataView
        )
      };

      const url = isCreating ? '/api/roles' : `/api/roles/${selectedRole.id}`;
      const method = isCreating ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedRole = await res.json();
        await fetchRoles();
        handleSelectRole(savedRole);
      } else {
        const err = await res.json();
        alert(`Xatolik: ${err.error}`);
      }
    } catch (err) {
      alert('Tizim xatosi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Roles List */}
      <div className="w-full md:w-1/4 flex flex-col gap-3">
        <button
          onClick={handleCreateNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yangi Rol Yaratish
        </button>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role)}
              className={`w-full text-left px-4 py-3 border-b last:border-0 transition-colors ${selectedRole?.id === role.id && !isCreating
                  ? 'bg-blue-50 border-l-4 border-l-blue-600'
                  : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
            >
              <div className="font-bold text-slate-800 flex justify-between items-center">
                <span>{role.displayName}</span>
                {role.isSystem && <Shield className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex justify-between items-center">
                <span>{role.name}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">{role._count?.users || 0} xodim</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Role Editor */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {(!selectedRole && !isCreating) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
            <Shield className="w-16 h-16 text-slate-200 mb-4" />
            <p>Tahrirlash uchun rol tanlang</p>
          </div>
        ) : (
          <>
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{isCreating ? 'Yangi Rol' : editData.displayName}</h2>
                  <p className="text-sm text-slate-500">{isCreating ? 'Yangi vakolatlar to\'plamini shakllantirish' : 'Rol ma\'lumotlari va ruxsatnomalarni tahrirlash'}</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || (selectedRole?.isSystem && selectedRole?.name === 'ADMIN')}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save className="w-4 h-4" />}
                  Saqlash
                </button>
              </div>

              {selectedRole?.isSystem && selectedRole?.name === 'ADMIN' && (
                <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex items-start gap-2">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p><b>Diqqat:</b> Asosiy ADMIN rolining huquqlari tizim tomonidan qulflangan va uni to'liq o'zgartirish tavsiya etilmaydi.</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ko'rsatiladigan nom (UI) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={e => setEditData({ ...editData, displayName: e.target.value })}
                    placeholder="Masalan: HR Menejer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tizim kodi (Inglizcha, Katta harflarda) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                    disabled={!isCreating}
                    placeholder="Masalan: HR_MANAGER"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 uppercase"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tavsif</label>
                <input
                  type="text"
                  value={editData.description}
                  onChange={e => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100/50 border-b text-slate-600 text-[11px] uppercase font-bold sticky top-0 z-10">
                  <tr>
                    <th className="py-4 px-6">Modul (Resurs)</th>
                    <th className="py-4 px-3 text-center">Ko'rish (View)</th>
                    <th className="py-4 px-3 text-center">Yaratish (Create)</th>
                    <th className="py-4 px-3 text-center">Tahrirlash (Edit)</th>
                    <th className="py-4 px-3 text-center">O'chirish (Delete)</th>
                    <th className="py-4 px-3 text-center">Tasdiqlash (Approve)</th>
                    <th className="py-4 px-3 text-center border-l border-slate-200 text-orange-600">Moliya ko'rish</th>
                    <th className="py-4 px-3 text-center text-red-600">Maxfiy ko'rish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RESOURCES.map(resource => {
                    const perm = editData.permissions?.find((p: any) => p.resource === resource) || {};
                    const disabled = selectedRole?.isSystem && selectedRole?.name === 'ADMIN';

                    return (
                      <tr key={resource} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6 font-semibold text-slate-800">{resource}</td>
                        {['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove'].map(field => (
                          <td key={field} className="py-3 px-3 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={perm[field] || false}
                                disabled={disabled}
                                onChange={(e) => handlePermissionChange(resource, field, e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                              />
                            </label>
                          </td>
                        ))}

                        <td className="py-3 px-3 text-center border-l border-slate-100 bg-orange-50/30">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.canFinanceView || false}
                              disabled={disabled}
                              onChange={(e) => handlePermissionChange(resource, 'canFinanceView', e.target.checked)}
                              className="w-4 h-4 text-orange-600 bg-slate-100 border-slate-300 rounded focus:ring-orange-500 disabled:opacity-50 cursor-pointer"
                            />
                          </label>
                        </td>
                        <td className="py-3 px-3 text-center bg-red-50/30">
                          <label className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={perm.canSensitiveDataView || false}
                              disabled={disabled}
                              onChange={(e) => handlePermissionChange(resource, 'canSensitiveDataView', e.target.checked)}
                              className="w-4 h-4 text-red-600 bg-slate-100 border-slate-300 rounded focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                            />
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
