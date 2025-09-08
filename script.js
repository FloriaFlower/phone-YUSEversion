import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';
import { PhoneSim_Config } from './config.js';

// 使用 'use strict' 是一个好习惯，可以帮助我们避免一些潜在的错误
'use strict';

const loggingPrefix = '[手机模拟器 v17.0]'; // 我们可以把版本号更新一下，庆祝新生
const parentWin = typeof window.parent !== 'undefined' ? window.parent : window;

let mainProcessorTimeout;
let SillyTavern_Context, TavernHelper_API, jQuery_API;

// 这个函数负责在扩展设置页面添加我们的开关，逻辑完全正确
function addSettingsHtml() {
    // 防止重复添加
    if (jQuery_API('#phone_simulator_enabled').length > 0) return;

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
    jQuery_API("#phone_simulator_enabled").on("change", function() {
        PhoneSim_State.customization.enabled = jQuery_API(this).prop("checked");
        PhoneSim_State.saveCustomization();
        if (parentWin.toastr) {
            parentWin.toastr.info('设置已保存。刷新页面以应用更改。', '手机模拟器');
        }
    });
}

// 这个函数用于优化消息处理，避免过于频繁地触发，逻辑也很好
const debouncedMainProcessor = (msgId) => {
    clearTimeout(mainProcessorTimeout);
    mainProcessorTimeout = setTimeout(() => {
        PhoneSim_DataHandler.mainProcessor(msgId);
    }, 250);
};

// 这是核心的初始化函数，我们将严格遵循原始文件的稳定流程
async function mainInitialize() {
    console.log(`%c${loggingPrefix} Core APIs ready. Initializing UI and modules...`, 'color: #4CAF50; font-weight: bold;');

    // 1. 准备好所有核心API的依赖包
    const dependencies = {
        st: parentWin.SillyTavern,
        st_context: SillyTavern_Context,
        th: TavernHelper_API,
        jq: jQuery_API,
        win: parentWin
    };

    // 2. 按照正确的顺序初始化各个模块
    PhoneSim_State.loadUiState();
    PhoneSim_Sounds.init(PhoneSim_State);

    // [关键修复] 先初始化数据模块，再初始化UI模块，并把对方的引用传递过去
    PhoneSim_DataHandler.init(dependencies, PhoneSim_UI);
    PhoneSim_UI.init(dependencies, PhoneSim_DataHandler);

    // 3. 异步创建UI界面，并等待它完成
    const uiInitialized = await PhoneSim_UI.initializeUI();
    if (!uiInitialized) {
        console.error(`${loggingPrefix} UI initialization failed. Aborting further setup.`);
        return;
    }

    // 4. UI准备就绪后，再绑定SillyTavern的事件监听
    const e = SillyTavern_Context.eventTypes;
    SillyTavern_Context.eventSource.on(e.MESSAGE_EDITED, (id) => debouncedMainProcessor(id));
    SillyTavern_Context.eventSource.on(e.MESSAGE_RECEIVED, (id) => debouncedMainProcessor(id));
    SillyTavern_Context.eventSource.on(e.MESSAGE_DELETED, (id) => PhoneSim_DataHandler.deleteMessagesBySourceId(id));
    SillyTavern_Context.eventSource.on(e.CHAT_CHANGED, ()=> {
         PhoneSim_DataHandler.clearLorebookCache();
         if(PhoneSim_State.isPanelVisible) PhoneSim_DataHandler.fetchAllData();
    });

    // 5. 如果记录显示面板是打开的，就直接打开它
    if (PhoneSim_State.isPanelVisible) {
        PhoneSim_UI.togglePanel(true);
    }

    console.log(`%c${loggingPrefix} Initialization complete.`, 'color: #4CAF50; font-weight: bold;');
}

// 检查核心API是否准备就绪的函数，这是插件稳定运行的基石
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

// 启动轮询，等待最佳时机来加载我们的插件
let apiReadyInterval = setInterval(() => {
    if (areCoreApisReady()) {
        clearInterval(apiReadyInterval);

        // 关键的加载顺序：
        // 1. 初始化状态模块
        PhoneSim_State.init(parentWin);
        // 2. 加载用户的个性化设置（这会决定插件是否启用）
        PhoneSim_State.loadCustomization();

        // 3. 添加设置界面的开关HTML
        addSettingsHtml();

        // 4. 根据用户的设置，决定是否执行主初始化流程
        if (PhoneSim_State.customization.enabled) {
            mainInitialize();
        } else {
            console.log(`%c${loggingPrefix} Extension is disabled via settings.`, 'color: #ff9800;');
        }
    }
}, 100);
