---
title: "代码综合实例练习"
published: 2026-06-18
description: "覆盖 Shell、Git、Docker、Redis、ElasticSearch、HBase 的综合代码实例练习册。"
image: ../../assets/images/post-covers/project-practice-collection.webp
tags: ["代码学习笔记", "实例练习", "Git", "Shell", "Docker", "Redis", "ElasticSearch", "HBase"]
category: "项目实践"
---

# 代码综合实例练习

> 本文是 000-代码学习笔记索引 的综合练习册，适合在学完 Git常用命令速查、macOS Shell命令速查、Docker学习、Redis从零到上手、ElasticSearch从零到上手、HBase从零到上手 后动手巩固。

---

## 一、Shell + Git：日志分析小工具

### 练习背景

你接手了一个项目，需要快速统计最近提交情况，并把结果输出成一个简单报告。

### 要求

1. 初始化一个本地 Git 仓库。
2. 创建 `app.log`，写入至少 20 行模拟日志，日志格式包含时间、级别、模块、消息，例如：
   ```text
   2026-06-17 10:01:12 INFO user login success
   2026-06-17 10:02:01 ERROR order create failed
   ```
3. 用 Shell 命令完成：
   - 统计 `ERROR` 出现次数。
   - 统计每个模块出现次数。
   - 取出最近 5 行日志。
   - 将统计结果写入 `report.md`。
4. 使用 Git 提交两次：
   - 第一次提交日志文件。
   - 第二次提交统计报告。
5. 用 `git log --oneline --graph` 查看提交历史。

### 参考命令

```bash
git init
touch app.log

grep -c "ERROR" app.log
awk '{print $4}' app.log | sort | uniq -c | sort -nr
tail -5 app.log

git add app.log
git commit -m "add mock application log"
git add report.md
git commit -m "add log analysis report"
git log --oneline --graph
```

### 验收标准

- [ ] `report.md` 中包含错误数量、模块统计、最近日志。
- [ ] Git 至少有 2 条提交记录。
- [ ] 能解释 `grep`、`awk`、`sort`、`uniq`、`tail` 分别做了什么。

---

## 二、Docker：一键启动 Redis 开发环境

### 练习背景

为了避免污染本机环境，你需要用 Docker 启动一个 Redis，并验证持久化目录挂载是否生效。

### 要求

1. 编写 `docker-compose.yml`，启动 Redis 7。
2. 映射端口 `6379:6379`。
3. 将 Redis 数据目录挂载到当前目录下的 `./data`。
4. 启动后进入 Redis，写入一个 key。
5. 重启容器后确认 key 是否还在。

### 参考配置

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: redis-practice
    ports:
      - "6379:6379"
    volumes:
      - ./data:/data
    command: redis-server --appendonly yes
```

### 参考命令

```bash
docker compose up -d
docker exec -it redis-practice redis-cli

SET practice:docker "hello redis"
GET practice:docker

docker compose restart
docker exec -it redis-practice redis-cli GET practice:docker
```

### 延伸问题

- `--appendonly yes` 对应 Redis 哪种持久化机制？
- 如果删除 `./data` 目录后重启容器，数据还在吗？
- `docker compose down` 和 `docker compose stop` 有什么区别？

---

## 三、Redis：接口限流器

### 练习背景

假设你在写一个登录接口，希望限制同一个用户 60 秒内最多请求 5 次。

### 要求

1. 设计 Redis key，例如：`rate:login:user:1001`。
2. 每次请求时对该 key 执行自增。
3. 第一次请求时设置 60 秒过期时间。
4. 当计数大于 5 时，拒绝请求。
5. 写出 Redis CLI 版流程，再写出伪代码。

### Redis CLI 流程

```bash
INCR rate:login:user:1001
EXPIRE rate:login:user:1001 60
TTL rate:login:user:1001
GET rate:login:user:1001
```

### 伪代码

```java
String key = "rate:login:user:" + userId;
Long count = redis.incr(key);

if (count == 1) {
    redis.expire(key, 60);
}

if (count > 5) {
    return "请求过于频繁";
}

