---
name: candidate-scout
description: Use when raw game ideas are sitting in the idea pool and the system needs to turn one idea into a structured candidate intake artifact before scoring.
---

# Candidate Scout

## Overview
把原始方向从 `idea-pool.yaml` 中取出，扩成结构化候选卡。目标是补齐可比较信息，而不是直接做最终推荐。

## When to Use
- 某个想法仍停留在原始方向池中
- 需要进入候选 intake 阶段
- 系统准备把原始方向转成可评分候选

## Required Fields
- idea_id
- candidate_name
- one_sentence_concept
- target_user
- gameplay_loop
- monetization_fit_guess
- initial_risks
- dedup_status

## Workflow
1. 从 `idea-pool.yaml` 读取一个原始方向。
2. 检查是否与已有候选重复。
3. 补齐目标用户、玩法骨架、初始风险和变现适配直觉。
4. 写出 `candidate-intake.md` 和 `candidate-intake.meta.yaml`。
5. 不直接做最终 `promote / hold / reject` 判断。
6. 正文默认使用中文。

## Output
- `candidate-intake.md`
- `candidate-intake.meta.yaml`

## Common Mistakes
- 直接把一句话想法推进到正式项目层
- 在 intake 阶段就下最终结论
- 不做重复检测
