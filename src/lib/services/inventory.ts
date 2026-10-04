import { supabase } from '@/lib/supabase/client';
import {
  PropCategory,
  PropSKU,
  PropSerializedItem,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreatePropStockInput,
  ItemCondition,
  ItemStatus,
  SerializedItemRentalHistory,
} from '@/types/inventory';
import { warehouseService } from '@/lib/services/warehouse';

const STORAGE_KEY_CATEGORIES = 'ashwa_prop_categories_v1';
const STORAGE_KEY_PROPS = 'ashwa_prop_skus_v1';
const STORAGE_KEY_ITEMS = 'ashwa_prop_serialized_items_v1';

// Initial Categories Seed
const INITIAL_CATEGORIES: PropCategory[] = [
  {
    id: 'cat-001',
    name: 'Electronics & Tech',
    slug: 'electronics',
    icon: 'Tv',
    description: 'Vintage CRT monitors, studio broadcast gear, sci-fi cyberpunk consoles, computer peripherals',
    prop_count: 1,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
  },
  {
    id: 'cat-002',
    name: 'Period & Royal Furniture',
    slug: 'vintage-furniture',
    icon: 'Armchair',
    description: 'Burma teakwood thrones, palace durbar sets, Victorian chaises, Belgian chandeliers',
    prop_count: 1,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
  },
  {
    id: 'cat-003',
    name: 'Cinema Cameras & Optics',
    slug: 'optics',
    icon: 'Camera',
    description: '35mm vintage camera bodies, anamorphic lenses, director viewfinders, matte boxes',
    prop_count: 1,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
  },
  {
    id: 'cat-004',
    name: 'Medieval Armory & Weapons',
    slug: 'armory',
    icon: 'Shield',
    description: 'Bronze & iron breastplates, battle-worn broadswords, ceremonial shields, spears',
    prop_count: 1,
    created_at: new Date('2026-01-10T10:00:00Z').toISOString(),
  },
];

