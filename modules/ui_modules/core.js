import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, SillyTavern_Context_API, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_Context_API = deps.st_context;
    UI = uiObject;
    DataHandler = dataHandler;
}

// ---- 私有辅助函数 ----

function _createToggleButton() {
    const buttonHtml = `
        <div id="${PhoneSim_Config.TOGGLE_BUTTON_ID}" title="手机模拟器">
            <i class="fas fa-mobile-alt"></i>
            <div class="unread-badge" style="display:none;"></div>
        </div>`;
    jQuery_API(parentWin.document.body).append(buttonHtml);
}

function _createAuxiliaryElements() {
    if (jQuery_API(parentWin.document.body).find('#phone-sim-file-input').length === 0) {
        jQuery_API(parentWin.document.body).append('<input type="file" id="phone-sim-file-input" accept="image/*" style="display:none;">');
    }

    const dialogHtml = `
        <div class="phone-sim-dialog-overlay" id="phone-sim-dialog-overlay" style="display:none;">
            <div class="phone-sim-dialog">
                <h3 id="phone-sim-dialog-title"></h3>
                <div class="dialog-content"><textarea id="phone-sim-dialog-textarea" class="dialog-input"></textarea></div>
                <div class="dialog-buttons">
                    <button id="phone-sim-dialog-cancel" class="dialog-btn cancel-btn">取消</button>
                    <button id="phone-sim-dialog-confirm" class="dialog-btn confirm-btn">确定</button>
                </div>
            </div>
        </div>
        <div class="phone-sim-dialog-overlay" id="phone-sim-call-input-overlay" style="display:none;">
             <div class="phone-sim-dialog">
                <h3 id="phone-sim-call-input-title">在通话中发言</h3>
                <div class="dialog-content"><textarea id="phone-sim-call-input-textarea" class="dialog-input" placeholder="输入你想说的话..."></textarea></div>
                <div class="dialog-buttons">
                    <button id="phone-sim-call-input-cancel" class="dialog-btn cancel-btn">取消</button>
                    <button id="phone-sim-call-input-confirm" class="dialog-btn confirm-btn">发送</button>
                </div>
            </div>
        </div>`;
    if (jQuery_API(parentWin.document.body).find('#phone-sim-dialog-overlay').length === 0) {
        jQuery_API(parentWin.document.body).append(dialogHtml);
    }
}


// ---- 导出的核心UI函数 ----

export async function initializeUI() {
    try {
        const body = jQuery_API(parentWin.document.body);

        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length > 0) {
            console.warn(`[Phone Sim] Panel already exists. Aborting UI creation.`);
            return true;
        }

        const coreJsUrl = new URL(import.meta.url);
        const basePath = coreJsUrl.pathname.substring(0, coreJsUrl.pathname.lastIndexOf('/modules/ui_modules'));
        const panelUrl = `${basePath}/panel.html`;

        console.log(`[Phone Sim] Fetching panel from: ${panelUrl}`);
        const response = await fetch(panelUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch panel.html: ${response.status} ${response.statusText}`);
        }
        const templateHtml = await response.text();
        if (!templateHtml) {
            throw new Error("Fetched panel.html is empty.");
        }

        body.append(templateHtml);

        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length === 0) {
             throw new Error("Panel element not found in DOM after injection.");
        }

        _createToggleButton();
        _createAuxiliaryElements();

        UI.populateApps(); // [关键] 这个函数会创建所有App的图标
        UI.renderStickerPicker();
        UI.applyCustomizations();
        UI.addEventListeners();
        UI.updateScaleAndPosition();

        if (parentWin.document.readyState === "complete") {
            const emojiScript = document.createElement('script');
            emojiScript.type = 'module';
            emojiScript.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
            parentWin.document.head.appendChild(emojiScript);
        }

        body.find(`#${PhoneSim_Config.PANEL_ID}`).hide();

        return true;
    } catch (error) {
        console.error('[Phone Sim] CRITICAL UI Initialization Failure:', error);
        if (parentWin.toastr) {
            parentWin.toastr.error("手机模拟器插件UI加载失败，请检查控制台以获取详细信息并尝试刷新页面。", "严重错误", { timeOut: 10000 });
        }
        return false;
    }
}

export function togglePanel(forceShow = null) {
    const panel = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const shouldShow = forceShow !== null ? forceShow : panel.is(':hidden');

    PhoneSim_State.isPanelVisible = shouldShow;
    PhoneSim_State.saveUiState();

    if (shouldShow) {
        panel.show();
        UI.updateScaleAndPosition();
        UI.updateTime();
        DataHandler.fetchAllData().then(() => {
            UI.rerenderCurrentView();
        });
    } else {
        panel.hide();
    }
}

