import { PhoneSim_Config } from '../config.js'; // [妈妈的修改] 导入Config和State
import { PhoneSim_State } from './state.js';

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

// [妈妈的修改] 外部依赖将在init时注入
let jQuery_API, parentWin, DataHandler;


modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_UI[key] = module[key];
        } else if (typeof module[key] === 'object' && module[key] !== null) {
            PhoneSim_UI[key] = { ...PhoneSim_UI[key], ...module[key] };
        }
    });
});

PhoneSim_UI.init = (dependencies, dataHandler) => {
    // [妈妈的修改] 注入外部API
    jQuery_API = dependencies.jq;
    parentWin = dependencies.win;
    DataHandler = dataHandler;

    modules.forEach(module => {
        if (typeof module.init === 'function') {
            module.init(dependencies, dataHandler, PhoneSim_UI);
        }
    });
    PhoneSim_UI.TheaterRenderer = RenderTheater.TheaterRenderer;
};


// [妈妈的修改] 以下核心函数从 core.js 移至此处，成为 ui.js 的一部分
PhoneSim_UI.rerenderCurrentView = function(updates = {}) {
    let activeId = null;
    const currentViewId = PhoneSim_State.currentView;

    switch(currentViewId) {
        case 'ChatConversation':
        case 'GroupMembers':
        case 'GroupInvite':
            activeId = PhoneSim_State.activeContactId; break;
        case 'Homepage':
            activeId = PhoneSim_State.activeProfileId; break;
        case 'EmailDetail':
            activeId = PhoneSim_State.activeEmailId; break;
        case 'ForumPostList':
            activeId = PhoneSim_State.activeForumBoardId; break;
        case 'ForumPostDetail':
            activeId = PhoneSim_State.activeForumPostId; break;
        case 'LiveStreamList':
            activeId = PhoneSim_State.activeLiveBoardId; break;
        case 'LiveStreamRoom':
            activeId = PhoneSim_State.activeLiveStreamId; break;
    }

    PhoneSim_UI.renderViewContent(currentViewId, activeId);

    if (updates.chatUpdated && currentViewId === 'ChatApp') {
        PhoneSim_UI.renderContactsList();
    }
    // [妈妈的修改] 关键修复！现在它知道当剧场数据更新时，需要重新渲染剧场视图。
    if (updates.theaterUpdated && currentViewId === 'TheaterApp') {
        PhoneSim_UI.renderViewContent('TheaterApp');
    }
};

PhoneSim_UI.showView = function(viewId, ...args) {
    if (PhoneSim_State.isNavigating) return;

    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    let targetViewId = viewId;
    if (viewId === 'BrowserHistory') targetViewId = 'BrowserApp';

    const currentView = p.find('.view.active');
    const nextView = p.find(`#${targetViewId.toLowerCase()}-view`);

    if (!nextView.length || (currentView.attr('id') === nextView.attr('id') && !args[0]?.forceRerender && !args[0]?.isTabSwitch)) {
        if (viewId === 'BrowserHistory' && currentView.attr('id') === nextView.attr('id')) {
             PhoneSim_UI.renderViewContent(viewId, ...args);
        }
        return;
    }

    PhoneSim_State.isNavigating = true;

    let options = {};
    let dataArgs = [...args];
    if (dataArgs.length > 0 && typeof dataArgs[0] === 'object' && dataArgs[0] !== null) {
        options = dataArgs.shift();
    }

    const activeId = dataArgs[0];
    switch(viewId) {
        case 'ChatConversation': PhoneSim_State.activeContactId = activeId; break;
        case 'GroupMembers': case 'GroupInvite': PhoneSim_State.activeContactId = activeId; break;
        case 'Homepage': PhoneSim_State.activeProfileId = activeId; break;
        case 'EmailDetail': PhoneSim_State.activeEmailId = activeId; break;
        case 'ForumPostList': PhoneSim_State.activeForumBoardId = activeId; break;
        case 'ForumPostDetail': PhoneSim_State.activeForumPostId = activeId; break;
        case 'LiveStreamList': PhoneSim_State.activeLiveBoardId = activeId; break;
        case 'LiveStreamRoom': PhoneSim_State.activeLiveStreamId = activeId; break;
        case 'Creation':
            PhoneSim_State.creationContext = options.context;
            PhoneSim_State.creationBoardContext = options.boardId || null;
            PhoneSim_State.previousView = PhoneSim_State.currentView;
            break;
    }

    PhoneSim_UI.renderViewContent(viewId, ...dataArgs);
    PhoneSim_State.currentView = viewId;
    PhoneSim_State.saveUiState();

    const currentLevel = parseInt(currentView.data('nav-level'), 10) || 0;
    const nextLevel = parseInt(nextView.data('nav-level'), 10) || 0;
    let animationIn = 'fade-in', animationOut = 'fade-out';
    const isZoomingIn = options.animationOrigin && currentView.is('#homescreen-view');
    const isReturningHome = nextView.is('#homescreen-view') && !currentView.is('#homescreen-view');

    if (isZoomingIn) {
        animationIn = 'zoom-in';
        const { x, y } = options.animationOrigin;
        nextView.css({ '--origin-x': `${x}px`, '--origin-y': `${y}px` });
    } else if (isReturningHome) {
        const closingAppId = currentView.attr('id').replace('-view', '').replace(/\b\w/g, l => l.toUpperCase());
        const appIcon = p.find(`.app-block[data-view="${closingAppId}"]`);
        if (appIcon.length) {
            animationOut = 'zoom-out';
            const rect = appIcon[0].getBoundingClientRect();
            const panelRect = p[0].getBoundingClientRect();
            const originX = rect.left - panelRect.left + rect.width / 2;
            const originY = rect.top - panelRect.top + rect.height / 2;
            currentView.css({ '--origin-x': `${originX}px`, '--origin-y': `${originY}px` });
        } else { animationOut = 'slide-out-to-bottom'; }
    } else if (options.isTabSwitch) {
        // No change, fade-in/out is default
    } else if (nextLevel > currentLevel) {
        animationIn = 'slide-in-from-right'; animationOut = 'slide-out-to-left';
    } else if (nextLevel < currentLevel) {
        animationIn = 'slide-in-from-left'; animationOut = 'slide-out-to-right';
    }

    p.find('.view').removeClass('zoom-in zoom-out slide-in-from-right slide-in-from-left slide-out-to-right slide-out-to-left slide-out-to-bottom fade-in fade-out');
    nextView.addClass(animationIn).css('z-index', 3).addClass('active');
    currentView.addClass(animationOut).css('z-index', 2);

    const transitionDuration = (animationIn.includes('zoom') || animationOut.includes('zoom')) ? 400 : 350;
    setTimeout(() => {
        currentView.removeClass('active').removeClass(animationOut);
        nextView.removeClass(animationIn).css({ zIndex: 2, '--origin-x': '', '--origin-y': '' });
        PhoneSim_State.isNavigating = false;
    }, transitionDuration);
};

