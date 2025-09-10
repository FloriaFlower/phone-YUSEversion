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

export const PhoneSim_UI = {};

// [修复] 将所有模块的功能和对象聚合到PhoneSim_UI上
modules.forEach(module => {
    Object.assign(PhoneSim_UI, module);
});


PhoneSim_UI.init = (dependencies, dataHandler, uiHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            module.init(dependencies, dataHandler, uiHandler);
        }
    });

    PhoneSim_UI.TheaterRenderer = RenderTheater.TheaterRenderer;
};
