import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClientDocument extends Document {
  id: string;
  name: string;
  phone?: string;
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClientDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, default: "" },
    agentId: { type: String, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

export const ClientModel: Model<IClientDocument> =
  mongoose.models.Client || mongoose.model<IClientDocument>("Client", ClientSchema);
