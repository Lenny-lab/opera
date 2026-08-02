const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'site');
const port = Number(process.env.PORT || 8765);
const apiKey = process.env.DEEPSEEK_API_KEY || '';
const apiBase = (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
const apiModel = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
const maxBodyBytes = 32 * 1024;
const requestLog = new Map();

const types = {
  '.html': 'text/html;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.js': 'text/javascript;charset=utf-8',
  '.json': 'application/json;charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self'; " +
    "connect-src 'self'; script-src 'self'; " +
    "frame-src https://player.bilibili.com https://www.bilibili.com https://tv.cctv.com https://haokan.baidu.com https://www.toutiao.com; " +
    "object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
  );
}

function sendJson(res, status, payload) {
  setSecurityHeaders(res);
  res.writeHead(status, { 'Content-Type': types['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error('REQUEST_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });
    req.on('error', reject);
  });
}

function isRateLimited(req) {
  const key = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter(t => now - t < 60_000);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > 12;
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

function cleanText(value, max = 200) {
  return String(value || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
}

function normalizeScript(data, mode) {
  const allowedTypes = new Set(['唱', '白', '念白', '唱词']);
  const lines = Array.isArray(data.lines) ? data.lines.slice(0, 6).map(line => ({
    who: cleanText(line.who, 24) || '人物',
    type: allowedTypes.has(line.type) ? line.type : '白',
    text: cleanText(line.text, 180)
  })).filter(line => line.text) : [];
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

async function generateScript(prompt, mode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    const upstream = await fetch(apiBase + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
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
    if (!upstream.ok) throw new Error('UPSTREAM_' + upstream.status);
    const payload = await upstream.json();
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error('EMPTY_MODEL_OUTPUT');
    const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, ''));
    return normalizeScript(parsed, mode);
  } finally {
    clearTimeout(timer);
  }
}

async function handleApi(req, res, urlPath) {
  if (urlPath === '/api/health' && req.method === 'GET') {
    sendJson(res, 200, { ok: true, generation: Boolean(apiKey) });
    return true;
  }
  if (urlPath !== '/api/generate-script' || req.method !== 'POST') return false;
  if (isRateLimited(req)) {
    sendJson(res, 429, { error: '请求稍多，请稍后再试。' });
    return true;
  }
  if (!apiKey) {
    sendJson(res, 503, { error: '在线共创服务尚未配置。', code: 'GENERATION_NOT_CONFIGURED' });
    return true;
  }
  try {
    const body = await readJson(req);
    const prompt = cleanText(body.prompt, 200);
    const mode = body.mode === 'red' ? 'red' : 'opera';
    if (prompt.length < 2) {
      sendJson(res, 400, { error: '请再多写一点你的想法。' });
      return true;
    }
    const script = await generateScript(prompt, mode);
    sendJson(res, 200, script);
  } catch (error) {
    const message = error.name === 'AbortError' ? '生成等待时间过长，请重试。' : '本次生成没有成功，请稍后再试。';
    console.error('[generate-script]', error.message);
    sendJson(res, error.message === 'REQUEST_TOO_LARGE' ? 413 : 502, { error: message });
  }
  return true;
}

const server = http.createServer(async (req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    return sendJson(res, 400, { error: '无效地址。' });
  }

  if (urlPath.startsWith('/api/')) {
    const handled = await handleApi(req, res, urlPath);
    if (!handled) sendJson(res, 404, { error: '接口不存在。' });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: '不支持的请求方式。' });
  }
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.resolve(root, '.' + urlPath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    setSecurityHeaders(res);
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      setSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/plain;charset=utf-8' });
      res.end('页面不存在');
      return;
    }
    setSecurityHeaders(res);
    res.writeHead(200, {
      'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': /\.(webp|png|jpg|jpeg|mp3)$/.test(filePath) ? 'public, max-age=604800' : 'no-cache'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`戏曲平台已启动：http://127.0.0.1:${port}/`);
  console.log(apiKey ? '在线共创服务：已配置' : '在线共创服务：未配置，将使用本地体验内容');
});
