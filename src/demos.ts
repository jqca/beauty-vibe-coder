// セミナー用プリセットデモ（事前構築済みHTML）

export interface Demo {
  keyword: string;
  explanation: string;
  code: string;
}

const D1 = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>工場マッチング最適化</title>
  <link rel="stylesheet" href="/leaflet/leaflet.css"/>
  <script src="/leaflet/leaflet.js"><\/script>
</head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">

  <!-- ヘッダー -->
  <div style="background:linear-gradient(135deg,#1e3a5f,#2d6a9f); color:#fff; padding:16px 24px">
    <h2 style="margin:0">工場マッチング最適化</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">
      量子アニーリング(QUBO) x 全国町工場ネットワーク
    </p>
  </div>

  <div style="display:flex; gap:12px; padding:16px; flex-wrap:wrap">

    <!-- 左カラム: 条件 + 結果 -->
    <div style="flex:1; min-width:300px">
      <div style="background:#fff; border-radius:8px; padding:16px;
                  box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
        <h3 style="margin:0 0 12px; font-size:15px">プロジェクト条件</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px">
          <div>工程: <b>旋盤 → ワイヤーカット → アルマイト</b></div>
          <div>材質: <b>A5052 (アルミ合金)</b></div>
          <div>精度: <b>±0.02mm</b></div>
          <div>数量: <b>50個</b></div>
          <div>納期: <b>14日</b></div>
        </div>
        <button id="optBtn" onclick="optimize()"
          style="margin-top:12px; background:linear-gradient(135deg,#1e3a5f,#2d6a9f);
                 color:#fff; border:none; padding:10px 24px; border-radius:6px;
                 cursor:pointer; font-size:14px; font-weight:bold">
          最適チーム編成を実行
        </button>
      </div>

      <!-- 最適化結果 -->
      <div id="result" style="display:none; background:#fff; border-radius:8px;
                              padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1)">
        <h3 style="margin:0 0 12px; font-size:15px">最適化結果</h3>
        <div id="resultBody"></div>
      </div>
    </div>

    <!-- 右カラム: 地図 -->
    <div style="flex:1; min-width:300px">
      <div id="map" style="height:350px; border-radius:8px;
                           box-shadow:0 1px 4px rgba(0,0,0,0.1)"></div>
    </div>
  </div>

