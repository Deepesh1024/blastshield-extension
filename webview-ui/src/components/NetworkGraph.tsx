import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { NetworkPoint } from '../types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Props {
    data: NetworkPoint[];
}

export const NetworkGraph: React.FC<Props> = ({ data }) => {
    const chartData = useMemo(() => {
        return {
            labels: data.map((d) => `${d.time}s`),
            datasets: [
                {
                    label: 'Requests/sec',
                    data: data.map((d) => d.requests),
                    borderColor: '#3794ff',
                    backgroundColor: 'rgba(55, 148, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHitRadius: 10,
                },
                {
                    label: 'Errors/sec',
                    data: data.map((d) => d.errors),
                    borderColor: '#f14c4c',
                    backgroundColor: 'rgba(241, 76, 76, 0.15)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHitRadius: 10,
                },
            ],
        };
    }, [data]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                labels: {
                    color: '#969696',
                    font: { family: "'Inter', sans-serif", size: 11 },
                    usePointStyle: true,
                    boxWidth: 6,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(37, 37, 38, 0.9)',
                titleColor: '#d4d4d4',
                bodyColor: '#d4d4d4',
                borderColor: '#3e3e42',
                borderWidth: 1,
                padding: 10,
                font: { family: "'JetBrains Mono', monospace", size: 11 },
            },
        },
        scales: {
            x: {
                grid: { color: 'rgba(62, 62, 66, 0.4)', drawBorder: false },
                ticks: { color: '#6a6a6a', font: { family: "'JetBrains Mono', monospace", size: 10 } },
            },
            y: {
                grid: { color: 'rgba(62, 62, 66, 0.4)', drawBorder: false },
                ticks: { color: '#6a6a6a', font: { family: "'JetBrains Mono', monospace", size: 10 } },
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="section fade-in fade-in-delay-3">
            <div className="section-title">
                <span className="icon">📈</span> Network Activity
            </div>
            <div className="network-chart-container">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};
