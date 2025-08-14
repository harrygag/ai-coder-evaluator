

import { HistoricalRecord, PerformanceMetrics, Trend, Anomaly, PredictionResult, AiAgentStatus, AiRole, GrowthTrend, GrowthTrendAnalysis } from '../types';
import { runPredictiveAnalysis as runAiAnalysis } from './openRouterService';
import eventBus from './eventBus';

class PredictiveAnalysisService {
    private calculateTrend(data: number[]): number {
        if (data.length < 2) return 0;
        const n = data.length;
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = data.reduce((a, b) => a + b, 0);
        const sumXY = data.reduce((sum, y, i) => sum + x[i] * y, 0);
        const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return isNaN(slope) ? 0 : slope;
    }
    
    private classifyTrends(history: HistoricalRecord[]): Trend[] {
        if (history.length < 2) return [];
        const metrics: (keyof PerformanceMetrics)[] = ['solutionQuality', 'managerPerformance', 'promptQuality', 'architecturalComplianceScore', 'architecturalDebtAccumulationRate', 'innovationScore', 'innovationLayersAdded', 'creativeLeapsCount'];
        const timeWindowMs = history[history.length - 1].timestamp - history[0].timestamp;

        return metrics.map(metric => {
            const values = history.map(h => h.metrics[metric]).filter((v): v is number => typeof v === 'number');
            if (values.length < 2) return null;

            const slope: number = this.calculateTrend(values);
            
            // For GrowthTrendAnalysis event
            let trend: GrowthTrend = GrowthTrend.Stagnant;
            let colorCode: GrowthTrendAnalysis['colorCode'] = 'blue';
            const normalizedSlope = slope * timeWindowMs;

            if (normalizedSlope > 1.0) { // Significant positive change
                trend = GrowthTrend.Exponential;
                colorCode = 'green';
            } else if (normalizedSlope > 0.2) { // Minor positive change
                trend = GrowthTrend.Incremental;
                colorCode = 'yellow';
            } else if (normalizedSlope < -0.2) { // Negative change
                trend = GrowthTrend.Declining;
                colorCode = 'red';
            } else {
                trend = GrowthTrend.Stagnant;
                colorCode = 'blue';
            }
            
            const analysis: GrowthTrendAnalysis = { trend, entityId: 'System', metric: metric as string, rateOfChange: slope, colorCode };
            eventBus.publish('predictiveIntelligence:growthTrendClassification', analysis);

            // For Trend object
            let direction: 'upward' | 'downward' | 'flat';
            if (slope > 0.1) {
                direction = 'upward';
            } else if (slope < -0.1) {
                direction = 'downward';
            } else {
                direction = 'flat';
            }

            return { metric, direction, slope };

        }).filter((t): t is Trend => t !== null);
    }

    private findAnomalies(history: HistoricalRecord[]): Anomaly[] {
        if (history.length < 3) return [];
        const anomalies: Anomaly[] = [];
        const metrics: (keyof PerformanceMetrics)[] = ['solutionQuality', 'managerPerformance', 'promptQuality', 'architecturalComplianceScore'];
        
        metrics.forEach(metric => {
            const values = history.map(h => h.metrics[metric]).filter((v): v is number => typeof v === 'number');
             if (values.length < 3) return;

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(values.map(v => Math.pow(v - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
            
            if (stdDev === 0) return;

            history.forEach((record, index) => {
                const value = record.metrics[metric];
                if (typeof value !== 'number') return;

                const zScore = (value - mean) / stdDev;
                if (zScore < -1.5) { 
                    anomalies.push({ metric, record: history[index], deviation: zScore });
                }
            });
        });
        return anomalies;
    }

    public async runAnalysis(
        history: HistoricalRecord[],
        updateAgentStatus: (role: AiRole, status: AiAgentStatus) => void,
        updateAgentLastOutput: (role: AiRole, content: string) => void
    ): Promise<PredictionResult> {
        const trends = this.classifyTrends(history);
        const anomalies = this.findAnomalies(history);
        
        let aiAnalysis: PredictionResult['aiAnalysis'] = null;
        
        try {
            aiAnalysis = await runAiAnalysis(history, trends, anomalies, updateAgentStatus, updateAgentLastOutput);
            if (aiAnalysis?.predictiveForecasts) {
                aiAnalysis.predictiveForecasts.forEach(forecast => {
                    eventBus.publish('predictiveIntelligence:milestoneForecast', forecast);
                });
            }
        } catch (error) {
            console.error("AI-driven predictive analysis failed:", error);
            aiAnalysis = null;
        }

        return { trends, anomalies, aiAnalysis };
    }
}

const predictiveAnalysisService = new PredictiveAnalysisService();
export default predictiveAnalysisService;