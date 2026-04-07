import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { Product, InsertProduct, UpdateProductRequest } from "@shared/schema";
import { getHubHeaders } from "@/lib/queryClient";

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path, {
        headers: getHubHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<Product[]>;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await fetch(api.products.create.path, {
        method: api.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create");
      }
      return res.json() as Promise<Product>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & UpdateProductRequest) => {
      const url = buildUrl(api.products.update.path, { id });
      const res = await fetch(url, {
        method: api.products.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json() as Promise<Product>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { category: string; status: string }) => {
      const res = await fetch(api.products.bulkUpdateStatus.path, {
        method: api.products.bulkUpdateStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed bulk update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, {
        method: api.products.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.products.list.path] }),
  });
}
