



import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let jQuery_API, parentWin, SillyTavern_API, UI, DataHandler;

const PANEL_HTML_CONTENT = `
<div id="phone-sim-panel-v10-0" class="phone-container" style="display:none;">
    <div id="phone-sim-notification-banner"></div>
    <div class="phone-notch"></div>
    <div class="status-bar"><div class="status-bar-left"><span class="status-time"></span></div><div class="status-bar-right"><i class="fas fa-signal"></i><i class="fas fa-wifi"></i><i class="fas fa-battery-three-quarters"></i></div></div>
    <div class="views-container">
        <div id="homescreen-view" class="view active" data-nav-level="0"><div class="app-grid"></div><div class="dock-bar"></div></div>
        <div id="chatapp-view" class="view" data-nav-level="1">
            <div class="subview-wrapper">
                 <div class="chat-list-subview subview active" data-subview="messages">
                    <div class="app-header">
                        <button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button>
                        <h3>消息</h3>
                        <div class="header-actions-group">
                            <div class="header-actions" id="add-chat-btn"><i class="fas fa-plus"></i></div>
                            <div class="header-actions" id="chat-list-actions-btn"><i class="fas fa-ellipsis-v"></i></div>
                        </div>
                    </div>
                    <div class="chat-list-content"></div>
                </div>
                <div class="contacts-subview subview" data-subview="contacts">
                    <div class="app-header"><button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button><h3>通讯录</h3></div>
                    <div class="contacts-list-content"></div>
                </div>
                <div class="discover-subview subview" data-subview="discover">
                    <div class="app-header"><button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button><h3>发现</h3></div>
                    <div class="discover-list">
                        <div class="discover-item" id="discover-moments">
                            <i class="fas fa-images"></i>
                            <span>朋友圈</span>
                            <div class="discover-badge"></div>
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
                <div class="me-subview subview" data-subview="me">
                    <div class="app-header"><button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button><h3>我</h3></div>
                    <div class="me-content"></div>
                </div>
                <div class="chat-view-subview subview" data-subview="chat-conversation">
                    <div class="chat-header"><button class="back-to-list-btn"><i class="fas fa-chevron-left"></i></button><div class="header-info"><img src="" class="header-avatar clickable-avatar"><div class="header-text"><div class="chat-name-wrapper"><h2 class="chat-name"></h2><i class="fas fa-pencil-alt edit-note-btn"></i></div><div class="header-status" style="display:none;"><div class="status-dot"></div>在线</div></div></div><div class="header-icons"><i class="fas fa-phone call-btn"></i><i class="fas fa-users members-btn"></i></div></div>
                    <div class="chat-messages">
                        <div class="chat-loader" style="display: none;"></div>
                    </div>
                    <button class="scroll-to-bottom-btn"><i class="fas fa-chevron-down"></i><span class="unread-badge"></span></button>
                    <div class="chat-input"><button class="emoji-btn"><i class="fas fa-smile"></i></button><textarea class="input-field" rows="1" placeholder="输入..."></textarea><button class="send-btn"><i class="fas fa-paper-plane"></i></button><div class="emoji-picker-container" style="display:none;"><emoji-picker></emoji-picker></div></div>
                </div>
                <div class="group-members-subview subview" data-subview="group-members">
                    <div class="app-header"><button class="back-to-chat-btn"><i class="fas fa-chevron-left"></i></button><h3>群成员</h3></div>
                    <div class="group-members-list"></div>
                </div>
                <div class="group-invite-subview subview" data-subview="group-invite">
                    <div class="app-header"><button class="back-to-members-btn"><i class="fas fa-chevron-left"></i></button><h3>邀请好友</h3><button id="confirm-invite-btn" class="header-confirm-btn">确定</button></div>
                    <div class="invite-contact-list"></div>
                </div>
                 <div class="group-creation-subview subview" data-subview="group-creation">
                    <div class="app-header"><button class="back-to-messages-btn"><i class="fas fa-chevron-left"></i></button><h3>发起群聊</h3><button id="confirm-group-creation-btn" class="header-confirm-btn" disabled>完成(0)</button></div>
                    <div class="group-creation-contact-list"></div>
                </div>
            </div>
            <div class="chatapp-bottom-nav">
                <div class="nav-item active" data-target="messages"><i class="fas fa-comment"></i><span>消息</span><div class="nav-badge"></div></div>
                <div class="nav-item" data-target="contacts"><i class="fas fa-address-book"></i><span>通讯录</span><div class="nav-badge"></div></div>
                <div class="nav-item" data-target="discover"><i class="fas fa-compass"></i><span>发现</span><div class="nav-badge"></div></div>
                <div class="nav-item" data-target="me"><i class="fas fa-user"></i><span>我</span></div>
            </div>
        </div>
        <div id="moments-view" class="view" data-nav-level="2">
             <div class="app-header"><button class="back-to-discover-btn"><i class="fas fa-chevron-left"></i></button><h3>朋友圈</h3>
                <div class="moments-header-actions-wrapper">
                    <div class="header-actions" id="moments-notify-btn" title="查看通知">
                        <i class="fas fa-bell"></i>
                        <div class="header-badge"></div>
                    </div>
                    <div class="header-actions" id="generate-moment-btn" title="生成新动态"><i class="fas fa-plus"></i></div>
                    <div class="header-actions" id="moments-actions-btn"><i class="fas fa-ellipsis-v"></i></div>
                    <div class="header-actions" id="post-moment-btn" title="发表动态"><i class="fas fa-camera"></i></div>
                </div>
            </div>
             <div class="moments-timeline"></div>
        </div>
        <div id="homepage-view" class="view" data-nav-level="2"><div class="homepage-content-wrapper"></div></div>
        <div id="phoneapp-view" class="view" data-nav-level="1">
            <div class="subview-wrapper">
                <div class="phone-contacts-subview subview active" data-subview="contacts">
                    <div class="app-header">
                        <button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button>
                        <h3>通讯录</h3>
                    </div>
                    <div class="phone-contact-list"></div>
                </div>
                <div class="phone-log-subview subview" data-subview="log">
                    <div class="app-header">
                        <button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button>
                        <h3>通话记录</h3>
                    </div>
                    <div class="call-log-list"></div>
                </div>
                <div class="phone-dialer-subview subview" data-subview="dialer">
                    <div class="app-header">
                        <button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button>
                        <h3>拨号键盘</h3>
                    </div>
                     <div class="dialer-ui">
                         <div class="dialer-display-wrapper"><input type="text" class="dialer-display" readonly><button class="dialer-backspace"><i class="fas fa-backspace"></i></button></div>
                         <div class="dialer-grid">
                            <div class="dial-key" data-key="1">1</div> <div class="dial-key" data-key="2">2<span>ABC</span></div> <div class="dial-key" data-key="3">3<span>DEF</span></div>
                            <div class="dial-key" data-key="4">4<span>GHI</span></div> <div class="dial-key" data-key="5">5<span>JKL</span></div> <div class="dial-key" data-key="6">6<span>MNO</span></div>
                            <div class="dial-key" data-key="7">7<span>PQRS</span></div><div class="dial-key" data-key="8">8<span>TUV</span></div> <div class="dial-key" data-key="9">9<span>WXYZ</span></div>
                            <div class="dial-key" data-key="*">*</div> <div class="dial-key" data-key="0">0<span>+</span></div> <div class="dial-key" data-key="#">#</div>
                         </div>
                         <div class="dialer-actions"><button class="dial-call-btn"><i class="fas fa-phone"></i></button></div>
                     </div>
                </div>
            </div>
            <div class="phoneapp-bottom-nav">
                 <div class="nav-item active" data-target="contacts"><i class="fas fa-address-book"></i><span>通讯录</span></div>
                 <div class="nav-item" data-target="log"><i class="fas fa-history"></i><span>通话记录</span></div>
                 <div class="nav-item" data-target="dialer"><i class="fas fa-grip-horizontal"></i><span>拨号键盘</span></div>
            </div>
        </div>
        <div id="emailapp-view" class="view" data-nav-level="1"></div>
        <div id="settingsapp-view" class="view" data-nav-level="1">
            <div class="settings-menu-subview subview active">
                <div class="app-header"><button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button><h3>设置</h3></div>
                <div class="settings-content">
                    <div class="settings-group"><h4>通用</h4><div class="settings-item"><span>静音模式</span><div class="toggle-switch" id="mute-switch"><div class="toggle-handle"></div></div></div></div>
                    <div class="settings-group"><h4>个性化</h4>
                        <div class="settings-item" data-subview="wallpaper-settings"><span>背景与壁纸</span><i class="fas fa-chevron-right"></i></div>
                        <div class="settings-item" id="upload-player-avatar"><span>我的头像</span><i class="fas fa-chevron-right"></i></div>
                        <div class="settings-item" id="change-my-nickname"><span>我的昵称</span><i class="fas fa-chevron-right"></i></div>
                        <div class="settings-item" id="reset-ui-position"><span>重置UI位置</span></div>
                    </div>
                    <div class="settings-group"><h4>数据管理</h4>
                        <div class="settings-item danger-item" id="reset-all-data"><span>重置所有数据</span></div>
                    </div>
                </div>
            </div>
            <div class="wallpaper-settings-subview subview">
                 <div class="app-header"><button class="back-to-settings-menu-btn"><i class="fas fa-chevron-left"></i></button><h3>背景与壁纸</h3></div>
                 <div class="settings-content">
                    <div class="settings-group"><h4>壁纸设置</h4>
                        <div class="settings-item" id="upload-homescreen-wallpaper"><span>主屏幕壁纸</span><i class="fas fa-chevron-right"></i></div>
                        <div class="settings-item" id="upload-chatlist-wallpaper"><span>消息列表背景</span><i class="fas fa-chevron-right"></i></div>
                        <div class="settings-item" id="upload-chatview-wallpaper"><span>聊天窗口背景</span><i class="fas fa-chevron-right"></i></div>
                    </div>
                </div>
            </div>
        </div>
        <div id="browserapp-view" class="view" data-nav-level="1">
            <div class="browser-header">
                <div class="browser-nav-controls">
                    <button id="browser-back-btn" class="nav-btn"><i class="fas fa-chevron-left"></i></button>
                    <button id="browser-refresh-btn" class="nav-btn"><i class="fas fa-redo"></i></button>
                </div>
                <div class="browser-address-bar-container">
                    <i class="fas fa-search address-bar-icon"></i>
                    <input type="text" id="browser-address-input" placeholder="搜索或输入网址">
                    <button id="browser-bookmark-toggle-btn" class="bookmark-btn"><i class="far fa-star"></i></button>
                    <button id="browser-go-btn" class="browser-send-btn"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="browser-menu-controls">
                    <button id="browser-home-btn" class="nav-btn"><i class="fas fa-home"></i></button>
                    <button id="browser-bookmarks-btn" class="nav-btn"><i class="fas fa-book-open"></i></button>
                </div>
            </div>
            <div class="browser-content">
                <div id="search-home-subview" class="browser-subview active">
                    <div class="search-home-content">
                        <h1 class="search-engine-logo">Tavern搜索</h1>
                        <div class="quick-search-grid">
                            <div class="quick-search-item" data-term="今日新闻">
                                <i class="fas fa-newspaper"></i>
                                <span>新闻</span>
                            </div>
                            <div class="quick-search-item" data-term="附近美食">
                                <i class="fas fa-utensils"></i>
                                <span>美食</span>
                            </div>
                            <div class="quick-search-item" data-term="本地天气">
                                <i class="fas fa-cloud-sun"></i>
                                <span>天气</span>
                            </div>
                            <div class="quick-search-item" data-term="百科知识">
                                <i class="fas fa-book-open"></i>
                                <span>百科</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="search-results-subview" class="browser-subview">
                    <div id="browser-search-results-list" class="search-results-list"></div>
                </div>
                <div id="webpage-subview" class="browser-subview">
                    <div id="webpage-content" class="webpage-content"></div>
                </div>
                <div id="history-bookmarks-subview" class="browser-subview">
                    <div class="app-header">
                        <button class="back-to-browser-btn"><i class="fas fa-chevron-left"></i></button>
                        <h3>资料库</h3>
                        <button id="clear-history-btn" class="header-action-btn">清除</button>
                    </div>
                    <div class="tabs">
                        <div class="tab-item active" data-tab="history">历史记录</div>
                        <div class="tab-item" data-tab="bookmarks">书签</div>
                        <div class="tab-item" data-tab="directory">网站目录</div>
                    </div>
                    <div class="tab-content">
                        <div id="history-list" class="list-container active" data-tab-content="history"></div>
                        <div id="bookmarks-list" class="list-container" data-tab-content="bookmarks"></div>
                        <div id="directory-list" class="list-container" data-tab-content="directory"></div>
                    </div>
                </div>
            </div>
        </div>
        <div id="forumapp-view" class="view" data-nav-level="1">
            <div class="forum-board-list-subview subview active">
                <div class="app-header">
                    <button class="back-to-home-btn"><i class="fas fa-chevron-left"></i></button>
                    <h3>论坛</h3>
                </div>
                <div class="forum-board-list-content"></div>
            </div>
            <div class="forum-post-list-subview subview">
                <div class="app-header">
                    <button class="back-to-board-list-btn"><i class="fas fa-chevron-left"></i></button>
                    <h3 class="post-list-header"></h3>
                    <div class="header-actions" id="new-forum-post-btn" title="新帖子"><i class="fas fa-plus"></i></div>
                </div>
                <div class="forum-post-list-content"></div>
            </div>
            <div class="forum-post-detail-subview subview">
                <div class="app-header">
                    <button class="back-to-post-list-btn"><i class="fas fa-chevron-left"></i></button>
                    <h3>帖子详情</h3>
                </div>
                <div class="forum-post-detail-content"></div>
                <div class="forum-reply-bar">
                    <input type="text" class="forum-reply-input" placeholder="添加回复...">
                    <button class="forum-reply-send-btn"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
        <div id="voicecall-view" class="view" data-nav-level="2"></div>
        <div id="phonecall-view" class="view" data-nav-level="2"></div>
    </div>
    <div id="phone-sim-commit-btn-v10-0" class="commit-button" title="继续剧情">▶</div>
    <div class="voice-call-modal" style="display: none;">
        <audio class="voice-call-audio" loop src="https://files.catbox.moe/23kcq4.mp3"></audio>
        <div class="caller-avatar-container"><img src="" class="caller-avatar"></div>
        <div class="caller-name"></div>
        <div class="call-status">正在呼叫...</div>
        <div class="call-buttons"><button class="call-button reject-call"><i class="fas fa-phone-slash"></i></button><button class="call-button accept-call"><i class="fas fa-phone"></i></button></div>
    </div>
    <div id="manage-chats-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" id="action-clear-all-history">清空所有聊天记录</div></div>
    <div id="add-chat-menu" class="phone-sim-menu" style="display:none;">
        <div class="menu-item" data-action="add-friend">添加好友</div>
        <div class="menu-item" data-action="start-group-chat">发起群聊</div>
    </div>
    <div id="manage-moments-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" id="action-clear-all-moments">清空所有动态</div></div>
    <div id="message-actions-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" data-action="recall">撤回</div><div class="menu-item" data-action="edit">修改</div><div class="menu-item" data-action="delete">删除</div></div>
    <div id="player-moment-actions-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" data-action="edit_moment">修改</div><div class="menu-item" data-action="delete_moment">删除</div></div>
    <div id="npc-moment-actions-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" data-action="delete_moment">删除</div></div>
    <div id="moment-comment-actions-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" data-action="edit_comment">修改</div><div class="menu-item" data-action="recall_comment">撤回</div><div class="menu-item" data-action="delete_comment">删除</div></div>
    <div id="npc-message-actions-menu" class="phone-sim-menu" style="display:none;"><div class="menu-item" data-action="delete">删除</div></div>
    <div id="phone-sim-moments-notify-modal" class="phone-sim-modal-overlay" style="display:none;">
        <div class="phone-sim-notify-modal-content">
            <div class="phone-sim-notify-modal-header">
                <h3>通知</h3>
                <button class="phone-sim-notify-close">&times;</button>
            </div>
            <div class="phone-sim-notify-list"></div>
        </div>
    </div>
</div>
<div id="phone-sim-dialog-overlay" class="phone-sim-dialog-overlay" style="display:none;">
    <div class="phone-sim-dialog">
        <h3 id="phone-sim-dialog-title"></h3>
        <div class="dialog-content"><textarea id="phone-sim-dialog-textarea" class="dialog-input"></textarea></div>
        <div class="dialog-buttons"><button id="phone-sim-dialog-cancel" class="dialog-btn cancel-btn">取消</button><button id="phone-sim-dialog-confirm" class="dialog-btn confirm-btn">确认</button></div>
    </div>
</div>
<div id="phone-sim-call-input-overlay" class="phone-sim-dialog-overlay" style="display:none;">
    <div class="phone-sim-dialog">
        <h3 id="phone-sim-call-input-title">你说：</h3>
        <div class="dialog-content">
            <textarea id="phone-sim-call-input-textarea" class="dialog-input" placeholder="输入你想说的话..."></textarea>
        </div>
        <div class="dialog-buttons">
            <button id="phone-sim-call-input-cancel" class="dialog-btn cancel-btn">取消</button>
            <button id="phone-sim-call-input-confirm" class="dialog-btn confirm-btn">发送</button>
        </div>
    </div>
</div>
<div id="email-reply-modal" class="phone-sim-dialog-overlay" style="display:none;">
    <div class="phone-sim-dialog">
        <h3 id="email-reply-title"></h3>
        <div class="dialog-content"><textarea id="email-reply-textarea" class="dialog-input" placeholder="输入回复内容..."></textarea></div>
        <div class="dialog-buttons"><button id="email-reply-cancel" class="dialog-btn cancel-btn">取消</button><button id="email-reply-confirm" class="dialog-btn confirm-btn">发送</button></div>
    </div>
</div>
<div id="phone-sim-transfer-modal" class="phone-sim-modal-overlay" style="display:none;">
    <div class="transfer-modal-content">
        <div class="transfer-modal-header">
            <h3 class="transfer-modal-title">确认收款</h3>
            <p class="transfer-modal-subtitle"></p>
        </div>
        <div class="transfer-modal-amount"></div>
        <div class="transfer-modal-note"></div>
        <div class="transfer-modal-buttons">
            <button class="modal-btn cancel-btn">稍后</button>
            <button class="modal-btn confirm-btn">确认收款</button>
        </div>
    </div>
</div>
<div id="phone-sim-red-packet-modal" class="phone-sim-modal-overlay" style="display:none;">
    <div class="red-packet-modal-content">
        <button class="red-packet-close cancel-btn">&times;</button>
        <div class="red-packet-sender"></div>
        <div class="red-packet-note"></div>
        <div class="red-packet-open-btn confirm-btn">开</div>
    </div>
</div>
 <input type="file" id="phone-sim-file-input" accept="image/*" style="visibility: hidden; position: absolute; top: -50px; left: -50px; width: 0; height: 0;">
`;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_API = deps.st;
    UI = uiObject;
    DataHandler = dataHandler;
}

