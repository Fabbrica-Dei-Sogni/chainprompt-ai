import { AgentMiddleware, createAgent, ReactAgent, StructuredTool, Tool } from "langchain";
import { Runnable } from "@langchain/core/runnables";
import { BaseCheckpointSaver, MemorySaver } from "@langchain/langgraph";
import { logger } from "../logger.core.js"

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
export function getAgent(llm: Runnable, systemPrompt: string, tools: Tool[] | StructuredTool[] = [], middleware : AgentMiddleware[] , nomeagente: string = "generico", checkpointer : BaseCheckpointSaver = new MemorySaver()) : ReactAgent {

    //step 1: imposta il nome e la descrizione in modo dinamico a seconda il contesto tematico entrante.
    // 3. Crea l'agent con prompt custom
    const agent = createAgent({
        model: llm,
        tools,
        name: nomeagente,
        description : "Un agente autogenerato",
        middleware,
        systemPrompt: systemPrompt,
        checkpointer, //XXX: serve per inserire una short memory .studiarne meglio il suo funzionamento e integrazione
        includeAgentName: "inline",
    });

    return agent;
};

/**
 * Invoca un agente per la sessione id chiamante per rispondere alla domanda

 * @param agent 
 * @param question 
 * @param sessionId 
 * @returns 
 */
export async function invokeAgent(agent: ReactAgent, question: string, sessionId: string) {
    try {

        logger.info("Identificativo " + sessionId + " sta interagendo con l'agente "+agent.graph.getName());
        logger.info("Invio richiesta " + question);

        const result = await agent.invoke(
            { messages: [{ role: "user", content: question }] },
            { configurable: { thread_id: sessionId } }
            //informazioni come gli schemi sui contesti richiedono un llm che supporta i structured_output
            //{ context: { userRole: "expert" } }
        );

        //metodo per loggare i dati presenti nella memoria dell'agente per un certo sessionid
        logState(agent, sessionId);

        return result;
    } catch (error) {
        logger.error("Errore durante l'invocazione dell'agente:", error);
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

 * @param agent 
 * @param sessionId 
 * @returns 
 */
async function logState(agent: ReactAgent, sessionId: string) {
    try {
        // Configurazione con thread_id per identificare la sessione
        const config = {
            configurable: {
                thread_id: sessionId
            }
        };

        const state = await agent.graph.getState(config);

        logger.info("Stato corrente recuperato:");
        //usare il logger e definire la stringa nella forma `testo ${variable}`
        logger.info(`- Created at: ${state.createdAt}` );   // Timestamp creazione
        logger.info(`- Checkpoint ID: ${state.config?.configurable?.checkpoint_id ?? "N/A"}`);
        logger.info(`- Thread ID: ${state.config?.configurable?.thread_id ?? "N/A"}`);

        logger.info("Values in state:");
        if (!state.values) {
            logger.info("  Nessun valore presente.");
            return;
        }
        for (const [key, value] of Object.entries(state.values)) {
            logger.info(`  - Key: ${JSON.stringify(key)}`);
            logger.info(`    Value: ${JSON.stringify(value)}` );
        }

        logger.info("Next nodes to execute:");
        if (!state.next || state.next.length === 0) {
            logger.info("  Nessun nodo successivo, esecuzione terminata o in pausa.");
            return;
        }
        state.next.forEach((node: any, index: number) => {
            logger.info(`  [${index}] Node: ${JSON.stringify(node)}`,);
        });

        logger.info("Checkpoint config:");
        if (!state.config) {
            logger.info("  Config non disponibile.");
            return;
        }
        logger.info(JSON.stringify(state.config, null, 2));

        logger.info("Checkpoint metadata:");
        if (!state.metadata) {
            logger.info("  Metadata non disponibile.");
            return;
        }
        logger.info(JSON.stringify(state.metadata, null, 2));

        logger.info("Pending tasks:");
        if (!state.tasks || state.tasks.length === 0) {
            logger.info("  Nessun task pendente.");
            return;
        }
        state.tasks.forEach((task: any, index: number) => {
            logger.info(`  [${index}] Task:`);
            logger.info(JSON.stringify(task, null, 2));
        });

        logger.info("Parent checkpoint config:");
        if (!state.parentConfig) {
            logger.info("  Nessuna configurazione genitore.");
            return;
        }
        logger.info(JSON.stringify(state.parentConfig, null, 2));

        return state;
    } catch (error) {
        logger.error("Errore nel recupero dello stato:", error);
        throw error;
    }
}
