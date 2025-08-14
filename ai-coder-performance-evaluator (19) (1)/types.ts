
export enum Building {
  OVERSIGHT = "Oversight",
  CORE_OPERATIONS = "Core Operations",
  DESIGN_EXPERIENCE = "Design & Experience",
  CREATIVE_INNOVATION = "Creative Innovation",
}

export enum AiRole {
  Manager = "Manager AI",
  CoreLogic = "Core Logic Coder",
  UIUX = "UI/UX Coder",
  AudioSocial = "Audio & Social Coder",
  QA = "Quality & Integration Coder",
  User = "User",
  CodeSynthesizer = "Code Synthesizer & Patcher",
  CreativeScout = "Creative Scout",
  CreativeCatalyst = "Creative Catalyst",
  MetaArchitect_Evaluator = "Meta-Architect (Evaluator)",
  MetaArchitect_Predictor = "Meta-Architect (Predictor)",
  CEO = "CEO",
  AI_CEO = "AI CEO",
  FailSafe = "Fail-Safe Team",
}

export enum AiAgentStatus {
  Idle = "Idle",
  Thinking = "Thinking",
  Simulating = "Simulating",
  Evaluating = "Evaluating",
  Updating = "Updating",
  Hired = "Hired", // For future use
  Fired = "Fired", // For future use
  Promoted = "Promoted", // For future use
}

export interface ConversationTurn {
  role: AiRole;
  content: string;
  isThinking?: boolean;
}

export interface WorkdayLogEntry {
  id: string;
  timestamp: number;
  role: AiRole;
  content: string;
  isThinking?: boolean;
}

export interface ExperimentalFeature {
  name: string;
  description: string;
  status: 'stable' | 'experimental' | 'deprecated';
  impactMetrics: string[];
}

export interface PerformanceMetrics {
  solutionQuality: number;
  managerPerformance: number;
  promptQuality: number;
  architecturalComplianceScore?: number;
  architecturalDebtAccumulationRate?: number;
  innovationScore?: number; // 1-5 scale
  inspirationUtilizationRate?: number; // 0.0-1.0 scale;
  codeReuseRate?: number; // 0.0-1.0 scale
  // New Creative Layer Metrics
  innovationLayersAdded?: number;
  creativeLeapsCount?: number;
  experimentalFeaturesDeveloped?: ExperimentalFeature[];
  // New Fail-Safe Metric
  bottlenecksUnresolvedCount?: number;
  internalTelemetryCollectionRate?: number; // 0.0-1.0 scale
  apiCostReductionFactor?: number; // 0.0-1.0 scale
}

export interface HistoricalRecord {
  timestamp: number;
  metrics: PerformanceMetrics;
  evaluationText: string;
  suggestion: string;
  rewrittenPrompt: string;
  refactoringMandate?: string;
  mockCodeSynthesis?: string;
  architecturalEvolutionStrategy?: string;
  selfEvaluation?: SelfEvaluation; // Added for easier access
  evolvedCodebase?: string; // Add evolved codebase to history for growth rate calculation
  cycleDuration?: number; // in seconds
}

export interface SelfEvaluation {
  text: string;
  scores: PerformanceMetrics | null;
  growthRoadmap?: GrowthRoadmap;
}

export interface ArchitecturalMandate {
  id: string;
  description: string;
  source: string; // e.g., "Manager AI", "PredictiveIntelligenceService"
}

export interface ConceptualSchema {
  id: string;
  name: string;
  schema: string; // e.g., JSON schema, data flow diagram text
  type: 'API' | 'DataFlow' | 'EventContract' | 'Other';
}

// For the AI CEO's structured output
export interface PromptChange {
    role: AiRole;
    newPrompt: string;
}

export interface AiCeoDirective {
    analysis: string;
    promptChanges: PromptChange[];
}

export interface GrowthRoadmapPhase {
  phase: number;
  title: string;
  objective: string;
  keyArchitecturalFocus: string[];
  estimatedCycles: number;
}

export interface GrowthRoadmap {
  title: string;
  strategicGoal: string;
  phases: GrowthRoadmapPhase[];
}

export interface TeamDiscussion {
  conversation: ConversationTurn[];
  finalPlan: string;
  rewrittenPrompt: string;
  refactoringMandate?: string;
  selfEvaluation?: SelfEvaluation;
  mockCodeSynthesis?: string;
  evolvedCodebase?: string;
  creativeTeamChat?: CreativeTeamChatTurn[];
  inspirationCodeBankSnapshot?: CodeSnippet[];
  // New distinct fields from QA report
  managerFindings?: string;
  runtimeValidationFindings?: string;
  architecturalRefinements?: string;
  architecturalEvolutionStrategy?: string;
  aiCeoDirective?: AiCeoDirective;
  growthRoadmap?: GrowthRoadmap;
}

