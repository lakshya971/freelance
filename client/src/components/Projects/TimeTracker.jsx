import React, { useState, useEffect } from 'react';
import { Pause, Play, X } from 'lucide-react';

const TimeTracker = ({ taskId, onStop }) => {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    setIsRunning(false);
    onStop();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="font-mono text-lg font-semibold">
            {formatTime(elapsed)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={handleStop}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-600">
        Time tracking active
      </div>
    </div>
  );
};

export default TimeTracker;
