

import React, { useState, useEffect } from 'react';
import { FailSafeCriteria, AiRole } from '../types';
import userRoleService from '../services/userRoleService';
import { CrownIcon } from './icons';
import eventBus from '../services/eventBus';
import failSafeService from '../services/failSafeService';

interface CEOControlPanelProps {
  criteria: FailSafeCriteria;
  isCycleActive: boolean;
  onApproveOvertime: (duration: number) => void;
}

export const CEOControlPanel: React.FC<CEOControlPanelProps> = ({
  criteria,
  isCycleActive,
  onApproveOvertime,
}) => {
  const [userRole, setUserRole] = useState(userRoleService.getCurrentUserRole());
  const [isExpanded, setIsExpanded] = useState(false);
  const [localCriteria, setLocalCriteria] = useState(criteria);
  const [overtimeAmount, setOvertimeAmount] = useState(30);

  useEffect(() => {
    const handleRoleChange = (newRole: AiRole) => setUserRole(newRole);
    const unsubRole = eventBus.subscribe('userRoleChanged', handleRoleChange);
    
    return () => {
        unsubRole();
    };
  }, []);

  useEffect(() => {
    setLocalCriteria(criteria);
  }, [criteria]);

  const handleCriteriaChange = (field: keyof FailSafeCriteria, value: string) => {
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setLocalCriteria(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const handleSaveCriteria = () => {
    failSafeService.updateCriteria(localCriteria);
  };
  
  const handleApproveOvertime = () => {
    onApproveOvertime(overtimeAmount);
  };

  if (userRole !== AiRole.CEO) {
    return null; // This control panel is only for the CEO role
  }

  return (
    <div className="bg-base-300/30 p-1 rounded-lg border border-purple-800/50">
      <div 
        className="flex justify-between items-center cursor-pointer p-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
            <CrownIcon /> System Control Panel
        </h3>
        <span className={`text-purple-300 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {isExpanded && (
        <div className="p-3 border-t border-purple-800/20 mt-1 space-y-6 text-sm animate-fade-in-up">
            
            {/* Fail-Safe Criteria */}
            <div className="space-y-3">
                <h4 className="font-semibold text-brand-secondary">Fail-Safe Criteria</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(localCriteria).map((key) => (
                        <div key={key}>
                            <label htmlFor={key} className="block text-xs font-medium text-text-secondary capitalize">
                                {key.replace(/([A-Z])/g, ' $1').replace('min', 'Min').replace('max', 'Max')}
                            </label>
                            <input
                                type="number"
                                id={key}
                                name={key}
                                value={localCriteria[key as keyof FailSafeCriteria]}
                                onChange={(e) => handleCriteriaChange(key as keyof FailSafeCriteria, e.target.value)}
                                className="mt-1 block w-full rounded-md border-0 bg-base-200 p-2 text-text-primary shadow-sm ring-1 ring-inset ring-base-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm sm:leading-6"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={handleSaveCriteria}
                        className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-500"
                    >
                        Save Criteria
                    </button>
                </div>
            </div>

            {/* Cycle Management */}
            <div className="border-t border-purple-800/20 pt-4 space-y-3">
                <h4 className="font-semibold text-brand-secondary">Cycle Management</h4>
                <div className="flex items-center gap-2">
                     <input
                        type="number"
                        step="15"
                        value={overtimeAmount}
                        onChange={e => setOvertimeAmount(Number(e.target.value))}
                        className="w-20 rounded-md border-0 bg-base-200 p-2 text-text-primary shadow-sm ring-1 ring-inset ring-base-300 focus:ring-2 focus:ring-inset focus:ring-brand-primary sm:text-sm"
                    />
                    <button
                        onClick={handleApproveOvertime}
                        disabled={!isCycleActive}
                        className="flex-1 rounded-md bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-yellow-500 disabled:bg-base-300 disabled:text-text-secondary/50"
                    >
                        Approve {overtimeAmount}s Overtime
                    </button>
                 </div>
            </div>

        </div>
      )}
    </div>
  );
};
