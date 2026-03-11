import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import { FeedbackItemCard } from './FeedbackItemCard';
import { CommentThread } from './CommentThread';
import type { FeedbackItem, FeedbackDetailResponse, FeedbackPriority, FeedbackStatus, FeedbackType, ChangelogEntry } from '../types';
import { formatDate, timeAgo } from '../utils/time-helpers';
import { theme as th } from '../utils/theme';

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

  const S: Record<string, React.CSSProperties> = {
    root: { fontFamily: th.fontFamily, color: th.text, minHeight: '100%' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { fontSize: '20px', fontWeight: 700 },
    tabBar: { display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: `1px solid ${th.border}` },
    tab: { padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: 500, border: 'none', background: 'none', borderBottom: '2px solid transparent', color: th.textSecondary },
    tabActive: { borderBottomColor: th.primary, color: th.text },
    statsBar: { display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' as const },
    statCard: { padding: '12px 20px', background: th.surfaceRaised, borderRadius: th.radiusLg, border: `1px solid ${th.border}`, textAlign: 'center' as const },
    statNum: { fontSize: '24px', fontWeight: 700 },
    statLabel: { fontSize: '12px', color: th.textSecondary, textTransform: 'capitalize' as const },
    filters: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' as const },
    select: { padding: '6px 12px', borderRadius: th.radiusMd, border: `1px solid ${th.border}`, background: th.surfaceRaised, color: th.text, fontSize: '13px', outline: 'none' },
    list: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
    overlay: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 50000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: th.surface, borderRadius: th.radiusXl, border: `1px solid ${th.border}`, maxWidth: '640px', width: '90vw', maxHeight: '85vh', overflow: 'auto', padding: '24px' },
    btn: { padding: '8px 16px', borderRadius: th.radiusMd, border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
    btnPrimary: { background: th.primary, color: '#fff' },
    btnSuccess: { background: th.success, color: '#fff' },
    btnDanger: { background: th.error, color: '#fff' },
    btnGhost: { background: th.surfaceRaised, color: th.textSecondary, border: `1px solid ${th.border}` },
    input: { width: '100%', padding: '10px 14px', borderRadius: th.radiusMd, border: `1px solid ${th.border}`, background: th.surfaceRaised, color: th.text, fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const },
  };

  const statusCounts: Record<string, number> = {};
  stats.forEach((s) => { statusCounts[s.status] = Number(s.count); });

  return (
    <div style={S.root}>
      {/* Header */}
      <div style={S.header}>
        <h2 style={S.title}>Feedback</h2>
        {allowCreate && (
          <button onClick={() => setShowCreateModal(true)} style={{ ...S.btn, ...S.btnPrimary }}>
            + {locale === 'es' ? 'Nuevo' : 'New'}
          </button>
        )}
      </div>

      {/* Tabs */}
      {showChangelog && (
        <div style={S.tabBar}>
          <button onClick={() => setTab('feedback')} style={{ ...S.tab, ...(tab === 'feedback' ? S.tabActive : {}) }}>
            Feedback ({total})
          </button>
          <button onClick={() => setTab('changelog')} style={{ ...S.tab, ...(tab === 'changelog' ? S.tabActive : {}) }}>
            Changelog
          </button>
        </div>
      )}

      {tab === 'feedback' && (
        <>
          {/* Stats */}
          <div style={S.statsBar}>
            <div style={S.statCard}>
              <div style={S.statNum}>{total}</div>
              <div style={S.statLabel}>Total</div>
            </div>
            {['pending', 'in_progress', 'resolved'].map((s) => (
              <div key={s} style={S.statCard}>
                <div style={S.statNum}>{statusCounts[s] || 0}</div>
                <div style={S.statLabel}>{s.replace('_', ' ')}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={S.filters}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={S.select}>
              <option value="">Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={S.select}>
              <option value="">Type</option>
              {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} style={S.select}>
              <option value="">Priority</option>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {modules.length > 0 && (
              <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} style={S.select}>
                <option value="">Module</option>
                {modules.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
          </div>

          {/* List */}
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              {locale === 'es' ? 'Sin feedback aún' : 'No feedback yet'}
            </div>
          ) : (
            <div style={S.list}>
              {items.map((item) => (
                <FeedbackItemCard key={item.id} item={item} onClick={openDetail} locale={locale} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Changelog tab */}
      {tab === 'changelog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {changelog.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              {locale === 'es' ? 'Sin entradas de changelog' : 'No changelog entries'}
            </div>
          ) : changelog.map((entry) => (
            <div key={entry.id} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: '#3b82f6', flexShrink: 0 }} />
                <div style={{ width: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>
              <div style={{ flex: 1, paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', fontSize: '12px', fontWeight: 700 }}>
                    {entry.version}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{entry.title}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{formatDate(entry.releasedAt, locale === 'es' ? 'es-AR' : 'en-US')}</div>
                {entry.description && <p style={{ fontSize: '13px', color: '#d1d5db', marginBottom: '8px', lineHeight: 1.5 }}>{entry.description}</p>}
                {entry.changes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {entry.changes.map((ch, i) => (
                      <div key={i} style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          flexShrink: 0,
                          background: ch.type === 'fix' ? '#ef444420' : ch.type === 'feature' ? '#8b5cf620' : '#3b82f620',
                          color: ch.type === 'fix' ? '#f87171' : ch.type === 'feature' ? '#a78bfa' : '#60a5fa',
                        }}>
                          {ch.type}
                        </span>
                        <span style={{ color: '#d1d5db' }}>{ch.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {(selectedItem || isLoadingDetail) && (
        <div style={S.overlay} onClick={() => { if (!isLoadingDetail) setSelectedItem(null); }}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            {isLoadingDetail ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading...</div>
            ) : selectedItem && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
                      {selectedItem.title || selectedItem.comment.substring(0, 60)}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: '#3b82f620', color: '#60a5fa' }}>
                        {selectedItem.feedbackType.replace('_', ' ')}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', background: `${({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[selectedItem.priority] || '#6b7280')}20`, color: ({ critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[selectedItem.priority] || '#6b7280') }}>
                        {selectedItem.priority}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize', background: 'rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                        {selectedItem.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                </div>

                {/* Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', fontSize: '13px' }}>
                  <div><span style={{ color: '#6b7280' }}>Reportado por:</span> {selectedItem.reportedByName || selectedItem.reportedBy}</div>
                  <div><span style={{ color: '#6b7280' }}>Fecha:</span> {formatDate(selectedItem.createdAt, locale === 'es' ? 'es-AR' : 'en-US')}</div>
                  {selectedItem.assignedTo && <div><span style={{ color: '#6b7280' }}>Asignado a:</span> {selectedItem.assignedToName || selectedItem.assignedTo}</div>}
                  {selectedItem.module && <div><span style={{ color: '#6b7280' }}>Módulo:</span> {selectedItem.module}</div>}
                </div>

                {/* Description */}
                <div style={{ padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selectedItem.comment}
                </div>

                {/* Screenshot */}
                {selectedItem.screenshotUrl && (
                  <div style={{ marginBottom: '16px' }}>
                    <img src={selectedItem.screenshotUrl} alt="Screenshot" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                )}

                {/* Selected text (for text_selection type) */}
                {selectedItem.selectedText && (
                  <div style={{ marginBottom: '16px', padding: '12px', borderLeft: '3px solid #f59e0b', background: 'rgba(245,158,11,0.05)', borderRadius: '4px', fontSize: '13px', fontStyle: 'italic', color: '#d1d5db' }}>
                    "{selectedItem.selectedText}"
                  </div>
                )}

                {/* Resolution */}
                {selectedItem.resolution && (
                  <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(34,197,94,0.05)', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                    <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, marginBottom: '4px' }}>Resolución</div>
                    <div style={{ fontSize: '13px', color: '#d1d5db' }}>{selectedItem.resolution}</div>
                  </div>
                )}

                {/* Admin actions */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {selectedItem.status === 'pending' && (
                    <button onClick={() => updateStatus(selectedItem.id, 'in_progress')} style={{ ...S.btn, ...S.btnPrimary }}>
                      Mark In Progress
                    </button>
                  )}
                  {(selectedItem.status === 'pending' || selectedItem.status === 'in_progress') && (
                    <>
                      <button
                        onClick={() => {
                          const res = prompt(locale === 'es' ? 'Descripción de la resolución:' : 'Resolution description:');
                          if (res !== null) updateStatus(selectedItem.id, 'resolved', res || undefined);
                        }}
                        style={{ ...S.btn, ...S.btnSuccess }}
                      >
                        Mark Resolved
                      </button>
                      <button onClick={() => updateStatus(selectedItem.id, 'wontfix')} style={{ ...S.btn, ...S.btnGhost }}>
                        Won't Fix
                      </button>
                    </>
                  )}
                </div>

                {/* Comments */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
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
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={S.overlay} onClick={() => setShowCreateModal(false)}>
          <div style={{ ...S.modal, maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{locale === 'es' ? 'Nuevo Feedback' : 'New Feedback'}</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={locale === 'es' ? 'Título (opcional)' : 'Title (optional)'} style={S.input} />
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder={locale === 'es' ? 'Descripción *' : 'Description *'} rows={4} style={{ ...S.input, resize: 'vertical' as const }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={newType} onChange={(e) => setNewType(e.target.value as FeedbackType)} style={{ ...S.select, flex: 1 }}>
                  {TYPES.slice(0, 4).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as FeedbackPriority)} style={{ ...S.select, flex: 1 }}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {modules.length > 0 && (
                <select value={newModule} onChange={(e) => setNewModule(e.target.value)} style={S.select}>
                  <option value="">{locale === 'es' ? 'Módulo (opcional)' : 'Module (optional)'}</option>
                  {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              <button onClick={handleCreate} disabled={!newDescription.trim() || isCreating} style={{ ...S.btn, ...S.btnPrimary, opacity: (!newDescription.trim() || isCreating) ? 0.5 : 1 }}>
                {isCreating ? '...' : locale === 'es' ? 'Crear' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
