---
name: candidate-evaluator
description: Use when a project card exists and the next decision is whether the idea is strong enough to deserve a short prototype.
---

# Candidate Evaluator

## Overview
Judge whether a project card deserves prototype time. Prefer cheap validation and reject ideas that are weak, overbuilt, or structurally hostile to ad monetization.

## When to Use
- A project card already exists
- Prototype slots are limited
- The next decision is promote, hold, or reject

## Required Fields
- attraction_judgment
- development_cost_judgment
- ad_fit_judgment
- competition_risk
- decision
- prototype_direction

## Workflow
1. Score attraction in words, not numbers.
2. Judge whether the prototype can fit a short time box.
3. Decide whether ads can fit the loop without destroying it.
4. Name the strongest competitive or repetition risk.
5. End with `promote`, `hold`, or `reject`.

## Output
Write `candidate-review.md` using the template headings only.

## Common Mistakes
- Treating every amusing idea as prototype-worthy
- Ignoring repetitive loops
- Recommending a prototype without a concrete direction
