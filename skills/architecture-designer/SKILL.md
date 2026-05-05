---
name: architecture-designer
description: Use when a PRD is approved and the next step is to define a technical architecture in Chinese before detailed solution design begins.
---

# Architecture Designer

## Overview
Turn an approved PRD into a technical architecture. The goal is to define modules, state, dependencies, and technical constraints clearly enough to support the next solution-design phase.

## When to Use
- The project is in `prd_approved`
- Architecture is the next required stage artifact
- The implementation should not begin without system boundaries

## Required Fields
- architecture_goal
- constraints
- module_breakdown
- data_and_state_flow
- technical_decisions
- key_risks

## Workflow
1. Restate the architecture goal and the most important constraints.
2. Break the system into clear modules.
3. Describe the main state and data flows.
4. Record the most important technical decisions and why they were made.
5. End with the key technical and performance risks.
6. Write the document mainly in Chinese.

## Output
Write `architecture.md` using the template structure only.

## Common Mistakes
- Writing implementation tasks instead of architecture
- Hiding module boundaries
- Ignoring runtime constraints for mini-games
- Producing mostly English technical notes
