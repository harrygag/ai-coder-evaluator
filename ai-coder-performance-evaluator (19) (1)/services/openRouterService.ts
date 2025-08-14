

import Bottleneck from 'bottleneck';
import { TeamDiscussion, AiRole, ConversationTurn, HistoricalRecord, Trend, Anomaly, RootCauseInference, PerformanceMetrics, PredictionResult, CodeSnippet, AiCeoDirective, GrowthRoadmap, AiAgentStatus, DailySummary, WorkdayLogEntry, Building, CodeBundle, CEOSummary } from '../types';
import eventBus from './eventBus';
import codeBankService from './codeBankService';
import promptManagementService from './promptManagementService';
import performanceHistoryService from "./performanceHistoryService";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "anthropic/claude-3-haiku-20240307";


// Initialize a rate limiter to prevent exceeding API quotas.
const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 3000,
});

// Publish queue count updates to the UI
limiter.on('scheduled', () => eventBus.publish('apiQueue:updated', limiter.counts()));
limiter.on('executing', () => eventBus.publish('apiQueue:updated', limiter.counts()));
limiter.on('done', () => eventBus.publish('apiQueue:updated', limiter.counts()));
limiter.on('failed', () => eventBus.publish('apiQueue:updated', limiter.counts()));


const roleToBuildingMap: Record<AiRole, Building> = {
    [AiRole.Manager]: Building.OVERSIGHT,
    [AiRole.QA]: Building.OVERSIGHT,
    [AiRole.MetaArchitect_Evaluator]: Building.OVERSIGHT,
    [AiRole.MetaArchitect_Predictor]: Building.OVERSIGHT,
    [AiRole.AI_CEO]: Building.OVERSIGHT,
    [AiRole.FailSafe]: Building.OVERSIGHT,
    [AiRole.CoreLogic]: Building.CORE_OPERATIONS,
    [AiRole.CodeSynthesizer]: Building.CORE_OPERATIONS,
    [AiRole.UIUX]: Building.DESIGN_EXPERIENCE,
    [AiRole.AudioSocial]: Building.DESIGN_EXPERIENCE,
    [AiRole.CreativeScout]: Building.CREATIVE_INNOVATION,
    [AiRole.CreativeCatalyst]: Building.CREATIVE_INNOVATION,
    [AiRole.CEO]: Building.OVERSIGHT,
    [AiRole.User]: Building.OVERSIGHT,
};


const generateResponse = async (systemInstruction: string, userPrompt: string, options: { temperature?: number, isJson?: boolean } = {}): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
        throw new Error("OpenRouter API key is missing. Please set the OPENROUTER_API_KEY environment variable and restart the application.");
    }
    
    return limiter.schedule(async () => {
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        
        const finalUserPrompt = options.isJson
            ? `${userPrompt}\n\nIMPORTANT: You must respond with only a valid JSON object based on the instructions, without any surrounding text, explanations, or markdown code blocks.`
            : userPrompt;
        messages.push({ role: 'user', content: finalUserPrompt });

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': `${location.protocol}//${location.host}`,
                'X-Title': 'AI Coder Performance Evaluator',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                temperature: options.temperature ?? 0.8
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        return (data.choices[0].message.content || '').trim();
    });
};

