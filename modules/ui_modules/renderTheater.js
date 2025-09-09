import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI;

function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
}

// 主渲染函数，负责构建整个App的框架
function renderTheaterView() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');

    // 只在首次加载时构建框架
    if (view.find('.app-content-wrapper').length === 0) {
        view.empty().append(`
            <div class="app-header">
                <button class="app-back-btn back-to-home-btn"><i class="fas fa-chevron-left"></i></button>
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
             <div id="theater-modal" class="theater-modal-overlay">
                <div class="theater-modal-content">
                    <div class="theater-modal-header"></div>
                    <div class="theater-modal-body"></div>
                    <div class="theater-modal-footer"></div>
                    <button class="modal-close"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `);
    }
    // 默认显示第一个页面
    switchPage('announcements');
    updateNav('announcements');
}

function switchPage(pageName) {
    const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
    contentArea.empty();
    switch (pageName) {
        case 'announcements': _renderAnnouncementsPage(contentArea); break;
        case 'customizations': _renderCustomizationsPage(contentArea); break;
        case 'theater': renderTheaterPage(contentArea); break; // [妈妈的修复] 调用公共的渲染函数
        case 'shop': _renderShopPage(contentArea); break;
        default: contentArea.html('<p class="empty-list">页面不存在</p>');
    }
    updateNav(pageName);
}

function updateNav(activePage) {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .theater-footer-nav .nav-btn');
    navButtons.removeClass('active');
    navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}

// === 子页面渲染函数 ===

function _renderAnnouncementsPage(container) {
    const headerHtml = `<div class="theater-page-header"><h2>通告列表</h2><button class="theater-refresh-btn" data-page="announcements" title="刷新通告"><i class="fas fa-sync-alt"></i></button></div>`;
    const announcements = PhoneSim_State.theaterData?.announcements || [];
    const listHtml = announcements.length > 0 ? announcements.map(item => _createListItem(item, 'announcement')).join('') : '<p class="empty-list">当前没有新的拍摄通告。</p>';
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}

function _renderCustomizationsPage(container) {
    const headerHtml = `<div class="theater-page-header"><h2>粉丝定制</h2><button class="theater-refresh-btn" data-page="customizations" title="刷新定制"><i class="fas fa-sync-alt"></i></button></div>`;
    const customizations = PhoneSim_State.theaterData?.customizations || [];
    const listHtml = customizations.length > 0 ? customizations.map(item => _createListItem(item, 'customization')).join('') : '<p class="empty-list">暂时没有需要处理的粉丝定制。</p>';
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}

// [妈妈的修复] 将_renderTheaterPage变为公共函数，这样外部的筛选器才能调用它
function renderTheaterPage(container, filter = 'all') {
    const headerHtml = `<div class="theater-page-header"><h2>剧场列表</h2><button class="theater-refresh-btn" data-page="theater" title="刷新剧场"><i class="fas fa-sync-alt"></i></button></div>`;
    const filtersHtml = `
        <div class="theater-filters">
            <button class="filter-btn ${filter === 'all' ? 'active' : ''}" data-filter="all">全部</button>
            <button class="filter-btn ${filter === 'hot' ? 'active' : ''}" data-filter="hot">🔥 最热</button>
            <button class="filter-btn ${filter === 'new' ? 'active' : ''}" data-filter="new">🆕 最新</button>
            <button class="filter-btn ${filter === 'recommended' ? 'active' : ''}" data-filter="recommended">❤️ 推荐</button>
            <button class="filter-btn ${filter === 'paid' ? 'active' : ''}" data-filter="paid">💸 高价定制</button>
        </div>`;

    let itemsToShow = [];
    const data = PhoneSim_State.theaterData || {};
    switch(filter) {
        case 'hot': itemsToShow = data.theater_hot || []; break;
        case 'new': itemsToShow = data.theater_new || []; break;
        case 'recommended': itemsToShow = data.theater_recommended || []; break;
        case 'paid': itemsToShow = data.theater_paid || []; break;
        default: itemsToShow = data.theater || [];
    }
    const listHtml = itemsToShow.length > 0 ? itemsToShow.map(item => _createListItem(item, 'theater')).join('') : '<p class="empty-list">该分类下还没有作品。</p>';
    container.html(headerHtml + filtersHtml + `<div class="list-container" id="theater-list-container">${listHtml}</div>`);
}

function _renderShopPage(container) {
    const headerHtml = `<div class="theater-page-header"><h2>欲色商城</h2><button class="theater-refresh-btn" data-page="shop" title="刷新商城"><i class="fas fa-sync-alt"></i></button></div>`;
    const shopItems = PhoneSim_State.theaterData?.shop || [];
    const listHtml = shopItems.length > 0 ? shopItems.map(item => _createListItem(item, 'shop')).join('') : '<p class="empty-list">商城正在补货中...</p>';
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}

