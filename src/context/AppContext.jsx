import React, { createContext, useContext, useReducer, useCallback, useState, useEffect } from 'react'
import { api } from '../utils/api'

const AppContext = createContext(null)

// 可用主题色
export const THEMES = {
  green: { name: '绿色', primary: 'bg-green-800', hover: 'hover:bg-green-700', text: 'text-green-800' },
  blue: { name: '蓝色', primary: 'bg-blue-800', hover: 'hover:bg-blue-700', text: 'text-blue-800' },
  red: { name: '红色', primary: 'bg-red-800', hover: 'hover:bg-red-700', text: 'text-red-800' },
  purple: { name: '紫色', primary: 'bg-purple-800', hover: 'hover:bg-purple-700', text: 'text-purple-800' },
  orange: { name: '橙色', primary: 'bg-orange-700', hover: 'hover:bg-orange-600', text: 'text-orange-700' },
  yellow: { name: '黄色', primary: 'bg-yellow-600', hover: 'hover:bg-yellow-500', text: 'text-yellow-600' },
  indigo: { name: '靛蓝', primary: 'bg-indigo-800', hover: 'hover:bg-indigo-700', text: 'text-indigo-800' },
  cyan: { name: '青色', primary: 'bg-cyan-700', hover: 'hover:bg-cyan-600', text: 'text-cyan-700' },
}

// 可用语言
export const LANGUAGES = [
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁體）' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
]

