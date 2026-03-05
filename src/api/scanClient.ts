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

/** Sleep helper */
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendScanRequest(
    baseUrl: string,
    zipBuffer: Buffer,
    scenario?: { traffic: number; latency: number; failure_rate: number }
): Promise<ScanResult> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

        try {
            const response = await axios.post<ScanResult>(`${baseUrl}/scan`, form, {
                headers,
                timeout: 120000, // 2 minutes
                maxContentLength: 50 * 1024 * 1024,
                maxBodyLength: 50 * 1024 * 1024,
            });

            return response.data;
        } catch (error: any) {
            const status = error?.response?.status;
            // Retry on 503 (Lambda cold start / throttle) or 502 (gateway timeout)
            const isRetryable = status === 503 || status === 502 || status === 429 || !status;

            if (isRetryable && attempt < maxRetries) {
                const delay = attempt * 3000; // 3s, 6s backoff
                console.warn(`BlastShield: Attempt ${attempt} failed (${status ?? 'network error'}) — retrying in ${delay / 1000}s...`);
                await sleep(delay);
                continue;
            }

            // Final attempt failed — re-throw
            throw error;
        }
    }

    throw new Error('Failed after maximum retries');
}
