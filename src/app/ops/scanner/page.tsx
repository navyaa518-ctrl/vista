'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  Users,
  Film,
  Calendar,
  Clock,
  ArrowRight,
  Radio,
  CheckCircle2,
  RefreshCw,
  Search,
  Layers,
  MapPin,
  Sparkles,
  ChevronRight,
  Smartphone,
} from 'lucide-react';
import { ordersService, STAFF_EXECUTIVES } from '@/lib/services/orders';
import { WalkInOrder } from '@/types/orders';
import { useRole } from '@/context/RoleContext';

export default function OpsScannerTasksPage() {
  const router = useRouter();
  const { executiveName, setExecutiveName } = useRole();
  const [selectedExecutive, setSelectedExecutive] = useState(
    executiveName || 'Ravi Kumar (Floor 1 Specialist)'
  );
  const [orders, setOrders] = useState<WalkInOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAssignedOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersService.getAssignedOrdersForExecutive(selectedExecutive);
      setOrders(data);
    } catch (e) {
      console.error('Error loading assigned orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedOrders();
  }, [selectedExecutive]);

  // Sync role context
  const handleExecChange = (name: string) => {
    setSelectedExecutive(name);
    setExecutiveName(name);
  };

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.movie_project_name.toLowerCase().includes(q) ||
      o.client_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Mobile App Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <QrCode className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  ASHWA Warehouse Scanner
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PWA Mobile
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Floor Executive Picking Terminal • Direct QR Sync
              </p>
            </div>
          </div>

          <button
            onClick={loadAssignedOrders}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Executive Profile Switcher Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              Logged In Executive
            </span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online in Warehouse
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STAFF_EXECUTIVES.map((exec) => {
              const isSelected = selectedExecutive === exec.name;
              return (
                <button
                  key={exec.id}
                  onClick={() => handleExecChange(exec.name)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs truncate">{exec.name.split(' ')[0]}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                    Floor {exec.floor}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Task Queue Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>My Assigned Picking Tasks</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {orders.length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Orders assigned to you by Front Desk. Tap &apos;Start Picking&apos; to launch the camera scanner.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assigned movie shoot or order #..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Orders Queue Cards */}
        <div className="space-y-3.5">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
              Loading your warehouse queue...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
              <h3 className="text-base font-bold text-white">All Caught Up!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No active orders currently assigned to {selectedExecutive}. Select another executive above or wait for Front Desk to dispatch an order.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              return (
                <div
                  key={order.id}
                  className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 hover:border-amber-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {order.order_number}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          Ready for Picking
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-amber-400 transition-colors">
                        {order.movie_project_name}
                      </h3>
                      <div className="text-xs text-slate-400">
                        Client: <span className="text-slate-300 font-medium">{order.client_name}</span>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="font-mono text-slate-300 font-bold">
                        {order.rental_days} Days
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {order.rental_start_date}
                      </div>
                    </div>
                  </div>

                  {/* Shoot Details & Location */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{order.shoot_location || 'Soundstage Hyderabad'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <span className="truncate">
                        {order.assigned_executives.length} Execs Assigned
                      </span>
                    </div>
                  </div>

                  {/* Big Action Button */}
                  <Link
                    href={`/ops/orders/${order.id}/pick`}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all active:scale-[0.98]"
                  >
                    <QrCode className="w-4 h-4 stroke-[2.5]" />
                    Start QR Picking
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
