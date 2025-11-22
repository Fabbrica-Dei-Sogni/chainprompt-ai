# Error Handling Documentation

Questa cartella contiene tutta la documentazione relativa al sistema centralizzato di gestione errori.

## 📚 Documenti

### [error-handling-migration-guide.md](./error-handling-migration-guide.md)
Guida pratica step-by-step per migrare controller esistenti al nuovo sistema di error handling centralizzato.

**Quando usarlo**: Per migrare nuovi controller o aggiornare controller esistenti.

### [error-handling-rollout-summary.md](./error-handling-rollout-summary.md)
Summary tecnico dettagliato della migrazione completa, includendo:
- Pattern applicato
- Controllers migrati
- Statistiche e metriche
- Lezioni apprese

**Quando usarlo**: Per comprendere il contesto e i dettagli della migrazione.

### [error-handling-completion-report.md](./error-handling-completion-report.md)
Report finale esecutivo completo con:
- Metriche finali (coverage, test results)
- Problemi risolti
- File modificati
- Benefici ottenuti

**Quando usarlo**: Per un overview completo del progetto completato.

## 🎯 Quick Start

Se devi migrare un nuovo controller:
1. Leggi [`error-handling-migration-guide.md`](./error-handling-migration-guide.md)
2. Segui i 6 step documentati
3. Verifica che i test passino con coverage >80%

## 🏗️ Architettura

Il sistema si basa su:
- **asyncHandler**: Wrapper middleware che cattura errori async
- **Custom Error Classes**: `NotFoundError`, `ValidationError`, etc.
- **Error Middleware**: `errorHandler` e `notFoundHandler` in `server.ts`

## 📊 Stato Attuale

- ✅ 4/4 controller migrati
- ✅ 35/35 test passanti
- ✅ 97.88% coverage
- ✅ Production-ready

---

Per domande o problemi, consulta i documenti sopra o apri una issue.
