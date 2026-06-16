---
title: 从零搭建一个像 blog.zaneliu.me 的博客网站
published: 2026-05-30
description: 从服务器选购到 Halo CMS + Sakura 主题部署的完整博客搭建教程
tags: [博客, 网站, 教程, Hexo]
category: 工具速查
---

## 目标网站分析

`blog.zaneliu.me` 是一个技术博客，具有以下特征：

- **二次元风格**：全屏随机动漫背景图、樱花主题
- **卡片式文章列表**：每篇文章带有缩略图和摘要
- **橙色主题色**：以暖橙色作为强调色
- **完整导航**：首页、归档、瞬间（基于 Memos）、留言板、关于
- **访问量统计**：页面底部显示累计访问计数
- **响应式设计**：适配移动端和桌面端

该博客的基础设施：

| 层级 | 技术选型 |
|------|----------|
| 博客系统 | **Halo CMS** (Java) |
| 主题 | **Sakura** （移植自 WordPress 的樱花主题） |
| 反向代理 | Nginx |
| SSL 证书 | Let's Encrypt / Certbot |
| 部署方式 | Docker Compose |
| 容器编排 | k0s (Kubernetes) |
| 微博客 | Memos（独立部署） |

> 注：作者的主页 `zaneliu.me` 是另一个独立的 Astro + SolidJS 项目，源码在 `github.com/ZaneL1u/zaneliu.me`，该主页是极简风格的 "Hello" 介绍页，而非博客本身。本教程聚焦于博客部分。

---

## 第一步：准备服务器和域名

### 1.1 服务器配置建议

- **最低配置**：2 核 CPU / 2 GB 内存 / 40 GB 硬盘（运行 Halo 勉强够用）
- **推荐配置**：2 核 CPU / 4 GB 内存 / 60 GB SSD
- **系统**：Ubuntu 22.04 LTS 或 Debian 12

购买云服务器推荐：
- 国内：阿里云 ECS、腾讯云 CVM（需备案）
- 国外：Vultr、DigitalOcean、Linode（无需备案）
- 白嫖方案：Oracle Cloud Always Free（ARM 4 核 24 GB）

### 1.2 域名购买和 DNS 配置

1. 在 Cloudflare / NameSilo / 阿里云万网 购买域名
2. 在 DNS 管理中添加 A 记录，将域名指向服务器 IP:
   ```
   blog.yourdomain.com  →  A  →  你的服务器IP
   yourdomain.com       →  A  →  你的服务器IP (可选)
   ```
3. 如果使用 Cloudflare，建议开启代理（橙云）以隐藏真实 IP 并获取 CDN 加速

### 1.3 服务器基础配置

SSH 登录服务器后：

```bash
# 更新系统
apt update && apt upgrade -y

# 设置时区
timedatectl set-timezone Asia/Shanghai

# 创建非root用户 (可选但推荐)
adduser deploy
usermod -aG sudo deploy

# 配置SSH密钥登录 (可选但推荐)
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "你的公钥" >> ~/.ssh/authorized_keys

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 第二步：安装 Docker 和 Docker Compose

```bash
# 安装Docker (使用官方脚本)
curl -fsSL https://get.docker.com | bash

# 将当前用户加入docker组 (避免每次sudo)
sudo usermod -aG docker $USER

# 启动Docker
systemctl enable docker
systemctl start docker

# 安装Docker Compose插件
apt install docker-compose-plugin -y

# 验证安装
docker --version
docker compose version
```

退出 SSH 重新登录使 docker 组权限生效。

---

## 第三步：部署 Halo CMS

### 3.1 创建项目目录结构

```bash
mkdir -p ~/blog && cd ~/blog
mkdir -p data/halo
```

### 3.2 编写 docker-compose.yml

创建 `~/blog/docker-compose.yml`:

```yaml
version: "3.8"

services:
  halo:
    image: halohub/halo:2.20
    container_name: halo
    restart: unless-stopped
    ports:
      - "8090:8090"
    volumes:
      - ./data/halo:/root/.halo2
    environment:
      - HALO_EXTERNAL_URL=https://blog.yourdomain.com
      - HALO_SECURITY_INITIALIZER_SUPERADMINUSERNAME=admin
      - HALO_SECURITY_INITIALIZER_SUPERADMINPASSWORD=your-strong-password
      - SERVER_PORT=8090
      - SPRING_R2DBC_URL=r2dbc:h2:file:///root/.halo2/db/halo
      - SPRING_R2DBC_USERNAME=admin
      - SPRING_R2DBC_PASSWORD=your-db-password
      - HALO_WORK_DIR=/root/.halo2
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8090/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - blog-network

  # Memos 微博客 (可选 - zaneliu 用的是这个)
  memos:
    image: neosmemo/memos:stable
    container_name: memos
    restart: unless-stopped
    ports:
      - "5230:5230"
    volumes:
      - ./data/memos:/var/opt/memos
    networks:
      - blog-network

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    container_name: nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/www:/var/www/html
    depends_on:
      - halo
    networks:
      - blog-network

