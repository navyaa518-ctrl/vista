import { supabase } from '@/lib/supabase/client';
import { ordersService } from './orders';
import {
  CrewMember360,
  ActiveShootDeployment,
  CrewSwapRequest,
  CrewSwapResult,
  EnrichedCrewAssignment,
  EnrichedFieldLogEntry,
  BroadcastAnnouncement,
  CrewProjectHistoryRecord,
} from '@/types/crewHub';
import { LaborSheetEntry } from '@/types/orders';
import {
  OrderCrewAssignment,
  OrderExternalCrew,
  CrewFieldLog,
  CrewFieldLogType,
} from '@/types/database';

const STORAGE_KEY_CREW_ASSIGNMENTS = 'ashwa_order_crew_assignments_v1';
const STORAGE_KEY_EXTERNAL_CREW = 'ashwa_order_external_crew_v1';
const STORAGE_KEY_FIELD_LOGS = 'ashwa_crew_field_logs_v1';
const STORAGE_KEY_ANNOUNCEMENTS = 'ashwa_crew_broadcasts_v1';

const memoryStore = new Map<string, string>();

function getStoredJson<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') {
    const raw = memoryStore.get(key);
    if (!raw) return defaultVal;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultVal;
    }
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setStoredJson<T>(key: string, val: T): void {
  const serialized = JSON.stringify(val);
  if (typeof window === 'undefined') {
    memoryStore.set(key, serialized);
  } else {
    try {
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }
}

// ===================================================================
// INITIAL SEED DATA: CREW MEMBERS (ROSTER & 360° PROFILES)
// ===================================================================
export const SEED_CREW_MEMBERS: CrewMember360[] = [
  {
    id: 'cw-001',
    full_name: 'Ramesh Kumar',
    badge_number: 'ASH-CW-01',
    role: 'crew',
    designation: 'Senior Prop Rigging & Handling Specialist',
    phone: '+91 98491 22334',
    email: 'ramesh.kumar@aswamovies.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    emergency_contact: {
      name: 'K. Padma (Spouse)',
      relationship: 'Spouse',
      phone: '+91 98491 99881',
    },
    skills_and_certifications: {
      license_type: 'Heavy Commercial Vehicle (HMV) - TS-09-2018',
      heavy_rigging_certified: true,
      fragile_optics_handling: true,
      film_industry_experience_years: 9,
    },
    status: 'On_Shoot',
    current_deployment: {
      order_id: 'ord-walkin-001',
      order_number: 'ASH-ORD-2026-0881',
      movie_project_name: 'Pushpa 2: The Rule',
      shoot_location: 'Ramoji Film City, Studio Floor 14 - Rain Sequence',
      start_date: '2026-09-16',
      end_date: '2026-09-20',
    },
    analytics: {
      total_shoots_completed: 38,
      total_days_deployed: 142,
      cumulative_lifetime_earnings: 145000,
      clean_record_score: 100,
      total_damage_incidents: 0,
      rating: 4.95,
    },
    project_history: [
      {
        id: 'hist-001',
        order_id: 'ord-walkin-001',
        order_number: 'ASH-ORD-2026-0881',
        movie_title: 'Pushpa 2: The Rule (Forest Action Sequence)',
        production_company: 'Mythri Movie Makers',
        shoot_location: 'Ramoji Film City, Studio Floor 14',
        start_date: '2026-09-16',
        end_date: '2026-09-20',
        days_deployed: 5,
        daily_wage: 1000,
        total_earned: 5000,
        status: 'Active',
        role_on_set: 'Lead Prop Handler',
        damage_incidents_logged: 0,
        gate_pass_number: 'GP-2026-DISPATCH',
      },
      {
        id: 'hist-002',
        order_id: 'ord-hist-012',
        order_number: 'ASH-ORD-2026-0742',
        movie_title: 'Kalki 2898 AD (Post-Apocalyptic Set)',
        production_company: 'Vyjayanthi Movies',
        shoot_location: 'Shamshabad Outdoor Lot 3',
        start_date: '2026-08-10',
        end_date: '2026-08-18',
        days_deployed: 9,
        daily_wage: 1000,
        total_earned: 9000,
        status: 'Completed',
        role_on_set: 'Senior Armory & Weaponry Rigging',
        damage_incidents_logged: 0,
        gate_pass_number: 'GP-2026-0742-A',
      },
      {
        id: 'hist-003',
        order_id: 'ord-hist-009',
        order_number: 'ASH-ORD-2026-0610',
        movie_title: 'Salaar: Part 2 – Shouryaanga Parvam',
        production_company: 'Hombale Films',
        shoot_location: 'Annapurna 7-Acre Set',
        start_date: '2026-07-02',
        end_date: '2026-07-08',
        days_deployed: 7,
        daily_wage: 1000,
        total_earned: 7000,
        status: 'Completed',
        role_on_set: 'Lead Transit Handler',
        damage_incidents_logged: 0,
        gate_pass_number: 'GP-2026-0610-B',
      },
      {
        id: 'hist-004',
        order_id: 'ord-hist-005',
        order_number: 'ASH-ORD-2026-0422',
        movie_title: 'Devara: Part 1 (Coastal Port Action)',
        production_company: 'Yuvasudha Arts & NTR Arts',
        shoot_location: 'Sarathi Studios, Stage 2',
        start_date: '2026-05-14',
        end_date: '2026-05-22',
        days_deployed: 9,
        daily_wage: 1000,
        total_earned: 9000,
        status: 'Completed',
        role_on_set: 'Heavy Marine Prop Rigging',
        damage_incidents_logged: 0,
        gate_pass_number: 'GP-2026-0422-C',
      },
    ],
  },
  {
    id: 'cw-002',
    full_name: 'Suresh Varma',
    badge_number: 'ASH-CW-02',
    role: 'crew',
    designation: 'Heavy Transit & Armory Loader',
    phone: '+91 98492 33445',
    email: 'suresh.varma@aswamovies.com',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    emergency_contact: {
      name: 'V. Rajesh (Brother)',
      relationship: 'Brother',
      phone: '+91 98492 77665',
    },
    skills_and_certifications: {
      license_type: 'Heavy Transport Lorry License - TS-10-2020',
      heavy_rigging_certified: true,
      fragile_optics_handling: false,
      film_industry_experience_years: 7,
    },
    status: 'On_Shoot',
    current_deployment: {
      order_id: 'ord-walkin-001',
      order_number: 'ASH-ORD-2026-0881',
      movie_project_name: 'Pushpa 2: The Rule',
      shoot_location: 'Ramoji Film City, Studio Floor 14 - Rain Sequence',
      start_date: '2026-09-16',
      end_date: '2026-09-20',
    },
    analytics: {
      total_shoots_completed: 31,
      total_days_deployed: 118,
      cumulative_lifetime_earnings: 122000,
      clean_record_score: 96.8,
      total_damage_incidents: 1,
      rating: 4.88,
    },
    project_history: [
      {
        id: 'hist-005',
        order_id: 'ord-walkin-001',
        order_number: 'ASH-ORD-2026-0881',
        movie_title: 'Pushpa 2: The Rule',
        production_company: 'Mythri Movie Makers',
        shoot_location: 'Ramoji Film City Floor 14',
        start_date: '2026-09-16',
        end_date: '2026-09-20',
        days_deployed: 5,
        daily_wage: 1000,
        total_earned: 5000,
        status: 'Active',
        role_on_set: 'Armory Transit Loader',
        damage_incidents_logged: 0,
        gate_pass_number: 'GP-2026-DISPATCH',
      },
      {
        id: 'hist-006',
        order_id: 'ord-hist-015',
        order_number: 'ASH-ORD-2026-0790',
        movie_title: 'OG - They Call Him OG (Crime Epic)',
        production_company: 'DVV Entertainment',
        shoot_location: 'Aluminium Factory, Gachibowli',
        start_date: '2026-08-01',
        end_date: '2026-08-10',
        days_deployed: 10,
        daily_wage: 1000,
        total_earned: 10000,
        status: 'Completed',
        role_on_set: 'Heavy Vehicle & Props Transit',
        damage_incidents_logged: 1,
        gate_pass_number: 'GP-2026-0790-X',
      },
    ],
  },
  {
    id: 'cw-003',
    full_name: 'Govind Raj',
    badge_number: 'ASH-CW-03',
    role: 'crew',
    designation: 'Crane & Heavy Rigging Specialist',
    phone: '+91 98493 44556',
    email: 'govind.raj@aswamovies.com',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    emergency_contact: {
      name: 'G. Lakshmi (Mother)',
      relationship: 'Mother',
      phone: '+91 98493 88112',
    },
    skills_and_certifications: {
      license_type: 'Commercial Driver & Crane Operator - TS-08-2016',
      heavy_rigging_certified: true,
      fragile_optics_handling: false,
      film_industry_experience_years: 8,
    },
    status: 'Available',
    analytics: {
      total_shoots_completed: 26,
      total_days_deployed: 94,
      cumulative_lifetime_earnings: 98500,
      clean_record_score: 100,
      total_damage_incidents: 0,
      rating: 4.92,
    },
    project_history: [
      {
        id: 'hist-007',
        order_id: 'ord-hist-019',
        order_number: 'ASH-ORD-2026-0715',
        movie_title: 'Game Changer (Courtroom Drama & Action)',
        production_company: 'Sri Venkateswara Creations',
        shoot_location: 'Ramanaidu Studios Floor 2',
        start_date: '2026-07-15',
        end_date: '2026-07-25',
        days_deployed: 11,
        daily_wage: 1000,
        total_earned: 11000,
        status: 'Completed',
        role_on_set: 'Overhead Chandelier & Rigging Lead',
        damage_incidents_logged: 0,
      },
    ],
  },
  {
    id: 'cw-004',
    full_name: 'Anand Kumar',
    badge_number: 'ASH-CW-04',
    role: 'crew',
    designation: 'Fragile Glass & Camera Optics Handler',
    phone: '+91 98494 55667',
    email: 'anand.kumar@aswamovies.com',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    emergency_contact: {
      name: 'A. Sunitha (Sister)',
      relationship: 'Sister',
      phone: '+91 98494 22331',
    },
    skills_and_certifications: {
      license_type: 'Light Motor Vehicle - TS-09-2021',
      heavy_rigging_certified: false,
      fragile_optics_handling: true,
      film_industry_experience_years: 5,
    },
    status: 'Available',
    analytics: {
      total_shoots_completed: 22,
      total_days_deployed: 85,
      cumulative_lifetime_earnings: 89000,
      clean_record_score: 100,
      total_damage_incidents: 0,
      rating: 4.97,
    },
    project_history: [],
  },
  {
    id: 'cw-005',
    full_name: 'Mahesh Rao',
    badge_number: 'ASH-CW-05',
    role: 'crew',
    designation: 'Set Transit & Quick Logistics Specialist',
    phone: '+91 98495 66778',
    email: 'mahesh.rao@aswamovies.com',
    avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    emergency_contact: {
      name: 'M. Srinivas (Father)',
      relationship: 'Father',
      phone: '+91 98495 11992',
    },
    skills_and_certifications: {
      license_type: 'Heavy Transport - TS-11-2019',
      heavy_rigging_certified: true,
      fragile_optics_handling: true,
      film_industry_experience_years: 6,
    },
    status: 'Available',
    analytics: {
      total_shoots_completed: 19,
      total_days_deployed: 72,
      cumulative_lifetime_earnings: 76000,
      clean_record_score: 100,
      total_damage_incidents: 0,
      rating: 4.85,
    },
    project_history: [],
  },
  {
    id: 'cw-006',
    full_name: 'K. Venkatesh',
    badge_number: 'ASH-CW-06',
    role: 'crew',
    designation: 'Junior Field Grip & Packing Crew',
    phone: '+91 98496 77889',
    email: 'venkatesh.k@aswamovies.com',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    emergency_contact: {
      name: 'K. Anasuya (Mother)',
      relationship: 'Mother',
      phone: '+91 98496 44332',
    },
    skills_and_certifications: {
      heavy_rigging_certified: false,
      fragile_optics_handling: true,
      film_industry_experience_years: 3,
    },
    status: 'Available',
    analytics: {
      total_shoots_completed: 12,
      total_days_deployed: 45,
      cumulative_lifetime_earnings: 47000,
      clean_record_score: 100,
      total_damage_incidents: 0,
      rating: 4.79,
    },
    project_history: [],
  },
];

