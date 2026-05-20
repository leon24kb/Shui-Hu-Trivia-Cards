/**
 * quiz.js - 知识问答（多题挑战）、无尽挑战、图鉴展示、成就系统
 * 依赖：UnlockManager（unlock.js）、heroesData（data.js）、showCardDetail（app.js）
 */
;(function () {
  'use strict';

  // ==================== 工具函数 ====================

  /**
   * 从数组中随机选取 n 个不重复元素
   * @param {Array} arr - 源数组
   * @param {number} n - 选取数量
   * @returns {Array} 随机选取的元素数组
   */
  function randomPick(arr, n) {
    var copy = arr.slice();
    var result = [];
    for (var i = 0; i < n && copy.length > 0; i++) {
      var idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  }

  /**
   * 打乱数组顺序（Fisher-Yates）
   * @param {Array} arr - 待打乱数组
   * @returns {Array} 打乱后的新数组
   */
  function shuffle(arr) {
    var copy = arr.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /**
   * 获取所有英雄数组
   * @returns {Array} 英雄数组
   */
  function getHeroes() {
    return (typeof heroesData !== 'undefined' && heroesData.shuipo) ? heroesData.shuipo : [];
  }

  /**
   * 根据英雄名称查找英雄对象
   * @param {string} name - 英雄名称
   * @returns {Object|null} 英雄对象
   */
  function findHero(name) {
    var heroes = getHeroes();
    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].name === name) return heroes[i];
    }
    return null;
  }

  /**
   * 判断是否为天罡星（rank 1-36）
   * @param {Object} hero - 英雄对象
   * @returns {boolean}
   */
  function isTiangang(hero) {
    return hero.rank >= 1 && hero.rank <= 36;
  }

  /**
   * 获取英雄悬念描述（使用预定义的108将概况）
   * @param {Object} hero - 英雄对象
   * @returns {string} 悬念描述
   */
  function getHeroTeaser(hero) {
    // 优先使用预定义概况
    if (typeof heroSummaries !== 'undefined' && heroSummaries[hero.name]) {
      return heroSummaries[hero.name];
    }
    // 回退：组合关键属性
    var parts = [];
    if (hero.position) parts.push(hero.position);
    if (hero.weapon) parts.push('善用' + hero.weapon);
    if (hero.story) {
      var keyPhrases = extractKeyPhrases(hero.story);
      if (keyPhrases.length > 0) parts.push(keyPhrases[0]);
    }
    if (parts.length > 0) return parts.join('，');
    return hero.star + '·第' + hero.rank + '位';
  }

  /**
   * 从文本中提取关键短语
   * @param {string} text - 原始文本
   * @returns {Array} 关键短语数组
   */
  function extractKeyPhrases(text) {
    var phrases = [];
    // 关键事件动词
    var actionVerbs = ['智取', '怒杀', '打虎', '醉打', '大闹', '血溅', '劫', '救', '斩', '擒', '败', '胜', '义释', '招安', '聚义', '结义', '投奔', '落草'];
    
    for (var i = 0; i < actionVerbs.length; i++) {
      var verb = actionVerbs[i];
      var idx = text.indexOf(verb);
      if (idx !== -1) {
        // 提取动词及其后5-10个字
        var endIdx = Math.min(idx + verb.length + 8, text.length);
        var phrase = text.substring(idx, endIdx);
        // 截断到标点
        var punctIdx = phrase.search(/[，。；、！？]/);
        if (punctIdx > verb.length) {
          phrase = phrase.substring(0, punctIdx);
        }
        phrases.push(phrase);
      }
    }
    
    // 如果没找到关键动词，提取第一句完整句子
    if (phrases.length === 0 && text.length > 0) {
      var firstSentence = text.split(/[，。]/)[0];
      if (firstSentence.length >= 4 && firstSentence.length <= 15) {
        phrases.push(firstSentence);
      }
    }
    
    return phrases;
  }

  /**
   * 生成星级显示字符串（如 "★★★★★"）
   * @param {number} stars - 星级数
   * @returns {string} 星级字符串
   */
  function starsDisplay(stars) {
    var s = '';
    for (var i = 0; i < stars; i++) s += '\u2605'; // ★
    return s;
  }

  /**
   * 获取连胜计数
   * @returns {number} 当前连胜数
   */
  function getStreak() {
    try {
      var val = parseInt(localStorage.getItem('shuihu_streak'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 设置连胜计数
   * @param {number} val - 连胜数
   */
  function setStreak(val) {
    localStorage.setItem('shuihu_streak', String(val));
  }

  /**
   * 获取历史最高连胜计数
   * @returns {number} 历史最高连胜数
   */
  function getMaxStreak() {
    try {
      var val = parseInt(localStorage.getItem('shuihu_max_streak'), 10);
      return isNaN(val) ? 0 : val;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 更新历史最高连胜计数（仅当 val 大于当前值时更新）
   * @param {number} val - 当前连胜数
   */
  function updateMaxStreak(val) {
    var current = getMaxStreak();
    if (val > current) {
      localStorage.setItem('shuihu_max_streak', String(val));
    }
  }

  /**
   * 检查英雄的特定属性是否在所有英雄中唯一
   * @param {Object} hero - 英雄对象
   * @param {string} attributeName - 属性名（nickname, weapon, position, star）
   * @returns {boolean} 是否唯一
   */
  function isAttributeUnique(hero, attributeName) {
    var heroes = getHeroes();
    var value = hero[attributeName];
    if (!value || value.length < 1) return false;

    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].name === hero.name) continue;
      if (heroes[i][attributeName] === value) {
        return false;
      }
    }
    return true;
  }

  // ==================== 题目生成器 ====================

  /**
   * 6种题型生成器
   * 每个生成器接收 hero 参数，返回 { question, options, answerIndex }
   */

  /**
   * 生成干扰项（优先选同星级的英雄）
   * @param {Object} hero - 正确答案的英雄
   * @param {number} count - 干扰项数量
   * @returns {Array} 干扰项英雄对象数组
   */
  function generateDistractors(hero, count) {
    var heroes = getHeroes();
    var sameStar = [];
    var others = [];

    for (var i = 0; i < heroes.length; i++) {
      if (heroes[i].name === hero.name) continue;
      if (heroes[i].overallStars === hero.overallStars) {
        sameStar.push(heroes[i]);
      } else {
        others.push(heroes[i]);
      }
    }

    // 优先从同星级中选取，不够再从其他英雄中补
    var distractors = randomPick(sameStar, count);
    if (distractors.length < count) {
      var remaining = count - distractors.length;
      distractors = distractors.concat(randomPick(others, remaining));
    }

    return distractors;
  }

  /**
   * 从文本中提取一个完整、有意义的短语用于出题
   * 策略：优先提取包含关键动词的完整句子片段
   * @param {string} text - 原始文本
   * @returns {string} 提取的短语（保证有意义）
   */
  function extractMeaningfulPhrase(text) {
    if (!text || text.length < 4) return '';

    // 关键事件动词（按优先级排序）
    var actionPatterns = [
      '智取', '怒杀', '打虎', '醉打', '大闹', '血溅', '劫法场',
      '风雪山神庙', '拳打镇关西', '倒拔垂杨柳', '逼上梁山',
      '夜奔', '单刀', '义释', '聚义', '投奔', '落草',
      '斩', '擒', '败', '救', '战', '降', '归顺'
    ];

    // 优先匹配关键事件模式
    for (var p = 0; p < actionPatterns.length; p++) {
      var pattern = actionPatterns[p];
      var idx = text.indexOf(pattern);
      if (idx !== -1) {
        // 向前扩展到上一个句号/逗号之后
        var start = 0;
        for (var si = idx - 1; si >= 0; si--) {
          var ch = text.charAt(si);
          if (ch === '。' || ch === '！' || ch === '？') {
            start = si + 1;
            break;
          }
          if (ch === '，' || ch === '；') {
            start = si + 1;
            break;
          }
        }
        // 向后扩展到句号或逗号
        var end = text.length;
        var puncts = ['。', '，', '；', '！', '？'];
        for (var pi = 0; pi < puncts.length; pi++) {
          var pidx = text.indexOf(puncts[pi], idx + pattern.length);
          if (pidx !== -1 && pidx < end) {
            end = pidx;
          }
        }
        var phrase = text.substring(start, end).trim();
        // 去掉开头的"他""其"等代词
        if (phrase.length > 2 && (phrase.charAt(0) === '他' || phrase.charAt(0) === '其')) {
          phrase = phrase.substring(1).trim();
        }
        if (phrase.length >= 6 && phrase.length <= 35) {
          return phrase;
        }
      }
    }

    // 回退：提取第一个完整句子（到句号）
    var periodIdx = text.indexOf('。');
    if (periodIdx > 5 && periodIdx <= 40) {
      var sentence = text.substring(0, periodIdx).trim();
      if (sentence.length > 4) {
        if (sentence.charAt(0) === '他' || sentence.charAt(0) === '其') {
          sentence = sentence.substring(1).trim();
        }
        return sentence;
      }
    }

    // 最后回退：提取到第一个逗号
    var commaIdx = text.indexOf('，');
    if (commaIdx > 5 && commaIdx <= 35) {
      return text.substring(0, commaIdx).trim();
    }

    // 极端回退
    if (text.length <= 35) return text;
    return text.substring(0, 35);
  }

  /**
   * 验证题目是否有效（问题文本完整、选项不重复、答案在选项中）
   * @param {Object} question - 题目对象
   * @returns {boolean} 是否有效
   */
  function validateQuestion(question) {
    if (!question) return false;
    if (!question.question || question.question.length < 4) return false;
    if (!question.options || question.options.length < 2) return false;
    if (typeof question.answerIndex !== 'number' || question.answerIndex < 0 || question.answerIndex >= question.options.length) return false;
    // 检查选项不重复
    var seen = {};
    for (var i = 0; i < question.options.length; i++) {
      var opt = question.options[i];
      if (!opt || opt.length === 0) return false;
      if (seen[opt]) return false;
      seen[opt] = true;
    }
    // 检查问题中不包含 undefined/null
    if (question.question.indexOf('undefined') !== -1 || question.question.indexOf('null') !== -1) return false;
    return true;
  }

  /**
   * 绰号题："'XXX'是谁的绰号？"（仅在绰号唯一时生成）
   */
  function genNicknameQuestion(hero) {
    if (!hero.nickname || hero.nickname.length < 1) return null;
    if (!isAttributeUnique(hero, 'nickname')) return null;
    var distractors = generateDistractors(hero, 3);
    var options = shuffle([hero.name].concat(distractors.map(function (h) { return h.name; })));
    return {
      question: '\u201C' + hero.nickname + '\u201D是谁的绰号？',
      options: options,
      answerIndex: options.indexOf(hero.name)
    };
  }

  /**
   * 武器题："谁使用'XXX'？"（仅在武器唯一时生成）
   */
  function genWeaponQuestion(hero) {
    if (!hero.weapon || hero.weapon.length < 1) return null;
    if (!isAttributeUnique(hero, 'weapon')) return null;
    var distractors = generateDistractors(hero, 3);
    var options = shuffle([hero.name].concat(distractors.map(function (h) { return h.name; })));
    return {
      question: '谁使用\u201C' + hero.weapon + '\u201D？',
      options: options,
      answerIndex: options.indexOf(hero.name)
    };
  }

  /**
   * 职务题："谁担任'XXX'？"（仅在职务唯一时生成）
   */
  function genPositionQuestion(hero) {
    if (!hero.position || hero.position.length < 1) return null;
    if (!isAttributeUnique(hero, 'position')) return null;
    var distractors = generateDistractors(hero, 3);
    var options = shuffle([hero.name].concat(distractors.map(function (h) { return h.name; })));
    return {
      question: '谁担任\u201C' + hero.position + '\u201D？',
      options: options,
      answerIndex: options.indexOf(hero.name)
    };
  }

  /**
   * 星位题："'XXX'对应谁？"（仅在星位唯一时生成）
   */
  function genStarQuestion(hero) {
    if (!hero.star || hero.star.length < 1) return null;
    if (!isAttributeUnique(hero, 'star')) return null;
    var distractors = generateDistractors(hero, 3);
    var options = shuffle([hero.name].concat(distractors.map(function (h) { return h.name; })));
    return {
      question: '\u201C' + hero.star + '\u201D对应谁？',
      options: options,
      answerIndex: options.indexOf(hero.name)
    };
  }

  /**
   * 结局题：从 ending 中提取关键信息出题
   */
  function genEndingQuestion(hero) {
    if (!hero.ending || hero.ending.length < 4) return null;
    var keyPhrase = extractMeaningfulPhrase(hero.ending);
    if (!keyPhrase || keyPhrase.length < 4) return null;

    var distractors = generateDistractors(hero, 3);
    var options = shuffle([hero.name].concat(distractors.map(function (h) { return h.name; })));
    return {
      question: '\u201C' + keyPhrase + '\u201D是谁的结局？',
      options: options,
      answerIndex: options.indexOf(hero.name)
    };
  }

  /**
   * 事迹题：从 story 中提取关键信息出题
   */
  function genStoryQuestion(hero) {
    if (!hero.story || hero.story.length < 4) return null;
    var keyPhrase = extractMeaningfulPhrase(hero.story);
    if (!keyPhrase || keyPhrase.length < 4) return null;

    var distractors = generateDistractors(hero, 3);
    var options = shuffle([hero.name].concat(distractors.map(function (h) { return h.name; })));
    return {
      question: '\u201C' + keyPhrase + '\u201D描述的是谁？',
      options: options,
      answerIndex: options.indexOf(hero.name)
    };
  }

  /**
   * 获取英雄可用的题型生成器列表（带优先级）
   * 优先级顺序：1)绰号题 2)星位题 3)事迹题 4)结局题 5)武器题 6)职务题
   * @param {Object} hero - 英雄对象
   * @returns {Array} 生成器函数数组（按优先级排序）
   */
  function getAvailableGenerators(hero) {
    var generators = [];
    if (hero.nickname && isAttributeUnique(hero, 'nickname')) {
      generators.push({ gen: genNicknameQuestion, name: 'nickname', priority: 1 });
    }
    if (hero.star && isAttributeUnique(hero, 'star')) {
      generators.push({ gen: genStarQuestion, name: 'star', priority: 2 });
    }
    if (hero.story) {
      generators.push({ gen: genStoryQuestion, name: 'story', priority: 3 });
    }
    if (hero.ending) {
      generators.push({ gen: genEndingQuestion, name: 'ending', priority: 4 });
    }
    if (hero.weapon && isAttributeUnique(hero, 'weapon')) {
      generators.push({ gen: genWeaponQuestion, name: 'weapon', priority: 5 });
    }
    if (hero.position && isAttributeUnique(hero, 'position')) {
      generators.push({ gen: genPositionQuestion, name: 'position', priority: 6 });
    }
    // 按优先级排序
    generators.sort(function (a, b) { return a.priority - b.priority; });
    return generators.map(function (item) { return item; });
  }

  /**
   * 获取英雄可用的题型生成器函数数组（按优先级排序，用于 generateQuestions）
   * @param {Object} hero - 英雄对象
   * @returns {Array} 生成器函数数组
   */
  function getGeneratorFunctions(hero) {
    return getAvailableGenerators(hero).map(function (item) { return item.gen; });
  }

  /**
   * 获取英雄可用的题型名称数组（用于去重追踪）
   * @param {Object} hero - 英雄对象
   * @returns {Array} 题型名称数组
   */
  function getGeneratorNames(hero) {
    return getAvailableGenerators(hero).map(function (item) { return item.name; });
  }

  /**
   * 其他英雄池（用于均匀覆盖更多英雄）
   * @type {Array}
   */
  var otherHeroPool = null;
  var currentTargetHero = null;

  /**
   * 重置其他英雄池
   * @param {Object} targetHero - 目标英雄
   */
  function resetOtherHeroPool(targetHero) {
    currentTargetHero = targetHero;
    otherHeroPool = heroesData.shuipo.filter(function (h) {
      return h.name !== targetHero.name;
    });
    otherHeroPool = shuffle(otherHeroPool);
  }

  /**
   * 获取随机其他英雄（使用英雄池，均匀覆盖）
   * @param {Object} targetHero - 目标英雄
   * @returns {Object} 随机其他英雄
   */
  function getRandomOtherHero(targetHero) {
    // 如果池为空或目标英雄改变，重置池
    if (!otherHeroPool || otherHeroPool.length === 0 || currentTargetHero !== targetHero) {
      resetOtherHeroPool(targetHero);
    }
    if (otherHeroPool.length === 0) return targetHero;
    return otherHeroPool.pop();
  }

  /**
   * 根据英雄星级获取所需题型配置
   * @param {Object} hero - 英雄对象
   * @returns {Array} 题型名称数组
   */
  function getRequiredQuestionTypes(hero) {
    var starLevel = hero.overallStars || hero.rarity || 3;
    var types = [];

    // 根据星级返回不同的题型配置
    if (starLevel >= 5) {
      // 五星英雄：1道绰号/星位题、1道事迹题、1道结局题、1道武器题、1道职务题
      types = ['nickname_or_star', 'story', 'ending', 'weapon', 'position'];
    } else if (starLevel === 4) {
      // 四星英雄：1道绰号/星位题、1道事迹题、1道结局题、1道武器题
      types = ['nickname_or_star', 'story', 'ending', 'weapon'];
    } else if (starLevel === 3) {
      // 三星英雄：1道绰号/星位题、1道事迹题、1道结局题
      types = ['nickname_or_star', 'story', 'ending'];
    } else {
      // 两星及以下英雄：从绰号、星位、事迹、结局中随机挑选2项
      var available = ['nickname', 'star', 'story', 'ending'];
      var shuffled = shuffle(available);
      types = shuffled.slice(0, 2);
    }

    return types;
  }

  /**
   * 生成特定类型的题目
   * @param {Object} hero - 英雄对象
   * @param {string} type - 题型类型
   * @returns {Object|null} 题目对象或null
   */
  function generateQuestionByType(hero, type) {
    if (type === 'nickname') {
      return genNicknameQuestion(hero);
    } else if (type === 'star') {
      return genStarQuestion(hero);
    } else if (type === 'nickname_or_star') {
      // 优先尝试绰号题，如果不可用则尝试星位题
      var q = genNicknameQuestion(hero);
      if (q) return q;
      return genStarQuestion(hero);
    } else if (type === 'story') {
      return genStoryQuestion(hero);
    } else if (type === 'ending') {
      return genEndingQuestion(hero);
    } else if (type === 'weapon') {
      return genWeaponQuestion(hero);
    } else if (type === 'position') {
      return genPositionQuestion(hero);
    }
    return null;
  }

  /**
   * 根据英雄星级获取出题配置
   * @param {Object} hero - 英雄对象
   * @returns {Object} 配置对象 { totalQuestions, targetQuestions, otherQuestions, otherHeroCount }
   */
  function getQuizConfig(hero) {
    var starLevel = hero.overallStars || hero.rarity || 3;
    var config = { totalQuestions: 3, targetQuestions: 1, otherQuestions: 2, otherHeroCount: 2 };

    if (starLevel >= 5) {
      config = { totalQuestions: 5, targetQuestions: 2, otherQuestions: 3, otherHeroCount: 3 };
    } else if (starLevel === 4) {
      config = { totalQuestions: 4, targetQuestions: 2, otherQuestions: 2, otherHeroCount: 2 };
    } else if (starLevel === 3) {
      config = { totalQuestions: 3, targetQuestions: 1, otherQuestions: 2, otherHeroCount: 2 };
    } else {
      config = { totalQuestions: 2, targetQuestions: 1, otherQuestions: 1, otherHeroCount: 1 };
    }

    return config;
  }

  /**
   * 为英雄生成 N 道混合题目（根据星级配置题型和数量）
   * 出题规则：
   * 1. 根据英雄星级决定总题数、目标英雄题数、其他英雄题数
   * 2. 五星：2题目标+3题其他(3个不同英雄)
   * 3. 四星：2题目标+2题其他(2个不同英雄)
   * 4. 三星：1题目标+2题其他(2个不同英雄)
   * 5. 两星及以下：1题目标+1题其他(1个不同英雄)
   * 6. 其他英雄题目确保是不同的英雄
   * 7. 避免重复问题文本
   * @param {Object} hero - 目标英雄对象
   * @param {number} count - 题目数量（会被星级配置覆盖）
   * @returns {Array} 题目数组
   */
  function generateQuestions(hero, count) {
    var questions = [];
    var usedQuestionTexts = new Set();
    var usedOtherHeroNames = new Set();

    var config = getQuizConfig(hero);
    resetOtherHeroPool(hero);

    var targetCount = 0;
    var targetTypes = getRequiredQuestionTypes(hero);
    for (var i = 0; i < targetTypes.length && targetCount < config.targetQuestions; i++) {
      var type = targetTypes[i];
      var q = generateQuestionByType(hero, type);
      if (q && validateQuestion(q) && !usedQuestionTexts.has(q.question)) {
        usedQuestionTexts.add(q.question);
        questions.push(q);
        targetCount++;
      }
    }

    while (targetCount < config.targetQuestions) {
      var availableTargetTypes = targetTypes.filter(function(t) {
        return t !== 'nickname_or_star';
      });
      if (availableTargetTypes.length === 0) availableTargetTypes = ['nickname', 'star', 'story', 'ending', 'weapon', 'position'];
      var randomType = availableTargetTypes[Math.floor(Math.random() * availableTargetTypes.length)];
      var extraQ = generateQuestionByType(hero, randomType);
      if (extraQ && validateQuestion(extraQ) && !usedQuestionTexts.has(extraQ.question)) {
        usedQuestionTexts.add(extraQ.question);
        questions.push(extraQ);
        targetCount++;
      } else {
        break;
      }
    }

    var allHeroes = heroesData.shuipo.filter(function(h) { return h.name !== hero.name; });
    allHeroes = shuffle(allHeroes);

    var otherCount = 0;
    var heroIndex = 0;

    while (otherCount < config.otherQuestions && heroIndex < allHeroes.length) {
      var otherHero = allHeroes[heroIndex];
      heroIndex++;
      if (usedOtherHeroNames.has(otherHero.name)) continue;

      var availableGens = getAvailableGenerators(otherHero);
      if (availableGens.length === 0) continue;

      var genItem = availableGens[Math.floor(Math.random() * availableGens.length)];
      var oq = genItem.gen(otherHero);

      if (oq && validateQuestion(oq) && !usedQuestionTexts.has(oq.question)) {
        usedQuestionTexts.add(oq.question);
        usedOtherHeroNames.add(otherHero.name);
        questions.push(oq);
        otherCount++;
      }
    }

    while (otherCount < config.otherQuestions) {
      var remainingHeroes = heroesData.shuipo.filter(function(h) {
        return h.name !== hero.name && !usedOtherHeroNames.has(h.name);
      });
      if (remainingHeroes.length === 0) break;

      var randomHero = remainingHeroes[Math.floor(Math.random() * remainingHeroes.length)];
      var genList = getAvailableGenerators(randomHero);
      if (genList.length === 0) continue;

      var randomGenItem = genList[Math.floor(Math.random() * genList.length)];
      var补充Q = randomGenItem.gen(randomHero);

      if (补充Q && validateQuestion(补充Q) && !usedQuestionTexts.has(补充Q.question)) {
        usedQuestionTexts.add(补充Q.question);
        usedOtherHeroNames.add(randomHero.name);
        questions.push(补充Q);
        otherCount++;
      }
    }

    return shuffle(questions);
  }

  // ==================== QuizManager - 问答系统（多题挑战模式） ====================

  var quizIntroOverlay = null;  // 英雄介绍面板 DOM
  var quizChallengeOverlay = null; // 答题面板 DOM

  // 当前挑战状态
  var currentChallenge = {
    hero: null,        // 当前挑战的英雄
    questions: [],     // 题目列表
    currentIndex: 0,   // 当前题目索引
    totalQuestions: 0, // 总题数
    isAnswering: false, // 是否正在等待答题结果
    _timers: []        // pending 定时器ID列表
  };

  var QuizManager = {

    /**
     * 为指定英雄弹出英雄介绍面板（入口方法）
     * @param {Object} hero - 英雄对象
     */
    showQuiz: function (hero) {
      if (!hero) return;

      // 如果已经解锁，直接查看详情
      if (typeof UnlockManager !== 'undefined' && UnlockManager.isUnlocked(hero.name)) {
        if (typeof showCardDetail === 'function') {
          showCardDetail(hero);
        }
        return;
      }

      // 创建或复用介绍面板
      if (!quizIntroOverlay) {
        quizIntroOverlay = this.createIntroOverlay();
        document.body.appendChild(quizIntroOverlay);
      }

      // 填充介绍面板内容
      this.populateIntroPanel(hero);

      // 显示面板
      quizIntroOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    /**
     * 创建英雄介绍面板 DOM
     * @returns {HTMLElement} 遮罩元素
     */
    createIntroOverlay: function () {
      var overlay = document.createElement('div');
      overlay.className = 'quiz-intro-overlay';

      var panel = document.createElement('div');
      panel.className = 'quiz-intro-panel';

      panel.innerHTML =
        '<div class="quiz-intro-portrait">' +
          '<img class="quiz-intro-img" src="" alt="英雄剪影">' +
        '</div>' +
        '<div class="quiz-intro-info">' +
          '<div class="quiz-intro-star-name"></div>' +
          '<div class="quiz-intro-stars"></div>' +
          '<div class="quiz-intro-teaser"></div>' +
        '</div>' +
        '<button class="quiz-intro-start-btn" type="button"></button>' +
        '<button class="quiz-intro-close-btn" type="button" aria-label="关闭">&times;</button>';

      overlay.appendChild(panel);

      // 点击遮罩关闭
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          QuizManager.closeIntro();
        }
      });

      // 关闭按钮
      panel.querySelector('.quiz-intro-close-btn').addEventListener('click', function () {
        QuizManager.closeIntro();
      });

      // 开始挑战按钮
      panel.querySelector('.quiz-intro-start-btn').addEventListener('click', function () {
        QuizManager.startChallenge();
      });

      // ESC 关闭
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          QuizManager.closeIntro();
        }
      });

      return overlay;
    },

    /**
     * 填充英雄介绍面板
     * @param {Object} hero - 英雄对象
     */
    populateIntroPanel: function (hero) {
      var panel = quizIntroOverlay.querySelector('.quiz-intro-panel');
      var stars = hero.overallStars || 1;

      // 剪影图（使用锁定英雄的默认图）
      var img = panel.querySelector('.quiz-intro-img');
      img.src = 'assets/img/locked-hero.png';
      img.alt = '未知英雄';
      img.style.filter = 'brightness(0.3)';

      // 星位名
      panel.querySelector('.quiz-intro-star-name').textContent = hero.star || '未知星位';

      // 星级显示
      panel.querySelector('.quiz-intro-stars').textContent = starsDisplay(stars);

      // 悬念描述
      panel.querySelector('.quiz-intro-teaser').textContent = getHeroTeaser(hero);

      // 按钮文字（显示需要答对几题）
      var startBtn = panel.querySelector('.quiz-intro-start-btn');
      startBtn.textContent = '答题挑战\u00B7解锁英雄\uff08连续答对' + stars + '题\uff09';
    },

    /**
     * 开始答题挑战
     */
    startChallenge: function () {
      var hero = currentChallenge.hero;
      if (!hero) return;

      // 从介绍面板获取英雄信息（第一次调用时从面板数据中提取）
      // hero 在 showQuiz 时已设置
      var stars = hero.overallStars || 1;

      // 生成题目
      var questions = generateQuestions(hero, stars);
      if (questions.length === 0) return;

      // 初始化挑战状态
      currentChallenge.questions = questions;
      currentChallenge.currentIndex = 0;
      currentChallenge.totalQuestions = stars;
      currentChallenge.isAnswering = false;

      // 关闭介绍面板
      this.closeIntro();

      // 创建或复用答题面板
      if (!quizChallengeOverlay) {
        quizChallengeOverlay = this.createChallengeOverlay();
        document.body.appendChild(quizChallengeOverlay);
      }

      // 显示第一题
      this.showQuestion(0);

      // 显示答题面板
      quizChallengeOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    /**
     * 创建答题面板 DOM
     * @returns {HTMLElement} 遮罩元素
     */
    createChallengeOverlay: function () {
      var overlay = document.createElement('div');
      overlay.className = 'quiz-challenge-overlay';

      var panel = document.createElement('div');
      panel.className = 'quiz-challenge-panel';

      panel.innerHTML =
        '<button class="quiz-challenge-exit-btn" type="button" aria-label="退出">\u00D7</button>' +
        '<div class="quiz-challenge-header">' +
          '<div class="quiz-challenge-progress"></div>' +
          '<div class="quiz-challenge-stars"></div>' +
        '</div>' +
        '<div class="quiz-challenge-question"></div>' +
        '<div class="quiz-challenge-options"></div>' +
        '<div class="quiz-challenge-result"></div>';

      overlay.appendChild(panel);

      // 退出按钮
      panel.querySelector('.quiz-challenge-exit-btn').addEventListener('click', function () {
        QuizManager.exitChallenge();
      });

      return overlay;
    },

    /**
     * 显示指定索引的题目
     * @param {number} index - 题目索引
     */
    showQuestion: function (index) {
      var panel = quizChallengeOverlay.querySelector('.quiz-challenge-panel');
      var q = currentChallenge.questions[index];
      if (!q) return;

      currentChallenge.currentIndex = index;
      currentChallenge.isAnswering = false;

      // 进度指示器
      panel.querySelector('.quiz-challenge-progress').textContent =
        '\u7B2C ' + (index + 1) + '/' + currentChallenge.totalQuestions + ' \u9898';

      // 星级标识
      var hero = currentChallenge.hero;
      panel.querySelector('.quiz-challenge-stars').textContent =
        starsDisplay(hero.overallStars || 1);

      // 题目（带拼音）
      var questionEl = panel.querySelector('.quiz-challenge-question');
      if (typeof pinyinHelper !== 'undefined' && pinyinHelper.available) {
        questionEl.innerHTML = pinyinHelper.annotateText(q.question, { className: 'quiz-pinyin' });
      } else {
        questionEl.textContent = q.question;
      }

      // 清空结果区
      var resultEl = panel.querySelector('.quiz-challenge-result');
      resultEl.textContent = '';
      resultEl.className = 'quiz-challenge-result';

      // 选项按钮（A/B/C/D，带拼音）
      var optionsContainer = panel.querySelector('.quiz-challenge-options');
      optionsContainer.innerHTML = '';

      var labels = ['A', 'B', 'C', 'D'];
      q.options.forEach(function (option, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-challenge-option-btn';
        var optionHtml = option;
        if (typeof pinyinHelper !== 'undefined' && pinyinHelper.available) {
          optionHtml = pinyinHelper.annotateText(option, { className: 'quiz-pinyin' });
        }
        btn.innerHTML = '<span class="quiz-option-label">' + labels[i] + '</span><span class="quiz-option-text">' + optionHtml + '</span>';
        btn.dataset.index = i;

        btn.addEventListener('click', function () {
          QuizManager.handleChallengeAnswer(i);
        });

        optionsContainer.appendChild(btn);
      });
    },

    /**
     * 处理挑战中的答题
     * @param {number} selectedIndex - 用户选择的选项索引
     */
    handleChallengeAnswer: function (selectedIndex) {
      if (currentChallenge.isAnswering) return;
      currentChallenge.isAnswering = true;

      var panel = quizChallengeOverlay.querySelector('.quiz-challenge-panel');
      var q = currentChallenge.questions[currentChallenge.currentIndex];
      var resultEl = panel.querySelector('.quiz-challenge-result');
      var buttons = panel.querySelectorAll('.quiz-challenge-option-btn');

      // 禁用所有按钮
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
      }

      if (selectedIndex === q.answerIndex) {
        // 答对
        buttons[selectedIndex].classList.add('correct');

        // 更新连胜计数
        var streak = getStreak();
        streak++;
        setStreak(streak);
        updateMaxStreak(streak);

        var nextIndex = currentChallenge.currentIndex + 1;

        if (nextIndex >= currentChallenge.totalQuestions) {
          // 全部答对 - 解锁成功（两阶段动画）
          var heroName = currentChallenge.hero.name;
          resultEl.innerHTML = '<div class="unlock-success-title">\u606D\u559C\u89E3\u9501\uFF01</div><div class="unlock-success-name">' + heroName + '</div>';
          resultEl.className = 'quiz-challenge-result success unlock-success';

          // 阶段1：播放金色粒子动画（答题面板内）
          this.playUnlockAnimation();

          // 延迟后解锁英雄并关闭面板（触发阶段2：卡片翻转动画）
          currentChallenge._timers.push(setTimeout(function () {
            // 解锁英雄（触发 heroUnlocked 事件 → 卡片 cardRefresh 动画）
            // 保存解锁来源（从图鉴或卡片）
            sessionStorage.setItem('shuihu_unlocked_source', sessionStorage.getItem('shuihu_unlocked_source') || 'card');
            if (typeof UnlockManager !== 'undefined') {
              UnlockManager.unlock(heroName);
            }

            // 检查成就（优先 V2）
            if (typeof AchievementManagerV2 !== 'undefined') {
              AchievementManagerV2.checkAchievements();
            } else if (typeof AchievementManager !== 'undefined') {
              AchievementManager.checkAchievements();
            }

            // 关闭答题面板
            QuizManager.closeChallenge();
          }, 2000));
        } else {
          // 进入下一题（0.8秒延迟）
          currentChallenge._timers.push(setTimeout(function () {
            QuizManager.showQuestion(nextIndex);
          }, 800));
        }
      } else {
        // 答错
        buttons[selectedIndex].classList.add('wrong');
        buttons[q.answerIndex].classList.add('correct');

        // 重置连胜计数
        setStreak(0);

        // 检查成就（优先 V2）
        if (typeof AchievementManagerV2 !== 'undefined') {
          AchievementManagerV2.checkAchievements();
        } else if (typeof AchievementManager !== 'undefined') {
          AchievementManager.checkAchievements();
        }

        // 显示正确答案
        var correctAnswer = q.options[q.answerIndex];
        resultEl.innerHTML = '\u6311\u6218\u5931\u8D25<br><span class="correct-answer-hint">\u6B63\u786E\u7B54\u6848\uFF1A' + correctAnswer + '</span>';
        resultEl.className = 'quiz-challenge-result fail';

        // 2秒后显示重试按钮
        currentChallenge._timers.push(setTimeout(function () {
          resultEl.innerHTML = '\u6311\u6218\u5931\u8D25<br><span class="correct-answer-hint">\u6B63\u786E\u7B54\u6848\uFF1A' + correctAnswer + '</span><br><button class="quiz-retry-btn" type="button">\u518D\u6765\u4E00\u6B21</button>';
          resultEl.querySelector('.quiz-retry-btn').addEventListener('click', function () {
            QuizManager.retryChallenge();
          });
        }, 2000));
      }
    },

    /**
     * 重新挑战（重新生成题目）
     */
    retryChallenge: function () {
      var hero = currentChallenge.hero;
      if (!hero) return;

      var stars = hero.overallStars || 1;
      var questions = generateQuestions(hero, stars);
      if (questions.length === 0) return;

      currentChallenge.questions = questions;
      currentChallenge.currentIndex = 0;
      currentChallenge.totalQuestions = stars;
      currentChallenge.isAnswering = false;

      this.showQuestion(0);
    },

    /**
     * 播放金色粒子动画
     */
    playUnlockAnimation: function () {
      var panel = quizChallengeOverlay.querySelector('.quiz-challenge-panel');
      var particleCount = 30;

      for (var i = 0; i < particleCount; i++) {
        var particle = document.createElement('div');
        particle.className = 'quiz-particle';
        particle.style.left = (50 + (Math.random() - 0.5) * 80) + '%';
        particle.style.top = '50%';
        particle.style.animationDelay = (Math.random() * 0.6) + 's';
        // 金色系粒子
        var colors = ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520', '#F0E68C'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        panel.appendChild(particle);

        (function (p) {
          setTimeout(function () {
            if (p.parentNode) p.parentNode.removeChild(p);
          }, 2000);
        })(particle);
      }
    },

    /**
     * 关闭英雄介绍面板
     */
    closeIntro: function () {
      if (!quizIntroOverlay) return;
      quizIntroOverlay.classList.remove('active');
      document.body.style.overflow = '';
    },

    /**
     * 安全退出答题（清理所有状态和定时器）
     */
    exitChallenge: function () {
      // 清除所有 pending 定时器
      if (currentChallenge._timers) {
        for (var i = 0; i < currentChallenge._timers.length; i++) {
          clearTimeout(currentChallenge._timers[i]);
        }
        currentChallenge._timers = [];
      }

      // 重置答题状态
      currentChallenge.isAnswering = false;
      currentChallenge.currentIndex = 0;

      // 隐藏面板
      if (quizChallengeOverlay) {
        quizChallengeOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    },

    /**
     * 关闭答题面板
     */
    closeChallenge: function () {
      if (!quizChallengeOverlay) return;
      quizChallengeOverlay.classList.remove('active');
      document.body.style.overflow = '';
      currentChallenge.isAnswering = false;
    }
  };

  // 重写 showQuiz 方法，在调用前保存 hero 到 currentChallenge
  var _originalShowQuiz = QuizManager.showQuiz;
  QuizManager.showQuiz = function (hero) {
    if (!hero) return;
    currentChallenge.hero = hero;
    _originalShowQuiz.call(this, hero);
  };

  // ==================== EndlessManager - 无尽挑战模式 ====================

  var endlessOverlay = null; // 无尽模式面板 DOM

  // 无尽模式状态
  var endlessState = {
    score: 0,
    streak: 0,
    highScore: 0,
    isPlaying: false,
    isAnswering: false,
    questionPool: [],
    usedQuestionTexts: new Set(),
    currentPoolIndex: 0
  };

  var ENDLESS_HIGHSCORE_KEY = 'shuihu_endless_highscore';

  /**
   * 生成无尽模式题目池
   * 规则：
   * 1. 108名英雄全覆盖，随机顺序
   * 2. 每个英雄提供多种题型，确保题目不重复
   * 3. 6种题型：绰号题、星位题、事迹题、结局题、武器题、职务题
   */
  function generateEndlessQuestionPool() {
    var pool = [];
    var allHeroes = shuffle(heroesData.shuipo.slice());
    var questionTypes = ['nickname', 'star', 'story', 'ending', 'weapon', 'position'];

    for (var i = 0; i < allHeroes.length; i++) {
      var hero = allHeroes[i];
      for (var j = 0; j < questionTypes.length; j++) {
        var type = questionTypes[j];
        var q = generateQuestionByType(hero, type);
        if (q && validateQuestion(q)) {
          pool.push(q);
        }
      }
    }

    return shuffle(pool);
  }

  var EndlessManager = {

    /**
     * 显示无尽挑战模式入口
     * 前提：全部108将解锁后可用
     */
    showEndless: function () {
      // 检查是否全部解锁
      if (typeof UnlockManager !== 'undefined' && UnlockManager.getUnlockedCount() < 108) {
        var unlockedCount = UnlockManager.getUnlockedCount();
        // 显示提示信息
        var msg = document.createElement('div');
        msg.className = 'endless-locked-toast';
        msg.textContent = '\u89E3\u9501\u5168\u90E8\u82F1\u96C4\u540E\u5F00\u653E\uFF08\u5DF2\u89E3\u9501 ' + unlockedCount + '/108\uFF09';
        document.body.appendChild(msg);
        // 触发动画
        requestAnimationFrame(function () {
          msg.classList.add('show');
        });
        // 2秒后移除
        setTimeout(function () {
          msg.classList.remove('show');
          setTimeout(function () {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
          }, 400);
        }, 2000);
        return;
      }

      // 创建或复用面板
      if (!endlessOverlay) {
        endlessOverlay = this.createEndlessOverlay();
        document.body.appendChild(endlessOverlay);
      }

      // 重置状态
      endlessState.score = 0;
      endlessState.streak = 0;
      endlessState.isPlaying = true;
      endlessState.isAnswering = false;
      endlessState.questionPool = generateEndlessQuestionPool();
      endlessState.usedQuestionTexts = new Set();
      endlessState.currentPoolIndex = 0;

      // 读取最高分
      try {
        var val = parseInt(localStorage.getItem(ENDLESS_HIGHSCORE_KEY), 10);
        endlessState.highScore = isNaN(val) ? 0 : val;
      } catch (e) {
        endlessState.highScore = 0;
      }

      // 显示第一题
      this.showEndlessQuestion();

      // 显示面板
      endlessOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    /**
     * 创建无尽模式面板 DOM
     * @returns {HTMLElement} 遮罩元素
     */
    createEndlessOverlay: function () {
      var overlay = document.createElement('div');
      overlay.className = 'endless-overlay';

      var panel = document.createElement('div');
      panel.className = 'endless-panel';

      panel.innerHTML =
        '<div class="endless-header">' +
          '<div class="endless-score-area">' +
            '<div class="endless-current-score"></div>' +
            '<div class="endless-streak"></div>' +
            '<div class="endless-high-score"></div>' +
          '</div>' +
          '<button class="endless-close-btn" type="button" aria-label="关闭">&times;</button>' +
        '</div>' +
        '<div class="endless-question"></div>' +
        '<div class="endless-options"></div>' +
        '<div class="endless-result"></div>';

      overlay.appendChild(panel);

      // 关闭按钮
      panel.querySelector('.endless-close-btn').addEventListener('click', function () {
        EndlessManager.closeEndless();
      });

      // 点击遮罩不关闭（游戏中不允许退出）

      return overlay;
    },

    /**
     * 更新无尽模式顶部信息
     */
    updateEndlessHeader: function () {
      var panel = endlessOverlay.querySelector('.endless-panel');
      panel.querySelector('.endless-current-score').textContent = '\u5F97\u5206\uFF1A' + endlessState.score;
      panel.querySelector('.endless-streak').textContent = '\u8FDE\u5BF9\uFF1A' + endlessState.streak;
      panel.querySelector('.endless-high-score').textContent = '\u6700\u9AD8\u5206\uFF1A' + endlessState.highScore;
    },

    /**
     * 显示无尽模式题目
     */
    showEndlessQuestion: function () {
      var panel = endlessOverlay.querySelector('.endless-panel');
      var q = null;

      // 从题目池中获取下一题，确保题目不重复
      while (endlessState.currentPoolIndex < endlessState.questionPool.length) {
        var candidate = endlessState.questionPool[endlessState.currentPoolIndex];
        endlessState.currentPoolIndex++;

        if (!endlessState.usedQuestionTexts.has(candidate.question)) {
          q = candidate;
          endlessState.usedQuestionTexts.add(candidate.question);
          break;
        }
      }

      // 如果题目池用完了，重新生成新的题目池
      if (!q) {
        endlessState.questionPool = generateEndlessQuestionPool();
        endlessState.currentPoolIndex = 0;
        while (endlessState.currentPoolIndex < endlessState.questionPool.length) {
          var candidate = endlessState.questionPool[endlessState.currentPoolIndex];
          endlessState.currentPoolIndex++;

          if (!endlessState.usedQuestionTexts.has(candidate.question)) {
            q = candidate;
            endlessState.usedQuestionTexts.add(candidate.question);
            break;
          }
        }
      }

      if (!q) {
        // 极端情况，退回到随机出题
        var heroes = getHeroes();
        var hero = heroes[Math.floor(Math.random() * heroes.length)];
        var generators = getAvailableGenerators(hero);
        var gen = generators[Math.floor(Math.random() * generators.length)];
        q = gen(hero);
      }

      endlessState.isAnswering = false;

      // 更新顶部信息
      this.updateEndlessHeader();

      // 清空结果区
      var resultEl = panel.querySelector('.endless-result');
      resultEl.textContent = '';
      resultEl.className = 'endless-result';

      // 题目
      panel.querySelector('.endless-question').textContent = q.question;

      // 选项按钮
      var optionsContainer = panel.querySelector('.endless-options');
      optionsContainer.innerHTML = '';

      var labels = ['A', 'B', 'C', 'D'];
      q.options.forEach(function (option, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'endless-option-btn';
        btn.innerHTML = '<span class="endless-option-label">' + labels[i] + '</span><span class="endless-option-text">' + option + '</span>';
        btn.dataset.index = i;

        btn.addEventListener('click', function () {
          EndlessManager.handleEndlessAnswer(i, q);
        });

        optionsContainer.appendChild(btn);
      });
    },

    /**
     * 处理无尽模式答题
     * @param {number} selectedIndex - 用户选择的选项索引
     * @param {Object} question - 题目对象
     */
    handleEndlessAnswer: function (selectedIndex, question) {
      if (endlessState.isAnswering) return;
      endlessState.isAnswering = true;

      var panel = endlessOverlay.querySelector('.endless-panel');
      var resultEl = panel.querySelector('.endless-result');
      var buttons = panel.querySelectorAll('.endless-option-btn');

      // 禁用所有按钮
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
      }

      if (selectedIndex === question.answerIndex) {
        // 答对
        buttons[selectedIndex].classList.add('correct');

        endlessState.streak++;
        endlessState.score += 10;

        // 连对加成
        var bonus = 0;
        if (endlessState.streak === 3) bonus = 50;
        else if (endlessState.streak === 5) bonus = 100;
        else if (endlessState.streak === 10) bonus = 300;
        // 超过10题后每10题额外加成
        else if (endlessState.streak > 10 && endlessState.streak % 10 === 0) bonus = 300;

        if (bonus > 0) {
          endlessState.score += bonus;
          resultEl.textContent = '+10 \u8FDE\u5BF9' + endlessState.streak + '\u9898\uFF01\u989D\u5916+' + bonus;
        } else {
          resultEl.textContent = '+10';
        }
        resultEl.className = 'endless-result correct';

        // 更新最高分
        if (endlessState.score > endlessState.highScore) {
          endlessState.highScore = endlessState.score;
          try {
            localStorage.setItem(ENDLESS_HIGHSCORE_KEY, String(endlessState.highScore));
          } catch (e) { /* 忽略 */ }
        }

        // 更新连胜
        setStreak(endlessState.streak);
        updateMaxStreak(endlessState.streak);

        // 检查成就（优先 V2）
        if (typeof AchievementManagerV2 !== 'undefined') {
          AchievementManagerV2.checkAchievements();
        } else if (typeof AchievementManager !== 'undefined') {
          AchievementManager.checkAchievements();
        }

        // 0.8秒后进入下一题
        setTimeout(function () {
          if (endlessState.isPlaying) {
            EndlessManager.showEndlessQuestion();
          }
        }, 800);

      } else {
        // 答错 - 游戏结束
        buttons[selectedIndex].classList.add('wrong');
        buttons[question.answerIndex].classList.add('correct');

        endlessState.isPlaying = false;

        // 重置连胜
        setStreak(0);

        // 更新最高分
        if (endlessState.score > endlessState.highScore) {
          endlessState.highScore = endlessState.score;
          try {
            localStorage.setItem(ENDLESS_HIGHSCORE_KEY, String(endlessState.highScore));
          } catch (e) { /* 忽略 */ }
        }

        // 显示结算
        setTimeout(function () {
          resultEl.className = 'endless-result gameover';
          resultEl.innerHTML =
            '<div class="endless-final-score">\u603B\u5206\uFF1A' + endlessState.score + '</div>' +
            '<div class="endless-final-high">\u5386\u53F2\u6700\u9AD8\uFF1A' + endlessState.highScore + '</div>' +
            '<button class="endless-retry-btn" type="button">\u518D\u6765\u4E00\u6B21</button>';

          resultEl.querySelector('.endless-retry-btn').addEventListener('click', function () {
            EndlessManager.showEndless();
          });
        }, 1000);
      }
    },

    /**
     * 关闭无尽模式面板
     */
    closeEndless: function () {
      if (!endlessOverlay) return;
      endlessOverlay.classList.remove('active');
      document.body.style.overflow = '';
      endlessState.isPlaying = false;
    }
  };

  // ==================== CollectionManager - 图鉴系统 ====================

  var collectionOverlay = null; // 图鉴弹窗 DOM
  var currentCollectionTab = 'all'; // 当前选中的 tab

  var CollectionManager = {

    /**
     * 打开图鉴弹窗
     */
    showCollection: function () {
      if (!collectionOverlay) {
        collectionOverlay = this.createCollectionOverlay();
        document.body.appendChild(collectionOverlay);
      }

      // 渲染当前 tab 的内容
      this.renderCollectionGrid();

      // 显示弹窗
      collectionOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    /**
     * 创建图鉴弹窗 DOM 结构
     * @returns {HTMLElement} 遮罩元素
     */
    createCollectionOverlay: function () {
      var overlay = document.createElement('div');
      overlay.className = 'collection-overlay';

      var panel = document.createElement('div');
      panel.className = 'collection-panel';

      panel.innerHTML =
        '<div class="collection-header">' +
          '<h3 class="collection-title">\u82F1\u96C4\u56FE\u9274</h3>' +
          '<div class="collection-progress"></div>' +
          '<button class="collection-close-btn" type="button" aria-label="\u5173\u95ED">&times;</button>' +
        '</div>' +
        '<div class="collection-tabs">' +
          '<button class="collection-tab active" data-tab="all" type="button">\u5168\u90E8</button>' +
          '<button class="collection-tab" data-tab="tiangang" type="button">\u5929\u7F63\u661F</button>' +
          '<button class="collection-tab" data-tab="disha" type="button">\u5730\u715E\u661F</button>' +
        '</div>' +
        '<div class="collection-body">' +
          '<div class="collection-grid"></div>' +
        '</div>';

      overlay.appendChild(panel);

      // 点击遮罩关闭
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          CollectionManager.closeCollection();
        }
      });

      // 关闭按钮
      panel.querySelector('.collection-close-btn').addEventListener('click', function () {
        CollectionManager.closeCollection();
      });

      // Tab 切换事件
      var tabs = panel.querySelectorAll('.collection-tab');
      for (var i = 0; i < tabs.length; i++) {
        (function (tab) {
          tab.addEventListener('click', function () {
            for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
            tab.classList.add('active');
            currentCollectionTab = tab.dataset.tab;
            CollectionManager.renderCollectionGrid();
          });
        })(tabs[i]);
      }

      // ESC 关闭
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          CollectionManager.closeCollection();
        }
      });

      return overlay;
    },

    /**
     * 渲染图鉴网格
     */
    renderCollectionGrid: function () {
      if (!collectionOverlay) return;

      var panel = collectionOverlay.querySelector('.collection-panel');
      var heroes = getHeroes();
      var unlockedList = (typeof UnlockManager !== 'undefined') ? UnlockManager.getAllUnlocked() : [];

      // 根据 tab 过滤
      var filtered = heroes;
      if (currentCollectionTab === 'tiangang') {
        filtered = heroes.filter(function (h) { return isTiangang(h); });
      } else if (currentCollectionTab === 'disha') {
        filtered = heroes.filter(function (h) { return !isTiangang(h); });
      }

      // 更新进度信息
      var unlockedInFilter = filtered.filter(function (h) {
        return unlockedList.indexOf(h.name) !== -1;
      });
      panel.querySelector('.collection-progress').textContent =
        '\u5DF2\u6536\u96C6 ' + unlockedInFilter.length + ' / ' + filtered.length;

      // 渲染网格
      var grid = panel.querySelector('.collection-grid');
      grid.innerHTML = '';

      for (var i = 0; i < filtered.length; i++) {
        (function (hero) {
          var isUnlocked = unlockedList.indexOf(hero.name) !== -1;
          var item = document.createElement('button');
          item.type = 'button';
          item.className = 'collection-item' + (isUnlocked ? ' unlocked' : ' locked');

          if (isUnlocked) {
            // 已解锁：显示彩色头像
            item.innerHTML =
              '<img class="collection-avatar" src="' + hero.portrait + '" alt="' + hero.name + '" loading="lazy">' +
              '<div class="collection-name">' + hero.name + '</div>' +
              '<div class="collection-nickname">' + (hero.nickname || '') + '</div>';

            // 图片加载失败回退
            var img = item.querySelector('.collection-avatar');
            img.onerror = function () {
              this.onerror = null;
              this.src = 'assets/img/portraits/108\u5C06/' + hero.name + '.jpg';
            };

            // 点击查看详情
            item.addEventListener('click', function () {
              sessionStorage.setItem('shuihu_unlocked_source', 'collection');
              CollectionManager.closeCollection();
              if (typeof showCardDetail === 'function') {
                showCardDetail(hero);
              }
            });
          } else {
            // 未解锁：显示锁定模板图，不显示锁图标
            item.innerHTML =
              '<img class="collection-avatar" src="assets/img/locked-hero.png" alt="\u672A\u89E3\u9501" loading="lazy">' +
              '<div class="collection-name">???</div>' +
              '<div class="collection-nickname">' + (hero.star || '') + '</div>';

            // 点击弹出问答
            item.addEventListener('click', function () {
              CollectionManager.closeCollection();
              QuizManager.showQuiz(hero);
            });
          }

          grid.appendChild(item);
        })(filtered[i]);
      }
    },

    /**
     * 关闭图鉴弹窗
     */
    closeCollection: function () {
      if (!collectionOverlay) return;
      collectionOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // ==================== AchievementManager - 成就系统 ====================

  var ACHIEVEMENT_STORAGE_KEY = 'shuihu_achievements';
  var achievementOverlay = null; // 成就弹窗 DOM

  // 成就定义列表（9个）
  var ACHIEVEMENTS = [
    {
      id: 'first_hero',
      name: '\u521D\u5165\u6C5F\u6E56',
      desc: '\u89E3\u9501\u7B2C1\u5F20\u5361',
      icon: '\u2694\uFE0F', // ⚔️
      check: function () {
        return typeof UnlockManager !== 'undefined' && UnlockManager.getUnlockedCount() >= 1;
      }
    },
    {
      id: 'tiangang_collector',
      name: '\u5929\u7F63\u6536\u96C6\u8005',
      desc: '\u96C6\u9F5036\u5929\u7F63',
      icon: '\uD83C\uDF1F', // 🌟
      check: function () {
        if (typeof UnlockManager === 'undefined') return false;
        var unlocked = UnlockManager.getAllUnlocked();
        var heroes = getHeroes();
        var count = 0;
        for (var i = 0; i < heroes.length; i++) {
          if (isTiangang(heroes[i]) && unlocked.indexOf(heroes[i].name) !== -1) {
            count++;
          }
        }
        return count >= 36;
      }
    },
    {
      id: 'disha_collector',
      name: '\u5730\u715E\u6536\u96C6\u8005',
      desc: '\u96C6\u9F5072\u5730\u715E',
      icon: '\uD83C\uDF19', // 🌙
      check: function () {
        if (typeof UnlockManager === 'undefined') return false;
        var unlocked = UnlockManager.getAllUnlocked();
        var heroes = getHeroes();
        var count = 0;
        for (var i = 0; i < heroes.length; i++) {
          if (!isTiangang(heroes[i]) && unlocked.indexOf(heroes[i].name) !== -1) {
            count++;
          }
        }
        return count >= 72;
      }
    },
    {
      id: 'martial_peak',
      name: '\u6B66\u529B\u5DC5\u5CF0',
      desc: '\u96C6\u9F50\u6240\u67095\u661F\u82F1\u96C4',
      icon: '\uD83D\uDCAA', // 💪
      check: function () {
        if (typeof UnlockManager === 'undefined') return false;
        var unlocked = UnlockManager.getAllUnlocked();
        var heroes = getHeroes();
        var fiveStarHeroes = heroes.filter(function (h) { return h.overallStars === 5; });
        for (var i = 0; i < fiveStarHeroes.length; i++) {
          if (unlocked.indexOf(fiveStarHeroes[i].name) === -1) {
            return false;
          }
        }
        return fiveStarHeroes.length > 0;
      }
    },
    {
      id: 'shuihu_master',
      name: '\u6C34\u6D74\u901A',
      desc: '\u5168\u90E8108\u5C06\u89E3\u9501',
      icon: '\uD83D\uDC51', // 👑
      check: function () {
        return typeof UnlockManager !== 'undefined' && UnlockManager.getUnlockedCount() >= 108;
      }
    },
    {
      id: 'streak_10',
      name: '\u8FDE\u80DC\u65B0\u661F',
      desc: '\u6700\u9AD8\u8FDE\u7EED\u7B54\u5BF910\u9898',
      icon: '\uD83D\uDD25', // 🔥
      check: function () {
        return getMaxStreak() >= 10;
      }
    },
    {
      id: 'streak_20',
      name: '\u5E38\u80DC\u5C06\u519B',
      desc: '\u6700\u9AD8\u8FDE\u7EED\u7B54\u5BF920\u9898',
      icon: '\uD83D\uDC8E', // 💎
      check: function () {
        return getMaxStreak() >= 20;
      }
    },
    {
      id: 'streak_30',
      name: '\u65E0\u654C\u5B66\u8005',
      desc: '\u6700\u9AD8\u8FDE\u7EED\u7B54\u5BF930\u9898',
      icon: '\uD83C\uDFC6', // 🏆
      check: function () {
        return getMaxStreak() >= 30;
      }
    },
    {
      id: 'streak_50',
      name: '\u6C34\u6D74\u7B2C\u4E00',
      desc: '\u6700\u9AD8\u8FDE\u7EED\u7B54\u5BF950\u9898',
      icon: '\uD83D\uDCAB', // 💫
      check: function () {
        return getMaxStreak() >= 50;
      }
    }
  ];

  var AchievementManager = {

    /**
     * 从 localStorage 加载已获得的成就列表
     * @returns {string[]} 已获得的成就 id 数组
     */
    loadAchievements: function () {
      try {
        var raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
        if (raw) {
          var data = JSON.parse(raw);
          if (Array.isArray(data)) return data;
        }
      } catch (e) {
        // 解析失败
      }
      return [];
    },

    /**
     * 保存已获得的成就列表到 localStorage
     * @param {string[]} list - 成就 id 数组
     */
    saveAchievements: function (list) {
      localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(list));
    },

    /**
     * 检查并触发成就
     * 遍历所有成就，如果条件满足且尚未获得，则触发成就通知
     */
    checkAchievements: function () {
      var earned = this.loadAchievements();

      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        var ach = ACHIEVEMENTS[i];
        // 如果已经获得，跳过
        if (earned.indexOf(ach.id) !== -1) continue;
        // 检查是否达成
        if (ach.check()) {
          earned.push(ach.id);
          this.saveAchievements(earned);
          this.showAchievementToast(ach);
        }
      }
    },

    /**
     * 显示成就通知（从顶部滑入，3秒后消失）
     * @param {Object} ach - 成就对象
     */
    showAchievementToast: function (ach) {
      var toast = document.createElement('div');
      toast.className = 'achievement-toast';
      toast.innerHTML =
        '<div class="achievement-toast-icon">' + ach.icon + '</div>' +
        '<div class="achievement-toast-body">' +
          '<div class="achievement-toast-label">\u6210\u5C31\u89E3\u9501</div>' +
          '<div class="achievement-toast-name">' + ach.name + '</div>' +
          '<div class="achievement-toast-desc">' + ach.desc + '</div>' +
        '</div>';

      document.body.appendChild(toast);

      // 触发滑入动画（需要一帧延迟）
      requestAnimationFrame(function () {
        toast.classList.add('show');
      });

      // 3秒后滑出并移除
      setTimeout(function () {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(function () {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 500);
      }, 3000);
    },

    /**
     * 显示所有成就弹窗
     */
    showAll: function () {
      if (!achievementOverlay) {
        achievementOverlay = this.createAchievementOverlay();
        document.body.appendChild(achievementOverlay);
      }

      this.renderAchievementList();

      achievementOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    /**
     * 创建成就弹窗 DOM 结构
     * @returns {HTMLElement} 遮罩元素
     */
    createAchievementOverlay: function () {
      var overlay = document.createElement('div');
      overlay.className = 'achievement-overlay';

      var panel = document.createElement('div');
      panel.className = 'achievement-panel';

      panel.innerHTML =
        '<div class="achievement-header">' +
          '<h3 class="achievement-title">\u6210\u5C31\u6BBF\u5802</h3>' +
          '<div class="achievement-summary"></div>' +
          '<button class="achievement-close-btn" type="button" aria-label="\u5173\u95ED">&times;</button>' +
        '</div>' +
        '<div class="achievement-list"></div>';

      overlay.appendChild(panel);

      // 点击遮罩关闭
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          AchievementManager.closeAchievement();
        }
      });

      // 关闭按钮
      panel.querySelector('.achievement-close-btn').addEventListener('click', function () {
        AchievementManager.closeAchievement();
      });

      // ESC 关闭
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          AchievementManager.closeAchievement();
        }
      });

      return overlay;
    },

    /**
     * 渲染成就列表
     */
    renderAchievementList: function () {
      if (!achievementOverlay) return;

      var panel = achievementOverlay.querySelector('.achievement-panel');
      var earned = this.loadAchievements();

      // 更新汇总信息
      panel.querySelector('.achievement-summary').textContent =
        '\u5DF2\u83B7\u5F97 ' + earned.length + ' / ' + ACHIEVEMENTS.length;

      // 渲染列表
      var listEl = panel.querySelector('.achievement-list');
      listEl.innerHTML = '';

      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        (function (ach) {
          var isEarned = earned.indexOf(ach.id) !== -1;
          var item = document.createElement('div');
          item.className = 'achievement-item' + (isEarned ? ' earned' : '');

          item.innerHTML =
            '<div class="achievement-item-icon">' + (isEarned ? ach.icon : '\uD83D\uDD12') + '</div>' +
            '<div class="achievement-item-body">' +
              '<div class="achievement-item-name">' + (isEarned ? ach.name : '???') + '</div>' +
              '<div class="achievement-item-desc">' + ach.desc + '</div>' +
            '</div>' +
            (isEarned ? '<div class="achievement-item-badge">\u5DF2\u8FBE\u6210</div>' : '');

          listEl.appendChild(item);
        })(ACHIEVEMENTS[i]);
      }
    },

    /**
     * 关闭成就弹窗
     */
    closeAchievement: function () {
      if (!achievementOverlay) return;
      achievementOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  // ==================== 暴露到全局 ====================

  window.QuizManager = QuizManager;
  window.CollectionManager = CollectionManager;
  window.AchievementManager = AchievementManager;
  window.EndlessManager = EndlessManager;

})();
