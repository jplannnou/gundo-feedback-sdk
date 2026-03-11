// ── Feedback Hub SDK Types ──────────────────────────────────────

export type FeedbackType = 'text_selection' | 'image_area' | 'general' | 'bug' | 'improvement' | 'feature';
export type FeedbackPriority = 'critical' | 'high' | 'medium' | 'low';
export type FeedbackStatus = 'pending' | 'in_progress' | 'applied' | 'resolved' | 'dismissed' | 'wontfix';
export type FeedbackSeverity = 'critical' | 'suggestion' | 'question';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FeedbackItem {
  id: number;
  project: string;
  sessionId: number | null;
  feedbackType: FeedbackType;
  module: string | null;
  priority: FeedbackPriority;
  title: string | null;
  comment: string;
  selectedText: string | null;
  textContext: string | null;
  sectionHeading: string | null;
  imageId: string | null;
  imagePath: string | null;
  boundingBox: BoundingBox | null;
  entityId: string | null;
  entityType: string | null;
  screenshotUrl: string | null;
  context: Record<string, unknown>;
  status: FeedbackStatus;
  resolution: string | null;
  reportedBy: string;
  reportedByName: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackComment {
  id: number;
  feedbackId: number;
  userEmail: string;
  userName: string | null;
  userAvatar: string | null;
  content: string;
  createdAt: string;
}

export interface FeedbackSession {
  id: number;
  project: string;
  entityId: string | null;
  entityType: string | null;
  status: string;
  itemCount: number;
  submittedBy: string;
  submittedByName: string | null;
  submittedAt: string;
  appliedAt: string | null;
}

export interface FeedbackStats {
  total: number;
  byStatus: Array<{ status: string; count: number }>;
  byType: Array<{ feedbackType: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  project?: string;
}

export interface HealthScore {
  id: number;
  project: string;
  score: number;
  breakdown: Record<string, unknown> | null;
  calculatedAt: string;
}

export interface ChangelogEntry {
  id: number;
  project: string;
  version: string;
  title: string;
  description: string | null;
  changes: Array<{ type: string; description: string }> | null;
  feedbackIds: number[] | null;
  releasedBy: string | null;
  releasedByName: string | null;
  releasedAt: string;
}

export interface Incident {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  affectedProjects: string[];
  feedbackIds: number[];
  reportedBy: string | null;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackUser {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

// ── Config Types ────────────────────────────────────────────────

export interface FeedbackConfig {
  /** Project identifier (engine | radar | finance | jp-assistant) */
  project: string;
  /** Base URL for API calls (your backend proxy, e.g. '/api/feedback-proxy') */
  apiBaseUrl: string;
  /** Function that returns current user info */
  getUser: () => FeedbackUserInfo | null;
  /** Optional modules list for the project */
  modules?: string[];
  /** Optional: entity context (article ID, retailer ID, etc.) */
  entityId?: string;
  entityType?: string;
}

export interface FeedbackUserInfo {
  email: string;
  name: string;
  avatarUrl?: string;
}

// ── API Request/Response Types ──────────────────────────────────

export interface CreateFeedbackItemInput {
  comment: string;
  feedbackType?: FeedbackType;
  title?: string;
  module?: string;
  priority?: FeedbackPriority;
  selectedText?: string;
  textContext?: string;
  sectionHeading?: string;
  imageId?: string;
  imagePath?: string;
  boundingBox?: BoundingBox;
  entityId?: string;
  entityType?: string;
  screenshotUrl?: string;
  context?: Record<string, unknown>;
}

export interface SubmitFeedbackInput {
  items: CreateFeedbackItemInput[];
  entityId?: string;
  entityType?: string;
}

export interface UpdateFeedbackInput {
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  assignedTo?: string;
  assignedToName?: string;
  resolution?: string;
}

export interface ListFeedbackParams {
  project?: string;
  status?: FeedbackStatus;
  feedbackType?: FeedbackType;
  module?: string;
  priority?: FeedbackPriority;
  entityId?: string;
  limit?: number;
  offset?: number;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  total: number;
  stats: Array<{ status: string; count: number }>;
  limit: number;
  offset: number;
}

export interface FeedbackDetailResponse extends FeedbackItem {
  comments: FeedbackComment[];
}
