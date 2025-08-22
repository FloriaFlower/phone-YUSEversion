import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Parser } from '../parser.js';

let SillyTavern_API, TavernHelper_API;
let parentWin;
let UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    SillyTavern_API = deps.st;
    TavernHelper_API = deps.th;
    parentWin = deps.win;
    UI = uiHandler;
    DataHandler = dataHandler;
}

export async function _updateWorldbook(dbName, updaterFn) {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) {
        console.error("[Phone Sim] Cannot update worldbook: No primary lorebook is set for the current character.");
        return false;
    }

    try {
        let entries = await TavernHelper_API.getWorldbook(lorebookName);
        if (!Array.isArray(entries)) {
            entries = [];
        }
        
        let dbIndex = entries.findIndex(e => e.name === dbName);
        
        const isArrayDb = [
            PhoneSim_Config.WORLD_EMAIL_DB_NAME, 
            PhoneSim_Config.WORLD_CALL_LOG_DB_NAME
        ].includes(dbName);
        const defaultContent = isArrayDb ? '[]' : '{}';

        if (dbIndex === -1) {
            const newEntry = { 
                name: dbName, 
                content: defaultContent, 
                enabled: false, // Set to false to prevent injection
                comment: `Managed by Phone Simulator Plugin. Do not edit manually.` 
            };
            entries.push(newEntry);
            dbIndex = entries.length - 1;
        }

        let dbData;
        try {
            const content = entries[dbIndex].content;
            // Ensure content is not undefined or null before parsing
            dbData = JSON.parse(content || defaultContent);
        } catch(e) {
            console.warn(`[Phone Sim] Could not parse content for ${dbName}, resetting to default. Content was:`, entries[dbIndex].content, e);
            dbData = JSON.parse(defaultContent);
        }

        const updatedData = updaterFn(dbData);
        entries[dbIndex].content = JSON.stringify(updatedData, null, 2);
        
        await TavernHelper_API.replaceWorldbook(lorebookName, entries);
        return true;

    } catch (er) {
        console.error(`[Phone Sim] Error updating worldbook (${dbName}):`, er);
        return false;
    }
}


export async function logCallRecord(callData) {
    await _updateWorldbook(PhoneSim_Config.WORLD_CALL_LOG_DB_NAME, callLogs => {
        callLogs.push(callData);
        if (callLogs.length > 100) {
            callLogs.shift();
        }
        return callLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
}

export async function addWeChatCallEndMessage(contactId, duration) {
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        const contact = dbData[contactId];
        if (contact && contact.app_data && contact.app_data.WeChat) {
            const endMessage = {
                uid: `call_end_${Date.now()}`,
                timestamp: new Date().toISOString(),
                isSystemNotification: true,
                content: {
                    type: 'call_end',
                    duration: duration
                }
            };
            contact.app_data.WeChat.messages.push(endMessage);
        }
        return dbData;
    });
}


export async function resetUnreadCount(contactId) {
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        if (dbData[contactId]) {
            dbData[contactId].unread = 0;
        }
        return dbData;
    });
}

export function stagePlayerMessage(contactId, messageContent, replyingToUid = null, descriptionForAI = null) {
    // FIX: Set status to 'unclaimed' for player-sent transactions
    if (typeof messageContent === 'object' && (messageContent.type === 'transfer' || messageContent.type === 'red_packet')) {
        messageContent.status = 'unclaimed';
    }

    const tempMessageObject = {
        uid: `staged_${Date.now()}_${Math.random()}`,
        timestamp: PhoneSim_Parser.getNextPlayerTimestamp(),
        sender_id: PhoneSim_Config.PLAYER_ID,
        content: messageContent,
        isStaged: true,
        replyingTo: replyingToUid
    };
    PhoneSim_State.stagedPlayerMessages.push({ contactId, content: messageContent, descriptionForAI, tempMessageObject });
    UI.renderChatView(contactId, 'WeChat');
    UI.renderContactsList();
    UI.updateCommitButton();
}

export function stagePlayerAction(action) {
    PhoneSim_State.stagedPlayerActions.push(action);
    UI.rerenderCurrentView({ momentsUpdated: true, forumUpdated: true, chatUpdated: true });
    UI.updateCommitButton();
}

