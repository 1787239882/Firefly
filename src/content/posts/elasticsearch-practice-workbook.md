---
title: "ElasticSearch 实例练习"
published: 2026-06-18
description: "ElasticSearch 配套练习册，覆盖索引、Mapping、CRUD、查询 DSL、聚合分析和实操题。"
image: ../../assets/images/post-covers/elasticsearch-tutorial.webp
tags: ["ElasticSearch", "练习", "实例", "代码学习笔记", "搜索引擎"]
category: "工具速查"
---

# ElasticSearch 实例练习

> 本文是 ElasticSearch从零到上手 的配套练习册，包含 CRUD、Mapping、查询 DSL、聚合分析等实操题目。

---

## 一、环境准备和基础CURD
要求：
1. 创建一个名为products的索引，向该索引写入三条文档，字段至少包含：
	- name(商品名称，文本)
	- category（分类，关键字）
	- price（价格）
	- stock（库存，整数）
	- create_time（创建时间，日期）
2. 根据文档_id查询其中一条记录，修改其中一条文档的price，删除一条文档。
```json
PUT /products{
	"mappings":{
		"properties":{
			"name":{"type":"text"},
			"category":{"type":"keyword"},
			"price":{"type":"float"},
			"stock":{"type":"integer"},
			"create_time":{"type":"date"}
		}
	}
}#创建mappings索引

POST /products/_doc/1
{
	"name":"智能手机",
	"category":"电子产品",
	"price":2999.00,
	"stock":5,
	"create_time":"2024-04-01T10:00:00z"
}
#重复三次上述操作，写入三个不同id的文档

GET /products/_doc/1
#根据id查询文档

POST /products/_update/2{
	"doc":{
	"price":2333
	}
}
#修改2号文档的价格

DELETE /products/_doc/2
#删除2号文档，如果2号文档不存在则返回"result":"not_found"

```
## 二、Mapping与数据类型
要求：
1. 在创建索引books时显示定义Mapping，至少包含
	- title：text类型，使用ik_max_word分词器
	- author：keyword类型
	- publish_date：date类型
	- price：float类型
	- is_available：boolean类型
2. 解释text和keyword的区别
3. 常使用term查询title字段，观察是否能命中并解释原因。
```json

POST /books{
	"mappings":{
		"properties":{
			"title":{
				"type":"text",
				"analyzer":"ik_max_word"
			},
			"author":{
				"type":"keyword"
			},
			"publish_date":{
				"type":"date"
			},
			"price":{
				"type":"float"
			},
			"is_available":{
				"type":"boolean"
			}
		}
	}
}

POST /books/_doc{
	"title":"ElasticSearch实战指南",
	"author":"ErHaoXs",
	"publish_date":"2026-06-17",
	"is_available":"true"
}
# 写入

GET /books/_search{
	"qeury":{
		"term":{
			"title":"ElasticSearch"
		}
	}
}
# text会被分词器拆分，适合用于全文检索，查询时通常用match
# keyword不分词，整体存储，适合精确匹配，排序，聚合，查询时通常用term
# 对于title这种text字段使用term查询时，必须命中分词后的某个token才能查到，单独某个词可能命中，完整句子则不会

```

## 三、常用查询DSL

1. 在products索引上完成以下查询
	- 查询name字段包含“手机”的文档
	- 查询category字段精确等于“电子产品”的文档
	- 查询price在100到500之间的文档
	- 组合查询分类为“电子产品”且价格大于200，且名称包含“无线”的文档
	- 实现分页查询，每页2条，返回第2页

```json
GET /products/_search{
	"query":{
		"match":{
			"name":"手机"
		}
	}
}
GET /products/_search{
	"query":{
		"term":{
			"category":"电子产品"
		}
	}
}
GET /products/_search{
	"query":{
		"range":{
			"price":{
				"gte":100,
				"lte":500
			}
		}
	}
}

GER /products/_search{
	"query":{
		"bool":{
			"must":[
				{"term":{"category":"电子产品"}},
				{"range":{"price":{"gt":200}}},
				{"match":{"name":"无线"}}
			]
		}
	}
}

GET /products/_serach{
	"query":{
		"match_all":{}
	},
	"from":2,
	"size":2
}
# 分页公式from =（page-1）*size，从第几条开始（从第一页算起）
# size=返回几条
```

## 四、聚合分析
要求：
1. 在products索引上完成：
	- 按category字段进行分组统计，统计每个分类下的商品数量
	- 计算所有商品的平均价格
	- 统计库存综合
	- 在每个分类下，分别计算平均价格

```json

GET /products/_search
{
	"size":0,
	"aggs":
	{
		"by_category":
		{
			"terms":
			{
				"field":"category"
			},
		"aggs":
		{
			"avg_price_in_category":
				{
					"avg":
					{
						"field":"price"
					}
				}
		}
		}
	},
	"avg_price_all":{
		"avg":{
			"field":"price"
		}
	},
	"total_stock":{
		"sum":{
			"field":"stock"
		}
	}
}
# size=0表明不返回原始文档，只返回聚合结果
```

## 五、索引和集群基础管理
要求：
1. 查看当前集群健康状态，解释status字段的green yellow red含义
2. 查看products索引的mapping和settings
3. 为products索引添加一个字段tags，类型为keyword
4. 解释一下啊为什么不能直接删除已有字段或修改已有字段类型
5. 

- ```json
  
  GET /_cluster/health
  
  # green代表所有主分片和副本分片都正常
  # yellow代表所有主分片正常，但部分副本分片未分配（常见于单节点集群）
  # red代表至少有一个主分片未分配，数据可能不完整
  
  GET /products/_mapping
  GET /products/_settings
  
  PUT /products/_mapping{
	  "properties":{
		  "tags":{
			  "type":"keyword"
		  }
	  }
  }
  
  # ES底层基于Lucene，Lucene的段（segment）是不可变的，字段类型决定了数据如何被分词，索引和存储，一旦写入就固化在倒排索引中。如果要修改就要重建索引reindex
  
  
  ```