return "允许登录";
```

### 进阶要求

- 思考：`INCR` 和 `EXPIRE` 分两步执行，中间如果程序崩溃会怎样？
- 用 Lua 脚本把 `INCR + 首次 EXPIRE` 做成原子操作。
- 对比固定窗口限流和滑动窗口限流的差异。

---

## 四、ElasticSearch + Redis：商品搜索缓存

### 练习背景

用户搜索商品时，第一次从 ES 查询，后续相同关键词优先从 Redis 缓存读取，减少 ES 压力。

### 要求

1. 在 ES 中创建 `products` 索引。
2. 写入至少 5 条商品数据，字段包含：
   - `name`
   - `category`
   - `price`
   - `stock`
3. 用 `match` 查询商品名，例如搜索“手机”。
4. 将搜索结果 JSON 缓存到 Redis，key 设计为：`search:products:手机`。
5. 第二次搜索时先查 Redis，命中则不查 ES。
6. 给缓存设置 5 分钟过期时间。

### 参考 DSL

```json
GET /products/_search
{
  "query": {
    "match": {
      "name": "手机"
    }
  }
}
```

### 参考 Redis 命令

```bash
SETEX search:products:手机 300 '{"total":2,"items":[{"name":"智能手机"}]}'
GET search:products:手机
TTL search:products:手机
```

### 验收标准

- [ ] 能说清楚为什么 `name` 用 `match`，`category` 用 `term`。
- [ ] 能画出“查 Redis → 未命中查 ES → 回写 Redis”的流程。
- [ ] 能解释缓存过期时间为什么不能太长。

---

## 五、HBase：用户行为表 RowKey 设计

### 练习背景

现在有一张用户行为日志表，需要存储用户浏览、点击、下单等事件。查询场景主要有两个：

1. 查询某个用户最近 7 天的行为。
2. 按天批量扫描所有用户行为用于离线分析。

### 要求

1. 设计 HBase 表名和列族。
2. 设计 RowKey，避免简单自增导致热点。
3. 写出 3 条示例 RowKey。
4. 说明如何做范围扫描。
5. 比较以下两种 RowKey 的优缺点：
   - `userId_timestamp_eventId`
   - `salt_userId_reverseTimestamp_eventId`

### 参考设计

```text
表名：user_behavior
列族：
- info：事件基础信息
- device：设备信息

RowKey：
salt_userId_reverseTimestamp_eventId

示例：
03_U1001_8234698572000_E9001
07_U1001_8234698569000_E9002
12_U2088_8234698560000_E9011
```

### 思考题

- 为什么 `reverseTimestamp` 适合查“最近数据”？
- `salt` 会让写入更均匀，但会给查询带来什么成本？
- 如果主要查询条件变成“按天查所有事件”，RowKey 应该怎么调整？

---

## 六、综合项目：个人博客部署演练

### 练习背景

结合 搭建个人博客网站从零教程，模拟一次从代码管理到容器部署的完整小流程。

### 要求

1. 创建一个静态博客目录：
   ```text
   blog-demo/
   ├── index.html
   ├── about.html
   └── Dockerfile
   ```
2. 用 Git 管理该目录，并提交初始版本。
3. 编写 Dockerfile，使用 Nginx 托管静态页面。
4. 构建镜像并运行容器。
5. 修改 `index.html`，提交第二次版本。
6. 重新构建镜像并验证页面变化。

### 参考 Dockerfile

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
```

### 参考命令

```bash
git init
git add .
git commit -m "init static blog"

docker build -t blog-demo:1.0 .
docker run -d --name blog-demo -p 8080:80 blog-demo:1.0

curl http://localhost:8080

git add index.html
git commit -m "update blog homepage"

docker rm -f blog-demo
docker build -t blog-demo:1.1 .
docker run -d --name blog-demo -p 8080:80 blog-demo:1.1
```

### 验收标准

- [ ] 浏览器或 `curl` 能看到首页内容。
- [ ] Git 至少有 2 条提交。
- [ ] 能解释 Docker 镜像、容器、端口映射分别是什么。
- [ ] 能说明为什么改完 HTML 后需要重新构建镜像。

---

## 推荐练习顺序

1. Shell + Git：先练开发者日常基本功。
2. Docker + Redis：搭建可重复的本地环境。
3. Redis 限流：理解高并发基础场景。
4. ES + Redis：练习搜索与缓存协作。
5. HBase RowKey：训练大数据表设计思维。
6. 博客部署：把 Git、Shell、Docker 串成完整流程。

> [!tip] 练习方法
> 每道题都建议先独立写一版，再回看对应笔记补缺。真正有效的学习，不是“看懂命令”，而是知道什么时候该用哪条命令。
