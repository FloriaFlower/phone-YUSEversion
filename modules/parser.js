import { PhoneSim_Config } from '../config.js';
import { PhoneSim_State } from './state.js';

// 初始化剧场数据（仅初始化，不解析）
try {
    if (!PhoneSim_State.theaterData) {
        PhoneSim_State.theaterData = {
            announcements: [],
            customizations: [],
            theater: [],
            shop: []
        };
    }
} catch (err) {
    window.PhoneSim_State = window.PhoneSim_State || {};
    window.PhoneSim_State.theaterData = { announcements: [], customizations: [], theater: [], shop: [] };
}

/**
 * 【暂时注释】剧场格式解析（避免干扰）
 */
// export function parseTheaterFormat(text) {
//     try {
//         const theaterRegex = /<TheaterData>([\s\S]*?)<\/TheaterData>/g;
//         const matches = text.matchAll(theaterRegex);
//         for (const match of matches) {
//             const theaterJson = match[1].trim();
//             let theaterData = JSON.parse(theaterJson);
//             if (theaterData.announcements) PhoneSim_State.theaterData.announcements = theaterData.announcements;
//         }
//     } catch (err) {
//         console.error('[Theater Parse] Error:', err);
//     }
// }

export function getNextPlayerTimestamp() {
    try {
        return new Date().toISOString();
    } catch (err) {
        return new Date().toISOString();
    }
}

export function parseWorldState(text) {
    try {
        // 原有世界状态解析
        const worldStateMatch = text.match(PhoneSim_Config.WORLD_STATE_REGEX);
        if (worldStateMatch) PhoneSim_State.worldTime = worldStateMatch[1];
        // 【注释】不解析剧场格式
        // parseTheaterFormat(text);
    } catch (err) {
        // 静默失败
    }
}

export const PhoneSim_Parser = {
    getNextPlayerTimestamp,
    parseWorldState
    // parseTheaterFormat // 不暴露解析函数
};
