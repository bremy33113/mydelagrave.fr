import { useState, type ReactNode } from 'react';
import { MapPin, Mail, Phone, Building2, ChevronDown } from 'lucide-react';
import type { Tables } from '../../lib/database.types';

interface ChantierCoordonneesProps {
    client: Tables<'clients'> | null | undefined;
    adresseLivraison: string | null | undefined;
    latitude?: number | null;
    longitude?: number | null;
    defaultExpanded?: boolean;
    children?: ReactNode;
}

export function ChantierCoordonnees({
    client,
    adresseLivraison,
    latitude,
    longitude,
    defaultExpanded = true,
    children,
}: ChantierCoordonneesProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);

    if (!client && !adresseLivraison) return null;

    return (
        <section className="glass-card p-4">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 text-left"
            >
                <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expanded ? '' : '-rotate-90'
                    }`}
                />
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Coordonnées chantier
                </h3>
            </button>
            {expanded && (
                <>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        {/* Client */}
                        {client && (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 uppercase">Client principal</p>
                                <p className="text-base font-medium text-white">{client.nom}</p>
                                {client.entreprise && (
                                    <p className="text-sm text-slate-400">{client.entreprise}</p>
                                )}
                                {client.adresse && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <MapPin className="w-3 h-3" />
                                        <span>{client.adresse}</span>
                                    </div>
                                )}
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Mail className="w-3 h-3" />
                                        <a
                                            href={`mailto:${client.email}`}
                                            className="hover:text-blue-400 transition-colors truncate"
                                        >
                                            {client.email}
                                        </a>
                                    </div>
                                )}
                                {client.telephone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                        <Phone className="w-3 h-3" />
                                        <a
                                            href={`tel:${client.telephone}`}
                                            className="hover:text-blue-400 transition-colors"
                                        >
                                            {client.telephone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Adresse livraison */}
                        {adresseLivraison && (
                            <div className="space-y-2">
                                <p className="text-xs text-slate-500 uppercase">Adresse de livraison</p>
                                <p className="text-sm text-white">{adresseLivraison}</p>
                                <a
                                    href={
                                        latitude && longitude
                                            ? `https://www.google.com/maps?q=${latitude},${longitude}`
                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresseLivraison)}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <MapPin className="w-3 h-3" />
                                    Voir sur Google Maps
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Children (contacts list) */}
                    {children}
                </>
            )}
        </section>
    );
}
