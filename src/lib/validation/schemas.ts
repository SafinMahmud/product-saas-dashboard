import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().default(""),
  category: z.string().min(1, "Category is required").max(100),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  status: z.enum(["active", "inactive"]),
});

export const productUpdateSchema = productSchema.partial();

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const productListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional(),
  cursor: z.string().optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  sortBy: z.enum(["name", "price", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
