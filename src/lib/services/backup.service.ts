import { connectToDatabase } from "@/lib/db/mongodb";
import { AgentModel } from "@/lib/db/models/Agent";
import { ClientModel } from "@/lib/db/models/Client";
import { InvestmentModel } from "@/lib/db/models/Investment";
import { UserModel } from "@/lib/db/models/User";
import { ensureDatabaseSeeded } from "@/lib/db/seed";

export class BackupService {
  static async exportData() {
    await ensureDatabaseSeeded();
    await connectToDatabase();

    const agents = await AgentModel.find({});
    const clients = await ClientModel.find({});
    const investments = await InvestmentModel.find({});
    const employees = await UserModel.find({ role: { $in: ["employee", "EMPLOYEE"] } });

    return {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone || "",
        rates: a.rates,
        rate: a.rate,
      })),
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        agentId: c.agentId,
      })),
      investments: investments.map((i) => ({
        id: i.id,
        clientId: i.clientId,
        agentId: i.agentId,
        type: i.type,
        amount: i.amount,
        rate: i.rate,
        commission: i.commission,
        date: i.date,
        scheme: i.scheme,
      })),
      employees: employees.map((e) => ({
        id: e.id,
        name: e.name,
        username: e.username,
        status: e.status,
        createdAt: e.createdAt ? e.createdAt.toISOString().split("T")[0] : "-",
      })),
    };
  }

  static async restoreData(payload: {
    agents?: Array<{ id: string; name: string; phone?: string; rates?: any; rate?: number }>;
    clients?: Array<{ id: string; name: string; phone?: string; agentId: string }>;
    investments?: Array<{
      id: string;
      clientId: string;
      agentId: string;
      type: string;
      amount: number;
      rate: number;
      commission: number;
      date: string;
      scheme?: string;
    }>;
  }) {
    await connectToDatabase();

    if (Array.isArray(payload.agents) && payload.agents.length > 0) {
      await AgentModel.deleteMany({});
      for (const a of payload.agents) {
        const rates = a.rates || {
          SIP: a.rate || 1.5,
          Lumpsum: a.rate || 1.0,
          "Change of Broker": a.rate || 0.5,
          Switch: a.rate || 0.5,
        };
        await AgentModel.create({
          id: a.id || "A" + Date.now(),
          name: a.name,
          phone: a.phone || "",
          rates,
          rate: a.rate || rates.SIP,
        });
      }
    }

    if (Array.isArray(payload.clients) && payload.clients.length > 0) {
      await ClientModel.deleteMany({});
      for (const c of payload.clients) {
        await ClientModel.create({
          id: c.id || "C" + Date.now(),
          name: c.name,
          phone: c.phone || "",
          agentId: c.agentId,
        });
      }
    }

    if (Array.isArray(payload.investments) && payload.investments.length > 0) {
      await InvestmentModel.deleteMany({});
      for (const i of payload.investments) {
        await InvestmentModel.create({
          id: i.id || "T" + Date.now(),
          clientId: i.clientId,
          agentId: i.agentId,
          type: i.type,
          amount: i.amount,
          rate: i.rate,
          commission: i.commission,
          date: i.date,
          scheme: i.scheme || "",
        });
      }
    }

    return { success: true };
  }
}