// Initial Props Seed
const INITIAL_PROPS: PropSKU[] = [
  {
    id: 'prop-001',
    category_id: 'cat-001',
    name: 'Logitech Wireless Silent Mouse M331',
    model_number: 'M331-SILENT',
    brand: 'Logitech',
    description: 'Ergonomic silent optical mouse for modern corporate office and cyber desk sequences.',
    replacement_value: 2000,
    rental_rate_percent: 20,
    calculated_rent_price: 400,
    images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80'],
    godown_id: 'g1-uuid-0000-0001',
    floor_id: 'f1-uuid-0000-0001',
    rack_id: 'r1-uuid-0000-0001',
    row_id: 'row1-uuid-0000-0001',
    total_quantity: 25,
    available_quantity: 22,
    warehouse_location_name: 'Godown 1 > Ground Floor > Rack A > Shelf 01',
    warehouse_code: 'G1-F0-RA-S01',
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prop-002',
    category_id: 'cat-002',
    name: 'Royal Victorian Teakwood Throne with Velvet Upholstery',
    model_number: 'THRONE-VIC-01',
    brand: 'Burma Teak Heritage',
    description: 'Handcrafted Burma teak throne with 24k gold leaf filigree and deep royal crimson velvet backrest.',
    replacement_value: 150000,
    rental_rate_percent: 20,
    calculated_rent_price: 30000,
    images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'],
    godown_id: 'g1-uuid-0000-0001',
    floor_id: 'f1-uuid-0000-0001',
    rack_id: 'r1-uuid-0000-0001',
    row_id: 'row2-uuid-0000-0001',
    total_quantity: 4,
    available_quantity: 3,
    warehouse_location_name: 'Godown 1 > Ground Floor > Rack A > Shelf 02',
    warehouse_code: 'G1-F0-RA-S02',
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prop-003',
    category_id: 'cat-003',
    name: 'Arriflex 35mm Studio Cinema Camera Body',
    model_number: 'ARRI-35-BL4',
    brand: 'ARRI',
    description: 'Vintage 35mm synchronized sound cinema camera body with PL lens mount and anamorphic optical viewfinder.',
    replacement_value: 450000,
    rental_rate_percent: 20,
    calculated_rent_price: 90000,
    images: ['https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80'],
    godown_id: 'g2-uuid-0000-0002',
    floor_id: 'f3-uuid-0000-0002',
    rack_id: 'r4-uuid-0000-0002',
    row_id: 'row10-uuid-0000-0002',
    total_quantity: 6,
    available_quantity: 5,
    warehouse_location_name: 'Godown 2 > Ground Floor > Rack D > Shelf 01',
    warehouse_code: 'G2-F0-RD-S01',
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prop-004',
    category_id: 'cat-004',
    name: 'Chola Dynasty Hand-Forged Bronze Ceremonial Broadsword',
    model_number: 'SWORD-CHOLA-02',
    brand: 'Thanjavur Armory Guild',
    description: 'Blunted carbon steel and bronze ceremonial broadsword with lion pommel and engraved Sanskrit inscriptions.',
    replacement_value: 25000,
    rental_rate_percent: 20,
    calculated_rent_price: 5000,
    images: ['https://images.unsplash.com/photo-1595590424283-b8f17842773f?auto=format&fit=crop&w=800&q=80'],
    godown_id: 'g1-uuid-0000-0001',
    floor_id: 'f1-uuid-0000-0001',
    rack_id: 'r2-uuid-0000-0001',
    row_id: 'row5-uuid-0000-0001',
    total_quantity: 15,
    available_quantity: 12,
    warehouse_location_name: 'Godown 1 > Ground Floor > Rack B > Shelf 02',
    warehouse_code: 'G1-F0-RB-S02',
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Generate Initial Serialized Items
function generateInitialItems(): PropSerializedItem[] {
  const items: PropSerializedItem[] = [];

  // 1. 25 M331 Mice
  for (let i = 1; i <= 25; i++) {
    const code = `ASH-ELEC-MOU-${String(i).padStart(4, '0')}`;
    const status: ItemStatus = i === 1 ? 'Dispatched / On Rent' : i === 2 ? 'In Cart' : i === 24 ? 'Minor Wear' as any : 'Available';
    items.push({
      id: `item-mouse-${i}`,
      prop_id: 'prop-001',
      item_code: code,
      condition: i % 7 === 0 ? 'Minor Wear' : 'Good',
      physical_condition: i % 7 === 0 ? 'Minor Wear' : 'Good',
      status: status === ('Minor Wear' as any) ? 'Available' : status,
      rental_count: i * 2,
      lifetime_earnings: i * 2 * 400,
      godown: 'Godown 1',
      floor: 'Floor 1',
      rack: 'Rack A',
      shelf: 'Shelf 01',
      storage_location: 'Godown 1 > Floor 1 > Rack A > Shelf 01',
      warehouse_code: 'G1-F0-RA-S01',
      warehouse_location_name: 'Godown 1 > Floor 1 > Rack A > Shelf 01',
      qr_data: JSON.stringify({ itemCode: code, propId: 'prop-001', model: 'M331-SILENT', loc: 'G1-F0-RA-S01' }),
      notes: i === 1 ? 'Checked out by Mythri Movie Makers' : 'Matte black finish, tested optical sensor',
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    });
  }

  // 2. 4 Victorian Thrones
  for (let i = 1; i <= 4; i++) {
    const code = `ASH-FURN-THR-${String(i).padStart(4, '0')}`;
    const status: ItemStatus = i === 1 ? 'Dispatched / On Rent' : 'Available';
    items.push({
      id: `item-throne-${i}`,
      prop_id: 'prop-002',
      item_code: code,
      condition: i === 4 ? 'Minor Wear' : 'Brand New',
      physical_condition: i === 4 ? 'Minor Wear' : 'Brand New',
      status,
      rental_count: i * 3,
      lifetime_earnings: i * 3 * 30000,
      godown: 'Godown 1',
      floor: 'Floor 1',
      rack: 'Rack A',
      shelf: 'Shelf 02',
      storage_location: 'Godown 1 > Floor 1 > Rack A > Shelf 02',
      warehouse_code: 'G1-F0-RA-S02',
      warehouse_location_name: 'Godown 1 > Floor 1 > Rack A > Shelf 02',
      qr_data: JSON.stringify({ itemCode: code, propId: 'prop-002', model: 'THRONE-VIC-01', loc: 'G1-F0-RA-S02' }),
      notes: 'Hero palace throne with 24k gold leaf filigree',
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    });
  }

  // 3. 6 Arriflex Cameras
  for (let i = 1; i <= 6; i++) {
    const code = `ASH-OPT-CAM-${String(i).padStart(4, '0')}`;
    const status: ItemStatus = i === 2 ? 'Dispatched / On Rent' : 'Available';
    items.push({
      id: `item-cam-${i}`,
      prop_id: 'prop-003',
      item_code: code,
      condition: 'Good',
      physical_condition: 'Good',
      status,
      rental_count: i * 4,
      lifetime_earnings: i * 4 * 90000,
      godown: 'Godown 2',
      floor: 'Floor 1',
      rack: 'Rack D',
      shelf: 'Shelf 01',
      storage_location: 'Godown 2 > Floor 1 > Rack D > Shelf 01',
      warehouse_code: 'G2-F0-RD-S01',
      warehouse_location_name: 'Godown 2 > Floor 1 > Rack D > Shelf 01',
      qr_data: JSON.stringify({ itemCode: code, propId: 'prop-003', model: 'ARRI-35-BL4', loc: 'G2-F0-RD-S01' }),
      notes: 'Flight case #42 included, calibrated flange depth',
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    });
  }

  // 4. 15 Chola Swords
  for (let i = 1; i <= 15; i++) {
    const code = `ASH-ARM-SWD-${String(i).padStart(4, '0')}`;
    const status: ItemStatus = i <= 3 ? 'Dispatched / On Rent' : 'Available';
    items.push({
      id: `item-sword-${i}`,
      prop_id: 'prop-004',
      item_code: code,
      condition: i % 4 === 0 ? 'Minor Wear' : 'Good',
      physical_condition: i % 4 === 0 ? 'Minor Wear' : 'Good',
      status,
      rental_count: i * 2,
      lifetime_earnings: i * 2 * 5000,
      godown: 'Godown 1',
      floor: 'Floor 1',
      rack: 'Rack B',
      shelf: 'Shelf 02',
      storage_location: 'Godown 1 > Floor 1 > Rack B > Shelf 02',
      warehouse_code: 'G1-F0-RB-S02',
      warehouse_location_name: 'Godown 1 > Floor 1 > Rack B > Shelf 02',
      qr_data: JSON.stringify({ itemCode: code, propId: 'prop-004', model: 'SWORD-CHOLA-02', loc: 'G1-F0-RB-S02' }),
      notes: 'Cinematic dull edge safe for actor hand combat',
      created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    });
  }

  return items;
}

// Local Storage Helpers
const memoryStore = new Map<string, string>();

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    const mem = memoryStore.get(key);
    if (!mem) {
      memoryStore.set(key, JSON.stringify(fallback));
      return fallback;
    }
    try {
      return JSON.parse(mem);
    } catch {
      return fallback;
    }
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T) {
  if (typeof window === 'undefined') {
    memoryStore.set(key, JSON.stringify(data));
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage set error:', e);
  }
}

export const inventoryService = {
  // 1. Categories
  async getCategories(): Promise<PropCategory[]> {
    try {
      const { data, error } = await supabase
        .from('prop_categories')
        .select('*')
        .order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }

    const categories = getStored<PropCategory[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
    const props = getStored<PropSKU[]>(STORAGE_KEY_PROPS, INITIAL_PROPS);

    return categories.map((c) => ({
      ...c,
      prop_count: props.filter((p) => p.category_id === c.id).length,
    }));
  },

  async createCategory(input: CreateCategoryInput): Promise<PropCategory> {
    const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: PropCategory = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}`,
      name: input.name.trim(),
      slug,
      icon: input.icon || 'Layers',
      description: input.description?.trim() || '',
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('prop_categories').insert(newCat);
    } catch (e) {
      console.warn('Supabase category insert warning:', e);
    }

    const current = getStored<PropCategory[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
    const updated = [...current, newCat];
    setStored(STORAGE_KEY_CATEGORIES, updated);
    return newCat;
  },

  async updateCategory(input: UpdateCategoryInput): Promise<void> {
    try {
      await supabase.from('prop_categories').update(input).eq('id', input.id);
    } catch (e) {
      console.warn('Supabase category update warning:', e);
    }

    const current = getStored<PropCategory[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
    const updated = current.map((c) => (c.id === input.id ? { ...c, ...input, updated_at: new Date().toISOString() } : c));
    setStored(STORAGE_KEY_CATEGORIES, updated);
  },

  async deleteCategory(id: string): Promise<void> {
    try {
      await supabase.from('prop_categories').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase category delete warning:', e);
    }

    const current = getStored<PropCategory[]>(STORAGE_KEY_CATEGORIES, INITIAL_CATEGORIES);
    const updated = current.filter((c) => c.id !== id);
    setStored(STORAGE_KEY_CATEGORIES, updated);
  },

  // 2. Prop SKUs & Nested Serialized Items
  async getProps(): Promise<PropSKU[]> {
    return this.getPropsWithSerializedItems();
  },

  async getPropsWithSerializedItems(): Promise<PropSKU[]> {
    const categories = await this.getCategories();
    const catMap = new Map(categories.map((c) => [c.id, c]));

    let props = getStored<PropSKU[]>(STORAGE_KEY_PROPS, INITIAL_PROPS);
    let items = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());

    // Merge live location from Supabase props table
    try {
      const { data: dbProps } = await supabase.from('props').select('id, slug, floor, rack, bin');
      if (dbProps && dbProps.length > 0) {
        const propMap = new Map(dbProps.map((p: any) => [p.id, p]));
        const slugMap = new Map(dbProps.map((p: any) => [p.slug?.toLowerCase(), p]));
        props = props.map((p) => {
          const match = propMap.get(p.id) || slugMap.get(p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
          if (!match) return p;
          const rackStr = match.rack || 'Rack A-01';
          const bayStr = match.bin || 'Shelf 01';
          return {
            ...p,
            warehouse_location_name: p.warehouse_location_name || `Floor ${match.floor || 1} > ${rackStr} > ${bayStr}`,
            warehouse_code: p.warehouse_code || `${rackStr}-${bayStr}`.replace(/\s+/g, ''),
          };
        });
      }
    } catch {}

    return props.map((p) => {
      const childItems = items.filter((i) => i.prop_id === p.id);
      const totalQty = childItems.length > 0 ? childItems.length : p.total_quantity;
      const availQty = childItems.filter((i) => i.status === 'Available').length;

      return {
        ...p,
        category: catMap.get(p.category_id),
        total_quantity: totalQty,
        available_quantity: availQty,
        items: childItems,
      };
    });
  },

  // 3. Flat Serialized Items Query with Filter Capabilities
  async getSerializedItems(filter?: {
    search?: string;
    categoryId?: string;
    status?: ItemStatus | 'All';
    condition?: ItemCondition | 'All';
  }): Promise<PropSerializedItem[]> {
    const props = await this.getPropsWithSerializedItems();
    const propMap = new Map(props.map((p) => [p.id, p]));

    let items = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());

    // Merge live condition & status from Supabase prop_items table
    try {
      const { data: dbItems } = await supabase.from('prop_items').select('id, prop_id, serial_number, condition, status, floor, rack, bin, notes');
      if (dbItems && dbItems.length > 0) {
        const dbItemMap = new Map(dbItems.map((d: any) => [d.serial_number?.toUpperCase(), d]));
        items = items.map((item) => {
          const match = dbItemMap.get(item.item_code.toUpperCase());
          if (!match) return item;

          let mappedCond: ItemCondition = item.condition;
          if (!item.condition || !item.updated_at) {
            const c = (match.condition || '').toUpperCase();
            if (c.includes('PERFECT') || c.includes('EXCELLENT') || c.includes('BRAND NEW') || c === 'PRISTINE') {
              mappedCond = 'Brand New';
            } else if (c.includes('GOOD') || c.includes('NORMAL WEAR') || c === 'GOOD') {
              mappedCond = 'Good / Normal Wear';
            } else if (c.includes('DAMAGED') || c.includes('REPAIR') || c === 'NEEDS_REPAIR') {
              mappedCond = 'Damaged / Needs Repair';
            } else if (c.includes('CRITICAL') || c.includes('SCRAP')) {
              mappedCond = 'Critical / Scrap';
            } else if (c.includes('MISSING') || c === 'LOST') {
              mappedCond = 'Missing';
            }
          }

          let mappedStat: ItemStatus = item.status;
          const s = (match.status || '').toLowerCase();
          if (s === 'maintenance' || s === 'damaged') mappedStat = 'Damaged';
          else if (s === 'lost') mappedStat = 'Lost';
          else if (s === 'available') mappedStat = 'Available';

          return {
            ...item,
            condition: mappedCond,
            status: mappedStat,
            notes: match.notes !== undefined ? match.notes : item.notes,
          };
        });
      }
    } catch {}

    // Join parent Prop details
    let combined = items.map((item) => ({
      ...item,
      prop: propMap.get(item.prop_id),
    }));

    if (!filter) return combined;

    const { search, categoryId, status, condition } = filter;

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      combined = combined.filter((i) => {
        const matchCode = i.item_code.toLowerCase().includes(q);
        const matchName = i.prop?.name.toLowerCase().includes(q) || false;
        const matchModel = i.prop?.model_number?.toLowerCase().includes(q) || false;
        const matchBrand = i.prop?.brand?.toLowerCase().includes(q) || false;
        const matchLoc = i.prop?.warehouse_code?.toLowerCase().includes(q) || false;
        return matchCode || matchName || matchModel || matchBrand || matchLoc;
      });
    }

    if (categoryId && categoryId !== 'All') {
      combined = combined.filter((i) => i.prop?.category_id === categoryId);
    }

    if (status && status !== 'All') {
      combined = combined.filter((i) => i.status === status);
    }

    if (condition && condition !== 'All') {
      combined = combined.filter((i) => i.condition === condition);
    }

    return combined;
  },

  // 4. Bulk Prop Stock & Serialized Item Creation
  async createPropWithSerializedItems(input: CreatePropStockInput): Promise<{ prop: PropSKU; itemsCount: number }> {
    const categories = await this.getCategories();
    const category = categories.find((c) => c.id === input.category_id);

    // Derive category code prefix (e.g. ELEC, FURN, CAM, ARM)
    const catCode = category
      ? category.slug.substring(0, 4).toUpperCase()
      : 'PROP';

    // Derive prop model / name prefix
    const nameTokens = input.name.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean);
    const propPrefix = (
      input.model_number?.replace(/[^A-Za-z0-9]/g, '').substring(0, 3) ||
      (nameTokens[0] ? nameTokens[0].substring(0, 3) : 'ITM')
    ).toUpperCase();

    // Resolve warehouse slot labels
    let warehouseLocationName = 'Warehouse Unassigned';
    let warehouseCode = 'UNASSIGNED';

    try {
      const { godowns } = await warehouseService.getWarehouseHierarchy();
      const g = godowns.find((item) => item.id === input.godown_id);
      const f = g?.floors.find((item) => item.id === input.floor_id);
      const r = f?.racks.find((item) => item.id === input.rack_id);
      const s = r?.rows.find((item) => item.id === input.row_id);

      if (g && f && r && s) {
        warehouseLocationName = `[${g.code}] ${g.name} > [F${f.floor_number}] ${f.name} > [${r.rack_code}] ${r.name} > [${s.row_code}] ${s.name}`;
        warehouseCode = s.location_code;
      }
    } catch {
      // Ignore
    }

    const replacementVal = Number(input.replacement_value) || 2000;
    const ratePercent = Number(input.rental_rate_percent) || 20;
    const rentPrice = Math.round(replacementVal * (ratePercent / 100));
    const qty = Math.max(1, Number(input.quantity) || 1);

    const propId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prop-${Date.now()}`;

    const newProp: PropSKU = {
      id: propId,
      category_id: input.category_id,
      name: input.name.trim(),
      model_number: input.model_number?.trim() || 'N/A',
      brand: input.brand?.trim() || 'ASHWA Props',
      description: input.description?.trim() || '',
      replacement_value: replacementVal,
      rental_rate_percent: ratePercent,
      calculated_rent_price: rentPrice,
      images: input.images && input.images.length > 0 ? input.images : ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'],
      godown_id: input.godown_id,
      floor_id: input.floor_id,
      rack_id: input.rack_id,
      row_id: input.row_id,
      total_quantity: qty,
      available_quantity: qty,
      warehouse_location_name: warehouseLocationName,
      warehouse_code: warehouseCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Generate N child serialized records
    const newItems: PropSerializedItem[] = [];
    const condition = input.initial_condition || 'Brand New';

    for (let i = 1; i <= qty; i++) {
      const itemCode = `ASH-${catCode}-${propPrefix}-${String(i).padStart(4, '0')}`;
      const itemId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${i}`;
      const qrPayload = JSON.stringify({
        itemCode,
        propId,
        model: newProp.model_number,
        brand: newProp.brand,
        loc: warehouseCode,
      });

      newItems.push({
        id: itemId,
        prop_id: propId,
        item_code: itemCode,
        condition,
        status: 'Available',
        rental_count: 0,
        lifetime_earnings: 0,
        qr_data: qrPayload,
        notes: input.notes?.trim() || 'Initial inventory provisioning',
        created_at: new Date().toISOString(),
      });
    }

    // Try inserting into Supabase
    try {
      await supabase.from('props').insert(newProp);
      for (const item of newItems) {
        await supabase.from('prop_serialized_items').insert(item);
      }
    } catch (e) {
      console.warn('Supabase prop creation warning:', e);
    }

    // Update local storage
    const currentProps = getStored<PropSKU[]>(STORAGE_KEY_PROPS, INITIAL_PROPS);
    setStored(STORAGE_KEY_PROPS, [newProp, ...currentProps]);

    const currentItems = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());
    setStored(STORAGE_KEY_ITEMS, [...newItems, ...currentItems]);

    return { prop: newProp, itemsCount: newItems.length };
  },

  // 5. Update Serialized Item Status / Condition
  async updateSerializedItemStatus(
    itemId: string,
    status: ItemStatus,
    condition?: ItemCondition,
    notes?: string
  ): Promise<void> {
    try {
      await supabase
        .from('prop_serialized_items')
        .update({ status, ...(condition ? { condition } : {}), ...(notes ? { notes } : {}) })
        .eq('id', itemId);
    } catch {
      // Ignore
    }

    const currentItems = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());
    const updated = currentItems.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        status,
        condition: condition || item.condition,
        notes: notes !== undefined ? notes : item.notes,
        updated_at: new Date().toISOString(),
      };
    });
    setStored(STORAGE_KEY_ITEMS, updated);
  },

  // 6. Rental History Timeline Mock for Inspector Drawer
  getRentalHistory(item: PropSerializedItem): SerializedItemRentalHistory[] {
    if (item.rental_count === 0) return [];

    const productions = [
      { name: 'Pushpa 2: The Rule', client: 'Mythri Movie Makers', days: 12 },
      { name: 'Kantara: Chapter 1', client: 'Hombale Films', days: 18 },
      { name: 'SSMB29 African Safari Set', client: 'Sri Durga Arts', days: 24 },
      { name: 'Devara: Part 1', client: 'Yuvasudha Arts', days: 8 },
      { name: 'Project K / Kalki 2898 AD', client: 'Vyjayanthi Movies', days: 15 },
    ];

    const count = Math.min(item.rental_count, productions.length);
    const dailyRate = item.prop?.calculated_rent_price || 400;

    return Array.from({ length: count }, (_, idx) => {
      const prod = productions[idx % productions.length];
      const rev = prod.days * dailyRate;
      return {
        order_id: `ord-${1000 + idx}`,
        order_number: `ORD-2026-${String(100 + idx)}`,
        production_name: prod.name,
        client_name: prod.client,
        checkout_date: `2026-0${Math.max(1, 8 - idx)}-${10 + idx}`,
        return_date: `2026-0${Math.max(1, 8 - idx)}-${10 + idx + prod.days}`,
        days_rented: prod.days,
        revenue_amount: rev,
        condition_after: 'Good',
        inspector_notes: 'Returned in pristine condition, barcode re-scanned at Floor 1 check-in bay.',
      };
    });
  },

  // 6b. Retrieve Rental Orders for Property Overview Modal
  async getPropRentalHistory(propId: string, fallbackItem?: PropSerializedItem): Promise<SerializedItemRentalHistory[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          order_id,
          rental_days,
          line_total,
          orders (
            id,
            order_number,
            production_name,
            client_name,
            rental_start_date,
            rental_end_date,
            status,
            notes
          )
        `)
        .eq('prop_id', propId)
        .order('id', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => {
          const ord = row.orders;
          return {
            order_id: row.order_id || row.id,
            order_number: ord?.order_number || `ORD-${(row.order_id || '').substring(0, 8)}`,
            production_name: ord?.production_name || 'Cinematic Production',
            client_name: ord?.client_name || 'Production House',
            checkout_date: ord?.rental_start_date || '2026-08-01',
            return_date: ord?.rental_end_date || '2026-08-15',
            days_rented: row.rental_days || 14,
            revenue_amount: row.line_total || 2400,
            condition_after: 'Good',
            inspector_notes: ord?.notes || 'Returned & inspected at dispatch bay.',
          };
        });
      }
    } catch (e) {
      console.warn('Supabase getPropRentalHistory note:', e);
    }

    if (fallbackItem) {
      return this.getRentalHistory(fallbackItem);
    }

    const currentItems = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());
    const matchedItem = currentItems.find((i) => i.prop_id === propId);
    if (matchedItem) {
      return this.getRentalHistory(matchedItem);
    }

    return [];
  },

  // 7. Delete Prop
  async deleteProp(propId: string): Promise<void> {
    try {
      await supabase.from('props').delete().eq('id', propId);
    } catch {
      // Ignore
    }

    const currentProps = getStored<PropSKU[]>(STORAGE_KEY_PROPS, INITIAL_PROPS);
    setStored(STORAGE_KEY_PROPS, currentProps.filter((p) => p.id !== propId));

    const currentItems = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());
    setStored(STORAGE_KEY_ITEMS, currentItems.filter((i) => i.prop_id !== propId));
  },

  // 8. Synchronize Prop Health & Location Update into Inventory Master Catalog
  updatePropFromAuditInspection(input: {
    propId: string;
    propSerializedItemId?: string;
    itemCode?: string;
    condition?: string;
    physicalCondition?: string;
    status?: string;
    isFunctional?: boolean;
    locationFullPath?: string;
    godown?: string;
    floor?: number | string;
    rack?: string;
    shelf?: string;
    bay?: string;
    locationCode?: string;
    auditorName?: string;
    auditedAt?: string;
    notes?: string;
  }): { success: boolean; message: string } {
    // 1. Update STORAGE_KEY_ITEMS
    const currentItems = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());
    const targetCode = input.itemCode?.toLowerCase();
    const targetItemId = input.propSerializedItemId;
    const targetPropId = input.propId;

    let mappedCondition: ItemCondition = 'Good / Normal Wear';
    const rawCond = (input.condition || input.physicalCondition || 'Good / Normal Wear').toString();
    const condUpper = rawCond.toUpperCase();
    if (condUpper.includes('EXCELLENT') || condUpper === 'PERFECT' || condUpper.includes('BRAND NEW')) {
      mappedCondition = 'Brand New';
    } else if (condUpper === 'GOOD' || (condUpper.includes('GOOD') && !condUpper.includes('MINOR')) || condUpper.includes('NORMAL WEAR')) {
      mappedCondition = 'Good / Normal Wear';
    } else if (condUpper.includes('MINOR') || condUpper.includes('DISTRESSED')) {
      mappedCondition = 'Minor Wear';
    } else if (condUpper.includes('DAMAGED') || condUpper.includes('REPAIR')) {
      mappedCondition = 'Damaged / Needs Repair';
    } else if (condUpper.includes('CRITICAL') || condUpper.includes('SCRAP')) {
      mappedCondition = 'Critical / Scrap';
    } else if (condUpper.includes('MISSING') || condUpper.includes('LOST')) {
      mappedCondition = 'Missing';
    }

    // CRITICAL: Separation of Concerns (physical_condition vs rental_status)
    // rental_status MUST strictly track inventory availability (Available, Dispatched / On Rent, In Cart, etc.)
    // It must NEVER be altered by the Health Inspection audit.
    // Preserve existing item.status untouched.
    // STRICT UNIQUE MATCH: Target strictly by unique asset identifier
    // If targetItemId is provided, match by item.id ONLY.
    // Else if targetCode is provided, match by item.item_code ONLY.
    // NEVER fall back to parent prop_id if a specific serialized unit was targeted!
    const updatedItems = currentItems.map((item) => {
      const match = targetItemId
        ? item.id === targetItemId
        : targetCode
        ? item.item_code.toLowerCase() === targetCode
        : false;

      if (!match) return item;

      const newGodown = input.godown || item.godown || 'Godown 1';
      const newFloor = input.floor !== undefined ? input.floor : (item.floor || 'Floor 1');
      const newRack = input.rack || item.rack || 'Rack A';
      const newShelf = input.shelf || item.shelf || 'Shelf 01';
      const newLocationPath = input.locationFullPath || (input.godown ? `${newGodown} > ${newFloor} > ${newRack} > ${newShelf}` : item.storage_location);
      const newLocationCode = input.locationCode || item.warehouse_code;

      return {
        ...item,
        condition: mappedCondition,
        physical_condition: input.physicalCondition || mappedCondition,
        status: item.status, // Strictly preserve rental availability!
        godown: newGodown,
        floor: newFloor,
        rack: newRack,
        shelf: newShelf,
        storage_location: newLocationPath,
        warehouse_code: newLocationCode,
        warehouse_location_name: newLocationPath,
        damage_notes: input.notes !== undefined ? input.notes : item.damage_notes,
        notes: input.notes !== undefined ? input.notes : item.notes,
        last_audit_date: input.auditedAt || new Date().toISOString(),
        last_inspected_by: input.auditorName || item.last_inspected_by,
        updated_at: new Date().toISOString(),
      };
    });
    setStored(STORAGE_KEY_ITEMS, updatedItems);

    // CRITICAL: DO NOT mutate the parent SKU model (STORAGE_KEY_PROPS) with an individual item's location or condition!
    // Parent SKU represents the catalog model. Sibling serialized units must retain their own independent locations and conditions.

    // 3. Dispatch global custom event for immediate React state update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('props-catalog-updated', {
          detail: {
            propId: input.propId,
            itemCode: input.itemCode,
            condition: mappedCondition,
            location: input.locationFullPath,
            locationCode: input.locationCode,
          },
        })
      );
    }

    return {
      success: true,
      message: 'Prop physical condition and warehouse location synchronized successfully',
    };
  },

  // 9. Retrieve Live Condition & Availability for an Asset
  getPropOrItemLiveCondition(propId: string, itemCode?: string): {
    condition: ItemCondition;
    status: ItemStatus;
    notes?: string;
  } | null {
    const currentItems = getStored<PropSerializedItem[]>(STORAGE_KEY_ITEMS, generateInitialItems());
    const targetCode = itemCode?.toLowerCase();
    const match = currentItems.find(
      (i) => (targetCode && i.item_code.toLowerCase() === targetCode) || i.prop_id === propId
    );
    if (match) {
      return {
        condition: match.condition,
        status: match.status,
        notes: match.notes,
      };
    }
    return null;
  },
};

