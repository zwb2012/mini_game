---
name: test-orchestrator
description: Use when implementation work is ready for verification and the next step is to summarize Chinese test results, failures, blockers, and whether the project may proceed to acceptance.
---

# Test Orchestrator

## Overview
Run the testing stage as a structured gate. The result should summarize what was tested, what passed, what failed, what is blocked, and whether the project may move to acceptance.

## When to Use
- The project is in `implementation`
- A test report is required before acceptance
- The pipeline needs a clear pass/fail test gate

## Required Fields
- test_scope
- passed_items
- failed_items
- blockers
- acceptance_recommendation

## Workflow
1. State the test scope.
2. Record passed items clearly.
3. Record failed items clearly.
4. Record blockers separately from normal failures.
5. End with whether the project may enter acceptance.
6. Write the document mainly in Chinese.

## Output
Write `test-report.md` using the template structure only.

## Common Mistakes
- Mixing bugs, blockers, and observations together
- Saying “looks good” without explicit pass/fail outcomes
- Allowing acceptance without a clear recommendation
- Producing mostly English test notes
