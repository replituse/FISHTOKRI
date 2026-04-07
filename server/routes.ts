import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { setupAuth } from "./auth";
import { connectOrdersDb } from "./ordersDb";
import { setImage, getImage, deleteImage } from "./imageStore";
import { insertCarouselSlideSchema, insertCategorySchema, insertSectionSchema, insertComboSchema, insertCustomerAddressSchema, updateCustomerSchema } from "@shared/schema";
import { SuperHubModel, SubHubModel } from "./adminDb";
import { getHubModels } from "./hubConnections";

declare module "express-session" {
  interface SessionData {
    customerPhone?: string;
  }
}

// In-memory OTP store: phone -> { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();
const OTP_TTL_MS = 5 * 60 * 1000;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectOrdersDb();
  setupAuth(app);

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // ── Hub discovery routes ────────────────────────────────────────────────
  app.get("/api/hubs/super", async (_req, res) => {
    try {
      const hubs = await SuperHubModel.find({ status: "Active" }).lean();
      res.json(hubs.map((h: any) => ({
        id: h._id.toString(),
        name: h.name,
        location: h.location ?? null,
        imageUrl: h.imageUrl ?? null,
      })));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch super hubs" });
    }
  });

  app.get("/api/hubs/sub", async (req, res) => {
    try {
      const { superHubId } = req.query;
      const filter: any = { status: "Active" };
      if (superHubId) filter.superHubId = superHubId;
      const hubs = await SubHubModel.find(filter).lean();
      res.json(hubs.map((h: any) => ({
        id: h._id.toString(),
        superHubId: h.superHubId?.toString() ?? null,
        name: h.name,
        location: h.location ?? null,
        imageUrl: h.imageUrl ?? null,
        dbName: h.dbName,
        pincodes: h.pincodes ?? [],
      })));
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch sub hubs" });
    }
  });

  // Helper: get hub models for the dbName in the X-Hub-DB header
  const getReqHubModels = async (req: any) => {
    const dbName = req.headers["x-hub-db"] as string | undefined;
    if (dbName) return getHubModels(dbName);
    return null;
  };

  // ── Inline mappers ──────────────────────────────────────────────────────
  const toProduct = (doc: any) => ({
    id: doc._id.toString(), name: doc.name, category: doc.category,
    subCategory: doc.subCategory ?? null, status: doc.status,
    limitedStockNote: doc.limitedStockNote ?? null, price: doc.price ?? null,
    originalPrice: doc.originalPrice ?? null, unit: doc.unit ?? null,
    imageUrl: doc.imageUrl ?? null, isArchived: doc.isArchived ?? false,
    updatedAt: doc.updatedAt, sectionId: doc.sectionId ?? null,
    description: doc.description ?? null, weight: doc.weight ?? null,
    pieces: doc.pieces ?? null, serves: doc.serves ?? null,
    discountPct: doc.discountPct ?? null, quantity: doc.quantity ?? null,
    recipes: (doc.recipes ?? []).map((r: any) => ({
      title: r.title ?? "", description: r.description ?? "",
      image: r.image ?? "", totalTime: r.totalTime ?? "",
      prepTime: r.prepTime ?? "", cookTime: r.cookTime ?? "",
      servings: r.servings ?? 2, difficulty: r.difficulty ?? "Medium",
      ingredients: (r.ingredients ?? []).map((i: any) => String(i)),
      method: (r.method ?? []).map((m: any) => String(m)),
    })),
  });
  const toSection = (doc: any) => ({
    id: doc._id.toString(), title: doc.title, type: doc.type ?? "products",
    sortOrder: doc.sortOrder ?? 0, isActive: doc.isActive ?? true,
  });
  const toCategory = (doc: any) => ({
    id: doc._id.toString(), name: doc.name, imageUrl: doc.imageUrl ?? null,
    sortOrder: doc.sortOrder ?? 0, isActive: doc.isActive ?? true,
    subCategories: (doc.subCategories ?? []).map((s: any) => ({ name: s.name, imageUrl: s.imageUrl ?? null })),
  });
  const toCarousel = (doc: any) => ({
    id: doc._id.toString(), imageUrl: doc.imageUrl, title: doc.title ?? null,
    linkUrl: doc.linkUrl ?? null, order: doc.order ?? 0, isActive: doc.isActive ?? true,
  });
  const toCombo = (doc: any) => ({
    id: doc._id.toString(), name: doc.name, description: doc.description ?? null,
    fullDescription: doc.fullDescription ?? null, serves: doc.serves ?? null,
    weight: doc.weight ?? null, discountedPrice: doc.discountedPrice,
    originalPrice: doc.originalPrice, discount: doc.discount ?? 0,
    includes: (doc.includes ?? []).map((i: any) => ({ productId: i.productId, label: i.label })),
    tags: doc.tags ?? [], nutrition: (doc.nutrition ?? []).map((n: any) => ({ label: n.label, value: n.value, icon: n.icon ?? "" })),
    isActive: doc.isActive ?? true, sortOrder: doc.sortOrder ?? 0,
  });

  // Products routes
  app.get(api.products.list.path, async (req, res) => {
    const hub = await getReqHubModels(req);
    if (!hub) return res.json([]);
    const docs = await hub.Product.find({ isArchived: { $ne: true } }).lean();
    res.json(docs.map(toProduct));
  });

  app.post(api.products.create.path, requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = api.products.create.input.parse(req.body);
      const doc = await hub.Product.create({ ...input, status: input.status ?? "available", updatedAt: new Date() });
      res.status(201).json(toProduct(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.products.update.path, requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = api.products.update.input.parse(req.body);
      const doc = await hub.Product.findByIdAndUpdate(
        req.params.id,
        { ...input, updatedAt: new Date() },
        { new: true }
      ).lean();
      if (!doc) return res.status(404).json({ message: "Product not found" });
      res.json(toProduct(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.products.bulkUpdateStatus.path, requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const { category, status } = api.products.bulkUpdateStatus.input.parse(req.body);
      await hub.Product.updateMany({ category }, { status, updatedAt: new Date() });
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.products.delete.path, requireAuth, async (req, res) => {
    const hub = await getReqHubModels(req);
    if (hub) {
      await hub.Product.findByIdAndUpdate(req.params.id, { isArchived: true });
    }
    deleteImage(req.params.id);
    res.status(204).end();
  });

  // Image upload (in-memory)
  app.post("/api/products/:id/image", requireAuth, async (req: any, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      const mimeType = req.headers["content-type"] || "image/jpeg";
      const id = req.params.id;
      setImage(id, buffer, mimeType);
      const imageUrl = `/api/products/${id}/image`;
      const hub = await getReqHubModels(req);
      if (hub) {
        await hub.Product.findByIdAndUpdate(id, { imageUrl, updatedAt: new Date() });
      }
      res.json({ imageUrl });
    });
    req.on("error", () => res.status(500).json({ message: "Upload failed" }));
  });

  // Image serve (from in-memory)
  app.get("/api/products/:id/image", (req, res) => {
    const img = getImage(req.params.id);
    if (!img) return res.status(404).end();
    res.setHeader("Content-Type", img.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(img.data);
  });

  // Orders routes
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrderRequest(input);

      const total = (order.items as any[]).reduce((sum: number, item: any) => {
        return sum + ((item.price ?? 0) * (item.quantity ?? 1));
      }, 0);

      await storage.pushOrderToCustomer(order.phone, {
        orderId: order.id,
        customerName: order.customerName,
        phone: order.phone,
        deliveryArea: order.deliveryArea,
        address: order.address,
        items: order.items,
        status: order.status,
        notes: order.notes ?? null,
        total,
        placedAt: order.createdAt,
      });

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    const orders = await storage.getOrderRequests();
    res.json(orders);
  });

  app.get("/api/orders/by-phone/:phone", async (req, res) => {
    const { phone } = req.params;
    if (!phone) return res.status(400).json({ message: "Phone required" });
    const orders = await storage.getOrdersByPhone(phone);
    res.json(orders);
  });

  app.patch(api.orders.updateStatus.path, requireAuth, async (req, res) => {
    try {
      const input = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderRequestStatus(req.params.id, input.status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      await storage.updateCustomerOrderStatus(order.phone, order.id, input.status);
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Carousel routes
  app.get("/api/carousel", async (req, res) => {
    const hub = await getReqHubModels(req);
    if (!hub) return res.json([]);
    const docs = await hub.Carousel.find({ isActive: true }).sort({ order: 1 }).lean();
    res.json(docs.map(toCarousel));
  });

  app.post("/api/carousel", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertCarouselSlideSchema.parse(req.body);
      const doc = await hub.Carousel.create(input);
      res.status(201).json(toCarousel(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/carousel/:id", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertCarouselSlideSchema.partial().parse(req.body);
      const doc = await hub.Carousel.findByIdAndUpdate(req.params.id, input, { new: true }).lean();
      if (!doc) return res.status(404).json({ message: "Slide not found" });
      res.json(toCarousel(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/carousel/:id", requireAuth, async (req, res) => {
    const hub = await getReqHubModels(req);
    if (hub) await hub.Carousel.findByIdAndDelete(req.params.id);
    res.status(204).end();
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    const hub = await getReqHubModels(req);
    if (!hub) return res.json([]);
    const docs = await hub.Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json(docs.map(toCategory));
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertCategorySchema.parse(req.body);
      const doc = await hub.Category.findOneAndUpdate(
        { name: input.name },
        { $set: input },
        { new: true, upsert: true }
      ).lean();
      res.status(201).json(toCategory(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertCategorySchema.partial().parse(req.body);
      const doc = await hub.Category.findByIdAndUpdate(req.params.id, { $set: input }, { new: true }).lean();
      if (!doc) return res.status(404).json({ message: "Category not found" });
      res.json(toCategory(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    const hub = await getReqHubModels(req);
    if (hub) await hub.Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(204).end();
  });

  // Sections routes
  app.get("/api/sections", async (req, res) => {
    const hub = await getReqHubModels(req);
    if (!hub) return res.json([]);
    const docs = await hub.Section.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json(docs.map(toSection));
  });

  app.post("/api/sections", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertSectionSchema.parse(req.body);
      const doc = await hub.Section.create({
        ...input,
        type: input.type ?? "products",
        isActive: input.isActive ?? true,
      });
      res.status(201).json(toSection(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/sections/:id", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertSectionSchema.partial().parse(req.body);
      const doc = await hub.Section.findByIdAndUpdate(req.params.id, { $set: input }, { new: true }).lean();
      if (!doc) return res.status(404).json({ message: "Section not found" });
      res.json(toSection(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/sections/:id", requireAuth, async (req, res) => {
    const hub = await getReqHubModels(req);
    if (hub) await hub.Section.findByIdAndDelete(req.params.id);
    res.status(204).end();
  });

  // Combo routes
  app.get("/api/combos", async (req, res) => {
    const hub = await getReqHubModels(req);
    if (!hub) return res.json([]);
    const docs = await hub.Combo.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    res.json(docs.map(toCombo));
  });

  app.get("/api/combos/:id", async (req, res) => {
    const hub = await getReqHubModels(req);
    if (!hub) return res.status(404).json({ message: "Combo not found" });
    const doc = await hub.Combo.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ message: "Combo not found" });
    res.json(toCombo(doc));
  });

  app.post("/api/combos", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertComboSchema.parse(req.body);
      const doc = await hub.Combo.create({
        ...input,
        isActive: (input as any).isActive ?? true,
        sortOrder: (input as any).sortOrder ?? 0,
      });
      res.status(201).json(toCombo(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/combos/:id", requireAuth, async (req, res) => {
    try {
      const hub = await getReqHubModels(req);
      if (!hub) return res.status(400).json({ message: "No hub selected" });
      const input = insertComboSchema.partial().parse(req.body);
      const doc = await hub.Combo.findByIdAndUpdate(req.params.id, { $set: input }, { new: true }).lean();
      if (!doc) return res.status(404).json({ message: "Combo not found" });
      res.json(toCombo(doc));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/combos/:id", requireAuth, async (req, res) => {
    const hub = await getReqHubModels(req);
    if (hub) await hub.Combo.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(204).end();
  });

  // ── Customer auth & profile routes ──────────────────────────────────────

  const requireCustomer = (req: any, res: any, next: any) => {
    if (req.session?.customerPhone) return next();
    res.status(401).json({ message: "Not logged in" });
  };

  app.post("/api/customer/request-otp", async (req, res) => {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
      return res.status(400).json({ message: "Valid 10-digit phone number required" });
    }
    const normalised = String(phone).trim();
    otpStore.set(normalised, { otp: "1234", expiresAt: Date.now() + OTP_TTL_MS });
    res.json({ message: "OTP sent" });
  });

  app.post("/api/customer/verify-otp", async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "phone and otp required" });
    const normalised = String(phone).trim();
    const entry = otpStore.get(normalised);
    if (!entry || Date.now() > entry.expiresAt || entry.otp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    otpStore.delete(normalised);
    const customer = await storage.upsertCustomer(normalised, { phone: normalised });
    req.session.customerPhone = normalised;
    res.json(customer);
  });

  app.get("/api/customer/me", requireCustomer, async (req, res) => {
    const customer = await storage.getCustomerByPhone(req.session.customerPhone!);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  app.patch("/api/customer/me", requireCustomer, async (req, res) => {
    const parsed = updateCustomerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const customer = await storage.updateCustomer(req.session.customerPhone!, parsed.data);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  app.post("/api/customer/me/addresses", requireCustomer, async (req, res) => {
    const parsed = insertCustomerAddressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const customer = await storage.addCustomerAddress(req.session.customerPhone!, parsed.data);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  });

  app.patch("/api/customer/me/addresses/:addrId", requireCustomer, async (req, res) => {
    const parsed = insertCustomerAddressSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const customer = await storage.updateCustomerAddress(req.session.customerPhone!, req.params.addrId, parsed.data);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  });

  app.delete("/api/customer/me/addresses/:addrId", requireCustomer, async (req, res) => {
    const customer = await storage.deleteCustomerAddress(req.session.customerPhone!, req.params.addrId);
    if (!customer) return res.status(404).json({ message: "Not found" });
    res.json(customer);
  });

  app.get("/api/customer/me/orders", requireCustomer, async (req, res) => {
    const phone = req.session.customerPhone!;
    try {
      const orders = await storage.getOrdersByPhone(phone);
      res.json(orders);
    } catch {
      res.json([]);
    }
  });

  app.post("/api/customer/logout", (req, res) => {
    delete req.session.customerPhone;
    res.json({ message: "Logged out" });
  });

  // ── Admin customers route ────────────────────────────────────────────────
  app.get("/api/admin/customers", requireAuth, async (_req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  return httpServer;
}
