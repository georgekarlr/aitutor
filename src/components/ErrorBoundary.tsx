import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
          <div className="max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-4">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Something went wrong
            </h2>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              An unexpected display issue occurred in the interface. Click below to refresh the view.
            </p>
            {this.state.error && (
              <div className="mt-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 p-3 text-left text-[11px] font-mono text-slate-700 dark:text-slate-300 max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-xs font-semibold text-white shadow-md hover:bg-sky-600 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Reset View
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
