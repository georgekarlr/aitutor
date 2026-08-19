import { useState, useEffect } from 'react';
import {
  Maximize2,
  Minimize2,
  Monitor,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useFullscreen } from '@/hooks/useFullscreen';

export function DisplaySettingsCard() {
  const { isFullscreen, errorMessage, toggleFullscreen, enterFullscreen, exitFullscreen } =
    useFullscreen();

  const [screenDimensions, setScreenDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 text-white text-xs shadow-xs">
            <Monitor className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Display & Full Screen UI</span>
              {isFullscreen ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700/80 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Full Screen Active
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-2 py-0.5 rounded-full">
                  Standard Window
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Maximize your learning workspace for distraction-free study sessions & exams
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
          {screenDimensions.width} × {screenDimensions.height} px
        </span>
      </div>

      {/* Screen Mode Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Full Screen Mode Card */}
        <button
          type="button"
          onClick={() => (isFullscreen ? undefined : enterFullscreen())}
          className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
            isFullscreen
              ? 'border-sky-500 bg-sky-50/90 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 shadow-2xs ring-2 ring-sky-400/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-100">
              <Maximize2 className="h-3.5 w-3.5 text-sky-500" />
              <span>Full Screen Display</span>
            </div>
            {isFullscreen && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Expands to fill your entire monitor, hiding distractions during mock exams and study.
          </p>
        </button>

        {/* Standard Windowed Mode Card */}
        <button
          type="button"
          onClick={() => (isFullscreen ? exitFullscreen() : undefined)}
          className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
            !isFullscreen
              ? 'border-sky-500 bg-sky-50/90 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200 shadow-2xs ring-2 ring-sky-400/20'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-100">
              <Minimize2 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
              <span>Standard Window</span>
            </div>
            {!isFullscreen && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            Runs inside normal browser window with tabs and operating system desktop toolbars.
          </p>
        </button>
      </div>

      {/* Main Full Screen Action Button */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={toggleFullscreen}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isFullscreen
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'
              : 'bg-sky-600 hover:bg-sky-500 text-white'
          }`}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-4 w-4" />
              <span>Exit Full Screen Mode</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4" />
              <span>Toggle Full Screen Display</span>
            </>
          )}
        </button>
      </div>

      {/* Error / Fallback Info */}
      {errorMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-[11px] leading-relaxed">
            <p className="font-semibold">Notice regarding embedded preview:</p>
            <p>{errorMessage}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">F11</kbd> on Windows/Linux or <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">⌃⌘F</kbd> on macOS for native browser full screen.
            </p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Tips */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-sky-500" />
          <span>Shortcuts: Press <strong className="font-mono text-slate-700 dark:text-slate-300">F11</strong> or <strong className="font-mono text-slate-700 dark:text-slate-300">Esc</strong> to exit full screen anytime.</span>
        </span>
        <span className="font-medium">Distraction-Free Zen</span>
      </div>
    </div>
  );
}
