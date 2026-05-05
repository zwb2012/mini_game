---
name: postmortem-decider
description: Use when an observation or milestone is complete and the next decision must clearly say whether to scale, hold, rework, or kill the project.
---

# Postmortem Decider

## Overview
Make the project decision explicit. Use the evidence on hand, respect time limits, and record whether the developer intentionally overrides the default conclusion.

## When to Use
- An observation round is complete
- A milestone ended
- The portfolio needs a clear next state

## Allowed Decisions
- `scale`
- `hold`
- `rework`
- `kill`

## Workflow
1. State the decision in one word.
2. List the main evidence behind it.
3. Record whether the human is overriding the default recommendation.
4. If overriding, record the reason and the next review date.

## Output
Write `decision-note.md` only.

## Common Mistakes
- Hiding the real decision inside long prose
- Recommending more work without a review date
- Treating every weak project as a rework candidate
