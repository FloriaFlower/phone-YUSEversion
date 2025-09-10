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
function _injectBaseStyles() {
    // 移除旧样式，避免冲突
    const oldStyle = parentWin.document.querySelector('#theaterapp-base-style');
    if (oldStyle) oldStyle.remove();
    
    const style = parentWin.document.createElement('style');
    style.id = 'theaterapp-base-style';
    style.textContent = `
        /* 确保APP容器独立，不受外部影响 */
        #theaterapp-view {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            overflow: hidden;
            position: relative;
            background-color: #fafafa;
        }
        /* 头部固定 */
        .app-header {
            padding: 12px 16px;
            background: #fff;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0; /* 不被压缩 */
        }
        .app-back-btn {
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #000;
        }
        /* 内容区滚动 */
        .app-content-wrapper {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #fafafa;
        }
        #theater-content-area {
            width: 100%;
        }
        /* 底部导航固定 */
        .theater-footer-nav {
            display: flex;
            border-top: 1px solid #eee;
            background: #fff;
            flex-shrink: 0; /* 固定在底部 */
        }
        .nav-btn {
            flex: 1;
            padding: 12px 0;
            border: none;
            background: #fff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 14px;
        }
        .nav-btn.active {
            color: #007aff;
        }
        /* 页面头部 */
        .theater-page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #eee;
        }
        .theater-refresh-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: #666;
        }
        /* 列表样式 */
        .list-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .list-item {
            padding: 12px;
            border: 1px solid #eee;
            border-radius: 8px;
            background: #fff;
        }
        .item-title {
            font-weight: bold;
            margin-bottom: 8px;
        }
        .item-meta {
            font-size: 12px;
            color: #666;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .item-tag {
            padding: 2px 6px;
            background: #f0f0f0;
            border-radius: 4px;
        }
        .item-price {
            color: #ff4400;
        }
        .item-actions {
            display: flex;
            gap: 8px;
            margin-top: 10px;
            justify-content: flex-end;
        }
        .action-button {
            padding: 6px 12px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
        }
        .accept-btn {
            background: #007aff;
            color: white;
        }
        .reject-btn {
            background: #f0f0f0;
        }
        .empty-list {
            text-align: center;
            color: #999;
            padding: 40px 0;
        }
        /* 筛选器 */
        .theater-filters {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            overflow-x: auto;
            padding-bottom: 8px;
        }
        .filter-btn {
            padding: 6px 12px;
            border: 1px solid #eee;
            border-radius: 16px;
            background: white;
            cursor: pointer;
            white-space: nowrap;
        }
        .filter-btn.active {
            background: #007aff;
            color: white;
            border-color: #007aff;
        }
    `;
    parentWin.document.head.appendChild(style);
}
export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    // 清空旧内容，重建唯一结构
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
    // 绑定唯一事件（避免重复绑定）
    _bindUniqueEvents();
    // 初始渲染
    switchPage(initialPage);
    updateNav(initialPage);
}
// 新增：绑定唯一事件（防止重复绑定导致多按钮问题）
function _bindUniqueEvents() {
    const view = jQuery_API(parentWin.document.body).find('#theaterapp-view');
    const backBtn = view.find('.back-to-home-btn');
    const navButtons = view.find('.theater-footer-nav .nav-btn');
    
    // 解绑旧事件，避免重复
    backBtn.off('click.phonesim-theater');
    navButtons.off('click.phonesim-theater');
    
    // 绑定返回首页事件（无弹窗）
    backBtn.on('click.phonesim-theater', () => {
        PhoneSim_Sounds.play('tap');
        UI.showView('HomeScreen'); // 直接返回，不弹确认框
    });
    
    // 绑定导航事件
    navButtons.on('click.phonesim-theater', function() {
        const btn = jQuery_API(this);
        if (btn.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const pageName = btn.data('page');
        switchPage(pageName);
        updateNav(pageName);
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
// 子页面渲染函数（保持不变，移除重复的刷新按钮逻辑）
function _renderAnnouncementsPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>通告列表</h2>
            <button class="theater-refresh-btn" data-page="announcements"><<i class="fas fa-sync-alt"></</i></button>
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
            <button class="theater-refresh-btn" data-page="customizations"><<i class="fas fa-sync-alt"></</i></button>
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
            <button class="theater-refresh-btn" data-page="theater"><<i class="fas fa-sync-alt"></</i></button>
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
    // 绑定筛选事件（唯一绑定）
    container.find('.filter-btn').off('click.phonesim-theater').on('click.phonesim-theater', function() {
        const newFilter = jQuery_API(this).data('filter');
        _renderTheaterPage(container, newFilter);
    });
}
function _renderShopPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>欲色商城</h2>
            <button class="theater-refresh-btn" data-page="shop"><<i class="fas fa-sync-alt"></</i></button>
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
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    // 确保模态框唯一
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
    // 绑定模态框事件（唯一绑定）
    modal.find('.modal-close').off('click.phonesim-theater').on('click.phonesim-theater', function() {
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
