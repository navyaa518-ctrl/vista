'use client';

import React from 'react';
import Image from 'next/image';
import { DamageIncidentRecord } from '@/types/fieldCrew';
import { formatINR } from '@/lib/utils';
import { X, Printer, AlertTriangle, ShieldCheck, Camera, QrCode, FileText } from 'lucide-react';

interface DamageIncidentReceiptModalProps {
  incident: DamageIncidentRecord;
  onClose: () => void;
}

export function DamageIncidentReceiptModal({ incident, onClose }: DamageIncidentReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Total_Loss':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Minor':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl my-auto max-h-[95vh] flex flex-col">
        {/* Controls Bar (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 block">
                Official Incident Documentation &amp; Billing Debit Note
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Damage Penalty Receipt — {incident.incident_number}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl font-semibold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL RECEIPT */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-black rounded-xl border-2 border-black font-sans print:border-none print:p-0">
          {/* Company Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="relative w-44 h-24 sm:w-52 sm:h-28 shrink-0">
                <Image
                  src="/brand/aswa-logo.png"
                  alt="ASHWA Movie Props Rental Logo"
                  fill
                  sizes="(max-width: 640px) 176px, 208px"
                  className="object-contain object-left"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-serif tracking-wider text-black">
                  ASHWA MOVIE PROPERTY RENTALS
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-600">
                  Movie Property Rentals Private Limited • Studio Operations
                </p>
                <p className="text-[9px] text-neutral-500">
                  GSTIN: 36AAACA1122D1Z9 • CIN: U92490TG2020PTC148892
                </p>
                <p className="text-[9px] text-neutral-500">
                  Plot 42, Film City Logistics Corridor, Hyderabad 501512
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider block bg-rose-600 text-white px-2.5 py-1 rounded">
                DAMAGE INCIDENT RECEIPT
              </span>
              <div className="text-xs font-mono font-bold mt-1.5 text-neutral-900">
                TICKET: {incident.incident_number}
              </div>
              <div className="text-[11px] font-mono text-neutral-600">
                REF ORDER: {incident.order_number}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                Date: {new Date(incident.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </div>
            </div>
          </div>

          {/* Production & Incident Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-b border-neutral-300 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                Production House &amp; Movie Particulars:
              </span>
              <div className="font-bold text-sm text-neutral-900">{incident.movie_project_name}</div>
              <div className="text-neutral-700 font-semibold">{incident.client_name}</div>
              <div className="text-neutral-600 text-[11px] mt-1">
                Incident Location: <strong>{incident.shoot_location || 'Film Set / In Transit'}</strong>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">
                Reporting Field Operations Staff:
              </span>
              <div className="font-bold text-neutral-900">{incident.reported_by_name || 'Ramesh Babu'}</div>
              <div className="text-[11px] text-neutral-600">Designation: Field Prop Handling Crew</div>
              <div className="inline-block mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadgeColor(incident.severity)}`}>
                  Severity: {incident.severity.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Serialized Prop Details & QR Code Bar */}
          <div className="my-4 p-3.5 bg-neutral-50 rounded-lg border border-neutral-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Damaged Asset Particulars
                </span>
                <h4 className="text-base font-bold text-neutral-900">{incident.prop_title}</h4>
                <div className="text-xs text-neutral-600 flex flex-wrap items-center gap-2 font-mono">
                  <span className="bg-white px-2 py-0.5 rounded border border-neutral-300 font-bold text-neutral-900">
                    QR Serial: {incident.item_code}
                  </span>
                  <span>Certified Replacement Value: <strong>{formatINR(incident.replacement_value)}</strong></span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 bg-white p-2 rounded border border-neutral-300">
                <QrCode className="w-10 h-10 text-neutral-800" />
                <div className="text-[10px] font-mono leading-tight">
                  <span className="font-bold block">ASSET VERIFIED</span>
                  <span className="text-neutral-500">{incident.item_code}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Damage Description & Technical Log */}
          <div className="my-4 space-y-2 text-xs">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block">
              On-Site Incident Description &amp; Technical Notes:
            </span>
            <div className="p-3 bg-neutral-50 rounded border border-neutral-200 text-neutral-800 leading-relaxed font-mono text-[11px]">
              {incident.description}
            </div>
            {incident.manager_notes && (
              <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200 text-neutral-800 text-[11px]">
                <strong className="text-amber-900">Armory / Workshop Assessment: </strong>
                <span>{incident.manager_notes}</span>
              </div>
            )}
          </div>

          {/* High-Resolution Photographic Evidence Gallery */}
          {incident.evidence_photos && incident.evidence_photos.length > 0 && (
            <div className="my-4 space-y-2">
              <div className="flex items-center gap-1.5 text-neutral-700 text-xs font-bold">
                <Camera className="w-4 h-4 text-neutral-500" />
                <span>Photographic Evidence Attached ({incident.evidence_photos.length} Photos Captured on Set):</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incident.evidence_photos.map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className="relative h-36 rounded-lg overflow-hidden border-2 border-neutral-300 bg-neutral-100"
                  >
                    <Image
                      src={photoUrl}
                      alt={`Damage evidence photo ${idx + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/75 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                      Evidence #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Settlement & Penalty Debit Note */}
          <div className="my-6 border-t-2 border-black pt-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase text-neutral-800 block">
                  SUPPLEMENTARY BILLING DEBIT NOTE / REPAIR PENALTY
                </span>
                <p className="text-[10px] text-neutral-500">
                  Calculated according to certified replacement value &amp; master rental agreement liability clause.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Assessed Penalty Amount</span>
                <span className="text-2xl font-black font-mono text-neutral-900">
                  {formatINR(incident.repair_or_replacement_cost)}
                </span>
                <span className="text-[10px] text-neutral-600 block">
                  Status: <strong>{incident.status.replace(/_/g, ' ')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Legal Liability Disclaimer */}
          <div className="mt-4 pt-3 border-t border-neutral-300 text-[9px] text-neutral-600 space-y-1">
            <p>
              1. <strong>Liability Acceptance:</strong> As per Section 4 of the Ashwa Master Property Rental Agreement, the client production unit is 100% financially liable for all damages, cracks, and optical/structural losses incurred while props are on loan.
            </p>
            <p>
              2. <strong>Debit Note Adjustment:</strong> This assessment will be billed directly to the production company account or deducted from the refundable security deposit held under Order #{incident.order_number}.
            </p>
          </div>

          {/* Sign-off Signatures */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-neutral-300 text-xs mt-6">
            <div>
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">{incident.reported_by_name || 'Ramesh Babu'}</span>
              <span className="text-[10px] text-neutral-500">Reporting Field Crew Lead</span>
            </div>

            <div>
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">Production Manager / Client Unit</span>
              <span className="text-[10px] text-neutral-500">On-Site Seal &amp; Signature</span>
            </div>

            <div className="sm:text-right">
              <div className="h-10 border-b border-neutral-400" />
              <span className="font-bold block mt-1">For ASHWA Movie Property Rentals Ltd.</span>
              <span className="text-[10px] text-neutral-500">Authorized Financial Controller</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
