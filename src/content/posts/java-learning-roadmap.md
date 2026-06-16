---
title: Java从零到精通学习路线
published: 2026-06-15
description: 面向零基础到精通的Java学习路线，涵盖面向对象、集合框架、泛型、Stream流与Lambda表达式，适合银行开发岗位入门
tags: [Java, 集合, Stream, 面向对象, 学习路线]
category: 技术成长
---

# 003-Java从零到精通学习路线

> 回到 [/posts/banking-guide-index/](总目录)
> 下一篇：[/posts/java-multithreading-jvm/](Java多线程与JVM深度指南)

---

## 🗺️ 学习路线总览

```
基础语法  →  面向对象  →  集合框架  →  泛型  →  Stream/Lambda
   ↑ 第1周      ↑ 第1-2周    ↑ 第2-3周    ↑ 第3周    ↑ 第4周
```

> 💡 **前提假设**：你至少学过一门编程语言（哪怕大学 C 语言也算）。如果你真的零基础，建议先花 3 天看慕课网的 Java 入门视频。

---

# 📘 Part 1：面向对象（OOP）—— 第 1-2 周

## 1.1 类和对象

### 概念（用人话解释）

> **类** = 造车的图纸
> **对象** = 按图纸造出来的那辆车
> **new** = 点下"开始制造"按钮

### 代码手把手

```java
// 1. 定义一个类（图纸）
public class Student {
    // 属性（字段）：这个学生有什么
    private String name;      // 名字
    private int age;          // 年龄
    private String studentId; // 学号

    // 构造方法：怎么造一个学生出来
    public Student(String name, int age, String studentId) {
        this.name = name;
        this.age = age;
        this.studentId = studentId;
    }

    // 方法：这个学生能干什么
    public void study() {
        System.out.println(name + " 在学习");
    }

    // getter/setter：访问私有属性
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
}

// 2. 使用这个类（造车 + 开）
public class Main {
    public static void main(String[] args) {
        // 创建一个学生对象
        Student xiaoMing = new Student("小明", 22, "2024001");

        // 调用方法
        xiaoMing.study();  // 输出：小明 在学习
        System.out.println(xiaoMing.getName());  // 输出：小明
    }
}
```

### 练习清单

- [ ] 写一个 `BankAccount` 类，有余额、账号、户主，能存钱取钱
- [ ] 写一个 `Employee` 类，有姓名、部门、工资，能涨薪
- [ ] 思考：为什么字段用 `private`，方法用 `public`？

---

## 1.2 封装、继承、多态

### 一句话记住三个特性

| 特性 | 一句话 | 关键词 | 现实类比 |
|------|--------|--------|---------|
| **封装** | 数据藏起来，只暴露方法 | `private` + getter/setter | ATM 机：你只能按按钮，不能直接掏里面的钱 |
| **继承** | 儿子继承爹的东西 | `extends` | 所有车都有轮子，但卡车和轿车各有不同 |
| **多态** | 同样的指令，不同的表现 | `@Override` | "叫"这个指令，狗是"汪汪"，猫是"喵喵" |

### 手把手代码

```java
// ========== 封装 ==========
public class BankAccount {
    private double balance;  // 私有的，外面看不到

    public double getBalance() {  // 通过公开方法访问
        return balance;
    }

    public void deposit(double amount) {  // 存钱
        if (amount > 0) {
            balance += amount;
        }
    }

    public void withdraw(double amount) {  // 取钱
        if (amount > 0 && amount <= balance) {
            balance -= amount;
        } else {
            System.out.println("余额不足！");
        }
    }
}

// ========== 继承 ==========
// 父类
public class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void eat() {
        System.out.println(name + " 在吃东西");
    }
}

// 子类：继承 Animal
public class Dog extends Animal {
    public Dog(String name) {
        super(name);  // 调用父类构造方法
    }

    public void bark() {
        System.out.println(name + " 汪汪叫");
    }
}

// ========== 多态 ==========
// 父类引用指向子类对象
Animal animal = new Dog("旺财");
animal.eat();  // 输出：旺财 在吃东西（Animal 的方法）

// 但你可以传不同的子类进去
public void makeSound(Animal animal) {
    // 不管是狗、猫、鸟，各叫各的
    // 这就是多态的力量
}
```

