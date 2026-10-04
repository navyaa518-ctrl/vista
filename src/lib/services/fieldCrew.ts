import { supabase } from '@/lib/supabase/client';
import { inventoryService } from './inventory';
import { ordersService } from './orders';
import { WalkInOrder } from '@/types/orders';
import {
  FieldWorkerProfile,
  OrderFieldCrewAssignment,
  CreateDamageIncidentInput,
  DamageIncidentRecord,
  FieldInspectionChecklist,
  ReturnHandoverChecklist,
} from '@/types/fieldCrew';

const STORAGE_KEY_CREW = 'ashwa_order_field_crew_v1';
const STORAGE_KEY_INCIDENTS = 'ashwa_prop_damage_incidents_v1';
const STORAGE_KEY_INSPECTIONS = 'ashwa_field_inspections_v1';
const STORAGE_KEY_HANDOVERS = 'ashwa_return_handovers_v1';

export const INITIAL_FIELD_WORKERS: FieldWorkerProfile[] = [
  {
    id: 'fw-001',
    full_name: 'Ramesh Babu',
    email: 'fieldcrew@aswamovies.com',
    phone: '+91 98491 22334',
    role: 'field_worker',
    designation: 'Senior Prop Handling Specialist',
    badge_number: 'ASH-FW-01',
    assigned_team: 'Field Operations / Fleet',
    status: 'Available',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fw-002',
    full_name: 'Govind Raj',
    email: 'govind.raj@aswamovies.com',
    phone: '+91 98492 33445',
    role: 'field_worker',
    designation: 'Heavy Cargo & Rigging Crew Lead',
    badge_number: 'ASH-FW-02',
    assigned_team: 'Field Operations / Fleet',
    status: 'Available',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fw-003',
    full_name: 'Anand Kumar',
    email: 'anand.kumar@aswamovies.com',
    phone: '+91 98493 44556',
    role: 'field_worker',
    designation: 'Fragile Glass & Camera Optics Handler',
    badge_number: 'ASH-FW-03',
    assigned_team: 'Field Operations / Fleet',
    status: 'Available',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'fw-004',
    full_name: 'Mahesh Rao',
    email: 'mahesh.rao@aswamovies.com',
    phone: '+91 98494 55667',
    role: 'field_worker',
    designation: 'Set Transit & Rigging Specialist',
    badge_number: 'ASH-FW-04',
    assigned_team: 'Field Operations / Fleet',
    status: 'Available',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
  },
];

