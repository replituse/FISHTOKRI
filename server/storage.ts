import { UserModel, ProductModel, OrderModel, CarouselModel, CategoryModel, SectionModel, ComboModel } from "./db";
import { CustomerDbModel } from "./customerDb";
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
  Category,
  InsertCategory,
  Section,
  InsertSection,
  Combo,
  InsertCombo,
  Customer,
  InsertCustomer,
  UpdateCustomer,
  CustomerAddress,
  EmbeddedOrder,
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
    subCategory: doc.subCategory ?? null,
    status: doc.status,
    limitedStockNote: doc.limitedStockNote ?? null,
    price: doc.price ?? null,
    originalPrice: doc.originalPrice ?? null,
    unit: doc.unit ?? null,
    imageUrl: doc.imageUrl ?? null,
    isArchived: doc.isArchived ?? false,
    updatedAt: doc.updatedAt,
    sectionId: doc.sectionId ?? null,
    description: doc.description ?? null,
    weight: doc.weight ?? null,
    pieces: doc.pieces ?? null,
    serves: doc.serves ?? null,
    discountPct: doc.discountPct ?? null,
    quantity: doc.quantity ?? null,
    recipes: (doc.recipes ?? []).map((r: any) => ({ title: r.title ?? "", description: r.description ?? "" })),
  };
}

function toSection(doc: any): Section {
  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type ?? "products",
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive ?? true,
  };
}

function toCategory(doc: any): Category {
  return {
    id: doc._id.toString(),
    name: doc.name,
    imageUrl: doc.imageUrl ?? null,
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive ?? true,
    subCategories: (doc.subCategories ?? []).map((s: any) => ({
      name: s.name,
      imageUrl: s.imageUrl ?? null,
    })),
  };
}

