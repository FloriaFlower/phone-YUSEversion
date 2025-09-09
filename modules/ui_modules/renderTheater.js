

import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, UI;

/**
 * 初始化渲染模块
 * @param {object} deps - 依赖项，包含jQuery API等
 * @param {object} uiObject - 主UI对象，用于调用其他UI函数
 */
export function init(deps, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
}

/**
 * 主渲染函数：渲染整个欲色剧场App的视图
 * @param {string} initialPage - 初始加载的子页面 (announcements, customizations, etc.)
 */
export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    const contentWrapper = view.find('.app-content');
    const nav = view.find('.theater-footer-nav'); // 使用新的class选择器

    // 如果还没有内容框架，就先创建它
    if (contentWrapper.length === 0) {
        // 清空旧内容，构建新结构
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
        `);
    }

    // 根据初始页面渲染对应内容
    switchPage(initialPage);
    updateNav(initialPage);
}


/**
 * 切换并渲染指定的子页面
 * @param {string} pageName - 子页面名称
 */
function switchPage(pageName) {
    const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
    contentArea.empty(); // 清空当前内容准备渲染新页面

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

/**
 * 更新底部导航栏的激活状态
 * @param {string} activePage - 当前激活的页面名称
 */
function updateNav(activePage) {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .theater-footer-nav .nav-btn');
    navButtons.removeClass('active');
    navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}

// =================================================================
// =================== 子页面渲染函数 ===================
// =================================================================

/**
 * 渲染“通告列表”页面
 * @param {jQuery} container - 页面内容的容器元素
 */
function _renderAnnouncementsPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>通告列表</h2>
            <button class="theater-refresh-btn" data-page="announcements" title="刷新通告"><i class="fas fa-sync-alt"></i></button>
        </div>
    `;
    const announcements = PhoneSim_State.theaterData?.announcements || [];
    const listHtml = announcements.length > 0
        ? announcements.map(item => _createListItem(item, 'announcement')).join('')
        : '<p class="empty-list">当前没有新的拍摄通告。</p>';

    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}

/**
 * 渲染“粉丝定制”页面
 * @param {jQuery} container - 页面内容的容器元素
 */
function _renderCustomizationsPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>粉丝定制</h2>
            <button class="theater-refresh-btn" data-page="customizations" title="刷新定制"><i class="fas fa-sync-alt"></i></button>
        </div>
    `;
    const customizations = PhoneSim_State.theaterData?.customizations || [];
    const listHtml = customizations.length > 0
        ? customizations.map(item => _createListItem(item, 'customization')).join('')
        : '<p class="empty-list">暂时没有需要处理的粉丝定制。</p>';

    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}

/**
 * 渲染“剧场列表”页面
 * @param {jQuery} container - 页面内容的容器元素
 * @param {string} filter - 当前应用的筛选器 (e.g., 'hot', 'new')
 */
function _renderTheaterPage(container, filter = 'all') {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>剧场列表</h2>
            <button class="theater-refresh-btn" data-page="theater" title="刷新剧场"><i class="fas fa-sync-alt"></i></button>
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
}

/**
 * 渲染“洛洛商城”页面
 * @param {jQuery} container - 页面内容的容器元素
 */
function _renderShopPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>洛洛商城</h2>
            <button class="theater-refresh-btn" data-page="shop" title="刷新商城"><i class="fas fa-sync-alt"></i></button>
        </div>
    `;
    const shopItems = PhoneSim_State.theaterData?.shop || [];
    const listHtml = shopItems.length > 0
        ? shopItems.map(item => _createListItem(item, 'shop')).join('')
        : '<p class="empty-list">商城正在补货中...</p>';

    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}


// =================================================================
// =================== 辅助渲染函数 ===================
// =================================================================

/**
 * 创建一个通用的列表项HTML
 * @param {object} item - 数据对象
 * @param {string} type - 列表项类型
 * @returns {string} - HTML字符串
 */
