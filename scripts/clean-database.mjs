// scripts/clean-database.mjs
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jiya_financial";
const MONGODB_DB = process.env.MONGODB_DB || "jiya_financial";

async function cleanData() {
  console.log("Connecting to MongoDB to clean dummy data...");
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });

  const db = mongoose.connection.db;

  // Clear dummy investments
  const invRes = await db.collection("investments").deleteMany({});
  console.log(`Deleted ${invRes.deletedCount} investment transactions.`);

  // Clear dummy clients
  const clientRes = await db.collection("clients").deleteMany({});
  console.log(`Deleted ${clientRes.deletedCount} clients.`);

  // Clear dummy agents
  const agentRes = await db.collection("agents").deleteMany({});
  console.log(`Deleted ${agentRes.deletedCount} agents.`);

  // Clear dummy employees (keep only admin)
  const userRes = await db.collection("users").deleteMany({ role: { $nin: ["admin", "ADMIN"] } });
  console.log(`Deleted ${userRes.deletedCount} dummy employee accounts (kept admin).`);

  const remainingUsers = await db.collection("users").find({}).toArray();
  console.log("Remaining users:", remainingUsers.map(u => ({ username: u.username, role: u.role })));

  console.log("✅ Database is now completely clean of dummy data!");
  await mongoose.disconnect();
}

cleanData().catch((err) => {
  console.error("Clean error:", err);
  process.exit(1);
});