networks:
  blog-network:
    driver: bridge
```

### 3.3 配置 Nginx 反向代理

创建 `~/blog/nginx/conf.d/blog.conf`:

```nginx
server {
    listen 80;
    server_name blog.yourdomain.com;

    # 用于 Certbot 验证
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://halo:8090;
        proxy_set_header HOST $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        client_max_body_size 100m;
    }
}

# Memos 子域名 (可选)
server {
    listen 80;
    server_name memos.yourdomain.com;

    location / {
        proxy_pass http://memos:5230;
        proxy_set_header HOST $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3.4 配置 SSL 证书

使用 Certbot 获取免费 SSL 证书：

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y

# 先启动服务
cd ~/blog && docker compose up -d

# 获取证书 (standalone模式，因为Nginx在Docker内)
certbot certonly --webroot -w ~/blog/nginx/www \
  -d blog.yourdomain.com \
  -d memos.yourdomain.com

# 证书位置:
# /etc/letsencrypt/live/blog.yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/blog.yourdomain.com/privkey.pem
```

更新 Nginx 配置添加 SSL，修改 `~/blog/nginx/conf.d/blog.conf`:

```nginx
# HTTP → HTTPS 重定向
server {
    listen 80;
    server_name blog.yourdomain.com memos.yourdomain.com;
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# Blog - HTTPS
server {
    listen 443 ssl http2;
    server_name blog.yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://halo:8090;
        proxy_set_header HOST $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        client_max_body_size 100m;
    }
}

# Memos - HTTPS (可选)
server {
    listen 443 ssl http2;
    server_name memos.yourdomain.com;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://memos:5230;
        proxy_set_header HOST $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

复制证书到 Nginx 挂载目录并重启：

```bash
# 复制证书
cp /etc/letsencrypt/live/blog.yourdomain.com/fullchain.pem ~/blog/nginx/ssl/
cp /etc/letsencrypt/live/blog.yourdomain.com/privkey.pem ~/blog/nginx/ssl/

# 设置自动续期
echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/blog.yourdomain.com/fullchain.pem /root/blog/nginx/ssl/ && cp /etc/letsencrypt/live/blog.yourdomain.com/privkey.pem /root/blog/nginx/ssl/ && docker compose -f /root/blog/docker-compose.yml restart nginx" | crontab -

# 重启服务
cd ~/blog && docker compose restart nginx
```

### 3.5 启动所有服务

```bash
cd ~/blog
docker compose up -d

# 查看日志确认启动成功
docker compose logs -f halo
```

访问 `https://blog.yourdomain.com/console` 进入 Halo 管理后台，用初始化时设置的用户名和密码登录。

---

## 第四步：安装和配置 Sakura 主题

### 4.1 安装主题

1. 登录 Halo 后台 → 外观 → 主题
2. 点击"安装主题"，搜索 **Sakura**
3. 找到由 **LIlGG** 制作的 Sakura 主题，点击安装
4. 安装完成后点击"启用"

> 如果搜索不到，可以从 GitHub 手动安装：
> `https://github.com/LIlGG/halo-theme-sakura`

### 4.2 主题配置详解

在 Halo 后台 → 外观 → 主题 → Sakura → 设置：

#### 基础设置
```
站点名称: 你的博客名称
站点描述: 一段简短的个人介绍/签名
作者名称: 你的名字
站点关键词: 技术,博客,前端,DevOps (以逗号分隔)
Logo: 上传你的头像/Logo图片
Favicon: 上传网站favicon图标
```

#### 首页配置
```
首页タイトル: Hi,Friend  (或自定义欢迎语)
打字机效果文字: ["I'm a developer.", "Welcome to my blog."]
随机背景图API: https://www.dmoe.cc/random.php?home=home&type=url&itype=image&t=3
背景图滤镜透明度: 0.3
```

> **dmoe.cc** 是一个免费的随机二次元图片 API，zaneliu.me 同款。你也可以替换为：
> - `https://api.ixiaowai.cn/api/api.php` — 另一款随机图 API
> - 自己搭建的图床/静态图片 URL
> - 本地图片路径

#### 社交链接
```
GitHub: https://github.com/你的GitHub用户名
邮箱: hi@yourdomain.com
微信二维码: 上传微信二维码图片
QQ: 你的QQ号
Bilibili: 你的B站UID
```

#### 导航菜单配置
zaneliu.me 的导航结构：

| 名称 | 类型 | 链接 |
|------|------|------|
| 首页 | 页面 | `/` |
| 归档 | 页面 | `/archives` |
| 瞬间 | 自定义链接 | `https://memos.yourdomain.com` （或留空） |
| 留言板 | 页面 | `/comment` |
| 关于 | 页面 | `/about` |

#### 文章设置
```
列表显示方式: 卡片风格
文章摘要字数: 150
显示文章缩略图: 开启
默认缩略图API: https://www.dmoe.cc/random.php?postid={id}&type=url&itype=image
```

#### 颜色/自定义 CSS
在自定义 CSS 中添加橙色主题色增强：

```css
:root {
  --theme-color: #FF7F50;
  --theme-color-light: #FFA07A;
}

a {
  color: var(--theme-color);
}

a:hover {
  color: var(--theme-color-light);
}

.header-info {
  background: rgba(255, 127, 80, 0.1);
}

.post-entry .post-title:hover {
  color: var(--theme-color);
}

/* 滚动条样式 */
::-webkit-scrollbar-thumb {
  background: var(--theme-color);
}
```

---

## 第五步：创建必要页面

在 Halo 后台 → 页面 → 新建页面：

### 5.1 "关于" 页面
创建一篇名为"关于"的页面，内容参考 zaneliu 的风格：

```markdown
## Hi,Friend 👋

My name is [你的名字].

I am a software development engineer currently living in [城市].

Working at [公司名]
Contributing to [开源项目列表]

I use [编程语言] most of the time and am currently learning [新技术].

I like and am good at independent thinking, formulating long-term plans
and strategies, like solving complex problems, and am interested in new
technologies, new ideas and innovations.

Outside of coding, I like [兴趣爱好].

Find me on GitHub: [GitHub链接]
Or mail me at: [邮箱地址]

Have a nice day!
```

### 5.2 "留言板" 页面
创建一个空白页面，标题为"留言板"，Sakura 主题会自动渲染评论区域。

### 5.3 "瞬间" （可选）

这是 zaneliu.me 的特色功能 —— 通过独立部署 **Memos** 实现类似微博/Twitter 的短内容发布。实现方式：

1. Memos 已经在前面的 docker-compose 中部署
2. 访问 `https://memos.yourdomain.com` 完成 Memos 初始化
3. 在 Halo 导航菜单中添加外部链接指向 Memos

或者不使用独立部署，直接在 Halo 中创建一个"瞬间"分类，发布短文章。

---

## 第六步：内容创作和 SEO

### 6.1 发布第一篇文章

1. Halo 后台 → 文章 → 新建文章
2. Halo 支持 Markdown 和富文本编辑器
3. 设置文章分类和标签
4. 上传封面图或使用随机图 API
5. 设置 SEO 信息（标题、描述、关键词）
6. 发布

### 6.2 SEO 优化

在 Halo 后台 → 系统 → 设置 → SEO:

```
站点标题模板: {title} | {site_title}
Meta描述: 你的博客简介描述
全局关键词: 技术博客,个人博客,前端,后端
开启站点地图: 是
RSS订阅: 开启
```

### 6.3 统计和评论

- **访问统计**: Halo 内置了访问统计功能，在后台仪表盘可以查看
- **评论系统**: Sakura 主题内置评论，支持访客评论和管理员回复
- **第三方统计**: 可以在主题设置中插入 Google Analytics 或 Umami 统计代码

---

## 第七步：维护和备份

### 7.1 定期备份

```bash
# 创建备份脚本
cat > ~/blog-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份Halo数据和数据库
cd ~/blog
docker compose stop halo
tar -czf "$BACKUP_DIR/halo-backup-$DATE.tar.gz" data/halo
docker compose start halo

# 保留最近7天的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x ~/blog-backup.sh

# 添加到crontab，每天凌晨2点备份
echo "0 2 * * * /root/blog-backup.sh" | crontab -
```

### 7.2 升级 Halo

```bash
cd ~/blog

# 拉取最新镜像
docker compose pull halo

# 重启服务
docker compose up -d halo

# 查看日志确认
docker compose logs -f halo
```

### 7.3 监控

```bash
# 查看容器状态
docker compose ps

# 查看资源占用
docker stats

# 查看日志
docker compose logs --tail=100 halo
```

---

## 附录 A：完整项目文件结构

```
~/blog/
├── docker-compose.yml        # 服务编排
├── nginx/
│   ├── conf.d/
│   │   └── blog.conf         # Nginx配置
│   ├── ssl/
│   │   ├── fullchain.pem     # SSL证书
│   │   └── privkey.pem       # SSL私钥
│   └── www/                  # Webroot (Certbot验证)
├── data/
│   ├── halo/                 # Halo数据 (持久化)
│   │   ├── db/               # H2数据库文件
│   │   ├── attachments/      # 上传的附件
│   │   └── themes/           # 主题文件
│   └── memos/                # Memos数据
└── blog-backup.sh            # 备份脚本
```

---

## 附录 B：方案二 — 纯静态 Astro 博客

如果你不想使用 Halo 这样重量级的 CMS，zaneliu.me 作者的个人主页 (`zaneliu.me`) 使用的是 **Astro** 静态站点方案，更适合想要：

- 极简风格、纯个人介绍页面
- 不需要后台管理系统
- 免费部署到 Cloudflare Pages / Vercel
- 源码托管在 GitHub

### Astro 方案快速上手

```bash
# 创建项目
bun create astro@latest my-blog
# 或 npm create astro@latest my-blog

cd my-blog

# 安装依赖 (参考 zaneliu.me 的技术栈)
bun add solid-js unocss
bun add -D @astrojs/solid-js @iconify/json \
  unplugin-icons sass typescript
```

核心页面结构 (`src/pages/index.astro`):

```astro
---
import Label from '../components/Label.astro';
---

<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>你的名字 - Developer</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&display=swap" rel="stylesheet" />
  </head>
  <body class="py-5vh px-10vw">
    <main>
      <h1 class="mb-8 font-500 text-7xl">Hello.</h1>
      <p class="text-3xl font-500">My name is 你的名字.</p>
      <p class="text-xl font-300 max-w-2xl">
        I am a software development engineer.
      </p>
      <!-- 更多内容... -->
    </main>
  </body>
</html>
```

部署到 Cloudflare Pages（免费）:

```bash
# 1. 将代码推送到GitHub仓库
# 2. 在Cloudflare Pages中连接仓库
#    构建命令: bun run build
#    输出目录: dist
# 3. 绑定自定义域名
```

---

## 附录 C：常见问题

### Q：国内服务器访问 Halo 慢怎么办？
- 使用国内镜像源：`registry.cn-hangzhou.aliyuncs.com`
- 或使用阿里云容器镜像服务 ACC

### Q：随机图 API 挂了怎么办？
- 准备几张本地备用图片
- 使用多个 API 做 fallback
- 自建图床（推荐使用 Cloudflare R2 + Workers, 免费 10GB）

### Q：如何将 Halo 文章迁移到新服务器？
- 备份 `~/blog/data/halo` 整个目录
- 在新服务器恢复该目录
- 使用相同的 `docker-compose.yml` 启动即可

### Q：必须要用域名吗？
- 可以使用服务器 IP 直接访问（但不推荐）
- 使用 `nip.io`: `http://blog.1.2.3.4.nip.io` 作为免费临时域名
- 正式使用建议购买域名

---

## 总结：成本和选择

| 方案 | 服务器成本 | 域名成本 | 维护难度 | 特点 |
|------|-----------|---------|---------|------|
| Halo + Sakura | ¥50-100/月 | ¥30-80/年 | 中 | 完整博客系统、后台管理 |
| Astro 静态站 | ¥0 (CF Pages) | ¥30-80/年 | 低 | 极简风格、免服务器 |
| 混合（本教程） | ¥50-100/月 | ¥30-80/年 | 中 | 完整博客 + 个人主页 |

zaneliu.me 采用的是混合方案：Astro 静态主页 + Halo 博客 + Memos 微博客，三者在不同子域名下由同一个 Nginx 反代。建议初学者先从 Halo + Sakura 入手，上手快、功能全，后续有需要再拆分。

---

## 关联笔记

- [/posts/docker-learning/](Docker学习) — Docker 基础概念，博客用 Docker Compose 部署的预备知识
- [/posts/git-cheatsheet/](Git常用命令速查) — 博客源码版本管理
- [/posts/tortoise-git-guide/](基于Tortoise Git的Git食用指北) — 图形化 Git 操作，适合博客维护
