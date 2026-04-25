export type UserRole = 'SERVER' | 'KITCHEN' | 'MANAGER' | 'DISPLAY';

export const ROLE_STORAGE_KEY = 'restaurant_dashboard_role';

export function isUserRole(value: string | null | undefined): value is UserRole {
  return value === 'SERVER' || value === 'KITCHEN' || value === 'MANAGER' || value === 'DISPLAY';
}
