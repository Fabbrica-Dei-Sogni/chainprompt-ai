import { Schema, model, Document } from "mongoose";
import { PromptFramework, PromptFrameworkSchema } from "./promptframework.schema.js";

export interface IAgentConfig extends Document {
  nome?: string;
  descrizione?: string;
  contesto: string;
  
  // 1) stringona classica (compat)
  systemprompt?: string;

  // 2) framework strutturato
  promptFrameworks?: PromptFramework[];

  profilo: string;
  tools?: string[];
  // middlewares: rimosso/ignorato per ora
}

const AgentConfigSchema = new Schema<IAgentConfig>(
  {
    nome: { type: String, required: false },
    descrizione: { type: String, required: false },
    contesto: { type: String, required: true },
    systemprompt: { type: String, required: true },
    // nuovo campo strutturato
    promptFrameworks: {
      type: [PromptFrameworkSchema],
      required: false,
      default: []
    },    
    profilo: { type: String, required: true },
    tools: { type: [String], required: false, default: [] }
  },
  { timestamps: true }
);

export const AgentConfig = model<IAgentConfig>("AgentConfig", AgentConfigSchema);