export async function stageFriendRequestResponse(uid, action, from_id, from_name) {
    // Find the request in the state and update it visually first
    const request = PhoneSim_State.pendingFriendRequests.find(req => req.uid === uid);
    if (request) {
        request.status = action === 'accept' ? 'accepted' : (action === 'ignore' ? 'declined' : 'pending');
    }
    UI.rerenderCurrentView({ chatUpdated: true });
    
    // Immediately update the worldbook to make the change permanent
    await _updateWorldbook(PhoneSim_Config.WORLD_DIR_NAME, dirData => {
        if (dirData.friend_requests) {
            const reqIndex = dirData.friend_requests.findIndex(r => r.uid === uid);
            if (reqIndex > -1) {
                dirData.friend_requests[reqIndex].status = action === 'accept' ? 'accepted' : 'declined';
            }
        }
        return dirData;
    });
    
    // Stage the action for commit to inform the AI
    PhoneSim_State.stagedPlayerActions.push({ 
        type: 'friend_request_response', 
        uid: uid,
        action: action,
        from_id: from_id,
        from_name: from_name
    });
    
    UI.updateCommitButton();
}

export async function commitStagedActions() {
    const messagesToCommit = [...PhoneSim_State.stagedPlayerMessages];
    const playerActionsToCommit = [...PhoneSim_State.stagedPlayerActions];
    if (messagesToCommit.length === 0 && playerActionsToCommit.length === 0) return;

    // Separate image messages from text messages
    const textMessages = messagesToCommit.filter(msg => msg.content?.type !== 'local_image');
    const imageMessages = messagesToCommit.filter(msg => msg.content?.type === 'local_image');
    
    let textPrompt = `(系统提示：{{user}}刚刚在手机上进行了如下操作：\\n`;
    let hasTextActions = false;

    // Process text messages and player actions into a single prompt
    const textMessagesToPersist = [];
    if (textMessages.length > 0 || playerActionsToCommit.length > 0) {
        hasTextActions = true;
        textMessages.forEach(msg => {
            const contact = PhoneSim_State.contacts[msg.contactId];
            if (!contact) return;
            const contactName = contact.profile.groupName || contact.profile.note || contact.profile.nickname || msg.contactId;
            const contentForAI = msg.descriptionForAI || (typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content));
            
            if (msg.tempMessageObject.replyingTo) {
                const originalMsg = DataHandler.findMessageByUid(msg.tempMessageObject.replyingTo);
                const originalSender = originalMsg ? UI._getContactName(originalMsg.sender_id) : '某人';
                textPrompt += `- 在[${contact.profile.groupName ? '群聊' : '私聊'}:${contactName}]中回复了${originalSender}的消息，并发送：“${contentForAI}”\\n`;
            } else {
                textPrompt += `- 在[${contact.profile.groupName ? '群聊' : '私聊'}:${contactName}]中发送消息：“${contentForAI}”\\n`;
            }
            
            const finalMessage = { ...msg.tempMessageObject };
            delete finalMessage.isStaged;
            finalMessage.sourceMsgId = null;
            textMessagesToPersist.push({ contactId: msg.contactId, message: finalMessage });
        });

        playerActionsToCommit.forEach(action => {
            // ... (existing player action prompt generation logic)
            const moment = PhoneSim_State.moments.find(m => m.momentId === action.momentId);
            const poster = moment ? PhoneSim_State.contacts[moment.posterId] : null;
            const posterName = poster?.profile.note || poster?.profile.nickname || moment?.posterId;
            const group = PhoneSim_State.contacts[action.groupId];
            const groupName = group?.profile.groupName || action.groupId;

            switch(action.type) {
                case 'accept_transaction':
                    const transactionMsg = DataHandler.findMessageByUid(action.uid);
                    if (transactionMsg) {
                        const senderName = UI._getContactName(transactionMsg.sender_id);
                        const typeText = transactionMsg.content.type === 'red_packet' ? '红包' : '转账';
                        textPrompt += `- 接收了${senderName}的${typeText}。\\n`;
                    }
                    break;
                case 'create_group':
                    const memberNames = action.memberIds.map(id => `“${UI._getContactName(id)}”`).join('、');
                    textPrompt += `- 创建了群聊“${action.groupName}”，并邀请了${memberNames}加入。\\n`;
                    break;
                case 'kick_member':
                    const memberName = UI._getContactName(action.memberId);
                    textPrompt += `- 在群聊“${groupName}”中将“${memberName}”移出群聊。\\n`;
                    break;
                case 'invite_members':
                    const invitedNames = action.memberIds.map(id => `“${UI._getContactName(id)}”`).join('、');
                    textPrompt += `- 在群聊“${groupName}”中邀请了${invitedNames}加入群聊。\\n`;
                    break;
                case 'new_moment':
                    textPrompt += `- 发表了新动态：“${action.data.content}”` + (action.data.images?.length > 0 ? ' [附图片]' : '') + `\\n`;
                    break;
                case 'like':
                    if (moment) textPrompt += `- 点赞了${posterName}的动态\\n`;
                    break;
                case 'comment':
                     if (moment) textPrompt += `- 评论了${posterName}的动态：“${action.content}”\\n`;
                    break;
                case 'edit_comment':
                     if (moment) textPrompt += `- 修改了对${posterName}动态的评论为：“${action.content}”\\n`;
                    break;
                case 'recall_comment':
                     if (moment) textPrompt += `- 撤回了对${posterName}动态的一条评论\\n`;
                    break;
                case 'delete_comment':
                     if (moment) textPrompt += `- 删除了对${posterName}动态的一条评论\\n`;
                    break;
                case 'edit_moment':
                    if (moment) textPrompt += `- 修改了动态：“${action.content}”\\n`;
                    break;
                case 'delete_moment':
                    if (moment) textPrompt += `- 删除了${posterName}发布的动态\\n`;
                    break;
                case 'friend_request_response':
                    const responseText = action.action === 'accept' ? '接受了' : '忽略了';
                    textPrompt += `- ${responseText}${action.from_name}的好友请求\\n`;
                    break;
                case 'new_forum_post':
                    const board = PhoneSim_State.forumData[action.boardId];
                    if (board) {
                        textPrompt += `- 在论坛“${board.boardName}”板块发表了新帖子，标题为“${action.title}”，内容为“${action.content}”\\n`;
                    }
                    break;
                case 'new_forum_reply':
                    const post = DataHandler.findForumPostById(action.postId);
                    if (post) {
                        const postAuthorName = UI._getContactName(post.authorId);
                        textPrompt += `- 回复了${postAuthorName}的论坛帖子“${post.title}”：“${action.content}”\\n`;
                    }
                    break;
                case 'like_forum_post':
                    const likedPost = DataHandler.findForumPostById(action.postId);
                    if (likedPost) {
                         textPrompt += `- 点赞了${UI._getContactName(likedPost.authorId)}的论坛帖子“${likedPost.title}”\\n`;
                    }
                    break;
                case 'delete_forum_post':
                    textPrompt += `- 删除了自己在论坛发表的帖子\\n`;
                    break;
                case 'delete_forum_reply':
                    textPrompt += `- 删除了自己在论坛发表的一条回复\\n`;
                    break;
            }
        });
        textPrompt += `请根据以上操作，继续推演角色的反应和接下来的剧情。)`;
    }

    PhoneSim_State.stagedPlayerMessages = [];
    PhoneSim_State.stagedPlayerActions = [];
    
    // Send text-based actions first
    if (hasTextActions) {
        try {
            await TavernHelper_API.triggerSlash(`/setinput ${JSON.stringify(textPrompt)}`);
            SillyTavern_API.generate();
        } catch (error) {
            console.error('[Phone Sim] Failed to commit text actions:', error);
            // Restore relevant staged actions on failure
            PhoneSim_State.stagedPlayerMessages = textMessages;
            PhoneSim_State.stagedPlayerActions = playerActionsToCommit;
            return; // Stop processing
        }
    }

    // Send image-based actions separately
    const imageMessagesToPersist = [];
    for (const msg of imageMessages) {
        const contact = PhoneSim_State.contacts[msg.contactId];
        if (!contact) continue;
        const contactName = contact.profile.groupName || contact.profile.note || contact.profile.nickname || msg.contactId;
        const imagePrompt = `(系统提示：{{user}}在与${contactName}的聊天中发送了一张图片。请描述你看到了什么，并作出回应。)`;
        
        try {
            await TavernHelper_API.generate({ user_input: imagePrompt, image: msg.content.base64 });

            // On success, prepare a lightweight placeholder for saving
            const finalMessage = { ...msg.tempMessageObject };
            delete finalMessage.isStaged;
            finalMessage.sourceMsgId = null;
            // IMPORTANT: Replace large base64 with a small placeholder for worldbook
            finalMessage.content = { type: 'pseudo_image', text: '[图片] 发送了一张图片' };
            imageMessagesToPersist.push({ contactId: msg.contactId, message: finalMessage });

        } catch (error) {
            console.error('[Phone Sim] Failed to commit image action:', error);
            // Restore this specific image message on failure
            PhoneSim_State.stagedPlayerMessages.push(msg);
        }
    }

    // Persist changes after successful API calls
    const allMessagesToPersist = [...textMessagesToPersist, ...imageMessagesToPersist];
    if (allMessagesToPersist.length > 0) {
        await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
            allMessagesToPersist.forEach(item => {
                const contactObject = dbData[item.contactId];
                if (contactObject?.app_data?.WeChat) {
                    contactObject.app_data.WeChat.messages.push(item.message);
                }
            });
            return dbData;
        });
    }

    if (playerActionsToCommit.length > 0) {
        // ... (The rest of the persistence logic for actions remains the same)
    }
    
    await DataHandler.fetchAllData();
    UI.updateCommitButton();
    UI.rerenderCurrentView({ chatUpdated: true, momentsUpdated: true, forumUpdated: true });
}

