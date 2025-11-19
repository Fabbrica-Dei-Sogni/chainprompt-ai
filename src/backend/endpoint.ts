/**
 * Vengono esposti al server tutte le rotte applicative.
 * In futuro potrebbero essere interfacciati da strumenti tipici di un API gateway
 */
import route from './routes/routes.js'
import mongoose from 'mongoose';
import { dbHost } from './services/common.service.js';
import express from 'express';


//Connessione a mongodb
mongoose.connect(dbHost);
mongoose.connection.on('connected', () => {
  console.log('Connessione a MongoDB stabilita');
});
mongoose.connection.on('error', (err) => {
  console.error('Errore nella connessione a MongoDB:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('Connessione a MongoDB chiusa');
});

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