const generateStreamingResponse = async (
    systemInstruction: string,
    userPrompt: string,
    role: AiRole,
    updateAgentLastOutput: (role: AiRole, content: string) => void,
    onChunk: (chunk: string) => void
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
        throw new Error("OpenRouter API key is missing. Please set the OPENROUTER_API_KEY environment variable and restart the application.");
    }

    return limiter.schedule(async () => {
        const messages = [];
        if (systemInstruction) {
            messages.push({ role: 'system', content: systemInstruction });
        }
        messages.push({ role: 'user', content: userPrompt });

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': `${location.protocol}//${location.host}`,
                'X-Title': 'AI Coder Performance Evaluator',
            },
            body: JSON.stringify({
                model: MODEL_NAME,
                messages,
                stream: true,
                temperature: 0.8
            })
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last partial line in buffer

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.substring(6).trim();
                    if (dataStr === '[DONE]') break;
                    try {
                        const chunkData = JSON.parse(dataStr);
                        const chunkText = chunkData.choices[0]?.delta?.content;
                        if (chunkText) {
                            fullResponse += chunkText;
                            onChunk(fullResponse);
                        }
                    } catch (e) {
                        console.error('Error parsing stream chunk:', dataStr, e);
                    }
                }
            }
        }
        
        const finalResponse = fullResponse.trim();
        updateAgentLastOutput(role, finalResponse);

        return finalResponse;
    });
};

export const extractSection = (text: string, startMarker: string, endMarkers: string[]): string | undefined => {
    const regex = new RegExp(`${startMarker}\\s*([\\s\\S]*?)(?=${endMarkers.join('|')}|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : undefined;
}

export const parseJsonSection = <T>(text: string, startMarker: string, endMarkers: string[]): T | undefined => {
    const sectionContent = extractSection(text, startMarker, endMarkers);
    if (!sectionContent) return undefined;

    const jsonMatch = sectionContent.match(/```json\s*([\s\\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1]) as T;
        } catch (e) {
            console.error(`Failed to parse JSON from section ${startMarker}:`, e);
            return undefined;
        }
    }
    return undefined;
};


const parseFinalOutput = (text: string): Omit<TeamDiscussion, 'conversation' | 'selfEvaluation' | 'evolvedCodebase' | 'creativeTeamChat' | 'inspirationCodeBankSnapshot' | 'aiCeoDirective'> => {
    const allMarkers = [
        "### FINAL PLAN",
        "### MANAGER AI FINDINGS & CORRECTIONS",
        "### MANAGER AI PROACTIVE REFACTORING MANDATES",
        "### MOCK CODE SYNTHESIS",
        "### RUNTIME ARCHITECTURAL VALIDATION & PERFORMANCE IMPACT ANALYSIS FINDINGS",
        "### PERFORMANCE-DRIVEN ARCHITECTURAL REFINEMENTS",
        "### ACTIONABLE GROWTH ROADMAP",
        "### REWRITTEN PROMPT",
        "### ARCHITECTURAL EVOLUTION STRATEGY"
    ];

    const getEndMarkers = (current: string) => allMarkers.filter(m => m !== current);

    const finalPlan = extractSection(text, "### FINAL PLAN", getEndMarkers("### FINAL PLAN")) || "No final plan was generated.";
    const managerFindings = extractSection(text, "### MANAGER AI FINDINGS & CORRECTIONS", getEndMarkers("### MANAGER AI FINDINGS & CORRECTIONS"));
    const refactoringMandate = extractSection(text, "### MANAGER AI PROACTIVE REFACTORING MANDATES", getEndMarkers("### MANAGER AI PROACTIVE REFACTORING MANDATES"));
    const mockCodeSynthesis = extractSection(text, "### MOCK CODE SYNTHESIS", getEndMarkers("### MOCK CODE SYNTHESIS"))?.replace(/```(?:typescript|ts)\s*([\s\\S]*?)\s*```/, '$1');
    const runtimeValidationFindings = extractSection(text, "### RUNTIME ARCHITECTURAL VALIDATION & PERFORMANCE IMPACT ANALYSIS FINDINGS", getEndMarkers("### RUNTIME ARCHITECTURAL VALIDATION & PERFORMANCE IMPACT ANALYSIS FINDINGS"));
    const architecturalRefinements = extractSection(text, "### PERFORMANCE-DRIVEN ARCHITECTURAL REFINEMENTS", getEndMarkers("### PERFORMANCE-DRIVEN ARCHITECTURAL REFINEMENTS"));
    const growthRoadmap = parseJsonSection<GrowthRoadmap>(text, "### ACTIONABLE GROWTH ROADMAP", getEndMarkers("### ACTIONABLE GROWTH ROADMAP"));
    const rewrittenPrompt = extractSection(text, "### REWRITTEN PROMPT", getEndMarkers("### REWRITTEN PROMPT")) || "No rewritten prompt was generated.";
    const architecturalEvolutionStrategy = extractSection(text, "### ARCHITECTURAL EVOLUTION STRATEGY", getEndMarkers("### ARCHITECTURAL EVOLUTION STRATEGY"));

    return { 
        finalPlan, 
        managerFindings,
        refactoringMandate, 
        mockCodeSynthesis, 
        runtimeValidationFindings,
        architecturalRefinements,
        growthRoadmap,
        rewrittenPrompt, 
        architecturalEvolutionStrategy,
    };
};

