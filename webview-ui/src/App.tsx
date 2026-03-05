import React, { useState, useEffect } from 'react';
import { ScanResult, ScenarioRequest } from './types';
import { MOCK_DATA } from './mockData';

// Components
import { SeverityBanner } from './components/SeverityBanner';
import { RiskScore } from './components/RiskScore';
import { EvidenceMetrics } from './components/EvidenceMetrics';
import { PropagationGraph } from './components/PropagationGraph';
import { TimelineReplay } from './components/TimelineReplay';
import { LogsViewer } from './components/LogsViewer';
import { RootCause } from './components/RootCause';
import { PatchViewer } from './components/PatchViewer';
import { WhatIfSimulation } from './components/WhatIfSimulation';
import { PostmortemReport } from './components/PostmortemReport';
import { NetworkGraph } from './components/NetworkGraph';

// VS Code API connection
const vscode = typeof window !== 'undefined' && (window as any).acquireVsCodeApi
    ? (window as any).acquireVsCodeApi()
    : {
        postMessage: (msg: any) => console.log('VSCode Message:', msg)
    };

export default function App() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'scenario'>('idle');
    const [result, setResult] = useState<ScanResult | null>(null);
    const [activeNode, setActiveNode] = useState<string | undefined>();
    const [isDemo, setIsDemo] = useState(false);
    const [baseScore, setBaseScore] = useState<number | undefined>();
    const [scenarioScore, setScenarioScore] = useState<number | undefined>();

    useEffect(() => {
        // Listen for messages from the extension
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'scanStart':
                    // Re-signal ready so extension knows the webview is listening
                    vscode.postMessage({ type: 'ready' });
                    setStatus('loading');
                    setIsDemo(false);
                    break;
                case 'scanResult':
                    setResult(message.data);
                    setBaseScore(message.data?.risk_score);
                    setScenarioScore(undefined);
                    setStatus('success');
                    setIsDemo(false);
                    break;
                case 'scanError':
                    console.error(message.error);
                    setResult(MOCK_DATA);
                    setBaseScore(MOCK_DATA.risk_score);
                    setScenarioScore(undefined);
                    setStatus('success');
                    setIsDemo(true);
                    break;
                case 'scenarioResult':
                    if (result) {
                        const newResult = { ...result, ...message.data };
                        setResult(newResult);
                        setScenarioScore(newResult.risk_score);
                        setStatus('success');
                    }
                    break;
                case 'scenarioError':
                    console.error(message.error);
                    // Show demo scenario update on failure
                    if (isDemo && result) {
                        const demoScore = Math.min(100, result.risk_score + 8);
                        setResult({ ...result, risk_score: demoScore });
                        setScenarioScore(demoScore);
                    }
                    setStatus('success');
                    break;
            }
        };

        window.addEventListener('message', handleMessage);

        // Signal ready to VS Code extension
        vscode.postMessage({ type: 'ready' });

        // Auto-trigger if we don't receive anything within 500ms (useful for local browser dev)
        const timeout = setTimeout(() => {
            if (status === 'idle' && !((window as any).acquireVsCodeApi)) {
                console.log('Running in browser dev mode — loading mock data');
                setResult(MOCK_DATA);
                setStatus('success');
                setIsDemo(true);
            }
        }, 500);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearTimeout(timeout);
        };
    }, [result, status]);

    const handleRunSimulation = () => {
        setStatus('loading');
        vscode.postMessage({ type: 'runSimulation' });
    };

    const handleRunScenario = (scenario: ScenarioRequest) => {
        setStatus('scenario');
        vscode.postMessage({ type: 'runScenario', data: scenario });

        // Simulate locally if in demo mode (backend may not support scenarios)
        if (isDemo && result) {
            setTimeout(() => {
                const trafficFactor = Math.max(1, scenario.traffic / 200);
                const latencyImpact = Math.floor(scenario.latency / 500);
                const failureImpact = Math.floor(scenario.failure_rate / 10);
                const newScore = Math.min(100, Math.round(result.risk_score * trafficFactor) + latencyImpact + failureImpact);
                const updated = {
                    ...result,
                    risk_score: newScore,
                    severity: (newScore >= 76 ? 'CRITICAL' : newScore >= 51 ? 'HIGH' : newScore >= 26 ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                    evidence: {
                        ...result.evidence,
                        timeouts: result.evidence.timeouts + latencyImpact * 3,
                        exceptions: result.evidence.exceptions + failureImpact * 10,
                        slow_responses: result.evidence.slow_responses + latencyImpact * 5,
                    }
                };
                setResult(updated);
                setScenarioScore(newScore);
                setStatus('success');
            }, 1800);
        }
    };

    const getLogoUri = () => {
        // Check injected global variable from htmlTemplate
        if (typeof window !== 'undefined' && (window as any).__BLASTSHIELD_LOGO__) {
            return (window as any).__BLASTSHIELD_LOGO__;
        }
        return ''; // Fallback
    };

    // Render logic...
    if (status === 'idle') {
        return (
            <div className="app-container">
                <div className="idle-state fade-in">
                    <div className="idle-icon">🛡️</div>
                    <h2>BlastShield Studio</h2>
                    <p>Production Stress Testing Lab</p>
                    <div className="run-button-wrapper" style={{ marginTop: '24px' }}>
                        <button className="run-button" onClick={handleRunSimulation}>
                            <span className="play-icon">▶</span> Run Production Simulation
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className="app-container">
                <div className="loading-container fade-in">
                    <div className="loading-spinner"></div>
                    <div className="loading-text">
                        Injecting failure profiles and simulating production load...
                    </div>
                </div>
            </div>
        );
    }

    if (!result) return null;

    return (
        <div className="app-container">
            <header className="app-header fade-in">
                {getLogoUri() ? (
                    <img src={getLogoUri()} alt="BlastShield Logo" className="logo" />
                ) : (
                    <div className="logo" style={{ background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
                )}
                <div>
                    <h1>BlastShield Studio</h1>
                    <div className="subtitle">Production Incident Simulator</div>
                </div>
                {isDemo && <div className="demo-badge">OFFLINE DEMO</div>}
            </header>

            <div className="run-button-wrapper fade-in">
                <button className="run-button" onClick={handleRunSimulation} disabled={status === 'scenario'}>
                    <span className="play-icon">↺</span> Re-run Full Simulation
                </button>
            </div>

            <SeverityBanner severity={result.severity} />

            <div className="risk-evidence-grid">
                <RiskScore
                    score={result.risk_score}
                    severity={result.severity}
                    confidence={result.confidence}
                />
                <EvidenceMetrics evidence={result.evidence} />
            </div>

            <div className="two-col-grid">
                <PropagationGraph
                    propagation={result.failure_propagation}
                    activeNodeId={activeNode}
                />
                <div>
                    <TimelineReplay
                        events={result.timeline}
                        onNodeActive={setActiveNode}
                    />
                    <NetworkGraph data={result.network_activity} />
                </div>
            </div>

            {result.explanation && (
                <div className="explanation-text fade-in-delay-3" style={{ margin: '20px 0' }}>
                    <strong>Incident Summary:</strong> {result.explanation}
                </div>
            )}

            <div className="two-col-grid">
                <div>
                    <LogsViewer logs={result.logs} />
                    {result.blast_radius && (
                        <div className="section fade-in-delay-4" style={{ marginTop: '20px' }}>
                            <div className="section-title">
                                <span className="icon">💥</span> Blast Radius Impact
                            </div>
                            <ul className="blast-radius-list">
                                {result.blast_radius.map((br, i) => (
                                    <li className="blast-radius-item" key={i}>
                                        <div className="blast-radius-dot" />
                                        {br}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <div>
                    <RootCause causes={result.root_cause} />
                    <PatchViewer patches={result.patches} />
                </div>
            </div>

            <PostmortemReport data={result.postmortem} />

            <WhatIfSimulation
                onRunScenario={handleRunScenario}
                isSimulating={status === 'scenario'}
                baseScore={baseScore}
                scenarioScore={scenarioScore}
            />
        </div>
    );
}
