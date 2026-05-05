---
name: launch-observer
description: Use when a mini-game is live and the next job is to summarize early user, monetization, and retention signals into a short observation document.
---

# Launch Observer

## Overview
Summarize early live signals without jumping straight into a rebuild. The goal is to produce a short observation card that the decision skill can act on.

## When to Use
- A version is live
- The observation window is open
- Signals need to be summarized before a portfolio decision

## Required Fields
- observation_window
- user_feedback_summary
- key_metrics_summary
- ad_summary
- biggest_problem
- recommended_action

## Workflow
1. Separate user understanding, replay, and monetization signals.
2. Summarize only the strongest evidence.
3. Name the single biggest current problem.
4. End with one recommended next action.

## Output
Write `live-observation.md` and avoid solution sprawl.

## Common Mistakes
- Mixing raw data dumps with interpretation
- Listing many problems instead of the main one
- Making portfolio decisions inside the observation step
