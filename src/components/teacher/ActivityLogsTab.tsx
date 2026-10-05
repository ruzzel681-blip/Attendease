import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../../types';
import { subscribeActivityLogs } from '../../services/attendanceService';
import { ShieldAlert, Search, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export const ActivityLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  useEffect(() => {
    const unSub = subscribeActivityLogs(setLogs);
    return () => unSub();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (severityFilter !== 'all' && log.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = log.userName?.toLowerCase().includes(q);
      const matchCode = log.userCode?.toLowerCase().includes(q);
      const matchDetails = log.details?.toLowerCase().includes(q);
      const matchType = log.type?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchDetails && !matchType) return false;
    }
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-heading font-bold text-[10px] uppercase inline-flex items-center space-x-1 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span>Warning</span>
          </span>
        );
      case 'critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 font-heading font-bold text-[10px] uppercase inline-flex items-center space-x-1 border border-rose-500/20">
            <AlertCircle className="h-3 w-3" />
            <span>Critical</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-heading font-bold text-[10px] uppercase inline-flex items-center space-x-1 border border-stone-200 dark:border-stone-700">
            <Info className="h-3 w-3" />
            <span>Info</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xs folio-card space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 border border-stone-200 dark:border-stone-700">
              <ShieldAlert className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold italic text-stone-900 dark:text-stone-100">
                Activity Logs
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-sans">
                Track user events, logins, and system changes.
              </p>
            </div>
          </div>

          <div className="text-xs text-stone-500 dark:text-stone-400 font-mono bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 self-start md:self-auto">
            Records: <strong className="text-stone-900 dark:text-stone-100">{filteredLogs.length}</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Search */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Search Logs
            </label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID, name, or event details..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-sans"
              />
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 mb-1">
              Severity
            </label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-white text-xs focus:outline-none focus:border-stone-900 dark:focus:border-white font-heading font-bold"
            >
              <option value="all">All Severities</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

      </div>

      {/* Log Feed */}
      <div className="bg-white/90 dark:bg-[#111318]/90 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs folio-card">
        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 font-sans">
              No activity log entries found.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getSeverityBadge(log.severity)}
                    <span className="font-mono text-xs font-bold text-stone-900 dark:text-white">
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      • {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs font-heading font-bold text-stone-800 dark:text-stone-200 leading-relaxed pt-1">
                    {log.details}
                  </p>

                  <div className="text-[11px] text-stone-500 space-x-2 font-sans">
                    <span>User: <strong>{log.userName}</strong></span>
                    <span>(#{log.userCode})</span>
                    <span className="capitalize text-stone-600 dark:text-stone-400 font-semibold font-mono">• {log.role}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
