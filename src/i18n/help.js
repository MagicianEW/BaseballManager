/**
 * 帮助页翻译分片
 *
 * 内容采用数据结构而非散落的 t() 调用：
 * 页面组件只负责渲染，翻译内容集中在这里，四种语言结构完全一致。
 */

const helpZh = {
  helpTitle: '使用帮助',
  helpSubtitle: '面向教练与记分员的完整操作指南',
  navQuickstart: '快速上手',
  navRoles: '角色权限',
  navPages: '页面导览',
  navScoring: '记分操作',
  navMetrics: '统计指标',
  navRules: '比赛规则',
  navPrivacy: '数据与隐私',
  navFaq: '常见问题',
  onThisPage: '本页内容',

  quickstart: {
    title: '快速上手',
    desc: '从零到完成一场比赛记录，只需要下面五步。',
    steps: [
      { title: '登录账号', body: '用初始账号 admin / admin 登录。首次登录后请立即到「设置」页创建新管理员，创建成功后初始账号会自动停用。' },
      { title: '建立球队', body: '在「球队」页添加参赛球队，填球队名称与主场球场，可上传队徽。U10 赛事通常有本队和对手两支球队。' },
      { title: '建立梯队', body: '在「梯队」页按年龄分组创建梯队（如 U10、U12），设置级别与年龄组。梯队用于球员归属和晋升管理。' },
      { title: '录入球员', body: '在「球员」页添加球员，填写姓名、球衣号、投打习惯、守备位置、身高体重，并归属到球队与梯队。' },
      { title: '创建比赛并记分', body: '在「比赛」页新建比赛，选好主客队并安排打线。进入记分页后按打席结果逐个记录，比分与统计会自动累计。' },
    ],
  },

  roles: {
    title: '角色与权限',
    desc: '权限由服务端强制校验，不同角色登录后看到的可操作项不同。',
    columns: ['角色', '可以做什么', '不能做什么'],
    rows: [
      { role: '管理员 admin', can: '全部功能：球队、梯队、球员、比赛、统计的增删改，用户管理，创建新管理员', cannot: '—' },
      { role: '教练 coach', can: '球队、梯队、球员、比赛的增删改；记录打席、换投手、确认阵容', cannot: '用户管理；删除其他账号' },
      { role: '球员 player', can: '查看球队、梯队、球员、比赛与全部统计', cannot: '任何写入操作（按钮不显示，接口也会拒绝）' },
    ],
    note: '教练是本系统的主要使用者。如果你是教练但看不到「新建」按钮，说明当前账号是球员角色，需要管理员在「设置」页调整角色。',
  },

  pages: {
    title: '页面导览',
    desc: '顶部导航栏包含全部功能入口，从左到右是使用顺序。',
    items: [
      {
        name: '球队',
        route: '/',
        purpose: '管理参赛队伍的基本信息。',
        points: [
          '点「添加球队」新建，可填写名称、主场球场并上传队徽。',
          '队徽上传后会显示在登录页和顶部导航栏。',
          '删除球队不会删除球员，只会把球员的球队关联清空。',
        ],
      },
      {
        name: '梯队',
        route: '/squads',
        purpose: '按年龄分组管理球员，比如 U10、U12。',
        points: [
          '左侧列出梯队，点击查看该梯队的球员名单。',
          '「晋升」把球员调到上一个梯队，同时自动对齐所属球队。',
          '删除梯队只解除球员归属，不会删除球员本人。',
        ],
      },
      {
        name: '球员',
        route: '/players',
        purpose: '管理球员档案与打线。',
        points: [
          '登记姓名、球衣号、投打习惯（R/L/S）、守备位置、身高体重。',
          '守备位置可多选（如 1B、3B），显示为「1B/3B」。',
          '球员必须归属到球队，否则不会出现在比赛打线里。',
        ],
      },
      {
        name: '比赛',
        route: '/games',
        purpose: '创建比赛、安排打线、开始记分。',
        points: [
          '新建比赛时选主客队、日期、最终局数、每局得分上限。',
          '按打线顺序点击球员即可排定棒次，点击已选球员可取消。',
          '「开始」把比赛置为进行中；「打分」进入记分页；「打印阵容卡」生成可打印的阵容表。',
          '卡片上会显示最终局数、得分上限、阵容确认状态。',
        ],
      },
      {
        name: '数据统计',
        route: '/stats',
        purpose: '查看全部球员的打击与投球数据。',
        points: [
          '「队伍视图」一行一名球员，点击表头可排序。',
          '「球员视图」每人一卡片，一眼看完核心指标。',
          '点击任意球员行打开详情，展开全部累计数据与投球统计。',
          '顶部可按球队筛选，或按姓名搜索。',
        ],
      },
      {
        name: '设置',
        route: '/settings',
        purpose: '仅管理员可见，管理用户与外观偏好。',
        points: [
          '用户管理：停用/启用账号、创建新管理员、删除用户。',
          '初始管理员账号不能被停用或删除。',
          '外观：切换主题色、上传队徽、设置俱乐部名称、切换界面语言（简中/繁中/英文/日文）。',
        ],
      },
    ],
  },

  scoring: {
    title: '记分操作详解',
    desc: '这是场边记分员最常用的页面。所有比分与统计都由服务端计算，前端只提交打席事实。',
    steps: [
      {
        title: '第一步：确认比赛已开始',
        detail: '在「比赛」页点击「开始」，比赛状态变为「进行中」后才能记分。若显示提示请先在列表页点击开始，说明状态仍是未开始。',
      },
      {
        title: '第二步：确认打线与投手',
        detail: '记分页顶部的「当前打者」按打线顺序自动轮转；「当前投手」取自比赛设置。若投手被换下，可在「打线与阵容」面板里更换。',
      },
      {
        title: '第三步：记录投球（可选）',
        detail: '用「坏 / 好 / 界外」三个按钮逐球记录，计数条会显示当前的球数-好球数。界外球在已有两个好球后不再增加好球数。记录的序列会随这个打席一起保存。',
      },
      {
        title: '第四步：记录打席结果',
        detail: '点击打席结果按钮提交。快速模式只显示 6 个常用结果（HR/SO/BB/GO/FO/1B），完整模式显示全部 15 种，包括二垒安打、三垒安打、双杀打、牺牲打等。',
      },
      {
        title: '第五步：局面自动推进',
        detail: '满 3 出局自动换半局或换局；垒上跑者会按安打类型自动推进；得分与打点自动累计。打席结束后计数归零，下一位打者从 0-0 重新开始。',
      },
    ],
    tips: [
      '打席中途发现记错了？用「结束半局」提前切换，会清空垒上跑者，请谨慎使用。',
      '比赛打满最终局下半会自动结束，也可以手动点「结束比赛」。',
      '达到每局得分上限（U10 常见 5 分）时，本半局自动结束。',
      '代打代跑在「代打代跑」面板里录入，原球员、代打球员、原因都要填。',
      '阵容确认后打线被锁定，需要先「解锁重排」才能修改。',
    ],
  },

  metrics: {
    title: '统计指标速查',
    desc: '口径参照 MLB 官方计分与 Baseball-Reference，全部从打席记录实时汇总。',
    columns: ['指标', '公式', '含义'],
    rows: [
      { name: '打击率 BA', formula: '安打 ÷ 打数', note: '衡量打者把球打进场内的平均能力' },
      { name: '上垒率 OBP', formula: '(安打+保送+触身球) ÷ (打数+保送+触身球+牺牲飞球)', note: '衡量上垒能力，比打击率更能预测得分' },
      { name: '长打率 SLG', formula: '垒打数 ÷ 打数', note: '衡量长打能力，一垒安打记 1、二垒 2、三垒 3、全垒打 4' },
      { name: '整体攻击指数 OPS', formula: '上垒率 + 长打率', note: '把上垒与长打合并成一个数字' },
      { name: '纯长打率 ISO', formula: '长打率 − 打击率', note: '剥离一垒安打后剩余的长打能力' },
      { name: '长打 XBH', formula: '二垒安打 + 三垒安打 + 全垒打', note: '安打中属于长打的部分' },
      { name: '垒打数 TB', formula: '1×一垒 + 2×二垒 + 3×三垒 + 4×全垒', note: 'SLG 的分子' },
      { name: '场内安打率 BABIP', formula: '(安打−全垒打) ÷ (打数−三振−双杀+牺牲飞球)', note: '排除全垒打与三振后的安打率，反映运气成分' },
      { name: '三振率 K%', formula: '三振 ÷ 打数', note: '打者有多容易被三振' },
      { name: '保送率 BB%', formula: '保送 ÷ 打席', note: '打者的选球眼力' },
      { name: '三振保送比 K/BB', formula: '三振 ÷ 保送', note: '越高说明打者容易被三振' },
      { name: '自责分率 ERA', formula: '自责分 × 9 ÷ 投球局数', note: '投手每局平均失分' },
      { name: '每局被上垒率 WHIP', formula: '(被安打+保送+触身球) ÷ 投球局数', note: '投手每局被上垒次数' },
    ],
    notes: [
      '故意四坏（IBB）按官方口径计入保送，因此也计入上垒率；触身球（HBP）单独统计，不计入保送。',
      '打点（RBI）的官方口径是「打者推进回本垒的得分」，因此满垒全垒打记 3 个打点，而不是 4 个 —— 打者自己跑回本垒那分不计打点。',
      '得分（R）记录的是本人回本垒的次数，可能来自自己的安打，也可能来自队友的安打。',
    ],
  },

  rules: {
    title: '比赛规则速查',
    desc: '内置了 U10 青少年联赛常见的规则设置，可在创建比赛时调整。',
    columns: ['规则', '说明'],
    rows: [
      { name: '最终局数', detail: '默认 6 局，打满自动结束比赛。U10 常见为 6 局，U8 一般为 4-5 局。' },
      { name: '每局得分上限', detail: '默认 0（不限制）。设为 5 时，本半局得分达到 5 分即自动换半局，这是 U10 防止比分失控的常见做法。' },
      { name: '宽恕规则', detail: '领先 10 分（过 4 局）、15 分（过 3 局）或 8 分（过 5 局）时自动结束比赛。' },
      { name: '满三出局', detail: '满 3 个出局自动换半局或换局，同时清空垒上跑者。' },
      { name: '双杀打出局', detail: '双杀（GDP）记 2 个出局，符合棒球规则。' },
      { name: '连续打序', detail: '打线按实际人数轮转，支持 8/9/10 人，不会因人数不是 9 而错位。' },
      { name: '故意四坏', detail: '满垒时才推进跑者；一垒有人时按普通保送处理，避免出现两个跑者同占一垒。' },
    ],
  },

  privacy: {
    title: '数据与隐私',
    desc: '本系统保存的是未成年人的个人资料，以下是已经落实的保护措施。',
    points: [
      '所有业务接口强制鉴权，球员角色为只读，不能新增或修改任何数据。',
      '上传的照片不在静态目录，必须登录后才能访问；文件名用 16 字节加密随机数生成，无法枚举猜测。',
      '上传时按文件头判断真实图片类型，不信任客户端提供的文件名与 MIME 类型。',
      '删除球员或更换照片时，磁盘上的图片文件会同步删除，不会残留。',
      '数据库启用 WAL 与外键约束，写入具备事务保护。',
      '生产部署时请设置 CORS_ORIGINS 白名单，避免任意来源访问接口。',
      '默认账号 admin / admin 仅用于首次登录，务必在「设置」页创建新管理员并让初始账号失效。',
    ],
  },

  faq: {
    title: '常见问题',
    items: [
      {
        q: '统计页全是 0？',
        a: '统计来自真实的打席记录。先创建比赛并记录至少一个打席，统计页才会出现数据。',
      },
      {
        q: '记分按钮点不动 / 看不到？',
        a: '比赛状态必须为「进行中」（在比赛列表点「开始」），且当前账号需要教练或管理员角色。球员角色为只读。',
      },
      {
        q: '比分显示的对不上？',
        a: '比分完全由服务端根据打席结果推导，前端不参与计算。请检查是否重复点击了同一个打席结果按钮（记录时会短暂禁用以防重复提交）。',
      },
      {
        q: '打点为什么比得分少？',
        a: '这是官方口径。满垒全垒打是 4 得分但只有 3 打点，因为打者自己跑回本垒那分不计打点。',
      },
      {
        q: '换人后打线乱了？',
        a: '代打代跑会记录在「代打代跑」面板的历史里，但不会自动改变打线顺序 —— 打线是赛前确定的。如需调整请用「解锁重排」。',
      },
      {
        q: '如何统计投手投球数？',
        a: '记分页逐球记录时，投球序列会随每个打席保存。投手统计里的投球局数按出局数换算（3 个出局 = 1 局），可在「数据统计」页查看该投手的 ERA 与 WHIP。',
      },
      {
        q: '换了语言还是部分文字是中文？',
        a: '位置名称等少数内容来自原始常量表。若发现某个词在切换语言后没变化，请反馈对应的页面位置。',
      },
      {
        q: '如何备份数据？',
        a: '数据库文件在 server/data/baseball.db（WAL 模式下还有 .db-wal / .db-shm 三个文件）。备份时三个文件一起复制，或先停止服务再复制。',
      },
    ],
  },
}

