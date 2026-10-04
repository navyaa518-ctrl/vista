'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PropCategory, CreateCategoryInput, UpdateCategoryInput } from '@/types/inventory';
import { inventoryService } from '@/lib/services/inventory';
import { CategoryManagementModal } from '@/components/inventory/CategoryManagementModal';
import { Layers, Plus, Tag, Boxes, ArrowLeft, RefreshCw, FolderPlus } from 'lucide-react';
import Link from 'next/link';

export default function WarehouseCategoriesPage() {
  const [categories, setCategories] = useState<PropCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.getCategories();
      setCategories(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/inventory/props"
              className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Back to Inventory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Cinema Prop Classifications &amp; Categories
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 pl-8 sm:pl-0">
            Standard classification ontology for movie prop cataloging, warehouse sectoring, and client rental search.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadCategories}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manage &amp; Add Category</span>
          </button>
        </div>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200/80 animate-pulse h-44" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80 p-8 shadow-2xs">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Categories Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first movie prop category to classify warehouse stock.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/40 hover:shadow-md transition-all shadow-2xs space-y-3 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    /{cat.slug}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="font-semibold text-base text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {cat.description || 'Cinema property and equipment classification.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Boxes className="w-3.5 h-3.5 text-amber-500" />
                  <span>{cat.prop_count || 0} Prop SKUs</span>
                </span>

                <button
                  onClick={() => setModalOpen(true)}
                  className="text-amber-600 hover:text-amber-700 font-semibold hover:underline"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal with Light Theme */}
      <CategoryManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        onCreateCategory={async (input) => {
          await inventoryService.createCategory(input);
          await loadCategories();
        }}
        onUpdateCategory={async (input) => {
          await inventoryService.updateCategory(input);
          await loadCategories();
        }}
        onDeleteCategory={async (id) => {
          await inventoryService.deleteCategory(id);
          await loadCategories();
        }}
      />
    </div>
  );
}
