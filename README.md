# 棒球球队管理系统

青少年棒球队（U10）日常管理工具，覆盖比赛记录、阵容管理、换人操作和数据统计。

## 功能特性

### 比赛管理
- 创建和管理比赛（主队/客队、日期、状态）
- 实时打分面板，支持快捷操作（1B/2B/3B/HR/SO/BB 等）
- 完整打席记录（打者、对阵投手、结果、RBI）
- 自动垒位计算（位掩码）和出局数管理
- 换投手/换打者操作

### 阵容管理
- 主客队阵容分别编辑
- 阵容确认（confirm）锁定阵容
- 一键打印阵容卡（适合场边使用）

### 换人系统
- 代跑（PINCH_RUN）和代打（PINCH_HIT）
- 每次换人记录原因和对应打席
- 换人历史可查

### 实时同步
- Socket.io 事件广播，比赛数据变更实时推送到所有客户端
- 支持 WebSocket 即时刷新

### API 版本
- `/api/v1/games` — v1 版本主路由（当前版本）
- `/api/games` — v1 重定向（向后兼容）

## 技术栈

**前端**：React + Vite + React Router + Axios

**后端**：Node.js + Express + better-sqlite3 + Socket.io

**数据库**：SQLite（`server/data/baseball.db`）

## 快速开始

### 环境要求
- Node.js >= 18
- npm

### 安装

```bash
cd baseballmanager
npm install
```

### 启动后端

```bash
cd server
JWT_SECRET=your_secret_here node index.js
# 服务器运行在 http://localhost:3001
```

### 启动前端

```bash
npm run dev
# 前端运行在 http://localhost:5173
```

### 初始账号
- 用户名：`admin`
- 密码：`admin`

## API 路由概览

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

## 垒位位掩码说明

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

## 版本历史

- **0.1.2** — 修复 2B 位掩码逻辑，/api/games 重定向修正，阵容确认路由对齐
- **0.1.1** — Phase 3：快捷打分面板、中文位置标签、阵容卡打印
- **0.1.0** — Phase 2：换人系统、阵容确认功能
- **0.0.1** — Phase 1：基础框架、位掩码逻辑修正