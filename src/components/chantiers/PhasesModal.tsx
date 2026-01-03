import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Calendar, Clock, User, Edit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

type Phase = Tables<'phases_chantiers'> & {
    poseur?: { id: string; first_name: string | null; last_name: string | null } | null;
};

interface PhasesModalProps {
    isOpen: boolean;
    onClose: () => void;
    chantierId: string;
    chantierNom: string;
}

// French public holidays for 2026 (can be extended)
const HOLIDAYS_2026 = [
    '2026-01-01', // Jour de l'An
    '2026-04-06', // Lundi de Pâques
    '2026-05-01', // Fête du Travail
    '2026-05-08', // Victoire 1945
    '2026-05-14', // Ascension
    '2026-05-25', // Lundi de Pentecôte
    '2026-07-14', // Fête Nationale
    '2026-08-15', // Assomption
    '2026-11-01', // Toussaint
    '2026-11-11', // Armistice
    '2026-12-25', // Noël
];

// Working hours configuration
const WORK_START_MORNING = 8;
const WORK_END_MORNING = 12;
const WORK_START_AFTERNOON = 13;
const WORK_END_AFTERNOON = 17;

// Check if a date is a working day
function isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false; // Weekend

    const dateStr = date.toISOString().split('T')[0];
    if (HOLIDAYS_2026.includes(dateStr)) return false; // Holiday

    return true;
}

// Calculate end date and time from start date, start time, and duration
function calculateEndDateTime(
    startDate: string,
    startHour: number,
    durationHours: number
): { endDate: string; endHour: number } {
    let remainingHours = durationHours;
    const currentDate = new Date(startDate);
    let currentHour = startHour;

    // Validate start hour is in working hours
    if (currentHour < WORK_START_MORNING) currentHour = WORK_START_MORNING;
    if (currentHour >= WORK_END_MORNING && currentHour < WORK_START_AFTERNOON) {
        currentHour = WORK_START_AFTERNOON;
    }
    if (currentHour >= WORK_END_AFTERNOON) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentHour = WORK_START_MORNING;
    }

    // Skip to next working day if needed
    while (!isWorkingDay(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    while (remainingHours > 0) {
        if (currentHour >= WORK_START_MORNING && currentHour < WORK_END_MORNING) {
            // Morning
            const morningHours = Math.min(WORK_END_MORNING - currentHour, remainingHours);
            remainingHours -= morningHours;
            currentHour = WORK_END_MORNING;

            if (remainingHours > 0) {
                // Continue to afternoon
                const afternoonHours = Math.min(WORK_END_AFTERNOON - WORK_START_AFTERNOON, remainingHours);
                remainingHours -= afternoonHours;
                currentHour = WORK_START_AFTERNOON + afternoonHours;
            }
        } else if (currentHour >= WORK_START_AFTERNOON && currentHour < WORK_END_AFTERNOON) {
            // Afternoon only
            const afternoonHours = Math.min(WORK_END_AFTERNOON - currentHour, remainingHours);
            remainingHours -= afternoonHours;
            currentHour += afternoonHours;
        }

        if (remainingHours > 0) {
            // Move to next working day
            currentDate.setDate(currentDate.getDate() + 1);
            while (!isWorkingDay(currentDate)) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            currentHour = WORK_START_MORNING;
        }
    }

    return {
        endDate: currentDate.toISOString().split('T')[0],
        endHour: currentHour,
    };
}

// Get week number (ISO)
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Format date in French short format
function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
}

