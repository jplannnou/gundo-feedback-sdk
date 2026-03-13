import { useState, useCallback } from 'react';
let nextId = 0;
export function useFeedbackMode() {
    const [isActive, setIsActive] = useState(false);
    const [pendingItems, setPendingItems] = useState([]);
    const toggle = useCallback(() => setIsActive((v) => !v), []);
    const activate = useCallback(() => setIsActive(true), []);
    const deactivate = useCallback(() => setIsActive(false), []);
    const addItem = useCallback((item) => {
        setPendingItems((prev) => [...prev, { ...item, _id: `fb-${++nextId}` }]);
    }, []);
    const removeItem = useCallback((id) => {
        setPendingItems((prev) => prev.filter((i) => i._id !== id));
    }, []);
    const clearItems = useCallback(() => setPendingItems([]), []);
    return {
        isActive,
        toggle,
        activate,
        deactivate,
        pendingItems,
        addItem,
        removeItem,
        clearItems,
        pendingCount: pendingItems.length,
    };
}
//# sourceMappingURL=useFeedbackMode.js.map