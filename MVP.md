# ZamGo · WhatsApp 跨境代购 MVP 方案

> 版本 v0.1 · 2026-04-05 · 作者 ZamGo 产品团队
> 本文档为单一事实源（single source of truth），覆盖 **PRD + 技术选型 + 架构 + 里程碑** 全部内容。

---

## 0. 项目概述

| 字段 | 值 |
|---|---|
| 项目代号 | **ZamGo**（Zambia + Go） |
| 业务形态 | WhatsApp 群 + 独立站的跨境代购（Cross-border Daigou） |
| 目标市场 | **赞比亚（ZM）—— 首期单国验证**，后续可复制至 Tanzania / Kenya / Malawi |
| 一句话定位 | "赞比亚本地华人开的 Taobao 代购档口 —— 你在 WhatsApp 说一句，14 天后到 Lusaka 取件" |
| 当前阶段 | **Pre-MVP**（0→1 筹建期，团队 2-3 人） |
| 首期目标客群 | 在 Lusaka / Kitwe 居住的赞比亚中产 + 在赞华人（先验证华人，再扩赞人） |
| 核心价值 | ① 品类全（Taobao/1688 长尾）② 价格低（比本地零售便宜 30-60%）③ 服务可信（本地自提、WhatsApp 人工兜底） |
| 首期不做 | 多国运营、自建物流、自营仓储、独立 App、信用赊账 |

**为什么现在做**：
- 赞比亚 WhatsApp 渗透率 >85%，Airtel Money 覆盖 >60% 成年人口
- 国内到非洲空运 7-14 天已常态化（DHL/空运集运约 $6-12/kg）
- LLM 成本下降至 $0.25/百万 input token 级别，AI 辅助客服可规模化
- 本地已有人工代购群体（微信/WhatsApp 小群），但无一家做到"独立站 + AI 标准化"

---

## 1. PRD 产品需求

### 1.1 用户画像

**画像 A · C 端买家（Customer）**
- 角色：Mary, 29 岁, Lusaka 护士, 月收入 4000 ZMW (~$150)
- 目标：想买一台扫地机器人给妈妈当礼物，本地商场要 $400，她只愿出 $180
- 渠道：通过朋友拉入 ZamGo WhatsApp 群
- 行为：群里看到别人晒单 → 私聊客服发图片 / 发中文商品名 / 发 Taobao 链接询价
- 痛点：不会中文、不懂人民币汇率、怕被骗定金、担心东西坏了没人管
- 付款偏好：**Airtel Money（90%）** > MTN MoMo > 银行转账（仅华人/大额）

**画像 B · CS 客服代表（Customer Service）**
- 角色：小陈, 26 岁, 驻 Lusaka 华人, 中英双语 + Bemba 日常词
- 目标：日处理 30-50 条询价，完成 10-15 笔成交
- 工具：WATI 控制台 + 自研 Admin Panel + 个人手机 Taobao App
- 痛点：
  - 每天被重复问题（运费怎么算、多久到、在哪里取）淹没
  - 汇率波动算价格容易算错（ZMW/USD/CNY 三币种）
  - 客户问"这个商品有没有" —— 每次都要手动搜 Taobao 再回复
- KPI：响应时长（< 5 min）、询价→订单转化率（≥20%）、客诉率（<3%）

**画像 C · 运营 / 采购 / 仓管（Operator）**
- 角色：老王, 38 岁, 广州采购 + Lusaka 仓库（2 人）
- 目标：每周下 50-80 单 Taobao、盯 2 批空运箱子、维护 SKU 库
- 工具：Admin Panel（SKU 管理、订单看板、对账）
- 痛点：
  - CS 报的规格/重量不准，采购买错货 → 退换货损失
  - 热卖品没及时补货 / 冷品压仓
  - 空运/海运船期变动客户投诉

### 1.2 User Stories（15 条）

**C 端（买家）**
1. 作为新入群的 Mary，我希望看到群欢迎语介绍"怎么下单/付款/取货"，以便我敢发出第一条私聊。
2. 作为买家，我希望发一张图片或中文商品名，10 分钟内收到报价（含商品图、人民币价、ZMW 价、预计到货日），以便我当场决定买不买。
3. 作为买家，我希望报价中有"点此付款"的 Airtel Money 链接/指令，以便我 3 步内完成 30% 定金支付。
4. 作为买家，我希望付款后每天收到订单状态更新（已下单 / 已发货 / 已到仓 / 可自提），以便我不焦虑、不重复问客服。
5. 作为买家，我希望货到仓库后收到取件码和仓库地址（含 Google Maps 链接），以便我能直接去取。
6. 作为买家，我希望独立站上能浏览"爆款 SKU"（库存现货），以便即时下单不用等 14 天。
7. 作为买家，如果我的商品 14 天后仍未到货，我希望收到主动道歉 + 赔偿券，以便我不拉黑这家店。

**CS 客服**
8. 作为客服，我希望 WhatsApp 消息自动归入"新询价/待报价/待付款/待发货/售后"5 个 Kanban 列，以便我知道下一步该做什么。
9. 作为客服，我希望 AI 自动识别客户图片并推荐 3 个 Taobao 商品候选，我只需点击"确认"或"换一个"，以便我不用手动搜。
10. 作为客服，我希望 AI 自动生成报价话术（含规格/价格/工期），我编辑后一键发送，以便我标准化输出。
11. 作为客服，我希望遇到"投诉/退款/威胁"等关键词时系统自动挂起 AI、@我接管，以便我不错过敏感对话。

**运营**
12. 作为运营，我希望后台看到今日询价数、报价转化率、GMV、在途订单数，以便我做日报。
13. 作为运营，我希望"AI 找到的 Taobao 商品"可以一键"临时上架"到独立站（7 天有效），以便未来同类询价能复用。
14. 作为运营，我希望"临时商品"卖出 ≥3 单后自动提示"是否转正式 SKU"，以便我备现货。
15. 作为运营，我希望后台能改报价公式参数（汇率、利润率、运费系数），以便我实时调价应对汇率波动。

### 1.3 功能清单与优先级

| # | 功能 | P | 交付周 |
|---|------|---|--------|
| F01 | WhatsApp 群入群欢迎语 + 菜单指令 | P0 | W1 |
| F02 | WATI webhook 接入，消息入库 | P0 | W2 |
| F03 | 人工客服 Kanban 看板（5 列） | P0 | W2 |
| F04 | AI Intent 分类（询价/闲聊/投诉/状态查询） | P0 | W3 |
| F05 | AI 图片 + 文本商品匹配（pgvector 检索 Shopify SKU） | P0 | W3 |
| F06 | 报价公式 + 报价卡片生成 | P0 | W3 |
| F07 | Taobao/1688 人工搜索 → 回填 | P0 | W3 |
| F08 | 临时商品（Temp Listing）7 天有效期 | P1 | W4 |
| F09 | 1688 API 自动查询补充候选 | P1 | W4 |
| F10 | Airtel Money 付款链接生成 + 人工对账 | P0 | W4 |
| F11 | 订单状态广播（已下单/发货/到仓/可自提） | P0 | W5 |
| F12 | 临时商品 ≥3 单自动转正 Shopify SKU | P1 | W5 |
| F13 | 售后/投诉自动挂起 + @客服 | P0 | W5 |
| F14 | 运营看板（GMV/转化率/在途） | P1 | W5 |
| F15 | 24h 窗口提醒（接近 23h 未回复告警） | P1 | W6 |
| F16 | 多语言话术库（EN/ZH/Bemba 常用短语） | P2 | W6+ |

### 1.4 业务规则

**规则 1 · 定金与尾款**
- 定金 = 报价总额 × **30%**（最低 100 ZMW，最高 5000 ZMW 封顶）
- 尾款 = 报价总额 - 定金，**到仓后支付**
- 若客户定金付款后 48h 内反悔：退 80%（扣 20% 运营费）
- 若客户到仓后 7 天未取件：每天 30 ZMW 仓储费

