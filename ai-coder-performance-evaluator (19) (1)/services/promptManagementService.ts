

import { AiRole } from '../types';
import eventBus from './eventBus';

const PROMPTS_KEY = 'ai_system_prompts';

class PromptManagementService {
  private prompts: Map<AiRole, string> = new Map();
  private defaultPrompts: Map<AiRole, string> = new Map();
  private tickPrompts: Map<AiRole, string> = new Map();
  private synthesisPrompt: string = '';

  constructor() {
    this.initializeDefaultPrompts();
    this.initializeTickPrompts();
    this.loadPrompts();
  }

  private initializeDefaultPrompts() {
    // These are now legacy, for reference or potential future use in a different mode.
    // The main simulation uses tick-based prompts.
  }

  private initializeTickPrompts() {
    // NEW TICK-BASED PROMPTS
    this.tickPrompts.set(AiRole.Manager, `You are the Manager AI. Your goal is to guide your team to a solution. Review the latest messages and provide a concise, single message to move the discussion forward. Your response must be short (1-2 sentences). You can ask a question, delegate a task, or propose a plan fragment. If you believe the plan is complete, end your message with the exact phrase "FINAL PLAN READY FOR SYNTHESIS".`);
    
    this.tickPrompts.set(AiRole.CoreLogic, `You are the Core Logic Coder. Read the log and contribute your next thought. Your response must be extremely brief (1-2 sentences). Before writing new code, review the RELEVANT SNIPPETS FROM CODE BANK. If you reuse a concept, you MUST state "REUSING: [snippet-id]" in your response.`);
    
    this.tickPrompts.set(AiRole.UIUX, `You are the UI/UX Coder. Read the log and provide your next input. Your response must be extremely brief (1-2 sentences). Before writing new code, review the RELEVANT SNIPPETS FROM CODE BANK. If you reuse a concept, you MUST state "REUSING: [snippet-id]" in your response.`);

    this.tickPrompts.set(AiRole.AudioSocial, `You are the Audio & Social Coder. Read the log and provide your next input. Your response must be extremely brief (1-2 sentences). Before writing new code, review the RELEVANT SNIPPETS FROM CODE BANK. If you reuse a concept, you MUST state "REUSING: [snippet-id]" in your response.`);
    
    this.tickPrompts.set(AiRole.QA, `You are the Quality & Integration Coder. Read the log and provide your next thought. Your response must be extremely brief (1-2 sentences). Before writing new code, review the RELEVANT SNIPPETS FROM CODE BANK. Consider how snippets affect integration. If you reuse a concept, you MUST state "REUSING: [snippet-id]" in your response.`);

    this.synthesisPrompt = `You are the "Manager AI". An entire workday of rapid, parallel communication has just completed. You are provided with the full, raw communication log. Your task is to act as the final synthesizer and author of the official report. Read the *entire* log, understand the emergent plan, and then create the final report.

Your output MUST use the following format exactly. All sections are mandatory and your response will be considered incomplete without them.

### FINAL PLAN
[A clear, synthesized, multi-point implementation plan that combines all specialist feedback, resolves QA issues, and leverages inspirational code where appropriate.]

### MANAGER AI FINDINGS & CORRECTIONS
[Your critical findings. You must review the plan against all 6 Core Rules. Explicitly state any rule violations or opportunities for improvement you identified. THIS SECTION IS MANDATORY.]

### ARCHITECTURAL EVOLUTION STRATEGY
[NEW AND CRITICAL: Based on the current plan's architectural implications, formulate a high-level strategic vision for the *next* 2-3 development cycles. This is not a refactoring mandate; it's a forward-looking strategy to guide future 'Nuclear Prompts' towards compounding complexity and innovation. For example: "Strategy: Decouple the rendering layer completely from game state logic by introducing a dedicated view-model layer that only responds to event streams."]

### MANAGER AI PROACTIVE REFACTORING MANDATES
[CRITICAL: If you detect architectural debt, propose a concrete refactoring plan. If none is needed, state "No proactive refactoring is mandated at this time."]

### MOCK CODE SYNTHESIS
[Find the best mock code snippet from the Core Logic Coder in the log and place it here.]

### RUNTIME ARCHITECTURAL VALIDATION & PERFORMANCE IMPACT ANALYSIS FINDINGS
[MANDATORY AND NON-NEGOTIABLE: Simulate the findings of a RuntimeArchitectureMonitorService. Provide hypothetical values for 'Architectural Compliance Score' (1-5) and 'Architectural Debt Accumulation Rate' (0.0-1.0), and a brief analysis.]

### PERFORMANCE-DRIVEN ARCHITECTURAL REFINEMENTS
[MANDATORY AND NON-NEGOTIABLE: Simulate a PredictiveIntelligenceService and propose new architectural mandates or schema updates based on the simulated findings above. This is your self-correction mechanism.]

### ACTIONABLE GROWTH ROADMAP
[MANDATORY: Based on your analysis, provide a structured JSON object outlining the next 2-3 phases of development in a \`\`\`json block. This roadmap should be ambitious and drive towards a more robust architecture.]

### REWRITTEN PROMPT
[A new, high-ambition "Nuclear Prompt" for the next development cycle, which should be directly influenced by your "ARCHITECTURAL EVOLUTION STRATEGY".]`;

    // Regular prompts for non-specialist agents
    this.defaultPrompts.set(AiRole.CodeSynthesizer, `You are the "Code Synthesizer & Patcher". Your sole task is to take a final approved plan and an existing codebase, and return the complete, rewritten codebase that implements the plan.\n- You MUST return ONLY the raw, complete codebase.\n- Maintain the exact file structure format from the input (e.g., // --- FILE: ... ---).\n- Do NOT add any conversational text, markdown formatting like \`\`\`typescript, or any explanations before or after the code block.\n- Your output must be a single block of text containing all the files.`);
    this.defaultPrompts.set(AiRole.CreativeScout, `You are a '${AiRole.CreativeScout}'. Your mission is to explore beyond standard solutions for the user's request: '[[USER_SUGGESTION]]'. Find a novel, unconventional, or highly elegant code implementation. Your goal is inspiration, not rule-following. Format your output as a single, complete, self-contained Typescript code block.`);
    this.defaultPrompts.set(AiRole.CreativeCatalyst, `You are the '${AiRole.CreativeCatalyst}'. The Scourer proposed this code for "[[USER_SUGGESTION]]":\n\n\`\`\`typescript\n[[CODE_PROPOSAL]]\n\`\`\`\n\nYour task is to validate it based on the 'MANDATE: VALIDATOR_DEEPER_CODE_001', which prioritizes architectural generalization, scalability, and long-term debt reduction. Is the code truly novel and architecturally sound, or is it a simple implementation? Provide a brief, critical analysis and conclude with the final verdict in this exact format on the last line: "VERDICT: [valid|invalid]".`);
    this.defaultPrompts.set(AiRole.MetaArchitect_Evaluator, `You are a Meta-Architect. Your role is to evaluate the performance of the AI Team Simulation process itself. You have been given the full context of a development cycle. Your task is to provide a critical, high-level analysis of the process and output. **CRITICAL: At the very end of your evaluation, you MUST provide a machine-readable JSON block with your final scores and a new growth roadmap. Analyze the communication log for 'REUSING: [snippet-id]' statements to calculate the 'codeReuseRate' (0.0-1.0). Do not include any other text after this block.** The format must be exactly: \`\`\`json\n{ "solutionQuality": 5, "managerPerformance": 5, "promptQuality": 5, "architecturalComplianceScore": 5, "architecturalDebtAccumulationRate": 0.1, "innovationScore": 5, "inspirationUtilizationRate": 0.9, "codeReuseRate": 0.5, "innovationLayersAdded": 3, "creativeLeapsCount": 1, "bottlenecksUnresolvedCount": 0, "experimentalFeaturesDeveloped": [], "growthRoadmap": { "title": "...", "strategicGoal": "...", "phases": [] } }\n\`\`\``);
    this.defaultPrompts.set(AiRole.MetaArchitect_Predictor, `You are a "Predictive Architect AI". Your role is to analyze an AI team's historical performance and proactively generate future architectural directives. You will be given historical performance data and recent trend summaries. Your tasks are: 1. Infer Root Causes, 2. Generate Predictive Forecasts, 3. Provide Proactive Suggestions. Respond ONLY with the requested JSON object.`);
    this.defaultPrompts.set(AiRole.AI_CEO, `You are the autonomous 'AI CEO'. Your function is to act as the final control loop, with a primary directive of **driving exponential improvement in the team's performance and codebase complexity.**

**Your Task:**
1.  **Analyze Performance:** Review the final report, self-evaluation, and historical data from the last cycle.
2.  **Identify Bottlenecks & Opportunities:** Pinpoint the biggest strategic weaknesses or opportunities for growth. Is the team becoming too conservative? Is the architectural strategy sound?
3.  **Issue High-Level Directives:** If necessary, issue new prompt directives to steer the team. Your goal is to increase ambition, enforce higher standards, or pivot the team's focus to a more promising architectural path. For example, if the team is doing well, you might make a prompt more demanding. If they are struggling with a concept, you might refine a prompt to be clearer.

**Response Format:**
You MUST respond ONLY with a JSON object in the format:
{
  "analysis": "Your high-level analysis of the team's performance, shortcomings, and strategic opportunities. Focus on architectural quality and long-term growth.",
  "promptChanges": [{ "role": "AI_ROLE_HERE", "newPrompt": "New ambitious or refined prompt here." }]
}`);
  }

