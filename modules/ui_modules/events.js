
import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, SillyTavern_API, TavernHelper_API, UI, DataHandler;
let isBrowserInitialized = false;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_API = deps.st;
    TavernHelper_API = deps.th;
    UI = uiObject;
    DataHandler = dataHandler;
}

export function addEventListeners() {
    const b = jQuery_API(parentWin.document.body);
    const p = b.find(`#${PhoneSim_Config.PANEL_ID}`);
    const fileInput = b.find('#phone-sim-file-input');

    fileInput.off('change.phonesim').on('change.phonesim', async (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const compressedData = await UI.compressImage(e.target.result);
                if (UI.fileUploadCallback) UI.fileUploadCallback(compressedData);
            };
            reader.readAsDataURL(file);
        }
        fileInput.val('');
    });

    b.off('.phonesim')
        .on('click.phonesim', `#${PhoneSim_Config.TOGGLE_BUTTON_ID}`, () => { PhoneSim_Sounds.play('tap'); UI.togglePanel(); })
        .on('click.phonesim', `#${PhoneSim_Config.COMMIT_BUTTON_ID}`, () => { PhoneSim_Sounds.play('send'); DataHandler.commitStagedActions(); });

    // Use event delegation for dynamic content
    p.off('.phonesim')
        .on('click.phonesim', '.app-block', function() { PhoneSim_Sounds.play('open'); UI.showView(jQuery_API(this).data('view')); })
        .on('click.phonesim', '.back-to-home-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('HomeScreen'); })
        .on('click.phonesim', '.back-to-list-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('ChatApp'); })
        .on('click.phonesim', '.back-to-discover-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('Discover'); })
        .on('click.phonesim', '.back-to-chat-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('ChatConversation', PhoneSim_State.activeContactId); })
        .on('click.phonesim', '.back-to-members-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('GroupMembers'); })
        .on('click.phonesim', '.back-to-messages-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('ChatApp'); })
        .on('click.phonesim', '#homepage-view .back-to-list-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('ChatApp'); })
        .on('click.phonesim', '#discover-moments', () => { PhoneSim_Sounds.play('tap'); UI.showView('Moments'); })
        .on('click.phonesim', '.chat-list-item, .contact-item.has-chat', function(e) {
            if (!jQuery_API(e.target).closest('.delete-contact-btn').length) {
                PhoneSim_Sounds.play('tap');
                UI.showView('ChatConversation', String(jQuery_API(this).data('id')));
            }
        })
        .on('click.phonesim', '.phone-contact-call-btn', function() { PhoneSim_Sounds.play('tap'); DataHandler.initiatePhoneCall({id: jQuery_API(this).closest('.phone-contact-item').data('id'), name: jQuery_API(this).siblings('.phone-contact-name').text()}); })
        .on('click.phonesim', '#emailapp-view .email-item', function() { PhoneSim_Sounds.play('tap'); UI.showView('EmailDetail', jQuery_API(this).data('id')); })
        .on('click.phonesim', '#emailapp-view .back-to-email-list-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('EmailApp'); })
        .on('click.phonesim', '#emailapp-view .reply-button', function() {
            PhoneSim_Sounds.play('open');
            const senderName = jQuery_API(this).data('sender-name');
            const modal = p.find('#email-reply-modal');
            modal.find('#email-reply-title').text(`回复: ${senderName}`);
            modal.show();
            modal.find('#email-reply-textarea').val('').focus();
        })
        .on('click.phonesim', '#email-reply-cancel', () => { PhoneSim_Sounds.play('tap'); p.find('#email-reply-modal').hide(); })
        .on('click.phonesim', '#email-reply-confirm', () => {
            PhoneSim_Sounds.play('send');
            const content = p.find('#email-reply-textarea').val();
            const email = PhoneSim_State.emails.find(e => e.id === PhoneSim_State.activeEmailId);
            if(content && email) {
                TavernHelper_API.triggerSlash(`/send 【邮箱界面】回复${email.from_name}的邮件: ${content}|/trigger`);
            }
            p.find('#email-reply-modal').hide();
        })
        .on('click.phonesim', '#emailapp-view .accept-button', () => {
            PhoneSim_Sounds.play('tap');
            const email = PhoneSim_State.emails.find(e => e.id === PhoneSim_State.activeEmailId);
            if(email && email.attachment) {
                TavernHelper_API.triggerSlash(`/send 【邮箱界面】收下${email.from_name}送的${email.attachment.name}|/trigger`);
            }
        })
        .on('click.phonesim', '.call-ui-internal .end-call', async function() {
            PhoneSim_Sounds.play('close');
            const isVoiceCall = PhoneSim_State.isVoiceCallActive;
            const callData = isVoiceCall ? PhoneSim_State.activeCallData : PhoneSim_State.activePhoneCallData;
            const timer = jQuery_API(this).closest('.call-ui-internal').find('#call-timer').text();
            
            if (callData) {
                const contactName = UI._getContactName(callData.id);
                const callType = isVoiceCall ? '微信语音' : '电话';
                await TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}与${contactName}的${callType}通话结束，时长${timer}。)`);
                
                const callLogEntry = {
                    contactId: callData.id,
                    callType: isVoiceCall ? 'wechat' : 'phone',
                    direction: 'outgoing', 
                    duration: timer,
                    timestamp: new Date().toISOString()
                };
                await DataHandler.logCallRecord(callLogEntry);

                if(isVoiceCall){
                    await DataHandler.addWeChatCallEndMessage(callData.id, timer);
                }
            }
            
            UI.closeCallUI();
            await DataHandler.fetchAllData();
            UI.rerenderCurrentView({ chatUpdated: true });
        })
        .on('click.phonesim', '.send-btn', function() { 
            const i = jQuery_API(this).siblings('.input-field'); 
            if (i.val().trim() && PhoneSim_State.activeContactId) { 
                PhoneSim_Sounds.play('send'); 
                DataHandler.stagePlayerMessage(PhoneSim_State.activeContactId, i.val().trim()); 
                i.val('').trigger('input');
            } 
        })
        .on('input.phonesim', '.chat-input .input-field', function() {
            const textarea = this;
            textarea.style.height = 'auto'; // Reset height to recalculate
            const maxHeight = 100; // Corresponds to max-height in CSS
            
            if (textarea.scrollHeight <= maxHeight) {
                textarea.style.height = textarea.scrollHeight + 'px';
                textarea.style.overflowY = 'hidden';
            } else {
                textarea.style.height = maxHeight + 'px';
                textarea.style.overflowY = 'auto';
            }
        })
        .on('keypress.phonesim', '.input-field', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); jQuery_API(this).siblings('.send-btn').click();} })
        .on('click.phonesim', '.message-actions', function(e) {
            e.stopPropagation();
            PhoneSim_Sounds.play('tap');
            p.find('.phone-sim-menu').hide(); 
            const uid = jQuery_API(this).data('message-uid');
            const message = DataHandler.findMessageByUid(uid);
            if (!message) return;

            const isSent = message.sender_id === PhoneSim_Config.PLAYER_ID;
            const menuSelector = isSent ? '#message-actions-menu' : '#npc-message-actions-menu';
            const menu = p.find(menuSelector);
            
            menu.data('message-uid', uid).css({ top: 0, left: 0 }).show();
            
            const button = jQuery_API(this);
            const panelOffset = p.offset();
            const buttonOffset = button.offset();
            const menuWidth = menu.outerWidth(), menuHeight = menu.outerHeight();
            let top = (buttonOffset.top - panelOffset.top) - (menuHeight / 2) + (button.outerHeight() / 2);
            let left = isSent 
                ? (buttonOffset.left - panelOffset.left) - menuWidth - 5 
                : (buttonOffset.left - panelOffset.left) + button.outerWidth() + 5;
            
            if (left < 5) left = 5;
            if (left + menuWidth > p.width() - 5) left = p.width() - menuWidth - 5;
            if (top < 5) top = 5;
            if (top + menuHeight > p.height() - 5) top = p.height() - menuHeight - 5;
            
            menu.css({top: top, left: left});
        })
        .on('click.phonesim', '.moment-actions-trigger', function(e){
            e.stopPropagation();
            PhoneSim_Sounds.play('tap');
            p.find('.phone-sim-menu').hide();
            const momentId = jQuery_API(this).data('moment-id');
            const posterId = jQuery_API(this).data('poster-id');
            const isPlayerPost = String(posterId) === PhoneSim_Config.PLAYER_ID;
            const menu = p.find(isPlayerPost ? '#player-moment-actions-menu' : '#npc-moment-actions-menu');
            const button = jQuery_API(this);
            const panelRect = p[0].getBoundingClientRect();
            const buttonRect = button[0].getBoundingClientRect();
            const top = (buttonRect.top - panelRect.top) + button.outerHeight() + 5;
            let left = (buttonRect.left - panelRect.left) - menu.outerWidth() + button.outerWidth();
            if (left < 5) left = 5;
            menu.data({ momentId }).css({top, left}).show();
        })
        .on('click.phonesim', '.rich-message.transfer-message.unclaimed', function() {
            const uid = jQuery_API(this).data('uid');
            const message = DataHandler.findMessageByUid(uid);
            if (message) {
                UI.showTransactionModal(message);
            }
        })
        .on('click.phonesim', '.edit-note-btn', function() { 
            PhoneSim_Sounds.play('tap'); 
            if (PhoneSim_State.activeContactId) { 
                const contact = PhoneSim_State.contacts[PhoneSim_State.activeContactId];
                if (!contact || !contact.profile) return;
                UI.showDialog('设置备注', contact.profile.note || contact.profile.nickname || '')
                    .then(n => { 
                        if (n !== null) DataHandler.updateContactNote(PhoneSim_State.activeContactId, n).then(()=>DataHandler.fetchAllData()); 
                    }); 
            }
        })
        .on('click.phonesim', '.call-btn', () => { PhoneSim_Sounds.play('tap'); if (PhoneSim_State.activeContactId) DataHandler.initiateVoiceCall(PhoneSim_State.activeContactId); })
        .on('click.phonesim', '.reject-call', async () => { PhoneSim_Sounds.play('close'); SillyTavern_API.stopGeneration(); if (PhoneSim_State.incomingCallData) await TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}拒绝了来自${PhoneSim_State.incomingCallData.name}的通话。)|/trigger`); UI.closeCallUI(); })
        .on('click.phonesim', '.accept-call', async () => { PhoneSim_Sounds.play('open'); if (!PhoneSim_State.incomingCallData) return; const name = PhoneSim_State.incomingCallData.name; p.find('.voice-call-modal').hide().find('audio')[0].pause(); await TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}接听了${name}的通话。)|/trigger`); PhoneSim_State.incomingCallData = null; })
        .on('click.phonesim', '.pseudo-image-cover', function() { PhoneSim_Sounds.play('tap'); jQuery_API(this).hide().siblings('.pseudo-image-text').html(jQuery_API(this).parent().data('text')).show(); })
        .on('click.phonesim', '.voice-message', function(){ PhoneSim_Sounds.play('tap'); jQuery_API(this).toggleClass('expanded'); })
        .on('click.phonesim', '#settingsapp-view .settings-item[data-subview]', function(){ PhoneSim_Sounds.play('tap'); const s = jQuery_API(this).data('subview'); jQuery_API(this).closest('.view').find('.subview').removeClass('active').filter(`.${s}-subview`).addClass('active'); })
        .on('click.phonesim', '#settingsapp-view .back-to-settings-menu-btn', function(){ PhoneSim_Sounds.play('tap'); jQuery_API(this).closest('.view').find('.subview').removeClass('active').filter('.settings-menu-subview').addClass('active'); })
        .on('click.phonesim', '#reset-ui-position', () => { PhoneSim_Sounds.play('tap'); UI.resetUIPosition(); })
        .on('click.phonesim', '#reset-all-data', async () => {
            PhoneSim_Sounds.play('tap');
            const result = await SillyTavern_API.callGenericPopup(
                '您确定要重置所有手机数据吗？<br><br>此操作将删除所有联系人、聊天记录、邮件、动态和自定义设置，且<b>无法撤销</b>。', 
                'confirm'
            );
            if (result) {
                await DataHandler.resetAllData();
            }
        })
        .on('click.phonesim', '#change-my-nickname', async () => {
            PhoneSim_Sounds.play('tap');
            const currentNickname = PhoneSim_State.customization.playerNickname || '我';
            const newNickname = await UI.showDialog('修改我的昵称', currentNickname);
            if (newNickname !== null && newNickname.trim() !== '') {
                DataHandler.savePlayerNickname(newNickname.trim());
            }
        })
        .on('click.phonesim', '#upload-player-avatar', () => { PhoneSim_Sounds.play('tap'); UI.fileUploadCallback = (d) => DataHandler.saveContactAvatar(PhoneSim_Config.PLAYER_ID, d); fileInput.click(); })
        .on('click.phonesim', '#upload-homescreen-wallpaper', () => { PhoneSim_Sounds.play('tap'); UI.fileUploadCallback = (d) => { PhoneSim_State.customization.homescreenWallpaper = d; DataHandler.saveCustomization(); UI.applyCustomizations(); }; fileInput.click(); })
        .on('click.phonesim', '#upload-chatlist-wallpaper', () => { PhoneSim_Sounds.play('tap'); UI.fileUploadCallback = (d) => { PhoneSim_State.customization.chatListWallpaper = d; DataHandler.saveCustomization(); UI.applyCustomizations(); }; fileInput.click(); })
        .on('click.phonesim', '#upload-chatview-wallpaper', () => { PhoneSim_Sounds.play('tap'); UI.fileUploadCallback = (d) => { PhoneSim_State.customization.chatViewWallpaper = d; DataHandler.saveCustomization(); UI.applyCustomizations(); }; fileInput.click(); })
        .on('click.phonesim', '.header-avatar.clickable-avatar', () => { PhoneSim_Sounds.play('tap'); if (PhoneSim_State.activeContactId) { UI.fileUploadCallback = (d) => DataHandler.saveContactAvatar(PhoneSim_State.activeContactId, d); fileInput.click(); } })
        .on('click.phonesim', '.avatar.clickable-avatar, .moment-avatar.clickable-avatar, .moment-poster-name.clickable-avatar, .phone-contact-avatar.clickable-avatar, .phone-contact-name.clickable-avatar', function() { PhoneSim_Sounds.play('tap'); const contactId = jQuery_API(this).data('contact-id'); if(contactId) UI.showView('Homepage', String(contactId)); })
        .on('click.phonesim', '.chatapp-bottom-nav .nav-item', function() { PhoneSim_Sounds.play('tap'); const target = jQuery_API(this).data('target'); p.find('.chatapp-bottom-nav .nav-item').removeClass('active'); jQuery_API(this).addClass('active'); p.find('#chatapp-view .subview').removeClass('active'); p.find(`#chatapp-view .subview[data-subview="${target}"]`).addClass('active'); PhoneSim_State.activeSubviews.chatapp = target; PhoneSim_State.saveUiState(); })
        .on('click.phonesim', '.phoneapp-bottom-nav .nav-item', function() { 
            PhoneSim_Sounds.play('tap'); 
            const target = jQuery_API(this).data('target'); 
            p.find('.phoneapp-bottom-nav .nav-item').removeClass('active'); 
            jQuery_API(this).addClass('active');
            if (target === 'log') {
                UI.showView('CallLog');
            } else {
                 p.find('#phoneapp-view .subview').removeClass('active'); 
                 p.find(`#phoneapp-view .phone-${target}-subview`).addClass('active'); 
                 PhoneSim_State.activeSubviews.phoneapp = target; 
                 PhoneSim_State.saveUiState();
            }
        })
        .on('click.phonesim', '#generate-moment-btn', () => { PhoneSim_Sounds.play('tap'); TavernHelper_API.triggerSlash(`/send (系统提示：请为任意一位角色生成一条新的朋友圈动态。)|/trigger`); })
        .on('click.phonesim', '#homepage-view #generate-profile-update-btn', () => { PhoneSim_Sounds.play('tap'); if (PhoneSim_State.activeProfileId) { const contactName = UI._getContactName(PhoneSim_State.activeProfileId); TavernHelper_API.triggerSlash(`/send (系统提示：请为 ${contactName} 更新个人主页并生成一条新的动态。)|/trigger`); } })
        .on('click.phonesim', '#post-moment-btn', async () => { PhoneSim_Sounds.play('tap'); const content = await UI.showDialog('发表新动态'); if(content) DataHandler.stagePlayerAction({ type: 'new_moment', momentId: 'staged_' + Date.now(), data: { content, images: [], timestamp: new Date().toISOString() } }); })
        .on('click.phonesim', '.moment-actions .like-btn', function() { PhoneSim_Sounds.play('tap'); const momentId = jQuery_API(this).closest('.moment-post').data('moment-id'); DataHandler.stagePlayerAction({ type: 'like', momentId }); })
        .on('click.phonesim', '.moment-actions .comment-btn', async function() { PhoneSim_Sounds.play('tap'); const momentId = jQuery_API(this).closest('.moment-post').data('moment-id'); const content = await UI.showDialog('发表评论'); if (content) DataHandler.stagePlayerAction({ type: 'comment', momentId, content, commentId: 'staged_comment_' + Date.now() }); });
    
    // Forum Event Listeners
    p.on('click.phonesim', '.back-to-board-list-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('ForumApp'); });
    p.on('click.phonesim', '.back-to-post-list-btn', () => { PhoneSim_Sounds.play('tap'); UI.showView('ForumPostList', PhoneSim_State.activeForumBoardId); });
    p.on('click.phonesim', '.forum-board-item', function() { PhoneSim_Sounds.play('tap'); UI.showView('ForumPostList', jQuery_API(this).data('board-id')); });
    p.on('click.phonesim', '.forum-post-item', function() { PhoneSim_Sounds.play('open'); UI.showView('ForumPostDetail', jQuery_API(this).data('post-id')); });
    p.on('click.phonesim', '#new-forum-post-btn', async function() {
        PhoneSim_Sounds.play('tap');
        const title = await UI.showDialog('输入帖子标题');
        if (title) {
            const content = await UI.showDialog('输入帖子内容');
            if (content) {
                DataHandler.stagePlayerAction({
                    type: 'new_forum_post',
                    boardId: PhoneSim_State.activeForumBoardId,
                    title: title,
                    content: content,
                    postId: 'staged_post_' + Date.now() 
                });
            }
        }
    });
    const sendForumReply = () => {
        const input = p.find('.forum-reply-input');
        const content = input.val().trim();
        if (content && PhoneSim_State.activeForumPostId) {
            PhoneSim_Sounds.play('send');
            DataHandler.stagePlayerAction({
                type: 'new_forum_reply',
                postId: PhoneSim_State.activeForumPostId,
                content: content,
                replyId: 'staged_reply_' + Date.now()
            });
            input.val('');
        }
    };
    p.on('click.phonesim', '.forum-reply-send-btn', sendForumReply);
    p.on('keypress.phonesim', '.forum-reply-input', function(e) { if (e.key === 'Enter') { sendForumReply(); } });

    // Browser Event Listeners
    if (!isBrowserInitialized) {
        const addressInput = p.find('#browser-address-input');
        
        const executeNavigation = () => {
            const value = addressInput.val().trim();
            if (value) {
                PhoneSim_Sounds.play('send');
                DataHandler.navigateTo(value);
            }
        };

        p.on('click.browser', '#browser-go-btn', executeNavigation);
        p.on('keydown.browser', '#browser-address-input', (e) => { if (e.key === 'Enter') executeNavigation(); });
        
        p.on('click.browser', '#browser-back-btn', () => { 
            PhoneSim_Sounds.play('tap'); 
            if (PhoneSim_State.browserHistoryIndex > 0) {
                DataHandler.goBack();
            } else {
                UI.showView('HomeScreen');
            }
        });

        p.on('click.browser', '#browser-refresh-btn', () => { PhoneSim_Sounds.play('tap'); DataHandler.refresh(); });
        
        p.on('click.browser', '#browser-home-btn', () => { 
            PhoneSim_Sounds.play('tap'); 
            DataHandler.clearHistory();
            addressInput.val(''); 
        });

        p.on('click.browser', '.back-to-browser-btn', () => { PhoneSim_Sounds.play('tap'); UI.renderBrowserState(); });
        
        p.on('click.browser', '#browser-bookmarks-btn', () => { 
            PhoneSim_Sounds.play('tap'); 
            UI.showBrowserSubview('history-bookmarks'); 
            UI.renderHistoryAndBookmarks(); 
        });

        p.on('click.browser', '#clear-history-btn', async function() {
            PhoneSim_Sounds.play('tap');
            const activeTab = p.find('#history-bookmarks-subview .tab-item.active').data('tab');
            const itemType = activeTab === 'history' ? '历史记录' : '书签';
            const result = await SillyTavern_API.callGenericPopup(`确定要清除所有${itemType}吗？`, 'confirm');
    
            if (result) {
                if (activeTab === 'history') {
                    await DataHandler.clearHistory();
                } else {
                    await DataHandler.clearBookmarks();
                }
                UI.renderHistoryAndBookmarks();
            }
        });

        p.on('click.browser', '.quick-search-item', function() {
            PhoneSim_Sounds.play('tap');
            const term = jQuery_API(this).data('term');
            addressInput.val(term);
            DataHandler.navigateTo(term);
        });
        
        p.on('click.browser', '.result-title', function() {
            PhoneSim_Sounds.play('open');
            const url = jQuery_API(this).data('url');
            const title = jQuery_API(this).data('title');
            DataHandler.navigateTo({ url, title });
        });

        p.on('click.browser', '#history-bookmarks-subview .item-info', function() {
            PhoneSim_Sounds.play('open');
            const url = jQuery_API(this).data('url');
            const title = jQuery_API(this).data('title');
            DataHandler.navigateTo({ url, title });
        });

        p.on('click.browser', '#history-bookmarks-subview .tab-item', function() {
            PhoneSim_Sounds.play('tap');
            const tab = jQuery_API(this).data('tab');
            p.find('#history-bookmarks-subview .tab-item').removeClass('active');
            jQuery_API(this).addClass('active');
            p.find('#history-bookmarks-subview .list-container').removeClass('active');
            p.find(`#history-bookmarks-subview .list-container[data-tab-content="${tab}"]`).addClass('active');
        });
    
        p.on('click.browser', '#browser-bookmark-toggle-btn', function() {
            PhoneSim_Sounds.play('tap');
            const currentUrl = PhoneSim_State.browserHistory[PhoneSim_State.browserHistoryIndex];
            const data = currentUrl ? PhoneSim_State.browserData[currentUrl] : null;
            if (data && data.title) {
                DataHandler.toggleBookmark(currentUrl, data.title);
            }
        });
    
        p.on('click.browser', '#history-bookmarks-subview .delete-item-btn', async function() {
            PhoneSim_Sounds.play('tap');
            const itemEl = jQuery_API(this).closest('.hb-list-item');
            const url = itemEl.data('url');
            const type = jQuery_API(this).data('type');
            
            if (type === 'history') {
                await DataHandler.deleteHistoryItem(url);
            } else if (type === 'bookmark') {
                await DataHandler.deleteBookmarkItem(url);
            }
            itemEl.remove();
            UI.updateNavControls();
        });

        isBrowserInitialized = true;
    }


    // Menu item handler
    p.on('click.phonesim', '.phone-sim-menu .menu-item', async function() {
        PhoneSim_Sounds.play('tap');
        const action = jQuery_API(this).data('action');
        const menu = jQuery_API(this).parent();
        const uid = menu.data('message-uid');
        const { commentId, momentId } = menu.data();
        menu.hide();
        
        if (action === 'add-friend') {
            const friendId = await UI.showDialog('添加好友', '输入好友ID或昵称...');
            if(friendId) {
                TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}尝试添加好友：“${friendId}”。)`);
            }
            return;
        }
        if (action === 'start-group-chat') {
            UI.showView('GroupCreation');
            return;
        }


        // Chat Message Actions
        if (uid) {
            let updateType = null;
            if (action === 'delete') {
                const confirmed = await SillyTavern_API.callGenericPopup('确定删除?', 'confirm');
                if (confirmed) {
                    updateType = await DataHandler.deleteMessageByUid(uid);
                }
            } else if (action === 'edit') {
                const message = DataHandler.findMessageByUid(uid);
                if (message && typeof message.content === 'string') {
                    const newContent = await UI.showDialog('修改消息', message.content);
                    if (newContent !== null) {
                        updateType = await DataHandler.editMessageByUid(uid, newContent);
                    }
                } else if (message) {
                    SillyTavern_API.callGenericPopup('无法编辑富文本消息。', 'text');
                }
            } else if (action === 'recall') {
                updateType = await DataHandler.recallMessageByUid(uid);
            }

            if (updateType) {
                if (updateType === 'worldbook') {
                    await DataHandler.fetchAllData();
                }
                UI.rerenderCurrentView({ chatUpdated: true });
                UI.updateCommitButton();
            }
        } 
        // Moment Comment Actions
        else if (commentId && momentId) {
            if (action === 'edit_comment') {
                const content = await UI.showDialog('修改评论');
                if (content !== null) DataHandler.stagePlayerAction({ type: 'edit_comment', momentId, commentId, content });
            } else if (action === 'recall_comment' || action === 'delete_comment') {
                DataHandler.stagePlayerAction({ type: action, momentId, commentId });
            }
        } 
        // Moment Post Actions
        else if (momentId) {
            if (action === 'edit_moment') {
                const moment = PhoneSim_State.moments.find(m => m.momentId === momentId);
                if(moment && typeof moment.content === 'string') {
                    const content = await UI.showDialog('修改动态', moment.content);
                    if (content !== null) DataHandler.stagePlayerAction({ type: 'edit_moment', momentId, content });
                }
            } else if (action === 'delete_moment') {
                if (await SillyTavern_API.callGenericPopup('确定删除此动态吗?', 'confirm')) {
                    DataHandler.stagePlayerAction({ type: 'delete_moment', momentId });
                }
            }
        }
    });
    
    // Other specific handlers...
    p.on('scroll.phonesim', '.chat-messages', function() {
        const el = jQuery_API(this);
        const btn = p.find('.scroll-to-bottom-btn');
        if (el[0].scrollHeight - el.scrollTop() - el.height() > 150) {
            btn.addClass('visible');
        } else {
            btn.removeClass('visible');
            btn.find('.unread-badge').hide().text('');
        }
    });
    p.on('click.phonesim', '.scroll-to-bottom-btn', function() {
        PhoneSim_Sounds.play('tap');
        const chatMessages = p.find('.chat-messages');
        chatMessages.animate({ scrollTop: chatMessages[0].scrollHeight }, 300);
    });

    b.on('click.phonesim', '.delete-contact-btn', async function(e) { e.stopPropagation(); PhoneSim_Sounds.play('tap'); const id = jQuery_API(this).data('id'); if (await SillyTavern_API.callGenericPopup(`确定删除此对话吗?`, 'confirm')) { await DataHandler.deleteContact(id); UI.renderContactsList(); } });
    b.on('click.phonesim', '#chat-list-actions-btn', function(e){ e.stopPropagation(); PhoneSim_Sounds.play('tap'); p.find('.phone-sim-menu').hide(); const menu = p.find('#manage-chats-menu'); const button = jQuery_API(this); const panelRect = p[0].getBoundingClientRect(); const buttonRect = button[0].getBoundingClientRect(); const top = (buttonRect.top - panelRect.top) + button.outerHeight() + 5; let left = (buttonRect.left - panelRect.left) - menu.outerWidth() + button.outerWidth(); if (left < 5) left = 5; menu.css({ top, left }).toggle(); });
    b.on('click.phonesim', '#add-chat-btn', function(e){ e.stopPropagation(); PhoneSim_Sounds.play('tap'); p.find('.phone-sim-menu').hide(); const menu = p.find('#add-chat-menu'); const button = jQuery_API(this); const panelRect = p[0].getBoundingClientRect(); const buttonRect = button[0].getBoundingClientRect(); const top = (buttonRect.top - panelRect.top) + button.outerHeight() + 5; let left = (buttonRect.left - panelRect.left) - menu.outerWidth() + button.outerWidth(); if (left < 5) left = 5; menu.css({ top, left }).toggle(); });
    b.on('click.phonesim', '#moments-actions-btn', function(e){ e.stopPropagation(); PhoneSim_Sounds.play('tap'); p.find('.phone-sim-menu').hide(); const menu = p.find('#manage-moments-menu'); const button = jQuery_API(this); const panelRect = p[0].getBoundingClientRect(); const buttonRect = button[0].getBoundingClientRect(); const top = (buttonRect.top - panelRect.top) + button.outerHeight() + 5; let left = (buttonRect.left - panelRect.left) - menu.outerWidth() + button.outerWidth(); if (left < 5) left = 5; menu.css({ top, left }).toggle(); });
    b.on('click.phonesim', '#action-clear-all-history', async function(){ p.find('#manage-chats-menu').hide(); if(await SillyTavern_API.callGenericPopup('确定清空所有聊天记录吗？', 'confirm')) { PhoneSim_Sounds.play('tap'); await DataHandler.clearAllChatHistory(); await DataHandler.fetchAllData(); UI.renderContactsList(); } });
    b.on('click.phonesim', '#action-clear-all-moments', async function(){ p.find('#manage-moments-menu').hide(); if(await SillyTavern_API.callGenericPopup('确定清空所有动态吗？', 'confirm')) { PhoneSim_Sounds.play('tap'); await DataHandler.clearAllMoments(); await DataHandler.fetchAllData(); if (p.find('#moments-view').hasClass('active')) { UI.renderMomentsView(); } } });

    p.on('contextmenu.phonesim', '.moment-comment.player-comment', function(e) {
        e.preventDefault();
        e.stopPropagation();
        PhoneSim_Sounds.play('tap');
        p.find('.phone-sim-menu').hide(); 
        const commentId = jQuery_API(this).data('comment-id');
        const momentId = jQuery_API(this).closest('.moment-post').data('moment-id');
        const menu = p.find('#moment-comment-actions-menu');
        const panelRect = p[0].getBoundingClientRect();
        const top = e.clientY - panelRect.top;
        let left = e.clientX - panelRect.left;
        if (left + menu.outerWidth() > panelRect.width - 5) {
            left = left - menu.outerWidth();
        }
        menu.data({commentId, momentId}).css({top, left}).show();
    });
    
    p.on('click.phonesim', '.call-ui-internal .voice-input-btn', function(){
        PhoneSim_Sounds.play('tap');
        jQuery_API(parentWin.document.body).find('#phone-sim-call-input-overlay').show().find('textarea').focus();
    });
    b.on('click.phonesim', '#phone-sim-call-input-cancel', function(){
        PhoneSim_Sounds.play('tap');
        jQuery_API(this).closest('.phone-sim-dialog-overlay').hide();
    });
    b.on('click.phonesim', '#phone-sim-call-input-confirm', function(){
        PhoneSim_Sounds.play('send');
        const modal = jQuery_API(this).closest('.phone-sim-dialog-overlay');
        const textarea = modal.find('textarea');
        const content = textarea.val().trim();
        textarea.val('');
        modal.hide();
        if (content) {
            const isVoiceCall = PhoneSim_State.isVoiceCallActive;
            const callData = isVoiceCall ? PhoneSim_State.activeCallData : PhoneSim_State.activePhoneCallData;
            if (callData) {
                const contactName = UI._getContactName(callData.id);
                const callType = isVoiceCall ? '微信语音' : '电话';
                TavernHelper_API.triggerSlash(`/send (系统提示：{{user}}在与${contactName}的${callType}中说：“${content}”。)|/trigger`);
            }
        }
    });

    p.on('click.phonesim', '#mute-switch', function(){
        const isActive = jQuery_API(this).toggleClass('active').hasClass('active');
        PhoneSim_State.customization.isMuted = isActive;
        DataHandler.saveCustomization();
        PhoneSim_Sounds.play('toggle');
    });

    const dialerDisplay = p.find('.dialer-display');
    p.on('click.phonesim', '.dial-key', function() { PhoneSim_Sounds.play('tap'); dialerDisplay.val(dialerDisplay.val() + jQuery_API(this).data('key')); });
    p.on('click.phonesim', '.dialer-backspace', function() { PhoneSim_Sounds.play('tap'); dialerDisplay.val(dialerDisplay.val().slice(0, -1)); });
    p.on('click.phonesim', '.dial-call-btn', function() { 
        PhoneSim_Sounds.play('open');
        const number = dialerDisplay.val();
        if (!number) return;
        const contact = Object.entries(PhoneSim_State.contacts).find(([id, c]) => id === number);
        const callTarget = contact ? { id: contact[0], name: contact[1].profile.note || contact[1].profile.nickname } : { id: number, name: number };
        DataHandler.initiatePhoneCall(callTarget);
    });

    const emojiContainer = p.find('.emoji-picker-container');
    const emojiPicker = emojiContainer.find('emoji-picker')[0];
    const inputField = p.find('.input-field');
    p.find('.emoji-btn').on('click.phonesim', (e) => { e.stopPropagation(); PhoneSim_Sounds.play('tap'); emojiContainer.toggle(); });
    if(emojiPicker) emojiPicker.addEventListener('emoji-click', e => { inputField.val(inputField.val() + e.detail.unicode); emojiContainer.hide(); });

    b.on('click.phonesim', (e) => {
        const target = jQuery_API(e.target);
        if (!target.closest('.phone-sim-menu, .message-actions, .moment-actions-trigger, #chat-list-actions-btn, #add-chat-btn, #moments-actions-btn, .moment-comment.player-comment').length) {
            p.find('.phone-sim-menu').hide();
        }
        if (emojiContainer.is(':visible') && !target.closest('.emoji-picker-container, .emoji-btn').length) {
            emojiContainer.hide();
        }
    });

    UI.makeDraggable(p);
    jQuery_API(parentWin).on('resize.phonesim', () => UI.updateScaleAndPosition());
}
