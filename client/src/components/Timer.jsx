import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function Timer({ totalSeconds, onTimeUp }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining <= 0]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percentage = (remaining / totalSeconds) * 100;

  const isWarning = percentage < 25;
  const isDanger = percentage < 10;

  const colorClass = isDanger
    ? 'text-red-600 bg-red-50 border-red-200'
    : isWarning
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-indigo-600 bg-indigo-50 border-indigo-200';

  const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClass} transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        {isDanger ? (
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">Time Remaining</span>
      </div>
      <div className="text-3xl font-mono font-bold tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="mt-2 h-2 bg-white/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
