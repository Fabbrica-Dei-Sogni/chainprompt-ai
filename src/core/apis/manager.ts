import express from "express";
const router = express.Router();
import { LLMProvider } from "../models/llmprovider.enum.js";
import '../../logger.js';
import { agentManagerHandler } from "../handlers/agents/handler.js";


//Api per definire degli agenti manager

router.post('/agent/'+LLMProvider.ChatOllama+'/manager', (req, res, next) =>
  agentManagerHandler(req, res, next, LLMProvider.ChatOllama)
);

console.log(`Api del manager agent caricati con successo!`);

export default router;