
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

interface PomodoroTimerProps {
  onClose: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef<number | null>(null);

  const MODES = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode]);
  };

  const changeMode = (newMode: 'focus' | 'short' | 'long') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODES[newMode]);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (soundEnabled) {
        // Simple beep using browser API
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 200);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft, soundEnabled]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            Pomo Timer
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
            {(['focus', 'short', 'long'] as const).map((m) => (
              <button
                key={m}
                onClick={() => changeMode(m)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === m ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'focus' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break'}
              </button>
            ))}
          </div>

          {/* Timer Display */}
          <div className="text-7xl font-mono font-bold text-slate-800 mb-8 tracking-tighter">
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
             <button
              onClick={toggleTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${isActive ? 'bg-orange-400' : 'bg-primary-500'}`}
             >
                {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
             </button>

             <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
             >
                <RotateCcw size={20} />
             </button>
          </div>

          {/* Sound Toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600"
          >
             {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
             {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
        </div>
      </div>
    </div>
  );
};
