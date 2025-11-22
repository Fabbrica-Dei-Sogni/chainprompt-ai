[README Principale](../README.md)

# ChainPrompt AI - Vision & Objectives

## 🎯 Mission Statement

**ChainPrompt AI** è progettato per democratizzare l'orchestrazione di agenti AI, rendendo possibile a qualsiasi azienda o sviluppatore creare, deployare e integrare sistemi multi-agente complessi senza vendor lock-in, con pieno controllo dei dati e della privacy.

- [Roadmap](./docs/ROADMAP.md) - Roadmap del progetto.
- [Test e coverage](./testing/coverage-results.md)
- [Walkthrough](./testing/walkthrough.md)

---

## 🌟 Vision del Progetto

### Il Principio Fondamentale
**"Dichiari l'agente → È subito pronto → Lo integri ovunque"**

ChainPrompt elimina la complessità tradizionale dello sviluppo di sistemi AI, permettendo di:
- **Dichiarare** agenti tramite UI intuitiva o API
- **Personalizzare** prompt, tool e comportamenti per ogni specifica esigenza
- **Deployare** istantaneamente endpoint pronti all'uso
- **Integrare** in qualsiasi ecosistema aziendale esistente

---

## 🏗️ Architettura Strategica

### Fondamenta Solide: LangChain & LangGraph
ChainPrompt si appoggia deliberatamente ai framework leader del settore:
- **LangChain** per l'orchestrazione di agenti, gestione della memoria e tool calling
- **LangGraph** per sistemi multi-agente complessi e workflow stateful

**Perché questa scelta?**
- ✅ Qualità certificata dalle best practice del settore
- ✅ Aggiornamenti automatici a nuovi modelli e feature
- ✅ Ecosistema di tool e integrazioni già disponibili
- ✅ Focus sul valore aggiunto: deployment, gestione e customizzazione

### Il Valore Aggiunto di ChainPrompt

```
┌─────────────────────────────────────────────────────────┐
│  ChainPrompt Platform Layer                             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎨 Agent Declaration & Composition                 │ │
│  │    - UI/API per creare agenti senza codice         │ │
│  │    - Agenti che chiamano altri agenti come tool    │ │
│  │    - Configurazione prompt personalizzati          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔌 Multi-Protocol Integration Layer                │ │
│  │    - REST API endpoints                            │ │
│  │    - WebSocket real-time                           │ │
│  │    - Socket.io per applicazioni moderne            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🛡️ Middleware Customizzabili                       │ │
│  │    - Audit trail per compliance                    │ │
│  │    - Cost control e rate limiting                  │ │
│  │    - PII filtering per privacy                     │ │
│  │    - Custom business logic injection               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔧 OpenAPI Tool Registry                           │ │
│  │    - Import/Export specifiche OpenAPI             │ │
│  │    - Qualsiasi API diventa un tool                │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ Delegates AI Logic ↓
                   │
┌──────────────────▼──────────────────────────────────────┐
│  LangChain/LangGraph Framework                          │
│  - Agent Execution Engine                               │
│  - Memory & State Management                            │
│  - Multi-Provider LLM Support                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎪 Funzionalità Chiave

### 1. Multi-Agent Systems (Agents Calling Agents)
**Il differenziatore principale.**

Possibilità di creare gerarchie di agenti dove un agente "master" coordina sotto-agenti specializzati. ogni agente può essere un tool per un altro.

**Esempio pratico:**
```
Agente "Customer Service" (master)
  ├── Tool: Agente "Order Tracker"
  ├── Tool: Agente "Product Expert"
  ├── Tool: Agente "Refund Manager"
  └── Tool: API Stripe (OpenAPI)
