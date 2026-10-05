import bcrypt from "bcryptjs";
import { connectToDatabase } from "./mongodb";
import { UserModel } from "./models/User";

export const DEFAULT_ADMIN_CONFIG = {
  id: "admin",
  username: process.env.INITIAL_ADMIN_USERNAME || "admin",
  password: process.env.INITIAL_ADMIN_PASSWORD || "admin123",
  name: "Administrator",
  role: "admin" as const,
  status: "Active" as const,
};

let seedInProgress = false;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedInProgress) return;
  seedInProgress = true;
  try {
    await connectToDatabase();

    // Check if any admin user exists
    const adminUser = await UserModel.findOne({ role: { $in: ["admin", "ADMIN"] } });
    if (!adminUser) {
      console.log("Initializing master administrator account...");
      const hashedAdminPassword = await bcrypt.hash(DEFAULT_ADMIN_CONFIG.password, 10);
      await UserModel.create({
        id: DEFAULT_ADMIN_CONFIG.id,
        username: DEFAULT_ADMIN_CONFIG.username.trim().toLowerCase(),
        password: hashedAdminPassword,
        name: DEFAULT_ADMIN_CONFIG.name,
        role: DEFAULT_ADMIN_CONFIG.role,
        status: DEFAULT_ADMIN_CONFIG.status,
      });
      console.log("Master administrator created.");
    }
  } catch (error) {
    console.warn("Database initialization note:", (error as Error).message);
  } finally {
    seedInProgress = false;
  }
}
