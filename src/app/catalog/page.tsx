'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Prop } from '@/types/database';
import { useRole } from '@/context/RoleContext';
import { PropDetailModal } from '@/components/catalog/PropDetailModal';
import { formatINR } from '@/lib/utils';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  CheckCircle2,
  Plus,
  Eye,
  Building2,
  Sparkles,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function CatalogPage() {
  const [propsList, setPropsList] = useState<Prop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProp, setSelectedProp] = useState<Prop | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEra, setSelectedEra] = useState<string>('All');
  const [selectedFloor, setSelectedFloor] = useState<string>('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [maxDailyRate, setMaxDailyRate] = useState<number>(100000);

  const { addToCart } = useRole();

  const categories = [
    'All',
    'Period Furniture',
    'Weaponry & Armory',
    'Vintage Vehicles',
    'Electronics & Sci-Fi',
    'Studio Cameras & Lights',
    'Hand Props & Curios'
  ];

  const eras = [
    'All',
    'Victorian / Royal',
    '1920s Art Deco',
    '1970s Retro',
    '1990s Cyber',
    'Modern Luxury',
    'Mythological & Antique'
  ];

  useEffect(() => {
    fetchProps();
  }, []);

  async function fetchProps() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('props')
        .select('*')
        .order('title', { ascending: true });

      if (error) {
        console.error('Error fetching props:', error);
      } else if (data) {
        setPropsList(data as Prop[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Filtered props computation
  const filteredProps = useMemo(() => {
    return propsList.filter((item) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesEra = item.era.toLowerCase().includes(q);
        const matchesRack = item.rack.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesEra && !matchesRack) return false;
      }

      // Category
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Era
      if (selectedEra !== 'All' && item.era !== selectedEra) {
        return false;
      }

      // Floor
      if (selectedFloor !== 'All' && item.floor.toString() !== selectedFloor) {
        return false;
      }

      // Only Available
      if (onlyAvailable && item.available_units <= 0) {
        return false;
      }

      // Price
      if (item.daily_rental_rate > maxDailyRate) {
        return false;
      }

      return true;
    });
  }, [propsList, searchQuery, selectedCategory, selectedEra, selectedFloor, onlyAvailable, maxDailyRate]);


  return (
    <div className="min-h-screen bg-[#08090d] text-slate-200 pb-24">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#121520] via-[#0e1017] to-[#121520] border-b border-amber-500/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                <Building2 className="w-4 h-4" />
                <span>200,000+ Warehouse Props Inventory</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">
                Explore Cinema Properties
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                All daily rates are calibrated at exactly 20% of certified replacement value.
              </p>
            </div>

            {/* Refresh / Results count */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-amber-500/20">
                Showing <strong className="text-amber-300">{filteredProps.length}</strong> props
              </span>
              <button
                onClick={fetchProps}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-white transition-colors"
                title="Reload Inventory"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT SIDEBAR: FILTERS */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#0e1017] border border-amber-500/20 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filter Catalog
                </span>
                {(selectedCategory !== 'All' || selectedEra !== 'All' || selectedFloor !== 'All' || onlyAvailable || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedEra('All');
                      setSelectedFloor('All');
                      setOnlyAvailable(false);
                      setSearchQuery('');
                      setMaxDailyRate(100000);
                    }}
                    className="text-[11px] text-amber-300/80 hover:text-amber-300 underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Search Box */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Search Keywords
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Throne, Arriflex, Damascus..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Warehouse Floor */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Warehouse Floor
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['All', '1', '2'].map((fl) => (
                    <button
                      key={fl}
                      onClick={() => setSelectedFloor(fl)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                        selectedFloor === fl
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fl === 'All' ? 'All Floors' : `Floor ${fl}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Category
                </label>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        selectedCategory === cat
                          ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Era / Vintage */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Period &amp; Era
                </label>
                <div className="space-y-1">
                  {eras.map((era) => (
                    <button
                      key={era}
                      onClick={() => setSelectedEra(era)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        selectedEra === era
                          ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      {era}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Rental Rate Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">Max Daily Rate</span>
                  <span className="text-amber-400 font-bold">{formatINR(maxDailyRate)}/day</span>
                </div>
                <input
                  type="range"
                  min={3000}
                  max={100000}
                  step={2000}
                  value={maxDailyRate}
                  onChange={(e) => setMaxDailyRate(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Only Available Toggle */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-amber-400 w-4 h-4"
                  />
                  <span>Show only immediately available props</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PROPS GRID */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                <p className="text-xs text-slate-400">Loading catalog from warehouse database...</p>
              </div>
            ) : filteredProps.length === 0 ? (
              <div className="p-12 rounded-2xl bg-[#0e1017] border border-slate-800 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-amber-400/50 mx-auto" />
                <h3 className="text-base font-bold text-white">No props match your criteria</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing some filters or searching for broader categories like furniture or cameras.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProps.map((prop) => (
                  <div
                    key={prop.id}
                    className="rounded-2xl bg-[#0f1118] border border-amber-500/20 hover:border-amber-500/50 transition-all flex flex-col overflow-hidden group shadow-lg"
                  >
                    {/* Image Box */}
                    <div className="relative h-56 w-full bg-black overflow-hidden">
                      <Image
                        src={prop.images[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80'}
                        alt={prop.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1118] via-transparent to-transparent opacity-80" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-amber-300 border border-amber-500/30">
                          {prop.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/70 backdrop-blur-md text-slate-300 border border-slate-700">
                          Floor {prop.floor}
                        </span>
                      </div>

                      {/* Quick View Button */}
                      <button
                        onClick={() => setSelectedProp(prop)}
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/80 hover:bg-amber-500 text-slate-200 hover:text-black border border-amber-500/30 transition-colors opacity-0 group-hover:opacity-100"
                        title="Quick View Specs"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Prop Details */}
                    <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>{prop.rack} ({prop.bin || 'Bay 1'})</span>
                        </div>
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                          {prop.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          {prop.description}
                        </p>
                      </div>

                      {/* Price & Availability */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Repl. Value:</span>
                          <span className="text-slate-300 font-medium">{formatINR(prop.replacement_value)}</span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-[10px] text-amber-400 uppercase font-semibold block leading-none">
                              Daily Rent (20%)
                            </span>
                            <span className="text-lg font-bold gold-gradient-text font-serif">
                              {formatINR(prop.daily_rental_rate)}
                            </span>
                            <span className="text-[10px] text-slate-400"> / day</span>
                          </div>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            prop.available_units > 0
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          }`}>
                            {prop.available_units > 0 ? `${prop.available_units} Avail.` : 'On Shoot'}
                          </span>
                        </div>

                        {/* Add to RFQ */}
                        <button
                          onClick={() => addToCart(prop)}
                          disabled={prop.available_units <= 0}
                          className={`w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            prop.available_units > 0
                              ? 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 hover:border-amber-500/60'
                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{prop.available_units > 0 ? 'Add to RFQ Cart' : 'Reserved on Shoot'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedProp && (
        <PropDetailModal prop={selectedProp} onClose={() => setSelectedProp(null)} />
      )}
    </div>
  );
}
