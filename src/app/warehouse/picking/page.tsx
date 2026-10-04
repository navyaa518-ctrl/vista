'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Order, OrderItem, PropItem } from '@/types/database';
import { soundEffects } from '@/lib/audio';
import { useRole } from '@/context/RoleContext';
import confetti from 'canvas-confetti';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Radio,
  UserCheck,
  RefreshCw,
  Box,
  Truck,
  ArrowRight,
  Layers
} from 'lucide-react';

export default function PickingPage() {
  const { executiveName, setExecutiveName, activeFloor, setActiveFloor } = useRole();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Scan input & feedback
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [lastScannedSerial, setLastScannedSerial] = useState<string | null>(null);

  // Video element for camera scanner
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  // Subscribe to Realtime changes on orders and order_items
  useEffect(() => {
    const channel = supabase
      .channel('ashwa_warehouse_picking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newItem = payload.new as OrderItem;
            setOrderItems((prev) =>
              prev.map((item) => (item.id === newItem.id ? newItem : item))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id: string }).id;
            setOrderItems((prev) => prev.filter((item) => item.id !== oldId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new as Order;
          if (updatedOrder.id === selectedOrderId) {
            setSelectedOrder(updatedOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedOrderId]);

  // When selected order changes, fetch its items
  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  async function fetchActiveOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['rfq', 'order_created', 'picking_in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setOrders(data as Order[]);
        setSelectedOrderId(data[0].id);
        setSelectedOrder(data[0] as Order);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderDetails(orderId: string) {
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (orderData) setSelectedOrder(orderData as Order);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        // Sort by floor and rack for optimal warehouse picking walking route!
        .order('floor', { ascending: true })
        .order('rack', { ascending: true });

      if (itemsError) throw itemsError;
      if (itemsData) setOrderItems(itemsData as OrderItem[]);
    } catch (err) {
      console.error('Error fetching items for order:', err);
    }
  }

  // Camera handling
  async function toggleCamera() {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch (err) {
        alert('Camera access could not be initialized. You can use the Quick Serial Input below.');
      }
    }
  }

  // Handle Scanning of a QR / Serial code
  async function handleScanSubmit(rawInput: string) {
    const serial = rawInput.trim().toUpperCase();
    if (!serial || !selectedOrder) return;

    setLastScannedSerial(serial);

    // 1. Check physical prop_items table for this unit
    const { data: physicalUnit, error: unitError } = await supabase
      .from('prop_items')
      .select('*')
      .eq('serial_number', serial)
      .maybeSingle();

    if (unitError || !physicalUnit) {
      soundEffects.playErrorBuzzer();
      setScanMessage({
        type: 'error',
        text: `Barcode "${serial}" not recognized in ASHWA inventory database.`,
      });
      return;
    }

    // 2. WARNING CHECK: Is unit already rented, reserved, or damaged?
    if (physicalUnit.status === 'on_rent') {
      soundEffects.playErrorBuzzer();
      setScanMessage({
        type: 'error',
        text: `⚠️ CRITICAL WARNING: Unit ${serial} is currently ON RENT with another production! DO NOT PICK.`,
      });
      return;
    }

    if (physicalUnit.status === 'maintenance' || physicalUnit.status === 'lost') {
      soundEffects.playErrorBuzzer();
      setScanMessage({
        type: 'error',
        text: `⚠️ Unit ${serial} is marked as ${physicalUnit.status.toUpperCase()} and cannot be dispatched.`,
      });
      return;
    }

    // 3. Match against pending items in the active order
    // Find an item with this prop_id that is still 'pending'
    const matchingPendingItem = orderItems.find(
      (item) => item.prop_id === physicalUnit.prop_id && item.status === 'pending'
    );

    if (!matchingPendingItem) {
      // Check if already picked for this order
      const alreadyPicked = orderItems.find(
        (item) => item.item_serial === serial && item.status === 'picked'
      );
      if (alreadyPicked) {
        soundEffects.playErrorBuzzer();
        setScanMessage({
          type: 'info',
          text: `Unit ${serial} has already been scanned and verified for this order.`,
        });
        return;
      }

      soundEffects.playErrorBuzzer();
      setScanMessage({
        type: 'error',
        text: `Unit ${serial} does not match any pending line item in Order #${selectedOrder.order_number}.`,
      });
      return;
    }

    // 4. VALID PICK: Update item in database with Realtime broadcast
    try {
      const now = new Date().toISOString();

      // Update order_items
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          status: 'picked',
          prop_item_id: physicalUnit.id,
          item_serial: physicalUnit.serial_number,
          picked_by_name: executiveName,
          picked_at: now,
        })
        .eq('id', matchingPendingItem.id);

      if (updateError) throw updateError;

      // Update physical unit status to 'picked'
      await supabase
        .from('prop_items')
        .update({ status: 'picked' })
        .eq('id', physicalUnit.id);

      // Log movement
      await supabase.from('inventory_logs').insert([
        {
          order_id: selectedOrder.id,
          prop_item_id: physicalUnit.id,
          action: 'scan_pick',
          executive_name: executiveName,
          details: { serial, floor: physicalUnit.floor, rack: physicalUnit.rack },
        },
      ]);

      // Sound effect: Positive golden chime!
      soundEffects.playSuccessChime();

      setScanMessage({
        type: 'success',
        text: `✓ Successfully picked ${serial} (${matchingPendingItem.prop_title}) on Floor ${physicalUnit.floor}!`,
      });
      setBarcodeInput('');

      // Check if all items are now picked
      const remainingPending = orderItems.filter(
        (item) => item.id !== matchingPendingItem.id && item.status === 'pending'
      ).length;

      if (remainingPending === 0) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#10b981', '#ffffff'],
        });
        // Update order status to picked_verified
        await supabase
          .from('orders')
          .update({ status: 'picked_verified' })
          .eq('id', selectedOrder.id);
      }
    } catch (err) {
      console.error('Error updating picked item:', err);
      soundEffects.playErrorBuzzer();
      setScanMessage({ type: 'error', text: 'Database error updating picked item.' });
    }
  }

  // Picking statistics
  const totalCount = orderItems.length;
  const pickedCount = orderItems.filter((i) => i.status === 'picked').length;
  const percentComplete = totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#0e1017] to-[#121520] border-b border-amber-500/20 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Realtime WebSocket Picking Channel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Multi-Executive Warehouse Picking Terminal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Floor 1 &amp; Floor 2 executives pick simultaneously. Actions sync to Counter Billing in &lt;100ms.
            </p>
          </div>

          {/* Active Picker Persona Tag */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-xs">
              <div className="text-[10px] text-amber-400 uppercase font-semibold">Active Picker</div>
              <select
                value={executiveName}
                onChange={(e) => setExecutiveName(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer mt-0.5"
              >
                <option value="Ravi Kumar (Floor 1 Specialist)" className="bg-slate-900">
                  Ravi Kumar (Floor 1 Heavy)
                </option>
                <option value="Vikram Singh (Floor 2 Specialist)" className="bg-slate-900">
                  Vikram Singh (Floor 2 Precision)
                </option>
                <option value="Suresh Babu (General Picker)" className="bg-slate-900">
                  Suresh Babu (General Picker)
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* ORDER SELECTOR & PROGRESS BAR */}
        <div className="p-6 rounded-2xl bg-[#0e1017] border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                Select Active Production Order to Pick:
              </label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full md:max-w-md px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-medium focus:outline-none focus:border-amber-400"
              >
                {orders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    #{ord.order_number} • {ord.production_name} ({ord.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {selectedOrder && (
              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 block">Production Client:</span>
                <span className="text-sm font-bold text-white">{selectedOrder.client_name}</span>
                <span className="text-xs text-amber-300 block">{selectedOrder.shoot_location}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300">
                Picking Progress: <strong className="text-amber-400">{pickedCount}</strong> of {totalCount} Props Picked
              </span>
              <span className="font-bold gold-gradient-text font-serif text-sm">
                {percentComplete}% Complete
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SCANNER CONTROLLER (LEFT COLUMN) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-[#0f1118] border border-amber-500/30 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <ScanLine className="w-4 h-4" />
                  QR Barcode Scanner
                </span>
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    cameraActive
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{cameraActive ? 'Stop Camera' : 'Start Camera'}</span>
                </button>
              </div>

              {/* Camera Video Viewfinder */}
              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-amber-500/50 shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {/* Aiming Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 border-2 border-dashed border-amber-400 rounded-2xl animate-pulse" />
                  </div>
                </div>
              )}

              {/* Barcode Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleScanSubmit(barcodeInput);
                }}
                className="space-y-3"
              >
                <label className="text-xs font-semibold text-slate-300 block">
                  Scan or Type Physical Serial Number:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="e.g. ASH-SWD-004-A"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 uppercase"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black shadow-lg shadow-amber-500/20 transition-all shrink-0"
                  >
                    Confirm Scan
                  </button>
                </div>
              </form>

              {/* Scan Feedback Message */}
              {scanMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 animate-fade-in ${
                    scanMessage.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                      : scanMessage.type === 'error'
                      ? 'bg-rose-950/80 text-rose-200 border-rose-500/50'
                      : 'bg-blue-950/60 text-blue-200 border-blue-500/40'
                  }`}
                >
                  {scanMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{scanMessage.text}</span>
                </div>
              )}

              {/* 1-CLICK TEST SIMULATOR */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rapid Testing Barcode Simulation (1-Tap):
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleScanSubmit('ASH-SWD-004-A')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-400/50 text-xs flex items-center justify-between text-slate-300 hover:text-white"
                  >
                    <span className="font-mono text-amber-300 font-semibold">ASH-SWD-004-A</span>
                    <span className="text-[10px] text-slate-400">Damascus Sword (FL 1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScanSubmit('ASH-CAM-008-A')}
                    className="w-full text-left p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-400/50 text-xs flex items-center justify-between text-slate-300 hover:text-white"
                  >
                    <span className="font-mono text-amber-300 font-semibold">ASH-CAM-008-A</span>
                    <span className="text-[10px] text-slate-400">Arriflex 35mm (FL 2)</span>
                  </button>

                  {/* ALREADY RENTED UNIT TEST */}
                  <button
                    type="button"
                    onClick={() => handleScanSubmit('ASH-THR-001-C')}
                    className="w-full text-left p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 hover:border-rose-500/60 text-xs flex items-center justify-between text-rose-300"
                  >
                    <span className="font-mono text-rose-300 font-semibold">ASH-THR-001-C</span>
                    <span className="text-[10px] text-rose-400">⚠️ Test Already Rented</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PICKLIST (RIGHT COLUMN 2 COLS) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Optimized Warehouse Walking Path (Sorted by Floor &amp; Rack)
              </span>
              <span className="text-xs text-slate-400">{orderItems.length} Line Items</span>
            </div>

            {orderItems.map((item, idx) => {
              const isPicked = item.status === 'picked';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isPicked
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-[#0e1017] border-slate-800 hover:border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isPicked
                          ? 'bg-emerald-500 text-black'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          FLOOR {item.floor} • {item.rack}
                        </span>
                        <span className="text-xs text-slate-400">{item.prop_category}</span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1">{item.prop_title}</h4>

                      {isPicked ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Verified Serial: <strong className="font-mono">{item.item_serial}</strong> • Picked by{' '}
                            {item.picked_by_name || 'Floor Executive'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-1">
                          Walk to Floor {item.floor}, locate {item.rack}, and scan unit label.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        isPicked
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border-amber-800'
                      }`}
                    >
                      {isPicked ? 'PICKED' : 'PENDING'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
