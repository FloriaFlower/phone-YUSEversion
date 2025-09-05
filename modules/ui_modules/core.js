import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    DataHandler = dataHandler;
}


// 核心视图切换函数
export function showView(viewId, navLevel, options = {}) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const currentView = p.find('.view.active');
    const targetView = p.find(`#${viewId}`);

    if (currentView.attr('id') === viewId) return;

    currentView.removeClass('active');
    targetView.addClass('active');

    PhoneSim_State.currentView = viewId;
    PhoneSim_State.currentNavLevel = navLevel;

    if (options.clearPreviousState) {
        // Handle specific view cleanups if needed
    }
}

// 核心面板显隐函数
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

    // Save the state
    PhoneSim_State.saveUiState();
}


// 【凤凰骨架】这是我们绝对可靠的UI加载引擎
export async function initializeUI() {
    try {
        const body = jQuery_API(parentWin.document.body);
        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length > 0) {
            console.log('[Phone Sim] UI panel already exists. Initialization skipped.');
            return true;
        }

        // 1. 使用 import.meta.url 获取当前脚本的路径
        const coreJsUrl = new URL(import.meta.url);
        // 2. 通过相对路径计算出 panel.html 的绝对路径
        const basePath = coreJsUrl.pathname.substring(0, coreJsUrl.pathname.lastIndexOf('/modules/ui_modules'));
        const panelUrl = `${basePath}/panel.html`;

        console.log(`[Phone Sim] Phoenix Protocol: Fetching panel from stable URL: ${panelUrl}`);
        // 3. 使用标准 fetch API 异步加载 HTML 内容
        const response = await fetch(panelUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch panel.html: ${response.status} ${response.statusText}`);
        }
        const templateHtml = await response.text();
        if (!templateHtml) {
            throw new Error("Fetched panel.html is empty.");
        }

        // 4. 手动将获取到的 HTML 注入到主页面
        body.append(templateHtml);

        // 5. 注入成功后，执行所有一次性的UI设置
        UI.createToggleButton();
        UI.applyCustomizations();
        UI.addEventListeners();
        UI.populateApps();
        UI.updateScaleAndPosition();

        console.log('%c[Phone Sim] Phoenix UI Core successfully forged.', 'color: #00BCD4; font-weight: bold;');
        return true;
    } catch (error) {
        console.error('[Phone Sim] CRITICAL UI Initialization Failure:', error);
        if (parentWin.toastr) {
            parentWin.toastr.error('手机模拟器UI加载失败，请检查控制台获取详细信息。', '严重错误');
        }
        return false;
    }
}
