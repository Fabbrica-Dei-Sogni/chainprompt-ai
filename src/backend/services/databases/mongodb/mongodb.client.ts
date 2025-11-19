import mongoose from 'mongoose';
import { dbHost } from '../../common.service.js';

export class MongoClientInstance {
  constructor() {

    //Connessione a mongodb
    mongoose.connect(dbHost);
    mongoose.connection.on('connected', () => {
      console.log('[mongoDB] Connected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('[mongoDB] Errore nella connessione:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('[mongoDB] Connessione chiusa');
    });
    
  }
}

//Importare il client all'endpoint.ts permette la connessione a mongodb all'avvio del server
export const instance = new MongoClientInstance();
