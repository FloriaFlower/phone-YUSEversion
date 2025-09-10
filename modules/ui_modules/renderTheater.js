import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';
let jQuery_API, parentWin, UI;
let isInitialized = false;

export function init(deps, uiObject) {
    if (isInitialized) return;
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    _injectBaseStyles();
    isInitialized = true;
}

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

export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    let view = p.find('#theaterapp-view');
    
    if (view.length === 0) {
        view = jQuery_API(`<div id="theaterapp-view" class="view"></div>`);
        p.append(view);
    }
    
    // 恢复返回按钮（避免依赖外部事件冲突），修复按钮重叠问题
    view.empty().append(`
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
    
    if (!PhoneSim_State.theaterEventsBound) {
        _bindEvents();
        PhoneSim_State.theaterEventsBound = true;
    }
    
    if (!PhoneSim_State.theaterInit) {
        switchPage(initialPage);
        updateNav(initialPage);
        PhoneSim_State.theaterInit = true;
    }
}

// 完整事件绑定（包含所有必要按钮逻辑）
function _bindEvents() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    
    // 解绑旧事件防止冲突
    view.off('click.phonesim');
    p.off('click.phonesim', '#theaterapp-view .back-to-home-btn');
    p.off('click.phonesim', '#theaterapp-view .theater-refresh-btn');
    p.off('click.phonesim', '#theaterapp-view .nav-btn');
    p.off('click.phonesim', '#theaterapp-view .list-item');
    p.off('click.phonesim', '#theaterapp-view .filter-btn');
    p.off('click.phonesim', '#theaterapp-view .action-button');

    // 1. 返回首页按钮（核心功能恢复）
    p.on('click.phonesim', '#theaterapp-view .back-to-home-btn', () => {
        PhoneSim_Sounds.play('tap');
        UI.showView('HomeScreen');
    });

    // 2. 刷新按钮
    p.on('click.phonesim', '#theater-content-area .theater-refresh-btn', async function() {
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

    // 3. 底部导航按钮
    p.on('click.phonesim', '#theaterapp-view .nav-btn', function() {
        const btn = jQuery_API(this);
        if (btn.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const page = btn.data('page');
        switchPage(page);
        updateNav(page);
    });

    // 4. 列表项点击（查看详情）
    p.on('click.phonesim', '#theaterapp-view .list-item', function(e) {
        // 排除按钮点击冲突
        if (jQuery_API(e.target).closest('.action-button').length > 0) return;
        PhoneSim_Sounds.play('tap');
        const item = jQuery_API(this);
        const type = item.data('type');
        const itemData = {};
        // 收集列表项数据
        itemData.title = item.data('title') || item.data('name');
        itemData.description = item.data('description');
        itemData.cover = item.data('cover');
        itemData.reviews = item.data('reviews');
        itemData.comments = item.data('comments');
        itemData.typename = item.data('typename') || item.data('typename');
        itemData.fanid = item.data('fanid') || item.data('fanid');
        itemData.payment = item.data('payment');
        itemData.tags = item.data('tags');
        itemData.popularity = item.data('popularity');
        itemData.price = item.data('price');
        itemData.highestbid = item.data('highestbid');
        itemData.actor = item.data('actor');
        itemData.request = item.data('request');
        itemData.notes = item.data('notes');
        
        // 对应详情类型
        const typeMap = {
            'announcements': 'announcement',
            'customizations': 'customization',
            'theater': 'theater',
            'shop': 'shop'
        };
        showDetailModal(typeMap[type] || type, itemData);
    });

    // 5. 筛选按钮
    p.on('click.phonesim', '#theaterapp-view .filter-btn', function() {
        PhoneSim_Sounds.play('tap');
        const btn = jQuery_API(this);
        btn.siblings().removeClass('active');
        btn.addClass('active');
        // 如需筛选逻辑可在此添加
    });

    // 6. 操作按钮（忽略/接取）
    p.on('click.phonesim', '#theaterapp-view .action-button', function() {
        PhoneSim_Sounds.play('tap');
        const btn = jQuery_API(this);
        const item = btn.closest('.list-item');
        const type = item.data('type');
        const itemId = item.data('id');
        
        if (btn.hasClass('reject-btn')) {
            // 忽略逻辑
            item.fadeOut(300, () => item.remove());
        } else if (btn.hasClass('accept-btn')) {
            // 接取逻辑
            if (type === 'customizations') {
                const prompt = `(系统提示：洛洛接取了粉丝${item.data('fanid')}的定制需求“${item.data('title')}”，酬劳${item.data('payment')})`;
                if (UI.triggerAIGeneration) {
                    UI.triggerAIGeneration(prompt);
                }
                item.fadeOut(300, () => item.remove());
            } else if (btn.attr('id') === 'start-shooting-btn') {
                // 开始拍摄
                const prompt = `(系统提示：洛洛开始拍摄通告“${item.data('title')}”，合作演员${item.data('actor')})`;
                if (UI.triggerAIGeneration) {
                    UI.triggerAIGeneration(prompt);
                }
                jQuery_API('#theater-modal').removeClass('visible');
            }
        }
    });
}

function switchPage(pageName) {
    const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
    if (contentArea.length === 0) return;
    contentArea.empty();
    
    switch (pageName) {
        case 'announcements':
            contentArea.html(`
                <div class="theater-page-header">
                    <h2>通告列表</h2>
                    <button class="theater-refresh-btn" data-page="announcements"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="list-container">${_getListHtml('announcements')}</div>
            `);
            break;
        case 'customizations':
            contentArea.html(`
                <div class="theater-page-header">
                    <h2>粉丝定制</h2>
                    <button class="theater-refresh-btn" data-page="customizations"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="list-container">${_getListHtml('customizations')}</div>
            `);
            break;
        case 'theater':
            contentArea.html(`
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
            break;
        case 'shop':
            contentArea.html(`
                <div class="theater-page-header">
                    <h2>欲色商城</h2>
                    <button class="theater-refresh-btn" data-page="shop"><<i class="fas fa-sync-alt"></</i></button>
                </div>
                <div class="list-container">${_getListHtml('shop')}</div>
            `);
            break;
        default:
            contentArea.html('<p class="empty-list">页面不存在</p>');
    }
}

