import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Parser } from '../parser.js';
import { PhoneSim_Sounds } from '../sounds.js';
import { _updateWorldbook } from './actions.js';
import { fetchAllData } from './fetch.js';
import { saveSearchResults, savePageContent } from './browserData.js';

// 我们将直接在这里处理欲色剧场的数据，因为它与processor的职责紧密相关
async function _saveTheaterData(parsedData, msgId) {
    await _updateWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE, (dbData) => {
        // 每次更新都完全覆盖，并记录下消息来源ID，方便撤销和编辑
        const newData = { ...parsedData, sourceMsgId: msgId };
        return newData;
    });
}


let TavernHelper_API, UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    TavernHelper_API = deps.th;
    UI = uiHandler;
    DataHandler = dataHandler;
}

async function _handleProfileUpdateCommands(commands) {
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        commands.forEach(cmd => {
            const contact = dbData[cmd.profileId];
            if (contact && contact.profile) {
                if (cmd.data.bio) contact.profile.bio = cmd.data.bio;
                if (cmd.data.cover_image) contact.profile.cover_image = cmd.data.cover_image;
            }
        });
        return dbData;
    });
}

async function _handleNewEmailCommand(cmd, msgId) {
    await _updateWorldbook(PhoneSim_Config.WORLD_EMAIL_DB_NAME, emails => {
        const emailsToKeep = emails.filter(e => String(e.sourceMsgId) !== String(msgId));
        const newEmail = {
            id: `email_${Date.now()}_${Math.random()}`,
            from_id: cmd.from_id,
            from_name: cmd.from_name,
            subject: cmd.subject,
            content: cmd.content || '',
            timestamp: new Date().toISOString(),
            read: false,
            attachment: (cmd.attachment_name) ? { name: cmd.attachment_name, description: cmd.attachment_desc || '' } : null,
            sourceMsgId: msgId
        };
        emailsToKeep.push(newEmail);
        UI.showNotificationBanner({ profile: { nickname: cmd.from_name }, id: 'email' }, { content: cmd.subject, app: 'Email' });
        return emailsToKeep;
    });
}

