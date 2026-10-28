import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

/**
 * ErrorBoundary - Catches unhandled JavaScript exceptions in child component tree
 * and displays a contextual fallback UI without blanking the whole application.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Keep developer-visible log for debugging
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      const isWidget = this.props.level === 'widget';

      if (isWidget) {
        return (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-950/20 text-slate-200 text-sm">
            <div className="flex items-center gap-2 text-red-400 font-medium mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{this.props.title || 'Widget Unavailable'}</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              This module encountered a problem while rendering. Other practice management features remain operational.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              icon={RefreshCw}
              className="text-xs py-1 px-2.5 h-auto"
            >
              Retry Widget
            </Button>
          </div>
        );
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
          <div className="max-w-md w-full p-6 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100 mb-2">
              {this.props.title || 'Component Encountered an Error'}
            </h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              An unexpected runtime error occurred in this view. Your session and patient data remain secure.
            </p>
            {this.state.error?.message && (
              <div className="mb-5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                icon={RefreshCw}
              >
                Reload Component
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { window.location.href = '/'; }}
                icon={Home}
              >
                Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
