import { connectToDatabase } from "@/lib/db/mongodb";
import { ClientModel, IClientDocument } from "@/lib/db/models/Client";
import { ensureDatabaseSeeded } from "@/lib/db/seed";
import { IClient } from "@/types";

export class ClientService {
  static async getAllClients(): Promise<IClient[]> {
    await ensureDatabaseSeeded();
    await connectToDatabase();
    const clients = await ClientModel.find({}).sort({ createdAt: -1 });
    return clients.map((c: IClientDocument) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || "",
      agentId: c.agentId,
      createdAt: c.createdAt?.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
    }));
  }

  static async getClientById(id: string): Promise<IClient | null> {
    await connectToDatabase();
    const c = await ClientModel.findOne({ id });
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      phone: c.phone || "",
      agentId: c.agentId,
      createdAt: c.createdAt?.toISOString(),
      updatedAt: c.updatedAt?.toISOString(),
    };
  }

  static async createClient(data: {
    name: string;
    phone?: string;
    agentId: string;
  }): Promise<IClient> {
    await connectToDatabase();
    const id = "C" + Date.now();

    const doc = await ClientModel.create({
      id,
      name: data.name.trim(),
      phone: data.phone?.trim() || "",
      agentId: data.agentId,
    });

    return {
      id: doc.id,
      name: doc.name,
      phone: doc.phone || "",
      agentId: doc.agentId,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }

  static async updateClient(
    id: string,
    data: { name?: string; phone?: string; agentId?: string }
  ): Promise<IClient | null> {
    await connectToDatabase();
    const updateObj: Record<string, any> = {};
    if (data.name !== undefined) updateObj.name = data.name.trim();
    if (data.phone !== undefined) updateObj.phone = data.phone.trim();
    if (data.agentId !== undefined) updateObj.agentId = data.agentId;

    const doc = await ClientModel.findOneAndUpdate(
      { id },
      { $set: updateObj },
      { new: true }
    );
    if (!doc) return null;

    return {
      id: doc.id,
      name: doc.name,
      phone: doc.phone || "",
      agentId: doc.agentId,
      createdAt: doc.createdAt?.toISOString(),
      updatedAt: doc.updatedAt?.toISOString(),
    };
  }

  static async deleteClient(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await ClientModel.deleteOne({ id });
    return res.deletedCount > 0;
  }
}
