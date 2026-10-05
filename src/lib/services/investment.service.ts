import { connectToDatabase } from "@/lib/db/mongodb";
import { InvestmentModel, IInvestmentDocument } from "@/lib/db/models/Investment";
import { AgentModel } from "@/lib/db/models/Agent";
import { ClientModel } from "@/lib/db/models/Client";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { calculateCommission, aggregateAgentSales, getAgentRate } from "@/lib/commission";
import { IInvestment, IDashboardStats, InvestmentType } from "@/types";

export interface InvestmentFilters {
  agentId?: string;
  type?: string;
  year?: string;
  month?: string;
}

export class InvestmentService {
  static async getAllInvestments(filters: InvestmentFilters = {}): Promise<IInvestment[]> {
    await ensureDatabaseSeeded();
    await connectToDatabase();

    const query: Record<string, unknown> = {};

    if (filters.agentId && filters.agentId !== "ALL") {
      query.agentId = filters.agentId;
    }

    if (filters.type && filters.type !== "ALL") {
      query.type = filters.type;
    }

    if (filters.year && filters.year !== "ALL") {
      if (filters.month && filters.month !== "ALL") {
        const regexStr = `^${filters.year}-${filters.month.padStart(2, "0")}`;
        query.date = { $regex: new RegExp(regexStr) };
      } else {
        query.date = { $regex: new RegExp(`^${filters.year}`) };
      }
    } else if (filters.month && filters.month !== "ALL") {
      query.date = { $regex: new RegExp(`-\\${filters.month.padStart(2, "0")}-`) };
    }

    const docs = await InvestmentModel.find(query).sort({ date: -1, createdAt: -1 });

    // Populate client and agent names
    const clients = await ClientModel.find({});
    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const agents = await AgentModel.find({});
    const agentMap = new Map(agents.map((a) => [a.id, a]));

    return docs.map((doc: IInvestmentDocument) => {
      const c = clientMap.get(doc.clientId);
      const a = agentMap.get(doc.agentId);

      return {
        id: doc.id,
        clientId: doc.clientId,
        agentId: doc.agentId,
        type: doc.type as InvestmentType,
        amount: doc.amount,
        rate: doc.rate,
        commission: doc.commission,
        date: doc.date,
        scheme: doc.scheme || "",
        client: c
          ? {
              id: c.id,
              name: c.name,
              phone: c.phone || "",
              agentId: c.agentId,
            }
          : undefined,
        agent: a
          ? {
              id: a.id,
              name: a.name,
              phone: a.phone || "",
              rates: a.rates,
              rate: a.rate,
            }
          : undefined,
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      };
    });
  }

  static async createInvestment(data: {
    clientId: string;
    agentId: string;
    type: InvestmentType;
    amount: number;
    rate: number;
    date: string;
    scheme?: string;
  }): Promise<IInvestment> {
    await connectToDatabase();
    const id = "T" + Date.now();
    const commission = calculateCommission(data.amount, data.rate);

    const doc = await InvestmentModel.create({
      id,
      clientId: data.clientId,
      agentId: data.agentId,
      type: data.type,
      amount: data.amount,
      rate: data.rate,
      commission,
      date: data.date,
      scheme: data.scheme?.trim() || "Mutual Fund Investment",
    });

    return {
      id: doc.id,
      clientId: doc.clientId,
      agentId: doc.agentId,
      type: doc.type as InvestmentType,
      amount: doc.amount,
      rate: doc.rate,
      commission: doc.commission,
      date: doc.date,
      scheme: doc.scheme,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }

  static async deleteInvestment(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await InvestmentModel.deleteOne({ id });
    return res.deletedCount > 0;
  }

  static async getDashboardStats(filters: InvestmentFilters = {}): Promise<IDashboardStats> {
    const list = await this.getAllInvestments(filters);

    let totalSales = 0;
    let totalSip = 0;
    let totalLump = 0;
    let totalCob = 0;
    let totalSwitch = 0;
    let totalComm = 0;

    for (const item of list) {
      totalSales += item.amount;
      totalComm += item.commission;

      const t = item.type.toUpperCase();
      if (t === "SIP") {
        totalSip += item.amount;
      } else if (t === "LUMPSUM") {
        totalLump += item.amount;
      } else if (t === "CHANGE OF BROKER" || t === "COB") {
        totalCob += item.amount;
      } else if (t === "SWITCH") {
        totalSwitch += item.amount;
      }
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return {
      totalSales: round2(totalSales),
      totalSip: round2(totalSip),
      totalLump: round2(totalLump),
      totalCob: round2(totalCob),
      totalSwitch: round2(totalSwitch),
      totalComm: round2(totalComm),
      count: list.length,
    };
  }

  static async getAgentStatement(agentId: string, year: string, month: string) {
    await ensureDatabaseSeeded();
    await connectToDatabase();

    const agent = await AgentModel.findOne({ id: agentId });
    if (!agent) {
      throw new Error("Agent not found");
    }

    const rawTxs = await InvestmentModel.find({ agentId }).sort({ date: 1 });
    const clients = await ClientModel.find({});
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    const txInputs = rawTxs.map((t) => ({
      id: t.id,
      agentId: t.agentId,
      clientId: t.clientId,
      client_name: clientMap.get(t.clientId) || "Client",
      type: t.type,
      amount: t.amount,
      rate: t.rate,
      commission: t.commission,
      date: t.date,
      scheme: t.scheme,
    }));

    const agg = aggregateAgentSales(txInputs, agentId, {
      year: year === "ALL" ? null : year,
      month: month === "ALL" ? null : month,
    });

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone || "",
        rates: agent.rates,
        ratesSummary: {
          SIP: getAgentRate(agent, "SIP"),
          Lumpsum: getAgentRate(agent, "Lumpsum"),
          "Change of Broker": getAgentRate(agent, "Change of Broker"),
          Switch: getAgentRate(agent, "Switch"),
        },
      },
      aggregation: agg,
    };
  }
}
