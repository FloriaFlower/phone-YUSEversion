import * as Core from './ui_modules/core.js';
import * as Events from './ui_modules/events.js';
import * as Utils from './ui_modules/utils.js';
import * as Components from './ui_modules/components.js';
import * as RenderChat from './ui_modules/renderChat.js';
import * as RenderGroup from './ui_modules/renderGroup.js';
import * as RenderMoments from './ui_modules/renderMoments.js';
import * as RenderPhoneEmail from './ui_modules/renderPhoneEmail.js';
import * as RenderCall from './ui_modules/renderCall.js';
import * as RenderSettings from './ui_modules/renderSettings.js';
import * as RenderBrowser from './ui_modules/renderBrowser.js';
import * as RenderForum from './ui_modules/renderForum.js';
import * as RenderLiveCenter from './ui_modules/renderLiveCenter.js';
import * as RenderTheater from './ui_modules/renderTheater.js';

const modules = [Core, Events, Utils, Components, RenderChat, RenderGroup, RenderMoments, RenderPhoneEmail, RenderCall, RenderSettings, RenderBrowser, RenderForum, RenderLiveCenter, RenderTheater];

export const PhoneSim_UI = {};

modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_UI[key] = module[key];
        }
    });
});

PhoneSim_UI.init = (dependencies, dataHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            module.init(dependencies, dataHandler, PhoneSim_UI);
        }
    });
};

// 【凤凰神经】这里是关键：我们确保调用的是我们100%可靠的骨架加载器
PhoneSim_UI.initializeUI = async function() {
    return await Core.initializeUI();
};
