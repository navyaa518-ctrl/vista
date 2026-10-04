export interface WarehouseGodown {
  id: string;
  code: string;
  name: string;
  address?: string;
  notes?: string;
  total_area_sqft?: number;
  created_at: string;
  updated_at: string;
}

export interface WarehouseFloor {
  id: string;
  godown_id: string;
  floor_number: number;
  name: string;
  climate_zone?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseRack {
  id: string;
  floor_id: string;
  rack_code: string;
  name: string;
  max_capacity: number;
  dimensions?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseRow {
  id: string;
  rack_id: string;
  row_code: string;
  name: string;
  max_items: number;
  current_occupied_count: number;
  location_code: string;
  created_at: string;
  updated_at: string;
}

// Nested Hierarchy Types with Computed Aggregations
export interface RackWithChildren extends WarehouseRack {
  rows: WarehouseRow[];
  total_capacity: number;
  occupied_items: number;
  utilization_pct: number;
}

export interface FloorWithChildren extends WarehouseFloor {
  racks: RackWithChildren[];
  total_capacity: number;
  occupied_items: number;
  utilization_pct: number;
}

export interface GodownWithChildren extends WarehouseGodown {
  floors: FloorWithChildren[];
  total_racks: number;
  total_rows: number;
  total_capacity: number;
  occupied_items: number;
  utilization_pct: number;
}

export interface WarehouseCapacitySummary {
  total_godowns: number;
  total_floors: number;
  total_racks: number;
  total_rows: number;
  total_capacity: number;
  total_occupied: number;
  overall_utilization_pct: number;
}

// CRUD Input Types
export interface CreateGodownInput {
  code: string;
  name: string;
  address?: string;
  notes?: string;
  total_area_sqft?: number;
}

export interface UpdateGodownInput extends Partial<CreateGodownInput> {
  id: string;
}

export interface CreateFloorInput {
  godown_id: string;
  floor_number: number;
  name: string;
  climate_zone?: string;
}

export interface UpdateFloorInput extends Partial<CreateFloorInput> {
  id: string;
}

export interface CreateRackInput {
  floor_id: string;
  rack_code: string;
  name: string;
  max_capacity: number;
  dimensions?: string;
}

export interface UpdateRackInput extends Partial<CreateRackInput> {
  id: string;
}

export interface CreateRowInput {
  rack_id: string;
  row_code: string;
  name: string;
  max_items: number;
  current_occupied_count?: number;
  location_code?: string;
}

export interface UpdateRowInput extends Partial<CreateRowInput> {
  id: string;
}

export interface BulkRackGeneratorInput {
  godown_id: string;
  floor_id: string;
  rack_prefix: string; // e.g. "R"
  rack_start_num: number; // e.g. 1
  rack_count: number; // e.g. 5
  rows_per_rack: number; // e.g. 4
  items_per_row: number; // e.g. 40
  rack_name_pattern?: string; // e.g. "Rack {code} - Staging"
  dimensions?: string;
}

export type HierarchyViewMode = 'tree' | 'grid' | 'table';
