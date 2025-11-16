import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ErrorItem = {
  id: string;
  message: string;
};

type ErrorContextType = {
  errors: ErrorItem[];
  addError: (message: string) => void;
  clearError: (id: string) => void;
  clearAll: () => void;
};

const defaultCtx: ErrorContextType = {
  errors: [],
  addError: () => {},
  clearError: () => {},
  clearAll: () => {},
};

const ErrorContext = createContext<ErrorContextType>(defaultCtx);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorItem[]>([]);

  const addError = useCallback((message: string) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setErrors((prev) => [...prev, { id, message }]);
    // Auto-dismiss after 6s
    setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e.id !== id));
    }, 6000);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearAll = useCallback(() => setErrors([]), []);

  const value = useMemo(
    () => ({ errors, addError, clearError, clearAll }),
    [errors, addError, clearError, clearAll],
  );

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useError = () => useContext(ErrorContext);
