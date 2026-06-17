---
title: Redis数据结构与实战场景
published: 2026-06-15
description: Redis五大基础数据结构详解与三大实战场景：缓存设计模式（穿透/击穿/雪崩）、分布式锁、计数器排行榜
image: ../../assets/images/post-covers/redis-practical-guide.webp
tags: [Redis, 缓存, 分布式锁, 排行榜, 缓存穿透]
category: 技术成长
---

# 006-Redis数据结构与实战场景

> 回到 [/posts/knowledge-base-index/](总目录)
> 上一篇：[/posts/mysql-practical-guide/](MySQL从入门到SQL优化实战)
> 下一篇：[/posts/spring-boot-tutorial/](Spring-Boot开发实战教程)

---

## 🧠 Redis 是什么？

> Redis = 一个**存在内存里**的键值对数据库
> 快：单机 10 万 QPS
> MySQL 是存硬盘的仓库，Redis 是你桌上的便签纸

---

# 📘 Part 1：五大基础数据结构

## 1.1 String —— 最常用

```bash
# ===== 基本操作 =====
SET name "张三"
GET name                    # "张三"
SETNX lock:order:123 "1"   # 只在不存在时设置（分布式锁核心！）
SETEX code:13800138000 60 "123456"  # 设置+过期时间（验证码场景）
INCR view_count:article:99  # 自增1 → 返回1（计数器）
INCRBY balance:user:1 100   # 自增100

# ===== 银行实战场景 =====
# 1. 接口调用计数
INCR api:call_count:queryCustomer  # 每次调用 +1

# 2. 短信验证码
SETEX sms:13800138000 300 "654321"  # 5分钟过期

# 3. 防止重复提交
SETNX idempotent:order:20250615001 "1" EX 3600  # 1小时内幂等
```

## 1.2 Hash —— 存对象

```bash
# 一个 Hash 就是一个 Java Map<String, String>
HSET customer:C001 name "张三" age "25" balance "50000"
HGET customer:C001 name       # "张三"
HGETALL customer:C001         # 所有字段
HINCRBY customer:C001 balance 1000  # 余额 +1000

# 银行实战：缓存客户信息
HSET cache:customer:C001 name "张三" phone "13800138000" status "ACTIVE"
EXPIRE cache:customer:C001 3600  # 1小时过期
```

## 1.3 List —— 有序可重复队列

```bash
LPUSH queue:pending "order:001"   # 左边入队
RPUSH queue:pending "order:002"   # 右边入队
LPOP queue:pending                # 左边出队
LRANGE queue:pending 0 -1        # 看全部
LLEN queue:pending               # 队列长度

# 银行实战：任务队列
LPUSH task:export "report_20250615_001"  # 报表导出任务入队
RPOP task:export                          # Worker 取任务执行
```

## 1.4 Set —— 无序不重复

```bash
SADD blacklist "13800138000" "13900139000"
SISMEMBER blacklist "13800138000"   # 1（在黑名单里）
SREM blacklist "13800138000"        # 移除
SCARD blacklist                     # 黑名单数量

# 银行实战：黑名单/白名单
SADD risk:blacklist:customer "C001" "C099"  # 风控黑名单
SADD vip:whitelist "VIP001" "VIP002"        # VIP 白名单
```

## 1.5 ZSet —— 有序不重复（带分数）

```bash
ZADD leaderboard 9500 "user:A"   # 分数（交易额）  成员
ZADD leaderboard 12000 "user:B"
ZADD leaderboard 8000 "user:C"

ZRANGE leaderboard 0 -1          # 按分数升序
ZREVRANGE leaderboard 0 9        # Top 10（降序）
ZSCORE leaderboard "user:A"      # 9500
ZRANK leaderboard "user:A"       # 排名（升序，从0开始）
ZREVRANK leaderboard "user:A"    # 排名（降序）

# 银行实战：排行榜
ZADD daily:transfer:rank 50000 "支行A"  # 今日转账排行
ZINCRBY daily:transfer:rank 3000 "支行A"  # +3000
ZREVRANGE daily:transfer:rank 0 9 WITHSCORES  # Top 10
```

---

# 📗 Part 2：三大实战场景

## 2.1 缓存设计模式

### Cache-Aside（最常用）

```
读取流程：
1. 先查 Redis
2. 有 → 直接返回 ✅
3. 没有 → 查 MySQL
4. 查到 → 写入 Redis + 返回
5. 查不到 → 返回空

写入流程：
1. 先更新 MySQL
2. 再删除 Redis 缓存
```

### Java 代码实现

