---
title: ElasticSearch 从零到上手
published: 2026-06-16
description: 零基础 ElasticSearch 入门教程，涵盖核心概念、CRUD、搜索、聚合、中文分词与实战
image: ../../assets/images/post-covers/elasticsearch-tutorial.webp
tags: [ElasticSearch, 搜索引擎, 教程, 中文分词]
category: 工具速查
---

> 本文档专为零基础小白编写，每一步都有详细解释和示例。读完这篇，你就能在工作中用 ElasticSearch 了。

---

## 目录

1. [什么是 ElasticSearch？](#一什么是-elasticsearch)
2. [为什么需要它？](#二为什么需要它)
3. [核心概念（用人话讲）](#三核心概念用人话讲)
4. [安装 ElasticSearch](#四安装-elasticsearch)
5. [REST API 快速入门](#五rest-api-快速入门)
6. [增删改查（CRUD）](#六增删改查crud)
7. [搜索实战](#七搜索实战)
8. [高级查询](#八高级查询)
9. [聚合分析](#九聚合分析)
10. [中文分词与拼音搜索](#十中文分词与拼音搜索)
11. [实战：构建一个商品搜索](#十一实战构建一个商品搜索)
12. [常见问题排查](#十二常见问题排查)
13. [速查表](#十三速查表)

---

## 一、什么是 ElasticSearch？

### 一句话解释

**ElasticSearch（简称 ES）就是一个超级强大的搜索引擎。**

你用过百度、Google 对吧？输入几个关键词，秒出结果——ES 就是做这个的，只不过它是给你自己的数据用的。

### 换个角度理解

想象你有一个巨大的 Excel 表格，里面有一百万行数据。你想找到"所有包含'苹果'的行"：

- **Excel 的做法**：逐行扫描，一行一行比对 → 巨慢无比 😫
- **ES 的做法**：提前建好"目录"（索引），查的时候直接翻目录 → 毫秒级返回 🚀

### 它到底能干什么？

| 场景 | 说明 |
|------|------|
| 🔍 **全文搜索** | 商品搜索、文章搜索、文档搜索 |
| 📊 **日志分析** | ELK 技术栈（ElasticSearch + Logstash + Kibana） |
| 📈 **数据统计** | 实时聚合分析，亿级数据秒出报表 |
| 🗺️ **地理位置搜索** | "搜索我附近 5 公里内的餐厅" |
| 💡 **自动补全** | 搜索框输入 "苹" → 提示 "苹果手机"、"苹果耳机" |

---

## 二、为什么需要它？

### 传统数据库搜索的痛点

假设你用 MySQL 存了 1000 万条商品数据，用户想搜 "苹果手机"：

```sql
SELECT * FROM products WHERE name LIKE '%苹果%' OR description LIKE '%苹果%';
```

问题：
1. **`LIKE '%苹果%'` 用不上索引** → 全表扫描，巨慢
2. **搜不到 "iPhone"** → 虽然 iPhone 也是苹果手机，但没做同义词
3. **搜不到 "apple 手机"** → 用户打错了（apple vs 苹果），容错为零
4. **"红苹果" 和 "苹果红"** → 无法按相关性排序

### ES 怎么解决？

```json
// ES 搜索请求
GET /products/_search
{
  "query": {
    "match": {
      "name": "苹果手机"
    }
  }
}
```

✅ **毫秒级返回** — 倒排索引
✅ **自动分词** — "苹果手机" → ["苹果", "手机"]，两个词都匹配
✅ **相关性排序** — 最相关的结果排第一
✅ **容错** — 拼音、同义词、拼写纠错 全支持
✅ **高亮** — 匹配的关键词自动高亮

---

## 三、核心概念（用人话讲）

### 1. Index（索引）≈ 数据库的表

> 一个 Index 就是一个"文档的集合"，相当于 MySQL 里的一张表。

```
MySQL:  Database → Table  → Row     → Column
ES:    无此概念 → Index  → Document → Field
```

**示例**：
- `products` index → 存商品数据
- `users` index → 存用户数据
- `orders` index → 存订单数据

### 2. Document（文档）≈ 数据库的一行

> 一条数据就是一个 Document，用 JSON 格式表示。

```json
{
  "id": 1,
  "name": "iPhone 15 Pro",
  "price": 7999,
  "brand": "Apple",
  "description": "苹果最新旗舰手机，A17 Pro 芯片"
}
```

### 3. Field（字段）≈ 数据库的列

> Document 里的每个属性就是一个 Field。

| Field | 类型 | 说明 |
|-------|------|------|
| `name` | text | 会分词，用于全文搜索 |
| `price` | integer | 用于范围过滤、排序 |
| `brand` | keyword | 不分词，用于精确匹配 |

### 4. Shard（分片）— 数据分块

> 一个 Index 太大了怎么办？切成几块（Shard），分散存到不同机器上。

```
Index "products" (1000万条数据)
  ├── 分片 0: 0 ~ 333万条
  ├── 分片 1: 333万 ~ 666万条
  └── 分片 2: 666万 ~ 1000万条
```

**好处**：
- 水平扩展 — 数据多了就加机器
- 并行搜索 — 三个分片同时查，各查 1/3

### 5. Replica（副本）— 数据备份

> 每个分片的"复制品"，防止数据丢失，也分摊查询压力。

```
主分片 0  →  副本分片 0（在另一台机器上）
主分片 1  →  副本分片 1（在另一台机器上）
```

- 主分片挂了 → 副本顶上
- 副本也可以处理查询 → 吞吐量翻倍

### 6. 一张图理解全部

```
┌─────────────────────────────────────────────────┐
│                    Cluster（集群）                │
│  ┌──────────────────┐  ┌──────────────────┐     │
│  │     Node 1       │  │     Node 2       │     │
│  │                  │  │                  │     │
│  │  ┌────────────┐  │  │  ┌────────────┐  │     │
│  │  │ Shard 0    │  │  │  │ Shard 0    │  │     │
│  │  │ (主分片)   │  │  │  │ (副本分片)  │  │     │
│  │  └────────────┘  │  │  └────────────┘  │     │
│  │                  │  │                  │     │
│  │  ┌────────────┐  │  │  ┌────────────┐  │     │
│  │  │ Shard 1    │  │  │  │ Shard 1    │  │     │
│  │  │ (副本分片)  │  │  │  │ (主分片)   │  │     │
│  │  └────────────┘  │  │  └────────────┘  │     │
│  └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────┘
```

### 7. 倒排索引 — ES 快的核心原因

> **正排索引**（MySQL）：文档 → 词（我知道这篇文章里有哪些词）
> **倒排索引**（ES）：词 → 文档（我知道这个词出现在哪些文档里）

**人话版**：

你买了一本食谱，要找"所有包含辣椒的菜"。

**MySQL（正排索引）**：从第一道菜翻到最后一道，找哪些菜名或食材里含"辣椒" → 翻完整本书 🔴

**ES（倒排索引）**：书的最后有一个"食材索引"：
```
辣椒 → 第 3页、第15页、第42页、第78页...
```
直接翻到对应页 → 秒出结果 🟢

**倒排索引的结构**：

```
词条(Term)      →  文档列表(Posting List)
────────────────────────────────────────
苹果            →  [doc1, doc3, doc7]
手机            →  [doc1, doc2, doc5, doc7]
iPhone          →  [doc3, doc8]
华为            →  [doc2, doc5]
```

搜索 "苹果手机" → 先分词得到 ["苹果", "手机"] → 查倒排索引 → 取交集 → [doc1, doc7] 就是结果！

---

## 四、安装 ElasticSearch

### 方式一：Docker（最推荐 ✅）

最简单的安装方式，一条命令搞定。

```bash
# 1. 创建网络（让 ES 和 Kibana 通信）
docker network create elastic

# 2. 拉取并启动 ElasticSearch
docker run -d \
  --name es \
  --net elastic \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0

# 3. 验证是否启动成功
curl http://localhost:9200
```

如果看到类似这样的输出就成功了：

```json
{
  "name": "e9f3b2c1a4d5",
  "cluster_name": "docker-cluster",
  "version": {
    "number": "8.12.0"
  },
  "tagline": "You Know, for Search"
}
```

**可选：安装 Kibana（ES 的可视化界面）**

```bash
docker run -d \
  --name kibana \
  --net elastic \
  -p 5601:5600 \
  -e "ELASTICSEARCH_HOSTS=http://es:9200" \
  docker.elastic.co/kibana/kibana:8.12.0
```

然后打开浏览器访问 `http://localhost:5601`。

> **Kibana 的 Dev Tools** 是本教程的核心工具。所有 ES 命令都可以在这里运行，超方便！

### 方式二：Mac（Homebrew）

```bash
brew tap elastic/tap
brew install elastic/tap/elasticsearch-full

# 启动
elasticsearch

# 验证
curl http://localhost:9200
```

### 方式三：Linux 直接安装

```bash
# 下载
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.12.0-linux-x86_64.tar.gz

# 解压
tar -xzf elasticsearch-8.12.0-linux-x86_64.tar.gz
cd elasticsearch-8.12.0

# 启动
./bin/elasticsearch
```

### 安装后验证清单

```bash
# ✅ 检查 ES 是否在运行
curl http://localhost:9200

# ✅ 查看集群健康状态
curl http://localhost:9200/_cluster/health

# ✅ 查看有哪些索引
curl http://localhost:9200/_cat/indices?v
```

---

## 五、REST API 快速入门

ES 的所有操作都通过 REST API（HTTP 请求）完成。你只需要浏览器或者终端。

### 基本格式

```
<HTTP方法> <服务器地址>/<API路径>

GET     http://localhost:9200/index名/_search        # 搜索
POST    http://localhost:9200/index名/_doc           # 新增
PUT     http://localhost:9200/index名/_doc/文档ID     # 创建/替换
DELETE  http://localhost:9200/index名/_doc/文档ID     # 删除
```

### 用 curl 调用

```bash
# 最简单的搜索（查询所有）
curl -X GET "localhost:9200/products/_search?pretty"
```

### 用 Kibana Dev Tools（强烈推荐！⭐）

打开 `http://localhost:5601` → 左侧菜单 → **Management** → **Dev Tools**。

你会看到一个分左右两栏的界面。左边写命令，右边显示结果。

```
GET /_cluster/health
```

花 5 分钟玩一下 Dev Tools，后面所有例子都能在这里直接跑。

---

## 六、增删改查（CRUD）

### 准备工作：创建索引

可以先不创建索引，ES 会在你插入第一条数据时自动创建。但手动创建能更好地控制字段类型。

```json
// 创建一个 products 索引
PUT /products
{
  "settings": {
    "number_of_shards": 3,      // 3 个主分片
    "number_of_replicas": 1     // 每个主分片 1 个副本
  },
  "mappings": {
    "properties": {
      "name":        { "type": "text"     },  // 会分词，用于搜索
      "brand":       { "type": "keyword"  },  // 不分词，用于精确匹配/聚合
      "price":       { "type": "integer"  },  // 整数
      "description": { "type": "text"     },
      "created_at":  { "type": "date"     },  // 日期
      "in_stock":    { "type": "boolean"  }   // 布尔值
    }
  }
}
```

**字段类型速查**：

| 类型 | 用途 | 示例 |
|------|------|------|
| `text` | 全文搜索，**会被分词** | 文章内容、商品描述 |
| `keyword` | 精确匹配，**不分词** | 标签、状态码、邮箱 |
| `integer` / `long` | 整数 | 价格（分）、数量 |
| `float` / `double` | 小数 | 评分、折扣 |
| `boolean` | 真/假 | 是否上架 |
| `date` | 日期 | 2024-01-15 |
| `geo_point` | 地理坐标 | 经纬度 |

> **text vs keyword 的区别很重要！** 后面搜索章节会详细讲。

### C — 创建/新增文档

```json
// 新增一条文档（ES 自动生成 ID）
POST /products/_doc
{
  "name": "iPhone 15 Pro",
  "brand": "Apple",
  "price": 7999,
  "description": "苹果最新旗舰手机，A17 Pro 芯片，钛金属边框",
  "in_stock": true,
  "created_at": "2024-01-15"
}

// 新增一条文档（指定 ID）
PUT /products/_doc/1
{
  "name": "MacBook Pro 14",
  "brand": "Apple",
  "price": 14999,
  "description": "M3 Pro 芯片，Liquid Retina XDR 显示屏",
  "in_stock": true,
  "created_at": "2024-01-10"
}

// 批量新增（一条命令插入多条）
POST /_bulk
{"index": {"_index": "products", "_id": "2"}}
{"name": "Mate 60 Pro", "brand": "华为", "price": 6999, "in_stock": true, "created_at": "2024-01-12"}
{"index": {"_index": "products", "_id": "3"}}
{"name": "小米14", "brand": "小米", "price": 3999, "in_stock": false, "created_at": "2024-01-14"}
{"index": {"_index": "products", "_id": "4"}}
{"name": "iPad Air", "brand": "Apple", "price": 4799, "in_stock": true, "created_at": "2024-01-08"}
```

**注意 `_bulk` API 的格式**：每行数据前面要有一行 `{"index": {...}}` 描述操作，两行之间用换行符分隔，**不是 JSON 数组**。

### R — 查询文档（按 ID）

```json
// 查一条（按 ID）
GET /products/_doc/1

// 查所有（默认返回 10 条）
GET /products/_search
{
  "query": {
    "match_all": {}
  }
}
```

### U — 更新文档

```json
// 更新部分字段（只改 price）
POST /products/_update/1
{
  "doc": {
    "price": 13999
  }
}

// 注意：ES 的更新其实是"标记删除旧文档 + 插入新文档"
```

### D — 删除文档

```json
// 删除一条
DELETE /products/_doc/1

// 删除整个索引（慎用！）
DELETE /products
```

### 看看索引里有什么

```json
// 查看索引的字段映射
GET /products/_mapping

// 查看索引的设置
GET /products/_settings

// 查看文档数量
GET /products/_count
```

---

## 七、搜索实战

### 7.1 最简单的搜索：match

```json
// 在 name 字段里搜索 "苹果手机"
GET /products/_search
{
  "query": {
    "match": {
      "name": "苹果手机"
    }
  }
}
```

**发生了什么？**
1. ES 把 "苹果手机" 拆成 ["苹果", "手机"]
2. 去倒排索引里查包含 "苹果" 或 "手机" 的文档
3. 按相关性打分排序

### 7.2 精确匹配：term

```json
// 精确查询 brand 是 "Apple" 的（不分词）
GET /products/_search
{
  "query": {
    "term": {
      "brand": "Apple"
    }
  }
}
```

**match vs term 的区别（重要！⭐）**：

| | match | term |
|------|-------|------|
| 对搜索词 | **会分词** | **不会分词** |
| 适用字段类型 | text（全文搜索字段） | keyword（精确值字段） |
| 类比 | "包含这个词就行" | "必须完全一样" |

```json
// ❌ 错误用法：用 match 查 keyword
// 这个也能查到，但语义不对

// ✅ 正确：
// text 字段用 match
GET /products/_search
{ "query": { "match": { "name": "iPhone" } } }

// keyword 字段用 term
GET /products/_search
{ "query": { "term": { "brand": "Apple" } } }

// ⚠️ 常见坑：term 查 text 字段
GET /products/_search
{ "query": { "term": { "name": "iPhone" } } }
// 可能查不到！因为 text 字段存的是分词后的结果
// "iPhone 15 Pro" 被分成了 ["iphone", "15", "pro"]
// term 查 "iPhone"（大写I）匹配不到小写的 "iphone"
```

### 7.3 多字段搜索：multi_match

```json
// 同时在 name 和 description 里搜
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "苹果手机",
      "fields": ["name", "description"]
    }
  }
}

// 给不同字段不同权重（name 比 description 重要 3 倍）
GET /products/_search
{
  "query": {
    "multi_match": {
      "query": "苹果手机",
      "fields": ["name^3", "description"]
    }
  }
}
```

### 7.4 短语匹配：match_phrase

```json
// 必须完全按顺序出现 "苹果手机"
GET /products/_search
{
  "query": {
    "match_phrase": {
      "name": "苹果手机"
    }
  }
}
```

| match | match_phrase |
|-------|-------------|
| "苹果手机" → 找包含 苹果 或 手机 的 | "苹果手机" → 必须连在一起且顺序一致 |
| "手机苹果新品" 也能匹配 ✅ | "手机苹果新品" 不能匹配 ❌ |

### 7.5 分页查询

```json
GET /products/_search
{
  "query": { "match_all": {} },
  "from": 0,     // 从第几条开始（类似 offset）
  "size": 10     // 返回几条（类似 limit）
}
```

```json
// 第 1 页: from=0, size=10
// 第 2 页: from=10, size=10
// 第 3 页: from=20, size=10
```

### 7.6 只返回需要的字段

```json
GET /products/_search
{
  "query": { "match_all": {} },
  "_source": ["name", "price"]   // 只要 name 和 price
}
```

### 7.7 排序

```json
GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "price": "asc" },       // 价格升序（便宜在前）
    { "created_at": "desc" }  // 如果价格相同，按创建时间降序
  ]
}
```

---

## 八、高级查询

### 8.1 bool 查询 — 组合多个条件

**这就是 ES 的 AND/OR/NOT！** 用熟了能解决 90% 的搜索需求。

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [                    // ✅ 必须满足（AND）
        { "match": { "name": "手机" } }
      ],
      "must_not": [                // ❌ 必须不满足（NOT）
        { "term": { "brand": "Apple" } }
      ],
      "should": [                  // 🔶 应该满足（OR，加分项）
        { "term": { "in_stock": true } }
      ],
      "filter": [                  // 🔵 过滤（不影响分数，只过滤）
        { "range": { "price": { "gte": 3000, "lte": 8000 } } }
      ]
    }
  }
}
```

**人话翻译**：

> 找手机产品，**但不能是** Apple 的，**价格**在 3000-8000 之间。结果是**有库存的更好**（如果有存货就排在前面，没货的也会返回，但排序靠后）。

### 四个关键词：

| 关键词 | 作用 | 影响分数？ |
|--------|------|-----------|
| `must` | 必须满足（AND） | ✅ 影响 |
| `filter` | 必须满足（过滤） | ❌ 不影响 |
| `should` | 应该满足（OR） | ✅ 影响 |
| `must_not` | 必须不（NOT） | ❌ 不影响 |

> **小技巧**：不需要影响分数的条件用 `filter`，性能比 `must` 好！

### 8.2 范围查询

```json
// 价格在 3000 到 8000 之间
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 3000,   // ≥ 3000
        "lte": 8000    // ≤ 8000
      }
    }
  }
}
```

| 关键词 | 意思 |
|--------|------|
| `gte` | ≥ (greater than or equal) |
| `gt` | > (greater than) |
| `lte` | ≤ (less than or equal) |
| `lt` | < (less than) |

```json
// 日期范围：2024年1月之后的
{
  "query": {
    "range": {
      "created_at": {
        "gte": "2024-01-01"
      }
    }
  }
}
```

### 8.3 通配符搜索

```json
// 搜索以 "iphone" 开头的
GET /products/_search
{
  "query": {
    "wildcard": {
      "name": "iphone*"
    }
  }
}
```

- `*` 匹配任意多个字符
- `?` 匹配单个字符

> ⚠️ 通配符查询比较慢，尽量少用！

### 8.4 模糊搜索（容错）

```json
// 用户把 iPhone 打成了 "iphne"（少了个 o）
GET /products/_search
{
  "query": {
    "fuzzy": {
      "name": {
        "value": "iphne",
        "fuzziness": "AUTO"   // 自动计算允许几个字符不同
      }
    }
  }
}
```

---

## 九、聚合分析

聚合（Aggregation）是 ES 的另一个杀手功能——不光能搜，还能做统计分析。

### 9.1 分组统计：terms

```json
// 按品牌分组，统计每个品牌有多少商品
GET /products/_search
{
  "size": 0,        // 不返回文档，只要统计结果
  "aggs": {
    "by_brand": {   // 自己起的名字，随便取
      "terms": {
        "field": "brand"
      }
    }
  }
}
```

返回结果：

```json
{
  "aggregations": {
    "by_brand": {
      "buckets": [
        { "key": "Apple", "doc_count": 2 },
        { "key": "华为",   "doc_count": 1 },
        { "key": "小米",   "doc_count": 1 }
      ]
    }
  }
}
```

### 9.2 统计指标：stats

```json
// 价格统计：平均值、最大、最小、总和
GET /products/_search
{
  "size": 0,
  "aggs": {
    "price_stats": {
      "stats": {
        "field": "price"
      }
    }
  }
}
```

返回结果：

```json
{
  "aggregations": {
    "price_stats": {
      "count": 4,
      "min": 3999,
      "max": 14999,
      "avg": 7949,
      "sum": 31796
    }
  }
}
```

### 9.3 嵌套聚合

```json
// 先按品牌分组，再在每组内算平均价格
GET /products/_search
{
  "size": 0,
  "aggs": {
    "by_brand": {
      "terms": { "field": "brand" },
      "aggs": {
        "avg_price": {
          "avg": { "field": "price" }
        }
      }
    }
  }
}
```

### 9.4 常用聚合速查

| 聚合类型 | 用途 | 示例 |
|---------|------|------|
| `terms` | 分组计数 | 品牌分布、分类统计 |
| `avg` | 平均值 | 平均价格 |
| `sum` | 总和 | 总销售额 |
| `min` / `max` | 最小/最大值 | 最便宜/最贵的商品 |
| `stats` | 一网打尽 | count+min+max+avg+sum |
| `cardinality` | 去重计数 | 有多少个不同品牌 |
| `date_histogram` | 按时间分组 | 每天/每月订单量 |
| `range` | 按区间分组 | 0-100、100-500、500+ |

---

## 十、中文分词与拼音搜索

### 10.1 为什么需要中文分词？

ES 默认分词器不认识中文，会把 "我爱北京天安门" 拆成：

```
默认分词：我 / 爱 / 北 / 京 / 天 / 安 / 门
理想分词：我 / 爱 / 北京 / 天安门
```

所以**一定要装中文分词插件**！

### 10.2 安装 IK 分词器

```bash
# 进入 ES 容器（如果用 Docker）
docker exec -it es bash

# 安装 IK 分词器
./bin/elasticsearch-plugin install https://get.infini.cloud/elasticsearch/analysis-ik/8.12.0

# 退出并重启
exit
docker restart es
```

### 10.3 测试分词效果

```json
// 用 IK 分词器看看效果
GET /_analyze
{
  "analyzer": "ik_max_word",
  "text": "我爱北京天安门"
}
```

返回结果：

```json
{
  "tokens": [
    { "token": "我" },
    { "token": "我爱" },
    { "token": "爱" },
    { "token": "北京" },
    { "token": "天安门" },
    { "token": "天安" },
    { "token": "门" }
  ]
}
```

### IK 的两种模式：

| 模式 | 效果 | 适用场景 |
|------|------|---------|
| `ik_max_word` | 最大粒度，拆出所有可能的词 | 索引时用（写数据） |
| `ik_smart` | 粗粒度，只拆最可能的词 | 搜索时用（查数据） |

### 10.4 创建支持中文分词的索引

```json
PUT /products_zh
{
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word",     // 写入时用细粒度分词
        "search_analyzer": "ik_smart"  // 搜索时用粗粒度分词
      }
    }
  }
}
```

### 10.5 拼音搜索（搜 "pingguo" 能找到 "苹果"）

安装拼音分词器：

```bash
docker exec -it es bash
./bin/elasticsearch-plugin install https://get.infini.cloud/elasticsearch/analysis-pinyin/8.12.0
exit
docker restart es
```

创建支持拼音的索引：

```json
PUT /products_pinyin
{
  "settings": {
    "analysis": {
      "analyzer": {
        "ik_pinyin_analyzer": {
          "type": "custom",
          "tokenizer": "ik_max_word",
          "filter": ["pinyin_filter"]
        }
      },
      "filter": {
        "pinyin_filter": {
          "type": "pinyin",
          "keep_full_pinyin": false,
          "keep_joined_full_pinyin": true,
          "keep_original": true,         // 保留原始中文
          "remove_duplicated_term": true
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_pinyin_analyzer",
        "search_analyzer": "ik_smart"
      }
    }
  }
}
```

现在搜 "pingguo" 也能找到 "苹果" 了！

---

## 十一、实战：构建一个商品搜索

### 需求

做一个简单的商品搜索引擎：
1. 用户输入关键词搜商品
2. 可以按价格区间过滤
3. 可以按品牌筛选
4. 搜索结果高亮
5. 可以按价格排序

### 第 1 步：创建索引

```json
PUT /shop_products
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart",
        "fields": {
          "keyword": { "type": "keyword" }    // 子字段，用于精确排序
        }
      },
      "brand":       { "type": "keyword" },
      "category":    { "type": "keyword" },
      "price":       { "type": "integer" },
      "description": {
        "type": "text",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_smart"
      },
      "sales":       { "type": "integer" },    // 销量
      "rating":      { "type": "float"   },    // 评分
      "created_at":  { "type": "date"    }
    }
  }
}
```

### 第 2 步：插入测试数据

```json
POST /_bulk
{"index": {"_index": "shop_products"}}
{"name": "Apple iPhone 15 Pro Max", "brand": "Apple", "category": "手机", "price": 9999, "description": "苹果最新超大杯旗舰手机，钛金属设计，A17 Pro 芯片，4800万像素相机", "sales": 50000, "rating": 4.9, "created_at": "2024-09-15"}
{"index": {"_index": "shop_products"}}
{"name": "华为 Mate 60 Pro", "brand": "华为", "category": "手机", "price": 6999, "description": "华为自研麒麟芯片，卫星通话，超强拍照", "sales": 80000, "rating": 4.8, "created_at": "2024-08-29"}
{"index": {"_index": "shop_products"}}
{"name": "小米 14 Ultra", "brand": "小米", "category": "手机", "price": 5999, "description": "徕卡光学镜头，骁龙8 Gen 3，120W快充", "sales": 30000, "rating": 4.7, "created_at": "2024-10-01"}
{"index": {"_index": "shop_products"}}
{"name": "Apple iPhone 15", "brand": "Apple", "category": "手机", "price": 5999, "description": "苹果入门旗舰，A16 芯片，灵动岛设计", "sales": 100000, "rating": 4.6, "created_at": "2024-09-15"}
{"index": {"_index": "shop_products"}}
{"name": "OPPO Find X7 Ultra", "brand": "OPPO", "category": "手机", "price": 5999, "description": "哈苏影像，双潜望长焦，骁龙8 Gen 3", "sales": 15000, "rating": 4.5, "created_at": "2024-07-01"}
{"index": {"_index": "shop_products"}}
{"name": "华为 Pura 70 Ultra", "brand": "华为", "category": "手机", "price": 9999, "description": "伸缩摄像头，卫星通信，昆仑玻璃", "sales": 60000, "rating": 4.8, "created_at": "2024-04-18"}
{"index": {"_index": "shop_products"}}
{"name": "vivo X100 Pro", "brand": "vivo", "category": "手机", "price": 4999, "description": "蔡司超级长焦，天玑9300，蓝心大模型", "sales": 20000, "rating": 4.6, "created_at": "2024-05-01"}
{"index": {"_index": "shop_products"}}
{"name": "MacBook Pro 14 M3", "brand": "Apple", "category": "电脑", "price": 14999, "description": "Apple M3 Pro 芯片，18小时续航，Liquid Retina XDR 显示屏", "sales": 20000, "rating": 4.9, "created_at": "2024-06-01"}
```

### 第 3 步：核心搜索接口

```json
// 🔥 完整搜索接口（直接复制到 Kibana Dev Tools 运行）
GET /shop_products/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "苹果手机拍照",
            "fields": ["name^3", "description^1"]
          }
        }
      ],
      "filter": [
        { "term": { "category": "手机" } },
        { "range": { "price": { "gte": 5000, "lte": 10000 } } },
        { "range": { "rating": { "gte": 4.5 } } }
      ]
    }
  },
  "sort": [
    { "sales": "desc" },
    { "rating": "desc" },
    { "_score": "desc" }
  ],
  "from": 0,
  "size": 10,
  "_source": ["name", "brand", "price", "sales", "rating"],
  "highlight": {
    "fields": {
      "name": {},
      "description": {}
    }
  }
}
```

**返回结果解读**：

```json
{
  "hits": {
    "total": { "value": 3 },   // 总共匹配 3 条
    "hits": [
      {
        "_score": 8.5,
        "_source": {
          "name": "Apple iPhone 15 Pro Max",
          "price": 9999,
          ...
        },
        "highlight": {
          "name": ["Apple <em>iPhone</em> 15 Pro Max"],
          "description": ["苹果最新超大杯旗舰<em>手机</em>，... <em>拍照</em>..."]
        }
      }
    ]
  }
}
```

- `_score`：相关性评分（越高越匹配）
- `highlight`：匹配词用 `<em>` 标签包起来，前端渲染成高亮

### 第 4 步：聚合分析（品牌筛选器 + 价格区间）

```json
GET /shop_products/_search
{
  "query": {
    "match": { "name": "手机" }
  },
  "size": 0,
  "aggs": {
    "brands": {
      "terms": { "field": "brand", "size": 10 }
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          { "to": 3000 },
          { "from": 3000, "to": 6000 },
          { "from": 6000, "to": 10000 },
          { "from": 10000 }
        ]
      }
    },
    "avg_price": {
      "avg": { "field": "price" }
    }
  }
}
```

这就实现了电商网站的"筛选器"功能！

---

## 十二、常见问题排查

### 问题 1：为什么搜不到数据？

```json
// ✅ 先确认数据确实在
GET /shop_products/_count