function _createListItem(item, type) {
    let metaHtml = '';
    let actionsHtml = '';
    let dataAttributes = '';

    // 将对象的所有键值对转换为data-*属性
    for (const key in item) {
        // 确保值是简单类型或可序列化的JSON字符串
        const value = typeof item[key] === 'object' ? JSON.stringify(item[key]).replace(/"/g, '"') : item[key];
        dataAttributes += `data-${key.toLowerCase()}="${value}" `;
    }

    switch (type) {
        case 'announcement':
            metaHtml = `<span class="item-tag">${item.type}</span><span>合作演员: ${item.actor}</span>`;
            break;
        case 'customization':
            metaHtml = `<span class="item-tag">${item.typeName}</span><span>粉丝: ${item.fanId}</span><span class="item-price">酬劳: ${item.reward}</span>`;
            actionsHtml = `
                <div class="item-actions">
                    <button class="action-button reject-btn">忽略</button>
                    <button class="action-button accept-btn">接取</button>
                </div>`;
            break;
        case 'theater':
            metaHtml = `<span>标签: ${item.tags}</span><span>评分: ${item.rating}</span>`;
            break;
        case 'shop':
            metaHtml = `<span class="item-tag">商品</span><span class="item-price">价格: ${item.price}</span>`;
            break;
    }

    return `
        <div class="list-item" data-type="${type}" ${dataAttributes}>
            <div class="item-title">${item.title || item.name}</div>
            <div class="item-meta">${metaHtml}</div>
            ${actionsHtml}
        </div>
    `;
}

/**
 * 显示详情弹窗
 * @param {string} type - 'announcement', 'customization', etc.
 * @param {object} itemData - 弹窗所需的数据
 */
export function showDetailModal(type, itemData) {
    const modal = jQuery_API(parentWin.document.body).find('#theater-modal');
    const header = modal.find('.theater-modal-header');
    const body = modal.find('.theater-modal-body');
    const footer = modal.find('.theater-modal-footer');

    let headerHtml = '', bodyHtml = '', footerHtml = '';

    switch (type) {
        case 'announcement':
            headerHtml = itemData.title;
            bodyHtml = `<div class="detail-section"><h4>剧情简介</h4><p>${itemData.description}</p></div>`;
            footerHtml = `<button class="action-button reject-btn modal-close">返回</button><button class="action-button accept-btn" id="start-shooting-btn">开始拍摄</button>`;
            break;
        case 'customization':
            headerHtml = `${itemData.fanid} 的定制`;
            bodyHtml = `
                <div class="detail-section"><h4>定制类型</h4><p>${itemData.typename}</p></div>
                <div class="detail-section"><h4>内容要求</h4><p>${itemData.request}</p></div>
                <div class="detail-section"><h4>备注</h4><p>${itemData.notes || '无'}</p></div>`;
            footerHtml = `<button class="action-button reject-btn modal-close">返回</button><button class="action-button accept-btn" id="accept-custom-btn">接取</button>`;
            break;
        case 'theater':
            headerHtml = itemData.title;
            const commentsHtml = _renderComments(itemData.reviews);
            bodyHtml = `
                <div class="cover-image" style="background-image: url('${itemData.cover || ''}')"></div>
                <div class="detail-section"><h4>作品简介</h4><p>${itemData.description}</p></div>
                <div class="detail-section"><h4>粉丝热评</h4><div>${commentsHtml}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
        case 'shop':
            headerHtml = itemData.name;
            const shopCommentsHtml = _renderComments(itemData.comments);
            bodyHtml = `
                <div class="detail-section"><h4>商品卖点</h4><p>${itemData.description}</p></div>
                <div class="detail-section"><h4>当前最高价</h4><p>${itemData.highestbid}</p></div>
                <div class="detail-section"><h4>评论区</h4><div>${shopCommentsHtml}</div></div>`;
            footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;
            break;
    }

    header.html(headerHtml);
    body.html(bodyHtml);
    footer.html(footerHtml);
    modal.addClass('visible');
}

/**
 * 解析并渲染评论区
 * @param {string | object} reviews - 评论数据，可能是字符串或对象数组
 * @returns {string} - 渲染后的HTML字符串
 */
function _renderComments(reviews) {
    if (!reviews) return '<p>暂无评论。</p>';
    let reviewsArray = [];
    if (typeof reviews === 'string') {
        try {
            // 替换单引号为双引号以兼容JSON
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
            <span class="comment-user">${r.user}:</span> ${r.text}
        </div>`).join('');
}

// 暴露给外部调用的函数
export const TheaterRenderer = {
    init,
    renderTheaterView,
    showDetailModal,
    switchPage,
    updateNav
};
