import { connectDB, ProductModel } from "../server/db";

const newProducts = [
  // Crab
  { name: "Fresh Crab", category: "Crab", subCategory: "Fresh Crab", status: "available", price: 600, unit: "per kg", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 8, description: "Fresh whole crabs with sweet, delicate meat. Perfect for crab masala, coconut curry, or a classic coastal crab preparation." },
  { name: "Mud Crab", category: "Crab", subCategory: "Mud Crab", status: "available", price: 900, unit: "per kg", weight: "500 g", pieces: "1–2 Pieces", serves: "Serves 2", discountPct: 8, description: "Premium mud crabs known for their rich, meaty claws and sweet flavour. A coastal delicacy — best enjoyed in a bold Malvani masala or butter garlic preparation." },
  { name: "Blue Crab", category: "Crab", subCategory: "Blue Crab", status: "available", price: 750, unit: "per kg", weight: "500 g", pieces: "2–3 Pieces", serves: "Serves 3", discountPct: 8, description: "Blue crabs with firm, flavourful meat. Great for curries, stir-fries, or a classic spicy crab preparation." },
  { name: "Crab Pieces", category: "Crab", subCategory: "Crab Pieces", status: "available", price: 500, unit: "per kg", weight: "500 g", pieces: "4–6 Pieces", serves: "Serves 3", discountPct: 5, description: "Pre-cleaned crab pieces — convenient and ready to cook. Ideal for curries and quick coastal preparations." },

  // Squid
  { name: "Fresh Squid", category: "Squid", subCategory: "Fresh Squid", status: "available", price: 450, unit: "per kg", weight: "500 g", pieces: "4–6 Pieces", serves: "Serves 3", discountPct: 8, description: "Fresh whole squid with tender flesh and a mild, sweet flavour. Excellent grilled, stuffed, or in a spicy Malvani masala curry." },
  { name: "Squid Rings", category: "Squid", subCategory: "Squid Rings", status: "available", price: 500, unit: "per kg", weight: "500 g", pieces: "Pre-cut rings", serves: "Serves 3", discountPct: 8, description: "Pre-cut squid rings — ready to batter and fry into crispy Calamari or toss in a spiced stir-fry. Zero prep needed." },
  { name: "Baby Squid", category: "Squid", subCategory: "Baby Squid", status: "available", price: 550, unit: "per kg", weight: "500 g", pieces: "10–15 Pieces", serves: "Serves 3", discountPct: 8, description: "Tender baby squid with a delicate flavour. Perfect for deep-frying, pan-searing in butter garlic, or a light coastal curry." },

  // Lobster
  { name: "Whole Lobster", category: "Lobster", subCategory: "Whole Lobster", status: "available", price: 2800, unit: "per kg", weight: "500 g", pieces: "1 Piece", serves: "Serves 2", discountPct: 8, description: "Fresh whole lobster — the ultimate seafood luxury. Rich, sweet and meaty, best enjoyed grilled with garlic butter or in a classic coastal Thermidor." },
  { name: "Lobster Tail", category: "Lobster", subCategory: "Lobster Tail", status: "available", price: 3200, unit: "per kg", weight: "400 g", pieces: "1–2 Tails", serves: "Serves 2", discountPct: 8, description: "Premium lobster tails — all the sweetness of lobster with none of the fuss. Simply grill with butter and lemon for a showstopper dish." },
  { name: "Half Lobster", category: "Lobster", subCategory: "Half Lobster", status: "available", price: 1500, unit: "per pc", weight: "300 g", pieces: "1 Half", serves: "Serves 1", discountPct: 8, description: "Fresh half lobster — the perfect individual serving. Grilled, steamed, or in a creamy curry, it's a premium treat at an accessible price." },

  // Dried Fish
  { name: "Dried Bombil", category: "Dried Fish", subCategory: "Dried Bombil", status: "available", price: 300, unit: "per 250g", weight: "250 g", pieces: "6–10 Pieces", serves: "Serves 3", discountPct: 5, description: "Sun-dried Bombay Duck (Bombil) — a Maharashtrian coastal staple. Deep-fry to a crispy golden finish or add to spicy chutneys and traditional preparations." },
  { name: "Dried Bangda", category: "Dried Fish", subCategory: "Dried Bangda", status: "available", price: 280, unit: "per 250g", weight: "250 g", pieces: "4–6 Pieces", serves: "Serves 3", discountPct: 5, description: "Sun-dried Mackerel (Bangda) with an intense, concentrated flavour. A Konkan kitchen essential — fry crispy or add to solkadhi-based traditional preparations." },
  { name: "Dried Tarli", category: "Dried Fish", subCategory: "Dried Tarli", status: "available", price: 200, unit: "per 250g", weight: "250 g", pieces: "8–12 Pieces", serves: "Serves 3", discountPct: 5, description: "Dried Sardines (Tarli) packed with Omega-3s and bold flavour. Fry until crispy for a traditional coastal snack or add to rice preparations." },
  { name: "Dried Prawn", category: "Dried Fish", subCategory: "Dried Prawn", status: "available", price: 450, unit: "per 250g", weight: "250 g", pieces: "Dried", serves: "Flavours 4–5 dishes", discountPct: 5, description: "Sun-dried prawns (Sukha Kolbi) — a powerful flavour booster. Used in traditional Malvani, Goan, and Konkan dishes. Adds depth to chutneys, curries, and rice." },
  { name: "Sukha Jhinga", category: "Dried Fish", subCategory: "Sukha Jhinga", status: "available", price: 500, unit: "per 250g", weight: "250 g", pieces: "Dried", serves: "Flavours 4–5 dishes", discountPct: 5, description: "Dried jumbo prawns with a rich, concentrated umami flavour. A prized ingredient in traditional coastal cooking — adds unmatched depth to gravies and stir-fries." },

  // Eggs
  { name: "Farm Eggs (Tray of 30)", category: "Eggs", subCategory: "Farm Eggs (Tray of 30)", status: "available", price: 210, unit: "per tray", weight: "Tray of 30", pieces: "30 Eggs", serves: "Serves 15+", discountPct: 5, description: "Fresh farm eggs from free-range hens — rich yolk, strong shell, and superior freshness. A kitchen staple for daily cooking, baking, and breakfast." },
  { name: "Farm Eggs (Tray of 12)", category: "Eggs", subCategory: "Farm Eggs (Tray of 12)", status: "available", price: 90, unit: "per tray", weight: "Tray of 12", pieces: "12 Eggs", serves: "Serves 6+", discountPct: 5, description: "Fresh farm eggs in a convenient tray of 12. Perfect for small households — nutritious, fresh, and great for everything from omelettes to baking." },
  { name: "Country Eggs", category: "Eggs", subCategory: "Country Eggs", status: "available", price: 120, unit: "per dozen", weight: "12 Eggs", pieces: "12 Eggs", serves: "Serves 6+", discountPct: 0, description: "Desi country eggs (Naatu Koli Muttai) from native hens — smaller, but packed with richer flavour and deeper yellow yolks. Preferred for taste and nutrition." },

  // Mutton Keema
  { name: "Goat Kheema 500g", category: "Mutton Keema", subCategory: "Goat Kheema 500g", status: "available", price: 500, unit: "per pack", weight: "500 g", pieces: "Minced", serves: "Serves 3", discountPct: 8, description: "Freshly minced goat meat in a convenient 500g pack — perfect for keema pav, stuffed parathas, and keema biryani. Richer and more flavourful than chicken mince." },
  { name: "Goat Kheema 1kg", category: "Mutton Keema", subCategory: "Goat Kheema 1kg", status: "available", price: 950, unit: "per pack", weight: "1 kg", pieces: "Minced", serves: "Serves 6", discountPct: 8, description: "Value 1kg pack of freshly minced goat meat. Ideal for parties, meal prep, and bulk cooking. Deep, meaty character perfect for curries, rolls, and biryanis." },
  { name: "Mixed Kheema", category: "Mutton Keema", subCategory: "Mixed Kheema", status: "available", price: 400, unit: "per 500g", weight: "500 g", pieces: "Minced", serves: "Serves 3", discountPct: 5, description: "A blend of goat and chicken mince — a balanced, flavourful mix that's lighter on the pocket and great for everyday keema dishes." },
];

async function seed() {
  await connectDB();

  for (const p of newProducts) {
    const existing = await ProductModel.findOne({ name: p.name, category: p.category });
    if (!existing) {
      await ProductModel.create({ ...p, isArchived: false, imageUrl: null, sectionId: null, limitedStockNote: null });
      console.log(`Added: ${p.name} (${p.category})`);
    } else {
      console.log(`Skipped (exists): ${p.name}`);
    }
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch(console.error);