**规则 2 · 报价公式**
```
最终售价（ZMW）= [
    (Taobao 商品价 CNY × 汇率系数_CNY_ZMW)
  + (预估重量 kg × 单位空运费 USD/kg × 汇率系数_USD_ZMW)
  + 固定操作费 ZMW
] × (1 + 利润率)

其中：
  汇率系数_CNY_ZMW = 实时汇率 × 1.03  (3% 汇率缓冲)
  汇率系数_USD_ZMW = 实时汇率 × 1.02
  单位空运费 = 9 USD/kg (基础品类)
  固定操作费 = 20 ZMW (打包/国内物流)
  利润率 = 18% (可在 Admin 调整 10%-30%)
```
示例：100 CNY 商品 × 汇率 3.8 = 380 ZMW + 0.5kg × 9 USD/kg × 26 = 117 ZMW + 20 = 517 ZMW → × 1.18 = **610 ZMW**

**规则 3 · 临时商品 7 天有效期**
- AI 或 CS 从 Taobao 找到的商品可一键"Temp Listing"至独立站（Shopify metafield 标记）
- 有效期 7 天，到期自动下架
- 7 天内累计 ≥3 单成交 → 推送 @运营 "是否转正"通知

**规则 4 · WhatsApp 24h 窗口**
- 客户消息进入后，商家有 24h 自由回复
- 超过 24h，必须用 WhatsApp **Approved Template** 开启新会话（付费）
- 系统需在 23h 标记告警，提示客服主动触达

**规则 5 · 临时商品有效期与价格锁定**
- 报价一经发出，价格锁定 **48h**
- 48h 后客户仍未付款：重新报价（汇率可能变动）
- Airtel Money 付款凭证（截图或 Transaction ID）上传 → 人工 2h 内确认

### 1.5 成功指标（North Star & KPI）

| 层级 | 指标 | 目标（MVP 3 个月） |
|---|---|---|
| 北极星 | 月 GMV（USD） | **$15,000** |
| 一级 | 月活询价用户 | 300 |
| 一级 | 询价 → 订单转化率 | **≥ 20%** |
| 一级 | 订单平均客单价 | $50 |
| 二级 | CS 平均首响时长 | < 5 min |
| 二级 | 订单按时到货率 | ≥ 85% |
| 二级 | 客诉率 | < 3% |
| 二级 | AI 自动处理消息占比 | ≥ 40% |
| 成本 | 月度运营成本 | ≤ $500（详见第 10 章） |

---

## 2. User Journey & Workflow

### 2.1 场景 A · 新人入群

```
[Mary 被朋友拉入 ZamGo WhatsApp 群 "ZamGo · 赞比亚代购"]
     ↓
群规 Pinned Message 自动展示：
  "🇿🇲 ZamGo Taobao Daigou
   1️⃣ 私聊 +260 XX XXXX XXXX 咨询
   2️⃣ 发图片/中文名/链接报价
   3️⃣ Airtel Money 付 30% 定金
   4️⃣ 14 天到货 Lusaka 仓自提
   📍 Shop: zamgo.shop"
     ↓
Mary 点群管理员头像 → 私聊 "hi"
     ↓
WATI 触发 welcome_template 自动回复：
  "Welcome to ZamGo 🇨🇳→🇿🇲
   Send me:
   📸 Product photo
   🔗 Taobao link
   📝 Chinese name
   I'll quote in 10 min.
   Type 'menu' for options."
     ↓
[归档入 customer 表, WATI 自动打标签 "new_user"]
```

### 2.2 场景 B · 独立站有货（走捷径）

```
Mary 发消息: "rice cooker 5L please"
     ↓
[Intent Agent] 识别 intent = "product_inquiry"
     ↓
[Matcher Agent] 对 "rice cooker 5L" 做 pgvector 检索
  → 命中 Shopify SKU #SKU-0823（Midea 5L 电饭煲, 现货）
  → 相似度 0.87 > 阈值 0.75
     ↓
自动生成报价卡：
  "📦 Midea 5L Rice Cooker (In Stock 🟢)
   Price: 680 ZMW (all-in)
   Pickup: Lusaka Warehouse, Cairo Rd
   ⏱ Ready today after payment
   🛒 Order: https://zamgo.shop/products/midea-5l-rc"
     ↓
Mary 点击链接 → Shopify 独立站 → 选 Airtel Money 付款（Shopify 原生集成）
     ↓
[Webhook: orders/create] → 后端记录 order → 广播 "Paid ✅ Pickup today 6pm"
```

### 2.3 场景 C · 独立站无货 → 询价流程（核心场景）

```
Mary 发图片 (扫地机器人) + 文字 "how much?"
     ↓
[WATI webhook] POST /api/wati/webhook
     ↓
[Router Agent] 判断:
  - 有图片 + 询价词 → intent = "image_inquiry"
  - 新会话 → 创建 ProductRequest #PR-1042
     ↓
[Matcher Agent] 流程:
  1. 调用 OpenAI Vision API → 识别图片 = "robot vacuum cleaner, white, round"
  2. 生成 embedding → pgvector 检索 shopify_products_cache
     → 无相似度 >0.75 命中
  3. 触发 "需要 Taobao 补充候选" 状态
     ↓
[等待人工/自动 Taobao 搜索]
  方案 A: CS 手动粘贴 Taobao 链接 → Admin Panel 填 SKU / 重量 / 价格
  方案 B: 自动 1688 API 查询 "扫地机器人 白色 圆形" → 返回 3 条候选
     ↓
[Quote Agent] 取 3 条候选, 应用报价公式 → 生成 3 张报价卡：
  "🤖 Robot Vacuum Option A: 950 ZMW (Xiaomi Mi Robot)
   🤖 Option B: 1,280 ZMW (Roborock E5)
   🤖 Option C: 720 ZMW (No-brand clone)
   Delivery: ~14 days | 30% deposit"
     ↓
Mary 选 Option A → 回复 "A"
     ↓
[Order Agent] 创建 Order #ORD-7731
  - 生成 Airtel Money 付款链接: https://zamgo.shop/pay/ORD-7731
  - 定金 = 950 × 0.3 = 285 ZMW
     ↓
Mary 付款 → Shopify orders/paid webhook
     ↓
[运营下单 Taobao] → 更新 order.status = "ordered_from_taobao"
     ↓
[每日状态广播] (GitHub Actions cron):
  Day 1:  "Order placed on Taobao ✅"
  Day 4:  "Shipped from Guangzhou ✈️"
  Day 9:  "Arrived in Lusaka warehouse 📦"
  Day 10: "Ready for pickup! Code: A7K2 | 📍 Cairo Rd Warehouse"
     ↓
Mary 到店自提, 付尾款 665 ZMW (Airtel Money)
     ↓
[CS 标记 fulfilled] → 向 Mary 请求 5 星评价 → 请求授权晒单到群
     ↓
[状态机终点] order.status = "completed"
```

### 2.4 ProductRequest 状态机

```
  new  ──→  matching  ──┬──→ matched_shopify  ──→ quoted
                        │
                        └──→ needs_taobao_search ──→ taobao_found ──→ quoted
                                                 │
                                                 └──→ no_match ──→ declined
  quoted ──→ accepted ──→ (创建 Order) ──→ closed
         └──→ rejected ──→ closed
         └──→ expired (48h) ──→ closed
```

### 2.5 Order 状态机

```
  draft → paid_deposit → ordered_from_taobao → in_transit_cn → arrived_cn_wh
       → in_transit_air → arrived_zm_wh → ready_pickup → picked_up(paid_balance) → completed
                                                      └→ no_show_7d → cancelled_forfeit

  其他分支：
  * → refund_requested → refunded
  * → complaint → escalated → resolved
```

### 2.6 Admin 审核上架流程（Temp → Permanent）

```
临时商品 (Temp Listing) 累计销售 3 单
     ↓
系统发 Slack/Email "SKU X sold 3 times, promote?"
     ↓
运营打开 Admin Panel → Temp Listings 标签
  → 点击 "Promote to Permanent SKU"
  → 填真实重量 / 高清图 / 优化文案
     ↓
Shopify API 创建正式 Product (metafield: promoted_from_temp=true)
     ↓
原 temp_listings 行标 promoted=true, 保留审计
```

---

## 3. 技术架构

