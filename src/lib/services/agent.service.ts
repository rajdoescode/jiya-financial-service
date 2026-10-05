import { connectToDatabase } from "@/lib/db/mongodb";
import { AgentModel, IAgentDocument } from "@/lib/db/models/Agent";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { IAgent, IAgentRates } from "@/types";

export class AgentService {
  static async getAllAgents(): Promise<IAgent[]> {
    await ensureDatabaseSeeded();
    await connectToDatabase();
    const agents = await AgentModel.find({}).sort({ createdAt: -1 });
    return agents.map((a: IAgentDocument) => ({
      id: a.id,
      name: a.name,
      phone: a.phone || "",
      rates: a.rates as IAgentRates,
      rate: a.rate,
      createdAt: a.createdAt?.toISOString(),
      updatedAt: a.updatedAt?.toISOString(),
    }));
  }

  static async getAgentById(id: string): Promise<IAgent | null> {
    await connectToDatabase();
    const a = await AgentModel.findOne({ id });
    if (!a) return null;
    return {
      id: a.id,
      name: a.name,
      phone: a.phone || "",
      rates: a.rates as IAgentRates,
      rate: a.rate,
      createdAt: a.createdAt?.toISOString(),
      updatedAt: a.updatedAt?.toISOString(),
    };
  }

  static async createAgent(data: {
    name: string;
    phone?: string;
    rates: IAgentRates;
  }): Promise<IAgent> {
    await connectToDatabase();
    const id = "A" + Date.now();
    const sipRate = data.rates.SIP !== undefined ? data.rates.SIP : 1.5;

    const doc = await AgentModel.create({
      id,
      name: data.name.trim(),
      phone: data.phone?.trim() || "",
      rates: data.rates,
      rate: sipRate,
    });

    return {
      id: doc.id,
      name: doc.name,
      phone: doc.phone || "",
      rates: doc.rates as IAgentRates,
      rate: doc.rate,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }

  static async updateAgent(
    id: string,
    data: {
      name?: string;
      phone?: string;
      rates?: IAgentRates;
    }
  ): Promise<IAgent | null> {
    await connectToDatabase();
    const ag = await AgentModel.findOne({ id });
    if (!ag) return null;

    if (data.name) ag.name = data.name.trim();
    if (data.phone !== undefined) ag.phone = data.phone.trim();
    if (data.rates) {
      ag.rates = data.rates;
      if (data.rates.SIP !== undefined) {
        ag.rate = data.rates.SIP;
      }
    }

    await ag.save();

    return {
      id: ag.id,
      name: ag.name,
      phone: ag.phone || "",
      rates: ag.rates as IAgentRates,
      rate: ag.rate,
      createdAt: ag.createdAt?.toISOString(),
      updatedAt: ag.updatedAt?.toISOString(),
    };
  }

  static async deleteAgent(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await AgentModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
}
