import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PropagationNode } from '../types';

interface Props {
    propagation: PropagationNode[];
    activeNodeId?: string;
}

export const PropagationGraph: React.FC<Props> = ({ propagation, activeNodeId }) => {
    const nodes: Node[] = useMemo(() => {
        // Basic automatic layout - in a real app would use dagre.js
        const levelCounts: Record<number, number> = {};
        const nodeLevels: Record<string, number> = {};

        // Find roots (nodes with no incoming connections)
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

        // Start with roots
        propagation.forEach(n => {
            if (!incomingCounts[n.id]) assignLevel(n.id, 0);
        });

        // Fallback for cyclic graphs or orphans
        propagation.forEach(n => {
            if (nodeLevels[n.id] === undefined) assignLevel(n.id, 0);
        });

        return propagation.map((node) => {
            const level = nodeLevels[node.id] || 0;
            const countAtLevel = levelCounts[level] || 0;
            levelCounts[level] = countAtLevel + 1;

            const isFlashing = activeNodeId === node.id;

            return {
                id: node.id,
                position: { x: countAtLevel * 180 + 50, y: level * 100 + 30 },
                data: { label: node.file },
                className: `flow-node ${node.status} ${isFlashing ? 'flash' : ''}`,
                draggable: false,
            };
        });
    }, [propagation, activeNodeId]);

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

    return (
        <div className="section fade-in fade-in-delay-2">
            <div className="section-title">
                <span className="icon">🕸</span> Failure Propagation Map
            </div>
            <div className="propagation-container">
                <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background color="#3e3e42" gap={16} size={1} />
                    <Controls showInteractive={false} />
                </ReactFlow>
            </div>
        </div>
    );
};
