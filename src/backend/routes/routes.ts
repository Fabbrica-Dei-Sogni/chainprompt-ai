// Rappresenta il file in cui raggruppare le varie rotte definite nella cartella "apis"
import express from "express";
import chainbot from "../apis/platform/chainbot.js"
import clickbaitscore from "../apis/platform/clickbaitscore.js"
import analisicommenti from "../apis/platform/analisicommenti.js"
import threatintel from "../apis/platform/threatintel.js"
import agentbot from "../apis/platform/agentbot.js"
import manager from "../apis/platform/manager.js"
import cheshirecat from "../apis/platform/cheshirecat.js"
import agentconfig from "../apis/backoffice/agentconfig.js"
import configuration from "../apis/backoffice/configuration.js";
const router = express.Router();

/**
 * Tutte le apis supportate dall'applicazione vengono importate in questo aggregatore di rotte applicative

prima versione deprecata, ma iniziatore di tutto il progetto
router.use(classicbot);

 */

// Utilizza le rotte definite nel modulo "chatbot"
router.use(manager);
router.use(chainbot);
router.use(agentbot);
router.use(analisicommenti);
router.use(clickbaitscore);
router.use(threatintel);
//XXX: disabilitato per ora l'integrazione con cheshirecat
//router.use(cheshirecat);

//api per il gestionale della piattaforma
router.use(agentconfig);
router.use(configuration);

export default router;