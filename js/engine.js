// ═══════════════════════════════════════════════
// MirrorFace · 推演引擎 (纯前端，无需API Key)
// 基于规则引擎 + 语料库 + 情绪传播模型
// ═══════════════════════════════════════════════

class SimulationEngine {
  constructor() {
    this.allMessages = [];
    this.sentimentStats = { negative: 0, neutral: 0, positive: 0 };
    this.factionStats = {};
    this.crisisScore = 0;
    this.roundHistory = []; // 每轮的情绪快照
    this.isRunning = false;
    this.shouldStop = false;
  }

  reset() {
    this.allMessages = [];
    this.sentimentStats = { negative: 0, neutral: 0, positive: 0 };
    this.factionStats = {};
    this.crisisScore = 0;
    this.roundHistory = [];
    this.shouldStop = false;
  }

  // 获取活跃的Agent类型
  getActiveAgents() {
    return AGENT_TYPES.filter(a => a.active);
  }

  // 加权随机选择Agent
  pickRandomAgents(count) {
    const active = this.getActiveAgents();
    const pool = [];
    active.forEach(type => {
      for (let i = 0; i < type.count; i++) pool.push(type);
    });
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = [];
    const seen = new Set();
    for (const agent of pool) {
      if (!seen.has(agent.id) && picked.length < count) {
        seen.add(agent.id);
        picked.push(agent);
      }
    }
    while (picked.length < count && active.length > 0) {
      picked.push(active[Math.floor(Math.random() * active.length)]);
    }
    return picked;
  }

  // 核心：基于规则引擎生成发言
  generateMessage(agent, topic, eventType, roundNum, totalRounds, prevMessages) {
    const typeCorpus = CORPUS[eventType] || CORPUS.custom;
    const agentCorpus = typeCorpus[agent.id] || typeCorpus.silent || [];

    if (agentCorpus.length === 0) {
      return this._fallbackMessage(agent, topic, roundNum);
    }

    // 随机选一个模板
    const template = agentCorpus[Math.floor(Math.random() * agentCorpus.length)];

    // 替换话题占位符
    let text = template.text.replace(/{topic}/g, this._extractTopicKeyword(topic));

    // 根据轮数调整情绪强度
    text = this._adjustByRound(text, template.sentiment, roundNum, totalRounds, agent);

    // 情绪传播：受前面发言影响
    let sentiment = template.sentiment;
    sentiment = this._applySentimentContagion(sentiment, prevMessages, agent, roundNum);

    // 生成反应
    let reactions = [...(template.reactions || [])];
    if (roundNum >= 2 && Math.random() > 0.5) {
      reactions.push(GENERIC_REACTIONS[Math.floor(Math.random() * GENERIC_REACTIONS.length)]);
    }
    // 去重并限制数量
    reactions = [...new Set(reactions)].slice(0, 3);

    return {
      agentId: agent.id,
      agentName: agent.name,
      emoji: agent.emoji,
      text: text,
      sentiment: sentiment,
      faction: agent.faction,
      reactions: reactions,
      round: roundNum
    };
  }

  // 提取话题关键词
  _extractTopicKeyword(topic) {
    if (topic.length <= 15) return topic;
    // 提取引号内内容
    const quoted = topic.match(/[「」""'']/g) ? topic.match(/[「「](.+?)[」」]/)?.[1] || topic.match(/"(.+?)"/)?.[1] : null;
    if (quoted) return quoted;
    // 截取前15字
    return topic.substring(0, 15) + '…';
  }