```

### 2. Provider Independence & Privacy-First
- **Scegli il provider che preferisci:** OpenAI, Anthropic, Google VertexAI, Ollama (locale)
- **Modalità totalmente offline:** Deploy on-premise con modelli locali
- **I tuoi dati restano tuoi:** Zero dipendenza da big tech se lo desideri

### 3. OpenAPI Tool Standard
Qualsiasi API esistente con specifica OpenAPI può diventare un tool dell'agente senza scrivere codice:
- Importa lo schema OpenAPI
- L'agente apprende automaticamente come usarla
- Integrazione seamless con l'ecosistema esistente

### 4. Integration-First Architecture
**Ogni agente è un endpoint pronto all'uso:**
- REST per integrazioni sincrone/batch
- WebSocket per conversazioni real-time
- Socket.io per app moderne reactive

**Risultato:** Integri gli agenti in app mobile, web legacy, sistemi on-premise, ovunque.

### 5. Middleware Customizzabili
Inietta logica business nel flusso di esecuzione senza modificare il core:
- **Compliance:** Audit trail automatico per settori regolati (banche, sanità)
- **Cost Control:** Limiti di budget e throttling
- **Security:** PII masking, content filtering
- **Custom Logic:** Qualsiasi logica specifica del dominio

---

## 🆚 Differenziazione dal Mercato

| Caratteristica | LangChain/LangGraph | LangFlow/Flowise | Dify | **ChainPrompt AI** |
|:---|:---:|:---:|:---:|:---:|
| **No-Code Agent Creation** | ❌ | ✅ | ✅ | ✅ |
| **Multi-Protocol (REST+WS)** | ❌ | ⚠️ Limitato | ✅ | ✅ |
| **Agents as Tools** | ⚠️ Manuale | ⚠️ Limitato | ❌ | ✅ |
| **OpenAPI Tool Import** | ❌ | ⚠️ Parziale | ❌ | ✅ |
| **Custom Middleware** | ⚠️ Codice | ❌ | ❌ | ✅ |
| **Full Offline Mode** | ✅ | ⚠️ Parziale | ❌ | ✅ |
| **Enterprise-Ready** | ⚠️ Framework | ❌ | ⚠️ SaaS Only | ✅ |

**Posizionamento:** Non un concorrente di LangChain/LangGraph (li usiamo come fondamenta), ma il layer enterprise che rende questi framework utilizzabili in produzione da qualsiasi organizzazione.

---

## 🎯 Target Audience

### 1. **PMI Innovatice**
Vogliono AI ma non hanno team dedicato R&D → ChainPrompt è la loro "AI Department as a Service"

### 2. **System Integrator**
Cercano soluzioni white-label da rivendere → ChainPrompt è il backend invisibile per i loro progetti

### 3. **Settori Regolati** (Banking, Healthcare, PA)
Necessitano controllo totale su dati e privacy → Modalità on-premise offline è la chiave

### 4. **Developer & Startup**
Vogliono muoversi veloce senza dipendenze → API-first + multi-provider = libertà totale

---

## 🚀 Value Proposition

### Per le Aziende
**"Deploy your AI agent army in minutes, not months"**
- Niente team AI dedicato necessario
- Time-to-market drasticamente ridotto
- TCO inferiore rispetto a soluzioni custom

### Per gli Sviluppatori
**"Build once, integrate everywhere"**
- Crea l'agente una volta
- Usalo via REST, WebSocket, Socket.io
- Cambia provider senza riscrivere codice

### Per i Decision Maker
**"Sovranità digitale e controllo totale"**
- Deploy on-premise se necessario
- Compliance GDPR/NIS2 by design
- Zero vendor lock-in

---

## 🔮 Roadmap Futura

### In Ottimizzazione
- [ ] UI di dichiarazione agenti visuale (drag-and-drop)
- [ ] Marketplace di tool OpenAPI pronti all'uso
- [ ] Dashboard di monitoring e analytics
- [ ] SDK client (Python, JavaScript, Java, Go)

### Vision a Lungo Termine
- **Auto-scaling intelligente:** Agenti che si scalano in base al carico
- **A/B Testing integrato:** Testa prompt diversi e misura performance
- **Fine-tuning assistito:** Migliora agenti basandosi su feedback reali
- **Collaborative Agents:** Agenti che imparano da interazioni con altri agenti

---

## 💡 Filosofia

> **"Non costruiamo chatbot. Costruiamo ecosistemi di intelligenza distribuita che lavorano per te, con le tue regole, sui tuoi dati."**

ChainPrompt non è un wrapper di OpenAI, né un clone di servizi esistenti.
È una **piattaforma di orchestrazione sovereign** che mette il controllo nelle tue mani.

---

<p align="center">
  <i>La tua schiera di agenti. Sovrana. Integrabile. Subito.</i>
</p>
