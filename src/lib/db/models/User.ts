import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserDocument extends Document {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE" | "admin" | "employee";
  status: "Active" | "Inactive";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "EMPLOYEE", "admin", "employee"],
      default: "employee",
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Inactive"],
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
