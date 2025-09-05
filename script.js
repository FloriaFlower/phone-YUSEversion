import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';

'use strict';

const loggingPrefix = '[手机模拟器 v18.0-GPS]';
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
    jQuery_API("#extensions_settings2").append(settingsHtml);
    jQuery_API("#phone_simulator_enabled").prop("checked", PhoneSim_State.customization.enabled);
    jQuery_API("#phone_simulator_enabled").on("change", onSettingChanged);
}

const debouncedMainProcessor = (msgId) => {
    clearTimeout(mainProcessorTimeout);
    mainProcessorTimeout = setTimeout(() => {
        PhoneSim_DataHandler.mainProcessor(msgId, { yuseTheater: yuseTheaterRegex });
    }, 250);
};

async function mainInitialize() {
    console.log(`%c${loggingPrefix} Core APIs ready. Initializing...`, 'color: #4CAF50; font-weight: bold;');

    const dependencies = {
        st_context: SillyTavern_Context,
        th: TavernHelper_API,
        jq: jQuery_API,
        win: parentWin
    };

    PhoneSim_State.loadUiState();
    PhoneSim_Sounds.init(PhoneSim_State);
    PhoneSim_DataHandler.init(dependencies, PhoneSim_UI);
    PhoneSim_UI.init(dependencies, PhoneSim_DataHandler);

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
        PhoneSim_UI.togglePanel(true);
    }

    console.log(`%c${loggingPrefix} GPS Navigation System Online.`, 'color: #ff9800; font-weight: bold;');
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

        // 【GPS接收器】
        // 在一切开始之前，我们首先定位自己
        if (document.currentScript && document.currentScript.src) {
            const scriptUrl = new URL(document.currentScript.src);
            const path = scriptUrl.pathname;
            PhoneSim_State.basePath = path.substring(0, path.lastIndexOf('/'));
            console.log(`${loggingPrefix} GPS lock acquired. Base path set to: ${PhoneSim_State.basePath}`);
        } else {
             console.error(`${loggingPrefix} CRITICAL: Could not determine base path via document.currentScript.src.`);
             parentWin.toastr.error('无法定位插件资源路径。', '手机模拟器致命错误');
             return;
        }

        PhoneSim_State.loadCustomization();
        addSettingsHtml();

        if (PhoneSim_State.customization.enabled) {
            mainInitialize();
        } else {
            console.log(`%c${loggingPrefix} Extension is disabled.`, 'color: #9E9E9E;');
        }
    }
}, 200);
