# Test Infrastructure — 数字连线 (Number Link)

**Engine**: Cocos Creator 3.8.8
**Test Framework**: Jest (TypeScript)
**CI**: `.github/workflows/tests.yml`
**Setup date**: 2026-05-11

## Directory Layout

```
tests/
  unit/           # Isolated unit tests (formulas, state machines, validation)
  integration/    # Cross-system and save/load round-trip tests
  smoke/          # Critical path checklist for /smoke-check gate
  evidence/       # Screenshot logs and manual test sign-off records
```

## Running Tests

```bash
# Run all tests
npx jest

# Run specific system
npx jest tests/unit/step-scoring/

# Run with coverage
npx jest --coverage

# Watch mode (dev)
npx jest --watch
```

## Test Naming

- **Files**: `[system]_[feature].test.ts`
- **Functions**: `test('[scenario] → [expected]', () => { ... })`
- **Example**: `scoring_star_calculation.test.ts` → `test('optimalSteps=12, actualSteps=12 → 3 stars', ...)`

## Story Type → Test Evidence

| Story Type | Required Evidence | Location |
|---|---|---|
| Logic | Automated unit test — must pass | `tests/unit/[system]/` |
| Integration | Integration test OR playtest doc | `tests/integration/[system]/` |
| Visual/Feel | Screenshot + lead sign-off | `tests/evidence/` |
| UI | Manual walkthrough OR interaction test | `tests/evidence/` |
| Config/Data | Smoke check pass | `production/qa/smoke-*.md` |

## Coverage Targets

| System | Minimum | Test Focus |
|--------|---------|------------|
| game-state-machine | 80% | State transitions, illegal guards, destroy lifecycle |
| step-scoring | 80% | Star calculation, threshold boundaries, minimum 1-star |
| level-data-schema | 80% | Schema validation, edge case rejection |
| grid-connection-engine | 70% | Bresenham interpolation, path tracking, undo |
| input-manager | 70% | Coordinate mapping, threshold filter, state guard |

## CI

Tests run automatically on every push to `main` and on every pull request.
A failed test suite blocks merging.
