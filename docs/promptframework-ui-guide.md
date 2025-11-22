# PromptFramework - Guida UI/UX

Documentazione per implementare l'interfaccia utente per la gestione centralizzata dei prompt tramite templates.

---

## 🎯 Panoramica

L'architettura PromptFramework permette di gestire i prompt degli agenti tramite **templates condivisi**:

✅ **Galleria Templates** - Repository centralizzato di prompt riusabili  
✅ **Reference-Only** - Ogni agent usa un template dalla galleria  
✅ **Modifiche centralizzate** - Aggiorna template → tutti gli agenti aggiornati

**Principio:** "Un template, molti agenti"

---

## 🏗️ Architettura Tecnica

### Schema Database

Ogni `AgentConfig` ha un riferimento **obbligatorio** a un `PromptFramework`:

```typescript
interface IAgentConfig {
  nome?: string;
  descrizione?: string;
  contesto: string;
  
  // Riferimento OBBLIGATORIO a template
  promptFrameworkRef: ObjectId;  // ← Points to PromptFramework collection
  
  profilo: string;
  tools?: string[];
}
```

### Logica di Risoluzione

```
getFinalPrompt(agent):
    ↓
1. Carica template da agent.promptFrameworkRef
2. Genera prompt dalle sections del template
3. Return prompt completo
```

**Nessun fallback** - Ogni agent DEVE avere un template valido.

---

## 🎨 Implementazione UI - 3 Modalità

### Modalità 1: 📚 Galleria Templates (Riuso)

**Caso d'uso:** 
- Prompt standardizzati (es: customer support, code review, data analysis)
- Più agenti condividono lo stesso prompt
- Modifiche centralizzate (aggiorno template → tutti gli agenti aggiornati)

**UI Design:**

```
┌─────────────────────────────────────────┐
│ SCEGLI DALLA GALLERIA                   │
├─────────────────────────────────────────┤
│                                         │
│ [Dropdown] Seleziona template           │
│ ┌─────────────────────────────────────┐ │
│ │ 📘 template-customer-support        │ │
│ │ 📗 template-code-review             │ │
│ │ 📙 template-data-analyst            │ │
│ │ 📕 template-default                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ Preview Sezioni ]                     │
│ ┌─────────────────────────────────────┐ │
│ │ Ruolo: You are a helpful...         │ │
│ │ Tono: Professional and empathetic   │ │
│ │ Obiettivo: Resolve customer issues  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ℹ️ Le modifiche al template si          │
│    applicano a tutti gli agenti che     │
│    lo usano                             │
│                                         │
│ [Usa questo template]                   │
└─────────────────────────────────────────┘
```

**API Call:**

```typescript
// GET /api/promptframeworks - Carica lista templates
const templates = await fetch('/api/promptframeworks').then(r => r.json());

// POST /api/agentconfigs - Crea agent con template
const agent = await fetch('/api/agentconfigs', {
  method: 'POST',
  body: JSON.stringify({
    nome: 'SupportBot-1',
    contesto: 'customer-support',
    promptFrameworkRef: selectedTemplateId,  // ← Riferimento
    profilo: 'gpt-4',
    tools: ['email', 'ticket']
  })
});
```

**Vantaggi:**
- ✅ Riuso immediato
- ✅ Aggiornamenti centralizzati
- ✅ Best practices predefinite

---

### Modalità 2: ✏️ Prompt Custom Dedicato (Strutturato)

**Caso d'uso:**
- Prompt unico per caso specifico
- Workflow aziendale personalizzato
- Partire da template e personalizzare

**UI Design:**

```
┌─────────────────────────────────────────┐
│ CREA PROMPT CUSTOM                      │
├─────────────────────────────────────────┤
│                                         │
│ Nome Framework:                         │
│ [custom-analyzer_______________]        │
│                                         │
│ Descrizione (opzionale):                │
│ [Framework dedicato per...______]       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ SEZIONI PROMPT                      │ │
│ │                                     │ │
│ │ [⋮] Sezione: Ruolo          [🗑️]   │ │
│ │     Content:                        │ │
│ │     [You are a data analyzer___]    │ │
│ │                                     │ │
│ │ [⋮] Sezione: Formato Output [🗑️]   │ │
│ │     Content:                        │ │
│ │     [Always output JSON_______]     │ │
│ │                                     │ │
│ │ [+ Aggiungi sezione]                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ℹ️ Modifiche solo per questo agente      │
│                                         │
│ [Salva prompt custom]                   │
└─────────────────────────────────────────┘
```

