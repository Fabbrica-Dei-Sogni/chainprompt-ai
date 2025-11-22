# Guida alla Migrazione: Error Handling Centralizzato

Questa guida descrive i passaggi necessari per migrare i controller esistenti verso il nuovo sistema di gestione errori centralizzato.

## Panoramica

Il nuovo sistema utilizza:
1.  **Middleware Globale**: Cattura tutti gli errori non gestiti.
2.  **Custom Errors**: Classi di errore specifiche (`AppError`, `NotFoundError`, `ValidationError`, ecc.).
3.  **AsyncHandler**: Wrapper per eliminare i blocchi `try/catch` ripetitivi.

## Procedura di Migrazione (Step-by-Step)

Per ogni controller da migrare, seguire questi passaggi:

### 1. Aggiornare il Controller

1.  Importare `asyncHandler` e le classi di errore necessarie.
    ```typescript
    import { asyncHandler } from "../../middleware/async-handler.middleware.js";
    import { NotFoundError, ValidationError } from "../../errors/custom-errors.js";
    ```

2.  Convertire i metodi del controller in proprietà arrow function wrappate da `asyncHandler`.
    *   **Prima:**
        ```typescript
        async myMethod(req: Request, res: Response): Promise<void> {
            try {
                // logic...
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        }
        ```
    *   **Dopo:**
        ```typescript
        myMethod = asyncHandler(async (req: Request, res: Response) => {
            // logic...
            // Rimuovere try/catch
            // Usare throw per errori specifici
            if (!found) throw new NotFoundError("Resource");
            res.json(data);
        });
        ```

### 2. Aggiornare le Rotte

Assicurarsi che le rotte passino direttamente il metodo del controller (che ora è una proprietà bound).

*   **Prima:**
    ```typescript
    router.get('/path', (req, res) => controller.myMethod(req, res));
    ```
*   **Dopo:**
    ```typescript
    router.get('/path', controller.myMethod);
    ```

### 3. Aggiornare i Test

Poiché `asyncHandler` modifica la firma della funzione (aspettandosi `next`), i test devono passare un mock per `next`.

*   **Prima:**
    ```typescript
    await controller.myMethod(mockReq, mockRes);
    ```
*   **Dopo:**
    ```typescript
    await controller.myMethod(mockReq, mockRes, jest.fn());
    ```

### Esempio Completo (Pilot: AgentConfigController)

Vedere `src/backend/controllers/backoffice/agentconfig.controller.ts` come riferimento implementativo.

## Rollback

In caso di problemi:
1.  Rimuovere `asyncHandler` dal metodo.
2.  Ripristinare il blocco `try/catch`.
3.  Ripristinare la chiamata nella rotta (se necessario).
