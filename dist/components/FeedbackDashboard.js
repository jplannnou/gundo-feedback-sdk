import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { useFeedbackContext } from '../FeedbackProvider';
import { FeedbackItemCard } from './FeedbackItemCard';
import { CommentThread } from './CommentThread';
import { formatDate } from '../utils/time-helpers';
import { Button, Modal, Badge, Spinner, EmptyState, Input, Textarea, Tabs, Callout, Timeline, Pagination } from '@gundo/ui';
import './FeedbackDashboard.css';
const STATUSES = ['pending', 'in_progress', 'resolved', 'wontfix'];
const TYPES = ['bug', 'improvement', 'feature', 'general', 'text_selection', 'image_area'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
export function FeedbackDashboard({ showChangelog = true, modules = [], locale = 'es', allowCreate = true, onNewFeedback, }) {
    const { client, config } = useFeedbackContext();
    const [tab, setTab] = useState('feedback');
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterModule, setFilterModule] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchDebounced, setSearchDebounced] = useState('');
    // Detail modal
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    // Changelog
    const [changelog, setChangelog] = useState([]);
    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 20;
    // Create modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newType, setNewType] = useState('bug');
    const [newPriority, setNewPriority] = useState('medium');
    const [newModule, setNewModule] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    // Bulk selection
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isBulkActing, setIsBulkActing] = useState(false);
    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setSearchDebounced(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    const fetchFeedback = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                limit: pageSize,
                offset: (page - 1) * pageSize,
            };
            if (filterStatus)
                params.status = filterStatus;
            if (filterType)
                params.feedbackType = filterType;
            if (filterPriority)
                params.priority = filterPriority;
            if (filterModule)
                params.module = filterModule;
            if (searchDebounced)
                params.search = searchDebounced;
            const res = await client.listFeedback(params);
            setItems(res.items);
            setTotal(res.total);
            setStats(res.stats);
        }
        catch {
            // Handle silently
        }
        finally {
            setIsLoading(false);
        }
    }, [client, filterStatus, filterType, filterPriority, filterModule, searchDebounced, page, pageSize]);
    useEffect(() => { fetchFeedback(); }, [fetchFeedback]);
    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [filterStatus, filterType, filterPriority, filterModule, searchDebounced]);
    useEffect(() => {
        if (tab === 'changelog' && changelog.length === 0) {
            client.getChangelog(config.project).then(setChangelog).catch(() => { });
        }
    }, [tab, client, config.project, changelog.length]);
    async function openDetail(item) {
        setIsLoadingDetail(true);
        try {
            const detail = await client.getFeedback(item.id);
            setSelectedItem(detail);
        }
        finally {
            setIsLoadingDetail(false);
        }
    }
    async function updateStatus(id, status, resolution) {
        await client.updateFeedback(id, { status, resolution });
        setSelectedItem(null);
        fetchFeedback();
    }
    async function handleCreate() {
        if (!newDescription.trim() || isCreating)
            return;
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
            setPage(1);
            fetchFeedback();
        }
        finally {
            setIsCreating(false);
        }
    }
    function toggleSelect(id) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    }
    function toggleSelectAll() {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        }
        else {
            setSelectedIds(new Set(items.map((i) => i.id)));
        }
    }
    async function bulkAction(action) {
        if (selectedIds.size === 0 || isBulkActing)
            return;
        const ids = Array.from(selectedIds);
        if (action === 'delete') {
            const msg = locale === 'es'
                ? `¿Eliminar ${ids.length} item(s)?`
                : `Delete ${ids.length} item(s)?`;
            if (!confirm(msg))
                return;
        }
        setIsBulkActing(true);
        try {
            if (action === 'delete') {
                await client.bulkDelete(ids);
            }
            else {
                await client.bulkUpdate(ids, { status: action === 'resolve' ? 'resolved' : action });
            }
            setSelectedIds(new Set());
            fetchFeedback();
        }
        finally {
            setIsBulkActing(false);
        }
    }
    const statusCounts = {};
    stats.forEach((s) => { statusCounts[s.status] = Number(s.count); });
    return (_jsxs("div", { className: "gfb-dashboard", children: [_jsxs("div", { className: "gfb-dashboard__header", children: [_jsx("h2", { className: "gfb-dashboard__title", children: "Feedback" }), allowCreate && (_jsxs(Button, { variant: "primary", onClick: () => onNewFeedback ? onNewFeedback() : setShowCreateModal(true), children: ["+ ", locale === 'es' ? 'Nuevo' : 'New'] }))] }), showChangelog && (_jsx(Tabs, { tabs: [
                    { id: 'feedback', label: `Feedback (${total})` },
                    { id: 'changelog', label: 'Changelog' },
                    { id: 'rules', label: locale === 'es' ? 'Reglas' : 'Rules' },
                ], activeTab: tab, onTabChange: (id) => setTab(id) })), tab === 'feedback' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "gfb-dashboard__stats", children: [_jsxs("div", { className: "gfb-dashboard__stat-card", children: [_jsx("div", { className: "gfb-dashboard__stat-num", children: total }), _jsx("div", { className: "gfb-dashboard__stat-label", children: "Total" })] }), ['pending', 'in_progress', 'resolved'].map((s) => (_jsxs("div", { className: "gfb-dashboard__stat-card", children: [_jsx("div", { className: "gfb-dashboard__stat-num", children: statusCounts[s] || 0 }), _jsx("div", { className: "gfb-dashboard__stat-label", children: s.replace('_', ' ') })] }, s)))] }), "          ", _jsxs("div", { className: "gfb-dashboard__search", children: ["            ", _jsx(Input, { value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: locale === 'es' ? 'Buscar feedback...' : 'Search feedback...' }), "          "] }), _jsxs("div", { className: "gfb-dashboard__filters", children: [_jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: "Status" }), STATUSES.map((s) => _jsx("option", { value: s, children: s.replace('_', ' ') }, s))] }), _jsxs("select", { value: filterType, onChange: (e) => setFilterType(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: "Type" }), TYPES.map((t) => _jsx("option", { value: t, children: t.replace('_', ' ') }, t))] }), _jsxs("select", { value: filterPriority, onChange: (e) => setFilterPriority(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: "Priority" }), PRIORITIES.map((p) => _jsx("option", { value: p, children: p }, p))] }), modules.length > 0 && (_jsxs("select", { value: filterModule, onChange: (e) => setFilterModule(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: "Module" }), modules.map((m) => _jsx("option", { value: m, children: m }, m))] }))] }), selectedIds.size > 0 && (_jsxs("div", { className: "gfb-dashboard__bulk-bar", children: [_jsxs("span", { children: [selectedIds.size, " ", locale === 'es' ? 'seleccionados' : 'selected'] }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => bulkAction('in_progress'), loading: isBulkActing, children: "In Progress" }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => bulkAction('resolve'), loading: isBulkActing, children: locale === 'es' ? 'Resolver' : 'Resolve' }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => bulkAction('wontfix'), loading: isBulkActing, children: "Won't Fix" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => bulkAction('delete'), loading: isBulkActing, children: locale === 'es' ? 'Eliminar' : 'Delete' }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSelectedIds(new Set()), children: locale === 'es' ? 'Cancelar' : 'Cancel' })] })), isLoading ? (_jsx("div", { className: "gfb-dashboard__center", children: _jsx(Spinner, { size: "md" }) })) : items.length === 0 ? (_jsx(EmptyState, { title: locale === 'es' ? 'Sin feedback aún' : 'No feedback yet' })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "gfb-dashboard__list-header", children: _jsxs("label", { className: "gfb-dashboard__checkbox-label", children: [_jsx("input", { type: "checkbox", checked: selectedIds.size === items.length && items.length > 0, onChange: toggleSelectAll }), locale === 'es' ? 'Seleccionar todo' : 'Select all'] }) }), _jsx("div", { className: "gfb-dashboard__list", children: items.map((item) => (_jsxs("div", { className: "gfb-dashboard__list-row", children: [_jsx("input", { type: "checkbox", checked: selectedIds.has(item.id), onChange: () => toggleSelect(item.id), className: "gfb-dashboard__checkbox" }), _jsx(FeedbackItemCard, { item: item, onClick: openDetail, locale: locale })] }, item.id))) }), _jsx(Pagination, { page: page, totalPages: Math.ceil(total / pageSize), onPageChange: setPage, total: total, pageSize: pageSize })] }))] })), tab === 'changelog' && (_jsx("div", { className: "gfb-dashboard__changelog", children: changelog.length === 0 ? (_jsx(EmptyState, { title: locale === 'es' ? 'Sin entradas de changelog' : 'No changelog entries' })) : (_jsx(Timeline, { items: changelog.map((entry) => ({
                        id: String(entry.id),
                        title: `${entry.version} — ${entry.title}`,
                        description: [
                            entry.description,
                            ...(entry.changes || []).map((ch) => `[${ch.type}] ${ch.description}`),
                        ].filter(Boolean).join('\n'),
                        time: formatDate(entry.releasedAt, locale === 'es' ? 'es-AR' : 'en-US'),
                        status: 'info',
                    })) })) })), _jsx(Modal, { open: !!selectedItem || isLoadingDetail, onClose: () => { if (!isLoadingDetail)
                    setSelectedItem(null); }, title: selectedItem ? (selectedItem.title || selectedItem.comment.substring(0, 60)) : 'Loading...', size: "lg", children: isLoadingDetail ? (_jsx("div", { className: "gfb-dashboard__center", children: _jsx(Spinner, { size: "md" }) })) : selectedItem && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "gfb-dashboard__badges", children: [_jsx(Badge, { variant: "info", children: selectedItem.feedbackType.replace('_', ' ') }), _jsx(Badge, { variant: "warning", children: selectedItem.priority }), _jsx(Badge, { variant: "default", children: selectedItem.status.replace('_', ' ') })] }), _jsxs("div", { className: "gfb-dashboard__meta", children: [_jsxs("div", { children: [_jsx("span", { className: "gfb-dashboard__meta-label", children: "Reportado por:" }), " ", selectedItem.reportedByName || selectedItem.reportedBy] }), _jsxs("div", { children: [_jsx("span", { className: "gfb-dashboard__meta-label", children: "Fecha:" }), " ", formatDate(selectedItem.createdAt, locale === 'es' ? 'es-AR' : 'en-US')] }), selectedItem.assignedTo && _jsxs("div", { children: [_jsx("span", { className: "gfb-dashboard__meta-label", children: "Asignado a:" }), " ", selectedItem.assignedToName || selectedItem.assignedTo] }), selectedItem.module && _jsxs("div", { children: [_jsx("span", { className: "gfb-dashboard__meta-label", children: "M\u00F3dulo:" }), " ", selectedItem.module] })] }), _jsx("div", { className: "gfb-dashboard__description", children: selectedItem.comment }), selectedItem.screenshotUrl && (_jsx("div", { className: "gfb-dashboard__screenshot", children: _jsx("img", { src: selectedItem.screenshotUrl, alt: "Screenshot", className: "gfb-dashboard__screenshot-img" }) })), selectedItem.selectedText && (_jsxs(Callout, { variant: "warning", title: "Selected text", children: ["\"", selectedItem.selectedText, "\""] })), selectedItem.resolution && (_jsx(Callout, { variant: "success", title: "Resoluci\u00F3n", children: selectedItem.resolution })), _jsxs("div", { className: "gfb-dashboard__actions", children: [selectedItem.status === 'pending' && (_jsx(Button, { variant: "primary", onClick: () => updateStatus(selectedItem.id, 'in_progress'), children: "Mark In Progress" })), (selectedItem.status === 'pending' || selectedItem.status === 'in_progress') && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "primary", onClick: () => {
                                                const res = prompt(locale === 'es' ? 'Descripción de la resolución:' : 'Resolution description:');
                                                if (res !== null)
                                                    updateStatus(selectedItem.id, 'resolved', res || undefined);
                                            }, children: "Mark Resolved" }), _jsx(Button, { variant: "ghost", onClick: () => updateStatus(selectedItem.id, 'wontfix'), children: "Won't Fix" })] }))] }), _jsxs("div", { className: "gfb-dashboard__comments", children: [_jsxs("h4", { className: "gfb-dashboard__comments-title", children: [locale === 'es' ? 'Comentarios' : 'Comments', " (", selectedItem.comments?.length || 0, ")"] }), _jsx(CommentThread, { comments: selectedItem.comments || [], onAddComment: async (content) => {
                                        const comment = await client.addComment(selectedItem.id, content);
                                        setSelectedItem({
                                            ...selectedItem,
                                            comments: [...(selectedItem.comments || []), comment],
                                        });
                                    }, locale: locale })] })] })) }), _jsx(Modal, { open: showCreateModal, onClose: () => setShowCreateModal(false), title: locale === 'es' ? 'Nuevo Feedback' : 'New Feedback', size: "md", children: _jsxs("div", { className: "gfb-dashboard__create-form", children: [_jsx(Input, { value: newTitle, onChange: (e) => setNewTitle(e.target.value), placeholder: locale === 'es' ? 'Título (opcional)' : 'Title (optional)' }), _jsx(Textarea, { value: newDescription, onChange: (e) => setNewDescription(e.target.value), placeholder: locale === 'es' ? 'Descripción *' : 'Description *', rows: 4 }), _jsxs("div", { className: "gfb-dashboard__create-row", children: [_jsx("select", { value: newType, onChange: (e) => setNewType(e.target.value), className: "gfb-dashboard__select gfb-dashboard__select--flex", children: TYPES.slice(0, 4).map((t) => _jsx("option", { value: t, children: t }, t)) }), _jsx("select", { value: newPriority, onChange: (e) => setNewPriority(e.target.value), className: "gfb-dashboard__select gfb-dashboard__select--flex", children: PRIORITIES.map((p) => _jsx("option", { value: p, children: p }, p)) })] }), modules.length > 0 && (_jsxs("select", { value: newModule, onChange: (e) => setNewModule(e.target.value), className: "gfb-dashboard__select", children: [_jsx("option", { value: "", children: locale === 'es' ? 'Módulo (opcional)' : 'Module (optional)' }), modules.map((m) => _jsx("option", { value: m, children: m }, m))] })), _jsx(Button, { variant: "primary", onClick: handleCreate, disabled: !newDescription.trim() || isCreating, loading: isCreating, children: locale === 'es' ? 'Crear' : 'Create' })] }) })] }));
}
//# sourceMappingURL=FeedbackDashboard.js.map