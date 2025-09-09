import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';
import { PhoneSim_Config } from './config.js';

'use strict';

const loggingPrefix = '[手机模拟器 v17.0_FIXED]';
const parentWin = typeof window.parent !== 'undefined' ? window.parent : window;

let mainProcessorTimeout;
let SillyTavern_Context, TavernHelper_API, jQuery_API;

function onSettingChanged() {
    PhoneSim_State.customization.enabled = jQuery_API("#phone_simulator_enabled").prop("checked");
    PhoneSim_State.saveCustomization();
    if (parentWin.toastr) {
        parentWin.toastr.info('设置已保存。刷新页面以应用更改。', '手机模拟器');
    }
}

function addSettingsHtml() {
    const settingsHtml = `
    <div class="phone-simulator-settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>手机模拟器 📱</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="block">
                    <label class="flex-container">
                        <input id="phone_simulator_enabled" type="checkbox" />
                        <span>启用手机模拟器</span>
                    </label>
                </div>
                <small>禁用后，手机模拟器将不会加载悬浮窗或处理任何指令。更改后需要刷新页面才能完全生效。</small>
            </div>
        </div>
    </div>`;
    jQuery_API("#extensions_settings2").append(settingsHtml);
    jQuery_API("#phone_simulator_enabled").prop("checked", PhoneSim_State.customization.enabled);
    jQuery_API("#phone_simulator_enabled").on("change", onSettingChanged);
}

const debouncedMainProcessor = (msgId) => {
    clearTimeout(mainProcessorTimeout);
    mainProcessorTimeout = setTimeout(() => {
        PhoneSim_DataHandler.mainProcessor(msgId);
    }, 250);
};

async function mainInitialize() {
    console.log(`%c${loggingPrefix} Core APIs ready. Initializing UI and modules...`, 'color: #4CAF50; font-weight: bold;');

    const dependencies = {
        st: parentWin.SillyTavern,
        st_context: SillyTavern_Context,
        th: TavernHelper_API,
        jq: jQuery_API,
        win: parentWin
    };

    PhoneSim_State.loadUiState();
    PhoneSim_Sounds.init(PhoneSim_State);

    // [妈妈的修复] 保证两个聚合器都完全初始化，并将完整的自身作为依赖传递进去
    PhoneSim_DataHandler.init(dependencies, PhoneSim_UI, PhoneSim_DataHandler);
    PhoneSim_UI.init(dependencies, PhoneSim_DataHandler, PhoneSim_UI);

    const uiInitialized = await PhoneSim_UI.initializeUI();
    if (!uiInitialized) {
        console.error(`${loggingPrefix} UI initialization failed. Aborting further setup.`);
        return;
    }

    await PhoneSim_DataHandler.fetchAllData();

    const e = SillyTavern_Context.eventTypes;
    SillyTavern_Context.eventSource.on(e.MESSAGE_EDITED, (id) => debouncedMainProcessor(id));
    SillyTavern_Context.eventSource.on(e.MESSAGE_RECEIVED, (id) => debouncedMainProcessor(id));
    SillyTavern_Context.eventSource.on(e.MESSAGE_DELETED, (id) => PhoneSim_DataHandler.deleteMessagesBySourceId(id));
    SillyTavern_Context.eventSource.on(e.CHAT_CHANGED, ()=> {
         PhoneSim_DataHandler.clearLorebookCache();
         if(PhoneSim_State.isPanelVisible) PhoneSim_DataHandler.fetchAllData();
    });

    if (PhoneSim_State.isPanelVisible) {
        PhoneSim_UI.togglePanel(true);
    }

    console.log(`%c${loggingPrefix} Initialization complete.`, 'color: #4CAF50; font-weight: bold;');
}

function areCoreApisReady() {
    SillyTavern_Context = (parentWin.SillyTavern && parentWin.SillyTavern.getContext) ? parentWin.SillyTavern.getContext() : null;
    TavernHelper_API = parentWin.TavernHelper;
    jQuery_API = parentWin.jQuery;

    return !!(SillyTavern_Context && TavernHelper_API && jQuery_API &&
        SillyTavern_Context.eventSource && typeof SillyTavern_Context.eventSource.on === 'function' &&
        SillyTavern_Context.eventTypes &&
        typeof TavernHelper_API.getWorldbook === 'function' &&
        typeof jQuery_API.fn.append === 'function' &&
        typeof SillyTavern_Context.generate === 'function');
}

let apiReadyInterval = setInterval(() => {
    if (areCoreApisReady()) {
        clearInterval(apiReadyInterval);

        PhoneSim_State.init(parentWin);
        PhoneSim_State.loadCustomization();

        addSettingsHtml();

        if (PhoneSim_State.customization.enabled) {
            mainInitialize();
        } else {
            console.log(`%c${loggingPrefix} Extension is disabled via settings.`, 'color: #ff9800 ;');
        }
    }
}, 100);