export function PhasesModal({ isOpen, onClose, chantierId, chantierNom }: PhasesModalProps) {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Tables<'users'>[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

    const [formData, setFormData] = useState({
        libelle: '',
        date_debut: '',
        heure_debut: 8,
        duree_heures: 8,
        poseur_id: '',
    });

    // Calculate end date/time from form data
    const calculatedEnd = useMemo(() => {
        if (!formData.date_debut) return null;
        return calculateEndDateTime(formData.date_debut, formData.heure_debut, formData.duree_heures);
    }, [formData.date_debut, formData.heure_debut, formData.duree_heures]);

    useEffect(() => {
        if (isOpen) {
            fetchPhases();
            fetchUsers();
        }
    }, [isOpen, chantierId]);

    const fetchPhases = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('phases_chantiers')
                .select('*, poseur:users(id, first_name, last_name)')
                .eq('chantier_id', chantierId)
                .order('date_debut', { ascending: true });

            setPhases((data as Phase[]) || []);
        } catch (err) {
            console.error('Error fetching phases:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('suspended', false)
            .order('last_name');

        setUsers((data as Tables<'users'>[]) || []);
    };

    const resetForm = () => {
        setFormData({
            libelle: '',
            date_debut: '',
            heure_debut: 8,
            duree_heures: 8,
            poseur_id: '',
        });
        setEditingPhase(null);
        setShowAddForm(false);
    };

    const openEditForm = (phase: Phase) => {
        setEditingPhase(phase);
        const startHour = parseInt(phase.heure_debut.split(':')[0]) || 8;
        setFormData({
            libelle: phase.libelle || '',
            date_debut: phase.date_debut,
            heure_debut: startHour,
            duree_heures: phase.duree_heures,
            poseur_id: phase.poseur_id || '',
        });
        setShowAddForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!calculatedEnd) return;

        try {
            const dataToSave = {
                chantier_id: chantierId,
                libelle: formData.libelle || null,
                date_debut: formData.date_debut,
                date_fin: calculatedEnd.endDate,
                heure_debut: `${formData.heure_debut.toString().padStart(2, '0')}:00:00`,
                heure_fin: `${calculatedEnd.endHour.toString().padStart(2, '0')}:00:00`,
                duree_heures: formData.duree_heures,
                poseur_id: formData.poseur_id || null,
            };

            if (editingPhase) {
                await supabase
                    .from('phases_chantiers')
                    .update({
                        ...dataToSave,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingPhase.id);
            } else {
                // Get next phase number
                const nextNumber = phases.length > 0 ? Math.max(...phases.map((p) => p.numero_phase)) + 1 : 1;

                await supabase.from('phases_chantiers').insert([
                    {
                        ...dataToSave,
                        numero_phase: nextNumber,
                    },
                ]);
            }

            resetForm();
            fetchPhases();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        }
    };

    const handleDelete = async (phaseId: string) => {
        if (!confirm('Supprimer cette phase ?')) return;

        try {
            await supabase.from('phases_chantiers').delete().eq('id', phaseId);
            fetchPhases();
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    // Sort phases chronologically
    const sortedPhases = useMemo(() => {
        return [...phases].sort((a, b) => {
            const dateA = new Date(a.date_debut + 'T' + a.heure_debut);
            const dateB = new Date(b.date_debut + 'T' + b.heure_debut);
            return dateA.getTime() - dateB.getTime();
        });
    }, [phases]);

    const poseurs = users.filter((u) => u.role === 'poseur' || u.role === 'admin');

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div
                className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Gestion des phases
                        </h2>
                        <p className="text-sm text-slate-400">{chantierNom}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Phases list */}
                            {sortedPhases.length === 0 && !showAddForm ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Aucune phase planifiée</p>
                                    <button
                                        onClick={() => setShowAddForm(true)}
                                        className="mt-4 btn-primary"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Ajouter une phase
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {sortedPhases.map((phase) => {
                                        const startDate = new Date(phase.date_debut);
                                        const weekNum = getWeekNumber(startDate);
                                        const startHour = parseInt(phase.heure_debut.split(':')[0]);
                                        const endHour = parseInt(phase.heure_fin.split(':')[0]);

                                        return (
                                            <div
                                                key={phase.id}
                                                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 group hover:border-purple-500/30 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-medium">
                                                                Phase {phase.numero_phase}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
                                                                Sem. {weekNum}
                                                            </span>
                                                            {phase.poseur && (
                                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-xs">
                                                                    <User className="w-3 h-3" />
                                                                    {phase.poseur.first_name} {phase.poseur.last_name}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p className="font-medium text-white mb-1">
                                                            {phase.libelle || `Phase ${phase.numero_phase}`}
                                                        </p>

                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar className="w-4 h-4 text-slate-500" />
                                                            <span className="text-slate-300">
                                                                {formatDateShort(phase.date_debut)} - {startHour}h
                                                            </span>
                                                            <span className="text-slate-500">→</span>
                                                            <span className="text-slate-300">
                                                                {formatDateShort(phase.date_fin)} - {endHour}h
                                                            </span>
                                                            <span className="ml-2 px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-xs font-medium">
                                                                {phase.duree_heures}h
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => openEditForm(phase)}
                                                            className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(phase.id)}
                                                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {/* Add/Edit form */}
                            {showAddForm && (
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 mt-4">
                                    <h3 className="text-sm font-semibold text-purple-400 mb-4">
                                        {editingPhase ? 'Modifier la phase' : 'Nouvelle phase'}
                                    </h3>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="input-label">Libellé</label>
                                                <input
                                                    type="text"
                                                    value={formData.libelle}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, libelle: e.target.value })
                                                    }
                                                    className="input-field"
                                                    placeholder="Ex: Installation mobilier"
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Date de début *</label>
                                                <input
                                                    type="date"
                                                    value={formData.date_debut}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, date_debut: e.target.value })
                                                    }
                                                    className="input-field"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Heure de début</label>
                                                <select
                                                    value={formData.heure_debut}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, heure_debut: parseInt(e.target.value) })
                                                    }
                                                    className="input-field"
                                                >
                                                    <option value={8}>8h (Matin)</option>
                                                    <option value={9}>9h</option>
                                                    <option value={10}>10h</option>
                                                    <option value={11}>11h</option>
                                                    <option value={13}>13h (Après-midi)</option>
                                                    <option value={14}>14h</option>
                                                    <option value={15}>15h</option>
                                                    <option value={16}>16h</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="input-label">Durée (heures) *</label>
                                                <input
                                                    type="number"
                                                    value={formData.duree_heures}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            duree_heures: parseInt(e.target.value) || 8,
                                                        })
                                                    }
                                                    className="input-field"
                                                    min="1"
                                                    max="500"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Poseur assigné</label>
                                                <select
                                                    value={formData.poseur_id}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, poseur_id: e.target.value })
                                                    }
                                                    className="input-field"
                                                >
                                                    <option value="">Non assigné</option>
                                                    {poseurs.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.first_name} {u.last_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Calculated end preview */}
                                        {calculatedEnd && (
                                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                                <p className="text-sm text-slate-400">Fin calculée :</p>
                                                <p className="text-white font-medium">
                                                    {formatDateShort(calculatedEnd.endDate)} - {calculatedEnd.endHour}h
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={resetForm} className="btn-secondary">
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn-primary">
                                                {editingPhase ? 'Enregistrer' : 'Ajouter'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Add button */}
                            {sortedPhases.length > 0 && !showAddForm && (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="w-full p-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Ajouter une phase
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700/50 flex justify-between items-center">
                    <p className="text-sm text-slate-400">
                        {phases.length} phase{phases.length !== 1 ? 's' : ''} planifiée{phases.length !== 1 ? 's' : ''}
                    </p>
                    <button onClick={onClose} className="btn-secondary">
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
