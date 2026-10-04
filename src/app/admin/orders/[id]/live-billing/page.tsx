'use client';

import BillingCounterCartPage from '../billing-cart/page';

export default function LiveBillingAlias({ params }: { params: Promise<{ id: string }> }) {
  return <BillingCounterCartPage params={params} />;
}
