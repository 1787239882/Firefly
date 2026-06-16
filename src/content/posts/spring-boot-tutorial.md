---
title: Spring-Boot开发实战教程
published: 2026-06-15
description: 从零搭建Spring Boot三层架构API接口，涵盖Controller-Service-Mapper、统一返回格式、全局异常处理、Swagger文档与参数校验
tags: [SpringBoot, API开发, 三层架构, MyBatis-Plus, Swagger]
category: 技术成长
---

# 007-Spring-Boot开发实战教程

> 回到 [/posts/banking-guide-index/](总目录)
> 上一篇：[/posts/redis-practical-guide/](Redis数据结构与实战场景)
> 下一篇：[/posts/spring-cloud-alibaba/](Spring-Cloud-Alibaba微服务指南)

---

## 🎯 学完本章你能干什么

从零搭建一个标准的三层架构 API 接口，包含：
- Controller → Service → Mapper 三层
- 统一返回格式
- 全局异常处理
- Swagger 接口文档
- 参数校验

---

# 📘 Part 1：项目搭建 —— 30 分钟

## 1.1 创建 Spring Boot 项目

### 方式一：Spring Initializr（推荐）

1. 打开 https://start.spring.io
2. 选择：
   - Project: Maven
   - Language: Java
   - Spring Boot: 2.7.x 或 3.x
   - Group: `com.xwbank`
   - Artifact: `demo`
3. 添加依赖：
   - Spring Web
   - MySQL Driver
   - MyBatis-Plus (手动加)
   - Lombok
   - Spring Boot Actuator
4. 下载 → 解压 → IDEA 打开

### 方式二：IDEA 新建

`File → New → Project → Spring Initializr → 同上面的配置`

## 1.2 项目结构

```
src/main/java/com/xwbank/demo/
├── DemoApplication.java          # 启动类
├── controller/                   # 控制器层（接收请求）
│   └── CustomerController.java
├── service/                      # 服务层（业务逻辑）
│   ├── CustomerService.java      # 接口
│   └── impl/
│       └── CustomerServiceImpl.java  # 实现
├── mapper/                       # 数据访问层（查数据库）
│   └── CustomerMapper.java
├── entity/                       # 实体类（对应数据库表）
│   └── Customer.java
├── vo/                           # 视图对象（返回给前端）
│   └── CustomerVO.java
├── dto/                          # 数据传输对象（接收参数）
│   └── CustomerQueryDTO.java
├── common/                       # 公共类
│   ├── ApiResult.java           # 统一返回结果
│   ├── BizException.java        # 业务异常
│   └── GlobalExceptionHandler.java  # 全局异常处理
└── config/                       # 配置类
    └── SwaggerConfig.java       # Swagger 配置

src/main/resources/
├── application.yml               # 主配置
├── application-dev.yml           # 开发环境
└── application-prod.yml          # 生产环境
```

---

# 📗 Part 2：三层架构开发 —— 核心章节

## 2.1 统一返回结果

```java
package com.xwbank.demo.common;

import lombok.Data;

@Data
public class ApiResult<T> {
    private int code;       // 200 成功，其他失败
    private String message; // 提示信息
    private T data;         // 返回数据

    private ApiResult() {}

    // ===== 工厂方法 =====
    public static <T> ApiResult<T> success(T data) {
        ApiResult<T> result = new ApiResult<>();
        result.code = 200;
        result.message = "success";
        result.data = data;
        return result;
    }

    public static <T> ApiResult<T> success() {
        return success(null);
    }

    public static <T> ApiResult<T> error(int code, String message) {
        ApiResult<T> result = new ApiResult<>();
        result.code = code;
        result.message = message;
        return result;
    }

    public static <T> ApiResult<T> error(String message) {
        return error(500, message);
    }
}
```

## 2.2 实体类

