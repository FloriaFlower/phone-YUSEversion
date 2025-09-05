import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    DataHandler = dataHandler;
}

export function showView(viewId, navLevel, options = {}) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const currentView = p.find('.view.active');
    const targetView = p.find(`#${viewId}`);

    if (currentView.attr('id') === viewId) return;

    currentView.removeClass('active');
    targetView.addClass('active');

    PhoneSim_State.currentView = viewId;
    PhoneSim_State.currentNavLevel = navLevel;
}

export function togglePanel(forceState, isInitialLoad = false) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const currentState = p.is(':visible');
    const newState = forceState === undefined ? !currentState : forceState;

    if (newState === currentState && !isInitialLoad) return;

    PhoneSim_State.isPanelVisible = newState;

    if (newState) {
        p.fadeIn(200);
        if (!PhoneSim_State.hasLoadedInitialData) {
            DataHandler.fetchAllData();
            PhoneSim_State.hasLoadedInitialData = true;
        }
    } else {
        p.fadeOut(200);
    }
    PhoneSim_State.saveUiState();
}

export async function initializeUI() {
    try {
        const body = jQuery_API(parentWin.document.body);
        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length > 0) return true;

        // 【黄金坐标导航】
        // 我们不再猜测路径，我们直接从宝箱里取出黄金坐标
        if (!PhoneSim_State.basePath) {
            throw new Error("Base path is not set in State. Cannot locate panel.html.");
        }
        const panelUrl = `${PhoneSim_State.basePath}/panel.html`;

        console.log(`[Phone Sim] GPS Navigation: Fetching panel from黄金坐标: ${panelUrl}`);
        const response = await fetch(panelUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch panel.html: ${response.status} ${response.statusText}`);
        }
        const templateHtml = await response.text();
        if (!templateHtml) {
            throw new Error("Fetched panel.html is empty.");
        }

        body.append(templateHtml);

        UI.createToggleButton();
        UI.applyCustomizations();
        UI.addEventListeners();
        UI.populateApps();
        UI.updateScaleAndPosition();

        console.log('%c[Phone Sim] GPS UI Core successfully built.', 'color: #00BCD4; font-weight: bold;');
        return true;
    } catch (error) {
        console.error('[Phone Sim] CRITICAL UI Initialization Failure:', error);
        if (parentWin.toastr) {
            parentWin.toastr.error('手机模拟器UI加载失败，请检查控制台获取详细信息。', '严重错误');
        }
        return false;
    }
}
