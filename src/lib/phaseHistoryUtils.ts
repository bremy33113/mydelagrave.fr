import { supabase } from './supabase';
import type { Tables } from './database.types';

type HistoriquePhase = Tables<'historique_phases'>;
type Phase = Tables<'phases_chantiers'>;

interface PhaseValues {
    date_debut?: string;
    date_fin?: string;
    heure_debut?: string;
    heure_fin?: string;
    duree_heures?: number;
    heures_budget?: number | null;
    poseur_id?: string | null;
    libelle?: string | null;
}

type ActionType = 'date_change' | 'duration_change' | 'poseur_change' | 'budget_change' | 'create' | 'update' | 'delete';

/**
 * Détecte automatiquement le type d'action en fonction des changements
 */
function detectActionType(oldValues: PhaseValues, newValues: PhaseValues): ActionType {
    const hasDateChange =
        oldValues.date_debut !== newValues.date_debut ||
        oldValues.date_fin !== newValues.date_fin ||
        oldValues.heure_debut !== newValues.heure_debut ||
        oldValues.heure_fin !== newValues.heure_fin;

    const hasDurationChange = oldValues.duree_heures !== newValues.duree_heures;
    const hasPoseurChange = oldValues.poseur_id !== newValues.poseur_id;
    const hasBudgetChange = oldValues.heures_budget !== newValues.heures_budget;

    // Priorité aux changements les plus spécifiques
    if (hasPoseurChange) return 'poseur_change';
    if (hasBudgetChange) return 'budget_change';
    if (hasDurationChange) return 'duration_change';
    if (hasDateChange) return 'date_change';

    return 'update';
}

/**
 * Génère une description lisible du changement
 */
async function generateDescription(
    action: ActionType,
    oldValues: PhaseValues,
    newValues: PhaseValues,
    phase: Pick<Phase, 'groupe_phase' | 'numero_phase' | 'libelle'>
): Promise<string> {
    const phaseLabel = `Phase ${phase.groupe_phase || 1}.${phase.numero_phase}${phase.libelle ? ` (${phase.libelle})` : ''}`;

    switch (action) {
        case 'create':
            return `${phaseLabel} : Créée`;
        case 'delete':
            return `${phaseLabel} : Supprimée`;
        case 'date_change': {
            const parts: string[] = [];
            if (oldValues.date_debut !== newValues.date_debut) {
                parts.push(`Début: ${oldValues.date_debut} → ${newValues.date_debut}`);
            }
            if (oldValues.heure_debut !== newValues.heure_debut) {
                parts.push(`Heure début: ${oldValues.heure_debut?.slice(0, 5)} → ${newValues.heure_debut?.slice(0, 5)}`);
            }
            if (oldValues.date_fin !== newValues.date_fin) {
                parts.push(`Fin: ${oldValues.date_fin} → ${newValues.date_fin}`);
            }
            if (oldValues.heure_fin !== newValues.heure_fin) {
                parts.push(`Heure fin: ${oldValues.heure_fin?.slice(0, 5)} → ${newValues.heure_fin?.slice(0, 5)}`);
            }
            return `${phaseLabel} : Dates modifiées\n${parts.join('\n')}`;
        }
        case 'duration_change':
            return `${phaseLabel} : Durée modifiée\n${oldValues.duree_heures}h → ${newValues.duree_heures}h`;
        case 'poseur_change': {
            // Récupérer les noms des poseurs
            let oldPoseur = 'Non attribué';
            let newPoseur = 'Non attribué';

            if (oldValues.poseur_id) {
                const { data: oldUser } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('id', oldValues.poseur_id)
                    .single();
                if (oldUser) {
                    oldPoseur = `${oldUser.first_name || ''} ${oldUser.last_name || ''}`.trim() || oldValues.poseur_id;
                }
            }

            if (newValues.poseur_id) {
                const { data: newUser } = await supabase
                    .from('users')
                    .select('first_name, last_name')
                    .eq('id', newValues.poseur_id)
                    .single();
                if (newUser) {
                    newPoseur = `${newUser.first_name || ''} ${newUser.last_name || ''}`.trim() || newValues.poseur_id;
                }
            }

            return `${phaseLabel} : Poseur modifié\n${oldPoseur} → ${newPoseur}`;
        }
        case 'budget_change':
            return `${phaseLabel} : Budget heures modifié\n${oldValues.heures_budget ?? 0}h → ${newValues.heures_budget ?? 0}h`;
        default:
            return `${phaseLabel} : Modifiée`;
    }
}

/**
 * Enregistre une modification de phase dans l'historique
 */
export async function recordPhaseHistory(
    oldPhase: Phase | PhaseValues & Pick<Phase, 'groupe_phase' | 'numero_phase' | 'libelle'>,
    newValues: Partial<PhaseValues>,
    userId: string,
    chantierId: string,
    phaseId: string,
    forcedAction?: ActionType
): Promise<void> {
    // Extraire les anciennes valeurs
    const oldValues: PhaseValues = {
        date_debut: oldPhase.date_debut,
        date_fin: oldPhase.date_fin,
        heure_debut: oldPhase.heure_debut,
        heure_fin: oldPhase.heure_fin,
        duree_heures: oldPhase.duree_heures,
        heures_budget: oldPhase.heures_budget,
        poseur_id: oldPhase.poseur_id,
        libelle: oldPhase.libelle,
    };

    // Fusionner avec les nouvelles valeurs
    const mergedNewValues: PhaseValues = { ...oldValues, ...newValues };

    // Déterminer l'action
    const action = forcedAction || detectActionType(oldValues, mergedNewValues);

    // Générer la description
    const description = await generateDescription(action, oldValues, mergedNewValues, oldPhase);

    // Créer l'enregistrement
    const historyRecord = {
        phase_id: phaseId,
        chantier_id: chantierId,
        modified_by: userId,
        modified_at: new Date().toISOString(),
        action,
        description,
        // Anciennes valeurs
        old_date_debut: oldValues.date_debut || null,
        old_date_fin: oldValues.date_fin || null,
        old_heure_debut: oldValues.heure_debut || null,
        old_heure_fin: oldValues.heure_fin || null,
        old_duree_heures: oldValues.duree_heures ?? null,
        old_heures_budget: oldValues.heures_budget ?? null,
        old_poseur_id: oldValues.poseur_id || null,
        old_libelle: oldValues.libelle || null,
        // Nouvelles valeurs
        new_date_debut: mergedNewValues.date_debut || null,
        new_date_fin: mergedNewValues.date_fin || null,
        new_heure_debut: mergedNewValues.heure_debut || null,
        new_heure_fin: mergedNewValues.heure_fin || null,
        new_duree_heures: mergedNewValues.duree_heures ?? null,
        new_heures_budget: mergedNewValues.heures_budget ?? null,
        new_poseur_id: mergedNewValues.poseur_id || null,
        new_libelle: mergedNewValues.libelle || null,
    };

    // Insérer dans la base
    await supabase.from('historique_phases').insert(historyRecord);
}

/**
 * Récupère l'historique des phases pour un chantier
 */
export async function getChantierHistory(chantierId: string): Promise<HistoriquePhase[]> {
    const { data, error } = await supabase
        .from('historique_phases')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('modified_at', { ascending: false });

    if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return [];
    }

    return data || [];
}

/**
 * Récupère l'historique d'une phase spécifique
 */
export async function getPhaseHistory(phaseId: string): Promise<HistoriquePhase[]> {
    const { data, error } = await supabase
        .from('historique_phases')
        .select('*')
        .eq('phase_id', phaseId)
        .order('modified_at', { ascending: false });

    if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return [];
    }

    return data || [];
}
