import { Schema, model, Document } from "mongoose";

// Interfaccia per le sezioni del prompt (subdocument, rimane senza _id)
export interface IPromptSection {
  key: string;        // es: "ruolo", "obiettivo", "azione", "contesto"
  description?: string;     // etichetta umana opzionale
  content: string;    // testo della sezione
  order?: number;     // per ordinare le sezioni se serve
}

// Interfaccia BASE per PromptFramework (senza Document, riusabile per embedding)
export interface IPromptFrameworkData {
  name: string;                  // es: "default"
  description?: string;          // descrizione del framework
  sections: IPromptSection[];    // lista sezioni
  isDefault?: boolean;           // flag rapido per il framework di default
}

// Interfaccia Mongoose-compliant per PromptFramework standalone (estende Document)
export interface IPromptFramework extends Document, IPromptFrameworkData { }

// Schema per le sezioni (subdocument, senza _id)
const PromptSectionSchema = new Schema<IPromptSection>(
  {
    key: { type: String, required: true },       // "ruolo", "obiettivo", ...
    description: { type: String, required: false },    // opzionale, UI-friendly
    content: { type: String, required: true },
    order: { type: Number, required: false }
  },
  { _id: false }  // Le sezioni non hanno _id proprio
);

// Schema per PromptFramework (collection standalone con _id e timestamps)
export const PromptFrameworkSchema = new Schema<IPromptFramework>(
  {
    name: {
      type: String,
      required: true,
      unique: true,      // Nome univoco per ogni framework
      trim: true
    },
    description: { type: String, required: false },
    sections: {
      type: [PromptSectionSchema],
      required: true,
      default: []
    },
    isDefault: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  {
    timestamps: true,  // Aggiunge createdAt e updatedAt
    collection: 'promptframeworks'  // Nome esplicito della collection
  }
);

// Indici per performance
PromptFrameworkSchema.index({ name: 1 });
PromptFrameworkSchema.index({ isDefault: 1 });

// Model esportato per uso con SchemaService
export const PromptFramework = model<IPromptFramework>("PromptFramework", PromptFrameworkSchema);