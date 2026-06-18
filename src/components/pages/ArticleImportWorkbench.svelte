<script lang="ts">
import Icon from "@/components/common/Icon.svelte";
import {
	buildImportedArticle,
	extractMarkdownTitle,
	parseTagInput,
	slugifyArticleTitle,
	type ImportSourceType,
} from "@/utils/article-importer";

let file: File | null = null;
let title = "";
let description = "";
let category = "技术成长";
let tagInput = "代码学习笔记";
let body = "";
let sourceType: ImportSourceType = "md";
let generated = "";
let generatedName = "imported-article.md";
let status = "选择 md 或 pdf 文件后，可以生成一份符合站点格式的文章。";

const categories = ["技术成长", "工具速查", "AI-Agent", "网络", "深度思考", "项目实践", "未分类"];

function updateGenerated() {
	const tags = parseTagInput(tagInput);
	const effectiveTitle = title.trim() || "未命名文章";

	generated = buildImportedArticle({
		title: effectiveTitle,
		description: description.trim(),
		category,
		tags,
		sourceType,
		sourceFileName: file?.name || "",
		body,
	});
	generatedName = `${slugifyArticleTitle(effectiveTitle)}.md`;
}

async function handleFileChange(event: Event) {
	const input = event.currentTarget as HTMLInputElement;
	const selected = input.files?.[0] || null;
	file = selected;

	if (!file) {
		status = "选择 md 或 pdf 文件后，可以生成一份符合站点格式的文章。";
		return;
	}

	const extension = file.name.split(".").pop()?.toLowerCase();
	sourceType = extension === "pdf" ? "pdf" : "md";

	if (sourceType === "md") {
		body = await file.text();
		title = extractMarkdownTitle(body, file.name.replace(/\.[^.]+$/, ""));
		description = description || `${title} 的导入整理`;
		status = "已读取 Markdown 内容，可以调整分类、标签和描述。";
	} else {
		body = "";
		title = file.name.replace(/\.[^.]+$/, "");
		description = description || `${title} 的 PDF 附件文章`;
		status = "PDF 会生成附件型文章壳，原 PDF 需要后续放入站点附件目录。";
	}

	updateGenerated();
}

function handleFieldInput() {
	updateGenerated();
}

function downloadGenerated() {
	if (!generated) updateGenerated();

	const blob = new Blob([generated], { type: "text/markdown;charset=utf-8" });
	const href = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = href;
	link.download = generatedName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(href);
}
</script>

