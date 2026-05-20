# 水浒英雄传 - Code Wiki

## 项目概述

**水浒英雄传** 是一个基于《水浒传》古典名著的水浒108将集卡游戏 web 应用。玩家通过知识问答挑战解锁《水浒传》中的108位英雄人物，收集卡片并解锁各种成就。

### 核心特性

- **108位水浒英雄卡片**：包含36天罡星和72地煞星
- **问答解锁机制**：每张卡片需要连续答对对应题目数量才能解锁
- **无尽挑战模式**：解锁全部108将后开启的无限答题模式
- **成就系统**：收集类、答题类、无尽挑战类、特殊荣誉类四大类成就
- **拼音注音**：为汉字添加拼音标注，便于学习
- **主题切换**：支持浅色/深色模式

---

## 项目架构

```
mingzhu-heroes/
├── index.html              # 主入口页面
├── THEME.md                # 主题设计文档
├── assets/
│   └── img/
│       ├── portraits/       # 英雄立绘图片
│       │   └── 新版立绘/    # 各英雄头像
│       ├── locked-hero.png  # 未解锁卡片占位图
│       └── wechat-reward.png # 打赏二维码
├── css/                    # 样式文件
│   ├── theme.css           # 主题基础样式
│   ├── card.css            # 卡片样式
│   ├── card-detail.css     # 卡片详情弹窗样式
│   ├── layout.css          # 页面布局样式
│   ├── quiz.css            # 问答系统样式
│   ├── achievements.css    # 成就系统样式
│   └── footer.css          # 页脚样式
└── js/                     # JavaScript 模块
    ├── app.js              # 主入口/应用初始化
    ├── data.js             # 108将数据
    ├── card.js             # 英雄卡片组件
    ├── quiz.js             # 问答系统/无尽挑战/图鉴/成就
    ├── unlock.js           # 解锁状态管理
    ├── achievements.js      # 完整成就系统 (V2)
    ├── hero-summaries.js   # 英雄一句话简介
    └── pinyin-helper.js    # 拼音注音助手
```

---

## 模块职责

### 核心模块依赖关系

```
index.html
    │
    ├─> js/data.js (英雄数据)
    │
    ├─> js/unlock.js (状态管理)
    │       └─> 依赖: data.js
    │
    ├─> js/pinyin-helper.js (拼音助手)
    │
    ├─> js/hero-summaries.js (简介数据)
    │
    ├─> js/card.js (卡片组件)
    │       ├─> 依赖: unlock.js
    │       └─> 依赖: quiz.js (QuizManager)
    │
    ├─> js/quiz.js (多系统管理器)
    │       ├─> QuizManager - 问答挑战系统
    │       ├─> EndlessManager - 无尽挑战系统
    │       ├─> CollectionManager - 图鉴系统
    │       └─> AchievementManager - 基础成就系统
    │       └─> 依赖: unlock.js, data.js, hero-summaries.js
    │
    ├─> js/achievements.js (高级成就系统)
    │       ├─> AchievementManagerV2 - 完整成就系统
    │       ├─> TitleManager - 称号管理
    │       ├─> StatsManager - 统计数据管理
    │       └─> 依赖: unlock.js, data.js
    │
    └─> js/app.js (主应用)
            ├─> 依赖: 所有其他模块
            ├─> 卡片渲染与排序
            ├─> 详情弹窗管理
            └─> 进度条与头部按钮
```

---

## 数据结构

### 英雄数据 (heroesData.shuipo)

每个英雄对象包含以下字段：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `rank` | number | 座次（1-108） | `1` |
| `star` | string | 星位名称 | `"天魁星"` |
| `nickname` | string | 绰号 | `"呼保义"` |
| `name` | string | 姓名 | `"宋江"` |
| `portrait` | string | 立绘图片路径 | `"assets/img/portraits/新版立绘/宋江.jpg"` |
| `rarity` | number | 稀有度（恒为5） | `5` |
| `stats` | object | 四维属性 | `{ 武力: 35, 义气: 98, 智谋: 85, 胆识: 80 }` |
| `overallStars` | number | 综合星级（1-5） | `5` |
| `position` | string | 梁山职务 | `"总兵都头领"` |
| `weapon` | string | 武器 | `"日月星辰旗，混元河双剑"` |
| `skill` | string | 必杀技 | `"风云际会，玄天混元阵"` |
| `story` | string | 生平事迹（长文本） | `"刀笔精通，吏道纯熟..."` |
| `ending` | string | 结局 | `"平方腊后封楚州安抚使..."` |

### 解锁状态数据

使用 localStorage 持久化存储：

