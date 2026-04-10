import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-rose-50 text-center space-y-6">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Algo salió mal</h1>
            <p className="text-slate-500 text-sm font-medium italic">
              El Cerebro Roxtor ha detectado una anomalía. Por favor, recarga la página o contacta a soporte.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl text-left overflow-auto max-h-40">
              <code className="text-[10px] text-rose-600 font-mono">
                {this.state.error?.message || 'Error desconocido'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#004ea1] text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#000814] transition-all shadow-lg shadow-blue-100 italic"
            >
              Recargar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
