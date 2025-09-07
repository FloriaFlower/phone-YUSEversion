
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
import * as RenderTheater from './ui_modules/renderers/renderTheater.js'; // 确认路径正确
import * as Components from './ui_modules/components.js';
import * as Utils from './ui_modules/utils.js';

const modules = [Core, Events, RenderChat, RenderMoments, RenderCall, RenderPhoneEmail, RenderGroup, RenderBrowser, RenderForum, RenderLiveCenter, RenderSettings, RenderTheater, Components, Utils];

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