**Features UI:**
- Drag & drop per riordinare sezioni (⋮ handle)
- Aggiungi/rimuovi sezioni dinamicamente
- Preview live del prompt finale

**API Call:**

```typescript
// POST /api/agentconfigs - Crea agent con custom embedded
const agent = await fetch('/api/agentconfigs', {
  method: 'POST',
  body: JSON.stringify({
    nome: 'UniqueBot',
    contesto: 'special-case',
    promptFramework: {  // ← Embedded custom (no ref)
      name: 'custom-analyzer',
      description: 'Framework dedicato per analisi dati',
      sections: [
        { key: 'role', content: 'You are a data analyzer', order: 1 },
        { key: 'format', content: 'Always output JSON', order: 2 }
      ]
    },
    profilo: 'claude-3'
  })
});
```

**Vantaggi:**
- ✅ Isolato (modifiche non toccano altri)
- ✅ Strutturato (vs stringa monolitica)
- ✅ Flessibilità massima

---

### Modalità 3: 📝 System Prompt Classico (Legacy)

**Caso d'uso:**
- Prototipazione rapida
- Test veloci
- Utenti che preferiscono modalità classica
- Backward compatibility

**UI Design:**

```
┌─────────────────────────────────────────┐
│ SYSTEM PROMPT CLASSICO                  │
├─────────────────────────────────────────┤
│                                         │
│ Inserisci il system prompt:             │
│ ┌─────────────────────────────────────┐ │
│ │ You are a helpful assistant that    │ │
│ │ specializes in customer support.    │ │
│ │                                     │ │
│ │ Your goal is to resolve issues      │ │
│ │ efficiently and professionally.     │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ℹ️ Usa questa modalità per test rapidi   │
│                                         │
│ 💡 [Converti in prompt strutturato]     │
│                                         │
│ [Salva]                                 │
└─────────────────────────────────────────┘
```

**API Call:**

```typescript
// POST /api/agentconfigs - Crea agent con systemprompt
const agent = await fetch('/api/agentconfigs', {
  method: 'POST',
  body: JSON.stringify({
    nome: 'SimpleBot',
    contesto: 'basic',
    systemprompt: 'You are a helpful assistant...',  // ← Legacy
    profilo: 'gpt-3.5'
  })
});
```

**Vantaggi:**
- ✅ Veloce e semplice
- ✅ Nessuna curva di apprendimento
- ✅ Compatibile con agenti esistenti

---

## 🔄 Workflow Avanzati

### Workflow 1: Personalizza Template

User vuole partire da template ma personalizzare alcune sezioni.

**UI Flow:**

```
1. User seleziona "template-customer-support" dalla galleria
2. Click su [Personalizza per questo agente]
3. Sistema mostra editor custom con sezioni pre-popolate
4. User modifica solo sezione "Tono" → più informale
5. Click su [Salva come custom]
6. → Salvato come promptFramework embedded (non ref)
```

**Codice:**

```typescript
// 1. Carica template
const template = await fetch(`/api/promptframeworks/${templateId}`)
  .then(r => r.json());

// 2. User modifica in UI
const customSections = [...template.sections];
customSections[1].content = "Casual and friendly";  // modifica tono

// 3. Salva come custom embedded
await fetch('/api/agentconfigs', {
  method: 'POST',
  body: JSON.stringify({
    nome: 'CasualSupportBot',
    contesto: 'support',
    promptFramework: {  // ← custom basato su template
      name: 'custom-casual-support',
      sections: customSections
    },
    profilo: 'gpt-4'
  })
});
```

---

### Workflow 2: Converti Legacy → Strutturato

Migrazione da system prompt classico a framework strutturato.

**UI Flow:**

```
┌─────────────────────────────────────────┐
│ Agent: LegacyBot                        │
│ Prompt: 📝 System prompt classico       │
├─────────────────────────────────────────┤
│ "You are a helpful assistant. Your     │
│  goal is to resolve customer issues."  │
│                                         │
│ 💡 [Converti in prompt strutturato]     │
└─────────────────────────────────────────┘
        ↓ Click
┌─────────────────────────────────────────┐
│ CONVERTI IN STRUTTURATO                 │
├─────────────────────────────────────────┤
│ Abbiamo analizzato il tuo prompt e     │
│ suggerito questa struttura:             │
│                                         │
│ Sezione: Ruolo                          │
│ [You are a helpful assistant]           │
│                                         │
│ Sezione: Obiettivo                      │
│ [Your goal is to resolve customer...]  │
│                                         │
│ [Modifica] [Salva conversione]          │
└─────────────────────────────────────────┘
```

