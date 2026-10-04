import { redirect } from 'next/navigation';

export default function InPersonOrdersIndexPage() {
  redirect('/admin/orders/walk-in');
}
