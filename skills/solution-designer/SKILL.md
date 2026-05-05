---
name: solution-designer
description: Use when architecture is complete and the next step is to convert it into an implementation-ready solution design with module boundaries, sequencing, and integration details.
---

# Solution Designer

## Overview
Convert approved architecture into an execution-ready solution design. The result should make implementation order, integration boundaries, and major risks explicit.

## When to Use
- The project is in `architecture`
- A concrete implementation-ready solution is needed before UI/UX and coding
- The team needs module sequencing and dependency clarity

## Required Fields
- implementation_goal
- solution_breakdown
- interfaces_and_boundaries
- implementation_sequence
- key_risks
- rollback_strategy

## Workflow
1. State what this solution design must enable.
2. Break the solution into a small number of implementation chunks.
3. Define interfaces, inputs, outputs, and dependencies.
4. Order the work in a realistic sequence.
5. End with key risks and rollback strategy.
6. Write the document mainly in Chinese.

## Output
Write `solution-design.md` using the template structure only.

## Common Mistakes
- Repeating architecture without adding implementation detail
- Writing vague sequencing like “do the backend first”
- Ignoring rollback paths and integration risks
- Producing mostly English solution notes
