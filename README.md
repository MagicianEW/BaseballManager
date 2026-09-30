# 棒球球队管理系统 / Baseball Team Manager / 野球チームマネージャー

青少年棒球队（U10）日常管理工具，覆盖比赛记录、阵容管理、换人操作和数据统计。

Youth baseball (U10) management tool — game recording, lineup management, substitutions, statistics.

U10 用野球チーム管理ツール — 試合記録、打線管理、代打・代走、統計データ。

[中文](#中文) · [English](#english) · [日本語](#日本語)

---

## 中文

### 功能特性

**比赛管理**
- 创建和管理比赛（主客队、日期、局数）
- 实时记分面板，支持快捷操作（1B/2B/3B/HR/SO/BB 等 15 种打席结果）
- 完整打席记录（打者、对阵投手、结果、RBI、得分跑者）
- **服务端统一计分**：得分、RBI、垒上跑者推进全部由计分引擎计算
- **局数自动推进**：满 3 出局自动换半局/换局，打满最终局自动结束比赛
- 换投手、调整打线

**阵容管理**
- 主客队打线分别编辑
- 阵容确认**按主客队分别锁定**，可解锁重排
- 一键预览打印阵容卡

**换人系统**
- 代跑（PINCH_RUN）与代打（PINCH_HIT）
- 记录换人原因与对应局数
- 换人历史可查

**统计**
- 球员打击数据（打数、安打、得分、RBI、打点率、出垒率）
- 球队统计、单场打投统计
- 统计从打席记录实时汇总，不存在缓存不一致

**实时同步**
- Socket.IO 事件广播，多端实时刷新

**多语言**
- 简体中文、繁体中文、英语、日语，171 个 key 四语言全覆盖

### 技术栈

**前端**：React 18 + Vite 5 + React Router 6 + Socket.IO Client + Tailwind CSS
**后端**：Node.js + Express 4 + better-sqlite3 + Socket.IO
**数据库**：SQLite（WAL 模式，开启外键约束）

### 快速开始

```bash
# 环境要求：Node.js >= 20（better-sqlite3 13 需要 C++ 工具链）
npm install

# 终端 1 — 启动后端
JWT_SECRET=$(openssl rand -hex 32) npm run server   # http://localhost:3001

# 终端 2 — 启动前端
npm run dev                                          # http://localhost:5173
```

初始账号：`admin` / `admin`（**首次登录后请立即在设置页创建新管理员**，创建后初始账号自动停用）

### 角色与权限

| 角色 | 权限 |
|---|---|
| `admin` | 全部权限，含用户管理 |
| `coach` | 球队/球员/梯队/比赛的读写，统计只读 |
| `player` | 全部只读 |

权限在**服务端**强制校验（`server/middleware/auth.js`），前端按钮显隐仅为体验优化。

### API 一览

所有业务接口都需要 `Authorization: Bearer <token>`。

| 方法 | 路径 | 权限 |
|---|---|---|
| POST | `/api/auth/register` | 公开 |
| POST | `/api/auth/login` | 公开 |
| GET | `/api/auth/me` | 登录 |
| GET | `/api/auth/permissions` | 登录 |
| GET/POST | `/api/auth/users` | admin |
| POST | `/api/auth/admin` | admin |
| GET | `/api/teams` `/api/squads` `/api/players` `/api/games` | `*:read` |
| POST/PUT/DELETE | 同上 | `*:write` |
| GET | `/api/games/:id` | `games:read` |
| POST | `/api/games/:id/pa` | `games:write` |
| POST | `/api/games/:id/advance` | `games:write` |
| POST | `/api/games/:id/lineup/confirm` | `games:write` |
| GET/POST | `/api/games/:id/substitutions` | `games:read`/`write` |
| GET | `/api/stats/player/:id` `/api/stats/team/:id` `/api/stats/game/:id` | `stats:read` |
| POST | `/api/upload/team-logo` | `teams:write` |
| GET | `/api/uploads/:filename` | 登录 |

`/api/v1/games` 作为历史路径别名保留。

### 计分口径

| 概念 | 说明 |
|---|---|
| `runners` | 垒上跑者数组 `[{playerId, base}]`，`base ∈ {1,2,3}`，是计分的唯一真相来源 |
| `baseSituation` | 位掩码 0-7，**由 `runners` 派生**，仅供 UI 局面图显示，不参与计分 |
| `runsScored` | 本打席推进回本垒的跑者数（含全垒打打者自己） |
| `rbi` | `runsScored - (全垒打 ? 1 : 0)`。官方口径下全垒打打者自己跑回本垒那分不计 RBI，因此**满垒全垒打 = 4 得分 / 3 RBI** |
| `outs` | 三振/接地/飞球记 1 出局，双杀（GDP）记 2 出局 |
| 打线轮转 | 按实际打线长度轮转，支持 8/9/10 人 |

`resolvePlay()` 是纯函数，无 I/O 依赖，覆盖 15 种打席结果，并有不变量测试保证「任一垒包最多一名跑者」。

### 数据与隐私

本系统存储未成年人（U10）的出生日期、身高、体重与照片，属敏感个人信息：

- 所有业务接口强制鉴权，`player` 角色为只读
- 上传文件**不在静态目录**，必须经鉴权后才能读取；文件名使用 16 字节加密随机数，不可枚举
- 上传时按**文件头魔数**校验真实图片类型，不信任客户端 mimetype
- 删除球员或替换照片时同步删除磁盘文件
- 生产环境需设置 `CORS_ORIGINS` 白名单

### 从 v0.1.x 升级

```bash
npm install
npm run migrate    # 幂等：补 runners 列、拆分 confirmed、回填数据、删除废弃表
```

位掩码不含跑者身份，回填的 `playerId` 为 `null`，界面上显示为「—」；比分与统计不受影响。

### 版本历史

#### v0.2.0

一次覆盖安全、数据正确性与工程质量的重构。

**安全修复**

| 问题 | 说明 |
|---|---|
| 16 处 SQL 注入 | 全部改为 `?` 参数化，覆盖 5 个 service 文件 |
| `update()` 列名注入 | 请求体任意 key 会被拼成列名，改为 `UPDATABLE_COLUMNS` 白名单 |
| 业务接口零鉴权 | 全部挂 `authenticate` + 逐路由 `requirePermission`；`hasPermission` 从死代码变为真正的权限源 |
| 上传目录裸暴露 | 移除 `express.static`，改为鉴权路由 + 文件头魔数校验 + 16 字节随机文件名 |
| 权限模型失效 | 前端 `canWrite('games')` 因字符串替换失效，导致教练全线只读；已修复并改由服务端下发权限 |
| 跨域过宽 | 生产环境强制 `CORS_ORIGINS` 白名单 |

**数据正确性修复**

| 问题 | 说明 |
|---|---|
| 比分只在全垒打时变化 | 新增统一计分引擎 `scoring.js`，得分由跑者推进计算 |
| RBI 硬编码为 1 | 改为 `runsScored - (HR ? 1 : 0)`，满垒全垒打 = 4 得分 / 3 RBI |
| 局数永不推进 | 满 3 出局自动换半局/换局，打满最终局自动结束比赛 |
| 比赛无法结束 | 新增结束比赛按钮与 `finalInning` |
| 球员统计恒为 0 | `player_stats` 表历史零写入，已删除，改从 `plate_appearances` 实时汇总 |
| 得分归属错误 | 得分发生在别人的打席里，改用 `json_each` 统计跑者回本垒次数 |
| 阵容确认一把锁两队 | 拆为 `homeConfirmed` / `awayConfirmed`，并拒绝空阵容确认 |
| 字段错位 | `SELECT *` + 下标映射导致队名显示为 `0`、打席表打者列显示为时间戳；改用 better-sqlite3 按列名返回 |

**架构与质量**

- 数据库从 `sql.js` 迁移到 `better-sqlite3`：每次写操作全量重写整个库文件 → WAL + 真事务 + 增量写
- 首次真正启用外键约束（此前 6 张表声明了 FK 却从未打开）
- Socket.IO 前后端打通，替换记分页 2 秒轮询（此前后端广播给空气，前端零接入）
- 跑者模型从位掩码升级为 `runners` 数组，位掩码降级为派生值仅供 UI 显示
- i18n 补齐至 4 语言各 171 key，消除 5 处重复 key，`t()` 支持插值
- 删除 15 个死代码/失效文件
- 新增 190 项测试（计分引擎 147 + 安全回归 43），直接 import 生产代码
- 新增 `npm run migrate` 幂等迁移脚本

#### v0.1.x 及更早

基础框架、换人系统、阵容确认、位掩码计分逻辑修正。

### 测试

```bash
npm test
```

- `server/services/scoring.test.js` — 计分引擎 144 项
- `server/security.test.js` — 鉴权矩阵、SQL 注入、列名注入回归

测试直接 import 生产代码（旧版测试把生产函数复制进测试文件再测，改了也不会红，且无 `test` 脚本从不执行）。

### 环境变量

| 变量 | 必填 | 默认 | 说明 |
|---|---|---|---|
| `JWT_SECRET` | ✅ | — | JWT 签名密钥，生产必须用随机值 |
| `PORT` | | `3001` | 后端端口 |
| `DB_PATH` | | `server/data/baseball.db` | 数据库路径 |
| `UPLOAD_DIR` | | `server/data/uploads` | 上传目录 |
| `CORS_ORIGINS` | | — | 生产环境必填，逗号分隔 |
| `NODE_ENV` | | — | 设为 `production` 时隐藏错误详情 |

---

## English

### Features

**Games** — create/manage games, real-time scoring panel with 15 result types, full plate-appearance records, **server-side scoring engine** (runs, RBI, runner advancement), **automatic inning/half-inning advancement** and game completion.

**Lineups** — edit home/away lineups separately, **confirm each team independently** with unlock, one-click printable lineup card.

**Substitutions** — pinch run / pinch hit with reason and inning tracking.

**Stats** — batting averages, OBP, team and per-game batting/pitching, aggregated live from plate appearances.

**Realtime** — Socket.IO broadcast to all clients.

**i18n** — Simplified Chinese, Traditional Chinese, English, Japanese.

### Stack

**Frontend**: React 18 + Vite 5 + React Router 6 + Socket.IO Client + Tailwind CSS
**Backend**: Node.js + Express 4 + better-sqlite3 + Socket.IO
**Database**: SQLite (WAL mode, foreign keys enforced)

### Quick start

```bash
npm install
JWT_SECRET=$(openssl rand -hex 32) npm run server   # :3001
npm run dev                                          # :5173
```

Default account: `admin` / `admin` — **create a new admin from Settings on first login**; the initial account is disabled automatically once you do.

### Roles

| Role | Permissions |
|---|---|
| `admin` | Everything, including user management |
| `coach` | Read/write on teams, players, squads, games; read-only stats |
| `player` | Read-only everywhere |

Permissions are enforced **server-side** (`server/middleware/auth.js`); client-side button visibility is UX only.

### Scoring

`runners` (`[{playerId, base}]`) is the single source of truth. `baseSituation` (0-7 bitmask) is derived from it for the UI only. `rbi = runsScored - (HR ? 1 : 0)`, so a bases-loaded home run is 4 runs / 3 RBI.

### Testing

```bash
npm test
```

### Upgrading from v0.1.x

```bash
npm install
npm run migrate
```

### Changelog

#### v0.2.0

A rewrite covering security, data correctness and engineering quality.

**Security**

- 16 SQL injection points parameterised across all 5 service files
- `update()` column-name injection closed via an `UPDATABLE_COLUMNS` allowlist
- All business routes now require `authenticate` + per-route `requirePermission`; `hasPermission` went from dead code to the real permission source
- Upload directory no longer served by bare `express.static`; now auth-gated with file-header magic-number validation and 16-byte random filenames
- Fixed `canWrite('games')`, which silently denied every write to coaches; permissions are now served from the backend
- CORS restricted to a `CORS_ORIGINS` allowlist in production

**Data correctness**

- New unified scoring engine (`scoring.js`); runs are now derived from runner advancement instead of counting only home runs
- RBI no longer hardcoded to 1: `rbi = runsScored - (HR ? 1 : 0)`, so a bases-loaded HR is 4 runs / 3 RBI
- Innings and half-innings now advance automatically; game completes at the final inning
- Deleted the never-written `player_stats` table; statistics now aggregate live from `plate_appearances`
- Fixed run attribution — runs scored happen on *other* batters' plate appearances, now counted via `json_each`
- Lineup confirmation is now per-team (`homeConfirmed` / `awayConfirmed`) and rejects empty lineups
- Fixed column-offset bugs where team names rendered as `0` and batter columns rendered as timestamps

**Architecture & quality**

- Migrated `sql.js` → `better-sqlite3`: every write previously rewrote the entire database file; now WAL + real transactions
- Foreign keys actually enforced for the first time (declared in 6 tables but never enabled)
- Socket.IO wired up end-to-end, replacing a 2-second polling loop
- Runner model upgraded from a bitmask to a `runners` array; the bitmask is now derived, UI-only
- i18n expanded to 171 keys × 4 languages, 5 duplicate keys removed, `t()` supports interpolation
- 15 dead or obsolete files removed
- 190 new tests (147 scoring + 43 security regression), importing production code directly

#### v0.1.x and earlier

Core framework, substitution system, lineup confirmation, bitmask scoring fixes.

### Environment

`JWT_SECRET` (required), `PORT`, `DB_PATH`, `UPLOAD_DIR`, `CORS_ORIGINS`, `NODE_ENV`.

---

## 日本語

### 機能

**試合管理** — 試合の作成と管理、15 種類の打席結果に対応したリアルタイム採点パネル、打席記録、**サーバー側の採点エンジン**（得点・打点・走者進塁）、3アウト自動での回・表の送り替えと試合終了。

**打線管理** — ホーム/アウェイの打線を個別に編集、**各チーム個別に確定**（解除も可能）、打線カードのプレビュー・印刷。

**代打・代走** — 理由と回数を記録。

**統計** — 打率、出塁率、チーム/試合単位の打投統計。打席記録からリアルタイムに集計。

**リアルタイム** — Socket.IO で全クライアントに即時反映。

**多言語** — 简体中文・繁体中文・英語・日本語（171 キーすべて翻訳済み）。

### 技術スタック

**フロントエンド**：React 18 + Vite 5 + React Router 6 + Socket.IO Client + Tailwind CSS
**バックエンド**：Node.js + Express 4 + better-sqlite3 + Socket.IO
**データベース**：SQLite（WAL モード、外部キー制約あり）

### クイックスタート

```bash
npm install
JWT_SECRET=$(openssl rand -hex 32) npm run server   # :3001
npm run dev                                          # :5173
```

初期アカウント：`admin` / `admin` — **初回ログイン後、設定画面から新しい管理者を作成してください**。作成すると初期アカウントは自動的に無効になります。

### 権限

| ロール | 権限 |
|---|---|
| `admin` | すべて（ユーザー管理を含む） |
| `coach` | チーム・選手・リザーブ・試合の读写、統計は閲覧のみ |
| `player` | すべて閲覧のみ |

権限は**サーバー側で強制**されます（`server/middleware/auth.js`）。フロントエンドのボタン表示はUXのためだけです。

### テスト

```bash
npm test
```

### v0.1.x からの移行

```bash
npm install
npm run migrate
```

### 変更履歴

#### v0.2.0

セキュリティ・データの正確性・品質を網羅した一大リライト。

**セキュリティ**

- 5 つの service ファイル全体16 箇所の SQL インジェクションをパラメータ化
- `update()` の列名インジェクションを `UPDATABLE_COLUMNS` のホワイトリストで遮断
- 全業務ルートに `authenticate` + ルート別 `requirePermission` を適用（`hasPermission` がデッドコードから実効化）
- アップロード目录の裸公開を廃止。認証ルート + ファイルヘッダ検証 + 16バイト乱数ファイル名に
- `canWrite('games')` の不具合を修正（コーチが全面的に書き込み不能になっていた）。権限はサーバーから配信
- 本番環境で `CORS_ORIGINS` ホワイトリストを強制

**データの正確性**

- 統一スコアエンジン `scoring.js` を新設。得点は走者進塁から算出
- RBI のハードコードを廃止。`rbi = runsScored - (HR ? 1 : 0)`（満塁ホームランは 4 得点 / 3 打点）
- 回・表の自動送り替えと試合終了を実装
- データが無写入だった `player_stats` を削除し、`plate_appearances` からリアルタイム集計
- 得点帰属の誤りを修正（得点は他人の打席で発生する）
- 打線確定をホーム/アウェイ個別に分離。空打線は拒否
- フィールドずれを修正（チーム名が `0` と表示されていた問題）

**アーキテクチャと品質**

- `sql.js` → `better-sqlite3`：書き込みごとに DB ファイル全体書き換えしていた問題を解消（WAL + トランザクション）
- 外部キー制約を初めて実際に有効化
- Socket.IO を前後端で接続。2 秒ポーリングを廃止
- 走者モデルをビットマスクから `runners` 配列へ
- i18n を 4 言語 × 171 キーへ拡張。重複キー 5 件を削除、`t()` に補間対応
- 死んだファイル 15 件を削除
- 190 件のテストを追加（本番コードを直接 import）

#### v0.1.x 以前

基本フレームワーク、代打・代走、打線確定、ビットマスクの採点ロジック修正。

### 環境変数

`JWT_SECRET`（必須）、`PORT`、`DB_PATH`、`UPLOAD_DIR`、`CORS_ORIGINS`、`NODE_ENV`。
