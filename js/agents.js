// ═══════════════════════════════════════════════
// MirrorFace · Agent 画像 & 语料库
// 基于和平精英真实社区用户画像建模
// ═══════════════════════════════════════════════

const AGENT_TYPES = [
  { id:'hardcore', emoji:'🎯', name:'硬核排位党', count:25, traits:'关注枪械平衡、外挂问题，追求段位和竞技公平', sentiment:'偏负面', faction:'反外挂鹰派', active:true },
  { id:'whale', emoji:'💰', name:'氪金大佬', count:15, traits:'传世武器收藏者，关注皮肤品质和保值，消费力强', sentiment:'偏中性', faction:'商业化理解派', active:true },
  { id:'skin', emoji:'🎨', name:'皮肤收集党', count:20, traits:'关注性价比，对定价敏感，喜欢收集限定皮肤', sentiment:'偏负面', faction:'商业化抵制派', active:true },
  { id:'female', emoji:'👧', name:'女性休闲玩家', count:25, traits:'关注社交体验、皮肤颜值，小红书活跃，对暴力内容敏感', sentiment:'偏正向', faction:'玩法创新派', active:true },
  { id:'metro', emoji:'🚇', name:'地铁逃生党', count:20, traits:'PVE玩法爱好者，关注新地图和玩法更新，不太关心竞技', sentiment:'偏正向', faction:'玩法创新派', active:true },
  { id:'esports', emoji:'🏆', name:'电竞观众', count:10, traits:'关注PEL赛事、选手动态、赛事皮肤', sentiment:'偏中性', faction:'官方信任派', active:true },
  { id:'veteran', emoji:'👴', name:'情怀老兵', count:15, traits:'从刺激战场时代开始玩，怀念老版本，对改动敏感', sentiment:'偏负面', faction:'情怀守护者', active:true },
  { id:'lowspec', emoji:'📱', name:'低配手机党', count:15, traits:'对性能优化极度敏感，经常遇到卡顿闪退', sentiment:'偏负面', faction:'技术抱怨派', active:true },
  { id:'pc', emoji:'🖥️', name:'PC模拟器党', count:10, traits:'关注PC适配、键鼠手感、画质设置', sentiment:'偏中性', faction:'官方信任派', active:true },
  { id:'kol', emoji:'🎬', name:'KOL/主播', count:10, traits:'影响力节点，内容创作者，发言有号召力', sentiment:'偏中性', faction:'KOL引导派', active:true },
  { id:'f2p', emoji:'🆓', name:'白嫖党', count:20, traits:'只玩不充，关注免费福利和活动奖励', sentiment:'偏负面', faction:'商业化抵制派', active:true },
  { id:'social', emoji:'🤝', name:'社交组队党', count:15, traits:'关注组队体验、语音质量、好友系统', sentiment:'偏正向', faction:'玩法创新派', active:true },
  { id:'anticheat', emoji:'🛡️', name:'反外挂斗士', count:10, traits:'举报达人，对外挂零容忍，关注封号公告', sentiment:'偏负面', faction:'反外挂鹰派', active:true },
  { id:'scam_victim', emoji:'💔', name:'受骗维权者', count:8, traits:'遭遇过交易诈骗，关注安全环境和官方处理', sentiment:'偏负面', faction:'安全焦虑派', active:true },
  { id:'competitor', emoji:'🔄', name:'竞品迁移派', count:8, traits:'同时玩暗区突围/三角洲行动，经常对比', sentiment:'偏负面', faction:'竞品迁移派', active:true },
  { id:'silent', emoji:'😶', name:'沉默大多数', count:30, traits:'潜水观望，偶尔发言，但会用脚投票', sentiment:'偏中性', faction:'沉默大多数', active:true },
];

const FACTIONS = [
  { name:'反外挂鹰派', color:'#ff4757', weight:0.12 },
  { name:'商业化抵制派', color:'#ff6348', weight:0.15 },
  { name:'商业化理解派', color:'#ffa502', weight:0.08 },
  { name:'官方信任派', color:'#2ed573', weight:0.10 },
  { name:'情怀守护者', color:'#1e90ff', weight:0.08 },
  { name:'竞品迁移派', color:'#a55eea', weight:0.06 },
  { name:'玩法创新派', color:'#00d2d3', weight:0.12 },
  { name:'KOL引导派', color:'#ff9ff3', weight:0.05 },
  { name:'安全焦虑派', color:'#ee5a24', weight:0.06 },
  { name:'技术抱怨派', color:'#c44569', weight:0.06 },
  { name:'沉默大多数', color:'#576574', weight:0.12 },
];