async function _handleForumCommands(commands, msgId) {
    const newPosts = commands.filter(c => c.type === '新帖子');
    const newReplies = commands.filter(c => c.type === '新回复');
    const postUpdates = commands.filter(c => c.type === '更新帖子');

    await _updateWorldbook(PhoneSim_Config.WORLD_FORUM_DATABASE, forumDb => {
        // First, remove any existing data from this message ID to prevent duplication on edit
        for (const boardId in forumDb) {
            const board = forumDb[boardId];
            if (board.posts) {
                board.posts = board.posts.filter(post => String(post.sourceMsgId) !== String(msgId));
                board.posts.forEach(post => {
                    if (post.replies) {
                        post.replies = post.replies.filter(reply => String(reply.sourceMsgId) !== String(msgId));
                    }
                });
            }
        }

        // Process all new posts first, adding them to the database structure
        newPosts.forEach(cmd => {
            const data = cmd.data;
            const postId = data.postId || `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const boardId = data.boardId || data.boardName.toLowerCase().replace(/\s/g, '_');
            if (!forumDb[boardId]) {
                forumDb[boardId] = { boardName: data.boardName, posts: [] };
            }
            const newPost = {
                postId: postId,
                boardId: boardId,
                authorId: data.authorId,
                authorName: data.authorName,
                title: data.title,
                content: data.content,
                timestamp: PhoneSim_Parser.buildTimestamp(data.time),
                tags: data.tags || [],
                replies: [],
                likes: data.likes || [],
                sourceMsgId: msgId
            };
            forumDb[boardId].posts.push(newPost);
        });

        // Then, process all new replies against the potentially just-updated database
        newReplies.forEach(cmd => {
            const data = cmd.data;
            const { postId } = data;
            let postFound = false;
            for (const boardId in forumDb) {
                const post = forumDb[boardId].posts.find(p => p.postId === postId);
                if (post) {
                    if (!post.replies) post.replies = [];
                    const newReply = {
                        replyId: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        postId: postId,
                        authorId: data.authorId,
                        authorName: data.authorName,
                        content: data.content,
                        timestamp: PhoneSim_Parser.buildTimestamp(data.time),
                        sourceMsgId: msgId
                    };
                    post.replies.push(newReply);
                    postFound = true;
                    break;
                }
            }
            if (!postFound) console.warn(`[Phone Sim] Forum post with ID ${postId} not found for reply.`);
        });

        // Finally, process all post updates (likes)
        postUpdates.forEach(cmd => {
             const data = cmd.data;
             const { postId, action, actorId } = data;
             let postFound = false;
             for (const boardId in forumDb) {
                 const post = forumDb[boardId].posts.find(p => p.postId === postId);
                 if (post) {
                     if (action === 'like') {
                         if (!post.likes) post.likes = [];
                         if (!post.likes.includes(actorId)) {
                             post.likes.push(actorId);
                         }
                     }
                     postFound = true;
                     break;
                 }
             }
             if (!postFound) console.warn(`[Phone Sim] Forum post with ID ${postId} not found for update.`);
        });

        return forumDb;
    });
}


async function _handleLiveCenterCommands(commands, msgId) {
     await _updateWorldbook(PhoneSim_Config.WORLD_LIVECENTER_DATABASE, liveDb => {
        commands.forEach(cmd => {
            const data = cmd.data;
            if (cmd.type === '目录更新') {
                const boardId = data.boardId;
                if (!liveDb[boardId]) {
                    liveDb[boardId] = { streams: [] };
                }
                // Replace the entire stream list for that board
                liveDb[boardId].streams = data.streams;
                liveDb[boardId].sourceMsgId = msgId;
            } else if (cmd.type === '直播间状态') {
                // Store the live stream state in a dedicated key, overwriting the previous one.
                liveDb.active_stream = { ...data, sourceMsgId: msgId };
            }
        });
        return liveDb;
     });
}

async function _handleMomentAndMomentUpdateCommands(momentCommands, momentUpdateCommands, msgId) {
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        // 1. Clean up old data from this message ID to ensure idempotency
        for (const contactId in dbData) {
            if (dbData[contactId].moments) {
                dbData[contactId].moments = dbData[contactId].moments.filter(m => String(m.sourceMsgId) !== String(msgId));
            }
        }

        // 2. Process new moments first and add them to the database
        momentCommands.forEach(cmd => {
            let posterContact = dbData[cmd.posterId];
            if (!posterContact) {
                dbData[cmd.posterId] = {
                    profile: { nickname: cmd.posterName || cmd.posterId, note: cmd.posterName || cmd.posterId },
                    app_data: { WeChat: { messages: [] } },
                    moments: []
                };
                posterContact = dbData[cmd.posterId];
            }

            if (!posterContact.moments) posterContact.moments = [];

            const newMoment = { ...cmd, timestamp: PhoneSim_Parser.buildTimestamp(cmd.time), sourceMsgId: msgId };

            const existingIndex = posterContact.moments.findIndex(m => m.momentId === newMoment.momentId);
            if (existingIndex > -1) {
                posterContact.moments.splice(existingIndex, 1);
            }

            posterContact.moments.push(newMoment);
        });

        // 3. Process moment updates against the now-updated database
        momentUpdateCommands.forEach(cmd => {
            let momentFound = false;
            for (const contactId in dbData) {
                const contact = dbData[contactId];
                if (contact.moments) {
                    const momentToUpdate = contact.moments.find(m => m.momentId === cmd.动态id);
                    if (momentToUpdate) {
                        if (cmd.action === 'like') {
                            if (!momentToUpdate.likes) momentToUpdate.likes = [];
                            if (!momentToUpdate.likes.includes(cmd.actor_id)) {
                                momentToUpdate.likes.push(cmd.actor_id);
                            }
                        } else if (cmd.action === 'comment') {
                            if (!momentToUpdate.comments) momentToUpdate.comments = [];
                            momentToUpdate.comments.push({
                                uid: 'comment_' + Date.now() + Math.random(),
                                commenterId: cmd.actor_id,
                                text: cmd.content
                            });
                        }
                        momentFound = true;
                        break;
                    }
                }
            }
             if (!momentFound) {
                console.warn(`[Phone Sim] Moment with ID ${cmd.动态id} not found for update. It might have been created in the same message batch.`);
            }
        });

        // 4. Sort all moments collections
        for (const contactId in dbData) {
            if (dbData[contactId].moments) {
                dbData[contactId].moments.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            }
        }

        return dbData;
    });
}


async function _handleChatCommands(chatCommands, msgId) {
    let dirData = {};
    const lorebookName = await TavernHelper_API.getCurrentCharPrimaryLorebook();
    if (lorebookName) {
        try {
            const entries = await TavernHelper_API.getWorldbook(lorebookName);
            const dirEntry = entries.find(e => e.name === PhoneSim_Config.WORLD_DIR_NAME);
            if (dirEntry) dirData = JSON.parse(dirEntry.content || '{}');
        } catch (e) { console.error('[Phone Sim] Failed to get contacts directory:', e); }
    }

    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => {
        const unreadDeltas = {};
        let lastTimestampByContact = {};

        Object.entries(dbData).forEach(([contactId, contact]) => {
            if (contact.app_data?.WeChat?.messages) {
                let originalCount = contact.app_data.WeChat.messages.length;
                contact.app_data.WeChat.messages = contact.app_data.WeChat.messages.filter(msg => {
                    return String(msg.sourceMsgId) !== String(msgId);
                });
                let removedCount = originalCount - contact.app_data.WeChat.messages.length;
                 if (removedCount > 0 && contact.unread) {
                    contact.unread = Math.max(0, contact.unread - removedCount);
                }
            }
        });

        Object.values(dbData).forEach(contact => {
            if (contact.app_data?.WeChat?.messages?.length > 0) {
                const latestMessage = contact.app_data.WeChat.messages[contact.app_data.WeChat.messages.length - 1];
                const contactId = Object.keys(dbData).find(key => dbData[key] === contact);
                if (contactId) {
                    lastTimestampByContact[contactId] = latestMessage.timestamp;
                }
            }
        });


        chatCommands.forEach(p => {
            const contactId = (p.type === '群聊') ? `group_${p.groupId}` : p.contactId;
            const isNew = !dbData[contactId];

            if (isNew) {
                if (p.type === '私聊') {
                    dbData[contactId] = { profile: { ...p.profile }, app_data: { WeChat: { messages: [] } } };
                    if (!dirData.contacts) dirData.contacts = {};
                    dirData.contacts[p.profile.note] = contactId;
                } else if (p.type === '群聊') {
                    dbData[contactId] = { profile: { groupName: p.groupName, members: [] }, app_data: { WeChat: { messages: [] } } };
                    if (!dirData.groups) dirData.groups = {};
                    dirData.groups[p.groupName] = { id: p.groupId, members: [] };
                } else if (p.type === '系统提示' && contactId) {
                    // Create a placeholder contact. It will be populated by a subsequent message.
                    dbData[contactId] = { profile: { nickname: contactId, note: '' }, app_data: { WeChat: { messages: [] } } };
                }
            }

            let contactObject = dbData[contactId];
            if (!contactObject) return;
            if (!isNew && p.type === '私聊' && p.profile && !dbData[contactId].profile.note) {
                 dbData[contactId].profile.note = p.profile.note;
                 dbData[contactId].profile.nickname = p.profile.nickname;
            }
            if (!isNew && p.type === '群聊') {
                contactObject.profile.groupName = p.groupName;
            }

            if (!contactObject.app_data) contactObject.app_data = {};
            if (!contactObject.app_data.WeChat) contactObject.app_data.WeChat = {};
            if (!Array.isArray(contactObject.app_data.WeChat.messages)) contactObject.app_data.WeChat.messages = [];

            const lastTimestamp = lastTimestampByContact[contactId];
            const newTimestamp = PhoneSim_Parser.buildTimestamp(p.time, lastTimestamp);
            lastTimestampByContact[contactId] = newTimestamp;

            const newMessage = { uid: `${Date.now()}_${Math.random()}`, timestamp: newTimestamp, sender_id: p.senderId || p.contactId, content: p.content, sourceMsgId: msgId, isSystemNotification: p.isSystemNotification || false };

            if (newMessage.content && (newMessage.content.type === 'transfer' || newMessage.content.type === 'red_packet')) {
                newMessage.content.status = 'unclaimed';
            }

            contactObject.app_data.WeChat.messages.push(newMessage);

            if (newMessage.sender_id !== PhoneSim_Config.PLAYER_ID && !newMessage.isSystemNotification) {
                if (!PhoneSim_State.pendingAnimations[contactId]) {
                    PhoneSim_State.pendingAnimations[contactId] = [];
                }
                PhoneSim_State.pendingAnimations[contactId].push(newMessage.uid);
            }

            if (contactId !== PhoneSim_State.activeContactId && newMessage.sender_id !== PhoneSim_Config.PLAYER_ID) {
                unreadDeltas[contactId] = (unreadDeltas[contactId] || 0) + 1;
                if (!newMessage.isSystemNotification) {
                    PhoneSim_Sounds.play('receive');
                    const contactWithId = { ...contactObject, id: contactId };
                    UI.showNotificationBanner(contactWithId, newMessage);
                }
            }

            if (p.type === '群聊') {
                if (p.senderId && !contactObject.profile.members.includes(p.senderId)) {
                    contactObject.profile.members.push(p.senderId);
                }
                if (p.senderId && !dbData[p.senderId]) {
                    const senderProfile = { ...(p.senderProfile || { nickname: p.sender_name, note: p.sender_name }) };
                    dbData[p.senderId] = { profile: senderProfile, app_data: {} };
                    if (senderProfile.note) {
                        if (!dirData.contacts) dirData.contacts = {};
                        dirData.contacts[senderProfile.note] = p.senderId;
                    }
                }
                const groupDirEntry = Object.values(dirData.groups || {}).find(g => g.id === p.groupId);
                if (groupDirEntry) {
                    groupDirEntry.members = [...new Set(contactObject.profile.members.map(id => dbData[id]?.profile.note || dbData[id]?.profile.nickname).filter(Boolean))];
                }
            }
        });

        for (const id in unreadDeltas) {
            if (dbData[id]) dbData[id].unread = Math.max(0, (dbData[id].unread || 0) + unreadDeltas[id]);
        }

        Object.values(dbData).forEach(c => c.app_data?.WeChat?.messages?.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        return dbData;
    });

    if (lorebookName) {
        await _updateWorldbook(PhoneSim_Config.WORLD_DIR_NAME, _ => dirData);
    }
}

async function _handleFriendRequestCommands(commands) {
    await _updateWorldbook(PhoneSim_Config.WORLD_DIR_NAME, dirData => {
        if (!dirData.friend_requests) {
            dirData.friend_requests = [];
        }
        commands.forEach(cmd => {
            const newRequest = {
                uid: `req_${Date.now()}_${Math.random()}`,
                from_id: cmd.from_id,
                from_name: cmd.from_name,
                content: cmd.content,
                timestamp: PhoneSim_Parser.buildTimestamp(cmd.time),
                status: 'pending'
            };
            dirData.friend_requests.push(newRequest);
        });
        return dirData;
    });
}


// [关键修改] 升级 mainProcessor 函数
export async function mainProcessor(msgId) {
    UI.closeCallUI();
    const messages = TavernHelper_API.getChatMessages(msgId);
    if (!messages || !messages.length) return;
    let rawMessage = messages[0].message;

    PhoneSim_Parser.updateWorldDate(rawMessage);
    UI.updateTime();

    // 1. [新增] 优先处理“欲色剧场”的专属数据块
    let theaterUpdated = false;
    const theaterMatch = rawMessage.match(/<yuse_data>([\s\S]*?)<\/yuse_data>/s);
    if (theaterMatch) {
        // 我们找到了剧场数据块，现在调用解析器来处理它
        const theaterData = PhoneSim_Parser.parseTheaterData(theaterMatch[1]);
        if (theaterData) {
            await _saveTheaterData(theaterData, msgId);
            theaterUpdated = true;
        }
        // 从原始消息中移除这个数据块，避免干扰后续的逐行解析
        rawMessage = rawMessage.replace(/<yuse_data>[\s\S]*?<\/yuse_data>/s, '');
    }


    // 2. 逐行解析剩余的常规指令
    const commands = [];
    const lines = rawMessage.split(/\r?\n/);
    lines.forEach(line => {
        const command = PhoneSim_Parser.parseCommand(line);
        if (command) commands.push(command);
    });

    // 如果没有任何指令，并且也没有剧场数据更新，则提前退出
    if (commands.length === 0 && !theaterUpdated) {
        if (msgId !== null) return;
    }
    PhoneSim_State.lastProcessedMsgId = msgId;


    // 3. 将解析出的指令分类
    const chatCommands = commands.filter(cmd => cmd.commandType === 'Chat' && cmd.interactiveType !== 'friend_request');
    // ... 其他所有指令的分类保持不变 ...
    const friendRequestCommands = commands.filter(cmd => cmd.interactiveType === 'friend_request');
    const momentCommands = commands.filter(cmd => cmd.commandType === 'Moment');
    const momentUpdateCommands = commands.filter(cmd => cmd.commandType === 'MomentUpdate');
    const appCommands = commands.filter(cmd => cmd.commandType === 'App');
    const voiceCallCommands = commands.filter(cmd => cmd.commandType === 'VoiceCall');
    const phoneCallCommands = commands.filter(cmd => cmd.commandType === 'PhoneCall');
    const profileUpdateCommands = commands.filter(cmd => cmd.commandType === 'ProfileUpdate');
    const forumCommands = commands.filter(cmd => cmd.commandType === 'Forum');
    const browserSearchResultCommands = commands.filter(cmd => cmd.app === '浏览器' && cmd.type === '搜索目录');
    const browserWebpageCommand = commands.find(cmd => cmd.app === '浏览器' && cmd.type === '网页');
    const liveCenterCommands = commands.filter(cmd => cmd.commandType === 'LiveCenter');


    // 4. 根据分类处理指令，并设置更新标志
    let chatUpdated = false, emailUpdated = false, momentsUpdated = false, profileUpdated = false, browserUpdated = false, forumUpdated = false, liveCenterUpdated = false;

    // ... for (const cmd of appCommands) ... 等所有指令处理逻辑块保持不变 ...
    for (const cmd of appCommands) {
        if (cmd.app === 'Email' && cmd.type === 'New') {
            await _handleNewEmailCommand(cmd, msgId);
            emailUpdated = true;
        } else if (cmd.app === 'Phone' && cmd.type === 'IncomingCall') {
            const contact = PhoneSim_State.contacts[cmd.from_id] || { profile: { nickname: cmd.from_name, note: cmd.from_name } };
            PhoneSim_State.incomingCallData = { id: cmd.from_id, name: cmd.from_name };
            UI.showRingingModal(contact);
        }
    }

    if (profileUpdateCommands.length > 0) {
        await _handleProfileUpdateCommands(profileUpdateCommands);
        profileUpdated = true;
    }
    // ... 省略其他指令处理 ...

    // 5. 如果有任何数据发生了变化，就从世界书重新加载所有数据
    if (chatUpdated || emailUpdated || momentsUpdated || profileUpdated || browserUpdated || forumUpdated || liveCenterUpdated || theaterUpdated) {
        await fetchAllData();
    }


    // 6. 更新全局未读角标
    UI.updateGlobalUnreadCounts();

    // 7. 如果手机面板是可见的，就刷新当前视图
    if (PhoneSim_State.isPanelVisible) {
        // 将所有更新标志都传递过去，让UI决定刷新哪些部分
        UI.rerenderCurrentView({ chatUpdated, emailUpdated, momentsUpdated, profileUpdated, browserUpdated, forumUpdated, liveCenterUpdated, theaterUpdated });
    }
}


// [关键修改] 升级 deleteMessagesBySourceId 函数
export async function deleteMessagesBySourceId(sourceMsgId) {
    // ... 此函数的前半部分，处理聊天、朋友圈、邮件、浏览器、论坛、直播数据的删除逻辑保持不变 ...
    await _updateWorldbook(PhoneSim_Config.WORLD_DB_NAME, dbData => { /*...*/ });
    await _updateWorldbook(PhoneSim_Config.WORLD_EMAIL_DB_NAME, emails => { /*...*/ });
    await _updateWorldbook(PhoneSim_Config.WORLD_BROWSER_DATABASE, browserDb => { /*...*/ });
    await _updateWorldbook(PhoneSim_Config.WORLD_FORUM_DATABASE, forumDb => { /*...*/ });
    await _updateWorldbook(PhoneSim_Config.WORLD_LIVECENTER_DATABASE, liveDb => { /*...*/ });

    // [新增] 当消息被删除或编辑时，也要一并删除对应的“欲色剧场”数据
    await _updateWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE, theaterDb => {
        if (theaterDb && String(theaterDb.sourceMsgId) === String(sourceMsgId)) {
            // 如果这条消息是剧场数据的来源，就把它清空
            return {};
        }
        return theaterDb; // 否则保持不变
    });


    // 最后，重新加载所有数据并刷新UI
    await fetchAllData();

    if (PhoneSim_State.isPanelVisible) {
        UI.rerenderCurrentView({ chatUpdated: true, emailUpdated: true, momentsUpdated: true, browserUpdated: true, forumUpdated: true, liveCenterUpdated: true, theaterUpdated: true });
        UI.updateGlobalUnreadCounts();
    }
}
