---
name: launch-prep
description: Use when acceptance has passed and the next step is to prepare a Chinese submission package, checklist, and readiness summary without performing the real platform submission action.
---

# Launch Prep

## Overview
Prepare the submission package for the mini-game. The stage ends at `submission_ready`; it does not execute the real WeChat review submission.

## When to Use
- The project is in `acceptance`
- Launch preparation is the next required artifact
- The pipeline must stop at submission package completion

## Required Fields
- submission_materials
- config_checks
- unfinished_items
- submission_ready_judgment
- notes

## Workflow
1. List the required submission materials.
2. Check key configuration items.
3. Name any unfinished items.
4. Decide whether the project has reached `submission_ready`.
5. End with notes about what still requires human action.
6. Write the document mainly in Chinese.

## Output
Write `launch-prep.md` using the template structure only.

## Common Mistakes
- Treating launch prep as the actual submission step
- Hiding missing materials
- Marking submission readiness too early
- Producing mostly English launch-prep notes
