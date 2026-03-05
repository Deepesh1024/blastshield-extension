import React from 'react';
import { PatchItem } from '../types';

interface Props {
    patches: PatchItem[];
}

export const PatchViewer: React.FC<Props> = ({ patches }) => {
    return (
        <div className="section fade-in fade-in-delay-4">
            <div className="section-title">
                <span className="icon">🩹</span> Recommended Patches
            </div>
            {patches.map((patch, i) => (
                <div className="patch-card" key={i}>
                    <div className="patch-header">
                        <span className="patch-filename">📄 {patch.file}</span>
                    </div>
                    {patch.reason && (
                        <div className="patch-reason">{patch.reason}</div>
                    )}
                    <div className="patch-diff">
                        <div className="patch-side before">
                            <span className="patch-side-label">— Before</span>
                            <code>{patch.before}</code>
                        </div>
                        <div className="patch-side after">
                            <span className="patch-side-label">+ After</span>
                            <code>{patch.after}</code>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
