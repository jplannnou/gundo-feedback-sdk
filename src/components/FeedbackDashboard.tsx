import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import { FeedbackItemCard } from './FeedbackItemCard';
import { CommentThread } from './CommentThread';
import type { FeedbackItem, FeedbackDetailResponse, FeedbackPriority, FeedbackStatus, FeedbackType, ChangelogEntry } from '../types';
import { formatDate } from '../utils/time-helpers';
import { Button, Modal, Badge, Spinner, EmptyState, Input, Textarea, Tabs, Callout, Timeline } from '@gundo/ui';
import './FeedbackDashboard.css';

interface FeedbackDashboardProps {
  /** Show changelog tab */
  showChangelog?: boolean;
  /** Available modules for filter */
  modules?: string[];
  /** Locale for UI text */
  locale?: 'es' | 'en';
  /** Allow creating new feedback from dashboard */
  allowCreate?: boolean;
}

type Tab = 'feedback' | 'changelog';

const STATUSES: FeedbackStatus[] = ['pending', 'in_progress', 'resolved', 'wontfix'];
const TYPES: FeedbackType[] = ['bug', 'improvement', 'feature', 'general', 'text_selection', 'image_area'];
const PRIORITIES: FeedbackPriority[] = ['critical', 'high', 'medium', 'low'];

