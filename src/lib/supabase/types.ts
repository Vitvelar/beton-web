export type Severity = "athugasemd" | "alvarleg" | "mjog_alvarleg";
export type InspectionStatus = "draft" | "inspecting" | "completed";
export type PhotoType = "visible" | "thermal";

export interface Inspector {
  id: string;
  user_id: string;
  full_name: string;
  title: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Inspection {
  id: string;
  inspector_id: string | null;
  address: string;
  postal_code: string;
  municipality: string | null;
  fastanumer: string | null;
  property_data: Record<string, unknown>;
  customer_name: string;
  inspection_date: string;
  weather: string | null;
  attendees: string[] | null;
  status: InspectionStatus;
  report_url: string | null;
  report_generated_at: string | null;
  ai_summary: string | null;
  ai_model: string | null;
  ai_cost_usd: number | null;
  local_id: string | null;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  inspection_id: string;
  name: string;
  slug: string;
  sort_order: number;
  ratings: Record<string, string>;
  equipment: unknown[];
  notes: string | null;
  local_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Observation {
  id: string;
  room_id: string;
  inspection_id: string;
  observation_number: string | null;
  category: string | null;
  title: string;
  description: string | null;
  suggestion: string | null;
  severity: Severity;
  ai_suggested_severity: string | null;
  severity_confirmed: boolean;
  sort_order: number;
  local_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Photo {
  id: string;
  room_id: string | null;
  observation_id: string | null;
  inspection_id: string;
  storage_path: string | null;
  local_path: string | null;
  photo_type: PhotoType;
  mime_type: string | null;
  width_px: number | null;
  height_px: number | null;
  file_size_bytes: number | null;
  caption: string | null;
  sort_order: number;
  is_cover: boolean;
  thermal_data: Record<string, unknown> | null;
  upload_status: string;
  local_id: string | null;
  taken_at: string;
  created_at: string;
  updated_at: string | null;
}

export interface InspectionWithRooms extends Inspection {
  rooms: (Room & {
    observations: Observation[];
    photos: Photo[];
  })[];
}
