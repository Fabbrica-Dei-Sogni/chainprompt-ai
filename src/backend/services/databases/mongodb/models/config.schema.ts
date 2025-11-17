import { Schema, model, Document } from "mongoose";

// 1. Interfaccia TypeScript per type safety
export interface IConfiguration extends Document {
  key: string;
  value: string;
}

// 2. Definizione dello schema Mongoose
const ConfigSchema = new Schema<IConfiguration>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
  },
  {
    timestamps: true // Opzionale: gestione automatica di createdAt/updatedAt
  }
);

// 3. Esportazione del modello tipizzato
export const Configuration = model<IConfiguration>("Configuration", ConfigSchema);
