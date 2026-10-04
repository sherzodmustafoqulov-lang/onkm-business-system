export type AppRole = 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'WAREHOUSE' | 'ACCOUNTANT' | 'SUPPORT';

export type AppResource =
  | 'CUSTOMERS'
  | 'SALES'
  | 'WAREHOUSE'
  | 'INSTALLATIONS'
  | 'SUPPORT'
  | 'FINANCE'
  | 'REPORTS'
  | 'SETTINGS'
  | 'USERS'
  | 'AUDIT'
  | 'HR'
  | 'KPI';

export type PermissionAction =
  | 'canView'
  | 'canCreate'
  | 'canEdit'
  | 'canDelete'
  | 'canApprove'
  | 'canExport'
  | 'canFinanceView'
  | 'canSensitiveDataView';

export interface UserPermission {
  resource: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  canFinanceView: boolean;
  canSensitiveDataView: boolean;
}

export function checkPermission(
  role: string,
  permissions: UserPermission[] | undefined,
  resource: AppResource,
  action: PermissionAction = 'canView'
): boolean {
  // Administrator has absolute master privileges
  if (role === 'ADMIN') return true;

  if (!permissions || permissions.length === 0) return false;

  const perm = permissions.find((p) => p.resource === resource);
  if (!perm) return false;

  return Boolean(perm[action]);
}

export const ROLE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  ADMIN: { label: 'Administrator', color: 'bg-red-500/10 text-red-600 border-red-200', desc: 'Barcha tizim va boshqaruv vakolati' },
  MANAGER: { label: 'Menejer', color: 'bg-blue-500/10 text-blue-600 border-blue-200', desc: 'Mijozlar, savdo va buyurtmalar' },
  TECHNICIAN: { label: 'Texnik xodim', color: 'bg-amber-500/10 text-amber-600 border-amber-200', desc: 'O\'rnatish va servis xizmatlari' },
  WAREHOUSE: { label: 'Omborchi', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', desc: 'Ombor va seriyali mahsulotlar' },
  ACCOUNTANT: { label: 'Kassir / Buxgalter', color: 'bg-purple-500/10 text-purple-600 border-purple-200', desc: 'Moliya, to\'lovlar va hisobotlar' },
  SUPPORT: { label: 'Support Operator', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200', desc: 'Mijozlar texnik yordami' },
};