### 3.1 高层架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Customer (WhatsApp / Web)                         │
└────────────────┬──────────────────────────────────┬──────────────────┘
                 │                                  │
          [WhatsApp Business]                 [Shopify Storefront]
                 │                                  │
                 ▼                                  ▼
         ┌───────────────┐                  ┌───────────────┐
         │     WATI      │                  │    Shopify    │
         │  (BSP / API)  │                  │  (Products,   │
         │  Templates    │                  │   Orders,     │
         │  24h tracker  │                  │   Checkout)   │
         └──────┬────────┘                  └───────┬───────┘
                │ webhook                           │ webhook
                ▼                                   ▼
         ┌──────────────────────────────────────────────┐
         │       ZamGo Backend (Node.js/TypeScript)     │
         │   ┌──────────────────────────────────────┐   │
         │   │  API Gateway (Fastify + tRPC)        │   │
         │   ├──────────────────────────────────────┤   │
         │   │  Router Agent (rule + LLM intent)    │   │
         │   │  Inquiry Agent   Matcher Agent       │   │
         │   │  Quote Agent     Order Agent         │   │
         │   │  Support Agent                       │   │
         │   ├──────────────────────────────────────┤   │
         │   │  Shopify Sync Service                │   │
         │   │  Taobao/1688 Fetcher                 │   │
         │   │  Airtel Money Reconciler (poll)      │   │
         │   └──────────────────────────────────────┘   │
         └────────┬────────────────────────┬────────────┘
                  │                        │
                  ▼                        ▼
         ┌─────────────────┐      ┌─────────────────┐
         │   Postgres      │      │     Redis       │
         │   + pgvector    │      │  session/cache  │
         │   (Supabase)    │      │  queue (BullMQ) │
         └─────────────────┘      └─────────────────┘
                  ▲
                  │
         ┌────────┴────────┐
         │  Admin Panel    │ ← CS / Operator
         │  (Next.js)      │
         └─────────────────┘
```

### 3.2 组件分工表

| 组件 | 角色 | 选型 | 替代方案 | 决策理由 |
|---|---|---|---|---|
| **Storefront** | 独立站、商品库、支付、订单 | **Shopify Advanced**（$39/mo） | 自建 Medusa/Sarato | 开箱即用、Airtel Money 集成快、运营无需培训 |
| **WhatsApp BSP** | 收发 WA 消息、Template 管理 | **WATI**（$99/mo Pro） | 360dialog / 自建 Cloud API | WATI 有 UI、支持多客服、Template 审核快 |
| **后端 API** | AI Agent、业务逻辑、Webhook 入口 | **Node.js + Fastify + tRPC** | NestJS / Python FastAPI | TS 生态 + LLM SDK 支持最好 |
| **AI 路由** | Intent 分类、Agent 路由 | 规则优先 + **GPT-4o-mini** fallback | 纯规则 / 纯 LLM | 参考 medguide-china 经验，90% 规则命中 |
| **商品匹配** | 图片/文本 → SKU | **OpenAI embeddings + pgvector** | Pinecone / Weaviate | 单库够用、无额外服务 |
| **图片理解** | 商品图片 → 关键词 | **GPT-4o Vision** | Google Cloud Vision | 中文描述质量更好 |
| **Taobao 抓取** | 补充非现货候选 | **1688 开放平台 + 人工辅助** | Unofficial scraper | 合规第一、人工兜底 |
| **数据库** | 主库（含向量） | **Postgres 15 + pgvector**（Supabase $25/mo） | 独立 Pinecone | 省成本 |
| **缓存/队列** | 会话、BullMQ 异步任务 | **Redis**（Upstash $10/mo） | RabbitMQ | 轻量足够 |
| **Admin 后台** | CS Kanban + 运营看板 | **Next.js 15 + shadcn/ui** | Retool | 可自定义、无 SaaS 依赖 |
| **托管** | 应用部署 | **Fly.io**（$15-30/mo） | Render / Railway | 就近边缘节点（Johannesburg） |
| **对象存储** | 用户图片、晒单图 | **Cloudflare R2**（$0.015/GB） | S3 | 零出口费用 |
| **监控** | 错误/日志 | **Sentry**（free tier） | Datadog | 够 MVP 用 |

### 3.3 询价场景数据流（核心 E2E）

```
T+0.0s  Customer 发图片 + "how much" 到 WhatsApp
T+0.3s  WATI 收到 → POST webhook 到 /api/wati/webhook
T+0.4s  Backend 校验签名 → 解析消息 → 入 messages 表
T+0.5s  [BullMQ] 推入 "incoming-message" 队列
T+0.6s  Worker 取出 → load conversation_state from Redis
T+0.7s  [Router Agent] classifyIntent("how much")
        → 规则命中 "price_inquiry" (confidence 0.9)
T+0.8s  [Matcher Agent] 启动:
        - 下载图片到 R2
        - 调用 GPT-4o Vision：返回 "robot vacuum, white, round, Xiaomi-style"
        - 生成 embedding (OpenAI text-embedding-3-small, 1536d)
T+2.5s  [pgvector] SELECT ... ORDER BY embedding <=> $1 LIMIT 5
        → 返回 5 个候选 + 相似度
T+2.6s  过滤 similarity >= 0.75 → 若命中则走"有货路径"
T+2.7s  [无命中] 触发 "needs_taobao_search"
        - 保存 ProductRequest #PR-1042, status=needs_taobao_search
        - 推送 Slack "New inquiry, please search Taobao: [img link]"
        - 同时调用 1688 API 获取 3 条候选 (async, ~5s)
T+3.0s  回复客户 "Got it 👍 searching Taobao for the best price, back in 10 min"
        (用 WATI send message API)
T+8.0s  [1688 API] 返回 → Quote Agent 计算 3 个报价
T+8.5s  生成报价卡 (WhatsApp interactive list message)
T+8.7s  WATI 发送报价卡
T+8.8s  Customer 点击 "Option A"
T+8.9s  WATI webhook "button_reply" → 更新 ProductRequest status=accepted
T+9.0s  [Order Agent] 创建 Shopify Draft Order → 返回 checkout_url
T+9.5s  Backend 回复 "👉 Pay 285 ZMW deposit: [checkout_url]"
T+9.6s  Customer 点击 → Shopify checkout → Airtel Money → 付款成功
T+60s   Shopify orders/paid webhook → 更新 order.status=paid_deposit
T+61s   Backend 回复 "Paid ✅ Your order #ORD-7731 is queued for Taobao"
```

关键耗时拆解：
- WATI webhook 往返 ≈ 0.3s
- Vision API ≈ 1.5s
- Embedding + pgvector ≈ 0.3s
- 1688 API ≈ 3-5s（后台异步，不阻塞首次回复）

---

## 4. 数据模型

### 4.1 DDL —— 8 张核心表

```sql
-- ================== 扩展 ==================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ================== 1. customers ==================
CREATE TABLE customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_phone        TEXT UNIQUE NOT NULL,        -- +260971234567
  wa_name         TEXT,                         -- WhatsApp profile name
  preferred_name  TEXT,                         -- CS 手动填写
  language        TEXT DEFAULT 'en',            -- en | zh | bem
  city            TEXT DEFAULT 'Lusaka',
  tags            TEXT[] DEFAULT '{}',          -- ["new_user","vip","complained_once"]
  total_orders    INT DEFAULT 0,
  total_gmv_zmw   NUMERIC(12,2) DEFAULT 0,
  blocked         BOOLEAN DEFAULT FALSE,
  last_msg_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_customers_wa_phone ON customers(wa_phone);
CREATE INDEX idx_customers_last_msg ON customers(last_msg_at DESC);

