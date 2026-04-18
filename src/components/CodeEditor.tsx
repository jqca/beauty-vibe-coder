import { useEffect, useState, useRef } from 'react';

interface CodeEditorProps {
  code: string;
  isGenerating: boolean;
}

export default function CodeEditor({ code, isGenerating }: CodeEditorProps) {
  const [displayCode, setDisplayCode] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!code) { setDisplayCode(''); return; }
    let i = 0;
    setDisplayCode('');
    const interval = setInterval(() => {
      setDisplayCode(code.substring(0, i + 20)); // 20文字ずつ高速表示
      i += 20;
      if (i >= code.length) { setDisplayCode(code); clearInterval(interval); }
    }, 10);
    return () => clearInterval(interval);
  }, [code]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [displayCode]);

  return (
    <div ref={containerRef} style={{
      height: '100%', fontFamily: 'var(--font-mono)', padding: '16px',
      fontSize: '0.85rem', lineHeight: '1.5', background: '#0d1117', overflow: 'auto', position: 'relative'
    }}>
      {isGenerating && !displayCode ? (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: 'var(--quantum-blue)' }}>
          <div className="anim-pulse" style={{ fontSize: '2rem', marginBottom: '8px' }}>&#9889;</div>
          AIがコードを生成中...
        </div>
      ) : (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          <code>
            {displayCode.split('\n').map((line, idx) => {
              let color = 'var(--text-main)';
              const t = line.trim();
              if (t.startsWith('<!--') || t.startsWith('//') || t.startsWith('#')) color = 'var(--text-muted)';
              else if (t.startsWith('<') && t.includes('>')) color = '#ff7b72';
              else if (t.startsWith('function') || t.startsWith('const ') || t.startsWith('let ') || t.startsWith('var ')) color = '#79c0ff';
              else if (line.includes('"') || line.includes("'") || line.includes('`')) color = '#a5d6ff';
              return (
                <div key={idx} style={{ display: 'flex' }}>
                  <span style={{ minWidth: '40px', color: 'rgba(255,255,255,0.2)', userSelect: 'none' }}>{idx + 1}</span>
                  <span style={{ color }}>{line}</span>
                </div>
              );
            })}
          </code>
        </pre>
      )}
    </div>
  );
}
