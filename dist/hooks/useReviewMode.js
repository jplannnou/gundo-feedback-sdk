import { useState, useCallback } from 'react';
export function useReviewMode() {
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
//# sourceMappingURL=useReviewMode.js.map