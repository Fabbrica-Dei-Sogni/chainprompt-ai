# chainprompt-ai
## this readme is realized togheter mr. chat

Lightweight orchestration platform for LLM agents, prompt datasets and tools.  
Designed to run locally or in containers and to be extended with new agents, tools and datasets.

## Quick summary
- Purpose: orchestrate LLM-driven agents (chains, tools, subagents) and persist data for analysis.
- Stack: Node.js (TypeScript), Express, MongoDB, Redis, PostgreSQL, Docker.
- Key areas: backend APIs, LLM orchestration services, tools, datasets, DB adapters.

---

## Getting started (local / dev)

Prerequisites
- Node.js (>=16)
- npm / yarn
- Docker & docker-compose (for DB services)

1. Copy/select environment
   - Inspect `.env.dev`, `.env.collaudo`, `.env.release` and create `.env` as appropriate.

2. Start databases (examples)
   - MongoDB:
     ```
     cd mongodb && docker-compose up -d
     ```
   - Redis:
     ```
     cd redis && docker-compose up -d
     ```
   - PostgreSQL:
     ```
     cd postgresql && docker-compose up -d
     ```
   - Check `mongo-init/init.js` for DB initialization logic.

3. Install dependencies
   ```
   npm ci
   ```

4. Run the backend
   - Check `package.json` scripts. Common options:
     ```
     npm run dev     # if present for development
     npm start       # production-like run
     ```
   - Or use provided helpers:
     ```
     ./avvia.sh
     ./entry-point.sh
     ```
   - Use `./stop.sh` to stop helper-run services.

5. Tests
   ```
   npm test
   ```
   (jest configured via `jest.config.cjs`)

---

## Script package.json

-    `publish:nexus`: "npm publish",
-    `clean`: "rimraf dist",
-    `build`: "tsc",
-    `start:prod`: "node dist/server.js",
-    `start`: "node --no-warnings=ExperimentalWarning --loader ts-node/esm  src/backend/server.ts ./tsconfig.json",
-    `start-dev`: "nodemon --exec node --inspect=0.0.0.0:9229 --no-warnings=ExperimentalWarning --loader ts-node/esm  src/backend/server.ts ./tsconfig.json",
-    `test`:jest,
-    `release`: "npm version $npm_config_versione -m 'Rilasciata una nuova release backend' && git push",
-    `patch`: "npm version patch -m 'Rilasciata una nuova patch backend' && git push"


## Architecture overview

- `src/backend/server.ts` — Express app entry. Important: middleware ordering matters (e.g. threat logging middleware must be first).
- `src/backend/apis/*` — HTTP handlers / agent endpoints (examples: `agentbot.ts`, `chainbot.ts`, `threatintel.ts`).
- `src/backend/services/*` — Business logic and DB adapters; look at `databases/{mongodb,postgresql,redis}` for connectors.
- `core/services/*` — LLM orchestration: `llm-agent.service.ts`, `llm-chain.service.ts`, `llm-embeddings.service.ts`.
- `src/backend/tools/*` — Reusable tools callable by agents (e.g. `cybersecurityapi.tool.ts`, `scraping.tool.ts`).
- `src/backend/datasets/*` — Prompt libraries and dataset files used by agents.
- `proxy/chainprompt.conf` — Nginx proxy example for routing front door / reverse proxy behavior.
- `plugins/` — front-end / browser plugin files and styles.

---

## Project conventions & tips

- Config driven: most lists (providers, endpoints, patterns) are configured via `.env.*`; inspect those files before changing code.
- DB access centralised: use services in `src/backend/services/databases/*` instead of direct model usage.
- Tools are stateless modules under `src/backend/tools/` and should be callable by handlers and agents.
- Datasets are stored under `src/backend/datasets/*` as filesystem resources; reader services handle loading.
- Debugging: VSCode launch config available in `.vscode/launch.json`.
- Docker images: use `Dockerfile`, `Dockerfile.release` and `entry-point.sh` for containerized runs.

---

## Common developer workflows

- Add an API route: create handler in `src/backend/apis/`, register in `src/backend/server.ts` or `src/backend/routes/routes.ts`.
- Add a tool: implement under `src/backend/tools/` and expose via agent handler.
- Add dataset: place files in `src/backend/datasets/<your-dataset>/` and use `filesystem.service.ts` / `reader-prompt.service.ts`.
- Run unit tests with Jest: `npm test` (see `jest.config.cjs`).

---

## Deployment & Docker

- For local/dev, start DB containers in each `mongodb/`, `redis/`, `postgresql/` folder via `docker-compose`.
- For production, build image with `Dockerfile.release` and use your container orchestration.
- `proxy/chainprompt.conf` is an example Nginx config—adjust for your domain and TLS.

---

## Where to look first (developer checklist)

1. `src/backend/server.ts` — middleware order, boot sequence.
2. `src/backend/apis/chainbot.ts` & `agentbot.ts` — examples of agent endpoints.
3. `core/services/llm-agent.service.ts` & `llm-chain.service.ts` — LLM orchestration core.
4. `src/backend/services/databases/mongodb` — DB models and queries.
5. `src/backend/tools/*` — pattern for adding new capabilities.
6. `.env.dev` / `.env.collaudo` — environment-driven behavior.

---

If you want, I can:
- generate a checklist of files to modify when adding a new agent/tool,
- produce a minimal `npm` script set to add to `package.json`,
- or draft a CONTRIBUTING.md based on these conventions.

Feedback? Tell me which of the above sections you want expanded or adjusted.

## Contributi
Siamo aperti ai contributi! Se desideri contribuire a questo progetto, ti preghiamo di aprire una nuova issue o inviare una pull request.
Quello che è scritto sopra in inglese è stato generato da mr chat e non ho voglia di tradurlo in italiano :)


## Come è nato il progetto ChainPrompt

Il progetto è nato dalla consultazione di questo link
https://javascript.plainenglish.io/embarking-on-the-ai-adventure-introduction-to-langchain-and-node-js-7393b6364f3a

consulta anche le prime documentazioni sul progetto README.legacy.md
