import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js';
import * as BrowserData from './data_modules/browserData.js';
import * as ForumData from './data_modules/forumData.js';
import * as LiveCenterData from './data_modules/liveCenterData.js';
import * as TheaterData from './data_modules/theaterData.js';

const subModules = [Processor, Actions, Fetch, BrowserData, ForumData, LiveCenterData, TheaterData];
export const PhoneSim_DataHandler = {};

// 神之脑·完全体：能处理所有App指令的核心
PhoneSim_DataHandler.processMessageById = async function(messageId) {
    const context = parent.SillyTavern.getContext();
    const chat = context.chat;
    if (!chat || !chat[messageId]) {
        console.error(`[Phone Sim] Message with ID ${messageId} not found in chat context.`);
        return;
    }
    const messageContent = chat[messageId].mes;
    console.log(`[Phone Sim] Brain is processing content for message ${messageId}...`);

    // 第一道关卡：优先处理特殊的“欲色剧场”格式
    const yuseTheaterRegex = /<yuse_data>[\s\S]*?<announcements>([\s\S]*?)<\/announcements>[\s\S]*?<customizations>([\s\S]*?)<\/customizations>[\s\S]*?<theater>([\s\S]*?)<\/theater>[\s\S]*?<theater_hot>([\s\S]*?)<\/theater_hot>[\s\S]*?<theater_new>([\s\S]*?)<\/theater_new>[\s\S]*?<theater_recommended>([\s\S]*?)<\/theater_recommended>[\s\S]*?<theater_paid>([\s\S]*?)<\/theater_paid>[\s\S]*?<shop>([\s\S]*?)<\/shop>[\s\S]*?<\/yuse_data>/s;

    const theaterMatch = messageContent.match(yuseTheaterRegex);

    if (theaterMatch) {
         console.log("%c[Phone Sim] Yuse Theater data FOUND. Overriding standard processor.", "color: #FF69B4; font-weight: bold;");
        const data = {
            announcements: theaterMatch[1].trim(),
            customizations: theaterMatch[2].trim(),
            theater: theaterMatch[3].trim(),
            theater_hot: theaterMatch[4].trim(),
            theater_new: theaterMatch[5].trim(),
            theater_recommended: theaterMatch[6].trim(),
            theater_paid: theaterMatch[7].trim(),
            shop: theaterMatch[8].trim(),
        };
        await TheaterData.saveTheaterData(data, messageId);
    } else {
        // 如果不是剧场格式，就调用我们原来的“主处理器”去处理所有其他App的指令
        // 这就保证了所有App的功能都能正常运作
        console.log("[Phone Sim] Standard data format detected. Engaging main processor.");
        await Processor.mainProcessor(messageId);
    }
};

// 聚合所有子模块的功能，确保所有函数都可用
subModules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init' && !PhoneSim_DataHandler[key]) {
            PhoneSim_DataHandler[key] = module[key];
        }
    });
});


PhoneSim_DataHandler.init = (dependencies, uiHandler) => {
    // 初始化所有子模块
    subModules.forEach(module => {
        if (typeof module.init === 'function') {
            module.init(dependencies, uiHandler, PhoneSim_DataHandler);
        }
    });
};
