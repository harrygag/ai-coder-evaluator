

import React, { useState, useEffect, useRef } from 'react';
import { AiAgent, AiRole, TeamDiscussion, Building, WorkdayLogEntry } from '../types';
import { LightbulbIcon, MetaArchitectIcon, CodeBracketIcon, ManagerIcon } from './icons';
import { ConversationTurnDisplay, SelfEvaluationDisplay, EditablePrompt, ScoreDisplay, RoleIcon } from './DiscussionComponents';
import userRoleService from '../services/userRoleService';
import eventBus from '../services/eventBus';

const buildingMap: Record<AiRole, Building> = {
    [AiRole.Manager]: Building.OVERSIGHT,
    [AiRole.QA]: Building.OVERSIGHT,
    [AiRole.MetaArchitect_Evaluator]: Building.OVERSIGHT,
    [AiRole.MetaArchitect_Predictor]: Building.OVERSIGHT,
    [AiRole.AI_CEO]: Building.OVERSIGHT,
    [AiRole.CoreLogic]: Building.CORE_OPERATIONS,
    [AiRole.CodeSynthesizer]: Building.CORE_OPERATIONS,
    [AiRole.UIUX]: Building.DESIGN_EXPERIENCE,
    [AiRole.AudioSocial]: Building.DESIGN_EXPERIENCE,
    [AiRole.CreativeScout]: Building.CREATIVE_INNOVATION,
    [AiRole.CreativeCatalyst]: Building.CREATIVE_INNOVATION,
    [AiRole.CEO]: Building.OVERSIGHT,
    [AiRole.User]: Building.OVERSIGHT,
    [AiRole.FailSafe]: Building.OVERSIGHT,
};

interface AgentDetailDisplayProps {
    selectedAgent: AiAgent | null;
    onBackToDashboard: () => void;
    updateAgentPrompt: (role: AiRole, updates: { currentPrompt: string }) => void;
    simulationDiscussion: TeamDiscussion | null;
    workdayLog: WorkdayLogEntry[];
}

