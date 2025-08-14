
import React from 'react';
import { HistoricalRecord, PredictionResult, FailSafeCriteria } from '../types';
import FileInput from './FileInput';
import { LoadingSpinner, WandIcon, BrainIcon, PlayIcon, StopIcon } from './icons';
import PerformanceChart from './PerformanceChart';
import PredictionDisplay from './PredictionDisplay';
import { CEOControlPanel } from './CEOControlPanel';

interface InputPanelProps {
  suggestion: string;
  setSuggestion: (value: string) => void;
  codebase: string;
  setCodebase: (value: string) => void;
  isLoading: boolean;
  isEvaluating: boolean;
  isPredicting: boolean;
  isContinuousModeActive: boolean;
  isSystemDisabled: boolean; // New prop for system-wide lock
  cycleCount: number;
  handleGeneratePlan: () => void;
  handleRunPrediction: () => void;
  handleToggleContinuousMode: () => void;
  history: HistoricalRecord[];
  predictions: PredictionResult | null;
  error: string | null;
  timeRemaining: number | null;
  failSafeCriteria: FailSafeCriteria;
  handleApproveOvertime: (duration: number) => void;
  dailyObjective: string;
  onDismissObjective: () => void;
}

const formatTime = (ms: number | null): string => {
    if (ms === null) return '00:00';
    const isOvertime = ms < 0;
    if (isOvertime) ms = Math.abs(ms);

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const sign = isOvertime ? '+' : '';

    return `${sign}${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const InputPanel: React.FC<InputPanelProps> = ({
  suggestion,
  setSuggestion,
  codebase,
  setCodebase,
  isLoading,
  isEvaluating,
  isPredicting,
  isContinuousModeActive,
  isSystemDisabled,
  cycleCount,
  handleGeneratePlan,
  handleRunPrediction,
  handleToggleContinuousMode,
  history,
  predictions,
  error,
  timeRemaining,
  failSafeCriteria,
  handleApproveOvertime,
  dailyObjective,
  onDismissObjective,
}) => {
  // Use a combined loading state for disabling inputs to simplify logic
  const isBusy = isLoading || isEvaluating || isContinuousModeActive || isSystemDisabled;

  const getTimeColor = () => {
      if (timeRemaining === null) return 'text-purple-300';
      if (timeRemaining < 0) return 'text-red-400 font-bold';
      if (timeRemaining < 30 * 1000) return 'text-yellow-400';
      return 'text-purple-300';
  }
  
  return (
    <div className="lg:pr-4">
      <div className="flex flex-col space-y-6">
         {isContinuousModeActive && (
            <div className="text-center p-3 bg-purple-900/50 rounded-md border border-purple-600">
                <p className="font-bold text-lg text-purple-300">Hyper Cycle: ACTIVE</p>
                <div className="text-sm text-purple-300/80 mt-2 grid grid-cols-2 gap-2">
                    <div>
                        <p className="font-semibold">Workday Time</p>
                        <p className={`font-mono text-xl transition-colors ${getTimeColor()}`}>{formatTime(timeRemaining)}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Cycle</p>
                        <p className="font-mono text-xl">{cycleCount}</p>
                    </div>
                </div>
            </div>
         )}
        
        {dailyObjective && (
            <div className="p-3 bg-blue-900/40 rounded-md border border-blue-600/50 animate-fade-in-up">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-blue-300">CEO's Next Day Objective</p>
                  <p className="text-xs text-blue-300/80 mt-1">{dailyObjective}</p>
                </div>
                <button
                  onClick={onDismissObjective}
                  className="text-xs font-medium text-text-secondary hover:text-white bg-base-300/50 hover:bg-base-300 px-2 py-1 rounded-md transition"
                  title="Dismiss Objective"
                >
                  Dismiss
                </button>
              </div>
            </div>
        )}

        <FileInput
          id="codebase-input"
          label="Upload Codebase"
          optionalText="(.zip, .js, .ts, etc.)"
          value={codebase}
          setValue={setCodebase}
          placeholder="Paste or upload project files... (Optional)"
          rows={8}
          isLoading={isBusy}
        />
        
        <div>
          <label htmlFor="suggestion-prompt" className="block text-sm font-medium text-text-secondary mb-2">
            Your Suggestion
          </label>
          <textarea
            id="suggestion-prompt"
            rows={4}
            className="block w-full rounded-md border-0 bg-base-200 p-4 text-text-primary shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition"
            placeholder="e.g., 'Add a new power-up that temporarily doubles the score.'"
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            disabled={isBusy}
          />
        </div>

        {error && (
            <div className="text-center p-2 bg-red-900/40 rounded-md border border-red-700/50 text-red-300 text-sm font-medium animate-fade-in-up">
                {error}
            </div>
        )}
        
        <CEOControlPanel 
            criteria={failSafeCriteria}
            isCycleActive={isContinuousModeActive}
            onApproveOvertime={handleApproveOvertime}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={isBusy || isPredicting || !suggestion || isSystemDisabled}
            className="flex w-full justify-center items-center rounded-md bg-brand-primary px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:bg-base-300 disabled:text-text-secondary/50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && !isContinuousModeActive ? <LoadingSpinner /> : <WandIcon />}
            <span className="ml-2">{isLoading && !isContinuousModeActive ? 'Simulating...' : 'Run Single Cycle'}</span>
          </button>
           <button
            type="button"
            onClick={handleRunPrediction}
            disabled={isBusy || isPredicting || history.length < 2 || isSystemDisabled}
            className="flex w-full justify-center items-center rounded-md bg-purple-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:bg-base-300 disabled:text-text-secondary/50 disabled:cursor-not-allowed transition-colors"
          >
            {isPredicting ? <LoadingSpinner /> : <BrainIcon />}
            <span className="ml-2">{isPredicting ? 'Analyzing...' : 'Analyze Trends'}</span>
          </button>
           <button
            type="button"
            onClick={handleToggleContinuousMode}
            disabled={(isBusy && !isContinuousModeActive) || !!error || isSystemDisabled}
            className={`flex w-full justify-center items-center rounded-md px-3 py-3 text-sm font-semibold text-white shadow-sm transition-colors ${isContinuousModeActive ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'} disabled:bg-base-300 disabled:text-text-secondary/50 disabled:cursor-not-allowed`}
          >
            {isContinuousModeActive ? <StopIcon /> : <PlayIcon />}
            <span className="ml-2">{isContinuousModeActive ? 'Stop Cycle' : 'Start Hyper Cycle'}</span>
          </button>
        </div>

        <div className="mt-8 border-t border-base-300 pt-6 space-y-8">
            <div>
                <h2 className="text-xl font-bold text-text-primary mb-4">Team Performance History</h2>
                <div className="bg-base-200 p-4 rounded-lg border border-base-300 min-h-[200px]">
                    <PerformanceChart history={history} />
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold text-text-primary mb-4">Predictive Insights</h2>
                <PredictionDisplay predictions={predictions} isLoading={isPredicting} />
            </div>
        </div>

      </div>
    </div>
  );
};

export default InputPanel;
