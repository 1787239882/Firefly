---
title: 基于 Tortoise Git 的 Git 食用指北
published: 2026-06-05
description: 从版本控制基础到 TortoiseGit 图形化操作的全流程指南
tags: [Git, TortoiseGit, 教程, 版本控制]
category: 工具速查
---

## 版本控制工具

### 1.1 版本控制工具是什么？

版本控制系统（Version Control System, VCS）是现代软件开发中不可或缺的工具，用于管理代码的变更历史、协作开发以及恢复历史版本，当然，实际上它也能管理非代码文件。

**当下最主流的 VCS 依然是 Git**，我们所用的工具也是 Git。

常见 VCS 按生态位排列如下：

🔴 一线活跃

- **Git** — 95% 市场份额，全生态。
- **Mercurial (hg)** — Python、Mozilla、Facebook 少数巨型仓；命令接近 Git，Windows 友好。
- **Fossil** — SQLite 官方出品，自带 Wiki/Ticket，适合小团队"一站式"。

🟡 二线维护

- **SVN (Subversion)** — 国内政企、芯片 RTL、大二进制仍大量存在；Apache 基金会持续发版。
- **Perforce Helix Core** — 游戏、影视、芯片（GB 级二进制）主流；云厂商提供 SaaS。
- **Azure DevOps TFVC** — 微软系老项目，新仓已劝退，但 TFS 2019 之前存量大。
- **Plastic SCM** — 游戏、Unreal 生态，被 Unity 收购后改名 Unity Version Control，继续迭代。

🟢 小众存活

- **Pijul** — 理论突破（补丁可交换），Rust 实现，CLI 可用，生态早期。
- **DVC** — 面向 ML 数据集，底层仍用 Git，但给大文件 + 实验跟踪封装。
- **Git-LFS / Git-Annex** — 严格说不是完整 VCS，只是 Git 的大文件插件，常与 Git 并列出现。

⚫ 博物馆级别

- **CVS** — 2008 停更，仅存只读镜像。
- **RCS** — Unix 1970s 产物，单机差分文件，个别老 GNU 项目留档。
- **SourceSafe / VSS** — 微软 2005 年停止销售，2020 官方下载关闭；接手第一件事就是 `vss2git`。

### 1.2 为什么我们要使用它？

以 Git 工具为例对比：

| 场景 | 无 VCS | 有 VCS |
|------|--------|--------|
| 备份旧版本 | 靠 ZIP 或备份文件保存——空间大、多文件夹、管理不便、日志人工维护 | 一条 `git log` 列出所有版本，秒级切换 |
| 多人修改同一文件 | 人工核查修改部分，复制粘贴——费时费力 | 自动合并或提示冲突，记录作者与时间 |
| 线上 bug 回退 | 手动替换成百上千个文件——速度慢、易误操作 | `revert` 一键生成反向补丁，秒级回退 |
| 磁盘损坏/误操作导致代码丢失 | 备份坏了就 GG | 服务器 + 每个开发者本地都有完整备份 |

总之，Git 这样的 VCS 工具还在更多场景带来了巨大价值：

- **审计与追责** — 谁、何时、为何修改，永久留痕。
- **持续集成底座** — 自动化测试、编译、部署都依赖版本号触发。
- **知识沉淀** — 合并请求（MR/PR）与 Code Review 成为团队技术论坛。
- **心理安全感** — 敢于重构、敢于实验，因为"随时可以回去"。

### 1.3 版本控制工具的不同类型

根据系统架构的不同，版本控制系统主要分为三类：本地版本控制系统（Local VCS）、集中式版本控制系统（Centralized VCS, CVCS）和分布式版本控制系统（Distributed VCS, DVCS）。

#### 1.3.1 本地版本控制系统（RCS）

本地版本控制系统（RCS）是最简单的版本控制形式，其核心思想是通过保存文件的补丁集（Patch Set）来记录文件的变更历史。例如，RCS（Revision Control System）是早期最流行的本地版本控制系统。

