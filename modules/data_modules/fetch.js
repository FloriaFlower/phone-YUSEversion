import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let TavernHelper_API, parentWin, UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
    DataHandler = dataHandler;
}

// ---- 私有辅助函数 ----

// 这个函数用于获取联系人目录和好友请求，逻辑是正确的
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
        console.error('[Phone Sim] Failed to fetch directory and friend requests:', er);
        PhoneSim_State.pendingFriendRequests = [];
    }
}

// ---- 导出的数据获取函数 ----

// 获取所有联系人数据
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

        // 兼容旧数据，移除不再使用的字段
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
        console.error('[Phone Sim] Failed to fetch all contacts:', er);
        PhoneSim_State.contacts = {};
    }
}

// 获取所有邮件
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

// 获取所有通话记录
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

// 获取所有朋友圈动态
export async function fetchAllMoments() {
    let allMoments = [];
    for (const contactId in PhoneSim_State.contacts) {
        const contact = PhoneSim_State.contacts[contactId];
        if (contact.moments && Array.isArray(contact.moments)) {
            allMoments.push(...contact.moments);
        }
    }
    allMoments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    PhoneSim_State.moments = allMoments;
}

// 获取所有浏览器数据
export async function fetchAllBrowserData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) { /* ... 重置浏览器状态 ... */ return; }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const browserDbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_BROWSER_DATABASE);
        const browserDb = browserDbEntry ? JSON.parse(browserDbEntry.content || '{}') : {};
        PhoneSim_State.persistentBrowserHistory = browserDb.history || [];
        PhoneSim_State.browserData = browserDb.pages || {};
        PhoneSim_State.browserBookmarks = browserDb.bookmarks || [];
        PhoneSim_State.browserDirectory = browserDb.directory || {};
    } catch (er) { /* ... 错误处理 ... */ }
}

// 获取所有论坛数据
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

// 获取所有直播中心数据
export async function fetchAllLiveCenterData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) { PhoneSim_State.liveCenterData = {}; return; }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const liveCenterEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_LIVECENTER_DATABASE);
        PhoneSim_State.liveCenterData = liveCenterEntry ? JSON.parse(liveCenterEntry.content || '{}') : {};
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch live center data:', er);
        PhoneSim_State.liveCenterData = {};
    }
}

// [新增] 获取所有欲色剧场数据
export async function fetchAllTheaterData() {
    const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
    if (!lorebookName) {
        // 如果没有世界书，使用我们之前创建的空数据结构
        PhoneSim_State.theaterData = DataHandler.getEmptyTheaterData();
        return;
    }
    try {
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const theaterEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_THEATER_DATABASE);
        // 如果有数据条目，就解析它；如果没有，同样使用安全的空数据结构
        PhoneSim_State.theaterData = theaterEntry ? JSON.parse(theaterEntry.content || '{}') : DataHandler.getEmptyTheaterData();
    } catch (er) {
        console.error('[Phone Sim] Failed to fetch theater data:', er);
        PhoneSim_State.theaterData = DataHandler.getEmptyTheaterData();
    }
}

// [核心修复] 总数据获取函数
export async function fetchAllData() {
    // 按照顺序，依次获取所有App的数据
    await fetchAllContacts();
    await fetchAllEmails();
    await fetchAllMoments();
    await fetchAllCallLogs();
    await fetchAllBrowserData();
    await fetchAllForumData();
    await fetchAllLiveCenterData();
    // [修复] 直接调用本文件内的 fetchAllTheaterData 函数，而不是通过上级
    await fetchAllTheaterData();
    await fetchAllDirectoryAndRequests();

    // 所有数据获取完毕后，统一更新UI上的未读角标
    UI.updateGlobalUnreadCounts();
}

// Board name helper function
export function getBoardNameById(boardId, context) {
    // ... 此函数保持不变 ...
    return boardId;
}
