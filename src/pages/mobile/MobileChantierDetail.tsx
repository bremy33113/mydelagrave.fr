import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MobileLayout } from '../../components/mobile/MobileLayout';
import { MobileGlassCard } from '../../components/mobile/MobileGlassCard';
import { MobileStatusBadge, getCategoryGradient, getCategoryIcon } from '../../components/mobile/MobileStatusBadge';
import { MobilePdfViewer } from '../../components/mobile/MobilePdfViewer';
import { supabase } from '../../lib/supabase';
import {
    Navigation,
    FileText,
    MapPin,
    Truck,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Camera,
    Clock,
    User,
    Phone,
    FileImage,
    Download,
    Eye
} from 'lucide-react';

interface Chantier {
    id: string;
    nom: string;
    reference: string | null;
    adresse_livraison: string | null;
    adresse_livraison_latitude: number | null;
    adresse_livraison_longitude: number | null;
    statut: string;
    categorie: string | null;
    client: {
        nom: string;
        telephone: string | null;
        adresse: string | null;
    } | null;
}

interface Reserve {
    id: string;
    localisation: string | null;
    contenu: string | null;
    statut_reserve: 'ouverte' | 'en_cours' | 'levee' | 'rejetee';
    photo_1_url: string | null;
    photo_2_url: string | null;
    created_at: string;
    created_by: string | null;
    creator?: { first_name: string; last_name: string } | null;
}

interface Phase {
    id: string;
    groupe_phase: number;
    numero_phase: number;
    libelle: string | null;
    date_debut: string;
    heure_debut: string;
    heure_fin: string;
}

interface Document {
    id: string;
    nom: string;
    description: string | null;
    storage_path: string;
    mime_type: string;
    file_size: number;
    created_at: string;
}

const RESERVE_STATUS_LABELS: Record<string, string> = {
    ouverte: 'Ouverte',
    en_cours: 'En cours',
    levee: 'Levée',
    rejetee: 'Rejetée'
};

const RESERVE_STATUS_COLORS: Record<string, string> = {
    ouverte: 'bg-rose-500',
    en_cours: 'bg-amber-500',
    levee: 'bg-emerald-500',
    rejetee: 'bg-slate-500'
};

