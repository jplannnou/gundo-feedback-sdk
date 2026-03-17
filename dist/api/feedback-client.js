/**
 * HTTP client for the GUNDO Feedback Hub API.
 *
 * Calls go to the project's own backend proxy (e.g. /api/feedback-proxy/*)
 * which forwards them to the centralized Feedback API with proper auth headers.
 */
export class FeedbackClient {
    baseUrl;
    getToken;
    constructor(baseUrl, getToken) {
        this.baseUrl = baseUrl;
        this.getToken = getToken;
    }
    async request(path, options = {}) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        // Attach auth token if available (required by consumer backend auth middleware)
        if (this.getToken) {
            const token = await this.getToken();
            if (token)
                headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new FeedbackApiError(res.status, body.message || res.statusText, body);
        }
        return res.json();
    }
    // ── Feedback CRUD ─────────────────────────────────────────────
    async submitFeedback(data) {
        return this.request('/feedback', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async listFeedback(params = {}) {
        const qs = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null)
                qs.set(key, String(value));
        }
        const query = qs.toString();
        return this.request(`/feedback${query ? `?${query}` : ''}`);
    }
    async getFeedback(id) {
        return this.request(`/feedback/${id}`);
    }
    async updateFeedback(id, data) {
        return this.request(`/feedback/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    async deleteFeedback(id) {
        return this.request(`/feedback/${id}`, { method: 'DELETE' });
    }
    // ── Bulk Operations ─────────────────────────────────────────────
    async bulkUpdate(ids, data) {
        return this.request('/feedback/bulk-update', {
            method: 'POST',
            body: JSON.stringify({ ids, ...data }),
        });
    }
    async bulkDelete(ids) {
        return this.request('/feedback/bulk-delete', {
            method: 'POST',
            body: JSON.stringify({ ids }),
        });
    }
    // ── Comments ──────────────────────────────────────────────────
    async addComment(feedbackId, content) {
        return this.request(`/feedback/${feedbackId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }
    async getComments(feedbackId) {
        return this.request(`/feedback/${feedbackId}/comments`);
    }
    // ── Screenshots ───────────────────────────────────────────────
    async uploadScreenshot(file, filename) {
        const formData = new FormData();
        formData.append('file', file, filename || 'screenshot.png');
        const headers = {};
        if (this.getToken) {
            const token = await this.getToken();
            if (token)
                headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${this.baseUrl}/feedback/screenshots`, {
            method: 'POST',
            body: formData,
            headers,
            credentials: 'include',
        });
        if (!res.ok) {
            throw new FeedbackApiError(res.status, 'Screenshot upload failed');
        }
        return res.json();
    }
    // ── Stats ─────────────────────────────────────────────────────
    async getStats(project) {
        const qs = project ? `?project=${project}` : '';
        return this.request(`/stats${qs}`);
    }
    async getRecentResolved(project) {
        const qs = project ? `?project=${project}` : '';
        return this.request(`/stats/recent-resolved${qs}`);
    }
    // ── Health Scores ─────────────────────────────────────────────
    async getHealthScores() {
        return this.request('/health-scores');
    }
    async getProjectHealthHistory(project) {
        return this.request(`/health-scores/${project}`);
    }
    // ── Changelog ─────────────────────────────────────────────────
    async getChangelog(project) {
        const qs = project ? `?project=${project}` : '';
        return this.request(`/changelog${qs}`);
    }
    // ── Users ─────────────────────────────────────────────────────
    async getUsers() {
        return this.request('/users');
    }
    // ── AI Analysis ─────────────────────────────────────────────
    async analyzeFeedback(id) {
        return this.request(`/feedback/${id}/analyze`, {
            method: 'POST',
        });
    }
    // ── Assignment Rules ──────────────────────────────────────────
    async getAssignmentRules(project) {
        const qs = project ? `?project=${project}` : '';
        return this.request(`/assignment-rules${qs}`);
    }
    async createAssignmentRule(data) {
        return this.request('/assignment-rules', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async updateAssignmentRule(id, data) {
        return this.request(`/assignment-rules/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
    async deleteAssignmentRule(id) {
        return this.request(`/assignment-rules/${id}`, { method: 'DELETE' });
    }
}
export class FeedbackApiError extends Error {
    status;
    body;
    constructor(status, message, body) {
        super(message);
        this.name = 'FeedbackApiError';
        this.status = status;
        this.body = body;
    }
}
//# sourceMappingURL=feedback-client.js.map