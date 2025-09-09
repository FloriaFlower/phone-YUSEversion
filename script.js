import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';
import { PhoneSim_Config } from './config.js';
import { TheaterRenderer } from './modules/ui_modules/renderTheater.js'; // 关键依赖
'use strict';

const loggingPrefix = '[手机模拟器 v17.1 终极修复]';
const parentWin = window.parent || window;
let mainProcessorTimeout, isInitialized = false;

// ------------------------
// 【新增】移动端友好的日志输出（通过toast替代控制台）
// ------------------------
function showToast(msg, type = 'info') {
    if (parentWin.toastr) {
        parentWin.toastr[type](msg, '手机模拟器');
    } else {
        console.log(`[${type.toUpperCase()}] ${msg}`);
    }
}

function onSettingChanged() {
    const enabled = jQuery_API("#phone_simulator_enabled").prop("checked");
    PhoneSim_State.customization.enabled = enabled;
    PhoneSim_State.saveCustomization();
    showToast('设置已保存，刷新后生效', 'info');
}

function addSettingsHtml() {
    if (jQuery_API("#extensions_settings2").length === 0) {
        showToast('未找到设置面板，跳过添加', 'warn');
        return;
    }
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
                        <input id="phone_simulator_enabled" type="checkbox" ${PhoneSim_State.customization.enabled ? 'checked' : ''}>
                        <span>启用手机模拟器</span>
                    </label>
                </div>
                <small>需刷新生效</small>
            </div>
        </div>
    </div>`;
    jQuery_API("#extensions_settings2").append(settingsHtml);
    jQuery_API("#phone_simulator_enabled").on("change", onSettingChanged);
}

async function mainInitialize() {
    if (isInitialized) return;
    isInitialized = true;

    // ------------------------
    // 【核心修复】分步初始化+容错
    // ------------------------
    try {
        showToast('正在初始化...', 'info');
        
        // 1. 检查核心API（增加友好提示）
        if (!parentWin.SillyTavern || !parentWin.TavernHelper || !parentWin.jQuery) {
            showToast('依赖API未加载，请刷新页面', 'error');
            return;
        }

        const dependencies = {
            st: parentWin.SillyTavern,
            st_context: parentWin.SillyTavern.getContext(),
            th: parentWin.TavernHelper,
            jq: parentWin.jQuery,
            win: parentWin
        };

        // 2. 初始化剧场模块（增加容错）
        try {
            TheaterRenderer.init(dependencies, PhoneSim_UI);
            PhoneSim_UI.TheaterRenderer = TheaterRenderer;
        } catch (e) {
            showToast('剧场模块初始化失败：' + e.message, 'error');
        }

        // 3. 初始化UI（关键：延迟200ms等待DOM加载）
        setTimeout(async () => {
            try {
                const uiReady = await PhoneSim_UI.initializeUI();
                if (!uiReady) {
                    showToast('UI初始化失败，请检查悬浮窗权限', 'error');
                    return;
                }
                showToast('UI加载成功！', 'success');
                await PhoneSim_DataHandler.fetchAllData();
                
                // 4. 强制显示悬浮按钮（新增）
                PhoneSim_UI.togglePanel(PhoneSim_State.isPanelVisible);
                
            } catch (e) {
                showToast('初始化出错：' + e.message, 'error');
            }
        }, 200); // 延迟避免DOM未就绪

    } catch (e) {
        showToast('初始化失败：' + e.message, 'error');
    }
}

// ------------------------
// 【新增】移动端适配：监听页面加载完成
// ------------------------
parentWin.addEventListener('DOMContentLoaded', () => {
    if (PhoneSim_State.customization.enabled) {
        mainInitialize();
    } else {
        showToast('插件已禁用，请到设置开启', 'info');
    }
});

// ------------------------
// 【新增】权限检测（替代控制台）
// ------------------------
function checkOverlayPermission() {
    if (parentWin.android) { // 模拟器环境
        parentWin.android.requestOverlayPermission((granted) => {
            if (!granted) {
                showToast('请手动开启悬浮窗权限', 'error');
            } else {
                mainInitialize();
            }
        });
    } else {
        mainInitialize(); // 浏览器环境默认有权限
    }
}

// 入口（兼容移动端模拟器）
if (parentWin.android) { // 检测是否为安卓模拟器
    parentWin.android.on('permissionGranted', checkOverlayPermission);
    parentWin.android.requestOverlayPermission();
} else {
    mainInitialize();
}