### 银行场景练习

```java
// 练习题：假设银行有三种账户
// - 活期账户(SavingsAccount)：有利率
// - 定期账户(FixedAccount)：有期限
// - 信用账户(CreditAccount)：有额度
// 用继承实现，父亲是 Account，三个儿子各有特殊字段

public abstract class Account {
    protected String accountNo;
    protected double balance;

    public abstract void calculateInterest();  // 抽象方法：各子类自己实现
}

// 你的任务：写出 SavingsAccount、FixedAccount、CreditAccount
```

---

## 1.3 接口与抽象类

### 什么时候用接口，什么时候用抽象类？

| | 抽象类 | 接口 |
|---|--------|------|
| 关系 | "is-a"（是一个） | "can-do"（能干什么） |
| 例子 | `Dog` 是一个 `Animal` | `Dog` 能 `Runnable`（被遛） |
| 多继承 | ❌ 只能继承一个 | ✅ 可以实现多个 |
| 字段 | 可以有实例变量 | 只能有常量（public static final） |

### 代码示例

```java
// 接口：定义"能干什么"
public interface Serializable {
    String toJson();   // 能序列化成 JSON
}

public interface Reportable {
    String generateReport();  // 能生成报表
}

// 一个类可以实现多个接口
public class Customer implements Serializable, Reportable {
    private String id;
    private String name;

    @Override
    public String toJson() {
        return "{\"id\":\"" + id + "\", \"name\":\"" + name + "\"}";
    }

    @Override
    public String generateReport() {
        return "客户报表：" + name;
    }
}
```

---

# 📗 Part 2：集合框架 —— 第 2-3 周

## 2.1 选型速查表（最重要！）

日常开发 90% 的情况看这张表选：

| 场景 | 用哪个 | 为什么 |
|------|--------|--------|
| 存一堆东西，顺序不重要 | `ArrayList` | 最常用，查得快 |
| 经常在中间插入/删除 | `LinkedList` | 链表，插入快 |
| 不能重复 | `HashSet` | 自动去重 |
| 不能重复 + 要排序 | `TreeSet` | 去重+排序 |
| 键值对，乱序 | `HashMap` | 最常用，O(1) |
| 键值对，要排序 | `TreeMap` | 按 Key 排序 |
| 线程安全 | `ConcurrentHashMap` | 弃用 HashTable |

## 2.2 ArrayList 手把手

```java
import java.util.ArrayList;
import java.util.List;

public class ArrayListTutorial {
    public static void main(String[] args) {
        // 创建
        List<String> customers = new ArrayList<>();

        // 增
        customers.add("张三");
        customers.add("李四");
        customers.add("王五");

        // 删
        customers.remove("李四");      // 按内容删
        customers.remove(0);           // 按下标删

        // 改
        customers.set(0, "张三丰");    // 替换第一个元素

        // 查
        String first = customers.get(0);           // 按下标取
        boolean hasIt = customers.contains("王五"); // 是否存在
        int size = customers.size();               // 长度

        // 遍历——三种方式
        // 方式1：for-each（最常用）
        for (String name : customers) {
            System.out.println(name);
        }

        // 方式2：普通 for（需要下标时用）
        for (int i = 0; i < customers.size(); i++) {
            System.out.println("第" + i + "个：" + customers.get(i));
        }

        // 方式3：Lambda（简洁）
        customers.forEach(name -> System.out.println(name));
    }
}
```

### 你在银行项目里会怎么用

```java
// 场景：批量查询客户信息
public class CustomerService {
    // 入参是一批客户 ID
    public List<CustomerVO> batchQuery(List<String> customerIds) {
        List<CustomerVO> result = new ArrayList<>();

        for (String id : customerIds) {
            CustomerVO vo = queryById(id);  // 单条查询
            if (vo != null) {
                result.add(vo);
            }
        }
        return result;
    }
}
```

## 2.3 HashMap 手把手

