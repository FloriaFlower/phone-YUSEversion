import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js'; 
import * as BrowserData from './data_modules/browserData.js';
import * as ForumData from './data_modules/forumData.js';
import * as LiveCenterData from './data_modules/liveCenterData.js';
import * as TheaterData from './data_modules/theaterData.js';

// 确保所有模块都被包含
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
            module.init(dependencies, uiHandler, PhoneSim_DataHandler);
        }
    });
};
