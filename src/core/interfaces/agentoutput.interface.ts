/**
 * Interfaccia che rappresenta l'output di una risposta di un agente rappresentante l'ultimo nodo della catena di stati.
 Questa interfaccia potrebbe evolversi per descrivere altre strutture dati significative.
 */
export interface AgentOutput {
  result: string; // risposta finale (content ultimo AIMessage)
  trace?: any[];  // opzionale: tutti messaggi/contenuto intermedi, tool_calls, ecc.
  usage?: any;    // opzionale: usage_metadata, utile per billing/monitoraggio
}