const runCodeSynthesis = async (finalPlan: string, currentCodebase: string, updateAgentStatus: (role: AiRole, status: AiAgentStatus) => void, updateAgentLastOutput: (role: AiRole, content: string) => void): Promise<string> => {
    updateAgentStatus(AiRole.CodeSynthesizer, AiAgentStatus.Thinking);
    const systemInstruction = promptManagementService.getPrompt(AiRole.CodeSynthesizer);
    const userPrompt = `Based on the following approved plan, please rewrite the entire codebase provided.\n\n### APPROVED PLAN\n${finalPlan}\n\n---\n\n### CURRENT CODEBASE (Rewrite this)\n\`\`\`\n${currentCodebase}\n\`\`\`\n`;
    
    const evolvedCodebase = await generateResponse(systemInstruction, userPrompt, { temperature: 0.5 });
    
    updateAgentLastOutput(AiRole.CodeSynthesizer, "Codebase successfully evolved.");
    updateAgentStatus(AiRole.CodeSynthesizer, AiAgentStatus.Idle);
    return evolvedCodebase;
};

// NEW: Tick-based agent communication
export const simulateAgentTick = async (
    role: AiRole,
    suggestion: string,
    codebase: string,
    workdayLog: string,
    cycleNumber: number
): Promise<string> => {
    const systemInstruction = promptManagementService.getTickPrompt(role);
    
    // Query code bank for relevant snippets
    const relevantSnippets = codeBankService.querySnippets(suggestion, 3);
    let relevantSnippetsPrompt = "No relevant snippets found in the code bank.";
    if (relevantSnippets.length > 0) {
        relevantSnippetsPrompt = "Here are some relevant snippets from the Code Bank. If you use an idea from a snippet, state `REUSING: [snippet-id]` in your response.\n" + 
        relevantSnippets.map(s => `--- SNIPPET ${s.id} ---\n\`\`\`\n${s.content}\n\`\`\`\n`).join('\n');
    }

    const userPrompt = `
**GOAL:** ${suggestion}
**CODEBASE:**
\`\`\`
${codebase || "No codebase provided."}
\`\`\`
**RELEVANT SNIPPETS FROM CODE BANK (Consider these before writing new code):**
${relevantSnippetsPrompt}
---
**CURRENT CONVERSATION LOG:**
---
${workdayLog}
---
Now, provide your next message.`;

    const response = await generateResponse(systemInstruction, userPrompt);

    // After getting a response, if it's high quality, add it to the bank.
    if (role !== AiRole.Manager && response.length > 100) { // Simple quality check
        codeBankService.addSnippet({
            content: response,
            source: role,
            validationStatus: 'pending',
            relevanceTags: suggestion.split(' '),
            cycleNumber,
            building: roleToBuildingMap[role]
        });
    }

    // Check for reuse declarations
    const reuseMatches = response.match(/REUSING:\s*\[(snippet-[^\]]+)\]/g);
    if (reuseMatches) {
        reuseMatches.forEach(match => {
            const snippetId = match.match(/\[(snippet-[^\]]+)\]/)?.[1];
            if (snippetId) {
                codeBankService.incrementReferenceCount(snippetId);
            }
        });
    }

    return response;
};

