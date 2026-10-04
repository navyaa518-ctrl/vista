// ============================================================================
// ASHWA MOVIE PROPERTY RENTALS: CENTRALIZED USER ACTION AUDIT INTERCEPTOR
// ============================================================================

import { supabase } from '@/lib/supabase/client';
import { StaffActivityLog } from '@/types/staff';

const STORAGE_STAFF_ACTIVITY_KEY = 'ashwa_staff_activity_logs_v1';

// Initial seed activities for offline & test resilience
const INITIAL_ACTIVITY_LOGS: StaffActivityLog[] = [
  {
    id: 'act-00000001-0000-0000-0000-000000000001',
    user_id: 'stf-00000002-0000-0000-0000-000000000002',
    staff_name: 'Ravi Kumar',
    action_type: 'ORDER_DISPATCHED',
    target_entity: 'ORDER',
    entity_id: 'ORD-2026-089',
    metadata: {
      client: 'Mythri Movie Makers',
      project: 'Pushpa 3',
      propsCount: 18,
      vehicleNo: 'TS09-UB-4421',
      dispatchDriver: 'K. Ramana',
    },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'act-00000002-0000-0000-0000-000000000002',
    user_id: 'stf-00000005-0000-0000-0000-000000000005',
    staff_name: 'K. Sunita Devi',
    action_type: 'PROPERTY_INSPECTED',
    target_entity: 'INSPECTION',
    entity_id: 'AUD-2026-003',
    metadata: {
      zone: 'Floor 1 > Godown A',
      propsAudited: 15,
      accuracy: 93,
      flaggedDamaged: 1,
      notes: 'Hilt loose on ceremonial dagger; routed to armorer.',
    },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'act-00000003-0000-0000-0000-000000000003',
    user_id: 'stf-00000001-0000-0000-0000-000000000001',
    staff_name: 'Arun Reddy',
    action_type: 'INVOICE_CREATED',
    target_entity: 'BILLING',
    entity_id: 'INV-2026-041',
    metadata: {
      client: 'Vyjayanthi Movies',
      totalAmount: 185000,
      depositAmount: 50000,
      mode: 'NEFT',
      gstNumber: '36AABCU9603R1ZM',
    },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'act-00000004-0000-0000-0000-000000000004',
    user_id: 'stf-00000004-0000-0000-0000-000000000004',
    staff_name: 'Mohan Babu',
    action_type: 'RETURN_CLEARED',
    target_entity: 'ORDER',
    entity_id: 'ORD-2026-085',
    metadata: {
      client: 'Suresh Productions',
      itemsReturned: 12,
      transitStatus: 'SAFE_UNLOADED',
      penaltyAmount: 0,
    },
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

// Fallback Memory Store for Node.js test environment
const memoryStore = new Map<string, string>();

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    const raw = memoryStore.get(key);
    if (!raw) {
      memoryStore.set(key, JSON.stringify(fallback));
      return fallback;
    }
    try {
      return JSON.parse(raw);
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

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    memoryStore.set(key, JSON.stringify(value));
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode
  }
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new BroadcastChannel('ashwa_staff_activity_bus');
  }
  return null;
}