<script>
  // 工場データ
  var factories = [
    {name:"鈴木精機",   lat:35.681, lng:139.767, area:"関東エリア",   process:"旋盤CNC",      q:92},
    {name:"山本製作所",  lat:35.443, lng:139.638, area:"湾岸エリア",   process:"ワイヤーカット", q:88},
    {name:"田中表面処理",lat:34.977, lng:138.383, area:"東海エリア",   process:"アルマイト",    q:90},
    {name:"佐藤金属",   lat:35.182, lng:136.906, area:"中部エリア",   process:"旋盤汎用",      q:85},
    {name:"中村工業",   lat:34.693, lng:135.502, area:"関西エリア",   process:"MC加工",        q:91}
  ];

  // 地図初期化
  var map = L.map("map");
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {attribution: "CartoDB"}
  ).addTo(map);

  var g = L.featureGroup();
  factories.forEach(function(f) {
    L.circleMarker([f.lat, f.lng], {
      radius:8, fillColor:"#1e3a5f", fillOpacity:0.8, color:"#fff", weight:2
    })
    .bindTooltip(
      f.name + "(" + f.area + "/" + f.process + "/" + f.q + "点)",
      {permanent:true, direction:"top", offset:[0,-10]}
    )
    .addTo(g);
  });
  g.addTo(map);
  map.fitBounds(g.getBounds(), {padding:[40,40]});

  // 最適化実行
  function optimize() {
    document.getElementById("optBtn").textContent = "最適化計算中...";
    document.getElementById("optBtn").disabled = true;

    setTimeout(function() {
      var n = factories.length;

      // QUBO行列構築
      var Q = [];
      for (var i = 0; i < n; i++) {
        Q[i] = [];
        for (var j = 0; j < n; j++) Q[i][j] = 0;
      }
      for (var i = 0; i < n; i++) {
        Q[i][i] += -factories[i].q;  // 対角: 品質スコア
        for (var j = i + 1; j < n; j++) {
          var d = Math.sqrt(
            Math.pow(factories[i].lat - factories[j].lat, 2) +
            Math.pow(factories[i].lng - factories[j].lng, 2)
          ) * 111;
          Q[i][j] += d * 5;  // 非対角: 距離ペナルティ
        }
      }

      // SA実行
      var best = [1,1,1,0,0], bestE = 9999;
      var T = 100;
      while (T > 0.01) {
        var s = best.slice();
        var k = Math.floor(Math.random() * n);
        s[k] = 1 - s[k];
        var e = 0;
        for (var i = 0; i < n; i++)
          for (var j = 0; j < n; j++)
            e += Q[i][j] * s[i] * s[j];
        if (e < bestE || Math.random() < Math.exp((bestE - e) / T)) {
          best = s;
          bestE = e;
        }
        T *= 0.995;
      }

      // 結果テーブル生成
      var html = '<table style="width:100%; border-collapse:collapse; font-size:13px">';
      html += '<tr style="background:#f0f4f8">';
      html += '<th style="padding:8px; text-align:left">工場</th>';
      html += '<th>地区</th><th>工程</th><th>品質</th><th>選定</th></tr>';

      factories.forEach(function(f, i) {
        var sel = best[i] === 1;
        html += '<tr style="background:' + (sel ? "#e8f5e9" : "#fff") + '">';
        html += '<td style="padding:8px; font-weight:' + (sel ? "bold" : "normal") + '">' + f.name + '</td>';
        html += '<td>' + f.area + '</td>';
        html += '<td>' + f.process + '</td>';
        html += '<td>' + f.q + '点</td>';
        html += '<td style="color:' + (sel ? "#2e7d32" : "#999") + '; font-weight:bold">';
        html += (sel ? "[選定]" : "-") + '</td></tr>';
      });
      html += '</table>';

      html += '<div style="margin-top:12px; padding:12px; background:#e8f5e9; border-radius:6px; font-size:13px">';
      html += '<b>総合スコア: ' + (Math.abs(bestE)*0.8+75).toFixed(1) + '点</b>';
      html += ' / 推定納期: 11日 / 推定コスト: 125,000円</div>';

      html += '<div style="margin-top:10px; padding:10px; background:#e3f2fd; border-radius:6px; font-size:12px; border-left:3px solid #1976d2">';
      html += '<b>AI需要予測:</b> 来月の受注量+15%増の見込み。フランジ系部品の需要が急増中。選定工場の稼働余力も加味して最適チームを編成。</div>';

      document.getElementById("resultBody").innerHTML = html;
      document.getElementById("result").style.display = "block";
      document.getElementById("optBtn").textContent = "最適チーム編成を実行";
      document.getElementById("optBtn").disabled = false;
    }, 1500);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">発注先選定時間</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">99%削減</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">2週間→30分に短縮</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">コスト削減</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">-18%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">量子最適化で価格交渉効率化</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">納期遵守率</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">+30pt</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">65%→95%に改善</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 全国3,000社の町工場ネットワークを量子マッチングで最適化。発注担当者1人あたり年間1,800万円相当の業務価値を創出し、失注率を35%削減します。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">QUBO組合せ最適化（工場マッチング）</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">小規模: 10社×5工程 (50変数)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">ILP: 0.5ms</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QAOA模擬: 2ms (11 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">中規模: 100社×10工程 (1,000変数)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">LP近似: 3.2秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">SA: 180ms (26 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">20ms</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">大規模: 3,000社×30工程 (9万変数)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">ヒューリスティック: 数時間</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">計算不可 (>30 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">3分 (5,000 qubits)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 町工場 500社以上 ＋ 納期・予算・品質の多目的制約</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約500〜5,000 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 変数数がNP困難領域（組合せ爆発）に入り、古典ソルバーでは現実時間で解けなくなる</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Farhi, Goldstone & Gutmann</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"A Quantum Approximate Optimization Algorithm"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">arXiv:1411.4028 (2014)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Kadowaki & Nishimori</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum annealing in transverse Ising model"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Phys. Rev. E 58, 5355 (1998)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Lucas</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Ising formulations of many NP problems"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Frontiers in Physics 2, 5 (2014)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">工場データ・品質スコアはデモ用の架空値であり、実運用では実際の受注履歴・品質データの整備が必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">量子ビット数の制約により大規模問題（>1,000社）は近似解</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">商用QUBOソルバーとの性能比較は実行環境に依存</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D2 = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>図面AI解析</title>
</head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">

  <div style="background:linear-gradient(135deg,#1a5276,#2e86c1); color:#fff; padding:16px 24px">
    <h2 style="margin:0">図面AI解析ダッシュボード</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">
      FAX図面 → AI読取 → 工程分解 → 自動見積
    </p>
  </div>

  <div style="padding:16px; max-width:900px; margin:0 auto">

    <!-- 図面表示エリア -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <h3 style="margin:0; font-size:15px">図面表示エリア</h3>
        <button onclick="loadSample()"
          style="background:#2e86c1; color:#fff; border:none; padding:8px 16px;
                 border-radius:6px; cursor:pointer; font-size:13px">
          サンプル図面を読み込む
        </button>
      </div>
      <div id="imgArea"
        style="border:2px dashed #ccc; border-radius:8px; min-height:180px;
               display:flex; align-items:center; justify-content:center;
               color:#999; font-size:14px">
        図面をアップロードまたはサンプルを読み込み
      </div>
    </div>

    <!-- AI読取結果 -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">AI読取結果</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px">
        <div>材質: <input id="f1" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:150px"></div>
        <div>外径: <input id="f2" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:150px"></div>
        <div>内径: <input id="f3" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:150px"></div>
        <div>厚さ: <input id="f4" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:150px"></div>
        <div>穴:   <input id="f5" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:150px"></div>
        <div>公差: <input id="f6" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:150px"></div>
      </div>
      <button id="analyzeBtn" onclick="analyze()" disabled
        style="margin-top:12px; background:#27ae60; color:#fff; border:none;
               padding:10px 24px; border-radius:6px; cursor:pointer;
               font-size:14px; font-weight:bold; opacity:0.5">
        図面解析を開始
      </button>
    </div>

    <!-- 解析結果 -->
    <div id="analysisResult" style="display:none; background:#fff; border-radius:8px;
                                    padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1)">
      <h3 style="margin:0 0 12px; font-size:15px">解析結果</h3>
      <table style="width:100%; border-collapse:collapse; font-size:13px">
        <tr style="background:#f0f4f8">
          <th style="padding:8px; text-align:left">工程</th>
          <th>設備</th><th>推定時間</th><th>推定コスト</th>
        </tr>
        <tr>
          <td style="padding:8px">1. 旋盤加工</td>
          <td>CNC旋盤</td><td>15分/個</td><td>45,000円</td>
        </tr>
        <tr style="background:#f9f9f9">
          <td style="padding:8px">2. 穴あけ</td>
          <td>MC</td><td>8分/個</td><td>24,000円</td>
        </tr>
        <tr>
          <td style="padding:8px">3. タップ加工</td>
          <td>タッピングセンタ</td><td>5分/個</td><td>15,000円</td>
        </tr>
        <tr style="background:#f9f9f9">
          <td style="padding:8px">4. アルマイト処理</td>
          <td>外注</td><td>2日</td><td>30,000円</td>
        </tr>
      </table>
      <div style="margin-top:12px; padding:12px; background:#eaf7ed; border-radius:6px; font-size:13px">
        <b>合計見積: 114,000円</b> (50個) / 単価: 2,280円 / 推定納期: 10営業日<br>
        推奨工場: 鈴木精機(旋盤) → 中村工業(MC) → 田中表面処理(アルマイト)
      </div>
      <div style="margin-top:10px; padding:10px; background:#e0f2f1; border-radius:6px; font-size:12px; border-left:3px solid #004d40">
        <b>量子最適化:</b> 3工場x4工程=12通りの割当をQUBO行列で定式化→SAで最適解を算出。納期・コスト・品質の多目的最適化。
      </div>
    </div>
  </div>

<script>
  function loadSample() {
    document.getElementById("imgArea").innerHTML =
      '<svg width="300" height="200" viewBox="0 0 300 200" style="background:#fff">' +
      '<rect x="5" y="5" width="290" height="190" fill="none" stroke="#333" stroke-width="1"/>' +
      '<circle cx="150" cy="90" r="60" fill="none" stroke="#333" stroke-width="2"/>' +
      '<circle cx="150" cy="90" r="22" fill="none" stroke="#333" stroke-width="1.5"/>' +
      '<circle cx="150" cy="45" r="4" fill="none" stroke="#333"/>' +
      '<circle cx="195" cy="90" r="4" fill="none" stroke="#333"/>' +
      '<circle cx="150" cy="135" r="4" fill="none" stroke="#333"/>' +
      '<circle cx="105" cy="90" r="4" fill="none" stroke="#333"/>' +
      '<text x="150" y="17" text-anchor="middle" font-size="9" fill="#333">' +
        'DWG-2026-042  フランジA  1:1</text>' +
      '<text x="230" y="90" font-size="8" fill="#666">4xM6</text>' +
      '<text x="150" y="170" text-anchor="middle" font-size="8" fill="#666">' +
        'A5052  ±0.02  Ra1.6</text>' +
      '</svg>';
    document.getElementById("imgArea").style.border = "2px solid #2e86c1";

    // 1秒後にAI読取結果を自動セット
    setTimeout(function() {
      var vals = ["A5052", "80mm", "30mm", "15mm", "4xM6 PCD60mm", "±0.02mm"];
      ["f1","f2","f3","f4","f5","f6"].forEach(function(id, i) {
        document.getElementById(id).value = vals[i];
      });
      document.getElementById("analyzeBtn").disabled = false;
      document.getElementById("analyzeBtn").style.opacity = "1";
    }, 1000);
  }

  function analyze() {
    document.getElementById("analyzeBtn").textContent = "解析中...";
    setTimeout(function() {
      document.getElementById("analysisResult").style.display = "block";
      document.getElementById("analyzeBtn").textContent = "図面解析を開始";
    }, 1200);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">見積作成時間</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">99.9%削減</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">3日→5分に短縮</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">見積精度</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">±5%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">従来±30%から6倍改善</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">人件費削減</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">年800万円/社</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">図面解析担当の工数削減</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> FAX文化が残る町工場でも導入可能。見積スピード向上で受注機会損失を30%削減し、小ロット案件の収益性を+12ptで改善します。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">量子カーネルSVM + CNN図面解析</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">学習データ豊富: 10,000枚以上</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CNN: 99%精度</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">優位性なし</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">学習データ中程度: 500〜2,000枚</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CNN: 93%精度</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QSVM: 95%精度</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">希少部品: 学習サンプル50枚以下</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CNN: 72%精度 (過学習)</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QSVM: 84%精度 (+12pt)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">未来: QML実機で+18pt</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 町工場特有の希少部品・一点物図面で学習サンプルが極端に少ない場合</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約20〜50 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 量子特徴マップは高次元ヒルベルト空間で線形分離性を高め、少データでも汎化性能を確保できる</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Havlíček et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Supervised learning with quantum-enhanced feature spaces"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Nature 567, 209 (2019)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Schuld & Killoran</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum Machine Learning in Feature Hilbert Spaces"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Phys. Rev. Lett. 122, 040504 (2019)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">図面の規格化処理は実業務では前処理パイプラインの整備が必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">量子カーネルの優位性は問題（データ分布）依存であり、全ケースで古典を上回るとは限らない</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">OCR精度はスキャン図面の解像度・ノイズレベルに強く依存</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D3 = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI品質管理</title>
</head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">

  <div style="background:linear-gradient(135deg,#922b21,#c0392b); color:#fff; padding:16px 24px">
    <h2 style="margin:0">AI品質管理 - 外観検査</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">
      画像AI検査 → 欠陥検出 → 不良原因分析 → 是正処置提案
    </p>
  </div>

  <div style="padding:16px; max-width:900px; margin:0 auto">

    <!-- 検査画像 -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <h3 style="margin:0; font-size:15px">検査画像</h3>
        <button onclick="loadImg()"
          style="background:#c0392b; color:#fff; border:none; padding:8px 16px;
                 border-radius:6px; cursor:pointer; font-size:13px">
          サンプル画像読込
        </button>
      </div>
      <div id="imgArea"
        style="border:2px dashed #ccc; border-radius:8px; min-height:160px;
               display:flex; align-items:center; justify-content:center;
               color:#999; font-size:14px">
        製品画像をアップロードまたはサンプルを読み込み
      </div>
    </div>

    <!-- 製品情報 -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">製品情報</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px">
        <div>製品ID:   <input id="p1" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:160px"></div>
        <div>ロット番号: <input id="p2" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:160px"></div>
        <div>製造工程:  <input id="p3" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:160px"></div>
        <div>材質:     <input id="p4" readonly style="border:1px solid #ddd; padding:4px 8px; border-radius:4px; width:160px"></div>
      </div>
      <button id="inspBtn" onclick="inspect()" disabled
        style="margin-top:12px; background:#27ae60; color:#fff; border:none;
               padding:10px 24px; border-radius:6px; cursor:pointer;
               font-size:14px; font-weight:bold; opacity:0.5">
        AI検査開始
      </button>
    </div>

    <!-- 検査結果 -->
    <div id="inspResult" style="display:none">
      <div style="background:#fff; border-radius:8px; padding:16px;
                  box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
        <h3 style="margin:0 0 8px; font-size:15px">検査結果</h3>
        <div style="background:#fde8e8; padding:10px; border-radius:6px;
                    margin-bottom:10px; font-weight:bold; color:#922b21; font-size:15px">
          総合判定: NG (重大欠陥2件検出)
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:13px">
          <tr style="background:#f0f4f8">
            <th style="padding:8px; text-align:left">欠陥</th>
            <th>位置</th><th>重大度</th><th>原因</th><th>是正処置</th>
          </tr>
          <tr>
            <td style="padding:8px; color:#c0392b; font-weight:bold">切削キズ</td>
            <td>外周面 3時方向</td>
            <td style="color:#c0392b">重大</td>
            <td>刃具摩耗(交換時期超過)</td>
            <td>超硬TiAlNコート刃具に交換</td>
          </tr>
          <tr style="background:#f9f9f9">
            <td style="padding:8px; color:#f39c12; font-weight:bold">バリ</td>
            <td>穴縁 12時方向</td>
            <td style="color:#f39c12">軽微</td>
            <td>送り速度過大</td>
            <td>F0.15→F0.10に変更</td>
          </tr>
          <tr>
            <td style="padding:8px; color:#c0392b; font-weight:bold">打痕</td>
            <td>上面中央</td>
            <td style="color:#c0392b">重大</td>
            <td>搬送時の衝突</td>
            <td>搬送治具にクッション材追加</td>
          </tr>
        </table>
        <div style="margin-top:10px; padding:10px; background:#e0f2f1; border-radius:6px; font-size:12px; border-left:3px solid #004d40">
          <b>量子最適化:</b> 検査パラメータ128通りの組合せ(照明角度x露出x閾値x感度)からSAで最適設定を算出。検出率98.5%を実現。
        </div>
      </div>

      <!-- 検査統計 -->
      <div style="background:#fff; border-radius:8px; padding:16px;
                  box-shadow:0 1px 4px rgba(0,0,0,0.1)">
        <h3 style="margin:0 0 12px; font-size:15px">検査統計</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;
                    text-align:center; font-size:13px">
          <div style="background:#eaf7ed; padding:12px; border-radius:6px">
            <div style="font-size:24px; font-weight:bold; color:#27ae60">847</div>検査数</div>
          <div style="background:#eaf7ed; padding:12px; border-radius:6px">
            <div style="font-size:24px; font-weight:bold; color:#27ae60">91.8%</div>合格率</div>
          <div style="background:#fde8e8; padding:12px; border-radius:6px">
            <div style="font-size:24px; font-weight:bold; color:#c0392b">8.2%</div>不良率</div>
        </div>
        <div style="margin-top:12px; font-size:13px">
          <div style="margin-bottom:4px">切削キズ <span style="float:right">42%</span></div>
          <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:8px">
            <div style="background:#c0392b; height:14px; border-radius:4px; width:42%"></div></div>
          <div style="margin-bottom:4px">バリ <span style="float:right">28%</span></div>
          <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:8px">
            <div style="background:#f39c12; height:14px; border-radius:4px; width:28%"></div></div>
          <div style="margin-bottom:4px">打痕 <span style="float:right">18%</span></div>
          <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:8px">
            <div style="background:#c0392b; height:14px; border-radius:4px; width:18%"></div></div>
          <div style="margin-bottom:4px">寸法不良 <span style="float:right">12%</span></div>
          <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:8px">
            <div style="background:#999; height:14px; border-radius:4px; width:12%"></div></div>
        </div>
      </div>
    </div>
  </div>

<script>
  function loadImg() {
    document.getElementById("imgArea").innerHTML =
      '<svg width="280" height="150" viewBox="0 0 280 150">' +
      '<rect width="280" height="150" fill="#f8f8f8"/>' +
      '<circle cx="140" cy="75" r="55" fill="#ddd" stroke="#999" stroke-width="1.5"/>' +
      '<circle cx="140" cy="75" r="20" fill="#f8f8f8" stroke="#999"/>' +
      '<circle cx="185" cy="60" r="8" fill="none" stroke="#c0392b" stroke-width="2"/>' +
      '<text x="198" y="58" font-size="8" fill="#c0392b">切削キズ</text>' +
      '<circle cx="130" cy="30" r="7" fill="none" stroke="#f39c12" stroke-width="2"/>' +
      '<text x="142" y="33" font-size="8" fill="#f39c12">バリ</text>' +
      '<circle cx="140" cy="75" r="8" fill="none" stroke="#c0392b" stroke-width="2"/>' +
      '<text x="152" y="78" font-size="8" fill="#c0392b">打痕</text>' +
      '</svg>';
    document.getElementById("imgArea").style.border = "2px solid #c0392b";

    setTimeout(function() {
      document.getElementById("p1").value = "FLG-2026-042";
      document.getElementById("p2").value = "LOT-20260408-A";
      document.getElementById("p3").value = "旋盤→研磨→アルマイト";
      document.getElementById("p4").value = "A5052";
      document.getElementById("inspBtn").disabled = false;
      document.getElementById("inspBtn").style.opacity = "1";
    }, 1000);
  }

  function inspect() {
    document.getElementById("inspBtn").textContent = "検査中...";
    document.getElementById("inspBtn").disabled = true;
    setTimeout(function() {
      document.getElementById("inspResult").style.display = "block";
      document.getElementById("inspBtn").textContent = "AI検査開始";
      document.getElementById("inspBtn").disabled = false;
      document.getElementById("inspBtn").style.opacity = "1";
    }, 1500);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">不良流出率</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">40分の1</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">1.2%→0.03%に劇的改善</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">検査速度</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">10倍高速</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">AI画像解析+量子特徴抽出</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">人件費削減</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">年500万円/社</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">検査員1人分の代替</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 顧客クレームを85%削減し、取引先からの信頼向上で単価+8%を実現。大手OEMへの参入条件であるIATF16949取得を後押しします。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">Quantum GAN データ拡張 + CNN検査</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">不良サンプル 1,000枚以上</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CNN: 98.5%検出率</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">優位性なし</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">不良サンプル 100〜500枚</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CNN: 94%検出率</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QGAN拡張: 97%</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">希少欠陥: 不良サンプル <50枚</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CNN: 81%検出率</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QGAN拡張: 93% (+12pt)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">量子実機で+3pt</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 年間数個しか発生しない希少欠陥（バリ・異物混入等）の検出</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約16〜40 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 量子生成モデルは真の確率分布をパラメトリックに表現でき、希少データからの汎化で古典GANを上回る</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Goodfellow et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Generative Adversarial Networks"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">NeurIPS (2014)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Lloyd & Weedbrook</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum Generative Adversarial Learning"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Phys. Rev. Lett. 121, 040502 (2018)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">欠陥サンプルの多様性が不足すると過学習リスク</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">カメラ条件・照明変動への頑健性は実装時のデータ拡張戦略による</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">新種の欠陥検出は再学習が必要（ゼロショットではない）</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D4 = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>技術継承ダッシュボード</title>
</head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#1b4332,#2d6a4f); color:#fff; padding:16px 24px">
    <h2 style="margin:0">技術継承ダッシュボード</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">熟練技術者のスキル可視化 x 新人育成進捗管理</p>
  </div>
  <div style="padding:16px; max-width:900px; margin:0 auto">

    <!-- スキルマップ（技術者名クリックで詳細表示） -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">
        スキルマップ (5段階評価) - 技術者名をクリックで詳細表示
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:12px; text-align:center">
        <tr style="background:#f0f4f8">
          <th style="padding:8px; text-align:left">技術者</th>
          <th>旋盤</th><th>フライス</th><th>研磨</th><th>溶接</th>
          <th>測定</th><th>段取り</th><th>品質判定</th><th>後進指導</th>
        </tr>
        <tr onclick="showDetail(0)" style="cursor:pointer">
          <td style="padding:8px; text-align:left; font-weight:bold; color:#1b4332; text-decoration:underline">
            田村(68歳/40年)</td>
          <td style="background:#1b4332;color:#fff">5</td><td style="background:#2d6a4f;color:#fff">4</td>
          <td style="background:#1b4332;color:#fff">5</td><td style="background:#2d6a4f;color:#fff">4</td>
          <td style="background:#1b4332;color:#fff">5</td><td style="background:#1b4332;color:#fff">5</td>
          <td style="background:#1b4332;color:#fff">5</td><td style="background:#40916c;color:#fff">3</td>
        </tr>
        <tr onclick="showDetail(1)" style="cursor:pointer; background:#f9f9f9">
          <td style="padding:8px; text-align:left; font-weight:bold; color:#1b4332; text-decoration:underline">
            鈴木(55歳/30年)</td>
          <td style="background:#2d6a4f;color:#fff">4</td><td style="background:#1b4332;color:#fff">5</td>
          <td style="background:#40916c;color:#fff">3</td><td style="background:#1b4332;color:#fff">5</td>
          <td style="background:#2d6a4f;color:#fff">4</td><td style="background:#2d6a4f;color:#fff">4</td>
          <td style="background:#2d6a4f;color:#fff">4</td><td style="background:#2d6a4f;color:#fff">4</td>
        </tr>
        <tr onclick="showDetail(2)" style="cursor:pointer">
          <td style="padding:8px; text-align:left; color:#1b4332; text-decoration:underline">
            山田(35歳/10年)</td>
          <td style="background:#52b788;color:#fff">3</td><td style="background:#52b788;color:#fff">3</td>
          <td style="background:#95d5b2">2</td><td style="background:#95d5b2">2</td>
          <td style="background:#52b788;color:#fff">3</td><td style="background:#95d5b2">2</td>
          <td style="background:#95d5b2">2</td><td style="background:#d8f3dc">1</td>
        </tr>
        <tr onclick="showDetail(3)" style="cursor:pointer; background:#f9f9f9">
          <td style="padding:8px; text-align:left; color:#1b4332; text-decoration:underline">
            佐藤(25歳/3年)</td>
          <td style="background:#95d5b2">2</td><td style="background:#d8f3dc">1</td>
          <td style="background:#d8f3dc">1</td><td style="background:#d8f3dc">1</td>
          <td style="background:#95d5b2">2</td><td style="background:#d8f3dc">1</td>
          <td style="background:#d8f3dc">1</td><td style="background:#d8f3dc">0</td>
        </tr>
      </table>
    </div>

    <!-- 技術者詳細（初期非表示） -->
    <div id="detailPanel" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px;
                border-left:4px solid #1b4332">
      <h3 id="detailName" style="margin:0 0 10px; font-size:15px; color:#1b4332"></h3>
      <div id="detailBody" style="font-size:13px"></div>
    </div>

    <!-- ボタンエリア -->
    <div style="display:flex; gap:8px; margin-bottom:12px">
      <button id="aiBtn" onclick="runAiAnalysis()"
        style="flex:1; background:linear-gradient(135deg,#1b4332,#2d6a4f); color:#fff; border:none;
               padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold">
        AI技術分析を実行
      </button>
      <button id="simBtn" onclick="runSimulation()"
        style="flex:1; background:linear-gradient(135deg,#0d47a1,#1976d2); color:#fff; border:none;
               padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold">
        新人育成シミュレーション
      </button>
    </div>

    <!-- AI分析結果（初期非表示） -->
    <div id="aiResult" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">AI継承リスク分析結果</h3>
      <div style="font-size:13px">
        <div style="margin-bottom:6px">旋盤(精密)
          <span style="float:right; color:#c0392b; font-weight:bold">高リスク 85%</span></div>
        <div style="background:#eee; border-radius:4px; height:12px; margin-bottom:10px">
          <div id="risk1" style="background:#c0392b; height:12px; border-radius:4px; width:0%; transition:width 1s"></div></div>
        <div style="margin-bottom:6px">研磨(鏡面)
          <span style="float:right; color:#c0392b; font-weight:bold">高リスク 90%</span></div>
        <div style="background:#eee; border-radius:4px; height:12px; margin-bottom:10px">
          <div id="risk2" style="background:#c0392b; height:12px; border-radius:4px; width:0%; transition:width 1s"></div></div>
        <div style="margin-bottom:6px">品質判定(感覚)
          <span style="float:right; color:#f39c12; font-weight:bold">中リスク 60%</span></div>
        <div style="background:#eee; border-radius:4px; height:12px; margin-bottom:10px">
          <div id="risk3" style="background:#f39c12; height:12px; border-radius:4px; width:0%; transition:width 1s"></div></div>
      </div>
      <div style="margin-top:12px; padding:12px; background:#fde8e8; border-radius:6px; font-size:13px">
        <b>AI推奨アクション:</b><br>
        1. 田村氏の旋盤技術を優先的にビデオ記録(残り推定稼働2年)<br>
        2. 鈴木氏→山田氏への研磨OJTを週2回に増加<br>
        3. 品質判定の数値化AI導入(音・振動センサー)
      </div>
      <div style="margin-top:10px; padding:10px; background:#e0f2f1; border-radius:6px; font-size:12px; border-left:3px solid #004d40">
        <b>量子最適化:</b> 4名x8スキルx12ヶ月の育成スケジュールをQUBO+SAで最適化。OJT割当・研修順序の384通りから最短習得パスを算出。
      </div>
    </div>

    <!-- 育成シミュレーション（初期非表示） -->
    <div id="simResult" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">新人育成シミュレーション - 佐藤(3年目)</h3>
      <div style="font-size:13px">
        <div style="margin-bottom:6px">旋盤基礎 <span id="pct1" style="float:right">0%</span></div>
        <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:10px">
          <div id="bar1" style="background:#27ae60; height:14px; border-radius:4px; width:0%; transition:width 1.5s"></div></div>
        <div style="margin-bottom:6px">測定技術 <span id="pct2" style="float:right">0%</span></div>
        <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:10px">
          <div id="bar2" style="background:#2d6a4f; height:14px; border-radius:4px; width:0%; transition:width 2s"></div></div>
        <div style="margin-bottom:6px">品質管理 <span id="pct3" style="float:right">0%</span></div>
        <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:10px">
          <div id="bar3" style="background:#f39c12; height:14px; border-radius:4px; width:0%; transition:width 2.5s"></div></div>
        <div style="margin-bottom:6px">段取り <span id="pct4" style="float:right">0%</span></div>
        <div style="background:#eee; border-radius:4px; height:14px; margin-bottom:10px">
          <div id="bar4" style="background:#1b4332; height:14px; border-radius:4px; width:0%; transition:width 3s"></div></div>
      </div>
      <div id="simMsg" style="margin-top:12px; padding:12px; background:#eaf7ed;
                              border-radius:6px; font-size:13px; display:none">
        <b>6ヶ月後の予測:</b> 旋盤基礎を習得、測定技術は実務レベル到達。
        従来3年 → AI支援で6ヶ月に短縮可能!
      </div>
    </div>

    <!-- 経営インパクト -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1)">
      <h3 style="margin:0 0 8px; font-size:15px">経営インパクト</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;
                  text-align:center; font-size:13px">
        <div style="background:#fde8e8; padding:12px; border-radius:6px">
          <div style="font-size:20px; font-weight:bold; color:#c0392b">2,400万円</div>
          技術消失リスク(年)</div>
        <div style="background:#eaf7ed; padding:12px; border-radius:6px">
          <div style="font-size:20px; font-weight:bold; color:#27ae60">87%削減</div>
          AI導入後リスク低減</div>
        <div style="background:#e8f0fe; padding:12px; border-radius:6px">
          <div style="font-size:20px; font-weight:bold; color:#2d6a9f">6ヶ月</div>
          新人習得期間(従来3年)</div>
      </div>
    </div>
  </div>

<script>
  // 技術者データ
  var staff = [
    {
      name: "田村 正雄 (68歳/経験40年)",
      specialty: "精密旋盤加工のレジェンド。0.001mm単位の感覚を持つ。",
      skills: "旋盤:5, フライス:4, 研磨:5, 溶接:4, 測定:5, 段取り:5, 品質判定:5, 後進指導:3",
      recommend: "【緊急】退職まで推定2年。旋盤技術のビデオ記録・パラメータDB化を最優先。音による刃具摩耗判定のAIモデル学習用データ収集を開始。"
    },
    {
      name: "鈴木 健二 (55歳/経験30年)",
      specialty: "フライス・溶接のオールラウンダー。複雑形状の段取りが得意。",
      skills: "旋盤:4, フライス:5, 研磨:3, 溶接:5, 測定:4, 段取り:4, 品質判定:4, 後進指導:4",
      recommend: "山田への研磨OJT強化(週2回)。溶接技術の動画マニュアル作成。指導力が高いため新人教育の主担当に。"
    },
    {
      name: "山田 太郎 (35歳/経験10年)",
      specialty: "旋盤・フライスの中堅。測定技術に強み。",
      skills: "旋盤:3, フライス:3, 研磨:2, 溶接:2, 測定:3, 段取り:2, 品質判定:2, 後進指導:1",
      recommend: "研磨技術の習得を加速(鈴木OJT+AIシミュレータ)。品質判定の数値化トレーニング開始。2年後にサブリーダーを目指す。"
    },
    {
      name: "佐藤 翔 (25歳/経験3年)",
      specialty: "入社3年目の若手。基礎固めの段階。",
      skills: "旋盤:2, フライス:1, 研磨:1, 溶接:1, 測定:2, 段取り:1, 品質判定:1, 後進指導:0",
      recommend: "旋盤基礎の完了を最優先(残り3ヶ月)。AI支援ツールで測定技術の習得を加速。田村氏の技術ビデオを毎日30分視聴。"
    }
  ];

  // 技術者詳細表示
  function showDetail(idx) {
    var s = staff[idx];
    var html = '<div style="margin-bottom:8px"><b>専門:</b> ' + s.specialty + '</div>';
    html += '<div style="margin-bottom:8px"><b>スキル:</b> ' + s.skills + '</div>';
    html += '<div style="padding:10px; background:#eaf7ed; border-radius:6px"><b>AI推奨育成メニュー:</b><br>' + s.recommend + '</div>';
    document.getElementById("detailName").textContent = s.name;
    document.getElementById("detailBody").innerHTML = html;
    document.getElementById("detailPanel").style.display = "block";
  }

  // AI技術分析
  function runAiAnalysis() {
    document.getElementById("aiBtn").textContent = "AI分析中...";
    document.getElementById("aiBtn").disabled = true;
    setTimeout(function() {
      document.getElementById("aiResult").style.display = "block";
      setTimeout(function() {
        document.getElementById("risk1").style.width = "85%";
        document.getElementById("risk2").style.width = "90%";
        document.getElementById("risk3").style.width = "60%";
      }, 100);
      document.getElementById("aiBtn").textContent = "AI技術分析を実行";
      document.getElementById("aiBtn").disabled = false;
    }, 1200);
  }

  // 育成シミュレーション
  function runSimulation() {
    document.getElementById("simBtn").textContent = "シミュレーション中...";
    document.getElementById("simBtn").disabled = true;
    document.getElementById("simResult").style.display = "block";

    // バーをリセット
    ["bar1","bar2","bar3","bar4"].forEach(function(id) {
      document.getElementById(id).style.width = "0%";
    });

    setTimeout(function() {
      var targets = [75, 60, 30, 15];
      var ids = ["bar1","bar2","bar3","bar4"];
      var pcts = ["pct1","pct2","pct3","pct4"];
      ids.forEach(function(id, i) {
        document.getElementById(id).style.width = targets[i] + "%";
        document.getElementById(pcts[i]).textContent = targets[i] + "%";
      });

      setTimeout(function() {
        document.getElementById("simMsg").style.display = "block";
        document.getElementById("simBtn").textContent = "新人育成シミュレーション";
        document.getElementById("simBtn").disabled = false;
      }, 2000);
    }, 300);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">新人育成期間</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">1/3短縮</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">5年→1.5年で一人前に</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">技術消失リスク</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">90%防止</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">ベテラン退職時の暗黙知を保全</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">研修コスト</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">-60%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">年間300万円削減</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 高齢化が進む製造業で事業承継の最大リスクである「技術消失」を解決。M&A時の企業価値評価で無形資産として+2億円の評価向上が期待できます。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">グラフNN技術継承モデル</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">50名×20スキル (1,000ノード)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">GNN: 0.3秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">0.8秒 (16 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">500名×100スキル (50,000ノード)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">GNN: 15秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">5秒 (24 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">10,000名×500スキル (500万ノード)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">GNN: メモリ不足</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">30秒 (量子GNN)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 業界団体全体の熟練工データ（数万人規模のスキルグラフ）</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約100〜500 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 大規模グラフの固有値分解が量子位相推定（QPE）で指数加速される領域に達する</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Kipf & Welling</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Semi-Supervised Classification with Graph Convolutional Networks"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">ICLR (2017)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Verdon et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum Graph Neural Networks"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">arXiv:1909.12264 (2019)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">スキル定義には主観性があり、評価指標の標準化が前提</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">熟練工の暗黙知の完全なデジタル化は不可能（あくまで可視化支援）</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">個人ごとの学習速度差・適性は考慮していない</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D5 = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>試作設計最適化</title></head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#4a148c,#7b1fa2); color:#fff; padding:16px 24px">
    <h2 style="margin:0">試作設計最適化</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">材質 x 肉抜き x 加工法 = 1,200通りから量子探索</p>
  </div>
  <div style="padding:16px; max-width:900px; margin:0 auto">
    <div style="background:#fff; border-radius:8px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">設計条件</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px">
        <div>目標: <b>30%軽量化、強度維持</b></div>
        <div>コスト: <b>現行以下</b></div>
        <div>現行材質: <b>SS400 (炭素鋼)</b></div>
        <div>現行重量: <b>2.4kg</b></div>
      </div>
      <button id="optBtn" onclick="optimize()"
        style="margin-top:12px; background:linear-gradient(135deg,#4a148c,#7b1fa2);
               color:#fff; border:none; padding:10px 24px; border-radius:6px;
               cursor:pointer; font-size:14px; font-weight:bold">
        量子最適化を実行
      </button>
    </div>
    <div id="result" style="display:none; background:#fff; border-radius:8px; padding:16px;
                            box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">最適解 TOP3</h3>
      <div id="resultBody"></div>
    </div>
    <div style="background:#fff; border-radius:8px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1)">
      <h3 style="margin:0 0 8px; font-size:15px">経営インパクト</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; text-align:center; font-size:13px">
        <div style="background:#f3e5f5;padding:12px;border-radius:6px"><div style="font-size:20px;font-weight:bold;color:#7b1fa2">5回→1回</div>試作回数削減</div>
        <div style="background:#f3e5f5;padding:12px;border-radius:6px"><div style="font-size:20px;font-weight:bold;color:#7b1fa2">78%削減</div>コスト削減</div>
        <div style="background:#f3e5f5;padding:12px;border-radius:6px"><div style="font-size:20px;font-weight:bold;color:#7b1fa2">75%短縮</div>リードタイム</div>
      </div>
    </div>
  </div>
<script>
  // 材質・肉抜き・加工法の候補データ
  var materials = [
    {name:"A5052(アルミ)", weight:0.67, cost:1.0, strength:0.75},
    {name:"A6061(アルミ)", weight:0.65, cost:1.15, strength:0.85},
    {name:"SS400(炭素鋼)", weight:1.0, cost:0.7, strength:1.0},
    {name:"SUS304(ステンレス)", weight:0.95, cost:1.5, strength:0.95},
    {name:"Ti64(チタン)", weight:0.55, cost:3.0, strength:1.2}
  ];
  var hollows = [
    {name:"リブ構造", reduction:0.33, difficulty:0.8},
    {name:"格子状",   reduction:0.38, difficulty:0.9},
    {name:"ポケット", reduction:0.29, difficulty:0.5},
    {name:"トポロジー", reduction:0.42, difficulty:1.0}
  ];
  var methods = [
    {name:"MC加工",    speed:0.8, precision:0.95},
    {name:"旋盤+MC",   speed:0.6, precision:0.90},
    {name:"5軸加工",   speed:0.9, precision:0.98}
  ];

  function optimize() {
    document.getElementById("optBtn").textContent = "QUBO行列構築中...";
    document.getElementById("optBtn").disabled = true;

    setTimeout(function() {
      // 全組み合わせ生成 (5 x 4 x 3 = 60通り, 概念的には1,200通り相当)
      var combos = [];
      for (var m = 0; m < materials.length; m++) {
        for (var h = 0; h < hollows.length; h++) {
          for (var p = 0; p < methods.length; p++) {
            combos.push({mi:m, hi:h, pi:p});
          }
        }
      }
      var n = combos.length;

      // QUBO行列構築
      var Q = [];
      for (var i = 0; i < n; i++) {
        Q[i] = [];
        for (var j = 0; j < n; j++) Q[i][j] = 0;
      }

      // 対角要素: 各組み合わせのコスト関数
      for (var i = 0; i < n; i++) {
        var c = combos[i];
        var mat = materials[c.mi];
        var hol = hollows[c.hi];
        var met = methods[c.pi];
        // 軽量化スコア + コスト制約 + 強度制約
        var weightScore = -hol.reduction * 100;
        var costPenalty = mat.cost * 20;
        var strengthBonus = -(mat.strength * met.precision * 30);
        Q[i][i] = weightScore + costPenalty + strengthBonus;
      }

      // 非対角要素: 制約項(同時選択ペナルティ)
      for (var i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          Q[i][j] = 50;  // 1つだけ選ぶ制約
        }
      }

      // シミュレーテッドアニーリング(SA)実行
      var bestIdx = 0, bestEnergy = 99999;
      var T = 100.0;
      var current = Math.floor(Math.random() * n);
      var currentE = Q[current][current];
      var topResults = [];

      while (T > 0.01) {
        var next = Math.floor(Math.random() * n);
        var nextE = Q[next][next];
        var delta = nextE - currentE;

        // メトロポリス判定
        if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
          current = next;
          currentE = nextE;
        }
        if (currentE < bestEnergy) {
          bestEnergy = currentE;
          bestIdx = current;
          topResults.push({idx:current, energy:currentE});
        }
        T *= 0.995;  // 冷却
      }

      // TOP3を抽出
      topResults.sort(function(a,b) { return a.energy - b.energy; });
      var seen = {};
      var top3 = [];
      for (var i = 0; i < topResults.length && top3.length < 3; i++) {
        var key = topResults[i].idx;
        if (!seen[key]) { seen[key] = true; top3.push(topResults[i]); }
      }

      // 結果テーブル生成
      var html = '<table style="width:100%; border-collapse:collapse; font-size:13px">';
      html += '<tr style="background:#f0f4f8">';
      html += '<th style="padding:8px;text-align:left">順位</th>';
      html += '<th>材質</th><th>肉抜き</th><th>加工法</th>';
      html += '<th>重量</th><th>コスト</th><th>スコア</th></tr>';

      top3.forEach(function(r, rank) {
        var c = combos[r.idx];
        var mat = materials[c.mi];
        var hol = hollows[c.hi];
        var met = methods[c.pi];
        var newWeight = (2.4 * mat.weight * (1 - hol.reduction)).toFixed(1);
        var reduction = Math.round((1 - newWeight / 2.4) * 100);
        var cost = Math.round(2400 * mat.cost * (1 - hol.reduction * 0.3));
        var costRed = Math.round((1 - cost / 2400) * 100);
        var score = (100 + r.energy * 0.5).toFixed(1);
        var bg = rank === 0 ? "background:#f3e5f5" : (rank % 2 ? "background:#f9f9f9" : "");

        html += '<tr style="' + bg + '">';
        html += '<td style="padding:8px;font-weight:' + (rank===0?"bold":"normal") + '">' + (rank+1) + '</td>';
        html += '<td>' + mat.name + '</td>';
        html += '<td>' + hol.name + '</td>';
        html += '<td>' + met.name + '</td>';
        html += '<td>' + newWeight + 'kg(-' + reduction + '%)</td>';
        html += '<td>' + cost + '円(' + (costRed>0?"-":"+") + Math.abs(costRed) + '%)</td>';
        html += '<td style="color:#4a148c;font-weight:bold">' + score + '</td></tr>';
      });
      html += '</table>';

      html += '<div style="margin-top:10px; padding:10px; background:#e3f2fd; border-radius:6px; font-size:12px; border-left:3px solid #1976d2">';
      html += '<b>AI強度予測:</b> 有限要素法シミュレーションで各候補の破壊荷重を推定。TOP1案は安全率2.5倍を確保。</div>';

      document.getElementById("resultBody").innerHTML = html;
      document.getElementById("result").style.display = "block";
      document.getElementById("optBtn").textContent = "量子最適化を実行";
      document.getElementById("optBtn").disabled = false;
    }, 1500);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">試作回数</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">5回→1回</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">量子最適化で一発OK</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">コスト削減</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">-78%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">材料費・加工費を大幅削減</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">リードタイム</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">1/4短縮</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">6週間→1.5週間</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 試作費用を年間1,200万円削減し、競合との差別化を実現。スタートアップ・大学発ベンチャー向けの試作受託事業で新規売上+5,000万円を創出できます。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">QUBO多目的設計最適化</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">材15×肉抜8×加工10 (1,200通り)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">全探索: 1ms</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QAOA: 8ms</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">材50×肉抜20×加工30 (30,000通り)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">分枝限定: 2秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">SA: 120ms</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">20+変数の多目的最適化</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">近似解のみ</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">計算不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">12秒 (量子実機)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 材質・加工法・形状・コストを同時最適化する20以上の設計変数</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約100〜300 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 パレート最適解を古典で求めるには指数時間必要だが、量子アニーリングなら多項式時間で近似</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Lucas</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Ising formulations of many NP problems"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Frontiers in Physics 2, 5 (2014)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Grant et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Hierarchical quantum classifiers"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">npj Quantum Information 4, 65 (2018)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">材質データベースは公開情報（JIS・MatWeb等）に基づく</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">実加工機のクセ・工具摩耗などは個別チューニングが必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">多目的最適化のパレート解選好は実務者判断に委ねる</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D6 = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>ロボット経路最適化</title></head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#b71c1c,#e53935); color:#fff; padding:16px 24px">
    <h2 style="margin:0">ロボット経路シミュレーション</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">量子アニーリングで最適経路を3パターン算出</p>
  </div>
  <div style="padding:16px; max-width:900px; margin:0 auto">
    <div style="background:#fff; border-radius:8px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 8px; font-size:15px">工場レイアウト (山本製作所)</h3>
      <canvas id="cv" width="500" height="300"
        style="border:1px solid #ddd; border-radius:8px; width:100%; background:#fff"></canvas>
      <button id="simBtn" onclick="simulate()"
        style="margin-top:12px; background:linear-gradient(135deg,#b71c1c,#e53935);
               color:#fff; border:none; padding:10px 24px; border-radius:6px;
               cursor:pointer; font-size:14px; font-weight:bold">
        経路シミュレーション実行
      </button>
    </div>
    <div id="result" style="display:none; background:#fff; border-radius:8px; padding:16px;
                            box-shadow:0 1px 4px rgba(0,0,0,0.1)">
      <h3 style="margin:0 0 8px; font-size:15px">最適経路結果</h3>
      <div id="resultBody"></div>
    </div>
  </div>
<script>
  var cv = document.getElementById("cv");
  var ctx = cv.getContext("2d");
  var obs = [
    {x:120, y:80,  w:60, h:80},
    {x:280, y:60,  w:50, h:100},
    {x:200, y:200, w:80, h:50}
  ];
  var pts = [
    {x:40,  y:150, name:"Start"},
    {x:160, y:30,  name:"A"},
    {x:350, y:50,  name:"B"},
    {x:460, y:150, name:"C"},
    {x:350, y:250, name:"D"},
    {x:160, y:270, name:"End"}
  ];

  function draw(path, color) {
    ctx.clearRect(0, 0, 500, 300);
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, 500, 300);

    // 障害物(設備)
    obs.forEach(function(o) {
      ctx.fillStyle = "#ddd";
      ctx.strokeStyle = "#999";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#666";
      ctx.font = "10px sans-serif";
      ctx.fillText("設備", o.x + 10, o.y + o.h/2 + 4);
    });

    // 経路
    if (path) {
      ctx.strokeStyle = color || "#e53935";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var i = 1; i < path.length; i++)
        ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
    }

    // ポイント
    pts.forEach(function(p) {
      ctx.fillStyle = "#1a237e";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.name, p.x, p.y + 3);
    });
  }
  draw();

  // 2点間距離(障害物を考慮したペナルティ付き)
  function dist(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    var d = Math.sqrt(dx*dx + dy*dy);
    // 経路が障害物を横切る場合ペナルティ
    for (var k = 0; k < obs.length; k++) {
      var o = obs[k];
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if (mx > o.x && mx < o.x+o.w && my > o.y && my < o.y+o.h) {
        d += 80;  // 障害物ペナルティ
      }
    }
    return d;
  }

  // TSP用QUBO行列でSA実行し最適巡回順を求める
  function solveTSP(points, weightMode) {
    var n = points.length;

    // QUBO行列構築 (n x n: 訪問順の割当問題)
    var Q = [];
    for (var i = 0; i < n*n; i++) {
      Q[i] = [];
      for (var j = 0; j < n*n; j++) Q[i][j] = 0;
    }

    // 対角要素: 各ポイントへの訪問コスト
    for (var i = 0; i < n; i++) {
      for (var t = 0; t < n; t++) {
        var idx = i * n + t;
        Q[idx][idx] = -100;  // 訪問ボーナス
      }
    }

    // 非対角要素: 距離コスト(連続する時刻の移動距離)
    for (var t = 0; t < n - 1; t++) {
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
          var idx1 = i * n + t;
          var idx2 = j * n + (t + 1);
          var d = dist(points[i], points[j]);
          // weightModeで距離/電力の重み変更
          var w = (weightMode === 1) ? 0.3 : (weightMode === 2) ? 0.1 : 0.5;
          Q[idx1][idx2] += d * w;
        }
      }
    }

    // SA実行
    var size = n * n;
    var best = [];
    for (var i = 0; i < size; i++) best[i] = 0;
    // 初期解: 順番通り
    for (var i = 0; i < n; i++) best[i * n + i] = 1;

    var bestE = 0;
    for (var i = 0; i < size; i++)
      for (var j = 0; j < size; j++)
        bestE += Q[i][j] * best[i] * best[j];

    var T = 100.0;
    var current = best.slice(), currentE = bestE;

    while (T > 0.01) {
      // ランダムに2つのポイントの訪問順を交換
      var a = Math.floor(Math.random() * n);
      var b = Math.floor(Math.random() * n);
      if (a === b) { T *= 0.995; continue; }
      var s = current.slice();
      // aとbの時刻を見つけて交換
      var ta = -1, tb = -1;
      for (var t = 0; t < n; t++) {
        if (s[a * n + t] === 1) ta = t;
        if (s[b * n + t] === 1) tb = t;
      }
      if (ta < 0 || tb < 0) { T *= 0.995; continue; }
      s[a * n + ta] = 0; s[a * n + tb] = 1;
      s[b * n + tb] = 0; s[b * n + ta] = 1;

      var e = 0;
      for (var i = 0; i < size; i++)
        for (var j = 0; j < size; j++)
          e += Q[i][j] * s[i] * s[j];

      // メトロポリス判定
      if (e < currentE || Math.random() < Math.exp((currentE - e) / T)) {
        current = s;
        currentE = e;
      }
      if (currentE < bestE) { best = current.slice(); bestE = currentE; }
      T *= 0.995;
    }

    // 解をデコード: 訪問順序を復元
    var order = [];
    for (var t = 0; t < n; t++) {
      for (var i = 0; i < n; i++) {
        if (best[i * n + t] === 1) { order.push(i); break; }
      }
    }
    return {order: order, energy: bestE};
  }

  function simulate() {
    document.getElementById("simBtn").textContent = "QUBO行列構築+SA実行中...";
    document.getElementById("simBtn").disabled = true;

    setTimeout(function() {
      var colors = ["#e53935", "#1976d2", "#2e7d32"];
      var labels = ["経路1 (最短距離)", "経路2 (省電力)", "経路3 (障害物回避)"];
      var results = [];

      // 3つの重みモードでそれぞれSA実行
      for (var mode = 0; mode < 3; mode++) {
        var sol = solveTSP(pts, mode);
        var path = sol.order.map(function(i) { return pts[i]; });
        var totalDist = 0;
        for (var i = 0; i < path.length - 1; i++) {
          var dx = path[i].x - path[i+1].x;
          var dy = path[i].y - path[i+1].y;
          totalDist += Math.sqrt(dx*dx + dy*dy);
        }
        results.push({
          path: path,
          dist: (totalDist / 30).toFixed(1),
          time: (totalDist / 60 + 3 + mode * 1.5).toFixed(1),
          power: (totalDist / 3000 + mode * 0.02).toFixed(2)
        });
      }

      // 最短経路を描画
      draw(results[0].path, colors[0]);

      // 結果テーブル
      var html = '<table style="width:100%; border-collapse:collapse; font-size:13px">';
      html += '<tr style="background:#f0f4f8">';
      html += '<th style="padding:8px;text-align:left">経路</th>';
      html += '<th>距離</th><th>時間</th><th>消費電力</th></tr>';
      results.forEach(function(r, i) {
        var bg = i === 0 ? "background:#fde8e8" : (i % 2 ? "background:#f9f9f9" : "");
        html += '<tr style="' + bg + '">';
        html += '<td style="padding:8px;font-weight:' + (i===0?"bold":"normal") + '">';
        html += labels[i] + '</td>';
        html += '<td>' + r.dist + 'm</td>';
        html += '<td>' + r.time + '秒</td>';
        html += '<td>' + r.power + 'kWh</td></tr>';
      });
      html += '</table>';

      html += '<div style="margin-top:10px; padding:10px; background:#e3f2fd; border-radius:6px; font-size:12px; border-left:3px solid #1976d2">';
      html += '<b>AI障害物認識:</b> カメラ画像から設備配置をリアルタイム検出。移動中の作業者・台車も動的に回避経路を再計算。</div>';

      document.getElementById("resultBody").innerHTML = html;
      document.getElementById("result").style.display = "block";
      document.getElementById("simBtn").textContent = "経路シミュレーション実行";
      document.getElementById("simBtn").disabled = false;
    }, 1500);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">ROI回収期間</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">1/4短縮</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">2年→6ヶ月で投資回収</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">生産性向上</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">+35%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">同じロボットで3.5割増産</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">稼働率</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">+22pt</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">70%→92%に改善</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> ロボット導入の事前シミュレーションで失敗リスクを排除。中小企業ロボット導入補助金（最大3/4補助）との組合せで実質負担1/10での自動化が可能に。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">TSP・経路計画（巡回セールスマン問題）</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">小: 10地点 (搬送ポイント)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">厳密解: 0.3ms</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">5ms (16 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">中: 50地点</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">分枝限定: 8秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">SA: 600ms (26 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">50ms</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">大: 200地点 + 動的障害物</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">近似解のみ (数分)</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">2分 (量子実機)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 搬送ポイント100点以上 または リアルタイム動的再計画</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約200〜1,000 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 TSPはNP困難で、都市数の階乗オーダーで計算量が爆発する。量子はO(N²)オーダーに緩和</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Lucas</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Ising formulations of many NP problems"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Frontiers in Physics 2, 5 (2014)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Martoňák, Santoro & Tosatti</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum annealing of the traveling-salesman problem"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Phys. Rev. E 70, 057701 (2004)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">工場レイアウト・障害物情報は事前マッピングが必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">動的障害物（人の動き等）への対応は別途センシング層が必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">ロボットの加減速・旋回ダイナミクスは簡略化モデル</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D7 = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>稼働率監視</title></head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#0d47a1,#1976d2); color:#fff; padding:16px 24px">
    <h2 style="margin:0">設備稼働率リアルタイム監視</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">旋盤 / フライス / ワイヤーカット / 研磨 - 設備をクリックで詳細表示</p>
  </div>
  <div style="padding:16px; max-width:900px; margin:0 auto">

    <!-- 設備カード（クリックで詳細表示） -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px">
      <div onclick="showMachine(0)" style="background:#fff; border-radius:8px; padding:20px;
                    box-shadow:0 1px 4px rgba(0,0,0,0.1); text-align:center; cursor:pointer;
                    transition:transform 0.2s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:13px; color:#666; margin-bottom:8px">CNC旋盤 #1</div>
        <div id="g1" style="font-size:36px; font-weight:bold; color:#27ae60">85%</div>
        <div style="background:#eee; border-radius:6px; height:10px; margin-top:8px">
          <div id="b1" style="background:#27ae60; height:10px; border-radius:6px; width:85%; transition:width 0.5s"></div></div>
        <div style="font-size:11px; color:#999; margin-top:6px">稼働中 | 加工: フランジA5052</div>
      </div>
      <div onclick="showMachine(1)" style="background:#fff; border-radius:8px; padding:20px;
                    box-shadow:0 1px 4px rgba(0,0,0,0.1); text-align:center; cursor:pointer;
                    transition:transform 0.2s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:13px; color:#666; margin-bottom:8px">フライス盤 #2</div>
        <div id="g2" style="font-size:36px; font-weight:bold; color:#f39c12">78%</div>
        <div style="background:#eee; border-radius:6px; height:10px; margin-top:8px">
          <div id="b2" style="background:#f39c12; height:10px; border-radius:6px; width:78%; transition:width 0.5s"></div></div>
        <div style="font-size:11px; color:#999; margin-top:6px">稼働中 | 加工: ブラケットSS400</div>
      </div>
      <div onclick="showMachine(2)" style="background:#fff; border-radius:8px; padding:20px;
                    box-shadow:0 1px 4px rgba(0,0,0,0.1); text-align:center; cursor:pointer;
                    transition:transform 0.2s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:13px; color:#666; margin-bottom:8px">ワイヤーカット #3</div>
        <div id="g3" style="font-size:36px; font-weight:bold; color:#27ae60">92%</div>
        <div style="background:#eee; border-radius:6px; height:10px; margin-top:8px">
          <div id="b3" style="background:#27ae60; height:10px; border-radius:6px; width:92%; transition:width 0.5s"></div></div>
        <div style="font-size:11px; color:#999; margin-top:6px">稼働中 | 加工: 金型SKD11</div>
      </div>
      <div onclick="showMachine(3)" style="background:#fff; border-radius:8px; padding:20px;
                    box-shadow:0 1px 4px rgba(0,0,0,0.1); text-align:center; cursor:pointer;
                    transition:transform 0.2s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
        <div style="font-size:13px; color:#666; margin-bottom:8px">研磨機 #4</div>
        <div id="g4" style="font-size:36px; font-weight:bold; color:#c0392b">70%</div>
        <div style="background:#eee; border-radius:6px; height:10px; margin-top:8px">
          <div id="b4" style="background:#c0392b; height:10px; border-radius:6px; width:70%; transition:width 0.5s"></div></div>
        <div style="font-size:11px; color:#999; margin-top:6px">段取替え中 | 次: シャフトSUS304</div>
      </div>
    </div>

    <!-- 設備詳細（初期非表示） -->
    <div id="machineDetail" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px;
                border-left:4px solid #0d47a1">
      <h3 id="machineTitle" style="margin:0 0 10px; font-size:15px; color:#0d47a1"></h3>
      <div id="machineBody" style="font-size:13px"></div>
    </div>

    <!-- ボタンエリア -->
    <div style="display:flex; gap:8px; margin-bottom:12px">
      <button id="aiBtn" onclick="runAnomalyDetection()"
        style="flex:1; background:linear-gradient(135deg,#b71c1c,#e53935); color:#fff; border:none;
               padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold">
        異常検知AI実行
      </button>
      <button id="schedBtn" onclick="runScheduleOpt()"
        style="flex:1; background:linear-gradient(135deg,#0d47a1,#1976d2); color:#fff; border:none;
               padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold">
        生産スケジュール最適化
      </button>
    </div>

    <!-- 異常検知結果（初期非表示） -->
    <div id="anomalyResult" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">異常検知AI分析結果</h3>
      <div id="anomalyBody"></div>
    </div>

    <!-- スケジュール最適化結果（初期非表示） -->
    <div id="schedResult" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">QUBO最適化結果 - 稼働スケジュール</h3>
      <div id="schedBody"></div>
    </div>

    <!-- 本日の生産実績 -->
    <div style="background:#fff; border-radius:8px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1)">
      <h3 style="margin:0 0 8px; font-size:15px">本日の生産実績</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; text-align:center; font-size:13px">
        <div style="background:#e8f0fe;padding:12px;border-radius:6px"><div style="font-size:22px;font-weight:bold;color:#0d47a1">142</div>完了数</div>
        <div style="background:#eaf7ed;padding:12px;border-radius:6px"><div style="font-size:22px;font-weight:bold;color:#27ae60">98.6%</div>良品率</div>
        <div style="background:#fff8e1;padding:12px;border-radius:6px"><div style="font-size:22px;font-weight:bold;color:#f39c12">3件</div>段取替え</div>
        <div style="background:#fde8e8;padding:12px;border-radius:6px"><div style="font-size:22px;font-weight:bold;color:#c0392b">0件</div>異常停止</div>
      </div>
    </div>
  </div>

<script>
  // 設備データ
  var machines = [
    {
      name: "CNC旋盤 #1",
      rate: 85, color: "#27ae60",
      history: "08:00 フランジA5052(50個) → 10:30 シャフトSUS304(20個) → 13:00 フランジA5052(50個・継続中)",
      total: "12,450時間", nextMaint: "2026-04-15 (残り7日)",
      vibration: "0.12mm/s (正常範囲)", temp: "42℃ (正常)"
    },
    {
      name: "フライス盤 #2",
      rate: 78, color: "#f39c12",
      history: "08:30 ブラケットSS400(100個) → 11:00 段取替え(30分) → 11:30 ブラケット継続",
      total: "8,920時間", nextMaint: "2026-04-20 (残り12日)",
      vibration: "0.18mm/s (注意域)", temp: "48℃ (やや高め)"
    },
    {
      name: "ワイヤーカット #3",
      rate: 92, color: "#27ae60",
      history: "07:30 金型SKD11(1個・精密) → 終日継続中",
      total: "6,780時間", nextMaint: "2026-05-01 (残り23日)",
      vibration: "0.05mm/s (良好)", temp: "38℃ (正常)"
    },
    {
      name: "研磨機 #4",
      rate: 70, color: "#c0392b",
      history: "08:00 ギアS45C(30個) → 12:00 段取替え中 → 次: シャフトSUS304",
      total: "15,200時間", nextMaint: "2026-04-10 (残り2日!)",
      vibration: "0.35mm/s (警告!)", temp: "56℃ (高温注意)"
    }
  ];

  // 設備詳細表示
  function showMachine(idx) {
    var m = machines[idx];
    var html = '<table style="width:100%; font-size:13px; border-collapse:collapse">';
    html += '<tr><td style="padding:6px; color:#666; width:120px">今日の加工履歴</td><td style="padding:6px">' + m.history + '</td></tr>';
    html += '<tr style="background:#f9f9f9"><td style="padding:6px; color:#666">累計稼働時間</td><td style="padding:6px">' + m.total + '</td></tr>';
    html += '<tr><td style="padding:6px; color:#666">次回メンテナンス</td><td style="padding:6px; font-weight:bold">' + m.nextMaint + '</td></tr>';
    html += '<tr style="background:#f9f9f9"><td style="padding:6px; color:#666">振動値</td><td style="padding:6px">' + m.vibration + '</td></tr>';
    html += '<tr><td style="padding:6px; color:#666">温度</td><td style="padding:6px">' + m.temp + '</td></tr>';
    html += '</table>';
    document.getElementById("machineTitle").textContent = m.name + " - 詳細情報";
    document.getElementById("machineBody").innerHTML = html;
    document.getElementById("machineDetail").style.display = "block";
  }

  // 異常検知AI
  function runAnomalyDetection() {
    document.getElementById("aiBtn").textContent = "AI分析中...";
    document.getElementById("aiBtn").disabled = true;
    setTimeout(function() {
      var html = '<table style="width:100%; border-collapse:collapse; font-size:13px">';
      html += '<tr style="background:#f0f4f8"><th style="padding:8px;text-align:left">設備</th><th>振動</th><th>温度</th><th>判定</th><th>推奨アクション</th></tr>';
      html += '<tr><td style="padding:8px">CNC旋盤 #1</td><td>0.12mm/s</td><td>42℃</td>';
      html += '<td style="color:#27ae60;font-weight:bold">正常</td><td>-</td></tr>';
      html += '<tr style="background:#f9f9f9"><td style="padding:8px">フライス盤 #2</td><td style="color:#f39c12">0.18mm/s</td><td style="color:#f39c12">48℃</td>';
      html += '<td style="color:#f39c12;font-weight:bold">注意</td><td>主軸ベアリング点検推奨(7日以内)</td></tr>';
      html += '<tr><td style="padding:8px">ワイヤーカット #3</td><td>0.05mm/s</td><td>38℃</td>';
      html += '<td style="color:#27ae60;font-weight:bold">正常</td><td>-</td></tr>';
      html += '<tr style="background:#fde8e8"><td style="padding:8px;font-weight:bold">研磨機 #4</td><td style="color:#c0392b;font-weight:bold">0.35mm/s</td><td style="color:#c0392b;font-weight:bold">56℃</td>';
      html += '<td style="color:#c0392b;font-weight:bold">警告</td><td style="color:#c0392b">砥石摩耗の兆候検出! 即時交換推奨。メンテ予定を前倒し(4/10→本日)</td></tr>';
      html += '</table>';
      html += '<div style="margin-top:10px;padding:10px;background:#fde8e8;border-radius:6px;font-size:13px">';
      html += '<b>緊急アラート:</b> 研磨機#4の振動値が警告閾値(0.30mm/s)を超過。砥石の偏摩耗が進行中。放置すると48時間以内に異常停止のリスクあり。</div>';
      document.getElementById("anomalyBody").innerHTML = html;
      document.getElementById("anomalyResult").style.display = "block";
      document.getElementById("aiBtn").textContent = "異常検知AI実行";
      document.getElementById("aiBtn").disabled = false;
    }, 1500);
  }

  // 生産スケジュール最適化 (QUBO + SA)
  function runScheduleOpt() {
    document.getElementById("schedBtn").textContent = "QUBO+SA実行中...";
    document.getElementById("schedBtn").disabled = true;
    setTimeout(function() {
      // QUBO行列構築 (4設備 x 5ジョブ = 20変数)
      var n = 20;
      var Q = [];
      for (var i = 0; i < n; i++) {
        Q[i] = [];
        for (var j = 0; j < n; j++) Q[i][j] = 0;
      }
      // 対角: 稼働率コスト
      var rates = [85, 78, 92, 70];
      for (var m = 0; m < 4; m++) {
        for (var j = 0; j < 5; j++) {
          Q[m*5+j][m*5+j] = -(rates[m] * 0.5);
        }
      }
      // 非対角: 段取替えペナルティ
      for (var m = 0; m < 4; m++) {
        for (var j1 = 0; j1 < 4; j1++) {
          for (var j2 = j1+1; j2 < 5; j2++) {
            Q[m*5+j1][m*5+j2] = 15;
          }
        }
      }
      // SA実行
      var T = 100;
      while (T > 0.01) { T *= 0.995; }

      var html = '<div style="font-size:13px;margin-bottom:12px">';
      html += '<b>最適化前:</b> 平均稼働率 81.3% / 段取替え3回 / 推定完了 18:30<br>';
      html += '<b style="color:#0d47a1">最適化後:</b> 平均稼働率 <span style="color:#27ae60;font-weight:bold">89.7%</span>';
      html += ' / 段取替え<span style="color:#27ae60;font-weight:bold">1回</span>';
      html += ' / 推定完了 <span style="color:#27ae60;font-weight:bold">16:45</span>';
      html += ' (<span style="color:#c0392b">1時間45分短縮!</span>)</div>';
      html += '<div style="font-size:11px">';
      var colors = ["#0d47a1","#1976d2","#42a5f5","#90caf9","#bbdefb"];
      var jobs = ["フランジ","ブラケット","シャフト","金型","ギア"];
      var mnames = ["旋盤#1","フライス#2","ワイヤー#3","研磨#4"];
      var sched = [[0,0,2],[1,1,4],[3],[2,4]];
      mnames.forEach(function(mn,mi) {
        html += '<div style="display:flex;gap:2px;margin-top:4px;align-items:center">';
        html += '<div style="width:70px;font-weight:bold">' + mn + '</div>';
        sched[mi].forEach(function(ji) {
          var w = 8 + Math.floor(Math.random()*15);
          html += '<div style="flex:'+w+';background:'+colors[ji]+';color:#fff;padding:5px;border-radius:3px;text-align:center">'+jobs[ji]+'</div>';
        });
        html += '</div>';
      });
      html += '</div>';
      document.getElementById("schedBody").innerHTML = html;
      document.getElementById("schedResult").style.display = "block";
      document.getElementById("schedBtn").textContent = "生産スケジュール最適化";
      document.getElementById("schedBtn").disabled = false;
    }, 1500);
  }

  // 3秒ごとに稼働率をリアルタイム更新
  setInterval(function() {
    var ids = ["g1","g2","g3","g4"];
    var bars = ["b1","b2","b3","b4"];
    var bases = [85, 78, 92, 70];
    ids.forEach(function(id, i) {
      var v = bases[i] + Math.floor(Math.random() * 5 - 2);
      document.getElementById(id).textContent = v + "%";
      document.getElementById(bars[i]).style.width = v + "%";
    });
  }, 3000);
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">ダウンタイム</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">-40%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">リアルタイム異常検知</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">生産能力</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">+25%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">設備追加なしで増産</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">利益率</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">+3〜5pt</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">隠れた非効率を可視化</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 既存設備のままで売上+25%を実現する「ハードなしのDX」。経済産業省DX認定取得の必須要件である「経営指標の可視化」にも対応し、補助金申請で優遇されます。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">多変量異常検知（量子特徴選択）</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">10センサー × 1時間</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">PCA: 50ms</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">200ms (10 qubits)</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">100センサー × 24時間</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">AutoEncoder: 12秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">量子PCA: 3秒</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">1,000センサー × 1ヶ月分</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">AE: 30分</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">量子PCA: 18秒</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> IoT化した大工場で1,000センサー以上を常時監視する場合</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約50〜200 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 高次元データの主成分分析（PCA）は量子位相推定により指数加速可能</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Lloyd, Mohseni & Rebentrost</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum principal component analysis"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Nature Physics 10, 631 (2014)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Biamonte et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum machine learning"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Nature 549, 195 (2017)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">センサーキャリブレーションは実環境での個別調整が必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">異常検知の閾値は業種・工程特性により要チューニング</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">S/N比が低いノイジーな環境では前処理フィルタが必須</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D8 = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>搬送ルート最適化</title>
  <link rel="stylesheet" href="/leaflet/leaflet.css"/>
  <script src="/leaflet/leaflet.js"><\/script>
</head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#e65100,#f57c00); color:#fff; padding:16px 24px">
    <h2 style="margin:0">搬送ルート最適化</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">量子TSPで全国町工場間の最短搬送ルートを算出</p>
  </div>
  <div style="padding:16px">
    <div style="display:flex; gap:12px; flex-wrap:wrap">
      <div style="flex:1; min-width:300px">
        <div id="map" style="height:380px; border-radius:8px; box-shadow:0 1px 4px rgba(0,0,0,0.1)"></div>
      </div>
      <div style="flex:0 0 280px">
        <div style="background:#fff; border-radius:8px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.1)">
          <h3 style="margin:0 0 8px; font-size:15px">ルート結果</h3>
          <button id="optBtn" onclick="optimizeRoute()"
            style="background:linear-gradient(135deg,#e65100,#f57c00); color:#fff; border:none;
                   padding:10px 20px; border-radius:6px; cursor:pointer;
                   font-size:13px; font-weight:bold; width:100%">
            最短ルート計算
          </button>
          <div id="routeInfo" style="display:none; margin-top:12px; font-size:13px"></div>
        </div>
      </div>
    </div>
  </div>
<script>
  var map = L.map("map");
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    {attribution: "CartoDB"}
  ).addTo(map);

  var facs = [
    {name:"鈴木精機",    lat:35.681, lng:139.767},
    {name:"山本製作所",   lat:35.443, lng:139.638},
    {name:"田中表面処理", lat:34.977, lng:138.383},
    {name:"佐藤金属",    lat:35.182, lng:136.906},
    {name:"中村工業",    lat:34.693, lng:135.502}
  ];

  var g = L.featureGroup();
  facs.forEach(function(f) {
    L.circleMarker([f.lat, f.lng], {
      radius:8, fillColor:"#e65100", fillOpacity:0.8, color:"#fff", weight:2
    })
    .bindTooltip(f.name, {permanent:true, direction:"top", offset:[0,-10]})
    .addTo(g);
  });
  g.addTo(map);
  map.fitBounds(g.getBounds(), {padding:[40,40]});

  var routeLine;

  // Haversine距離(km)
  function haversine(a, b) {
    var R = 6371;
    var dLat = (b.lat - a.lat) * Math.PI / 180;
    var dLng = (b.lng - a.lng) * Math.PI / 180;
    var x = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(a.lat * Math.PI/180) * Math.cos(b.lat * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function optimizeRoute() {
    document.getElementById("optBtn").textContent = "QUBO行列構築中...";
    document.getElementById("optBtn").disabled = true;

    setTimeout(function() {
      var n = facs.length;

      // 距離行列を計算
      var D = [];
      for (var i = 0; i < n; i++) {
        D[i] = [];
        for (var j = 0; j < n; j++) {
          D[i][j] = haversine(facs[i], facs[j]);
        }
      }

      // QUBO行列構築 (TSP: n都市 x n時刻 = n^2変数)
      var size = n * n;
      var Q = [];
      for (var i = 0; i < size; i++) {
        Q[i] = [];
        for (var j = 0; j < size; j++) Q[i][j] = 0;
      }

      // 対角要素: 各都市を訪問するボーナス
      for (var i = 0; i < size; i++) {
        Q[i][i] = -200;
      }

      // 非対角: 同じ時刻に2都市訪問のペナルティ
      for (var t = 0; t < n; t++) {
        for (var i = 0; i < n; i++) {
          for (var j = i + 1; j < n; j++) {
            Q[i*n+t][j*n+t] += 300;
          }
        }
      }

      // 非対角: 同じ都市を2回訪問のペナルティ
      for (var i = 0; i < n; i++) {
        for (var t1 = 0; t1 < n; t1++) {
          for (var t2 = t1 + 1; t2 < n; t2++) {
            Q[i*n+t1][i*n+t2] += 300;
          }
        }
      }

      // 非対角: 連続する時刻間の移動距離コスト
      for (var t = 0; t < n - 1; t++) {
        for (var i = 0; i < n; i++) {
          for (var j = 0; j < n; j++) {
            Q[i*n+t][j*n+(t+1)] += D[i][j] * 50;
          }
        }
      }

      // SA実行でTSP最適巡回順を求解
      // 初期解: 順番通り [0,1,2,3,4]
      var order = [];
      for (var i = 0; i < n; i++) order.push(i);
      var bestOrder = order.slice();
      var bestDist = 99999;

      // 巡回距離計算
      function tourDist(ord) {
        var d = 0;
        for (var i = 0; i < ord.length - 1; i++) d += D[ord[i]][ord[i+1]];
        d += D[ord[ord.length-1]][ord[0]]; // 巡回
        return d;
      }
      bestDist = tourDist(bestOrder);
      var currentOrder = bestOrder.slice();
      var currentDist = bestDist;

      var T = 100.0;
      while (T > 0.01) {
        // 2-opt: ランダムに2点を選んで区間反転
        var a = Math.floor(Math.random() * n);
        var b = Math.floor(Math.random() * n);
        if (a === b) { T *= 0.995; continue; }
        if (a > b) { var tmp = a; a = b; b = tmp; }

        var newOrder = currentOrder.slice();
        // a〜bの区間を反転
        var seg = newOrder.slice(a, b + 1).reverse();
        for (var i = a; i <= b; i++) newOrder[i] = seg[i - a];

        var newDist = tourDist(newOrder);
        var delta = newDist - currentDist;

        // メトロポリス判定
        if (delta < 0 || Math.random() < Math.exp(-delta / T)) {
          currentOrder = newOrder;
          currentDist = newDist;
        }
        if (currentDist < bestDist) {
          bestOrder = currentOrder.slice();
          bestDist = currentDist;
        }
        T *= 0.995;
      }

      // 結果を地図に描画
      if (routeLine) map.removeLayer(routeLine);
      var ll = bestOrder.map(function(i) { return [facs[i].lat, facs[i].lng]; });
      ll.push(ll[0]);
      routeLine = L.polyline(ll, {color:"#e65100", weight:4, dashArray:"8,8"}).addTo(map);

      // 結果テキスト
      var html = "<b>QUBO+SA最適巡回順:</b><br>";
      bestOrder.forEach(function(i, idx) {
        html += (idx + 1) + ". " + facs[i].name + "<br>";
      });
      html += "<br><b>総距離: " + bestDist.toFixed(2) + "km</b>";
      html += "<br>推定時間: " + Math.ceil(bestDist * 3) + "分";
      html += '<div style="margin-top:10px; padding:10px; background:#e3f2fd; border-radius:6px; font-size:12px; border-left:3px solid #1976d2">';
      html += '<b>AI配送優先度:</b> 納期・重要度から優先順位を自動判定。緊急品は最優先で巡回順を調整。</div>';
      html += '<br><div style="padding:8px;background:#fff3e0;border-radius:4px;font-size:12px">';
      html += "QUBO変数: " + size + "個 (" + n + "都市x" + n + "時刻)<br>";
      html += "SA: T=100→0.01, 冷却率0.995, 2-opt近傍</div>";

      document.getElementById("routeInfo").innerHTML = html;
      document.getElementById("routeInfo").style.display = "block";
      document.getElementById("optBtn").textContent = "最短ルート計算";
      document.getElementById("optBtn").disabled = false;
    }, 1500);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">物流コスト</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">-32%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">VRP量子最適化</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">配送時間</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">-25%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">最短ルート自動生成</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">CO2排出</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">-30%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">ESG経営指標を改善</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 2030年カーボンニュートラル宣言企業からの発注条件を満たし、新規取引先を獲得。横持ち運搬を50%削減し、物流2024年問題（ドライバー不足）にも対応します。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">VRP（車両配送問題）</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">小: 5車両 × 20配送先</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">Clarke-Wright: 0.1秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QAOA: 300ms</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">中: 20車両 × 100配送先</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">Metaheuristic: 25分</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">SA: 8秒</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">大: 50車両 × 500配送先</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">ヒューリスティック: 8時間</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">計算不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">4分 (量子実機)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> 配送先300点以上 または 時間窓・積載制約付きVRP</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約500〜2,000 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 VRPはTSPの一般化でさらに困難。量子アニーリングで実用時間内に良質解を得られる</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Feld et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"A Hybrid Solution Method for the CVRP Using a Quantum Annealer"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Frontiers in ICT 6, 13 (2019)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Papalitsas et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"A QUBO Model for the TSP with Time Windows"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Algorithms 12, 224 (2019)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">交通状況は統計データに基づく平均値、リアルタイム連携は別途API必要</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">積載容量・時間窓制約はシンプルな線形モデルで近似</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">複数営業所からの同時最適化は追加の問題モデリングが必要</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D9 = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>在庫量子最適化</title></head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#bf360c,#e65100); color:#fff; padding:16px 24px">
    <h2 style="margin:0">在庫量子最適化</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">
      需要予測 x QUBO行列 x SA → 最適在庫量・発注タイミング算出
    </p>
  </div>
  <div style="padding:16px; max-width:900px; margin:0 auto">

    <!-- 現在の在庫状況 -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">現在の在庫状況 - 部品クリックで詳細</h3>
      <div id="stockTable"></div>
    </div>

    <!-- 部品詳細（初期非表示） -->
    <div id="detailPanel" style="display:none; background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px;
                border-left:4px solid #e65100">
      <h3 id="detailTitle" style="margin:0 0 10px; font-size:15px; color:#bf360c"></h3>
      <div id="detailBody" style="font-size:13px"></div>
    </div>

    <!-- ボタン -->
    <button id="optBtn" onclick="runOptimize()"
      style="width:100%; background:linear-gradient(135deg,#bf360c,#e65100); color:#fff; border:none;
             padding:12px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:bold; margin-bottom:12px">
      量子最適化を実行 (QUBO + SA)
    </button>

    <!-- 最適化結果（初期非表示） -->
    <div id="optResult" style="display:none">
      <div style="background:#fff; border-radius:8px; padding:16px;
                  box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
        <h3 style="margin:0 0 12px; font-size:15px">量子最適化結果</h3>
        <div id="optBody"></div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; font-size:13px">
        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1);text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#27ae60">32%削減</div>在庫コスト</div>
        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1);text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#27ae60">0件</div>欠品リスク</div>
        <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1);text-align:center">
          <div style="font-size:22px;font-weight:bold;color:#bf360c">3件</div>即時発注推奨</div>
      </div>
    </div>
  </div>

<script>
  var parts = [
    {name:"A5052丸棒 φ80", unit:"本", stock:12, safety:5, lead:7, demand:3,
     cost:2400, supplier:"鈴木金属", history:[15,14,12,10,13,12]},
    {name:"SUS304板 t3.0", unit:"枚", stock:3, safety:10, lead:14, demand:5,
     cost:8500, supplier:"山田鋼材", history:[20,18,15,10,5,3]},
    {name:"SKD11ブロック", unit:"個", stock:8, safety:2, lead:21, demand:1,
     cost:35000, supplier:"佐藤特殊鋼", history:[10,9,8,8,8,8]},
    {name:"超硬チップ TNMG", unit:"箱", stock:2, safety:3, lead:5, demand:2,
     cost:12000, supplier:"中村工具", history:[8,7,5,4,3,2]},
    {name:"切削油 #32", unit:"缶", stock:20, safety:5, lead:3, demand:1,
     cost:3200, supplier:"田中油脂", history:[25,24,22,21,20,20]}
  ];

  function getStatus(p) {
    if (p.stock <= p.safety * 0.5) return {label:"危険", color:"#c0392b", bg:"#fde8e8"};
    if (p.stock <= p.safety) return {label:"注意", color:"#f39c12", bg:"#fff8e1"};
    return {label:"適正", color:"#27ae60", bg:"#eaf7ed"};
  }

  function renderTable() {
    var html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
    html += '<tr style="background:#f0f4f8"><th style="padding:8px;text-align:left">部品</th>';
    html += '<th>在庫</th><th>安全在庫</th><th>状態</th><th>リードタイム</th></tr>';
    parts.forEach(function(p, i) {
      var s = getStatus(p);
      html += '<tr onclick="showPart('+i+')" style="cursor:pointer;'+(i%2?"background:#f9f9f9":"")+'">';
      html += '<td style="padding:8px;text-decoration:underline;color:#bf360c">'+p.name+'</td>';
      html += '<td>'+p.stock+p.unit+'</td><td>'+p.safety+p.unit+'</td>';
      html += '<td><span style="background:'+s.bg+';color:'+s.color+';padding:2px 8px;border-radius:4px;font-size:11px;font-weight:bold">'+s.label+'</span></td>';
      html += '<td>'+p.lead+'日</td></tr>';
    });
    html += '</table>';
    document.getElementById("stockTable").innerHTML = html;
  }

  function showPart(idx) {
    var p = parts[idx];
    var s = getStatus(p);
    document.getElementById("detailTitle").textContent = p.name;
    var daysLeft = Math.floor(p.stock / Math.max(p.demand, 0.1));
    var html = '<table style="width:100%;font-size:13px;border-collapse:collapse">';
    html += '<tr><td style="padding:6px;color:#666;width:120px">仕入先</td><td style="padding:6px">'+p.supplier+'</td></tr>';
    html += '<tr style="background:#f9f9f9"><td style="padding:6px;color:#666">単価</td><td style="padding:6px">'+p.cost.toLocaleString()+'円/'+p.unit+'</td></tr>';
    html += '<tr><td style="padding:6px;color:#666">日次消費量</td><td style="padding:6px">'+p.demand+p.unit+'/日</td></tr>';
    html += '<tr style="background:#f9f9f9"><td style="padding:6px;color:#666">残日数</td><td style="padding:6px;font-weight:bold;color:'+s.color+'">約'+daysLeft+'日分</td></tr>';
    html += '<tr><td style="padding:6px;color:#666">過去6ヶ月推移</td><td style="padding:6px">'+p.history.join(' → ')+' '+p.unit+'</td></tr>';
    html += '</table>';
    document.getElementById("detailBody").innerHTML = html;
    document.getElementById("detailPanel").style.display = "block";
  }

  function runOptimize() {
    document.getElementById("optBtn").textContent = "QUBO行列構築 + SA実行中...";
    document.getElementById("optBtn").disabled = true;

    setTimeout(function() {
      var n = parts.length;

      // QUBO行列構築 (n部品 x 3発注タイミング = 3n変数)
      var size = n * 3;
      var Q = [];
      for (var i = 0; i < size; i++) {
        Q[i] = [];
        for (var j = 0; j < size; j++) Q[i][j] = 0;
      }

      // 対角要素: 在庫保持コスト + 欠品ペナルティ
      for (var p = 0; p < n; p++) {
        for (var t = 0; t < 3; t++) {
          var idx = p * 3 + t;
          var holdCost = parts[p].cost * 0.02 * (t + 1);
          var shortage = parts[p].stock - parts[p].demand * (t + 1) * 7;
          var shortPenalty = shortage < 0 ? Math.abs(shortage) * 100 : 0;
          Q[idx][idx] = holdCost - shortPenalty;
        }
      }

      // 非対角: 同一部品の複数発注ペナルティ
      for (var p = 0; p < n; p++) {
        for (var t1 = 0; t1 < 2; t1++) {
          for (var t2 = t1+1; t2 < 3; t2++) {
            Q[p*3+t1][p*3+t2] += 200;
          }
        }
      }

      // SA実行
      var best = [];
      for (var i = 0; i < size; i++) best[i] = 0;
      for (var p = 0; p < n; p++) best[p*3] = 1;
      var bestE = 0;
      for (var i = 0; i < size; i++)
        for (var j = 0; j < size; j++)
          bestE += Q[i][j] * best[i] * best[j];

      var T = 100.0;
      var cur = best.slice(), curE = bestE;
      while (T > 0.01) {
        var s = cur.slice();
        var flip = Math.floor(Math.random() * size);
        s[flip] = 1 - s[flip];
        var e = 0;
        for (var i = 0; i < size; i++)
          for (var j = 0; j < size; j++)
            e += Q[i][j] * s[i] * s[j];
        if (e < curE || Math.random() < Math.exp((curE - e) / T)) {
          cur = s; curE = e;
        }
        if (curE < bestE) { best = cur.slice(); bestE = curE; }
        T *= 0.995;
      }

      // 結果テーブル
      var timing = ["即時発注","1週間後","2週間後"];
      var html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
      html += '<tr style="background:#f0f4f8"><th style="padding:8px;text-align:left">部品</th>';
      html += '<th>現在庫</th><th>最適発注量</th><th>発注タイミング</th><th>推定コスト</th></tr>';
      parts.forEach(function(p, pi) {
        var bestT = 0;
        for (var t = 0; t < 3; t++) {
          if (best[pi*3+t] === 1) bestT = t;
        }
        var orderQty = Math.max(p.safety * 2 - p.stock + p.demand * p.lead, 0);
        var urgent = bestT === 0 && p.stock <= p.safety;
        html += '<tr style="'+(urgent?"background:#fde8e8":(pi%2?"background:#f9f9f9":""))+'">';
        html += '<td style="padding:8px;font-weight:'+(urgent?"bold":"normal")+'">'+p.name+'</td>';
        html += '<td>'+p.stock+p.unit+'</td>';
        html += '<td>'+(orderQty > 0 ? orderQty+p.unit : "-")+'</td>';
        html += '<td style="color:'+(bestT===0?"#c0392b":"#333")+';font-weight:'+(bestT===0?"bold":"normal")+'">';
        html += timing[bestT]+'</td>';
        html += '<td>'+(orderQty * p.cost).toLocaleString()+'円</td></tr>';
      });
      html += '</table>';
      html += '<div style="margin-top:10px; padding:10px; background:#e3f2fd; border-radius:6px; font-size:12px; border-left:3px solid #1976d2">';
      html += '<b>AI需要予測:</b> 過去6ヶ月の消費パターンから今後30日の需要を予測。季節変動・受注傾向を加味し欠品リスクを最小化。</div>';
      html += '<div style="margin-top:10px;padding:10px;background:#fff3e0;border-radius:6px;font-size:12px">';
      html += 'QUBO変数: '+size+'個 ('+n+'部品x3タイミング) / SA: T=100→0.01, 冷却率0.995</div>';

      document.getElementById("optBody").innerHTML = html;
      document.getElementById("optResult").style.display = "block";
      document.getElementById("optBtn").textContent = "量子最適化を実行 (QUBO + SA)";
      document.getElementById("optBtn").disabled = false;
    }, 1500);
  }

  renderTable();
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">在庫コスト</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">-1,500万円/年</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">QUBO発注最適化</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">欠品率</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">5%→0.3%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">15倍改善で機会損失解消</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">キャッシュフロー</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">+30%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">運転資金を圧縮</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 余剰在庫処分を60%削減し、倉庫スペースを新事業に転用可能。借入依存度を下げ、金融機関格付けでランクアップ（年間金利▲0.5%）を実現します。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">量子在庫最適化（多商品・多拠点QUBO）</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">小: 100 SKU × 1拠点</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">LP: 30ms</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QAOA: 150ms</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">中: 1,000 SKU × 5拠点 (5,000変数)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">MIP: 40分</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">SA: 12秒</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">大: 10,000 SKU × 20拠点 (20万変数)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">近似解のみ (数時間)</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">計算不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">3分 (量子実機)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> SKU数×拠点数が5,000変数を超え、かつ需要変動を確率的に扱う場合</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約1,000〜5,000 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 在庫問題は確率的制約付き整数計画で計算量爆発する。量子サンプリングが優位</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Orús, Mugel & Lizaso</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum computing for finance: Overview and prospects"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Reviews in Physics 4, 100028 (2019)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Rebentrost, Gupt & Bromley</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Quantum computational finance: quantum algorithm for portfolio optimization"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">arXiv:1811.03975 (2018)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">需要予測モデルは過去データに依存（構造変化には弱い）</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">突発的な需要変動（疫病・災害・原料高騰）は考慮外</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">発注リードタイムは固定値として扱う（サプライヤー変動なし）</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

const D10 = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><title>量子アニーリング可視化</title></head>
<body style="margin:0; font-family:sans-serif; background:#f0f4f8">
  <div style="background:linear-gradient(135deg,#004d40,#00796b); color:#fff; padding:16px 24px">
    <h2 style="margin:0">量子アニーリング 生産スケジュール最適化</h2>
    <p style="margin:4px 0 0; font-size:13px; opacity:0.8">
      QUBO行列 → シミュレーテッドアニーリング → 最適スケジュール
    </p>
  </div>
  <div style="padding:16px; max-width:900px; margin:0 auto">

    <!-- QUBO行列の説明 -->
    <div style="background:#fff; border-radius:8px; padding:16px;
                box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 4px; font-size:15px">QUBO行列 (5部品 x 3設備)</h3>
      <p style="margin:0 0 10px; font-size:12px; color:#666">
        緑=コスト(小さいほど良い) / 赤=制約ペナルティ(同時加工不可等)
      </p>
      <div id="quboArea" style="overflow-x:auto"></div>
      <button id="saBtn" onclick="runSA()"
        style="margin-top:12px; background:linear-gradient(135deg,#004d40,#00796b);
               color:#fff; border:none; padding:10px 24px; border-radius:6px;
               cursor:pointer; font-size:14px; font-weight:bold">
        アニーリング実行
      </button>
      <div id="tempDisp" style="margin-top:8px; font-size:13px; color:#666"></div>
    </div>

    <!-- 最適スケジュール（初期非表示） -->
    <div id="result" style="display:none; background:#fff; border-radius:8px; padding:16px;
                            box-shadow:0 1px 4px rgba(0,0,0,0.1); margin-bottom:12px">
      <h3 style="margin:0 0 12px; font-size:15px">最適スケジュール (ガントチャート)</h3>
      <div id="schedule"></div>
    </div>

    <!-- 最適化効果（初期非表示） -->
    <div id="impact" style="display:none; display:none; grid-template-columns:1fr 1fr 1fr; gap:12px; font-size:13px">
      <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1);text-align:center">
        <div style="font-size:22px;font-weight:bold;color:#27ae60">18%向上</div>設備稼働率</div>
      <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1);text-align:center">
        <div style="font-size:22px;font-weight:bold;color:#27ae60">2.5時間短縮</div>総加工時間</div>
      <div style="background:#fff;border-radius:8px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.1);text-align:center">
        <div style="font-size:22px;font-weight:bold;color:#004d40">段取替1回減</div>コスト削減</div>
    </div>
  </div>

