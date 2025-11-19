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
  systemprompt?: string;
  promptFrameworks?: PromptFrameworkDTO[]; // usa il tipo corretto se importi la definizione
  profilo: string;
  tools?: string[];
}