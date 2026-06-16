---
title: MySQL从入门到SQL优化实战
published: 2026-06-15
description: 从表设计三大范式到索引原理、Explain执行计划分析、SQL优化实战、事务与MVCC机制的完整MySQL指南
tags: [MySQL, SQL优化, 索引, 事务, MVCC, Explain]
category: 技术成长
---

# 005-MySQL从入门到SQL优化实战

> 回到 [/posts/banking-guide-index/](总目录)
> 上一篇：[/posts/java-multithreading-jvm/](Java多线程与JVM深度指南)
> 下一篇：[/posts/redis-practical-guide/](Redis数据结构与实战场景)

---

## 🗺️ 学习路线

```
表设计 → 索引原理 → Explain分析 → SQL优化 → 事务/MVCC → 锁
↑第1-2天  ↑第3-4天    ↑第5-6天     ↑第7-8天   ↑第9-10天  ↑第11-12天
```

> 💡 MySQL 是银行开发最重要的技能之一。银行系统里 SQL 写不好 = 接口慢 = 生产事故。

---

# 📘 Part 1：表设计 —— 第 1-2 天

## 1.1 三大范式

### 第一范式（1NF）：列不可再分

```sql
-- ❌ 错误：一个字段存多个值
CREATE TABLE customer (
    id INT,
    phone_numbers VARCHAR(200)  -- "13800138000,13900139000"
);

-- ✅ 正确：拆成多行或多列
CREATE TABLE customer_phone (
    customer_id INT,
    phone_number VARCHAR(20)
);
```

### 第二范式（2NF）：非主键列完全依赖主键

```sql
-- ❌ 错误：课程名称只依赖课程ID，不依赖学生ID（部分依赖）
-- 成绩表：student_id + course_id → score, course_name
-- 但 course_name 只依赖 course_id

-- ✅ 正确：拆成学生表、课程表、成绩表
CREATE TABLE course (course_id INT PRIMARY KEY, course_name VARCHAR(50));
CREATE TABLE score (student_id INT, course_id INT, score DECIMAL(5,2));
```

### 第三范式（3NF）：非主键列不传递依赖

```sql
-- ❌ 错误：系主任依赖系名，系名依赖学号（传递依赖）
-- student: id → dept_name → dept_head

-- ✅ 正确：拆出系表
CREATE TABLE department (id INT PRIMARY KEY, name VARCHAR(50), head VARCHAR(20));
CREATE TABLE student (id INT PRIMARY KEY, dept_id INT);
```

### ⚠️ 银行实战提醒

银行系统不完全遵守范式，**允许适度冗余**：
- 客户姓名在多张表里冗余存（避免频繁 JOIN）
- 部分汇总表做宽表设计（ADS 层就是反范式的）

---

## 1.2 字段类型选择

| 场景 | 推荐类型 | 为什么 |
|------|---------|--------|
| 主键/自增ID | `BIGINT` | 别用 INT，迟早溢出 |
| 金额 | `DECIMAL(18,2)` | **绝对不能用 FLOAT/DOUBLE** |
| 状态标识 | `TINYINT` 或 `VARCHAR(2)` | 配合枚举注释 |
| 日期时间 | `DATETIME` | 比 TIMESTAMP 范围大 |
| 长文本 | `TEXT` | 超过 500 字符就别用 VARCHAR |
| 定长字符串 | `CHAR(N)` | 比如身份证号、手机号 |
| 变长字符串 | `VARCHAR(N)` | 姓名、地址等 |

### 银行金额字段铁律

```sql
-- ✅ 永远这样定义金额字段
amount DECIMAL(18,2) NOT NULL DEFAULT 0.00 COMMENT '金额'

-- ❌ 永远别这样
amount FLOAT          -- 精度丢失！0.1+0.2 != 0.3
amount DOUBLE         -- 同上
amount BIGINT         -- 没有小数点
```

---

# 📗 Part 2：索引 —— 第 3-4 天

## 2.1 索引是什么（三句话讲清楚）

1. **没有索引**：MySQL 逐行扫描 1000 万行找到你要的 1 行（全表扫描）
2. **有索引**：MySQL 通过 B+ 树跳转 3-4 次就找到了（索引查找）
3. **类比**：索引 = 书的目录。没有目录你只能一页页翻

## 2.2 索引类型速查