PhoneSim_UI.renderViewContent = function(viewId, ...args) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    if (viewId === 'BrowserHistory') {
        const browserView = p.find('#browserapp-view');
        browserView.find('.browser-subview').removeClass('active');
        browserView.find('#browserhistory-view').addClass('active');
        PhoneSim_UI.renderHistoryAndBookmarks();
        return;
    }

    switch(viewId) {
        case 'HomeScreen': break;
        case 'ChatApp':
            PhoneSim_UI.renderContactsList(); PhoneSim_UI.renderContactsView(); PhoneSim_UI.renderDiscoverView(); PhoneSim_UI.renderMeView();
            const activeTab = PhoneSim_State.activeSubviews.chatapp || 'messages';
            p.find('#chatapp-view .subview').removeClass('active').filter(`[data-subview="${activeTab}"]`).addClass('active');
            p.find('.chatapp-bottom-nav .nav-item').removeClass('active').filter(`[data-target="${activeTab}"]`).addClass('active');
            break;
        case 'ChatConversation': PhoneSim_UI.renderChatView(args[0], 'WeChat'); break;
        case 'GroupMembers': PhoneSim_UI.renderGroupMembersView(args[0]); break;
        case 'GroupInvite': PhoneSim_UI.renderGroupInviteView(args[0]); break;
        case 'GroupCreation': PhoneSim_UI.renderGroupCreationView(); break;
        case 'Moments': PhoneSim_UI.renderMomentsView(); break;
        case 'Homepage': PhoneSim_UI.renderHomepage(args[0]); break;
        case 'PhoneApp':
            PhoneSim_UI.renderPhoneContactList(); PhoneSim_UI.renderCallLogView();
            const activePhoneTab = PhoneSim_State.activeSubviews.phoneapp || 'contacts';
            p.find('#phoneapp-view .subview').removeClass('active').filter(`.phone-${activePhoneTab}-subview`).addClass('active');
            p.find('.phoneapp-bottom-nav .nav-item').removeClass('active').filter(`[data-target="${activePhoneTab}"]`).addClass('active');
            break;
        case 'EmailApp': PhoneSim_UI.renderEmailList(); break;
        case 'EmailDetail': PhoneSim_UI.renderEmailDetail(args[0]); break;
        case 'SettingsApp': PhoneSim_UI.renderSettingsView(); break;
        case 'BrowserApp': PhoneSim_UI.renderBrowserState(); break;
        case 'ForumApp': PhoneSim_UI.renderForumBoardList(); break;
        case 'ForumPostList': PhoneSim_UI.renderForumPostList(args[0]); break;
        case 'ForumPostDetail': PhoneSim_UI.renderForumPostDetail(args[0]); break;
        case 'LiveCenterApp': PhoneSim_UI.renderLiveBoardList(); break;
        case 'LiveStreamList': PhoneSim_UI.renderLiveStreamList(args[0]); break;
        case 'LiveStreamRoom': PhoneSim_UI.renderLiveStreamRoom(args[0]); break;
        case 'TheaterApp': PhoneSim_UI.renderTheaterView(); break; // [妈妈的修改] 这一行是正确的，它将调用renderTheater.js里的函数
        case 'Creation': PhoneSim_UI.renderCreationView(); break;
    }
};
