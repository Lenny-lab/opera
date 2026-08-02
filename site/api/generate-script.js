const MAX_PROMPT_LENGTH = 200;
const MAX_BODY_BYTES = 32 * 1024;

function cleanText(value, max = MAX_PROMPT_LENGTH) {
  return String(value || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .trim()
    .slice(0, max);
}

function promptsFor(mode) {
  if (mode === 'red') {
    return `你是“数智赋能·戏曲润心”项目的红色戏曲内容助理。根据关键词创作一段适合新时代文明实践站微课堂使用的现代戏曲片段。
只输出合法 JSON：
{"genre":"红色现代戏","title":"4至10字","scene":"20字内","role":"主要行当","lines":[{"who":"角色","type":"唱或白","text":"台词"}],"stageNote":"40字内"}
要求：3至5句，唱白交替；内容尊重史实、健康克制，避免口号堆砌；突出人物选择与群众情感；保留一项可执行的戏曲程式或舞台提示。`;
  }
  return `你是“数智赋能·戏曲润心”项目的戏曲内容助理。根据用户想法创作一段一分钟内可朗读、可继续修改的戏曲片段。
只输出合法 JSON：
{"genre":"京剧/豫剧/越剧/黄梅戏/红色现代戏之一","title":"4至10字","scene":"20字内","role":"主要行当","lines":[{"who":"角色","type":"唱或白","text":"台词"}],"stageNote":"40字内"}
要求：3至6句，唱白自然交替；语言符合所选剧种气质，但不冒充经典唱词；题材健康；避免套话和空泛口号；舞台提示具体可执行。`;
}

function normalizeScript(data, mode) {
  const allowedTypes = new Set(['唱', '白', '念白', '唱词']);
  const lines = Array.isArray(data.lines)
    ? data.lines.slice(0, 6).map(line => ({
      who: cleanText(line.who, 24) || '人物',
      type: allowedTypes.has(line.type) ? line.type : '白',
      text: cleanText(line.text, 180)
    })).filter(line => line.text)
    : [];

  if (lines.length < 2) throw new Error('INVALID_MODEL_OUTPUT');

  return {
    mode: 'online',
    genre: cleanText(data.genre, 20) || (mode === 'red' ? '红色现代戏' : '京剧'),
    title: cleanText(data.title, 24) || '即兴小段',
    scene: cleanText(data.scene, 40) || '社区戏台',
    role: cleanText(data.role, 24) || '生、旦',
    lines,
    stageNote: cleanText(data.stageNote, 100),
    visual: mode === 'red' ? '红' : '戏',
    color: mode === 'red' ? '#8b0000' : '#c8161d'
  };
}

function bodySize(req) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared) return declared;
  try {
    return Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  } catch {
    return MAX_BODY_BYTES + 1;
  }
}

async function generateScript(prompt, mode) {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  const apiBase = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  const apiModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  try {
    const upstream = await fetch(apiBase + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: 'system', content: promptsFor(mode) },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' },
        temperature: 0.75,
        max_tokens: 900,
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('[deepseek]', upstream.status, detail.slice(0, 300));
      throw new Error('UPSTREAM_' + upstream.status);
    }

    const payload = await upstream.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('EMPTY_MODEL_OUTPUT');
    const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, ''));
    return normalizeScript(parsed, mode);
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: '不支持的请求方式。' });
  }
  if (bodySize(req) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: '提交内容过长。' });
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return res.status(503).json({
      error: '在线共创服务尚未配置。',
      code: 'GENERATION_NOT_CONFIGURED'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: '提交内容不是有效的 JSON。' });
  }
  const prompt = cleanText(body.prompt);
  const mode = body.mode === 'red' ? 'red' : 'opera';
  if (prompt.length < 2) {
    return res.status(400).json({ error: '请再多写一点你的想法。' });
  }

  try {
    const script = await generateScript(prompt, mode);
    return res.status(200).json(script);
  } catch (error) {
    console.error('[generate-script]', error.message);
    const message = error.name === 'AbortError'
      ? '生成等待时间过长，请重试。'
      : '本次生成没有成功，请稍后再试。';
    return res.status(502).json({ error: message });
  }
};
