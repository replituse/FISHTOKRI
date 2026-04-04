import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { setupAuth } from "./auth";
import { connectDB, SectionModel, ProductModel } from "./db";
import { setImage, getImage, deleteImage } from "./imageStore";
import { insertCarouselSlideSchema, insertCategorySchema, insertSectionSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await connectDB();
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

  // Products routes
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post(api.products.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.products.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(req.params.id, input);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.products.bulkUpdateStatus.path, requireAuth, async (req, res) => {
    try {
      const { category, status } = api.products.bulkUpdateStatus.input.parse(req.body);
      const products = await storage.getProducts();
      const promises = products
        .filter(p => p.category === category)
        .map(p => storage.updateProduct(p.id, { status }));
      await Promise.all(promises);
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.products.delete.path, requireAuth, async (req, res) => {
    await storage.deleteProduct(req.params.id);
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
      await storage.updateProduct(id, { imageUrl });
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
    const slides = await storage.getCarouselSlides();
    res.json(slides);
  });

  app.post("/api/carousel", requireAuth, async (req, res) => {
    try {
      const input = insertCarouselSlideSchema.parse(req.body);
      const slide = await storage.createCarouselSlide(input);
      res.status(201).json(slide);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/carousel/:id", requireAuth, async (req, res) => {
    try {
      const input = insertCarouselSlideSchema.partial().parse(req.body);
      const slide = await storage.updateCarouselSlide(req.params.id, input);
      if (!slide) return res.status(404).json({ message: "Slide not found" });
      res.json(slide);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/carousel/:id", requireAuth, async (req, res) => {
    await storage.deleteCarouselSlide(req.params.id);
    res.status(204).end();
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const input = insertCategorySchema.parse(req.body);
      const category = await storage.upsertCategory(input.name, input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const input = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, input);
      if (!category) return res.status(404).json({ message: "Category not found" });
      res.json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    await storage.deleteCategory(req.params.id);
    res.status(204).end();
  });

  // Sections routes
  app.get("/api/sections", async (req, res) => {
    const sections = await storage.getSections();
    res.json(sections);
  });

  app.post("/api/sections", requireAuth, async (req, res) => {
    try {
      const input = insertSectionSchema.parse(req.body);
      const section = await storage.createSection(input);
      res.status(201).json(section);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/sections/:id", requireAuth, async (req, res) => {
    try {
      const input = insertSectionSchema.partial().parse(req.body);
      const section = await storage.updateSection(req.params.id, input);
      if (!section) return res.status(404).json({ message: "Section not found" });
      res.json(section);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/sections/:id", requireAuth, async (req, res) => {
    await storage.deleteSection(req.params.id);
    res.status(204).end();
  });

  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Seed categories — upsert by name so existing docs get imageUrl + subCategories added
  const defaultCategories = [
    {
      name: "All", imageUrl: "/categories/all.png", sortOrder: 0, isActive: true,
      subCategories: [],
    },
    {
      name: "Fish", imageUrl: "/categories/fish.png", sortOrder: 1, isActive: true,
      subCategories: [
        { name: "Silver Pomfret", imageUrl: null },
        { name: "Black Pomfret", imageUrl: null },
        { name: "Khapri Pomfret", imageUrl: null },
        { name: "Surmai (King Fish)", imageUrl: null },
        { name: "Rawas (Indian Salmon)", imageUrl: null },
        { name: "Lady Fish", imageUrl: null },
        { name: "Bombil (Bombay Duck)", imageUrl: null },
        { name: "Bangda (Mackerel)", imageUrl: null },
        { name: "Tarli (Sardine)", imageUrl: null },
        { name: "Karli", imageUrl: null },
        { name: "Shark", imageUrl: null },
        { name: "Catla", imageUrl: null },
        { name: "Tuna", imageUrl: null },
        { name: "Ghol", imageUrl: null },
        { name: "Jitada", imageUrl: null },
        { name: "Vaam", imageUrl: null },
        { name: "Indian Basa", imageUrl: null },
        { name: "Rohu", imageUrl: null },
      ],
    },
    {
      name: "Prawns", imageUrl: "/categories/prawns.png", sortOrder: 2, isActive: true,
      subCategories: [
        { name: "White Prawn", imageUrl: null },
        { name: "Red Prawn", imageUrl: null },
        { name: "Tiger Prawn", imageUrl: null },
        { name: "Freshwater Prawn", imageUrl: null },
        { name: "Scampi Prawn", imageUrl: null },
        { name: "Lobsters", imageUrl: null },
        { name: "Kardi", imageUrl: null },
        { name: "Jumbo Prawn", imageUrl: null },
      ],
    },
    {
      name: "Chicken", imageUrl: "/categories/chicken.png", sortOrder: 3, isActive: true,
      subCategories: [
        { name: "Chicken Curry Cut", imageUrl: null },
        { name: "Chicken Breast", imageUrl: null },
        { name: "Chicken Boneless Cubes", imageUrl: null },
        { name: "Chicken Whole Leg", imageUrl: null },
        { name: "Chicken Drumstick", imageUrl: null },
        { name: "Chicken Lollipop", imageUrl: null },
        { name: "Chicken Kheema", imageUrl: null },
        { name: "Chicken Liver", imageUrl: null },
      ],
    },
    {
      name: "Mutton", imageUrl: "/categories/mutton.png", sortOrder: 4, isActive: true,
      subCategories: [
        { name: "Goat Curry Cut", imageUrl: null },
        { name: "Goat Shoulder Cut", imageUrl: null },
        { name: "Goat Boneless", imageUrl: null },
        { name: "Goat Liver", imageUrl: null },
        { name: "Goat Kheema", imageUrl: null },
        { name: "Goat Paya", imageUrl: null },
        { name: "Goat Brain", imageUrl: null },
        { name: "Goat Biryani Cut", imageUrl: null },
      ],
    },
    {
      name: "Masalas", imageUrl: "/categories/masalas.png", sortOrder: 5, isActive: true,
      subCategories: [
        { name: "Fish Curry Masala", imageUrl: null },
        { name: "Fish Fry Masala", imageUrl: null },
        { name: "Malvani Masala", imageUrl: null },
        { name: "Special Chicken Masala", imageUrl: null },
        { name: "Special Mutton Masala", imageUrl: null },
        { name: "Koliwada Masala", imageUrl: null },
      ],
    },
    {
      name: "Crab", imageUrl: "/categories/prawns.png", sortOrder: 6, isActive: true,
      subCategories: [],
    },
    {
      name: "Squid", imageUrl: "/categories/fish.png", sortOrder: 7, isActive: true,
      subCategories: [],
    },
    {
      name: "Lobster", imageUrl: "/categories/prawns.png", sortOrder: 8, isActive: true,
      subCategories: [],
    },
    {
      name: "Dried Fish", imageUrl: "/categories/fish.png", sortOrder: 9, isActive: true,
      subCategories: [],
    },
    {
      name: "Eggs", imageUrl: "/categories/chicken.png", sortOrder: 10, isActive: true,
      subCategories: [],
    },
    {
      name: "Mutton Keema", imageUrl: "/categories/mutton.png", sortOrder: 11, isActive: true,
      subCategories: [],
    },
  ];

  for (const cat of defaultCategories) {
    await storage.upsertCategory(cat.name, cat);
  }
  console.log("Seeded/updated categories in MongoDB.");

  const existingSlides = await storage.getCarouselSlides();
  if (existingSlides.length === 0) {
    await storage.createCarouselSlide({ imageUrl: "/banners/banner1.png", title: null, linkUrl: null, order: 0, isActive: true });
    await storage.createCarouselSlide({ imageUrl: "/banners/banner2.png", title: null, linkUrl: null, order: 1, isActive: true });
    console.log("Seeded carousel with default banners.");
  }

  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    const defaultProducts = [
      { name: "Silver Pomfret", category: "Fish", status: "available", price: 1200, unit: "per kg" },
      { name: "Black Pomfret", category: "Fish", status: "available", price: 1100, unit: "per kg" },
      { name: "Khapri Pomfret", category: "Fish", status: "available", price: 1000, unit: "per kg" },
      { name: "Surmai", category: "Fish", status: "available", price: 900, unit: "per kg" },
      { name: "Rawas", category: "Fish", status: "available", price: 950, unit: "per kg" },
      { name: "Lady Fish", category: "Fish", status: "available", price: 600, unit: "per kg" },
      { name: "Bombil", category: "Fish", status: "available", price: 400, unit: "per kg" },
      { name: "Bangda", category: "Fish", status: "available", price: 350, unit: "per kg" },
      { name: "Tarli", category: "Fish", status: "available", price: 300, unit: "per kg" },
      { name: "Karli", category: "Fish", status: "available", price: 450, unit: "per kg" },
      { name: "Shark", category: "Fish", status: "available", price: 550, unit: "per kg" },
      { name: "Catla", category: "Fish", status: "available", price: 300, unit: "per kg" },
      { name: "Tuna", category: "Fish", status: "available", price: 500, unit: "per kg" },
      { name: "Ghol", category: "Fish", status: "available", price: 1500, unit: "per kg" },
      { name: "Jitada", category: "Fish", status: "available", price: 800, unit: "per kg" },
      { name: "Vaam", category: "Fish", status: "available", price: 700, unit: "per kg" },
      { name: "Indian Basa", category: "Fish", status: "available", price: 400, unit: "per kg" },
      { name: "Rohu", category: "Fish", status: "available", price: 300, unit: "per kg" },
      { name: "White Prawn", category: "Prawns", status: "available", price: 700, unit: "per kg" },
      { name: "Red Prawn", category: "Prawns", status: "available", price: 750, unit: "per kg" },
      { name: "Tiger Prawn", category: "Prawns", status: "available", price: 1200, unit: "per kg" },
      { name: "Freshwater Prawn", category: "Prawns", status: "available", price: 650, unit: "per kg" },
      { name: "Scampi Prawn", category: "Prawns", status: "available", price: 900, unit: "per kg" },
      { name: "Lobsters", category: "Prawns", status: "available", price: 2500, unit: "per kg" },
      { name: "Kardi", category: "Prawns", status: "available", price: 400, unit: "per kg" },
      { name: "Jumbo Prawn", category: "Prawns", status: "available", price: 1500, unit: "per kg" },
      { name: "Chicken Curry Cut", category: "Chicken", status: "available", price: 250, unit: "per kg" },
      { name: "Chicken Breast", category: "Chicken", status: "available", price: 350, unit: "per kg" },
      { name: "Chicken Boneless Cubes", category: "Chicken", status: "available", price: 400, unit: "per kg" },
      { name: "Chicken Whole Leg", category: "Chicken", status: "available", price: 300, unit: "per kg" },
      { name: "Chicken Drumstick", category: "Chicken", status: "available", price: 350, unit: "per kg" },
      { name: "Chicken Lollipop", category: "Chicken", status: "available", price: 300, unit: "per 10pcs" },
      { name: "Chicken Kheema", category: "Chicken", status: "available", price: 450, unit: "per kg" },
      { name: "Chicken Liver", category: "Chicken", status: "available", price: 150, unit: "per kg" },
      { name: "Goat Curry Cut", category: "Mutton", status: "available", price: 850, unit: "per kg" },
      { name: "Goat Shoulder Cut", category: "Mutton", status: "available", price: 900, unit: "per kg" },
      { name: "Goat Boneless", category: "Mutton", status: "available", price: 1100, unit: "per kg" },
      { name: "Goat Liver", category: "Mutton", status: "available", price: 850, unit: "per kg" },
      { name: "Goat Kheema", category: "Mutton", status: "available", price: 950, unit: "per kg" },
      { name: "Goat Paya", category: "Mutton", status: "available", price: 400, unit: "per 4pcs" },
      { name: "Goat Brain", category: "Mutton", status: "available", price: 250, unit: "per pc" },
      { name: "Goat Biryani Cut", category: "Mutton", status: "available", price: 850, unit: "per kg" },
      { name: "Fish Curry Masala", category: "Masalas", status: "available", price: 50, unit: "per pc" },
      { name: "Fish Fry Masala", category: "Masalas", status: "available", price: 50, unit: "per pc" },
      { name: "Malvani Masala", category: "Masalas", status: "available", price: 100, unit: "per 100g" },
      { name: "Special Chicken Masala", category: "Masalas", status: "available", price: 60, unit: "per pc" },
      { name: "Special Mutton Masala", category: "Masalas", status: "available", price: 60, unit: "per pc" },
      { name: "Koliwada Masala", category: "Masalas", status: "available", price: 70, unit: "per pc" },
    ];
    for (const product of defaultProducts) {
      await storage.createProduct(product);
    }
    console.log("Seeded MongoDB with all FishTokri products.");
  }

  // ── Section seeding ──────────────────────────────────────────────
  const existingSections = await SectionModel.find();
  if (existingSections.length === 0) {
    const sectionsToCreate = [
      { title: "Combos Special", type: "combos", sortOrder: 0, isActive: true },
      { title: "FishTokri Today's Special", type: "products", sortOrder: 1, isActive: true },
      { title: "Fish Specials", type: "products", sortOrder: 2, isActive: true },
      { title: "Prawns Specials", type: "products", sortOrder: 3, isActive: true },
      { title: "Chicken Specials", type: "products", sortOrder: 4, isActive: true },
      { title: "Mutton Specials", type: "products", sortOrder: 5, isActive: true },
    ];
    const created = await SectionModel.insertMany(sectionsToCreate);
    const sectionMap: Record<string, string> = {};
    for (const s of created) {
      sectionMap[s.title as string] = (s._id as any).toString();
    }
    await ProductModel.updateMany({ category: "Fish" }, { sectionId: sectionMap["Fish Specials"] });
    await ProductModel.updateMany({ category: "Prawns" }, { sectionId: sectionMap["Prawns Specials"] });
    await ProductModel.updateMany({ category: "Chicken" }, { sectionId: sectionMap["Chicken Specials"] });
    await ProductModel.updateMany({ category: "Mutton" }, { sectionId: sectionMap["Mutton Specials"] });
    const todaySpecialNames = ["Silver Pomfret", "Tiger Prawn", "Chicken Curry Cut", "Goat Curry Cut", "Surmai", "Jumbo Prawn"];
    await ProductModel.updateMany({ name: { $in: todaySpecialNames } }, { sectionId: sectionMap["FishTokri Today's Special"] });
    console.log("Seeded sections and assigned products.");
  }

  // ── Product detail migration (runs always, only fills nulls) ─────
  const productDetails: Record<string, {
    subCategory: string; description: string; weight: string; pieces: string; serves: string; discountPct: number;
  }> = {
    "Silver Pomfret": { subCategory: "Silver Pomfret", description: "Premium silver pomfret from the Arabian Sea, known for its delicate white flesh and mild flavour. Perfect for shallow frying, grilling, or light curries. Cleaned and dressed fresh every morning.", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 10 },
    "Black Pomfret": { subCategory: "Black Pomfret", description: "Rich, full-flavoured black pomfret with firm fatty flesh — the Goan coast's favourite. Ideal for tandoor, masala fry, or spiced curries. Cleaned and ready to cook.", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 8 },
    "Khapri Pomfret": { subCategory: "Khapri Pomfret", description: "Khapri Pomfret is prized for its succulent flesh and earthy, coastal flavour. A Konkan cuisine staple — best enjoyed fried in a spiced coconut masala.", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 10 },
    "Surmai": { subCategory: "Surmai (King Fish)", description: "Surmai (King Fish) is the crown jewel of Indian seafood — firm, meaty, and mildly flavoured. Perfect for tawa fry, grills, and coconut curries. Sourced fresh from Mumbai's fishing docks.", weight: "500 g", pieces: "2–4 Steaks", serves: "Serves 3", discountPct: 12 },
    "Rawas": { subCategory: "Rawas (Indian Salmon)", description: "Rawas (Indian Salmon) is rich in Omega-3 fatty acids with distinctive pink flesh and a buttery, mellow taste. Excellent grilled, baked, or in a light coastal curry.", weight: "500 g", pieces: "3–4 Pieces", serves: "Serves 3", discountPct: 10 },
    "Lady Fish": { subCategory: "Lady Fish (Kane)", description: "Lady Fish (Kane) has delicate, sweet-tasting flesh prized in South Indian and Goan cuisine. Best enjoyed shallow-fried with a crispy rava coating and lemon wedges.", weight: "500 g", pieces: "4–6 Pieces", serves: "Serves 3", discountPct: 8 },
    "Bombil": { subCategory: "Bombil (Bombay Duck)", description: "Bombil (Bombay Duck) is Mumbai's iconic catch — gelatinous and uniquely flavoured. Best deep-fried to a crispy golden finish or sun-dried for traditional preparations.", weight: "500 g", pieces: "5–8 Pieces", serves: "Serves 3", discountPct: 10 },
    "Bangda": { subCategory: "Bangda (Mackerel)", description: "Bangda (Mackerel) is an oily, flavour-packed fish loaded with Omega-3s and vitamins. Perfect for Goan recheado masala, Malvani curry, or a classic tawa fry.", weight: "500 g", pieces: "3–4 Pieces", serves: "Serves 3", discountPct: 8 },
    "Tarli": { subCategory: "Tarli (Sardine)", description: "Tarli (Sardine) is a nutritious, affordable coastal fish rich in calcium and Omega-3s. Traditionally prepared as a spicy Malvani masala fry or a bold curry.", weight: "500 g", pieces: "8–12 Pieces", serves: "Serves 3", discountPct: 5 },
    "Karli": { subCategory: "Karli", description: "Karli is a popular coastal fish with firm, tasty flesh and a mild, pleasant flavour. Excellent for spicy dry curries and crispy fried preparations.", weight: "500 g", pieces: "3–5 Pieces", serves: "Serves 3", discountPct: 8 },
    "Shark": { subCategory: "Shark", description: "Fresh shark meat with firm white flesh — low in fat and high in protein. Popular in South Indian coastal cuisine as a spiced dry masala fry or curry.", weight: "500 g", pieces: "3–4 Pieces", serves: "Serves 3", discountPct: 8 },
    "Catla": { subCategory: "Catla", description: "Catla is a prized freshwater fish with tender white flesh and a clean, mild flavour. Perfect for Bengali-style mustard curry or a light spiced preparation.", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 8 },
    "Tuna": { subCategory: "Tuna", description: "Fresh tuna steaks — high in protein and rich in Omega-3s. Exceptional for grilling, pan-searing, or a classic Goan tuna curry. A true ocean powerhouse.", weight: "500 g", pieces: "2–4 Steaks", serves: "Serves 3", discountPct: 10 },
    "Ghol": { subCategory: "Ghol", description: "Ghol is a premium, meaty fish prized for its golden colour and near-mythical health benefits. A coastal luxury — traditionally made into thick, rich gravies.", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 8 },
    "Jitada": { subCategory: "Jitada", description: "Jitada is a firm-fleshed coastal fish with excellent, full-bodied flavour. Ideal for traditional Malvani spicy masala curries and fry preparations.", weight: "500 g", pieces: "3–5 Pieces", serves: "Serves 3", discountPct: 8 },
    "Vaam": { subCategory: "Vaam (Eel)", description: "Vaam (Eel) has tender, gelatinous flesh packed with unique flavour and richness. A coastal delicacy prized for its distinct taste and high nutritional value.", weight: "500 g", pieces: "3–4 Pieces", serves: "Serves 3", discountPct: 8 },
    "Indian Basa": { subCategory: "Indian Basa", description: "Indian Basa is a mild, boneless freshwater fish with soft, flaky flesh — perfect for beginners. Great for fish and chips, lemon butter fry, or simple curries.", weight: "500 g", pieces: "4–6 Fillets", serves: "Serves 3", discountPct: 10 },
    "Rohu": { subCategory: "Rohu", description: "Rohu is a freshwater favourite with sweet, firm white flesh. A household staple — classically prepared in Bengali mustard curry, biryani, or as a crispy fry.", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 8 },
    "White Prawn": { subCategory: "White Prawn", description: "Fresh white prawns with sweet, juicy meat and a firm bite. Versatile and quick to cook — excellent in curries, stir-fries, and grills. Deveined and cleaned fresh.", weight: "500 g", pieces: "18–22 Pieces", serves: "Serves 3", discountPct: 10 },
    "Red Prawn": { subCategory: "Red Prawn", description: "Red prawns are known for their deep, vibrant colour and rich, sweet flavour. A coastal delicacy — excellent for Malvani masala preparations and prawn biryani.", weight: "500 g", pieces: "16–20 Pieces", serves: "Serves 3", discountPct: 8 },
    "Tiger Prawn": { subCategory: "Tiger Prawn", description: "Premium tiger prawns with firm, succulent meat and a distinctive striped shell. A showstopper for garlic butter, tandoor, coastal curries, and BBQ.", weight: "500 g", pieces: "12–15 Pieces", serves: "Serves 3", discountPct: 10 },
    "Freshwater Prawn": { subCategory: "Freshwater Prawn", description: "Freshwater prawns with delicate, sweet flesh and tender texture. Popular in Malvani masala, mild coconut curries, and simple stir-fry preparations.", weight: "500 g", pieces: "15–18 Pieces", serves: "Serves 3", discountPct: 8 },
    "Scampi Prawn": { subCategory: "Scampi Prawn", description: "Scampi — a premium shellfish with uniquely sweet, delicate flavour. Best enjoyed in garlic butter, creamy pasta, or a light coconut curry. A true treat.", weight: "500 g", pieces: "10–14 Pieces", serves: "Serves 3", discountPct: 12 },
    "Lobsters": { subCategory: "Lobster", description: "Fresh whole lobster — the ultimate seafood luxury. Rich, sweet and meaty, best enjoyed grilled with garlic butter, or in a classic coastal Thermidor.", weight: "500 g", pieces: "1–2 Pieces", serves: "Serves 2", discountPct: 8 },
    "Kardi": { subCategory: "Kardi", description: "Kardi are small, flavour-packed coastal prawns with naturally sweet taste. Excellent in traditional coconut-based Malvani curries and coastal stir-fries.", weight: "500 g", pieces: "20–25 Pieces", serves: "Serves 3", discountPct: 8 },
    "Jumbo Prawn": { subCategory: "Jumbo Prawn", description: "Large, meaty jumbo prawns bursting with bold flavour and a satisfying bite. A showstopper for BBQ grills, tandoor, or a rich garlic butter preparation.", weight: "500 g", pieces: "8–10 Pieces", serves: "Serves 3", discountPct: 10 },
    "Chicken Curry Cut": { subCategory: "Chicken Curry Cut", description: "Farm-fresh antibiotic-free chicken curry cut — bone-in pieces for maximum flavour. Perfect for slow-cooked curries, biryani, and stews. Pre-cleaned and ready to cook.", weight: "500 g", pieces: "8–10 Pieces", serves: "Serves 4", discountPct: 15 },
    "Chicken Breast": { subCategory: "Chicken Breast", description: "Lean, boneless chicken breast — high in protein and low in fat. Ideal for grilling, stir-fry, salads, and health-conscious meals. Tender and quick to cook.", weight: "500 g", pieces: "2 Pieces", serves: "Serves 4", discountPct: 12 },
    "Chicken Boneless Cubes": { subCategory: "Chicken Boneless Cubes", description: "Tender boneless chicken cubes — no prep needed, just marinate and cook. Perfect for tikka, butter chicken, stir-fry, and quick weeknight dinners.", weight: "500 g", pieces: "Cubed", serves: "Serves 4", discountPct: 15 },
    "Chicken Whole Leg": { subCategory: "Chicken Whole Leg", description: "Juicy, flavourful whole chicken leg pieces — the most succulent part of the bird. Perfect for roasting, grilling, biryani, and slow-cooked curries.", weight: "450 g", pieces: "2 Pieces", serves: "Serves 4", discountPct: 15 },
    "Chicken Drumstick": { subCategory: "Chicken Drumstick", description: "Meaty chicken drumsticks — a family favourite with rich flavour. Perfect for oven roasting, tandoor, BBQ, or a classic home-style curry.", weight: "500 g", pieces: "4–5 Pieces", serves: "Serves 4", discountPct: 12 },
    "Chicken Lollipop": { subCategory: "Chicken Lollipop", description: "Frenched chicken lollipops — the ultimate party appetiser. Marinate in spices and deep-fry, bake, or air-fry to a gorgeous golden finish.", weight: "300 g", pieces: "10 Pieces", serves: "Serves 3", discountPct: 10 },
    "Chicken Kheema": { subCategory: "Chicken Kheema", description: "Fresh chicken mince, ideal for keema pav, stuffed rolls, pasta sauce, and healthy burgers. Freshly ground daily with zero preservatives or additives.", weight: "500 g", pieces: "Minced", serves: "Serves 4", discountPct: 12 },
    "Chicken Liver": { subCategory: "Chicken Liver", description: "Nutrient-dense chicken liver packed with iron, zinc, and B vitamins. Best prepared as a spiced masala fry or a smooth, buttery pâté.", weight: "500 g", pieces: "Whole", serves: "Serves 4", discountPct: 8 },
    "Goat Curry Cut": { subCategory: "Goat Curry Cut", description: "Premium bone-in goat curry cut from locally sourced free-range goats. Rich, deeply flavoured meat that becomes incredibly tender when slow-cooked in curries and biryanis.", weight: "500 g", pieces: "6–8 Pieces", serves: "Serves 4", discountPct: 8 },
    "Goat Shoulder Cut": { subCategory: "Goat Shoulder Cut", description: "Well-marbled goat shoulder with a generous fat cap for maximum flavour. The ideal cut for slow-cooked curries, dum biryani, and rich Rogan Josh.", weight: "500 g", pieces: "4–6 Pieces", serves: "Serves 4", discountPct: 8 },
    "Goat Boneless": { subCategory: "Goat Boneless", description: "Premium boneless goat cubes — tender, lean, and versatile. Ideal for kebabs, keema, quick curries, and grills. No bones, no hassle, pure flavour.", weight: "500 g", pieces: "Cubed", serves: "Serves 4", discountPct: 8 },
    "Goat Liver": { subCategory: "Goat Liver (Kaleji)", description: "Fresh goat liver (Kaleji) — a nutritional powerhouse rich in iron, zinc, and vitamins A and B12. Best prepared as a dry spicy Kaleji masala fry.", weight: "500 g", pieces: "Sliced", serves: "Serves 4", discountPct: 8 },
    "Goat Kheema": { subCategory: "Goat Kheema", description: "Freshly minced goat meat for authentic keema pav, stuffed parathas, and keema biryani. Richer and more flavourful than chicken mince with deep, meaty character.", weight: "500 g", pieces: "Minced", serves: "Serves 4", discountPct: 8 },
    "Goat Paya": { subCategory: "Goat Paya (Trotters)", description: "Goat trotters (Paya) — slow-simmered in a warming, spiced broth for a deeply nourishing collagen-rich soup. A traditional winter morning favourite.", weight: "Per 4 Trotters", pieces: "4 Trotters", serves: "Serves 2", discountPct: 5 },
    "Goat Brain": { subCategory: "Goat Brain (Bheja)", description: "Fresh goat brain (Bheja) — a revered Mughlai delicacy. Rich, creamy and intensely flavourful when prepared as a classic Bheja Fry or Bheja Masala.", weight: "1 Piece", pieces: "1 Piece", serves: "Serves 2", discountPct: 5 },
    "Goat Biryani Cut": { subCategory: "Goat Biryani Cut", description: "Medium-sized bone-in goat biryani cuts — perfectly portioned for dum biryani. The bone imparts deep, rich flavour to the rice during slow cooking.", weight: "500 g", pieces: "5–7 Pieces", serves: "Serves 4", discountPct: 8 },
    "Fish Curry Masala": { subCategory: "Fish Curry Masala", description: "FishTokri's signature fish curry masala — a handcrafted blend of 12+ coastal spices for an authentic Malvani-style fish curry. Zero preservatives, freshly made.", weight: "100 g", pieces: "1 Pack", serves: "Makes 3–4 curries", discountPct: 5 },
    "Fish Fry Masala": { subCategory: "Fish Fry Masala", description: "Aromatic fish fry masala with coriander, red chilli, turmeric, and coastal spices. Creates a perfectly spiced, golden crust for shallow-fried fish in minutes.", weight: "100 g", pieces: "1 Pack", serves: "Makes 6–8 fries", discountPct: 5 },
    "Malvani Masala": { subCategory: "Malvani Masala", description: "Authentic Malvani masala — a bold, aromatic spice blend with 20+ traditional Konkan spices including dried coconut, star anise, and Malvani chilli. The soul of coastal cooking.", weight: "100 g", pieces: "1 Pack", serves: "Makes 4–5 curries", discountPct: 8 },
    "Special Chicken Masala": { subCategory: "Special Chicken Masala", description: "All-purpose chicken masala with a perfect balance of heat and aroma. Makes restaurant-quality chicken curry, dry masalas, and marinades at home.", weight: "100 g", pieces: "1 Pack", serves: "Makes 3–4 dishes", discountPct: 5 },
    "Special Mutton Masala": { subCategory: "Special Mutton Masala", description: "Rich, deep-flavoured mutton masala for slow-cooked curries and biryanis. Packed with whole-spice goodness including star anise, cardamom, and black pepper.", weight: "100 g", pieces: "1 Pack", serves: "Makes 3–4 dishes", discountPct: 5 },
    "Koliwada Masala": { subCategory: "Koliwada Masala", description: "Signature Koliwada batter masala inspired by Mumbai's fishing village. The perfect spice blend for creating crispy, golden Koliwada-style fried seafood at home.", weight: "70 g", pieces: "1 Pack", serves: "Makes 6–8 fries", discountPct: 8 },
  };

  for (const [name, details] of Object.entries(productDetails)) {
    await ProductModel.updateOne(
      { name, description: null },
      { $set: details }
    );
  }
  console.log("Product detail fields migration done.");
}
