import React from 'react';
import { LogEntry } from '../types';

interface Props {
    logs: LogEntry[];
}

export const LogsViewer: React.FC<Props> = ({ logs }) => {
    return (
        <div className="section fade-in fade-in-delay-3">
            <div className="section-title">
                <span className="icon">📋</span> Runtime Logs
            </div>
            <div className="logs-panel">
                {logs.map((log, i) => (
                    <div className="log-entry" key={i}>
                        {log.timestamp && (
                            <span className="log-timestamp">{log.timestamp}</span>
                        )}
                        <span className={`log-level ${log.level.toLowerCase()}`}>
                            {log.level}
                        </span>
                        <span className={`log-message ${log.level.toLowerCase()}`}>
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
