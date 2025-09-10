import * as Core from './ui_modules/core.js';
import * as Events from './ui_modules/events.js';
import * as RenderChat from './ui_modules/renderChat.js';
import * as RenderMoments from './ui_modules/renderMoments.js';
import * as RenderCall from './ui_modules/renderCall.js';
import * as RenderPhoneEmail from './ui_modules/renderPhoneEmail.js';
import * as RenderGroup from './ui_modules/renderGroup.js';
import * as RenderBrowser from './ui_modules/renderBrowser.js';
import * as RenderForum from './ui_modules/renderForum.js';
import * as RenderLiveCenter from './ui_modules/renderLiveCenter.js';
import * as RenderSettings from './ui_modules/renderSettings.js';
import * as RenderTheater from './ui_modules/renderTheater.js';
import * as Components from './ui_modules/components.js';
import * as Utils from './ui_modules/utils.js';

// 【新增1】导入数据层和解析层依赖（UI作为中间层协调，避免模块直接依赖）
import { fetchRawTheaterData, parseTheaterData, saveTheaterData } from '../data/theaterData.js'; // 假设theaterData在../data目录
import { _parseListItems, PhoneSim_Parser } from '../parser/parser.js'; // 假设parser在../parser目录
import { PhoneSim_State } from '../state.js'; // 导入全局状态

const modules = [Core, Events, RenderChat, RenderMoments, RenderCall, RenderPhoneEmail, RenderGroup, RenderBrowser, RenderForum, RenderLiveCenter, RenderSettings, RenderTheater, Components, Utils];
export const PhoneSim_UI = {};

// 聚合所有模块功能（保持原逻辑不变）
modules.forEach(module => {
    Object.assign(PhoneSim_UI, module);
});

// 【新增2】UI层协调：加载并解析欲色剧场数据（核心：消除循环依赖）
PhoneSim_UI.loadTheaterData = async function() {
    try {
        // 1. 获取原始HTML数据（theaterData只负责数据获取，不解析）
        const rawData = await fetchRawTheaterData();
        // 2. 调用theaterData的解析方法，传入parser的_parseListItems（避免theaterData依赖parser）
        const parsedData = parseTheaterData(rawData, _parseListItems);
        // 3. 同步到全局状态，供RenderTheater读取
        PhoneSim_State.theaterData = parsedData;
        console.log('[UI] 欲色剧场数据加载完成');
    } catch (e) {
        console.error('[UI] 欲色剧场数据加载失败:', e);
        PhoneSim_State.theaterData = {}; // 避免后续渲染报错
    }
};

// 【新增3】UI层协调：刷新欲色剧场视图（供theaterData保存数据后调用）
PhoneSim_UI.refreshTheaterView = function(initialPage = 'announcements') {
    if (PhoneSim_UI.TheaterRenderer && typeof PhoneSim_UI.TheaterRenderer.renderTheaterView === 'function') {
        PhoneSim_UI.TheaterRenderer.renderTheaterView(initialPage);
    }
};

// 【新增4】UI层协调：转发保存剧场数据的调用（避免RenderTheater直接依赖theaterData）
PhoneSim_State.saveTheaterData = async function(data, msgId) {
    await saveTheaterData(data, msgId);
    PhoneSim_UI.refreshTheaterView(); // 保存后自动刷新视图
};

// 重写init函数（补充协调逻辑，保持原初始化逻辑不变）
PhoneSim_UI.init = (dependencies, dataHandler, uiHandler) => {
    // 1. 先初始化所有模块（保持原逻辑）
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // 给RenderTheater传递UI层的方法（关键：避免其直接依赖theaterData）
            if (module === RenderTheater) {
                module.init(
                    dependencies, 
                    {
                        ...uiHandler,
                        loadTheaterData: PhoneSim_UI.loadTheaterData, // 传递数据加载方法
                        refreshTheaterView: PhoneSim_UI.refreshTheaterView, // 传递视图刷新方法
                        triggerAIGeneration: dependencies.ai?.trigger || (() => Promise.resolve()) // 传递AI调用方法（兜底）
                    }
                );
            } else {
                module.init(dependencies, dataHandler, uiHandler);
            }
        }
    });

    // 2. 确保TheaterRenderer聚合到UI上（保持原逻辑）
    PhoneSim_UI.TheaterRenderer = RenderTheater.TheaterRenderer;

    // 3. 【新增】初始化完成后，预加载欲色剧场数据（避免首次渲染空白）
    PhoneSim_UI.loadTheaterData();
};