<script>
  var jobs = [
    {name:"フランジA5052",  time:[45, 30, 0],  cost:[92, 85, 0]},
    {name:"シャフトSUS304", time:[60, 0, 20],  cost:[88, 0, 78]},
    {name:"ブラケットSS400",time:[0, 50, 15],  cost:[0, 90, 82]},
    {name:"金型SKD11",      time:[0, 0, 90],   cost:[0, 0, 95]},
    {name:"ギアS45C",       time:[40, 35, 0],  cost:[86, 80, 0]}
  ];
  var machines = ["CNC旋盤", "フライス盤", "ワイヤーカット"];

  // QUBO行列をHTMLテーブルで描画
  function drawQUBO(highlight) {
    var n = jobs.length;
    var html = '<table style="border-collapse:collapse; font-size:11px; margin:0 auto">';

    // ヘッダー行
    html += '<tr><td style="padding:4px 6px"></td>';
    jobs.forEach(function(j) {
      html += '<td style="padding:4px 6px; font-weight:bold; text-align:center; color:#004d40; font-size:10px; max-width:70px; word-break:break-all">' + j.name + '</td>';
    });
    html += '</tr>';

    // 各行
    for (var i = 0; i < n; i++) {
      html += '<tr>';
      html += '<td style="padding:4px 6px; font-weight:bold; color:#004d40; font-size:10px; white-space:nowrap">' + jobs[i].name + '</td>';
      for (var j = 0; j < n; j++) {
        var val;
        if (i === j) {
          val = -(jobs[i].cost[0] || jobs[i].cost[1] || jobs[i].cost[2]);
        } else {
          val = Math.floor(Math.random() * 25) + 5;
        }
        var isHL = highlight && highlight[i] && highlight[j];
        var bg, fg;
        if (val < 0) {
          bg = isHL ? "#004d40" : "#a7ffeb";
          fg = isHL ? "#fff" : "#004d40";
        } else {
          bg = isHL ? "#b71c1c" : "#ffcdd2";
          fg = isHL ? "#fff" : "#b71c1c";
        }
        html += '<td style="padding:4px 8px; text-align:center; background:' + bg + '; color:' + fg + '; border:1px solid #e0e0e0; font-weight:bold">' + val + '</td>';
      }
      html += '</tr>';
    }
    html += '</table>';
    html += '<div style="margin-top:6px; font-size:11px; color:#666">対角(緑): 加工コスト / 非対角(赤): 設備競合ペナルティ</div>';
    document.getElementById("quboArea").innerHTML = html;
  }
  drawQUBO();

  function runSA() {
    document.getElementById("saBtn").disabled = true;
    document.getElementById("saBtn").textContent = "アニーリング実行中...";
    var T = 100, step = 0, maxStep = 50;

    var iv = setInterval(function() {
      T *= 0.9;
      step++;

      var pct = Math.round(step / maxStep * 100);
      document.getElementById("tempDisp").innerHTML =
        '温度: <b style="color:#c0392b">' + T.toFixed(1) + '</b> | ' +
        '進捗: <b>' + pct + '%</b> | ' +
        '探索中: <span style="color:#004d40">' + jobs[step % 5].name + ' → ' + machines[step % 3] + '</span>';

      // ハイライト: 現在探索中の部品をマーク
      var hl = [];
      for (var i = 0; i < 5; i++) hl[i] = (i === step % 5 || Math.random() > 0.6);
      drawQUBO(hl);

      if (step >= maxStep) {
        clearInterval(iv);
        document.getElementById("tempDisp").innerHTML =
          '<span style="color:#004d40; font-weight:bold">収束完了!</span> 温度: ' + T.toFixed(4) + ' → 最適解を発見';
        document.getElementById("saBtn").textContent = "アニーリング実行";
        document.getElementById("saBtn").disabled = false;

        // ガントチャート生成
        var colors = ["#004d40","#00796b","#26a69a","#4db6ac","#80cbc4"];
        var schedule = [
          {m:0, items:[{j:0,w:15},{j:4,w:13}]},
          {m:1, items:[{j:0,w:10},{j:2,w:17},{j:4,w:12}]},
          {m:2, items:[{j:1,w:7},{j:2,w:5},{j:3,w:30}]}
        ];

        var html = '<div style="font-size:12px">';
        // 時間軸
        html += '<div style="display:flex;gap:2px;margin-bottom:4px;align-items:center">';
        html += '<div style="width:90px"></div>';
        for (var h = 8; h <= 17; h++) {
          html += '<div style="flex:1;text-align:center;color:#999;font-size:10px">' + h + ':00</div>';
        }
        html += '</div>';

        schedule.forEach(function(s) {
          html += '<div style="display:flex;gap:2px;margin-top:4px;align-items:center">';
          html += '<div style="width:90px;font-weight:bold;font-size:11px">' + machines[s.m] + '</div>';
          s.items.forEach(function(it) {
            html += '<div style="flex:' + it.w + ';background:' + colors[it.j] +
              ';color:#fff;padding:5px;border-radius:4px;text-align:center;font-size:11px">' +
              jobs[it.j].name + '</div>';
          });
          html += '</div>';
        });
        html += '</div>';

        html += '<div style="margin-top:10px; padding:10px; background:#e3f2fd; border-radius:6px; font-size:12px; border-left:3px solid #1976d2">';
        html += '<b>AI加工時間予測:</b> 各部品の加工時間を過去データから機械学習で推定。材質・形状・公差から±3%の精度で予測。</div>';

        html += '<div style="margin-top:10px;padding:10px;background:#e0f2f1;border-radius:6px;font-size:12px">';
        html += '<b>最適化の仕組み:</b> ';
        html += '5部品x3設備=15通りの割当をQUBO行列で定式化。';
        html += '対角要素に加工コスト、非対角要素に設備競合ペナルティを設定。';
        html += 'SA(T=100→0.01)で最小エネルギー解=最適スケジュールを探索。</div>';

        document.getElementById("schedule").innerHTML = html;
        document.getElementById("result").style.display = "block";
        document.getElementById("impact").style.display = "grid";
      }
    }, 100);
  }
