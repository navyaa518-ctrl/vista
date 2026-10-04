import { OrderCrewAssignment, OrderExternalCrew, CrewFieldLog, CrewFieldLogType } from './database';

export interface CrewMember360 {
  id: string;
  full_name: string;
  badge_number: string;
  role: 'crew' | 'field_worker';
  designation: string;
  phone: string;
  email: string;
  avatar_url: string;
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  skills_and_certifications: {
    license_type?: string; // e.g., 'Heavy Commercial Vehicle (HMV) - TS09-2018'
    heavy_rigging_certified: boolean;
    fragile_optics_handling: boolean;
    film_industry_experience_years: number;
  };
  status: 'On_Shoot' | 'Available' | 'On_Leave';
  current_deployment?: {
    order_id: string;
    order_number: string;
    movie_project_name: string;
    shoot_location: string;
    start_date: string;
    end_date: string;
  };
  // Performance KPI Metrics
  analytics: {
    total_shoots_completed: number; // e.g., 38 Movie Shoots
    total_days_deployed: number;    // e.g., 142 Days
    cumulative_lifetime_earnings: number; // e.g., ₹ 1,45,000
    clean_record_score: number;     // e.g., 100% (Zero-damage shoot track record)
    total_damage_incidents: number;
    rating: number;                 // e.g., 4.9
  };
  // Detailed Project History
  project_history: CrewProjectHistoryRecord[];
}

export interface CrewProjectHistoryRecord {
  id: string;
  order_id: string;
  order_number: string;
  movie_title: string;
  production_company: string;
  shoot_location: string;
  start_date: string;
  end_date: string;
  days_deployed: number;
  daily_wage: number;
  total_earned: number;
  status: 'Completed' | 'Replaced' | 'Active';
  role_on_set: string;
  damage_incidents_logged: number;
  gate_pass_number?: string;
}

export interface EnrichedCrewAssignment extends OrderCrewAssignment {
  crew_name: string;
  badge_number: string;
  phone: string;
  avatar_url: string;
  designation: string;
  calculated_earnings: number;
  effective_days: number;
}

export interface ActiveShootDeployment {
  order_id: string;
  order_number: string;
  movie_project_name: string;
  production_name: string;
  client_name: string;
  shoot_location: string;
  start_date: string;
  end_date: string;
  total_rental_days: number;
  days_elapsed: number;
  status: 'In_Transit' | 'On_Set_Active' | 'Returning' | 'Completed';
  transport_logistics: {
    lorry_vehicle_number: string;
    driver_name: string;
    driver_phone: string;
    gate_pass_number: string;
  };
  in_house_crew: EnrichedCrewAssignment[];
  external_crew: OrderExternalCrew[];
  total_labor_cost: number;
  props_count: number;
  last_health_update?: {
    timestamp: string;
    status: 'All_Safe' | 'Minor_Issue' | 'Incident_Reported';
    summary: string;
    reported_by_name: string;
  };
}

export interface CrewSwapRequest {
  order_id: string;
  releasing_crew_member_id: string;
  replacement_crew_member_id: string;
  effective_swap_date: string;
  daily_wage?: number;
  reason: string;
}

export interface CrewSwapResult {
  success: boolean;
  order_id: string;
  released_assignment: OrderCrewAssignment;
  new_assignment: OrderCrewAssignment;
  recalculated_total_labor: number;
  audit_message: string;
}

export interface EnrichedFieldLogEntry extends CrewFieldLog {
  crew_member_name: string;
  crew_badge_number: string;
  crew_avatar_url: string;
  movie_project_name: string;
  order_number: string;
}

export interface BroadcastAnnouncement {
  id: string;
  title: string;
  message: string;
  priority: 'Normal' | 'Urgent' | 'Critical_Alert';
  target_order_id?: string; // Optional: specific shoot order or all active shoots
  target_location?: string;
  sent_by: string;
  created_at: string;
  acknowledged_count?: number;
}
