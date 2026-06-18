import { type CollectionEntry, getCollection } from "astro:content";
import { removeFileExtension } from "@/utils/url-utils";

export async function getStaticPaths() {
	const posts = await getCollection("posts", ({ data }) => data.draft !== true);

	return posts.map((post) => ({
		params: { slug: removeFileExtension(post.id) },
		props: { post },
	}));
}

function formatDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function quote(value: string): string {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildFrontmatter(post: CollectionEntry<"posts">): string {
	const tags = (post.data.tags || []).map(quote).join(", ");
	const rows = [
		"---",
		`title: ${quote(post.data.title)}`,
		`published: ${formatDate(post.data.published)}`,
		post.data.updated ? `updated: ${formatDate(post.data.updated)}` : "",
		`description: ${quote(post.data.description || "")}`,
		post.data.image ? `image: ${post.data.image}` : "",
		`tags: [${tags}]`,
		`category: ${quote(post.data.category || "未分类")}`,
		"---",
	];

	return `${rows.filter((row) => row !== "").join("\n")}\n\n`;
}

export async function GET({ props }: { props: { post: CollectionEntry<"posts"> } }) {
	const { post } = props;
	const body = post.body?.trim() || "";
	const markdown = `${buildFrontmatter(post)}${body}\n`;

	return new Response(markdown, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Content-Disposition": `attachment; filename="${removeFileExtension(post.id)}.md"`,
		},
	});
}