```javascript
// 存储键名
const STORAGE_KEY = 'shuihu_unlocked_heroes';

// 存储格式
["宋江", "卢俊义", "吴用", ...] // 已解锁的英雄名称数组
```

### 成就数据

```javascript
// 存储键名
const ACHIEVEMENT_STORAGE_KEY = 'shuihu_achievements_v2';
const STATS_STORAGE_KEY = 'shuihu_stats';
const TITLE_STORAGE_KEY = 'shuihu_current_title';

// 已获得成就
["gathering_10", "gathering_30", "perfect_unlock", ...]

// 统计数据
{
  "totalCorrect": 150,      // 累计答对题数
  "totalFailures": 45,      // 累计失败次数
  "endlessMaxStreak": 30,   // 无尽最高连胜
  "perfectUnlock": 3,        // 完美解锁次数
  // ... 更多统计字段
}
```

---

## 关键类与函数

### UnlockManager (unlock.js)

管理英雄卡片的解锁状态。

```javascript
window.UnlockManager = {
    isUnlocked(name)        // 检查是否已解锁
    unlock(name)             // 解锁英雄卡片
    getUnlockedCount()      // 获取已解锁数量
    getTotalCount()         // 获取总数（108）
    getProgress()            // 获取解锁进度百分比
    getAllUnlocked()         // 获取所有已解锁英雄名称数组
    reset()                  // 重置解锁进度（调试用）
}
```

**事件机制**：解锁成功时触发 `heroUnlocked` 自定义事件：

```javascript
window.addEventListener('heroUnlocked', (e) => {
    console.log('解锁了:', e.detail.name);
});
```

---

### HeroCard (card.js)

卡片组件类，负责渲染单张英雄卡片。

```javascript
class HeroCard {
    constructor(hero, options = {})
    
    createCard()             // 创建卡片 DOM 元素
    renderFront()            // 渲染卡片正面（图片+信息）
    renderBack()             // 渲染卡片背面（详情）
    refreshCard()            // 刷新卡片内容（解锁后）
    numberToChinese(num)     // 数字转中文（1→一）
}
```

**卡片正面显示**：
- 已解锁：显示英雄立绘 + 星级 + 绰号/姓名 + 座次
- 未解锁：显示锁定占位图 + "天罡地煞 待解锁"

**卡片背面显示**：
- 职务、武器、必杀技
- 生平事迹（带拼音）
- 结局（带拼音）

---

### QuizManager (quiz.js)

问答挑战系统，管理英雄解锁的知识问答流程。

```javascript
window.QuizManager = {
    showQuiz(hero)           // 入口：显示英雄介绍面板
    startChallenge()         // 开始答题挑战
    showQuestion(index)      // 显示指定题目
    handleChallengeAnswer(selectedIndex)  // 处理答题结果
    retryChallenge()         // 重新挑战
    closeIntro()             // 关闭介绍面板
    closeChallenge()         // 关闭答题面板
}
```

**题型生成器**（6种）：

| 函数 | 题型 | 示例 |
|------|------|------|
| `genNicknameQuestion(hero)` | 绰号题 | `"呼保义"是谁的绰号？` |
| `genWeaponQuestion(hero)` | 武器题 | `谁使用"日月星辰旗"？` |
| `genPositionQuestion(hero)` | 职务题 | `谁担任"总兵都头领"？` |
| `genStarQuestion(hero)` | 星位题 | `"天魁星"对应谁？` |
| `genEndingQuestion(hero)` | 结局题 | `"平方腊后封楚州安抚使"是谁的结局？` |
| `genStoryQuestion(hero)` | 事迹题 | `"智取生辰纲"描述的是谁？` |

**题目生成规则**：
- 每位英雄需连续答对 `overallStars` 道题才能解锁
- 题目混合：目标英雄 40% + 其他英雄 60%
- 干扰项优先选择同星级英雄

---

### EndlessManager (quiz.js)

无尽挑战模式，全部108将解锁后开放。

```javascript
window.EndlessManager = {
    showEndless()            // 显示无尽挑战入口
    showEndlessQuestion()    // 显示无尽题目
    handleEndlessAnswer(selectedIndex, question)  // 处理答题
    closeEndless()           // 关闭无尽模式
}
```

**计分规则**：
- 答对：+10 分
- 连对加成：3题 +50，5题 +100，10题 +300
- 答错：游戏结束

**localStorage 存储**：
```javascript
const ENDLESS_HIGHSCORE_KEY = 'shuihu_endless_highscore';
```

---

### CollectionManager (quiz.js)

图鉴系统，浏览所有英雄的收集界面。