```sql
-- 1. 主键索引（PRIMARY KEY）—— 自动创建
CREATE TABLE account (
    id BIGINT PRIMARY KEY,  -- 这就是主键索引
    account_no VARCHAR(32)
);

-- 2. 唯一索引（UNIQUE）—— 值不能重复
CREATE UNIQUE INDEX idx_account_no ON account(account_no);

-- 3. 普通索引 —— 加速查询
CREATE INDEX idx_customer_id ON account(customer_id);

-- 4. 联合索引 —— 多列组合（最常用）
CREATE INDEX idx_customer_status ON account(customer_id, status);

-- 5. 全文索引 —— 模糊搜索（一般用 ES 替代）
```

## 2.3 联合索引的"最左前缀法则"

> ⭐ **这是面试和实战中最爱考的**

```sql
-- 创建一个联合索引
CREATE INDEX idx_a_b_c ON t_order(a, b, c);

-- ✅ 能用上索引（符合最左前缀）
SELECT * FROM t_order WHERE a = 1;
SELECT * FROM t_order WHERE a = 1 AND b = 2;
SELECT * FROM t_order WHERE a = 1 AND b = 2 AND c = 3;
SELECT * FROM t_order WHERE a = 1 AND c = 3;  -- 部分用到（只用 a 列索引）

-- ❌ 用不上索引
SELECT * FROM t_order WHERE b = 2;            -- 跳过了 a
SELECT * FROM t_order WHERE c = 3;            -- 跳过了 a, b
SELECT * FROM t_order WHERE b = 2 AND c = 3;  -- 跳过了 a
```

**记忆口诀**：联合索引是排队，跳过排头全白费。

## 2.4 覆盖索引

```sql
-- 假设有索引 idx_name_age(name, age)

-- ✅ 覆盖索引：SQL 只需要查 name 和 age，索引里就有
SELECT name, age FROM customer WHERE name = '张三';

-- ❌ 非覆盖：还需要 phone 字段，要去主键索引回表查
SELECT name, age, phone FROM customer WHERE name = '张三';
```

**技巧**：查询时尽量只 SELECT 你需要的列，不要 `SELECT *`

---

# 📙 Part 3：Explain 执行计划 —— 第 5-6 天

## 3.1 只要看这 5 个字段

```sql
EXPLAIN SELECT * FROM t_order WHERE customer_id = 12345;
```

| 字段 | 看什么 | 好坏标准 |
|------|--------|---------|
| **type** | 访问类型 | `ALL`（全表）❌ → `index` → `range` → `ref` → `const` ⭐ |
| **key** | 用了哪个索引 | 不是 NULL 就好，是你建的索引更好 |
| **rows** | 扫描行数 | 越小越好，几十万就危险了 |
| **Extra** | 额外信息 | `Using filesort` ❌ `Using temporary` ❌ `Using index` ✅ |
| **key_len** | 索引用了多长 | 联合索引时判断用了几个字段 |

## 3.2 type 字段详解（从好到差）

```
const  >  eq_ref  >  ref  >  range  >  index  >  ALL
 主键      联表       普通     范围     全索引   全表
 查1行    查1行      索引     扫描     扫描     扫描
 ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐    ⭐⭐⭐    ⭐⭐     ⭐       ❌
```

### 实操示例

```sql
-- ALL（全表扫描）—— 最差
EXPLAIN SELECT * FROM t_order WHERE amount > 100;
-- type: ALL  rows: 5000000

-- 加索引后
CREATE INDEX idx_amount ON t_order(amount);

-- range（范围扫描）—— 还行
EXPLAIN SELECT * FROM t_order WHERE amount > 100;
-- type: range  rows: 5000  key: idx_amount

-- ref（非唯一索引查找）—— 很好
EXPLAIN SELECT * FROM t_order WHERE customer_id = 12345;
-- type: ref  rows: 10  key: idx_customer_id

-- const（主键查）—— 完美
EXPLAIN SELECT * FROM t_order WHERE id = 999;
-- type: const  rows: 1  key: PRIMARY
```

## 3.3 Extra 字段解读

| 值 | 含义 | 是好是坏 |
|----|------|---------|
| `Using index` | 覆盖索引，不用回表 | ✅ 最好 |
| `Using where` | 使用了 WHERE 过滤 | ✅ 正常 |
| `Using index condition` | 索引下推（ICP优化） | ✅ 不错 |
| `Using filesort` | 额外排序操作 | ⚠️ 需要优化 |
| `Using temporary` | 用了临时表 | ❌ 必须优化 |

