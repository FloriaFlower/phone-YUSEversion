import { PhoneSim_Config } from '../config.js';
import { PhoneSim_State } from './state.js';

// 导入所有UI子模块
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
import * as RenderTheater from './ui_modules/renderTheater.js'; // 确认导入
import * as Components from './ui_modules/components.js';
import * as Utils from './ui_modules/utils.js';

const modules = [Core, Events, RenderChat, RenderMoments, RenderCall, RenderPhoneEmail, RenderGroup, RenderBrowser, RenderForum, RenderLiveCenter, RenderSettings, RenderTheater, Components, Utils];

// 聚合所有功能
export const PhoneSim_UI = {};

// 将所有模块的函数合并到主UI对象
modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_UI[key] = module[key];
        } else if (typeof module[key] === 'object' && module[key] !== null && key !== 'PhoneSim_UI') {
            // [妈妈的修改] 这是一个聪明的改进，可以直接将我们导出的渲染器对象（比如TheaterRenderer）也合并进来
            PhoneSim_UI[key] = module[key];
        }
    });
});

/**
 * 初始化所有子模块
 */
PhoneSim_UI.init = (dependencies, dataHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            module.init(dependencies, dataHandler, PhoneSim_UI);
        }
    });
    // 初始化完成后，再绑定事件监听，确保所有模块都已准备就绪
    Events.addEventListeners();
};

/**
 * [妈妈的修改] 我们将showView的逻辑也从Core模块移到这里，作为真正的“视图路由器”
 * 这样结构更清晰，所有视图的切换逻辑都集中在这个总控制器里。
 */
PhoneSim_UI.showView = (viewId, context = {}) => {
    const { animationOrigin } = context;
    Core.preViewChange(viewId, animationOrigin);
    PhoneSim_State.previousView = PhoneSim_State.currentView;
    PhoneSim_State.currentView = viewId;

    switch (viewId) {
        case 'HomeScreen':      RenderSettings.renderHomeScreen(); break;
        case 'ChatApp':         RenderChat.renderChatApp(); break;
        case 'ChatConversation':RenderChat.renderChatConversation(context); break;
        case 'Moments':         RenderMoments.renderMomentsView(); break;
        case 'Homepage':        RenderMoments.renderHomepage(context); break;
        case 'SettingsApp':     RenderSettings.renderSettingsApp(); break;
        case 'PhoneApp':        RenderPhoneEmail.renderPhoneApp(); break;
        case 'EmailApp':        RenderPhoneEmail.renderEmailApp(); break;
        case 'EmailDetail':     RenderPhoneEmail.renderEmailDetail(context); break;
        case 'GroupCreation':   RenderGroup.renderGroupCreation(); break;
        case 'GroupMembers':    RenderGroup.renderGroupMembers(context); break;
        case 'GroupInvite':     RenderGroup.renderGroupInvite(context); break;
        case 'BrowserApp':      RenderBrowser.renderBrowserApp(); break;
        case 'BrowserHistory':  RenderBrowser.renderBrowserHistory(); break;
        case 'ForumApp':        RenderForum.renderForumApp(); break;
        case 'ForumPostList':   RenderForum.renderForumPostList(context); break;
        case 'ForumPostDetail': RenderForum.renderForumPostDetail(context); break;
        case 'Creation':        RenderForum.renderCreationView(context); break;
        case 'LiveCenterApp':   RenderLiveCenter.renderLiveCenterApp(); break;
        case 'LiveStreamList':  RenderLiveCenter.renderLiveStreamList(context); break;
        case 'LiveStreamRoom':  RenderLiveCenter.renderLiveStreamRoom(context); break;
        // 这就是我们新增的“门”，告诉系统如何打开欲色剧场的房间
        case 'TheaterApp':      RenderTheater.TheaterRenderer.renderTheaterView(); break;
        default:                RenderSettings.renderHomeScreen();
    }
    Core.postViewChange(viewId);
};
