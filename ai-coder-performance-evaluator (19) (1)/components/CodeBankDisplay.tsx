import React, { useState } from 'react';
import { InspirationCodeBank, CodeSnippet, Building, AiRole } from '../types';
import SnippetCard from './SnippetCard';

interface CodeBankDisplayProps {
    codeBank: InspirationCodeBank;
}

const CodeBankDisplay: React.FC<CodeBankDisplayProps> = ({ codeBank }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [buildingFilter, setBuildingFilter] = useState<Building | 'all'>('all');
    
    const allSnippets = Object.values(codeBank);

    const filteredSnippets = allSnippets.filter(snippet => {
        const matchesSearch = searchTerm === '' || 
            snippet.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            snippet.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            snippet.relevanceTags.join(' ').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesBuilding = buildingFilter === 'all' || snippet.building === buildingFilter;

        return matchesSearch && matchesBuilding;
    }).sort((a,b) => b.timestamp - a.timestamp);

    return (
        <div className="animate-fade-in-up">
            <div className="flex flex-col md:flex-row gap-4 mb-4 p-4 bg-base-300/30 rounded-lg">
                <input 
                    type="text"
                    placeholder="Search snippets..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-grow bg-base-200 border-base-300 rounded-md shadow-sm p-2 text-sm"
                />
                <select
                    value={buildingFilter}
                    onChange={e => setBuildingFilter(e.target.value as Building | 'all')}
                    className="bg-base-200 border-base-300 rounded-md shadow-sm p-2 text-sm"
                >
                    <option value="all">All Buildings</option>
                    {Object.values(Building).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>

            <div className="space-y-3">
                {filteredSnippets.length > 0 ? (
                    filteredSnippets.map(snippet => <SnippetCard key={snippet.id} snippet={snippet} />)
                ) : (
                    <div className="text-center text-text-secondary p-8">
                        <p>No snippets match your filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeBankDisplay;
