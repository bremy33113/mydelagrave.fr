import { useState, useEffect } from 'react';
import { ChevronDown, Users, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';
import type { ChantierContact } from './types';

interface ChantierContactsListProps {
    chantierId: string;
    defaultExpanded?: boolean;
}

export function ChantierContactsList({ chantierId, defaultExpanded = true }: ChantierContactsListProps) {
    const [contacts, setContacts] = useState<ChantierContact[]>([]);
    const [expanded, setExpanded] = useState(defaultExpanded);

    useEffect(() => {
        const fetchContacts = async () => {
            // Fetch contacts with clients (alias format for mock compatibility)
            const { data: contactsData } = await supabase
                .from('chantiers_contacts')
                .select('*, client:clients!client_id(*)')
                .eq('chantier_id', chantierId);

            if (!contactsData || contactsData.length === 0) {
                setContacts([]);
                return;
            }

            // Fetch all jobs to enrich client data
            const { data: jobsData } = await supabase
                .from('ref_job')
                .select('*');

            const jobsMap = new Map((jobsData || []).map((j: Tables<'ref_job'>) => [j.code, j]));

            // Enrich contacts with job data (use 'client' alias, map to 'clients' for type)
            const enrichedContacts = contactsData.map((contact: Record<string, unknown>) => {
                const clientData = contact.client as Tables<'clients'> | null;
                return {
                    ...contact,
                    clients: clientData ? {
                        ...clientData,
                        ref_job: clientData.job ? jobsMap.get(clientData.job) || null : null,
                    } : null,
                };
            });

            setContacts(enrichedContacts as ChantierContact[]);
        };
        fetchContacts();
    }, [chantierId]);

    if (contacts.length === 0) return null;

    return (
        <div className="mt-4 pt-4 border-t border-slate-700/50">
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-left w-full"
            >
                <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expanded ? '' : '-rotate-90'
                    }`}
                />
                <span className="text-xs text-slate-500 uppercase flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Contacts chantier ({contacts.length})
                </span>
            </button>
            {expanded && (
                <div className="mt-3 space-y-2">
                    {contacts.map((contact) => {
                        const client = contact.clients;
                        if (!client) return null;
                        return (
                            <div
                                key={contact.id}
                                className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg"
                            >
                                {/* Icône job */}
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                                    style={{
                                        backgroundColor: (client.ref_job?.color || '#64748B') + '20',
                                        color: client.ref_job?.color || '#64748B',
                                    }}
                                >
                                    {client.ref_job?.icon || '👤'}
                                </div>
                                {/* Infos contact */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {client.nom}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        {client.entreprise && (
                                            <span className="truncate">{client.entreprise}</span>
                                        )}
                                        {client.ref_job && (
                                            <>
                                                {client.entreprise && <span>•</span>}
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-xs"
                                                    style={{
                                                        backgroundColor: (client.ref_job.color || '#64748B') + '20',
                                                        color: client.ref_job.color || '#64748B',
                                                    }}
                                                >
                                                    {client.ref_job.label}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {/* Coordonnées */}
                                <div className="flex items-center gap-3 shrink-0 text-xs text-slate-400">
                                    {client.telephone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {client.telephone}
                                        </span>
                                    )}
                                    {client.email && (
                                        <a
                                            href={`mailto:${client.email}`}
                                            className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                            title={client.email}
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[150px]">{client.email}</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
