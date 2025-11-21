# Analisi Errori Setup Testing

Questo documento descrive le problematiche tecniche riscontrate durante la configurazione dell'ambiente di test Jest/TypeScript e le soluzioni adottate.

## 1. Errori di Compilazione TypeScript
**Errore:** `Cannot find name 'jest'`, `Cannot find name 'describe'`, etc.
**Contesto:** I file di test in `src/core/services/__tests__` segnalavano errori nell'IDE e in compilazione.
**Causa:** Esisteva un file `tsconfig.json` specifico nella directory `src/core` che sovrascriveva la configurazione root. Questo file non includeva `"jest"` nell'array `types`, rendendo i tipi globali di Jest invisibili al compilatore in quella sottocartella.
**Soluzione:** Aggiornamento di `src/core/tsconfig.json`:
```json
"types": ["node", "jest"]
```

## 2. Conflitto Moduli ESM vs CommonJS
**Errore:** `SyntaxError: Cannot use import statement outside a module` e `module is already linked`.
**Contesto:** Il progetto utilizza TypeScript con configurazione `NodeNext` (ESM nativo), ma Jest opera nativamente in CommonJS.
**Tentativi:**
1.  **Forzatura ESM:** L'uso di `NODE_OPTIONS=--experimental-vm-modules` ha causato conflitti con il mocking (`module is already linked`), probabilmente dovuto a come `ts-jest` o `jest.mock` interagiscono con i moduli VM sperimentali di Node.
2.  **Soluzione Ibrida (Adottata):** Abbiamo mantenuto il codice sorgente in stile ESM ma configurato `ts-jest` per transpilare i test in CommonJS al volo.
**Configurazione Risolutiva (`jest.config.cjs`):**
```javascript
transform: {
  '^.+\\.tsx?$': ['ts-jest', {
    tsconfig: {
      ...require('./tsconfig.json').compilerOptions,
      module: 'commonjs', // Override cruciale
    },
    isolatedModules: true
  }]
}
```
Questo permette di scrivere `import` nei test ma farli eseguire a Jest come `require`.

## 3. Copertura del Codice Insufficiente
**Problema:** Coverage iniziale al 54% per `LLMAgentService`.
**Causa:** I test iniziali coprivano solo il "happy path". Metodi complessi come `logState` contengono numerosi check condizionali (`if (!state.values)`, `if (!state.next)`) che venivano saltati.
**Soluzione:** Implementazione di un test case "Complex State" che inietta un oggetto di stato completamente popolato (mock), forzando l'esecuzione di tutti i rami di logica e portando la coverage > 80%.
