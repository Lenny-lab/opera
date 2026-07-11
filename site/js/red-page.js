(function () {
  'use strict';

  const input = document.getElementById('redInput');
  const btn = document.getElementById('redGenBtn');
  const result = document.getElementById('redResult');
  if (!input || !btn || !result) return;

  const FALLBACKS = [
    kw => ({
      title: kw + '·初心', genre: '红色现代戏', role: '青年、老支书', scene: '村口老槐树下',
      lines: [
        { who: '青年', type: '白', text: `我从旧照片里读到${kw}，却还不明白它为何被一代代人记住。` },
        { who: '老支书', type: '唱', text: '一盏微灯照长夜，千家灯火自肩扛。' },
        { who: '青年', type: '唱', text: '前人的路不只在书页，今日的担当就在身旁。' }
      ],
      stageNote: '一桌一灯，老支书递出旧照片；尾声由群众轻声合唱。'
    }),
    kw => ({
      title: kw + '·回声', genre: '红色现代戏', role: '讲述人、青年', scene: '社区展览角',
      lines: [
        { who: '讲述人', type: '白', text: `这一件旧物，见证了${kw}故事中普通人的选择。` },
        { who: '青年', type: '唱', text: '不问姓名留何处，只将热望付山河。' },
        { who: '讲述人', type: '白', text: '历史并不遥远，它在今天每一次互助与坚守中回响。' }
      ],
      stageNote: '演员以圆场连接过去与当下，背景只保留旧物投影，避免口号化布景。'
    })
  ];

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  async function requestScript(prompt) {
    const res = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ prompt, mode: 'red' })
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || '在线共创暂不可用');
    }
    return res.json();
  }

  function render(data, source) {
    const linesHtml = (data.lines || []).map((line, index) =>
      '<div class="script-line script-line-' + escapeHtml(line.type || '唱') + '" data-line="' + (index + 1) + '">' +
        '<div class="script-header"><span class="script-who">' + escapeHtml(line.who) + '</span>' +
        '<span class="script-type script-type-' + escapeHtml(line.type || '唱') + '">' + escapeHtml(line.type || '唱') + '</span></div>' +
        '<p class="script-text">' + escapeHtml(line.text) + '</p></div>'
    ).join('');
    result.innerHTML =
      '<div class="script-title"><span class="script-title-main">《' + escapeHtml(data.title || '红色小戏') + '》</span>' +
      '<span class="script-title-meta"><span class="script-pill script-pill-pink">人物 · ' + escapeHtml(data.role || '生、旦') + '</span>' +
      '<span class="script-pill script-pill-gold">场景 · ' + escapeHtml(data.scene || '社区戏台') + '</span></span></div>' +
      '<div class="script-lines">' + linesHtml + '</div>' +
      (data.stageNote ? '<div class="script-stage"><span class="script-stage-label">舞台</span>' + escapeHtml(data.stageNote) + '</div>' : '') +
      '<div class="script-source">' + (source === 'online' ? '在线共创内容 · 建议由戏曲教师复核后排演' : '本地主题内容 · 可继续修改后排演') + '</div>';
  }

  async function generate() {
    const keyword = input.value.trim();
    if (!keyword) {
      input.placeholder = '请输入关键词，例如：焦裕禄';
      input.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = '创作中…';
    result.innerHTML = '<div class="script-source">正在梳理人物、场景与唱白…</div>';
    result.classList.add('active');
    try {
      render(await requestScript(keyword), 'online');
    } catch (error) {
      console.info('在线共创不可用，使用本地主题内容。', error.message);
      const index = Array.from(keyword).reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACKS.length;
      render(FALLBACKS[index](keyword), 'local');
    } finally {
      btn.disabled = false;
      btn.textContent = '创作一段';
    }
  }

  btn.addEventListener('click', generate);
  input.addEventListener('keydown', event => { if (event.key === 'Enter') generate(); });
})();
