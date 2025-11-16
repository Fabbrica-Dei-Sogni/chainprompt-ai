export enum EmbeddingProvider {
  OpenAI = 'OpenAI',
  AzureOpenAI = 'AzureOpenAI',
  Ollama = 'Ollama',
  HuggingFace = 'HuggingFace',
  HuggingFaceLocal = 'HuggingFaceLocal', // Per modelli scaricati localmente
  GoogleVertexAI = 'GoogleVertexAI',
  // Aggiungi altri come Anthropic o Cohere se necessario
}