---

# 📒 Part 4：SQL 优化实战 —— 第 7-8 天

## 4.1 慢查询定位

```sql
-- 1. 打开慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 超过 1 秒就算慢查询

-- 2. 查看最慢的 10 条 SQL
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- 3. 或者在命令行查慢查询日志
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log
```

## 4.2 常见优化模式

### 模式1：LIMIT 优化（大偏移量分页）

```sql
-- ❌ 慢：OFFSET 1000000 表示 MySQL 还是要扫描前 100 万行
SELECT * FROM t_order ORDER BY id LIMIT 1000000, 20;

-- ✅ 快：用主键 > 上次最大ID 的方式（游标分页）
SELECT * FROM t_order WHERE id > 1000000 ORDER BY id LIMIT 20;
```

### 模式2：WHERE 条件优化

```sql
-- ❌ 慢：函数用在字段上导致索引失效
SELECT * FROM t_order WHERE DATE(create_time) = '2025-06-15';

-- ✅ 快：用范围查询
SELECT * FROM t_order WHERE create_time >= '2025-06-15 00:00:00'
                        AND create_time < '2025-06-16 00:00:00';
```

### 模式3：JOIN 优化

```sql
-- ❌ 慢：大表 JOIN 大表
-- ✅ 快：小表驱动大表、先过滤再 JOIN

-- 先过滤再 JOIN
SELECT o.*, c.name
FROM t_order o
JOIN customer c ON o.customer_id = c.id
WHERE o.status = 'ACTIVE'        -- 先在 o 上过滤
  AND o.create_time > '2025-01-01';  -- 再减少数据量
```

### 模式4：避免 SELECT *

```sql
-- ❌ 全字段返回，网络传输大，无法用覆盖索引
SELECT * FROM customer WHERE id = 1;

-- ✅ 只要需要的字段
SELECT id, name, phone FROM customer WHERE id = 1;
```

---

# 📕 Part 5：事务与 MVCC —— 第 9-10 天

## 5.1 事务四大特性（ACID）

| 特性 | 含义 | 银行场景 |
|------|------|---------|
| **A**tomicity 原子性 | 要么全成功，要么全回滚 | 转账：A 扣钱 B 加钱必须同时 |
| **C**onsistency 一致性 | 事务前后数据一致 | 余额不能为负 |
| **I**solation 隔离性 | 事务间互不干扰 | 两人同时取钱不能超取 |
| **D**urability 持久性 | 提交了就永久保存 | 存了就不能丢 |

## 5.2 隔离级别

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;

-- 银行一般用 READ-COMMITTED 或 REPEATABLE-READ（MySQL默认）
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 银行常用？ |
|---------|------|-----------|------|-----------|
| READ-UNCOMMITTED | ❌ | ❌ | ❌ | ❌ 绝对不用 |
| READ-COMMITTED | ✅ | ❌ | ❌ | ✅ 常用 |
| REPEATABLE-READ | ✅ | ✅ | 部分✅ | ✅ MySQL默认 |
| SERIALIZABLE | ✅ | ✅ | ✅ | ❌ 太慢 |

## 5.3 MVCC 核心理解

> MVCC = 每行数据有多个版本，每个事务看到自己应该看到的那个版本

```
时间线：        T1           T2           T3
事务A:    begin —— 读name=张三 —— 读name=张三 —— commit
事务B:              update name=李四 —— commit
                     ↑ 事务A还读到张三，因为 MVCC 给了旧版本
```

---

## ✅ 检查清单

### 表设计
- [ ] 能判断一个表设计是否符合三大范式
- [ ] 知道金额字段必须用 DECIMAL
- [ ] 能合理定义每个字段的类型和长度

### 索引
- [ ] 能解释联合索引的最左前缀法则
- [ ] 知道覆盖索引是什么
- [ ] 能看 Explain 结果判断索引用了没有

### SQL 优化
- [ ] 能写出 Explain 并解读 type、key、rows、Extra
- [ ] 会用游标分页替代大偏移量 LIMIT
- [ ] 会定位慢查询并给出优化方案

### 事务
- [ ] 能解释 ACID 四个特性
- [ ] 知道不同隔离级别的区别
- [ ] 理解 MVCC 的原理

---

> 下一篇：[/posts/redis-practical-guide/](Redis数据结构与实战场景) — 缓存、分布式锁、排行榜
