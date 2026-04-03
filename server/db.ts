import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "fishtokri";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI must be set.");
}

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI!, { dbName: MONGODB_DB });
  isConnected = true;
  console.log("Connected to MongoDB");
}

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, default: "available" },
  limitedStockNote: { type: String, default: null },
  price: { type: Number, default: null },
  unit: { type: String, default: null },
  imageUrl: { type: String, default: null },
  isArchived: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  deliveryArea: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, default: "pending" },
  notes: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

const carouselSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  title: { type: String, default: null },
  linkUrl: { type: String, default: null },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const CarouselModel = mongoose.models.Carousel || mongoose.model("Carousel", carouselSchema);