// Initial seed assignments for orders
const INITIAL_CREW_ASSIGNMENTS: OrderCrewAssignment[] = [
  {
    id: 'asgn-001',
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-001',
    start_date: '2026-09-16',
    end_date: '2026-09-20',
    daily_wage: 1000,
    status: 'Active',
    assigned_at: '2026-09-16T08:30:00Z',
  },
  {
    id: 'asgn-002',
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-002',
    start_date: '2026-09-16',
    end_date: '2026-09-20',
    daily_wage: 1000,
    status: 'Active',
    assigned_at: '2026-09-16T08:30:00Z',
  },
  {
    id: 'asgn-003',
    order_id: 'c1000000-0000-0000-0000-000000000077',
    crew_member_id: 'cw-001',
    start_date: '2026-09-16',
    end_date: '2026-09-20',
    daily_wage: 1000,
    status: 'Active',
    assigned_at: '2026-09-16T08:30:00Z',
  },
  {
    id: 'asgn-004',
    order_id: 'c1000000-0000-0000-0000-000000000077',
    crew_member_id: 'cw-002',
    start_date: '2026-09-16',
    end_date: '2026-09-20',
    daily_wage: 1000,
    status: 'Active',
    assigned_at: '2026-09-16T08:30:00Z',
  },
  {
    id: 'asgn-005',
    order_id: 'c1000000-0000-0000-0000-000000000088',
    crew_member_id: 'cw-003',
    start_date: '2026-09-14',
    end_date: '2026-09-18',
    daily_wage: 1000,
    status: 'Active',
    assigned_at: '2026-09-14T08:30:00Z',
  },
];