**Codice:**

```typescript
// Parsing AI-assisted (opzionale)
const parsedSections = await fetch('/api/ai/parse-prompt', {
  method: 'POST',
  body: JSON.stringify({ prompt: agent.systemprompt })
}).then(r => r.json());

// Aggiorna agent
await fetch(`/api/agentconfigs/${agentId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    promptFramework: {
      name: 'converted-from-legacy',
      sections: parsedSections
    },
    systemprompt: null  // opzionale: rimuovi legacy
  })
});
```

---

### Workflow 3: Gestione Template nella Galleria

Admin panel per gestire templates condivisi.

**UI:**

```
┌─────────────────────────────────────────────────┐
│ GESTIONE GALLERIA TEMPLATES                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ [+ Nuovo Template]                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📘 template-customer-support       [✏️][🗑️] │ │
│ │    Usato da: 12 agenti                      │ │
│ │    Ultima modifica: 2025-11-20              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📗 template-code-review ⭐        [✏️][🗑️] │ │
│ │    Usato da: 8 agenti                       │ │
│ │    Ultima modifica: 2025-11-19              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Endpoints:**

```typescript
// GET /api/promptframeworks - Lista tutti
// POST /api/promptframeworks - Crea nuovo
// GET /api/promptframeworks/:id - Dettagli
// PUT /api/promptframeworks/:id - Modifica
// DELETE /api/promptframeworks/:id - Elimina
// POST /api/promptframeworks/:id/clone - Clona

// Esempio: Modifica template
await fetch(`/api/promptframeworks/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
    sections: updatedSections
  })
});
// → Tutti gli agenti con promptFrameworkRef a questo template
//   vedranno il nuovo prompt al prossimo getFinalPrompt()
```

---

## 📊 UI Component - Indicatore Fonte Prompt

Mostra chiaramente quale modalità è usata per ogni agent.

**Agent List View:**

```
┌──────────────────────────────────────────────┐
│ AGENTI                                       │
├──────────────────────────────────────────────┤
│                                              │
│ SupportBot-1          📚 template-support   │
│ UniqueBot             ✏️ custom-analyzer    │
│ LegacyBot             📝 system prompt      │
│ CasualSupport         ✏️ custom-casual      │
│                                              │
└──────────────────────────────────────────────┘
```

**Agent Detail View:**

```
┌─────────────────────────────────────┐
│ Agent: SupportBot-1                 │
├─────────────────────────────────────┤
│ Prompt: 📚 Da galleria              │
│ Template: template-customer-support│
│                                     │
│ [Vedi template] [Converti a custom] │
│                                     │
│ ⚠️ Modificando il template cambierà │
│    anche per altri 11 agenti        │
└─────────────────────────────────────┘
```

**Codice React Example:**

```tsx
function PromptSourceBadge({ agent }: { agent: AgentConfig }) {
  if (agent.promptFramework) {
    return (
      <Badge color="blue">
        ✏️ Custom: {agent.promptFramework.name}
      </Badge>
    );
  }
  
  if (agent.promptFrameworkRef) {
    return (
      <Badge color="purple">
        📚 Template: {agent.promptFrameworkRef.name}
      </Badge>
    );
  }
  
  return (
    <Badge color="gray">
      📝 System prompt classico
    </Badge>
  );
}
```

---

## 📋 Checklist Implementazione UI

### Fase 1: Galleria Templates
- [ ] Pagina lista templates (`/admin/templates`)
- [ ] CRUD templates (create, edit, delete, clone)
- [ ] Dropdown selezione template in form creazione agent
- [ ] Preview sezioni template
- [ ] Counter "usato da X agenti"

### Fase 2: Custom Editor
- [ ] Editor sezioni con drag & drop
- [ ] Add/remove sezioni
- [ ] Validazione (key univoca, content required)
- [ ] Preview live prompt finale
- [ ] Opzione "Parti da template"

### Fase 3: Legacy Support
- [ ] Textarea classico system prompt
- [ ] Pulsante "Converti a strutturato"
- [ ] Parser AI-assisted (opzionale)

### Fase 4: Gestione Agent
- [ ] Badge indicatore fonte prompt
- [ ] Pulsante "Cambia modalità prompt"
- [ ] Warning quando si modifica template condiviso
- [ ] Opzione "Converti ref → custom"

### Fase 5: UX Polish
- [ ] Help tooltips per ogni modalità
- [ ] Esempi/templates starter
- [ ] Validazione form real-time
- [ ] Conferme prima di azioni distruttive

---

## 🎯 Best Practices UI/UX

### 1. **Guida Utente**

Mostra suggerimenti contestuali:

```
Quando usare la GALLERIA:
✅ Hai più agenti con lo stesso comportamento
✅ Vuoi aggiornamenti centralizzati
✅ Usi prompt standardizzati aziendali

