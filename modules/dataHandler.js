import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js';
import * as BrowserData from './data_modules/browserData.js';
import * as ForumData from './data_modules/forumData.js';
import * as LiveCenterData from './data_modules/liveCenterData.js';
import * as TheaterData from './data_modules/theaterData.js';

// 将所有数据处理模块，包括我们新的 TheaterData，都集结起来
const modules = [Processor, Actions, Fetch, BrowserData, ForumData, LiveCenterData, TheaterData];

// 创建一个统一的数据处理总管对象
export const PhoneSim_DataHandler = {};

// 这是一个便捷的导出，让其他模块可以直接使用这两个核心函数
export { getOrCreatePhoneLorebook, clearLorebookCache } from './data_modules/actions.js';

// 将所有子模块的功能都赋予我们的数据总管
modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_DataHandler[key] = module[key];
        }
    });
});

// 数据总管的上任仪式：为所有下属分发工具和通讯录
PhoneSim_DataHandler.init = (dependencies, uiHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // 将核心API、UI总管，以及数据总管自身的引用都传递下去
            module.init(dependencies, uiHandler, PhoneSim_DataHandler);
        }
    });
};
