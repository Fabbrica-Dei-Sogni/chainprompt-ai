// models/AgentConfig.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface AgentConfigDocument extends Document {
  nome: string;
  descrizione: string;
  systemprompt: string;
}

const AgentConfigSchema = new Schema<AgentConfigDocument>({
  nome: { type: String, required: true },
  descrizione: { type: String },
  systemprompt: { type: String }
}, { timestamps: true });

export const AgentConfig = mongoose.model<AgentConfigDocument>('AgentConfig', AgentConfigSchema);
