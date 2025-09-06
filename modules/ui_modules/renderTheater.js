import { PhoneSim_Config } from '../../../config.js';
import { PhoneSim_State } from '../../state.js';
import { PhoneSim_Sounds } from '../../sounds.js';

// 模块作用域内的变量，用于存储从init传入的依赖
let jQuery_API, parentWin, SillyTavern_Context_API, TavernHelper_API;
let UI, DataHandler;

// 初始化函数，接收来自主脚本的依赖注入
export function init(deps, ui, data) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_Context_API = deps.st_context;
    TavernHelper_API = deps.th;
    UI = ui;
    DataHandler = data;
}

// ---- 模态框/弹窗 核心功能 ----
// 这些函数现在是模块内部的私有函数，负责控制弹窗的显示和隐藏

function showModal(header, body, footer) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const modal = p.find('#theater-modal'); // 我们为剧场App创建一个独立的模态框
    modal.find('.modal-header').html(header);
    modal.find('.modal-body').html(body);
    modal.find('.modal-footer').html(footer);
    modal.addClass('visible');
}

function hideModal() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    p.find('#theater-modal').removeClass('visible');
}

// ---- 内容解析与渲染 辅助函数 ----
// 这些函数负责将数据转换成具体的HTML元素，完美复刻了原版正则的细节

// 解析评论JSON字符串并返回HTML
function renderComments(reviewsString) {
    if (!reviewsString) return '';
    try {
        // 兼容原版正则中可能存在的单引号问题
        const reviews = JSON.parse(reviewsString.replace(/'/g, '"'));
        return reviews.map(r => `<div class="comment"><span class="comment-user">${r.user}:</span> ${r.text}</div>`).join('');
    } catch (e) {
        console.error("[Phone Sim Theater] Error parsing comments:", e, "Original string:", reviewsString);
        return ""; // 静默失败，不显示错误信息
    }
}

// 根据项目类型，将数据转换成列表项HTML
function parseItemToHtml(item, type) {
    // 将所有item数据作为data属性附加到元素上，方便事件处理器读取
    const dataAttributes = Object.entries(item).map(([key, value]) => `data-${key.toLowerCase()}="${String(value).replace(/"/g, '"')}"`).join(' ');

    let metaHtml = '';
    let actionsHtml = '';

    // 根据类型构建不同的显示内容，完全参照原版正则的逻辑
    switch (type) {
        case 'announcements':
            metaHtml = `<span class="item-meta">合作演员: <span class="item-tag">${item.actor}</span></span>`;
            actionsHtml = `<div class="item-actions"><button class="action-button reject-btn">忽略</button></div>`;
            break;
        case 'customizations':
            metaHtml = `<span class="item-meta">粉丝ID: <span class="item-tag">${item.fanId}</span></span><span class="item-meta">类型: ${item.typeName}</span><span class="item-meta">酬劳: <span class="item-price">${item.reward}</span></span>`;
            actionsHtml = `<div class="item-actions"><button class="action-button reject-btn">拒绝</button><button class="action-button accept-btn">接取</button></div>`;
            break;
        case 'theater_list':
            metaHtml = `<span class="item-meta">标签: <span class="item-tag">${item.tags}</span></span><span class="item-meta">评分: ${item.rating}</span>`;
            break;
        case 'shop':
            metaHtml = `<span class="item-meta">类型: <span class="item-tag">${item.category}</span></span><span class="item-meta">最高出价: <span class="item-price">${item.highestBid}</span></span>`;
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

// 渲染列表的通用函数
function renderList(items, type) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return `<div class="empty-list">这里什么都还没有哦。</div>`;
    }
    return items.map(item => parseItemToHtml(item, type)).join('');
}


// ---- 页面渲染核心 ----

// 渲染特定页面的函数，包含了我们想要的独立刷新按钮
function renderPage(pageKey, theaterData) {
    const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
    let pageHtml = '';
    const refreshButtonHtml = `<button class="theater-refresh-btn" data-page="${pageKey}" title="刷新当前列表"><i class="fa-solid fa-arrows-rotate"></i></button>`;

    // 从状态中安全地获取数据
    const data = theaterData || {};

    switch(pageKey) {
        case 'announcements':
            pageHtml = `
                <div class="theater-page-header"><h2>通告列表</h2>${refreshButtonHtml}</div>
                <div class="list-container">${renderList(data.announcements, 'announcements')}</div>`;
            break;
        case 'customizations':
            pageHtml = `
                <div class="theater-page-header"><h2>粉丝定制</h2>${refreshButtonHtml}</div>
                <div class="list-container">${renderList(data.customizations, 'customizations')}</div>`;
            break;
        case 'theater_list':
            pageHtml = `
                <div class="theater-page-header"><h2>剧场列表</h2>${refreshButtonHtml}</div>
                <div class="theater-filters">
                    <button class="filter-btn" data-filter="all_films">全部</button>
                    <button class="filter-btn" data-filter="hot">🔥 最热</button>
                    <button class="filter-btn" data-filter="new">🆕 最新</button>
                    <button class="filter-btn" data-filter="recommended">❤️ 推荐</button>
                    <button class="filter-btn" data-filter="paid">💸 高价定制</button>
                    <button class="filter-btn" data-filter="search">🔍 搜索</button>
                </div>
                <div id="theater-list-content" class="list-container">${renderList(data.theater_list?.all_films, 'theater_list')}</div>`;
            break;
        case 'shop':
            pageHtml = `
                <div class="theater-page-header"><h2>欲色商城</h2>${refreshButtonHtml}</div>
                <div class="list-container">${renderList(data.shop, 'shop')}</div>`;
            break;
        default:
            pageHtml = '<div class="empty-list">页面加载失败</div>';
    }
    contentArea.html(pageHtml);
}


// ---- 导出的主函数和接口 ----

// 主渲染函数：构建App的整体骨架
export function renderTheaterApp() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');

    const html = `
        <div class="app-header">
            <div class="back-to-home-btn"><i class="fa-solid fa-chevron-left"></i></div>
            <h3>欲色剧场</h3>
        </div>
        <div class="app-content-wrapper">
            <div id="theater-content-area"></div>
            <div class="theater-footer-nav">
                <button class="nav-btn active" data-page="announcements"><span class="icon">📢</span>通告</button>
                <button class="nav-btn" data-page="customizations"><span class="icon">💖</span>定制</button>
                <button class="nav-btn" data-page="theater_list"><span class="icon">🎬</span>剧场</button>
                <button class="nav-btn" data-page="shop"><span class="icon">🛒</span>商城</button>
            </div>
        </div>
        <!-- 为剧场App创建一个独立的、复用原版样式的模态框 -->
        <div id="theater-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header"></div>
                <div class="modal-body"></div>
                <div class="modal-footer"></div>
            </div>
        </div>
    `;
    view.html(html);

    // 加载默认页面
    renderPage('announcements', PhoneSim_State.theaterData);
}

// 导出页面切换函数，供 events.js 调用
export function switchTheaterPage(pageKey, filter = null) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const theaterData = PhoneSim_State.theaterData || {};

    // 更新底部导航高亮状态
    p.find('.theater-footer-nav .nav-btn').removeClass('active');
    p.find(`.theater-footer-nav .nav-btn[data-page="${pageKey}"]`).addClass('active');

    if (pageKey === 'theater_list' && filter) {
        // 如果是剧场列表且有筛选条件
        const listContent = p.find('#theater-list-content');
        const listData = theaterData.theater_list ? (theaterData.theater_list[filter] || theaterData.theater_list.all_films) : [];
        listContent.html(renderList(listData, 'theater_list'));
    } else {
        // 渲染整个页面
        renderPage(pageKey, theaterData);
    }
}

