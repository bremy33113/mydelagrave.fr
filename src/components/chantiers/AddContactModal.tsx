import { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Building2, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SelectClientModal } from './SelectClientModal';
import { ConfirmModal } from '../ui/ConfirmModal';
import type { Tables } from '../../lib/database.types';

type ChantierContact = Tables<'chantiers_contacts'> & {
    client?: Tables<'clients'> | null;
};

interface AddContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    chantierId: string;
    chantierNom: string;
}

export function AddContactModal({
    isOpen,
    onClose,
    chantierId,
    chantierNom,
}: AddContactModalProps) {
    const [contacts, setContacts] = useState<ChantierContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSelectModal, setShowSelectModal] = useState(false);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [contactIdToRemove, setContactIdToRemove] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen, chantierId]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('chantiers_contacts')
                .select('*, client:clients(*)')
                .eq('chantier_id', chantierId)
                .order('created_at', { ascending: true });

            setContacts((data as ChantierContact[]) || []);
        } catch (err) {
            console.error('Error fetching contacts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async (client: Tables<'clients'>) => {
        try {
            await supabase.from('chantiers_contacts').insert([
                {
                    chantier_id: chantierId,
                    client_id: client.id,
                    role: null,
                },
            ]);

            fetchContacts();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        }
    };

    const handleUpdateRole = async (contactId: string, role: string) => {
        try {
            await supabase
                .from('chantiers_contacts')
                .update({ role: role || null, updated_at: new Date().toISOString() })
                .eq('id', contactId);

            fetchContacts();
        } catch {
            alert('Erreur lors de la mise à jour');
        }
    };

    const handleRemove = (contactId: string) => {
        setContactIdToRemove(contactId);
        setShowDeleteModal(true);
    };

    const confirmRemoveContact = async () => {
        if (!contactIdToRemove) return;

        try {
            await supabase.from('chantiers_contacts').delete().eq('id', contactIdToRemove);
            fetchContacts();
            setShowDeleteModal(false);
            setContactIdToRemove(null);
        } catch {
            alert('Erreur lors de la suppression');
        }
    };

    const existingClientIds = contacts.map((c) => c.client_id);

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop">
                <div
                    className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-400" />
                                Contacts du chantier
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
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun contact associé à ce chantier</p>
                                <button
                                    onClick={() => setShowSelectModal(true)}
                                    className="mt-4 btn-primary"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter un contact
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contacts.map((contact) => (
                                    <div
                                        key={contact.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 group"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl flex-shrink-0">
                                            👤
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white">{contact.client?.nom}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
                                                {contact.client?.entreprise && (
                                                    <span className="flex items-center gap-1">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {contact.client.entreprise}
                                                    </span>
                                                )}
                                                {contact.client?.telephone && (
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {contact.client.telephone}
                                                    </span>
                                                )}
                                                {contact.client?.email && (
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {contact.client.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={contact.role || ''}
                                                onChange={(e) => handleUpdateRole(contact.id, e.target.value)}
                                                placeholder="Rôle..."
                                                className="w-32 px-3 py-1.5 text-sm bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleRemove(contact.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-700/50 flex justify-between items-center">
                        {contacts.length > 0 && (
                            <button
                                onClick={() => setShowSelectModal(true)}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Ajouter un contact
                            </button>
                        )}
                        <button onClick={onClose} className="btn-secondary ml-auto">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>

            {/* Select Client Modal */}
            <SelectClientModal
                isOpen={showSelectModal}
                onClose={() => setShowSelectModal(false)}
                onSelect={handleAddContact}
                excludeIds={existingClientIds}
                title="Ajouter un contact au chantier"
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setContactIdToRemove(null);
                }}
                onConfirm={confirmRemoveContact}
                title="Retirer le contact"
                message="Voulez-vous vraiment retirer ce contact du chantier ?"
                confirmText="Retirer"
                variant="warning"
            />
        </>
    );
}
