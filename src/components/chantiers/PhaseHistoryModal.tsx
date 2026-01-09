import { useState, useEffect, useMemo } from 'react';
import { X, History, Calendar, Clock, User, ChevronDown, ChevronRight } from 'lucide-react';
import { getChantierHistory } from '../../lib/phaseHistoryUtils';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

type HistoriquePhase = Tables<'historique_phases'>;

interface PhaseHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    chantierId: string;
    chantierNom: string;
}

interface GroupedHistory {
    date: string;
    entries: Array<{
        time: string;
        userName: string;
        entry: HistoriquePhase;
    }>;
}

// Cache for user names
const userNameCache = new Map<string, string>();

export function PhaseHistoryModal({ isOpen, onClose, chantierId, chantierNom }: PhaseHistoryModalProps) {
    const [history, setHistory] = useState<HistoriquePhase[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Map<string, string>>(new Map());
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, chantierId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await getChantierHistory(chantierId);
            // Filtrer les entrées sans modified_at (données corrompues)
            const validData = data.filter(h => h.modified_at);
            setHistory(validData);
            // Auto-expand first 3 dates
            const dates = [...new Set(validData.map(h => h.modified_at.split('T')[0]))].slice(0, 3);
            setExpandedDates(new Set(dates));
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('id, first_name, last_name');
        if (data) {
            const userMap = new Map<string, string>();
            data.forEach((u: { id: string; first_name: string | null; last_name: string | null }) => {
                const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Utilisateur';
                userMap.set(u.id, name);
                userNameCache.set(u.id, name);
            });
            setUsers(userMap);
        }
    };

    // Group history by date
    const groupedHistory = useMemo<GroupedHistory[]>(() => {
        const getUserName = (userId: string): string => {
            return users.get(userId) || userNameCache.get(userId) || 'Utilisateur inconnu';
        };
        const groups = new Map<string, GroupedHistory['entries']>();

        history.forEach((entry) => {
            const dateTime = new Date(entry.modified_at);
            const date = dateTime.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
            const time = dateTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const existing = groups.get(date) || [];
            existing.push({
                time,
                userName: getUserName(entry.modified_by),
                entry,
            });
            groups.set(date, existing);
        });

        // Convert to array sorted by date (newest first)
        return Array.from(groups.entries())
            .map(([date, entries]) => ({ date, entries }))
            .sort((a, b) => {
                // Parse dates for comparison
                const dateA = new Date(a.entries[0]?.entry.modified_at || 0);
                const dateB = new Date(b.entries[0]?.entry.modified_at || 0);
                return dateB.getTime() - dateA.getTime();
            });
    }, [history, users]);

    const toggleDate = (date: string) => {
        setExpandedDates((prev) => {
            const next = new Set(prev);
            if (next.has(date)) {
                next.delete(date);
            } else {
                next.add(date);
            }
            return next;
        });
    };

    // Get action color and icon
    const getActionStyle = (action: string) => {
        switch (action) {
            case 'create':
                return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30' };
            case 'delete':
                return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' };
            case 'date_change':
                return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/30' };
            case 'duration_change':
                return { color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' };
            case 'poseur_change':
                return { color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/30' };
            case 'budget_change':
                return { color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30' };
            default:
                return { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' };
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
            data-testid="phase-history-modal"
            onClick={onClose}
        >
            <div
                className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <History className="w-5 h-5 text-blue-400" />
                                Historique des modifications
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">{chantierNom}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                            data-testid="phase-history-close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun historique disponible</p>
                            <p className="text-sm mt-2">Les modifications de phases seront enregistrées ici</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedHistory.map(({ date, entries }) => {
                                const isExpanded = expandedDates.has(date);
                                const dateKey = entries[0]?.entry?.modified_at?.split('T')[0] || date;

                                return (
                                    <div key={dateKey} className="border border-slate-700/50 rounded-xl overflow-hidden">
                                        {/* Date header */}
                                        <button
                                            onClick={() => toggleDate(date)}
                                            className="w-full p-4 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-slate-400" />
                                                )}
                                                <Calendar className="w-4 h-4 text-blue-400" />
                                                <span className="text-white font-medium capitalize">{date}</span>
                                            </div>
                                            <span className="text-sm text-slate-400">
                                                {entries.length} modification{entries.length > 1 ? 's' : ''}
                                            </span>
                                        </button>

                                        {/* Entries */}
                                        {isExpanded && (
                                            <div className="p-4 space-y-3 bg-slate-900/30">
                                                {entries.map(({ time, userName, entry }) => {
                                                    const style = getActionStyle(entry.action);

                                                    return (
                                                        <div
                                                            key={entry.id}
                                                            className={`p-3 rounded-lg ${style.bg} border ${style.border}`}
                                                        >
                                                            {/* Time and user */}
                                                            <div className="flex items-center gap-4 mb-2">
                                                                <div className="flex items-center gap-1 text-sm text-slate-300">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {time}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-sm text-slate-300">
                                                                    <User className="w-3.5 h-3.5" />
                                                                    {userName}
                                                                </div>
                                                            </div>

                                                            {/* Description */}
                                                            <div className={`text-sm ${style.color} whitespace-pre-line`}>
                                                                {entry.description}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700/50 flex justify-between items-center">
                    <p className="text-sm text-slate-400">
                        {history.length} entr\u00e9e{history.length !== 1 ? 's' : ''} dans l'historique
                    </p>
                    <button onClick={onClose} className="btn-secondary">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