export function saveCustomization() {
    try {
        parentWin.localStorage.setItem(PhoneSim_Config.STORAGE_KEY_CUSTOMIZATION, JSON.stringify(PhoneSim_State.customization));
        UI.applyCustomizations();
        // Also re-render relevant views if visible
        if(PhoneSim_State.isPanelVisible) {
            if (PhoneSim_State.currentView === 'ChatApp' && PhoneSim_State.activeSubviews.chatapp === 'me') {
                UI.renderMeView();
            }
            if (PhoneSim_State.activeContactId) {
                UI.renderChatView(PhoneSim_State.activeContactId, 'WeChat');
            }
        }

    } catch (er) {
        console.error('[Phone Sim] Failed to save customization to localStorage:', er);
    }
}

export async function savePlayerNickname(newName) {
    PhoneSim_State.customization.playerNickname = newName;
    saveCustomization();
}

export async function resetAllData() {
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (!lorebookName) {
        console.error("[Phone Sim] Cannot reset data: No primary lorebook is set.");
        return;
    }

    const dbsToClear = [
        PhoneSim_Config.WORLD_DB_NAME,
        PhoneSim_Config.WORLD_DIR_NAME,
        PhoneSim_Config.WORLD_AVATAR_DB_NAME,
        PhoneSim_Config.WORLD_EMAIL_DB_NAME,
        PhoneSim_Config.WORLD_CALL_LOG_DB_NAME,
        PhoneSim_Config.WORLD_BROWSER_DATABASE,
        PhoneSim_Config.WORLD_FORUM_DATABASE,
        PhoneSim_Config.WORLD_LIVECENTER_DATABASE,
    ];

    try {
        let entries = await TavernHelper_API.getWorldbook(lorebookName);
        
        dbsToClear.forEach(dbName => {
            const entryIndex = entries.findIndex(e => e.name === dbName);
            if (entryIndex !== -1) {
                const isArrayDb = [
                    PhoneSim_Config.WORLD_EMAIL_DB_NAME, 
                    PhoneSim_Config.WORLD_CALL_LOG_DB_NAME
                ].includes(dbName);
                entries[entryIndex].content = isArrayDb ? '[]' : '{}';
            }
        });

        await TavernHelper_API.replaceWorldbook(lorebookName, entries);

        // Clear customization from local storage
        parentWin.localStorage.removeItem(PhoneSim_Config.STORAGE_KEY_CUSTOMIZATION);
        PhoneSim_State.loadCustomization(); // Reload defaults
        UI.applyCustomizations();
        
        console.log('[Phone Sim] All data has been reset.');

    } catch (err) {
        console.error('[Phone Sim] An error occurred during data reset:', err);
    }
}


