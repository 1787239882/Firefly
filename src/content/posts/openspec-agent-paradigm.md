---
title: OpenSpec-Agent的范式
published: 2026-05-18
description: OpenSpec 规范驱动开发框架的核心流程与 To B 项目中的强约束性、多语言协同、零沟通成本三大优势
tags: [Agent, OpenSpec, AI开发, 范式]
category: AI-Agent
---

OpenSpec 是一种 AI 原生规范驱动开发框架。

- 核心思想：在 Agent 写任何代码之前让开发者和 AI 对"需要构建什么"达成一致，从而提高 AI 辅助编码的可预测性。

---

## 常用命令

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

![](/images/Pasted-image-20260517092853.png)

---

## 三步工作流

### 第一步：定义规范

直接告诉 Claude："帮我用 OpenSpec 语法定义一个用户订单系统的 API 规范。"  
Claude 快速生成 `.openspec.yaml` 文件，OpenSpec 就是"设计图"。

### 第二步：自动化生成

"根据这个规范，生成对应的后端业务逻辑和前端类型。"  
Claude 自动执行 OpenSpec CLI 工具，代码根据规范自动"长"出来。

### 第三步：契约校验

尝试修改违反规范的字段，OpenSpec 校验工具会立刻报错。这种**契约测试**能力确保 AI 跑不出规范划定的红线。

---

## To B 项目三大优势

1. **强约束性** — To B 业务逻辑复杂，OpenSpec 强制先思考模型和边界再写代码
2. **多语言协同** — 一份规范生成全栈 SDK（Java + React + Go）
3. **零沟通成本** — 接口定义即文档，规范是团队唯一的真相

---

## 场景模拟：企业级资源审批系统

1. **架构映射**：告诉 Claude "按 OpenSpec 规范定义资源、角色和多状态流转逻辑" → 生成含 `Security Schemas` 和 `Complex Objects` 的 YAML 规范
2. **多团队协作**：修改审批状态枚举值 → OpenSpec 一键同步更新前端 TypeScript 类型定义
3. **自动化测试契约**：基于规范生成自动化契约测试用例，不符则 CI/CD 无法通过

---

> 整合见 [/posts/agent-notes-index/](Agent 相关笔记)