```java
import java.util.HashMap;
import java.util.Map;

public class HashMapTutorial {
    public static void main(String[] args) {
        // 创建：Key 是客户号，Value 是客户姓名
        Map<String, String> customerMap = new HashMap<>();

        // 增/改
        customerMap.put("C001", "张三");
        customerMap.put("C002", "李四");
        customerMap.put("C001", "张三丰");  // 同一个 Key，会覆盖

        // 删
        customerMap.remove("C002");

        // 查
        String name = customerMap.get("C001");         // 根据 Key 取 Value
        boolean exists = customerMap.containsKey("C001"); // Key 是否存在
        int size = customerMap.size();

        // 遍历——两种方式
        // 方式1：遍历所有键值对
        for (Map.Entry<String, String> entry : customerMap.entrySet()) {
            System.out.println(entry.getKey() + " → " + entry.getValue());
        }

        // 方式2：只遍历 Key
        for (String key : customerMap.keySet()) {
            System.out.println(key + " → " + customerMap.get(key));
        }
    }
}
```

### 你在银行项目里怎么用

```java
// 场景：缓存命中——先查 Redis，没有再查 DB
public class CacheService {
    // 模拟：ID → 客户姓名 的内存缓存
    private Map<String, Customer> localCache = new HashMap<>();

    public Customer getCustomer(String id) {
        // 1. 先看本地缓存
        Customer cached = localCache.get(id);
        if (cached != null) {
            return cached;  // 命中，直接返回
        }

        // 2. 查数据库
        Customer fromDb = queryFromDatabase(id);
        if (fromDb != null) {
            localCache.put(id, fromDb);  // 放入缓存
        }
        return fromDb;
    }

    private Customer queryFromDatabase(String id) {
        // 实际会调 Mapper 查 MySQL
        return null;
    }
}
```

---

# 📙 Part 3：泛型 —— 第 3 周

## 3.1 为什么需要泛型？

```java
// ❌ 没有泛型之前（Java 1.4 时代）
List list = new ArrayList();
list.add("hello");
list.add(123);  // 什么都能放
String s = (String) list.get(0);  // 必须强转，ClassCastException 等着你

// ✅ 有泛型以后
List<String> list = new ArrayList<>();
list.add("hello");
// list.add(123);  // 编译就报错
String s = list.get(0);  // 不需要强转
```

## 3.2 自定义泛型类

```java
// 通用的 API 返回结果包装
public class ApiResult<T> {
    private int code;        // 状态码：200 成功，500 失败
    private String message;  // 提示信息
    private T data;          // 数据（类型由调用者决定）

    // 静态工厂方法
    public static <T> ApiResult<T> success(T data) {
        ApiResult<T> result = new ApiResult<>();
        result.code = 200;
        result.message = "success";
        result.data = data;
        return result;
    }

    public static <T> ApiResult<T> error(int code, String message) {
        ApiResult<T> result = new ApiResult<>();
        result.code = code;
        result.message = message;
        return result;
    }

    // getter/setter 省略...
}

// 使用
ApiResult<Customer> result = ApiResult.success(customer);
ApiResult<List<Customer>> listResult = ApiResult.success(customerList);
```

---

# 📒 Part 4：Stream 流 & Lambda —— 第 4 周

## 4.1 Lambda 表达式

```java
// ====== Lambda 的本质 ======
// 函数式接口 = 只有一个抽象方法的接口

// 传统写法
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Lambda 写法
Runnable r2 = () -> System.out.println("Hello");

// ====== Lambda 语法规则 ======
// (参数) -> { 方法体 }
// 参数类型可省略，单个参数可省略括号，单行方法体可省略花括号

// 无参
() -> System.out.println("无参");

// 单参
name -> System.out.println(name);

// 多参
(a, b) -> a + b;

// 多行方法体
(a, b) -> {
    int sum = a + b;
    System.out.println("计算结果：" + sum);
    return sum;
};
```

## 4.2 Stream 操作流

### 管道模式理解

```
数据源  →  filter(过滤)  →  map(转换)  →  sorted(排序)  →  collect(收集)
[1,2,3]     [2,3]           ["A2","A3"]    ["A2","A3"]      ["A2","A3"]
```

### 手把手全套操作

