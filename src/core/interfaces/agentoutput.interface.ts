export interface AgentOutput {
  result: string; // risposta finale (content ultimo AIMessage)
  trace?: any[];  // opzionale: tutti messaggi/contenuto intermedi, tool_calls, ecc.
  usage?: any;    // opzionale: usage_metadata, utile per billing/monitoraggio
}