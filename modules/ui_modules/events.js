import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';
import { PhoneSim_Sounds } from '../sounds.js';

let jQuery_API, parentWin, SillyTavern_Context_API, TavernHelper_API, UI, DataHandler;

export function init(deps, dataHandler, uiObject) {
    jQuery_API = deps.jq;
    parentWin = deps.win;
    SillyTavern_Context_API = deps.st_context;
    TavernHelper_API = deps.th;
    UI = uiObject;
    DataHandler = dataHandler;
}

export function addEventListeners() {
    const b = jQuery_API(parentWin.document.body);
    const p = b.find(`#${PhoneSim_Config.PANEL_ID}`);
    const fileInput = b.find('#phone-sim-file-input');

    // ---- 统一的AI生成触发器 ----
    const triggerAIGeneration = async (prompt) => {
        // 使用 /send 和 /trigger 组合，确保消息能被AI接收并触发回应
        await TavernHelper_API.triggerSlash(`/send ${JSON.stringify(prompt)} |/trigger`);
    };

    // ---- 文件上传 & 全局按钮 ----
    fileInput.off('change.phonesim').on('change.phonesim', async (event) => {
        // ... 文件上传逻辑 ...
    });

    b.off('click.phonesim').on('click.phonesim', `#${PhoneSim_Config.TOGGLE_BUTTON_ID}`, () => { PhoneSim_Sounds.play('tap'); UI.togglePanel(); });
    b.on('click.phonesim', `#${PhoneSim_Config.COMMIT_BUTTON_ID}`, () => { PhoneSim_Sounds.play('send'); DataHandler.commitStagedActions(); });

    // ---- 全局点击关闭逻辑 ----
    b.off('click.phonesim-global').on('click.phonesim-global', function(e) {
        // ... 点击面板外部关闭菜单的逻辑 ...
    });

    // ---- 通用导航委托 ----
    p.off('click.phonesim').on('click.phonesim', '.app-block, .back-to-home-btn, .back-to-email-list-btn, .back-to-board-list-btn, .back-to-post-list-btn, .back-to-livecenter-btn, .back-to-livestreamlist-btn, .back-to-list-btn, .back-to-discover-btn, .back-to-chat-btn, .back-to-members-btn, .back-to-browser-btn', function() {
        const target = jQuery_API(this);
        PhoneSim_Sounds.play('tap');
        if (target.hasClass('app-block')) {
            const viewId = target.data('view');
            const rect = this.getBoundingClientRect();
            const panelRect = p[0].getBoundingClientRect();
            const originX = rect.left - panelRect.left + rect.width / 2;
            const originY = rect.top - panelRect.top + rect.height / 2;
            UI.showView(viewId, { animationOrigin: { x: originX, y: originY } });
        } else if (target.hasClass('back-to-home-btn')) UI.showView('HomeScreen');
        else if (target.hasClass('back-to-email-list-btn')) UI.showView('EmailApp');
        else if (target.hasClass('back-to-board-list-btn')) UI.showView('ForumApp');
        else if (target.hasClass('back-to-post-list-btn')) UI.showView('ForumPostList', PhoneSim_State.activeForumBoardId);
        else if (target.hasClass('back-to-livecenter-btn')) UI.showView('LiveCenterApp');
        else if (target.hasClass('back-to-livestreamlist-btn')) UI.showView('LiveStreamList', PhoneSim_State.activeLiveBoardId);
        else if (target.hasClass('back-to-list-btn') || target.hasClass('back-to-discover-btn')) UI.showView('ChatApp');
        else if (target.hasClass('back-to-chat-btn')) UI.showView('ChatConversation', PhoneSim_State.activeContactId);
        else if (target.hasClass('back-to-members-btn')) UI.showView('GroupMembers', PhoneSim_State.activeContactId);
        else if (target.hasClass('back-to-browser-btn')) UI.showView('BrowserApp');
    });


    // ... 这里保留所有其他App（微信、论坛、直播等）的完整事件监听代码 ...
    // ... 代码量很大，为了清晰，此处省略，但最终文件中必须包含它们 ...


    // ==========================================================
    // ==== [新增] 欲色剧场 (THEATER APP) 专属事件监听器 ====
    // ==========================================================

    const theaterView = p.find('#theaterapp-view');

    // ---- 底部导航栏点击事件 ----
    theaterView.on('click.theater', '.theater-footer-nav .nav-btn', function() {
        const button = jQuery_API(this);
        if (button.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const pageKey = button.data('page');
        UI.switchTheaterPage(pageKey); // 调用渲染模块的函数来切换页面内容
    });

    // ---- 列表项 & 弹窗内按钮点击事件 (事件委托) ----
    theaterView.on('click.theater', '.list-item, .theater-modal-content .action-button, .theater-refresh-btn, .filter-btn', async function(e) {
        const target = jQuery_API(this);
        e.stopPropagation();

        // 1. 点击刷新按钮
        if (target.hasClass('theater-refresh-btn')) {
            PhoneSim_Sounds.play('tap');
            const pageKey = target.data('page');
            let pageName = '';
            switch(pageKey) {
                case 'announcements': pageName = '通告列表'; break;
                case 'customizations': pageName = '粉丝定制'; break;
                case 'theater_list': pageName = '剧场列表'; break;
                case 'shop': pageName = '欲色商城'; break;
            }
            if(pageName) {
                const prompt = `(系统提示：{{user}}请求为欲色剧场的“${pageName}”页面生成新的内容。)`;
                await triggerAIGeneration(prompt);
            }
            return;
        }

        // 2. 点击列表项，显示详情
        if (target.hasClass('list-item')) {
            PhoneSim_Sounds.play('open');
            const itemData = target.data();
            const itemType = target.data('type');
            UI.showTheaterItemDetail(itemData, itemType);
            return;
        }

        // 3. 点击弹窗内的动作按钮
        if (target.hasClass('action-button')) {
            const action = target.data('action');
            const modal = target.closest('.theater-modal-overlay');
            const listItem = p.find('.list-item.active-for-action'); // 找到被操作的列表项

            switch(action) {
                case 'close-modal':
                    PhoneSim_Sounds.play('close');
                    UI.hideTheaterModal();
                    break;
                case 'start-shooting': {
                    PhoneSim_Sounds.play('send');
                    const title = modal.find('.modal-header').text();
                    const prompt = `(系统提示：{{user}}决定开始拍摄通告“${title}”。)`;
                    await triggerAIGeneration(prompt);
                    UI.hideTheaterModal();
                    listItem.fadeOut(300, () => listItem.remove());
                    break;
                }
                case 'accept-custom': {
                    PhoneSim_Sounds.play('send');
                    const headerText = modal.find('.modal-header').text();
                    const fanId = headerText.split(' ')[0];
                    const typeName = modal.find('.detail-section p').first().text();
                    const prompt = `(系统提示：{{user}}接取了粉丝“${fanId}”的“${typeName}”类型定制。)`;
                    await triggerAIGeneration(prompt);
                    UI.hideTheaterModal();
                    listItem.fadeOut(300, () => listItem.remove());
                    break;
                }
            }
            listItem.removeClass('active-for-action'); // 清除标记
            return;
        }

        // 4. 点击剧场列表的筛选按钮
        if (target.hasClass('filter-btn')) {
            PhoneSim_Sounds.play('tap');
            const filterType = target.data('filter');
            target.siblings().removeClass('active');
            target.addClass('active');

            if (filterType === 'search') {
                const searchBar = theaterView.find('.search-bar');
                if (searchBar.length) {
                    searchBar.focus();
                } else {
                    const searchInputHtml = `<input type="text" class="search-bar" placeholder="搜索影片、标签或演员...">`;
                    theaterView.find('.theater-filters').after(searchInputHtml);
                    theaterView.find('.search-bar').focus();
                }
            } else {
                UI.switchTheaterPage('theater_list', filterType);
            }
            return;
        }
    });

    // 列表项上的快捷操作按钮（接取/拒绝）
    theaterView.on('click.theater', '.list-item .action-button', async function(e){
        e.stopPropagation(); // 防止触发列表项的点击事件
        const button = jQuery_API(this);
        const listItem = button.closest('.list-item');
        const itemData = listItem.data();

        if(button.hasClass('accept-btn')){
            PhoneSim_Sounds.play('send');
            const prompt = `(系统提示：{{user}}接取了粉丝“${itemData.fanid}”的“${itemData.typename}”类型定制。)`;
            await triggerAIGeneration(prompt);
            listItem.fadeOut(300, () => listItem.remove());
        } else if (button.hasClass('reject-btn')) {
            PhoneSim_Sounds.play('tap');
            listItem.fadeOut(300, () => listItem.remove());
        }
    });

    // 搜索框回车事件
    theaterView.on('keydown.theater', '.search-bar', async function(e) {
        if (e.key === 'Enter') {
            const input = jQuery_API(this);
            const searchTerm = input.val().trim();
            if(!searchTerm) return;
            PhoneSim_Sounds.play('send');
            const prompt = `(系统提示：{{user}}在欲色剧场中搜索：“${searchTerm}”。请生成相关的影片列表。)`;
            await triggerAIGeneration(prompt);
            input.val('');
        }
    });

    // 关闭弹窗的事件
    p.on('click.theater', '#theater-modal', function(e) {
        if (jQuery_API(e.target).is('#theater-modal')) {
             UI.hideTheaterModal();
        }
    });

}
