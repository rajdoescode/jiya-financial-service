import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { UserModel, IUserDocument } from "@/lib/db/models/User";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { AuthUserSession } from "@/types";

export class AuthService {
  static async authenticate(
    username?: string,
    password?: string
  ): Promise<{ success: boolean; user?: AuthUserSession; error?: string }> {
    if (!username || !password) {
      return { success: false, error: "Please enter both User ID and Password." };
    }

    try {
      await ensureDatabaseSeeded();
      const cleanUser = username.trim().toLowerCase();

      const user = await UserModel.findOne({ username: cleanUser });
      if (!user) {
        return {
          success: false,
          error: "User ID not found. Check spelling or contact Administrator.",
        };
      }

      if (user.status === "Inactive") {
        return { success: false, error: "This employee account is deactivated." };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const roleLabel =
          user.role.toLowerCase() === "admin" ? "Administrator" : "Employee";
        return { success: false, error: `Invalid password for ${roleLabel}.` };
      }

      return {
        success: true,
        user: {
          id: user.id || String(user._id),
          username: user.username,
          name: user.name,
          role: user.role,
        },
      };
    } catch (err) {
      console.error("Auth error:", err);
      return { success: false, error: "Authentication service error. Please try again." };
    }
  }

  static async changeAdminPassword(
    username: string,
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newPass || newPass.length < 4) {
      return { success: false, error: "New password must be at least 4 characters long." };
    }

    try {
      await connectToDatabase();
      const admin = await UserModel.findOne({
        username: username.toLowerCase(),
        role: { $in: ["admin", "ADMIN"] },
      });

      if (!admin) {
        return { success: false, error: "Admin account not found." };
      }

      const isMatch = await bcrypt.compare(currentPass, admin.password);
      if (!isMatch) {
        return { success: false, error: "Current admin password is incorrect." };
      }

      admin.password = await bcrypt.hash(newPass, 10);
      await admin.save();

      return { success: true };
    } catch (err) {
      console.error("Change password error:", err);
      return { success: false, error: "Failed to update password." };
    }
  }

  static async createEmployee({
    name,
    username,
    password,
  }: {
    name: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; employee?: { id: string; name: string; username: string; createdAt: string }; error?: string }> {
    if (!name || !name.trim()) return { success: false, error: "Employee name is required." };
    if (!username || !username.trim()) return { success: false, error: "Employee User ID is required." };
    if (!password || password.length < 4) return { success: false, error: "Password must be at least 4 characters long." };

    try {
      await connectToDatabase();
      const cleanUser = username.trim().toLowerCase();

      const existing = await UserModel.findOne({ username: cleanUser });
      if (existing) {
        if (existing.role.toLowerCase() === "admin") {
          return { success: false, error: "User ID already reserved for Administrator." };
        }
        return { success: false, error: `User ID "${cleanUser}" already exists for another employee.` };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const empId = "EMP" + Date.now();

      const newEmp = await UserModel.create({
        id: empId,
        username: cleanUser,
        password: hashedPassword,
        name: name.trim(),
        role: "employee",
        status: "Active",
      });

      return {
        success: true,
        employee: {
          id: newEmp.id,
          name: newEmp.name,
          username: newEmp.username,
          createdAt: newEmp.createdAt ? newEmp.createdAt.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        },
      };
    } catch (err) {
      console.error("Create employee error:", err);
      return { success: false, error: "Failed to create employee account." };
    }
  }

  static async getAllEmployees(): Promise<Array<{ id: string; name: string; username: string; status: string; createdAt: string }>> {
    try {
      await connectToDatabase();
      const employees = await UserModel.find({
        role: { $in: ["employee", "EMPLOYEE"] },
      }).sort({ createdAt: -1 });

      return employees.map((e: IUserDocument) => ({
        id: e.id,
        name: e.name,
        username: e.username,
        status: e.status,
        createdAt: e.createdAt ? e.createdAt.toISOString().split("T")[0] : "-",
      }));
    } catch (err) {
      console.error("Get employees error:", err);
      return [];
    }
  }

  static async resetEmployeePassword(
    employeeId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: "Password must be at least 4 characters long." };
    }

    try {
      await connectToDatabase();
      const emp = await UserModel.findOne({ id: employeeId });
      if (!emp) {
        return { success: false, error: "Employee account not found." };
      }

      emp.password = await bcrypt.hash(newPassword, 10);
      await emp.save();
      return { success: true };
    } catch (err) {
      console.error("Reset password error:", err);
      return { success: false, error: "Failed to reset employee password." };
    }
  }

  static async deleteEmployee(employeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await connectToDatabase();
      const result = await UserModel.deleteOne({ id: employeeId });
      if (result.deletedCount === 0) {
        return { success: false, error: "Employee not found." };
      }
      return { success: true };
    } catch (err) {
      console.error("Delete employee error:", err);
      return { success: false, error: "Failed to delete employee account." };
    }
  }
}
