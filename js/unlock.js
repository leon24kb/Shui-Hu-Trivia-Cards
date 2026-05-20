/**
 * unlock.js - 卡片解锁状态管理模块
 * 使用 localStorage 持久化解锁数据
 */
;(function () {
  'use strict';

  // localStorage 存储键名
  var STORAGE_KEY = 'shuihu_unlocked_heroes';

  // 水浒英雄总数
  var TOTAL_HEROES = 108;

  // 默认初始解锁的英雄（全部未解锁）
  var DEFAULT_UNLOCKED = [];

  /**
   * 从 localStorage 读取已解锁列表
   * 如果数据不存在或格式异常，则使用默认值初始化
   * @returns {string[]} 已解锁英雄名称数组
   */
  function loadUnlocked() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (e) {
      // 解析失败，使用默认值
    }
    // 首次访问或数据异常时，写入默认解锁列表
    saveUnlocked(DEFAULT_UNLOCKED);
    return DEFAULT_UNLOCKED.slice();
  }

  /**
   * 将已解锁列表写入 localStorage
   * @param {string[]} list - 已解锁英雄名称数组
   */
  function saveUnlocked(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  // 内存中的已解锁列表缓存
  var unlockedList = loadUnlocked();

  // 全局解锁管理器
  window.UnlockManager = {

    /**
     * 检查指定英雄是否已解锁
     * @param {string} name - 英雄名称
     * @returns {boolean} 是否已解锁
     */
    isUnlocked: function (name) {
      return unlockedList.indexOf(name) !== -1;
    },

    /**
     * 解锁一张英雄卡片
     * @param {string} name - 英雄名称
     * @returns {boolean} true 表示新解锁，false 表示已经解锁过
     */
    unlock: function (name) {
      // 如果已经解锁，直接返回 false
      if (this.isUnlocked(name)) {
        return false;
      }
      // 添加到已解锁列表
      unlockedList.push(name);
      // 持久化存储
      saveUnlocked(unlockedList);
      // 触发自定义事件 'heroUnlocked'
      var event = new CustomEvent('heroUnlocked', {
        detail: { name: name }
      });
      window.dispatchEvent(event);
      return true;
    },

    /**
     * 获取已解锁英雄数量
     * @returns {number} 已解锁数量
     */
    getUnlockedCount: function () {
      return unlockedList.length;
    },

    /**
     * 获取英雄总数
     * @returns {number} 总数 108
     */
    getTotalCount: function () {
      return TOTAL_HEROES;
    },

    /**
     * 获取解锁进度百分比
     * @returns {number} 进度百分比（0 ~ 100，保留两位小数）
     */
    getProgress: function () {
      var percent = (unlockedList.length / TOTAL_HEROES) * 100;
      return Math.round(percent * 100) / 100;
    },

    /**
     * 获取所有已解锁英雄的名称数组
     * @returns {string[]} 已解锁英雄名称数组（副本）
     */
    getAllUnlocked: function () {
      return unlockedList.slice();
    },

    /**
     * 重置所有解锁进度（仅用于调试）
     * 恢复为默认的 3 张初始卡片
     */
    reset: function () {
      unlockedList = DEFAULT_UNLOCKED.slice();
      saveUnlocked(unlockedList);
    }
  };
})();