**工作原理**：RCS 通过保存文件的补丁集来实现版本管理。例如，假设文件的初始版本为 `版本 1`，用户对文件进行了修改，RCS 会记录 `版本 1` 到 `版本 2` 的变更并保存为 `补丁 1`，后续修改继续生成 `补丁 2`、`补丁 3` 等，通过叠加补丁可以恢复到任意历史版本。

```bash
# RCS 示例：记录文件变更
ci -u file.txt       # 将文件 file.txt 提交到 RCS
rcsdiff file.txt     # 查看文件的变更历史
```

**优缺点**：
- 优点：简单易用，适合单人开发。
- 缺点：功能单一，难以支持多人协作开发。

#### 1.3.2 集中式版本控制系统（CVCS）

集中式版本控制系统通过单一的集中服务器来管理代码的变更历史。开发者通过客户端从服务器获取代码或提交变更。例如，SVN（Subversion）是典型的集中式版本控制系统。

**工作原理**：集中服务器的核心是保存项目的完整代码和变更历史，开发者通过客户端从服务器获取最新版本或提交本地修改。

```bash
# SVN 示例：提交和更新代码
svn checkout https://svn.example.com/repo   # 从服务器获取代码
svn commit -m "提交修改"                     # 将本地修改提交到服务器
```

**优缺点**：
- 优点：支持多人协作开发，变更历史集中管理。
- 缺点：单点故障风险高，服务器宕机会导致开发中断；数据丢失风险大。

#### 1.3.3 分布式版本控制系统（DVCS）

分布式版本控制系统通过每个客户端保存完整的代码和变更历史来实现版本管理。例如，Git 是目前最流行的分布式版本控制系统。

**工作原理**：每个客户端保存完整的代码和变更历史。开发者可以在本地提交代码，待网络恢复后再同步到远程服务器。

```bash
# Git 示例：本地提交和远程同步
git init                    # 初始化本地仓库
git add .                   # 将文件添加到暂存区
git commit -m "本地提交"     # 提交到本地仓库
git push origin main        # 将本地提交同步到远程服务器
```

**优缺点**：
- 优点：支持离线开发，每个客户端保存完整备份，数据安全性高。
- 缺点：保密性较差，初始同步数据量大。

#### 1.3.4 各类型 VCS 对比

| 特性 | 本地 VCS（RCS） | 集中式 VCS（CVCS） | 分布式 VCS（DVCS） |
|------|-----------------|-------------------|-------------------|
| 架构 | 单机 | 集中服务器 | 分布式 |
| 多人协作支持 | 低 | 高 | 高 |
| 单点故障风险 | 无 | 高 | 低 |
| 数据安全性 | 低 | 一般 | 高 |
| 保密性 | 高 | 高 | 低 |
| 离线开发支持 | 无 | 无 | 高 |
| 初始同步数据量 | 无 | 小 | 大 |

## 为什么是 Git

### 2.1 Git 与 SVN 的比较

| | Git | SVN |
|:---:|---|:---:|
| 定义 | Linus Torvalds 在 2005 年开发的开源分布式版本控制系统，强调速度和数据完整性。 | Apache 许可证下的开源软件版本控制系统。 |
| 模型类型 | DVCS | CVCS |
| 存储单元 | 按元数据方式存储，体积很小。`.git` 目录是本地克隆版，拥有远程版本库全部内容（标签、分支、版本记录等）。 | 按原始文件存储，体积较大。 |
| 全局版本号 | 无，用 40 位 SHA-1（Git 2.29 起可选 SHA-256）哈希值标记每个 commit。 | 有。 |
| 内容完整性 | 更优，SHA-1 哈希算法确保代码内容完整性，抗磁盘故障和网络问题。 | MD5 算法，有校验而无防篡改。 |
| 版本库 | 可以有无限个版本库。本地仓库可独立提交，等待远程恢复即可。 | 只能有一个指定中央版本库，中央库故障全员瘫痪。 |
| 速度 | 明显快 | 慢 |
| 分支 | 处理简单，同目录快速切换，易发现未合并分支，合并简便。 | 分支只是版本库中的另一个目录，需手动确认是否合并。 |

