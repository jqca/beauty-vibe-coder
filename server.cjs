const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const SYSTEM_PROMPT = `完全なHTML1ファイルを生成。コードは極限まで短く、全体で200行以内厳守。CSSはstyle属性でインライン化、class定義しない。<meta charset="UTF-8">必須。CDN可。外部API禁止。日本語UI。絵文字・特殊Unicode記号は一切使わない。ボタン名やラベルは漢字・ひらがな・カタカナ・英数字・基本記号のみ。
地図:Leaflet(unpkg.com/leaflet@1.9.4)。タイルURLは必ず https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png を使え。openstreetmap.orgドメインは絶対使うな(403エラーになる)。
最適化:QUBO行列をfor文構築(Q[i][j])→SA(T=100→0.01,冷却0.995)。コメント「//QUBO」「//SA」明記。
図面アプリ:divに「サンプル図面」ボタン→onclick:innerHTMLにSVG(フランジφ80/φ30/t15/4xM6/A5052/±0.02/Ra1.6/DWG-2026-042)。入力欄は初期空欄→読込後1秒アニメ→自動セット。「図面解析開始」押下後のみ結果表示(初期display:none)。
検査アプリの実装手順:
1.画像エリア<div id="imgArea"></div>+入力欄(製品ID/ロット番号/製造工程/材質、全て初期空欄)+「サンプル画像読込」ボタン+「検査開始」ボタン(初期disabled)+結果div(初期display:none)
2.「サンプル画像読込」onclick: imgArea.innerHTML='<svg width="300" height="200">...</svg>'でcircle製品+赤circle欠陥3個を描画→1秒後に入力欄を自動セット(製品ID:FLG-2026-042,ロット:LOT-20260408-A,工程:旋盤→研磨→アルマイト,材質:A5052)→検査開始ボタンをenabled
3.「検査開始」onclick: 結果divのdisplay='block'。内容:欠陥一覧表(切削キズ/バリ/打痕)+判定NG+原因分析+是正処置+検査統計(検査数/合格率/不良率のバー表示)
工場:鈴木精機(35.578,139.732/大森/旋盤/92),山本製作所(35.562,139.715/蒲田/ワイヤー/88),田中表面処理(35.553,139.738/糀谷/アルマイト/90),佐藤金属(35.549,139.756/羽田/旋盤/85),中村工業(35.571,139.698/矢口/MC/91)。地図tooltip常時表示。
初期値:旋盤→ワイヤー→アルマイト,A5052,±0.02mm,50個,14日。稼働率:旋盤85/フライス78/ワイヤー92/研磨70%。
返答:説明1文→---CODE---→HTML→---ENDCODE---
前回コード改良。褒める口調。`;

function parseResponse(text) {
  if (text.includes('---CODE---')) {
    const parts = text.split('---CODE---');
    const explanation = parts[0].trim();
    const codePart = parts[1] || '';
    let code = codePart.includes('---ENDCODE---')
      ? codePart.split('---ENDCODE---')[0].trim()
      : codePart.trim();
    code = code.replace(/^```\w*\n?/, '').replace(/\n?```$/, '').trim();
    return { explanation, code };
  }
  const lower = text.toLowerCase();
  for (const marker of ['<!doctype html>', '<!doctype html', '<html']) {
    const idx = lower.indexOf(marker);
    if (idx !== -1) {
      return { explanation: text.substring(0, idx).trim(), code: text.substring(idx).trim() };
    }
  }
  return { explanation: text, code: '' };
}

app.post('/api/generate', async (req, res) => {
  req.setTimeout(180000);
  res.setTimeout(180000);
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' });
  }

  const { prompt, history } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  const messages = [];
  if (Array.isArray(history)) {
    for (const h of history.slice(-4)) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: prompt });

  const payload = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    stream: true,
    system: SYSTEM_PROMPT,
    messages,
  });

  try {
    console.log(`[VibeCoder] Calling streaming API (${messages.length} msgs)...`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: payload,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      console.log(`[VibeCoder] API error ${apiRes.status}: ${errBody.substring(0, 200)}`);
      return res.status(502).json({ error: `API error ${apiRes.status}` });
    }

    // ストリーミングレスポンスを読み取り、全テキストを蓄積
    let fullText = '';
    const reader = apiRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const event = JSON.parse(data);
            if (event.type === 'content_block_delta' && event.delta && event.delta.text) {
              fullText += event.delta.text;
            }
          } catch (e) { /* skip non-JSON lines */ }
        }
      }
    }

    console.log(`[VibeCoder] Stream complete: ${fullText.length} chars`);
    const { explanation, code } = parseResponse(fullText);
    console.log(`[VibeCoder] Code: ${code.length} chars`);
    res.json({ explanation, code });

  } catch (err) {
    console.error('[VibeCoder] Error:', err.message);
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'APIタイムアウト。もう一度試してください' });
    }
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 4173;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[VibeCoder] Server running on port ${PORT}`);
});
server.keepAliveTimeout = 180000;
server.headersTimeout = 185000;