```java
import java.util.*;
import java.util.stream.Collectors;

// 准备数据
List<Customer> customers = Arrays.asList(
    new Customer("C001", "张三", 25, 50000.0),
    new Customer("C002", "李四", 35, 120000.0),
    new Customer("C003", "王五", 28, 80000.0),
    new Customer("C004", "赵六", 45, 200000.0),
    new Customer("C005", "钱七", 30, 150000.0)
);

// ============ filter：过滤 ============
// 找出余额大于 10 万的客户
List<Customer> richCustomers = customers.stream()
    .filter(c -> c.getBalance() > 100000)
    .collect(Collectors.toList());
// 结果：李四(12万)、赵六(20万)、钱七(15万)

// ============ map：转换 ============
// 只提取客户姓名
List<String> names = customers.stream()
    .map(Customer::getName)  // 方法引用，等同于 c -> c.getName()
    .collect(Collectors.toList());
// 结果：[张三, 李四, 王五, 赵六, 钱七]

// ============ sorted：排序 ============
// 按余额降序排列
List<Customer> sortedByBalance = customers.stream()
    .sorted((a, b) -> Double.compare(b.getBalance(), a.getBalance()))
    .collect(Collectors.toList());

// ============ 组合拳：过滤 + 转换 + 排序 ============
// 找出余额 > 10 万的客户姓名，按余额降序
List<String> richNames = customers.stream()
    .filter(c -> c.getBalance() > 100000)     // 1. 过滤
    .sorted((a, b) -> Double.compare(b.getBalance(), a.getBalance())) // 2. 排序
    .map(Customer::getName)                    // 3. 获取姓名
    .collect(Collectors.toList());             // 4. 收集
// 结果：[赵六, 钱七, 李四]

// ============ collect：分组 ============
// 按年龄段分组
Map<String, List<Customer>> ageGroups = customers.stream()
    .collect(Collectors.groupingBy(c -> {
        if (c.getAge() < 30) return "青年";
        else if (c.getAge() < 40) return "中年";
        else return "中老年";
    }));

// ============ 统计 ============
double avgBalance = customers.stream()
    .mapToDouble(Customer::getBalance)
    .average()
    .orElse(0.0);

long count = customers.stream().count();

// ============ findFirst / anyMatch / allMatch ============
Optional<Customer> first = customers.stream()
    .filter(c -> c.getAge() > 30)
    .findFirst();  // 找第一个

boolean allRich = customers.stream()
    .allMatch(c -> c.getBalance() > 10000);  // 是不是所有人余额都 > 1万？

boolean hasYoung = customers.stream()
    .anyMatch(c -> c.getAge() < 30);  // 有没有年轻人？
```

### 你在银行里的真实用法

```java
// 场景：从查询结果中筛选出活跃客户并导出
public List<CustomerReportVO> generateActiveReport(List<Customer> allCustomers) {
    return allCustomers.stream()
        .filter(c -> "ACTIVE".equals(c.getStatus()))     // 只要活跃的
        .filter(c -> c.getBalance().compareTo(BigDecimal.ZERO) > 0)  // 有余额的
        .sorted(Comparator.comparing(Customer::getBalance).reversed())  // 按余额降序
        .limit(100)  // 只要前100名
        .map(c -> new CustomerReportVO(c.getId(), c.getName(), c.getBalance()))
        .collect(Collectors.toList());
}
```

---

## ✅ 第 1-4 周自查清单

### 面向对象
- [ ] 能写出有 private 字段 + getter/setter + 构造方法的类
- [ ] 能解释封装、继承、多态，并举出例子
- [ ] 知道什么时候用接口，什么时候用抽象类

### 集合框架
- [ ] 不看文档能写出 ArrayList 的增删改查+遍历
- [ ] 不看文档能写出 HashMap 的增删改查+遍历
- [ ] 知道 ArrayList vs LinkedList、HashMap vs TreeMap 的区别

### 泛型
- [ ] 能写出带泛型的类和方法
- [ ] 理解 `<T>`、`<? extends T>`、`<? super T>` 的含义

### Stream/Lambda
- [ ] 能把一个 for 循环改写为 stream 流
- [ ] 会用 filter、map、sorted、collect 的组合拳
- [ ] 会用 groupingBy 做分组

---

> 下一篇：[/posts/java-multithreading-jvm/](Java多线程与JVM深度指南) — 线程池、锁、GC
