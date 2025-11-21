# Procedura Standard per Unit Testing (Coverage > 80%)

Questa guida definisce lo standard per la scrittura di unit test nel progetto `chainprompt-ai`, garantendo compatibilità con l'architettura DI (Dependency Injection) e raggiungendo una copertura del codice > 80%.

## 1. Configurazione Ambiente (Prerequisiti)
Assicurarsi che i file di configurazione siano allineati (già fatto nel setup iniziale):
-   `jest.config.cjs`: Configurato per trasformare ESM in CJS tramite `ts-jest`.
-   `src/test/setup.ts`: Importa `reflect-metadata` e resetta il container DI.

## 2. Posizione dei File
I test devono essere posizionati in una cartella `__tests__` adiacente al file da testare.
Esempio:
```text
src/core/services/
  ├── llm-agent.service.ts
  └── __tests__/
      └── llm-agent.service.test.ts
```

## 3. Struttura del Test (Boilerplate)
Ogni file di test deve seguire questo template per gestire correttamente la DI e i Mock.

```typescript
import "reflect-metadata"; // Obbligatorio per tsyringe
import { container } from "tsyringe";
import { MyService } from "../my.service.js"; // Importare il servizio reale
import { LOGGER_TOKEN } from "../../di/tokens.js"; // Token per le dipendenze
import { Logger } from "winston";

// 1. Mock delle dipendenze esterne (es. LangChain, Database)
jest.mock("langchain", () => ({
  createAgent: jest.fn(),
}));

// 2. Mock delle dipendenze iniettate (es. Logger)
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
} as unknown as Logger;

describe("MyService", () => {
  let service: MyService;

  beforeEach(() => {
    // 3. Registrazione dei Mock nel Container
    container.registerInstance(LOGGER_TOKEN, mockLogger);
    
    // 4. Risoluzione del servizio da testare
    service = container.resolve(MyService);
    
    // 5. Pulizia dei mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    // 6. Reset del container per isolamento totale
    container.reset();
  });

  // Test cases...
});
```

## 4. Strategia di Testing per Coverage > 80%

Per raggiungere l'obiettivo, implementare test per le seguenti categorie:

### A. Happy Path (Funzionamento Standard)
Verifica che il metodo restituisca il risultato atteso con input corretti.
```typescript
it("should perform action successfully", async () => {
  (externalLib.method as jest.Mock).mockReturnValue("success");
  const result = await service.method("input");
  expect(result).toBe("success");
  expect(externalLib.method).toHaveBeenCalledWith("input");
});
```

### B. Error Handling (Gestione Errori)
Verifica che le eccezioni siano gestite o rilanciate correttamente e che vengano loggate.
```typescript
it("should handle errors and log them", async () => {
  const error = new Error("Fail");
  (externalLib.method as jest.Mock).mockRejectedValue(error);

  await expect(service.method("input")).rejects.toThrow();
  expect(mockLogger.error).toHaveBeenCalled();
});
```

### C. Branch Coverage (Logica Condizionale)
Se il codice ha `if/else`, `switch` o loop, creare test case specifici per entrare in ogni ramo.
*Esempio:* Se c'è un log complesso che stampa diverse proprietà di un oggetto, passare un oggetto completo di tutte le proprietà per "accendere" tutti i log.

## 5. Esecuzione e Verifica
Eseguire i test con il comando:
```bash
npm test
```

Per verificare la coverage:
```bash
npm test -- --coverage
```
Controllare la tabella finale. Se la % di "Stmts" o "Branch" è sotto l'80%, individuare le righe non coperte (colonna "Uncovered Line #s") e aggiungere test specifici.