export async function initializeUI() {
    try {
        const body = jQuery_API(parentWin.document.body);
        
        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length > 0) {
            console.warn(`[Phone Sim] Panel already exists. Aborting UI creation.`);
            return true;
        }
        
        body.append(PANEL_HTML_CONTENT);
        
        if (body.find(`#${PhoneSim_Config.PANEL_ID}`).length === 0) {
             throw new Error("Panel element not found in DOM after injection.");
        }

        if (!parentWin.document.querySelector('script[src*=\"emoji-picker-element\"]')) {
            const script = parentWin.document.createElement('script');
            script.type = 'module';
            script.src = 'https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js';
            parentWin.document.head.appendChild(script);
        }

        const buttonId = PhoneSim_Config.TOGGLE_BUTTON_ID;
        if (body.find(`#${buttonId}`).length) {
            body.find(`#${buttonId}`).remove();
        }
        const toggleButton = jQuery_API(`<div id="${buttonId}" title="手机模拟器">📱<div class="unread-badge" style="display:none;"></div></div>`);
        body.append(toggleButton);
        
        UI.updateScaleAndPosition();
        UI.populateApps(); 
        UI.updateTime();
        UI.applyCustomizations();
        UI.addEventListeners();

        body.find(`#${PhoneSim_Config.PANEL_ID}`).hide();

        return true;

    } catch (error) {
        console.error(`[Phone Sim] CRITICAL UI Initialization Failure:`, error);
        toastr.error("手机模拟器插件UI加载失败，请检查控制台以获取详细信息并尝试刷新页面。", "严重错误", { timeOut: 10000 });
        return false;
    }
}


