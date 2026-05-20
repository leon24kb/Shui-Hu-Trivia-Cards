/**
 * 名著英雄传 - 卡片组件
 * HeroCard 类：负责渲染单张人物卡片的正反面
 */
class HeroCard {
    constructor(hero, options = {}) {
        this.hero = hero;
        this.options = options;
        this.element = this.createCard();
    }

    createCard() {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.dataset.book = 'shuipo';
        card.dataset.rank = this.hero.rank;
        card.dataset.name = this.hero.name;

        // 检查解锁状态
        const isUnlocked = typeof UnlockManager !== 'undefined' && UnlockManager.isUnlocked(this.hero.name);
        if (!isUnlocked) {
            card.classList.add('locked');
        }

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    ${this.renderFront()}
                </div>
                <div class="card-back">
                    ${this.renderBack()}
                </div>
            </div>
        `;

        // 点击事件：已解锁则查看详情，未解锁则弹出问答
        card.addEventListener('click', () => {
            if (typeof UnlockManager !== 'undefined' && !UnlockManager.isUnlocked(this.hero.name)) {
                if (typeof QuizManager !== 'undefined') {
                    QuizManager.showQuiz(this.hero);
                }
            } else {
                // 解锁后先刷新卡片内容，再查看详情
                this.refreshCard();
                if (typeof showCardDetail === 'function') {
                    showCardDetail(this.hero);
                }
            }
        });

        return card;
    }

    /**
     * 刷新卡片内容（解锁后重新渲染 card-inner）
     */
    refreshCard() {
        const cardInner = this.element.querySelector('.card-inner');
        if (!cardInner) return;

        // 更新锁定状态
        const isUnlocked = typeof UnlockManager !== 'undefined' && UnlockManager.isUnlocked(this.hero.name);
        if (isUnlocked) {
            this.element.classList.remove('locked');
        }

        // 重新渲染 card-inner 内容
        cardInner.innerHTML = `
            <div class="card-front">
                ${this.renderFront()}
            </div>
            <div class="card-back">
                ${this.renderBack()}
            </div>
        `;

        // 添加刷新动画
        this.element.classList.add('card-refresh');
        setTimeout(() => {
            this.element.classList.remove('card-refresh');
        }, 600);
    }

    /**
     * 渲染卡片正面 - 图片填充，左上角星级竖排，右上角文字竖排
     */
    renderFront() {
        const hero = this.hero;
        const rankChinese = this.numberToChinese(hero.rank);
        const stars = hero.overallStars || 3;
        
        // 检查解锁状态
        const isUnlocked = typeof UnlockManager !== 'undefined' && UnlockManager.isUnlocked(hero.name);
        
        // 未解锁时显示锁定图片和文字
        if (!isUnlocked) {
            return `
                <div class="card-front-content locked-front">
                    <div class="card-image-container">
                        <img src="assets/img/locked-hero.png" alt="待解锁" loading="lazy" class="locked-image">
                    </div>
                    
                    <!-- 锁定文字 -->
                    <div class="locked-text">
                        <span class="locked-text-top">天罡地煞</span>
                        <span class="locked-text-bottom">待解锁</span>
                    </div>
                </div>
            `;
        }

        return `
            <div class="card-front-content">
                <div class="card-image-container">
                    <img src="${hero.portrait}" alt="${hero.name}" loading="lazy" onerror="this.onerror=null; this.src='assets/img/portraits/108将/${hero.name}.jpg'">
                </div>
                
                <!-- 左上角：星级竖排 -->
                <div class="front-stars-vertical">
                    ${'★'.repeat(stars)}
                </div>
                
                <!-- 右上角：两列布局，绰号+姓名在左，座次+星位在右 -->
                <div class="front-info-two-columns">
                    <div class="info-column">
                        <div class="v-text">${hero.nickname}</div>
                        <div class="v-text">${hero.name}</div>
                    </div>
                    <div class="info-column">
                        <div class="v-text">第${rankChinese}位</div>
                        <div class="v-text">${hero.star}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 渲染卡片背面
     */
    renderBack() {
        const hero = this.hero;
        
        // 使用拼音助手处理文本（如果可用）
        const processText = (text) => {
            if (typeof pinyinHelper !== 'undefined' && text) {
                return pinyinHelper.annotateText(text);
            }
            return text;
        };
        
        // 基本信息（不添加拼音，保持简洁）
        const positionHtml = hero.position ? `<div class="info-item"><span class="info-label">职务：</span>${hero.position}</div>` : '';
        const weaponHtml = hero.weapon ? `<div class="info-item"><span class="info-label">武器：</span>${hero.weapon}</div>` : '';
        const skillHtml = hero.skill ? `<div class="info-item"><span class="info-label">必杀技：</span>${hero.skill}</div>` : '';

        // 事迹内容 - 添加拼音注音
        const storyContent = processText(hero.story) || '';
        
        // 结局 - 添加拼音注音
        const endingContent = processText(hero.ending) || '';

        return `
            <div class="card-back-content">
                <div class="back-body">
                    <!-- 基本信息区域 -->
                    <div class="basic-info-compact">
                        ${positionHtml}
                        ${weaponHtml}
                        ${skillHtml}
                    </div>

                    <div class="story-section">
                        <h4>生平事迹</h4>
                        <div class="story-text">${storyContent}</div>
                    </div>

                    <div class="ending-section">
                        <h4>结局</h4>
                        <div class="ending-text">${endingContent}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 数字转中文（简单版，支持1-108）
     */
    numberToChinese(num) {
        if (num <= 0 || num > 108) return String(num);

        const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

        if (num < 10) return digits[num];
        if (num === 10) return '十';
        if (num < 20) return '十' + digits[num % 10];
        if (num < 100) {
            const tens = Math.floor(num / 10);
            const ones = num % 10;
            return digits[tens] + '十' + (ones ? digits[ones] : '');
        }
        if (num === 100) return '一百';
        if (num <= 108) {
            return '一百零' + (num > 100 ? digits[num - 100] : '');
        }
        return String(num);
    }
}
