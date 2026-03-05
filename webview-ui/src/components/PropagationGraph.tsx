import React, { useMemo, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PropagationNode } from '../types';

interface Props {
    propagation: PropagationNode[];
    activeNodeId?: string;
}

// Inner component that has access to useReactFlow
const InnerGraph: React.FC<Props> = ({ propagation, activeNodeId }) => {
    const { fitView, setCenter } = useReactFlow();

    const nodePositions = useMemo(() => {
        const levelCounts: Record<number, number> = {};
        const nodeLevels: Record<string, number> = {};

        const incomingCounts: Record<string, number> = {};
        propagation.forEach(n => {
            n.connections.forEach(target => {
                incomingCounts[target] = (incomingCounts[target] || 0) + 1;
            });
        });

        const assignLevel = (nodeId: string, level: number) => {
            nodeLevels[nodeId] = Math.max(nodeLevels[nodeId] || 0, level);
            const node = propagation.find(n => n.id === nodeId);
            node?.connections.forEach(childId => assignLevel(childId, level + 1));
        };

        propagation.forEach(n => {
            if (!incomingCounts[n.id]) assignLevel(n.id, 0);
        });
        propagation.forEach(n => {
            if (nodeLevels[n.id] === undefined) assignLevel(n.id, 0);
        });

        const positions: Record<string, { x: number; y: number }> = {};
        propagation.forEach((node) => {
            const level = nodeLevels[node.id] || 0;
            const countAtLevel = levelCounts[level] || 0;
            levelCounts[level] = countAtLevel + 1;
            positions[node.id] = { x: countAtLevel * 180 + 50, y: level * 110 + 30 };
        });
        return positions;
    }, [propagation]);

    const nodes: Node[] = useMemo(() => {
        return propagation.map((node) => {
            const isActive = activeNodeId === node.id;
            return {
                id: node.id,
                position: nodePositions[node.id] || { x: 0, y: 0 },
                data: {
                    label: (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                        }}>
                            <span style={{ fontSize: isActive ? '13px' : '11px', fontWeight: isActive ? 700 : 500 }}>
                                {node.file}
                            </span>
                            <span style={{
                                fontSize: '9px',
                                opacity: 0.7,
                                background: node.status === 'failure' ? '#ff4444' : node.status === 'warning' ? '#ffa500' : '#22c55e',
                                color: '#fff',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                textTransform: 'uppercase',
                            }}>
                                {node.status}
                            </span>
                        </div>
                    )
                },
                className: `flow-node ${node.status} ${isActive ? 'flash' : ''}`,
                style: {
                    border: isActive ? '2px solid #e879f9' : undefined,
                    boxShadow: isActive ? '0 0 16px #e879f9' : undefined,
                    transition: 'all 0.3s ease',
                    transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    zIndex: isActive ? 10 : 1,
                },
                draggable: false,
            };
        });
    }, [propagation, activeNodeId, nodePositions]);

    const edges: Edge[] = useMemo(() => {
        const edgeList: Edge[] = [];
        propagation.forEach((node) => {
            node.connections.forEach((targetId) => {
                edgeList.push({
                    id: `${node.id}-${targetId}`,
                    source: node.id,
                    target: targetId,
                    animated: true,
                    style: { stroke: '#3e3e42', strokeWidth: 2 },
                });
            });
        });
        return edgeList;
    }, [propagation]);

    // Pan the viewport to center on the active node during replay
    useEffect(() => {
        if (activeNodeId && nodePositions[activeNodeId]) {
            const pos = nodePositions[activeNodeId];
            setCenter(pos.x + 75, pos.y + 35, { zoom: 1.2, duration: 600 });
        } else if (!activeNodeId) {
            fitView({ duration: 400, padding: 0.2 });
        }
    }, [activeNodeId, nodePositions, setCenter, fitView]);

    return (
        <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background color="#3e3e42" gap={16} size={1} />
            <Controls showInteractive={false} />
        </ReactFlow>
    );
};

export const PropagationGraph: React.FC<Props> = (props) => {
    return (
        <div className="section fade-in fade-in-delay-2">
            <div className="section-title">
                <span className="icon">🕸</span> Failure Propagation Map
            </div>
            <div className="propagation-container">
                <ReactFlowProvider>
                    <InnerGraph {...props} />
                </ReactFlowProvider>
            </div>
        </div>
    );
};