// === 辅助渲染函数 ===

function _createListItem(item, type) {
    let metaHtml = '', actionsHtml = '', dataAttributes = '';
    for (const key in item) {
        const value = typeof item[key] === 'object' ? JSON.stringify(item[key]).replace(/"/g, '"') : item[key];
        dataAttributes += `data-${key.toLowerCase()}="${value}" `;
    }

    switch (type) {
        case 'announcement':
            metaHtml = `<span class="item-tag">${item.type}</span><span>合作演员: ${item.actor}</span>`;
            break;
        case 'customization':
            metaHtml = `<span class="item-tag">${item.typename}</span><span>粉丝: ${item.fanid}</span><span class="item-price">酬劳: ${item.reward}</span>`;
            actionsHtml = `<div class="item-actions"><button class="action-button reject-btn">忽略</button><button class="action-button accept-btn">接取</button></div>`;
            break;
        case 'theater':
            metaHtml = `<span>标签: ${item.tags}</span><span>评分: ${item.rating}</span>`;
            break;
        case 'shop':
            metaHtml = `<span class="item-tag">商品</span><span class="item-price">价格: ${item.price}</span>`;
            break;
    }

    return `<div class="list-item" data-type="${type}" ${dataAttributes}><div class="item-title">${item.title || item.name}</div><div class="item-meta">${metaHtml}</div>${actionsHtml}</div>`;
}

// [妈妈的修复] 重命名函数以保持一致，并确保它能正确地找到并操作弹窗
function showTheaterDetailModal(type, itemData) {
    const modal = jQuery_API(parentWin.document.body).find('#theater-modal');
    if (!modal.length) { console.error("Theater modal not found!"); return; }

    const header = modal.find('.theater-modal-header');
    const body = modal.find('.theater-modal-body');
    const footer = modal.find('.theater-modal-footer');
    // 把数据暂存到模态框上，方便事件处理器获取
    modal.find('.theater-modal-content').data('item', itemData);

    let headerHtml = '', bodyHtml = '', footerHtml = '';
    switch (type) {
        case 'announcement':
            headerHtml = itemData.title;
            bodyHtml = `<div class="detail-section"><h4>剧情简介</h4><p>${itemData.description}</p></div>`;
            footerHtml = `<button class="action-button reject-btn modal-close">返回</button><button class="action-button accept-btn" id="start-shooting-btn">开始拍摄</button>`;
            break;
        case 'customization':
            headerHtml = `${itemData.fanid} 的定制`;
            bodyHtml = `<div class="detail-section"><h4>定制类型</h4><p>${itemData.typename}</p></div><div class="detail-section"><h4>内容要求</h4><p>${itemData.request}</p></div><div class="detail-section"><h4>备注</h4><p>${itemData.notes || '无'}</p></div>`;
            footerHtml = `<button class="action-button reject-btn modal-close">返回</button><button class="action-button accept-btn" id="accept-custom-btn">接取</button>`;
            break;
        case 'theater':
            headerHtml = itemData.title;
            bodyHtml = `<div class="cover-image" style="background-image: url('${itemData.cover || ''}')"></div><div class="detail-section"><h4>作品简介</h4><p>${itemData.description}</p></div><div class="detail-section"><h4>粉丝热评</h4><div>${_renderComments(itemData.reviews)}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
        case 'shop':
            headerHtml = itemData.name;
            bodyHtml = `<div class="detail-section"><h4>商品卖点</h4><p>${itemData.description}</p></div><div class="detail-section"><h4>当前最高价</h4><p>${itemData.highestbid}</p></div><div class="detail-section"><h4>评论区</h4><div>${_renderComments(itemData.comments)}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
    }

    header.html(headerHtml);
    body.html(bodyHtml);
    footer.html(footerHtml);
    modal.addClass('visible');
}

function _renderComments(reviews) {
    if (!reviews) return '<p>暂无评论。</p>';
    let reviewsArray = [];
    try {
        reviewsArray = typeof reviews === 'string' ? JSON.parse(reviews.replace(/'/g, '"')) : reviews;
    } catch (e) { console.error("解析评论失败:", e, reviews); return '<p>评论加载失败。</p>'; }
    if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) return '<p>暂无评论。</p>';
    return reviewsArray.map(r => `<div class="comment"><span class="comment-user">${r.user}:</span> ${r.text}</div>`).join('');
}

// [妈妈的修复] 导出正确的、经过重构的对象
export const TheaterRenderer = {
    init,
    renderTheaterView,
    renderTheaterPage, // 导出此函数供筛选器使用
    showTheaterDetailModal, // 导出正确的弹窗函数名
    switchPage,
    updateNav
};
