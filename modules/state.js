import { PhoneSim_Config } from '../config.js';

let parentWindow;

export const PhoneSim_State = {
    isPanelVisible: false,
    panelPos: null,
    contacts: {},
    emails: [],
    moments: [],
    callLogs: [],
    forumData: {},
    activeContactId: null,
    activeEmailId: null,
    activeProfileId: null,
    activeForumBoardId: null,
    activeForumPostId: null,
    worldDate: new Date(),
    worldTime: '12:00',
    customization: { isMuted: false },
    stagedPlayerMessages: [],
    stagedPlayerActions: [],
    lastTotalUnread: 0,
    isVoiceCallActive: false,
    activeCallData: null,
    isPhoneCallActive: false,
    activePhoneCallData: null,
    isCallRecording: false,
    incomingCallData: null,
    currentView: 'HomeScreen',
    activeSubviews: {},
    browserHistory: [],
    browserData: {},
    browserDirectory: {},
    browserHistoryIndex: -1,
    isBrowserLoading: false,
    pendingBrowserAction: null,
    browserBookmarks: [],
    pendingAnimations: {},

    init: function(win) {
        parentWindow = win;
    },

    loadUiState: function() {
        try {
            const s = JSON.parse(parentWindow.localStorage.getItem(PhoneSim_Config.STORAGE_KEY_UI) || '{}');
            Object.assign(this, s);
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
                activeSubviews: this.activeSubviews
            };
            parentWindow.localStorage.setItem(PhoneSim_Config.STORAGE_KEY_UI, JSON.stringify(stateToSave));
        } catch (e) {
            console.error('[Phone Sim] Failed to save UI state to localStorage:', e);
        }
    }
};