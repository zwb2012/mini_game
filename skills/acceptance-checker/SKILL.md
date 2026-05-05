---
name: acceptance-checker
description: Use when testing is complete and the next step is to decide in Chinese whether the project meets the acceptance criteria or must rework before launch preparation.
---

# Acceptance Checker

## Overview
Decide whether the project satisfies its acceptance criteria. The result must compare the agreed standards against actual outcomes and either approve progression or send the project back for rework.

## When to Use
- The project is in `test`
- The pipeline needs an acceptance gate decision
- Launch preparation must not begin without explicit acceptance

## Required Fields
- acceptance_criteria
- actual_results
- pass_or_fail
- rejection_reason
- rollback_recommendation

## Workflow
1. Restate the acceptance criteria.
2. Compare each criterion against actual results.
3. Decide pass or fail explicitly.
4. If failed, explain why and what should be reworked.
5. End with a rollback or next-step recommendation.
6. Write the document mainly in Chinese.

## Output
Write `acceptance.md` using the template structure only.

## Common Mistakes
- Approving based on intuition without checking criteria
- Hiding failed criteria inside long prose
- Starting launch prep before acceptance passes
- Producing mostly English acceptance notes
