'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Receipt,
  FileText,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Building,
  Film,
  Calendar,
  Truck,
  DollarSign,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { ordersService } from '@/lib/services/orders';
import { FinalInvoiceRecord, WalkInOrder } from '@/types/orders';
import { formatINR } from '@/lib/utils';
import { TaxInvoiceView } from '@/components/documents/TaxInvoiceView';

type TabStatus = 'all' | 'paid' | 'outstanding';

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<FinalInvoiceRecord[]>([]);
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<FinalInvoiceRecord | null>(null);
  const [generatingForId, setGeneratingForId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, ordList] = await Promise.all([
        ordersService.getFinalInvoices(),
        ordersService.getOrders(),
      ]);
      setInvoices(invList);
      setOrders(ordList);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateInvoice = async (orderId: string) => {
    setGeneratingForId(orderId);
    try {
      const inv = await ordersService.generateFinalInvoice(orderId);
      await loadData();
      setSelectedInvoice(inv);
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      alert('Error generating invoice.');
    } finally {
      setGeneratingForId(null);
    }
  };

  // Financial KPIs
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalAdvances = 0;
    let totalOutstanding = 0;
    let paidCount = 0;
    let outstandingCount = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.gross_total || 0;
      totalAdvances += inv.advance_deduction || 0;
      totalOutstanding += inv.final_balance_due || 0;
      if (inv.final_balance_due === 0) {
        paidCount++;
      } else {
        outstandingCount++;
      }
    });

    return {
      totalBilled,
      totalAdvances,
      totalOutstanding,
      paidCount,
      outstandingCount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter((inv) => {
      if (activeTab === 'paid' && inv.final_balance_due > 0) return false;
      if (activeTab === 'outstanding' && inv.final_balance_due === 0) return false;

      if (!q) return true;
      const invNo = (inv.invoice_number || '').toLowerCase();
      const client = (inv.client_name || '').toLowerCase();
      const prod = (inv.production_name || '').toLowerCase();
      const ordNo = (inv.order_number || '').toLowerCase();

      return invNo.includes(q) || client.includes(q) || prod.includes(q) || ordNo.includes(q);
    });
  }, [invoices, activeTab, searchQuery]);

  return (
    <div className="space-y-6 text-slate-900 animate-fade-in pb-16">
      {/* Top Command Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Receipt className="w-3 h-3 text-purple-600" />
              Corporate Billing Division
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">
              Issued Invoices: <strong className="text-slate-900">{invoices.length}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight font-sans">
            GST Tax Invoices &amp; Revenue Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise GST Tax Invoices generated upon safe return verification with dynamic shooting days, advance deductions, and damage recovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-purple-500 text-slate-600 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <Link
            href="/admin/orders/pipeline"
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md shadow-slate-950/20 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Rental Pipeline</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Gross Invoiced Value</span>
            <Receipt className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-black text-slate-950 font-mono">
            {formatINR(stats.totalBilled)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across {invoices.length} commercial shoots</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Advance Deductions</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">
            {formatINR(stats.totalAdvances)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Pre-paid advance credits</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Net Receivables Due</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">
            {formatINR(stats.totalOutstanding)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.outstandingCount} invoices pending payment</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Settled / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 font-mono">
            {stats.paidCount} / {stats.totalCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fully reconciled accounts</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('outstanding')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'outstanding'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Outstanding ({stats.outstandingCount})
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Paid &amp; Settled ({stats.paidCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice, client, movie..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
          />
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
            <span>Loading tax invoices...</span>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
            <Receipt className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Invoices in this View</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Invoices are automatically generated and published here when return check-in is verified on the Rental Pipeline.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => {
            const isPaid = inv.final_balance_due === 0;

            return (
              <div
                key={inv.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
              >
                {/* Left Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {inv.invoice_number}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Order: <strong>{inv.order_number}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(inv.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                        isPaid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isPaid ? 'PAID & SETTLED' : 'PAYMENT DUE'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950">
                    {inv.production_name}
                  </h3>

                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>Client: <strong className="text-slate-800">{inv.client_name}</strong></span>
                    <span>•</span>
                    <span>Shoot: <strong>{inv.actual_shoot_days} Days</strong></span>
                    {inv.vehicle_no && (
                      <>
                        <span>•</span>
                        <span className="font-mono">Vehicle: {inv.vehicle_no}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Financials & Action */}
                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Financial Breakdown */}
                  <div className="text-right text-xs">
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">
                      Gross Total: <span className="font-mono text-slate-800">{formatINR(inv.gross_total)}</span>
                    </div>
                    {inv.advance_deduction > 0 && (
                      <div className="text-emerald-700 text-[10px] font-mono">
                        Less Advance: -{formatINR(inv.advance_deduction)}
                      </div>
                    )}
                    <div className="mt-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Balance Due:</span>
                      <span className={`font-mono text-base font-black ${isPaid ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatINR(inv.final_balance_due)}
                      </span>
                    </div>
                  </div>

                  {/* Print / View CTA */}
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Tax Invoice</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Orders awaiting final invoice generation */}
      {orders.filter((o) => (o.lifecycle_status === 'Verified_Closed' || o.status === 'Returned') && !invoices.some((inv) => inv.order_id === o.id)).length > 0 && (
        <div className="mt-10 p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
          <h4 className="text-sm font-bold text-amber-950 flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Verified Returns Pending Final Invoice Publishing
          </h4>
          <p className="text-xs text-amber-800 mb-3">
            The following orders have verified returns completed. Click &ldquo;Generate Invoice&rdquo; to finalize the ledger and issue the official tax document:
          </p>

          <div className="space-y-2">
            {orders
              .filter((o) => (o.lifecycle_status === 'Verified_Closed' || o.status === 'Returned') && !invoices.some((inv) => inv.order_id === o.id))
              .map((ord) => (
                <div key={ord.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-200 text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{ord.order_number}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="font-semibold text-slate-800">{ord.movie_project_name}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span className="text-slate-500">{ord.client_name}</span>
                  </div>
                  <button
                    disabled={generatingForId === ord.id}
                    onClick={() => handleGenerateInvoice(ord.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-2xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {generatingForId === ord.id ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-3 h-3" />
                        Generate Invoice
                      </>
                    )}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tax Invoice Modal */}
      {selectedInvoice && (
        <TaxInvoiceView
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}