### 2.2 Git 的优缺点

**优点**：
- 适合分布式开发，强调个体。
- 公共服务器压力和数据量都不会太大。
- 速度快、灵活。
- 任意两个开发者之间可以很容易地解决冲突。
- 离线工作。

**缺点**：
- 中文社区相对较小。
- 学习周期相对较长。
- 代码保密性差，开发者克隆后即可查看全部代码和版本信息。

### 2.3 SVN 的优缺点

**优点**：
- 集中式管理，服务端配置好，客户端同步提交即可，上手容易。
- 服务端统一控制访问权限，安全管理代码。
- 所有代码以服务端为准，代码一致性高。

**缺点**：
- 所有操作需通过服务端同步，服务器性能要求高，宕机则无法提交。
- 分支管理不灵活，svn 分支是完整目录，操作在服务端同步。
- 不是本地化操作，删除分支需同步远程。
- 需要联网。

### 2.4 结论

Git 在泛用性上完胜 SVN 的主要原因有两个：

其一，**效率上**，SVN 每次都需要将代码全量拉到本地，而 Git 只有第一次克隆需要全量（因为 Git 存储单元是元数据，可以增量拉取/推送有改变的部分）。即使第一次克隆，Git 也只需获取文件的元数据然后载入主分支，而 SVN 则需要把每个分支都克隆一次。

其二，**安全上**，尽管 Git 存在每个开发者都能拉取完整代码和日志的泄露风险，但可通过人员培训、权限管理等方式规避；而 SVN 的 MD5 加密算法（无法防篡改）以及单点故障风险则更难忍受——服务器硬盘损坏后若无数据备份则损失不可恢复。此外，SVN 服务器宕机导致全员无法工作，而 Git 开发者仍可本地 commit，待服务器恢复后再同步。

## 使用指南

### 3.1 Git 与 TortoiseGit 的安装

Git 安装教程：[https://blog.csdn.net/mukes/article/details/115693833](https://blog.csdn.net/mukes/article/details/115693833)

关于 TortoiseGit：

Git 原生的操作界面是命令行，而 TortoiseGit 可以在右键菜单栏一键执行 Git 命令；文件图标实时显示"绿勾/红叹/蓝加/黄锁"，无需 `git status` 查看状态；支持中文界面。

下载教程：[https://blog.csdn.net/m0_37467586/article/details/105075965](https://blog.csdn.net/m0_37467586/article/details/105075965)

### 3.2 基础设置

完成后先进入设置界面：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766044830286-c9f97a2d-83d3-4184-b118-f5d0e62e31ad.png)

把常见命令勾上，勾选后右键菜单栏即可直接看到常用命令：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766044873857-bce423c0-a5b0-4b6a-906f-4ed3121eb971.png)

> 如果你的 Windows 右键菜单栏还得 Shift+F10 才能显示更多选项，建议自查解决。

### 3.3 Git 的工作原理

**工作区（workspace）**：当前工作空间，即本地文件夹下看到的文件结构。初始化或 clean 时文件内容与暂存区一致。

**暂存区（index）**：老版本也叫 Cache 区，文件暂时存放的地方。暂存区中的文件将随一次 `commit` 一起提交到本地仓库。

**本地仓库（local repository）**：Git 是分布式版本控制系统，可完全去中心化工作。本地仓库几乎与远程一致，所有离线操作（log、history、commit、diff 等）可在本地完成。

**远程仓库（remote repository）**：中心化仓库，所有人共享。本地仓库与远程仓库交互以同步内容。

![](https://cdn.nlark.com/yuque/0/2023/png/26312635/1703209362600-190ac9c6-2b1f-41a7-b7a7-7c4f5fa8e987.png)

文件颜色代表不同状态：

| 颜色 | 含义 |
|------|------|
| 绿色 | 已加入控制，暂未提交 |
| 红色 | 未加入版本控制 |
| 蓝色 | 已加入、已提交、有改动 |
| 白色 | 已加入、已提交、无改动 |
| 灰色 | 版本控制已忽略文件 |

### 3.4 常见使用

#### 3.4.1 新建仓库并克隆到本地

直接使用右键菜单栏中的 Git Clone：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766045474100-4467ae63-ad72-4ae4-b02a-00f10cbf4b93.png)

