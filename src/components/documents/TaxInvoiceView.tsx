'use client';

import React from 'react';
import Image from 'next/image';
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  Building,
  Calendar,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
} from 'lucide-react';
import { FinalInvoiceRecord } from '@/types/orders';
import { formatINR } from '@/lib/utils';

interface TaxInvoiceViewProps {
  invoice: FinalInvoiceRecord;
  onClose: () => void;
}

export function TaxInvoiceView({ invoice, onClose }: TaxInvoiceViewProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl my-auto max-h-[96vh] flex flex-col text-slate-900">
        {/* Controls Toolbar (Hidden in Print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 block">
                Official Commercial Billing Ledger
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Final GST Tax Invoice — {invoice.invoice_number}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE SHEET */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-slate-950 rounded-xl border border-slate-300 font-sans print:border-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-5 mb-5">
            <div className="flex items-center gap-4">
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
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-slate-900">
                  ASHWA
                </h1>
                <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-slate-700">
                  Movie Property Rentals Private Limited
                </p>
                <p className="text-[9px] text-slate-500 font-medium">
                  GSTIN: <strong>36AAACA1122D1Z9</strong> • CIN: U92490TG2020PTC148892
                </p>
                <p className="text-[9px] text-slate-500">
                  Plot 42, Film City Logistics Corridor, Hyderabad 501512, Telangana
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1 text-xs">
              <span className="text-sm font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded inline-block">
                TAX INVOICE
              </span>
              <div className="font-mono font-bold text-slate-900 text-xs mt-1">
                INVOICE NO: {invoice.invoice_number}
              </div>
              <div className="text-slate-500 text-[11px]">
                Order Ref: <strong className="font-mono text-slate-800">{invoice.order_number}</strong>
              </div>
              <div className="text-slate-500 text-[11px]">
                Date: {new Date(invoice.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>
          </div>

          {/* Client & Shoot Logistics Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 border-b border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Billed To (Production House):
              </span>
              <div className="font-extrabold text-sm text-slate-900">{invoice.client_name}</div>
              <div className="font-semibold text-slate-700">{invoice.production_name}</div>
              {invoice.client_email && <div className="text-slate-500">{invoice.client_email}</div>}
              {invoice.client_phone && <div className="text-slate-500 font-mono">{invoice.client_phone}</div>}
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Shoot &amp; Logistics Particulars:
              </span>
              <div>
                Location: <strong className="text-slate-800">{invoice.shoot_location || 'Ramoji Film City'}</strong>
              </div>
              <div>
                Dispatched Vehicle: <strong className="font-mono text-emerald-700">{invoice.vehicle_no || 'TS 09 UA 8842'}</strong>
              </div>
              <div>
                Shoot Duration: <strong className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{invoice.actual_shoot_days} Actual Days</strong> ({invoice.start_date} → {invoice.end_date})
              </div>
            </div>
          </div>

          {/* Itemized Prop Table with Thumbnails */}
          <div className="my-5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[10px] uppercase font-bold tracking-wider">
                  <th className="p-2.5 border-r border-slate-300 w-8">#</th>
                  <th className="p-2.5 border-r border-slate-300 w-16">Prop Photo</th>
                  <th className="p-2.5 border-r border-slate-300">Prop Particulars</th>
                  <th className="p-2.5 border-r border-slate-300 font-mono">Property Tag</th>
                  <th className="p-2.5 border-r border-slate-300 text-right">Daily Rate</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Actual Days</th>
                  <th className="p-2.5 text-right font-bold">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-2.5 border-r border-slate-200 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-2.5 border-r border-slate-200">
                      <div className="relative w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        <Image
                          src={item.image_url || 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=150'}
                          alt={item.prop_title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-2.5 border-r border-slate-200">
                      <strong className="font-bold text-slate-900 block">{item.prop_title}</strong>
                      <span className="text-[10px] text-slate-500">{item.prop_category || 'Vintage Cinema Prop'}</span>
                    </td>
                    <td className="p-2.5 border-r border-slate-200 font-mono font-semibold text-slate-700">
                      {item.item_code}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-right font-mono text-slate-700">
                      {formatINR(item.daily_rental_rate)}/d
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-center font-bold">
                      {item.actual_days}
                    </td>
                    <td className="p-2.5 text-right font-mono font-extrabold text-slate-900">
                      {formatINR(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Deductions Breakdown */}
          <div className="flex justify-end my-5">
            <div className="w-full sm:w-96 text-xs space-y-2 border-t-2 border-slate-900 pt-3">
              <div className="flex justify-between text-slate-700">
                <span>Base Prop Rental Subtotal ({invoice.actual_shoot_days} Days):</span>
                <span className="font-mono font-semibold">{formatINR(invoice.base_rental_subtotal)}</span>
              </div>

              {invoice.handling_labor_charges > 0 && (
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>Handling &amp; Transit Crew Labor:</span>
                  <span className="font-mono">+{formatINR(invoice.handling_labor_charges)}</span>
                </div>
              )}

              {invoice.damage_penalties > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Assessed Damage / Penalty Deductions:</span>
                  <span className="font-mono">+{formatINR(invoice.damage_penalties)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>GST @ 18% (9% CGST + 9% SGST):</span>
                <span className="font-mono">{formatINR(invoice.gst_tax_amount)}</span>
              </div>

              <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                <span>Gross Invoice Amount:</span>
                <span className="font-mono">{formatINR(invoice.gross_total)}</span>
              </div>

              {invoice.advance_deduction > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Less: Advance Collected:</span>
                  <span className="font-mono">-{formatINR(invoice.advance_deduction)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black border-t-2 border-slate-900 pt-2 mt-2 text-slate-900">
                <span>Final Balance Due:</span>
                <span className="font-mono font-extrabold text-lg text-emerald-700">
                  {formatINR(invoice.final_balance_due)}
                </span>
              </div>
            </div>
          </div>

          {/* Corporate Terms */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
            <strong>Payment Terms &amp; Settlement:</strong>
            <p>1. Outstanding balances must be settled within 7 days of invoice issuance via RTGS/NEFT or corporate cheque.</p>
            <p>2. Bank Details: <strong>ASHWA Movie Property Rentals Ltd</strong> • HDFC Bank Jubilee Hills • A/C: 502000889211 • IFSC: HDFC0000421.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-xs mt-6">
            <div>
              <div className="h-10 border-b border-slate-300" />
              <span className="font-bold block mt-1">Client Authorized Signatory</span>
              <span className="text-[10px] text-slate-400">Received &amp; Accepted</span>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-slate-300" />
              <span className="font-bold block mt-1">For ASHWA Movie Property Rentals Ltd.</span>
              <span className="text-[10px] text-slate-400">Authorized Financial Controller</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
