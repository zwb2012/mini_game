---
name: prd-writer
description: Use when a game direction is already selected and the next step is to produce a Chinese PRD draft that can pass a human approval gate before architecture work begins.
---

# PRD Writer

## Overview
Write an approval-ready PRD for a selected game direction. The document must define user value, core loop, scope boundaries, risks, and acceptance standards clearly enough for a human PRD gate.

## When to Use
- The project is in `direction_selected`
- A PRD draft is the next required artifact
- The pipeline must stop for PRD approval before continuing

## Required Fields
- target_user
- core_experience_hypothesis
- core_loop
- must_have_scope
- deferred_scope
- acceptance_criteria
- key_risks

## Workflow
1. Name the target user and why this direction should matter to them.
2. Define the core loop in a way that can be implemented and tested.
3. Separate must-have scope from deferred scope.
4. State the main failure conditions and key risks.
5. End with explicit acceptance criteria.
6. Write the document mainly in Chinese.

## Output
Write `prd.md` using the template structure only.

## Common Mistakes
- Writing a high-level concept note instead of an approval-ready PRD
- Mixing must-have and future scope together
- Leaving acceptance criteria vague
- Writing most of the document in English
