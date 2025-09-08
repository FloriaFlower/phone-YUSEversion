import { PhoneSim_Config } from '../config.js';

let parentWindow;

export const PhoneSim_State = {
    // ---- 核心状态 ----
    isNavigating: false, // 防止并发导航操作
    isPanelVisible: false,
    panelPos: null,
    worldDate: new Date(),
    worldTime: '12:00',
    lastTotalUnread: 0,

    // ---- App数据存储 ----
    contacts: {},
    emails: [],
    moments: [],
    callLogs: [],
    forumData: {},
    liveCenterData: {},
    theaterData: {}, // [新增] 为“欲色剧场”App准备的专属数据空间

    // ---- UI活动状态 ----
    currentView: 'HomeScreen',
    activeSubviews: {}, // 例如: {chatapp: 'messages', phoneapp: 'contacts'}
    activeContactId: null,
    activeEmailId: null,
    activeProfileId: null,
    activeForumBoardId: null,
    activeForumPostId: null,
    activeLiveBoardId: null,
    activeLiveStreamId: null,
    activeLiveStreamData: null,
    activeReplyUid: null,
    activeTheaterPage: 'announcements', // [新增] 记录欲色剧场当前所在的页面

    // ---- 暂存与待处理数据 ----
    stagedPlayerMessages: [],
    stagedPlayerActions: [],
    pendingFriendRequests: [],
    pendingAnimations: {},

    // ---- 通话状态 ----
    isVoiceCallActive: false,
    activeCallData: null,
    isPhoneCallActive: false,
    activePhoneCallData: null,
    isCallRecording: false,
    incomingCallData: null,

    // ---- 浏览器状态 ----
    browserHistory: [], // 会话历史
    persistentBrowserHistory: [], // 永久历史记录
    browserData: {},
    browserDirectory: {},
    browserHistoryIndex: -1,
    isBrowserLoading: false,
    pendingBrowserAction: null,
    browserBookmarks: [],

    // ---- 用户个性化设置 ----
    customization: { isMuted: false, playerNickname: '我', enabled: true },


    // ---- 核心方法 ----

    init: function(win) {
        parentWindow = win;
    },

    loadCustomization: function() {
        try {
            const saved = JSON.parse(parentWindow.localStorage.getItem(PhoneSim_Config.STORAGE_KEY_CUSTOMIZATION) || '{}');
            const defaultCustomization = { isMuted: false, playerNickname: '我', enabled: true };
            this.customization = { ...defaultCustomization, ...this.customization, ...saved };
        } catch (e) {
            console.error('[Phone Sim] Failed to load customization state from localStorage:', e);
            this.customization = { isMuted: false, playerNickname: '我', enabled: true };
        }
    },

    saveCustomization: function() {
        try {
            parentWindow.localStorage.setItem(PhoneSim_Config.STORAGE_KEY_CUSTOMIZATION, JSON.stringify(this.customization));
        } catch (er) {
            console.error('[Phone Sim] Failed to save customization to localStorage:', er);
        }
    },

    loadUiState: function() {
        try {
            const s = JSON.parse(parentWindow.localStorage.getItem(PhoneSim_Config.STORAGE_KEY_UI) || '{}');
            // 只加载需要的属性，避免覆盖已初始化的对象
            const propertiesToLoad = [
                'isPanelVisible', 'panelPos', 'currentView', 'activeContactId',
                'activeEmailId', 'activeProfileId', 'activeForumBoardId',
                'activeForumPostId', 'activeLiveBoardId', 'activeLiveStreamId',
                'activeSubviews', 'activeTheaterPage' // [新增] 加载剧场页面状态
            ];
            for (const prop of propertiesToLoad) {
                if (s[prop] !== undefined) {
                    this[prop] = s[prop];
                }
            }
        } catch (e) {
            console.error('[Phone Sim] Failed to load UI state from localStorage:', e);
        }
    },
    saveUiState: function() {
        try {
            const stateToSave = {
                isPanelVisible: this.isPanelVisible,
                panelPos: this.panelPos,
                currentView: this.currentView,
                activeContactId: this.activeContactId,
                activeEmailId: this.activeEmailId,
                activeProfileId: this.activeProfileId,
                activeForumBoardId: this.activeForumBoardId,
                activeForumPostId: this.activeForumPostId,
                activeLiveBoardId: this.activeLiveBoardId,
                activeLiveStreamId: this.activeLiveStreamId,
                activeSubviews: this.activeSubviews,
                activeTheaterPage: this.activeTheaterPage // [新增] 保存剧场页面状态
            };
            parentWindow.localStorage.setItem(PhoneSim_Config.STORAGE_KEY_UI, JSON.stringify(stateToSave));
        } catch (e) {
            console.error('[Phone Sim] Failed to save UI state to localStorage:', e);
        }
    }
};