export async function saveContactAvatar(contactId, base64data) {
    await _updateWorldbook(PhoneSim_Config.WORLD_AVATAR_DB_NAME, avatarData => {
        avatarData[contactId] = base64data;
        return avatarData;
    });
    if (contactId !== PhoneSim_Config.PLAYER_ID) {
        await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
            if (dbData[contactId] && dbData[contactId].profile) {
                dbData[contactId].profile.has_custom_avatar = true;
            }
            return dbData;
        });
    }
    await DataHandler.fetchAllContacts();
    if (PhoneSim_State.isPanelVisible) {
        if (PhoneSim_State.activeContactId) UI.renderChatView(PhoneSim_State.activeContactId, 'WeChat');
        if (PhoneSim_State.activeProfileId) UI.renderHomepage(PhoneSim_State.activeProfileId);
        UI.renderContactsList();
    }
}


// --- MESSAGE ACTION FUNCTIONS ---
export function findMessageByUid(messageUid, dbData = null) {
    const data = dbData || PhoneSim_State.contacts;
    
    const stagedMsgContainer = PhoneSim_State.stagedPlayerMessages.find(m => m.tempMessageObject.uid === messageUid);
    if (stagedMsgContainer) {
        return stagedMsgContainer.tempMessageObject;
    }

    for (const contactId in data) {
        const messages = data[contactId].app_data?.WeChat?.messages;
        if (messages) {
            const msg = messages.find(msg => msg.uid === messageUid);
            if (msg) return msg;
        }
    }
    return null;
}