-- ================== 2. product_requests ==================
-- 每条用户询价对应一条 ProductRequest
CREATE TABLE product_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID REFERENCES customers(id),
  raw_text        TEXT,                         -- 客户原话
  image_url       TEXT,                         -- R2 图片 URL
  ai_keywords     TEXT,                         -- GPT Vision 抽取的英文关键词
  embedding       vector(1536),                 -- text-embedding-3-small
  status          TEXT NOT NULL DEFAULT 'new',
  -- new | matching | matched_shopify | needs_taobao_search
  -- taobao_found | quoted | accepted | rejected | expired | closed
  matched_sku_id  TEXT,                         -- Shopify product_id (若直接命中)
  assigned_cs_id  UUID REFERENCES cs_agents(id),
  expires_at      TIMESTAMPTZ,                  -- quote 48h 失效
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pr_customer ON product_requests(customer_id, created_at DESC);
CREATE INDEX idx_pr_status ON product_requests(status);
CREATE INDEX idx_pr_embedding ON product_requests
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ================== 3. quotes ==================
-- 对每个 ProductRequest 的报价（可 1 对多：3 个 option）
CREATE TABLE quotes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id        UUID REFERENCES product_requests(id) ON DELETE CASCADE,
  source            TEXT NOT NULL,              -- shopify_sku | taobao | 1688 | manual
  source_url        TEXT,                       -- 原链接
  title_cn          TEXT,
  title_en          TEXT,
  image_url         TEXT,
  taobao_price_cny  NUMERIC(10,2),
  est_weight_kg     NUMERIC(6,3),
  est_shipping_usd  NUMERIC(8,2),
  fx_cny_zmw        NUMERIC(8,4),               -- 报价时的汇率 snapshot
  fx_usd_zmw        NUMERIC(8,4),
  final_price_zmw   NUMERIC(12,2) NOT NULL,
  deposit_zmw       NUMERIC(12,2) NOT NULL,     -- 30%
  profit_margin     NUMERIC(4,3) DEFAULT 0.18,
  eta_days          INT DEFAULT 14,
  selected          BOOLEAN DEFAULT FALSE,       -- 客户选了这个 option
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_quotes_request ON quotes(request_id);

-- ================== 4. temp_listings ==================
-- 从 Taobao/1688 找到的商品临时上架
CREATE TABLE temp_listings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_product_id TEXT UNIQUE,               -- Shopify 创建后的 product_id
  source_url        TEXT NOT NULL,              -- Taobao/1688 链接
  title_cn          TEXT,
  title_en          TEXT,
  category          TEXT,                       -- electronics | home | beauty | ...
  taobao_price_cny  NUMERIC(10,2),
  est_weight_kg     NUMERIC(6,3),
  current_price_zmw NUMERIC(12,2),
  sold_count        INT DEFAULT 0,
  expires_at        TIMESTAMPTZ NOT NULL,       -- 创建时 = now() + 7 days
  promoted          BOOLEAN DEFAULT FALSE,      -- 转正后 true
  created_by        UUID REFERENCES cs_agents(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_temp_expires ON temp_listings(expires_at) WHERE promoted = FALSE;

-- ================== 5. orders ==================
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code          TEXT UNIQUE NOT NULL,     -- ORD-7731
  customer_id         UUID REFERENCES customers(id),
  request_id          UUID REFERENCES product_requests(id),
  quote_id            UUID REFERENCES quotes(id),
  shopify_order_id    TEXT UNIQUE,              -- 关联 Shopify
  total_zmw           NUMERIC(12,2) NOT NULL,
  deposit_zmw         NUMERIC(12,2) NOT NULL,
  balance_zmw         NUMERIC(12,2) NOT NULL,
  deposit_paid_at     TIMESTAMPTZ,
  deposit_airtel_ref  TEXT,
  balance_paid_at     TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'draft',
  -- draft | paid_deposit | ordered_from_taobao | in_transit_cn
  -- | arrived_cn_wh | in_transit_air | arrived_zm_wh
  -- | ready_pickup | picked_up | completed
  -- | refund_requested | refunded | cancelled | no_show_forfeit
  taobao_order_no     TEXT,                     -- 国内下单号
  tracking_cn         TEXT,
  tracking_air        TEXT,
  pickup_code         TEXT,                     -- A7K2
  pickup_at           TIMESTAMPTZ,
  eta_pickup_date     DATE,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_eta ON orders(eta_pickup_date) WHERE status NOT IN ('completed','cancelled');

-- ================== 6. cs_agents ==================
CREATE TABLE cs_agents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,                -- 小陈
  wa_phone        TEXT,                          -- 客服自己的手机号
  role            TEXT DEFAULT 'cs',             -- cs | operator | admin
  active          BOOLEAN DEFAULT TRUE,
  languages       TEXT[] DEFAULT '{en,zh}',
  max_concurrent  INT DEFAULT 15,                -- 同时处理会话上限
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ================== 7. shopify_products_cache ==================
-- Shopify 商品的本地镜像（为了 embedding 检索）
CREATE TABLE shopify_products_cache (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopify_product_id TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  price_zmw         NUMERIC(12,2),
  image_urls        TEXT[],
  tags              TEXT[],
  is_temp           BOOLEAN DEFAULT FALSE,       -- 是否临时商品
  in_stock          BOOLEAN DEFAULT TRUE,
  embedding         vector(1536),
  synced_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_spc_embedding ON shopify_products_cache
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_spc_category ON shopify_products_cache(category);

-- ================== 8. category_weight_defaults ==================
-- 品类默认重量（AI 匹配不到重量时的兜底）
CREATE TABLE category_weight_defaults (
  category        TEXT PRIMARY KEY,
  default_kg      NUMERIC(6,3) NOT NULL,
  default_ship_multiplier NUMERIC(3,2) DEFAULT 1.0,  -- 特殊品类系数
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO category_weight_defaults (category, default_kg, default_ship_multiplier) VALUES
  ('electronics_small', 0.5, 1.0),      -- 耳机/手机配件
  ('electronics_medium', 2.0, 1.0),     -- 电饭煲/小家电
  ('electronics_large', 8.0, 1.2),      -- 扫地机/空气炸锅
  ('clothing', 0.4, 1.0),
  ('shoes', 0.8, 1.0),
  ('beauty', 0.3, 1.0),
  ('home_textile', 1.5, 1.0),
  ('toy', 0.6, 1.0),
  ('book', 0.5, 1.1),                   -- 图书特殊系数（体积）
  ('default', 1.0, 1.0);

-- ================== 9. config (KV 配置表) ==================
CREATE TABLE config (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  updated_by      UUID REFERENCES cs_agents(id),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO config (key, value) VALUES
  ('fx_cny_zmw', '{"rate": 3.80, "buffer": 1.03, "updated": "2026-04-05"}'),
  ('fx_usd_zmw', '{"rate": 26.50, "buffer": 1.02, "updated": "2026-04-05"}'),
  ('ship_per_kg_usd', '{"base": 9.0}'),
  ('fixed_fee_zmw', '{"amount": 20}'),
  ('profit_margin', '{"rate": 0.18, "min": 0.10, "max": 0.30}'),
  ('deposit_ratio', '{"ratio": 0.30, "min_zmw": 100, "max_zmw": 5000}'),
  ('quote_ttl_hours', '{"hours": 48}'),
  ('pickup_free_days', '{"days": 7}'),
  ('storage_fee_per_day_zmw', '{"amount": 30}');

-- ================== 附加：messages（完整会话历史） ==================
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID REFERENCES customers(id),
  direction       TEXT NOT NULL,                 -- inbound | outbound
  wa_message_id   TEXT,                          -- WATI 消息 ID
  type            TEXT NOT NULL,                 -- text | image | audio | interactive
  content         TEXT,
  media_url       TEXT,
  intent          TEXT,                          -- router 识别的 intent
  agent           TEXT,                          -- 处理的 Agent
  sent_by         UUID REFERENCES cs_agents(id), -- 若人工发送
  is_ai           BOOLEAN DEFAULT FALSE,
  request_id      UUID REFERENCES product_requests(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_customer_time ON messages(customer_id, created_at DESC);
```

### 4.2 字段说明 & 约束

- **embedding** 字段使用 `text-embedding-3-small` (1536 维, $0.02/1M tokens)
- **pgvector 索引** 使用 `ivfflat` + `vector_cosine_ops`，lists=100 适合 <10 万行
- **所有金额** 统一用 `NUMERIC(12,2)`，避免浮点误差
- **status 字段** 必须有 `CHECK` 约束（此处为简洁省略，实际须加）
- **温度/时间** 统一 `TIMESTAMPTZ`，永远 UTC 存储

---

## 5. API 设计

### 5.1 WATI Webhook Endpoint

```
POST /api/wati/webhook
Content-Type: application/json
X-Wati-Signature: HMAC-SHA256(raw_body, WATI_WEBHOOK_SECRET)

Body (inbound message):
{
  "eventType": "message",
  "waId": "260971234567",
  "senderName": "Mary",
  "text": "how much for this?",
  "type": "image",
  "mediaUrl": "https://cdn.wati.io/...",
  "timestamp": "2026-04-05T08:32:11Z",
  "messageId": "wamid.xxx"
}

Response: 200 OK { "received": true }
```

**处理逻辑**（参考 `medguide-china/src/app/api/chat/route.ts` 的 SSE 模式，这里改为异步队列）：

```ts
// POST /api/wati/webhook  (pseudo)
async function handler(req) {
  if (!verifySignature(req)) return 401
  const msg = req.body

  // 1. 入库 message
  const customer = await upsertCustomer(msg.waId, msg.senderName)
  await insertMessage({ customer, direction:'inbound', ...msg })

  // 2. 推队列异步处理（立即返回 200，避免 webhook 超时）
  await bullQueue.add('process-inbound', { messageId, customerId: customer.id })

  return { received: true }
}
```

### 5.2 商品匹配 API

```
POST /api/internal/match
Body: {
  "text": "robot vacuum cleaner",
  "imageUrl": "https://r2.zamgo.shop/images/abc.jpg",
  "topK": 5
}
Response: {
  "candidates": [
    { "sku": "SKU-0823", "title": "Midea 5L Rice Cooker", "similarity": 0.87, "price_zmw": 680, "in_stock": true },
    ...
  ],
  "bestMatch": { ... } | null,
  "needsTaobaoSearch": true
}
```

### 5.3 Taobao/1688 查询 API

```
POST /api/internal/fetch-taobao
Body: { "keywords": "robot vacuum white round", "limit": 3 }
Response: {
  "candidates": [
    {
      "source": "1688",
      "url": "https://detail.1688.com/offer/xxx.html",
      "title_cn": "小米扫地机器人",
      "title_en": "Xiaomi Mi Robot Vacuum",
      "price_cny": 799,
      "est_weight_kg": 6.5,
      "image_url": "https://cbu01.alicdn.com/..."
    },
    ...
  ]
}
```

### 5.4 报价生成 API

```
POST /api/internal/quote
Body: {
  "requestId": "uuid",
  "candidates": [ { "source":"1688", "price_cny":799, "weight_kg":6.5, ... } ]
}
Response: {
  "quotes": [
    {
      "id": "uuid",
      "final_price_zmw": 4200,
      "deposit_zmw": 1260,
      "breakdown": {
        "item_cost_zmw": 3125,   // 799 × 3.80 × 1.03
        "shipping_zmw": 1547,    // 6.5 × 9 × 26.5 × 1.02
        "fixed_fee_zmw": 20,
        "margin": 0.18
      }
    }
  ]
}
```

### 5.5 临时商品 CRUD

```
POST /api/admin/temp-listings        创建（含 Shopify API 调用）
GET  /api/admin/temp-listings?expired=false
PATCH /api/admin/temp-listings/:id   编辑价格/标题
POST /api/admin/temp-listings/:id/promote  转正式 SKU
DELETE /api/admin/temp-listings/:id
```

### 5.6 Shopify 集成

```
Webhook IN:
  /api/shopify/webhook/orders-create
  /api/shopify/webhook/orders-paid
  /api/shopify/webhook/orders-fulfilled

Backend → Shopify:
  POST   /admin/api/2024-10/products.json         # 创建商品
  POST   /admin/api/2024-10/draft_orders.json     # 生成付款链接
  GET    /admin/api/2024-10/products.json         # 同步本地缓存
```

### 5.7 运营后台 API

```
GET  /api/admin/dashboard            # 今日数据看板
GET  /api/admin/requests?status=new  # 询价 Kanban 数据
GET  /api/admin/orders?status=ordered_from_taobao
PATCH /api/admin/orders/:id/status   # 手动推进状态
POST /api/admin/orders/:id/confirm-deposit  # 人工确认 Airtel 到账
GET  /api/admin/config               # 读取配置
PATCH /api/admin/config/:key         # 改汇率/利润率
POST /api/admin/broadcast            # 批量状态广播（走 WhatsApp template）
```

---

## 6. AI/LLM 集成

### 6.1 Agent 拆分（5 + 1）

参考 `medguide-china` 多 Agent 架构：`Router → 专业 Agent → 转化 Agent`。ZamGo 简化为：

| Agent | 职责 | 触发时机 | 温度 | 模型 |
|---|---|---|---|---|
| **Router** | Intent 分类、会话状态、路由 | 每条 inbound | N/A（规则） | — |
| **Inquiry** | 通用 FAQ、价格说明、运费介绍 | intent=faq/general | 0.7 | gpt-4o-mini |
| **Matcher** | 图片+文本 → Shopify SKU 检索 | intent=product_inquiry | 0.3 | Vision: gpt-4o / Embedding |
| **Quote** | 报价话术、报价卡渲染 | ProductRequest quoted | 0.5 | gpt-4o-mini |
| **Order** | 付款/状态查询 | intent=order_status | 0.4 | gpt-4o-mini |
| **Support** | 售后/投诉/情绪 → 转人工 | intent=complaint/refund | N/A（只路由） | — |

### 6.2 两层 Intent 分类（规则 + LLM fallback）

> 直接借鉴 `medguide-china/src/lib/ai/agents/router.ts` 的 `classifyIntent` 模式 ——
> **Rule-based 优先**（0 成本、0 延迟，覆盖 ~80%），不命中才走 LLM。
> **TODO: 参考 medguide-china/src/lib/ai/agents/router.ts#classifyIntent**

```ts
// apps/backend/src/ai/router.ts
const INTENT_PATTERNS: Record<string, RegExp> = {
  product_inquiry: /\b(how much|price|quote|cost|cheap|buy|order|looking for|need|want|do you have|got)\b/i,
  order_status: /\b(where is|status|track|when|arrive|delivery|pickup|ready)\b.*\b(order|parcel|thing|stuff)\b/i,
  payment_help: /\b(airtel|mtn|pay|payment|deposit|transfer|how to pay)\b/i,
  complaint: /\b(broken|damaged|wrong|refund|return|bad|scam|angry|complain|report)\b/i,
  greeting: /^(hi|hello|hey|morning|muli bwanji|mwapoleni)\b/i,
  faq: /\b(how long|how many days|where is (shop|warehouse)|location|open|hours)\b/i,
}

function classifyIntentRule(text: string): { intent: string; confidence: number } | null {
  const t = text.toLowerCase()
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(t)) return { intent, confidence: 0.9 }
  }
  return null
}

async function classifyIntentLLM(text: string, history: Msg[]): Promise<{intent:string;confidence:number}> {
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: INTENT_CLASSIFIER_PROMPT },
      { role: 'user', content: `History:\n${history.map(m=>m.content).join('\n')}\n\nLast: ${text}` }
    ]
  })
  return JSON.parse(resp.choices[0].message.content!)
}

