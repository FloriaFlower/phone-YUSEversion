import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js';
import * as BrowserData from './data_modules/browserData.js';
import * as ForumData from './data_modules/forumData.js';
import * as LiveCenterData from './data_modules/liveCenterData.js';
import * as TheaterData from './data_modules/theaterData.js';

const modules = [Processor, Actions, Fetch, BrowserData, ForumData, LiveCenterData, TheaterData];

export const PhoneSim_DataHandler = {};

// 将关键函数直接挂载到主对象上，避免循环依赖问题
Object.assign(PhoneSim_DataHandler, Actions);
Object.assign(PhoneSim_DataHandler, Fetch);

modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init' && !PhoneSim_DataHandler[key]) {
            PhoneSim_DataHandler[key] = module[key];
        }
    });
});

PhoneSim_DataHandler.init = (dependencies, uiHandler, dataHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            module.init(dependencies, uiHandler, dataHandler);
        }
    });
};
