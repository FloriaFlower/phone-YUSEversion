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

export function stagePlayerMessage(contactId, messageContent) {
    const tempMessageObject = {
        uid: `staged_${Date.now()}_${Math.random()}`,
        timestamp: PhoneSim_Parser.getNextPlayerTimestamp(),
        sender_id: PhoneSim_Config.PLAYER_ID,
        content: messageContent,
        isStaged: true
    };
    PhoneSim_State.stagedPlayerMessages.push({ contactId, content: messageContent, tempMessageObject });
    UI.renderChatView(contactId, 'WeChat');
    UI.renderContactsList();
    UI.updateCommitButton();
}

export function stagePlayerAction(action) {
    PhoneSim_State.stagedPlayerActions.push(action);
    UI.rerenderCurrentView({ momentsUpdated: true, forumUpdated: true });
    UI.updateCommitButton();
}

export async function stageFriendRequestResponse(uid, action, from_id, from_name) {
    PhoneSim_State.stagedPlayerActions.push({ 
        type: 'friend_request_response', 
        uid: uid,
        action: action,
        from_id: from_id,
        from_name: from_name
    });
    
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        let messageFound = false;
        for (const cId in dbData) {
            const messages = dbData[cId]?.app_data?.WeChat?.messages;
            if (messages) {
                const msg = messages.find(msg => msg.uid === uid);
                if (msg && msg.requestData) {
                    msg.requestData.status = action === 'accept' ? 'accepted' : 'declined';
                    messageFound = true;
                    break;
                }
            }
        }
        return dbData;
    });

    await DataHandler.fetchAllData();
    UI.rerenderCurrentView({ chatUpdated: true });
    UI.updateCommitButton();
}