// [修改] 升级 rerenderCurrentView 函数
export function rerenderCurrentView(updates = {}) {
    let activeId = null;
    const currentViewId = PhoneSim_State.currentView;

    // 根据当前视图确定需要使用的上下文ID
    switch(currentViewId) {
        case 'ChatConversation': case 'GroupMembers': case 'GroupInvite':
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
        // 欲色剧场App本身没有子页面ID，所以不需要在这里添加
    }

    // 始终重新渲染当前视图的主内容
    UI.renderViewContent(currentViewId, activeId);

    // 根据更新标志，处理可能需要的额外UI刷新
    if (updates.chatUpdated) {
        if(currentViewId === 'ChatApp') {
            UI.renderContactsList();
        }
    }
    // [新增] 当接收到剧场数据更新时，如果当前正在查看剧场App，就刷新它
    if (updates.theaterUpdated) {
        if(currentViewId === 'TheaterApp') {
            // 直接调用渲染函数，它会使用最新的PhoneSim_State.theaterData
            UI.renderTheaterApp();
        }
    }
}

// [修改] 升级 showView 函数
export function showView(viewId, ...args) {
    if (PhoneSim_State.isNavigating) return;

    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    let targetViewId = viewId;
    let isSubViewNavigation = false;

    if (viewId === 'BrowserHistory') {
        targetViewId = 'BrowserApp';
        isSubViewNavigation = true;
    }

    const currentView = p.find('.view.active');
    const nextView = p.find(`#${targetViewId.toLowerCase()}-view`);

    if (!nextView.length || (currentView.attr('id') === nextView.attr('id') && !args[0]?.forceRerender && !args[0]?.isTabSwitch)) {
        if (isSubViewNavigation && currentView.attr('id') === nextView.attr('id')) {
             UI.renderViewContent(viewId, ...args);
             return;
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
        case 'ChatConversation': case 'GroupMembers': case 'GroupInvite': PhoneSim_State.activeContactId = activeId; break;
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
        // [新增] 欲色剧场App的case，虽然它目前没有子ID，但保留结构完整性
        case 'TheaterApp':
            PhoneSim_State.activeTheaterPage = 'announcements'; // 默认打开通告页面
            break;
    }

    UI.renderViewContent(viewId, ...dataArgs);
    PhoneSim_State.currentView = viewId;
    PhoneSim_State.saveUiState();

    const currentLevel = parseInt(currentView.data('nav-level'), 10);
    const nextLevel = parseInt(nextView.data('nav-level'), 10);

    let animationIn = 'fade-in', animationOut = 'fade-out';

    const isZoomingIn = options.animationOrigin && currentView.is('#homescreen-view');
    const isReturningHome = nextView.is('#homescreen-view') && !currentView.is('#homescreen-view');

    if (isZoomingIn) {
        animationIn = 'zoom-in';
        const { x, y } = options.animationOrigin;
        nextView.css({ '--origin-x': `${x}px`, '--origin-y': `${y}px` });
    } else if (isReturningHome) {
        const closingAppViewId = currentView.attr('id');
        const closingAppId = closingAppViewId.replace('-view', '').replace(/\b\w/g, l => l.toUpperCase());
        const appIcon = p.find(`.app-block[data-view="${closingAppId}"]`);

        if (appIcon.length) {
            animationOut = 'zoom-out';
            const rect = appIcon[0].getBoundingClientRect();
            const panelRect = p[0].getBoundingClientRect();
            const originX = rect.left - panelRect.left + rect.width / 2;
            const originY = rect.top - panelRect.top + rect.height / 2;
            currentView.css({ '--origin-x': `${originX}px`, '--origin-y': `${originY}px` });
        } else {
            animationOut = 'slide-out-to-bottom';
        }
    } else if (options.isTabSwitch) {
        animationIn = 'fade-in';
        animationOut = 'fade-out';
    } else if (nextLevel > currentLevel) {
        animationIn = 'slide-in-from-right';
        animationOut = 'slide-out-to-left';
    } else if (nextLevel < currentLevel) {
        animationIn = 'slide-in-from-left';
        animationOut = 'slide-out-to-right';
    }

    p.find('.view').removeClass('zoom-in zoom-out slide-in-from-right slide-in-from-left slide-out-to-right slide-out-to-left slide-out-to-bottom fade-in fade-out');

    nextView.addClass(animationIn);
    currentView.addClass(animationOut);

    nextView.css('z-index', 3).addClass('active');
    currentView.css('z-index', 2);

    const transitionDuration = (animationIn === 'zoom-in' || animationOut === 'zoom-out') ? 400 : 350;
    setTimeout(() => {
        currentView.removeClass('active').removeClass(animationOut);
        nextView.removeClass(animationIn).css({ zIndex: 2, '--origin-x': '', '--origin-y': '' });
        PhoneSim_State.isNavigating = false;
    }, transitionDuration);
}

// [修改] 升级 renderViewContent 函数
export function renderViewContent(viewId, ...args) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);

    if (viewId === 'BrowserHistory') {
        const browserView = p.find('#browserapp-view');
        browserView.find('.browser-subview').removeClass('active');
        browserView.find('#browserhistory-view').addClass('active');
        UI.renderHistoryAndBookmarks();
        return;
    }

    switch(viewId) {
        case 'HomeScreen': break; // 主屏幕由 populateApps 单独处理
        case 'ChatApp':
            UI.renderContactsList(); UI.renderContactsView(); UI.renderDiscoverView(); UI.renderMeView();
            const activeTab = PhoneSim_State.activeSubviews.chatapp || 'messages';
            p.find('#chatapp-view .subview').removeClass('active').filter(`[data-subview="${activeTab}"]`).addClass('active');
            p.find('.chatapp-bottom-nav .nav-item').removeClass('active').filter(`[data-target="${activeTab}"]`).addClass('active');
            break;
        case 'ChatConversation': UI.renderChatView(args[0], 'WeChat'); break;
        case 'GroupMembers': UI.renderGroupMembersView(args[0]); break;
        case 'GroupInvite': UI.renderGroupInviteView(args[0]); break;
        case 'GroupCreation': UI.renderGroupCreationView(); break;
        case 'Moments': UI.renderMomentsView(); break;
        case 'Homepage': UI.renderHomepage(args[0]); break;
        case 'PhoneApp':
            UI.renderPhoneContactList(); UI.renderCallLogView();
            const activePhoneTab = PhoneSim_State.activeSubviews.phoneapp || 'contacts';
            p.find('#phoneapp-view .subview').removeClass('active').filter(`.phone-${activePhoneTab}-subview`).addClass('active');
            p.find('.phoneapp-bottom-nav .nav-item').removeClass('active').filter(`[data-target="${activePhoneTab}"]`).addClass('active');
            break;
        case 'EmailApp': UI.renderEmailList(); break;
        case 'EmailDetail': UI.renderEmailDetail(args[0]); break;
        case 'SettingsApp': UI.renderSettingsView(); break;
        case 'BrowserApp': UI.renderBrowserState(); break;
        case 'ForumApp': UI.renderForumBoardList(); break;
        case 'ForumPostList': UI.renderForumPostList(args[0]); break;
        case 'ForumPostDetail': UI.renderForumPostDetail(args[0]); break;
        case 'LiveCenterApp': UI.renderLiveBoardList(); break;
        case 'LiveStreamList': UI.renderLiveStreamList(args[0]); break;
        case 'LiveStreamRoom': UI.renderLiveStreamRoom(args[0]); break;
        // [新增] 当需要显示剧场App时，调用我们新的渲染函数
        case 'TheaterApp': UI.renderTheaterApp(); break;
        case 'Creation': UI.renderCreationView(); break;
    }
}