// Initial external crew for gate-pass verification
const INITIAL_EXTERNAL_CREW: OrderExternalCrew[] = [
  {
    id: 'ext-001',
    order_id: 'ord-walkin-001',
    full_name: 'K. Naresh - Production Grip Lead',
    phone_number: '+91 98480 11223',
    notes: 'Mythri Movies Lead Prop Handler. Authorized to receive armory crates on Floor 14.',
    created_at: '2026-09-16T08:35:00Z',
  },
  {
    id: 'ext-002',
    order_id: 'ord-walkin-001',
    full_name: 'P. Somaraju - Art Assistant',
    phone_number: '+91 98480 99887',
    notes: 'Art Department Set Dresser. Gate entry authorization for Ramoji Main Gate.',
    created_at: '2026-09-16T08:35:00Z',
  },
  {
    id: 'ext-003',
    order_id: 'c1000000-0000-0000-0000-000000000077',
    full_name: 'K. Naresh - Production Grip Lead',
    phone_number: '+91 98480 11223',
    notes: 'Hombale Lead Prop Handler. Coal Mine Set 3.',
    created_at: '2026-09-16T08:35:00Z',
  },
];

// Initial field logs
const INITIAL_FIELD_LOGS: EnrichedFieldLogEntry[] = [
  {
    id: 'log-001',
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-001',
    log_type: 'Attendance',
    location_name: 'Ramoji Film City, Studio Floor 14',
    gps_coordinates: { latitude: 17.2543, longitude: 78.6808, accuracy: 12 },
    notes: 'On-site check-in verified. Ashwa transit lorry TS 09 EA 4521 unpacked at Floor 14 holding bay.',
    created_at: '2026-09-18T06:45:00Z',
    crew_member_name: 'Ramesh Kumar',
    crew_badge_number: 'ASH-CW-01',
    crew_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    movie_project_name: 'Pushpa 2: The Rule (Forest Action Sequence)',
    order_number: 'ASH-ORD-2026-0881',
  },
  {
    id: 'log-002',
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-001',
    log_type: 'Prop_Health_Update',
    location_name: 'Studio Floor 14 Rain Sequence Canopy',
    notes: 'Daily Prop Health Sign-off: All 42 props safe and sheltered in climate-controlled tent. Zero water ingress.',
    created_at: '2026-09-18T11:30:00Z',
    crew_member_name: 'Ramesh Kumar',
    crew_badge_number: 'ASH-CW-01',
    crew_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    movie_project_name: 'Pushpa 2: The Rule (Forest Action Sequence)',
    order_number: 'ASH-ORD-2026-0881',
  },
  {
    id: 'log-003',
    order_id: 'ord-walkin-001',
    crew_member_id: 'cw-002',
    log_type: 'Location_Ping',
    location_name: 'Ramoji Film City Security Gate 3',
    notes: 'Transit ping: Vehicle cleared security screening for overnight storage.',
    created_at: '2026-09-17T19:15:00Z',
    crew_member_name: 'Suresh Varma',
    crew_badge_number: 'ASH-CW-02',
    crew_avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    movie_project_name: 'Pushpa 2: The Rule (Forest Action Sequence)',
    order_number: 'ASH-ORD-2026-0881',
  },
];

