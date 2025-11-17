import { Schema, model, Document } from "mongoose";

export interface IAgentConfig extends Document {
  nome?: string;
  descrizione?: string;
  contesto: string;
  systemprompt: string;
  tools?: string[];
  // middlewares: rimosso/ignorato per ora
}

const AgentConfigSchema = new Schema<IAgentConfig>(
  {
    nome: { type: String, required: false },
    descrizione: { type: String, required: false },
    contesto: { type: String, required: true },
    systemprompt: { type: String, required: true },
    tools: { type: [String], required: false, default: [] }
  },
  { timestamps: true }
);

export const AgentConfig = model<IAgentConfig>("AgentConfig", AgentConfigSchema);
