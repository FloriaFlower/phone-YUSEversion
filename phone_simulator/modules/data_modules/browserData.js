import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let TavernHelper_API;
let UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    TavernHelper_API = deps.th;
    UI = uiHandler;
    DataHandler = dataHandler;
}

async function addHistoryEntry(url, title) {
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        if (!browserDb.history) browserDb.history = [];
        if (!browserDb.pages) browserDb.pages = {};

        // If the page doesn't have a full entry yet (e.g., from a bookmark click), create a minimal one.
        if (!browserDb.pages[url]) {
             browserDb.pages[url] = {
                url, title, type: 'page', content: [],
                timestamp: new Date().toISOString(), sourceMsgId: 'manual_nav'
            };
        }
        
        // Truncate "forward" history
        if (PhoneSim_State.browserHistoryIndex < browserDb.history.length - 1) {
            browserDb.history = browserDb.history.slice(0, PhoneSim_State.browserHistoryIndex + 1);
        }

        // Add to history
        if (browserDb.history[browserDb.history.length - 1] !== url) {
            browserDb.history.push(url);
        }

        return browserDb;
    });
}

export function isBookmarked(url) {
    return PhoneSim_State.browserBookmarks.some(bookmark => bookmark.url === url);
}

export async function toggleBookmark(url, title) {
     await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        if (!browserDb.bookmarks) browserDb.bookmarks = [];
        const bookmarkIndex = browserDb.bookmarks.findIndex(b => b.url === url);

        if (bookmarkIndex > -1) {
            browserDb.bookmarks.splice(bookmarkIndex, 1);
        } else {
            browserDb.bookmarks.push({ url, title, timestamp: new Date().toISOString() });
        }
        return browserDb;
    });
    await DataHandler.fetchAllBrowserData();
    UI.updateNavControls();
}

export async function deleteHistoryItem(url) {
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        if (browserDb.history) {
            browserDb.history = browserDb.history.filter(hUrl => hUrl !== url);
        }
        // Also remove the page content associated with it if it's just a placeholder
        if (browserDb.pages && browserDb.pages[url] && browserDb.pages[url].sourceMsgId === 'manual_nav') {
             delete browserDb.pages[url];
        }
        return browserDb;
    });
}

export async function deleteBookmarkItem(url) {
     await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        if(browserDb.bookmarks) {
            browserDb.bookmarks = browserDb.bookmarks.filter(b => b.url !== url);
        }
        return browserDb;
    });
}


export async function navigateTo(entry) {
    UI.setLoading(true);
    if (typeof entry === 'string') { // Search term
        PhoneSim_State.pendingBrowserAction = { type: 'search', value: entry };
        TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}在浏览器中搜索：“${entry}”)`);
    } else if (typeof entry === 'object' && entry.url) { // URL object from a search result, history or bookmark
        if (!PhoneSim_State.browserData[entry.url] || !PhoneSim_State.browserData[entry.url].content || PhoneSim_State.browserData[entry.url].content.length === 0) {
            // Page content doesn't exist, request it from AI
            PhoneSim_State.pendingBrowserAction = { type: 'pageload', url: entry.url, title: entry.title };
            TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}点击了标题为“${entry.title}”的链接，请为我生成对应的网页内容。)`);
        } else {
            // Page exists, just add history entry and render from state
            await addHistoryEntry(entry.url, entry.title);
            await DataHandler.fetchAllBrowserData(); // Resync state
            PhoneSim_State.browserHistoryIndex = PhoneSim_State.browserHistory.length - 1;
            UI.renderBrowserState();
            UI.setLoading(false);
        }
    }
}

export async function saveSearchResults(searchTerm, results, msgId) {
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        // Save the search result list to the directory
        browserDb.directory = {
            title: `搜索: ${searchTerm}`,
            content: results,
            timestamp: new Date().toISOString(),
            sourceMsgId: msgId
        };
        
        // Also create stubs for each page in the pages database if they don't exist
        if (!browserDb.pages) {
            browserDb.pages = {};
        }
        results.forEach(result => {
            // Only create a stub if the page doesn't exist at all. Don't overwrite existing pages.
            if (!browserDb.pages[result.url]) {
                browserDb.pages[result.url] = {
                    url: result.url,
                    title: result.title,
                    type: 'page', // Consistent type
                    content: [], // Empty content signifies it needs to be fetched
                    timestamp: new Date().toISOString(),
                    sourceMsgId: msgId // Associate with the search result generation
                };
            }
        });

        return browserDb;
    });
    await DataHandler.fetchAllBrowserData();
    UI.renderBrowserState();
    UI.setLoading(false);
}

export async function savePageContent(pageData, msgId) {
    const { url, title, content } = pageData;
    
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        if (!browserDb.pages) browserDb.pages = {};
        if (!browserDb.history) browserDb.history = [];
        
        // Save page content
        browserDb.pages[url] = {
            url, title, type: 'page', content,
            timestamp: new Date().toISOString(), sourceMsgId: msgId
        };
        
        // Truncate forward history if navigating from a back-state
        if (PhoneSim_State.browserHistoryIndex < browserDb.history.length - 1) {
            browserDb.history = browserDb.history.slice(0, PhoneSim_State.browserHistoryIndex + 1);
        }

        // Add to history if it's a new navigation
        if (browserDb.history[browserDb.history.length - 1] !== url) {
            browserDb.history.push(url);
        }
        
        return browserDb;
    });

    await DataHandler.fetchAllBrowserData();
    PhoneSim_State.browserHistoryIndex = PhoneSim_State.browserHistory.length - 1;
    UI.renderBrowserState();
    UI.setLoading(false);
}


export function goBack() {
    if (PhoneSim_State.browserHistoryIndex > 0) {
        PhoneSim_State.browserHistoryIndex--;
        UI.renderBrowserState();
    }
}

export function goForward() {
    if (PhoneSim_State.browserHistoryIndex < PhoneSim_State.browserHistory.length - 1) {
        PhoneSim_State.browserHistoryIndex++;
        UI.renderBrowserState();
    }
}

export async function refresh() {
    if (PhoneSim_State.browserHistoryIndex > -1) {
       const currentUrl = PhoneSim_State.browserHistory[PhoneSim_State.browserHistoryIndex];
       const currentData = PhoneSim_State.browserData[currentUrl];
       if (!currentData) return;
        await navigateTo({ url: currentData.url, title: currentData.title });
    }
}

export async function clearHistory() {
     await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        browserDb.history = [];
        // Optionally, also clear pages that are not bookmarked? For now, just history.
        return browserDb;
     });
     await DataHandler.fetchAllBrowserData();
     PhoneSim_State.browserHistoryIndex = -1;
     UI.renderBrowserState();
}

export async function clearBookmarks() {
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => {
        browserDb.bookmarks = [];
        return browserDb;
    });
    await DataHandler.fetchAllBrowserData();
}