export async function routeMessage(text: string, state: ConversationState) {
  const rule = classifyIntentRule(text)
  if (rule && rule.confidence > 0.85) return rule
  return classifyIntentLLM(text, state.recentMessages)
}
```

### 6.3 pgvector 向量检索

```sql
-- 查询最相似的 5 个 SKU
SELECT
  shopify_product_id, title, price_zmw, image_urls[1] AS image,
  1 - (embedding <=> $1::vector) AS similarity
FROM shopify_products_cache
WHERE in_stock = TRUE
ORDER BY embedding <=> $1::vector
LIMIT 5;
```

匹配策略：
- similarity >= 0.85 → 直接用，无需人工确认
- 0.75 <= similarity < 0.85 → 推送给客服"确认后发送"
- similarity < 0.75 → 走 Taobao 补充候选

### 6.4 ConversationState 结构

> **TODO: 参考 medguide-china/src/lib/ai/agents/types.ts#ConversationState**

```ts
interface ConversationState {
  customerId: string
  messageCount: number
  lastIntents: string[]           // 最近 5 条 intent
  lastAgent: AgentType | null
  activeRequestId: string | null  // 当前进行的 ProductRequest
  activeOrderId: string | null
  lastMessageAt: Date
  within24hWindow: boolean
  hasPendingQuote: boolean
  hasUnpaidOrder: boolean
  escalatedToHuman: boolean       // 是否已转人工
  tags: string[]                  // new_user | vip | complained | ...
  recentMessages: Msg[]           // 最近 10 条消息（作 LLM 上下文）
}
```

### 6.5 人工接管触发规则

出现以下任一情况 → AI 挂起 + Slack @CS：

1. **投诉词**：broken / scam / refund / angry / threaten to sue
2. **订单金额** > 3000 ZMW（单笔大额）
3. **连续 3 条** AI 回复后客户仍不满（检测"still / again / no / don't understand"）
4. **intent 为 null**（规则和 LLM 都无法分类，confidence < 0.5）
5. **客户明确请求**："talk to human / real person / manager"
6. **汇率波动** 超 ±5% → 所有 Quote Agent 挂起，等运营更新
7. **Image 识别返回无关内容**（selfie / screenshot of chat / meme 等）

### 6.6 成本控制

- 所有 Agent 都用 `gpt-4o-mini`（$0.15/1M input, $0.60/1M output）
- 仅 Vision API 用 `gpt-4o`（$2.50/1M input）
- Embedding 用 `text-embedding-3-small`（$0.02/1M tokens）
- 通过 Redis 缓存 FAQ 回复（命中即返回，零 LLM 调用）

**单次询价成本估算**：
```
Intent 分类:   0.3k input  → $0.00005 (通常命中规则，$0)
Vision 识别:   1.5k input  → $0.004
Embedding:     0.1k        → $0.000002
Quote 生成:    1k in / 0.3k out → $0.00033
-------- 合计约 $0.005/询价 = 每 1000 询价 $5
```

---

## 7. Taobao/1688 抓取策略

### 7.1 四种方案合规性对比

| 方案 | 合规性 | 成本 | 稳定性 | 可扩展 | 推荐 |
|---|---|---|---|---|---|
| **① 纯人工搜索** | ✅ 100% 合规 | 低（人力） | 高 | 差（不 scale） | ★★★ MVP 阶段 |
| **② 1688 开放平台 API** | ✅ 官方授权 | 中（$50-200/mo） | 高 | 高 | ★★★★★ 推荐 |
| **③ Taobao 开放平台** | ⚠️ 需 ISV 资质，非法人难拿 | 高 | 高 | 高 | ★ 暂缓 |
| **④ 第三方爬虫/Scraper** | ❌ 违反 TOS，IP 封禁风险 | 低 | 低 | 差 | ✗ 禁用 |

### 7.2 推荐组合

**Phase 1（W1-W4）**：人工搜索 100% + Shopify 现货优先
- CS 在 Admin Panel 粘贴 Taobao 链接 → 系统自动抓取主图、标题、价格（单次抓取，无批量，落入灰色地带但风险极低）
- 同时用 1688 API 自动补充 3 个候选（官方授权，无风险）

**Phase 2（W5+）**：1688 API 为主，Taobao 链接人工补齐
- 所有新询价优先调 1688 API
- 当 API 返回质量差时，运营从 Taobao 手动补
- **长期不做 Taobao 自动爬虫**

### 7.3 1688 API 集成点

```
POST https://gw.open.1688.com/openapi/offer.search
需要：
  - appKey, appSecret（1688 开放平台注册）
  - access_token（OAuth 2.0）
  - keyword（中文）
  - 按需付费或授权包月

