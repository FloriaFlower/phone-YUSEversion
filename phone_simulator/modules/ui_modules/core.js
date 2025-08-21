import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, SillyTavern_API, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_API = deps.st;
    UI = uiObject;
    DataHandler = dataHandler;
}

export async function initializeUI() {
    try {
        const body = jQuery_API(parentWin.document.body);
        
        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length > 0) {
            console.warn(`[Phone Sim] Panel already exists. Aborting UI creation.`);
            return true;
        }

        const templateHtml = await SillyTavern_API.renderExtensionTemplateAsync('phone_simulator', 'panel');
        if (!templateHtml) {
            throw new Error("renderExtensionTemplateAsync returned empty HTML.");
        }
        
        body.append(templateHtml);
        
        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length === 0) {
             throw new Error("Panel element not found in DOM after injection.");
        }

        if (!parentWin.document.querySelector('script[src*=\"emoji-picker-element\"]')) {
            const script = parentWin.document.createElement('script');
            script.type = 'module';
            script.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
            parentWin.document.head.appendChild(script);
        }

        const buttonId = PhoneSim_Config.TOGGLE_BUTTON_ID;
        if (body.find(`#${buttonId}`).length) {
            body.find(`#${buttonId}`).remove();
        }
        const toggleButton = jQuery_API(`<div id="${buttonId}" title="手机模拟器">📱<div class="unread-badge" style="display:none;"></div></div>`);
        body.append(toggleButton);
        
        UI.updateScaleAndPosition();
        UI.populateApps(); 
        UI.updateTime();
        UI.applyCustomizations();
        UI.addEventListeners();

        body.find(`#${PhoneSim_Config.PANEL_ID}`).hide();

        return true;

    } catch (error) {
        console.error(`[Phone Sim] CRITICAL UI Initialization Failure:`, error);
        toastr.error("手机模拟器插件UI加载失败，请检查控制台以获取详细信息并尝试刷新页面。", "严重错误", { timeOut: 10000 });
        return false;
    }
}


export async function togglePanel(forceShow) {
    const panel = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const shouldBeVisible = typeof forceShow === 'boolean' ? forceShow : !panel.is(':visible');
    
    PhoneSim_State.isPanelVisible = shouldBeVisible;
    
    if (shouldBeVisible) {
        panel.show(); 
        await DataHandler.fetchAllData(); 
        
        const viewToRestore = PhoneSim_State.currentView || 'HomeScreen';
        const data = viewToRestore === 'ChatConversation' ? PhoneSim_State.activeContactId 
                   : viewToRestore === 'EmailDetail' ? PhoneSim_State.activeEmailId 
                   : viewToRestore === 'Homepage' ? PhoneSim_State.activeProfileId
                   : viewToRestore === 'ForumPostList' ? PhoneSim_State.activeForumBoardId
                   : viewToRestore === 'ForumPostDetail' ? PhoneSim_State.activeForumPostId
                   : null;
        await UI.showView(viewToRestore, data, false);
    } else { 
        panel.hide(); 
        PhoneSim_State.activeContactId = null; 
    } 
    
    PhoneSim_State.saveUiState();
}

