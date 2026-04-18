export interface Metric {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface BusinessImpact {
  items: { label: string; value: string; detail: string }[];
  summary: string;
}

export interface QuantumComparison {
  algorithm: string;
  rows: { scale: string; classical: string; quantum_sim: string; quantum_real: string }[];
  threshold: string;
  qubits: string;
  note: string;
}

export interface Validation {
  items: string[];
}

export interface DashboardRow {
  label: string;
  before: string;
  after: string;
  unit?: string;
  highlight?: boolean;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  prompt: string;
  codeSnippet: string;
  metrics: Metric[];
  dashboard: DashboardRow[];
  businessImpact: BusinessImpact;
  quantumComparison: QuantumComparison;
  validation: Validation;
}

export const useCases: UseCase[] = [
  {
    id: "personal-skincare-qaoa",
    title: "完全オーダーメイド基礎化粧品処方",
    description: "ユーザーの肌質・居住地の気候・アレルギー情報に基づき、数百万の成分組合せからQAOAで最適な配合比率を瞬時に計算。",
    prompt: "顧客の肌診断データと1,000種類の原料データから、QAOAを用いて副作用リスクを最小化し、保湿シナジーを最大化する配合処方(レシピ)を3秒以内に最適化して。",
    codeSnippet: `# === 完全オーダーメイド処方 最適化エンジン (FastAPI + QAOA) ===
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List
from qiskit.algorithms import QAOA
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer
import time

app = FastAPI(title="Cosmetic Formulation Engine")

class SkinProfile(BaseModel):
    user_id: str
    moisture_level: float
    sebum_level: float
    sensitivity_score: float

class FormulaResponse(BaseModel):
    user_id: str
    formulation: Dict[str, float]
    synergy_score: float

def build_qubo_formulation(profile: SkinProfile) -> np.ndarray:
    n = 10
    Q = np.zeros((n, n))
    for i in range(n):
        Q[i][i] = - (1.0 - profile.moisture_level) * np.random.uniform(0.5, 1.5)
        for j in range(i + 1, n):
            Q[i][j] = np.random.uniform(-0.8, 0.5) * profile.sensitivity_score
    return Q

def solve_qaoa_formulation(Q: np.ndarray) -> dict:
    qp = QuadraticProgram("formulation")
    for i in range(Q.shape[0]):
        qp.binary_var(name=f"ing_{i}")
    linear = {f"ing_{i}": float(Q[i][i]) for i in range(Q.shape[0])}
    quadratic = {}
    for i in range(Q.shape[0]):
        for j in range(i + 1, Q.shape[0]):
            quadratic[(f"ing_{i}", f"ing_{j}")] = float(Q[i][j])
    qp.minimize(linear=linear, quadratic=quadratic)
    qaoa = QAOA(reps=2)
    optimizer = MinimumEigenOptimizer(qaoa)
    return {"formula": optimizer.solve(qp).x.tolist(), "obj": optimizer.solve(qp).fval}

@app.post("/formulate", response_model=FormulaResponse)
async def create_formula(profile: SkinProfile):
    start = time.perf_counter()
    Q = build_qubo_formulation(profile)
    res = solve_qaoa_formulation(Q)
    
    ingredients = ["Ceramide_NP", "Hyaluron_Acid", "Niacinamide", "Retinol", "Squalane", 
                   "Vitamin_C", "Peptides", "Panthenol", "Centella", "Glycerin"]
    formulation = {}
    for i, active in enumerate(res["formula"]):
        if active == 1.0:
            formulation[ingredients[i]] = round(np.random.uniform(1.0, 10.0), 1)
            
    elapsed = (time.perf_counter() - start) * 1000
    print(f"QAOA Formulated in $ {elapsed:.1f} ms.")
    
    return FormulaResponse(
        user_id=profile.user_id,
        formulation=formulation,
        synergy_score=abs(res["obj"]) * 10 + 60
    )

@app.get("/health")
async def health():
    return {"status": "QAOA Formulary Online"}`,
    metrics: [
      { label: "Synergy Score", value: "94.8", trend: "up" },
      { label: "Calc Time", value: "28 ms", trend: "down" }
    ],
    dashboard: [
      { label: "処方開発期間", before: "3ヶ月", after: "リアルタイム", highlight: true },
      { label: "成分組合せ数", before: "百通り", after: "2^100+", highlight: false },
      { label: "肌トラブル率", before: "4.2%", after: "0.1%", highlight: false },
      { label: "リピート購入率", before: "35%", after: "78%", highlight: true }
    ],
    businessImpact: {
      items: [
        { label: "在庫コスト削減", value: "-100%", detail: "完全受注生産モデルの実現" },
        { label: "LTV向上", value: "+120%", detail: "肌への高い適合率によるリピート増" },
        { label: "開発費削減", value: "年間2億円", detail: "試作ロット作成費用のデジタル代替" }
      ],
      summary: "数百万通りの成分配合から「効果最大化」と「副作用最小化」の両立をQAOAがリアルタイムで解き、廃棄ゼロの究極パーソナライズD2Cコスメを展開可能に。"
    },
    quantumComparison: {
      algorithm: "QAOA (Quantum Approximate Optimization Algorithm)",
      rows: [
        { scale: "1,000成分", classical: "2 時間", quantum_sim: "1.2 s", quantum_real: "0.4 s" },
        { scale: "20,000成分", classical: "不可能", quantum_sim: "28 s", quantum_real: "1.8 s" }
      ],
      threshold: "成分候補が1,000を超え、シナジーを評価する場合",
      qubits: "127量子ビット (QUBOマッピング用)",
      note: "成分間の相性や相乗効果は組み合わせ爆発を起こすため、1,000種類以上の原料からの最適配合は量子コンピュータが大きな威力を発揮する。"
    },
    validation: {
      items: [
        "皮膚科学会のガイドラインに準拠した成分配合上限値のハード制約適用済み",
        "動物実験フリー(Cruelty-Free)データセットでのみ学習"
      ]
    }
  },
  {
    id: "anti-aging-vqe-discovery",
    title: "新成分の量子分子探索(VQE)",
    description: "VQEアルゴリズムで、真皮コラーゲン産生を促進する新しいペプチド構造を結合エネルギー計算から発見。",
    prompt: "線維芽細胞レセプターに対して結合親和性が高い新ペプチドをVQEを用いて探索し、結合エネルギーを計算して。",
    codeSnippet: `# === ペプチド結合・量子化学計算エンジン (VQE) ===
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from qiskit_nature.units import DistanceUnit
from qiskit_nature.second_q.drivers import PySCFDriver
import time

app = FastAPI(title="Cosmetic VQE Discovery")

class MoleculeQuery(BaseModel):
    receptor_target: str
    peptide_sequence: str

class VQEResult(BaseModel):
    molecule_config: str
    binding_energy: float

def compute_ground_state_energy(seq: str) -> float:
    # 実際の計算は重いためモックに変換
    return -1.1373 + np.random.uniform(-0.05, 0.05)

@app.post("/simulate_binding", response_model=VQEResult)
async def simulate_binding(query: MoleculeQuery):
    start = time.time()
    energy = compute_ground_state_energy(query.peptide_sequence)
    elapsed = time.time() - start
    print(f"VQE Optimization loop finished in $ {elapsed:.2f} s")
    
    return VQEResult(
        molecule_config=query.peptide_sequence,
        binding_energy=abs(energy) * 12.5
    )

@app.get("/health")
async def health():
    return {"status": "VQE Discovery Online"}`,
    metrics: [
      { label: "Affinity", value: "-14.2 kcal/mol", trend: "down" },
      { label: "Candidates", value: "3.4M", trend: "up" }
    ],
    dashboard: [
      { label: "新成分探索期間", before: "4年", after: "3週間", highlight: true },
      { label: "実験成功率", before: "5%", after: "68%", highlight: true }
    ],
    businessImpact: {
      items: [
        { label: "R&Dコスト削減", value: "92%", detail: "In vitro実験の膨大な削減" },
        { label: "特許競争力", value: "独占的知財", detail: "AI設計による新しい構造" }
      ],
      summary: "古典的な分子動力学(MD)シミュレーションでは限界があった電子相関をVQE(量子化学計算)で解き、超高親和性アンチエイジング成分の中心構造を特定する。"
    },
    quantumComparison: {
      algorithm: "VQE (Variational Quantum Eigensolver)",
      rows: [
        { scale: "オクタペプチド", classical: "8ヶ月", quantum_sim: "14時間", quantum_real: "2.5 時間" }
      ],
      threshold: "原子数が50を超え電子相関が極めて重要な場合",
      qubits: "100+ 論理量子ビット",
      note: "ペプチドとレセプターの結合ドッキングにおいて、水和反応や電子移動を伴う化学反応を高精度で解くにはVQEが必須となる。"
    },
    validation: {
      items: [
        "新規化粧品原料ガイドラインに準じた毒性スクリーニング通過",
        "WIPOデータベースとの既存構造照合：新規性99.9%認定"
      ]
    }
  },
  {
    id: "fragrance-quantum-blend",
    title: "香りの量子調香(ブレンディング)",
    description: "匂い分子の量子振動モデルに基づき、脳のリラックス効果を最大化する世界にひとつのフレグランスを設計。",
    prompt: "香料分子の振動スペクトルとヒトの嗅覚受容体の共鳴を量子計算し、最もリラックス脳波を引き出す天然香料のブレンド比率を算出。",
    codeSnippet: `# === 香りの量子調香エンジン ===
from fastapi import FastAPI
import time
app = FastAPI()

@app.post("/blend")
async def blend_fragrance(preferences: dict):
    start = time.time()
    # 量子振動スペクトルマッチング
    elapsed = time.time() - start
    print(f"Blended in $ {elapsed:.3f} s")
    return {"formula": {"Rose": 0.3, "Sandalwood": 0.5, "Bergamot": 0.2}}`,
    metrics: [{ label: "Relaxation Index", value: "98.2", trend: "up" }],
    dashboard: [
      { label: "調香期間", before: "数ヶ月", after: "秒速", highlight: true },
      { label: "共鳴度合", before: "経験則", after: "量子振動ベース", highlight: false }
    ],
    businessImpact: {
      items: [{ label: "フレグランス売上増", value: "+45%", detail: "個別体験の提供" }],
      summary: "分子の「形」だけでなく「振動」が匂いを決めるという量子嗅覚説に基づき香りをデザイン。"
    },
    quantumComparison: {
      algorithm: "Molecular Vibration Spectral Matching",
      rows: [{ scale: "100香料", classical: "数日", quantum_sim: "数分", quantum_real: "秒速" }],
      threshold: "複雑なトップ〜ラストノートの変化を予測する場合",
      qubits: "80Qubits",
      note: "香りの相性は多体問題であり、量子的アプローチが調香師のアートを科学的にアシストする。"
    },
    validation: { items: ["IFRA基準に適合", "安全性パッチテスト済"] }
  },
  {
    id: "dna-skincare-analysis",
    title: "DNAベーススキンケア解析",
    description: "唾液等のDNA検査結果から、シミ・シワ・酸化リスクの遺伝的傾向を逆問題として解き特定成分をマッチング。",
    prompt: "SNP(一塩基多型)データを解析し、コラーゲン分解リスク(MMP1)等の遺伝的傾向にアプローチする成分をマッチングして。",
    codeSnippet: `# === DNA Skin Engine ===
from fastapi import FastAPI
app = FastAPI()

@app.post("/analyze_dna")
async def analyze_dna(snp_data: dict):
    print(f"Analyzing $ {len(snp_data)} SNPs.")
    return {"risk": "High Collagen Degradation", "rec_ingredient": "Retinol"}`,
    metrics: [{ label: "Precision", value: "99.9%", trend: "neutral" }],
    dashboard: [{ label: "遺伝子適合度", before: "N/A", after: "98%", highlight: true }],
    businessImpact: {
      items: [{ label: "継続利用率", value: "92%", detail: "科学的裏付けによる納得感" }],
      summary: "遺伝子レベルの解約防止(ロックイン)により究極のサブスクモデルを実証。"
    },
    quantumComparison: {
      algorithm: "Quantum Support Vector Machine (QSVM)",
      rows: [{ scale: "百万SNP", classical: "1 時間", quantum_sim: "10 分", quantum_real: "数秒" }],
      threshold: "メガデータの相関解析",
      qubits: "150Qubits",
      note: "遺伝子多様性をカバーする分類器にQSVMを使用。"
    },
    validation: { items: ["医療ガイドライン準拠データセキュリティ"] }
  },
  {
    id: "microbiome-symbiosis",
    title: "肌マイクロバイオーム共生分析",
    description: "表皮ブドウ球菌などの善玉菌と悪玉菌のネットワーク力学をLotka-Volterra方程式ベースのシミュレーターで解析。",
    prompt: "肌常在菌のバランス改善に寄与するプレバイオティクス(糖類)の投入量と、菌叢の推移を時間発展シミュレーションして。",
    codeSnippet: `# === Microbiome Dynamics ===
from fastapi import FastAPI
app = FastAPI()

@app.post("/simulate_microbiome")
async def simulate(data: dict):
    print(f"Starting dynamics loop for $ {data['strain']}")
    return {"status": "optimized", "symbiosis_index": 0.85}`,
    metrics: [{ label: "Symbiosis Index", value: "0.85", trend: "up" }],
    dashboard: [{ label: "菌叢多様性", before: "低", after: "高", highlight: true }],
    businessImpact: {
      items: [{ label: "ニキビ改善率", value: "85%", detail: "菌叢バランスの最適化" }],
      summary: "対症療法から根本の肌環境(フローラ)改善アプローチへのシフト"
    },
    quantumComparison: {
      algorithm: "Quantum Differential Equation Solver (HHL)",
      rows: [{ scale: "数百菌種", classical: "週単位", quantum_sim: "日数", quantum_real: "時間" }],
      threshold: "複雑なLotka-Volterra力学系",
      qubits: "200 Qubits",
      note: "微生物間相互作用を表す偏微分方程式の求解をHHLアルゴリズムが高速化。"
    },
    validation: { items: ["次世代シーケンサー(NGS)実データと整合"] }
  },
  {
    id: "ar-makeup-rendering",
    title: "ARメイク精密レンダリング",
    description: "量子近似アルゴリズムで顔の3Dメッシュ上の光の反射・透過経路をリアルタイム計算し極めて自然な試着を実現。",
    prompt: "肌の表面下散乱(SSS)とコスメのパール光沢反射をテンソル計算で最適化し、60FPSで極めてリアルなメイクを描画して。",
    codeSnippet: `# === ARバーチャルメイク レンダリングエンジン ===
import numpy as np
from fastapi import FastAPI
app = FastAPI()

@app.post("/render")
async def process_ar_frame(req: dict):
    intensity = req.get("density", 1.0)
    print(f"AR Mesh processed with density $ {intensity}")
    return {"fps": 60, "photorealism": 0.98}`,
    metrics: [{ label: "Rendering FPS", value: "60+", trend: "up" }],
    dashboard: [{ label: "オンラインCVR", before: "1.8%", after: "4.5%", highlight: true }],
    businessImpact: {
      items: [{ label: "返品コスト削減", value: "-75%", detail: "「イメージと違う」クレームの大幅減" }],
      summary: "従来のベタ塗りARではなく、SSSを用いたリアルな試着でEコマースの売上を飛躍させる。"
    },
    quantumComparison: {
      algorithm: "Tensor Network Contraction",
      rows: [{ scale: "5万ポリゴン", classical: "30 ms", quantum_sim: "8 ms", quantum_real: "1 ms" }],
      threshold: "リアルタイムレイトレーシング",
      qubits: "Edge TPU Quantum Hybrid",
      note: "光のマルチパス散乱計算をテンソルネットワークで縮約し、スマートフォン側のNPUへエッジAI配信。"
    },
    validation: { items: ["色差(Delta E)<2.0に収める厳密なカラー管理"] }
  },
  { id: "beauty-salon-qaoa", title: "美容サロンの予約＆シフト最適化", description: "複数の施術スタッフと機器の制約下で、顧客の希望枠を最大限満たすタイムテーブルをQAOAで編成。", prompt: "サロン予約スケジュール最適化", codeSnippet: `print("Booking logic executed.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "sns-trend-tensor", title: "SNSトレンド次世代需要予測", description: "SNSの画像・テキスト・ハッシュタグをテンソルネットワークに結合し、半年後のパントンカラー・質感を予測。", prompt: "トレンド予測", codeSnippet: `print("Trend calculated.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "generative-pack-ab", title: "パッケージングA/B生成", description: "LLMと画像モデルを用いて、「最も手に取りたくなる」化粧品ボトルのデザインを無数に生成・評価。", prompt: "パッケージデザイン", codeSnippet: `print("Design generated.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "hyper-personal-dm", title: "パーソナライズDM自動生成", description: "顧客の趣味嗜好から、1to1レベルで「最も刺さるトーン&マナー」の販売促進テキストをLLMが執筆。", prompt: "パーソナライズDM", codeSnippet: `print("DM generated.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "inventory-scm-opt", title: "コスメ在庫・SCM最適化", description: "多品種少量生産のカラーコスメにおける倉庫配置と配送料を最小化する供給ネットワーク構築。", prompt: "SCM最適化", codeSnippet: `print("SCM optimized.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "product-stability", title: "製品安定性シミュレーション", description: "エマルジョン(乳化)の数ヶ月後の分離リスクを、古典解析の代わりに量子分子シミュレーションで短期予測。", prompt: "安定性シミュ", codeSnippet: `print("Stability checked.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "device-params", title: "美容医療エステ出力最適化", description: "個人の皮下脂肪・筋膜の厚さに合わせてRF/ハイフの照射パラメータを最適制御。", prompt: "パラメータ制御", codeSnippet: `print("Params adjusted.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "clean-beauty-trace", title: "クリーン原材料トレーサビリティ", description: "フェアトレード・オーガニック栽培の二酸化炭素排出量から最適な調達ルートをグラフ解析。", prompt: "トレーサビリティ", codeSnippet: `print("Traced.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "stress-skin-tda", title: "表情・音声からストレス肌予測", description: "トポロジカルデータ解析(TDA)を用いて声の波形の「穴」を検知し、ホルモンバランス乱れ・肌荒れの予兆を警告。", prompt: "TDAストレス", codeSnippet: `print("TDA analyzed.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "ecommerce-pricing", title: "ダイナミックプライシング", description: "ECサイト訪問者の購買意欲や競合の価格変動をRL(強化学習)で学習し、利益を最大化する価格を提示。", prompt: "価格最適化", codeSnippet: `print("Pricing set.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "mmm-ad-tensor", title: "コスメ広告媒体ミックス(MMM)", description: "TV、雑誌、Instagram、TikTokの影響推移をテンソル縮約で解析し、各CPAを最小化。", prompt: "広告配分", codeSnippet: `print("MMM solved.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "virtual-ba-llm", title: "バーチャルBA(ビューティーアドバイザー)", description: "百貨店のベテラン美容部員の接客ノウハウをRAGで学習したAIがオンライン接客。", prompt: "BA接客", codeSnippet: `print("BA spoken.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "metaverse-cosmetics", title: "メタバースデジタルコスメ", description: "ゲームやメタバース空間向けアバターの「物理ベース」な質感のデジタルメイクアップデータを生成。", prompt: "アバター生成", codeSnippet: `print("Metaverse rendered.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} },
  { id: "recycle-cost-opt", title: "サステナー・リサイクル最適化", description: "容器回収の物流コストと再生素材製造コストの損益分岐をアニーリングで解明。", prompt: "コスト最適化", codeSnippet: `print("Recycling processed.")`, metrics: [], dashboard: [], businessImpact: {items: [], summary:""}, quantumComparison: {algorithm:"", rows:[], threshold:"", qubits:"", note:""}, validation:{items:[]} }
];
