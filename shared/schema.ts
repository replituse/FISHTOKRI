import { z } from "zod";

export type User = {
  id: string;
  username: string;
  password: string;
};

export type InsertUser = {
  username: string;
  password: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  status: string;
  limitedStockNote: string | null;
  price: number | null;
  unit: string | null;
  imageUrl: string | null;
  isArchived: boolean;
  updatedAt: Date;
};

export type InsertProduct = {
  name: string;
  category: string;
  status?: string;
  limitedStockNote?: string | null;
  price?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
};

export type UpdateProductRequest = Partial<InsertProduct> & { isArchived?: boolean };

export type OrderItem = {
  productId: string;
  quantity: number;
  name: string;
  price: number | null;
};

export type OrderRequest = {
  id: string;
  customerName: string;
  phone: string;
  deliveryArea: string;
  address: string;
  items: OrderItem[];
  status: string;
  notes: string | null;
  createdAt: Date;
};

export type InsertOrderRequest = {
  customerName: string;
  phone: string;
  deliveryArea: string;
  address: string;
  items: OrderItem[];
  notes?: string | null;
};

export const insertProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  status: z.string().optional(),
  limitedStockNote: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

export const insertOrderRequestSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  deliveryArea: z.string().min(1, "Delivery area is required"),
  address: z.string().min(1, "Address is required"),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    name: z.string(),
    price: z.number().nullable(),
  })).min(1, "At least one item is required"),
  notes: z.string().nullable().optional(),
});

export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type SubCategory = {
  name: string;
  imageUrl: string | null;
};

export type Category = {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  subCategories: SubCategory[];
};

export type InsertCategory = {
  name: string;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  subCategories?: SubCategory[];
};

export const insertCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  subCategories: z.array(z.object({
    name: z.string().min(1),
    imageUrl: z.string().nullable().optional(),
  })).optional(),
});

export type CarouselSlide = {
  id: string;
  imageUrl: string;
  title: string | null;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
};

export type InsertCarouselSlide = {
  imageUrl: string;
  title?: string | null;
  linkUrl?: string | null;
  order?: number;
  isActive?: boolean;
};

export const insertCarouselSlideSchema = z.object({
  imageUrl: z.string().min(1, "Image URL is required"),
  title: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type CreateProductRequest = InsertProduct;
export type CreateOrderRequest = InsertOrderRequest;
export type UpdateOrderStatusRequest = { status: string };
