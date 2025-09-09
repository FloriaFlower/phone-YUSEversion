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
    "music_station": { name: "音乐台" },
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
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) {
            PhoneSim_State.pendingFriendRequests = [];
            return;
        }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const dirEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DIR_NAME);
        if (dirEntry) {
            const dirData = JSON.parse(dirEntry.content || '{}');
            PhoneSim_State.pendingFriendRequests = dirData.friend_requests || [];
        } else {
            PhoneSim_State.pendingFriendRequests = [];
        }
    } catch (er) {
        console.error('[Dir Fetch] Error:', er);
        PhoneSim_State.pendingFriendRequests = [];
    }
}

export async function fetchAllBrowserData() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) {
            PhoneSim_State.persistentBrowserHistory = [];
            PhoneSim_State.browserData = {};
            PhoneSim_State.browserBookmarks = [];
            PhoneSim_State.browserDirectory = {};
            return;
        }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const browserDbEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_BROWSER_DATABASE);
        const browserDb = browserDbEntry ? JSON.parse(browserDbEntry.content || '{}') : {};

        PhoneSim_State.persistentBrowserHistory = browserDb.history || [];
        PhoneSim_State.browserData = browserDb.pages || {};
        PhoneSim_State.browserBookmarks = browserDb.bookmarks || [];
        PhoneSim_State.browserDirectory = browserDb.directory || {};
    } catch (er) {
        console.error('[Browser Fetch] Error:', er);
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
        console.error('[Forum Fetch] Error:', er);
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
        console.error('[Live Fetch] Error:', er);
        PhoneSim_State.liveCenterData = {};
    }
}

// ------------------------------
// 关键修复：剧场数据加载增加严格错误捕获，不阻塞UI
// ------------------------------
export async function fetchAllTheaterData() {
    try {
        const lorebookName = await DataHandler.getOrCreatePhoneLorebook();
        if (!lorebookName) {
            PhoneSim_State.theaterData = { announcements: [], customizations: [], theater: [], shop: [] };
            return; // 直接返回，不阻塞
        }
        const entries = await TavernHelper_API.getWorldbook(lorebookName);
        const theaterEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_THEATER_DATABASE);
        // 即使剧场数据解析失败，也只初始化空对象，不抛出错误
        let theaterData = {};
        if (theaterEntry && theaterEntry.content) {
            try {
                theaterData = JSON.parse(theaterEntry.content);
            } catch (jsonErr) {
                console.error('[Theater JSON Parse] Error:', jsonErr);
                theaterData = {}; // 解析失败用空对象兜底
            }
        }
        // 确保数据结构安全
        PhoneSim_State.theaterData = {
            announcements: theaterData.announcements || [],
            customizations: theaterData.customizations || [],
            theater: theaterData.theater || [],
            shop: theaterData.shop || []
        };
    } catch (er) {
        console.error('[Theater Fetch] Fatal Error:', er);
        // 致命错误时，仍初始化空数据，确保流程继续
        PhoneSim_State.theaterData = { announcements: [], customizations: [], theater: [], shop: [] };
    }
}

// ------------------------------
// 修复：确保fetchAllData不阻塞，优先完成UI初始化
// ------------------------------
export async function fetchAllData() {
    try {
        // 1. 先加载核心数据（联系人、通话记录等），确保UI能显示
        await fetchAllContacts();
        await fetchAllEmails();
        await fetchAllCallLogs();
        
        // 2. 再加载非核心数据（剧场、论坛等），即使失败也不影响UI
        await Promise.all([
            fetchAllBrowserData(),
            fetchAllForumData(),
            fetchAllLiveCenterData(),
            fetchAllTheaterData() // 已确保不抛出错误
        ]);
        
        await fetchAllMoments();
        await fetchAllDirectoryAndRequests();
        UI.updateGlobalUnreadCounts();
    } catch (fatalErr) {
        console.error('[Fetch All Data] Fatal Error:', fatalErr);
        // 即使整体数据加载失败，也强制更新UI，确保按钮显示
        UI.updateGlobalUnreadCounts();
    }
}

// 以下函数保持不变（省略，与之前一致）
export async function fetchAllMoments() { /* ... */ }
export async function fetchAllEmails() { /* ... */ }
export async function fetchAllCallLogs() { /* ... */ }
export async function fetchAllContacts() { /* ... */ }
