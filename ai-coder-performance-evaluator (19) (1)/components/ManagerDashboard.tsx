
import React, { useState, useEffect } from 'react';
import { AiRole, HistoricalRecord, PerformanceMetrics, AiAgent, AiAgentStatus, Building, InspirationCodeBank, CodeBundle } from '../types';
import userRoleService from '../services/userRoleService';
import eventBus from '../services/eventBus';
import { 
    CrownIcon, 
    ManagerIcon, 
    AiCeoIcon, 
    MetaArchitectIcon,
    CoreLogicIcon,
    UiUxIcon,
    AudioSocialIcon,
    QaIcon,
    CreativeScoutIcon,
    CreativeCatalystIcon,
    CodeBracketIcon,
    BrainIcon,
    SparklesIcon,
    DownloadIcon,
    BeakerIcon
} from './icons';
import CodeBankDisplay from './CodeBankDisplay';

interface ManagerDashboardProps {
    activeAiAgents: AiAgent[];
    history: HistoricalRecord[];
    onSelectAgent: (id: string) => void;
    codeBank: InspirationCodeBank;
    lastCodeBundle: CodeBundle | null;
    cycleCount: number;
    overtimeIncidents: number;
    apiQueueCount: number;
}

const buildingMap: Record<AiRole, Building> = {
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

const buildingIcons: Record<Building, React.ReactNode> = {
    [Building.OVERSIGHT]: <CrownIcon />,
    [Building.CORE_OPERATIONS]: <CoreLogicIcon />,
    [Building.DESIGN_EXPERIENCE]: <UiUxIcon />,
    [Building.CREATIVE_INNOVATION]: <SparklesIcon />,
};

const getAgentIcon = (role: AiRole) => {
    const iconMap: Record<AiRole, React.ReactNode> = {
        [AiRole.Manager]: <ManagerIcon />, [AiRole.CoreLogic]: <CoreLogicIcon />, [AiRole.UIUX]: <UiUxIcon />, [AiRole.AudioSocial]: <AudioSocialIcon />, [AiRole.QA]: <QaIcon />, [AiRole.CodeSynthesizer]: <CodeBracketIcon />, [AiRole.CreativeScout]: <CreativeScoutIcon />, [AiRole.CreativeCatalyst]: <CreativeCatalystIcon />, [AiRole.MetaArchitect_Evaluator]: <MetaArchitectIcon />, [AiRole.MetaArchitect_Predictor]: <BrainIcon />, [AiRole.AI_CEO]: <AiCeoIcon />, [AiRole.CEO]: <CrownIcon />, [AiRole.User]: <ManagerIcon />, [AiRole.FailSafe]: <MetaArchitectIcon />,
    };
    return iconMap[role] || <ManagerIcon />;
};

const getAgentStatusColor = (status: AiAgentStatus) => {
    const colorMap: Record<AiAgentStatus, string> = {
        [AiAgentStatus.Thinking]: 'bg-blue-600/20 text-blue-300 border-blue-500/50', [AiAgentStatus.Simulating]: 'bg-blue-600/20 text-blue-300 border-blue-500/50', [AiAgentStatus.Evaluating]: 'bg-purple-600/20 text-purple-300 border-purple-500/50', [AiAgentStatus.Idle]: 'bg-green-600/20 text-green-300 border-green-500/50', [AiAgentStatus.Updating]: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50', [AiAgentStatus.Hired]: 'bg-green-600/20 text-green-300 border-green-500/50', [AiAgentStatus.Fired]: 'bg-red-600/20 text-red-300 border-red-500/50', [AiAgentStatus.Promoted]: 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50',
    };
    return colorMap[status] || 'bg-base-300/20 text-text-secondary border-base-300/50';
};

const agentIsClickable = (agent: AiAgent) => {
  const nonClickableRoles = [AiRole.MetaArchitect_Predictor, AiRole.CodeSynthesizer, AiRole.FailSafe];
  return !nonClickableRoles.includes(agent.role);
};


const CompactAgentCard: React.FC<{agent: AiAgent; onSelectAgent: (id: string) => void; hasNewMessage: boolean}> = ({ agent, onSelectAgent, hasNewMessage }) => {
    return (
        <div 
            key={agent.id} 
            className={`bg-base-300/50 p-3 rounded-lg border border-base-300/50 flex items-center gap-3 transition-all duration-200 ${agentIsClickable(agent) ? 'cursor-pointer hover:bg-base-300 hover:border-brand-secondary' : 'opacity-70'} ${hasNewMessage ? 'animate-highlight-pulse' : ''}`}
            onClick={() => agentIsClickable(agent) && onSelectAgent(agent.id)}
            title={agent.name}
        >
            <div className="h-8 w-8 rounded-full flex items-center justify-center bg-base-200 text-brand-primary flex-shrink-0">
                {getAgentIcon(agent.role)}
            </div>
            <div className="flex-grow overflow-hidden">
                 <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border inline-flex items-center ${getAgentStatusColor(agent.status)}`}>
                    {agent.status !== AiAgentStatus.Idle && (
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    )}
                    {agent.status}
                </span>
                <p className="text-xs text-text-secondary mt-1 truncate" title={agent.lastOutputContent}>
                    {agent.lastOutputContent || 'No output yet.'}
                </p>
            </div>
        </div>
    );
};

const BuildingTile: React.FC<{
    building: Building;
    agents: AiAgent[];
    onSelectAgent: (id: string) => void;
    latestMetrics: PerformanceMetrics | null;
    agentsWithMessages: Set<AiRole>;
}> = ({ building, agents, onSelectAgent, latestMetrics, agentsWithMessages }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const getBuildingHealthColor = () => {
        const agentStatuses = agents.map(a => a.status);
        if (agentStatuses.some(s => s !== AiAgentStatus.Idle)) return 'border-blue-500';
        if (!latestMetrics) return 'border-gray-500';
        
        const { innovationScore, architecturalDebtAccumulationRate } = latestMetrics;
        if (architecturalDebtAccumulationRate && architecturalDebtAccumulationRate > 0.5) return 'border-red-500';
        if (innovationScore && innovationScore > 4) return 'border-green-500';
        return 'border-gray-500';
    };

    const getBuildingMetric = () => {
        if (!latestMetrics) return 'Status: Normal';
        switch(building) {
            case Building.CREATIVE_INNOVATION:
                return `Innovation: ${latestMetrics.innovationScore ?? 'N/A'}`;
            case Building.CORE_OPERATIONS:
                 return `Debt Rate: ${latestMetrics.architecturalDebtAccumulationRate !== undefined ? `${(latestMetrics.architecturalDebtAccumulationRate * 100).toFixed(0)}%` : 'N/A'}`;
            default:
                const activeAgents = agents.filter(a => a.status !== AiAgentStatus.Idle).length;
                return activeAgents > 0 ? `${activeAgents} Active` : 'All Idle';
        }
    };

    const metricDisplay = (
        <div className="relative group">
            <span className="text-xs font-mono bg-base-300 px-2 py-1 rounded cursor-help">{getBuildingMetric()}</span>
            {latestMetrics && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max p-2 bg-base-300 text-xs text-text-secondary rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <p><strong>Innovation:</strong> {latestMetrics.innovationScore ?? 'N/A'}</p>
                    <p><strong>Debt Rate:</strong> {latestMetrics.architecturalDebtAccumulationRate !== undefined ? `${(latestMetrics.architecturalDebtAccumulationRate * 100).toFixed(0)}%` : 'N/A'}</p>
                    <p><strong>Compliance:</strong> {latestMetrics.architecturalComplianceScore ?? 'N/A'}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className={`bg-base-200/50 p-4 rounded-lg border-l-4 transition-all ${getBuildingHealthColor()}`}>
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3">
                    <div className="text-brand-secondary">{buildingIcons[building]}</div>
                    <h3 className="font-bold text-text-primary text-lg">{building}</h3>
                </div>
                <div className="flex items-center gap-4">
                    {metricDisplay}
                    <span className={`transition-transform transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in-up">
                    {agents.map(agent => <CompactAgentCard key={agent.id} agent={agent} onSelectAgent={onSelectAgent} hasNewMessage={agentsWithMessages.has(agent.role)} />)}
                </div>
            )}
        </div>
    );
};


