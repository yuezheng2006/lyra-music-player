import { Component, type ErrorInfo, type ReactNode } from 'react';

// src/components/character/CharacterStageErrorBoundary.tsx
// Isolates Character Layer failures so a bad lazy chunk cannot blank the whole app.

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * Catches CharacterStage mount / lazy-import failures without unmounting GeometricLayer.
 */
export class CharacterStageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[CharacterStage] suppressed render error:', error.message, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
