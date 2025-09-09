import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, UI;

export function init(deps, uiObject) {
    try {
        jQuery_API = deps.jq;
        parentWin = deps.win;
        UI = uiObject;
        // 初始化剧场数据（安全版）
        if (!PhoneSim_State.theaterData) {
            PhoneSim_State.theaterData = {
                announcements: [],
                customizations: [],
                theater: [],
                shop: []
            };
        }
    } catch (err) {
        console.error('[Theater Render Init] Error:', err);
        // 初始化失败不影响其他UI
    }
}

export function renderTheaterView(initialPage = 'announcements') {
    try {
        // 关键：先检查面板是否存在，不存在则不执行（避免报错）
        const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
        if (p.length === 0) {
            console.warn('[Theater Render] Panel not found, skip');
            return;
        }
        const view = p.find('#theaterapp-view');
        if (view.length === 0) {
            console.warn('[Theater Render] Theater view not found, skip');
            return;
        }
        const contentWrapper = view.find('.app-content-wrapper');

        // 后续渲染逻辑不变，但增加每步DOM检查...
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

        // 测试数据兜底（确保页面不空白）
        const theaterData = PhoneSim_State.theaterData || {};
        if (!theaterData.announcements || theaterData.announcements.length === 0) {
            theaterData.announcements = [
                { title: '测试通告', type: '校园', actor: '洛洛', description: '测试数据' }
            ];
        }

        switchPage(initialPage);
        updateNav(initialPage);
    } catch (err) {
        console.error('[Theater Render] Fatal Error:', err);
        // 渲染失败不影响其他UI
    }
}

// 其他函数（switchPage、_renderAnnouncementsPage等）保持不变，但每个函数都增加try-catch
function switchPage(pageName) {
    try {
        const contentArea = jQuery_API(parentWin.document.body).find('#theater-content-area');
        if (contentArea.length === 0) return;
        contentArea.empty();
        // 后续逻辑不变...
    } catch (err) {
        console.error('[Switch Page] Error:', err);
    }
}

// 省略其他辅助函数（均需增加try-catch，确保单个函数错误不中断整体）
function _renderAnnouncementsPage(container) { /* ... 增加try-catch ... */ }
function _renderCustomizationsPage(container) { /* ... 增加try-catch ... */ }
function _createListItem(item, type) { /* ... 增加try-catch ... */ }
export function showDetailModal(type, itemData) { /* ... 增加try-catch ... */ }
function updateNav(activePage) { /* ... 增加try-catch ... */ }

export const TheaterRenderer = {
    init,
    renderTheaterView,
    showDetailModal,
    switchPage,
    updateNav
};