Quando usare CUSTOM:
✅ Prompt unico per caso specifico
✅ Workflow personalizzato
✅ Variazione di template esistente

Quando usare CLASSICO:
✅ Test rapidi
✅ Preferisci modalità semplice
✅ Non serve struttura
```

### 2. **Conversioni Facili**

Permetti passaggi fluidi tra modalità:

```
Legacy → Custom:    [Converti in strutturato]
Template → Custom:  [Personalizza per questo agente]
Custom → Template:  [Salva come template nella galleria]
```

### 3. **Sicurezza**

Alert prima di modifiche pericolose:

```
⚠️ Stai modificando "template-support" usato da 12 agenti.
   Le modifiche si applicheranno a tutti.
   
   [ Annulla ]  [ Procedi comunque ]  [ Crea variante ]
```

### 4. **Feedback Visivo**

Stato chiaro delle operazioni:

```
Salvando template... ⏳
✅ Template salvato! 12 agenti aggiornati.
```

---

## 🚀 API Reference Quick

```typescript
// TEMPLATES (Galleria)
GET    /api/promptframeworks           // Lista tutti
POST   /api/promptframeworks           // Crea nuovo
GET    /api/promptframeworks/:id       // Dettagli
PUT    /api/promptframeworks/:id       // Modifica
DELETE /api/promptframeworks/:id       // Elimina
POST   /api/promptframeworks/:id/clone // Clona

// AGENTS (con prompt hybrid)
POST   /api/agentconfigs               // Crea (con promptFrameworkRef o promptFramework o systemprompt)
GET    /api/agentconfigs/:id           // Dettagli
PATCH  /api/agentconfigs/:id           // Modifica prompt
GET    /api/agentconfigs/:id/prompt    // Ottieni prompt finale risolto
```

---

## 💡 Esempio Completo: Form Creazione Agent

```tsx
function CreateAgentForm() {
  const [promptMode, setPromptMode] = useState<'gallery'|'custom'|'classic'>('gallery');
  
  return (
    <form>
      <input name="nome" placeholder="Nome agente" />
      <input name="contesto" placeholder="Contesto" />
      
      {/* Scelta modalità */}
      <RadioGroup value={promptMode} onChange={setPromptMode}>
        <Radio value="gallery">📚 Galleria Templates</Radio>
        <Radio value="custom">✏️ Crea Custom</Radio>
        <Radio value="classic">📝 System Prompt Classico</Radio>
      </RadioGroup>
      
      {/* Conditional rendering */}
      {promptMode === 'gallery' && (
        <TemplateSelector name="promptFrameworkRef" />
      )}
      
      {promptMode === 'custom' && (
        <CustomSectionEditor name="promptFramework" />
      )}
      
      {promptMode === 'classic' && (
        <textarea name="systemprompt" rows={10} />
      )}
      
      <button type="submit">Crea Agente</button>
    </form>
  );
}
```

---

## 📚 Conclusioni

L'architettura hybrid offre:

✅ **Flessibilità** - 3 modalità per diversi use case  
✅ **Riuso** - Templates condivisi centralizzati  
✅ **Personalizzazione** - Frameworks custom dedicati  
✅ **Backward Compatibility** - System prompt legacy funziona  
✅ **Scalabilità** - Da prototipo a produzione enterprise  

**Inizia con la galleria templates per casi comuni, usa custom per personalizzazioni, mantieni classico per test rapidi!** 🚀
