import React from 'react';

interface Props {
    causes: string[];
}

export const RootCause: React.FC<Props> = ({ causes }) => {
    return (
        <div className="section fade-in fade-in-delay-4">
            <div className="section-title">
                <span className="icon">🔍</span> Root Cause Analysis
            </div>
            <ul className="root-cause-list">
                {causes.map((cause, i) => (
                    <li className="root-cause-item" key={i}>
                        <div className="root-cause-icon">{i + 1}</div>
                        <span>{cause}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
