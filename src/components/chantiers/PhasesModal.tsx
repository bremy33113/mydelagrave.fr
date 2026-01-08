import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Clock, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PhaseGauge } from './PhaseGauge';
import { PhaseGroup } from './PhaseGroup';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { Tables } from '../../lib/database.types';

type Phase = Tables<'phases_chantiers'> & {
    poseur?: { id: string; first_name: string | null; last_name: string | null } | null;
};

interface PhasesModalProps {
    isOpen: boolean;
    onClose: () => void;
    chantierId: string;
    chantierNom: string;
    chantierBudgetHeures?: number | null;
}

// French public holidays for 2026 (can be extended)
const HOLIDAYS_2026 = [
    '2026-01-01', '2026-04-06', '2026-05-01', '2026-05-08', '2026-05-14',
    '2026-05-25', '2026-07-14', '2026-08-15', '2026-11-01', '2026-11-11', '2026-12-25',
];

// Working hours configuration
const WORK_START_MORNING = 8;
const WORK_END_MORNING = 12;
const WORK_START_AFTERNOON = 13;
const WORK_END_AFTERNOON = 17;

function isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    if (day === 0 || day === 6) return false;
    const dateStr = date.toISOString().split('T')[0];
    if (HOLIDAYS_2026.includes(dateStr)) return false;
    return true;
}

function calculateEndDateTime(
    startDate: string,
    startHour: number,
    durationHours: number
): { endDate: string; endHour: number } {
    let remainingHours = durationHours;
    const currentDate = new Date(startDate);
    let currentHour = startHour;

    if (currentHour < WORK_START_MORNING) currentHour = WORK_START_MORNING;
    if (currentHour >= WORK_END_MORNING && currentHour < WORK_START_AFTERNOON) {
        currentHour = WORK_START_AFTERNOON;
    }
    if (currentHour >= WORK_END_AFTERNOON) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentHour = WORK_START_MORNING;
    }

    while (!isWorkingDay(currentDate)) {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    while (remainingHours > 0) {
        if (currentHour >= WORK_START_MORNING && currentHour < WORK_END_MORNING) {
            const morningHours = Math.min(WORK_END_MORNING - currentHour, remainingHours);
            remainingHours -= morningHours;
            currentHour = WORK_END_MORNING;

            if (remainingHours > 0) {
                const afternoonHours = Math.min(WORK_END_AFTERNOON - WORK_START_AFTERNOON, remainingHours);
                remainingHours -= afternoonHours;
                currentHour = WORK_START_AFTERNOON + afternoonHours;
            }
        } else if (currentHour >= WORK_START_AFTERNOON && currentHour < WORK_END_AFTERNOON) {
            const afternoonHours = Math.min(WORK_END_AFTERNOON - currentHour, remainingHours);
            remainingHours -= afternoonHours;
            currentHour += afternoonHours;
        }

        if (remainingHours > 0) {
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

function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: '2-digit',
    });
}

interface PhaseGroupData {
    groupNumber: number;
    label: string;
    budgetHours: number | null;
    subPhases: Phase[];
}

