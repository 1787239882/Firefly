---
title: 项目实战合集
published: 2026-06-15
description: 三个由浅入深的练手项目：用户管理系统（Spring Boot单体）、微服务商城（Spring Cloud）、数据服务平台（贴近银行实战）
tags: [项目实战, SpringBoot, SpringCloud, 微服务, 数据服务]
category: 技术成长
---

# 012-项目实战合集

> 回到 [/posts/banking-guide-index/](总目录)
> 上一篇：[/posts/docker-deployment-guide/](Docker容器化部署指南)
> 下一篇：[/posts/knowledge-base-index/](26周成长计划执行手册)

---

## 🎯 为什么要做这三个项目？

这三个项目由浅入深，覆盖了银行软件开发岗的核心能力：

```
项目一                项目二                  项目三
用户管理系统          微服务商城              数据服务平台
   ↓                    ↓                       ↓
Spring Boot 入门    微服务架构实战          贴近真实银行工作
单体架构             分布式架构              你的实际工作内容
```

---

# 🟢 项目一：用户管理系统

> **目标**：掌握 Spring Boot + MySQL + Redis 三层架构开发
> **难度**：⭐（入门）
> **预计时间**：2 周

## 功能需求

```
┌─────────────────────────────┐
│       用户管理系统            │
├─────────────────────────────┤
│  1. 用户登录                 │
│     POST /api/v1/login       │
│     入参：username, password │
│     出参：token              │
│                              │
│  2. 用户管理（CRUD）          │
│     GET    /api/v1/user/{id} │
│     POST   /api/v1/user      │
│     PUT    /api/v1/user      │
│     DELETE /api/v1/user/{id} │
│                              │
│  3. 权限管理                 │
│     GET    /api/v1/role/list  │
│     POST   /api/v1/role/assign│
└─────────────────────────────┘
```

## 数据库设计

```sql
-- 用户表
CREATE TABLE t_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(200) NOT NULL COMMENT '密码（BCrypt加密）',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    status VARCHAR(10) DEFAULT 'ACTIVE' COMMENT 'ACTIVE/INACTIVE',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (status)
) COMMENT '用户表';

-- 角色表
CREATE TABLE t_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码：ADMIN/USER',
    role_name VARCHAR(50) NOT NULL COMMENT '角色名称',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT '角色表';

-- 用户角色关联表
CREATE TABLE t_user_role (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    UNIQUE KEY uk_user_role (user_id, role_id)
) COMMENT '用户角色关联表';
```

## 分步骤实现

### 第 1 天：项目搭建
```bash
# 用 Spring Initializr 创建项目
# 依赖：Spring Web, MySQL Driver, MyBatis-Plus, Lombok, Redis
# 配置 application.yml
# 启动 → 确认 8080 端口通了
```

### 第 2-3 天：用户 CRUD
```java
// 1. 创建 t_user 表
// 2. 写 User 实体类
// 3. 写 UserMapper（MyBatis-Plus BaseMapper）
// 4. 写 UserService（增删改查 + 参数校验）
// 5. 写 UserController（RESTful 接口）
// 6. 配置 Swagger → 在页面试调接口
```

### 第 4 天：登录功能
```java
@Service
public class LoginService {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private StringRedisTemplate redisTemplate;

    public ApiResult<String> login(String username, String password) {
        // 1. 查用户
        User user = userMapper.selectOne(
            new LambdaQueryWrapper<User>().eq(User::getUsername, username)
        );
        if (user == null) {
            return ApiResult.error("用户名或密码错误");
        }

        // 2. 验证密码（BCrypt）
        if (!BCrypt.checkpw(password, user.getPassword())) {
            return ApiResult.error("用户名或密码错误");
        }

        // 3. 生成 token
        String token = UUID.randomUUID().toString();

        // 4. 存 Redis（30分钟过期）
        redisTemplate.opsForValue().set("token:" + token, user.getId().toString(),
                                        30, TimeUnit.MINUTES);

        return ApiResult.success(token);
    }
}
```

