import { PhoneSim_UI } from './modules/ui.js';
import { PhoneSim_DataHandler } from './modules/dataHandler.js';
import { PhoneSim_State } from './modules/state.js';
import { PhoneSim_Sounds } from './modules/sounds.js';

(function () {
    let jQuery, SillyTavern, TavernHelper;
    let mainInterval;
    let isInitialized = false;

    // 核心初始化函数
    async function mainInitialize() {
        if (isInitialized) return;
        console.log("[Phone Sim] Initializing...");

        const dependencies = {
            jq: jQuery,
            st: SillyTavern,
            st_context: SillyTavern.getContext(),
            th: TavernHelper,
            win: window
        };

        // 1. 初始化无依赖的模块
        PhoneSim_State.init(dependencies);
        PhoneSim_Sounds.init(dependencies);

        // 2. 交叉初始化UI和数据处理器，解决循环依赖
        PhoneSim_DataHandler.init(dependencies, PhoneSim_UI);
        PhoneSim_UI.init(dependencies, PhoneSim_DataHandler);

        // 3. 异步创建并注入UI到页面
        const uiReady = await PhoneSim_UI.initializeUI();

        // 4. 确认UI成功加载后再进行后续操作
        if (uiReady) {
            console.log("[Phone Sim] UI Initialized Successfully.");

            // 绑定SillyTavern的核心事件监听器
            SillyTavern.getContext().eventSource.on('message_received', (data) => PhoneSim_DataHandler.mainProcessor(data.id));

            // 如果插件初始状态是可见的，则打开它
            if (PhoneSim_State.isPanelVisible) {
                PhoneSim_UI.togglePanel(true);
            }

            isInitialized = true;
            console.log("[Phone Sim] Fully initialized and running.");
        } else {
            console.error("[Phone Sim] UI initialization failed. Aborting further setup.");
            // 如果UI加载失败，这里可以添加额外的错误处理逻辑
        }
    }

    // 轮询检测SillyTavern核心API是否加载完成
    mainInterval = setInterval(() => {
        if (window.jQuery && window.SillyTavern && window.TavernHelper) {
            jQuery = window.jQuery;
            SillyTavern = window.SillyTavern;
            TavernHelper = window.TavernHelper;

            clearInterval(mainInterval);
            mainInitialize();
        }
    }, 500);
})();