// NEW: End-of-day synthesis
export const synthesizeWorkdayReport = async (
    suggestion: string,
    codebase: string,
    workdayLog: string,
    updateAgentLastOutput: (role: AiRole, content: string) => void,
    onChunk: (chunk: string) => void
): Promise<Omit<TeamDiscussion, 'selfEvaluation'>> => {
    const systemInstruction = promptManagementService.getSynthesisPrompt();
    const userPrompt = `
**ORIGINAL SUGGESTION:** ${suggestion}
**INITIAL CODEBASE:**
\`\`\`
${codebase || "No codebase provided."}
\`\`\`
---
**FULL WORKDAY COMMUNICATION LOG:**
${workdayLog}
---
Now, based on the entire log, generate the complete, final report in the mandatory format.
`;
    
    const finalOutput = await generateStreamingResponse(systemInstruction, userPrompt, AiRole.Manager, updateAgentLastOutput, onChunk);
    const parsedResult = parseFinalOutput(finalOutput);
    
    const evolvedCodebase = await runCodeSynthesis(parsedResult.finalPlan, codebase, () => {}, (role, content) => updateAgentLastOutput(role, content));
    
    eventBus.publish('simulationCompletion');

    return {
        ...parsedResult,
        conversation: [], // The log is separate now, final report doesn't contain it.
        evolvedCodebase,
        inspirationCodeBankSnapshot: codeBankService.querySnippets(suggestion, 5),
    };
};


export const simulateCreativeTeamCycle = async (
    suggestion: string,
    updateAgentLastOutput: (role: AiRole, content: string) => void,
    addWorkdayLogEntry: (entry: Omit<WorkdayLogEntry, 'id' | 'timestamp'>) => void,
    cycleNumber: number,
): Promise<void> => {

    // Step 1: Creative Scourer
    const scourerSystemInstructionTemplate = promptManagementService.getPrompt(AiRole.CreativeScout);
    const scourerSystemInstruction = scourerSystemInstructionTemplate.replace('[[USER_SUGGESTION]]', suggestion);
    addWorkdayLogEntry({ role: AiRole.CreativeScout, isThinking: true, content: "Searching for inspiration..."});
    const codeProposal = await generateResponse(scourerSystemInstruction, `User Suggestion: "${suggestion}"`);
    addWorkdayLogEntry({ role: AiRole.CreativeScout, content: codeProposal });
    updateAgentLastOutput(AiRole.CreativeScout, codeProposal);
    eventBus.publish('creativeTeam:codeFound', codeProposal);

    // Step 2: Creative Validator
    const validatorSystemInstructionTemplate = promptManagementService.getPrompt(AiRole.CreativeCatalyst);
    const validatorSystemInstruction = validatorSystemInstructionTemplate
        .replace('[[USER_SUGGESTION]]', suggestion)
        .replace('[[CODE_PROPOSAL]]', codeProposal);
    
    addWorkdayLogEntry({ role: AiRole.CreativeCatalyst, isThinking: true, content: "Validating proposal..."});
    const validationResponse = await generateResponse(validatorSystemInstruction, `Critique the scout's proposal based on its architectural value.`);
    addWorkdayLogEntry({ role: AiRole.CreativeCatalyst, content: validationResponse });
    updateAgentLastOutput(AiRole.CreativeCatalyst, validationResponse);

    const verdictMatch = validationResponse.match(/VERDICT:\s*(valid|invalid)/i);
    const verdict = (verdictMatch ? verdictMatch[1].toLowerCase() : 'invalid') as 'valid' | 'invalid';
    const validatorNotes = validationResponse.replace(/VERDICT:\s*(valid|invalid)/i, '').trim();

    const newSnippet = codeBankService.addSnippet({
        content: codeProposal,
        source: AiRole.CreativeScout,
        validationStatus: verdict,
        validatorNotes: validatorNotes,
        relevanceTags: suggestion.split(' '),
        cycleNumber: cycleNumber,
        building: Building.CREATIVE_INNOVATION,
    });

    eventBus.publish('creativeTeam:snippetValidated', newSnippet);
};


