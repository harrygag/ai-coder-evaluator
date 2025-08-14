
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TeamDiscussion, HistoricalRecord, PredictionResult, InspirationCodeBank, AiRole, AiAgent, AiAgentStatus, PerformanceMetrics, WorkdayLogEntry, FailSafeCriteria, FailSafeReport, Building, CodeBundle, CEOSummary } from './types';
import { synthesizeWorkdayReport, simulateAgentTick, runSelfEvaluation, simulateCreativeTeamCycle, simulateAiCeoTurn, generateNewDailyObjective, bundleCycleCode, generateCeoReportText } from './services/openRouterService';
import InputPanel from './components/InputPanel';
import AgentDetailDisplay from './components/AgentDetailDisplay';
import CreativeTeamDisplay from './components/CreativeTeamDisplay';
import performanceHistoryService from './services/performanceHistoryService';
import codeBankService from './services/codeBankService';
import predictiveAnalysisService from './services/predictiveAnalysisService';
import failSafeService from './services/failSafeService';
import eventBus from './services/eventBus';
import './services/mockAudioService';
import promptManagementService from './services/promptManagementService';
import userRoleService from './services/userRoleService';
import { ManagerDashboard } from './components/ManagerDashboard';
import FailSafeAlert from './components/FailSafeAlert';
import CEOSummaryDisplay from './components/CEOSummaryDisplay';
import { CrownIcon, ManagerIcon } from './components/icons';

interface BottleneckCounts {
    QUEUED: number;
    RUNNING: number;
    EXECUTING: number;
}

