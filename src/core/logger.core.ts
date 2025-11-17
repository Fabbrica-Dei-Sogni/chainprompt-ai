import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.label({ label: '[platform]' }), 
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()  // formato JSON per log strutturati, utile in produzione
  ),
  //defaultMeta: { service: 'chainprompt-api' },
  transports: [
    new transports.Console({ format: format.simple() }),  // log su console
    // Optionale, scrittura file log con rotazione
    /*
    new transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    })
    */
  ],
});

export default logger;
