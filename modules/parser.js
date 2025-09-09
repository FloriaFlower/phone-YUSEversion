import { PhoneSim_Config } from '../config.js';
import { PhoneSim_State } from './state.js';

// 初始化剧场数据（确保即使失败也不崩溃）
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
    console.error('[Theater Data Init] Error:', err);
    // 极端情况：全局状态初始化失败，仍手动创建
    window.PhoneSim_State = window.PhoneSim_State || {};
    window.PhoneSim_State.theaterData = { announcements: [], customizations: [], theater: [], shop: [] };
}

/**
 * 安全解析剧场格式，不中断整体流程
 */
export function parseTheaterFormat(text) {
    // 若文本为空或无匹配，直接返回
    if (!text || !text.includes('<TheaterData>')) return;
    
    try {
        const theaterRegex = /<TheaterData>([\s\S]*?)<\/TheaterData>/g;
        const matches = text.matchAll(theaterRegex);
        
        for (const match of matches) {
            const theaterJson = match[1].trim();
            if (!theaterJson) continue; // 空内容跳过
            
            // 二次捕获JSON解析错误
            let theaterData;
            try {
                theaterData = JSON.parse(theaterJson);
            } catch (jsonErr) {
                console.error('[Theater JSON Parse] Error:', jsonErr, 'Raw:', theaterJson);
                continue; // 单个解析失败，跳过继续处理其他
            }
            
            // 安全更新数据（避免undefined报错）
            if (Array.isArray(theaterData.announcements)) {
                PhoneSim_State.theaterData.announcements = theaterData.announcements;
            }
            if (Array.isArray(theaterData.customizations)) {
                PhoneSim_State.theaterData.customizations = theaterData.customizations;
            }
            if (Array.isArray(theaterData.theater)) {
                PhoneSim_State.theaterData.theater = theaterData.theater;
            }
            if (Array.isArray(theaterData.shop)) {
                PhoneSim_State.theaterData.shop = theaterData.shop;
            }
        }
    } catch (err) {
        console.error('[Theater Parse] Fatal Error:', err);
        // 解析失败不抛出，确保后续代码执行
    }
}

// 原有函数保持不变，但增加错误捕获
export function getNextPlayerTimestamp() {
    try {
        const now = new Date();
        return now.toISOString();
    } catch (err) {
        console.error('[Get Timestamp] Error:', err);
        return new Date().toISOString(); // 兜底
    }
}

export function parseWorldState(text) {
    try {
        // 原有世界状态解析
        const worldStateMatch = text.match(PhoneSim_Config.WORLD_STATE_REGEX);
        if (worldStateMatch) {
            PhoneSim_State.worldTime = worldStateMatch[1];
        }
        // 安全解析剧场格式
        parseTheaterFormat(text);
    } catch (err) {
        console.error('[Parse World State] Error:', err);
        // 失败不中断
    }
}

export const PhoneSim_Parser = {
    getNextPlayerTimestamp,
    parseWorldState,
    parseTheaterFormat
};
