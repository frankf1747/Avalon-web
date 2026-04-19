# 阿瓦隆 Web App — Claude Code 完整实现方案

## 技术栈

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS + 自定义中世纪主题
- **Routing:** React Router v6
- **State:** Zustand
- **Backend:** Firebase Firestore (Realtime) + Firebase Auth (Anonymous)
- **Hosting:** Netlify (前端) + Firebase (数据库)
- **Audio:** HTML5 Audio API（播放 AI 生成的语音文件）
- **动画:** Framer Motion（角色卡翻转、阶段过渡）

---

## 项目结构

```
avalon-app/
├── public/
│   └── audio/
│       ├── evil_open.mp3        # 请坏人睁眼
│       ├── evil_close.mp3       # 请闭眼
│       ├── merlin_open.mp3      # 请梅林睁眼
│       ├── merlin_close.mp3
│       ├── percival_open.mp3
│       ├── percival_close.mp3
│       ├── all_open.mp3         # 所有人睁眼，游戏开始
│       └── countdown.mp3        # 321倒计时
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── firebase.js              # Firebase 初始化
│   ├── store/
│   │   └── useGameStore.js      # Zustand 全局状态
│   ├── hooks/
│   │   ├── useRoom.js           # 房间 Firestore 监听
│   │   ├── usePlayerSecret.js   # 读取自己的身份
│   │   └── useNightAudio.js     # 夜晚语音队列播放
│   ├── constants/
│   │   ├── roles.js             # 角色定义、说明、图标
│   │   ├── questConfig.js       # 每人数任务人数配置
│   │   └── nightScript.js       # 动态生成夜晚步骤
│   ├── utils/
│   │   ├── assignRoles.js       # 角色随机分配逻辑
│   │   └── gameLogic.js         # 胜负判断、阶段推进
│   ├── pages/
│   │   ├── Home.jsx             # 创建/加入房间
│   │   ├── Lobby.jsx            # 大厅、配置角色
│   │   ├── RoleReveal.jsx       # 私密身份查看（含卡牌翻转）
│   │   ├── NightGuide.jsx       # 夜晚引导（房主播放）
│   │   ├── Game.jsx             # 游戏主界面（手机端）
│   │   ├── RefereeScreen.jsx    # iPad 裁判大屏
│   │   ├── LadyOfLake.jsx       # 湖中女神（可选）
│   │   └── EndGame.jsx          # 结算页面
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── CountdownTimer.jsx
│   │   ├── lobby/
│   │   │   ├── PlayerList.jsx
│   │   │   ├── RoleSelector.jsx  # 角色配置 + 说明tooltip
│   │   │   └── RoleInfoCard.jsx  # 每个角色详情展示
│   │   ├── role-reveal/
│   │   │   ├── RoleCard.jsx      # 3D 翻转卡牌组件
│   │   │   ├── CardFront.jsx     # 卡背（阿瓦隆纹章）
│   │   │   └── CardBack.jsx      # 角色插画 + 名称 + 说明
│   │   ├── game/
│   │   │   ├── QuestTracker.jsx  # 5个任务进度条
│   │   │   ├── TeamNomination.jsx
│   │   │   ├── VotePanel.jsx     # 赞成/反对投票
│   │   │   ├── MissionVote.jsx   # 任务成功/失败（队员）
│   │   │   ├── VoteHistory.jsx   # 历史投票记录
│   │   │   └── RejectedCounter.jsx # 连续拒绝计数
│   │   ├── referee/
│   │   │   ├── PhaseDisplay.jsx  # 当前阶段大字显示
│   │   │   ├── PlayerOrderRing.jsx # 玩家顺序环形排列
│   │   │   ├── QuestBoard.jsx    # 5轮任务状态面板
│   │   │   ├── VoteStatusGrid.jsx # 实时投票状态
│   │   │   ├── RejectionTrack.jsx # 连续拒绝进度条
│   │   │   └── EventLog.jsx      # 实时事件流
│   │   └── night/
│   │       ├── NightStep.jsx     # 单步引导显示
│   │       └── AudioPlayer.jsx   # 语音播放控制
└── index.html
```

---

## Firebase 数据结构

