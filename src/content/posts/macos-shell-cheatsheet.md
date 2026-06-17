---
title: macOS Shell 常用命令速查
published: 2026-06-15
description: macOS 终端高频命令速查，涵盖文件管理、文本处理、网络、系统信息等十二大类
image: ../../assets/images/post-covers/macos-shell-cheatsheet.webp
tags: [macOS, Shell, 命令行, 速查, 效率]
category: 工具速查
---

> 日常开发与运维中的高频 macOS 终端命令，按场景分类。

---

## 一、文件与目录

### 基础操作

```bash
ls -la            # 列出所有文件（含隐藏文件，详细信息）
ls -lh            # 人类可读的文件大小
ls -lt            # 按修改时间排序
tree -L 2         # 树状显示目录结构（需 brew install tree）
```

```bash
cd -              # 返回上一个目录
cd ~              # 回到 home 目录
pwd               # 打印当前路径
open .            # 在 Finder 中打开当前目录
```

```bash
cp -r src dst     # 递归复制
cp -a src dst     # 保留权限/时间戳的完整复制
mv old new        # 移动/重命名
```

```bash
mkdir -p a/b/c    # 递归创建目录
rm -rf dir        # 强制递归删除（危险！）
rmdir dir         # 仅删空目录
```

### 查找文件

```bash
find . -name "*.go"                        # 按名称查找
find . -type f -mtime -1                   # 最近 24 小时修改的文件
find . -size +10M                           # 大于 10MB 的文件
find . -name "*.log" -exec rm {} \;        # 找到并删除
fd pattern           # 更快替代 find（brew install fd）
```

```bash
mdfind "keyword"     # 用 Spotlight 索引搜索（极快）
mdfind -name "*.pdf" # 按文件名 Spotlight 搜索
```

### 文件内容

```bash
cat file                         # 输出全部内容
less file                        # 分页浏览（q 退出，/ 搜索）
head -20 file                    # 前 20 行
tail -f file                     # 跟踪尾部（实时日志）
```

```bash
wc -l file                       # 行数统计
wc -c file                       # 字节数统计
du -sh *                         # 各文件/目录大小
du -sh .                         # 当前目录总大小
```

---

## 二、文本处理

```bash
grep "pattern" file              # 查找匹配行
grep -r "pattern" .              # 递归搜索当前目录
grep -v "pattern" file           # 排除匹配行
grep -i "pattern" file           # 忽略大小写
grep -c "pattern" file           # 只统计匹配次数
rg "pattern"                      # ripgrep，更快（brew install ripgrep）
```

```bash
sed 's/old/new/g' file           # 全文替换
sed -i '' 's/old/new/g' file     # 直接修改文件（macOS 需空备份参数）
awk '{print $1, $3}' file        # 打印第 1、3 列
awk -F: '{print $1}' file        # 指定分隔符
```

```bash
sort file                        # 排序
sort -n file                     # 数字排序
sort -u file                     # 去重排序
uniq -c file                     # 统计重复行次数
```

---

## 三、进程管理

```bash
ps aux                           # 列出所有进程
ps aux | grep nginx              # 查找指定进程
pgrep -fl python                  # 按名称匹配进程
top                              # 实时进程监控
htop                             # 更友好的进程监控（brew install htop）
```

```bash
kill PID                         # 终止进程（SIGTERM）
kill -9 PID                      # 强制终止（SIGKILL）
killall process_name             # 按名称终止
pkill -f "pattern"               # 匹配命令行模式终止
```

```bash
lsof -i :3000                    # 查看占用某端口的进程
lsof -p PID                      # 查看某进程打开的所有文件
```

---

## 四、系统信息

```bash
uname -a                         # 系统完整信息
sw_vers                          # macOS 版本
system_profiler SPHardwareDataType  # 硬件详情
sysctl machdep.cpu.brand_string  # CPU 型号
```

```bash
top -l 1 -n 0 | head -5          # 瞬时 CPU 负载
vm_stat                          # 虚拟内存统计
memory_pressure                  # 内存压力
df -h                            # 磁盘使用概况
```

```bash
uptime                           # 系统运行时间
who                              # 当前登录用户
last                             # 最近登录记录
```

---

## 五、网络

```bash
ifconfig                         # 网络接口信息
ifconfig en0                     # 指定接口
ipconfig getifaddr en0           # 获取接口 IP（内网）
networksetup -listallhardwareports  # 所有网络端口列表
```

```bash
curl -I https://example.com      # 仅获取响应头
curl -X POST -d '{"k":"v"}' url  # POST JSON
curl -O https://file.zip         # 下载文件
curl -L -o output url            # 跟随重定向，指定输出文件名
wget https://file.zip            # 传统下载工具（brew install wget）
```

```bash
ping -c 4 google.com             # 4 次后停止
traceroute google.com            # 路由追踪
nslookup domain.com              # DNS 查询
dig domain.com                   # 详细 DNS 查询
dig +short domain.com            # 仅返回 IP
```

```bash
nmap -sP 192.168.1.0/24         # 局域网设备扫描（brew install nmap）
netstat -an | grep LISTEN        # 查看所有监听端口
```

---

## 六、权限与安全

```bash
chmod 755 file                   # rwxr-xr-x
chmod +x script.sh               # 添加执行权限
chown user:group file            # 变更所有者
```

```bash
xattr -l file                    # 查看扩展属性
xattr -d com.apple.quarantine file  # 移除隔离属性（下载文件打不开时常用）
codesign -dv --verbose=4 app     # 查看应用签名信息
```