// 导出用于显示项目详情的函数，供 events.js 调用
export function showTheaterItemDetail(itemData, type) {
    let header, body, footer;

    switch (type) {
        case 'announcements':
            header = itemData.title;
            body = `<div class="detail-section"><h4>剧情简介</h4><p>${itemData.description}</p></div>`;
            footer = `<button class="action-button reject-btn" data-action="close-modal">返回</button><button class="action-button accept-btn" data-action="start-shooting">开始拍摄</button>`;
            break;
        case 'customizations':
            header = `${itemData.fanid} 的定制`;
            body = `<div class="detail-section"><h4>定制类型</h4><p>${itemData.typename}</p></div><div class="detail-section"><h4>内容要求</h4><p>${itemData.request}</p></div><div class="detail-section"><h4>备注</h4><p>${itemData.notes}</p></div>`;
            footer = `<button class="action-button reject-btn" data-action="close-modal">返回</button><button class="action-button accept-btn" data-action="accept-custom">接取</button>`;
            break;
        case 'theater_list':
            header = itemData.title;
            body = `<div class="cover-image" style="background-image: url('${itemData.cover}')"></div><div class="detail-section"><h4>作品简介</h4><p>${itemData.description}</p></div><div class="detail-section"><h4>粉丝热评</h4>${renderComments(itemData.reviews)}</div>`;
            footer = `<button class="action-button accept-btn" data-action="close-modal">返回</button>`;
            break;
        case 'shop':
            header = itemData.name;
            body = `<div class="cover-image" style="background-image: url('${itemData.cover}')"></div><div class="detail-section"><h4>商品卖点</h4><p>${itemData.description}</p></div><div class="detail-section"><h4>当前最高价</h4><p class="item-price">${itemData.highestbid}</p></div><div class="detail-section"><h4>评论区</h4>${renderComments(itemData.comments)}</div>`;
            footer = `<button class="action-button accept-btn" data-action="close-modal">返回</button>`;
            break;
        default:
            return; // 未知类型则不显示
    }

    showModal(header, body, footer);
}

// 导出关闭模态框的函数
export { hideModal as hideTheaterModal };
