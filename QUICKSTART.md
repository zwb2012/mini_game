# 快速上手

## 适用对象
这份快速上手适合第一次接触这个模板仓库、想尽快理解并试跑一次自动化小游戏流水线的人。

如果你只想知道“怎么最快跑起来”，先看这份文档；如果你想了解完整规则，再去看：
- [`README.md`](README.md)
- [`specs/workflows/automation/operator-guide.md`](specs/workflows/automation/operator-guide.md)
- [`specs/workflows/automation/startup-protocol.md`](specs/workflows/automation/startup-protocol.md)

---

## 一、你能用这套模板做什么
这套模板的目标是帮助你把一个小游戏项目从：

**调研 → 方向选择 → PRD → 架构 → 方案 → UI/UX → 实现 → 测试 → 验收 → 上架准备**

尽量通过统一规则自动推进，并且只在少数人工门禁停住。

默认人工门禁只有 3 个：
1. 方向选择
2. PRD 审批
3. 提审包完成

默认停在：
- `submission_ready`

不会自动执行真实微信提审动作。

P0 第一版内容对应如下：
- `templates/cocos-game-base/`：1 个引擎实现
- `templates/platform-adapters/wechat/`、`templates/platform-adapters/android/`：2 个平台适配器

---

## 二、仓库里最重要的目录
- `skills/`：各阶段技能与总控技能
- `specs/workflows/automation/`：工作流规则、门禁、状态机、启动协议、操作说明
- `specs/_templates/`：所有阶段文档模板
- `portfolio/`：多项目组合层运行文件
- `specs/projects/`：示例项目与真实项目产物目录
- `templates/cocos-game-base/`：P0 引擎实现模板
- `templates/platform-adapters/wechat/`：微信小游戏平台适配器模板
- `templates/platform-adapters/android/`：Android 平台适配器模板

---

## 三、最短上手路径
### Step 1：复制启动模板
复制：
- `specs/_templates/project-request.template.md`
- `specs/_templates/project-state.template.yaml`

到：
- `specs/projects/<slug>/project-request.md`
- `specs/projects/<slug>/state.yaml`

### Step 2：填写项目请求
至少填写：
- 项目名称
- 项目标识
- 产品目标
- 平台
- 时间 / 成本 / 技术约束
- 候选方向池（可选）
- 是否需要系统自动补充候选方向

### Step 3：调用总控入口
建议这样调用：

> 为 `<slug>` 启动自动化产品流水线。请读取 `specs/projects/<slug>/project-request.md` 和 `specs/projects/<slug>/state.yaml`，自动推进到下一个人工门禁，并只输出当前状态、下一步和需要我确认的事项。

### Step 4：在门禁点回复
你只需要在三个门禁点回复：
- 方向选择
- PRD 审批
- 提审包完成

其余阶段默认自动推进。

---

## 四、多项目模式怎么开始
如果你要同时管理多个项目，还需要：
- `portfolio/projects.yaml`
- `portfolio/wip-rules.yaml`
- `portfolio/portfolio-board.md`
- `portfolio/decision-log.md`

推荐流程：
1. 先把多个项目登记到 `portfolio/projects.yaml`
2. 用组合层决定当前主推项目
3. 对主推项目启动单项目流水线
4. 控制高投入阶段的并行数

---

## 五、三个人工门禁怎么回复
### 1. 方向选择
```text
选定方向：家居杂物平衡塔
其他方向处理：保留
备注：优先验证开发成本更低且失败反馈更强的方向
```

### 2. PRD 审批
```text
是否通过：是
备注：保持当前范围，不要提前扩展成长系统
```

### 3. 提审包完成
```text
是否进入 submission_ready：是
是否执行真实提审：否
备注：先停住，我要人工检查素材和账号信息
```

---

## 六、文档语言规则
这套模板默认：
- 所有文档型产物使用中文
- 只有代码、API 名称、字段键名、第三方库名和必要英文术语保留英文

如果产物主体变成英文，应视为未通过当前模板规则。

---

## 七、下一步建议
如果你已经看完快速上手，建议继续看：
1. [`README.md`](README.md)
2. [`specs/workflows/automation/operator-guide.md`](specs/workflows/automation/operator-guide.md)
3. [`specs/workflows/automation/startup-protocol.md`](specs/workflows/automation/startup-protocol.md)
