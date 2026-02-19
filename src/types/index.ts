export interface Building {
  id: string;
  name: string | null;
  address: string;
  road_address: string | null;
  lat: number;
  lng: number;
  has_passwords: boolean;
  created_at: string;
}

export interface Toilet {
  id: string;
  building_id: string;
  location: string;
  created_at: string;
}

export interface Password {
  id: string;
  toilet_id: string;
  location: string;
  password: string;
  confirm_count: number;
  wrong_count: number;
  last_confirmed_at: string | null;
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

export interface Review {
  id: string;
  toilet_id: string;
  toilet_location?: string;
  cleanliness: 1 | 2 | 3;
  has_toilet_paper: boolean;
  is_unisex: boolean;
  has_bidet: boolean;
  has_accessible: boolean;
  has_diaper_table: boolean;
  created_at: string;
}

export interface ReviewSummary {
  total_count: number;
  cleanliness: { clean: number; average: number; dirty: number };
  has_toilet_paper: number;
  is_unisex: number;
  has_bidet: number;
  has_accessible: number;
  has_diaper_table: number;
}
