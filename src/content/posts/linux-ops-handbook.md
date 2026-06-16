---
title: Linux运维实战手册
published: 2026-06-15
description: 银行开发必备Linux技能：基础命令、日志分析三板斧、vim操作、生产问题排查（CPU飙高/内存泄漏/磁盘满）
tags: [Linux, 运维, 日志分析, 生产排查, 命令行]
category: 技术成长
---

# 010-Linux运维实战手册

> 回到 [/posts/knowledge-base-index/](总目录)
> 上一篇：[/posts/banking-big-data/](银行大数据中心知识体系)
> 下一篇：[/posts/docker-deployment-guide/](Docker容器化部署指南)

---

## 🖥️ 银行开发必须会的 Linux

银行系统的服务器清一色 Linux（CentOS/Red Hat/麒麟），你开发的 Java 服务跑在上面，出问题得上去查。

> **目标**：能独立登录服务器查日志、看进程、找问题

---

# 📘 Part 1：基础命令（每天都要用）

## 1.1 目录操作

```bash
pwd                     # 我在哪？
ls -la                  # 看当前目录所有文件（含隐藏）
cd /opt/logs            # 去日志目录
cd ..                   # 回上级
cd -                    # 回上一次的目录
mkdir -p /data/app/logs # 递归创建目录
```

## 1.2 文件操作

```bash
# 查看文件
cat app.log             # 看整个文件（小文件用）
less app.log            # 分页看（大文件用）→ 按 q 退出，按 / 搜索
head -100 app.log       # 看前 100 行
tail -100 app.log       # 看后 100 行
tail -f app.log         # 实时追踪（出问题时的"装逼利器"）

# 搜索文件内容
grep "ERROR" app.log                    # 找 ERROR 行
grep -i "error" app.log                # 忽略大小写
grep -c "ERROR" app.log                # 统计 ERROR 行数
grep "2025-06-15" app.log | grep "ERROR"  # 管道：层层过滤
grep -A 5 -B 5 "ERROR" app.log        # 看 ERROR 前后 5 行（定位上下文）
grep -r "BizException" /opt/app/src/   # 递归搜索整个目录

# 搜索文件
find /opt/logs -name "*.log"           # 按文件名找
find /opt/logs -mtime -1               # 最近 1 天修改的
find /opt/logs -size +100M             # 大于 100M 的文件
```

## 1.3 进程管理

```bash
top                     # 实时进程监控（按 1 看每个 CPU，按 q 退出）
ps aux | grep java      # 找 Java 进程
ps -ef | grep java      # 同上，格式不同
kill -15 <pid>          # 优雅停（发 SIGTERM 信号）
kill -9 <pid>           # 强制杀（最后手段！）

jps                     # JDK 自带，只看 Java 进程
jstat -gc <pid> 1000    # 每秒看 GC 情况
jstack <pid>            # 看线程堆栈（排查死锁/线程卡住）
```

## 1.4 磁盘和内存

```bash
df -h                   # 磁盘使用情况
du -sh /opt/logs/*      # 看某个目录大小
free -h                 # 内存使用
```

---

# 📗 Part 2：日志分析三板斧

> 生产出问题，90% 靠日志分析解决。

## 三板斧流程

```
1. tail -f 实时看 → 发现报错
2. grep 精准找   → 定位问题行
3. 上下文分析    → 理解根因
```

## 实战案例

```bash
# 场景1：接口突然报 500
# Step 1: 看最新日志
tail -f /opt/logs/customer-service/app.log

# Step 2: 发现大量 NullPointerException
# Step 3: 搜这个异常
grep "NullPointerException" app.log | tail -20

# Step 4: 找到堆栈，定位到具体类和方法
grep -A 30 "NullPointerException" app.log | head -40

# 场景2：接口响应慢
# 看慢请求日志（假设你们记录了耗时）
grep "costTime" app.log | awk '{if($5>3000) print $0}'  # 找出 > 3秒 的请求

# 场景3：排查某段时间的请求量
grep "2025-06-15 14:" app.log | wc -l  # 14点有多少行日志
```

---

# 📙 Part 3：vi/vim 基本操作

> 服务器上改配置必备，**只要会这 7 个操作就能干活**。

```bash
vi config.yml

# 1. 按 i → 进入编辑模式（左下角出现 -- INSERT --）
# 2. 输入你想改的内容
# 3. 按 Esc → 退出编辑模式
# 4. 输入 :wq → 保存并退出
#    输入 :q! → 不保存强制退出
# 5. 输入 /keyword → 搜索关键字，按 n 跳到下一个

# 快速技巧：
# gg → 跳到文件开头
# G  → 跳到文件末尾
# dd → 删除当前行
# u  → 撤销
```

---

# 📒 Part 4：生产问题实战排查

## 4.1 CPU 飙高

```bash
# 1. 找到 CPU 最高的 Java 线程
top -Hp <pid>

# 2. 把线程 ID 转成 16 进制
printf "%x\n" <thread_id>

# 3. 在 jstack 里搜这个线程在干啥
jstack <pid> | grep -A 20 <hex_thread_id>
```

## 4.2 内存泄漏

```bash
# 1. 导出堆快照
jmap -dump:format=b,file=/tmp/heap.hprof <pid>

# 2. 下载到本地，用 MAT（Eclipse Memory Analyzer）打开分析
# 3. 找占用内存最大的对象，追溯引用链

# 4. 看 GC 情况
jstat -gcutil <pid> 1000  # 每秒输出 GC 各区域占比
```

## 4.3 磁盘满了

```bash
# 1. 看哪个分区满了
df -h

# 2. 看哪个目录最大
du -sh /* 2>/dev/null | sort -rh | head -10

# 3. 大概率是日志目录
du -sh /opt/logs/*
ls -lhS /opt/logs/customer-service/ | head -10

# 4. 清理旧日志（看团队规范，别乱删）
find /opt/logs -name "*.log" -mtime +30 -exec rm {} \;
```

---

## ✅ 日常操作手册速查

| 想干什么 | 命令 |
|---------|------|
| 看服务日志 | `tail -f /opt/logs/xxx/app.log` |
| 搜错误日志 | `grep "ERROR" app.log \| tail -50` |
| 看 Java 进程 | `ps aux \| grep java` 或 `jps` |
| 看 CPU 内存 | `top` |
| 看磁盘空间 | `df -h` |
| 重启服务 | 看团队脚本，通常是 `./restart.sh` 或 `systemctl restart xxx` |
| 看服务端口 | `netstat -tlnp \| grep 8080` |
| 看 GC | `jstat -gc <pid> 1000` |
| 修改配置 | `vi config.yml` → `i` 编辑 → Esc → `:wq` |

---

📎 **关联笔记**
- [/posts/macos-shell-cheatsheet/](macOS Shell命令速查) — macOS 本地终端命令，与 Linux 生产环境命令互补
- [/posts/docker-learning/](Docker学习) — Docker 基础概念速览

> 下一篇：[/posts/docker-deployment-guide/](Docker容器化部署指南) — 把服务跑在容器里
