
import * as Processor from './data_modules/processor.js';
import * as Actions from './data_modules/actions.js';
import * as Fetch from './data_modules/fetch.js';
import * as BrowserData from './data_modules/browserData.js';
import * as ForumData from './data_modules/forumData.js';

const modules = [Processor, Actions, Fetch, BrowserData, ForumData];

// Aggregate all functions from sub-modules into this single object.
export const PhoneSim_DataHandler = {};

// Combine functions from each module into the main handler object.
modules.forEach(module => {
    Object.keys(module).forEach(key => {
        // We only add functions, and avoid overwriting the init function we'll define below.
        if (typeof module[key] === 'function' && key !== 'init') {
            PhoneSim_DataHandler[key] = module[key];
        }
    });
});


/**
 * Initializes all sub-modules with necessary dependencies, including the UI handler.
 * This is called from the main script after both UI and Data handlers are fully constructed.
 * @param {object} dependencies - Core APIs (SillyTavern, jQuery, etc.).
 * @param {object} uiHandler - The fully constructed UI handler object.
 */
PhoneSim_DataHandler.init = (dependencies, uiHandler) => {
    modules.forEach(module => {
        if (typeof module.init === 'function') {
            // Pass dependencies, the UI handler, and a reference to the complete Data handler itself.
            module.init(dependencies, uiHandler, PhoneSim_DataHandler);
        }
    });
};