---
title: VPN 知识库
published: 2026-06-15
description: VPN 知识库索引，涵盖 TUN 模式详解、WireGuard 协议分析等网络隧道与加密技术
image: ../../assets/images/post-covers/vpn-index.webp
tags: [VPN, 索引, 网络隧道, 网络安全]
category: 网络
---

# VPN 知识库

虚拟专用网络（VPN）相关技术的笔记索引，涵盖协议分析、隧道模式、代理辨析等主题。

## 什么是 VPN？

VPN（Virtual Private Network）通过在不可信的底层网络（如公共互联网）之上建立加密隧道，将地理上分散的网络节点连接成一个逻辑上的私有网络。核心价值在于**机密性**、**完整性**和**身份认证**三要素的工程实现。

现代 VPN 早已超越"企业内网远程访问"的原始场景，广泛用于：
- 分布式站点互联（Site-to-Site）
- 移动设备安全接入（Road Warrior）
- 隐私保护与流量加密
- 跨国网络访问与内容分发
- 容器/虚拟机跨主机组网

## 本系列文章

| 文章 | 概述 | 关键词 |
|------|------|--------|
| [/posts/tun-mode-guide/](TUN模式详解) | TUN/TAP 隧道模式原理，三层 vs 二层的选择与权衡 | TUN, TAP, 网络层, 隧道 |
| [/posts/wireguard-analysis/](WireGuard 协议分析) | 下一代 VPN 协议深度解析：设计哲学、加密套件、Cryptokey Routing、与传统 VPN 对比 | WireGuard, Noise, ChaCha20, Curve25519 |

## 待写主题

以下是计划中的扩展方向：

- **代理 vs VPN 辨析** — V2Ray / Clash / Shadowsocks 等代理工具与 VPN 的本质区别：代理工作在应用层/传输层，VPN 工作在网络层。各自的适用场景与安全模型。
- **OpenVPN 深度解析** — 用户态 VPN 的代表，TLS 握手 + 自定义数据通道的设计权衡。
- **IPsec 协议族概览** — IKEv2 + ESP/AH 的标准体系，内核 xfrm 框架，以及为什么配置如此复杂。
- **VPN 穿透 NAT 的技术手段** — STUN / TURN / ICE / UPnP / NAT-PMP 在 VPN 场景下的应用。
- **VPN over Obfuscation** — 当 WireGuard/OpenVPN 被 DPI 阻断后，流量混淆方案（udp2raw, Cloak, obfs4, V2Ray 底层承载等）。

## 外部参考

- WireGuard 官网：[https://www.wireguard.com/](https://www.wireguard.com/)
- Noise Protocol Framework：[https://noiseprotocol.org/](https://noiseprotocol.org/)
- OpenVPN 社区文档：[https://openvpn.net/community/](https://openvpn.net/community/)
- IPsec (StrongSwan) 文档：[https://docs.strongswan.org/](https://docs.strongswan.org/)
- Linux TUN/TAP 内核文档：`Documentation/networking/tuntap.rst`
