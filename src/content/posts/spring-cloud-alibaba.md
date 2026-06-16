---
title: Spring-Cloud-Alibaba微服务指南
published: 2026-06-15
description: 从单体到微服务架构演进，详解Nacos注册/配置中心、OpenFeign服务调用与降级、Gateway网关路由与鉴权
tags: [SpringCloud, 微服务, Nacos, Gateway, OpenFeign]
category: 技术成长
---

# 008-Spring-Cloud-Alibaba微服务指南

> 回到 [/posts/knowledge-base-index/](总目录)
> 上一篇：[/posts/spring-boot-tutorial/](Spring-Boot开发实战教程)
> 下一篇：[/posts/banking-big-data/](银行大数据中心知识体系)

---

## 🧠 什么是微服务？

```
单体架构：                        微服务架构：
┌──────────────────────┐          ┌──────┐ ┌──────┐ ┌──────┐
│  一个巨大的 war 包     │    →     │ 用户  │ │ 订单  │ │ 商品  │
│  用户+订单+商品+支付   │          │ 服务  │ │ 服务  │ │ 服务  │
└──────────────────────┘          └──────┘ └──────┘ └──────┘
                                        ↕       ↕       ↕
                                  ┌──────────────────────────┐
                                  │  Nacos（注册中心+配置）   │
                                  │  Gateway（网关）         │
                                  │  OpenFeign（服务调用）    │
                                  └──────────────────────────┘
```

---

# 📘 Part 1：Nacos —— 注册中心 + 配置中心

## 1.1 安装 Nacos

```bash
# 1. 下载
wget https://github.com/alibaba/nacos/releases/download/2.2.3/nacos-server-2.2.3.zip
unzip nacos-server-2.2.3.zip

# 2. 启动（单机模式）
cd nacos/bin
sh startup.sh -m standalone

# 3. 访问控制台
open http://localhost:8848/nacos
# 默认账号密码：nacos/nacos
```

## 1.2 服务注册

```xml
<!-- pom.xml 引入依赖 -->
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  application:
    name: customer-service  # 服务名（很重要！别的服务用这个名字调你）
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848  # Nacos 地址
```

启动类加 `@EnableDiscoveryClient`（新版 Spring Cloud 连这个都可以省了）。启动后去 Nacos 控制台 `服务管理 → 服务列表` 就能看到你的服务了。

## 1.3 配置中心

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-config</artifactId>
</dependency>
```

```yaml
# bootstrap.yml（比 application.yml 更早加载）
spring:
  application:
    name: customer-service
  cloud:
    nacos:
      config:
        server-addr: localhost:8848
        file-extension: yaml  # 配置格式
        shared-configs:       # 共享配置（多个服务公用）
          - data-id: common-config.yaml
            refresh: true     # 自动刷新
```

在 Nacos 控制台 → `配置管理 → 配置列表` 中创建配置：
- Data ID: `customer-service.yaml`
- 内容: 你的配置项

```java
// 动态刷新配置
@RestController
@RefreshScope  // 加了它，Nacos 配置变了不用重启
public class ConfigController {

    @Value("${app.timeout:3000}")  // 从 Nacos 读取，默认 3000
    private int timeout;

    @GetMapping("/config/timeout")
    public int getTimeout() {
        return timeout;
    }
}
```

---

# 📗 Part 2：OpenFeign —— 服务间调用

## 2.1 引入依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-openfeign</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-loadbalancer</artifactId>
</dependency>
```

## 2.2 定义 Feign 接口

```java
// 在调用方（order-service）定义 Feign 接口
// 这个接口 = 远程服务的"本地代理"
@FeignClient(
    name = "customer-service",     // 调哪个服务
    path = "/api/v1/customer",     // 基础路径
    fallbackFactory = CustomerFeignFallback.class  // 降级处理
)
public interface CustomerFeignClient {

    @GetMapping("/{id}")
    ApiResult<Customer> getById(@PathVariable("id") Long id);

    @PostMapping("/search")
    ApiResult<List<Customer>> search(@RequestBody CustomerQueryDTO dto);
}

// ===== 降级处理（被调服务挂了怎么办） =====
@Component
public class CustomerFeignFallback implements FallbackFactory<CustomerFeignClient> {
    @Override
    public CustomerFeignClient create(Throwable cause) {
        log.error("CustomerFeignClient 调用异常", cause);
        return new CustomerFeignClient() {
            @Override
            public ApiResult<Customer> getById(Long id) {
                return ApiResult.error("客户服务暂不可用");
            }

            @Override
            public ApiResult<List<Customer>> search(CustomerQueryDTO dto) {
                return ApiResult.error("客户服务暂不可用");
            }
        };
    }
}
```

