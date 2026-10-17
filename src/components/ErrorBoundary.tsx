import React, { ReactNode } from 'react';
import { StartupErrorScreen } from '../screens/StartupErrorScreen';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors anywhere below it so a bug in one screen shows a recoverable
 * message instead of closing the app. "Try again" re-renders the tree from scratch.
 *
 * Error boundaries must be class components (there is no hook equivalent).
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Crash reporting goes here once it exists; for now the console is what we have.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <StartupErrorScreen
          message={
            __DEV__
              ? this.state.error.message
              : 'The app hit a problem it couldn’t recover from. Try again, or close and reopen the app.'
          }
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