点击 OK 等待传输完成后 Done 即可。TortoiseGit 会自动执行 init 等 Git 命令。

各选项说明：

| 选项 | 说明 |
|------|------|
| **Depth（浅克隆）** | 填 1 表示只拉取最新 1 次提交，历史日志不可见。日常开发别用，会导致缺记录。 |
| **Recursive（递归子模块）** | 项目存在 submodule 才用，一般不需勾选。 |
| **Branch** | 指定分支，不填默认 master。 |
| **Clone into Bare Repo** | 日常开发不勾选，勾选后只生成 `.git` 文件夹。 |
| **No Checkout** | 日常开发不勾选，勾选导致只拉取历史但不检出文件，工作区为空。 |
| **Origin Name** | 本地给远程仓库起的"小名"，默认 `origin`。可改为任意单词（如 `gitlab`、`upstream`），只影响本地引用。 |
| **Load Putty Key** | 使用 SSH 时才勾选，HTTPS 不用。 |
| **From SVN Repository** | 不用点，我们的项目不需要从 SVN 拉取。 |

拉取进度：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766058175877-f5335127-b9c0-4047-bfd7-db35cd8780a1.png)

完成后文件出现：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766058431996-8239cddc-bf2d-4d65-8f35-e9a9b2ab8d24.png)

#### 3.4.2 转换分支

克隆下来默认是 master 分支，实际开发应在其他分支进行。

右键 → TortoiseGit → Switch/Checkout：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766046478784-ec1d1280-0b56-4c8e-99e9-e811fba8dcd3.png)

选择目标分支：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766046703823-2f0b2fc0-c369-4ad1-a8fb-bb74cc20b84f.png)

然后 Close 即可，别 Merge：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766059418880-c5cb1c65-5678-4aba-9cc6-5210ef2789c8.png)

#### 3.4.3 拉取与变基

通过右键的 Pull 指令从远程仓库拉取：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766057590597-b8ce6b91-f232-423a-a541-d71151b4a358.png)

设置如图即可。如果拉取后本地有尚未被推送的 commit，会需要变基，按需 Rebase 即可。

> **为什么要变基？** 当我们在开发时，其他人也在开发。当你 commit 后试图推送，会发现远程仓库已不是你拉取时的状态。此时需要变基将本地历史与远程同步，然后再 push。Git 会拒绝不一致的推送。

Rebase 与 Merge 的区别：

![](https://cdn.nlark.com/yuque/0/2023/png/26312635/1703209661813-aa843b95-48fd-4556-8441-5de24ac1ba3e.png)
![](https://cdn.nlark.com/yuque/0/2023/png/26312635/1703209673861-bd55e5b8-c5c6-4cdd-8fd3-71ee3d396410.png)

Merge 是分支的产生与合并，Rebase 则是"插队"，避免频繁产生非必要分叉，不覆盖同事的修改。

#### 3.4.4 提交、恢复与添加

##### Add

储藏，将指定文件提交到缓存区。

##### Commit

将工作区代码提交到本地仓库，产生一条日志。右键菜单中的 Commit 界面如下：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766060268126-2f7a53e3-579a-496e-9129-b1c392b4a774.png)

Message 填写规范：若需求简单，直接粘贴 TAPD 信息；若需求复杂，建议用 `源码关键字/本次提交实现的功能` 的格式分多次提交，不要合并，以便定位问题。

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766063966524-53b22810-b526-43b9-8ad5-3df21ed7bd2c.png)

##### Show Log

查看 commit 日志，可看到改了哪些文件的哪些行，辅助 debug。TortoiseGit 支持 Combine to one 将多条日志合并。

右键 → TortoiseGit → Show Log：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766060382838-8ad695a5-5adc-47dc-b969-145013930dce.png)

