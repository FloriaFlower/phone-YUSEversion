
import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let TavernHelper_API, parentWin, UI;

export function init(deps, uiHandler) {
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
}

async function fetchAllDirectoryAndRequests() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) {
        PhoneSim_State.pendingFriendRequests = [];
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const dirEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DIR_NAME);
        if (dirEntry) {
            const dirData = JSON.parse(dirEntry.content || '{}');
            PhoneSim_State.pendingFriendRequests = dirData.friend_requests || [];
        } else {
            PhoneSim_State.pendingFriendRequests = [];
        }
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch directory and friend requests:', er);
        PhoneSim_State.pendingFriendRequests = [];
    }
}


export async function fetchAllBrowserData() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) {
        PhoneSim_State.browserHistory = [];
        PhoneSim_State.browserData = {};
        PhoneSim_State.browserBookmarks = [];
        PhoneSim_State.browserDirectory = {};
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const browserDbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_BROWSER_DATABASE);
        
        const browserDb = browserDbEntry ? JSON.parse(browserDbEntry.content || '{}') : {};
        
        PhoneSim_State.browserHistory = browserDb.history || [];
        PhoneSim_State.browserData = browserDb.pages || {};
        PhoneSim_State.browserBookmarks = browserDb.bookmarks || [];
        PhoneSim_State.browserDirectory = browserDb.directory || {};

        if (PhoneSim_State.browserHistory.length > 0 && PhoneSim_State.browserHistoryIndex === -1) {
            PhoneSim_State.browserHistoryIndex = PhoneSim_State.browserHistory.length - 1;
        }

    } catch (er) {
        console.error('[Phone Sim] Failed to fetch browser data:', er);
        PhoneSim_State.browserHistory = [];
        PhoneSim_State.browserData = {};
        PhoneSim_State.browserBookmarks = [];
        PhoneSim_State.browserDirectory = {};
    }
}

export async function fetchAllForumData() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) { PhoneSim_State.forumData = {}; return; }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const forumEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_FORUM_DATABASE);
        PhoneSim_State.forumData = forumEntry ? JSON.parse(forumEntry.content || '{}') : {};
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch forum data:', er);
        PhoneSim_State.forumData = {};
    }
}

export async function fetchAllData() {
    await fetchAllContacts();
    await fetchAllEmails();
    await fetchAllMoments();
    await fetchAllCallLogs();
    await fetchAllBrowserData();
    await fetchAllForumData();
    await fetchAllDirectoryAndRequests();
    UI.updateGlobalUnreadCounts();
}

export async function fetchAllMoments() {
    let allMoments = [];
    for (const contactId in PhoneSim_State.contacts) {
        const contact = PhoneSim_State.contacts[contactId];
        if (contact.moments && Array.isArray(contact.moments)) {
            allMoments.push(...contact.moments);
        }
    }
    allMoments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    PhoneSim_State.moments = allMoments;
}

export async function fetchAllEmails() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) { PhoneSim_State.emails = []; return; }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const emailEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_EMAIL_DB_NAME);
        PhoneSim_State.emails = emailEntry ? JSON.parse(emailEntry.content || '[]') : [];
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch emails:', er);
        PhoneSim_State.emails = [];
    }
}

export async function fetchAllCallLogs() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) { PhoneSim_State.callLogs = []; return; }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const callLogEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_CALL_LOG_DB_NAME);
        PhoneSim_State.callLogs = callLogEntry ? JSON.parse(callLogEntry.content || '[]') : [];
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch call logs:', er);
        PhoneSim_State.callLogs = [];
    }
}


export async function fetchAllContacts() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) {
        PhoneSim_State.contacts = {};
        PhoneSim_State.customization = { isMuted: false, playerNickname: '我' };
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const dbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DB_NAME);
        const avatarEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_AVATAR_DB_NAME);

        const dbData = dbEntry ? JSON.parse(dbEntry.content || '{}') : {};
        const avatarData = avatarEntry ? JSON.parse(avatarEntry.content || '{}') : {};

        const savedCustomization = JSON.parse(parentWin.localStorage.getItem(PhoneSim_Config.STORAGE_KEY_CUSTOMIZATION) || '{}');
        const defaultCustomization = { isMuted: false, playerNickname: '我' };
        PhoneSim_State.customization = { ...defaultCustomization, ...PhoneSim_State.customization, ...savedCustomization };

        if (avatarData[PhoneSim_Config.PLAYER_ID]) {
            PhoneSim_State.customization.playerAvatar = avatarData[PhoneSim_Config.PLAYER_ID];
        }

        delete dbData.plugin_customization_data;

        for (const contactId in dbData) {
            if (dbData[contactId].profile?.has_custom_avatar) {
                dbData[contactId].profile.avatar = avatarData[contactId];
            }
        }
        PhoneSim_State.contacts = dbData;
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch all contacts:', er);
        PhoneSim_State.contacts = {};
        PhoneSim_State.customization = { isMuted: false, playerNickname: '我' };
    }
}