### 第 5-7 天：角色权限 + 登录拦截器
```java
// 1. 创建角色表 + 关联表
// 2. 写角色管理 CRUD
// 3. 写登录拦截器
@Component
public class LoginInterceptor implements HandlerInterceptor {
    @Autowired
    private StringRedisTemplate redisTemplate;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp,
                             Object handler) {
        String token = req.getHeader("Authorization");
        if (token == null || !redisTemplate.hasKey("token:" + token)) {
            resp.setStatus(401);
            return false;
        }
        return true;
    }
}

// 4. 注册拦截器
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
            .addPathPatterns("/api/v1/**")
            .excludePathPatterns("/api/v1/login");
    }
}
```

### 验收标准
- [ ] POST /api/v1/login 能收到 token
- [ ] CRUD 四个接口都能跑通
- [ ] 不带 token 调接口返回 401
- [ ] Swagger 页面正常显示

---

# 🟡 项目二：微服务商城

> **目标**：掌握 Spring Cloud Alibaba 微服务体系
> **难度**：⭐⭐（进阶）
> **预计时间**：3 周

## 架构图

```
               ┌──────────────┐
用户请求 ───→   │   Gateway    │  网关：鉴权 + 路由
               └──────┬───────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐
   │ 用户服务  │ │ 商品服务  │ │ 订单服务  │
   │user-svc  │ │goods-svc  │ │order-svc │
   └────┬─────┘ └────┬─────┘ └────┬─────┘
        │            │            │
        ▼            ▼            ▼
     MySQL        MySQL        MySQL
     Redis        Redis        Redis
```

## 模块划分

```
micro-mall/
├── mall-gateway/      # 网关（Gateway + Nacos）
├── mall-common/       # 公共模块（ApiResult、工具类）
├── mall-user/         # 用户服务
├── mall-goods/        # 商品服务
└── mall-order/        # 订单服务
```

## 分步骤实现

### 第 1 周：基础设施
1. 搭建 Nacos 注册中心
2. 创建 mall-user 服务，注册到 Nacos
3. 创建 mall-goods 服务，注册到 Nacos
4. 创建 mall-common 公共模块

### 第 2 周：服务调用
1. 在 mall-order 中通过 OpenFeign 调 mall-user（查用户信息）
2. 在 mall-order 中通过 OpenFeign 调 mall-goods（查商品信息）
3. 实现 Feign 降级处理
4. 配置统一异常处理

### 第 3 周：网关 + 联调
1. 搭建 Gateway，配置路由
2. 写全局鉴权过滤器
3. 全链路联调：网关 → 订单 → 用户/商品

### 关键代码示例

**订单服务调用户和商品服务**：
```java
@RestController
@RequestMapping("/api/v1/order")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    private final UserFeignClient userFeignClient;
    private final GoodsFeignClient goodsFeignClient;

    @GetMapping("/{id}/detail")
    public ApiResult<OrderDetailVO> getDetail(@PathVariable Long id) {
        // 1. 查订单
        Order order = orderService.getById(id);

        // 2. 远程调用户服务
        ApiResult<User> userResult = userFeignClient.getById(order.getUserId());

        // 3. 远程调商品服务
        ApiResult<Goods> goodsResult = goodsFeignClient.getById(order.getGoodsId());

        // 4. 组装
        OrderDetailVO vo = OrderDetailVO.builder()
            .order(order)
            .user(userResult.getData())
            .goods(goodsResult.getData())
            .build();
        return ApiResult.success(vo);
    }
}
```

---

# 🔴 项目三：数据服务平台

> **目标**：模拟真实银行数据服务 API
> **难度**：⭐⭐⭐（实战）
> **预计时间**：2 周

## 功能设计

