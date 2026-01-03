import { useState, useEffect, FormEvent } from 'react';
import { X, User, Phone, Mail, Building2, MapPin, Briefcase, Map, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';
import { AddressSelectorModal } from './AddressSelectorModal';

interface CreateContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newClient: Tables<'clients'>) => void;
    initialName?: string;
}

interface AddressResult {
    display_name: string;
    lat: string;
    lon: string;
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
}: CreateContactModalProps) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Tables<'ref_clients'>[]>([]);
    const [jobs, setJobs] = useState<Tables<'ref_job'>[]>([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | undefined>();
    const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
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

    useEffect(() => {
        if (isOpen) {
            fetchRefs();
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
            setAddressCoords(undefined);
            setAddressResults([]);
        }
    }, [isOpen, initialName]);

    const fetchRefs = async () => {
        const [catResult, jobResult] = await Promise.all([
            supabase.from('ref_clients').select('*'),
            supabase.from('ref_job').select('*'),
        ]);
        setCategories((catResult.data as Tables<'ref_clients'>[]) || []);
        setJobs((jobResult.data as Tables<'ref_job'>[]) || []);
    };

    // Search addresses with Nominatim API
    const searchAddress = async (query: string) => {
        setFormData(prev => ({ ...prev, adresse: query }));

        if (query.length < 3) {
            setAddressResults([]);
            return;
        }

        setIsSearchingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=fr`
            );
            const data: AddressResult[] = await response.json();
            setAddressResults(data);
        } catch {
            setAddressResults([]);
        } finally {
            setIsSearchingAddress(false);
        }
    };

    // Select an address from suggestions
    const selectAddressSuggestion = (result: AddressResult) => {
        const shortAddress = parseAddress(result.display_name);
        setFormData({ ...formData, adresse: shortAddress });
        setAddressCoords({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        setAddressResults([]);
    };

    const handleAddressSelect = (address: string, coords?: { lat: number; lng: number }) => {
        const shortAddress = parseAddress(address);
        setFormData({ ...formData, adresse: shortAddress });
        setAddressCoords(coords);
        setAddressResults([]);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.entreprise.trim()) {
            alert('L\'entreprise est obligatoire');
            return;
        }

        setLoading(true);
        try {
            const { data } = await supabase
                .from('clients')
                .insert([{ ...formData, deleted_at: null }])
                .select()
                .single();

            if (data) {
                onSuccess(data as Tables<'clients'>);
                onClose();
            }
        } catch (err) {
            alert('Erreur lors de la création: ' + (err as Error).message);
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
                            <h2 className="text-xl font-bold text-white">Nouveau contact</h2>
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
                                />
                            </div>

                            {/* Row 3: Fonction + Catégorie */}
                            <div>
                                <label className="input-label"><Briefcase className="w-4 h-4 inline mr-1 opacity-70" />Fonction</label>
                                <select
                                    value={formData.job}
                                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                                    className="input-field"
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
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.code} value={cat.code}>
                                            {cat.icon} {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 4: Adresse (full width) */}
                            <div className="col-span-2 relative">
                                <label className="input-label"><MapPin className="w-4 h-4 inline mr-1 opacity-70" />Adresse</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            value={formData.adresse}
                                            onChange={(e) => searchAddress(e.target.value)}
                                            className="input-field w-full"
                                            style={{ paddingLeft: '2.5rem' }}
                                            placeholder="Tapez une adresse..."
                                        />
                                        {isSearchingAddress && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}

                                        {/* Suggestions dropdown */}
                                        {addressResults.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 max-h-48 overflow-auto rounded-lg bg-slate-800 border border-slate-600 shadow-xl">
                                                {addressResults.map((result, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => selectAddressSuggestion(result)}
                                                        className="w-full text-left px-3 py-2 hover:bg-slate-700/50 text-sm text-white border-b border-slate-700/30 last:border-0"
                                                    >
                                                        <p className="line-clamp-2">{result.display_name}</p>
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

                            {/* Row 5: Bâtiment (full width) */}
                            <div className="col-span-2">
                                <label className="input-label"><Building2 className="w-4 h-4 inline mr-1 opacity-70" />Bâtiment / Complément</label>
                                <input
                                    type="text"
                                    value={formData.batiment}
                                    onChange={(e) => setFormData({ ...formData, batiment: e.target.value })}
                                    className="input-field"
                                    placeholder="Bâtiment, étage, code d'accès..."
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
                            <button type="button" onClick={onClose} className="btn-secondary">
                                Annuler
                            </button>
                            <button type="submit" disabled={loading} className="btn-primary">
                                {loading ? 'Création...' : 'Créer le contact'}
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
