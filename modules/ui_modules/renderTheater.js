import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';
let jQuery_API, parentWin, UI;
export function init(deps, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    _injectBaseStyles();
}
// 保留样式注入，删除重复的CSS（依赖外部Theater.css）
function _injectBaseStyles() {
    const style = parentWin.document.createElement('style');
    style.textContent = `
        /* 仅保留必要的补充样式，核心样式依赖外部CSS */
        #theaterapp-view { height: 100%; }
        .theater-footer-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 10; }
        .app-content-wrapper { padding-bottom: 60px; /* 为底部导航预留空间 */ }
    `;
    parentWin.document.head.appendChild(style);
}
export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    // 关键修复：每次渲染前清空容器，避免重复生成
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
    _bindNavEvents();
    // 初始渲染时只执行一次页面切换
    if (!PhoneSim_State.theaterInit) {
        switchPage(initialPage);
        updateNav(initialPage);
        PhoneSim_State.theaterInit = true;
    }
}
// 修复导航事件绑定（使用事件委托，避免重复绑定）
function _bindNavEvents() {
    const view = jQuery_API(parentWin.document.body).find('#theaterapp-view');
    // 解绑旧事件，避免重复触发
    view.off('click', '.back-to-home-btn');
    view.on('click', '.back-to-home-btn', () => {
        PhoneSim_Sounds.play('tap');
        UI.showView('HomeScreen'); // 直接返回首页，删除alert弹窗
    });
}
// 简化页面切换逻辑，避免重复生成刷新按钮
function switchPage(pageName) {
    const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
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
// 提取列表渲染公共方法，避免代码冗余
function _getListHtml(type) {
    const data = PhoneSim_State.theaterData?.[type] || [];
    if (data.length === 0) {
        return '<p class="empty-list">暂无内容</p>';
    }
    return data.map(item => _createListItem(item, type)).join('');
}
// 保留其他原有方法（updateNav、_createListItem、showDetailModal等）
function updateNav(activePage) {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .theater-footer-nav .nav-btn');
    navButtons.removeClass('active');
    navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}
function _createListItem(item, type) {
    let metaHtml = '';
    let actionsHtml = '';
    let dataAttributes = '';
    for (const key in item) {
        const value = typeof item[key] === 'object' ? JSON.stringify(item[key]).replace(/"/g, '&quot;') : item[key];
        dataAttributes += `data-${key.toLowerCase()}="${value}" `;
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
    const modal = jQuery_API(parentWin.document.body).find('#theater-modal');
    if (modal.length === 0) {
        // 只创建一次模态框
        const modalHtml = `
            <div id="theater-modal" class="theater-modal-overlay">
                <div class="theater-modal-content">
                    <div class="theater-modal-header"></div>
                    <div class="theater-modal-body"></div>
                    <div class="theater-modal-footer"></div>
                </div>
            </div>
        `;
        jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`).append(modalHtml);
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
