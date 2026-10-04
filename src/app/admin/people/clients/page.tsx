'use client';

import React from 'react';
import { Building, Film, Phone, Mail, Star } from 'lucide-react';

export default function ClientsPage() {
  const clients = [
    { studio: 'Mythri Movie Makers', contact: 'Simon Jones / Naveen Y.', phone: '+91 98200 44556', email: 'simonjones518@gmail.com', projects: 'Project Gangs of Bombay, Pushpa 2', rating: 'Tier 1 VIP Client' },
    { studio: 'Hombale Films', contact: 'Vijay Kiragandur Art Team', phone: '+91 98450 77889', email: 'art@hombale.in', projects: 'KGF Chapter 2, Kantara Legend', rating: 'Tier 1 VIP Client' },
    { studio: 'Arka Media Works', contact: 'Shobu Yarlagadda Production', phone: '+91 99880 11223', email: 'art@ssrajamouliproductions.com', projects: 'Baahubali Franchise, Garuda', rating: 'Tier 1 VIP Client' },
    { studio: 'Red Chillies Entertainment', contact: 'Sabu Cyril Art Department', phone: '+91 98201 99882', email: 'production@redchillies.com', projects: 'Jawan Cyber Set, Dunki', rating: 'Tier 1 VIP Client' },
    { studio: 'Geetha Arts', contact: 'Allu Aravind Productions', phone: '+91 94401 22334', email: 'props@geethaarts.com', projects: 'Magadheera Royal Sets', rating: 'Standard Client' },
  ];

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Client Profiles &amp; Film Production Houses
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered studios, art directors, production designers, and VIP movie production accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map((c, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-xs hover:shadow-md hover:border-amber-400/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                c.rating.includes('VIP')
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {c.rating}
              </span>
              <Building className="w-4 h-4 text-slate-400" />
            </div>

            <h3 className="text-base font-bold text-slate-900">{c.studio}</h3>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div>Primary Contact: <strong className="text-slate-900 font-semibold">{c.contact}</strong></div>
              <div className="flex items-center gap-2 text-slate-500">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>{c.phone}</span>
                <span>•</span>
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>{c.email}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-medium">
                Recent Projects: {c.projects}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