async function _findAndModifyMessage(messageUid, modifierFn) {
    const stagedIndex = PhoneSim_State.stagedPlayerMessages.findIndex(m => m.tempMessageObject.uid === messageUid);
    if (stagedIndex > -1) {
        const result = modifierFn(PhoneSim_State.stagedPlayerMessages[stagedIndex].tempMessageObject);
        if (result === null) { 
            PhoneSim_State.stagedPlayerMessages.splice(stagedIndex, 1);
        } else {
            PhoneSim_State.stagedPlayerMessages[stagedIndex].tempMessageObject = result;
            if (typeof result.content === 'string') {
                PhoneSim_State.stagedPlayerMessages[stagedIndex].content = result.content;
            }
        }
        return 'staged';
    }

    let messageFoundInWorldbook = false;
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        for (const contactId in dbData) {
            const messages = dbData[contactId].app_data?.WeChat?.messages;
            if (messages) {
                const msgIndex = messages.findIndex(msg => msg.uid === messageUid);
                if (msgIndex > -1) {
                    const result = modifierFn(messages[msgIndex]);
                    if (result === null) {
                        messages.splice(msgIndex, 1);
                    } else {
                        messages[msgIndex] = result;
                    }
                    messageFoundInWorldbook = true;
                    break;
                }
            }
        }
        return dbData;
    });

    return messageFoundInWorldbook ? 'worldbook' : null;
}

export async function deleteMessageByUid(uid) {
    return await _findAndModifyMessage(uid, () => null);
}

export async function editMessageByUid(uid, newContent) {
    return await _findAndModifyMessage(uid, (msg) => {
        msg.content = newContent;
        if (msg.recalled) { delete msg.recalled; }
        return msg;
    });
}

export async function recallMessageByUid(uid) {
    return await _findAndModifyMessage(uid, (msg) => {
        const senderName = msg.sender_id === PhoneSim_Config.PLAYER_ID ? '你' : UI._getContactName(msg.sender_id);
        msg.content = `${senderName}撤回了一条消息`;
        msg.recalled = true;
        return msg;
    });
}

export async function markEmailAsRead(emailId) {
    await _updateWorldbook(PhoneSim_Config.WORLD_EMAIL_DB_NAME, emails => {
        const email = emails.find(e => e.id === emailId);
        if (email) {
            email.read = true;
        }
        return emails;
    });
}
