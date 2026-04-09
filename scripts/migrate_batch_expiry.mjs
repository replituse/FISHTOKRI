import mongoose from "mongoose";
import { readFileSync } from "fs";

try {
  const env = readFileSync(".env", "utf8");
  for (const line of env.split("\n")) {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  }
} catch (_) {}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const HUB_DBS = ["Thane", "Bandra"];

const batchSchema = new mongoose.Schema({
  quantity: Number,
  shelfLifeDays: Number,
  entryDate: Date,
  expiryDate: { type: Date, default: null },
  remainingDays: { type: Number, default: null },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: String,
  inventoryBatches: [batchSchema],
});

let totalUpdated = 0;

for (const dbName of HUB_DBS) {
  const conn = await mongoose.createConnection(MONGODB_URI, { dbName }).asPromise();
  const Product = conn.model("Product", productSchema);

  const products = await Product.find({ "inventoryBatches.0": { $exists: true } }).lean();
  console.log(`[${dbName}] Found ${products.length} products with batches`);

  for (const product of products) {
    for (const batch of product.inventoryBatches) {
      const entryDate = new Date(batch.entryDate);
      const expiryDate = batch.expiryDate
        ? new Date(batch.expiryDate)
        : new Date(entryDate.getTime() + batch.shelfLifeDays * 24 * 60 * 60 * 1000);

      const msRemaining = expiryDate.getTime() - Date.now();
      let remainingTime;
      if (msRemaining <= 0) {
        remainingTime = "expired";
      } else {
        const totalHours = Math.floor(msRemaining / (60 * 60 * 1000));
        const days = Math.floor(totalHours / 24);
        const hours = totalHours % 24;
        remainingTime = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
      }

      await Product.findOneAndUpdate(
        { _id: product._id, "inventoryBatches._id": batch._id },
        {
          $set: { "inventoryBatches.$.expiryDate": expiryDate, "inventoryBatches.$.remainingTime": remainingTime },
          $unset: { "inventoryBatches.$.remainingDays": "" },
        }
      );
      totalUpdated++;
    }
  }

  console.log(`[${dbName}] Done`);
  await conn.close();
}

console.log(`\nMigration complete — ${totalUpdated} batch(es) updated`);
process.exit(0);
