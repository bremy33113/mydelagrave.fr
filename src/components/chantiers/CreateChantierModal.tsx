import { useState, useEffect, FormEvent, useRef } from 'react';
import { X, Building2, MapPin, User, Tag, Map, Plus, Search, Hash, Layers, Settings, Briefcase, Wrench, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AddressSelectorModal } from './AddressSelectorModal';
import { CreateContactModal } from './CreateContactModal';
import type { Tables } from '../../lib/database.types';

type Chantier = Tables<'chantiers'>;

interface CreateChantierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingChantier?: Chantier | null;
}

export function CreateChantierModal({
    isOpen,
    onClose,
    onSuccess,
    editingChantier,
}: CreateChantierModalProps) {
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Tables<'clients'>[]>([]);
    const [users, setUsers] = useState<Tables<'users'>[]>([]);
    const [categories, setCategories] = useState<Tables<'ref_categories_chantier'>[]>([]);
    const [types, setTypes] = useState<Tables<'ref_types_chantier'>[]>([]);
    const [statuts, setStatuts] = useState<Tables<'ref_statuts_chantier'>[]>([]);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // Client autocomplete state
    const [clientSearch, setClientSearch] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showCreateContactModal, setShowCreateContactModal] = useState(false);
    const [pendingClientName, setPendingClientName] = useState('');
    const clientInputRef = useRef<HTMLInputElement>(null);

    // Address autocomplete state
    const [addressSuggestions, setAddressSuggestions] = useState<Array<{
        properties: { label: string };
        geometry: { coordinates: [number, number] };
    }>>([]);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);
    const [addressSearchTimeout, setAddressSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    const [formData, setFormData] = useState({
        nom: '',
        reference: '',
        client_id: '',
        charge_affaire_id: '',
        poseur_id: '',
        adresse_livraison: '',
        adresse_livraison_latitude: null as number | null,
        adresse_livraison_longitude: null as number | null,
        categorie: '',
        type: '',
        statut: 'nouveau',
        date_debut: '',
        date_fin: '',
        budget_heures: '' as string | number,
    });

    // Fetch reference data when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchRefs();
        }
    }, [isOpen]);

    // Initialize form data when modal opens or editing chantier changes
    useEffect(() => {
        if (isOpen) {
            if (editingChantier) {
                setFormData({
                    nom: editingChantier.nom,
                    reference: editingChantier.reference || '',
                    client_id: editingChantier.client_id || '',
                    charge_affaire_id: editingChantier.charge_affaire_id || '',
                    poseur_id: editingChantier.poseur_id || '',
                    adresse_livraison: editingChantier.adresse_livraison || '',
                    adresse_livraison_latitude: editingChantier.adresse_livraison_latitude || null,
                    adresse_livraison_longitude: editingChantier.adresse_livraison_longitude || null,
                    categorie: editingChantier.categorie || '',
                    type: editingChantier.type || '',
                    statut: editingChantier.statut,
                    date_debut: editingChantier.date_debut?.split('T')[0] || '',
                    date_fin: editingChantier.date_fin?.split('T')[0] || '',
                    budget_heures: editingChantier.budget_heures ?? '',
                });
            } else {
                setFormData({
                    nom: '',
                    reference: '',
                    client_id: '',
                    charge_affaire_id: '',
                    poseur_id: '',
                    adresse_livraison: '',
                    adresse_livraison_latitude: null,
                    adresse_livraison_longitude: null,
                    categorie: '',
                    type: '',
                    statut: 'nouveau',
                    date_debut: '',
                    date_fin: '',
                    budget_heures: '',
                });
                setClientSearch('');
            }
        }
    }, [isOpen, editingChantier]);

    // Initialize client search when editing and clients are loaded
    useEffect(() => {
        if (isOpen && editingChantier?.client_id && clients.length > 0) {
            const client = clients.find(c => c.id === editingChantier.client_id);
            if (client) {
                setClientSearch(client.nom + (client.entreprise ? ` (${client.entreprise})` : ''));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, editingChantier?.client_id, clients.length]);

    // Cleanup address search timeout on unmount
    useEffect(() => {
        return () => {
            if (addressSearchTimeout) {
                clearTimeout(addressSearchTimeout);
            }
        };
    }, [addressSearchTimeout]);

    const fetchRefs = async () => {
        const [clientsRes, usersRes, catsRes, typesRes, statutsRes] = await Promise.all([
            supabase.from('clients').select('*').order('nom'),
            supabase.from('users').select('*').eq('suspended', false).order('last_name'),
            supabase.from('ref_categories_chantier').select('*'),
            supabase.from('ref_types_chantier').select('*'),
            supabase.from('ref_statuts_chantier').select('*'),
        ]);

        setClients((clientsRes.data as Tables<'clients'>[]) || []);
        setUsers((usersRes.data as Tables<'users'>[]) || []);
        setCategories((catsRes.data as Tables<'ref_categories_chantier'>[]) || []);
        setTypes((typesRes.data as Tables<'ref_types_chantier'>[]) || []);
        setStatuts((statutsRes.data as Tables<'ref_statuts_chantier'>[]) || []);
    };

    // Address autocomplete functions
    const handleAddressSearch = (query: string) => {
        setFormData({ ...formData, adresse_livraison: query });

        // Clear previous timeout
        if (addressSearchTimeout) {
            clearTimeout(addressSearchTimeout);
        }

        // Debounce search
        if (query.length >= 3) {
            const timeout = setTimeout(async () => {
                try {
                    const response = await fetch(
                        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`
                    );
                    const data = await response.json();
                    setAddressSuggestions(data.features || []);
                    setShowAddressDropdown(true);
                } catch (err) {
                    console.error('Address search failed:', err);
                }
            }, 300);
            setAddressSearchTimeout(timeout);
        } else {
            setAddressSuggestions([]);
            setShowAddressDropdown(false);
        }
    };

    const handleSelectAddress = (address: string, lat?: number, lon?: number) => {
        setFormData({
            ...formData,
            adresse_livraison: address,
            adresse_livraison_latitude: lat ?? null,
            adresse_livraison_longitude: lon ?? null,
        });
        setAddressSuggestions([]);
        setShowAddressDropdown(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                nom: formData.nom,
                reference: formData.reference || null,
                client_id: formData.client_id || null,
                charge_affaire_id: formData.charge_affaire_id || null,
                poseur_id: formData.poseur_id || null,
                adresse_livraison: formData.adresse_livraison || null,
                adresse_livraison_latitude: formData.adresse_livraison_latitude,
                adresse_livraison_longitude: formData.adresse_livraison_longitude,
                categorie: formData.categorie || null,
                type: formData.type || null,
                statut: formData.statut,
                date_debut: formData.date_debut || null,
                date_fin: formData.date_fin || null,
                budget_heures: formData.budget_heures ? Number(formData.budget_heures) : null,
                deleted_at: null,
            };

            if (editingChantier) {
                await supabase
                    .from('chantiers')
                    .update({
                        ...dataToSave,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingChantier.id);
            } else {
                await supabase.from('chantiers').insert([dataToSave]);
            }

            onSuccess();
            onClose();
        } catch (err) {
            alert('Erreur: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const chargesAffaires = users.filter(
        (u) => u.role === 'admin' || u.role === 'superviseur' || u.role === 'charge_affaire'
    );
    const poseurs = users.filter((u) => u.role === 'poseur' || u.role === 'admin');

    return (
        <div className="modal-backdrop">
            <div
                className="glass-card w-full max-w-2xl max-h-[90vh] overflow-auto p-6 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">
                            {editingChantier ? 'Modifier le chantier' : 'Nouveau chantier'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section: Informations générales */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Informations générales
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="input-label"><Building2 className="w-4 h-4 inline mr-1 opacity-70" />Nom du chantier *</label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="input-field"
                                    placeholder="Ex: Laboratoire CHU Nantes"
                                    required
                                />
                            </div>
                            <div>
                                <label className="input-label"><Hash className="w-4 h-4 inline mr-1 opacity-70" />Référence</label>
                                <input
                                    type="text"
                                    value={formData.reference}
                                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                    className="input-field"
                                    placeholder="Ex: CHU-2026-001"
                                />
                            </div>
                            <div>
                                <label className="input-label"><Tag className="w-4 h-4 inline mr-1 opacity-70" />Statut</label>
                                {editingChantier ? (
                                    <select
                                        value={formData.statut}
                                        onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                                        className="input-field"
                                    >
                                        {statuts.map((s) => (
                                            <option key={s.code} value={s.code}>
                                                {s.icon} {s.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="input-field bg-slate-700/50 text-slate-300 cursor-not-allowed">
                                        🆕 Nouveau
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="input-label"><Layers className="w-4 h-4 inline mr-1 opacity-70" />Catégorie</label>
                                <select
                                    value={formData.categorie}
                                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Sélectionner...</option>
                                    {categories.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.icon} {c.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label"><Settings className="w-4 h-4 inline mr-1 opacity-70" />Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        // Si fourniture seule, on vide le poseur
                                        if (newType === 'fourniture') {
                                            setFormData({ ...formData, type: newType, poseur_id: '' });
                                        } else {
                                            setFormData({ ...formData, type: newType });
                                        }
                                    }}
                                    className="input-field"
                                >
                                    <option value="">Sélectionner...</option>
                                    {types.map((t) => (
                                        <option key={t.code} value={t.code}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label"><Clock className="w-4 h-4 inline mr-1 opacity-70" />Budget heures</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={formData.budget_heures}
                                        onChange={(e) => setFormData({ ...formData, budget_heures: e.target.value })}
                                        className="input-field pr-8"
                                        placeholder="Ex: 120"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">h</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Client et adresse */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Client et localisation
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 relative">
                                <label className="input-label"><User className="w-4 h-4 inline mr-1 opacity-70" />Client principal</label>

                                {/* Autocomplete input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        ref={clientInputRef}
                                        type="text"
                                        value={clientSearch}
                                        onChange={(e) => {
                                            setClientSearch(e.target.value);
                                            setShowClientDropdown(true);
                                            if (!e.target.value) {
                                                setFormData({ ...formData, client_id: '' });
                                            }
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                                        placeholder="Rechercher ou créer un client..."
                                        className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                    />

                                    {/* Dropdown */}
                                    {showClientDropdown && (
                                        <div className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl">
                                            {clients
                                                .filter(c =>
                                                    c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                                    c.entreprise?.toLowerCase().includes(clientSearch.toLowerCase())
                                                )
                                                .slice(0, 5)
                                                .map((c) => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setFormData({ ...formData, client_id: c.id });
                                                            setClientSearch(c.nom + (c.entreprise ? ` (${c.entreprise})` : ''));
                                                            setShowClientDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors ${formData.client_id === c.id ? 'bg-blue-500/20 text-blue-300' : 'text-white'
                                                            }`}
                                                    >
                                                        <p className="font-medium">{c.nom}</p>
                                                        {c.entreprise && <p className="text-xs text-slate-400">{c.entreprise}</p>}
                                                    </button>
                                                ))
                                            }

                                            {/* Create new option */}
                                            {clientSearch.trim() && !clients.some(c =>
                                                c.nom.toLowerCase() === clientSearch.toLowerCase()
                                            ) && (
                                                    <button
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setPendingClientName(clientSearch);
                                                            setShowCreateContactModal(true);
                                                            setShowClientDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 hover:bg-green-500/20 text-green-400 border-t border-slate-700 flex items-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        Créer "{clientSearch}"
                                                    </button>
                                                )}

                                            {/* No results */}
                                            {clients.filter(c =>
                                                c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                                c.entreprise?.toLowerCase().includes(clientSearch.toLowerCase())
                                            ).length === 0 && !clientSearch.trim() && (
                                                    <p className="px-4 py-2 text-slate-400 text-sm">Tapez pour rechercher...</p>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="input-label"><MapPin className="w-4 h-4 inline mr-1 opacity-70" />Adresse de livraison</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={formData.adresse_livraison}
                                            onChange={(e) => handleAddressSearch(e.target.value)}
                                            onFocus={() => addressSuggestions.length > 0 && setShowAddressDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                                            className="input-field"
                                            placeholder="Ex: 1 Place Alexis-Ricordeau, 44093 Nantes"
                                        />
                                        {/* Address Suggestions Dropdown */}
                                        {showAddressDropdown && addressSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl">
                                                {addressSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => handleSelectAddress(
                                                            suggestion.properties.label,
                                                            suggestion.geometry.coordinates[1], // latitude
                                                            suggestion.geometry.coordinates[0]  // longitude
                                                        )}
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-sm text-white"
                                                    >
                                                        {suggestion.properties.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowAddressModal(true)}
                                        className="btn-secondary px-3"
                                        title="Sélectionner sur la carte"
                                    >
                                        <Map className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Équipe */}
                    <section>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Équipe assignée
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label"><Briefcase className="w-4 h-4 inline mr-1 opacity-70" />Chargé d'affaires</label>
                                <select
                                    value={formData.charge_affaire_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, charge_affaire_id: e.target.value })
                                    }
                                    className="input-field"
                                >
                                    <option value="">Non attribué</option>
                                    {chargesAffaires.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">
                                    <Wrench className="w-4 h-4 inline mr-1 opacity-70" />
                                    Poseur principal
                                    {formData.type === 'fourniture' && (
                                        <span className="ml-2 text-xs text-amber-400">(Non applicable - Fourniture seule)</span>
                                    )}
                                </label>
                                <select
                                    value={formData.poseur_id}
                                    onChange={(e) => setFormData({ ...formData, poseur_id: e.target.value })}
                                    className={`input-field ${formData.type === 'fourniture' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={formData.type === 'fourniture'}
                                >
                                    <option value="">Non attribué</option>
                                    {poseurs.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.first_name} {u.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Annuler
                        </button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading
                                ? 'Enregistrement...'
                                : editingChantier
                                    ? 'Enregistrer'
                                    : 'Créer le chantier'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Address Selector Modal */}
            <AddressSelectorModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSelect={(address, coords) => {
                    setFormData({
                        ...formData,
                        adresse_livraison: address,
                        adresse_livraison_latitude: coords?.lat ?? null,
                        adresse_livraison_longitude: coords?.lng ?? null,
                    });
                }}
                initialAddress={formData.adresse_livraison}
            />

            {/* Create Contact Modal */}
            <CreateContactModal
                isOpen={showCreateContactModal}
                onClose={() => {
                    setShowCreateContactModal(false);
                    setPendingClientName('');
                }}
                onSuccess={(newClient) => {
                    setClients([...clients, newClient]);
                    setFormData({ ...formData, client_id: newClient.id });
                    setClientSearch(newClient.nom + (newClient.entreprise ? ` (${newClient.entreprise})` : ''));
                    setShowCreateContactModal(false);
                    setPendingClientName('');
                }}
                initialName={pendingClientName}
            />
        </div>
    );
}
