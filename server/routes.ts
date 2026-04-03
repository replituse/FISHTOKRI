import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { setupAuth } from "./auth";
import { connectDB } from "./db";
import { setImage, getImage, deleteImage } from "./imageStore";
import { insertCarouselSlideSchema, insertCategorySchema } from "@shared/schema";

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
}
