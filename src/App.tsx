import { useState } from 'react';
import { Bot, Code2, Cpu } from 'lucide-react';
import AIChat from './components/AIChat';
import CodeEditor from './components/CodeEditor';
import LivePreview from './components/LivePreview';
import { useCases } from './data/useCases';
import type { UseCase } from './data/useCases';
import './index.css';

function App() {
  const [activeUseCase, setActiveUseCase] = useState<UseCase>(useCases[0]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<{role: 'user'|'assistant', content: string}[]>([]);

  const handleGenerateCommand = (useCaseId: string) => {
    const matchedUseCase = useCases.find(uc => uc.id === useCaseId) || useCases[0];
    
    setHistory(prev => [
      ...prev,
      { role: 'user', content: matchedUseCase.prompt }
    ]);
    
    setIsGenerating(true);
    setGeneratedCode('// テンソルネットワークを構築中...\n// APIエンドポイントへ接続中...');

    setTimeout(() => {
      setGeneratedCode(matchedUseCase.codeSnippet);
      setActiveUseCase(matchedUseCase);
      setIsGenerating(false);
      setHistory(prev => [
        ...prev,
        { role: 'assistant', content: "Quantum Execution Completed: 予測モデルの構築に成功しました。" }
      ]);
    }, 2800);
  };

  return (
    <div className="app-container">
      <div className="pane glass-panel" style={{ flex: '0 0 400px' }}>
        <div className="pane-header">
          <Bot size={18} color="var(--quantum-pink)" />
          <span>Beauty & Cosmetics Vibe Coder</span>
        </div>
        <div className="pane-content">
          <AIChat onGenerate={handleGenerateCommand} isGenerating={isGenerating} history={history} />
        </div>
      </div>

      <div className="pane glass-panel" style={{ flex: '1.2' }}>
        <div className="pane-header">
          <Code2 size={18} color="var(--quantum-blue)" />
          <span>quantum_beauty_engine.py</span>
        </div>
        <div className="pane-content">
          <CodeEditor code={generatedCode} isGenerating={isGenerating} />
        </div>
      </div>

      <div className="pane glass-panel" style={{ flex: '0 0 500px' }}>
        <div className="pane-header">
          <Cpu size={18} color="#f472b6" />
          <span>ライブダッシュボード (Beauty Control Center)</span>
        </div>
        <div className="pane-content" style={{ padding: '16px' }}>
          <LivePreview activeUseCase={activeUseCase} />
        </div>
      </div>
    </div>
  );
}

export default App;
