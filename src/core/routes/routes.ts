// Rappresenta il file in cui raggruppare le varie rotte definite nella cartella "apis"
import express from "express";
import classicbot from "../apis/classicbot.js"
import chainbot from "../apis/chainbot.js"
import clickbaitscore from "../apis/clickbaitscore.js"
import analisicommenti from "../apis/analisicommenti.js"
import cheshirecat from "../apis/cheshirecat.js"
const router = express.Router();

/**
 * Tutte le apis supportate dall'applicazione vengono importate in questo aggregatore di rotte applicative
 */

// Utilizza le rotte definite nel modulo "chatbot"
router.use(analisicommenti);
router.use(clickbaitscore);
router.use(classicbot);
router.use(chainbot);
router.use(cheshirecat);

console.log(`Importazione delle API avvenuta con successo!`);

export default router;