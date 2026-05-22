/**
 * 名著英雄传 - 主入口
 * 负责初始化应用、渲染卡片、绑定事件
 */
(function () {
    'use strict';

    // 当前显示模式：'sample' 仅显示样板卡片，'all' 显示全部
    let displayMode = 'all';
    // 筛选模式：'all' 显示全部，'unlocked' 只显示已解锁，'locked' 只显示未解锁
    let filterMode = 'all';

    // 样板卡片人物名单（已废弃，现在显示全部108将）
    const sampleHeroes = [];

    // 拼音显示状态
    let pinyinEnabled = true;

    // 卡片详情弹窗相关
    let detailOverlay = null;
    let detailPanel = null;

    // 快速导航相关
    const ITEMS_PER_PAGE = 18; // 每页显示的卡片数量（移动端）
    let currentPage = 1;
    let totalPages = 1;
    const TIANGANG_END = 36; // 天罡星结束位置（按rank）

    // 快速导航工具函数
    function getCardCountPerPage() {
        const width = window.innerWidth;
        if (width <= 480) return 12;
        if (width <= 768) return 18;
        return 24;
    }

    function calculatePages() {
        const cards = document.querySelectorAll('#cardGrid .hero-card:not(.hidden)');
        const perPage = getCardCountPerPage();
        totalPages = Math.max(1, Math.ceil(cards.length / perPage));
        currentPage = Math.min(currentPage, totalPages);
    }

    function scrollToPage(pageNum) {
        const perPage = getCardCountPerPage();
        const cards = document.querySelectorAll('#cardGrid .hero-card:not(.hidden)');
        const index = Math.min((pageNum - 1) * perPage, cards.length - 1);
        if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        currentPage = pageNum;
        updatePageIndicator();
    }

    function toggleUnlockedFilter() {
        const grid = document.getElementById('cardGrid');
        const unlockedBtn = document.getElementById('unlockedBtn');
        const lockedBtn = document.getElementById('lockedBtn');
        
        if (filterMode !== 'unlocked') {
            filterMode = 'unlocked';
            unlockedBtn.classList.add('active');
            lockedBtn.classList.remove('active');
        } else {
            filterMode = 'all';
            unlockedBtn.classList.remove('active');
        }
        
        renderCards(grid, 'random');
    }

    function toggleLockedFilter() {
        const grid = document.getElementById('cardGrid');
        const unlockedBtn = document.getElementById('unlockedBtn');
        const lockedBtn = document.getElementById('lockedBtn');
        
        if (filterMode !== 'locked') {
            filterMode = 'locked';
            lockedBtn.classList.add('active');
            unlockedBtn.classList.remove('active');
        } else {
            filterMode = 'all';
            lockedBtn.classList.remove('active');
        }
        
        renderCards(grid, 'random');
    }

    function updatePageIndicator() {
        const indicator = document.getElementById('pageIndicator');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        if (indicator) {
            indicator.textContent = currentPage + '/' + totalPages;
        }
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }

    /**
     * 初始化应用
     */
    function init() {
        const grid = document.getElementById('cardGrid');
        if (!grid || typeof heroesData === 'undefined') {
            console.error('找不到卡片容器或数据');
            return;
        }

        // 初始随机排序 - 抽卡盲盒感
        renderCards(grid, 'random');
        bindFilterEvents();
        bindSortEvents();
        createPinyinToggle();
        createDetailOverlay();
        createProgressBar();
        createHeaderButtons();
        createQuickNavigation();
        bindUnlockEvents();
        bindScrollEvents();

        // 检查并展示刚解锁的英雄（页面加载时调用）
        setTimeout(checkJustUnlocked, 500);

        // 异步加载拼音库，加载成功后重新渲染带拼音的卡片（保持随机排序）
        if (typeof pinyinHelper !== 'undefined') {
            pinyinHelper.load().then((loaded) => {
                if (loaded) {
                    renderCards(grid, 'random');
                }
            });
        }
    }

    /**
     * 创建快速导航栏（移动端）
     */
    function createQuickNavigation() {
        const nav = document.createElement('div');
        nav.className = 'quick-navigation';
        nav.innerHTML = `
            <button class="nav-btn" id="prevPageBtn" type="button">‹</button>
            <button class="nav-btn unlocked-btn" id="unlockedBtn" type="button">已解锁</button>
            <span class="page-indicator" id="pageIndicator">1/1</span>
            <button class="nav-btn locked-btn" id="lockedBtn" type="button">未解锁</button>
            <button class="nav-btn" id="nextPageBtn" type="button">›</button>
        `;

        // 插入到 app-header 之后
        const appHeader = document.querySelector('.app-header');
        if (appHeader && appHeader.parentNode) {
            appHeader.parentNode.insertBefore(nav, appHeader.nextSibling);
        }

        // 绑定按钮事件
        document.getElementById('prevPageBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage > 1) {
                scrollToPage(currentPage - 1);
            }
        });

        document.getElementById('nextPageBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (currentPage < totalPages) {
                scrollToPage(currentPage + 1);
            }
        });

        document.getElementById('unlockedBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleUnlockedFilter();
        });

        document.getElementById('lockedBtn').addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleLockedFilter();
        });

        // 初始计算
        calculatePages();
        updatePageIndicator();
    }

    /**
     * 绑定滚动事件（用于更新页码）
     */
    function bindScrollEvents() {
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function() {
                const perPage = getCardCountPerPage();
                const cards = document.querySelectorAll('#cardGrid .hero-card:not(.hidden)');
                const scrollTop = window.scrollY;
                const windowHeight = window.innerHeight;

                let newPage = 1;
                for (let i = 0; i < cards.length; i++) {
                    const rect = cards[i].getBoundingClientRect();
                    if (rect.top < windowHeight / 2) {
                        newPage = Math.floor(i / perPage) + 1;
                    }
                }
                if (newPage !== currentPage) {
                    currentPage = Math.max(1, Math.min(newPage, totalPages));
                    updatePageIndicator();
                }
            }, 100);
        });

        // 监听窗口大小变化，重新计算页数
        window.addEventListener('resize', function() {
            calculatePages();
            updatePageIndicator();
        });
    }

    /**
     * 渲染卡片
     * @param {string} sortMode - 排序模式: 'random'(随机/默认) | 'rank'(座次) | 'martial'(武力) | 'star'(星级)
     */
    function renderCards(grid, sortMode = 'random') {
        grid.innerHTML = '';

        let heroes = displayMode === 'sample'
            ? heroesData.shuipo.filter(h => sampleHeroes.includes(h.name))
            : [...heroesData.shuipo]; // 复制数组避免修改原数据

        // 根据筛选模式处理
        if (filterMode === 'unlocked' && typeof UnlockManager !== 'undefined') {
            const unlockedList = UnlockManager.getAllUnlocked();
            heroes = heroes.filter(h => unlockedList.indexOf(h.name) !== -1);
            // 已解锁英雄按星级排序
            heroes.sort((a, b) => (b.overallStars || 0) - (a.overallStars || 0));
        } else if (filterMode === 'locked' && typeof UnlockManager !== 'undefined') {
            const unlockedList = UnlockManager.getAllUnlocked();
            heroes = heroes.filter(h => unlockedList.indexOf(h.name) === -1);
            // 未解锁英雄保持随机排序
            heroes = shuffleArray(heroes);
        } else {
            // 根据排序模式处理
            if (sortMode === 'random') {
                // 随机排序 - 抽卡盲盒感
                heroes = shuffleArray(heroes);
            } else if (sortMode === 'rank') {
                // 按座次排序（只排已解锁）
                heroes = sortByUnlockedFirst(heroes, 'rank');
            } else if (sortMode === 'martial') {
                // 按武力排序（只排已解锁）
                heroes = sortByUnlockedFirst(heroes, 'martial');
            } else if (sortMode === 'star') {
                // 按星级排序（只排已解锁）
                heroes = sortByUnlockedFirst(heroes, 'star');
            }
        }

        heroes.forEach((hero, index) => {
            const card = new HeroCard(hero, { hasImages: true });
            card.element.style.animationDelay = `${index * 0.05}s`;
            grid.appendChild(card.element);
        });

        // 重新计算页数
        currentPage = 1;
        calculatePages();
        updatePageIndicator();
    }

    /**
     * Fisher-Yates 洗牌算法 - 随机排序数组
     */
    function shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    /**
     * 排序：已解锁英雄按指定规则排序，未解锁保持原位
     * @param {Array} heroes - 英雄数组
     * @param {string} sortBy - 排序规则: 'rank' | 'martial' | 'star'
     */
    function sortByUnlockedFirst(heroes, sortBy) {
        if (typeof UnlockManager === 'undefined') return heroes;

        const unlockedList = UnlockManager.getAllUnlocked();
        
        // 分离已解锁和未解锁
        const unlocked = heroes.filter(h => unlockedList.indexOf(h.name) !== -1);
        const locked = heroes.filter(h => unlockedList.indexOf(h.name) === -1);

        // 已解锁按规则排序
        unlocked.sort((a, b) => {
            if (sortBy === 'rank') {
                return a.rank - b.rank;
            } else if (sortBy === 'martial') {
                return (b.stats?.武力 || 0) - (a.stats?.武力 || 0);
            } else if (sortBy === 'star') {
                return (b.overallStars || 0) - (a.overallStars || 0);
            }
            return 0;
        });

        // 已解锁在前，未解锁随机打乱在后（保持盲盒感）
        return [...unlocked, ...shuffleArray(locked)];
    }

    /**
     * 绑定筛选事件
     */
    function bindFilterEvents() {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const filter = e.target.dataset.filter;
                const cards = document.querySelectorAll('.hero-card');

                cards.forEach(card => {
                    if (filter === 'all' || card.dataset.book === filter) {
                        card.classList.remove('hidden');
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }

    /**
     * 绑定排序事件
     * 排序只影响已解锁英雄，未解锁保持随机位置
     */
    function bindSortEvents() {
        const sortBtns = document.querySelectorAll('.sort-btn');
        sortBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                sortBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                const sortBy = e.target.dataset.sort;
                const grid = document.getElementById('cardGrid');
                
                // 使用新的排序逻辑重新渲染
                renderCards(grid, sortBy);
            });
        });
    }

    /**
     * 创建拼音切换按钮和深色模式按钮
     */
    function createPinyinToggle() {
        // 创建按钮容器
        const btnContainer = document.createElement('div');
        btnContainer.className = 'floating-btn-container';

        // ========== 打赏按钮（钱袋） ==========
        const donateBtn = document.createElement('button');
        donateBtn.className = 'donate-toggle';
        donateBtn.innerHTML = '💰 赏';
        donateBtn.title = '打赏支持';

        // 创建精美打赏卡片
        const donateCard = document.createElement('div');
        donateCard.className = 'donate-card';
        donateCard.innerHTML = `
            <button class="donate-card-close" aria-label="关闭">&times;</button>
            <div class="donate-card-header">
                <span class="donate-card-lantern">🏮</span>
                <p class="donate-card-title">江湖救急</p>
                <p class="donate-card-subtitle">全凭哥哥们抬爱</p>
            </div>
            <div class="donate-card-body">
                <img src="assets/img/wechat-reward.png" alt="微信打赏" class="donate-card-qr" />
                <p class="donate-card-qr-label">微信扫码打赏</p>
            </div>
            <div class="donate-card-divider"></div>
            <div class="donate-card-footer">
                <p>银子多少不论</p>
                <p>情义到了便是兄弟</p>
            </div>
        `;

        // 点击按钮切换卡片显示
        donateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = donateCard.classList.contains('visible');
            if (isVisible) {
                donateCard.classList.remove('visible');
            } else {
                donateCard.classList.add('visible');
            }
        });

        // 关闭按钮
        donateCard.querySelector('.donate-card-close').addEventListener('click', (e) => {
            e.stopPropagation();
            donateCard.classList.remove('visible');
        });

        // 点击卡片外部关闭
        document.addEventListener('click', (e) => {
            if (!donateCard.contains(e.target) && e.target !== donateBtn) {
                donateCard.classList.remove('visible');
            }
        });

        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && donateCard.classList.contains('visible')) {
                donateCard.classList.remove('visible');
            }
        });

        btnContainer.appendChild(donateBtn);
        btnContainer.appendChild(donateCard);

        // ========== 拼音切换按钮 ==========
        const toggle = document.createElement('button');
        toggle.className = 'pinyin-toggle';
        toggle.innerHTML = '拼';
        toggle.title = '显示/隐藏拼音';

        toggle.addEventListener('click', () => {
            pinyinEnabled = !pinyinEnabled;
            document.body.classList.toggle('pinyin-hidden', !pinyinEnabled);
            toggle.classList.toggle('active', pinyinEnabled);
            toggle.innerHTML = pinyinEnabled ? '拼' : '文';
        });

        btnContainer.appendChild(toggle);

        // ========== 深色模式按钮 ==========
        const darkModeBtn = document.createElement('button');
        darkModeBtn.className = 'dark-mode-toggle';
        darkModeBtn.innerHTML = '🌙';
        darkModeBtn.title = '切换深色/浅色模式';

        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            darkModeBtn.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
            localStorage.setItem('shuihu_dark_mode', document.body.classList.contains('dark-mode') ? '1' : '0');
        });

        btnContainer.appendChild(darkModeBtn);

        // 恢复深色模式偏好
        if (localStorage.getItem('shuihu_dark_mode') === '1') {
            document.body.classList.add('dark-mode');
            darkModeBtn.innerHTML = '☀️';
        }

        document.body.appendChild(btnContainer);
    }

    /**
     * 创建卡片详情弹窗容器（复用，只创建一次）
     */
    function createDetailOverlay() {
        detailOverlay = document.createElement('div');
        detailOverlay.className = 'card-detail-overlay';
        detailOverlay.innerHTML = `
            <div class="card-detail-panel">
                <button class="card-detail-close" aria-label="关闭">&times;</button>
                <div class="card-detail-header">
                    <div class="card-detail-portrait-wrapper">
                        <img class="card-detail-portrait" src="" alt="">
                        <button class="card-detail-enlarge-btn" type="button">查看大图</button>
                    </div>
                    <div class="card-detail-title">
                        <div class="card-detail-nickname"></div>
                        <div class="card-detail-name"></div>
                        <div class="card-detail-star"></div>
                    </div>
                </div>
                <div class="card-detail-body">
                    <div class="card-detail-info"></div>
                    <div class="card-detail-story-section">
                        <h4>生平事迹</h4>
                        <div class="card-detail-story"></div>
                    </div>
                    <div class="card-detail-ending-section">
                        <h4>结局</h4>
                        <div class="card-detail-ending"></div>
                    </div>
                </div>
            </div>
        `;

        // 点击遮罩关闭
        detailOverlay.addEventListener('click', (e) => {
            if (e.target === detailOverlay) {
                closeCardDetail();
            }
        });

        // 关闭按钮
        var closeBtn = detailOverlay.querySelector('.card-detail-close');
        closeBtn.addEventListener('click', closeCardDetail);

        // 查看大图按钮
        var enlargeBtn = detailOverlay.querySelector('.card-detail-enlarge-btn');
        enlargeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var img = detailOverlay.querySelector('.card-detail-portrait');
            if (img && img.src && img.alt) {
                showFrontImageModal(img.src, img.alt);
            }
        });

        // ESC 关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && detailOverlay.classList.contains('active')) {
                closeCardDetail();
            }
        });

        document.body.appendChild(detailOverlay);
    }

    /**
     * 显示卡片详情弹窗
     */
    function showCardDetail(hero) {
        if (!detailOverlay) return;

        var processText = (text) => {
            if (typeof pinyinHelper !== 'undefined' && text) {
                return pinyinHelper.annotateText(text);
            }
            return text;
        };

        // 填充内容
        var portrait = detailOverlay.querySelector('.card-detail-portrait');
        portrait.src = hero.portrait;
        portrait.alt = hero.name;
        portrait.onerror = function () { this.src = 'assets/img/portraits/108将/' + hero.name + '.jpg'; };

        detailOverlay.querySelector('.card-detail-nickname').textContent = hero.nickname;
        detailOverlay.querySelector('.card-detail-name').textContent = hero.name;
        detailOverlay.querySelector('.card-detail-star').textContent = hero.star + ' · 第' + hero.rank + '位';

        // 基本信息
        let infoHtml = '';
        if (hero.position) infoHtml += `<span class="detail-info-tag">职务：${hero.position}</span>`;
        if (hero.weapon) infoHtml += `<span class="detail-info-tag">武器：${hero.weapon}</span>`;
        if (hero.skill) infoHtml += `<span class="detail-info-tag">必杀技：${hero.skill}</span>`;
        detailOverlay.querySelector('.card-detail-info').innerHTML = infoHtml;

        // 事迹和结局
        detailOverlay.querySelector('.card-detail-story').innerHTML = processText(hero.story) || '';
        detailOverlay.querySelector('.card-detail-ending').innerHTML = processText(hero.ending) || '';

        // 显示弹窗
        detailOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭卡片详情弹窗
     */
    function closeCardDetail() {
        if (!detailOverlay) return;
        detailOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // 暴露给 card.js 调用
    window.showCardDetail = showCardDetail;

    // 正面图片放大模态框相关
    let frontImageModal = null;

    /**
     * 显示正面图片放大模态框
     * @param {string} portraitSrc - 图片路径
     * @param {string} heroName - 英雄名称
     */
    function showFrontImageModal(portraitSrc, heroName) {
        // 如果模态框不存在，创建它
        if (!frontImageModal) {
            frontImageModal = document.createElement('div');
            frontImageModal.className = 'front-image-modal';
            frontImageModal.innerHTML = `
                <div class="front-image-modal-content">
                    <button class="front-image-modal-close" aria-label="关闭">&times;</button>
                    <img src="" alt="">
                    <div class="front-image-modal-title"></div>
                </div>
            `;

            // 点击遮罩关闭
            frontImageModal.addEventListener('click', (e) => {
                if (e.target === frontImageModal) {
                    closeFrontImageModal();
                }
            });
            // 手机端 touch 关闭遮罩
            frontImageModal.addEventListener('touchend', (e) => {
                if (e.target === frontImageModal) {
                    closeFrontImageModal();
                }
            });

            // 关闭按钮
            const closeBtn = frontImageModal.querySelector('.front-image-modal-close');
            closeBtn.addEventListener('click', closeFrontImageModal);
            closeBtn.addEventListener('touchend', function(e) {
                e.preventDefault();
                closeFrontImageModal();
            });

            // ESC 关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && frontImageModal.classList.contains('active')) {
                    closeFrontImageModal();
                }
            });

            document.body.appendChild(frontImageModal);
        }

        // 填充内容
        const img = frontImageModal.querySelector('img');
        img.src = portraitSrc;
        img.alt = heroName;
        img.onerror = function () {
            this.src = 'assets/img/portraits/108将/' + heroName + '.jpg';
        };
        frontImageModal.querySelector('.front-image-modal-title').textContent = heroName;

        // 显示模态框
        frontImageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 关闭正面图片放大模态框
     */
    function closeFrontImageModal() {
        if (!frontImageModal) return;
        frontImageModal.classList.remove('active');
        // 只有当详情弹窗没有打开时才恢复 overflow
        if (!detailOverlay || !detailOverlay.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }

    // 暴露给全局使用
    window.showFrontImageModal = showFrontImageModal;

    /**
     * 创建进度条
     */
    function createProgressBar() {
        if (typeof UnlockManager === 'undefined') return;
        var bar = document.createElement('div');
        bar.className = 'progress-bar';
        bar.id = 'progressBar';
        updateProgressBar();
        // 插入到排序按钮之后，与按钮保持一定距离
        var header = document.querySelector('.app-header');
        if (header) {
            header.appendChild(bar);
        }
    }

    function updateProgressBar() {
        if (typeof UnlockManager === 'undefined') return;
        var bar = document.getElementById('progressBar');
        if (!bar) return;
        var count = UnlockManager.getUnlockedCount();
        var total = UnlockManager.getTotalCount();
        var pct = Math.round((count / total) * 100);
        bar.innerHTML = '<div class="progress-fill" style="width:' + pct + '%"></div><span class="progress-text">' + count + '/' + total + '</span>';
    }

    /**
     * 创建头部功能按钮（图鉴、成就）
     */
    function createHeaderButtons() {
        var container = document.createElement('div');
        container.className = 'header-actions';
        container.innerHTML = '<button class="action-btn" id="btnCollection" type="button">图鉴</button><button class="action-btn" id="btnAchievement" type="button">成就</button><button class="action-btn" id="btnEndless" type="button">挑战</button>';
        var header = document.querySelector('.app-header');
        if (header) {
            header.appendChild(container);
        }

        document.getElementById('btnCollection').addEventListener('click', function() {
            if (typeof CollectionManager !== 'undefined') CollectionManager.showCollection();
        });
        document.getElementById('btnAchievement').addEventListener('click', function() {
            if (typeof AchievementManagerV2 !== 'undefined') {
                AchievementManagerV2.showAll();
            } else if (typeof AchievementManager !== 'undefined') {
                AchievementManager.showAll();
            }
        });
        document.getElementById('btnEndless').addEventListener('click', function() {
            if (typeof EndlessManager !== 'undefined') EndlessManager.showEndless();
        });
    }

    /**
     * 绑定解锁相关事件
     */
    function bindUnlockEvents() {
        // 监听解锁事件，更新进度和检查成就
        // 注意：必须绑定在 window 上，与 UnlockManager.unlock 中的 window.dispatchEvent 一致
        window.addEventListener('heroUnlocked', function(e) {
            updateProgressBar();
            // 存储解锁信息到 sessionStorage
            var name = e.detail.name;
            var source = e.detail.source || 'card'; // 默认从卡片解锁
            sessionStorage.setItem('shuihu_just_unlocked', name);
            sessionStorage.setItem('shuihu_unlocked_source', source);

            // 刷新卡片状态：找到对应卡片，重新创建 HeroCard 实例并替换
            var cardEl = document.querySelector('.hero-card[data-name="' + name + '"]');
            if (cardEl) {
                // 找到对应的英雄数据
                var hero = heroesData.shuipo.find(function(h) { return h.name === name; });
                if (hero) {
                    var newCard = new HeroCard(hero, { hasImages: true });
                    newCard.element.classList.add('card-unlock-highlight');
                    cardEl.replaceWith(newCard.element);
                    // 3秒后移除高亮
                    setTimeout(function() {
                        newCard.element.classList.remove('card-unlock-highlight');
                    }, 2400);
                    // 滚动到卡片可见位置
                    setTimeout(function() {
                        newCard.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            }

            // 检查成就（优先使用 V2）
            setTimeout(function() {
                if (typeof AchievementManagerV2 !== 'undefined') {
                    AchievementManagerV2.checkAchievements();
                } else if (typeof AchievementManager !== 'undefined') {
                    AchievementManager.checkAchievements();
                }
            }, 500);
        });
    }

    /**
     * 检查并展示刚解锁的英雄（页面加载时调用）
     */
    function checkJustUnlocked() {
        var name = sessionStorage.getItem('shuihu_just_unlocked');
        var source = sessionStorage.getItem('shuihu_unlocked_source');

        if (name) {
            // 清除 sessionStorage
            sessionStorage.removeItem('shuihu_just_unlocked');
            sessionStorage.removeItem('shuihu_unlocked_source');

            // 找到对应的英雄卡片
            var cardEl = document.querySelector('.hero-card[data-name="' + name + '"]');
            if (cardEl) {
                // 添加高亮动画
                cardEl.classList.add('card-unlock-highlight');
                // 滚动到卡片位置
                setTimeout(function() {
                    cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // 3秒后移除高亮
                    setTimeout(function() {
                        cardEl.classList.remove('card-unlock-highlight');
                    }, 2400);
                }, 500);

                // 如果是从图鉴解锁，延迟打开详情
                if (source === 'collection') {
                    setTimeout(function() {
                        var hero = heroesData.shuipo.find(function(h) { return h.name === name; });
                        if (hero && typeof showCardDetail === 'function') {
                            showCardDetail(hero);
                        }
                    }, 1000);
                }
            }
        }
    }

    // DOM 加载完成后初始化
    document.addEventListener('DOMContentLoaded', init);
})();