// ✅ 看一条数据长什么样
GET /shop_products/_search
{ "query": { "match_all": {} }, "size": 1 }

// ✅ 分析一下搜索词是怎么被分词的
GET /_analyze
{
  "analyzer": "ik_smart",
  "text": "你搜的词"
}
```

### 问题 2：term 查不到 text 字段

```json
// ❌ 错误
GET /products/_search
{ "query": { "term": { "name": "iPhone" } } }

// ✅ 正确：text 字段用 match
GET /products/_search
{ "query": { "match": { "name": "iPhone" } } }

// ✅ 或者：给字段加 .keyword 子字段
GET /products/_search
{ "query": { "term": { "name.keyword": "iPhone 15 Pro" } } }
```

### 问题 3：数据一插入就能搜到吗？

**默认是 1 秒**（refresh_interval = 1s）。插入后等 1 秒再搜。

```json
// 立刻刷新索引（开发环境用，生产环境别滥用）
POST /shop_products/_refresh
```

### 问题 4：ES 占内存太大怎么办？

```bash
# 启动时限制 JVM 堆内存
docker run ... -e "ES_JAVA_OPTS=-Xms256m -Xmx256m" ...

# 规则：堆内存不超过物理内存的 50%，也不超过 32GB
```

### 问题 5：集群状态变 red 了

```json
// 查看健康状态
GET /_cluster/health

