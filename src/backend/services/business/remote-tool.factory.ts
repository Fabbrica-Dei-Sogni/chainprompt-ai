import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

/**
 * Interfaccia per la definizione di un tool remoto proveniente da un servizio esterno.
 */
export interface RemoteToolDefinition {
    name: string;
    description: string;
    endpoint: string;
    method: string;
    parameters: any; // JSON Schema
}

/**
 * Classe per la generazione dinamica di tool LangChain a partire da descrittori remoti.
 */
export class RemoteToolFactory {
    
    /**
     * Crea un'istanza di DynamicStructuredTool a partire da una definizione remota.
     * @param baseUrl L'URL base del servizio
     * @param def La definizione del tool
     * @param authToken Token di autenticazione opzionale
     */
    public static create(baseUrl: string, def: RemoteToolDefinition, authToken?: string): DynamicStructuredTool {
        
        const schema = z.object({}).passthrough().describe(def.description);

        return new DynamicStructuredTool({
            name: def.name,
            description: def.description,
            schema: schema,
            func: async (args: any) => {
                console.info(`[RemoteTool: ${def.name}] Calling ${def.method} ${baseUrl}${def.endpoint}`);
                try {
                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json'
                    };

                    if (authToken) {
                        headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
                    }

                    const config = {
                        method: def.method,
                        url: `${baseUrl}${def.endpoint}`,
                        data: args,
                        headers: headers
                    };
                    const response = await axios(config);
                    
                    return typeof response.data === 'string' 
                        ? response.data 
                        : JSON.stringify(response.data.results || response.data.data || response.data);
                } catch (error: any) {
                    console.error(`[RemoteTool: ${def.name}] Error:`, error.message);
                    return `Errore durante l'esecuzione del tool remoto ${def.name}: ${error.message}`;
                }
            }
        });
    }

    /**
     * Recupera i tool da un servizio esterno e li converte in tool LangChain.
     * @param discoveryUrl L'URL dell'endpoint /tools del servizio esterno
     * @param authToken Token di autenticazione per la fase di discovery e per i tool successivi
     */
    public static async discover(discoveryUrl: string, authToken?: string): Promise<DynamicStructuredTool[]> {
        try {
            console.info(`[RemoteToolFactory] Discovering tools from ${discoveryUrl}`);
            
            const headers: Record<string, string> = {};
            if (authToken) {
                headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
            }

            const response = await axios.get(discoveryUrl, { headers });
            
            const server = response.data.server;
            const remoteTools: RemoteToolDefinition[] = response.data.tools || [];
            
            const baseUrl = server?.base_uri || discoveryUrl.split('/assistant/tools')[0];
            
            return remoteTools.map(def => this.create(baseUrl, def, authToken));
        } catch (error: any) {
            console.error(`[RemoteToolFactory] Discovery failed:`, error.message);
            return [];
        }
    }

    /**
     * Recupera i tool da più servizi esterni in parallelo.
     * @param discoveryUrls Array di URL degli endpoint /tools
     * @param authToken Token di autenticazione
     */
    public static async discoverMany(discoveryUrls: string[], authToken?: string): Promise<DynamicStructuredTool[]> {
        const discoveryPromises = discoveryUrls.map(url => this.discover(url, authToken));
        const results = await Promise.all(discoveryPromises);
        
        return results.flat();
    }
}
