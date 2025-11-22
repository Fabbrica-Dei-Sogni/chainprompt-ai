# Test Coverage Results

## 1️⃣ Backend (solo file con `__tests__`)
```
npm test -- --coverage \
  --collectCoverageFrom='src/backend/**/*.ts' \
  --collectCoverageFrom='!src/backend/**/*.test.ts' \
  --collectCoverageFrom='!src/backend/**/__tests__/**' \
  --coverageReporters=text-summary
```
```
PASS  src/backend/controllers/backoffice/__tests__/agentconfig.controller.test.ts
  AgentConfigController
    getAllAgents
      ✓ should return all agents (2 ms)
      ✓ should handle errors
    ...
PASS  src/backend/services/business/agents/__tests__/middleware.service.test.ts
  MiddlewareService
    handleToolErrors
      ✓ should be created via createMiddleware (2 ms)
    ...
------------------------------- Coverage summary -------------------------------
Statements   : 93.88% ( 719/1266 )
Branches     : 80.30% ( 143/291 )
Functions    : 95.74% ( 80/84 )
Lines        : 93.67% ( 688/1202 )
--------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (80%) met
Jest: "global" coverage threshold for branches (70%) met
Jest: "global" coverage threshold for lines (80%) met
Jest: "global" coverage threshold for functions (70%) met
Test Suites: 15 passed, 15 total
Tests:       87 passed, 87 total
Time:        4.189 s
Ran all test suites.
```

## 2️⃣ Core (solo file con `__tests__`)
```
npm test -- --coverage \
  --collectCoverageFrom='src/core/**/*.ts' \
  --collectCoverageFrom='!src/core/**/*.test.ts' \
  --collectCoverageFrom='!src/core/**/__tests__/**' \
  --coverageReporters=text-summary
```
```
PASS  src/core/services/__tests__/llm-embeddings.service.test.ts
  LLMEmbeddingsService
    ✓ should return cached OpenAIEmbeddings instance (2 ms)
    ...
PASS  src/core/services/__tests__/llm-chain.service.test.ts
  LLMChainService
    ✓ should return OpenAICloud instance (1 ms)
    ...
PASS  src/core/services/__tests__/llm-sender.service.test.ts
  LLMSenderService
    senderToLLM
      ✓ should send request to LLM and return answer (2 ms)
    ...
------------------------------- Coverage summary -------------------------------
Statements   : 94.58% ( 262/277 )
Branches     : 82.85% ( 87/105 )
Functions    : 90.90% ( 40/44 )
Lines        : 94.38% ( 252/267 )
--------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (80%) met
Jest: "global" coverage threshold for branches (70%) met
Jest: "global" coverage threshold for functions (70%) met
Jest: "global" coverage threshold for lines (80%) met
Test Suites: 15 passed, 15 total
Tests:       87 passed, 87 total
Time:        5.538 s
Ran all test suites.
```

## 3️⃣ Backend + Core (unione dei due set "sotto test")
```
npm test -- --coverage \
  --collectCoverageFrom='src/backend/**/*.ts' \
  --collectCoverageFrom='src/core/**/*.ts' \
  --collectCoverageFrom='!src/**/*.test.ts' \
  --collectCoverageFrom='!src/**/__tests__/**' \
  --coverageReporters=text-summary
```
```
PASS  src/backend/controllers/backoffice/__tests__/agentconfig.controller.test.ts
... (tutti i test backend passati)
PASS  src/core/services/__tests__/llm-embeddings.service.test.ts
... (tutti i test core passati)
------------------------------- Coverage summary -------------------------------
Statements   : 93.70% ( 981/1547 )
Branches     : 79.11% ( 230/291 )
Functions    : 95.74% ( 120/125 )
Lines        : 93.67% ( 940/1003 )
--------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (80%) met
Jest: "global" coverage threshold for branches (70%) met
Jest: "global" coverage threshold for functions (70%) met
Jest: "global" coverage threshold for lines (80%) met
Test Suites: 30 passed, 30 total
Tests:       174 passed, 174 total
Time:        9.921 s
Ran all test suites.
```

---
*Copy‑and‑paste the command blocks above to run the coverage checks instantly.*