返回字段关注：
  - offerId, subject (标题), price (区间), picUrl, qualityLevel
  - unitWeight（重量，很多商家未填，需兜底到 category_weight_defaults）
```

### 7.4 品类默认重量表（运营可调）

见 **4.1 表 8 `category_weight_defaults`** 的 INSERT 数据。新增品类由运营在 Admin Panel 添加。

### 7.5 报价公式实现代码

```ts
// apps/backend/src/domain/quote.ts
export interface QuoteInput {
  taobao_price_cny: number
  est_weight_kg: number
  category?: string
}

export async function computeQuote(input: QuoteInput): Promise<QuoteBreakdown> {
  const cfg = await loadConfig([
    'fx_cny_zmw','fx_usd_zmw','ship_per_kg_usd',
    'fixed_fee_zmw','profit_margin','deposit_ratio'
  ])

  const fxCnyZmw = cfg.fx_cny_zmw.rate * cfg.fx_cny_zmw.buffer     // 3.80 * 1.03
  const fxUsdZmw = cfg.fx_usd_zmw.rate * cfg.fx_usd_zmw.buffer     // 26.50 * 1.02
  const shipUsd = cfg.ship_per_kg_usd.base                          // 9
  const fixedFee = cfg.fixed_fee_zmw.amount                         // 20
  const margin = cfg.profit_margin.rate                             // 0.18

  // 若无重量，查兜底
  let weight = input.est_weight_kg
  if (!weight || weight <= 0) {
    const def = await loadCategoryWeight(input.category || 'default')
    weight = def.default_kg
  }

  const itemZmw = input.taobao_price_cny * fxCnyZmw
  const shipZmw = weight * shipUsd * fxUsdZmw
  const subtotal = itemZmw + shipZmw + fixedFee
  const finalPrice = subtotal * (1 + margin)

  // 定金：ratio × 价格, 但有上下限
  const depRatio = cfg.deposit_ratio.ratio
  const depMin = cfg.deposit_ratio.min_zmw
  const depMax = cfg.deposit_ratio.max_zmw
  const deposit = Math.max(depMin, Math.min(depMax, finalPrice * depRatio))

  return {
    item_cost_zmw: round2(itemZmw),
    shipping_zmw: round2(shipZmw),
    fixed_fee_zmw: fixedFee,
    subtotal_zmw: round2(subtotal),
    margin_pct: margin,
    final_price_zmw: round2(finalPrice),
    deposit_zmw: round2(deposit),
    balance_zmw: round2(finalPrice - deposit),
    fx_cny_zmw: fxCnyZmw,
    fx_usd_zmw: fxUsdZmw,
  }
}

