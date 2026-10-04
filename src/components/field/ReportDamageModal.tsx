'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { WalkInOrderItem, WalkInOrder } from '@/types/orders';
import { DamageSeverity, CreateDamageIncidentInput, DamageIncidentRecord } from '@/types/fieldCrew';
import { fieldCrewService } from '@/lib/services/fieldCrew';
import { formatINR } from '@/lib/utils';
import {
  X,
  Camera,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Trash2,
  MapPin,
  Sparkles,
  QrCode,
  DollarSign,
} from 'lucide-react';

interface ReportDamageModalProps {
  order: WalkInOrder;
  items: WalkInOrderItem[];
  currentWorkerName?: string;
  currentWorkerId?: string;
  onClose: () => void;
  onSuccess: (incident: DamageIncidentRecord) => void;
}

export function ReportDamageModal({
  order,
  items,
  currentWorkerName = 'Ramesh Babu (Senior Field Crew)',
  currentWorkerId = 'fw-001',
  onClose,
  onSuccess,
}: ReportDamageModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [severity, setSeverity] = useState<DamageSeverity>('Moderate');
  const [description, setDescription] = useState('');
  const [shootLocation, setShootLocation] = useState(
    order.shoot_location ? `${order.shoot_location} - Set Sequence` : 'Ramoji Film City Set 4 - Rain Sequence'
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [customPenalty, setCustomPenalty] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const replacementVal = selectedItem?.replacement_value || 50000;

  // Compute standard penalty preview
  const defaultPenalty =
    severity === 'Minor'
      ? Math.round(replacementVal * 0.1)
      : severity === 'Moderate'
      ? Math.round(replacementVal * 0.3)
      : Math.round(replacementVal * 1.0);

  const effectivePenalty = customPenalty !== '' ? Number(customPenalty) : defaultPenalty;

  // Handle Photo Selection / Camera Capture
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await fieldCrewService.uploadDamagePhoto(file);
        uploaded.push(url);
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
    } catch (err) {
      console.error('Photo upload error:', err);
      alert('Failed to upload damage photo.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) {
      alert('Please select a serialized prop.');
      return;
    }

    if (!description.trim()) {
      alert('Please describe the damage and incident details.');
      return;
    }

    setSubmitting(true);
    try {
      const input: CreateDamageIncidentInput = {
        order_id: order.id,
        prop_serialized_item_id: selectedItem.prop_serialized_item_id || selectedItem.id,
        prop_title: selectedItem.prop_title,
        item_code: selectedItem.item_code,
        severity,
        description: description.trim(),
        evidence_photos: photoUrls.length > 0 ? photoUrls : [
          'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=800&auto=format&fit=crop&q=80',
        ],
        shoot_location: shootLocation,
        reported_by: currentWorkerId,
        reported_by_name: currentWorkerName,
        custom_penalty_amount: effectivePenalty,
      };

      const record = await fieldCrewService.reportDamageIncident(input);
      onSuccess(record);
    } catch (err) {
      console.error('Failed to submit damage incident:', err);
      alert('Could not submit damage ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                On-Site Field Operations Safety Desk
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Report Damaged / Broken Prop
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Order Info Reference */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Production &amp; Project</span>
              <strong className="text-slate-900 font-bold text-xs">{order.movie_project_name}</strong>
              <span className="text-slate-500 block text-[11px]">{order.client_name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Order Ref</span>
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {order.order_number}
              </span>
            </div>
          </div>

          {/* 1. Prop Item Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Select Serialized Prop Unit <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.prop_title} ({item.item_code}) — Repl. Val: ₹{item.replacement_value.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Item Preview Card */}
          {selectedItem && (
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0">
                  <QrCode className="w-5 h-5 text-amber-700" />
                </div>
                <div className="min-w-0">
                  <strong className="text-xs font-bold text-slate-900 truncate block">
                    {selectedItem.prop_title}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono">
                    SKU: {selectedItem.item_code} • Repl: {formatINR(selectedItem.replacement_value)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                Active Asset
              </span>
            </div>
          )}

          {/* 2. Severity Level Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Severity Level <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSeverity('Minor')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  severity === 'Minor'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">Minor Scratch</div>
                <div className="text-[10px] text-blue-700 font-mono mt-0.5">10% Penalty</div>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('Moderate')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  severity === 'Moderate'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">Repairable Damage</div>
                <div className="text-[10px] text-amber-700 font-mono mt-0.5">30% Penalty</div>
              </button>

              <button
                type="button"
                onClick={() => setSeverity('Total_Loss')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  severity === 'Total_Loss'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 font-bold shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">Total Loss / Broken</div>
                <div className="text-[10px] text-rose-700 font-mono mt-0.5">100% Replacement</div>
              </button>
            </div>
          </div>

          {/* 3. Incident Location */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Shoot / Incident Location
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={shootLocation}
                onChange={(e) => setShootLocation(e.target.value)}
                placeholder="e.g. Ramoji Film City Set 4 - Rain sequence"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>

          {/* 4. Damage Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Damage Description &amp; Technical Notes <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exact physical damage, crack location, looseness, or missing components..."
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 resize-none shadow-2xs"
            />
          </div>

          {/* 5. Photo Upload: Direct Camera Capture & Evidence */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>Damage Evidence Photos ({photoUrls.length} attached)</span>
              </label>
              <span className="text-[10px] text-slate-400">Stored in Supabase props-damage-evidence</span>
            </div>

            {/* Photo Previews */}
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                {photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative h-20 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <Image
                      src={url}
                      alt="Damage preview"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Open Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                <UploadCloud className="w-4 h-4 text-sky-600" />
                <span>Upload Files</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {uploadingPhotos && (
              <p className="text-[10px] text-amber-600 animate-pulse mt-1">Uploading evidence photos...</p>
            )}
          </div>

          {/* 6. Penalty Calculation & Debit Note Override */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Assessed Penalty / Repair Cost</span>
                <span className="text-[10px] text-slate-500">
                  Calculated against certified replacement value ({formatINR(replacementVal)})
                </span>
              </div>
              <span className="font-mono text-lg font-extrabold text-rose-700">
                {formatINR(effectivePenalty)}
              </span>
            </div>

            <div className="pt-1.5 border-t border-slate-200 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-600 shrink-0">Override Amount (₹):</span>
              <input
                type="number"
                placeholder={`Default: ₹${defaultPenalty}`}
                value={customPenalty}
                onChange={(e) => setCustomPenalty(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Automated Effects Note */}
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-900 space-y-0.5">
            <strong className="block font-bold">Automated Incident Actions:</strong>
            <p>• Updates prop status to &apos;Damaged&apos; / condition to &apos;Maintenance Required&apos;.</p>
            <p>• Generates printable PDF Damage Incident Receipt &amp; Billing Debit Note.</p>
            <p>• Alerts Super Admin and Billing Desk dashboards in real-time.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhotos}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{submitting ? 'Creating Ticket...' : 'Submit Incident & Generate Receipt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