const AgentDetailDisplay: React.FC<AgentDetailDisplayProps> = ({
    selectedAgent,
    onBackToDashboard,
    updateAgentPrompt,
    simulationDiscussion,
    workdayLog,
}) => {
    const [activeTab, setActiveTab] = useState('thinking-log');
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const [currentUserRole, setCurrentUserRole] = useState(userRoleService.getCurrentUserRole());

    const agentLog = selectedAgent ? workdayLog.filter(entry => entry.role === selectedAgent.role) : [];

    useEffect(() => {
        const handleRoleChange = (newRole: AiRole) => setCurrentUserRole(newRole);
        const unsubRole = eventBus.subscribe('userRoleChanged', handleRoleChange);
        return () => {
          if (unsubRole) unsubRole();
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'thinking-log') {
          endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [agentLog, activeTab]);
    
    if (!selectedAgent) {
        return (
          <div className="bg-base-200 rounded-lg border border-base-300 p-4 flex flex-col items-center justify-center h-full text-center text-text-secondary lg:col-span-2">
            <p>Select an agent to view details.</p>
          </div>
        );
    }
    
    const isEditable = userRoleService.canEditPrompt(currentUserRole, selectedAgent.role);

    const thinkingLogContent = (
        <div className="prose prose-invert max-w-none px-6">
            {agentLog.length > 0 ? (
                agentLog.map((turn) => <ConversationTurnDisplay key={turn.id} turn={turn} />)
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-16 text-text-secondary">
                    <LightbulbIcon />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">Thinking Log</h2>
                    <p className="mt-1 text-sm">This agent's real-time thought process will appear here.</p>
                </div>
            )}
            {selectedAgent.role === AiRole.MetaArchitect_Evaluator && simulationDiscussion?.selfEvaluation && (
                <SelfEvaluationDisplay selfEvaluation={simulationDiscussion.selfEvaluation} agentStatus={selectedAgent.status} error={null} />
            )}
            <div ref={endOfMessagesRef} />
        </div>
    );

    const outputContent = (
        <div className="p-6">
            {selectedAgent.lastOutputContent ? (
                <pre className="whitespace-pre-wrap text-sm text-blue-200/90 font-mono bg-base-100 p-4 rounded-md overflow-x-auto">
                    {selectedAgent.lastOutputContent}
                </pre>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-16 text-text-secondary">
                    <CodeBracketIcon />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">Agent Output</h2>
                    <p className="mt-1 text-sm">The final output of this agent will appear here.</p>
                </div>
            )}
        </div>
    );

    const metricsContent = (
        <div className="p-6 space-y-4">
            {selectedAgent.metricsHistory.length > 0 ? (
                selectedAgent.metricsHistory.map((metrics, index) => (
                    <div key={index} className="bg-base-300/50 p-4 rounded-lg border border-base-300/50">
                        <h4 className="font-semibold text-brand-secondary mb-2">Cycle {index + 1} Metrics</h4>
                        <div className="space-y-2">
                          <ScoreDisplay label="Solution Quality" score={metrics.solutionQuality} />
                          <ScoreDisplay label="Manager Performance" score={metrics.managerPerformance} />
                          <ScoreDisplay label="Prompt Quality" score={metrics.promptQuality} />
                          <ScoreDisplay label="Innovation Score" score={metrics.innovationScore} />
                          <ScoreDisplay label="Creative Leaps" score={metrics.creativeLeapsCount} />
                          <ScoreDisplay label="Innovation Layers" score={metrics.innovationLayersAdded} />
                          <ScoreDisplay label="Arch. Compliance" score={metrics.architecturalComplianceScore} />
                          <ScoreDisplay label="Inspiration Rate" score={metrics.inspirationUtilizationRate} />
                          <ScoreDisplay label="Arch. Debt Rate" score={metrics.architecturalDebtAccumulationRate} />
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-16 text-text-secondary">
                    <MetaArchitectIcon />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">Agent Metrics</h2>
                    <p className="mt-1 text-sm">Performance metrics for this agent will appear here.</p>
                </div>
            )}
        </div>
    );

    const promptContent = (
        <div className="p-6">
            <EditablePrompt 
                role={selectedAgent.role} 
                prompt={selectedAgent.currentPrompt} 
                isEditable={isEditable}
                updateAgentPrompt={updateAgentPrompt}
            />
        </div>
    );

    return (
        <div className="bg-base-200 rounded-lg border border-base-300 min-h-[600px] max-h-[85vh] flex flex-col lg:col-span-2">
            <div className='px-6 pt-4'>
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <RoleIcon role={selectedAgent.role} /> {selectedAgent.name}
                    </h2>
                    <button
                        onClick={onBackToDashboard}
                        className="text-sm bg-base-300/50 hover:bg-base-300 text-text-secondary font-medium py-1 px-2 rounded-md transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
                <div className="flex border-b border-base-300">
                    <button onClick={() => setActiveTab('thinking-log')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'thinking-log' ? 'border-b-2 border-brand-primary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <LightbulbIcon />
                        <span>Thinking Log</span>
                    </button>
                    <button onClick={() => setActiveTab('output')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'output' ? 'border-b-2 border-brand-primary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <CodeBracketIcon />
                        <span>Output</span>
                     </button>
                     {selectedAgent.role === AiRole.MetaArchitect_Evaluator && (
                        <button onClick={() => setActiveTab('metrics')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'metrics' ? 'border-b-2 border-brand-primary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                            <MetaArchitectIcon />
                            <span>Metrics</span>
                        </button>
                     )}
                    <button onClick={() => setActiveTab('prompt')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'prompt' ? 'border-b-2 border-brand-primary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <ManagerIcon />
                        <span>Prompt</span>
                    </button>
                </div>
            </div>
            <div className="mt-4 overflow-y-auto flex-grow">
                {activeTab === 'thinking-log' ? thinkingLogContent : 
                 activeTab === 'output' ? outputContent : 
                 activeTab === 'metrics' ? metricsContent : 
                 promptContent}
            </div>
        </div>
    );
};

export default AgentDetailDisplay;
