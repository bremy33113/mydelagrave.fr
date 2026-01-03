import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle, Building2, FileText, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../lib/database.types';
import { ConfirmModal } from '../components/ui/ConfirmModal';

type DeletedChantier = Tables<'chantiers'> & {
    client?: Tables<'clients'> | null;
};

type DeletedNote = Tables<'notes_chantiers'> & {
    chantier?: { nom: string } | null;
};

type DeletedClient = Tables<'clients'> & { deleted_at: string | null };

type ConfirmState = {
    type: 'restore' | 'delete';
    itemType: 'chantier' | 'note' | 'client';
    id: string;
} | null;

export function TrashPage() {
    const [activeTab, setActiveTab] = useState<'chantiers' | 'notes' | 'contacts'>('chantiers');
    const [chantiers, setChantiers] = useState<DeletedChantier[]>([]);
    const [notes, setNotes] = useState<DeletedNote[]>([]);
    const [clients, setClients] = useState<DeletedClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmState, setConfirmState] = useState<ConfirmState>(null);

    const fetchDeletedItems = async () => {
        setLoading(true);
        try {
            // Fetch deleted chantiers
            const { data: chantiersData } = await supabase
                .from('chantiers')
                .select('*, client:clients(*)')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            setChantiers((chantiersData as DeletedChantier[]) || []);

            // Fetch deleted notes
            const { data: notesData } = await supabase
                .from('notes_chantiers')
                .select('*, chantier:chantiers(nom)')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            setNotes((notesData as DeletedNote[]) || []);

            // Fetch deleted clients
            const { data: clientsData } = await supabase
                .from('clients')
                .select('*')
                .not('deleted_at', 'is', null)
                .order('deleted_at', { ascending: false });

            setClients((clientsData as DeletedClient[]) || []);
        } catch (err) {
            console.error('Error fetching deleted items:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeletedItems();
    }, []);

    const executeAction = async () => {
        if (!confirmState) return;

        const { type, itemType, id } = confirmState;

        try {
            if (type === 'restore') {
                const table = itemType === 'chantier' ? 'chantiers'
                    : itemType === 'note' ? 'notes_chantiers'
                        : 'clients';

                await supabase
                    .from(table)
                    .update({ deleted_at: null, updated_at: new Date().toISOString() })
                    .eq('id', id);
            } else {
                const table = itemType === 'chantier' ? 'chantiers'
                    : itemType === 'note' ? 'notes_chantiers'
                        : 'clients';

                await supabase.from(table).delete().eq('id', id);
            }

            fetchDeletedItems();
            setConfirmState(null);
        } catch {
            alert('Erreur lors de l\'opération');
        }
    };

    // Helper functions to trigger modal
    const restoreChantier = (id: string) => setConfirmState({ type: 'restore', itemType: 'chantier', id });
    const permanentlyDeleteChantier = (id: string) => setConfirmState({ type: 'delete', itemType: 'chantier', id });
    const restoreNote = (id: string) => setConfirmState({ type: 'restore', itemType: 'note', id });
    const permanentlyDeleteNote = (id: string) => setConfirmState({ type: 'delete', itemType: 'note', id });
    const restoreClient = (id: string) => setConfirmState({ type: 'restore', itemType: 'client', id });
    const permanentlyDeleteClient = (id: string) => setConfirmState({ type: 'delete', itemType: 'client', id });

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="h-full flex flex-col p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Trash2 className="w-7 h-7 text-slate-400" />
                        Corbeille
                    </h1>
                    <p className="text-slate-400">Éléments supprimés récemment</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('chantiers')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'chantiers'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    Chantiers ({chantiers.length})
                </button>
                <button
                    onClick={() => setActiveTab('notes')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'notes'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50'
                        }`}
                >
                    <FileText className="w-4 h-4" />
                    Notes ({notes.length})
                </button>
                <button
                    onClick={() => setActiveTab('contacts')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'contacts'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50'
                        }`}
                >
                    <User className="w-4 h-4" />
                    Contacts ({clients.length})
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : activeTab === 'chantiers' ? (
                    chantiers.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Trash2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun chantier dans la corbeille</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {chantiers.map((chantier) => (
                                <div
                                    key={chantier.id}
                                    className="glass-card p-4 flex items-center justify-between animate-fadeIn"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{chantier.nom}</h3>
                                            <p className="text-sm text-slate-400">
                                                {chantier.reference && `${chantier.reference} • `}
                                                Supprimé le {chantier.deleted_at && formatDate(chantier.deleted_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => restoreChantier(chantier.id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Restaurer
                                        </button>
                                        <button
                                            onClick={() => permanentlyDeleteChantier(chantier.id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : activeTab === 'notes' ? (
                    notes.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucune note dans la corbeille</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    className="glass-card p-4 flex items-center justify-between animate-fadeIn"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-white line-clamp-1">
                                                {note.contenu || 'Note sans contenu'}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                {note.chantier?.nom && `${note.chantier.nom} • `}
                                                Supprimé le {note.deleted_at && formatDate(note.deleted_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => restoreNote(note.id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Restaurer
                                        </button>
                                        <button
                                            onClick={() => permanentlyDeleteNote(note.id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Contacts tab
                    clients.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Aucun contact dans la corbeille</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clients.map((client) => (
                                <div
                                    key={client.id}
                                    className="glass-card p-4 flex items-center justify-between animate-fadeIn"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center">
                                            <User className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{client.nom}</h3>
                                            <p className="text-sm text-slate-400">
                                                {client.entreprise && `${client.entreprise} • `}
                                                Supprimé le {client.deleted_at && formatDate(client.deleted_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => restoreClient(client.id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Restaurer
                                        </button>
                                        <button
                                            onClick={() => permanentlyDeleteClient(client.id)}
                                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Warning */}
            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-sm text-yellow-400">
                    Les éléments supprimés définitivement ne peuvent pas être récupérés.
                </p>
            </div>

            <ConfirmModal
                isOpen={!!confirmState}
                onClose={() => setConfirmState(null)}
                onConfirm={executeAction}
                title={confirmState?.type === 'restore' ? "Restaurer l'élément" : "Supprimer définitivement"}
                message={confirmState?.type === 'restore'
                    ? "Voulez-vous vraiment restaurer cet élément ?"
                    : "Cette action est irréversible. Voulez-vous continuer ?"}
                confirmText={confirmState?.type === 'restore' ? "Restaurer" : "Supprimer"}
                variant={confirmState?.type === 'restore' ? "info" : "danger"}
            />
        </div>
    );
}
