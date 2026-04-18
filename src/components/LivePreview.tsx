import React from 'react';
import type { UseCase } from '../data/useCases';
import { Truck, TrendingUp, TrendingDown, Zap, ShieldCheck, Target } from 'lucide-react';

interface Props {
  activeUseCase: UseCase;
}

const LivePreview: React.FC<Props> = ({ activeUseCase }) => {
  const isActionMode = activeUseCase.id.includes('qaoa') || activeUseCase.id.includes('routing') || activeUseCase.id.includes('vqe') || activeUseCase.id.includes('sync') || activeUseCase.id.includes('swarm');
  
  let statusClass = '';
  if (isActionMode) statusClass = 'action-mode';

  const getTrendIcon = (trend: string, active: boolean) => {
    const color = active ? "#eab308" : "#2dd4bf"; // neon yellow : teal
    if (trend === 'up') return <TrendingUp size={20} color={color} />;
    if (trend === 'down') return <TrendingDown size={20} color={color} />;
    return <Truck size={20} color={color} />;
  };

  return (
    <div className="preview-container">
      {/* 3D / Graph Visualization Box */}
      <div className={`visualization-box ${statusClass}`}>
        
        {/* Mobility specific: Radar sweep or Network nodes */}
        <div className="radar-sweep"></div>
        <div className="mobility-node" style={{top: '30%', left: '20%'}}></div>
        <div className="mobility-node" style={{top: '60%', left: '70%'}}></div>
        <div className="mobility-node" style={{top: '40%', left: '50%'}}></div>
        <div className="mobility-node" style={{top: '80%', left: '30%'}}></div>
        <div className="mobility-node" style={{top: '20%', left: '80%'}}></div>

        {isActionMode && (
          <svg className="connection-lines" width="100%" height="100%" style={{position: 'absolute', top: 0, left: 0}}>
            <line x1="20%" y1="30%" x2="50%" y2="40%" stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" className="dash-anim"/>
            <line x1="50%" y1="40%" x2="70%" y2="60%" stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" className="dash-anim" style={{animationDelay: '0.2s'}}/>
            <line x1="50%" y1="40%" x2="30%" y2="80%" stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" className="dash-anim" style={{animationDelay: '0.4s'}}/>
            <line x1="70%" y1="60%" x2="80%" y2="20%" stroke="#eab308" strokeWidth="2" strokeDasharray="5,5" className="dash-anim" style={{animationDelay: '0.1s'}}/>
          </svg>
        )}

        <div className={`viz-overlay ${statusClass}`}>
            {isActionMode ? 'MAAS FLEET ROUTING ACTIVE' : 'NETWORK STANDBY'}
        </div>
      </div>
      
      {/* Standard KPI Metrics */}
      <div className="metrics-grid">
        {activeUseCase.metrics.map((m, idx) => (
          <div key={idx} className={`metric-card ${statusClass}`}>
            <div>
              <div className="metric-label">{m.label}</div>
              <div className="metric-value">{m.value}</div>
            </div>
            <div>
               {getTrendIcon(m.trend, isActionMode)}
            </div>
          </div>
        ))}
      </div>

      {/* NEW PANELS FOR MOBILITY APP */}
      <div className="insights-panel">
        
        {/* Business Impact */}
        <div className={`insight-card impact-card ${statusClass}`}>
          <div className="card-header">
            <Target size={16} className="insight-icon" />
            <span>経営インパクト (Business Impact)</span>
          </div>
          <div className="card-body impact-text">
             {activeUseCase.businessImpact}
          </div>
        </div>

        {/* Quantum vs Classical */}
        <div className={`insight-card qvc-card ${statusClass}`}>
          <div className="card-header">
            <Zap size={16} className="insight-icon" />
            <span>量子シミュレーター vs 古典計算機</span>
          </div>
          <div className="card-body">
            <div className="qvc-row">
              <span className="qvc-label">古典 (Classical)</span>
              <span className="qvc-time classical-time">{activeUseCase.quantumVsClassical.classicalTime}</span>
            </div>
            <div className="qvc-bar-container">
               <div className="qvc-bar classical-bar"></div>
            </div>
            
            <div className="qvc-row mt-2">
              <span className="qvc-label">量子 (Quantum Advantage)</span>
              <span className="qvc-time quantum-time">{activeUseCase.quantumVsClassical.quantumTime}</span>
            </div>
            <div className="qvc-bar-container">
               <div className="qvc-bar quantum-bar"></div>
            </div>
            
            <div className="advantage-text">
               {activeUseCase.quantumVsClassical.advantage}
            </div>
          </div>
        </div>

        {/* Verification Summary */}
        <div className={`insight-card verify-card ${statusClass}`}>
           <div className="card-header">
            <ShieldCheck size={16} className="insight-icon" />
            <span>検証・信頼性サマリー (Safety & Compliance)</span>
          </div>
          <div className="card-body verify-text">
             {activeUseCase.verificationSummary}
          </div>
        </div>

      </div>

    </div>
  );
};

export default LivePreview;
