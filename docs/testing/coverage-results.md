# Test Coverage Results

## 1️⃣ Backend (solo file con `__tests__`)
```
npm test -- --coverage \
  --collectCoverageFrom='src/backend/**/*.ts' \
  --collectCoverageFrom='!src/backend/**/*.test.ts' \
  --collectCoverageFrom='!src/backend/**/__tests__/**' \
  --collectCoverageFrom='!**/dist/**' \
  --collectCoverageFrom='!**/*.d.ts' \
  --coverageReporters=text-summary
```
```
PASS  src/backend/services/databases/redis/__tests__/redis.service.test.ts
PASS  src/backend/services/databases/mongodb/services/__tests__/agentconfig.service.test.ts
PASS  src/backend/services/databases/mongodb/services/__tests__/promptframework.service.test.ts
PASS  src/backend/services/databases/mongodb/services/__tests__/config.service.test.ts
PASS  src/backend/services/databases/mongodb/services/__tests__/toolregistry.service.test.ts
PASS  src/backend/services/databases/mongodb/services/__tests__/schema.service.test.ts
PASS  src/backend/services/databases/postgresql/__tests__/postgresq.client.test.ts
PASS  src/backend/services/databases/postgresql/__tests__/postgresql.service.test.ts
PASS  src/backend/services/databases/postgresql/__tests__/safepostgres.saver.test.ts
PASS  src/backend/services/databases/mongodb/__tests__/mongodb.client.test.ts
PASS  src/backend/services/databases/redis/__tests__/redis.client.test.ts
PASS  src/backend/middleware/__tests__/error-handler.middleware.test.ts
...
------------------------------- Coverage summary -------------------------------
Statements   : 75.11% ( 951/1266 )
Branches     : 66.66% ( 194/291 )
Functions    : 64.10% ( 150/234 )
Lines        : 75.54% ( 908/1202 )
--------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (80%) not met: 75.11%
Jest: "global" coverage threshold for branches (70%) not met: 66.66%
Jest: "global" coverage threshold for lines (80%) not met: 75.54%
Jest: "global" coverage threshold for functions (70%) not met: 64.10%
Test Suites: 27 passed, 27 total
Tests:       172 passed, 172 total
Time:        9.042 s
Ran all test suites.
```

## 2️⃣ Core (solo file con `__tests__`)
```
npm test -- --coverage \
  --collectCoverageFrom='src/core/**/*.ts' \
  --collectCoverageFrom='!src/core/**/*.test.ts' \
  --collectCoverageFrom='!src/core/**/__tests__/**' \
  --collectCoverageFrom='!**/dist/**' \
  --collectCoverageFrom='!**/*.d.ts' \
  --coverageReporters=text-summary
```
```
PASS  src/core/services/__tests__/llm-embeddings.service.test.ts
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
  --collectCoverageFrom='!**/dist/**' \
  --collectCoverageFrom='!**/*.d.ts' \
  --coverageReporters=text-summary
```
```
PASS  src/backend/controllers/backoffice/__tests__/agentconfig.controller.test.ts
...
------------------------------- Coverage summary -------------------------------
Statements   : 63.57% ( 981/1543 )
Branches     : 58.08% ( 230/396 )
Functions    : 43.16% ( 120/278 )
Lines        : 63.98% ( 940/1469 )
--------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (80%) not met: 63.57%
Jest: "global" coverage threshold for branches (70%) not met: 58.08%
Jest: "global" coverage threshold for lines (80%) not met: 63.98%
Jest: "global" coverage threshold for functions (70%) not met: 43.16%
Test Suites: 15 passed, 15 total
Tests:       87 passed, 87 total
Time:        9.921 s
Ran all test suites.
```

---
*Copy‑and‑paste the command blocks above to run the coverage checks instantly.*
