// Types mirror the API contract in TZ §6. Do not change field names here
// without notifying Role 1 (backend) — the contract is the single point of
// dependency between the two roles.

/** Item in the car list — GET /api/cars */
export interface CarListItem {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  photo_cover: string;
}

/** Full car — GET /api/cars/:id */
export interface CarDetail {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  photos: string[];
}

/** POST /api/leads body */
export interface LeadInput {
  car_id: number | null;
  name: string;
  contact: string;
  message: string;
}

/** Lead row for admin — GET /api/admin/leads */
export interface Lead {
  id: number;
  car_id: number | null;
  name: string;
  contact: string;
  message: string;
  created_at: string;
}

/** POST/PUT body for admin car create/update */
export interface CarInput {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  photos: string[];
}

export interface LoginInput {
  username: string;
  password: string;
}
