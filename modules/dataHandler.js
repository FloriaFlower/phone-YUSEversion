import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js';
import * as BrowserData from './data_modules/browserData.js';
import * as ForumData from './data_modules/forumData.js';
import * as LiveCenterData from './data_modules/liveCenterData.js';
import * as TheaterData from './data_modules/theaterData.js';

const modules = [Processor, Actions, Fetch, BrowserData, ForumData, LiveCenterData, TheaterData];

export const PhoneSim_DataHandler = {};

export { getOrCreatePhoneLorebook, clearLorebookCache } from './data_modules/actions.js';

modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_DataHandler[key] = module[key];
        }
    });
});

PhoneSim_DataHandler.init = (dependencies, uiHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // [修改] 确保数据处理器自身也被传递下去，解决循环依赖
            module.init(dependencies, uiHandler, PhoneSim_DataHandler);
        }
    });
};