  // 根据轮数调整文本和情绪
  _adjustByRound(text, baseSentiment, roundNum, totalRounds, agent) {
    // 第1轮：温和 → 第3轮：激烈 → 第5轮：稳定/疲惫
    if (roundNum === 1) {
      // 初始反应，保持原文
      return text;
    } else if (roundNum === 2) {
      // 发酵阶段，加入情绪词
      if (baseSentiment === 'negative') {
        const intensifiers = ['真的越想越气，', '越来越离谱了，', '忍不了了，'];
        return intensifiers[Math.floor(Math.random() * intensifiers.length)] + text;
      }
      return text;
    } else if (roundNum === 3) {
      // 高潮阶段，最激烈
      if (baseSentiment === 'negative') {
        const peaks = ['我劝大家都别充了！', '这游戏真的没救了，', '光子你是真不把玩家当人！', '一星差评安排上！'];
        return peaks[Math.floor(Math.random() * peaks.length)] + text;
      } else if (baseSentiment === 'positive') {
        const peaks = ['必须支持！', '这波我站官方！', '好评如潮！'];
        return peaks[Math.floor(Math.random() * peaks.length)] + text;
      }
      return text;
    } else if (roundNum === 4) {
      // 扩散阶段，引入外部视角
      const platforms = ['微博热搜都上了，', '贴吧炸了，', 'B站都在做视频了，', '小红书全是讨论的，', '抖音都在刷这个，'];
      return platforms[Math.floor(Math.random() * platforms.length)] + text;
    } else {
      // 收尾阶段，情绪回落
      if (baseSentiment === 'negative') {
        const fatigue = ['算了不想说了，', '爱咋咋地吧，', '说再多也没用，', '等官方回应吧，'];
        return fatigue[Math.floor(Math.random() * fatigue.length)] + text;
      }
      return '最终还是看行动吧，' + text;
    }
  }

  // 情绪传播模型
  _applySentimentContagion(baseSentiment, prevMessages, agent, roundNum) {
    if (prevMessages.length === 0) return baseSentiment;

    // 统计前面消息的情绪比例
    const recentMsgs = prevMessages.slice(-5);
    let negCount = 0, posCount = 0;
    recentMsgs.forEach(m => {
      if (m.sentiment === 'negative') negCount++;
      if (m.sentiment === 'positive') posCount++;
    });

    const negRatio = negCount / recentMsgs.length;
    const posRatio = posCount / recentMsgs.length;

    // KOL的影响力更大
    const kolInfluence = recentMsgs.some(m => m.agentId === 'kol');

    // 沉默大多数容易被带节奏
    if (agent.id === 'silent') {
      if (negRatio > 0.6) return Math.random() > 0.3 ? 'negative' : 'neutral';
      if (posRatio > 0.6) return Math.random() > 0.3 ? 'positive' : 'neutral';
      return 'neutral';
    }

    // 如果KOL发了负面，其他人更容易跟风
    if (kolInfluence && negRatio > 0.3 && baseSentiment === 'neutral') {
      return Math.random() > 0.5 ? 'negative' : 'neutral';
    }

    // 高轮数时负面情绪会传播
    if (roundNum >= 3 && negRatio > 0.7 && baseSentiment !== 'positive') {
      return Math.random() > 0.4 ? 'negative' : baseSentiment;
    }

    return baseSentiment;
  }

  // 兜底消息
  _fallbackMessage(agent, topic, roundNum) {
    const fallbacks = [
      { text: `关于这件事，我觉得还是要看后续发展`, sentiment: 'neutral', reactions: ['观望'] },
      { text: `说实话我不太了解具体情况，先看看大家怎么说`, sentiment: 'neutral', reactions: ['同'] },
      { text: `这件事有点复杂，不好简单下结论`, sentiment: 'neutral', reactions: ['理性'] },
    ];
    const f = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    return {
      agentId: agent.id,
      agentName: agent.name,
      emoji: agent.emoji,
      text: f.text,
      sentiment: f.sentiment,
      faction: agent.faction,
      reactions: f.reactions,
      round: roundNum
    };
  }

  // 计算危机指数
  calculateCrisisScore() {
    const total = this.sentimentStats.negative + this.sentimentStats.neutral + this.sentimentStats.positive;
    if (total === 0) return 0;
    const negRatio = this.sentimentStats.negative / total;
    const neuRatio = this.sentimentStats.neutral / total;
    // 负面占比主导，中性也略有影响
    return Math.min(100, Math.round(negRatio * 110 + neuRatio * 15 + 5));
  }

