

import React from 'react';
import { AiRole, ConversationTurn, SelfEvaluation, AiAgentStatus } from '../types';
import { 
    ManagerIcon, CoreLogicIcon, UiUxIcon, AudioSocialIcon, QaIcon, UserIcon, 
    MetaArchitectIcon, WandIcon, CreativeScoutIcon, CreativeCatalystIcon, CrownIcon, BrainIcon, AiCeoIcon, LoadingSpinner
} from './icons';
import eventBus from '../services/eventBus';
import promptManagementService from '../services/promptManagementService';

export const RoleIcon: React.FC<{ role: AiRole }> = ({ role }) => {
    const icons: { [key in AiRole]?: React.ReactNode } = {
      [AiRole.Manager]: <ManagerIcon />,
      [AiRole.CoreLogic]: <CoreLogicIcon />,
      [AiRole.UIUX]: <UiUxIcon />,
      [AiRole.AudioSocial]: <AudioSocialIcon />,
      [AiRole.QA]: <QaIcon />,
      [AiRole.User]: <UserIcon />,
      [AiRole.CodeSynthesizer]: <WandIcon />,
      [AiRole.CreativeScout]: <CreativeScoutIcon />,
      [AiRole.CreativeCatalyst]: <CreativeCatalystIcon />,
      [AiRole.MetaArchitect_Evaluator]: <MetaArchitectIcon />,
      [AiRole.MetaArchitect_Predictor]: <BrainIcon />,
      [AiRole.CEO]: <CrownIcon />,
      [AiRole.AI_CEO]: <AiCeoIcon />,
    };
    return <div className="h-8 w-8 rounded-full flex items-center justify-center bg-base-300 text-brand-primary flex-shrink-0">{icons[role] || <UserIcon />}</div>;
};
  
export const ConversationTurnDisplay: React.FC<{ turn: ConversationTurn }> = ({ turn }) => {
    const { role, content, isThinking } = turn;

    return (
        <div className="flex items-start gap-4 my-6 animate-fade-in">
            <RoleIcon role={role} />
            <div className="flex-1 bg-base-100 p-4 rounded-lg border border-base-300/50">
                <p className="font-bold text-brand-secondary">{role}</p>
                    {isThinking ? (
                    <div className="flex items-center space-x-2 text-text-secondary animate-pulse-fast pt-2">
                        <div className="h-2 w-2 bg-text-secondary/50 rounded-full"></div>
                        <div className="h-2 w-2 bg-text-secondary/50 rounded-full animation-delay-200"></div>
                        <div className="h-2 w-2 bg-text-secondary/50 rounded-full animation-delay-400"></div>
                        <span className="text-sm">thinking...</span>
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap text-sm text-text-secondary font-sans mt-2">{content}</pre>
                )}
            </div>
        </div>
    );
};

export const ScoreDisplay: React.FC<{ label: string; score: number | undefined }> = ({ label, score }) => {
    if (score === undefined) return null;
    const maxScore = label.includes('Rate') ? 1.0 : 5;
    const isRate = label.includes('Rate');
    
    let scoreColor = 'text-yellow-400';
    if(isRate){
        if (label.includes('Debt')) {
            scoreColor = score > 0.5 ? 'text-red-400' : 'text-green-400';
        } else {
            scoreColor = score > 0.5 ? 'text-green-400' : 'text-red-400';
        }
    } else {
        scoreColor = score >= 4 ? 'text-green-400' : score >= 3 ? 'text-yellow-400' : 'text-red-400';
    }

    return (
        <div className="flex justify-between items-center transition-transform hover:scale-105">
            <span className="text-sm text-indigo-300">{label}</span>
            <div className="flex items-center gap-1">
                <span className={`font-bold text-lg ${scoreColor}`}>{isRate ? `${(score * 100).toFixed(0)}%` : score.toFixed(1)}</span>
                {!isRate && <span className="text-sm text-indigo-400/70">/ {maxScore}</span>}
            </div>
        </div>
    );
};

