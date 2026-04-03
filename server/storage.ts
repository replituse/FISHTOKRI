import { UserModel, ProductModel, OrderModel, CarouselModel } from "./db";
import type {
  User,
  InsertUser,
  Product,
  InsertProduct,
  UpdateProductRequest,
  OrderRequest,
  InsertOrderRequest,
  CarouselSlide,
  InsertCarouselSlide,
} from "@shared/schema";

function toUser(doc: any): User {
  return {
    id: doc._id.toString(),
    username: doc.username,
    password: doc.password,
  };
}

function toProduct(doc: any): Product {
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    status: doc.status,
    limitedStockNote: doc.limitedStockNote ?? null,
    price: doc.price ?? null,
    unit: doc.unit ?? null,
    imageUrl: doc.imageUrl ?? null,
    isArchived: doc.isArchived ?? false,
    updatedAt: doc.updatedAt,
  };
}

function toCarouselSlide(doc: any): CarouselSlide {
  return {
    id: doc._id.toString(),
    imageUrl: doc.imageUrl,
    title: doc.title ?? null,
    linkUrl: doc.linkUrl ?? null,
    order: doc.order ?? 0,
    isActive: doc.isActive ?? true,
  };
}

function toOrder(doc: any): OrderRequest {
  return {
    id: doc._id.toString(),
    customerName: doc.customerName,
    phone: doc.phone,
    deliveryArea: doc.deliveryArea,
    address: doc.address,
    items: doc.items,
    status: doc.status,
    notes: doc.notes ?? null,
    createdAt: doc.createdAt,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: UpdateProductRequest): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;

  getOrderRequests(): Promise<OrderRequest[]>;
  getOrdersByPhone(phone: string): Promise<OrderRequest[]>;
  getOrderRequest(id: string): Promise<OrderRequest | undefined>;
  createOrderRequest(order: InsertOrderRequest): Promise<OrderRequest>;
  updateOrderRequestStatus(id: string, status: string): Promise<OrderRequest | undefined>;

  getCarouselSlides(): Promise<CarouselSlide[]>;
  createCarouselSlide(slide: InsertCarouselSlide): Promise<CarouselSlide>;
  updateCarouselSlide(id: string, updates: Partial<InsertCarouselSlide>): Promise<CarouselSlide | undefined>;
  deleteCarouselSlide(id: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id).lean();
    return doc ? toUser(doc) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ username }).lean();
    return doc ? toUser(doc) : undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const doc = await UserModel.create(user);
    return toUser(doc);
  }

  async getProducts(): Promise<Product[]> {
    const docs = await ProductModel.find({ isArchived: false }).lean();
    return docs.map(toProduct);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    try {
      const doc = await ProductModel.findById(id).lean();
      return doc ? toProduct(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const doc = await ProductModel.create({
      ...product,
      status: product.status ?? "available",
      updatedAt: new Date(),
    });
    return toProduct(doc);
  }

  async updateProduct(id: string, updates: UpdateProductRequest): Promise<Product | undefined> {
    try {
      const doc = await ProductModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      return doc ? toProduct(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await ProductModel.findByIdAndUpdate(id, { isArchived: true });
    } catch {
      // ignore
    }
  }

  async getOrderRequests(): Promise<OrderRequest[]> {
    const docs = await OrderModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(toOrder);
  }

  async getOrdersByPhone(phone: string): Promise<OrderRequest[]> {
    const docs = await OrderModel.find({ phone }).sort({ createdAt: -1 }).lean();
    return docs.map(toOrder);
  }

  async getOrderRequest(id: string): Promise<OrderRequest | undefined> {
    try {
      const doc = await OrderModel.findById(id).lean();
      return doc ? toOrder(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async createOrderRequest(order: InsertOrderRequest): Promise<OrderRequest> {
    const doc = await OrderModel.create({
      ...order,
      status: "pending",
      createdAt: new Date(),
    });
    return toOrder(doc);
  }

  async updateOrderRequestStatus(id: string, status: string): Promise<OrderRequest | undefined> {
    try {
      const doc = await OrderModel.findByIdAndUpdate(id, { status }, { new: true }).lean();
      return doc ? toOrder(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async getCarouselSlides(): Promise<CarouselSlide[]> {
    const docs = await CarouselModel.find({ isActive: true }).sort({ order: 1 }).lean();
    return docs.map(toCarouselSlide);
  }

  async createCarouselSlide(slide: InsertCarouselSlide): Promise<CarouselSlide> {
    const doc = await CarouselModel.create(slide);
    return toCarouselSlide(doc);
  }

  async updateCarouselSlide(id: string, updates: Partial<InsertCarouselSlide>): Promise<CarouselSlide | undefined> {
    try {
      const doc = await CarouselModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return doc ? toCarouselSlide(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async deleteCarouselSlide(id: string): Promise<void> {
    try {
      await CarouselModel.findByIdAndDelete(id);
    } catch {
      // ignore
    }
  }
}

export const storage = new MongoStorage();
