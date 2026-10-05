import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvestmentDocument extends Document {
  id: string;
  clientId: string;
  agentId: string;
  type: "SIP" | "Lumpsum" | "Change of Broker" | "Switch";
  amount: number;
  rate: number;
  commission: number;
  date: string; // YYYY-MM-DD
  scheme?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestmentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ["SIP", "Lumpsum", "Change of Broker", "Switch"],
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0, max: 100 },
    commission: { type: Number, required: true, min: 0 },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    scheme: { type: String, trim: true, default: "" },
  },
  {
    timestamps: true,
  }
);

// Compound index for queries by agent and date
InvestmentSchema.index({ agentId: 1, date: -1 });
InvestmentSchema.index({ clientId: 1, date: -1 });

export const InvestmentModel: Model<IInvestmentDocument> =
  mongoose.models.Investment || mongoose.model<IInvestmentDocument>("Investment", InvestmentSchema);
