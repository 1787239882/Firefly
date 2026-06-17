---
title: Agent 相关笔记
published: 2026-05-30
description: Agent 相关笔记整合索引，涵盖 OpenSpec 规范驱动开发、VibeCoding 时代个人优势、Prompt Caching 性能优化与 Token 成本控制等核心主题
image: ../../assets/images/post-covers/agent-notes-index.webp
tags: [Agent, AI, 笔记]
category: AI-Agent
---

# Agent 相关笔记

> 整合：[/posts/openspec-agent-paradigm/](OpenSpec-Agent的范式) · [/posts/cache-hit-rate-for-agent/](Cache命中率对于Agent的重要性) · [/posts/vibecoding-era-needs/](VibeCoding时代，个人的需求在哪) ~~[/posts/knowledge-base-index/](多Agent架构拆分-什么是主什么是子)~~  [/posts/multi-agent-architecture/](多Agent架构详解)

---

## 一、Agent 驱动的开发范式

### 1.1 OpenSpec：规范驱动开发

OpenSpec 是一种 **AI 原生规范驱动开发框架**，核心思想是在 Agent 写任何代码之前，让开发者和 AI 对"需要构建什么"达成一致，从而提高 AI 辅助编码的可预测性。

**核心流程：**

| 步骤 | 操作 | 产出 |
|------|------|------|
| 第一步：定义规范 | 描述需求 → Agent 生成 `.openspec.yaml` | 设计蓝图 |
| 第二步：自动化生成 | 根据规范生成后端逻辑 + 前端类型 | 一致性代码 |
| 第三步：契约校验 | 校验代码是否偏离规范 | 红线约束 |

**常用命令：**

| 命令 | 用途 |
|------|------|
| `openspec init` | 在项目中初始化 OpenSpec |
| `openspec change propose <name>` | 创建变更提案 + 规划产物 |
| `openspec list` | 查看变更列表 |
| `openspec view` | 查看仪表盘 |
| `/opsx:apply` | 实施变更中的任务 |
| `openspec archive <change-name>` | 归档已完成变更 |
| `openspec validate` | 验证变更与规格的一致性 |
| `openspec config` | 更新配置文件 |

**To B 项目中的三大优势：**

1. **强约束性**：强制先思考模型和边界，再写代码
2. **多语言协同**：一份规范生成全栈 SDK（Java + React + Go）
3. **零沟通成本**：接口定义即文档，规范是团队唯一的真相

---

### 1.2 VibeCoding 时代个人的优势

> VibeCoding 定义（2025.02）：不审查不理解，直接 Accept AI 生成的代码。
> 现在的问题是：你对你 Accept 的代码负有主要责任，不能甩锅给 AI。

**五大个人优势：**

| 优势 | 核心观点 |
|------|----------|
| **问题定义** | 模糊需求 → 清晰技术规范 + 边界条件 + 异常处理 |
| **上下文解构** | 知道给什么、不给什么、如何组织；AI 输出上限取决于你的输入 |
| **结果验证** | 代码能跑 ≠ 代码正确；重点验证业务语义、边界、回归影响 |
| **技术决策** | 选型、架构、成本最终由人拍板；AI 是初稿协作者，不是决策者 |
| **成本控制** | 一次交互 5-20W Token；知道何时用大/小模型、如何减少来回次数 |

> AI 做不了的潜台词是：等 AI 能做了，你也就没优势了。
> AI 需要你的潜台词是：只要 AI 还需要人工来驱动，我的优势就还在。

**四种具体策略：**

1. **模型路由** — 轻量化/主力模型按需切换
2. **上下文管理** — 摘要代替全文；无关代码越多生成质量越差（注意力工程）
3. **Prompt 优化** — 一次说清楚，不要不断迭代；重心从 Prompt Engineering → Context Engineering
4. **缓存和复用** — 维护代码模板，Agent 通过 SendMessage 复用已有上下文（热启动）


---

## 二、Agent 性能优化：Prompt Caching

> "Prompt caching is everything." — Claude Code 团队

### 2.1 核心原理

API 缓存基于 **前缀匹配（prefix matching）**——请求开头到每个 `cache_control` 断点之间的内容。命中率是 Agent 产品的关键运营指标，过低时需声明 SEV。

### 2.2 五个关键经验

| # | 原则 | 说明 |
|---|------|------|
| 1 | **前缀匹配** | 前缀任何位置的改动都会使之后所有内容缓存失效 |
| 2 | **消息优于编辑** | 通过消息传递更新信息，不动系统提示词 |
| 3 | **不变工具/模型** | 用工具建模状态转换，用子代理切换模型 |
| 4 | **监控命中率** | 像监控 uptime 一样监控命中率 |
| 5 | **Fork 共享前缀** | 副计算（压缩、总结）必须复用父会话的缓存参数 |

### 2.3 常见缓存破坏行为（避免）

- ❌ 在静态提示词中插入详细时间戳
- ❌ 工具定义以非确定性顺序排列
- ❌ 修改工具参数（如 Agent 可调用的子代理列表）
- ❌ 会话中途切换模型（切换后缓存从头重建，反而更贵）
- ❌ 会话中增删工具（工具定义在缓存前缀中）

### 2.4 正确做法

- **更新信息**：通过 `<system-reminder>` 标签注入下一轮消息，而非修改系统提示词
- **切换模型**：用子代理（Subagent）实现，主 Agent 准备交接消息，子 Agent 执行后续操作
- **工具设计**：所有工具始终存在，用 `EnterPlanMode` / `ExitPlanMode` 这类专用工具建模状态转换
- **工具搜索**：大量工具时发送含 `defer_loading: true` 的轻量桩（stub），前缀保持稳定
- **对话压缩**：Cache-Safe Forking — 使用与父会话完全相同的系统提示词、用户上下文、工具定义，仅追加压缩指令作为最后一条用户消息

### 2.5 TTL 管理

缓存写入后 **5 分钟内有效**。`ScheduleWakeup` 应刻意避开 300 秒整的间隔（刚好过期），选择 270s（保住缓存）或 1200s+（一次过期换长时间等待）。

---

## 三、Token 成本控制

- 一次 Claude Code 交互：5-20W Token
- 完整项目可能超过工程师一月工资

**控制方法：**

- 模型路由：轻量任务用小模型，复杂任务用大模型
- 上下文精简：只给需要的代码，用摘要代替全文
- Prompt 优化：减少来回迭代次数
- 缓存复用：相似任务用模板填充差异，而非每次从零开始
- Agent 复用：通过 SendMessage 复用已有子代理的上下文，避免冷启动

---

## 四、总结

| 主题 | 一句话 |
|------|--------|
| OpenSpec | 规范先行，Agent 在框架内生成代码，确保可预测性 |
| 个人优势 | 问题定义、上下文解构、结果验证、技术决策、成本控制 |
| Prompt Caching | 前缀匹配是一切的基础，命中率是核心运营指标 |
| 成本控制 | 模型路由 + 上下文管理 + 缓存复用 = 可持续的 AI 编程 |
