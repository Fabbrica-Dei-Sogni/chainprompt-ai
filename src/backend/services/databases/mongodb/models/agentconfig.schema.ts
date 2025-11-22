import { Schema, model, Document, Types } from "mongoose";
import { IPromptFrameworkData, IPromptSection } from "./promptframework.schema.js";

export interface IAgentConfig extends Document {
  nome?: string;
  descrizione?: string;
  contesto: string;

  // Riferimento obbligatorio a template nella collection PromptFramework
  promptFrameworkRef: Types.ObjectId | string;

  profilo: string;
  tools?: string[];
}

const AgentConfigSchema = new Schema<IAgentConfig>(
  {
    nome: { type: String, required: false },
    descrizione: { type: String, required: false },
    contesto: { type: String, required: true },

    // Riferimento OBBLIGATORIO a template condiviso
    promptFrameworkRef: {
      type: Schema.Types.ObjectId,
      ref: 'PromptFramework',
      required: true  // ← Ogni agent DEVE avere un prompt
    },

    profilo: { type: String, required: true },
    tools: { type: [String], required: false, default: [] }
  },
  { timestamps: true }
);

// Indice per ricerche su riferimento framework
AgentConfigSchema.index({ promptFrameworkRef: 1 });
AgentConfigSchema.index({ contesto: 1 });

export const AgentConfig = model<IAgentConfig>("AgentConfig", AgentConfigSchema);
