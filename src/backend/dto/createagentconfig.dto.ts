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

// payload: dati minimi per creare AgentConfig
export interface CreateAgentConfigDTO {
  nome?: string;
  descrizione?: string;
  contesto: string;

  // Riferimento OBBLIGATORIO a template nella collection PromptFramework
  promptFrameworkRef: string;  // ObjectId come string

  profilo: string;
  tools?: string[];
}