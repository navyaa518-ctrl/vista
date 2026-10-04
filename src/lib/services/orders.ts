import { supabase } from '@/lib/supabase/client';
import {
  WalkInOrder,
  WalkInOrderItem,
  AssignedExecutive,
  CreateWalkInOrderInput,
  PropRentalHistoryEntry,
  OrderLifecycleStatus,
  FinalInvoiceRecord,
  ReturnVerificationData,
  DeliveryChallanData,
} from '@/types/orders';
import { inventoryService } from '@/lib/services/inventory';
import { PropSerializedItem, PropSKU } from '@/types/inventory';
import {
  isOrderLocked,
  assertOrderNotLocked,
  canDispatchOrder,
  canEditOrderProps,
  OrderLockedError,
} from '@/lib/services/orderStateMachine';

const STORAGE_ORDERS_KEY = 'ashwa_walkin_orders_v1';
const STORAGE_ITEMS_KEY = 'ashwa_walkin_order_items_v1';
const STORAGE_HISTORY_KEY = 'ashwa_prop_rental_history_v1';
const STORAGE_DELETED_ORDERS_KEY = 'ashwa_deleted_order_ids_v1';
const STORAGE_FINAL_INVOICES_KEY = 'ashwa_final_invoices_registry_v1';

export const STAFF_EXECUTIVES: AssignedExecutive[] = [
  { id: 'exec-001', name: 'Ravi Kumar (Floor 1 Specialist)', floor: 1, phone: '+91 98480 22331', active_picking: true },
  { id: 'exec-002', name: 'Vikram Singh (Floor 2 Specialist)', floor: 2, phone: '+91 98480 33442', active_picking: true },
  { id: 'exec-003', name: 'Priya Sharma (Ground Yard & Armory)', floor: 1, phone: '+91 98480 44553', active_picking: false },
  { id: 'exec-004', name: 'Kiran Varma (Electronics & Optics)', floor: 2, phone: '+91 98480 55664', active_picking: false },
];

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

function setStored<T>(key: string, data: T): void {
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

// Initial Seed Orders
function getInitialOrders(): WalkInOrder[] {
  const today = new Date().toISOString().split('T')[0];
  const end4 = new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0];
  const end3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const end5 = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
  const dueIn2 = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
  const overdueYesterday = new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0];
  const pastReturned = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  const pastStarted8 = new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0];
  const pastStarted5 = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
  const pastStarted2 = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'c1000000-0000-0000-0000-000000000014',
      order_number: 'ASH-2026-ORD-014',
      client_name: 'Mythri Movie Makers',
      client_email: 'production@mythriofficial.com',
      client_phone: '+91 98490 12345',
      movie_project_name: 'Pushpa 2: The Rule - VFX Team',
      production_name: 'Pushpa 2: The Rule - VFX Team',
      shoot_location: 'Ramoji Film City, Floor 7 Cyber Set, Hyderabad',
      status: 'PICKING_IN_PROGRESS',
      rental_start_date: today,
      rental_end_date: end4,
      rental_days: 4,
      duration_days: 4,
      total_replacement_val: 152000,
      total_rent_amount: 121600,
      discount_percent: 0,
      discount_amount: 0,
      security_deposit: 45600,
      tax_amount: 21888,
      final_payable: 189088,
      advance_paid: true,
      advance_amount: 50000,
      balance_amount: 139088,
      payment_mode: 'UPI',
      assigned_executives: [
        { id: 'exec-001', name: 'Ravi Kumar (Floor 1 Specialist)', floor: 1, phone: '+91 98480 22331', active_picking: true },
        { id: 'exec-002', name: 'Vikram Singh (Floor 2 Specialist)', floor: 2, phone: '+91 98480 33442', active_picking: true },
      ],
      vehicle_number: undefined,
      gate_pass_number: undefined,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000038',
      order_number: 'ASH-2026-ORD-038',
      client_name: 'Vyjayanthi Movies',
      client_email: 'sets@vyjayanthimovies.in',
      client_phone: '+91 98490 88990',
      movie_project_name: 'Kalki 2898 AD - Part 2',
      production_name: 'Kalki 2898 AD - Part 2',
      shoot_location: 'Annapurna Studios, 7 Acres Complex, Hyderabad',
      status: 'PICKING_IN_PROGRESS',
      rental_start_date: today,
      rental_end_date: end3,
      rental_days: 3,
      duration_days: 3,
      total_replacement_val: 450000,
      total_rent_amount: 270000,
      discount_percent: 5,
      discount_amount: 13500,
      security_deposit: 135000,
      tax_amount: 46170,
      final_payable: 437670,
      advance_paid: false,
      advance_amount: 0,
      balance_amount: 437670,
      payment_mode: 'Bank Transfer',
      assigned_executives: [
        { id: 'exec-001', name: 'Ravi Kumar (Floor 1 Specialist)', floor: 1, phone: '+91 98480 22331', active_picking: true },
      ],
      vehicle_number: undefined,
      gate_pass_number: undefined,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000052',
      order_number: 'ASH-2026-ORD-052',
      client_name: 'Sri Durga Arts',
      client_email: 'production@sridurgaarts.com',
      client_phone: '+91 98490 33221',
      movie_project_name: 'SSMB29 - Globe Trotter Adventure',
      production_name: 'SSMB29 - Globe Trotter Adventure',
      shoot_location: 'Aluminium Factory Studio, Lingampally',
      status: 'Confirmed',
      rental_start_date: today,
      rental_end_date: end5,
      rental_days: 5,
      duration_days: 5,
      total_replacement_val: 320000,
      total_rent_amount: 192000,
      discount_percent: 10,
      discount_amount: 19200,
      security_deposit: 96000,
      tax_amount: 31104,
      final_payable: 299904,
      advance_paid: true,
      advance_amount: 150000,
      balance_amount: 149904,
      payment_mode: 'Bank Transfer',
      assigned_executives: [
        { id: 'exec-001', name: 'Ravi Kumar (Floor 1 Specialist)', floor: 1, phone: '+91 98480 22331', active_picking: false },
        { id: 'exec-003', name: 'Priya Sharma (Ground Yard & Armory)', floor: 1, phone: '+91 98480 44553', active_picking: false },
      ],
      vehicle_number: 'TS 08 UB 7714',
      gate_pass_number: undefined,
      created_at: new Date(Date.now() - 14400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000077',
      order_number: 'ASH-2026-ORD-077',
      client_name: 'Hombale Films',
      client_email: 'dispatch@hombale.com',
      client_phone: '+91 99880 77665',
      movie_project_name: 'Salaar: Part 2 - Shouryaanga Parvam',
      production_name: 'Salaar: Part 2 - Shouryaanga Parvam',
      shoot_location: 'Ramoji Film City, Coal Mine Set 3, Hyderabad',
      status: 'DISPATCHED_RENTAL_PIPELINE',
      rental_start_date: pastStarted2,
      rental_end_date: dueIn2,
      rental_days: 4,
      duration_days: 4,
      total_replacement_val: 680000,
      total_rent_amount: 408000,
      discount_percent: 0,
      discount_amount: 0,
      security_deposit: 204000,
      tax_amount: 73440,
      final_payable: 685440,
      advance_paid: true,
      advance_amount: 350000,
      balance_amount: 335440,
      payment_mode: 'Bank Transfer',
      assigned_executives: [
        { id: 'exec-002', name: 'Vikram Singh (Floor 2 Specialist)', floor: 2, phone: '+91 98480 33442', active_picking: false },
      ],
      vehicle_number: 'TS 09 UA 8842',
      driver_name: 'Mohan Babu (Senior Cargo Driver)',
      driver_phone: '+91 94400 55667',
      gate_pass_number: 'GP-2026-8842',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000088',
      order_number: 'ASH-2026-ORD-088',
      client_name: 'Yuvasudha Arts & NTR Arts',
      client_email: 'rentals@yuvasudha.in',
      client_phone: '+91 97000 44332',
      movie_project_name: 'Devara: Part 1 - Climax Unit',
      production_name: 'Devara: Part 1 - Climax Unit',
      shoot_location: 'Shamshabad Outdoor Water Tank Unit',
      status: 'DISPATCHED_RENTAL_PIPELINE',
      rental_start_date: pastStarted5,
      rental_end_date: overdueYesterday,
      rental_days: 4,
      duration_days: 4,
      total_replacement_val: 280000,
      total_rent_amount: 168000,
      discount_percent: 0,
      discount_amount: 0,
      security_deposit: 84000,
      tax_amount: 30240,
      final_payable: 282240,
      advance_paid: true,
      advance_amount: 282240,
      balance_amount: 0,
      payment_mode: 'UPI',
      assigned_executives: [
        { id: 'exec-001', name: 'Ravi Kumar (Floor 1 Specialist)', floor: 1, phone: '+91 98480 22331', active_picking: false },
      ],
      vehicle_number: 'AP 28 BC 1009',
      driver_name: 'Satyanarayana',
      driver_phone: '+91 98481 99002',
      gate_pass_number: 'GP-2026-1009',
      created_at: new Date(Date.now() - 432000000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'c1000000-0000-0000-0000-000000000099',
      order_number: 'ASH-2026-ORD-099',
      client_name: 'Sri Venkateswara Creations',
      client_email: 'svc@dilraju.com',
      client_phone: '+91 99000 11223',
      movie_project_name: 'Game Changer - Ram Charan',
      production_name: 'Game Changer - Ram Charan',
      shoot_location: 'RFC Central Jail Set',
      status: 'Returned',
      rental_start_date: pastStarted8,
      rental_end_date: pastReturned,
      rental_days: 6,
      duration_days: 6,
      total_replacement_val: 180000,
      total_rent_amount: 108000,
      discount_percent: 0,
      discount_amount: 0,
      security_deposit: 54000,
      tax_amount: 19440,
      final_payable: 181440,
      advance_paid: true,
      advance_amount: 181440,
      balance_amount: 0,
      payment_mode: 'Bank Transfer',
      assigned_executives: [
        { id: 'exec-003', name: 'Priya Sharma (Ground Yard & Armory)', floor: 1, phone: '+91 98480 44553', active_picking: false },
      ],
      vehicle_number: 'TS 07 EA 1204',
      driver_name: 'K. Mallesh',
      driver_phone: '+91 98482 33441',
      gate_pass_number: 'GP-2026-1204',
      notes: 'Returned & inspected by Priya Sharma. 100% props in Good condition.',
      created_at: new Date(Date.now() - 691200000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];
}

function getInitialOrderItems(): WalkInOrderItem[] {
  return [
    {
      id: 'd1000000-0000-0000-0000-000000000014',
      order_id: 'c1000000-0000-0000-0000-000000000014',
      prop_id: 'prop-001',
      prop_serialized_item_id: 'item-mouse-1',
      item_code: 'ASH-ELEC-MOU-0001',
      prop_title: 'Logitech Wireless Silent Mouse M331',
      prop_category: 'Electronics & Tech',
      model_number: 'M331-SILENT',
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      replacement_value: 2000,
      daily_rent_price: 400,
      rental_days: 4,
      line_total: 1600,
      quantity: 1,
      warehouse_location: 'Godown 1 > Ground Floor > Rack A > Shelf 01 (G1-F0-RA-S01)',
      added_by_executive_id: 'exec-001',
      added_by_executive_name: 'Ravi Kumar',
      scanned_by: 'exec-001',
      scanned_by_name: 'Ravi Kumar',
      scanned_at: new Date(Date.now() - 3000000).toISOString(),
      status: 'picked',
      notes: 'Checked by Ravi Kumar in Floor 1 bay',
    },
    {
      id: 'd1000000-0000-0000-0000-000000000015',
      order_id: 'c1000000-0000-0000-0000-000000000014',
      prop_id: 'prop-002',
      prop_serialized_item_id: 'item-throne-2',
      item_code: 'ASH-FURN-THR-0002',
      prop_title: 'Royal Victorian Teakwood Throne with Velvet Upholstery',
      prop_category: 'Period & Royal Furniture',
      model_number: 'THRONE-VIC-01',
      image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      replacement_value: 150000,
      daily_rent_price: 30000,
      rental_days: 4,
      line_total: 120000,
      quantity: 1,
      warehouse_location: 'Godown 1 > Ground Floor > Rack A > Shelf 02 (G1-F0-RA-S02)',
      added_by_executive_id: 'exec-002',
      added_by_executive_name: 'Vikram Singh',
      scanned_by: 'exec-002',
      scanned_by_name: 'Vikram Singh',
      scanned_at: new Date(Date.now() - 1500000).toISOString(),
      status: 'picked',
      notes: 'Palace set throne verified by Vikram Singh',
    },
    {
      id: 'd1000000-0000-0000-0000-000000000099',
      order_id: 'c1000000-0000-0000-0000-000000000038',
      prop_id: 'prop-003',
      prop_serialized_item_id: 'item-cam-2',
      item_code: 'ASH-OPT-CAM-0002',
      prop_title: 'Arriflex 35mm Studio Cinema Camera Body',
      prop_category: 'Cinema Cameras & Optics',
      model_number: 'ARRI-35-BL4',
      image_url: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=800&q=80',
      replacement_value: 450000,
      daily_rent_price: 90000,
      rental_days: 3,
      line_total: 270000,
      quantity: 1,
      warehouse_location: 'Godown 2 > Ground Floor > Rack D > Shelf 01 (G2-F0-RD-S01)',
      added_by_executive_id: 'exec-001',
      added_by_executive_name: 'Ravi Kumar',
      scanned_by: 'exec-001',
      scanned_by_name: 'Ravi Kumar',
      scanned_at: new Date(Date.now() - 3600000).toISOString(),
      status: 'picked',
      notes: 'Calibrated flange depth with Pelican case 42',
    },
  ];
}

// Broadcast channel helper for sub-millisecond tab-to-tab sync
function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel('ashwa_walkin_picking_stream');
    } catch {
      return null;
    }
  }
  return null;
}

