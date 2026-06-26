export type UserRole = "admin" | "viewer";

export type ProductStatus = "active" | "inactive";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  category: string;
  price: number;
  status: ProductStatus;
}

export interface ProductListParams {
  limit?: number;
  cursor?: string;
  search?: string;
  category?: string;
  status?: ProductStatus;
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductListResult {
  products: Product[];
  nextCursor: string | null;
  total: number;
}

export interface DashboardMetrics {
  totalProducts: number;
  activeCount: number;
  inactiveCount: number;
  revenueTotal: number;
}

export interface AuthSession {
  uid: string;
  email: string;
  role: UserRole;
}
