import { useState, useEffect } from 'react';
import { X, Search, Plus, User, Building2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

type Client = Tables<'clients'> & {
    ref_clients?: Tables<'ref_clients'> | null;
};

interface SelectClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (client: Client) => void;
    excludeIds?: string[];
    title?: string;
    onCreateNew?: () => void;
}

export function SelectClientModal({
    isOpen,
    onClose,
    onSelect,
    excludeIds = [],
    title = 'Sélectionner un contact',
    onCreateNew,
}: SelectClientModalProps) {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            setSearchQuery('');
        }
    }, [isOpen]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('clients')
                .select('*, ref_clients(*)')
                .order('nom', { ascending: true });

            setClients((data as Client[]) || []);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter((client) => {
        // Exclude already added
        if (excludeIds.includes(client.id)) return false;

        // Search filter
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            client.nom.toLowerCase().includes(query) ||
            client.entreprise?.toLowerCase().includes(query) ||
            client.email?.toLowerCase().includes(query)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div
                className="glass-card w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" />
                        {title}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher un contact..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucun contact trouvé</p>
                            {onCreateNew && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onCreateNew();
                                    }}
                                    className="mt-4 btn-primary inline-flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Créer un nouveau contact
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        onSelect(client);
                                        onClose();
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 hover:border-blue-500/30 transition-all text-left group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                                        style={{
                                            backgroundColor: `${client.ref_clients?.color || '#64748B'}20`,
                                        }}
                                    >
                                        {client.ref_clients?.icon || '👤'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{client.nom}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            {client.entreprise && (
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="w-3 h-3" />
                                                    {client.entreprise}
                                                </span>
                                            )}
                                            {client.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {client.email}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Plus className="w-4 h-4 text-blue-400" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700/50">
                    <button onClick={onClose} className="w-full btn-secondary">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    );
}