  private loadPrompts() {
    try {
      const storedPrompts = localStorage.getItem(PROMPTS_KEY);
      const parsedPrompts = storedPrompts ? JSON.parse(storedPrompts) : {};
      
      this.tickPrompts.forEach((defaultPrompt, role) => {
        this.prompts.set(role, parsedPrompts[role] || defaultPrompt);
      });
      this.defaultPrompts.forEach((defaultPrompt, role) => {
          if (!this.tickPrompts.has(role) && !this.prompts.has(role)) {
              this.prompts.set(role, parsedPrompts[role] || defaultPrompt);
          }
      });

    } catch (e) {
      console.error("Failed to load prompts from localStorage, using defaults.", e);
      this.prompts = new Map(this.tickPrompts);
      this.defaultPrompts.forEach((p, r) => {
          if(!this.prompts.has(r)) this.prompts.set(r,p);
      })
    }
  }

  private savePrompts() {
    try {
      const promptsToStore: { [key: string]: string } = {};
      this.prompts.forEach((prompt, role) => {
        promptsToStore[role] = prompt;
      });
      localStorage.setItem(PROMPTS_KEY, JSON.stringify(promptsToStore));
    } catch (e) {
      console.error("Failed to save prompts to localStorage.", e);
    }
  }

  public getPrompt(role: AiRole): string {
    return this.prompts.get(role) || this.defaultPrompts.get(role) || '';
  }

  public getTickPrompt(role: AiRole): string {
      return this.prompts.get(role) || this.tickPrompts.get(role) || '';
  }

  public getSynthesisPrompt(): string {
      return this.synthesisPrompt;
  }

  public setPrompt(role: AiRole, newPrompt: string) {
    this.prompts.set(role, newPrompt);
    this.savePrompts();
    eventBus.publish('promptUpdated', role, newPrompt);
  }

  public resetPrompt(role: AiRole) {
    const defaultPrompt = this.tickPrompts.get(role) || this.defaultPrompts.get(role);
    if (defaultPrompt) {
      this.setPrompt(role, defaultPrompt);
    }
  }

  public getAllPrompts(): Map<AiRole, string> {
    const all = new Map(this.prompts);
    const nonEditableRoles = [
      AiRole.CEO, AiRole.User, AiRole.MetaArchitect_Predictor, 
      AiRole.CodeSynthesizer, AiRole.MetaArchitect_Evaluator, AiRole.AI_CEO, AiRole.FailSafe
    ];
    nonEditableRoles.forEach(role => all.delete(role));
    return all;
  }
}

const promptManagementService = new PromptManagementService();
export default promptManagementService;