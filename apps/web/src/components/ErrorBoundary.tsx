import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { de } from '../i18n/de';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Fängt Renderfehler ab, damit statt eines weißen Bildschirms eine Meldung erscheint. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unerwarteter Fehler in der Oberfläche:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center">
          <p className="text-lg text-text-muted">{de.errors.boundary}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
