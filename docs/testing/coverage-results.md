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
PASS  src/backend/controllers/backoffice/__tests__/agentconfig.controller.test.ts
...
------------------------------- Coverage summary -------------------------------
Statements   : 56.79% ( 719/1266 )
Branches     : 49.14% ( 143/291 )
Functions    : 95.23% ( 80/84 )
Lines        : 57.23% ( 688/1202 )
--------------------------------------------------------------------------
Jest: "global" coverage threshold for statements (80%) not met: 56.79%
Jest: "global" coverage threshold for branches (70%) not met: 49.14%
Jest: "global" coverage threshold for lines (80%) not met: 57.23%
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
