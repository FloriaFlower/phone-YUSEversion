import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI, DataHandler;

// 初始化模块，传入依赖项
export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    DataHandler = dataHandler;
}

// 主渲染函数，根据当前激活的页面调用相应的子渲染函数
export function renderTheaterView() {
    const p = jQuery_API(parentWin.document.body).find('#phone-sim-panel-v10-0');
    const view = p.find('#theaterapp-view'); // 锁定主视图
    const activePage = PhoneSim_State.activeSubviews.theaterapp || 'announcements';

    // 更新底部导航栏的激活状态
    view.find('.footer-nav .nav-btn').removeClass('active');
    view.find(`.footer-nav .nav-btn[data-page="${activePage}"]`).addClass('active');

    // 根据页面渲染内容
    switch (activePage) {
        case 'announcements':
            renderAnnouncementsPage();
            break;
        case 'customizations':
            renderCustomizationsPage();
            break;
        case 'theater':
            renderTheaterListPage();
            break;
        case 'shop':
            renderShopPage();
            break;
        default:
            renderAnnouncementsPage(); // 默认页面
    }
}

// 渲染“通告列表”页面
function renderAnnouncementsPage() {
    const contentArea = jQuery_API(parentWin.document.body).find('#theaterapp-view .app-content').empty();
    const announcementsHtml = PhoneSim_State.yuseTheaterData?.announcements?.trim();
    if (announcementsHtml) {
        contentArea.html(announcementsHtml);
    } else {
        contentArea.html('<div class="email-empty-state">暂无拍摄通告</div>');
    }
}

// 渲染“粉丝定制”页面
function renderCustomizationsPage() {
    const contentArea = jQuery_API(parentWin.document.body).find('#theaterapp-view .app-content').empty();
    const customizationsHtml = PhoneSim_State.yuseTheaterData?.customizations?.trim();
    if (customizationsHtml) {
        contentArea.html(customizationsHtml);
    } else {
        contentArea.html('<div class="email-empty-state">暂无粉丝定制</div>');
    }
}

// 渲染“剧场列表”页面（包含筛选器）
function renderTheaterListPage() {
    const contentArea = jQuery_API(parentWin.document.body).find('#theaterapp-view .app-content').empty();

    // 添加筛选器和列表容器
    const pageHtml = `
        <div class="theater-filters">
            <button class="filter-btn active" data-filter="hot">🔥 最热</button>
            <button class="filter-btn" data-filter="new">🆕 最新</button>
            <button class="filter-btn" data-filter="recommended">❤️ 推荐</button>
            <button class="filter-btn" data-filter="paid">💸 高价定制</button>
        </div>
        <div id="theater-list-container">
            <!-- 内容将由 renderFilteredTheaterList 动态填充 -->
        </div>
    `;
    contentArea.html(pageHtml);

    renderFilteredTheaterList('hot');
}


// 渲染“洛洛商城”页面
function renderShopPage() {
    const contentArea = jQuery_API(parentWin.document.body).find('#theaterapp-view .app-content').empty();
    const shopHtml = PhoneSim_State.yuseTheaterData?.shop?.trim();
    if (shopHtml) {
        contentArea.html(shopHtml);
    } else {
        contentArea.html('<div class="email-empty-state">商城正在补货中</div>');
    }
}

// 用于根据筛选条件动态更新剧场列表的函数
export function renderFilteredTheaterList(filterType) {
    const view = jQuery_API(parentWin.document.body).find('#theaterapp-view');
    const container = view.find('#theater-list-container');
    if (!container.length) return;

    view.find('.theater-filters .filter-btn').removeClass('active');
    view.find(`.theater-filters .filter-btn[data-filter="${filterType}"]`).addClass('active');

    let contentToLoad = '';
    const theaterData = PhoneSim_State.yuseTheaterData;

    switch (filterType) {
        case 'hot':
            contentToLoad = theaterData?.theater_hot;
            break;
        case 'new':
            contentToLoad = theaterData?.theater_new;
            break;
        case 'recommended':
            contentToLoad = theaterData?.theater_recommended;
            break;
        case 'paid':
            contentToLoad = theaterData?.theater_paid;
            break;
        default:
            contentToLoad = theaterData?.theater_hot;
    }

    const trimmedContent = contentToLoad?.trim();
    if (trimmedContent) {
        container.html(trimmedContent);
    } else {
        container.html('<div class="email-empty-state">该分类下暂无影片</div>');
    }
}
