import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://raneaniket23_db_user:0lEZL6KqIATNmZsj@fishtokricluster.vhw7jp9.mongodb.net/?appName=Fishtokricluster";
const client = new MongoClient(uri);

// ── USERS ──────────────────────────────────────────────────────────────────
const users = [
  {
    id: "user-001",
    name: "Rahul Sharma",
    phone: "9876543210",
    email: "rahul.sharma@gmail.com",
    dob: "1992-05-15",
    createdAt: new Date("2025-11-01"),
  },
  {
    id: "user-002",
    name: "Priya Desai",
    phone: "9823456789",
    email: "priya.desai@yahoo.com",
    dob: "1995-08-22",
    createdAt: new Date("2025-12-10"),
  },
  {
    id: "user-003",
    name: "Amit Kulkarni",
    phone: "9765432108",
    email: "amit.kulkarni@gmail.com",
    dob: "1988-03-10",
    createdAt: new Date("2026-01-05"),
  },
];

// ── ADDRESSES ──────────────────────────────────────────────────────────────
const addresses = [
  {
    id: "addr-001",
    userId: "user-001",
    name: "Rahul Sharma",
    phone: "9876543210",
    building: "Seaview Apartments, Wing B, Flat 402",
    street: "Lokhandwala Complex",
    area: "Andheri West",
    pincode: "400053",
    type: "house",
    label: "Home",
    instructions: "Call before delivery",
  },
  {
    id: "addr-002",
    userId: "user-001",
    name: "Rahul Sharma",
    phone: "9876543210",
    building: "Tech Park, Tower 3, Floor 5",
    street: "Marve Road",
    area: "Malad West",
    pincode: "400064",
    type: "office",
    label: "Office",
    instructions: "Leave at reception",
  },
  {
    id: "addr-003",
    userId: "user-001",
    name: "Rahul Sharma",
    phone: "9876543210",
    building: "Shree Nagar CHS, Wing B, Flat 402",
    street: "Gokhale Road",
    area: "Thane West",
    pincode: "400601",
    type: "other",
    label: "Parents Place",
    instructions: "Ring bell twice",
  },
  {
    id: "addr-004",
    userId: "user-002",
    name: "Priya Desai",
    phone: "9823456789",
    building: "Riddhi Siddhi CHS, Flat 12A",
    street: "SV Road",
    area: "Borivali West",
    pincode: "400092",
    type: "house",
    label: "Home",
    instructions: "Ground floor, blue door",
  },
  {
    id: "addr-005",
    userId: "user-003",
    name: "Amit Kulkarni",
    phone: "9765432108",
    building: "Orion Business Hub, 8th Floor",
    street: "LBS Marg",
    area: "Kurla West",
    pincode: "400070",
    type: "office",
    label: "Office",
    instructions: "Security will guide you",
  },
];

// ── ORDERS ─────────────────────────────────────────────────────────────────
const orders = [
  {
    id: 1001,
    customerName: "Rahul Sharma",
    phone: "9876543210",
    deliveryArea: "Andheri West",
    address: "Seaview Apartments, Wing B, Flat 402, Lokhandwala Complex",
    items: [
      { productId: 1, quantity: 1, name: "Silver Pomfret", price: 1200 },
      { productId: 19, quantity: 1, name: "White Prawn 500g", price: 700 },
    ],
    status: "out_for_delivery",
    notes: "Please clean and cut the fish",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 1002,
    customerName: "Rahul Sharma",
    phone: "9876543210",
    deliveryArea: "Andheri West",
    address: "Seaview Apartments, Wing B, Flat 402, Lokhandwala Complex",
    items: [
      { productId: 27, quantity: 1, name: "Chicken Curry Cut", price: 250 },
      { productId: 35, quantity: 1, name: "Goat Curry Cut", price: 850 },
      { productId: 43, quantity: 2, name: "Fish Curry Masala", price: 50 },
    ],
    status: "confirmed",
    notes: null,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: 1003,
    customerName: "Rahul Sharma",
    phone: "9876543210",
    deliveryArea: "Thane West",
    address: "Shree Nagar CHS, Wing B, Flat 402, Gokhale Road",
    items: [
      { productId: 4, quantity: 1, name: "Surmai (King Fish)", price: 900 },
      { productId: 21, quantity: 1, name: "Tiger Prawn", price: 1200 },
      { productId: 42, quantity: 1, name: "Goat Biryani Cut", price: 850 },
    ],
    status: "delivered",
    notes: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: 1004,
    customerName: "Rahul Sharma",
    phone: "9876543210",
    deliveryArea: "Andheri West",
    address: "Seaview Apartments, Wing B, Flat 402, Lokhandwala Complex",
    items: [
      { productId: 5, quantity: 2, name: "Rawas (Indian Salmon)", price: 950 },
      { productId: 24, quantity: 1, name: "Lobsters", price: 2500 },
    ],
    status: "delivered",
    notes: "Deliver before 10am please",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 1005,
    customerName: "Rahul Sharma",
    phone: "9876543210",
    deliveryArea: "Malad West",
    address: "Tech Park, Tower 3, Floor 5, Marve Road",
    items: [
      { productId: 2, quantity: 1, name: "Black Pomfret", price: 1100 },
      { productId: 29, quantity: 1, name: "Chicken Boneless Cubes", price: 400 },
      { productId: 44, quantity: 3, name: "Fish Fry Masala", price: 50 },
      { productId: 39, quantity: 1, name: "Goat Kheema", price: 950 },
    ],
    status: "delivered",
    notes: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
  },
  {
    id: 1006,
    customerName: "Priya Desai",
    phone: "9823456789",
    deliveryArea: "Borivali West",
    address: "Riddhi Siddhi CHS, Flat 12A, SV Road",
    items: [
      { productId: 4, quantity: 1, name: "Surmai", price: 900 },
      { productId: 22, quantity: 1, name: "Freshwater Prawn", price: 650 },
      { productId: 46, quantity: 1, name: "Special Chicken Masala", price: 60 },
    ],
    status: "delivered",
    notes: "No spicy masala please",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 1007,
    customerName: "Amit Kulkarni",
    phone: "9765432108",
    deliveryArea: "Kurla West",
    address: "Orion Business Hub, 8th Floor, LBS Marg",
    items: [
      { productId: 14, quantity: 1, name: "Ghol", price: 1500 },
      { productId: 36, quantity: 1, name: "Goat Shoulder Cut", price: 900 },
    ],
    status: "pending",
    notes: "Deliver between 1pm-3pm",
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
  },
];