const App: React.FC = () => {
  const [suggestion, setSuggestion] = useState('');
  const [codebase, setCodebase] = useState('');
  
  const [activeAiAgents, setActiveAiAgents] = useState<AiAgent[]>(() => {
    try {
      const storedAgents = localStorage.getItem('activeAiAgents');
      const defaultRoles = Object.values(AiRole).filter(role => role !== AiRole.User && role !== AiRole.CEO);
      
      const initializeAgent = (role: AiRole, existingAgent?: AiAgent): AiAgent => {
          const currentPrompt = promptManagementService.getPrompt(role);
          if (!existingAgent) {
              return { id: role, role, name: role, currentPrompt, conversationHistory: [], lastOutputContent: '', metricsHistory: [], status: AiAgentStatus.Idle, lastUpdated: Date.now() };
          }
          return { ...existingAgent, currentPrompt };
      };
      
      if (storedAgents) {
        const parsedAgents: AiAgent[] = JSON.parse(storedAgents);
        const agentsMap = new Map<AiRole, AiAgent>(parsedAgents.map(agent => [agent.role, agent]));
        return defaultRoles.map(role => initializeAgent(role, agentsMap.get(role)));
      }
    } catch (e) {
      console.error("Failed to load activeAiAgents from localStorage, initializing defaults.", e);
    }
    return Object.values(AiRole).filter(role => role !== AiRole.User && role !== AiRole.CEO).map(role => ({
      id: role, role: role, name: role, currentPrompt: promptManagementService.getPrompt(role), conversationHistory: [], lastOutputContent: '', metricsHistory: [], status: AiAgentStatus.Idle, lastUpdated: Date.now(),
    }));
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [discussion, setDiscussion] = useState<TeamDiscussion | null>(null);
  const [codeBank, setCodeBank] = useState<InspirationCodeBank>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [history, setHistory] = useState<HistoricalRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionResult | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSystemDisabled, setIsSystemDisabled] = useState(false);
  
  // State for Tick-based simulation
  const [workdayLog, setWorkdayLog] = useState<WorkdayLogEntry[]>([]);
  const singleCycleControllerRef = useRef<AbortController | null>(null);
  const hyperCycleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // State for Hyper Cycle
  const [isContinuousModeActive, setIsContinuousModeActive] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [simulationStartTime, setSimulationStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [overtimeMs, setOvertimeMs] = useState(0);
  const [dailyObjective, setDailyObjective] = useState('');
  const [apiQueueCount, setApiQueueCount] = useState(0);

  // State for Fail-Safe
  const [isHalted, setIsHalted] = useState(false);
  const [failSafeReport, setFailSafeReport] = useState<FailSafeReport | null>(null);
  const [overtimeIncidents, setOvertimeIncidents] = useState(0);
  const [failSafeCriteria, setFailSafeCriteria] = useState<FailSafeCriteria>(() => failSafeService.getCriteria());
  
  const [lastCodeBundle, setLastCodeBundle] = useState<CodeBundle | null>(null);
  const [ceoSummary, setCeoSummary] = useState<CEOSummary | null>(null);

  const [currentUserRole, setCurrentUserRole] = useState(userRoleService.getCurrentUserRole());


  const CYCLE_DURATION_MS = 1 * 60 * 1000; // 1 minute
  const MAX_OVERTIME_MS = 1 * 60 * 1000;
  // Delay between the end of one sequential tick and the start of the next.
  const TICK_INTERVAL_MS = 3000; // 3 seconds

  useEffect(() => {
    // Proactive check for API key on startup
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined') {
      const errorMessage = "Authentication Failed: Please set the OPENROUTER_API_KEY in your .env file and restart the application. All actions are disabled until the key is provided.";
      setError(errorMessage);
      setIsSystemDisabled(true);
    } else {
      setError(null);
      setIsSystemDisabled(false);
    }
  }, []);

  useEffect(() => {
    const unsub = eventBus.subscribe('cycle:overtimeApproved', (payload: { durationSeconds: number }) => {
      setOvertimeMs(prev => Math.min(prev + payload.durationSeconds * 1000, MAX_OVERTIME_MS));
    });
    return () => unsub();
  }, []);
  
  useEffect(() => {
    const handleQueueUpdate = (counts: BottleneckCounts) => {
      setApiQueueCount(counts.QUEUED + counts.RUNNING);
    };
    const unsub = eventBus.subscribe('apiQueue:updated', handleQueueUpdate);
    return () => unsub();
  }, []);

  const addWorkdayLogEntry = useCallback((entry: Omit<WorkdayLogEntry, 'id' | 'timestamp'>) => {
    setWorkdayLog(prev => {
        const newEntry: WorkdayLogEntry = {
            ...entry,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };

        // If the new entry is from a role that was thinking, replace the "thinking..." message.
        if (!newEntry.isThinking) {
            const lastEntry = prev[prev.length - 1];
            if (lastEntry?.role === newEntry.role && lastEntry?.isThinking) {
                return [...prev.slice(0, -1), newEntry];
            }
        }
        return [...prev, newEntry];
    });
  }, []);

  const updateAgentState = useCallback((role: AiRole, updates: Partial<AiAgent>) => {
    setActiveAiAgents(prevAgents => {
      const updatedAgents = prevAgents.map(agent => {
        if (agent.role === role) {
          const newAgentState = { ...agent, ...updates, lastUpdated: Date.now() };
          eventBus.publish('aiAgent:stateUpdated', newAgentState);
          return newAgentState;
        }
        return agent;
      });
      localStorage.setItem('activeAiAgents', JSON.stringify(updatedAgents));
      return updatedAgents;
    });
  }, []);

  const updateAgentLastOutput = useCallback((role: AiRole, content: string) => {
    updateAgentState(role, { lastOutputContent: content });
  }, [updateAgentState]);

  const updateAgentMetrics = useCallback((role: AiRole, metrics: PerformanceMetrics) => {
    setActiveAiAgents(prevAgents => {
      return prevAgents.map(agent => {
        if (agent.role === role) {
          const newMetricsHistory = [...agent.metricsHistory, metrics];
          return { ...agent, metricsHistory: newMetricsHistory, lastUpdated: Date.now() };
        }
        return agent;
      });
    });
  }, []);

  const updateAgentStatus = useCallback((role: AiRole, status: AiAgentStatus) => {
    updateAgentState(role, { status });
  }, [updateAgentState]);

  useEffect(() => {
    setHistory(performanceHistoryService.getHistory());
    setCodeBank(codeBankService.getBank());
    
    const unsubHistory = eventBus.subscribe('historyUpdated', (h: HistoricalRecord[]) => setHistory(h));
    const unsubBank = eventBus.subscribe('codeBank:updated', (b: InspirationCodeBank) => setCodeBank(b));
    const unsubPrompt = eventBus.subscribe('promptUpdated', (role: AiRole, newPrompt: string) => updateAgentState(role, { currentPrompt: newPrompt }));
    const unsubFailSafeCriteria = eventBus.subscribe('failSafe:criteriaUpdated', (newCriteria: FailSafeCriteria) => {
        setFailSafeCriteria(newCriteria);
    });
    const unsubRoleChange = eventBus.subscribe('userRoleChanged', (newRole: AiRole) => {
        setCurrentUserRole(newRole);
    });
    
    return () => { 
        unsubHistory(); 
        unsubBank(); 
        unsubPrompt(); 
        unsubFailSafeCriteria();
        unsubRoleChange();
    };
  }, [updateAgentState]);
  
  const [adaptiveDifficultyLevel, setAdaptiveDifficultyLevel] = useState(1);

  const handleApiError = useCallback((error: unknown) => {
    console.error("Simulation Error:", error);
    let errorMessage = "An unknown error occurred during simulation.";
    
    if (error instanceof Error) {
        if (
            error.message.includes('API key') ||
            error.message.includes('auth credentials')
        ) {
            errorMessage = "Authentication Failed: Please ensure your OPENROUTER_API_KEY is set correctly and the application has been restarted or rebuilt.";
            setIsSystemDisabled(true); // Lock the system on auth error
        } else {
            errorMessage = `An error occurred: ${error.message}`;
        }
    } else if (typeof error === 'object' && error !== null) {
        errorMessage = `An unexpected error occurred: ${JSON.stringify(error)}`;
    }
    
    setError(errorMessage);

    setIsLoading(false);
    setIsEvaluating(false);
    setIsPredicting(false);
    if (isContinuousModeActive) setIsContinuousModeActive(false);
  }, [isContinuousModeActive]);
  
  const endSimulationAndSynthesize = useCallback(async (log: WorkdayLogEntry[], cycleDuration?: number) => {
    if (hyperCycleTimeoutRef.current) clearTimeout(hyperCycleTimeoutRef.current);
    if (singleCycleControllerRef.current) singleCycleControllerRef.current.abort();

    setIsLoading(true);
    setError(null);
    activeAiAgents.forEach(agent => updateAgentStatus(agent.role, AiAgentStatus.Updating));

    const fullLogText = log.map(e => `[${e.role}]: ${e.content}`).join('\n\n');

    try {
        let finalReport: TeamDiscussion | null = null;
        
        // Made sequential to reduce concurrent load and create a more predictable flow.
        const synthesisResult = await synthesizeWorkdayReport(suggestion, codebase, fullLogText, updateAgentLastOutput, (chunk) => {
             updateAgentLastOutput(AiRole.Manager, chunk);
        });

        await simulateCreativeTeamCycle(suggestion, updateAgentLastOutput, addWorkdayLogEntry, cycleCount);
        
        finalReport = { ...synthesisResult, conversation: [] };

        if (finalReport.evolvedCodebase) {
            setCodebase(finalReport.evolvedCodebase);
        }

        const preliminaryEvaluation = performanceHistoryService.parseEvaluation('');
        performanceHistoryService.addRecord(preliminaryEvaluation, {
            suggestion: suggestion,
            rewrittenPrompt: finalReport.rewrittenPrompt,
            refactoringMandate: finalReport.refactoringMandate,
            mockCodeSynthesis: finalReport.mockCodeSynthesis,
            architecturalEvolutionStrategy: finalReport.architecturalEvolutionStrategy,
            evolvedCodebase: finalReport.evolvedCodebase,
            cycleDuration,
        });
        
        setIsEvaluating(true);
        const critique = await runSelfEvaluation(finalReport, codebase, log, updateAgentStatus, updateAgentMetrics, updateAgentLastOutput);
        const evaluation = performanceHistoryService.parseEvaluation(critique);
        
        finalReport = { ...finalReport, selfEvaluation: evaluation };
        
        const aiCeoDirective = await simulateAiCeoTurn(
            performanceHistoryService.getHistory(), finalReport, updateAgentStatus, updateAgentLastOutput, addWorkdayLogEntry
        );
        if (aiCeoDirective) {
            finalReport = { ...finalReport, aiCeoDirective };
        }

        setDiscussion(finalReport);
        setLastCodeBundle(bundleCycleCode(finalReport, cycleCount));
        return finalReport;

    } catch(err) {
        handleApiError(err);
        return null; // Indicate failure
    } finally {
        setIsLoading(false);
        setIsEvaluating(false);
        activeAiAgents.forEach(agent => updateAgentStatus(agent.role, AiAgentStatus.Idle));
    }
  }, [suggestion, codebase, activeAiAgents, addWorkdayLogEntry, updateAgentLastOutput, updateAgentMetrics, updateAgentStatus, cycleCount, handleApiError]);

  const handleEndOfWorkDay = useCallback(async () => {
    setIsContinuousModeActive(false);
    if (hyperCycleTimeoutRef.current) clearTimeout(hyperCycleTimeoutRef.current);
    
    const cycleDuration = simulationStartTime ? Math.round((Date.now() - simulationStartTime) / 1000) : 0;
    if (cycleDuration > (CYCLE_DURATION_MS / 1000)) {
        setOvertimeIncidents(prev => prev + 1);
    }

    const finalReport = await endSimulationAndSynthesize(workdayLog, cycleDuration);
    if (!finalReport) return; // API error handled in endSimulationAndSynthesize
    
    const currentHistory = performanceHistoryService.getHistory();
    const report = failSafeService.checkFailSafe(currentHistory);
    if (report) {
      setFailSafeReport(report);
      setIsHalted(true);
      eventBus.publish('failSafe:haltTriggered');
      return; // Stop further processing if halted
    }


    if (currentHistory.length > 0 && !isLoading) {
        updateAgentStatus(AiRole.AI_CEO, AiAgentStatus.Thinking);
        try {
            if (failSafeReport === null) {
                const newLevel = adaptiveDifficultyLevel + 1;
                setAdaptiveDifficultyLevel(newLevel);
                const complexityModifier = 1 + (newLevel * 0.1);
                eventBus.publish('difficulty:levelIncreased', { newLevel, complexityModifier });
            }
            const newObjective = await generateNewDailyObjective(currentHistory, finalReport);
            setDailyObjective(newObjective);
            setSuggestion(newObjective);
            updateAgentLastOutput(AiRole.AI_CEO, `New Daily Objective set: "${newObjective}"`);

            // Generate and set CEO summary
            const reportText = await generateCeoReportText(finalReport, currentHistory);
            const summary: CEOSummary = {
                reportText,
                finalCodebase: finalReport.evolvedCodebase || "No code evolved in this cycle.",
                nextObjective: newObjective,
            };
            setCeoSummary(summary);
        } catch (e) {
            handleApiError(e);
        } finally {
            updateAgentStatus(AiRole.AI_CEO, AiAgentStatus.Idle);
        }
    }
  }, [endSimulationAndSynthesize, workdayLog, isLoading, failSafeReport, adaptiveDifficultyLevel, updateAgentStatus, updateAgentLastOutput, simulationStartTime, handleApiError]);
  
  // Countdown timer effect
  useEffect(() => {
    if (!isContinuousModeActive) {
        setTimeRemaining(null);
        return;
    };

    const timerId = setInterval(() => {
      if (isHalted || !simulationStartTime) return;

      const elapsed = Date.now() - simulationStartTime;
      const totalDuration = CYCLE_DURATION_MS + overtimeMs;
      const remaining = totalDuration - elapsed;
      
      // End the cycle if time is up
      if (remaining <= -(failSafeCriteria.maxCycleDuration * 1000 - CYCLE_DURATION_MS)) {
        handleEndOfWorkDay();
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(timerId);
  }, [isContinuousModeActive, simulationStartTime, isHalted, overtimeMs, handleEndOfWorkDay, CYCLE_DURATION_MS, failSafeCriteria.maxCycleDuration]);

  const runSequentialTick = useCallback(async () => {
    const specialistRoles = [AiRole.Manager, AiRole.CoreLogic, AiRole.UIUX, AiRole.AudioSocial, AiRole.QA];
    
    // Use a local variable to build context for the duration of the tick to avoid state lag
    let tickContextLog = [...workdayLog];

    for (const role of specialistRoles) {
        // Stop the sequence if the cycle is no longer active
        if (!isContinuousModeActive) break;

        const logTextForAgent = tickContextLog.map(e => `[${e.role}]: ${e.content}`).join('\n\n');
        
        addWorkdayLogEntry({ role, content: '...', isThinking: true });
        updateAgentStatus(role, AiAgentStatus.Thinking);

        try {
            const content = await simulateAgentTick(role, suggestion, codebase, logTextForAgent, cycleCount);
            
            const newEntry = { role, content };
            addWorkdayLogEntry(newEntry);
            updateAgentLastOutput(role, content);
            updateAgentStatus(role, AiAgentStatus.Idle);
            
            // Add the new message to our local context for the next agent
            tickContextLog.push({ ...newEntry, id: `local-${Date.now()}`, timestamp: Date.now() });

        } catch (e) {
            handleApiError(e);
            updateAgentStatus(role, AiAgentStatus.Idle);
            // Stop the rest of the tick on error
            return; 
        }
    }
  }, [workdayLog, isContinuousModeActive, addWorkdayLogEntry, updateAgentStatus, suggestion, codebase, cycleCount, updateAgentLastOutput, handleApiError]);


  // Main tick loop for Hyper Cycle
  useEffect(() => {
    if (!isContinuousModeActive || isHalted) {
        if(hyperCycleTimeoutRef.current) clearTimeout(hyperCycleTimeoutRef.current);
        return;
    }
    
    let isCancelled = false;

    const hyperCycleLoop = async () => {
        if (isCancelled) return;
        await runSequentialTick();
        
        if (isCancelled) return;
        hyperCycleTimeoutRef.current = setTimeout(hyperCycleLoop, TICK_INTERVAL_MS);
    };

    hyperCycleLoop(); // Start the loop

    return () => {
        isCancelled = true;
        if(hyperCycleTimeoutRef.current) clearTimeout(hyperCycleTimeoutRef.current);
    }
  }, [isContinuousModeActive, isHalted, runSequentialTick]);

  const handleGeneratePlan = useCallback(async () => {
    if (!suggestion) { setError("A suggestion is required."); return; }
    setError(null);
    setIsSystemDisabled(false);
    setIsLoading(true);
    setDiscussion(null);
    setWorkdayLog([]);
    const currentCycle = cycleCount + 1;
    setCycleCount(currentCycle);
    activeAiAgents.forEach(agent => updateAgentStatus(agent.role, AiAgentStatus.Simulating));
    
    singleCycleControllerRef.current = new AbortController();
    const signal = singleCycleControllerRef.current.signal;
    
    try {
        let localLogForContext: WorkdayLogEntry[] = [];
        const specialistRoles = [AiRole.Manager, AiRole.CoreLogic, AiRole.UIUX, AiRole.AudioSocial, AiRole.QA];

        // A single cycle now runs for just one round of conversation.
        for (const role of specialistRoles) {
            if (signal.aborted) break;

            const logText = localLogForContext.map(e => `[${e.role}]: ${e.content}`).join('\n\n');
            
            updateAgentStatus(role, AiAgentStatus.Thinking);
            addWorkdayLogEntry({ role, content: '...', isThinking: true });

            const content = await simulateAgentTick(role, suggestion, codebase, logText, currentCycle);
            
            const newEntry = {id: `${Date.now()}-${role}`, timestamp: Date.now(), role, content };
            localLogForContext.push(newEntry);
            addWorkdayLogEntry(newEntry); // UI update
            updateAgentStatus(role, AiAgentStatus.Idle);
        }

        if (signal.aborted) {
            setIsLoading(false);
            activeAiAgents.forEach(agent => updateAgentStatus(agent.role, AiAgentStatus.Idle));
            return;
        }

        const finalReport = await endSimulationAndSynthesize(localLogForContext, 0); // Cycle duration 0 for manual cycles
        if (!finalReport) return; // API Error was handled

        const currentHistory = performanceHistoryService.getHistory();
        const nextObjective = await generateNewDailyObjective(currentHistory, finalReport);
        setDailyObjective(nextObjective);
        setSuggestion(nextObjective);
        
        // Generate and set CEO summary
        const reportText = await generateCeoReportText(finalReport, currentHistory);
        const summary: CEOSummary = {
            reportText,
            finalCodebase: finalReport.evolvedCodebase || "No code evolved in this cycle.",
            nextObjective,
        };
        setCeoSummary(summary);
    } catch(err) {
        handleApiError(err);
    }

  }, [suggestion, codebase, activeAiAgents, endSimulationAndSynthesize, cycleCount, handleApiError, addWorkdayLogEntry, updateAgentStatus]);
  
  const handleRunPrediction = useCallback(async () => {
      if (history.length < 2) return;
      setIsPredicting(true);
      setPredictions(null);
      setError(null);
      setIsSystemDisabled(false);
      try {
          const result = await predictiveAnalysisService.runAnalysis(history, updateAgentStatus, updateAgentLastOutput);
          setPredictions(result);
      } catch (err) {
          handleApiError(err);
      } finally {
          setIsPredicting(false);
      }
  }, [history, updateAgentStatus, updateAgentLastOutput, handleApiError]);
  
  const handleToggleContinuousMode = async () => {
    const nextState = !isContinuousModeActive;
    
    if (nextState) { // Starting
      if (!suggestion) {
        setError("A suggestion is required to start autonomous mode.");
        return;
      }
      setError(null);
      setIsSystemDisabled(false);
      
      setCycleCount(prev => prev + 1);
      setOvertimeMs(0);
      setIsHalted(false);
      setFailSafeReport(null);
      setWorkdayLog([]);
      setCeoSummary(null);
      setSimulationStartTime(Date.now());
      setIsContinuousModeActive(true);
      
    } else { // Stopping manually
      setIsContinuousModeActive(false); // Prevent new ticks from starting
      if (hyperCycleTimeoutRef.current) clearTimeout(hyperCycleTimeoutRef.current);
      await handleEndOfWorkDay();
    }
  };
  
  const handleAcknowledgeHalt = () => {
    setIsHalted(false);
    setFailSafeReport(null);
  };

  const handleApproveOvertime = (durationSeconds: number) => {
    if (!isContinuousModeActive) return;
    eventBus.publish('cycle:overtimeApproved', { durationSeconds });
  };

  const handleDismissObjective = () => {
      setDailyObjective('');
      setSuggestion('');
  };

  const handleSelectAgent = useCallback((id: string) => {
      setCeoSummary(null);
      setSelectedAgentId(id);
  }, []);
  const handleBackToDashboard = useCallback(() => {
      setCeoSummary(null);
      setSelectedAgentId(null);
  }, []);

  const selectedAgent = selectedAgentId ? activeAiAgents.find(agent => agent.id === selectedAgentId) : null;
  const isCreativeAgentSelected = selectedAgent?.role === AiRole.CreativeScout || selectedAgent?.role === AiRole.CreativeCatalyst;

  return (
    <div className="min-h-screen bg-base-100 text-text-primary font-sans">
      <header className="bg-base-200/50 backdrop-blur-sm border-b border-base-300 sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="w-1/4"></div>
            <div className="w-1/2 text-center">
                <h1 className="text-2xl font-bold text-text-primary">AI Team Simulation & Evaluation</h1>
                <p className="text-sm text-text-secondary mt-1">A tool for meta-architectural analysis of AI-driven software development.</p>
            </div>
            <div className="w-1/4 flex justify-end">
                <div>
                  <label htmlFor="role-switcher" className="sr-only">Select Role</label>
                  <div className="relative">
                    <select 
                      id="role-switcher"
                      value={currentUserRole}
                      onChange={(e) => userRoleService.setCurrentUserRole(e.target.value as AiRole)}
                      className="appearance-none cursor-pointer bg-base-300/50 border border-base-300 text-text-primary text-sm rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    >
                      <option value={AiRole.Manager}>Manager</option>
                      <option value={AiRole.CEO}>CEO</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-purple-400">
                      {currentUserRole === AiRole.CEO ? <CrownIcon /> : <ManagerIcon />}
                    </div>
                  </div>
                </div>
            </div>
        </div>
      </header>
      
      <FailSafeAlert report={failSafeReport} isVisible={isHalted} onAcknowledge={handleAcknowledgeHalt} />

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <InputPanel
            suggestion={suggestion} setSuggestion={setSuggestion} codebase={codebase} setCodebase={setCodebase}
            isLoading={isLoading} isEvaluating={isEvaluating} isPredicting={isPredicting}
            isContinuousModeActive={isContinuousModeActive} cycleCount={cycleCount}
            isSystemDisabled={isSystemDisabled}
            handleGeneratePlan={handleGeneratePlan} handleRunPrediction={handleRunPrediction} handleToggleContinuousMode={handleToggleContinuousMode}
            history={history} predictions={predictions} error={error}
            timeRemaining={timeRemaining}
            failSafeCriteria={failSafeCriteria}
            handleApproveOvertime={handleApproveOvertime}
            dailyObjective={dailyObjective} onDismissObjective={handleDismissObjective}
          />
        
          {ceoSummary ? (
             <CEOSummaryDisplay summary={ceoSummary} discussion={discussion} onBackToDashboard={handleBackToDashboard} />
          ) : selectedAgentId === null ? (
            <ManagerDashboard
              activeAiAgents={activeAiAgents}
              history={history}
              onSelectAgent={handleSelectAgent}
              codeBank={codeBank}
              lastCodeBundle={lastCodeBundle}
              cycleCount={cycleCount}
              overtimeIncidents={overtimeIncidents}
              apiQueueCount={apiQueueCount}
            />
          ) : isCreativeAgentSelected ? (
             <CreativeTeamDisplay
                selectedAgent={selectedAgent}
                codeBank={codeBank}
                workdayLog={workdayLog}
                onBackToDashboard={handleBackToDashboard}
              />
          ) : (
            <AgentDetailDisplay
              selectedAgent={selectedAgent}
              onBackToDashboard={handleBackToDashboard}
              updateAgentPrompt={updateAgentState}
              simulationDiscussion={discussion}
              workdayLog={workdayLog}
            />
          )}
        </div>
      </main>
      
      <footer className="text-center py-6 text-xs text-text-secondary">
        <p>Powered by OpenRouter. Designed for meta-architectural analysis.</p>
      </footer>
    </div>
  );
}

export default App;
