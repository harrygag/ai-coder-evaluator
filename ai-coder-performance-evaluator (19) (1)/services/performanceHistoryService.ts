

import { HistoricalRecord, PerformanceMetrics, SelfEvaluation, GrowthRoadmap } from '../types';
import eventBus from './eventBus';

const HISTORY_KEY = 'ai_team_performance_history';

class PerformanceHistoryService {
  
  public parseEvaluation(evaluationText: string): SelfEvaluation {
    const jsonRegex = /```json\s*([\s\\S]*?)\s*```/;
    const match = evaluationText.match(jsonRegex);
    
    let scores: PerformanceMetrics | null = null;
    let growthRoadmap: GrowthRoadmap | undefined = undefined;
    let text = evaluationText;

    if (match && match[1]) {
      text = evaluationText.replace(jsonRegex, '').trim();
      try {
        const parsed = JSON.parse(match[1]);
        
        const { 
          solutionQuality, 
          managerPerformance, 
          promptQuality, 
          architecturalComplianceScore, 
          architecturalDebtAccumulationRate,
          innovationScore,
          inspirationUtilizationRate,
          codeReuseRate,
          growthRoadmap: parsedRoadmap,
          // New creative metrics
          innovationLayersAdded,
          creativeLeapsCount,
          experimentalFeaturesDeveloped
        } = parsed;

        const isValid = 
          typeof solutionQuality === 'number' &&
          typeof managerPerformance === 'number' &&
          typeof promptQuality === 'number';

        if (isValid) {
          scores = { 
              solutionQuality, 
              managerPerformance, 
              promptQuality, 
              architecturalComplianceScore, 
              architecturalDebtAccumulationRate,
              innovationScore,
              inspirationUtilizationRate,
              codeReuseRate,
              innovationLayersAdded,
              creativeLeapsCount,
              experimentalFeaturesDeveloped
          };
        } else if (evaluationText) { 
          console.warn("Parsed evaluation metrics are invalid or missing required fields.", parsed);
          scores = null;
        }

        if (parsedRoadmap) {
          growthRoadmap = parsedRoadmap;
        }
      } catch (e) {
        console.error("Failed to parse evaluation JSON:", e);
        scores = null;
        growthRoadmap = undefined;
      }
    }
    return { text, scores, growthRoadmap };
  }

  public addRecord(evaluation: SelfEvaluation, context: { suggestion: string; rewrittenPrompt: string; refactoringMandate?: string; mockCodeSynthesis?: string; architecturalEvolutionStrategy?: string; evolvedCodebase?: string; cycleDuration?: number; }): void {
    if (!evaluation.scores) {
      if(evaluation.text !== '') {
         console.warn("Cannot add record: evaluation has no valid scores.");
         return;
      }
    }
    
    if(evaluation.scores) {
      eventBus.publish('evaluationMetricsRefined', evaluation.scores);
    }
    
    const history = this.getHistory();
    const newRecord: HistoricalRecord = {
      timestamp: Date.now(),
      metrics: evaluation.scores || { solutionQuality: 0, managerPerformance: 0, promptQuality: 0}, // Placeholder
      evaluationText: evaluation.text,
      suggestion: context.suggestion,
      rewrittenPrompt: context.rewrittenPrompt,
      refactoringMandate: context.refactoringMandate,
      mockCodeSynthesis: context.mockCodeSynthesis,
      architecturalEvolutionStrategy: context.architecturalEvolutionStrategy,
      selfEvaluation: evaluation,
      evolvedCodebase: context.evolvedCodebase,
      cycleDuration: context.cycleDuration,
    };
    
    const updatedHistory = [...history, newRecord];
    this.saveHistory(updatedHistory);
  }

  public getHistory(): HistoricalRecord[] {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
      console.error("Failed to retrieve performance history from localStorage:", e);
      return [];
    }
  }

  public updateLatestRecord(record: HistoricalRecord): void {
    const history = this.getHistory();
    if (history.length > 0) {
        history[history.length - 1] = record;
        this.saveHistory(history);
    }
  }

  private saveHistory(history: HistoricalRecord[]): void {
     try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      eventBus.publish('historyUpdated', history);
    } catch (e) {
      console.error("Failed to save performance history to localStorage:", e);
    }
  }
}

const performanceHistoryService = new PerformanceHistoryService();
export default performanceHistoryService;
