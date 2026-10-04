import { supabase } from '@/lib/supabase/client';
import {
  WarehouseGodown,
  WarehouseFloor,
  WarehouseRack,
  WarehouseRow,
  GodownWithChildren,
  FloorWithChildren,
  RackWithChildren,
  WarehouseCapacitySummary,
  CreateGodownInput,
  UpdateGodownInput,
  CreateFloorInput,
  UpdateFloorInput,
  CreateRackInput,
  UpdateRackInput,
  CreateRowInput,
  UpdateRowInput,
  BulkRackGeneratorInput,
} from '@/types/warehouse';

const LOCAL_STORAGE_KEY = 'ashwa_warehouse_hierarchy_v1';

export function generateLocationCode(
  godownCode: string,
  floorNumber: number,
  rackCode: string,
  rowCode: string
): string {
  const g = godownCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const r = rackCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const s = rowCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return `${g}-F${floorNumber}-${r}-${s}`;
}

// Initial realistic default state (Hyderabad 50,000 sq.ft facility)
const INITIAL_GODOWNS: GodownWithChildren[] = [
  {
    id: 'g1-uuid-0000-0001',
    code: 'G1',
    name: 'Godown 1 - Main Yard & Heavy Sets',
    address: 'Plot 42, Film City Logistics Corridor, Sector A',
    notes: '14m ceiling clearance, 20-ton crane hoist, wide vehicular ramp for 40ft movie trailers',
    total_area_sqft: 28000,
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
    total_racks: 3,
    total_rows: 9,
    total_capacity: 370,
    occupied_items: 291,
    utilization_pct: 78.6,
    floors: [
      {
        id: 'f1-uuid-0000-0001',
        godown_id: 'g1-uuid-0000-0001',
        floor_number: 0,
        name: 'Ground Floor - Heavy Armory & Vehicles',
        climate_zone: 'Standard Dry Logistics (Ventilated)',
        created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
        total_capacity: 270,
        occupied_items: 227,
        utilization_pct: 84.1,
        racks: [
          {
            id: 'r1-uuid-0000-0001',
            floor_id: 'f1-uuid-0000-0001',
            rack_code: 'RA',
            name: 'Rack A - Royal Thrones & Period Furniture',
            max_capacity: 120,
            dimensions: '6m x 2m x 5m Heavy Duty Steel',
            created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
            updated_at: new Date().toISOString(),
            total_capacity: 120,
            occupied_items: 85,
            utilization_pct: 70.8,
            rows: [
              {
                id: 'row1-uuid-0000-0001',
                rack_id: 'r1-uuid-0000-0001',
                row_code: 'S01',
                name: 'Shelf 01 - Heavy Base Units',
                max_items: 40,
                current_occupied_count: 32,
                location_code: 'G1-F0-RA-S01',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row2-uuid-0000-0001',
                rack_id: 'r1-uuid-0000-0001',
                row_code: 'S02',
                name: 'Shelf 02 - Medium Teakwood Sets',
                max_items: 40,
                current_occupied_count: 35,
                location_code: 'G1-F0-RA-S02',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row3-uuid-0000-0001',
                rack_id: 'r1-uuid-0000-0001',
                row_code: 'S03',
                name: 'Shelf 03 - Small Gold Filigree Accents',
                max_items: 40,
                current_occupied_count: 18,
                location_code: 'G1-F0-RA-S03',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
          {
            id: 'r2-uuid-0000-0001',
            floor_id: 'f1-uuid-0000-0001',
            rack_code: 'RB',
            name: 'Rack B - Medieval Armory & Shields',
            max_capacity: 150,
            dimensions: '5m x 1.5m x 4.5m Steel Mesh',
            created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
            updated_at: new Date().toISOString(),
            total_capacity: 150,
            occupied_items: 142,
            utilization_pct: 94.7,
            rows: [
              {
                id: 'row4-uuid-0000-0001',
                rack_id: 'r2-uuid-0000-0001',
                row_code: 'S01',
                name: 'Shelf 01 - Chola & Rajput Bronze Armor',
                max_items: 50,
                current_occupied_count: 48,
                location_code: 'G1-F0-RB-S01',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row5-uuid-0000-0001',
                rack_id: 'r2-uuid-0000-0001',
                row_code: 'S02',
                name: 'Shelf 02 - Ceremonial Broadswords',
                max_items: 50,
                current_occupied_count: 46,
                location_code: 'G1-F0-RB-S02',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row6-uuid-0000-0001',
                rack_id: 'r2-uuid-0000-0001',
                row_code: 'S03',
                name: 'Shelf 03 - Iron Shields & Spearheads',
                max_items: 50,
                current_occupied_count: 48,
                location_code: 'G1-F0-RB-S03',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      {
        id: 'f2-uuid-0000-0001',
        godown_id: 'g1-uuid-0000-0001',
        floor_number: 1,
        name: 'Floor 1 - Teakwood Sets & Palace Durbars',
        climate_zone: 'Dehumidified Teak Storage (23°C / 50% RH)',
        created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
        total_capacity: 100,
        occupied_items: 64,
        utilization_pct: 64.0,
        racks: [
          {
            id: 'r3-uuid-0000-0001',
            floor_id: 'f2-uuid-0000-0001',
            rack_code: 'RC',
            name: 'Rack C - Antique Belgian Chandeliers',
            max_capacity: 100,
            dimensions: '5m x 2m x 4m Cushioned Cradle',
            created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
            updated_at: new Date().toISOString(),
            total_capacity: 100,
            occupied_items: 64,
            utilization_pct: 64.0,
            rows: [
              {
                id: 'row7-uuid-0000-0001',
                rack_id: 'r3-uuid-0000-0001',
                row_code: 'S01',
                name: 'Shelf 01 - Brass Belgian Chandeliers',
                max_items: 30,
                current_occupied_count: 24,
                location_code: 'G1-F1-RC-S01',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row8-uuid-0000-0001',
                rack_id: 'r3-uuid-0000-0001',
                row_code: 'S02',
                name: 'Shelf 02 - Crystal Hanging Lanterns',
                max_items: 35,
                current_occupied_count: 22,
                location_code: 'G1-F1-RC-S02',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row9-uuid-0000-0001',
                rack_id: 'r3-uuid-0000-0001',
                row_code: 'S03',
                name: 'Shelf 03 - Kerosene & Gas Stage Lamps',
                max_items: 35,
                current_occupied_count: 18,
                location_code: 'G1-F1-RC-S03',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'g2-uuid-0000-0002',
    code: 'G2',
    name: 'Godown 2 - Precision Tech & Optics',
    address: 'Plot 42, Film City Logistics Corridor, Sector B',
    notes: 'Multi-zone HVAC climate control (21°C / 45% RH), ESD anti-static flooring, vault doors',
    total_area_sqft: 22000,
    created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
    updated_at: new Date().toISOString(),
    total_racks: 2,
    total_rows: 6,
    total_capacity: 170,
    occupied_items: 100,
    utilization_pct: 58.8,
    floors: [
      {
        id: 'f3-uuid-0000-0002',
        godown_id: 'g2-uuid-0000-0002',
        floor_number: 0,
        name: 'Ground Floor - Studio Optics & Cameras',
        climate_zone: 'Clean Room Class 1000 (20°C / 40% RH)',
        created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
        total_capacity: 80,
        occupied_items: 50,
        utilization_pct: 62.5,
        racks: [
          {
            id: 'r4-uuid-0000-0002',
            floor_id: 'f3-uuid-0000-0002',
            rack_code: 'RD',
            name: 'Rack D - 35mm Vintage Cameras & Lenses',
            max_capacity: 80,
            dimensions: '4m x 1m x 3.5m Anodized Aluminum',
            created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
            updated_at: new Date().toISOString(),
            total_capacity: 80,
            occupied_items: 50,
            utilization_pct: 62.5,
            rows: [
              {
                id: 'row10-uuid-0000-0002',
                rack_id: 'r4-uuid-0000-0002',
                row_code: 'S01',
                name: 'Shelf 01 - Arriflex 35mm Bodies',
                max_items: 25,
                current_occupied_count: 18,
                location_code: 'G2-F0-RD-S01',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row11-uuid-0000-0002',
                rack_id: 'r4-uuid-0000-0002',
                row_code: 'S02',
                name: 'Shelf 02 - Mitchell BNC Anamorphic Glass',
                max_items: 25,
                current_occupied_count: 20,
                location_code: 'G2-F0-RD-S02',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row12-uuid-0000-0002',
                rack_id: 'r4-uuid-0000-0002',
                row_code: 'S03',
                name: 'Shelf 03 - Prime Lens Flight Cases',
                max_items: 30,
                current_occupied_count: 12,
                location_code: 'G2-F0-RD-S03',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ],
      },
      {
        id: 'f4-uuid-0000-0002',
        godown_id: 'g2-uuid-0000-0002',
        floor_number: 1,
        name: 'Floor 1 - Retro Electronics & CRT Monitors',
        climate_zone: 'ESD Protected Clean Space',
        created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
        updated_at: new Date().toISOString(),
        total_capacity: 90,
        occupied_items: 50,
        utilization_pct: 55.5,
        racks: [
          {
            id: 'r5-uuid-0000-0002',
            floor_id: 'f4-uuid-0000-0002',
            rack_code: 'RE',
            name: 'Rack E - Retro CRT Monitors & Sci-Fi Consoles',
            max_capacity: 90,
            dimensions: '4.5m x 1.2m x 4m Steel Frame',
            created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
            updated_at: new Date().toISOString(),
            total_capacity: 90,
            occupied_items: 50,
            utilization_pct: 55.5,
            rows: [
              {
                id: 'row13-uuid-0000-0002',
                rack_id: 'r5-uuid-0000-0002',
                row_code: 'S01',
                name: 'Shelf 01 - Working Sony Trinitron CRTs',
                max_items: 30,
                current_occupied_count: 26,
                location_code: 'G2-F1-RE-S01',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row14-uuid-0000-0002',
                rack_id: 'r5-uuid-0000-0002',
                row_code: 'S02',
                name: 'Shelf 02 - Reel-to-Reel Audio Consoles',
                max_items: 30,
                current_occupied_count: 14,
                location_code: 'G2-F1-RE-S02',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
              {
                id: 'row15-uuid-0000-0002',
                rack_id: 'r5-uuid-0000-0002',
                row_code: 'S03',
                name: 'Shelf 03 - Neon Control Panels',
                max_items: 30,
                current_occupied_count: 10,
                location_code: 'G2-F1-RE-S03',
                created_at: new Date('2026-01-15T09:00:00Z').toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        ],
      },
    ],
  },
];

// Helper to compute nested statistics
function computeHierarchyAggregations(godowns: GodownWithChildren[]): {
  godowns: GodownWithChildren[];
  summary: WarehouseCapacitySummary;
} {
  let totalGodowns = godowns.length;
  let totalFloors = 0;
  let totalRacks = 0;
  let totalRows = 0;
  let totalCapacity = 0;
  let totalOccupied = 0;

  const processedGodowns = godowns.map((g) => {
    let gRacks = 0;
    let gRows = 0;
    let gCapacity = 0;
    let gOccupied = 0;

    const processedFloors = (g.floors || []).map((f) => {
      let fCapacity = 0;
      let fOccupied = 0;

      const processedRacks = (f.racks || []).map((r) => {
        const rows = r.rows || [];
        const rOccupied = rows.reduce((sum, row) => sum + (row.current_occupied_count || 0), 0);
        const rCapacity = rows.length > 0 
          ? rows.reduce((sum, row) => sum + (row.max_items || 0), 0)
          : (r.max_capacity || 100);

        fCapacity += rCapacity;
        fOccupied += rOccupied;
        totalRows += rows.length;

        return {
          ...r,
          rows,
          total_capacity: rCapacity,
          occupied_items: rOccupied,
          utilization_pct: rCapacity > 0 ? Math.round((rOccupied / rCapacity) * 1000) / 10 : 0,
        };
      });

      gRacks += processedRacks.length;
      gCapacity += fCapacity;
      gOccupied += fOccupied;
      totalRacks += processedRacks.length;
      totalFloors += 1;

      return {
        ...f,
        racks: processedRacks,
        total_capacity: fCapacity,
        occupied_items: fOccupied,
        utilization_pct: fCapacity > 0 ? Math.round((fOccupied / fCapacity) * 1000) / 10 : 0,
      };
    });

    totalCapacity += gCapacity;
    totalOccupied += gOccupied;

    return {
      ...g,
      floors: processedFloors,
      total_racks: gRacks,
      total_rows: gRows,
      total_capacity: gCapacity,
      occupied_items: gOccupied,
      utilization_pct: gCapacity > 0 ? Math.round((gOccupied / gCapacity) * 1000) / 10 : 0,
    };
  });

  const summary: WarehouseCapacitySummary = {
    total_godowns: totalGodowns,
    total_floors: totalFloors,
    total_racks: totalRacks,
    total_rows: totalRows,
    total_capacity: totalCapacity,
    total_occupied: totalOccupied,
    overall_utilization_pct: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 : 0,
  };

  return { godowns: processedGodowns, summary };
}

// Local storage management
function getStoredHierarchy(): GodownWithChildren[] {
  if (typeof window === 'undefined') return INITIAL_GODOWNS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_GODOWNS));
      return INITIAL_GODOWNS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('LocalStorage read error:', err);
    return INITIAL_GODOWNS;
  }
}

function saveStoredHierarchy(data: GodownWithChildren[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

// Service Implementation
export const warehouseService = {
  // 1. Fetch entire hierarchy with aggregations
  async getWarehouseHierarchy(): Promise<{
    godowns: GodownWithChildren[];
    summary: WarehouseCapacitySummary;
  }> {
    try {
      // Attempt fetching from Supabase
      const { data, error } = await supabase
        .from('warehouse_godowns')
        .select(`
          *,
          floors:warehouse_floors(
            *,
            racks:warehouse_racks(
              *,
              rows:warehouse_rows(*)
            )
          )
        `)
        .order('code', { ascending: true });

      if (!error && data && data.length > 0) {
        return computeHierarchyAggregations(data as any);
      }
    } catch (err) {
      console.warn('Supabase query error, using local persistence:', err);
    }

    // Fallback to resilient local cache
    const stored = getStoredHierarchy();
    return computeHierarchyAggregations(stored);
  },

  // 2. Godown CRUD
  async createGodown(input: CreateGodownInput): Promise<WarehouseGodown> {
    const newGodown: GodownWithChildren = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
      address: input.address?.trim() || '',
      notes: input.notes?.trim() || '',
      total_area_sqft: input.total_area_sqft || 25000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      floors: [],
      total_racks: 0,
      total_rows: 0,
      total_capacity: 0,
      occupied_items: 0,
      utilization_pct: 0,
    };

    // Try Supabase insert
    try {
      await supabase.from('warehouse_godowns').insert({
        id: newGodown.id,
        code: newGodown.code,
        name: newGodown.name,
        address: newGodown.address,
        notes: newGodown.notes,
        total_area_sqft: newGodown.total_area_sqft,
      });
    } catch (e) {
      console.warn('Supabase insert warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = [...current, newGodown];
    saveStoredHierarchy(updated);
    return newGodown;
  },

  async updateGodown(input: UpdateGodownInput): Promise<void> {
    try {
      await supabase
        .from('warehouse_godowns')
        .update({
          code: input.code?.toUpperCase().trim(),
          name: input.name?.trim(),
          address: input.address?.trim(),
          notes: input.notes?.trim(),
          total_area_sqft: input.total_area_sqft,
        })
        .eq('id', input.id);
    } catch (e) {
      console.warn('Supabase update warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => {
      if (g.id !== input.id) return g;
      return {
        ...g,
        code: input.code ? input.code.toUpperCase().trim() : g.code,
        name: input.name ? input.name.trim() : g.name,
        address: input.address !== undefined ? input.address : g.address,
        notes: input.notes !== undefined ? input.notes : g.notes,
        total_area_sqft: input.total_area_sqft !== undefined ? input.total_area_sqft : g.total_area_sqft,
        updated_at: new Date().toISOString(),
      };
    });
    saveStoredHierarchy(updated);
  },

  async deleteGodown(id: string): Promise<void> {
    try {
      await supabase.from('warehouse_godowns').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase delete warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.filter((g) => g.id !== id);
    saveStoredHierarchy(updated);
  },

  // 3. Floor CRUD
  async createFloor(input: CreateFloorInput): Promise<WarehouseFloor> {
    const newFloor: FloorWithChildren = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `f-${Date.now()}`,
      godown_id: input.godown_id,
      floor_number: Number(input.floor_number),
      name: input.name.trim(),
      climate_zone: input.climate_zone?.trim() || 'Standard Dry Warehouse',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      racks: [],
      total_capacity: 0,
      occupied_items: 0,
      utilization_pct: 0,
    };

    try {
      await supabase.from('warehouse_floors').insert({
        id: newFloor.id,
        godown_id: newFloor.godown_id,
        floor_number: newFloor.floor_number,
        name: newFloor.name,
        climate_zone: newFloor.climate_zone,
      });
    } catch (e) {
      console.warn('Supabase floor insert warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => {
      if (g.id !== input.godown_id) return g;
      return {
        ...g,
        floors: [...(g.floors || []), newFloor],
      };
    });
    saveStoredHierarchy(updated);
    return newFloor;
  },

  async updateFloor(input: UpdateFloorInput): Promise<void> {
    try {
      await supabase
        .from('warehouse_floors')
        .update({
          name: input.name?.trim(),
          floor_number: input.floor_number,
          climate_zone: input.climate_zone?.trim(),
        })
        .eq('id', input.id);
    } catch (e) {
      console.warn('Supabase floor update warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => {
        if (f.id !== input.id) return f;
        return {
          ...f,
          name: input.name ? input.name.trim() : f.name,
          floor_number: input.floor_number !== undefined ? Number(input.floor_number) : f.floor_number,
          climate_zone: input.climate_zone !== undefined ? input.climate_zone : f.climate_zone,
          updated_at: new Date().toISOString(),
        };
      }),
    }));
    saveStoredHierarchy(updated);
  },

  async deleteFloor(floorId: string): Promise<void> {
    try {
      await supabase.from('warehouse_floors').delete().eq('id', floorId);
    } catch (e) {
      console.warn('Supabase floor delete warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).filter((f) => f.id !== floorId),
    }));
    saveStoredHierarchy(updated);
  },

  // 4. Rack CRUD
  async createRack(input: CreateRackInput): Promise<WarehouseRack> {
    const newRack: RackWithChildren = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}`,
      floor_id: input.floor_id,
      rack_code: input.rack_code.toUpperCase().trim(),
      name: input.name.trim(),
      max_capacity: Number(input.max_capacity) || 100,
      dimensions: input.dimensions?.trim() || '5m x 1.5m x 4m',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rows: [],
      total_capacity: Number(input.max_capacity) || 100,
      occupied_items: 0,
      utilization_pct: 0,
    };

    try {
      await supabase.from('warehouse_racks').insert({
        id: newRack.id,
        floor_id: newRack.floor_id,
        rack_code: newRack.rack_code,
        name: newRack.name,
        max_capacity: newRack.max_capacity,
        dimensions: newRack.dimensions,
      });
    } catch (e) {
      console.warn('Supabase rack insert warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => {
        if (f.id !== input.floor_id) return f;
        return {
          ...f,
          racks: [...(f.racks || []), newRack],
        };
      }),
    }));
    saveStoredHierarchy(updated);
    return newRack;
  },

  async updateRack(input: UpdateRackInput): Promise<void> {
    try {
      await supabase
        .from('warehouse_racks')
        .update({
          rack_code: input.rack_code?.toUpperCase().trim(),
          name: input.name?.trim(),
          max_capacity: input.max_capacity,
          dimensions: input.dimensions?.trim(),
        })
        .eq('id', input.id);
    } catch (e) {
      console.warn('Supabase rack update warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => ({
        ...f,
        racks: (f.racks || []).map((r) => {
          if (r.id !== input.id) return r;
          return {
            ...r,
            rack_code: input.rack_code ? input.rack_code.toUpperCase().trim() : r.rack_code,
            name: input.name ? input.name.trim() : r.name,
            max_capacity: input.max_capacity !== undefined ? Number(input.max_capacity) : r.max_capacity,
            dimensions: input.dimensions !== undefined ? input.dimensions : r.dimensions,
            updated_at: new Date().toISOString(),
          };
        }),
      })),
    }));
    saveStoredHierarchy(updated);
  },

  async deleteRack(rackId: string): Promise<void> {
    try {
      await supabase.from('warehouse_racks').delete().eq('id', rackId);
    } catch (e) {
      console.warn('Supabase rack delete warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => ({
        ...f,
        racks: (f.racks || []).filter((r) => r.id !== rackId),
      })),
    }));
    saveStoredHierarchy(updated);
  },

  // 5. Row / Shelf CRUD
  async createRow(
    input: CreateRowInput,
    context?: { godownCode?: string; floorNumber?: number; rackCode?: string }
  ): Promise<WarehouseRow> {
    const current = getStoredHierarchy();

    // Determine context if not passed
    let gCode = context?.godownCode || 'G1';
    let fNum = context?.floorNumber !== undefined ? context.floorNumber : 0;
    let rCode = context?.rackCode || 'R';

    if (!context) {
      for (const g of current) {
        for (const f of g.floors || []) {
          for (const r of f.racks || []) {
            if (r.id === input.rack_id) {
              gCode = g.code;
              fNum = f.floor_number;
              rCode = r.rack_code;
              break;
            }
          }
        }
      }
    }

    const rowCode = input.row_code.toUpperCase().trim();
    const locationCode = input.location_code || generateLocationCode(gCode, fNum, rCode, rowCode);

    const newRow: WarehouseRow = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `row-${Date.now()}`,
      rack_id: input.rack_id,
      row_code: rowCode,
      name: input.name.trim(),
      max_items: Number(input.max_items) || 40,
      current_occupied_count: Number(input.current_occupied_count) || 0,
      location_code: locationCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('warehouse_rows').insert(newRow);
    } catch (e) {
      console.warn('Supabase row insert warning:', e);
    }

    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => ({
        ...f,
        racks: (f.racks || []).map((r) => {
          if (r.id !== input.rack_id) return r;
          return {
            ...r,
            rows: [...(r.rows || []), newRow],
          };
        }),
      })),
    }));
    saveStoredHierarchy(updated);
    return newRow;
  },

  async updateRow(input: UpdateRowInput): Promise<void> {
    try {
      await supabase
        .from('warehouse_rows')
        .update({
          row_code: input.row_code?.toUpperCase().trim(),
          name: input.name?.trim(),
          max_items: input.max_items,
          current_occupied_count: input.current_occupied_count,
          location_code: input.location_code,
        })
        .eq('id', input.id);
    } catch (e) {
      console.warn('Supabase row update warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => ({
        ...f,
        racks: (f.racks || []).map((r) => ({
          ...r,
          rows: (r.rows || []).map((row) => {
            if (row.id !== input.id) return row;
            return {
              ...row,
              row_code: input.row_code ? input.row_code.toUpperCase().trim() : row.row_code,
              name: input.name ? input.name.trim() : row.name,
              max_items: input.max_items !== undefined ? Number(input.max_items) : row.max_items,
              current_occupied_count:
                input.current_occupied_count !== undefined
                  ? Number(input.current_occupied_count)
                  : row.current_occupied_count,
              location_code: input.location_code || row.location_code,
              updated_at: new Date().toISOString(),
            };
          }),
        })),
      })),
    }));
    saveStoredHierarchy(updated);
  },

  async deleteRow(rowId: string): Promise<void> {
    try {
      await supabase.from('warehouse_rows').delete().eq('id', rowId);
    } catch (e) {
      console.warn('Supabase row delete warning:', e);
    }

    const current = getStoredHierarchy();
    const updated = current.map((g) => ({
      ...g,
      floors: (g.floors || []).map((f) => ({
        ...f,
        racks: (f.racks || []).map((r) => ({
          ...r,
          rows: (r.rows || []).filter((row) => row.id !== rowId),
        })),
      })),
    }));
    saveStoredHierarchy(updated);
  },

  // 6. Bulk Rack & Row Generator
  async bulkCreateRacks(input: BulkRackGeneratorInput): Promise<number> {
    const current = getStoredHierarchy();
    let godown = current.find((g) => g.id === input.godown_id);
    let floor = godown?.floors.find((f) => f.id === input.floor_id);

    if (!godown || !floor) {
      throw new Error('Selected Godown or Floor not found');
    }

    const gCode = godown.code;
    const fNum = floor.floor_number;
    const prefix = input.rack_prefix.toUpperCase().trim() || 'R';
    const startNum = Number(input.rack_start_num) || 1;
    const count = Number(input.rack_count) || 5;
    const rowsPerRack = Number(input.rows_per_rack) || 4;
    const itemsPerRow = Number(input.items_per_row) || 40;
    const dimensions = input.dimensions?.trim() || '5m x 1.5m x 4m Heavy Duty';

    const newRacks: RackWithChildren[] = [];

    for (let i = 0; i < count; i++) {
      const rackNum = startNum + i;
      const rackCode = `${prefix}${rackNum < 10 ? '0' + rackNum : rackNum}`;
      const rackId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `r-${Date.now()}-${i}`;
      
      const rows: WarehouseRow[] = [];
      for (let j = 1; j <= rowsPerRack; j++) {
        const rowCode = `S0${j}`;
        const locationCode = generateLocationCode(gCode, fNum, rackCode, rowCode);
        rows.push({
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `row-${Date.now()}-${i}-${j}`,
          rack_id: rackId,
          row_code: rowCode,
          name: `Shelf 0${j} - Bay Tier`,
          max_items: itemsPerRow,
          current_occupied_count: 0,
          location_code: locationCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      newRacks.push({
        id: rackId,
        floor_id: input.floor_id,
        rack_code: rackCode,
        name: input.rack_name_pattern 
          ? input.rack_name_pattern.replace('{code}', rackCode)
          : `Rack ${rackCode} - Modular Storage`,
        max_capacity: rowsPerRack * itemsPerRow,
        dimensions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        rows,
        total_capacity: rowsPerRack * itemsPerRow,
        occupied_items: 0,
        utilization_pct: 0,
      });
    }

    // Try batch insertion to Supabase if available
    try {
      for (const r of newRacks) {
        await supabase.from('warehouse_racks').insert({
          id: r.id,
          floor_id: r.floor_id,
          rack_code: r.rack_code,
          name: r.name,
          max_capacity: r.max_capacity,
          dimensions: r.dimensions,
        });
        if (r.rows.length > 0) {
          await supabase.from('warehouse_rows').insert(r.rows);
        }
      }
    } catch (e) {
      console.warn('Supabase bulk insert warning:', e);
    }

    const updated = current.map((g) => {
      if (g.id !== input.godown_id) return g;
      return {
        ...g,
        floors: (g.floors || []).map((f) => {
          if (f.id !== input.floor_id) return f;
          return {
            ...f,
            racks: [...(f.racks || []), ...newRacks],
          };
        }),
      };
    });

    saveStoredHierarchy(updated);
    return newRacks.length;
  },

  // 7. Reset to default demo state
  resetToDefaults(): GodownWithChildren[] {
    saveStoredHierarchy(INITIAL_GODOWNS);
    return INITIAL_GODOWNS;
  },
};
