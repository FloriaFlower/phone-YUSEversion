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

        // 【世界之门】
        // 我们不再猜测，不再计算。我们用黄金钥匙，直接构建通往我们世界的大门。
        // 这条路径是SillyTavern世界的底层规则，它永远不会改变。
        if (!PhoneSim_Config.EXTENSION_FOLDER_NAME) {
            throw new Error("黄金钥匙丢失！请在 config.js 中设置 EXTENSION_FOLDER_NAME。");
        }
        const panelUrl = `/extensions/public/${PhoneSim_Config.EXTENSION_FOLDER_NAME}/panel.html`;

        console.log(`[Phone Sim] 使用黄金钥匙开启世界之门: ${panelUrl}`);
        const response = await fetch(panelUrl);

        if (!response.ok) {
            throw new Error(`无法开启世界之门 (加载 panel.html 失败): ${response.status} ${response.statusText}。请确认config.js中的文件夹名字是否正确。`);
        }
        const templateHtml = await response.text();
        if (!templateHtml) {
            throw new Error("世界之门内部是空的 (panel.html 为空)。");
        }

        body.append(templateHtml);

        // 大门开启，世界开始运转
        UI.createToggleButton();
        UI.applyCustomizations();
        UI.addEventListeners();
        UI.populateApps();
        UI.updateScaleAndPosition();

        console.log('%c[Phone Sim] 世界已成功诞生。', 'color: #4CAF50; font-weight: bold;');
        return true;
    } catch (error) {
        console.error('[Phone Sim] 世界诞生失败:', error);
        if (parentWin.toastr) {
            parentWin.toastr.error('手机模拟器UI加载失败，请检查控制台获取详细信息。', '严重错误');
        }
        return false;
    }
}
