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

const modules = [Core, Events, RenderChat, RenderMoments, RenderCall, RenderPhoneEmail, RenderGroup, RenderBrowser, RenderForum, RenderLiveCenter, RenderSettings, RenderTheater, Components, Utils];

// 聚合所有功能到这个单一对象
export const PhoneSim_UI = {};

// 将所有模块的功能合并到主UI对象中
modules.forEach(module => {
    Object.keys(module).forEach(key => {
        // 我们只添加函数，并避免覆盖下面定义的init函数
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_UI[key] = module[key];
        } else if (typeof module[key] === 'object' && module[key] !== null) {
            // [新增] 将模块中导出的对象（如 TheaterRenderer）也合并进来
            PhoneSim_UI[key] = { ...PhoneSim_UI[key], ...module[key] };
        }
    });
});


/**
 * 初始化所有子模块
 * @param {object} dependencies - 核心API (SillyTavern, jQuery等)
 * @param {object} dataHandler - 数据处理器对象
 */
PhoneSim_UI.init = (dependencies, dataHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // 传递依赖、数据处理器以及对完整UI处理器的引用
            module.init(dependencies, dataHandler, PhoneSim_UI);
        }
    });

    // [新增] 在初始化时，确保所有必要的渲染器都已挂载
    // 这样做可以确保像 PhoneSim_UI.TheaterRenderer 这样的对象是可用的
    PhoneSim_UI.TheaterRenderer = RenderTheater.TheaterRenderer;
};
