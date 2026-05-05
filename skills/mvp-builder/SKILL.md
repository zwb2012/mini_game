---
name: mvp-builder
description: Use when a prototype has proven the core loop and the next step is to define the smallest launchable version with ads, instrumentation, and review constraints.
---

# MVP Builder

## Overview
Convert a validated prototype into the smallest version worth shipping. Protect launch scope, separate must-have work from later work, and keep ad fit and review readiness visible.

## When to Use
- Prototype signals are good enough
- A launchable version is the next goal
- Scope pressure is rising

## Required Fields
- must_have
- defer
- ad_points
- instrumentation
- performance_constraints
- review_checks

## Workflow
1. Keep only features required for a coherent first release.
2. Move nice-to-have work into `defer`.
3. Name ad points without over-designing them.
4. List the minimum instrumentation needed for post-launch decisions.
5. End with performance and review checks.

## Output
Write `mvp-brief.md` using template headings only.

## Common Mistakes
- Smuggling polish into the launch scope
- Treating ad design as an afterthought
- Forgetting review and performance constraints