```java
package com.xwbank.demo.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("t_customer")  // 对应数据库表
public class Customer {
    @TableId(type = IdType.AUTO)  // 自增主键
    private Long id;

    private String name;
    private String phone;
    private Integer age;
    private String status;  // ACTIVE / INACTIVE

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

## 2.3 Mapper 层（数据访问）

```java
package com.xwbank.demo.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.xwbank.demo.entity.Customer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CustomerMapper extends BaseMapper<Customer> {
    // BaseMapper 自带：
    //   insert(entity), deleteById(id), updateById(entity), selectById(id), selectList(wrapper)

    // ===== 自定义 SQL =====
    // 方式1：注解（简单 SQL）
    @Select("SELECT * FROM t_customer WHERE name LIKE CONCAT('%', #{name}, '%')")
    List<Customer> searchByName(@Param("name") String name);

    // 方式2：XML（复杂 SQL）
    List<Customer> searchByCondition(@Param("dto") CustomerQueryDTO dto);
}
```

```xml
<!-- resources/mapper/CustomerMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.xwbank.demo.mapper.CustomerMapper">

    <select id="searchByCondition" resultType="com.xwbank.demo.entity.Customer">
        SELECT * FROM t_customer
        WHERE 1=1
        <if test="dto.name != null and dto.name != ''">
            AND name LIKE CONCAT('%', #{dto.name}, '%')
        </if>
        <if test="dto.status != null and dto.status != ''">
            AND status = #{dto.status}
        </if>
        <if test="dto.minAge != null">
            AND age >= #{dto.minAge}
        </if>
        ORDER BY create_time DESC
    </select>

</mapper>
```

## 2.4 Service 层（业务逻辑）

```java
// ===== 接口 =====
package com.xwbank.demo.service;

import com.xwbank.demo.common.ApiResult;
import com.xwbank.demo.dto.CustomerQueryDTO;
import com.xwbank.demo.entity.Customer;
import java.util.List;

public interface CustomerService {

    /** 根据 ID 查询 */
    Customer getById(Long id);

    /** 条件查询 */
    List<Customer> search(CustomerQueryDTO dto);

    /** 新增客户 */
    ApiResult<Void> create(Customer customer);

    /** 更新客户 */
    ApiResult<Void> update(Customer customer);

    /** 删除客户 */
    ApiResult<Void> delete(Long id);
}

// ===== 实现 =====
package com.xwbank.demo.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.xwbank.demo.common.ApiResult;
import com.xwbank.demo.dto.CustomerQueryDTO;
import com.xwbank.demo.entity.Customer;
import com.xwbank.demo.mapper.CustomerMapper;
import com.xwbank.demo.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor  // Lombok：自动生成构造方法注入
public class CustomerServiceImpl implements CustomerService {

    private final CustomerMapper customerMapper;

    @Override
    public Customer getById(Long id) {
        log.info("查询客户，id={}", id);
        Customer customer = customerMapper.selectById(id);
        if (customer == null) {
            throw new BizException("客户不存在，id=" + id);
        }
        return customer;
    }

    @Override
    public List<Customer> search(CustomerQueryDTO dto) {
        // ===== MyBatis-Plus Lambda 条件构造器 =====
        LambdaQueryWrapper<Customer> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(dto.getName()), Customer::getName, dto.getName())
               .eq(StringUtils.hasText(dto.getStatus()), Customer::getStatus, dto.getStatus())
               .ge(dto.getMinAge() != null, Customer::getAge, dto.getMinAge())
               .orderByDesc(Customer::getCreateTime);
        return customerMapper.selectList(wrapper);
    }

    @Override
    @Transactional  // 事务
    public ApiResult<Void> create(Customer customer) {
        // 业务校验
        if (!StringUtils.hasText(customer.getName())) {
            return ApiResult.error("客户姓名不能为空");
        }
        int rows = customerMapper.insert(customer);
        log.info("新增客户成功，id={}", customer.getId());
        return rows > 0 ? ApiResult.success() : ApiResult.error("新增失败");
    }

    @Override
    @Transactional
    public ApiResult<Void> update(Customer customer) {
        // 先查是否存在
        Customer exist = customerMapper.selectById(customer.getId());
        if (exist == null) {
            return ApiResult.error("客户不存在");
        }
        customerMapper.updateById(customer);
        return ApiResult.success();
    }

    @Override
    @Transactional
    public ApiResult<Void> delete(Long id) {
        customerMapper.deleteById(id);
        return ApiResult.success();
    }
}
```

## 2.5 Controller 层（接收请求）

```java
package com.xwbank.demo.controller;

