# 测试证据：[Story Title]

> **Story**: `[path to story file]`
> **Story Type**: [Visual/Feel | UI]
> **Date**: [date]
> **Tester**: [who performed the test]
> **Build / Commit**: [version or git hash]

---

## 测试内容

[用一段话描述已验证的功能或行为。包含本证据覆盖的故事验收标准编号。]

**Acceptance criteria covered**: [AC-1, AC-2, AC-3]

---

## 验收标准结果

| # | Criterion (from story) | Result | Notes |
|---|----------------------|--------|-------|
| AC-1 | [exact criterion text] | PASS / FAIL | [任何观察] |
| AC-2 | [exact criterion text] | PASS / FAIL | |
| AC-3 | [exact criterion text] | PASS / FAIL | |

---

## 截图 / 视频

在下方列出所有捕获的证据。将文件存储在与本文档相同的目录中，或存储在 `production/qa/evidence/[story-slug]/` 中。

| # | Filename | What It Shows | Acceptance Criterion |
|---|----------|--------------|----------------------|
| 1 | `[filename.png]` | [可见内容的简要描述] | AC-1 |
| 2 | `[filename.png]` | | AC-2 |

*如果是视频：注明时间戳以及它证明了什么。*

---

## 测试条件

- **Game state at start**: [例如，“fresh save, player at level 1, no items”]
- **Platform / hardware**: [例如，“Windows 11, GTX 1080, 1080p”]
- **Framerate during test**: [例如，“stable 60fps” 或 “~45fps — within budget”]
- **Any special setup required**: [例如，“dev menu used to trigger specific state”]

---

## 观察

[任何值得记录、但没有导致 FAIL 的事项。示例：轻微视觉抖动、负载下掉帧、技术上通过但感觉略有偏差的行为。这些会成为打磨工作的候选项。]

- [Observation 1]
- [Observation 2]

如果没有值得注意的事项：*No significant observations.*

---

## 签署

所有角色都必须签署通过，故事才能通过 `/story-done` 标记为 COMPLETE。
Visual/Feel 故事需要设计师或美术负责人签署。UI 故事需要 UX 负责人或设计师签署。

**Solo developers**: 每个角色的所有签署可以由同一人完成。其意图是有人有意识地审查证据后再标记完成——并不是要求三名不同人员必须参与。

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer (implemented) | | | [ ] Approved |
| Designer / Art Lead / UX Lead | | | [ ] Approved |
| QA Lead | | | [ ] Approved |

**Any sign-off can be marked "Deferred — [reason]"** 如果相关人员不可用。延期签署必须在故事推进到冲刺评审之后前解决。

---

*Template: `.claude/docs/templates/test-evidence.md`*
*Used for: Visual/Feel and UI story type evidence records*
*Location: `production/qa/evidence/[story-slug]-evidence.md`*
