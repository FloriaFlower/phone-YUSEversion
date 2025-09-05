import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';
import { PhoneSim_Config } from './config.js';

'use strict';

const loggingPrefix = '[手机模拟器 v17.2-FinalGenesis]';
const parentWin = typeof window.parent !== 'undefined' ? window.parent : window;

let mainProcessorTimeout;
let SillyTavern_Context, TavernHelper_API, jQuery_API;

const yuseTheaterRegex = /<yuse_data>[\s\S]*?<announcements>([\s\S]*?)<\/announcements>[\s\S]*?<customizations>([\s\S]*?)<\/customizations>[\s\S]*?<theater>([\s\S]*?)<\/theater>[\s\S]*?<theater_hot>([\s\S]*?)<\/theater_hot>[\s\S]*?<theater_new>([\s\S]*?)<\/theater_new>[\s\S]*?<theater_recommended>([\s\S]*?)<\/theater_recommended>[\s\S]*?<theater_paid>([\s\S]*?)<\/theater_paid>[\s\S]*?<shop>([\s\S]*?)<\/shop>[\s\S]*?<\/yuse_data>/s;

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
    // 防止重复添加
    if (jQuery_API("#phone_simulator_enabled").length === 0) {
        jQuery_API("#extensions_settings2").append(settingsHtml);
    }
    jQuery_API("#phone_simulator_enabled").prop("checked", PhoneSim_State.customization.enabled);
    jQuery_API("#phone_simulator_enabled").off('change').on("change", onSettingChanged);
}

const debouncedMainProcessor = (msgId) => {
    clearTimeout(mainProcessorTimeout);
    mainProcessorTimeout = setTimeout(() => {
        PhoneSim_DataHandler.mainProcessor(msgId, { yuseTheater: yuseTheaterRegex });
    }, 500); // 增加延迟以确保DOM完全更新
};

async function mainInitialize() {
    console.log(`%c${loggingPrefix} Core APIs ready. Initializing...`, 'color: #4CAF50; font-weight: bold;');

    const dependencies = {
        st_context: SillyTavern_Context,
        th: TavernHelper_API,
        jq: jQuery_API,
        win: parentWin
    };

    // 【最终圣典修正】
    // 这是我们斩断死锁的关键。
    // 我们确保数据工匠(DataHandler)和界面工匠(UI)都直接从我们这里接收指令，
    // 而不是互相等待对方。他们将携手并行，共同创造。
    PhoneSim_DataHandler.init(dependencies, PhoneSim_UI);
    PhoneSim_UI.init(dependencies, PhoneSim_DataHandler);

    PhoneSim_State.loadUiState();
    PhoneSim_Sounds.init(PhoneSim_State);

    const uiInitialized = await PhoneSim_UI.initializeUI();
    if (!uiInitialized) {
        console.error(`${loggingPrefix} UI initialization failed. Aborting.`);
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
        PhoneSim_UI.togglePanel(true, true); // 强制在初始加载时执行
    }

    console.log(`%c${loggingPrefix} Final Genesis Engine Initialized and running.`, 'color: #4A148C; font-weight: bold;');
}

function areCoreApisReady() {
    SillyTavern_Context = (parentWin.SillyTavern && parentWin.SillyTavern.getContext) ? parentWin.SillyTavern.getContext() : null;
    TavernHelper_API = parentWin.TavernHelper;
    jQuery_API = parentWin.jQuery;

    return !!(SillyTavern_Context && TavernHelper_API && jQuery_API &&
        SillyTavern_Context.eventSource && typeof SillyTavern_Context.eventSource.on === 'function' &&
        SillyTavern_Context.eventTypes &&
        jQuery_API("#extensions_settings2").length > 0 &&
        typeof TavernHelper_API.getWorldbook === 'function');
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
            console.log(`%c${loggingPrefix} Extension is disabled.`, 'color: #9E9E9E;');
        }
    }
}, 200);
