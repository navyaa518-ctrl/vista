'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Order, OrderItem } from '@/types/database';
import { formatINR } from '@/lib/utils';
import { X, Printer, Receipt, ShieldCheck, FileText, FileSpreadsheet } from 'lucide-react';

interface InvoiceModalProps {
  order: Order;
  items: OrderItem[];
  initialMode?: 'quotation' | 'invoice';
  onClose: () => void;
}

export function InvoiceModal({
  order,
  items,
  initialMode = 'invoice',
  onClose,
}: InvoiceModalProps) {
  const [docMode, setDocMode] = useState<'quotation' | 'invoice'>(initialMode);

  const handlePrint = () => {
    window.print();
  };

  const isQuotation = docMode === 'quotation';
  const docNumber = isQuotation
    ? order.order_number.replace('ORD', 'QTN')
    : order.order_number.replace('ORD', 'INV');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-2xl my-auto max-h-[96vh] flex flex-col text-slate-900">
        {/* Controls Toolbar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center shrink-0">
              {isQuotation ? (
                <FileText className="w-5 h-5 text-amber-600" />
              ) : (
                <Receipt className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 block">
                Commercial Movie Property Rentals
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {isQuotation ? 'Commercial Rental Quotation' : 'Official Tax Invoice'} — {docNumber}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setDocMode('quotation')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isQuotation
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Quotation</span>
              </button>

              <button
                type="button"
                onClick={() => setDocMode('invoice')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isQuotation
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                <span>Tax Invoice</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print {isQuotation ? 'Quotation' : 'Invoice'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT (A4 Format) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-black rounded-xl border-2 border-black font-sans print-page print:border-none print:p-0">
          {/* Header with Official Gold Logo */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-black pb-4 mb-4 gap-4">
            <div className="flex items-center gap-4">
              {/* Prominent High-Resolution Logo */}
              <div className="relative w-44 h-24 sm:w-52 sm:h-28 shrink-0">
                <Image
                  src="/brand/aswa-logo.png"
                  alt="ASWA Movie Props Rental Official Gold Logo"
                  fill
                  sizes="210px"
                  priority
                  className="object-contain object-left"
                />
              </div>

              <div className="space-y-0.5">
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-black">
                  ASHWA
                </h1>
                <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-neutral-700">
                  Movie Property Rentals Private Limited
                </p>
                <p className="text-[9px] text-neutral-500 font-medium">
                  GSTIN: <strong>36AAACA1122D1Z9</strong> • CIN: U92490TG2020PTC148892
                </p>
                <p className="text-[9px] text-neutral-500">
                  Plot 42, Film City Logistics Corridor, Hyderabad, Telangana - 501512
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right border-2 border-black p-2.5 rounded bg-neutral-50 w-full sm:w-auto">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider block text-black">
                {isQuotation ? 'RENTAL QUOTATION' : 'TAX INVOICE'}
              </span>
              <div className="text-xs font-mono font-bold mt-1 text-black">
                {isQuotation ? 'QTN NO:' : 'INV NO:'} {docNumber}
              </div>
              <div className="text-[11px] text-neutral-600 font-mono">
                Order Ref: <strong>{order.order_number}</strong>
              </div>
              <div className="text-[11px] text-neutral-600">
                Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>
          </div>

          {/* Client & Shoot Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-neutral-300 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                {isQuotation ? 'Quotation Prepared For:' : 'Billed To Client:'}
              </span>
              <div className="font-bold text-sm text-neutral-900">{order.client_name}</div>
              <div className="text-neutral-700 font-semibold">{order.production_name}</div>
              <div className="text-neutral-500">
                {order.client_email} • {order.client_phone}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                Production Schedule Particulars:
              </span>
              <div>
                Shoot Location: <strong>{order.shoot_location}</strong>
              </div>
              <div>
                Rental Duration:{' '}
                <strong>{order.rental_days} Days</strong> ({order.start_date} to {order.end_date})
              </div>
              <div>
                Gate Pass Reference:{' '}
                <strong className="font-mono">{order.gate_pass_number || 'GP-2026-0914'}</strong>
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="my-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-neutral-300 min-w-[650px]">
              <thead>
                <tr className="bg-neutral-100 text-neutral-800 border-b border-neutral-300 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-2 border-r border-neutral-300 w-8 text-center">#</th>
                  <th className="p-2 border-r border-neutral-300 font-mono">Serial / Unit Code</th>
                  <th className="p-2 border-r border-neutral-300">Prop Details &amp; Godown Slot</th>
                  <th className="p-2 border-r border-neutral-300 text-right">Repl. Value</th>
                  <th className="p-2 border-r border-neutral-300 text-right">Daily Rate</th>
                  <th className="p-2 border-r border-neutral-300 text-center">Days</th>
                  <th className="p-2 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {items.map((item, idx) => {
                  const lineTotal = item.daily_rental_rate * order.rental_days;

                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/50">
                      <td className="p-2 border-r border-neutral-200 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-2 border-r border-neutral-200 font-mono font-bold text-neutral-900">
                        {item.item_serial || 'ASH-SER-001'}
                      </td>
                      <td className="p-2 border-r border-neutral-200">
                        <div className="font-bold text-neutral-900">{item.prop_title}</div>
                        <div className="text-[10px] text-neutral-500">
                          Floor {item.floor || 1}, {item.rack || 'Godown Rack A-01'}
                        </div>
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-right font-mono text-neutral-600">
                        ₹{item.replacement_value.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-right font-mono text-neutral-800 font-semibold">
                        ₹{item.daily_rental_rate.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 border-r border-neutral-200 text-center font-mono">
                        {order.rental_days}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-neutral-900">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end my-4">
            <div className="w-80 text-xs space-y-1.5 border-t-2 border-neutral-300 pt-2">
              <div className="flex justify-between text-neutral-600">
                <span>Total Certified Replacement Value:</span>
                <span className="font-mono">
                  ₹{order.total_replacement_value.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-neutral-800">
                <span>Base Prop Rental Subtotal:</span>
                <span className="font-mono font-semibold">
                  ₹{order.base_rental_amount.toLocaleString('en-IN')}
                </span>
              </div>

              {(order.total_labor_charges || 0) > 0 && (
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>
                    Handling &amp; Transit Crew (
                    {order.crew_type === 'client_sourced' ? 'Client Sourced' : 'In-House Crew'}):
                  </span>
                  <span className="font-mono">
                    +₹{(order.total_labor_charges || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Executive Discount ({order.discount_percent}%):</span>
                  <span className="font-mono">
                    -₹{order.discount_amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-neutral-800">
                <span>Refundable Security Deposit:</span>
                <span className="font-mono">
                  ₹{order.security_deposit.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-neutral-800">
                <span>GST @ 18% (9% CGST + 9% SGST):</span>
                <span className="font-mono">
                  ₹{order.tax_amount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-base font-black border-t-2 border-black pt-2 mt-2">
                <span>Grand Total {isQuotation ? '(Estimated)' : '(Payable)'}:</span>
                <span className="font-mono">
                  ₹{order.grand_total.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="mt-6 pt-4 border-t border-neutral-300 text-[9px] text-neutral-600 space-y-1">
            <strong>Terms &amp; Rental Conditions:</strong>
            <p>
              1. <strong>Replacement Indemnity:</strong> Client assumes 100% financial liability for
              damaged, broken, or unreturned props up to the certified replacement value listed above.
            </p>
            <p>
              2. <strong>Return Schedule:</strong> Props must be returned by 6:00 PM on the end date.
              Delays exceeding 24 hours incur extra daily rent plus a 10% late penalty.
            </p>
            <p>
              3. <strong>Deposit Refund:</strong> Security deposit will be refunded to the client’s
              bank account within 48 hours post return health inspection clearance.
            </p>
            {isQuotation && (
              <p className="text-amber-800 font-semibold">
                4. <strong>Quotation Validity:</strong> This commercial quotation is valid for 7
                business days from date of issuance. Props reservation is secured upon advance payment.
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-neutral-300 text-xs mt-4">
            <div>
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">
                {isQuotation ? 'Client / Producer Acceptance' : 'Client Authorized Signatory'}
              </span>
              <span className="text-[10px] text-neutral-500">Seal &amp; Signature</span>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">
                For ASHWA Movie Property Rentals Ltd.
              </span>
              <span className="text-[10px] text-neutral-500">
                {isQuotation ? 'Sales & Quotation Executive' : 'Authorized Financial Controller'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
