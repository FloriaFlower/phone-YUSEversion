import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, UI;

/**
 * 初始化渲染模块
 */
export function init(deps, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    // 初始化剧场数据（避免空数据导致页面空白）
    if (!PhoneSim_State.theaterData) {
        PhoneSim_State.theaterData = {
            announcements: [],
            customizations: [],
            theater: [],
            shop: []
        };
    }
}

/**
 * 主渲染函数：渲染整个欲色剧场App视图
 */
export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    const contentWrapper = view.find('.app-content-wrapper');

    // 1. 确保基础DOM结构存在（避免样式断层）
    if (contentWrapper.length === 0) {
        view.empty().append(`
            <div class="app-header">
                <button class="app-back-btn back-to-home-btn"><<i class="fas fa-chevron-left"></</i></button>
                <h3>欲色剧场</h3>
            </div>
            <div class="app-content-wrapper">
                <div id="theater-content-area"></div>
            </div>
            <div class="theater-footer-nav">
                <button class="nav-btn" data-page="announcements"><span class="icon">📢</span>通告拍摄</button>
                <button class="nav-btn" data-page="customizations"><span class="icon">💖</span>粉丝定制</button>
                <button class="nav-btn" data-page="theater"><span class="icon">🎬</span>剧场列表</button>
                <button class="nav-btn" data-page="shop"><span class="icon">🛒</span>欲色商城</button>
            </div>
        `);
    }

    // 2. 渲染初始页面（添加默认数据兜底，避免空白）
    const theaterData = PhoneSim_State.theaterData;
    // 若数据为空，添加测试数据
    if (theaterData.announcements.length === 0) {
        theaterData.announcements = [
            { title: '测试通告：校园短剧拍摄', type: '校园', actor: '洛洛、神秘嘉宾', description: '拍摄校园青春短剧，需配合校园场景' }
        ];
    }
    if (theaterData.customizations.length === 0) {
        theaterData.customizations = [
            { title: '粉丝定制：古风写真', fanId: '粉丝001', reward: '500元', typeName: '写真', request: '希望拍摄古风汉服主题' }
        ];
    }

    switchPage(initialPage);
    updateNav(initialPage);
}

/**
 * 切换子页面
 */
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

/**
 * 更新底部导航激活状态
 */
function updateNav(activePage) {
    const navButtons = jQuery_API(parentWin.document.body).find('#theaterapp-view .theater-footer-nav .nav-btn');
    navButtons.removeClass('active');
    navButtons.filter(`[data-page="${activePage}"]`).addClass('active');
}

// ------------------------------
// 子页面渲染函数（修复样式类名匹配）
// ------------------------------
function _renderAnnouncementsPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>通告拍摄</h2>
            <button class="theater-refresh-btn" data-page="announcements" title="刷新通告"><<i class="fas fa-sync-alt"></</i></button>
        </div>
    `;
    const announcements = PhoneSim_State.theaterData.announcements || [];
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
    const customizations = PhoneSim_State.theaterData.customizations || [];
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
        </div>
    `;
    const theaterItems = PhoneSim_State.theaterData.theater || [];
    // 测试数据兜底
    const itemsToShow = theaterItems.length > 0 ? theaterItems : [
        { title: '《校园青春》', tags: '校园、喜剧', rating: '4.8', reviews: [{ user: '粉丝002', text: '太好看了！' }] }
    ];

    const listHtml = itemsToShow.map(item => _createListItem(item, 'theater')).join('');
    container.html(headerHtml + filtersHtml + `<div class="list-container">${listHtml}</div>`);
}

function _renderShopPage(container) {
    const headerHtml = `
        <div class="theater-page-header">
            <h2>欲色商城</h2>
            <button class="theater-refresh-btn" data-page="shop" title="刷新商城"><<i class="fas fa-sync-alt"></</i></button>
        </div>
    `;
    const shopItems = PhoneSim_State.theaterData.shop || [];
    // 测试数据兜底
    const itemsToShow = shopItems.length > 0 ? shopItems : [
        { name: '拍摄道具：古风折扇', price: '30元', description: '拍摄古风必备道具' }
    ];

    const listHtml = itemsToShow.map(item => _createListItem(item, 'shop')).join('');
    container.html(headerHtml + `<div class="list-container">${listHtml}</div>`);
}

// ------------------------------
// 辅助函数：创建列表项（确保类名与CSS匹配）
// ------------------------------
function _createListItem(item, type) {
    let metaHtml = '';
    let actionsHtml = '';
    let dataAttributes = '';

    // 绑定数据到DOM（供events.js调用）
    for (const key in item) {
        const value = typeof item[key] === 'object' ? JSON.stringify(item[key]).replace(/"/g, '&quot;') : item[key];
        dataAttributes += `data-${key.toLowerCase()}="${value}" `;
    }

    // 按类型生成不同内容
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
 */
export function showDetailModal(type, itemData) {
    const modal = jQuery_API(parentWin.document.body).find('#theater-modal');
    const header = modal.find('.theater-modal-header');
    const body = modal.find('.theater-modal-body');
    const footer = modal.find('.theater-modal-footer');

    let headerHtml = itemData.title || itemData.name;
    let bodyHtml = `<div class="detail-section"><h4>详情</h4><p>${itemData.description || '暂无详情'}</p></div>`;
    let footerHtml = `<button class="action-button accept-btn modal-close">返回</button>`;

    header.html(headerHtml);
    body.html(bodyHtml);
    footer.html(footerHtml);
    modal.addClass('visible');
}

// 暴露外部调用接口
export const TheaterRenderer = {
    init,
    renderTheaterView,
    showDetailModal,
    switchPage,
    updateNav
};