export async function showView(v, data, isAnimated = true) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    
    const isChatSubview = ['ChatConversation', 'GroupMembers', 'GroupInvite'].includes(v);
    const isForumSubview = ['ForumPostList', 'ForumPostDetail'].includes(v);
    
    const viewMap = {
        'chatconversation': 'chatapp', 'emaildetail': 'emailapp', 'discover': 'chatapp',
        'moments': 'moments', 'homepage': 'homepage', 'phoneapp': 'phoneapp',
        'emailapp': 'emailapp', 'settingsapp': 'settingsapp', 'homescreen': 'homescreen',
        'voicecall': 'voicecall', 'phonecall': 'phonecall', 'groupmembers': 'chatapp', 'groupinvite': 'chatapp',
        'calllog': 'phoneapp', 'browserapp': 'browserapp', 'forumapp': 'forumapp',
        'forumpostlist': 'forumapp', 'forumpostdetail': 'forumapp'
    };
    let viewIdToShow = viewMap[v.toLowerCase()] || v.toLowerCase();
    
    const newView = p.find(`#${viewIdToShow}-view`);
    const oldView = p.find('.view.active');
    
    // --- Animation Logic ---
    if (oldView.length === 0) {
        newView.addClass('active');
    } else if (oldView[0] !== newView[0]) {
        const oldLevel = parseInt(oldView.attr('data-nav-level'), 10) || 0;
        let newLevel = parseInt(newView.attr('data-nav-level'), 10) || 0;
        
        if ((isChatSubview && PhoneSim_State.currentView === 'ChatApp') || (isForumSubview && PhoneSim_State.currentView === 'ForumApp')) {
            newLevel = oldLevel + 1;
        }
        
        const isForward = newLevel > oldLevel;

        if (isAnimated) {
            const enterClass = isForward ? 'view-enter-right' : 'view-enter-left';
            const exitClass = isForward ? 'view-exit-left' : 'view-exit-right';

            newView.addClass(enterClass).addClass('is-transitioning');
            oldView.addClass('is-transitioning');
            newView.addClass('active');

            requestAnimationFrame(() => {
                newView.removeClass(enterClass).addClass('view-in');
                oldView.addClass(exitClass).removeClass('active');
            });

            setTimeout(() => {
                oldView.removeClass(`is-transitioning view-in ${exitClass}`);
                newView.removeClass('is-transitioning view-in');
            }, 350);
        } else {
            oldView.removeClass('active');
            newView.addClass('active');
        }
    }

    // --- Post-transition Content Rendering & State Update ---
    const renderContent = async () => {
        if (v === 'HomeScreen') {
             p.removeClass('in-app-mode');
             PhoneSim_State.activeContactId = null;
             PhoneSim_State.activeEmailId = null;
             PhoneSim_State.activeProfileId = null;
             PhoneSim_State.activeForumBoardId = null;
             PhoneSim_State.activeForumPostId = null;
        } else {
             p.addClass('in-app-mode');
        }
    
        if (v === 'ChatApp') { UI.renderContactsList(); const c = p.find('#chatapp-view'); c.removeClass('in-conversation in-management'); c.find('.subview').removeClass('active'); c.find('.chat-list-subview').addClass('active'); PhoneSim_State.activeSubviews.chatapp = 'messages'; }
        else if (v === 'ChatConversation') { await UI.renderChatView(data, 'WeChat'); UI.triggerPendingAnimations(data); const c = p.find('#chatapp-view'); c.addClass('in-conversation').removeClass('in-management'); p.find('#chatapp-view .subview').removeClass('active'); p.find('#chatapp-view .chat-view-subview').addClass('active'); PhoneSim_State.activeContactId = data; } 
        else if (v === 'Discover') { const c = p.find('#chatapp-view'); c.removeClass('in-conversation in-management'); c.find('.subview').removeClass('active'); c.find('.discover-subview').addClass('active'); PhoneSim_State.activeSubviews.chatapp = 'discover'; }
        else if (v === 'GroupMembers') { UI.renderGroupMembersView(PhoneSim_State.activeContactId); const c = p.find('#chatapp-view'); c.addClass('in-management'); c.find('.subview').removeClass('active'); c.find('.group-members-subview').addClass('active'); }
        else if (v === 'GroupInvite') { UI.renderGroupInviteView(PhoneSim_State.activeContactId); const c = p.find('#chatapp-view'); c.addClass('in-management'); c.find('.subview').removeClass('active'); c.find('.group-invite-subview').addClass('active'); }
        else if (v === 'PhoneApp') { UI.renderPhoneContactList(); const ph = p.find('#phoneapp-view'); ph.find('.subview').removeClass('active'); ph.find('.phone-contacts-subview').addClass('active'); PhoneSim_State.activeSubviews.phoneapp = 'contacts'; }
        else if (v === 'CallLog') { UI.renderCallLogView(); const ph = p.find('#phoneapp-view'); ph.find('.subview').removeClass('active'); ph.find('.phone-log-subview').addClass('active'); PhoneSim_State.activeSubviews.phoneapp = 'log'; }
        else if (v === 'EmailApp') { UI.renderEmailList(); }
        else if (v === 'EmailDetail') { UI.renderEmailDetail(data); PhoneSim_State.activeEmailId = data; }
        else if (v === 'SettingsApp') { p.find('#settingsapp-view .subview').removeClass('active').filter('.settings-menu-subview').addClass('active'); }
        else if (v === 'Homepage') { UI.renderHomepage(data); PhoneSim_State.activeProfileId = data; }
        else if (v === 'BrowserApp') { UI.renderBrowserState(); }
        else if (v === 'ForumApp') { UI.renderForumBoardList(); const f = p.find('#forumapp-view'); f.find('.subview').removeClass('active'); f.find('.forum-board-list-subview').addClass('active'); }
        else if (v === 'ForumPostList') { UI.renderForumPostList(data); PhoneSim_State.activeForumBoardId = data; const f = p.find('#forumapp-view'); f.find('.subview').removeClass('active'); f.find('.forum-post-list-subview').addClass('active');}
        else if (v === 'ForumPostDetail') { UI.renderForumPostDetail(data); PhoneSim_State.activeForumPostId = data; const f = p.find('#forumapp-view'); f.find('.subview').removeClass('active'); f.find('.forum-post-detail-subview').addClass('active');}

        PhoneSim_State.currentView = v;
        PhoneSim_State.saveUiState();
    };

    await renderContent();
}

export function rerenderCurrentView({ chatUpdated, emailUpdated, momentsUpdated, profileUpdated, browserUpdated, forumUpdated }) {
    if (!PhoneSim_State.isPanelVisible) return;

    if (chatUpdated) {
        UI.renderContactsList();
        if (PhoneSim_State.activeContactId) {
            UI.renderChatView(PhoneSim_State.activeContactId, 'WeChat', false);
        }
    }
    if (emailUpdated && PhoneSim_State.currentView.startsWith('Email')) {
        UI.renderEmailList();
        if (PhoneSim_State.activeEmailId) {
            UI.renderEmailDetail(PhoneSim_State.activeEmailId);
        }
    }
    if (momentsUpdated && (PhoneSim_State.currentView === 'Moments' || PhoneSim_State.currentView === 'Homepage')) {
        UI.renderMomentsView();
        if (PhoneSim_State.activeProfileId) {
            UI.renderHomepage(PhoneSim_State.activeProfileId);
        }
    }
    if (profileUpdated && PhoneSim_State.activeProfileId && PhoneSim_State.currentView === 'Homepage') {
        UI.renderHomepage(PhoneSim_State.activeProfileId);
    }
     if (browserUpdated && PhoneSim_State.currentView === 'BrowserApp') {
        UI.renderBrowserState();
    }
    if (forumUpdated && PhoneSim_State.currentView.startsWith('Forum')) {
        if (PhoneSim_State.currentView === 'ForumApp') UI.renderForumBoardList();
        if (PhoneSim_State.activeForumBoardId) UI.renderForumPostList(PhoneSim_State.activeForumBoardId);
        if (PhoneSim_State.activeForumPostId) UI.renderForumPostDetail(PhoneSim_State.activeForumPostId);
    }
}