import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

// 全局变量初始化（避免污染）
let $, parentWindow, UIModule;
let isTheaterInitialized = false;

/**
 * 初始化剧场模块（依赖注入）
 * @param {Object} deps - 依赖对象（jq: jQuery实例, win: 父窗口）
 * @param {Object} ui - UI控制模块
 */
export function initTheater(deps, ui) {
    if (isTheaterInitialized) return;
    // 严格验证依赖，缺失则不初始化
    if (!deps?.jq || !deps?.win || !ui) {
        console.error("Theater模块初始化失败：依赖不完整");
        return;
    }
    $ = deps.jq;
    parentWindow = deps.win;
    UIModule = ui;
    // 初始化状态标记（绑定到模块自身，避免污染全局State）
    this.theaterEventsBound = false;
    this.theaterFirstLoad = true;
    // 注入隔离样式（添加前缀避免冲突）
    injectIsolatedStyles();
    isTheaterInitialized = true;
}

/**
 * 注入隔离样式（添加theater-前缀，避免影响其他元素）
 */
function injectIsolatedStyles() {
    const styleElement = parentWindow.document.createElement('style');
    styleElement.id = 'theater-isolated-style';
    // 样式添加唯一前缀，确保不影响悬浮按钮和模拟器开关
    styleElement.textContent = `
        /* 剧场模块样式（带前缀隔离） */
        #theaterapp-view { height: 100% !important; position: relative; z-index: 10; }
        .theater-footer-nav { position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important; z-index: 15 !important; }
        .theater-app-content { padding-bottom: 60px !important; }
        /* 空容器隐藏（不影响其他元素） */
        #theaterapp-view .theater-app-header:empty,
        #theaterapp-view .theater-footer-nav:empty { display: none !important; }
    `;
    // 确保样式添加到head顶部，避免被其他样式覆盖
    parentWindow.document.head.insertBefore(styleElement, parentWindow.document.head.firstChild);
}

/**
 * 渲染剧场主视图
 * @param {string} initialPage - 初始页面（默认：announcements）
 */
export function renderTheaterView(initialPage = 'announcements') {
    if (!isTheaterInitialized) {
        console.warn("请先调用initTheater初始化模块");
        return;
    }

    // 1. 精准查找面板容器（避免影响其他元素）
    const $panelContainer = $(parentWindow.document.getElementById(PhoneSim_Config.PANEL_ID));
    if ($panelContainer.length === 0) {
        console.error("未找到面板容器，ID：" + PhoneSim_Config.PANEL_ID);
        return;
    }

    // 2. 只创建一个剧场容器（避免重复）
    let $theaterView = $panelContainer.find('#theaterapp-view');
    if ($theaterView.length === 0) {
        $theaterView = $(`
            <div id="theaterapp-view" class="view">
                <!-- 内容将在后续渲染 -->
            </div>
        `);
        $panelContainer.append($theaterView);
    }

    // 3. 渲染视图内容（使用隔离类名）
    $theaterView.empty().append(`
        <div class="theater-app-header">
            <button class="theater-back-btn"><<<i class="fas fa-chevron-left"></</</i></button>
            <h3>欲色剧场</h3>
        </div>
        <div class="theater-app-content">
            <div id="theater-content-container"></div>
        </div>
        <div class="theater-footer-nav">
            <button class="theater-nav-btn" data-page="announcements"><span>📢</span>通告</button>
            <button class="theater-nav-btn" data-page="customizations"><span>💖</span>定制</button>
            <button class="theater-nav-btn" data-page="theater"><span>🎬</span>剧场</button>
            <button class="theater-nav-btn" data-page="shop"><span>🛒</span>商城</button>
        </div>
    `);

    // 4. 绑定事件（仅一次）
    if (!this.theaterEventsBound) {
        bindTheaterEvents($theaterView);
        this.theaterEventsBound = true;
    }

    // 5. 首次加载时渲染初始页面
    if (this.theaterFirstLoad) {
        switchTheaterPage(initialPage);
        updateTheaterNav(initialPage);
        this.theaterFirstLoad = false;
    }
}

/**
 * 绑定剧场事件（作用域限定在剧场容器内）
 * @param {jQuery} $container - 剧场容器
 */
