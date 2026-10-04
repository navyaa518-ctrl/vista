'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRole } from '@/context/RoleContext';
import { supabase } from '@/lib/supabase/client';
import { formatINR } from '@/lib/utils';
import confetti from 'canvas-confetti';
import {
  ShoppingBag,
  Trash2,
  Calendar,
  Building,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles
} from 'lucide-react';

export default function CartPage() {
  const { cart, removeFromCart, clearCart } = useRole();

  const [clientName, setClientName] = useState('Anurag Kashyap Films');
  const [clientEmail, setClientEmail] = useState('production@kashyapfilms.in');
  const [clientPhone, setClientPhone] = useState('+91 98200 44556');
  const [productionName, setProductionName] = useState('Project Gangs of Bombay - Schedule 1');
  const [shootLocation, setShootLocation] = useState('Ramoji Film City, Studio Floor 7');
  
  // Shoot dates default: tomorrow to 4 days later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fourDays = new Date();
  fourDays.setDate(fourDays.getDate() + 5);

  const [startDate, setStartDate] = useState(tomorrow.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(fourDays.toISOString().split('T')[0]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null);

  // Calculate duration in days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.max(end.getTime() - start.getTime(), 0);
  const durationDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

  // Calculations
  const totalReplacementValue = cart.reduce(
    (sum, item) => sum + item.prop.replacement_value * item.quantity,
    0
  );
  const totalDailyRent = cart.reduce(
    (sum, item) => sum + item.prop.daily_rental_rate * item.quantity,
    0
  );
  const baseRentalAmount = totalDailyRent * durationDays;
  const securityDeposit = Math.round(totalReplacementValue * 0.30); // 30% refundable
  const taxAmount = Math.round(baseRentalAmount * 0.18); // 18% GST
  const grandTotal = baseRentalAmount + securityDeposit + taxAmount;


  async function handleSubmitRFQ(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      const orderNumber = `ASH-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 1. Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            client_name: clientName,
            client_email: clientEmail,
            client_phone: clientPhone,
            production_name: productionName,
            shoot_location: shootLocation,
            start_date: startDate,
            end_date: endDate,
            rental_days: durationDays,
            status: 'rfq',
            total_replacement_value: totalReplacementValue,
            base_rental_amount: baseRentalAmount,
            discount_percent: 0,
            discount_amount: 0,
            security_deposit: securityDeposit,
            tax_amount: taxAmount,
            grand_total: grandTotal,
            assigned_executives: [
              { id: 'p1', name: 'Ravi Kumar', floor: 1 },
              { id: 'p2', name: 'Vikram Singh', floor: 2 }
            ],
            notes: 'Submitted online via ASHWA RFQ portal',
          },
        ])
        .select()
        .single();

      if (orderError) {
        throw orderError;
      }

      // 2. Insert order items
      const orderItemsToInsert = [];
      for (const item of cart) {
        for (let q = 0; q < item.quantity; q++) {
          orderItemsToInsert.push({
            order_id: orderData.id,
            prop_id: item.prop.id,
            prop_title: item.prop.title,
            prop_category: item.prop.category,
            replacement_value: item.prop.replacement_value,
            daily_rental_rate: item.prop.daily_rental_rate,
            rental_days: durationDays,
            floor: item.prop.floor,
            rack: item.prop.rack,
            status: 'pending',
          });
        }
      }

      const { error: itemsError } = await supabase.from('order_items').insert(orderItemsToInsert);
      if (itemsError) throw itemsError;

      // Confetti effect!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f5d77f', '#ffffff', '#e5c158'],
      });

      setSubmittedOrder(orderData);
      clearCart();
    } catch (err) {
      console.error('Error submitting RFQ:', err);
      alert('Failed to submit RFQ. Please check network connection.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#0e1017] to-[#121520] border-b border-amber-500/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                Request for Quotation (RFQ) Cart
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Reserve your cinema set properties with transparent 20% rental calculation &amp; warehouse pickup.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {submittedOrder ? (
          /* Confirmation State */
          <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-[#0f111a] border border-amber-500/40 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                Quotation Request Transmitted
              </span>
              <h2 className="text-2xl font-bold text-white font-serif mt-1">
                Order #{submittedOrder.order_number} Created
              </h2>
              <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto">
                Your RFQ has been pushed to the ASHWA warehouse counter terminal. The operations manager has been notified to assign floor pickers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Production House:</span>
                <span className="text-white font-medium">{submittedOrder.production_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shoot Duration:</span>
                <span className="text-amber-300 font-semibold">{submittedOrder.rental_days} Days ({submittedOrder.start_date} to {submittedOrder.end_date})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Shoot Location:</span>
                <span className="text-white">{submittedOrder.shoot_location}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-bold">
                <span className="text-slate-300">Estimated Total:</span>
                <span className="gold-gradient-text text-sm">{formatINR(submittedOrder.grand_total)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link
                href={`/billing/${submittedOrder.id}`}
                className="py-3 px-5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Open Counter Billing &amp; Gate Pass</span>
              </Link>

              <Link
                href="/warehouse/picking"
                className="py-3 px-5 rounded-xl text-xs font-semibold bg-slate-900 border border-amber-500/30 text-amber-300 hover:bg-slate-800 transition-all"
              >
                Track Live Picking Screen
              </Link>
            </div>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart */
          <div className="max-w-md mx-auto p-12 rounded-2xl bg-[#0f1118] border border-slate-800 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">Your RFQ Cart is Empty</h3>
            <p className="text-xs text-slate-400">
              Browse our catalog of 200,000+ movie props and click "Add to RFQ Cart" to assemble your set decor.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors"
            >
              <span>Explore Props Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Active Cart & RFQ Form */
          <form onSubmit={handleSubmitRFQ} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Selected Props ({cart.length} unique items)
                </span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {cart.map((item) => (
                <div
                  key={item.prop.id}
                  className="p-4 rounded-xl bg-[#0e1017] border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-800">
                      <Image
                        src={item.prop.images[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'}
                        alt={item.prop.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-[10px] text-amber-400 font-semibold">
                        <span>Floor {item.prop.floor} • {item.prop.rack}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{item.prop.category}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-0.5">{item.prop.title}</h4>
                      <div className="text-xs text-slate-400 mt-1">
                        Replacement Value: {formatINR(item.prop.replacement_value)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-[10px] text-amber-400/80 uppercase font-semibold">
                        Daily Rent (20%)
                      </div>
                      <div className="text-sm font-bold gold-gradient-text font-serif">
                        {formatINR(item.prop.daily_rental_rate * item.quantity)}
                      </div>
                      {item.quantity > 1 && (
                        <div className="text-[10px] text-slate-400">
                          ({item.quantity} units @ {formatINR(item.prop.daily_rental_rate)})
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.prop.id)}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-colors"
                      title="Remove from quotation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Shoot Details Form */}
              <div className="mt-8 p-6 rounded-2xl bg-[#0e1017] border border-amber-500/20 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-2">
                  Production &amp; Shoot Schedule
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Production House / Client
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Project / Film Title
                    </label>
                    <input
                      type="text"
                      required
                      value={productionName}
                      onChange={(e) => setProductionName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Start Date (Dispatch)
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      End Date (Return to Warehouse)
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Shoot Location / Soundstage Floor
                    </label>
                    <input
                      type="text"
                      required
                      value={shootLocation}
                      onChange={(e) => setShootLocation(e.target.value)}
                      placeholder="e.g. Ramoji Film City, Studio Floor 7"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Production Phone
                    </label>
                    <input
                      type="text"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Production Email
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div>
              <div className="p-6 rounded-2xl bg-[#0f1118] border border-amber-500/30 space-y-5 shadow-2xl sticky top-28">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block border-b border-slate-800 pb-3">
                  Quotation Estimate Breakdown
                </span>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Shoot Duration:</span>
                    <span className="text-white font-semibold">{durationDays} Shooting Days</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Total Replacement Value:</span>
                    <span className="text-slate-300 font-semibold">{formatINR(totalReplacementValue)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Daily Rental Subtotal:</span>
                    <span className="text-slate-300 font-semibold">{formatINR(totalDailyRent)}/day</span>
                  </div>

                  <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800">
                    <span>Rental Cost ({durationDays} Days @ 20%):</span>
                    <span className="text-amber-300 font-bold">{formatINR(baseRentalAmount)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>Refundable Security Deposit (30%):</span>
                    <span className="text-slate-300">{formatINR(securityDeposit)}</span>
                  </div>

                  <div className="flex justify-between text-slate-400">
                    <span>GST (18% Goods &amp; Services Tax):</span>
                    <span className="text-slate-300">{formatINR(taxAmount)}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-white block">Grand Total:</span>
                      <span className="text-[10px] text-slate-500">(Includes Refundable Deposit)</span>
                    </div>
                    <span className="text-2xl font-bold gold-gradient-text font-serif">
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-[11px] text-amber-200/80 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Submitting this RFQ notifies the warehouse counter immediately. Floor executives will be assigned to pick and verify your props.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{submitting ? 'Transmitting to Warehouse...' : 'Submit Quotation to Warehouse'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