import com.xwbank.demo.common.ApiResult;
import com.xwbank.demo.dto.CustomerQueryDTO;
import com.xwbank.demo.entity.Customer;
import com.xwbank.demo.service.CustomerService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/customer")
@RequiredArgsConstructor
@Api(tags = "客户管理接口")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping("/{id}")
    @ApiOperation("根据ID查询客户")
    public ApiResult<Customer> getById(
            @ApiParam("客户ID") @PathVariable Long id) {
        Customer customer = customerService.getById(id);
        return ApiResult.success(customer);
    }

    @PostMapping("/search")
    @ApiOperation("条件查询客户列表")
    public ApiResult<List<Customer>> search(
            @RequestBody @Valid CustomerQueryDTO dto) {
        List<Customer> list = customerService.search(dto);
        return ApiResult.success(list);
    }

    @PostMapping
    @ApiOperation("新增客户")
    public ApiResult<Void> create(
            @RequestBody @Valid Customer customer) {
        return customerService.create(customer);
    }

    @PutMapping
    @ApiOperation("更新客户")
    public ApiResult<Void> update(
            @RequestBody @Valid Customer customer) {
        return customerService.update(customer);
    }

    @DeleteMapping("/{id}")
    @ApiOperation("删除客户")
    public ApiResult<Void> delete(
            @ApiParam("客户ID") @PathVariable Long id) {
        return customerService.delete(id);
    }
}
```

---

# 📙 Part 3：全局异常处理

```java
package com.xwbank.demo.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice  // 全局拦截所有 Controller 的异常
public class GlobalExceptionHandler {

    // 业务异常
    @ExceptionHandler(BizException.class)
    public ApiResult<Void> handleBizException(BizException e) {
        log.warn("业务异常：{}", e.getMessage());
        return ApiResult.error(e.getCode(), e.getMessage());
    }

    // 参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResult<Void> handleValidException(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .reduce((a, b) -> a + "; " + b)
            .orElse("参数校验失败");
        return ApiResult.error(400, msg);
    }

    // 兜底异常（未知异常）
    @ExceptionHandler(Exception.class)
    public ApiResult<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return ApiResult.error(500, "系统繁忙，请稍后重试");
    }
}
```

---

# 📒 Part 4：Swagger 接口文档

```java
package com.xwbank.demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;

@Configuration
public class SwaggerConfig {

    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.OAS_30)
            .apiInfo(new ApiInfoBuilder()
                .title("新网银行数据服务平台 API")
                .description("数据服务接口文档")
                .version("1.0.0")
                .build())
            .select()
            .apis(RequestHandlerSelectors.basePackage("com.xwbank.demo.controller"))
            .paths(PathSelectors.any())
            .build();
    }
}
```

启动后访问：`http://localhost:8080/swagger-ui/index.html`

---

# 📕 Part 5：参数校验

```java
// DTO 中加校验注解
@Data
public class CustomerQueryDTO {
    @NotBlank(message = "客户姓名不能为空")
    private String name;

    @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "状态值非法")
    private String status;

    @Min(value = 0, message = "年龄不能为负数")
    @Max(value = 150, message = "年龄不能超过150")
    private Integer minAge;
}
```

---

# 📓 application.yml 配置模板

```yaml
server:
  port: 8080

spring:
  application:
    name: demo-service
  datasource:
    url: jdbc:mysql://localhost:3306/xwbank?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: ${DB_PASSWORD:123456}  # 优先取环境变量
    driver-class-name: com.mysql.cj.jdbc.Driver
  redis:
    host: localhost
    port: 6379
    password: ${REDIS_PASSWORD:}

mybatis-plus:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl  # SQL 日志
    map-underscore-to-camel-case: true  # 驼峰转换
  global-config:
    db-config:
      logic-delete-field: deleted  # 逻辑删除
      logic-delete-value: 1
      logic-not-delete-value: 0

logging:
  level:
    com.xwbank: DEBUG
```

---

## ✅ 检查清单

- [ ] 能从零搭建 Spring Boot 项目并启动
- [ ] 能写出完整的 Controller → Service → Mapper 三层
- [ ] 能写出统一返回结果类 ApiResult
- [ ] 能写出全局异常处理器
- [ ] 能在 Controller 里写出 POST/GET/PUT/DELETE 接口
- [ ] 能配置 Swagger 并看到接口文档页面
- [ ] 能配置 MyBatis-Plus 并连接 MySQL

---

> 下一篇：[/posts/spring-cloud-alibaba/](Spring-Cloud-Alibaba微服务指南) — Nacos/Feign/Gateway
