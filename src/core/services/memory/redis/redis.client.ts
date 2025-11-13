import { createClient, RedisClientType } from "redis";
import '../../../../logger.js';
/**

Servizio dedicato a operazioni di storage redis.

Attualmente è presente la gestione dello storico di una conversazione 
con l'ausilio della classe RedisChatMessageHistory

 */


//XXX: dedicare una classe ad hoc per gestire gli accessi a redis e alla memoria in generale
// Connessione Redis singleton configurata una volta
class RedisClient {
  public client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: 'redis://' + process.env.REDIS_HOST + ':' + (process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD, // Good practice: use environment variables,
      database: Number(process.env.REDIS_DB) || 0,
      socket: {
        reconnectStrategy: (retries: any) => {
          if (retries > 5) return new Error('Too many attempts to reconnect to Redis');
          return Math.min(retries * 100, 2000); // ms delay tra tentativi
        },
        connectTimeout: 5000,
      }
    });

    // Error handling
    this.client.on('error', (err: Error) => {
      console.error('R[REDIS] Error:', err);
    });
    this.connectRedis().catch(console.error)

  }

  // Connecting to the Redis server
  async connectRedis(): Promise<void> {
    await this.client.connect();
      console.log('[REDIS] Connected.');
  }
}

export const REDIS_CLIENT_INSTANCE = new RedisClient();