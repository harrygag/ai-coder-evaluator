

import { HistoricalRecord, FailSafeCriteria, FailSafeReport, PerformanceMetrics } from '../types';
import eventBus from './eventBus';

const FAIL_SAFE_CRITERIA_KEY = 'fail_safe_criteria';

// A very basic string similarity function (Jaro-Winkler-like)
const simpleSimilarity = (s1: string | undefined, s2: string | undefined): number => {
    if (!s1 || !s2) return 0;
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (shorter.length === 0) return longer.length === 0 ? 1 : 0;
    
    let matchingChars = 0;
    const shorterArray = [...shorter];
    const longerArray = [...longer];

    for (let i = 0; i < shorterArray.length; i++) {
        if (shorterArray[i] === longerArray[i]) {
            matchingChars++;
        }
    }
    
    return matchingChars / longer.length;
};


class FailSafeService {
    private criteria: FailSafeCriteria;

    constructor() {
        this.criteria = this.loadCriteria();
    }

    private loadCriteria(): FailSafeCriteria {
        try {
            const stored = localStorage.getItem(FAIL_SAFE_CRITERIA_KEY);
            const defaults: FailSafeCriteria = { minCodeGrowthRate: 5, maxPerformanceDrop: 20, maxBottlenecks: 3, minCodeReuseRate: 10, maxCycleDuration: 150 };
            return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
        } catch (e) {
            console.error("Failed to load fail-safe criteria from localStorage, using defaults.", e);
            return { minCodeGrowthRate: 5, maxPerformanceDrop: 20, maxBottlenecks: 3, minCodeReuseRate: 10, maxCycleDuration: 150 };
        }
    }

    private saveCriteria(): void {
        try {
            localStorage.setItem(FAIL_SAFE_CRITERIA_KEY, JSON.stringify(this.criteria));
            eventBus.publish('failSafe:criteriaUpdated', this.criteria);
        } catch (e) {
            console.error("Failed to save fail-safe criteria to localStorage.", e);
        }
    }

    public updateCriteria(newCriteria: FailSafeCriteria): void {
        this.criteria = newCriteria;
        this.saveCriteria();
    }

    public getCriteria(): FailSafeCriteria {
        return this.criteria;
    }

    public checkFailSafe(history: HistoricalRecord[]): FailSafeReport | null {
        if (history.length < 2) {
            return null;
        }

        const current = history.slice(-1)[0];
        const previous = history.slice(-2)[0];

        // 1. Check Cycle Duration
        if (current.cycleDuration && current.cycleDuration > this.criteria.maxCycleDuration) {
             return {
                triggeredCriteria: 'maxCycleDurationExceeded',
                message: `Cycle duration was ${current.cycleDuration}s, exceeding the maximum of ${this.criteria.maxCycleDuration}s.`,
                remediationSteps: [
                    "Review agent logs for performance bottlenecks.",
                    "Simplify the 'Suggestion' to reduce cycle complexity.",
                    "Approve overtime if complexity is necessary."
                ]
            };
        }

        // 2. Check Code Growth Rate
        const currentCodeSize = current.evolvedCodebase?.length || 0;
        const previousCodeSize = previous.evolvedCodebase?.length || 0;
        if (previousCodeSize > 0) {
            const growthRate = ((currentCodeSize - previousCodeSize) / previousCodeSize) * 100;
            if (growthRate < this.criteria.minCodeGrowthRate) {
                return {
                    triggeredCriteria: 'minCodeGrowthRate',
                    message: `Code growth rate is ${growthRate.toFixed(1)}%, which is below the minimum threshold of ${this.criteria.minCodeGrowthRate}%.`,
                    remediationSteps: [
                        "Review Manager AI's 'Rewritten Prompt' for ambition.",
                        "Increase complexity of the user suggestion.",
                        "Check if Core Logic coder is being too conservative."
                    ]
                };
            }
        }

        // 3. Check Performance Drop
        const checkMetricDrop = (metric: keyof PerformanceMetrics): boolean => {
            const currentMetric = current.metrics[metric];
            const previousMetric = previous.metrics[metric];
            if (typeof currentMetric === 'number' && typeof previousMetric === 'number' && previousMetric > 0) {
                const dropPercentage = ((previousMetric - currentMetric) / previousMetric) * 100;
                return dropPercentage > this.criteria.maxPerformanceDrop;
            }
            return false;
        };

        if (checkMetricDrop('solutionQuality') || checkMetricDrop('managerPerformance')) {
             return {
                triggeredCriteria: 'maxPerformanceDrop',
                message: `A key performance metric dropped by more than ${this.criteria.maxPerformanceDrop}%.`,
                remediationSteps: [
                    "Analyze the last cycle's team discussion for errors.",
                    "Review AI CEO directives for unintended consequences.",
                    "Consider a prompt reset for underperforming agents."
                ]
            };
        }

        // 4. Check for Unresolved Bottlenecks
        const bottlenecks = current.metrics.bottlenecksUnresolvedCount;
        if (bottlenecks !== undefined && bottlenecks > this.criteria.maxBottlenecks) {
             return {
                triggeredCriteria: 'maxBottlenecks',
                message: `Unresolved bottlenecks count is ${bottlenecks}, exceeding the maximum of ${this.criteria.maxBottlenecks}.`,
                remediationSteps: [
                    "Review the last QA and Manager AI reports.",
                    "Ensure the refactoring mandates are being correctly implemented.",
                    "Instruct the Manager AI to prioritize bottleneck resolution in the next cycle."
                ]
            };
        }

        // 5. Check for Missing Code Reuse (legacy simple check)
        const similarity = simpleSimilarity(current.mockCodeSynthesis, previous.mockCodeSynthesis);
        if (current.suggestion !== previous.suggestion && similarity > 0.9) {
            return {
                triggeredCriteria: 'missingCodeReuse',
                message: `Redundant code generated. New code is ${ (similarity * 100).toFixed(0) }% similar to previous cycle's code for a different task.`,
                remediationSteps: [
                    "Agents are not reusing existing patterns.",
                    "Review agent prompts to enforce checking for reusable code.",
                    "Consider increasing penalty for redundancy in agent evaluations."
                ]
            };
        }

        // 6. Check Code Reuse Rate from evaluation
        const codeReuseRate = current.metrics.codeReuseRate;
        if (codeReuseRate !== undefined && (codeReuseRate * 100) < this.criteria.minCodeReuseRate) {
             return {
                triggeredCriteria: 'lowCodeReuseRate',
                message: `Code reuse rate is ${(codeReuseRate * 100).toFixed(0)}%, which is below the minimum threshold of ${this.criteria.minCodeReuseRate}%.`,
                remediationSteps: [
                    "Agents are not effectively querying the Code Bank.",
                    "Review agent prompts to enforce reuse.",
                    "Ensure the Code Bank contains relevant, high-quality snippets."
                ]
            };
        }
        
        return null;
    }
}

const failSafeService = new FailSafeService();
export default failSafeService;