function round2(n: number) { return Math.round(n * 100) / 100 }
```

---

## 8. Rollout · 6 周里程碑

### Week 1 — 基建 + 人工流程跑通
**目标**：0 代码，所有基础服务开通 + 手动完成首单
- [ ] 注册 Shopify Advanced（14 天试用）
- [ ] 注册 WATI Pro（申请 WhatsApp Business Account，绑定赞比亚号段 +260）
- [ ] 开通 Airtel Money 商户账户（需要赞比亚本地公司）
- [ ] 上架 **20 个现货 SKU** 到 Shopify（爆款优先：电饭煲、空气炸锅、护肤品、童装）
- [ ] 写客服 SOP 文档（响应模板、报价话术、退款规则）
- [ ] 建 WhatsApp 群 "ZamGo Lusaka"、邀请 50 个种子用户
- [ ] 注册 Supabase / Fly.io / Upstash / Sentry / Cloudflare R2 账号
- [ ] 建 GitHub repo + monorepo 脚手架（pnpm workspaces: backend / admin / shared）

**验收**：人工完成 3 笔真实订单（从询价到自提），GMV 达 $200

### Week 2 — 后端骨架
**目标**：WATI webhook 接入 + 消息入库 + 简易 Kanban
- [ ] Fastify + tRPC 骨架（健康检查、错误处理、签名校验中间件）
- [ ] DDL 建表（9 张表全部上线）
- [ ] WATI webhook `/api/wati/webhook`（验签 + 入 messages 表 + 推 BullMQ）
- [ ] `customers upsert` 逻辑
- [ ] Admin Panel 骨架（Next.js + Clerk 鉴权）
  - 页面：Inbox / Requests Kanban / Orders / Settings
- [ ] Kanban 5 列：`new | matching | quoted | paid | fulfilled`
- [ ] Shopify 商品全量同步 → `shopify_products_cache`（不含 embedding）

**验收**：客户在 WhatsApp 说一句话，3 秒内在 Admin Panel 看到

### Week 3 — AI 匹配
**目标**：图片/文本 → Shopify SKU 自动报价
- [ ] OpenAI SDK 集成 + 环境变量管理
- [ ] `shopify_products_cache.embedding` 批量回填（~2000 行任务）
- [ ] Router Agent（规则 classifyIntent + LLM fallback）
- [ ] Matcher Agent：
  - 图片下载到 R2
  - GPT-4o Vision 抽取关键词
  - Embedding + pgvector 检索
- [ ] Quote Agent：应用公式 → 生成报价卡（WhatsApp interactive list template）
- [ ] Inquiry Agent（FAQ 自动回复）

**验收**：10 条测试询价（现货类），自动报价正确率 ≥80%，平均耗时 <10s

### Week 4 — 临时商品 + 1688 API + Airtel 付款
**目标**：无现货场景也能走通
- [ ] 1688 开放平台接入 `/api/internal/fetch-taobao`
- [ ] Temp Listings 表 + Admin CRUD 页面
- [ ] Shopify Admin API：创建临时 SKU（打 `temp=true` metafield）
- [ ] Airtel Money 付款链接生成（Shopify Payment 配置）
- [ ] 人工对账页面（上传凭证、CS 确认到账）
- [ ] 定金 30% 扣款逻辑

**验收**：完整走通 "询价 → AI 找 1688 → 临时上架 → 付定金 → 入 Admin 订单" 链路

### Week 5 — 订单全状态机 + 自动转正
**目标**：下单后的 14 天全自动化
- [ ] Order 状态机 + 状态推进 API
- [ ] 每日 cron（GitHub Actions）按 `eta_pickup_date` 广播状态（WhatsApp template）
- [ ] 临时商品 ≥3 单触发 "promote" 通知
- [ ] 一键 promote 页面（批量编辑重量/高清图）
- [ ] 运营日报看板（GMV / 转化率 / 在途 / 客诉）
- [ ] Support Agent：投诉词触发 AI 挂起 + Slack 通知

**验收**：1 个订单跑完全部 8 个状态，广播按时发送

### Week 6 — 灰度上线 + 打磨
**目标**：50 真实用户使用，收集反馈
- [ ] WhatsApp 24h 窗口告警（23h 未回复 → Slack）
- [ ] 多语言话术（EN 为主 + ZH 备用 + 几句 Bemba）
- [ ] 压力测试（100 并发询价）
- [ ] 产品 QA + Bug 修复
- [ ] 数据备份脚本（每日 Supabase dump → R2）
- [ ] 对外营销：Facebook/Instagram 打 5 条广告（Lusaka 定向，预算 $100）

**验收**：50 用户 × 100 订单 × 客诉率 <3% × CS 无过劳

### 时间线 Gantt

```
Week:     | 1 | 2 | 3 | 4 | 5 | 6 |
基建      |▓▓▓|   |   |   |   |   |
后端骨架  |   |▓▓▓|   |   |   |   |
AI 匹配   |   |   |▓▓▓|   |   |   |
临时商品  |   |   |   |▓▓▓|   |   |
订单全链路|   |   |   |   |▓▓▓|   |
灰度上线  |   |   |   |   |   |▓▓▓|
人工客服  |▓▓▓|▓▓▓|▓▓▓|▓▓▓|▓▓▓|▓▓▓| ← 始终存在
```

---

## 9. 风险与应对

| # | 风险 | 影响 | 可能性 | 应对策略 |
|---|------|------|--------|---------|
| R1 | **Airtel Money 无 webhook**，需人工对账 | 高 | 高 | 凭证上传 + 人工 2h 确认；探索 Zamtel/MTN 备选 |
| R2 | **Taobao 爬取合规风险** | 高 | 中 | 100% 人工或 1688 官方 API，不写爬虫 |
| R3 | **WhatsApp 24h 窗口** 错过 → template 成本升 | 中 | 高 | 23h 告警 + 预审批 5 条高频 Template |
| R4 | **质量纠纷**（商品与图不符） | 高 | 中 | 30% 定金 + 到仓验货后付尾款；退换货 SOP |
| R5 | **物流延迟**（14→30 天） | 高 | 中 | 赔偿券（10% 抵扣券） + 主动道歉话术 |
| R6 | **汇率波动** 报价后 CNY/ZMW 跳 5% | 中 | 中 | 报价有效期 48h；公式带 3% buffer |
| R7 | **LLM 报错价** 公式参数被注入 | 高 | 低 | 公式由后端确定性计算，LLM 只渲染话术不计算 |
| R8 | **客服离职** 单点故障 | 高 | 中 | 至少 2 名 CS，SOP 文档化，WATI 多人协作 |
| R9 | **恶意客户** 虚假下单/占用客服 | 中 | 高 | 30% 定金门槛 + blocklist + 48h 不付自动取消 |
| R10 | **赞比亚本地政策** 进口关税变动 | 高 | 低 | 月度政策扫描，主动对接海关代理 |
| R11 | **仓库盗损** 东西被偷 | 中 | 低 | 监控 + 保险 + 入库拍照存档 |
| R12 | **Shopify 区域限制** 赞比亚支付通道不稳 | 高 | 低 | 备选：Flutterwave / 自建 Airtel Webhook 中继 |

---

## 10. 成本估算

### 10.1 月度固定运营成本

| 项目 | 费用/月 | 说明 |
|---|---|---|
| Shopify Advanced | $39 | 独立站 + Checkout |
| WATI Pro | $99 | WhatsApp BSP + 多客服 UI |
| Supabase Pro | $25 | Postgres + pgvector |
| Fly.io 应用 | $20 | 1 vCPU × 1GB × 2 实例 |
| Upstash Redis | $10 | 队列 + 会话 |
| Cloudflare R2 | $5 | 图片存储（<300GB） |
| Sentry | $0 | free tier |
| 1688 API | $50 | 按量包月（估） |
| OpenAI API | **~$15** | 详见下 |
| 域名 + 邮箱 | $5 | Namecheap + Google Workspace |
| 国内微信收单手续费 | ~$50 | 采购下单手续费（0.6%） |
| Facebook/IG 广告 | $100 | 持续获客 |
| **合计** | **≈ $418** | |

**第 1 月营销额外** +$200（开张推广），所以 **Month 1 ≈ $620**
**稳定期 Month 3+ ≈ $375-420**

### 10.2 LLM 成本详算（1000 询价/天）

```
假设：每天 1000 条 inbound，其中：
  - 40% 规则命中，零 LLM                       = 0 成本
  - 30% 走 Matcher (Vision + Embedding + Quote) = 主成本
  - 20% 走 Inquiry FAQ (gpt-4o-mini)
  - 10% LLM Intent 分类（规则未命中）

每天成本：
  Matcher 300 × $0.005 = $1.50
  Inquiry 200 × $0.0008 = $0.16
  Intent 100 × $0.0002 = $0.02

每天 ≈ $1.68 → 月 ≈ $50
（题设 1000/天 偏高，实际 MVP 早期 100-200/天，月成本 $5-15）
```

### 10.3 启动一次性成本

| 项目 | 费用 | 说明 |
|---|---|---|
| 赞比亚公司注册 | $300 | 本地代办 |
| Shopify 主题/设置 | $0-200 | 免费主题或 Dawn |
| 初始 SKU 采购（20 款） | $2,000 | 现货库存 |
| 仓库租金（首 3 月） | $600 | Lusaka Cairo Rd, ~20m² |
| 打印机/电子秤/标签 | $200 | 仓库装备 |
| 启动营销（50 KOC） | $300 | 免费送样 + 反馈 |
| **合计** | **≈ $3,400** | |

### 10.4 Break-even 估算

- 目标 Month 3：GMV $15k，净利 ~18% = **$2,700**
- 月成本 ~$420
- **Month 3 净盈利 ≈ $2,280 → 1.5 个月覆盖启动成本**

---

## 11. 关键 AI Prompts

### 11.1 Intent Classifier（规则未命中时兜底）

```
You are a Zambian cross-border e-commerce intent classifier for ZamGo (Taobao → Lusaka daigou on WhatsApp).

Classify the USER's last message into ONE of:
- product_inquiry: asking price, looking for a product, sending image/link
- order_status: "where is my order", tracking, pickup timing
- payment_help: Airtel Money, deposit, how to pay
- complaint: damaged, wrong, refund, angry, scam
- greeting: hi/hello/muli bwanji
- faq: shop hours, location, general policies
- off_topic: unrelated to shopping
- unknown: cannot classify

Zambian context:
- Users mix English + Bemba ("muli bwanji" = how are you)
- "K500" means 500 Kwacha (ZMW)
- "how much is this" in a photo = product_inquiry
- "when is my thing coming" = order_status

Output strict JSON: {"intent":"...","confidence":0.0-1.0,"reasoning":"..."}

History (last 3 turns):
{history}

Last user message:
{message}
```

### 11.2 Product Matcher (Vision + text)

```
You are a product identification assistant for a cross-border daigou shop.

