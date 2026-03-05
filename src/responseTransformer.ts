import { ScanResult } from './api/scanClient';

/**
 * Transforms the raw API response (nested under ai_analysis / simulation_results / deployment_validation)
 * into the flat ScanResult shape the React webview expects.
 */
export function transformApiResponse(raw: any): ScanResult {
    const ai = raw?.ai_analysis || {};
    const sim = raw?.simulation_results || {};
    const dep = raw?.deployment_validation || {};
    const drills = sim?.drills || {};
    const files: { file: string }[] = sim?.files || [];

    // --- Evidence ---
    const evidence = ai?.evidence || {};
    const mappedEvidence = {
        lost_updates: evidence.lost_updates?.count ?? evidence.lost_updates ?? 0,
        timeouts: evidence.timeouts?.count ?? evidence.timeouts ?? 0,
        exceptions: evidence.exceptions?.count ?? evidence.exceptions ?? 0,
        slow_responses: evidence.slow_responses?.count ?? evidence.slow_responses ?? 0,
        edge_failures: evidence.edge_failures?.count ?? evidence.edge_failures ?? 0,
    };

    // --- Failure Propagation Graph ---
    // Build nodes from files + use drills to determine status
    const fileStatuses: Record<string, 'healthy' | 'warning' | 'failure'> = {};
    (drills.chaos || []).forEach((d: any) => {
        if (d.file) fileStatuses[d.file] = d.severity === 'critical' ? 'failure' : 'warning';
    });
    (drills.latency || []).forEach((d: any) => {
        if (d.file && !fileStatuses[d.file]) {
            fileStatuses[d.file] = d.issue === 'timeout' ? 'warning' : 'healthy';
        }
    });
    (drills.concurrency || []).forEach((d: any) => {
        // concurrency issues affect all files with routes
        fileStatuses['routes.py'] = 'failure';
    });

    // Build a simple linear propagation chain from the files
    const fileNodes = files.map((f, i) => ({
        id: f.file.replace('.py', ''),
        file: f.file,
        status: fileStatuses[f.file] || 'healthy' as 'healthy' | 'warning' | 'failure',
        connections: i < files.length - 1 ? [files[i + 1].file.replace('.py', '')] : [],
    }));

    // --- Timeline ---
    // Parse the timeline string "0s traffic begins\n7s thread saturation..."
    const timelineRaw: string = ai?.timeline || '';
    const timeline = timelineRaw
        .split('\n')
        .filter(Boolean)
        .map(line => {
            const match = line.match(/^(\d+)s\s+(.+)$/);
            if (match) {
                return { t: parseInt(match[1]), event: match[2], affected_node: undefined };
            }
            return { t: 0, event: line };
        });

    // --- Logs ---
    // Combine deployment logs + chaos drill errors
    const logs: Array<{ level: 'ERROR' | 'WARNING' | 'INFO'; message: string; timestamp?: string }> = [];
    const depLogLines: string[] = (dep?.logs || '').split('\n').filter(Boolean);
    depLogLines.forEach(line => {
        if (line.startsWith('❌')) {
            logs.push({ level: 'ERROR', message: line.replace('❌ ', '') });
        } else if (line.startsWith('✅')) {
            logs.push({ level: 'INFO', message: line.replace('✅ ', '') });
        }
    });
    (drills.chaos || []).forEach((d: any) => {
        logs.push({
            level: d.severity === 'critical' ? 'ERROR' : 'WARNING',
            message: d.detail,
        });
    });
    (drills.latency || []).forEach((d: any) => {
        if (d.issue === 'timeout') {
            logs.push({ level: 'ERROR', message: d.detail });
        }
    });

    // --- Root Cause ---
    const failurePoints: Record<string, any[]> = ai?.failure_points || {};
    const root_cause: string[] = Object.entries(failurePoints).flatMap(([cat, items]) =>
        (items as any[]).map(item => `[${cat}] ${item.location}: ${item.description}`)
    );

    // Add deployment root cause if available
    if (dep?.groq_analysis?.probable_root_cause) {
        root_cause.push(`[Deployment] ${dep.groq_analysis.probable_root_cause}`);
    }

    // --- Patches ---
    const patches = (ai?.patches || []).map((p: any) => ({
        file: p.file,
        before: p.code_before || p.before || '',
        after: p.code_after || p.after || '',
        reason: p.reason || p.title || '',
    }));

    // --- Network Activity (synthetic from drills) ---
    const latencyDrills: any[] = drills.latency || [];
    const maxLatency = latencyDrills.reduce((m: number, d: any) => Math.max(m, d.simulated_latency_ms || 0), 0);
    const network_activity = [
        { time: 0, requests: 50, errors: 0 },
        { time: 10, requests: 200, errors: (drills.concurrency || []).length * 5 },
        { time: 20, requests: 300, errors: latencyDrills.filter((d: any) => d.issue === 'timeout').length * 20 },
        { time: 30, requests: 250, errors: (drills.chaos || []).length * 15 },
        { time: 40, requests: 100, errors: (drills.chaos || []).length * 10 },
    ];

    // --- Postmortem ---
    const postmortem = {
        summary: ai?.explanation
            ? ai.explanation.substring(0, 150) + '...'
            : 'Production simulation complete.',
        root_cause: dep?.groq_analysis?.probable_root_cause || root_cause[0] || 'See failure points.',
        impact: `Risk score: ${ai?.risk_score ?? 0}/100. ${(ai?.blast_radius || []).join(', ')} affected.`,
        timeline_narrative: timelineRaw.replace(/\n/g, ' → '),
        remediation: dep?.groq_analysis?.fix_suggestion
            || (ai?.patches || []).map((p: any, i: number) => `${i + 1}. ${p.reason || p.title}`).join(' ')
            || 'See patches.',
    };

    return {
        risk_score: ai?.risk_score ?? raw?.overall_score ?? 0,
        severity: ai?.severity ?? 'LOW',
        confidence: ai?.confidence ?? 0,
        evidence: mappedEvidence,
        failure_propagation: fileNodes.length > 0 ? fileNodes : [
            { id: 'app', file: 'app.py', status: 'failure', connections: ['routes'] },
            { id: 'routes', file: 'routes.py', status: 'failure', connections: ['db'] },
            { id: 'db', file: 'db.py', status: 'warning', connections: [] },
        ],
        timeline: timeline.length > 0 ? timeline : [
            { t: 0, event: 'Simulation started', affected_node: undefined }
        ],
        logs: logs.length > 0 ? logs : [{ level: 'INFO', message: 'Simulation complete.' }],
        root_cause: root_cause.length > 0 ? root_cause : ['See simulation output.'],
        patches,
        network_activity,
        explanation: ai?.explanation,
        blast_radius: ai?.blast_radius,
        postmortem,
    };
}
