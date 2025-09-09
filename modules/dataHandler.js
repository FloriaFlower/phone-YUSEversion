import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js';
import * as BrowserData from './data_modules/browserData.js';
// [删除] ForumData, LiveCenterData, TheaterData 都是空的，不需要导入
import { findForumPostById, findForumReplyById, findLiveStreamById } from './data_modules/finders.js';

const modules = [Processor, Actions, Fetch, BrowserData];

export const PhoneSim_DataHandler = {};

// 直接从源文件导出，保持模块化清晰
export { getOrCreatePhoneLorebook, clearLorebookCache } from './data_modules/actions.js';

// 将所有模块的导出函数聚合到 PhoneSim_DataHandler 对象上
modules.forEach(module => {
    Object.keys(module).forEach(key => {
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_DataHandler[key] = module[key];
        }
    });
});

// 单独添加 finders 模块的导出，因为它们没有init函数
PhoneSim_DataHandler.findForumPostById = findForumPostById;
PhoneSim_DataHandler.findForumReplyById = findForumReplyById;
PhoneSim_DataHandler.findLiveStreamById = findLiveStreamById;


// 修正后的初始化函数
PhoneSim_DataHandler.init = (dependencies, uiHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // [修正] 将 PhoneSim_DataHandler 自身作为第三个参数传递
            // 这样每个子模块在需要时都可以调用其他数据处理函数
            module.init(dependencies, uiHandler, PhoneSim_DataHandler);
        }
    });
};