### `rooms/{roomId}`
```json
{
  "hostUid": "string",
  "phase": "lobby | roleReveal | night | nominate | vote | mission | missionResult | lady | assassin | end",
  "players": {
    "{uid}": {
      "name": "string",
      "isHost": true,
      "isReady": false,
      "order": 0
    }
  },
  "config": {
    "roles": ["merlin", "assassin", "percival", "morgana", "mordred"],
    "useLadyOfLake": false
  },
  "game": {
    "currentQuest": 0,
    "currentLeaderIndex": 0,
    "rejectedCount": 0,
    "ladyHolderUid": null,
    "usedLadyUids": [],
    "nominatedTeam": [],
    "winner": null
  },
  "quests": [
    {
      "index": 0,
      "requiredPlayers": 2,
      "team": [],
      "approveVotes": {},
      "missionVotes": {},
      "result": null,
      "rejections": []
    }
  ],
  "assassinTarget": null,
  "createdAt": "timestamp"
}
```

### `secrets/{roomId}_{uid}`
```json
{
  "role": "merlin",
  "visibleEvilUids": ["uid2", "uid3"],
  "visibleAsPercival": ["uid1", "uid4"],
  "description": "你是梅林。你知道所有坏人（莫德雷德除外）。游戏结束时，刺客将尝试猜出你的身份。",
  "youCanSee": "坏人（莫德雷德除外）"
}
```

---

## 常量定义

### `src/constants/roles.js`
```js
export const ROLES = {
  merlin:   { name: "梅林",   side: "good", description: "知道所有坏人（莫德雷德除外）。若被刺客猜中，好人失败。" },
  percival: { name: "派西维尔", side: "good", description: "看到梅林与莫甘娜举手，但不知道谁是谁。" },
  loyal:    { name: "忠臣",   side: "good", description: "普通好人，无特殊能力。" },
  mordred:  { name: "莫德雷德", side: "evil", description: "梅林看不到他。坏人互相认识。" },
  morgana:  { name: "莫甘娜",  side: "evil", description: "在派西维尔眼中伪装成梅林。坏人互相认识。" },
  assassin: { name: "刺客",   side: "evil", description: "好人赢得3任务后，可尝试刺杀梅林。" },
  oberon:   { name: "奥伯伦",  side: "evil", description: "不参与坏人夜晚互认，坏人也不认识他。" },
  minion:   { name: "爪牙",   side: "evil", description: "普通坏人，与其他坏人互相认识（奥伯伦除外）。" },
}

export const STANDARD_SETUPS = {
  5:  { good: 3, evil: 2, suggested: ["merlin","percival","loyal","morgana","assassin"] },
  6:  { good: 4, evil: 2, suggested: ["merlin","percival","loyal","loyal","morgana","assassin"] },
  7:  { good: 4, evil: 3, suggested: ["merlin","percival","loyal","loyal","mordred","morgana","assassin"] },
  8:  { good: 5, evil: 3, suggested: ["merlin","percival","loyal","loyal","loyal","mordred","morgana","assassin"] },
  9:  { good: 6, evil: 3, suggested: ["merlin","percival","loyal","loyal","loyal","loyal","mordred","morgana","assassin"] },
  10: { good: 6, evil: 4, suggested: ["merlin","percival","loyal","loyal","loyal","loyal","mordred","morgana","assassin","minion"] },
}
```

### `src/constants/questConfig.js`
```js
// [quest1, quest2, quest3, quest4*, quest5]  *第4局双失败规则(7人+)
export const QUEST_PLAYER_COUNT = {
  5:  [2, 3, 2, 3, 3],
  6:  [2, 3, 4, 3, 4],
  7:  [2, 3, 3, 4, 4],
  8:  [3, 4, 4, 5, 5],
  9:  [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}
export const DOUBLE_FAIL_REQUIRED = [7, 8, 9, 10] // 第4任务需2票失败
```

---

## 核心逻辑

### `src/utils/assignRoles.js`
```
1. 从 config.roles 数组随机 shuffle
2. 按 players 的 order 字段分配
3. 为每个玩家计算 visibleEvilUids（根据角色规则）
4. 批量写入 secrets/{roomId}_{uid}（每条文档单独写，其他人无读取权限）
5. 更新 room.phase = "roleReveal"
```

### `src/utils/gameLogic.js`
```
- advanceLeader(room): currentLeaderIndex = (current + 1) % playerCount
- checkQuestResult(missionVotes, questIndex, playerCount): 
    判断失败票数（第4任务双失败规则）
- checkWinCondition(quests): 
    好人胜: 成功任务 >= 3
    坏人胜: 失败任务 >= 3 或 rejectedCount >= 5
- buildNightSteps(roles, players):
    根据本局角色动态生成夜晚步骤数组
```

---

## 夜晚引导

