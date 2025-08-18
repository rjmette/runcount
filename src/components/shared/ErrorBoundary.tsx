import React from 'react';
import { useError } from '../../context/ErrorContext';

export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
  },
  { hasError: boolean }
> {
  static contextType = React.createContext(null);
  declare context: React.ContextType<typeof ErrorBoundary.contextType>;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    // Fallback: try using window.dispatchEvent to signal error if context is not available
    try {
      const event = new CustomEvent('appError', {
        detail: error?.message || 'Unexpected error',
      });
      window.dispatchEvent(event);
    } catch {}
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong.</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Try reloading the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorEventsBridge: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addError } = useError();

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | undefined;
      addError(detail || 'Unexpected error');
    };
    window.addEventListener('appError', handler as EventListener);
    return () =>
      window.removeEventListener('appError', handler as EventListener);
  }, [addError]);

  return <>{children}</>;
};