function toCustomer(doc: any): Customer {
  return {
    id: doc._id.toString(),
    phone: doc.phone,
    name: doc.name ?? null,
    email: doc.email ?? null,
    dateOfBirth: doc.dateOfBirth ?? null,
    addresses: (doc.addresses ?? []).map((a: any) => ({
      id: a._id.toString(),
      name: a.name ?? "",
      phone: a.phone ?? "",
      building: a.building ?? "",
      street: a.street ?? "",
      area: a.area ?? "",
      pincode: a.pincode ?? "",
      type: a.type ?? "house",
      label: a.label ?? "Home",
      instructions: a.instructions ?? "",
    })),
    orders: (doc.orders ?? []).map((o: any) => ({
      orderId: o.orderId,
      customerName: o.customerName,
      phone: o.phone,
      deliveryArea: o.deliveryArea,
      address: o.address,
      items: o.items,
      status: o.status ?? "pending",
      notes: o.notes ?? null,
      total: o.total ?? null,
      placedAt: o.placedAt,
      updatedAt: o.updatedAt,
    })),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toCombo(doc: any): Combo {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? null,
    fullDescription: doc.fullDescription ?? null,
    serves: doc.serves ?? null,
    weight: doc.weight ?? null,
    discountedPrice: doc.discountedPrice,
    originalPrice: doc.originalPrice,
    discount: doc.discount ?? 0,
    includes: (doc.includes ?? []).map((item: any) => ({
      productId: item.productId,
      label: item.label,
    })),
    tags: doc.tags ?? [],
    nutrition: (doc.nutrition ?? []).map((n: any) => ({
      label: n.label,
      value: n.value,
      icon: n.icon ?? "",
    })),
    isActive: doc.isActive ?? true,
    sortOrder: doc.sortOrder ?? 0,
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

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  upsertCategory(name: string, data: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<void>;

  getSections(): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  updateSection(id: string, updates: Partial<InsertSection>): Promise<Section | undefined>;
  deleteSection(id: string): Promise<void>;

  getCombos(): Promise<Combo[]>;
  getCombo(id: string): Promise<Combo | undefined>;
  createCombo(combo: InsertCombo): Promise<Combo>;
  updateCombo(id: string, updates: Partial<InsertCombo>): Promise<Combo | undefined>;
  deleteCombo(id: string): Promise<void>;

  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(data: InsertCustomer): Promise<Customer>;
  upsertCustomer(phone: string, data: Partial<InsertCustomer>): Promise<Customer>;
  updateCustomer(phone: string, updates: UpdateCustomer): Promise<Customer | undefined>;
  addCustomerAddress(phone: string, address: Omit<CustomerAddress, "id">): Promise<Customer | undefined>;
  updateCustomerAddress(phone: string, addrId: string, updates: Partial<Omit<CustomerAddress, "id">>): Promise<Customer | undefined>;
  deleteCustomerAddress(phone: string, addrId: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  pushOrderToCustomer(phone: string, order: Omit<EmbeddedOrder, "updatedAt">): Promise<void>;
  updateCustomerOrderStatus(phone: string, orderId: string, status: string): Promise<void>;
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

  async getCategories(): Promise<Category[]> {
    const docs = await CategoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return docs.map(toCategory);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    try {
      const doc = await CategoryModel.findById(id).lean();
      return doc ? toCategory(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async upsertCategory(name: string, data: InsertCategory): Promise<Category> {
    const doc = await CategoryModel.findOneAndUpdate(
      { name },
      { $set: data },
      { new: true, upsert: true }
    ).lean();
    return toCategory(doc);
  }

  async updateCategory(id: string, updates: Partial<InsertCategory>): Promise<Category | undefined> {
    try {
      const doc = await CategoryModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      return doc ? toCategory(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await CategoryModel.findByIdAndUpdate(id, { isActive: false });
    } catch {
      // ignore
    }
  }

  async getSections(): Promise<Section[]> {
    const docs = await SectionModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return docs.map(toSection);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const doc = await SectionModel.create({
      ...section,
      type: section.type ?? "products",
      isActive: section.isActive ?? true,
    });
    return toSection(doc);
  }

  async updateSection(id: string, updates: Partial<InsertSection>): Promise<Section | undefined> {
    try {
      const doc = await SectionModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      return doc ? toSection(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async deleteSection(id: string): Promise<void> {
    try {
      await SectionModel.findByIdAndDelete(id);
    } catch {
      // ignore
    }
  }

  async getCombos(): Promise<Combo[]> {
    const docs = await ComboModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    return docs.map(toCombo);
  }

  async getCombo(id: string): Promise<Combo | undefined> {
    try {
      const doc = await ComboModel.findById(id).lean();
      return doc ? toCombo(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async createCombo(combo: InsertCombo): Promise<Combo> {
    const doc = await ComboModel.create({
      ...combo,
      isActive: combo.isActive ?? true,
      sortOrder: combo.sortOrder ?? 0,
    });
    return toCombo(doc);
  }

  async updateCombo(id: string, updates: Partial<InsertCombo>): Promise<Combo | undefined> {
    try {
      const doc = await ComboModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
      return doc ? toCombo(doc) : undefined;
    } catch {
      return undefined;
    }
  }

  async deleteCombo(id: string): Promise<void> {
    try {
      await ComboModel.findByIdAndUpdate(id, { isActive: false });
    } catch {
      // ignore
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const doc = await CustomerDbModel.findOne({ phone }).lean();
    return doc ? toCustomer(doc) : undefined;
  }

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const doc = await CustomerDbModel.create({ ...data, addresses: [], orders: [], createdAt: new Date(), updatedAt: new Date() });
    return toCustomer(doc);
  }

  async upsertCustomer(phone: string, data: Partial<InsertCustomer>): Promise<Customer> {
    const { phone: _ignored, ...rest } = data as any;
    const doc = await CustomerDbModel.findOneAndUpdate(
      { phone },
      { $set: { ...rest, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date(), addresses: [], orders: [] } },
      { new: true, upsert: true }
    ).lean();
    return toCustomer(doc);
  }

  async updateCustomer(phone: string, updates: UpdateCustomer): Promise<Customer | undefined> {
    const doc = await CustomerDbModel.findOneAndUpdate(
      { phone },
      { $set: { ...updates, updatedAt: new Date() } },
      { new: true }
    ).lean();
    return doc ? toCustomer(doc) : undefined;
  }

  async addCustomerAddress(phone: string, address: Omit<CustomerAddress, "id">): Promise<Customer | undefined> {
    const doc = await CustomerDbModel.findOneAndUpdate(
      { phone },
      { $push: { addresses: address }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();
    return doc ? toCustomer(doc) : undefined;
  }

  async updateCustomerAddress(phone: string, addrId: string, updates: Partial<Omit<CustomerAddress, "id">>): Promise<Customer | undefined> {
    const setFields: Record<string, any> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(updates)) {
      setFields[`addresses.$.${k}`] = v;
    }
    const doc = await CustomerDbModel.findOneAndUpdate(
      { phone, "addresses._id": addrId },
      { $set: setFields },
      { new: true }
    ).lean();
    return doc ? toCustomer(doc) : undefined;
  }

  async deleteCustomerAddress(phone: string, addrId: string): Promise<Customer | undefined> {
    const doc = await CustomerDbModel.findOneAndUpdate(
      { phone },
      { $pull: { addresses: { _id: addrId } }, $set: { updatedAt: new Date() } },
      { new: true }
    ).lean();
    return doc ? toCustomer(doc) : undefined;
  }

  async getAllCustomers(): Promise<Customer[]> {
    const docs = await CustomerDbModel.find().sort({ createdAt: -1 }).lean();
    return docs.map(toCustomer);
  }

  async pushOrderToCustomer(phone: string, order: Omit<EmbeddedOrder, "updatedAt">): Promise<void> {
    try {
      const embeddedOrder = { ...order, updatedAt: new Date() };
      await CustomerDbModel.findOneAndUpdate(
        { phone },
        {
          $push: { orders: embeddedOrder },
          $set: { updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date(), addresses: [] },
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("Failed to push order to customer document:", err);
    }
  }

  async updateCustomerOrderStatus(phone: string, orderId: string, status: string): Promise<void> {
    try {
      await CustomerDbModel.findOneAndUpdate(
        { phone, "orders.orderId": orderId },
        {
          $set: {
            "orders.$.status": status,
            "orders.$.updatedAt": new Date(),
            updatedAt: new Date(),
          },
        }
      );
    } catch (err) {
      console.error("Failed to update customer order status:", err);
    }
  }
}

export const storage = new MongoStorage();
