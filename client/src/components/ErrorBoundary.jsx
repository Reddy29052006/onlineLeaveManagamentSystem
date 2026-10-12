import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LeaveHub Uncaught Component Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc] p-6 text-slate-800">
          <div className="w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-7 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-2xs">
                <AlertTriangle className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  Something went wrong rendering this view
                </h1>
                <p className="text-xs text-slate-500">
                  An error occurred while loading this page.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3.5 text-xs text-rose-800 font-mono break-words leading-relaxed">
              {this.state.error?.message || String(this.state.error)}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleHome}
                className="inline-flex items-center gap-2 rounded-xl bg-[#132238] px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
              >
                <Home className="h-3.5 w-3.5" />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