```java
@Service
public class CustomerCacheService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private CustomerMapper customerMapper;

    private static final String CACHE_PREFIX = "cache:customer:";
    private static final long CACHE_TTL = 3600;  // 1小时

    public Customer getCustomer(String id) {
        String key = CACHE_PREFIX + id;

        // 1. 查缓存
        Customer cached = (Customer) redisTemplate.opsForValue().get(key);
        if (cached != null) {
            return cached;
        }

        // 2. 查数据库
        Customer customer = customerMapper.selectById(id);
        if (customer != null) {
            // 3. 写入缓存（1小时过期）+ 防缓存穿透（空值也缓存）
            redisTemplate.opsForValue().set(key, customer, CACHE_TTL, TimeUnit.SECONDS);
        } else {
            // 4. 缓存空值（防止缓存穿透）
            redisTemplate.opsForValue().set(key, new NullCustomer(), 60, TimeUnit.SECONDS);
        }
        return customer;
    }

    // 更新时删除缓存
    public void updateCustomer(Customer customer) {
        customerMapper.updateById(customer);          // 1. 先更新 DB
        redisTemplate.delete(CACHE_PREFIX + customer.getId());  // 2. 再删缓存
    }
}
```

### 缓存三大问题

| 问题 | 现象 | 解决方案 |
|------|------|---------|
| **缓存穿透** | 查不存在的数据，每次都穿透到 DB | 缓存空值 OR 布隆过滤器 |
| **缓存击穿** | 热点 Key 过期瞬间大量请求打 DB | 互斥锁 OR 逻辑过期 |
| **缓存雪崩** | 大量 Key 同时过期 | 随机过期时间 + 多级缓存 |

---

## 2.2 分布式锁

```java
@Component
public class RedisLock {

    @Autowired
    private StringRedisTemplate redisTemplate;

    /**
     * 尝试获取锁
     * @param lockKey 锁的 Key（业务标识）
     * @param requestId 请求标识（UUID，防止误删）
     * @param expireSeconds 过期秒数（防止死锁）
     */
    public boolean tryLock(String lockKey, String requestId, long expireSeconds) {
        Boolean success = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, requestId, Duration.ofSeconds(expireSeconds));
        return Boolean.TRUE.equals(success);
    }

    /**
     * 释放锁（用 Lua 保证原子性——只有自己能删自己的锁）
     */
    public boolean unlock(String lockKey, String requestId) {
        String luaScript =
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "   return redis.call('del', KEYS[1]) " +
            "else " +
            "   return 0 " +
            "end";
        DefaultRedisScript<Long> script = new DefaultRedisScript<>(luaScript, Long.class);
        Long result = redisTemplate.execute(script, Collections.singletonList(lockKey), requestId);
        return Long.valueOf(1).equals(result);
    }
}

// ===== 使用 =====
@Service
public class OrderService {
    @Autowired
    private RedisLock redisLock;

    public void processOrder(String orderId) {
        String lockKey = "lock:order:" + orderId;
        String requestId = UUID.randomUUID().toString();

        if (redisLock.tryLock(lockKey, requestId, 30)) {
            try {
                // 执行业务逻辑
                doProcessOrder(orderId);
            } finally {
                redisLock.unlock(lockKey, requestId);
            }
        } else {
            throw new BizException("订单处理中，请稍后重试");
        }
    }
}
```

## 2.3 计数器/排行榜

```java
// 接口调用次数排行
@Service
public class ApiCallRankService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final String RANK_KEY = "rank:api:call:daily";

    // 每次接口调用时 +1
    public void increment(String apiName) {
        redisTemplate.opsForZSet().incrementScore(RANK_KEY, apiName, 1);
    }

    // 获取 Top 10
    public List<Map.Entry<String, Double>> getTop10() {
        Set<ZSetOperations.TypedTuple<String>> top =
            redisTemplate.opsForZSet().reverseRangeWithScores(RANK_KEY, 0, 9);
        return top.stream()
            .map(t -> Map.entry(t.getValue(), t.getScore()))
            .collect(Collectors.toList());
    }

    // 每日重置
    @Scheduled(cron = "0 0 0 * * ?")  // 每天0点
    public void resetDaily() {
        redisTemplate.delete(RANK_KEY);
    }
}
```

---

## ✅ 检查清单

- [ ] 会用 Redis 五大数据结构的常用命令
- [ ] 能写出 Cache-Aside 模式的 Java 代码
- [ ] 知道缓存穿透、击穿、雪崩是什么及应对方案
- [ ] 能写出 Redis 分布式锁的获取和释放（带 Lua 原子释放）
- [ ] 能用 ZSet 实现排行榜

---

> 下一篇：[/posts/spring-boot-tutorial/](Spring-Boot开发实战教程) — 开始写接口！
