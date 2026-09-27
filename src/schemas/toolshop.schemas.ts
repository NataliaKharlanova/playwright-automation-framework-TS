import { z } from 'zod';

export const BrandSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  price: z.number().positive(),
});

export const LoginResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string(),
  expires_in: z.number().int().positive(),
});

export function paginated<T extends z.ZodType>(item: T) {
  return z.object({
    current_page: z.number().int(),
    data: z.array(item),
    last_page: z.number().int(),
    per_page: z.number().int(),
    total: z.number().int(),
  });
}