import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Parser } from '../parser.js';

let SillyTavern_Main_API, SillyTavern_Context_API, TavernHelper_API;
let parentWin;
let UI, DataHandler;

// Cache the current lorebook name to avoid repeated async calls within a single operation.
let currentCharacterLorebookName = null;
let currentCharacterName = null;

export function init(deps, uiHandler, dataHandler) {
    SillyTavern_Main_API = deps.st;
    SillyTavern_Context_API = deps.st_context;
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
    DataHandler = dataHandler;
}

export function clearLorebookCache() {
    currentCharacterLorebookName = null;
    currentCharacterName = null;
}

export async function getOrCreatePhoneLorebook() {
    // ... 此函数保持不变，用于获取或创建专用的世界书 ...
    const characterName = SillyTavern_Main_API.getContext().name2;
    if (currentCharacterName === characterName && currentCharacterLorebookName) {
        return currentCharacterLorebookName;
    }
    currentCharacterName = characterName;
    const lorebookName = `${PhoneSim_Config.LOREBOOK_PREFIX}${characterName}`;
    const allLorebooks = await TavernHelper_API.getWorldbookNames();
    if (!allLorebooks.includes(lorebookName)) {
        await TavernHelper_API.createOrReplaceWorldbook(lorebookName, PhoneSim_Config.INITIAL_LOREBOOK_ENTRIES);
    }
    const charLorebooks = await TavernHelper_API.getCharWorldbookNames('current');
    if (charLorebooks && !charLorebooks.additional.includes(lorebookName)) {
        const updatedAdditional = [...charLorebooks.additional, lorebookName];
        await TavernHelper_API.rebindCharWorldbooks('current', {
            primary: charLorebooks.primary,
            additional: updatedAdditional
        });
    }
    currentCharacterLorebookName = lorebookName;
    return lorebookName;
}


export async function _updateWorldbook(dbName, updaterFn) {
    // ... 此函数保持不变，是更新世界书的核心底层函数 ...
    const lorebookName = await getOrCreatePhoneLorebook();
    if (!lorebookName) return false;
    try {
        let entries = await TavernHelper_API.getWorldbook(lorebookName);
        if (!Array.isArray(entries)) entries = [];
        let dbIndex = entries.findIndex(e => e.name === dbName);
        const isArrayDb = [PhoneSim_Config.WORLD_EMAIL_DB_NAME, PhoneSim_Config.WORLD_CALL_LOG_DB_NAME].includes(dbName);
        const defaultContent = isArrayDb ? '[]' : '{}';
        if (dbIndex === -1) {
            const newEntry = { name: dbName, content: defaultContent, enabled: false, comment: `Managed by Phone Simulator Plugin. Do not edit manually.` };
            entries.push(newEntry);
            dbIndex = entries.length - 1;
        }
        let dbData;
        try {
            dbData = JSON.parse(entries[dbIndex].content || defaultContent);
        } catch(e) {
            console.warn(`[Phone Sim] Could not parse content for ${dbName}, resetting.`, e);
            dbData = JSON.parse(defaultContent);
        }
        entries[dbIndex].content = JSON.stringify(updaterFn(dbData), null, 2);
        await TavernHelper_API.replaceWorldbook(lorebookName, entries);
        return true;
    } catch (er) {
        console.error(`[Phone Sim] Error updating worldbook (${dbName}):`, er);
        return false;
    }
}

// ... deleteContact, addContactManually, logCallRecord 等函数保持不变 ...

// [修改] 升级 stagePlayerAction 函数
export function stagePlayerAction(action) {
    PhoneSim_State.stagedPlayerActions.push(action);
    // [关键] 当有任何操作时，我们都通知UI模块去更新界面，theaterUpdated标志确保了剧场App也能被正确刷新
    UI.rerenderCurrentView({ momentsUpdated: true, forumUpdated: true, liveCenterUpdated: true, chatUpdated: true, theaterUpdated: true });
    UI.updateCommitButton();
}

// ... stagePlayerMessage, stageFriendRequestResponse 等函数保持不变 ...

