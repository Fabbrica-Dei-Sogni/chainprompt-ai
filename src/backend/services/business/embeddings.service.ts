import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ConfigEmbeddings } from "../../../core/interfaces/protocol/configembeddings.interface.js";
import { EmbeddingProvider } from "../../../core/enums/embeddingprovider.enum.js";
import { ToolEmbedding } from "../databases/postgresql/models/toolembedding.js";
import { postgresqlService } from "../databases/postgresql/postgresql.service.js";
import { readerPromptService } from "./reader-prompt.service.js";
import { getComponent } from "../../../core/di/container.js";
import { ConverterModels } from "../../../core/converter.models.js";

const converterModels = getComponent(ConverterModels);

export class EmbeddingsService {
  private static instance: EmbeddingsService;

  private constructor() { }

  public static getInstance(): EmbeddingsService {
    if (!EmbeddingsService.instance) {
      EmbeddingsService.instance = new EmbeddingsService();
    }
    return EmbeddingsService.instance;
  }

  /**
   * Metodo di servizio per sincronizzare i systemprompt degli agenti sul vectorstore tool_embeddings
   Approfondire il flusso per riutilizzarlo e capire come gestire lo store con un orm al posto di sql cablate a codice
   * @param contexts 
   * @param provider 
   */
  public async syncToolAgentEmbeddings(contexts: string[], provider: EmbeddingProvider = EmbeddingProvider.Ollama) {
    //XXX: inserimento di tutti gli agenti tematici idonei
    let docs: {
      pageContent: string;
      metadata: any;
    }[] = [];

    for (const context of contexts) {
      const subContext = context;
      //XXX: composizione custom di una descrizione di un tool agent estrapolando ruolo e azione dal systemprompt.
      let prRuolo = await readerPromptService.getSectionsPrompts(subContext, "prompt.ruolo");
      let prAzione = await readerPromptService.getSectionsPrompts(subContext, "prompt.azione");
      const descriptionSubAgent = context + "." + prRuolo + "\n"; //await getFrameworkPrompts(subContext);

      //console.log("System prompt subcontext: " + promptsubAgent);
      docs.push({ pageContent: descriptionSubAgent, metadata: null });
    }
    const configEmbeddings = converterModels.getConfigEmbeddingsDFL();
    configEmbeddings.provider = provider;
    await this.syncDocsPgvectorStore(configEmbeddings, docs);
  }


  /**
   * Sincronizza i documenti tools: aggiunge nuovi, aggiorna changed,
   * cancella obsoleti se necessario.
   * @param toolDocs - array di documenti/tools correnti
   */
  // Sincronizzazione base (con SQL)
  private async syncDocsPgvectorStore(
    config: ConfigEmbeddings,
    toolDocs: { pageContent: string, metadata: any }[]
  ): Promise<{ added: number; updated: number; deleted: number }> {

    let vectorStore: PGVectorStore | undefined;

    let added = 0, updated = 0, deleted = 0;
    try {

      vectorStore = await postgresqlService.getVectorStoreSingleton(config);

      // Recupero dei documenti esistenti
      const existingDocs = await this.getExistingToolDocs();
      const existingNames = new Set(existingDocs.map(d => d.metadata?.name));
      const newNames = new Set(toolDocs.map(d => d.metadata?.name));

      // Identificazione batch
      const docsToAdd = toolDocs.filter(d => !existingNames.has(d.metadata?.name));
      const docsToUpdate = toolDocs.filter(doc => {
        const old = existingDocs.find(d => d.metadata?.name === doc.metadata?.name);
        return old && old.description !== doc.pageContent;
      });
      const namesToDelete = [...existingNames].filter(name => !newNames.has(name));

      // Cancellazione tool obsoleti
      for (const name of namesToDelete) {
        try {
          await this.deleteToolDocByName(name);
          deleted++;
        } catch (error) {
          console.error(`[syncDocsPgvectorStore] Errore cancellando tool '${name}':`, error);
          // Non rilancia qui, logga solo: continua ciclo
        }
      }

      // Aggiornamento embedding modificati
      for (const doc of docsToUpdate) {
        try {
          await this.deleteToolDocByName(doc.metadata?.name);
          //console.log("Aggiunta document embedding " + JSON.stringify(doc))+" ...";
          await vectorStore.addDocuments([doc]);
          //console.log("Aggiunto con successo!");
          updated++;
        } catch (error) {
          console.error(`[syncDocsPgvectorStore] Errore aggiornando '${doc.metadata?.name}':`, error);
        }
      }

      // Aggiunta nuovi tool
      if (docsToAdd.length > 0) {
        try {
          await vectorStore.addDocuments(docsToAdd);
          added = docsToAdd.length;
        } catch (error) {
          console.error("[syncDocsPgvectorStore] Errore aggiungendo nuovi tool:", error);
          // Qui puoi scegliere se rilanciare o solo loggare
        }
      }

      console.info(`[syncDocsPgvectorStore] Operazione completata: aggiunti=${added}, aggiornati=${updated}, cancellati=${deleted}`);
      return { added, updated, deleted };

    } catch (err) {
      console.error("[syncDocsPgvectorStore] Errore globale:", err);
      throw err; // Propaga per gestioni superiori, se serve
    }
  };

  private async getExistingToolDocs(): Promise<ToolEmbedding[]> {
    return postgresqlService.getKyselyDatabase().selectFrom('tool_embeddings').selectAll().execute();
  }
  private async deleteToolDocByName(name: string): Promise<void> {
    await postgresqlService.getKyselyDatabase()
      .deleteFrom('tool_embeddings')
      .where('metadata', '@>', { name }) // match JSON per nome
      .execute();
  }
}

export const embeddingsService = EmbeddingsService.getInstance();