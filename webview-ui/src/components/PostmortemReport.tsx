import React, { useState } from 'react';
import { PostmortemData } from '../types';

interface Props {
    data?: PostmortemData;
}

export const PostmortemReport: React.FC<Props> = ({ data }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!data) return null;

    return (
        <div className="section fade-in fade-in-delay-5">
            <div className="section-title">
                <span className="icon">📝</span> Incident Postmortem Generator
            </div>

            {!isOpen ? (
                <button className="postmortem-btn" onClick={() => setIsOpen(true)}>
                    📄 Generate Postmortem Report
                </button>
            ) : (
                <div className="postmortem-section fade-in">
                    <div className="postmortem-block">
                        <div className="postmortem-label">Summary</div>
                        <div className="postmortem-text">{data.summary}</div>
                    </div>

                    <div className="postmortem-block">
                        <div className="postmortem-label">Root Cause</div>
                        <div className="postmortem-text">{data.root_cause}</div>
                    </div>

                    <div className="postmortem-block">
                        <div className="postmortem-label">Impact Assessment</div>
                        <div className="postmortem-text">{data.impact}</div>
                    </div>

                    <div className="postmortem-block">
                        <div className="postmortem-label">Timeline Narrative</div>
                        <div className="postmortem-text">{data.timeline_narrative}</div>
                    </div>

                    <div className="postmortem-block" style={{ marginBottom: 0 }}>
                        <div className="postmortem-label">Recommended Remediation</div>
                        <div className="postmortem-text" style={{ whiteSpace: 'pre-line' }}>
                            {data.remediation}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
