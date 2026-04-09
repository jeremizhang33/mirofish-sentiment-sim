// ═══════════════════════════════════════════════
// MirrorFace · 主应用逻辑 (UI + 交互)
// ═══════════════════════════════════════════════

// ── 预设场景 ──
const PRESETS = [
  { icon: '💰', name: '传世武器返场', type: 'commercial', topic: '和平精英宣布传世武器「弗拉迪尾刺」限时返场，原价2888点券，返场价格不变但新增交易锁定期30天' },
  { icon: '🔄', name: 'SS39赛季更新', type: 'update', topic: '和平精英SS39赛季大版本更新：新增海岛3.0地图重制、载具物理引擎升级、枪械后坐力全面调整' },
  { icon: '🛡️', name: '反外挂大升级', type: 'anticheat', topic: '和平精英公告：投入3亿元升级反外挂系统「天盾3.0」，承诺外挂检出率提升至99.9%，误封率降至0.01%以下' },
  { icon: '🤝', name: '奢侈品联名', type: 'collab', topic: '和平精英 × LV 路易威登联名合作官宣，推出限定皮肤套装售价648元，含LV定制降落伞、背包和枪械皮肤' },
  { icon: '🏆', name: 'PEL选手丑闻', type: 'incident', topic: 'PEL知名战队核心选手被曝在直播中使用外挂辅助工具，视频证据在社交媒体疯传，官方尚未回应' },
  { icon: '⚠️', name: '服务器宕机', type: 'incident', topic: '和平精英服务器在周末黄金时段连续宕机3小时，大量玩家无法登录，排位赛积分异常丢失' },
  { icon: '🎮', name: '地铁逃生删除', type: 'update', topic: '和平精英宣布因版权问题将于下月移除「地铁逃生」模式，该模式将独立为付费游戏' },
  { icon: '📱', name: '强制高配画质', type: 'update', topic: '和平精英新版本强制开启高画质模式，低配手机帧率暴降，大量玩家反映卡顿闪退' },
];

// ── 初始化 ──
function init() {
  renderAgentGrid();
  renderPresets();
}

function renderAgentGrid() {
  const grid = document.getElementById('agentGrid');
  if (!grid) return;
  grid.innerHTML = AGENT_TYPES.map(a => `
    <div class="agent-chip ${a.active ? 'active' : ''}" data-id="${a.id}" onclick="toggleAgent('${a.id}')">
      <span class="emoji">${a.emoji}</span>
      <span class="name">${a.name}</span>
      <span class="count">${a.count}人</span>
    </div>
  `).join('');
}

function renderPresets() {
  const grid = document.getElementById('presetGrid');
  if (!grid) return;
  grid.innerHTML = PRESETS.map((p, i) => `
    <div class="preset-chip" onclick="loadPreset(${i})">
      <span class="preset-icon">${p.icon}</span>
      <span class="preset-name">${p.name}</span>
    </div>
  `).join('');
}

function loadPreset(index) {
  const p = PRESETS[index];
  document.getElementById('topicInput').value = p.topic;
  document.getElementById('eventType').value = p.type;
  showToast('✅ 已加载预设：' + p.name);
}

function toggleAgent(id) {
  const agent = AGENT_TYPES.find(a => a.id === id);
  if (agent) {
    agent.active = !agent.active;
    renderAgentGrid();
  }
}

function toggleConfig(el) {
  const body = el.nextElementSibling;
  const arrow = el.querySelector('.arrow');
  body.classList.toggle('open');
  arrow.textContent = body.classList.contains('open') ? '▼' : '▶';
}