export async function togglePanel(forceShow) {
    const panel = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const shouldBeVisible = typeof forceShow === 'boolean' ? forceShow : !panel.is(':visible');
    
    PhoneSim_State.isPanelVisible = shouldBeVisible;
    
    if (shouldBeVisible) {
        panel.show(); 
        await DataHandler.fetchAllData(); 
        
        const viewToRestore = PhoneSim_State.currentView || 'HomeScreen';
        const data = viewToRestore === 'ChatConversation' ? PhoneSim_State.activeContactId 
                   : viewToRestore === 'EmailDetail' ? PhoneSim_State.activeEmailId 
                   : viewToRestore === 'Homepage' ? PhoneSim_State.activeProfileId
                   : viewToRestore === 'ForumPostList' ? PhoneSim_State.activeForumBoardId
                   : viewToRestore === 'ForumPostDetail' ? PhoneSim_State.activeForumPostId
                   : null;
        await UI.showView(viewToRestore, data, false);
    } else { 
        panel.hide(); 
        PhoneSim_State.activeContactId = null; 
    } 
    
    PhoneSim_State.saveUiState();
}

export async function showView(v, data, isAnimated = true) {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    
    const viewMap = {
        'chatconversation': 'chatapp', 'emaildetail': 'emailapp', 'discover': 'chatapp',
        'moments': 'moments', 'homepage': 'homepage', 'phoneapp': 'phoneapp',
        'emailapp': 'emailapp', 'settingsapp': 'settingsapp', 'homescreen': 'homescreen',
        'voicecall': 'voicecall', 'phonecall': 'phonecall', 'groupmembers': 'chatapp', 'groupinvite': 'chatapp',
        'groupcreation': 'chatapp', 'calllog': 'phoneapp', 'browserapp': 'browserapp', 'forumapp': 'forumapp',
        'forumpostlist': 'forumapp', 'forumpostdetail': 'forumapp'
    };
    let viewIdToShow = viewMap[v.toLowerCase()] || v.toLowerCase();
    
    const newView = p.find(`#${viewIdToShow}-view`);
    const oldView = p.find('.view.active');

    // --- Animation Logic ---
    if (oldView.length === 0 || oldView[0] === newView[0]) {
        if (!newView.hasClass('active')) newView.addClass('active');
    } else {
        const oldLevel = parseInt(oldView.attr('data-nav-level'), 10) || 0;
        const newLevel = parseInt(newView.attr('data-nav-level'), 10) || 0;
        
        let enterClass, exitClass;
        
        if (isAnimated) {
             if (oldLevel === 0 && newLevel > 0) { // From Home to App
                enterClass = 'view-enter-zoom';
                exitClass = 'view-exit-fade';
            } else if (newLevel === 0 && oldLevel > 0) { // From App to Home
                enterClass = 'view-enter-fade';
                exitClass = 'view-exit-zoom';
            } else { // In-app navigation
                const isForward = newLevel > oldLevel;
                enterClass = isForward ? 'view-enter-right' : 'view-enter-left';
                exitClass = isForward ? 'view-exit-left' : 'view-exit-right';
            }
            
            newView.addClass(enterClass).addClass('is-transitioning');
            oldView.addClass('is-transitioning');
            newView.addClass('active');

            requestAnimationFrame(() => {
                newView.removeClass(enterClass).addClass('view-in');
                oldView.addClass(exitClass).removeClass('active');
            });

            setTimeout(() => {
                oldView.removeClass(`is-transitioning view-in ${exitClass}`);
                newView.removeClass('is-transitioning view-in');
            }, 350);
        } else {
            oldView.removeClass('active');
            newView.addClass('active');
        }
    }

    // --- Post-transition Content Rendering & State Update ---
    const renderContent = async () => {
        if (v === 'HomeScreen') {
             PhoneSim_State.activeContactId = null;
             PhoneSim_State.activeEmailId = null;
             PhoneSim_State.activeProfileId = null;
             PhoneSim_State.activeForumBoardId = null;
             PhoneSim_State.activeForumPostId = null;
        }
    
        if (v === 'ChatApp') { UI.renderContactsList(); const c = p.find('#chatapp-view'); c.removeClass('in-conversation in-management'); c.find('.subview').removeClass('active'); c.find('.chat-list-subview').addClass('active'); PhoneSim_State.activeSubviews.chatapp = 'messages'; }
        else if (v === 'ChatConversation') { await UI.renderChatView(data, 'WeChat'); UI.triggerPendingAnimations(data); const c = p.find('#chatapp-view'); c.addClass('in-conversation').removeClass('in-management'); p.find('#chatapp-view .subview').removeClass('active'); p.find('#chatapp-view .chat-view-subview').addClass('active'); PhoneSim_State.activeContactId = data; } 
        else if (v === 'Discover') { const c = p.find('#chatapp-view'); c.removeClass('in-conversation in-management'); c.find('.subview').removeClass('active'); c.find('.discover-subview').addClass('active'); PhoneSim_State.activeSubviews.chatapp = 'discover'; }
        else if (v === 'GroupMembers') { UI.renderGroupMembersView(PhoneSim_State.activeContactId); const c = p.find('#chatapp-view'); c.addClass('in-management'); c.find('.subview').removeClass('active'); c.find('.group-members-subview').addClass('active'); }
        else if (v === 'GroupInvite') { UI.renderGroupInviteView(PhoneSim_State.activeContactId); const c = p.find('#chatapp-view'); c.addClass('in-management'); c.find('.subview').removeClass('active'); c.find('.group-invite-subview').addClass('active'); }
        else if (v === 'GroupCreation') { UI.renderGroupCreationView(); const c = p.find('#chatapp-view'); c.addClass('in-management'); c.find('.subview').removeClass('active'); c.find('.group-creation-subview').addClass('active'); }
        else if (v === 'PhoneApp') { UI.renderPhoneContactList(); const ph = p.find('#phoneapp-view'); ph.find('.subview').removeClass('active'); ph.find('.phone-contacts-subview').addClass('active'); PhoneSim_State.activeSubviews.phoneapp = 'contacts'; }
        else if (v === 'CallLog') { UI.renderCallLogView(); const ph = p.find('#phoneapp-view'); ph.find('.subview').removeClass('active'); ph.find('.phone-log-subview').addClass('active'); PhoneSim_State.activeSubviews.phoneapp = 'log'; }
        else if (v === 'EmailApp') { UI.renderEmailList(); }
        else if (v === 'EmailDetail') { UI.renderEmailDetail(data); PhoneSim_State.activeEmailId = data; }
        else if (v === 'SettingsApp') { p.find('#settingsapp-view .subview').removeClass('active').filter('.settings-menu-subview').addClass('active'); }
        else if (v === 'Homepage') { UI.renderHomepage(data); PhoneSim_State.activeProfileId = data; }
        else if (v === 'BrowserApp') { UI.renderBrowserState(); }
        else if (v === 'ForumApp') { UI.renderForumBoardList(); const f = p.find('#forumapp-view'); f.find('.subview').removeClass('active'); f.find('.forum-board-list-subview').addClass('active'); }
        else if (v === 'ForumPostList') { UI.renderForumPostList(data); PhoneSim_State.activeForumBoardId = data; const f = p.find('#forumapp-view'); f.find('.subview').removeClass('active'); f.find('.forum-post-list-subview').addClass('active');}
        else if (v === 'ForumPostDetail') { UI.renderForumPostDetail(data); PhoneSim_State.activeForumPostId = data; const f = p.find('#forumapp-view'); f.find('.subview').removeClass('active'); f.find('.forum-post-detail-subview').addClass('active');}

        PhoneSim_State.currentView = v;
        PhoneSim_State.saveUiState();
    };

    await renderContent();
}