export function MobileChantierDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [chantier, setChantier] = useState<Chantier | null>(null);
    const [reserves, setReserves] = useState<Reserve[]>([]);
    const [phases, setPhases] = useState<Phase[]>([]);
    const [plans, setPlans] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedReserve, setExpandedReserve] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pdfViewer, setPdfViewer] = useState<{ url: string; fileName: string } | null>(null);

    const fetchChantier = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            // Charger le chantier
            const { data: chantierData, error: chantierError } = await supabase
                .from('chantiers')
                .select(`
                    id,
                    nom,
                    reference,
                    adresse_livraison,
                    adresse_livraison_latitude,
                    adresse_livraison_longitude,
                    statut,
                    categorie,
                    client:client_id(nom, telephone, adresse)
                `)
                .eq('id', id)
                .single();

            if (chantierError) throw chantierError;
            setChantier(chantierData as Chantier);

            // Charger les réserves
            const { data: reservesData } = await supabase
                .from('notes_chantiers')
                .select(`
                    id,
                    localisation,
                    contenu,
                    statut_reserve,
                    photo_1_url,
                    photo_2_url,
                    created_at,
                    created_by,
                    creator:created_by(first_name, last_name)
                `)
                .eq('chantier_id', id)
                .eq('type', 'reserve')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setReserves((reservesData as Reserve[]) || []);

            // Charger les phases du jour
            const today = new Date().toISOString().split('T')[0];
            const { data: phasesData } = await supabase
                .from('phases_chantiers')
                .select('id, groupe_phase, numero_phase, libelle, date_debut, heure_debut, heure_fin')
                .eq('chantier_id', id)
                .gte('date_debut', today)
                .order('date_debut', { ascending: true })
                .limit(3);

            setPhases((phasesData as Phase[]) || []);

            // Charger les documents de type "plan"
            const { data: plansData } = await supabase
                .from('documents_chantiers')
                .select('id, nom, description, storage_path, mime_type, file_size, created_at')
                .eq('chantier_id', id)
                .eq('type', 'plan')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            setPlans((plansData as Document[]) || []);

        } catch (err) {
            console.error('Erreur chargement chantier:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchChantier();
    }, [fetchChantier]);

    const openGPS = () => {
        if (!chantier) return;
        if (chantier.adresse_livraison_latitude && chantier.adresse_livraison_longitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${chantier.adresse_livraison_latitude},${chantier.adresse_livraison_longitude}`,
                '_blank'
            );
        } else if (chantier.adresse_livraison) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(chantier.adresse_livraison)}`,
                '_blank'
            );
        }
    };

    const callClient = () => {
        if (chantier?.client?.telephone) {
            window.location.href = `tel:${chantier.client.telephone}`;
        }
    };

    const openRapportForm = () => {
        navigate(`/m/chantier/${id}/rapport`);
    };

    const openReserveForm = () => {
        navigate(`/m/chantier/${id}/reserve`);
    };

    const toggleReserve = (reserveId: string) => {
        setExpandedReserve(expandedReserve === reserveId ? null : reserveId);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handlePreviewDocument = async (doc: Document) => {
        try {
            const { data } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storage_path, 3600);

            if (data?.signedUrl) {
                if (doc.mime_type.startsWith('image/')) {
                    // Images: preview plein écran
                    setPreviewUrl(data.signedUrl);
                } else if (doc.mime_type === 'application/pdf') {
                    // PDFs: viewer avec gestures
                    setPdfViewer({ url: data.signedUrl, fileName: doc.nom });
                } else {
                    // Autres: ouvrir dans un nouvel onglet
                    window.open(data.signedUrl, '_blank');
                }
            }
        } catch (err) {
            console.error('Erreur preview:', err);
        }
    };

    const handleDownloadDocument = async (doc: Document) => {
        try {
            const { data } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.storage_path, 3600);

            if (data?.signedUrl) {
                const link = document.createElement('a');
                link.href = data.signedUrl;
                link.download = doc.nom;
                link.click();
            }
        } catch (err) {
            console.error('Erreur téléchargement:', err);
        }
    };

    const reservesOuvertes = reserves.filter(r => r.statut_reserve === 'ouverte');

    if (loading) {
        return (
            <MobileLayout title="CHANTIER" showBack>
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </MobileLayout>
        );
    }

    if (!chantier) {
        return (
            <MobileLayout title="CHANTIER" showBack>
                <div className="p-4">
                    <MobileGlassCard className="p-8 text-center">
                        <p className="text-slate-400">Chantier introuvable</p>
                    </MobileGlassCard>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            title="CHANTIER"
            subtitle={chantier.reference || undefined}
            showBack
            showBottomNav
        >
            <div className="p-4 space-y-4">
                {/* Header Chantier */}
                <MobileGlassCard className="p-4">
                    <div className="flex gap-3">
                        {/* Icône catégorie */}
                        <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0"
                            style={{ background: getCategoryGradient(chantier.categorie) }}
                        >
                            {getCategoryIcon(chantier.categorie)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-white text-lg leading-tight">
                                {chantier.nom}
                            </h1>
                            {chantier.client?.nom && (
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {chantier.client.nom}
                                </p>
                            )}
                            <div className="mt-2">
                                <MobileStatusBadge status={chantier.statut} />
                            </div>
                        </div>
                    </div>
                </MobileGlassCard>

                {/* Boutons Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={openGPS}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-sky-500/20 text-sky-400 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform"
                    >
                        <Navigation size={18} />
                        GPS Site
                    </button>
                    <button
                        onClick={openRapportForm}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/20 text-emerald-400 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform"
                    >
                        <FileText size={18} />
                        Rapport
                    </button>
                </div>

                {/* Section Localisation */}
                <MobileGlassCard className="p-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                        Localisation & Contact
                    </h2>

                    {/* Adresse chantier */}
                    {chantier.adresse_livraison && (
                        <div className="flex gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                                <MapPin size={16} className="text-sky-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Chantier</p>
                                <p className="text-sm text-white">{chantier.adresse_livraison}</p>
                            </div>
                        </div>
                    )}

                    {/* Adresse livraison (si différente du client) */}
                    {chantier.client?.adresse && chantier.client.adresse !== chantier.adresse_livraison && (
                        <div className="flex gap-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Truck size={16} className="text-amber-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Client</p>
                                <p className="text-sm text-white">{chantier.client.adresse}</p>
                            </div>
                        </div>
                    )}

                    {/* Téléphone client */}
                    {chantier.client?.telephone && (
                        <button
                            onClick={callClient}
                            className="flex gap-3 w-full text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <Phone size={16} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">Contact</p>
                                <p className="text-sm text-emerald-400">{chantier.client.telephone}</p>
                            </div>
                        </button>
                    )}
                </MobileGlassCard>

                {/* Phases à venir */}
                {phases.length > 0 && (
                    <MobileGlassCard className="p-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            Prochaines interventions
                        </h2>
                        <div className="space-y-2">
                            {phases.map(phase => (
                                <div key={phase.id} className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                        <Clock size={14} className="text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-white">
                                            {phase.libelle || `Phase ${phase.groupe_phase}.${phase.numero_phase}`}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {new Date(phase.date_debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            {' • '}
                                            {phase.heure_debut.substring(0, 5)}-{phase.heure_fin.substring(0, 5)}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                                        {phase.groupe_phase}.{phase.numero_phase}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </MobileGlassCard>
                )}

                {/* Section Plans */}
                {plans.length > 0 && (
                    <MobileGlassCard className="p-4">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                            Plans ({plans.length})
                        </h2>
                        <div className="space-y-2">
                            {plans.map(doc => (
                                <div
                                    key={doc.id}
                                    className="flex items-center gap-3 py-2 px-3 bg-slate-800/50 rounded-xl"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <FileImage size={18} className="text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-white truncate">
                                            {doc.nom}
                                        </p>
                                        <p className="text-[10px] text-slate-500">
                                            {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handlePreviewDocument(doc)}
                                            className="p-2 bg-slate-700/50 rounded-lg active:scale-95 transition-transform"
                                            title="Voir"
                                        >
                                            <Eye size={16} className="text-sky-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDownloadDocument(doc)}
                                            className="p-2 bg-slate-700/50 rounded-lg active:scale-95 transition-transform"
                                            title="Télécharger"
                                        >
                                            <Download size={16} className="text-emerald-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </MobileGlassCard>
                )}

                {/* Section Réserves */}
                <MobileGlassCard className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                Réserves
                            </h2>
                            {reservesOuvertes.length > 0 && (
                                <span className="flex items-center gap-1 text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full">
                                    <AlertTriangle size={10} />
                                    <span className="text-[10px] font-bold">{reservesOuvertes.length}</span>
                                </span>
                            )}
                        </div>
                        <button
                            onClick={openReserveForm}
                            className="text-[10px] font-black uppercase tracking-widest text-sky-400"
                        >
                            + Ajouter
                        </button>
                    </div>

                    {reserves.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                            Aucune réserve signalée
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {reserves.map(reserve => (
                                <div
                                    key={reserve.id}
                                    className="bg-slate-800/50 rounded-xl overflow-hidden"
                                >
                                    {/* Header réserve (cliquable) */}
                                    <button
                                        onClick={() => toggleReserve(reserve.id)}
                                        className="w-full flex items-center gap-3 p-3"
                                    >
                                        <span className={`w-2 h-2 rounded-full ${RESERVE_STATUS_COLORS[reserve.statut_reserve]}`} />
                                        <div className="flex-1 text-left">
                                            <p className="text-xs font-bold text-white uppercase">
                                                {reserve.localisation || 'Non localisée'}
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                {RESERVE_STATUS_LABELS[reserve.statut_reserve]} • {formatDate(reserve.created_at)}
                                            </p>
                                        </div>
                                        {(reserve.photo_1_url || reserve.photo_2_url) && (
                                            <Camera size={14} className="text-slate-500" />
                                        )}
                                        {expandedReserve === reserve.id ? (
                                            <ChevronUp size={16} className="text-slate-500" />
                                        ) : (
                                            <ChevronDown size={16} className="text-slate-500" />
                                        )}
                                    </button>

                                    {/* Contenu expandé */}
                                    {expandedReserve === reserve.id && (
                                        <div className="px-3 pb-3 pt-0 border-t border-slate-700/50">
                                            {/* Description */}
                                            {reserve.contenu && (
                                                <p className="text-sm text-slate-300 mt-3 mb-3">
                                                    {reserve.contenu}
                                                </p>
                                            )}

                                            {/* Photos */}
                                            {(reserve.photo_1_url || reserve.photo_2_url) && (
                                                <div className="flex gap-2 mb-3">
                                                    {reserve.photo_1_url && (
                                                        <img
                                                            src={reserve.photo_1_url}
                                                            alt="Photo 1"
                                                            className="w-20 h-20 object-cover rounded-lg"
                                                        />
                                                    )}
                                                    {reserve.photo_2_url && (
                                                        <img
                                                            src={reserve.photo_2_url}
                                                            alt="Photo 2"
                                                            className="w-20 h-20 object-cover rounded-lg"
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Créateur */}
                                            {reserve.creator && (
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                    <User size={10} />
                                                    <span>
                                                        Signalée par {reserve.creator.first_name} {reserve.creator.last_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </MobileGlassCard>
            </div>

            {/* Modal Preview Image */}
            {previewUrl && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setPreviewUrl(null)}
                >
                    <button
                        onClick={() => setPreviewUrl(null)}
                        className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-full text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {/* PDF Viewer */}
            {pdfViewer && (
                <MobilePdfViewer
                    url={pdfViewer.url}
                    fileName={pdfViewer.fileName}
                    onClose={() => setPdfViewer(null)}
                />
            )}
        </MobileLayout>
    );
}
