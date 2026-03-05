import React, { useState, useEffect } from 'react';
import { TimelineEvent } from '../types';

interface Props {
    events: TimelineEvent[];
    onNodeActive: (nodeId?: string) => void;
}

export const TimelineReplay: React.FC<Props> = ({ events, onNodeActive }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const maxTime = events.length > 0 ? events[events.length - 1].t : 0;
    const currentTime = events[currentIndex]?.t || 0;
    const progressPercent = maxTime > 0 ? (currentTime / maxTime) * 100 : 0;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying) {
            if (currentIndex < events.length - 1) {
                timer = setTimeout(() => {
                    setCurrentIndex((prev) => prev + 1);
                }, 1500); // 1.5s per event step for demo purposes
            } else {
                setIsPlaying(false);
            }
        }

        // Notify parent about active node to trigger flash
        onNodeActive(events[currentIndex]?.affected_node);

        return () => clearTimeout(timer);
    }, [isPlaying, currentIndex, events, onNodeActive]);

    const handleReplay = () => {
        setCurrentIndex(0);
        setIsPlaying(true);
    };

    return (
        <div className="section fade-in fade-in-delay-2">
            <div className="section-title">
                <span className="icon">⏱</span> Incident Replay Timeline
            </div>

            <div className="timeline-container">
                <div className="timeline-track">
                    <div className="timeline-line">
                        <div
                            className="timeline-progress"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>

                    {events.map((event, index) => {
                        const isPast = index < currentIndex;
                        const isActive = index === currentIndex;

                        return (
                            <div
                                key={index}
                                className={`timeline-event ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                                onClick={() => {
                                    setCurrentIndex(index);
                                    setIsPlaying(false);
                                }}
                            >
                                <div className="timeline-dot" />
                                <div className="timeline-time">{event.t}s</div>
                                <div className="timeline-event-text">{event.event}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ textAlign: 'center' }}>
                <button
                    className="replay-button"
                    onClick={handleReplay}
                    disabled={isPlaying}
                >
                    <span>{isPlaying ? '⏸ Replaying...' : '▶ Replay Incident'}</span>
                </button>
            </div>
        </div>
    );
};
