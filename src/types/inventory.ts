export type ItemCondition =
  | 'Brand New'
  | 'Good'
  | 'Good / Normal Wear'
  | 'Minor Wear'
  | 'Maintenance Required'
  | 'Damaged / Needs Repair'
  | 'Critical / Scrap'
  | 'Missing';

export type ItemStatus = 'Available' | 'In Cart' | 'Dispatched / On Rent' | 'Damaged' | 'Lost';

export interface PropCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  prop_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface PropSKU {
  id: string;
  category_id: string;
  name: string;
  model_number?: string;
  brand?: string;
  description?: string;
  replacement_value: number;
  rental_rate_percent: number;
  calculated_rent_price: number;
  images: string[];
  godown_id?: string;
  floor_id?: string;
  rack_id?: string;
  row_id?: string;
  total_quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
  // Computed / Joined details
  category?: PropCategory;
  warehouse_location_name?: string;
  warehouse_code?: string;
  last_inspected_at?: string;
  last_inspected_by?: string;
  current_condition?: string;
  health_status?: string;
  items?: PropSerializedItem[];
}

export type PhysicalCondition =
  | 'EXCELLENT'
  | 'GOOD'
  | 'DAMAGED'
  | 'SCRAP'
  | 'MISSING'
  | ItemCondition
  | (string & {});

// Parent SKU/Catalog Model (prop_models / props)
export interface PropModel {
  id: string;
  name: string; // Model name, e.g., "Logitech Wireless Silent Mouse M331"
  category_id?: string;
  category?: string | PropCategory;
  model_number?: string;
  brand?: string;
  base_daily_rate?: number;
  calculated_rent_price?: number;
  replacement_value?: number;
  description?: string;
  images?: string[];
  total_quantity?: number;
  available_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

// Individual Physical Serialized Units (inventory_assets / properties)
export interface InventoryAsset {
  id: string; // UUID Primary Key
  item_code: string; // Unique Barcode/Serial, e.g., 'ASH-ELEC-MOU-0001'
  model_id?: string; // FK to prop_models
  prop_id?: string;  // FK to props
  physical_condition: PhysicalCondition;
  godown?: string; // 'Godown 1', 'Godown 2'
  floor?: string | number; // 'Ground Floor', 'Floor 1'
  rack?: string; // 'Rack A'
  shelf?: string; // 'Shelf 01'
  row_bay?: string;
  storage_location?: string; // Concatenated path
  warehouse_code?: string;
  warehouse_location_name?: string;
  last_audit_date?: string;
  last_inspected_by?: string;
  damage_notes?: string;
  notes?: string;
  rental_status?: string;
  status?: ItemStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PropSerializedItem {
  id: string;
  prop_id: string;
  model_id?: string;
  item_code: string;
  condition: ItemCondition;
  physical_condition?: PhysicalCondition;
  status: ItemStatus;
  rental_count: number;
  lifetime_earnings: number;
  qr_data: string;
  current_order_id?: string | null;
  godown?: string;
  floor?: number | string;
  rack?: string;
  shelf?: string;
  row_bay?: string;
  storage_location?: string;
  warehouse_code?: string;
  warehouse_location_name?: string;
  damage_notes?: string;
  last_audit_date?: string;
  last_inspected_by?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  // Joined Parent Prop
  prop?: PropSKU;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {
  id: string;
}

export interface CreatePropStockInput {
  name: string;
  model_number?: string;
  brand?: string;
  category_id: string;
  description?: string;
  replacement_value: number;
  rental_rate_percent?: number; // defaults to 20
  images?: string[];
  godown_id?: string;
  floor_id?: string;
  rack_id?: string;
  row_id?: string;
  quantity: number; // 1 to 100+
  initial_condition?: ItemCondition;
  notes?: string;
}

export interface SerializedItemRentalHistory {
  order_id: string;
  order_number: string;
  production_name: string;
  client_name: string;
  checkout_date: string;
  return_date: string;
  days_rented: number;
  revenue_amount: number;
  condition_after: ItemCondition;
  inspector_notes: string;
}
