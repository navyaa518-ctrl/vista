'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  X,
  User,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { PropHealthHistoryEntry } from '@/types/audits';
import { inspectionService } from '@/lib/services/inspectionService';

interface PropAuditHistoryViewProps {
  propId: string;
  propTitle?: string;
  propName?: string;
  propSku?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PropAuditHistoryView({
  propId,
  propTitle,
  propName,
  propSku,
  isOpen,
  onClose,
}: PropAuditHistoryViewProps) {
  const displayTitle = propTitle || propName || (propSku ? `Prop SKU ${propSku}` : 'Property Health History');
  const [history, setHistory] = useState<PropHealthHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && propId) {
      loadHistory();
    }
  }, [isOpen, propId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const logs = await inspectionService.getPropHealthHistory(propId);
      setHistory(logs);
    } catch (e) {
      console.error('Failed to load prop audit history:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case 'PERFECT':
      case 'EXCELLENT':
      case 'GOOD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MINOR_DAMAGE':
      case 'MINOR_WEAR':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MAJOR_DAMAGE':
      case 'DAMAGED_NEEDS_REPAIR':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MISSING':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Property Health &amp; Inspection History
              </h3>
              <p className="text-[11px] text-slate-500">
                {displayTitle || 'Physical Prop Verification & Condition Ledger'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Chronological Timeline */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
              Loading audit history from Supabase...
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No Prior Inspections Recorded</p>
              <p className="text-[11px] max-w-sm mx-auto text-slate-400">
                This prop has not yet been audited. Inspections logged in active batches will automatically build its chronological history here.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {history.map((log) => {
                const dateVal = log.created_at || log.timestamp || log.inspected_at || new Date().toISOString();
                const logDate = new Date(dateVal);
                const displayCondition = (log.physical_condition || log.condition_status || log.status || log.condition || 'PERFECT').toString();
                const notesText = log.damage_notes || log.notes;
                const photos = log.photo_urls && log.photo_urls.length > 0 ? log.photo_urls : log.photo_url ? [log.photo_url] : [];

                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline bullet */}
                    <span className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-sky-500 border-2 border-white shadow-xs" />

                    <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors">
                      {/* Top Meta: Date & Health Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{logDate.toLocaleDateString('en-IN')}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {logDate.toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getHealthBadge(
                              displayCondition
                            )}`}
                          >
                            {displayCondition.replace(/_/g, ' ')}
                          </span>
                          {log.is_functional !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                log.is_functional
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.is_functional ? '⚡ Operational' : '⚠️ Defective'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Inspector & Rack Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <User className="w-3.5 h-3.5 text-sky-600" />
                          <span>Auditor: <strong className="text-slate-900">{log.inspected_by_name || 'Inspector'}</strong></span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{log.new_location || log.rack_location || log.rack_verified || 'Verified'}</span>
                          {log.is_misplaced && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                              MISPLACED
                            </span>
                          )}
                          {log.previous_location && log.new_location && log.previous_location !== log.new_location && (
                            <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 text-[9px] font-bold">
                              Relocated from {log.previous_location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {notesText && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                          {notesText}
                        </p>
                      )}

                      {/* Evidence Photos */}
                      {photos.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-2">
                          {photos.map((photoUrl, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => setEnlargedPhoto(photoUrl)}
                              className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-slate-200 hover:border-sky-400 text-xs text-slate-700 transition-all cursor-pointer shadow-2xs"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
                                <Image
                                  src={photoUrl}
                                  alt="Audit photo"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="text-left pr-2">
                                <span className="text-[11px] font-bold text-slate-900 block">
                                  Evidence Photo {photos.length > 1 ? `#${pIdx + 1}` : ''}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  <span>Enlarge</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Enlarged Photo Modal */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer animate-in fade-in"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
            <Image
              src={enlargedPhoto}
              alt="Audit evidence enlarged"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setEnlargedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
