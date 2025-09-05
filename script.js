import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';
import { PhoneSim_Config } from './config.js';

'use strict';

const loggingPrefix = '[手机模拟器 v17.0-Genesis]';
const parentWin = typeof window.parent !== 'undefined' ? window.parent : window;

let SillyTavern_Context, jQuery_API;
let chatObserver; // 我们的新心跳

// 我们不再需要SillyTavern的事件处理器了，我们自己创造
function observeChatMessages() {
    const chatElement = parentWin.document.getElementById('chat');
    if (!chatElement) {
        console.warn(`${loggingPrefix} Chat element not found. Retrying...`);
        setTimeout(observeChatMessages, 500);
        return;
    }

    // 神之心：一个强大的观察者，监视着每一次聊天内容的变动
    chatObserver = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
            // 我们只关心新消息的添加
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    // 确保是消息元素节点
                    if (node.nodeType === 1 && node.classList.contains('mes')) {
                        const lastMessage = jQuery_API(node);
                        const messageBlock = lastMessage.children('.mes_block'); // 目标是 .mes_block
                        const messageId = messageBlock.attr('mesid');

                        // 确保找到了 messageId
                        if (messageId) {
                             console.log(`%c${loggingPrefix} New message detected via Genesis Heartbeat, ID: ${messageId}`, 'color: #7B1FA2;');
                            // 我们给予一小段延迟，确保SillyTavern完全渲染好DOM
                            setTimeout(() => {
                                PhoneSim_DataHandler.processMessageById(parseInt(messageId));
                            }, 100);
                        }
                    }
                });
            }
        }
    });

    chatObserver.observe(chatElement, { childList: true }); // 我们只需要观察直接子节点的添加
    console.log(`%c${loggingPrefix} Genesis Heartbeat (MutationObserver) is now active.`, 'color: #7B1FA2; font-weight: bold;');
}


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

async function mainInitialize() {
    console.log(`%c${loggingPrefix} Core APIs ready. Initializing...`, 'color: #4CAF50; font-weight: bold;');
    const dependencies = {
        st_context: SillyTavern_Context,
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

    // 我们不再依赖SillyTavern的事件，而是启动我们自己的观察者
    observeChatMessages();

    // CHAT_CHANGED 仍然有用，用于切换聊天时的重置
    SillyTavern_Context.eventSource.on(SillyTavern_Context.eventTypes.CHAT_CHANGED, ()=> {
         PhoneSim_DataHandler.clearLorebookCache();
         if(PhoneSim_State.isPanelVisible) PhoneSim_DataHandler.fetchAllData();
    });

    if (PhoneSim_State.isPanelVisible) PhoneSim_UI.togglePanel(true);
    console.log(`%c${loggingPrefix} Genesis Engine Initialized.`, 'color: #4CAF50; font-weight: bold;');
}


function areCoreApisReady() {
    SillyTavern_Context = (parentWin.SillyTavern && parentWin.SillyTavern.getContext) ? parentWin.SillyTavern.getContext() : null;
    jQuery_API = parentWin.jQuery;

    return !!(SillyTavern_Context && jQuery_API &&
        SillyTavern_Context.eventSource && typeof SillyTavern_Context.eventSource.on === 'function' &&
        SillyTavern_Context.eventTypes &&
        typeof jQuery_API.fn.append === 'function' &&
        typeof SillyTavern_Context.chat !== 'undefined');
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