export const auditLogService = {
  // 1. Generic Audit Action Logger
  async logStaffAction(entry: {
    user_id: string;
    staff_name: string;
    action_type: string;
    target_entity: string;
    entity_id: string;
    metadata?: Record<string, any>;
  }): Promise<StaffActivityLog> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `act-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newLog: StaffActivityLog = {
      id,
      user_id: entry.user_id,
      staff_name: entry.staff_name,
      action_type: entry.action_type,
      target_entity: entry.target_entity,
      entity_id: entry.entity_id,
      metadata: entry.metadata || {},
      created_at: timestamp,
    };

    // 1. Persist to Supabase if accessible
    try {
      await supabase.from('staff_activity_logs').insert(newLog);
    } catch (e) {
      console.warn('Supabase staff_activity_logs insert fallback to local:', e);
    }

    // 2. Persist to Local/Memory Store
    const current = getStored<StaffActivityLog[]>(STORAGE_STAFF_ACTIVITY_KEY, INITIAL_ACTIVITY_LOGS);
    const updated = [newLog, ...current];
    setStored(STORAGE_STAFF_ACTIVITY_KEY, updated);

    // 3. Broadcast Realtime Notification
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type: 'STAFF_ACTION_LOGGED', log: newLog });
      bc.close();
    }

    return newLog;
  },

  // 2. Specialized Hook: Log Order Dispatched
  async logOrderDispatched(
    staffId: string,
    staffName: string,
    orderId: string,
    clientName: string,
    propsCount: number,
    vehicleNo?: string
  ): Promise<StaffActivityLog> {
    return this.logStaffAction({
      user_id: staffId,
      staff_name: staffName,
      action_type: 'ORDER_DISPATCHED',
      target_entity: 'ORDER',
      entity_id: orderId,
      metadata: {
        client: clientName,
        propsCount,
        vehicleNo: vehicleNo || 'Self-Pickup / Lorry Unassigned',
      },
    });
  },

  // 3. Specialized Hook: Log Property Health Checks
  async logPropertyInspected(
    staffId: string,
    staffName: string,
    taskId: string,
    rackOrZone: string,
    propsCount: number,
    condition?: string
  ): Promise<StaffActivityLog> {
    return this.logStaffAction({
      user_id: staffId,
      staff_name: staffName,
      action_type: 'PROPERTY_INSPECTED',
      target_entity: 'INSPECTION',
      entity_id: taskId,
      metadata: {
        zoneOrRack: rackOrZone,
        propsAudited: propsCount,
        conditionReported: condition || 'GOOD',
      },
    });
  },

  // 4. Specialized Hook: Log Invoice Created
  async logInvoiceCreated(
    staffId: string,
    staffName: string,
    invoiceId: string,
    clientName: string,
    totalAmount: number,
    depositAmount?: number
  ): Promise<StaffActivityLog> {
    return this.logStaffAction({
      user_id: staffId,
      staff_name: staffName,
      action_type: 'INVOICE_CREATED',
      target_entity: 'BILLING',
      entity_id: invoiceId,
      metadata: {
        client: clientName,
        totalAmount,
        depositAmount: depositAmount || 0,
      },
    });
  },

  // 5. Specialized Hook: Log Return Clearance Approved
  async logReturnClearance(
    staffId: string,
    staffName: string,
    orderId: string,
    clientName: string,
    itemsReturnedCount: number,
    penaltyAmount?: number
  ): Promise<StaffActivityLog> {
    return this.logStaffAction({
      user_id: staffId,
      staff_name: staffName,
      action_type: 'RETURN_CLEARED',
      target_entity: 'ORDER',
      entity_id: orderId,
      metadata: {
        client: clientName,
        itemsReturned: itemsReturnedCount,
        penaltyAmount: penaltyAmount || 0,
      },
    });
  },

  // 6. Fetch Logs for a Specific Staff Member
  async getStaffActivityLogs(staffId: string, limit: number = 50): Promise<StaffActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('staff_activity_logs')
        .select('*')
        .eq('user_id', staffId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as StaffActivityLog[];
      }
    } catch (e) {
      console.warn('Supabase getStaffActivityLogs fallback:', e);
    }

    const all = getStored<StaffActivityLog[]>(STORAGE_STAFF_ACTIVITY_KEY, INITIAL_ACTIVITY_LOGS);
    return all.filter((l) => l.user_id === staffId).slice(0, limit);
  },

  // 7. Fetch All Organization Logs with Filter Capabilities
  async getAllActivityLogs(filter?: {
    actionType?: string;
    targetEntity?: string;
    search?: string;
    limit?: number;
  }): Promise<StaffActivityLog[]> {
    const limit = filter?.limit || 100;
    try {
      let query = supabase.from('staff_activity_logs').select('*');
      if (filter?.actionType && filter.actionType !== 'ALL') {
        query = query.eq('action_type', filter.actionType);
      }
      if (filter?.targetEntity && filter.targetEntity !== 'ALL') {
        query = query.eq('target_entity', filter.targetEntity);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (!error && data && data.length > 0) {
        return data as StaffActivityLog[];
      }
    } catch (e) {
      console.warn('Supabase getAllActivityLogs fallback:', e);
    }

    let all = getStored<StaffActivityLog[]>(STORAGE_STAFF_ACTIVITY_KEY, INITIAL_ACTIVITY_LOGS);
    if (filter?.actionType && filter.actionType !== 'ALL') {
      all = all.filter((l) => l.action_type === filter.actionType);
    }
    if (filter?.targetEntity && filter.targetEntity !== 'ALL') {
      all = all.filter((l) => l.target_entity === filter.targetEntity);
    }
    if (filter?.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      all = all.filter(
        (l) =>
          l.staff_name.toLowerCase().includes(q) ||
          l.entity_id.toLowerCase().includes(q) ||
          l.action_type.toLowerCase().includes(q)
      );
    }
    return all.slice(0, limit);
  },
};