export async function commitStagedActions() {
    const messagesToCommit = PhoneSim_State.stagedPlayerMessages;
    const playerActionsToCommit = PhoneSim_State.stagedPlayerActions;
    if (messagesToCommit.length === 0 && playerActionsToCommit.length === 0) return;

    let prompt = `(系统提示：{{user}}刚刚在手机上进行了如下操作：\\n`;
    messagesToCommit.forEach(msg => {
        const contact = PhoneSim_State.contacts[msg.contactId];
        if (!contact) return;
        const contactName = contact.profile.groupName || contact.profile.note || contact.profile.nickname || msg.contactId;
        prompt += `- 在[${contact.profile.groupName ? '群聊' : '私聊'}:${contactName}]中发送消息：“${msg.content}”\\n`;
    });
    playerActionsToCommit.forEach(action => {
        const moment = PhoneSim_State.moments.find(m => m.momentId === action.momentId);
        const poster = moment ? PhoneSim_State.contacts[moment.posterId] : null;
        const posterName = poster?.profile.note || poster?.profile.nickname || moment?.posterId;
        const group = PhoneSim_State.contacts[action.groupId];
        const groupName = group?.profile.groupName || action.groupId;

        switch(action.type) {
            case 'kick_member':
                const memberName = UI._getContactName(action.memberId);
                prompt += `- 在群聊“${groupName}”中将“${memberName}”移出群聊。\\n`;
                break;
            case 'invite_members':
                const invitedNames = action.memberIds.map(id => UI._getContactName(id)).join('、');
                prompt += `- 在群聊“${groupName}”中邀请了“${invitedNames}”加入群聊。\\n`;
                break;
            case 'new_moment':
                prompt += `- 发表了新动态：“${action.data.content}”` + (action.data.images?.length > 0 ? ' [附图片]' : '') + `\\n`;
                break;
            case 'like':
                if (moment) prompt += `- 点赞了${posterName}的动态\\n`;
                break;
            case 'comment':
                 if (moment) prompt += `- 评论了${posterName}的动态：“${action.content}”\\n`;
                break;
            case 'edit_comment':
                 if (moment) prompt += `- 修改了对${posterName}动态的评论为：“${action.content}”\\n`;
                break;
            case 'recall_comment':
                 if (moment) prompt += `- 撤回了对${posterName}动态的一条评论\\n`;
                break;
            case 'delete_comment':
                 if (moment) prompt += `- 删除了对${posterName}动态的一条评论\\n`;
                break;
            case 'edit_moment':
                if (moment) prompt += `- 修改了动态：“${action.content}”\\n`;
                break;
            case 'delete_moment':
                if (moment) prompt += `- 删除了${posterName}发布的动态\\n`;
                break;
            case 'friend_request_response':
                const responseText = action.action === 'accept' ? '接受了' : '忽略了';
                prompt += `- ${responseText}${action.from_name}的好友请求\\n`;
                break;
            case 'new_forum_post':
                const board = PhoneSim_State.forumData[action.boardId];
                if (board) {
                    prompt += `- 在论坛“${board.boardName}”板块发表了新帖子，标题为“${action.title}”，内容为“${action.content}”\\n`;
                }
                break;
            case 'new_forum_reply':
                const post = DataHandler.findForumPostById(action.postId);
                if (post) {
                    const postAuthorName = UI._getContactName(post.authorId);
                    prompt += `- 回复了${postAuthorName}的论坛帖子“${post.title}”：“${action.content}”\\n`;
                }
                break;
        }
    });
    prompt += `请根据以上操作，继续推演角色的反应和接下来的剧情。)`;

    try {
        await TavernHelper_API.triggerSlash(`/setinput ${JSON.stringify(prompt)}`);
        SillyTavern_API.generate();
    } catch (error) {
        console.error('[Phone Sim] Failed to commit actions:', error);
        return;
    }
    
    if (messagesToCommit.length > 0) {
        await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
            messagesToCommit.forEach(stagedMsg => {
                const contactObject = dbData[stagedMsg.contactId];
                if (contactObject?.app_data?.WeChat) {
                    const finalMessage = { ...stagedMsg.tempMessageObject, sourceMsgId: null };
                    delete finalMessage.isStaged;
                    contactObject.app_data.WeChat.messages.push(finalMessage);
                }
            });
            return dbData;
        });
    }

    if (playerActionsToCommit.length > 0) {
        await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
            playerActionsToCommit.forEach(action => {
                 if (action.type === 'friend_request_response' && action.action === 'accept') {
                    if (!dbData[action.from_id]) {
                        dbData[action.from_id] = {
                            profile: { nickname: action.from_name, note: action.from_name },
                            app_data: { WeChat: { messages: [] } }
                        };
                    }
                    return;
                }

                const moment = PhoneSim_State.moments.find(m => m.momentId === action.momentId);
                const posterId = action.type === 'new_moment' ? PhoneSim_Config.PLAYER_ID : moment?.posterId;
                
                if (!posterId) return;
                const contact = dbData[posterId];
                if (!contact) return;
                if (!contact.moments) contact.moments = [];
                const momentIndex = contact.moments.findIndex(m => m.momentId === action.momentId);

                if (action.type === 'new_moment') {
                    contact.moments.unshift({ 
                        momentId: `player_${Date.now()}`,
                        posterId: PhoneSim_Config.PLAYER_ID,
                        timestamp: new Date().toISOString(),
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        content: action.data.content,
                        images: action.data.images || [],
                        location: null,
                        likes: [],
                        comments: []
                    });
                } else if (momentIndex > -1) {
                    const momentToUpdate = contact.moments[momentIndex];
                    switch(action.type) {
                        case 'like':
                            if (!momentToUpdate.likes.includes(PhoneSim_Config.PLAYER_ID)) momentToUpdate.likes.push(PhoneSim_Config.PLAYER_ID);
                            break;
                        case 'comment':
                            momentToUpdate.comments.push({ uid: 'comment_' + Date.now(), commenterId: PhoneSim_Config.PLAYER_ID, text: action.content });
                            break;
                        case 'edit_comment':
                            const commentToEdit = momentToUpdate.comments.find(c => c.uid === action.commentId);
                            if (commentToEdit) commentToEdit.text = action.content;
                            break;
                        case 'recall_comment':
                            const commentToRecall = momentToUpdate.comments.find(c => c.uid === action.commentId);
                            if (commentToRecall) { commentToRecall.text = '你撤回了一条评论'; commentToRecall.recalled = true; }
                            break;
                        case 'delete_comment':
                            momentToUpdate.comments = momentToUpdate.comments.filter(c => c.uid !== action.commentId);
                            break;
                        case 'edit_moment':
                            contact.moments[momentIndex].content = action.content;
                            break;
                        case 'delete_moment':
                            contact.moments.splice(momentIndex, 1);
                            break;
                    }
                }
            });
            return dbData;
        });

        if (playerActionsToCommit.some(a => a.type.startsWith('new_forum'))) {
            await _updateWorldbook(PhoneSim_Config.WORLD_FORUM_DATABASE, forumDb => {
                playerActionsToCommit.forEach(action => {
                    if (action.type === 'new_forum_post') {
                        const board = forumDb[action.boardId];
                        if (board) {
                            board.posts.push({
                                postId: `post_player_${Date.now()}`,
                                boardId: action.boardId,
                                authorId: PhoneSim_Config.PLAYER_ID,
                                authorName: '我',
                                title: action.title,
                                content: action.content,
                                timestamp: new Date().toISOString(),
                                tags: [],
                                replies: []
                            });
                        }
                    } else if (action.type === 'new_forum_reply') {
                        const post = Object.values(forumDb).flatMap(b => b.posts).find(p => p.postId === action.postId);
                        if (post) {
                            post.replies.push({
                                replyId: `reply_player_${Date.now()}`,
                                postId: action.postId,
                                authorId: PhoneSim_Config.PLAYER_ID,
                                authorName: '我',
                                content: action.content,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                });
                return forumDb;
            });
        }
    }

    PhoneSim_State.stagedPlayerMessages = [];
    PhoneSim_State.stagedPlayerActions = [];
    await DataHandler.fetchAllData();
    UI.updateCommitButton();
    UI.rerenderCurrentView({ chatUpdated: true, momentsUpdated: true, forumUpdated: true });
}

export function saveCustomization() {
    try {
        parentWin.localStorage.setItem(PhoneSim_Config.STORAGE_KEY_CUSTOMIZATION, JSON.stringify(PhoneSim_State.customization));
    } catch (er) {
        console.error('[Phone Sim] Failed to save customization to localStorage:', er);
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
export function findMessageByUid(messageUid) {
    const stagedMsgContainer = PhoneSim_State.stagedPlayerMessages.find(m => m.tempMessageObject.uid === messageUid);
    if (stagedMsgContainer) {
        return stagedMsgContainer.tempMessageObject;
    }

    for (const contactId in PhoneSim_State.contacts) {
        const messages = PhoneSim_State.contacts[contactId].app_data?.WeChat?.messages;
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