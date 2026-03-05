import React, { useState, useEffect } from 'react';

interface Props {
    score: number;
    severity: string;
    confidence: number;
}

export const RiskScore: React.FC<Props> = ({ score, severity, confidence }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const [displayConf, setDisplayConf] = useState(0);
    const sev = severity.toLowerCase();

    useEffect(() => {
        let frame: number;
        const start = performance.now();
        const duration = 1200;

        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplayScore(Math.round(eased * score));
            setDisplayConf(Math.round(eased * confidence));
            if (progress < 1) {
                frame = requestAnimationFrame(animate);
            }
        };

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score, confidence]);

    return (
        <div className="section risk-score-card fade-in">
            <div className="section-title">
                <span className="icon">🎯</span> Production Risk Score
            </div>
            <div className={`risk-score-value ${sev}`}>{displayScore}</div>
            <div className={`risk-severity-badge ${sev}`}>{severity}</div>
            <div className="risk-confidence">
                Confidence: <span>{displayConf}%</span>
            </div>
        </div>
    );
};
