import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgentDocument extends Document {
  id: string;
  name: string;
  phone?: string;
  rates: {
    SIP: number;
    Lumpsum: number;
    "Change of Broker": number;
    Switch: number;
    [key: string]: number;
  };
  rate?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, default: "" },
    rates: {
      SIP: { type: Number, required: true, default: 1.5 },
      Lumpsum: { type: Number, required: true, default: 1.0 },
      "Change of Broker": { type: Number, required: true, default: 0.5 },
      Switch: { type: Number, required: true, default: 0.5 },
    },
    rate: { type: Number, default: 1.5 },
  },
  {
    timestamps: true,
  }
);

export const AgentModel: Model<IAgentDocument> =
  mongoose.models.Agent || mongoose.model<IAgentDocument>("Agent", AgentSchema);
