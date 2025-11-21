import { PromptSectionDTO } from './createagentconfig.dto.js';

/**
 * DTO per la creazione di un nuovo PromptFramework standalone (template condiviso)
 */
export interface CreatePromptFrameworkDTO {
    name: string;                    // Nome univoco del framework
    description?: string;            // Descrizione del framework
    sections: PromptSectionDTO[];    // Array di sezioni che compongono il prompt
    isDefault?: boolean;             // Flag per indicare se è il framework di default
}

/**
 * DTO per l'aggiornamento di un PromptFramework esistente
 */
export interface UpdatePromptFrameworkDTO {
    name?: string;
    description?: string;
    sections?: PromptSectionDTO[];
    isDefault?: boolean;
}

/**
 * DTO per aggiungere o aggiornare una singola sezione
 */
export interface AddSectionDTO {
    key: string;                     // Chiave univoca della sezione
    description?: string;            // Descrizione human-readable
    content: string;                 // Contenuto della sezione
    order?: number;                  // Ordine di visualizzazione
}

/**
 * DTO per aggiornare una sezione esistente
 */
export interface UpdateSectionDTO {
    description?: string;
    content?: string;
    order?: number;
}

/**
 * DTO per riordinare le sezioni
 */
export interface ReorderSectionsDTO {
    orderedKeys: string[];           // Array di keys nell'ordine desiderato
}

/**
 * DTO per clonare un framework
 */
export interface CloneFrameworkDTO {
    newName: string;                 // Nome del nuovo framework clonato
    newDescription?: string;         // Descrizione opzionale per il clone
}