```bash
sudo spctl --master-disable      # 允许任何来源的应用（Gatekeeper）
ssh-keygen -t ed25519 -C "email" # 生成 SSH 密钥（推荐 ED25519）
```

---

## 七、Homebrew（包管理器）

```bash
brew install pkg                 # 安装
brew uninstall pkg               # 卸载
brew update                      # 更新 Homebrew 自身
brew upgrade                     # 升级所有包
brew upgrade pkg                 # 升级指定包
brew list                        # 列出已安装
brew info pkg                    # 查看包详情
brew search keyword              # 搜索包
brew cleanup                     # 清理旧版本
```

```bash
brew services list               # 查看后台服务
brew services start nginx        # 启动服务
brew services restart nginx      # 重启服务
brew services stop nginx         # 停止服务
```

```bash
brew leaves                      # 仅列出你主动安装的包（排除依赖）
brew deps --tree pkg             # 查看依赖树
brew doctor                      # 诊断 Homebrew 问题
```

---

## 八、磁盘与文件系统

```bash
diskutil list                    # 列出所有磁盘/分区
diskutil info /dev/disk0         # 磁盘详情
diskutil apfs list               # APFS 卷信息
```

```bash
hdiutil attach image.dmg         # 挂载 DMG
hdiutil detach /Volumes/name     # 卸载
hdiutil create -size 100m -fs HFS+ test.dmg  # 创建空 DMG
```

```bash
tmutil listbackups               # 列出 Time Machine 备份
tmutil startbackup               # 手动触发备份
```

---

## 九、macOS 专属命令

```bash
open file.pdf                    # 用默认应用打开
open -a "Google Chrome" url      # 用指定应用打开
open -R file                     # 在 Finder 中显示
open -t file                     # 用默认文本编辑器打开
```

```bash
pbcopy < file                    # 复制到剪贴板
pbpaste > file                   # 从剪贴板粘贴
cat file | pbcopy                # 将文件内容复制到剪贴板
```

```bash
defaults read com.apple.finder   # 读取系统偏好
defaults write com.apple.finder AppleShowAllFiles YES  # 显示隐藏文件
killall Finder                   # 重启 Finder 使配置生效
```

```bash
say "hello world"                # 文字转语音
caffeinate                       # 阻止系统休眠
caffeinate -d -i -t 3600         # 防止休眠 1 小时
pmset -g                         # 查看电源管理设置
```

```bash
screencapture -i output.png      # 交互式截屏
screencapture -T 5 output.png    # 5 秒延迟截屏
screencapture -P output.png      # 截屏后在 Preview 打开
```

---

## 十、压缩与归档

```bash
tar -czf archive.tar.gz dir/     # 创建 tar.gz
tar -xzf archive.tar.gz          # 解压 tar.gz
tar -xvf archive.tar             # 解压 tar（显示文件列表）
```

```bash
zip -r archive.zip dir/          # 创建 zip
unzip archive.zip                # 解压 zip
unzip -l archive.zip             # 仅列出内容不解压
```

```bash
gzip file                        # 压缩为 file.gz
gunzip file.gz                   # 解压
```

---

## 十一、快捷键与效率技巧

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+A` | 跳到行首 |
| `Ctrl+E` | 跳到行尾 |
| `Ctrl+U` | 删除光标前全部 |
| `Ctrl+K` | 删除光标后全部 |
| `Ctrl+W` | 删除前一个单词 |
| `Ctrl+R` | 历史命令反向搜索 |
| `!!` | 重复上一条命令 |
| `!$` | 上一条命令的最后一个参数 |
| `Ctrl+L` | 清屏（等同 `clear`） |

```bash
history                         # 查看命令历史
!42                             # 执行历史中编号为 42 的命令
alias ll="ls -la"               # 创建别名（写到 ~/.zshrc 永久生效）
```

---

## 十二、实用组合技

```bash
# 按大小列出当前目录下最大的 10 个文件
du -sh * | sort -rh | head -10

# 递归查找所有 .log 文件并统计总大小
find . -name "*.log" -exec du -ch {} + | tail -1

# 批量重命名（将 .txt 改为 .md）
for f in *.txt; do mv "$f" "${f%.txt}.md"; done

# 查看最占内存的 5 个进程
ps aux | sort -nrk 4 | head -5

# 当前目录下各文件类型数量
find . -type f | sed 's/.*\.//' | sort | uniq -c | sort -rn

# HTTP 服务快速启动（当前目录）
python3 -m http.server 8000

# SSH 隧道：本地端口转发
ssh -L 8080:localhost:3000 user@remote

# 递归替换目录中所有文件中的特定字符串（macOS sed）
find . -type f -name "*.md" -exec sed -i '' 's/old/new/g' {} +
```

---

## 参考与扩展

- [macOS Terminal User Guide](https://support.apple.com/guide/terminal/welcome/mac)
- [The Art of Command Line](https://github.com/jlevy/the-art-of-command-line)
- `man <command>` — 任何命令的详细手册
- `tldr <command>` — 简明示例（brew install tldr）

---

## 关联笔记

- [/posts/linux-ops-handbook/](Linux运维实战手册) — Linux 生产环境运维命令，与 macOS Shell 互补
- [/posts/build-blog-from-scratch/](搭建个人博客网站从零教程) — 博客部署中大量使用 Shell 命令
