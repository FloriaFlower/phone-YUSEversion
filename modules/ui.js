import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, SillyTavern_Context_API, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_Context_API = deps.st_context;
    UI = uiObject;
    DataHandler = dataHandler;
}

function _createToggleButton() {
    const buttonHtml = `
        <div id="${PhoneSim_Config.TOGGLE_BUTTON_ID}" title="手机模拟器">
            <i class="fas fa-mobile-alt"></i>
            <div class="unread-badge" style="display:none;"></div>
        </div>`;
    jQuery_API(parentWin.document.body).append(buttonHtml);
}

function _createAuxiliaryElements() {
    if (jQuery_API(parentWin.document.body).find('#phone-sim-file-input').length === 0) {
        jQuery_API(parentWin.document.body).append('<input type="file" id="phone-sim-file-input" accept="image/*" style="display:none;">');
    }

    const dialogHtml = `
        <div class="phone-sim-dialog-overlay" id="phone-sim-dialog-overlay" style="display:none;">
            <div class="phone-sim-dialog">
                <h3 id="phone-sim-dialog-title"></h3>
                <div class="dialog-content"><textarea id="phone-sim-dialog-textarea" class="dialog-input"></textarea></div>
                <div class="dialog-buttons">
                    <button id="phone-sim-dialog-cancel" class="dialog-btn cancel-btn">取消</button>
                    <button id="phone-sim-dialog-confirm" class="dialog-btn confirm-btn">确定</button>
                </div>
            </div>
        </div>
        <div class="phone-sim-dialog-overlay" id="phone-sim-call-input-overlay" style="display:none;">
             <div class="phone-sim-dialog">
                <h3 id="phone-sim-call-input-title">在通话中发言</h3>
                <div class="dialog-content"><textarea id="phone-sim-call-input-textarea" class="dialog-input" placeholder="输入你想说的话..."></textarea></div>
                <div class="dialog-buttons">
                    <button id="phone-sim-call-input-cancel" class="dialog-btn cancel-btn">取消</button>
                    <button id="phone-sim-call-input-confirm" class="dialog-btn confirm-btn">发送</button>
                </div>
            </div>
        </div>`;
    jQuery_API(parentWin.document.body).append(dialogHtml);
}


export async function initializeUI() {
    try {
        const body = jQuery_API(parentWin.document.body);

        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length > 0) {
            console.warn(`[Phone Sim] Panel already exists. Aborting UI creation.`);
            return true;
        }

        const coreJsUrl = new URL(import.meta.url);
        const basePath = coreJsUrl.pathname.substring(0, coreJsUrl.pathname.lastIndexOf('/modules/ui_modules'));
        const panelUrl = `${basePath}/panel.html`;

        console.log(`[Phone Sim] Fetching panel from: ${panelUrl}`);
        const response = await fetch(panelUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch panel.html: ${response.status} ${response.statusText}`);
        }
        const templateHtml = await response.text();
        if (!templateHtml) {
            throw new Error("Fetched panel.html is empty.");
        }

        body.append(templateHtml);

        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length === 0) {
             throw new Error("Panel element not found in DOM after injection.");
        }

        _createToggleButton();
        _createAuxiliaryElements();

        UI.populateApps();
        UI.renderStickerPicker();
        UI.applyCustomizations();
        UI.addEventListeners();
        UI.updateScaleAndPosition();

        if (parentWin.document.readyState === "complete") {
            const emojiScript = document.createElement('script');
            emojiScript.type = 'module';
            emojiScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
            parentWin.document.head.appendChild(emojiScript);
        }

        body.find(`#${PhoneSim_Config.PANEL_ID}`).hide();

        return true;
    } catch (error) {
        console.error('[Phone Sim] CRITICAL UI Initialization Failure:', error);
        if (parentWin.toastr) {
            parentWin.toastr.error("手机模拟器插件UI加载失败，请检查控制台以获取详细信息并尝试刷新页面。", "严重错误", { timeOut: 10000 });
        }
        return false;
    }
}

export function togglePanel(forceShow = null) {
    const panel = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const shouldShow = forceShow !== null ? forceShow : panel.is(':hidden');

    PhoneSim_State.isPanelVisible = shouldShow;
    PhoneSim_State.saveUiState();

    if (shouldShow) {
        panel.show();
        UI.updateScaleAndPosition();
        UI.updateTime();
        DataHandler.fetchAllData().then(() => {
            // [妈妈的修改] 此处的调用是正确的，它会调用 ui.js 中的 rerenderCurrentView
            UI.rerenderCurrentView();
        });
    } else {
        panel.hide();
    }
}

// [妈妈的修改] 以下函数已被移至 ui.js，此处不再需要它们。
// rerenderCurrentView
// showView
// renderViewContent
// renderCreationView
// showAddFriendDialog