export interface CreativeTeamDiscussion {
    conversation: ConversationTurn[];
    inspirationalCode: string;
}

export interface Trend {
  metric: keyof PerformanceMetrics;
  direction: 'upward' | 'downward' | 'flat';
  slope: number;
}

export interface Anomaly {
  metric: keyof PerformanceMetrics;
  record: HistoricalRecord;
  deviation: number;
}

export interface RootCauseInference {
  observation: string;
  inferredCause: string;
  supportingData: string[];
}

export interface PredictiveTrajectoryPoint {
  cycle: number; // e.g., 0 (current), 1 (next), 2, ...
  anticipatedDebt: number; // 0.0 - 1.0
  predictedCompliance: number; // 1 - 5
}

export interface PredictiveVisualizationSchema {
  trajectory: PredictiveTrajectoryPoint[];
  summary: string;
}

export enum GrowthTrend {
    Incremental = 'Incremental',
    Exponential = 'Exponential',
    Stagnant = 'Stagnant',
    Declining = 'Declining',
}

export interface GrowthTrendAnalysis {
    trend: GrowthTrend;
    entityId: string;
    metric: string;
    rateOfChange: number;
    colorCode: 'green' | 'yellow' | 'red' | 'blue';
}

export interface PredictiveForecast {
    targetMetric: string;
    forecastValue: number;
    forecastDate: number;
    confidence: number;
    leadingIndicators: {
        eventType: string; // Simplified for UI
        count: number;
        impact: number;
    }[];
}

export interface PredictionResult {
  trends: Trend[];
  anomalies: Anomaly[];
  aiAnalysis: {
    rootCauseInferences: RootCauseInference[];
    proactiveSuggestions: string[];
    futureArchitecturalMandates?: ArchitecturalMandate[];
    proactiveSchemaProposals?: ConceptualSchema[];
    predictiveVisualization?: PredictiveVisualizationSchema;
    // New Creative Layer Analysis
    growthTrendAnalysis?: GrowthTrendAnalysis[];
    predictiveForecasts?: PredictiveForecast[];
  } | null;
}

export interface CodeSnippet {
    id: string; 
    content: string; 
    source: AiRole;
    timestamp: number;
    validationStatus: 'valid' | 'invalid' | 'unvalidated' | 'approved' | 'pending' | 'deprecated';
    validatorNotes?: string;
    relevanceTags: string[];
    referencedCount: number;
    cycleNumber?: number;
    building?: Building;
}

export interface InspirationCodeBank {
    [id: string]: CodeSnippet;
}

export interface CreativeTeamChatTurn {
    role: AiRole.CreativeScout | AiRole.CreativeCatalyst;
    content: string;
    timestamp: number;
}

export interface AiAgent {
  id: string; // Unique identifier, e.g., AiRole enum value
  role: AiRole;
  name: string;
  currentPrompt: string;
  // conversationHistory is deprecated for live simulation, use global workdayLog instead
  conversationHistory: ConversationTurn[]; 
  lastOutputContent: string;
  metricsHistory: PerformanceMetrics[]; // Historical metrics specific to this agent's performance
  status: AiAgentStatus;
  lastUpdated: number;
}

export interface CheckpointRecord {
  timestamp: number;
  cycle: number;
  metrics: PerformanceMetrics;
  summary: string;
}

export interface DailySummary {
  date: number;
  checkpoints: CheckpointRecord[];
  finalMetrics: PerformanceMetrics | null;
  growthAnalysis: string;
}

export interface FailSafeCriteria {
    minCodeGrowthRate: number; // percentage
    maxPerformanceDrop: number; // percentage
    maxBottlenecks: number;
    minCodeReuseRate: number; // percentage
    maxCycleDuration: number; // seconds
}

export interface FailSafeReport {
    triggeredCriteria: keyof FailSafeCriteria | 'missingCodeReuse' | 'lowCodeReuseRate' | 'maxCycleDurationExceeded';
    message: string;
    remediationSteps: string[];
}

export interface CodeBundle {
    cycleNumber: number;
    timestamp: number;
    suggestion: string;
    finalPlan: string;
    evolvedCodebase: string;
    snippets: CodeSnippet[];
}

export interface CEOSummary {
    reportText: string;
    finalCodebase: string;
    nextObjective: string;
}