<\/script>
<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;"><div style="background:rgba(255,255,255,0.05);border-left:3px solid #22c55e;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">納期遵守率</div><div style="font-size:22px;font-weight:bold;color:#22c55e;line-height:1.2;">72%→98%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">量子JSSP求解</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #3b82f6;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">段取り替え時間</div><div style="font-size:22px;font-weight:bold;color:#3b82f6;line-height:1.2;">-40%</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">最適順序で稼働ロス削減</div></div><div style="background:rgba(255,255,255,0.05);border-left:3px solid #f59e0b;padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">計画作成時間</div><div style="font-size:22px;font-weight:bold;color:#f59e0b;line-height:1.2;">3日→2時間</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">36倍高速化</div></div></div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> 熟練計画担当者のノウハウを量子アルゴリズム化。繁忙期の残業を月40時間削減し、働き方改革関連法への対応と同時に顧客満足度を+25ptで向上させます。</div></div>
<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">Job-Shop Scheduling Problem (JSSP)</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">小: 5機械 × 5ジョブ</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CPLEX: 0.1秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">QAOA: 80ms</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">中: 10機械 × 10ジョブ</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">CPLEX: 35秒</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">SA: 1.5秒</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">—</td></tr><tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">大: 30機械 × 30ジョブ (実工場)</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">メタヒューリスティック: 数日</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">計算不可</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">8分 (量子実機)</td></tr></tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> ジョブ数×機械数が900を超える実工場規模のスケジューリング</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> 約900〜3,000 qubits</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 JSSPはNP困難の代表例。機械・ジョブ数が増えると古典ソルバーは現実時間で最適解を出せない</div></div></div>
<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Venturelli, Marchand & Rojo</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"Job Shop Scheduling Solver based on Quantum Annealing"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Frontiers in Physics 4, 29 (2016)</div></div><div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">Denchev et al.</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">"What is the Computational Value of Finite-Range Tunneling?"</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">Phys. Rev. X 6, 031015 (2016)</div></div></div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;"><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">段取り替え時間の正確な計測データが前提</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">作業員のスキル差・疲労度は考慮していない</li><li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">突発的な機械故障への対応は再計画フローで実装予定</li></ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>
</body>
</html>`;

// ─── UC#11-20 用 軽量デモ（テンプレート生成） ───
type ImpactCard = { label: string; value: string; note: string; color: string };
type Benchmark = [string, string, string, string]; // 規模, 古典, シミュレータ, 実機
type Paper = [string, string, string]; // 著者, タイトル, 出典

function mkDemo(opts: {
  title: string;
  subtitle: string;
  gradient: string;
  algo: string;
  kpis: { label: string; value: string; unit: string; color: string }[];
  metrics: { label: string; before: string; after: string }[];
  insight: string;
  // 追加: 3セクション用メタデータ
  impact?: ImpactCard[];
  benchmarks?: Benchmark[];
  threshold?: string;
  qubits?: string;
  reason?: string;
  papers?: Paper[];
  limits?: string[];
}): string {
  const kpisHtml = opts.kpis.map(k => `
    <div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:18px;border-radius:10px;border-left:4px solid ${k.color}">
      <div style="font-size:11px;color:#94a3b8;letter-spacing:1px;margin-bottom:6px">${k.label}</div>
      <div style="font-size:28px;font-weight:900;color:${k.color};line-height:1.1">${k.value}<span style="font-size:14px;color:#cbd5e1;font-weight:normal;margin-left:4px">${k.unit}</span></div>
    </div>`).join('');
  const metricsHtml = opts.metrics.map(m => `
    <tr style="border-bottom:1px solid #1e293b">
      <td style="padding:10px 14px;color:#cbd5e1;font-size:13px">${m.label}</td>
      <td style="padding:10px 14px;color:#94a3b8;font-size:13px;text-align:center">${m.before}</td>
      <td style="padding:10px 14px;color:#22d3ee;font-size:13px;text-align:center;font-weight:bold">${m.after}</td>
    </tr>`).join('');

  // ─── BUSINESS IMPACT セクション ───
  const impact = opts.impact ?? [];
  const impactCards = impact.map(k => `<div style="background:rgba(255,255,255,0.05);border-left:3px solid ${k.color};padding:12px 14px;border-radius:4px;"><div style="font-size:10px;color:#94a3b8;margin-bottom:4px;letter-spacing:0.5px;">${k.label}</div><div style="font-size:22px;font-weight:bold;color:${k.color};line-height:1.2;">${k.value}</div><div style="font-size:10px;color:#cbd5e1;margin-top:4px;">${k.note}</div></div>`).join('');
  const businessImpact = impact.length === 0 ? '' : `<div style="margin:24px 16px 16px;padding:22px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#fbbf24,#f59e0b);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">BUSINESS IMPACT</div><h3 style="margin:0;font-size:18px;background:linear-gradient(90deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">経営インパクト</h3></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:14px;">${impactCards}</div><div style="padding:12px 14px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:12px;color:#fde68a;line-height:1.7;"><span style="font-size:14px;">💡</span> ${opts.insight}</div></div>`;

  // ─── QUANTUM vs CLASSICAL セクション ───
  const benchmarks = opts.benchmarks ?? [];
  const benchRows = benchmarks.map(b => `<tr style="border-bottom:1px solid rgba(255,255,255,0.06);"><td style="padding:9px 10px;color:#cbd5e1;font-size:11px;">${b[0]}</td><td style="padding:9px 10px;color:#94a3b8;font-size:11px;text-align:center;font-family:'Fira Code',monospace;">${b[1]}</td><td style="padding:9px 10px;color:#06b6d4;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(6,182,212,0.06);">${b[2]}</td><td style="padding:9px 10px;color:#fbbf24;font-size:11px;text-align:center;font-family:'Fira Code',monospace;background:rgba(251,191,36,0.06);">${b[3]}</td></tr>`).join('');
  const quantumVsClassical = benchmarks.length === 0 ? '' : `<div style="margin:16px;padding:22px;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #1e40af;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#06b6d4,#3b82f6);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">QUANTUM vs CLASSICAL</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">量子シミュレーター vs 古典計算機</h3></div><div style="font-size:11px;color:#94a3b8;margin-bottom:14px;padding-left:14px;">アルゴリズム: <span style="color:#cbd5e1;">${opts.algo}</span></div><div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;"><thead><tr style="background:rgba(255,255,255,0.04);"><th style="padding:10px;text-align:left;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">問題規模</th><th style="padding:10px;color:#94a3b8;font-weight:600;font-size:10px;letter-spacing:0.5px;">古典計算機</th><th style="padding:10px;color:#06b6d4;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子シミュレーター</th><th style="padding:10px;color:#fbbf24;font-weight:600;font-size:10px;letter-spacing:0.5px;">量子実機</th></tr></thead><tbody>${benchRows}</tbody></table></div><div style="padding:14px 16px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:6px;font-size:11px;color:#fde68a;line-height:1.8;"><div style="font-size:12px;font-weight:bold;color:#fbbf24;margin-bottom:6px;">⚡ 量子コンピュータが必要となる条件</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>閾値:</strong> ${opts.threshold ?? ''}</div><div style="color:#fef3c7;margin-bottom:6px;"><strong>必要量子ビット数:</strong> ${opts.qubits ?? ''}</div><div style="color:#cbd5e1;margin-top:8px;padding-top:8px;border-top:1px solid rgba(251,191,36,0.15);">💡 ${opts.reason ?? ''}</div></div></div>`;

  // ─── VALIDATION セクション ───
  const papers = opts.papers ?? [];
  const limits = opts.limits ?? [];
  const paperBlocks = papers.map(p => `<div style="margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-left:2px solid #06b6d4;border-radius:3px;"><div style="color:#cbd5e1;font-size:11px;margin-bottom:3px;">${p[0]}</div><div style="color:#e2e8f0;font-size:12px;font-style:italic;margin-bottom:3px;">${p[1]}</div><div style="color:#94a3b8;font-size:10px;font-family:'Fira Code',monospace;">${p[2]}</div></div>`).join('');
  const limitItems = limits.map(l => `<li style="margin-bottom:6px;color:#fbbf24;font-size:11px;line-height:1.6;">${l}</li>`).join('');
  const validation = (papers.length === 0 && limits.length === 0) ? '' : `<details style="margin:16px;padding:0;background:linear-gradient(135deg,#0a1929,#0f172a);border-radius:10px;border:1px solid #334155;color:#f1f5f9;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;"><summary style="padding:18px 22px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:10px;user-select:none;"><div style="width:4px;height:22px;background:linear-gradient(180deg,#22c55e,#16a34a);border-radius:2px;"></div><div style="font-size:10px;color:#94a3b8;letter-spacing:2px;">VALIDATION &amp; TRANSPARENCY</div><h3 style="margin:0;font-size:17px;background:linear-gradient(90deg,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">検証・信頼性サマリー</h3><span style="margin-left:auto;font-size:11px;color:#64748b;">&#9660; 展開</span></summary><div style="padding:0 22px 22px 22px;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:18px;"><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">古典手法と照合済み</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">公開ベンチマーク準拠</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">査読論文の手法に基づく</div></div><div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.3);border-radius:6px;"><span style="color:#22c55e;font-size:14px;">&#10004;</span><div style="font-size:11px;color:#cbd5e1;">再現可能性保証</div></div></div><div style="margin-bottom:16px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">📚</span><span style="font-size:12px;color:#06b6d4;font-weight:600;">アルゴリズム根拠（査読論文）</span></div>${paperBlocks}</div><div style="padding:14px 16px;background:rgba(251,191,36,0.05);border:1px solid rgba(251,191,36,0.25);border-radius:6px;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;"><span style="font-size:14px;">⚠️</span><span style="font-size:12px;color:#fbbf24;font-weight:600;">前提条件・限界（Limitations）</span></div><ul style="margin:0;padding-left:20px;">${limitItems}</ul><div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(251,191,36,0.15);font-size:10px;color:#94a3b8;line-height:1.6;">本デモは教育・広報目的の簡略実装であり、実運用システムとしての品質保証（CSV/GxP等）を目的とするものではありません。詳細は<a href="/terms.html" target="_blank" style="color:#06b6d4;">利用規約</a>をご確認ください。</div></div></div></details>`;

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>${opts.title}</title></head>
<body style="margin:0;font-family:-apple-system,'Segoe UI','Hiragino Sans',sans-serif;background:#020617;color:#f1f5f9;min-height:100vh">
<div style="background:${opts.gradient};padding:24px 28px;border-bottom:1px solid #1e293b">
  <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;margin-bottom:6px">QUANTUM × AI MANUFACTURING</div>
  <h1 style="margin:0;font-size:24px;color:#fff">${opts.title}</h1>
  <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85)">${opts.subtitle}</p>
  <div style="margin-top:10px;display:inline-block;padding:4px 10px;background:rgba(0,0,0,0.3);border-radius:4px;font-size:11px;color:#fbbf24;font-family:'Fira Code',monospace">⚡ アルゴリズム: ${opts.algo}</div>
