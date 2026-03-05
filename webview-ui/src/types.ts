export interface ScanResult {
    risk_score: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    confidence: number;
    evidence: {
        lost_updates: number;
        timeouts: number;
        exceptions: number;
        slow_responses: number;
        edge_failures: number;
    };
    failure_propagation: PropagationNode[];
    timeline: TimelineEvent[];
    logs: LogEntry[];
    root_cause: string[];
    patches: PatchItem[];
    network_activity: NetworkPoint[];
    explanation?: string;
    blast_radius?: string[];
    postmortem?: PostmortemData;
}

export interface PropagationNode {
    id: string;
    file: string;
    status: 'healthy' | 'warning' | 'failure';
    connections: string[];
}

export interface TimelineEvent {
    t: number;
    event: string;
    affected_node?: string;
}

export interface LogEntry {
    level: 'ERROR' | 'WARNING' | 'INFO';
    message: string;
    timestamp?: string;
}

export interface PatchItem {
    file: string;
    before: string;
    after: string;
    reason?: string;
}

export interface NetworkPoint {
    time: number;
    requests: number;
    errors: number;
}

export interface PostmortemData {
    summary: string;
    root_cause: string;
    impact: string;
    timeline_narrative: string;
    remediation: string;
}

export interface ScenarioRequest {
    traffic: number;
    latency: number;
    failure_rate: number;
}
