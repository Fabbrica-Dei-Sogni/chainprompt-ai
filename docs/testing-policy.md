# Testing Policy

## Scopo
Questa policy definisce gli standard di copertura dei test per **tutto il progetto** (backend e core).

## Regole principali
| Tipo di file | Soglia di coverage |
|--------------|--------------------|
| **File con cartella `__tests__`** (cioè il codice che ha una directory di test affiancata) | **≥ 80 %** per statements, branches, functions e lines |
| **File senza cartella `__tests__`** | Se la coverage è **< 20 %** → è necessario aggiungere test immediatamente. Se è **≥ 20 %** → l’intervento può essere posticipato a una fase successiva. |

## Ambito di applicazione
- **Backend** (`src/backend/**`)
- **Core** (`src/core/**`)

Entrambi i domini devono rispettare le stesse soglie.

## Come verificare la policy
1. **Eseguire i test con coverage**
   ```bash
   npm test -- --coverage
   ```
2. **Interpretare l’output di Jest**
   - La sezione *All files* mostra la copertura globale.
   - Filtrare le righe contenenti `__tests__` per vedere la copertura dei file “sotto test”.
   - Esempio di filtro:
     ```bash
     npm test -- --coverage | grep -E 'src/.*/__tests__/|All files'
     ```
3. **Controllare le soglie**
   - Tutti i file con `__tests__` devono avere **≥ 80 %** su statements, branches, functions e lines.
   - Per i file senza `__tests__`, calcolare la media della coverage; se è **< 20 %** aprire un ticket per aggiungere test.

## Integrazione CI
- Il job `test-coverage` fallisce se una delle soglie è violata.
- Un warning è emesso per i file non‑test con coverage < 20 %.
- Il log di CI deve includere:
  - `✅ Coverage su file testati ≥ 80 %`
  - `⚠️ Coverage su file non‑test: X % (soglia 20 %).`

## Documentazione aggiuntiva
- Il file è disponibile in `docs/testing-policy.md`.
- Il `README.md` contiene un collegamento a questa policy nella sezione **Testing**.

---
*Policy approvata e in vigore a partire dal 2025‑11‑22.*
