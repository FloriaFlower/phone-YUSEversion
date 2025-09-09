import { PhoneSim_Config } from '../config.js';
import { PhoneSim_State } from './state.js';

// 初始化剧场数据结构（避免undefined报错）
if (!PhoneSim_State.theaterData) {
    PhoneSim_State.theaterData = {
        announcements: [], // 通告拍摄
        customizations: [], // 粉丝定制
        theater: [], // 剧场列表
        shop: [] // 欲色商城
    };
}

/**
 * 解析AI对话中的欲色剧场格式（根据你的样板示例设计，假设格式为<TheaterData>{...}</TheaterData>）
 * @param {string} text - AI返回的对话文本
 */
export function parseTheaterFormat(text) {
    try {
        // 1. 匹配对话中的剧场数据标签（可根据实际样板调整正则）
        const theaterRegex = /<TheaterData>([\s\S]*?)<\/TheaterData>/g;
        const matches = text.matchAll(theaterRegex);

        // 2. 解析匹配到的数据并更新到全局状态
        for (const match of matches) {
            const theaterJson = match[1].trim();
            const theaterData = JSON.parse(theaterJson); // 假设数据为JSON格式
            
            // 3. 按页面分类更新数据（与renderTheater.js对应）
            if (theaterData.announcements) PhoneSim_State.theaterData.announcements = theaterData.announcements;
            if (theaterData.customizations) PhoneSim_State.theaterData.customizations = theaterData.customizations;
            if (theaterData.theater) PhoneSim_State.theaterData.theater = theaterData.theater;
            if (theaterData.shop) PhoneSim_State.theaterData.shop = theaterData.shop;
            
            console.log('[解析成功] 欲色剧场数据更新：', theaterData);
        }
    } catch (err) {
        console.error('[解析失败] 欲色剧场格式错误：', err);
    }
}

/**
 * 获取下一个玩家操作的时间戳（原有功能保留）
 */
export function getNextPlayerTimestamp() {
    const now = new Date();
    return now.toISOString();
}

/**
 * 解析世界状态（原有功能保留，新增剧场解析调用）
 * @param {string} text - 包含世界状态的文本
 */
export function parseWorldState(text) {
    // 原有世界状态解析逻辑...
    const worldStateMatch = text.match(PhoneSim_Config.WORLD_STATE_REGEX);
    if (worldStateMatch) {
        PhoneSim_State.worldTime = worldStateMatch[1];
    }

    // 新增：解析剧场格式
    parseTheaterFormat(text);
}

// 暴露解析器
export const PhoneSim_Parser = {
    getNextPlayerTimestamp,
    parseWorldState,
    parseTheaterFormat // 供外部调用（如commitStagedActions后重新解析）
};
