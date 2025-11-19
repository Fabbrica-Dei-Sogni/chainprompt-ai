import { Schema } from "mongoose";

export interface PromptSection {
  key: string;        // es: "ruolo", "obiettivo", "azione", "contesto"
  description?: string;     // etichetta umana opzionale
  content: string;    // testo della sezione
  order?: number;     // per ordinare le sezioni se serve
}

export interface PromptFramework {
  name: string;                  // es: "default"
  description?: string;          // descrizione del framework
  sections: PromptSection[];     // lista sezioni
  isDefault?: boolean;           // flag rapido per il framework di default
}

const PromptSectionSchema = new Schema<PromptSection>(
  {
    key: { type: String, required: true },       // "ruolo", "obiettivo", ...
    description: { type: String, required: false },    // opzionale, UI-friendly
    content: { type: String, required: true },
    order: { type: Number, required: false }
  },
  { _id: false }
);

export const PromptFrameworkSchema = new Schema<PromptFramework>(
  {
    name: { type: String, required: true },       // es: "default"
    description: { type: String, required: false },
    sections: { type: [PromptSectionSchema], required: true },
    isDefault: { type: Boolean, required: false, default: false }
  },
  { _id: false }
);