export function rerenderCurrentView({ chatUpdated, emailUpdated, momentsUpdated, profileUpdated, browserUpdated, forumUpdated }) {
    if (!PhoneSim_State.isPanelVisible) return;

    if (chatUpdated) {
        UI.renderContactsList();
        // Also rerender the contacts view if it's the active subview
        if (PhoneSim_State.activeSubviews.chatapp === 'contacts') {
            UI.renderContactsView();
        }
        if (PhoneSim_State.activeContactId) {
            UI.renderChatView(PhoneSim_State.activeContactId, 'WeChat', false);
        }
    }
    if (emailUpdated && PhoneSim_State.currentView.startsWith('Email')) {
        UI.renderEmailList();
        if (PhoneSim_State.activeEmailId) {
            UI.renderEmailDetail(PhoneSim_State.activeEmailId);
        }
    }
    if (momentsUpdated && (PhoneSim_State.currentView === 'Moments' || PhoneSim_State.currentView === 'Homepage')) {
        UI.renderMomentsView();
        if (PhoneSim_State.activeProfileId) {
            UI.renderHomepage(PhoneSim_State.activeProfileId);
        }
    }
    if (profileUpdated && PhoneSim_State.activeProfileId && PhoneSim_State.currentView === 'Homepage') {
        UI.renderHomepage(PhoneSim_State.activeProfileId);
    }
     if (browserUpdated && PhoneSim_State.currentView === 'BrowserApp') {
        UI.renderBrowserState();
    }
    if (forumUpdated && PhoneSim_State.currentView.startsWith('Forum')) {
        if (PhoneSim_State.currentView === 'ForumApp') UI.renderForumBoardList();
        if (PhoneSim_State.activeForumBoardId) UI.renderForumPostList(PhoneSim_State.activeForumBoardId);
        if (PhoneSim_State.activeForumPostId) UI.renderForumPostDetail(PhoneSim_State.activeForumPostId);
    }
}