// ── 推演流程 ──
async function startSimulation() {
  const topic = document.getElementById('topicInput').value.trim();
  if (!topic) {
    showToast('⚠️ 请输入推演话题');
    return;
  }

  // 重置引擎
  engine.reset();
  engine.isRunning = true;

  // UI 状态
  document.getElementById('startBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = 'block';
  document.getElementById('progressWrap').style.display = 'block';
  document.getElementById('timelineEmpty').style.display = 'none';
  document.getElementById('timeline').style.display = 'block';
  document.getElementById('timeline').innerHTML = '';
  document.getElementById('reportArea').innerHTML = '<div style="color:var(--text3);font-size:.82rem;text-align:center;padding:20px">推演中，完成后自动生成...</div>';
  resetAnalysisPanel();

  const totalRounds = parseInt(document.getElementById('roundsInput').value);
  const agentsPerRound = parseInt(document.getElementById('agentsPerRound').value);
  const eventType = document.getElementById('eventType').value;

  try {
    for (let round = 1; round <= totalRounds; round++) {
      if (engine.shouldStop) break;

      const pct = ((round - 1) / totalRounds * 85).toFixed(0);
      updateProgress(pct, `第 ${round}/${totalRounds} 轮推演中...`);

      const agents = engine.pickRandomAgents(agentsPerRound);
      addRoundHeader(round, totalRounds);

      // 显示思考动画
      const loadingId = addLoadingIndicator();
      await sleep(300 + Math.random() * 500); // 模拟思考时间

      removeLoadingIndicator(loadingId);

      // 逐条生成并渲染
      for (const agent of agents) {
        if (engine.shouldStop) break;

        const msg = engine.generateMessage(agent, topic, eventType, round, totalRounds, engine.allMessages);
        engine.allMessages.push(msg);

        // 更新统计
        if (msg.sentiment === 'negative') engine.sentimentStats.negative++;
        else if (msg.sentiment === 'positive') engine.sentimentStats.positive++;
        else engine.sentimentStats.neutral++;

        if (msg.faction) {
          engine.factionStats[msg.faction] = (engine.factionStats[msg.faction] || 0) + 1;
        }

        engine.crisisScore = engine.calculateCrisisScore();

        renderMessage(msg);
        updateAnalysisPanel();
        await sleep(80 + Math.random() * 120);
      }

      // 记录轮次快照
      engine.recordRoundSnapshot(round);
      updateTrendChart();
      scrollToBottom();
    }

    if (!engine.shouldStop) {
      updateProgress(90, '生成分析报告...');
      await sleep(500);

      // 生成报告
      const report = engine.generateReport(topic, eventType);
      document.getElementById('reportArea').innerHTML = `<div class="report-box">${formatMarkdown(report)}</div>`;

      updateProgress(100, '✅ 推演完成！');
    }
  } catch (e) {
    console.error('推演错误:', e);
    showToast('❌ 推演出错：' + e.message, 5000);
  } finally {
    engine.isRunning = false;
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('stopBtn').style.display = 'none';
  }
}

function stopSimulation() {
  engine.shouldStop = true;
  updateProgress(0, '已停止');
  document.getElementById('startBtn').style.display = 'block';
  document.getElementById('stopBtn').style.display = 'none';
}

// ── UI 渲染 ──
function addRoundHeader(round, total) {
  const tl = document.getElementById('timeline');
  const phases = ['初始反应', '舆论发酵', '情绪高潮', '平台扩散', '态度固化'];
  tl.insertAdjacentHTML('beforeend', `<div class="round-header">
    <span class="round-num">${round}</span>
    第 ${round} 轮 · ${phases[round - 1] || '推演中'}
    <span style="color:var(--text3);font-size:.72rem;margin-left:auto">${round}/${total}</span>
  </div>`);
}

function addLoadingIndicator() {
  const id = 'loading_' + Date.now();
  const tl = document.getElementById('timeline');
  tl.insertAdjacentHTML('beforeend', `<div id="${id}" class="msg">
    <div class="msg-avatar">🤖</div>
    <div class="msg-body">
      <div class="typing"><span></span><span></span><span></span></div>
      <div style="font-size:.72rem;color:var(--text3)">Agent 正在推演...</div>
    </div>
  </div>`);
  scrollToBottom();
  return id;
}

function removeLoadingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function renderMessage(msg) {
  const tl = document.getElementById('timeline');
  const sentimentClass = msg.sentiment === 'negative' ? 'negative' : msg.sentiment === 'positive' ? 'positive' : 'neutral';
  const sentimentLabel = msg.sentiment === 'negative' ? '😤 负面' : msg.sentiment === 'positive' ? '😊 正向' : '😐 中性';
  const reactions = (msg.reactions || []).map(r => `<span class="msg-reaction">${r}</span>`).join('');

  tl.insertAdjacentHTML('beforeend', `<div class="msg">
    <div class="msg-avatar">${msg.emoji || '👤'}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-name">${msg.agentName || '匿名玩家'}</span>
        <span class="msg-tag ${sentimentClass}">${sentimentLabel}</span>
        <span style="font-size:.68rem;color:var(--text3)">${msg.faction || ''}</span>
      </div>
      <div class="msg-text">${escapeHtml(msg.text || '')}</div>
      ${reactions ? `<div class="msg-reactions">${reactions}</div>` : ''}
    </div>
  </div>`);
}

function resetAnalysisPanel() {
  document.getElementById('crisisScore').textContent = '--';
  document.getElementById('crisisLevel').textContent = '等待推演开始';
  document.getElementById('negPct').textContent = '0';
  document.getElementById('neuPct').textContent = '0';
  document.getElementById('posPct').textContent = '0';
  document.getElementById('sentimentBar').innerHTML = '<div class="neg" style="width:0%"></div><div class="neu" style="width:0%"></div><div class="pos" style="width:0%"></div>';
  document.getElementById('factionList').innerHTML = '<div style="color:var(--text3);font-size:.82rem;text-align:center;padding:20px">等待推演数据</div>';
  document.getElementById('hotWords').innerHTML = '<div style="color:var(--text3);font-size:.82rem;text-align:center;padding:20px">等待推演数据</div>';
  document.getElementById('trendChart').innerHTML = '';
}

function updateAnalysisPanel() {
  const s = engine.sentimentStats;
  const total = s.negative + s.neutral + s.positive;
  if (total === 0) return;

  const negP = Math.round(s.negative / total * 100);
  const neuP = Math.round(s.neutral / total * 100);
  const posP = Math.max(0, 100 - negP - neuP);

  document.getElementById('negPct').textContent = negP;
  document.getElementById('neuPct').textContent = neuP;
  document.getElementById('posPct').textContent = posP;

  document.getElementById('sentimentBar').innerHTML =
    `<div class="neg" style="width:${negP}%"></div><div class="neu" style="width:${neuP}%"></div><div class="pos" style="width:${posP}%"></div>`;

  // 危机指数
  updateCrisisScore(engine.crisisScore);

  // 阵营分布
  renderFactions();

  // 热词
  updateHotWords();
}

function updateCrisisScore(score) {
  const el = document.getElementById('crisisScore');
  const levelEl = document.getElementById('crisisLevel');
  el.textContent = score;

  if (score >= 80) { el.className = 'stat-value danger'; levelEl.textContent = '🔴 5级 · 严重危机'; }
  else if (score >= 60) { el.className = 'stat-value danger'; levelEl.textContent = '🟠 4级 · 高度警惕'; }
  else if (score >= 40) { el.className = 'stat-value warning'; levelEl.textContent = '🟡 3级 · 中等风险'; }
  else if (score >= 20) { el.className = 'stat-value safe'; levelEl.textContent = '🟢 2级 · 低风险'; }
  else { el.className = 'stat-value safe'; levelEl.textContent = '⚪ 1级 · 安全'; }
}

function renderFactions() {
  const list = document.getElementById('factionList');
  const total = Object.values(engine.factionStats).reduce((a, b) => a + b, 0);
  if (total === 0) return;
  const sorted = Object.entries(engine.factionStats).sort((a, b) => b[1] - a[1]);

  list.innerHTML = sorted.map(([name, count]) => {
    const pct = Math.round(count / total * 100);
    const factionDef = FACTIONS.find(f => f.name === name);
    const color = factionDef ? factionDef.color : '#888';
    return `<div class="faction-item">
      <span class="faction-dot" style="background:${color}"></span>
      <span style="width:85px;font-size:.76rem">${name}</span>
      <div class="faction-bar"><div class="faction-fill" style="width:${pct}%;background:${color}"></div></div>
      <span class="faction-pct">${pct}%</span>
    </div>`;
  }).join('');
}

function updateHotWords() {
  const wordCount = {};
  const stopWords = new Set(['的','了','是','在','我','你','他','她','它','这','那','就','都','也','不','有','和','对','把','被','让','给','到','从','上','下','中','为','以','而','但','还','会','能','要','可以','没有','什么','怎么','这个','那个','一个','自己','已经','可能','因为','所以','如果','虽然','但是','而且','或者','以及','关于','通过','进行','开始','之后','之前','以后','以前','时候','地方','东西','问题','情况','方面','方式','过程','结果','目前','现在','其实','真的','确实','应该','需要','觉得','知道','看到','说','做','去','来','想','越来越','忍不了','真的假的','越想越','算了不想','爱咋咋地','说再多也','等官方回应','微博热搜','贴吧炸了','小红书全是','抖音都在','我劝大家','这游戏真的','光子你是','一星差评','必须支持','这波我站','好评如潮','最终还是看']);
  engine.allMessages.forEach(m => {
    if (!m.text) return;
    const words = m.text.replace(/[，。！？、；：""''（）【】《》\s]+/g, ' ').split(' ');
    words.forEach(w => {
      w = w.trim();
      if (w.length >= 2 && w.length <= 8 && !stopWords.has(w)) {
        wordCount[w] = (wordCount[w] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const el = document.getElementById('hotWords');
  if (sorted.length === 0) {
    el.innerHTML = '<div style="color:var(--text3);font-size:.82rem;text-align:center;padding:10px">等待推演数据</div>';
    return;
  }
  const colors = ['var(--red)', 'var(--accent2)', 'var(--yellow)', 'var(--accent)', 'var(--text2)'];
  el.innerHTML = sorted.map(([word, count], i) =>
    `<div style="display:flex;align-items:center;gap:7px;padding:3px 0;font-size:.83rem">
      <span style="color:${colors[i]};font-weight:700;width:18px">${i + 1}</span>
      <span>${word}</span>
      <span style="color:var(--text3);font-size:.72rem;margin-left:auto">${count}次</span>
    </div>`
  ).join('');
}

function updateTrendChart() {
  const el = document.getElementById('trendChart');
  if (!el || engine.roundHistory.length === 0) return;

  const maxH = 45;
  const bars = engine.roundHistory.map(r => {
    const negH = Math.max(2, r.negPct / 100 * maxH);
    const neuH = Math.max(2, r.neuPct / 100 * maxH);
    const posH = Math.max(2, r.posPct / 100 * maxH);
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:1px">
      <div style="display:flex;flex-direction:column;align-items:center;height:${maxH}px;justify-content:flex-end;width:100%">
        <div style="width:80%;height:${negH}px;background:var(--red);border-radius:2px 2px 0 0;opacity:.8"></div>
        <div style="width:80%;height:${neuH}px;background:var(--yellow);opacity:.8"></div>
        <div style="width:80%;height:${posH}px;background:var(--green);border-radius:0 0 2px 2px;opacity:.8"></div>
      </div>
      <span style="font-size:.6rem;color:var(--text3)">R${r.round}</span>
    </div>`;
  }).join('');

  el.innerHTML = `<div style="display:flex;gap:3px;align-items:flex-end;height:${maxH + 18}px">${bars}</div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:4px;font-size:.6rem">
      <span style="color:var(--red)">■ 负面</span>
      <span style="color:var(--yellow)">■ 中性</span>
      <span style="color:var(--green)">■ 正向</span>
    </div>`;
}

// ── 工具函数 ──
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  const panel = document.getElementById('timelinePanel');
  if (panel) panel.scrollTop = panel.scrollHeight;
}

function updateProgress(pct, text) {
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressText').textContent = text;
}

function showToast(msg, duration = 3000) {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:12px 24px;border-radius:8px;font-size:.9rem;z-index:99999;opacity:0;transition:opacity .3s;pointer-events:none;border:1px solid var(--accent)';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, duration);
}

function formatMarkdown(md) {
  return md
    .replace(/^### (.+)$/gm, '<h4 style="color:var(--accent);margin:10px 0 5px;font-size:.87rem">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="color:var(--accent);margin:14px 0 7px;font-size:.95rem">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="color:var(--accent2);margin:14px 0 7px;font-size:1.05rem">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text)">$1</strong>')
    .replace(/^- (.+)$/gm, '<div style="padding-left:10px;margin:2px 0">• $1</div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:10px;margin:2px 0">$1. $2</div>')
    .replace(/\n/g, '<br>');
}

// ── 启动 ──
init();