// 看哪些分片有问题
GET /_cat/shards?v

// 看未分配的分片
GET /_cat/shards?v&h=index,shard,prirep,state,unassigned.reason
```

- **Green** 🟢：一切正常
- **Yellow** 🟡：主分片正常，但副本没分配（单节点常见，不影响使用）
- **Red** 🔴：有主分片不可用（数据丢失，需紧急处理）

---

## 十三、速查表

### 索引操作

| 操作 | 命令 |
|------|------|
| 创建索引 | `PUT /index_name` |
| 删除索引 | `DELETE /index_name` |
| 查看所有索引 | `GET /_cat/indices?v` |
| 查看映射 | `GET /index_name/_mapping` |
| 查看设置 | `GET /index_name/_settings` |

### 文档 CRUD

| 操作 | 命令 |
|------|------|
| 新增(自动ID) | `POST /index_name/_doc` |
| 新增(指定ID) | `PUT /index_name/_doc/1` |
| 查询(ID) | `GET /index_name/_doc/1` |
| 更新 | `POST /index_name/_update/1` |
| 删除 | `DELETE /index_name/_doc/1` |
| 批量写入 | `POST /_bulk` |

### 搜索

| 操作 | 查询类型 |
|------|---------|
| 全文搜索 | `match` |
| 精确匹配 | `term` |
| 多字段 | `multi_match` |
| 短语匹配 | `match_phrase` |
| 组合条件 | `bool` |
| 范围过滤 | `range` |
| 模糊搜索 | `fuzzy` |
| 通配符 | `wildcard` |

### 聚合

| 操作 | 聚合类型 |
|------|---------|
| 分组计数 | `terms` |
| 平均值 | `avg` |
| 总和 | `sum` |
| 最大/最小 | `max` / `min` |
| 全统计 | `stats` |
| 去重计数 | `cardinality` |
| 时间分组 | `date_histogram` |

---

## 🎯 学习路线建议

1. **第 1 天**：搞定安装，跑通 CRUD，理解 index/document/field
2. **第 2 天**：搞懂 match vs term，熟练使用 bool 查询
3. **第 3 天**：学聚合，做两个统计报表
4. **第 4 天**：装 IK 分词器，做中文搜索
5. **第 5 天**：完整实现一个商品搜索 Demo

> 💡 **最重要的建议**：打开 Kibana Dev Tools，把本文档里的每个例子都亲手敲一遍！看 10 遍不如敲 1 遍。

---

## 📚 推荐资源

- [ElasticSearch 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [ElasticSearch 权威指南（中文）](https://www.elastic.co/guide/cn/elasticsearch/guide/current/index.html)
- Kibana Dev Tools — 你最好的练习场

---

> 最后更新：2026-06-16
> 有问题随时回来翻这篇笔记 🔖
