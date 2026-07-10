import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="max-w-md w-full">
            <div className="rounded-lg border border-red-200 bg-white p-6">
              <h1 className="text-lg font-bold text-red-900 mb-2">Something went wrong</h1>
              <p className="text-sm text-red-700 mb-4">
                {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700"
              >
                Refresh Page
              </button>
              <details className="mt-4 text-xs text-red-600 cursor-pointer">
                <summary>Error details</summary>
                <pre className="mt-2 bg-red-50 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
