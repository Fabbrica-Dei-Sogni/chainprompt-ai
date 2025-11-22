#!/usr/bin/env sh

MODE="${1:-backend}"

run_coverage_single() {
  local MOD="$1"
  npm test -- --coverage \
    --collectCoverageFrom="src/${MOD}/**/*.ts" \
    --collectCoverageFrom="!src/${MOD}/**/*.test.ts" \
    --collectCoverageFrom="!src/${MOD}/**/__tests__/**" \
    --coverageReporters=text-summary
}

run_coverage_full() {
  npm test -- --coverage \
    --collectCoverageFrom='src/core/**/*.ts' \
    --collectCoverageFrom='!src/core/**/*.test.ts' \
    --collectCoverageFrom='!src/core/**/__tests__/**' \
    --collectCoverageFrom='src/backend/**/*.ts' \
    --collectCoverageFrom='!src/backend/**/*.test.ts' \
    --collectCoverageFrom='!src/backend/**/__tests__/**' \
    --coverageReporters=text-summary
}

case "$MODE" in
  backend)
    run_coverage_single backend
    echo
    echo "=== RISULTATI COVERAGE Backend ==="
    ;;
  core)
    run_coverage_single core
    echo
    echo "=== RISULTATI COVERAGE Core ==="
    ;;
  full)
    run_coverage_full
    echo
    echo "=== RISULTATI COVERAGE Intera Applicazione ==="
    ;;
  ""|*)
    echo "Usa: $0 [backend|core|full]"
    exit 1
    ;;
esac
