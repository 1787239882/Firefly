---
title: Java多线程与JVM深度指南
published: 2026-06-15
description: 深入讲解Java多线程编程（线程池、CompletableFuture、锁机制）与JVM内存模型、GC垃圾回收、OOM排查实战
tags: [Java, 多线程, JVM, GC, 线程池, 并发]
category: 技术成长
---

# 004-Java多线程与JVM深度指南

> 回到 [/posts/banking-guide-index/](总目录)
> 上一篇：[/posts/java-learning-roadmap/](Java从零到精通学习路线)
> 下一篇：[/posts/mysql-practical-guide/](MySQL从入门到SQL优化实战)

---

# 🧵 Part 1：多线程 —— 第 4-5 周

## 1.1 为什么银行项目要学多线程？

银行数据服务平台每天处理几十万次调用：
- 单个接口查数据库要 200ms
- 串行查 100 次 = 20 秒 ❌
- 并行查 100 次 = 1 秒 ✅

> **你不学多线程 = 你写的接口永远比别人慢 10 倍**

---

## 1.2 创建线程的 4 种方式

```java
// 方式1：继承 Thread（不推荐）
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("子线程：" + Thread.currentThread().getName());
    }
}
new MyThread().start();

// 方式2：实现 Runnable（推荐——可以继承其他类）
class MyTask implements Runnable {
    @Override
    public void run() {
        System.out.println("任务执行中...");
    }
}
new Thread(new MyTask()).start();

// 方式3：Lambda（最简洁）
new Thread(() -> {
    System.out.println("一句话搞定");
}).start();

// 方式4：线程池（实际开发只用这个！）
ExecutorService pool = Executors.newFixedThreadPool(10);
pool.execute(() -> System.out.println("线程池执行"));
```

---

## 1.3 线程池 —— 实际开发的核心

### 先记住这行配置（银行的线程池一般这样配）

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    10,    // 核心线程数（平时就这么多）
    20,    // 最大线程数（忙时最多这么多）
    60,    // 空闲线程存活时间
    TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100),  // 任务队列（排队等执行）
    new ThreadPoolExecutor.CallerRunsPolicy()  // 拒绝策略：队列满了调用者自己执行
);
```

### 7 个参数图解

```
任务来了
   │
   ▼
核心线程有空？──有──▶ 核心线程执行
   │
   没空
   ▼
队列有空间？──有──▶ 放入队列排队
   │
   没空间
   ▼
最大线程有空？──有──▶ 创建临时线程执行
   │
   没空
   ▼
执行拒绝策略
```

### 你的真实使用场景

```java
@Service
public class CustomerQueryService {

    // 银行数据服务查询线程池
    private final ThreadPoolExecutor queryExecutor = new ThreadPoolExecutor(
        20, 50, 60, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(200),
        new ThreadFactoryBuilder().setNameFormat("query-pool-%d").build(),
        new ThreadPoolExecutor.CallerRunsPolicy()
    );

    // 场景：批量查询客户详情（并发查多个数据源）
    public CustomerDetailVO batchQueryDetail(String customerId) {
        // 需要同时查：基本信息、账户信息、信用信息、交易记录
        CompletableFuture<BasicInfo> basicFuture = CompletableFuture
            .supplyAsync(() -> queryBasicInfo(customerId), queryExecutor);
        CompletableFuture<List<Account>> accountFuture = CompletableFuture
            .supplyAsync(() -> queryAccounts(customerId), queryExecutor);
        CompletableFuture<CreditInfo> creditFuture = CompletableFuture
            .supplyAsync(() -> queryCreditInfo(customerId), queryExecutor);
        CompletableFuture<List<Transaction>> transFuture = CompletableFuture
            .supplyAsync(() -> queryTransactions(customerId), queryExecutor);

        // 等待所有查询完成，组装结果
        return CompletableFuture.allOf(basicFuture, accountFuture, creditFuture, transFuture)
            .thenApply(v -> {
                CustomerDetailVO vo = new CustomerDetailVO();
                vo.setBasicInfo(basicFuture.join());
                vo.setAccounts(accountFuture.join());
                vo.setCreditInfo(creditFuture.join());
                vo.setTransactions(transFuture.join());
                return vo;
            })
            .join();  // 阻塞等待最终结果
    }
}
```

---

## 1.4 CompletableFuture —— 异步编程利器

### 核心 API 速查

```java
// ===== 创建 =====
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 有返回值的异步任务
    return "Hello";
});

CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
    // 无返回值的异步任务
    System.out.println("执行中...");
});

// ===== 链式处理 =====
CompletableFuture.supplyAsync(() -> queryFromDb())  // 1. 查数据库
    .thenApply(data -> transform(data))             // 2. 转换数据
    .thenAccept(result -> saveToCache(result))      // 3. 保存到缓存
    .exceptionally(ex -> {                          // 4. 异常处理
        log.error("处理失败", ex);
        return null;
    });

// ===== 组合多个 Future =====
// 两个都完成
CompletableFuture.allOf(future1, future2, future3).join();

// 任意一个完成
CompletableFuture.anyOf(future1, future2, future3).join();

// thenCombine：两个结果合并
future1.thenCombine(future2, (result1, result2) -> result1 + " + " + result2);
```

---

## 1.5 锁 —— synchronized 和 ReentrantLock

### synchronized（内置锁）

```java
public class Counter {
    private int count = 0;

