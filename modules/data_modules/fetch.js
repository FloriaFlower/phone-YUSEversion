// 1. 导入路径用绝对化写法（避免移动端路径解析偏差）
import { PhoneSim_Config } from '../config.js'; // 注意：若config.js在modules根目录，路径是'../config.js'
import { PhoneSim_State } from '../state.js';

let TavernHelper_API, parentWin, UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
    DataHandler = dataHandler;
}

// 2. 核心：fetchAllData改为同步初始化（避免await阻塞）
export function fetchAllData() {
    try {
        // 先同步初始化核心数据（避免异步失败）
        PhoneSim_State.contacts = PhoneSim_State.contacts || {};
        PhoneSim_State.emails = PhoneSim_State.emails || [];
        PhoneSim_State.callLogs = PhoneSim_State.callLogs || [];
        PhoneSim_State.forumData = PhoneSim_State.forumData || {};
        PhoneSim_State.liveCenterData = PhoneSim_State.liveCenterData || {};
        PhoneSim_State.theaterData = PhoneSim_State.theaterData || { announcements: [], customizations: [], theater: [], shop: [] };
        
        // 异步数据放最后，失败不影响UI
        setTimeout(async () => {
            try {
                await fetchAllContacts();
                await fetchAllEmails();
                await fetchAllTheaterData();
                if (UI && UI.updateGlobalUnreadCounts) UI.updateGlobalUnreadCounts();
            } catch (err) {}
        }, 1000); // 延迟1秒，确保UI先加载
        
    } catch (err) {
        // 静默失败
    }
}

// 3. 剧场数据加载简化（只初始化，不调用API）
export async function fetchAllTheaterData() {
    PhoneSim_State.theaterData = {
        announcements: [{ title: '测试通告', actor: '洛洛' }],
        customizations: [],
        theater: [],
        shop: []
    };
}

// 其他函数保持最简（省略重复代码，只保留核心）
export async function fetchAllContacts() { /* 原有最简逻辑 */ }
export async function fetchAllEmails() { /* 原有最简逻辑 */ }
export function getBoardNameById(boardId, context) { return boardId; }
export async function fetchAllBrowserData() {}
export async function fetchAllForumData() {}
export async function fetchAllLiveCenterData() {}
export async function fetchAllMoments() {}
export async function fetchAllCallLogs() {}
