import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Film,
  Building2,
  Truck,
  ScanLine,
  Receipt,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Search,
  ExternalLink,
  Crown,
  Tv,
  Sword,
  Camera,
  Car
} from 'lucide-react';

export default function HomePage() {
  const categories = [
    {
      title: 'Period Furniture',
      count: '42,000+ Items',
      desc: 'Royal Victorian thrones, Maharaja rosewood sofas, Art Deco bar carts',
      icon: <Crown className="w-6 h-6 text-amber-400" />,
      floor: 'Floor 1 • Racks A-B',
      img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Weaponry & Armory',
      count: '18,500+ Items',
      desc: 'Damascus broadswords, Spartan shields, Mughal ceremonial daggers',
      icon: <Sword className="w-6 h-6 text-amber-400" />,
      floor: 'Floor 1 • Rack C',
      img: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Vintage Vehicles',
      count: '1,200+ Runners',
      desc: '1954 Royal Enfield Bullet 350s, 1970s Ambassadors, Military Jeeps',
      icon: <Car className="w-6 h-6 text-amber-400" />,
      floor: 'Floor 1 • Bay D',
      img: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Electronics & Sci-Fi',
      count: '35,000+ Items',
      desc: 'Retro Trinitron CRT TVs, Cyberpunk HUD consoles, 1960s reel computers',
      icon: <Tv className="w-6 h-6 text-amber-400" />,
      floor: 'Floor 2 • Racks E-F',
      img: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    },
    {
      title: 'Studio Cameras & Optics',
      count: '8,400+ Units',
      desc: 'Arriflex 35mm cameras, Mole-Richardson fresnel spots, vintage tripods',
      icon: <Camera className="w-6 h-6 text-amber-400" />,
      floor: 'Floor 2 • Rack G',
      img: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const stats = [
    { value: '200,000+', label: 'Cataloged Movie Props', sub: 'Indexed with QR & Rack-ID' },
    { value: '50,000 sq.ft.', label: '2-Floor Climate Facility', sub: 'Floor 1 Heavy & Floor 2 Precision' },
    { value: '20% Rate', label: 'Transparent Daily Rental', sub: '20% of Replacement Value' },
    { value: '150+ Blockbusters', label: 'Feature Films & Web Series', sub: 'Tollywood, Bollywood & Pan-India' },
  ];

  const productions = [
    'Mythri Movie Makers',
    'Hombale Films',
    'Arka Media Works',
    'Dharma Productions',
    'Red Chillies Entertainment',
    'Geetha Arts',
    'Lyca Productions',
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden border-b border-amber-500/20 bg-gradient-to-b from-[#0e1017] via-[#08090d] to-[#08090d]">
        {/* Glow ambient background orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -top-10 left-10 w-72 h-72 bg-amber-600/5 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* Brand Crest Display */}
            <div className="flex justify-center mb-2 animate-fade-in">
              <div className="relative w-56 h-36 md:w-72 md:h-44 drop-shadow-[0_15px_35px_rgba(212,175,55,0.25)]">
                <Image
                  src="/assets/logo.png"
                  alt="ASHWA Movie Property Rentals"
                  fill
                  priority
                  sizes="(max-width: 768px) 224px, 288px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>South Asia’s Largest Dedicated Film Property Warehouse</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white font-serif">
              Where Cinema Legends Find Their{' '}
              <span className="gold-gradient-text">Authentic Props</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Managing over <strong className="text-amber-300 font-semibold">200,000+ verified film props</strong> across 
              2 specialized warehouse floors. Powered by unique item-level QR codes, real-time multi-executive picking, and live counter estimation billing.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/catalog"
                className="px-6 py-3.5 rounded-xl font-semibold text-black bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm"
              >
                <Layers className="w-4 h-4" />
                <span>Explore Props Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/warehouse/picking"
                className="px-6 py-3.5 rounded-xl font-semibold text-amber-200 bg-slate-900/80 border border-amber-500/30 hover:border-amber-400/60 hover:bg-slate-800/80 transition-all flex items-center gap-2 text-sm"
              >
                <ScanLine className="w-4 h-4 text-amber-400" />
                <span>Live Picking Scanner</span>
              </Link>

              <Link
                href="/billing"
                className="px-6 py-3.5 rounded-xl font-semibold text-slate-300 bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:text-white transition-all flex items-center gap-2 text-sm"
              >
                <Receipt className="w-4 h-4 text-slate-400" />
                <span>Billing &amp; Gate Pass</span>
              </Link>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-gradient-to-b from-[#11131a] to-[#0c0d12] border border-amber-500/20 shadow-lg text-center"
              >
                <div className="text-2xl sm:text-3xl font-bold gold-gradient-text font-serif">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-slate-200 mt-1">{stat.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. THE 2-FLOOR WAREHOUSE ARCHITECTURE */}
      <section className="py-20 bg-[#08090d] border-b border-amber-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <Building2 className="w-4 h-4" />
              <span>50,000 SQ.FT. ERGONOMIC FACILITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-serif">
              Engineered for Instant Cinema Dispatch
            </h2>
            <p className="text-slate-400 text-sm">
              Our 2-floor warehouse layout maps every single prop to its exact Floor, Rack, and Bay coordinates so rental sales executives can pick an entire movie schedule in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Floor 1 Card */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-[#12151f] to-[#0a0c12] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Ground Level
                  </span>
                  <h3 className="text-2xl font-bold text-white font-serif mt-2">
                    FLOOR 1: Heavy Sets, Furniture &amp; Armory
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Truck className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Direct ramp access for 16ft and 32ft film production lorries. Heavy lifting cranes, climate-stabilized teak storage, and secured armory room.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Racks A01 - B20</span>
                  <span className="text-xs text-slate-200">Period &amp; Royal Furniture</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Racks C01 - C15</span>
                  <span className="text-xs text-slate-200">Secured Prop Armory &amp; Swords</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Bays D01 - D10</span>
                  <span className="text-xs text-slate-200">Vintage Bikes, Cars &amp; Wagons</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Loading Dock</span>
                  <span className="text-xs text-slate-200">Dual Hydraulic Truck Ramp</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Executive In-Charge: <strong>Ravi Kumar</strong></span>
                <Link
                  href="/catalog?floor=1"
                  className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                >
                  View Floor 1 Props <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Floor 2 Card */}
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-[#12151f] to-[#0a0c12] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Level 2 • Climate Controlled
                  </span>
                  <h3 className="text-2xl font-bold text-white font-serif mt-2">
                    FLOOR 2: Electronics, Optics &amp; Curios
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Anti-static precision zone for working retro CRT monitors, cyberpunk props, period cameras, costume vaults, and insured royal jewelry replicas.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Racks E01 - F12</span>
                  <span className="text-xs text-slate-200">Sci-Fi &amp; Retro Electronics</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Racks G01 - G10</span>
                  <span className="text-xs text-slate-200">Studio 35mm Cameras &amp; Lights</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Racks H01 - H15</span>
                  <span className="text-xs text-slate-200">Vintage Telephones &amp; Curios</span>
                </div>
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[11px] text-amber-400 font-semibold block">Vault J01 - J08</span>
                  <span className="text-xs text-slate-200">Kundan Jewels &amp; Wardrobe</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                <span className="text-xs text-slate-400">Executive In-Charge: <strong>Vikram Singh</strong></span>
                <Link
                  href="/catalog?floor=2"
                  className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                >
                  View Floor 2 Props <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TRENDING CATEGORIES */}
      <section className="py-20 bg-[#0b0d14] border-b border-amber-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block mb-1">
                Explore The Collection
              </span>
              <h2 className="text-3xl font-bold text-white font-serif">
                Cinema Categories in High Demand
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1"
            >
              Browse All 200,000+ Props <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {categories.map((cat, idx) => (
              <Link
                key={idx}
                href={`/catalog?category=${encodeURIComponent(cat.title)}`}
                className="group relative rounded-xl overflow-hidden border border-amber-500/20 bg-slate-900/60 hover:border-amber-500/50 transition-all flex flex-col"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                  <Image
                    src={cat.img}
                    alt={cat.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d14] via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 p-2 rounded-lg bg-black/60 backdrop-blur-md border border-amber-500/30">
                    {cat.icon}
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cat.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-amber-400 font-semibold">{cat.count}</span>
                    <span className="text-slate-400">{cat.floor}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CLIENTS & PRODUCTION HOUSES */}
      <section className="py-16 bg-[#08090d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">
            Trusted by Top Cinema Studios &amp; Art Directors
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {productions.map((prod, idx) => (
              <div
                key={idx}
                className="px-5 py-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 text-xs font-medium text-slate-300 hover:text-amber-300 hover:border-amber-500/30 transition-all cursor-default"
              >
                🎬 {prod}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
