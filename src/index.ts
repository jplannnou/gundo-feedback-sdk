// ── Provider ────────────────────────────────────────────────────
export { FeedbackProvider, useFeedbackContext } from './FeedbackProvider';

// ── Client ──────────────────────────────────────────────────────
export { FeedbackClient, FeedbackApiError } from './api/feedback-client';

// ── Hooks ───────────────────────────────────────────────────────
export { useFeedbackMode } from './hooks/useFeedbackMode';
export type { UseFeedbackModeReturn, PendingFeedbackItem } from './hooks/useFeedbackMode';
export { useReviewMode } from './hooks/useReviewMode';
export type { UseReviewModeReturn } from './hooks/useReviewMode';
export { useFeedbackList } from './hooks/useFeedbackList';
export type { UseFeedbackListReturn } from './hooks/useFeedbackList';
export { useFeedbackSubmit } from './hooks/useFeedbackSubmit';
export type { UseFeedbackSubmitReturn } from './hooks/useFeedbackSubmit';

// ── Components ──────────────────────────────────────────────────
export { ReviewMode } from './components/ReviewMode';
export { FeedbackToggle } from './components/FeedbackToggle';
export { FeedbackItemCard } from './components/FeedbackItemCard';
export { CommentThread } from './components/CommentThread';
export { FeedbackDashboard } from './components/FeedbackDashboard';
export { HealthScoreCard } from './components/HealthScoreCard';
export { AssignmentRulesPanel } from './components/AssignmentRulesPanel';

// ── Utils ───────────────────────────────────────────────────────
export { captureElementScreenshot, captureViewportScreenshot, captureAreaScreenshot } from './utils/screenshot-capture';
export { timeAgo, formatDate } from './utils/time-helpers';
export { theme as feedbackTheme } from './utils/theme';

// ── Types ───────────────────────────────────────────────────────
export type {
  FeedbackType,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackSeverity,
  BoundingBox,
  FeedbackItem,
  FeedbackComment,
  FeedbackSession,
  FeedbackStats,
  HealthScore,
  ChangelogEntry,
  Incident,
  FeedbackUser,
  FeedbackConfig,
  FeedbackUserInfo,
  CreateFeedbackItemInput,
  SubmitFeedbackInput,
  UpdateFeedbackInput,
  ListFeedbackParams,
  FeedbackListResponse,
  FeedbackDetailResponse,
  AssignmentRule,
  CreateAssignmentRuleInput,
  UpdateAssignmentRuleInput,
} from './types';
