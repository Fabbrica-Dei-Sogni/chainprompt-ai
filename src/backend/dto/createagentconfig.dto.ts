// DTO per una singola sezione del prompt (PromptSection)
export interface PromptSectionDTO {
  key: string;             // es: "ruolo", "obiettivo", "azione", "contesto"
  description?: string;    // etichetta umana opzionale
  content: string;         // testo della sezione
  order?: number;          // posizione ordinata opzionale
}

// DTO per un framework di prompt, composto da più sezioni
export interface PromptFrameworkDTO {
  name: string;                    // es: "default"
  description?: string;            // descrizione
  sections: PromptSectionDTO[];    // array di sezioni
  isDefault?: boolean;             // flag per framework di default
}

// payload: dati minimi e sezioni canoniche
export interface CreateAgentConfigDTO {
  nome?: string;
  descrizione?: string;
  contesto: string;

  // LEGACY: Backward compatibility
  systemprompt?: string;

  // HYBRID ARCHITECTURE:
  // 1) Riferimento a template condiviso (ObjectId come string)
  promptFrameworkRef?: string;

  // 2) Custom framework embedded
  promptFramework?: PromptFrameworkDTO;

  profilo: string;
  tools?: string[];
}