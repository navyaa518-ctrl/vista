'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SalesDashboard } from '@/pages/sales/SalesDashboard';

export default function SalesRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sales/dashboard');
  }, [router]);

  return <SalesDashboard />;
}