export const helpI18n = {
  'zh-CN': helpZh,

  'zh-TW': {
    helpTitle: '使用說明',
    helpSubtitle: '面向教練與記分員的完整操作指南',
    navQuickstart: '快速上手',
    navRoles: '角色權限',
    navPages: '頁面導覽',
    navScoring: '記分操作',
    navMetrics: '統計指標',
    navRules: '比賽規則',
    navPrivacy: '資料與隱私',
    navFaq: '常見問題',
    onThisPage: '本頁內容',

    quickstart: {
      title: '快速上手',
      desc: '從零到完成一場比賽記錄，只需要下面五步。',
      steps: [
        { title: '登入帳號', body: '用初始帳號 admin / admin 登入。首次登入後請立即到「設定」頁建立新管理員，建立成功後初始帳號會自動停用。' },
        { title: '建立球隊', body: '在「球隊」頁新增參賽球隊，填球隊名稱與主場球場，可上傳隊徽。U10 賽事通常有本隊與對手兩支球隊。' },
        { title: '建立梯隊', body: '在「梯隊」頁依年齡分組建立梯隊（如 U10、U12），設定級別與年齡組。梯隊用於球員歸屬與晉升管理。' },
        { title: '錄入球員', body: '在「球員」頁新增球員，填寫姓名、背號、投打習慣、守備位置、身高體重，並歸屬到球隊與梯隊。' },
        { title: '建立比賽並記分', body: '在「比賽」頁新增比賽，選好主客隊並安排打線。進入記分頁後依打席結果逐筆記錄，比分與統計會自動累計。' },
      ],
    },

    roles: {
      title: '角色與權限',
      desc: '權限由伺服器強制校驗，不同角色登入後看到的可操作項不同。',
      columns: ['角色', '可以做什麼', '不能做什麼'],
      rows: [
        { role: '管理員 admin', can: '全部功能：球隊、梯隊、球員、比賽、統計的增刪改，使用者管理，建立新管理員', cannot: '—' },
        { role: '教練 coach', can: '球隊、梯隊、球員、比賽的增刪改；記錄打席、換投手、確認陣容', cannot: '使用者管理；刪除其他帳號' },
        { role: '球員 player', can: '檢視球隊、梯隊、球員、比賽與全部統計', cannot: '任何寫入操作（按鈕不顯示，介面也會拒絕）' },
      ],
      note: '教練是本系統的主要使用者。如果你是教練但看不到「新增」按鈕，說明目前帳號是球員角色，需要管理員在「設定」頁調整角色。',
    },

    pages: {
      title: '頁面導覽',
      desc: '頂部導覽列包含全部功能入口，由左至右就是使用順序。',
      items: [
        {
          name: '球隊', route: '/', purpose: '管理參賽隊伍的基本資訊。',
          points: [
            '點「新增球隊」新建，可填寫名稱、主場球場並上傳隊徽。',
            '隊徽上傳後會顯示在登入頁與頂部導覽列。',
            '刪除球隊不會刪除球員，只會把球員的球隊關聯清空。',
          ],
        },
        {
          name: '梯隊', route: '/squads', purpose: '依年齡分組管理球員，例如 U10、U12。',
          points: [
            '左側列出梯隊，點擊檢視該梯隊的球員名單。',
            '「晉升」把球員調到上一個梯隊，同時自動對齊所屬球隊。',
            '刪除梯隊只解除球員歸屬，不會刪除球員本人。',
          ],
        },
        {
          name: '球員', route: '/players', purpose: '管理球員檔案與打線。',
          points: [
            '登記姓名、背號、投打習慣（R/L/S）、守備位置、身高體重。',
            '守備位置可複選（如 1B、3B），顯示為「1B/3B」。',
            '球員必須歸屬到球隊，否則不會出現在比賽打線裡。',
          ],
        },
        {
          name: '比賽', route: '/games', purpose: '建立比賽、安排打線、開始記分。',
          points: [
            '新增比賽時選主客隊、日期、最終局數、每局得分上限。',
            '依打線順序點擊球員即可排定棒次，點擊已選球員可取消。',
            '「開始」把比賽設為進行中；「打分」進入記分頁；「列印陣容卡」產生可列印的陣容表。',
            '卡片上會顯示最終局數、得分上限、陣容確認狀態。',
          ],
        },
        {
          name: '數據統計', route: '/stats', purpose: '檢視全部球員的打擊與投球數據。',
          points: [
            '「隊伍視圖」一行一名球員，點擊表頭可排序。',
            '「球員視圖」每人一卡片，一眼看完核心指標。',
            '點擊任一球員列開啟詳情，展開全部累計數據與投球統計。',
            '頂部可依球隊篩選，或依姓名搜尋。',
          ],
        },
        {
          name: '設定', route: '/settings', purpose: '僅管理員可見，管理使用者與外觀偏好。',
          points: [
            '使用者管理：停用/啟用帳號、建立新管理員、刪除使用者。',
            '初始管理員帳號不能被停用或刪除。',
            '外觀：切換主題色、上傳隊徽、設定俱樂部名稱、切換介面語言（簡中/繁中/英文/日文）。',
          ],
        },
      ],
    },

    scoring: {
      title: '記分操作詳解',
      desc: '這是場邊記分員最常用的頁面。所有比分與統計都由伺服器計算，前端只提交打席事實。',
      steps: [
        { title: '第一步：確認比賽已開始', detail: '在「比賽」頁點擊「開始」，比賽狀態變為「進行中」後才能記分。若顯示請先在列表頁點擊開始，說明狀態仍是未開始。' },
        { title: '第二步：確認打線與投手', detail: '記分頁頂部的「當前打者」依打線順序自動輪轉；「當前投手」取自比賽設定。若投手被換下，可在「打線與陣容」面板裡更換。' },
        { title: '第三步：記錄投球（選填）', detail: '用「壞 / 好 / 界外」三個按鈕逐球記錄，計數條會顯示當前的球數-好球數。界外球在已有兩個好球後不再增加好球數。記錄的序列會隨這個打席一起儲存。' },
        { title: '第四步：記錄打席結果', detail: '點擊打席結果按鈕送出。快速模式只顯示 6 個常用結果（HR/SO/BB/GO/FO/1B），完整模式顯示全部 15 種，包括二壘安打、三壘安打、雙殺打、犧牲打等。' },
        { title: '第五步：局面自動推進', detail: '滿 3 出局自動換半局或換局；壘上跑者會依安打類型自動推進；得分與打點自動累計。打席結束後計數歸零，下一位打者從 0-0 重新開始。' },
      ],
      tips: [
        '打席中途發現記錯了？用「結束半局」提前切換，會清空壘上跑者，請謹慎使用。',
        '比賽打滿最終局下半會自動結束，也可以手動點「結束比賽」。',
        '達到每局得分上限（U10 常見 5 分）時，本半局自動結束。',
        '代打代走在「代打代跑」面板裡錄入，原球員、代打球員、原因都要填。',
        '陣容確認後打線被鎖定，需要先「解鎖重排」才能修改。',
      ],
    },

    metrics: {
      title: '統計指標速查',
      desc: '口徑參照 MLB 官方計分與 Baseball-Reference，全部從打席記錄即時彙總。',
      columns: ['指標', '公式', '含義'],
      rows: [
        { name: '打擊率 BA', formula: '安打 ÷ 打數', note: '衡量打者把球打進場內的平均能力' },
        { name: '上壘率 OBP', formula: '(安打+保送+觸身球) ÷ (打數+保送+觸身球+犧牲飛球)', note: '衡量上壘能力，比打擊率更能預測得分' },
        { name: '長打率 SLG', formula: '壘打數 ÷ 打數', note: '衡量長打能力，一壘安打記 1、二壘 2、三壘 3、全壘打 4' },
        { name: '整體攻擊指數 OPS', formula: '上壘率 + 長打率', note: '把上壘與長打合併成一個數字' },
        { name: '純長打率 ISO', formula: '長打率 − 打擊率', note: '剥离一壘安打後剩餘的長打能力' },
        { name: '長打 XBH', formula: '二壘安打 + 三壘安打 + 全壘打', note: '安打中的長打部分' },
        { name: '壘打數 TB', formula: '1×一壘 + 2×二壘 + 3×三壘 + 4×全壘', note: 'SLG 的分子' },
        { name: '場內安打率 BABIP', formula: '(安打−全壘打) ÷ (打數−三振−雙殺+犧牲飛球)', note: '排除全壘打與三振後的安打率，反映運氣成分' },
        { name: '三振率 K%', formula: '三振 ÷ 打數', note: '打者有多容易被三振' },
        { name: '保送率 BB%', formula: '保送 ÷ 打席', note: '打者的選球眼力' },
        { name: '三振保送比 K/BB', formula: '三振 ÷ 保送', note: '越高說明打者容易被三振' },
        { name: '自責分率 ERA', formula: '自責分 × 9 ÷ 投球局數', note: '投手每局平均失分' },
        { name: '每局被上壘率 WHIP', formula: '(被安打+保送+觸身球) ÷ 投球局數', note: '投手每局被上壘次數' },
      ],
      notes: [
        '故意四壞（IBB）按官方口徑計入保送，因此也計入上壘率；觸身球（HBP）單獨統計，不計入保送。',
        '打點（RBI）的官方口徑是「打者推進回本壘的得分」，因此滿壘全壘打記 3 個打點，而不是 4 個 —— 打者自己跑回本壘那分不計打點。',
        '得分（R）記錄的是本人回本壘的次數，可能來自自己的安打，也可能來自隊友的安打。',
      ],
    },

    rules: {
      title: '比賽規則速查',
      desc: '內建了 U10 青少年聯賽常見的規則設定，可在建立比賽時調整。',
      columns: ['規則', '說明'],
      rows: [
        { name: '最終局數', detail: '預設 6 局，打滿自動結束比賽。U10 常見為 6 局，U8 一般為 4-5 局。' },
        { name: '每局得分上限', detail: '預設 0（不限制）。設為 5 時，本半局得分達到 5 分即自動換半局，這是 U10 防止比分手控的常見做法。' },
        { name: '寬恕規則', detail: '領先 10 分（過 4 局）、15 分（過 3 局）或 8 分（過 5 局）時自動結束比賽。' },
        { name: '滿三出局', detail: '滿 3 個出局自動換半局或換局，同時清空壘上跑者。' },
        { name: '雙殺打出局', detail: '雙殺（GDP）記 2 個出局，符合棒球規則。' },
        { name: '連續打序', detail: '打線依實際人數輪轉，支援 8/9/10 人，不會因人數不是 9 而錯位。' },
        { name: '故意四壞', detail: '滿壘時才推進跑者；一壘有人時按普通保送處理，避免出現兩個跑者同佔一壘。' },
      ],
    },

    privacy: {
      title: '資料與隱私',
      desc: '本系統儲存的是未成年人的個人資料，以下是已經落實的保護措施。',
      points: [
        '所有業務介面強制鑑權，球員角色為唯讀，不能新增或修改任何資料。',
        '上傳的照片不在靜態目錄，必須登入後才能存取；檔名用 16 位元組加密隨機數產生，無法列舉猜測。',
        '上傳時依檔案標頭判斷真實圖片類型，不信任客戶端提供的檔名與 MIME 型別。',
        '刪除球員或更換照片時，磁碟上的圖片檔會同步刪除，不會殘留。',
        '資料庫啟用 WAL 與外鍵約束，寫入具備交易保護。',
        '正式部署時請設定 CORS_ORIGINS 白名單，避免任意來源存取介面。',
        '預設帳號 admin / admin 僅用於首次登入，務必在「設定」頁建立新管理員並讓初始帳號失效。',
      ],
    },

    faq: {
      title: '常見問題',
      items: [
        { q: '統計頁全是 0？', a: '統計來自真實的打席記錄。先建立比賽並記錄至少一個打席，統計頁才會出現資料。' },
        { q: '記分按鈕點不動 / 看不到？', a: '比賽狀態必須為「進行中」（在比賽列表點「開始」），且目前帳號需要教練或管理員角色。球員角色為唯讀。' },
        { q: '比分顯示的對不上？', a: '比分完全由伺服器依打席結果推導，前端不參與計算。請檢查是否重複點擊了同一個打席結果按鈕（記錄時會短暫停用以防重複送出）。' },
        { q: '打點為什麼比得分少？', a: '這是官方口徑。滿壘全壘打是 4 得分但只有 3 打點，因為打者自己跑回本壘那分不計打點。' },
        { q: '換人後打線亂了？', a: '代打代跑會記錄在「代打代跑」面板的歷史裡，但不會自動改變打線順序 —— 打線是事前確定的。如需調整請用「解鎖重排」。' },
        { q: '如何統計投手投球數？', a: '記分頁逐球記錄時，投球序列會隨每個打席儲存。投手統計裡的投球局數按出局數換算（3 個出局 = 1 局），可在「數據統計」頁查看該投手的 ERA 與 WHIP。' },
        { q: '換了語言還是部分文字是中文？', a: '位置名稱等少數內容來自原始常數表。若發現某個詞在切換語言後沒變化，請回報對應的頁面位置。' },
        { q: '如何備份資料？', a: '資料庫檔案在 server/data/baseball.db（WAL 模式下還有 .db-wal / .db-shm 三個檔案）。備份時三個檔案一起複製，或先停止服務再複製。' },
      ],
    },
  },

  en: {
    helpTitle: 'Help',
    helpSubtitle: 'A complete guide for coaches and scorekeepers',
    navQuickstart: 'Quick start',
    navRoles: 'Roles & permissions',
    navPages: 'Page guide',
    navScoring: 'Scoring',
    navMetrics: 'Metrics',
    navRules: 'Game rules',
    navPrivacy: 'Data & privacy',
    navFaq: 'FAQ',
    onThisPage: 'On this page',

    quickstart: {
      title: 'Quick start',
      desc: 'Five steps from zero to a complete game record.',
      steps: [
        { title: 'Sign in', body: 'Sign in with the initial account admin / admin. Then immediately create a new admin from Settings — the initial account is disabled automatically once you do.' },
        { title: 'Add your teams', body: 'Create the participating teams under Teams, with a name, home field and optional logo. A U10 event usually has your own club plus the opponent.' },
        { title: 'Create squads', body: 'Group players by age under Squads (U10, U12, …), setting level and age group. Squads drive player membership and promotions.' },
        { title: 'Add players', body: 'Register players under Players: name, jersey number, bats/throws, defensive positions, height and weight, plus team and squad.' },
        { title: 'Create a game and score it', body: 'Create the game under Games, pick home/away and set the batting order. Then record plate appearances in the scoring page — the score and stats update themselves.' },
      ],
    },

    roles: {
      title: 'Roles & permissions',
      desc: 'Permissions are enforced server-side, so each role sees a different set of actions.',
      columns: ['Role', 'Can do', 'Cannot do'],
      rows: [
        { role: 'Admin', can: 'Everything: manage teams, squads, players, games and stats; manage users; create new admins', cannot: '—' },
        { role: 'Coach', can: 'Create/edit/delete teams, squads, players and games; record PAs, change pitcher, confirm lineups', cannot: 'Manage users; delete other accounts' },
        { role: 'Player', can: 'View teams, squads, players, games and all statistics', cannot: 'Any write operation (buttons hidden and the API refuses)' },
      ],
      note: 'Coaches are the primary users of this system. If you are a coach but see no "Create" buttons, your account has the player role — ask an admin to change it under Settings.',
    },

    pages: {
      title: 'Page guide',
      desc: 'The top navigation holds every feature, in the order you will use them.',
      items: [
        {
          name: 'Teams', route: '/', purpose: 'Manage the basic details of participating clubs.',
          points: [
            'Click "Add Team" to create one, with name, home field and an optional logo.',
            'A club logo shows on the login page and in the top bar once uploaded.',
            'Deleting a team does not delete players — it only clears their team link.',
          ],
        },
        {
          name: 'Squads', route: '/squads', purpose: 'Group players by age, e.g. U10 and U12.',
          points: [
            'Squads are listed on the left; click one to see its roster.',
            '"Promote" moves a player up a squad and syncs their team automatically.',
            'Deleting a squad only unlinks players — nobody is deleted.',
          ],
        },
        {
          name: 'Players', route: '/players', purpose: 'Manage player profiles and lineups.',
          points: [
            'Record name, jersey number, bats/throws (R/L/S), defensive positions, height and weight.',
            'Multiple defensive positions are supported (e.g. 1B and 3B) and shown as "1B/3B".',
            'A player must belong to a team, otherwise they will not appear in a lineup.',
          ],
        },
        {
          name: 'Games', route: '/games', purpose: 'Create games, set lineups, start scoring.',
          points: [
            'When creating a game, pick home/away, date, final innings and run limit.',
            'Click players in batting order to set the lineup; click a selected player again to remove them.',
            '"Start" moves the game to in-progress, "Score" opens the scoring page, "Print Lineup Card" produces a printable sheet.',
            'Each card shows final innings, run limit and lineup-confirmation status.',
          ],
        },
        {
          name: 'Statistics', route: '/stats', purpose: 'See batting and pitching numbers for every player.',
          points: [
            'Team view lists one player per row; click a header to sort.',
            'Player view shows one card per player with the headline metrics.',
            'Click any row to open the detail panel with all counting stats and pitching numbers.',
            'Filter by team or search by name at the top.',
          ],
        },
        {
          name: 'Settings', route: '/settings', purpose: 'Admin only: users and appearance.',
          points: [
            'User management: disable/enable accounts, create new admins, delete users.',
            'The initial admin account cannot be disabled or deleted.',
            'Appearance: switch theme colour, upload a club logo, set the club name, and switch the interface language.',
          ],
        },
      ],
    },

    scoring: {
      title: 'Scoring in detail',
      desc: 'This is the page a scorekeeper uses on the sideline. Every score and statistic is computed server-side; the client only submits what happened.',
      steps: [
        { title: 'Step 1 — Make sure the game is live', detail: 'Press "Start" on the Games page. You can only score once the status is in-progress. If you see a prompt to start it from the list, the game has not started yet.' },
        { title: 'Step 2 — Check the lineup and pitcher', detail: 'The "Current Batter" rotates automatically through the batting order; "Current Pitcher" comes from the game setup. You can change the pitcher in the Lineup & Roster panel.' },
        { title: 'Step 3 — Track pitches (optional)', detail: 'Use the Ball / Strike / Foul buttons to log each pitch; the counter shows the live count. A foul does not add a strike once you already have two. The sequence is saved with the plate appearance.' },
        { title: 'Step 4 — Record the result', detail: 'Tap the result button. Quick mode shows six common results (HR/SO/BB/GO/FO/1B); full mode shows all 15, including doubles, triples, double plays and sacrifices.' },
        { title: 'Step 5 — The situation advances itself', detail: 'Three outs flip the half-inning or inning automatically; runners advance according to the hit; runs and RBIs accumulate. The count resets to 0-0 for the next batter.' },
      ],
      tips: [
        'Recorded the wrong result mid-PA? "End Half-Inning" switches early but clears the runners — use with care.',
        'The game ends by itself when the final inning is complete; you can also press "End Game".',
        'When the run limit per inning is reached (commonly 5 in U10), the half-inning ends automatically.',
        'Log pinch runners and pinch hitters in the Substitutions panel — original player, substitute and reason are all required.',
        'A confirmed lineup is locked. Unlock it first if you need to reorder.',
      ],
    },

    metrics: {
      title: 'Metrics reference',
      desc: 'Following MLB official scoring and Baseball-Reference, all aggregated live from plate appearances.',
      columns: ['Metric', 'Formula', 'What it measures'],
      rows: [
        { name: 'Batting Average BA', formula: 'Hits ÷ At-bats', note: 'How often a hitter puts the ball in play' },
        { name: 'On-base % OBP', formula: '(H+BB+HBP) ÷ (AB+BB+HBP+SF)', note: 'Ability to reach base; predicts scoring better than BA' },
        { name: 'Slugging % SLG', formula: 'Total bases ÷ At-bats', note: 'Power: a single is 1, double 2, triple 3, home run 4' },
        { name: 'OPS', formula: 'OBP + SLG', note: 'On-base ability and power in one number' },
        { name: 'Isolated Power ISO', formula: 'SLG − BA', note: 'Extra-base power with singles stripped out' },
        { name: 'Extra Base Hits XBH', formula: '2B + 3B + HR', note: 'The extra-base part of a hitter’s hits' },
        { name: 'Total Bases TB', formula: '1×1B + 2×2B + 3×3B + 4×HR', note: 'The numerator behind SLG' },
        { name: 'BABIP', formula: '(H−HR) ÷ (AB−SO−GDP+SF)', note: 'Batting average excluding HR and strikeouts — a luck indicator' },
        { name: 'Strikeout % K%', formula: 'Strikeouts ÷ At-bats', note: 'How often a hitter strikes out' },
        { name: 'Walk % BB%', formula: 'Walks ÷ Plate appearances', note: 'Plate discipline' },
        { name: 'K/BB', formula: 'Strikeouts ÷ Walks', note: 'Higher means the hitter strikes out more' },
        { name: 'ERA', formula: 'ER × 9 ÷ IP', note: 'Average runs allowed per nine innings' },
        { name: 'WHIP', formula: '(H+BB+HBP) ÷ IP', note: 'Baserunners allowed per inning' },
      ],
      notes: [
        'Intentional walks count as walks under official scoring, so they also count in OBP. Hit-by-pitch is tracked separately and is not a walk.',
        'RBI officially means "runs driven in by the batter", so a bases-loaded home run is 3 RBI, not 4 — the run the batter scores himself does not count.',
        'R is the number of times the player himself crossed home, whether on his own hit or a teammate’s.',
      ],
    },

    rules: {
      title: 'Game rules reference',
      desc: 'Common U10 youth league rule settings, adjustable when creating a game.',
      columns: ['Rule', 'Detail'],
      rows: [
        { name: 'Final innings', detail: 'Default 6. The game ends automatically when reached. U10 is usually 6 innings; U8 is typically 4-5.' },
        { name: 'Run limit per inning', detail: 'Default 0 (no limit). Set it to 5 and the half-inning ends once 5 runs are scored — a common U10 guard against runaway scores.' },
        { name: 'Mercy rule', detail: 'A 10-run lead after 4 innings (15 after 3, 8 after 5) ends the game automatically.' },
        { name: 'Three outs', detail: 'Three outs flip the half-inning or inning automatically and clear the bases.' },
        { name: 'Double play outs', detail: 'A double play (GDP) counts as two outs, per the rules.' },
        { name: 'Continuous batting order', detail: 'The lineup rotates by its actual length, so 8-, 9- and 10-player lineups all work without drift.' },
        { name: 'Intentional walk', detail: 'Runners advance only when the bases are loaded; with a runner on first it is treated as a normal walk so two runners can never share a base.' },
      ],
    },

    privacy: {
      title: 'Data & privacy',
      desc: 'This system stores personal details about minors. These protections are already in place.',
      points: [
        'All business endpoints require authentication; the player role is read-only and cannot create or modify data.',
        'Uploaded photos live outside the static directory and require a signed-in session; filenames use 16 bytes of crypto-grade randomness and cannot be guessed or enumerated.',
        'Uploads are validated by file header, so a renamed executable cannot masquerade as an image.',
        'Deleting a player or replacing a photo also removes the file from disk — nothing is left behind.',
        'The database runs in WAL mode with foreign keys enforced and writes wrapped in transactions.',
        'Set a CORS_ORIGINS allowlist in production so arbitrary origins cannot call the API.',
        'The default admin / admin account is for first sign-in only — create a real admin in Settings and let the initial account expire.',
      ],
    },

    faq: {
      title: 'FAQ',
      items: [
        { q: 'Why is the statistics page all zeros?', a: 'Statistics come from real plate appearances. Create a game and record at least one plate appearance first.' },
        { q: 'The scoring buttons are missing or do nothing', a: 'The game must be in-progress (press Start on the Games page) and your account needs the coach or admin role. Players are read-only.' },
        { q: 'The score does not look right', a: 'The score is derived entirely from the server based on recorded results. Check that you did not tap the same result twice — the button is briefly disabled to prevent that.' },
        { q: 'Why are there fewer RBIs than runs?', a: 'That is the official definition. A bases-loaded home run is 4 runs but 3 RBIs, because the run the batter scores himself does not count.' },
        { q: 'A substitution knocked the lineup out of order', a: 'Substitutions are recorded in the Substitutions panel, but they do not reorder the lineup — the batting order is fixed before the game. Use "Unlock to edit" if you must change it.' },
        { q: 'How do I count a pitcher’s pitches?', a: 'Pitch sequences logged in the scoring page are saved with each plate appearance. A pitcher’s innings are derived from outs (3 outs = 1 inning); ERA and WHIP are on the Statistics page.' },
        { q: 'Some text is still Chinese after I switch language', a: 'A few labels come from the original constants table. If you spot one that never changes, tell us which page it is on.' },
        { q: 'How do I back up the data?', a: 'The database is server/data/baseball.db — in WAL mode there are also .db-wal and .db-shm files. Copy all three, or stop the server first and copy just the main file.' },
      ],
    },
  },

  ja: {
    helpTitle: 'ヘルプ',
    helpSubtitle: '監督・スコアラー向けの完全ガイド',
    navQuickstart: 'クイックスタート',
    navRoles: '権限',
    navPages: 'ページ案内',
    navScoring: 'スコア入力',
    navMetrics: '指標',
    navRules: '試合ルール',
    navPrivacy: 'データとプライバシー',
    navFaq: 'よくある質問',
    onThisPage: 'このページの内容',

    quickstart: {
      title: 'クイックスタート',
      desc: 'ゼロから試合記録を完成させるまで、5ステップで完了します。',
      steps: [
        { title: 'ログイン', body: '初期アカウント admin / admin でログイン。直ちに「設定」で新しい管理者を作成してください。作成すると初期アカウントは自動的に無効になります。' },
        { title: 'チームを作成', body: '「チーム」ページで参加チームを追加します。チーム名・主场球場・ロゴを設定できます。U10 では自チーム和対戦チームの2チーム。' },
        { title: '梯队を作成', body: '「リザーブ」ページで年齢ごとのグループ（U10、U12 など）を作成します。選手の所属と昇格管理に使います。' },
        { title: '選手を登録', body: '「選手」ページで氏名・背番号・投打・守備位置・身長体重を登録し、チームとリザーブに割り当てます。' },
        { title: '試合を作成してスコア入力', body: '「試合」ページで試合を作り、主客チームと打線を決めます。スコア入力ページで打席結果を記録すると、得点と統計が自動で集計されます。' },
      ],
    },

    roles: {
      title: '権限',
      desc: '権限はサーバー側で強制されます。ロールごとに操作できる項目が異なります。',
      columns: ['ロール', 'できること', 'できないこと'],
      rows: [
        { role: '管理者 admin', can: 'すべて：チーム・リザーブ・選手・試合・統計の管理、ユーザー管理、管理者の新規作成', cannot: '—' },
        { role: '監督 coach', can: 'チーム・リザーブ・選手・試合の作成・編集・削除、打席記録、投手交代、打線確定', cannot: 'ユーザー管理、他アカウントの削除' },
        { role: '選手 player', can: 'チーム・リザーブ・選手・試合と全統計の閲覧', cannot: 'すべての書き込み操作（ボタン非表示、API も拒否）' },
      ],
      note: 'このシステムの主な利用者は監督です。監督なのに「新規作成」ボタンが見えない場合は、選手ロールでログインしています。管理者に「設定」でロール変更を依頼してください。',
    },

    pages: {
      title: 'ページ案内',
      desc: '上部ナビゲーションにすべての機能があります。使う順。左から右へ。',
      items: [
        {
          name: 'チーム', route: '/', purpose: '参加チームの基本情報管理。',
          points: [
            '「チームを追加」で作成し、名称・主场球場・ロゴを設定します。',
            'ロゴを設定するとログインページと上部ナビに表示されます。',
            'チームを削除しても選手は削除されず、所属だけが外れます。',
          ],
        },
        {
          name: 'リザーブ', route: '/squads', purpose: 'U10・U12 など年齢ごとに選手を管理。',
          points: [
            '左にリザーブ一覧があり、クリックすると所属選手が表示されます。',
            '「昇格」で上の階級へ移し、チーム所属も自動で同期します。',
            'リザーブを削除しても選手は削除されず、紐付けだけが外れます。',
          ],
        },
        {
          name: '選手', route: '/players', purpose: '選手プロフィールと打線の管理。',
          points: [
            '氏名・背番号・投打（R/L/S）・守備位置・身長体重を登録します。',
            '守備位置は複数選択可（1B と 3B など）。「1B/3B」と表示されます。',
            '選手がチームに割り当てられていないと、試合の打線に出てきません。',
          ],
        },
        {
          name: '試合', route: '/games', purpose: '試合の作成、打線の決定、スコア入力の開始。',
          points: [
            '作成時に主客チーム・日付・最終回・1回最大得点を決めます。',
            '打線順にクリックして打席を決めます。選択済みの選手をもう一度クリックすると解除します。',
            '「開始」で進行中へ、「打分」でスコア入力ページへ、「打印陣容卡」で印刷用の打線表を作成します。',
            'カードには最終回・得点上限・陣容確定状態が表示されます。',
          ],
        },
        {
          name: '統計', route: '/stats', purpose: '全選手の打撃・投手成績を表示。',
          points: [
            '「チーム表示」は選手1人1行。見出しクリックで並べ替えできます。',
            '「選手表示」は選手ごとにカード表示で主要指標が一目で確認できます。',
            '任意の行をクリックすると詳細が開き、全カウント項目と投手成績を確認できます。',
            '上部でチーム絞り込み、氏名検索ができます。',
          ],
        },
        {
          name: '設定', route: '/settings', purpose: '管理者のみ。ユーザー管理と外観設定。',
          points: [
            'ユーザー管理：アカウントの停止・有効化、管理者の新規作成、ユーザーの削除。',
            '初期管理者アカウントは停止も削除もできません。',
            '外観：テーマカラー、クラブロゴ、クラブ名、表示言語（簡中/繁中/英/日）を設定します。',
          ],
        },
      ],
    },

    scoring: {
      title: 'スコア入力の詳細',
      desc: 'サイドのスコアラーが最も使うページです。得点・統計はすべてサーバーが計算し、フロントエンドは打席の事実だけを送信します。',
      steps: [
        { title: '第1歩 — 試合を開始する', detail: '「試合」ページで「開始」を押します。状態が「進行中」でないと入力できません。「先に開始してください」と表示される場合は未開始です。' },
        { title: '第2歩 — 打線と投手を確かめる', detail: '「現在の打者」は打線順に自動で回ります。「現在の投手」は試合設定から取得します。投手が交代した場合は「打線と登録」パネルで変更できます。' },
        { title: '第3歩 — 投球を記録（任意）', detail: '「ボ / ス / ファ」のボタンで1球ずつ記録すると、カウントが表示されます。ファウルは2ストライクに達した後はストライクを加算しません。記録した列は打席とともに保存されます。' },
        { title: '第4歩 — 打席結果を記録', detail: '結果ボタンを押して送信します。クイック表示は6種（HR/SO/BB/GO/FO/1B）、フル表示は二塁打・三塁打・併殺打・犠牲打など全15種です。' },
        { title: '第5歩 — 局面は自動で進む', detail: '3アウトで表裏・回が自動的に切り替わり、走者は安打種類に応じて送られ、得点と打点が自動集計されます。打席が終わるとカウントは 0-0 に戻ります。' },
      ],
      tips: [
        '途中で入力を間違えた場合は「攻防終了」で手動で切り替わりますが、走者はクリアされます。慎重にご使用ください。',
        '最終回の下-bis.assertまで打つと自動終了します。手動で「試合終了」を押すこともできます。',
        '1回最大得点（U10 では 5 が一般的）に達すると、その回は自動で終了します。',
        '代打・代走は「代打・代走」パネルで入力します。交代前の選手・代打選手・理由が必要です。',
        '打線を確定するとロックされます。変更には先に「編集用に解除」が必要です。',
      ],
    },

    metrics: {
      title: '指標リファレンス',
      desc: 'MLB公式計分と Baseball-Reference に従い、すべて打席記録からリアルタイム集計。',
      columns: ['指標', '公式', '意味'],
      rows: [
        { name: '打率 BA', formula: '安打 ÷ 打数', note: '打者が球を场内に入れる平均的能力' },
        { name: '出塁率 OBP', formula: '(安打+四球+死球) ÷ (打数+四球+死球+犠牲フライ)', note: '出塁能力。打率より得点予測に有効' },
        { name: '長打率 SLG', formula: '塁打数 ÷ 打数', note: '長打力。単打1、二塁打2、三塁打3、本塁打4' },
        { name: 'OPS', formula: '出塁率 + 長打率', note: '出塁力と長打力を1つの数値に' },
        { name: '純長打率 ISO', formula: '長打率 − 打率', note: '単打を除いた長打力' },
        { name: '長打 XBH', formula: '二塁打 + 三塁打 + 本塁打', note: '安打のうち長打の部分' },
        { name: '塁打数 TB', formula: '1×単打 + 2×二塁打 + 3×三塁打 + 4×本塁打', note: 'SLG の分子' },
        { name: 'BABIP', formula: '(安打−本塁打) ÷ (打数−三振−併殺+犠牲フライ)', note: '本塁打と三振を除いた安打率。運の要素' },
        { name: '三振率 K%', formula: '三振 ÷ 打数', note: '三振されやすさ' },
        { name: '四球率 BB%', formula: '四球 ÷ 打席', note: '選球力' },
        { name: '三振/四球', formula: '三振 ÷ 四球', note: '高いほど三振しやすい' },
        { name: '防御率 ERA', formula: '自責点 × 9 ÷ 投球回', note: '9回あたりの平均失点' },
        { name: 'WHIP', formula: '(被安打+四球+死球) ÷ 投球回', note: '1回あたり許した走者数' },
      ],
      notes: [
        '故意四球は公式には四球に含まれるため出塁率にも算入されます。死球（HBP）は単独集計し四球には含みません。',
        '打点の公式は「打者が送った得点」です。満塁本塁打は 4 得点でも打点は 3 —— 打者自身が得点した 1 点は打点に含めません。',
        '得点（R）は本人が本塁に戻った回数で、自らの安打でも、队友の安打でも加算されます。',
      ],
    },

    rules: {
      title: '試合ルール',
      desc: 'U10 少年リーグで一般的なルール設定です。試合作成時に調整できます。',
      columns: ['ルール', '説明'],
      rows: [
        { name: '最終回', detail: '既定は6回。到達で自動終了。U10は6回が一般的、U8は4〜5回。' },
        { name: '1回最大得点', detail: '既定は0（無制限）。5に設定するとその回で5点に達した時点で自動終了。U10で得点の失控を防ぐ常见策。' },
        { name: 'mercy rule', detail: '3回終了時15点、4回終了時10点、5回終了時8点のリードで自動終了。' },
        { name: '3アウト', detail: '3アウトで表裏・回が自動的に切り替わり、走者はクリアされます。' },
        { name: '併殺のアウト', detail: '併殺（GDP）は2アウトとして数えます（ルール通り）。' },
        { name: '連続打順', detail: '打線は実人数で回すため、8人・9人・10人のいずれでもずれません。' },
        { name: '故意四球', detail: '満塁時のみ走者が進みます。一塁に走者がいる場合は通常の四球として扱い、同一塁に2人いることを防ぎます。' },
      ],
    },

    privacy: {
      title: 'データとプライバシー',
      desc: 'このシステムは未成年の個人情報を扱います。以下の保護措置はすでに実装されています。',
      points: [
        'すべての業務 API は認証必須。選手ロールは読み取り専用で、作成・変更できません。',
        'アップロードした写真は静的ディレクトリ外に置かれ、ログイン後のみアクセス可能。ファイル名は16バイトの暗号学的乱数で、推測も列挙も不可能です。',
        'アップロードはファイルヘッダで実体を判定するため、拡張子偽装の実行ファイルは画像として通りません。',
        '選手の削除や写真の変更では、ディスク上のファイルも同時に削除され、残骸は残りません。',
        'データベースは WAL モードで外部キー制約が有効、書き込みはトランザクションで保護されます。',
        '本番環境では CORS_ORIGINS のホワイトリストを設定し、任意のオリジンからのAPI呼び出しを防ぎましょう。',
        '初期アカウント admin / admin は初回ログイン専用です。「設定」で実管理者を作成し、初期アカウントを無効にしてください。',
      ],
    },

    faq: {
      title: 'よくある質問',
      items: [
        { q: '統計がすべて0のままです', a: '統計は実際の打席記録から算出されます。まず試合を作り、少なくとも1打席を記録してください。' },
        { q: 'スコアボタンが押せません / 見えません', a: '試合の状態が「進行中」（「試合」ページの「開始」）で、監督または管理者のロールである必要があります。選手は読み取り専用です。' },
        { q: '得点が合わない sensaciónです', a: '得点はサーバーが打席結果から完全に導出します。フロント側では計算していません。同じ結果ボタンを二度タップしていないか確認してください（連打防止のため一時的に無効化されます）。' },
        { q: '打点が得点より少ないのはなぜ？', a: '公式の定義です。満塁本塁打は4得点でも打点3 —— 打者自身の得点は打点に含めません。' },
        { q: '代打のあと打順が乱れました', a: '代打・代走は「代打・代走」パネルの履歴に記録されますが、打順は自動的に変わりません。赛前に決まったものです。変更が必要な場合は「編集用に解除」を使ってください。' },
        { q: '投手の投球数を数えるには？', a: 'スコア入力ページで記録した投球列は打席ごとに保存されます。投球回数はアウト数から換算（3アウト=1回）され、ERA と WHIP は「統計」ページで確認できます。' },
        { q: '言語を切り替えても一部が中国語のままです', a: '守備位置など一部の表記は元の定数テーブルから来ています。切り替わらない語があれば、どのページのどれかを教えてください。' },
        { q: 'データのバックアップ方法は？', a: 'データベースは server/data/baseball.db です（WAL モードでは .db-wal / .db-shm もあります）。3つともコピーするか、サーバーを停止してから本体だけをコピーしてください。' },
      ],
    },
  },
}
