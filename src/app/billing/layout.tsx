import React from 'react';
import { BillingWorkspaceLayout } from '@/routes/AppRoutes';

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <BillingWorkspaceLayout>{children}</BillingWorkspaceLayout>;
}
