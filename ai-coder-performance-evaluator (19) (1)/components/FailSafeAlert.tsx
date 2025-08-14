
import React from 'react';
import { FailSafeReport, AiRole } from '../types';
import userRoleService from '../services/userRoleService';
import { StopIcon } from './icons';

interface FailSafeAlertProps {
  report: FailSafeReport | null;
  isVisible: boolean;
  onAcknowledge: () => void;
}

const FailSafeAlert: React.FC<FailSafeAlertProps> = ({ report, isVisible, onAcknowledge }) => {
  if (!isVisible || !report) return null;

  const currentUserRole = userRoleService.getCurrentUserRole();
  const canResume = currentUserRole === AiRole.CEO || currentUserRole === AiRole.Manager;

  return (
    <div className="fixed inset-x-0 top-0 z-50 p-4 bg-red-900/95 backdrop-blur-sm animate-fade-in-up">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between text-white">
        <div className="flex items-center mb-3 md:mb-0">
          <div className="bg-red-500 p-2 rounded-full mr-4">
              <StopIcon />
          </div>
          <div>
            <h2 className="font-bold text-lg">HYPER CYCLE HALTED</h2>
            <p className="text-sm text-red-200">{report.message}</p>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="text-right">
                <h3 className="font-semibold text-sm">Suggested Remediation:</h3>
                <ul className="list-disc list-inside text-xs text-red-200/90">
                    {report.remediationSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ul>
            </div>
            {canResume && (
              <button
                onClick={onAcknowledge}
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-colors w-full md:w-auto"
              >
                Acknowledge
              </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default FailSafeAlert;
