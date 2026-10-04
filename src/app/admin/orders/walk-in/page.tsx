'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Users,
  Film,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Radio,
  Truck,
  Sparkles,
  AlertCircle,
  X,
  Layers,
  QrCode,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import { ordersService, STAFF_EXECUTIVES } from '@/lib/services/orders';
import { WalkInOrder, AssignedExecutive, OrderLifecycleStatus } from '@/types/orders';
import { formatINR } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { DeleteOrderConfirmDialog } from '@/components/orders/DeleteOrderConfirmDialog';

export default function WalkInOrdersPage() {
  const router = useRouter();
  const { user, profile, role } = useAuth();
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<WalkInOrder | null>(null);

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [movieProjectName, setMovieProjectName] = useState('');
  const [shootLocation, setShootLocation] = useState('Ramoji Film City, Soundstage 4');
  const [rentalStartDate, setRentalStartDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [rentalEndDate, setRentalEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [rentalDays, setRentalDays] = useState(3);
  const [selectedExecIds, setSelectedExecIds] = useState<string[]>(['exec-001']);
  const [vehicleNumber, setVehicleNumber] = useState('TS 09 UA 8842');
  const [specialNotes, setSpecialNotes] = useState('');

  // Calculate rental days whenever dates change
  useEffect(() => {
    if (rentalStartDate && rentalEndDate) {
      const start = new Date(rentalStartDate);
      const end = new Date(rentalEndDate);
      const diffTime = Math.max(0, end.getTime() - start.getTime());
      const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      setRentalDays(diffDays);
    }
  }, [rentalStartDate, rentalEndDate]);

  // Load orders
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Listen for broadcast events
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('ashwa_walkin_picking_stream');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_DELETED' && event.data.orderId) {
          setOrders((prev) => prev.filter((o) => o.id !== event.data.orderId));
        }
        loadOrders();
      };
      return () => {
        bc.close();
      };
    }
  }, []);

  // Handle Order Creation
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !movieProjectName.trim()) {
      alert('Please enter Client Name and Movie / Project Name');
      return;
    }

    if (selectedExecIds.length === 0) {
      alert('Please assign at least one Rental Sales Executive for warehouse picking.');
      return;
    }

    setSubmitting(true);
    try {
      const assignedExecs: AssignedExecutive[] = STAFF_EXECUTIVES.filter((e) =>
        selectedExecIds.includes(e.id)
      ).map((e) => ({ ...e, active_picking: true }));

      const newOrder = await ordersService.createWalkInOrder({
        production_company_name: clientName,
        movie_project_name: movieProjectName,
        client_contact_number: clientPhone,
        client_email_address: clientEmail,
        shoot_location: shootLocation,
        estimated_start_date: rentalStartDate,
        estimated_return_date: rentalEndDate,
        duration_days: rentalDays,
        assigned_executives: assignedExecs,
        notes: specialNotes,
        created_by: user?.id || '00000000-0000-0000-0000-000000000001',
      });

      setIsCreateModalOpen(false);
      setClientName('');
      setClientPhone('');
      setMovieProjectName('');
      router.push(`/admin/orders/${newOrder.id}/billing-cart`);
    } catch (err) {
      console.error('Order creation error:', err);
      alert('Failed to create order. Check console.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExec = (id: string) => {
    setSelectedExecIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      o.order_number.toLowerCase().includes(q) ||
      o.client_name.toLowerCase().includes(q) ||
      o.movie_project_name.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (statusFilter === 'All') return true;
    return o.status.toLowerCase() === statusFilter.toLowerCase();
  });

  // Summary Metrics
  const activePickingCount = orders.filter((o) =>
    ['Assigned', 'Picking_In_Progress', 'picking_in_progress'].includes(o.status)
  ).length;
  const dispatchedCount = orders.filter((o) =>
    ['Dispatched', 'dispatched'].includes(o.status)
  ).length;
  const totalValuation = orders.reduce((sum, o) => sum + (o.total_replacement_val || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-800">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-700 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>In-Person Walk-in Operations</span>
          </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Walk-in Orders &amp; Staging
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create and manage walk-in cinema prop rentals, monitor executive picking queues, and dispatch sets.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadOrders}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Walk-in Order</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Picking Queue
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{activePickingCount}</p>
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Live in warehouse picking
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Floor Executives
              </span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">4 On-Duty</p>
            <p className="text-xs text-slate-400 mt-1">Floor 1, Floor 2, Yard</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dispatched / On Rent
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{dispatchedCount}</p>
            <p className="text-xs text-emerald-700 mt-1">Active on shoot locations</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Asset Valuation
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2 font-mono">{formatINR(totalValuation)}</p>
            <p className="text-xs text-slate-400 mt-1">Under managed rental liability</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Movie, Client..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['All', 'Assigned', 'Picking_In_Progress', 'Dispatched', 'Returned'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {st === 'Picking_In_Progress' ? 'Picking In Progress' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4 w-[20%]">Order # &amp; Client</th>
                  <th className="py-3.5 px-4 w-[24%]">Movie / Production Title</th>
                  <th className="py-3.5 px-4 w-[16%]">Rental Duration</th>
                  <th className="py-3.5 px-4 w-[15%]">Assigned Team</th>
                  <th className="py-3.5 px-4 w-[13%]">Status</th>
                  <th className="py-3.5 px-4 w-[12%] text-right">Rent Estimate</th>
                  <th className="py-3.5 pr-4 pl-1 w-[4%] text-right" aria-label="Open detail" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <QrCode className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      No orders found matching this filter.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isPicking =
                      order.status === 'Picking_In_Progress' || order.status === 'Assigned' || order.status === 'PICKING_IN_PROGRESS';
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/admin/orders/${order.id}/billing-cart`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            router.push(`/admin/orders/${order.id}/billing-cart`);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open Order ${order.order_number} for ${order.movie_project_name}`}
                        className="cursor-pointer hover:bg-slate-50/90 focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500/40 transition-colors group select-none"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-sky-600 group-hover:underline transition-colors text-xs">
                            {order.order_number}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                            {order.client_name}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                            <Film className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                            <span className="truncate max-w-[240px]">{order.movie_project_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[240px] mt-0.5">
                            {order.shoot_location || 'Soundstage Hyderabad'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-700 text-xs font-mono">
                            {order.rental_start_date} → {order.rental_end_date}
                          </div>
                          <div className="text-[11px] text-sky-700 font-semibold mt-0.5">
                            {order.rental_days || order.duration_days} Days Shoot
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div
                            className="flex flex-wrap gap-1 max-w-[180px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.assigned_executives && order.assigned_executives.length > 0 ? (
                              order.assigned_executives.map((exec) => (
                                <span
                                  key={exec.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap"
                                  title={`${exec.name} - Floor ${exec.floor}`}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                  {exec.name.split(' ')[0]} (F{exec.floor})
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">Unassigned</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                              isPicking
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : order.status === 'Assigned'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : order.status === 'Confirmed' || order.status === 'Quotation_Review'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : order.status === 'Dispatched' || order.status === 'DISPATCHED_RENTAL_PIPELINE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.status === 'Returned'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isPicking && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            )}
                            {isPicking
                              ? 'In Picking'
                              : order.status === 'DISPATCHED_RENTAL_PIPELINE'
                              ? 'Dispatched'
                              : order.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="font-semibold text-slate-900 text-xs font-mono">
                            {formatINR(order.total_rent_amount || order.final_payable || 0)}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Val: {formatINR(order.total_replacement_val || 0)}
                          </div>
                        </td>

                        <td className="py-3.5 pr-4 pl-1 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {(() => {
                              const perm = ordersService.canDeleteOrder(order, user, role);
                              if (perm.allowed) {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => setOrderToDelete(order)}
                                    className="p-1.5 rounded-lg border border-transparent hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                    title="Delete Order (2-Step Verification)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                );
                              } else {
                                return (
                                  <div className="relative group">
                                    <button
                                      type="button"
                                      disabled
                                      className="p-1.5 rounded-lg text-slate-300 cursor-not-allowed opacity-60"
                                      title={perm.reason || "Dispatched orders can only be deleted by a Super Admin"}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 z-30 hidden group-hover:block w-56 p-2 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl pointer-events-none text-left">
                                      {perm.reason || "Dispatched orders can only be deleted by a Super Admin"}
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                            <div className="text-slate-400 group-hover:text-sky-600 transition-colors">
                              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* CREATE WALK-IN ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 my-8 space-y-5 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Step 1: Front Desk Intake
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Create Walk-in Rental Order
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Assign this order to floor executives. They will scan the props live in the warehouse.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Client & Production Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client / Production Company <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Mythri Movie Makers"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Movie / Project Name <span className="text-sky-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={movieProjectName}
                    onChange={(e) => setMovieProjectName(e.target.value)}
                    placeholder="e.g. Pushpa 2: The Rule - VFX Unit"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+91 98490 12345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Client Official Email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="art@mythriofficial.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Shoot Dates & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rental Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rentalStartDate}
                    onChange={(e) => setRentalStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rental End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={rentalEndDate}
                    onChange={(e) => setRentalEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Days)
                  </label>
                  <div className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-sm text-sky-700 font-bold flex items-center justify-between">
                    <span>{rentalDays} Days Shoot</span>
                    <Clock className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Multi-Executive Assignment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Assign Rental Sales Executives (Mobile QR Pickers) <span className="text-sky-600">*</span>
                  </label>
                  <span className="text-[11px] text-sky-700 font-medium">
                    {selectedExecIds.length} Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STAFF_EXECUTIVES.map((exec) => {
                    const isSelected = selectedExecIds.includes(exec.id);
                    return (
                      <div
                        key={exec.id}
                        onClick={() => toggleExec(exec.id)}
                        className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 text-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-900">{exec.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Floor {exec.floor} • {exec.phone}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                          F{exec.floor}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shoot Location Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shoot Location (Studio or Outdoor Address) <span className="text-sky-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={shootLocation}
                  onChange={(e) => setShootLocation(e.target.value)}
                  placeholder="e.g. Ramoji Film City, Floor 7 Cyber Set, Hyderabad"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-sky-900">Warehouse QR Workflow Note: </span>
                  Props are scanned directly by the assigned executives using their mobile scanner app. The manager can monitor items live on the estimation terminal.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Create Order & Assign Picking'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2-STEP CONFIRMATION PROTOCOL DIALOG */}
      <DeleteOrderConfirmDialog
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        order={orderToDelete}
        currentUser={user}
        userRole={role}
        onOrderDeleted={(deletedId) => {
          setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          setOrderToDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}