### `src/constants/nightScript.js`
```js
// 根据实际角色动态生成步骤
export function buildNightSteps(activeRoles) {
  const steps = []
  steps.push({ text: "请所有人闭眼", audio: "all_close.mp3", countdown: 3 })

  const evilRoles = activeRoles.filter(r => r.side === "evil")
  const hasOberon = activeRoles.some(r => r.id === "oberon")
  const hasMordred = activeRoles.some(r => r.id === "mordred")
  const hasMorgana = activeRoles.some(r => r.id === "morgana")
  const hasPercival = activeRoles.some(r => r.id === "percival")

  // 坏人互认（奥伯伦除外）
  const evilLabel = hasOberon ? "坏人（奥伯伦除外）" : "坏人"
  steps.push({ text: `请${evilLabel}睁眼，互相确认身份`, audio: "evil_open.mp3", countdown: 5 })
  steps.push({ text: `请${evilLabel}闭眼`, audio: "evil_close.mp3", countdown: 3 })

  // 梅林
  const merlinSeeLabel = hasMordred ? "坏人（莫德雷德除外）" : "坏人"
  steps.push({ text: `请梅林睁眼，请${merlinSeeLabel}竖起大拇指`, audio: "merlin_open.mp3", countdown: 5 })
  steps.push({ text: "梅林请闭眼，请坏人放下手指", audio: "merlin_close.mp3", countdown: 3 })

  // 派西维尔（如有）
  if (hasPercival) {
    const percivalSeeLabel = hasMorgana ? "梅林与莫甘娜" : "梅林"
    steps.push({ text: `请派西维尔睁眼，请${percivalSeeLabel}竖起大拇指`, audio: "percival_open.mp3", countdown: 5 })
    steps.push({ text: "派西维尔请闭眼，请放下手指", audio: "percival_close.mp3", countdown: 3 })
  }

  steps.push({ text: "所有人睁眼，游戏开始！", audio: "all_open.mp3", countdown: 0 })
  return steps
}
```

### `src/hooks/useNightAudio.js`
```
- 维护 currentStepIndex 状态
- 每步自动播放对应 audio 文件
- 倒计时结束后自动进入下一步（或等待手动点击）
- 最后一步完成后，房主写入 phase = "nominate"
```

---

## 游戏主界面各阶段

### `nominate` — 队长提名
- 只有当前队长可操作
- 显示本轮任务所需人数
- 点击玩家头像选人，确认提交写入 `nominatedTeam`
- phase → `vote`

### `vote` — 全体投票
- 所有玩家提交 赞成👍 / 反对👎
- 全部提交后同时揭晓结果（赞成多则通过）
- 通过 → phase = `mission`
- 拒绝 → rejectedCount++，换队长，rejectedCount >= 5 → 坏人胜

### `mission` — 任务投票
- 仅队员可见投票界面
- 好人只能投成功，坏人可投成功或失败
- 全部提交后洗牌显示结果（显示几个失败，不显示是谁）
- 写入任务结果，检查胜负
- 如启用湖中女神且条件满足 → phase = `lady`，否则 → 下一轮 `nominate`

### `lady` — 湖中女神（可选）
- 当前持有者选择一名玩家查验
- 私密显示结果（好人/坏人）
- 更新 ladyHolderUid，女神令牌转移

### `assassin` — 刺客刺杀
- 仅刺客玩家可操作
- 选择一名玩家猜测为梅林
- 提交后揭晓所有身份，宣布结果

---

---

## 角色卡翻转系统（手机端）

### 设计目标
每位玩家在身份查看阶段看到一张戏剧性翻转的角色插画卡，增强代入感。

### 角色插画规格
```
public/images/roles/
  ├── merlin.png        # 梅林 — 白袍老者，手持法杖，蓝色星光
  ├── percival.png      # 派西维尔 — 年轻骑士，银色盔甲
  ├── loyal.png         # 忠臣 — 金色盾牌骑士
  ├── mordred.png       # 莫德雷德 — 黑甲反派，红色眼睛
  ├── morgana.png       # 莫甘娜 — 黑袍女巫，紫色火焰
  ├── assassin.png      # 刺客 — 蒙面暗影刺客
  ├── oberon.png        # 奥伯伦 — 孤狼，森林中的幽灵
  ├── minion.png        # 爪牙 — 黑甲士兵
  └── card-back.png     # 卡背 — 阿瓦隆纹章（金色盾徽+深蓝底）
```
> 建议用 Midjourney 或 Adobe Firefly 生成，风格 prompt：
> *"Avalon board game character, medieval dark fantasy, oil painting style, dramatic lighting, portrait format, dark background"*