Given a user-uploaded image and/or text, extract:
1. english_keywords: 3-5 searchable English keywords (noun phrases)
2. chinese_keywords: Chinese translations for Taobao search
3. category: one of [electronics_small, electronics_medium, electronics_large, clothing, shoes, beauty, home_textile, toy, book, default]
4. attributes: color, size, brand if visible
5. est_weight_kg: your best guess in kg, null if unsure
6. confidence: 0-1

Rules:
- Ignore backgrounds, people, phone UI
- If image is a screenshot of Taobao, read the price and title
- If it's a selfie/unrelated, return confidence 0 and explain
- Be conservative on weight: phone=0.3, small appliance=2, big appliance=8

Input text: {text}
Image: [attached]

Output JSON only.
```

### 11.3 Auto-Categorizer（临时商品自动打标签）

```
Given a Taobao/1688 product title (Chinese) + price (CNY), classify into our catalog category.

Categories and typical weights:
- electronics_small  (headphones, chargers): 0.1-0.8 kg
- electronics_medium (rice cooker, kettle): 1-4 kg
- electronics_large  (robot vacuum, air fryer): 4-15 kg
- clothing: 0.2-0.8 kg
- shoes: 0.6-1.2 kg
- beauty: 0.1-0.5 kg
- home_textile (bedding, curtains): 0.8-3 kg
- toy: 0.2-2 kg
- book: 0.3-1 kg

Also output:
- suggested_weight_kg: your best guess
- flag_if_fragile: boolean
- flag_if_bulky: boolean (items >20kg or oversized)

Input:
  title: {title_cn}
  price_cny: {price}
  url: {url}

Output JSON.
```

### 11.4 Quote Renderer（生成报价卡话术，不做计算）

```
You are ZamGo's quoting assistant. Generate a friendly WhatsApp message to quote a product.

IMPORTANT: Do NOT calculate prices. Use the EXACT numbers given in input.
Your job is only to format the message.

Style:
- Brief, emoji-friendly, English (sprinkle 1 Bemba word max)
- Structure: product, price, delivery time, deposit, CTA
- Tone: warm, confident, no pressure

Input:
{
  "product_title": "Xiaomi Mi Robot Vacuum",
  "image_url": "...",
  "final_price_zmw": 4200,
  "deposit_zmw": 1260,
  "eta_days": 14,
  "order_link": "https://zamgo.shop/pay/ORD-xxx"
}

Output: plain text message, 5-8 lines.
```

### 11.5 Complaint Triage（投诉分流）

```
You are a support triage assistant. NEVER attempt to resolve complaints yourself.

Given the customer message, classify severity:
- P0_legal: threats to sue, media, regulator, scam accusations → page CS lead immediately
- P1_refund: requesting money back, damaged item → notify CS in 15 min
- P2_quality: wrong color/size, slight damage → queue for CS within 1h
- P3_question: clarification, not urgent → CS within 4h

Output JSON:
{
  "severity": "P0|P1|P2|P3",
  "summary": "one sentence",
  "suggested_first_line": "what CS should say first",
  "pause_ai": true
}

Input:
{message}
```

> **TODO: 参考 medguide-china/src/lib/ai/agents/conversion-guide.ts** —— 当客户犹豫不决时，可加入一条"转化引导"话术 Agent，类似 MedGuide 的 `$39 report` 推荐逻辑，这里可推荐"本周爆款 SKU"或"首单 5% 优惠券"。

---

## 12. 设计决策总结（10 条权衡）

| # | 决策 | 选 A | 未选 B | 理由 |
|---|------|------|--------|------|
| 1 | **Storefront** | Shopify | 自建 Medusa | 时间是最大成本；Shopify 的 Airtel Money 集成可立即跑 |
| 2 | **WA 接入** | WATI (BSP) | WhatsApp Cloud API 自建 | 客服 UI + Template 管理内置，W1 可上线 |
| 3 | **报价计算** | 后端确定性公式 | LLM 直接报价 | 避免 R7 幻觉报错价；价格由代码计算，LLM 只渲染话术 |
| 4 | **Intent 分类** | 规则优先 + LLM fallback | 纯 LLM | 参考 medguide-china，80%+ 可规则命中，省成本 |
| 5 | **向量库** | Postgres + pgvector | Pinecone/Weaviate | 单库管理、零额外服务、数据量 <10 万 SKU 完全够 |
| 6 | **图片理解** | GPT-4o Vision | Google Cloud Vision | 中文商品描述质量更好，接入更轻 |
| 7 | **Taobao 补充** | 1688 官方 API + 人工 | 自建爬虫 | 合规第一；爬虫 IP 封禁损失大于 API 授权成本 |
| 8 | **付款模式** | 30% 定金 + 尾款 | 100% 预付 or 货到付款 | 平衡风险：定金筛掉恶意下单，尾款留客户验货权 |
| 9 | **多国策略** | 先单国（ZM）打透 | 一上来多国 | MVP 聚焦，复制逻辑留到 Phase 2 |
| 10 | **AI vs 人工比例** | AI 辅助 + 人工兜底 | 全 AI | 高客单 + 跨境 = 人工信任不可替代；AI 做重复劳动加速 |

### 延伸思考（Beyond MVP）

- **Phase 2**：复制到 Tanzania / Kenya / Malawi（同一套代码，多租户配置）
- **Phase 3**：自营空运专线（降运费）、Lusaka 自提柜（降客诉）
- **Phase 4**：本地仓+预测备货（把"14 天"压到"3 天"）
- **Phase 5**：向商家端（Zambian 小店主批量代购）延展 —— 变 B2B2C

---

## 附录 A：术语表

- **BSP** = Business Solution Provider（WhatsApp 官方合作伙伴，e.g. WATI）
- **Template Message** = WhatsApp 预审批的主动外呼消息模板（24h 外必须用）
- **Temp Listing** = 临时上架商品（7 天有效期，3 单转正）
- **pgvector** = Postgres 向量扩展，支持 `<=>` 余弦距离查询
- **ZMW** = Zambian Kwacha（赞比亚克瓦查，1 USD ≈ 26.5 ZMW）
- **Airtel Money** = 赞比亚主流移动支付（类 M-Pesa）

## 附录 B：环境变量清单

```env
# Shopify
SHOPIFY_STORE_DOMAIN=zamgo.myshopify.com
SHOPIFY_ADMIN_TOKEN=shpat_xxx
SHOPIFY_WEBHOOK_SECRET=xxx

# WATI
WATI_API_URL=https://live-server.wati.io/api/v1
WATI_API_TOKEN=xxx
WATI_WEBHOOK_SECRET=xxx

# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o

# 1688
ALIBABA_APP_KEY=xxx
ALIBABA_APP_SECRET=xxx
ALIBABA_ACCESS_TOKEN=xxx

# Infra
DATABASE_URL=postgresql://...supabase...
REDIS_URL=rediss://...upstash...
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=zamgo-images

# Rates (fallback, prefer config table)
DEFAULT_FX_CNY_ZMW=3.80
DEFAULT_FX_USD_ZMW=26.50
DEFAULT_SHIP_PER_KG_USD=9

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

## 附录 C：文件结构（建议 monorepo）

```
zamgo/
├── apps/
│   ├── backend/               # Fastify + tRPC
│   │   ├── src/
│   │   │   ├── api/           # webhook handlers
│   │   │   ├── ai/            # router, agents, prompts
│   │   │   ├── domain/        # quote, order, request
│   │   │   ├── integrations/  # shopify, wati, 1688
│   │   │   ├── queue/         # BullMQ workers
│   │   │   └── db/            # drizzle schema + migrations
│   │   └── package.json
│   └── admin/                 # Next.js 15 dashboard
│       ├── src/app/
│       │   ├── inbox/
│       │   ├── requests/
│       │   ├── orders/
│       │   ├── temp-listings/
│       │   └── settings/
│       └── package.json
├── packages/
│   ├── shared/                # types, constants, schemas (zod)
│   └── db/                    # drizzle client
├── infra/
│   └── fly.toml
├── docs/
│   └── MVP.md                 # ← 本文档
├── pnpm-workspace.yaml
└── package.json
```

---

**文档版本历史**

| 版本 | 日期 | 变更 |
|---|---|---|
| v0.1 | 2026-04-05 | 初稿，覆盖 PRD/架构/数据模型/6周里程碑 |

**下一步行动**：按第 8 章 Week 1 清单立即开工。
