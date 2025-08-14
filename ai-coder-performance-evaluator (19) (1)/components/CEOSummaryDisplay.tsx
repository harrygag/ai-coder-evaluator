
import React, { useState } from 'react';
import { CEOSummary, TeamDiscussion, AiAgentStatus } from '../types';
import { AiCeoIcon, ManagerIcon, MetaArchitectIcon, ChevronDownIcon } from './icons';
import { SelfEvaluationDisplay } from './DiscussionComponents';

interface CEOSummaryDisplayProps {
    summary: CEOSummary;
    discussion: TeamDiscussion | null;
    onBackToDashboard: () => void;
}

const AccordionSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-base-300/30 rounded-lg overflow-hidden border border-base-300/50">
            <button
                className="w-full flex justify-between items-center p-3 text-left hover:bg-base-300/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="font-semibold text-brand-secondary">{title}</h3>
                </div>
                <ChevronDownIcon className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 border-t border-base-300/50 animate-fade-in-up">
                    {children}
                </div>
            )}
        </div>
    );
};


const CEOSummaryDisplay: React.FC<CEOSummaryDisplayProps> = ({ summary, discussion, onBackToDashboard }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(summary.finalCodebase);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-base-200 rounded-lg border border-base-300 min-h-[600px] max-h-[85vh] flex flex-col lg:col-span-2 animate-fade-in-up">
            <div className="p-6 border-b border-base-300">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <AiCeoIcon /> End of Cycle Report
                    </h2>
                    <button
                        onClick={onBackToDashboard}
                        className="text-sm bg-base-300/50 hover:bg-base-300 text-text-secondary font-medium py-1 px-3 rounded-md transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
                <div>
                    <h3 className="font-semibold text-brand-secondary mb-2">AI CEO Analysis</h3>
                    <div className="bg-base-300/50 p-4 rounded-lg text-sm text-text-secondary whitespace-pre-wrap font-sans">
                        {summary.reportText}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-brand-secondary mb-2">Next Day's Objective</h3>
                    <div className="bg-blue-900/40 p-4 rounded-lg text-sm text-blue-200 border border-blue-600/50">
                        {summary.nextObjective}
                    </div>
                </div>

                {discussion && (
                    <div className="space-y-4">
                        <AccordionSection title="Detailed Plan & Directives" icon={<ManagerIcon />}>
                           <div className="space-y-4 text-sm">
                                <div>
                                    <h4 className="font-bold text-text-primary mb-1">Final Plan</h4>
                                    <pre className="whitespace-pre-wrap font-sans text-text-secondary bg-base-100 p-2 rounded">{discussion.finalPlan}</pre>
                                </div>
                                {discussion.managerFindings && (
                                     <div>
                                        <h4 className="font-bold text-text-primary mb-1">Manager Findings</h4>
                                        <pre className="whitespace-pre-wrap font-sans text-text-secondary bg-base-100 p-2 rounded">{discussion.managerFindings}</pre>
                                    </div>
                                )}
                                {discussion.refactoringMandate && (
                                     <div>
                                        <h4 className="font-bold text-text-primary mb-1">Refactoring Mandate</h4>
                                        <pre className="whitespace-pre-wrap font-sans text-text-secondary bg-base-100 p-2 rounded">{discussion.refactoringMandate}</pre>
                                    </div>
                                )}
                           </div>
                        </AccordionSection>
                        
                        {discussion.selfEvaluation && discussion.selfEvaluation.text && (
                             <AccordionSection title="Meta-Architect Evaluation" icon={<MetaArchitectIcon />}>
                                <SelfEvaluationDisplay selfEvaluation={discussion.selfEvaluation} agentStatus={AiAgentStatus.Idle} error={null}/>
                             </AccordionSection>
                        )}
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-brand-secondary">Final Evolved Codebase</h3>
                        <button
                            onClick={handleCopy}
                            className="text-xs font-medium text-text-secondary hover:text-white bg-base-300/50 hover:bg-base-300 px-3 py-1.5 rounded-md transition"
                        >
                            {copied ? 'Copied!' : 'Copy Code'}
                        </button>
                    </div>
                    <div className="bg-base-100 rounded-lg max-h-[400px] overflow-auto">
                        <pre className="p-4 text-xs text-text-primary font-mono">
                            <code>
                                {summary.finalCodebase}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CEOSummaryDisplay;