export const runSelfEvaluation = async (
    discussion: TeamDiscussion,
    codebase: string,
    log: WorkdayLogEntry[],
    updateAgentStatus: (role: AiRole, status: AiAgentStatus) => void,
    updateAgentMetrics: (role: AiRole, metrics: PerformanceMetrics) => void,
    updateAgentLastOutput: (role: AiRole, content: string) => void
): Promise<string> => {
    updateAgentStatus(AiRole.MetaArchitect_Evaluator, AiAgentStatus.Evaluating);
    const systemInstruction = promptManagementService.getPrompt(AiRole.MetaArchitect_Evaluator);

    const fullLogText = log.map(e => `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.role}]: ${e.content}`).join('\n');

    // Calculate codeReuseRate programmatically
    const nonManagerMessages = log.filter(e => e.role !== AiRole.Manager && !e.isThinking && e.content);
    const reuseStatements = log.filter(e => e.content.match(/REUSING:\s*\[(snippet-[^\]]+)\]/g));
    const calculatedCodeReuseRate = nonManagerMessages.length > 0 ? reuseStatements.length / nonManagerMessages.length : 0;

    const userPrompt = `Here is the context for your analysis:

Original Codebase:
\`\`\`
${codebase || "No codebase was provided."}
\`\`\`

Synthesized End-of-Day Report:
${discussion.finalPlan}
// ... other sections of the report

Evolved Codebase (Generated by Code Synthesizer):
\`\`\`
${discussion.evolvedCodebase || "Codebase was not evolved in this cycle."}
\`\`\`

Full Communication Log:
\`\`\`
${fullLogText}
\`\`\`

Programmatically, the code reuse rate was calculated to be ${calculatedCodeReuseRate.toFixed(2)}. Please use this value for the 'codeReuseRate' in your JSON response. Now, please provide your meta-architectural evaluation. Critique the process and the final output. Then provide the mandatory JSON block containing all scores (including the provided codeReuseRate) and a growth roadmap as specified in your system instructions.
`;

    const evaluation = await generateResponse(systemInstruction, userPrompt, { isJson: true });
    
    const parsedEvaluation = performanceHistoryService.parseEvaluation(evaluation);
    if(parsedEvaluation.growthRoadmap) {
        eventBus.publish('metaArchitect:growthRoadmapFormulated', parsedEvaluation.growthRoadmap);
    }
    
    if (parsedEvaluation.scores) {
        const finalScores = { ...parsedEvaluation.scores, codeReuseRate: calculatedCodeReuseRate };
        updateAgentMetrics(AiRole.MetaArchitect_Evaluator, finalScores);
        const latestHistory = performanceHistoryService.getHistory().pop();
        if(latestHistory) {
            performanceHistoryService.updateLatestRecord({
                ...latestHistory,
                selfEvaluation: { ...parsedEvaluation, scores: finalScores },
                metrics: finalScores,
            });
        }
    }
    updateAgentLastOutput(AiRole.MetaArchitect_Evaluator, "Evaluation complete.");
    updateAgentStatus(AiRole.MetaArchitect_Evaluator, AiAgentStatus.Idle);

    return evaluation;
};

