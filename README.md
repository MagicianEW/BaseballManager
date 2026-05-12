# 棒球球队管理系统

一个完整的棒球球队管理与比赛记录系统，支持实时比分板、打席记录和统计数据计算。

## 功能特性

### 核心功能
- **球队管理** - CRUD 球队信息（队名、主场球场、队徽）
- **梯队管理** - 按年龄组分梯队（U6/U8/U10/U12/U15/U18/U23/成年）、晋升机制
- **球员管理** - 管理球员档案（姓名、球衣号、投打习惯、位置等）、归属梯队
- **阵容管理** - 编辑先发9人和替补阵容
- **比赛记录** - 创建比赛、设置阵容、实时打分
- **比分板** - 垒上局面可视化、实时比分、出局数显示

### 数据统计
- 打击率 (BA)、上垒率 (OBP)、长打率 (SLG)、OPS
- 自责分率 (ERA)、WHIP、K/9 等投手统计
- 支持按球队/球员筛选统计

### 扩展性设计
- 模块化服务层（teamService, playerService, gameService, statsService）
- 常量配置（PLAY_RESULTS, POSITIONS, PITCH_TYPES 等）
- 自定义 Hooks（usePolling, useForm, useSelect, useExpand）
- JSDoc 类型定义

## 技术栈

### 后端
- **Runtime**: Node.js + Express
- **Database**: SQL.js (SQLite in-browser)
- **API**: RESTful JSON API

### 前端
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6

## 项目结构

```
BaseballManager/
├── server/                    # Node.js 后端
│   ├── index.js              # Express 入口
│   ├── db.js                 # SQL.js 数据库
│   ├── routes/               # API 路由
│   │   ├── teams.js
│   │   ├── players.js
│   │   ├── games.js
│   │   ├── stats.js
│   │   └── squads.js
│   ├── services/            # 业务逻辑层
│   │   ├── teamService.js
│   │   ├── playerService.js
│   │   ├── gameService.js
│   │   ├── statsService.js
│   │   └── squadService.js
│   └── data/                 # 数据库文件
├── src/
│   ├── components/           # UI 组件
│   │   ├── game/            # 比赛相关
│   │   │   └── GameField.jsx
│   │   ├── scoreboard/      # 比分板
│   │   │   ├── Scoreboard.jsx
│   │   │   └── PitchCount.jsx
│   │   └── forms/           # 表单
│   │       └── PlayForm.jsx
│   ├── constants/           # 常量配置
│   │   └── baseball.js
│   ├── context/             # 全局状态
│   │   └── AppContext.jsx
│   ├── hooks/               # 自定义 Hooks
│   │   └── index.js
│   ├── pages/               # 页面
│   │   ├── Teams.jsx
│   │   ├── Squads.jsx       # 梯队管理
│   │   ├── Players.jsx
│   │   ├── Games.jsx
│   │   ├── GameLive.jsx
│   │   └── Stats.jsx
│   ├── types/               # 类型定义
│   │   └── index.js
│   ├── utils/               # 工具函数
│   │   ├── api.js
│   │   ├── stats.js
│   │   └── validation.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 终端1: 启动后端 (端口 3001)
npm run server

# 终端2: 启动前端 (端口 5173)
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
npm run preview
```

## 使用流程

1. **创建球队** - 进入"球队"页面，添加球队
2. **创建梯队** - 进入"梯队"页面，为球队添加梯队（如 U12、U15、一队）
3. **添加球员** - 进入"球员"页面，添加球员并分配到球队和梯队
4. **晋升球员** - 在梯队页面选择球员，点击"晋升"将其升到更高梯队
5. **创建比赛** - 进入"比赛"页面，创建比赛并设置先发投手和打线
6. **开始比赛** - 点击"开始"按钮进入实时打分界面
7. **记录打席** - 点击结果按钮记录打席事件
8. **查看统计** - 进入"统计"页面查看球员/球队数据

## 扩展指南

### 添加新的打席结果类型

编辑 `src/constants/baseball.js`，在 `PLAY_RESULTS` 和 `RESULT_LABELS` 中添加：

```javascript
export const PLAY_RESULTS = {
  // ... existing results
  NEW_RESULT: 'NR',
} as const

export const RESULT_LABELS = {
  // ... existing labels
  'NR': '新结果标签',
} as const
```

### 添加新的球种

编辑 `src/constants/baseball.js`：

```javascript
export const PITCH_TYPES = {
  // ... existing types
  NEW_PITCH: 'NP',
} as const

export const PITCH_TYPE_LABELS = {
  // ... existing labels
  'NP': '新球种',
} as const
```

### 添加新的统计计算

在 `src/utils/stats.js` 中添加新的计算函数：

```javascript
export function calcNewStat(param1, param2) {
  // 计算逻辑
  return result
}
```

## API 参考

### 球队
- `GET /api/teams` - 获取所有球队
- `POST /api/teams` - 创建球队
- `PUT /api/teams/:id` - 更新球队
- `DELETE /api/teams/:id` - 删除球队

### 球员
- `GET /api/players` - 获取所有球员
- `POST /api/players` - 创建球员
- `PUT /api/players/:id` - 更新球员
- `DELETE /api/players/:id` - 删除球员
- `POST /api/players/promote` - 晋升球员到更高梯队

### 梯队
- `GET /api/squads` - 获取所有梯队
- `POST /api/squads` - 创建梯队
- `PUT /api/squads/:id` - 更新梯队
- `DELETE /api/squads/:id` - 删除梯队
- `GET /api/squads/:id/players` - 获取梯队球员

### 比赛
- `GET /api/games` - 获取所有比赛
- `POST /api/games` - 创建比赛
- `PUT /api/games/:id` - 更新比赛
- `POST /api/games/:id/pa` - 添加打席记录

### 统计
- `GET /api/stats/player/:id` - 获取球员统计
- `GET /api/stats/team/:id` - 获取球队统计
- `GET /api/stats/game/:id` - 获取比赛统计

## License

MIT