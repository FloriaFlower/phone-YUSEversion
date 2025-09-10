import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, UI;
let isInitialized = false; // 单例标记

// 初始化依赖（确保只执行一次）
export function init(deps, uiObject) {
    if (isInitialized) return;
    // 验证依赖是否存在，避免后续报错
    if (!deps?.jq || !deps?.win || !uiObject) {
        console.error("Theater初始化失败：依赖参数不完整");
        return;
    }
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    _injectBaseStyles();
    isInitialized = true;
    // 初始化状态标记
    if (PhoneSim_State.theaterEventsBound === undefined) {
        PhoneSim_State.theaterEventsBound = false;
    }
    if (PhoneSim_State.theaterInit === undefined) {
        PhoneSim_State.theaterInit = false;
    }
}

// 注入基础样式
function _injectBaseStyles() {
    const style = parentWin.document.createElement('style');
    style.textContent = `
        #theaterapp-view { height: 100% !important; }
        .theater-footer-nav { position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important; z-index: 100 !important; }
        .app-content-wrapper { padding-bottom: 60px !important; }
        #theaterapp-view .app-header:empty,
        #theaterapp-view .theater-footer-nav:empty { display: none !important; }
    `;
    parentWin.document.head.appendChild(style);
}

// 渲染剧场主视图
export function renderTheaterView(initialPage = 'announcements') {
    // 未初始化则先执行初始化
    if (!isInitialized) {
        console.warn("Theater未初始化，无法渲染视图");
        return;
    }

    const $panel = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    if ($panel.length === 0) {
        console.error("未找到面板容器：" + PhoneSim_Config.PANEL_ID);
        return;
    }

    // 只创建一个主容器
    let $view = $panel.find('#theaterapp-view');
    if ($view.length === 0) {
        $view = jQuery_API(`<div id="theaterapp-view" class="view"></div>`);
        $panel.append($view);
    }

    // 清空容器，避免重复
    $view.empty().append(`
        <div class="app-header">
            <button class="app-back-btn back-to-home-btn"><<i class="fas fa-chevron-left"></</i></button>
            <h3>欲色剧场</h3>
        </div>
        <div class="app-content-wrapper">
            <div id="theater-content-area"></div>
        </div>
        <div class="theater-footer-nav">
            <button class="nav-btn" data-page="announcements"><span class="icon">📢</span>通告列表</button>
            <button class="nav-btn" data-page="customizations"><span class="icon">💖</span>粉丝定制</button>
            <button class="nav-btn" data-page="theater"><span class="icon">🎬</span>剧场列表</button>
            <button class="nav-btn" data-page="shop"><span class="icon">🛒</span>欲色商城</button>
        </div>
    `);

    // 绑定事件（只绑定一次）
    if (!PhoneSim_State.theaterEventsBound) {
        _bindEvents($panel); // 传入面板容器，缩小事件范围
        PhoneSim_State.theaterEventsBound = true;
    }

    // 初始渲染页面
    if (!PhoneSim_State.theaterInit) {
        switchPage(initialPage);
        updateNav(initialPage);
        PhoneSim_State.theaterInit = true;
    }
}

