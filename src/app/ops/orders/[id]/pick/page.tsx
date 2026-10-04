'use client';

import MobilePickingPage from '@/app/ops/picking/[orderId]/page';

export default function OrderPickAlias({ params }: { params: Promise<{ id: string }> }) {
  // Map { id } to { orderId }
  const adaptedParams = params.then((p) => ({ orderId: p.id }));
  return <MobilePickingPage params={adaptedParams} />;
}
