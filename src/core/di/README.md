## Dependency Injection (DI) - Convenzioni

Questa cartella centralizza le convenzioni relative alla Dependency Injection (usando `tsyringe`) per il progetto.

Linee guida principali
- Importare `reflect-metadata` **una sola volta** all'entrypoint dell'app (es. `src/backend/server.ts`).
- Usare token centralizzati (Symbol o const) invece di stringhe literaL per evitare typo e collisioni.
- Registrare istanze "primitive" (logger, client DB, ecc.) con `registerInstance`/`registerValue` su `coreContainer` utilizzando i token.
- Registrare servizi con `registerSingleton(Classe, Classe)` in fase di bootstrap per chiarezza e per facilitare i test.

Esempio rapido
- Definire token:
  - `export const LOGGER_TOKEN = Symbol("Logger")`
- Registrare il logger (bootstrap):
  - `registerValue(LOGGER_TOKEN, loggerInstance)`
- Iniettare in una classe:
  - `constructor(@inject(LOGGER_TOKEN) private logger: Logger) {}`

Test e mocking
- Per i test Jest, sovrascrivere la registrazione prima dell'esecuzione del test:
  - `container.registerInstance(LOGGER_TOKEN, mockLogger)`
- Oppure creare un child container isolato per ogni suite.

Nota su ESM
- Nei file TypeScript usiamo import relativi che, dopo transpile, devono puntare a `.js` (es. `../di/tokens.js`). Questo repository già segue questa convenzione.

Per qualsiasi modifica di convenzione (es. passare a nomi stringa), aggiornare questo file e tutti i punti di registrazione nel container.
