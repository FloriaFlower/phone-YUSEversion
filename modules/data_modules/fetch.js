import { PhoneSim_Config } from 'config.js';
import { PhoneSim_State } from '../state.js';

let TavernHelper_API, parentWin, UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
    DataHandler = dataHandler;
}

const PRESET_FORUM_BOARDS = { "campus_life": "校园生活", "academic_exchange": "学术交流" };
const PRESET_LIVE_BOARDS = { "hot_games": { name: "热门游戏" }, "music_station": { name: "音乐台" }, "life_chat": { name: "生活闲聊" } };

export function getBoardNameById(boardId, context) {
    if (context === 'forum') return PRESET_FORUM_BOARDS[boardId] || PhoneSim_State.forumData[boardId]?.boardName || boardId;
    if (context === 'live') return PRESET_LIVE_BOARDS[boardId]?.name || PhoneSim_State.liveCenterData[boardId]?.boardName || boardId;
    return boardId;
}

async function fetchAllDirectoryAndRequests() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.pendingFriendRequests = []; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const dirEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DIR_NAME);
        PhoneSim_State.pendingFriendRequests = dirEntry ? (JSON.parse(dirEntry.content || '{}').friend_requests || []) : [];
    } catch (er) {
        PhoneSim_State.pendingFriendRequests = [];
    }
}

export async function fetchAllBrowserData() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.persistentBrowserHistory = []; PhoneSim_State.browserData = {}; PhoneSim_State.browserBookmarks = []; PhoneSim_State.browserDirectory = {}; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const browserDbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_BROWSER_DATABASE);
        const browserDb = browserDbEntry ? JSON.parse(browserDbEntry.content || '{}') : {};
        PhoneSim_State.persistentBrowserHistory = browserDb.history || [];
        PhoneSim_State.browserData = browserDb.pages || {};
        PhoneSim_State.browserBookmarks = browserDb.bookmarks || [];
        PhoneSim_State.browserDirectory = browserDb.directory || {};
    } catch (er) {
        PhoneSim_State.persistentBrowserHistory = [];
        PhoneSim_State.browserData = {};
        PhoneSim_State.browserBookmarks = [];
        PhoneSim_State.browserDirectory = {};
    }
}

export async function fetchAllForumData() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.forumData = {}; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const forumEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_FORUM_DATABASE);
        PhoneSim_State.forumData = forumEntry ? JSON.parse(forumEntry.content || '{}') : {};
    } catch (er) {
        PhoneSim_State.forumData = {};
    }
}

export async function fetchAllLiveCenterData() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.liveCenterData = {}; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const liveCenterEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_LIVECENTER_DATABASE);
        PhoneSim_State.liveCenterData = liveCenterEntry ? JSON.parse(liveCenterEntry.content || '{}') : {};
    } catch (er) {
        PhoneSim_State.liveCenterData = {};
    }
}

// ------------------------------
// 关键：剧场数据加载函数改为空实现（不做任何操作，避免报错）
// ------------------------------
export async function fetchAllTheaterData() {
    // 暂时不加载剧场数据，优先恢复UI
    PhoneSim_State.theaterData = { announcements: [], customizations: [], theater: [], shop: [] };
}

// ------------------------------
// 修复：fetchAllData只加载核心数据，跳过剧场
// ------------------------------
export async function fetchAllData() {
    try {
        // 只加载核心数据（确保UI必显示）
        await fetchAllContacts();
        await fetchAllEmails();
        await fetchAllCallLogs();
        await fetchAllBrowserData();
        await fetchAllForumData();
        await fetchAllLiveCenterData();
        // 【关键】暂时不加载剧场数据（注释掉）
        // await fetchAllTheaterData();
        await fetchAllMoments();
        await fetchAllDirectoryAndRequests();
        UI.updateGlobalUnreadCounts();
    } catch (fatalErr) {
        // 强制更新UI，确保按钮显示
        if (UI && UI.updateGlobalUnreadCounts) UI.updateGlobalUnreadCounts();
    }
}

// 以下函数保持不变（核心功能）
export async function fetchAllMoments() {
    let allMoments = [];
    for (const contactId in PhoneSim_State.contacts) {
        const contact = PhoneSim_State.contacts[contactId];
        if (contact?.moments && Array.isArray(contact.moments)) allMoments.push(...contact.moments);
    }
    PhoneSim_State.moments = allMoments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export async function fetchAllEmails() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.emails = []; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const emailEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_EMAIL_DB_NAME);
        PhoneSim_State.emails = emailEntry ? JSON.parse(emailEntry.content || '[]') : [];
    } catch (er) {
        PhoneSim_State.emails = [];
    }
}

export async function fetchAllCallLogs() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.callLogs = []; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const callLogEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_CALL_LOG_DB_NAME);
        PhoneSim_State.callLogs = callLogEntry ? JSON.parse(callLogEntry.content || '[]') : [];
    } catch (er) {
        PhoneSim_State.callLogs = [];
    }
}

export async function fetchAllContacts() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) { PhoneSim_State.contacts = {}; return; }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const dbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DB_NAME);
        const avatarEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_AVATAR_DB_NAME);
        const dbData = dbEntry ? JSON.parse(dbEntry.content || '{}') : {};
        const avatarData = avatarEntry ? JSON.parse(avatarEntry.content || '{}') : {};

        if (avatarData[PhoneSim_Config.PLAYER_ID]) PhoneSim_State.customization.playerAvatar = avatarData[PhoneSim_Config.PLAYER_ID];
        delete dbData.plugin_customization_data;

        for (const contactId in dbData) {
            const contact = dbData[contactId];
            if (contact?.profile?.has_custom_avatar && avatarData[contactId]) contact.profile.avatar = avatarData[contactId];
        }
        PhoneSim_State.contacts = dbData;
    } catch (er) {
        PhoneSim_State.contacts = {};
    }
}
