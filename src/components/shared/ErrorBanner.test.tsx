import React from 'react';

import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';

import { ErrorProvider, useError } from '../../context/ErrorContext';

import { ErrorBanner } from './ErrorBanner';

const TriggerError: React.FC<{ message: string }> = ({ message }) => {
  const { addError } = useError();
  React.useEffect(() => {
    addError(message);
  }, [addError, message]);
  return null;
};

describe('ErrorBanner', () => {
  it('renders user-friendly error messages pushed via context', () => {
    render(
      <ErrorProvider>
        <ErrorBanner />
        <TriggerError message="Something went wrong. Please try again." />
      </ErrorProvider>,
    );

    expect(
      screen.getByText('Something went wrong. Please try again.'),
    ).toBeInTheDocument();
  });

  it('auto-dismisses messages after a delay', () => {
    vi.useFakeTimers();
    render(
      <ErrorProvider>
        <ErrorBanner />
        <TriggerError message="Temporary error" />
      </ErrorProvider>,
    );

    expect(screen.getByText('Temporary error')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByText('Temporary error')).toBeNull();
    vi.useRealTimers();
  });
});
