import { useState, useEffect, FormEvent } from 'react';
import { X, User, Phone, Mail, Building2, MapPin, Briefcase } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/database.types';

interface CreateContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newClient: Tables<'clients'>) => void;
    initialName?: string;
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

    const [formData, setFormData] = useState({
        nom: initialName,
        email: '',
        telephone: '',
        adresse: '',
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
                entreprise: '',
                job: '',
                client_categorie: 'contact_client',
            });
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.nom.trim()) return;

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
        <div className="modal-backdrop" onClick={onClose}>
            <div
                className="glass-card w-full max-w-lg p-6 animate-fadeIn"
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Nom */}
                        <div className="col-span-2">
                            <label className="input-label flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Nom *
                            </label>
                            <input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                className="input-field"
                                placeholder="Nom du contact"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="input-label flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field"
                                placeholder="email@exemple.com"
                            />
                        </div>

                        {/* Téléphone */}
                        <div>
                            <label className="input-label flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Téléphone
                            </label>
                            <input
                                type="tel"
                                value={formData.telephone}
                                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                                className="input-field"
                                placeholder="06 12 34 56 78"
                            />
                        </div>

                        {/* Entreprise */}
                        <div>
                            <label className="input-label flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Entreprise
                            </label>
                            <input
                                type="text"
                                value={formData.entreprise}
                                onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                                className="input-field"
                                placeholder="Nom de l'entreprise"
                            />
                        </div>

                        {/* Fonction */}
                        <div>
                            <label className="input-label flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Fonction
                            </label>
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

                        {/* Adresse */}
                        <div className="col-span-2">
                            <label className="input-label flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Adresse
                            </label>
                            <input
                                type="text"
                                value={formData.adresse}
                                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                className="input-field"
                                placeholder="Adresse complète"
                            />
                        </div>

                        {/* Catégorie */}
                        <div className="col-span-2">
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
    );
}
