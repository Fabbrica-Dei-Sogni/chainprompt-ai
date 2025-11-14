export interface ConfigEmbeddings {
  modelname: string; // Es. 'text-embedding-3-small'
  temperature?: number; // Non sempre usato negli embedding, ma per compatibilità
  dimension?: number; // Dimensione vettoriale (es. 1536 per OpenAI)
  apiKey?: string; // Opzionale per locali
  timeout?: number; // In ms per chiamate
  baseUrl?: string; // Per locali come Ollama
  // Aggiungi specifici come numCtx per Ollama
}