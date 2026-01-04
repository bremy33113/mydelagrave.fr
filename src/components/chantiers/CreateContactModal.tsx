import { useState, useEffect, FormEvent } from 'react';
import { X, User, Phone, Mail, Building2, MapPin, Briefcase, Map, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';
import { AddressSelectorModal } from './AddressSelectorModal';
import { useUserRole } from '../../hooks/useUserRole';

interface CreateContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: Tables<'clients'>) => void;
    initialName?: string;
    editingClient?: Tables<'clients'> | null;
}

// Interface for API Adresse Gouv results
interface AddressFeature {
    properties: {
        label: string;
        score: number;
        housenumber?: string;
        street?: string;
        postcode?: string;
        city?: string;
        context?: string;
    };
    geometry: {
        coordinates: [number, number]; // [lon, lat]
    };
}

// Parse a full address to extract only street, postal code, and city
function parseAddress(fullAddress: string): string {
    // Nominatim format: "123 Rue Example, 44000 Nantes, Loire-Atlantique, Pays de la Loire, France"
    const parts = fullAddress.split(',').map(p => p.trim());

    if (parts.length >= 2) {
        // Try to find postal code + city pattern
        const streetPart = parts[0]; // "123 Rue Example"

        // Look for postal code (5 digits in France)
        for (let i = 1; i < parts.length; i++) {
            const postalMatch = parts[i].match(/(\d{5})\s*(.+)/);
            if (postalMatch) {
                return `${streetPart}, ${postalMatch[1]} ${postalMatch[2]}`;
            }
        }

        // If no postal code found, take first two parts
        return `${parts[0]}, ${parts[1]}`;
    }

    return fullAddress;
}

