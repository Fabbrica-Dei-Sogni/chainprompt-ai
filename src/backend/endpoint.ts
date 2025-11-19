/**
 * Vengono esposti al server tutte le rotte applicative.
 * In futuro potrebbero essere interfacciati da strumenti tipici di un API gateway
 */
import route from './routes/routes.js'
import express from 'express';
//import per eseguire la connect al database mongodb
import './services/databases/mongodb/mongodb.client.js';


// Importa le rotte definite in un altro file
const router: express.Router = express.Router();
router.use(route);

router.get("/", (req: express.Request, res: express.Response) => {
    res.send(
        "api works. questa chiamata è un hello world!! Se funziona allora è tutto ok!"
    );
});

console.log(`Endpoints caricati e disponibili...`);

export default router;