const INITIAL_ANNOUNCEMENTS: BroadcastAnnouncement[] = [
  {
    id: 'ann-001',
    title: 'Rain Protection Protocol - All Outdoor Sets',
    message: 'IMD Hyderabad forecasts heavy evening thundershowers. All on-site Ashwa crews must cover electronic props and vintage wood furniture with waterproof tarpaulins immediately.',
    priority: 'Urgent',
    sent_by: 'Operations Command (Super Admin)',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    acknowledged_count: 5,
  },
];

// Helper to calculate days between two dates inclusive
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
}

// ===================================================================
// CREW HUB SERVICE
// ===================================================================
export const crewHubService = {
  // 1. Get all Crew Members (Directory & Rosters)
  async getCrewMembers(): Promise<CrewMember360[]> {
    try {
      const { data, error } = await supabase.from('crew_members').select('*').order('badge_number');
      if (data && data.length > 0 && !error) {
        setStoredJson('ashwa_crew_directory_v1', data);
        return data as unknown as CrewMember360[];
      }
    } catch (e) {
      console.warn('Supabase crew_members fetch error:', e);
    }
    return getStoredJson<CrewMember360[]>('ashwa_crew_directory_v1', SEED_CREW_MEMBERS);
  },

  // 2. Get 360° Profile for a specific Crew Member
  async getCrewMemberById(id: string): Promise<CrewMember360 | null> {
    const members = await this.getCrewMembers();
    const found = members.find((m) => m.id === id);
    if (!found) return null;

    // Recalculate dynamic statistics based on project history
    const history = found.project_history || [];
    const totalDays = history.reduce((sum, h) => sum + (h.days_deployed || 0), 0);
    const totalEarnings = history.reduce((sum, h) => sum + (h.total_earned || 0), 0);
    const totalDamages = history.reduce((sum, h) => sum + (h.damage_incidents_logged || 0), 0);
    const cleanScore = history.length > 0 ? Number(((1 - totalDamages / history.length) * 100).toFixed(1)) : 100;

    return {
      ...found,
      analytics: {
        total_shoots_completed: Math.max(found.analytics?.total_shoots_completed || 0, history.length),
        total_days_deployed: Math.max(found.analytics?.total_days_deployed || 0, totalDays),
        cumulative_lifetime_earnings: Math.max(found.analytics?.cumulative_lifetime_earnings || 0, totalEarnings),
        clean_record_score: Math.min(100, Math.max(0, cleanScore)),
        total_damage_incidents: totalDamages,
        rating: found.analytics?.rating || 4.9,
      },
    };
  },

  // 3. Get Active Deployments Board
  async getActiveDeployments(): Promise<ActiveShootDeployment[]> {
    const orders = await ordersService.getOrders();
    let assignments = getStoredJson<OrderCrewAssignment[]>(
      STORAGE_KEY_CREW_ASSIGNMENTS,
      INITIAL_CREW_ASSIGNMENTS
    );
    try {
      const { data, error } = await supabase.from('order_crew_assignments').select('*');
      if (data && data.length > 0 && !error) {
        assignments = data as unknown as OrderCrewAssignment[];
        setStoredJson(STORAGE_KEY_CREW_ASSIGNMENTS, assignments);
      }
    } catch (e) {
      console.warn('Supabase order_crew_assignments fetch warning:', e);
    }

    let externalCrew = getStoredJson<OrderExternalCrew[]>(
      STORAGE_KEY_EXTERNAL_CREW,
      INITIAL_EXTERNAL_CREW
    );
    try {
      const { data, error } = await supabase.from('order_external_crew').select('*');
      if (data && data.length > 0 && !error) {
        externalCrew = data as unknown as OrderExternalCrew[];
        setStoredJson(STORAGE_KEY_EXTERNAL_CREW, externalCrew);
      }
    } catch (e) {
      console.warn('Supabase order_external_crew fetch warning:', e);
    }

    const members = await this.getCrewMembers();
    const memberMap = new Map<string, CrewMember360>(members.map((m) => [m.id, m]));

    // Find orders that are dispatched or in rental pipeline
    const pipelineOrders = orders.filter((o) => {
      const st = String(o.status);
      return (
        st === 'DISPATCHED_RENTAL_PIPELINE' ||
        st === 'Dispatched' ||
        st === 'dispatched' ||
        st === 'PICKED_READY_FOR_DISPATCH'
      );
    });

    // If empty in mock mode, provide seed active shoot
    const effectiveOrders =
      pipelineOrders.length > 0
        ? pipelineOrders
        : [
            {
              id: 'ord-walkin-001',
              order_number: 'ASH-ORD-2026-0881',
              production_name: 'Pushpa 2: The Rule (Forest Action Sequence)',
              client_name: 'Mythri Movie Makers',
              shoot_location: 'Ramoji Film City, Studio Floor 14 - Rain Sequence',
              start_date: '2026-09-16',
              end_date: '2026-09-20',
              rental_days: 5,
              status: 'DISPATCHED_RENTAL_PIPELINE',
              vehicle_number: 'TS 09 EA 4521',
              driver_name: 'Mohan Babu',
              driver_phone: '+91 94400 55667',
              gate_pass_number: 'GP-2026-DISPATCH',
              total_labor_charges: 10000,
              items_count: 42,
            } as any,
          ];

    return effectiveOrders.map((ord) => {
      const orderAssignments = assignments.filter((a) => a.order_id === ord.id);
      const orderExternal = externalCrew.filter((e) => e.order_id === ord.id);

      const enrichedAssignments: EnrichedCrewAssignment[] = orderAssignments.map((asgn) => {
        const member = memberMap.get(asgn.crew_member_id);
        const days = calculateDaysBetween(asgn.start_date, asgn.end_date || ord.end_date);
        const earnings = days * (asgn.daily_wage || 1000);

        return {
          ...asgn,
          crew_name: member ? member.full_name : 'Ashwa Field Specialist',
          badge_number: member ? member.badge_number : 'ASH-CW',
          phone: member ? member.phone : '+91 98490 00000',
          avatar_url:
            member?.avatar_url ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          designation: member?.designation || 'Prop Handler',
          calculated_earnings: earnings,
          effective_days: days,
        };
      });

      const totalLabor = enrichedAssignments.reduce((acc, curr) => acc + curr.calculated_earnings, 0);
      const totalDays = ord.rental_days || calculateDaysBetween(ord.start_date, ord.end_date);
      const elapsed = Math.min(totalDays, calculateDaysBetween(ord.start_date, new Date().toISOString().split('T')[0]));

      return {
        order_id: ord.id,
        order_number: ord.order_number,
        movie_project_name: ord.production_name,
        production_name: ord.client_name || ord.production_name,
        client_name: ord.client_name,
        shoot_location: ord.shoot_location || 'Film City Location',
        start_date: ord.start_date,
        end_date: ord.end_date,
        total_rental_days: totalDays,
        days_elapsed: elapsed,
        status: 'On_Set_Active',
        transport_logistics: {
          lorry_vehicle_number: ord.vehicle_number || 'TS 09 EA 4521',
          driver_name: ord.driver_name || 'Mohan Babu',
          driver_phone: ord.driver_phone || '+91 94400 55667',
          gate_pass_number: ord.gate_pass_number || 'GP-2026-DISPATCH',
        },
        in_house_crew: enrichedAssignments,
        external_crew: orderExternal,
        total_labor_cost: totalLabor || ord.total_labor_charges || 10000,
        props_count: ord.items_count || 42,
        last_health_update: {
          timestamp: 'Today, 11:30 AM',
          status: 'All_Safe',
          summary: 'All 42 props safe and sheltered in climate-controlled tent. Zero water ingress.',
          reported_by_name: 'Ramesh Kumar (ASH-CW-01)',
        },
      };
    });
  },

  // 4. Mid-Shoot Crew Swap / Replacement Workflow
  async swapCrewMember(request: CrewSwapRequest): Promise<CrewSwapResult> {
    const assignments = getStoredJson<OrderCrewAssignment[]>(
      STORAGE_KEY_CREW_ASSIGNMENTS,
      INITIAL_CREW_ASSIGNMENTS
    );
    const members = await this.getCrewMembers();
    const releasingMember = members.find((m) => m.id === request.releasing_crew_member_id);
    const replacementMember = members.find((m) => m.id === request.replacement_crew_member_id);

    if (!releasingMember || !replacementMember) {
      throw new Error('Both releasing member and replacement member must be valid registered crew.');
    }

    // Find active assignment for releasing member
    const targetIdx = assignments.findIndex(
      (a) =>
        a.order_id === request.order_id &&
        a.crew_member_id === request.releasing_crew_member_id &&
        a.status === 'Active'
    );

    if (targetIdx === -1) {
      throw new Error('No active assignment found for the specified crew member on this order.');
    }

    const originalAsgn = assignments[targetIdx];
    const orderStartDate = originalAsgn.start_date;
    const orderEndDate = originalAsgn.end_date || '2026-09-20';

    // Calculate previous day for releasing member
    const swapDateObj = new Date(request.effective_swap_date);
    const releaseEndDateObj = new Date(swapDateObj);
    releaseEndDateObj.setDate(releaseEndDateObj.getDate() - 1);
    const releaseEndDate = releaseEndDateObj.toISOString().split('T')[0];

    // 1. Mark original assignment as 'Replaced'
    const updatedReleasingAsgn: OrderCrewAssignment = {
      ...originalAsgn,
      end_date: releaseEndDate < orderStartDate ? orderStartDate : releaseEndDate,
      status: 'Replaced',
    };
    assignments[targetIdx] = updatedReleasingAsgn;

    // 2. Create replacement assignment starting from swap date
    const dailyWage = request.daily_wage || originalAsgn.daily_wage || 1000;
    const newAsgn: OrderCrewAssignment = {
      id: `asgn-swap-${Date.now()}`,
      order_id: request.order_id,
      crew_member_id: request.replacement_crew_member_id,
      start_date: request.effective_swap_date,
      end_date: orderEndDate,
      daily_wage: dailyWage,
      status: 'Active',
      assigned_at: new Date().toISOString(),
    };
    assignments.push(newAsgn);

    // Save updated assignments
    setStoredJson(STORAGE_KEY_CREW_ASSIGNMENTS, assignments);

    // Recalculate total labor cost for the order
    const orderAssignments = assignments.filter((a) => a.order_id === request.order_id);
    const recalculatedLabor = orderAssignments.reduce((acc, curr) => {
      const days = calculateDaysBetween(curr.start_date, curr.end_date || orderEndDate);
      return acc + days * curr.daily_wage;
    }, 0);

    // Update order's labor charge
    if (ordersService.updateOrderLaborCharges) {
      await ordersService.updateOrderLaborCharges(request.order_id, {
        crew_type: 'in_house',
        in_house_worker_count: orderAssignments.filter((a) => a.status === 'Active').length,
        daily_wage_rate: dailyWage,
        total_labor_charges: recalculatedLabor,
      });
    }

    // Update member statuses in roster
    const updatedMembers = members.map((m) => {
      if (m.id === releasingMember.id) {
        return {
          ...m,
          status: 'Available' as const,
          current_deployment: undefined,
        };
      }
      if (m.id === replacementMember.id) {
        return {
          ...m,
          status: 'On_Shoot' as const,
          current_deployment: {
            order_id: request.order_id,
            order_number: 'ASH-ORD-2026',
            movie_project_name: 'Shoot Deployment',
            shoot_location: 'Film Set',
            start_date: request.effective_swap_date,
            end_date: orderEndDate,
          },
        };
      }
      return m;
    });
    setStoredJson('ashwa_crew_directory_v1', updatedMembers);

    // Log this swap event into field logs
    await this.submitFieldLog({
      order_id: request.order_id,
      crew_member_id: replacementMember.id,
      log_type: 'Attendance',
      location_name: 'On-Site Crew Swap Handover',
      notes: `Mid-Shoot Crew Replacement: ${replacementMember.full_name} (${replacementMember.badge_number}) replaced ${releasingMember.full_name} effective ${request.effective_swap_date}. Reason: ${request.reason}`,
    });

    return {
      success: true,
      order_id: request.order_id,
      released_assignment: updatedReleasingAsgn,
      new_assignment: newAsgn,
      recalculated_total_labor: recalculatedLabor,
      audit_message: `Successfully swapped ${releasingMember.full_name} with ${replacementMember.full_name} starting ${request.effective_swap_date}. Labor charges adjusted to ₹${recalculatedLabor.toLocaleString('en-IN')}.`,
    };
  },

  // 5. Field Attendance & Prop Status Logs
  async getFieldLogs(filter?: { order_id?: string; crew_member_id?: string }): Promise<EnrichedFieldLogEntry[]> {
    try {
      let query = supabase.from('crew_field_logs').select('*').order('created_at', { ascending: false });
      if (filter?.order_id) {
        query = query.eq('order_id', filter.order_id);
      }
      if (filter?.crew_member_id) {
        query = query.eq('crew_member_id', filter.crew_member_id);
      }
      const { data, error } = await query;
      if (data && data.length > 0 && !error) {
        const members = await this.getCrewMembers();
        const memberMap = new Map<string, CrewMember360>(members.map((m) => [m.id, m]));
        const orders = await ordersService.getOrders();
        const orderMap = new Map(orders.map((o) => [o.id, o]));

        const enriched: EnrichedFieldLogEntry[] = data.map((log: any) => {
          const member = memberMap.get(log.crew_member_id);
          const ord = orderMap.get(log.order_id);
          return {
            id: log.id,
            order_id: log.order_id,
            crew_member_id: log.crew_member_id,
            log_type: log.log_type,
            location_name: log.location_name || ord?.shoot_location || 'Ramoji Film City, Studio Floor 14',
            gps_coordinates: log.gps_coordinates,
            notes: log.notes,
            created_at: log.created_at,
            crew_member_name: member ? member.full_name : 'Ashwa Field Crew',
            crew_badge_number: member ? member.badge_number : 'ASH-CW',
            crew_avatar_url:
              member?.avatar_url ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            movie_project_name: ord?.production_name || ord?.movie_project_name || 'Pushpa 2: The Rule',
            order_number: ord?.order_number || 'ASH-ORD-2026-0881',
          };
        });
        setStoredJson(STORAGE_KEY_FIELD_LOGS, enriched);
        return enriched;
      }
    } catch (e) {
      console.warn('Supabase crew_field_logs fetch warning:', e);
    }

    let logs = getStoredJson<EnrichedFieldLogEntry[]>(STORAGE_KEY_FIELD_LOGS, INITIAL_FIELD_LOGS);

    if (filter?.order_id) {
      logs = logs.filter((l) => l.order_id === filter.order_id);
    }
    if (filter?.crew_member_id) {
      logs = logs.filter((l) => l.crew_member_id === filter.crew_member_id);
    }

    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // 6. Submit a Field Log (from on-site mobile or manager simulation)
  async submitFieldLog(input: {
    order_id: string;
    crew_member_id: string;
    log_type: CrewFieldLogType;
    location_name?: string;
    gps_coordinates?: { latitude: number; longitude: number; accuracy?: number };
    notes?: string;
  }): Promise<EnrichedFieldLogEntry> {
    const logs = getStoredJson<EnrichedFieldLogEntry[]>(STORAGE_KEY_FIELD_LOGS, INITIAL_FIELD_LOGS);
    const members = await this.getCrewMembers();
    const member = members.find((m) => m.id === input.crew_member_id);

    const newLog: EnrichedFieldLogEntry = {
      id: `log-${Date.now()}`,
      order_id: input.order_id,
      crew_member_id: input.crew_member_id,
      log_type: input.log_type,
      location_name: input.location_name || 'Ramoji Film City, Studio Floor 14',
      gps_coordinates: input.gps_coordinates,
      notes: input.notes,
      created_at: new Date().toISOString(),
      crew_member_name: member ? member.full_name : 'Ashwa Field Crew',
      crew_badge_number: member ? member.badge_number : 'ASH-CW',
      crew_avatar_url:
        member?.avatar_url ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      movie_project_name: member?.current_deployment?.movie_project_name || 'Pushpa 2: The Rule',
      order_number: member?.current_deployment?.order_number || 'ASH-ORD-2026-0881',
    };

    logs.unshift(newLog);
    setStoredJson(STORAGE_KEY_FIELD_LOGS, logs);

    // Try Supabase insert in background
    try {
      const { data, error } = await supabase.from('crew_field_logs').insert([
        {
          order_id: input.order_id,
          crew_member_id: input.crew_member_id,
          log_type: input.log_type,
          location_name: input.location_name,
          gps_coordinates: input.gps_coordinates,
          notes: input.notes,
        },
      ]).select().single();

      if (data && !error) {
        newLog.id = data.id;
        newLog.created_at = data.created_at;
      }
    } catch {
      // Ignored for offline / local mode
    }

    return newLog;
  },

  // 7. Manager Operational Broadcast Announcement
  async getBroadcastAnnouncements(): Promise<BroadcastAnnouncement[]> {
    return getStoredJson<BroadcastAnnouncement[]>(STORAGE_KEY_ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  },

  async broadcastAnnouncement(input: {
    title: string;
    message: string;
    priority: 'Normal' | 'Urgent' | 'Critical_Alert';
    target_order_id?: string;
    target_location?: string;
    sent_by?: string;
  }): Promise<BroadcastAnnouncement> {
    const announcements = getStoredJson<BroadcastAnnouncement[]>(
      STORAGE_KEY_ANNOUNCEMENTS,
      INITIAL_ANNOUNCEMENTS
    );

    const item: BroadcastAnnouncement = {
      id: `ann-${Date.now()}`,
      title: input.title,
      message: input.message,
      priority: input.priority,
      target_order_id: input.target_order_id,
      target_location: input.target_location,
      sent_by: input.sent_by || 'Operations Command (Super Admin)',
      created_at: new Date().toISOString(),
      acknowledged_count: 0,
    };

    announcements.unshift(item);
    setStoredJson(STORAGE_KEY_ANNOUNCEMENTS, announcements);
    return item;
  },

  // 8. Assign Order Crew Members (from Dispatch Modal)
  async assignOrderCrewMembers(
    orderId: string,
    inHouse: { member_id: string; start_date: string; end_date: string; daily_wage: number }[],
    external: { full_name: string; phone_number: string; notes?: string }[]
  ): Promise<void> {
    const assignments = getStoredJson<OrderCrewAssignment[]>(
      STORAGE_KEY_CREW_ASSIGNMENTS,
      INITIAL_CREW_ASSIGNMENTS
    );
    const externalCrew = getStoredJson<OrderExternalCrew[]>(
      STORAGE_KEY_EXTERNAL_CREW,
      INITIAL_EXTERNAL_CREW
    );

    // Filter out old assignments for this order
    const filteredAssignments = assignments.filter((a) => a.order_id !== orderId);
    const filteredExternal = externalCrew.filter((e) => e.order_id !== orderId);

    // Add new in-house assignments
    inHouse.forEach((item) => {
      filteredAssignments.push({
        id: `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        crew_member_id: item.member_id,
        start_date: item.start_date,
        end_date: item.end_date,
        daily_wage: item.daily_wage,
        status: 'Active',
        assigned_at: new Date().toISOString(),
      });
    });

    // Add new external crew
    external.forEach((item) => {
      filteredExternal.push({
        id: `ext-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        order_id: orderId,
        full_name: item.full_name,
        phone_number: item.phone_number,
        notes: item.notes,
        created_at: new Date().toISOString(),
      });
    });

    setStoredJson(STORAGE_KEY_CREW_ASSIGNMENTS, filteredAssignments);
    setStoredJson(STORAGE_KEY_EXTERNAL_CREW, filteredExternal);

    // Try Supabase insert
    try {
      if (inHouse.length > 0) {
        await supabase.from('order_crew_assignments').insert(
          inHouse.map((ih) => ({
            order_id: orderId,
            crew_member_id: ih.member_id,
            start_date: ih.start_date,
            end_date: ih.end_date,
            daily_wage: ih.daily_wage,
            status: 'Active',
          }))
        );
      }
      if (external.length > 0) {
        await supabase.from('order_external_crew').insert(
          external.map((ex) => ({
            order_id: orderId,
            full_name: ex.full_name,
            phone_number: ex.phone_number,
            notes: ex.notes,
          }))
        );
      }
    } catch {
      // Offline fallback
    }
  },

  // 9. Get Integrated Labor Sheet Entries (Auto-Synced from Order Crew Assignments & Supabase)
  async getLaborSheetEntries(): Promise<LaborSheetEntry[]> {
    try {
      const { data: dbVouchers, error: vError } = await supabase.from('labor_vouchers').select('*');
      if (dbVouchers && dbVouchers.length > 0 && !vError) {
        const orders = await ordersService.getOrders();
        const members = await this.getCrewMembers();
        const memberMap = new Map(members.map((m) => [m.id, m]));
        const orderMap = new Map(orders.map((o) => [o.id, o]));

        return dbVouchers.map((v: any) => {
          const ord = orderMap.get(v.order_id);
          const member = memberMap.get(v.crew_member_id);
          return {
            id: v.id,
            order_id: v.order_id,
            order_number: ord?.order_number || 'ASH-2026-ORD',
            movie_project_name: ord?.production_name || ord?.movie_project_name || 'Pushpa 2: The Rule',
            crew_member_id: v.crew_member_id,
            crew_name: member?.full_name || 'Ashwa Crew Lead',
            badge_number: member?.badge_number || 'ASH-CW-01',
            role_on_set: member?.designation || 'Prop Handling & Rigging Specialist',
            daily_wage_rate: Number(v.daily_wage_rate) || 1000,
            active_shoot_days: Number(v.active_shoot_days) || 1,
            total_wages_earned: Number(v.total_wages_earned) || 1000,
            voucher_number: v.voucher_number,
            payment_status: v.payment_status,
            disbursed_at: v.disbursed_at,
            created_at: v.created_at,
          };
        });
      }
    } catch (e) {
      console.warn('Supabase labor_vouchers fetch warning:', e);
    }

    const orders = await ordersService.getOrders();
    const assignments = getStoredJson<OrderCrewAssignment[]>(
      STORAGE_KEY_CREW_ASSIGNMENTS,
      INITIAL_CREW_ASSIGNMENTS
    );
    const members = await this.getCrewMembers();
    const memberMap = new Map<string, CrewMember360>(members.map((m) => [m.id, m]));
    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const savedStatuses = getStoredJson<Record<string, { status: 'Pending_Disbursement' | 'Approved' | 'Disbursed'; disbursed_at?: string }>>(
      'ashwa_crew_voucher_statuses_v1',
      {}
    );

    const entries: LaborSheetEntry[] = [];

    assignments.forEach((asgn, idx) => {
      const ord = orderMap.get(asgn.order_id);
      const member = memberMap.get(asgn.crew_member_id);
      const days = ord?.actual_shoot_days || ord?.rental_days || calculateDaysBetween(asgn.start_date, asgn.end_date || '2026-09-20');
      const wageRate = asgn.daily_wage || 1000;
      const totalEarned = days * wageRate;
      const voucherNo = `WV-2026-${String(idx + 1).padStart(3, '0')}`;
      const entryId = `ls-${asgn.id}`;

      const override = savedStatuses[entryId] || savedStatuses[asgn.id] || savedStatuses[voucherNo];
      const defaultStatus: 'Pending_Disbursement' | 'Approved' | 'Disbursed' = ord?.status === 'Returned' ? 'Disbursed' : 'Pending_Disbursement';

      entries.push({
        id: entryId,
        order_id: asgn.order_id,
        order_number: ord?.order_number || 'ASH-2026-ORD-077',
        movie_project_name: ord?.movie_project_name || ord?.production_name || 'Pushpa 2: The Rule',
        crew_member_id: asgn.crew_member_id,
        crew_name: member?.full_name || 'Ashwa Crew Lead',
        badge_number: member?.badge_number || 'ASH-CW-01',
        role_on_set: member?.designation || 'Prop Handling & Rigging Specialist',
        daily_wage_rate: wageRate,
        active_shoot_days: days,
        total_wages_earned: totalEarned,
        voucher_number: voucherNo,
        payment_status: override?.status || defaultStatus,
        disbursed_at: override?.disbursed_at || (defaultStatus === 'Disbursed' ? new Date().toISOString() : undefined),
        created_at: asgn.assigned_at,
      });
    });

    return entries;
  },

  // 10. Update Voucher Disbursement Status
  async updateVoucherPaymentStatus(
    entryIdOrVoucher: string,
    status: 'Pending_Disbursement' | 'Approved' | 'Disbursed'
  ): Promise<boolean> {
    const savedStatuses = getStoredJson<Record<string, { status: 'Pending_Disbursement' | 'Approved' | 'Disbursed'; disbursed_at?: string }>>(
      'ashwa_crew_voucher_statuses_v1',
      {}
    );

    const now = new Date().toISOString();
    savedStatuses[entryIdOrVoucher] = {
      status,
      disbursed_at: status === 'Disbursed' ? now : undefined,
    };

    setStoredJson('ashwa_crew_voucher_statuses_v1', savedStatuses);

    // Also update Supabase labor_vouchers if entry exists
    try {
      await supabase
        .from('labor_vouchers')
        .update({
          payment_status: status,
          disbursed_at: status === 'Disbursed' ? now : null,
          updated_at: now,
        })
        .or(`id.eq.${entryIdOrVoucher},voucher_number.eq.${entryIdOrVoucher}`);
    } catch {
      // Offline fallback
    }

    return true;
  },

  // 11. Realtime WebSocket Subscription across Crew Hub tables
  subscribeToCrewHub(onChange: (event: { table: string; eventType: string; payload: any }) => void) {
    const channel = supabase
      .channel('crew_hub_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_field_logs' }, (payload) => {
        onChange({ table: 'crew_field_logs', eventType: payload.eventType, payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_crew_assignments' }, (payload) => {
        onChange({ table: 'order_crew_assignments', eventType: payload.eventType, payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crew_members' }, (payload) => {
        onChange({ table: 'crew_members', eventType: payload.eventType, payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'labor_vouchers' }, (payload) => {
        onChange({ table: 'labor_vouchers', eventType: payload.eventType, payload });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
