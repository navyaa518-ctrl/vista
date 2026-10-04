'use client';

import React, { useState } from 'react';
import { PropCategory, CreateCategoryInput, UpdateCategoryInput } from '@/types/inventory';
import { X, Layers, Plus, Edit2, Trash2, Tag, FileText, Check, AlertCircle } from 'lucide-react';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: PropCategory[];
  onCreateCategory: (input: CreateCategoryInput) => Promise<void>;
  onUpdateCategory: (input: UpdateCategoryInput) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryManagementModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Layers');

  const [editingCategory, setEditingCategory] = useState<PropCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (cat: PropCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIcon(cat.icon || 'Layers');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIcon('Layers');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingCategory) {
        await onUpdateCategory({
          id: editingCategory.id,
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: description.trim(),
          icon,
        });
      } else {
        await onCreateCategory({
          name: name.trim(),
          slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: description.trim(),
          icon,
        });
      }
      handleCancelEdit();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 my-auto space-y-5 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Prop Category Management
              </h2>
              <p className="text-xs text-slate-500">
                Organize cinema inventory into classifications (Furniture, Electronics, Optics, Armory)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Create / Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-700 uppercase tracking-wider text-[10px]">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </span>
            {editingCategory && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[11px] text-slate-500 hover:text-slate-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingCategory) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }
                }}
                placeholder="e.g. Vintage Automobiles"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">URL Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="e.g. vintage-automobiles"
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1">Description / Notes</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Classic 1950s-1980s functional movie vehicles and chassis"
              className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              {editingCategory ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{loading ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}</span>
            </button>
          </div>
        </form>

        {/* Existing Categories Table */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Existing Prop Categories ({categories.length})
          </span>

          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white max-h-60 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {cat.slug}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      {cat.prop_count || 0} Prop Types
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"?`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
