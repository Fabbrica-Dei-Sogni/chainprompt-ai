import express from "express";
const router = express.Router();
import { providerRoutes } from "../../../core/enums/llmprovider.enum.js";
import '../../logger.backend.js';
import { agentController } from "../../controllers/handler.agent.controller.js";


//Api per definire degli agenti manager

providerRoutes.forEach(({ prefix, provider }) => {
    router.post(`/agent/${prefix}/demomultiagent`, (req, res, next) =>
        agentController.agentManagerHandler(req, res, next, provider, [], ['whatif', 'whenudie'])
    );
});

console.log(`Api del manager agent caricati con successo!`);

export default router;