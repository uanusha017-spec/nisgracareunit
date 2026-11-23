import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readableMessage = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(readableMessage) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed === 'object' && parsed.error) {
        readableMessage = `Database ${parsed.operationType ?? 'operation'} on ${parsed.path ?? 'record'}: ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readableMessage };
  }

  componentDidCatch(error: Error): void {
    console.error('Application ErrorBoundary caught error:', error);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E2E7E2] rounded-xl p-8 space-y-5">
            <div className="flex items-center gap-3 text-[#B91C1C]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="font-display text-xl font-semibold text-[#14221D]">
                Something interrupted your session
              </h2>
            </div>
            <p className="text-sm text-[#4A5D55] leading-relaxed break-words">
              {this.state.message}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#135D43] rounded-lg hover:bg-[#0F4A35] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="tel:+919731256246"
                className="px-4 py-2.5 text-sm font-medium text-[#14221D] border border-[#D4DDD6] rounded-lg hover:bg-[#F1F4F1] transition-colors"
              >
                Call Care Line
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
