import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
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

// Sovrascrittura globale dei metodi console per usare Winston
/*console.log = (...args: unknown[]) => {
  logger.info(args.map(String).join(" "));
};*/
console.info = (...args: unknown[]) => {
  logger.info(args.map(String).join(" "));
};
console.warn = (...args: unknown[]) => {
  logger.warn(args.map(String).join(" "));
};
console.error = (...args: unknown[]) => {
  logger.error(args.map(String).join(" "));
};
console.debug = (...args: unknown[]) => {
  logger.debug(args.map(String).join(" "));
};

export default logger;
