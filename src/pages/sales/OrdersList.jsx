'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Package,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  RefreshCw,
  Building2,
  Users,
  HardHat,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ordersService, STAFF_EXECUTIVES } from '@/lib/services/orders';
import { WalkInOrder } from '@/types/orders';
import { useAuth } from '@/context/AuthContext';

export function OrdersList() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedExecutiveFilter, setSelectedExecutiveFilter] = useState('all');

  const loggedExecutiveName = profile?.full_name || 'Ravi Kumar';

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await ordersService.getOrders();
      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Filter orders based on executive, status, and search query
  const filteredOrders = orders.filter((order) => {
    // 1. Executive filter
    if (selectedExecutiveFilter !== 'all') {
      const filterLower = selectedExecutiveFilter.toLowerCase().trim();
      const isAssigned = Array.isArray(order.assigned_executives) && order.assigned_executives.some((exec) => {
        if (!exec) return false;
        if (typeof exec === 'string') {
          return exec.toLowerCase().includes(filterLower) || filterLower.includes(exec.toLowerCase());
        }
        const execId = exec.id ? String(exec.id).toLowerCase() : '';
        const execName = exec.name ? String(exec.name).toLowerCase() : '';
        return execId === filterLower || execName.includes(filterLower) || filterLower.includes(execId);
      });
      if (!isAssigned) return false;
    }

    // 2. Status filter
    const st = (order.status || '').toUpperCase();
    if (statusFilter === 'ASSIGNED' && st !== 'ASSIGNED') return false;
    if (statusFilter === 'PICKING_IN_PROGRESS' && !st.includes('PICKING')) return false;
    if (statusFilter === 'COMPLETED' && !['CONFIRMED', 'QUOTATION', 'DISPATCHED', 'RETURNED', 'CLOSED', 'VERIFIED_CLOSED'].includes(st)) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = (order.order_number || '').toLowerCase().includes(q);
      const matchClient = (order.client_name || '').toLowerCase().includes(q);
      const matchProj = (order.movie_project_name || order.production_name || '').toLowerCase().includes(q);
      const matchLoc = (order.shoot_location || '').toLowerCase().includes(q);
      if (!matchNum && !matchClient && !matchProj && !matchLoc) return false;
    }

    return true;
  });

  const getStatusBadge = (status) => {
    const st = (status || '').toUpperCase();
    if (st.includes('PICKING')) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Picking Active
        </span>
      );
    }
    if (st === 'ASSIGNED') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-900 border border-sky-300 inline-flex items-center gap-1">
          Assigned
        </span>
      );
    }
    if (['CONFIRMED', 'QUOTATION', 'DISPATCHED', 'RETURNED', 'CLOSED', 'VERIFIED_CLOSED'].includes(st)) {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
        {status || 'Draft'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* 1. TOP HEADER */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Rental Sales Field Ops
            </span>
            <span className="text-xs text-slate-400 font-mono">Role: rental_sales_exec</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Assigned Orders Execution Pipeline
          </h1>
          <p className="text-xs text-slate-500">
            Open an assigned client shoot order to scan property barcodes directly into the live picking manifest.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Orders</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Orders' },
            { id: 'ASSIGNED', label: 'Assigned' },
            { id: 'PICKING_IN_PROGRESS', label: 'Picking Active' },
            { id: 'COMPLETED', label: 'Completed / Ready' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Executive Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search production, client, #..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
            />
          </div>

          <select
            value={selectedExecutiveFilter}
            onChange={(e) => setSelectedExecutiveFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-800 font-semibold shadow-sm cursor-pointer"
          >
            <option value="all">All Executives</option>
            {STAFF_EXECUTIVES.map((exec) => (
              <option key={exec.id} value={exec.id}>
                {exec.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. CONTENT AREA: RESPONSIVE ADAPTIVE LAYOUT */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Loading Assigned Orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Orders Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No orders match the current filter criteria or executive assignment.
          </p>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* DESKTOP WEB VIEWPORT (md: and above): SLEEK HORIZONTAL TABLE */}
          {/* ======================================================== */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 font-mono">Order ID</th>
                    <th className="py-3.5 px-4">Production / Movie Title</th>
                    <th className="py-3.5 px-4">Shoot Location</th>
                    <th className="py-3.5 px-4 text-center">Item Count</th>
                    <th className="py-3.5 px-4">Timestamps</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action CTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredOrders.map((order) => {
                    const itemCount = order.order_items_count || order.item_count || 6;
                    const duration = order.rental_days || order.duration_days || 3;
                    const projectTitle = order.movie_project_name || order.production_name || 'Movie Shoot Order';
                    const location = order.shoot_location || 'Studio Floor, Ramoji Film City';
                    const startDate = order.rental_start_date || 'Today';
                    const endDate = order.rental_end_date || 'In 4 days';

                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-amber-50/40 transition-colors group"
                      >
                        {/* 1. Order ID */}
                        <td className="py-4 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            #{order.order_number}
                          </span>
                        </td>

                        {/* 2. Production / Movie Title */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                            {projectTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{order.client_name}</span>
                          </div>
                        </td>

                        {/* 3. Shoot Location */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="text-slate-600 line-clamp-1 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{location}</span>
                          </div>
                        </td>

                        {/* 4. Item Count */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
                            <Package className="w-3 h-3 text-slate-500" />
                            {itemCount} props
                          </span>
                        </td>

                        {/* 5. Timestamps */}
                        <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                            <span>{startDate} &rarr; {endDate}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Duration: {duration} days
                          </div>
                        </td>

                        {/* 6. Status Badge */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        {/* 7. Action CTA */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/sales/orders/${order.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <ScanLine className="w-3.5 h-3.5" />
                            <span>Open Picking Console</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MOBILE VIEWPORT (< md): HIGH-DENSITY TOUCH-FRIENDLY BOX CARDS */}
          {/* ======================================================== */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => {
              const itemCount = order.order_items_count || order.item_count || 6;
              const duration = order.rental_days || order.duration_days || 3;
              const projectTitle = order.movie_project_name || order.production_name || 'Movie Shoot Order';
              const location = order.shoot_location || 'Studio Floor, Ramoji Film City';
              const startDate = order.rental_start_date || 'Today';
              const endDate = order.rental_end_date || 'In 4 days';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4 relative transition-all hover:shadow-md"
                >
                  {/* Status Pill Pinned to Top Right */}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Header: Order Number & Bold Title */}
                  <div className="pr-24 space-y-1">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                      #{order.order_number}
                    </span>
                    <h3 className="text-base font-black text-slate-950 leading-tight">
                      {projectTitle}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{order.client_name}</span>
                    </p>
                  </div>

                  {/* Meta Details with Icons */}
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-sky-500" />
                        <span>{startDate} – {endDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        <span>{itemCount} Props</span>
                      </div>
                    </div>
                  </div>

                  {/* Full-Width Touch Action Button at Bottom of Card */}
                  <Link
                    href={`/sales/orders/${order.id}`}
                    className="w-full min-h-[44px] py-3 rounded-xl bg-slate-900 hover:bg-amber-500 text-white hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 touch-manipulation cursor-pointer select-none"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Open Picking Console</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default OrdersList;