export const simulateAiCeoTurn = async (
    history: HistoricalRecord[],
    lastDiscussion: TeamDiscussion,
    updateAgentStatus: (role: AiRole, status: AiAgentStatus) => void,
    updateAgentLastOutput: (role: AiRole, content: string) => void,
    addWorkdayLogEntry: (entry: Omit<WorkdayLogEntry, 'id' | 'timestamp'>) => void
): Promise<AiCeoDirective | null> => {
    if (history.length === 0) return null;

    updateAgentStatus(AiRole.AI_CEO, AiAgentStatus.Thinking);
    const systemInstruction = promptManagementService.getPrompt(AiRole.AI_CEO);

    const userPrompt = `
**Final Synthesized Report (Last Cycle):**
${lastDiscussion.finalPlan}
//... other sections

**Final Self-Evaluation & Metrics (Last Cycle):**
\`\`\`json
${JSON.stringify(lastDiscussion.selfEvaluation, null, 2)}
\`\`\`

**Recent Historical Performance Data:**
\`\`\`json
${JSON.stringify(history.slice(-5), null, 2)}
\`\`\`

Based on all of this data, provide your analysis and issue new prompt directives if necessary to drive team performance.
`;

    try {
        const responseText = await generateResponse(systemInstruction, userPrompt, { temperature: 0.6, isJson: true });
        const directive = JSON.parse(responseText) as AiCeoDirective;
        
        directive.promptChanges.forEach(change => {
            promptManagementService.setPrompt(change.role, change.newPrompt);
        });

        updateAgentLastOutput(AiRole.AI_CEO, directive.analysis);
        addWorkdayLogEntry({ role: AiRole.AI_CEO, content: directive.analysis });
        updateAgentStatus(AiRole.AI_CEO, AiAgentStatus.Idle);
        return directive;

    } catch (error) {
        console.error("AI CEO turn failed:", error);
        updateAgentLastOutput(AiRole.AI_CEO, "Failed to generate directive.");
        updateAgentStatus(AiRole.AI_CEO, AiAgentStatus.Idle);
        throw error;
    }
}


export const runPredictiveAnalysis = async (
    history: HistoricalRecord[],
    trends: Trend[],
    anomalies: Anomaly[],
    updateAgentStatus: (role: AiRole, status: AiAgentStatus) => void,
    updateAgentLastOutput: (role: AiRole, content: string) => void
): Promise<PredictionResult['aiAnalysis']> => {
    updateAgentStatus(AiRole.MetaArchitect_Predictor, AiAgentStatus.Thinking);
    const systemInstruction = promptManagementService.getPrompt(AiRole.MetaArchitect_Predictor);

    const negativeTrends = trends.filter(t => t.direction === 'downward');
    const relevantObservations = [
        ...negativeTrends.map(t => `A consistent ${t.direction} trend in '${t.metric}' (slope: ${t.slope.toFixed(2)})`),
        ...anomalies.map(a => `An anomalous drop in '${a.metric}' on ${new Date(a.record.timestamp).toLocaleDateString()}`)
    ];

    if (relevantObservations.length === 0) {
        const summary = "No negative trends to project from. Trajectory is stable.";
        updateAgentLastOutput(AiRole.MetaArchitect_Predictor, summary);
        updateAgentStatus(AiRole.MetaArchitect_Predictor, AiAgentStatus.Idle);
        return { 
            rootCauseInferences: [], 
            proactiveSuggestions: ["All metrics are stable or improving. The team is performing well. Consider increasing the complexity of the next 'Nuclear Prompt' to continue challenging the team."],
            futureArchitecturalMandates: [],
            proactiveSchemaProposals: [],
            predictiveVisualization: { trajectory: [], summary },
            growthTrendAnalysis: [],
            predictiveForecasts: []
        };
    }

    const userPrompt = `Analysis of historical data has revealed the following:
- ${relevantObservations.join('\n- ')}

Here is the full historical data for context:
\`\`\`json
${JSON.stringify(history, null, 2)}
\`\`\`

Based on this, please provide your analysis. Infer potential root causes, generate future architectural mandates, proactive schema proposals, a predictive visualization schema, classify growth trends, and generate predictive forecasts.
`;
    
    const responseText = await generateResponse(systemInstruction, userPrompt, { temperature: 0.7, isJson: true });
    const parsedResponse = JSON.parse(responseText);

    const summary = parsedResponse.predictiveVisualization?.summary || "Analysis complete.";
    updateAgentLastOutput(AiRole.MetaArchitect_Predictor, summary);
    updateAgentStatus(AiRole.MetaArchitect_Predictor, AiAgentStatus.Idle);
    return parsedResponse;
};


