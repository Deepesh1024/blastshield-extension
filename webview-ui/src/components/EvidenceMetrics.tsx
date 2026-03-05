import React, { useState, useEffect } from 'react';
import { ScanResult } from '../types';

interface Props {
    evidence: ScanResult['evidence'];
}

const METRIC_CONFIG: Array<{
    key: keyof ScanResult['evidence'];
    label: string;
    icon: string;
}> = [
        { key: 'lost_updates', label: 'Lost Updates', icon: '💥' },
        { key: 'timeouts', label: 'Timeouts', icon: '⏱' },
        { key: 'exceptions', label: 'Exceptions', icon: '🔴' },
        { key: 'slow_responses', label: 'Slow Responses', icon: '🐌' },
        { key: 'edge_failures', label: 'Edge Failures', icon: '⚡' },
    ];

const AnimatedCounter: React.FC<{ target: number }> = ({ target }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) {
            setCount(0);
            return;
        }

        let frame: number;
        const start = performance.now();
        const duration = 1500;

        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [target]);

    return <span>{count.toLocaleString()}</span>;
};

export const EvidenceMetrics: React.FC<Props> = ({ evidence }) => {
    return (
        <div className="section fade-in fade-in-delay-1">
            <div className="section-title">
                <span className="icon">📊</span> Evidence Metrics
            </div>
            <div className="evidence-grid">
                {METRIC_CONFIG.map(({ key, label, icon }) => (
                    <div className="metric-card" key={key}>
                        <div className="metric-value">
                            <AnimatedCounter target={evidence[key]} />
                        </div>
                        <div className="metric-label">
                            {icon} {label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
