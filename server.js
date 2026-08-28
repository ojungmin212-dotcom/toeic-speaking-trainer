// 정적 파일 서버 + TTS/LLM API 프록시 (의존성 0, Node 내장 모듈만 사용)
// 실행: node server.js  →  http://localhost:8123
// API 키는 .env에만 저장한다 (.env.example 참고). 키가 없어도 앱은 브라우저 내장 TTS로 전 기능 동작.

const http = require('http');
const fs = require('fs');
const path = require('path');

// ── .env 로드 (간단 파서) ──────────────────────────────────────
const env = { ...process.env };
try {
  const raw = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* .env 없으면 무시 */ }

const PORT = Number(env.PORT) || 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
  });
}

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

// ── TTS 프록시 (OpenAI) ────────────────────────────────────────
async function handleTts(req, res) {
  if ((env.TTS_PROVIDER || '').toLowerCase() !== 'openai' || !env.TTS_API_KEY) {
    return sendJson(res, 501, { error: 'TTS Provider가 설정되지 않았습니다 (.env의 TTS_PROVIDER/TTS_API_KEY).' });
  }
  const { text, lang } = await readBody(req);
  if (!text) return sendJson(res, 400, { error: 'text가 필요합니다.' });
  const voice = env.TTS_VOICE || (lang && lang.startsWith('ko') ? 'nova' : 'alloy');
  const r = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.TTS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.TTS_MODEL || 'gpt-4o-mini-tts',
      voice, input: text, response_format: 'mp3',
      // 시험 안내 스타일: 명확한 발음, 자연스러운 속도, 중립적 억양
      instructions: 'Speak clearly and calmly like a neutral standardized-test announcer. Natural pace, neutral American accent, natural question intonation.',
    }),
  });
  if (!r.ok) {
    const msg = await r.text();
    return sendJson(res, 502, { error: 'TTS API 오류: ' + msg.slice(0, 300) });
  }
  const buf = Buffer.from(await r.arrayBuffer());
  res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': buf.length });
  res.end(buf);
}

// ── LLM 프록시 (anthropic | openai) ────────────────────────────
async function handleLlm(req, res) {
  const provider = (env.LLM_PROVIDER || '').toLowerCase();
  if (!provider || !env.LLM_API_KEY) {
    return sendJson(res, 501, { error: 'LLM Provider가 설정되지 않았습니다 (.env의 LLM_PROVIDER/LLM_API_KEY).' });
  }
  const { prompt } = await readBody(req);
  if (!prompt) return sendJson(res, 400, { error: 'prompt가 필요합니다.' });

  try {
    if (provider === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.LLM_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.LLM_MODEL || 'claude-sonnet-5',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await r.json();
      if (!r.ok) return sendJson(res, 502, { error: 'Anthropic API 오류: ' + JSON.stringify(data).slice(0, 300) });
      return sendJson(res, 200, { text: (data.content || []).map((c) => c.text || '').join('') });
    }
    if (provider === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + env.LLM_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: env.LLM_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await r.json();
      if (!r.ok) return sendJson(res, 502, { error: 'OpenAI API 오류: ' + JSON.stringify(data).slice(0, 300) });
      return sendJson(res, 200, { text: data.choices?.[0]?.message?.content || '' });
    }
    return sendJson(res, 501, { error: '지원하지 않는 LLM_PROVIDER: ' + provider });
  } catch (e) {
    return sendJson(res, 500, { error: 'LLM 호출 실패: ' + e.message });
  }
}

// ── 서버 ───────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        tts: (env.TTS_PROVIDER || '') !== '' && !!env.TTS_API_KEY,
        llm: (env.LLM_PROVIDER || '') !== '' && !!env.LLM_API_KEY,
      });
    }
    if (url.pathname === '/api/tts' && req.method === 'POST') return await handleTts(req, res);
    if (url.pathname === '/api/llm' && req.method === 'POST') return await handleLlm(req, res);

    // 정적 파일
    let filePath = decodeURIComponent(url.pathname);
    if (filePath === '/') filePath = '/index.html';
    const full = path.join(__dirname, path.normalize(filePath));
    if (!full.startsWith(__dirname)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.readFile(full, (err, buf) => {
      if (err) { res.writeHead(404); return res.end('Not Found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
      res.end(buf);
    });
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`TOEIC Speaking Trainer: http://localhost:${PORT}`);
  console.log(`TTS proxy: ${env.TTS_PROVIDER ? env.TTS_PROVIDER : 'not set (browser TTS)'}`);
  console.log(`LLM proxy: ${env.LLM_PROVIDER ? env.LLM_PROVIDER : 'not set (AI generation disabled)'}`);
});
