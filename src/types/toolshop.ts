export interface Brand {
    id: string;
    name: string;
    slug: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}