export function renderTheaterView(initialPage = 'announcements') {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    let view = p.find('#theaterapp-view');
    
    // 关键修复：只创建一个主容器
    if (view.length === 0) {
        view = jQuery_API(`<div id="theaterapp-view" class="view"></div>`);
        p.append(view);
    }
    
    // 每次渲染前清空，避免重复生成（删除原有的.app-header返回按钮）
    view.empty().append(`
        <!-- 移除内置返回按钮，依赖events.js的全局导航 -->
        <div class="app-header">
            <h3>欲色剧场</h3> <!-- 只保留标题，删除返回按钮 -->
        </div>
        <div class="app-content-wrapper">
            <div id="theater-content-area"></div>
        </div>
        <div class="theater-footer-nav">
            <button class="nav-btn" data-page="announcements"><span class="icon">📢</span>通告列表</button>
            <button class="nav-btn" data-page="customizations"><span class="icon">💖</span>粉丝定制</button>
            <button class="nav-btn" data-page="theater"><span class="icon">🎬</span>剧场列表</button>
            <button class="nav-btn" data-page="shop"><span class="icon">🛒</span>欲色商城</button>
        </div>
    `);
    
    // 绑定事件（只绑定一次，同时删除返回按钮的事件绑定）
    if (!PhoneSim_State.theaterEventsBound) {
        _bindEvents();
        PhoneSim_State.theaterEventsBound = true;
    }
    
    // 初始渲染页面
    if (!PhoneSim_State.theaterInit) {
        switchPage(initialPage);
        updateNav(initialPage);
        PhoneSim_State.theaterInit = true;
    }
}

// 统一事件绑定（删除返回按钮的事件绑定代码）
function _bindEvents() {
    const p = jQuery_API(parentWin.document.body).find(`#${PhoneSim_Config.PANEL_ID}`);
    const view = p.find('#theaterapp-view');
    
    // 解绑所有旧事件，防止重复触发（删除返回按钮的解绑逻辑）
    view.off('click.phonesim');
    p.off('click.phonesim', '#theaterapp-view .theater-refresh-btn');
    p.off('click.phonesim', '#theaterapp-view .nav-btn');
    
    // 移除返回首页按钮的事件绑定（完全依赖events.js）
    
    // 刷新按钮（委托给内容区，避免重复绑定）
    p.on('click.phonesim', '#theater-content-area .theater-refresh-btn', async function() {
        PhoneSim_Sounds.play('send');
        const page = jQuery_API(this).data('page');
        const pageMap = {
            'announcements': '通告列表',
            'customizations': '粉丝定制',
            'theater': '剧场列表',
            'shop': '欲色商城'
        };
        const prompt = pageMap[page] ? `(系统提示：洛洛刷新了欲色剧场的“${pageMap[page]}”页面)` : '';
        if (prompt) {
            // 恢复原有的AI调用逻辑（与events.js保持一致）
            await parentWin.TavernHelper_API.triggerSlash(`/send ${JSON.stringify(prompt)} |/trigger`);
        }
        switchPage(page);
    });
    
    // 导航按钮
    p.on('click.phonesim', '#theaterapp-view .nav-btn', function() {
        const btn = jQuery_API(this);
        if (btn.hasClass('active')) return;
        PhoneSim_Sounds.play('tap');
        const page = btn.data('page');
        switchPage(page);
        updateNav(page);
    });
}
