import axios from 'axios';
import FormData from 'form-data';

export interface ScanResult {
    risk_score: number;
    severity: string;
    confidence: number;
    evidence: {
        lost_updates: number;
        timeouts: number;
        exceptions: number;
        slow_responses: number;
        edge_failures: number;
    };
    failure_propagation: Array<{
        id: string;
        file: string;
        status: 'healthy' | 'warning' | 'failure';
        connections: string[];
    }>;
    timeline: Array<{
        t: number;
        event: string;
        affected_node?: string;
    }>;
    logs: Array<{
        level: 'ERROR' | 'WARNING' | 'INFO';
        message: string;
        timestamp?: string;
    }>;
    root_cause: string[];
    patches: Array<{
        file: string;
        before: string;
        after: string;
        reason?: string;
    }>;
    network_activity: Array<{
        time: number;
        requests: number;
        errors: number;
    }>;
    explanation?: string;
    blast_radius?: string[];
    postmortem?: {
        summary: string;
        root_cause: string;
        impact: string;
        timeline_narrative: string;
        remediation: string;
    };
}

export async function sendScanRequest(
    baseUrl: string,
    zipBuffer: Buffer,
    scenario?: { traffic: number; latency: number; failure_rate: number }
): Promise<ScanResult> {
    const form = new FormData();
    form.append('file', zipBuffer, {
        filename: 'project.zip',
        contentType: 'application/zip',
    });

    if (scenario) {
        form.append('scenario', JSON.stringify(scenario));
    }

    const headers = {
        ...form.getHeaders()
    };

    const response = await axios.post<ScanResult>(`${baseUrl}/scan`, form, {
        headers,
        timeout: 120000, // 2 minutes
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024,
    });

    return response.data;
}
