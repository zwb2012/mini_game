---
name: prototype-planner
description: Use when a candidate is approved for validation and the next step is to define the smallest prototype that can confirm or reject the core gameplay loop.
---

# Prototype Planner

## Overview
Design the smallest playable prototype that can test the main loop. The plan must protect the time box and make success or failure observable.

## When to Use
- A candidate was promoted
- A prototype slot is available
- The core loop needs validation

## Required Fields
- validation_goal
- core_hypothesis
- out_of_scope
- core_loop
- time_box
- success_signals
- failure_signals

## Workflow
1. Define the single main question the prototype should answer.
2. Strip away everything that does not help answer it.
3. Describe the playable loop in a few bullets.
4. Lock a 3-7 day time box.
5. End with explicit success and failure signals.

## Output
Write `prototype-plan.md` and nothing else.

## Common Mistakes
- Planning content production instead of validation
- Letting UI polish dominate the scope
- Using vague signals like "feels promising"