export function CreateContactModal({
    isOpen,
    onClose,
    onSuccess,
    initialName = '',
    editingClient = null,
}: CreateContactModalProps) {
    const { userId } = useUserRole();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Tables<'ref_clients'>[]>([]);
    const [jobs, setJobs] = useState<Tables<'ref_job'>[]>([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | undefined>();

    // Address Autocomplete State
    const [addressSuggestions, setAddressSuggestions] = useState<AddressFeature[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);

    const [formData, setFormData] = useState({
        nom: initialName,
        email: '',
        telephone: '',
        adresse: '',
        batiment: '',
        entreprise: '',
        job: '',
        client_categorie: 'contact_client',
    });

    const isEditing = !!editingClient;

    useEffect(() => {
        if (isOpen) {
            fetchRefs();
            if (editingClient) {
                setFormData({
                    nom: editingClient.nom || '',
                    email: editingClient.email || '',
                    telephone: editingClient.telephone || '',
                    adresse: editingClient.adresse || '',
                    batiment: editingClient.batiment || '',
                    entreprise: editingClient.entreprise || '',
                    job: editingClient.job || '',
                    client_categorie: editingClient.client_categorie || 'contact_client',
                });
            } else {
                setFormData({
                    nom: initialName,
                    email: '',
                    telephone: '',
                    adresse: '',
                    batiment: '',
                    entreprise: '',
                    job: '',
                    client_categorie: 'contact_client',
                });
            }
            setAddressCoords(undefined);
            setAddressSuggestions([]);
            setShowSuggestions(false);
        }
    }, [isOpen, initialName, editingClient]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchRefs = async () => {
        const [catResult, jobResult] = await Promise.all([
            supabase.from('ref_clients').select('*'),
            supabase.from('ref_job').select('*'),
        ]);
        setCategories((catResult.data as Tables<'ref_clients'>[]) || []);
        setJobs((jobResult.data as Tables<'ref_job'>[]) || []);
    };

    const handleAddressSelect = (address: string, coords?: { lat: number; lng: number }) => {
        const shortAddress = parseAddress(address);
        setFormData({ ...formData, adresse: shortAddress });
        setAddressCoords(coords);
    };

    const searchAddress = async (query: string) => {
        if (query.length < 3) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearchingAddress(true);
        try {
            const response = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
            const data = await response.json();
            if (data.features) {
                setAddressSuggestions(data.features);
                setShowSuggestions(true);
            }
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
        } finally {
            setIsSearchingAddress(false);
        }
    };

    const selectAddressSuggestion = (feature: AddressFeature) => {
        setFormData({ ...formData, adresse: feature.properties.label });
        setAddressCoords({
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0]
        });
        setShowSuggestions(false);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.entreprise.trim()) {
            alert('L\'entreprise est obligatoire');
            return;
        }

        setLoading(true);

        try {
            if (isEditing && editingClient) {
                const { data } = await supabase
                    .from('clients')
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    } as Record<string, unknown>)
                    .eq('id', editingClient.id)
                    .select()
                    .single();

                if (data) {
                    onSuccess(data as Tables<'clients'>);
                    onClose();
                }
            } else {
                const { data } = await supabase
                    .from('clients')
                    .insert([{ ...formData, created_by: userId, deleted_at: null }] as Record<string, unknown>[])
                    .select()
                    .single();

                if (data) {
                    onSuccess(data as Tables<'clients'>);
                    onClose();
                }
            }
        } catch (err) {
            alert('Erreur lors de la sauvegarde: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop">
                <div
                    className="glass-card w-full max-w-2xl max-h-[90vh] overflow-auto p-6 animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                                <User className="w-5 h-5 text-green-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">{isEditing ? 'Modifier le contact' : 'Nouveau contact'}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Row 1: Entreprise + Nom */}
                            <div>
                                <label className="input-label"><Building2 className="w-4 h-4 inline mr-1 opacity-70" />Entreprise *</label>
                                <input
                                    type="text"
                                    value={formData.entreprise}
                                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                                    className="input-field"
                                    placeholder="Nom de l'entreprise"
                                    required
                                    autoFocus
                                    data-testid="contact-entreprise-input"
                                />
                            </div>
                            <div>
                                <label className="input-label"><User className="w-4 h-4 inline mr-1 opacity-70" />Nom</label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="input-field"
                                    placeholder="Nom du contact"
                                    data-testid="contact-nom-input"
                                />
                            </div>

                            {/* Row 2: Email + Téléphone */}
                            <div>
                                <label className="input-label"><Mail className="w-4 h-4 inline mr-1 opacity-70" />Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                    placeholder="email@exemple.com"
                                    data-testid="contact-email-input"
                                />
                            </div>
                            <div>
                                <label className="input-label"><Phone className="w-4 h-4 inline mr-1 opacity-70" />Téléphone</label>
                                <input
                                    type="tel"
                                    value={formData.telephone}
                                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                    className="input-field"
                                    placeholder="06 12 34 56 78"
                                    data-testid="contact-telephone-input"
                                />
                            </div>

                            {/* Row 3: Fonction + Catégorie */}
                            <div>
                                <label className="input-label"><Briefcase className="w-4 h-4 inline mr-1 opacity-70" />Fonction</label>
                                <select
                                    value={formData.job}
                                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                                    className="input-field"
                                    data-testid="contact-job-select"
                                >
                                    <option value="">Sélectionner...</option>
                                    {jobs.map((job) => (
                                        <option key={job.code} value={job.code}>
                                            {job.icon} {job.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label">Catégorie</label>
                                <select
                                    value={formData.client_categorie}
                                    onChange={(e) => setFormData({ ...formData, client_categorie: e.target.value })}
                                    className="input-field"
                                    data-testid="contact-categorie-select"
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.code} value={cat.code}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 4: Bâtiment (full width) */}
                            <div className="col-span-2">
                                <label className="input-label"><Building2 className="w-4 h-4 inline mr-1 opacity-70" />Bâtiment / Complément</label>
                                <textarea
                                    value={formData.batiment}
                                    onChange={(e) => setFormData({ ...formData, batiment: e.target.value })}
                                    className="input-field resize-none"
                                    rows={2}
                                    placeholder="Bâtiment, étage, code d'accès..."
                                />
                            </div>

                            {/* Row 5: Adresse (full width) + bouton carte */}
                            <div className="col-span-2 relative">
                                <label className="input-label"><MapPin className="w-4 h-4 inline mr-1 opacity-70" />Adresse</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={formData.adresse}
                                            onChange={(e) => {
                                                setFormData({ ...formData, adresse: e.target.value });
                                                searchAddress(e.target.value);
                                            }}
                                            onFocus={() => {
                                                if (formData.adresse.length > 3) setShowSuggestions(true);
                                            }}
                                            className="input-field w-full"
                                            placeholder="Ex: 1 Place Alexis-Ricordeau, 44093 Nantes"
                                        />
                                        {isSearchingAddress && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                            </div>
                                        )}

                                        {/* Suggestions Dropdown */}
                                        {showSuggestions && addressSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-48 overflow-auto">
                                                {addressSuggestions.map((suggestion, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors text-sm text-slate-200 border-b border-slate-700/50 last:border-0"
                                                        onClick={() => selectAddressSuggestion(suggestion)}
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
                                        className="btn-secondary px-3 flex-shrink-0"
                                        title="Sélectionner sur la carte"
                                    >
                                        <Map className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                            <button type="button" onClick={onClose} className="btn-secondary" data-testid="contact-cancel-btn">
                                Annuler
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary" data-testid="contact-submit-btn">
                                {loading ? (isEditing ? 'Enregistrement...' : 'Création...') : (isEditing ? 'Enregistrer' : 'Créer le contact')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Address Selector Modal - same as delivery address */}
            <AddressSelectorModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onSelect={handleAddressSelect}
                initialAddress={formData.adresse}
                initialCoords={addressCoords}
            />
        </>
    );
}