### RoleCard.jsx — 3D 翻转实现
```jsx
// 使用 Framer Motion + CSS perspective 实现卡牌翻转
// 流程：
// 1. 进入页面 → 显示卡背（阿瓦隆纹章）
// 2. 玩家点击「查看身份」→ 触发翻转动画（0.8s）
// 3. 翻转后显示角色插画 + 角色名（金色大字）+ 阵营标签 + 详细说明
// 4. 底部显示「我已记住，确认」按钮
// 5. 确认后卡牌翻回正面（保护隐私），写入 player.isReady = true

const cardVariants = {
  front: { rotateY: 0 },
  back:  { rotateY: 180 }
}
// 整个卡片容器设置 perspective: 1000px
// 两面绝对定位，backface-visibility: hidden
```

### 卡片内容布局（翻开后）
```
┌─────────────────────────┐
│   [角色插画 全幅]         │
│                         │
│                         │
├─────────────────────────┤
│  ✦ 梅林  [好人]          │  ← 金色大字 + 阵营色标签
├─────────────────────────┤
│ 你知道所有坏人身份        │  ← 能力简述
│ （莫德雷德除外）          │
│                         │
│ 你能看到：               │
│ 坏人（莫德雷德除外）      │  ← 动态生成，基于本局配置
│                         │
│ 注意：若好人胜利，         │
│ 刺客将尝试猜出你的身份    │
├─────────────────────────┤
│    [✓ 我已记住，确认]     │
└─────────────────────────┘
```

---

## iPad 裁判大屏（RefereeScreen）

### 进入方式
- 首页新增「以裁判身份加入」按钮
- 输入房间码后进入裁判视图（只读，不参与游戏）
- URL 路由：`/room/:roomId/referee`
- 自动检测屏幕宽度 ≥ 768px 时启用横屏布局

### 屏幕布局（iPad 横屏 1024×768）

```
┌────────────────────────────────────────────────────────────┐
│  ⚔ AVALON        房间: AB12CD        阶段: 队长提名  第3轮  │  ← 顶部状态栏
├──────────────────┬─────────────────────┬───────────────────┤
│                  │                     │                   │
│  玩家顺序         │   任务追踪器          │   投票状态         │
│                  │                     │                   │
│  ① 张三 👑队长   │  ✓ ✓ ? ? ?         │  张三  ✓ 已投      │
│  ② 李四          │  Q1  Q2  Q3  Q4  Q5 │  李四  ✓ 已投      │
│  ③ 王五 ⚔提名中  │                     │  王五  … 等待      │
│  ④ 赵六          │  当前任务需要 3 人    │  赵六  … 等待      │
│  ⑤ 陈七          │  已提名: 王五, 陈七   │  陈七  … 等待      │
│  ⑥ 林八          │                     │                   │
│                  │  连续拒绝: ██░░░     │                   │
│                  │           2 / 5     │                   │
├──────────────────┴─────────────────────┴───────────────────┤
│  事件日志                                                    │
│  [14:23] 张三 提名了 王五、陈七 出任务                        │
│  [14:21] 第2轮任务：成功 ✓ （0票失败）                       │
│  [14:18] 投票结果：5赞成 / 1反对 → 通过                      │
└────────────────────────────────────────────────────────────┘
```

### 各组件说明

**PhaseDisplay** — 顶部状态栏
- 当前阶段中文名（队长提名 / 全体投票 / 执行任务 / 刺杀梅林…）
- 当前轮次、房间码
- 实时 Firestore 监听，阶段变化时有过渡动画

**PlayerOrderRing / PlayerList** — 玩家顺序
- 显示所有玩家，带编号
- 👑 图标标记当前队长
- ⚔ 图标标记被提名出任务的玩家
- 绿色高亮当前操作玩家

**QuestBoard** — 任务追踪器
- 5个任务格子：✓成功（金色）/ ✗失败（暗红）/ ?未完成（灰色）
- 显示每轮所需人数
- 当前任务格子发光高亮
- 显示已提名队员名字

**RejectionTrack** — 连续拒绝追踪
- 5格进度条，每次拒绝填充一格
- 第5格变红并闪烁警告

**VoteStatusGrid** — 投票状态
- 全体投票阶段：显示每人是否已投（✓已投 / …等待），不透露投票内容
- 投票揭晓后：显示每人 赞成👍 / 反对👎
- 任务阶段：显示几人已提交（不透露内容）

**EventLog** — 事件日志
- 实时滚动显示游戏事件流
- 写入时机：提名、投票结果、任务结果、湖中女神查验、阶段变更
- 格式：`[时间] 事件描述`

