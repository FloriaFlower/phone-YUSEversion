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

// ... _handleProfileUpdateCommands, _handleNewEmailCommand 等所有其他处理函数保持不变 ...
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
    // ... 此函数保持不变 ...
}

async function _handleLiveCenterCommands(commands, msgId) {
    // ... 此函数保持不变 ...
}

async function _handleMomentAndMomentUpdateCommands(momentCommands, momentUpdateCommands, msgId) {
    // ... 此函数保持不变 ...
}

async function _handleChatCommands(chatCommands, msgId) {
    // ... 此函数保持不变 ...
}

async function _handleFriendRequestCommands(commands) {
    // ... 此函数保持不变 ...
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
