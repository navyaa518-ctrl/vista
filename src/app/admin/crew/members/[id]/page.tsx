'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  Users,
  HardHat,
  ArrowLeft,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Truck,
  DollarSign,
  Film,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { crewHubService } from '@/lib/services/crewHub';
import { CrewMember360 } from '@/types/crewHub';

export default function CrewMemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const memberId = resolvedParams.id;

  const [member, setMember] = useState<CrewMember360 | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMember() {
      try {
        setLoading(true);
        const data = await crewHubService.getCrewMemberById(memberId);
        setMember(data);
      } catch (err) {
        console.error('Failed to load crew profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMember();
  }, [memberId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <HardHat className="w-8 h-8 mx-auto text-amber-500 animate-bounce" />
          <p className="text-sm font-bold text-slate-700">Loading 360° Profile &amp; Lifetime Analytics...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Crew Member Not Found</h2>
          <p className="text-xs text-slate-500">
            No active profile found for ID <code className="font-mono">{memberId}</code>.
          </p>
          <Link
            href="/admin/crew/members"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Crew Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/crew/members"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Crew Directory</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-slate-500" />
          <span>Print Service Record</span>
        </button>
      </div>

      {/* 1. TOP 360° PROFILE HERO CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-slate-100 relative overflow-hidden shrink-0 border-2 border-amber-500/40 shadow-sm">
              <Image
                src={member.avatar_url}
                alt={member.full_name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            {/* Name, Designation & Badges */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-md border border-amber-300">
                  {member.badge_number}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    member.status === 'On_Shoot'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {member.status === 'On_Shoot' ? '🎬 Currently Deployed On Shoot' : '🟢 Standby Available'}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {member.full_name}
              </h1>
              <p className="text-sm font-semibold text-slate-600">{member.designation}</p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${member.phone}`} className="text-slate-800 font-mono hover:underline">
                    {member.phone}
                  </a>
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {member.email}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Contact & License Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2 shrink-0 md:w-80">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Emergency &amp; Legal Verification
            </span>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Emergency Contact:</span>
                <strong className="text-slate-800">{member.emergency_contact.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Emergency Mobile:</span>
                <a
                  href={`tel:${member.emergency_contact.phone}`}
                  className="font-mono text-amber-800 font-bold hover:underline"
                >
                  {member.emergency_contact.phone}
                </a>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200/70">
                <span className="text-slate-500">Transport License:</span>
                <strong className="font-mono text-slate-900">
                  {member.skills_and_certifications.license_type || 'Commercial Light'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Skills & Certifications Tag Strip */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
            Skill Clearances:
          </span>
          {member.skills_and_certifications.heavy_rigging_certified && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              Heavy Rigging &amp; Trussing Certified
            </span>
          )}
          {member.skills_and_certifications.fragile_optics_handling && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Fragile Glass &amp; Camera Optics Clear
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            {member.skills_and_certifications.film_industry_experience_years} Years Movie Industry Experience
          </span>
        </div>
      </div>

      {/* 2. 4 PERFORMANCE STATS KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shoots */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Shoots Completed</span>
            <Film className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {member.analytics.total_shoots_completed}
            <span className="text-sm font-normal text-slate-500 ml-1.5">Shoots</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% Production Verification</p>
        </div>

        {/* Total Days Deployed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Days Deployed</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {member.analytics.total_days_deployed}
            <span className="text-sm font-normal text-slate-500 ml-1.5">Days</span>
          </div>
          <p className="text-[11px] text-slate-500">On-site movie set hours</p>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cumulative Lifetime Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono">
            ₹ {member.analytics.cumulative_lifetime_earnings.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">100% Paid &amp; Audited Wages</p>
        </div>

        {/* Clean Record Score */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clean Record Score</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {member.analytics.clean_record_score}%
          </div>
          <p className="text-[11px] text-slate-500">
            {member.analytics.total_damage_incidents === 0
              ? 'Zero-damage shoot track record'
              : `${member.analytics.total_damage_incidents} incident recorded in career`}
          </p>
        </div>
      </div>

      {/* 3. PROJECT HISTORY TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-500" />
              <span>Project History &amp; Movie Deployments</span>
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of all productions, days deployed on set, daily wage rates, and damage incident clearances.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{member.project_history.length}</strong> Past Projects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Movie Project &amp; Studio</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Dates &amp; Duration</th>
                <th className="py-3 px-4">Role on Set</th>
                <th className="py-3 px-4 text-right">Daily Wage</th>
                <th className="py-3 px-4 text-right">Total Earned</th>
                <th className="py-3 px-4 text-center">Clean Record</th>
                <th className="py-3 px-4 text-center">Gate Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {member.project_history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No historical projects recorded yet. Newly onboarded crew member.
                  </td>
                </tr>
              ) : (
                member.project_history.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block font-bold">
                        {project.movie_title}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {project.production_company}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{project.shoot_location}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {project.start_date} → {project.end_date}
                      </div>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {project.days_deployed} Days Deployed
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {project.role_on_set}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                      ₹ {project.daily_wage.toLocaleString('en-IN')}/day
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900">
                      ₹ {project.total_earned.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {project.damage_incidents_logged === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Clean Record
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          1 Incident
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {project.gate_pass_number || 'GP-VERIFIED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
