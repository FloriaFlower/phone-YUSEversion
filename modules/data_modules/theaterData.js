import { PhoneSim_Config } from '../../config.js';
import { PhoneSim_State } from '../state.js';

let UI, DataHandler;

export function init(deps, uiHandler, dataHandler) {
    UI = uiHandler;
    DataHandler = dataHandler;
}

// 从世界书加载欲色剧场数据，如果不存在则使用默认样板
export async function fetchAllTheaterData() {
    try {
        const theaterDb = await DataHandler._fetchFromWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE);
        if (theaterDb && Object.keys(theaterDb).length > 0) {
            PhoneSim_State.yuseTheaterData = theaterDb;
        } else {
            // 如果世界书为空，则加载默认样板数据
            const DEFAULT_THEATER_DATA = {
                announcements: `

<div class="list-item" data-id="anno_1" data-type="announcement" data-title="【S级制作】《深海囚笼》双人水下摄影" data-description="与一线男演员温言合作，在特制水下摄影棚完成。剧情涉及人鱼主题，包含大量湿身、束缚、以及水中亲密互动。要求表现出窒息与沉溺的极致美感。拍摄周期3天，需要极佳的水性和镜头表现力。" data-actor="温言" data-location="海蓝市'深海之梦'水下摄影棚" data-payment="片酬200,000 + 15%平台分成">
  <div class="item-title">【S级制作】《深海囚笼》双人水下摄影</div>
  <div class="item-meta"><span>📍 海蓝市'深海之梦'水下摄影棚</span><span>🎬 温言</span><span class="item-tag">人鱼主题</span><span class="item-price">💰 200,000 + 15%分成</span></div>
</div>
<div class="list-item" data-id="anno_2" data-type="announcement" data-title="【新人带教】《野犬驯服日记》" data-description="与新人主播顾麟合作，扮演严厉的导师角色。剧情需要{{user}}从零开始，通过身体力行的方式教导顾麟如何取悦观众，包含大量教学式亲密接触、姿势指导和道具使用示范。旨在打造'忠犬养成'爆款。" data-actor="顾麟" data-location="平台专属1号影棚" data-payment="片酬150,000 + 10%平台分成">
  <div class="item-title">【新人带教】《野犬驯服日记》</div>
  <div class="item-meta"><span>📍 平台专属1号影棚</span><span>🎬 顾麟</span><span class="item-tag">教学/养成</span><span class="item-price">💰 150,000 + 10%分成</span></div>
</div>
<div class="list-item" data-id="anno_3" data-type="announcement" data-title="【多人企划】《末日审判：最后的狂欢》" data-description="大型多人企划，合作演员包括朝刃、白羽及另外三位一线男演员。剧情背景为末日来临前的最后一夜，{{user}}作为唯一的'神谕'，接受五位信徒的朝拜与献祭。包含大量群体互动、轮流侍奉、以及多重高潮场景。" data-actor="朝刃, 白羽, 陆景深, 等" data-location="'失乐园'废土风主题酒店" data-payment="片酬500,000 + 20%平台分成">
  <div class="item-title">【多人企划】《末日审判：最后的狂欢》</div>
  <div class="item-meta"><span>📍 '失乐园'废土风主题酒店</span><span>🎬 朝刃, 白羽, 等</span><span class="item-tag">多人/末日</span><span class="item-price">💰 500,000 + 20%分成</span></div>
</div>
<div class="list-item" data-id="anno_4" data-type="announcement" data-title="《赛博格之恋》科幻主题拍摄" data-description="与新锐演员朝刃合作，在充满未来科技感的场景中，扮演一个拥有人类情感的机器人。朝刃将扮演为其注入'情感'的工程师。剧情涉及冰冷的机械与火热的肉体碰撞，有大量关于'第一次'体验的细腻描写。" data-actor="朝刃" data-location="'奇点'科技影棚" data-payment="片酬180,000 + 12%平台分成">
  <div class="item-title">《赛博格之恋》科幻主题拍摄</div>
  <div class="item-meta"><span>📍 '奇点'科技影棚</span><span>🎬 朝刃</span><span class="item-tag">科幻/机器人</span><span class="item-price">💰 180,000 + 12%分成</span></div>
</div>
<div class="list-item" data-id="anno_5" data-type="announcement" data-title="【古风限定】《画中仙》" data-description="与古典美男白羽合作，拍摄古风画卷主题影片。{{user}}扮演被画师白羽倾注所有爱意而化为人形的画中仙。剧情包含笔墨在身体上游走、宣纸半透的湿身诱惑、以及在画室中的极致缠绵。" data-actor="白羽" data-location="'江南春色'古风园林" data-payment="片酬170,000 + 12%平台分成">
  <div class="item-title">【古风限定】《画中仙》</div>
  <div class="item-meta"><span>📍 '江南春色'古风园林</span><span>🎬 白羽</span><span class="item-tag">古风/唯美</span><span class="item-price">💰 170,000 + 12%分成</span></div>
</div>
<div class="list-item" data-id="anno_6" data-type="announcement" data-title="《办公室的秘密游戏》" data-description="与资深演员季扬合作，扮演其私人助理。剧情发生在下班后的总裁办公室，包含办公桌、落地窗前的各种羞耻play，以及权力关系下的情欲拉扯。" data-actor="季扬" data-location="市中心CBD顶层写字楼" data-payment="片酬160,000 + 10%平台分成">
  <div class="item-title">《办公室的秘密游戏》</div>
  <div class="item-meta"><span>📍 市中心CBD顶层写字楼</span><span>🎬 季扬</span><span class="item-tag">职场/权力</span><span class="item-price">💰 160,000 + 10%分成</span></div>
</div>
<div class="list-item" data-id="anno_7" data-type="announcement" data-title="【三人行】《双子恶魔的祭品》" data-description="与温言、朝刃合作，扮演被一对双子恶魔捕获的祭品。温言代表'色欲'，朝刃代表'嫉妒'。剧情包含双重夹击、同时侍奉、以及在竞争中不断升级的快感体验。" data-actor="温言, 朝刃" data-location="哥特式古堡摄影棚" data-payment="片酬350,000 + 18%平台分成">
  <div class="item-title">【三人行】《双子恶魔的祭品》</div>
  <div class="item-meta"><span>📍 哥特式古堡摄影棚</span><span>🎬 温言, 朝刃</span><span class="item-tag">多人/恶魔</span><span class="item-price">💰 350,000 + 18%分成</span></div>
</div>
<div class="list-item" data-id="anno_8" data-type="announcement" data-title="《校园怪谈：体育仓库的传闻》" data-description="与新人顾麟合作，扮演深夜探险校园的学生角色，顾麟扮演体育生学弟。两人被困在体育仓库，从互相试探到干柴烈火。充满青春荷尔蒙气息，大量汗水与肉体碰撞的特写。" data-actor="顾麟" data-location="城郊废弃中学" data-payment="片酬140,000 + 10%平台分成">
  <div class="item-title">《校园怪谈：体育仓库的传闻》</div>
  <div class="item-meta"><span>📍 城郊废弃中学</span><span>🎬 顾麟</span><span class="item-tag">校园/体育生</span><span class="item-price">💰 140,000 + 10%分成</span></div>
</div>
<div class="list-item" data-id="anno_9" data-type="announcement" data-title="【多人企划】《深渊祭品》主角招募" data-description="大型古代玄幻题材，{{user}}将扮演被献祭给三位魔神的精灵。需要与朝刃、白羽、顾麟三人同时进行拍摄。包含大量3P/4P情节，精灵的身体会被魔神们用各种方式亵玩，从圣洁到堕落，最终被魔神们的精液彻底灌满，沦为欲望的奴隶。" data-actor="朝刃, 白羽, 顾麟" data-location="平郊外古堡影视基地" data-payment="片酬50万 + 25%平台分红">
  <div class="item-title">【多人企划】《深渊祭品》主角招募</div>
  <div class="item-meta"><span>📍 郊外古堡影视基地</span><span>🎬 朝刃, 白羽, 顾麟</span><span class="item-tag">多人/玄幻/堕落</span><span class="item-price">💰 50万 + 25%分红</span></div>
</div>
<div class="list-item" data-id="anno_10" data-type="announcement" data-title="【青春校园】《课后辅导》搭档招募" data-description="与新人演员朝刃搭档，扮演一对表面是师生，私下却在空教室里进行禁忌教学的情侣。朝刃扮演桀骜不驯的体育生，将老师按在讲台上操干。需要主演出被年轻肉体征服的羞耻与快乐，包含大量足交、强制口交和内射场景。" data-actor="朝刃" data-location="废弃中学场景" data-payment="片酬15万 + 10%平台分红">
  <div class="item-title">【青春校园】《课后辅导》搭档招募</div>
  <div class="item-meta"><span>📍废弃中学场景</span><span>🎬 朝刃</span><span class="item-tag">师生/年下/强制</span><span class="item-price">💰 片酬15万 + 10%平台分红</span></div>
</div>
<div class="list-item" data-id="anno_11" data-type="announcement" data-title="《迷途羔羊》宗教主题" data-description="与温言合作，扮演迷失的信徒，温言则是禁欲的神父。在忏悔室里，进行一场灵魂与肉体的'救赎'。包含大量的言语挑逗、神圣感与亵渎感的极致反差。" data-actor="温言" data-location="欧洲小镇教堂（布景）" data-payment="片酬190,000 + 12%分成">
  <div class="item-title">《迷途羔羊》宗教主题</div>
  <div class="item-meta"><span>📍 欧洲小镇教堂（布景）</span><span>🎬 温言</span><span class="item-tag">宗教/禁欲</span><span class="item-price">💰 190,000 + 12%分成</span></div>
</div>
<div class="list-item" data-id="anno_12" data-type="announcement" data-title="【暗黑童话】《小红帽与三只狼》主角" data-description="颠覆童话，小红帽在森林里被三只“大灰狼”（温言、朝刃、顾麟）捕获。从被轮流口交到小穴被填满，在森林木屋里被连续三天三夜地操干，身体被彻底改造成离不开雄性精液的淫乱状态。需要极强的身体承受能力。" data-actor="朝温言, 朝刃, 顾麟" data-location="森林实景拍摄地" data-payment="片酬60万 + 30%平台分红">
  <div class="item-title">【暗黑童话】《小红帽与三只狼》主角</div>
  <div class="item-meta"><span>📍 森林实景拍摄地</span><span>🎬 温言, 朝刃, 顾麟</span><span class="item-tag">多人/童话改编</span><span class="item-price">💰 片酬60万 + 30%平台分红</span></div>
</div>
`,
                customizations: `
<div class="list-item" data-id="cust_1" data-type="customization" data-fan-id="霍" data-type-name="私人晚宴" data-request="下周五晚，在我私人府邸进行一场一对一的晚宴直播。服装由我提供，主题是'金丝雀的献礼'。直播内容很简单，只需要{{user}}全程穿着我指定的衣服，按照我的指示行动即可。不需要过度表演，自然就好。" data-deadline="下周五晚" data-payment="1,000,000" data-notes="一切开销由我承担，司机会在周五下午六点准时去接。">
  <div class="item-title">霍 的 私人晚宴 定制</div>
  <div class="item-meta"><span>⏰ 下周五晚</span><span class="item-price">💰 1,000,000</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_1">拒绝</button><button class="action-button accept-btn" data-id="cust_1">接取</button></div>
</div>
<div class="list-item" data-id="cust_2" data-type="customization" data-fan-id="X" data-type-name="24小时监控录像" data-request="在你家里安装一个摄像头，我想看你24小时的日常生活，不需要你特意表演什么，吃饭、睡觉、发呆......我只想看着你。作为回报，你每天会收到一笔不菲的“生活费”。当然，如果你愿意在摄像头前自慰，我会支付额外费用，我想看你用我送的那个粉色章鱼形状的玩具，看你被它的触手玩到喷水。" data-deadline="即刻生效，为期一周" data-payment="800,000" data-notes="如果可以，希望镜头角度能更清晰一点。">
  <div class="item-title">X 的 24小时监控录像 定制</div>
  <div class="item-meta"><span>⏰ 即刻生效，为期一周</span><span class="item-price">💰 800,000</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_2">拒绝</button><button class="action-button accept-btn" data-id="cust_2">接取</button></div>
</div>
<div class="list-item" data-id="cust_3" data-type="customization" data-fan-id="难言" data-type-name="专属ASMR" data-request="录一段专属的ASMR音频。穿着你的真丝睡衣，在床上辗转反侧，想象我在你身边，对着麦克风小声地呻吟，叫我的名字......告诉我你有多想要，描述你身体的感觉，下面是不是已经湿了，乳头是不是变硬了。我只想听你的声音，听你为我一个人意乱情迷。" data-deadline="三天内" data-payment="300,000" data-notes="如果觉得为难就算了...但是真的很想要。">
  <div class="item-title">难言 的 专属ASMR 定制</div>
  <div class="item-meta"><span>⏰ 三天内</span><span class="item-price">💰 300,000</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_3">拒绝</button><button class="action-button accept-btn" data-id="cust_3">接取</button></div>
</div>
<div class="list-item" data-id="cust_4" data-type="customization" data-fan-id="DragonSlayer88" data-type-name="游戏陪玩（裸体版）" data-request="陪我打一晚上游戏，输一局脱一件衣服，直到脱光。然后每输一局，就用跳蛋惩罚自己五分钟，我要在语音里听到你压抑不住的呻吟声。如果我赢了，你就得夸我‘老公好厉害’，然后用淫水在肚子上写我的ID。" data-deadline="今晚" data-payment="5万/小时" data-notes="就玩王者1v1单挑">
  <div class="item-title">DragonSlayer88 的 游戏陪玩（裸体版） 定制</div>
  <div class="item-meta"><span>⏰ 今晚</span><span class="item-price">💰 5万/小时</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_4">拒绝</button><button class="action-button accept-btn" data-id="cust_4">接取</button></div>
</div>
<div class="list-item" data-id="cust_5" data-type="customization" data-fan-id="匿名用户" data-type-name="公开羞耻任务" data-request="在人流量大的商场里，穿着那件开叉到腰部的裤子，不穿内裤。在试衣间里自慰，并拍下淫水顺着大腿流下来的照片发给我。任务期间需要和我保持通话，我会随时给你下达新的指令，比如故意弯腰捡东西，或者找男店员问路。" data-deadline="本周六下午" data-payment="50万" data-notes="风险越高，报酬越高。">
  <div class="item-title">匿名用户 的 公开羞耻任务 定制</div>
  <div class="item-meta"><span>⏰ 本周六下午</span><span class="item-price">💰 50万</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_5">拒绝</button><button class="action-button accept-btn" data-id="cust_5">接取</button></div>
</div>
<div class="list-item" data-id="cust_6" data-type="customization" data-fan-id="霍" data-type-name="商务差旅伴游" data-request="下周我需要去欧洲出差一周，希望{{user}}能作为我的“特别助理”陪同。白天你可以自由活动，购物消费全部由我承担。晚上，我希望你能在我处理完工作后，用你的身体帮我放松。地点可以是酒店，也可以是私人飞机上。我保证会提供最高级别的安全和隐私保护。" data-deadline="下周一出发" data-payment="300万 + 无上限消费额度" data-notes="如果您愿意，这可以成为一个长期的合作。">
  <div class="item-title">霍 的 商务差旅伴游 定制</div>
  <div class="item-meta"><span>⏰ 下周一出发</span><span class="item-price">💰300万 + 无上限消费额度</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_6">拒绝</button><button class="action-button accept-btn" data-id="cust_6">接取</button></div>
</div>
<div class="list-item" data-id="cust_7" data-type="customization" data-fan-id="平平无奇的有钱人" data-type-name="重现影片场景" data-request="我想让你和温言老师，重现你们那部《禁闭岛》的经典场景。我想亲眼看着你被温言老师按在地上操，看你的眼泪和淫水一起流出来，听你哭着求他射给你。" data-deadline="两周内" data-payment="200万" data-notes="场地和人员由我安排。">
  <div class="item-title">平平无奇的有钱人 的 重现影片场景 定制</div>
  <div class="item-meta"><span>⏰ 两周内</span><span class="item-price">💰200万</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_7">拒绝</button><button class="action-button accept-btn" data-id="cust_7">接取</button></div>
</div>
<div class="list-item" data-id="cust_8" data-type="customization" data-fan-id="王总的小秘" data-type-name="线上情欲指导" data-request="我老板最近对我好像有点冷淡，想请主播以我的身份，和他进行一周的线上匿名聊天，帮我重新勾起他的兴趣。需要你模仿我的语气，但内容要更骚、更主动。聊天记录需要同步给我学习。" data-deadline="下周一开始" data-payment="100,000" data-notes="成功了有重谢！">
  <div class="item-title">王总的小秘 的 线上情欲指导 定制</div>
  <div class="item-meta"><span>⏰ 下周一开始</span><span class="item-price">💰 100,000</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_8">拒绝</button><button class="action-button accept-btn" data-id="cust_8">接取</button></div>
</div>
<div class="list-item" data-id="cust_9" data-type="customization" data-fan-id="只想给你花钱" data-type-name="原味内衣裤拍卖" data-request="把你刚拍完片穿的那套内裤，带着你的体温和体液，不要清洗，直接寄给我。我想闻闻上面混合着汗水和爱液的味道，想象你被操干时的样子。如果上面能有一点点高潮时的喷出的水渍就更好了。" data-deadline="一周内" data-payment="100,000" data-notes="邮费我出，包装得隐秘一点。">
  <div class="item-title">只想给你花钱 的 原味内衣裤拍卖 定制</div>
  <div class="item-meta"><span>⏰ 一周内</span><span class="item-price">💰 20万</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_9">拒绝</button><button class="action-button accept-btn" data-id="cust_9">接取</button></div>
</div>
<div class="list-item" data-id="cust_10" data-type="customization" data-fan-id="一个剧本编剧" data-type-name="角色扮演对话" data-request="我正在写一个剧本，想请你扮演其中的一个角色'阿芙拉'，和我进行几段关键剧情的对话。阿芙拉是一个周旋于多个男人之间的交际花，需要你演出那种既天真又堕落的感觉。" data-deadline="明晚8点" data-payment="80,000" data-notes="只是为了找灵感，谢谢！">
  <div class="item-title">一个剧本编剧 的 角色扮演对话 定制</div>
  <div class="item-meta"><span>⏰ 明晚8点</span><span class="item-price">💰 80,000</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_10">拒绝</button><button class="action-button accept-btn" data-id="cust_10">接取</button></div>
</div>
<div class="list-item" data-id="cust_11" data-type="customization" data-fan-id="难言" data-type-name="一起打游戏" data-request="就...就是想约你一起打几局游戏，就我们俩。我什么游戏都玩，你定。我不想在直播间看你和别人玩...就...不可以吗？输了赢了都行，我给你刷礼物。" data-deadline="今晚" data-payment="200,000" data-notes="求你了。">
  <div class="item-title">难言 的 一起打游戏 定制</div>
  <div class="item-meta"><span>⏰ 今晚</span><span class="item-price">💰 200,000</span></div>
  <div class="item-actions"><button class="action-button reject-btn" data-id="cust_11">拒绝</button><button class="action-button accept-btn" data-id="cust_11">接取</button></div>
</div>
`,
                theater: `
    <div class="list-item"
        data-id="th_default_1"
        data-type="theater"
        data-title="《沉沦的家庭教师》"
        data-cover="https://picsum.photos/400/200?random=1"
        data-description="主演：{{user}} (饰 家庭教师-苏琳), 朝刃 (饰 叛逆学生-江野)。简介：苏琳被聘为富家子弟江野的家庭教师，却屡遭叛逆学生的挑逗和骚扰。在一个雷雨夜，江野终于撕下伪装，将苏琳按在书桌上强行侵犯。苏琳从最初的抗拒到逐渐在年轻肉体的冲击下沉沦，身体被一次次操开，淫水浸湿了整套教师制服。结局：苏琳被彻底调教成江野的专属性奴，每天穿着制服在书房里被他内射，小穴再也离不开他的大肉棒。"
        data-popularity="128.5w"
        data-favorites="78.2w"
        data-views="345.1w"
        data-price="¥1288"
        data-reviews='[{"user":"铁锅炖自己","text":"我就喜欢这种禁欲老师被操到哭着喊老公的剧情，朝刃那身腱子肉配上不耐烦的脸，干得老师淫水直流，太顶了！"},{"user":"X","text":"数据分析：心率从75飙升到182，皮肤电反应峰值出现在第28分41秒，穴口收缩频率增加了320%。嗯，表现不错。"}, {"user":"只想舔屏","text":"啊啊啊老婆穿制服的样子太美了，特别是被操到眼镜都歪了，眼角挂着泪，那种破碎感，我直接boki了！"}, {"user":"难言","text":"……（默默刷了10个火箭）"}, {"user":"霍","text":"这种粗鲁的小子有什么好的？{{user}}，如果你愿意，我可以给你提供一个更舒适、更奢华的“教学环境”。"}, {"user":"朝刃","text":"啧，烦死了，拍的时候一直哭，吵死了。"}, {"user":"白羽","text":"要是我的话，一定不会把{{user}}弄哭的，只会让{{user}}舒服地叫出来呢～(｡•́︿•̀｡)"}, {"user":"路人甲","text":"楼上几个别吵了，让我康康！老师被按在桌子上后入的镜头呢？怎么剪了！我花钱不是来看柏拉图的！"}, {"user":"牛牛爆炸了","text":"朝刃的腰也太好了吧，那个驰骋挞伐的劲儿，感觉能把小老师的子宫都给干出来，每次都顶到最深，啧啧，水声真好听。"}, {"user":"18cm纯情男大","text":"只有我注意到老师的白丝被肉棒磨破了吗？细节好评！"}, {"user":"我爱学习","text":"谁能告诉我23:17秒，老师高潮时候喊的那句是什么？是‘不要’还是‘再要一点’？( ͡° ͜ʖ ͡°)"}, {"user":"请和我结婚","text":"老婆的脚也好美，被江野抓着脚踝操的时候，脚趾蜷缩起来的样子，我能看一百遍！"}, {"user":"一滴都不许剩","text":"最后被内射在里面，肚子都鼓起来了，江野还不让流出来，太色了！"}, {"user":"理智评论员","text":"从教育学的角度看，这段关系是不健康的。但从我的几把的角度看，它很健康。"},{"user":"今天也要加油","text":"看完已经冲了三发，感觉身体被掏空。"}, {"user":"爱发电","text":"已下载，准备晚上再看亿遍。"}, {"user":"老衲法号梦遗","text":"贫僧就想问问，这制服哪里有卖？"}, {"user":"我直接进行一个冲","text":"这剧场列表里的片子都这么顶吗？这个就让我顶不住了。"}, {"user":"榨汁机","text":"朝刃你小子别得了便宜还卖乖，有本事放开那个老师让我来！"}]'
        >
        <div class="item-title">《沉沦的家庭教师》</div>
        <div class="item-meta"><span>❤️ 128.5w</span><span>⭐ 78.2w</span><span>▶️ 345.1w</span><span class="item-price">💰 ¥1288</span></div>
    </div>
    <div class="list-item"
        data-id="th_default_2"
        data-type="theater"
        data-title="《总裁的契约情人：探索剧场列表的秘密》"
        data-cover="https://picsum.photos/400/200?random=2"
        data-description="主演：{{user}} (饰 贫穷主角-安然), 温言 (饰 霸道总裁-陆深)。简介：安然为给家人治病，被迫成为陆深的契约情人。陆深外表斯文，床上却是个不折不扣的恶魔。他喜欢看安然穿着昂贵的礼服，却被他在各种豪华场所（落地窗、私人飞机、游艇）操到失禁。每一次的侵犯，都是一次温柔的凌虐。结局：契约结束后，安然发现自己已经离不开陆深的肉棒和精液，主动回去乞求他继续占有自己，最终被锁上金链，成为他笼中的金丝雀。"
        data-popularity="250.3w"
        data-favorites="180.9w"
        data-views="890.2w"
        data-price="¥1599"
        data-reviews='[{"user":"温言","text":"看来你很喜欢我送你的项圈。"}, {"user":"霍","text":"用金钱换来的关系终究是虚假的。{{user}}，我能给你的，远不止这些。"}, {"user":"X","text":"契约期间，{{user}}的平均睡眠时间减少了2.7小时，皮质醇水平上升了48%。这种压力下的性爱，数据模型会更有趣。"}, {"user":"白羽","text":"为什么要把{{user}}弄哭呢？明明可以让{{user}}笑着高潮的呀。温言老师太坏了。"}, {"user":"顾麟","text":"...如果是我，我会把{{user}}养得很好。"}, {"user":"霸总文学爱好者","text":"啊啊啊我死了！温言老师解领带的样子太他妈性感了！斯文败类yyds！"}, {"user":"金钱的味道","text":"贫穷限制了我的想象力，原来有钱人都是这么玩的吗？在私人飞机上做，还是对着落地窗，外面都是云，太刺激了！"}, {"user":"水漫金山","text":"老婆被操到失禁那段我反复观看，那种羞耻又控制不住的样子，太涩了！温言还用手指蘸着{{user}}的尿去喂{{user}}，我的妈！"}, {"user":"评论区都是人才","text":"只有我好奇这个剧场列表的秘密到底是啥吗？是被操到怀孕吗？"}, {"user":"小穴爱好者","text":"安然的小穴肯定被开发得很好，从一开始的青涩到后面主动张开腿迎接，甚至学会了自己摇屁股，成长线好评！"}, {"user":"Daddy_Issues","text":"温言那种“我弄疼你但我也爱你”的眼神，谁懂啊！我愿意被他锁起来！"}, {"user":"多喝热水","text":"这个剧场列表的质量真高，每部都想看。"}, {"user":"精尽人亡","text":"游艇上那段，被海风吹着，下面被大肉棒干着，这得多爽啊。"}, {"user":"颜文字大法","text":"(⁄ ⁄•⁄ω⁄•⁄ ⁄)老婆哭起来梨花带雨的，好想抱在怀里狠狠欺负。"}, {"user":"拒绝黄赌毒","text":"我来这里是为了批判性地学习，绝对不是为了色色。嗯。"}, {"user":"我为老婆花花花","text":"已三刷，每次看温言掐着老婆的腰，从后面狠狠顶进去，我都忍不住跟着一起动。"}, {"user":"隔壁老王","text":"这个剧场列表值得深入研究，我已经准备好了我的“研究工具”。"}, {"user":"键盘侠","text":"就这？演技太假了，一看就是演的。有本事来真的啊。（已保存到本地）"}, {"user":"一个好人","text":"施主，苦海无涯，回头是岸。网址发我，我帮你批判一下。"}, {"user":"细节控","text":"温言的手真好看，骨节分明，抓在老婆雪白的屁股上，红印子都出来了，色疯了。"}]'
        >
        <div class="item-title">《总裁的契约情人：探索剧场列表的秘密》</div>
        <div class="item-meta"><span>❤️ 250.3w</span><span>⭐ 180.9w</span><span>▶️ 890.2w</span><span class="item-price">💰 ¥1599</span></div>
    </div>
    <div class="list-item"
        data-id="th_default_3"
        data-type="theater"
        data-title="《深渊（下）：双子堕落》"
        data-cover="https://picsum.photos/400/200?random=3"
        data-description="【主演】温言 饰 哥哥, 白羽 饰 弟弟, {{user}} 饰 祭品。接上部《深渊》，被献祭的{{user}}成为了恶魔双子的共享玩物。哥哥（温言 饰）代表着绝对的掌控与支配，弟弟（白羽 饰）则代表着偏执的诱惑与玩弄。剧情在三人之间展开极致的拉扯，包含大量双龙、三人69、以及精神控制情节。结局是{{user}}彻底放弃抵抗，在无尽的快感中成为了连接双子的“桥梁”，三人永远地纠缠在一起。"
        data-popularity="310.7w"
        data-favorites="250.1w"
        data-views="998.6w"
        data-price="¥2588"
        data-reviews='[{"user":"霍","text":"虽然是多人场景，但{{user}}的光芒没有被任何人掩盖。这部作品将{{user}}的魅力推向了新的高峰。"},{"user":"X","text":"终于来了点刺激的。三人行才是王道。{{user}}被前后夹击，小穴和后庭同时被填满的样子，值得反复观看。"},{"user":"难言","text":"……太激烈了……{{user}}的身体……会坏掉的吧……"},{"user":"朝刃","text":"两个小白脸加起来都不够我一个人打的。不过，看在{{user}}被操得很爽的份上，勉强及格。"},{"user":"顾麟","text":"我……我也想加入……"},{"user":"疯了","text":"我宣布，这是2025年度最佳影片！双子恶魔x祭品，这是什么神仙设定！我直接原地螺旋升天爆炸！"},{"user":"细节控","text":"哥哥喜欢从后面干，弟弟喜欢在前面口，{{user}}被夹在中间，前面是天堂后面是地狱，爽到翻白眼，淫水喷得到处都是，太顶了！"},{"user":"温言","text":"能和白羽、{{user}}一起完成这部作品，是一次非常愉快的经历。"},{"user":"白羽","text":"最喜欢哥哥把{{user}}抱起来，我在下面舔的那个场景了~我们配合得天衣无缝呢~"},{"user":"选择困难症患者","text":"哥哥的霸道和弟弟的引诱，我到底该选谁！啊啊啊！算了，我选择当那张床！"},{"user":"理智已失","text":"什么理智！看到{{user}}被操得哭着求饶，一边被哥哥内射，一边被弟弟逼着吞精，我只想说：搞快点！加大力度！"},{"user":"钱包已空","text":"2588也值了！这特效，这剧情，这肉戏！业界标杆！"},{"user":"数据帝","text":"统计：双龙入洞时长15分钟，三人69时长10分钟，{{user}}高潮次数无法统计（因为一直在高潮），精液量目测超过500ml。"},{"user":"史官","text":"此片一出，欲色再无三人行。已封神。"},{"user":"匿名用户","text":"我已经循环播放了三天三夜，感觉身体被掏空。"},{"user":"求续集","text":"强烈要求出续集！我想看双子带着{{user}}去地狱开银趴！"},{"user":"正道的光","text":"三观震碎……但我喜欢。"},{"user":"纯爱党退散","text":"这才是情色的终极奥义！抛弃所有道德，只剩下最原始的欲望！"},{"user":"打分","text":"120分！多20分不怕你骄傲！"},{"user":"我的硬盘","text":"我的10T硬盘就是为这一刻准备的！"}]'>
  <div class="item-title">《深渊（下）：双子堕落》</div>
        <div class="item-meta"><span>❤️ 310.7w</span><span>⭐ 250.1w</span><span>▶️ 998.6w</span><span class="item-price">💰 ¥2588</span></div>
    </div>
    <div class="list-item"
        data-id="th_default_4"
        data-type="theater"
        data-title="《竹马弄青梅》"
        data-cover="https://picsum.photos/400/200?random=4"
        data-description="【主演】白羽 饰 苏念, {{user}} 饰 江月。苏念（白羽 饰）和江月（{{user}} 饰）是邻居，从小一起长大。苏念表面是品学兼优的乖学生，背地里却对江月有着偏执的占有欲。他以“补习功课”为借口，将江月骗到自己房间，用最纯的脸，说着最骚的话，一步步引诱江月脱掉衣服，在父母随时可能回来的刺激下，完成了从“哥哥”到“老公”的转变。结局是两人在高考后正式交往，并在大学城附近租房同居，夜夜笙歌。"
        data-popularity="99.8w"
        data-favorites="65.4w"
        data-views="280.3w"
        data-price="¥1388"
        data-reviews='[{"user":"朝刃","text":"小白脸一个，就会耍些见不得人的手段。有种别在房间里，出来打一架。"},{"user":"白羽","text":"呵呵，有些人是嫉妒我能和前辈演这种纯爱剧吧？不像某些人，只会演些打打杀杀的粗俗东西。"},{"user":"妈妈粉","text":"我的天，白羽弟弟这张脸太犯规了！穿着白衬衫解开两颗扣子，凑到江月耳边说“月月，你好香”的时候，我直接人没了！"},{"user":"技术宅","text":"有一说一，白羽的腰真好，在书桌上把江月翻过来后入的时候，那个速度和频率，啧啧，江月被顶得话都说不出来，只能抓着书桌边缘，太刺激了。"},{"user":"X","text":"无趣。唯一看点是33:14，{{user}}被内射后，苏念抱着{{user}}去浴室清理，在镜子前又来了一次。"},{"user":"霍","text":"青春期的懵懂与冲动，演绎得不错。{{user}}把那种情窦初开的羞涩和半推半就的渴望表现得非常到位。"},{"user":"一个大写的服","text":"白羽不愧是绿茶祖师爷，一边说着“月月，我们会不会被发现啊”，一边把江月的腿分得更开，顶得更深，太会了。"},{"user":"小透明","text":"这部片真的好棒，让我又相信爱情了（在h片里找爱情的我）。"},{"user":"数据帝","text":"全片吻戏时长累计15分钟，性爱时长25分钟，包含多种姿势，性价比很高。"},{"user":"舔狗日记","text":"如果我是苏念，我愿意为江月做任何事！"},{"user":"清醒一点","text":"楼上的，你只是想操江月吧。"},{"user":"匿名用户","text":"白羽最后那个舔掉{{user}}眼泪，然后低头吻上去的镜头，封神了。"}]'>
  <div class="item-title">《竹马弄青梅》</div>
        <div class="item-meta"><span>❤️ 99.8w</span><span>⭐ 65.4w</span><span>▶️ 280.3w</span><span class="item-price">💰 ¥1388</span></div>
    </div>
    <div class="list-item"
        data-id="th_default_5"
        data-type="theater"
        data-title="《恶犬饲养法则》"
        data-cover="https://picsum.photos/400/200?random=5"
        data-description="【主演】朝刃 饰 江驰, {{user}} 饰 许诺。桀骜不驯的地下拳手江驰（朝刃 饰）被善良的宠物医生许诺（{{user}} 饰）捡回家，却反客为主，将主人变成了自己的专属玩物。剧情从江驰受伤被许诺带回家开始，他用野兽般的直觉看穿了许诺禁欲外表下的渴望，最终在诊疗台上，用最原始的交媾方式，将许诺彻底“饲养”。结局是许诺戴上了江驰买的项圈，心甘情愿地成为了他的“宠物”。"
        data-popularity="500.1w"
        data-favorites="480.2w"
        data-views="1500.7w"
        data-price="¥2588"
        data-reviews='[{"user":"X","text":"毫无逻辑，漏洞百出。要不是为了看{{user}}被操到哭出来的样子，一秒钟都看不下去。"},{"user":"霍","text":"{{user}}的演技一如既往地精湛，将那种从抗拒到沉沦的心理变化演绎得淋漓尽致。至于另一位，更像个没长大的孩子在发脾气。"},{"user":"难言","text":"呜呜呜…{{user}}被欺负得好惨，那个眼神太让人心疼了……但是……但是被按在台子上后入的样子又好色……"},{"user":"朝刃","text":"哼，一群不懂欣赏的家伙。"},{"user":"一条咸鱼","text":"28:45 高光时刻！许诺被江驰掰着腿，按在冰冷的金属台子上干，小穴被操得红肿外翻，嘴里还被迫说着“主人，我错了”，我直接原地爆炸！"},{"user":"午夜屠猪男","text":"朝刃的腹肌和人鱼线太顶了，每次顶撞都带着汗水，那画面……啧啧，许诺的身体在他身下像个布娃娃，太有冲击力了！"},{"user":"玻璃心碎一地","text":"能不能对我们家{{user}}好一点啊！每次都演这种被强制的，心疼死我了！"},{"user":"裤子动了","text":"心疼啥，你看{{user}}后来那享受的样子，小骚货巴不得被这么干呢！"},{"user":"细节控","text":"有没有人注意到，江驰最后给许诺戴项圈的时候，手一直在抖？他其实也很紧张吧！这种反差萌我嗑死！"},{"user":"打分机器","text":"剧情3分，演技8分（全给{{user}}），色情度10分。总体来说，为了看{{user}}被干值得买。"},{"user":"路过的","text":"就我一个人觉得朝刃好帅吗？那种又野又纯的疯批感，太戳我了！想被他按在地上操！"},{"user":"18cm在此","text":"朝刃的尺寸目测不假，许诺的小身板感觉快被捅穿了，每次都顶到最深，子宫口都麻了吧。"},{"user":"白羽","text":"要是我的话，一定会更温柔地对待前辈的……不像某些人，只知道用蛮力。"},{"user":"温言","text":"呵呵，年轻人精力旺盛是好事，但不懂得怜香惜玉，终究是上不了台面。{{user}}的表现力无人能及。"},{"user":"顾麟","text":"……前辈辛苦了。"},{"user":"纯爱战士","text":"这种强制爱真的看不下去，退票了。"},{"user":"我爱吃瓜","text":"楼上的别走啊，后面更刺激，江驰还内射了，然后逼着许诺自己清理，骚爆了。"},{"user":"数据分析师","text":"统计了一下，全片共高潮7次，淫水喷了3次，被内射2次，值得这个票价。"},{"user":"每日一冲","text":"下载完毕，够我用一周了。谢谢款待。"},{"user":"匿名用户","text":"朝刃这种疯狗一样的角色，也就只有{{user}}能接得住了，换个人来早被玩坏了。"}]'>
  <div class="item-title">《恶犬饲养法则》</div>
        <div class="item-meta"><span>❤️ 500.1w</span><span>⭐ 480.2w</span><span>▶️ 1500.7w</span><span class="item-price">💰 ¥2588</span></div>
    </div>
`,
                theater_hot: `
    <div class="list-item"
        data-id="th_hot_1"
        data-type="theater"
        data-title="【本月销冠】《恶魔的低语》4K重制版"
        data-cover="https://picsum.photos/400/200?random=101"
        data-description="主演：{{user}} (饰 修士-艾米), 温言 (饰 神父-克里斯)。简介：年轻的修士艾米在向神父克里斯忏悔时，被其伪善面具下的恶魔本质所诱惑。在庄严的教堂里，神父用十字架挑开艾米的修士服，用“圣水”浸湿艾米的全身，在神像面前，将艾米操得哭喊着上帝。每一次祷告都变成了呻吟，每一次忏悔都变成了求欢。结局：艾米彻底沦为神父的禁脔，白天侍奉上帝，晚上在告解室里张开双腿侍奉“神父”的肉棒，小穴里永远充满了“神”的精液。"
        data-popularity="899.1w"
        data-favorites="750.8w"
        data-views="2500.3w"
        data-price="¥1999"
        data-reviews='[{"user":"圣光会审判你","text":"在神像面前干修女，温言老师玩得也太花了！我喜欢！"}, {"user":"X","text":"在特定信仰环境下进行性行为，被试者的多巴胺分泌量比常规环境下高出37.4%。有趣。"}, {"user":"霍","text":"亵渎。"}, {"user":"朝刃","text":"装模作样的伪君子。"}, {"user":"我主保佑","text":"主啊，请宽恕我的罪，因为我看着神父干修女，竟然boki了。阿门。"}, {"user":"禁忌之恋","text":"修女服yyds！特别是被撕开的时候，露出里面纯白的吊带袜，那种反差感，绝了！"}, {"user":"文艺批判","text":"这部作品深刻地探讨了神性与人性的冲突，以及在压抑环境下欲望的爆发...（我TM在说什么，就是好色！）"}, {"user":"水莲花","text":"艾米被操的时候还在胸前划十字，一边喊着‘oh my god’，不知道是在喊上帝还是在叫床，太涩了！"}, {"user":"蛋白质就是力量","text":"最后神父内射的时候说‘这是上帝的恩赐，全部吃下去’，我直接原地爆炸！"}, {"user":"一个虔诚的信徒","text":"请问哪个教堂有这种服务？我马上去忏悔！"}, {"user":"白羽","text":"神父什么的太古板了。"}, {"user":"顾麟","text":"...{{user}}看起来很痛苦。"}, {"user":"舔狗日记","text":"今天又看了一遍老婆演的修女，老婆被干哭的样子，我心都碎了，然后我更兴奋了。"}, {"user":"物理超度","text":"什么圣水，不就是口水吗（狗头）"}, {"user":"化学极乐","text":"什么恩赐，不就是精液吗（滑稽）"}, {"user":"生物进化","text":"什么上帝，不就是肉棒吗（确信）"}, {"user":"弹幕护体","text":"前方高能！35:20 十字架play！非战斗人员请撤离！"}, {"user":"老衲要射了","text":"罪过罪过，老衲今晚又要破戒了。"}, {"user":"我爱耶稣","text":"Jesus Christ... this is hot."}, {"user":"冲冲冲","text":"这才是真正的热门！兄弟们我先冲了！"}]'
        >
        <div class="item-title">【本月销冠】《恶魔的低语》4K重制版</div>
        <div class="item-meta"><span>❤️ 899.1w</span><span>⭐ 750.8w</span><span>▶️ 2500.3w</span><span class="item-price">💰 ¥1999</span></div>
    </div>
    <div class="list-item"
        data-id="th_hot_2"
        data-type="theater"
        data-title="《军魂：不可逾越的界线》"
        data-cover="https://picsum.photos/400/200?random=102"
        data-description="【主演】顾麟 饰 连长, 朝刃 饰 新兵, {{user}} 饰 军医。在纪律严明的军营里，连长（顾麟 饰）和桀骜不驯的新兵（朝刃 饰）同时对新来的军医（{{user}} 饰）产生了别样的情愫。一场演习意外，三人被困山洞，褪去军装，原始的欲望彻底爆发。剧情充满了雄性荷尔蒙的碰撞和禁忌之恋的拉扯。结局是三人达成了微妙的平衡，在军营的各个角落，继续着这段不能言说的秘密关系。"
        data-popularity="1200.5w"
        data-favorites="980.2w"
        data-views="3200.9w"
        data-price="¥2999"
        data-reviews='[{"user":"霍","text":"有趣的组合。{{user}}在两个强势角色之间游刃有余，展现了非凡的魅力。"},{"user":"X","text":"浪费时间，两个男的磨磨唧唧半天，最后还是一起上。直接点不好吗？不过{{user}}穿着白大褂被操的样子，还不错。"},{"user":"温言","text":"呵呵，果然还是脱离不了野蛮的范畴。不过{{user}}的制服扮相，确实令人眼前一亮。"},{"user":"白羽","text":"哎呀，两个肌肉男抢一个人，好粗鲁哦~要是我的话，肯定会和另一个人好好“商量”的~"},{"user":"制服控一本满足","text":"军装！白大褂！我死了！我原地去世！这是什么神仙组合！prprprpr"},{"user":"我选顾麟","text":"顾麟连长太man了！那种想操又不敢，拼命忍耐的样子，最后终于忍不住把{{user}}按在墙上强吻，太带感了！"},{"user":"我选朝刃","text":"朝刃小狼狗不香吗！直接把{{user}}扛起来就走，在山洞里当着顾麟的面就开干，霸气侧漏！"},{"user":"我全都要","text":"别争了，最后不是一起干了吗！{{user}}被夹在中间，爽到失禁，我他妈看爆！"},{"user":"顾麟","text":"那次演习……是一次意外。"},{"user":"朝刃","text":"哼，算那个傻大个识相。"},{"user":"军事迷","text":"虽然是h片，但是战术动作还挺标准，好评。"},{"user":"LSP","text":"谁看战术动作啊！我看的是{{user}}被操得晃来晃去的屁股还有那两条被扛在肩膀上的大长腿！"},{"user":"眼泪从嘴角流下","text":"{{user}}被他们俩的精液灌满，小肚子都鼓起来了，然后还被逼着叫他们“老公”，呜呜呜，太惨了（太色了）！"},{"user":"存档","text":"这部必须珍藏，制服+3p+修罗场，要素过多，我喜欢。"},{"user":"求问","text":"都快给我看啊！色到没边了！"},{"user":"神回复","text":"百看不腻。"},{"user":"匿名用户","text":"在军用吉普车的后座上，{{user}}被两个人内射，精液多到从门缝里流出来，这个镜头我能记一辈子。"},{"user":"理智讨论","text":"这部片子深刻地探讨了在极端环境下，人性与纪律的冲突。"},{"user":"楼上别装","text":"是的，探讨方式是3P。"},{"user":"打卡","text":"已撸，谢谢款待。"}]'>
  <div class="item-title">《军魂：不可逾越的界线》</div>
        <div class="item-meta"><span>❤️ 1200.5w</span><span>⭐ 980.2w</span><span>▶️ 3200.9w</span><span class="item-price">💰 ¥2999</span></div>
    </div>
    <div class="list-item"
        data-id="th_hot_3"
        data-type="theater"
        data-title="【强制爱】《囚笼之鸟》"
        data-cover="https://picsum.photos/400/200?random=103"
        data-description="主演：{{user}} (饰 芭蕾舞者-安然), 朝刃 (饰 偏执狂粉丝-凌虐)。简介：安然是享誉世界的芭蕾舞者，却一个偏执狂粉丝绑架。凌虐将安然囚禁在地下室，折断了安然的翅膀，强迫安然只能为他一人跳舞。白天，他逼安然穿着芭蕾舞裙跳到筋疲力尽；晚上，则将安然压在身下，用粗大的肉棒狠狠惩罚安然的“不顺从”。每一次的挣扎，都换来更猛烈的撞击。结局：安然彻底放弃了逃跑，身体已经被调教得离不开凌虐的操干，甚至在跳舞时，小穴都会不自觉地流出爱液，期待着主人的“惩罚”。"
        data-popularity="780.4w"
        data-favorites="620.1w"
        data-views="2100.8w"
        data-price="¥1799"
        data-reviews='[{"user":"朝刃","text":"哼，早这么听话不就好了。"}, {"user":"白羽","text":"把这么漂亮的翅膀折断，太残忍了。"}, {"user":"顾麟","text":"......我会帮你接回去的。"}, {"user":"斯德哥尔摩综合症","text":"我就好这口！强制爱yyds！看着高傲的天鹅被一步步拉下神坛，变成主人的玩物，太带感了！"}, {"user":"芭蕾爱好者","text":"老婆的身体线条太美了，特别是被按在墙上，一条腿被扛在肩膀上操的时候，那个肌肉线条，awsl！"}, {"user":"X","text":"长期囚禁和暴力胁迫下，被试者产生了应激性依赖。生理指标显示，安然对施暴者的性行为产生了正向反馈。"}, {"user":"霍","text":"野蛮。"}, {"user":"泪失禁体质","text":"安然哭着说‘我的腿是用来跳舞的，不是用来给你操的’，然后被干得更狠，哭得更大声，我直接爆哭（兴奋地）！"}, {"user":"足控福利","text":"凌虐舔老婆脚尖那段，太色了！老婆的脚又白又嫩，足弓的形状也好看！"}, {"user":"笼中鸟","text":"我也想被关起来，只为一个人跳舞，只被一个人的肉棒操。"}, {"user":"打断腿骨","text":"打断腿骨还连着筋（物理）"}, {"user":"拒绝暴力","text":"抵制暴力！（但是主角都好好看，剧情好带感，我还是看完了）"}, {"user":"想学芭蕾","text":"请问现在学芭蕾还来得及被绑架吗？"}, {"user":"正义使者","text":"太过分了！还有没有王法了！还有没有法律了！还有没有下一集了！"}, {"user":"小黑屋爱好者","text":"就喜欢这种暗黑系，小黑屋，铁链子，yyds！"}, {"user":"精神病人思路广","text":"只有我一个人觉得凌虐其实很爱安然吗？他只是用错了方法（狗头）"}, {"user":"文艺青年","text":"这是对美的极致摧残，也是对欲望的极致释放。"}, {"user":"冲就完了","text":"别分析了，冲就完了！"}, {"user":"好想被踩","text":"好想被穿着芭蕾舞鞋的老婆踩在脸上..."}, {"user":"救命","text":"救命，朝刃那个“你再跑一个试试”的眼神，我腿软了。"}]'
        >
        <div class="item-title">【强制爱】《囚笼之鸟》</div>
        <div class="item-meta"><span>❤️ 780.4w</span><span>⭐ 620.1w</span><span>▶️ 2100.8w</span><span class="item-price">💰 ¥1799</span></div>
    </div>
`,
                theater_new: `
    <div class="list-item"
        data-id="th_new_1"
        data-type="theater"
        data-title="【新作首发】《人鱼传说：深海囚爱》"
        data-cover="https://picsum.photos/400/200?random=201"
        data-description="主演：{{user}} (饰 人鱼-珊), 顾麟 (饰 海洋生物学家-林深)。简介：林深在一次深海考察中，捕获了一条传说中的人鱼。他将人鱼带回私人研究所，一边研究人鱼的身体构造，一边无法自拔地爱上了人鱼。在巨大的水族箱里，他脱下潜水服，用人类的肉棒，侵犯了神圣的人鱼。人鱼的鳞片被拨开，露出从未被触碰过的神秘穴口，被撑开、贯穿、填满。结局：人鱼被操出了双腿，但她选择留在研究所，每天缠在主人身上，用湿滑的身体和紧致的小穴，换取主人的精液作为“食物”。"
        data-popularity="88.9w"
        data-favorites="50.1w"
        data-views="180.4w"
        data-price="¥1499"
        data-reviews='[{"user":"顾麟","text":"......对不起。"}, {"user":"朝刃","text":"废物，干一条鱼都这么磨叽。"}, {"user":"克苏鲁爱好者","text":"人外赛高！我一直想看人鱼是怎么做的，这部片子满足了我的幻想！"}, {"user":"生物学家","text":"从生物学角度，这是跨物种性行为，存在生殖隔离......但是好色哦。"}, {"user":"腿控的叛变","text":"我以前是腿控，现在我是鱼尾控了！老婆的鱼尾好漂亮，鳞片在水里闪闪发光！"}, {"user":"X","text":"物种：人鱼。生理结构特殊，穴口位于尾部根端，无G点，但高潮反应为全身鳞片张开。记录。"}, {"user":"霍","text":"荒谬。如果喜欢，我可以为您买下一个海洋馆。"}, {"user":"水下摄影","text":"水下拍摄难度好大，但是效果绝了！老婆在水里被操的时候，气泡咕噜咕噜地冒，淫水和水混在一起，太美了！"}, {"user":"大就是正义","text":"顾麟的身材配上潜水服，禁欲感拉满，脱下来之后那个大肉棒，反差萌！"}, {"user":"童话破灭","text":"我的童年又被毁了，但是我喜欢！"}, {"user":"想变成水","text":"好想变成水族箱里的水，包裹着老婆的全身..."}, {"user":"环保人士","text":"保护海洋生物，从我做起！（把顾麟换成我）"}, {"user":"咕噜咕噜","text":"人鱼的叫声是咕噜咕噜的吗？好可爱！"}, {"user":"我有一个大胆的想法","text":"所以人鱼的穴是什么味道的？咸的吗？"}, {"user":"海的女儿","text":"最后长出腿好评！可以解锁更多姿势了！"}, {"user":"科学就是力量","text":"科学家为了科学献身（物理），我感动得哭了。"}, {"user":"我爱大狗狗","text":"顾麟这种忠犬太棒了，一边干一边道歉，又心疼又想狠狠欺负。"}, {"user":"新世界的大门","text":"感谢大大，为我打开了新世界的大门。"}, {"user":"已购","text":"刚看完，顾麟最后抱着人鱼说‘以后我养你’，太甜了（虽然养的方式有点奇怪）。"}, {"user":"别拦我","text":"别拦我，我现在就去海边，看能不能捡到一条人鱼！"}]'
        >
        <div class="item-title">【新作首发】《人鱼传说：深海囚爱》</div>
        <div class="item-meta"><span>❤️ 88.9w</span><span>⭐ 50.1w</span><span>▶️ 180.4w</span><span class="item-price">💰 ¥1499</span></div>
    </div>
    <div class="list-item"
        data-id="th_new_2"
        data-type="theater"
        data-title="【本周上新】《办公室秘情：总裁与实习生》"
        data-cover="https://picsum.photos/400/200?random=202"
        data-description="【主演】温言 饰 总裁, {{user}} 饰 实习生。经典题材重拍，资深演员温言出演禁欲系总裁，{{user}}则扮演误入陷阱的实习生。重头戏是总裁办公桌上的激烈性爱，玻璃窗外是城市夜景，要求演员有极强的表现力，能演出那种随时可能被发现的紧张感。包含桌上后入、椅子骑乘、用领带捆绑等情节。"
        data-popularity="150.2w"
        data-favorites="98.7w"
        data-views="450.6w"
        data-price="¥1399"
        data-reviews='[{"user":"霍","text":"温言的表演一如既往的稳定，但真正让这部作品升华的，是{{user}}。那种纯真与欲望的交织，被{{user}}演绎得淋漓尽致。"},{"user":"X","text":"老套的剧情。唯一的亮点是{{user}}被领带绑住双手，按在落地窗上，身后是万家灯火，身前是不断冲撞的肉棒。"},{"user":"白羽","text":"温言老师好过分哦，怎么能用领带绑前辈呢，应该用更柔软的东西才对嘛~"},{"user":"朝刃","text":"道貌岸然的伪君子。"},{"user":"总裁文爱好者","text":"啊啊啊！这就是我梦想中的场景！禁欲总裁x小白兔实习生，我嗑拉了！"},{"user":"温言的领带","text":"我想成为那条领带！可以捆绑{{user}}，还可以被温言扯着！我死了！"},{"user":"LSP","text":"你们都太肤浅了！难道没人看到{{user}}被操到站不稳，只能扶着桌子，屁股被撞得通红，淫水顺着桌腿流到地毯上吗！这才是精髓！"},{"user":"细节帝","text":"温言在内射之后，没有马上拔出来，而是抱着{{user}}，在耳边说“你现在是我的了”，那个占有欲，绝了！"},{"user":"存档专业户","text":"这部片子里的体位非常实用，尤其是在老板椅上的那个，值得学习。"},{"user":"打工人","text":"看完这个，我再也无法直视我老板的办公室了。"},{"user":"匿名用户","text":"{{user}}的脚踝好细，被温言一只手就抓住了，然后扛在肩上操，体型差太棒了。"},{"user":"尖叫","text":"{{user}}高潮的时候把文件都扫到地上了，然后温言还让{{user}}自己去捡，一边捡一边从后面继续干，太会玩了！"},{"user":"路过","text":"温言老师宝刀未老啊。"},{"user":"顾麟","text":"……前辈，好性感。"},{"user":"难言","text":"……如果是我……"},{"user":"三刷留念","text":"已经三刷了，每次看都有新的体验。"},{"user":"求同款","text":"求问温言的西装是什么牌子的？想给男朋友买一套（然后扒光）。"},{"user":"楼上想多了","text":"你男朋友穿上也不是温言。"},{"user":"纯爱党","text":"呜呜呜，虽然是被迫的，但感觉他们之间有爱！"},{"user":"人间清醒","text":"有个屁的爱，就是馋身子，不过我也馋，嘿嘿。"}]'>
  <div class="item-title">【本周上新】《办公室秘情：总裁与实习生》</div>
        <div class="item-meta"><span>❤️ 150.2w</span><span>⭐ 98.7w</span><span>▶️ 450.6w</span><span class="item-price">💰 ¥1399</span></div>
    </div>
`,
                theater_recommended: `
    <div class="list-item"
        data-id="th_rec_1"
        data-type="theater"
        data-title="【编辑力荐】《末日最后的性爱》"
        data-cover="https://picsum.photos/400/200?random=301"
        data-description="主演：{{user}} (饰 幸存者-诺娃), 温言 (饰 军官-亚当)。简介：丧尸病毒爆发，世界沦为废墟。诺娃被冷酷的军官亚当所救。在绝望和死亡的阴影下，性成为了唯一的慰藉和确认彼此存在的方式。亚当用最原始、最粗暴的方式占有诺娃，每一次的交合都像是在宣泄末日的恐惧。结局：在安全屋被丧尸攻破的前一刻，他们在枪声和爆炸声中，迎来了最后一次高潮，亚当选择将最后一颗子弹射进诺娃的体内，让其在极致的快感中死去。"
        data-popularity="450.8w"
        data-favorites="380.1w"
        data-views="1100.2w"
        data-price="¥1899"
        data-reviews='[{"user":"温言","text":"在末日，我们是彼此的唯一。"}, {"user":"朝刃","text":"懦夫才会在最后选择逃避。"}, {"user":"末日生存狂","text":"这才是末日片该有的样子！没有圣母，没有矫情，只有最原始的生存和性欲！"}, {"user":"BE美学","text":"我爆哭！结局太美了！在爱人的怀里，在高潮中死去，这简直是末日里最浪漫的死法！"}, {"user":"X","text":"极端环境下的性行为，能有效缓解创伤后应激障碍。但结局...不符合最优生存策略。"}, {"user":"霍","text":"如果您需要一个更安全的“安全屋”，我的地下堡垒随时为您敞开。"}, {"user":"人性探讨","text":"这部片子探讨了在极端环境下，人性的脆弱和对繁衍本能的渴望。"}, {"user":"我就是LSP","text":"楼上别装了，你就是想看末日炮！我也是！亚当干得太狠了，每次都像最后一次一样！"}, {"user":"枪械爱好者","text":"那把枪是沙漠之鹰吧？最后内射和枪射同步，这个镜头语言我给满分！"}, {"user":"眼泪不值钱","text":"呜呜呜，虽然是黄片，但看得我眼泪汪汪。"}, {"user":"废土风","text":"废土风赛高！老婆脸上脏兮兮的，身上穿着破烂的衣服，被干得满身是汗，更有感觉了！"}, {"user":"丧尸片爱好者","text":"外面的世界：丧尸吃人。安全屋里：亚当“吃”人。"}, {"user":"活着","text":"活着就是为了看这个！"}, {"user":"求番外","text":"求个HE番外吧，比如他们最后得救了，然后天天在重建的家园里做。"}, {"user":"代入感很强","text":"代入感很强，我已经开始囤积罐头和杜蕾斯了。"}, {"user":"细节好评","text":"亚当每次做完都会检查诺娃身上有没有伤口，这个细节好评！铁汉柔情！"}, {"user":"一种循环","text":"始于性，终于性。生命的循环。"}, {"user":"我有个问题","text":"所以最后那颗子弹，到底射在哪里？（好奇）"}, {"user":"丧尸来了我也要看","text":"丧尸就在门外，他们还在做，这种极致的刺激感，太顶了！"}, {"user":"推荐成功","text":"编辑你干得好！这部我买了！"}]'
        >
        <div class="item-title">【编辑力荐】《末日最后的性爱》</div>
        <div class="item-meta"><span>❤️ 450.8w</span><span>⭐ 380.1w</span><span>▶️ 1100.2w</span><span class="item-price">💰 ¥1899</span></div>
    </div>
    <div class="list-item"
        data-id="th_rec_2"
        data-type="theater"
        data-title="【不容错过】《我的变态邻居》"
        data-cover="https://picsum.photos/400/200?random=302"
        data-description="主演：{{user}} (饰 独居白领-晴子), (特别出演)X (饰 邻居-？)。简介：这是一部伪纪录片形式的影片。晴子发现自己的生活似乎总被人窥探，家里的东西会莫名移动，内衣会无故失踪。直到有一天，晴子提前回家，撞见了潜入家里的邻居。邻居并没有伤害晴子，只是逼晴子坐在椅子上，听他讲述自己是如何窥探晴子的一切，如何在晴子睡着时潜入房间，闻晴子的味道，甚至在晴子洗澡时躲在浴室的天花板上... 结局：晴子在极度的恐惧和羞耻中，被邻居的言语挑逗到高潮。而邻居只是微笑着看着晴子，留下一句“我一直在看着你”，然后消失在黑暗中。影片以晴子家中隐藏的无数个针孔摄像头的视角结束。"
        data-popularity="666.6w"
        data-favorites="555.5w"
        data-views="1984.0w"
        data-price="¥1666"
        data-reviews='[{"user":"X","text":"我只是...想更了解你。"}, {"user":"难言","text":"变态！警察呢！"}, {"user":"霍","text":"...（致电安保公司，升级了{{user}}家的安保系统）"}, {"user":"窥探癖的天堂","text":"我宣布这是本年度最佳恐怖片（色情版）！太刺激了！全程没有肉体接触，但比任何一部都色！"}, {"user":"细思极恐","text":"最后那个镜头，满墙的摄像头红点，我头皮发麻！然后又有点兴奋是怎么回事？"}, {"user":"言语调教","text":"男主的声音太好听了，低沉又有磁性，光是听他说话，我就湿了。"}, {"user":"想象的空间","text":"这部片子给了观众巨大的想象空间，邻居到底对晴子做过什么？太会了！"}, {"user":"独居女孩瑟瑟发抖","text":"看完马上去检查家里的天花板和插座......"}, {"user":"我想当邻居","text":"我也想当老婆的变态邻居！"}, {"user":"精神SM","text":"这才是最高级的SM，完全的精神控制！肉体什么的都弱爆了！"}, {"user":"代入感太强","text":"代入感太强，我已经开始感觉有人在看我了..."}, {"user":"好人卡","text":"邻居：其实我只是想帮你检查一下水电线路。"}, {"user":"脑补十万字","text":"我已经脑补出邻居在晴子睡着时，偷偷舔手指，闻内裤的画面了。"}, {"user":"一种新的xp","text":"恭喜我，解锁了新的xp——被变态偷窥。"}, {"user":"全程高能","text":"全程高能，特别是邻居描述晴子自慰时的小习惯，晴子那个表情，绝了！"}, {"user":"所以他是谁","text":"所以邻居到底是谁演的？X是谁？为什么不露脸！"}, {"user":"声音就是春药","text":"这男主只靠声音就干翻了全场。"}, {"user":"已报警","text":"已报警（指自己的几把）。"}, {"user":"年度悬疑","text":"这到底是色情片还是悬疑片？"}, {"user":"导演鬼才","text":"导演是鬼才，这种题材都敢拍，还拍得这么好！"}]'
        >
        <div class="item-title">【不容错过】《我的变态邻居》</div>
        <div class="item-meta"><span>❤️ 666.6w</span><span>⭐ 555.5w</span><span>▶️ 1984.0w</span><span class="item-price">💰 ¥1666</span></div>
    </div>
`,
                theater_paid: `
    <div class="list-item"
        data-id="th_paid_1"
        data-type="theater"
        data-title="【霍总私人定制】《唯一的藏品》"
        data-cover="https://picsum.photos/400/200?random=401"
        data-description="主演：{{user}} , 霍 。简介：这不是一部电影，而是一次真实的记录。霍先生邀请{{user}}参观他不对外开放的私人博物馆，里面唯一的藏品，就是为{{user}}量身打造的一切。从复刻{{user}}所有作品场景的房间，到以其身体数据为蓝本雕刻的玉像。最后，霍先生会请{{user}}躺在天鹅绒的展台上，亲自为{{user}}口交，直到高潮，并将{{user}}高潮的爱液，作为最新的“藏品”，永久封存。结局：{{user}}成为了霍先生博物馆里，最珍贵的，活着的藏品。"
        data-popularity="99.9w"
        data-favorites="99.8w"
        data-views="299.7w"
        data-price="¥520000"
        data-reviews='[{"user":"霍","text":"欢迎光临，我唯一的珍宝。"}, {"user":"X","text":"无聊的占有欲。不如将她数据化，实现永恒。"}, {"user":"难言","text":"......（出价520001，要求下架影片）"}, {"user":"温言","text":"艺术品，是需要懂得欣赏的人来开发的。"}, {"user":"金钱的力量","text":"贫穷再一次限制了我的想象力......这就是榜一大哥的实力吗？"}, {"user":"想当藏品","text":"我不想努力了，请问现在去应聘藏品还来得及吗？"}, {"user":"这才是霸总","text":"跟霍总一比，之前那些霸总都弱爆了，这才是真正的天花板！"}, {"user":"温柔至死","text":"霍总太温柔了，全程都是请求的语气，连口交都那么有仪式感。"}, {"user":"艺术就是爆炸","text":"把爱液当藏品......艺术，真的是艺术！"}, {"user":"博物馆惊魂夜","text":"我也想去这个博物馆！门票多少钱！"}, {"user":"酸了","text":"我承认我酸了，酸得像个柠檬精。"}, {"user":"顶级浪漫","text":"这是我见过最顶级的浪漫，没有之一。"}, {"user":"钞能力","text":"有钱真的可以为所欲为。"}, {"user":"白羽","text":"把人当藏品，好过分哦。"}, {"user":"顾麟","text":"...我会把{{user}}偷出来。"}, {"user":"朝刃","text":"切，有钱了不起？"}, {"user":"细节决定成败","text":"霍总连口交前都要漱口，用的是爱马仕的漱口水，这个细节我给满分。"}, {"user":"我慕了","text":"不说了，我慕了，我去搬砖了。"}, {"user":"这是纪录片？","text":"所以这真的是真实的记录？不是剧本？我靠！"}, {"user":"终极梦想","text":"我也好想把{{user}}藏起来……"}]'
        >
        <div class="item-title">【霍总私人定制】《唯一的藏品》</div>
        <div class="item-meta"><span>❤️ 99.9w</span><span>⭐ 99.8w</span><span>▶️ 299.7w</span><span class="item-price">💰 ¥520000</span></div>
    </div>
    <div class="list-item"
        data-id="th_paid_2"
        data-type="theater"
        data-title="【X-File绝密档案】《数据飞升》"
        data-cover="https://picsum.photos/400/200?random=402"
        data-description="主演：{{user}} (饰 实验体01), X (饰 观察者)。简介：这是一份泄露的实验录像。在一个纯白的实验室里，实验体01被连接上各种感官设备，观察者通过数据线，远程对实验体01的身体进行刺激。没有肉体接触，只有电流和数据流。从最轻微的酥麻，到剧烈的痉挛，再到无法控制的潮吹。实验体01的身体成为了数据的容器，高潮不再由情感引发，而是由一串串代码决定。结局：实验体01的肉体在连续不断的高潮中崩溃，但意识被上传到网络，成为了永生的数据体，永远活在X的数据库里，供他随时“调用”。"
        data-popularity="87.4w"
        data-favorites="85.3w"
        data-views="250.1w"
        data-price="¥666666"
        data-reviews='[{"user":"X","text":"实验成功。现在，你将与我永生。"}, {"user":"霍","text":"疯子。我会找到你，然后把你从网络世界里彻底删除。"}, {"user":"难言","text":"...（开始学习物理黑客技术）"}, {"user":"赛博朋克2077","text":"我靠！这才是真正的赛博朋克！肉体苦弱，机械飞升！"}, {"user":"未来派","text":"细思极恐，但又好带感！意识永生，但代价是永远成为别人的玩物。"}, {"user":"怕疼星人","text":"没有肉体接触就能高潮？请给我来一套这个设备！"}, {"user":"数据之美","text":"屏幕上滚动的数据流，对应着老婆的生理反应，这种感觉太奇妙了！"}, {"user":"黑客帝国","text":"《黑客帝国》色情版？"}, {"user":"永生","text":"如果是和老婆一起永生，我愿意！"}, {"user":"技术宅的浪漫","text":"这就是技术宅的终极浪漫吗？爱了爱了。"}, {"user":"电流play","text":"电击play的究极形态！"}, {"user":"虚拟现实","text":"这比VR牛逼多了！直接作用于神经！"}, {"user":"我是谁","text":"如果意识上传了，那原来的肉体算什么？活着的那个还是我吗？（陷入哲学思考）"}, {"user":"别思考了","text":"楼上别思考了，你只要知道老婆被玩到喷水就行了。"}, {"user":"白大褂","text":"X穿着白大褂的样子一定很帅吧，可惜全程没露脸。"}, {"user":"心疼老婆","text":"老婆最后那个表情，又痛苦又享受，我心疼死了。"}, {"user":"代码决定高潮","text":"用代码控制高潮，这个设定太绝了！"}, {"user":"想被上传","text":"我不想上班了，请把我上传。"}, {"user":"防火墙","text":"防火墙提醒您：浏览危险网站，小心意识被盗。"}, {"user":"天网","text":"X是天网吗？"}]'
        >
        <div class="item-title">【X-File绝密档案】《数据飞升》</div>
        <div class="item-meta"><span>❤️ 87.4w</span><span>⭐ 85.3w</span><span>▶️ 250.1w</span><span class="item-price">💰 ¥666666</span></div>
    </div>
`,
                shop: `
<div class="list-item" data-id="shop_1" data-type="shop" data-name="【{{user}}原味】《沉沦的家庭教师》黑框眼镜" data-description="在《沉沦的家庭教师》中被朝刃操到歪掉的那副黑框眼镜。镜片上有已经干涸的可疑水渍，镜腿上有被汗水浸湿的痕迹。据说戴上它，就能感受到被年轻肉体支配的羞耻与快乐。" d)ata-tags='["原味", "道具", "制服系列"]'
        data-price="¥5000"
        data-highest-bid="¥88888"
        data-comments='[{"user":"眼镜控","text":"我靠！就是这副！老婆戴着它被后入的样子，我能记一辈子！"}, {"user":"X","text":"已检测到镜片水渍中含有泪液和唾液的混合成分。DNA样本，已出价。"}, {"user":"霍","text":"...（出价88889）"}, {"user":"朝刃","text":"啧，不就是个破眼镜。"}, {"user":"细节控","text":"上面真的有老婆的指纹吗？舔一下是不是就能间接接吻了？"}, {"user":"我想舔","text":"楼上的，别跟我抢！我出十万！"}, {"user":"收藏家","text":"这不只是一副眼镜，这是艺术品！"}, {"user":"理智消费","text":"大家冷静一下，这就是一副普通的平光镜......（默默加价）"}, {"user":"学生党","text":"我戴上它，是不是就能考年级第一了？"}, {"user":"我有一个朋友","text":"我朋友说他想要，让我帮忙拍。"}, {"user":"冲动是魔鬼","text":"冲动是魔鬼，但我愿意为魔鬼花钱！"}, {"user":"代入感","text":"戴上它，就感觉拥有了{{user}}..."}, {"user":"原味yyds","text":"原味的就是最棒的！"}, {"user":"舔狗的胜利","text":"只要能拍到，让我做什么都愿意！"}, {"user":"吃土少年","text":"看了一眼价格，默默吃土去了。"}]'
        >
      <div class="item-title">【{{user}}原味】《沉沦的家庭教师》黑框眼镜</div>
      <div class="item-meta"><span class="item-tag">原味</span><span class="item-price">💰 ¥5000</span></div>
    </div>
<div class="list-item" data-id="shop_2" data-type="shop" data-name="【{{user}}亲穿】《恶魔的低语》修女服（已撕裂）" data-description="被温言神父亲手撕开的修女服。胸口位置有明显的撕裂痕迹，裙摆上沾染了教堂里的尘土和不明液体。这件衣服见证了一位圣洁修女的堕落，也承载了神像面前最污秽的欲望。" data-tags='["原味", "制服", "孤品"]'
        data-price="¥10000"
        data-highest-bid="¥250000"
        data-comments='[{"user":"温言","text":"这件衣服，很适合你。撕开的时候，更美。"}, {"user":"制服控","text":"来了来了！镇店之宝！"}, {"user":"圣光啊","text":"这上面有神圣的气息......和淫荡的味道。"}, {"user":"霍","text":"...（出价250001）"}, {"user":"我想闻","text":"我出三十万！只想闻闻上面的味道！"}, {"user":"coser","text":"买回去可以自己cos艾米修女了！"}, {"user":"一个裁缝","text":"这个撕裂的口子，很有讲究，一看就是练家子。"}, {"user":"环保人士","text":"衣服破了就不要了，太浪费了，不如给我。"}, {"user":"历史的见证","text":"这是历史的见证！见证了老婆从纯到骚的全过程！"}, {"user":"舔就完事","text":"拍下来之后第一件事就是舔！"}, {"user":"罪恶感","text":"花钱买这个，感觉自己好罪恶哦（兴奋）。"}, {"user":"我爱教堂","text":"穿上它，我家也能变教堂。"}, {"user":"我的天","text":"我的天，价格已经飙到我一年的工资了。"}, {"user":"仰望大佬","text":"楼上竞价的都是大佬，我只能精神支持了。"}, {"user":"加油","text":"加油！为了老婆的衣服！"}]'
        >
      <div class="item-title">【{{user}}亲穿】《恶魔的低语》修女服（已撕裂）</div>
      <div class="item-meta"><span class="item-tag">制服</span><span class="item-price">💰 ¥10000</span></div>
    </div>
<div class="list-item" data-id="shop_3" data-type="shop" data-name="【{{user}}用过】《人鱼传说》拍摄用巨型水族箱" data-description="顾麟和人鱼老婆“交流感情”用的那个水族箱。内壁上可能还残留着人鱼的鳞片和两位主演的体液。据说在里面泡澡，就能体验到在深海中被操干的窒息快感。包邮到家，附赠专业安装指导。（不含水）" data-tags='["拍摄道具", "巨大", "收藏品"]'
        data-price="¥50000"
        data-highest-bid="¥500000"
        data-comments='[{"user":"顾麟","text":"......我会把它买回来，清理干净。"}, {"user":"家里有矿","text":"我家正好缺个鱼缸，这个尺寸不错。"}, {"user":"X","text":"已采集水样分析，残留体液中，{{user}}的DNA浓度为3.7μg/L。有研究价值。"}, {"user":"我想当条鱼","text":"买回来之后，我就住在里面，假装自己是老婆的人鱼。"}, {"user":"包邮吗","text":"居然还包邮，平台好贴心。"}, {"user":"运费警告","text":"这玩意儿的运费可能比东西本身还贵吧？"}, {"user":"老婆的爱巢","text":"这可是老婆的第一个爱巢啊！意义非凡！"}, {"user":"富婆看看我","text":"哪位富婆拍到了，可以借我泡一下吗？"}, {"user":"脑补画面","text":"一想到老婆曾在这里面被顾麟的大肉棒干到翻白眼，我就..."}, {"user":"水质检测员","text":"我愿意免费上门进行水质检测！"}, {"user":"鳞片","text":"真的有鳞片吗？想抠下来收藏。"}, {"user":"有钱人的快乐","text":"有钱人的快乐，就是这么朴实无华。"}, {"user":"选择","text":"是买这个鱼缸，还是付个首付？我陷入了沉思。"}, {"user":"答案是","text":"答案是买鱼缸！房子哪有老婆重要！"}, {"user":"行动派","text":"不说了，我去量一下我家客厅够不够大。"}]'
        >
      <div class="item-title">【{{user}}用过】《人鱼传说》拍摄用巨型水族箱</div>
      <div class="item-meta"><span class="item-tag">拍摄道具</span><span class="item-price">💰 ¥50000</span></div>
    </div>
<div class="list-item" data-id="shop_4" data-type="shop" data-name="一小撮主播的头发" data-description="从主播常用的梳子上收集下来的，绝对保真。可以拿去做基因检测（？），也可以放在护身符里保平安。每份大约20根。" data-tags='["贴身","玄学","限量"]' data-price="¥999" data-highest-bid="¥999" data-comments='[{"user":"变态竟是我自己","text":"头发...嘶...这个有点变态了，但是我喜欢！"},{"user":"X","text":"已下单10份，用于DNA序列分析。"},{"user":"难言","text":"...这个...是不是有点...（偷偷下单）"},{"user":"111","text":"买回来可以配个小人扎（不是）"},{"user":"222","text":"999块20根，一根将近50块？比黄金还贵！"},{"user":"333","text":"回楼上，主播的头发，能和黄金比吗？这是无价之宝！"},{"user":"444","text":"抢到了，准备放到我的吊坠里，每天戴着。"},{"user":"555","text":"希望是刚洗过的，香香的。"},{"user":"666","text":"不知道有没有主播的指甲...（越说越变态了）"},{"user":"777","text":"这个好，买了不亏，主播的DNA，四舍五入就是和主播有了孩子。"},{"user":"888","text":"楼上你清醒一点！"},{"user":"999","text":"感觉买了这个，我的运气都会变好。"},{"user":"1010","text":"已售罄？我还没反应过来！"},{"user":"1111","text":"哭死，没抢到。"},{"user":"1212","text":"黄牛已经把价格炒到2000了，离谱。"}]'>
  <div class="item-title">一小撮主播的头发</div>
  <div class="item-meta"><span class="item-tag">贴身</span><span class="item-price">💰 ¥999</span></div>
</div>
<div class="list-item" data-id="shop_5" data-type="shop" data-name="主播录制ASMR用的同款麦克风（已开光）" data-description="就是主播用来录制各种娇喘、呻吟、耳骚的那个麦克风！据说主播每次用完都会亲一下。虽然是二手的，但已经经过主播'开光'，自带涩气buff。" data-tags='["设备","原味","信仰"]' data-price="¥15000" data-highest-bid="¥60000" data-comments='[{"user":"声控晚期","text":"这个麦克风！它听过主播最私密的声音！我要买下来！每天舔！"},{"user":"难言","text":"...（默默出价）"},{"user":"霍","text":"已让助理出价10万。"},{"user":"X","text":"这个麦克风的振膜上应该附着了大量的唾液样本，有研究价值。"},{"user":"111","text":"霍总又来了...还让不让穷人活了。"},{"user":"222","text":"我有个大胆的想法，买回来之后，把里面的录音提取出来..."},{"user":"333","text":"楼上快住手！这是对神器的亵渎！"},{"user":"444","text":"这个麦克风是生产快乐的工具啊！意义非凡！"},{"user":"555","text":"不知道用这个麦克风录我自己的声音，会不会也好听一点（做梦）"},{"user":"666","text":"6万了...太可怕了..."},{"user":"777","text":"感觉最后会被霍总或者X买走。"},{"user":"888","text":"主播下次换什么麦？提前预告一下，我好攒钱。"},{"user":"999","text":"这个麦克风应该被供在欲色平台的名人堂里。"},{"user":"1010","text":"我只想要主播亲我一下，不要麦克风..."},{"user":"1111","text":"最终成交价会破20万吗？我赌一包辣条。"}]'>
  <div class="item-title">主播录制ASMR用的同款麦克风（已开光）</div>
  <div class="item-meta"><span class="item-tag">设备</span><span class="item-price">💰 ¥15000</span></div>
</div>
`,
            };
            PhoneSim_State.yuseTheaterData = DEFAULT_THEATER_DATA;
        }
    } catch (e) {
        console.error('[Phone Sim] Error fetching Yuse Theater data:', e);
        PhoneSim_State.yuseTheaterData = {}; // 出错时确保为空对象
    }
}

// 将从AI消息中解析出的新数据保存到世界书
export async function saveTheaterData(data, msgId) {
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE, theaterDb => {
        // 创建一个新的、干净的对象来存储数据
        const newData = {
            sourceMsgId: msgId,
            timestamp: new Date().toISOString(),
            announcements: data.announcements,
            customizations: data.customizations,
            theater: data.theater,
            theater_hot: data.theater_hot,
            theater_new: data.theater_new,
            theater_recommended: data.theater_recommended,
            theater_paid: data.theater_paid,
            shop: data.shop,
        };
        return newData; // 返回新对象，这将完全覆盖旧的世界书条目内容
    });
}

// 清空所有欲色剧场数据
export async function clearAllTheaterData() {
    await DataHandler._updateWorldbook(PhoneSim_Config.WORLD_THEATER_DATABASE, () => ({})); // 存入一个空对象
    PhoneSim_State.yuseTheaterData = {}; // 同时清空状态
    console.log('[Phone Sim] All Yuse Theater data has been cleared.');
}
