// Esempio types per le colonne
export interface ToolEmbedding {
  id: number;
  description: string;
  metadata: { name: string; [key: string]: any }; // supporta JSON dinamico
}