export function FeedbackDashboard({
  showChangelog = true,
  modules = [],
  locale = 'es',
  allowCreate = true,
}: FeedbackDashboardProps) {
  const { client, config } = useFeedbackContext();

  const [tab, setTab] = useState<Tab>('feedback');
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Array<{ status: string; count: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterModule, setFilterModule] = useState<string>('');

  // Detail modal
  const [selectedItem, setSelectedItem] = useState<FeedbackDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Changelog
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState<FeedbackType>('bug');
  const [newPriority, setNewPriority] = useState<FeedbackPriority>('medium');
  const [newModule, setNewModule] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.feedbackType = filterType;
      if (filterPriority) params.priority = filterPriority;
      if (filterModule) params.module = filterModule;
      const res = await client.listFeedback(params);
      setItems(res.items);
      setTotal(res.total);
      setStats(res.stats);
    } catch {
      // Handle silently
    } finally {
      setIsLoading(false);
    }
  }, [client, filterStatus, filterType, filterPriority, filterModule]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  useEffect(() => {
    if (tab === 'changelog' && changelog.length === 0) {
      client.getChangelog(config.project).then(setChangelog).catch(() => {});
    }
  }, [tab, client, config.project, changelog.length]);

  async function openDetail(item: FeedbackItem) {
    setIsLoadingDetail(true);
    try {
      const detail = await client.getFeedback(item.id);
      setSelectedItem(detail);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  async function updateStatus(id: number, status: FeedbackStatus, resolution?: string) {
    await client.updateFeedback(id, { status, resolution });
    setSelectedItem(null);
    fetchFeedback();
  }

  async function handleCreate() {
    if (!newDescription.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await client.submitFeedback({
        items: [{
          comment: newDescription.trim(),
          title: newTitle.trim() || undefined,
          feedbackType: newType,
          priority: newPriority,
          module: newModule || undefined,
        }],
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewType('bug');
      setNewPriority('medium');
      setNewModule('');
      fetchFeedback();
    } finally {
      setIsCreating(false);
    }
  }

  const statusCounts: Record<string, number> = {};
  stats.forEach((s) => { statusCounts[s.status] = Number(s.count); });

  return (
    <div className="gfb-dashboard">
      {/* Header */}
      <div className="gfb-dashboard__header">
        <h2 className="gfb-dashboard__title">Feedback</h2>
        {allowCreate && (
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            + {locale === 'es' ? 'Nuevo' : 'New'}
          </Button>
        )}
      </div>

      {/* Tabs */}
      {showChangelog && (
        <Tabs
          tabs={[
            { id: 'feedback', label: `Feedback (${total})` },
            { id: 'changelog', label: 'Changelog' },
          ]}
          activeTab={tab}
          onTabChange={(id: string) => setTab(id as Tab)}
        />
      )}

      {tab === 'feedback' && (
        <>
          {/* Stats */}
          <div className="gfb-dashboard__stats">
            <div className="gfb-dashboard__stat-card">
              <div className="gfb-dashboard__stat-num">{total}</div>
              <div className="gfb-dashboard__stat-label">Total</div>
            </div>
            {['pending', 'in_progress', 'resolved'].map((s) => (
              <div key={s} className="gfb-dashboard__stat-card">
                <div className="gfb-dashboard__stat-num">{statusCounts[s] || 0}</div>
                <div className="gfb-dashboard__stat-label">{s.replace('_', ' ')}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="gfb-dashboard__filters">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="gfb-dashboard__select">
              <option value="">Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="gfb-dashboard__select">
              <option value="">Type</option>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="gfb-dashboard__select">
              <option value="">Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {modules.length > 0 && (
              <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="gfb-dashboard__select">
                <option value="">Module</option>
                {modules.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="gfb-dashboard__center">
              <Spinner size="md" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState title={locale === 'es' ? 'Sin feedback aún' : 'No feedback yet'} />
          ) : (
            <div className="gfb-dashboard__list">
              {items.map((item) => (
                <FeedbackItemCard key={item.id} item={item} onClick={openDetail} locale={locale} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Changelog tab */}
      {tab === 'changelog' && (
        <div className="gfb-dashboard__changelog">
          {changelog.length === 0 ? (
            <EmptyState title={locale === 'es' ? 'Sin entradas de changelog' : 'No changelog entries'} />
          ) : (
            <Timeline
              items={changelog.map((entry) => ({
                id: String(entry.id),
                title: `${entry.version} — ${entry.title}`,
                description: [
                  entry.description,
                  ...(entry.changes || []).map((ch) => `[${ch.type}] ${ch.description}`),
                ].filter(Boolean).join('\n'),
                time: formatDate(entry.releasedAt, locale === 'es' ? 'es-AR' : 'en-US'),
                status: 'info' as const,
              }))}
            />
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selectedItem || isLoadingDetail}
        onClose={() => { if (!isLoadingDetail) setSelectedItem(null); }}
        title={selectedItem ? (selectedItem.title || selectedItem.comment.substring(0, 60)) : 'Loading...'}
        size="lg"
      >
        {isLoadingDetail ? (
          <div className="gfb-dashboard__center">
            <Spinner size="md" />
          </div>
        ) : selectedItem && (
          <>
            {/* Badges */}
            <div className="gfb-dashboard__badges">
              <Badge variant="info">{selectedItem.feedbackType.replace('_', ' ')}</Badge>
              <Badge variant="warning">{selectedItem.priority}</Badge>
              <Badge variant="default">{selectedItem.status.replace('_', ' ')}</Badge>
            </div>

            {/* Meta */}
            <div className="gfb-dashboard__meta">
              <div><span className="gfb-dashboard__meta-label">Reportado por:</span> {selectedItem.reportedByName || selectedItem.reportedBy}</div>
              <div><span className="gfb-dashboard__meta-label">Fecha:</span> {formatDate(selectedItem.createdAt, locale === 'es' ? 'es-AR' : 'en-US')}</div>
              {selectedItem.assignedTo && <div><span className="gfb-dashboard__meta-label">Asignado a:</span> {selectedItem.assignedToName || selectedItem.assignedTo}</div>}
              {selectedItem.module && <div><span className="gfb-dashboard__meta-label">Módulo:</span> {selectedItem.module}</div>}
            </div>

            {/* Description */}
            <div className="gfb-dashboard__description">
              {selectedItem.comment}
            </div>

            {/* Screenshot */}
            {selectedItem.screenshotUrl && (
              <div className="gfb-dashboard__screenshot">
                <img src={selectedItem.screenshotUrl} alt="Screenshot" className="gfb-dashboard__screenshot-img" />
              </div>
            )}

            {/* Selected text (for text_selection type) */}
            {selectedItem.selectedText && (
              <Callout variant="warning" title="Selected text">
                "{selectedItem.selectedText}"
              </Callout>
            )}

            {/* Resolution */}
            {selectedItem.resolution && (
              <Callout variant="success" title="Resolución">
                {selectedItem.resolution}
              </Callout>
            )}

            {/* Admin actions */}
            <div className="gfb-dashboard__actions">
              {selectedItem.status === 'pending' && (
                <Button variant="primary" onClick={() => updateStatus(selectedItem.id, 'in_progress')}>
                  Mark In Progress
                </Button>
              )}
              {(selectedItem.status === 'pending' || selectedItem.status === 'in_progress') && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const res = prompt(locale === 'es' ? 'Descripción de la resolución:' : 'Resolution description:');
                      if (res !== null) updateStatus(selectedItem.id, 'resolved', res || undefined);
                    }}
                  >
                    Mark Resolved
                  </Button>
                  <Button variant="ghost" onClick={() => updateStatus(selectedItem.id, 'wontfix')}>
                    Won't Fix
                  </Button>
                </>
              )}
            </div>

            {/* Comments */}
            <div className="gfb-dashboard__comments">
              <h4 className="gfb-dashboard__comments-title">
                {locale === 'es' ? 'Comentarios' : 'Comments'} ({selectedItem.comments?.length || 0})
              </h4>
              <CommentThread
                comments={selectedItem.comments || []}
                onAddComment={async (content) => {
                  const comment = await client.addComment(selectedItem.id, content);
                  setSelectedItem({
                    ...selectedItem,
                    comments: [...(selectedItem.comments || []), comment],
                  });
                }}
                locale={locale}
              />
            </div>
          </>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={locale === 'es' ? 'Nuevo Feedback' : 'New Feedback'}
        size="md"
      >
        <div className="gfb-dashboard__create-form">
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={locale === 'es' ? 'Título (opcional)' : 'Title (optional)'} />
          <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder={locale === 'es' ? 'Descripción *' : 'Description *'} rows={4} />
          <div className="gfb-dashboard__create-row">
            <select value={newType} onChange={(e) => setNewType(e.target.value as FeedbackType)} className="gfb-dashboard__select gfb-dashboard__select--flex">
              {TYPES.slice(0, 4).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as FeedbackPriority)} className="gfb-dashboard__select gfb-dashboard__select--flex">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {modules.length > 0 && (
            <select value={newModule} onChange={(e) => setNewModule(e.target.value)} className="gfb-dashboard__select">
              <option value="">{locale === 'es' ? 'Módulo (opcional)' : 'Module (optional)'}</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <Button variant="primary" onClick={handleCreate} disabled={!newDescription.trim() || isCreating} loading={isCreating}>
            {locale === 'es' ? 'Crear' : 'Create'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
