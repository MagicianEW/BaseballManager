# 棒球球队管理系统 / Baseball Team Manager / 野球チームマネージャー

青少年棒球队（U10）日常管理工具，覆盖比赛记录、阵容管理、换人操作和数据统计。

Youth baseball team (U10) management tool — game recording, lineup management, substitutions, and statistics.

U10 用野球チーム管理ツール — 試合記録、打線管理、代打・代走、統計データ。

[View in English](#english) · [日本語](#日本語)

---

## 中文

### 功能特性

#### 比赛管理
- 创建和管理比赛（主队/客队、日期、状态）
- 实时打分面板，支持快捷操作（1B/2B/3B/HR/SO/BB 等）
- 完整打席记录（打者、对阵投手、结果、RBI）
- 自动垒位计算（位掩码）和出局数管理
- 换投手/换打者操作

#### 阵容管理
- 主客队阵容分别编辑
- 阵容确认（confirm）锁定阵容
- 一键打印阵容卡（适合场边使用）

#### 换人系统
- 代跑（PINCH_RUN）和代打（PINCH_HIT）
- 每次换人记录原因和对应打席
- 换人历史可查

#### 实时同步
- Socket.io 事件广播，比赛数据变更实时推送到所有客户端
- 支持 WebSocket 即时刷新

#### 多语言
- 支持简体中文、繁体中文、英语、日语
- 在设置页面切换语言

### 技术栈

**前端**：React + Vite + React Router + Axios

**后端**：Node.js + Express + better-sqlite3 + Socket.io

**数据库**：SQLite（`server/data/baseball.db`）

### 快速开始

#### 环境要求
- Node.js >= 18
- npm

#### 安装

```bash
cd baseballmanager
npm install
```

#### 启动后端

```bash
cd server
JWT_SECRET=your_secret_here node index.js
# 服务器运行在 http://localhost:3001
```

#### 启动前端

```bash
npm run dev
# 前端运行在 http://localhost:5173
```

#### 初始账号
- 用户名：`admin`
- 密码：`admin`

### API 路由概览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/games` | 比赛列表 |
| POST | `/api/v1/games` | 新建比赛 |
| GET | `/api/v1/games/:id` | 比赛详情 |
| PUT | `/api/v1/games/:id` | 更新比赛 |
| DELETE | `/api/v1/games/:id` | 删除比赛 |
| POST | `/api/v1/games/:id/pa` | 添加打席记录 |
| POST | `/api/v1/games/:id/pitcher` | 换投手 |
| POST | `/api/v1/games/:id/batter` | 换打者 |
| POST | `/api/v1/games/:id/substitutions` | 添加换人记录 |
| GET | `/api/v1/games/:id/substitutions` | 获取换人记录 |
| POST | `/api/v1/games/:id/lineup/confirm` | 确认阵容 |
| GET | `/api/v1/teams` | 球队列表 |
| GET | `/api/v1/players` | 球员列表 |
| GET | `/api/squads` | 梯队管理 |
| GET | `/api/stats/player/:id` | 球员数据统计 |

### 垒位位掩码说明

| baseSituation | 含义 |
|------|------|
| 0 | 无人 |
| 1 | 一垒有人 |
| 2 | 二垒有人 |
| 3 | 一二垒有人 |
| 4 | 三垒有人 |
| 5 | 一三垒有人 |
| 6 | 二三垒有人 |
| 7 | 满垒 |

### 版本历史

- **0.1.2** — 修复 2B 位掩码逻辑，/api/games 重定向修正，阵容确认路由对齐，多语言硬编码修复
- **0.1.1** — Phase 3：快捷打分面板、中文位置标签、阵容卡打印
- **0.1.0** — Phase 2：换人系统、阵容确认功能
- **0.0.1** — Phase 1：基础框架、位掩码逻辑修正

---

## English

### Features

#### Game Management
- Create and manage games (home/away team, date, status)
- Real-time scoring panel with quick actions (1B/2B/3B/HR/SO/BB etc.)
- Complete plate appearance records (batter, pitcher, result, RBI)
- Automatic base situation calculation (bitmask) and out counting
- Pitcher/batter substitution

#### Lineup Management
- Edit home and away lineups separately
- Lineup confirmation (lock lineup before game)
- One-click printable lineup cards

#### Substitution System
- Pinch run (PINCH_RUN) and pinch hit (PINCH_HIT)
- Reason and at-bat tracking per substitution
- Substitution history

#### Real-time Sync
- Socket.io event broadcast — game data changes pushed to all clients
- WebSocket instant refresh

#### Multi-language
- Supports Simplified Chinese, Traditional Chinese, English, Japanese
- Switch language from Settings page

### Tech Stack

**Frontend**: React + Vite + React Router + Axios

**Backend**: Node.js + Express + better-sqlite3 + Socket.io

**Database**: SQLite (`server/data/baseball.db`)

### Quick Start

```bash
# Install
cd baseballmanager && npm install

# Start backend
cd server && JWT_SECRET=your_secret_here node index.js

# Start frontend (another terminal)
npm run dev
```

Default account: `admin` / `admin`

---

## 日本語

### 機能

#### 試合管理
- 試合の作成与管理（ホーム/أラウンドチーム、日付、ステータス）
- リアルタイムスコアリングパネル（1B/2B/3B/HR/SO/BB など）
- 完整的打席記録（打者、投手、結果、RBI）
- 自動ランナー進塁計算（ビットマスク）＋アウト数管理
- 投手交代・打者交代

#### 打線管理
- ホーム・アウェイ打線を別々に編集
- 打線 확정（confirm）でメンバーロック
- 一键で打線カードを印刷

#### 代打・代走システム
- PINCH_RUN（代走）と PINCH_HIT（代打）
- 理由と打席を記録
- 交代履歴を随时確認

#### リアルタイム同期
- Socket.io イベントブロードキャスト
- 全クライアントに即时反映

#### 多言語
- 简体中文・繁体中文・英語・日本語対応
- 設定ページで言語を切り替え可能

### 技術スタック

**フロントエンド**：React + Vite + React Router + Axios

**バックエンド**：Node.js + Express + better-sqlite3 + Socket.io

**データベース**：SQLite（`server/data/baseball.db`）

### クイックスタート

```bash
# インストール
cd baseballmanager && npm install

# サーバー起動
cd server && JWT_SECRET=your_secret_here node index.js

# フロントエンド起動（別のターミナル）
npm run dev
```

初期アカウント：`admin` / `admin`