

import React, { useState, useEffect, useRef } from 'react';
import { InspirationCodeBank, AiAgent, CodeSnippet, WorkdayLogEntry, AiRole } from '../types';
import { SparklesIcon, BeakerIcon, CodeBracketIcon } from './icons';
import { ConversationTurnDisplay } from './DiscussionComponents';
import SnippetCard from './SnippetCard';

interface CreativeTeamDisplayProps {
    selectedAgent?: AiAgent | null;
    codeBank: InspirationCodeBank;
    workdayLog: WorkdayLogEntry[];
    onBackToDashboard: () => void;
}

const CreativeTeamDisplay: React.FC<CreativeTeamDisplayProps> = ({
    selectedAgent,
    codeBank,
    workdayLog,
    onBackToDashboard
}) => {
    const [activeTab, setActiveTab] = useState('chat');
    const endOfChatRef = useRef<HTMLDivElement>(null);

    const creativeRoles = [AiRole.CreativeScout, AiRole.CreativeCatalyst];
    const displayedLog = selectedAgent 
        ? workdayLog.filter(entry => entry.role === selectedAgent.role)
        : workdayLog.filter(entry => creativeRoles.includes(entry.role));
    
    const creativeSnippets = Object.values(codeBank).filter(snippet => 
        creativeRoles.includes(snippet.source)
    );

     useEffect(() => {
        if (activeTab === 'chat') {
            endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [displayedLog, activeTab]);
    
    const chatContent = (
        <div className="prose prose-invert max-w-none px-6">
            {displayedLog.length > 0 ? (
                 displayedLog.map((turn) => <ConversationTurnDisplay key={turn.id} turn={turn} />)
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-16 text-text-secondary">
                    <SparklesIcon />
                    <h2 className="mt-4 text-xl font-semibold text-text-primary">Creative Chat</h2>
                    <p className="mt-1 text-sm">The creative team's brainstorming will appear here.</p>
                </div>
            )}
            <div ref={endOfChatRef} />
        </div>
    );

    const codeContent = (
        <div className="px-6">
           {creativeSnippets.length > 0 ? (
                creativeSnippets
                    .sort((a,b) => b.timestamp - a.timestamp)
                    .map(snippet => <SnippetCard key={snippet.id} snippet={snippet} />)
           ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8 mt-16 text-text-secondary">
                   <CodeBracketIcon />
                   <h2 className="mt-4 text-xl font-semibold text-text-primary">Inspiration Code Bank</h2>
                   <p className="mt-1 text-sm">Inspirational code will appear here.</p>
               </div>
           )}
       </div>
    );

    return (
        <div className="bg-base-200 rounded-lg border border-base-300 min-h-[600px] max-h-[85vh] flex flex-col lg:col-span-2">
            <div className="px-6 pt-4">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-purple-400 text-center flex-grow">
                        {selectedAgent ? `${selectedAgent.name}'s Details` : 'Creative Wing'}
                    </h2>
                    <button
                        onClick={onBackToDashboard}
                        className="text-sm bg-base-300/50 hover:bg-base-300 text-text-secondary font-medium py-1 px-2 rounded-md transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
                <div className="flex border-b border-base-300">
                    <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'border-b-2 border-purple-500 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <SparklesIcon />
                        <span>Thinking Log</span>
                    </button>
                    <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'code' ? 'border-b-2 border-purple-500 text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                        <BeakerIcon />
                        <span>Code Bank</span>
                    </button>
                </div>
            </div>
            <div className="mt-4 overflow-y-auto flex-grow">
                {activeTab === 'chat' ? chatContent : codeContent}
            </div>
        </div>
    );
};

export default CreativeTeamDisplay;