// ── PRODUCTS ───────────────────────────────────────────────────────────────
const products = [
  { id: 1,  name: "Silver Pomfret",        category: "Fish",    price: 1200, unit: "per kg",    status: "available", isArchived: false },
  { id: 2,  name: "Black Pomfret",          category: "Fish",    price: 1100, unit: "per kg",    status: "available", isArchived: false },
  { id: 3,  name: "Khapri Pomfret",         category: "Fish",    price: 1000, unit: "per kg",    status: "available", isArchived: false },
  { id: 4,  name: "Surmai",                 category: "Fish",    price: 900,  unit: "per kg",    status: "available", isArchived: false },
  { id: 5,  name: "Rawas",                  category: "Fish",    price: 950,  unit: "per kg",    status: "available", isArchived: false },
  { id: 6,  name: "Lady Fish",              category: "Fish",    price: 600,  unit: "per kg",    status: "available", isArchived: false },
  { id: 7,  name: "Bombil",                 category: "Fish",    price: 400,  unit: "per kg",    status: "available", isArchived: false },
  { id: 8,  name: "Bangda",                 category: "Fish",    price: 350,  unit: "per kg",    status: "available", isArchived: false },
  { id: 9,  name: "Tarli",                  category: "Fish",    price: 300,  unit: "per kg",    status: "available", isArchived: false },
  { id: 10, name: "Karli",                  category: "Fish",    price: 450,  unit: "per kg",    status: "available", isArchived: false },
  { id: 11, name: "Shark",                  category: "Fish",    price: 550,  unit: "per kg",    status: "available", isArchived: false },
  { id: 12, name: "Catla",                  category: "Fish",    price: 300,  unit: "per kg",    status: "available", isArchived: false },
  { id: 13, name: "Tuna",                   category: "Fish",    price: 500,  unit: "per kg",    status: "available", isArchived: false },
  { id: 14, name: "Ghol",                   category: "Fish",    price: 1500, unit: "per kg",    status: "available", isArchived: false },
  { id: 15, name: "Jitada",                 category: "Fish",    price: 800,  unit: "per kg",    status: "available", isArchived: false },
  { id: 16, name: "Vaam",                   category: "Fish",    price: 700,  unit: "per kg",    status: "available", isArchived: false },
  { id: 17, name: "Indian Basa",            category: "Fish",    price: 400,  unit: "per kg",    status: "available", isArchived: false },
  { id: 18, name: "Rohu",                   category: "Fish",    price: 300,  unit: "per kg",    status: "available", isArchived: false },
  { id: 19, name: "White Prawn",            category: "Prawns",  price: 700,  unit: "per kg",    status: "available", isArchived: false },
  { id: 20, name: "Red Prawn",              category: "Prawns",  price: 750,  unit: "per kg",    status: "available", isArchived: false },
  { id: 21, name: "Tiger Prawn",            category: "Prawns",  price: 1200, unit: "per kg",    status: "available", isArchived: false },
  { id: 22, name: "Freshwater Prawn",       category: "Prawns",  price: 650,  unit: "per kg",    status: "available", isArchived: false },
  { id: 23, name: "Scampi Prawn",           category: "Prawns",  price: 900,  unit: "per kg",    status: "available", isArchived: false },
  { id: 24, name: "Lobsters",               category: "Prawns",  price: 2500, unit: "per kg",    status: "available", isArchived: false },
  { id: 25, name: "Kardi",                  category: "Prawns",  price: 400,  unit: "per kg",    status: "available", isArchived: false },
  { id: 26, name: "Jumbo Prawn",            category: "Prawns",  price: 1500, unit: "per kg",    status: "available", isArchived: false },
  { id: 27, name: "Chicken Curry Cut",      category: "Chicken", price: 250,  unit: "per kg",    status: "available", isArchived: false },
  { id: 28, name: "Chicken Breast",         category: "Chicken", price: 350,  unit: "per kg",    status: "available", isArchived: false },
  { id: 29, name: "Chicken Boneless Cubes", category: "Chicken", price: 400,  unit: "per kg",    status: "available", isArchived: false },
  { id: 30, name: "Chicken Whole Leg",      category: "Chicken", price: 300,  unit: "per kg",    status: "available", isArchived: false },
  { id: 31, name: "Chicken Drumstick",      category: "Chicken", price: 350,  unit: "per kg",    status: "available", isArchived: false },
  { id: 32, name: "Chicken Lollipop",       category: "Chicken", price: 300,  unit: "per 10pcs", status: "available", isArchived: false },
  { id: 33, name: "Chicken Kheema",         category: "Chicken", price: 450,  unit: "per kg",    status: "available", isArchived: false },
  { id: 34, name: "Chicken Liver",          category: "Chicken", price: 150,  unit: "per kg",    status: "available", isArchived: false },
  { id: 35, name: "Goat Curry Cut",         category: "Mutton",  price: 850,  unit: "per kg",    status: "available", isArchived: false },
  { id: 36, name: "Goat Shoulder Cut",      category: "Mutton",  price: 900,  unit: "per kg",    status: "available", isArchived: false },
  { id: 37, name: "Goat Boneless",          category: "Mutton",  price: 1100, unit: "per kg",    status: "available", isArchived: false },
  { id: 38, name: "Goat Liver",             category: "Mutton",  price: 850,  unit: "per kg",    status: "available", isArchived: false },
  { id: 39, name: "Goat Kheema",            category: "Mutton",  price: 950,  unit: "per kg",    status: "available", isArchived: false },
  { id: 40, name: "Goat Paya",              category: "Mutton",  price: 400,  unit: "per 4pcs",  status: "available", isArchived: false },
  { id: 41, name: "Goat Brain",             category: "Mutton",  price: 250,  unit: "per pc",    status: "available", isArchived: false },
  { id: 42, name: "Goat Biryani Cut",       category: "Mutton",  price: 850,  unit: "per kg",    status: "available", isArchived: false },
  { id: 43, name: "Fish Curry Masala",      category: "Masalas", price: 50,   unit: "per pc",    status: "available", isArchived: false },
  { id: 44, name: "Fish Fry Masala",        category: "Masalas", price: 50,   unit: "per pc",    status: "available", isArchived: false },
  { id: 45, name: "Malvani Masala",         category: "Masalas", price: 100,  unit: "per 100g",  status: "available", isArchived: false },
  { id: 46, name: "Special Chicken Masala", category: "Masalas", price: 60,   unit: "per pc",    status: "available", isArchived: false },
  { id: 47, name: "Special Mutton Masala",  category: "Masalas", price: 60,   unit: "per pc",    status: "available", isArchived: false },
  { id: 48, name: "Koliwada Masala",        category: "Masalas", price: 70,   unit: "per pc",    status: "available", isArchived: false },
];

try {
  await client.connect();
  console.log("✓ Connected to MongoDB Atlas\n");
  const db = client.db("fishtokri");

  // Users
  const usersCol = db.collection("users");
  await usersCol.deleteMany({});
  await usersCol.insertMany(users);
  console.log(`✓ users         — ${users.length} documents`);

  // Addresses
  const addressesCol = db.collection("addresses");
  await addressesCol.deleteMany({});
  await addressesCol.insertMany(addresses);
  console.log(`✓ addresses     — ${addresses.length} documents`);

  // Orders
  const ordersCol = db.collection("orders");
  await ordersCol.deleteMany({});
  await ordersCol.insertMany(orders);
  console.log(`✓ orders        — ${orders.length} documents`);

  // Products
  const productsCol = db.collection("products");
  await productsCol.deleteMany({});
  await productsCol.insertMany(products);
  console.log(`✓ products      — ${products.length} documents`);

  // Summary
  console.log("\n─── fishtokri collections ───");
  const cols = await db.listCollections().toArray();
  for (const c of cols) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name.padEnd(12)} ${count} docs`);
  }

} catch (err) {
  console.error("Error:", err.message);
} finally {
  await client.close();
  console.log("\n✓ Done — connection closed");
}
