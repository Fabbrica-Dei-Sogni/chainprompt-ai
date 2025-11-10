// Rappresenta il file in cui raggruppare le varie rotte definite nella cartella "apis"
import express from "express";
import chainbot from "../apis/chainbot.js"
import clickbaitscore from "../apis/clickbaitscore.js"
import analisicommenti from "../apis/analisicommenti.js"
import threatintel from "../apis/threatintel.js"
import agentbot from "../apis/agentbot.js"
import cheshirecat from "../apis/cheshirecat.js"
const router = express.Router();

/**
 * Tutte le apis supportate dall'applicazione vengono importate in questo aggregatore di rotte applicative

prima versione deprecata, ma iniziatore di tutto il progetto
router.use(classicbot);

 */

// Utilizza le rotte definite nel modulo "chatbot"
router.use(chainbot);
router.use(agentbot);
router.use(analisicommenti);
router.use(clickbaitscore);
router.use(threatintel);
//XXX: disabilitato per ora l'integrazione con cheshirecat
//router.use(cheshirecat);

export default router;