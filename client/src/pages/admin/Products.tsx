import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Edit2, Trash2, CheckCircle2, MoreVertical } from "lucide-react";
import { insertProductSchema } from "@shared/schema";
import type { InsertProduct, Product, Section } from "@shared/schema";
import { useProducts, useCreateProduct, useUpdateProduct, useBulkUpdateStatus, useDeleteProduct } from "@/hooks/use-products";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Fish", "Prawns", "Chicken", "Mutton", "Masalas"];
const STATUSES = ["available", "limited", "unavailable"];

export default function Products() {
  const { data: products } = useProducts();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const activeProducts = products?.filter(p => !p.isArchived) || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold">Products</h1>
        <div className="flex items-center gap-2">
          <BulkUpdateDialog />
          <ProductDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-blue-50 flex items-center justify-center">🐟</div>}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>₹{p.price} / {p.unit}</TableCell>
                <TableCell>
                  <StatusDropdown product={p} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingProduct(p)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DeleteAction id={p.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {activeProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No products found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingProduct && (
        <ProductDialog 
          open={!!editingProduct} 
          onOpenChange={(v) => !v && setEditingProduct(null)} 
          product={editingProduct} 
        />
      )}
    </div>
  );
}

function StatusDropdown({ product }: { product: Product }) {
  const { mutate } = useUpdateProduct();
  
  return (
    <Select 
      defaultValue={product.status} 
      onValueChange={(val) => mutate({ id: product.id, status: val })}
    >
      <SelectTrigger className={`w-[130px] h-8 text-xs ${
        product.status === 'available' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
        product.status === 'limited' ? 'border-amber-200 bg-amber-50 text-amber-700' : 
        'border-red-200 bg-red-50 text-red-700'
      }`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available">Available</SelectItem>
        <SelectItem value="limited">Limited Stock</SelectItem>
        <SelectItem value="unavailable">Out of Stock</SelectItem>
      </SelectContent>
    </Select>
  );
}

function DeleteAction({ id }: { id: string }) {
  const { mutate } = useDeleteProduct();
  return (
    <DropdownMenuItem onClick={() => mutate(id)} className="text-destructive focus:bg-destructive/10">
      <Trash2 className="w-4 h-4 mr-2" /> Delete
    </DropdownMenuItem>
  );
}

function ProductDialog({ open, onOpenChange, product }: { open: boolean, onOpenChange: (v: boolean) => void, product?: Product }) {
  const { mutate: create, isPending: isCreating } = useCreateProduct();
  const { mutate: update, isPending: isUpdating } = useUpdateProduct();
  const { data: sections = [] } = useQuery<Section[]>({ queryKey: ["/api/sections"] });
  const isPending = isCreating || isUpdating;

  const productSections = sections.filter(s => s.type === "products");

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    values: product ? {
      name: product.name,
      category: product.category,
      subCategory: product.subCategory || '',
      price: product.price || 0,
      unit: product.unit || 'per kg',
      imageUrl: product.imageUrl || '',
      status: product.status,
      limitedStockNote: product.limitedStockNote || '',
      sectionId: product.sectionId || null,
      description: product.description || '',
      weight: product.weight || '',
      pieces: product.pieces || '',
      serves: product.serves || '',
      discountPct: product.discountPct ?? 0,
    } : {
      name: '', category: 'Fish', subCategory: '', price: 0, unit: 'per kg', imageUrl: '',
      status: 'available', limitedStockNote: '', sectionId: null,
      description: '', weight: '', pieces: '', serves: '', discountPct: 0,
    }
  });

  const onSubmit = (data: InsertProduct) => {
    const payload = { ...data, sectionId: data.sectionId || null };
    if (product) {
      update({ id: product.id, ...payload }, { onSuccess: () => onOpenChange(false) });
    } else {
      create(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!product && <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Product</Button></DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="unit" render={({ field }) => (
                <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g. per kg" {...field} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="subCategory" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Sub-Category (optional)</FormLabel><FormControl><Input placeholder="e.g. Silver Pomfret" {...field} value={field.value || ''} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Image URL (optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} value={field.value || ''} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem className="col-span-2"><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Product description shown on detail page..." rows={3} {...field} value={field.value || ''} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="weight" render={({ field }) => (
                <FormItem><FormLabel>Weight</FormLabel><FormControl><Input placeholder="e.g. 500 g" {...field} value={field.value || ''} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="pieces" render={({ field }) => (
                <FormItem><FormLabel>Pieces</FormLabel><FormControl><Input placeholder="e.g. 2–3 Pieces" {...field} value={field.value || ''} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="serves" render={({ field }) => (
                <FormItem><FormLabel>Serves</FormLabel><FormControl><Input placeholder="e.g. Serves 3" {...field} value={field.value || ''} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="discountPct" render={({ field }) => (
                <FormItem><FormLabel>Discount %</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="sectionId" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Homepage Section</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === "__none__" ? null : val)}
                    value={field.value ?? "__none__"}
                  >
                    <FormControl><SelectTrigger><SelectValue placeholder="None (not shown in any section)" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {productSections.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {form.watch("status") === "limited" && (
                <FormField control={form.control} name="limitedStockNote" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Limited Stock Note</FormLabel><FormControl><Input placeholder="e.g. Only 2kg left!" {...field} value={field.value || ''} /></FormControl></FormItem>
                )} />
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>{isPending ? 'Saving...' : 'Save Product'}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BulkUpdateDialog() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Fish");
  const [status, setStatus] = useState("unavailable");
  const { mutate, isPending } = useBulkUpdateStatus();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="secondary" className="bg-white"><CheckCircle2 className="w-4 h-4 mr-2" /> Bulk Status</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Update Category Status</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Set Status To</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            disabled={isPending} 
            onClick={() => mutate({ category, status }, { onSuccess: () => setOpen(false) })}
          >
            Apply to all {category}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