// 翻译数据
export const translations = {
  'zh-CN': {
    appName: '棒球球队管理系统',
    loginTitle: '请登录以继续',
    teams: '球队',
    squads: '梯队',
    players: '球员',
    games: '比赛',
    stats: '统计',
    users: '设置',
    logout: '退出',
    admin: '管理员',
    coach: '教练',
    player: '球员',
    noAccount: '还没有账户？',
    register: '注册',
    initialAdmin: '初始管理员账户：',
    username: '用户名',
    password: '密码',
    login: '登录',
    loggingIn: '登录中...',
    settings: '设置',
    theme: '主题',
    logo: '队标',
    clubName: '俱乐部名称',
    language: '语言',
    uploadLogo: '上传队标',
    save: '保存',
    cancel: '取消',
    selectTheme: '选择主题色',
    enterClubName: '输入俱乐部名称',
    selectLanguage: '选择语言',
    noTeams: '暂无球队',
    noSquads: '暂无梯队',
    noPlayers: '暂无球员',
    noGames: '暂无比赛',
    createTeam: '创建球队',
    createSquad: '创建梯队',
    updateSquad: '更新梯队',
    createPlayer: '创建球员',
    createGame: '创建比赛',
    edit: '编辑',
    delete: '删除',
    confirmDelete: '确定删除？',
    backToList: '返回列表',
    name: '姓名',
    role: '角色',
    status: '状态',
    userType: '类型',
    action: '操作',
    enabled: '启用',
    disabled: '停用',
    initialAdmin: '初始管理员',
    confirmDeleteUser: '确定删除用户 {username}？',
    cannotDisableInitialAdmin: '不能停用初始管理员',
    cannotDeleteInitialAdmin: '不能删除初始管理员',
    uploading: '上传中...',
    createAdmin: '创建管理员',
    creating: '创建中...',
    systemAdmin: '系统管理员',
    coachOrStat: '教练/统计员',
    newAdminInfo: '创建新管理员后，初始 admin 账户将自动停用',
    usernameAndPasswordRequired: '用户名和密码不能为空',
    passwordMinLength: '密码至少需要6个字符',
    // Squads
    squadManagement: '梯队管理',
    squadList: '梯队列表',
    noSquadsCreateFirst: '暂无梯队，请先创建梯队',
    squadName: '梯队名称',
    selectTeam: '选择球队',
    level: '级别',
    ageGroup: '年龄组',
    selectAgeGroup: '选择年龄组',
    squadPlayers: '梯队球员',
    number: '号码',
    position: '位置',
    throwsBats: '投打',
    action: '操作',
    promote: '晋升',
    clickSquadToViewDetails: '点击左侧梯队查看详情',
    playerAlreadyTopLevel: '该球员已在最高级别梯队',
    confirmDeleteSquad: '确定删除此梯队？球员不会被删除，只会解除与梯队的关联。',
    confirmPromotePlayer: '确认将 {playerName} 晋升到 {squadName}？',
    // Teams
    teamManagement: '球队管理',
    teamName: '球队名称',
    homeStadium: '主场球场',
    enterTeamName: '输入球队名称',
    enterHomeStadium: '输入主场球场',
    teamLogo: '队徽图片',
    uploading: '上传中...',
    logoPreview: '队徽预览',
    preview: '预览',
    addTeam: '添加球队',
    updateTeam: '更新球队',
    noHomeStadium: '未设置主场',
    noTeamsClickToAdd: '暂无球队，点击上方按钮添加',
    noTeamData: '暂无球队数据',
    confirmDeleteTeam: '确定删除？',
    uploadFailed: '上传失败: ',
    // Players
    playerManagement: '球员管理',
    jerseyNumber: '球衣号',
    rightBats: '右打',
    leftBats: '左打',
    switchBats: '左右开',
    rightThrows: '右手',
    leftThrows: '左手',
    height: '身高(cm)',
    weight: '体重(kg)',
    selectSquad: '选择梯队',
    defensivePosition: '守备位置：',
    addPlayer: '添加球员',
    updatePlayer: '更新球员',
    noTeam: '无球队',
    confirmDeletePlayer: '确定删除？',
    // Games
    gameManagement: '比赛管理',
    homeTeam: '主队',
    awayTeam: '客队',
    homeStartingPitcher: '主队先发投手：',
    awayStartingPitcher: '客队先发投手：',
    selectPitcher: '选择投手',
    homeLineup: '主队打线：',
    awayLineup: '客队打线：',
    battingOrderSlot: '第{order}棒',
    date: '日期',
    score: '比分',
    status: '状态',
    completed: '已完成',
    inProgress: '进行中',
    notStarted: '未开始',
    gameStart: '开始',
    scoring: '打分',
    createGame: '创建比赛',
    confirmDeleteGame: '确定删除比赛？',
  },
  'zh-TW': {
    appName: '棒球球隊管理系統',
    loginTitle: '請登入以繼續',
    teams: '球隊',
    squads: '梯隊',
    players: '球員',
    games: '比賽',
    stats: '統計',
    users: '設置',
    logout: '退出',
    admin: '管理員',
    coach: '教練',
    player: '球員',
    noAccount: '還沒有帳戶？',
    register: '註冊',
    initialAdmin: '初始管理員帳戶：',
    username: '用戶名',
    password: '密碼',
    login: '登入',
    loggingIn: '登入中...',
    settings: '設置',
    theme: '主題',
    logo: '隊標',
    clubName: '俱樂部名稱',
    language: '語言',
    uploadLogo: '上傳隊標',
    save: '儲存',
    cancel: '取消',
    selectTheme: '選擇主題色',
    enterClubName: '輸入俱樂部名稱',
    selectLanguage: '選擇語言',
    noTeams: '暫無球隊',
    noSquads: '暫無梯隊',
    noPlayers: '暫無球員',
    noGames: '暫無比賽',
    createTeam: '建立球隊',
    createSquad: '建立梯隊',
    updateSquad: '更新梯隊',
    createPlayer: '建立球員',
    createGame: '建立比賽',
    edit: '編輯',
    delete: '刪除',
    confirmDelete: '確定刪除？',
    backToList: '返回列表',
    name: '姓名',
    role: '角色',
    status: '狀態',
    userType: '類型',
    action: '操作',
    enabled: '啟用',
    disabled: '停用',
    initialAdmin: '初始管理員',
    confirmDeleteUser: '確定刪除用戶 {username}？',
    cannotDisableInitialAdmin: '不能停用初始管理員',
    cannotDeleteInitialAdmin: '不能刪除初始管理員',
    uploading: '上傳中...',
    createAdmin: '建立管理員',
    creating: '建立中...',
    systemAdmin: '系統管理員',
    coachOrStat: '教練/統計員',
    newAdminInfo: '建立新管理員後，初始 admin 帳戶將自動停用',
    usernameAndPasswordRequired: '用戶名和密碼不能為空',
    passwordMinLength: '密碼至少需要6個字符',
    // Squads
    squadManagement: '梯隊管理',
    squadList: '梯隊列表',
    noSquadsCreateFirst: '暫無梯隊，請先建立梯隊',
    squadName: '梯隊名稱',
    selectTeam: '選擇球隊',
    level: '級別',
    ageGroup: '年齡組',
    selectAgeGroup: '選擇年齡組',
    squadPlayers: '梯隊球員',
    number: '號碼',
    position: '位置',
    throwsBats: '投打',
    action: '操作',
    promote: '晉升',
    clickSquadToViewDetails: '點擊左側梯隊查看詳情',
    playerAlreadyTopLevel: '該球員已在最高級別梯隊',
    confirmDeleteSquad: '確定刪除此梯隊？球員不會被刪除，只會解除與梯隊的關聯。',
    confirmPromotePlayer: '確認將 {playerName} 晉升到 {squadName}？',
    // Teams
    teamManagement: '球隊管理',
    teamName: '球隊名稱',
    homeStadium: '主場球場',
    enterTeamName: '輸入球隊名稱',
    enterHomeStadium: '輸入主場球場',
    teamLogo: '隊徽圖片',
    uploading: '上傳中...',
    logoPreview: '隊徽預覽',
    preview: '預覽',
    addTeam: '新增球隊',
    updateTeam: '更新球隊',
    noHomeStadium: '未設置主場',
    noTeamsClickToAdd: '暫無球隊，點擊上方按鈕新增',
    noTeamData: '暫無球隊數據',
    confirmDeleteTeam: '確定刪除？',
    uploadFailed: '上傳失敗: ',
    // Players
    playerManagement: '球員管理',
    jerseyNumber: '球衣號',
    rightBats: '右打',
    leftBats: '左打',
    switchBats: '左右開',
    rightThrows: '右手',
    leftThrows: '左手',
    height: '身高(cm)',
    weight: '體重(kg)',
    selectSquad: '選擇梯隊',
    defensivePosition: '守備位置：',
    addPlayer: '新增球員',
    updatePlayer: '更新球員',
    noTeam: '無球隊',
    confirmDeletePlayer: '確定刪除？',
    // Games
    gameManagement: '比賽管理',
    homeTeam: '主隊',
    awayTeam: '客隊',
    homeStartingPitcher: '主隊先發投手：',
    awayStartingPitcher: '客隊先發投手：',
    selectPitcher: '選擇投手',
    homeLineup: '主隊打線：',
    awayLineup: '客隊打線：',
    battingOrderSlot: '第{order}棒',
    date: '日期',
    score: '比分',
    status: '狀態',
    completed: '已完成',
    inProgress: '進行中',
    notStarted: '未開始',
    gameStart: '開始',
    scoring: '打分',
    createGame: '建立比賽',
    confirmDeleteGame: '確定刪除比賽？',
  },
  'en': {
    appName: 'Baseball Team Manager',
    loginTitle: 'Please login to continue',
    teams: 'Teams',
    squads: 'Squads',
    players: 'Players',
    games: 'Games',
    stats: 'Stats',
    users: 'Settings',
    logout: 'Logout',
    admin: 'Admin',
    coach: 'Coach',
    player: 'Player',
    noAccount: "Don't have an account?",
    register: 'Register',
    initialAdmin: 'Initial Admin Account:',
    username: 'Username',
    password: 'Password',
    login: 'Login',
    loggingIn: 'Logging in...',
    settings: 'Settings',
    theme: 'Theme',
    logo: 'Logo',
    clubName: 'Club Name',
    language: 'Language',
    uploadLogo: 'Upload Logo',
    save: 'Save',
    cancel: 'Cancel',
    selectTheme: 'Select Theme Color',
    enterClubName: 'Enter Club Name',
    selectLanguage: 'Select Language',
    noTeams: 'No teams',
    noSquads: 'No squads',
    noPlayers: 'No players',
    noGames: 'No games',
    createTeam: 'Create Team',
    createSquad: 'Create Squad',
    updateSquad: 'Update Squad',
    createPlayer: 'Create Player',
    createGame: 'Create Game',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Confirm delete?',
    backToList: 'Back to list',
    name: 'Name',
    role: 'Role',
    status: 'Status',
    userType: 'Type',
    action: 'Action',
    enabled: 'Enabled',
    disabled: 'Disabled',
    initialAdmin: 'Initial Admin',
    confirmDeleteUser: 'Confirm delete user {username}?',
    cannotDisableInitialAdmin: 'Cannot disable initial admin',
    cannotDeleteInitialAdmin: 'Cannot delete initial admin',
    uploading: 'Uploading...',
    createAdmin: 'Create Admin',
    creating: 'Creating...',
    systemAdmin: 'System Admin',
    coachOrStat: 'Coach/Stat',
    newAdminInfo: 'After creating new admin, initial admin account will be automatically disabled',
    usernameAndPasswordRequired: 'Username and password are required',
    passwordMinLength: 'Password must be at least 6 characters',
    // Squads
    squadManagement: 'Squad Management',
    squadList: 'Squad List',
    noSquadsCreateFirst: 'No squads, please create one first',
    squadName: 'Squad Name',
    selectTeam: 'Select Team',
    level: 'Level',
    ageGroup: 'Age Group',
    selectAgeGroup: 'Select Age Group',
    squadPlayers: 'Squad Players',
    number: 'Number',
    position: 'Position',
    throwsBats: 'Throws/Bats',
    action: 'Action',
    promote: 'Promote',
    clickSquadToViewDetails: 'Click a squad on the left to view details',
    playerAlreadyTopLevel: 'Player is already in the top level squad',
    confirmDeleteSquad: 'Confirm delete this squad? Players will not be deleted, only unlinked.',
    confirmPromotePlayer: 'Confirm promote {playerName} to {squadName}?',
    // Teams
    teamManagement: 'Team Management',
    teamName: 'Team Name',
    homeStadium: 'Home Stadium',
    enterTeamName: 'Enter team name',
    enterHomeStadium: 'Enter home stadium',
    teamLogo: 'Team Logo',
    uploading: 'Uploading...',
    logoPreview: 'Logo Preview',
    preview: 'Preview',
    addTeam: 'Add Team',
    updateTeam: 'Update Team',
    noHomeStadium: 'No home stadium set',
    noTeamsClickToAdd: 'No teams, click above to add',
    noTeamData: 'No team data',
    confirmDeleteTeam: 'Confirm delete?',
    uploadFailed: 'Upload failed: ',
    // Players
    playerManagement: 'Player Management',
    jerseyNumber: 'Jersey Number',
    rightBats: 'Right',
    leftBats: 'Left',
    switchBats: 'Switch',
    rightThrows: 'Right',
    leftThrows: 'Left',
    height: 'Height(cm)',
    weight: 'Weight(kg)',
    selectSquad: 'Select Squad',
    defensivePosition: 'Defensive Positions:',
    addPlayer: 'Add Player',
    updatePlayer: 'Update Player',
    noTeam: 'No Team',
    confirmDeletePlayer: 'Confirm delete?',
    // Games
    gameManagement: 'Game Management',
    homeTeam: 'Home',
    awayTeam: 'Away',
    homeStartingPitcher: 'Home Starting Pitcher:',
    awayStartingPitcher: 'Away Starting Pitcher:',
    selectPitcher: 'Select Pitcher',
    homeLineup: 'Home Lineup:',
    awayLineup: 'Away Lineup:',
    battingOrderSlot: '#{order}',
    date: 'Date',
    score: 'Score',
    status: 'Status',
    completed: 'Completed',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    gameStart: 'Start',
    scoring: 'Score',
    createGame: 'Create Game',
    confirmDeleteGame: 'Confirm delete game?',
  },
  'ja': {
    appName: '野球チームマネージャー',
    loginTitle: 'ログインしてください',
    teams: 'チーム',
    squads: 'リザーブ',
    players: '選手',
    games: '試合',
    stats: '統計',
    users: '設定',
    logout: 'ログアウト',
    admin: '管理者',
    coach: '監督',
    player: '選手',
    noAccount: 'アカウントがありませんか？',
    register: '登録',
    initialAdmin: '初期管理者アカウント：',
    username: 'ユーザー名',
    password: 'パスワード',
    login: 'ログイン',
    loggingIn: 'ログイン中...',
    settings: '設定',
    theme: 'テーマ',
    logo: 'ロゴ',
    clubName: 'クラブ名',
    language: '言語',
    uploadLogo: 'ロゴアップロード',
    save: '保存',
    cancel: 'キャンセル',
    selectTheme: 'テーマ色を選択',
    enterClubName: 'クラブ名を入力',
    selectLanguage: '言語を選択',
    noTeams: 'チームがありません',
    noSquads: 'リザーブがありません',
    noPlayers: '選手いません',
    noGames: '試合がありません',
    createTeam: 'チームを作成',
    createSquad: 'リザーブを作成',
    updateSquad: 'リザーブを更新',
    createPlayer: '選手を作成',
    createGame: '試合を作成',
    edit: '編集',
    delete: '削除',
    confirmDelete: '削除しますか？',
    backToList: '戻る',
    name: '名前',
    role: '役割',
    status: 'ステータス',
    userType: 'タイプ',
    action: '操作',
    enabled: '有効',
    disabled: '無効',
    initialAdmin: '初期管理者',
    confirmDeleteUser: 'ユーザー {username} を削除しますか？',
    cannotDisableInitialAdmin: '初期管理者を無効にすることはできません',
    cannotDeleteInitialAdmin: '初期管理者を削除することはできません',
    uploading: 'アップロード中...',
    createAdmin: '管理者に作成',
    creating: '作成中...',
    systemAdmin: 'システム管理者',
    coachOrStat: '監督/統計',
    newAdminInfo: '新しい管理者が作成された後、初期 admin アカウントは自動的に無効になります',
    usernameAndPasswordRequired: 'ユーザー名とパスワードは必須です',
    passwordMinLength: 'パスワードは6文字以上である必要があります',
    // Squads
    squadManagement: 'リザーブ管理',
    squadList: 'リザーブリスト',
    noSquadsCreateFirst: 'リザーブがありません。まず作成してください',
    squadName: 'リザーブ名',
    selectTeam: 'チームを選択',
    level: 'レベル',
    ageGroup: '年齢グループ',
    selectAgeGroup: '年齢グループを選択',
    squadPlayers: 'リザーブ選手',
    number: '番号',
    position: '守備位置',
    throwsBats: '投打',
    action: '操作',
    promote: '昇格',
    clickSquadToViewDetails: '左側のリザーブをクリックして詳細を見る',
    playerAlreadyTopLevel: '選手が最も高いレベルリザーブにいます',
    confirmDeleteSquad: 'このリザーブを削除しますか？選手削除されません、リザーブとのリンク解除のみです。',
    confirmPromotePlayer: '{playerName}を{squadName}に昇格させますか？',
    // Teams
    teamManagement: 'チーム管理',
    teamName: 'チーム名',
    homeStadium: 'ホーム球場',
    enterTeamName: 'チーム名を入力',
    enterHomeStadium: 'ホーム球場を入力',
    teamLogo: 'チームロゴ',
    uploading: 'アップロード中...',
    logoPreview: 'ロゴプレビュー',
    preview: 'プレビュー',
    addTeam: 'チームを追加',
    updateTeam: 'チームを更新',
    noHomeStadium: 'ホーム球場未設定',
    noTeamsClickToAdd: 'チームがありません、上で追加をクリック',
    noTeamData: 'チームデータがありません',
    confirmDeleteTeam: '削除しますか？',
    uploadFailed: 'アップロード失敗: ',
    // Players
    playerManagement: '選手管理',
    jerseyNumber: 'ユニフォーム番号',
    rightBats: '右打ち',
    leftBats: '左打ち',
    switchBats: 'スイッチ',
    rightThrows: '右投げ',
    leftThrows: '左投げ',
    height: '身長(cm)',
    weight: '体重(kg)',
    selectSquad: 'リザーブを選択',
    defensivePosition: '守備位置：',
    addPlayer: '選手を追加',
    updatePlayer: '選手を更新',
    noTeam: 'チームなし',
    confirmDeletePlayer: '削除しますか？',
    // Games
    gameManagement: '試合管理',
    homeTeam: 'ホーム',
    awayTeam: 'アウェイ',
    homeStartingPitcher: 'ホーム先発投手：',
    awayStartingPitcher: 'アウェイ先発投手：',
    selectPitcher: '投手を選択',
    homeLineup: 'ホーム打線：',
    awayLineup: 'アウェイ打線：',
    battingOrderSlot: '{order}番',
    date: '日付',
    score: 'スコア',
    status: 'ステータス',
    completed: '完了',
    inProgress: '進行中',
    notStarted: '未開始',
    gameStart: '開始',
    scoring: 'スコア',
    createGame: '試合を作成',
    confirmDeleteGame: '試合を削除しますか？',
  },
}