```
┌──────────────────────────────────┐
│         数据服务平台               │
├──────────────────────────────────┤
│ 1. API 管理                       │
│    - 注册 API（名称/路径/描述）     │
│    - 查询 API 列表                │
│    - 启用/停用 API                │
│                                  │
│ 2. API 授权                       │
│    - 申请 API 调用权限            │
│    - 审批权限                     │
│    - 查看已授权 API 列表           │
│                                  │
│ 3. 调用统计                       │
│    - 每次调用记录日志              │
│    - 调用量统计（按 API、按调用方） │
│    - Top 10 调用排行              │
│                                  │
│ 4. 数据服务 API（示例）             │
│    - 客户信息查询                 │
│    - 账户余额查询                 │
│    - 交易记录查询                 │
└──────────────────────────────────┘
```

## 数据库设计

```sql
-- API 定义表
CREATE TABLE t_api_define (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL COMMENT 'API名称',
    api_path VARCHAR(200) NOT NULL COMMENT 'API路径',
    api_method VARCHAR(10) NOT NULL COMMENT 'GET/POST',
    description VARCHAR(500) COMMENT '描述',
    status VARCHAR(10) DEFAULT 'ACTIVE' COMMENT 'ACTIVE/INACTIVE',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API 调用日志表
CREATE TABLE t_api_call_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_id BIGINT NOT NULL COMMENT 'API ID',
    caller VARCHAR(100) COMMENT '调用方',
    request_params TEXT COMMENT '请求参数',
    response_code INT COMMENT '响应码',
    cost_time INT COMMENT '耗时(ms)',
    call_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_api_id (api_id),
    INDEX idx_call_time (call_time),
    INDEX idx_caller (caller)
);

-- API 授权表
CREATE TABLE t_api_auth (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_id BIGINT NOT NULL,
    caller VARCHAR(100) NOT NULL COMMENT '调用方标识',
    status VARCHAR(10) DEFAULT 'ACTIVE',
    auth_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_api_caller (api_id, caller)
);
```

## 分步实现

### 第 1 周：核心功能
1. API 管理 CRUD（同项目一的套路）
2. API 授权管理
3. 调用日志记录（AOP 切面自动记录）
4. 调用统计接口（Redis ZSet 排行榜 + MySQL 明细）

### 第 2 周：数据服务 API + 完善
1. 模拟客户信息查询 API
2. 模拟账户余额查询 API
3. 模拟交易记录查询 API
4. 加上鉴权过滤器（校验调用方是否有权限）
5. 完善 Swagger 文档

### AOP 自动记录调用日志

```java
@Aspect
@Component
@Slf4j
public class ApiCallLogAspect {

    @Autowired
    private ApiCallLogMapper logMapper;
    @Autowired
    private StringRedisTemplate redisTemplate;

    // 拦截所有 Controller 方法
    @Around("execution(* com.xwbank.controller.*.*(..))")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();

        Object result = null;
        int code = 200;
        try {
            result = joinPoint.proceed();
            return result;
        } catch (Exception e) {
            code = 500;
            throw e;
        } finally {
            long costTime = System.currentTimeMillis() - start;

            // 异步记录日志（用线程池）
            CompletableFuture.runAsync(() -> {
                // 1. 写 MySQL 明细
                ApiCallLog log = new ApiCallLog();
                log.setApiId(getApiId(methodName));
                log.setCostTime((int) costTime);
                log.setResponseCode(code);
                log.setCallTime(LocalDateTime.now());
                logMapper.insert(log);

                // 2. 更新 Redis 计数器
                redisTemplate.opsForZSet()
                    .incrementScore("rank:api:call:daily", methodName, 1);
            });
        }
    }
}
```

---

## 📊 三个项目对照

| 维度 | 项目一 | 项目二 | 项目三 |
|------|--------|--------|--------|
| 架构 | 单体 | 微服务 | 微服务 |
| 框架 | Spring Boot | Spring Cloud | Spring Boot + Cloud |
| 核心技能 | CRUD + 三层 | Nacos + Feign + Gateway | AOP + 定时任务 + 统计 |
| 贴近银行 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

> 下一篇：[/posts/knowledge-base-index/](26周成长计划执行手册) — 每周该干什么