export const generateDailySummary = async (summaryData: DailySummary): Promise<string> => {
    const systemInstruction = "You are an executive analyst. You will be given a JSON object representing a simulated day of AI software development, including checkpoints with performance metrics. Your task is to write a concise, high-level summary of the day's growth, achievements, and overall trajectory. Focus on the exponential growth and innovation.";
    const userPrompt = `Please analyze the following daily summary and provide your report:\n\n\`\`\`json\n${JSON.stringify(summaryData, null, 2)}\n\`\`\``;

    return generateResponse(systemInstruction, userPrompt);
};

export const generateNewDailyObjective = async (history: HistoricalRecord[], lastDiscussion: TeamDiscussion): Promise<string> => {
    const systemInstruction = `You are the AI CEO. You have just completed a full workday simulation. Your task is to analyze the final state and set a single, concise, high-level strategic objective for the *next* workday. This objective should guide the team's focus, addressing the most critical area for improvement or the biggest opportunity for growth. Do not explain your reasoning, just provide the objective.`;
    const userPrompt = `Analyze the following end-of-day report and generate the next day's objective.

**Final AI CEO Analysis from Today:**
${lastDiscussion.aiCeoDirective?.analysis || "No specific analysis was provided."}

**Final Meta-Architect Evaluation from Today:**
\`\`\`json
${JSON.stringify(lastDiscussion.selfEvaluation, null, 2)}
\`\`\`

**Recent Performance History:**
\`\`\`json
${JSON.stringify(history.slice(-5), null, 2)}
\`\`\`

Based on all this, what is the single most important objective for tomorrow? Respond with ONLY that objective.`;
    
    const responseText = await generateResponse(systemInstruction, userPrompt, { temperature: 0.9 });
    return (responseText || 'Continue to drive exponential growth and innovation.').trim();
};

export const bundleCycleCode = (discussion: TeamDiscussion, cycleCount: number): CodeBundle => {
    return {
        cycleNumber: cycleCount,
        timestamp: Date.now(),
        suggestion: performanceHistoryService.getHistory().slice(-1)[0]?.suggestion || '',
        finalPlan: discussion.finalPlan,
        evolvedCodebase: discussion.evolvedCodebase || '',
        snippets: codeBankService.getAllSnippets().filter(s => s.cycleNumber === cycleCount),
    };
};

export const generateCeoReportText = async (
    lastDiscussion: TeamDiscussion,
    history: HistoricalRecord[]
): Promise<string> => {
    const systemInstruction = `You are the AI CEO. Your task is to provide a concise, end-of-day summary for the user (the Meta-Architect).
Review the provided context: the final synthesized plan, the self-evaluation from the Meta-Architect AI, and the historical data.
Based on this, write a brief report covering:
1.  A high-level assessment of the cycle's outcome.
2.  Key insights or strategic implications.
3.  Your confidence in the team's current trajectory.
Your response should be a direct, professional memo to your superior.`;

    const userPrompt = `Here is the data for the cycle you need to report on:

### Final Synthesized Plan & Manager Findings
${lastDiscussion.finalPlan}
${lastDiscussion.managerFindings || ''}
${lastDiscussion.architecturalEvolutionStrategy || ''}

### Meta-Architect Self-Evaluation
\`\`\`json
${JSON.stringify(lastDiscussion.selfEvaluation, null, 2)}
\`\`\`

### Recent Performance History
\`\`\`json
${JSON.stringify(history.slice(-3), null, 2)}
\`\`\`

Please provide your summary memo now.`;

    return generateResponse(systemInstruction, userPrompt);
};