export const SelfEvaluationDisplay: React.FC<{ selfEvaluation: SelfEvaluation | undefined, agentStatus: AiAgentStatus, error: string | null }> = ({ selfEvaluation, agentStatus, error }) => {
    if (agentStatus === AiAgentStatus.Evaluating) {
        return (
            <div className="flex items-center justify-center space-x-2 text-text-secondary animate-pulse-fast pt-2 mt-4">
                <MetaArchitectIcon />
                <span className="text-sm font-semibold">Meta-Architect is evaluating...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-6 text-red-400 text-sm p-4 bg-red-900/20 rounded-md">
                <p className="font-bold">Self-Evaluation Failed</p>
                <p>{error}</p>
            </div>
        );
    }
    
    if (!selfEvaluation?.text) return null;

    return (
        <div className="mt-8">
            <div className="flex items-start gap-4 my-6 animate-fade-in">
                <RoleIcon role={AiRole.MetaArchitect_Evaluator} />
                <div className="flex-1 bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/50">
                    <p className="font-bold text-indigo-400">{AiRole.MetaArchitect_Evaluator}</p>
                    {selfEvaluation.scores && (
                        <div className="my-4 p-4 bg-base-300/20 rounded-lg space-y-2 border border-indigo-500/30">
                           <ScoreDisplay label="Solution Quality" score={selfEvaluation.scores.solutionQuality} />
                           <ScoreDisplay label="Manager Performance" score={selfEvaluation.scores.managerPerformance} />
                           <ScoreDisplay label="Prompt Quality" score={selfEvaluation.scores.promptQuality} />
                           <ScoreDisplay label="Innovation Score" score={selfEvaluation.scores.innovationScore} />
                           <ScoreDisplay label="Architectural Compliance" score={selfEvaluation.scores.architecturalComplianceScore} />
                           <ScoreDisplay label="Inspiration Utilization Rate" score={selfEvaluation.scores.inspirationUtilizationRate} />
                           <ScoreDisplay label="Architectural Debt Rate" score={selfEvaluation.scores.architecturalDebtAccumulationRate} />
                        </div>
                    )}
                    <pre className="whitespace-pre-wrap text-sm text-indigo-200/90 font-sans mt-2">{selfEvaluation.text}</pre>
                </div>
            </div>
        </div>
    );
};

export const EditablePrompt: React.FC<{ role: AiRole, prompt: string, isEditable: boolean, updateAgentPrompt: (role: AiRole, updates: { currentPrompt: string }) => void }> = ({ role, prompt, isEditable, updateAgentPrompt }) => {
    const [currentPrompt, setCurrentPrompt] = React.useState(prompt);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isSaved, setIsSaved] = React.useState(false);

    React.useEffect(() => {
        setCurrentPrompt(prompt);
    }, [prompt]);

    const handleSave = () => {
        setIsSaving(true);
        updateAgentPrompt(role, { currentPrompt });
        promptManagementService.setPrompt(role, currentPrompt);
        setTimeout(() => {
            setIsSaving(false);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }, 500);
        eventBus.publish('ceo:managementActionTaken', 'prompt_change', { role, newPrompt: currentPrompt });
    };

    const handleReset = () => {
        promptManagementService.resetPrompt(role);
        eventBus.publish('ceo:managementActionTaken', 'prompt_reset', { role });
    };
    
    return (
        <div className="bg-base-300/50 p-4 rounded-lg">
            <h4 className="font-semibold text-brand-secondary mb-2 flex items-center gap-2">
                <RoleIcon role={role} />
                {role}
            </h4>
            <textarea
                rows={8}
                className="block w-full rounded-md border-0 bg-base-200 p-3 text-text-primary shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6 transition disabled:opacity-50"
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                disabled={!isEditable}
            />
            {isEditable && (
                <div className="flex justify-end items-center gap-3 mt-3">
                    <button
                        onClick={handleReset}
                        className="text-xs font-medium text-text-secondary hover:text-white transition"
                    >
                        Reset to Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isSaved}
                        className="flex w-24 justify-center items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-base-300 disabled:text-text-secondary/50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? <LoadingSpinner /> : isSaved ? "Saved!" : "Save"}
                    </button>
                </div>
            )}
        </div>
    );
};