<section class="import-workbench onload-animation">
	<div class="import-workbench__hero">
		<div>
			<span class="import-workbench__eyebrow">LOCAL IMPORT CONSOLE</span>
			<h1>文章导入 / 导出工作台</h1>
			<p>本页面只在浏览器本地处理文件，不会上传到服务器。生成的 Markdown 放进 <code>src/content/posts</code> 后提交即可发布。</p>
		</div>
		<div class="import-workbench__badge">
			<Icon icon="material-symbols:upload-file-outline" size="2xl" />
			<span>MD / PDF</span>
		</div>
	</div>

	<div class="import-workbench__grid">
		<form class="import-panel" on:input={handleFieldInput}>
			<label class="import-drop">
				<Icon icon="material-symbols:drive-folder-upload-outline" size="2xl" />
				<span>{file ? file.name : "选择 .md 或 .pdf 文件"}</span>
				<small>{status}</small>
				<input type="file" accept=".md,.markdown,.mdx,.pdf" on:change={handleFileChange} />
			</label>

			<label>
				<span>标题</span>
				<input bind:value={title} placeholder="文章标题" />
			</label>

			<label>
				<span>描述</span>
				<textarea bind:value={description} rows="3" placeholder="给文章列表和 SEO 用的摘要"></textarea>
			</label>

			<div class="import-form-row">
				<label>
					<span>分类</span>
					<select bind:value={category}>
						{#each categories as item}
							<option value={item}>{item}</option>
						{/each}
					</select>
				</label>
				<label>
					<span>标签</span>
					<input bind:value={tagInput} placeholder="用逗号分隔" />
				</label>
			</div>

			<button class="import-button" type="button" on:click={downloadGenerated}>
				<Icon icon="material-symbols:download-rounded" />
				<span>下载生成的 Markdown</span>
			</button>
		</form>

		<div class="import-panel import-panel--preview">
			<div class="import-preview-head">
				<span>{generatedName}</span>
				<button type="button" on:click={downloadGenerated}>
					<Icon icon="material-symbols:download-rounded" />
				</button>
			</div>
			<pre>{generated || "选择文件后会在这里预览生成内容。"}</pre>
		</div>
	</div>
</section>

<style>
	.import-workbench {
		display: grid;
		gap: 1rem;
		margin-bottom: 1.5rem;
		color: rgb(226, 232, 240);
	}

	.import-workbench__hero,
	.import-panel {
		border: 1px solid rgba(125, 211, 252, 0.22);
		border-radius: 0.75rem;
		background:
			linear-gradient(135deg, rgba(12, 18, 38, 0.88), rgba(12, 11, 26, 0.78)),
			rgba(8, 12, 26, 0.8);
		box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
		backdrop-filter: blur(18px);
	}

	.import-workbench__hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: clamp(1.2rem, 3vw, 2rem);
	}

	.import-workbench__eyebrow {
		color: rgba(125, 211, 252, 0.8);
		font-family: Orbitron, Rajdhani, sans-serif;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.08em;
	}

	.import-workbench h1 {
		margin-top: 0.4rem;
		color: rgb(248, 250, 252);
		font-family: Orbitron, Rajdhani, sans-serif;
		font-size: clamp(2rem, 5vw, 3.7rem);
		font-weight: 900;
		line-height: 1;
		letter-spacing: 0;
	}

	.import-workbench p {
		max-width: 45rem;
		margin-top: 0.8rem;
		color: rgba(226, 232, 240, 0.75);
		line-height: 1.75;
	}

	.import-workbench code {
		color: rgb(125, 211, 252);
	}

	.import-workbench__badge {
		display: grid;
		min-width: 8rem;
		place-items: center;
		gap: 0.5rem;
		color: rgb(125, 211, 252);
		font-family: Orbitron, Rajdhani, sans-serif;
		font-weight: 800;
	}

	.import-workbench__grid {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: 1rem;
	}

	.import-panel {
		display: grid;
		gap: 1rem;
		padding: 1rem;
	}

	.import-drop {
		position: relative;
		display: grid;
		min-height: 10rem;
		place-items: center;
		gap: 0.35rem;
		padding: 1rem;
		border: 1px dashed rgba(34, 211, 238, 0.45);
		border-radius: 0.65rem;
		background: rgba(2, 6, 23, 0.35);
		color: rgba(248, 250, 252, 0.92);
		text-align: center;
		cursor: pointer;
	}

	.import-drop input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.import-drop small {
		color: rgba(203, 213, 225, 0.68);
	}

	.import-panel label {
		display: grid;
		gap: 0.45rem;
	}

	.import-panel label > span {
		color: rgba(186, 230, 253, 0.78);
		font-size: 0.8rem;
		font-weight: 800;
	}

	.import-panel input,
	.import-panel textarea,
	.import-panel select {
		width: 100%;
		border: 1px solid rgba(125, 211, 252, 0.22);
		border-radius: 0.55rem;
		background: rgba(2, 6, 23, 0.45);
		color: rgb(248, 250, 252);
		padding: 0.75rem 0.85rem;
		outline: none;
	}

	.import-panel input:focus,
	.import-panel textarea:focus,
	.import-panel select:focus {
		border-color: rgba(34, 211, 238, 0.7);
	}

	.import-form-row {
		display: grid;
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
		gap: 0.8rem;
	}

	.import-button,
	.import-preview-head button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		min-height: 2.8rem;
		border: 1px solid rgba(34, 211, 238, 0.55);
		border-radius: 999px;
		background: linear-gradient(135deg, rgba(34, 211, 238, 0.24), rgba(168, 85, 247, 0.24));
		color: rgb(248, 250, 252);
		font-weight: 800;
	}

	.import-preview-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.8rem;
		color: rgba(186, 230, 253, 0.85);
		font-family: "JetBrains Mono Variable", monospace;
		font-size: 0.86rem;
		font-weight: 800;
	}

	.import-preview-head button {
		width: 2.5rem;
		min-height: 2.5rem;
		padding: 0;
	}

	.import-panel--preview pre {
		overflow: auto;
		min-height: 34rem;
		max-height: 58rem;
		margin: 0;
		border: 1px solid rgba(125, 211, 252, 0.16);
		border-radius: 0.6rem;
		background: rgba(2, 6, 23, 0.42);
		color: rgba(226, 232, 240, 0.88);
		padding: 1rem;
		font-family: "JetBrains Mono Variable", monospace;
		font-size: 0.82rem;
		line-height: 1.6;
		white-space: pre-wrap;
	}

	@media (max-width: 900px) {
		.import-workbench__hero,
		.import-workbench__grid,
		.import-form-row {
			grid-template-columns: 1fr;
		}

		.import-workbench__hero {
			align-items: start;
			flex-direction: column;
		}
	}
</style>
