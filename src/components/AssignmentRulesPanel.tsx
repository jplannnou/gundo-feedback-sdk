import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import type { AssignmentRule, FeedbackType } from '../types';
import { Button, Modal, Input, EmptyState, Spinner, Badge } from '@gundo/ui';

interface AssignmentRulesPanelProps {
  modules?: string[];
  locale?: 'es' | 'en';
}

const TYPES: FeedbackType[] = ['bug', 'improvement', 'feature', 'general', 'text_selection', 'image_area'];

export function AssignmentRulesPanel({ modules = [], locale = 'es' }: AssignmentRulesPanelProps) {
  const { client, config } = useFeedbackContext();

  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);

  // Form state
  const [formModule, setFormModule] = useState('');
  const [formType, setFormType] = useState('');
  const [formAssignTo, setFormAssignTo] = useState('');
  const [formAssignToName, setFormAssignToName] = useState('');
  const [formPriority, setFormPriority] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await client.getAssignmentRules(config.project);
      setRules(data);
    } catch {
      // Silent
    } finally {
      setIsLoading(false);
    }
  }, [client, config.project]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  function openCreate() {
    setEditingRule(null);
    setFormModule('');
    setFormType('');
    setFormAssignTo('');
    setFormAssignToName('');
    setFormPriority(0);
    setShowModal(true);
  }

  function openEdit(rule: AssignmentRule) {
    setEditingRule(rule);
    setFormModule(rule.module || '');
    setFormType(rule.feedbackType || '');
    setFormAssignTo(rule.assignTo);
    setFormAssignToName(rule.assignToName || '');
    setFormPriority(rule.priority);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formAssignTo.trim() || isSaving) return;
    setIsSaving(true);
    try {
      if (editingRule) {
        await client.updateAssignmentRule(editingRule.id, {
          module: formModule || undefined,
          feedbackType: formType || undefined,
          assignTo: formAssignTo.trim(),
          assignToName: formAssignToName.trim() || undefined,
          priority: formPriority,
        });
      } else {
        await client.createAssignmentRule({
          project: config.project,
          module: formModule || undefined,
          feedbackType: formType || undefined,
          assignTo: formAssignTo.trim(),
          assignToName: formAssignToName.trim() || undefined,
          priority: formPriority,
        });
      }
      setShowModal(false);
      fetchRules();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(rule: AssignmentRule) {
    try {
      await client.updateAssignmentRule(rule.id, { active: !rule.active });
      fetchRules();
    } catch {
      // Silently fail — rule list stays as-is
    }
  }

  async function handleDelete(rule: AssignmentRule) {
    const msg = locale === 'es'
      ? `¿Eliminar regla para ${rule.assignTo}?`
      : `Delete rule for ${rule.assignTo}?`;
    if (!confirm(msg)) return;
    try {
      await client.deleteAssignmentRule(rule.id);
      fetchRules();
    } catch {
      // Silently fail — rule list stays as-is
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--ui-fg-muted, #999)', fontSize: '0.875rem' }}>
          {locale === 'es'
            ? 'Las reglas asignan automáticamente feedback nuevo al responsable correcto.'
            : 'Rules auto-assign new feedback to the right owner.'}
        </p>
        <Button variant="primary" onClick={openCreate}>
          + {locale === 'es' ? 'Nueva regla' : 'New rule'}
        </Button>
      </div>

      {rules.length === 0 ? (
        <EmptyState title={locale === 'es' ? 'Sin reglas de asignación' : 'No assignment rules'} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--ui-radius-md, 8px)',
                background: 'var(--ui-surface-alt, #333)',
                opacity: rule.active ? 1 : 0.5,
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>{rule.assignToName || rule.assignTo}</span>
                {rule.module && <Badge variant="info">{rule.module}</Badge>}
                {rule.feedbackType && <Badge variant="warning">{rule.feedbackType.replace('_', ' ')}</Badge>}
                {!rule.module && !rule.feedbackType && (
                  <Badge variant="default">{locale === 'es' ? 'catch-all' : 'catch-all'}</Badge>
                )}
                {!rule.active && <Badge variant="default">{locale === 'es' ? 'inactiva' : 'inactive'}</Badge>}
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                  {locale === 'es' ? 'Editar' : 'Edit'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleToggle(rule)}>
                  {rule.active ? (locale === 'es' ? 'Desactivar' : 'Disable') : (locale === 'es' ? 'Activar' : 'Enable')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(rule)}>
                  {locale === 'es' ? 'Eliminar' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule
          ? (locale === 'es' ? 'Editar regla' : 'Edit rule')
          : (locale === 'es' ? 'Nueva regla de asignación' : 'New assignment rule')}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Input
            value={formAssignTo}
            onChange={(e) => setFormAssignTo(e.target.value)}
            placeholder={locale === 'es' ? 'Email del asignado *' : 'Assignee email *'}
          />
          <Input
            value={formAssignToName}
            onChange={(e) => setFormAssignToName(e.target.value)}
            placeholder={locale === 'es' ? 'Nombre (opcional)' : 'Name (optional)'}
          />
          {modules.length > 0 && (
            <select
              value={formModule}
              onChange={(e) => setFormModule(e.target.value)}
              className="gfb-dashboard__select"
            >
              <option value="">{locale === 'es' ? 'Cualquier módulo' : 'Any module'}</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            className="gfb-dashboard__select"
          >
            <option value="">{locale === 'es' ? 'Cualquier tipo' : 'Any type'}</option>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <Input
            type="number"
            value={String(formPriority)}
            onChange={(e) => setFormPriority(parseInt(e.target.value, 10) || 0)}
            placeholder={locale === 'es' ? 'Prioridad (mayor = primero)' : 'Priority (higher = first)'}
          />
          <Button variant="primary" onClick={handleSave} disabled={!formAssignTo.trim() || isSaving} loading={isSaving}>
            {locale === 'es' ? 'Guardar' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
