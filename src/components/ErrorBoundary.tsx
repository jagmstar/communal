"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Global error boundary — catches render errors and shows a fallback UI
 * instead of a blank white screen. User can reload to recover.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-4 pt-20 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-light">
            <AlertCircle className="h-8 w-8 text-danger" />
          </div>
          <div className="text-center">
            <p className="text-body font-medium text-foreground">
              Щось пішло не так
            </p>
            <p className="text-body text-muted-foreground mt-1">
              Сталася помилка. Спробуйте перезавантажити сторінку.
            </p>
          </div>
          <button
            onClick={this.handleReload}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 text-body font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-600 active:bg-primary-700 active:scale-95 transition-all"
          >
            <RotateCcw className="h-5 w-5" />
            Перезавантажити
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
