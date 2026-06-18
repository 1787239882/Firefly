import {
	LinkPreset,
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";
import { siteConfig } from "./siteConfig";

// 根据页面开关动态生成导航栏配置
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: (NavBarLink | LinkPreset)[] = [
		// 主页
		LinkPreset.Home,
	];

	// 文章及其子菜单
	links.push({
		name: "文章",
		url: "/post/",
		icon: "material-symbols:article-rounded",
		children: [
			// 归档
			LinkPreset.Archive,
			// 分类
			LinkPreset.Categories,
			// 标签
			LinkPreset.Tags,
		],
	});

	// 根据配置决定是否添加友链，在siteConfig关闭pages.friends时导航栏不显示友链
	// 我的及其子菜单
	links.push({
		name: "实验室",
		url: "/my/",
		icon: "material-symbols:deployed-code-outline",
		children: [
			// 根据配置决定是否添加友链，在siteConfig关闭pages.friends时导航栏不显示友链
			...(siteConfig.pages.friends ? [LinkPreset.Friends] : []),

			// 根据配置决定是否添加留言板，在siteConfig关闭pages.guestbook时导航栏不显示留言板
			...(siteConfig.pages.guestbook ? [LinkPreset.Guestbook] : []),

			// 根据配置决定是否添加相册，在siteConfig关闭pages.gallery时导航栏不显示相册
			...(siteConfig.pages.gallery ? [LinkPreset.Gallery] : []),

			// 根据配置决定是否添加番组计划，在siteConfig关闭pages.bangumi时导航栏不显示番组计划
			...(siteConfig.pages.bangumi ? [LinkPreset.Bangumi] : []),

			{
				name: "导入工作台",
				url: "/admin/import/",
				icon: "material-symbols:upload-file-outline",
			},
		],
	});

	// 关于及其子菜单
	links.push({
		name: "关于",
		url: "/content/",
		icon: "material-symbols:info",
		children: [
			// 根据配置决定是否添加赞助，在siteConfig关闭pages.sponsor时导航栏不显示赞助
			...(siteConfig.pages.sponsor ? [LinkPreset.Sponsor] : []),

			// 关于页面
			LinkPreset.About,
		],
	});

	// 仅返回链接，其它导航搜索相关配置在模块顶层常量中独立导出
	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