```javascript
window.CollectionManager = {
    showCollection()          // 显示图鉴弹窗
    renderCollectionGrid()    // 渲染图鉴网格
    closeCollection()         // 关闭图鉴
}
```

**Tab 分类**：
- 全部 / 天罡星（36位）/ 地煞星（72位）

---

### AchievementManagerV2 (achievements.js)

完整的成就系统（V2版本），包含39个成就。

```javascript
window.AchievementManagerV2 = {
    ACHIEVEMENTS              // 成就定义数组
    BADGE_LEVEL               // 徽章等级定义
    
    loadAchievements()        // 从 localStorage 加载已获得成就
    saveAchievements(list)   // 保存成就到 localStorage
    checkAchievements()      // 检查并触发新成就
    showAchievementToast(ach) // 显示成就通知
    showAll()                // 显示成就弹窗
    renderAchievementList(filter) // 渲染成就列表
    closeAchievement()       // 关闭成就弹窗
}
```

**成就分类**（4大类）：

| 分类 | 数量 | 示例 |
|------|------|------|
| 收集类 (collection) | 12个 | 天罡归位、地煞齐聚、全108将 |
| 答题类 (quiz) | 10个 | 累计答对500题、百折不挠 |
| 无尽挑战类 (endless) | 13个 | 连续答对100题、天下无敌 |
| 特殊荣誉 (special) | 8个 | 及时雨、鼓上蚤 |

**徽章等级**：

| 等级 | 图标 | 颜色 |
|------|------|------|
| Bronze（铜） | 🥉 | `#CD7F32` |
| Silver（银） | 🥈 | `#C0C0C0` |
| Gold（金） | 🥇 | `#FFD700` |

---

### StatsManager (achievements.js)

游戏统计数据管理器。

```javascript
window.StatsManager = {
    get(key)                 // 获取统计数据
    set(key, value)          // 设置统计数据
    increment(key, delta)   // 增加统计数据
    
    recordAnswer(correct, timeSpent)  // 记录答题
    recordFailure(heroName)  // 记录失败
    recordUnlock(heroName, perfect, noHint)  // 记录解锁
    recordEndless(score, perfect)  // 记录无尽挑战
}
```

---

### TitleManager (achievements.js)

称号系统，每个成就关联一个水浒风格的称号。

```javascript
window.TitleManager = {
    getCurrentTitle()        // 获取当前称号
    setCurrentTitle(titleId) // 设置当前称号
    getAvailableTitles()     // 获取所有可用称号
    getTitleDisplay()        // 获取称号显示信息
}
```

---

### PinyinHelper (pinyin-helper.js)

拼音注音助手，为汉字添加拼音标注。

```javascript
class PinyinHelper {
    async load()             // 动态加载 pinyin-pro 库
    isChinese(char)          // 判断是否为汉字
    annotateText(text, options) // 为文本添加拼音标注
    
    available                // 库是否可用
    ready                   // 库是否已加载
}
```

**使用方式**：
```javascript
// 为文本添加拼音标注
const html = pinyinHelper.annotateText("宋江是梁山泊的总兵都头领");
// 返回: <ruby class="pinyin-char">宋<rt>sòng</rt></ruby><ruby class="pinyin-char">江<rt>jiāng</rt></ruby>...
```

---

### App (app.js)

主应用入口，负责应用初始化和全局协调。

```javascript
// 主要函数
function init()                       // 应用初始化
function renderCards(grid, sortMode)  // 渲染卡片（支持筛选模式）
function shuffleArray(array)           // Fisher-Yates 洗牌算法
function sortByUnlockedFirst(heroes, sortBy) // 排序：已解锁优先

// 筛选函数
function toggleUnlockedFilter()       // 切换已解锁筛选模式
function toggleLockedFilter()         // 切换未解锁筛选模式

// 快速导航
function getCardCountPerPage()        // 根据屏幕宽度获取每页卡片数
function calculatePages()             // 计算总页数
function scrollToPage(pageNum)        // 滚动到指定页码

// UI 创建
function createPinyinToggle()          // 创建拼音/深色模式切换按钮
function createDetailOverlay()        // 创建详情弹窗容器
function createProgressBar()           // 创建进度条
function createHeaderButtons()         // 创建头部功能按钮
function createQuickNavigation()       // 创建移动端快速导航栏

// 弹窗管理
function showCardDetail(hero)         // 显示卡片详情
function closeCardDetail()             // 关闭详情弹窗
function showFrontImageModal(src, name) // 显示大图模态框
function closeFrontImageModal()        // 关闭大图模态框
```

