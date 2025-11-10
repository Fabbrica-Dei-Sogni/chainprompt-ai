import { Preprocessor } from "../../services/handler.service.js";
import { decodeBase64 } from "../../utils/clickbaitscore.util.js";

export const cyberSecurityPreprocessor: Preprocessor = async (req) => {
  try {
    // Nessuna modifica, usato per contesti generici
    console.info("Sconfiggi l'inferno apocalittico!! Forza e coraggio!");
  } catch (error) {
    console.error("Errore nel preprocessore di default:", error);
    throw error;
  }
};

export const clickbaitAgentPreprocessor: Preprocessor = async (req) => {
  try {
    const { url } = req.body;
    if (!url) {
      throw new Error("URL mancante nel payload per clickbaitscore");
    }
    const decodedUri = decodeBase64(url);
    req.body.question = decodedUri;
    req.body.numCtx = req.body.numCtx ?? 2040;
    req.body.maxToken = req.body.maxToken ?? 8032;
    req.body.noappendchat = true;
  } catch (error) {
    console.error("Errore nel preprocessore agente clickbaitscore:", error);
    throw error;  // rilancia per essere gestito centralmente
  }
};

/**
 Preprocessore di default (nessuna modifica, utile per casi generici)
 * @param req 
 */
export const defaultPreprocessor: Preprocessor = async (req) => {
  try {
    // Nessuna modifica, usato per contesti generici
  } catch (error) {
    console.error("Errore nel preprocessore agente di default:", error);
    throw error;
  }
};
