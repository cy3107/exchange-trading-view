# Exchange Trading View

> **合约交易所前端核心架构 Demo**
> 覆盖：实时行情 / K 线 / 盘口 / 下单 / 仓位 / 钱包登录 / 授权安全

本项目不是 UI Demo，而是一个 **合约交易系统前端工程化示例**，重点展示：

* 高频 WebSocket 行情如何保证一致性
* 合约 K 线的实时合成与断线补偿
* React 18 并发渲染在交易场景的实践

---

## 一、整体架构概览

```
┌──────────────┐
│   Backend    │
│──────────────│
│ snapshot API │
│ WebSocket    │
│  - market    │
│  - trade     │
│  - account   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────┐
│        Frontend             │
│────────────────────────────│
│ WS Manager                  │
│  - channel split            │
│  - seq 校验                 │
│  - 重连 & snapshot 校正     │
│                             │
│ State Layer (Jotai)          │
│  - orderbook atom           │
│  - trade atom               │
│  - position atom            │
│                             │
│ React View                  │
│  - K 线 / 盘口 / 下单        │
└────────────────────────────┘
```

---

## 二、WebSocket 设计（合约核心）

### 1️⃣ WebSocket 的定位

在合约交易中，WebSocket **不是简单的数据推送**，而是一个 **状态同步系统**：

* 行情延迟会直接影响用户决策
* 状态错乱可能导致错误下单或风险判断

因此设计目标是：

* **强一致性优先于性能**
* 可检测、可回滚、可恢复

---

### 2️⃣ 通道拆分（Channel Split）

WebSocket 被拆分为多个逻辑通道：

| Channel | 内容             | 特点       |
| ------- | -------------- | -------- |
| market  | 行情 / 盘口 / tick | 高频、可丢弃   |
| trade   | 下单回执 / 成交      | 低频、最高优先级 |
| account | 仓位 / 风险率       | 必须一致     |

> 下单回执与账户状态不会被行情 flood 掩盖。

---

### 3️⃣ snapshot + patch + seq 模型

#### 数据类型

* **snapshot**：完整状态（初始化 / 重连）
* **patch**：增量更新（高频）
* **tick**：最新成交数据

#### seq 校验逻辑

```ts
if (incoming.seq !== lastSeq + 1) {
  triggerSnapshotReload();
}
lastSeq = incoming.seq;
```

* 不做强行排序
* 发现断序直接重拉 snapshot

---

### 4️⃣ 重连策略（关键）

WebSocket 断线 ≠ 重连完成

重连后必须：

1. 拉取 **账户 snapshot**
2. 校正仓位 / 风险率
3. 再恢复行情订阅

> 避免前端状态停留在断线前的错误状态。

---

## 三、K 线系统设计

### 1️⃣ K 线不是画图，是数据系统

K 线数据来源：

* 实时 tick（WebSocket）
* 历史 candle（HTTP）

---

### 2️⃣ tick → candle 合成

* 秒级 candle 前端合成
* 分钟级及以上以 **后端为准**

```ts
onTick(price) {
  currentCandle.update(price);
}
```

---

### 3️⃣ 断线补 K

* 记录最后一根 candle 时间
* 重连后拉取缺失区间

---

## 四、React 18 并发渲染实践

### useTransition 应用场景

* 盘口
* 深度图
* 成交列表

```ts
startTransition(() => {
  updateOrderBook(patch);
});
```

* 避免阻塞下单输入
* 保证关键交互优先级

---

## 五、状态管理策略（Jotai）

* 原子级订阅
* 行情更新只影响相关组件

示例：

* orderBookAtom
* tradeAtom
* positionAtom

---

## 六、Web3 登录与安全

### 登录流程

1. 前端请求 nonce
2. 钱包签名 message
3. 后端验签
4. 返回 session token

---

### 授权安全

* 无限授权二次确认
* 集成 revoke（DeBank / Revoke.cash）

---

## 七、性能指标

* 交易页首屏 < 1s
* Lighthouse 95+
* 核心交易 bundle < 120KB（gzip）

---

## 八、适用场景

* 永续合约交易页
* 高频实时行情系统
* Web3 交易所前端

---