// ═══════════════════════════════════════════════
// 语料模板库 — 按事件类型×角色类型组合
// 每个模板包含：文本模板（{topic}占位符）、情绪、反应
// ═══════════════════════════════════════════════
const CORPUS = {
  commercial: {
    hardcore: [
      { text: "又是皮肤又是皮肤，能不能先把外挂治治？{topic}有什么用，打个排位全是神仙", sentiment: "negative", reactions: ["确实", "外挂不治别谈别的"] },
      { text: "这钱花在反外挂上不好吗？每天举报十几个，封了又来", sentiment: "negative", reactions: ["真的离谱", "+1"] },
      { text: "说实话这价格还行吧，但前提是游戏环境得好啊", sentiment: "neutral", reactions: ["环境确实拉胯"] },
    ],
    whale: [
      { text: "看了一下品质还可以，准备入手。传世武器就是要收藏齐全", sentiment: "positive", reactions: ["大佬", "羡慕"] },
      { text: "这个定价可以接受，关键是特效够不够炫，保值不保值", sentiment: "neutral", reactions: ["大佬视角不一样"] },
      { text: "我倒是不差这点钱，就是希望别搞那种抽奖的，直接买断最好", sentiment: "neutral", reactions: ["直接买断+1", "抽奖就是坑"] },
    ],
    skin: [
      { text: "又涨价了？上次还说要照顾平民玩家呢，说话跟放屁一样", sentiment: "negative", reactions: ["说得好", "光子的嘴骗人的鬼"] },
      { text: "性价比太低了，这价格够我吃一星期饭了，不如去买暗区皮肤", sentiment: "negative", reactions: ["暗区确实香", "理性消费"] },
      { text: "等返场打折再说吧，原价冲的都是大怨种", sentiment: "negative", reactions: ["等等党永远不亏", "打折也贵"] },
    ],
    female: [
      { text: "这个皮肤好好看！颜色搭配很绝，但是有点小贵诶", sentiment: "neutral", reactions: ["确实好看", "贵是真的贵"] },
      { text: "姐妹们有没有觉得这次设计还不错？虽然贵但是真的好看", sentiment: "positive", reactions: ["好看！", "已入手"] },
      { text: "小红书上都在晒了，感觉不买就落伍了😂但钱包在哭", sentiment: "neutral", reactions: ["哈哈同感", "别冲动消费"] },
    ],
    metro: [
      { text: "皮肤什么的无所谓啦，地铁逃生什么时候出新地图才是重点", sentiment: "neutral", reactions: ["地铁逃生yyds", "新地图+1"] },
      { text: "PVE玩家表示对皮肤不太感冒，但如果有地铁逃生专属皮肤我就买", sentiment: "neutral", reactions: ["地铁皮肤确实少"] },
    ],
    esports: [
      { text: "希望出个PEL联名款，支持自己喜欢的战队比什么都好", sentiment: "positive", reactions: ["4AM!", "AG!"] },
      { text: "商业化没问题，赛事需要资金支持，大家理性看待", sentiment: "positive", reactions: ["理性", "确实需要钱"] },
    ],
    veteran: [
      { text: "想当年刺激战场多纯粹，现在全是氪金坑，越来越不像话了", sentiment: "negative", reactions: ["怀念刺激战场", "回不去了"] },
      { text: "以前的皮肤多良心啊，现在这价格简直离谱，老玩家心寒", sentiment: "negative", reactions: ["确实", "老玩家不配拥有好皮肤？"] },
    ],
    lowspec: [
      { text: "皮肤做那么花哨，我手机都带不动了，能不能优化优化？", sentiment: "negative", reactions: ["低配党的痛", "优化>皮肤"] },
      { text: "每次更新皮肤就卡一次，求求了先优化再出皮肤行不行", sentiment: "negative", reactions: ["同感", "卡到想摔手机"] },
    ],
    kol: [
      { text: "刚拿到体验服试了一下，特效确实不错，但定价确实有争议。大家理性消费，量力而行", sentiment: "neutral", reactions: ["主播说得对", "等你出测评"] },
      { text: "做了个详细测评视频，客观来说品质在线，但性价比见仁见智", sentiment: "neutral", reactions: ["看了你视频", "分析得很到位"] },
    ],
    f2p: [
      { text: "白嫖党表示毫无波动，反正买不起也不想买，免费皮肤够用了", sentiment: "negative", reactions: ["白嫖万岁", "免费的最好"] },
      { text: "又是氪金活动，白嫖玩家啥也没有，这游戏越来越不友好了", sentiment: "negative", reactions: ["+1", "白嫖党被抛弃了"] },
    ],
    social: [
      { text: "无所谓啦，能和朋友一起玩就行，皮肤这东西看个人", sentiment: "positive", reactions: ["社交才是核心", "对的"] },
    ],
    anticheat: [
      { text: "皮肤赚的钱能不能多投点在反外挂上？天天遇挂比没皮肤更难受", sentiment: "negative", reactions: ["说到点子上了", "外挂才是毒瘤"] },
    ],
    scam_victim: [
      { text: "买皮肤小心被骗啊，之前有人假冒客服骗了我两千多，官方到现在没处理", sentiment: "negative", reactions: ["小心！", "官方不管"] },
    ],
    competitor: [
      { text: "这价格还不如去三角洲买通行证，品质比这高多了", sentiment: "negative", reactions: ["三角洲确实香", "别比了"] },
      { text: "暗区突围的皮肤性价比甩和平精英几条街，真心建议去体验下", sentiment: "negative", reactions: ["别引战", "各有各的好"] },
    ],
    silent: [
      { text: "看看再说吧…", sentiment: "neutral", reactions: [] },
      { text: "不评价，等口碑出来", sentiment: "neutral", reactions: ["理性"] },
    ],
    pc: [
      { text: "PC端显示效果还行，就是希望键鼠操作能再优化优化", sentiment: "neutral", reactions: ["PC端被遗忘了", "模拟器优化确实差"] },
    ],
  },
  update: {
    hardcore: [
      { text: "这次更新改了什么？枪械平衡动了没有？M416还是无敌吗？", sentiment: "neutral", reactions: ["M4确实该削", "别动我M4"] },
      { text: "更新了半天，外挂问题还是没解决，差评", sentiment: "negative", reactions: ["外挂永远的痛", "+1"] },
    ],
    whale: [
      { text: "新赛季新气象，希望有好皮肤，准备好钱包了", sentiment: "positive", reactions: ["大佬", "土豪"] },
    ],
    skin: [
      { text: "赛季手册的皮肤好看吗？不好看就不买了", sentiment: "neutral", reactions: ["等爆料", "上赛季的不错"] },
    ],
    female: [
      { text: "新地图好漂亮啊！拍照打卡走起～有没有姐妹一起", sentiment: "positive", reactions: ["约！", "在哪里打卡"] },
      { text: "更新完界面变好看了，但是怎么感觉操作变了？不太习惯", sentiment: "neutral", reactions: ["慢慢适应", "我也觉得"] },
    ],
    metro: [
      { text: "地铁逃生更新了吗？新Boss什么时候出？等得花儿都谢了", sentiment: "neutral", reactions: ["地铁逃生yyds", "快更新！"] },
      { text: "这次PVE内容终于加了新关卡，太感动了，光子终于记得我们了", sentiment: "positive", reactions: ["终于！", "地铁党狂喜"] },
    ],
    veteran: [
      { text: "又改操作手感了？能不能别瞎改，越改越不像原来的刺激战场了", sentiment: "negative", reactions: ["回不去了", "怀念以前"] },
    ],
    lowspec: [
      { text: "更新完又多了2个G，我手机快装不下了😭能不能出个精简版", sentiment: "negative", reactions: ["同感", "存储焦虑"] },
    ],
    kol: [
      { text: "新版本体验了一下午，总体来说进步明显，但还有几个点需要优化，晚上出详细视频", sentiment: "positive", reactions: ["等视频", "主播辛苦了"] },
    ],
    f2p: [
      { text: "新赛季白嫖有什么福利？求攻略！", sentiment: "neutral", reactions: ["登录送皮肤", "白嫖攻略+1"] },
    ],
    esports: [
      { text: "新版本对比赛影响大吗？载具改动可能会影响转圈策略", sentiment: "neutral", reactions: ["确实", "等职业选手反馈"] },
    ],
    social: [
      { text: "更新完组队界面好用多了！终于能快速邀请好友了", sentiment: "positive", reactions: ["好评", "之前太难用了"] },
    ],
    anticheat: [
      { text: "更新公告里提了反外挂升级吗？没提的话就是敷衍", sentiment: "negative", reactions: ["确实没看到", "每次都说在优化"] },
    ],
    competitor: [
      { text: "看了一下更新内容，三角洲行动上周更新的内容比这丰富多了", sentiment: "negative", reactions: ["别比了", "各有各的好吧"] },
    ],
    silent: [
      { text: "更新了，先玩玩看", sentiment: "neutral", reactions: [] },
    ],
    scam_victim: [
      { text: "更新了安全系统吗？交易诈骗的问题解决了没有？", sentiment: "negative", reactions: ["关注", "诈骗太多了"] },
    ],
    pc: [
      { text: "PC端更新了什么？希望画质选项能多一些，4K支持有了吗", sentiment: "neutral", reactions: ["PC玩家被遗忘", "画质确实该提升"] },
    ],
  },
  anticheat: {
    hardcore: [
      { text: "终于开始治外挂了？晚了多少年了，希望这次是来真的", sentiment: "neutral", reactions: ["观望", "别又是做样子"] },
      { text: "封号力度还是不够，应该直接硬件ban，让他们换电脑都没用", sentiment: "negative", reactions: ["硬件ban+1", "支持"] },
    ],
    anticheat: [
      { text: "作为举报了上千个外挂的老举报人，这次更新如果有效我直播吃键盘", sentiment: "positive", reactions: ["哈哈哈", "立flag了"] },
      { text: "说真的，之前举报的外挂有一半都没处理，这次能不能认真点？", sentiment: "negative", reactions: ["确实", "举报系统形同虚设"] },
    ],
    whale: [
      { text: "外挂少了我才愿意花钱买皮肤啊，不然花了钱被挂打死，亏上加亏", sentiment: "neutral", reactions: ["确实", "花钱受气"] },
    ],
    kol: [
      { text: "刚直播遇到明目张胆的透视挂，录像已保存。希望这次反外挂升级能有实际效果", sentiment: "neutral", reactions: ["看到了", "太嚣张了"] },
    ],
    veteran: [
      { text: "以前外挂没这么多的，是从什么时候开始变成这样的？怀念以前", sentiment: "negative", reactions: ["S3以后就多了", "回不去了"] },
    ],
    female: [
      { text: "遇到外挂真的好烦，打不过就算了还被嘲讽，心态都崩了", sentiment: "negative", reactions: ["抱抱", "确实影响体验"] },
    ],
    f2p: [
      { text: "免费玩家也有权利要求公平的游戏环境吧？外挂不分充没充钱", sentiment: "negative", reactions: ["说得对", "公平很重要"] },
    ],
    competitor: [
      { text: "暗区突围的反外挂做得比和平精英好多了，至少没那么猖獗", sentiment: "negative", reactions: ["别比了", "暗区也有挂"] },
    ],
    silent: [
      { text: "遇到外挂就退了，懒得说了", sentiment: "negative", reactions: ["心累"] },
    ],
    lowspec: [
      { text: "反外挂系统别太吃性能啊，我手机本来就卡", sentiment: "neutral", reactions: ["低配党的担忧", "确实"] },
    ],
    scam_victim: [
      { text: "外挂和诈骗都要治，我被骗了传世武器到现在都没追回来", sentiment: "negative", reactions: ["心疼", "官方不作为"] },
    ],
    skin: [
      { text: "治好外挂我就充钱，这是我的底线", sentiment: "neutral", reactions: ["条件交换hhh", "合理"] },
    ],
    metro: [
      { text: "PVE模式外挂少一些，但排位真的没法玩", sentiment: "neutral", reactions: ["PVE清净", "排位地狱"] },
    ],
    esports: [
      { text: "职业赛场倒还好，主要是路人局太恶劣了", sentiment: "neutral", reactions: ["赛事环境还行", "路人局才是重灾区"] },
    ],
    social: [
      { text: "带妹打排位遇到外挂，直接被打自闭了，太尴尬了", sentiment: "negative", reactions: ["哈哈哈", "社死现场"] },
    ],
    pc: [
      { text: "PC端外挂更多，模拟器局简直是重灾区", sentiment: "negative", reactions: ["确实", "PC端没人管"] },
    ],
  },
  collab: {
    hardcore: [
      { text: "联名搞这么多，游戏本身优化了吗？本末倒置", sentiment: "negative", reactions: ["说得对", "游戏好才是根本"] },
    ],
    whale: [
      { text: "联名款必入，收藏价值拉满。希望品质对得起价格", sentiment: "positive", reactions: ["大佬", "联名确实有收藏价值"] },
    ],
    skin: [
      { text: "联名皮肤好看的话可以考虑，但别太贵了，上次那个价格劝退", sentiment: "neutral", reactions: ["看价格", "好看就行"] },
    ],
    female: [
      { text: "这个联名好可爱啊！必须入手！已经在小红书看到好多姐妹晒了", sentiment: "positive", reactions: ["我也要！", "太可爱了"] },
      { text: "联名周边好想要，有没有线下快闪店？想去打卡", sentiment: "positive", reactions: ["坐标哪里", "快闪+1"] },
    ],
    kol: [
      { text: "联名合作是好事，能给游戏带来新用户。关键是联名内容要有诚意，别只是贴个logo", sentiment: "neutral", reactions: ["说得对", "诚意最重要"] },
    ],
    veteran: [
      { text: "和平精英什么时候变成联名精英了？能不能专心做游戏？", sentiment: "negative", reactions: ["哈哈联名精英", "确实太多了"] },
    ],
    f2p: [
      { text: "联名活动有免费福利吗？没有的话跟我没关系", sentiment: "neutral", reactions: ["白嫖才是真理", "等攻略"] },
    ],
    metro: [
      { text: "如果联名能出个地铁逃生主题的就好了，PVE联名才有意思", sentiment: "neutral", reactions: ["好主意", "地铁联名绝了"] },
    ],
    esports: [
      { text: "联名合作能给赛事带来更多赞助，支持", sentiment: "positive", reactions: ["商业化支持赛事", "对的"] },
    ],
    competitor: [
      { text: "三角洲行动的联名做得更有质感，和平精英学学", sentiment: "negative", reactions: ["别比了", "各有千秋"] },
    ],
    silent: [
      { text: "联名…看看就好", sentiment: "neutral", reactions: [] },
    ],
    social: [
      { text: "联名活动可以约朋友一起玩，有社交属性的活动最棒了", sentiment: "positive", reactions: ["约起来", "社交才是核心"] },
    ],
    anticheat: [
      { text: "联名赚的钱能不能投入反外挂？别光赚钱不干活", sentiment: "negative", reactions: ["说到痛处了", "+1"] },
    ],
    scam_victim: [
      { text: "联名限定物品小心被骗，之前就有人假冒联名客服诈骗", sentiment: "negative", reactions: ["注意安全", "诈骗无处不在"] },
    ],
    lowspec: [
      { text: "联名皮肤特效别太多，我手机扛不住", sentiment: "neutral", reactions: ["低配党日常", "优化一下吧"] },
    ],
    pc: [
      { text: "联名活动PC端也能参加吧？别又是手机独占", sentiment: "neutral", reactions: ["应该可以", "PC被遗忘"] },
    ],
  },
  esports: {
    hardcore: [
      { text: "这赛季PEL太精彩了，4AM状态回来了！", sentiment: "positive", reactions: ["4AM!", "永远的神"] },
    ],
    esports: [
      { text: "比赛质量越来越高了，选手操作真的顶，建议多办线下赛", sentiment: "positive", reactions: ["线下赛氛围好", "支持"] },
    ],
    kol: [
      { text: "刚解说完比赛，这场对决太精彩了。和平精英电竞的观赏性真的在提升", sentiment: "positive", reactions: ["看了直播", "解说辛苦了"] },
    ],
    whale: [
      { text: "赛事皮肤必入，支持自己喜欢的战队", sentiment: "positive", reactions: ["信仰充值", "战队加油"] },
    ],
    female: [
      { text: "虽然不太懂比赛，但看选手打得好厉害啊，好帅！", sentiment: "positive", reactions: ["哈哈", "饭圈化了"] },
    ],
    veteran: [
      { text: "以前的赛事更热血，现在感觉商业化太重了", sentiment: "neutral", reactions: ["怀旧了", "时代变了"] },
    ],
    f2p: [
      { text: "看比赛有没有送皮肤的活动？白嫖一波", sentiment: "neutral", reactions: ["有预测送的", "白嫖攻略"] },
    ],
    silent: [
      { text: "看看比赛，不说话", sentiment: "neutral", reactions: [] },
    ],
    competitor: [
      { text: "说实话无畏契约的赛事观赏性更强，FPS电竞还得看V", sentiment: "negative", reactions: ["不同游戏没法比", "各有特色"] },
    ],
    skin: [
      { text: "赛事皮肤好看吗？好看就买", sentiment: "neutral", reactions: ["还行", "看个人喜好"] },
    ],
    metro: [
      { text: "什么时候出地铁逃生比赛？PVE也可以搞竞速赛啊", sentiment: "neutral", reactions: ["好主意", "PVE竞速"] },
    ],
    anticheat: [
      { text: "赛事环境是干净的，为什么路人局就不能一样？", sentiment: "negative", reactions: ["好问题", "赛事有裁判"] },
    ],
    social: [
      { text: "约朋友一起看比赛，开黑看赛太爽了", sentiment: "positive", reactions: ["约！", "开黑看赛"] },
    ],
    lowspec: [
      { text: "看比赛直播不卡就行，游戏本身太卡了", sentiment: "neutral", reactions: ["直播流畅", "游戏卡"] },
    ],
    scam_victim: [
      { text: "赛事周边小心买到假货，之前有人卖假的赛事限定", sentiment: "negative", reactions: ["注意", "去官方渠道"] },
    ],
    pc: [
      { text: "比赛都是手机端的，PC端玩家感觉被边缘化了", sentiment: "neutral", reactions: ["PC端确实", "手游为主"] },
    ],
  },
  incident: {
    hardcore: [
      { text: "出了这种事还不回应？光子的危机公关是不是都放假了？", sentiment: "negative", reactions: ["等回应", "光子装死"] },
      { text: "这件事性质很严重，不是发个公告就能解决的，要有实际行动", sentiment: "negative", reactions: ["说得对", "要行动"] },
    ],
    whale: [
      { text: "作为充了几万的老玩家，这件事让我很失望，考虑弃坑了", sentiment: "negative", reactions: ["大佬都要走了", "挽留一下"] },
    ],
    skin: [
      { text: "这游戏还能玩吗？感觉要凉了，皮肤都白买了", sentiment: "negative", reactions: ["不至于", "确实担心"] },
    ],
    female: [
      { text: "好可怕…这种事情怎么能发生？官方赶紧处理啊", sentiment: "negative", reactions: ["害怕", "等官方说法"] },
    ],
    kol: [
      { text: "事情很严重，我暂时不会推荐这个游戏了。等官方给出满意的解决方案再说", sentiment: "negative", reactions: ["主播都这么说了", "等官方"] },
    ],
    veteran: [
      { text: "以前从来没出过这种事，这游戏是真的一年不如一年了", sentiment: "negative", reactions: ["唉", "怀念以前"] },
    ],
    f2p: [
      { text: "免费玩家无所谓，大不了换个游戏玩", sentiment: "neutral", reactions: ["洒脱", "确实"] },
    ],
    anticheat: [
      { text: "这不就是管理混乱的结果吗？连外挂都治不好，出事是早晚的", sentiment: "negative", reactions: ["一针见血", "确实"] },
    ],
    competitor: [
      { text: "还好我早就转三角洲了，和平精英这边问题太多了", sentiment: "negative", reactions: ["别踩一捧一", "确实有问题"] },
    ],
    silent: [
      { text: "……算了，不说了，看看官方怎么处理吧", sentiment: "negative", reactions: [] },
    ],
    scam_victim: [
      { text: "又出事了？这游戏的安全管理到底行不行？我被骗的钱还没追回来呢", sentiment: "negative", reactions: ["心疼", "官方不作为"] },
    ],
    metro: [
      { text: "虽然我主要玩PVE，但这种事影响整个游戏口碑，希望妥善处理", sentiment: "negative", reactions: ["对的", "口碑很重要"] },
    ],
    esports: [
      { text: "这对赛事品牌影响很大，赞助商会怎么看？希望尽快处理", sentiment: "negative", reactions: ["赞助商可能撤资", "影响很大"] },
    ],
    social: [
      { text: "朋友们都在讨论这件事，感觉大家都很失望", sentiment: "negative", reactions: ["确实", "群里都在说"] },
    ],
    lowspec: [
      { text: "先把这事处理好吧，优化什么的以后再说", sentiment: "negative", reactions: ["对", "大事优先"] },
    ],
    pc: [
      { text: "PC端玩家也很关注这件事，希望官方重视", sentiment: "negative", reactions: ["关注", "等回应"] },
    ],
  },
  custom: {
    hardcore: [
      { text: "这个事情对游戏平衡有影响吗？如果有的话我反对", sentiment: "neutral", reactions: ["看情况", "具体分析"] },
    ],
    whale: [
      { text: "只要不影响我的收藏品价值就行", sentiment: "neutral", reactions: ["大佬视角", "理性"] },
    ],
    skin: [
      { text: "跟皮肤有关系吗？没有的话我不太关心", sentiment: "neutral", reactions: ["皮肤党日常", "哈哈"] },
    ],
    female: [
      { text: "这件事我不太了解，有没有人科普一下？", sentiment: "neutral", reactions: ["我来说", "等大佬"] },
    ],
    kol: [
      { text: "这件事值得关注，我会做一期视频来分析一下", sentiment: "neutral", reactions: ["等视频", "期待"] },
    ],
    veteran: [
      { text: "以前也有类似的事，光子的处理方式一向让人失望", sentiment: "negative", reactions: ["确实", "历史重演"] },
    ],
    f2p: [
      { text: "跟免费玩家有关系吗？没有的话随便吧", sentiment: "neutral", reactions: ["白嫖党日常", "洒脱"] },
    ],
    silent: [
      { text: "观望中", sentiment: "neutral", reactions: [] },
    ],
    metro: [
      { text: "对PVE有影响吗？没有的话我继续打地铁逃生", sentiment: "neutral", reactions: ["地铁党", "专注PVE"] },
    ],
    esports: [
      { text: "对赛事有影响吗？关注中", sentiment: "neutral", reactions: ["等消息", "关注"] },
    ],
    anticheat: [
      { text: "不管什么事，先把外挂治好再说别的", sentiment: "negative", reactions: ["永远的主题", "+1"] },
    ],
    competitor: [
      { text: "反正三角洲/暗区那边也有类似情况，都差不多", sentiment: "neutral", reactions: ["客观", "确实"] },
    ],
    social: [
      { text: "群里在讨论这个，大家意见不一，我先看看", sentiment: "neutral", reactions: ["吃瓜", "看看"] },
    ],
    lowspec: [
      { text: "不管了，先优化性能吧，我手机快撑不住了", sentiment: "negative", reactions: ["低配党", "同感"] },
    ],
    scam_victim: [
      { text: "什么事都不如解决诈骗问题重要，我的钱还没追回来", sentiment: "negative", reactions: ["心疼", "官方不管"] },
    ],
    pc: [
      { text: "PC端也受影响吗？希望能一视同仁", sentiment: "neutral", reactions: ["PC玩家", "关注"] },
    ],
  }
};

// 通用反应词库
const GENERIC_REACTIONS = [
  "确实", "+1", "说得对", "有道理", "同意", "不同意", "观望", "等等看",
  "离谱", "无语", "笑死", "真的假的？", "太真实了", "说出了我的心声",
  "理性看待", "别急", "坐等反转", "前排", "马克", "顶", "支持",
  "反对", "无所谓", "随便吧", "算了", "不说了", "心累", "唉"
];
