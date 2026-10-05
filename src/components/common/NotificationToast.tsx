import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle2, AlertTriangle, Compass } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { toastMessage } = useAuth();

  if (!toastMessage) return null;

  const bgStyles = {
    success: 'bg-emerald-950/95 border-emerald-700/80 text-emerald-100 shadow-emerald-950/40',
    error: 'bg-rose-950/95 border-rose-700/80 text-rose-100 shadow-rose-950/40',
    info: 'bg-stone-900/95 border-stone-700/80 text-stone-100 shadow-stone-950/40 dark:bg-[#15171C]/95 dark:border-stone-700'
  }[toastMessage.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Compass
  }[toastMessage.type];

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-stone-200'
  }[toastMessage.type];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-slide-up">
      <div className={`flex items-start space-x-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md ${bgStyles}`}>
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColors}`} />
        <div className="text-xs font-heading font-medium pr-2 leading-relaxed">
          {toastMessage.text}
        </div>
      </div>
    </div>
  );
};
