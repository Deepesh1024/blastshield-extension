import { ScanResult } from './types';

export const MOCK_DATA: ScanResult = {
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
        { level: 'INFO', message: 'Load balancer distributing traffic to routes.py', timestamp: '00:00:02' },
        { level: 'WARNING', message: 'Thread pool utilization at 85%', timestamp: '00:00:07' },
        { level: 'WARNING', message: 'Response latency exceeding 2000ms threshold', timestamp: '00:00:10' },
        { level: 'ERROR', message: "KeyError: 'item' in routes.py line 47", timestamp: '00:00:15' },
        { level: 'ERROR', message: 'Race condition on order_counter — duplicate writes', timestamp: '00:00:15' },
        { level: 'WARNING', message: 'Auth token cache miss rate at 40%', timestamp: '00:00:22' },
        { level: 'ERROR', message: 'InventoryError: index out of range in services.py', timestamp: '00:00:25' },
        { level: 'ERROR', message: 'ConnectionPool: max connections (20) reached', timestamp: '00:00:33' },
        { level: 'ERROR', message: 'Request timeout after 30000ms — cascade failure', timestamp: '00:00:38' },
        { level: 'ERROR', message: 'System unresponsive — all workers blocked', timestamp: '00:00:40' },
        { level: 'INFO', message: 'Simulation complete — 40s elapsed', timestamp: '00:00:40' },
    ],
    root_cause: [
        'Race condition on order_counter in routes.py — no synchronization on shared mutable state',
        'Missing key validation for item lookups — KeyError crashes request handlers',
        'Non-atomic inventory updates in services.py — concurrent decrements cause negative stock',
        'Database connection pool sized at 20 for 200 concurrent users — 10x under-provisioned',
        'No circuit breaker between services.py and db.py — failures cascade unbounded',
        'Auth token cache has no fallback — cache miss triggers synchronous DB lookup storm',
    ],
    patches: [
        {
            file: 'routes.py',
            before: 'order_counter += 1\ninventory[item] -= qty',
            after: 'with threading.Lock():\n    order_counter += 1\n    if item in inventory and inventory[item] >= qty:\n        inventory[item] -= qty',
            reason: 'Add thread-safe locking and validation to prevent race conditions and KeyErrors',
        },
        {
            file: 'services.py',
            before: 'def update_inventory(item, qty):\n    db.execute(f"UPDATE stock SET qty = qty - {qty}")',
            after: 'def update_inventory(item, qty):\n    with db.atomic():\n        current = db.execute("SELECT qty FROM stock WHERE item = ? FOR UPDATE", [item])\n        if current and current[0] >= qty:\n            db.execute("UPDATE stock SET qty = qty - ? WHERE item = ?", [qty, item])',
            reason: 'Use atomic transactions with row-level locking for safe concurrent inventory updates',
        },
        {
            file: 'db.py',
            before: 'pool = ConnectionPool(max_connections=20)',
            after: 'pool = ConnectionPool(\n    max_connections=100,\n    min_connections=10,\n    max_overflow=50,\n    pool_timeout=5,\n    pool_recycle=3600\n)',
            reason: 'Scale connection pool to handle concurrent load with overflow and timeout settings',
        },
    ],
    network_activity: [
        { time: 0, requests: 20, errors: 0 },
        { time: 5, requests: 80, errors: 0 },
        { time: 10, requests: 150, errors: 2 },
        { time: 15, requests: 200, errors: 15 },
        { time: 20, requests: 180, errors: 35 },
        { time: 25, requests: 160, errors: 60 },
        { time: 30, requests: 120, errors: 80 },
        { time: 35, requests: 60, errors: 55 },
        { time: 40, requests: 10, errors: 8 },
    ],
    explanation:
        'The system experiences catastrophic failure under 200 concurrent users due to a combination of unguarded shared state, under-provisioned connection pools, and missing circuit breakers. The race condition in routes.py is the initial trigger, causing duplicate writes that corrupt order data. This cascades through services.py where non-atomic inventory updates amplify the damage. The database connection pool (max 20) is overwhelmed, creating a bottleneck that blocks all workers within 33 seconds. Without circuit breakers, every failing request queues up, consuming the remaining thread pool capacity until the system becomes completely unresponsive at t=40s.',
    blast_radius: [
        'Order Processing — duplicate/lost orders affecting revenue',
        'Inventory Management — phantom stock causing overselling',
        'User Authentication — degraded login experience during load',
        'Database Layer — connection exhaustion affecting all services',
        'API Gateway — cascading timeouts returning 502/504 to clients',
    ],
    postmortem: {
        summary:
            'Production simulation revealed a critical cascade failure affecting all services under 200 concurrent users. The system became fully unresponsive within 40 seconds of load onset.',
        root_cause:
            'Primary: Unsynchronized shared mutable state (order_counter) in routes.py. Secondary: Under-provisioned database connection pool (20 connections for 200 users). Tertiary: Missing circuit breakers allowing unbounded failure propagation.',
        impact:
            'Complete system outage affecting order processing, inventory accuracy, and user authentication. Estimated data corruption: 150 duplicate/lost orders, 720 edge case failures. Revenue impact: all checkout operations failed after t=25s.',
        timeline_narrative:
            '0s: Traffic begins at 200 users. 7s: Thread saturation detected. 15s: First data corruption (duplicate orders). 25s: Checkout failures cascade through inventory service. 33s: Database connection pool exhausted. 40s: Full system unresponsive.',
        remediation:
            '1. Add threading locks to order_counter mutations (immediate). 2. Implement atomic database transactions for inventory updates (high priority). 3. Scale connection pool to 100 with overflow (high priority). 4. Add circuit breakers between service layers (medium priority). 5. Implement rate limiting at API gateway (medium priority). 6. Add monitoring alerts for thread pool and connection pool utilization (low priority).',
    },
};