export const ordersService = {
  // 1. Get All Orders
  async getOrders(): Promise<WalkInOrder[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map DB differences
        const dbOrders: WalkInOrder[] = data.map((o: any) => {
          const statusRaw = (o.status || 'PICKING_IN_PROGRESS').trim();
          const isClosedOrLocked = Boolean(
            o.is_archived_or_closed === true ||
            o.is_locked === true ||
            statusRaw.toUpperCase() === 'CLOSED' ||
            o.lifecycle_status === 'Verified_Closed'
          );

          let normalizedStatus: OrderLifecycleStatus = 'PICKING_IN_PROGRESS';
          if (isClosedOrLocked) {
            normalizedStatus = 'CLOSED';
          } else if (statusRaw.toLowerCase() === 'returned') {
            normalizedStatus = 'Returned';
          } else if (statusRaw === 'picking_in_progress' || statusRaw === 'Picking_In_Progress' || statusRaw === 'PICKING_IN_PROGRESS') {
            normalizedStatus = 'PICKING_IN_PROGRESS';
          } else if (statusRaw === 'dispatched' || statusRaw === 'Dispatched' || statusRaw === 'DISPATCHED_RENTAL_PIPELINE') {
            normalizedStatus = 'DISPATCHED_RENTAL_PIPELINE';
          } else {
            normalizedStatus = (statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1)) as OrderLifecycleStatus;
          }

          const durDays = Number(o.duration_days || o.rental_days || 3);
          const finalPay = Number(o.final_payable || o.grand_total || 0);
          const advAmt = Number(o.advance_amount || 0);

          return {
            id: o.id,
            order_number: o.order_number,
            client_id: o.client_id,
            client_name: o.client_name,
            client_email: o.client_email,
            client_phone: o.client_phone,
            movie_project_name: o.movie_project_name || o.production_name || 'Feature Film Project',
            production_name: o.production_name || o.movie_project_name,
            shoot_location: o.shoot_location || 'Soundstage Hyderabad',
            status: normalizedStatus,
            lifecycle_status: o.lifecycle_status || (isClosedOrLocked ? 'Verified_Closed' : 'Quotation'),
            is_archived_or_closed: isClosedOrLocked,
            is_locked: isClosedOrLocked,
            closed_at: o.closed_at,
            closed_by: o.closed_by,
            rental_start_date: o.rental_start_date || o.start_date || new Date().toISOString().split('T')[0],
            rental_end_date: o.rental_end_date || o.end_date || new Date().toISOString().split('T')[0],
            rental_days: durDays,
            actual_shoot_days: Number(o.actual_shoot_days || durDays),
            duration_days: durDays,
            total_replacement_val: Number(o.total_replacement_val || o.total_replacement_value || 0),
            total_rent_amount: Number(o.total_rent_amount || o.base_rental_amount || 0),
            discount_percent: Number(o.discount_percent || 0),
            discount_amount: Number(o.discount_amount || 0),
            security_deposit: Number(o.security_deposit || 0),
            tax_amount: Number(o.tax_amount || 0),
            final_payable: finalPay,
            advance_paid: Boolean(o.advance_paid),
            advance_amount: advAmt,
            balance_amount: Math.max(0, finalPay - advAmt),
            payment_mode: o.payment_mode || 'Cash',
            assigned_executives: Array.isArray(o.assigned_executives)
              ? o.assigned_executives
                  .map((ex: any) => {
                    if (!ex) return null;
                    if (typeof ex === 'string') {
                      const matchStaff = STAFF_EXECUTIVES.find(
                        (s) => s.id === ex || s.name.toLowerCase().includes(ex.toLowerCase())
                      );
                      return matchStaff || { id: ex, name: ex, floor: 1 };
                    }
                    return {
                      id: ex.id || ex.executive_id || 'exec-001',
                      name: ex.name || ex.executive_name || 'Ravi Kumar',
                      floor: ex.floor || ex.floor_assigned || 1,
                      phone: ex.phone || '',
                    };
                  })
                  .filter(Boolean)
              : STAFF_EXECUTIVES.slice(0, 2),
            vehicle_number: o.vehicle_number,
            driver_name: o.driver_name,
            driver_phone: o.driver_phone,
            gate_pass_number: o.gate_pass_number,
            notes: o.notes,
            assigned_crew_type: o.assigned_crew_type || o.crew_type,
            client_crew_details: o.client_crew_details,
            total_labor_charges: Number(o.total_labor_charges || 0),
            return_status_crew: o.return_status_crew,
            return_status_exec: o.return_status_exec,
            return_notes_crew: o.return_notes_crew,
            return_notes_exec: o.return_notes_exec,
            return_initiated_at: o.return_initiated_at,
            return_verified_at: o.return_verified_at,
            final_invoice_generated: Boolean(o.final_invoice_generated),
            final_invoice_id: o.final_invoice_id,
            damage_deduction_amount: Number(o.damage_deduction_amount || 0),
            created_by: o.created_by,
            created_at: o.created_at,
            updated_at: o.updated_at,
          };
        });

        // Filter out any permanently deleted orders so seeds never resurrect them
        const deletedIds = new Set(getStored<string[]>(STORAGE_DELETED_ORDERS_KEY, []));
        const filteredDbOrders = dbOrders.filter((o) => !deletedIds.has(o.id));
        const local = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders()).filter(
          (o) => !deletedIds.has(o.id)
        );
        const mergedMap = new Map<string, WalkInOrder>();
        filteredDbOrders.forEach((o) => mergedMap.set(o.id, o));
        local.forEach((o) => {
          if (!mergedMap.has(o.id)) {
            mergedMap.set(o.id, o);
          } else {
            const existing = mergedMap.get(o.id)!;
            // Strict lock protection: If either DB or local marked the order closed, keep it permanently locked!
            const wasClosed = o.is_locked || o.is_archived_or_closed || o.status === 'CLOSED' || existing.is_locked || existing.is_archived_or_closed || existing.status === 'CLOSED';
            if (wasClosed) {
              mergedMap.set(o.id, {
                ...existing,
                ...o,
                status: 'CLOSED',
                is_locked: true,
                is_archived_or_closed: true,
                lifecycle_status: 'Verified_Closed',
              });
            }
          }
        });
        const initialSeeds = getInitialOrders().filter((s) => !deletedIds.has(s.id));
        initialSeeds.forEach((s) => {
          if (!mergedMap.has(s.id)) mergedMap.set(s.id, s);
        });
        return Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch {
      // Fallback to local storage
    }

    const deletedIds = new Set(getStored<string[]>(STORAGE_DELETED_ORDERS_KEY, []));
    const local = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders()).filter(
      (o) => !deletedIds.has(o.id)
    );
    const initialSeeds = getInitialOrders().filter((s) => !deletedIds.has(s.id));
    const seedMap = new Map(local.map((o) => [o.id, o]));
    let addedSeed = false;
    for (const seed of initialSeeds) {
      if (!seedMap.has(seed.id)) {
        seedMap.set(seed.id, seed);
        addedSeed = true;
      }
    }
    const finalLocal = Array.from(seedMap.values()).map((o) => {
      const isClosedOrLocked = isOrderLocked(o);
      const normalizedStatus = isClosedOrLocked ? 'CLOSED' : o.status;
      return {
        ...o,
        status: normalizedStatus,
        lifecycle_status: o.lifecycle_status || (isClosedOrLocked ? 'Verified_Closed' : 'Quotation'),
        is_archived_or_closed: isClosedOrLocked,
        is_locked: isClosedOrLocked,
      };
    }).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (addedSeed) {
      setStored(STORAGE_ORDERS_KEY, finalLocal);
    }
    return finalLocal;
  },

  // 2. Get Order By ID
  async getOrderById(orderId: string): Promise<WalkInOrder | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === orderId) || null;
  },

  // 3. Create In-Person Walk-in Order
  async createWalkInOrder(input: CreateWalkInOrderInput): Promise<WalkInOrder> {
    const orderId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`;
    const seq = Math.floor(100 + Math.random() * 900);
    const orderNumber = `ASH-2026-ORD-${seq}`;

    const newOrder: WalkInOrder = {
      id: orderId,
      order_number: orderNumber,
      client_name: input.production_company_name.trim(),
      client_email: input.client_email_address?.trim() || 'production@studio.com',
      client_phone: input.client_contact_number?.trim() || '+91 98490 11223',
      movie_project_name: input.movie_project_name.trim(),
      production_name: input.movie_project_name.trim(),
      shoot_location: input.shoot_location?.trim() || 'Studio / Outdoor Location',
      status: 'PICKING_IN_PROGRESS',
      rental_start_date: input.estimated_start_date,
      rental_end_date: input.estimated_return_date,
      rental_days: input.duration_days || 3,
      duration_days: input.duration_days || 3,
      total_replacement_val: 0,
      total_rent_amount: 0,
      discount_percent: 0,
      discount_amount: 0,
      security_deposit: 0,
      tax_amount: 0,
      final_payable: 0,
      advance_paid: false,
      advance_amount: 0,
      balance_amount: 0,
      payment_mode: 'Cash',
      assigned_executives: input.assigned_executives.length > 0 ? input.assigned_executives : [STAFF_EXECUTIVES[0]],
      vehicle_number: undefined,
      driver_name: undefined,
      driver_phone: undefined,
      gate_pass_number: undefined,
      notes: input.notes?.trim() || '',
      created_by: input.created_by || '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Attempt Supabase insert
    try {
      await supabase.from('orders').insert([
        {
          id: newOrder.id,
          order_number: newOrder.order_number,
          client_name: newOrder.client_name,
          client_email: newOrder.client_email,
          client_phone: newOrder.client_phone,
          movie_project_name: newOrder.movie_project_name,
          production_name: newOrder.production_name,
          shoot_location: newOrder.shoot_location,
          status: 'picking_in_progress',
          start_date: newOrder.rental_start_date,
          end_date: newOrder.rental_end_date,
          rental_start_date: newOrder.rental_start_date,
          rental_end_date: newOrder.rental_end_date,
          rental_days: newOrder.rental_days,
          duration_days: newOrder.duration_days,
          total_replacement_value: 0,
          total_replacement_val: 0,
          base_rental_amount: 0,
          total_rent_amount: 0,
          discount_percent: 0,
          discount_amount: 0,
          security_deposit: 0,
          tax_amount: 0,
          grand_total: 0,
          final_payable: 0,
          advance_paid: false,
          advance_amount: 0,
          payment_mode: 'Cash',
          assigned_executives: newOrder.assigned_executives,
          notes: newOrder.notes,
          created_by: newOrder.created_by,
        },
      ]);

      // Insert assignments
      for (const exec of newOrder.assigned_executives) {
        await supabase.from('order_assignments').insert({
          order_id: newOrder.id,
          executive_id: exec.id,
          executive_name: exec.name,
          floor_assigned: exec.floor,
        });
      }
    } catch (e) {
      console.warn('Supabase createWalkInOrder warning:', e);
    }

    // Update Local Storage
    const current = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    setStored(STORAGE_ORDERS_KEY, [newOrder, ...current]);

    // Broadcast update
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'ORDER_CREATED', order: newOrder });
      bc.close();
    }

    return newOrder;
  },

  // 4. Get Assigned Orders for Executive (Mobile Queue)
  async getAssignedOrdersForExecutive(executiveNameOrId: string): Promise<WalkInOrder[]> {
    const all = await this.getOrders();
    const cleanFilter = (executiveNameOrId || '').toLowerCase().trim();

    return all.filter((order) => {
      // Must be pending or in progress picking
      const activeStatus = ['PICKING_IN_PROGRESS', 'Picking_In_Progress', 'picking_in_progress', 'Assigned'].includes(order.status);
      if (!activeStatus) return false;

      // If "all" or empty, return all active picking orders
      if (!cleanFilter || cleanFilter.includes('all')) return true;

      // Check direct order.assigned_executive_id if present
      if ((order as any).assigned_executive_id && String((order as any).assigned_executive_id).toLowerCase() === cleanFilter) {
        return true;
      }

      if (!Array.isArray(order.assigned_executives) || order.assigned_executives.length === 0) {
        return false;
      }

      const isAssigned = order.assigned_executives.some((exec: any) => {
        if (!exec) return false;
        if (typeof exec === 'string') {
          const str = exec.toLowerCase();
          return str.includes(cleanFilter) || cleanFilter.includes(str);
        }
        const execId = exec.id ? String(exec.id).toLowerCase() : '';
        const execName = exec.name ? String(exec.name).toLowerCase() : '';
        const execFirstName = execName ? execName.split(' ')[0] : '';

        return (
          (execId && execId === cleanFilter) ||
          (execName && execName.includes(cleanFilter)) ||
          (execFirstName && cleanFilter.includes(execFirstName))
        );
      });
      return isAssigned;
    });
  },

  // 5. Get Order Items
  async getOrderItems(orderId: string): Promise<WalkInOrderItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('scanned_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbItems: WalkInOrderItem[] = data.map((i: any) => ({
          id: i.id,
          order_id: i.order_id,
          prop_id: i.prop_id,
          prop_serialized_item_id: i.prop_serialized_item_id || i.prop_item_id,
          item_code: i.item_code || i.item_serial || 'ASH-PROP-0001',
          prop_title: i.prop_title,
          prop_category: i.prop_category,
          replacement_value: Number(i.replacement_value || 0),
          daily_rent_price: Number(i.daily_rent_price || i.daily_rental_rate || Math.round(Number(i.replacement_value || 0) * 0.2)),
          rental_days: Number(i.rental_days || 3),
          line_total: Number(i.rent_price || (Number(i.daily_rent_price || 0) * Number(i.rental_days || 3) * Number(i.quantity || 1))),
          quantity: Number(i.quantity || 1),
          warehouse_location: i.warehouse_location || `Floor ${i.floor || 1}, Rack ${i.rack || 'A'}`,
          added_by_executive_id: i.added_by_executive_id || i.scanned_by || 'exec-001',
          added_by_executive_name: i.added_by_executive_name || i.scanned_by_name || i.picked_by_name || 'Ravi Kumar',
          scanned_by: i.scanned_by,
          scanned_by_name: i.scanned_by_name || i.picked_by_name || 'Ravi Kumar',
          scanned_at: i.scanned_at || i.picked_at || i.created_at,
          status: i.status || 'picked',
          notes: i.notes,
        }));

        // Merge with local items
        const localItems = getStored<WalkInOrderItem[]>(STORAGE_ITEMS_KEY, getInitialOrderItems());
        const orderLocals = localItems.filter((item) => item.order_id === orderId);
        const map = new Map<string, WalkInOrderItem>();
        dbItems.forEach((it) => map.set(it.id, it));
        orderLocals.forEach((it) => {
          if (!map.has(it.id)) map.set(it.id, it);
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
        );
      }
    } catch {
      // Fallback to local storage
    }

    const localItems = getStored<WalkInOrderItem[]>(STORAGE_ITEMS_KEY, getInitialOrderItems());
    return localItems
      .filter((item) => item.order_id === orderId)
      .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
  },

  // 6. Validate Scanned QR / Barcode Payload
  async validatePropQR(
    rawCode: string,
    orderId?: string
  ): Promise<{
    valid: boolean;
    error?: string;
    itemCode: string;
    item?: PropSerializedItem;
    prop?: PropSKU;
    warehouseLocation: string;
    alreadyInThisOrder?: boolean;
    availableUnits: number;
  }> {
    let parsedCode = rawCode.trim();

    // Check if JSON QR format
    if (parsedCode.startsWith('{') && parsedCode.endsWith('}')) {
      try {
        const payload = JSON.parse(parsedCode);
        if (payload.itemCode) {
          parsedCode = payload.itemCode;
        }
      } catch {
        // Continue with raw text
      }
    }

    parsedCode = parsedCode.toUpperCase();

    // Look up serialized items
    const items = await inventoryService.getSerializedItems();
    const props = await inventoryService.getPropsWithSerializedItems();
    const matchedItem = items.find(
      (i) => i.item_code.toUpperCase() === parsedCode || i.id === parsedCode
    );

    if (!matchedItem) {
      return {
        valid: false,
        error: `Prop barcode '${parsedCode}' was not found in ASHWA asset inventory. Please verify label.`,
        itemCode: parsedCode,
        warehouseLocation: 'Unknown',
        availableUnits: 0,
      };
    }

    // Check if already dispatched/on rent
    if (matchedItem.status === 'Dispatched / On Rent' || matchedItem.status === ('On Rent' as any)) {
      return {
        valid: false,
        error: `Warning: Item ${matchedItem.item_code} is currently flagged as 'On Rent' to another client!`,
        itemCode: matchedItem.item_code,
        item: matchedItem,
        prop: matchedItem.prop,
        warehouseLocation: matchedItem.prop?.warehouse_location_name || matchedItem.prop?.warehouse_code || 'G1-F0-RA-S01',
        availableUnits: 0,
      };
    }

    // Check if already picked in this order
    let alreadyInThisOrder = false;
    if (orderId) {
      const currentItems = await this.getOrderItems(orderId);
      alreadyInThisOrder = currentItems.some(
        (it) => it.item_code.toUpperCase() === matchedItem.item_code.toUpperCase()
      );
    }

    const parentProp = matchedItem.prop || props.find((p) => p.id === matchedItem.prop_id);
    const availableUnits = parentProp?.available_quantity ?? 1;

    return {
      valid: true,
      itemCode: matchedItem.item_code,
      item: matchedItem,
      prop: parentProp,
      warehouseLocation:
        parentProp?.warehouse_location_name ||
        parentProp?.warehouse_code ||
        'Godown 1 > Ground Floor > Rack A > Shelf 01',
      alreadyInThisOrder,
      availableUnits,
    };
  },

  // 7. Add Scanned Prop to Order (Collaborative Live Cart Event)
  async scanAndAddOrderItem(
    orderId: string,
    rawCode: string,
    executiveId: string,
    executiveName: string,
    quantity: number = 1
  ): Promise<{ success: boolean; item?: WalkInOrderItem; message: string }> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Active order not found.' };
    }
    assertOrderNotLocked(order, 'add props');

    const validation = await this.validatePropQR(rawCode, orderId);

    if (!validation.valid || !validation.item) {
      return {
        success: false,
        message: validation.error || 'Invalid QR code scanned.',
      };
    }

    if (validation.alreadyInThisOrder) {
      return {
        success: false,
        message: `Item ${validation.itemCode} is already picked in this order. Select another serialized unit.`,
      };
    }

    const prop = validation.prop;
    const replacementVal = prop?.replacement_value ?? 2000;
    const ratePercent = prop?.rental_rate_percent ?? 20;
    const dailyRentPrice = Math.round(replacementVal * (ratePercent / 100));
    const rentalDays = order.duration_days || order.rental_days || 3;
    const lineTotal = dailyRentPrice * rentalDays * quantity;

    const newItemId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `oi-${Date.now()}`;

    // Clean executive short name e.g. "Ravi Kumar"
    const cleanExecName = executiveName.includes('(')
      ? executiveName.split('(')[0].trim()
      : executiveName.trim();

    const newOrderItem: WalkInOrderItem = {
      id: newItemId,
      order_id: orderId,
      prop_id: prop?.id || validation.item.prop_id,
      prop_serialized_item_id: validation.item.id,
      item_code: validation.item.item_code,
      prop_title: prop?.name || 'Cinema Prop Item',
      prop_category: prop?.category?.name || 'Standard Prop',
      model_number: prop?.model_number || 'N/A',
      image_url: prop?.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
      replacement_value: replacementVal,
      daily_rent_price: dailyRentPrice,
      rental_days: rentalDays,
      line_total: lineTotal,
      quantity,
      warehouse_location: validation.warehouseLocation,
      added_by_executive_id: executiveId,
      added_by_executive_name: cleanExecName,
      scanned_by: executiveId,
      scanned_by_name: cleanExecName,
      scanned_at: new Date().toISOString(),
      status: 'picked',
      notes: `Added by ${cleanExecName} in warehouse`,
    };

    // 1. Insert into Supabase
    try {
      await supabase.from('order_items').insert({
        id: newOrderItem.id,
        order_id: newOrderItem.order_id,
        prop_id: newOrderItem.prop_id,
        prop_item_id: newOrderItem.prop_serialized_item_id,
        prop_serialized_item_id: newOrderItem.prop_serialized_item_id,
        item_serial: newOrderItem.item_code,
        prop_title: newOrderItem.prop_title,
        prop_category: newOrderItem.prop_category,
        replacement_value: newOrderItem.replacement_value,
        daily_rental_rate: newOrderItem.daily_rent_price,
        rent_price: newOrderItem.line_total,
        rental_days: newOrderItem.rental_days,
        quantity: newOrderItem.quantity,
        warehouse_location: newOrderItem.warehouse_location,
        status: 'picked',
        added_by_executive_id: newOrderItem.added_by_executive_id,
        added_by_executive_name: newOrderItem.added_by_executive_name,
        scanned_by: newOrderItem.scanned_by,
        scanned_by_name: newOrderItem.scanned_by_name,
        picked_by_name: newOrderItem.scanned_by_name,
        scanned_at: newOrderItem.scanned_at,
        picked_at: newOrderItem.scanned_at,
      });
    } catch (e) {
      console.warn('Supabase order_items insert warning:', e);
    }

    // 2. Update local order items
    const currentOrderItems = getStored<WalkInOrderItem[]>(STORAGE_ITEMS_KEY, getInitialOrderItems());
    setStored(STORAGE_ITEMS_KEY, [newOrderItem, ...currentOrderItems]);

    // 3. Mark serialized item as "In Cart"
    await inventoryService.updateSerializedItemStatus(validation.item.id, 'In Cart');

    // 4. Recalculate order financial totals
    await this.recalculateOrderTotals(orderId);

    // 5. Broadcast to counter cart in realtime
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ITEM_SCANNED',
        orderId,
        item: newOrderItem,
        addedBy: cleanExecName,
        timestamp: new Date().toISOString(),
      });
      bc.close();
    }

    return {
      success: true,
      item: newOrderItem,
      message: `Scanned and committed ${newOrderItem.item_code} (${newOrderItem.prop_title}) by ${cleanExecName}.`,
    };
  },

  // 8. Delete Order Item
  async deleteOrderItem(orderId: string, orderItemId: string): Promise<void> {
    const order = await this.getOrderById(orderId);
    if (order) {
      assertOrderNotLocked(order, 'delete props');
    }

    try {
      await supabase.from('order_items').delete().eq('id', orderItemId);
    } catch (e) {
      console.warn('Supabase deleteOrderItem warning:', e);
    }

    const currentOrderItems = getStored<WalkInOrderItem[]>(STORAGE_ITEMS_KEY, getInitialOrderItems());
    const deletedItem = currentOrderItems.find((i) => i.id === orderItemId);
    const updatedItems = currentOrderItems.filter((i) => i.id !== orderItemId);
    setStored(STORAGE_ITEMS_KEY, updatedItems);

    if (deletedItem?.prop_serialized_item_id) {
      await inventoryService.updateSerializedItemStatus(deletedItem.prop_serialized_item_id, 'Available');
    }

    await this.recalculateOrderTotals(orderId);

    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ITEM_DELETED',
        orderId,
        itemId: orderItemId,
      });
      bc.close();
    }
  },

  // 8b. Strict Role-Based Authorization Check for Order Deletion
  canDeleteOrder(
    order: WalkInOrder,
    user?: { id?: string; email?: string } | null,
    role?: string | null
  ): { allowed: boolean; reason?: string; isSuperAdmin: boolean } {
    const normRole = (role || '').toLowerCase().trim();
    const isSuperAdmin = normRole === 'super_admin' || normRole === 'admin';

    // Rule 2: Super Admin Override (Unrestricted Access across all stages)
    if (isSuperAdmin) {
      return { allowed: true, isSuperAdmin: true };
    }

    // Rule 1: Standard Creators (Billing Managers / Staff who created the order)
    const normStatus = (order.status || '').toLowerCase().trim();
    const isEarlyStage = normStatus === 'draft' || normStatus === 'picking_in_progress';

    // Once dispatched or in pipeline, standard creators CANNOT delete the order under any circumstance
    if (!isEarlyStage) {
      return {
        allowed: false,
        isSuperAdmin: false,
        reason: 'Dispatched orders can only be deleted by a Super Admin',
      };
    }

    // Early stage: verify logged-in user matches created_by (or is creator in demo session)
    const orderCreator = order.created_by;
    const isCreator =
      !orderCreator ||
      (user?.id && orderCreator === user.id) ||
      (user?.email && orderCreator === user.email) ||
      Boolean(user?.email && (user.email.includes('billing') || user.email.includes('admin')));

    if (!isCreator) {
      return {
        allowed: false,
        isSuperAdmin: false,
        reason: 'Only the order creator or a Super Admin can delete this order',
      };
    }

    return { allowed: true, isSuperAdmin: false };
  },

  // 8c. Delete Order Cascade with Automatic Serialized Prop Release & 2-Step Protocol Verification
  async deleteOrder(
    orderId: string,
    options?: { userId?: string; role?: string; email?: string }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found', error: 'Order not found' };
    }

    const permission = this.canDeleteOrder(
      order,
      { id: options?.userId, email: options?.email },
      options?.role
    );

    if (!permission.allowed) {
      return {
        success: false,
        message: permission.reason || 'Unauthorized to delete this order',
        error: permission.reason || 'Unauthorized to delete this order',
      };
    }

    // Step 0: Record in permanently deleted IDs list immediately so seeds never resurrect it
    try {
      const deletedIds = getStored<string[]>(STORAGE_DELETED_ORDERS_KEY, []);
      if (!deletedIds.includes(orderId)) {
        setStored(STORAGE_DELETED_ORDERS_KEY, [...deletedIds, orderId]);
      }
    } catch (e) {
      console.warn('Error recording deleted order id:', e);
    }

    // Step 1: Release all associated serialized prop items back to 'Available'
    try {
      const items = await this.getOrderItems(orderId);
      for (const item of items) {
        if (item.prop_serialized_item_id) {
          await inventoryService.updateSerializedItemStatus(item.prop_serialized_item_id, 'Available');
        }
      }
    } catch (e) {
      console.warn('Inventory release error during order delete:', e);
    }

    // Step 2: Call Server API route /api/admin/orders/[id]/delete (runs with supabaseAdmin service role)
    let apiSuccess = false;
    let apiError: string | undefined;

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: options?.userId,
            userRole: options?.role,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          apiSuccess = true;
        } else {
          apiError = data.error || 'Server deletion failed';
          console.warn('Server delete order API returned error:', apiError);
        }
      } catch (e: any) {
        apiError = e.message;
        console.warn('Network error calling delete API, falling back to direct DB delete:', e);
      }
    }

    // Step 3: Direct DB fallback if API wasn't invoked or failed
    if (!apiSuccess) {
      try {
        // Try delete_order_completely RPC function first
        const { data: rpcData, error: rpcErr } = await supabase.rpc('delete_order_completely', {
          target_order_id: orderId,
        });

        if (!rpcErr && rpcData?.success) {
          apiSuccess = true;
        } else {
          // Release prop items in DB
          await supabase
            .from('prop_serialized_items')
            .update({ status: 'Available', current_order_id: null })
            .eq('current_order_id', orderId);

          // Clean child tables before parent delete to satisfy FK constraints
          await supabase.from('order_items').delete().eq('order_id', orderId);
          await supabase.from('order_assignments').delete().eq('order_id', orderId);
          await supabase.from('prop_rental_history').delete().eq('order_id', orderId);
          const { error: ordErr } = await supabase.from('orders').delete().eq('id', orderId);

          if (!ordErr) apiSuccess = true;
          else if (!apiError) apiError = ordErr.message;
        }
      } catch (e: any) {
        console.warn('Direct Supabase delete error:', e);
      }
    }

    // Step 4: Remove from local storage cache
    try {
      const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
      setStored(STORAGE_ORDERS_KEY, currentOrders.filter((o) => o.id !== orderId));

      const currentItems = getStored<WalkInOrderItem[]>(STORAGE_ITEMS_KEY, getInitialOrderItems());
      setStored(STORAGE_ITEMS_KEY, currentItems.filter((i) => i.order_id !== orderId));
    } catch (e) {
      console.warn('Local storage delete order error:', e);
    }

    // Step 5: Broadcast cross-tab deletion event
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ORDER_DELETED',
        orderId,
      });
      bc.close();
    }

    return { success: true };
  },

  // 9. Recalculate Order Financial Totals
  async recalculateOrderTotals(orderId: string): Promise<WalkInOrder | null> {
    const items = await this.getOrderItems(orderId);
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    const totalReplacement = items.reduce((sum, item) => sum + item.replacement_value * item.quantity, 0);
    const totalRent = items.reduce((sum, item) => sum + item.line_total, 0);

    const discountAmount = Math.round(totalRent * (order.discount_percent / 100));
    const securityDeposit = Math.round(totalReplacement * 0.30);
    const laborCharges = order.total_labor_charges || 0;
    const taxableAmount = Math.max(0, totalRent - discountAmount) + laborCharges;
    const taxAmount = Math.round(taxableAmount * 0.18);
    const finalPayable = Math.max(0, totalRent - discountAmount) + laborCharges + securityDeposit + taxAmount;
    const advanceAmount = order.advance_paid ? (order.advance_amount || 0) : 0;
    const balanceAmount = Math.max(0, finalPayable - advanceAmount);

    const updatedOrder: WalkInOrder = {
      ...order,
      total_replacement_val: totalReplacement,
      total_rent_amount: totalRent,
      discount_amount: discountAmount,
      security_deposit: securityDeposit,
      tax_amount: taxAmount,
      final_payable: finalPayable,
      advance_amount: advanceAmount,
      balance_amount: balanceAmount,
      updated_at: new Date().toISOString(),
    };

    // Update in Supabase
    try {
      await supabase
        .from('orders')
        .update({
          total_replacement_val: updatedOrder.total_replacement_val,
          total_replacement_value: updatedOrder.total_replacement_val,
          total_rent_amount: updatedOrder.total_rent_amount,
          base_rental_amount: updatedOrder.total_rent_amount,
          discount_amount: updatedOrder.discount_amount,
          security_deposit: updatedOrder.security_deposit,
          tax_amount: updatedOrder.tax_amount,
          final_payable: updatedOrder.final_payable,
          grand_total: updatedOrder.final_payable,
          advance_amount: updatedOrder.advance_amount,
          updated_at: updatedOrder.updated_at,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase update order totals warning:', e);
    }

    // Update local storage
    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const updatedOrders = currentOrders.map((o) => (o.id === orderId ? updatedOrder : o));
    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    return updatedOrder;
  },

  // 9b. Update Labor Charges & Crew Sourcing Configuration
  async updateOrderLaborCharges(
    orderId: string,
    laborData: {
      crew_type: 'in_house' | 'client_sourced';
      total_labor_charges: number;
      in_house_worker_count: number;
      daily_wage_rate: number;
      client_sourced_crew?: Array<{ id: string; name: string; phone: string; govt_id_or_notes?: string }>;
    }
  ): Promise<WalkInOrder | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    const items = await this.getOrderItems(orderId);
    const totalReplacement = items.reduce((sum, item) => sum + item.replacement_value * item.quantity, 0);
    const totalRent = items.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmount = Math.round(totalRent * (order.discount_percent / 100));
    const securityDeposit = Math.round(totalReplacement * 0.30);
    const laborCharges = laborData.total_labor_charges || 0;
    const taxableAmount = Math.max(0, totalRent - discountAmount) + laborCharges;
    const taxAmount = Math.round(taxableAmount * 0.18);
    const finalPayable = Math.max(0, totalRent - discountAmount) + laborCharges + securityDeposit + taxAmount;
    const advanceAmount = order.advance_paid ? (order.advance_amount || 0) : 0;
    const balanceAmount = Math.max(0, finalPayable - advanceAmount);

    const updatedOrder: WalkInOrder = {
      ...order,
      crew_type: laborData.crew_type,
      total_labor_charges: laborCharges,
      in_house_worker_count: laborData.in_house_worker_count,
      daily_wage_rate: laborData.daily_wage_rate,
      client_sourced_crew: laborData.client_sourced_crew || order.client_sourced_crew,
      total_replacement_val: totalReplacement,
      total_rent_amount: totalRent,
      discount_amount: discountAmount,
      security_deposit: securityDeposit,
      tax_amount: taxAmount,
      final_payable: finalPayable,
      advance_amount: advanceAmount,
      balance_amount: balanceAmount,
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase
        .from('orders')
        .update({
          crew_type: updatedOrder.crew_type,
          total_labor_charges: updatedOrder.total_labor_charges,
          in_house_worker_count: updatedOrder.in_house_worker_count,
          daily_wage_rate: updatedOrder.daily_wage_rate,
          client_sourced_crew: updatedOrder.client_sourced_crew,
          tax_amount: updatedOrder.tax_amount,
          final_payable: updatedOrder.final_payable,
          grand_total: updatedOrder.final_payable,
          updated_at: updatedOrder.updated_at,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase update order labor charges warning:', e);
    }

    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const updatedOrders = currentOrders.map((o) => (o.id === orderId ? updatedOrder : o));
    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ORDER_UPDATED',
        orderId,
        order: updatedOrder,
      });
    }

    return updatedOrder;
  },


  // 10. Update Advance Payment Controls
  async updateAdvancePayment(
    orderId: string,
    advancePaid: boolean,
    advanceAmount: number,
    paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card' = 'Cash'
  ): Promise<WalkInOrder | null> {
    const orders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const order = orders.find((o) => o.id === orderId);
    if (!order) return null;

    order.advance_paid = advancePaid;
    order.advance_amount = advancePaid ? Math.max(0, advanceAmount) : 0;
    order.payment_mode = paymentMode;
    order.balance_amount = Math.max(0, order.final_payable - order.advance_amount);
    order.updated_at = new Date().toISOString();

    setStored(STORAGE_ORDERS_KEY, orders);

    try {
      await supabase
        .from('orders')
        .update({
          advance_paid: order.advance_paid,
          advance_amount: order.advance_amount,
          payment_mode: order.payment_mode,
          updated_at: order.updated_at,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase update advance payment warning:', e);
    }

    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'ADVANCE_PAYMENT_UPDATED', orderId, order });
      bc.close();
    }

    return order;
  },

  // 11. Save as Quotation
  async saveAsQuotation(orderId: string): Promise<{ success: boolean; message: string }> {
    const orders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const timestamp = new Date().toISOString();
    order.status = 'Quotation_Review';
    order.updated_at = timestamp;
    setStored(STORAGE_ORDERS_KEY, orders);

    try {
      await supabase.from('orders').update({ status: 'Quotation_Review', updated_at: timestamp }).eq('id', orderId);
    } catch (e) {
      console.warn('Supabase quotation update warning:', e);
    }

    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'ORDER_QUOTATION_SAVED', orderId });
      bc.close();
    }

    return {
      success: true,
      message: `Quotation estimate for ${order.order_number} saved. Ready for PDF export or client presentation.`,
    };
  },

  // 12. Finalize & Dispatch Order to Rental Pipeline
  async dispatchOrder(
    orderId: string,
    dispatchInfo?: {
      vehicle_number: string;
      driver_name?: string;
      driver_phone?: string;
      notes?: string;
      crew_type?: 'in_house' | 'client_sourced';
      in_house_workers?: any[];
      client_crew?: any[];
      daily_wage?: number;
      total_labor_charges?: number;
    }
  ): Promise<{ success: boolean; message: string; gatePassNumber?: string }> {
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const dispatchCheck = canDispatchOrder(order);
    if (!dispatchCheck.allowed) {
      return {
        success: false,
        message: dispatchCheck.reason || 'Order cannot be dispatched because it is closed or locked.',
      };
    }
    assertOrderNotLocked(order, 'dispatch to lorry');

    const items = await this.getOrderItems(orderId);
    if (items.length === 0) {
      return { success: false, message: 'Cannot dispatch an empty order. Please have executives scan props first.' };
    }

    const vehicleNumber = dispatchInfo?.vehicle_number?.trim() || 'TS 09 EA 4521';
    const driverName = dispatchInfo?.driver_name?.trim() || 'Mohan Babu (Senior Cargo Driver)';
    const driverPhone = dispatchInfo?.driver_phone?.trim() || '+91 94400 55667';
    const gatePassNumber = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    const crewType = dispatchInfo?.crew_type || order.crew_type || 'in_house';
    const laborCharges = dispatchInfo?.total_labor_charges !== undefined ? dispatchInfo.total_labor_charges : (order.total_labor_charges || 0);
    const workerCount = dispatchInfo?.in_house_workers?.length ?? order.in_house_worker_count ?? 0;
    const dailyWage = dispatchInfo?.daily_wage ?? order.daily_wage_rate ?? 1000;

    // 1. Update Order Status to DISPATCHED_RENTAL_PIPELINE
    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const updatedOrders = currentOrders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'DISPATCHED_RENTAL_PIPELINE' as OrderLifecycleStatus,
            vehicle_number: vehicleNumber,
            driver_name: driverName,
            driver_phone: driverPhone,
            gate_pass_number: gatePassNumber,
            notes: dispatchInfo?.notes || o.notes,
            crew_type: crewType,
            total_labor_charges: laborCharges,
            in_house_worker_count: workerCount,
            daily_wage_rate: dailyWage,
            client_sourced_crew: dispatchInfo?.client_crew || o.client_sourced_crew,
            updated_at: timestamp,
          }
        : o
    );
    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    try {
      await supabase
        .from('orders')
        .update({
          status: 'dispatched',
          vehicle_number: vehicleNumber,
          driver_name: driverName,
          driver_phone: driverPhone,
          gate_pass_number: gatePassNumber,
          crew_type: crewType,
          total_labor_charges: laborCharges,
          in_house_worker_count: workerCount,
          daily_wage_rate: dailyWage,
          client_sourced_crew: dispatchInfo?.client_crew || order.client_sourced_crew,
          updated_at: timestamp,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase dispatch update warning:', e);
    }


    // 2. Automate each serialized prop item in prop_serialized_items & prop_rental_history
    const historyEntries: PropRentalHistoryEntry[] = [];

    for (const item of items) {
      if (item.prop_serialized_item_id) {
        // A. Set status to 'Dispatched / On Rent'
        await inventoryService.updateSerializedItemStatus(
          item.prop_serialized_item_id,
          'Dispatched / On Rent',
          undefined,
          `On Rent to ${order.client_name} for ${order.movie_project_name}. Lorry: ${vehicleNumber}`
        );

        // B. Create prop_rental_history record
        const historyId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hist-${Date.now()}`;
        const historyRecord: PropRentalHistoryEntry = {
          id: historyId,
          prop_serialized_item_id: item.prop_serialized_item_id,
          item_code: item.item_code,
          prop_name: item.prop_title,
          order_id: order.id,
          order_number: order.order_number,
          client_name: order.client_name,
          movie_project_name: order.movie_project_name,
          dispatched_at: timestamp,
          returned_at: null,
          rental_days: order.duration_days || order.rental_days,
          rental_earnings: item.line_total,
          return_condition: 'Good',
          vehicle_number: vehicleNumber,
          driver_name: driverName,
          created_at: timestamp,
        };

        historyEntries.push(historyRecord);

        try {
          await supabase.from('prop_rental_history').insert(historyRecord);
        } catch (e) {
          console.warn('Supabase prop_rental_history insert warning:', e);
        }
      }
    }

    const existingHistory = getStored<PropRentalHistoryEntry[]>(STORAGE_HISTORY_KEY, []);
    setStored(STORAGE_HISTORY_KEY, [...historyEntries, ...existingHistory]);

    // 3. Broadcast Dispatch Event
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ORDER_DISPATCHED',
        orderId,
        orderNumber: order.order_number,
        gatePassNumber,
        timestamp,
      });
      bc.close();
    }

    return {
      success: true,
      message: `Order ${order.order_number} dispatched to Rental Pipeline! Gate Pass: ${gatePassNumber}`,
      gatePassNumber,
    };
  },

  // 14. Return & Check In Order (Pipeline Check-in)
  async returnAndCheckInOrder(
    orderId: string,
    checkInData?: {
      condition?: 'Good' | 'Minor Damage' | 'Repaired' | 'Pristine';
      notes?: string;
      inspected_by?: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    const order = await this.getOrderById(orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const items = await this.getOrderItems(orderId);
    const timestamp = new Date().toISOString();
    const condition = checkInData?.condition || 'Good';
    const notes = checkInData?.notes || 'Return inspection completed. Props restored to available stock.';
    const inspectedBy = checkInData?.inspected_by || 'Warehouse Inspection Team';

    // 1. Update Order Status to Returned in localStorage
    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const updatedOrders = currentOrders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status: 'Returned' as OrderLifecycleStatus,
            notes: notes ? (o.notes ? `${o.notes} | ${notes}` : notes) : o.notes,
            updated_at: timestamp,
          }
        : o
    );
    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    // 2. Update Supabase
    try {
      await supabase
        .from('orders')
        .update({
          status: 'returned',
          notes: notes,
          updated_at: timestamp,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase return update warning:', e);
    }

    // 3. Update all serialized items back to Available
    for (const item of items) {
      if (item.prop_serialized_item_id) {
        await inventoryService.updateSerializedItemStatus(
          item.prop_serialized_item_id,
          'Available',
          condition === 'Minor Damage' ? 'Minor Wear' : condition === 'Pristine' ? 'Brand New' : 'Good',
          `Checked in from Order ${order.order_number} by ${inspectedBy}`
        );
      }
    }

    // 4. Update prop_rental_history
    const historyList = getStored<PropRentalHistoryEntry[]>(STORAGE_HISTORY_KEY, []);
    const updatedHistory = historyList.map((h) =>
      h.order_id === orderId
        ? {
            ...h,
            returned_at: timestamp,
            return_condition: condition,
          }
        : h
    );
    setStored(STORAGE_HISTORY_KEY, updatedHistory);

    try {
      await supabase
        .from('prop_rental_history')
        .update({
          returned_at: timestamp,
          return_condition: condition,
        })
        .eq('order_id', orderId);
    } catch (e) {
      console.warn('Supabase prop_rental_history return update warning:', e);
    }

    // 5. Broadcast return event
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ORDER_RETURNED',
        orderId,
        orderNumber: order.order_number,
        timestamp,
      });
      bc.close();
    }

    return {
      success: true,
      message: `Order ${order.order_number} successfully returned and inspected. All props restored to stock.`,
    };
  },

  // 15. Supabase Realtime + Cross-Tab Subscription
  subscribeToOrderUpdates(
    orderId: string,
    callbacks: {
      onItemScanned?: (item: WalkInOrderItem) => void;
      onItemDeleted?: (itemId: string) => void;
      onOrderUpdated?: (order: WalkInOrder) => void;
      onOrderDeleted?: (orderId: string) => void;
    }
  ): () => void {
    const bc = getBroadcastChannel();
    const handleBroadcast = (e: MessageEvent) => {
      const data = e.data;
      if (!data || data.orderId !== orderId) return;

      if (data.type === 'ITEM_SCANNED' && data.item && callbacks.onItemScanned) {
        callbacks.onItemScanned(data.item);
      } else if (data.type === 'ITEM_DELETED' && data.itemId && callbacks.onItemDeleted) {
        callbacks.onItemDeleted(data.itemId);
      } else if (data.type === 'ORDER_DELETED' && callbacks.onOrderDeleted) {
        callbacks.onOrderDeleted(orderId);
      } else if ((data.type === 'ORDER_DISPATCHED' || data.type === 'ADVANCE_PAYMENT_UPDATED' || data.type === 'ORDER_QUOTATION_SAVED') && callbacks.onOrderUpdated) {
        this.getOrderById(orderId).then((o) => {
          if (o) callbacks.onOrderUpdated!(o);
        });
      }
    };

    if (bc) {
      bc.addEventListener('message', handleBroadcast);
    }

    const channelName = `ashwa_counter_cart_${orderId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` },
        (payload) => {
          const raw = payload.new as any;
          if (callbacks.onItemScanned && raw) {
            const mappedItem: WalkInOrderItem = {
              id: raw.id,
              order_id: raw.order_id,
              prop_id: raw.prop_id,
              prop_serialized_item_id: raw.prop_serialized_item_id || raw.prop_item_id,
              item_code: raw.item_code || raw.item_serial || 'ASH-PROP',
              prop_title: raw.prop_title || 'Prop Unit',
              prop_category: raw.prop_category,
              replacement_value: Number(raw.replacement_value || 0),
              daily_rent_price: Number(raw.daily_rent_price || raw.daily_rental_rate || 400),
              rental_days: Number(raw.rental_days || 3),
              line_total: Number(raw.rent_price || 1200),
              quantity: Number(raw.quantity || 1),
              warehouse_location: raw.warehouse_location || 'Warehouse Shelf',
              added_by_executive_id: raw.added_by_executive_id || raw.scanned_by || 'exec-001',
              added_by_executive_name: raw.added_by_executive_name || raw.scanned_by_name || 'Ravi Kumar',
              scanned_by: raw.scanned_by,
              scanned_by_name: raw.scanned_by_name || 'Ravi Kumar',
              scanned_at: raw.scanned_at || raw.created_at || new Date().toISOString(),
              status: raw.status || 'picked',
            };
            callbacks.onItemScanned(mappedItem);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'order_items', filter: `order_id=eq.${orderId}` },
        (payload) => {
          if (callbacks.onItemDeleted && payload.old) {
            callbacks.onItemDeleted((payload.old as any).id);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (callbacks.onOrderUpdated && payload.new) {
            this.getOrderById(orderId).then((o) => {
              if (o) callbacks.onOrderUpdated!(o);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        () => {
          if (callbacks.onOrderDeleted) {
            callbacks.onOrderDeleted(orderId);
          }
        }
      )
      .subscribe();

    return () => {
      if (bc) {
        bc.removeEventListener('message', handleBroadcast);
        bc.close();
      }
      supabase.removeChannel(channel);
    };
  },

  // 16. Dynamic Actual Shoot Days Tracker & Recalculation
  async updateActualShootDays(orderId: string, newDays: number): Promise<WalkInOrder | null> {
    const days = Math.max(1, Number(newDays) || 1);
    const order = await this.getOrderById(orderId);
    if (!order) return null;
    assertOrderNotLocked(order, 'adjust shooting days');

    const items = await this.getOrderItems(orderId);
    const updatedItems = items.map((item) => ({
      ...item,
      rental_days: days,
      line_total: item.daily_rent_price * days,
    }));

    // Save updated items
    const allItems = getStored<WalkInOrderItem[]>(STORAGE_ITEMS_KEY, []);
    const filteredItems = allItems.filter((i) => i.order_id !== orderId);
    setStored(STORAGE_ITEMS_KEY, [...filteredItems, ...updatedItems]);

    // Recalculate financial snapshot
    const totalRent = updatedItems.reduce((sum, item) => sum + item.line_total, 0);
    const discountAmount = Math.round(totalRent * (order.discount_percent / 100));
    
    // Recalculate labor if internal crew
    let laborCharges = order.total_labor_charges || 0;
    if (order.crew_type === 'in_house' || order.assigned_crew_type === 'in_house') {
      const workerCount = order.in_house_worker_count || 1;
      const rate = order.daily_wage_rate || 1000;
      laborCharges = workerCount * rate * days;
    }

    const taxableAmount = Math.max(0, totalRent - discountAmount) + laborCharges;
    const taxAmount = Math.round(taxableAmount * 0.18);
    const finalPayable = taxableAmount + order.security_deposit + taxAmount;
    const advance = order.advance_amount || 0;
    const balanceAmount = Math.max(0, finalPayable - advance);

    // Calculate new end date
    let newEndDate = order.rental_end_date;
    try {
      const start = new Date(order.rental_start_date);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + (days - 1) * 86400000);
        newEndDate = end.toISOString().split('T')[0];
      }
    } catch {
      // Fallback
    }

    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    let updatedOrderRecord: WalkInOrder | null = null;

    const updatedOrders = currentOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrderRecord = {
          ...o,
          rental_days: days,
          duration_days: days,
          actual_shoot_days: days,
          rental_end_date: newEndDate,
          total_rent_amount: totalRent,
          discount_amount: discountAmount,
          total_labor_charges: laborCharges,
          tax_amount: taxAmount,
          final_payable: finalPayable,
          balance_amount: balanceAmount,
          updated_at: new Date().toISOString(),
        };
        return updatedOrderRecord;
      }
      return o;
    });

    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    // Update Supabase in background
    try {
      await supabase
        .from('orders')
        .update({
          rental_days: days,
          actual_shoot_days: days,
          end_date: newEndDate,
          base_rental_amount: totalRent,
          total_labor_charges: laborCharges,
          tax_amount: taxAmount,
          grand_total: finalPayable,
          balance_amount: balanceAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase updateActualShootDays warning:', e);
    }

    // Broadcast update
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'ORDER_QUOTATION_SAVED', orderId, order: updatedOrderRecord });
      bc.close();
    }

    return updatedOrderRecord;
  },

  // 17. Record Advance Payment Directly on Row
  async recordAdvancePayment(
    orderId: string,
    amountOrData: number | { amount: number; payment_mode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card'; reference_number?: string; notes?: string },
    paymentModeArg: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit Card' = 'UPI',
    notesArg?: string
  ): Promise<WalkInOrder | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;
    assertOrderNotLocked(order, 'record advance payment');

    let amount = 0;
    let paymentMode = paymentModeArg;
    let notes = notesArg;

    if (typeof amountOrData === 'object' && amountOrData !== null) {
      amount = amountOrData.amount;
      if (amountOrData.payment_mode) paymentMode = amountOrData.payment_mode;
      notes = amountOrData.notes || (amountOrData.reference_number ? `Ref: ${amountOrData.reference_number}` : undefined);
    } else {
      amount = Number(amountOrData) || 0;
    }

    const newAdvance = Number(amount) || 0;
    const balance = Math.max(0, (order.final_payable || order.total_rent_amount || 0) - newAdvance);

    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    let updatedOrderRecord: WalkInOrder | null = null;

    const updatedOrders = currentOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrderRecord = {
          ...o,
          advance_paid: newAdvance > 0,
          advance_amount: newAdvance,
          balance_amount: balance,
          payment_mode: paymentMode,
          notes: notes ? (o.notes ? `${o.notes} | ${notes}` : notes) : o.notes,
          updated_at: new Date().toISOString(),
        };
        return updatedOrderRecord;
      }
      return o;
    });

    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    try {
      await supabase
        .from('orders')
        .update({
          advance_paid: newAdvance > 0,
          advance_amount: newAdvance,
          balance_amount: balance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase recordAdvancePayment warning:', e);
    }

    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'ADVANCE_PAYMENT_UPDATED', orderId, order: updatedOrderRecord });
      bc.close();
    }

    return updatedOrderRecord;
  },

  // 18. Step A: Field Crew Initiates Return
  async initiateFieldReturn(
    orderId: string,
    stepAData: {
      initiated_by: string;
      confirmed_count: number;
      total_count: number;
      has_damages: boolean;
      damage_notes?: string;
      damage_estimated_cost?: number;
    }
  ): Promise<WalkInOrder | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    const timestamp = new Date().toISOString();
    const damageCost = stepAData.has_damages ? (Number(stepAData.damage_estimated_cost) || 0) : 0;

    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    let updatedOrderRecord: WalkInOrder | null = null;

    const updatedOrders = currentOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrderRecord = {
          ...o,
          return_status_crew: 'Initiated',
          return_notes_crew: stepAData.damage_notes || `Field Crew verified ${stepAData.confirmed_count}/${stepAData.total_count} props on set.`,
          return_initiated_at: timestamp,
          lifecycle_status: 'Return_Initiated',
          damage_deduction_amount: damageCost,
          updated_at: timestamp,
        };
        return updatedOrderRecord;
      }
      return o;
    });

    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    try {
      await supabase
        .from('orders')
        .update({
          return_status_crew: 'Initiated',
          return_notes_crew: stepAData.damage_notes,
          return_initiated_at: timestamp,
          lifecycle_status: 'Return_Initiated',
          damage_deduction_amount: damageCost,
          updated_at: timestamp,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase initiateFieldReturn warning:', e);
    }

    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'ORDER_RETURN_INITIATED', orderId, order: updatedOrderRecord });
      bc.close();
    }

    return updatedOrderRecord;
  },

  // 19. Step B: Warehouse Floor Sales Executive Sign-Off & Strict Lifecycle Termination
  async confirmWarehouseReturn(
    orderId: string,
    stepBData: {
      verified_by: string;
      warehouse_condition_rating: 'Pristine' | 'Good' | 'Minor_Wear' | 'Damaged';
      warehouse_notes?: string;
    }
  ): Promise<WalkInOrder | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;

    const timestamp = new Date().toISOString();
    const notes = stepBData.warehouse_notes || `Return physically inspected & verified at warehouse by ${stepBData.verified_by}. Condition: ${stepBData.warehouse_condition_rating}.`;

    // 1. Update Order: Strictly terminate lifecycle status to 'CLOSED' & 'Verified_Closed'
    // This permanently locks the order and prevents any re-entry into dispatch or pipeline
    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    let updatedOrderRecord: WalkInOrder | null = null;

    const updatedOrders = currentOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrderRecord = {
          ...o,
          return_status_exec: 'Verified',
          return_notes_exec: notes,
          return_verified_at: timestamp,
          lifecycle_status: 'Verified_Closed',
          status: 'CLOSED' as OrderLifecycleStatus, // Terminal immutable state
          is_archived_or_closed: true,
          is_locked: true,
          closed_at: timestamp,
          closed_by: stepBData.verified_by,
          updated_at: timestamp,
        };
        return updatedOrderRecord;
      }
      return o;
    });

    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    try {
      await supabase
        .from('orders')
        .update({
          return_status_exec: 'Verified',
          return_notes_exec: notes,
          return_verified_at: timestamp,
          lifecycle_status: 'Verified_Closed',
          status: 'CLOSED',
          is_archived_or_closed: true,
          is_locked: true,
          closed_at: timestamp,
          closed_by: stepBData.verified_by,
          updated_at: timestamp,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase confirmWarehouseReturn warning:', e);
    }

    // 2. Return all serialized props back to Available in warehouse
    const items = await this.getOrderItems(orderId);
    for (const item of items) {
      if (item.prop_serialized_item_id) {
        await inventoryService.updateSerializedItemStatus(
          item.prop_serialized_item_id,
          'Available',
          stepBData.warehouse_condition_rating === 'Damaged' ? 'Minor Wear' : stepBData.warehouse_condition_rating === 'Pristine' ? 'Brand New' : 'Good',
          `Checked in & verified from Order ${order.order_number} by ${stepBData.verified_by}`
        );
      }
    }

    // 3. Auto-generate final commercial invoice snapshot
    try {
      await this.generateFinalInvoice(orderId);
    } catch (invErr) {
      console.warn('Auto invoice generation notice:', invErr);
    }

    // 4. Broadcast return verification & closed state
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({
        type: 'ORDER_CLOSED',
        orderId,
        orderNumber: order.order_number,
        order: updatedOrderRecord,
        timestamp,
      });
      bc.close();
    }

    return updatedOrderRecord;
  },

  // Helper: Get strictly active orders (excludes closed/archived/completed)
  async getActiveOrders(): Promise<WalkInOrder[]> {
    const orders = await this.getOrders();
    return orders.filter(
      (o) => !isOrderLocked(o) && !o.is_archived_or_closed && o.status !== 'CLOSED' && o.status !== 'Returned'
    );
  },

  // Helper: Get archived / completed orders
  async getCompletedOrders(): Promise<WalkInOrder[]> {
    const orders = await this.getOrders();
    return orders.filter(
      (o) => isOrderLocked(o) || o.is_archived_or_closed || o.status === 'CLOSED' || o.status === 'Returned'
    );
  },

  // 20. Generate Final Invoice (Unlocks upon Confirm Return & auto-pushes to Invoices tab)
  async generateFinalInvoice(orderId: string): Promise<FinalInvoiceRecord> {
    const order = await this.getOrderById(orderId);
    if (!order) throw new Error('Order not found for invoice generation');

    const items = await this.getOrderItems(orderId);
    const actualDays = order.actual_shoot_days || order.rental_days || order.duration_days || 3;
    const invNumber = `INV-${order.order_number.replace('ASH-', '').replace('ORD-', '')}`;

    const lineItems = items.map((item) => {
      const lineTotal = item.daily_rent_price * actualDays;
      return {
        id: item.id,
        prop_title: item.prop_title,
        prop_category: item.prop_category,
        item_code: item.item_code,
        image_url: item.image_url || 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=400',
        daily_rental_rate: item.daily_rent_price,
        actual_days: actualDays,
        line_total: lineTotal,
        replacement_value: item.replacement_value,
      };
    });

    const baseRentalSubtotal = lineItems.reduce((acc, i) => acc + i.line_total, 0);
    const laborCharges = order.total_labor_charges || 0;
    const damagePenalties = order.damage_deduction_amount || 0;
    const gstTax = Math.round((baseRentalSubtotal + laborCharges) * 0.18);
    const grossTotal = baseRentalSubtotal + laborCharges + damagePenalties + gstTax;
    const advanceDeduction = order.advance_amount || 0;
    const finalBalanceDue = Math.max(0, grossTotal - advanceDeduction);

    const invoiceRecord: FinalInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoice_number: invNumber,
      order_id: order.id,
      order_number: order.order_number,
      client_name: order.client_name,
      client_email: order.client_email,
      client_phone: order.client_phone,
      production_name: order.production_name || order.movie_project_name,
      shoot_location: order.shoot_location || 'Soundstage Hyderabad',
      vehicle_no: order.vehicle_number || order.vehicle_no || 'TS 09 UA 8842',
      start_date: order.rental_start_date,
      end_date: order.rental_end_date,
      actual_shoot_days: actualDays,
      base_rental_subtotal: baseRentalSubtotal,
      handling_labor_charges: laborCharges,
      damage_penalties: damagePenalties,
      gst_tax_amount: gstTax,
      gross_total: grossTotal,
      advance_deduction: advanceDeduction,
      final_balance_due: finalBalanceDue,
      items: lineItems,
      status: finalBalanceDue === 0 ? 'Paid' : 'Issued',
      created_at: new Date().toISOString(),
    };

    // Store into persistent invoices list
    const invoices = getStored<FinalInvoiceRecord[]>(STORAGE_FINAL_INVOICES_KEY, []);
    const filteredInvoices = invoices.filter((inv) => inv.order_id !== orderId);
    setStored(STORAGE_FINAL_INVOICES_KEY, [invoiceRecord, ...filteredInvoices]);

    // Mark order as final invoice generated
    const currentOrders = getStored<WalkInOrder[]>(STORAGE_ORDERS_KEY, getInitialOrders());
    const updatedOrders = currentOrders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            final_invoice_generated: true,
            final_invoice_id: invNumber,
            updated_at: new Date().toISOString(),
          }
        : o
    );
    setStored(STORAGE_ORDERS_KEY, updatedOrders);

    // Save to Supabase
    try {
      await supabase.from('final_invoices').upsert([
        {
          invoice_number: invoiceRecord.invoice_number,
          order_id: invoiceRecord.order_id,
          order_number: invoiceRecord.order_number,
          client_name: invoiceRecord.client_name,
          client_email: invoiceRecord.client_email,
          client_phone: invoiceRecord.client_phone,
          production_name: invoiceRecord.production_name,
          shoot_location: invoiceRecord.shoot_location,
          vehicle_no: invoiceRecord.vehicle_no,
          start_date: invoiceRecord.start_date,
          end_date: invoiceRecord.end_date,
          actual_shoot_days: invoiceRecord.actual_shoot_days,
          base_rental_subtotal: invoiceRecord.base_rental_subtotal,
          handling_labor_charges: invoiceRecord.handling_labor_charges,
          damage_penalties: invoiceRecord.damage_penalties,
          gst_tax_amount: invoiceRecord.gst_tax_amount,
          gross_total: invoiceRecord.gross_total,
          advance_deduction: invoiceRecord.advance_deduction,
          final_balance_due: invoiceRecord.final_balance_due,
          items_snapshot: invoiceRecord.items,
          status: invoiceRecord.status,
        },
      ]);

      await supabase
        .from('orders')
        .update({
          final_invoice_generated: true,
          final_invoice_id: invNumber,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase invoice save warning:', e);
    }

    return invoiceRecord;
  },

  // 21. Get All Final Invoices (for Revenue & Reports Invoices tab)
  async getFinalInvoices(): Promise<FinalInvoiceRecord[]> {
    return getStored<FinalInvoiceRecord[]>(STORAGE_FINAL_INVOICES_KEY, []);
  },

  // 22. Get Final Invoice by Order ID
  async getFinalInvoiceByOrderId(orderId: string): Promise<FinalInvoiceRecord | null> {
    const invoices = await this.getFinalInvoices();
    return invoices.find((inv) => inv.order_id === orderId) || null;
  },
};
