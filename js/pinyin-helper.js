/**
 * 名著英雄传 - 拼音注音助手
 * 使用 pinyin-pro 库为所有汉字添加拼音标注
 * 采用动态加载方式，不阻塞页面渲染
 */

class PinyinHelper {
    constructor() {
        this.available = false;
        this.ready = false;
        this.pendingQueue = [];
    }

    /**
     * 动态加载 pinyin-pro 库
     * @returns {Promise<boolean>}
     */
    async load() {
        if (this.ready) return this.available;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pinyin-pro/3.26.0/index.js';

            const timeout = setTimeout(() => {
                console.warn('pinyin-pro 库加载超时，拼音注音功能不可用');
                this.ready = true;
                this.available = false;
                this._processQueue();
                resolve(false);
            }, 8000);

            script.onload = () => {
                clearTimeout(timeout);
                this.available = typeof pinyinPro !== 'undefined';
                this.ready = true;
                if (this.available) {
                    console.log('pinyin-pro 库加载成功');
                } else {
                    console.warn('pinyin-pro 库加载完成但全局变量不可用');
                }
                this._processQueue();
                resolve(this.available);
            };

            script.onerror = () => {
                clearTimeout(timeout);
                console.warn('pinyin-pro 库加载失败，拼音注音功能不可用');
                this.ready = true;
                this.available = false;
                this._processQueue();
                resolve(false);
            };

            document.head.appendChild(script);
        });
    }

    _processQueue() {
        this.pendingQueue.forEach(cb => cb(this.available));
        this.pendingQueue = [];
    }

    async waitForReady() {
        if (this.ready) return this.available;
        return new Promise((resolve) => {
            this.pendingQueue.push(resolve);
        });
    }

    /**
     * 判断字符是否为汉字
     */
    isChinese(char) {
        const code = char.charCodeAt(0);
        return code >= 0x4E00 && code <= 0x9FFF;
    }

    /**
     * 为文本中所有汉字添加拼音标注（使用 type:'all' 精确匹配每个字符）
     * @param {string} text - 原始文本
     * @param {Object} options - 配置选项
     * @returns {string} - 带拼音标注的HTML
     */
    annotateText(text, options = {}) {
        if (!this.available || !text) return text;

        const { className = 'pinyin-char' } = options;

        try {
            // 使用 type:'all' 模式：返回每个字符的完整信息，包含 isZh 标志
            // 这样可以精确匹配每个字符与其拼音，避免非汉字字符导致索引错位
            const allData = pinyinPro.pinyin(text, {
                toneType: 'symbol',
                type: 'all'
            });

            let result = '';

            for (let i = 0; i < allData.length; i++) {
                const item = allData[i];
                const char = item.origin;

                if (item.isZh) {
                    result += `<ruby class="${className}">${char}<rt>${item.pinyin}</rt></ruby>`;
                } else {
                    result += char;
                }
            }

            return result;
        } catch (e) {
            return text;
        }
    }
}

// 创建全局实例
const pinyinHelper = new PinyinHelper();