export function populateApps() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const appGrid = p.find('#homescreen-view .app-grid');
    const dockBar = p.find('#homescreen-view .dock-bar');
    appGrid.empty();
    dockBar.empty();

    const apps = [
        { id: 'ChatApp', name: '微信', icon: 'fa-comment', color: '#7ED321' },
        { id: 'EmailApp', name: '邮箱', icon: 'fa-envelope', color: '#50E3C2' },
        { id: 'Moments', name: '朋友圈', icon: 'fa-images', color: '#4A90E2', isAliasFor: 'ChatApp' },
        { id: 'BrowserApp', name: '浏览器', icon: 'fa-compass', color: '#F5A623' },
        { id: 'ForumApp', name: '论坛', icon: 'fa-comments', color: '#BD10E0' },
        { id: 'LiveCenterApp', name: '直播中心', icon: 'fa-stream', color: '#9013FE' },
        { id: 'TheaterApp', name: '欲色剧场', icon: 'fa-film', color: '#ffc0cb' }, // [新增] 欲色剧场App注册信息
        { id: 'SettingsApp', name: '设置', icon: 'fa-cog', color: '#B8E986' }
    ];
    const dockApps = ['PhoneApp', 'ChatApp'];

    const createIconHtml = (app) => `
        <div class="app-block" data-view="${app.isAliasFor || app.id}">
            <div class="app-icon" style="background-color: ${app.color};"><i class="fas ${app.icon}"></i></div>
            <span class="app-name">${app.name}</span>
            <div class="app-badge" style="display:none;"></div>
        </div>
    `;

    apps.forEach(app => {
        appGrid.append(createIconHtml(app));
    });

    const phoneApp = { id: 'PhoneApp', name: '电话', icon: 'fa-phone', color: '#4CAF50' };
    dockBar.append(createIconHtml(phoneApp));
    dockBar.append(createIconHtml(apps.find(a => a.id === 'ChatApp')));
}
