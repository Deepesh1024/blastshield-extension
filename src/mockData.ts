// Shared mock data used as fallback/merge base for missing backend fields
export const MOCK_DATA = {
    risk_score: 74,
    severity: 'CRITICAL',
    confidence: 86,
    evidence: {
        lost_updates: 150,
        timeouts: 12,
        exceptions: 210,
        slow_responses: 18,
        edge_failures: 720,
    },
    failure_propagation: [
        { id: 'app', file: 'app.py', status: 'healthy', connections: ['routes'] },
        { id: 'routes', file: 'routes.py', status: 'failure', connections: ['services', 'auth'] },
        { id: 'auth', file: 'auth.py', status: 'warning', connections: ['db'] },
        { id: 'services', file: 'services.py', status: 'warning', connections: ['db', 'cache'] },
        { id: 'cache', file: 'cache.py', status: 'healthy', connections: [] },
        { id: 'db', file: 'db.py', status: 'failure', connections: [] },
    ],
    timeline: [
        { t: 0, event: 'Traffic begins — 200 concurrent users', affected_node: 'app' },
        { t: 7, event: 'Thread pool saturation detected', affected_node: 'routes' },
        { t: 15, event: 'Duplicate order writes detected', affected_node: 'routes' },
        { t: 22, event: 'Auth token cache miss spike', affected_node: 'auth' },
        { t: 25, event: 'Checkout failures begin cascading', affected_node: 'services' },
        { t: 33, event: 'Database connection pool exhausted', affected_node: 'db' },
        { t: 40, event: 'Full cascade — system unresponsive', affected_node: 'db' },
    ],
    logs: [
        { level: 'INFO', message: 'Simulation started — 200 concurrent users', timestamp: '00:00:00' },
        { level: 'WARNING', message: 'Thread pool utilization at 85%', timestamp: '00:00:07' },
        { level: 'ERROR', message: 'Race condition on order_counter — duplicate writes', timestamp: '00:00:15' },
        { level: 'ERROR', message: 'ConnectionPool: max connections (20) reached', timestamp: '00:00:33' },
        { level: 'ERROR', message: 'System unresponsive — all workers blocked', timestamp: '00:00:40' },
    ],
    root_cause: [
        'Race condition on order_counter in routes.py',
        'Database connection pool sized at 20 for 200 concurrent users',
        'No circuit breaker between services.py and db.py',
    ],
    patches: [
        {
            file: 'routes.py',
            before: 'order_counter += 1',
            after: 'with threading.Lock():\n    order_counter += 1',
            reason: 'Thread-safe locking to prevent race conditions',
        },
    ],
    network_activity: [
        { time: 0, requests: 20, errors: 0 },
        { time: 10, requests: 150, errors: 2 },
        { time: 20, requests: 180, errors: 35 },
        { time: 30, requests: 120, errors: 80 },
        { time: 40, requests: 10, errors: 8 },
    ],
    explanation: 'System experiences cascade failure under concurrent load.',
    blast_radius: [
        'Order Processing — duplicate/lost orders',
        'Database Layer — connection exhaustion',
    ],
    postmortem: {
        summary: 'Production simulation revealed a critical cascade failure.',
        root_cause: 'Unsynchronized shared mutable state and under-provisioned database connection pool.',
        impact: 'Complete system outage affecting all checkout operations.',
        timeline_narrative: '0s: Traffic begins. 33s: DB pool exhausted. 40s: Full outage.',
        remediation: '1. Add threading locks. 2. Scale connection pool. 3. Add circuit breakers.',
    },
};