export function PhasesModal({ isOpen, onClose, chantierId, chantierNom, chantierBudgetHeures }: PhasesModalProps) {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Tables<'users'>[]>([]);

    // Forms
    const [showSubPhaseForm, setShowSubPhaseForm] = useState(false);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
    const [editingGroupNumber, setEditingGroupNumber] = useState<number | null>(null);
    const [targetGroupNumber, setTargetGroupNumber] = useState<number>(1);

    // Delete modals
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [phaseIdToDelete, setPhaseIdToDelete] = useState<string | null>(null);
    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<number | null>(null);

    // Ref for sub-phase form scroll
    const subPhaseFormRef = useRef<HTMLDivElement>(null);

    // Sub-phase form data
    const [subPhaseForm, setSubPhaseForm] = useState({
        libelle: '',
        date_debut: '',
        heure_debut: 8,
        duree_heures: 8,
        poseur_id: '',
    });

    // Group form data
    const [groupForm, setGroupForm] = useState({
        label: '',
        heures_budget: '',
    });

    // Calculated end date for sub-phase form
    const calculatedEnd = useMemo(() => {
        if (!subPhaseForm.date_debut) return null;
        return calculateEndDateTime(subPhaseForm.date_debut, subPhaseForm.heure_debut, subPhaseForm.duree_heures);
    }, [subPhaseForm.date_debut, subPhaseForm.heure_debut, subPhaseForm.duree_heures]);

    // Group phases by groupe_phase
    const groupedPhases = useMemo<PhaseGroupData[]>(() => {
        const groups = new Map<number, Phase[]>();

        phases.forEach((phase) => {
            const group = phase.groupe_phase || 1;
            const existing = groups.get(group) || [];
            existing.push(phase);
            groups.set(group, existing);
        });

        // Sort sub-phases within each group
        groups.forEach((subPhases, _) => {
            subPhases.sort((a, b) => {
                const dateA = new Date(a.date_debut + 'T' + a.heure_debut);
                const dateB = new Date(b.date_debut + 'T' + b.heure_debut);
                return dateA.getTime() - dateB.getTime();
            });
        });

        // Convert to array and sort by group number
        return Array.from(groups.entries())
            .sort(([a], [b]) => a - b)
            .map(([groupNumber, subPhases]) => {
                // Get group label from placeholder (duree_heures === 0) which holds the phase name
                const placeholder = subPhases.find((p) => p.duree_heures === 0);
                const firstWithBudget = subPhases.find((p) => p.heures_budget !== null);

                return {
                    groupNumber,
                    label: placeholder?.libelle || '',
                    budgetHours: firstWithBudget?.heures_budget || null,
                    subPhases,
                };
            });
    }, [phases]);

    // Total hours consumed (only real sub-phases with duree_heures > 0)
    const totalConsumed = useMemo(() => {
        return phases
            .filter((p) => p.duree_heures > 0)
            .reduce((sum, p) => sum + p.duree_heures, 0);
    }, [phases]);

    // Total budget (sum of all phase budgets)
    const totalBudget = useMemo(() => {
        return groupedPhases.reduce((sum, g) => sum + (g.budgetHours || 0), 0);
    }, [groupedPhases]);

    // Next available group number
    const nextGroupNumber = useMemo(() => {
        if (groupedPhases.length === 0) return 1;
        return Math.max(...groupedPhases.map((g) => g.groupNumber)) + 1;
    }, [groupedPhases]);

    useEffect(() => {
        if (isOpen) {
            fetchPhases();
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, chantierId]);

    // Scroll to sub-phase form when it opens
    useEffect(() => {
        if (showSubPhaseForm && subPhaseFormRef.current) {
            setTimeout(() => {
                subPhaseFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [showSubPhaseForm]);

    const fetchPhases = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('phases_chantiers')
                .select('*, poseur:users(id, first_name, last_name)')
                .eq('chantier_id', chantierId)
                .order('groupe_phase', { ascending: true })
                .order('date_debut', { ascending: true });

            setPhases((data as Phase[]) || []);
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

    const poseurs = users.filter((u) => u.role === 'poseur' || u.role === 'admin');

    // Reset forms
    const resetSubPhaseForm = () => {
        setSubPhaseForm({
            libelle: '',
            date_debut: '',
            heure_debut: 8,
            duree_heures: 8,
            poseur_id: '',
        });
        setEditingPhase(null);
        setShowSubPhaseForm(false);
    };

    const resetGroupForm = () => {
        setGroupForm({ label: '', heures_budget: '' });
        setEditingGroupNumber(null);
        setShowGroupForm(false);
    };

    // Handle add sub-phase
    const handleAddSubPhase = (groupNumber: number) => {
        setTargetGroupNumber(groupNumber);
        resetSubPhaseForm();
        setShowSubPhaseForm(true);
    };

    // Handle edit sub-phase
    const handleEditSubPhase = (phase: Phase) => {
        setEditingPhase(phase);
        setTargetGroupNumber(phase.groupe_phase);
        const startHour = parseInt(phase.heure_debut.split(':')[0]) || 8;
        setSubPhaseForm({
            libelle: phase.libelle || '',
            date_debut: phase.date_debut,
            heure_debut: startHour,
            duree_heures: phase.duree_heures,
            poseur_id: phase.poseur_id || '',
        });
        setShowSubPhaseForm(true);
    };

    // Handle submit sub-phase
    const handleSubmitSubPhase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!calculatedEnd) return;

        try {
            // Get next numero_phase for this group
            const groupPhases = phases.filter((p) => p.groupe_phase === targetGroupNumber);
            const nextNumero = editingPhase
                ? editingPhase.numero_phase
                : (groupPhases.length > 0 ? Math.max(...groupPhases.map((p) => p.numero_phase)) + 1 : 1);

            const dataToSave = {
                chantier_id: chantierId,
                groupe_phase: targetGroupNumber,
                numero_phase: nextNumero,
                libelle: subPhaseForm.libelle || null,
                heures_budget: null, // Budget is set on the group level via first sub-phase
                date_debut: subPhaseForm.date_debut,
                date_fin: calculatedEnd.endDate,
                heure_debut: `${subPhaseForm.heure_debut.toString().padStart(2, '0')}:00:00`,
                heure_fin: `${calculatedEnd.endHour.toString().padStart(2, '0')}:00:00`,
                duree_heures: subPhaseForm.duree_heures,
                poseur_id: subPhaseForm.poseur_id || null,
            };

            if (editingPhase) {
                await supabase
                    .from('phases_chantiers')
                    .update({ ...dataToSave, updated_at: new Date().toISOString() })
                    .eq('id', editingPhase.id);
            } else {
                await supabase.from('phases_chantiers').insert([dataToSave]);
            }

            resetSubPhaseForm();
            await fetchPhases();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        }
    };

    // Handle add new group
    const handleAddGroup = () => {
        setTargetGroupNumber(nextGroupNumber);
        resetGroupForm();
        setShowGroupForm(true);
    };

    // Handle edit group
    const handleEditGroup = (groupNumber: number) => {
        const group = groupedPhases.find((g) => g.groupNumber === groupNumber);
        if (group) {
            setEditingGroupNumber(groupNumber);
            setGroupForm({
                label: group.label,
                heures_budget: group.budgetHours?.toString() || '',
            });
            setShowGroupForm(true);
        }
    };

    // Handle submit group
    const handleSubmitGroup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const budgetValue = groupForm.heures_budget ? parseInt(groupForm.heures_budget) : null;

            if (editingGroupNumber !== null) {
                // Update: find the placeholder (duree_heures === 0) and update its label/budget
                const groupPhases = phases.filter((p) => p.groupe_phase === editingGroupNumber);
                const placeholder = groupPhases.find((p) => p.duree_heures === 0);

                if (placeholder) {
                    await supabase
                        .from('phases_chantiers')
                        .update({
                            libelle: groupForm.label || null,
                            heures_budget: budgetValue,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', placeholder.id);
                } else if (groupPhases.length > 0) {
                    // If no placeholder exists, create one
                    await supabase.from('phases_chantiers').insert([{
                        chantier_id: chantierId,
                        groupe_phase: editingGroupNumber,
                        numero_phase: 0,
                        libelle: groupForm.label || null,
                        heures_budget: budgetValue,
                        date_debut: new Date().toISOString().split('T')[0],
                        date_fin: new Date().toISOString().split('T')[0],
                        heure_debut: '08:00:00',
                        heure_fin: '08:00:00',
                        duree_heures: 0,
                        poseur_id: null,
                    }]);
                }
            } else {
                // Create new group with a placeholder sub-phase (numero_phase: 0, duree_heures: 0)
                await supabase.from('phases_chantiers').insert([{
                    chantier_id: chantierId,
                    groupe_phase: targetGroupNumber,
                    numero_phase: 0,
                    libelle: groupForm.label || `Phase ${targetGroupNumber}`,
                    heures_budget: budgetValue,
                    date_debut: new Date().toISOString().split('T')[0],
                    date_fin: new Date().toISOString().split('T')[0],
                    heure_debut: '08:00:00',
                    heure_fin: '08:00:00',
                    duree_heures: 0,
                    poseur_id: null,
                }]);
            }

            resetGroupForm();
            await fetchPhases();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        }
    };

    // Handle delete sub-phase
    const handleDeleteSubPhase = (phaseId: string) => {
        setPhaseIdToDelete(phaseId);
        setShowDeleteModal(true);
    };

    const confirmDeleteSubPhase = async () => {
        if (!phaseIdToDelete) return;
        try {
            await supabase.from('phases_chantiers').delete().eq('id', phaseIdToDelete);
            await fetchPhases();
            setShowDeleteModal(false);
            setPhaseIdToDelete(null);
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    // Handle delete group
    const handleDeleteGroup = (groupNumber: number) => {
        setGroupToDelete(groupNumber);
        setShowDeleteGroupModal(true);
    };

    const confirmDeleteGroup = async () => {
        if (groupToDelete === null) return;
        try {
            // Delete all sub-phases of this group
            const groupPhases = phases.filter((p) => p.groupe_phase === groupToDelete);
            for (const phase of groupPhases) {
                await supabase.from('phases_chantiers').delete().eq('id', phase.id);
            }
            await fetchPhases();
            setShowDeleteGroupModal(false);
            setGroupToDelete(null);
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    // Renumber phases chronologically within each group before closing
    const renumberPhasesChronologically = async () => {
        // Fetch fresh data from database to ensure we have the latest state
        const { data: freshPhases } = await supabase
            .from('phases_chantiers')
            .select('*')
            .eq('chantier_id', chantierId);

        if (!freshPhases || freshPhases.length === 0) return false;

        type PhaseRow = Tables<'phases_chantiers'>;

        // Group phases by groupe_phase
        const groups = new Map<number, PhaseRow[]>();
        freshPhases.forEach((phase: PhaseRow) => {
            const group = phase.groupe_phase || 1;
            const existing = groups.get(group) || [];
            existing.push(phase);
            groups.set(group, existing);
        });

        const updates: { id: string; numero_phase: number }[] = [];

        // For each group, sort by date and renumber
        groups.forEach((subPhases) => {
            // Separate placeholder (duree=0) from real phases
            const placeholder = subPhases.find(p => p.duree_heures === 0);
            const realPhases = subPhases.filter(p => p.duree_heures > 0);

            // If placeholder exists and occupies numero_phase > 0, move it to 0
            if (placeholder && placeholder.numero_phase !== 0) {
                updates.push({ id: placeholder.id, numero_phase: 0 });
            }

            // Sort real phases by date + time
            const sorted = [...realPhases].sort((a, b) => {
                const dateA = new Date(a.date_debut + 'T' + (a.heure_debut || '08:00:00'));
                const dateB = new Date(b.date_debut + 'T' + (b.heure_debut || '08:00:00'));
                return dateA.getTime() - dateB.getTime();
            });

            // Renumber real phases starting from 1
            sorted.forEach((phase, index) => {
                const expectedNumero = index + 1;
                if (phase.numero_phase !== expectedNumero) {
                    updates.push({ id: phase.id, numero_phase: expectedNumero });
                }
            });
        });

        // Apply updates if needed
        if (updates.length > 0) {
            for (const update of updates) {
                await supabase
                    .from('phases_chantiers')
                    .update({ numero_phase: update.numero_phase, updated_at: new Date().toISOString() })
                    .eq('id', update.id);
            }
        }

        return updates.length > 0;
    };

    // Handle close with chronological renumbering
    const handleClose = async () => {
        await renumberPhasesChronologically();
        onClose();
    };

    if (!isOpen) return null;

    // Note: heuresAllouees du chantier n'est plus utilisé pour la jauge
    // On utilise totalBudget (somme des budgets des phases) à la place

    return (
        <div className="modal-backdrop" data-testid="phases-modal">
            <div
                className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Layers className="w-5 h-5 text-purple-400" />
                                Gestion des phases
                                {chantierBudgetHeures != null && (
                                    <span
                                        className={`ml-2 px-2.5 py-1 text-sm font-semibold rounded-full flex items-center gap-1 ${
                                            totalConsumed > chantierBudgetHeures
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : totalConsumed >= chantierBudgetHeures * 0.8
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        }`}
                                        title={`Budget chantier: ${chantierBudgetHeures}h - Consommé: ${totalConsumed}h`}
                                    >
                                        <Clock className="w-3.5 h-3.5" />
                                        {chantierBudgetHeures}h
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-slate-400">{chantierNom}</p>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400" data-testid="phases-modal-close">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Global gauge */}
                    {totalBudget > 0 && (
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-300 font-medium">
                                    Budget total phases
                                </span>
                                <span className={`text-sm font-medium ${totalConsumed > totalBudget ? 'text-red-400' : 'text-green-400'}`}>
                                    Reste: {totalBudget - totalConsumed}h
                                </span>
                            </div>
                            <PhaseGauge consumed={totalConsumed} allocated={totalBudget} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Phase groups */}
                            {groupedPhases.length === 0 && !showGroupForm ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Aucune phase planifiée</p>
                                    <button
                                        onClick={handleAddGroup}
                                        className="mt-4 btn-primary"
                                        data-testid="btn-create-first-phase"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Créer Phase 1
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {groupedPhases.map((group) => (
                                        <PhaseGroup
                                            key={group.groupNumber}
                                            groupNumber={group.groupNumber}
                                            groupLabel={group.label}
                                            budgetHours={group.budgetHours}
                                            subPhases={group.subPhases.filter((p) => p.duree_heures > 0)}
                                            onAddSubPhase={handleAddSubPhase}
                                            onEditSubPhase={handleEditSubPhase}
                                            onDeleteSubPhase={handleDeleteSubPhase}
                                            onEditGroup={handleEditGroup}
                                            onDeleteGroup={handleDeleteGroup}
                                        />
                                    ))}

                                    {/* Add new phase button */}
                                    {!showGroupForm && !showSubPhaseForm && (
                                        <button
                                            onClick={handleAddGroup}
                                            className="w-full p-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                                            data-testid="btn-add-phase-group"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Nouvelle Phase {nextGroupNumber}
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Group form */}
                            {showGroupForm && (
                                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30" data-testid="phase-group-form">
                                    <h3 className="text-sm font-semibold text-purple-400 mb-4">
                                        {editingGroupNumber ? `Modifier Phase ${editingGroupNumber}` : `Nouvelle Phase ${targetGroupNumber}`}
                                    </h3>
                                    <form onSubmit={handleSubmitGroup} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="input-label">Nom de la phase</label>
                                                <input
                                                    type="text"
                                                    value={groupForm.label}
                                                    onChange={(e) => setGroupForm({ ...groupForm, label: e.target.value })}
                                                    className="input-field"
                                                    placeholder="Ex: Batiment"
                                                    data-testid="input-phase-label"
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Budget heures</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={groupForm.heures_budget}
                                                        onChange={(e) => setGroupForm({ ...groupForm, heures_budget: e.target.value })}
                                                        className="input-field pr-8"
                                                        placeholder="Ex: 120"
                                                        data-testid="input-phase-budget"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">h</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={resetGroupForm} className="btn-secondary" data-testid="btn-cancel-phase">
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn-primary" data-testid="btn-submit-phase">
                                                {editingGroupNumber ? 'Enregistrer' : 'Créer'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Sub-phase form */}
                            {showSubPhaseForm && (
                                <div ref={subPhaseFormRef} className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30" data-testid="subphase-form">
                                    <h3 className="text-sm font-semibold text-blue-400 mb-4">
                                        {editingPhase
                                            ? `Modifier sous-phase ${targetGroupNumber}.${editingPhase.numero_phase}`
                                            : `Nouvelle sous-phase ${targetGroupNumber}.X`}
                                    </h3>
                                    <form onSubmit={handleSubmitSubPhase} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="input-label">Libellé de la sous-phase</label>
                                                <input
                                                    type="text"
                                                    value={subPhaseForm.libelle}
                                                    onChange={(e) => setSubPhaseForm({ ...subPhaseForm, libelle: e.target.value })}
                                                    className="input-field"
                                                    placeholder="Ex: RDC"
                                                    data-testid="input-subphase-libelle"
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Date de début *</label>
                                                <input
                                                    type="date"
                                                    value={subPhaseForm.date_debut}
                                                    onChange={(e) => setSubPhaseForm({ ...subPhaseForm, date_debut: e.target.value })}
                                                    className="input-field"
                                                    required
                                                    data-testid="input-subphase-date"
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Heure de début</label>
                                                <select
                                                    value={subPhaseForm.heure_debut}
                                                    onChange={(e) => setSubPhaseForm({ ...subPhaseForm, heure_debut: parseInt(e.target.value) })}
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
                                                    value={subPhaseForm.duree_heures}
                                                    onChange={(e) => setSubPhaseForm({ ...subPhaseForm, duree_heures: parseInt(e.target.value) || 8 })}
                                                    className="input-field"
                                                    min="1"
                                                    max="500"
                                                    required
                                                    data-testid="input-subphase-duree"
                                                />
                                            </div>
                                            <div>
                                                <label className="input-label">Poseur assigné</label>
                                                <select
                                                    value={subPhaseForm.poseur_id}
                                                    onChange={(e) => setSubPhaseForm({ ...subPhaseForm, poseur_id: e.target.value })}
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

                                        {calculatedEnd && (
                                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                                <p className="text-sm text-slate-400">Fin calculée :</p>
                                                <p className="text-white font-medium">
                                                    {formatDateShort(calculatedEnd.endDate)} - {calculatedEnd.endHour}h
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={resetSubPhaseForm} className="btn-secondary" data-testid="btn-cancel-subphase">
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn-primary" data-testid="btn-submit-subphase">
                                                {editingPhase ? 'Enregistrer' : 'Ajouter'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700/50 flex justify-between items-center" data-testid="phases-modal-footer">
                    <p className="text-sm text-slate-400" data-testid="phases-count">
                        {groupedPhases.length} phase{groupedPhases.length !== 1 ? 's' : ''} •{' '}
                        {phases.filter((p) => p.duree_heures > 0).length} sous-phase{phases.filter((p) => p.duree_heures > 0).length !== 1 ? 's' : ''}
                    </p>
                    <button onClick={handleClose} className="btn-secondary" data-testid="btn-close-phases">
                        Fermer
                    </button>
                </div>
            </div>

            {/* Delete sub-phase modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setPhaseIdToDelete(null);
                }}
                onConfirm={confirmDeleteSubPhase}
                title="Supprimer la sous-phase"
                message="Voulez-vous vraiment supprimer cette sous-phase ?"
                confirmText="Supprimer"
                variant="danger"
            />

            {/* Delete group modal */}
            <ConfirmModal
                isOpen={showDeleteGroupModal}
                onClose={() => {
                    setShowDeleteGroupModal(false);
                    setGroupToDelete(null);
                }}
                onConfirm={confirmDeleteGroup}
                title="Supprimer la phase"
                message="Voulez-vous vraiment supprimer cette phase et toutes ses sous-phases ?"
                confirmText="Supprimer tout"
                variant="danger"
            />
        </div>
    );
}
