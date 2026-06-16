---
title: Docker容器化部署指南
published: 2026-06-15
description: Docker核心概念与10个必会命令，Dockerfile多阶段构建实战，docker-compose一键编排全套微服务基础设施
tags: [Docker, 容器化, docker-compose, 部署, 运维]
category: 技术成长
---

# 011-Docker容器化部署指南

> 回到 [/posts/knowledge-base-index/](总目录)
> 上一篇：[/posts/linux-ops-handbook/](Linux运维实战手册)
> 下一篇：[/posts/project-practice-collection/](项目实战合集)

---

## 🐳 为什么银行也开始用 Docker？

- 环境一致性："我本地能跑" → 永远不会出现
- 快速部署：秒级启停
- 资源隔离：每个服务跑在独立容器里

> **你只需要学会：镜像、容器、网络、数据卷 + 10 个命令**

---

# 📘 Part 1：核心概念

## 1.1 三个关键概念

```
Dockerfile         镜像（Image）          容器（Container）
  "菜谱"       →     "预制菜"        →     "做好的菜"
  定义怎么构建      构建好的只读包          运行中的实例
```

## 1.2 类比理解

| Docker 概念 | Java 类比 |
|------------|----------|
| Dockerfile | `.java` 源文件 |
| Image | `.class` 字节码（编译产物） |
| Container | JVM 进程（运行中的实例） |
| Registry | Maven 仓库（存镜像的地方） |
| Docker Hub | Maven Central |

---

# 📗 Part 2：10 个必会命令

## 2.1 容器操作

```bash
# 1. 查看运行中的容器
docker ps
docker ps -a  # 包括已停止的

# 2. 启动容器
docker run -d \
  --name customer-service \
  -p 8080:8080 \
  -v /opt/logs:/app/logs \
  -e SPRING_PROFILES_ACTIVE=dev \
  customer-service:1.0.0

# 参数解释：
# -d              后台运行
# --name          容器名字
# -p 宿主机:容器内  端口映射
# -v 宿主机:容器内  挂载数据卷
# -e              环境变量

# 3. 停止/启动/重启
docker stop customer-service
docker start customer-service
docker restart customer-service

# 4. 看日志
docker logs customer-service           # 全部日志
docker logs -f customer-service        # 实时跟踪
docker logs --tail 100 customer-service # 最后 100 行
docker logs --since 10m customer-service # 最近 10 分钟

# 5. 进入容器
docker exec -it customer-service bash   # 进容器里操作
docker exec -it customer-service sh     # 有些镜像只有 sh

# 6. 删除容器
docker rm customer-service              # 删除已停止的
docker rm -f customer-service           # 强制删除（运行中也删）

# 7. 查看容器详情
docker inspect customer-service        # 全部信息（IP、网络、挂载…）
docker stats customer-service          # 实时资源占用
```

## 2.2 镜像操作

```bash
# 查看本地镜像
docker images

# 拉取镜像
docker pull openjdk:11-jre-slim
docker pull redis:7-alpine
docker pull mysql:8.0

# 构建镜像（在 Dockerfile 所在目录执行）
docker build -t customer-service:1.0.0 .

# 删除镜像
docker rmi customer-service:1.0.0

# 给镜像打标签
docker tag customer-service:1.0.0 registry.xwbank.com/customer-service:1.0.0

# 推送到私有仓库
docker push registry.xwbank.com/customer-service:1.0.0
```

---

# 📙 Part 3：Dockerfile 实战

## 3.1 你的 Spring Boot 项目的 Dockerfile

```dockerfile
# ========== 构建阶段 ==========
FROM maven:3.8-openjdk-11 AS builder
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline  # 缓存依赖（加速后续构建）
COPY src ./src
RUN mvn package -DskipTests

# ========== 运行阶段 ==========
FROM openjdk:11-jre-slim
WORKDIR /app

# 创建非 root 用户（安全最佳实践）
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 从构建阶段复制 jar
COPY --from=builder /build/target/customer-service-*.jar app.jar

# 创建日志目录
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

USER appuser

# JVM 参数（生产环境必备）
ENV JAVA_OPTS="-Xms1g -Xmx2g -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/app/logs/"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

## 3.2 .dockerignore 文件

```
# 构建时不把这些打到镜像里
target/
*.log
.git/
.gitignore
.idea/
*.iml
Dockerfile
docker-compose.yml
```

---

# 📒 Part 4：docker-compose 编排

## 4.1 一键启动全套依赖

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ===== MySQL =====
  mysql:
    image: mysql:8.0
    container_name: xwbank-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: xwbank
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  # ===== Redis =====
  redis:
    image: redis:7-alpine
    container_name: xwbank-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass redis123

  # ===== Nacos（单机模式） =====
  nacos:
    image: nacos/nacos-server:v2.2.3
    container_name: xwbank-nacos
    environment:
      - MODE=standalone
    ports:
      - "8848:8848"

  # ===== 你的服务 =====
  customer-service:
    build: ./customer-service
    container_name: customer-service
    ports:
      - "8081:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DB_PASSWORD=root123
      - REDIS_PASSWORD=redis123
    depends_on:
      - mysql
      - redis
      - nacos
    volumes:
      - ./logs/customer:/app/logs

volumes:
  mysql-data:
```

启动：`docker-compose up -d`
停止：`docker-compose down`

---

# 📕 Part 5：网络与数据卷

## 5.1 网络模式

```bash
# 查看所有网络
docker network ls

# 创建自定义网络（推荐：同网络内容器可用容器名互访）
docker network create xwbank-net

# 启动容器时指定网络
docker run -d --name mysql --network xwbank-net mysql:8.0
docker run -d --name app --network xwbank-net customer-service

# 现在 app 容器内可以直接 ping mysql：
# docker exec app ping mysql
```

## 5.2 数据卷

```bash
# 创建数据卷
docker volume create mysql-data

# 挂载数据卷
docker run -v mysql-data:/var/lib/mysql mysql:8.0

# 查看数据卷
docker volume ls
docker volume inspect mysql-data

# 为什么用数据卷？
# - 容器删了数据还在
# - 多个容器共享数据
# - 方便备份
```

---

## ✅ 命令速查卡

```bash
# 每天用的 5 个命令
docker ps                  # 看运行中的容器
docker logs -f <name>      # 看日志
docker restart <name>      # 重启
docker exec -it <name> bash # 进容器
docker-compose up -d       # 启动
```

---

📎 **关联笔记**
- [/posts/docker-learning/](Docker学习) — Docker 基础概念与命令速览（本文的入门前置）

> 下一篇：[/posts/project-practice-collection/](项目实战合集) — 动手做三个项目！
