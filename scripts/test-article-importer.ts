import assert from "node:assert/strict";
import {
	buildImportedArticle,
	extractMarkdownTitle,
	parseTagInput,
	slugifyArticleTitle,
	stripFrontmatter,
} from "../src/utils/article-importer";

assert.equal(extractMarkdownTitle("# HBase 从零到上手\n正文", "fallback"), "HBase 从零到上手");
assert.equal(extractMarkdownTitle("正文", "fallback"), "fallback");
assert.equal(slugifyArticleTitle("ElasticSearch 实例练习!"), "elasticsearch-实例练习");
assert.deepEqual(parseTagInput("HBase, 大数据，练习\nNoSQL"), [
	"HBase",
	"大数据",
	"练习",
	"NoSQL",
]);
assert.equal(stripFrontmatter("---\ntitle: Old\n---\n\n# Body"), "# Body");

const article = buildImportedArticle({
	title: 'A "Quoted" Title',
	description: "desc",
	category: "工具速查",
	tags: ["md", "pdf"],
	sourceType: "md",
	sourceFileName: "note.md",
	body: "---\ntitle: Old\n---\n\n# Body",
	published: new Date("2026-06-18T00:00:00.000Z"),
});

assert.match(article, /title: "A \\"Quoted\\" Title"/);
assert.match(article, /published: 2026-06-18/);
assert.match(article, /tags: \["md", "pdf"\]/);
assert.match(article, /# Body/);

console.log("article-importer tests passed");
