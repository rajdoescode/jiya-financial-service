import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "User ID / Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Employee name is required"),
  username: z
    .string()
    .trim()
    .min(1, "User ID is required")
    .regex(/^[a-zA-Z0-9_\-]+$/, "User ID can only contain letters, numbers, underscores, and hyphens"),
  password: z.string().min(4, "Password must be at least 4 characters long"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(4, "New password must be at least 4 characters long"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and Confirm password do not match",
    path: ["confirmPassword"],
  });

export type ChangeAdminPasswordInput = z.infer<typeof changeAdminPasswordSchema>;

export const resetEmployeePasswordSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters long"),
});

export type ResetEmployeePasswordInput = z.infer<typeof resetEmployeePasswordSchema>;

export const agentSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required"),
  phone: z.string().trim().optional().default(""),
  rates: z.object({
    SIP: z.coerce.number().min(0, "SIP rate must be >= 0").max(100),
    Lumpsum: z.coerce.number().min(0, "Lumpsum rate must be >= 0").max(100),
    "Change of Broker": z.coerce.number().min(0, "Change of Broker rate must be >= 0").max(100),
    Switch: z.coerce.number().min(0, "Switch rate must be >= 0").max(100),
  }),
});

export type AgentInput = z.infer<typeof agentSchema>;

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required"),
  phone: z.string().trim().optional().default(""),
  agentId: z.string().min(1, "Mapped agent is required"),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const investmentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  agentId: z.string().min(1, "Agent is required"),
  type: z.enum(["SIP", "Lumpsum", "Change of Broker", "Switch"], {
    errorMap: () => ({ message: "Select a valid investment type" }),
  }),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate must be >= 0").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  scheme: z.string().trim().optional().default(""),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;
