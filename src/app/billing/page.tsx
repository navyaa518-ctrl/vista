'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BillingDashboard } from '@/pages/billing/BillingDashboard';

export default function BillingRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/billing/dashboard');
  }, [router]);

  return <BillingDashboard />;
}
