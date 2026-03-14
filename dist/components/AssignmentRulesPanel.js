import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import { Button, Modal, Input, EmptyState, Spinner, Badge } from '@gundo/ui';
const TYPES = ['bug', 'improvement', 'feature', 'general', 'text_selection', 'image_area'];
export function AssignmentRulesPanel({ modules = [], locale = 'es' }) {
    const { client, config } = useFeedbackContext();
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
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
        }
        catch {
            // Silent
        }
        finally {
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
    function openEdit(rule) {
        setEditingRule(rule);
        setFormModule(rule.module || '');
        setFormType(rule.feedbackType || '');
        setFormAssignTo(rule.assignTo);
        setFormAssignToName(rule.assignToName || '');
        setFormPriority(rule.priority);
        setShowModal(true);
    }
    async function handleSave() {
        if (!formAssignTo.trim() || isSaving)
            return;
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
            }
            else {
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
        }
        finally {
            setIsSaving(false);
        }
    }
    async function handleToggle(rule) {
        await client.updateAssignmentRule(rule.id, { active: !rule.active });
        fetchRules();
    }
    async function handleDelete(rule) {
        const msg = locale === 'es'
            ? `¿Eliminar regla para ${rule.assignTo}?`
            : `Delete rule for ${rule.assignTo}?`;
        if (!confirm(msg))
            return;
        await client.deleteAssignmentRule(rule.id);
        fetchRules();
    }
    if (isLoading) {
        return (_jsx("div", { style: { display: 'flex', justifyContent: 'center', padding: '2rem' }, children: _jsx(Spinner, { size: "md" }) }));
    }
    return (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }, children: [_jsx("p", { style: { color: 'var(--ui-fg-muted, #999)', fontSize: '0.875rem' }, children: locale === 'es'
                            ? 'Las reglas asignan automáticamente feedback nuevo al responsable correcto.'
                            : 'Rules auto-assign new feedback to the right owner.' }), _jsxs(Button, { variant: "primary", onClick: openCreate, children: ["+ ", locale === 'es' ? 'Nueva regla' : 'New rule'] })] }), rules.length === 0 ? (_jsx(EmptyState, { title: locale === 'es' ? 'Sin reglas de asignación' : 'No assignment rules' })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.5rem' }, children: rules.map((rule) => (_jsxs("div", { style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--ui-radius-md, 8px)',
                        background: 'var(--ui-surface-alt, #333)',
                        opacity: rule.active ? 1 : 0.5,
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }, children: [_jsx("span", { style: { fontWeight: 600 }, children: rule.assignToName || rule.assignTo }), rule.module && _jsx(Badge, { variant: "info", children: rule.module }), rule.feedbackType && _jsx(Badge, { variant: "warning", children: rule.feedbackType.replace('_', ' ') }), !rule.module && !rule.feedbackType && (_jsx(Badge, { variant: "default", children: locale === 'es' ? 'catch-all' : 'catch-all' })), !rule.active && _jsx(Badge, { variant: "default", children: locale === 'es' ? 'inactiva' : 'inactive' })] }), _jsxs("div", { style: { display: 'flex', gap: '0.25rem' }, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => openEdit(rule), children: locale === 'es' ? 'Editar' : 'Edit' }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleToggle(rule), children: rule.active ? (locale === 'es' ? 'Desactivar' : 'Disable') : (locale === 'es' ? 'Activar' : 'Enable') }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDelete(rule), children: locale === 'es' ? 'Eliminar' : 'Delete' })] })] }, rule.id))) })), _jsx(Modal, { open: showModal, onClose: () => setShowModal(false), title: editingRule
                    ? (locale === 'es' ? 'Editar regla' : 'Edit rule')
                    : (locale === 'es' ? 'Nueva regla de asignación' : 'New assignment rule'), size: "md", children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '0.75rem' }, children: [_jsx(Input, { value: formAssignTo, onChange: (e) => setFormAssignTo(e.target.value), placeholder: locale === 'es' ? 'Email del asignado *' : 'Assignee email *' }), _jsx(Input, { value: formAssignToName, onChange: (e) => setFormAssignToName(e.target.value), placeholder: locale === 'es' ? 'Nombre (opcional)' : 'Name (optional)' }), modules.length > 0 && (_jsxs("select", { value: formModule, onChange: (e) => setFormModule(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: locale === 'es' ? 'Cualquier módulo' : 'Any module' }), modules.map((m) => _jsx("option", { value: m, children: m }, m))] })), _jsxs("select", { value: formType, onChange: (e) => setFormType(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: locale === 'es' ? 'Cualquier tipo' : 'Any type' }), TYPES.map((t) => _jsx("option", { value: t, children: t.replace('_', ' ') }, t))] }), _jsx(Input, { type: "number", value: String(formPriority), onChange: (e) => setFormPriority(parseInt(e.target.value, 10) || 0), placeholder: locale === 'es' ? 'Prioridad (mayor = primero)' : 'Priority (higher = first)' }), _jsx(Button, { variant: "primary", onClick: handleSave, disabled: !formAssignTo.trim() || isSaving, loading: isSaving, children: locale === 'es' ? 'Guardar' : 'Save' })] }) })] }));
}
//# sourceMappingURL=AssignmentRulesPanel.js.map