const initialState = {
  teams: [],
  players: [],
  games: [],
  currentGame: null,
  loading: false,
  error: null,
  // 系统设置
  theme: localStorage.getItem('theme') || 'green',
  language: localStorage.getItem('language') || 'zh-CN',
  clubName: localStorage.getItem('clubName') || '',
  clubLogo: localStorage.getItem('clubLogo') || '',
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'SET_TEAMS':
      return { ...state, teams: action.payload }
    case 'SET_PLAYERS':
      return { ...state, players: action.payload }
    case 'SET_GAMES':
      return { ...state, games: action.payload }
    case 'SET_CURRENT_GAME':
      return { ...state, currentGame: action.payload }
    case 'ADD_TEAM':
      return { ...state, teams: [...state.teams, action.payload] }
    case 'UPDATE_TEAM':
      return { ...state, teams: state.teams.map(t => t.id === action.payload.id ? action.payload : t) }
    case 'DELETE_TEAM':
      return { ...state, teams: state.teams.filter(t => t.id !== action.payload) }
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.payload] }
    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PLAYER':
      return { ...state, players: state.players.filter(p => p.id !== action.payload) }
    case 'ADD_GAME':
      return { ...state, games: [action.payload, ...state.games] }
    case 'UPDATE_GAME':
      return { ...state, games: state.games.map(g => g.id === action.payload.id ? action.payload : g) }
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload)
      return { ...state, theme: action.payload }
    case 'SET_LANGUAGE':
      localStorage.setItem('language', action.payload)
      return { ...state, language: action.payload }
    case 'SET_CLUB_NAME':
      localStorage.setItem('clubName', action.payload)
      return { ...state, clubName: action.payload }
    case 'SET_CLUB_LOGO':
      localStorage.setItem('clubLogo', action.payload)
      return { ...state, clubLogo: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const loadTeams = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const teams = await api.getTeams()
      dispatch({ type: 'SET_TEAMS', payload: teams })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadPlayers = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const players = await api.getPlayers()
      dispatch({ type: 'SET_PLAYERS', payload: players })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadGames = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const games = await api.getGames()
      dispatch({ type: 'SET_GAMES', payload: games })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const loadGame = useCallback(async (id) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const game = await api.getGame(id)
      dispatch({ type: 'SET_CURRENT_GAME', payload: game })
      return game
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      return null
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  const createTeam = useCallback(async (data) => {
    const team = await api.createTeam(data)
    dispatch({ type: 'ADD_TEAM', payload: team })
    return team
  }, [])

  const updateTeam = useCallback(async (id, data) => {
    const team = await api.updateTeam(id, data)
    dispatch({ type: 'UPDATE_TEAM', payload: team })
    return team
  }, [])

  const deleteTeam = useCallback(async (id) => {
    await api.deleteTeam(id)
    dispatch({ type: 'DELETE_TEAM', payload: id })
  }, [])

  const createPlayer = useCallback(async (data) => {
    const player = await api.createPlayer(data)
    dispatch({ type: 'ADD_PLAYER', payload: player })
    return player
  }, [])

  const updatePlayer = useCallback(async (id, data) => {
    const player = await api.updatePlayer(id, data)
    dispatch({ type: 'UPDATE_PLAYER', payload: player })
    return player
  }, [])

  const deletePlayer = useCallback(async (id) => {
    await api.deletePlayer(id)
    dispatch({ type: 'DELETE_PLAYER', payload: id })
  }, [])

  const createGame = useCallback(async (data) => {
    const game = await api.createGame(data)
    dispatch({ type: 'ADD_GAME', payload: game })
    return game
  }, [])

  const updateGame = useCallback(async (id, data) => {
    const game = await api.updateGame(id, data)
    dispatch({ type: 'UPDATE_GAME', payload: game })
    return game
  }, [])

  const addPlateAppearance = useCallback(async (gameId, data) => {
    return await api.addPlateAppearance(gameId, data)
  }, [])

  const setTheme = useCallback((theme) => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }, [])

  const setLanguage = useCallback((language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language })
  }, [])

  const setClubName = useCallback((name) => {
    dispatch({ type: 'SET_CLUB_NAME', payload: name })
  }, [])

  const setClubLogo = useCallback((logo) => {
    dispatch({ type: 'SET_CLUB_LOGO', payload: logo })
  }, [])

  const t = useCallback((key) => {
    return translations[state.language]?.[key] || translations['zh-CN'][key] || key
  }, [state.language])

  const value = {
    ...state,
    loadTeams,
    loadPlayers,
    loadGames,
    loadGame,
    createTeam,
    updateTeam,
    deleteTeam,
    createPlayer,
    updatePlayer,
    deletePlayer,
    createGame,
    updateGame,
    addPlateAppearance,
    setTheme,
    setLanguage,
    setClubName,
    setClubLogo,
    t,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export default AppContext