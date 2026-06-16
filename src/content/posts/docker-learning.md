---
title: Docker学习
published: 2026-05-30
description: Docker 基础概念、核心命令与容器化部署实践指南
tags: [Docker, 容器, 微服务, 教程]
category: 工具速查
---

## 1. 应用场景

- **微服务架构**：每个服务独立容器化，便于管理和扩展
- **CI/CD 流水线**：与 GitLab CI 集成，实现自动化构建和测试
- **开发环境标准化**：新成员一键启动全套依赖服务
- **云原生基础**：Kubernetes 等编排工具基于 Docker 管理容器集群

## 2. 核心概念

轻量化、容器化、镜像化、只读模板，通过分层存储优化空间和构建速度。

## 3. 基本命令

```bash
# 拉取镜像（如官方 Nginx 镜像）
docker pull nginx

# 运行容器（-d 后台运行，-p 映射端口）
docker run -d -p 80:80 nginx

# 查看运行中的容器
docker ps

# 构建镜像（基于当前目录的 Dockerfile）
docker build -t my-app .

# 进入容器内部
docker exec -it <容器ID> /bin/bash
```

## 4. 容器与虚拟机架构对比
![[Pasted image 20260519191804.png)

---

## 关联笔记

- [/posts/docker-deployment-guide/](Docker容器化部署指南) — 银行实战场景下的 Docker 部署指南
- [/posts/build-blog-from-scratch/](搭建个人博客网站从零教程) — 用 Docker Compose 部署博客的完整实践