// 统一事件绑定（修复核心：使用明确的容器，避免事件丢失）
function _bindEvents($panel) {
    const $view = $panel.find('#theaterapp-view');

    // 1. 返回首页按钮
    $view.on('click', '.back-to-home-btn', () => {
        PhoneSim_Sounds.play('tap');
        UI.showView('HomeScreen');
    });

    // 2. 刷新按钮（委托给内容区）
    $view.on('click', '#theater-content-area .theater-refresh-btn', async function() {
        PhoneSim_Sounds.play('send');
        const page = jQuery_API(this).data('page');
        const pageMap = {
            'announcements': '通告列表',
            'customizations': '粉丝定制',
            'theater': '剧场列表',
            'shop': '欲色商城'
        };
        const prompt = pageMap[page] ? `(系统提示：洛洛刷新了欲色剧场的“${pageMap[page]}”页面)` : '';
        if (prompt && UI.triggerAIGeneration) {
            await UI.triggerAIGeneration(prompt);
        }
        switchPage(page);
    });

    // 3. 导航按钮
    $view.on('click', '.nav-btn', function() {
        const $btn = jQuery_API(this);
        if ($btn.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const page = $btn.data('page');
        switchPage(page);
        updateNav(page);
    });

    // 4. 列表项点击（新增：打开详情）
    $view.on('click', '.list-item', function() {
        const $item = jQuery_API(this);
        const type = $item.data('type');
        // 提取item数据
        const itemData = {};
        $item.data().forEach((value, key) => {
            if (key !== 'type') itemData[key] = value;
        });
        showDetailModal(type, itemData);
    });

    // 5. 列表项操作按钮（忽略/接取）
    $view.on('click', '.item-actions .action-button', function(e) {
        e.stopPropagation(); // 阻止触发列表项点击
        const $btn = jQuery_API(this);
        const $item = $btn.closest('.list-item');
        const itemType = $item.data('type');
        const itemId = $item.data('id') || '未知';

        if ($btn.hasClass('reject-btn')) {
            PhoneSim_Sounds.play('tap');
            alert(`已忽略【${itemType}】项：${itemId}`);
        } else if ($btn.hasClass('accept-btn')) {
            PhoneSim_Sounds.play('tap');
            alert(`已接取【${itemType}】项：${itemId}`);
        }
    });
}

// 页面切换逻辑
export function switchPage(pageName) {
    const $contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
    if ($contentArea.length === 0) return;

    $contentArea.empty();
    switch (pageName) {
        case 'announcements':
            $contentArea.html(`
                <div class="theater-page-header">
                    <h2>通告列表</h2>
                    <button class="theater-refresh-btn" data-page="announcements"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="list-container">${_getListHtml('announcements')}</div>
            `);
            break;
        case 'customizations':
            $contentArea.html(`
                <div class="theater-page-header">
                    <h2>粉丝定制</h2>
                    <button class="theater-refresh-btn" data-page="customizations"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="list-container">${_getListHtml('customizations')}</div>
            `);
            break;
        case 'theater':
            $contentArea.html(`
                <div class="theater-page-header">
                    <h2>剧场列表</h2>
                    <button class="theater-refresh-btn" data-page="theater"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="theater-filters">
                    <button class="filter-btn active" data-filter="all">全部</button>
                    <button class="filter-btn" data-filter="hot">🔥 最热</button>
                    <button class="filter-btn" data-filter="new">🆕 最新</button>
                    <button class="filter-btn" data-filter="recommended">❤️ 推荐</button>
                    <button class="filter-btn" data-filter="paid">💸 高价定制</button>
                </div>
                <div class="list-container">${_getListHtml('theater')}</div>
            `);
            // 绑定筛选器事件
            jQuery_API(parentWin.document.body).find('.filter-btn').on('click', function() {
                const $btn = jQuery_API(this);
                $btn.siblings().removeClass('active');
                $btn.addClass('active');
                // 此处可添加筛选逻辑
            });
            break;
        case 'shop':
            $contentArea.html(`
                <div class="theater-page-header">
                    <h2>欲色商城</h2>
                    <button class="theater-refresh-btn" data-page="shop"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="list-container">${_getListHtml('shop')}</div>
            `);
            break;
        default:
            $contentArea.html('<p class="empty-list">页面不存在</p>');
    }
}

// 获取列表HTML
function _getListHtml(type) {
    const data = PhoneSim_State.theaterData?.[type] || [];
    if (data.length === 0) {
        return '<p class="empty-list">暂无内容</p>';
    }
    return data.map(item => _createListItem(item, type)).join('');
}

// 更新导航激活状态
export function updateNav(activePage) {
    const $navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .nav-btn');
    if ($navButtons.length === 0) return;
    $navButtons.removeClass('active');
    $navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}

// 创建列表项
function _createListItem(item, type) {
    let metaHtml = '';
    let actionsHtml = '';
    let dataAttributes = '';

    // 生成data属性
    for (const key in item) {
        if (item.hasOwnProperty(key)) {
            const value = typeof item[key] === 'object' 
                ? JSON.stringify(item[key]).replace(/"/g, '&quot;') 
                : String(item[key]).replace(/"/g, '&quot;');
            dataAttributes += `data-${key.toLowerCase()}="${value}" `;
        }
    }

    // 不同类型的元数据
    switch (type) {
        case 'announcements':
            metaHtml = `
                <span class="item-tag">${item.type || '通告'}</span>
                <span>合作演员: ${item.actor || '未知'}</span>
                <span class="item-price">${item.payment || '未知'}</span>
            `;
            break;
        case 'customizations':
            metaHtml = `
                <span class="item-tag">${item.typename || item.typeName || '定制'}</span>
                <span>粉丝: ${item.fanid || item.fanId || '匿名'}</span>
                <span class="item-price">酬劳: ${item.payment || '0'}</span>
            `;
            actionsHtml = `
                <div class="item-actions">
                    <button class="action-button reject-btn">忽略</button>
                    <button class="action-button accept-btn">接取</button>
                </div>
            `;
            break;
        case 'theater':
            metaHtml = `
                <span class="item-tag">${item.tags || '无'}</span>
                <span>热度: ${item.popularity || '0'}</span>
                <span class="item-price">${item.price || '免费'}</span>
            `;
            break;
        case 'shop':
            metaHtml = `
                <span class="item-tag">商品</span>
                <span class="item-price">价格: ${item.price || '0'}</span>
                <span>最高价: ${item.highestbid || '0'}</span>
            `;
            break;
    }

    return `
        <div class="list-item" data-type="${type}" ${dataAttributes.trim()}>
            <div class="item-title">${item.title || item.name || '无标题'}</div>
            <div class="item-meta">${metaHtml}</div>
            ${actionsHtml}
        </div>
    `;
}

-m 显示详情模态框
export function showDetailModal(type, itemData) {
    const $panel = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    if ($panel.length === 0) return;

    // 创建模态框（只创建一次）
    let $modal = $panel.find('#theater-modal');
    if ($modal.length === 0) {
        $modal = jQuery_API(`
            <div id="theater-modal" class="theater-modal-overlay">
                <div class="theater-modal-content">
                    <div class="theater-modal-header"></div>
                    <div class="theater-modal-body"></div>
                    <div class="theater-modal-footer"></div>
                </div>
            </div>
        `);
        $panel.append($modal);
    }

    const $header = $modal.find('.theater-modal-header');
    const $body = $modal.find('.theater-modal-body');
    const $footer = $modal.find('.theater-modal-footer');
    let headerHtml = '', bodyHtml = '', footerHtml = '';

    // 不同类型的详情
    switch (type) {
        case 'announcements':
            headerHtml = itemData.title || '通告详情';
            bodyHtml = `
                <div class="detail-section">
                    <h4>剧情简介</h4>
                    <p>${itemData.description || '无'}</p>
                </div>
                <div class="detail-section">
                    <h4>合作演员</h4>
                    <p>${itemData.actor || '未知'}</p>
                </div>
                <div class="detail-section">
                    <h4>酬劳</h4>
                    <p class="item-price">${itemData.payment || '未知'}</p>
                </div>
            `;
            footerHtml = `
                <button class="action-button reject-btn modal-close">返回</button>
                <button class="action-button accept-btn" id="start-shooting-btn">开始拍摄</button>
            `;
            break;
        case 'customizations':
            headerHtml = `${itemData.fanid || itemData.fanId || '匿名'} 的定制`;
            bodyHtml = `
                <div class="detail-section">
                    <h4>定制类型</h4>
                    <p>${itemData.typename || itemData.typeName || '无'}</p>
                </div>
                <div class="detail-section">
                    <h4>内容要求</h4>
                    <p>${itemData.request || '无'}</p>
                </div>
                <div class="detail-section">
                    <h4>备注</h4>
                    <p>${itemData.notes || '无'}</p>
                </div>
                <div class="detail-section">
                    <h4>酬劳</h4>
                    <p class="item-price">${itemData.payment || '0'}</p>
                </div>
            `;
            footerHtml = `
                <button class="action-button reject-btn modal-close">返回</button>
                <button class="action-button accept-btn" id="accept-custom-btn">接取</button>
            `;
            break;
        case 'theater':
            headerHtml = itemData.title || '剧场详情';
            const commentsHtml = _renderComments(itemData.reviews);
            bodyHtml = `
                <div class="cover-image" style="background-image: url('${itemData.cover || ''}');"></div>
                <div class="detail-section">
                    <h4>作品简介</h4>
                    <p>${itemData.description || '无'}</p>
                </div>
                <div class="detail-section">
                    <h4>热度</h4>
                    <p>${itemData.popularity || '0'}</p>
                </div>
                <div class="detail-section">
                    <h4>粉丝热评</h4>
                    <div>${commentsHtml}
