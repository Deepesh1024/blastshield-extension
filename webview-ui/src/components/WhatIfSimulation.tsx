import React, { useState } from 'react';
import { ScenarioRequest } from '../types';

interface Props {
    onRunScenario: (scenario: ScenarioRequest) => void;
    isSimulating: boolean;
}

export const WhatIfSimulation: React.FC<Props> = ({ onRunScenario, isSimulating }) => {
    const [traffic, setTraffic] = useState(200);
    const [latency, setLatency] = useState(0);
    const [failureRate, setFailureRate] = useState(0);

    return (
        <div className="section fade-in fade-in-delay-5">
            <div className="section-title">
                <span className="icon">🧪</span> What-If Scenario Simulation
            </div>

            <div className="whatif-controls">
                <div className="whatif-control">
                    <label className="whatif-label">Traffic Load (Concurrent Users)</label>
                    <div className="whatif-slider-row">
                        <input
                            type="range"
                            className="whatif-slider"
                            min="10"
                            max="1000"
                            step="10"
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
                            type="range"
                            className="whatif-slider"
                            min="0"
                            max="5000"
                            step="100"
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
                            type="range"
                            className="whatif-slider"
                            min="0"
                            max="100"
                            step="5"
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
                {isSimulating ? '🧪 Simulating...' : '▶ Run Scenario'}
            </button>
        </div>
    );
};
