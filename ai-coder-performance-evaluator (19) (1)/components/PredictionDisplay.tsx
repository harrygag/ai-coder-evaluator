

import React from 'react';
import { PredictionResult, Trend, ArchitecturalMandate, ConceptualSchema } from '../types';
import { BrainIcon, LoadingSpinner, ManagerIcon, CoreLogicIcon } from './icons';
import ArchitecturalPredictionChart from './ArchitecturalPredictionChart';

interface PredictionDisplayProps {
  predictions: PredictionResult | null;
  isLoading: boolean;
}

const TrendDisplay: React.FC<{ trend: Trend }> = ({ trend }) => {
    const color = trend.direction === 'upward' ? 'text-green-400' : trend.direction === 'downward' ? 'text-red-400' : 'text-yellow-400';
    const Arrow = () => {
        if (trend.direction === 'upward') return <span>↑</span>;
        if (trend.direction === 'downward') return <span>↓</span>;
        return <span>-</span>;
    }
    const metricName = trend.metric.replace(/([A-Z])/g, ' $1').trim();
    return (
        <div className={`flex justify-between items-center p-2 rounded bg-base-300/30`}>
            <span className="capitalize text-sm text-text-secondary">{metricName}</span>
            <span className={`font-bold text-sm flex items-center gap-1 ${color}`}>
                <Arrow /> {trend.direction}
            </span>
        </div>
    );
};


const PredictionDisplay: React.FC<PredictionDisplayProps> = ({ predictions, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4 bg-base-200 rounded-lg border border-base-300 min-h-[150px]">
          <LoadingSpinner />
          <p className="mt-2 text-sm font-semibold text-text-secondary">Analyzing historical data...</p>
      </div>
    );
  }

  if (!predictions) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-4 bg-base-200 rounded-lg border border-base-300 min-h-[150px]">
            <BrainIcon />
            <p className="mt-2 font-semibold text-text-primary">Predictive Analysis</p>
            <p className="text-sm text-text-secondary">Run analysis to get proactive suggestions.</p>
        </div>
    );
  }

  const { trends, anomalies, aiAnalysis } = predictions;

  return (
    <div className="p-4 bg-base-200 rounded-lg border border-base-300 animate-fade-in-up">
      <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <BrainIcon />
        Predictive Analysis
      </h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-sm text-brand-secondary mb-2">Performance Trends</h4>
          <div className="space-y-1">
            {trends.map(trend => <TrendDisplay key={trend.metric} trend={trend} />)}
          </div>
        </div>

        {anomalies.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-yellow-400 mb-2">Detected Anomalies</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-200/80">
              {anomalies.map((anomaly, i) => (
                <li key={i}>
                  Significant drop in <span className="font-bold">{anomaly.metric.replace(/([A-Z])/g, ' $1').trim()}</span> on {new Date(anomaly.record.timestamp).toLocaleDateString()}.
                </li>
              ))}
            </ul>
          </div>
        )}

        {aiAnalysis?.rootCauseInferences && aiAnalysis.rootCauseInferences.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm text-purple-400 mb-2">Inferred Root Causes</h4>
             <ul className="list-disc list-inside space-y-2 text-sm text-purple-200/80">
              {aiAnalysis.rootCauseInferences.map((inference, i) => (
                <li key={i}>
                  <strong>{inference.observation}:</strong> {inference.inferredCause}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {aiAnalysis?.predictiveVisualization && aiAnalysis.predictiveVisualization.trajectory.length > 0 && (
            <div>
                <h4 className="font-semibold text-sm text-cyan-400 mb-2">Architectural Trajectory Forecast</h4>
                <div className="bg-base-300/20 p-3 rounded-lg">
                    <ArchitecturalPredictionChart schema={aiAnalysis.predictiveVisualization} />
                </div>
            </div>
        )}

        {aiAnalysis?.futureArchitecturalMandates && aiAnalysis.futureArchitecturalMandates.length > 0 && (
             <div>
                <h4 className="font-semibold text-sm text-green-400 mb-2">Future Architectural Mandates</h4>
                <ul className="space-y-2 text-sm text-green-200/80">
                  {aiAnalysis.futureArchitecturalMandates.map((mandate) => (
                    <li key={mandate.id} className="bg-base-300/20 p-3 rounded-md border-l-2 border-green-500">
                        <p>{mandate.description}</p>
                    </li>
                  ))}
                </ul>
            </div>
        )}

        {aiAnalysis?.proactiveSchemaProposals && aiAnalysis.proactiveSchemaProposals.length > 0 && (
             <div>
                <h4 className="font-semibold text-sm text-blue-400 mb-2">Proactive Schema Proposals</h4>
                <div className="space-y-3">
                  {aiAnalysis.proactiveSchemaProposals.map((proposal) => (
                    <div key={proposal.id} className="bg-base-300/20 p-3 rounded-md border-l-2 border-blue-500">
                        <p className="font-bold text-blue-300">{proposal.name} ({proposal.type})</p>
                        <pre className="whitespace-pre-wrap text-xs text-blue-200/80 font-mono bg-base-300/30 p-2 rounded mt-2 overflow-x-auto">
                            {proposal.schema}
                        </pre>
                    </div>
                  ))}
                </div>
            </div>
        )}

        {aiAnalysis?.proactiveSuggestions && aiAnalysis.proactiveSuggestions.length > 0 && (
           <div>
            <h4 className="font-semibold text-sm text-indigo-400 mb-2">Proactive Suggestions for Meta-Architect</h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-indigo-200/80 bg-base-300/20 p-3 rounded">
              {aiAnalysis.proactiveSuggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default PredictionDisplay;
