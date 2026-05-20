/**
 * achievements.js - 成就系统（完整版）
 * 根据设计文档实现：卡片收集、答题闯关、无尽挑战、特殊荣誉四大类成就
 */
;(function () {
  'use strict';

  // ==================== 存储键名 ====================
  var ACHIEVEMENT_STORAGE_KEY = 'shuihu_achievements_v2';
  var TITLE_STORAGE_KEY = 'shuihu_current_title';
  var STATS_STORAGE_KEY = 'shuihu_stats';

  // ==================== 徽章等级定义 ====================
  var BADGE_LEVEL = {
    BRONZE: { name: 'bronze', icon: '🥉', color: '#CD7F32' },
    SILVER: { name: 'silver', icon: '🥈', color: '#C0C0C0' },
    GOLD: { name: 'gold', icon: '🥇', color: '#FFD700' }
  };

  // ==================== 称号定义 ====================
  var TITLES = {
    // 收集类
    'liangshan_rookie': { name: '梁山新秀', level: 'bronze' },
    'gathering_chief': { name: '聚义头领', level: 'silver' },
    'loyalty_master': { name: '忠义堂主', level: 'silver' },
    'tiangang_commander': { name: '天罡统领', level: 'gold' },
    'disha_sage': { name: '地煞尊者', level: 'gold' },
    'tiankui_star': { name: '天魁星主', level: 'gold' },
    'jianghu_hero': { name: '江湖义士', level: 'bronze' },
    'brave_chief': { name: '骁勇头领', level: 'silver' },
    'legend_hero': { name: '传说英雄', level: 'gold' },
    'wisdom_brave': { name: '智勇无双', level: 'gold' },
    'vanguard': { name: '急先锋', level: 'bronze' },
    'divine_walker': { name: '神行太保', level: 'silver' },
    
    // 答题类
    'literate': { name: '识字郎', level: 'bronze' },
    'learned_scholar': { name: '博闻书生', level: 'silver' },
    'jade_kirin': { name: '玉麒麟', level: 'gold' },
    'heavenly_star': { name: '天机星', level: 'gold' },
    'qi_vanguard': { name: '一气先锋', level: 'bronze' },
    'kuixing': { name: '魁星点斗', level: 'silver' },
    'top_three': { name: '三元及第', level: 'gold' },
    'tiger_fighter': { name: '打虎将', level: 'bronze' },
    'walker': { name: '行者', level: 'silver' },
    'diamond_body': { name: '金刚不坏', level: 'gold' },
    
    // 无尽挑战类
    'little_weichi': { name: '小尉迟', level: 'bronze' },
    'vanguard_general': { name: '急先锋', level: 'silver' },
    'jade_unicorn': { name: '玉麒麟', level: 'gold' },
    'heavenly_might': { name: '天威星', level: 'gold' },
    'lonely_master': { name: '孤独求败', level: 'gold' },
    'walker_title': { name: '行者', level: 'bronze' },
    'divine_speed': { name: '神行太保', level: 'silver' },
    'timely_rain': { name: '及时雨', level: 'gold' },
    'wise_star': { name: '智多星', level: 'gold' },
    'thunder_fire': { name: '霹雳火', level: 'silver' },
    'featherless_arrow': { name: '没羽箭', level: 'gold' },
    'desperate_third': { name: '拼命三郎', level: 'bronze' },
    
    // 特殊荣誉
    'timely_rain_special': { name: '及时雨', level: 'silver' },
    'black_tornado': { name: '黑旋风', level: 'silver' },
    'leopard_head': { name: '豹子头', level: 'gold' },
    'wanderer': { name: '行者', level: 'silver' },
    'prodigal': { name: '浪子', level: 'bronze' },
    'desperate_sanlang': { name: '拼命三郎', level: 'silver' },
    'flea_on_drum': { name: '鼓上蚤', level: 'gold' },
    'vegetable_gardener': { name: '菜园子', level: 'bronze' }
  };

  // ==================== 成就定义列表 ====================
  var ACHIEVEMENTS = [
    // ===== 一、卡片收集成就 =====
    
    // 1. 基础收集成就
    {
      id: 'gathering_10',
      name: '初上梁山',
      desc: '解锁任意10张水浒卡',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '聚义令',
      title: '梁山新秀',
      category: 'collection',
      check: function () { return getUnlockedCount() >= 10; }
    },
    {
      id: 'gathering_30',
      name: '小聚义',
      desc: '解锁30张水浒卡',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '聚义旗',
      title: '聚义头领',
      category: 'collection',
      check: function () { return getUnlockedCount() >= 30; }
    },
    {
      id: 'gathering_50',
      name: '大聚义',
      desc: '解锁50张水浒卡',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '忠义堂印',
      title: '忠义堂主',
      category: 'collection',
      check: function () { return getUnlockedCount() >= 50; }
    },
    {
      id: 'tiangang_complete',
      name: '天罡归位',
      desc: '解锁全部36天罡星',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '天罡令',
      title: '天罡统领',
      category: 'collection',
      check: function () { return getTiangangCount() >= 36; }
    },
    {
      id: 'disha_complete',
      name: '地煞齐聚',
      desc: '解锁全部72地煞星',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '地煞令',
      title: '地煞尊者',
      category: 'collection',
      check: function () { return getDishaCount() >= 72; }
    },
    {
      id: 'all_108',
      name: '天罡地煞',
      desc: '解锁全部108将',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '梁山全图',
      title: '天魁星主',
      category: 'collection',
      check: function () { return getUnlockedCount() >= 108; }
    },
    
    // 2. 星级专项成就
    {
      id: 'all_3star',
      name: '草莽英雄',
      desc: '解锁所有三星人物',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '草莽令',
      title: '江湖义士',
      category: 'collection',
      check: function () { return checkAllStarsUnlocked(3); }
    },
    {
      id: 'all_4star',
      name: '八面威风',
      desc: '解锁所有四星人物',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '威风印',
      title: '骁勇头领',
      category: 'collection',
      check: function () { return checkAllStarsUnlocked(4); }
    },
    {
      id: 'all_5star',
      name: '震古烁今',
      desc: '解锁所有五星人物',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '传说令',
      title: '传说英雄',
      category: 'collection',
      check: function () { return checkAllStarsUnlocked(5); }
    },
    {
      id: 'five_star_master',
      name: '五星上将',
      desc: '不使用提示解锁任意5位五星人物',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '五星战魂',
      title: '智勇无双',
      category: 'collection',
      check: function () { return getStats('noHint5Star') >= 5; }
    },
    
    // 3. 连续解锁成就
    {
      id: 'daily_5',
      name: '势如破竹',
      desc: '一天内解锁5张新卡',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '冲锋号',
      title: '急先锋',
      category: 'collection',
      check: function () { return getDailyUnlockCount() >= 5; }
    },
    {
      id: 'daily_10',
      name: '席卷梁山',
      desc: '一天内解锁10张新卡',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '席卷令',
      title: '神行太保',
      category: 'collection',
      check: function () { return getDailyUnlockCount() >= 10; }
    },
    
    // ===== 二、答题解锁成就 =====
    
    // 1. 答题正确数成就（累计）
    {
      id: 'answer_10',
      name: '小试身手',
      desc: '累计答对10题',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '智珠',
      title: '识字郎',
      category: 'quiz',
      check: function () { return getStats('totalCorrect') >= 10; }
    },
    {
      id: 'answer_50',
      name: '初窥门径',
      desc: '累计答对50题',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '青釭剑',
      title: '博闻书生',
      category: 'quiz',
      check: function () { return getStats('totalCorrect') >= 50; }
    },
    {
      id: 'answer_200',
      name: '倒背如流',
      desc: '累计答对200题',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '无字天书',
      title: '玉麒麟',
      category: 'quiz',
      check: function () { return getStats('totalCorrect') >= 200; }
    },
    {
      id: 'answer_500',
      name: '学究天人',
      desc: '累计答对500题',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '天机图',
      title: '天机星',
      category: 'quiz',
      check: function () { return getStats('totalCorrect') >= 500; }
    },
    
    // 2. 单次挑战完美表现成就
    {
      id: 'perfect_unlock',
      name: '一气呵成',
      desc: '首次挑战全对解锁一位人物',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '一气令',
      title: '一气先锋',
      category: 'quiz',
      check: function () { return getStats('perfectUnlock') >= 1; }
    },
    {
      id: 'three_flowers',
      name: '三花聚顶',
      desc: '五星挑战不使用提示连续答对',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '三花印',
      title: '魁星点斗',
      category: 'quiz',
      check: function () { return getStats('threeFlowers') >= 1; }
    },
    {
      id: 'triple_consecutive',
      name: '连中三元',
      desc: '连续解锁3位五星人物，均首次挑战成功',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '三元令',
      title: '三元及第',
      category: 'quiz',
      check: function () { return getStats('tripleConsecutive') >= 1; }
    },
    
    // 3. 答错与重试成就
    {
      id: 'perseverance',
      name: '越挫越勇',
      desc: '同一人物挑战失败3次后最终解锁',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '坚韧石',
      title: '打虎将',
      category: 'quiz',
      check: function () { return getStats('perseveranceUnlock') >= 1; }
    },
    {
      id: 'iron_rod',
      name: '铁杵成针',
      desc: '累积挑战失败总次数达30次',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '铁杵令',
      title: '行者',
      category: 'quiz',
      check: function () { return getStats('totalFailures') >= 30; }
    },
    {
      id: 'indomitable',
      name: '百折不挠',
      desc: '某五星人物失败5次后终于解锁',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '不坏身',
      title: '金刚不坏',
      category: 'quiz',
      check: function () { return getStats('indomitableUnlock') >= 1; }
    },
    
    // ===== 三、无尽挑战成就 =====
    
    // 1. 连续答题纪录成就
    {
      id: 'endless_10',
      name: '一气当百',
      desc: '无尽模式连续答对10题',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '耐力丹',
      title: '小尉迟',
      category: 'endless',
      check: function () { return getStats('endlessMaxStreak') >= 10; }
    },
    {
      id: 'endless_25',
      name: '横扫千军',
      desc: '连续答对25题',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '横扫令',
      title: '急先锋',
      category: 'endless',
      check: function () { return getStats('endlessMaxStreak') >= 25; }
    },
    {
      id: 'endless_50',
      name: '万夫莫敌',
      desc: '连续答对50题',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '霸王枪',
      title: '玉麒麟',
      category: 'endless',
      check: function () { return getStats('endlessMaxStreak') >= 50; }
    },
    {
      id: 'endless_100',
      name: '天下无敌',
      desc: '连续答对100题',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '无敌印',
      title: '天威星',
      category: 'endless',
      check: function () { return getStats('endlessMaxStreak') >= 100; }
    },
    {
      id: 'endless_200',
      name: '寂寞高手',
      desc: '连续答对200题',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '寂寞令',
      title: '孤独求败',
      category: 'endless',
      check: function () { return getStats('endlessMaxStreak') >= 200; }
    },
    
    // 2. 无尽挑战次数与总分成就
    {
      id: 'endless_5times',
      name: '初入江湖',
      desc: '累计参与无尽挑战5次',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '江湖令',
      title: '行者',
      category: 'endless',
      check: function () { return getStats('endlessTotalPlays') >= 5; }
    },
    {
      id: 'endless_100times',
      name: '老马识途',
      desc: '累计参与100次',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '识途印',
      title: '神行太保',
      category: 'endless',
      check: function () { return getStats('endlessTotalPlays') >= 100; }
    },
    {
      id: 'endless_500times',
      name: '乐此不疲',
      desc: '累计参与500次',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '不疲令',
      title: '及时雨',
      category: 'endless',
      check: function () { return getStats('endlessTotalPlays') >= 500; }
    },
    {
      id: 'endless_total_500',
      name: '博学多才',
      desc: '无尽模式累计答对500题',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '万卷书',
      title: '智多星',
      category: 'endless',
      check: function () { return getStats('endlessTotalCorrect') >= 500; }
    },
    
    // 3. 特殊表现成就
    {
      id: 'lightning_thinking',
      name: '闪电思维',
      desc: '单题平均答题时间<3秒（连续5题以上）',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '闪电令',
      title: '霹雳火',
      category: 'endless',
      check: function () { return getStats('lightningThinking') >= 1; }
    },
    {
      id: 'zero_mistake',
      name: '零失误大师',
      desc: '单次无尽挑战每题首次点击即正确',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '精准徽章',
      title: '没羽箭',
      category: 'endless',
      check: function () { return getStats('zeroMistake') >= 1; }
    },
    {
      id: 'never_give_up',
      name: '永不言弃',
      desc: '无尽模式失败后立刻重试，连续3次',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '永不言弃',
      title: '拼命三郎',
      category: 'endless',
      check: function () { return getStats('neverGiveUp') >= 1; }
    },
    
    // ===== 四、特殊荣誉成就 =====
    {
      id: 'timely_rain',
      name: '及时雨',
      desc: '连续7天每天至少解锁1张新卡',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '及时雨令',
      title: '及时雨',
      category: 'special',
      check: function () { return getStats('consecutiveDays') >= 7; }
    },
    {
      id: 'black_tornado',
      name: '黑旋风',
      desc: '累计答题速度排名前10%',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '旋风印',
      title: '黑旋风',
      category: 'special',
      check: function () { return getStats('speedRankTop10') >= 1; }
    },
    {
      id: 'leopard_head',
      name: '豹子头',
      desc: '无尽模式答对30题且10题关于林冲',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '豹子令',
      title: '豹子头',
      category: 'special',
      check: function () { return getStats('leopardHead') >= 1; }
    },
    {
      id: 'wanderer',
      name: '行者无疆',
      desc: '查看已解锁卡片背面介绍达200次',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '行者令',
      title: '行者',
      category: 'special',
      check: function () { return getStats('cardBackViews') >= 200; }
    },
    {
      id: 'prodigal',
      name: '浪子回头',
      desc: '将已解锁卡片切换回经典版3次',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '回头印',
      title: '浪子',
      category: 'special',
      check: function () { return getStats('classicSwitch') >= 3; }
    },
    {
      id: 'desperate_sanlang',
      name: '拼命三郎',
      desc: '单日无尽挑战次数达到20次',
      badge: BADGE_LEVEL.SILVER,
      badgeName: '拼命令',
      title: '拼命三郎',
      category: 'special',
      check: function () { return getStats('dailyEndless20') >= 1; }
    },
    {
      id: 'flea_on_drum',
      name: '鼓上蚤',
      desc: '在卡册中点击浏览卡片总次数达1080次',
      badge: BADGE_LEVEL.GOLD,
      badgeName: '飞檐令',
      title: '鼓上蚤',
      category: 'special',
      check: function () { return getStats('cardClicks') >= 1080; }
    },
    {
      id: 'vegetable_gardener',
      name: '菜园子',
      desc: '使用跳过功能累积10次',
      badge: BADGE_LEVEL.BRONZE,
      badgeName: '菜园令',
      title: '菜园子',
      category: 'special',
      check: function () { return getStats('totalSkips') >= 10; }
    }
  ];

  // ==================== 辅助函数 ====================
  
  function getUnlockedCount() {
    return typeof UnlockManager !== 'undefined' ? UnlockManager.getUnlockedCount() : 0;
  }
  
  function getTiangangCount() {
    if (typeof UnlockManager === 'undefined') return 0;
    var unlocked = UnlockManager.getAllUnlocked();
    var heroes = (typeof heroesData !== 'undefined' && heroesData.shuipo) ? heroesData.shuipo : [];
    var count = 0;
    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].rank && heroes[i].rank <= 36 && unlocked.indexOf(heroes[i].name) !== -1) {
        count++;
      }
    }
    return count;
  }
  
  function getDishaCount() {
    if (typeof UnlockManager === 'undefined') return 0;
    var unlocked = UnlockManager.getAllUnlocked();
    var heroes = (typeof heroesData !== 'undefined' && heroesData.shuipo) ? heroesData.shuipo : [];
    var count = 0;
    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].rank && heroes[i].rank > 36 && unlocked.indexOf(heroes[i].name) !== -1) {
        count++;
      }
    }
    return count;
  }

  function checkAllStarsUnlocked(star) {
    if (typeof UnlockManager === 'undefined') return false;
    var unlocked = UnlockManager.getAllUnlocked();
    var heroes = (typeof heroesData !== 'undefined' && heroesData.shuipo) ? heroesData.shuipo : [];
    var starHeroes = heroes.filter(function (h) { return h.overallStars === star; });
    for (var i = 0; i < starHeroes.length; i++) {
      if (unlocked.indexOf(starHeroes[i].name) === -1) return false;
    }
    return starHeroes.length > 0;
  }
  
  function getDailyUnlockCount() {
    return getStats('dailyUnlockCount') || 0;
  }
  
  function getStats(key) {
    try {
      var raw = localStorage.getItem(STATS_STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        return data[key] || 0;
      }
    } catch (e) {}
    return 0;
  }
  
  // ==================== 统计管理器 ====================
  window.StatsManager = {
    get: getStats,
    
    set: function (key, value) {
      try {
        var raw = localStorage.getItem(STATS_STORAGE_KEY);
        var data = raw ? JSON.parse(raw) : {};
        data[key] = value;
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    },
    
    increment: function (key, delta) {
      delta = delta || 1;
      this.set(key, this.get(key) + delta);
    },
    
    // 记录答题
    recordAnswer: function (correct, timeSpent) {
      if (correct) {
        this.increment('totalCorrect');
        this.increment('endlessTotalCorrect');
      }
      if (timeSpent) {
        var totalTime = this.get('totalAnswerTime') + timeSpent;
        var totalCount = this.get('totalAnswerCount') + 1;
        this.set('totalAnswerTime', totalTime);
        this.set('totalAnswerCount', totalCount);
      }
    },
    
    // 记录失败
    recordFailure: function (heroName) {
      this.increment('totalFailures');
      var failures = this.get('heroFailures_' + heroName) + 1;
      this.set('heroFailures_' + heroName, failures);
      if (failures >= 3) {
        this.set('perseveranceUnlock', 1);
      }
      if (failures >= 5) {
        var heroes = (typeof heroesData !== 'undefined' && heroesData.shuipo) ? heroesData.shuipo : [];
        var hero = heroes.find(function(h) { return h.name === heroName; });
        if (hero && hero.overallStars === 5) {
          this.set('indomitableUnlock', 1);
        }
      }
    },

    // 记录解锁
    recordUnlock: function (heroName, perfect, noHint) {
      this.increment('dailyUnlockCount');
      if (perfect) {
        this.increment('perfectUnlock');
      }
      if (noHint) {
        var heroes = (typeof heroesData !== 'undefined' && heroesData.shuipo) ? heroesData.shuipo : [];
        var hero = heroes.find(function(h) { return h.name === heroName; });
        if (hero && hero.overallStars === 5) {
          this.increment('noHint5Star');
        }
      }
    },
    
    // 记录无尽挑战
    recordEndless: function (score, perfect) {
      this.increment('endlessTotalPlays');
      var currentMax = this.get('endlessMaxStreak');
      if (score > currentMax) {
        this.set('endlessMaxStreak', score);
      }
      if (perfect) {
        this.set('zeroMistake', 1);
      }
    }
  };

  // ==================== 称号管理器 ====================
  window.TitleManager = {
    getCurrentTitle: function () {
      try {
        return localStorage.getItem(TITLE_STORAGE_KEY) || '';
      } catch (e) {
        return '';
      }
    },
    
    setCurrentTitle: function (titleId) {
      try {
        localStorage.setItem(TITLE_STORAGE_KEY, titleId);
      } catch (e) {}
    },
    
    getAvailableTitles: function () {
      var earned = AchievementManager ? AchievementManager.loadAchievements() : [];
      var titles = [];
      earned.forEach(function (id) {
        var ach = ACHIEVEMENTS.find(function (a) { return a.id === id; });
        if (ach && ach.title) {
          titles.push({
            id: ach.id,
            name: ach.title,
            level: ach.badge.name,
            achievement: ach.name
          });
        }
      });
      return titles;
    },
    
    getTitleDisplay: function () {
      var current = this.getCurrentTitle();
      if (!current) return null;
      var ach = ACHIEVEMENTS.find(function (a) { return a.id === current; });
      if (!ach || !ach.title) return null;
      return {
        name: ach.title,
        level: ach.badge.name,
        icon: ach.badge.icon
      };
    }
  };

  // ==================== 成就管理器 ====================
  window.AchievementManagerV2 = {
    ACHIEVEMENTS: ACHIEVEMENTS,
    BADGE_LEVEL: BADGE_LEVEL,
    
    loadAchievements: function () {
      try {
        var raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
        if (raw) {
          var data = JSON.parse(raw);
          if (Array.isArray(data)) return data;
        }
      } catch (e) {}
      return [];
    },
    
    saveAchievements: function (list) {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(list));
    },
    
    checkAchievements: function () {
      var earned = this.loadAchievements();
      var newAchievements = [];
      
      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var ach = ACHIEVEMENTS[i];
        if (earned.indexOf(ach.id) !== -1) continue;
        if (ach.check()) {
          earned.push(ach.id);
          newAchievements.push(ach);
          // 自动设置称号（如果是更高级的）
          if (ach.title) {
            TitleManager.setCurrentTitle(ach.id);
          }
        }
      }
      
      if (newAchievements.length > 0) {
        this.saveAchievements(earned);
        newAchievements.forEach(function (ach) {
          AchievementManagerV2.showAchievementToast(ach);
        });
      }
      
      return newAchievements;
    },
    
    showAchievementToast: function (ach) {
      var toast = document.createElement('div');
      toast.className = 'achievement-toast achievement-toast-v2';
      toast.innerHTML =
        '<div class="achievement-toast-badge" style="background:' + ach.badge.color + '">' + 
          ach.badge.icon + '</div>' +
        '<div class="achievement-toast-body">' +
          '<div class="achievement-toast-label">成就解锁</div>' +
          '<div class="achievement-toast-name">' + ach.name + '</div>' +
          '<div class="achievement-toast-badge-name">' + ach.badgeName + '</div>' +
          (ach.title ? '<div class="achievement-toast-title">获得称号：' + ach.title + '</div>' : '') +
        '</div>';
      
      document.body.appendChild(toast);
      
      requestAnimationFrame(function () {
        toast.classList.add('show');
      });
      
      setTimeout(function () {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 500);
      }, 4000);
    },
    
    showAll: function () {
      if (!window.achievementOverlayV2) {
        window.achievementOverlayV2 = this.createAchievementOverlay();
        document.body.appendChild(window.achievementOverlayV2);
      }
      this.renderAchievementList();
      window.achievementOverlayV2.classList.add('active');
      document.body.style.overflow = 'hidden';
    },
    
    createAchievementOverlay: function () {
      var overlay = document.createElement('div');
      overlay.className = 'achievement-overlay achievement-overlay-v2';
      
      var panel = document.createElement('div');
      panel.className = 'achievement-panel achievement-panel-v2';
      
      // 称号展示区
      var currentTitle = TitleManager.getTitleDisplay();
      var titleHtml = currentTitle ? 
        '<div class="current-title-display" style="color:' + BADGE_LEVEL[currentTitle.level.toUpperCase()].color + '">' +
          '<span class="title-icon">' + currentTitle.icon + '</span>' +
          '<span class="title-name">' + currentTitle.name + '</span>' +
        '</div>' : 
        '<div class="current-title-display no-title">暂无称号</div>';
      
      panel.innerHTML =
        '<div class="achievement-header-v2">' +
          '<h3 class="achievement-title-v2">成就殿堂</h3>' +
          titleHtml +
          '<div class="achievement-summary-v2"></div>' +
          '<button class="achievement-close-btn" type="button" aria-label="关闭">&times;</button>' +
        '</div>' +
        '<div class="achievement-tabs">' +
          '<button class="achievement-tab active" data-tab="all">全部</button>' +
          '<button class="achievement-tab" data-tab="collection">收集</button>' +
          '<button class="achievement-tab" data-tab="quiz">答题</button>' +
          '<button class="achievement-tab" data-tab="endless">无尽</button>' +
          '<button class="achievement-tab" data-tab="special">特殊</button>' +
        '</div>' +
        '<div class="achievement-list-v2"></div>';
      
      overlay.appendChild(panel);
      
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) AchievementManagerV2.closeAchievement();
      });
      
      panel.querySelector('.achievement-close-btn').addEventListener('click', function () {
        AchievementManagerV2.closeAchievement();
      });
      
      // Tab 切换
      var tabs = panel.querySelectorAll('.achievement-tab');
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          tabs.forEach(function (t) { t.classList.remove('active'); });
          tab.classList.add('active');
          AchievementManagerV2.renderAchievementList(tab.dataset.tab);
        });
      });
      
      return overlay;
    },
    
    renderAchievementList: function (filter) {
      filter = filter || 'all';
      if (!window.achievementOverlayV2) return;
      
      var panel = window.achievementOverlayV2.querySelector('.achievement-panel-v2');
      var earned = this.loadAchievements();
      
      // 更新汇总
      var earnedCount = earned.length;
      var totalCount = ACHIEVEMENTS.length;
      panel.querySelector('.achievement-summary-v2').textContent = 
        '已获得 ' + earnedCount + ' / ' + totalCount;
      
      // 更新称号显示
      var currentTitle = TitleManager.getTitleDisplay();
      var titleEl = panel.querySelector('.current-title-display');
      if (currentTitle) {
        titleEl.className = 'current-title-display';
        titleEl.style.color = BADGE_LEVEL[currentTitle.level.toUpperCase()].color;
        titleEl.innerHTML = '<span class="title-icon">' + currentTitle.icon + '</span>' +
          '<span class="title-name">' + currentTitle.name + '</span>';
      }
      
      // 渲染列表
      var listEl = panel.querySelector('.achievement-list-v2');
      listEl.innerHTML = '';
      
      var filtered = filter === 'all' ? ACHIEVEMENTS : 
        ACHIEVEMENTS.filter(function (a) { return a.category === filter; });
      
      filtered.forEach(function (ach) {
        var isEarned = earned.indexOf(ach.id) !== -1;
        var item = document.createElement('div');
        item.className = 'achievement-item-v2' + (isEarned ? ' earned' : '');
        item.dataset.level = ach.badge.name;
        
        item.innerHTML =
          '<div class="achievement-item-badge-v2" style="background:' + 
            (isEarned ? ach.badge.color : '#ccc') + '">' +
            (isEarned ? ach.badge.icon : '?') + '</div>' +
          '<div class="achievement-item-body-v2">' +
            '<div class="achievement-item-name-v2">' + (isEarned ? ach.name : '???') + '</div>' +
            '<div class="achievement-item-desc-v2">' + ach.desc + '</div>' +
            (ach.title && isEarned ? '<div class="achievement-item-title-tag">称号：' + ach.title + '</div>' : '') +
          '</div>' +
          '<div class="achievement-item-badge-name">' + ach.badgeName + '</div>';
        
        listEl.appendChild(item);
      });
    },
    
    closeAchievement: function () {
      if (!window.achievementOverlayV2) return;
      window.achievementOverlayV2.classList.remove('active');
      document.body.style.overflow = '';
    },
    
    // 迁移旧数据
    migrateFromV1: function () {
      try {
        var oldKey = 'shuihu_achievements';
        var oldData = localStorage.getItem(oldKey);
        if (oldData) {
          var oldAchievements = JSON.parse(oldData);
          var newAchievements = [];
          
          // 映射旧成就ID到新ID
          var mapping = {
            'first_hero': 'gathering_10',
            'tiangang_collector': 'tiangang_complete',
            'disha_collector': 'disha_complete',
            'martial_peak': 'all_5star',
            'shuihu_master': 'all_108',
            'streak_10': 'endless_10',
            'streak_20': 'endless_25',
            'streak_30': 'endless_50',
            'streak_50': 'endless_100'
          };
          
          oldAchievements.forEach(function (oldId) {
            if (mapping[oldId]) {
              newAchievements.push(mapping[oldId]);
            }
          });
          
          if (newAchievements.length > 0) {
            this.saveAchievements(newAchievements);
          }
        }
      } catch (e) {}
    }
  };

  // 页面加载时执行迁移
  window.AchievementManagerV2.migrateFromV1();

})();