  // 生成推演报告（纯规则）
  generateReport(topic, eventType) {
    const total = this.allMessages.length;
    const negPct = total > 0 ? Math.round(this.sentimentStats.negative / total * 100) : 0;
    const posPct = total > 0 ? Math.round(this.sentimentStats.positive / total * 100) : 0;
    const neuPct = 100 - negPct - posPct;

    // 计算主要阵营
    const sortedFactions = Object.entries(this.factionStats)
      .sort((a, b) => b[1] - a[1]);
    const topFaction = sortedFactions[0] ? sortedFactions[0][0] : '未知';
    const topFactionPct = sortedFactions[0] ? Math.round(sortedFactions[0][1] / total * 100) : 0;

    // 危机等级
    const crisis = this.crisisScore;
    let crisisLevel, crisisIcon, heatLevel, duration;
    if (crisis >= 80) { crisisLevel = '5级 · 严重危机'; crisisIcon = '🔴'; heatLevel = '极高'; duration = '7-14天'; }
    else if (crisis >= 60) { crisisLevel = '4级 · 高度警惕'; crisisIcon = '🟠'; heatLevel = '高'; duration = '5-7天'; }
    else if (crisis >= 40) { crisisLevel = '3级 · 中等风险'; crisisIcon = '🟡'; heatLevel = '中'; duration = '3-5天'; }
    else if (crisis >= 20) { crisisLevel = '2级 · 低风险'; crisisIcon = '🟢'; heatLevel = '低'; duration = '1-2天'; }
    else { crisisLevel = '1级 · 安全'; crisisIcon = '⚪'; heatLevel = '极低'; duration = '<1天'; }

    // 提取热词
    const wordCount = {};
    this.allMessages.forEach(m => {
      if (!m.text) return;
      const words = m.text.replace(/[，。！？、；：""''（）【】《》\s]+/g, ' ').split(' ');
      const stopWords = new Set(['的','了','是','在','我','你','他','她','它','这','那','就','都','也','不','有','和','对','把','被','让','给','到','从','上','下','中','为','以','而','但','还','会','能','要','可以','没有','什么','怎么','这个','那个','一个','自己','已经','可能','因为','所以','如果','虽然','但是','而且','或者','以及','关于','通过','进行','开始','之后','之前','以后','以前','时候','地方','东西','问题','情况','方面','方式','过程','结果','目前','现在','其实','真的','确实','应该','需要','觉得','知道','看到','说','做','去','来','想','越来越','忍不了','真的假的','越想越']);
      words.forEach(w => {
        w = w.trim();
        if (w.length >= 2 && w.length <= 8 && !stopWords.has(w)) {
          wordCount[w] = (wordCount[w] || 0) + 1;
        }
      });
    });
    const hotWords = Object.entries(wordCount).sort((a,b) => b[1]-a[1]).slice(0, 5).map(w => w[0]);

    // 负面阵营核心诉求
    const negMsgs = this.allMessages.filter(m => m.sentiment === 'negative');
    const negFactions = {};
    negMsgs.forEach(m => { negFactions[m.faction] = (negFactions[m.faction]||0) + 1; });
    const topNegFaction = Object.entries(negFactions).sort((a,b) => b[1]-a[1])[0];

    // 正面阵营
    const posMsgs = this.allMessages.filter(m => m.sentiment === 'positive');
    const posFactions = {};
    posMsgs.forEach(m => { posFactions[m.faction] = (posFactions[m.faction]||0) + 1; });
    const topPosFaction = Object.entries(posFactions).sort((a,b) => b[1]-a[1])[0];

    // 走势分析
    let trendDesc = '';
    if (this.roundHistory.length >= 2) {
      const first = this.roundHistory[0];
      const last = this.roundHistory[this.roundHistory.length - 1];
      if (last.negPct > first.negPct + 10) trendDesc = '负面情绪持续上升，舆情有恶化趋势';
      else if (last.negPct < first.negPct - 10) trendDesc = '负面情绪有所回落，舆情趋于平稳';
      else trendDesc = '情绪波动不大，舆情相对稳定';
    }

    const eventTypeMap = {
      commercial: '商业化动作', update: '版本更新', anticheat: '安全治理',
      collab: 'IP联动/跨界合作', esports: '电竞赛事', incident: '突发事件', custom: '自定义事件'
    };

    // 生成防御建议
    let defenseP0 = '', defenseP1 = '', defenseP2 = '';
    if (eventType === 'commercial') {
      defenseP0 = '准备定价说明FAQ，强调性价比和品质提升';
      defenseP1 = '安排KOL提前体验并产出正向内容';
      defenseP2 = '考虑推出限时优惠或白嫖福利缓解情绪';
    } else if (eventType === 'anticheat') {
      defenseP0 = '公布具体的反外挂数据（封号数、检测率提升）';
      defenseP1 = '邀请玩家参与反外挂体验官计划';
      defenseP2 = '制作反外挂纪录片展示技术投入';
    } else if (eventType === 'incident') {
      defenseP0 = '24小时内发布官方声明，态度诚恳';
      defenseP1 = '公布具体处理方案和时间表';
      defenseP2 = '安排高管出面回应，展示重视程度';
    } else if (eventType === 'collab') {
      defenseP0 = '确保联名内容有诚意，不只是贴logo';
      defenseP1 = '准备免费福利活动覆盖非付费玩家';
      defenseP2 = '安排线下快闪店增加社交传播';
    } else if (eventType === 'update') {
      defenseP0 = '准备详细的更新说明和改动原因';
      defenseP1 = '安排体验服提前收集反馈';
      defenseP2 = '准备回滚方案以防重大bug';
    } else {
      defenseP0 = '密切监控舆情走向，准备应急预案';
      defenseP1 = '安排社区运营积极互动';
      defenseP2 = '准备正向内容投放缓冲负面情绪';
    }

    return `# 🔮 MirrorFace 舆情推演报告

## 📋 推演概况
- **事件**：${topic}
- **类型**：${eventTypeMap[eventType] || eventType}
- **模拟发言**：${total} 条（${this.roundHistory.length} 轮）
- **参与Agent类型**：${new Set(this.allMessages.map(m => m.agentId)).size} 种

## 📊 总体评估
- **危机等级**：${crisisIcon} ${crisisLevel}（指数 ${crisis}/100）
- **预估热度峰值**：${heatLevel}
- **舆情持续时间预估**：${duration}
- **核心情绪**：负面 ${negPct}% / 中性 ${neuPct}% / 正向 ${posPct}%
- **走势**：${trendDesc}

## ⚠️ 核心风险点
1. **主要反对阵营**：${topNegFaction ? topNegFaction[0] + '（占负面声量' + Math.round(topNegFaction[1]/Math.max(1,negMsgs.length)*100) + '%）' : '无明显反对'}
2. **热词聚焦**：${hotWords.join('、') || '无明显热词'}
3. **情绪传播**：${negPct > 50 ? '负面情绪占主导，有传播扩大风险' : '情绪分布相对均衡'}

## 🛡️ 防御建议
1. **[P0 必做]** ${defenseP0}
2. **[P1 建议]** ${defenseP1}
3. **[P2 可选]** ${defenseP2}

## 📌 关键观点摘要
- **负面阵营**：${topNegFaction ? topNegFaction[0] : '无'} — ${negMsgs.length > 0 ? negMsgs[0].text.substring(0, 40) + '…' : '无明显负面'}
- **正面阵营**：${topPosFaction ? topPosFaction[0] : '无'} — ${posMsgs.length > 0 ? posMsgs[0].text.substring(0, 40) + '…' : '无明显正面'}
- **沉默大多数**：占比约 ${this.factionStats['沉默大多数'] ? Math.round(this.factionStats['沉默大多数']/total*100) : 0}%，态度观望

## 🔮 48小时走势预判
${crisis >= 60
  ? '预计未来48小时舆情将持续发酵，建议在12小时内发布官方回应。如不及时处理，负面情绪可能外溢至微博/抖音等公域平台，引发更大范围讨论。'
  : crisis >= 40
    ? '预计舆情将在24小时内达到峰值后缓慢回落。建议密切关注KOL动态，必要时安排正向内容投放。'
    : '预计舆情影响有限，48小时内将自然消退。建议保持常规社区运营即可。'
}

---
*报告由 MirrorFace 推演引擎自动生成 · ${new Date().toLocaleString('zh-CN')}*
*基于 ${AGENT_TYPES.reduce((s,a) => s+a.count, 0)} 个虚拟玩家Agent · ${FACTIONS.length} 大阵营冲突模型*`;
  }

  // 记录轮次快照
  recordRoundSnapshot(roundNum) {
    const total = this.sentimentStats.negative + this.sentimentStats.neutral + this.sentimentStats.positive;
    this.roundHistory.push({
      round: roundNum,
      negPct: total > 0 ? Math.round(this.sentimentStats.negative / total * 100) : 0,
      neuPct: total > 0 ? Math.round(this.sentimentStats.neutral / total * 100) : 0,
      posPct: total > 0 ? Math.round(this.sentimentStats.positive / total * 100) : 0,
      crisis: this.crisisScore,
      total: total
    });
  }
}

// 全局引擎实例
const engine = new SimulationEngine();
