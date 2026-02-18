export interface Building {
  id: string;
  name: string | null;
  address: string;
  road_address: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

export interface Password {
  id: string;
  building_id: string;
  location: string;
  password: string;
  report_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SelectedBuilding {
  name: string | null;
  address: string;
  road_address: string | null;
  lat: number;
  lng: number;
}
