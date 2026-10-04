'use client';

import React from 'react';
import { SalesWorkspaceLayout } from '@/routes/AppRoutes';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return <SalesWorkspaceLayout>{children}</SalesWorkspaceLayout>;
}
