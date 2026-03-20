import type {
  AiAnalysis,
  SubmitFeedbackInput,
  UpdateFeedbackInput,
  ListFeedbackParams,
  FeedbackListResponse,
  FeedbackDetailResponse,
  FeedbackStats,
  FeedbackComment,
  HealthScore,
  ChangelogEntry,
  FeedbackUser,
  AssignmentRule,
  CreateAssignmentRuleInput,
  UpdateAssignmentRuleInput,
} from '../types';

/**
 * HTTP client for the GUNDO Feedback Hub API.
 *
 * Calls go to the project's own backend proxy (e.g. /api/feedback-proxy/*)
 * which forwards them to the centralized Feedback API with proper auth headers.
 */
export class FeedbackClient {
  private baseUrl: string;
  private getToken?: () => Promise<string | null>;
  constructor(baseUrl: string, getToken?: () => Promise<string | null>) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Attach auth token if available (required by consumer backend auth middleware)
    if (this.getToken) {
      const token = await this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
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

  async submitFeedback(data: SubmitFeedbackInput) {
    return this.request<{ sessionId: number; items: unknown[] }>('/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listFeedback(params: ListFeedbackParams = {}) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) qs.set(key, String(value));
    }
    const query = qs.toString();
    return this.request<FeedbackListResponse>(`/feedback${query ? `?${query}` : ''}`);
  }

  async getFeedback(id: number) {
    return this.request<FeedbackDetailResponse>(`/feedback/${id}`);
  }

  async updateFeedback(id: number, data: UpdateFeedbackInput) {
    return this.request<FeedbackDetailResponse>(`/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFeedback(id: number) {
    return this.request<void>(`/feedback/${id}`, { method: 'DELETE' });
  }

  // ── Bulk Operations ─────────────────────────────────────────────

  async bulkUpdate(ids: number[], data: { status?: string; priority?: string; assignedTo?: string; assignedToName?: string }) {
    return this.request<{ updated: number }>('/feedback/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, ...data }),
    });
  }

  async bulkDelete(ids: number[]) {
    return this.request<{ deleted: number }>('/feedback/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // ── Comments ──────────────────────────────────────────────────

  async addComment(feedbackId: number, content: string) {
    return this.request<FeedbackComment>(`/feedback/${feedbackId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getComments(feedbackId: number) {
    return this.request<FeedbackComment[]>(`/feedback/${feedbackId}/comments`);
  }

  // ── Screenshots ───────────────────────────────────────────────

  async uploadScreenshot(file: Blob, filename?: string): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('screenshot', file, filename || 'screenshot.png');

    const headers: Record<string, string> = {};
    if (this.getToken) {
      const token = await this.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
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

  async getStats(project?: string) {
    const qs = project ? `?project=${project}` : '';
    return this.request<FeedbackStats>(`/stats${qs}`);
  }

  async getRecentResolved(project?: string) {
    const qs = project ? `?project=${project}` : '';
    return this.request<unknown[]>(`/stats/recent-resolved${qs}`);
  }

  // ── Health Scores ─────────────────────────────────────────────

  async getHealthScores() {
    return this.request<HealthScore[]>('/health-scores');
  }

  async getProjectHealthHistory(project: string) {
    return this.request<HealthScore[]>(`/health-scores/${project}`);
  }

  // ── Changelog ─────────────────────────────────────────────────

  async getChangelog(project?: string) {
    const qs = project ? `?project=${project}` : '';
    return this.request<ChangelogEntry[]>(`/changelog${qs}`);
  }

  // ── Users ─────────────────────────────────────────────────────

  async getUsers() {
    return this.request<FeedbackUser[]>('/users');
  }

  // ── AI Analysis ─────────────────────────────────────────────

  async analyzeFeedback(id: number) {
    return this.request<{ aiAnalysis: AiAnalysis }>(`/feedback/${id}/analyze`, {
      method: 'POST',
    });
  }

  // ── Assignment Rules ──────────────────────────────────────────

  async getAssignmentRules(project?: string) {
    const qs = project ? `?project=${project}` : '';
    return this.request<AssignmentRule[]>(`/assignment-rules${qs}`);
  }

  async createAssignmentRule(data: CreateAssignmentRuleInput) {
    return this.request<AssignmentRule>('/assignment-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignmentRule(id: number, data: UpdateAssignmentRuleInput) {
    return this.request<AssignmentRule>(`/assignment-rules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignmentRule(id: number) {
    return this.request<void>(`/assignment-rules/${id}`, { method: 'DELETE' });
  }
}

export class FeedbackApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'FeedbackApiError';
    this.status = status;
    this.body = body;
  }
}