const INITIAL_INCIDENTS: DamageIncidentRecord[] = [
  {
    id: 'inc-001',
    incident_number: 'ASH-DMG-2026-001',
    order_id: 'ord-walkin-001',
    order_number: 'ASH-ORD-2026-0881',
    movie_project_name: 'Pushpa 2: The Rule (Forest Action Sequence)',
    client_name: 'Mythri Movie Makers',
    prop_serialized_item_id: 'ser-001',
    prop_title: '1940s Vintage British Field Artillery Telescope',
    item_code: 'ASH-OPT-1942-01',
    prop_category: 'Vintage Optics',
    replacement_value: 85000,
    reported_by: 'fw-001',
    reported_by_name: 'Ramesh Babu (Senior Field Crew)',
    severity: 'Moderate',
    description: 'Brass mount arm loosened and front objective glass cracked during crane maneuver in rain sequence.',
    evidence_photos: [
      'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516962215378-7fa2e137ae93?w=800&auto=format&fit=crop&q=80',
    ],
    shoot_location: 'Ramoji Film City, Studio Floor 14 - Rain Sequence',
    repair_or_replacement_cost: 25500,
    status: 'Pending_Review',
    manager_notes: 'Optical lens polishing and brass mount re-machining required by armory workshop.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
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

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    memoryStore.set(key, JSON.stringify(value));
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}


export const fieldCrewService = {
  // 1. Get Available In-House Field Workers
  async getAvailableFieldWorkers(): Promise<FieldWorkerProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'field_worker');

      if (data && data.length > 0 && !error) {
        return data.map((p) => ({
          id: p.id,
          full_name: p.full_name || 'Field Crew Specialist',
          email: p.email,
          phone: p.phone || '+91 98490 00000',
          role: 'field_worker',
          designation: 'Prop Handling & Rigging Specialist',
          badge_number: `ASH-FW-${p.id.slice(0, 4).toUpperCase()}`,
          assigned_team: 'Field Operations / Fleet',
          status: 'Available',
          avatar_url: INITIAL_FIELD_WORKERS[0].avatar_url,
        }));
      }
    } catch {
      // Fallback
    }
    return INITIAL_FIELD_WORKERS;
  },

  // 2. Assign Field Crew to an Order
  async assignOrderCrew(
    orderId: string,
    crewType: 'in_house' | 'client_sourced',
    inHouseWorkers: FieldWorkerProfile[],
    clientCrew: Array<{ id: string; name: string; phone: string; govt_id_or_notes?: string }>,
    dailyWage: number = 1000,
    durationDays: number = 3
  ): Promise<{ success: boolean; totalLaborCharges: number }> {
    const totalLaborCharges =
      crewType === 'in_house' ? inHouseWorkers.length * dailyWage * durationDays : 0;

    const storedCrew = getStored<OrderFieldCrewAssignment[]>(STORAGE_KEY_CREW, []);
    const filteredCrew = storedCrew.filter((c) => c.order_id !== orderId);

    const newAssignments: OrderFieldCrewAssignment[] =
      crewType === 'in_house'
        ? inHouseWorkers.map((w) => ({
            id: `crew-${Date.now()}-${w.id}`,
            order_id: orderId,
            crew_type: 'in_house',
            worker_id: w.id,
            worker_name: w.full_name,
            worker_phone: w.phone,
            daily_wage: dailyWage,
            assigned_at: new Date().toISOString(),
          }))
        : clientCrew.map((c) => ({
            id: `crew-${Date.now()}-${c.id}`,
            order_id: orderId,
            crew_type: 'client_sourced',
            external_name: c.name,
            external_phone: c.phone,
            external_govt_id: c.govt_id_or_notes,
            daily_wage: 0,
            assigned_at: new Date().toISOString(),
          }));

    setStored(STORAGE_KEY_CREW, [...filteredCrew, ...newAssignments]);

    try {
      // Sync to Supabase order_field_crew
      await supabase.from('order_field_crew').delete().eq('order_id', orderId);

      const dbRows = newAssignments.map((a) => ({
        order_id: a.order_id,
        crew_type: a.crew_type,
        worker_id: a.crew_type === 'in_house' && a.worker_id && !a.worker_id.startsWith('fw-') ? a.worker_id : null,
        external_name: a.external_name,
        external_phone: a.external_phone,
        external_govt_id: a.external_govt_id,
        daily_wage: a.daily_wage,
        assigned_at: a.assigned_at,
      }));

      await supabase.from('order_field_crew').insert(dbRows);

      // Update orders table
      await supabase
        .from('orders')
        .update({
          crew_type: crewType,
          total_labor_charges: totalLaborCharges,
          in_house_worker_count: inHouseWorkers.length,
          daily_wage_rate: dailyWage,
          client_sourced_crew: clientCrew,
        })
        .eq('id', orderId);
    } catch (e) {
      console.warn('Supabase crew assignment warning:', e);
    }

    return { success: true, totalLaborCharges };
  },

  // 3. Get Field Crew for an Order
  async getOrderCrew(orderId: string): Promise<OrderFieldCrewAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('order_field_crew')
        .select('*')
        .eq('order_id', orderId);

      if (data && data.length > 0 && !error) {
        return data as OrderFieldCrewAssignment[];
      }
    } catch {
      // Fallback
    }

    const stored = getStored<OrderFieldCrewAssignment[]>(STORAGE_KEY_CREW, []);
    return stored.filter((c) => c.order_id === orderId);
  },

  // 4. Get Tasks Assigned to a Specific Field Worker
  async getFieldWorkerTasks(workerId?: string): Promise<WalkInOrder[]> {
    const allOrders = await ordersService.getOrders();
    const allCrew = getStored<OrderFieldCrewAssignment[]>(STORAGE_KEY_CREW, []);

    // If workerId is provided, filter by assigned orders; if none assigned or demo, show active dispatched orders
    const assignedOrderIds = new Set(
      allCrew
        .filter((c) => !workerId || c.worker_id === workerId || workerId === 'all')
        .map((c) => c.order_id)
    );

    return allOrders.filter((o: WalkInOrder) => {
      if (assignedOrderIds.has(o.id)) return true;
      // Also show active orders in pipeline for demonstration/field lead testing
      return (
        o.status === 'DISPATCHED_RENTAL_PIPELINE' ||
        o.status === 'Dispatched' ||
        o.status === 'PICKING_IN_PROGRESS' ||
        o.status === 'Picking_In_Progress'
      );
    });
  },

  // 5. Pre-Dispatch Verification Checklist
  async verifyPreDispatchInspection(checklist: FieldInspectionChecklist): Promise<boolean> {
    const stored = getStored<FieldInspectionChecklist[]>(STORAGE_KEY_INSPECTIONS, []);
    const filtered = stored.filter((i) => i.order_id !== checklist.order_id);
    setStored(STORAGE_KEY_INSPECTIONS, [...filtered, checklist]);
    return true;
  },

  async getPreDispatchInspection(orderId: string): Promise<FieldInspectionChecklist | null> {
    const stored = getStored<FieldInspectionChecklist[]>(STORAGE_KEY_INSPECTIONS, []);
    return stored.find((i) => i.order_id === orderId) || null;
  },

  // 6. Return Handover Check-in
  async verifyReturnHandover(handover: ReturnHandoverChecklist): Promise<boolean> {
    const stored = getStored<ReturnHandoverChecklist[]>(STORAGE_KEY_HANDOVERS, []);
    const filtered = stored.filter((h) => h.order_id !== handover.order_id);
    setStored(STORAGE_KEY_HANDOVERS, [...filtered, handover]);
    return true;
  },

  async getReturnHandover(orderId: string): Promise<ReturnHandoverChecklist | null> {
    const stored = getStored<ReturnHandoverChecklist[]>(STORAGE_KEY_HANDOVERS, []);
    return stored.find((h) => h.order_id === orderId) || null;
  },

  // 7. Upload Damage Evidence Photo to Supabase Storage
  async uploadDamagePhoto(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `dmg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `evidence/${fileName}`;

      const { data, error } = await supabase.storage
        .from('props-damage-evidence')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('props-damage-evidence')
          .getPublicUrl(filePath);
        return publicData.publicUrl;
      }
    } catch (e) {
      console.warn('Storage upload error, using local data URL fallback:', e);
    }

    // Local FileReader fallback so evidence is never lost
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  },

  // 8. Report On-Site Damage Incident
  async reportDamageIncident(input: CreateDamageIncidentInput): Promise<DamageIncidentRecord> {
    const currentIncidents = getStored<DamageIncidentRecord[]>(STORAGE_KEY_INCIDENTS, INITIAL_INCIDENTS);
    const order = await ordersService.getOrderById(input.order_id);
    const incidentCount = currentIncidents.length + 1;
    const seqStr = String(incidentCount).padStart(3, '0');
    const incidentNumber = `ASH-DMG-2026-${seqStr}`;

    // Calculate penalty based on severity or custom override
    let penaltyCost = input.custom_penalty_amount;
    if (penaltyCost === undefined || penaltyCost === null) {
      const replValue = 50000; // default baseline if not provided
      switch (input.severity) {
        case 'Minor':
          penaltyCost = Math.round(replValue * 0.1); // 10% penalty
          break;
        case 'Moderate':
          penaltyCost = Math.round(replValue * 0.3); // 30% repair penalty
          break;
        case 'Total_Loss':
          penaltyCost = Math.round(replValue * 1.0); // 100% full replacement
          break;
      }
    }

    const newIncident: DamageIncidentRecord = {
      id: `dmg-${Date.now()}`,
      incident_number: incidentNumber,
      order_id: input.order_id,
      order_number: order?.order_number || 'ASH-ORD-2026',
      movie_project_name: order?.movie_project_name || 'Active Movie Production',
      client_name: order?.client_name || 'Production Company',
      prop_serialized_item_id: input.prop_serialized_item_id,
      prop_title: input.prop_title,
      item_code: input.item_code,
      replacement_value: penaltyCost * 2 || 50000,
      reported_by: input.reported_by,
      reported_by_name: input.reported_by_name || 'Ramesh Babu (Field Operations Crew)',
      severity: input.severity,
      description: input.description,
      evidence_photos: input.evidence_photos,
      shoot_location: input.shoot_location || order?.shoot_location || 'Film Set Floor',
      repair_or_replacement_cost: penaltyCost,
      status: 'Pending_Review',
      created_at: new Date().toISOString(),
    };

    // Save locally
    setStored(STORAGE_KEY_INCIDENTS, [newIncident, ...currentIncidents]);

    // 1. Update prop_serialized_items condition to 'Damaged' or 'Maintenance Required'
    try {
      await inventoryService.updateSerializedItemStatus(
        input.prop_serialized_item_id,
        'Damaged',
        'Maintenance Required',
        `Damaged on set during ${order?.movie_project_name || 'shoot'}. Ticket: ${incidentNumber}`
      );
    } catch (e) {
      console.warn('Inventory status update warning:', e);
    }

    // 2. Persist to Supabase if table exists
    try {
      await supabase.from('prop_damage_incidents').insert({
        incident_number: newIncident.incident_number,
        order_id: newIncident.order_id,
        prop_serialized_item_id: newIncident.prop_serialized_item_id,
        reported_by: newIncident.reported_by && !newIncident.reported_by.startsWith('fw-') ? newIncident.reported_by : null,
        severity: newIncident.severity,
        description: newIncident.description,
        evidence_photos: newIncident.evidence_photos,
        shoot_location: newIncident.shoot_location,
        repair_or_replacement_cost: newIncident.repair_or_replacement_cost,
        status: newIncident.status,
        created_at: newIncident.created_at,
      });
    } catch (e) {
      console.warn('Supabase incident ticket insert warning:', e);
    }

    // 3. Dispatch real-time alert event across tabs & windows
    if (typeof window !== 'undefined') {
      const alertPayload = {
        id: `alert-dmg-${Date.now()}`,
        category: 'damage_alert',
        title: `🚨 Damage Alert: ${incidentNumber}`,
        description: `${input.prop_title} (${input.item_code}) marked ${input.severity} by ${newIncident.reported_by_name}. Debit Note: ₹${penaltyCost.toLocaleString('en-IN')}`,
        time: 'Just now',
        read: false,
        incident: newIncident,
      };

      // Broadcast storage event for multi-tab sync
      try {
        window.dispatchEvent(new CustomEvent('ashwa_damage_incident', { detail: alertPayload }));
        const currentAlerts = getStored<any[]>('ashwa_realtime_notifications', []);
        setStored('ashwa_realtime_notifications', [alertPayload, ...currentAlerts.slice(0, 19)]);
      } catch (e) {
        console.warn('Alert broadcast warning:', e);
      }
    }

    return newIncident;
  },

  // 9. Get Damage Incidents for an Order
  async getOrderDamageIncidents(orderId: string): Promise<DamageIncidentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('prop_damage_incidents')
        .select('*')
        .eq('order_id', orderId);

      if (data && data.length > 0 && !error) {
        return data as any;
      }
    } catch {
      // Fallback
    }

    const currentIncidents = getStored<DamageIncidentRecord[]>(STORAGE_KEY_INCIDENTS, INITIAL_INCIDENTS);
    return currentIncidents.filter((inc) => inc.order_id === orderId);
  },

  // 10. Get All Damage Incidents
  async getAllDamageIncidents(): Promise<DamageIncidentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('prop_damage_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0 && !error) {
        return data as any;
      }
    } catch {
      // Fallback
    }
    return getStored<DamageIncidentRecord[]>(STORAGE_KEY_INCIDENTS, INITIAL_INCIDENTS);
  },

  // 11. Update Damage Incident Status (e.g. Billed_To_Client, Settled)
  async updateIncidentStatus(
    incidentId: string,
    status: 'Pending_Review' | 'Billed_To_Client' | 'Waived' | 'Settled',
    managerNotes?: string
  ): Promise<boolean> {
    const currentIncidents = getStored<DamageIncidentRecord[]>(STORAGE_KEY_INCIDENTS, INITIAL_INCIDENTS);
    const updated = currentIncidents.map((inc) =>
      inc.id === incidentId
        ? {
            ...inc,
            status,
            manager_notes: managerNotes !== undefined ? managerNotes : inc.manager_notes,
            settled_at: status === 'Settled' ? new Date().toISOString() : inc.settled_at,
          }
        : inc
    );
    setStored(STORAGE_KEY_INCIDENTS, updated);

    try {
      await supabase
        .from('prop_damage_incidents')
        .update({
          status,
          manager_notes: managerNotes,
          settled_at: status === 'Settled' ? new Date().toISOString() : null,
        })
        .eq('id', incidentId);
    } catch {
      // Fallback
    }
    return true;
  },

  // 12. Subscribe to Realtime Damage Incidents
  subscribeToIncidents(onChange: (payload: any) => void) {
    const channel = supabase
      .channel('prop_damage_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prop_damage_incidents' }, (payload) => {
        onChange(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};

