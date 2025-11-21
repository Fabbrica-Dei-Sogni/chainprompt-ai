import { Schema, model, Document, Types } from "mongoose";
import { IPromptFrameworkData, IPromptSection } from "./promptframework.schema.js";

export interface IAgentConfig extends Document {
  nome?: string;
  descrizione?: string;
  contesto: string;

  // LEGACY: Backward compatibility (fallback)
  systemprompt?: string;

  // HYBRID ARCHITECTURE:
  // 1) Riferimento a template condiviso nella collection PromptFramework
  promptFrameworkRef?: Types.ObjectId | string;

  // 2) Custom framework embedded (override locale, riusa interfaccia base)
  promptFramework?: IPromptFrameworkData;

  profilo: string;
  tools?: string[];
}

// Schema per le sezioni embedded (riusa la definizione)
const PromptSectionEmbeddedSchema = new Schema<IPromptSection>(
  {
    key: { type: String, required: true },
    description: { type: String, required: false },
    content: { type: String, required: true },
    order: { type: Number, required: false }
  },
  { _id: false }
);

// Schema per PromptFramework embedded (riusa IPromptFrameworkData)
const PromptFrameworkEmbeddedSchema = new Schema<IPromptFrameworkData>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    sections: {
      type: [PromptSectionEmbeddedSchema],
      required: true,
      default: []
    },
    isDefault: { type: Boolean, required: false, default: false }
  },
  { _id: false }
);

const AgentConfigSchema = new Schema<IAgentConfig>(
  {
    nome: { type: String, required: false },
    descrizione: { type: String, required: false },
    contesto: { type: String, required: true },

    // LEGACY: non più required per supportare hybrid
    systemprompt: { type: String, required: false },

    // HYBRID: Riferimento a template condiviso
    promptFrameworkRef: {
      type: Schema.Types.ObjectId,
      ref: 'PromptFramework',
      required: false
    },

    // HYBRID: Custom framework embedded
    promptFramework: {
      type: PromptFrameworkEmbeddedSchema,
      required: false
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