**排序模式**：
| 模式 | 说明 |
|------|------|
| `random` | 随机排序（默认，盲盒感） |
| `rank` | 按座次排序（已解锁在前） |
| `martial` | 按武力值排序（已解锁在前） |
| `star` | 按星级排序（已解锁在前） |

**筛选模式**（移动端快速导航）：
| 模式 | 说明 |
|------|------|
| `all` | 显示全部英雄（默认） |
| `unlocked` | 只显示已解锁英雄，按星级降序排序 |
| `locked` | 只显示未解锁英雄，随机排序 |

**快速导航功能**：
- 移动端显示在页面顶部的固定导航栏
- 包含「‹」上一页、「已解锁」、页码指示器、「未解锁」、「›」下一页
- 点击「已解锁」按钮：切换到已解锁英雄筛选模式
- 点击「未解锁」按钮：切换到未解锁英雄筛选模式
- 再次点击已激活的按钮：恢复显示全部英雄

---

## 工具函数 (quiz.js)

```javascript
// 随机选取
function randomPick(arr, n)           // 从数组中随机选取 n 个不重复元素

// 数组打乱
function shuffle(arr)                  // Fisher-Yates 洗牌

// 英雄操作
function getHeroes()                   // 获取所有英雄数组
function findHero(name)                // 按名称查找英雄
function isTiangang(hero)              // 判断是否为天罡星（1-36位）
function getHeroTeaser(hero)           // 获取英雄悬念描述

// 文本处理
function extractKeyPhrases(text)        // 从文本提取关键短语
function extractMeaningfulPhrase(text)  // 提取有意义的事件短语
function validateQuestion(question)     // 验证题目有效性
function starsDisplay(stars)            // 生成星级显示字符串

// 连胜管理
function getStreak()                    // 获取当前连胜数
function setStreak(val)                 // 设置连胜数
function getMaxStreak()                 // 获取历史最高连胜
function updateMaxStreak(val)           // 更新历史最高连胜
```

---

## CSS 模块

### 主题变量 (theme.css)

```css
:root {
    --古籍褐: #8B4513;      /* 主色调，边框、标题 */
    --鎏金: #DAA520;        /* 强调色，星级、印章 */
    --宣纸米: #F5F5DC;      /* 背景色 */
    --墨色: #2F4F4F;        /* 深色文字 */
    --朱砂: #8B0000;        /* 点缀色，印章、座次 */
    --浅米: #E8DCC0;        /* 卡片背景渐变 */
}
```

### 深色模式

```css
body.dark-mode {
    --宣纸米: #1a1a1a;
    --墨色: #e0e0e0;
    /* 其他颜色变量反转 */
}
```

---

## localStorage 数据汇总

| 键名 | 数据类型 | 说明 |
|------|----------|------|
| `shuihu_unlocked_heroes` | string[] | 已解锁英雄列表 |
| `shuihu_achievements` | string[] | V1成就（已废弃） |
| `shuihu_achievements_v2` | string[] | V2已获得成就 |
| `shuihu_stats` | object | 游戏统计数据 |
| `shuihu_current_title` | string | 当前称号ID |
| `shuihu_endless_highscore` | number | 无尽模式最高分 |
| `shuihu_streak` | number | 当前连胜数 |
| `shuihu_max_streak` | number | 历史最高连胜 |
| `shuihu_dark_mode` | string | 深色模式偏好 ("1" 或 "0") |

---

## 项目运行方式

### 环境要求

- 现代浏览器（Chrome、Firefox、Safari、Edge）
- 支持 ES6+ JavaScript
- 需要网络连接（加载 Google Fonts 和 pinyin-pro CDN）

### 运行方式

1. **本地直接打开**：直接用浏览器打开 `index.html` 文件
2. **本地服务器**（推荐，用于开发）：
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Node.js (npx)
   npx serve .
   
   # 然后访问 http://localhost:8080
   ```

### 外部依赖

| 依赖 | 用途 | CDN 地址 |
|------|------|----------|
| Google Fonts | 中文字体 | `fonts.googleapis.com` |
| pinyin-pro | 拼音注音 | `cdnjs.cloudflare.com` |

---

## 版本信息

- **当前版本**: v33（CSS/JS 文件版本参数）
- **最后更新**: 2026年5月

**最近更新内容**：
- 优化移动端快速导航栏功能
- 实现「已解锁」按钮筛选已解锁英雄并按星级排序
- 实现「未解锁」按钮筛选未解锁英雄
- 添加按钮高亮状态管理，清晰显示当前筛选模式

---

## 许可证

本项目为个人兴趣作品，非商业运营。《水浒传》为公共版权古典名著，人物与情节属于文化遗产。游戏内题目、卡片美术及程序为原创，仅供学习交流，严禁商用。
