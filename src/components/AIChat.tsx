import React from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useCases } from '../data/useCases';

interface Props {
  onGenerate: (useCaseId: string) => void;
  isGenerating: boolean;
  history: {role: 'user'|'assistant', content: string}[];
}

const AIChat: React.FC<Props> = ({ onGenerate, isGenerating, history }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: '1', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {history.length === 0 && (
          <div style={{ textAlign: 'center', opacity: 0.7, marginTop: '20px' }}>
            <Sparkles size={32} style={{ color: 'var(--quantum-green)', marginBottom: '16px' }} />
            <p style={{ marginBottom: '16px' }}>Quantum MaaS Copilot へようこそ。<br/>以下のシナリオから実装を選択してください：</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.length === 0 && useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => onGenerate(uc.id)}
              disabled={isGenerating}
              style={{
                textAlign: 'left',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isGenerating ? 0.5 : 1
              }}
              className="use-case-btn"
            >
              <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#eab308', marginBottom: '4px' }}>{uc.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{uc.description}</div>
            </button>
          ))}
        </div>

        {history.map((msg, idx) => (
          <div key={idx} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            background: msg.role === 'user' ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${msg.role === 'user' ? 'var(--quantum-green)' : 'var(--border-color)'}`,
            padding: '12px',
            borderRadius: '12px',
            maxWidth: '90%',
            fontSize: '0.85rem',
            lineHeight: '1.5'
          }}>
            {msg.content}
          </div>
        ))}

        {isGenerating && (
          <div style={{ alignSelf: 'flex-start', padding: '12px', color: 'var(--quantum-blue)', fontStyle: 'italic', fontSize: '0.85rem' }}>
            <span className="anim-pulse">Quantum tensors resolving...</span>
          </div>
        )}
      </div>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="プロンプトを入力..."
            disabled={true}
            style={{ width: '100%', padding: '12px', paddingRight: '40px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#fff' }}
          />
          <button
            disabled={true}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