export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ activeAiAgents, history, onSelectAgent, codeBank, lastCodeBundle, cycleCount, overtimeIncidents, apiQueueCount }) => {
    const [latestMetrics, setLatestMetrics] = useState<PerformanceMetrics | null>(null);
    const [agentsWithMessages, setAgentsWithMessages] = useState<Set<AiRole>>(new Set());
    const [activeTab, setActiveTab] = useState('agents');
    
    useEffect(() => {
        if (history.length > 0) {
            const lastRecord = history[history.length - 1];
            setLatestMetrics(lastRecord.metrics);
        }
    }, [history]);

    useEffect(() => {
        const handleMessage = (payload: { buildingId: Building, toRole?: AiRole }) => {
            setAgentsWithMessages(prev => {
                const newSet = new Set(prev);
                if (payload.toRole) {
                    newSet.add(payload.toRole);
                } else {
                    activeAiAgents.forEach(agent => {
                        if (buildingMap[agent.role] === payload.buildingId) {
                            newSet.add(agent.role);
                        }
                    });
                }
                return newSet;
            });
        };
        const unsub = eventBus.subscribe('manager:relayMessage', handleMessage);
        return () => unsub();
    }, [activeAiAgents]);
    
    const buildings: Record<Building, AiAgent[]> = {
        [Building.OVERSIGHT]: [],
        [Building.CORE_OPERATIONS]: [],
        [Building.DESIGN_EXPERIENCE]: [],
        [Building.CREATIVE_INNOVATION]: [],
    };

    activeAiAgents.forEach(agent => {
        const building = buildingMap[agent.role];
        if (building) {
            buildings[building].push(agent);
        }
    });

    const handleDownloadCodebase = () => {
        if (!lastCodeBundle) return;
        const bundleString = JSON.stringify(lastCodeBundle, null, 2);
        const blob = new Blob([bundleString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cycle_${cycleCount}_bundle.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-base-200 rounded-lg border border-base-300 min-h-[600px] max-h-[85vh] flex flex-col lg:col-span-2">
            <div className="p-4 border-b border-base-300">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">System Dashboard</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mt-2">
                            <span>Cycle: <span className="font-bold text-text-primary">{cycleCount}</span></span>
                            <span>Overtime Incidents: <span className="font-bold text-text-primary">{overtimeIncidents}</span></span>
                            <span>API Queue: <span className="font-bold text-text-primary">{apiQueueCount}</span></span>
                        </div>
                    </div>
                    {lastCodeBundle && (
                        <button 
                            onClick={handleDownloadCodebase}
                            className="flex items-center gap-2 text-xs font-medium text-brand-primary hover:text-brand-secondary disabled:text-text-secondary/50 transition-colors bg-base-300/50 hover:bg-base-300 px-3 py-1.5 rounded-md"
                            title={`Download cycle ${cycleCount} code bundle`}
                        >
                            <DownloadIcon />
                            <span>Cycle Bundle</span>
                        </button>
                    )}
                </div>
                <div className="mt-4 flex border-b border-base-300">
                    <button onClick={() => setActiveTab('agents')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'agents' ? 'border-b-2 border-brand-primary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <ManagerIcon />
                        <span>Team View</span>
                    </button>
                    <button onClick={() => setActiveTab('codebank')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'codebank' ? 'border-b-2 border-brand-primary text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <BeakerIcon />
                        <span>Code Bank</span>
                    </button>
                </div>
            </div>

            <div className="overflow-y-auto flex-grow p-4">
                {activeTab === 'agents' ? (
                    <div className="space-y-4 animate-fade-in-up">
                        {Object.entries(buildings).map(([building, agents]) => (
                            <BuildingTile
                                key={building}
                                building={building as Building}
                                agents={agents}
                                onSelectAgent={onSelectAgent}
                                latestMetrics={latestMetrics}
                                agentsWithMessages={agentsWithMessages}
                            />
                        ))}
                    </div>
                ) : (
                    <CodeBankDisplay codeBank={codeBank} />
                )}
            </div>
        </div>
    );
};