function _getListHtml(type) {
    const data = PhoneSim_State.theaterData?.[type] || [];
    if (data.length === 0) {
        return '<p class="empty-list">暂无内容</p>';
    }
    return data.map(item => _createListItem(item, type)).join('');
}

function updateNav(activePage) {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .nav-btn');
    navButtons.removeClass('active');
    navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}

function _createListItem(item, type) {
    let metaHtml = '';
    let actionsHtml = '';
    let dataAttributes = '';
    for (const key in item) {
        if (item.hasOwnProperty(key)) {
            const value = typeof item[key] === 'object' ? JSON.stringify(item[key]).replace(/"/g, '&quot;') : item[key];
            dataAttributes += `data-${key.toLowerCase()}="${value}" `;
        }
    }
    switch (type) {
        case 'announcements':
            metaHtml = `<span class="item-tag">${item.type || '通告'}</span><span>合作演员: ${item.actor || '未知'}</span><span class="item-price">${item.payment || '未知'}</span>`;
            break;
        case 'customizations':
            metaHtml = `<span class="item-tag">${item.typename || item.typeName}</span><span>粉丝: ${item.fanid || item.fanId}</span><span class="item-price">酬劳: ${item.payment || '未知'}</span>`;
            actionsHtml = `
                <div class="item-actions">
                    <button class="action-button reject-btn">忽略</button>
                    <button class="action-button accept-btn">接取</button>
                </div>`;
            break;
        case 'theater':
            metaHtml = `<span class="item-tag">${item.tags || '无'}</span><span>热度: ${item.popularity || '0'}</span><span class="item-price">${item.price || '免费'}</span>`;
            break;
        case 'shop':
            metaHtml = `<span class="item-tag">商品</span><span class="item-price">价格: ${item.price || '0'}</span><span>最高价: ${item.highestbid || '0'}</span>`;
            break;
    }
    return `
        <div class="list-item" data-type="${type}" ${dataAttributes}>
            <div class="item-title">${item.title || item.name || '无标题'}</div>
            <div class="item-meta">${metaHtml}</div>
            ${actionsHtml}
        </div>
    `;
}

export function showDetailModal(type, itemData) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    let modal = p.find('#theater-modal');
    if (modal.length === 0) {
        modal = jQuery_API(`
            <div id="theater-modal" class="theater-modal-overlay">
                <div class="theater-modal-content">
                    <div class="theater-modal-header"></div>
                    <div class="theater-modal-body"></div>
                    <div class="theater-modal-footer"></div>
                </div>
            </div>
        `);
        p.append(modal);
    }
    const header = modal.find('.theater-modal-header');
    const body = modal.find('.theater-modal-body');
    const footer = modal.find('.theater-modal-footer');
    let headerHtml = '', bodyHtml = '', footerHtml = '';
    switch (type) {
        case 'announcement':
            headerHtml = itemData.title;
            bodyHtml = `<div class="detail-section"><h4>剧情简介</h4><p>${itemData.description || '无'}</p></div>`;
            footerHtml = `<button class="action-button reject-btn modal-close">返回</button><button class="action-button accept-btn" id="start-shooting-btn">开始拍摄</button>`;
            break;
        case 'customization':
            headerHtml = `${itemData.fanid || itemData.fanId} 的定制`;
            bodyHtml = `
                <div class="detail-section"><h4>定制类型</h4><p>${itemData.typename || itemData.typeName || '无'}</p></div>
                <div class="detail-section"><h4>内容要求</h4><p>${itemData.request || '无'}</p></div>
                <div class="detail-section"><h4>备注</h4><p>${itemData.notes || '无'}</p></div>`;
            footerHtml = `<button class="action-button reject-btn modal-close">返回</button><button class="action-button accept-btn" id="accept-custom-btn">接取</button>`;
            break;
        case 'theater':
            headerHtml = itemData.title;
            const commentsHtml = _renderComments(itemData.reviews);
            bodyHtml = `
                <div class="cover-image" style="background-image: url('${itemData.cover || ''}');"></div>
                <div class="detail-section"><h4>作品简介</h4><p>${itemData.description || '无'}</p></div>
                <div class="detail-section"><h4>粉丝热评</h4><div>${commentsHtml}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
        case 'shop':
            headerHtml = itemData.name;
            const shopCommentsHtml = _renderComments(itemData.comments);
            bodyHtml = `
                <div class="detail-section"><h4>商品卖点</h4><p>${itemData.description || '无'}</p></div>
                <div class="detail-section"><h4>当前最高价</h4><p>${itemData.highestbid || '0'
