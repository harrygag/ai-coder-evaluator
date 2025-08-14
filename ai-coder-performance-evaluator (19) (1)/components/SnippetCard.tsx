import React, { useState, useEffect } from 'react';
import { CodeSnippet } from '../types';

const SnippetCard: React.FC<{ snippet: CodeSnippet }> = ({ snippet }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [justUpdated, setJustUpdated] = useState(false);

    useEffect(() => {
        setJustUpdated(true);
        const timer = setTimeout(() => setJustUpdated(false), 2000);
        return () => clearTimeout(timer);
    }, [snippet.timestamp]);

    const statusColors: Record<CodeSnippet['validationStatus'], string> = {
        valid: 'border-green-500',
        approved: 'border-green-500',
        invalid: 'border-red-500',
        deprecated: 'border-red-500',
        unvalidated: 'border-yellow-500',
        pending: 'border-yellow-500',
    };
    const statusColor = statusColors[snippet.validationStatus] || 'border-gray-500';

    return (
        <div className={`bg-base-300/50 p-3 rounded-md border-l-4 ${statusColor} mb-3 ${justUpdated ? 'animate-highlight-pulse' : ''}`}>
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <p className="font-mono text-xs text-text-secondary">{snippet.id}</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary/80 mt-1">
                        <span>Src: {snippet.source}</span>
                        {snippet.cycleNumber && <span>Cycle: {snippet.cycleNumber}</span>}
                        {snippet.building && <span>Bldg: {snippet.building}</span>}
                    </div>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColor.replace('border-', 'bg-').replace('-500', '-500/20')} ${statusColor.replace('border', 'text')}`}>
                    {snippet.validationStatus.toUpperCase()}
                </span>
            </div>
            {isExpanded && (
                <div className="mt-3 animate-fade-in-up">
                    <pre className="whitespace-pre-wrap text-sm text-blue-200/90 font-mono bg-base-100 p-3 rounded-md overflow-x-auto">
                        {snippet.content}
                    </pre>
                    {snippet.validatorNotes && (
                        <div className="mt-2 text-xs text-text-secondary italic bg-base-200/50 p-2 rounded">
                            <strong>Validator Notes:</strong> {snippet.validatorNotes}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SnippetCard;
