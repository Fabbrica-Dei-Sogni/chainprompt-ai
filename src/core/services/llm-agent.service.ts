import { AgentMiddleware, createAgent, ReactAgent, StructuredTool, Tool } from "langchain";
import { Runnable } from "@langchain/core/runnables";
import { BaseCheckpointSaver, MemorySaver } from "@langchain/langgraph";
import { Logger } from "winston";
import { getLogger } from "../di/container.js";

export class LLMAgentService {
    private static instance: LLMAgentService;
    private logger: Logger;

    private constructor() {
        this.logger = getLogger();
    }

    public static getInstance(): LLMAgentService {
        if (!LLMAgentService.instance) {
            LLMAgentService.instance = new LLMAgentService();
        }
        return LLMAgentService.instance;
    }

    /**
       * Crea un agente con un nome, un systemprompt, specifiche caratteristiche dell'llm , lista di tool, middlewar e un checkpointer se quest'ultimo non viene fornito viene gestito con postgresql nativamente.
       *
       * @param llm 
       * @param systemPrompt 
       * @param tools 
       * @param middleware 
       * @param nomeagente 
       * @param checkpointer 
       * @returns 
       */
    public getAgent(llm: Runnable, systemPrompt: string, tools: Tool[] | StructuredTool[] = [], middleware: AgentMiddleware[], nomeagente: string = "generico", checkpointer: BaseCheckpointSaver = new MemorySaver()): ReactAgent {

        //step 1: imposta il nome e la descrizione in modo dinamico a seconda il contesto tematico entrante.
        // 3. Crea l'agent con prompt custom
        const agent = createAgent({
            model: llm,
            tools,
            name: nomeagente,
            description: "Un agente autogenerato",
            middleware,
            systemPrompt: systemPrompt,
            checkpointer, //XXX: serve per inserire una short memory .studiarne meglio il suo funzionamento e integrazione
            includeAgentName: "inline",
        });

        return agent;
    };

    /**
     * Invoca un agente per la sessione id chiamante per rispondere alla domanda
    *
     * @param agent 
     * @param question 
     * @param sessionId 
     * @returns 
     */
    public async invokeAgent(agent: ReactAgent, question: string, sessionId: string) {
        try {

            this.logger.info("Identificativo " + sessionId + " sta interagendo con l'agente " + agent.graph.getName());
            this.logger.info("Invio richiesta " + question);

            const result = await agent.invoke(
                { messages: [{ role: "user", content: question }] },
                { configurable: { thread_id: sessionId } }
                //informazioni come gli schemi sui contesti richiedono un llm che supporta i structured_output
                //{ context: { userRole: "expert" } }
            );

            //metodo per loggare i dati presenti nella memoria dell'agente per un certo sessionid
            this.logState(agent, sessionId);

            return result;
        } catch (error) {
            this.logger.error("Errore durante l'invocazione dell'agente:", error);
            // Puoi personalizzare il messaggio di errore per l'utente qui
            throw {
                error: true,
                message: "Si è verificato un errore nella comunicazione con l'agente. Riprova più tardi.",
                details: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Metodo di servizio per monitorare sui log console le operazioni eseguita dall'agente dopo l'invocazione
    *
     * @param agent 
     * @param sessionId 
     * @returns 
     */
    private async logState(agent: ReactAgent, sessionId: string) {
        try {
            // Configurazione con thread_id per identificare la sessione
            const config = {
                configurable: {
                    thread_id: sessionId
                }
            };

            const state = await agent.graph.getState(config);

            this.logger.info("Stato corrente recuperato:");
            //usare il logger e definire la stringa nella forma `testo ${variable}`
            this.logger.info(`- Created at: ${state.createdAt}`);   // Timestamp creazione
            this.logger.info(`- Checkpoint ID: ${state.config?.configurable?.checkpoint_id ?? "N/A"}`);
            this.logger.info(`- Thread ID: ${state.config?.configurable?.thread_id ?? "N/A"}`);

            this.logger.info("Values in state:");
            if (!state.values) {
                this.logger.info("  Nessun valore presente.");
                return;
            }
            for (const [key, value] of Object.entries(state.values)) {
                this.logger.info(`  - Key: ${JSON.stringify(key)}`);
                this.logger.info(`    Value: ${JSON.stringify(value)}`);
            }

            this.logger.info("Next nodes to execute:");
            if (!state.next || state.next.length === 0) {
                this.logger.info("  Nessun nodo successivo, esecuzione terminata o in pausa.");
                return;
            }
            state.next.forEach((node: any, index: number) => {
                this.logger.info(`  [${index}] Node: ${JSON.stringify(node)}`,);
            });

            this.logger.info("Checkpoint config:");
            if (!state.config) {
                this.logger.info("  Config non disponibile.");
                return;
            }
            this.logger.info(JSON.stringify(state.config, null, 2));

            this.logger.info("Checkpoint metadata:");
            if (!state.metadata) {
                this.logger.info("  Metadata non disponibile.");
                return;
            }
            this.logger.info(JSON.stringify(state.metadata, null, 2));

            this.logger.info("Pending tasks:");
            if (!state.tasks || state.tasks.length === 0) {
                this.logger.info("  Nessun task pendente.");
                return;
            }
            state.tasks.forEach((task: any, index: number) => {
                this.logger.info(`  [${index}] Task:`);
                this.logger.info(JSON.stringify(task, null, 2));
            });

            this.logger.info("Parent checkpoint config:");
            if (!state.parentConfig) {
                this.logger.info("  Nessuna configurazione genitore.");
                return;
            }
            this.logger.info(JSON.stringify(state.parentConfig, null, 2));

            return state;
        } catch (error) {
            this.logger.error("Errore nel recupero dello stato:", error);
            throw error;
        }
    }
}

export const llmAgentService = LLMAgentService.getInstance();
