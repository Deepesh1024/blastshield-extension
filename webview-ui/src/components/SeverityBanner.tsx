import React from 'react';
import { ScanResult } from '../types';

interface Props {
    severity: ScanResult['severity'];
}

const bannerText: Record<string, string> = {
    CRITICAL: '⚠ CRITICAL INCIDENT DETECTED',
    HIGH: '⚠ HIGH RISK INCIDENT DETECTED',
    MEDIUM: '⚡ MODERATE RISK DETECTED',
    LOW: '✓ SYSTEM APPEARS STABLE',
};

export const SeverityBanner: React.FC<Props> = ({ severity }) => {
    const className = `severity-banner ${severity.toLowerCase()}`;
    return (
        <div className={className}>
            {bannerText[severity] || bannerText.MEDIUM}
        </div>
    );
};
