import { PhoneSim_Config } from 'config.js';
import { PhoneSim_State } from '../state.js';

let TavernHelper_API, parentWin, UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
    DataHandler = dataHandler;
}

const PRESET_FORUM_BOARDS = {
    "campus_life": "校园生活",
    "academic_exchange": "学术交流"
};

const PRESET_LIVE_BOARDS = {
    "hot_games": { name: "热门游戏" },
    "music_station": { name: "欲色专区" },
    "life_chat": { name: "生活闲聊" }
};

export function getBoardNameById(boardId, context) {
    if (context === 'forum') {
        return PRESET_FORUM_BOARDS[boardId] || PhoneSim_State.forumData[boardId]?.boardName || boardId;
    }
    if (context === 'live') {
        return PRESET_LIVE_BOARDS[boardId]?.name || PhoneSim_State.liveCenterData[boardId]?.boardName || boardId;
    }
    return boardId;
}

async function fetchAllDirectoryAndRequests() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
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
        console.error('[Phone Sim] Failed to fetch directory:', er);
        PhoneSim_State.pendingFriendRequests = [];
    }
}

export async function fetchAllBrowserData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) {
        PhoneSim_State.persistentBrowserHistory = [];
        PhoneSim_State.browserData = {};
        PhoneSim_State.browserBookmarks = [];
        PhoneSim_State.browserDirectory = {};
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const browserDbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_BROWSER_DATABASE);
        const browserDb = browserDbEntry ? JSON.parse(browserDbEntry.content || '{}') : {};

        PhoneSim_State.persistentBrowserHistory = browserDb.history || [];
        PhoneSim_State.browserData = browserDb.pages || {};
        PhoneSim_State.browserBookmarks = browserDb.bookmarks || [];
        PhoneSim_State.browserDirectory = browserDb.directory || {};
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch browser data:', er);
        PhoneSim_State.persistentBrowserHistory = [];
        PhoneSim_State.browserData = {};
        PhoneSim_State.browserBookmarks = [];
        PhoneSim_State.browserDirectory = {};
    }
}

export async function fetchAllForumData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
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

export async function fetchAllLiveCenterData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) { PhoneSim_State.liveCenterData = {}; return; }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const liveCenterEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_LIVECENTER_DATABASE);
        PhoneSim_State.liveCenterData = liveCenterEntry ? JSON.parse(liveCenterEntry.content || '{}') : {};
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch live data:', er);
        PhoneSim_State.liveCenterData = {};
    }
}

// ------------------------------
// 关键修复：直接调用本地函数获取剧场数据
// ------------------------------
export async function fetchAllTheaterData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) {
        PhoneSim_State.theaterData = { announcements: [], customizations: [], theater: [], shop: [] };
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const theaterEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_THEATER_DATABASE);
        // 解析数据，避免格式错误导致空页面
        const theaterData = theaterEntry ? JSON.parse(theaterEntry.content || '{}') : {};
        // 确保数据结构完整
        PhoneSim_State.theaterData = {
            announcements: theaterData.announcements || [],
            customizations: theaterData.customizations || [],
            theater: theaterData.theater || [],
            shop: theaterData.shop || []
        };
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch theater data:', er);
        // 错误时用默认数据兜底
        PhoneSim_State.theaterData = {
            announcements: [{ title: '默认通告', actor: '洛洛' }],
            customizations: [],
            theater: [],
            shop: []
        };
    }
}

export async function fetchAllData() {
    await fetchAllContacts();
    await fetchAllEmails();
    await fetchAllMoments();
    await fetchAllCallLogs();
    await fetchAllBrowserData();
    await fetchAllForumData();
    await fetchAllLiveCenterData();
    await fetchAllTheaterData(); // 直接调用本地函数（修复历史bug）
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
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
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
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
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
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) {
        PhoneSim_State.contacts = {};
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const dbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DB_NAME);
        const avatarEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_AVATAR_DB_NAME);

        const dbData = dbEntry ? JSON.parse(dbEntry.content || '{}') : {};
        const avatarData = avatarEntry ? JSON.parse(avatarEntry.content || '{}') : {};

        if (avatarData[PhoneSim_Config.PLAYER_ID]) {
            PhoneSim_State.customization.playerAvatar = avatarData[PhoneSim_Config.PLAYER_ID];
        }

        delete dbData.plugin_customization_data;

        for (const contactId in dbData) {
            const contact = dbData[contactId];
            if (!contact.profile) continue;
            if (contact.profile.has_custom_avatar && avatarData[contactId]) {
                contact.profile.avatar = avatarData[contactId];
            }
        }
        PhoneSim_State.contacts = dbData;
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch contacts:', er);
        PhoneSim_State.contacts = {};
    }
}
