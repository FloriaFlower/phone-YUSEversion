import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';
let jQuery_API, parentWin, UI;
export function init(deps, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    // 新增：初始化APP样式（注入基础CSS）
    _injectBaseStyles();
}
// 新增：注入基础样式
function _injectBaseStyles() {
    const style = parentWin.document.createElement('style');
    style.textContent = `
        #theaterapp-view { display: flex; flex-direction: column; height: 100%; }
        .app-header { padding: 12px 16px; background: #f5f5f5; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; }
        .app-back-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
        .app-content-wrapper { flex: 1; overflow-y: auto; padding: 16px; background: #fff; }
        #theater-content-area { width: 100%; }
        .theater-footer-nav { display: flex; border-top: 1px solid #eee; }
        .nav-btn { flex: 1; padding: 12px 0; border: none; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .nav-btn.active { color: #007aff; }
        .theater-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .theater-refresh-btn { background: none; border: none; cursor: pointer; font-size: 16px; }
        .list-container { display: flex; flex-direction: column; gap: 12px; }
        .list-item { padding: 12px; border: 1px solid #eee; border-radius: 8px; }
        .item-title { font-weight: bold; margin-bottom: 8px; }
        .item-meta { font-size: 12px; color: #666; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
        .item-tag { padding: 2px 6px; background: #f0f0f0; border-radius: 4px; }
        .item-price { color: #ff4400; }
        .item-actions { display: flex; gap: 8px; margin-top: 8px; }
        .action-button { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; }
        .accept-btn { background: #007aff; color: white; }
        .reject-btn { background: #f0f0f0; }
        .empty-list { text-align: center; color: #999; padding: 20px 0; }
        .theater-filters { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 8px; }
        .filter-btn { padding: 6px 12px; border: 1px solid #eee; border-radius: 16px; background: white; cursor: pointer; white-space: nowrap; }
        .filter-btn.active { background: #007aff; color: white; border-color: #007aff; }
    `;
    parentWin.document.head.appendChild(style);
}
export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    // 修复：无论是否有contentWrapper，都强制构建正确结构
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
    // 修复：绑定导航按钮点击事件
    _bindNavEvents();
    // 渲染初始页面
    switchPage(initialPage);
    updateNav(initialPage);
}
// 新增：绑定导航按钮事件
function _bindNavEvents() {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .theater-footer-nav .nav-btn');
    navButtons.on('click', function() {
        const pageName = jQuery_API(this).data('page');
        switchPage(pageName);
        updateNav(pageName);
    });
    // 返回按钮事件
    const backBtn = jQuery_API(parentWin.document.body).find('.back-to-home-btn');
    backBtn.on('click', function() {
        // 此处可添加返回首页逻辑
        alert('返回首页');
    });
    // 刷新按钮事件
    jQuery_API(parentWin.document.body).on('click', '.theater-refresh-btn', function() {
        const pageName = jQuery_API(this).data('page');
        switchPage(pageName);
    });
}
function switchPage(pageName) {
    const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
    contentArea.empty();
    switch (pageName) {
        case 'announcements':
            _renderAnnouncementsPage(contentArea);
            break;
        case 'customizations':
            _renderCustomizationsPage(contentArea);
            break;
        case 'theater':
            _renderTheaterPage(contentArea);
            break;
        case 'shop':
            _renderShopPage(contentArea);
            break;
        default:
            contentArea.html('<p class="empty-list">页面不存在</p>');
    }
}
function updateNav(activePage) {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .theater-footer-nav .nav-btn');
    navButtons.removeClass('active');
    navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}