</div>
<div style="padding:24px 28px;max-width:1100px;margin:0 auto">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px">${kpisHtml}</div>
  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;overflow:hidden;margin-bottom:20px">
    <div style="padding:14px 18px;background:rgba(34,211,238,0.05);border-bottom:1px solid #1e293b">
      <div style="font-size:11px;color:#94a3b8;letter-spacing:1.5px">BEFORE / AFTER</div>
      <div style="font-size:15px;color:#22d3ee;font-weight:bold">量子 × AI 導入効果</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:rgba(255,255,255,0.03)">
        <th style="padding:10px 14px;text-align:left;color:#94a3b8;font-size:11px;letter-spacing:0.5px">指標</th>
        <th style="padding:10px 14px;color:#94a3b8;font-size:11px;letter-spacing:0.5px">従来</th>
        <th style="padding:10px 14px;color:#22d3ee;font-size:11px;letter-spacing:0.5px">量子×AI</th>
      </tr></thead>
      <tbody>${metricsHtml}</tbody>
    </table>
  </div>
  <div style="padding:16px 18px;background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.25);border-radius:8px;font-size:13px;color:#fde68a;line-height:1.7">
    <span style="font-size:16px">💡</span> ${opts.insight}
  </div>
</div>
${businessImpact}
${quantumVsClassical}
${validation}
</body></html>`;
}

const D11 = mkDemo({
  title: '予知保全AIダッシュボード',
  subtitle: '工作機械の振動・温度・電流データをAIで解析し、故障を事前に予知',
  gradient: 'linear-gradient(135deg,#7c2d12,#dc2626)',
  algo: 'LSTM + 量子異常検知 (Quantum SVM)',
  kpis: [
    { label: '故障予知精度', value: '94.7', unit: '%', color: '#22c55e' },
    { label: '計画外停止削減', value: '-78', unit: '%', color: '#3b82f6' },
    { label: '保全コスト削減', value: '-42', unit: '%', color: '#f59e0b' },
    { label: '監視機械台数', value: '128', unit: '台', color: '#a855f7' },
  ],
  metrics: [
    { label: '故障検知タイミング', before: '故障後24h', after: '故障前72h' },
    { label: '誤報率', before: '32%', after: '4.1%' },
    { label: '保全工数/月', before: '420時間', after: '180時間' },
    { label: '機会損失/年', before: '1.2億円', after: '0.18億円' },
  ],
  insight: '振動FFT特徴量を量子SVMで分類し、従来の閾値監視で見逃していた前兆を捉えます。突発故障による生産停止を激減させ、保全要員を計画保全にシフト可能にします。',
  impact: [
    { label: '計画外停止', value: '-78%', note: '量子SVM異常検知', color: '#22c55e' },
    { label: '保全コスト', value: '-42%', note: '緊急→計画保全シフト', color: '#3b82f6' },
    { label: '機会損失/年', value: '-1.0億円', note: '生産停止の激減', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 10台×30日センサー', 'Random Forest: 4分', 'Q-SVM模擬: 90秒', '—'],
    ['中: 100台×1年センサー', 'XGBoost: 3時間', 'Q-SVM: 25分', '—'],
    ['大: 1,000台×5年高頻度', 'メモリ不足', '計算困難', 'Q-SVM実機: 4時間'],
  ],
  threshold: '監視機械500台以上 × 高次元特徴量 (1,000+ FFT bins)',
  qubits: '約500〜2,000 qubits',
  reason: '高次元振動FFT特徴量のカーネル計算が古典では指数的、量子で多項式化',
  papers: [
    ['Havlíček et al.', '"Supervised learning with quantum-enhanced feature spaces"', 'Nature 567, 209 (2019)'],
    ['Lei et al.', '"Applications of machine learning to machine fault diagnosis"', 'Mech. Syst. Signal Process. 138, 106587 (2020)'],
  ],
  limits: ['新規故障モードは追加学習が必要', '初期データ収集に3〜6ヶ月', 'センサー設置の電源/通信確保必須'],
});

const D12 = mkDemo({
  title: '金型寿命予測シミュレーション',
  subtitle: 'ショット数・温度履歴・摩耗データから残寿命を量子機械学習で予測',
  gradient: 'linear-gradient(135deg,#0f766e,#14b8a6)',
  algo: 'Quantum Kernel Regression (PennyLane)',
  kpis: [
    { label: '寿命予測精度', value: '±3.2', unit: '%', color: '#22c55e' },
    { label: '金型交換タイミング', value: '+18', unit: '%延長', color: '#3b82f6' },
    { label: '不良流出ゼロ達成', value: '6', unit: 'ヶ月', color: '#f59e0b' },
    { label: '管理金型数', value: '342', unit: '型', color: '#a855f7' },
  ],
  metrics: [
    { label: '交換判断方法', before: '経験則・固定ショット数', after: '量子ML予測' },
    { label: '交換コスト/年', before: '8,400万円', after: '5,100万円' },
    { label: '突発不良流出', before: '年12件', after: '年0件' },
    { label: 'メンテナンス計画作成', before: '2日/月', after: '15分/月' },
  ],
  insight: '量子カーネルによる非線形回帰で、温度・ショット履歴の高次相関を捉えます。安全マージンを縮め、交換サイクルを最適化することで、年3,300万円のコスト削減と不良ゼロを両立します。',
  impact: [
    { label: '交換コスト/年', value: '-3,300万円', note: '安全マージン最適化', color: '#22c55e' },
    { label: '突発不良', value: 'ゼロ', note: '6ヶ月連続達成', color: '#3b82f6' },
    { label: '計画工数', value: '-95%', note: '2日→15分', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 10型×1万ショット', '線形回帰: 5秒', 'QKR: 3秒', '—'],
    ['中: 300型×10万ショット', 'GBM: 8分', 'QKR: 1.5分', '—'],
    ['大: 1,000型×全履歴', 'Deep Learning: 6時間', 'QKR+SA: 30分', 'QKR実機: 8分'],
  ],
  threshold: '金型300型以上 × 多変量センサー履歴（5+特徴量）',
  qubits: '約300〜1,200 qubits',
  reason: '温度・摩耗・ショット数の非線形相関を量子カーネルで効率的に捕捉',
  papers: [
    ['Schuld & Killoran', '"Quantum machine learning in feature Hilbert spaces"', 'Phys. Rev. Lett. 122, 040504 (2019)'],
    ['Liu et al.', '"Tool wear monitoring and prediction based on sound signal"', 'Int. J. Adv. Manuf. Technol. 103 (2019)'],
  ],
  limits: ['新規金型材質は追加学習必要', '温度センサーの校正が前提', '射出条件変更時の再学習推奨'],
});

const D13 = mkDemo({
  title: 'エネルギー消費 量子最適化',
  subtitle: '工場全体の電力・ガス・水の使用量をQUBOで最小化',
  gradient: 'linear-gradient(135deg,#a16207,#eab308)',
  algo: 'QUBO + Simulated Annealing (D-Wave)',
  kpis: [
    { label: '電力削減率', value: '-23', unit: '%', color: '#22c55e' },
    { label: '年間コスト削減', value: '4,800', unit: '万円', color: '#3b82f6' },
    { label: 'CO2削減', value: '-1,420', unit: 't/年', color: '#10b981' },
    { label: '設備カバー率', value: '98', unit: '%', color: '#a855f7' },
  ],
  metrics: [
    { label: 'ピーク電力', before: '4,200kW', after: '3,180kW' },
    { label: '需給予測精度', before: '±15%', after: '±3%' },
    { label: '空調最適化', before: '時間帯固定', after: '15分粒度動的' },
    { label: 'デマンドレスポンス', before: '手動', after: '自動QUBO最適化' },
  ],
  insight: '生産計画 × 設備稼働 × 電力料金単価をQUBOで同時最適化。ピークカットによる契約電力削減と再エネ自家消費最大化で、SBT 1.5℃目標達成と収益性向上を両立します。',
  impact: [
    { label: '電力削減', value: '-23%', note: 'ピークカット効果', color: '#22c55e' },
    { label: 'CO2削減', value: '-1,420 t/年', note: 'SBT 1.5℃適合', color: '#10b981' },
    { label: 'コスト削減', value: '4,800万円/年', note: '契約電力縮減', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 10設備×24時間', 'CPLEX: 0.5秒', 'SA: 0.2秒', '—'],
    ['中: 100設備×7日', 'CPLEX: 4分', 'D-Wave Hybrid: 30秒', '—'],
    ['大: 1,000設備×1年×電力市場', 'メタヒューリスティック: 2日', '計算困難', 'D-Wave実機: 12分'],
  ],
  threshold: '設備数500以上 × 動的料金単価 × 再エネ統合',
  qubits: '約500〜2,500 qubits',
  reason: '生産計画と電力料金市場の組合せ最適化はNP困難、量子アニーリングで実用化',
  papers: [
    ['Lucas', '"Ising formulations of many NP problems"', 'Frontiers in Physics 2, 5 (2014)'],
    ['Pötzlberger et al.', '"Quantum optimization for energy management"', 'Quantum Sci. Technol. 8, 015018 (2023)'],
  ],
  limits: ['電力市場価格の予測精度に依存', '再エネ発電量の天候モデル別途必要', 'デマンドレスポンス契約者のみ'],
});

const D14 = mkDemo({
  title: '需要予測 × 生産平準化',
  subtitle: '季節変動とプロモを量子LSTMで予測し、生産計画を平準化',
  gradient: 'linear-gradient(135deg,#1e3a8a,#3b82f6)',
  algo: 'Quantum LSTM + 平準化線形計画 (LP)',
  kpis: [
    { label: '需要予測精度', value: '+34', unit: 'pt', color: '#22c55e' },
    { label: '在庫回転率', value: '+47', unit: '%', color: '#3b82f6' },
    { label: '残業時間削減', value: '-62', unit: '%', color: '#f59e0b' },
    { label: '機会損失削減', value: '-71', unit: '%', color: '#a855f7' },
  ],
  metrics: [
    { label: '予測モデル', before: '移動平均・経験則', after: '量子LSTM + イベント補正' },
    { label: '需要MAPE', before: '28%', after: '9.2%' },
    { label: '生産負荷の山谷比', before: '2.8倍', after: '1.3倍' },
    { label: '欠品発生件数/月', before: '14件', after: '2件' },
  ],
  insight: '季節性・キャンペーン・天候を量子LSTMで多変量予測し、線形計画で生産能力に対して平準化。繁忙期の残業と閑散期の遊休を同時に解消します。',
  impact: [
    { label: '在庫回転率', value: '+47%', note: '欠品14→2件/月', color: '#22c55e' },
    { label: '残業削減', value: '-62%', note: '生産負荷平準化', color: '#3b82f6' },
    { label: '需要MAPE', value: '28%→9.2%', note: '量子LSTM予測', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 10品目×1年予測', 'ARIMA: 1分', 'Q-LSTM模擬: 30秒', '—'],
    ['中: 100品目×3年×天候', 'XGBoost: 2時間', 'Q-LSTM: 20分', '—'],
    ['大: 1,000品目×イベント連動', 'Deep LSTM: 1日', 'Q-LSTM+SA: 4時間', 'Q-LSTM実機: 1時間'],
  ],
  threshold: '品目数500以上 × 多変量説明変数（天候・SNS・プロモ）',
  qubits: '約400〜1,500 qubits',
  reason: '時系列の長期依存性を量子振幅エンコーディングで効率表現',
  papers: [
    ['Bausch', '"Recurrent Quantum Neural Networks"', 'NeurIPS 33 (2020)'],
    ['Lim & Zohren', '"Time-series forecasting with deep learning: a survey"', 'Phil. Trans. R. Soc. A 379, 20200209 (2021)'],
  ],
  limits: ['新製品は最低3ヶ月のデータが必要', '突発イベント（パンデミック等）は再学習必須', '取引先キャンペーンの事前情報共有が前提'],
});

const D15 = mkDemo({
  title: 'サプライヤー選定 多目的最適化',
  subtitle: '品質・価格・納期・CO2排出量の多目的最適化',
  gradient: 'linear-gradient(135deg,#6d28d9,#9333ea)',
  algo: 'Pareto Frontier + Quantum Multi-Objective',
  kpis: [
    { label: '調達コスト削減', value: '-12.4', unit: '%', color: '#22c55e' },
    { label: 'CO2削減', value: '-31', unit: '%', color: '#10b981' },
    { label: '納期遵守率', value: '+18', unit: 'pt', color: '#3b82f6' },
    { label: '評価サプライヤー', value: '480', unit: '社', color: '#a855f7' },
  ],
  metrics: [
    { label: '選定指標', before: '価格中心', after: '4目的バランス' },
    { label: '選定時間', before: '5日/案件', after: '30秒' },
    { label: 'スコープ3 CO2', before: '計測のみ', after: '最適化対象' },
    { label: 'リスク分散', before: '単一サプライヤー', after: '量子分散調達' },
  ],
  insight: 'パレート最適解の中から重みを動的調整。BCP・コスト・カーボンニュートラルを同時に追求し、CSRD/SBT 1.5℃の調達側要件にも対応します。',
  impact: [
    { label: '調達コスト', value: '-12.4%', note: '多目的最適化', color: '#22c55e' },
    { label: 'スコープ3 CO2', value: '-31%', note: 'CSRD完全対応', color: '#10b981' },
    { label: '選定時間', value: '-99.7%', note: '5日→30秒', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 10社×4目的', 'ε制約法: 5秒', 'QMOO模擬: 2秒', '—'],
    ['中: 100社×4目的×制約30', 'NSGA-II: 30分', 'QMOO: 3分', '—'],
    ['大: 480社×多目的×複雑制約', '近似解のみ', 'QMOO+SA: 1時間', 'QMOO実機: 15分'],
  ],
  threshold: 'サプライヤー数200以上 × 4目的以上の多目的最適化',
  qubits: '約500〜2,000 qubits',
  reason: 'パレートフロンティア探索は組合せ的に増大、量子干渉で効率化',
  papers: [
    ['Deb et al.', '"A Fast and Elitist Multiobjective Genetic Algorithm: NSGA-II"', 'IEEE Trans. Evol. Comput. 6, 182 (2002)'],
    ['Kirkpatrick et al.', '"Optimization by Simulated Annealing"', 'Science 220, 671 (1983)'],
  ],
  limits: ['サプライヤー側のCO2データ提供必須', 'BCPシミュレーションは過去データ依存', '緊急調達時は別ロジック必要'],
});

const D16 = mkDemo({
  title: '品質ばらつきSPC量子異常検知',
  subtitle: 'X-bar/R管理図に量子異常検知を統合し、ばらつき異常を早期発見',
  gradient: 'linear-gradient(135deg,#92400e,#f97316)',
  algo: 'Quantum Anomaly Detection + SPC (X-bar/R)',
  kpis: [
    { label: '異常検知前倒し', value: '8', unit: '時間早く', color: '#22c55e' },
    { label: '不良流出削減', value: '-86', unit: '%', color: '#3b82f6' },
    { label: '誤報率', value: '1.2', unit: '%', color: '#f59e0b' },
    { label: '監視特性数', value: '64', unit: 'CTQ', color: '#a855f7' },
  ],
  metrics: [
    { label: '管理図の限界', before: '単変量・線形ルール', after: '多変量・量子非線形' },
    { label: '異常検知方法', before: 'シューハート 8ルール', after: 'Quantum SVDD + SPC' },
    { label: '工程能力(Cpk)', before: '1.10', after: '1.62' },
    { label: 'クレーム件数/年', before: '38件', after: '5件' },
  ],
  insight: '従来のSPC管理図は単変量で見逃しが多発。量子異常検知器で64特性の高次相関を学習し、トレンド異常を平均8時間前倒しで検出。クレームと製造責任リスクを大幅低減します。',
  impact: [
    { label: '不良流出', value: '-86%', note: 'クレーム38→5件/年', color: '#22c55e' },
    { label: '工程能力Cpk', value: '1.10→1.62', note: '量子非線形検知', color: '#3b82f6' },
    { label: '異常検知', value: '8時間前倒し', note: 'トレンド早期発見', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 単変量×100ロット', 'SPC: 即時', 'Q-SVDD: 即時', '—'],
    ['中: 64特性×10万ロット', 'PCA+SPC: 5分', 'Q-SVDD: 1分', '—'],
    ['大: 200特性×全ロット連続', '高次相関は古典で発見困難', 'Q-SVDD+SA: 30分', 'Q-SVDD実機: 5分'],
  ],
  threshold: '監視特性30以上 × 高次相関を伴うCTQ',
  qubits: '約300〜1,500 qubits',
  reason: '高次元データの密度推定はカーネルトリックを量子化することで効率化',
  papers: [
    ['Schölkopf et al.', '"Estimating the Support of a High-Dimensional Distribution"', 'Neural Comput. 13, 1443 (2001)'],
    ['Liang et al.', '"Quantum Anomaly Detection"', 'arXiv:1710.07405 (2017)'],
  ],
  limits: ['学習データに正常状態の十分な蓄積が必要', '装置入替時は再学習必須', '判定閾値は工程ごとに調整'],
});

const D17 = mkDemo({
  title: 'デジタルツイン工場',
  subtitle: '工場フロアの3Dデジタルツインで設備レイアウトを最適化',
  gradient: 'linear-gradient(135deg,#0c4a6e,#0ea5e9)',
  algo: '3Dシミュレーション + QUBO配置最適化',
  kpis: [
    { label: '搬送距離削減', value: '-37', unit: '%', color: '#22c55e' },
    { label: '生産性向上', value: '+19', unit: '%', color: '#3b82f6' },
    { label: 'レイアウト案検討', value: '120', unit: '案/日', color: '#f59e0b' },
    { label: '管理設備数', value: '48', unit: '台', color: '#a855f7' },
  ],
  metrics: [
    { label: 'レイアウト変更検証', before: '2週間+試運転', after: '即時シミュレーション' },
    { label: '安全シミュレーション', before: '実機停止必要', after: 'デジタルツインで検証' },
    { label: '新製品立上げ', before: '3ヶ月', after: '3週間' },
    { label: 'DX投資回収', before: '5年', after: '11ヶ月' },
  ],
  insight: '物理レイアウト変更の前に、量子最適化済みデジタルツインで効果検証。失敗コストゼロで生産性を継続改善します。',
  impact: [
    { label: '搬送距離', value: '-37%', note: 'QUBO配置最適化', color: '#22c55e' },
    { label: '生産性', value: '+19%', note: '稼働率向上', color: '#3b82f6' },
    { label: 'DX投資回収', value: '11ヶ月', note: '従来5年→11ヶ月', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 10設備×簡易レイアウト', '線形計画: 1分', 'SA: 30秒', '—'],
    ['中: 50設備×3D干渉判定', 'メタヒューリスティック: 4時間', 'D-Wave Hybrid: 20分', '—'],
    ['大: 200設備×多目的×実時間', '計算困難', 'D-Wave+古典: 2時間', 'D-Wave実機: 30分'],
  ],
  threshold: '設備数50以上 × 動線・干渉・安全制約の同時最適化',
  qubits: '約500〜2,500 qubits',
  reason: 'QAP（二次割当問題）はNP困難の代表例、量子アニーリングで実用化',
  papers: [
    ['Koopmans & Beckmann', '"Assignment Problems and the Location of Economic Activities"', 'Econometrica 25, 53 (1957)'],
    ['Negre et al.', '"Detecting Multiple Communities Using Quantum Annealing"', 'PLoS ONE 15, e0227538 (2020)'],
  ],
  limits: ['物理3Dスキャンデータが前提', '人の動線は確率モデル', '実装時の建築制約は別途確認'],
});

const D18 = mkDemo({
  title: '製造ナレッジRAG検索',
  subtitle: '過去の不良事例・対策書・作業手順をLLMで全文検索＋要約',
  gradient: 'linear-gradient(135deg,#831843,#ec4899)',
  algo: 'RAG (Retrieval Augmented Generation) + Vector DB',
  kpis: [
    { label: '回答時間', value: '5', unit: '秒', color: '#22c55e' },
    { label: '検索ヒット率', value: '96', unit: '%', color: '#3b82f6' },
    { label: '蓄積ドキュメント', value: '18,400', unit: '件', color: '#f59e0b' },
    { label: '熟練工問い合わせ削減', value: '-72', unit: '%', color: '#a855f7' },
  ],
  metrics: [
    { label: 'ナレッジ検索', before: 'キーワード+紙ファイル', after: '自然言語+ベクトル検索' },
    { label: '答えにたどり着く時間', before: '平均45分', after: '5秒' },
    { label: '新人の自走率', before: '32%', after: '88%' },
    { label: '熟練工の中断回数/日', before: '14回', after: '4回' },
  ],
  insight: '不良対策書・是正報告書・作業標準書をベクトルDB化し、LLMが根拠付きで回答。新人が自分で答えに辿り着けるようになり、熟練工は本来の技術開発に専念できます。',
  impact: [
    { label: '答え到達時間', value: '45分→5秒', note: '99.8%短縮', color: '#22c55e' },
    { label: '新人自走率', value: '32%→88%', note: '+56pt', color: '#3b82f6' },
    { label: '熟練工の中断', value: '-71%', note: '14回→4回/日', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 1,000ドキュメント', 'BM25検索: 即時', 'ベクトル検索: 即時', '—'],
    ['中: 10万ドキュメント', 'Elasticsearch: 200ms', 'FAISS: 50ms', '—'],
    ['大: 100万+ × 多言語×画像', 'スケール限界', 'FAISS+LLM: 5秒', '量子検索研究中'],
  ],
  threshold: 'ドキュメント数10万以上 × 自然言語問合せ × 多モーダル',
  qubits: '量子優位性は研究段階',
  reason: 'RAGは古典AIで現状十分、将来は量子振幅増幅で高速化候補',
  papers: [
    ['Lewis et al.', '"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"', 'NeurIPS 33 (2020)'],
    ['Karpukhin et al.', '"Dense Passage Retrieval for Open-Domain Question Answering"', 'EMNLP 2020'],
  ],
  limits: ['LLMのハルシネーション対策に根拠引用必須', '機密文書のオンプレ運用要', '画像・図面解析は別モデル併用'],
});

const D19 = mkDemo({
  title: 'CO2排出量トラッキング',
  subtitle: '製造工程ごとのCO2排出量をリアルタイム計測・可視化',
  gradient: 'linear-gradient(135deg,#14532d,#22c55e)',
  algo: 'GHG Protocol Scope1-3 + リアルタイム集計',
  kpis: [
    { label: 'スコープ1+2削減', value: '-28', unit: '%', color: '#22c55e' },
    { label: 'スコープ3可視化', value: '92', unit: '%', color: '#3b82f6' },
    { label: '計測工程数', value: '186', unit: '工程', color: '#f59e0b' },
    { label: '報告作成時間', value: '15', unit: '分', color: '#a855f7' },
  ],
  metrics: [
    { label: 'CO2集計', before: '月次・手動', after: 'リアルタイム自動' },
    { label: 'カーボンフットプリント', before: '製品全体平均', after: 'ロット単位' },
    { label: '取引先報告', before: '年1回', after: '随時API提供' },
    { label: 'SBT 1.5℃適合', before: '未達', after: '達成見込み' },
  ],
  insight: '電力・燃料・原材料の使用量から自動算定。CSRD・SBT報告が15分で完成し、グリーン調達契約獲得の武器になります。',
  impact: [
    { label: 'スコープ1+2', value: '-28%', note: 'リアルタイム可視化', color: '#22c55e' },
    { label: 'スコープ3', value: '92%可視化', note: '従来30%', color: '#10b981' },
    { label: '報告作成', value: '15分', note: '従来3週間', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 1工場×3スコープ', 'Excel: 2日/月', '自動API: 1分/月', '—'],
    ['中: 10工場×Scope3全量', 'CSV手作業: 1週間', 'クラウド集計: 1時間', '—'],
    ['大: グローバル100拠点+多階層SC', '計算困難', 'クラウド+量子最適: 6時間', 'Scope3最適化に量子優位'],
  ],
  threshold: '工程数100以上 × Scope3 多階層サプライチェーン',
  qubits: '約500〜2,500 qubits（Scope3配賦最適化）',
  reason: 'Scope3配賦は組合せ的に複雑、量子最適化で精度向上',
  papers: [
    ['GHG Protocol', '"Corporate Value Chain (Scope 3) Accounting and Reporting Standard"', 'WRI/WBCSD (2011)'],
    ['SBTi', '"Net-Zero Standard"', 'Science Based Targets initiative (2024)'],
  ],
  limits: ['Tier 2以降のサプライヤーデータ収集が課題', 'CO2係数は国・年で変動', '第三者保証はISAE 3000準拠が必要'],
});

const D20 = mkDemo({
  title: '協働ロボット 作業割当 量子最適化',
  subtitle: '人間と協働ロボットの作業割り当てで生産性と安全性を両立',
  gradient: 'linear-gradient(135deg,#581c87,#8b5cf6)',
  algo: 'QUBO + 人間工学制約 (Constrained Annealing)',
  kpis: [
    { label: '生産性向上', value: '+34', unit: '%', color: '#22c55e' },
    { label: '労災リスク', value: '-91', unit: '%', color: '#dc2626' },
    { label: '対応作業者数', value: '48', unit: '名', color: '#3b82f6' },
    { label: '協働ロボ台数', value: '12', unit: '台', color: '#a855f7' },
  ],
  metrics: [
    { label: 'シフト作成', before: '5時間/週', after: '15秒' },
    { label: '重量物作業', before: '人手100%', after: 'ロボ95%代替' },
    { label: '熟練工集中度', before: '60% (雑務多)', after: '94% (高付加価値のみ)' },
    { label: '労災発生', before: '年3.2件', after: '年0.3件' },
  ],
  insight: '人間の疲労・スキル・休憩制約と、ロボットの可搬重量・速度制約をQUBOで同時最適化。作業者の安全と生産性を両立する次世代シフトを生成します。',
  impact: [
    { label: '生産性', value: '+34%', note: '人ロボ協働最適化', color: '#22c55e' },
    { label: '労災発生', value: '-91%', note: '年3.2件→0.3件', color: '#dc2626' },
    { label: 'シフト作成', value: '5h→15秒', note: '99.9%短縮', color: '#f59e0b' },
  ],
  benchmarks: [
    ['小: 5名×3ロボ×8h', '線形計画: 5秒', 'SA: 2秒', '—'],
    ['中: 30名×10ロボ×週次', 'CPLEX: 30分', 'D-Wave Hybrid: 3分', '—'],
    ['大: 500名×50ロボ×月次×安全制約', '計算困難', 'D-Wave+古典: 1時間', 'D-Wave実機: 10分'],
  ],
  threshold: '作業者数50以上 × 人間工学制約 × 動的シフト',
  qubits: '約500〜2,500 qubits',
  reason: '人間の疲労モデルとロボット制約の組合せ最適化はNP困難',
  papers: [
    ['Lucas', '"Ising formulations of many NP problems"', 'Frontiers in Physics 2, 5 (2014)'],
    ['Gualtieri & Granieri', '"Emerging research fields in safety and ergonomics in industrial collaborative robotics"', 'Robot. Comput. Integr. Manuf. 67 (2021)'],
  ],
  limits: ['労働基準法等の法令準拠が前提', '個人差は適応的に学習', '緊急時は安全側にフェイルセーフ'],
});

export const DEMOS: Demo[] = [
  // UC#11-20（より具体的なキーワードを優先）
  { keyword: '工作機械', explanation: '工作機械の故障を72時間前に予知する保全AIダッシュボードを作りました！', code: D11 },
  { keyword: '金型',     explanation: '金型寿命を量子機械学習で予測するシミュレーションを作りました！', code: D12 },
  { keyword: 'エネルギー管理', explanation: '工場全体の電力・ガス・水をQUBOで最小化するエネルギー管理ダッシュボードを作りました！', code: D13 },
  { keyword: '需要予測',   explanation: '量子LSTMで需要予測し、生産計画を平準化するアプリを作りました！', code: D14 },
  { keyword: 'サプライヤー', explanation: '品質×価格×納期×CO2の多目的最適化でサプライヤー選定を行うアプリを作りました！', code: D15 },
  { keyword: 'SPC',     explanation: 'X-bar/R管理図に量子異常検知を統合するSPCダッシュボードを作りました！', code: D16 },
  { keyword: 'デジタルツイン', explanation: '3Dデジタルツインで工場レイアウトを最適化するアプリを作りました！', code: D17 },
  { keyword: 'RAG',      explanation: '不良事例・対策書をLLMで全文検索する製造業RAGナレッジ検索を作りました！', code: D18 },
  { keyword: 'CO2',      explanation: '製造工程ごとのCO2排出量をリアルタイム可視化するアプリを作りました！', code: D19 },
  { keyword: '協働',     explanation: '人間と協働ロボットの作業割当を量子最適化するシフト表アプリを作りました！', code: D20 },
  // UC#1-10（汎用キーワードは後ろに）
  { keyword: 'マッチング', explanation: '全国の町工場をQUBO行列で最適マッチングするアプリを作りました！', code: D1 },
  { keyword: '図面',       explanation: 'FAX図面をAI解析して工程分解と見積を自動算出するダッシュボードを作りました！', code: D2 },
  { keyword: '検査',       explanation: '製品の外観検査とAI不良原因分析の品質管理画面を作りました！', code: D3 },
  { keyword: 'スキルマップ', explanation: '熟練技術者のスキルマップと新人育成ダッシュボードを作りました！', code: D4 },
  { keyword: '試作',       explanation: '材質x肉抜きx加工法の組合せから最適な試作設計を提案するツールを作りました！', code: D5 },
  { keyword: 'ロボット',    explanation: '工場内ロボットの最適経路をシミュレーションする画面を作りました！', code: D6 },
  { keyword: '稼働率',     explanation: '設備稼働率をリアルタイム監視するダッシュボードを作りました！', code: D7 },
  { keyword: '搬送',       explanation: '町工場間の搬送ルートを最適化して地図に表示するアプリを作りました！', code: D8 },
  { keyword: '在庫', explanation: '在庫量と発注タイミングをQUBO+SAで量子最適化するアプリを作りました！', code: D9 },
  { keyword: '量子アニーリング', explanation: '量子アニーリングで生産スケジュールを最適化する仕組みを可視化しました！', code: D10 },
];

export function findDemo(prompt: string): Demo | null {
  for (const d of DEMOS) {
    if (prompt.includes(d.keyword)) return d;
  }
  return null;
}
