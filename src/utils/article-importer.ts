export type ImportSourceType = "md" | "pdf";

export interface ArticleImportInput {
	title: string;
	description: string;
	category: string;
	tags: string[];
	sourceType: ImportSourceType;
	sourceFileName: string;
	body: string;
	published?: Date;
}

export function extractMarkdownTitle(markdown: string, fallback: string): string {
	const heading = markdown
		.split(/\r?\n/)
		.map((line) => line.trim())
		.find((line) => /^#\s+/.test(line));

	return heading?.replace(/^#\s+/, "").trim() || fallback;
}

export function slugifyArticleTitle(title: string): string {
	const normalized = title
		.normalize("NFKD")
		.toLowerCase()
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return normalized || "imported-article";
}

export function parseTagInput(input: string): string[] {
	return input
		.split(/[,，\n]/)
		.map((tag) => tag.trim())
		.filter(Boolean);
}

export function stripFrontmatter(markdown: string): string {
	if (!markdown.startsWith("---")) return markdown.trim();

	const end = markdown.indexOf("\n---", 3);
	if (end === -1) return markdown.trim();

	return markdown.slice(end + 4).trim();
}

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function escapeYamlString(value: string): string {
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildImportedArticle(input: ArticleImportInput): string {
	const published = formatDate(input.published || new Date());
	const tags = input.tags.map((tag) => `"${escapeYamlString(tag)}"`).join(", ");
	const description = input.description || `${input.title} 的导入文章`;
	const sourceNote =
		input.sourceType === "pdf"
			? `> 原始 PDF 文件：\`${input.sourceFileName}\`\n>\n> 这是一个附件型文章壳。请把 PDF 放到站点可访问的附件目录后，在正文里补充下载链接或摘要。`
			: "";
	const body = input.sourceType === "pdf" ? sourceNote : stripFrontmatter(input.body);

	return `---\ntitle: "${escapeYamlString(input.title)}"\npublished: ${published}\ndescription: "${escapeYamlString(description)}"\ntags: [${tags}]\ncategory: "${escapeYamlString(input.category || "未分类")}"\n---\n\n${body}\n`;
}