/**
 * Converts raw warehouse codes or hierarchical location strings into clean human-readable text:
 * e.g., "G1-F0-RA-S01" -> "Godown 1 • Floor 1 • Rack A • Shelf 01"
 * e.g., "Godown 1 > Floor 2 > Rack B > Bay 3" -> "Godown 1 • Floor 2 • Rack B • Shelf 03"
 */
export function formatHumanLocation(locationName?: string, warehouseCode?: string): string {
  if (locationName && locationName.includes('>')) {
    return locationName
      .split('>')
      .map((s) => {
        const trimmed = s.trim();
        if (/^Bay\s*\d+/i.test(trimmed)) {
          const num = trimmed.replace(/\D/g, '').padStart(2, '0');
          return `Shelf ${num}`;
        }
        return trimmed;
      })
      .join(' • ');
  }

  if (locationName && locationName.includes('•')) {
    return locationName;
  }

  const code = warehouseCode || locationName || '';
  if (code.includes('-')) {
    const parts = code.split('-');
    const gNum = parts[0]?.replace(/\D/g, '') || '1';
    const fRaw = parts[1] || '';
    const fNum = fRaw.includes('0') ? '1' : fRaw.replace(/\D/g, '') || '1';
    const rRaw = parts[2]?.replace(/[^a-zA-Z0-9]/g, '') || 'A';
    const rClean = rRaw.replace(/^R/i, '') || 'A';
    const sRaw = parts[3]?.replace(/\D/g, '') || '01';
    const sPadded = sRaw.padStart(2, '0');
    return `Godown ${gNum} • Floor ${fNum} • Rack ${rClean} • Shelf ${sPadded}`;
  }

  return locationName || warehouseCode || 'Godown 1 • Floor 1 • Rack A • Shelf 01';
}
