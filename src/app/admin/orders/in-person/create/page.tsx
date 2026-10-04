'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Users,
  CheckCircle2,
  Film,
  Building,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { ordersService, STAFF_EXECUTIVES } from '@/lib/services/orders';
import { AssignedExecutive } from '@/types/orders';

export default function InPersonOrderCreatePage() {
  const router = useRouter();

  // Form Fields
  const [productionCompany, setProductionCompany] = useState('');
  const [movieProjectName, setMovieProjectName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [shootLocation, setShootLocation] = useState('');
  const [startDate, setStartDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [durationDays, setDurationDays] = useState(3);
  const [selectedExecIds, setSelectedExecIds] = useState<string[]>(['exec-001', 'exec-002']);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recalculate duration days
  useEffect(() => {
    if (startDate && returnDate) {
      const s = new Date(startDate);
      const r = new Date(returnDate);
      const diffTime = Math.max(0, r.getTime() - s.getTime());
      const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
      setDurationDays(days);
    }
  }, [startDate, returnDate]);

  const toggleExec = (id: string) => {
    setSelectedExecIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productionCompany.trim() || !movieProjectName.trim()) {
      alert('Please provide Production Company Name and Movie / Project Name');
      return;
    }

    if (selectedExecIds.length === 0) {
      alert('Please assign at least one active Rental Sales Executive for warehouse picking.');
      return;
    }

    setSubmitting(true);
    try {
      const assignedExecs: AssignedExecutive[] = STAFF_EXECUTIVES.filter((e) =>
        selectedExecIds.includes(e.id)
      ).map((e) => ({ ...e, active_picking: true }));

      const newOrder = await ordersService.createWalkInOrder({
        production_company_name: productionCompany,
        movie_project_name: movieProjectName,
        client_contact_number: contactNumber,
        client_email_address: emailAddress,
        shoot_location: shootLocation,
        estimated_start_date: startDate,
        estimated_return_date: returnDate,
        duration_days: durationDays,
        assigned_executives: assignedExecs,
        notes,
      });

      // Redirect immediately to Counter Cart & Collaborative Review
      router.push(`/admin/orders/${newOrder.id}/billing-cart`);
    } catch (err) {
      console.error('Failed to create order:', err);
      alert('Failed to initialize in-person order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-900 max-w-4xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/orders/walk-in"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Walk-in Orders Queue
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
          <Radio className="w-3 h-3 text-amber-600 animate-pulse" />
          Live Picking Cart
        </span>
      </div>

      {/* Header Title */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
            Step 1: Front Desk Intake
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          New In-Person Walk-in Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
          Register the client and assign warehouse sales executives. The order enters <strong className="text-amber-700">PICKING_IN_PROGRESS</strong>, allowing executives to scan physical props directly into this collaborative live cart.
        </p>
      </div>

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Production & Project Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
            <Building className="w-4 h-4 text-amber-600" />
            <span>Production &amp; Client Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Production Company Name <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                value={productionCompany}
                onChange={(e) => setProductionCompany(e.target.value)}
                placeholder="e.g. Mythri Movie Makers"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Movie / Project Name <span className="text-amber-600">*</span>
              </label>
              <input
                type="text"
                required
                value={movieProjectName}
                onChange={(e) => setMovieProjectName(e.target.value)}
                placeholder="e.g. Pushpa 2: The Rule - VFX Team"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client Contact Number <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91 98490 12345"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address <span className="text-amber-600">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="production@mythriofficial.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shoot Location (Studio or Outdoor Address) <span className="text-amber-600">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={shootLocation}
              onChange={(e) => setShootLocation(e.target.value)}
              placeholder="e.g. Ramoji Film City, Floor 7 Cyber Set, Hyderabad"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none shadow-2xs"
            />
          </div>
        </div>

        {/* Card 2: Rental Duration */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
            <Calendar className="w-4 h-4 text-amber-600" />
            <span>Rental Schedule &amp; Estimated Duration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Start Date <span className="text-amber-600">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Return Date <span className="text-amber-600">*</span>
              </label>
              <input
                type="date"
                required
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Shoot Days
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-sm font-bold text-amber-700 font-mono">
                <span>{durationDays} Days Duration</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Assign Rental Sales Executives */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Users className="w-4 h-4 text-sky-600" />
              <span>Assign Sales Executive(s) for Collaborative Picking</span>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {selectedExecIds.length} Assigned
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Multiple executives can scan props concurrently in warehouse bays. Props automatically stream into the live counter cart with the scanning executive&apos;s badge.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAFF_EXECUTIVES.map((exec) => {
              const isSelected = selectedExecIds.includes(exec.id);
              return (
                <div
                  key={exec.id}
                  onClick={() => toggleExec(exec.id)}
                  className={`cursor-pointer p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-300 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{exec.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Floor {exec.floor} • {exec.phone}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono border border-slate-200">
                    Floor {exec.floor}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submission Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/80">
          <p className="text-xs text-slate-500">
            Vehicle number and transport logistics will be recorded at final dispatch.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/admin/orders/walk-in"
              className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-sm transition-all"
            >
              {submitting ? 'Initializing Order...' : 'Start Collaborative Live Cart'}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