// [修改] 升级 commitStagedActions 函数
export async function commitStagedActions() {
    const messagesToCommit = [...PhoneSim_State.stagedPlayerMessages];
    const playerActionsToCommit = [...PhoneSim_State.stagedPlayerActions];
    if (messagesToCommit.length === 0 && playerActionsToCommit.length === 0) return;

    PhoneSim_State.stagedPlayerMessages = [];
    PhoneSim_State.stagedPlayerActions = [];
    UI.updateCommitButton();

    let textPrompt = `(系统提示：洛洛刚刚在手机上进行了如下操作：\n`;
    let hasActionsForAI = false;
    const finalMessagesToPersist = []; // 用于稍后更新世界书的消息

    // 1. 处理暂存的消息
    if (messagesToCommit.length > 0) {
        // ... 这部分逻辑保持不变，用于生成发送消息的AI提示 ...
    }

    // 2. 处理暂存的玩家动作
    playerActionsToCommit.forEach(action => {
        // ... 这部分逻辑保持不变，用于过滤非玩家操作的删除和编辑 ...

        hasActionsForAI = true;
        switch(action.type) {
            // ... case 'manual_add_friend', 'create_group', 'new_moment' 等保持不变 ...

            // [新增] 为欲色剧场App的操作生成AI提示
            case 'theater_accept_announcement':
                textPrompt += `- 在“欲色剧场”中，接取了拍摄通告：“${action.title}”。\n`;
                break;
            case 'theater_accept_customization':
                textPrompt += `- 在“欲色剧场”中，接受了粉丝“${action.fanId}”的“${action.typeName}”类型定制。\n`;
                break;
            case 'theater_reject_item':
                textPrompt += `- 在“欲色剧场”中，拒绝或忽略了项目：“${action.title}”。\n`;
                break;
        }
    });

    textPrompt += `请根据以上操作，继续推演角色的反应和接下来的剧情。)`;

    // 3. 将暂存的消息和动作永久写入世界书

    // a) 更新主数据库（聊天记录、朋友圈等）
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        // ... 这部分逻辑保持不变，用于写入消息、删除/编辑朋友圈等 ...
        return dbData;
    });

    // b) 更新论坛数据库
    const forumActions = playerActionsToCommit.filter(a => a.type.includes('forum'));
    if (forumActions.length > 0) {
        await _updateWorldbook(PhoneSim_Config.WORLD_FORUM_DATABASE, forumDb => {
            // ... 这部分逻辑保持不变，用于写入新帖子、回复等 ...
            return forumDb;
        });
    }

    // [新增] c) 更新欲色剧场数据库
    const theaterActions = playerActionsToCommit.filter(a => a.type.includes('theater'));
    if (theaterActions.length > 0) {
        await _updateWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE, theaterDb => {
            theaterActions.forEach(action => {
                switch(action.type) {
                    case 'theater_accept_announcement':
                    case 'theater_reject_item': // 接受和拒绝都从列表中移除
                        if (theaterDb.announcements) {
                            theaterDb.announcements = theaterDb.announcements.filter(item => item.id !== action.id);
                        }
                        break;
                    case 'theater_accept_customization':
                        if (theaterDb.customizations) {
                            theaterDb.customizations = theaterDb.customizations.filter(item => item.id !== action.id);
                        }
                        break;
                }
            });
            return theaterDb;
        });
    }


    // 4. 如果有需要通知AI的操作，则发送最终生成的提示
    if (hasActionsForAI) {
        try {
            SillyTavern_Context_API.generate();
        } catch (error) {
            console.error('[Phone Sim] Failed to commit actions:', error);
        }
    }

    // 5. 最后，从世界书重新加载所有数据并刷新UI
    await DataHandler.fetchAllData();
    UI.rerenderCurrentView({ forceRerender: true });
}


// ... saveCustomization, resetAllData, saveContactAvatar, etc. 保持不变 ...

// [修改] 升级数据清理函数
export async function clearAllTheaterData() {
    await _updateWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE, () => ({
        // 当清理时，我们返回一个空的、结构完整的数据对象
        announcements: [],
        customizations: [],
        theater_list: {
            all_films: [],
            hot: [],
            new: [],
            recommended: [],
            paid: []
        },
        shop: []
    }));
}