function bindTheaterEvents($container) {
    // 1. 返回按钮
    $container.on('click', '.theater-back-btn', () => {
        PhoneSim_Sounds.play('tap');
        UIModule.showView('HomeScreen');
    });

    // 2. 导航按钮
    $container.on('click', '.theater-nav-btn', function() {
        const $btn = $(this);
        if ($btn.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const targetPage = $btn.data('page');
        switchTheaterPage(targetPage);
        updateTheaterNav(targetPage);
    });

    // 3. 刷新按钮
    $container.on('click', '.theater-refresh-btn', async function() {
        PhoneSim_Sounds.play('send');
        const targetPage = $(this).data('page');
        const pageNames = {
            'announcements': '通告列表',
            'customizations': '粉丝定制',
            'theater': '剧场列表',
            'shop': '欲色商城'
        };
        const promptText = pageNames[targetPage] ? `(系统提示：刷新了欲色剧场的“${pageNames[targetPage]}”页面)` : '';
        if (promptText && UIModule.triggerAIGeneration) {
            await UIModule.triggerAIGeneration(promptText);
        }
        switchTheaterPage(targetPage);
    });

    // 4. 列表项点击（打开详情）
    $container.on('click', '.theater-list-item', function() {
        const $item = $(this);
        const itemType = $item.data('type');
        const itemData = $item.data();
        showTheaterDetail(itemType, itemData);
    });

    // 5. 列表项操作按钮（忽略/接取）
    $container.on('click', '.theater-action-btn', function(e) {
        e.stopPropagation(); // 阻止触发列表项点击
        const $btn = $(this);
        const $item = $btn.closest('.theater-list-item');
        const itemId = $item.data('id') || '未知项';
        
        if ($btn.hasClass('reject')) {
            PhoneSim_Sounds.play('tap');
            alert(`已忽略：${itemId}`);
        } else if ($btn.hasClass('accept')) {
            PhoneSim_Sounds.play('tap');
            alert(`已接取：${itemId}`);
        }
    });

    // 6. 模态框关闭按钮
    $container.on('click', '.theater-modal-close', function() {
        $(parentWindow.document.getElementById('theater-detail-modal')).removeClass('visible');
    });

    // 7. 筛选器按钮
    $container.on('click', '.theater-filter-btn', function() {
        const $btn = $(this);
        $btn.siblings().removeClass('active');
        $btn.addClass('active');
        // 筛选逻辑可在此添加
    });
}

/**
 * 切换剧场页面
 * @param {string} pageName - 页面名称
 */
function switchTheaterPage(pageName) {
    const $contentContainer = $(parentWindow.document.getElementById('theater-content-container'));
    if ($contentContainer.length === 0) return;

    // 清空内容（避免叠加）
    $contentContainer.empty();

    // 根据页面名称渲染内容
    switch (pageName) {
        case 'announcements':
            $contentContainer.html(`
                <div class="theater-page-header">
                    <h2>通告列表</h2>
                    <button class="theater-refresh-btn" data-page="announcements"><<<i class="fas fa-sync-alt"></</</i></button>
                </div>
                <div class="theater-list-wrap">${getTheaterListHtml('announcements')}</div>
            `);
            break;
        case 'customizations':
            $contentContainer.html(`
                <div class="theater-page-header">
                    <h2>粉丝定制</h2>
                    <button class="theater-refresh-btn" data-page="customizations"><<<i class="fas fa-sync-alt"></</</i></button>
                </div>
                <div class="theater-list-wrap">${getTheaterListHtml('customizations')}</div>
            `);
            break;
        case 'theater':
            $contentContainer.html(`
                <div class="theater-page-header">
                    <h2>剧场列表</h2>
                    <button class="theater-refresh-btn" data-page="theater"><<<i class="fas fa-sync-alt"></</</i></button>
                </div>
                <div class="theater-filter-bar">
                    <button class="theater-filter-btn active" data-filter="all">全部</button>
                    <button class="theater-filter-btn" data-filter="hot">🔥 最热</button>
                    <button class="theater-filter-btn" data-filter="new">🆕 最新</button>
                    <button class="theater-filter-btn" data-filter="recommended">❤️ 推荐</button>
                    <button class="theater-filter-btn" data-filter="paid">💸 高价</button>
                </div>
                <div class="theater-list-wrap">${getTheaterListHtml('theater')}</div>
            `);
            break;
        case 'shop':
            $contentContainer.html(`
                <div class="theater-page-header">
                    <h2>欲色商城</h2>
                    <button class="theater-refresh-btn" data-page="shop"><<<i class="fas fa-sync-alt"></</</i></button>
                </div>
                <div class="theater-list-wrap">${getTheaterListHtml('shop')}</div>
            `);
            break;
        default:
            $contentContainer.html('<p class="theater-empty-tip">页面不存在</p>');
    }
}

/**
 * 获取列表HTML
 * @param {string} type - 列表类型
 * @returns {string} 列表HTML字符串
 */
function getTheaterListHtml(type) {
    const listData = PhoneSim_State.theaterData?.[type] || [];
    if (listData.length === 0) {
        return '<p class="theater-empty-tip">暂无相关内容</p>';
    }
    return listData.map(item => createTheaterListItem(item, type)).join('');
}

/**
 * 创建列表项HTML
 * @param {Object} item - 列表项数据
 * @param {string} type - 列表类型
 * @returns {string} 列表项HTML
 */
function createTheaterListItem(item, type) {
    let metaHtml = '';
    let actionHtml = '';
    let dataAttrs = '';

    // 生成data属性（转义特殊字符）
    for (const key in item) {
        if (item.hasOwnProperty(key)) {
            const safeValue = String(typeof item[key] === 'object' 
                ? JSON.stringify(item[key]) 
                : item[key]).replace(/"/g, '&quot;');
            dataAttrs += `data-${key.toLowerCase()}="${safeValue}" `;
        }
    }

    // 不同类型的元数据
    switch (type) {
        case 'announcements':
            metaHtml = `
                <span class="theater-item-tag">${item.type || '通告'}</span>
                <span>演员: ${item.actor || '未知'}</span>
                <span class="theater-item-price">${item.payment || '未知'}</span>
            `;
            break;
        case 'customizations':
            metaHtml = `
                <span class="theater-item-tag">${item.typename || '定制'}</span>
                <span>粉丝: ${item.fanid || '匿名'}</span>
                <span class="theater-item-price">酬劳: ${item.payment || '0'}</span>
            `;
            actionHtml = `
                <div class="theater-item-action">
                    <button class="theater-action-btn reject">忽略</button>
                    <button class="theater-action-btn accept">接取</button>
                </div>
            `;
            break;
        case 'theater':
            metaHtml = `
                <span class="theater-item-tag">${item.tags || '无'}</span>
                <span>热度: ${item.popularity || '0'}</span>
                <span class="theater-item-price">${item.price || '免费'}</span>
            `;
            break;
        case 'shop':
            metaHtml = `
                <span class="theater-item-tag">商品</span>
                <span class="theater-item-price">价格: ${item.price || '0'}</span>
                <span>最高价: ${item.highestbid || '0'}</span>
            `;
            break;
    }

    return `
        <div class="theater-list-item" data-type="${type}" ${dataAttrs.trim()}>
            <div class="theater-item-title">${item.title || item.name || '无标题'}</div>
            <div class="theater-item-meta">${metaHtml}</div>
            ${actionHtml}
        </div>
    `;
}

/**
 * 更新导航激活状态
 * @param {string} activePage - 当前激活页面
 */
function updateTheaterNav(activePage) {
    const $navBtns = $(parentWindow.document.querySelectorAll('.theater-nav-btn'));
    $navBtns.removeClass('active');
    $navBtns.filter(`[data-page="${activePage}"]`).addClass('active');
}

/**
 * 显示详情模态框
 * @param {string} type - 详情类型
 * @param {Object} itemData - 详情数据
 */
function showTheaterDetail(type, itemData) {
    const $panelContainer = $(parentWindow.document.getElementById(PhoneSim_Config.PANEL_ID));
    if ($panelContainer.length === 0) return;

    // 创建模态框（仅一次）
    let $modal = $panelContainer.find('#theater-detail-modal');
    if ($modal.length === 0) {
        $modal = $(`
            <div id="theater-detail-modal" class="theater-modal-overlay">
                <div class="theater-modal-box">
                    <div class="theater-modal-header"></div>
                    <div class="theater-modal-body"></div>
                    <div class="theater-modal-footer"></div>
                </div>
            </div>
        `);
        $panelContainer.append($modal);
    }

    // 渲染模态框内容
    const $header = $modal.find('.theater-modal-header');
    const $body = $modal.find('.theater-modal-body');
    const $footer = $modal.find('.theater-modal-footer');
    let headerHtml = '', bodyHtml = '', footerHtml = '';

    switch (type) {
        case 'announcements':
            headerHtml = itemData.title || '通告详情';
            bodyHtml = `
                <div class="theater-detail-section">
                    <h4>剧情简介</h4>
                    <p>${itemData.description || '无'}</p>
                </div>
                <div class="theater-detail-section">
                    <h4>合作演员</h4>
                    <p>${itemData.actor || '未知'}</p>
                </div>
                <div class="theater-detail-section">
                    <h4>酬劳</h4>
                    <p class="theater-item-price">${itemData.payment || '未知'}</p>
                </div>
            `;
            footerHtml = `
                <button class="theater-action-btn reject theater-modal-close">返回</button>
                <button class="theater-action-btn accept">开始拍摄</button>
            `;
            break;
        case 'customizations':
            headerHtml = `${itemData.fanid || '匿名'} 的定制`;
            bodyHtml = `
                <div class="theater