function _renderAnnouncementsPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>通告列表</h2>
            <button class="theater-refresh-btn" data-page="announcements" title="刷新通告"><<i class="fas fa-sync-alt"></</i></button>
        </div>
    `;
    const announcements = PhoneSim_State.theaterData?.announcements || [];
    const listHtml = announcements.length > 0
        ? announcements.map(item => _createListItem(item, 'announcement')).join('')
        : '<p class="empty-list">当前没有新的拍摄通告。</p>';
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}
function _renderCustomizationsPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>粉丝定制</h2>
            <button class="theater-refresh-btn" data-page="customizations" title="刷新定制"><<i class="fas fa-sync-alt"></</i></button>
        </div>
    `;
    const customizations = PhoneSim_State.theaterData?.customizations || [];
    const listHtml = customizations.length > 0
        ? customizations.map(item => _createListItem(item, 'customization')).join('')
        : '<p class="empty-list">暂时没有需要处理的粉丝定制。</p>';
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}
function _renderTheaterPage(container, filter = 'all') {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>剧场列表</h2>
            <button class="theater-refresh-btn" data-page="theater" title="刷新剧场"><<i class="fas fa-sync-alt"></</i></button>
        </div>
    `;
    const filtersHtml = `
        <div class="theater-filters">
            <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">全部</button>
            <button class="filter-btn ${filter === 'hot' ? 'active' : ''}" data-filter="hot">🔥 最热</button>
            <button class="filter-btn ${filter === 'new' ? 'active' : ''}" data-filter="new">🆕 最新</button>
            <button class="filter-btn ${filter === 'recommended' ? 'active' : ''}" data-filter="recommended">❤️ 推荐</button>
            <button class="filter-btn ${filter === 'paid' ? 'active' : ''}" data-filter="paid">💸 高价定制</button>
        </div>
    `;
    let itemsToShow = [];
    switch(filter) {
        case 'hot': itemsToShow = PhoneSim_State.theaterData?.theater_hot || []; break;
        case 'new': itemsToShow = PhoneSim_State.theaterData?.theater_new || []; break;
        case 'recommended': itemsToShow = PhoneSim_State.theaterData?.theater_recommended || []; break;
        case 'paid': itemsToShow = PhoneSim_State.theaterData?.theater_paid || []; break;
        default: itemsToShow = PhoneSim_State.theaterData?.theater || [];
    }
    const listHtml = itemsToShow.length > 0
        ? itemsToShow.map(item => _createListItem(item, 'theater')).join('')
        : '<p class="empty-list">该分类下还没有作品。</p>';
    container.html(headerHtml + filtersHtml + `<div class="list-container" id="theater-list-container">${listHtml}</div>`);
    // 绑定筛选按钮事件
    container.find('.filter-btn').on('click', function() {
        const newFilter = jQuery_API(this).data('filter');
        _renderTheaterPage(container, newFilter);
    });
}
function _renderShopPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>欲色商城</h2>
            <button class="theater-refresh-btn" data-page="shop" title="刷新商城"><<i class="fas fa-sync-alt"></</i></button>
        </div>
    `;
    const shopItems = PhoneSim_State.theaterData?.shop || [];
    const listHtml = shopItems.length > 0
        ? shopItems.map(item => _createListItem(item, 'shop')).join('')
        : '<p class="empty-list">商城正在补货中...</p>';
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}
function _createListItem(item, type) {
    let metaHtml = '';
    let actionsHtml = '';
    let dataAttributes = '';
    for (const key in item) {
        const value = typeof item[key] === 'object' ? JSON.stringify(item[key]).replace(/"/g, '"') : item[key];
        dataAttributes += `data-${key.toLowerCase()}="${value}" `;
    }
    switch (type) {
        case 'announcement':
            metaHtml = `<span class="item-tag">${item.type || '通告'}</span><span>合作演员: ${item.actor || '未知'}</span><span class="item-price">${item.payment || '未知'}</span>`;
            break;
        case 'customization':
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
    const modal = jQuery_API(parentWin.document.body).find('#theater-modal');
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
                <div class="cover-image" style="background-image: url('${itemData.cover || ''}'); height: 150px; background-size: cover; background-position: center; margin-bottom: 12px;"></div>
                <div class="detail-section"><h4>作品简介</h4><p>${itemData.description || '无'}</p></div>
                <div class="detail-section"><h4>粉丝热评</h4><div>${commentsHtml}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
        case 'shop':
            headerHtml = itemData.name;
            const shopCommentsHtml = _renderComments(itemData.comments);
            bodyHtml = `
                <div class="detail-section"><h4>商品卖点</h4><p>${itemData.description || '无'}</p></div>
                <div class="detail-section"><h4>当前最高价</h4><p>${itemData.highestbid || '0'}</p></div>
                <div class="detail-section"><h4>评论区</h4><div>${shopCommentsHtml}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
    }
    header.html(headerHtml);
    body.html(bodyHtml);
    footer.html(footerHtml);
    modal.addClass('visible');
    // 绑定模态框关闭事件
    modal.find('.modal-close').on('click', function() {
        modal.removeClass('visible');
    });
}
function _renderComments(reviews) {
    if (!reviews) return '<p>暂无评论。</p>';
    let reviewsArray = [];
    if (typeof reviews === 'string') {
        try {
            reviewsArray = JSON.parse(reviews.replace(/'/g, '"'));
        } catch (e) {
            console.error("解析评论失败:", e, reviews);
            return '<p>评论加载失败。</p>';
        }
    } else if (Array.isArray(reviews)) {
        reviewsArray = reviews;
    }
    if (reviewsArray.length === 0) return '<p>暂无评论。</p>';
    return reviewsArray.map(r => `
        <div class="comment">
            <span class="comment-user">${r.user || '匿名'}:</span> ${r.text || '无内容'}
        </div>`).join('');
}
export const TheaterRenderer = {
    init,
    renderTheaterView,
    showDetailModal,
    switchPage,
    updateNav
};
