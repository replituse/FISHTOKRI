import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

const connectionCache = new Map<string, mongoose.Connection>();

const inventoryBatchSchema = new mongoose.Schema({
  quantity: { type: Number, required: true },
  shelfLifeDays: { type: Number, required: true },
  entryDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, default: null },
  remainingTime: { type: String, default: null },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, default: null },
  status: { type: String, default: "available" },
  limitedStockNote: { type: String, default: null },
  price: { type: Number, default: null },
  originalPrice: { type: Number, default: null },
  unit: { type: String, default: null },
  imageUrl: { type: String, default: null },
  isArchived: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
  sectionId: { type: mongoose.Schema.Types.Mixed, default: null },
  description: { type: String, default: null },
  weight: { type: String, default: null },
  pieces: { type: String, default: null },
  serves: { type: String, default: null },
  discountPct: { type: Number, default: null },
  quantity: { type: Number, default: null },
  inventoryBatches: { type: [inventoryBatchSchema], default: [] },
  recipes: [{
    title: { type: String },
    description: { type: String },
    image: { type: String, default: "" },
    totalTime: { type: String, default: "" },
    prepTime: { type: String, default: "" },
    cookTime: { type: String, default: "" },
    servings: { type: Number, default: 2 },
    difficulty: { type: String, default: "Medium" },
    ingredients: [{ type: String }],
    method: [{ type: String }],
  }],
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, default: "products" },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const carouselSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: null },
  linkUrl: { type: String, default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const subCategorySchema = new mongoose.Schema(
  { name: { type: String, required: true }, imageUrl: { type: String, default: null } },
  { _id: false }
);

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, default: null },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  subCategories: { type: [subCategorySchema], default: [] },
});

const comboItemSchema = new mongoose.Schema(
  { productId: { type: String, required: true }, label: { type: String, required: true } },
  { _id: false }
);

const nutritionItemSchema = new mongoose.Schema(
  { label: { type: String, required: true }, value: { type: String, required: true }, icon: { type: String, default: "" } },
  { _id: false }
);

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  fullDescription: { type: String, default: null },
  serves: { type: String, default: null },
  weight: { type: String, default: null },
  discountedPrice: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  includes: { type: [comboItemSchema], default: [] },
  tags: { type: [String], default: [] },
  nutrition: { type: [nutritionItemSchema], default: [] },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
});

export interface HubModels {
  Product: mongoose.Model<any>;
  Section: mongoose.Model<any>;
  Carousel: mongoose.Model<any>;
  Category: mongoose.Model<any>;
  Combo: mongoose.Model<any>;
}

export async function getHubModels(dbName: string): Promise<HubModels> {
  if (!connectionCache.has(dbName)) {
    const conn = mongoose.createConnection(MONGODB_URI, { dbName });
    conn.on("connected", () => console.log(`Connected to hub DB: ${dbName}`));
    conn.on("error", (err) => console.error(`Hub DB ${dbName} error:`, err));
    connectionCache.set(dbName, conn);
  }

  const conn = connectionCache.get(dbName)!;

  const getModel = <T>(name: string, schema: mongoose.Schema) =>
    conn.models[name] || conn.model<T>(name, schema);

  return {
    Product: getModel("Product", productSchema),
    Section: getModel("Section", sectionSchema),
    Carousel: getModel("Carousel", carouselSchema),
    Category: getModel("Category", categorySchema),
    Combo: getModel("Combo", comboSchema),
  };
}
