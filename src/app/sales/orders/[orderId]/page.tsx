'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { OrderPickingDetail } from '@/pages/sales/OrderPickingDetail';

export default function OrderPickingRoutePage() {
  const params = useParams();
  const orderId = Array.isArray(params?.orderId)
    ? params.orderId[0]
    : (params?.orderId as string) || '';

  return <OrderPickingDetail orderId={orderId} />;
}
