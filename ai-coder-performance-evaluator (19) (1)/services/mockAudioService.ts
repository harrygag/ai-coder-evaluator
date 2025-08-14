import eventBus from './eventBus';
import { PerformanceMetrics, AiRole, AiAgent, AiAgentStatus, GrowthTrend, GrowthTrendAnalysis, PredictiveForecast } from '../types';

class MockAudioService {
    private isMuted: boolean = false;

    constructor() {
        console.log("[Mock Audio System] Initialized and ready.");
        this.subscribeToEvents();
    }

    private subscribeToEvents() {
        eventBus.subscribe('simulationCompletion', this.onSimulationComplete);
        eventBus.subscribe('toggleMute', this.onToggleMute);
        eventBus.subscribe('evaluationMetricsRefined', this.onArchitecturalMetricsRefined);
        eventBus.subscribe('promptUpdated', this.onPromptUpdated);
        eventBus.subscribe('manager:architecturalStrategyFormulated', this.onArchitecturalStrategyFormulated);
        eventBus.subscribe('aiAgent:stateUpdated', this.onAiAgentStateUpdated);
        eventBus.subscribe('ceo:managementActionTaken', this.onCeoManagementActionTaken);
        // New Creative Layer Subscriptions
        eventBus.subscribe('creativeLeapHappened', this.onCreativeLeap);
        eventBus.subscribe('predictiveIntelligence:growthTrendClassification', this.onGrowthTrendClassification);
        eventBus.subscribe('predictiveIntelligence:milestoneForecast', this.onMilestoneForecast);
        // Fail-Safe subscriptions
        eventBus.subscribe('failSafe:haltTriggered', this.onFailSafeHalt);
        eventBus.subscribe('cycle:resumed', this.onCycleResumed);
        // New AMMS Upgrade Subscriptions
        eventBus.subscribe('cycle:overtimeApproved', this.onOvertimeApproved);
        eventBus.subscribe('manager:relayMessage', this.onManagerMessageRelay);
        eventBus.subscribe('difficulty:levelIncreased', this.onDifficultyIncreased);
    }
    
    private playSound(message: string, style: string = 'color: #818cf8;') {
        if(this.isMuted) return;
        console.log(`%c[Mock Audio System] Playing... "${message}"`, style);
    }

    private onSimulationComplete = () => {
        this.playSound('Simulation Complete Fanfare');
    }

    private onToggleMute = () => {
        this.isMuted = !this.isMuted;
        console.log(`[Mock Audio System] Mute state is now: ${this.isMuted ? 'ON' : 'OFF'}`);
    }

    private onPromptUpdated = (role: AiRole) => {
        this.playSound(`Prompt Updated Confirmation for ${role}`);
    }
    
    private onArchitecturalStrategyFormulated = () => {
        this.playSound('High-Complexity Strategic Vision Detected! (Distinct Impactful Cue)');
    }

    private onArchitecturalMetricsRefined = (scores: PerformanceMetrics) => {
        const { architecturalComplianceScore, architecturalDebtAccumulationRate } = scores;

        if (architecturalComplianceScore !== undefined && architecturalDebtAccumulationRate !== undefined) {
            if (architecturalComplianceScore >= 4) {
                this.playSound('Architectural Health: Optimal Chime');
            } 
            else if (architecturalComplianceScore < 3 || architecturalDebtAccumulationRate > 0.5) {
                this.playSound('Architectural Health: Warning Tone (Potential Debt)');
            } 
        }
    }

    private onAiAgentStateUpdated = (agent: AiAgent) => {
        if (this.isMuted) return;
        switch (agent.status) {
            case AiAgentStatus.Thinking:
            case AiAgentStatus.Simulating:
            case AiAgentStatus.Evaluating:
            case AiAgentStatus.Updating:
                console.log(`[Mock Audio System] ${agent.name} is now ${agent.status.toUpperCase()}...`);
                break;
        }
    }

    private onCeoManagementActionTaken = (actionType: string) => {
        this.playSound(`CEO Action: ${actionType}`);
    }

    private onCreativeLeap = (leapCount: number) => {
        this.playSound(`Creative Leap Achieved! (Inspiring Jingle). Total leaps: ${leapCount}. Announcing to company...`, 'color: #7c3aed; font-weight: bold;');
    }
    
    private onGrowthTrendClassification = (analysis: GrowthTrendAnalysis) => {
        if (analysis.trend === GrowthTrend.Exponential) {
            this.playSound(`Exponential Growth Detected! (Upbeat Fanfare) for ${analysis.metric}.`, 'color: #10b981; font-weight: bold;');
        } else if (analysis.trend === GrowthTrend.Declining) {
            this.playSound(`Declining Trend Warning (Dissonant Tone) for ${analysis.metric}.`, 'color: #f87171; font-weight: bold;');
        }
    }

    private onMilestoneForecast = (forecast: PredictiveForecast) => {
         this.playSound(`Future Milestone Predicted! (Optimistic Chime) for ${forecast.targetMetric}.`);
    }
    
    private onFailSafeHalt = () => {
        this.playSound('URGENT: Fail-Safe Triggered! Cycle Halted!', 'color: #ef4444; font-weight: bold; font-size: 14px;');
    }

    private onCycleResumed = () => {
        this.playSound('Cycle Resumed. All systems operational.', 'color: #22c55e; font-weight: bold;');
    }
    
    // Inspired by Manager AI Plan: "In services/mockAudioService.ts, listen for the cycle:overtimeApproved event. Play a distinct, positive audio cue"
    private onOvertimeApproved = (payload: { durationSeconds: number }) => {
        this.playSound(`Overtime Approved! ${payload.durationSeconds} seconds added to the clock.`, 'color: #f59e0b; font-weight: bold;');
    }

    // Inspired by Manager AI Plan: "In services/mockAudioService.ts, listen for the manager:relayMessage event. Play a subtle "notification chime""
    private onManagerMessageRelay = () => {
        this.playSound('Internal communication relayed. (Notification Chime)');
    }

    // Inspired by Manager AI Plan: "In services/mockAudioService.ts, listen for the difficulty:levelIncreased event. Play an uplifting, "level up" sound effect"
    private onDifficultyIncreased = (payload: { newLevel: number }) => {
        this.playSound(`Challenge Accepted! Adaptive difficulty increased to level ${payload.newLevel}.`, 'color: #38bdf8; font-weight: bold;');
    }
}

const mockAudioService = new MockAudioService();
export default mockAudioService;