可查看所有提交，双击某次提交的文件可看到修改记录：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766060595470-6b70949d-dbb7-4a1c-bdbc-0317ed8b877a.png)

IntelliJ 全家桶也有此功能，但界面相对不直观：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766060711557-c808b2c7-898b-4138-a405-5619aba5cfba.png)

##### Revert

Revert 可撤销某次提交（或某次提交中对某些文件的修改），本身会产生一条日志。可用于快速回滚代码版本和 debug 定位问题，还可以"负负得正"（撤销你的撤销）。

既可 Revert 单次/多次 commit 的所有改动：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766060892947-a10879c2-5dda-4f5f-b03a-f6523321cd1f.png)

也可 Revert 某个文件的改动：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766060971266-446bffcc-f418-4683-95ae-a002f9fd640c.png)

Revert 一条 commit 后：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766061071131-3bfd8137-707e-4f8c-9034-6812f0a5237f.png)

后续 commit 流程同前：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766061104346-4b3eca55-d78b-41fb-8a6f-a82e2bedf9c4.png)

会出现一条新的 commit 日志：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766061197433-a2004adf-88e7-4b2a-9580-733048aaa4d6.png)

同样可 Revert Revert，负负得正：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766061226295-ac7fa385-4648-4552-8206-7e88a818d86e.png)

> Reset 与 Revert 的区别：Reset 不会产生日志，未提交的改动会完全丢失。

##### Combine（合并提交）

可将两次日志合并：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766061314216-e8dffff9-9166-446a-b40b-04baa42da7fc.png)

##### Edit Message

TortoiseGit 中 combine 时可修改 message。另外可通过右键 → Edit note 给 message 添加附注：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766064665913-a1312235-2b9c-4d7d-b11a-79caf7826aed.png)

但该功能只能在 message 下方附一条 note，不能改变 message 本身。如需修改本地未推送的 commit 的 message，可通过 IDEA 的 Git — Show History 实现：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766064838396-c3563a8d-4adc-4830-afa2-ae7a1cfd2d58.png)

#### 3.4.5 推送

commit 完成并自测无误后推送到远程仓库（记得先变基）。

右键 → TortoiseGit → Push：

