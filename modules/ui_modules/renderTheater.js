import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';
// 引入数据加载方法
import { fetchAllTheaterData } from './theaterData.js';

let jQuery_API, parentWin, UI;
let isInitialized = false;

export function init(deps, uiObject) {
    if (isInitialized) return;
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    _injectBaseStyles();
    // 初始化时加载数据（关键修复：确保渲染前有数据）
    fetchAllTheaterData().then(() => {
        isInitialized = true;
        // 数据加载后如果已打开剧场，重新渲染
        if (PhoneSim_State.currentView === 'theaterapp') {
            renderTheaterView();
        }
    });
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
    // 等待初始化完成（数据加载完毕）
    if (!isInitialized) {
        setTimeout(() => renderTheaterView(initialPage), 100);
        return;
    }

    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    let view = p.find('#theaterapp-view');
    
    if (view.length === 0) {
        view = jQuery_API(`<div id="theaterapp-view" class="view"></div>`);
        p.append(view);
    }
    
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
    
    switchPage(initialPage);
    updateNav(initialPage);
    if (!PhoneSim_State.theaterInit) {
        PhoneSim_State.theaterInit = true;
    }
}

function _bindEvents() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    
    view.off('click.phonesim');
    p.off('click.phonesim', '#theaterapp-view .back-to-home-btn');
    p.on('click.phonesim', '#theaterapp-view .back-to-home-btn', () => {
        PhoneSim_Sounds.play('tap');
        UI.showView('HomeScreen');
    });
    
    p.off('click.phonesim', '#theaterapp-view .theater-refresh-btn');
    p.off('click.phonesim', '#theaterapp-view .nav-btn');
    
    p.on('click.phonesim', '#theater-content-area .theater-refresh-btn', async function() {
        PhoneSim_Sounds.play('send');
        const page = jQuery_API(this).data('page');
        const pageMap = {
            'announcements': '通告列表',
            'customizations': '粉丝定制',
            'theater': '剧场列表',
            'shop': '欲色商城'
        };
        const prompt = pageMap[page] ? `(系统提示：{{user}}刷新了欲色剧场的“${pageMap[page]}”页面)` : '';
        if (prompt) {
            await UI.triggerAIGeneration(prompt);
        }
        // 刷新时重新加载数据
        await fetchAllTheaterData();
        switchPage(page);
    });
    
    p.on('click.phonesim', '#theaterapp-view .nav-btn', function() {
        const btn = jQuery_API(this);
        if (btn.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const page = btn.data('page');
        switchPage(page);
        updateNav(page);
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
            // 绑定筛选按钮事件
            contentArea.find('.filter-btn').on('click', function() {
                const filter = jQuery_API(this).data('filter');
                contentArea.find('.filter-btn').removeClass('active');
                jQuery_API(this).addClass('active');
                // 根据筛选加载对应数据
                const listHtml = filter === 'all' ? _getListHtml('theater') : _getListHtml(`theater_${filter}`);
                contentArea.find('.list-container').html(listHtml);
            });
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

// 关键修复：从全局状态获取解析后的对象数组，而非原始HTML
function _getListHtml(type) {
    // 确保数据存在
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
        if (typeof item[key] === 'object') {
            // 对象转义为HTML属性
            dataAttributes += `data-${key.toLowerCase()}="${JSON.stringify(item[key]).replace(/"/g, '&quot;')}" `;
        } else if (item[key]) {
            dataAttributes += `data-${key.toLowerCase()}="${item[key].replace(/"/g, '&quot;')}" `;
        }
    }
    switch (type) {
        case 'announcements':
            metaHtml = `<span class="item-tag">${item.type || '通告'}</span><span>合作演员: ${item.actor || '未知'}</span><span class="item-price">${item.payment || '未知'}</span>`;
            break;
        case 'customizations':
            metaHtml = `<span class="item-tag">${item.typename || item.typename || '定制'}</span><span>粉丝: ${item.fanid || item.fanid || '匿名'}</span><span class="item-price">酬劳: ${item.payment || '未知'}</span>`;
            actionsHtml = `
                <div class="item-actions">
                    <button class="action-button reject-btn">忽略</button>
                    <button class="action-button accept-btn">接取</button>
                </div>`;
            break;
        case 'theater':
        case 'theater_hot':
        case 'theater_new':
        case 'theater_recommended':
        case 'theater_paid':
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
            headerHtml = `${itemData.fanid || itemData.fanid} 的定制`;
            bodyHtml = `
                <div class="detail-section"><h4>定制类型</h4><p>${itemData.typename || itemData.typename || '无'}</p></div>
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
    let reviewsArray = Array.isArray(reviews) ? reviews : [];
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
