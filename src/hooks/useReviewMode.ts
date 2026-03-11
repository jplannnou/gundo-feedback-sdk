import { useState, useCallback } from 'react';

export interface UseReviewModeReturn {
  active: boolean;
  toggle: () => void;
  activate: () => void;
  deactivate: () => void;
  currentSection: string;
  setCurrentSection: (s: string) => void;
}

export function useReviewMode(): UseReviewModeReturn {
  const [active, setActive] = useState(false);
  const [currentSection, setCurrentSection] = useState('general');

  const toggle = useCallback(() => setActive((v) => !v), []);
  const activate = useCallback(() => setActive(true), []);
  const deactivate = useCallback(() => {
    setActive(false);
    setCurrentSection('general');
  }, []);

  return { active, toggle, activate, deactivate, currentSection, setCurrentSection };
}