### Firestore 事件写入
```js
// rooms/{roomId}/events（子集合）
{
  timestamp: serverTimestamp(),
  type: "nomination" | "voteResult" | "missionResult" | "ladyResult" | "phaseChange",
  message: "张三 提名了 王五、陈七 出任务",
  data: { ... }  // 原始数据，供裁判屏解析
}
```

---

## 结算页面

- 显示胜利方（好人/坏人）及原因
- 揭示所有玩家身份
- 5轮任务结果回顾
- 完整投票历史
- 「再来一局」按钮（重置游戏数据，保留玩家）

---

## Firebase Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
    match /secrets/{docId} {
      // docId 格式: {roomId}_{uid}
      allow read: if request.auth != null && 
                     docId.split("_")[1] == request.auth.uid;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Netlify 部署配置

### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 环境变量（Netlify Dashboard 设置）
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

## Claude Code 实现指令（按顺序执行）

```
Step 1: 初始化项目
  - npm create vite@latest avalon-app -- --template react
  - 安装依赖: tailwindcss, zustand, firebase, react-router-dom
  - 配置 tailwind.config.js（深色中世纪主题色）
  - 创建 firebase.js（从环境变量初始化）

Step 2: 常量与工具函数
  - 创建 src/constants/roles.js
  - 创建 src/constants/questConfig.js
  - 创建 src/constants/nightScript.js（buildNightSteps 函数）
  - 创建 src/utils/assignRoles.js
  - 创建 src/utils/gameLogic.js

Step 3: 房间系统
  - 创建 src/hooks/useRoom.js（Firestore 实时监听）
  - 实现 Home.jsx（创建房间生成6位码，匿名登录，加入房间）

Step 4: 大厅
  - 实现 Lobby.jsx
  - 实现 RoleSelector.jsx（角色配置，含说明tooltip，湖中女神开关）
  - 实现 PlayerList.jsx

Step 5: 身份分配与查看
  - 实现 assignRoles.js 完整逻辑
  - 实现 RoleReveal.jsx（私密身份卡，含角色详情，点击确认）

Step 6: 夜晚引导
  - 实现 useNightAudio.js（步骤队列 + 语音播放）
  - 实现 NightGuide.jsx（房主视角播放，其他玩家显示等待画面）

Step 7: 游戏主循环
  - 实现 Game.jsx（phase 路由分发）
  - 实现 TeamNomination.jsx
  - 实现 VotePanel.jsx（同步揭晓）
  - 实现 MissionVote.jsx
  - 实现 QuestTracker.jsx
  - 实现 VoteHistory.jsx
  - 实现 RejectedCounter.jsx

Step 8: 可选模块
  - 实现 LadyOfLake.jsx

Step 9: 结算
  - 实现 EndGame.jsx（含全身份揭示、投票历史）

Step 9: 结算 + 历史记录
  - 实现 EndGame.jsx（含全身份揭示、投票历史）

Step 10: 角色卡插画系统
  - 准备 8 张角色插画 + 1 张卡背（见插画规格）
  - 实现 RoleCard.jsx（Framer Motion 3D 翻转）
  - 实现 CardFront.jsx / CardBack.jsx
  - 集成进 RoleReveal.jsx

Step 11: iPad 裁判大屏
  - 实现 RefereeScreen.jsx（横屏布局）
  - 实现 PhaseDisplay.jsx
  - 实现 PlayerOrderRing.jsx
  - 实现 QuestBoard.jsx
  - 实现 VoteStatusGrid.jsx
  - 实现 RejectionTrack.jsx
  - 实现 EventLog.jsx（Firestore events 子集合监听）
  - 首页添加「以裁判身份加入」入口

Step 12: UI 精修
  - 统一中世纪主题样式
  - 投票蜡封动画
  - 移动端适配（max-w-md, 竖屏锁定）
  - iPad 横屏适配（min-w-768px 横屏布局）
  - 阶段切换过渡动画（Framer Motion）
```

---

## 给 Claude Code 的启动 Prompt

> 请按照以下规范创建一个名为 `avalon-app` 的 React + Vite 项目。这是一个线下桌游《阿瓦隆》的手机端辅助 Web App，使用 Firebase Firestore 实现多设备实时联机，Netlify 部署。界面语言为中文，移动端优先（max-width: 430px），同时支持 iPad 横屏裁判大屏（min-width: 768px）。主题为深色中世纪风格，主色调：深夜蓝 #1a1a2e、金色 #c9a84c、暗红 #8b1a1a，字体使用 Noto Serif SC。安装依赖包含 framer-motion（用于角色卡3D翻转动画）。请从 Step 1 开始，完成所有步骤，每步完成后告知进度。
