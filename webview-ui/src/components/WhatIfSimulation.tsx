import React, { useState } from 'react';
import { ScenarioRequest } from '../types';

interface Props {
    onRunScenario: (scenario: ScenarioRequest) => void;
    isSimulating: boolean;
    baseScore?: number;
    scenarioScore?: number;
}

export const WhatIfSimulation: React.FC<Props> = ({ onRunScenario, isSimulating, baseScore, scenarioScore }) => {
    const [traffic, setTraffic] = useState(200);
    const [latency, setLatency] = useState(0);
    const [failureRate, setFailureRate] = useState(0);

    const scoreDelta = scenarioScore !== undefined && baseScore !== undefined
        ? scenarioScore - baseScore
        : null;

    return (
        <div className="section fade-in fade-in-delay-5">
            <div className="section-title">
                <span className="icon">🧪</span> What-If Scenario Simulation
            </div>

            {/* Show scenario result delta if available */}
            {!isSimulating && scenarioScore !== undefined && scoreDelta !== null && (
                <div style={{
                    background: scoreDelta > 0 ? 'rgba(255,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                    border: `1px solid ${scoreDelta > 0 ? '#ff4444' : '#22c55e'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '13px',
                }}>
                    <span style={{ fontSize: '20px' }}>{scoreDelta > 0 ? '📈' : '📉'}</span>
                    <div>
                        <strong>Scenario Result:</strong> Risk score changed from{' '}
                        <strong>{baseScore}</strong> → <strong>{scenarioScore}</strong>
                        {' '}
                        <span style={{ color: scoreDelta > 0 ? '#ff4444' : '#22c55e', fontWeight: 700 }}>
                            ({scoreDelta > 0 ? '+' : ''}{scoreDelta} points)
                        </span>
                        <div style={{ opacity: 0.7, fontSize: '11px', marginTop: '3px' }}>
                            The dashboard above has been updated to reflect the scenario conditions.
                        </div>
                    </div>
                </div>
            )}

            {isSimulating && (
                <div style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid #7c3aed',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}>
                    <span style={{ fontSize: '16px' }}>⚙️</span>
                    Running scenario simulation — re-zipping workspace and sending to AI backend...
                </div>
            )}

            <div className="whatif-controls">
                <div className="whatif-control">
                    <label className="whatif-label">Traffic Load (Concurrent Users)</label>
                    <div className="whatif-slider-row">
                        <input
                            type="range" className="whatif-slider"
                            min="10" max="1000" step="10"
                            value={traffic}
                            onChange={(e) => setTraffic(Number(e.target.value))}
                        />
                        <span className="whatif-value">{traffic}</span>
                    </div>
                </div>

                <div className="whatif-control">
                    <label className="whatif-label">Inject Latency (ms)</label>
                    <div className="whatif-slider-row">
                        <input
                            type="range" className="whatif-slider"
                            min="0" max="5000" step="100"
                            value={latency}
                            onChange={(e) => setLatency(Number(e.target.value))}
                        />
                        <span className="whatif-value">+{latency}ms</span>
                    </div>
                </div>

                <div className="whatif-control">
                    <label className="whatif-label">External Failure Rate (%)</label>
                    <div className="whatif-slider-row">
                        <input
                            type="range" className="whatif-slider"
                            min="0" max="100" step="5"
                            value={failureRate}
                            onChange={(e) => setFailureRate(Number(e.target.value))}
                        />
                        <span className="whatif-value">{failureRate}%</span>
                    </div>
                </div>
            </div>

            <button
                className="whatif-run-btn"
                onClick={() => onRunScenario({ traffic, latency, failure_rate: failureRate })}
                disabled={isSimulating}
            >
                {isSimulating ? '🧪 Running Scenario...' : '▶ Run Scenario'}
            </button>
        </div>
    );
};