    // 方法锁：同一时刻只有一个线程能进这个方法
    public synchronized void increment() {
        count++;
    }

    // 代码块锁：锁住某个对象（粒度更细）
    private final Object lock = new Object();

    public void increment2() {
        synchronized (lock) {
            count++;
        }
    }
}
```

### ReentrantLock（显式锁）

```java
public class SafeCounter {
    private int count = 0;
    private final ReentrantLock lock = new ReentrantLock();

    public void increment() {
        lock.lock();  // 加锁
        try {
            count++;
        } finally {
            lock.unlock();  // 必须在 finally 解锁！
        }
    }
}
```

### 银行场景：分布式锁

```java
// 防止重复入账
public class PaymentService {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public void processPayment(String orderId) {
        String lockKey = "payment:lock:" + orderId;

        // 尝试获取 Redis 分布式锁（10秒过期）
        Boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", Duration.ofSeconds(10));

        if (Boolean.TRUE.equals(locked)) {
            try {
                // 处理支付逻辑
                doPayment(orderId);
            } finally {
                // 释放锁
                redisTemplate.delete(lockKey);
            }
        } else {
            throw new BizException("订单正在处理中，请勿重复提交");
        }
    }
}
```

---

# 🔬 Part 2：JVM —— 第 5-6 周

## 2.1 JVM 内存模型（一张图记住）

```
┌──────────────────────────────────────┐
│              JVM 内存                 │
├──────┬──────┬────────────┬───────────┤
│ 堆   │ 方法区│ 虚拟机栈   │ 程序计数器│
│Heap  │Meta- │ VM Stack  │ PC Register│
│      │space │           │           │
├──────┴──────┼────────────┼───────────┤
│  所有线程共享 │   线程私有  │           │
├─────────────┼────────────┼───────────┤
│ new 出来的   │ 类信息、    │ 局部变量表  │
│ 对象都在这里  │ 常量池     │ 操作数栈   │
└─────────────┴────────────┴───────────┘
```

### 堆的细分

```
堆（Heap）
├── 新生代（Young Generation）
│   ├── Eden 区（伊甸园——新对象诞生地）
│   ├── Survivor 0（幸存者0区）
│   └── Survivor 1（幸存者1区）
└── 老年代（Old Generation）
    └── 长期存活的对象
```

---

## 2.2 GC（垃圾回收）

### Minor GC vs Full GC

| 类型 | 发生在哪 | 特点 | 影响 |
|------|---------|------|------|
| Minor GC | 新生代 | 频繁、速度快 | 几乎无感 |
| Full GC | 整个堆 + 方法区 | 少但要命 | Stop The World |

### 常见的 GC 日志怎么看

```bash
# 启动时加上这些参数，就能看 GC 日志
java -Xlog:gc*:file=gc.log:time,level,tags ...

# GC 日志关键信息
[GC (Allocation Failure)  512K->256K(1024K), 0.0012345 secs]
# ↑ 分配失败触发GC  ↑回收前→后(总大小) ↑耗时
```

---

## 2.3 OOM（内存溢出）排查

### 常见 OOM 类型

| 异常信息 | 原因 | 解决 |
|---------|------|------|
| `java.lang.OutOfMemoryError: Java heap space` | 堆内存不够 | 加大堆 `-Xmx2g` 或排查内存泄漏 |
| `java.lang.OutOfMemoryError: GC overhead limit exceeded` | GC 太频繁，回收的太少 | 排查是否死循环创建对象 |
| `java.lang.OutOfMemoryError: Metaspace` | 加载了太多类 | 增大 Metaspace 或排查动态代理 |

### 排查步骤

```bash
# 1. 启动时加参数，OOM 时自动 dump
java -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heap.hprof -jar app.jar

# 2. 手动导出堆快照
jmap -dump:format=b,file=/tmp/heap.hprof <pid>

# 3. 用 MAT（Memory Analyzer Tool）或 jhat 分析
# 打开 .hprof 文件，找最大的对象，追溯引用链

# 4. 实时监控
jstat -gc <pid> 1000  # 每秒看一次 GC 情况
```

### 你在银行排查的实际流程

```
1. 监控告警：接口 RT 飙高
2. 登录服务器：top 发现 Java 进程 CPU 300%
3. 看 GC 日志：发现每秒都在 Full GC
4. jmap dump 堆：找到有个 List 无限增长
5. 查看代码：发现有人把查询结果缓存到 static List 里没清
6. 修复上线
```

---

## ✅ 检查清单

### 多线程
- [ ] 能写出线程池的 7 参数配置
- [ ] 能用 CompletableFuture 并发调 3 个接口并合并结果
- [ ] 知道 synchronized 和 ReentrantLock 的区别
- [ ] 知道什么是 CAS、volatile

### JVM
- [ ] 能画出 JVM 内存模型图
- [ ] 能解释 Minor GC 和 Full GC 的区别
- [ ] 知道常见 OOM 类型和排查思路
- [ ] 会用 `jps`、`jstat`、`jmap`、`jstack` 命令

---

> 下一篇：[/posts/mysql-practical-guide/](MySQL从入门到SQL优化实战) — 索引、Explain、事务