## 2.3 使用 Feign 调用

```java
// 在 order-service 里调用 customer-service
@RestController
@RequestMapping("/api/v1/order")
@RequiredArgsConstructor
public class OrderController {

    private final CustomerFeignClient customerFeignClient;
    private final OrderService orderService;

    @GetMapping("/{id}/detail")
    public ApiResult<OrderDetailVO> getDetail(@PathVariable Long id) {
        // 1. 查订单
        Order order = orderService.getById(id);

        // 2. 通过 Feign 调客户服务（像调本地方法一样！）
        ApiResult<Customer> customerResult = customerFeignClient.getById(order.getCustomerId());
        Customer customer = customerResult.getData();

        // 3. 组装结果
        OrderDetailVO vo = new OrderDetailVO();
        vo.setOrder(order);
        vo.setCustomer(customer);
        return ApiResult.success(vo);
    }
}
```

## 2.4 开启 Feign

```java
@SpringBootApplication
@EnableFeignClients  // 必须加这个！
public class OrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderServiceApplication.class, args);
    }
}
```

---

# 📙 Part 3：Gateway —— 网关

## 3.1 理解网关

```
                    不用网关：
  浏览器 ────────→  customer-service:8081
  浏览器 ────────→  order-service:8082
  浏览器 ────────→  product-service:8083
  （前端要记 3 个地址，跨域问题一堆）

                    用了网关：
  浏览器 ──→ gateway:8080 ──→ customer-service
                     ──→ order-service
                     ──→ product-service
  （前端只调一个地址，Gateway 负责转发）
```

## 3.2 搭建 Gateway

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
</dependency>
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-nacos-discovery</artifactId>
</dependency>
```

```yaml
# gateway-service 的 application.yml
spring:
  application:
    name: gateway-service
  cloud:
    nacos:
      discovery:
        server-addr: localhost:8848
    gateway:
      discovery:
        locator:
          enabled: true  # 自动从 Nacos 发现服务
      routes:
        # 路由规则1：客户服务
        - id: customer-route
          uri: lb://customer-service  # lb:// = 负载均衡
          predicates:
            - Path=/api/v1/customer/**  # 匹配这个路径的请求转发到 customer-service

        # 路由规则2：订单服务
        - id: order-route
          uri: lb://order-service
          predicates:
            - Path=/api/v1/order/**
          filters:
            - StripPrefix=0

      # 全局过滤器：鉴权
      default-filters:
        - name: AuthFilter  # 自定义鉴权过滤器
```

## 3.3 自定义全局过滤器（鉴权）

```java
@Component
public class AuthFilter implements GlobalFilter, Ordered {

    // 不需要鉴权的路径
    private static final List<String> WHITE_LIST = Arrays.asList(
        "/api/v1/login",
        "/api/v1/health"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // 白名单放行
        if (WHITE_LIST.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        // 检查 token
        String token = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (token == null || token.isEmpty()) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        // TODO: 校验 token 有效性（调认证服务或解析 JWT）

        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return -100;  // 优先级：越小越先执行
    }
}
```

---

## 📊 微服务调用链路图

```
浏览器
  │
  ▼
Gateway（网关）
  │ 鉴权、限流、路由
  ▼
order-service（订单服务）
  │
  ├──▶ Feign ──▶ customer-service（客户服务）
  │                   │
  │                   ├──▶ MySQL（客户库）
  │                   └──▶ Redis（客户缓存）
  │
  ├──▶ Feign ──▶ product-service（商品服务）
  │
  └──▶ MySQL（订单库）
```

---

## ✅ 检查清单

### Nacos
- [ ] 能启动 Nacos 服务端
- [ ] 能把自己写的服务注册到 Nacos
- [ ] 能通过 Nacos 配置中心管理配置

### OpenFeign
- [ ] 能定义一个 Feign 接口调用另一个服务
- [ ] 能写出降级处理（fallback）
- [ ] 理解 `@FeignClient` 的 name、path、fallback 参数

### Gateway
- [ ] 能搭一个 Gateway 服务并配置路由
- [ ] 能写一个简单的鉴权过滤器
- [ ] 理解 `lb://` 负载均衡的含义

---

> 下一篇：[/posts/banking-big-data/](银行大数据中心知识体系) — 数据仓库分层与治理
