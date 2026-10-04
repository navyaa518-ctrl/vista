import { UserRole } from '@/types/database';

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
  role: UserRole;
  route: string;
}

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  superadmin: {
    email: 'superadmin@aswamovies.com',
    password: 'Nine@248588',
    label: 'Super Admin & Logistics Chief',
    role: 'super_admin',
    route: '/admin/dashboard',
  },
  admin: {
    email: 'admin@aswamovies.com',
    password: 'Nine@248588',
    label: 'Operations Lead (Admin)',
    role: 'admin',
    route: '/admin/dashboard',
  },
  billing: {
    email: 'billing@aswamovies.com',
    password: 'Nine@248588',
    label: 'Billing Operations Executive',
    role: 'billing',
    route: '/billing/dashboard',
  },
  sales: {
    email: 'sales@aswamovies.com',
    password: 'Nine@248588',
    label: 'Senior Rental Sales Executive',
    role: 'rental_sales_exec',
    route: '/sales/dashboard',
  },
  client: {
    email: 'simonjones518@gmail.com',
    password: 'Nine@248588',
    label: 'Simon Jones (Client Unit)',
    role: 'client',
    route: '/portal/my-rentals',
  },
  fieldworker: {
    email: 'fieldcrew@aswamovies.com',
    password: 'Nine@248588',
    label: 'Ramesh Babu (Field Operations Crew)',
    role: 'field_worker',
    route: '/field/my-tasks',
  },
};

export function getTargetRoute(role: UserRole): string {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return '/admin/dashboard';
    case 'billing':
    case 'billing_manager':
    case 'manager':
      return '/billing/dashboard';
    case 'rental_sales_exec':
    case 'executive':
      return '/sales/dashboard';
    case 'field_worker':
    case 'crew':
      return '/field/my-tasks';
    case 'client':
    default:
      return '/portal/my-rentals';
  }
}
