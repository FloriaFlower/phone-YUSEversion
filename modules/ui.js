// 引入所有UI相关的子模块，我们的新成员 RenderTheater 已经光荣地加入了这个大家庭
import * as Core from './ui_modules/core.js';
import * as Events from './ui_modules/events.js';
import * as RenderChat from './ui_modules/renderers/renderChat.js';
import * as RenderMoments from './ui_modules/renderers/renderMoments.js';
import * as RenderCall from './ui_modules/renderers/renderCall.js';
import * as RenderPhoneEmail from './ui_modules/renderers/renderPhoneEmail.js';
import * as RenderGroup from './ui_modules/renderers/renderGroup.js';
import * as RenderBrowser from './ui_modules/renderers/renderBrowser.js';
import * as RenderForum from './ui_modules/renderers/renderForum.js';
import * as RenderLiveCenter from './ui_modules/renderers/renderLiveCenter.js';
import * as RenderSettings from './ui_modules/renderers/renderSettings.js';
import * as RenderTheater from './ui_modules/renderers/renderTheater.js'; // [确认] 我们的新设计师已就位
import * as Components from './ui_modules/components.js';
import * as Utils from './ui_modules/utils.js';

// 将所有模块放入一个数组，方便统一管理
const modules = [Core, Events, RenderChat, RenderMoments, RenderCall, RenderPhoneEmail, RenderGroup, RenderBrowser, RenderForum, RenderLiveCenter, RenderSettings, RenderTheater, Components, Utils];

// 创建一个空的“UI总管”对象，我们将把所有设计师的技能都赋予它
export const PhoneSim_UI = {};

// 遍历所有模块，将它们的功能（函数）都添加到 PhoneSim_UI 对象上
modules.forEach(module => {
    Object.keys(module).forEach(key => {
        // 我们只添加函数，并避免覆盖下面我们自己定义的init函数
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_UI[key] = module[key];
        }
    });
});

/**
 * 这是“UI总管”的上任仪式。
 * 它会把核心的工具（依赖API）和通讯录（数据管理器）分发给手下的每一位设计师。
 * @param {object} dependencies - 核心API (SillyTavern, jQuery等).
 * @param {object} dataHandler - 数据处理总管.
 */
PhoneSim_UI.init = (dependencies, dataHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // 将依赖API、数据总管，以及“UI总管”自己的引用传递给每个子模块
            module.init(dependencies, dataHandler, PhoneSim_UI);
        }
    });
};
