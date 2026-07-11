/* 戏曲共创工坊：服务端生成 + 本地内容兜底 */

(function () {
  'use strict';

  // ==================== 本地样本库（仅作 fallback）====================
  const SAMPLES = [
    { id: 'jingju-guifei', genre: '京剧', title: '贵妃醉酒', role: '旦 · 梅派', audio: '../assets/audio/sample-jingju.mp3', desc: '梅兰芳大师代表作，京剧旦角经典。', tags: ['梅兰芳', '经典', '旦角'], scene: '宫廷月夜', keywords: ['京剧', '贵妃', '醉酒', '梅兰芳', '旦', '海岛冰轮'], character: '旦', color: '#c8161d' },
    { id: 'yuju-huamulan', genre: '豫剧', title: '花木兰', role: '旦 · 常派', audio: '../assets/audio/sample-yuju.mp3', desc: '常香玉代表作。', tags: ['常香玉', '花木兰'], scene: '军旅边塞', keywords: ['豫剧', '花木兰', '木兰', '军旅'], character: '旦', color: '#c8161d' },
    { id: 'yueju-hongloumeng', genre: '越剧', title: '红楼梦', role: '旦 · 徐派', audio: '../assets/audio/sample-yueju.mp3', desc: '徐玉兰、王文娟代表作。', tags: ['红楼梦', '林黛玉'], scene: '大观园', keywords: ['越剧', '红楼梦', '林妹妹'], character: '旦', color: '#c8161d' },
    { id: 'red-shajiabang', genre: '红色京剧', title: '沙家浜 · 智斗', role: '生 · 现代戏', audio: '../assets/audio/sample-red-jingju.mp3', desc: '革命现代戏经典。', tags: ['革命', '红色'], scene: '春来茶馆', keywords: ['红色', '沙家浜', '智斗', '革命'], character: '生', color: '#8b0000' },
    { id: 'red-chaoyanggou', genre: '红色豫剧', title: '朝阳沟', role: '旦 · 现代戏', audio: '../assets/audio/sample-red-yuju.mp3', desc: '现代豫剧经典。', tags: ['现代戏'], scene: '朝阳沟', keywords: ['红色', '朝阳沟', '下乡', '知青'], character: '旦', color: '#8b0000' }
  ];

  // ==================== 状态徽章 ====================
  async function updateStatusBadge() {
    const badge = document.getElementById('statusBadge');
    if (!badge) return;
    try {
      const res = await fetch('/api/health', { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data.generation) {
        badge.innerHTML = '<span class="status-dot status-dot-on"></span>在线共创服务已就绪';
        badge.className = 'status-badge status-on';
        return;
      }
    } catch (_) {}
    badge.innerHTML = '<span class="status-dot"></span>本地体验模式 · 无需联网';
    badge.className = 'status-badge status-off';
  }

  // ==================== 服务端生成 ====================
  async function callLLM(prompt) {
    const res = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ prompt, mode: 'opera' })
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || '在线共创暂不可用');
    }
    return res.json();
  }

  // ==================== Fallback ====================
  function matchSample(text) {
    if (!text) return SAMPLES[0];
    const t = text.toLowerCase();
    let best = SAMPLES[0], score = -1;
    for (const s of SAMPLES) {
      let n = 0;
      for (const k of s.keywords) if (t.includes(k.toLowerCase())) n += k.length;
      if (/红色|革命|抗战|下乡|建设/.test(t) && s.genre.includes('红色')) n += 8;
      if (n > score) { score = n; best = s; }
    }
    return best;
  }

  function buildDemoScript(prompt, sample) {
    return {
      mode: 'fallback',
      genre: sample.genre,
      title: sample.title,
      role: sample.role,
      scene: sample.scene,
      lines: [
        { who: sample.role, type: '白', text: `（${sample.scene} · 灯渐明）依您所提「${prompt}」之意，我为您编了一段小戏。` },
        { who: sample.role, type: '唱', text: sample.tags[0] ? `承${sample.tags[0]}遗韵，借${sample.title}一阕，且听我道来。` : '且听我道来。' },
        { who: sample.role, type: '白', text: sample.desc }
      ],
      audio: sample.audio,
      tags: sample.tags
    };
  }

  // ==================== DOM 引用 ====================
  const $ = id => document.getElementById(id);
  const aiInput = $('aiInput');
  const aiSendBtn = $('aiSendBtn');
  const resultEmpty = $('resultEmpty');
  const resultActive = $('resultActive');
  const resultGenre = $('resultGenre');
  const resultTitle = $('resultTitle');
  const resultDesc = $('resultDesc');
  const resultTags = $('resultTags');
  const visualCharacter = $('visualCharacter');
  const playBtn = $('playBtn');
  const playIcon = $('playIcon');
  const pauseIcon = $('pauseIcon');
  const playerTitle = $('playerTitle');
  const playerFill = $('playerFill');
  const curTime = $('curTime');
  const durTime = $('durTime');
  const aiAudio = $('aiAudio');
  const creationText = $('creationText');
  const aiStatus = $('aiStatus');

  let currentScript = null;
  let currentAudioMode = 'tts';

  function fmt(s) { if (isNaN(s)) return '0:00'; const m = Math.floor(s / 60), sec = Math.floor(s % 60); return m + ':' + String(sec).padStart(2, '0'); }
  function resetPlayerUI() { playIcon.hidden = false; pauseIcon.hidden = true; playerFill.style.width = '0%'; curTime.textContent = '0:00'; durTime.textContent = '0:00'; }
  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function renderResult(script, sourceText) {
    resultEmpty.hidden = true;
    resultActive.hidden = false;

    // 顶部 meta
    resultGenre.textContent = script.genre;
    resultGenre.style.background = '#c8161d';
    resultTitle.textContent = '《' + script.title + '》';
    resultDesc.textContent = script.scene + (script.stageNote ? ' · ' + script.stageNote : '');
    const tagTexts = script.mode === 'online'
      ? ['在线共创', script.role || '戏曲人物', '内容可编辑']
      : ['本地样本', 'fallback'];
    resultTags.innerHTML = tagTexts.map(t => '<span>' + t + '</span>').join('');
    visualCharacter.textContent = script.mode === 'online' ? '戏' : '赏';
    visualCharacter.style.color = '#c8161d';

    if (script.mode === 'online') {
      playerTitle.textContent = script.genre + ' · 《' + script.title + '》 · 语音讲演';
      currentAudioMode = 'tts';
    } else {
      playerTitle.textContent = script.genre + ' · ' + script.title + ' · 本地样本';
      currentAudioMode = 'sample';
      aiAudio.src = script.audio;
      aiAudio.load();
    }
    resetPlayerUI();

    // 创作草稿
    if (creationText) {
      let html = '';
      if (script.lines?.length) {
        html += '<div class="script-title">' +
          '<span class="script-title-main">《' + escapeHtml(script.title) + '》</span>' +
          '<span class="script-title-meta">' +
            '<span class="script-pill script-pill-pink">' + escapeHtml(script.genre) + '</span>' +
            (script.scene ? '<span class="script-pill">场景 · ' + escapeHtml(script.scene) + '</span>' : '') +
            (script.mode === 'online' ? '<span class="script-pill script-pill-gold">在线共创 · 内容可修改</span>' : '') +
          '</span>' +
        '</div>';
        html += '<div class="script-lines">';
        script.lines.forEach((ln, i) => {
          html += '<div class="script-line script-line-' + escapeHtml(ln.type || '唱') + '" data-line="' + (i + 1) + '">' +
            '<div class="script-header">' +
              '<span class="script-who">' + escapeHtml(ln.who) + '</span>' +
              '<span class="script-type script-type-' + escapeHtml(ln.type || '唱') + '">' + escapeHtml(ln.type || '唱') + '</span>' +
            '</div>' +
            '<p class="script-text">' + escapeHtml(ln.text) + '</p>' +
          '</div>';
        });
        html += '</div>';
        if (script.stageNote) {
          html += '<div class="script-stage"><span class="script-stage-label">舞台</span>' + escapeHtml(script.stageNote) + '</div>';
        }
        html += '<div class="script-source">在线共创内容 · 建议由戏曲教师复核后排演</div>';
      } else {
        html += '<div class="script-stage"><span class="script-stage-label">提示</span>暂无剧本行</div>';
      }
      html += '<div class="creation-actions">';
      html += '<button class="btn btn-primary btn-sm" id="speakBtn">🔊 听念白</button>';
      html += '<button class="btn btn-ghost btn-sm" id="saveBtn">💾 保存作品</button>';
      html += '<button class="btn btn-ghost btn-sm" id="copyBtn">📋 复制脚本</button>';
      html += '<button class="btn btn-ghost btn-sm" id="regenBtn">🔄 换个版本</button>';
      html += '</div>';
      creationText.innerHTML = html;

      const speakBtn = $('speakBtn');
      const saveBtn = $('saveBtn');
      const copyBtn = $('copyBtn');
      const regenBtn = $('regenBtn');
      if (speakBtn) speakBtn.onclick = () => speakScript(script);
      if (saveBtn) saveBtn.onclick = () => saveCreation(script, sourceText);
      if (copyBtn) copyBtn.onclick = () => copyScript(script);
      if (regenBtn) regenBtn.onclick = () => send(true);
    }
    currentScript = script;
  }

  // ==================== 浏览器 TTS ====================
  function speakScript(script) {
    if (!('speechSynthesis' in window)) { alert('当前浏览器不支持 Web Speech API'); return; }
    window.speechSynthesis.cancel();
    const lines = (script.lines || []).filter(l => true);
    if (!lines.length) return;
    const text = lines.map(l => l.who + '：' + l.text).join('。 ');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  const SAVED_CREATIONS_KEY = 'xiqu.creations';
  function saveCreation(script, sourceText) {
    const list = JSON.parse(localStorage.getItem(SAVED_CREATIONS_KEY) || '[]');
    list.unshift({ id: Date.now(), prompt: sourceText, script: script, createdAt: new Date().toISOString() });
    localStorage.setItem(SAVED_CREATIONS_KEY, JSON.stringify(list.slice(0, 50)));
    alert('已保存！共 ' + list.length + ' 个作品（保留最近 50 个）');
  }
  function copyScript(script) {
    const text = '【' + script.genre + '】《' + script.title + '》\n场景：' + script.scene + '\n\n' +
      (script.lines || []).map(l => l.who + '（' + l.type + '）：' + l.text).join('\n') +
      (script.stageNote ? '\n\n【舞台】' + script.stageNote : '');
    navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'), () => alert('复制失败'));
  }

  // ==================== 发送 ====================
  async function send(regen = false) {
    const text = aiInput.value.trim();
    if (!text) { aiInput.focus(); return; }
    if (!regen) {
      aiSendBtn.disabled = true;
      aiSendBtn.innerHTML = '<span>生成中…</span>';
    }
    try {
      aiStatus && (aiStatus.textContent = '正在整理人物、唱白与舞台提示…');
      let script;
      try {
        script = await callLLM(text);
        aiStatus && (aiStatus.textContent = '创作完成，你可以朗读、保存或换一个版本。');
      } catch (e) {
        console.info('在线共创不可用，使用本地体验内容。', e.message);
        aiStatus && (aiStatus.textContent = '当前使用本地体验内容；配置在线服务后可生成更多版本。');
        script = buildDemoScript(text, matchSample(text));
        script.mode = 'fallback';
      }
      renderResult(script, text);
      if (currentAudioMode === 'tts' && script.mode === 'online') {
        setTimeout(() => speakScript(script), 500);
      } else if (currentAudioMode === 'sample') {
        setTimeout(() => aiAudio.play().catch(() => {}), 200);
      }
    } finally {
      aiSendBtn.disabled = false;
      aiSendBtn.innerHTML = '<span>生成小戏</span><span class="btn-arrow">→</span>';
    }
  }

  if (aiSendBtn) aiSendBtn.addEventListener('click', () => send());
  if (aiInput) aiInput.addEventListener('keypress', e => { if (e.key === 'Enter') send(); });

  document.querySelectorAll('.tag').forEach(t => t.addEventListener('click', () => { aiInput.value = t.dataset.q; send(); }));
  document.querySelectorAll('.sample-card').forEach(c => c.addEventListener('click', () => {
    aiInput.value = c.dataset.q;
    const sample = SAMPLES.find(x => x.audio?.endsWith(c.dataset.audio)) || matchSample(c.dataset.q);
    const script = buildDemoScript(c.dataset.q, sample);
    renderResult(script, c.dataset.q);
    setTimeout(() => aiAudio.play().catch(() => {}), 200);
  }));

  if (playBtn) playBtn.addEventListener('click', () => {
    if (currentAudioMode === 'tts' && currentScript) { speakScript(currentScript); return; }
    if (aiAudio.paused) aiAudio.play(); else aiAudio.pause();
  });
  if (aiAudio) {
    aiAudio.addEventListener('play', () => { playIcon.hidden = true; pauseIcon.hidden = false; });
    aiAudio.addEventListener('pause', () => { playIcon.hidden = false; pauseIcon.hidden = true; });
    aiAudio.addEventListener('timeupdate', () => {
      playerFill.style.width = ((aiAudio.currentTime / aiAudio.duration) * 100 || 0) + '%';
      curTime.textContent = fmt(aiAudio.currentTime);
    });
    aiAudio.addEventListener('loadedmetadata', () => durTime.textContent = fmt(aiAudio.duration));
  }

  updateStatusBadge();
})();