![](https://cdn.nlark.com/yuque/0/2025/png/38987769/1766049412377-c7607faa-444f-4335-97ba-3809acfab3ab.png)

Options 通常如图设置即可。

#### 3.4.6 摘取（Cherry Pick）

需要把其他分支的提交拿到当前分支时使用摘取。例如把 dev 分支的代码摘取到 release 分支。

1. 在目的分支（release）查看日志：

![](https://cdn.nlark.com/yuque/0/2026/png/60574099/1770617316180-8e1ea1b6-f991-4dfe-b7b1-a7ef731b1a2f.png)

2. 选择要摘取的提交所在的分支：

![](https://cdn.nlark.com/yuque/0/2026/png/60574099/1770617695234-31503537-4695-445f-b5ab-1f00ffd90879.png)

3. 在原分支选定要摘取的提交，右键 → **摘取选定提交**：

![](https://cdn.nlark.com/yuque/0/2026/png/60574099/1770618236219-8b80e70b-6615-4c54-bad4-667859df9bb8.png)

4. 点击继续开始摘取：

![](https://cdn.nlark.com/yuque/0/2026/png/60574099/1770618343486-e7bb37fd-7421-4a2d-aab7-32d0a3605edc.png)

5. 摘取完成：

![](https://cdn.nlark.com/yuque/0/2026/png/60574099/1770619175620-5fc924d5-e215-444a-a513-ed10a97c6672.png)

6. 回到目的分支查看摘取到的提交：

![](https://cdn.nlark.com/yuque/0/2026/png/60574099/1770619816369-7ccd0a90-4e0b-490d-9f70-b35d4aed4ea6.png)

摘取成功，后续可按需推送。

## Git 目录结构

Git 所有的版本和变化都保存在 `.git` 目录（默认不可见）下。工作目录只保存工作环境和未提交的文件变化。如果所有变化均已提交，工作目录中除了 `.git` 目录外的文件都可以删掉。

为了性能、空间、安全和完整性，Git 对 `.git` 文件夹做了优化和算法处理，除个别文件外无法直接浏览其内容。目标文件以 GUID 命名，数据经 zlib 压缩。

`.git` 文件夹分类：

![](https://cdn.nlark.com/yuque/0/2025/jpeg/38987769/1766051667886-7b06f6f2-bd39-438a-bcdf-321b118bc48a.jpeg)
![](https://cdn.nlark.com/yuque/0/2023/png/26312635/1703210087209-5ec43d0d-b0fd-4191-a1f9-fb7b62feb353.png)

| 类别 | 说明 |
|------|------|
| **objects** | 代表文件和更改。可分为 commit、tree 和 blob 类型。 |
| **refs（引用）** | 组织对象的人类可读文件。 |
| **logs（日志）** | 用于快速生成显示给用户的日志。 |
| **config（配置）** | 配置文件（可直接手动修改）。包含作者、文件模式、远程地址等。 |
| **Temp（临时）** | Git 在命令行操作间需要保存的临时信息。 |

- **HEAD**：包含存储库的当前头。默认指向 `refs/heads/master` 或 `refs/heads/main` 等。
- **hooks**：包含 Git 操作前后可运行的脚本示例文件（唯二可手动修改的目录之一，另一个是 config）。
- **objects**：Git 对象，即文件中关于文件、提交等的数据，是 Git 版本管理的底层目录。
- **refs**：存储引用（指针）。`refs/heads` 指向分支，`refs/tags` 指向标签。

## 常见问题

### 1. 合并冲突

**冲突原因**：两个分支都对同一个文件做了更改，合并时 Git 不知道采用哪一个。

**示例**：假设 master 版本为 C0。
1. 小 A 基于 C0 创建 new_branch，改动 `merge.txt`，得到 C2
2. 小 B 在 master 上也改动 `merge.txt`，得到 C1
3. 此时 `git merge` 将 master 与 new_branch 合并，发生冲突

**冲突标记说明**：
- `<<<<<<< HEAD` 和 `=======` 之间：当前分支（HEAD）修改的内容
- `=======` 和 `>>>>>>> branch_name` 之间：要合并过来的分支修改的内容
- 分割线之外：两个分支都未改动的内容

**解决方法**：
1. `git status` 查看冲突文件
2. 编辑冲突文件，解决冲突（记得删除三行分隔线）
3. `git add 冲突文件`
4. `git commit -m "提交信息"`

### 2. 版本回退

| 命令 | 说明 |
|------|------|
| `git revert` | 使用一个新的提交来恢复其他提交所做的更改。 |
| `git restore` | 从暂存区或另一个提交中恢复工作树中的文件，不更新分支。 |
| `git reset` | 在分支中添加或删除提交，更改提交历史记录。 |

### 3. fatal: unable to read tree

**原因**：`.git` 目录中某些文件损坏（可能因磁盘故障等）。

**解决方法**：
1. 尝试 `git fsck` 检查并修复损坏文件
2. 如有远程备份，重新克隆
3. 既修复不成功也没远程备份 → 凉凉

### 4. Updates were rejected because the tip of your current branch is behind

**原因**：本地分支落后于远程分支。

**解决方法**：
1. `git pull` 拉取并合并远程最新更改，再 `git push`
2. 如需覆盖远程：`git push -f`（危险操作，可能导致他人工作丢失）

### 5. 误删 .git/index

**后果**：`git status` 显示所有文件为未跟踪状态。

**解决方法**：
1. 如有远程备份，重新克隆恢复
2. 使用 `git reset` 重建 `.git/index`（先备份已修改文件再执行）

## 更多详见

[https://zsxj.yuque.com/crtffy/ak9qmq/dd7foktx6isrmdln](https://zsxj.yuque.com/crtffy/ak9qmq/dd7foktx6isrmdln)

---

📎 **关联笔记**
- [/posts/git-cheatsheet/](Git常用命令速查) — 命令行 Git 命令大全，与本文的 Tortoise Git 图形化操作互补
