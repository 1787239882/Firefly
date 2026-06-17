---
title: Git 常用命令速查
published: 2026-06-05
description: Git 命令行高频命令速查表，按场景分类涵盖配置、分支、撤销、远程等十二大类
image: ../../assets/images/post-covers/git-cheatsheet.webp
tags: [Git, 速查, 命令行]
category: 工具速查
---

> 命令行 Git 日常高频命令，按场景分类。
> 图形化工具参见 `基于Tortoise Git的Git食用指北`

---

## 一、配置

```bash
# 用户信息
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"

# 查看配置
git config --list                     # 所有配置
git config --global --list            # 全局配置
git config user.name                  # 查单项

# 别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all --decorate"

# 换行符（macOS/Linux）
git config --global core.autocrlf input
```

---

## 二、基础操作

| 命令 | 说明 |
|------|------|
| `git init` | 初始化仓库 |
| `git clone <url>` | 克隆远程仓库 |
| `git clone <url> <dir>` | 克隆到指定目录 |
| `git status` | 查看工作区状态 |
| `git add <file>` | 暂存文件 |
| `git add .` | 暂存所有变更 |
| `git add -p` | 交互式分块暂存 |
| `git commit -m "msg"` | 提交 |
| `git commit -am "msg"` | 暂存+提交（跳过 add，仅跟踪过的文件） |
| `git commit --amend` | 修改上次提交（消息或内容） |

---

## 三、查看历史

```bash
git log                          # 完整日志
git log --oneline                # 一行一个提交
git log --oneline --graph        # 分支图
git log --oneline -5             # 最近5条
git log --author="name"          # 按作者
git log --since="2024-01-01"     # 按时间
git log -p                       # 显示每次提交的 diff
git log --stat                   # 显示文件变更统计
git log --grep="keyword"         # 按提交信息搜索

git blame <file>                 # 每行谁改的
git show <commit>                # 查看某次提交详情
git show HEAD                    # 查看最新提交
```

---

## 四、分支操作

```bash
git branch                       # 本地分支列表
git branch -r                    # 远程分支列表
git branch -a                    # 所有分支
git branch <name>                # 创建分支
git branch -d <name>             # 删除分支（已合并）
git branch -D <name>             # 强制删除分支
git branch -m <old> <new>        # 重命名分支

git checkout <branch>            # 切换分支
git checkout -b <branch>         # 创建并切换
git switch <branch>              # 切换分支（新版推荐）
git switch -c <branch>           # 创建并切换

git merge <branch>               # 合并分支到当前
git merge --no-ff <branch>       # 禁用快进合并（保留分支历史）

git rebase <branch>              # 变基
git rebase -i HEAD~3             # 交互式变基，修改最近3条提交
```

---

## 五、撤销与回退

```bash
# 工作区
git restore <file>               # 撤销工作区修改（新版）
git checkout -- <file>           # 同上（旧版）

# 暂存区
git restore --staged <file>      # 取消暂存（新版）
git reset HEAD <file>            # 同上（旧版）

# 提交
git reset --soft HEAD~1          # 撤销提交，保留工作区和暂存区
git reset --mixed HEAD~1         # 撤销提交，保留工作区（默认）
git reset --hard HEAD~1          # 彻底回退，丢失所有变更

# 已推送
git revert HEAD                  # 生成一个新提交撤销上次提交（安全）
git revert <commit>              # 撤销指定提交

# 临时保存
git stash                        # 暂存当前工作区
git stash list                   # 查看 stash 列表
git stash pop                    # 恢复并删除
git stash apply                  # 恢复但不删除
git stash drop                   # 删除 stash
git stash save "msg"             # 带备注暂存
```

---

## 六、远程仓库

```bash
git remote -v                    # 查看远程仓库
git remote add origin <url>      # 添加远程仓库
git remote remove origin         # 移除远程
git remote rename old new        # 重命名

git push origin <branch>         # 推送到远程
git push -u origin <branch>      # 推送并设置上游
git push origin --delete <branch> # 删除远程分支
git push --tags                  # 推送标签

git pull                         # 拉取并合并（fetch + merge）
git pull --rebase                # 拉取并变基（推荐）
git fetch                        # 仅拉取，不合并
git fetch --prune                # 拉取并清理已删除的远程分支

# 强制推送（慎用！）
git push --force                 # 强制推送
git push --force-with-lease      # 更安全的强制推送（检查远程是否有新提交）
```

---

## 七、标签

```bash
git tag                          # 列出标签
git tag -l "v1.*"                # 搜索标签
git tag <name>                   # 创建轻量标签
git tag -a <name> -m "msg"       # 创建附注标签
git show <tag>                   # 查看标签详情
git tag -d <name>                # 删除本地标签

# 推送标签
git push origin <tag>            # 推送单个标签
git push origin --tags           # 推送所有标签

# 删除远程标签
git push origin --delete <tag>   # 方式一
git push origin :refs/tags/<tag> # 方式二
```

---

## 八、对比差异

```bash
git diff                         # 工作区 vs 暂存区
git diff --staged                # 暂存区 vs 上次提交
git diff HEAD                    # 工作区 vs 上次提交
git diff <branch1> <branch2>     # 分支间对比
git diff <commit1> <commit2>     # 提交间对比
git diff --stat                  # 只看文件列表和变更数
git diff --word-diff             # 词级别对比
```

---

## 九、子模块

```bash
git submodule add <url> <path>   # 添加子模块
git submodule init               # 初始化子模块配置
git submodule update             # 拉取子模块内容
git submodule update --init --recursive  # 完整初始化（克隆后常用）
git submodule foreach git pull   # 更新所有子模块
```

---

## 十、清理与归档

```bash
git clean -n                     # 预览要删除的未跟踪文件
git clean -f                     # 删除未跟踪文件
git clean -fd                    # 删除未跟踪文件和目录

git archive -o archive.tar HEAD  # 打包当前版本
git gc                           # 垃圾回收，优化仓库
```

---

## 十一、高级技巧

### 交互式暂存
```bash
git add -i                       # 进入交互模式
```

### 二分查找（找 bug）
```bash
git bisect start                 # 开始
git bisect bad                   # 标记当前为坏
git bisect good <commit>         # 标记某次为好
# Git 会二分切换提交，测试后标记 git bisect good/bad
git bisect reset                 # 结束
```

### 查找字符串在哪个提交引入
```bash
git log -S "function_name" --oneline
```

### 查看某个文件的修改历史
```bash
git log --oneline -- <file>
git log -p -- <file>
```

### 将某次提交的更改应用到当前分支（cherry-pick）
```bash
git cherry-pick <commit>         # 捡起某次提交
git cherry-pick <commit1> <commit2>  # 多个
```

### 丢弃本地所有未推送的提交
```bash
git reset --hard origin/<branch>
```

### 最近的主分支
```bash
# 查看默认分支名
git remote show origin | grep HEAD | cut -d' ' -f5
# 或直接
git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'
```

---

## 十二、.gitignore 常用模板

```gitignore
# macOS
.DS_Store
._*
.Spotlight-V100
.Trashes

# Node
node_modules/
npm-debug.log*
.pnpm-store/

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# Build
dist/
build/
*.tsbuildinfo

# Env
.env
.env.local
.env.*.local

# OS
Thumbs.db
Desktop.ini
```

---

> 关联笔记：[/posts/tortoise-git-guide/](基于Tortoise Git的Git食用指北)（图形化 Tortoise Git 操作指南）
