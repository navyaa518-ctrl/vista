'use client';

import BillingCounterCartPage from '../../../[id]/billing-cart/page';

export default function InPersonBillingCartPage({ params }: { params: Promise<{ id: string }> }) {
  return <BillingCounterCartPage params={params} />;
}
