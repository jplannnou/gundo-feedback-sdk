/**
 * Returns a human-readable relative time string (e.g. "hace 3 min", "2h ago").
 */
export function timeAgo(dateStr, locale = 'en') {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (locale === 'es') {
        if (diffMin < 1)
            return 'ahora';
        if (diffMin < 60)
            return `hace ${diffMin} min`;
        if (diffHr < 24)
            return `hace ${diffHr}h`;
        if (diffDay < 7)
            return `hace ${diffDay}d`;
        return new Date(dateStr).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    }
    if (diffMin < 1)
        return 'just now';
    if (diffMin < 60)
        return `${diffMin}m ago`;
    if (diffHr < 24)
        return `${diffHr}h ago`;
    if (diffDay < 7)
        return `${diffDay}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
/**
 * Format a date string to a localized display format.
 */
export function formatDate(dateStr, locale = 'en-US') {
    return new Date(dateStr).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
//# sourceMappingURL=time-helpers.js.map