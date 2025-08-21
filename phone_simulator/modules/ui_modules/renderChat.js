
import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, UI, DataHandler;

const INITIAL_MESSAGE_LOAD_COUNT = 30;
const LOAD_MORE_COUNT = 30;
let displayedMessageCount = INITIAL_MESSAGE_LOAD_COUNT;
let isRendering = false;
let isLoadingMore = false;

let animationQueues = {};
let isAnimatingFlags = {};

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    UI = uiObject;
    DataHandler = dataHandler;
}

export function renderContactsList() {
    const list = jQuery_API(parentWin.document.body).find(`#phone-sim-panel-v10-0 .chat-list-content`).empty();

    const getLatestTimestamp = (contact, id) => {
        const allMessages = [
            ...(contact.app_data?.WeChat?.messages || []),
            ...PhoneSim_State.stagedPlayerMessages.filter(msg => msg.contactId === id).map(m => m.tempMessageObject)
        ];
        if (allMessages.length === 0) return 0;
        return new Date(allMessages[allMessages.length - 1].timestamp).getTime();
    };

    const contactsWithTimestamps = Object.entries(PhoneSim_State.contacts)
        .filter(([id, c]) => c.profile && id !== 'PLAYER_USER')
        .map(([id, contact]) => ({ id, contact, lastTimestamp: getLatestTimestamp(contact, id) }));

    const sortedContacts = contactsWithTimestamps
        .filter(item => item.lastTimestamp > 0)
        .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    if (sortedContacts.length === 0) {
        list.html('<div class="email-empty-state" style="color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">暂无会话</div>');
        return;
    }

    sortedContacts.forEach(({ id, contact }) => {
        const isGroup = id.startsWith('group_');
        const name = isGroup ? contact.profile.groupName : (contact.profile.note || contact.profile.nickname);
        const avatar = contact.profile.avatar || UI.generateDefaultAvatar(name);
        const unreadCount = contact.unread || 0;

        const allMessages = [
            ...(contact.app_data?.WeChat?.messages || []),
            ...PhoneSim_State.stagedPlayerMessages.filter(msg => msg.contactId === id).map(m => m.tempMessageObject)
        ];
        const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;

        let preview = '...';
        let time = '';

        if (lastMessage) {
            if (lastMessage.recalled) {
                preview = '撤回了一条消息';
            } else if (lastMessage.requestData?.type === 'friend_request') {
                preview = '请求添加你为好友';
            } else if (typeof lastMessage.content === 'string') {
                preview = lastMessage.content;
            } else if (typeof lastMessage.content === 'object' && lastMessage.content !== null) {
                switch (lastMessage.content.type) {
                    case 'image': case 'pseudo_image': preview = '[图片]'; break;
                    case 'voice': preview = '[语音]'; break;
                    case 'transfer': preview = '[转账]'; break;
                    case 'red_packet': preview = '[红包]'; break;
                    case 'location': preview = '[位置]'; break;
                    default: preview = '[消息]';
                }
            }
            time = new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        
        const itemHtml = `
            <div class="chat-list-item" data-id="${id}">
                <img src="${avatar}" class="chat-avatar">
                <div class="chat-info">
                    <div class="chat-header-list">
                        <span class="chat-name-list">${jQuery_API('<div>').text(name).html()}</span>
                        <span class="chat-time">${time}</span>
                    </div>
                    <p class="chat-preview">${jQuery_API('<div>').text(preview).html()}</p>
                </div>
                ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                <div class="delete-contact-btn" data-id="${id}" title="删除对话"><i class="fas fa-trash-alt"></i></div>
            </div>
        `;
        list.append(itemHtml);
    });
}


async function _renderMessages(messagesContainer, allMessages, isGroup) {
    if (isRendering) return;
    isRendering = true;

    const messagesToDisplay = allMessages.slice(-displayedMessageCount);
    
    let html = '';
    let lastTimestamp = null;
    
    messagesToDisplay.forEach(s => {
        const currentTimestamp = new Date(s.timestamp);
        if (!lastTimestamp || (currentTimestamp - lastTimestamp) / (1000 * 60) > 30) {
            html += `<div class="time-divider"><span>${UI.getDividerText(currentTimestamp)}</span></div>`;
        }
        
        if (s.isSystemNotification) {
            html += UI.renderSystemMessage(s);
        } else if (s.requestData) {
            html += UI.renderInteractiveMessage(s);
        } else {
            html += UI.renderSingleMessage(s, isGroup);
        }
        lastTimestamp = currentTimestamp;
    });

    messagesContainer.html(`<div class="chat-loader" style="display: none;"></div>` + html);
    
    const loader = messagesContainer.find('.chat-loader');
    if (displayedMessageCount >= allMessages.length) {
        loader.hide();
    } else {
        loader.show();
    }

    isRendering = false;
}

async function _processAnimationQueue(contactId) {
    if (isAnimatingFlags[contactId] || !animationQueues[contactId] || animationQueues[contactId].length === 0) {
        return;
    }
    isAnimatingFlags[contactId] = true;
    const item = animationQueues[contactId].shift();

    try {
        const container = item.element.closest('.chat-messages');
        const messageContent = item.element.find('.message-content');
        
        if (typeof item.message.content !== 'string') return;
        
        const originalHtml = messageContent.html();
        messageContent.css('min-height', messageContent.height() + 'px');
        
        const typingIndicatorHtml = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        messageContent.html(typingIndicatorHtml);
        
        if (container.length > 0 && container[0].scrollHeight - container.scrollTop() - container.height() < 150) {
            container.animate({ scrollTop: container[0].scrollHeight }, 300);
        }

        const thinkingTime = Math.min(2500, Math.max(500, (item.message.content.length * 40) + (Math.random() * 500)));

        await new Promise(resolve => setTimeout(resolve, thinkingTime));
        
        messageContent.css('opacity', 0).html(originalHtml).css('min-height', '');
        messageContent.animate({ opacity: 1 }, 200);

        if (container.length > 0 && container[0].scrollHeight - container.scrollTop() - container.height() < 150) {
            container.animate({ scrollTop: container[0].scrollHeight }, 100);
        }

    } catch (e) {
        console.error("Animation failed", e);
        if (item && item.element) {
            const messageData = DataHandler.findMessageByUid(item.message.uid);
            if (messageData) {
                item.element.find('.message-content').html(UI._renderRichMessage(messageData));
            }
        }
    } finally {
        isAnimatingFlags[contactId] = false;
        _processAnimationQueue(contactId);
    }
}


export function triggerPendingAnimations(contactId) {
    const pendingUids = PhoneSim_State.pendingAnimations[contactId];
    if (!pendingUids || pendingUids.length === 0) {
        return;
    }

    const messagesContainer = jQuery_API(parentWin.document.body).find(`#phone-sim-panel-v10-0 .chat-messages`);
    if (!animationQueues[contactId]) {
        animationQueues[contactId] = [];
    }
    
    pendingUids.forEach(uid => {
        const messageElement = messagesContainer.find(`.message[data-uid="${uid}"]`);
        const messageData = DataHandler.findMessageByUid(uid);
        if (messageElement.length && messageData) {
            if (!animationQueues[contactId].some(item => item.message.uid === uid)) {
                animationQueues[contactId].push({ element: messageElement, message: messageData });
            }
        }
    });
    
    delete PhoneSim_State.pendingAnimations[contactId];
    _processAnimationQueue(contactId);
}

export async function renderChatView(cId, app) {
    if (PhoneSim_State.activeContactId !== cId) {
        displayedMessageCount = INITIAL_MESSAGE_LOAD_COUNT;
    }
    PhoneSim_State.activeContactId = cId;

    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const contact = PhoneSim_State.contacts[cId];
    if (!contact) { return UI.showView('ChatApp'); }

    if (contact.unread > 0) {
        PhoneSim_State.contacts[cId].unread = 0;
        await DataHandler.resetUnreadCount(cId);
        UI.updateGlobalUnreadCounts();
        UI.renderContactsList();
    }

    const v = p.find('#chatapp-view');
    const isGroup = cId.startsWith('group_');
    const contactName = isGroup ? contact.profile.groupName : (contact.profile.note || contact.profile.nickname);
    v.find('.chat-name').text(contactName);
    v.find('.header-avatar').attr('src', contact.profile.avatar || UI.generateDefaultAvatar(contactName));
    v.find('.edit-note-btn').toggle(!isGroup);
    v.find('.members-btn').toggle(isGroup).css('display', isGroup ? 'flex' : 'none');

    const messagesContainer = v.find('.chat-messages');
    messagesContainer.off('scroll.loadMore'); 

    const allMessages = [
        ...(contact.app_data?.[app]?.messages || []),
        ...PhoneSim_State.stagedPlayerMessages.filter(msg => msg.contactId === cId).map(m => m.tempMessageObject)
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    await _renderMessages(messagesContainer, allMessages, isGroup);

    messagesContainer.scrollTop(messagesContainer[0].scrollHeight);
    triggerPendingAnimations(cId);
    
    messagesContainer.on('scroll.loadMore', UI.throttle(async function() {
        if (isLoadingMore) return;
        if (messagesContainer.scrollTop() <= 5 && displayedMessageCount < allMessages.length) {
            isLoadingMore = true;
            const oldScrollHeight = messagesContainer[0].scrollHeight;

            displayedMessageCount += LOAD_MORE_COUNT;
            await _renderMessages(messagesContainer, allMessages, isGroup, false);
            
            const newScrollHeight = messagesContainer[0].scrollHeight;
            messagesContainer.scrollTop(newScrollHeight - oldScrollHeight);
            isLoadingMore = false;
        }
    }, 200));
}
