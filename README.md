# ChainPrompt AI

**ChainPrompt AI** è una piattaforma backend avanzata progettata per l'orchestrazione, la gestione e il deployment di agenti basati su Large Language Models (LLM). Costruita con un'architettura modulare e scalabile, permette di creare flussi di lavoro complessi integrando molteplici modelli AI, memoria persistente e strumenti esterni.

---

## 🌟 Caratteristiche Principali

*   **🤖 Orchestrazione Avanzata LLM**: Basata su **LangChain** e **LangGraph**, supporta la creazione di agenti autonomi e catene di esecuzione complesse.
*   **🔌 Multi-Model Support**: Integrazione nativa con i principali provider AI:
    *   **OpenAI** (GPT-4, GPT-3.5)
    *   **Anthropic** (Claude)
    *   **Google VertexAI** & **Gemini**
    *   **Ollama** (Modelli locali open-source)
    *   **HuggingFace**
*   **💾 Memoria & Persistenza Ibrida**:
    *   **Redis**: Per la gestione dello stato a bassa latenza e caching delle conversazioni.
    *   **MongoDB**: Per lo storage flessibile di documenti, log e configurazioni.
    *   **PostgreSQL**: Per dati strutturati e analisi relazionali.
*   **🛠️ Sistema di Tool Estensibile**: Framework modulare per dotare gli agenti di capacità reali (Web Scraping, Cybersecurity API, Analisi Dati, ecc.).
*   **📚 Gestione Dataset & Prompt**: Sistema integrato per il versionamento e il caricamento dinamico di dataset di prompt e knowledge base.
*   **🐳 Cloud-Native & Docker Ready**: Completamente containerizzato per un deployment semplice e scalabile in qualsiasi ambiente.

---

## 🏗️ Architettura del Progetto

Il sistema è diviso in due macro-componenti logici per garantire manutenibilità e separazione delle responsabilità:

### `src/core`
Il motore pulsante della piattaforma. Contiene la logica di business agnostica e i servizi fondamentali per l'interazione con gli LLM.
*   **LLM Services**: Gestione centralizzata delle chiamate ai modelli.
*   **Interfaces & Enums**: Contratti di tipo rigorosi per garantire la stabilità del codice.

### `src/backend`
L'implementazione server e API.
*   **API Endpoints**: REST API (Express) per esporre le funzionalità degli agenti al frontend o ad altri servizi.
*   **Tools**: Moduli funzionali (es. `scraping.tool.ts`) che gli agenti possono invocare.
*   **Databases**: Connettori e repository pattern per MongoDB, Redis e Postgres.

---

## 🚀 Getting Started

### Prerequisiti

*   **Node.js** (v18+)
*   **Docker** & **Docker Compose**
*   **NPM** o **Yarn**

### Installazione

1.  **Clona il repository:**
    ```bash
    git clone https://github.com/your-org/chainprompt-ai.git
    cd chainprompt-ai
    ```

2.  **Configura l'ambiente:**
    Copia il file di esempio e configura le tue chiavi API (OpenAI, Anthropic, ecc.).
    ```bash
    cp .env.dev .env
    # Modifica .env con i tuoi parametri
    ```

3.  **Avvia i servizi di supporto (Database):**
    Utilizza gli script helper o docker-compose direttamente.
    ```bash
    # Avvia MongoDB, Redis e PostgreSQL
    cd mongodb && docker-compose up -d
    cd ../redis && docker-compose up -d
    cd ../postgresql && docker-compose up -d
    cd ..
    ```

4.  **Installa le dipendenze:**
    ```bash
    npm ci
    ```

5.  **Avvia il Server:**
    ```bash
    npm run start-dev
    ```
    Il server sarà attivo su `http://localhost:3000` (o sulla porta configurata).

---

## 💻 Sviluppo e Contribuzione

### Struttura Directory
```
chainprompt-ai/
├── src/
│   ├── backend/          # Server Express, API, Tools
│   │   ├── apis/         # Endpoint degli Agenti
│   │   ├── tools/        # Strumenti (Skills) degli Agenti
│   │   └── services/     # Logica di business e DB
│   └── core/             # Logica Core LLM condivisa
├── mongodb/              # Configurazione Docker Mongo
├── redis/                # Configurazione Docker Redis
└── postgresql/           # Configurazione Docker Postgres
```

### Aggiungere un Nuovo Agente
1.  Crea un nuovo handler in `src/backend/apis/`.
2.  Definisci la logica dell'agente utilizzando i servizi in `src/core`.
3.  Registra la rotta in `src/backend/routes/routes.ts`.

### Aggiungere un Nuovo Tool
1.  Implementa la logica del tool in `src/backend/tools/`.
2.  Assicurati che implementi l'interfaccia standard per essere "invocabile" dagli agenti LangChain.

---

## 🛠️ Tech Stack

| Categoria | Tecnologie |
| :--- | :--- |
| **Language** | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white) |
| **Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white) |
| **Framework** | ![Express](https://img.shields.io/badge/Express.js-404D59?style=flat-square) |
| **AI Framework** | 🦜️🔗 **LangChain** |
| **Databases** | ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white) ![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white) |
| **DevOps** | ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) |

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **[Apache 2.0](./LICENSE-2.0.txt)**.

---

<p align="center">
  <i>Realizzato con ❤️ dal team di ChainPrompt AI</i>
</p>

---
## 📚 Documentazione del Progetto
- [Vision & Objectives](./docs/objectives.md) - Vision strategica, architettura e obiettivi del progetto.
- [README Alternativo](./docs/README.v2.md) - README alternativo.
- [README Legacy](./docs/README.legacy.md) - Documentazione storica precedente.
